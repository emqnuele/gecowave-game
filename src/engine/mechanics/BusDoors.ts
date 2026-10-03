import Phaser from 'phaser';
import { TILE } from '../../config';
import { sfx } from '../sfx';
import { pathGaps, seeded, type Gap, type Mechanic, type MechanicCtx } from './types';

/* il citelis comanda anche i muri: i varchi del percorso hanno porte a soffietto
   che seguono un orario. aperte un po', chiuse un po', sempre di nuovo aperte.
   il tabellone sopra conta i secondi: chi lo legge passa al volo, chi no aspetta */

const OPEN_MS = 3400;
const WARN_MS = 900;
const CLOSED_MS = 2600;
const PERIOD = OPEN_MS + WARN_MS + CLOSED_MS;
const MAX_DOORS = 9;

type DoorState = 'open' | 'warn' | 'closed' | 'init';

interface BusDoor {
    gap: Gap;
    offset: number;
    body: Phaser.GameObjects.Rectangle;
    leaves: Phaser.GameObjects.Image[];
    board: Phaser.GameObjects.Text;
    light: Phaser.GameObjects.Light;
    state: DoorState;
}

export class BusDoors implements Mechanic {
    private ctx: MechanicCtx;
    private doors: BusDoor[] = [];
    private group: Phaser.Physics.Arcade.StaticGroup;
    private collider: Phaser.Physics.Arcade.Collider;

    constructor(ctx: MechanicCtx) {
        this.ctx = ctx;
        const scene = ctx.scene;
        this.group = scene.physics.add.staticGroup();
        this.ensureTexture();
        const rnd = seeded(`${ctx.regionId}:porte`);
        const gaps = pathGaps(ctx).filter((g) => ctx.avoid.every((p) => Math.abs(p.x - g.x) > 200 || Math.abs(p.y - g.y) > 160));
        // una porta sì e una no lungo il percorso: il ritmo si impara, non stanca
        const chosen = gaps.filter(() => rnd() < 0.55).slice(0, MAX_DOORS);
        for (const gap of chosen) {
            const r = gap.rect;
            const body = scene.add.rectangle(r.centerX, r.centerY, r.width - 8, r.height, 0x000000, 0);
            this.group.add(body);
            const leaves = [-1, 1].map((side) =>
                scene.add.image(r.centerX + side * (r.width / 4), r.centerY, 'porta-citelis').setDepth(4.6).setPipeline('Light2D').setFlipX(side > 0),
            );
            const board = scene.add.text(r.centerX, r.y - 18, '', {
                fontFamily: '"Martian Mono", monospace', fontSize: '15px', color: '#facc15', stroke: '#000', strokeThickness: 4,
            }).setOrigin(0.5).setDepth(6);
            const light = ctx.lighting.static(r.centerX, r.y - 14, 0xfacc15, 120, 0.7);
            this.doors.push({ gap, offset: Math.floor(rnd() * PERIOD), body, leaves, board, light, state: 'init' });
        }
        this.collider = scene.physics.add.collider(ctx.player, this.group);
        this.group.getChildren().forEach((b) => ((b.body as Phaser.Physics.Arcade.StaticBody).enable = false));
    }

    update(time: number): void {
        const pb = this.ctx.player.getBounds();
        for (const d of this.doors) {
            const t = (time + d.offset) % PERIOD;
            let next: DoorState = t < OPEN_MS ? 'open' : t < OPEN_MS + WARN_MS ? 'warn' : 'closed';
            // mai chiudersi addosso al geco: se è nel vano, la porta aspetta che esca
            if (next === 'closed' && d.state !== 'closed' && Phaser.Geom.Intersects.RectangleToRectangle(pb, d.gap.rect)) next = 'warn';
            // aperta: secondi alla chiusura; chiusa: secondi alla riapertura
            const ms = next === 'closed' ? PERIOD - t : OPEN_MS + WARN_MS - t;
            d.board.setText(`${Math.max(1, Math.ceil(ms / 1000))}`);
            d.board.setColor(next === 'closed' ? '#f87171' : next === 'warn' ? '#fb923c' : '#facc15');
            if (next === d.state) {
                if (next === 'warn') d.leaves.forEach((l) => l.setAlpha(Math.floor(time / 120) % 2 ? 1 : 0.55));
                continue;
            }
            const near = Math.abs(this.ctx.player.x - d.gap.x) < 700 && Math.abs(this.ctx.player.y - d.gap.y) < 450;
            if (next === 'warn' && near) sfx.beep(0, 0.6);
            if (next === 'closed' && near) sfx.creak(0, 0.8);
            if (next === 'open' && near) sfx.beep(0.2, 0.4);
            d.state = next;
            (d.body.body as Phaser.Physics.Arcade.StaticBody).enable = next === 'closed';
            const r = d.gap.rect;
            d.leaves.forEach((l, i) => {
                const side = i === 0 ? -1 : 1;
                l.setAlpha(1);
                this.ctx.scene.tweens.add({
                    targets: l,
                    // aperte: le ante si ritirano nel muro; chiuse: si toccano al centro
                    x: next === 'closed' ? r.centerX + side * (r.width / 4) : r.centerX + side * (r.width / 2 - 4),
                    scaleX: next === 'closed' ? 1 : 0.2,
                    duration: 220,
                    ease: 'Quad.easeOut',
                });
            });
            d.light.setColor(next === 'closed' ? 0xef4444 : 0xfacc15);
        }
    }

    private ensureTexture(): void {
        const scene = this.ctx.scene;
        if (scene.textures.exists('porta-citelis')) return;
        const g = scene.add.graphics();
        const w = TILE;
        const h = TILE * 4;
        // anta del citelis: telaio giallo, vetro sporco, gomma nera sul bordo
        g.fillStyle(0x1c1917, 1);
        g.fillRect(0, 0, w, h);
        g.fillStyle(0xca8a04, 1);
        g.fillRect(2, 2, w - 4, h - 4);
        g.fillStyle(0x1e293b, 0.9);
        g.fillRect(6, 10, w - 12, h * 0.42);
        g.fillRect(6, h * 0.55, w - 12, h * 0.3);
        g.fillStyle(0x94a3b8, 0.25);
        g.fillRect(8, 12, 5, h * 0.4);
        g.fillStyle(0x0b0c10, 1);
        g.fillRect(w - 4, 0, 4, h);
        g.lineStyle(2, 0x0b0c10, 1);
        g.strokeRect(1, 1, w - 2, h - 2);
        g.generateTexture('porta-citelis', w, h);
        g.destroy();
    }

    destroy(): void {
        this.collider.destroy();
        for (const d of this.doors) {
            d.body.destroy();
            d.leaves.forEach((l) => l.destroy());
            d.board.destroy();
            this.ctx.lighting.remove(d.light);
        }
        this.group.destroy();
        this.doors = [];
    }
}
