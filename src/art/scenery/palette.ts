import type { BiomeDef } from '../../content/biomes';
import { hex, mix, shade } from '../ink';

/* i colori dei piani si leggono dal dipinto del capitolo: buio, mezzatinta,
   foschia e luce sono i suoi, così le sagome sembrano dipinte dalla stessa mano */

export interface ScenePalette {
    dark: number;
    mid: number;
    haze: number;
    /** il buio in fondo al dipinto: i piedi dei piani affondano lì */
    floor: number;
    glow: number;
    accent: number;
    /** da che lato arriva la luce nel dipinto */
    dir: 1 | -1;
}

export interface Tone {
    depth: number;
    body: number;
    shadow: number;
    light: number;
    ink: string | null;
    inkW: number;
    rim: string | null;
    recess: string;
    haze: number;
    glow: number;
    glowA: number;
    accent: number;
    dir: 1 | -1;
    /** tremolio della mano: da lontano i contorni si ammorbidiscono */
    wob: number;
}

const lum = (r: number, g: number, b: number): number => 0.299 * r + 0.587 * g + 0.114 * b;

function mean(px: number[][]): number {
    if (!px.length) return 0;
    let r = 0, g = 0, b = 0;
    for (const p of px) {
        r += p[0];
        g += p[1];
        b += p[2];
    }
    const n = px.length;
    return (Math.round(r / n) << 16) | (Math.round(g / n) << 8) | Math.round(b / n);
}

const mul = (c: number, t: number): number =>
    (Math.round((((c >> 16) & 255) * ((t >> 16) & 255)) / 255) << 16) |
    (Math.round((((c >> 8) & 255) * ((t >> 8) & 255)) / 255) << 8) |
    Math.round(((c & 255) * (t & 255)) / 255);

/** la palette del bioma da sola: quando il dipinto manca o non si può leggere */
export function biomePalette(b: BiomeDef): ScenePalette {
    return { dark: mix(b.deep, b.rock, 0.12), mid: mix(b.deep, b.haze, 0.6), haze: b.haze, floor: mix(b.deep, b.haze, 0.5), glow: b.rim, accent: b.accent, dir: 1 };
}

/** tint: la stessa tinta moltiplicata che phaser mette sul dipinto */
export function samplePalette(img: CanvasImageSource | null, b: BiomeDef, tint = 0xffffff): ScenePalette {
    const fallback = biomePalette(b);
    if (!img) return fallback;
    const W = 64;
    const H = 32;
    const el = document.createElement('canvas');
    el.width = W;
    el.height = H;
    const ctx = el.getContext('2d', { willReadFrequently: true });
    if (!ctx) return fallback;
    let data: Uint8ClampedArray;
    try {
        ctx.drawImage(img, 0, 0, W, H);
        data = ctx.getImageData(0, 0, W, H).data;
    } catch {
        return fallback;
    }
    const all: number[][] = [];
    const band: number[][] = [];
    const low: number[][] = [];
    let left = 0;
    let right = 0;
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const i = (y * W + x) * 4;
            const p = [data[i], data[i + 1], data[i + 2], lum(data[i], data[i + 1], data[i + 2])];
            all.push(p);
            // la fascia dell'orizzonte: è lì che i piani affondano
            if (y > H * 0.38 && y < H * 0.72) band.push(p);
            if (y >= H * 0.78) low.push(p);
            if (y < H * 0.7) {
                if (x < W / 2) left += p[3];
                else right += p[3];
            }
        }
    }
    all.sort((a, c) => a[3] - c[3]);
    band.sort((a, c) => a[3] - c[3]);
    const dark = mean(all.slice(0, Math.floor(all.length * 0.18)));
    const mid = mean(all.slice(Math.floor(all.length * 0.3), Math.floor(all.length * 0.7)));
    const haze = mean(band.slice(Math.floor(band.length * 0.45), Math.floor(band.length * 0.9)));
    const glow = mean(all.slice(Math.floor(all.length * 0.96)));
    return {
        dark: mul(mix(dark, b.deep, 0.25), tint),
        mid: mul(mid, tint),
        // il velo del bioma sta sopra il dipinto: la foschia letta ne prende un po'
        haze: mix(mul(haze, tint), b.haze, 0.22),
        floor: mix(mul(mean(low), tint), b.haze, 0.3),
        glow: mul(glow, tint),
        accent: b.accent,
        dir: right >= left ? 1 : -1,
    };
}

/** il tono di un piano: 0 lontano, 2 vicino e quasi nero. air dice quanto il lontano si scioglie nella foschia */
export function toneFor(p: ScenePalette, depth: number, air = 0.5): Tone {
    const base = mix(p.dark, p.mid, [0.42, 0.26, 0.1][depth]);
    const body = mix(base, mix(p.haze, p.floor, 0.25), air * [0.78, 0.4, 0.1][depth]);
    return {
        depth,
        body,
        shadow: mix(body, shade(p.dark, -0.3), [0.4, 0.5, 0.6][depth]),
        light: mix(body, p.glow, [0.18, 0.2, 0.16][depth]),
        ink: depth === 0 ? hex(shade(p.dark, -0.3), 0.4) : hex(shade(p.dark, -0.6), depth === 1 ? 0.7 : 0.95),
        inkW: [1, 1.5, 2.1][depth],
        rim: hex(mix(p.glow, p.haze, 0.3), [0.22, 0.3, 0.34][depth]),
        recess: hex(shade(p.dark, -0.45), [0.5, 0.7, 0.85][depth]),
        haze: mix(p.haze, p.floor, 0.55),
        glow: mix(p.glow, p.accent, 0.25),
        glowA: [0.6, 0.78, 0.9][depth],
        accent: p.accent,
        dir: p.dir,
        wob: [0.5, 0.9, 1.3][depth],
    };
}
