import Phaser from 'phaser';
import { ZONE_HEX } from '../config';
import type { ZoneColor } from '../types';

interface LayerConfig {
    key: string;
    /** usato se `key` non esiste (sfondo custom non ancora aggiunto) */
    fallbackKey?: string;
    speed: number;
    speedY?: number;
    depth: number;
    opacity?: number;
    tint?: boolean;
    tintStrength?: number;
    fitHeight?: boolean;
    scale?: number;
    /** deriva orizzontale autonoma (nebbia) */
    driftX?: number;
}

/* la regola della legacy: sfondo dipinto lontano, strati che scorrono
   a velocità diverse, e la nebbia che passa DAVANTI al giocatore */
function themeFor(zone: ZoneColor, levelId: string): LayerConfig[] {
    const legacy = zone === 'red' || zone === 'orange' || zone === 'cyan' ? 'background2' : 'background';
    // perduta resta sul fondale fatto a mano; gli altri usano il dipinto custom
    const custom = levelId !== 'perduta';
    const painted = custom ? `bg-painted-${levelId}` : legacy;
    const layers: LayerConfig[] = [
        { key: painted, fallbackKey: legacy, speed: 0.03, depth: -20, fitHeight: true, tint: true, tintStrength: custom ? 0.18 : 0.4 },
        { key: `bg-${zone}-0`, speed: 0.16, depth: -16, opacity: 0.95 },
        { key: `bg-${zone}-1`, speed: 0.32, depth: -14, opacity: 0.95 },
    ];
    if (zone === 'purple' || zone === 'blue' || zone === 'green') {
        layers.push({ key: 'ruins_columns', speed: 0.55, speedY: 0.9, depth: -12, scale: 0.8, opacity: 0.92, tint: true, tintStrength: 0.18 });
    }
    layers.push({ key: 'fog', speed: 1.15, depth: 30, opacity: 0.16, driftX: 6 });
    return layers;
}

export class ParallaxManager {
    private scene: Phaser.Scene;
    private layers: { sprite: Phaser.GameObjects.TileSprite; cfg: LayerConfig }[] = [];
    private onResize = () => this.resize();

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    build(zone: ZoneColor, levelId: string): void {
        const tint = Phaser.Display.Color.IntegerToColor(ZONE_HEX[zone]);
        for (const cfg of themeFor(zone, levelId)) {
            if (!this.scene.textures.exists(cfg.key)) {
                if (cfg.fallbackKey && this.scene.textures.exists(cfg.fallbackKey)) {
                    cfg.key = cfg.fallbackKey;
                } else {
                    continue;
                }
            }
            const sprite = this.scene.add.tileSprite(0, 0, 16, 16, cfg.key);
            sprite.setOrigin(0.5, 0.5);
            sprite.setScrollFactor(0);
            sprite.setDepth(cfg.depth);
            if (cfg.opacity !== undefined) sprite.setAlpha(cfg.opacity);
            if (cfg.tint) {
                const s = cfg.tintStrength ?? 0.4;
                sprite.setTint(Phaser.Display.Color.GetColor(
                    Math.round(255 * (1 - s) + tint.red * s),
                    Math.round(255 * (1 - s) + tint.green * s),
                    Math.round(255 * (1 - s) + tint.blue * s)
                ));
            }
            this.layers.push({ sprite, cfg });
        }
        this.resize();
        this.scene.scale.on('resize', this.onResize);
        this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.scene.scale.off('resize', this.onResize);
            this.layers = [];
        });
    }

    resize(): void {
        const cam = this.scene.cameras.main;
        // lo zoom è centrato sul centro camera: un oggetto a scrollfactor 0
        // copre lo schermo se sta al centro con dimensione viewport/zoom
        const vw = cam.width / cam.zoom + 8;
        const vh = cam.height / cam.zoom + 8;
        for (const { sprite, cfg } of this.layers) {
            sprite.setSize(Math.ceil(vw), Math.ceil(vh));
            sprite.setPosition(cam.width / 2, cam.height / 2);
            const tex = this.scene.textures.get(cfg.key).getSourceImage() as HTMLImageElement;
            if (cfg.fitHeight && tex.height) {
                const s = vh / tex.height;
                sprite.setTileScale(s, s);
            } else if (cfg.scale) {
                sprite.setTileScale(cfg.scale, cfg.scale);
            }
        }
    }

    update(time: number): void {
        const cam = this.scene.cameras.main;
        for (const { sprite, cfg } of this.layers) {
            sprite.tilePositionX = (cam.scrollX * cfg.speed + (cfg.driftX ? time * 0.001 * cfg.driftX : 0)) / sprite.tileScaleX;
            sprite.tilePositionY = (cam.scrollY * (cfg.speedY ?? cfg.speed * 0.4)) / sprite.tileScaleY;
        }
    }
}
