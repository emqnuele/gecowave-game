import { coop } from '../../coop/runtime';
import { coopHooks, resetCoopHooks } from '../../coop/hooks';
import { FAST_PLAYER, type CoopMsgs } from '../../coop/protocol';
import { state } from '../../core/state';
import { bus, type GameEvents } from '../../core/events';
import { onWorld, offWorld } from '../../core/worldEvents';
import type { PlayerAct } from '../../rules/ombra';
import { InterpDelay, NetTrack, type Sample } from '../../net/interp';
import type { NetSession } from '../../net/session';
import type { GameContext, GameSystem } from '../context';
import Phaser from 'phaser';
import { readGeco, writeGeco } from './gecoWire';
import { RemoteGeco, type GecoState } from './RemoteGeco';
import { SaveLink } from './SaveLink';
import { WorldHost } from './WorldHost';
import { WorldMirror } from './WorldMirror';
import { CoopRules } from './CoopRules';
import { CoopHud } from './CoopHud';
import { RemoteFx } from './RemoteFx';
import type { PickupSpawn } from '../../coop/protocol';
import type { Spawner } from '../../entities/Spawner';
import type { Room } from '../../world/types';
import { eatProblem, healFor, pickSnack } from '../../core/inventory';
import { sfx } from '../../audio/sfx';

/** gli eventi della ui che l'host gira all'ospite: la trama, i premi, il boss. il resto è di chi lo vive */
const SHARED_UI = new Set<keyof GameEvents>(['toast', 'wavesung', 'bark', 'bark-clear', 'boss-hp', 'charm-found', 'ability-unlocked', 'doomsday-changed', 'ombra-read', 'chapter-score', 'trial-timer']);

/** quante volte al secondo il mio geco parte verso l'altro */
const SEND_MS = 1000 / 30;

type GecoSample = Sample & { s: GecoState };

/* il coop dentro un capitolo: il mio geco va all'altro, il suo arriva qui.
   nasce col capitolo e muore con lui, come ogni sistema */
export class CoopScene implements GameSystem {
    readonly ctx: GameContext;
    readonly scene: Phaser.Scene;
    readonly session: NetSession<CoopMsgs>;
    partner: RemoteGeco | null = null;
    private readonly track = new NetTrack<GecoSample>();
    private readonly delay = new InterpDelay(SEND_MS);
    private sendAcc = 0;
    private seq = 0;
    private lastHp = -1;
    private lastHurtAt = 0;
    private readonly offs: (() => void)[] = [];
    private readonly out = { x: 0, y: 0, vx: 0, vy: 0 };
    readonly saves: SaveLink;
    readonly host: WorldHost | null;
    readonly mirror: WorldMirror | null;
    readonly rules: CoopRules;
    private readonly hud = new CoopHud();
    private readonly fx: RemoteFx;
    /** l'esca del riflesso del compagno: i nemici dell'host la inseguono come la mia */
    private partnerDecoy: Phaser.GameObjects.Zone | null = null;
    private readonly aim = new WeakMap<object, object>();

    constructor(ctx: GameContext, session: NetSession<CoopMsgs>) {
        this.ctx = ctx;
        this.scene = ctx.scene;
        this.session = session;
        resetCoopHooks();
        this.saves = new SaveLink(session);
        this.host = coop.isHost ? new WorldHost(ctx, session) : null;
        this.mirror = coop.isGuest ? new WorldMirror(ctx, session) : null;
        this.rules = new CoopRules(this);
        coopHooks.partnerName = () => (this.partner?.alive ? this.partner.char.name.toLowerCase() : null);
        coopHooks.requestEat = (id) => this.requestEat(id);
        coopHooks.joinPartner = () => {
            const p = this.partner;
            if (!p?.alive || this.rules.down || this.ctx.player.dead) return;
            this.teleportSelf(p.x - 30, p.y - 10, `raggiungi ${p.char.name.toLowerCase()}.`);
        };
        if (this.host) {
            bus.tap = (event, payload) => {
                if (!coop.together) return;
                // i riepiloghi viaggiano senza il bottone: ognuno li chiude quando ha letto
                if (event === 'chapter-summary-show' || event === 'final-summary-show') {
                    const p = payload as GameEvents['chapter-summary-show'];
                    this.session.send('summary', { kind: event === 'chapter-summary-show' ? 'chapter' : 'final', data: p.summary, token: 0 });
                    return;
                }
                if (event === 'ending') {
                    this.session.send('ending', payload as GameEvents['ending']);
                    return;
                }
                if (!SHARED_UI.has(event) || coopHooks.personal > 0 || coopHooks.menuOpen) return;
                this.session.send('ui', { e: event, p: payload });
            };
            this.offs.push(() => {
                bus.tap = null;
            });
            this.offs.push(session.on('ready', (m) => {
                if (m.seq !== coop.levelSeq) return;
                this.ensurePartner();
                this.host?.welcome();
            }));
        }
        this.offs.push(session.on('cmd', (m) => this.command(m)));
        if (this.mirror) {
            this.offs.push(session.on('ui', (m) => {
                if (SHARED_UI.has(m.e as keyof GameEvents)) bus.emit(m.e as keyof GameEvents, m.p as never);
            }));
            this.offs.push(session.on('summary', (m) => {
                if (!m.data || typeof m.data !== 'object') return;
                const ev = m.kind === 'final' ? 'final-summary-show' : 'chapter-summary-show';
                bus.emit(ev, { summary: m.data as never, onContinue: () => {} });
            }));
            this.offs.push(session.on('ending', (m) => {
                coop.inEnding = true;
                bus.emit('ending', m as GameEvents['ending']);
            }));
        }
        this.hud.setLink(coop.link);
        this.offs.push(coop.listen((e) => {
            if (e.type === 'link') this.hud.setLink(e.link);
            if (e.type === 'partner' && !e.char) {
                const who = this.partner?.char.name.toLowerCase();
                this.dropPartner();
                bus.emit('toast', { text: `${who ?? 'il compagno'} ha lasciato la partita. si continua: col codice si rientra quando si vuole.` });
            }
        }));
        this.offs.push(session.onFast(FAST_PLAYER, (r, sentAt) => {
            const got = readGeco(r);
            if (!got || got.levelSeq !== coop.levelSeq) return;
            const now = performance.now();
            this.delay.arrived(now);
            this.track.push({ t: session.toLocal(sentAt), x: got.s.x, y: got.s.y, vx: got.s.vx, vy: got.s.vy, s: got.s });
        }));
        this.fx = new RemoteFx(this.scene);
        this.offs.push(session.on('act', (a) => {
            const p = this.partner;
            if (!p?.visible) return;
            if (a.a === 'risonante' || a.a === 'riflesso' || a.a === 'riflesso-swap' || a.a === 'scudo' || a.a === 'analisi' || a.a === 'acqua') this.fx.play(a, p);
            else p.act(a);
        }));
        const onAct = (a: PlayerAct) => this.onLocalAct(a);
        onWorld(this.scene, 'player-act', onAct, this);
        this.offs.push(() => offWorld(this.scene, 'player-act', onAct, this));
        // le mie wave: l'altro le vede partire da dove le lancio
        const waves: [Parameters<typeof onWorld>[1], (e: never) => void][] = [
            ['player-risonante', (e: { x: number; y: number; dir: number; level?: number }) => this.session.send('act', { a: 'risonante', x: e.x, y: e.y, dir: e.dir, level: e.level ?? 1 })],
            ['player-riflesso', (e: { x: number; y: number; facing: number }) => this.session.send('act', { a: 'riflesso', x: e.x, y: e.y, facing: e.facing })],
            ['player-riflesso-swap', () => this.session.send('act', { a: 'riflesso-swap' })],
            ['player-scudo', () => this.session.send('act', { a: 'scudo' })],
            ['player-analisi', () => this.session.send('act', { a: 'analisi' })],
            ['player-acqua', (e: { x: number; y: number; facing: number; aim: 'lob' | 'drop' }) => this.session.send('act', { a: 'acqua', x: e.x, y: e.y, facing: e.facing, aim: e.aim })],
        ];
        for (const [ev, fn] of waves) {
            this.scene.events.on(ev, fn, this);
            this.offs.push(() => this.scene.events.off(ev, fn, this));
        }
    }

    /** il boccone dell'ospite: lo mastica qui, lo paga la dispensa dell'host */
    private requestEat(id: string | null): boolean {
        if (!coop.isGuest || !coop.together) return false;
        const snack = id ?? pickSnack();
        if (!snack) {
            bus.emit('toast', { text: 'niente da mangiare nello zaino. wavezon consegna ovunque.' });
            return true;
        }
        const problem = eatProblem(snack);
        if (problem) {
            bus.emit('toast', { text: problem });
            return true;
        }
        const amount = Math.max(0, Math.min(20, healFor(snack) + state.mods.foodHeal));
        this.session.send('eat-use', { id: snack, amount });
        this.session.send('act', { a: 'eat' });
        sfx.eat();
        return true;
    }

    /** il compagno entra in scena col suo personaggio, dove sta adesso */
    ensurePartner(): RemoteGeco | null {
        if (this.partner?.active) return this.partner;
        const char = coop.partner;
        if (!char) return null;
        const p = this.ctx.player;
        this.partner = new RemoteGeco(this.scene, p.x, p.y, char, this.ctx.lighting);
        this.partner.setVisible(false);
        return this.partner;
    }

    dropPartner(): void {
        this.partner?.destroy();
        this.partner = null;
        this.partnerDecoy?.destroy();
        this.partnerDecoy = null;
        this.track.clear();
        if (this.host) this.host.ready = false;
    }

    /** il caricamento è finito: da qui gli oggetti che nascono sono fatti nuovi */
    loaded(): void {
        if (!this.host) return;
        this.host.adoptExisting();
        this.host.loading = false;
    }

    /* ---------- il mondo condiviso ---------- */

    /** dove sta il compagno, se è vivo e nel capitolo: i nemici si svegliano anche per lui */
    partnerSpot(): { x: number; y: number } | null {
        const p = this.partner;
        return p?.active && p.visible && p.alive ? { x: p.x, y: p.y } : null;
    }

    /** dove guarda l'ospite anche da terra: gli snapshot del mondo continuano qui, il gameplay no */
    partnerView(): { x: number; y: number } | null {
        const p = this.partner;
        return p?.active && p.visible ? { x: p.x, y: p.y } : null;
    }

    /** chi insegue chi: il geco più vicino che si può toccare, senza cambiare idea a ogni passo */
    targetFor(who: { x: number; y: number }, mine: Phaser.GameObjects.Sprite): Phaser.GameObjects.Sprite {
        const p = this.partner;
        const pl = this.ctx.player;
        const localOk = !pl.dead && !pl.hidden && !coopHooks.frozen && !coopHooks.spectating;
        if (!p?.active || !p.visible || p.untouchable) return mine;
        const theirs = this.partnerTarget(p);
        if (!localOk) return theirs;
        const dMine = Math.hypot(mine.x - who.x, mine.y - who.y);
        const dTheirs = Math.hypot(theirs.x - who.x, theirs.y - who.y);
        const prev = this.aim.get(who);
        // si cambia bersaglio solo se l'altro è davvero più vicino
        const pick = prev === theirs ? (dMine < dTheirs * 0.75 ? mine : theirs) : (dTheirs < dMine * 0.75 ? theirs : mine);
        this.aim.set(who, pick);
        return pick;
    }

    private partnerTarget(p: RemoteGeco): Phaser.GameObjects.Sprite {
        const d = p.last?.decoy;
        if (!d) return p;
        if (!this.partnerDecoy) this.partnerDecoy = this.scene.add.zone(d.x, d.y, 36, 55);
        this.partnerDecoy.setPosition(d.x, d.y);
        return this.partnerDecoy as unknown as Phaser.GameObjects.Sprite;
    }

    pickupSpawned(spec: PickupSpawn, sprite: Phaser.GameObjects.GameObject, always = false): void {
        if (this.host) this.host.registerPickup(spec, sprite, always);
        else this.mirror?.registerPickup(spec.key, sprite);
    }

    shot(proj: Phaser.Physics.Arcade.Sprite, shot: { x: number; y: number; tx: number; ty: number; color?: number; speed?: number; size?: number }): void {
        this.host?.shot(proj, shot);
    }

    lamette(e: { xs: number[]; y: number }): void {
        this.host?.lamette(e);
    }

    projectileSpent(proj: Phaser.GameObjects.GameObject): void {
        this.host?.projectileSpent(proj);
        this.mirror?.projectileSpent(proj);
    }

    wallBroken(wall: Phaser.GameObjects.Sprite): void {
        this.host?.wallBroken(wall);
        this.mirror?.wallBroken(wall);
    }

    /** l'arena si chiude: chi è rimasto fuori ci finisce dentro, accanto all'altro */
    arenaLocked(room: Room, inside: (p: { x: number; y: number }) => boolean): void {
        if (!this.host) return;
        this.session.send('arena', { locked: true, room: room.id });
        const p = this.partner;
        const me = this.ctx.player;
        const meIn = !me.dead && inside(me);
        if (p?.alive && !inside(p) && meIn) {
            this.session.send('cmd', { c: 'teleport', x: me.x - me.facing * 40, y: me.y - 10 });
        } else if (!meIn && !me.dead && p?.alive) {
            this.teleportSelf(p.x + 40, p.y - 10, 'l’arena si chiude: ti trovi dentro.');
        }
    }

    arenaUnlocked(): void {
        if (this.host) this.session.send('arena', { locked: false, room: -1 });
    }

    /** il mio geco cambia posto senza camminare: una nuvola dove sparisce e dove riappare */
    teleportSelf(x: number, y: number, why?: string): void {        const p = this.ctx.player;
        const puff = (px: number, py: number) => {
            const e = this.scene.add.particles(px, py, 'p-dot', { speed: { min: 40, max: 160 }, scale: { start: 0.7, end: 0 }, alpha: { start: 0.7, end: 0 }, tint: 0x0b0c10, lifespan: 420, quantity: 16, stopAfter: 16 }).setDepth(6);
            this.scene.time.delayedCall(800, () => e.destroy());
        };
        puff(p.x, p.y);
        (p.body as Phaser.Physics.Arcade.Body).reset(x, y);
        puff(x, y);
        this.ctx.safe.lastSafe = { x, y };
        this.scene.cameras.main.flash(120, 20, 20, 20);
        if (why) bus.emit('toast', { text: why });
    }

    nestHit(s: Spawner, amount: number): boolean {
        return this.mirror?.nestHit(s, amount) ?? false;
    }

    private onLocalAct(a: PlayerAct): void {
        const p = this.ctx.player;
        if (a.act === 'attack') this.session.send('act', { a: 'slash', dir: a.dir === 'up' || a.dir === 'down' ? a.dir : 'side', combo: p.comboStep });
        else if (a.act === 'dash') this.session.send('act', { a: 'dash' });
        else if (a.act === 'wave' && a.wave === 'rimbalzo') this.session.send('act', { a: 'jump2' });
        else if (a.act === 'wave' && a.wave === 'aggrappo') this.session.send('act', { a: 'walljump', side: -p.facing });
    }

    private localState(): GecoState {
        const p = this.ctx.player;
        const priv = p as unknown as { attacking: boolean; eating: unknown; charging: boolean };
        const body = p.body as Phaser.Physics.Arcade.Body;
        const key = p.anims.currentAnim?.key ?? 'p-idle';
        const anim = key === 'p-run' ? 1 : key === 'p-jump' ? 2 : key === 'p-land' ? 3 : key === 'p-attack' ? 4 : 0;
        const decoy = this.ctx.abilities.decoy();
        return {
            x: p.x, y: p.y, vx: body.velocity.x, vy: body.velocity.y,
            facing: p.facing,
            grounded: p.isGrounded,
            dashing: p.isDashing,
            attacking: priv.attacking,
            blink: p.invulnerable && !p.isDashing,
            dead: p.dead,
            hidden: p.hidden,
            eating: !!priv.eating,
            charging: priv.charging,
            frozen: coopHooks.frozen,
            down: coopHooks.spectating,
            anim,
            hp: state.run.hp,
            maxHp: state.maxHp,
            decoy: decoy?.active ? { x: decoy.x, y: decoy.y } : null,
        };
    }

    /** l'host muove il mio geco per la trama: arena, rientri, ferite */
    private command(m: CoopMsgs['cmd']): void {
        const p = this.ctx.player;
        if (m.c === 'teleport') this.teleportSelf(m.x, m.y, 'l’arena si chiude: ti trovi dentro.');
        else if (m.c === 'stun') p.stun(Math.max(0, Math.min(60000, m.ms)));
        else if (m.c === 'hurt') p.hurt(Math.max(0, Math.min(10, m.amount)), m.fromX);
        else if (m.c === 'kill') p.kill();
        else if (m.c === 'revive') this.rules.revive(m.x, m.y);
        else if (m.c === 'flash') this.scene.cameras.main.flash(240, m.r, m.g, m.b);
    }

    /** quello che fa il mio geco è mio: i suoi toast non vanno all'altro */
    mine(on: boolean): void {
        coopHooks.personal += on ? 1 : -1;
    }

    /** un passo di logica: parte il mio stato, si sistema il suo */
    tick(delta: number): void {
        this.saves.tick(delta);
        this.rules.tick();
        this.host?.tick(delta, this.partnerView());
        const hp = state.run.hp;
        if (hp < this.lastHp && !this.ctx.player.dead) {
            const now = this.scene.time.now;
            if (now - this.lastHurtAt > 350) {
                this.lastHurtAt = now;
                this.session.send('act', { a: 'hurt', fromX: this.ctx.player.x });
            }
        }
        this.lastHp = hp;
        this.sendAcc += delta;
        if (this.sendAcc >= SEND_MS) {
            this.sendAcc = Math.min(this.sendAcc - SEND_MS, SEND_MS);
            const s = this.localState();
            this.seq = (this.seq + 1) & 0xffff;
            this.session.sendFast(FAST_PLAYER, (w) => writeGeco(w, coop.levelSeq, this.seq, s));
        }
    }

    /** a ogni fotogramma disegnato: l'altro un poco nel passato, tra due stati veri */
    present(delta: number): void {
        this.mirror?.present(delta);
        this.hud.update(this.partner, this.scene.cameras.main);
        this.fx.update(this.partner, this.scene.time.now);
        if (!this.track.size) return;
        const partner = this.ensurePartner();
        if (!partner) return;
        const now = performance.now();
        const at = this.track.at(now - this.delay.ms, this.out);
        if (!at) return;
        partner.setVisible(true);
        partner.apply({ ...at.s, x: this.out.x, y: this.out.y, vx: this.out.vx, vy: this.out.vy }, this.scene.time.now);
    }

    destroy(): void {
        for (const off of this.offs) off();
        this.offs.length = 0;
        this.saves.destroy();
        this.rules.destroy();
        this.hud.destroy();
        this.fx.destroy();
        this.host?.destroy();
        this.mirror?.destroy();
        this.dropPartner();
        resetCoopHooks();
    }
}
