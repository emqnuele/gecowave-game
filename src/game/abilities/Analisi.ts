import Phaser from 'phaser';
import { COMBAT } from '../../config';
import { hitMult } from '../../content/lessons';
import { FX } from '../../engine/art/abilityFx';
import { sfx } from '../../engine/sfx';
import { state } from '../../engine/state';
import type { Enemy } from '../../entities/Enemy';
import { waveWorld, type AbilitiesCtx } from './shared';

/** il gesso dell'analisi: cerchio, sei teoremi che girano, x sui segnati, il q.e.d. */
class AnalisiFx {
    private circle: Phaser.GameObjects.Graphics | null = null;
    private glyphs: Phaser.GameObjects.Image[] = [];
    private readonly marks = new Map<Enemy, Phaser.GameObjects.Image>();
    private qed: Phaser.GameObjects.Image | null = null;
    private readonly scene: Phaser.Scene;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    begin(): void {
        this.circle = this.scene.add.graphics().setDepth(5);
        sfx.chalk();
        this.scene.cameras.main.flash(90, 96, 165, 250);
    }

    /** ipotesi: il cerchio si disegna */
    drawArc(px: number, py: number, r: number, t: number): void {
        this.circle?.clear();
        this.circle?.lineStyle(4, 0xdbeafe, 0.85);
        this.circle?.beginPath();
        this.circle?.arc(px, py, r, -Math.PI / 2, -Math.PI / 2 + t * Math.PI * 2);
        this.circle?.strokePath();
    }

    /** passaggi: i sei teoremi cominciano a girare */
    showGlyphs(px: number, py: number): void {
        this.glyphs = FX.glyphs.map((k) => this.scene.add.image(px, py, k).setDepth(6));
    }

    drawCircle(px: number, py: number, r: number, time: number): void {
        this.circle?.clear();
        this.circle?.lineStyle(2.5, 0xdbeafe, 0.5);
        this.circle?.strokeCircle(px, py, r);
        this.glyphs.forEach((g, i) => {
            const angle = time / 280 + (i * Math.PI * 2) / 6;
            g.setPosition(px + Math.cos(angle) * r * 0.7, py + Math.sin(angle) * r * 0.7);
            g.setRotation(angle + Math.PI / 2);
        });
    }

    tick(): void {
        sfx.analisiTick();
    }

    mark(e: Enemy): void {
        const mark = this.scene.add.image(e.x, e.y - 52, FX.chalkX).setDepth(7);
        this.marks.set(e, mark);
    }

    /** le x restano sopra la testa di chi è segnato; ritorna chi non c'è più */
    followMarks(): Enemy[] {
        const gone: Enemy[] = [];
        for (const [e, mark] of this.marks) {
            if (!e.active) {
                mark.destroy();
                this.marks.delete(e);
                gone.push(e);
                continue;
            }
            mark.setPosition(e.x, e.y - 52);
        }
        return gone;
    }

    proved(px: number, py: number): void {
        this.qed?.destroy();
        this.qed = this.scene.add.image(px, py - 70, FX.qed).setDepth(7).setScale(0.6).setAlpha(0);
        this.scene.tweens.add({ targets: this.qed, alpha: 1, scaleX: 1, scaleY: 1, duration: 220 });
        sfx.qed();
        this.scene.cameras.main.flash(120, 219, 234, 254);
    }

    clear(): void {
        for (const m of this.marks.values()) m.destroy();
        this.marks.clear();
        this.glyphs.forEach((g) => g.destroy());
        this.glyphs = [];
        this.circle?.destroy();
        this.circle = null;
        if (this.qed) {
            const q = this.qed;
            this.qed = null;
            this.scene.tweens.add({ targets: q, alpha: 0, duration: 300, onComplete: () => q.destroy() });
        }
    }
}

/** l'analisi: dimostrazione in tre tempi attorno al geco, ipotesi, passaggi, q.e.d. */
export class Analisi {
    private until = 0;
    private nextTick = 0;
    private phase: 0 | 1 | 2 | 3 = 0;
    private start = 0;
    private qedDone = false;
    private readonly marked = new Set<Enemy>();
    private bossMarked = false;
    private readonly fx: AnalisiFx;
    private readonly ctx: AbilitiesCtx;
    private readonly scene: Phaser.Scene;

    constructor(ctx: AbilitiesCtx) {
        this.ctx = ctx;
        this.scene = ctx.scene;
        this.fx = new AnalisiFx(ctx.scene);
    }

    cast(): void {
        this.clear();
        this.start = this.scene.time.now;
        this.until = this.start + COMBAT.analisiDurationMs;
        this.phase = 1;
        this.qedDone = false;
        this.nextTick = 0;
        this.fx.begin();
    }

    /** il cerchio segue il geco */
    update(time: number): void {
        if (this.phase === 0) return;
        const elapsed = time - this.start;
        if (time >= this.until) {
            this.clear();
            return;
        }
        const px = this.ctx.player.x;
        const py = this.ctx.player.y;
        const r = COMBAT.analisiRadius;
        if (elapsed < 600) {
            // ipotesi: il cerchio si disegna e chi è dentro viene segnato
            this.fx.drawArc(px, py, r, elapsed / 600);
            this.markTargets(px, py, r);
        } else {
            if (this.phase === 1) {
                this.phase = 2;
                this.fx.showGlyphs(px, py);
            }
            this.fx.drawCircle(px, py, r, time);
            this.markTargets(px, py, r);
            if (time >= this.nextTick) {
                this.nextTick = time + COMBAT.analisiTickMs;
                this.fx.tick();
                for (const obj of this.ctx.groups.enemies.getChildren()) {
                    const e = obj as Enemy;
                    if (!e.active || Math.hypot(e.x - px, e.y - py) >= r) continue;
                    const mult = hitMult(e.arch.kind, 'analisi');
                    this.ctx.combat.dmgTo(e, 1 * state.damageMult * mult, px);
                    this.ctx.combat.weakFeedback(e, mult);
                    this.ctx.player.onAttackHit();
                }
                const boss = this.ctx.bosses.current;
                if (boss?.active && Math.hypot(boss.x - px, boss.y - py) < r + 40) {
                    this.ctx.combat.dmgTo(boss, 1 * state.damageMult, px);
                    this.ctx.player.onAttackHit();
                }
            }
            if (elapsed >= 1800 && !this.qedDone) {
                this.qedDone = true;
                this.phase = 3;
                this.qed(px, py, r);
            }
        }
        for (const e of this.fx.followMarks()) this.marked.delete(e);
    }

    /** chi è nel cerchio viene segnato con una x di gesso */
    private markTargets(px: number, py: number, r: number): void {
        for (const obj of this.ctx.groups.enemies.getChildren()) {
            const e = obj as Enemy;
            if (!e.active || this.marked.has(e)) continue;
            if (Math.hypot(e.x - px, e.y - py) >= r) continue;
            this.marked.add(e);
            this.fx.mark(e);
        }
        const boss = this.ctx.bosses.current;
        if (boss?.active && !this.bossMarked && Math.hypot(boss.x - px, boss.y - py) < r + 40) {
            this.bossMarked = true;
        }
    }

    /** q.e.d.: chi è ancora segnato paga */
    private qed(px: number, py: number, r: number): void {
        for (const e of [...this.marked]) {
            if (!e.active || Math.hypot(e.x - px, e.y - py) >= r) continue;
            const mult = hitMult(e.arch.kind, 'analisi');
            this.ctx.combat.dmgTo(e, COMBAT.analisiQedDamage * state.damageMult * mult, px);
            const body = e.body as Phaser.Physics.Arcade.Body | null;
            body?.setVelocity(Math.sign(e.x - px) * 320, -200);
            this.ctx.combat.weakFeedback(e, mult);
            this.ctx.player.onAttackHit();
        }
        const boss = this.ctx.bosses.current;
        if (this.bossMarked && boss?.active && Math.hypot(boss.x - px, boss.y - py) < r + 40) {
            this.ctx.combat.dmgTo(boss, COMBAT.analisiQedBossDamage * state.damageMult, px);
            this.ctx.player.onAttackHit();
        }
        this.fx.proved(px, py);
        waveWorld(this.scene, 'analisi', px, py, new Phaser.Geom.Circle(px, py, r));
    }

    private clear(): void {
        this.phase = 0;
        this.qedDone = false;
        this.marked.clear();
        this.bossMarked = false;
        this.fx.clear();
    }
}
