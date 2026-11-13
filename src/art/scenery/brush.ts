import { hatch, hex, mix, range, tracePath, wobble, type Pt, type Rng } from '../ink';
import type { Tone } from './palette';

/* il pennello dei piani: ogni forma è una massa con la sua mezzatinta,
   l'ombra sul lato opposto alla luce, il contorno a inchiostro e un filo di luce sul bordo */

export type Ctx = CanvasRenderingContext2D;
export type XY = [number, number];

export interface MassOpts {
    /** tratteggio sul lato in ombra, 0..1 */
    hatch?: number;
    /** niente sfumatura laterale: per le cose sottili */
    flat?: boolean;
    color?: number;
    noRim?: boolean;
    noInk?: boolean;
}

function bounds(pts: Pt[]): { x0: number; y0: number; x1: number; y1: number } {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of pts) {
        if (p.x < x0) x0 = p.x;
        if (p.x > x1) x1 = p.x;
        if (p.y < y0) y0 = p.y;
        if (p.y > y1) y1 = p.y;
    }
    return { x0, y0, x1, y1 };
}

/** massa chiusa dipinta: mezzatinta, ombra, inchiostro, luce sul bordo */
export function mass(ctx: Ctx, pts: XY[], t: Tone, rnd: Rng, o: MassOpts = {}): void {
    const closed = [...pts, pts[0]].map(([x, y]) => ({ x, y }));
    const P = wobble(closed, rnd, t.wob, 16);
    const b = bounds(P);
    const body = o.color ?? t.body;
    tracePath(ctx, P, true);
    if (o.flat || b.x1 - b.x0 < 10) {
        ctx.fillStyle = hex(body);
    } else {
        const g = ctx.createLinearGradient(b.x0, 0, b.x1, 0);
        const lit = o.color === undefined ? t.light : mix(body, t.light, 0.5);
        const dim = o.color === undefined ? t.shadow : mix(body, t.shadow, 0.6);
        const stops: [number, number][] = [[0, lit], [0.42, body], [1, dim]];
        for (const [at, c] of stops) g.addColorStop(t.dir > 0 ? 1 - at : at, hex(c));
        ctx.fillStyle = g;
    }
    ctx.fill();
    if (o.hatch && t.depth > 0 && b.x1 - b.x0 > 24) {
        ctx.save();
        ctx.clip();
        const w = (b.x1 - b.x0) * 0.38;
        const x = t.dir > 0 ? b.x0 : b.x1 - w;
        hatch(ctx, x, b.y0, w, b.y1 - b.y0, rnd, hex(t.shadow, 0.55 * o.hatch), -0.95, 6 + (2 - t.depth) * 2, 1);
        ctx.restore();
        tracePath(ctx, P, true);
    }
    if (t.ink && !o.noInk) {
        ctx.strokeStyle = t.ink;
        ctx.lineWidth = t.inkW;
        ctx.stroke();
    }
    if (t.rim && !o.noRim) rimLight(ctx, P, t);
}

/** il filo di luce: solo sui tratti di bordo che guardano il cielo o la luce */
function rimLight(ctx: Ctx, P: Pt[], t: Tone): void {
    let area = 0;
    for (let i = 0; i < P.length - 1; i++) area += P[i].x * P[i + 1].y - P[i + 1].x * P[i].y;
    const sign = area > 0 ? 1 : -1;
    ctx.strokeStyle = t.rim!;
    ctx.lineWidth = t.inkW * 0.9;
    ctx.beginPath();
    let pen = false;
    for (let i = 0; i < P.length - 1; i++) {
        const dx = P[i + 1].x - P[i].x;
        const dy = P[i + 1].y - P[i].y;
        const len = Math.hypot(dx, dy) || 1;
        // normale verso fuori
        const nx = (dy / len) * sign;
        const ny = (-dx / len) * sign;
        const facing = nx * t.dir * 0.55 - ny * 0.83;
        if (facing > 0.35) {
            // spostato dentro la forma: sta sotto l'inchiostro, non sopra
            const ox = -nx * t.inkW;
            const oy = -ny * t.inkW;
            if (!pen) ctx.moveTo(P[i].x + ox, P[i].y + oy);
            ctx.lineTo(P[i + 1].x + ox, P[i + 1].y + oy);
            pen = true;
        } else {
            pen = false;
        }
    }
    ctx.stroke();
}

export const box = (x: number, y: number, w: number, h: number): XY[] => [[x, y + h], [x, y], [x + w, y], [x + w, y + h]];

/** arto affusolato: tronchi, rami, pali. open lascia aperte le teste, per chi ne mette tanti in fila */
export function limb(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, w0: number, w1: number, t: Tone, rnd: Rng, o: MassOpts & { open?: boolean } = {}): void {
    const len = Math.hypot(x1 - x0, y1 - y0) || 1;
    const nx = -(y1 - y0) / len;
    const ny = (x1 - x0) / len;
    const a: XY = [x0 + (nx * w0) / 2, y0 + (ny * w0) / 2];
    const b: XY = [x1 + (nx * w1) / 2, y1 + (ny * w1) / 2];
    const c: XY = [x1 - (nx * w1) / 2, y1 - (ny * w1) / 2];
    const d: XY = [x0 - (nx * w0) / 2, y0 - (ny * w0) / 2];
    const thin = Math.max(w0, w1) < 9;
    if (!o.open) {
        mass(ctx, [a, b, c, d], t, rnd, { flat: thin, noRim: Math.max(w0, w1) < 5, ...o });
        return;
    }
    mass(ctx, [a, b, c, d], t, rnd, { flat: thin, ...o, noInk: true, noRim: true });
    if (!t.ink) return;
    // solo i fianchi: il lato verso la luce prende il filo chiaro
    const litSide = nx * t.dir * 0.55 - ny * 0.83 > 0;
    const sides: [XY, XY, boolean][] = [[a, b, litSide], [d, c, !litSide]];
    for (const [p, q, isLit] of sides) {
        ctx.strokeStyle = isLit && t.rim && !thin ? t.rim : t.ink;
        ctx.lineWidth = t.inkW * (thin ? 0.7 : 1);
        ctx.beginPath();
        ctx.moveTo(p[0], p[1]);
        ctx.lineTo(q[0], q[1]);
        ctx.stroke();
    }
}

/** filo, cavo, ringhiera: un tratto del colore della massa */
export function wire(ctx: Ctx, pts: XY[], width: number, t: Tone, alpha = 1): void {
    ctx.strokeStyle = hex(t.shadow, alpha);
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
}

/** cavo che pende tra due punti */
export function sag(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, drop: number, width: number, t: Tone, alpha = 1): void {
    ctx.strokeStyle = hex(t.shadow, alpha);
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo((x0 + x1) / 2, Math.max(y0, y1) + drop, x1, y1);
    ctx.stroke();
}

/** segni d'inchiostro sottili: crepe, mattoni, assi */
export function marks(ctx: Ctx, t: Tone, alpha = 1): boolean {
    if (!t.ink || t.depth === 0) return false;
    ctx.strokeStyle = hex(t.shadow, 0.75 * alpha);
    ctx.lineWidth = Math.max(0.8, t.inkW * 0.55);
    return true;
}

/** una luce accesa: il vetro e il suo alone sommato */
export function lit(ctx: Ctx, x: number, y: number, w: number, h: number, t: Tone, halo = 1.6, color = t.glow): void {
    ctx.fillStyle = hex(color, t.glowA);
    ctx.fillRect(x, y, w, h);
    glow(ctx, x + w / 2, y + h / 2, Math.max(w, h) * halo + 6, t, 0.22, color);
}

export function glow(ctx: Ctx, x: number, y: number, r: number, t: Tone, alpha: number, color = t.glow): void {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, hex(color, alpha * t.glowA));
    g.addColorStop(1, hex(color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.restore();
}

/** griglia di finestre: buchi scuri, qualcuna accesa */
export function windowGrid(
    ctx: Ctx, x: number, y: number, w: number, h: number, t: Tone, rnd: Rng,
    o: { cw?: number; ch?: number; gx?: number; gy?: number; lit?: number; blinds?: boolean; arch?: boolean } = {},
): void {
    const cw = o.cw ?? 9;
    const ch = o.ch ?? 13;
    const gx = o.gx ?? 9;
    const gy = o.gy ?? 12;
    const cols = Math.max(1, Math.floor((w - gx) / (cw + gx)));
    const rows = Math.max(1, Math.floor((h - gy) / (ch + gy)));
    const ox = x + (w - cols * (cw + gx) + gx) / 2;
    const oy = y + gy * 0.8;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const wx = ox + c * (cw + gx);
            const wy = oy + r * (ch + gy);
            const on = rnd() < (o.lit ?? 0);
            if (rnd() < 0.08) continue;
            if (o.arch) {
                ctx.beginPath();
                ctx.moveTo(wx, wy + ch);
                ctx.lineTo(wx, wy + cw * 0.5);
                ctx.quadraticCurveTo(wx + cw / 2, wy - cw * 0.5, wx + cw, wy + cw * 0.5);
                ctx.lineTo(wx + cw, wy + ch);
                ctx.closePath();
                ctx.fillStyle = on ? hex(t.glow, t.glowA) : t.recess;
                ctx.fill();
                if (on) glow(ctx, wx + cw / 2, wy + ch / 2, ch * 1.4, t, 0.2);
                continue;
            }
            if (on) lit(ctx, wx, wy, cw, ch, t, 1.3);
            else {
                ctx.fillStyle = t.recess;
                ctx.fillRect(wx, wy, cw, ch);
            }
            if (o.blinds && t.depth > 0) {
                ctx.fillStyle = hex(on ? t.shadow : t.body, 0.5);
                for (let k = 2; k < ch * (0.4 + rnd() * 0.6); k += 3) ctx.fillRect(wx, wy + k, cw, 1);
            }
            // davanzale in luce
            if (t.depth > 0) {
                ctx.fillStyle = hex(t.light, 0.5);
                ctx.fillRect(wx - 1, wy + ch, cw + 2, 1.2);
            }
        }
    }
}

/** corsi di mattoni o pietre accennati qua e là, mai su tutta la parete */
export function masonry(ctx: Ctx, x: number, y: number, w: number, h: number, t: Tone, rnd: Rng, density = 0.25): void {
    if (!marks(ctx, t, 0.6)) return;
    ctx.beginPath();
    for (let cy = y + 8; cy < y + h - 4; cy += 9) {
        for (let cx = x + 4; cx < x + w - 14; cx += 18) {
            if (rnd() > density) continue;
            const off = (Math.round((cy - y) / 9) % 2) * 9;
            ctx.moveTo(cx + off, cy);
            ctx.lineTo(cx + off + range(rnd, 8, 16), cy);
            if (rnd() > 0.5) {
                ctx.moveTo(cx + off, cy);
                ctx.lineTo(cx + off, cy - 8);
            }
        }
    }
    ctx.stroke();
}

/** crepa a zigzag */
export function crack(ctx: Ctx, x: number, y: number, len: number, t: Tone, rnd: Rng): void {
    if (!marks(ctx, t)) return;
    ctx.beginPath();
    ctx.moveTo(x, y);
    let cx = x;
    let cy = y;
    const n = 3 + Math.floor(rnd() * 4);
    for (let i = 0; i < n; i++) {
        cx += range(rnd, -9, 9);
        cy += len / n;
        ctx.lineTo(cx, cy);
        if (rnd() > 0.6) {
            ctx.lineTo(cx + range(rnd, -12, 12), cy + range(rnd, 2, 10));
            ctx.moveTo(cx, cy);
        }
    }
    ctx.stroke();
}

/** mucchio di macerie o sacchi: gobbe sovrapposte */
export function heap(ctx: Ctx, x: number, base: number, w: number, h: number, t: Tone, rnd: Rng, lumps = 5): void {
    for (let i = 0; i < lumps; i++) {
        const lw = (w / lumps) * range(rnd, 1.1, 1.9);
        const lx = x + (i / lumps) * w + range(rnd, -6, 6);
        const lh = h * range(rnd, 0.45, 1) * (1 - Math.abs(i / (lumps - 1 || 1) - 0.5) * 0.9);
        const pts: XY[] = [[lx, base + 4]];
        const n = 5;
        for (let k = 0; k <= n; k++) {
            const a = Math.PI * (k / n);
            pts.push([lx + lw / 2 - Math.cos(a) * lw / 2, base - Math.sin(a) * lh * range(rnd, 0.8, 1.1)]);
        }
        pts.push([lx + lw, base + 4]);
        mass(ctx, pts, t, rnd, { hatch: 0.6 });
    }
}

/** fumo o vapore: sbuffi chiari che salgono e si allargano */
export function smoke(ctx: Ctx, x: number, y: number, t: Tone, rise = 120, drift = 50): void {
    for (let k = 0; k < 7; k++) {
        const f = k / 6;
        const r = 10 + f * 34;
        const g = ctx.createRadialGradient(x + drift * f * t.dir, y - rise * f, 0, x + drift * f * t.dir, y - rise * f, r);
        g.addColorStop(0, hex(mix(t.haze, 0xffffff, 0.25), 0.2 * (1 - f * 0.7)));
        g.addColorStop(1, hex(t.haze, 0));
        ctx.fillStyle = g;
        ctx.fillRect(x + drift * f * t.dir - r, y - rise * f - r, r * 2, r * 2);
    }
}
