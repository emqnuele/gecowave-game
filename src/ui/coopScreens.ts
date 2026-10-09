import { LEVELS } from '../content/levels';
import { skinPreset } from '../content/skins';
import { skinFinalCss } from '../art/playerSkin';
import { sfx } from '../audio/sfx';
import { state, COOP_SAVE_KEY } from '../core/state';
import { coop, readMeta, rememberedCharacter } from '../coop/runtime';
import { characterOf, type Character, type GameInfo } from '../coop/types';
import { normalizeCode, CODE_LENGTH, RoomError, type RoomKind } from '../net/rooms';
import { el } from './dom';
import type { MenuItem, Screens } from './screens';
import './coop.css';

/* le pagine della partita in due: chi ospita sceglie e apre la stanza, chi entra
   porta il suo geco. tutto passa dal runtime del coop, qui si mostra e basta */

/** cosa le pagine chiedono a main */
export interface CoopUiHost {
    /** l'host parte: intro se la partita è nuova, poi il capitolo */
    startHosted(fresh: boolean): void;
    /** si torna al titolo dal coop: il salvataggio torna quello da solo */
    backToTitle(): void;
}

function chapterLabel(levelId: string): string {
    const lv = LEVELS[levelId];
    return lv ? `${lv.title.toLowerCase()} ${lv.accentWord}` : levelId;
}

function playTime(ms: number): string {
    const min = Math.floor(ms / 60000);
    return min >= 60 ? `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, '0')}m` : `${min}m`;
}

/** il ritratto piccolo di un geco: pallino della pelle e nome */
function gecoTag(c: Character | null, waiting: string): HTMLElement {
    const box = el('div', `cx-slot${c ? '' : ' empty'}`);
    const dot = el('i', 'cx-dot');
    if (c) dot.style.background = skinFinalCss(skinPreset(c.skin));
    const words = el('div', 'cx-words');
    const name = el('span', 'cx-name');
    name.textContent = c ? c.name.toLowerCase() : waiting;
    words.append(name);
    if (c) {
        const s = el('span', 'cx-stats');
        s.textContent = `forza ${c.stats.forza} · costituzione ${c.stats.costituzione} · flusso ${c.stats.flusso}`;
        words.append(s);
    }
    box.append(dot, words);
    return box;
}

export class CoopScreens {
    private readonly ui: Screens;
    private readonly host: CoopUiHost;
    /** in sviluppo le stanze si aprono tra due schede, senza rete */
    private kind: RoomKind = 'online';
    private off: (() => void) | null = null;

    constructor(ui: Screens, host: CoopUiHost) {
        this.ui = ui;
        this.host = host;
    }

    private stopListening(): void {
        this.off?.();
        this.off = null;
    }

    /** la porta del coop dal titolo */
    show(note?: string): void {
        this.stopListening();
        const s = this.ui.openOverlay('screen sx menu-screen');
        const page = el('div', 'sx-page');
        page.append(el('div', 'sx-kick', 'due gechi, un realm'));
        page.append(...this.ui.heading('gioca in due', 'uno ospita la partita, l’altro entra col codice. ognuno porta il suo geco.'));
        const meta = readMeta();
        const hasGame = localStorage.getItem(COOP_SAVE_KEY) !== null && !!meta;
        const items: MenuItem[] = [
            { label: 'ospita una partita', sub: hasGame ? 'continua la tua o creane una nuova' : 'crea la partita e scegli il destino', onPick: () => this.showHostChoice() },
            { label: 'entra in una partita', sub: 'serve il codice di chi ospita', onPick: () => this.showJoin() },
        ];
        if (import.meta.env.DEV) {
            items.push({
                label: this.kind === 'online' ? 'rete: online' : 'rete: due schede',
                sub: 'solo sviluppo: le schede dello stesso browser giocano senza internet',
                small: true,
                onPick: () => {
                    this.kind = this.kind === 'online' ? 'locale' : 'online';
                    this.show();
                },
            });
        }
        items.push({ label: 'torna al titolo', back: true, onPick: () => this.host.backToTitle() });
        page.append(this.ui.menu(items));
        if (note) page.append(this.noteEl(note));
        s.append(page);
        this.ui.bindNav(page, () => this.host.backToTitle());
    }

    private noteEl(text: string): HTMLElement {
        const n = el('div', 'sx-note cx-warn');
        n.textContent = text;
        return n;
    }

    /* ---------- chi ospita ---------- */

    private showHostChoice(): void {
        const meta = readMeta();
        const hasGame = localStorage.getItem(COOP_SAVE_KEY) !== null && !!meta;
        if (!hasGame) {
            this.newHostedGame();
            return;
        }
        // la partita in due salvata si legge senza toccare quella da solo
        state.useSlot('coop');
        const save = state.save;
        state.useSlot('single');
        const s = this.ui.openOverlay('screen sx menu-screen');
        const page = el('div', 'sx-page');
        page.append(el('div', 'sx-kick', 'ospita'));
        page.append(...this.ui.heading('la tua partita in due'));
        const sub = `${save.playerName.toLowerCase()} · ${chapterLabel(save.levelId)} · ${playTime(save.record.playMs)}${meta?.partner ? ` · con ${meta.partner.toLowerCase()}` : ''}${save.doomsdayMode ? ' · doomsday' : ''}`;
        page.append(this.ui.menu([
            { label: 'continua', sub, onPick: () => this.continueHostedGame() },
            { label: 'nuova partita in due', sub: 'quella salvata andrà perduta', danger: true, onPick: () => this.confirmNew() },
            { label: 'indietro', back: true, onPick: () => this.show() },
        ]));
        s.append(page);
        this.ui.bindNav(page, () => this.show());
    }

    private confirmNew(): void {
        const s = this.ui.openOverlay('screen sx menu-screen');
        const page = el('div', 'sx-page');
        page.append(...this.ui.heading('nuova partita in due', 'la partita in due salvata andrà perduta. il tuo viaggio da solo no: quello non si tocca.'));
        page.append(this.ui.menu([
            { label: 'ricomincia in due', danger: true, onPick: () => this.newHostedGame() },
            { label: 'torna indietro', back: true, onPick: () => this.showHostChoice() },
        ]));
        s.append(page);
        this.ui.bindNav(page, () => this.showHostChoice());
    }

    private newHostedGame(): void {
        this.ui.forge({
            back: () => this.show(),
            backLabel: 'indietro',
            kick: 'ospita · il tuo geco',
            kick2: 'ospita · allocazione del flusso',
            fate: true,
            doneLabel: 'apri la partita',
            onDone: (r) => {
                // la partita in due nasce nel suo salvataggio: il viaggio da solo resta dov'è
                state.useSlot('coop');
                state.reset();
                state.save.playerName = r.name;
                state.save.skin = r.skin;
                state.save.stats = { ...r.stats };
                state.save.doomsdayMode = r.doomsday;
                state.save.doomsday = 0;
                state.save.assisted = state.settings.guide;
                state.persist();
                state.flushPersist(true);
                state.resetRun();
                this.openLobby(true);
            },
        });
    }

    private continueHostedGame(): void {
        state.useSlot('coop');
        this.openLobby(false);
    }

    /** la stanza aperta: il codice da dare, chi c'è, e il via */
    private openLobby(fresh: boolean): void {
        this.stopListening();
        const s = this.ui.openOverlay('screen sx menu-screen cx-lobby');
        const page = el('div', 'sx-page');
        page.append(el('div', 'sx-kick', fresh ? 'partita nuova' : 'partita in due'));
        page.append(...this.ui.heading('la stanza'));
        const codeBox = el('button', 'cx-code');
        codeBox.dataset.nav = '1';
        codeBox.textContent = '· · · · ·';
        codeBox.title = 'copia il codice';
        const codeNote = el('div', 'cx-code-note');
        codeNote.textContent = 'apro la stanza…';
        page.append(codeBox, codeNote);

        const facts = el('div', 'cx-facts');
        const fact = (k: string, v: string) => {
            const row = el('div', 'cx-fact');
            const a = el('span', 'k');
            a.textContent = k;
            const b = el('span', 'v');
            b.textContent = v;
            row.append(a, b);
            facts.append(row);
        };
        fact('destino', state.save.doomsdayMode ? 'doomsday' : 'il cammino');
        fact('capitolo', fresh ? 'dall’inizio' : chapterLabel(state.save.levelId));
        if (!fresh) fact('tempo', playTime(state.save.record.playMs));
        if (state.save.assisted) fact('freccia', 'assistita');
        page.append(facts);

        const party = el('div', 'cx-party');
        const paintParty = () => {
            party.replaceChildren(
                gecoTag(characterOf(state.save), ''),
                gecoTag(coop.partner, coop.session?.open ? 'qualcuno sta entrando…' : 'in attesa di un compagno'),
            );
            const p = party.lastElementChild as HTMLElement;
            if (coop.partner) p.classList.add('ready');
        };
        paintParty();
        page.append(party);

        const status = el('div', 'sx-note');
        page.append(status);
        let code = '';
        const startItem: MenuItem = {
            label: 'inizia',
            sub: 'chi deve ancora entrare potrà farlo anche dopo',
            onPick: () => {
                if (!code) return;
                this.stopListening();
                this.host.startHosted(fresh);
            },
        };
        const menu = this.ui.menu([
            startItem,
            { label: 'annulla', back: true, onPick: () => this.leaveLobby() },
        ]);
        page.append(menu);
        s.append(page);
        this.ui.bindNav(page, () => this.leaveLobby());

        const copy = () => {
            if (!code) return;
            sfx.ui();
            void navigator.clipboard?.writeText(code).then(
                () => { codeNote.textContent = 'codice copiato. mandalo a chi gioca con te.'; },
                () => { codeNote.textContent = 'copialo a mano: il browser non mi lascia.'; },
            );
        };
        codeBox.addEventListener('click', copy);

        this.off = coop.listen((e) => {
            if (e.type === 'partner') {
                paintParty();
                status.textContent = e.char ? `${e.char.name.toLowerCase()} ha forgiato il suo geco.` : '';
            } else if (e.type === 'room-lost') {
                status.textContent = 'la stanza non accetta più ingressi. annulla e riaprila.';
            }
        });
        const kind = this.kind;
        coop.host(kind, fresh).then(
            (c) => {
                code = c;
                codeBox.textContent = c.split('').join(' ');
                codeNote.textContent = kind === 'locale' ? 'stanza tra schede: entra dall’altra scheda con questo codice.' : 'dallo a chi gioca con te. clic per copiarlo.';
            },
            (err: unknown) => {
                if (err instanceof Error && err.message === 'annullato') return;
                codeBox.textContent = '— — —';
                codeNote.textContent = err instanceof RoomError ? `${err.message}. controlla la connessione e riprova.` : 'la stanza non si apre. riprova tra poco.';
            },
        );
    }

    private leaveLobby(): void {
        this.stopListening();
        coop.end(null, false);
        state.useSlot('single');
        this.show();
    }

    /* ---------- chi entra ---------- */

    private showJoin(prefill = '', error = ''): void {
        this.stopListening();
        const s = this.ui.openOverlay('screen sx menu-screen');
        const page = el('div', 'sx-page');
        page.append(el('div', 'sx-kick', 'entra'));
        page.append(...this.ui.heading('il codice della stanza', `${CODE_LENGTH} caratteri: te lo dà chi ospita`));
        const input = el('input', 'sx-name-input cx-code-input');
        input.type = 'text';
        input.maxLength = CODE_LENGTH + 4;
        input.placeholder = '·····';
        input.spellcheck = false;
        input.autocomplete = 'off';
        input.value = prefill;
        page.append(input);
        const status = el('div', 'sx-note');
        if (error) {
            status.classList.add('cx-warn');
            status.textContent = error;
        }
        page.append(status);
        let busy = false;
        const go = () => {
            if (busy) return;
            const code = normalizeCode(input.value);
            if (!code) {
                status.classList.add('cx-warn');
                status.textContent = `servono ${CODE_LENGTH} caratteri, senza 0, 1, o, i, l.`;
                return;
            }
            busy = true;
            status.classList.remove('cx-warn');
            status.textContent = 'busso alla porta…';
            coop.join(this.kind, code).then(
                (info) => this.showGuestWelcome(info),
                (err: unknown) => {
                    busy = false;
                    if (err instanceof Error && err.message === 'annullato') return;
                    this.showJoin(code, err instanceof Error ? err.message : 'non riesco a entrare');
                },
            );
        };
        input.addEventListener('keydown', (e) => {
            if (e.code === 'Enter') {
                e.preventDefault();
                sfx.menuSelect();
                go();
            }
        });
        page.append(this.ui.menu([
            { label: 'entra', onPick: go },
            { label: 'indietro', back: true, onPick: () => { coop.end(null, false); this.show(); } },
        ]));
        s.append(page);
        this.ui.bindNav(page, () => { coop.end(null, false); this.show(); });
        setTimeout(() => input.focus(), 120);
    }

    /** chi ospita, com'è la partita, e con chi entri */
    private showGuestWelcome(info: GameInfo): void {
        this.stopListening();
        const s = this.ui.openOverlay('screen sx menu-screen cx-lobby');
        const page = el('div', 'sx-page');
        page.append(el('div', 'sx-kick', 'sei dentro la stanza'));
        const host = info.host;
        page.append(...this.ui.heading(`la partita di ${host.name.toLowerCase()}`));
        const facts = el('div', 'cx-facts');
        const fact = (k: string, v: string) => {
            const row = el('div', 'cx-fact');
            const a = el('span', 'k');
            a.textContent = k;
            const b = el('span', 'v');
            b.textContent = v;
            row.append(a, b);
            facts.append(row);
        };
        fact('destino', info.doomsday ? 'doomsday: il tempo scorre per tutti e due' : 'il cammino');
        fact('capitolo', info.fresh ? 'dall’inizio' : chapterLabel(info.levelId));
        if (!info.fresh) fact('tempo', playTime(info.playMs));
        if (info.assisted) fact('freccia', 'partita assistita');
        page.append(facts);
        const party = el('div', 'cx-party');
        party.append(gecoTag(host, ''));
        page.append(party);
        const known = rememberedCharacter(info.gameId);
        const forgeNew = () => this.guestForge(info, known ?? undefined);
        const items: MenuItem[] = known
            ? [
                { label: `entra come ${known.name.toLowerCase()}`, sub: 'il geco che avevi in questa partita', onPick: () => this.guestReady(known) },
                { label: 'forgia un altro geco', onPick: forgeNew },
            ]
            : [{ label: 'forgia il tuo geco', sub: 'nome, attributi e pelle: come da solo', onPick: forgeNew }];
        items.push({ label: 'esci dalla stanza', back: true, onPick: () => this.leaveAsGuest() });
        page.append(this.ui.menu(items));
        s.append(page);
        this.ui.bindNav(page, () => this.leaveAsGuest());
        this.watchGuest();
    }

    private guestForge(info: GameInfo, initial?: Character): void {
        this.ui.forge({
            back: () => this.showGuestWelcome(info),
            backLabel: 'indietro',
            initial,
            kick: `partita di ${info.host.name.toLowerCase()} · il tuo geco`,
            kick2: `partita di ${info.host.name.toLowerCase()} · allocazione del flusso`,
            note: info.doomsday ? `${info.host.name.toLowerCase()} ha scelto il doomsday: il tempo vero scorre anche per te.` : undefined,
            fate: false,
            doneLabel: 'entra nella partita',
            onDone: (r) => this.guestReady({ name: r.name, stats: r.stats, skin: r.skin }),
        });
        this.watchGuest();
    }

    private guestReady(c: Character): void {
        coop.sendCharacter(c);
        this.stopListening();
        const s = this.ui.openOverlay('screen sx menu-screen cx-lobby');
        const page = el('div', 'sx-page');
        page.append(el('div', 'sx-kick', 'tutto pronto'));
        const name = coop.partner?.name.toLowerCase() ?? 'l’host';
        page.append(...this.ui.heading(coop.info?.playing ? 'entri nel capitolo…' : `aspetti ${name}`, coop.info?.playing ? undefined : `${name} dà il via quando vuole.`));
        const party = el('div', 'cx-party');
        party.append(gecoTag(coop.partner, ''), gecoTag(c, ''));
        (party.lastElementChild as HTMLElement).classList.add('ready');
        page.append(party);
        page.append(this.ui.menu([{ label: 'esci dalla stanza', back: true, onPick: () => this.leaveAsGuest() }]));
        s.append(page);
        this.ui.bindNav(page, () => this.leaveAsGuest());
        this.watchGuest();
    }

    /** la stanza può chiudersi mentre si forgia o si aspetta */
    private watchGuest(): void {
        this.stopListening();
        this.off = coop.listen((e) => {
            if (e.type === 'closed') {
                this.stopListening();
                this.show(e.reason);
            }
        });
    }

    private leaveAsGuest(): void {
        this.stopListening();
        coop.end(null, false);
        this.show();
    }
}
