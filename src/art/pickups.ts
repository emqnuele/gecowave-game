import Phaser from 'phaser';
import { glowSpot, hex, inkLine, inkShape, mulberry32, type Pt } from './ink';

/* oggetti raccoglibili nel mondo: il sacchetto dello zaino e l'amuleto,
   a inchiostro come il resto, con un alone che si vede nel buio */

export function ensurePickupTextures(scene: Phaser.Scene): void {
    const t = scene.textures;
    if (!t.exists('pickup-item')) t.addCanvas('pickup-item', bag());
    if (!t.exists('pickup-charm')) t.addCanvas('pickup-charm', charm());
}

function bag(): HTMLCanvasElement {
    const el = document.createElement('canvas');
    el.width = 48;
    el.height = 48;
    const ctx = el.getContext('2d')!;
    ctx.lineJoin = 'round';
    const rnd = mulberry32(5150);
    glowSpot(ctx, 24, 28, 22, 0xfacc15, 0.35);
    const body: Pt[] = [{ x: 12, y: 40 }, { x: 10, y: 26 }, { x: 17, y: 18 }, { x: 31, y: 18 }, { x: 38, y: 26 }, { x: 36, y: 40 }];
    inkShape(ctx, body, rnd, hex(0x8a6a3a), hex(0x0b0b10), 2.2, 0.6);
    inkShape(ctx, [{ x: 18, y: 18 }, { x: 21, y: 11 }, { x: 27, y: 11 }, { x: 30, y: 18 }], rnd, hex(0x6a4e2a), hex(0x0b0b10), 2, 0.4);
    inkLine(ctx, [{ x: 16, y: 19 }, { x: 32, y: 19 }], rnd, hex(0xfacc15), 2.4, 0.3);
    ctx.fillStyle = hex(0xfacc15, 0.9);
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('?', 24, 35);
    return el;
}

function charm(): HTMLCanvasElement {
    const el = document.createElement('canvas');
    el.width = 52;
    el.height = 52;
    const ctx = el.getContext('2d')!;
    ctx.lineJoin = 'round';
    const rnd = mulberry32(777);
    glowSpot(ctx, 26, 30, 24, 0xc084fc, 0.45);
    inkLine(ctx, [{ x: 14, y: 6 }, { x: 26, y: 18 }, { x: 38, y: 6 }], rnd, hex(0xd8d0bc), 1.6, 0.4);
    const gem: Pt[] = [{ x: 26, y: 16 }, { x: 38, y: 28 }, { x: 26, y: 46 }, { x: 14, y: 28 }];
    inkShape(ctx, gem, rnd, hex(0x7c3aed), hex(0x0b0b10), 2.4, 0.4);
    ctx.fillStyle = hex(0xe9d5ff, 0.75);
    ctx.beginPath();
    ctx.moveTo(26, 19);
    ctx.lineTo(33, 28);
    ctx.lineTo(26, 28);
    ctx.closePath();
    ctx.fill();
    return el;
}
