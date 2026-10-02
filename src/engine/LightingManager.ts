import Phaser from 'phaser';
import type { BiomeDef } from '../content/biomes';

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
    private propCount = 0;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    enable(biome: BiomeDef): void {
        this.scene.lights.enable();
        const rim = Phaser.Display.Color.IntegerToColor(biome.rim);
        // ambiente scurissimo ma tinto dal bioma: le sagome si leggono, i dettagli no
        const k = biome.ambient * 2.2;
        const ambient = Phaser.Display.Color.GetColor(
            Math.round(6 + rim.red * k),
            Math.round(6 + rim.green * k),
            Math.round(9 + rim.blue * k),
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

    /** luce di un oggetto di scena: le fiamme tremano, il resto respira piano */
    prop(x: number, y: number, color: number, radius: number, flame: boolean): Phaser.GameObjects.Light | null {
        // phaser rende solo le luci vicine alla camera: il tetto serve alle regioni enormi
        if (this.propCount >= 260) return null;
        this.propCount++;
        const light = this.scene.lights.addLight(x, y, radius, color, flame ? 1.05 : 0.75);
        this.scene.tweens.add({
            targets: light,
            intensity: flame ? { from: 1.05, to: 0.8 } : { from: 0.75, to: 0.55 },
            radius: { from: radius, to: radius * 0.9 },
            duration: flame ? 110 + Math.random() * 200 : 1400 + Math.random() * 900,
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
