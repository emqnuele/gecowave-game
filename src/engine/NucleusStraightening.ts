import Phaser from 'phaser';
import { TILE } from '../config';
import { BOSS_BARKS } from '../content/barks';
import type { Boss } from '../entities/Boss';
import type { Player } from '../entities/Player';
import { bus } from './events';
import { music } from './music';
import { sfx } from './sfx';
import type { TerrainRenderer } from './TerrainRenderer';
import type { TrentatreMarks } from './TrentatreMarks';

/* l'ordine raddrizza il nucleo mentre combatti il glitch: le superfici
   prendono sovralinee dure, i muri finti diventano veri, i 33 si spengono.
   quando il glitch cade tutto si spezza in ordine inverso: lo storto resta. */

export type StraightPhase = 0 | 1 | 2 | 3;

export interface NucleusStraighteningContext {
    scene: Phaser.Scene;
    player: Player;
    terrain: TerrainRenderer;
    marks: TrentatreMarks;
    fakeWalls: Phaser.Physics.Arcade.StaticGroup;
    arenaBounds: Phaser.Geom.Rectangle;
    arenaDoorRects: readonly Phaser.Geom.Rectangle[];
    solid: (c: number, r: number) => boolean;
    music: typeof music;
    emitOrderShot: (x: number, y: number, tx: number, ty: number) => void;
}

/** rapporti hp, non valori: un riequilibrio del boss non spezza lo staging */
export function transitionFor(hp: number, maxHp: number): StraightPhase {
    if (maxHp <= 0 || hp <= 0) return 0;
    const k = hp / maxHp;
    if (k <= 0.15) return 3;
    if (k <= 1 / 3) return 2;
    if (k <= 2 / 3) return 1;
    return 0;
}

/** la riga dell'ordine, letta dai bark: il testo resta in barks.ts */
function orderLine(key: string, fallback: string): string {
    const pool = BOSS_BARKS.glitchpedro?.extra?.[key];
    const first = pool?.[0];
    return typeof first === 'string' ? first : fallback;
}

export class NucleusStraightening {
    private ctx: NucleusStraighteningContext;
    private phase: StraightPhase = 0;
    private pendingPhase: 1 | 2 | 3 | null = null;
    private queue: (1 | 2 | 3)[] = [];
    private activateAt = 0;
    private straightOverlay: Phaser.GameObjects.Graphics;
    private gridOverlay: Phaser.GameObjects.Graphics;
    private orderTelegraph: Phaser.GameObjects.Graphics | null = null;
    private dimRect: Phaser.GameObjects.Rectangle | null = null;
    private back33: Phaser.GameObjects.Text | null = null;
    private selectedWalls: Phaser.Physics.Arcade.Sprite[] = [];
    private selectedGroup: Phaser.Physics.Arcade.StaticGroup | null = null;
    private collider: Phaser.Physics.Arcade.Collider | null = null;
    private phase3ShotDone = false;
    private shattered = false;
    private lastBoss = { x: 0, y: 0 };

    constructor(ctx: NucleusStraighteningContext) {
        this.ctx = ctx;
        this.straightOverlay = ctx.scene.add.graphics().setDepth(4.7);
        this.gridOverlay = ctx.scene.add.graphics().setDepth(6);
    }

    update(time: number, boss: Boss | null): void {
        if (this.shattered) return;
        if (!boss || boss.def.kind !== 'glitchpedro' || !boss.active || !boss.engaged) {
            if (this.pendingPhase !== null && (!boss || !boss.active)) this.cancelPreview();
            return;
        }
        this.lastBoss = { x: boss.x, y: boss.y };
        const desired = transitionFor(boss.hp, boss.maxHp);
        for (let p = this.phase + 1; p <= desired; p++) {
            const next = p as 1 | 2 | 3;
            if (next !== this.pendingPhase && !this.queue.includes(next)) this.queue.push(next);
        }
        if (this.pendingPhase === null) {
            this.nextPreview(time);
            return;
        }
        if (time < this.activateAt) return;
        const done = this.pendingPhase;
        this.pendingPhase = null;
        this.applyPhase(done, boss);
        this.nextPreview(time);
    }

    /** il glitch cade: si spezza tutto in ordine inverso, senza danni */
    shatter(): void {
        if (this.shattered) return;
        this.shattered = true;
        this.pendingPhase = null;
        this.queue = [];
        this.phase = 0;
        // prima le collisioni, poi la grafica: mai chiuso nel rettangolo
        if (this.collider) {
            this.collider.destroy();
            this.collider = null;
        }
        if (this.selectedGroup) {
            this.selectedGroup.clear(false, false);
            this.selectedGroup.destroy();
            this.selectedGroup = null;
        }
        const sel = this.selectedWalls;
        this.selectedWalls = [];
        if (sel.length) {
            this.ctx.terrain.releaseStraightenedWalls(sel);
            this.ctx.marks.restoreExtinguished();
        }
        this.ctx.music.setOrder(0);
        this.straightOverlay.clear();
        this.gridOverlay.clear();
        this.orderTelegraph?.destroy();
        this.orderTelegraph = null;
        if (this.dimRect) {
            const dim = this.dimRect;
            this.dimRect = null;
            this.ctx.scene.tweens.add({ targets: dim, alpha: 0, duration: 600, onComplete: () => dim.destroy() });
        }
        this.back33Single();
        this.say('straight-break', '...errore. il realm non resta in riga.');
        sfx.orderBreak();
    }

    destroy(): void {
        if (this.collider) {
            this.collider.destroy();
            this.collider = null;
        }
        if (this.selectedGroup) {
            this.selectedGroup.clear(false, false);
            this.selectedGroup.destroy();
            this.selectedGroup = null;
        }
        this.selectedWalls = [];
        this.orderTelegraph?.destroy();
        this.orderTelegraph = null;
        this.dimRect?.destroy();
        this.dimRect = null;
        this.back33?.destroy();
        this.back33 = null;
        this.straightOverlay.destroy();
        this.gridOverlay.destroy();
        this.ctx.music.setOrder(0);
    }

    /** la soglia dopo accoda la sua attesa: mai un muro senza preavviso */
    private nextPreview(time: number): void {
        const next = this.queue.shift();
        if (next === undefined) return;
        this.pendingPhase = next;
        this.activateAt = time + 650;
        this.redraw();
        this.say(`straight-${next}`, this.fallbackLine(next));
        sfx.straighten();
    }

    private fallbackLine(next: 1 | 2 | 3): string {
        if (next === 2) return 'muri finti rilevati. resi veri.';
        if (next === 3) return 'segreti rilevati. rimossi.';
        return 'linee irregolari rilevate. correzione.';
    }

    private cancelPreview(): void {
        this.pendingPhase = null;
        this.redraw();
    }

    private say(key: string, fallback: string): void {
        bus.emit('bark', {
            speaker: "l'ordine",
            color: 'red',
            text: orderLine(key, fallback),
            glitch: true,
            urgent: true,
        });
    }

    /** disegna lo stato applicato più l'eventuale telegraph */
    private redraw(): void {
        const g = this.straightOverlay;
        g.clear();
        if (this.phase === 0 && this.pendingPhase === null) return;
        const b = this.ctx.arenaBounds;
        const closing = this.phase >= 2 || this.pendingPhase === 2 || this.pendingPhase === 3;
        g.lineStyle(this.pendingPhase !== null && this.phase === 0 ? 2 : 4, closing ? 0xffffff : 0xa5f3fc, this.pendingPhase !== null && this.phase === 0 ? 0.14 : 0.35);
        for (const seg of this.platformEdges()) {
            g.lineBetween(seg.x0, seg.y, seg.x1, seg.y);
        }
        if (this.phase >= 2) {
            // tre cavi verticali senza oscillazione
            g.lineStyle(2, 0xa5f3fc, 0.4);
            for (const fx of [0.25, 0.5, 0.75]) {
                const x = b.left + b.width * fx;
                g.lineBetween(x, b.top, x, b.bottom);
            }
        }
    }

    private applyPhase(next: 1 | 2 | 3, boss: Boss): void {
        this.phase = next;
        if (next === 1) {
            this.redraw();
            this.straightOverlay.setAlpha(0.4);
            this.ctx.scene.tweens.add({ targets: this.straightOverlay, alpha: 1, duration: 650, ease: 'Sine.easeOut' });
        } else if (next === 2) {
            const sel = this.selectWalls(boss);
            this.selectedWalls = sel;
            if (sel.length) {
                this.ctx.terrain.straightenFakeWalls(sel);
                this.ctx.marks.extinguishWalls(sel);
                const group = this.ctx.scene.physics.add.staticGroup();
                for (const w of sel) group.add(w);
                this.selectedGroup = group;
                this.collider = this.ctx.scene.physics.add.collider(this.ctx.player, group);
            }
            this.redraw();
        } else {
            this.paintGrid();
            this.fireOrderRow(boss.canStrike() ? 0 : 700);
        }
        this.ctx.music.setOrder(next);
        this.ctx.scene.cameras.main.shake(130, 0.004);
        sfx.orderLock();
    }

    /** solo muri finti dentro l'arena, lontani da porte e attori */
    private selectWalls(boss: Boss): Phaser.Physics.Arcade.Sprite[] {
        const walls = this.ctx.fakeWalls.getChildren() as Phaser.Physics.Arcade.Sprite[];
        if (!walls.length) return [];
        const playerBox = this.ctx.player.getBounds();
        const bossBox = boss.getBounds();
        const out: Phaser.Physics.Arcade.Sprite[] = [];
        for (const w of walls) {
            if (!w.active) continue;
            const box = w.getBounds();
            if (box.width === 0 || box.height === 0) continue;
            const inArena = Phaser.Geom.Intersects.RectangleToRectangle(box, this.ctx.arenaBounds);
            if (!inArena) continue;
            const nearDoor = this.ctx.arenaDoorRects.some((door) => Phaser.Geom.Intersects.RectangleToRectangle(box, door));
            if (nearDoor) continue;
            const overlapsActor = Phaser.Geom.Intersects.RectangleToRectangle(box, playerBox)
                || Phaser.Geom.Intersects.RectangleToRectangle(box, bossBox);
            if (overlapsActor) continue;
            out.push(w);
        }
        return out;
    }

    /** griglia sottile, bordi rossi sui veri e un velo quasi nero */
    private paintGrid(): void {
        const b = this.ctx.arenaBounds;
        const g = this.gridOverlay;
        g.clear();
        g.lineStyle(1, 0xf8fafc, 0.1);
        for (let x = b.left; x <= b.right; x += TILE) g.lineBetween(x, b.top, x, b.bottom);
        for (let y = b.top; y <= b.bottom; y += TILE) g.lineBetween(b.left, y, b.right, y);
        g.lineStyle(2, 0xf87171, 0.5);
        for (const w of this.selectedWalls) {
            if (!w.active) continue;
            const box = w.getBounds();
            g.strokeRect(box.x, box.y, box.width, box.height);
        }
        const cam = this.ctx.scene.cameras.main;
        this.dimRect = this.ctx.scene.add.rectangle(0, 0, cam.width, cam.height, 0x000000, 0)
            .setOrigin(0, 0).setScrollFactor(0).setDepth(6);
        this.ctx.scene.tweens.add({ targets: this.dimRect, alpha: 0.12, duration: 800, ease: 'Sine.easeOut' });
    }

    /** una sola riga schivabile, dal lato opposto al geco, con tre buchi larghi */
    private fireOrderRow(delayMs: number): void {
        if (this.phase3ShotDone) return;
        if (delayMs > 0) {
            this.ctx.scene.time.delayedCall(delayMs, () => {
                if (!this.shattered) this.fireOrderRow(0);
            });
            return;
        }
        this.phase3ShotDone = true;
        const b = this.ctx.arenaBounds;
        if (b.width < 7 * TILE) return;
        const fromTop = this.ctx.player.y > b.centerY;
        const y0 = fromTop ? b.top + 24 : b.bottom - 24;
        const y1 = fromTop ? b.bottom - 24 : b.top + 24;
        const xs = [0, 1, 3, 5].map((i) => b.left + (b.width * (i + 0.5)) / 7);
        const g = this.ctx.scene.add.graphics().setDepth(6);
        this.orderTelegraph = g;
        g.lineStyle(3, 0xf87171, 0.7);
        for (const x of xs) g.lineBetween(x, b.top + 8, x, b.bottom - 8);
        this.ctx.scene.tweens.add({ targets: g, alpha: 0.25, duration: 180, yoyo: true, repeat: 2 });
        this.ctx.scene.time.delayedCall(550, () => {
            if (this.shattered) return;
            g.destroy();
            if (this.orderTelegraph === g) this.orderTelegraph = null;
            for (const x of xs) this.ctx.emitOrderShot(x, y0, x, y1);
        });
    }

    /** un singolo 33 si riaccende vicino a pedro, per un attimo */
    private back33Single(): void {
        const scene = this.ctx.scene;
        this.back33?.destroy();
        const mark = scene.add.text(this.lastBoss.x - 60, this.lastBoss.y - 40, '33', {
            fontFamily: '"Permanent Marker", cursive',
            fontSize: '26px',
            color: '#7dd3fc',
        }).setOrigin(0.5).setDepth(6).setAlpha(0);
        this.back33 = mark;
        scene.tweens.add({ targets: mark, alpha: 0.85, duration: 500 });
        scene.tweens.add({ targets: mark, alpha: 0, delay: 1400, duration: 900, onComplete: () => mark.destroy() });
    }

    /** bordi superiori delle piattaforme solide dentro l'arena, fusi per riga */
    private platformEdges(): { x0: number; x1: number; y: number }[] {
        const b = this.ctx.arenaBounds;
        const c0 = Math.max(0, Math.floor(b.left / TILE));
        const c1 = Math.floor(b.right / TILE);
        const r0 = Math.max(0, Math.floor(b.top / TILE));
        const r1 = Math.floor(b.bottom / TILE);
        const out: { x0: number; x1: number; y: number }[] = [];
        for (let r = r0; r <= r1 && out.length < 240; r++) {
            let run = -1;
            for (let c = c0; c <= c1 + 1; c++) {
                const edge = c <= c1 && this.ctx.solid(c, r) && !this.ctx.solid(c, r - 1);
                if (edge && run < 0) run = c;
                if (!edge && run >= 0) {
                    const y = r * TILE;
                    out.push({ x0: Math.max(run * TILE, b.left), x1: Math.min(c * TILE, b.right), y });
                    run = -1;
                }
            }
        }
        return out;
    }
}
