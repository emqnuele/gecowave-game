import Phaser from 'phaser';
import { COMBAT } from '../../config';
import { TOASTS } from '../../content/story';
import { FX } from '../../engine/art/abilityFx';
import { bus } from '../../engine/events';
import { sfx } from '../../engine/sfx';
import type { AbilitiesCtx } from './shared';

/** la bolla crt dello scudo, il rec rosso e la scritta del rimando perfetto */
class ScudoFx {
    private bubble: Phaser.GameObjects.Image | null = null;
    private glow: Phaser.GameObjects.Image | null = null;
    private rec: Phaser.GameObjects.Image | null = null;
    private readonly scene: Phaser.Scene;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    get shown(): boolean {
        return !!this.bubble;
    }

    raise(x: number, y: number): void {
        this.bubble = this.scene.add.image(x, y, FX.shieldPerfect).setDepth(6);
        this.glow = this.scene.add.image(x, y, `${FX.shield}~glow`).setDepth(5)
            .setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.8);
        this.rec = this.scene.add.image(x + 44, y - 52, FX.rec).setDepth(7);
        sfx.crt();
        this.scene.cameras.main.flash(70, 34, 211, 238);
    }

    /** i primi istanti il bordo è bianco e spesso: il rimando è perfetto */
    follow(x: number, y: number, time: number, perfect: boolean): void {
        if (!this.bubble) return;
        this.bubble.setTexture(perfect ? FX.shieldPerfect : FX.shield);
        this.bubble.setPosition(x, y);
        this.bubble.setScale(1 + Math.sin(time / 90) * 0.03);
        this.glow?.setPosition(x, y);
        this.rec?.setPosition(x + 44, y - 52);
    }

    /** scritta a pennarello del rimando perfetto */
    refund(x: number, y: number): void {
        const note = this.scene.add.image(x, y - 64, FX.refund).setDepth(7).setScale(0.7);
        this.scene.tweens.add({ targets: note, y: note.y - 18, alpha: 0, duration: 600, onComplete: () => note.destroy() });
    }

    clear(): void {
        this.bubble?.destroy();
        this.bubble = null;
        this.glow?.destroy();
        this.glow = null;
        this.rec?.destroy();
        this.rec = null;
    }
}

/** lo scudo: per un po' i colpi nemici tornano indietro, nei primi istanti inseguono chi li ha sparati */
export class Scudo {
    private until = 0;
    private start = 0;
    private readonly fx: ScudoFx;
    private readonly ctx: AbilitiesCtx;
    private readonly scene: Phaser.Scene;

    constructor(ctx: AbilitiesCtx) {
        this.ctx = ctx;
        this.scene = ctx.scene;
        this.fx = new ScudoFx(ctx.scene);
    }

    up(now: number): boolean {
        return now < this.until;
    }

    /** i primi istanti dello scudo: chi lo tocca viene respinto senza far danno */
    perfect(now: number): boolean {
        return now < this.until && now - this.start < COMBAT.scudoPerfectMs;
    }

    cast(): void {
        this.until = this.scene.time.now + COMBAT.scudoDurationMs;
        this.start = this.scene.time.now;
        this.fx.clear();
        this.fx.raise(this.ctx.player.x, this.ctx.player.y);
        bus.emit('toast', { text: TOASTS.scudo });
    }

    update(time: number): void {
        if (!this.fx.shown) return;
        if (time >= this.until) {
            this.fx.clear();
            return;
        }
        this.fx.follow(this.ctx.player.x, this.ctx.player.y, time, time - this.start < COMBAT.scudoPerfectMs);
    }

    refundNote(): void {
        this.fx.refund(this.ctx.player.x, this.ctx.player.y);
    }

    /** il colpo torna indietro più veloce; se perfetto punta chi l'ha sparato */
    reflect(proj: Phaser.Physics.Arcade.Sprite): void {
        if (!proj.active) return;
        const body = proj.body as Phaser.Physics.Arcade.Body;
        const vx = body.velocity.x;
        const vy = body.velocity.y;
        const perfect = this.scene.time.now - this.start < COMBAT.scudoPerfectMs;
        const shooter = proj.getData('shooter') as (Phaser.GameObjects.Sprite & { active: boolean }) | undefined;
        this.ctx.combat.popProjectile(proj);
        const back = this.ctx.groups.playerProjectiles.create(this.ctx.player.x, this.ctx.player.y - 6, 'proj-ball') as Phaser.Physics.Arcade.Sprite;
        back.setDepth(5);
        back.setTint(0x22d3ee);
        back.setData('dmg', perfect ? COMBAT.scudoReflectPerfect : COMBAT.scudoReflectNormal);
        back.setData('reflected', true);
        back.setData('perfect', perfect);
        back.setData('waveAt', 0);
        if (perfect && shooter?.active) back.setData('homing', shooter);
        const speed = Math.max(360, Math.hypot(vx, vy));
        const angle = Math.atan2(-vy, -vx);
        back.setVelocity(Math.cos(angle) * speed * 1.15, Math.sin(angle) * speed * 1.15);
        if (perfect) {
            sfx.perfectDing();
            this.refundNote();
            const target = shooter?.active ? shooter : null;
            if (target) {
                const dx = target.x - back.x;
                const dy = target.y - back.y;
                const d = Math.hypot(dx, dy) || 1;
                back.setVelocity((dx / d) * speed * 1.15, (dy / d) * speed * 1.15);
            }
        } else {
            sfx.slash();
        }
        this.scene.time.delayedCall(2600, () => back.active && this.ctx.combat.popProjectile(back));
    }
}
