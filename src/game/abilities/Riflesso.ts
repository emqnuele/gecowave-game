import Phaser from 'phaser';
import { COMBAT } from '../../config';
import { TOASTS } from '../../content/story';
import { FX } from '../../engine/art/abilityFx';
import { bus } from '../../engine/events';
import { sfx } from '../../engine/sfx';
import { state } from '../../engine/state';
import { Companion } from '../../entities/Companion';
import type { Enemy } from '../../entities/Enemy';
import type { Spawner } from '../../entities/Spawner';
import { waveWorld, type AbilitiesCtx } from './shared';
import { emitWorld } from '../../engine/worldEvents';

/** il vetro rotto del riflesso: gemello luminoso, crepe, schegge */
class RiflessoFx {
    private twin: Phaser.GameObjects.Image | null = null;
    private jitterAt = 0;
    private readonly scene: Phaser.Scene;
    private readonly ctx: Pick<AbilitiesCtx, 'lighting'>;

    // il contesto, non le luci: le abilità nascono prima delle luci e i riferimenti si leggono quando servono
    constructor(scene: Phaser.Scene, ctx: Pick<AbilitiesCtx, 'lighting'>) {
        this.scene = scene;
        this.ctx = ctx;
    }

    birth(clone: Companion, x: number, y: number): void {
        this.ctx.lighting.follow(clone, 0x22d3ee, 180, 0.9);
        // gemello luminoso sopra: vetro rotto che slitta a scatti
        this.twin = this.scene.add.image(x, y, clone.texture.key, clone.frame.name)
            .setScale(clone.scaleX).setAlpha(0.35).setTint(0xa5f3fc)
            .setBlendMode(Phaser.BlendModes.ADD).setDepth(5);
        this.jitterAt = 0;
        // la nascita apre una stella di crepe
        const crack = this.scene.add.image(x, y, FX.mirrorCrack).setDepth(6).setScale(0.4).setAlpha(0.9);
        const crackGlow = this.scene.add.image(x, y, `${FX.mirrorCrack}~glow`).setDepth(5)
            .setBlendMode(Phaser.BlendModes.ADD).setScale(0.4).setAlpha(0.7);
        this.scene.tweens.add({
            targets: [crack, crackGlow], scaleX: 1.4, scaleY: 1.4, alpha: 0, duration: 300,
            onComplete: () => { crack.destroy(); crackGlow.destroy(); },
        });
        sfx.mirrorBirth();
    }

    /** il gemello luminoso slitta a scatti come un vetro rotto */
    follow(clone: Companion, time: number): void {
        if (!this.twin) return;
        this.twin.setPosition(clone.x, clone.y).setFrame(clone.frame.name).setFlipX(clone.flipX);
        if (time >= this.jitterAt) {
            this.jitterAt = time + 80 + Math.random() * 60;
            this.twin.x += Math.random() < 0.5 ? -2 : 2;
        }
    }

    shards(points: readonly (readonly [number, number])[]): void {
        for (const [sx, sy] of points) {
            for (let i = 0; i < 4; i++) {
                const s = this.scene.add.image(sx, sy, FX.mirrorShard).setDepth(6);
                const a = Math.random() * Math.PI * 2;
                this.scene.tweens.add({
                    targets: s,
                    x: sx + Math.cos(a) * 60,
                    y: sy + Math.sin(a) * 60,
                    angle: 200,
                    alpha: 0,
                    duration: 400,
                    ease: 'Quad.easeOut',
                    onComplete: () => s.destroy(),
                });
            }
        }
    }

    hit(target: Phaser.GameObjects.Sprite): void {
        const fx = this.scene.add.particles(target.x, target.y, 'p-spark', {
            speed: { min: 60, max: 140 },
            scale: { start: 0.5, end: 0 },
            tint: 0x22d3ee,
            lifespan: 200,
            quantity: 5,
            stopAfter: 5,
        }).setDepth(6);
        this.scene.time.delayedCall(600, () => fx.destroy());
    }

    clear(): void {
        this.twin?.destroy();
        this.twin = null;
    }
}

/** il riflesso: un clone che combatte da solo per qualche secondo, e una volta sola ci si scambia di posto */
export class Riflesso {
    private clone: Companion | null = null;
    private colliders: Phaser.Physics.Arcade.Collider[] = [];
    private waveAt = 0;
    private swapUsed = false;
    private readonly fx: RiflessoFx;
    private readonly ctx: AbilitiesCtx;
    private readonly scene: Phaser.Scene;

    constructor(ctx: AbilitiesCtx) {
        this.ctx = ctx;
        this.scene = ctx.scene;
        this.fx = new RiflessoFx(ctx.scene, ctx);
    }

    get alive(): boolean {
        return !!this.clone?.active;
    }

    decoy(): Companion | null {
        return this.clone?.active ? this.clone : null;
    }

    cast({ x, y, facing }: { x: number; y: number; facing: number }): void {
        this.kill();
        const clone = new Companion(this.scene, x, y, facing < 0 ? -1 : 1);
        this.clone = clone;
        this.ctx.carry.cloneUntil = this.scene.time.now + COMBAT.riflessoDurationMs;
        this.swapUsed = false;
        this.ctx.player.riflessoSwapAvailable = true;
        this.waveAt = 0;
        this.fx.birth(clone, x, y);
        // la nascita è la stessa decisione del lancio: il profilo l'ha già vista

        // stessa fisica del player: terreno, muri, porte
        this.colliders.push(
            this.scene.physics.add.collider(clone, this.ctx.world.level.layer),
            this.scene.physics.add.collider(clone, this.ctx.world.level.breakableWalls),
            this.scene.physics.add.collider(clone, this.ctx.groups.doors),
            // il riflesso assorbe i colpi nemici (resta un'esca)
            this.scene.physics.add.overlap(this.ctx.groups.enemyProjectiles, clone, (a, b) => {
                this.ctx.combat.popProjectile((a === clone ? b : a) as Phaser.Physics.Arcade.Sprite);
            }),
            // riusa il sistema d'attacco del player: la hitbox colpisce i nemici
            this.scene.physics.add.overlap(clone.attackHitbox, this.ctx.groups.enemies, (_hb, obj) => {
                if (!clone.attackActive) return;
                const enemy = obj as Enemy;
                clone.consumeSwing();
                this.fx.hit(enemy);
                this.ctx.combat.dmgTo(enemy, clone.attackDamage, clone.x);
            }),
            this.scene.physics.add.overlap(clone.attackHitbox, this.ctx.groups.spawners, (_hb, obj) => {
                if (!clone.attackActive) return;
                const s = obj as Spawner;
                clone.consumeSwing();
                this.fx.hit(s);
                this.ctx.enemies.damageSpawner(s, clone.attackDamage);
            }),
        );
        if (this.ctx.bosses.current) {
            this.colliders.push(
                this.scene.physics.add.overlap(clone.attackHitbox, this.ctx.bosses.current, (_hb, obj) => {
                    if (!clone.attackActive || !this.ctx.bosses.current) return;
                    clone.consumeSwing();
                    this.fx.hit(obj as Phaser.GameObjects.Sprite);
                    this.ctx.combat.dmgTo(this.ctx.bosses.current, clone.attackDamage, clone.x);
                }),
            );
        }
    }

    /** seconda pressione: geco e clone si scambiano di posto */
    swap(): void {
        const clone = this.clone;
        if (!clone?.active || this.swapUsed) return;
        if (state.run.flow < COMBAT.riflessoSwapCost * state.mods.abilityCost) {
            bus.emit('toast', { text: TOASTS.noFlow });
            return;
        }
        state.run.flow -= COMBAT.riflessoSwapCost * state.mods.abilityCost;
        bus.emit('flow-changed', { flow: state.run.flow, maxFlow: state.maxFlow });
        this.swapUsed = true;
        const player = this.ctx.player;
        player.riflessoSwapAvailable = false;
        const px = player.x;
        const py = player.y;
        player.setPosition(clone.x, clone.y);
        clone.setPosition(px, py);
        const body = player.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0, 0);
        player.grantInvuln(300);
        sfx.mirrorSwap();
        emitWorld(this.scene, 'player-act', { act: 'wave', wave: 'riflesso' });
        this.fx.shards([[player.x, player.y], [px, py]]);
    }

    update(time: number, delta: number): void {
        const clone = this.clone;
        if (!clone || !clone.active) return;
        if (time >= this.ctx.carry.cloneUntil) {
            this.kill();
            return;
        }
        clone.update(time, delta, this.nearHostile(clone.x, clone.y));
        this.fx.follow(clone, time);
        // gancio per il piano 7: il clone tocca il mondo ogni 200 ms
        if (time - this.waveAt >= 200) {
            this.waveAt = time;
            const body = clone.body as Phaser.Physics.Arcade.Body | null;
            const w = body?.width ?? 36;
            const h = body?.height ?? 55;
            waveWorld(this.scene, 'riflesso', clone.x, clone.y, new Phaser.Geom.Rectangle(clone.x - w / 2, clone.y - h / 2, w, h));
        }
    }

    private kill(): void {
        this.colliders.forEach((c) => c.destroy());
        this.colliders = [];
        this.fx.clear();
        this.ctx.player.riflessoSwapAvailable = false;
        this.clone?.kill();
        this.clone = null;
    }

    /** il bersaglio vicino per il riflesso: senza nemici attorno resta fermo dov'è */
    private nearHostile(x: number, y: number): (Phaser.GameObjects.Sprite & { active: boolean }) | null {
        const h = this.ctx.enemies.nearestHostile(x, y);
        if (!h || Math.hypot(h.x - x, h.y - y) > 700) return null;
        return h;
    }
}
