import Phaser from 'phaser';
import { TILE } from '../config';
import { BOSS_BARKS } from '../content/barks';
import type { Boss } from '../entities/Boss';
import type { Player } from '../entities/Player';
import { bus } from './events';
import { music } from './music';
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
    private activateAt = 0;
    private straightOverlay: Phaser.GameObjects.Graphics;
    private gridOverlay: Phaser.GameObjects.Graphics;
    private shattered = false;

    constructor(ctx: NucleusStraighteningContext) {
        this.ctx = ctx;
        this.straightOverlay = ctx.scene.add.graphics().setDepth(4.7);
        this.gridOverlay = ctx.scene.add.graphics().setDepth(6);
    }

    update(time: number, boss: Boss | null): void {
        if (this.shattered) return;
        if (!boss || boss.def.kind !== 'glitchpedro' || !boss.active || !boss.engaged) return;
        // fase a: solo l'allineamento visivo; le fasi 2-3 arrivano dopo
        const desired = Math.min(transitionFor(boss.hp, boss.maxHp), 1) as StraightPhase;
        if (this.pendingPhase !== null) {
            if (time < this.activateAt) return;
            this.applyPhase(this.pendingPhase);
            this.pendingPhase = null;
            return;
        }
        if (desired > this.phase && desired !== 0) {
            this.pendingPhase = desired as 1 | 2 | 3;
            this.activateAt = time + 650;
            this.preview();
            this.say(`straight-${desired}`, 'linee irregolari rilevate. correzione.');
        }
    }

    /** il glitch cade: si spezza tutto in ordine inverso, senza danni */
    shatter(): void {
        if (this.shattered) return;
        this.shattered = true;
        this.pendingPhase = null;
        this.phase = 0;
        this.straightOverlay.clear();
        this.gridOverlay.clear();
        this.say('straight-break', '...errore. il realm non resta in riga.');
    }

    destroy(): void {
        this.straightOverlay.destroy();
        this.gridOverlay.destroy();
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

    /** il telegraph: le linee si intravedono prima di tirare dritto */
    private preview(): void {
        this.straightOverlay.clear();
        this.straightOverlay.lineStyle(2, 0xa5f3fc, 0.14);
        for (const seg of this.platformEdges()) {
            this.straightOverlay.lineBetween(seg.x0, seg.y, seg.x1, seg.y);
        }
    }

    private applyPhase(next: 1 | 2 | 3): void {
        this.phase = next;
        if (next === 1) {
            this.straightOverlay.clear();
            this.straightOverlay.lineStyle(4, 0xa5f3fc, 0.35);
            for (const seg of this.platformEdges()) {
                this.straightOverlay.lineBetween(seg.x0, seg.y, seg.x1, seg.y);
            }
            this.straightOverlay.setAlpha(0.4);
            this.ctx.scene.tweens.add({ targets: this.straightOverlay, alpha: 1, duration: 650, ease: 'Sine.easeOut' });
            this.ctx.scene.cameras.main.shake(130, 0.004);
        }
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
