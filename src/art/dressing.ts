import type { BiomeDef, CeilingDress, SurfaceDress } from '../content/biomes';
import { hex, inkLine, inkShape, mix, mulberry32, range, shade, tracePath, type Pt, type Rng } from './ink';

/* la vestizione delle superfici: erba, cristalli, cavi sopra;
   radici, stalattiti, catene sotto. ogni pezzo ha il suo seme, così
   viene identico in ogni chunk che lo attraversa */

export type DressKind = SurfaceDress | CeilingDress | 'wallmoss' | 'wallvine';

export interface DressItem {
    kind: DressKind;
    x: number;
    y: number;
    /** normale uscente dalla roccia */
    nx: number;
    ny: number;
    seed: number;
    size: number;
    /** per i cavi: secondo punto d'aggancio */
    x2?: number;
    y2?: number;
}

/** raggio di ingombro per il culling dei chunk */
export function dressReach(item: DressItem): number {
    switch (item.kind) {
        case 'roots':
        case 'vines':
        case 'chains':
        case 'wallvine':
            return 140 * item.size;
        case 'cables':
            return Math.hypot((item.x2 ?? item.x) - item.x, (item.y2 ?? item.y) - item.y) + 80;
        case 'reeds':
            return 80 * item.size;
        default:
            return 50 * item.size;
    }
}

type Drawer = (ctx: CanvasRenderingContext2D, it: DressItem, b: BiomeDef, rnd: Rng) => void;

const INK = (b: BiomeDef, a = 1) => hex(b.ink, a);

const grass: Drawer = (ctx, it, b, rnd) => {
    const blades = 3 + Math.floor(rnd() * 5);
    for (let i = 0; i < blades; i++) {
        const bx = it.x + (rnd() - 0.5) * 16 * it.size;
        const h = range(rnd, 6, 22) * it.size;
        const lean = (rnd() - 0.5) * h * 0.8;
        const w = range(rnd, 2, 4);
        const base = it.y + 3;
        ctx.fillStyle = hex(mix(b.deep, b.rock, 0.35));
        ctx.beginPath();
        ctx.moveTo(bx - w, base);
        ctx.quadraticCurveTo(bx + lean * 0.3, base - h * 0.6, bx + lean, base - h);
        ctx.quadraticCurveTo(bx + lean * 0.3 + w * 0.4, base - h * 0.5, bx + w, base);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = INK(b);
        ctx.lineWidth = 1.1;
        ctx.stroke();
        // punta che prende la luce del bordo
        ctx.strokeStyle = hex(mix(b.rim, b.accent, 0.4), 0.55);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(bx + lean * 0.6, base - h * 0.7);
        ctx.lineTo(bx + lean, base - h);
        ctx.stroke();
    }
};

const moss: Drawer = (ctx, it, b, rnd) => {
    const n = 3 + Math.floor(rnd() * 3);
    for (let i = 0; i < n; i++) {
        const mx = it.x + (rnd() - 0.5) * 22 * it.size;
        const r = range(rnd, 3, 8) * it.size;
        ctx.fillStyle = hex(mix(b.deep, b.accent, 0.22));
        ctx.beginPath();
        ctx.ellipse(mx, it.y + 1, r * 1.3, r * 0.8, 0, Math.PI, 0);
        ctx.fill();
        ctx.strokeStyle = INK(b);
        ctx.lineWidth = 1.2;
        ctx.stroke();
    }
    ctx.fillStyle = hex(b.accent, 0.7);
    for (let i = 0; i < 4; i++) ctx.fillRect(it.x + (rnd() - 0.5) * 22, it.y - rnd() * 6, 1.6, 1.6);
};

const crystals: Drawer = (ctx, it, b, rnd) => {
    const n = 2 + Math.floor(rnd() * 3);
    for (let i = 0; i < n; i++) {
        const cx = it.x + (rnd() - 0.5) * 20 * it.size;
        const h = range(rnd, 10, 34) * it.size;
        const w = range(rnd, 4, 9) * it.size;
        const tilt = (rnd() - 0.5) * 0.7;
        const tip = { x: cx + Math.sin(tilt) * h, y: it.y + 2 - Math.cos(tilt) * h };
        const pts: Pt[] = [{ x: cx - w, y: it.y + 3 }, { x: cx - w * 0.7, y: it.y - h * 0.5 }, tip, { x: cx + w * 0.7, y: it.y - h * 0.45 }, { x: cx + w, y: it.y + 3 }];
        inkShape(ctx, pts, rnd, hex(mix(b.rock, b.accent, 0.55)), INK(b), 1.4, 0.3);
        // faccetta luminosa
        ctx.fillStyle = hex(shade(b.accent, 0.35), 0.75);
        ctx.beginPath();
        ctx.moveTo(cx - w * 0.2, it.y);
        ctx.lineTo(tip.x, tip.y);
        ctx.lineTo(cx + w * 0.45, it.y - h * 0.4);
        ctx.closePath();
        ctx.fill();
    }
};

const rubble: Drawer = (ctx, it, b, rnd) => {
    const n = 2 + Math.floor(rnd() * 4);
    for (let i = 0; i < n; i++) {
        const rx = it.x + (rnd() - 0.5) * 26 * it.size;
        const r = range(rnd, 3, 9) * it.size;
        const pts: Pt[] = [];
        const sides = 5 + Math.floor(rnd() * 3);
        for (let k = 0; k < sides; k++) {
            const a = Math.PI + (k / (sides - 1)) * Math.PI;
            const rr = r * range(rnd, 0.7, 1.1);
            pts.push({ x: rx + Math.cos(a) * rr * 1.3, y: it.y + 2 + Math.sin(a) * rr });
        }
        inkShape(ctx, pts, rnd, hex(mix(b.rock, b.deep, rnd() * 0.4)), INK(b), 1.3, 0.4);
    }
};

const reeds: Drawer = (ctx, it, b, rnd) => {
    const n = 2 + Math.floor(rnd() * 4);
    for (let i = 0; i < n; i++) {
        const rx = it.x + (rnd() - 0.5) * 18;
        const h = range(rnd, 30, 70) * it.size;
        const lean = (rnd() - 0.5) * 16;
        const top = { x: rx + lean, y: it.y - h };
        inkLine(ctx, [{ x: rx, y: it.y + 3 }, { x: rx + lean * 0.5, y: it.y - h * 0.5 }, top], rnd, INK(b), 2, 0.3);
        if (rnd() > 0.4) {
            ctx.fillStyle = hex(mix(b.rock, 0x3a2410, 0.5));
            ctx.beginPath();
            ctx.ellipse(top.x, top.y + 8, 3, 8, lean * 0.02, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = INK(b);
            ctx.lineWidth = 1.2;
            ctx.stroke();
        }
    }
};

const books: Drawer = (ctx, it, b, rnd) => {
    let y = it.y + 2;
    const n = 1 + Math.floor(rnd() * 4);
    for (let i = 0; i < n; i++) {
        const w = range(rnd, 14, 24) * it.size;
        const h = range(rnd, 4, 6);
        const x = it.x - w / 2 + (rnd() - 0.5) * 6;
        const colors = [0x6b2d2d, 0x2d3f6b, 0x4a5a2d, 0x5a4a2d, 0x3d2d5a];
        ctx.save();
        ctx.translate(x + w / 2, y - h / 2);
        ctx.rotate((rnd() - 0.5) * 0.25);
        ctx.fillStyle = hex(mix(colors[Math.floor(rnd() * colors.length)], b.deep, 0.35));
        ctx.fillRect(-w / 2, -h / 2, w, h);
        ctx.strokeStyle = INK(b);
        ctx.lineWidth = 1.2;
        ctx.strokeRect(-w / 2, -h / 2, w, h);
        ctx.fillStyle = hex(0xe8dcc0, 0.5);
        ctx.fillRect(w / 2 - 3, -h / 2 + 1, 2, h - 2);
        ctx.restore();
        y -= h;
    }
};

const ash: Drawer = (ctx, it, b, rnd) => {
    ctx.fillStyle = hex(shade(b.rim, -0.3), 0.45);
    ctx.beginPath();
    ctx.ellipse(it.x, it.y + 2, 14 * it.size, 3, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = hex(b.rim, 0.5);
    for (let i = 0; i < 6; i++) ctx.fillRect(it.x + (rnd() - 0.5) * 24, it.y - rnd() * 4, 1.5, 1.5);
};

const glitch: Drawer = (ctx, it, b, rnd) => {
    const n = 2 + Math.floor(rnd() * 3);
    for (let i = 0; i < n; i++) {
        const w = range(rnd, 4, 18);
        const h = range(rnd, 2, 6);
        const gx = it.x + (rnd() - 0.5) * 24;
        const gy = it.y - it.ny * -1 * rnd() * 14 - (it.ny < 0 ? rnd() * 10 : -rnd() * 10);
        ctx.fillStyle = hex(rnd() > 0.5 ? b.accent : 0xff3df0, 0.5);
        ctx.fillRect(gx, gy, w, h);
    }
};

const sand: Drawer = (ctx, it, b, rnd) => {
    const w = range(rnd, 30, 60) * it.size;
    const h = range(rnd, 4, 9);
    ctx.fillStyle = hex(mix(b.rock, b.rim, 0.25));
    ctx.beginPath();
    ctx.moveTo(it.x - w / 2, it.y + 3);
    ctx.quadraticCurveTo(it.x - w / 6, it.y - h, it.x + w / 2, it.y + 3);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = INK(b, 0.8);
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(it.x - w / 2, it.y + 3);
    ctx.quadraticCurveTo(it.x - w / 6, it.y - h, it.x + w / 2, it.y + 3);
    ctx.stroke();
};

const bottles: Drawer = (ctx, it, b, rnd) => {
    const n = 1 + Math.floor(rnd() * 3);
    for (let i = 0; i < n; i++) {
        const bx = it.x + (rnd() - 0.5) * 22;
        const lying = rnd() > 0.6;
        const glass = pickGlass(rnd);
        ctx.save();
        ctx.translate(bx, it.y + 2);
        if (lying) ctx.rotate(Math.PI / 2 * (rnd() > 0.5 ? 1 : -1));
        ctx.fillStyle = hex(glass, 0.85);
        ctx.beginPath();
        ctx.roundRect(-3.5, -16, 7, 13, 2);
        ctx.rect(-1.5, -21, 3, 6);
        ctx.fill();
        ctx.strokeStyle = INK(b);
        ctx.lineWidth = 1.1;
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.fillRect(-2, -14, 1.2, 8);
        ctx.restore();
    }
};

function pickGlass(rnd: Rng): number {
    const list = [0x2f6b3a, 0x6b4a1f, 0x1f4a6b, 0x7a7a6a];
    return list[Math.floor(rnd() * list.length)];
}

/* ---------- soffitti ---------- */

const roots: Drawer = (ctx, it, b, rnd) => {
    const n = 2 + Math.floor(rnd() * 3);
    for (let i = 0; i < n; i++) {
        let x = it.x + (rnd() - 0.5) * 20;
        let y = it.y - 2;
        const len = range(rnd, 20, 110) * it.size;
        const pts: Pt[] = [{ x, y }];
        const steps = 6;
        for (let k = 0; k < steps; k++) {
            x += (rnd() - 0.5) * 10;
            y += len / steps;
            pts.push({ x, y });
        }
        const w0 = range(rnd, 3, 6);
        for (let k = 0; k < pts.length - 1; k++) {
            const t = k / (pts.length - 1);
            ctx.strokeStyle = INK(b);
            ctx.lineWidth = w0 * (1 - t) + 1.4;
            ctx.beginPath();
            ctx.moveTo(pts[k].x, pts[k].y);
            ctx.lineTo(pts[k + 1].x, pts[k + 1].y);
            ctx.stroke();
        }
        ctx.strokeStyle = hex(mix(b.rock, b.deep, 0.3), 0.8);
        ctx.lineWidth = Math.max(1, w0 * 0.4);
        tracePath(ctx, pts.slice(0, -2));
        ctx.stroke();
    }
};

const stalactites: Drawer = (ctx, it, b, rnd) => {
    const n = 1 + Math.floor(rnd() * 3);
    for (let i = 0; i < n; i++) {
        const sx = it.x + (rnd() - 0.5) * 22;
        const w = range(rnd, 5, 11) * it.size;
        const h = range(rnd, 14, 46) * it.size;
        const pts: Pt[] = [{ x: sx - w, y: it.y - 3 }, { x: sx + w, y: it.y - 3 }, { x: sx + w * 0.2, y: it.y + h * 0.6 }, { x: sx + (rnd() - 0.5) * 3, y: it.y + h }];
        inkShape(ctx, pts, rnd, hex(mix(b.rock, b.deep, 0.35)), INK(b), 1.5, 0.4);
        ctx.strokeStyle = hex(b.rim, 0.25);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx - w * 0.5, it.y);
        ctx.lineTo(sx, it.y + h * 0.75);
        ctx.stroke();
    }
};

const chains: Drawer = (ctx, it, b, rnd) => {
    const len = range(rnd, 30, 130) * it.size;
    const links = Math.floor(len / 7);
    ctx.strokeStyle = INK(b);
    for (let i = 0; i < links; i++) {
        const y = it.y + i * 7;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        if (i % 2 === 0) ctx.ellipse(it.x, y + 3.5, 2.6, 4.5, 0, 0, Math.PI * 2);
        else {
            ctx.moveTo(it.x, y);
            ctx.lineTo(it.x, y + 7);
        }
        ctx.stroke();
    }
    if (rnd() > 0.55) {
        // gancio o gabbietta in fondo
        const y = it.y + links * 7;
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (rnd() > 0.5) {
            ctx.arc(it.x + 4, y + 4, 5, Math.PI, Math.PI * 0.2, true);
        } else {
            ctx.rect(it.x - 7, y, 14, 18);
            ctx.moveTo(it.x - 2, y);
            ctx.lineTo(it.x - 2, y + 18);
            ctx.moveTo(it.x + 3, y);
            ctx.lineTo(it.x + 3, y + 18);
        }
        ctx.stroke();
    }
};

const cables: Drawer = (ctx, it, b, rnd) => {
    const x2 = it.x2 ?? it.x + 60;
    const y2 = it.y2 ?? it.y;
    const sag = range(rnd, 18, 60) * it.size * (it.ny > 0 ? 1 : -0.15);
    const mx = (it.x + x2) / 2;
    const my = Math.max(it.y, y2) + sag;
    const thick = range(rnd, 2, 4);
    ctx.strokeStyle = INK(b);
    ctx.lineWidth = thick + 1.5;
    ctx.beginPath();
    ctx.moveTo(it.x, it.y);
    ctx.quadraticCurveTo(mx, my, x2, y2);
    ctx.stroke();
    ctx.strokeStyle = hex(mix(b.rock, b.accent, 0.15), 0.6);
    ctx.lineWidth = Math.max(0.8, thick - 1.5);
    ctx.stroke();
    if (rnd() > 0.7) {
        // lampadina appesa o fascetta
        const t = 0.5;
        const px = (1 - t) * (1 - t) * it.x + 2 * (1 - t) * t * mx + t * t * x2;
        const py = (1 - t) * (1 - t) * it.y + 2 * (1 - t) * t * my + t * t * y2;
        ctx.fillStyle = hex(b.accent, 0.8);
        ctx.beginPath();
        ctx.arc(px, py + 5, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = INK(b);
        ctx.lineWidth = 1;
        ctx.stroke();
    }
};

const vines: Drawer = (ctx, it, b, rnd) => {
    const len = range(rnd, 30, 120) * it.size;
    const pts: Pt[] = [];
    let x = it.x;
    for (let y = 0; y <= len; y += 10) {
        x += Math.sin(y * 0.08 + it.seed) * 2;
        pts.push({ x, y: it.y - 2 + y });
    }
    inkLine(ctx, pts, rnd, INK(b), 2, 0.4);
    for (let i = 2; i < pts.length; i += 2) {
        const p = pts[i];
        const side = i % 4 === 0 ? 1 : -1;
        const leaf: Pt[] = [{ x: p.x, y: p.y }, { x: p.x + side * 7, y: p.y - 2 }, { x: p.x + side * 10, y: p.y + 4 }, { x: p.x + side * 3, y: p.y + 4 }];
        inkShape(ctx, leaf, rnd, hex(mix(b.deep, b.accent, 0.3)), INK(b), 1, 0.2);
    }
};

const drips: Drawer = (ctx, it, b, rnd) => {
    stalactites(ctx, { ...it, size: it.size * 0.6 }, b, rnd);
    ctx.fillStyle = hex(shade(b.accent, 0.2), 0.7);
    ctx.beginPath();
    ctx.ellipse(it.x, it.y + 22 * it.size + rnd() * 6, 1.8, 2.6, 0, 0, Math.PI * 2);
    ctx.fill();
};

const webs: Drawer = (ctx, it, _b, rnd) => {
    const r = range(rnd, 18, 40) * it.size;
    ctx.strokeStyle = 'rgba(220,220,230,0.22)';
    ctx.lineWidth = 0.8;
    const spokes = 6;
    const angles = Array.from({ length: spokes }, (_, i) => Math.PI * 0.05 + (i / (spokes - 1)) * Math.PI * 0.9);
    ctx.beginPath();
    for (const a of angles) {
        ctx.moveTo(it.x, it.y);
        ctx.lineTo(it.x + Math.cos(a) * r, it.y + Math.sin(a) * r);
    }
    for (let ring = 1; ring <= 4; ring++) {
        const rr = (ring / 4) * r;
        ctx.moveTo(it.x + Math.cos(angles[0]) * rr, it.y + Math.sin(angles[0]) * rr);
        for (const a of angles) ctx.lineTo(it.x + Math.cos(a) * rr * (0.9 + rnd() * 0.1), it.y + Math.sin(a) * rr);
    }
    ctx.stroke();
};

/* ---------- pareti ---------- */

const wallmoss: Drawer = (ctx, it, b, rnd) => {
    const n = 3 + Math.floor(rnd() * 4);
    for (let i = 0; i < n; i++) {
        const mx = it.x + it.nx * 2 + (rnd() - 0.5) * 6;
        const my = it.y + (rnd() - 0.5) * 30;
        ctx.fillStyle = hex(mix(b.deep, b.accent, 0.2));
        ctx.beginPath();
        ctx.ellipse(mx, my, 3 + rnd() * 3, 5 + rnd() * 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = INK(b);
        ctx.lineWidth = 1;
        ctx.stroke();
    }
};

const wallvine: Drawer = (ctx, it, b, rnd) => {
    vines(ctx, { ...it, x: it.x + it.nx * 3 }, b, rnd);
};

const DRAWERS: Record<DressKind, Drawer> = {
    grass, moss, crystals, rubble, reeds, books, ash, glitch, sand, bottles, cables,
    roots, stalactites, chains, vines, drips, webs, wallmoss, wallvine,
};

export function drawDress(ctx: CanvasRenderingContext2D, it: DressItem, b: BiomeDef): void {
    DRAWERS[it.kind](ctx, it, b, mulberry32(it.seed));
}

/** frequenza in pixel tra un pezzo e l'altro per tipo */
export function dressSpacing(kind: DressKind): number {
    switch (kind) {
        case 'grass': return 13;
        case 'moss': return 30;
        case 'crystals': return 70;
        case 'rubble': return 60;
        case 'reeds': return 45;
        case 'books': return 90;
        case 'ash': return 50;
        case 'glitch': return 110;
        case 'sand': return 55;
        case 'bottles': return 120;
        case 'cables': return 160;
        case 'roots': return 46;
        case 'stalactites': return 52;
        case 'chains': return 190;
        case 'vines': return 70;
        case 'drips': return 90;
        case 'webs': return 260;
        case 'wallmoss': return 60;
        case 'wallvine': return 140;
    }
}

