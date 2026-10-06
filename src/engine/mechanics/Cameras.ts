import Phaser from 'phaser';
import { TILE } from '../../config';
import { bus } from '../events';
import { sfx } from '../sfx';
import { state } from '../state';
import { pathGaps, QUIET_ROOMS, seeded, type Mechanic, type MechanicCtx } from './types';

/* telecamere appese al soffitto che spazzano la stanza con un cono di luce.
   chi ci finisce dentro fa scattare l'allarme. nella cantina di ticummi
   è buio pesto e l'allarme chiama gente; nel centro della tommasorveglianza
   ogni avvistamento finisce nel modello dell'ombra che ti aspetta in fondo.
   la scivolata ti rende un fotogramma sfocato: passa sotto senza farti vedere */

export interface CameraMode {
    kind: 'cantina' | 'sorveglianza';
    /** stanze con una telecamera */
    density: number;
    /** nemici chiamati a ogni allarme */
    callers: number;
    /** il buio della cantina: luce del geco ridotta e ambiente spento */
    dark: boolean;
}

export const CANTINA_CAMS: CameraMode = { kind: 'cantina', density: 0.6, callers: 2, dark: true };
export const SORVEGLIANZA_CAMS: CameraMode = { kind: 'sorveglianza', density: 0.7, callers: 1, dark: false };

const SWEEP = 0.85;
const COOLDOWN_MS = 9000;
const MAX_DATA = 8;

interface Cam {
    x: number;
    y: number;
    len: number;
    phase: number;
    period: number;
    angle: number;
    head: Phaser.GameObjects.Image;
    cone: Phaser.GameObjects.Graphics;
    light: Phaser.GameObjects.Light;
    alarmUntil: number;
    room: number;
}

export class Cameras implements Mechanic {
    private ctx: MechanicCtx;
    private mode: CameraMode;
    private cams: Cam[] = [];
    private ambientBefore: number | null = null;
    private lightBefore: { radius: number; intensity: number } | null = null;

    constructor(ctx: MechanicCtx, mode: CameraMode) {
        this.ctx = ctx;
        this.mode = mode;
        this.ensureTexture();
        if (mode.dark) this.darken();
        const rnd = seeded(`${ctx.regionId}:cam`);
        const gaps = pathGaps(ctx);
        const avoid = [...ctx.avoid, ...gaps.map((g) => ({ x: g.x, y: g.y }))];
        for (const room of ctx.layout.rooms) {
            if (QUIET_ROOMS.has(room.kind) || room.surface || rnd() > mode.density) continue;
            const segs = ctx.nav.segments.filter((s) =>
                s.r > room.rect.y + 2 && s.r < room.rect.y + room.rect.h - 1 && s.c0 >= room.rect.x && s.c1 < room.rect.x + room.rect.w && s.c1 - s.c0 >= 5,
            );
            for (let tries = 0; tries < 6 && segs.length; tries++) {
                const seg = segs[Math.floor(rnd() * segs.length)]!;
                const c = seg.c0 + 2 + Math.floor(rnd() * (seg.c1 - seg.c0 - 3));
                // soffitto tra 4 e 10 righe sopra il pavimento: più in alto il cono non arriva
                let top = -1;
                for (let k = 4; k <= 10; k++) {
                    if (ctx.nav.solid(c, seg.r - k)) {
                        top = seg.r - k;
                        break;
                    }
                }
                if (top < 0) continue;
                const x = c * TILE + TILE / 2;
                const y = (top + 1) * TILE + 4;
                if (avoid.some((p) => Math.abs(p.x - x) < 200 && Math.abs(p.y - y) < 260)) continue;
                this.add(x, y, (seg.r + 1) * TILE - y + 24, rnd, room.id);
                break;
            }
        }
    }

    private add(x: number, y: number, len: number, rnd: () => number, room: number): void {
        const scene = this.ctx.scene;
        const head = scene.add.image(x, y, 'cam-head').setDepth(4.4).setPipeline('Light2D').setOrigin(0.5, 0.2);
        const cone = scene.add.graphics().setDepth(4.1).setBlendMode(Phaser.BlendModes.ADD);
        const light = this.ctx.lighting.static(x, y + 30, this.color(false), 150, this.mode.dark ? 0.75 : 0.5);
        this.cams.push({ x, y, len, phase: rnd() * Math.PI * 2, period: 3600 + rnd() * 2400, angle: 0, head, cone, light, alarmUntil: 0, room });
    }

    private color(alarm: boolean): number {
        if (alarm) return 0xef4444;
        return this.mode.kind === 'cantina' ? 0xfde68a : 0x22d3ee;
    }

    update(time: number): void {
        const p = this.ctx.player;
        const dashing = p.isDashing;
        for (const c of this.cams) {
            const near = Math.abs(p.x - c.x) < 900 && Math.abs(p.y - c.y) < 700;
            c.head.setVisible(near);
            c.cone.setVisible(near);
            if (!near) continue;
            const alarm = time < c.alarmUntil;
            // in allarme la telecamera ti fissa; a riposo spazza avanti e indietro
            const target = alarm ? Math.atan2(p.x - c.x, p.y - c.y) * -1 : Math.sin(time / c.period * Math.PI * 2 + c.phase) * SWEEP;
            c.angle += (target - c.angle) * (alarm ? 0.2 : 1);
            c.head.setRotation(c.angle);
            const half = 0.26;
            const a0 = Math.PI / 2 + c.angle - half;
            const a1 = Math.PI / 2 + c.angle + half;
            c.cone.clear();
            c.cone.fillStyle(this.color(alarm), alarm ? 0.22 : 0.13);
            c.cone.fillTriangle(c.x, c.y + 6, c.x + Math.cos(a0) * c.len, c.y + Math.sin(a0) * c.len, c.x + Math.cos(a1) * c.len, c.y + Math.sin(a1) * c.len);
            c.light.setPosition(c.x + Math.cos(Math.PI / 2 + c.angle) * c.len * 0.6, c.y + Math.sin(Math.PI / 2 + c.angle) * c.len * 0.6);
            if (alarm || dashing || p.dead) continue;
            // dentro il cono e a vista: la roccia ripara, la scivolata sfoca
            const dx = p.x - c.x;
            const dy = p.y - c.y;
            const dist = Math.hypot(dx, dy);
            if (dist > c.len + 10 || dy < 0) continue;
            const ang = Math.atan2(dy, dx) - Math.PI / 2;
            if (Math.abs(Phaser.Math.Angle.Wrap(ang - c.angle)) > half) continue;
            if (!this.ctx.nav.sight(c.x, c.y + 10, p.x, p.y - 10)) continue;
            this.alarm(c, time);
        }
    }

    private alarm(c: Cam, time: number): void {
        c.alarmUntil = time + COOLDOWN_MS;
        c.light.setColor(0xef4444);
        this.ctx.scene.time.delayedCall(COOLDOWN_MS, () => c.light.setColor(this.color(false)));
        sfx.beep(0, 1);
        this.ctx.scene.time.delayedCall(160, () => sfx.beep(0, 1));
        try { this.ctx.scene.cameras.main.flash(120, 120, 20, 20); } catch { /* camera finta */ }
        if (this.mode.kind === 'sorveglianza') {
            state.recordOmbraSighting();
            bus.emit('toast', { text: `la tommasorveglianza ti ha ripreso. l'ombra impara (${state.save.ombra.sightings}/${MAX_DATA}).` });
        } else {
            bus.emit('toast', { text: 'telecamera di ticummi: allarme. arriva gente.' });
        }
        if (this.ctx.awakeEnemies() >= 7 || !this.ctx.enemyKinds.length) return;
        // chi arriva arriva dai lati della stanza, non dal nulla accanto al geco
        for (let i = 0; i < this.mode.callers; i++) {
            const kind = this.ctx.enemyKinds[(i + Math.floor(time / 1000)) % this.ctx.enemyKinds.length]!;
            const side = i % 2 ? 1 : -1;
            this.ctx.scene.time.delayedCall(500 + i * 350, () => this.ctx.spawnHunter(kind, c.x + side * 260, c.y + c.len * 0.5));
        }
    }

    /** cantina: la luce la porti tu, e ne porti poca */
    private darken(): void {
        const lights = this.ctx.scene.lights;
        const a = lights.ambientColor;
        this.ambientBefore = a ? Phaser.Display.Color.GetColor(Math.round(a.r * 255), Math.round(a.g * 255), Math.round(a.b * 255)) : null;
        lights.setAmbientColor(0x050407);
        const pl = this.ctx.playerLight;
        this.lightBefore = { radius: pl.radius, intensity: pl.intensity };
        pl.setRadius(250);
        pl.setIntensity(1.15);
    }

    private ensureTexture(): void {
        const scene = this.ctx.scene;
        if (scene.textures.exists('cam-head')) return;
        const g = scene.add.graphics();
        // staffa al soffitto, corpo della telecamera, occhio
        g.fillStyle(0x3f3f46, 1);
        g.fillRect(9, 0, 4, 7);
        g.fillStyle(0x52525b, 1);
        g.fillRoundedRect(3, 6, 16, 12, 3);
        g.fillStyle(0x0b0c10, 1);
        g.fillCircle(11, 17, 4);
        g.fillStyle(0xef4444, 1);
        g.fillCircle(11, 17, 1.6);
        g.lineStyle(1.5, 0x0b0c10, 1);
        g.strokeRoundedRect(3, 6, 16, 12, 3);
        g.generateTexture('cam-head', 22, 22);
        g.destroy();
    }

    destroy(): void {
        for (const c of this.cams) {
            c.head.destroy();
            c.cone.destroy();
            this.ctx.lighting.remove(c.light);
        }
        this.cams = [];
        if (this.ambientBefore !== null) this.ctx.scene.lights.setAmbientColor(this.ambientBefore);
        if (this.lightBefore) {
            this.ctx.playerLight.setRadius(this.lightBefore.radius);
            this.ctx.playerLight.setIntensity(this.lightBefore.intensity);
        }
    }
}
