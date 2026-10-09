import Phaser from 'phaser';
import { COMBAT } from '../../config';
import { hitMult } from '../../content/lessons';
import { FX } from '../../art/abilityFx';
import { sfx } from '../../audio/sfx';
import { Enemy } from '../../entities/Enemy';
import type { Boss } from '../../entities/Boss';
import { puddleFloorY } from '../../rules/abilities';
import { waveWorld, type AbilitiesCtx } from './shared';
import type { Veleno } from './Veleno';
import { rng } from '../../core/rng';

interface Puddle {
    img: Phaser.GameObjects.Image;
    glow: Phaser.GameObjects.Image;
    x: number;
    y: number;
    until: number;
    nextTick: number;
    waveAt: number;
}

/** schegge di plastica, pozze che brillano, bolle che scoppiano */
class BottigliaFx {
    private readonly scene: Phaser.Scene;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    shards(x: number, y: number): void {
        sfx.bottleCrack();
        for (let i = 0; i < 7; i++) {
            const s = this.scene.add.image(x, y, FX.shard).setDepth(6);
            const a = rng.fx.next() * Math.PI * 2;
            this.scene.tweens.add({
                targets: s,
                x: x + Math.cos(a) * (30 + rng.fx.next() * 50),
                y: y + Math.sin(a) * (20 + rng.fx.next() * 30),
                angle: 260,
                alpha: 0,
                duration: 420,
                ease: 'Quad.easeOut',
                onComplete: () => s.destroy(),
            });
        }
    }

    puddle(x: number, y: number): { img: Phaser.GameObjects.Image; glow: Phaser.GameObjects.Image } {
        const img = this.scene.add.image(x, y, FX.puddle).setDepth(3);
        const glow = this.scene.add.image(x, y, `${FX.puddle}~glow`).setDepth(2)
            .setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.7);
        return { img, glow };
    }

    /** bolle che salgono e scoppiano */
    bubbles(p: Puddle): void {
        if (rng.fx.next() < 0.6) sfx.bubble();
        const bubble = this.scene.add.particles(p.x + (rng.fx.next() - 0.5) * 120, p.y, 'p-dot', {
            speed: { min: 20, max: 60 }, angle: { min: 250, max: 290 },
            scale: { start: 0.4, end: 0 }, tint: 0x99f6e4, lifespan: 500, quantity: 2, stopAfter: 2,
        });
        this.scene.time.delayedCall(800, () => bubble.destroy());
    }

    dry(p: Puddle): void {
        p.img.destroy();
        p.glow.destroy();
    }
}

/** la bottiglia di smela: scoppia su terreno o bersaglio e lascia una pozza che rallenta e avvelena */
export class Bottiglia {
    private puddles: Puddle[] = [];
    private readonly fx: BottigliaFx;
    private readonly ctx: AbilitiesCtx;
    private readonly scene: Phaser.Scene;
    private readonly veleno: Veleno;

    constructor(ctx: AbilitiesCtx, veleno: Veleno) {
        this.ctx = ctx;
        this.scene = ctx.scene;
        this.veleno = veleno;
        this.fx = new BottigliaFx(ctx.scene);
    }

    /** a terra la lanci ad arco, in aria la lasci cadere */
    cast({ x, y, facing, aim }: { x: number; y: number; facing: number; aim: 'lob' | 'drop' }): void {
        const bottle = this.scene.physics.add.sprite(x, y - 10, FX.bottle).setDepth(5);
        const body = bottle.body as Phaser.Physics.Arcade.Body;
        if (aim === 'lob') {
            const v = COMBAT.acquaBottleSpeed;
            body.setVelocity(facing * v * 0.82, -v * 0.57);
        } else {
            body.setVelocity(facing * 50, COMBAT.acquaBottleDropSpeed);
        }
        body.setAngularVelocity(facing * 540);
        body.setSize(20, 36);
        this.ctx.lighting.follow(bottle, 0x22d3ee, 120, 0.7);
        sfx.bottleThrow();
        const cols = [
            this.scene.physics.add.collider(bottle, this.ctx.world.level.layer, () => this.burst(bottle, null)),
            this.scene.physics.add.collider(bottle, this.ctx.world.level.breakableWalls, () => this.burst(bottle, null)),
            this.scene.physics.add.overlap(bottle, this.ctx.groups.enemies, (_b, obj) => this.burst(bottle, obj as Enemy)),
        ];
        if (this.ctx.bosses.current) {
            cols.push(this.scene.physics.add.overlap(bottle, this.ctx.bosses.current, (_b, obj) => this.burst(bottle, obj as Boss)));
        }
        // come per i boss: i collider muoiono con la bottiglia, altrimenti la lista del mondo cresce a ogni lancio
        bottle.once(Phaser.GameObjects.Events.DESTROY, () => {
            for (const c of cols) if (c.world) c.destroy();
        });
        this.scene.time.delayedCall(3000, () => bottle.active && this.burst(bottle, null));
    }

    /** la bottiglia scoppia: colpo diretto più pozza */
    private burst(bottle: Phaser.Physics.Arcade.Sprite, hit: Enemy | Boss | null): void {
        if (!bottle.active) return;
        const x = bottle.x;
        const y = bottle.y;
        bottle.destroy();
        this.fx.shards(x, y);
        // colpo diretto: effetto smela III, stordito e avvelenato (il boss non si stordisce)
        if (hit?.active) {
            this.veleno.apply(hit);
            if (hit instanceof Enemy) {
                hit.stun(COMBAT.acquaDirectStunMs);
                this.ctx.combat.dmgTo(hit, 1 * hitMult(hit.arch.kind, 'acqua'), x);
                this.ctx.player.onAttackHit();
            } else {
                this.ctx.combat.dmgTo(hit, 1, x);
                this.ctx.player.onAttackHit();
            }
        }
        this.spawnPuddle(x, y);
        waveWorld(this.scene, 'acquatossica', x, y, new Phaser.Geom.Circle(x, y, COMBAT.acquaRadius));
    }

    private spawnPuddle(x: number, y: number): void {
        while (this.puddles.length >= COMBAT.acquaMaxPuddles) {
            const old = this.puddles.shift();
            if (old) this.fx.dry(old);
        }
        // la pozza sta sul pavimento sotto il punto di scoppio, mai a mezz'aria
        y = puddleFloorY(x, y, (c, r) => this.ctx.world.nav.solid(c, r));
        const { img, glow } = this.fx.puddle(x, y);
        this.puddles.push({ img, glow, x, y, until: this.scene.time.now + COMBAT.acquaDurationMs, nextTick: 0, waveAt: 0 });
        // una pozza sopra un getto di vapore lo spegne per un po'
        this.ctx.traps?.suppress(x, y, COMBAT.acquaRadius, 6000);
    }

    update(time: number): void {
        const r = COMBAT.acquaRadius;
        for (let i = this.puddles.length - 1; i >= 0; i--) {
            const p = this.puddles[i]!;
            if (time >= p.until) {
                this.fx.dry(p);
                this.puddles.splice(i, 1);
                continue;
            }
            const tick = time >= p.nextTick;
            if (tick) {
                p.nextTick = time + COMBAT.acquaTickMs;
                this.fx.bubbles(p);
            }
            // gancio per il piano 7: la pozza tocca il mondo ogni 300 ms
            if (time - p.waveAt >= 300) {
                p.waveAt = time;
                waveWorld(this.scene, 'acquatossica', p.x, p.y, new Phaser.Geom.Circle(p.x, p.y, r));
            }
            for (const obj of this.ctx.groups.enemies.getChildren()) {
                const e = obj as Enemy;
                if (!e.active) continue;
                if (Math.abs(e.x - p.x) > r || Math.abs(e.y - p.y) > r * 0.7) continue;
                // rallentamento: smorza la velocità orizzontale finché è nella pozza
                const body = e.body as Phaser.Physics.Arcade.Body;
                body.velocity.x *= 0.45;
                this.veleno.apply(e);
                if (tick) {
                    this.ctx.combat.dmgTo(e, COMBAT.acquaDamage * hitMult(e.arch.kind, 'acqua'), e.x);
                    this.ctx.player.onAttackHit();
                }
            }
            const boss = this.ctx.bosses.current;
            if (boss?.active && Math.abs(boss.x - p.x) < r && Math.abs(boss.y - p.y) < r) {
                this.veleno.apply(boss);
            }
        }
    }

    destroy(): void {
        this.puddles.forEach((p) => this.fx.dry(p));
    }
}
