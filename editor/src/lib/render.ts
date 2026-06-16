import type { LevelDef } from '@game/types';
import { textureForSpec } from './catalog';
import { tileFrameIndex } from './tileFrames';
import type { BakedTextures } from './textureBaker';

export const CELL = 28;

/* disegno di una singola cella, condiviso tra editor e anteprima. */
export function drawGlyph(
    ctx: CanvasRenderingContext2D,
    baked: BakedTextures,
    def: LevelDef,
    ch: string,
    c: number,
    r: number,
) {
    const x = c * CELL;
    const y = r * CELL;
    if (ch === '#' || ch === 'F' || ch === '%') {
        const frame = baked.tiles[tileFrameIndex(def.grid, c, r)] ?? baked.tiles[0];
        if (frame) ctx.drawImage(frame, x, y, CELL, CELL);
        if (ch === 'F') outline(ctx, x, y, '#facc15');
        if (ch === '%') outline(ctx, x, y, '#f87171');
        return;
    }
    if (ch === '~') {
        ctx.fillStyle = 'rgba(96,165,250,0.4)';
        ctx.fillRect(x, y, CELL, CELL);
        return;
    }
    if (ch === '^') return drawSprite(ctx, baked, 'spikes', x, y);
    if (ch === 'P') return badge(ctx, x, y, '#4ade80', 'P');
    if (ch === 'C') return drawSprite(ctx, baked, 'mic', x, y);
    if (ch === 'X') return badge(ctx, x, y, '#c084fc', 'X');
    const spec = def.entities[ch];
    if (spec) {
        drawSprite(ctx, baked, textureForSpec(spec), x, y);
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.font = '8px monospace';
        ctx.fillText(ch, x + 1, y + 8);
    } else {
        ctx.fillStyle = '#f87171';
        ctx.fillRect(x, y, CELL, CELL);
        ctx.fillStyle = '#000';
        ctx.font = '10px monospace';
        ctx.fillText(ch, x + 9, y + 18);
    }
}

export function drawSprite(ctx: CanvasRenderingContext2D, baked: BakedTextures, key: string, x: number, y: number) {
    const img = baked.sprites.get(key);
    if (!img) {
        ctx.fillStyle = '#333';
        ctx.fillRect(x + 4, y + 4, CELL - 8, CELL - 8);
        return;
    }
    const scale = Math.min(CELL / img.width, CELL / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, x + (CELL - w) / 2, y + (CELL - h) / 2, w, h);
}

export function outline(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 2]);
    ctx.strokeRect(x + 1, y + 1, CELL - 2, CELL - 2);
    ctx.setLineDash([]);
}

export function badge(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, label: string) {
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.25;
    ctx.fillRect(x, y, CELL, CELL);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, CELL - 2, CELL - 2);
    ctx.fillStyle = color;
    ctx.font = 'bold 14px monospace';
    ctx.fillText(label, x + 9, y + 19);
}

/* render completo, read-only, con fit automatico: per le anteprime. */
export function renderLevelFit(
    canvas: HTMLCanvasElement,
    baked: BakedTextures,
    def: LevelDef,
    changed?: Set<string>,
) {
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const cols = Math.max(...def.grid.map((r) => r.length), 1);
    const rows = def.grid.length;
    const pad = 16;
    const zoom = Math.max(0.05, Math.min((W - pad * 2) / (cols * CELL), (H - pad * 2) / (rows * CELL)));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate((W - cols * CELL * zoom) / 2, (H - rows * CELL * zoom) / 2);
    ctx.scale(zoom, zoom);
    ctx.fillStyle = '#0c0c12';
    ctx.fillRect(0, 0, cols * CELL, rows * CELL);
    for (let r = 0; r < rows; r++) {
        const row = def.grid[r] ?? '';
        for (let c = 0; c < cols; c++) {
            const ch = row[c] ?? '.';
            if (ch !== '.') drawGlyph(ctx, baked, def, ch, c, r);
            if (changed?.has(`${c},${r}`)) {
                ctx.strokeStyle = '#f59e0b';
                ctx.lineWidth = 2 / zoom;
                ctx.strokeRect(c * CELL, r * CELL, CELL, CELL);
            }
        }
    }
    ctx.restore();
}

/* insieme delle celle differenti tra due versioni, per evidenziare il diff. */
export function diffCells(a: LevelDef, b: LevelDef): Set<string> {
    const out = new Set<string>();
    const rows = Math.max(a.grid.length, b.grid.length);
    for (let r = 0; r < rows; r++) {
        const ra = a.grid[r] ?? '';
        const rb = b.grid[r] ?? '';
        const cols = Math.max(ra.length, rb.length);
        for (let c = 0; c < cols; c++) {
            if ((ra[c] ?? '.') !== (rb[c] ?? '.')) out.add(`${c},${r}`);
        }
    }
    return out;
}
