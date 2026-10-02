import Phaser from 'phaser';
import { TILE } from '../config';
import { mulberry32 } from './art/ink';
import type { NavGraph, NavSegment } from './nav/NavGraph';
import type { RegionLayout, Room } from '../world/types';

/* trappole meccaniche: seghe che corrono sul pavimento, presse che cadono dal
   soffitto, getti di vapore dal pavimento. non sono mai solide e hanno sempre
   una finestra per passare: aggiungono pericolo senza poter chiudere una
   strada che il geco simulato ha già verificato */

export type TrapKind = 'sega' | 'pressa' | 'vapore';

interface Hurtable {
    x: number;
    y: number;
    body: Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | null;
    hurt(amount: number, fromX?: number): boolean;
}

interface Trap {
    kind: TrapKind;
    x: number;
    y: number;
    /** sega: estremi della corsa; pressa: quota alta e bassa del fondo */
    a: number;
    b: number;
    speed: number;
    phase: number;
    period: number;
    dir: 1 | -1;
    sprite: Phaser.GameObjects.Image;
    extra?: Phaser.GameObjects.Graphics;
    /** pistone della pressa: un'immagine, così prende le luci come il resto */
    rod?: Phaser.GameObjects.Image;
    /** la sega porta con sé un filo di luce rossa: nel buio si sente arrivare */
    glow?: Phaser.GameObjects.Light;
    state: number;
}

const INK = 0x0b0c10;
const SAW_R = 15;
const PRESS_W = TILE * 2;
const PRESS_H = 30;
const JET_H = TILE * 3.5;

/** quali trappole e quante, per bioma */
const BY_BIOME: Record<string, { kinds: TrapKind[]; density: number }> = {
    factory: { kinds: ['pressa', 'pressa', 'sega', 'vapore'], density: 0.75 },
    lab: { kinds: ['vapore', 'pressa', 'sega'], density: 0.6 },
    servers: { kinds: ['sega', 'pressa', 'vapore'], density: 0.55 },
    core: { kinds: ['pressa', 'sega', 'vapore'], density: 0.65 },
    wasteland: { kinds: ['sega', 'sega', 'vapore'], density: 0.5 },
    depot: { kinds: ['sega', 'vapore'], density: 0.35 },
    province: { kinds: ['sega', 'vapore'], density: 0.35 },
    noir: { kinds: ['sega', 'vapore'], density: 0.35 },
    burrow: { kinds: ['vapore', 'sega'], density: 0.4 },
    swamp: { kinds: ['vapore'], density: 0.35 },
    cellar: { kinds: ['vapore', 'pressa'], density: 0.4 },
    library: { kinds: ['pressa', 'sega'], density: 0.3 },
    sanctum: { kinds: ['sega'], density: 0.3 },
    mind: { kinds: ['sega', 'pressa'], density: 0.35 },
    memory: { kinds: ['vapore', 'sega'], density: 0.3 },
    void: { kinds: ['sega', 'pressa'], density: 0.45 },
    crater: { kinds: ['sega'], density: 0.15 },
};

const QUIET = new Set(['start', 'rest', 'arena', 'exit', 'secret']);

export class TrapManager {
    readonly traps: Trap[] = [];
    private scene: Phaser.Scene;
    private nav: NavGraph;

    constructor(scene: Phaser.Scene, nav: NavGraph) {
        this.scene = scene;
        this.nav = nav;
    }

    populate(opts: { seed: string; biomeId: string; layout: RegionLayout | null; rim: number; avoid: { x: number; y: number }[] }): void {
        const L = opts.layout;
        const cfg = BY_BIOME[opts.biomeId];
        if (!L || !cfg) return;
        let h = 0;
        for (const ch of opts.seed) h = (h * 31 + ch.charCodeAt(0)) | 0;
        const rnd = mulberry32(h ^ 0x7a9b);
        this.ensureTextures(opts.rim);
        // vicino a varchi e cose con cui si parla niente trappole: si entra e si legge in pace
        const avoid = [
            ...opts.avoid,
            ...L.doors.map((d) => ({ x: (d.x + (d.axis === 'h' ? 0 : d.len / 2)) * TILE, y: (d.y + (d.axis === 'h' ? d.len / 2 : 0)) * TILE })),
        ];
        const clear = (x: number, y: number) => avoid.every((p) => Math.abs(p.x - x) > 220 || Math.abs(p.y - y) > 160);
        const segsIn = (room: Room) =>
            this.nav.segments.filter((s) => s.r > room.rect.y && s.r < room.rect.y + room.rect.h - 1 && s.c0 >= room.rect.x && s.c1 < room.rect.x + room.rect.w);
        for (const room of L.rooms) {
            if (QUIET.has(room.kind)) continue;
            const want = room.kind === 'gauntlet' ? 2 : rnd() < cfg.density ? 1 : 0;
            if (!want) continue;
            const segs = segsIn(room);
            let placed = 0;
            for (let tries = 0; tries < 12 && placed < want && segs.length; tries++) {
                const seg = segs[Math.floor(rnd() * segs.length)];
                const kind = cfg.kinds[Math.floor(rnd() * cfg.kinds.length)];
                if (this.place(kind, seg, rnd, clear)) placed++;
            }
        }
    }

    /** prova a mettere una trappola sul segmento; false se lì non è sicura */
    private place(kind: TrapKind, seg: NavSegment, rnd: () => number, clear: (x: number, y: number) => boolean): boolean {
        const floorY = (seg.r + 1) * TILE;
        // sopra il segmento serve aria per saltarci sopra
        const headroom = (c: number, rows: number) => {
            for (let k = 1; k <= rows; k++) if (!this.nav.free(c, seg.r - k)) return false;
            return true;
        };
        if (this.traps.some((t) => Math.abs(t.x - (seg.c0 + seg.c1 + 1) * TILE / 2) < 260 && Math.abs(t.y - floorY) < 200)) return false;
        if (kind === 'sega') {
            const c0 = seg.c0 + 1;
            const c1 = seg.c1 - 1;
            if (c1 - c0 < 6) return false;
            for (let c = c0; c <= c1; c++) if (!headroom(c, 3)) return false;
            const x0 = c0 * TILE + TILE / 2;
            const x1 = c1 * TILE + TILE / 2;
            const y = floorY - SAW_R + 3;
            if (!clear(x0, y) || !clear(x1, y) || !clear((x0 + x1) / 2, y)) return false;
            const sprite = this.scene.add.image(x0, y, 'trap-sega').setDepth(4).setPipeline('Light2D');
            const speed = 90 + rnd() * 70;
            const glow = this.scene.lights.addLight(x0, y, 90, 0xef4444, 0.45);
            this.traps.push({ kind, x: x0, y, a: x0, b: x1, speed, phase: 0, period: 0, dir: 1, sprite, glow, state: 0 });
            return true;
        }
        if (kind === 'pressa') {
            if (seg.c1 - seg.c0 < 7) return false;
            const c = seg.c0 + 3 + Math.floor(rnd() * (seg.c1 - seg.c0 - 6));
            // soffitto sopra le due colonne della pressa, tra 3 e 7 righe
            let top = -1;
            for (let k = 2; k <= 7; k++) {
                if (this.nav.solid(c, seg.r - k) && this.nav.solid(c + 1, seg.r - k)) {
                    top = seg.r - k + 1;
                    break;
                }
                if (this.nav.solid(c, seg.r - k) !== this.nav.solid(c + 1, seg.r - k)) return false;
            }
            if (top < 0 || seg.r - top + 1 < 3) return false;
            const x = (c + 1) * TILE;
            if (!clear(x, floorY)) return false;
            const upY = top * TILE + PRESS_H;
            const sprite = this.scene.add.image(x, upY, 'trap-pressa').setOrigin(0.5, 1).setDepth(4).setPipeline('Light2D');
            const rod = this.scene.add.image(x, top * TILE, 'trap-rod').setOrigin(0.5, 0).setDepth(3).setPipeline('Light2D');
            const period = 2600 + rnd() * 1200;
            this.traps.push({ kind, x, y: upY, a: upY, b: floorY, speed: 0, phase: rnd() * period, period, dir: 1, sprite, rod, state: 0 });
            this.drawRod(this.traps[this.traps.length - 1], top * TILE);
            return true;
        }
        // vapore: una grata nel pavimento, il getto sale per tre righe e mezza
        if (seg.c1 - seg.c0 < 4) return false;
        const c = seg.c0 + 2 + Math.floor(rnd() * (seg.c1 - seg.c0 - 3));
        if (!headroom(c, 3)) return false;
        const x = c * TILE + TILE / 2;
        if (!clear(x, floorY)) return false;
        const sprite = this.scene.add.image(x, floorY, 'trap-grata').setOrigin(0.5, 1).setDepth(4).setPipeline('Light2D');
        const jet = this.scene.add.graphics().setDepth(5);
        const period = 3000 + rnd() * 1400;
        this.traps.push({ kind: 'vapore', x, y: floorY, a: floorY - JET_H, b: floorY, speed: 0, phase: rnd() * period, period, dir: 1, sprite, extra: jet, state: 0 });
        return true;
    }

    update(time: number, delta: number, player: Hurtable): void {
        const body = player.body as Phaser.Physics.Arcade.Body | null;
        if (!body) return;
        const px0 = body.x;
        const py0 = body.y;
        const px1 = body.x + body.width;
        const py1 = body.y + body.height;
        for (const t of this.traps) {
            // lontano dal geco le trappole si fermano: niente costo e niente sorprese
            if (Math.abs(t.x - player.x) > 1300 || Math.abs(t.y - player.y) > 900) continue;
            if (t.kind === 'sega') {
                t.x += t.dir * t.speed * (delta / 1000);
                if (t.x > t.b) { t.x = t.b; t.dir = -1; }
                if (t.x < t.a) { t.x = t.a; t.dir = 1; }
                t.sprite.setPosition(t.x, t.y);
                t.glow?.setPosition(t.x, t.y);
                t.sprite.rotation += t.dir * t.speed * (delta / 1000) / SAW_R;
                const nx = Phaser.Math.Clamp(t.x, px0, px1);
                const ny = Phaser.Math.Clamp(t.y, py0, py1);
                if ((nx - t.x) ** 2 + (ny - t.y) ** 2 < (SAW_R - 2) ** 2) player.hurt(1, t.x);
                continue;
            }
            const p = (time + t.phase) % t.period;
            if (t.kind === 'pressa') {
                // ciclo: ferma in alto, trema, cade, resta giù, risale
                const wait = t.period - 1900;
                let bottom = t.a;
                let deadly = false;
                if (p < wait) bottom = t.a;
                else if (p < wait + 450) {
                    bottom = t.a;
                    t.sprite.x = t.x + Math.sin(p * 0.12) * 2;
                } else if (p < wait + 560) {
                    bottom = Phaser.Math.Linear(t.a, t.b, (p - wait - 450) / 110);
                    deadly = true;
                } else if (p < wait + 1060) {
                    bottom = t.b;
                    deadly = true;
                    if (t.state === 0) {
                        t.state = 1;
                        this.slam(t);
                    }
                } else {
                    bottom = Phaser.Math.Linear(t.b, t.a, (p - wait - 1060) / 840);
                }
                if (p < wait) {
                    t.state = 0;
                    t.sprite.x = t.x;
                }
                t.y = bottom;
                t.sprite.y = bottom;
                this.drawRod(t, t.a - PRESS_H);
                if (deadly && px1 > t.x - PRESS_W / 2 + 4 && px0 < t.x + PRESS_W / 2 - 4 && py1 > bottom - PRESS_H && py0 < bottom) player.hurt(1, t.x);
                continue;
            }
            // vapore: sbuffi d'avviso, poi il getto
            const g = t.extra!;
            g.clear();
            const warn = t.period - 1800;
            if (p >= warn && p < warn + 600) {
                g.fillStyle(0xcbd5e1, 0.15 + 0.1 * Math.sin(p * 0.05));
                for (let k = 0; k < 3; k++) g.fillCircle(t.x + Math.sin(p * 0.01 + k * 2) * 6, t.b - 8 - k * 9 - (p - warn) * 0.02, 5 + k);
            } else if (p >= warn + 600 && p < warn + 1800) {
                const k = Math.min(1, (p - warn - 600) / 120);
                const top = t.b - JET_H * k;
                // il vapore non prende luce: tenue, o nel buio sembrerebbe un neon
                g.fillStyle(0xcbd5e1, 0.22);
                g.fillRect(t.x - 10, top, 20, t.b - top);
                g.fillStyle(0xe2e8f0, 0.18);
                for (let i = 0; i < 6; i++) g.fillCircle(t.x + Math.sin(p * 0.02 + i) * 8, top + ((p * 0.4 + i * 23) % (t.b - top)), 6);
                if (px1 > t.x - 9 && px0 < t.x + 9 && py1 > top && py0 < t.b) player.hurt(1, t.x);
            }
        }
    }

    private slam(t: Trap): void {
        const cam = this.scene.cameras.main;
        const v = cam.worldView;
        if (t.x > v.x && t.x < v.right && t.y > v.y && t.y < v.bottom) cam.shake(90, 0.004);
        const dust = this.scene.add.particles(t.x, t.b - 4, 'p-dot', {
            speed: { min: 30, max: 110 },
            angle: { min: 190, max: 350 },
            scale: { start: 0.6, end: 0 },
            tint: 0x9ca3af,
            lifespan: 420,
            quantity: 10,
            stopAfter: 10,
        }).setDepth(5);
        this.scene.time.delayedCall(600, () => dust.destroy());
    }

    /** il pistone che regge la pressa */
    private drawRod(t: Trap, ceilY: number): void {
        const h = Math.max(1, t.y - PRESS_H - ceilY);
        t.rod?.setPosition(t.sprite.x, ceilY).setDisplaySize(12, h).setVisible(h > 1);
    }

    private ensureTextures(rim: number): void {
        const s = this.scene;
        if (!s.textures.exists('trap-sega')) {
            const g = s.add.graphics();
            const R = SAW_R;
            const c = R + 3;
            const pts: Phaser.Math.Vector2[] = [];
            for (let i = 0; i < 24; i++) {
                const a = (i / 24) * Math.PI * 2;
                const r = i % 2 ? R - 3 : R + 2;
                pts.push(new Phaser.Math.Vector2(c + Math.cos(a) * r, c + Math.sin(a) * r));
            }
            g.fillStyle(INK, 1);
            g.fillPoints(pts, true);
            g.lineStyle(2, 0xd4d4d8, 1);
            g.strokePoints(pts, true);
            g.lineStyle(1.5, 0xf87171, 0.9);
            g.strokeCircle(c, c, R - 7);
            g.fillStyle(0xd4d4d8, 1);
            g.fillCircle(c, c, 3);
            g.generateTexture('trap-sega', c * 2, c * 2);
            g.destroy();
        }
        if (!s.textures.exists('trap-pressa')) {
            const g = s.add.graphics();
            g.fillStyle(INK, 1);
            g.fillRect(0, 0, PRESS_W, PRESS_H - 6);
            // denti sotto
            for (let x = 0; x < PRESS_W; x += 8) g.fillTriangle(x, PRESS_H - 6, x + 8, PRESS_H - 6, x + 4, PRESS_H);
            g.lineStyle(2, 0xa1a1aa, 1);
            g.strokeRect(1, 1, PRESS_W - 2, PRESS_H - 8);
            // strisce di pericolo
            g.lineStyle(3, 0xb8901a, 0.7);
            for (let x = -PRESS_H; x < PRESS_W; x += 12) g.lineBetween(x, PRESS_H - 9, x + 12, 3);
            g.generateTexture('trap-pressa', PRESS_W, PRESS_H);
            g.destroy();
        }
        if (!s.textures.exists('trap-rod')) {
            const g = s.add.graphics();
            g.fillStyle(0x52525b, 1);
            g.fillRect(0, 0, 12, 8);
            g.fillStyle(INK, 1);
            g.fillRect(2, 0, 8, 8);
            g.generateTexture('trap-rod', 12, 8);
            g.destroy();
        }
        if (!s.textures.exists('trap-grata')) {
            const g = s.add.graphics();
            g.fillStyle(INK, 1);
            g.fillRect(0, 0, 28, 6);
            g.lineStyle(1.5, rim, 0.9);
            g.strokeRect(0.5, 0.5, 27, 5);
            for (let x = 5; x < 28; x += 5) g.lineBetween(x, 1, x, 5);
            g.generateTexture('trap-grata', 28, 6);
            g.destroy();
        }
    }

    destroy(): void {
        for (const t of this.traps) {
            t.sprite.destroy();
            t.extra?.destroy();
            t.rod?.destroy();
            if (t.glow) this.scene.lights.removeLight(t.glow);
        }
        this.traps.length = 0;
    }
}
