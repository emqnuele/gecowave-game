import Phaser from 'phaser';
import { STAGE_W, type Mood, type PropDef, type SetKind } from './types';

export const SET_H = 680;
const FLOOR_D = 70;
const SET_INK = 0x0d0b10;

export interface LightSpot {
    id: string;
    x: number;
    y: number;
    radius: number;
    color: number;
    intensity: number;
    // le lampade vere tremano, la luna no
    flicker?: boolean;
}

export interface SetPlan {
    lights: LightSpot[];
    ambient: number;
    clock?: { x: number; y: number };
    calendar?: { x: number; y: number };
    screens?: Record<string, { x: number; y: number; w: number; h: number }>;
    // le ombre degli attori cadono dalla parte opposta alla luce principale
    key: { x: number; y: number };
}

type G = Phaser.GameObjects.Graphics;
type Y = (y: number) => number;

const ROOM_AMBIENT: Partial<Record<SetKind, Partial<Record<Mood, number>>>> = {
    deserto: { notte: 0x4c5476 },
    aula: { notte: 0x403a44 },
    server: { notte: 0x323a3c },
    bottega: { notte: 0x433d36 },
};

const AMBIENT: Record<Mood, number> = { notte: 0x34303f, pomeriggio: 0x6a5e54, mattina: 0x56566a, neon: 0x2a3a48 };

function wall(g: G, y: Y, color: number, top = -SET_H): void {
    g.fillStyle(color, 1).fillRect(0, y(top), STAGE_W, -top);
    // intonaco: macchie larghe e pochi graffi, come nel resto del gioco
    g.fillStyle(0x000000, 0.08);
    for (let i = 0; i < 26; i++) g.fillEllipse((i * 97) % STAGE_W, y(-80 - ((i * 53) % 520)), 140, 40);
}

function floor(g: G, y: Y, color: number): void {
    g.fillStyle(color, 1).fillRect(0, y(0), STAGE_W, FLOOR_D);
    g.lineStyle(2, SET_INK, 0.5);
    for (let x = 0; x < STAGE_W; x += 90) g.lineBetween(x, y(0), x - 40, y(FLOOR_D));
    g.lineStyle(4, SET_INK, 1).lineBetween(0, y(0), STAGE_W, y(0));
    g.fillStyle(SET_INK, 0.6).fillRect(0, y(-14), STAGE_W, 14);
}

function windowAt(g: G, y: Y, x: number, top: number, w: number, h: number, sky: number, moon: boolean): void {
    g.fillStyle(sky, 1).fillRect(x, y(top), w, h);
    if (moon) {
        g.fillStyle(0xf2ead2, 1).fillCircle(x + w * 0.68, y(top) + h * 0.3, 18);
        g.fillStyle(sky, 1).fillCircle(x + w * 0.68 + 8, y(top) + h * 0.3 - 4, 15);
    }
    g.lineStyle(8, SET_INK, 1).strokeRect(x, y(top), w, h);
    g.lineStyle(5, SET_INK, 1).lineBetween(x + w / 2, y(top), x + w / 2, y(top) + h).lineBetween(x, y(top) + h / 2, x + w, y(top) + h / 2);
    g.fillStyle(SET_INK, 1).fillRect(x - 12, y(top) + h, w + 24, 10);
}

function desk(g: G, y: Y, x: number, w: number, papers: number): void {
    const top = -96;
    g.fillStyle(0x5a3d26, 1).fillRect(x, y(top), w, 16);
    g.fillStyle(0x3d2818, 1).fillRect(x + 10, y(top + 16), 14, -top - 16).fillRect(x + w - 24, y(top + 16), 14, -top - 16);
    g.lineStyle(3, SET_INK, 1).strokeRect(x, y(top), w, 16);
    for (let i = 0; i < papers; i++) {
        const px = x + 12 + ((i * 37) % (w - 40));
        const h = 4 + (i % 4) * 5;
        g.fillStyle(i % 3 ? 0xe2d6b8 : 0xcfc2a2, 1).fillRect(px, y(top) - h, 30, h);
        g.lineStyle(1, SET_INK, 0.6).strokeRect(px, y(top) - h, 30, h);
    }
}

function drawShelf(g: G, y: Y, x: number, w: number, rows: number, bottles: boolean): void {
    g.fillStyle(0x4a3322, 1).fillRect(x, y(-470), w, 470);
    g.lineStyle(4, SET_INK, 1).strokeRect(x, y(-470), w, 470);
    const palette = [0x5fae8a, 0x9a6bd0, 0xd08a4a, 0x4a8ad0, 0xc84a5a, 0xd8c060];
    for (let r = 0; r < rows; r++) {
        const sy = -60 - r * (420 / rows);
        g.lineStyle(5, SET_INK, 1).lineBetween(x, y(sy), x + w, y(sy));
        for (let i = 0; i < Math.floor(w / 26); i++) {
            const bx = x + 8 + i * 26;
            if (bottles) {
                const h = 30 + ((i * 7 + r * 5) % 18);
                g.fillStyle(palette[(i + r) % palette.length]!, 0.85).fillRoundedRect(bx, y(sy) - h, 16, h, 4);
                g.fillStyle(SET_INK, 1).fillRect(bx + 5, y(sy) - h - 7, 6, 8);
            } else {
                const h = 40 + ((i * 11 + r * 3) % 26);
                g.fillStyle([0x7a3a2a, 0x2a4a6a, 0x5a5a3a, 0x6a2a4a][(i + r) % 4]!, 1).fillRect(bx, y(sy) - h, 20, h);
                g.lineStyle(1, SET_INK, 0.7).strokeRect(bx, y(sy) - h, 20, h);
            }
        }
    }
}

function door(g: G, y: Y, x: number): void {
    g.fillStyle(0x3a2616, 1).fillRect(x, y(-250), 110, 250);
    g.lineStyle(6, SET_INK, 1).strokeRect(x, y(-250), 110, 250);
    g.lineStyle(2, SET_INK, 0.6).strokeRect(x + 16, y(-230), 78, 90).strokeRect(x + 16, y(-120), 78, 96);
    g.fillStyle(0xc8a050, 1).fillCircle(x + 92, y(-125), 6);
}

function hangingLamp(g: G, y: Y, x: number, at: number): void {
    g.lineStyle(3, SET_INK, 1).lineBetween(x, 0, x, y(at - 28));
    g.fillStyle(0x2a2420, 1).fillTriangle(x - 34, y(at), x + 34, y(at), x, y(at - 30));
    g.lineStyle(3, SET_INK, 1).strokeTriangle(x - 34, y(at), x + 34, y(at), x, y(at - 30));
    g.fillStyle(0xfff0c0, 1).fillCircle(x, y(at) + 4, 8);
}

function clock(g: G, y: Y, x: number, top: number): void {
    g.fillStyle(0x15121a, 1).fillRoundedRect(x - 56, y(top) - 22, 112, 44, 8);
    g.lineStyle(4, SET_INK, 1).strokeRoundedRect(x - 56, y(top) - 22, 112, 44, 8);
}

function screenBox(g: G, y: Y, x: number, top: number, w: number, h: number): void {
    g.fillStyle(0x2a2e36, 1).fillRect(x - 8, y(top) - 8, w + 16, h + 16);
    g.fillStyle(0x0a0d12, 1).fillRect(x, y(top), w, h);
    g.lineStyle(4, SET_INK, 1).strokeRect(x - 8, y(top) - 8, w + 16, h + 16);
}

// in una texture il set prende la luce vera, come gli attori
export function buildSet(scene: Phaser.Scene, kind: SetKind, mood: Mood): { key: string; plan: SetPlan } {
    const key = `film-set-${kind}-${mood}`;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    const y: Y = (v) => v + SET_H;
    const night = mood === 'notte' || mood === 'neon';
    const sky = night ? 0x16203a : 0xb8c8d8;
    let plan: SetPlan;
    switch (kind) {
        case 'studio': {
            wall(g, y, 0x6a5848);
            drawShelf(g, y, 60, 230, 4, false);
            windowAt(g, y, 820, -520, 220, 260, sky, night);
            desk(g, y, 360, 340, 14);
            door(g, y, 1080);
            clock(g, y, 600, -470);
            floor(g, y, 0x4a3828);
            // fogli per terra: lo studio di chi non ha voglia di mettere in ordine
            g.fillStyle(0xe2d6b8, 1);
            for (let i = 0; i < 9; i++) g.fillRect(300 + i * 61, y(-6 - (i % 3) * 2), 34, 6);
            plan = {
                ambient: AMBIENT[mood],
                lights: [
                    { id: 'lampada', x: 470, y: -230, radius: 520, color: 0xffc97a, intensity: 1.6, flicker: true },
                    { id: 'luna', x: 930, y: -400, radius: 420, color: 0x8fb0ff, intensity: night ? 0.8 : 1.4 },
                ],
                clock: { x: 600, y: -470 },
                calendar: { x: 740, y: -330 },
                key: { x: 470, y: -230 },
            };
            break;
        }
        case 'bottega': {
            wall(g, y, 0x5a6050);
            drawShelf(g, y, 40, 380, 5, true);
            drawShelf(g, y, 760, 380, 5, true);
            // bancone e cassa
            g.fillStyle(0x4a3020, 1).fillRect(470, y(-120), 270, 120);
            g.lineStyle(4, SET_INK, 1).strokeRect(470, y(-120), 270, 120);
            g.fillStyle(0x30343a, 1).fillRect(640, y(-170), 70, 50);
            g.lineStyle(3, SET_INK, 1).strokeRect(640, y(-170), 70, 50);
            floor(g, y, 0x3a3a34);
            plan = {
                ambient: AMBIENT[mood],
                lights: [{ id: 'lampada', x: 600, y: -380, radius: 760, color: 0xffd28a, intensity: 1.9, flicker: true }],
                clock: { x: 400, y: -360 },
                key: { x: 600, y: -380 },
            };
            clock(g, y, 400, -360);
            break;
        }
        case 'atelier': {
            wall(g, y, 0x8a7a66);
            windowAt(g, y, 120, -560, 240, 320, sky, false);
            windowAt(g, y, 840, -560, 240, 320, sky, false);
            // cavalletto
            g.lineStyle(10, 0x5a3d26, 1).lineBetween(520, y(0), 560, y(-330)).lineBetween(640, y(0), 600, y(-330)).lineBetween(580, y(0), 580, y(-300));
            g.fillStyle(0xe8dcc0, 1).fillRect(500, y(-340), 160, 190);
            g.lineStyle(5, SET_INK, 1).strokeRect(500, y(-340), 160, 190);
            // barattoli e sgabello
            for (let i = 0; i < 5; i++) g.fillStyle([0xc84a5a, 0x4a8ad0, 0xd8c060, 0x5fae8a, 0x9a6bd0][i]!, 1).fillRect(720 + i * 26, y(-28), 18, 28);
            g.fillStyle(0x5a3d26, 1).fillRect(300, y(-70), 80, 12).fillRect(310, y(-58), 10, 58).fillRect(360, y(-58), 10, 58);
            floor(g, y, 0x6a5440);
            plan = {
                ambient: AMBIENT[mood],
                lights: [
                    { id: 'finestra', x: 240, y: -420, radius: 700, color: 0xffe6b8, intensity: 1.5 },
                    { id: 'finestra2', x: 960, y: -420, radius: 600, color: 0xffe6b8, intensity: 1.1 },
                ],
                calendar: { x: 430, y: -350 },
                key: { x: 240, y: -420 },
            };
            break;
        }
        case 'deserto': {
            g.fillStyle(0x10162a, 1).fillRect(0, 0, STAGE_W, SET_H);
            g.fillStyle(0x182240, 1).fillRect(0, y(-330), STAGE_W, 330);
            g.fillStyle(0xf2ead2, 1).fillCircle(960, y(-520), 34);
            for (let i = 0; i < 60; i++) g.fillStyle(0xe8e8ff, 0.7).fillRect((i * 173) % STAGE_W, y(-640 + ((i * 89) % 300)), 2, 2);
            // dune
            g.fillStyle(0x6a5a40, 1);
            g.fillEllipse(250, y(-10), 700, 160).fillEllipse(900, y(-6), 800, 120);
            // il tetto del bus sepolto, giallo citelis, e i finestrini al pelo della sabbia
            g.fillStyle(0xc8a020, 1).fillRoundedRect(380, y(-90), 460, 80, 18);
            g.lineStyle(5, SET_INK, 1).strokeRoundedRect(380, y(-90), 460, 80, 18);
            for (let i = 0; i < 6; i++) {
                g.fillStyle(0x1a2030, 1).fillRect(400 + i * 72, y(-52), 52, 30);
                g.lineStyle(3, SET_INK, 1).strokeRect(400 + i * 72, y(-52), 52, 30);
            }
            g.fillStyle(0x7a6848, 1).fillRect(0, y(-20), STAGE_W, 20 + FLOOR_D);
            g.fillEllipse(610, y(-24), 600, 40);
            plan = {
                ambient: AMBIENT[mood],
                lights: [{ id: 'luna', x: 700, y: -560, radius: 1500, color: 0x9ab4ff, intensity: 1.7 }],
                key: { x: 960, y: -520 },
            };
            break;
        }
        case 'piazza': {
            g.fillStyle(0x121a2c, 1).fillRect(0, 0, STAGE_W, SET_H);
            // palazzo con una finestra accesa, e il muretto del geco
            g.fillStyle(0x3a3a48, 1).fillRect(140, y(-600), 560, 600);
            g.lineStyle(5, SET_INK, 1).strokeRect(140, y(-600), 560, 600);
            for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 3; c++) {
                    const lit = r === 1 && c === 2;
                    g.fillStyle(lit ? 0xffd58a : 0x1a1e2a, 1).fillRect(190 + c * 170, y(-540 + r * 150), 80, 100);
                    g.lineStyle(4, SET_INK, 1).strokeRect(190 + c * 170, y(-540 + r * 150), 80, 100);
                }
            }
            g.fillStyle(0x5a5a62, 1).fillRect(700, y(-150), 420, 150);
            g.lineStyle(5, SET_INK, 1).strokeRect(700, y(-150), 420, 150);
            for (let i = 0; i < 7; i++) g.lineStyle(2, SET_INK, 0.5).strokeRect(700 + i * 60, y(-150), 60, 38);
            // lampione
            g.lineStyle(8, SET_INK, 1).lineBetween(1150, y(0), 1150, y(-420)).lineBetween(1150, y(-420), 1100, y(-420));
            g.fillStyle(0xffe0a0, 1).fillCircle(1100, y(-410), 10);
            floor(g, y, 0x2a2a30);
            plan = {
                ambient: AMBIENT[mood],
                lights: [
                    { id: 'finestra', x: 570, y: -340, radius: 420, color: 0xffd58a, intensity: 1.2 },
                    { id: 'lampione', x: 1100, y: -400, radius: 560, color: 0xffe0a0, intensity: 1.3, flicker: true },
                ],
                key: { x: 1100, y: -400 },
            };
            break;
        }
        case 'monitor': {
            wall(g, y, 0x2a3440);
            const screens: Record<string, { x: number; y: number; w: number; h: number }> = {};
            for (let r = 0; r < 2; r++) {
                for (let c = 0; c < 3; c++) {
                    const sx = 300 + c * 210;
                    const sy = -520 + r * 160;
                    screenBox(g, y, sx, sy, 170, 120);
                    screens[`s${r * 3 + c}`] = { x: sx, y: sy, w: 170, h: 120 };
                }
            }
            g.fillStyle(0x22262e, 1).fillRect(240, y(-110), 720, 110);
            g.lineStyle(4, SET_INK, 1).strokeRect(240, y(-110), 720, 110);
            // la stampante del contratto
            g.fillStyle(0xb8bcc4, 1).fillRect(990, y(-90), 130, 90);
            g.lineStyle(4, SET_INK, 1).strokeRect(990, y(-90), 130, 90);
            clock(g, y, 600, -592);
            floor(g, y, 0x1e2228);
            plan = {
                ambient: AMBIENT[mood],
                lights: [{ id: 'schermi', x: 600, y: -400, radius: 700, color: 0x6ad8ff, intensity: 1.3, flicker: true }],
                screens,
                clock: { x: 600, y: -592 },
                key: { x: 600, y: -400 },
            };
            break;
        }
        case 'server': {
            wall(g, y, 0x22262a);
            for (let i = 0; i < 4; i++) {
                const rx = 380 + i * 170;
                g.fillStyle(0x14181c, 1).fillRect(rx, y(-520), 130, 520);
                g.lineStyle(4, SET_INK, 1).strokeRect(rx, y(-520), 130, 520);
                for (let k = 0; k < 14; k++) g.fillStyle(0x262c32, 1).fillRect(rx + 10, y(-505 + k * 36), 110, 26);
            }
            // scale verso l'alto a sinistra
            for (let s = 0; s < 7; s++) {
                g.fillStyle(0x3a3a3a, 1).fillRect(40 + s * 38, y(-40 - s * 40), 120, 40);
                g.lineStyle(3, SET_INK, 1).strokeRect(40 + s * 38, y(-40 - s * 40), 120, 40);
            }
            screenBox(g, y, 1020, -300, 150, 110);
            floor(g, y, 0x1a1c1e);
            plan = {
                ambient: AMBIENT[mood],
                lights: [
                    { id: 'led', x: 640, y: -260, radius: 700, color: 0x50ff90, intensity: 1.2, flicker: true },
                    { id: 'monitor', x: 1095, y: -245, radius: 380, color: 0x9ad0ff, intensity: 1.2 },
                ],
                screens: { pedro: { x: 1020, y: -300, w: 150, h: 110 } },
                key: { x: 1095, y: -245 },
            };
            break;
        }
        case 'archivio': {
            wall(g, y, 0x46505a);
            for (let i = 0; i < 4; i++) {
                const cx = 60 + i * 140;
                g.fillStyle(0x5a6470, 1).fillRect(cx, y(-360), 120, 360);
                g.lineStyle(4, SET_INK, 1).strokeRect(cx, y(-360), 120, 360);
                for (let k = 0; k < 4; k++) {
                    g.lineStyle(3, SET_INK, 1).strokeRect(cx + 10, y(-345 + k * 86), 100, 72);
                    g.fillStyle(0xc8c0a0, 1).fillRect(cx + 45, y(-312 + k * 86), 30, 8);
                }
            }
            desk(g, y, 720, 330, 4);
            floor(g, y, 0x34383c);
            plan = {
                ambient: AMBIENT[mood],
                lights: [{ id: 'lampada', x: 880, y: -260, radius: 520, color: 0xffd28a, intensity: 1.6, flicker: true }],
                calendar: { x: 760, y: -350 },
                key: { x: 880, y: -260 },
            };
            break;
        }
        case 'aula': {
            wall(g, y, 0x4a4440);
            // lavagna e banchi bruciati
            g.fillStyle(0x1c2a22, 1).fillRect(260, y(-500), 680, 260);
            g.lineStyle(10, 0x5a3d26, 1).strokeRect(260, y(-500), 680, 260);
            g.lineStyle(3, 0xd8d8c8, 0.7);
            g.lineBetween(320, y(-440), 520, y(-430)).lineBetween(320, y(-400), 610, y(-405)).lineBetween(340, y(-360), 470, y(-350));
            for (let i = 0; i < 4; i++) {
                const bx = 160 + i * 250;
                g.fillStyle(0x2a1e16, 1).fillRect(bx, y(-90), 150, 14).fillRect(bx + 10, y(-76), 12, 76).fillRect(bx + 128, y(-76), 12, 76);
                g.lineStyle(3, SET_INK, 1).strokeRect(bx, y(-90), 150, 14);
            }
            g.fillStyle(0x000000, 0.35).fillEllipse(600, y(-200), 900, 300);
            floor(g, y, 0x2e2622);
            plan = {
                ambient: AMBIENT[mood],
                lights: [
                    { id: 'brace', x: 600, y: -60, radius: 700, color: 0xff7a3a, intensity: 1.7, flicker: true },
                    { id: 'luna', x: 1000, y: -500, radius: 700, color: 0x8fb0ff, intensity: 1.0 },
                ],
                key: { x: 600, y: -60 },
            };
            break;
        }
    }
    // ogni lampada si vede: filo dal soffitto, paralume, lampadina
    for (const l of plan.lights) if (l.id === 'lampada') hangingLamp(g, y, l.x, l.y);
    // i set aperti o bui reggono solo con un po' di luce diffusa in più, altrimenti la seppia li spegne
    plan.ambient = ROOM_AMBIENT[kind]?.[mood] ?? plan.ambient;
    if (!scene.textures.exists(key)) g.generateTexture(key, STAGE_W, SET_H + FLOOR_D);
    g.destroy();
    return { key, plan };
}

export function propTexture(scene: Phaser.Scene, kind: PropDef['kind']): string {
    const key = `film-prop-${kind}`;
    if (scene.textures.exists(key)) return key;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    let w = 40;
    let h = 40;
    switch (kind) {
        case 'foglio':
            w = 34; h = 44;
            g.fillStyle(0xeee4c8, 1).fillRect(0, 0, w, h).lineStyle(2, SET_INK, 1).strokeRect(1, 1, w - 2, h - 2);
            g.lineStyle(2, 0x2a2a6a, 0.8).lineBetween(6, 12, 26, 11).lineBetween(6, 20, 22, 21);
            break;
        case 'fogli':
            w = 60; h = 30;
            for (let i = 0; i < 4; i++) g.fillStyle(i % 2 ? 0xe2d6b8 : 0xeee4c8, 1).fillRect(i * 6, 12 - i * 3, 40, 18);
            g.lineStyle(2, SET_INK, 0.8).strokeRect(0, 0, w, h);
            break;
        case 'boccetta':
            w = 18; h = 34;
            g.fillStyle(0x9a6bd0, 0.95).fillRoundedRect(1, 10, 16, 23, 5).fillStyle(SET_INK, 1).fillRect(6, 1, 6, 10);
            g.lineStyle(2, SET_INK, 1).strokeRoundedRect(1, 10, 16, 23, 5);
            break;
        case 'pennello':
            w = 44; h = 8;
            g.fillStyle(0x6a4a2a, 1).fillRect(0, 2, 32, 4).fillStyle(0xc84a5a, 1).fillRect(32, 0, 12, 8);
            break;
        case 'scontrino':
            w = 20; h = 36;
            g.fillStyle(0xf4f0e6, 1).fillRect(0, 0, w, h).lineStyle(1, SET_INK, 0.7);
            for (let i = 0; i < 6; i++) g.lineBetween(3, 5 + i * 5, 17, 5 + i * 5);
            break;
        case 'matita':
            w = 36; h = 6;
            g.fillStyle(0xd8b040, 1).fillRect(0, 0, 30, 6).fillStyle(0x2a2a2a, 1).fillTriangle(30, 0, 36, 3, 30, 6);
            break;
        case 'timbro':
            w = 26; h = 30;
            g.fillStyle(0x5a3d26, 1).fillRect(9, 0, 8, 18).fillStyle(SET_INK, 1).fillRect(0, 18, 26, 12);
            break;
        case 'cassetto':
            w = 100; h = 70;
            g.fillStyle(0x5a6470, 1).fillRect(0, 0, w, h).lineStyle(4, SET_INK, 1).strokeRect(2, 2, w - 4, h - 4);
            break;
        case 'striscia':
            w = 30; h = 70;
            g.fillStyle(0xf4f0e6, 1).fillRect(0, 0, w, h).lineStyle(1, SET_INK, 0.7);
            for (let i = 0; i < 10; i++) g.lineBetween(4, 5 + i * 6, 26 - (i % 3) * 5, 5 + i * 6);
            break;
        case 'cartella':
            w = 54; h = 40;
            g.fillStyle(0xd8a040, 1).fillRect(0, 6, w, h - 6).fillRect(0, 0, 22, 8).lineStyle(2, SET_INK, 1).strokeRect(1, 6, w - 2, h - 7);
            break;
        case 'quadro':
            w = 150; h = 180;
            g.fillStyle(0xe8dcc0, 1).fillRect(0, 0, w, h);
            break;
    }
    g.generateTexture(key, w, h);
    g.destroy();
    return key;
}

export function calendarTexture(scene: Phaser.Scene): string {
    const key = 'film-calendario';
    if (scene.textures.exists(key)) return key;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xeee6d0, 1).fillRect(0, 0, 70, 84);
    g.fillStyle(0xb83a3a, 1).fillRect(0, 0, 70, 18);
    g.lineStyle(3, SET_INK, 1).strokeRect(1, 1, 68, 82);
    g.generateTexture(key, 70, 84);
    g.destroy();
    return key;
}
