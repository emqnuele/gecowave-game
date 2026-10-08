import Phaser from 'phaser';
import { bus } from '../../engine/events';
import { state } from '../../engine/state';
import type { Boss } from '../../entities/Boss';
import type { Companion } from '../../entities/Companion';
import type { Enemy } from '../../entities/Enemy';
import type { GameSystem } from '../context';
import { Analisi } from './Analisi';
import { Bottiglia } from './Bottiglia';
import { Riflesso } from './Riflesso';
import { Risonante } from './Risonante';
import { Scudo } from './Scudo';
import { Veleno } from './Veleno';
import { updateFlight } from './Volo';
import { waveWorld, type AbilitiesCtx } from './shared';

/** le wave del geco: riflesso, analisi, scudo, bottiglia e veleno, risonante */
export class Abilities implements GameSystem {
    private readonly ctx: AbilitiesCtx;
    private readonly riflesso: Riflesso;
    private readonly analisi: Analisi;
    private readonly scudo: Scudo;
    private readonly veleno: Veleno;
    private readonly bottiglia: Bottiglia;
    private readonly risonante: Risonante;
    private lastCooldownEmit = 0;
    private lastDashWaveAt = 0;

    constructor(ctx: AbilitiesCtx) {
        this.ctx = ctx;
        this.riflesso = new Riflesso(ctx);
        this.analisi = new Analisi(ctx);
        this.scudo = new Scudo(ctx);
        this.veleno = new Veleno(ctx.scene);
        this.bottiglia = new Bottiglia(ctx, this.veleno);
        this.risonante = new Risonante(ctx);
    }

    /** il player lo legge per sapere se la seconda pressione è uno scambio */
    get cloneAlive(): boolean {
        return this.riflesso.alive;
    }

    /** il clone vivo fa da esca: nemici e boss inseguono lui */
    decoy(): Companion | null {
        return this.riflesso.decoy();
    }

    shieldUp(now: number): boolean {
        return this.scudo.up(now);
    }

    shieldPerfect(now: number): boolean {
        return this.scudo.perfect(now);
    }

    isPoisoned(target: Enemy | Boss, now: number): boolean {
        return this.veleno.has(target, now);
    }

    onRisonante(e: { x: number; y: number; dir: number; level?: number }): void {
        this.risonante.cast(e);
    }

    onRiflesso(e: { x: number; y: number; facing: number }): void {
        this.riflesso.cast(e);
    }

    onRiflessoSwap(): void {
        this.riflesso.swap();
    }

    onAnalisi(): void {
        this.analisi.cast();
    }

    onScudo(): void {
        this.scudo.cast();
    }

    onAcquaTossica(e: { x: number; y: number; facing: number; aim: 'lob' | 'drop' }): void {
        this.bottiglia.cast(e);
    }

    refundNote(): void {
        this.scudo.refundNote();
    }

    reflectProjectile(proj: Phaser.Physics.Arcade.Sprite): void {
        this.scudo.reflect(proj);
    }

    updateClone(time: number, delta: number): void {
        this.riflesso.update(time, delta);
    }

    updateAnalisi(time: number): void {
        this.analisi.update(time);
    }

    updateScudo(time: number): void {
        this.scudo.update(time);
    }

    updateAcquaTossica(time: number): void {
        this.bottiglia.update(time);
    }

    updatePoison(time: number): void {
        this.veleno.update(time);
    }

    /** ricariche all'hud, scivolata che tocca il mondo, colpi in volo */
    updateAbilityFx(time: number): void {
        const player = this.ctx.player;
        if (time - this.lastCooldownEmit >= 100) {
            this.lastCooldownEmit = time;
            bus.emit('wave-cooldowns', { cds: player.cooldowns(), flow: state.run.flow });
        }
        if (player.isDashing && time - this.lastDashWaveAt >= 60) {
            this.lastDashWaveAt = time;
            const body = player.body as Phaser.Physics.Arcade.Body | null;
            const w = body?.width ?? 36;
            const h = body?.height ?? 55;
            waveWorld(this.ctx.scene, 'scivolata', player.x, player.y,
                new Phaser.Geom.Rectangle(player.x - w / 2, player.y - h / 2, w, h));
        }
        updateFlight(this.ctx, time);
    }

    destroy(): void {
        this.bottiglia.destroy();
    }
}
