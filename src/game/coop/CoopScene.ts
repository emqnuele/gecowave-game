import type Phaser from 'phaser';
import { coop } from '../../coop/runtime';
import { coopHooks, resetCoopHooks } from '../../coop/hooks';
import { FAST_PLAYER, type CoopMsgs } from '../../coop/protocol';
import { state } from '../../core/state';
import { onWorld, offWorld } from '../../core/worldEvents';
import type { PlayerAct } from '../../rules/ombra';
import { InterpDelay, NetTrack, type Sample } from '../../net/interp';
import type { NetSession } from '../../net/session';
import type { GameContext, GameSystem } from '../context';
import { readGeco, writeGeco } from './gecoWire';
import { RemoteGeco, type GecoState } from './RemoteGeco';

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
    private readonly offs: (() => void)[] = [];
    private readonly out = { x: 0, y: 0, vx: 0, vy: 0 };

    constructor(ctx: GameContext, session: NetSession<CoopMsgs>) {
        this.ctx = ctx;
        this.scene = ctx.scene;
        this.session = session;
        resetCoopHooks();
        this.offs.push(session.onFast(FAST_PLAYER, (r, sentAt) => {
            const got = readGeco(r);
            if (!got || got.levelSeq !== coop.levelSeq) return;
            const now = performance.now();
            this.delay.arrived(now);
            this.track.push({ t: session.toLocal(sentAt), x: got.s.x, y: got.s.y, vx: got.s.vx, vy: got.s.vy, s: got.s });
        }));
        this.offs.push(session.on('act', (a) => this.partner?.act(a)));
        const onAct = (a: PlayerAct) => this.onLocalAct(a);
        onWorld(this.scene, 'player-act', onAct, this);
        this.offs.push(() => offWorld(this.scene, 'player-act', onAct, this));
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
        this.track.clear();
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

    /** un passo di logica: parte il mio stato, si sistema il suo */
    tick(delta: number): void {
        if (state.run.hp < this.lastHp && !this.ctx.player.dead) this.session.send('act', { a: 'hurt', fromX: this.ctx.player.x });
        this.lastHp = state.run.hp;
        this.sendAcc += delta;
        if (this.sendAcc >= SEND_MS) {
            this.sendAcc = Math.min(this.sendAcc - SEND_MS, SEND_MS);
            const s = this.localState();
            this.seq = (this.seq + 1) & 0xffff;
            this.session.sendFast(FAST_PLAYER, (w) => writeGeco(w, coop.levelSeq, this.seq, s));
        }
    }

    /** a ogni fotogramma disegnato: l'altro un poco nel passato, tra due stati veri */
    present(): void {
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
        this.dropPartner();
        resetCoopHooks();
    }
}
