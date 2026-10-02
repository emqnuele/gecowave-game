import { INK, type CreatureSpec } from '../creatureKit';
import { arm, frontLegs, gecoHead, label, sin } from './bossKit';
import { glasses, lametta, piema } from './bossesVoid';

/* i personaggi della trama: frontali (parlano con te, non hanno un verso),
   colori più caldi dei nemici, respirano piano. stessa mano dei dipinti */

/** busto morbido a pera, la base di quasi tutti */
const torso = (cx: number, top: number, bottom: number, wt: number, wb: number, y: number) => [
    { x: cx - wt, y: top + y }, { x: cx + wt, y: top + y }, { x: cx + wb, y: bottom + y }, { x: cx - wb, y: bottom + y },
];

const markolino: CreatureSpec = {
    key: 'npc-markolino', w: 32, h: 48,
    draw(p, t) {
        const y = sin(t) * 0.6;
        frontLegs(p, 16, 37, 47, 7, 4, 0x253042, t);
        p.shape(torso(16, 21, 38, 8, 10, y), 0x2f6b4a, {
            hatch: 0.5, rim: 0xa7f3d0,
            detail: (pp) => pp.flat(pp.rect(14, 22 + y, 4, 16), 0x1f4d35, 0.8, 0),
        });
        arm(p, [{ x: 8, y: 24 + y }, { x: 5, y: 31 + y }, { x: 7, y: 36 + y }], 3.4, 0x2f6b4a, 0x4f7a52);
        arm(p, [{ x: 24, y: 24 + y }, { x: 27, y: 31 + y }, { x: 25, y: 36 + y }], 3.4, 0x2f6b4a, 0x4f7a52);
        gecoHead(p, 16, 13 + y, 8, 0x4f7a52, { mouth: 'grin' });
        // cappellino storto col frontino di lato
        p.shape([{ x: 8, y: 8 + y }, { x: 11, y: 3 + y }, { x: 21, y: 3 + y }, { x: 24, y: 8 + y }], 0x14301f, { hatch: 0.25, rim: 0x86efac });
        p.shape([{ x: 2, y: 8 + y }, { x: 12, y: 7 + y }, { x: 12, y: 10 + y }, { x: 3, y: 10 + y }], 0x14301f, { smooth: 0, hatch: 0 });
        p.eyes(16, 12 + y, 7, 1.8, 0x4ade80);
    },
};

const ivan: CreatureSpec = {
    key: 'npc-ivan', w: 44, h: 56,
    draw(p, t) {
        const y = sin(t) * 0.6;
        // spadone sulla schiena, la furia che taglia guggu
        p.shape([{ x: 33, y: 0 }, { x: 40, y: 0 }, { x: 38, y: 36 }, { x: 35, y: 36 }], 0x9ca3af, { smooth: 0, hatch: 0.3, rim: 0xffffff });
        p.shape(p.rect(30, 33, 13, 3), 0x4a3426, { smooth: 0, hatch: 0 });
        frontLegs(p, 20, 44, 55, 10, 6, 0x1f2937, t);
        // giubbotto di pelle e spalle enormi
        p.shape([{ x: 2, y: 22 + y }, { x: 38, y: 22 + y }, { x: 33, y: 46 + y }, { x: 7, y: 46 + y }], 0x3a2a22, {
            hatch: 0.55, rim: 0xd6a77a,
            detail: (pp) => {
                pp.flat([{ x: 16, y: 22 + y }, { x: 24, y: 22 + y }, { x: 20, y: 32 + y }], 0x1c1917, 1, 0);
                pp.line([{ x: 20, y: 32 + y }, { x: 20, y: 46 + y }], 0.6, 0x9ca3af, 0.7);
            },
        });
        arm(p, [{ x: 4, y: 25 + y }, { x: 1, y: 35 + y }, { x: 4, y: 43 + y }], 6, 0x3a2a22, 0x8c6d58);
        arm(p, [{ x: 36, y: 25 + y }, { x: 40, y: 35 + y }, { x: 37, y: 43 + y }], 6, 0x3a2a22, 0x8c6d58);
        gecoHead(p, 20, 13 + y, 9, 0x8c6d58, { mouth: 'flat' });
        p.shape([{ x: 11, y: 9 + y }, { x: 13, y: 3 + y }, { x: 20, y: 1 + y }, { x: 27, y: 3 + y }, { x: 29, y: 9 + y }], 0x1c1917, { hatch: 0.2 });
        p.eyes(20, 12 + y, 8, 2, 0xfacc15, { angry: 0.3 });
    },
};

const smela: CreatureSpec = {
    key: 'npc-smela', w: 30, h: 48,
    draw(p, t) {
        const y = sin(t) * 0.6;
        frontLegs(p, 14, 37, 47, 6, 4, 0x1e293b, t);
        p.shape(torso(14, 20, 38, 7, 8, y), 0x2f4a5a, {
            hatch: 0.5, rim: 0x9be7f5,
            detail: (pp) => {
                pp.flat([{ x: 11, y: 20 + y }, { x: 17, y: 20 + y }, { x: 14, y: 27 + y }], 0xf1f5f9, 1, 0);
                pp.flat([{ x: 13.4, y: 21 + y }, { x: 14.6, y: 21 + y }, { x: 15, y: 31 + y }, { x: 13, y: 31 + y }], 0x22d3ee, 1, 0);
            },
        });
        // il prodotto in bella vista
        const lift = sin(t) * 1;
        arm(p, [{ x: 20, y: 23 + y }, { x: 25, y: 22 + y }, { x: 26, y: 16 + y - lift }], 3.4, 0x2f4a5a, 0x6f8a5e);
        p.shape(p.rrect(23.5, 5 + y - lift, 6, 11, 2), 0x7fb6c6, { smooth: 0, hatch: 0.2, shadow: 0.3, rim: 0xe0f7ff });
        p.lit(p.rect(24.5, 9 + y - lift, 4, 5), 0x22d3ee, 0.75);
        p.shape(p.rect(25, 2.5 + y - lift, 3, 2.6), 0x1e40af, { smooth: 0, hatch: 0 });
        arm(p, [{ x: 8, y: 23 + y }, { x: 5, y: 30 + y }, { x: 7, y: 35 + y }], 3.4, 0x2f4a5a, 0x6f8a5e);
        gecoHead(p, 14, 12 + y, 8, 0x6f8a5e, { mouth: 'grin' });
        p.shape(p.ellipse(14, 6 + y, 8, 3), 0x1c1917, { hatch: 0.2 });
        p.eyes(14, 11 + y, 7, 1.7, 0x22d3ee);
    },
};

const filippus: CreatureSpec = {
    key: 'npc-filippus', w: 46, h: 54,
    draw(p, t) {
        const y = sin(t) * 0.8;
        // zampette tozze da dodo
        for (const x of [17, 29]) p.limb([{ x, y: 46 }, { x, y: 53 }], 4, 4, 0xd99a3a, { hatch: 0 });
        // petto enorme da panca piana
        p.shape(p.ellipse(23, 36 + y, 20, 15), 0x8a8073, { hatch: 0.5, rim: 0xe7e2d6 });
        p.flat(p.ellipse(23, 38 + y, 11, 9), 0xc9c0b0, 0.8);
        // braccia gonfie a mo' d'ali
        for (const [x, d] of [[5, -1], [41, 1]] as const) p.shape(p.ellipse(x, 33 + y + sin(t) * d, 6, 11, d * 0.2), 0x7a7064, { hatch: 0.5, rim: 0xe7e2d6 });
        // testolina sproporzionata col becco
        p.shape(p.ellipse(23, 15 + y, 8, 7.5), 0x8a8073, { hatch: 0.35 });
        p.shape([{ x: 18, y: 15 + y }, { x: 28, y: 15 + y }, { x: 25, y: 23 + y }, { x: 21, y: 23 + y }], 0xd9a441, { smooth: 1, hatch: 0.2 });
        p.line([{ x: 20, y: 18 + y }, { x: 26, y: 18 + y }], 0.6, INK, 0.6);
        // ciuffo di piume
        p.shape([{ x: 19, y: 9 + y }, { x: 19, y: 2 + y }, { x: 23, y: 6 + y }, { x: 26, y: 1 + y }, { x: 27, y: 9 + y }], 0x5b544a, { hatch: 0.2 });
        p.eyes(23, 12 + y, 8, 1.8, 0x60a5fa);
    },
};

const piemaNpc: CreatureSpec = {
    key: 'npc-piema', w: 34, h: 52,
    draw(p, t) {
        const h = piema(p, 17, 2 + sin(t) * 0.6, 51, 30, 0x2b2f4a, t);
        glasses(p, h.hx, h.hy - 1, 7.4, 2.6, 0xe0e7ff);
        p.glow(17, 1, 1.6, 0xc084fc, 0.6);
    },
};

const ticummi: CreatureSpec = {
    key: 'npc-ticummi', w: 46, h: 52,
    draw(p, t, f) {
        const y = sin(t) * 1.4;
        for (const x of [16, 32]) p.glow(x, 42 + y, 2.6 + (f % 2) * 0.6, 0x60a5fa, 0.8);
        p.shape(p.rrect(6, 26 + y, 34, 11, 4), 0x2b3446, { smooth: 0, hatch: 0.4, rim: 0x93c5fd });
        p.shape(p.rrect(5, 8 + y, 9, 20, 3), 0x2b3446, { smooth: 0, hatch: 0.45, rim: 0x93c5fd });
        p.shape(p.ellipse(25, 22 + y, 10, 9), 0xe6e8ec, { hatch: 0.5 });
        // laptop della tommasorveglianza sulle ginocchia
        p.shape(p.rect(17, 26 + y, 17, 2.4), 0x1f2937, { smooth: 0, hatch: 0 });
        p.lit([{ x: 18, y: 17 + y }, { x: 32, y: 17 + y }, { x: 33, y: 26 + y }, { x: 19, y: 26 + y }], 0x60a5fa, 0.75);
        gecoHead(p, 25, 9 + y, 7, 0x7a8f6a, { mouth: 'grin' });
        p.shape([{ x: 18, y: 6 + y }, { x: 18, y: 0 + y }, { x: 23, y: 3 + y }, { x: 27, y: -1 + y }, { x: 31, y: 3 + y }, { x: 32, y: 7 + y }], 0xd1d5db, { hatch: 0.2 });
        glasses(p, 25, 9 + y, 6, 2.2, 0x22d3ee);
    },
};

const lochef: CreatureSpec = {
    key: 'npc-lochef', w: 32, h: 50,
    draw(p, t) {
        const y = sin(t) * 0.6;
        frontLegs(p, 16, 40, 49, 7, 4.4, 0x2a2a33, t);
        p.shape(p.ellipse(16, 32 + y, 11, 11), 0xe3ded2, { hatch: 0.5 });
        p.shape(torso(16, 26, 42, 7, 8, y), 0xf4f1ea, {
            hatch: 0.4,
            detail: (pp) => {
                pp.flat(pp.ellipse(12, 33 + y, 1.6, 1.3), 0x9b1c1c, 0.7);
                pp.flat(pp.ellipse(19, 38 + y, 2, 1.5), 0x9b1c1c, 0.7);
            },
        });
        arm(p, [{ x: 6, y: 27 + y }, { x: 3, y: 34 + y }, { x: 6, y: 38 + y }], 3.6, 0xc6a58a);
        // mestolo in mano, sempre pronto
        arm(p, [{ x: 26, y: 27 + y }, { x: 29, y: 31 + y }, { x: 28, y: 24 + y }], 3.6, 0xc6a58a);
        p.limb([{ x: 28, y: 26 + y }, { x: 29, y: 15 + y }], 1.6, 1.4, 0x9ca3af, { hatch: 0 });
        p.shape(p.ellipse(29, 14 + y, 2.6, 2), 0x9ca3af, { smooth: 0, hatch: 0 });
        gecoHead(p, 16, 15 + y, 8, 0xb39278, { mouth: 'none' });
        p.shape([{ x: 8, y: 10 + y }, { x: 6, y: 3 + y }, { x: 11, y: -2 + y }, { x: 16, y: 0 + y }, { x: 21, y: -2 + y }, { x: 26, y: 3 + y }, { x: 24, y: 10 + y }], 0xf8f6f0, { hatch: 0.3 });
        // sorriso largo. troppo largo.
        p.teeth(10, 18 + y, 12, 3, 6, 0xfaf7ef, 0.75);
        p.eyes(16, 14 + y, 7, 1.8, 0xf87171);
    },
};

const samatt: CreatureSpec = {
    key: 'npc-samatt', w: 30, h: 46,
    draw(p, t) {
        const y = sin(t) * 0.4;
        // seduto composto, ginocchia avanti: la routine del loop
        for (const x of [10, 20]) {
            p.limb([{ x, y: 33 }, { x: x + 1, y: 36 }, { x, y: 45 }], 4, 3.4, 0x2b2f3a, { hatch: 0.3 });
        }
        p.shape(torso(15, 18, 35, 7, 9, y), 0x6b6253, { hatch: 0.5 });
        arm(p, [{ x: 8, y: 21 + y }, { x: 7, y: 29 + y }, { x: 10, y: 33 + y }], 3.2, 0x6b6253, 0x6a7a5c);
        arm(p, [{ x: 22, y: 21 + y }, { x: 23, y: 29 + y }, { x: 20, y: 33 + y }], 3.2, 0x6b6253, 0x6a7a5c);
        // i giri contati sul braccio
        for (let k = 0; k < 4; k++) p.line([{ x: 22 + k * 1.3, y: 25 + y }, { x: 22.4 + k * 1.3, y: 28.5 + y }], 0.5, 0xfacc15);
        p.line([{ x: 21.6, y: 28 + y }, { x: 27, y: 25 + y }], 0.5, 0xfacc15);
        gecoHead(p, 15, 11 + y, 7, 0x6a7a5c, { mouth: 'flat' });
        p.eyes(15, 10 + y, 6, 1.5, 0xfacc15);
    },
};

const guastalla: CreatureSpec = {
    key: 'npc-guastalla', w: 32, h: 44,
    draw(p, t) {
        const y = sin(t) * 0.4;
        frontLegs(p, 16, 34, 43, 7, 3.8, 0x2b2f3a, t);
        p.shape(torso(16, 20, 36, 8, 10, y), 0x5a5148, { hatch: 0.6 });
        arm(p, [{ x: 8, y: 22 + y }, { x: 6, y: 30 + y }, { x: 7, y: 36 + y }], 3.2, 0x5a5148, 0x5f6a55);
        arm(p, [{ x: 24, y: 22 + y }, { x: 26, y: 30 + y }, { x: 25, y: 36 + y }], 3.2, 0x5a5148, 0x5f6a55);
        // testa reclinata: si è arreso al loop
        gecoHead(p, 21, 13 + y, 7, 0x5f6a55, { mouth: 'frown' });
        p.eye(18.5, 12 + y, 1.3, 0x64748b, { lid: 0.6 });
        p.eye(23.5, 13 + y, 1.3, 0x64748b, { lid: 0.6 });
        p.glow(16, 26 + y, 1.4, 0xfacc15, 0.25);
    },
};

const studente: CreatureSpec = {
    key: 'npc-studente', w: 30, h: 36,
    draw(p, t) {
        const y = sin(t, 2) * 0.5;
        // accovacciato, ginocchia al petto
        p.shape(p.ellipse(15, 26 + y, 10, 8), 0x3b4a6b, { hatch: 0.5 });
        for (const x of [9, 21]) p.shape(p.ellipse(x, 33, 3.6, 2), 0x1f2937, { hatch: 0, shadow: 0.4 });
        gecoHead(p, 15, 11 + y, 7, 0x6a7a6c, { mouth: 'frown' });
        glasses(p, 15, 10.5 + y, 6, 2.2, 0x60a5fa);
        // il libro di analisi come scudo, tremante
        const k = sin(t, 4) * 0.4;
        p.shape(p.rect(5 + k, 15, 20, 13), 0x1e3a5f, {
            smooth: 0, hatch: 0.3, rim: 0x93c5fd,
            detail: (pp) => {
                pp.line([{ x: 15 + k, y: 15 }, { x: 15 + k, y: 28 }], 0.6, INK, 0.6);
                pp.ctx.font = 'bold 4px monospace';
                pp.ctx.fillStyle = '#bfdbfe';
                pp.ctx.fillText('∫dx', 6.5 + k, 23);
            },
        });
    },
};

const romero: CreatureSpec = {
    key: 'npc-romero', w: 32, h: 50,
    draw(p, t) {
        const y = sin(t) * 0.5;
        frontLegs(p, 16, 40, 49, 7, 4, 0x1f2937, t);
        // impermeabile da commissario
        p.shape([{ x: 7, y: 21 + y }, { x: 25, y: 21 + y }, { x: 28, y: 44 }, { x: 4, y: 44 }], 0x8a7a5a, {
            hatch: 0.5, rim: 0xe7d8a8,
            detail: (pp) => {
                pp.line([{ x: 16, y: 22 + y }, { x: 16, y: 44 }], 0.6, INK, 0.5);
                pp.flat([{ x: 12, y: 21 + y }, { x: 20, y: 21 + y }, { x: 16, y: 28 + y }], 0x5a4a32, 1, 0);
                pp.flat(pp.rect(6, 33, 20, 2), 0x5a4a32, 0.8, 0);
            },
        });
        arm(p, [{ x: 8, y: 24 + y }, { x: 5, y: 32 + y }, { x: 7, y: 37 + y }], 3.4, 0x8a7a5a, 0x6a7a6c);
        // il taccuino degli indizi
        arm(p, [{ x: 24, y: 24 + y }, { x: 27, y: 30 + y }, { x: 25, y: 33 + y }], 3.4, 0x8a7a5a, 0x6a7a6c);
        p.shape(p.rect(24, 27 + y, 6, 8), 0xf1ede2, { smooth: 0, hatch: 0, shadow: 0.25, line: 0.6 });
        gecoHead(p, 16, 14 + y, 8, 0x6a7a6c, { mouth: 'flat' });
        // cappello da commissario
        p.shape(p.ellipse(16, 8 + y, 11, 2.4), 0x2a2f3a, { hatch: 0 });
        p.shape(p.rrect(10, 1 + y, 12, 7.5, 3), 0x2a2f3a, { smooth: 0, hatch: 0.3, rim: 0x94a3b8 });
        p.flat(p.rect(10, 5.6 + y, 12, 1.2), 0x7f1d1d, 1, 0);
        p.eyes(16, 13 + y, 7, 1.7, 0x60a5fa, { lid: 0.3 });
    },
};

const vavleeh: CreatureSpec = {
    key: 'npc-vavleeh', w: 44, h: 22, frames: 1,
    draw(p) {
        // il contorno da scena del crimine, col gesso
        p.ctx.strokeStyle = 'rgba(229,231,235,0.7)';
        p.ctx.lineWidth = 0.9;
        p.ctx.setLineDash([2, 1.5]);
        p.ctx.beginPath();
        p.ctx.ellipse(22, 15, 20, 6.5, 0, 0, Math.PI * 2);
        p.ctx.stroke();
        p.ctx.setLineDash([]);
        p.shape(p.ellipse(20, 16, 15, 4.2), 0x4a3f5a, { hatch: 0.6 });
        p.shape(p.ellipse(36, 13, 5, 4.4), 0x5a4f6a, { hatch: 0.4 });
        p.limb([{ x: 6, y: 17 }, { x: 0, y: 19 }], 2.6, 1.2, 0x4a3f5a);
        p.line([{ x: 34, y: 12 }, { x: 36, y: 14 }], 0.6);
        p.line([{ x: 36, y: 12 }, { x: 34, y: 14 }], 0.6);
        // un glow flebile: qualcosa di lui brilla ancora
        p.glow(37, 12, 1.2, 0xc084fc, 0.5);
    },
};

const lamettaNpc: CreatureSpec = {
    key: 'npc-lametta', w: 54, h: 84,
    draw(p, t) {
        const y = sin(t) * 1;
        lametta(p, 9, 8 + y, 36, 64);
        p.eyes(27, 24 + y, 12, 2.6, 0xc084fc);
        p.limb([{ x: 48, y: 42 + y }, { x: 53 + sin(t) * 1.5, y: 24 + y }], 2.4, 2, 0x6b4a2a, { hatch: 0 });
        p.lit(p.ellipse(53.5 + sin(t) * 1.5, 21 + y, 2.6, 4), 0xc084fc, 0.95);
    },
};

const walter: CreatureSpec = {
    key: 'npc-walter', w: 40, h: 54,
    draw(p, t, f) {
        const y = sin(t) * 0.8;
        frontLegs(p, 20, 46, 53, 9, 4.4, 0x1f2937, t);
        // pancetta nella polo verdina
        p.shape(p.ellipse(20, 36 + y, 13, 13), 0x2f8a52, {
            hatch: 0.5, rim: 0xa7f3d0,
            detail: (pp) => pp.flat([{ x: 15, y: 24 + y }, { x: 20, y: 30 + y }, { x: 25, y: 24 + y }], 0x1e5a36, 1, 0),
        });
        arm(p, [{ x: 8, y: 30 + y }, { x: 5, y: 38 + y }, { x: 8, y: 43 + y }], 4.4, 0x2f8a52, 0x8a9a6a);
        // chiavi della polo in mano
        arm(p, [{ x: 32, y: 30 + y }, { x: 35, y: 37 + y }, { x: 34, y: 41 + y }], 4.4, 0x2f8a52, 0x8a9a6a);
        p.line([{ x: 34, y: 42 + y }, { x: 36, y: 46 + y }], 0.7, 0xd1d5db);
        p.shape(p.ellipse(36.5, 47 + y, 2.4, 2.4), 0xd4a017, { smooth: 0, hatch: 0 });
        gecoHead(p, 20, 15 + y, 9, 0x8a9a6a, { mouth: 'flat' });
        p.shape(p.ellipse(20, 8 + y, 8, 3), 0x52525b, { hatch: 0.2 });
        // occhi mezzi chiusi: si addormenta sempre
        p.eyes(20, 14 + y, 8, 1.6, 0x86efac, { lid: 0.85 });
        // zzz del sonnellino che salgono
        const u = (t + f * 0.0) % 1;
        label(p, 'z', 30 + u * 3, 8 - u * 6, 4 + u * 2, `rgba(134,239,172,${0.9 - u * 0.6})`, true);
    },
};

const notino: CreatureSpec = {
    key: 'npc-notino', w: 28, h: 38,
    draw(p, t) {
        const y = sin(t) * 0.5;
        frontLegs(p, 14, 29, 37, 6, 3.4, 0x1f2937, t);
        p.shape(torso(14, 18, 30, 6, 7, y), 0x7f1d1d, { hatch: 0.45, rim: 0xfca5a5 });
        arm(p, [{ x: 8, y: 20 + y }, { x: 5, y: 26 + y }, { x: 7, y: 30 + y }], 3, 0x7f1d1d, 0x3f6a46);
        // una forchetta: a casa si mangia
        arm(p, [{ x: 20, y: 20 + y }, { x: 23, y: 24 + y }, { x: 23, y: 19 + y }], 3, 0x7f1d1d, 0x3f6a46);
        p.line([{ x: 23, y: 20 + y }, { x: 24.5, y: 10 + y }], 1, 0x9ca3af);
        for (const dx of [-1, 0, 1]) p.line([{ x: 24.5 + dx, y: 10 + y }, { x: 24.8 + dx, y: 7 + y }], 0.5, 0x9ca3af);
        gecoHead(p, 14, 11 + y, 7, 0x3f6a46, { mouth: 'grin' });
        // cappellino girato all'indietro
        p.shape([{ x: 7, y: 7 + y }, { x: 9, y: 3 + y }, { x: 19, y: 3 + y }, { x: 21, y: 7 + y }], 0x7f1d1d, { hatch: 0.2 });
        p.shape(p.rect(19, 5.5 + y, 6, 2), 0x7f1d1d, { smooth: 0, hatch: 0 });
        p.eyes(14, 10.5 + y, 6, 1.5, 0xf87171);
    },
};

const mamma: CreatureSpec = {
    key: 'npc-mamma', w: 34, h: 52,
    draw(p, t) {
        const y = sin(t) * 0.5;
        frontLegs(p, 17, 44, 51, 7, 4, 0x3a2f2a, t);
        p.shape([{ x: 8, y: 22 + y }, { x: 26, y: 22 + y }, { x: 29, y: 45 }, { x: 5, y: 45 }], 0x6b4a5a, { hatch: 0.5, rim: 0xf5c6d6 });
        // grembiule a quadretti
        p.shape(p.rect(11, 27 + y, 12, 16), 0xe9e4da, {
            smooth: 0, hatch: 0.2,
            detail: (pp) => {
                for (let k = 0; k < 4; k++) pp.flat(pp.rect(11, 28 + y + k * 4, 12, 1.4), 0xb91c1c, 0.75, 0);
                for (let k = 0; k < 3; k++) pp.flat(pp.rect(12.5 + k * 4, 27 + y, 1.4, 16), 0xb91c1c, 0.5, 0);
            },
        });
        arm(p, [{ x: 8, y: 25 + y }, { x: 5, y: 32 + y }, { x: 8, y: 37 + y }], 3.6, 0x6b4a5a, 0x7a8a6a);
        // mestolo
        arm(p, [{ x: 26, y: 25 + y }, { x: 29, y: 30 + y }, { x: 28, y: 33 + y }], 3.6, 0x6b4a5a, 0x7a8a6a);
        p.line([{ x: 28, y: 32 + y }, { x: 30, y: 42 + y }], 1.2, 0x9ca3af);
        p.shape(p.ellipse(30.5, 43 + y, 2.6, 2), 0x9ca3af, { smooth: 0, hatch: 0 });
        gecoHead(p, 17, 14 + y, 8, 0x7a8a6a, { mouth: 'grin' });
        // crocchia
        p.shape(p.ellipse(17, 4 + y, 4.4, 3.6), 0x3a2a22, { hatch: 0.3 });
        p.shape(p.ellipse(17, 8 + y, 8.5, 3), 0x3a2a22, { hatch: 0.2 });
        p.eyes(17, 13.5 + y, 7, 1.5, 0xfca5a5);
    },
};

export const NPC_ART: CreatureSpec[] = [
    markolino, ivan, smela, filippus, piemaNpc, ticummi, lochef, samatt, guastalla, studente, romero, vavleeh, lamettaNpc, walter, notino, mamma,
];
