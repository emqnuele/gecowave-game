import Phaser from 'phaser';
import { TILE } from '../config';
import type { NavSegment } from '../world/NavGraph';
import { sfx } from '../audio/sfx';
import { pathGaps, QUIET_ROOMS, seeded, type Mechanic, type MechanicCtx } from './types';

/* pavimenti che si muovono: i torrenti del rio e i nastri dello stabilimento.
   spingono chi ci sta sopra e ogni tanto invertono il verso, con una pausa in
   mezzo: controcorrente un salto viene corto, basta aspettare il cambio */

export interface FlowStyle {
    kind: 'stream' | 'belt';
    speed: number;
    /** ms in un verso prima di fermarsi e invertire */
    period: number;
    density: number;
    minLen: number;
}

export const STREAM: FlowStyle = { kind: 'stream', speed: 150, period: 8000, density: 0.6, minLen: 7 };
export const BELT: FlowStyle = { kind: 'belt', speed: 170, period: 10000, density: 0.75, minLen: 7 };

const STOP_MS = 1300;

interface Flow {
    x0: number;
    x1: number;
    floorY: number;
    dir: 1 | -1;
    offset: number;
    strip: Phaser.GameObjects.TileSprite;
    ends: Phaser.GameObjects.Arc[];
    speedNow: number;
}

export class FloorFlow implements Mechanic {
    private ctx: MechanicCtx;
    private style: FlowStyle;
    private flows: Flow[] = [];
    private lastFlip = new Map<Flow, number>();

    constructor(ctx: MechanicCtx, style: FlowStyle) {
        this.ctx = ctx;
        this.style = style;
        this.ensureTextures();
        const rnd = seeded(`${ctx.regionId}:flow`);
        const L = ctx.layout;
        const gaps = pathGaps(ctx);
        const avoid = [...ctx.avoid, ...gaps.map((g) => ({ x: g.x, y: g.y }))];
        const clear = (x: number, y: number) => avoid.every((p) => Math.abs(p.x - x) > 160 || Math.abs(p.y - y) > 120);
        for (const room of L.rooms) {
            if (QUIET_ROOMS.has(room.kind) || rnd() > style.density) continue;
            const segs = ctx.nav.segments.filter((s) =>
                s.r > room.rect.y && s.r < room.rect.y + room.rect.h - 1 && s.c0 >= room.rect.x && s.c1 < room.rect.x + room.rect.w && s.c1 - s.c0 + 1 >= style.minLen,
            );
            if (!segs.length) continue;
            const seg = segs[Math.floor(rnd() * segs.length)]!;
            this.place(seg, rnd, clear);
        }
    }

    private place(seg: NavSegment, rnd: () => number, clear: (x: number, y: number) => boolean): void {
        const x0 = (seg.c0 + 1) * TILE;
        const x1 = seg.c1 * TILE;
        const floorY = (seg.r + 1) * TILE;
        if (!clear(x0, floorY) || !clear(x1, floorY) || !clear((x0 + x1) / 2, floorY)) return;
        const scene = this.ctx.scene;
        const belt = this.style.kind === 'belt';
        const h = belt ? 12 : 18;
        const strip = scene.add.tileSprite((x0 + x1) / 2, floorY - h / 2 + (belt ? 2 : 3), x1 - x0, h, belt ? 'flow-belt' : 'flow-stream')
            .setDepth(4.2).setAlpha(belt ? 1 : 0.82);
        if (belt) strip.setPipeline('Light2D');
        const ends = belt
            ? [x0, x1].map((x) => scene.add.circle(x, floorY - 4, 8, 0x3f3f46, 1).setStrokeStyle(2, 0x0b0c10, 1).setDepth(4.3))
            : [];
        this.flows.push({ x0, x1, floorY, dir: rnd() < 0.5 ? -1 : 1, offset: Math.floor(rnd() * this.style.period), strip, ends, speedNow: 0 });
    }

    update(time: number, delta: number): void {
        const p = this.ctx.player;
        const body = p.body as Phaser.Physics.Arcade.Body;
        const cycle = this.style.period + STOP_MS;
        let drift = 0;
        for (const f of this.flows) {
            const t = (time + f.offset) % (cycle * 2);
            // verso alterno: avanti, pausa, indietro, pausa. la rampa si vede rallentare prima del cambio
            const forward = t < cycle;
            const local = forward ? t : t - cycle;
            const ramp = local < this.style.period ? Math.min(1, local / 500, (this.style.period - local) / 500) : 0;
            const dir = (forward ? f.dir : -f.dir) as 1 | -1;
            f.speedNow = dir * this.style.speed * ramp;
            // le frecce guardano dove spinge: il nastro specchiato scorre al contrario
            if (f.speedNow !== 0) f.strip.setFlipX(f.speedNow < 0);
            f.strip.tilePositionX -= (Math.abs(f.speedNow) * delta) / 1000;
            if (local >= this.style.period && this.lastFlip.get(f) !== Math.floor(t / cycle)) {
                this.lastFlip.set(f, Math.floor(t / cycle));
                if (Math.abs(p.x - (f.x0 + f.x1) / 2) < 500 && Math.abs(p.y - f.floorY) < 300) {
                    if (this.style.kind === 'belt') sfx.creak(0, 0.5);
                    else sfx.bubble(0, 0.6);
                }
            }
            const feet = body.bottom;
            const onIt = p.x > f.x0 - 8 && p.x < f.x1 + 8 && feet > f.floorY - (this.style.kind === 'stream' ? 22 : 6) && feet < f.floorY + 6;
            if (onIt && (this.style.kind === 'stream' || body.blocked.down)) drift = f.speedNow;
        }
        // nel rio anche le piene trascinano, col verso del torrente più vicino
        // sotto la marea si nuota: la corrente tira solo chi tocca ancora il fondo del torrente
        if (!drift && this.style.kind === 'stream' && p.submerged && !p.deep) drift = this.nearest(p.x, p.y)?.speedNow ?? 0;
        // le corse a tempo sono misurate sul pavimento fermo: durante la corsa la corrente non conta
        p.drift = this.ctx.trialRunning() ? 0 : drift;
    }

    private nearest(x: number, y: number): Flow | null {
        let best: Flow | null = null;
        let bd = 900;
        for (const f of this.flows) {
            const d = Math.abs((f.x0 + f.x1) / 2 - x) + Math.abs(f.floorY - y);
            if (d < bd) {
                bd = d;
                best = f;
            }
        }
        return best;
    }

    private ensureTextures(): void {
        const scene = this.ctx.scene;
        if (!scene.textures.exists('flow-belt')) {
            const g = scene.add.graphics();
            // nastro di gomma con le frecce gialle: si legge il verso anche fermo
            g.fillStyle(0x27272a, 1);
            g.fillRect(0, 0, 32, 12);
            g.fillStyle(0x0b0c10, 1);
            g.fillRect(0, 0, 32, 2);
            g.fillRect(0, 10, 32, 2);
            g.lineStyle(2, 0xca8a04, 0.9);
            g.beginPath();
            g.moveTo(10, 3);
            g.lineTo(16, 6);
            g.lineTo(10, 9);
            g.strokePath();
            g.generateTexture('flow-belt', 32, 12);
            g.destroy();
        }
        if (!scene.textures.exists('flow-stream')) {
            const t = scene.textures.createCanvas('flow-stream', 64, 18);
            if (t) {
                const c = t.getContext();
                const grad = c.createLinearGradient(0, 0, 0, 18);
                grad.addColorStop(0, 'rgba(120, 140, 80, 0.55)');
                grad.addColorStop(1, 'rgba(60, 70, 40, 0.9)');
                c.fillStyle = grad;
                c.fillRect(0, 0, 64, 18);
                // filetti di schiuma che scorrono: il verso della corrente si vede
                c.strokeStyle = 'rgba(230, 240, 210, 0.7)';
                c.lineWidth = 1.5;
                for (const [x, y, w] of [[4, 4, 14], [30, 8, 18], [50, 3, 9], [18, 12, 12], [42, 14, 10]] as const) {
                    c.beginPath();
                    c.moveTo(x, y);
                    c.lineTo(x + w, y);
                    c.stroke();
                }
                c.fillStyle = 'rgba(11, 12, 16, 0.9)';
                c.fillRect(0, 0, 64, 1.5);
                t.refresh();
            }
        }
    }

    destroy(): void {
        this.ctx.player.drift = 0;
        for (const f of this.flows) {
            f.strip.destroy();
            f.ends.forEach((e) => e.destroy());
        }
        this.flows = [];
    }
}
