import type { BiomeDef, PropKind } from '../../content/biomes';
import {
    canvas, crossHatch, glowSpot, hatch, hex, inkLine, inkShape, mix, mulberry32, range, shade, stipple,
    type Pt, type Rng,
} from './ink';

/* oggetti di scena disegnati a inchiostro per bioma. ogni prop è
   ancorato in basso al centro; alcuni portano una luce */

export interface PropArt {
    /** chiave stabile, buona come nome di texture */
    id: string;
    canvas: HTMLCanvasElement;
    /** luce opzionale, in coordinate locali rispetto all'ancora (0,0 = base centrale) */
    light?: { x: number; y: number; color: number; radius: number };
    /** grande e scenografico: va sullo sfondo, più scuro */
    backdrop?: boolean;
}

interface Pal {
    body: number;
    dark: number;
    light: number;
    ink: string;
    accent: number;
    b: BiomeDef;
}

type Painter = (ctx: CanvasRenderingContext2D, w: number, h: number, p: Pal, rnd: Rng) => Omit<PropArt, 'canvas' | 'id'> | void;

interface Spec {
    w: number;
    h: number;
    paint: Painter;
}

const fill = (c: number, a = 1) => hex(c, a);

function shadeSide(ctx: CanvasRenderingContext2D, pts: Pt[], rnd: Rng, p: Pal, density = 0.5): void {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (const q of pts.slice(1)) ctx.lineTo(q.x, q.y);
    ctx.closePath();
    ctx.clip();
    const xs = pts.map((q) => q.x);
    const ys = pts.map((q) => q.y);
    const x0 = Math.min(...xs);
    const y0 = Math.min(...ys);
    crossHatch(ctx, x0, y0, Math.max(...xs) - x0, Math.max(...ys) - y0, rnd, hex(p.b.ink, 0.6), density, 0.9);
    ctx.restore();
}

function rect(x: number, y: number, w: number, h: number): Pt[] {
    return [{ x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }];
}

const SPECS: Record<PropKind, Spec> = {
    lantern: {
        w: 60, h: 150,
        paint(ctx, w, h, p, rnd) {
            const cx = w / 2;
            inkShape(ctx, rect(cx - 3, 40, 6, h - 44), rnd, fill(p.dark), p.ink, 1.6, 0.5);
            inkShape(ctx, [{ x: cx - 14, y: h - 2 }, { x: cx + 14, y: h - 2 }, { x: cx + 8, y: h - 10 }, { x: cx - 8, y: h - 10 }], rnd, fill(p.body), p.ink, 1.5, 0.4);
            // gabbia della lanterna
            glowSpot(ctx, cx, 26, 26, p.accent, 0.35);
            inkShape(ctx, [{ x: cx - 10, y: 14 }, { x: cx + 10, y: 14 }, { x: cx + 8, y: 38 }, { x: cx - 8, y: 38 }], rnd, fill(shade(p.accent, 0.3), 0.9), p.ink, 1.8, 0.4);
            inkLine(ctx, [{ x: cx, y: 14 }, { x: cx, y: 38 }], rnd, p.ink, 1.2, 0.2);
            inkShape(ctx, [{ x: cx - 14, y: 14 }, { x: cx, y: 2 }, { x: cx + 14, y: 14 }], rnd, fill(p.dark), p.ink, 1.6, 0.3);
            inkShape(ctx, rect(cx - 9, 38, 18, 4), rnd, fill(p.dark), p.ink, 1.4, 0.3);
            return { light: { x: 0, y: -(h - 26), color: p.accent, radius: 230 } };
        },
    },
    gravestone: {
        w: 70, h: 80,
        paint(ctx, w, h, p, rnd) {
            const top = range(rnd, 6, 18);
            const pts: Pt[] = [{ x: 10, y: h - 2 }, { x: 10, y: top + 18 }, { x: w / 2, y: top }, { x: w - 10, y: top + 18 }, { x: w - 10, y: h - 2 }];
            inkShape(ctx, pts, rnd, fill(p.body), p.ink, 2, 1);
            shadeSide(ctx, [{ x: w / 2, y: top }, { x: w - 10, y: top + 18 }, { x: w - 10, y: h - 2 }, { x: w / 2 + 6, y: h - 2 }], rnd, p, 0.6);
            // incisioni: rune del realm o un geco stilizzato
            ctx.strokeStyle = p.ink;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(w / 2 - 8, top + 26); ctx.lineTo(w / 2 + 8, top + 26);
            ctx.moveTo(w / 2, top + 20); ctx.lineTo(w / 2, top + 44);
            ctx.moveTo(w / 2 - 6, top + 40); ctx.lineTo(w / 2 + 6, top + 34);
            ctx.stroke();
            stipple(ctx, 10, top, w - 20, h - top, rnd, fill(p.b.accent, 0.35), 25, 2);
        },
    },
    bush: {
        w: 90, h: 70,
        paint(ctx, w, h, p, rnd) {
            const branch = (x: number, y: number, a: number, len: number, depth: number) => {
                if (depth === 0 || len < 4) return;
                const x2 = x + Math.cos(a) * len;
                const y2 = y + Math.sin(a) * len;
                inkLine(ctx, [{ x, y }, { x: x2, y: y2 }], rnd, p.ink, depth * 0.9 + 0.6, 0.3);
                branch(x2, y2, a - range(rnd, 0.2, 0.6), len * range(rnd, 0.6, 0.8), depth - 1);
                if (rnd() > 0.3) branch(x2, y2, a + range(rnd, 0.2, 0.6), len * range(rnd, 0.55, 0.75), depth - 1);
            };
            for (let i = 0; i < 5; i++) branch(w / 2 + (rnd() - 0.5) * 20, h - 2, -Math.PI / 2 + (rnd() - 0.5) * 1.6, range(rnd, 14, 24), 4);
            ctx.fillStyle = fill(p.b.accent, 0.5);
            for (let i = 0; i < 8; i++) ctx.fillRect(10 + rnd() * (w - 20), 6 + rnd() * (h - 30), 2, 2);
        },
    },
    mushroom: {
        w: 70, h: 70,
        paint(ctx, w, h, p, rnd) {
            const n = 2 + Math.floor(rnd() * 2);
            for (let i = 0; i < n; i++) {
                const x = 14 + rnd() * (w - 28);
                const sh = range(rnd, 16, 50);
                const cw = range(rnd, 9, 18);
                inkShape(ctx, [{ x: x - 3, y: h - 1 }, { x: x - 2, y: h - sh }, { x: x + 2, y: h - sh }, { x: x + 3, y: h - 1 }], rnd, fill(shade(p.body, 0.15)), p.ink, 1.4, 0.3);
                const cap: Pt[] = [];
                for (let k = 0; k <= 10; k++) {
                    const a = Math.PI + (k / 10) * Math.PI;
                    cap.push({ x: x + Math.cos(a) * cw, y: h - sh + Math.sin(a) * cw * 0.7 });
                }
                inkShape(ctx, cap, rnd, fill(mix(p.dark, p.accent, 0.35)), p.ink, 1.6, 0.3);
                ctx.fillStyle = fill(shade(p.accent, 0.4), 0.85);
                for (let k = 0; k < 3; k++) {
                    ctx.beginPath();
                    ctx.arc(x + (rnd() - 0.5) * cw, h - sh - rnd() * cw * 0.5, 1.6, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            return { light: { x: 0, y: -24, color: p.accent, radius: 110 } };
        },
    },
    bones: {
        w: 80, h: 44,
        paint(ctx, w, h, p, rnd) {
            const bone = (x1: number, y1: number, x2: number, y2: number) => {
                ctx.strokeStyle = p.ink;
                ctx.lineWidth = 6;
                ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
                ctx.strokeStyle = fill(0xcfc6b0);
                ctx.lineWidth = 3.4;
                ctx.stroke();
                for (const [bx, by] of [[x1, y1], [x2, y2]]) {
                    ctx.fillStyle = fill(0xcfc6b0);
                    ctx.beginPath(); ctx.arc(bx, by, 3.6, 0, Math.PI * 2); ctx.fill();
                    ctx.strokeStyle = p.ink; ctx.lineWidth = 1.2; ctx.stroke();
                }
            };
            bone(8, h - 6, 40, h - 12);
            bone(30, h - 4, 66, h - 8);
            // teschio di geco: muso lungo, orbite grandi
            const sx = w - 26;
            const sy = h - 14;
            inkShape(ctx, [{ x: sx - 14, y: sy + 8 }, { x: sx - 12, y: sy - 6 }, { x: sx + 2, y: sy - 10 }, { x: sx + 18, y: sy - 2 }, { x: sx + 20, y: sy + 8 }], rnd, fill(0xd8d0bc), p.ink, 1.8, 0.4);
            ctx.fillStyle = p.ink;
            ctx.beginPath(); ctx.ellipse(sx - 3, sy - 2, 4, 3.4, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(sx + 9, sy - 1, 3, 2.6, 0, 0, Math.PI * 2); ctx.fill();
            shadeSide(ctx, [{ x: sx - 14, y: sy + 2 }, { x: sx + 20, y: sy + 2 }, { x: sx + 20, y: sy + 8 }, { x: sx - 14, y: sy + 8 }], rnd, p, 0.5);
        },
    },
    signpost: {
        w: 90, h: 120,
        paint(ctx, w, h, p, rnd) {
            const cx = w / 2;
            inkShape(ctx, rect(cx - 4, 18, 8, h - 20), rnd, fill(mix(0x5a3e2a, p.dark, 0.4)), p.ink, 1.8, 0.6);
            const board = (y: number, dir: number) => {
                const x0 = dir > 0 ? cx - 6 : cx - 38;
                const pts: Pt[] = dir > 0
                    ? [{ x: x0, y }, { x: x0 + 36, y }, { x: x0 + 44, y: y + 9 }, { x: x0 + 36, y: y + 18 }, { x: x0, y: y + 18 }]
                    : [{ x: x0 + 44, y }, { x: x0 + 8, y }, { x: x0, y: y + 9 }, { x: x0 + 8, y: y + 18 }, { x: x0 + 44, y: y + 18 }];
                inkShape(ctx, pts, rnd, fill(mix(0x7a5a3a, p.dark, 0.35)), p.ink, 1.8, 0.5);
                ctx.strokeStyle = fill(0xe8dcc0, 0.55);
                ctx.lineWidth = 1.4;
                ctx.beginPath();
                for (let k = 0; k < 3; k++) {
                    const sx = x0 + 10 + k * 9;
                    ctx.moveTo(sx, y + 9 + (rnd() - 0.5) * 3);
                    ctx.lineTo(sx + 6, y + 9 + (rnd() - 0.5) * 3);
                }
                ctx.stroke();
            };
            board(22, 1);
            board(46, -1);
        },
    },
    pillar: {
        w: 80, h: 220,
        paint(ctx, w, h, p, rnd) {
            const cx = w / 2;
            const bw = 22;
            const broken = range(rnd, 0, 60);
            const top = 16 + broken;
            const body: Pt[] = [{ x: cx - bw, y: h - 18 }, { x: cx - bw, y: top + 10 }, { x: cx - bw + 6, y: top + 2 }, { x: cx + 2, y: top + 12 }, { x: cx + 8, y: top - 2 }, { x: cx + bw, y: top + 6 }, { x: cx + bw, y: h - 18 }];
            inkShape(ctx, body, rnd, fill(p.body), p.ink, 2.2, 0.8);
            shadeSide(ctx, [{ x: cx + 6, y: top }, { x: cx + bw, y: top }, { x: cx + bw, y: h - 18 }, { x: cx + 6, y: h - 18 }], rnd, p, 0.7);
            ctx.strokeStyle = fill(p.b.ink, 0.8);
            ctx.lineWidth = 1.3;
            for (const fx of [-12, -4, 4, 12]) {
                inkLine(ctx, [{ x: cx + fx, y: top + 16 }, { x: cx + fx, y: h - 22 }], rnd, fill(p.b.ink, 0.7), 1.2, 0.5);
            }
            inkShape(ctx, rect(cx - bw - 8, h - 20, bw * 2 + 16, 18), rnd, fill(shade(p.body, -0.1)), p.ink, 2, 0.6);
            inkShape(ctx, [{ x: cx - bw - 14, y: h - 1 }, { x: cx - bw - 10, y: h - 8 }, { x: cx - bw - 2, y: h - 4 }, { x: cx - bw, y: h - 1 }], rnd, fill(p.body), p.ink, 1.4, 0.5);
            return { backdrop: true };
        },
    },
    books: {
        w: 70, h: 90,
        paint(ctx, w, h, p, rnd) {
            const colors = [0x6b2d2d, 0x2d3f6b, 0x4a5a2d, 0x5a4a2d, 0x3d2d5a, 0x6b5a2d];
            let y = h - 2;
            while (y > 20) {
                const bw = range(rnd, 34, 56);
                const bh = range(rnd, 6, 11);
                const x = w / 2 - bw / 2 + (rnd() - 0.5) * 10;
                ctx.save();
                ctx.translate(x + bw / 2, y - bh / 2);
                ctx.rotate((rnd() - 0.5) * 0.12);
                const pts = rect(-bw / 2, -bh / 2, bw, bh);
                inkShape(ctx, pts, rnd, fill(mix(colors[Math.floor(rnd() * colors.length)], p.dark, 0.3)), p.ink, 1.5, 0.3);
                ctx.fillStyle = fill(0xe8dcc0, 0.55);
                ctx.fillRect(bw / 2 - 5, -bh / 2 + 1.5, 3, bh - 3);
                ctx.restore();
                y -= bh;
            }
        },
    },
    candles: {
        w: 70, h: 90,
        paint(ctx, w, h, p, rnd) {
            const n = 3 + Math.floor(rnd() * 3);
            let top = h;
            for (let i = 0; i < n; i++) {
                const x = 12 + (i / (n - 1)) * (w - 24) + (rnd() - 0.5) * 4;
                const ch = range(rnd, 14, 46);
                top = Math.min(top, h - ch);
                inkShape(ctx, [{ x: x - 4, y: h - 1 }, { x: x - 4, y: h - ch }, { x: x - 1, y: h - ch - 2 }, { x: x + 4, y: h - ch }, { x: x + 4, y: h - 1 }], rnd, fill(0xd9d0b8), p.ink, 1.3, 0.3);
                ctx.fillStyle = fill(0xd9d0b8);
                ctx.beginPath(); ctx.ellipse(x + 3, h - ch + 6, 1.6, 4, 0, 0, Math.PI * 2); ctx.fill();
                glowSpot(ctx, x, h - ch - 8, 14, 0xffb347, 0.5);
                ctx.fillStyle = fill(0xffd27a);
                ctx.beginPath(); ctx.ellipse(x, h - ch - 7, 2.4, 5, 0, 0, Math.PI * 2); ctx.fill();
            }
            return { light: { x: 0, y: -(h - top) - 10, color: 0xffb347, radius: 170 } };
        },
    },
    lectern: {
        w: 70, h: 100,
        paint(ctx, w, h, p, rnd) {
            const cx = w / 2;
            const wood = mix(0x5a3e2a, p.dark, 0.35);
            inkShape(ctx, [{ x: cx - 6, y: h - 8 }, { x: cx - 4, y: 40 }, { x: cx + 4, y: 40 }, { x: cx + 6, y: h - 8 }], rnd, fill(wood), p.ink, 1.8, 0.4);
            inkShape(ctx, rect(cx - 20, h - 10, 40, 8), rnd, fill(wood), p.ink, 1.8, 0.4);
            inkShape(ctx, [{ x: cx - 28, y: 34 }, { x: cx + 28, y: 22 }, { x: cx + 30, y: 32 }, { x: cx - 26, y: 46 }], rnd, fill(wood), p.ink, 2, 0.4);
            inkShape(ctx, [{ x: cx - 24, y: 30 }, { x: cx, y: 22 }, { x: cx + 24, y: 18 }, { x: cx + 25, y: 24 }, { x: cx, y: 28 }, { x: cx - 23, y: 36 }], rnd, fill(0xe2d8bf), p.ink, 1.4, 0.3);
            ctx.strokeStyle = fill(p.b.ink, 0.6);
            ctx.lineWidth = 0.8;
            for (let k = 0; k < 4; k++) {
                ctx.beginPath();
                ctx.moveTo(cx - 18, 30 + k * 1.5 - k * 0.3);
                ctx.lineTo(cx - 4, 26 + k * 1.5 - k * 0.3);
                ctx.stroke();
            }
        },
    },
    barrel: {
        w: 54, h: 66,
        paint(ctx, w, h, p, rnd) {
            const wood = mix(0x6a4a2e, p.dark, 0.3);
            const pts: Pt[] = [];
            for (let k = 0; k <= 12; k++) {
                const t = k / 12;
                pts.push({ x: 8 - Math.sin(t * Math.PI) * 5, y: 4 + t * (h - 6) });
            }
            for (let k = 12; k >= 0; k--) {
                const t = k / 12;
                pts.push({ x: w - 8 + Math.sin(t * Math.PI) * 5, y: 4 + t * (h - 6) });
            }
            inkShape(ctx, pts, rnd, fill(wood), p.ink, 2, 0.4);
            shadeSide(ctx, pts.slice(13), rnd, p, 0.5);
            for (const hy of [14, h - 14]) {
                inkLine(ctx, [{ x: 4, y: hy }, { x: w / 2, y: hy + 3 }, { x: w - 4, y: hy }], rnd, fill(0x2a2a2e), 3, 0.3);
            }
            for (const sx of [w * 0.35, w * 0.6]) inkLine(ctx, [{ x: sx, y: 6 }, { x: sx, y: h - 4 }], rnd, fill(p.b.ink, 0.6), 1, 0.4);
        },
    },
    valve: {
        w: 80, h: 110,
        paint(ctx, w, h, p, rnd) {
            const metal = mix(p.body, 0x6a7a80, 0.4);
            inkShape(ctx, rect(w / 2 - 9, 30, 18, h - 30), rnd, fill(metal), p.ink, 2, 0.3);
            inkShape(ctx, rect(w / 2 - 14, 40, 28, 8), rnd, fill(shade(metal, -0.15)), p.ink, 1.6, 0.3);
            inkShape(ctx, rect(w / 2 - 14, h - 26, 28, 8), rnd, fill(shade(metal, -0.15)), p.ink, 1.6, 0.3);
            inkShape(ctx, rect(w / 2 - 30, 52, 30, 12), rnd, fill(metal), p.ink, 1.8, 0.3);
            // volantino
            ctx.strokeStyle = p.ink;
            ctx.lineWidth = 5;
            ctx.beginPath(); ctx.arc(w / 2, 18, 14, 0, Math.PI * 2); ctx.stroke();
            ctx.strokeStyle = fill(mix(0x8a2a2a, p.dark, 0.2));
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.strokeStyle = p.ink;
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(w / 2 - 14, 18); ctx.lineTo(w / 2 + 14, 18); ctx.moveTo(w / 2, 4); ctx.lineTo(w / 2, 32); ctx.stroke();
            hatch(ctx, w / 2, 30, 9, h - 30, rnd, fill(p.b.ink, 0.5), Math.PI / 2, 3, 0.8);
        },
    },
    crate: {
        w: 60, h: 56,
        paint(ctx, w, h, p, rnd) {
            const wood = mix(0x6e5134, p.dark, 0.35);
            const s = range(rnd, 38, 52);
            const x = (w - s) / 2;
            const y = h - s;
            inkShape(ctx, rect(x, y, s, s), rnd, fill(wood), p.ink, 2.2, 0.5);
            inkLine(ctx, [{ x: x + 4, y: y + 4 }, { x: x + s - 4, y: y + s - 4 }], rnd, p.ink, 2, 0.4);
            inkLine(ctx, [{ x: x + s - 4, y: y + 4 }, { x: x + 4, y: y + s - 4 }], rnd, p.ink, 2, 0.4);
            inkShape(ctx, rect(x, y, s, 6), rnd, fill(shade(wood, 0.1)), p.ink, 1.4, 0.3);
            shadeSide(ctx, rect(x + s * 0.55, y, s * 0.45, s), rnd, p, 0.45);
        },
    },
    rack: {
        w: 70, h: 170,
        paint(ctx, w, h, p, rnd) {
            const metal = mix(p.body, 0x1a2228, 0.4);
            inkShape(ctx, rect(6, 6, w - 12, h - 8), rnd, fill(metal), p.ink, 2.4, 0.3);
            for (let y = 16; y < h - 16; y += 14) {
                inkShape(ctx, rect(12, y, w - 24, 10), rnd, fill(shade(metal, -0.25)), p.ink, 1.2, 0.2);
                for (let k = 0; k < 3; k++) {
                    if (rnd() > 0.35) {
                        const c = rnd() > 0.85 ? 0xf87171 : p.accent;
                        ctx.fillStyle = fill(c, 0.95);
                        ctx.fillRect(w - 22 + k * 4, y + 4, 2.2, 2.2);
                    }
                }
                ctx.strokeStyle = fill(p.b.ink, 0.8);
                ctx.lineWidth = 0.8;
                ctx.beginPath();
                for (let k = 0; k < 5; k++) { ctx.moveTo(16 + k * 4, y + 2); ctx.lineTo(16 + k * 4, y + 8); }
                ctx.stroke();
            }
            return { light: { x: 0, y: -h / 2, color: p.accent, radius: 120 }, backdrop: true };
        },
    },
    camera: {
        w: 70, h: 140,
        paint(ctx, w, h, p, rnd) {
            const cx = w / 2;
            inkShape(ctx, rect(cx - 3, 30, 6, h - 30), rnd, fill(p.dark), p.ink, 1.6, 0.3);
            inkShape(ctx, [{ x: cx - 4, y: 34 }, { x: cx - 26, y: 14 }, { x: cx + 14, y: 2 }, { x: cx + 22, y: 18 }], rnd, fill(mix(p.body, 0xdadada, 0.3)), p.ink, 2, 0.3);
            ctx.fillStyle = p.ink;
            ctx.beginPath(); ctx.arc(cx - 20, 16, 6, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = fill(0xf87171);
            ctx.beginPath(); ctx.arc(cx - 20, 16, 2.4, 0, Math.PI * 2); ctx.fill();
            glowSpot(ctx, cx - 20, 16, 12, 0xf87171, 0.5);
        },
    },
    bottles: {
        w: 70, h: 60,
        paint(ctx, w, h, p, rnd) {
            const wood = mix(0x6e5134, p.dark, 0.35);
            inkShape(ctx, rect(4, h - 22, w - 8, 20), rnd, fill(wood), p.ink, 2, 0.4);
            for (let k = 0; k < 5; k++) {
                const x = 12 + k * ((w - 24) / 4);
                const glass = [0x2f6b3a, 0x6b4a1f, 0x1f4a6b][k % 3];
                ctx.fillStyle = fill(glass, 0.9);
                ctx.beginPath();
                ctx.roundRect(x - 4, h - 40, 8, 22, 2);
                ctx.rect(x - 1.6, h - 48, 3.2, 9);
                ctx.fill();
                ctx.strokeStyle = p.ink;
                ctx.lineWidth = 1.2;
                ctx.stroke();
                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                ctx.fillRect(x - 2.5, h - 37, 1.2, 12);
            }
            inkShape(ctx, rect(4, h - 22, w - 8, 4), rnd, fill(shade(wood, 0.1)), p.ink, 1.2, 0.3);
        },
    },
    busstop: {
        w: 130, h: 170,
        paint(ctx, _w, h, p, rnd) {
            const metal = mix(p.body, 0x9a9a8a, 0.25);
            inkShape(ctx, rect(18, 36, 6, h - 36), rnd, fill(metal), p.ink, 1.6, 0.3);
            ctx.fillStyle = fill(0xfacc15);
            ctx.beginPath(); ctx.arc(21, 26, 16, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = p.ink; ctx.lineWidth = 2.4; ctx.stroke();
            ctx.fillStyle = p.ink;
            ctx.font = 'bold 13px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('14', 21, 31);
            // pensilina con panchina
            inkShape(ctx, rect(44, 60, 6, h - 60), rnd, fill(metal), p.ink, 1.6, 0.3);
            inkShape(ctx, rect(112, 60, 6, h - 60), rnd, fill(metal), p.ink, 1.6, 0.3);
            inkShape(ctx, [{ x: 38, y: 62 }, { x: 124, y: 52 }, { x: 126, y: 60 }, { x: 40, y: 70 }], rnd, fill(shade(metal, -0.2)), p.ink, 2, 0.3);
            ctx.fillStyle = fill(0x9ad0e0, 0.12);
            ctx.fillRect(50, 70, 62, h - 100);
            hatch(ctx, 50, 70, 62, h - 100, rnd, 'rgba(200,230,240,0.15)', -0.8, 9, 1);
            inkShape(ctx, rect(52, h - 30, 58, 6), rnd, fill(mix(0x6e5134, p.dark, 0.3)), p.ink, 1.6, 0.3);
            return { backdrop: true };
        },
    },
    tire: {
        w: 70, h: 64,
        paint(ctx, w, h, p, rnd) {
            const n = 1 + Math.floor(rnd() * 3);
            for (let i = 0; i < n; i++) {
                const y = h - 10 - i * 15;
                ctx.fillStyle = fill(0x1c1c20);
                ctx.beginPath(); ctx.ellipse(w / 2 + (rnd() - 0.5) * 6, y, 28, 9, 0, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = p.ink; ctx.lineWidth = 2; ctx.stroke();
                ctx.fillStyle = fill(0x050507);
                ctx.beginPath(); ctx.ellipse(w / 2, y - 2, 13, 4, 0, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = fill(0x55555a, 0.6); ctx.lineWidth = 1;
                ctx.beginPath(); ctx.ellipse(w / 2, y, 22, 6.5, 0, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
            }
        },
    },
    cone: {
        w: 60, h: 50,
        paint(ctx, w, h, p, rnd) {
            const n = 1 + Math.floor(rnd() * 2);
            for (let i = 0; i < n; i++) {
                const x = w / 2 + (i - (n - 1) / 2) * 22;
                inkShape(ctx, rect(x - 13, h - 5, 26, 4), rnd, fill(0x2a2a2a), p.ink, 1.4, 0.2);
                inkShape(ctx, [{ x: x - 10, y: h - 5 }, { x: x - 2, y: h - 40 }, { x: x + 2, y: h - 40 }, { x: x + 10, y: h - 5 }], rnd, fill(mix(0xf97316, p.dark, 0.2)), p.ink, 1.8, 0.3);
                ctx.fillStyle = fill(0xe8e8e0, 0.85);
                ctx.fillRect(x - 6, h - 24, 12, 5);
            }
        },
    },
    crystal: {
        w: 110, h: 150,
        paint(ctx, w, h, p, rnd) {
            const shards = 3 + Math.floor(rnd() * 3);
            glowSpot(ctx, w / 2, h - 40, 60, p.accent, 0.25);
            for (let i = 0; i < shards; i++) {
                const x = w / 2 + (rnd() - 0.5) * 50;
                const sh = range(rnd, 50, h - 8);
                const sw = range(rnd, 9, 18);
                const tilt = (rnd() - 0.5) * 0.6;
                const tip = { x: x + Math.sin(tilt) * sh, y: h - Math.cos(tilt) * sh };
                const pts: Pt[] = [{ x: x - sw, y: h - 1 }, { x: x - sw * 0.8 + Math.sin(tilt) * sh * 0.7, y: h - sh * 0.7 }, tip, { x: x + sw * 0.8 + Math.sin(tilt) * sh * 0.7, y: h - sh * 0.68 }, { x: x + sw, y: h - 1 }];
                inkShape(ctx, pts, rnd, fill(mix(p.body, p.accent, 0.5)), p.ink, 2, 0.4);
                ctx.fillStyle = fill(shade(p.accent, 0.45), 0.8);
                ctx.beginPath();
                ctx.moveTo(x - sw * 0.2, h - 4);
                ctx.lineTo(tip.x, tip.y);
                ctx.lineTo(x + sw * 0.5 + Math.sin(tilt) * sh * 0.6, h - sh * 0.6);
                ctx.closePath();
                ctx.fill();
                shadeSide(ctx, [{ x: x + sw * 0.4, y: h - 1 }, tip, pts[3], pts[4]], rnd, p, 0.5);
            }
            return { light: { x: 0, y: -h / 2, color: p.accent, radius: 200 } };
        },
    },
    mirror: {
        w: 80, h: 150,
        paint(ctx, w, h, p, rnd) {
            const frame = mix(0x8a7a4a, p.dark, 0.35);
            const pts: Pt[] = [];
            for (let k = 0; k <= 20; k++) {
                const a = (k / 20) * Math.PI * 2;
                pts.push({ x: w / 2 + Math.cos(a) * 30, y: 62 + Math.sin(a) * 56 });
            }
            inkShape(ctx, pts, rnd, fill(frame), p.ink, 2.4, 0.4);
            const inner = pts.map((q) => ({ x: w / 2 + (q.x - w / 2) * 0.8, y: 62 + (q.y - 62) * 0.85 }));
            const g = ctx.createLinearGradient(0, 10, w, 120);
            g.addColorStop(0, hex(shade(p.accent, 0.3), 0.8));
            g.addColorStop(0.5, hex(p.dark, 0.9));
            g.addColorStop(1, hex(p.accent, 0.5));
            inkShape(ctx, inner, rnd, 'rgba(0,0,0,0)', p.ink, 1.6, 0.2);
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(inner[0].x, inner[0].y);
            for (const q of inner) ctx.lineTo(q.x, q.y);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(w / 2 - 12, 30); ctx.lineTo(w / 2 + 4, 60); ctx.stroke();
            inkShape(ctx, [{ x: w / 2 - 6, y: 116 }, { x: w / 2 + 6, y: 116 }, { x: w / 2 + 16, y: h - 1 }, { x: w / 2 - 16, y: h - 1 }], rnd, fill(frame), p.ink, 2, 0.4);
            return { light: { x: 0, y: -(h - 62), color: p.accent, radius: 140 } };
        },
    },
    reeds: {
        w: 70, h: 120,
        paint(ctx, w, h, p, rnd) {
            for (let i = 0; i < 7; i++) {
                const x = 10 + rnd() * (w - 20);
                const rh = range(rnd, 50, h - 6);
                const lean = (rnd() - 0.5) * 18;
                inkLine(ctx, [{ x, y: h }, { x: x + lean * 0.5, y: h - rh * 0.5 }, { x: x + lean, y: h - rh }], rnd, p.ink, 2.2, 0.3);
                if (rnd() > 0.4) {
                    ctx.fillStyle = fill(mix(0x5a3a1a, p.dark, 0.3));
                    ctx.beginPath(); ctx.ellipse(x + lean, h - rh + 10, 3.4, 10, lean * 0.015, 0, Math.PI * 2); ctx.fill();
                    ctx.strokeStyle = p.ink; ctx.lineWidth = 1.3; ctx.stroke();
                }
            }
        },
    },
    toxic: {
        w: 70, h: 80,
        paint(ctx, w, h, p, rnd) {
            const drum = mix(0x5a6a2a, p.dark, 0.35);
            inkShape(ctx, [{ x: 14, y: h - 2 }, { x: 12, y: 18 }, { x: w - 12, y: 18 }, { x: w - 14, y: h - 2 }], rnd, fill(drum), p.ink, 2.2, 0.3);
            for (const hy of [30, h - 20]) inkLine(ctx, [{ x: 12, y: hy }, { x: w - 12, y: hy }], rnd, p.ink, 2.4, 0.3);
            // simbolo di pericolo
            ctx.fillStyle = fill(0xfacc15, 0.9);
            ctx.beginPath(); ctx.moveTo(w / 2, 36); ctx.lineTo(w / 2 + 10, 54); ctx.lineTo(w / 2 - 10, 54); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = p.ink; ctx.lineWidth = 1.4; ctx.stroke();
            ctx.fillStyle = p.ink; ctx.fillRect(w / 2 - 1, 42, 2, 7);
            // colata
            glowSpot(ctx, w / 2, 16, 22, 0xa3e635, 0.35);
            inkShape(ctx, [{ x: 16, y: 18 }, { x: w - 16, y: 18 }, { x: w - 22, y: 26 }, { x: w - 26, y: 40 }, { x: w - 30, y: 26 }, { x: 22, y: 24 }], rnd, fill(0x9be33a, 0.9), p.ink, 1.4, 0.3);
            shadeSide(ctx, [{ x: w * 0.6, y: 30 }, { x: w - 14, y: 30 }, { x: w - 14, y: h - 4 }, { x: w * 0.6, y: h - 4 }], rnd, p, 0.5);
            return { light: { x: 0, y: -(h - 18), color: 0xa3e635, radius: 130 } };
        },
    },
    chair: {
        w: 60, h: 80,
        paint(ctx, w, h, p, rnd) {
            const wood = mix(0x6e5134, p.dark, 0.35);
            ctx.save();
            ctx.translate(w / 2, h);
            ctx.rotate((rnd() - 0.5) * 0.3);
            inkShape(ctx, rect(-18, -40, 36, 6), rnd, fill(wood), p.ink, 1.8, 0.3);
            inkShape(ctx, rect(-17, -34, 4, 34), rnd, fill(wood), p.ink, 1.5, 0.3);
            inkShape(ctx, rect(13, -34, 4, 34 - (rnd() > 0.5 ? 10 : 0)), rnd, fill(wood), p.ink, 1.5, 0.3);
            inkShape(ctx, rect(13, -78, 4, 40), rnd, fill(wood), p.ink, 1.5, 0.3);
            inkShape(ctx, rect(-17, -78, 4, 40), rnd, fill(wood), p.ink, 1.5, 0.3);
            inkShape(ctx, rect(-17, -76, 34, 5), rnd, fill(wood), p.ink, 1.5, 0.3);
            inkShape(ctx, rect(-17, -62, 34, 4), rnd, fill(wood), p.ink, 1.3, 0.3);
            ctx.restore();
        },
    },
    statue: {
        w: 110, h: 230,
        paint(ctx, w, h, p, rnd) {
            // il geco incappucciato: figura votiva del realm
            const cx = w / 2;
            const stone = p.body;
            inkShape(ctx, rect(cx - 40, h - 26, 80, 24), rnd, fill(shade(stone, -0.1)), p.ink, 2.2, 0.5);
            const cloak: Pt[] = [{ x: cx - 34, y: h - 26 }, { x: cx - 26, y: 90 }, { x: cx - 18, y: 56 }, { x: cx, y: 34 }, { x: cx + 18, y: 56 }, { x: cx + 26, y: 90 }, { x: cx + 34, y: h - 26 }];
            inkShape(ctx, cloak, rnd, fill(stone), p.ink, 2.4, 0.8);
            shadeSide(ctx, [{ x: cx + 4, y: 40 }, { x: cx + 26, y: 90 }, { x: cx + 34, y: h - 26 }, { x: cx + 6, y: h - 26 }], rnd, p, 0.7);
            for (const fx of [-16, -4, 10]) inkLine(ctx, [{ x: cx + fx, y: 100 }, { x: cx + fx * 1.3, y: h - 30 }], rnd, fill(p.b.ink, 0.8), 1.4, 0.8);
            // muso del geco che spunta dal cappuccio, occhi vuoti
            const head: Pt[] = [{ x: cx - 16, y: 62 }, { x: cx - 12, y: 40 }, { x: cx + 4, y: 30 }, { x: cx + 26, y: 42 }, { x: cx + 18, y: 60 }];
            inkShape(ctx, head, rnd, fill(shade(stone, 0.12)), p.ink, 2, 0.4);
            ctx.fillStyle = p.ink;
            ctx.beginPath(); ctx.ellipse(cx - 2, 46, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(cx + 13, 46, 4, 3.4, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = fill(p.accent, 0.6);
            ctx.beginPath(); ctx.arc(cx - 2, 46, 1.5, 0, Math.PI * 2); ctx.fill();
            // mani giunte con un microfono: il realm venera la wave
            inkShape(ctx, [{ x: cx - 10, y: 112 }, { x: cx + 10, y: 112 }, { x: cx + 8, y: 126 }, { x: cx - 8, y: 126 }], rnd, fill(shade(stone, 0.08)), p.ink, 1.6, 0.3);
            ctx.fillStyle = fill(p.dark);
            ctx.beginPath(); ctx.arc(cx, 104, 7, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = p.ink; ctx.lineWidth = 1.5; ctx.stroke();
            stipple(ctx, cx - 34, 30, 68, h - 56, rnd, fill(p.b.accent, 0.25), 40, 2);
            return { backdrop: true };
        },
    },
    speaker: {
        w: 80, h: 110,
        paint(ctx, w, h, p, rnd) {
            const box = mix(0x22222a, p.dark, 0.3);
            inkShape(ctx, rect(8, 6, w - 16, h - 8), rnd, fill(box), p.ink, 2.4, 0.4);
            const cone = (cy: number, r: number) => {
                ctx.fillStyle = fill(0x101014);
                ctx.beginPath(); ctx.arc(w / 2, cy, r, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = fill(shade(box, 0.25)); ctx.lineWidth = 2; ctx.stroke();
                ctx.strokeStyle = p.ink; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.arc(w / 2, cy, r * 0.55, 0, Math.PI * 2); ctx.stroke();
                ctx.fillStyle = fill(p.accent, 0.5);
                ctx.beginPath(); ctx.arc(w / 2, cy, r * 0.18, 0, Math.PI * 2); ctx.fill();
            };
            cone(32, 14);
            cone(h - 34, 24);
            ctx.fillStyle = fill(p.accent, 0.9);
            ctx.fillRect(w - 20, 12, 3, 3);
            shadeSide(ctx, rect(w * 0.62, 6, w * 0.38 - 8, h - 8), rnd, p, 0.4);
        },
    },
    tv: {
        w: 76, h: 70,
        paint(ctx, w, h, p, rnd) {
            const shell = mix(0x3a3a34, p.dark, 0.3);
            inkShape(ctx, rect(6, 10, w - 12, h - 14), rnd, fill(shell), p.ink, 2.4, 0.4);
            const sx = 13;
            const sy = 17;
            const sw = w - 38;
            const sh = h - 30;
            glowSpot(ctx, sx + sw / 2, sy + sh / 2, 36, p.accent, 0.35);
            ctx.fillStyle = fill(mix(p.accent, 0x101010, 0.55));
            ctx.beginPath(); ctx.roundRect(sx, sy, sw, sh, 6); ctx.fill();
            ctx.strokeStyle = p.ink; ctx.lineWidth = 1.8; ctx.stroke();
            // neve sullo schermo
            stipple(ctx, sx + 2, sy + 2, sw - 4, sh - 4, rnd, 'rgba(255,255,255,0.55)', 60, 1.2);
            for (let y = sy + 3; y < sy + sh; y += 3) {
                ctx.fillStyle = 'rgba(0,0,0,0.25)';
                ctx.fillRect(sx + 1, y, sw - 2, 1);
            }
            ctx.fillStyle = fill(shade(shell, 0.2));
            ctx.beginPath(); ctx.arc(w - 16, 26, 3.4, 0, Math.PI * 2); ctx.arc(w - 16, 38, 3.4, 0, Math.PI * 2); ctx.fill();
            inkLine(ctx, [{ x: w / 2 - 6, y: 10 }, { x: w / 2 - 16, y: 0 }], rnd, p.ink, 1.4, 0.2);
            inkLine(ctx, [{ x: w / 2 + 4, y: 10 }, { x: w / 2 + 16, y: 1 }], rnd, p.ink, 1.4, 0.2);
            return { light: { x: 0, y: -h / 2, color: p.accent, radius: 120 } };
        },
    },
    scaffold: {
        w: 120, h: 200,
        paint(ctx, w, h, p, rnd) {
            const metal = fill(mix(p.body, 0x8a8a7a, 0.2));
            ctx.strokeStyle = p.ink;
            const bar = (x1: number, y1: number, x2: number, y2: number, wd = 4) => {
                ctx.strokeStyle = p.ink;
                ctx.lineWidth = wd + 2;
                ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
                ctx.strokeStyle = metal;
                ctx.lineWidth = wd - 1;
                ctx.stroke();
            };
            for (const x of [12, w - 12]) bar(x, h, x, 10);
            for (let y = h - 4; y > 10; y -= 48) {
                bar(8, y, w - 8, y, 5);
                bar(14, y, w - 14, y - 46, 2.5);
            }
            inkShape(ctx, rect(4, 4, w - 8, 8), rnd, fill(mix(0x6e5134, p.dark, 0.3)), p.ink, 1.6, 0.3);
            return { backdrop: true };
        },
    },
    cocoon: {
        w: 60, h: 90,
        paint(ctx, w, h, p, rnd) {
            const pts: Pt[] = [];
            for (let k = 0; k <= 24; k++) {
                const a = (k / 24) * Math.PI * 2;
                const r = 1 + Math.sin(a * 3 + rnd()) * 0.05;
                pts.push({ x: w / 2 + Math.cos(a) * 20 * r, y: h / 2 + 8 + Math.sin(a) * 36 * r });
            }
            inkShape(ctx, pts, rnd, fill(mix(0xcfc6b0, p.dark, 0.45)), p.ink, 2, 0.5);
            ctx.strokeStyle = fill(p.b.ink, 0.6);
            ctx.lineWidth = 1;
            for (let k = 0; k < 8; k++) {
                ctx.beginPath();
                ctx.moveTo(w / 2 - 20, h / 2 - 20 + k * 8);
                ctx.quadraticCurveTo(w / 2, h / 2 - 14 + k * 8 + (rnd() - 0.5) * 6, w / 2 + 20, h / 2 - 22 + k * 8);
                ctx.stroke();
            }
            glowSpot(ctx, w / 2, h / 2 + 8, 14, p.accent, 0.3);
            inkLine(ctx, [{ x: w / 2, y: 12 }, { x: w / 2 + 2, y: 0 }], rnd, fill(0xd0d0d8, 0.4), 1, 0.3);
        },
    },
};

const cache = new Map<string, PropArt>();

/** disegna (o recupera) la variante `variant` del prop per il bioma */
export function propArt(b: BiomeDef, kind: PropKind, variant: number): PropArt {
    const key = `${b.id}:${kind}:${variant}`;
    const hit = cache.get(key);
    if (hit) return hit;
    const spec = SPECS[kind];
    const { el, ctx } = canvas(spec.w, spec.h);
    const pal: Pal = {
        body: mix(b.rock, b.deep, 0.2),
        dark: mix(b.rock, b.deep, 0.65),
        light: b.rim,
        ink: hex(b.ink),
        accent: b.accent,
        b,
    };
    const extra = spec.paint(ctx, spec.w, spec.h, pal, mulberry32(variant * 977 + kind.length * 31 + b.id.length)) ?? {};
    const art: PropArt = { id: `prop-${b.id}-${kind}-${variant}`, canvas: el, ...extra };
    cache.set(key, art);
    return art;
}
