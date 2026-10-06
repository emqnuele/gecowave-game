import type { BiomeDef } from '../../content/biomes';
import {
    canvas, crossHatch, hatch, hex, inkLine, mix, mulberry32, range, shade, stipple, tracePath, wobble,
    type Pt, type Rng,
} from './ink';

/* materiali tileabili 256x256: ogni elemento viene disegnato anche
   traslato di ±S così i bordi si richiudono senza cuciture */

export const MATERIAL_SIZE = 256;
const S = MATERIAL_SIZE;

type Painter = (ctx: CanvasRenderingContext2D, ox: number, oy: number) => void;

function wrapped(ctx: CanvasRenderingContext2D, paint: Painter): void {
    for (const ox of [-S, 0, S]) {
        for (const oy of [-S, 0, S]) paint(ctx, ox, oy);
    }
}

function blockPoly(x: number, y: number, w: number, h: number, r: number): Pt[] {
    // blocco squadrato con angoli smussati: la pietra del tileset, ma a mano
    return [
        { x: x + r, y }, { x: x + w - r, y }, { x: x + w, y: y + r }, { x: x + w, y: y + h - r },
        { x: x + w - r, y: y + h }, { x: x + r, y: y + h }, { x, y: y + h - r }, { x, y: y + r },
    ];
}

function shadedBlock(ctx: CanvasRenderingContext2D, rnd: Rng, b: BiomeDef, pts: Pt[], bbox: { x: number; y: number; w: number; h: number }, tone: number): void {
    const fill = mix(b.rock, b.deep, 0.25 + tone * 0.35);
    const w = wobble([...pts, pts[0]], rnd, 0.9, 5);
    ctx.save();
    tracePath(ctx, w, true);
    ctx.fillStyle = hex(fill);
    ctx.fill();
    ctx.clip();
    // luce dall'alto a sinistra: tratteggio in basso a destra
    ctx.save();
    ctx.beginPath();
    ctx.rect(bbox.x + bbox.w * 0.35, bbox.y + bbox.h * 0.3, bbox.w, bbox.h);
    ctx.clip();
    crossHatch(ctx, bbox.x, bbox.y, bbox.w, bbox.h, rnd, hex(b.ink, 0.55), 0.35 + tone * 0.4, 0.8);
    ctx.restore();
    // bordo chiaro in alto
    ctx.strokeStyle = hex(shade(b.rock, 0.25), 0.5);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bbox.x + 3, bbox.y + 3);
    ctx.lineTo(bbox.x + bbox.w - 4, bbox.y + 3);
    ctx.stroke();
    stipple(ctx, bbox.x, bbox.y, bbox.w, bbox.h, rnd, hex(b.ink, 0.35), (bbox.w * bbox.h) / 90);
    ctx.restore();
    ctx.strokeStyle = hex(b.ink);
    ctx.lineWidth = 2.2;
    tracePath(ctx, w, true);
    ctx.stroke();
}

function crack(ctx: CanvasRenderingContext2D, rnd: Rng, x: number, y: number, len: number, color: string): void {
    const pts: Pt[] = [{ x, y }];
    let a = rnd() * Math.PI * 2;
    let cx = x;
    let cy = y;
    for (let i = 0; i < 4; i++) {
        a += (rnd() - 0.5) * 1.4;
        cx += Math.cos(a) * len / 4;
        cy += Math.sin(a) * len / 4;
        pts.push({ x: cx, y: cy });
    }
    inkLine(ctx, pts, rnd, color, 1.2, 0.6);
}

function stone(ctx: CanvasRenderingContext2D, b: BiomeDef, rnd: Rng): void {
    // file di blocchi di altezza variabile, come la muratura dei dipinti
    const rows: { y: number; h: number }[] = [];
    let y = 0;
    while (y < S) {
        const h = Math.min(S - y, pickRowHeight(rnd, S - y));
        rows.push({ y, h });
        y += h;
    }
    const blocks: { pts: Pt[]; bbox: { x: number; y: number; w: number; h: number }; tone: number; cracked: boolean }[] = [];
    for (const row of rows) {
        let x = rnd() * 40;
        const start = x;
        while (x < start + S) {
            const w = Math.min(start + S - x, range(rnd, 34, 92));
            if (w < 14) break;
            const bx = x + 2;
            const by = row.y + 2;
            const bw = w - 4;
            const bh = row.h - 4;
            blocks.push({
                pts: blockPoly(bx, by, bw, bh, range(rnd, 3, 8)),
                bbox: { x: bx, y: by, w: bw, h: bh },
                tone: rnd(),
                cracked: rnd() > 0.65,
            });
            x += w;
        }
    }
    wrapped(ctx, (c, ox, oy) => {
        const local = mulberry32(17);
        for (const bl of blocks) {
            const pts = bl.pts.map((p) => ({ x: p.x + ox, y: p.y + oy }));
            shadedBlock(c, local, b, pts, { ...bl.bbox, x: bl.bbox.x + ox, y: bl.bbox.y + oy }, bl.tone);
            if (bl.cracked) crack(c, local, bl.bbox.x + ox + bl.bbox.w * local(), bl.bbox.y + oy + bl.bbox.h * local(), 30, hex(b.ink, 0.9));
        }
    });
}

function pickRowHeight(rnd: Rng, left: number): number {
    if (left < 70) return left;
    return Math.round(range(rnd, 30, 62));
}

function brick(ctx: CanvasRenderingContext2D, b: BiomeDef, rnd: Rng): void {
    const bh = 21;
    const bw = 51;
    const rowsN = Math.round(S / bh);
    const realH = S / rowsN;
    const colsN = Math.round(S / bw);
    const realW = S / colsN;
    const tones = Array.from({ length: rowsN * colsN }, () => rnd());
    const chipped = Array.from({ length: rowsN * colsN }, () => rnd() > 0.8);
    wrapped(ctx, (c, ox, oy) => {
        const local = mulberry32(99);
        for (let r = 0; r < rowsN; r++) {
            const off = r % 2 === 0 ? 0 : realW / 2;
            for (let k = -1; k < colsN; k++) {
                const idx = r * colsN + ((k + colsN) % colsN);
                const x = k * realW + off + ox + 1.5;
                const y = r * realH + oy + 1.5;
                const pts = blockPoly(x, y, realW - 3, realH - 3, chipped[idx] ? 5 : 2);
                shadedBlock(c, local, b, pts, { x, y, w: realW - 3, h: realH - 3 }, tones[idx]);
            }
        }
    });
}

function roots(ctx: CanvasRenderingContext2D, b: BiomeDef, rnd: Rng): void {
    ctx.fillStyle = hex(mix(b.rock, b.deep, 0.55));
    ctx.fillRect(0, 0, S, S);
    const curves: Pt[][] = [];
    for (let i = 0; i < 16; i++) {
        const pts: Pt[] = [];
        let x = rnd() * S;
        let y = rnd() * S;
        let a = rnd() * Math.PI * 2;
        for (let k = 0; k < 9; k++) {
            pts.push({ x, y });
            a += (rnd() - 0.5) * 0.9;
            x += Math.cos(a) * 18;
            y += Math.sin(a) * 18;
        }
        curves.push(pts);
    }
    const pebbles = Array.from({ length: 40 }, () => ({ x: rnd() * S, y: rnd() * S, r: range(rnd, 2, 7) }));
    wrapped(ctx, (c, ox, oy) => {
        const local = mulberry32(5);
        stipple(c, ox, oy, S, S, local, hex(b.ink, 0.4), 500, 1.4);
        for (const p of pebbles) {
            c.fillStyle = hex(mix(b.rock, b.deep, 0.2 + local() * 0.3));
            c.beginPath();
            c.ellipse(p.x + ox, p.y + oy, p.r, p.r * 0.7, local() * 3, 0, Math.PI * 2);
            c.fill();
            c.strokeStyle = hex(b.ink);
            c.lineWidth = 1.2;
            c.stroke();
        }
        for (const cv of curves) {
            const pts = cv.map((p) => ({ x: p.x + ox, y: p.y + oy }));
            c.strokeStyle = hex(b.ink);
            c.lineWidth = 7;
            tracePath(c, pts);
            c.stroke();
            c.strokeStyle = hex(shade(b.rock, -0.1));
            c.lineWidth = 4;
            tracePath(c, pts);
            c.stroke();
            c.strokeStyle = hex(shade(b.rock, 0.2), 0.5);
            c.lineWidth = 1;
            tracePath(c, pts.map((p) => ({ x: p.x - 1, y: p.y - 1 })));
            c.stroke();
        }
    });
}

function metal(ctx: CanvasRenderingContext2D, b: BiomeDef, rnd: Rng): void {
    const plates: { x: number; y: number; w: number; h: number; tone: number }[] = [];
    const cols = [0, 96, 160, 256];
    const rowsY = [0, 64, 150, 256];
    for (let r = 0; r < rowsY.length - 1; r++) {
        for (let k = 0; k < cols.length - 1; k++) {
            plates.push({ x: cols[k], y: rowsY[r], w: cols[k + 1] - cols[k], h: rowsY[r + 1] - rowsY[r], tone: rnd() });
        }
    }
    wrapped(ctx, (c, ox, oy) => {
        const local = mulberry32(31);
        for (const p of plates) {
            const x = p.x + ox + 2;
            const y = p.y + oy + 2;
            const w = p.w - 4;
            const h = p.h - 4;
            shadedBlock(c, local, b, blockPoly(x, y, w, h, 4), { x, y, w, h }, p.tone);
            // rivetti
            c.fillStyle = hex(shade(b.rock, 0.15));
            for (const [rx, ry] of [[x + 7, y + 7], [x + w - 7, y + 7], [x + 7, y + h - 7], [x + w - 7, y + h - 7]]) {
                c.beginPath();
                c.arc(rx, ry, 2.4, 0, Math.PI * 2);
                c.fill();
                c.strokeStyle = hex(b.ink);
                c.lineWidth = 1;
                c.stroke();
            }
            // colature di ruggine
            if (local() > 0.5) {
                c.save();
                c.beginPath();
                c.rect(x, y, w, h);
                c.clip();
                hatch(c, x + w * local() * 0.6, y, 14, h, local, hex(mix(b.accent, b.rock, 0.6), 0.35), Math.PI / 2, 3, 1);
                c.restore();
            }
        }
    });
}

function crystal(ctx: CanvasRenderingContext2D, b: BiomeDef, rnd: Rng): void {
    ctx.fillStyle = hex(mix(b.rock, b.deep, 0.5));
    ctx.fillRect(0, 0, S, S);
    const pts: Pt[] = [];
    for (let gy = 0; gy < 6; gy++) {
        for (let gx = 0; gx < 6; gx++) {
            pts.push({ x: (gx + 0.2 + rnd() * 0.6) * (S / 6), y: (gy + 0.2 + rnd() * 0.6) * (S / 6) });
        }
    }
    // faccette triangolari tra punti vicini della griglia
    const tris: { a: Pt; b: Pt; c: Pt; tone: number }[] = [];
    const at = (gx: number, gy: number): Pt => {
        const wx = ((gx % 6) + 6) % 6;
        const wy = ((gy % 6) + 6) % 6;
        const p = pts[wy * 6 + wx];
        return { x: p.x + Math.floor(gx / 6) * S, y: p.y + Math.floor(gy / 6) * S };
    };
    for (let gy = 0; gy < 6; gy++) {
        for (let gx = 0; gx < 6; gx++) {
            tris.push({ a: at(gx, gy), b: at(gx + 1, gy), c: at(gx, gy + 1), tone: rnd() });
            tris.push({ a: at(gx + 1, gy), b: at(gx + 1, gy + 1), c: at(gx, gy + 1), tone: rnd() });
        }
    }
    wrapped(ctx, (c, ox, oy) => {
        const local = mulberry32(3);
        for (const t of tris) {
            const poly = [t.a, t.b, t.c].map((p) => ({ x: p.x + ox, y: p.y + oy }));
            const fill = t.tone > 0.82 ? mix(b.rock, b.accent, 0.45) : mix(b.rock, b.deep, t.tone * 0.6);
            c.fillStyle = hex(fill);
            tracePath(c, poly, true);
            c.fill();
            if (t.tone < 0.45) {
                c.save();
                tracePath(c, poly, true);
                c.clip();
                hatch(c, Math.min(...poly.map((p) => p.x)), Math.min(...poly.map((p) => p.y)), 60, 60, local, hex(b.ink, 0.45), 0.4, 4, 0.8);
                c.restore();
            }
            c.strokeStyle = hex(b.ink);
            c.lineWidth = 1.6;
            tracePath(c, poly, true);
            c.stroke();
        }
    });
}

function circuit(ctx: CanvasRenderingContext2D, b: BiomeDef, rnd: Rng): void {
    metal(ctx, b, rnd);
    const traces: Pt[][] = [];
    for (let i = 0; i < 14; i++) {
        let x = Math.round(rnd() * 16) * 16;
        let y = Math.round(rnd() * 16) * 16;
        const pts: Pt[] = [{ x, y }];
        for (let k = 0; k < 5; k++) {
            if (rnd() > 0.5) x += (rnd() > 0.5 ? 1 : -1) * 32;
            else y += (rnd() > 0.5 ? 1 : -1) * 32;
            pts.push({ x, y });
        }
        traces.push(pts);
    }
    wrapped(ctx, (c, ox, oy) => {
        for (const t of traces) {
            const pts = t.map((p) => ({ x: p.x + ox, y: p.y + oy }));
            c.strokeStyle = hex(b.ink);
            c.lineWidth = 4;
            tracePath(c, pts);
            c.stroke();
            c.strokeStyle = hex(mix(b.accent, b.rock, 0.65), 0.8);
            c.lineWidth = 1.6;
            tracePath(c, pts);
            c.stroke();
            const end = pts[pts.length - 1];
            c.fillStyle = hex(b.accent, 0.8);
            c.fillRect(end.x - 2.5, end.y - 2.5, 5, 5);
        }
    });
}

function mud(ctx: CanvasRenderingContext2D, b: BiomeDef, rnd: Rng): void {
    ctx.fillStyle = hex(mix(b.rock, b.deep, 0.45));
    ctx.fillRect(0, 0, S, S);
    // strati orizzontali ondulati: la terra che si deposita
    const strata = Array.from({ length: 9 }, (_, i) => ({ y: i * (S / 9) + rnd() * 8, ph: rnd() * 6, amp: range(rnd, 2, 6), tone: rnd() }));
    const stones = Array.from({ length: 26 }, () => ({ x: rnd() * S, y: rnd() * S, r: range(rnd, 3, 10) }));
    wrapped(ctx, (c, ox, oy) => {
        const local = mulberry32(12);
        for (const st of strata) {
            c.fillStyle = hex(mix(b.rock, b.deep, 0.15 + st.tone * 0.5));
            c.beginPath();
            c.moveTo(ox, st.y + oy);
            for (let x = 0; x <= S; x += 8) c.lineTo(x + ox, st.y + oy + Math.sin((x / S) * Math.PI * 4 + st.ph) * st.amp);
            c.lineTo(S + ox, st.y + oy + S / 9);
            c.lineTo(ox, st.y + oy + S / 9);
            c.closePath();
            c.fill();
            c.strokeStyle = hex(b.ink, 0.9);
            c.lineWidth = 1.5;
            c.beginPath();
            for (let x = 0; x <= S; x += 8) {
                const yy = st.y + oy + Math.sin((x / S) * Math.PI * 4 + st.ph) * st.amp;
                if (x === 0) c.moveTo(x + ox, yy);
                else c.lineTo(x + ox, yy);
            }
            c.stroke();
        }
        stipple(c, ox, oy, S, S, local, hex(b.ink, 0.5), 700, 1.3);
        for (const s of stones) {
            c.fillStyle = hex(mix(b.rock, 0x000000, 0.1 + local() * 0.3));
            c.beginPath();
            c.ellipse(s.x + ox, s.y + oy, s.r, s.r * 0.65, 0, 0, Math.PI * 2);
            c.fill();
            c.strokeStyle = hex(b.ink);
            c.lineWidth = 1.4;
            c.stroke();
        }
    });
}

function concrete(ctx: CanvasRenderingContext2D, b: BiomeDef, rnd: Rng): void {
    const slabs: { x: number; y: number; w: number; h: number; tone: number }[] = [];
    for (let r = 0; r < 2; r++) {
        let x = rnd() * 30;
        while (x < S + 30) {
            const w = range(rnd, 90, 150);
            slabs.push({ x, y: r * 128, w, h: 128, tone: rnd() });
            x += w;
        }
    }
    wrapped(ctx, (c, ox, oy) => {
        const local = mulberry32(44);
        for (const sl of slabs) {
            const x = sl.x + ox + 2;
            const y = sl.y + oy + 2;
            shadedBlock(c, local, b, blockPoly(x, y, sl.w - 4, sl.h - 4, 3), { x, y, w: sl.w - 4, h: sl.h - 4 }, sl.tone * 0.6);
            stipple(c, x, y, sl.w - 4, sl.h - 4, local, hex(shade(b.rock, 0.2), 0.35), 120, 1.6);
            crack(c, local, x + sl.w * local(), y + 10, 60, hex(b.ink));
            if (local() > 0.5) {
                // ferro d'armatura che spunta
                c.strokeStyle = hex(mix(0x8a5a3a, b.rock, 0.3));
                c.lineWidth = 2.5;
                c.beginPath();
                c.moveTo(x + 20, y + sl.h * 0.6);
                c.lineTo(x + 50, y + sl.h * 0.55);
                c.stroke();
            }
        }
    });
}

function voidStone(ctx: CanvasRenderingContext2D, b: BiomeDef, rnd: Rng): void {
    stone(ctx, b, rnd);
    // righe di glitch: fette di materiale spostate di lato
    for (let i = 0; i < 10; i++) {
        const y = Math.floor(rnd() * S);
        const h = 2 + Math.floor(rnd() * 6);
        const dx = Math.round((rnd() - 0.5) * 30);
        const slice = ctx.getImageData(0, y, S, h);
        ctx.putImageData(slice, dx, y);
        ctx.fillStyle = hex(b.accent, 0.12);
        ctx.fillRect(0, y, S, 1);
    }
}

const PAINTERS: Record<BiomeDef['material'], (ctx: CanvasRenderingContext2D, b: BiomeDef, rnd: Rng) => void> = {
    stone, brick, roots, metal, crystal, circuit, mud, concrete, void: voidStone,
};

const cache = new Map<string, HTMLCanvasElement>();

/** materiale tileabile del bioma, già sporcato e tratteggiato */
export function materialCanvas(b: BiomeDef): HTMLCanvasElement {
    const hit = cache.get(b.id);
    if (hit) return hit;
    const { el, ctx } = canvas(S, S);
    ctx.fillStyle = hex(mix(b.rock, b.deep, 0.5));
    ctx.fillRect(0, 0, S, S);
    PAINTERS[b.material](ctx, b, mulberry32(b.id.length * 7717 + b.material.length));
    cache.set(b.id, el);
    return el;
}
