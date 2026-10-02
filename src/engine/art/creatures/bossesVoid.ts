import type { Pt } from '../ink';
import { INK, type CreatureSpec, type Painter } from '../creatureKit';
import { arm, aura, dissolve, frontLegs, gecoHead, label, scanlines, sin, TAU } from './bossKit';

/* gli dei, il void e l'arco delle autoscuole. i rimpianti sono figure
   umane fatte di ricordo: colori smorti, scanline, il fondo che si sfalda.
   viola = colpe di lametta, blu = colpe di piema */

/** lametta: la lama da barba fatta dio, coi fori e le lame ai lati */
export function lametta(p: Painter, x: number, y: number, w: number, h: number, body = 0xb9bccb, tone = 1): void {
    for (const [sx, sy] of [[0, 0.12], [1, 0.12], [0, 0.66], [1, 0.66]] as const) {
        const bx = sx ? x + w : x;
        const d = sx ? 1 : -1;
        p.shape([{ x: bx, y: y + h * sy }, { x: bx + d * w * 0.2, y: y + h * (sy + 0.1) }, { x: bx, y: y + h * (sy + 0.2) }], 0xdfe3ee, { smooth: 0, hatch: 0, rim: 0xffffff });
    }
    p.shape(p.rrect(x, y, w, h, w * 0.18), body, {
        smooth: 0, hatch: 0.45 * tone, rim: 0xffffff,
        detail: (pp) => {
            const g = pp.ctx.createLinearGradient(x, y, x + w, y + h);
            g.addColorStop(0, 'rgba(255,255,255,0.35)');
            g.addColorStop(0.45, 'rgba(255,255,255,0)');
            g.addColorStop(0.55, 'rgba(255,255,255,0.25)');
            g.addColorStop(1, 'rgba(0,0,0,0.1)');
            pp.ctx.fillStyle = g;
            pp.ctx.fillRect(x, y, w, h);
        },
    });
    // i fori classici della lametta
    p.flat(p.rrect(x + w * 0.42, y + h * 0.1, w * 0.16, h * 0.2, w * 0.08), INK, 1, 0);
    p.flat(p.rrect(x + w * 0.42, y + h * 0.7, w * 0.16, h * 0.2, w * 0.08), INK, 1, 0);
    p.flat(p.rect(x + w * 0.15, y + h * 0.47, w * 0.7, h * 0.07), INK, 1, 0);
}

/** piema: il mantello a triangolo, la testa tonda, gli occhiali di teoremi */
export function piema(p: Painter, cx: number, top: number, ground: number, w: number, cloak: number, t: number): { hx: number; hy: number; r: number } {
    const r = w * 0.27;
    const hy = top + r;
    const sway = sin(t) * 1.5;
    p.shape([{ x: cx - w * 0.14, y: hy + r * 0.7 }, { x: cx + w * 0.14, y: hy + r * 0.7 }, { x: cx + w / 2 + sway, y: ground }, { x: cx + w * 0.2, y: ground - 3 }, { x: cx, y: ground }, { x: cx - w * 0.2, y: ground - 3 }, { x: cx - w / 2 + sway, y: ground }], cloak, { smooth: 1, hatch: 0.55, rim: 0xc7d2fe });
    gecoHead(p, cx, hy, r, 0x8b9a7a, { mouth: 'flat' });
    return { hx: cx, hy, r };
}

export function glasses(p: Painter, cx: number, y: number, gap: number, r: number, lens: number): void {
    for (const dx of [-gap / 2, gap / 2]) {
        p.shape(p.ellipse(cx + dx, y, r, r * 0.9), 0x0f172a, { smooth: 0, hatch: 0, line: 1 });
        p.lit(p.ellipse(cx + dx, y, r * 0.78, r * 0.7), lens, 0.85);
    }
    p.line([{ x: cx - gap / 2 + r, y }, { x: cx + gap / 2 - r, y }], 1, 0xe5e7eb);
}

const dei: CreatureSpec = {
    key: 'boss-dei', w: 120, h: 110, pad: 8,
    draw(p, t, f) {
        const y = sin(t) * 1.6;
        aura(p, 60, 55, 62, 0xffffff, 0.18);
        aura(p, 34, 50, 40, 0xc084fc, 0.25);
        aura(p, 86, 50, 40, 0x60a5fa, 0.25);
        // lametta a sinistra, col pennello
        lametta(p, 12, 14 + y, 42, 80);
        p.eyes(33, 34 + y, 14, 3.4, 0xc084fc, { angry: 0.35 });
        p.limb([{ x: 6, y: 60 + y }, { x: -2 + sin(t) * 2, y: 26 + y }], 3, 2.4, 0x6b4a2a, { hatch: 0 });
        p.lit(p.ellipse(-2.5 + sin(t) * 2, 22 + y, 3.6, 5.5), 0xc084fc, 0.95);
        // piema a destra, sereno e terribile
        const hd = piema(p, 88, 8 - y, 100 - y, 46, 0x2b2f4a, t);
        glasses(p, hd.hx, hd.hy - 1, 10, 3.6, 0x93c5fd);
        // scintille divine che girano tra i due
        for (let k = 0; k < 6; k++) {
            const a = t * TAU + (k / 6) * TAU;
            const sx = 60 + Math.cos(a) * 12;
            const sy = 56 + Math.sin(a) * 30;
            p.glow(sx, sy, 1.2 + (k % 2), k % 2 ? 0xc084fc : 0x93c5fd, 0.85);
        }
        if (f % 2) p.lit([{ x: 58, y: 8 }, { x: 62, y: 18 }, { x: 59, y: 18 }, { x: 63, y: 28 }, { x: 56, y: 17 }, { x: 59, y: 17 }], 0xffffff, 0.8);
    },
};

/** bottiglia di birra con etichetta: il corpo del flauto */
function bottle(p: Painter, x: number, y: number, w: number, h: number, tag: string): void {
    p.shape([{ x: x + w * 0.36, y }, { x: x + w * 0.64, y }, { x: x + w * 0.66, y: y + h * 0.22 }, { x: x + w, y: y + h * 0.36 }, { x: x + w, y: y + h }, { x, y: y + h }, { x, y: y + h * 0.36 }, { x: x + w * 0.34, y: y + h * 0.22 }], 0x1f6b2a, {
        hatch: 0.35, shadow: 0.5, rim: 0xb8f7a0,
        detail: (pp) => {
            pp.flat(pp.rect(x, y + h * 0.5, w, h * 0.32), 0xf2e2a0, 0.95, 0);
            pp.flat(pp.rect(x, y + h * 0.5, w, h * 0.05), 0xb91c1c, 0.9, 0);
            pp.ctx.font = `bold ${Math.max(2.5, w * 0.16)}px monospace`;
            pp.ctx.fillStyle = '#7c2d12';
            pp.ctx.fillText(tag, x + w * 0.08, y + h * 0.7);
            // riflesso del vetro
            pp.flat(pp.rect(x + w * 0.15, y + h * 0.3, w * 0.08, h * 0.6), 0xd9f99d, 0.35, 0);
        },
    });
    p.shape(p.rect(x + w * 0.33, y - 3, w * 0.34, 4), 0xd97706, { smooth: 0, hatch: 0, rim: 0xfde68a });
}

const flauto: CreatureSpec = {
    key: 'boss-flauto', w: 92, h: 96,
    draw(p, t) {
        const y = sin(t) * 1.2;
        aura(p, 46, 50, 46, 0x84cc16, 0.18);
        // le due bottiglie gregarie che ondeggiano
        bottle(p, 8, 30 + y + sin(t, 1, 0.3) * 2, 18, 50, 'SPERO');
        bottle(p, 66, 30 + y + sin(t, 1, 0.7) * 2, 18, 50, 'INDIO');
        // la bottiglia capo, con la faccia
        bottle(p, 34, 14 + y, 24, 60, 'SPEROINDIO');
        p.eyes(46, 30 + y, 9, 3.2, 0xef4444, { angry: 0.45 });
        p.teeth(40, 36 + y, 12, 4, 6, 0xfef3c7, 0.85);
        // schiuma che cola dal collo e gocce di birra
        p.shape([{ x: 40, y: 12 + y }, { x: 44, y: 7 + y }, { x: 49, y: 9 + y }, { x: 53, y: 7 + y }, { x: 54, y: 13 + y }, { x: 50, y: 16 + y }, { x: 42, y: 16 + y }], 0xf8f5e6, { hatch: 0.2, shadow: 0.3 });
        for (const [x, base] of [[46, 74], [17, 80], [75, 80]] as const) {
            const u = (t + x / 100) % 1;
            p.lit(p.ellipse(x, base + y + u * 12, 1.6, 2.4), 0x84cc16, 0.9 * (1 - u));
        }
    },
};

const settequaranta: CreatureSpec = {
    key: 'boss-settequaranta', w: 130, h: 84, faces: true, pad: 8,
    draw(p, t, f) {
        const y = sin(t, 2) * 0.7;
        aura(p, 65, 44, 60, 0xfacc15, 0.12);
        // carcassa di citelis sepolta: ruggine, terra e radici
        p.shape([{ x: 6, y: 24 + y }, { x: 14, y: 14 + y }, { x: 122, y: 12 + y }, { x: 125, y: 20 + y }, { x: 124, y: 72 + y }, { x: 4, y: 72 + y }], 0x8a6a1c, {
            hatch: 0.6, rim: 0xf6d77a,
            detail: (pp) => {
                for (let k = 0; k < 9; k++) pp.flat(pp.ellipse(18 + k * 12, 64 + y + (k % 3), 5 + (k % 3) * 2, 3.4), 0x4a2a12, 0.8);
                pp.speckle(4, 14 + y, 120, 58, 0x5a2e0e, 90, 1.2, 0.55);
                pp.flat(pp.rect(4, 54 + y, 122, 4), 0x2d1a0a, 0.5, 0);
            },
        });
        // finestrini sfondati, uno ancora acceso
        for (let i = 0; i < 4; i++) {
            const x = 36 + i * 21;
            if (i === 2) p.lit(p.rect(x, 22 + y, 15, 15), 0xfacc15, f % 2 ? 0.75 : 0.55);
            else p.shape([{ x, y: 22 + y }, { x: x + 15, y: 22 + y }, { x: x + 15, y: 37 + y }, { x: x + 7, y: 31 + y }, { x, y: 37 + y }], 0x0a0d12, { smooth: 0, hatch: 0, shadow: 0.2 });
        }
        // radici che pendono dal fondo e dal tetto
        for (const [x, l] of [[30, 10], [60, 14], [92, 9], [112, 12]] as const) p.line(p.curve({ x, y: 72 + y }, { x: x + 3, y: 72 + l * 0.6 + y }, { x: x - 1 + sin(t, 1, x / 50), y: 72 + l + y }, 5), 1.4, 0x3a2410);
        // numero di linea sul cartello
        p.lit(p.rect(16, 15 + y, 20, 7), 0x111827, 1);
        label(p, '7:40', 17.5, 20.6 + y, 5, '#facc15', true);
        // fari come occhi e paraurti a denti
        p.eye(12, 50 + y, 5.2, 0xfacc15, { angry: -0.5, socket: true });
        p.lit([{ x: 6, y: 30 + y }, { x: 12, y: 24 + y }, { x: 30, y: 24 + y }, { x: 30, y: 40 + y }, { x: 5, y: 40 + y }], 0x1a1f28, 0.95);
        p.eye(18, 33 + y, 4, 0xfacc15, { angry: -0.4, socket: false, pupil: true });
        const open = 0.7 + sin(t) * 0.3;
        p.teeth(2, 58 + y, 32, 12, 8, 0xc9ccd1, open);
    },
};

const custode: CreatureSpec = {
    key: 'boss-custode', w: 60, h: 84,
    draw(p, t, f) {
        const y = sin(t) * 1.4;
        // disco d'oro alle spalle che gira
        const disc = p.ellipse(30, 40 + y, 26, 26);
        p.shape(disc, 0xb08a1a, {
            smooth: 0, hatch: 0, shadow: 0.25, rim: 0xfff1a8,
            detail: (pp) => {
                for (let r = 6; r < 25; r += 3) {
                    pp.ctx.strokeStyle = 'rgba(60,40,0,0.45)';
                    pp.ctx.lineWidth = 0.5;
                    pp.ctx.beginPath();
                    pp.ctx.arc(30, 40 + y, r, 0, TAU);
                    pp.ctx.stroke();
                }
                const a = t * TAU;
                pp.ctx.fillStyle = 'rgba(255,250,210,0.45)';
                pp.ctx.beginPath();
                pp.ctx.moveTo(30, 40 + y);
                pp.ctx.arc(30, 40 + y, 25, a, a + 0.5);
                pp.ctx.fill();
            },
        });
        aura(p, 30, 40, 34, 0xfde047, 0.2);
        // corpo spettrale del primo custode
        p.shape([{ x: 18, y: 26 + y }, { x: 42, y: 26 + y }, { x: 46, y: 62 + y }, { x: 38, y: 70 + y }, { x: 22, y: 70 + y }, { x: 14, y: 62 + y }], 0x2f5a44, { hatch: 0.5, rim: 0xa7f3d0 });
        dissolve(p, 30, 70 + y, 18, 0x4ade80, t);
        // coda che si dissolve in note
        p.limb(p.curve({ x: 18, y: 62 + y }, { x: 4, y: 70 + sin(t) * 3 }, { x: 2, y: 80 }, 8), 5, 1, 0x2f5a44, { rim: 0xa7f3d0 });
        // una mano batte il tempo, l'altra regge la bacchetta
        const beat = f % 2 ? -4 : 2;
        arm(p, [{ x: 18, y: 32 + y }, { x: 10, y: 40 + y }, { x: 8, y: 34 + y + beat }], 4.4, 0x2f5a44);
        arm(p, [{ x: 42, y: 32 + y }, { x: 50, y: 38 + y }, { x: 52, y: 30 + y - beat }], 4.4, 0x2f5a44);
        p.line([{ x: 52, y: 30 + y - beat }, { x: 58, y: 18 + y - beat }], 1, 0xfde68a);
        // testa con la maschera del custode
        gecoHead(p, 30, 15 + y, 11, 0x2f5a44, { mouth: 'none', rim: 0xa7f3d0 });
        p.shape([{ x: 19, y: 10 + y }, { x: 41, y: 10 + y }, { x: 39, y: 20 + y }, { x: 30, y: 23 + y }, { x: 21, y: 20 + y }], 0xe8e2c8, { hatch: 0.3 });
        p.eyes(30, 15 + y, 10, 2.4, 0x4ade80, { lid: 0.45 });
        // note che gli orbitano
        for (let k = 0; k < 3; k++) {
            const a = t * TAU + (k / 3) * TAU;
            label(p, k % 2 ? '♪' : '♫', 28 + Math.cos(a) * 26, 44 + y + Math.sin(a) * 30, 7, '#fde047', true);
        }
    },
};

/** figura di ricordo: torso, testa, gambe che si sfaldano, scanline */
function regret(p: Painter, t: number, color: number, skin: number, glowC: number, o: { headY?: number; slump?: number } = {}): { hx: number; hy: number } {
    const y = sin(t) * 1.4;
    const s = o.slump ?? 0;
    aura(p, 26, 44, 30, glowC, 0.2);
    frontLegs(p, 26 + s * 0.3, 60 + y, 76, 8, 4.6, color, t, true);
    dissolve(p, 26, 72 + y, 16, glowC, t);
    p.shape([{ x: 16 + s, y: 24 + y + s }, { x: 37 + s, y: 24 + y + s }, { x: 39, y: 62 + y }, { x: 14, y: 62 + y }], color, { hatch: 0.55, rim: glowC });
    const hx = 27 + s * 1.4;
    const hy = (o.headY ?? 14) + y + s * 1.2;
    gecoHead(p, hx, hy, 10, skin, { mouth: 'none', rim: glowC });
    return { hx, hy };
}

const delegato: CreatureSpec = {
    key: 'boss-delegato', w: 52, h: 80,
    draw(p, t, f) {
        const y = sin(t) * 1.4;
        const open = sin(t) * 3;
        arm(p, [{ x: 17, y: 28 + y }, { x: 8, y: 25 + y - open * 0.5 }, { x: 1, y: 18 + y - open }], 4.4, 0x3b2a52, 0x7a6a8a);
        arm(p, [{ x: 36, y: 28 + y }, { x: 44, y: 25 + y - open * 0.5 }, { x: 50, y: 20 + y - open }], 4.4, 0x3b2a52, 0x7a6a8a);
        const h = regret(p, t, 0x3b2a52, 0x7a6a8a, 0xc084fc);
        // il foglio della delega, sporto in avanti
        p.shape([{ x: 46, y: 8 + y - open }, { x: 56, y: 10 + y - open }, { x: 54, y: 22 + y - open }, { x: 44, y: 20 + y - open }], 0xf3e8ff, { smooth: 0, hatch: 0.2, shadow: 0.3 });
        for (const k of [0, 1, 2]) p.line([{ x: 47, y: 12 + k * 3 + y - open }, { x: 53, y: 13 + k * 3 + y - open }], 0.5, 0x6b21a8, 0.7);
        // occhi che guardano altrove: non è colpa sua
        p.eye(h.hx - 3, h.hy - 1, 2, 0xc084fc, { pupil: true, lid: 0.35 });
        p.eye(h.hx + 4, h.hy - 1, 2, 0xc084fc, { pupil: true, lid: 0.35 });
        scanlines(p, 0, 0, 52, 80, 0xc084fc, f);
    },
};

const notturno: CreatureSpec = {
    key: 'boss-notturno', w: 52, h: 80,
    draw(p, t, f) {
        const h = regret(p, t, 0x2e2240, 0x6a5a7a, 0xc084fc, { headY: 20, slump: 4 });
        const y = sin(t) * 1.4;
        // un braccio penzola, l'altro regge la boccetta
        arm(p, [{ x: 18, y: 32 + y }, { x: 14, y: 46 + y }, { x: 13 + sin(t) * 1.5, y: 58 + y }], 4.4, 0x2e2240, 0x6a5a7a);
        arm(p, [{ x: 38, y: 32 + y }, { x: 44, y: 40 + y }, { x: 40, y: 34 + y }], 4.4, 0x2e2240, 0x6a5a7a);
        p.shape(p.rrect(37, 24 + y, 6, 10, 2), 0x84cc16, { smooth: 0, hatch: 0, shadow: 0.3 });
        p.glow(40, 28 + y, 2.2, 0x84cc16, 0.6);
        // occhi a mezz'asta
        p.eyes(h.hx, h.hy - 1, 8, 2, 0xc084fc, { lid: 0.85 });
        p.line(p.curve({ x: h.hx - 4, y: h.hy + 5 }, { x: h.hx, y: h.hy + 3.5 }, { x: h.hx + 4, y: h.hy + 5 }, 5), 0.7);
        scanlines(p, 0, 0, 52, 80, 0xc084fc, f);
    },
};

const modello: CreatureSpec = {
    key: 'boss-modello', w: 54, h: 82,
    draw(p, t, f) {
        const y = sin(t) * 1.2;
        aura(p, 27, 42, 32, 0xc084fc, 0.2);
        // cornice del quadro, storta
        p.shape([{ x: 2, y: 4 + y }, { x: 52, y: 2 + y }, { x: 53, y: 80 + y }, { x: 3, y: 78 + y }], 0x7a5a2a, { smooth: 0, hatch: 0.4, rim: 0xf5d79e });
        p.shape([{ x: 8, y: 9 + y }, { x: 46, y: 8 + y }, { x: 47, y: 73 + y }, { x: 9, y: 72 + y }], 0x3a3150, { smooth: 0, hatch: 0.3, shadow: 0.3 });
        // pedro in posa, disegnato a matita
        const tilt = sin(t) * 1;
        for (const x of [22, 32]) p.limb([{ x, y: 58 + y }, { x: x + tilt, y: 70 + y }], 4, 3.4, 0x9aa8b2, { hatch: 0.3 });
        p.shape(p.rrect(17, 34 + y, 20, 26, 5), 0xa9b8c2, { smooth: 0, hatch: 0.45 });
        p.limb([{ x: 36, y: 38 + y }, { x: 42, y: 28 + y }, { x: 41 + tilt, y: 18 + y }], 4, 3.4, 0x9aa8b2, { hatch: 0.3 });
        p.limb([{ x: 18, y: 38 + y }, { x: 13, y: 48 + y }], 4, 3.4, 0x9aa8b2, { hatch: 0.3 });
        p.shape(p.rrect(18, 16 + y, 19, 17, 4), 0xb7c4cd, { smooth: 0, hatch: 0.4 });
        // occhi già storti: uno alto, uno basso, prima del glitch
        p.eye(23, 22 + y, 2.2, 0xc084fc, { socket: true });
        p.eye(31, 26 + y, 2.2, 0xc084fc, { socket: true });
        // tratti di matita sbagliati, corretti male
        p.line([{ x: 15, y: 30 + y }, { x: 40, y: 14 + y }], 0.6, 0xe9d5ff, 0.6);
        p.line([{ x: 12, y: 62 + y }, { x: 40, y: 66 + y }], 0.6, 0xe9d5ff, 0.5);
        label(p, 'L.', 39, 70 + y, 5, '#c084fc', true);
        scanlines(p, 0, 0, 54, 82, 0xc084fc, f, 0.12);
    },
};

const revisore: CreatureSpec = {
    key: 'boss-revisore', w: 52, h: 80,
    draw(p, t, f) {
        const y = sin(t) * 1.4;
        const h = regret(p, t, 0x24304f, 0x6a7a8a, 0x60a5fa);
        // cancellature rosse sul torace: log riscritti
        for (let k = 0; k < 4; k++) p.line([{ x: 18, y: 32 + k * 6 + y }, { x: 36, y: 30 + k * 6 + y + (k % 2) * 2 }], 1.2, 0xef4444, 0.85);
        // braccio che impugna la penna rossa, che scrive a scatti
        const w = f % 2 ? 2 : -2;
        arm(p, [{ x: 37, y: 30 + y }, { x: 46, y: 36 + y }, { x: 44 + w, y: 26 + y }], 4.2, 0x24304f, 0x6a7a8a);
        p.limb([{ x: 44 + w, y: 28 + y }, { x: 50 + w, y: 14 + y }], 2.4, 1.2, 0xb91c1c, { hatch: 0 });
        p.glow(50 + w, 13 + y, 1.2, 0xef4444, 0.9);
        arm(p, [{ x: 16, y: 30 + y }, { x: 9, y: 42 + y }, { x: 12, y: 50 + y }], 4.2, 0x24304f, 0x6a7a8a);
        glasses(p, h.hx, h.hy - 1, 9, 3.2, 0x60a5fa);
        p.line([{ x: h.hx - 4, y: h.hy + 5 }, { x: h.hx + 4, y: h.hy + 5 }], 0.8);
        scanlines(p, 0, 0, 52, 80, 0x60a5fa, f);
    },
};

/** un tre gigante con volume e un occhio annidato nella pancia */
function three(p: Painter, x: number, y: number, s: number, t: number, ph: number): void {
    const top = p.curve({ x: x, y: y + 6 * s }, { x: x + 12 * s, y: y - 6 * s }, { x: x + 20 * s, y: y + 8 * s }, 10);
    const mid = p.curve({ x: x + 20 * s, y: y + 8 * s }, { x: x + 18 * s, y: y + 18 * s }, { x: x + 8 * s, y: y + 20 * s }, 8).slice(1);
    const bot = p.curve({ x: x + 8 * s, y: y + 20 * s }, { x: x + 26 * s, y: y + 26 * s }, { x: x + 14 * s, y: y + 38 * s }, 10).slice(1);
    const end = p.curve({ x: x + 14 * s, y: y + 38 * s }, { x: x + 6 * s, y: y + 42 * s }, { x: x - 1 * s, y: y + 34 * s }, 6).slice(1);
    p.limb([...top, ...mid, ...bot, ...end], 6 * s, 5 * s, 0x9a7a12, { hatch: 0.4, rim: 0xfff1a8 });
    p.eye(x + 14 * s, y + 8 * s + sin(t, 1, ph) * s, 2.6 * s, 0xfacc15, { angry: 0.4, pupil: true });
    p.eye(x + 16 * s, y + 28 * s - sin(t, 1, ph) * s, 2.2 * s, 0xfacc15, { angry: -0.3, pupil: true });
}

const trentatre: CreatureSpec = {
    key: 'boss-trentatre', w: 88, h: 84,
    draw(p, t, f) {
        aura(p, 44, 42, 46, 0xfacc15, 0.2);
        three(p, 6, 14 + sin(t) * 1.5, 1.45, t, 0);
        three(p, 46, 14 - sin(t) * 1.5, 1.45, t, 0.5);
        // scariche tra i due tre
        const zig = (x0: number): Pt[] => Array.from({ length: 7 }, (_, k) => ({ x: x0 + (k % 2 ? 3 : -3) * (f % 2 ? 1 : -1), y: 14 + k * 9 }));
        p.lit(p.limbPts(zig(44), 1.4, 1.4), 0xfef08a, 0.85);
        p.glow(44, 40, 3, 0xfacc15, 0.4);
    },
};

const garante: CreatureSpec = {
    key: 'boss-garante', w: 54, h: 84,
    draw(p, t, f) {
        const y = sin(t) * 1.4;
        // mano destra alzata nel giuramento
        arm(p, [{ x: 38, y: 30 + y }, { x: 46, y: 22 + y }, { x: 46, y: 8 + y }], 4.4, 0x24304f, 0x6a7a8a);
        for (let k = 0; k < 4; k++) p.limb([{ x: 44 + k * 1.3, y: 6 + y }, { x: 43.5 + k * 1.6, y: 1 + y }], 1.3, 1, 0x6a7a8a, { hatch: 0 });
        const h = regret(p, t, 0x24304f, 0x6a7a8a, 0x60a5fa);
        // il cuore nascosto sotto la mano, che si vede lo stesso
        p.glow(25, 40 + y, 3 + (f % 2), 0xf87171, 0.6);
        arm(p, [{ x: 16, y: 30 + y }, { x: 14, y: 38 + y }, { x: 24, y: 40 + y }], 4.4, 0x24304f, 0x6a7a8a);
        // occhi fermi, bocca cucita
        p.eyes(h.hx, h.hy - 1.5, 8, 2.2, 0x60a5fa);
        p.line([{ x: h.hx - 5, y: h.hy + 5 }, { x: h.hx + 5, y: h.hy + 5 }], 0.9);
        for (let k = -2; k <= 2; k++) p.line([{ x: h.hx + k * 2, y: h.hy + 3.5 }, { x: h.hx + k * 2 + 0.6, y: h.hy + 6.5 }], 0.6, 0xe5e7eb);
        scanlines(p, 0, 0, 54, 84, 0x60a5fa, f);
    },
};

/** il maranza: tuta acetata, cappellino dritto, catena, borsello */
function maranza(p: Painter, t: number, big: boolean): void {
    const W = big ? 72 : 56;
    const cx = W / 2;
    const k = big ? 1.3 : 1;
    const y = sin(t) * 1.2;
    const H = big ? 92 : 80;
    frontLegs(p, cx, H - 20 * k + y, H - 1, 10 * k, 5.4 * k, 0x111827, t, true);
    // tuta nera con le bande, gonfia se è il maranzone
    const tw = (big ? 17 : 11) * k;
    p.shape([{ x: cx - tw, y: 26 * k + y }, { x: cx + tw, y: 26 * k + y }, { x: cx + tw * 0.9, y: H - 20 * k + y }, { x: cx - tw * 0.9, y: H - 20 * k + y }], 0x1f2937, {
        hatch: 0.5, rim: 0x9ca3af,
        detail: (pp) => {
            for (const dx of [-tw + 3, tw - 4]) pp.flat(pp.rect(cx + dx, 26 * k + y, 1.4, H), 0xf8fafc, 0.85, 0);
            pp.line(pp.curve({ x: cx - 6 * k, y: 28 * k + y }, { x: cx, y: 40 * k + y }, { x: cx + 6 * k, y: 28 * k + y }, 8), 1.4 * k, 0xfacc15);
        },
    });
    // borsello a tracolla
    p.line([{ x: cx - tw + 2, y: 28 * k + y }, { x: cx + tw - 4, y: 48 * k + y }], 1.6, 0x0b0b0b);
    p.shape(p.rrect(cx + tw - 10, 44 * k + y, 11, 8, 2), 0x2b2b2b, { smooth: 0, hatch: 0.2, rim: 0x6b7280 });
    p.flat(p.rect(cx + tw - 7, 46 * k + y, 5, 1.4), 0xfacc15, 0.9, 0);
    // braccia, a pugni chiusi se è gonfio
    const sw = sin(t) * (big ? 3 : 1.5);
    arm(p, [{ x: cx - tw + 1, y: 30 * k + y }, { x: cx - tw - 5 * k, y: 42 * k + y }, { x: cx - tw - 3 * k + sw, y: 54 * k + y }], 5 * k, 0x1f2937, 0x7a6a50);
    arm(p, [{ x: cx + tw - 1, y: 30 * k + y }, { x: cx + tw + 5 * k, y: 42 * k + y }, { x: cx + tw + 3 * k - sw, y: 54 * k + y }], 5 * k, 0x1f2937, 0x7a6a50);
    // testa col cappellino dal frontino dritto
    gecoHead(p, cx, 16 * k + y, 10 * k, 0x7a6a50, { mouth: big ? 'frown' : 'flat' });
    p.shape([{ x: cx - 10 * k, y: 10 * k + y }, { x: cx - 8 * k, y: 3 * k + y }, { x: cx + 8 * k, y: 3 * k + y }, { x: cx + 10 * k, y: 10 * k + y }], 0x0f172a, { smooth: 1, hatch: 0.2 });
    p.shape(p.rect(cx - 16 * k, 9 * k + y, 18 * k, 2.6 * k), 0x0f172a, { smooth: 0, hatch: 0 });
    p.flat(p.rect(cx - 2 * k, 5 * k + y, 4 * k, 2 * k), 0xfacc15, 0.9, 0);
    if (big) {
        p.eyes(cx, 15 * k + y, 9 * k, 2.4 * k, 0xb91c1c, { angry: 0.6 });
        // vapore dalle narici
        const u = t % 1;
        p.flat(p.ellipse(cx - 6 * k - u * 6, 20 * k + y, 1.5 + u * 2, 1.2 + u), 0xe5e7eb, 0.5 * (1 - u));
    } else {
        p.eyes(cx, 15 + y, 9, 2.1, 0xdc2626, { lid: 0.55 });
    }
}

const maranzaArt: CreatureSpec = { key: 'boss-maranza', w: 56, h: 80, draw: (p, t) => maranza(p, t, false) };
const maranzone: CreatureSpec = { key: 'boss-maranzone', w: 72, h: 92, draw: (p, t) => maranza(p, t, true) };

const istruttore: CreatureSpec = {
    key: 'boss-istruttore', w: 54, h: 84,
    draw(p, t) {
        const y = sin(t) * 1.2;
        frontLegs(p, 27, 62 + y, 83, 9, 5, 0x374151, t, true);
        // camicia azzurrina col taschino e le penne
        p.shape([{ x: 15, y: 28 + y }, { x: 39, y: 28 + y }, { x: 40, y: 63 + y }, { x: 14, y: 63 + y }], 0xa9c4dc, {
            hatch: 0.5,
            detail: (pp) => {
                pp.flat(pp.rect(29, 34 + y, 7, 6), 0x8aa7c2, 1, 0);
                pp.flat(pp.rect(30, 31 + y, 1.2, 5), 0xb91c1c, 1, 0);
                pp.flat(pp.rect(32.5, 31 + y, 1.2, 5), 0x1e3a8a, 1, 0);
                pp.line([{ x: 27, y: 28 + y }, { x: 27, y: 63 + y }], 0.6, INK, 0.5);
                pp.flat([{ x: 24, y: 28 + y }, { x: 30, y: 28 + y }, { x: 27, y: 34 + y }], 0xf8fafc, 1, 0);
            },
        });
        // paletta dello stop, alzata a scatti
        const up = sin(t) * 3;
        arm(p, [{ x: 16, y: 31 + y }, { x: 8, y: 34 + y }, { x: 6, y: 24 + y - up }], 4.4, 0xa9c4dc, 0x8a7a5a);
        p.limb([{ x: 6, y: 26 + y - up }, { x: 6, y: 12 + y - up }], 1.6, 1.6, 0x52525b, { hatch: 0 });
        p.shape(p.ellipse(6, 7 + y - up, 6.5, 6.5), 0xdc2626, { smooth: 0, hatch: 0.25, rim: 0xfecaca });
        p.flat(p.ellipse(6, 7 + y - up, 4.6, 4.6), 0xf8fafc, 1, 0);
        label(p, 'STOP', 2.4, 8.4 + y - up, 2.6, '#b91c1c');
        // il registro degli esami
        arm(p, [{ x: 38, y: 31 + y }, { x: 44, y: 42 + y }, { x: 40, y: 46 + y }], 4.4, 0xa9c4dc, 0x8a7a5a);
        p.shape(p.rect(36, 40 + y, 12, 15), 0x1e3a8a, { smooth: 0, hatch: 0.2 });
        label(p, '✗', 39, 51 + y, 8, '#ef4444', true);
        // sguardo da esame fallito, baffi
        gecoHead(p, 27, 16 + y, 11, 0x8a7a5a, { mouth: 'frown' });
        p.shape(p.ellipse(27, 9 + y, 10, 4), 0x9ca3af, { hatch: 0.2 });
        p.shape([{ x: 21, y: 20 + y }, { x: 27, y: 19 + y }, { x: 33, y: 20 + y }, { x: 31, y: 22 + y }, { x: 23, y: 22 + y }], 0x4b5563, { hatch: 0 });
        p.eyes(27, 15 + y, 9, 2.2, 0xf59e0b, { angry: 0.5 });
    },
};

const annascrivania: CreatureSpec = {
    key: 'boss-annascrivania', w: 96, h: 70,
    draw(p, t, f) {
        const y = sin(t) * 0.8;
        // busto dietro la scrivania
        p.shape([{ x: 34, y: 28 + y }, { x: 62, y: 28 + y }, { x: 64, y: 46 }, { x: 32, y: 46 }], 0x7a3e5a, { hatch: 0.5, rim: 0xf5b5d0 });
        // timbro alzato che cala a colpi
        const hit = f === 2 ? 10 : f === 3 ? 6 : 0;
        arm(p, [{ x: 61, y: 31 + y }, { x: 70, y: 26 + y + hit * 0.4 }, { x: 72, y: 14 + y + hit }], 5, 0x7a3e5a, 0x9a8a6a);
        p.shape(p.rrect(68, 3 + y + hit, 8, 9, 2), 0x6b4a2a, { smooth: 0, hatch: 0.3 });
        p.shape(p.rect(66, 11 + y + hit, 12, 4), 0x1e3a8a, { smooth: 0, hatch: 0 });
        arm(p, [{ x: 35, y: 31 + y }, { x: 28, y: 38 + y }, { x: 33, y: 44 }], 5, 0x7a3e5a, 0x9a8a6a);
        // capelli cotonati e testa
        p.shape(p.ellipse(48, 13 + y, 16, 12), 0x9a6a3a, { hatch: 0.45, rim: 0xf0c890 });
        gecoHead(p, 48, 20 + y, 10, 0x9a8a6a, { mouth: 'frown' });
        // occhiali a catenella
        glasses(p, 48, 19 + y, 9, 3, 0xfcd34d);
        p.line(p.curve({ x: 41, y: 20 + y }, { x: 40, y: 30 + y }, { x: 44, y: 34 + y }, 5), 0.6, 0xfacc15);
        p.line(p.curve({ x: 55, y: 20 + y }, { x: 57, y: 30 + y }, { x: 52, y: 34 + y }, 5), 0.6, 0xfacc15);
        // scrivania davanti, con le pratiche accatastate
        p.shape(p.rect(4, 44, 88, 10), 0x6b3f1e, { smooth: 0, hatch: 0.45, rim: 0xe0a870 });
        p.shape(p.rect(8, 54, 80, 15), 0x4e2c12, {
            smooth: 0, hatch: 0.55,
            detail: (pp) => {
                pp.flat(pp.rect(16, 57, 20, 9), 0x3a200c, 1, 0);
                pp.flat(pp.rect(60, 57, 20, 9), 0x3a200c, 1, 0);
                pp.flat(pp.ellipse(26, 61.5, 1.4, 1.4), 0xd4a017, 1, 0);
                pp.flat(pp.ellipse(70, 61.5, 1.4, 1.4), 0xd4a017, 1, 0);
            },
        });
        for (let k = 0; k < 5; k++) p.shape(p.rect(8 + (k % 2), 39 - k * 3.4, 18, 3.4), k % 2 ? 0xf1ede2 : 0xe8e2d0, { smooth: 0, hatch: 0, shadow: 0.25, line: 0.6 });
        for (let k = 0; k < 3; k++) p.shape(p.rect(78 - (k % 2), 39 - k * 3.4, 14, 3.4), 0xf1ede2, { smooth: 0, hatch: 0, shadow: 0.25, line: 0.6 });
        p.eyes(48, 19 + y, 9, 1.7, 0xf59e0b, { angry: 0.35 });
        // l'inchiostro del timbro schizza
        if (f === 2) p.glow(72, 44, 2.4, 0x3b82f6, 0.8);
    },
};

const walter: CreatureSpec = {
    key: 'boss-walter', w: 96, h: 110, pad: 8,
    draw(p, t, f) {
        const y = sin(t) * 1.4;
        aura(p, 48, 56, 56, 0x16a34a, 0.15);
        frontLegs(p, 48, 88 + y, 109, 22, 10, 0x1f2937, t, true);
        // corpaccione nella polo verde gigante
        p.shape(p.ellipse(48, 66 + y, 33, 28), 0x1f7a3e, {
            hatch: 0.55, rim: 0x9ef0b8,
            detail: (pp) => {
                pp.flat([{ x: 38, y: 40 + y }, { x: 48, y: 52 + y }, { x: 58, y: 40 + y }, { x: 54, y: 38 + y }, { x: 48, y: 44 + y }, { x: 42, y: 38 + y }], 0x166534, 1, 0);
                for (const yy of [50, 56]) pp.flat(pp.ellipse(48, yy + y, 1.4, 1.4), 0xe5e7eb, 1, 0);
                pp.flat(pp.rect(28, 54 + y, 6, 5), 0xe5e7eb, 0.9, 0);
            },
        });
        // braccia enormi; a destra il mazzo di chiavi della polo come flagello
        const sw = sin(t) * 6;
        arm(p, [{ x: 18, y: 50 + y }, { x: 6, y: 66 + y }, { x: 10, y: 82 + y }], 11, 0x1f7a3e, 0x8a9a6a);
        arm(p, [{ x: 78, y: 50 + y }, { x: 90, y: 60 + y }, { x: 88, y: 46 + y }], 11, 0x1f7a3e, 0x8a9a6a);
        const chain = p.curve({ x: 88, y: 44 + y }, { x: 98 + sw, y: 30 + y }, { x: 84 + sw * 1.4, y: 18 + y }, 8);
        p.line(chain, 1.2, 0xd1d5db);
        const end = chain[chain.length - 1];
        p.shape(p.ellipse(end.x, end.y, 4, 4), 0xd4a017, { smooth: 0, hatch: 0, rim: 0xfff1a8 });
        p.shape(p.rrect(end.x - 3, end.y + 2, 6, 9, 2), 0x111827, { smooth: 0, hatch: 0 });
        p.flat(p.ellipse(end.x, end.y + 6, 1.6, 1.6), 0x3b82f6, 1, 0);
        p.shape([{ x: end.x + 3, y: end.y - 1 }, { x: end.x + 12, y: end.y - 3 }, { x: end.x + 12, y: end.y }, { x: end.x + 3, y: end.y + 1 }], 0xc9ccd1, { smooth: 0, hatch: 0 });
        // testa con gli occhi ora spalancati: non dorme più
        gecoHead(p, 48, 24 + y, 18, 0x8a9a6a, { mouth: 'none' });
        p.shape(p.ellipse(48, 12 + y, 15, 6), 0x52525b, { hatch: 0.2 });
        p.eyes(48, 21 + y, 16, 5, 0x22c55e, { pupil: true });
        p.teeth(36, 30 + y, 24, 6, 10, 0xf5f5f4, 0.8 + (f % 2) * 0.2);
        // occhiaie di trent'anni di esami
        for (const x of [40, 56]) p.line(p.curve({ x: x - 5, y: 27 + y }, { x, y: 29 + y }, { x: x + 5, y: 27 + y }, 5), 0.8, 0x3f3f46);
    },
};

export const BOSS_ART_VOID: CreatureSpec[] = [
    dei, flauto, settequaranta, custode, delegato, notturno, modello, revisore, trentatre, garante,
    maranzaArt, maranzone, istruttore, annascrivania, walter,
];
