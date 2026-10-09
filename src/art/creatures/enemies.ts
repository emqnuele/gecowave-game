import type { Pt } from '../ink';
import { INK, type CreatureSpec, type Painter } from '../creatureKit';

/* i nemici guardano tutti a sinistra: il codice li gira con flipX quando
   il bersaglio è a destra. t va da 0 a 1 lungo il ciclo di fotogrammi */

const TAU = Math.PI * 2;
const sin = (t: number, k = 1, ph = 0) => Math.sin((t * k + ph) * TAU);
const cos = (t: number, k = 1, ph = 0) => Math.cos((t * k + ph) * TAU);

/** ruota con raggi che girano col fotogramma */
export function wheel(p: Painter, x: number, y: number, r: number, t: number, rim = 0x6b7280): void {
    p.shape(p.ellipse(x, y, r, r), 0x15161b, { hatch: 0, shadow: 0.3, smooth: 0 });
    p.shape(p.ellipse(x, y, r * 0.55, r * 0.55), rim, { hatch: 0, shadow: 0.4, smooth: 0, line: 0.7 });
    for (let k = 0; k < 3; k++) {
        const a = t * TAU * -0.66 + (k / 3) * TAU;
        p.line([{ x, y }, { x: x + Math.cos(a) * r * 0.5, y: y + Math.sin(a) * r * 0.5 }], 0.8, 0x1f2937);
    }
}

/** gambetta da geco con passo alternato */
function legs(p: Painter, x: number, top: number, ground: number, t: number, color: number, gap = 6, w = 3.2): void {
    for (const [dx, ph] of [[gap / 2, 0], [-gap / 2, 0.5]] as const) {
        const step = sin(t, 1, ph) * 2.6;
        const lift = Math.max(0, cos(t, 1, ph)) * 1.6;
        p.limb([{ x: x + dx, y: top }, { x: x + dx + step * 0.4, y: (top + ground) / 2 }, { x: x + dx + step, y: ground - lift }], w, w * 0.8, color, { hatch: 0.2 });
        p.shape(p.ellipse(x + dx + step - 1.2, ground - lift, w * 0.75, 1.2), color, { hatch: 0, shadow: 0.3 });
    }
}

/** coda da geco che oscilla */
function tail(p: Painter, x: number, y: number, len: number, t: number, color: number, w = 4): void {
    const sw = sin(t) * 2;
    p.limb(p.curve({ x, y }, { x: x + len * 0.6, y: y + 3 + sw }, { x: x + len, y: y - 4 - sw }, 7), w, 1, color);
}

const glitchetto: CreatureSpec = {
    key: 'enemy-glitchetto', w: 26, h: 26,
    draw(p, t, f) {
        const hop = Math.abs(sin(t)) * 2;
        const y0 = 7 - hop;
        // zampette
        for (const x of [9, 16]) p.limb([{ x, y: y0 + 13 }, { x: x + (f % 2 ? 1 : -1), y: 24 }], 3, 2.4, 0x1b2a31);
        // faccia di fronte, poi sopra e fianco
        p.shape([{ x: 5, y: y0 + 4 }, { x: 18, y: y0 + 4 }, { x: 18, y: y0 + 17 }, { x: 5, y: y0 + 17 }], 0x2c4954, { smooth: 0, hatch: 0.5 });
        p.shape([{ x: 5, y: y0 + 4 }, { x: 9, y: y0 }, { x: 22, y: y0 }, { x: 18, y: y0 + 4 }], 0x55838f, { smooth: 0, hatch: 0, shadow: 0.2 });
        p.shape([{ x: 18, y: y0 + 4 }, { x: 22, y: y0 }, { x: 22, y: y0 + 12 }, { x: 18, y: y0 + 17 }], 0x1a2c33, { smooth: 0, hatch: 0.7 });
        // crepe e angolo mangiato dal glitch
        p.line([{ x: 7, y: y0 + 5 }, { x: 9, y: y0 + 8 }, { x: 8, y: y0 + 10 }], 0.7);
        p.line([{ x: 17, y: y0 + 12 }, { x: 15, y: y0 + 15 }], 0.7);
        p.lit(p.rect(5, y0 + 13, 3, 1.2), 0x22d3ee, 0.8);
        p.eye(11.5, y0 + 10, 3, 0x22d3ee, { angry: 0.35 });
        // schegge che orbitano
        for (let k = 0; k < 3; k++) {
            const a = t * TAU + (k / 3) * TAU;
            const x = 20 + Math.cos(a) * 3.5;
            const y = y0 - 1 + Math.sin(a) * 2.5;
            p.lit(p.rect(x, y, 1.8, 1.8), k === 1 ? 0xf87171 : 0x22d3ee, 0.9);
        }
        // strappo di scanline in un fotogramma su quattro
        if (f === 2) p.lit(p.rect(3, y0 + 7, 17, 1), 0x67e8f9, 0.55);
    },
};

const citelis: CreatureSpec = {
    key: 'enemy-citelis', w: 72, h: 40,
    draw(p, t) {
        const shake = sin(t, 2) * 0.5;
        const y = 4 + shake;
        // fumo dal tubo dietro
        for (let k = 0; k < 3; k++) {
            const u = (t + k / 3) % 1;
            p.flat(p.ellipse(68 + u * 3, y + 22 - u * 10, 1.5 + u * 2.5, 1.2 + u * 2), 0x6b7280, 0.5 * (1 - u));
        }
        // scocca
        p.shape([{ x: 4, y: y + 8 }, { x: 10, y: y + 1 }, { x: 66, y: y + 1 }, { x: 68, y: y + 4 }, { x: 68, y: y + 27 }, { x: 3, y: y + 27 }, { x: 2, y: y + 16 }], 0x9a4b26, { smooth: 1, hatch: 0.45, rim: 0xe8a06a });
        p.shape([{ x: 10, y: y }, { x: 64, y: y }, { x: 64, y: y + 3 }, { x: 8, y: y + 3 }], 0x6b6f78, { smooth: 0, hatch: 0, shadow: 0.2, line: 0.8 });
        p.flat(p.rect(4, y + 21, 64, 2.4), 0xd6c27a, 0.8, 0);
        // finestrini accesi con le teste dei pendolari
        for (let i = 0; i < 4; i++) {
            const x = 22 + i * 11;
            p.lit(p.rect(x, y + 6, 8.5, 8), 0xfacc15, 0.75);
            p.flat(p.ellipse(x + 4 + (i % 2), y + 12, 2, 2.4), 0x1c1a14, 0.9, 0);
        }
        // parabrezza a due occhi furiosi
        p.lit([{ x: 5, y: y + 8 }, { x: 10, y: y + 4 }, { x: 18, y: y + 4 }, { x: 18, y: y + 14 }, { x: 4, y: y + 14 }], 0x2a3140, 0.9);
        p.eye(9, y + 9.5, 2.6, 0xfacc15, { angry: -0.45, socket: false });
        p.eye(15, y + 9.5, 2.3, 0xfacc15, { angry: -0.45, socket: false });
        // paraurti a denti
        p.teeth(3, y + 18, 13, 5, 5, 0xe7e2d0, 0.9);
        p.glow(3, y + 16, 2.2, 0xfde68a);
        p.lit(p.rect(30, y + 16, 22, 3.5), 0xfb923c, 0.85);
        wheel(p, 15, 32, 7, t);
        wheel(p, 55, 32, 7, t);
    },
};

const pendolare: CreatureSpec = {
    key: 'enemy-pendolare', w: 30, h: 44,
    draw(p, t) {
        const bob = Math.abs(sin(t)) * 1;
        legs(p, 15, 30, 43, t, 0x2b2f3a, 5, 3.4);
        tail(p, 19, 30 - bob, 9, t, 0x58654f, 3.5);
        // valigetta che dondola dietro
        const sw = sin(t) * 1.5;
        p.line([{ x: 20, y: 22 - bob }, { x: 22 + sw, y: 28 - bob }], 0.9);
        p.shape(p.rrect(19 + sw, 28 - bob, 9, 7, 1.5), 0x4a3426, { smooth: 0, hatch: 0.4 });
        // cappotto curvo
        p.shape([{ x: 9, y: 16 - bob }, { x: 18, y: 13 - bob }, { x: 22, y: 20 - bob }, { x: 21, y: 32 - bob }, { x: 9, y: 32 - bob }, { x: 7, y: 24 - bob }], 0x6b6253, { hatch: 0.55 });
        p.line([{ x: 13, y: 17 - bob }, { x: 13, y: 31 - bob }], 0.6, INK, 0.6);
        // braccio verso il telefono
        p.limb([{ x: 12, y: 18 - bob }, { x: 9, y: 23 - bob }, { x: 5, y: 21 - bob }], 3, 2.6, 0x5c5446);
        // testa china da geco
        p.shape(p.ellipse(9, 12 - bob, 6.5, 5.5, 0.3), 0x6a7a5c, { hatch: 0.4 });
        p.shape(p.ellipse(4, 14.5 - bob, 4, 2.6, 0.35), 0x6a7a5c, { hatch: 0.3 });
        // il telefono gli illumina la faccia
        p.lit(p.rrect(2, 18 - bob, 4, 6, 0.8), 0xfde68a, 0.95);
        p.glow(4, 18 - bob, 3, 0xfacc15, 0.35);
        p.eye(7, 12.5 - bob, 1.5, 0xfacc15, { lid: 0.7 });
        // badge che dondola
        p.line([{ x: 15, y: 15 - bob }, { x: 15 + sw * 0.5, y: 21 - bob }], 0.6, 0x9ca3af);
        p.lit(p.rect(13.5 + sw * 0.5, 21 - bob, 3.5, 4), 0xfacc15, 0.85);
    },
};

const pitturaBody = (p: Painter, t: number, cx: number, cy: number, rx: number, ry: number, drips: number[]) => {
    const wob = (k: number) => sin(t, 1, k * 0.13) * 0.9;
    const pts: Pt[] = [];
    for (let i = 0; i < 18; i++) {
        const a = (i / 18) * TAU;
        const r = 1 + 0.08 * Math.sin(a * 3 + t * TAU) + 0.05 * Math.sin(a * 5);
        pts.push({ x: cx + Math.cos(a) * rx * r, y: cy + Math.sin(a) * ry * r + (Math.sin(a) > 0.3 ? 0 : wob(i)) });
    }
    for (const [i, dx] of drips.entries()) {
        const len = 3 + ((t + i * 0.37) % 1) * 4;
        p.limb([{ x: cx + dx, y: cy + ry * 0.6 }, { x: cx + dx, y: cy + ry + len }], 3, 2.2, 0x5b2179, { hatch: 0 });
    }
    p.shape(pts, 0x6d2a93, {
        hatch: 0.45, rim: 0xe9b8ff,
        detail: (pp) => {
            pp.flat(pp.ellipse(cx - rx * 0.3, cy - ry * 0.2, rx * 0.35, ry * 0.25), 0xf472b6, 0.55);
            pp.flat(pp.ellipse(cx + rx * 0.35, cy + ry * 0.1, rx * 0.25, ry * 0.3), 0x60a5fa, 0.45);
            pp.flat(pp.ellipse(cx, cy + ry * 0.4, rx * 0.3, ry * 0.2), 0xfacc15, 0.35);
        },
    });
};

const pittura: CreatureSpec = {
    key: 'enemy-pittura', w: 38, h: 32,
    draw(p, t) {
        pitturaBody(p, t, 19, 18, 15, 10, [-8, 1, 9]);
        p.eye(11, 15, 2.6, 0xc084fc, { angry: -0.3 });
        p.eye(18, 14, 2.2, 0xc084fc, { angry: 0.3 });
        p.teeth(9, 20, 9, 4, 4, 0xf5e9ff, 0.7 + sin(t) * 0.25);
        // bolla che sale
        const u = t % 1;
        p.flat(p.ellipse(27, 12 - u * 6, 1.6, 1.6), 0xe9d5ff, 0.6 * (1 - u));
    },
};

const pitturaMini: CreatureSpec = {
    key: 'enemy-pittura-mini', w: 22, h: 18,
    draw(p, t) {
        pitturaBody(p, t, 11, 10, 8, 5.5, [-3, 3]);
        p.eye(8, 9, 2.1, 0xc084fc, { angry: 0.25 });
    },
};

const tecnodrone: CreatureSpec = {
    key: 'enemy-tecnodrone', w: 38, h: 28,
    draw(p, t, f) {
        const y = sin(t) * 1;
        // eliche: una macchia che cambia larghezza
        for (const x of [9, 29]) {
            p.line([{ x, y: 8 + y }, { x, y: 4 + y }], 1.2, 0x3f3f46);
            const w = f % 2 ? 7 : 3;
            p.flat(p.ellipse(x, 4 + y, w, 0.9), 0xd4d4d8, 0.55, 0);
        }
        p.shape([{ x: 6, y: 8 + y }, { x: 32, y: 8 + y }, { x: 32, y: 10 + y }, { x: 6, y: 10 + y }], 0x4b4453, { smooth: 0, hatch: 0, line: 0.8 });
        // corpo a capsula di giocattolo
        p.shape(p.rrect(6, 10 + y, 26, 13, 6), 0x5a3446, { smooth: 0, hatch: 0.5, rim: 0xf0a3b8 });
        // adesivo smile mezzo staccato
        p.flat(p.ellipse(22, 16 + y, 3.6, 3.6), 0xfacc15, 0.85, 0);
        p.line([{ x: 20.5, y: 16 + y }, { x: 22, y: 17.5 + y }, { x: 23.8, y: 16 + y }], 0.6);
        p.line([{ x: 21, y: 14.6 + y }, { x: 21, y: 14.8 + y }], 0.8);
        p.line([{ x: 23, y: 14.6 + y }, { x: 23, y: 14.8 + y }], 0.8);
        // occhio-camera rosso davanti
        p.shape(p.ellipse(11, 16.5 + y, 4.6, 4.6), 0x18181b, { hatch: 0, smooth: 0 });
        p.eye(11, 16.5 + y, 2.6, 0xf87171, { socket: false, pupil: true });
        // zampette pendenti con le pinze
        for (const x of [12, 26]) p.limb([{ x, y: 22 + y }, { x: x - 1 + sin(t, 1, x / 30), y: 26 + y }], 1.8, 1.2, 0x3f3f46, { hatch: 0 });
        // antenna col led
        p.line([{ x: 19, y: 8 + y }, { x: 21, y: 2 + y }], 0.8, 0x52525b);
        if (f % 2 === 0) p.glow(21, 2 + y, 1.2, 0xf87171, 0.9);
    },
};

function tossicoArt(p: Painter, t: number, big: boolean): void {
    const W = big ? 36 : 30;
    const H = big ? 50 : 46;
    const crouch = Math.max(0, sin(t)) * 2.4;
    const skin = big ? 0x4f7d2c : 0x6b7454;
    const cloth = big ? 0x2a2f2a : 0x3f3a4d;
    const cx = W / 2;
    // gambe storte
    for (const dx of [-4, 4]) p.limb([{ x: cx + dx, y: H - 17 + crouch }, { x: cx + dx * 1.5, y: H - 9 + crouch * 0.5 }, { x: cx + dx, y: H - 1 }], big ? 5 : 3.4, big ? 4 : 2.6, cloth, { hatch: 0.4 });
    // busto: secco e curvo, o gonfio da far paura
    const torso = big
        ? [{ x: cx - 13, y: 16 }, { x: cx + 13, y: 15 }, { x: cx + 10, y: 33 }, { x: cx + 6, y: H - 15 }, { x: cx - 6, y: H - 15 }, { x: cx - 10, y: 33 }]
        : [{ x: cx - 6, y: 17 }, { x: cx + 7, y: 16 }, { x: cx + 6, y: 28 }, { x: cx + 5, y: H - 16 }, { x: cx - 5, y: H - 16 }, { x: cx - 7, y: 28 }];
    p.shape(torso.map((q) => ({ x: q.x, y: q.y + crouch })), big ? skin : cloth, {
        hatch: 0.55,
        detail: (pp) => {
            if (big) {
                // canottiera e vene
                pp.flat([{ x: cx - 7, y: 20 + crouch }, { x: cx + 7, y: 20 + crouch }, { x: cx + 6, y: H - 15 + crouch }, { x: cx - 6, y: H - 15 + crouch }], 0x2d3330, 0.95);
                pp.line([{ x: cx - 11, y: 22 + crouch }, { x: cx - 9, y: 26 + crouch }, { x: cx - 10, y: 30 + crouch }], 0.6, 0x9be15d, 0.8);
                pp.line([{ x: cx + 10, y: 21 + crouch }, { x: cx + 8, y: 27 + crouch }], 0.6, 0x9be15d, 0.8);
            } else {
                // cappuccio e zip
                pp.line([{ x: cx, y: 18 + crouch }, { x: cx, y: H - 17 + crouch }], 0.6, 0x9ca3af, 0.6);
            }
        },
    });
    // braccia lunghe a penzoloni
    const swing = sin(t) * 2;
    const aw = big ? 6 : 3.2;
    p.limb([{ x: cx - (big ? 12 : 6), y: 19 + crouch }, { x: cx - (big ? 17 : 10), y: 28 + crouch }, { x: cx - (big ? 16 : 11) + swing, y: 36 + crouch }], aw, aw * 0.75, skin, { hatch: 0.4 });
    p.limb([{ x: cx + (big ? 12 : 6), y: 19 + crouch }, { x: cx + (big ? 17 : 10), y: 27 + crouch }, { x: cx + (big ? 15 : 11) - swing, y: 33 + crouch }], aw, aw * 0.75, skin, { hatch: 0.4 });
    // fiala o siringa che brilla
    if (big) p.lit(p.rrect(cx + 13 - swing, 30 + crouch, 3.5, 9, 1), 0x84cc16, 0.9);
    else p.lit(p.rrect(cx - 13 + swing, 33 + crouch, 3, 6, 1), 0xfb923c, 0.9);
    // testa: piccola sul collo taurino o cadente col cappuccio
    const hy = (big ? 11 : 11) + crouch;
    if (!big) p.shape(p.ellipse(cx - 1, hy + 1, 8.5, 7.5), cloth, { hatch: 0.6 });
    p.shape(p.ellipse(cx - 1, hy + 1, big ? 6.5 : 5.5, big ? 6 : 5.5), skin, { hatch: 0.35 });
    p.shape(p.ellipse(cx - 6, hy + 3, 3.4, 2.2), skin, { hatch: 0.2 });
    const eye = big ? 0xef4444 : 0x84cc16;
    p.eye(cx - 4, hy, 1.5, eye, { angry: big ? -0.4 : 0, lid: big ? 0 : 0.55 });
    p.eye(cx + 1, hy, 1.4, eye, { angry: big ? 0.4 : 0, lid: big ? 0 : 0.55 });
    if (big) p.teeth(cx - 6, hy + 4, 6, 2.6, 3, 0xe7e5d0, 0.8);
}

const tossico: CreatureSpec = { key: 'enemy-tossico', w: 30, h: 46, draw: (p, t) => tossicoArt(p, t, false) };
const tossicoTrenbo: CreatureSpec = { key: 'enemy-tossico-trenbo', w: 36, h: 50, draw: (p, t) => tossicoArt(p, t, true) };

const formica: CreatureSpec = {
    key: 'enemy-formica', w: 32, h: 18,
    draw(p, t) {
        const chit = 0x7a3a1c;
        // sei zampe che si alternano
        for (let i = 0; i < 3; i++) {
            const x = 11 + i * 4;
            const ph = i % 2 ? 0 : 0.5;
            const s = sin(t, 1, ph) * 2;
            p.line([{ x, y: 10 }, { x: x - 2 + s, y: 13 }, { x: x - 3 + s * 1.3, y: 17 - Math.max(0, cos(t, 1, ph)) }], 1.1, 0x2a1408);
            p.line([{ x: x + 1, y: 10 }, { x: x + 3 - s, y: 13 }, { x: x + 4 - s * 1.3, y: 17 - Math.max(0, -cos(t, 1, ph)) }], 1.1, 0x2a1408);
        }
        // addome, torace, testa (davanti a sinistra)
        p.shape(p.ellipse(25, 9, 6.5, 5, -0.2), chit, { hatch: 0.5, rim: 0xf0a070, detail: (pp) => {
            for (const dx of [-2, 1, 4]) pp.line([{ x: 25 + dx, y: 5 }, { x: 25 + dx - 1, y: 13 }], 0.5, INK, 0.5);
        } });
        p.shape(p.ellipse(15, 9.5, 4.5, 3.4), chit, { hatch: 0.4, rim: 0xf0a070 });
        p.shape(p.ellipse(7, 8 + sin(t, 2) * 0.3, 4.6, 4), chit, { hatch: 0.4, rim: 0xf0a070 });
        // mandibole che schioccano
        const m = 1 + sin(t, 2) * 0.8;
        p.line([{ x: 3.5, y: 9.5 }, { x: 1.5, y: 10.5 + m * 0.5 }], 1.2, 0x2a1408);
        p.line([{ x: 4, y: 11 }, { x: 2, y: 12.5 - m * 0.3 }], 1.2, 0x2a1408);
        // antenne
        p.line(p.curve({ x: 6, y: 5 }, { x: 4, y: 0 + sin(t) }, { x: 1, y: 2 }, 5), 0.8, 0x2a1408);
        p.line(p.curve({ x: 8, y: 5 }, { x: 9, y: -0.5 }, { x: 5, y: 0.5 + cos(t) }, 5), 0.8, 0x2a1408);
        p.eye(5.5, 7.3, 1.5, 0xfb923c);
    },
};

const numero: CreatureSpec = {
    key: 'enemy-numero', w: 30, h: 34,
    draw(p, t) {
        const y = sin(t) * 1.4;
        // cifre in orbita: i resti dell'analisi 1
        ['7', 'π', '∂'].forEach((d, k) => {
            const a = t * TAU + (k / 3) * TAU;
            const x = 15 + Math.cos(a) * 12;
            const yy = 17 + y + Math.sin(a) * 13;
            for (const c of [p.ctx, p.glowCtx]) {
                c.font = 'bold 6px monospace';
                c.fillStyle = 'rgba(147,197,253,0.8)';
                c.fillText(d, x - 2, yy + 2);
            }
        });
        // la sigma col volume del gesso
        const sig: Pt[] = [{ x: 22, y: 8 + y }, { x: 8, y: 7 + y }, { x: 17, y: 17 + y }, { x: 8, y: 27 + y }, { x: 22, y: 26 + y }];
        p.limb(sig.slice(0, 3), 4.4, 4, 0x3a5d9c, { hatch: 0.3, rim: 0xbfdbfe });
        p.limb(sig.slice(2), 4, 4.4, 0x3a5d9c, { hatch: 0.3, rim: 0xbfdbfe });
        p.limb([{ x: 22, y: 8 + y }, { x: 23, y: 11 + y }], 3, 2, 0x3a5d9c, { hatch: 0 });
        p.limb([{ x: 22, y: 26 + y }, { x: 23, y: 23 + y }], 3, 2, 0x3a5d9c, { hatch: 0 });
        p.eye(12.5, 12 + y, 2.2, 0x60a5fa, { angry: 0.4 });
        p.eye(12.5, 22 + y, 1.6, 0x60a5fa, { angry: -0.3 });
    },
};

const specchietto: CreatureSpec = {
    key: 'enemy-specchietto', w: 28, h: 34,
    draw(p, t, f) {
        const y = sin(t) * 1.5;
        const tip = { x: 14 + sin(t) * 1, y: 2 + y };
        const shard: Pt[] = [tip, { x: 25, y: 23 + y }, { x: 16, y: 26 + y }, { x: 3, y: 22 + y }];
        p.shape(shard, 0x6f6390, {
            smooth: 0, hatch: 0.25, rim: 0xf5f3ff,
            detail: (pp) => {
                // il riflesso: un geco storto che non sei tu
                const g = pp.ctx.createLinearGradient(4, 4 + y, 24, 26 + y);
                g.addColorStop(0, 'rgba(233,213,255,0.7)');
                g.addColorStop(0.5, 'rgba(76,59,110,0.2)');
                g.addColorStop(1, 'rgba(196,181,253,0.55)');
                pp.ctx.fillStyle = g;
                pp.ctx.fillRect(0, 0, 28, 34);
                pp.flat(pp.ellipse(14, 15 + y, 3.6, 4.4, 0.4), 0x2a1f3d, 0.7);
                pp.flat(pp.ellipse(12, 20 + y, 2.6, 3.4, 0.4), 0x2a1f3d, 0.6);
            },
        });
        p.line([{ x: 9, y: 12 + y }, { x: 13, y: 17 + y }, { x: 11, y: 22 + y }], 0.6, 0xf5f3ff, 0.7);
        p.line([{ x: 18, y: 14 + y }, { x: 16, y: 19 + y }], 0.6, 0xf5f3ff, 0.6);
        p.eye(14.5, 14 + y, 1.6, 0xc084fc, { pupil: true, socket: false });
        // scintilla che corre sul bordo
        const k = f / 4;
        p.glow(tip.x + (25 - tip.x) * k, tip.y + (23 + y - tip.y) * k, 1.1, 0xf5f3ff, 0.9);
        p.glow(14, 29 + y, 1.5, 0xc084fc, 0.4);
    },
};

const padella: CreatureSpec = {
    key: 'enemy-padella', w: 40, h: 26,
    draw(p, t, f) {
        const hop = Math.abs(sin(t)) * 1.2;
        // zampette di cucchiaio
        for (const x of [9, 20]) p.limb([{ x, y: 18 - hop }, { x: x + (f % 2 ? 1 : -1), y: 25 }], 2.2, 1.6, 0x3a3532, { hatch: 0 });
        // manico dietro
        p.limb([{ x: 27, y: 13 - hop }, { x: 39, y: 8 - hop }], 3.4, 3, 0x2a1a12, { hatch: 0.3, rim: 0x8b5a3c });
        // padella vista di tre quarti
        p.shape(p.ellipse(15, 15 - hop, 13, 6), 0x2f2b29, { hatch: 0.55, rim: 0x8a8580 });
        p.shape(p.ellipse(15, 12.5 - hop, 11.5, 3.6), 0x1a1614, { hatch: 0, shadow: 0.2 });
        // olio che bolle
        p.lit(p.ellipse(15, 12.8 - hop, 10, 2.8, 0, 16), 0xf59e0b, 0.8);
        for (let k = 0; k < 3; k++) {
            const u = (t + k / 3) % 1;
            p.glow(8 + k * 7, 12 - hop - u * 4, 0.8 + u * 0.6, 0xfb923c, 0.8 * (1 - u));
        }
        p.eye(6.5, 16.5 - hop, 1.7, 0xf87171, { angry: -0.35 });
        p.eye(12, 17 - hop, 1.6, 0xf87171, { angry: 0.35 });
    },
};

const ammiratore: CreatureSpec = {
    key: 'enemy-ammiratore', w: 32, h: 46,
    draw(p, t) {
        const sw = sin(t) * 3;
        legs(p, 16, 32, 45, t, 0x2a3348, 6, 3.6);
        // braccia spalancate per l'abbraccio
        p.limb([{ x: 10, y: 21 }, { x: 4, y: 17 + sw * 0.5 }, { x: 1, y: 12 + sw }], 3.4, 2.8, 0x8a6a5a);
        p.limb([{ x: 22, y: 21 }, { x: 28, y: 17 - sw * 0.5 }, { x: 31, y: 12 - sw }], 3.4, 2.8, 0x8a6a5a);
        // maglietta del fan club col cuore
        p.shape([{ x: 9, y: 18 }, { x: 23, y: 18 }, { x: 24, y: 33 }, { x: 8, y: 33 }], 0xd9d2c5, {
            hatch: 0.5,
            detail: (pp) => {
                pp.ctx.font = 'bold 4px monospace';
                pp.ctx.fillStyle = '#7f1d1d';
                pp.ctx.fillText('L85', 12.5, 31);
            },
        });
        p.lit([{ x: 16, y: 27 }, { x: 13, y: 24 }, { x: 13.5, y: 22 }, { x: 16, y: 23 }, { x: 18.5, y: 22 }, { x: 19, y: 24 }], 0xef4444, 0.95, 1);
        // testa e sorriso troppo largo
        p.shape(p.ellipse(15, 11, 7.5, 7), 0x9a7a66, { hatch: 0.35 });
        p.shape(p.ellipse(9, 13, 3.6, 2.6), 0x9a7a66, { hatch: 0.2 });
        // cappellino da cuoco di carta, fatto in casa
        p.shape([{ x: 9, y: 6 }, { x: 21, y: 6 }, { x: 22, y: 1 }, { x: 18, y: -1 }, { x: 14, y: 0 }, { x: 10, y: 1 }], 0xe8e4da, { hatch: 0.3 });
        p.eye(12, 10, 1.6, 0xf87171, { pupil: true });
        p.eye(17, 10, 1.6, 0xf87171, { pupil: true });
        p.teeth(9, 14, 9, 3, 5, 0xf2eee6, 0.9);
    },
};

const notinoMini: CreatureSpec = {
    key: 'enemy-notino-mini', w: 34, h: 42,
    draw(p, t, f) {
        legs(p, 16, 30, 41, t, 0x1f2937, 6, 3.4);
        tail(p, 21, 31, 10, t, 0x3f6a46, 3.6);
        // felpa col cappuccio
        p.shape([{ x: 9, y: 19 }, { x: 22, y: 18 }, { x: 23, y: 32 }, { x: 9, y: 32 }], 0x3d2b5c, { hatch: 0.5, rim: 0xc4b5fd });
        p.line([{ x: 15, y: 21 }, { x: 15, y: 31 }], 0.5, 0xa78bfa, 0.6);
        // pistola giocattolo puntata avanti
        p.limb([{ x: 13, y: 22 }, { x: 8, y: 25 }, { x: 5, y: 24 }], 3, 2.6, 0x3f6a46);
        p.shape(p.rrect(0, 21.5, 9, 4.5, 1.2), 0x374151, { smooth: 0, hatch: 0.3, rim: 0xd1d5db });
        p.shape(p.rect(5, 25, 2.4, 3.2), 0x374151, { smooth: 0, hatch: 0 });
        if (f % 2 === 0) p.glow(0.5, 23.5, 1.5, 0xa855f7, 0.9);
        // testa da geco arrabbiato col ciuffo
        p.shape(p.ellipse(14, 11, 8, 7.5), 0x3f6a46, { hatch: 0.4 });
        p.shape(p.ellipse(7.5, 13, 3.8, 2.7), 0x3f6a46, { hatch: 0.2 });
        p.shape([{ x: 11, y: 5 }, { x: 15, y: 0 }, { x: 19, y: 4 }, { x: 22, y: 2 }, { x: 20, y: 7 }], 0x2a1f3d, { hatch: 0.3 });
        p.eye(10.5, 10.5, 1.8, 0xf87171, { angry: -0.5 });
        p.eye(16, 10.5, 1.7, 0xf87171, { angry: 0.5 });
    },
};

const eco: CreatureSpec = {
    key: 'enemy-eco', w: 30, h: 34,
    draw(p, t, f) {
        const ghost = (dx: number, color: number, alpha: number) => {
            for (const c of [p.glowCtx]) {
                c.save();
                c.globalAlpha = alpha;
                c.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
                c.beginPath();
                c.ellipse(15 + dx, 21, 8.5, 8, 0, 0, TAU);
                c.ellipse(13 + dx, 10, 7, 6.5, 0, 0, TAU);
                c.fill();
                c.restore();
            }
        };
        // aberrazione da vhs: rosso e ciano sfasati
        ghost(-1.5 - (f % 2), 0xef4444, 0.18);
        ghost(1.5 + (f % 2), 0x22d3ee, 0.22);
        legs(p, 15, 25, 33, t, 0x1e3a35, 5, 3);
        tail(p, 20, 26, 9, t, 0x1e3a35, 3.4);
        // mantello sfilacciato come quello del geco
        p.shape([{ x: 8, y: 14 }, { x: 22, y: 14 }, { x: 24, y: 28 }, { x: 19, y: 26 }, { x: 15, y: 29 }, { x: 11, y: 26 }, { x: 6, y: 28 }], 0x3d4a52, { hatch: 0.55, rim: 0x67e8f9 });
        p.shape(p.ellipse(13, 9, 7, 6.5), 0x1e3a35, { hatch: 0.4, rim: 0x67e8f9 });
        p.eye(10, 9, 1.7, 0x22d3ee);
        p.eye(15.5, 9, 1.7, 0x22d3ee);
        // linee di scansione che scorrono
        const ctx = p.ctx;
        ctx.fillStyle = 'rgba(34,211,238,0.22)';
        for (let y = (f * 1.5) % 4; y < 34; y += 4) ctx.fillRect(3, y, 24, 0.7);
        if (f === 1) p.lit(p.rect(4, 17, 21, 1.2), 0xa5f3fc, 0.5);
    },
};

const bottiglia: CreatureSpec = {
    key: 'enemy-bottiglia', w: 22, h: 36,
    draw(p, t) {
        const hop = Math.abs(sin(t)) * 1.5;
        for (const x of [8, 14]) p.limb([{ x, y: 32 - hop }, { x: x + sin(t) * 0.8, y: 35 }], 2, 1.6, 0x3b5a66, { hatch: 0 });
        // plastica azzurra con l'acqua che sciaborda
        const body = p.rrect(5, 10 - hop, 12, 23, 4);
        p.shape(body, 0x5b8fa3, {
            hatch: 0.2, shadow: 0.35, rim: 0xe0f7ff,
            detail: (pp) => {
                const lvl = 18 - hop + sin(t) * 1.2;
                const g = pp.ctx.createLinearGradient(0, lvl, 0, 33);
                g.addColorStop(0, 'rgba(103,232,249,0.85)');
                g.addColorStop(1, 'rgba(14,116,144,0.9)');
                pp.ctx.fillStyle = g;
                pp.ctx.beginPath();
                pp.ctx.moveTo(4, lvl + sin(t, 1, 0.2));
                pp.ctx.lineTo(18, lvl - sin(t, 1, 0.2));
                pp.ctx.lineTo(18, 34);
                pp.ctx.lineTo(4, 34);
                pp.ctx.fill();
                // costolature della bottiglia
                for (const y of [23, 27]) pp.line([{ x: 5, y: y - hop }, { x: 17, y: y - hop }], 0.5, 0xe0f7ff, 0.45);
            },
        });
        p.shape([{ x: 8, y: 4 - hop }, { x: 14, y: 4 - hop }, { x: 15, y: 10 - hop }, { x: 7, y: 10 - hop }], 0x5b8fa3, { hatch: 0, shadow: 0.3 });
        p.shape(p.rrect(7, 0.5 - hop, 8, 4, 1), 0x1e40af, { smooth: 0, hatch: 0 });
        // etichetta premium con gli occhi
        p.shape(p.rect(5, 13 - hop, 12, 6.5), 0xf1f5f9, { smooth: 0, hatch: 0.2, shadow: 0.3 });
        p.ctx.font = 'bold 2.6px monospace';
        p.ctx.fillStyle = '#0e7490';
        p.ctx.fillText('PREMIUM', 5.6, 18.7 - hop);
        p.eye(9, 15 - hop, 1.2, 0x22d3ee, { angry: -0.45 });
        p.eye(13, 15 - hop, 1.2, 0x22d3ee, { angry: 0.45 });
    },
};

const ricordo: CreatureSpec = {
    key: 'enemy-ricordo', w: 30, h: 32,
    draw(p, t) {
        const y = sin(t) * 1.6;
        const tilt = sin(t) * 0.05;
        const c = Math.cos(tilt);
        const s = Math.sin(tilt);
        const rot = (q: Pt): Pt => ({ x: 15 + (q.x - 15) * c - (q.y - 16) * s, y: 16 + y + (q.x - 15) * s + (q.y - 16) * c });
        // polaroid sbiadita con l'angolo strappato
        p.shape([{ x: 4, y: 4 }, { x: 20, y: 4 }, { x: 26, y: 10 }, { x: 26, y: 29 }, { x: 4, y: 29 }].map(rot), 0xd8cfb8, { smooth: 0, hatch: 0.3, shadow: 0.4 });
        p.shape([{ x: 7, y: 7 }, { x: 19, y: 7 }, { x: 23, y: 11 }, { x: 23, y: 23 }, { x: 7, y: 23 }].map(rot), 0x50626e, {
            smooth: 0, hatch: 0.2, shadow: 0.3, rim: 0x9fb6c4,
            detail: (pp) => {
                // pedro piccolo e felice, un giorno di sole
                pp.flat(pp.ellipse(15, 14 + y, 3.4, 3.4).map(rot), 0x1f2d38, 0.95);
                pp.flat(pp.rrect(11.5, 16.5, 7, 6, 2).map(rot), 0x1f2d38, 0.95);
                pp.flat(pp.ellipse(20, 9 + y, 2, 2), 0xfde68a, 0.5);
            },
        });
        p.eye(14, 13.6 + y, 0.9, 0x67e8f9, { socket: false });
        p.eye(16.4, 13.6 + y, 0.9, 0x67e8f9, { socket: false });
        // bordo bruciato che fuma
        p.glow(25, 9 + y, 1.6, 0xfb923c, 0.5);
        p.flat(p.ellipse(27, 5 + y - (t % 1) * 3, 1.5, 1.2), 0x94a3b8, 0.4);
    },
};

const telecamera: CreatureSpec = {
    key: 'enemy-telecamera', w: 36, h: 28,
    draw(p, t, f) {
        const pan = sin(t) * 0.8;
        // staffa a muro in alto a destra
        p.shape(p.rect(28, 0, 7, 4), 0x52575e, { smooth: 0, hatch: 0 });
        p.limb([{ x: 31, y: 3 }, { x: 28, y: 9 }, { x: 24, y: 11 }], 2.6, 2.4, 0x6b7177, { hatch: 0 });
        // corpo della telecamera
        p.shape([{ x: 6 + pan, y: 9 }, { x: 28, y: 8 }, { x: 29, y: 20 }, { x: 6 + pan, y: 21 }], 0xa7adb3, { smooth: 1, hatch: 0.45, rim: 0xf3f4f6 });
        p.shape([{ x: 5 + pan, y: 6.5 }, { x: 30, y: 6 }, { x: 31, y: 9 }, { x: 4 + pan, y: 9.5 }], 0x6b7177, { smooth: 0, hatch: 0 });
        p.flat(p.rect(14, 12, 10, 1.2), 0x52575e, 0.8, 0);
        p.flat(p.rect(14, 15, 10, 1.2), 0x52575e, 0.8, 0);
        // obiettivo che ti fissa
        p.shape(p.ellipse(7 + pan, 15, 5.4, 5.4), 0x1f2328, { smooth: 0, hatch: 0 });
        p.eye(6.6 + pan, 15, 3, 0x22d3ee, { socket: false, pupil: true });
        // rec che lampeggia
        if (f % 2 === 0) p.glow(25, 11, 1.1, 0xef4444, 1);
        else p.flat(p.ellipse(25, 11, 0.9, 0.9), 0x450a0a, 1, 0);
    },
};

const fiattipo: CreatureSpec = {
    key: 'enemy-fiattipo', w: 64, h: 34,
    draw(p, t) {
        const sh = sin(t, 2) * 0.4;
        // gas di scarico dietro
        for (let k = 0; k < 2; k++) {
            const u = (t + k / 2) % 1;
            p.flat(p.ellipse(61 + u * 2, 25 - u * 6, 1.5 + u * 2.4, 1.2 + u * 1.8), 0x6b7280, 0.5 * (1 - u));
        }
        // scocca bordeaux con lo spoiler di plastica
        p.shape([{ x: 2, y: 19 + sh }, { x: 8, y: 14 + sh }, { x: 18, y: 13 + sh }, { x: 24, y: 5 + sh }, { x: 46, y: 5 + sh }, { x: 54, y: 13 + sh }, { x: 62, y: 15 + sh }, { x: 62, y: 27 + sh }, { x: 2, y: 27 + sh }], 0x6d1f28, { smooth: 1, hatch: 0.45, rim: 0xe48a8a });
        p.shape(p.rect(48, 3 + sh, 14, 2.4), 0x18181b, { smooth: 0, hatch: 0 });
        // finestrini scuri
        p.lit([{ x: 21, y: 13 + sh }, { x: 26, y: 7 + sh }, { x: 34, y: 7 + sh }, { x: 34, y: 13 + sh }], 0x334155, 0.85);
        p.lit([{ x: 36, y: 7 + sh }, { x: 45, y: 7 + sh }, { x: 51, y: 13 + sh }, { x: 36, y: 13 + sh }], 0x334155, 0.85);
        // dadi di peluche appesi
        p.line([{ x: 30, y: 7 + sh }, { x: 30 + sin(t) * 1, y: 10 + sh }], 0.5, 0xe5e7eb);
        p.lit(p.rect(29 + sin(t) * 1, 10 + sh, 2, 2), 0xf8fafc, 0.8);
        p.line([{ x: 2, y: 22 + sh }, { x: 62, y: 22 + sh }], 0.6, INK, 0.6);
        // fari rossi davanti, cattivi
        p.eye(5, 18 + sh, 2.1, 0xdc2626, { angry: 0.5, socket: false });
        p.teeth(2, 23 + sh, 9, 3, 4, 0xd4d4d8, 0.9);
        p.glow(61, 19 + sh, 1.4, 0xf59e0b, 0.6);
        wheel(p, 15, 28, 6.5, t, 0x9ca3af);
        wheel(p, 49, 28, 6.5, t, 0x9ca3af);
    },
};

export const ENEMY_ART: CreatureSpec[] = [
    glitchetto, citelis, pendolare, pittura, pitturaMini, tecnodrone, tossico, tossicoTrenbo,
    formica, numero, specchietto, padella, ammiratore, notinoMini, eco, bottiglia, ricordo, telecamera, fiattipo,
];
