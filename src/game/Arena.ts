import Phaser from 'phaser';
import { TILE } from '../config';
import { bus } from '../core/events';
import { sfx } from '../audio/sfx';
import type { Room } from '../world/types';
import type { GameContext, GameSystem } from './context';

type ArenaCtx = Pick<GameContext, 'simulates' | 'scene' | 'world' | 'player' | 'groups' | 'feel' | 'bosses'>;

/** le sbarre che chiudono una stanza: per i boss e per il microfono rosso */
export class Arena implements GameSystem {
    private room: Room | null = null;
    private gfx: Phaser.GameObjects.Graphics | null = null;
    private readonly ctx: ArenaCtx;
    private readonly scene: Phaser.Scene;

    constructor(ctx: ArenaCtx) {
        this.ctx = ctx;
        this.scene = ctx.scene;
    }

    /** l'arena del boss si chiude a scontro iniziato col player dentro, si riapre a boss caduto */
    updateBossLock(time: number): void {
        if (!this.ctx.simulates) return;
        const boss = this.ctx.bosses.current;
        const player = this.ctx.player;
        const fighting = !!boss?.active && boss.engaged && !boss.frenzy && !player.dead;
        if (this.room) {
            // le scenette a metà scontro (ivan) fermano il boss ma non riaprono l'arena
            if (!boss?.active || player.dead) this.unlock();
            else this.draw(time);
            return;
        }
        if (!fighting || !this.ctx.world.layout) return;
        const room = this.ctx.world.roomAt(boss!.x, boss!.y);
        if (!room || room.kind !== 'arena' || this.ctx.world.roomAt(player.x, player.y) !== room) return;
        // si chiude solo con il player ben dentro: mai sbarre addosso a chi sta sulla soglia
        const R = room.rect;
        const c = player.x / TILE;
        const r = player.y / TILE;
        if (c < R.x + 4 || c > R.x + R.w - 4 || r < R.y + 2 || r > R.y + R.h - 2) return;
        this.lock(room);
    }

    lock(room: Room): void {
        this.room = room;
        for (const r of this.ctx.world.doorRects(room)) {
            const bar = this.scene.add.zone(r.centerX, r.centerY, r.width, r.height);
            this.scene.physics.add.existing(bar, true);
            this.ctx.groups.arenaBars.add(bar);
        }
        this.gfx = this.scene.add.graphics().setDepth(6);
        this.ctx.feel.shake(220, 0.006);
        sfx.gate();
        sfx.bossRoar();
        bus.emit('toast', { text: 'le uscite si chiudono. o lui o te.' });
    }

    unlock(): void {
        this.ctx.groups.arenaBars.clear(true, true);
        this.gfx?.destroy();
        this.gfx = null;
        if (this.room && !this.ctx.player.dead) {
            sfx.unlock();
            bus.emit('toast', { text: 'l\'arena si riapre.' });
        }
        this.room = null;
    }

    /** sbarre d'inchiostro che vibrano col colore del boss */
    draw(time: number): void {
        const g = this.gfx;
        if (!g || !this.room) return;
        g.clear();
        const color = this.ctx.bosses.current?.def.glowColor ?? 0xffffff;
        for (const child of this.ctx.groups.arenaBars.getChildren()) {
            const z = child as Phaser.GameObjects.Zone;
            const x0 = z.x - z.width / 2;
            const y0 = z.y - z.height / 2;
            const vertical = z.height >= z.width;
            const n = Math.max(2, Math.round((vertical ? z.width : z.width) / 14));
            g.fillStyle(0x05050a, 0.82);
            g.fillRect(x0, y0, z.width, z.height);
            g.lineStyle(3, color, 0.55 + Math.sin(time / 120) * 0.2);
            if (vertical) {
                for (let i = 0; i < n; i++) {
                    const x = x0 + ((i + 0.5) * z.width) / n + Math.sin(time / 90 + i) * 1.5;
                    g.lineBetween(x, y0, x, y0 + z.height);
                }
            } else {
                for (let i = 0; i < n; i++) {
                    const x = x0 + ((i + 0.5) * z.width) / n;
                    g.lineBetween(x, y0, x + Math.sin(time / 90 + i) * 2, y0 + z.height);
                }
            }
            g.lineStyle(2, 0x000000, 0.9);
            g.strokeRect(x0, y0, z.width, z.height);
        }
    }


    destroy(): void {}
}
