import type { Pt } from '../ink';
import { INK, type CreatureSpec, type Painter } from '../creatureKit';
import { wheel } from './enemies';
import { arm, aura, cos, frontLegs, gecoHead, label, scanlines, sin, TAU } from './bossKit';
import { BOSS_ART_VOID } from './bossesVoid';

/* i boss della trama principale. sono grandi e restano fermi in aria:
   ogni fotogramma respira, ruota, fuma o sfarfalla. quelli di profilo
   (faces) guardano a sinistra e il codice li gira verso il geco */

const guggu: CreatureSpec = {
    key: 'boss-guggu', w: 120, h: 78, faces: true,
    draw(p, t) {
        const y = sin(t, 2) * 0.8;
        // squarcio dimensionale dietro: il re dei bus arriva da un altro orario
        aura(p, 70, 38, 55, 0xfacc15, 0.18);
        for (let k = 0; k < 3; k++) {
            const u = (t + k / 3) % 1;
            p.flat(p.ellipse(117 + u * 3, 40 - u * 16 + y, 2 + u * 4, 1.6 + u * 3), 0x57534e, 0.55 * (1 - u));
        }
        // scocca arancio sporco dell'amaco
        const body: Pt[] = [{ x: 6, y: 30 + y }, { x: 12, y: 16 + y }, { x: 24, y: 13 + y }, { x: 114, y: 13 + y }, { x: 117, y: 18 + y }, { x: 117, y: 62 + y }, { x: 4, y: 62 + y }, { x: 3, y: 44 + y }];
        p.shape(body, 0xa4521f, {
            hatch: 0.5, rim: 0xf3b27a,
            detail: (pp) => {
                pp.flat(pp.rect(0, 50 + y, 120, 4), 0xe8d9a8, 0.85, 0);
                pp.flat(pp.rect(0, 55 + y, 120, 7), 0x4a2410, 0.5, 0);
                // crepe dimensionali che brillano sulla fiancata
                pp.lit([{ x: 70, y: 36 + y }, { x: 76, y: 42 + y }, { x: 73, y: 44 + y }, { x: 80, y: 49 + y }, { x: 72, y: 45 + y }, { x: 74, y: 43 + y }], 0xfde047, 0.9);
                pp.lit([{ x: 96, y: 34 + y }, { x: 100, y: 39 + y }, { x: 97, y: 40 + y }, { x: 101, y: 46 + y }, { x: 95, y: 41 + y }], 0xfde047, 0.8);
            },
        });
        p.shape(p.rect(22, 9 + y, 92, 5), 0x6b6f78, { smooth: 0, hatch: 0, shadow: 0.25 });
        // corona sul tetto
        p.shape([{ x: 48, y: 10 + y }, { x: 50, y: -1 + y }, { x: 56, y: 5 + y }, { x: 62, y: -4 + y }, { x: 68, y: 5 + y }, { x: 74, y: -1 + y }, { x: 76, y: 10 + y }], 0xd4a017, { smooth: 0, hatch: 0.3, rim: 0xfff1a8 });
        for (const x of [50, 62, 74]) p.glow(x, (x === 62 ? -3 : 0) + y, 1.6, 0xf87171, 0.9);
        // finestrini con i pendolari dentro, rassegnati
        for (let i = 0; i < 5; i++) {
            const x = 40 + i * 15;
            p.lit(p.rect(x, 18 + y, 11, 13), 0xfacc15, 0.7);
            p.flat(p.ellipse(x + 5.5 + (i % 2), 28 + y, 3, 3.6), 0x1c1a14, 0.9, 0);
        }
        // parabrezza a due occhi enormi, palpebre di gomma
        p.lit([{ x: 7, y: 30 + y }, { x: 13, y: 18 + y }, { x: 34, y: 17 + y }, { x: 34, y: 36 + y }, { x: 6, y: 36 + y }], 0x1f2633, 0.95);
        p.eye(15, 28 + y, 5, 0xfacc15, { angry: -0.55, socket: false, pupil: true });
        p.eye(28, 28 + y, 4.6, 0xfacc15, { angry: 0.55, socket: false, pupil: true });
        // griglia a fauci, aperta a scatti
        const open = 0.75 + sin(t) * 0.25;
        p.teeth(3, 42 + y, 26, 9, 7, 0xe7e2d0, open);
        p.glow(4, 40 + y, 3, 0xfde68a, 0.9);
        // cartello di linea
        p.lit(p.rect(16, 13 + y, 16, 4), 0x111827, 1);
        label(p, 'G∞', 19, 16.6 + y, 3.6, '#fde047', true);
        wheel(p, 26, 64, 12, t, 0x9ca3af);
        wheel(p, 94, 64, 12, t, 0x9ca3af);
    },
};

const breccio: CreatureSpec = {
    key: 'boss-breccio', w: 64, h: 76,
    draw(p, t) {
        const y = sin(t) * 1.2;
        aura(p, 32, 40, 34, 0xc084fc, 0.2);
        frontLegs(p, 31, 58 + y, 75, 10, 6, 0x2a2338, t, true);
        // camice da pittore pieno di schizzi
        p.shape([{ x: 18, y: 26 + y }, { x: 44, y: 26 + y }, { x: 50, y: 62 + y }, { x: 12, y: 62 + y }], 0xd8cfc0, {
            hatch: 0.55,
            detail: (pp) => {
                for (const [x, yy, c] of [[22, 40, 0xf87171], [36, 34, 0x4ade80], [30, 52, 0x60a5fa], [42, 48, 0xfacc15], [18, 55, 0xc084fc]] as const) pp.flat(pp.ellipse(x, yy + y, 2.6, 2), c, 0.85);
            },
        });
        // tavolozza come scudo, a sinistra
        p.shape(p.ellipse(11, 44 + y, 10, 13, -0.2), 0x8a5a33, {
            hatch: 0.35,
            detail: (pp) => {
                pp.flat(pp.ellipse(8, 38 + y, 2.4, 2.4), 0x07080c, 1);
                for (const [x, yy, c] of [[13, 39, 0xf87171], [15, 45, 0x4ade80], [11, 50, 0x60a5fa], [6, 47, 0xfacc15]] as const) pp.lit(pp.ellipse(x, yy + y, 2.2, 1.8), c, 0.9);
            },
        });
        // braccio col pennellone, che dipinge l'aria
        const sw = sin(t) * 3;
        arm(p, [{ x: 44, y: 30 + y }, { x: 52, y: 40 + y }, { x: 54 + sw * 0.3, y: 30 + y }], 5, 0x3b2f52);
        p.limb([{ x: 54 + sw * 0.3, y: 32 + y }, { x: 58 + sw, y: 8 + y }], 2.4, 2, 0x6b4a2a, { hatch: 0 });
        p.lit(p.ellipse(58.5 + sw, 6 + y, 3.4, 5.2, 0.15), 0xc084fc, 0.95, 0);
        // una goccia che cade dal pennello
        p.lit(p.ellipse(59 + sw, 12 + y + (t % 1) * 10, 1, 1.5), 0xc084fc, 0.9 * (1 - (t % 1)));
        // testa con basco
        gecoHead(p, 31, 17 + y, 11, 0x5b4a7a, { mouth: 'grin' });
        p.shape([{ x: 18, y: 10 + y }, { x: 26, y: 3 + y }, { x: 40, y: 3 + y }, { x: 46, y: 9 + y }, { x: 34, y: 11 + y }], 0x1f1a2b, { hatch: 0.3 });
        p.line([{ x: 32, y: 3 + y }, { x: 33, y: 0 + y }], 1.2);
        p.eyes(31, 15 + y, 9, 2.6, 0xc084fc, { angry: 0.25 });
    },
};

const notino: CreatureSpec = {
    key: 'boss-notino', w: 44, h: 54, pad: 10,
    draw(p, t, f) {
        const y = sin(t) * 1;
        frontLegs(p, 20, 41 + y, 53, 7, 4.4, 0x1f2937, t, true);
        // felpa col frammento che pulsa sul petto
        p.shape([{ x: 10, y: 26 + y }, { x: 30, y: 25 + y }, { x: 32, y: 43 + y }, { x: 8, y: 43 + y }], 0x3d2b5c, { hatch: 0.5, rim: 0xc4b5fd });
        p.lit(p.ellipse(19, 34 + y, 2.6 + (f % 2) * 0.6, 2.6 + (f % 2) * 0.6, 0, 6), 0xa855f7, 0.95);
        // cannone giocattolo più grande di lui, puntato a sinistra
        arm(p, [{ x: 14, y: 29 + y }, { x: 9, y: 34 + y }, { x: 6, y: 32 + y }], 4, 0x3f6a46);
        p.shape(p.rrect(-3, 27 + y, 18, 9, 2.5), 0x4b3a6b, { smooth: 0, hatch: 0.35, rim: 0xd8b4fe });
        p.shape(p.rect(-5, 28.5 + y, 4, 6), 0x2e2440, { smooth: 0, hatch: 0 });
        p.lit(p.rect(3, 29 + y, 8, 1.6), 0xfacc15, 0.8);
        p.glow(-5, 31.5 + y, 2.2 + (f % 2), 0xa855f7, 0.9);
        // testa col ciuffo e il cappellino all'indietro
        gecoHead(p, 20, 15 + y, 9.5, 0x3f6a46, { mouth: 'frown' });
        p.shape([{ x: 11, y: 9 + y }, { x: 18, y: 4 + y }, { x: 29, y: 7 + y }, { x: 33, y: 11 + y }, { x: 27, y: 10 + y }], 0x7f1d1d, { hatch: 0.25 });
        p.shape([{ x: 16, y: 6 + y }, { x: 18, y: -1 + y }, { x: 21, y: 4 + y }, { x: 24, y: 0 + y }, { x: 24, y: 6 + y }], 0x2a1f3d, { hatch: 0.2 });
        p.eyes(20, 14 + y, 8, 2.4, 0xc084fc, { angry: 0.5 });
    },
};

const riba: CreatureSpec = {
    key: 'boss-riba', w: 56, h: 58, faces: true,
    draw(p, t, f) {
        const bob = Math.abs(sin(t)) * 1.5;
        // zampe a molla da robot da guardia
        for (const [x, ph] of [[20, 0], [32, 0.5]] as const) {
            const k = sin(t, 1, ph) * 2;
            p.limb([{ x, y: 42 - bob }, { x: x + 3 + k, y: 49 }, { x: x + k, y: 56 }], 4, 3.4, 0x5a4a32, { hatch: 0.3 });
            p.shape(p.rect(x + k - 4, 55, 8, 3), 0x3a2e1e, { smooth: 0, hatch: 0 });
        }
        // corpo a botte con le placche
        p.shape(p.ellipse(28, 34 - bob, 17, 13), 0x9a6a2e, {
            hatch: 0.5, rim: 0xf5c87a,
            detail: (pp) => {
                for (const x of [20, 28, 36]) pp.line([{ x, y: 24 - bob }, { x: x - 1, y: 46 - bob }], 0.6, INK, 0.55);
                pp.flat(pp.rect(18, 36 - bob, 20, 4), 0x4a3214, 0.6, 0);
            },
        });
        // coda a cavo dietro
        p.limb(p.curve({ x: 44, y: 32 - bob }, { x: 54, y: 30 + sin(t) * 3 }, { x: 55, y: 20 }, 7), 2.4, 1.4, 0x3a2e1e, { hatch: 0 });
        p.glow(55, 20, 1.5, 0xfb923c, f % 2 ? 0.9 : 0.4);
        // testa enorme con visiera e becco, inclinata da confuso
        const tilt = sin(t) * 0.12;
        p.shape(p.ellipse(16, 16 - bob, 12, 11, tilt), 0xa87533, { hatch: 0.45, rim: 0xf5c87a });
        p.shape(p.ellipse(13, 15 - bob, 9, 5.5, tilt), 0x2a1d10, { hatch: 0, shadow: 0.2 });
        p.eye(12 + sin(t) * 2, 15 - bob, 3.6, 0xfb923c, { socket: false, pupil: true });
        p.shape([{ x: 6, y: 20 - bob }, { x: -2, y: 23 - bob }, { x: 6, y: 25 - bob }], 0xd9a441, { smooth: 0, hatch: 0 });
        // antenna col punto di domanda
        p.line([{ x: 20, y: 6 - bob }, { x: 23, y: -2 - bob }], 1, 0x3a2e1e);
        label(p, '?', 21.5, -2.5 - bob, 6, '#fb923c', true);
    },
};

const lochef: CreatureSpec = {
    key: 'boss-lochef', w: 64, h: 80, faces: true,
    draw(p, t) {
        const y = sin(t) * 1.2;
        frontLegs(p, 31, 64 + y, 79, 12, 6.5, 0x2a2a33, t, true);
        // pancione nel grembiule macchiato
        p.shape(p.ellipse(31, 50 + y, 19, 20), 0xe3ded2, { hatch: 0.5, rim: 0xffffff });
        p.shape([{ x: 19, y: 40 + y }, { x: 43, y: 40 + y }, { x: 45, y: 66 + y }, { x: 17, y: 66 + y }], 0xf4f1ea, {
            hatch: 0.45,
            detail: (pp) => {
                for (const [x, yy, r] of [[25, 48, 2.6], [37, 56, 3.2], [29, 61, 1.8], [40, 45, 1.6]] as const) pp.flat(pp.ellipse(x, yy + y, r, r * 0.8), 0x9b1c1c, 0.75);
                pp.line([{ x: 22, y: 51 + y }, { x: 40, y: 51 + y }], 0.6, INK, 0.4);
            },
        });
        // mattarello brandito sopra la testa
        const sw = sin(t) * 4;
        arm(p, [{ x: 45, y: 40 + y }, { x: 53, y: 34 + y }, { x: 54 + sw * 0.3, y: 22 + y }], 6, 0xc6a58a);
        p.limb([{ x: 44 + sw, y: 14 + y }, { x: 64 + sw * 0.6, y: 26 + y }], 5, 5, 0x8a5a33, { hatch: 0.3, rim: 0xe0b080 });
        arm(p, [{ x: 17, y: 42 + y }, { x: 10, y: 50 + y }, { x: 12, y: 58 + y }], 6, 0xc6a58a);
        // testa con il cappellone gonfio
        gecoHead(p, 30, 22 + y, 12, 0xb39278, { mouth: 'none' });
        p.shape([{ x: 17, y: 14 + y }, { x: 14, y: 4 + y }, { x: 20, y: -3 + y }, { x: 30, y: -1 + y }, { x: 40, y: -3 + y }, { x: 46, y: 4 + y }, { x: 43, y: 14 + y }], 0xf8f6f0, { hatch: 0.35 });
        p.shape(p.rect(18, 12 + y, 25, 4), 0xe5e1d6, { smooth: 0, hatch: 0.2 });
        // occhi a cuore. il problema è proprio quello.
        for (const x of [25, 36]) p.lit([{ x, y: 24 + y }, { x: x - 3.4, y: 20.5 + y }, { x: x - 2.4, y: 18.5 + y }, { x, y: 20 + y }, { x: x + 2.4, y: 18.5 + y }, { x: x + 3.4, y: 20.5 + y }], 0xf87171, 0.95, 1);
        p.teeth(21, 26 + y, 19, 5, 8, 0xfaf7ef, 0.85);
    },
};

const ombra: CreatureSpec = {
    key: 'boss-ombra', w: 48, h: 56,
    draw(p, t, f) {
        const y = sin(t) * 1.4;
        aura(p, 24, 30, 28, 0x22d3ee, 0.15);
        // doppio sfasato: la registrazione non combacia
        for (const [dx, c] of [[-2 - (f % 2), 0xef4444], [2 + (f % 2), 0x22d3ee]] as const) {
            const g = p.glowCtx;
            g.save();
            g.globalAlpha = 0.18;
            g.fillStyle = c === 0xef4444 ? '#ef4444' : '#22d3ee';
            g.beginPath();
            g.ellipse(24 + dx, 34 + y, 13, 14, 0, 0, TAU);
            g.ellipse(23 + dx, 15 + y, 10, 9, 0, 0, TAU);
            g.fill();
            g.restore();
        }
        frontLegs(p, 24, 44 + y, 55, 8, 5, 0x0f1a1c, t, true);
        p.limb(p.curve({ x: 32, y: 44 + y }, { x: 44, y: 50 + sin(t) * 3 }, { x: 47, y: 40 }, 8), 5, 1.4, 0x0f1a1c);
        // il mantello del geco, ma fatto di nastro
        p.shape([{ x: 12, y: 22 + y }, { x: 36, y: 22 + y }, { x: 40, y: 48 + y }, { x: 33, y: 45 + y }, { x: 28, y: 49 + y }, { x: 22, y: 45 + y }, { x: 16, y: 49 + y }, { x: 8, y: 47 + y }], 0x1c2a30, { hatch: 0.6, rim: 0x67e8f9 });
        gecoHead(p, 23, 14 + y, 10, 0x152226, { mouth: 'none', rim: 0x67e8f9 });
        p.eyes(23, 13 + y, 9, 2.6, 0x22d3ee, { angry: 0.3 });
        scanlines(p, 4, 2, 42, 52, 0x22d3ee, f, 0.22);
        // angoli del mirino rec
        for (const [x, yy, sx, sy] of [[2, 2, 1, 1], [46, 2, -1, 1], [2, 54, 1, -1], [46, 54, -1, -1]] as const) p.line([{ x, y: yy + sy * 5 }, { x, y: yy }, { x: x + sx * 5, y: yy }], 0.8, 0x67e8f9, 0.8);
        if (f % 2 === 0) p.glow(8, 6, 1.3, 0xef4444, 1);
    },
};

const ticummi: CreatureSpec = {
    key: 'boss-ticummi', w: 84, h: 72, faces: true,
    draw(p, t, f) {
        const y = sin(t) * 1.6;
        // fiamme blu dei propulsori
        for (const x of [24, 58]) {
            const l = 7 + (f % 2) * 3;
            p.lit([{ x: x - 4, y: 56 + y }, { x: x + 4, y: 56 + y }, { x, y: 56 + l + y }], 0x60a5fa, 0.85, 1);
            p.glow(x, 58 + y, 3, 0x93c5fd, 0.7);
        }
        // sedia volante high tech
        p.shape(p.rrect(10, 40 + y, 64, 16, 6), 0x2b3446, { smooth: 0, hatch: 0.45, rim: 0x93c5fd });
        p.shape(p.rrect(58, 8 + y, 14, 36, 5), 0x2b3446, { smooth: 0, hatch: 0.5, rim: 0x93c5fd });
        p.lit(p.rect(14, 46 + y, 40, 2), 0x60a5fa, 0.7);
        // lui, comodo, col camice
        p.shape(p.ellipse(42, 32 + y, 15, 13), 0xe6e8ec, { hatch: 0.5 });
        frontLegs(p, 34, 42 + y, 52 + y, 8, 4.4, 0x374151, t);
        arm(p, [{ x: 32, y: 28 + y }, { x: 24, y: 34 + y }, { x: 18, y: 32 + y }], 4.4, 0xe6e8ec, 0x7a8f6a);
        // laptop della tommasorveglianza
        p.shape([{ x: 8, y: 34 + y }, { x: 24, y: 34 + y }, { x: 22, y: 37 + y }, { x: 6, y: 37 + y }], 0x1f2937, { smooth: 0, hatch: 0 });
        p.lit([{ x: 7, y: 22 + y }, { x: 20, y: 22 + y }, { x: 22, y: 34 + y }, { x: 9, y: 34 + y }], 0x22d3ee, 0.8);
        p.line([{ x: 10, y: 30 + y }, { x: 13, y: 26 + y }, { x: 16, y: 28 + y }, { x: 19, y: 24 + y }], 0.6, 0xecfeff);
        gecoHead(p, 42, 13 + y, 9, 0x7a8f6a, { mouth: 'grin' });
        // capelli da scienziato
        p.shape([{ x: 33, y: 9 + y }, { x: 31, y: 2 + y }, { x: 37, y: 5 + y }, { x: 40, y: -1 + y }, { x: 44, y: 4 + y }, { x: 49, y: 0 + y }, { x: 50, y: 7 + y }, { x: 52, y: 10 + y }], 0xd1d5db, { hatch: 0.2 });
        // occhiali che riflettono i grafici
        for (const x of [38, 46]) {
            p.shape(p.ellipse(x, 12 + y, 3.4, 3), 0x111827, { smooth: 0, hatch: 0, line: 0.9 });
            p.lit(p.ellipse(x, 12 + y, 2.6, 2.2), 0x22d3ee, 0.75);
        }
        p.line([{ x: 41.4, y: 12 + y }, { x: 42.6, y: 12 + y }], 0.8);
        // monitor che gli orbitano attorno
        for (let k = 0; k < 3; k++) {
            const a = t * TAU + (k / 3) * TAU;
            const mx = 70 + Math.cos(a) * 8;
            const my = 22 + Math.sin(a) * 14 + y;
            p.shape(p.rect(mx - 6, my - 4, 12, 8), 0x111827, { smooth: 0, hatch: 0, line: 0.8 });
            p.lit(p.rect(mx - 5, my - 3, 10, 6), k === 1 ? 0xf87171 : 0x22d3ee, 0.7);
        }
    },
};

const furgone: CreatureSpec = {
    key: 'boss-furgone', w: 120, h: 70, faces: true,
    draw(p, t) {
        const y = sin(t, 2) * 0.6;
        for (let k = 0; k < 3; k++) {
            const u = (t + k / 3) % 1;
            p.flat(p.ellipse(118 + u * 3, 48 - u * 14 + y, 2 + u * 4, 1.6 + u * 3), 0x64748b, 0.5 * (1 - u));
        }
        // cassone bianco e muso a sinistra
        p.shape([{ x: 22, y: 6 + y }, { x: 114, y: 6 + y }, { x: 116, y: 10 + y }, { x: 116, y: 54 + y }, { x: 22, y: 54 + y }], 0xdfe6ea, {
            hatch: 0.5,
            detail: (pp) => {
                // pubblicità: l'onda e la goccia di smela
                pp.flat(pp.rect(30, 14, 78, 30).map((q) => ({ x: q.x, y: q.y + y })), 0x0e7490, 0.9, 0);
                pp.line(pp.curve({ x: 34, y: 34 + y }, { x: 52, y: 20 + y }, { x: 70, y: 34 + y }, 10), 2, 0x67e8f9);
                pp.line(pp.curve({ x: 70, y: 34 + y }, { x: 88, y: 46 + y }, { x: 104, y: 30 + y }, 10), 2, 0x67e8f9);
                pp.ctx.font = 'bold 7px monospace';
                pp.ctx.fillStyle = '#ecfeff';
                pp.ctx.fillText('ACQUA', 46, 26 + y);
                pp.ctx.fillText('SMELA', 66, 40 + y);
                pp.flat(pp.rect(22, 48 + y, 94, 3), 0x0e7490, 0.8, 0);
            },
        });
        p.shape([{ x: 4, y: 34 + y }, { x: 8, y: 22 + y }, { x: 22, y: 18 + y }, { x: 24, y: 54 + y }, { x: 3, y: 54 + y }], 0xd1d9de, { hatch: 0.45 });
        // parabrezza con smela al volante, felice
        p.lit([{ x: 7, y: 32 + y }, { x: 10, y: 24 + y }, { x: 21, y: 22 + y }, { x: 21, y: 33 + y }], 0x0f3b48, 0.95);
        p.flat(p.ellipse(15, 30 + y, 4.2, 4), 0x56604f, 1, 0);
        p.eye(13.6, 29 + y, 1.1, 0x22d3ee, { socket: false });
        p.eye(16.4, 29 + y, 1.1, 0x22d3ee, { socket: false });
        // faro e paraurti
        p.eye(5, 40 + y, 2.6, 0x67e8f9, { socket: false, angry: -0.4 });
        p.shape(p.rect(1, 47 + y, 23, 5), 0x52525b, { smooth: 0, hatch: 0 });
        // goccia d'acqua che sgocciola dal cassone
        p.lit(p.ellipse(96, 56 + y + (t % 1) * 6, 1.2, 1.8), 0x67e8f9, 0.9 * (1 - (t % 1)));
        wheel(p, 22, 57, 10.5, t, 0x9ca3af);
        wheel(p, 92, 57, 10.5, t, 0x9ca3af);
    },
};

const danjilo: CreatureSpec = {
    key: 'boss-danjilo', w: 70, h: 84,
    draw(p, t) {
        const y = sin(t) * 1.2;
        frontLegs(p, 29, 70 + y, 83, 14, 8, 0x1e293b, t, true);
        // torace da armadio in canottiera
        p.shape([{ x: 6, y: 30 + y }, { x: 52, y: 30 + y }, { x: 47, y: 56 + y }, { x: 42, y: 72 + y }, { x: 16, y: 72 + y }, { x: 11, y: 56 + y }], 0x8c6d58, {
            hatch: 0.5,
            detail: (pp) => {
                pp.flat([{ x: 15, y: 34 + y }, { x: 43, y: 34 + y }, { x: 41, y: 72 + y }, { x: 17, y: 72 + y }], 0xe8e8e8, 0.95);
                pp.line([{ x: 22, y: 34 + y }, { x: 20, y: 30 + y }], 1.6, 0xe8e8e8);
                pp.line([{ x: 36, y: 34 + y }, { x: 38, y: 30 + y }], 1.6, 0xe8e8e8);
                // catenina e pettorali
                pp.line(pp.curve({ x: 20, y: 31 + y }, { x: 29, y: 42 + y }, { x: 38, y: 31 + y }, 8), 0.8, 0xfacc15);
            },
        });
        arm(p, [{ x: 8, y: 34 + y }, { x: 2, y: 48 + y }, { x: 6, y: 60 + y }], 8, 0x8c6d58);
        // damigiana d'acqua di smela in spalla, come un'arma
        arm(p, [{ x: 50, y: 34 + y }, { x: 58, y: 42 + y }, { x: 56, y: 50 + y }], 8, 0x8c6d58);
        p.shape(p.rrect(48, 38 + y, 22, 28, 8), 0x7fb6c6, {
            hatch: 0.25, shadow: 0.35, rim: 0xe0f7ff,
            detail: (pp) => {
                const lvl = 46 + y + sin(t) * 1.5;
                pp.flat([{ x: 47, y: lvl }, { x: 71, y: lvl - sin(t) }, { x: 71, y: 67 + y }, { x: 47, y: 67 + y }], 0x0e7490, 0.65, 0);
            },
        });
        p.shape(p.rect(55, 32 + y, 8, 7), 0x1e3a8a, { smooth: 0, hatch: 0 });
        p.glow(59, 54 + y, 4, 0x22d3ee, 0.35);
        // testa piccola sul collo taurino, monociglio
        gecoHead(p, 29, 18 + y, 12, 0x8c6d58, { mouth: 'frown' });
        p.shape(p.rect(17, 11 + y, 24, 3), 0x1c1917, { smooth: 0, hatch: 0 });
        p.eyes(29, 16 + y, 10, 2.4, 0x22d3ee, { angry: 0.3 });
    },
};

const smela: CreatureSpec = {
    key: 'boss-smela', w: 48, h: 70, pad: 9,
    draw(p, t, f) {
        const y = sin(t) * 1.2;
        frontLegs(p, 24, 56 + y, 69, 8, 5, 0x1e293b, t, true);
        // giacca da venditore, cravatta azzurra
        p.shape([{ x: 12, y: 28 + y }, { x: 36, y: 28 + y }, { x: 37, y: 58 + y }, { x: 11, y: 58 + y }], 0x2f4a5a, {
            hatch: 0.5, rim: 0x9be7f5,
            detail: (pp) => {
                pp.flat([{ x: 20, y: 28 + y }, { x: 28, y: 28 + y }, { x: 24, y: 40 + y }], 0xf1f5f9, 1, 0);
                pp.flat([{ x: 23, y: 30 + y }, { x: 25, y: 30 + y }, { x: 26, y: 44 + y }, { x: 24, y: 46 + y }, { x: 22, y: 44 + y }], 0x22d3ee, 1, 0);
                pp.ctx.font = 'bold 3px monospace';
                pp.ctx.fillStyle = '#ecfeff';
                pp.ctx.fillText('SMELA®', 28.5, 36 + y);
            },
        });
        // braccio teso che ti porge la bottiglia, insistente
        const push = sin(t) * 2;
        arm(p, [{ x: 14, y: 31 + y }, { x: 6 - push * 0.5, y: 30 + y }, { x: 1 - push, y: 24 + y }], 4.6, 0x2f4a5a, 0x6f8a5e);
        p.shape(p.rrect(-4 - push, 10 + y, 8, 15, 2.6), 0x7fb6c6, { smooth: 0, hatch: 0.2, shadow: 0.3, rim: 0xe0f7ff });
        p.lit(p.rect(-3 - push, 16 + y, 6, 7), 0x22d3ee, 0.75);
        p.shape(p.rect(-2 - push, 7 + y, 4, 3), 0x1e40af, { smooth: 0, hatch: 0 });
        arm(p, [{ x: 34, y: 31 + y }, { x: 40, y: 42 + y }, { x: 38, y: 50 + y }], 4.6, 0x2f4a5a, 0x6f8a5e);
        // testa col sorriso da venditore e gli occhi a spirale
        gecoHead(p, 24, 16 + y, 11, 0x6f8a5e, { mouth: 'none' });
        p.shape(p.ellipse(24, 9 + y, 11, 4), 0x1c1917, { hatch: 0.2 });
        p.teeth(16, 20 + y, 16, 4, 8, 0xffffff, 0.75);
        for (const x of [19, 29]) {
            p.eye(x, 15 + y, 2.8, 0x22d3ee, { socket: true });
            const a0 = (f / 4) * TAU;
            p.line(Array.from({ length: 10 }, (_, k) => ({ x: x + Math.cos(a0 + k * 0.9) * k * 0.25, y: 15 + y + Math.sin(a0 + k * 0.9) * k * 0.25 })), 0.5, INK);
        }
    },
};

/** glifo di gesso luminoso: un tratto spesso con volume, e la sua luce */
function glyph(p: Painter, pts: Pt[], w: number, color = 0x3a5d9c, rim = 0xbfdbfe): void {
    p.limb(pts, w, w, color, { hatch: 0.3, rim });
}

const limite: CreatureSpec = {
    key: 'boss-limite', w: 90, h: 80, pad: 7,
    draw(p, t) {
        const y = sin(t) * 1.5;
        aura(p, 45, 40, 45, 0x60a5fa, 0.22);
        // l, i, m
        glyph(p, [{ x: 12, y: 18 + y }, { x: 12, y: 50 + y }], 5);
        glyph(p, [{ x: 23, y: 32 + y }, { x: 23, y: 50 + y }], 5);
        p.lit(p.ellipse(23, 25 + y, 2.6, 2.6), 0x93c5fd, 0.9);
        glyph(p, [{ x: 33, y: 50 + y }, { x: 33, y: 34 + y }, { x: 39, y: 31 + y }, { x: 43, y: 35 + y }, { x: 43, y: 50 + y }], 4.6);
        glyph(p, [{ x: 43, y: 35 + y }, { x: 49, y: 31 + y }, { x: 53, y: 35 + y }, { x: 53, y: 50 + y }], 4.6);
        // la freccia che tende, che si allunga e si accorcia
        const len = 8 + sin(t) * 4;
        glyph(p, [{ x: 16, y: 63 + y }, { x: 40 + len, y: 63 + y }], 3, 0xe5e7eb, 0xffffff);
        glyph(p, [{ x: 34 + len, y: 58 + y }, { x: 41 + len, y: 63 + y }, { x: 34 + len, y: 68 + y }], 3, 0xe5e7eb, 0xffffff);
        // infinito che gira
        const inf: Pt[] = Array.from({ length: 24 }, (_, k) => {
            const a = (k / 24) * TAU;
            const d = 1 + Math.sin(a) ** 2;
            return { x: 72 + (Math.cos(a) * 11) / d, y: 63 + y + (Math.sin(a) * Math.cos(a) * 11) / d };
        });
        p.limb([...inf, inf[0]], 3.6, 3.6, 0x3a5d9c, { hatch: 0, rim: 0xbfdbfe });
        p.glow(72 + Math.cos(t * TAU) * 9, 63 + y + Math.sin(t * TAU * 2) * 3, 1.6, 0xffffff, 0.9);
        // occhi da latitante, col cappello calato
        p.shape([{ x: 56, y: 14 + y }, { x: 84, y: 14 + y }, { x: 80, y: 9 + y }, { x: 74, y: 3 + y }, { x: 66, y: 3 + y }, { x: 60, y: 9 + y }], 0x1e293b, { hatch: 0.4 });
        p.shape(p.rect(52, 13 + y, 36, 3), 0x1e293b, { smooth: 0, hatch: 0 });
        p.eyes(70, 24 + y, 12, 3, 0xffffff, { angry: 0.45 });
    },
};

const teorema: CreatureSpec = {
    key: 'boss-teorema', w: 70, h: 84,
    draw(p, t) {
        const y = sin(t) * 1.6;
        aura(p, 35, 42, 40, 0x60a5fa, 0.22);
        // il segno di integrale, mai chiuso
        const s: Pt[] = [
            ...p.curve({ x: 52, y: 12 + y }, { x: 46, y: 2 + y }, { x: 38, y: 10 + y }, 8),
            ...p.curve({ x: 37, y: 18 + y }, { x: 34, y: 42 + y }, { x: 32, y: 66 + y }, 8).slice(1),
            ...p.curve({ x: 31, y: 72 + y }, { x: 24, y: 80 + y }, { x: 17, y: 72 + y }, 8).slice(1),
        ];
        p.limb(s, 4, 3, 0x3a5d9c, { hatch: 0.3, rim: 0xbfdbfe });
        p.limb(p.curve({ x: 37, y: 14 + y }, { x: 35, y: 40 + y }, { x: 31, y: 70 + y }, 10), 9, 5, 0x3a5d9c, { hatch: 0.35, rim: 0xbfdbfe });
        // estremi strappati che volano via
        const u = t % 1;
        glyph(p, [{ x: 54 + u * 6, y: 4 + y - u * 3 }, { x: 60 + u * 6, y: 1 + y - u * 3 }], 2, 0xe5e7eb, 0xffffff);
        glyph(p, [{ x: 8 - u * 5, y: 76 + y + u * 2 }, { x: 14 - u * 5, y: 79 + y + u * 2 }], 2, 0xe5e7eb, 0xffffff);
        // dx che non arriva mai
        label(p, 'd', 46, 58 + y, 12, '#93c5fd', true);
        glyph(p, [{ x: 55 + sin(t) * 2, y: 49 + y }, { x: 63 + sin(t) * 2, y: 59 + y }], 2.6);
        glyph(p, [{ x: 63 + sin(t) * 2, y: 49 + y }, { x: 55 + sin(t) * 2, y: 59 + y }], 2.6);
        // faccia ostile incastrata nel tratto
        p.eyes(34, 32 + y, 10, 3, 0xffffff, { angry: 0.4 });
        p.teeth(28, 39 + y, 11, 3.4, 5, 0xe0f2fe, 0.8);
    },
};

const pedrino: CreatureSpec = {
    key: 'boss-pedrino', w: 56, h: 72,
    draw(p, t, f) {
        const y = sin(t) * 1.5;
        aura(p, 28, 36, 30, 0x67e8f9, 0.15);
        // gambe a pistone, pulite
        for (const x of [21, 35]) {
            p.shape(p.rrect(x - 3, 58 + y, 6, 10, 2), 0x8aa2b0, { smooth: 0, hatch: 0.3 });
            p.shape(p.rrect(x - 4.5, 67 + y, 9, 4, 1.5), 0x5c7381, { smooth: 0, hatch: 0 });
        }
        // corpo integro, con il cuoricino di led disegnato da lametta
        p.shape(p.rrect(13, 24 + y, 30, 35, 7), 0xb7c8d2, {
            smooth: 0, hatch: 0.4, rim: 0xffffff,
            detail: (pp) => {
                pp.flat(pp.rrect(17, 30 + y, 22, 16, 3), 0x1f3440, 0.95, 0);
                pp.line([{ x: 15, y: 50 + y }, { x: 41, y: 50 + y }], 0.6, INK, 0.4);
            },
        });
        p.lit([{ x: 28, y: 43 + y }, { x: 23, y: 37.5 + y }, { x: 24.5, y: 34.5 + y }, { x: 28, y: 36.5 + y }, { x: 31.5, y: 34.5 + y }, { x: 33, y: 37.5 + y }], 0xf87171, f % 2 ? 0.95 : 0.7, 1);
        // braccia attaccate come si deve, che salutano
        const wave = sin(t) * 6;
        p.shape(p.rrect(4, 27 + y, 8, 20, 3), 0xa3b6c2, { smooth: 0, hatch: 0.4 });
        p.limb([{ x: 48, y: 29 + y }, { x: 52, y: 20 + y + wave * 0.2 }, { x: 54 + wave * 0.3, y: 12 + y }], 7, 6, 0xa3b6c2, { hatch: 0.3 });
        // testa quadrata con l'antenna dritta
        p.shape(p.rrect(15, 3 + y, 26, 20, 5), 0xc6d5de, { smooth: 0, hatch: 0.35, rim: 0xffffff });
        p.shape(p.rrect(18, 7 + y, 20, 12, 3), 0x14232c, { smooth: 0, hatch: 0, shadow: 0.2 });
        p.eyes(28, 13 + y, 9, 2.6, 0x67e8f9);
        p.line(p.curve({ x: 24, y: 17 + y }, { x: 28, y: 19 + y }, { x: 32, y: 17 + y }, 5), 0.7, 0x67e8f9);
        p.line([{ x: 28, y: 3 + y }, { x: 28, y: -3 + y }], 1.2, 0x5c7381);
        p.glow(28, -3.5 + y, 1.6, 0x67e8f9, 0.9);
    },
};

const formicona: CreatureSpec = {
    key: 'boss-formicona', w: 96, h: 56, faces: true,
    draw(p, t) {
        const chit = 0x8a3e1a;
        // sei zampe autorevoli
        for (let i = 0; i < 3; i++) {
            const x = 40 + i * 9;
            const ph = i % 2 ? 0 : 0.5;
            const s = sin(t, 1, ph) * 3;
            p.limb([{ x, y: 34 }, { x: x - 6 + s, y: 42 }, { x: x - 8 + s * 1.3, y: 55 - Math.max(0, cos(t, 1, ph)) * 2 }], 2.6, 1.8, 0x3a1a0a, { hatch: 0 });
            p.limb([{ x: x + 2, y: 34 }, { x: x + 8 - s, y: 42 }, { x: x + 10 - s * 1.3, y: 55 - Math.max(0, -cos(t, 1, ph)) * 2 }], 2.6, 1.8, 0x3a1a0a, { hatch: 0 });
        }
        // addome a righe, torace, testa a sinistra
        p.shape(p.ellipse(74, 30, 20, 15, -0.15), chit, {
            hatch: 0.5, rim: 0xf6a56f,
            detail: (pp) => {
                for (const dx of [-8, -1, 6, 13]) pp.line(pp.curve({ x: 74 + dx, y: 16 }, { x: 72 + dx, y: 30 }, { x: 74 + dx, y: 44 }, 5), 0.7, INK, 0.5);
            },
        });
        p.shape(p.ellipse(48, 30, 12, 10), chit, {
            hatch: 0.45, rim: 0xf6a56f,
            detail: (pp) => {
                // fascia tricolore da sindaco
                for (const [k, c] of [[0, 0x16a34a], [1, 0xf8fafc], [2, 0xdc2626]] as const) pp.flat([{ x: 50 + k * 3, y: 19 }, { x: 53 + k * 3, y: 19 }, { x: 45 + k * 3, y: 41 }, { x: 42 + k * 3, y: 41 }], c, 0.95, 0);
            },
        });
        p.lit(p.ellipse(46, 36, 2.6, 2.6), 0xfacc15, 0.9);
        const tilt = sin(t) * 0.06;
        p.shape(p.ellipse(22, 22, 14, 12.5, tilt), chit, { hatch: 0.45, rim: 0xf6a56f });
        // mandibole che hanno morso un dio
        const m = sin(t, 2) * 2;
        p.limb(p.curve({ x: 10, y: 26 }, { x: 2, y: 25 - m }, { x: 0, y: 32 }, 6), 3.4, 1.2, 0x3a1a0a, { hatch: 0 });
        p.limb(p.curve({ x: 12, y: 30 }, { x: 4, y: 34 + m }, { x: 4, y: 38 }, 6), 3.4, 1.2, 0x3a1a0a, { hatch: 0 });
        // antenne e fascia da sindaco sulla fronte
        p.line(p.curve({ x: 18, y: 11 }, { x: 14, y: 0 + sin(t) * 2 }, { x: 6, y: 2 }, 6), 1.4, 0x3a1a0a);
        p.line(p.curve({ x: 25, y: 10 }, { x: 28, y: -2 }, { x: 20, y: -1 + cos(t) * 2 }, 6), 1.4, 0x3a1a0a);
        p.eyes(20, 20, 10, 3, 0xfb923c, { angry: 0.45 });
    },
};

const pedro: CreatureSpec = {
    key: 'boss-pedro', w: 76, h: 96,
    draw(p, t, f) {
        const j = (k: number) => (f === k ? 2 : 0);
        aura(p, 38, 48, 46, 0xf87171, 0.15);
        aura(p, 30, 30, 30, 0x22d3ee, 0.15);
        // cavi che pendono dal torso
        for (const [x, ph] of [[28, 0], [44, 0.3], [36, 0.6]] as const) p.line(p.curve({ x, y: 74 }, { x: x + sin(t, 1, ph) * 4, y: 86 }, { x: x + 2, y: 95 }, 6), 1.4, 0x1f2937);
        // torso angolare spezzato
        p.shape([{ x: 20, y: 30 }, { x: 56, y: 26 }, { x: 60, y: 70 }, { x: 30, y: 77 }, { x: 16, y: 61 }], 0x6b7d88, {
            smooth: 0, hatch: 0.6, rim: 0xd8f3fb,
            detail: (pp) => {
                pp.flat([{ x: 46, y: 26 }, { x: 56, y: 26 }, { x: 60, y: 44 }, { x: 50, y: 40 }], 0x07080c, 0.95, 0);
                pp.flat(pp.rrect(25, 38, 22, 18, 3), 0x16222a, 0.9, 0);
            },
        });
        // crepe di corruzione che pulsano
        p.lit([{ x: 34, y: 40 }, { x: 41, y: 48 }, { x: 37, y: 50 }, { x: 42, y: 58 }, { x: 35, y: 51 }, { x: 38, y: 49 }], 0xf87171, f % 2 ? 0.95 : 0.6);
        p.lit([{ x: 48, y: 33 }, { x: 52, y: 42 }, { x: 49, y: 43 }, { x: 53, y: 50 }, { x: 47, y: 44 }], 0xf87171, 0.7);
        // braccia a segmenti staccati: si muove a scatti
        p.shape(p.rect(5 - j(1), 32, 10, 15), 0x5f707a, { smooth: 0, hatch: 0.45, rim: 0xd8f3fb });
        p.shape(p.rect(1 + j(3), 51 + sin(t) * 1.5, 9, 13), 0x5f707a, { smooth: 0, hatch: 0.45 });
        p.shape([{ x: 0 + j(3), y: 65 }, { x: 10 + j(3), y: 65 }, { x: 8 + j(3), y: 72 }, { x: 4 + j(3), y: 74 }, { x: 2 + j(3), y: 70 }], 0x5f707a, { smooth: 0, hatch: 0.3 });
        p.shape(p.rect(62 + j(2), 29, 10, 14), 0x5f707a, { smooth: 0, hatch: 0.45 });
        p.shape(p.rect(66 - j(0), 48 - sin(t) * 1.5, 8, 15), 0x5f707a, { smooth: 0, hatch: 0.45 });
        for (const [x, y] of [[10, 48], [6, 64], [67, 44], [70, 47]] as const) p.glow(x, y, 1, 0x22d3ee, 0.8);
        // testa per metà mancante, antenna spezzata
        p.shape([{ x: 25 + j(2), y: 4 }, { x: 52 + j(2), y: 4 }, { x: 52 + j(2), y: 10 }, { x: 46 + j(2), y: 14 }, { x: 50 + j(2), y: 18 }, { x: 42 + j(2), y: 26 }, { x: 25 + j(2), y: 26 }], 0x7a8d98, { smooth: 0, hatch: 0.5, rim: 0xd8f3fb });
        p.shape(p.rect(28 + j(2), 8, 14, 13), 0x0b1216, { smooth: 0, hatch: 0, shadow: 0.2 });
        p.line([{ x: 30, y: 4 }, { x: 27, y: -1 }, { x: 24, y: 0 }], 1.4, 0x3f4f58);
        p.glow(24, 0, 1.2, f % 2 ? 0xf87171 : 0x22d3ee, 0.9);
        p.eye(33 + j(2), 14, 3.4, 0x22d3ee, { socket: false, angry: -0.2 });
        p.eye(46 + j(2) + j(1), 17, 2.6, 0xf87171, { angry: 0.5 });
        // fette di glitch che strappano l'immagine
        if (f === 1) p.lit(p.rect(14, 22, 48, 1.6), 0xf87171, 0.55);
        if (f === 3) p.lit(p.rect(18, 58, 40, 1.2), 0x22d3ee, 0.55);
    },
};

export const BOSS_ART: CreatureSpec[] = [
    guggu, breccio, notino, riba, lochef, ombra, ticummi, furgone, danjilo, smela, limite, teorema, pedrino, formicona, pedro,
    ...BOSS_ART_VOID,
];
