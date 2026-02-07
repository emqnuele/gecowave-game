import Phaser from 'phaser';
import { PARALLAX_THEMES } from './ParallaxConfigs';

export interface ParallaxLayerConfig {
    key: string;       // Texture key
    speed: number;     // Scroll speed
    speedY?: number;   // Optional vertical scroll speed
    depth: number;     // Render depth
    opacity?: number;  // Optional opacity
    offsetY?: number;  // Optional vertical offset
    scale?: number;    // Legacy uniform scale
    tileScaleX?: number; // Optional X scale
    tileScaleY?: number; // Optional Y scale
    fitHeight?: boolean; // Automatically scale to cover screen height
}

export class ParallaxManager {
    private scene: Phaser.Scene;
    private layers: { sprite: Phaser.GameObjects.TileSprite, speed: number, speedY: number, scaleY: number, fitHeight: boolean }[] = [];

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    public loadTheme(themeName: string): void {
        // Clear existing
        this.destroy();

        const config = PARALLAX_THEMES[themeName] || PARALLAX_THEMES['default'];
        if (!config) {
            console.warn(`[ParallaxManager] Theme '${themeName}' not found and no default available.`);
            return;
        }

        console.log(`[ParallaxManager] Loading theme: ${themeName}`);
        config.forEach(layerConfig => {
            if (this.scene.textures.exists(layerConfig.key)) {
                this.addLayer(layerConfig);
            } else {
                console.warn(`[ParallaxManager] Texture '${layerConfig.key}' missing for theme '${themeName}'.`);
            }
        });
    }

    public addLayer(config: ParallaxLayerConfig): void {
        const { width, height } = this.scene.scale;

        const sprite = this.scene.add.tileSprite(
            width / 2,      // Center X
            height / 2,     // Center Y
            width,          // Width (Matches screen)
            height,         // Height (Matches screen)
            config.key      // Texture
        );

        sprite.setScrollFactor(0); // Fix to camera
        sprite.setDepth(config.depth);
        if (config.opacity !== undefined) sprite.setAlpha(config.opacity);

        let finalScaleX = config.tileScaleX ?? config.scale ?? 1;
        let finalScaleY = config.tileScaleY ?? config.scale ?? 1;

        if (config.fitHeight) {
            // Calculate scale needed to fit the texture height to the screen height
            const texture = this.scene.textures.get(config.key).getSourceImage();
            const textureHeight = (texture as any).height;
            if (textureHeight) {
                finalScaleY = height / textureHeight;
                // Maintain aspect ratio if uniform scale was intended but not specified
                if (config.tileScaleX === undefined && config.scale === undefined) {
                    finalScaleX = finalScaleY;
                }
            }
        }

        sprite.setTileScale(finalScaleX, finalScaleY);

        // Adjust Y offset if needed
        if (config.offsetY) {
            sprite.y += config.offsetY;
        }

        this.layers.push({
            sprite,
            speed: config.speed,
            speedY: config.speedY ?? 0,
            scaleY: finalScaleY,
            fitHeight: !!config.fitHeight
        });
    }

    public update(): void {
        const cameraX = this.scene.cameras.main.scrollX;
        const cameraY = this.scene.cameras.main.scrollY;

        this.layers.forEach(layer => {
            // Logic:
            // Moving Camera Right (Increases scrollX) -> World moves Left.
            // Items should shift Left.
            // TilePositionX shifts the texture. Positive shifts texture Left? No.
            // tilePositionX moves the 'window' over the texture.
            // If we increase tilePositionX, texture slides Left.
            // We want layers to slide Left as we go Right.
            // So tilePositionX = cameraX * speed.

            layer.sprite.tilePositionX = cameraX * layer.speed;
            if (layer.speedY !== 0) {
                layer.sprite.tilePositionY = cameraY * layer.speedY;
            }
        });
    }

    public destroy(): void {
        // Layers are GameObjects, scene handles them, but good to clear reference
        this.layers = [];
    }
}
