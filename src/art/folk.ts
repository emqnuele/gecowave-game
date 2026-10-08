import Phaser from 'phaser';
import type { FolkLook } from '../content/folk';
import { buildCreature, creatureRes, INK, type Painter } from './creatureKit';
import { mix } from './ink';
import { patchNormalFlip } from './normalFlip';

/* i passanti: gechi di profilo che guardano a destra (il codice li gira),
   disegnati come il resto del cast. si riconoscono dal profilo (cappelli,
   borse, bastoni) e dagli occhi accesi del colore della regione.
   quattro fotogrammi di camminata: chi sta fermo resta sul primo */

export const FOLK_W = 40;
export const FOLK_H = 52;
const PAD = 5;
/** origine verticale che mette i piedi sul pavimento, al netto del margine del foglio */
export const FOLK_ORIGIN_Y = (FOLK_H + PAD) / (FOLK_H + PAD * 2);

export function folkKey(look: FolkLook, eye: number): string {
    return `folk-${look}-${eye.toString(16)}`;
}

const TAU = Math.PI * 2;
const sin = (t: number, ph = 0) => Math.sin((t + ph) * TAU);

interface Body {
    skin: number;
    cloth: number;
    /** altezza relativa */
    h?: number;
    scale?: number;
    /** schiena curva in avanti */
    hunch?: number;
    /** pantaloni */
    legs?: number;
}

/** il geco che cammina verso destra: coda dietro, busto, testa col muso */
function walker(p: Painter, t: number, b: Body): { hx: number; hy: number; s: number; top: number; cx: number } {
    const s = b.scale ?? 1;
    const h = b.h ?? 1;
    const ground = FOLK_H - 1;
    const cx = FOLK_W / 2 - 1;
    const bob = Math.abs(sin(t)) * 1;
    const bodyH = 21 * s * h;
    const top = ground - 9 * s - bodyH - bob;
    const legs = b.legs ?? mix(b.cloth, 0x111827, 0.5);
    // coda che oscilla dietro
    p.limb(p.curve({ x: cx - 4 * s, y: top + bodyH * 0.75 }, { x: cx - 11 * s, y: ground - 3 + sin(t) }, { x: cx - 17 * s, y: ground - 2 - sin(t) * 1.5 }, 6), 4 * s, 1, b.skin, { hatch: 0.3 });
    // gambe in passo alternato
    for (const ph of [0.5, 0]) {
        const st = sin(t, ph) * 3.2 * s;
        const lift = Math.max(0, Math.cos((t + ph) * TAU)) * 1.8;
        p.limb([{ x: cx + 1, y: top + bodyH - 2 }, { x: cx + 1 + st * 0.5, y: ground - 5 * s }, { x: cx + 1 + st, y: ground - 1 - lift }], 3.4 * s, 3 * s, legs, { hatch: 0.3 });
        p.shape(p.ellipse(cx + 2.4 + st, ground - 0.8 - lift, 2.6 * s, 1.2 * s), 0x1c1917, { hatch: 0, shadow: 0.3 });
    }
    // busto a goccia, curvo se serve
    const hunch = b.hunch ?? 0;
    p.shape([
        { x: cx - 6 * s, y: top + 4 }, { x: cx + 5 * s + hunch, y: top + 2 }, { x: cx + 8 * s, y: top + bodyH * 0.6 },
        { x: cx + 6 * s, y: top + bodyH + 1 }, { x: cx - 6 * s, y: top + bodyH + 1 }, { x: cx - 8 * s, y: top + bodyH * 0.55 },
    ], b.cloth, { hatch: 0.5 });
    // braccio che dondola
    const sw = sin(t) * 2.4;
    p.limb([{ x: cx + 2, y: top + 5 }, { x: cx + 3 + sw * 0.4, y: top + bodyH * 0.55 }, { x: cx + 4 + sw, y: top + bodyH * 0.8 }], 2.6 * s, 2.2 * s, mix(b.cloth, 0x000000, 0.25), { hatch: 0.2 });
    p.shape(p.ellipse(cx + 4 + sw, top + bodyH * 0.8 + 1, 1.6 * s, 1.6 * s), b.skin, { hatch: 0, shadow: 0.3, line: 0.7 });
    // testa col muso in avanti
    const hx = cx + 3 * s + hunch * 1.4;
    const hy = top - 5 * s;
    p.shape(p.ellipse(hx, hy, 7.2 * s, 6.6 * s), b.skin, { hatch: 0.35 });
    p.shape(p.ellipse(hx + 6 * s, hy + 2 * s, 5 * s, 3.4 * s, 0.1), b.skin, { hatch: 0.25 });
    p.line([{ x: hx + 3 * s, y: hy + 3.4 * s }, { x: hx + 9.5 * s, y: hy + 3 * s }], 0.6, INK, 0.7);
    return { hx, hy, s, top, cx };
}

function drawFolk(p: Painter, look: FolkLook, eye: number, t: number): void {
    const e = (hx: number, hy: number, s: number, o: { lid?: number; angry?: number } = {}) => p.eye(hx + 2.4 * s, hy - 0.5, 1.6 * s, eye, o);
    switch (look) {
        case 'pendolare': {
            const w = walker(p, t, { skin: 0x6a7a5c, cloth: 0x5a5448 });
            // cappello e valigetta
            p.shape(p.rect(w.hx - 7, w.hy - 7, 14, 2.4), 0x1f2937, { smooth: 0, hatch: 0 });
            p.shape(p.rrect(w.hx - 4.5, w.hy - 13, 9, 6.5, 1.5), 0x1f2937, { smooth: 0, hatch: 0.2 });
            p.shape(p.rrect(w.cx + 5, FOLK_H - 19, 10, 8, 1.5), 0x4a3426, { smooth: 0, hatch: 0.3 });
            e(w.hx, w.hy, w.s, { lid: 0.5 });
            break;
        }
        case 'vecchio': {
            const w = walker(p, t, { skin: 0x7a8070, cloth: 0x5a4a3a, h: 0.92, hunch: 4 });
            p.limb([{ x: w.cx + 14, y: FOLK_H - 1 }, { x: w.cx + 12, y: FOLK_H - 26 }, { x: w.cx + 8, y: FOLK_H - 27 }], 2, 2, 0x6b4a2a, { hatch: 0 });
            p.shape(p.rect(w.hx - 5, w.hy - 4, 11, 2), 0xe5e7eb, { smooth: 0, hatch: 0 });
            e(w.hx, w.hy, w.s * 0.85, { lid: 0.4 });
            break;
        }
        case 'bimbo': {
            const w = walker(p, t, { skin: 0x5a8a50, cloth: 0xc2410c, h: 0.6, scale: 0.8 });
            p.shape([{ x: w.hx - 2, y: w.hy - 5 }, { x: w.hx + 2, y: w.hy - 12 }, { x: w.hx + 4, y: w.hy - 4 }], 0x2f4a2a, { smooth: 0, hatch: 0 });
            e(w.hx, w.hy, w.s * 1.15);
            break;
        }
        case 'operaio': {
            const w = walker(p, t, { skin: 0x7a6a50, cloth: 0x2f4a6b, scale: 1.08 });
            p.shape(p.ellipse(w.hx, w.hy - 4, 9, 4.6), 0xeab308, { hatch: 0.2, rim: 0xfef08a });
            p.shape(p.rect(w.hx - 10, w.hy - 3, 20, 1.8), 0xca8a04, { smooth: 0, hatch: 0 });
            p.glow(w.hx, w.hy - 7, 1.2, eye, 0.7);
            // gilet catarifrangente
            p.flat(p.rect(w.cx - 5, w.top + 9, 12, 1.6), 0xfacc15, 0.9, 0);
            e(w.hx, w.hy + 1, w.s);
            break;
        }
        case 'studente': {
            const w = walker(p, t, { skin: 0x6a7a6c, cloth: 0x3b4a6b, h: 0.95 });
            p.shape(p.rrect(w.cx - 14, FOLK_H - 33, 9, 14, 3), 0x7f1d1d, { smooth: 0, hatch: 0.3 });
            for (const dx of [0, 5]) p.shape(p.ellipse(w.hx + dx, w.hy - 0.5, 2.6, 2.4), 0x0f172a, { smooth: 0, hatch: 0, line: 0.8 });
            p.eye(w.hx + 2.4, w.hy - 0.5, 1.2, eye, { socket: false });
            break;
        }
        case 'cuoco': {
            const w = walker(p, t, { skin: 0xb39278, cloth: 0xe8e4da, scale: 1.05 });
            p.shape([{ x: w.hx - 6, y: w.hy - 5 }, { x: w.hx - 8, y: w.hy - 13 }, { x: w.hx - 3, y: w.hy - 17 }, { x: w.hx + 3, y: w.hy - 17 }, { x: w.hx + 8, y: w.hy - 13 }, { x: w.hx + 6, y: w.hy - 5 }], 0xf8f6f0, { hatch: 0.3 });
            e(w.hx, w.hy, w.s);
            break;
        }
        case 'nonna': {
            const w = walker(p, t, { skin: 0x7a8a6a, cloth: 0x6b4a5a, h: 0.85, scale: 1.05, hunch: 3 });
            p.shape([{ x: w.cx - 9, y: w.top + 4 }, { x: w.cx + 10, y: w.top + 4 }, { x: w.cx + 1, y: w.top + 16 }], 0x3b2f4a, { hatch: 0.3 });
            p.shape(p.ellipse(w.hx - 5, w.hy - 5, 3.6, 3.6), 0xd4d4d8, { hatch: 0.2 });
            e(w.hx, w.hy, w.s * 0.85, { lid: 0.3 });
            break;
        }
        case 'raver': {
            const w = walker(p, t, { skin: 0x5a7a6a, cloth: 0x1f1f2e, h: 1.08 });
            for (let i = 0; i < 4; i++) p.shape([{ x: w.hx - 6 + i * 4, y: w.hy - 5 }, { x: w.hx - 4 + i * 4, y: w.hy - 14 - (i % 2) * 3 }, { x: w.hx - 1 + i * 4, y: w.hy - 5 }], i % 2 ? 0xdb2777 : 0x7c3aed, { smooth: 0, hatch: 0 });
            const k = sin(t) * 2;
            p.lit(p.limbPts([{ x: w.cx + 11, y: FOLK_H - 30 + k }, { x: w.cx + 16, y: FOLK_H - 43 + k }], 2, 2), eye, 0.95);
            e(w.hx, w.hy, w.s * 1.2);
            break;
        }
        case 'pescatore': {
            const w = walker(p, t, { skin: 0x6a7a6c, cloth: 0x4a5a3a });
            p.shape(p.ellipse(w.hx, w.hy - 5, 11, 2.4), 0x6b5a3a, { hatch: 0 });
            p.shape(p.ellipse(w.hx, w.hy - 8, 5.5, 3.4), 0x6b5a3a, { hatch: 0.2 });
            p.line([{ x: w.cx + 6, y: FOLK_H - 24 }, { x: w.cx + 18, y: FOLK_H - 50 }], 1.2, 0x6b4a2a);
            p.line([{ x: w.cx + 18, y: FOLK_H - 50 }, { x: w.cx + 19 + sin(t), y: FOLK_H - 30 }], 0.5, 0xcbd5e1, 0.8);
            e(w.hx, w.hy, w.s, { lid: 0.3 });
            break;
        }
        case 'ombra': {
            // niente corpo pieno: una nebbia a forma di geco
            const cx = FOLK_W / 2;
            for (let i = 0; i < 6; i++) p.flat(p.ellipse(cx + Math.sin(i + t * TAU) * 2, FOLK_H - 16 - i * 4, 9 - i * 0.5, 7), 0x1f2433, 0.35, 0);
            p.shape(p.ellipse(cx + 2, FOLK_H - 38, 7, 6.5), 0x1f2433, { hatch: 0.4, rim: 0x64748b });
            p.eye(cx + 5, FOLK_H - 38.5, 1.5, eye);
            break;
        }
        case 'tecnico': {
            const w = walker(p, t, { skin: 0x6a7a6c, cloth: 0x374151 });
            p.line(p.curve({ x: w.hx - 7, y: w.hy }, { x: w.hx, y: w.hy - 13 }, { x: w.hx + 7, y: w.hy }, 6), 1.4, 0x52525b);
            p.shape(p.ellipse(w.hx - 6.5, w.hy, 2.6, 3), 0x27272a, { smooth: 0, hatch: 0 });
            p.line([{ x: w.hx - 6, y: w.hy + 2 }, { x: w.hx + 4, y: w.hy + 6 }], 0.8, 0x71717a);
            p.glow(w.hx + 4, w.hy + 6, 0.8, eye, 0.8);
            e(w.hx, w.hy, w.s);
            break;
        }
        case 'maranza': {
            const w = walker(p, t, { skin: 0x7a6a50, cloth: 0x111827, legs: 0x111827, scale: 1.04 });
            p.flat(p.rect(w.cx - 6, w.top + 4, 1.2, 18), 0xf8fafc, 0.85, 0);
            p.shape(p.ellipse(w.hx - 1, w.hy - 5, 8, 4), 0x0f172a, { hatch: 0.2 });
            p.shape(p.rect(w.hx - 13, w.hy - 5.5, 7, 2.4), 0x0f172a, { smooth: 0, hatch: 0 });
            p.line(p.curve({ x: w.cx - 3, y: w.top + 6 }, { x: w.cx + 1, y: w.top + 12 }, { x: w.cx + 5, y: w.top + 5 }, 6), 1, 0xfacc15);
            e(w.hx, w.hy, w.s, { lid: 0.5 });
            break;
        }
        case 'chierico': {
            const cx = FOLK_W / 2;
            const y = sin(t) * 0.6;
            p.shape([{ x: cx - 12, y: FOLK_H - 1 }, { x: cx + 12, y: FOLK_H - 1 }, { x: cx + 3, y: FOLK_H - 34 + y }, { x: cx - 3, y: FOLK_H - 34 + y }], 0x4a3f5a, { hatch: 0.55, rim: 0xc4b5fd });
            p.shape(p.ellipse(cx + 1, FOLK_H - 38 + y, 8.5, 8), 0x3b3150, { hatch: 0.4 });
            p.shape(p.ellipse(cx + 3, FOLK_H - 37 + y, 5, 5), 0x0f0a18, { hatch: 0, shadow: 0.2 });
            p.shape(p.rect(cx + 10, FOLK_H - 24 + y, 3, 8), 0xf1ede2, { smooth: 0, hatch: 0 });
            p.glow(cx + 11.5, FOLK_H - 27 + y + sin(t * 3) * 0.5, 1.6, 0xfde68a, 0.9);
            p.eye(cx + 4, FOLK_H - 37 + y, 1.3, eye, { socket: false });
            break;
        }
        case 'ubriaco': {
            const w = walker(p, t, { skin: 0x7a6a5a, cloth: 0x5a4a3a, hunch: -3 });
            p.shape(p.rrect(w.cx + 8, FOLK_H - 29, 4.6, 10, 1.4), 0x1f6b2a, { smooth: 0, hatch: 0.2, rim: 0xb8f7a0 });
            p.shape(p.rect(w.cx + 9, FOLK_H - 33, 2.6, 4), 0x1f6b2a, { smooth: 0, hatch: 0 });
            // guance rosse
            p.flat(p.ellipse(w.hx + 4, w.hy + 2.5, 2, 1.3), 0xef4444, 0.5);
            e(w.hx, w.hy + 1, w.s, { lid: 0.6 });
            break;
        }
    }
}

export function ensureFolkTexture(scene: Phaser.Scene, look: FolkLook, eye: number): string {
    const key = folkKey(look, eye);
    if (scene.textures.exists(key)) return key;
    patchNormalFlip();
    buildCreature(scene, { key, w: FOLK_W, h: FOLK_H, pad: PAD, draw: (p, t) => drawFolk(p, look, eye, t) });
    return key;
}

/** passante pronto: piedi sul pavimento, scala logica, nella pipeline delle luci */
export function folkImage(scene: Phaser.Scene, x: number, feet: number, look: FolkLook, eye: number): Phaser.GameObjects.Image {
    const key = ensureFolkTexture(scene, look, eye);
    const res = creatureRes(scene, key);
    return scene.add.image(x, feet, key, 0).setOrigin(0.5, FOLK_ORIGIN_Y).setScale(1 / res).setPipeline('Light2D');
}
