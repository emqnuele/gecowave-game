import Phaser from 'phaser';
import { bus } from '../../core/events';
import { state } from '../../core/state';
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
        this.offs.push(s.on('film', (m) => this.followFilm(m.id)));
        this.offs.push(s.on('film-end', () => this.endFollowedFilm()));
        this.offs.push(s.on('interact', (m) => this.remoteInteract(m.x, m.y)));
        this.offs.push(s.on('down', (m) => this.partnerDown(m.down)));
        this.offs.push(s.on('died', () => this.teamDied()));
        coopHooks.choice = (p) => this.routeChoice(p);
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
        try {
            fn();
        } finally {
            this.actor = prev;
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
        coopHooks.frozen = true;
        bus.emit('dialogue-start', {
            lines,
            onEnd: () => {
                coopHooks.frozen = false;
                done?.();
                this.runAs('local', () => onEnd?.());
            },
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
            coop: { onStep: (index) => coop.together && this.session.send('dlg-step', { token, index }) },
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
        // l'host cade per ultimo: si ricomincia insieme, e l'ospite lo sa subito
        if (coop.isHost && coop.together) this.session.send('died', { lost: state.save.barre, score: null });
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
        s.textContent = `${name} ti rialza al prossimo microfono. se cade anche lui, si riparte insieme.`;
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
        if (coop.together) this.session.send('cmd', { c: 'revive', x: cp.x - 30, y: cp.y - 8 });
    }

    private partnerDown(down: boolean): void {
        void down;
        // la fine la decide l'host, al passo dopo: vedi tick
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
            if (coop.together) this.session.send('died', { lost: state.save.barre, score: null });
            this.ctx.flow.playerDied();
        }
    }

    /** ospite: siamo caduti tutti e due. si aspetta che l'host faccia ripartire il capitolo */
    private teamDied(): void {
        if (!coop.isGuest) return;
        this.band?.remove();
        const name = coop.partner?.name.toLowerCase() ?? 'l’host';
        const band = document.createElement('div');
        band.className = 'cx-spectate';
        const t = document.createElement('div');
        t.className = 't';
        t.textContent = 'siete caduti';
        const s = document.createElement('div');
        s.className = 's';
        s.textContent = `${name} vi rialza al microfono.`;
        band.append(t, s);
        document.getElementById('ui')?.append(band);
        this.band = band;
    }

    /** la partita è passata a un altro capitolo o si è chiusa: niente resta appeso */
    destroy(): void {
        for (const off of this.offs) off();
        this.offs.length = 0;
        this.band?.remove();
        this.band = null;
        coopHooks.frozen = false;
        coopHooks.spectating = false;
        coopHooks.filmEnded = null;
        coopHooks.choice = null;
    }
}
