import Phaser from 'phaser';
import { COMBAT } from '../../config';
import { FX } from '../../engine/art/abilityFx';
import { waveLevel } from '../../rules/abilities';
import type { AbilitiesCtx } from './shared';

/** il risonante: un'onda che parte in avanti, eco, onda o piena secondo la carica */
export class Risonante {
    private readonly ctx: AbilitiesCtx;
    private readonly scene: Phaser.Scene;

    constructor(ctx: AbilitiesCtx) {
        this.ctx = ctx;
        this.scene = ctx.scene;
    }

    cast({ x, y, dir, level }: { x: number; y: number; dir: number; level?: number }): void {
        const lv = waveLevel(level);
        const key = lv === 2 ? FX.wave2 : lv === 1 ? FX.wave1 : FX.waveTap;
        const proj = this.ctx.groups.playerProjectiles.create(x, y, key) as Phaser.Physics.Arcade.Sprite;
        proj.setDepth(5);
        proj.setFlipX(dir < 0);
        const speed = lv === 2 ? COMBAT.risonanteFullSpeed : lv === 1 ? COMBAT.risonanteSpeed : COMBAT.risonanteEcoSpeed;
        const life = lv === 2 ? COMBAT.risonanteFullLifeMs : lv === 1 ? COMBAT.risonanteLifeMs : COMBAT.risonanteEcoLifeMs;
        proj.setVelocityX(dir * speed);
        if (lv === 2) {
            const body = proj.body as Phaser.Physics.Arcade.Body;
            body.setSize(64, 64);
        }
        proj.setData('level', lv);
        proj.setData('trailAt', 0);
        proj.setData('waveAt', 0);
        this.ctx.lighting.follow(proj, 0x4ade80, 130, 0.8);
        const glow = this.scene.add.image(x, y, `${key}~glow`).setDepth(4).setBlendMode(Phaser.BlendModes.ADD);
        proj.setData('trail', glow);
        this.scene.time.delayedCall(life, () => proj.active && this.ctx.combat.popProjectile(proj));
    }
}
