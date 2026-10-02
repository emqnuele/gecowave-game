import Phaser from 'phaser';
import type { FolkLook } from '../../content/folk';

/* i passanti: sagome scure come il resto del cast, riconoscibili dal profilo
   (cappelli, borse, bastoni) e dagli occhi accesi del colore della regione */

const INK = 0x101118;
const EDGE = 0x2a2c3b;
export const FOLK_W = 40;
export const FOLK_H = 52;

export function folkKey(look: FolkLook, eye: number): string {
    return `folk-${look}-${eye.toString(16)}`;
}

function eyes(g: Phaser.GameObjects.Graphics, x: number, y: number, color: number, gap = 6, r = 1.6): void {
    for (const dx of [-gap / 2, gap / 2]) {
        g.fillStyle(color, 0.25);
        g.fillCircle(x + dx, y, r * 2.4);
        g.fillStyle(color, 1);
        g.fillCircle(x + dx, y, r);
    }
}

/** corpo da geco: busto a goccia, testa tonda, coda, gambe. h = altezza da terra */
function geco(g: Phaser.GameObjects.Graphics, cx: number, h: number, scale = 1, hunch = 0): { headX: number; headY: number } {
    const ground = FOLK_H - 1;
    const bodyH = 22 * scale * h;
    const by = ground - 8 * scale - bodyH / 2;
    g.fillStyle(INK, 1);
    // coda che tocca terra dietro
    g.lineStyle(4 * scale, INK, 1);
    g.beginPath();
    g.moveTo(cx - 4 * scale, by + bodyH * 0.35);
    g.lineTo(cx - 12 * scale, ground - 3);
    g.lineTo(cx - 17 * scale, ground - 1);
    g.strokePath();
    g.fillEllipse(cx + hunch, by, 16 * scale, bodyH);
    // gambe
    g.lineStyle(3.5 * scale, INK, 1);
    g.beginPath();
    g.moveTo(cx - 3 * scale, by + bodyH / 2 - 2);
    g.lineTo(cx - 4 * scale, ground);
    g.moveTo(cx + 4 * scale, by + bodyH / 2 - 2);
    g.lineTo(cx + 5 * scale, ground);
    g.strokePath();
    const headX = cx + 2 * scale + hunch * 1.6;
    const headY = by - bodyH / 2 - 5 * scale;
    g.fillCircle(headX, headY, 7.5 * scale);
    // muso da geco
    g.fillEllipse(headX + 6 * scale, headY + 2 * scale, 9 * scale, 6 * scale);
    // filo di luce sul bordo: si legge anche sul fondo nero
    g.lineStyle(1, EDGE, 1);
    g.strokeEllipse(cx + hunch, by, 16 * scale, bodyH);
    g.strokeCircle(headX, headY, 7.5 * scale);
    return { headX, headY };
}

export function ensureFolkTexture(scene: Phaser.Scene, look: FolkLook, eye: number): string {
    const key = folkKey(look, eye);
    if (scene.textures.exists(key)) return key;
    const g = scene.add.graphics();
    const cx = FOLK_W / 2 - 2;
    switch (look) {
        case 'pendolare': {
            const { headX, headY } = geco(g, cx, 1.05);
            // cappello e valigetta
            g.fillStyle(INK, 1);
            g.fillRect(headX - 8, headY - 9, 16, 3);
            g.fillRect(headX - 5, headY - 15, 10, 7);
            g.fillRect(cx + 8, FOLK_H - 18, 10, 8);
            g.lineStyle(1, EDGE, 1);
            g.strokeRect(cx + 8, FOLK_H - 18, 10, 8);
            eyes(g, headX + 1, headY, eye);
            break;
        }
        case 'vecchio': {
            const { headX, headY } = geco(g, cx, 0.92, 1, 4);
            // bastone
            g.lineStyle(2.5, INK, 1);
            g.lineBetween(cx + 14, FOLK_H - 1, cx + 12, FOLK_H - 26);
            g.lineBetween(cx + 12, FOLK_H - 26, cx + 8, FOLK_H - 27);
            // sopracciglia folte
            g.fillStyle(0x3a3d4f, 1);
            g.fillRect(headX - 5, headY - 4, 10, 2);
            eyes(g, headX + 1, headY, eye, 6, 1.3);
            break;
        }
        case 'bimbo': {
            const { headX, headY } = geco(g, cx, 0.55, 0.78);
            // ciuffo
            g.fillStyle(INK, 1);
            g.fillTriangle(headX - 2, headY - 5, headX + 3, headY - 13, headX + 4, headY - 4);
            eyes(g, headX + 1, headY, eye, 5, 1.8);
            break;
        }
        case 'operaio': {
            const { headX, headY } = geco(g, cx, 1.05, 1.08);
            // caschetto
            g.fillStyle(0x2a2410, 1);
            g.fillEllipse(headX, headY - 5, 18, 9);
            g.fillRect(headX - 10, headY - 3, 20, 2);
            g.fillStyle(eye, 0.6);
            g.fillCircle(headX, headY - 8, 1.5);
            eyes(g, headX + 1, headY + 1, eye);
            break;
        }
        case 'studente': {
            const { headX, headY } = geco(g, cx, 0.95);
            // zaino
            g.fillStyle(INK, 1);
            g.fillRoundedRect(cx - 14, FOLK_H - 32, 10, 14, 3);
            g.lineStyle(1, EDGE, 1);
            g.strokeRoundedRect(cx - 14, FOLK_H - 32, 10, 14, 3);
            // occhiali
            g.lineStyle(1.2, 0x5b6075, 1);
            g.strokeCircle(headX - 2, headY, 3);
            g.strokeCircle(headX + 4, headY, 3);
            eyes(g, headX + 1, headY, eye, 6, 1.2);
            break;
        }
        case 'cuoco': {
            const { headX, headY } = geco(g, cx, 1.05, 1.05);
            // toque
            g.fillStyle(0x23242e, 1);
            g.fillRect(headX - 6, headY - 14, 12, 8);
            g.fillCircle(headX - 4, headY - 15, 4);
            g.fillCircle(headX + 4, headY - 15, 4);
            g.fillCircle(headX, headY - 17, 4);
            eyes(g, headX + 1, headY, eye);
            break;
        }
        case 'nonna': {
            const { headX, headY } = geco(g, cx, 0.85, 1.05, 3);
            // scialle e crocchia
            g.fillStyle(0x1d1a26, 1);
            g.fillTriangle(cx - 9, FOLK_H - 30, cx + 11, FOLK_H - 30, cx + 1, FOLK_H - 16);
            g.fillStyle(INK, 1);
            g.fillCircle(headX - 6, headY - 6, 4);
            eyes(g, headX + 1, headY, eye, 6, 1.3);
            break;
        }
        case 'raver': {
            const { headX, headY } = geco(g, cx, 1.1);
            // capelli a punte e bastoncino luminoso
            g.fillStyle(INK, 1);
            for (let i = 0; i < 4; i++) g.fillTriangle(headX - 6 + i * 4, headY - 5, headX - 3 + i * 4, headY - 15 - (i % 2) * 3, headX + i * 4, headY - 5);
            g.lineStyle(3, eye, 0.9);
            g.lineBetween(cx + 12, FOLK_H - 30, cx + 16, FOLK_H - 42);
            eyes(g, headX + 1, headY, eye, 6, 1.9);
            break;
        }
        case 'pescatore': {
            const { headX, headY } = geco(g, cx, 1);
            // cappello a tesa larga e canna
            g.fillStyle(INK, 1);
            g.fillEllipse(headX, headY - 6, 22, 5);
            g.fillEllipse(headX, headY - 9, 11, 7);
            g.lineStyle(1.5, INK, 1);
            g.lineBetween(cx + 6, FOLK_H - 24, cx + 18, FOLK_H - 50);
            g.lineStyle(0.8, 0x5b6075, 1);
            g.lineBetween(cx + 18, FOLK_H - 50, cx + 19, FOLK_H - 30);
            eyes(g, headX + 1, headY, eye);
            break;
        }
        case 'ombra': {
            // niente corpo pieno: una nebbia a forma di geco
            for (let i = 0; i < 6; i++) {
                g.fillStyle(INK, 0.35);
                g.fillEllipse(cx + Math.sin(i) * 2, FOLK_H - 18 - i * 4, 18 - i, 14);
            }
            g.fillStyle(INK, 0.85);
            g.fillCircle(cx + 2, FOLK_H - 38, 7);
            eyes(g, cx + 3, FOLK_H - 38, eye, 6, 1.4);
            break;
        }
        case 'tecnico': {
            const { headX, headY } = geco(g, cx, 1);
            // cuffie col microfono
            g.lineStyle(2, 0x2b2d3d, 1);
            g.beginPath();
            g.arc(headX, headY, 9, Math.PI * 1.05, Math.PI * 1.95);
            g.strokePath();
            g.fillStyle(INK, 1);
            g.fillCircle(headX - 8, headY, 3);
            g.lineStyle(1.2, 0x5b6075, 1);
            g.lineBetween(headX - 8, headY + 2, headX + 2, headY + 7);
            eyes(g, headX + 1, headY, eye);
            break;
        }
        case 'maranza': {
            const { headX, headY } = geco(g, cx, 1.05);
            // cappellino all'indietro e catena
            g.fillStyle(INK, 1);
            g.fillEllipse(headX - 1, headY - 6, 16, 8);
            g.fillRect(headX - 13, headY - 6, 7, 3);
            g.lineStyle(1.5, 0xfacc15, 0.8);
            g.beginPath();
            g.arc(cx + 1, FOLK_H - 32, 6, 0.2, Math.PI - 0.2);
            g.strokePath();
            eyes(g, headX + 1, headY, eye);
            break;
        }
        case 'chierico': {
            // tunica col cappuccio e una candela
            g.fillStyle(INK, 1);
            g.fillTriangle(cx - 12, FOLK_H - 1, cx + 12, FOLK_H - 1, cx, FOLK_H - 38);
            g.fillCircle(cx + 1, FOLK_H - 38, 9);
            g.lineStyle(1, EDGE, 1);
            g.strokeTriangle(cx - 12, FOLK_H - 1, cx + 12, FOLK_H - 1, cx, FOLK_H - 38);
            g.fillStyle(0x24263a, 1);
            g.fillRect(cx + 10, FOLK_H - 24, 3, 8);
            g.fillStyle(0xfde68a, 0.9);
            g.fillCircle(cx + 11.5, FOLK_H - 27, 2);
            eyes(g, cx + 2, FOLK_H - 37, eye, 6, 1.3);
            break;
        }
        case 'ubriaco': {
            const { headX, headY } = geco(g, cx, 1, 1, -3);
            // bottiglia in mano
            g.fillStyle(0x1f3a2a, 1);
            g.fillRect(cx + 9, FOLK_H - 28, 5, 10);
            g.fillRect(cx + 10, FOLK_H - 32, 3, 4);
            eyes(g, headX + 1, headY + 1, eye, 6, 1.2);
            break;
        }
    }
    g.generateTexture(key, FOLK_W, FOLK_H);
    g.destroy();
    return key;
}
