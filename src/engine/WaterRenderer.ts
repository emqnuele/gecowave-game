import Phaser from 'phaser';
import type { BiomeDef } from '../content/biomes';
import { hex, mix, mulberry32, shade } from './art/ink';
import type { LightingManager } from './LightingManager';
import { rng } from './rng';

/* l'acqua sta davanti al geco: ci entri dentro e ci sparisci a metà.
   corpo sfumato verso il fondo, pelo ondulato che scorre, riflessi */

interface Pool {
    surface: Phaser.GameObjects.TileSprite;
    speed: number;
}

export class WaterRenderer {
    private scene: Phaser.Scene;
    private pools: Pool[] = [];

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.pools = [];
        });
    }

    build(cells: Phaser.Geom.Rectangle[], biome: BiomeDef, lighting: LightingManager): void {
        if (cells.length === 0) return;
        const color = mix(biome.accent, biome.deep, 0.45);
        this.ensureTextures(biome, color);
        for (const pool of this.merge(cells)) {
            const body = this.scene.add.tileSprite(pool.x, pool.y + 6, pool.width, Math.max(8, pool.height - 6), `water-body-${biome.id}`)
                .setOrigin(0, 0).setDepth(5).setAlpha(0.78);
            body.setTileScale(1, Math.max(8, pool.height - 6) / 128);
            const surface = this.scene.add.tileSprite(pool.x, pool.y + 1, pool.width, 12, `water-surf-${biome.id}`)
                .setOrigin(0, 0).setDepth(5).setBlendMode(Phaser.BlendModes.SCREEN);
            this.pools.push({ surface, speed: 0.02 + rng.fx.next() * 0.015 });
            lighting.static(pool.centerX, pool.y + 10, shade(biome.accent, 0.1), Math.min(420, 160 + pool.width * 0.3), 0.55);
            this.scene.add.particles(0, 0, 'p-dot', {
                x: { min: pool.x, max: pool.right },
                y: pool.y + 6,
                speedY: { min: -26, max: -8 },
                scale: { start: 0.28, end: 0 },
                alpha: { start: 0.5, end: 0 },
                tint: shade(biome.accent, 0.3),
                lifespan: 1500,
                frequency: Math.max(60, 4000 / Math.max(1, pool.width / 32)),
            }).setDepth(5);
        }
    }

    update(time: number): void {
        for (const p of this.pools) p.surface.tilePositionX = time * p.speed;
    }

    /** le celle ~ adiacenti diventano vasche rettangolari per riga */
    private merge(cells: Phaser.Geom.Rectangle[]): Phaser.Geom.Rectangle[] {
        const byRow = new Map<number, Phaser.Geom.Rectangle[]>();
        for (const c of cells) {
            const row = byRow.get(c.y) ?? [];
            row.push(c);
            byRow.set(c.y, row);
        }
        const runs: Phaser.Geom.Rectangle[] = [];
        for (const row of byRow.values()) {
            row.sort((a, b) => a.x - b.x);
            let cur: Phaser.Geom.Rectangle | null = null;
            for (const c of row) {
                if (cur && Math.abs(cur.right - c.x) < 1) cur.width += c.width;
                else {
                    cur = new Phaser.Geom.Rectangle(c.x, c.y, c.width, c.height);
                    runs.push(cur);
                }
            }
        }
        // le righe impilate con la stessa estensione si fondono in un'unica vasca
        runs.sort((a, b) => a.x - b.x || a.y - b.y);
        const pools: Phaser.Geom.Rectangle[] = [];
        for (const r of runs) {
            const under = pools.find((p) => p.x === r.x && p.width === r.width && Math.abs(p.bottom - r.y) < 1);
            if (under) under.height += r.height;
            else pools.push(r);
        }
        return pools;
    }

    private ensureTextures(b: BiomeDef, color: number): void {
        const t = this.scene.textures;
        const bodyKey = `water-body-${b.id}`;
        if (!t.exists(bodyKey)) {
            const el = document.createElement('canvas');
            el.width = 128;
            el.height = 128;
            const ctx = el.getContext('2d')!;
            const g = ctx.createLinearGradient(0, 0, 0, 128);
            g.addColorStop(0, hex(shade(color, 0.15), 0.55));
            g.addColorStop(1, hex(mix(color, 0x000000, 0.6), 0.95));
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 128, 128);
            // striature orizzontali tremolanti, a inchiostro chiaro
            const rnd = mulberry32(b.id.length * 91);
            ctx.strokeStyle = hex(shade(color, 0.4), 0.18);
            ctx.lineWidth = 1;
            for (let i = 0; i < 18; i++) {
                const y = rnd() * 128;
                const x = rnd() * 128;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + 10 + rnd() * 30, y + (rnd() - 0.5));
                ctx.stroke();
            }
            t.addCanvas(bodyKey, el);
        }
        const surfKey = `water-surf-${b.id}`;
        if (!t.exists(surfKey)) {
            const el = document.createElement('canvas');
            el.width = 256;
            el.height = 12;
            const ctx = el.getContext('2d')!;
            ctx.strokeStyle = hex(shade(b.accent, 0.45), 0.85);
            ctx.lineWidth = 2;
            ctx.beginPath();
            // due armoniche intere: l'onda si richiude sul bordo della piastrella
            for (let x = 0; x <= 256; x += 2) {
                const y = 5 + Math.sin((x / 256) * Math.PI * 2 * 4) * 2 + Math.sin((x / 256) * Math.PI * 2 * 9) * 0.8;
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.fillStyle = hex(0xffffff, 0.35);
            for (let x = 8; x < 256; x += 37) ctx.fillRect(x, 3, 6, 1.5);
            t.addCanvas(surfKey, el);
        }
    }
}
