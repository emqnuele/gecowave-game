import Phaser from 'phaser';
import { COMBAT } from '../../config';
import { FX } from '../../art/abilityFx';
import { sfx } from '../../audio/sfx';
import { waveLevel } from '../../rules/abilities';
import type { Act } from '../../coop/protocol';
import type { RemoteGeco } from './RemoteGeco';

/* le wave del compagno sul mio schermo: si vedono e si sentono come le sue,
   ma qui non toccano niente. i colpi veri li conta chi li ha lanciati */
export class RemoteFx {
    private readonly scene: Phaser.Scene;
    private clone: Phaser.GameObjects.Image | null = null;
    private cloneUntil = 0;
    private bubble: Phaser.GameObjects.Image | null = null;
    private bubbleUntil = 0;
    private circle: Phaser.GameObjects.Graphics | null = null;
    private glyphs: Phaser.GameObjects.Image[] = [];
    private circleUntil = 0;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    play(a: Act, who: RemoteGeco): void {
        switch (a.a) {
            case 'risonante': return this.wave(a.x, a.y, a.dir, a.level);
            case 'riflesso': return this.mirror(a.x, a.y, a.facing, who);
            case 'riflesso-swap': return this.swap(who);
            case 'scudo': return this.shield(who);
            case 'analisi': return this.analisi(who);
            case 'acqua': return this.bottle(a.x, a.y, a.facing, a.aim);
            default: return;
        }
    }

    private wave(x: number, y: number, dir: number, level: number): void {
        const lv = waveLevel(level);
        const key = lv === 2 ? FX.wave2 : lv === 1 ? FX.wave1 : FX.waveTap;
        const speed = lv === 2 ? COMBAT.risonanteFullSpeed : lv === 1 ? COMBAT.risonanteSpeed : COMBAT.risonanteEcoSpeed;
        const life = lv === 2 ? COMBAT.risonanteFullLifeMs : lv === 1 ? COMBAT.risonanteLifeMs : COMBAT.risonanteEcoLifeMs;
        if (lv === 2) sfx.shootFull();
        else if (lv === 1) sfx.shoot();
        else sfx.shootEco();
        const img = this.scene.add.image(x, y, key).setDepth(5).setFlipX(dir < 0);
        const glow = this.scene.add.image(x, y, `${key}~glow`).setDepth(4).setBlendMode(Phaser.BlendModes.ADD);
        const dist = (speed * life) / 1000;
        this.scene.tweens.add({
            targets: [img, glow], x: x + dir * dist, duration: life,
            onComplete: () => {
                img.destroy();
                glow.destroy();
            },
        });
        this.scene.tweens.add({ targets: [img, glow], alpha: 0, delay: life * 0.7, duration: life * 0.3 });
    }

    private mirror(x: number, y: number, facing: number, who: RemoteGeco): void {
        this.clone?.destroy();
        sfx.unlock();
        this.clone = this.scene.add.image(x, y, 'player2', 0).setScale(who.scaleX).setFlipX(facing < 0)
            .setAlpha(0.6).setTint(0xa5f3fc).setDepth(3.8).setPipeline('Light2D');
        this.cloneUntil = this.scene.time.now + COMBAT.riflessoDurationMs;
    }

    private swap(who: RemoteGeco): void {
        const c = this.clone;
        if (!c) return;
        const shard = (px: number, py: number) => {
            const p = this.scene.add.particles(px, py, 'p-spark', { speed: { min: 80, max: 200 }, scale: { start: 0.7, end: 0 }, tint: 0xa5f3fc, lifespan: 300, quantity: 10, stopAfter: 10 }).setDepth(6);
            this.scene.time.delayedCall(600, () => p.destroy());
        };
        shard(c.x, c.y);
        shard(who.x, who.y);
        c.setPosition(who.x, who.y);
    }

    private shield(who: RemoteGeco): void {
        this.bubble?.destroy();
        sfx.crt();
        this.bubble = this.scene.add.image(who.x, who.y, FX.shield).setDepth(6).setAlpha(0.9);
        this.bubbleUntil = this.scene.time.now + COMBAT.scudoDurationMs;
    }

    private analisi(who: RemoteGeco): void {
        this.clearCircle();
        sfx.chalk();
        this.circle = this.scene.add.graphics().setDepth(5);
        this.glyphs = FX.glyphs.map((k) => this.scene.add.image(who.x, who.y, k).setDepth(6));
        this.circleUntil = this.scene.time.now + COMBAT.analisiDurationMs;
    }

    private bottle(x: number, y: number, facing: number, aim: 'lob' | 'drop'): void {
        const b = this.scene.add.image(x, y - 10, FX.bottle).setDepth(5);
        const tx = aim === 'lob' ? x + facing * 220 : x;
        const ty = y + 30;
        this.scene.tweens.add({ targets: b, x: tx, duration: aim === 'lob' ? 520 : 300, ease: 'Linear' });
        this.scene.tweens.add({ targets: b, angle: facing * 540, duration: 520 });
        this.scene.tweens.add({
            targets: b, y: aim === 'lob' ? y - 90 : y, duration: 240, ease: 'Quad.easeOut',
            onComplete: () => this.scene.tweens.add({
                targets: b, y: ty, duration: 280, ease: 'Quad.easeIn',
                onComplete: () => {
                    b.destroy();
                    sfx.crumble();
                    const pool = this.scene.add.image(tx, ty + 6, FX.puddle).setDepth(3).setAlpha(0.85);
                    this.scene.tweens.add({ targets: pool, alpha: 0, delay: 3500, duration: 800, onComplete: () => pool.destroy() });
                },
            }),
        });
    }

    private clearCircle(): void {
        this.circle?.destroy();
        this.circle = null;
        for (const g of this.glyphs) g.destroy();
        this.glyphs = [];
    }

    /** a ogni fotogramma: scudo e cerchio seguono il compagno, il riflesso svanisce a tempo */
    update(who: RemoteGeco | null, time: number): void {
        if (this.clone && time >= this.cloneUntil) {
            const c = this.clone;
            this.clone = null;
            this.scene.tweens.add({ targets: c, alpha: 0, duration: 250, onComplete: () => c.destroy() });
        }
        if (this.bubble) {
            if (time >= this.bubbleUntil || !who?.active) {
                this.bubble.destroy();
                this.bubble = null;
            } else this.bubble.setPosition(who.x, who.y).setScale(1 + Math.sin(time / 90) * 0.03);
        }
        if (this.circle) {
            if (time >= this.circleUntil || !who?.active) this.clearCircle();
            else {
                const r = COMBAT.analisiRadius;
                this.circle.clear();
                this.circle.lineStyle(2.5, 0xdbeafe, 0.5);
                this.circle.strokeCircle(who.x, who.y, r);
                this.glyphs.forEach((g, i) => {
                    const angle = time / 280 + (i * Math.PI * 2) / 6;
                    g.setPosition(who.x + Math.cos(angle) * r * 0.7, who.y + Math.sin(angle) * r * 0.7).setRotation(angle + Math.PI / 2);
                });
            }
        }
    }

    destroy(): void {
        this.clone?.destroy();
        this.bubble?.destroy();
        this.clearCircle();
    }
}
