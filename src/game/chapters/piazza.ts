import { BASE_NOTCHES, NOTCH_PRICES } from '../../content/items';
import { LEVEL_ORDER, LEVELS, TOTAL_FRAGMENTS } from '../../content/levels';
import { QUESTS } from '../../content/quests';
import { TILE } from '../../config';
import { bus } from '../../engine/events';
import { sfx } from '../../engine/sfx';
import { state } from '../../engine/state';
import type { DialogueLine } from '../../types';
import { loadRegion } from '../../world/registry';
import { Chapter } from './ChapterScript';
import { rng } from '../../engine/rng';

/** l'hub: chi torna in piazza, la bottega, la bacheca, l'oracolo e il bar */
export class PiazzaChapter extends Chapter {
    populate(): void {
        this.spawnPiazzaGuests();
    }

    interact(id: string): boolean {
        switch (id) {
            case 'romero-piazza':
                this.interactRomeroPiazza();
                return true;
            case 'oracolo-mappa':
                this.ctx.dialogues.start(id, () => this.ctx.dialogues.lines(this.oracleLines()));
                return true;
            case 'bottega-wavezon':
                this.ctx.dialogues.start(id, () => this.openPiazzaShop());
                return true;
            case 'bacheca-missioni':
                this.ctx.dialogues.start(id, () => this.ctx.dialogues.lines(this.boardLines()));
                return true;
            case 'samatt-bar':
                this.ctx.dialogues.start(id, () => this.ctx.dialogues.lines(this.barRumors()));
                return true;
            case 'markolino-piazza': {
                const n = state.abilities.length;
                // l'acqua tossica è opzionale: sette frammenti bastano per il finale
                this.ctx.dialogues.start(n >= 7 ? 'markolino-piazza-fine' : n >= 4 ? 'markolino-piazza-dopo' : id);
                return true;
            }
            default:
                return false;
        }
    }

    /** chi torna in piazza dipende da cosa hai scelto per strada */
    private spawnPiazzaGuests(): void {
        const feet = 26 * TILE + TILE / 2;
        if (state.hasFlag('notino-a-casa')) {
            this.ctx.npcs.spawn('mamma-notino-piazza', 116 * TILE, feet);
            this.ctx.npcs.spawn('notino-piazza', 119 * TILE + 8, feet);
        }
        if (state.hasFlag('ospite-12-libero')) this.ctx.npcs.spawn('ospite-12-piazza', 58 * TILE, feet);
        if (state.hasFlag('caso-risolto')) this.ctx.npcs.spawn('romero-piazza', 18 * TILE, feet);
    }

    private interactRomeroPiazza(): void {
        if (state.hasFlag('caffe-romero')) {
            this.ctx.dialogues.start('romero-caffe-dopo');
            return;
        }
        this.ctx.dialogues.start('romero-piazza', () => {
            if (!state.save.collectedLore.includes('nota-caso-1')) return;
            bus.emit('choice-show', {
                title: 'ti ricordi un biglietto sulla sua scrivania. il bar è a due passi.',
                options: [{ label: 'offrigli un caffè, con lo zucchero' }, { label: 'lascialo stare' }],
                onPick: (i) => {
                    if (i !== 0) return;
                    state.setFlag('caffe-romero');
                    this.ctx.dialogues.start('romero-caffe');
                },
            });
        });
    }

    /** l'oracolo legge quanto hai esplorato di ogni regione vista */
    private oracleLines(): DialogueLine[] {
        const say = (text: string): DialogueLine => ({ speaker: 'l\'oracolo delle mappe', color: 'cyan', text });
        const rows: string[] = [];
        let worst: { name: string; pct: number } | null = null;
        for (const id of [...LEVEL_ORDER, ...Object.keys(LEVELS).filter((k) => !LEVEL_ORDER.includes(k) && !LEVELS[k].hub)]) {
            if (!state.hasFlag(`visto-${id}`)) continue;
            const rooms = loadRegion(this.scene, id)?.layout.rooms.length;
            if (!rooms) continue;
            const pct = Math.min(100, Math.round(((state.save.explored[id]?.length ?? 0) / rooms) * 100));
            rows.push(`${LEVELS[id].accentWord} ${pct}%`);
            if (pct < 100 && (!worst || pct < worst.pct)) worst = { name: LEVELS[id].accentWord, pct };
        }
        if (!rows.length) return [say('non hai visto niente. torna quando avrai almeno sbagliato strada una volta.')];
        const out = [say(`le tue mappe: ${rows.join(' · ')}.`)];
        out.push(worst
            ? say(`${worst.name} ti nasconde ancora parecchio. le stanze che non vedi sono quelle che ti guardano.`)
            : say('hai visto tutto quello che c\'era da vedere. adesso sei tu la mappa. inquietante, eh?'));
        return out;
    }

    /** la bacheca: le commissioni prese e quelle da riscuotere */
    private boardLines(): DialogueLine[] {
        const say = (text: string): DialogueLine => ({ speaker: 'bacheca delle commissioni', color: 'yellow', text });
        const open = QUESTS.filter((q) => state.save.quests[q.id] && state.save.quests[q.id].s !== 'fatta');
        const done = QUESTS.filter((q) => state.save.quests[q.id]?.s === 'fatta').length;
        const lines = [say(`commissioni chiuse: ${done} su ${QUESTS.length}.`)];
        for (const q of open.slice(0, 4)) {
            const st = state.save.quests[q.id];
            lines.push(say(`${st.s === 'pronta' ? '✓ da riscuotere' : '· in corso'}: "${q.title}" (${LEVELS[q.region]?.accentWord ?? q.region}).`));
        }
        const fresh = QUESTS.filter((q) => !state.save.quests[q.id] && state.hasFlag(`visto-${q.region}`));
        if (fresh.length) lines.push(say(`qualcuno chiede aiuto anche a ${[...new Set(fresh.map((q) => LEVELS[q.region]?.accentWord ?? q.region))].slice(0, 3).join(', ')}. cerca chi ha il punto esclamativo in testa.`));
        else if (!open.length) lines.push(say('nessuna richiesta aperta. il realm per una volta non ha bisogno di te. godetela.'));
        return lines;
    }

    /** il bar: voci vere, calcolate su quello che ti manca */
    private barRumors(): DialogueLine[] {
        const say = (text: string): DialogueLine => ({ speaker: 'samatt', color: 'yellow', text });
        const pool: string[] = [];
        const missing = TOTAL_FRAGMENTS - state.abilities.length;
        if (missing > 0) pool.push(`dicono che in giro ci siano ancora ${missing} frammenti della wave. uno lo tiene sempre il più grosso della zona, ovvio.`);
        if (!state.hasAbility('aggrappo')) pool.push('al rio c\'è una formica enorme che si arrampica sui muri. se la batti, magari ti insegna. o ti mangia.');
        if (!state.hasFlag('tommasorveglianza')) pool.push('ticummi vende una cosa chiamata tommasorveglianza. io non la comprerei. tu sì, scommetto.');
        if (state.save.notches < 6) pool.push('la bottega qui accanto vende tacche per gli amuleti. care, ma le tacche non si mangiano, durano.');
        const lore = state.save.collectedLore.filter((k) => k.startsWith('lore-')).length;
        if (lore < 30) pool.push('sui tetti della piazza ci sono scritte vecchie. nessuno sale a leggerle. tu hai le gambe da geco, no?');
        pool.push('il microfono della fontana salva come gli altri. ma qui almeno muori in compagnia.');
        const arene = state.save.flags.filter((f) => f.startsWith('arena-vinta-')).length;
        if (arene < 5) pool.push(`in ogni regione c'è un microfono rosso in una stanza fuori strada. ci sali e ti chiudono dentro con le bestie. paga bene. ne hai vinti ${arene}.`);
        pool.push('di notte nelle regioni girano bestie più grosse, con l\'aura. lasciano un sacco di barre. e un sacco di vedove.');
        pool.push('guastalla adesso sta seduto lì a guardare il citelis. da fuori. dice che è bellissimo. io ci credo poco.');
        const pick = rng.logic.shuffle([...pool]).slice(0, 2);
        return pick.map(say);
    }

    /** la bottega della piazza: la cura completa e la tacca dopo, le due cose per cui servono le barre */
    private openPiazzaShop(): void {
        const ricarica = 25;
        const bought = state.save.notches - BASE_NOTCHES;
        const tacca = bought < NOTCH_PRICES.length ? NOTCH_PRICES[bought]! : 0;
        bus.emit('choice-show', {
            title: `bottega wavezon · hai ${state.save.barre} barre`,
            options: [{ label: `ricarica completa (${ricarica} barre)` }, { label: tacca ? `una tacca per amuleti (${tacca} barre)` : 'tacche finite: le hai tutte' }, { label: 'solo guardare' }],
            onPick: (i) => {
                const pay = (n: number): boolean => {
                    if (state.save.barre < n) {
                        bus.emit('toast', { text: 'commesso: "senza barre si guarda e basta, campione."' });
                        return false;
                    }
                    state.save.barre -= n;
                    bus.emit('barre-changed', { barre: state.save.barre, gained: false });
                    return true;
                };
                if (i === 0 && pay(ricarica)) {
                    state.run.hp = state.maxHp;
                    state.run.flow = state.maxFlow;
                    bus.emit('hp-changed', { hp: state.run.hp, maxHp: state.maxHp, hurt: false });
                    bus.emit('flow-changed', { flow: state.run.flow, maxFlow: state.maxFlow });
                    sfx.pickup();
                    bus.emit('toast', { text: 'ricaricato. vita e flow al massimo.' });
                } else if (i === 1 && tacca && pay(tacca)) {
                    state.addItem('tacca');
                    sfx.pickup();
                    bus.emit('toast', { text: 'una tacca in più. gli amuleti si cambiano ai microfoni.' });
                }
                state.persist();
            },
        });
    }

}
