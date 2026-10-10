import Phaser from 'phaser';
import { bus } from '../../core/events';
import { state } from '../../core/state';
import { unlockAchievement } from '../../core/achievements';
import { ITEMS, NOTCH_PRICES, BASE_NOTCHES } from '../../content/items';
import { healFor } from '../../core/inventory';
import { sfx } from '../../audio/sfx';
import { coop } from '../../coop/runtime';
import { coopHooks } from '../../coop/hooks';
import type { CoopMsgs } from '../../coop/protocol';
import { offWorld, onWorld } from '../../core/worldEvents';
import { flashback } from '../../story/FlashbackManager';
import type { FilmScene } from '../../story/film/FilmScene';
import type { DialogueLine } from '../../types';
import type { NetSession } from '../../net/session';
import type { GameContext } from '../context';
import type { CoopScene } from './CoopScene';

type Actor = 'local' | 'remote';
type ChoiceShow = { title: string; options: { label: string; danger?: boolean }[]; onPick: (i: number) => void };

/* le regole della partita in due.
   dialoghi della trama: li vedono tutti e due, il mondo si ferma per entrambi e il testo lo manda avanti l'host.
   dialoghi aperti da qualcuno: li vede solo lui, il mondo continua, e lui intanto è fermo e intoccabile.
   chi cade guarda l'altro e si rialza al prossimo microfono; se cadono tutti e due si riparte insieme */
export class CoopRules {
    private readonly cs: CoopScene;
    private readonly ctx: GameContext;
    private readonly scene: Phaser.Scene;
    private readonly session: NetSession<CoopMsgs>;
    /** chi sta agendo adesso: quello che apre un dialogo o una scelta lo apre per lui */
    private actor: Actor | null = null;
    private token = 0;
    /** host: i dialoghi e le scelte aperti sullo schermo dell'ospite, con il seguito da fare qui */
    private readonly remoteEnds = new Map<number, () => void>();
    private readonly remotePicks = new Map<number, (i: number) => void>();
    /** ospite: il dialogo condiviso aperto adesso */
    private sharedToken = -1;
    /** host: il tabellone aperto sullo schermo dell'ospite, in attesa della sua fermata */
    private travelToken = 0;
    private readonly offs: (() => void)[] = [];
    /** il mio geco è a terra e guarda l'altro */
    down = false;
    private wiping = false;
    private band: HTMLElement | null = null;
    private interactAt = 0;

    constructor(cs: CoopScene) {
        this.cs = cs;
        this.ctx = cs.ctx;
        this.scene = cs.scene;
        this.session = cs.session;
        const s = this.session;
        this.offs.push(s.on('dlg-open', (m) => this.openFromHost(m)));
        this.offs.push(s.on('dlg-step', (m) => {
            if (m.token === this.sharedToken) bus.emit('dialogue-step', { index: m.index });
        }));
        this.offs.push(s.on('dlg-close', (m) => this.closed(m.token)));
        this.offs.push(s.on('choice-open', (m) => this.choiceFromHost(m)));
        this.offs.push(s.on('choice-pick', (m) => this.picked(m.token, m.index)));
        this.offs.push(s.on('travel-open', (m) => this.travelFromHost(m)));
        this.offs.push(s.on('travel-pick', (m) => this.travelPicked(m.token, m.key)));
        this.offs.push(s.on('quiz-gone', (m) => {
            if (!coop.isGuest || !Number.isFinite(m.x) || !Number.isFinite(m.y)) return;
            for (const c of [...this.ctx.groups.doors.getChildren()]) {
                const s = c as Phaser.GameObjects.Sprite;
                if (Math.hypot(s.x - m.x, s.y - m.y) < 80) s.destroy();
            }
            this.ctx.interactions.removeNear(m.x, m.y, 90);
        }));
        this.offs.push(s.on('shop-buy', (m) => this.shopBuy(m.id)));
        this.offs.push(s.on('eat-use', (m) => this.eatUse(m.id, m.amount)));
        this.offs.push(s.on('heal', (m) => this.gotHeal(m.amount)));
        this.offs.push(s.on('achieve', (m) => {
            if (!coop.isHost || typeof m.id !== 'string') return;
            unlockAchievement(m.id);
        }));
        this.offs.push(s.on('trial-run', (m) => {
            if (!coop.isGuest) return;
            if (m.on) this.ctx.challenges.trial?.visualRun(m.limitMs);
            else this.ctx.challenges.trial?.stop();
        }));
        this.offs.push(s.on('film', (m) => this.followFilm(m.id)));
        this.offs.push(s.on('film-end', () => this.endFollowedFilm()));
        this.offs.push(s.on('interact', (m) => this.remoteInteract(m.x, m.y)));
        // la fine la decide l'host leggendo il compagno, al passo dopo: vedi tick
        this.offs.push(s.on('died', (m) => this.teamDied(m)));
        coopHooks.choice = (p) => this.routeChoice(p);
        coopHooks.travel = (p) => this.routeTravel(p);
        if (coop.isHost) {
            coopHooks.filmEnded = () => this.session.send('film-end', { token: 0 });
            const onCp = ({ id }: { id: string; levelId: string }) => this.checkpointLit(id);
            onWorld(this.scene, 'checkpoint', onCp, this);
            this.offs.push(() => offWorld(this.scene, 'checkpoint', onCp, this));
        }
    }

    private runAs(actor: Actor | null, fn: () => void): void {
        const prev = this.actor;
        this.actor = actor;
        coopHooks.actorKind = actor;
        try {
            fn();
        } finally {
            this.actor = prev;
            coopHooks.actorKind = prev;
        }
    }

    /* ---------- interagire ---------- */

    /** premo interagisci: le cose mie le faccio io, quelle del mondo le fa l'host per me */
    interact(): void {
        const near = this.ctx.interactions.nearest();
        if (!near) return;
        if (coop.isHost || near.local) {
            this.runAs('local', () => near.onInteract());
            return;
        }
        // una richiesta alla volta: il tasto tenuto non manda una raffica
        const now = this.scene.time.now;
        if (now - this.interactAt < 400) return;
        this.interactAt = now;
        this.session.send('interact', { x: this.ctx.player.x, y: this.ctx.player.y });
    }

    /** host: l'ospite ha premuto interagisci lì. si fa come se fosse lui, e quello che si apre lo vede lui */
    private remoteInteract(x: number, y: number): void {
        if (!coop.isHost || this.ctx.flow.exiting) return;
        const near = this.ctx.interactions.nearestTo(x, y);
        if (!near || near.local) return;
        this.runAs('remote', () => near.onInteract());
    }

    /* ---------- dialoghi ---------- */

    dialogue(lines: DialogueLine[], onEnd?: () => void): void {
        const actor = this.actor;
        if (actor === 'local') return this.manual(lines, onEnd);
        if (coop.isGuest) {
            // l'ospite la trama la riceve dall'host: qui si lascia solo andare avanti chi aspettava
            onEnd?.();
            return;
        }
        if (actor === 'remote') {
            const token = ++this.token;
            this.remoteEnds.set(token, () => this.runAs('remote', () => onEnd?.()));
            this.session.send('dlg-open', { token, lines, shared: false });
            return;
        }
        this.shared(lines, onEnd);
    }

    /** un dialogo mio: il mondo va avanti, io sto fermo e nessuno mi tocca */
    private manual(lines: DialogueLine[], onEnd?: () => void, done?: () => void): void {
        // chiudo il mio seguito sia alla fine sia se un dialogo di trama prende il posto:
        // l'ospite deve comunque mandare dlg-close, o l'host resta appeso
        const finish = (): void => {
            coopHooks.frozen = false;
            done?.();
            this.runAs('local', () => onEnd?.());
        };
        coopHooks.frozen = true;
        bus.emit('dialogue-start', {
            lines,
            onEnd: finish,
            coop: { onReplaced: finish },
        });
    }

    /** la trama: si ferma tutto per tutti e due, e le righe le manda avanti l'host */
    private shared(lines: DialogueLine[], onEnd?: () => void): void {
        coopHooks.frozen = false;
        const token = ++this.token;
        const key = this.scene.scene.key;
        this.scene.scene.pause();
        if (coop.together) this.session.send('dlg-open', { token, lines, shared: true });
        bus.emit('dialogue-start', {
            lines,
            onEnd: () => {
                this.scene.game.scene.resume(key);
                if (coop.together) this.session.send('dlg-close', { token });
                onEnd?.();
            },
            // una trama sopra un'altra: la vecchia avvisa e basta, la scena resta ferma per la nuova
            coop: {
                onStep: (index) => coop.together && this.session.send('dlg-step', { token, index }),
                onReplaced: () => {
                    if (coop.together) this.session.send('dlg-close', { token });
                },
            },
        });
    }

    /** ospite: l'host apre un dialogo, per tutti e due o solo per me */
    private openFromHost(m: CoopMsgs['dlg-open']): void {
        if (!coop.isGuest) return;
        const lines = Array.isArray(m.lines) ? m.lines.filter((l) => l && typeof l.text === 'string') : [];
        if (!lines.length) return;
        if (!m.shared) {
            this.manual(lines, undefined, () => this.session.send('dlg-close', { token: m.token }));
            return;
        }
        coopHooks.frozen = false;
        this.sharedToken = m.token;
        const key = this.scene.scene.key;
        if (this.scene.scene.isActive()) this.scene.scene.pause();
        const name = coop.partner?.name.toLowerCase() ?? 'l’host';
        bus.emit('dialogue-start', {
            lines,
            onEnd: () => {
                this.sharedToken = -1;
                this.scene.game.scene.resume(key);
            },
            coop: { follow: true, hint: `${name} manda avanti` },
        });
    }

    private closed(token: number): void {
        if (coop.isHost) {
            const end = this.remoteEnds.get(token);
            this.remoteEnds.delete(token);
            end?.();
            return;
        }
        // l'host ha chiuso il dialogo condiviso: si chiude anche qui, oltre l'ultima riga
        if (token === this.sharedToken) bus.emit('dialogue-step', { index: 1e6 });
    }

    /* ---------- scelte ---------- */

    /** le scelte in due: quelle di chi ha parlato le fa lui, quelle della trama le fa l'host e l'ospite le guarda */
    routeChoice(p: ChoiceShow): boolean {
        if (this.showing) return false;
        const actor = this.actor;
        if (coop.isGuest) {
            if (actor === 'local') return false;
            // una scelta nata qui senza nessuno che parla non è dell'ospite: la fa l'host
            return true;
        }
        if (actor === 'local') return false;
        const token = ++this.token;
        if (actor === 'remote') {
            this.remotePicks.set(token, (i) => this.runAs('remote', () => p.onPick(i)));
            this.session.send('choice-open', { token, title: p.title, options: p.options, shared: false });
            return true;
        }
        if (coop.together) this.session.send('choice-open', { token, title: p.title, options: p.options, shared: true });
        const key = this.scene.scene.key;
        if (this.scene.scene.isActive()) this.scene.scene.pause();
        this.showing = true;
        try {
            bus.emit('choice-show', {
                title: p.title,
                options: p.options,
                onPick: (i) => {
                    this.scene.game.scene.resume(key);
                    if (coop.together) this.session.send('choice-pick', { token, index: i });
                    p.onPick(i);
                },
            });
        } finally {
            this.showing = false;
        }
        return true;
    }

    /** la scelta che mostro davvero passa dal router una seconda volta: quella volta tocca a me */
    private showing = false;

    private choiceFromHost(m: CoopMsgs['choice-open']): void {
        if (!coop.isGuest) return;
        const options = Array.isArray(m.options) ? m.options.map((o) => ({ label: String(o.label), danger: !!o.danger })) : [];
        if (!options.length) return;
        if (m.shared) {
            // la scelta della trama: la guardo, la fa l'host
            const name = coop.partner?.name.toLowerCase() ?? 'l’host';
            bus.emit('toast', { text: `${name} sceglie: ${String(m.title)}` });
            return;
        }
        this.runAs('local', () => bus.emit('choice-show', {
            title: String(m.title),
            options,
            onPick: (i) => this.session.send('choice-pick', { token: m.token, index: i }),
        }));
    }

    private picked(token: number, index: number): void {
        if (!coop.isHost) return;
        const pick = this.remotePicks.get(token);
        this.remotePicks.delete(token);
        if (pick && Number.isInteger(index) && index >= 0) pick(index);
    }

    /* ---------- citelis ---------- */

    /** il tabellone chiesto dall'ospite: lo vede lui sul suo schermo, il viaggio lo fa l'host */
    routeTravel(p: { stops: { key: string; levelId: string; label: string }[]; current: string }): boolean {
        if (!coop.isHost || !coop.together || this.actor !== 'remote') return false;
        if (!Array.isArray(p.stops) || !p.stops.length) return false;
        const token = ++this.token;
        this.travelToken = token;
        this.session.send('travel-open', { token, stops: p.stops, current: p.current });
        return true;
    }

    private travelFromHost(m: CoopMsgs['travel-open']): void {
        if (!coop.isGuest) return;
        const stops = Array.isArray(m.stops) ? m.stops.filter((s) => s && typeof s.key === 'string' && typeof s.levelId === 'string').map((s) => ({ key: s.key.slice(0, 64), levelId: s.levelId.slice(0, 32), label: String(s.label).slice(0, 80) })) : [];
        if (!stops.length || typeof m.token !== 'number') return;
        this.runAs('local', () => bus.emit('travel-show', {
            stops,
            current: String(m.current),
            onPick: (key: string) => this.session.send('travel-pick', { token: m.token, key }),
        }));
    }

    private travelPicked(token: number, key: string): void {
        if (!coop.isHost || token !== this.travelToken || typeof key !== 'string') return;
        this.travelToken = 0;
        if (this.ctx.flow.exiting) return;
        this.ctx.travel.travelTo(key);
    }

    /* ---------- dispensa condivisa ---------- */

    /** l'ospite compra: soldi e zaino sono dell'host, per tutti e due */
    private shopBuy(id: string): void {
        if (!coop.isHost || typeof id !== 'string') return;
        const fail = (text: string) => bus.emit('toast', { text });
        if (id === 'tacca') {
            const bought = state.save.notches - BASE_NOTCHES;
            if (bought >= NOTCH_PRICES.length) return;
            const price = NOTCH_PRICES[bought]!;
            if (state.save.barre < price) return fail('barre insufficienti. il realm non fa credito.');
            state.save.barre -= price;
            state.addItem('tacca');
        } else {
            const it = ITEMS[id];
            if (!it?.price) return;
            if (it.kind === 'amuleto' && state.hasCharm(id)) return fail('ce l’hai già addosso.');
            if (state.save.barre < it.price) return fail('barre insufficienti. il realm non fa credito.');
            state.save.barre -= it.price;
            state.addItem(id);
        }
        state.persist();
        sfx.barra();
        bus.emit('barre-changed', { barre: state.save.barre, gained: false });
        bus.emit('toast', { text: 'consegnato nello zaino.' });
    }

    /** l'ospite mangia: il boccone esce dallo zaino comune, la cura arriva a lui */
    private eatUse(id: string, amount: number): void {
        if (!coop.isHost || typeof id !== 'string') return;
        if (!healFor(id) || state.count(id) <= 0) {
            bus.emit('toast', { text: 'niente da mangiare nello zaino. wavezon consegna ovunque.' });
            return;
        }
        if (!state.removeItem(id)) return;
        state.persist();
        const heal = Math.max(0, Math.min(20, Number.isFinite(amount) ? amount : 0));
        sfx.heal();
        bus.emit('toast', { text: `${ITEMS[id]?.name ?? id}: fatto.` });
        this.session.send('heal', { amount: heal });
    }

    private gotHeal(amount: number): void {
        if (!coop.isGuest) return;
        const p = this.ctx.player;
        if (p.dead || this.down) return;
        state.run.hp = Math.min(state.maxHp, state.run.hp + Math.max(0, Math.min(20, amount)));
        sfx.heal();
        bus.emit('hp-changed', { hp: state.run.hp, maxHp: state.maxHp, hurt: false });
        bus.emit('player-healed', {});
    }

    /* ---------- film ---------- */

    /** host: un ricordo parte, l'ospite lo guarda con me */
    film(id: string): void {
        if (coop.isHost && coop.together) this.session.send('film', { id, token: 0 });
    }

    private followFilm(id: string): void {
        if (!coop.isGuest || flashback.isPlaying) return;
        coopHooks.frozen = false;
        flashback.play(this.scene, this.ctx.player, id, undefined, { markSeen: false, follow: true });
    }

    private endFollowedFilm(): void {
        if (!coop.isGuest) return;
        const film = this.scene.game.scene.getScene('FilmScene') as FilmScene | null;
        if (film && this.scene.game.scene.isActive('FilmScene')) film.endNow();
    }

    /* ---------- cadere e rialzarsi ---------- */

    /** il mio geco è morto: se l'altro è in piedi guardo lui, se no si ricomincia insieme */
    onLocalDeath(): boolean {
        const partner = this.cs.partner;
        if (partner?.alive && coop.together) {
            this.goDown();
            return true;
        }
        if (coop.isGuest && coop.together) {
            // l'ospite non decide la fine: aspetta l'host, che la vede arrivare
            this.goDown();
            return true;
        }
        // l'host cade per ultimo: la fine la annuncia la progressione, col punteggio vero
        return false;
    }

    private goDown(): void {
        this.down = true;
        coopHooks.spectating = true;
        coopHooks.frozen = false;
        this.session.send('down', { down: true });
        const p = this.ctx.player;
        p.setTint(0xf87171);
        this.scene.tweens.add({ targets: p, alpha: 0.25, angle: 90, duration: 600 });
        if (coop.isHost) state.save.record.deaths++;
        this.ctx.bosses.silence();
        const partner = this.cs.partner;
        if (partner) this.scene.cameras.main.startFollow(partner, true, 0.12, 0.12);
        this.showBand();
    }

    private showBand(): void {
        this.band?.remove();
        const name = coop.partner?.name.toLowerCase() ?? 'l’altro';
        const band = document.createElement('div');
        band.className = 'cx-spectate';
        const t = document.createElement('div');
        t.className = 't';
        t.textContent = 'sei a terra';
        const s = document.createElement('div');
        s.className = 's';
        s.textContent = `${name} ti rialza al prossimo microfono. se cade anche ${name}, si riparte insieme.`;
        band.append(t, s);
        document.getElementById('ui')?.append(band);
        this.band = band;
    }

    /** di nuovo in piedi accanto al microfono acceso dall'altro */
    revive(x: number, y: number): void {
        if (!this.down) return;
        this.down = false;
        coopHooks.spectating = false;
        this.band?.remove();
        this.band = null;
        const p = this.ctx.player;
        this.scene.tweens.killTweensOf(p);
        p.dead = false;
        p.clearTint();
        p.setAlpha(1);
        p.setAngle(0);
        state.run.hp = state.maxHp;
        this.cs.teleportSelf(x, y);
        p.grantInvuln(1500);
        this.scene.cameras.main.startFollow(p, true, 0.12, 0.12);
        bus.emit('hp-changed', { hp: state.run.hp, maxHp: state.maxHp, hurt: false });
        bus.emit('toast', { text: 'di nuovo in piedi.' });
        this.session.send('down', { down: false });
    }

    /** host: un microfono acceso cura tutti e due e rialza chi era a terra */
    private checkpointLit(id: string): void {
        const cp = this.ctx.world.level.checkpoints.find((c) => c.id === id);
        if (!cp) return;
        if (this.down) this.revive(cp.x + 30, cp.y - 8);
        if (coop.together) {
            this.session.send('cmd', { c: 'revive', x: cp.x - 30, y: cp.y - 8 });
            // il microfono cura anche l'altro: la sua vita la decide lui, ma la cura è di tutti e due
            this.session.send('grant', { heal: true });
        }
    }

    /** a terra tutti e due: il mio geco o quello del compagno, chiunque sia caduto per ultimo */
    isWipe(): boolean {
        if (!coop.isHost || !coop.together) return false;
        const me = this.ctx.player;
        const partner = this.cs.partner;
        const meDown = me.dead || this.down;
        const partnerDown = !partner || !partner.last || partner.last.dead || partner.last.down;
        return meDown && partnerDown;
    }

    /** l'host annuncia la fine a tutti e due, col punteggio che vede anche lui */
    announceWipe(lost: number, score: number | null): void {
        if (!coop.isHost || !coop.together) return;
        this.session.send('died', { lost, score });
    }

    /** host: se siamo a terra tutti e due si riparte dal microfono, come da soli */
    tick(): void {
        if (!coop.isHost || this.wiping) return;
        const me = this.ctx.player;
        const partner = this.cs.partner;
        const meDown = me.dead || this.down;
        const partnerDown = !partner || !coop.together || !partner.last || partner.last.dead || partner.last.down;
        if (meDown && partnerDown && this.down) {
            this.wiping = true;
            this.band?.remove();
            this.band = null;
            coopHooks.spectating = false;
            this.down = false;
            // la schermata e l'annuncio all'ospite li fa la progressione, col punteggio vero
            this.ctx.flow.playerDied();
        }
    }

    /** ospite: siamo caduti tutti e due. stessa schermata dell'host, a rialzare tocca a lui */
    private teamDied(m: { lost: number; score: number | null }): void {
        if (!coop.isGuest) return;
        this.band?.remove();
        this.band = null;
        const name = coop.partner?.name.toLowerCase() ?? 'l’host';
        bus.emit('player-died', { lost: m.lost, score: m.score, guestOf: name });
    }

    /** la partita è passata a un altro capitolo o si è chiusa: niente resta appeso.
        i seguiti di dialoghi/scelte del capitolo vecchio non devono mai scattare in quello nuovo */
    destroy(): void {
        for (const off of this.offs) off();
        this.offs.length = 0;
        this.remoteEnds.clear();
        this.remotePicks.clear();
        this.travelToken = 0;
        this.sharedToken = -1;
        this.wiping = false;
        this.band?.remove();
        this.band = null;
        coopHooks.frozen = false;
        coopHooks.spectating = false;
        coopHooks.filmEnded = null;
        coopHooks.choice = null;
        coopHooks.travel = null;
    }
}
