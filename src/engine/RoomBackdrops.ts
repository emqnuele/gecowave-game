import Phaser from 'phaser';
import { TILE } from '../config';
import type { BiomeDef } from '../content/biomes';
import type { RegionLayout } from '../world/types';
import { mix } from './art/ink';
import { materialCanvas } from './art/materials';

/* sottoterra il cielo non si vede: dietro ogni stanza chiusa c'è la sua parete
   di fondo, buia, e sono le luci a rivelarla come in hollow knight */

export class RoomBackdrops {
    private scene: Phaser.Scene;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    build(layout: RegionLayout, biome: BiomeDef): void {
        const key = `backdrop-${biome.id}`;
        if (!this.scene.textures.exists(key)) this.scene.textures.addCanvas(key, materialCanvas(biome));
        const tint = mix(biome.rock, 0x000000, 0.55);
        for (const room of layout.rooms) {
            if (room.surface) continue;
            const r = room.rect;
            // le stanze più alte lasciano intravedere il dipinto del capitolo
            const alpha = room.sy === 0 ? 0.62 : 0.96;
            this.scene.add
                .tileSprite(r.x * TILE, r.y * TILE, r.w * TILE, r.h * TILE, key)
                .setOrigin(0, 0)
                .setDepth(-5)
                .setTint(tint)
                .setAlpha(alpha)
                .setTilePosition(r.x * 13, r.y * 7)
                .setPipeline('Light2D');
        }
    }
}
