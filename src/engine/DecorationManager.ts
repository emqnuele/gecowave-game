import Phaser from 'phaser';
import { TILE, ZONE_HEX } from '../config';
import type { ZoneColor } from '../types';
import type { LightingManager } from './LightingManager';

function mulberry32(seed: number): () => number {
    let a = seed;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/* la legacy piazzava i props a mano da tiled; qui si leggono
   le superfici della griglia ascii e si arreda da soli, con seed fisso */
export class DecorationManager {
    private scene: Phaser.Scene;
    private lighting: LightingManager;

    constructor(scene: Phaser.Scene, lighting: LightingManager) {
        this.scene = scene;
        this.lighting = lighting;
    }

    decorate(grid: string[], zone: ZoneColor): void {
        if (!this.scene.textures.exists('props_atlas')) return;
        const rnd = mulberry32(zone.length * 7919 + grid.length);
        const zoneTint = ZONE_HEX[zone];

        const isSolid = (c: number, r: number): boolean => (grid[r]?.[c] ?? '.') === '#';
        const isEmpty = (c: number, r: number): boolean => {
            const ch = grid[r]?.[c] ?? '.';
            return ch !== '#' && ch !== '^' && ch !== '~';
        };

        const width = Math.max(...grid.map((row) => row.length));
        let sinceGround = 0;
        let sinceCeil = 3;
        let lanterns = 0;

        for (let c = 1; c < width - 1; c++) {
            for (let r = 1; r < grid.length; r++) {
                // superficie calpestabile: cella vuota con terreno sotto
                if (isEmpty(c, r) && isSolid(c, r + 1)) {
                    sinceGround++;
                    if (sinceGround >= 3 && rnd() > 0.55) {
                        sinceGround = 0;
                        const x = c * TILE + TILE / 2 + (rnd() - 0.5) * 10;
                        const y = (r + 1) * TILE + 6;
                        const isBg = rnd() > 0.45;
                        const frame = `prop_${isBg ? 'bg' : 'ground'}_${Math.floor(rnd() * 8)}`;
                        const prop = this.scene.add.image(x, y, 'props_atlas', frame);
                        prop.setOrigin(0.5, 1);
                        prop.setScale(0.16 + rnd() * 0.14);
                        prop.setDepth(isBg ? 1 : 3);
                        prop.setPipeline('Light2D');
                        if (isBg) prop.setTint(0x9a9aac);
                        if (rnd() > 0.5) prop.setFlipX(true);
                        // qualche lanterna accesa, tinta di zona
                        if (isBg && frame === 'prop_bg_6' && lanterns < 6) {
                            lanterns++;
                            this.lighting.torch(x, y - 28, zoneTint);
                        }
                    }
                    break;
                }
                // soffitto: cella vuota con terreno sopra
                if (isEmpty(c, r) && isSolid(c, r - 1) && r > 2) {
                    sinceCeil++;
                    if (sinceCeil >= 5 && rnd() > 0.7) {
                        sinceCeil = 0;
                        const x = c * TILE + TILE / 2;
                        const y = (r - 1) * TILE + TILE - 4;
                        const prop = this.scene.add.image(x, y, 'props_atlas', `prop_ceil_${Math.floor(rnd() * 6)}`);
                        prop.setOrigin(0.5, 0);
                        prop.setScale(0.14 + rnd() * 0.1);
                        prop.setDepth(1);
                        prop.setAlpha(0.9);
                        prop.setPipeline('Light2D');
                        this.scene.tweens.add({
                            targets: prop,
                            angle: { from: -2, to: 2 },
                            duration: 2400 + rnd() * 1500,
                            yoyo: true,
                            repeat: -1,
                            ease: 'Sine.easeInOut',
                        });
                    }
                    break;
                }
            }
        }
    }
}
