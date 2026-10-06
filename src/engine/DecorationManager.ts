import Phaser from 'phaser';
import { TILE } from '../config';
import type { BiomeDef } from '../content/biomes';
import { hashString, mix, mulberry32 } from './art/ink';
import { propArt } from './art/props';
import type { LightingManager } from './LightingManager';

/* si leggono le superfici della griglia e si arreda da soli, con seed
   fisso: props a inchiostro del bioma, i grandi sullo sfondo e scuri,
   i piccoli davanti al terreno. mai sopra npc, microfoni e uscite */

const VARIANTS = 3;

export class DecorationManager {
    private scene: Phaser.Scene;
    private lighting: LightingManager;

    constructor(scene: Phaser.Scene, lighting: LightingManager) {
        this.scene = scene;
        this.lighting = lighting;
    }

    decorate(grid: string[], biome: BiomeDef, seedKey: string, reserved: { x: number; y: number }[]): void {
        const rnd = mulberry32(hashString(seedKey) ^ 0x51ed27);
        const isSolid = (c: number, r: number): boolean => (grid[r]?.[c] ?? '.') === '#';
        const isFree = (c: number, r: number): boolean => (grid[r]?.[c] ?? '#') === '.';
        const width = Math.max(...grid.map((row) => row.length));
        const blocked = (x: number, y: number) => reserved.some((p) => Math.abs(p.x - x) < 90 && Math.abs(p.y - y) < 120);

        // superfici calpestabili: per ogni colonna, tutte le celle libere con roccia sotto
        const floors: { c: number; r: number }[] = [];
        for (let c = 2; c < width - 2; c++) {
            for (let r = 1; r < grid.length - 1; r++) {
                if (isFree(c, r) && isSolid(c, r + 1)) floors.push({ c, r });
            }
        }

        let lastX = -Infinity;
        floors.sort((a, b) => a.c - b.c || a.r - b.r);
        for (const f of floors) {
            const kind = biome.props[Math.floor(rnd() * biome.props.length)];
            const art = propArt(biome, kind, Math.floor(rnd() * VARIANTS));
            const cellsWide = Math.ceil(art.canvas.width / TILE / 1.4);
            const x = f.c * TILE + TILE / 2;
            const y = (f.r + 1) * TILE;
            if (Math.abs(x - lastX) < 150 + rnd() * 260) continue;
            if (rnd() > 0.5) continue;
            if (blocked(x, y)) continue;
            // serve un tratto piatto e sgombro largo quanto il prop
            let flat = true;
            const half = Math.floor(cellsWide / 2);
            for (let dc = -half; dc <= half && flat; dc++) {
                if (!isSolid(f.c + dc, f.r + 1) || !isFree(f.c + dc, f.r)) flat = false;
                // spazio sopra la testa per i prop alti
                const tall = Math.ceil(art.canvas.height / TILE);
                for (let dr = 1; dr < Math.min(tall, 4) && flat; dr++) if (!isFree(f.c + dc, f.r - dr)) flat = false;
            }
            if (!flat) continue;
            lastX = x;
            this.place(art, kind, biome, x, y, rnd);
        }
    }

    private place(art: ReturnType<typeof propArt>, kind: string, biome: BiomeDef, x: number, y: number, rnd: () => number): void {
        const key = art.id;
        if (!this.scene.textures.exists(key)) this.scene.textures.addCanvas(key, art.canvas);
        const backdrop = art.backdrop === true;
        const scale = backdrop ? 1 + rnd() * 0.35 : 0.85 + rnd() * 0.3;
        const img = this.scene.add.image(x, y + 5, key).setOrigin(0.5, 1).setScale(scale).setPipeline('Light2D');
        if (rnd() > 0.5) img.setFlipX(true);
        if (backdrop) {
            // dietro il terreno e più spento: diventa architettura di fondo
            img.setDepth(1);
            const t = mix(0xffffff, biome.haze, 0.45);
            img.setTint(t);
        } else {
            img.setDepth(3);
        }
        if (art.light) {
            const lx = x + art.light.x * scale * (img.flipX ? -1 : 1);
            const ly = y + 5 + art.light.y * scale;
            this.lighting.prop(lx, ly, art.light.color, art.light.radius, kind === 'candles' || kind === 'lantern');
        }
    }
}
