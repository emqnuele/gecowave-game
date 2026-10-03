import Phaser from 'phaser';
import { crossHatch, glowSpot, hatch, hex, inkLine, inkShape, mulberry32, wobble, type Pt } from './ink';

/* texture delle abilità: sagome a inchiostro come il resto del gioco,
   disegnate una volta per scena su canvas. la luce va su gemelle ~glow
   sommate in add, così il buio non le spegne. */

export const FX = {
    dashGhost: 'fx-dash-ghost',
    ringJump: 'fx-ring-jump',
    wave1: 'fx-wave-1',
    wave2: 'fx-wave-2',
    waveTap: 'fx-wave-tap',
    chargeRing: 'fx-charge-ring',
    chalkCircle: 'fx-chalk-circle',
    glyphs: ['fx-glyph-int', 'fx-glyph-sum', 'fx-glyph-del', 'fx-glyph-lim', 'fx-glyph-sqrt', 'fx-glyph-pi'],
    qed: 'fx-qed',
    chalkX: 'fx-chalk-x',
    shield: 'fx-shield-crt',
    shieldPerfect: 'fx-shield-perfect',
    rec: 'fx-rec',
    refund: 'fx-refund',
    bottle: 'fx-bottle',
    shard: 'fx-shard',
    puddle: 'fx-puddle',
    mirrorCrack: 'fx-mirror-crack',
    mirrorShard: 'fx-mirror-shard',
    regenDrip: 'fx-regen-drip',
    slash: 'fx-slash',
    slashBig: 'fx-slash-big',
} as const;

const INK = 0x0b0c10;

function cv(w: number, h: number): { el: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
    const el = document.createElement('canvas');
    el.width = Math.ceil(w);
    el.height = Math.ceil(h);
    const ctx = el.getContext('2d')!;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    return { el, ctx };
}

function add(scene: Phaser.Scene, key: string, el: HTMLCanvasElement): void {
    if (!scene.textures.exists(key)) scene.textures.addCanvas(key, el);
}

function addGlow(scene: Phaser.Scene, key: string, el: HTMLCanvasElement): void {
    add(scene, `${key}~glow`, el);
}

/* sagoma del geco che corre, bianca per tingerla a runtime */
function dashGhost(): HTMLCanvasElement {
    const { el, ctx } = cv(72, 48);
    const rnd = mulberry32(4101);
    glowSpot(ctx, 36, 26, 30, 0x4ade80, 0.25);
    const body: Pt[] = [
        { x: 14, y: 30 }, { x: 18, y: 18 }, { x: 34, y: 14 },
        { x: 52, y: 18 }, { x: 58, y: 28 }, { x: 50, y: 36 }, { x: 28, y: 38 },
    ];
    inkShape(ctx, body, rnd, hex(0xe8e6df), hex(INK), 2.5, 1);
    ctx.save();
    ctx.clip();
    hatch(ctx, 10, 12, 52, 28, rnd, hex(0x0b0c10, 0.35), -0.7, 5);
    ctx.restore();
    inkLine(ctx, [{ x: 52, y: 24 }, { x: 66, y: 18 }], rnd, hex(INK), 3, 0.8);
    inkLine(ctx, [{ x: 20, y: 38 }, { x: 14, y: 44 }], rnd, hex(INK), 2.5, 0.6);
    inkLine(ctx, [{ x: 44, y: 38 }, { x: 44, y: 45 }], rnd, hex(INK), 2.5, 0.6);
    return el;
}

/* anello di pennello aperto, si allarga sotto i piedi */
function ringJump(): HTMLCanvasElement {
    const { el, ctx } = cv(64, 24);
    const rnd = mulberry32(4102);
    ctx.strokeStyle = hex(INK);
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.ellipse(32, 12, 24, 7, 0, 0.3, Math.PI * 2 - 0.3);
    ctx.stroke();
    ctx.strokeStyle = hex(0x4ade80);
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    const pts: Pt[] = [];
    for (let a = 0.3; a < Math.PI * 2 - 0.3; a += 0.25) pts.push({ x: 32 + Math.cos(a) * 24, y: 12 + Math.sin(a) * 7 });
    const w = wobble(pts, rnd, 1.2);
    ctx.moveTo(w[0]!.x, w[0]!.y);
    for (const p of w) ctx.lineTo(p.x, p.y);
    ctx.stroke();
    return el;
}

/* archi risonanti: uno, tre, tre grandi con alone */
function wave(kind: 0 | 1 | 2): HTMLCanvasElement {
    const big = kind === 2;
    const { el, ctx } = cv(big ? 84 : kind === 1 ? 60 : 40, big ? 72 : kind === 1 ? 48 : 36);
    const rnd = mulberry32(4110 + kind);
    const cx = (big ? 84 : kind === 1 ? 60 : 40) / 2;
    const cy = (big ? 72 : kind === 1 ? 48 : 36) / 2;
    const arcs = kind === 0 ? [10] : kind === 1 ? [8, 15, 22] : [12, 22, 32];
    for (const r of arcs) {
        ctx.strokeStyle = hex(INK);
        ctx.lineWidth = (big ? 7 : 5.5) + 3;
        ctx.beginPath();
        ctx.arc(cx, cy, r, -1.1, 1.1);
        ctx.stroke();
    }
    for (const r of arcs) {
        ctx.strokeStyle = hex(0x4ade80);
        ctx.lineWidth = big ? 6 : 4;
        ctx.beginPath();
        const pts: Pt[] = [];
        for (let a = -1.1; a <= 1.1; a += 0.12) pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
        const w = wobble(pts, rnd, 0.9);
        ctx.moveTo(w[0]!.x, w[0]!.y);
        for (const p of w) ctx.lineTo(p.x, p.y);
        ctx.stroke();
    }
    if (big) {
        ctx.save();
        ctx.clip();
        crossHatch(ctx, 0, 0, 84, 72, rnd, hex(0x0b0c10, 0.4), 0.5);
        ctx.restore();
    }
    return el;
}

function waveGlow(kind: 0 | 1 | 2): HTMLCanvasElement {
    const big = kind === 2;
    const { el, ctx } = cv(big ? 84 : kind === 1 ? 60 : 40, big ? 72 : kind === 1 ? 48 : 36);
    glowSpot(ctx, (big ? 84 : kind === 1 ? 60 : 40) / 2, (big ? 72 : kind === 1 ? 48 : 36) / 2, big ? 40 : 26, 0x4ade80, 0.5);
    return el;
}

/* anello di carica che si stringe sul geco */
function chargeRing(): HTMLCanvasElement {
    const { el, ctx } = cv(72, 72);
    const rnd = mulberry32(4120);
    ctx.strokeStyle = hex(INK);
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(36, 36, 28, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = hex(0x4ade80);
    ctx.lineWidth = 3;
    ctx.beginPath();
    const pts: Pt[] = [];
    for (let a = 0; a <= Math.PI * 2 + 0.1; a += 0.2) pts.push({ x: 36 + Math.cos(a) * 28, y: 36 + Math.sin(a) * 28 });
    const w = wobble(pts, rnd, 1.4);
    ctx.moveTo(w[0]!.x, w[0]!.y);
    for (const p of w) ctx.lineTo(p.x, p.y);
    ctx.stroke();
    return el;
}

/* cerchio di gesso intero, per la fine dell'ipotesi */
function chalkCircle(): HTMLCanvasElement {
    const { el, ctx } = cv(296, 296);
    const rnd = mulberry32(4130);
    ctx.strokeStyle = hex(0xdbeafe, 0.9);
    ctx.lineWidth = 4;
    ctx.beginPath();
    const pts: Pt[] = [];
    for (let a = 0; a <= Math.PI * 2 + 0.1; a += 0.12) pts.push({ x: 148 + Math.cos(a) * 140, y: 148 + Math.sin(a) * 140 });
    const w = wobble(pts, rnd, 2.2);
    ctx.moveTo(w[0]!.x, w[0]!.y);
    for (const p of w) ctx.lineTo(p.x, p.y);
    ctx.stroke();
    for (let i = 0; i < 40; i++) {
        ctx.fillStyle = hex(0xdbeafe, 0.25 + rnd() * 0.3);
        const a = rnd() * Math.PI * 2;
        ctx.fillRect(148 + Math.cos(a) * (140 + (rnd() - 0.5) * 8), 148 + Math.sin(a) * (140 + (rnd() - 0.5) * 8), 1.6, 1.6);
    }
    return el;
}

const GLYPH_TEXTS = ['∫', '∑', '∂', 'lim', '√', 'π'];

function glyph(i: number): HTMLCanvasElement {
    const { el, ctx } = cv(44, 44);
    ctx.font = '26px "Permanent Marker", cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 6;
    ctx.strokeStyle = hex(INK);
    ctx.strokeText(GLYPH_TEXTS[i]!, 22, 24);
    ctx.fillStyle = hex(0xdbeafe);
    ctx.fillText(GLYPH_TEXTS[i]!, 22, 24);
    return el;
}

function glyphGlow(): HTMLCanvasElement {
    const { el, ctx } = cv(44, 44);
    glowSpot(ctx, 22, 22, 20, 0x60a5fa, 0.4);
    return el;
}

function markerText(text: string, w: number, h: number, size: number, fill: number | string, seed: number): HTMLCanvasElement {
    const { el, ctx } = cv(w, h);
    void seed;
    ctx.font = `${size}px "Permanent Marker", cursive`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(4, size / 5);
    ctx.strokeStyle = hex(INK);
    ctx.strokeText(text, w / 2, h / 2 + 1);
    ctx.fillStyle = typeof fill === 'number' ? hex(fill) : fill;
    ctx.fillText(text, w / 2, h / 2 + 1);
    return el;
}

function chalkX(): HTMLCanvasElement {
    const { el, ctx } = cv(32, 32);
    const rnd = mulberry32(4140);
    inkLine(ctx, [{ x: 7, y: 7 }, { x: 25, y: 25 }], rnd, hex(0xdbeafe), 4, 1);
    inkLine(ctx, [{ x: 25, y: 7 }, { x: 7, y: 25 }], rnd, hex(0xdbeafe), 4, 1);
    return el;
}

/* bolla da monitor crt: cerchio con scanline dentro */
function shield(perfect: boolean): HTMLCanvasElement {
    const { el, ctx } = cv(128, 128);
    const rnd = mulberry32(perfect ? 4151 : 4150);
    const edge = perfect ? 0xffffff : 0x22d3ee;
    ctx.fillStyle = hex(0x22d3ee, 0.08);
    ctx.beginPath();
    ctx.arc(64, 64, 54, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.arc(64, 64, 54, 0, Math.PI * 2);
    ctx.clip();
    ctx.strokeStyle = hex(0x22d3ee, 0.28);
    ctx.lineWidth = 1.5;
    for (let y = 14; y < 114; y += 6) {
        ctx.beginPath();
        ctx.moveTo(12, y + (rnd() - 0.5));
        ctx.lineTo(116, y + (rnd() - 0.5));
        ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = hex(INK);
    ctx.lineWidth = (perfect ? 6 : 4) + 2.5;
    ctx.beginPath();
    ctx.arc(64, 64, 56, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = hex(edge);
    ctx.lineWidth = perfect ? 6 : 3.5;
    ctx.beginPath();
    const pts: Pt[] = [];
    for (let a = 0; a <= Math.PI * 2 + 0.1; a += 0.15) pts.push({ x: 64 + Math.cos(a) * 56, y: 64 + Math.sin(a) * 56 });
    const w = wobble(pts, rnd, 1.2);
    ctx.moveTo(w[0]!.x, w[0]!.y);
    for (const p of w) ctx.lineTo(p.x, p.y);
    ctx.stroke();
    return el;
}

function shieldGlow(): HTMLCanvasElement {
    const { el, ctx } = cv(128, 128);
    glowSpot(ctx, 64, 64, 60, 0x22d3ee, 0.35);
    return el;
}

/* bottiglia pet con etichetta premium */
function bottle(): HTMLCanvasElement {
    const { el, ctx } = cv(28, 46);
    const rnd = mulberry32(4160);
    glowSpot(ctx, 14, 24, 16, 0x22d3ee, 0.25);
    inkShape(ctx, [{ x: 9, y: 4 }, { x: 19, y: 4 }, { x: 19, y: 8 }, { x: 9, y: 8 }], rnd, hex(0x22d3ee), hex(INK), 2, 0.3);
    const body: Pt[] = [
        { x: 9, y: 8 }, { x: 6, y: 14 }, { x: 6, y: 38 },
        { x: 10, y: 42 }, { x: 18, y: 42 }, { x: 22, y: 38 }, { x: 22, y: 14 }, { x: 19, y: 8 },
    ];
    inkShape(ctx, body, rnd, hex(0xbfe3ef, 0.85), hex(INK), 2, 0.5);
    ctx.save();
    ctx.beginPath();
    ctx.rect(7, 20, 14, 12);
    ctx.clip();
    ctx.fillStyle = hex(0xf8f4e8);
    ctx.fillRect(7, 20, 14, 12);
    ctx.fillStyle = hex(INK);
    ctx.font = '5.5px "Martian Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PREMIUM', 14, 27.5);
    ctx.restore();
    inkLine(ctx, [{ x: 10, y: 12 }, { x: 10, y: 38 }], rnd, hex(0xffffff, 0.7), 1.5, 0.2);
    return el;
}

function shard(): HTMLCanvasElement {
    const { el, ctx } = cv(18, 18);
    const rnd = mulberry32(4161);
    inkShape(ctx, [{ x: 3, y: 15 }, { x: 9, y: 2 }, { x: 15, y: 13 }], rnd, hex(0xbfe3ef), hex(INK), 1.8, 0.4);
    return el;
}

/* pozza piatta col bordo che gira di colore */
function puddle(): HTMLCanvasElement {
    const { el, ctx } = cv(220, 84);
    const rnd = mulberry32(4162);
    ctx.fillStyle = hex(0x164e3f, 0.85);
    ctx.beginPath();
    ctx.ellipse(110, 44, 100, 32, 0, 0, Math.PI * 2);
    ctx.fill();
    const cols = [0x22d3ee, 0xa855f7, 0x4ade80, 0x22d3ee];
    for (let s = 0; s < 3; s++) {
        ctx.strokeStyle = hex(cols[s % cols.length]!, 0.75 - s * 0.2);
        ctx.lineWidth = 3 - s * 0.7;
        ctx.beginPath();
        const pts: Pt[] = [];
        for (let a = 0; a <= Math.PI * 2 + 0.1; a += 0.18) pts.push({ x: 110 + Math.cos(a) * (100 - s * 4), y: 44 + Math.sin(a) * (32 - s * 2) });
        const w = wobble(pts, rnd, 1.6);
        ctx.moveTo(w[0]!.x, w[0]!.y);
        for (const p of w) ctx.lineTo(p.x, p.y);
        ctx.stroke();
    }
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(110, 44, 96, 29, 0, 0, Math.PI * 2);
    ctx.clip();
    crossHatch(ctx, 14, 15, 192, 58, rnd, hex(0x0b0c10, 0.35), 0.4);
    for (let i = 0; i < 14; i++) {
        ctx.fillStyle = hex(0x99f6e4, 0.3 + rnd() * 0.3);
        ctx.beginPath();
        ctx.arc(30 + rnd() * 160, 22 + rnd() * 44, 1.5 + rnd() * 3, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
    return el;
}

function puddleGlow(): HTMLCanvasElement {
    const { el, ctx } = cv(220, 84);
    glowSpot(ctx, 110, 44, 100, 0x22d3ee, 0.18);
    return el;
}

/* stella di crepe per la nascita del riflesso */
function mirrorCrack(): HTMLCanvasElement {
    const { el, ctx } = cv(96, 96);
    const rnd = mulberry32(4170);
    for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2 + rnd() * 0.3;
        const len = 30 + rnd() * 16;
        inkLine(ctx, [
            { x: 48 + Math.cos(a) * 6, y: 48 + Math.sin(a) * 6 },
            { x: 48 + Math.cos(a) * len * 0.6, y: 48 + Math.sin(a) * len * 0.6 },
            { x: 48 + Math.cos(a + 0.15) * len, y: 48 + Math.sin(a + 0.15) * len },
        ], rnd, hex(0xa5f3fc), 2.5, 1);
    }
    ctx.strokeStyle = hex(INK);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(48, 48, 10, 0, Math.PI * 2);
    ctx.stroke();
    return el;
}

function mirrorCrackGlow(): HTMLCanvasElement {
    const { el, ctx } = cv(96, 96);
    glowSpot(ctx, 48, 48, 44, 0x22d3ee, 0.4);
    return el;
}

function mirrorShard(): HTMLCanvasElement {
    const { el, ctx } = cv(22, 22);
    const rnd = mulberry32(4171);
    inkShape(ctx, [{ x: 4, y: 18 }, { x: 11, y: 3 }, { x: 18, y: 16 }], rnd, hex(0xa5f3fc), hex(INK), 1.8, 0.4);
    ctx.fillStyle = hex(0xffffff, 0.8);
    ctx.fillRect(9, 6, 2, 8);
    return el;
}

/* goccia verde della rigenerazione */
function regenDrip(): HTMLCanvasElement {
    const { el, ctx } = cv(18, 26);
    const rnd = mulberry32(4180);
    inkShape(ctx, [{ x: 9, y: 2 }, { x: 15, y: 14 }, { x: 13, y: 21 }, { x: 5, y: 21 }, { x: 3, y: 14 }], rnd, hex(0x4ade80), hex(INK), 2, 0.4);
    return el;
}

function regenGlow(): HTMLCanvasElement {
    const { el, ctx } = cv(18, 26);
    glowSpot(ctx, 9, 14, 10, 0x4ade80, 0.5);
    return el;
}

/* pennellata del fendente: spessa al centro, sottile alle punte */
function slash(big: boolean): HTMLCanvasElement {
    const { el, ctx } = cv(big ? 120 : 100, big ? 120 : 100);
    const rnd = mulberry32(big ? 4191 : 4190);
    const c = (big ? 120 : 100) / 2;
    const r = big ? 52 : 42;
    ctx.fillStyle = hex(INK);
    ctx.beginPath();
    const top: Pt[] = [];
    const bot: Pt[] = [];
    for (let a = -0.95; a <= 0.95; a += 0.08) {
        const wdt = 7 * Math.cos((a / 0.95) * (Math.PI / 2)) + 1.5;
        top.push({ x: c + Math.cos(a) * (r + wdt), y: c + Math.sin(a) * (r + wdt) });
        bot.push({ x: c + Math.cos(a) * (r - wdt), y: c + Math.sin(a) * (r - wdt) });
    }
    const all = [...top, ...bot.reverse()];
    const w = wobble(all, rnd, 0.8);
    ctx.moveTo(w[0]!.x, w[0]!.y);
    for (const p of w) ctx.lineTo(p.x, p.y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = hex(0xffffff, 0.9);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(c, c, r, -0.95, 0.95);
    ctx.stroke();
    if (big) {
        for (let i = 0; i < 5; i++) {
            ctx.fillStyle = hex(INK);
            ctx.beginPath();
            ctx.arc(c + Math.cos(1.1) * (r + 8 + i * 5), c + Math.sin(1.1) * (r + 8 + i * 5), 3 - i * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    return el;
}

/* cristallo del frammento: sostituisce il pentagono a linee */
function fragment(): HTMLCanvasElement {
    const { el, ctx } = cv(44, 44);
    const rnd = mulberry32(4200);
    glowSpot(ctx, 22, 24, 20, 0x4ade80, 0.35);
    const gem: Pt[] = [{ x: 22, y: 3 }, { x: 35, y: 15 }, { x: 29, y: 40 }, { x: 15, y: 40 }, { x: 9, y: 15 }];
    inkShape(ctx, gem, rnd, hex(0x14532d), hex(INK), 2.5, 0.5);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(22, 3);
    ctx.lineTo(35, 15);
    ctx.lineTo(29, 40);
    ctx.lineTo(15, 40);
    ctx.lineTo(9, 15);
    ctx.closePath();
    ctx.clip();
    crossHatch(ctx, 9, 3, 26, 37, rnd, hex(0x0b0c10, 0.5), 0.5);
    ctx.fillStyle = hex(0x86efac, 0.7);
    ctx.beginPath();
    ctx.moveTo(22, 6);
    ctx.lineTo(29, 15);
    ctx.lineTo(22, 15);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    return el;
}

function fragmentGlow(): HTMLCanvasElement {
    const { el, ctx } = cv(44, 44);
    glowSpot(ctx, 22, 24, 20, 0x4ade80, 0.5);
    return el;
}

export function ensureAbilityFx(scene: Phaser.Scene): void {
    add(scene, FX.dashGhost, dashGhost());
    add(scene, FX.ringJump, ringJump());
    add(scene, FX.waveTap, wave(0));
    addGlow(scene, FX.waveTap, waveGlow(0));
    add(scene, FX.wave1, wave(1));
    addGlow(scene, FX.wave1, waveGlow(1));
    add(scene, FX.wave2, wave(2));
    addGlow(scene, FX.wave2, waveGlow(2));
    add(scene, FX.chargeRing, chargeRing());
    add(scene, FX.chalkCircle, chalkCircle());
    FX.glyphs.forEach((k, i) => {
        add(scene, k, glyph(i));
        addGlow(scene, k, glyphGlow());
    });
    add(scene, FX.qed, markerText('q.e.d.', 130, 52, 30, 0xdbeafe, 1));
    addGlow(scene, FX.qed, glyphGlow());
    add(scene, FX.chalkX, chalkX());
    add(scene, FX.shield, shield(false));
    addGlow(scene, FX.shield, shieldGlow());
    add(scene, FX.shieldPerfect, shield(true));
    add(scene, FX.rec, markerText('● rec', 84, 28, 17, '#f87171', 2));
    add(scene, FX.refund, markerText('rimborsato 👍', 150, 30, 16, 0xfde047, 3));
    add(scene, FX.bottle, bottle());
    add(scene, FX.shard, shard());
    add(scene, FX.puddle, puddle());
    addGlow(scene, FX.puddle, puddleGlow());
    add(scene, FX.mirrorCrack, mirrorCrack());
    addGlow(scene, FX.mirrorCrack, mirrorCrackGlow());
    add(scene, FX.mirrorShard, mirrorShard());
    add(scene, FX.regenDrip, regenDrip());
    addGlow(scene, FX.regenDrip, regenGlow());
    add(scene, FX.slash, slash(false));
    add(scene, FX.slashBig, slash(true));
    // il cristallo rimpiazza il pentagono a linee
    if (scene.textures.exists('fragment')) scene.textures.remove('fragment');
    add(scene, 'fragment', fragment());
    add(scene, 'fragment~glow', fragmentGlow());
}
