import type { BiomeDef, Skyline } from '../../content/biomes';
import { canvas, glowSpot, hex, mix, mulberry32, range, shade, type Rng } from './ink';

/* i piani del parallasse: sagome per bioma con prospettiva atmosferica.
   lontano = foschia piatta, vicino = nero con inchiostro e luce sul bordo */

export const SKY_W = 2048;

export interface LayerStyle {
    fill: string;
    ink: string | null;
    rim: string | null;
    /** finestre, led, lanterne lontane */
    lights: string | null;
    /** 0 lontano, 1 medio, 2 vicino */
    depth: number;
}

type Element = (ctx: CanvasRenderingContext2D, x: number, base: number, s: LayerStyle, rnd: Rng, h: number) => void;

function strokeIf(ctx: CanvasRenderingContext2D, s: LayerStyle, width = 1.6): void {
    if (!s.ink) return;
    ctx.strokeStyle = s.ink;
    ctx.lineWidth = width;
    ctx.stroke();
}

function poly(ctx: CanvasRenderingContext2D, pts: [number, number][], s: LayerStyle): void {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (const [x, y] of pts.slice(1)) ctx.lineTo(x, y);
    ctx.closePath();
    ctx.fillStyle = s.fill;
    ctx.fill();
    strokeIf(ctx, s);
}

function rimTop(ctx: CanvasRenderingContext2D, s: LayerStyle, x0: number, y0: number, x1: number, y1: number): void {
    if (!s.rim) return;
    ctx.strokeStyle = s.rim;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x0, y0 + 2);
    ctx.lineTo(x1, y1 + 2);
    ctx.stroke();
}

function windows(ctx: CanvasRenderingContext2D, s: LayerStyle, rnd: Rng, x: number, y: number, w: number, h: number, chance = 0.25): void {
    if (!s.lights) return;
    for (let wy = y + 10; wy < y + h - 10; wy += 16) {
        for (let wx = x + 6; wx < x + w - 8; wx += 12) {
            if (rnd() < chance) {
                ctx.fillStyle = s.lights;
                ctx.fillRect(wx, wy, 4, 6);
            }
        }
    }
}

/** terreno ondulato che fa da base a ogni piano */
function hills(ctx: CanvasRenderingContext2D, w: number, base: number, amp: number, s: LayerStyle, rnd: Rng): void {
    const ph1 = rnd() * 10;
    const ph2 = rnd() * 10;
    ctx.beginPath();
    ctx.moveTo(0, base + 400);
    // armoniche intere: il bordo si richiude su se stesso
    const yAt = (x: number) => base - amp * (0.6 + 0.4 * Math.sin((x / w) * Math.PI * 2 * 2 + ph1)) - amp * 0.3 * Math.sin((x / w) * Math.PI * 2 * 5 + ph2);
    for (let x = 0; x <= w; x += 8) ctx.lineTo(x, yAt(x));
    ctx.lineTo(w, base + 400);
    ctx.closePath();
    ctx.fillStyle = s.fill;
    ctx.fill();
    if (s.ink) {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 8) ctx[x === 0 ? 'moveTo' : 'lineTo'](x, yAt(x));
        ctx.strokeStyle = s.ink;
        ctx.lineWidth = 1.8;
        ctx.stroke();
    }
}

/* ---------- elementi ---------- */

const house: Element = (ctx, x, base, s, rnd, h) => {
    const w = range(rnd, 50, 110);
    const bh = range(rnd, 50, 90 + s.depth * 30) * (h / 600);
    const crooked = (rnd() - 0.5) * 12;
    const top = base - bh;
    poly(ctx, [[x, base], [x + crooked * 0.3, top], [x + w / 2 + crooked, top - range(rnd, 30, 60)], [x + w + crooked * 0.3, top], [x + w, base]], s);
    rimTop(ctx, s, x + crooked * 0.3, top, x + w / 2 + crooked, top - 40);
    if (rnd() > 0.4) poly(ctx, [[x + w * 0.65, top - 10], [x + w * 0.65, top - 46], [x + w * 0.65 + 10, top - 46], [x + w * 0.65 + 10, top - 18]], s);
    windows(ctx, s, rnd, x, top, w, bh, 0.18);
};

const deadTree: Element = (ctx, x, base, s, rnd, h) => {
    const th = range(rnd, 120, 260) * (h / 600) * (0.7 + s.depth * 0.2);
    const branch = (bx: number, by: number, a: number, len: number, wd: number, d: number) => {
        if (d === 0) return;
        const ex = bx + Math.cos(a) * len;
        const ey = by + Math.sin(a) * len;
        ctx.strokeStyle = s.fill;
        ctx.lineWidth = wd;
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey); ctx.stroke();
        branch(ex, ey, a - range(rnd, 0.2, 0.7), len * 0.7, wd * 0.62, d - 1);
        branch(ex, ey, a + range(rnd, 0.2, 0.7), len * 0.65, wd * 0.6, d - 1);
    };
    branch(x, base, -Math.PI / 2 + (rnd() - 0.5) * 0.3, th * 0.45, 10 + s.depth * 4, 5);
};

const arch: Element = (ctx, x, base, s, rnd, h) => {
    const w = range(rnd, 120, 220);
    const ah = range(rnd, 160, 300) * (h / 600);
    const pw = 22 + s.depth * 6;
    ctx.beginPath();
    ctx.moveTo(x, base);
    ctx.lineTo(x, base - ah);
    ctx.quadraticCurveTo(x + w / 2, base - ah - w * 0.55, x + w, base - ah);
    ctx.lineTo(x + w, base);
    ctx.lineTo(x + w - pw, base);
    ctx.lineTo(x + w - pw, base - ah + 6);
    ctx.quadraticCurveTo(x + w / 2, base - ah - w * 0.32, x + pw, base - ah + 6);
    ctx.lineTo(x + pw, base);
    ctx.closePath();
    ctx.fillStyle = s.fill;
    ctx.fill();
    strokeIf(ctx, s);
};

const spire: Element = (ctx, x, base, s, rnd, h) => {
    const w = range(rnd, 30, 70);
    const sh = range(rnd, 240, 460) * (h / 600);
    poly(ctx, [[x, base], [x + w * 0.1, base - sh * 0.7], [x + w / 2, base - sh], [x + w * 0.9, base - sh * 0.7], [x + w, base]], s);
    rimTop(ctx, s, x + w * 0.1, base - sh * 0.7, x + w / 2, base - sh);
    if (s.lights) {
        ctx.fillStyle = s.lights;
        ctx.fillRect(x + w / 2 - 3, base - sh * 0.55, 6, 14);
    }
};

const crystalSpire: Element = (ctx, x, base, s, rnd, h) => {
    const n = 2 + Math.floor(rnd() * 3);
    for (let i = 0; i < n; i++) {
        const cx = x + i * range(rnd, 14, 30);
        const ch = range(rnd, 140, 420) * (h / 600);
        const cw = range(rnd, 18, 40);
        const lean = (rnd() - 0.5) * 60;
        poly(ctx, [[cx - cw, base], [cx - cw * 0.6 + lean * 0.6, base - ch * 0.75], [cx + lean, base - ch], [cx + cw * 0.6 + lean * 0.6, base - ch * 0.72], [cx + cw, base]], s);
        if (s.lights) {
            ctx.strokeStyle = s.lights;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(cx - cw * 0.2, base - 10);
            ctx.lineTo(cx + lean, base - ch);
            ctx.stroke();
        }
    }
};

const pylon: Element = (ctx, x, base, s, rnd, h) => {
    const ph = range(rnd, 200, 360) * (h / 600);
    const w = 50;
    ctx.strokeStyle = s.fill;
    ctx.lineWidth = 3 + s.depth;
    ctx.beginPath();
    ctx.moveTo(x, base); ctx.lineTo(x + w / 2, base - ph); ctx.lineTo(x + w, base);
    for (let k = 1; k < 6; k++) {
        const y = base - (ph * k) / 6;
        const half = (w / 2) * (1 - k / 6);
        ctx.moveTo(x + w / 2 - half, y); ctx.lineTo(x + w / 2 + half, y - ph / 6);
        ctx.moveTo(x + w / 2 + half, y); ctx.lineTo(x + w / 2 - half, y - ph / 6);
    }
    ctx.moveTo(x - 20, base - ph * 0.8); ctx.lineTo(x + w + 20, base - ph * 0.8);
    ctx.stroke();
    // cavi che pendono verso il traliccio successivo
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + w + 20, base - ph * 0.8);
    ctx.quadraticCurveTo(x + w + 140, base - ph * 0.6, x + w + 260, base - ph * 0.8);
    ctx.stroke();
};

const wreck: Element = (ctx, x, base, s, rnd) => {
    const w = range(rnd, 90, 160);
    const bh = range(rnd, 30, 50);
    ctx.save();
    ctx.translate(x + w / 2, base);
    ctx.rotate((rnd() - 0.5) * 0.25);
    ctx.beginPath();
    ctx.roundRect(-w / 2, -bh - 6, w, bh, 10);
    ctx.fillStyle = s.fill;
    ctx.fill();
    strokeIf(ctx, s);
    ctx.beginPath();
    ctx.roundRect(-w / 2 + 14, -bh - 26, w * 0.5, 22, 6);
    ctx.fill();
    strokeIf(ctx, s);
    if (s.lights) windows(ctx, s, rnd, -w / 2, -bh - 6, w, bh, 0.12);
    ctx.restore();
};

const bus: Element = (ctx, x, base, s, rnd) => {
    const w = range(rnd, 150, 200);
    const bh = 54;
    const stack = 1 + Math.floor(rnd() * 2);
    for (let k = 0; k < stack; k++) {
        const y = base - (bh + 6) * (k + 1);
        const off = k * range(rnd, -30, 30);
        ctx.beginPath();
        ctx.roundRect(x + off, y, w, bh, 10);
        ctx.fillStyle = s.fill;
        ctx.fill();
        strokeIf(ctx, s);
        if (s.lights) {
            for (let wx = x + off + 14; wx < x + off + w - 20; wx += 24) {
                ctx.fillStyle = rnd() > 0.7 ? s.lights : 'rgba(0,0,0,0.25)';
                ctx.fillRect(wx, y + 10, 16, 14);
            }
        }
    }
};

const chimney: Element = (ctx, x, base, s, rnd, h) => {
    const ch = range(rnd, 220, 420) * (h / 600);
    const w = range(rnd, 26, 44);
    poly(ctx, [[x, base], [x + 4, base - ch], [x + w - 4, base - ch], [x + w, base]], s);
    for (let k = 1; k < 4; k++) {
        ctx.fillStyle = s.ink ?? s.fill;
        ctx.fillRect(x + 2, base - ch + k * 18, w - 4, 3);
    }
    // fumo
    for (let k = 0; k < 6; k++) {
        ctx.fillStyle = 'rgba(255,255,255,0.035)';
        ctx.beginPath();
        ctx.arc(x + w / 2 + k * 14, base - ch - 20 - k * 22, 14 + k * 6, 0, Math.PI * 2);
        ctx.fill();
    }
};

const tank: Element = (ctx, x, base, s, rnd, h) => {
    const w = range(rnd, 80, 140);
    const th = range(rnd, 90, 160) * (h / 600);
    ctx.beginPath();
    ctx.roundRect(x, base - th, w, th, [w / 2, w / 2, 0, 0]);
    ctx.fillStyle = s.fill;
    ctx.fill();
    strokeIf(ctx, s);
    ctx.strokeStyle = s.fill;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(x + w, base - th * 0.6);
    ctx.lineTo(x + w + 80, base - th * 0.6);
    ctx.lineTo(x + w + 80, base);
    ctx.stroke();
    rimTop(ctx, s, x + 10, base - th + 6, x + w - 10, base - th + 6);
};

const gothicTower: Element = (ctx, x, base, s, rnd, h) => {
    const w = range(rnd, 60, 120);
    const th = range(rnd, 220, 420) * (h / 600);
    poly(ctx, [[x, base], [x, base - th], [x + w * 0.2, base - th - 30], [x + w * 0.5, base - th - range(rnd, 70, 130)], [x + w * 0.8, base - th - 30], [x + w, base - th], [x + w, base]], s);
    if (s.lights) {
        for (let k = 0; k < 3; k++) {
            const wy = base - th + 40 + k * 60;
            ctx.fillStyle = rnd() > 0.4 ? s.lights : 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.moveTo(x + w / 2 - 7, wy + 26);
            ctx.lineTo(x + w / 2 - 7, wy + 8);
            ctx.quadraticCurveTo(x + w / 2, wy - 4, x + w / 2 + 7, wy + 8);
            ctx.lineTo(x + w / 2 + 7, wy + 26);
            ctx.fill();
        }
    }
};

const shelf: Element = (ctx, x, base, s, rnd, h) => {
    const w = range(rnd, 60, 100);
    const sh = range(rnd, 140, 260) * (h / 600);
    ctx.save();
    ctx.translate(x + w / 2, base);
    ctx.rotate((rnd() - 0.5) * 0.12);
    ctx.fillStyle = s.fill;
    ctx.fillRect(-w / 2, -sh, w, sh);
    ctx.beginPath();
    ctx.rect(-w / 2, -sh, w, sh);
    strokeIf(ctx, s);
    if (s.ink) {
        ctx.fillStyle = s.ink;
        for (let y = -sh + 20; y < 0; y += 24) ctx.fillRect(-w / 2, y, w, 3);
    }
    ctx.restore();
};

const serverTower: Element = (ctx, x, base, s, rnd, h) => {
    const w = range(rnd, 50, 90);
    const th = range(rnd, 200, 440) * (h / 600);
    ctx.fillStyle = s.fill;
    ctx.fillRect(x, base - th, w, th);
    ctx.beginPath();
    ctx.rect(x, base - th, w, th);
    strokeIf(ctx, s);
    if (s.lights) {
        for (let y = base - th + 10; y < base - 10; y += 9) {
            for (let k = 0; k < 4; k++) {
                if (rnd() > 0.6) {
                    ctx.fillStyle = s.lights;
                    ctx.fillRect(x + 8 + k * ((w - 16) / 4), y, 2, 2);
                }
            }
        }
    }
    ctx.strokeStyle = s.fill;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + w / 2, base - th);
    ctx.lineTo(x + w / 2, base - th - 50);
    ctx.stroke();
};

const vault: Element = (ctx, x, base, s, rnd, h) => {
    const w = range(rnd, 160, 240);
    const vh = range(rnd, 180, 280) * (h / 600);
    ctx.beginPath();
    ctx.moveTo(x - 10, base);
    ctx.lineTo(x - 10, base - vh);
    ctx.lineTo(x + w + 10, base - vh);
    ctx.lineTo(x + w + 10, base);
    ctx.lineTo(x + w - 14, base);
    ctx.lineTo(x + w - 14, base - vh * 0.55);
    ctx.quadraticCurveTo(x + w / 2, base - vh * 0.98, x + 14, base - vh * 0.55);
    ctx.lineTo(x + 14, base);
    ctx.closePath();
    ctx.fillStyle = s.fill;
    ctx.fill();
    strokeIf(ctx, s);
    // botte gigante nella volta
    if (rnd() > 0.4) {
        ctx.beginPath();
        ctx.ellipse(x + w / 2, base - 45, 52, 45, 0, 0, Math.PI * 2);
        ctx.fill();
        strokeIf(ctx, s);
    }
};

const floating: Element = (ctx, x, base, s, rnd, h) => {
    // isole di ricordi sospese: un pezzo di stanza, una sedia, una porta
    const y = base - range(rnd, 120, 420) * (h / 600);
    const w = range(rnd, 60, 140);
    poly(ctx, [[x, y], [x + w, y], [x + w * 0.8, y + 20], [x + w * 0.55, y + 50], [x + w * 0.3, y + 26]], s);
    if (rnd() > 0.5) {
        poly(ctx, [[x + w * 0.3, y], [x + w * 0.3, y - 50], [x + w * 0.3 + 26, y - 50], [x + w * 0.3 + 26, y]], s);
    } else {
        ctx.fillStyle = s.fill;
        ctx.fillRect(x + w * 0.5, y - 30, 4, 30);
        ctx.fillRect(x + w * 0.5 + 18, y - 22, 4, 22);
        ctx.fillRect(x + w * 0.5, y - 22, 22, 4);
    }
    if (s.lights && rnd() > 0.5) glowSpot(ctx, x + w / 2, y - 10, 30, 0xffffff, 0.08);
};

const monolith: Element = (ctx, x, base, s, rnd, h) => {
    const w = range(rnd, 30, 70);
    const mh = range(rnd, 140, 380) * (h / 600);
    const y = base - range(rnd, 0, 140);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rnd() - 0.5) * 0.4);
    poly(ctx, [[0, 0], [2, -mh], [w, -mh + 14], [w - 4, 0]], s);
    if (s.lights) {
        ctx.fillStyle = s.lights;
        ctx.fillRect(range(rnd, -20, 20), -mh * rnd(), w + 30, 2);
    }
    ctx.restore();
};

const stalagmite: Element = (ctx, x, base, s, rnd, h) => {
    const w = range(rnd, 40, 110);
    const sh = range(rnd, 120, 380) * (h / 600);
    poly(ctx, [[x, base], [x + w * 0.35, base - sh * 0.6], [x + w * 0.5, base - sh], [x + w * 0.62, base - sh * 0.55], [x + w, base]], s);
    // il pezzo che scende dall'alto, specchiato
    if (rnd() > 0.5) poly(ctx, [[x + w * 0.2, 0], [x + w * 0.45, sh * 0.5], [x + w * 0.7, 0]], s);
};

const skyscraper: Element = (ctx, x, base, s, rnd, h) => {
    const w = range(rnd, 60, 130);
    const th = range(rnd, 200, 480) * (h / 600);
    ctx.fillStyle = s.fill;
    ctx.fillRect(x, base - th, w, th);
    ctx.beginPath();
    ctx.rect(x, base - th, w, th);
    strokeIf(ctx, s);
    if (rnd() > 0.5) {
        // serbatoio d'acqua sul tetto, newyorkese
        ctx.fillRect(x + w * 0.6, base - th - 26, 20, 20);
        ctx.fillRect(x + w * 0.6 + 2, base - th - 6, 3, 6);
        ctx.fillRect(x + w * 0.6 + 15, base - th - 6, 3, 6);
    }
    windows(ctx, s, rnd, x, base - th, w, th, 0.14);
    rimTop(ctx, s, x, base - th, x + w, base - th);
};

const swampTree: Element = (ctx, x, base, s, rnd, h) => {
    const th = range(rnd, 160, 320) * (h / 600);
    const lean = (rnd() - 0.5) * 80;
    ctx.strokeStyle = s.fill;
    ctx.lineWidth = 14 + s.depth * 4;
    ctx.beginPath();
    ctx.moveTo(x, base);
    ctx.quadraticCurveTo(x + lean * 0.2, base - th * 0.5, x + lean, base - th);
    ctx.stroke();
    // radici a palafitta
    ctx.lineWidth = 4;
    for (let k = -2; k <= 2; k++) {
        ctx.beginPath();
        ctx.moveTo(x, base - 30);
        ctx.quadraticCurveTo(x + k * 18, base - 18, x + k * 26, base);
        ctx.stroke();
    }
    // chioma di muschio pendente
    ctx.fillStyle = s.fill;
    ctx.beginPath();
    ctx.ellipse(x + lean, base - th, 60, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2;
    for (let k = 0; k < 10; k++) {
        const mx = x + lean - 50 + k * 10;
        ctx.beginPath();
        ctx.moveTo(mx, base - th + 10);
        ctx.lineTo(mx + (rnd() - 0.5) * 6, base - th + range(rnd, 30, 90));
        ctx.stroke();
    }
};

const hut: Element = (ctx, x, base, s, rnd) => {
    const w = range(rnd, 70, 110);
    const stilts = range(rnd, 30, 60);
    ctx.fillStyle = s.fill;
    for (const sx of [x + 6, x + w - 10]) ctx.fillRect(sx, base - stilts, 4, stilts);
    poly(ctx, [[x, base - stilts], [x, base - stilts - 40], [x + w / 2, base - stilts - 70], [x + w, base - stilts - 40], [x + w, base - stilts]], s);
    if (s.lights && rnd() > 0.4) {
        ctx.fillStyle = s.lights;
        ctx.fillRect(x + w / 2 - 6, base - stilts - 30, 12, 12);
    }
};

const MOTIFS: Record<Skyline, { elements: Element[]; gap: [number, number]; hillAmp: number }> = {
    crossroads: { elements: [house, house, deadTree, arch, spire], gap: [60, 180], hillAmp: 50 },
    depot: { elements: [bus, pylon, house, wreck], gap: [80, 200], hillAmp: 16 },
    cathedral: { elements: [gothicTower, arch, spire], gap: [40, 140], hillAmp: 20 },
    crystals: { elements: [crystalSpire, crystalSpire, arch, spire], gap: [50, 160], hillAmp: 40 },
    wreckage: { elements: [pylon, wreck, wreck, chimney], gap: [90, 220], hillAmp: 60 },
    swamp: { elements: [swampTree, swampTree, hut, deadTree], gap: [60, 170], hillAmp: 24 },
    factory: { elements: [chimney, tank, tank, pylon], gap: [50, 160], hillAmp: 10 },
    library: { elements: [gothicTower, shelf, shelf, arch], gap: [40, 140], hillAmp: 14 },
    servers: { elements: [serverTower, serverTower, pylon], gap: [30, 120], hillAmp: 6 },
    cellar: { elements: [vault, vault, shelf], gap: [10, 60], hillAmp: 8 },
    dream: { elements: [floating, floating, monolith, house], gap: [80, 220], hillAmp: 30 },
    void: { elements: [monolith, monolith, floating], gap: [90, 260], hillAmp: 0 },
    cave: { elements: [stalagmite, stalagmite, arch], gap: [30, 120], hillAmp: 40 },
    noir: { elements: [skyscraper, skyscraper, skyscraper, gothicTower], gap: [8, 50], hillAmp: 0 },
};

export function layerStyle(b: BiomeDef, depth: number): LayerStyle {
    // più lontano = più vicino al colore della foschia
    const t = [0.62, 0.36, 0.1][depth];
    const fillColor = mix(mix(b.deep, b.rock, 0.12), b.haze, t);
    return {
        depth,
        fill: hex(fillColor),
        ink: depth === 0 ? null : hex(b.ink, depth === 1 ? 0.45 : 0.9),
        rim: depth === 2 ? hex(b.rim, 0.25) : depth === 1 ? hex(b.rim, 0.1) : null,
        lights: depth === 0 ? hex(b.accent, 0.18) : hex(shade(b.accent, 0.2), depth === 1 ? 0.35 : 0.55),
    };
}

const layerCache = new Map<string, HTMLCanvasElement>();

/** piano di parallasse tileabile in orizzontale, base in fondo al canvas */
export function skylineCanvas(b: BiomeDef, depth: number): HTMLCanvasElement {
    const key = `${b.id}:${depth}`;
    const hit = layerCache.get(key);
    if (hit) return hit;
    const h = [620, 520, 420][depth];
    const { el, ctx } = canvas(SKY_W, h);
    const rnd = mulberry32(b.id.length * 1013 + depth * 389 + b.skyline.length);
    const style = layerStyle(b, depth);
    const motif = MOTIFS[b.skyline];
    const base = h - 30;

    // gli elementi vicini al bordo si ridisegnano dall'altra parte: niente cuciture
    const placed: { el: Element; x: number; seed: number }[] = [];
    let x = rnd() * 80;
    while (x < SKY_W) {
        placed.push({ el: motif.elements[Math.floor(rnd() * motif.elements.length)], x, seed: Math.floor(rnd() * 1e9) });
        // radi: il dipinto dietro deve continuare a respirare
        x += range(rnd, motif.gap[0], motif.gap[1]) * (1.8 + (2 - depth) * 0.3) + 120;
    }
    for (const p of placed) {
        for (const off of [-SKY_W, 0, SKY_W]) {
            p.el(ctx, p.x + off, base, style, mulberry32(p.seed), h * [0.85, 0.62, 0.45][depth]);
        }
    }
    if (motif.hillAmp > 0) hills(ctx, SKY_W, base + 8, motif.hillAmp * (0.6 + depth * 0.3), style, rnd);
    ctx.fillStyle = style.fill;
    ctx.fillRect(0, base + 8, SKY_W, h - base);

    // i piedi di ogni piano affondano nella nebbia
    ctx.globalCompositeOperation = 'source-atop';
    const g = ctx.createLinearGradient(0, h * 0.45, 0, h);
    g.addColorStop(0, hex(b.haze, 0));
    g.addColorStop(1, hex(b.haze, [0.55, 0.4, 0.25][depth]));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, SKY_W, h);
    ctx.globalCompositeOperation = 'source-over';

    layerCache.set(key, el);
    return el;
}

/* ---------- primo piano nero ---------- */

const fgCache = new Map<string, HTMLCanvasElement>();
export const FG_H = 300;

/** striscia di primo piano (in alto o in basso), sfocata e quasi nera */
export function foregroundCanvas(b: BiomeDef, edge: 'top' | 'bottom'): HTMLCanvasElement | null {
    if (b.foreground === 'none') return null;
    const key = `${b.id}:${edge}`;
    const hit = fgCache.get(key);
    if (hit) return hit;
    const { el, ctx } = canvas(SKY_W, FG_H);
    const rnd = mulberry32(b.id.length * 31 + (edge === 'top' ? 7 : 13));
    const color = hex(mix(b.deep, 0x000000, 0.4));
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.filter = 'blur(2.5px)';
    const y0 = edge === 'bottom' ? FG_H : 0;
    const dir = edge === 'bottom' ? -1 : 1;
    const kind = b.foreground;
    // pochi elementi, distanziati: deve incorniciare, non coprire
    let x = rnd() * 300;
    while (x < SKY_W - 100) {
        const seed = Math.floor(rnd() * 1e9);
        for (const off of [-SKY_W, 0, SKY_W]) fgElement(ctx, kind, x + off, y0, dir, mulberry32(seed));
        x += range(rnd, 380, 820);
    }
    ctx.filter = 'none';
    fgCache.set(key, el);
    return el;
}

function fgElement(ctx: CanvasRenderingContext2D, kind: BiomeDef['foreground'], x: number, y0: number, dir: number, rnd: Rng): void {
    switch (kind) {
        case 'leaves': {
            // fronde di felce che entrano dal bordo
            const n = 3 + Math.floor(rnd() * 3);
            for (let i = 0; i < n; i++) {
                const len = range(rnd, 120, 260);
                const a = (dir < 0 ? -Math.PI / 2 : Math.PI / 2) + (rnd() - 0.5) * 1.3;
                const bx = x + (rnd() - 0.5) * 80;
                const ex = bx + Math.cos(a) * len;
                const ey = y0 + Math.sin(a) * len;
                ctx.lineWidth = 6;
                ctx.beginPath(); ctx.moveTo(bx, y0); ctx.quadraticCurveTo((bx + ex) / 2 + 30, (y0 + ey) / 2, ex, ey); ctx.stroke();
                for (let k = 1; k < 9; k++) {
                    const t = k / 9;
                    const px = bx + (ex - bx) * t;
                    const py = y0 + (ey - y0) * t;
                    const lw = (1 - t) * 40 + 8;
                    for (const side of [-1, 1]) {
                        ctx.beginPath();
                        ctx.ellipse(px + side * lw * 0.5, py, lw * 0.6, 6, a + side * 0.6, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }
            break;
        }
        case 'chains': {
            if (dir < 0) {
                ctx.fillRect(x, y0 - 30, range(rnd, 100, 260), 30);
                break;
            }
            const n = 1 + Math.floor(rnd() * 3);
            for (let i = 0; i < n; i++) {
                const cx = x + i * 26;
                const len = range(rnd, 120, FG_H);
                ctx.lineWidth = 5;
                for (let y = 0; y < len; y += 16) {
                    ctx.beginPath();
                    ctx.ellipse(cx, y + 8, 6, 10, 0, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }
            break;
        }
        case 'pillars': {
            const w = range(rnd, 50, 90);
            if (dir > 0) {
                // spicchio d'arco gotico che entra dall'alto
                const span = range(rnd, 260, 420);
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, 40);
                ctx.quadraticCurveTo(x + span / 2, 40 + span * 0.45, x + span, 40);
                ctx.lineTo(x + span, 0);
                ctx.lineTo(x + span - w * 0.6, 0);
                ctx.quadraticCurveTo(x + span / 2, span * 0.3, x + w * 0.6, 0);
                ctx.closePath();
                ctx.fill();
            } else {
                // moncone di colonna spezzato, con le macerie ai piedi
                const ph = range(rnd, 90, 220);
                ctx.beginPath();
                ctx.moveTo(x, y0);
                ctx.lineTo(x, y0 - ph);
                ctx.lineTo(x + w * 0.4, y0 - ph - range(rnd, 10, 30));
                ctx.lineTo(x + w * 0.7, y0 - ph + 8);
                ctx.lineTo(x + w, y0 - ph - 4);
                ctx.lineTo(x + w, y0);
                ctx.closePath();
                ctx.fill();
                for (let k = 0; k < 4; k++) {
                    ctx.beginPath();
                    ctx.arc(x - 20 + rnd() * (w + 60), y0 - 6, range(rnd, 6, 16), Math.PI, 0);
                    ctx.fill();
                }
            }
            break;
        }
        case 'pipes': {
            const r = range(rnd, 18, 34);
            if (dir < 0) {
                ctx.fillRect(x, y0 - r * 2 - 10, range(rnd, 200, 500), r * 2);
                ctx.fillRect(x + 40, y0 - r * 2 - 22, 30, r * 2 + 24);
            } else {
                ctx.fillRect(x, 10, range(rnd, 200, 500), r * 2);
                ctx.fillRect(x + 100, 0, r * 1.6, FG_H * 0.8);
            }
            break;
        }
        case 'cables': {
            const n = 2 + Math.floor(rnd() * 3);
            for (let i = 0; i < n; i++) {
                const span = range(rnd, 200, 500);
                const sag = range(rnd, 60, 200);
                ctx.lineWidth = range(rnd, 4, 9);
                ctx.beginPath();
                if (dir > 0) {
                    ctx.moveTo(x, 0);
                    ctx.quadraticCurveTo(x + span / 2, sag * 2, x + span, 0);
                } else {
                    ctx.moveTo(x, y0 - 10);
                    ctx.quadraticCurveTo(x + span / 2, y0 - 60 - sag * 0.3, x + span, y0 - 10);
                }
                ctx.stroke();
            }
            break;
        }
        case 'crystals': {
            const n = 2 + Math.floor(rnd() * 3);
            for (let i = 0; i < n; i++) {
                const cx = x + i * 30;
                const ch = range(rnd, 80, 220);
                const cw = range(rnd, 18, 40);
                ctx.beginPath();
                ctx.moveTo(cx - cw, y0);
                ctx.lineTo(cx + (rnd() - 0.5) * 40, y0 + dir * ch);
                ctx.lineTo(cx + cw, y0);
                ctx.closePath();
                ctx.fill();
            }
            break;
        }
        case 'reeds': {
            if (dir > 0) break;
            const n = 6 + Math.floor(rnd() * 6);
            for (let i = 0; i < n; i++) {
                const rx = x + rnd() * 120;
                const rh = range(rnd, 100, 260);
                ctx.lineWidth = 4;
                ctx.beginPath(); ctx.moveTo(rx, y0); ctx.lineTo(rx + (rnd() - 0.5) * 40, y0 - rh); ctx.stroke();
                if (rnd() > 0.5) {
                    ctx.beginPath(); ctx.ellipse(rx, y0 - rh + 20, 6, 18, 0, 0, Math.PI * 2); ctx.fill();
                }
            }
            break;
        }
        default:
            break;
    }
}
