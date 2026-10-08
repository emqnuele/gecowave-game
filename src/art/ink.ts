/* toolkit per disegnare nello stile dei dipinti: contorni a inchiostro
   tremolanti, tratteggio incrociato, puntinato. tutto deterministico. */

import { hashString, mulberry32, type SeededRandom } from '../rules/hash';

// il caso con seme fa parte del kit: i moduli d'arte lo prendono da qui insieme al resto
export { hashString, mulberry32 };
export type Rng = SeededRandom;

export const range = (rnd: Rng, min: number, max: number): number => min + rnd() * (max - min);
export const pick = <T>(rnd: Rng, list: readonly T[]): T => list[Math.floor(rnd() * list.length)];

/* ---------- colore ---------- */

export function hex(n: number, alpha = 1): string {
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return alpha >= 1 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${alpha})`;
}

export function mix(a: number, b: number, t: number): number {
    const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
    const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
    const r = Math.round(ar + (br - ar) * t);
    const g = Math.round(ag + (bg - ag) * t);
    const bl = Math.round(ab + (bb - ab) * t);
    return (r << 16) | (g << 8) | bl;
}

export const shade = (c: number, t: number): number => (t < 0 ? mix(c, 0x000000, -t) : mix(c, 0xffffff, t));

/* ---------- canvas ---------- */

export function canvas(w: number, h: number): { el: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
    const el = document.createElement('canvas');
    el.width = Math.max(1, Math.ceil(w));
    el.height = Math.max(1, Math.ceil(h));
    const ctx = el.getContext('2d')!;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    return { el, ctx };
}

export interface Pt {
    x: number;
    y: number;
}

/** polilinea con tremolio da mano libera */
export function wobble(pts: Pt[], rnd: Rng, amp: number, step = 6): Pt[] {
    const out: Pt[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i];
        const b = pts[i + 1];
        const len = Math.hypot(b.x - a.x, b.y - a.y);
        const n = Math.max(1, Math.round(len / step));
        const nx = -(b.y - a.y) / (len || 1);
        const ny = (b.x - a.x) / (len || 1);
        for (let k = 0; k < n; k++) {
            const t = k / n;
            const j = k === 0 && i === 0 ? 0 : (rnd() - 0.5) * 2 * amp;
            out.push({ x: a.x + (b.x - a.x) * t + nx * j, y: a.y + (b.y - a.y) * t + ny * j });
        }
    }
    out.push(pts[pts.length - 1]);
    return out;
}

export function tracePath(ctx: CanvasRenderingContext2D, pts: Pt[], close = false): void {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    if (close) ctx.closePath();
}

/** linea d'inchiostro: spessore variabile simulato con due passate */
export function inkLine(ctx: CanvasRenderingContext2D, pts: Pt[], rnd: Rng, color: string, width = 2, amp = 0.8): void {
    const w = wobble(pts, rnd, amp);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    tracePath(ctx, w);
    ctx.stroke();
    ctx.lineWidth = width * 0.45;
    tracePath(ctx, wobble(pts, rnd, amp * 1.4));
    ctx.stroke();
}

/** forma chiusa riempita e contornata a inchiostro */
export function inkShape(ctx: CanvasRenderingContext2D, pts: Pt[], rnd: Rng, fill: string, ink: string, width = 2, amp = 1): void {
    const w = wobble([...pts, pts[0]], rnd, amp);
    ctx.fillStyle = fill;
    tracePath(ctx, w, true);
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = width;
    ctx.stroke();
}

/** tratteggio parallelo dentro il clip corrente */
export function hatch(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number,
    rnd: Rng, color: string, angle: number, spacing: number, width = 1, jitter = 0.4,
): void {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    const cx = x + w / 2;
    const cy = y + h / 2;
    const r = Math.hypot(w, h) / 2 + spacing;
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.beginPath();
    for (let o = -r; o < r; o += spacing * (1 + (rnd() - 0.5) * jitter)) {
        // tratti spezzati e di lunghezza irregolare: più mano, meno righello
        let s = -r + rnd() * spacing * 2;
        while (s < r) {
            const len = spacing * (3 + rnd() * 8);
            ctx.moveTo(s, o + (rnd() - 0.5));
            ctx.lineTo(s + len, o + (rnd() - 0.5));
            s += len + spacing * rnd() * 2;
        }
    }
    ctx.stroke();
    ctx.restore();
}

/** tratteggio incrociato con densità da 0 a 1 */
export function crossHatch(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number,
    rnd: Rng, color: string, density: number, width = 1,
): void {
    const spacing = 9 - density * 5;
    hatch(ctx, x, y, w, h, rnd, color, -0.7, spacing, width);
    if (density > 0.45) hatch(ctx, x, y, w, h, rnd, color, 0.75, spacing * 1.3, width * 0.8);
}

/** puntinato: granelli scuri o chiari sparsi */
export function stipple(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, rnd: Rng, color: string, count: number, size = 1.2): void {
    ctx.fillStyle = color;
    for (let i = 0; i < count; i++) {
        const s = size * (0.5 + rnd());
        ctx.fillRect(x + rnd() * w, y + rnd() * h, s, s);
    }
}

/** gradiente verticale rapido */
export function vGradient(ctx: CanvasRenderingContext2D, y0: number, y1: number, stops: [number, string][]): CanvasGradient {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    for (const [t, c] of stops) g.addColorStop(t, c);
    return g;
}

/** bagliore radiale morbido */
export function glowSpot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: number, alpha: number): void {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, hex(color, alpha));
    g.addColorStop(1, hex(color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

/* ---------- geometria ---------- */

/** chaikin: arrotonda una polilinea chiusa */
export function chaikinClosed(pts: Pt[], iterations: number): Pt[] {
    let cur = pts;
    for (let it = 0; it < iterations; it++) {
        const next: Pt[] = [];
        for (let i = 0; i < cur.length; i++) {
            const a = cur[i];
            const b = cur[(i + 1) % cur.length];
            next.push({ x: a.x * 0.75 + b.x * 0.25, y: a.y * 0.75 + b.y * 0.25 });
            next.push({ x: a.x * 0.25 + b.x * 0.75, y: a.y * 0.25 + b.y * 0.75 });
        }
        cur = next;
    }
    return cur;
}

/** rumore 1d liscio a valori, per contorni organici continui */
export function smoothNoise1D(seed: number): (x: number) => number {
    const rnd = mulberry32(seed);
    const table = Array.from({ length: 256 }, () => rnd() * 2 - 1);
    return (x: number) => {
        const i = Math.floor(x);
        const f = x - i;
        const a = table[i & 255];
        const b = table[(i + 1) & 255];
        const t = f * f * (3 - 2 * f);
        return a + (b - a) * t;
    };
}

/** rumore 2d a valori, per displacement dei contorni */
export function valueNoise2D(seed: number): (x: number, y: number) => number {
    const rnd = mulberry32(seed);
    const perm = Array.from({ length: 512 }, () => rnd() * 2 - 1);
    const at = (ix: number, iy: number) => perm[((ix * 73856093) ^ (iy * 19349663)) & 511];
    return (x: number, y: number) => {
        const ix = Math.floor(x);
        const iy = Math.floor(y);
        const fx = x - ix;
        const fy = y - iy;
        const sx = fx * fx * (3 - 2 * fx);
        const sy = fy * fy * (3 - 2 * fy);
        const a = at(ix, iy);
        const b = at(ix + 1, iy);
        const c = at(ix, iy + 1);
        const d = at(ix + 1, iy + 1);
        return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
    };
}
