import Phaser from 'phaser';
import { TILE } from '../config';
import type { BiomeDef } from '../content/biomes';
import { hex, inkLine, inkShape, mix, mulberry32, shade, type Pt } from './ink';
import { materialCanvas } from './materials';

/* i pezzi di mondo che restano a griglia: spine e muri da spaccare,
   disegnati col materiale del bioma invece del tileset condiviso */

export function spikeKey(b: BiomeDef): string {
    return `spikes-${b.id}`;
}

export function breakableKey(b: BiomeDef): string {
    return `brk-${b.id}`;
}

export function ensureBlockTextures(scene: Phaser.Scene, b: BiomeDef): void {
    if (!scene.textures.exists(spikeKey(b))) scene.textures.addCanvas(spikeKey(b), spikes(b));
    if (!scene.textures.exists(breakableKey(b))) scene.textures.addCanvas(breakableKey(b), breakable(b));
}

function spikes(b: BiomeDef): HTMLCanvasElement {
    const el = document.createElement('canvas');
    el.width = TILE;
    el.height = TILE;
    const ctx = el.getContext('2d')!;
    ctx.lineJoin = 'round';
    const rnd = mulberry32(b.id.length * 53);
    const ink = hex(b.ink);
    const body = hex(mix(b.rock, b.deep, 0.4));
    const danger = 0xf87171;
    switch (b.spikes) {
        case 'thorns': {
            // rovi: rami contorti con spine ricurve
            for (let i = 0; i < 3; i++) {
                const x = 4 + i * 12;
                const pts: Pt[] = [{ x: x - 5, y: TILE }, { x: x - 2, y: TILE - 10 }, { x: x + 3, y: TILE - 22 - rnd() * 6 }, { x: x + 5, y: TILE }];
                inkShape(ctx, pts, rnd, body, ink, 1.4, 0.3);
            }
            ctx.strokeStyle = hex(danger, 0.6);
            ctx.lineWidth = 1;
            for (let i = 0; i < 4; i++) {
                ctx.beginPath();
                ctx.moveTo(6 + i * 7, TILE - 8 - i % 2 * 5);
                ctx.lineTo(9 + i * 7, TILE - 13 - i % 2 * 5);
                ctx.stroke();
            }
            break;
        }
        case 'crystal':
        case 'glass': {
            for (let i = 0; i < 4; i++) {
                const x = 4 + i * 8;
                const hgt = 14 + rnd() * 10;
                const fill = b.spikes === 'crystal' ? hex(mix(b.rock, b.accent, 0.55)) : hex(0xb8d8d0, 0.7);
                inkShape(ctx, [{ x: x - 4, y: TILE }, { x: x + (rnd() - 0.5) * 4, y: TILE - hgt }, { x: x + 4, y: TILE }], rnd, fill, ink, 1.2, 0.2);
                ctx.fillStyle = 'rgba(255,255,255,0.45)';
                ctx.fillRect(x - 1, TILE - hgt * 0.6, 1, hgt * 0.4);
            }
            break;
        }
        case 'glitch': {
            for (let i = 0; i < 4; i++) {
                const x = 2 + i * 8;
                inkShape(ctx, [{ x, y: TILE }, { x: x + 4, y: TILE - 16 }, { x: x + 8, y: TILE }], rnd, hex(b.deep), ink, 1.2, 0.2);
                ctx.fillStyle = hex(i % 2 ? b.accent : 0xff3df0, 0.7);
                ctx.fillRect(x + rnd() * 3, TILE - 10 - rnd() * 6, 5, 2);
            }
            break;
        }
        default: {
            // punte di ferro con la ruggine sulle cime
            for (let i = 0; i < 4; i++) {
                const x = i * 8;
                inkShape(ctx, [{ x, y: TILE }, { x: x + 4, y: TILE - 15 }, { x: x + 8, y: TILE }], rnd, hex(mix(b.rock, 0x8a8a90, 0.4)), ink, 1.2, 0.2);
                ctx.fillStyle = hex(danger, 0.55);
                ctx.beginPath();
                ctx.moveTo(x + 2.6, TILE - 9);
                ctx.lineTo(x + 4, TILE - 15);
                ctx.lineTo(x + 5.4, TILE - 9);
                ctx.fill();
            }
            ctx.fillStyle = ink;
            ctx.fillRect(0, TILE - 3, TILE, 3);
        }
    }
    return el;
}

function breakable(b: BiomeDef): HTMLCanvasElement {
    const el = document.createElement('canvas');
    el.width = TILE;
    el.height = TILE;
    const ctx = el.getContext('2d')!;
    ctx.lineCap = 'round';
    const mat = materialCanvas(b);
    ctx.drawImage(mat, 40, 40, TILE * 2, TILE * 2, 0, 0, TILE, TILE);
    ctx.fillStyle = hex(b.deep, 0.35);
    ctx.fillRect(0, 0, TILE, TILE);
    const rnd = mulberry32(b.id.length * 77);
    // le crepe tradiscono il muro: si legge come rompibile senza dirlo
    inkLine(ctx, [{ x: 4, y: 6 }, { x: 12, y: 13 }, { x: 10, y: 21 }, { x: 18, y: 28 }], rnd, hex(b.ink), 1.6, 0.4);
    inkLine(ctx, [{ x: 12, y: 13 }, { x: 22, y: 10 }, { x: 28, y: 15 }], rnd, hex(b.ink), 1.3, 0.4);
    inkLine(ctx, [{ x: 13, y: 14 }, { x: 23, y: 11 }], rnd, hex(shade(b.rim, -0.1), 0.35), 0.8, 0.3);
    ctx.strokeStyle = hex(b.ink);
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, TILE - 2, TILE - 2);
    return el;
}
