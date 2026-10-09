import type { Pt } from '../ink';
import { INK, type Painter, type ShapeOpts } from '../creatureKit';

/* pezzi comuni dei boss: teste da geco viste di fronte, gambe, braccia,
   scanline dei ricordi, aure. i boss non si girano (tranne quelli di profilo) */

export const TAU = Math.PI * 2;
export const sin = (t: number, k = 1, ph = 0): number => Math.sin((t * k + ph) * TAU);
export const cos = (t: number, k = 1, ph = 0): number => Math.cos((t * k + ph) * TAU);

/** testa da geco di fronte: larga, bocca lunga, un accenno di narici */
export function gecoHead(p: Painter, cx: number, cy: number, r: number, skin: number, o: ShapeOpts & { mouth?: 'flat' | 'grin' | 'frown' | 'none' } = {}): Pt[] {
    const pts = p.shape(p.ellipse(cx, cy, r * 1.12, r), skin, { hatch: 0.4, ...o });
    p.line([{ x: cx - 1, y: cy + r * 0.12 }, { x: cx - 0.6, y: cy + r * 0.16 }], 0.6, INK, 0.6);
    p.line([{ x: cx + 1, y: cy + r * 0.12 }, { x: cx + 0.6, y: cy + r * 0.16 }], 0.6, INK, 0.6);
    const m = o.mouth ?? 'flat';
    const my = cy + r * 0.45;
    if (m === 'flat') p.line(p.curve({ x: cx - r * 0.75, y: my - 1 }, { x: cx, y: my + 1 }, { x: cx + r * 0.75, y: my - 1 }, 6), 0.8);
    if (m === 'grin') p.line(p.curve({ x: cx - r * 0.85, y: my - 2 }, { x: cx, y: my + r * 0.35 }, { x: cx + r * 0.85, y: my - 2 }, 8), 0.9);
    if (m === 'frown') p.line(p.curve({ x: cx - r * 0.7, y: my + 1 }, { x: cx, y: my - 1.5 }, { x: cx + r * 0.7, y: my + 1 }, 6), 0.9);
    return pts;
}

/** due gambe viste di fronte, con un leggero ondeggiare */
export function frontLegs(p: Painter, cx: number, top: number, ground: number, gap: number, w: number, color: number, t: number, dangle = false): void {
    for (const [dx, ph] of [[-gap / 2, 0], [gap / 2, 0.5]] as const) {
        const sw = dangle ? sin(t, 1, ph) * 1.6 : 0;
        p.limb([{ x: cx + dx, y: top }, { x: cx + dx * 1.15 + sw * 0.5, y: (top + ground) / 2 }, { x: cx + dx * 1.1 + sw, y: ground - 1 }], w, w * 0.85, color, { hatch: 0.45 });
        p.shape(p.ellipse(cx + dx * 1.1 + sw + (dx < 0 ? -1.5 : 1.5), ground - 0.5, w * 0.85, w * 0.4), color, { hatch: 0, shadow: 0.4 });
    }
}

/** braccio a tre punti: spalla, gomito, mano (con la mano tonda) */
export function arm(p: Painter, pts: Pt[], w: number, color: number, hand = color): void {
    p.limb(pts, w, w * 0.8, color, { hatch: 0.4 });
    const e = pts[pts.length - 1];
    p.shape(p.ellipse(e.x, e.y, w * 0.62, w * 0.62), hand, { hatch: 0.2, shadow: 0.4 });
}

/** scanline dei ricordi corrotti: sul colore e sullo strato emissivo */
export function scanlines(p: Painter, x0: number, y0: number, w: number, h: number, color: number, f: number, alpha = 0.16): void {
    const r = (color >> 16) & 255;
    const g = (color >> 8) & 255;
    const b = color & 255;
    for (const c of [p.ctx, p.glowCtx]) {
        c.save();
        c.globalCompositeOperation = 'source-atop';
        c.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        for (let y = y0 + ((f * 1.5) % 4); y < y0 + h; y += 4) c.fillRect(x0, y, w, 0.8);
        c.restore();
    }
}

/** il ricordo che si sfalda: quadratini che si staccano dal bordo basso */
export function dissolve(p: Painter, cx: number, y: number, w: number, color: number, t: number): void {
    for (let k = 0; k < 7; k++) {
        const u = (t + k / 7) % 1;
        const x = cx - w / 2 + ((k * 37) % 11) / 11 * w;
        const s = 2.2 * (1 - u);
        p.flat(p.rect(x, y + u * 9, s, s), color, 0.75 * (1 - u), 0);
    }
}

/** aura piatta sullo strato emissivo */
export function aura(p: Painter, cx: number, cy: number, r: number, color: number, alpha = 0.25): void {
    const c = p.glowCtx;
    const g = c.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
    const rr = (color >> 16) & 255;
    const gg = (color >> 8) & 255;
    const bb = color & 255;
    g.addColorStop(0, `rgba(${rr},${gg},${bb},${alpha})`);
    g.addColorStop(1, `rgba(${rr},${gg},${bb},0)`);
    c.fillStyle = g;
    c.fillRect(cx - r, cy - r, r * 2, r * 2);
}

/** scritta a mano sullo sfondo (cartelli, etichette) */
export function label(p: Painter, text: string, x: number, y: number, size: number, color: string, glow = false): void {
    for (const c of glow ? [p.ctx, p.glowCtx] : [p.ctx]) {
        c.font = `bold ${size}px monospace`;
        c.fillStyle = color;
        c.fillText(text, x, y);
    }
}
