import type { BiomeDef } from '../../content/biomes';
import { canvas, hashString, hex, mix, mulberry32, range, shade, type Rng } from '../ink';
import type { Ctx } from './brush';
import { SKY_W } from './layers';
import type { ScenePalette } from './palette';

/* il primo piano: sagome scure a un palmo dall'obiettivo, in alto e in basso.
   incorniciano senza coprire, fuori fuoco quanto basta a dire che sono vicine */

export const FG_H = 300;

type Kind = BiomeDef['foreground'];
type Draw = (ctx: Ctx, x: number, y0: number, dir: 1 | -1, rnd: Rng, accent: string) => void;

/** foglia a mandorla lungo una direzione */
function leaf(ctx: Ctx, x: number, y: number, a: number, len: number, wide: number): void {
    const ex = x + Math.cos(a) * len;
    const ey = y + Math.sin(a) * len;
    const nx = -Math.sin(a) * wide;
    const ny = Math.cos(a) * wide;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo((x + ex) / 2 + nx, (y + ey) / 2 + ny, ex, ey);
    ctx.quadraticCurveTo((x + ex) / 2 - nx, (y + ey) / 2 - ny, x, y);
    ctx.fill();
}

/** stelo curvo campionato: restituisce punto e tangente */
function stem(x0: number, y0: number, cx: number, cy: number, x1: number, y1: number): (t: number) => { x: number; y: number; a: number } {
    return (t) => {
        const u = 1 - t;
        const x = u * u * x0 + 2 * u * t * cx + t * t * x1;
        const y = u * u * y0 + 2 * u * t * cy + t * t * y1;
        const dx = 2 * u * (cx - x0) + 2 * t * (x1 - cx);
        const dy = 2 * u * (cy - y0) + 2 * t * (y1 - cy);
        return { x, y, a: Math.atan2(dy, dx) };
    };
}

const leaves: Draw = (ctx, x, y0, dir, rnd) => {
    if (dir > 0) {
        // rampicanti che scendono dall'alto, con le foglie alterne
        const n = 2 + Math.floor(rnd() * 3);
        for (let i = 0; i < n; i++) {
            const bx = x + i * range(rnd, 26, 60);
            const len = range(rnd, 110, 270);
            const sway = range(rnd, -60, 60);
            const at = stem(bx, -6, bx + sway * 0.2, len * 0.6, bx + sway, len);
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(bx, -6);
            ctx.quadraticCurveTo(bx + sway * 0.2, len * 0.6, bx + sway, len);
            ctx.stroke();
            const count = Math.floor(len / 17);
            for (let k = 1; k <= count; k++) {
                const p = at(k / count);
                const size = 26 - (k / count) * 12;
                leaf(ctx, p.x, p.y, p.a + (k % 2 ? 1.05 : -1.05), size, size * 0.34);
            }
        }
        return;
    }
    // felci che salgono ad arco dal bordo
    const n = 3 + Math.floor(rnd() * 3);
    for (let i = 0; i < n; i++) {
        const bx = x + (rnd() - 0.5) * 90;
        const len = range(rnd, 130, 260);
        const lean = (rnd() - 0.5) * 220;
        const at = stem(bx, y0 + 6, bx + lean * 0.25, y0 - len * 0.85, bx + lean, y0 - len * range(rnd, 0.6, 0.9));
        ctx.lineWidth = 4;
        ctx.beginPath();
        const tip = at(1);
        ctx.moveTo(bx, y0 + 6);
        ctx.quadraticCurveTo(bx + lean * 0.25, y0 - len * 0.85, tip.x, tip.y);
        ctx.stroke();
        for (let k = 2; k <= 15; k++) {
            const p = at(k / 15);
            const size = 46 * Math.sin((k / 15) * Math.PI * 0.92) + 8;
            for (const side of [-1, 1]) leaf(ctx, p.x, p.y, p.a + side * 1.15, size, size * 0.22);
        }
    }
};

const cables: Draw = (ctx, x, y0, dir, rnd) => {
    const n = 2 + Math.floor(rnd() * 3);
    for (let i = 0; i < n; i++) {
        const span = range(rnd, 220, 520);
        const drop = range(rnd, 50, 190);
        ctx.lineWidth = range(rnd, 3, 8);
        ctx.beginPath();
        if (dir > 0) {
            ctx.moveTo(x, -4);
            ctx.quadraticCurveTo(x + span / 2, drop * 2, x + span, -4);
        } else {
            ctx.moveTo(x, y0 + 4);
            ctx.quadraticCurveTo(x + span / 2, y0 - 50 - drop * 0.3, x + span, y0 + 4);
        }
        ctx.stroke();
    }
    if (dir > 0) {
        // un cavo staccato che pende, con l'isolatore in fondo
        const cx = x + range(rnd, 40, 200);
        const len = range(rnd, 90, 210);
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(cx, -4);
        ctx.bezierCurveTo(cx + 14, len * 0.4, cx - 18, len * 0.7, cx + 6, len);
        ctx.stroke();
        ctx.beginPath();
        ctx.roundRect(cx - 2, len - 4, 16, 26, 5);
        ctx.fill();
    }
};

const chains: Draw = (ctx, x, y0, dir, rnd) => {
    if (dir < 0) {
        // bocche di botte che spuntano dal basso
        const r = range(rnd, 50, 90);
        for (let i = 0; i < 1 + Math.floor(rnd() * 2); i++) {
            ctx.beginPath();
            ctx.arc(x + i * r * 1.9, y0 + r * 0.35, r, Math.PI, 0);
            ctx.fill();
        }
        return;
    }
    const n = 1 + Math.floor(rnd() * 3);
    for (let i = 0; i < n; i++) {
        const cx = x + i * range(rnd, 26, 50);
        const len = range(rnd, 110, FG_H - 50);
        ctx.lineWidth = 4.5;
        let y = -4;
        let flat = false;
        while (y < len) {
            // anelli alterni: uno di faccia, uno di taglio
            ctx.beginPath();
            if (flat) ctx.ellipse(cx, y + 8, 2.5, 10, 0, 0, Math.PI * 2);
            else ctx.ellipse(cx, y + 8, 7, 10, 0, 0, Math.PI * 2);
            ctx.stroke();
            y += 14;
            flat = !flat;
        }
        // il gancio
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(cx, y + 14, 11, -Math.PI * 0.5, Math.PI * 0.9);
        ctx.stroke();
    }
};

const pillars: Draw = (ctx, x, y0, dir, rnd) => {
    const w = range(rnd, 56, 92);
    if (dir > 0) {
        // costolone d'arco gotico: sottile, entra appena dal bordo
        const span = range(rnd, 300, 460);
        const dip = range(rnd, 90, 150);
        ctx.lineWidth = range(rnd, 18, 26);
        ctx.beginPath();
        ctx.moveTo(x, -20);
        ctx.quadraticCurveTo(x + span * 0.2, dip, x + span / 2, dip * 0.72);
        ctx.quadraticCurveTo(x + span * 0.8, dip, x + span, -20);
        ctx.stroke();
        // il pendaglio della chiave di volta
        ctx.beginPath();
        ctx.moveTo(x + span / 2 - 9, dip * 0.72);
        ctx.lineTo(x + span / 2, dip * 0.72 + 34);
        ctx.lineTo(x + span / 2 + 9, dip * 0.72);
        ctx.fill();
        return;
    }
    // moncone di colonna scanalata, con le macerie ai piedi
    const ph = range(rnd, 100, 220);
    ctx.beginPath();
    ctx.moveTo(x - 10, y0 + 4);
    ctx.lineTo(x - 10, y0 - 14);
    ctx.lineTo(x, y0 - 20);
    ctx.lineTo(x + 3, y0 - ph);
    ctx.lineTo(x + w * 0.3, y0 - ph - range(rnd, 12, 34));
    ctx.lineTo(x + w * 0.55, y0 - ph + 10);
    ctx.lineTo(x + w * 0.8, y0 - ph - 6);
    ctx.lineTo(x + w - 3, y0 - ph + 16);
    ctx.lineTo(x + w, y0 - 20);
    ctx.lineTo(x + w + 10, y0 - 14);
    ctx.lineTo(x + w + 10, y0 + 4);
    ctx.closePath();
    ctx.fill();
    for (let k = 0; k < 5; k++) {
        const bx = x - 40 + rnd() * (w + 90);
        const s = range(rnd, 10, 26);
        ctx.beginPath();
        ctx.moveTo(bx - s, y0 + 4);
        ctx.lineTo(bx - s * 0.5, y0 - s * 0.8);
        ctx.lineTo(bx + s * 0.4, y0 - s);
        ctx.lineTo(bx + s, y0 + 4);
        ctx.fill();
    }
};

const pipes: Draw = (ctx, x, y0, dir, rnd) => {
    const r = range(rnd, 16, 30);
    const len = range(rnd, 220, 480);
    const y = dir > 0 ? 14 : y0 - r * 2 - 14;
    ctx.fillRect(x, y, len, r * 2);
    // le flange
    for (let fx = x + 30; fx < x + len; fx += range(rnd, 110, 170)) ctx.fillRect(fx, y - 5, 12, r * 2 + 10);
    const vx = x + len * range(rnd, 0.25, 0.75);
    if (dir > 0) {
        // la discesa col gomito
        const dx = x + len * range(rnd, 0.15, 0.4);
        ctx.fillRect(dx, y, r * 1.5, range(rnd, 120, FG_H * 0.8));
        ctx.fillRect(dx - 5, y + 60, r * 1.5 + 10, 11);
    } else {
        ctx.fillRect(x + 50, y - 12, 26, r * 2 + 40);
    }
    // il volantino della valvola
    const vy = dir > 0 ? y + r * 2 + 22 : y - 22;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(vx, y + r);
    ctx.lineTo(vx, vy);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(vx, vy, 24, 8, 0, 0, Math.PI * 2);
    ctx.stroke();
};

const crystals: Draw = (ctx, x, y0, dir, rnd, accent) => {
    const n = 3 + Math.floor(rnd() * 3);
    for (let i = 0; i < n; i++) {
        const f = (i - (n - 1) / 2) / n;
        const cx = x + i * 30;
        const h = range(rnd, 90, 230) * (1 - Math.abs(f) * 0.8);
        const w = range(rnd, 16, 36);
        const lean = f * 120 + (rnd() - 0.5) * 30;
        const tipX = cx + lean;
        const tipY = y0 + dir * h;
        ctx.beginPath();
        ctx.moveTo(cx - w, y0 - dir * 6);
        ctx.lineTo(cx - w * 0.6 + lean * 0.75, y0 + dir * h * 0.76);
        ctx.lineTo(tipX, tipY);
        ctx.lineTo(cx + w * 0.6 + lean * 0.75, y0 + dir * h * 0.72);
        ctx.lineTo(cx + w, y0 - dir * 6);
        ctx.closePath();
        ctx.fill();
        // lo spigolo che prende luce
        ctx.save();
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(cx + w * 0.1, y0);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();
        ctx.restore();
    }
};

const reeds: Draw = (ctx, x, y0, dir, rnd) => {
    if (dir > 0) return;
    const n = 6 + Math.floor(rnd() * 6);
    for (let i = 0; i < n; i++) {
        const rx = x + rnd() * 130;
        const h = range(rnd, 110, 260);
        const lean = (rnd() - 0.5) * 60;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(rx, y0 + 4);
        ctx.quadraticCurveTo(rx + lean * 0.2, y0 - h * 0.6, rx + lean, y0 - h);
        ctx.stroke();
        if (rnd() > 0.45) {
            ctx.beginPath();
            ctx.ellipse(rx + lean * 0.92, y0 - h + 24, 5.5, 20, lean * 0.004, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // una foglia lunga che ricade
            leaf(ctx, rx, y0, -Math.PI / 2 + (rnd() - 0.5) * 1.1, h * 0.8, 9);
        }
    }
};

/** un coccio frastagliato: un poligono storto attorno a un centro */
function shard(ctx: Ctx, cx: number, cy: number, r: number, rnd: Rng): void {
    const n = 5 + Math.floor(rnd() * 3);
    const spin = rnd() * Math.PI * 2;
    ctx.beginPath();
    for (let k = 0; k < n; k++) {
        const a = spin + (k / n) * Math.PI * 2 + (rnd() - 0.5) * 0.5;
        // allungato su un asse: una scheggia, non un sasso
        const rr = r * range(rnd, 0.45, 1) * (k % 2 ? 0.55 : 1);
        const px = cx + Math.cos(a) * rr * 1.5;
        const py = cy + Math.sin(a) * rr;
        if (k) ctx.lineTo(px, py);
        else ctx.moveTo(px, py);
    }
    ctx.closePath();
}

/** i cocci della wave: grossi, tagliati dal bordo, col filo di luce che dice di cosa sono fatti */
const shards: Draw = (ctx, x, y0, dir, rnd, accent) => {
    const big = dir > 0 ? range(rnd, 50, 105) : range(rnd, 26, 48);
    const cx = x + (rnd() - 0.5) * 120;
    const cy = dir > 0 ? range(rnd, 70, 160) : y0 - range(rnd, 0, 18);
    const pieces: [number, number, number][] = [[cx, cy, big]];
    for (let k = 0; k < 2; k++) pieces.push([cx + (rnd() - 0.5) * big * 4, cy + dir * range(rnd, 0.4, 1.4) * big, big * range(rnd, 0.18, 0.35)]);
    for (const [px, py, r] of pieces) {
        shard(ctx, px, py, r, rnd);
        ctx.fill();
        ctx.save();
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();
    }
};

const DRAW: Record<Exclude<Kind, 'none'>, Draw> = { leaves, cables, chains, pillars, pipes, crystals, reeds, shards };

const cache = new Map<string, HTMLCanvasElement>();

/** striscia di primo piano (in alto o in basso), tileabile. key distingue le palette */
export function foregroundCanvas(key: string, b: BiomeDef, palette: ScenePalette, edge: 'top' | 'bottom'): HTMLCanvasElement | null {
    if (b.foreground === 'none') return null;
    const id = `${key}:${edge}`;
    const hit = cache.get(id);
    if (hit) return hit;
    const sharp = canvas(SKY_W, FG_H);
    const ctx = sharp.ctx;
    const rnd = mulberry32(hashString(`${b.id}:fg:${edge}`));
    const dark = mix(shade(palette.dark, -0.55), 0x000000, 0.35);
    ctx.fillStyle = hex(dark);
    ctx.strokeStyle = hex(dark);
    const y0 = edge === 'bottom' ? FG_H : 0;
    const dir = edge === 'bottom' ? -1 : 1;
    const accent = hex(mix(b.accent, palette.glow, 0.3), b.foreground === 'shards' ? 0.6 : 0.3);
    const draw = DRAW[b.foreground];
    // pochi elementi, distanziati: deve incorniciare, non coprire
    let x = rnd() * 300;
    while (x < SKY_W - 100) {
        const seed = Math.floor(rnd() * 1e9);
        for (const off of [-SKY_W, 0, SKY_W]) draw(ctx, x + off, y0, dir, mulberry32(seed), accent);
        x += range(rnd, 420, 860);
    }
    // verso la punta prende un filo d'aria: stacca dal nero del bordo
    ctx.globalCompositeOperation = 'source-atop';
    const g = ctx.createLinearGradient(0, y0, 0, y0 + dir * FG_H);
    g.addColorStop(0, hex(palette.floor, 0));
    g.addColorStop(1, hex(mix(palette.floor, palette.haze, 0.5), 0.3));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, SKY_W, FG_H);
    ctx.globalCompositeOperation = 'source-over';

    // fuori fuoco: la sfocatura gira attorno al bordo, senza cuciture
    const out = canvas(SKY_W, FG_H);
    out.ctx.filter = `blur(${b.foreground === 'shards' ? 5 : 2}px)`;
    for (const off of [-SKY_W, 0, SKY_W]) out.ctx.drawImage(sharp.el, off, 0);
    out.ctx.filter = 'none';
    cache.set(id, out.el);
    return out.el;
}
