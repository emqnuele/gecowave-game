import type Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { state } from '../core/state';
import { QUIET_ROOMS, type Mechanic, type MechanicCtx } from './types';
import { emitWorld } from '../core/worldEvents';
import { rng } from '../core/rng';

/* il server di notino ha un cecchino sulla torre radio: all'aperto un laser
   rosso ti cerca, si ferma, diventa bianco e spara dove eri. chi corre dritto
   se lo prende, chi cambia passo o scivola nel momento giusto no.
   finisce quando notino perde: senza admin il server spegne la torre */

const TRACK_MS = 1000;
const LOCK_MS = 300;

export class Snipers implements Mechanic {
    private ctx: MechanicCtx;
    private line: Phaser.GameObjects.Graphics;
    private nextAt = 0;
    private aim: { ox: number; oy: number; startAt: number; lockX: number; lockY: number; locked: boolean } | null = null;

    constructor(ctx: MechanicCtx) {
        this.ctx = ctx;
        this.line = ctx.scene.add.graphics().setDepth(6.5);
        this.nextAt = ctx.scene.time.now + 9000;
    }

    private active(): boolean {
        if (state.hasFlag('boss-down-notino')) return false;
        const p = this.ctx.player;
        const room = this.roomAt(p.x, p.y);
        if (!room || !room.surface || QUIET_ROOMS.has(room.kind)) return false;
        return this.ctx.avoid.every((a) => Math.abs(a.x - p.x) > 300 || Math.abs(a.y - p.y) > 220);
    }

    private roomAt(x: number, y: number) {
        const L = this.ctx.layout;
        const c = Math.floor(x / 32);
        const r = Math.floor(y / 32);
        return L.rooms.find((rm) => c >= rm.rect.x && c < rm.rect.x + rm.rect.w && r >= rm.rect.y && r < rm.rect.y + rm.rect.h) ?? null;
    }

    update(time: number): void {
        const p = this.ctx.player;
        this.line.clear();
        if (this.aim) {
            const a = this.aim;
            const t = time - a.startAt;
            if (!a.locked) {
                a.lockX = p.x;
                a.lockY = p.y;
                if (t >= TRACK_MS) {
                    a.locked = true;
                    sfx.beep(0.3, 0.9);
                }
            }
            this.line.lineStyle(a.locked ? 3 : 1.5, a.locked ? 0xffffff : 0xef4444, a.locked ? 0.95 : 0.6);
            this.line.lineBetween(a.ox, a.oy, a.lockX, a.lockY);
            this.line.fillStyle(0xef4444, 0.9);
            this.line.fillCircle(a.ox, a.oy, a.locked ? 5 : 3);
            if (t >= TRACK_MS + LOCK_MS) {
                sfx.shoot();
                emitWorld(this.ctx.scene, 'enemy-shoot', { x: a.ox, y: a.oy, tx: a.lockX, ty: a.lockY, color: 0xef4444, speed: 980, size: 0.9 });
                this.aim = null;
                this.nextAt = time + 5200 + rng.logic.next() * 2600;
            }
            return;
        }
        if (time < this.nextAt || p.dead || !this.active()) return;
        // il cecchino sta in alto, di lato: se la roccia copre un lato prova l'altro
        for (const side of rng.logic.next() < 0.5 ? [1, -1] : [-1, 1]) {
            const ox = p.x + side * 440;
            const oy = p.y - 380;
            if (!this.ctx.nav.sight(ox, oy, p.x, p.y - 10)) continue;
            this.aim = { ox, oy, startAt: time, lockX: p.x, lockY: p.y, locked: false };
            sfx.beep(-0.3, 0.5);
            return;
        }
        this.nextAt = time + 1500;
    }

    destroy(): void {
        this.line.destroy();
    }
}
