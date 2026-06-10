import Phaser from 'phaser';
import { ZONE_HEX } from '../config';
import type { ZoneColor } from '../types';

interface TrackedLight {
    light: Phaser.GameObjects.Light;
    target: Phaser.GameObjects.Sprite;
}

/* il buio è il vero protagonista: ambiente quasi nero,
   ogni cosa viva porta la sua luce */
export class LightingManager {
    private scene: Phaser.Scene;
    private tracked: TrackedLight[] = [];
    private torchCount = 0;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    enable(zone: ZoneColor): void {
        this.scene.lights.enable();
        const tint = Phaser.Display.Color.IntegerToColor(ZONE_HEX[zone]);
        // ambiente scurissimo ma tinto di zona
        const ambient = Phaser.Display.Color.GetColor(
            Math.round(8 + tint.red * 0.04),
            Math.round(8 + tint.green * 0.04),
            Math.round(12 + tint.blue * 0.04)
        );
        this.scene.lights.setAmbientColor(ambient);
    }

    playerLight(target: Phaser.GameObjects.Sprite): Phaser.GameObjects.Light {
        const light = this.scene.lights.addLight(target.x, target.y, 340, 0xaaffdd, 1.25);
        this.tracked.push({ light, target });
        return light;
    }

    follow(target: Phaser.GameObjects.Sprite, color: number, radius = 150, intensity = 0.8): Phaser.GameObjects.Light {
        const light = this.scene.lights.addLight(target.x, target.y, radius, color, intensity);
        this.tracked.push({ light, target });
        this.scene.tweens.add({
            targets: light,
            intensity: { from: intensity, to: intensity * 0.72 },
            radius: { from: radius, to: radius * 0.86 },
            duration: 500 + Math.random() * 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });
        return light;
    }

    torch(x: number, y: number, color = 0xffaa33): Phaser.GameObjects.Light | null {
        // troppe luci uccidono il framerate e il mistero
        if (this.torchCount >= 9) return null;
        this.torchCount++;
        const light = this.scene.lights.addLight(x, y, 240, color, 1.0);
        this.scene.tweens.add({
            targets: light,
            intensity: { from: 1.0, to: 0.78 },
            radius: { from: 240, to: 215 },
            duration: 120 + Math.random() * 220,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });
        return light;
    }

    static(x: number, y: number, color: number, radius = 180, intensity = 0.9): Phaser.GameObjects.Light {
        return this.scene.lights.addLight(x, y, radius, color, intensity);
    }

    remove(light: Phaser.GameObjects.Light | null): void {
        if (!light) return;
        this.scene.lights.removeLight(light);
        this.tracked = this.tracked.filter((t) => t.light !== light);
    }

    update(): void {
        for (let i = this.tracked.length - 1; i >= 0; i--) {
            const { light, target } = this.tracked[i];
            if (!target.active) {
                light.setIntensity(Math.max(0, light.intensity - 0.08));
                if (light.intensity <= 0) {
                    this.scene.lights.removeLight(light);
                    this.tracked.splice(i, 1);
                }
            } else {
                light.setPosition(target.x, target.y);
            }
        }
    }
}
