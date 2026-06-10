import Phaser from 'phaser';
import { TILE, ZONE_HEX } from '../config';
import type { ZoneColor } from '../types';

/** rng deterministico: le skyline devono essere uguali a ogni avvio */
function mulberry32(seed: number): () => number {
    let a = seed;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function glow(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number, color: number, alpha = 0.35): void {
    for (let i = 3; i >= 1; i--) {
        g.fillStyle(color, (alpha / 3) * (4 - i));
        g.fillCircle(x, y, (r * i) / 1.6);
    }
    g.fillStyle(color, 1);
    g.fillCircle(x, y, r / 2);
}

const BODY = 0x131b15;
const BODY_EDGE = 0x24382a;

/* ---------- geco (vista laterale, rivolto a destra) ---------- */

interface GeckoPose {
    legSwing: number;
    tailLift: number;
    stretch: number;
    crouch: number;
}

function drawGecko(g: Phaser.GameObjects.Graphics, pose: GeckoPose): void {
    const { legSwing, tailLift, stretch, crouch } = pose;
    const cy = 26 - crouch;

    // coda a cerchi decrescenti che si arriccia
    for (let i = 0; i < 9; i++) {
        const t = i / 8;
        const x = 18 - t * 15 * stretch;
        const y = cy + 1 - Math.sin(t * 2.4) * (4 + tailLift * 4) * t;
        g.fillStyle(BODY, 1);
        g.fillCircle(x, y, 4.5 * (1 - t * 0.82));
    }

    // zampe dietro il corpo
    g.lineStyle(3, BODY, 1);
    const legs: [number, number][] = [
        [22, legSwing],
        [36, -legSwing],
    ];
    for (const [lx, swing] of legs) {
        const fx = lx + swing * 5;
        g.beginPath();
        g.moveTo(lx, cy + 3);
        g.lineTo(fx, 35);
        g.strokePath();
        // polpastrelli: il marchio di fabbrica
        g.fillStyle(BODY_EDGE, 1);
        g.fillCircle(fx - 2.5, 35.5, 1.6);
        g.fillCircle(fx, 34.5, 1.6);
        g.fillCircle(fx + 2.5, 35.5, 1.6);
    }

    // corpo
    g.fillStyle(BODY, 1);
    g.fillEllipse(29, cy, 26 * stretch, 15 - crouch);
    g.lineStyle(1, BODY_EDGE, 0.8);
    g.strokeEllipse(29, cy, 26 * stretch, 15 - crouch);

    // testa e muso
    g.fillStyle(BODY, 1);
    g.fillCircle(44, cy - 5, 8.5);
    g.fillEllipse(50, cy - 3, 11, 8);
    // narice
    g.fillStyle(BODY_EDGE, 1);
    g.fillCircle(54, cy - 4, 0.8);

    // occhio verde acido, enorme: è pur sempre un geco
    glow(g, 45, cy - 7.5, 4.2, 0x4ade80, 0.5);
    g.fillStyle(0x052e16, 1);
    g.fillCircle(45.8, cy - 7.5, 1.3);
}

function geckoTexture(scene: Phaser.Scene, key: string, pose: GeckoPose): void {
    const g = scene.add.graphics();
    drawGecko(g, pose);
    g.generateTexture(key, 64, 40);
    g.destroy();
}

/* ---------- nemici ---------- */

function zanzarone(scene: Phaser.Scene): void {
    const g = scene.add.graphics();
    // ali
    g.fillStyle(0xffffff, 0.14);
    g.fillEllipse(14, 8, 18, 7);
    g.fillEllipse(24, 7, 18, 7);
    // corpo a segmenti
    g.fillStyle(BODY, 1);
    g.fillEllipse(14, 16, 14, 9);
    g.fillCircle(23, 14, 5.5);
    // proboscide minacciosa
    g.lineStyle(2, BODY_EDGE, 1);
    g.beginPath();
    g.moveTo(27, 15);
    g.lineTo(36, 19);
    g.strokePath();
    // zampette
    g.lineStyle(1.5, BODY, 1);
    for (const [x1, y2] of [[10, 26], [15, 27], [20, 26]] as const) {
        g.beginPath();
        g.moveTo(x1, 19);
        g.lineTo(x1 + 2, y2);
        g.strokePath();
    }
    glow(g, 24, 12, 2.6, 0xf87171, 0.5);
    g.generateTexture('enemy-zanzarone', 40, 30);
    g.destroy();
}

function cultista(scene: Phaser.Scene): void {
    const g = scene.add.graphics();
    // tonaca a campana
    g.fillStyle(0x150d1d, 1);
    g.beginPath();
    g.moveTo(16, 4);
    g.lineTo(29, 42);
    g.lineTo(3, 42);
    g.closePath();
    g.fillPath();
    g.lineStyle(1, 0x3b2752, 0.9);
    g.strokePath();
    // cappuccio
    g.fillStyle(0x150d1d, 1);
    g.fillCircle(16, 8, 7.5);
    // vuoto del volto
    g.fillStyle(0x05030a, 1);
    g.fillEllipse(17, 9, 8, 9);
    glow(g, 17, 9, 2.2, 0xc084fc, 0.55);
    g.generateTexture('enemy-cultista', 32, 44);
    g.destroy();
}

function botto(scene: Phaser.Scene): void {
    const g = scene.add.graphics();
    g.fillStyle(0x1c130a, 1);
    g.fillCircle(16, 16, 13);
    g.lineStyle(1.5, 0x4a2f15, 1);
    g.strokeCircle(16, 16, 13);
    // crepe: è un bot rotto
    g.lineStyle(1, 0x4a2f15, 0.9);
    g.beginPath();
    g.moveTo(8, 10); g.lineTo(13, 15); g.lineTo(10, 20);
    g.moveTo(24, 8); g.lineTo(20, 13);
    g.strokePath();
    // gamba a molla
    g.lineStyle(2, 0x4a2f15, 1);
    g.beginPath();
    g.moveTo(13, 28); g.lineTo(16, 31); g.lineTo(19, 28);
    g.strokePath();
    glow(g, 16, 14, 3.4, 0xfb923c, 0.5);
    g.generateTexture('enemy-botto', 32, 34);
    g.destroy();
}

function drone(scene: Phaser.Scene): void {
    const g = scene.add.graphics();
    // rotore
    g.lineStyle(2, 0x274057, 1);
    g.beginPath();
    g.moveTo(4, 5); g.lineTo(32, 5);
    g.strokePath();
    g.lineStyle(2, 0x16222e, 1);
    g.beginPath();
    g.moveTo(18, 5); g.lineTo(18, 9);
    g.strokePath();
    // scocca pulita e ordinata, alla pedro
    g.fillStyle(0x101820, 1);
    g.fillRoundedRect(6, 9, 24, 14, 4);
    g.lineStyle(1, 0x274057, 1);
    g.strokeRoundedRect(6, 9, 24, 14, 4);
    glow(g, 18, 16, 3, 0x60a5fa, 0.55);
    g.generateTexture('enemy-drone', 36, 26);
    g.destroy();
}

function hater(scene: Phaser.Scene): void {
    const g = scene.add.graphics();
    // gobbo, incollato al telefono
    g.fillStyle(0x190d0d, 1);
    g.fillEllipse(18, 26, 24, 26);
    g.fillCircle(24, 10, 8);
    g.lineStyle(1, 0x3d1d1d, 0.9);
    g.strokeEllipse(18, 26, 24, 26);
    // braccio col telefono
    g.lineStyle(3, 0x190d0d, 1);
    g.beginPath();
    g.moveTo(26, 20); g.lineTo(33, 24);
    g.strokePath();
    // lo schermo che illumina il rancore
    g.fillStyle(0xf87171, 0.9);
    g.fillRect(31, 20, 6, 9);
    glow(g, 34, 24, 2, 0xf87171, 0.4);
    // sopracciglia arrabbiate
    g.lineStyle(2, 0x3d1d1d, 1);
    g.beginPath();
    g.moveTo(20, 7); g.lineTo(25, 9);
    g.strokePath();
    g.generateTexture('enemy-hater', 40, 42);
    g.destroy();
}

/* ---------- boss: l'algoritmo ---------- */

function boss(scene: Phaser.Scene): void {
    const g = scene.add.graphics();
    const cx = 60, cy = 60;
    // rombo esterno
    g.fillStyle(0x16080a, 1);
    g.beginPath();
    g.moveTo(cx, 8); g.lineTo(112, cy); g.lineTo(cx, 112); g.lineTo(8, cy);
    g.closePath();
    g.fillPath();
    g.lineStyle(2, 0x52181d, 1);
    g.strokePath();
    // circuiti
    g.lineStyle(1, 0x52181d, 0.8);
    for (const [x1, y1, x2, y2] of [
        [cx, 20, cx, 44], [30, cy, 48, cy], [90, cy, 72, cy],
        [40, 40, 50, 50], [80, 40, 70, 50], [40, 80, 50, 70], [80, 80, 70, 70],
    ] as const) {
        g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.strokePath();
        g.fillStyle(0x52181d, 1);
        g.fillCircle(x2, y2, 1.5);
    }
    // l'occhio rosso che decide cosa ascolti
    glow(g, cx, cy, 12, 0xf87171, 0.6);
    g.fillStyle(0x000000, 1);
    g.fillCircle(cx, cy, 3.5);
    g.generateTexture('boss-core', 120, 120);
    g.destroy();

    const c = scene.add.graphics();
    c.fillStyle(0x16080a, 1);
    c.fillRect(2, 2, 20, 20);
    c.lineStyle(1.5, 0x7a2228, 1);
    c.strokeRect(2, 2, 20, 20);
    glow(c, 12, 12, 3, 0xf87171, 0.5);
    c.generateTexture('boss-cube', 24, 24);
    c.destroy();
}

/* ---------- npc ---------- */

function riba(scene: Phaser.Scene): void {
    const g = scene.add.graphics();
    // sagoma t-rex tozza
    g.fillStyle(0x1c1208, 1);
    g.fillEllipse(20, 30, 22, 20);
    g.fillCircle(30, 14, 9);
    g.fillEllipse(36, 16, 12, 8);
    // coda
    g.beginPath();
    g.moveTo(10, 28); g.lineTo(0, 20); g.lineTo(12, 22);
    g.closePath();
    g.fillPath();
    // braccino inutile
    g.lineStyle(2.5, 0x1c1208, 1);
    g.beginPath();
    g.moveTo(28, 24); g.lineTo(33, 27);
    g.strokePath();
    // gambe
    g.lineStyle(4, 0x1c1208, 1);
    g.beginPath();
    g.moveTo(16, 38); g.lineTo(15, 46);
    g.moveTo(25, 38); g.lineTo(26, 46);
    g.strokePath();
    // dentini
    g.fillStyle(0x4a3214, 1);
    g.fillTriangle(38, 19, 40, 19, 39, 22);
    g.fillTriangle(34, 19, 36, 19, 35, 22);
    glow(g, 31, 12, 3, 0xfb923c, 0.55);
    g.generateTexture('npc-riba', 46, 48);
    g.destroy();
}

function pedro(scene: Phaser.Scene): void {
    const g = scene.add.graphics();
    // antenna
    g.lineStyle(2, 0x16222e, 1);
    g.beginPath();
    g.moveTo(14, 8); g.lineTo(14, 2);
    g.strokePath();
    glow(g, 14, 2, 2, 0x60a5fa, 0.5);
    // tutto perfettamente dritto, ovviamente
    g.fillStyle(0x0e161e, 1);
    g.fillRect(4, 8, 20, 30);
    g.lineStyle(1, 0x2a4a68, 1);
    g.strokeRect(4, 8, 20, 30);
    g.strokeRect(7, 12, 14, 9);
    // occhi composti
    g.fillStyle(0x60a5fa, 0.9);
    g.fillRect(9, 15, 3, 3);
    g.fillRect(16, 15, 3, 3);
    // gambe
    g.fillStyle(0x0e161e, 1);
    g.fillRect(7, 38, 5, 8);
    g.fillRect(16, 38, 5, 8);
    g.generateTexture('npc-pedro', 28, 48);
    g.destroy();
}

function elder(scene: Phaser.Scene): void {
    const g = scene.add.graphics();
    drawGecko(g, { legSwing: 0, tailLift: 0.2, stretch: 0.95, crouch: 1 });
    // bastoncino da geco anziano
    g.lineStyle(2, 0x4a4438, 1);
    g.beginPath();
    g.moveTo(56, 12); g.lineTo(56, 36);
    g.strokePath();
    g.generateTexture('npc-elder', 64, 40);
    g.destroy();
}

/* ---------- oggetti ---------- */

function objects(scene: Phaser.Scene): void {
    // microfono checkpoint
    const m = scene.add.graphics();
    m.lineStyle(2.5, 0x222228, 1);
    m.beginPath();
    m.moveTo(12, 18); m.lineTo(12, 50);
    m.strokePath();
    m.lineStyle(2, 0x222228, 1);
    m.beginPath();
    m.moveTo(4, 56); m.lineTo(12, 48); m.lineTo(20, 56);
    m.strokePath();
    m.fillStyle(0x18181c, 1);
    m.fillCircle(12, 11, 8);
    m.lineStyle(1, 0x3a3a42, 1);
    m.strokeCircle(12, 11, 8);
    m.beginPath();
    m.moveTo(6, 8); m.lineTo(18, 8);
    m.moveTo(5, 11); m.lineTo(19, 11);
    m.moveTo(6, 14); m.lineTo(18, 14);
    m.strokePath();
    m.generateTexture('mic', 24, 58);
    m.destroy();

    // barra: nota musicale gialla
    const n = scene.add.graphics();
    glow(n, 5, 12, 3.2, 0xfacc15, 0.45);
    n.lineStyle(1.5, 0xfacc15, 0.95);
    n.beginPath();
    n.moveTo(7, 12); n.lineTo(7, 2); n.lineTo(11, 4);
    n.strokePath();
    n.generateTexture('barra', 14, 16);
    n.destroy();

    // pickup abilità: cerchio con onda dentro
    const w = scene.add.graphics();
    glow(w, 16, 16, 6, 0x4ade80, 0.35);
    w.lineStyle(2, 0x4ade80, 0.9);
    w.strokeCircle(16, 16, 11);
    w.beginPath();
    w.moveTo(8, 16);
    for (let x = 0; x <= 16; x++) {
        w.lineTo(8 + x, 16 - Math.sin((x / 16) * Math.PI * 2) * 4);
    }
    w.strokePath();
    w.generateTexture('wave-pickup', 32, 32);
    w.destroy();

    // stele della lore
    const l = scene.add.graphics();
    l.fillStyle(0x140e1c, 1);
    l.fillRoundedRect(4, 4, 20, 30, { tl: 9, tr: 9, bl: 2, br: 2 });
    l.lineStyle(1, 0x3b2752, 1);
    l.strokeRoundedRect(4, 4, 20, 30, { tl: 9, tr: 9, bl: 2, br: 2 });
    l.lineStyle(1, 0xc084fc, 0.5);
    l.beginPath();
    l.moveTo(9, 12); l.lineTo(19, 12);
    l.moveTo(9, 17); l.lineTo(19, 17);
    l.moveTo(9, 22); l.lineTo(15, 22);
    l.strokePath();
    l.generateTexture('lore-tablet', 28, 38);
    l.destroy();

    // proiettile del verso
    const p = scene.add.graphics();
    glow(p, 8, 8, 4, 0x4ade80, 0.5);
    p.generateTexture('proj-verso', 16, 16);
    p.destroy();

    const d = scene.add.graphics();
    glow(d, 6, 6, 3, 0x60a5fa, 0.5);
    d.generateTexture('proj-drone', 12, 12);
    d.destroy();

    // fantasmino delle barre perse
    const gh = scene.add.graphics();
    gh.fillStyle(0x4ade80, 0.25);
    gh.fillEllipse(14, 16, 20, 14);
    gh.fillCircle(20, 9, 6);
    glow(gh, 21, 8, 2.5, 0x4ade80, 0.5);
    gh.generateTexture('drop-ghost', 30, 26);
    gh.destroy();
}

/* ---------- particelle ---------- */

function particles(scene: Phaser.Scene): void {
    const dot = scene.add.graphics();
    for (let i = 4; i >= 1; i--) {
        dot.fillStyle(0xffffff, 0.25 * ((5 - i) / 4));
        dot.fillCircle(8, 8, i * 2);
    }
    dot.generateTexture('p-dot', 16, 16);
    dot.destroy();

    const spark = scene.add.graphics();
    spark.fillStyle(0xffffff, 1);
    spark.fillTriangle(0, 3, 12, 0, 12, 6);
    spark.generateTexture('p-spark', 12, 6);
    spark.destroy();
}

/* ---------- mondo: tile e spine ---------- */

function tiles(scene: Phaser.Scene): void {
    for (const [zone, hex] of Object.entries(ZONE_HEX)) {
        const g = scene.add.graphics();
        g.fillStyle(0x0b0d0f, 1);
        g.fillRect(0, 0, TILE, TILE);
        // texture minerale appena percettibile
        const rnd = mulberry32(hex);
        g.fillStyle(0x15181c, 1);
        for (let i = 0; i < 5; i++) {
            g.fillRect(rnd() * 26, 4 + rnd() * 24, 2 + rnd() * 4, 1.5);
        }
        // bordo superiore acceso: il muschio acido della zona
        g.fillStyle(hex, 0.55);
        g.fillRect(0, 0, TILE, 2);
        g.fillStyle(hex, 0.14);
        g.fillRect(0, 2, TILE, 3);
        g.generateTexture(`tile-${zone}`, TILE, TILE);
        g.destroy();
    }

    const s = scene.add.graphics();
    s.fillStyle(0x1a0c0e, 1);
    for (let i = 0; i < 4; i++) {
        const x = i * 8;
        s.fillTriangle(x, TILE, x + 4, TILE - 14, x + 8, TILE);
    }
    s.fillStyle(0xf87171, 0.5);
    for (let i = 0; i < 4; i++) {
        const x = i * 8;
        s.fillTriangle(x + 2.5, TILE - 8, x + 4, TILE - 14, x + 5.5, TILE - 8);
    }
    s.generateTexture('spikes', TILE, TILE);
    s.destroy();
}

/* ---------- sfondi parallasse ---------- */

type Motif = 'rooftops' | 'arches' | 'swamp' | 'towers' | 'stage';

const ZONE_MOTIF: Record<ZoneColor, Motif> = {
    green: 'rooftops',
    purple: 'arches',
    orange: 'swamp',
    blue: 'towers',
    red: 'stage',
    yellow: 'rooftops',
};

function mixHex(base: number, tint: number, t: number): string {
    const c1 = Phaser.Display.Color.IntegerToColor(base);
    const c2 = Phaser.Display.Color.IntegerToColor(tint);
    const r = Math.round(c1.red + (c2.red - c1.red) * t);
    const gg = Math.round(c1.green + (c2.green - c1.green) * t);
    const b = Math.round(c1.blue + (c2.blue - c1.blue) * t);
    return `rgb(${r},${gg},${b})`;
}

function makeSky(scene: Phaser.Scene, zone: ZoneColor): void {
    const key = `sky-${zone}`;
    if (scene.textures.exists(key)) return;
    const tex = scene.textures.createCanvas(key, 16, 512)!;
    const ctx = tex.getContext();
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#030305');
    grad.addColorStop(0.55, mixHex(0x07080a, ZONE_HEX[zone], 0.08));
    grad.addColorStop(1, mixHex(0x050506, ZONE_HEX[zone], 0.04));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 512);
    tex.refresh();
}

function drawMotif(ctx: CanvasRenderingContext2D, motif: Motif, rnd: () => number, w: number, h: number, depth: number): void {
    const ground = h;
    if (motif === 'rooftops') {
        let x = 0;
        while (x < w) {
            const bw = 50 + rnd() * 90;
            const bh = 60 + rnd() * (110 + depth * 60);
            ctx.fillRect(x, ground - bh, bw, bh);
            // tetto a falde del centro storico
            ctx.beginPath();
            ctx.moveTo(x - 4, ground - bh);
            ctx.lineTo(x + bw / 2, ground - bh - 18 - rnd() * 14);
            ctx.lineTo(x + bw + 4, ground - bh);
            ctx.fill();
            if (rnd() > 0.6) ctx.fillRect(x + bw * 0.3, ground - bh - 34, 8, 26);
            x += bw + 6 + rnd() * 30;
        }
    } else if (motif === 'arches') {
        let x = 0;
        const ch = 100 + depth * 80;
        while (x < w) {
            const cw = 26 + rnd() * 10;
            ctx.fillRect(x, ground - ch, cw, ch);
            x += cw + 50 + rnd() * 40;
        }
        ctx.fillRect(0, ground - ch - 26, w, 30);
    } else if (motif === 'swamp') {
        let x = 0;
        while (x < w) {
            const th = 70 + rnd() * (90 + depth * 70);
            const lean = (rnd() - 0.5) * 50;
            ctx.beginPath();
            ctx.moveTo(x, ground);
            ctx.quadraticCurveTo(x + lean * 0.4, ground - th * 0.6, x + lean, ground - th);
            ctx.lineWidth = 10 - depth * 3;
            ctx.strokeStyle = ctx.fillStyle as string;
            ctx.stroke();
            // rami storti
            ctx.beginPath();
            ctx.moveTo(x + lean * 0.7, ground - th * 0.75);
            ctx.lineTo(x + lean * 0.7 + (rnd() - 0.5) * 60, ground - th * 0.75 - rnd() * 36);
            ctx.lineWidth = 4;
            ctx.stroke();
            x += 60 + rnd() * 70;
        }
    } else if (motif === 'towers') {
        let x = 10;
        while (x < w) {
            const bw = 34 + rnd() * 30;
            const bh = 110 + rnd() * (130 + depth * 80);
            ctx.fillRect(x, ground - bh, bw, bh);
            ctx.fillRect(x + bw / 2 - 1.5, ground - bh - 24, 3, 24);
            x += bw + 36;
        }
    } else {
        // stage: tralicci e casse
        ctx.fillRect(0, ground - 14, w, 14);
        let x = 20;
        while (x < w) {
            ctx.fillRect(x, ground - 180 - depth * 60, 8, 180 + depth * 60);
            ctx.fillRect(x - 14, ground - 180 - depth * 60, 36, 8);
            // pila di casse
            const stack = 1 + Math.floor(rnd() * 3);
            for (let s = 0; s < stack; s++) {
                ctx.fillRect(x + 30 + rnd() * 20, ground - 34 * (s + 1), 40, 30);
            }
            x += 160 + rnd() * 80;
        }
    }
}

function makeSkylines(scene: Phaser.Scene, zone: ZoneColor): void {
    const motif = ZONE_MOTIF[zone];
    for (let layer = 0; layer < 3; layer++) {
        const key = `bg-${zone}-${layer}`;
        if (scene.textures.exists(key)) continue;
        const w = 1024;
        const h = 400;
        const tex = scene.textures.createCanvas(key, w, h)!;
        const ctx = tex.getContext();
        const t = 0.05 + layer * 0.035;
        ctx.fillStyle = mixHex(0x07080a, ZONE_HEX[zone], t);
        ctx.strokeStyle = ctx.fillStyle;
        const rnd = mulberry32(zone.length * 1000 + layer * 77 + motif.length);
        drawMotif(ctx, motif, rnd, w, h, layer);
        tex.refresh();
    }
}

/* ---------- entry point ---------- */

export function generateBaseTextures(scene: Phaser.Scene): void {
    geckoTexture(scene, 'geco-idle', { legSwing: 0, tailLift: 0.3, stretch: 1, crouch: 0 });
    geckoTexture(scene, 'geco-run1', { legSwing: 1, tailLift: 0.1, stretch: 1.05, crouch: 1 });
    geckoTexture(scene, 'geco-run2', { legSwing: -1, tailLift: 0.5, stretch: 1.05, crouch: 1 });
    geckoTexture(scene, 'geco-air', { legSwing: 0.4, tailLift: 0.9, stretch: 1.1, crouch: 2 });
    geckoTexture(scene, 'geco-dash', { legSwing: 0.2, tailLift: 0, stretch: 1.3, crouch: 3 });

    zanzarone(scene);
    cultista(scene);
    botto(scene);
    drone(scene);
    hater(scene);
    boss(scene);
    riba(scene);
    pedro(scene);
    elder(scene);
    objects(scene);
    particles(scene);
    tiles(scene);
}

export function generateZoneTextures(scene: Phaser.Scene, zone: ZoneColor): void {
    makeSky(scene, zone);
    makeSkylines(scene, zone);
}
