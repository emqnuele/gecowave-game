import Phaser from 'phaser';
import type { BiomeDef } from '../content/biomes';
import { rng } from './rng';

interface TrackedLight {
    light: Phaser.GameObjects.Light;
    target: Phaser.GameObjects.Sprite;
    /** la luce sta sopra la creatura: con le normal map la modella dall'alto come nei dipinti */
    dx: number;
    dy: number;
}

/* il buio è il vero protagonista: ambiente quasi nero,
   ogni cosa viva porta la sua luce */
export class LightingManager {
    private scene: Phaser.Scene;
    private tracked: TrackedLight[] = [];
    /** tremolii registrati: si congelano fuori vista, si uccidono alla rimozione */
    private anims: { light: Phaser.GameObjects.Light; tw: Phaser.Tweens.Tween }[] = [];
    private torchCount = 0;
    private propCount = 0;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    enable(biome: BiomeDef): void {
        this.scene.lights.enable();
        const rim = Phaser.Display.Color.IntegerToColor(biome.rim);
        // ambiente scurissimo ma tinto dal bioma: le sagome si leggono, i dettagli no
        // nelle regioni si gioca anche sotto terra: un filo di luce in più, il buio resta buio
        const k = biome.ambient * 3.4;
        const ambient = Phaser.Display.Color.GetColor(
            Math.round(6 + rim.red * k),
            Math.round(6 + rim.green * k),
            Math.round(9 + rim.blue * k),
        );
        this.scene.lights.setAmbientColor(ambient);
    }

    playerLight(target: Phaser.GameObjects.Sprite): Phaser.GameObjects.Light {
        const light = this.scene.lights.addLight(target.x, target.y, 400, 0xaaffdd, 1.35);
        this.tracked.push({ light, target, dx: 0, dy: 0 });
        return light;
    }

    follow(target: Phaser.GameObjects.Sprite, color: number, radius = 150, intensity = 0.8, dy = 0, dx = 0): Phaser.GameObjects.Light {
        const light = this.scene.lights.addLight(target.x + dx, target.y + dy, radius, color, intensity);
        this.tracked.push({ light, target, dx, dy });
        this.anims.push({
            light,
            tw: this.scene.tweens.add({
                targets: light,
                intensity: { from: intensity, to: intensity * 0.72 },
                radius: { from: radius, to: radius * 0.86 },
                duration: 500 + rng.fx.next() * 500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
            }),
        });
        return light;
    }

    torch(x: number, y: number, color = 0xffaa33): Phaser.GameObjects.Light | null {
        // troppe luci uccidono il framerate e il mistero
        if (this.torchCount >= 9) return null;
        this.torchCount++;
        const light = this.scene.lights.addLight(x, y, 240, color, 1.0);
        this.anims.push({
            light,
            tw: this.scene.tweens.add({
                targets: light,
                intensity: { from: 1.0, to: 0.78 },
                radius: { from: 240, to: 215 },
                duration: 120 + rng.fx.next() * 220,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
            }),
        });
        return light;
    }

    /** luce di un oggetto di scena: le fiamme tremano, il resto respira piano */
    prop(x: number, y: number, color: number, radius: number, flame: boolean): Phaser.GameObjects.Light | null {
        // phaser rende solo le luci vicine alla camera: il tetto serve alle regioni enormi
        if (this.propCount >= 260) return null;
        this.propCount++;
        const light = this.scene.lights.addLight(x, y, radius, color, flame ? 1.05 : 0.75);
        this.anims.push({
            light,
            tw: this.scene.tweens.add({
                targets: light,
                intensity: flame ? { from: 1.05, to: 0.8 } : { from: 0.75, to: 0.55 },
                radius: { from: radius, to: radius * 0.9 },
                duration: flame ? 110 + rng.fx.next() * 200 : 1400 + rng.fx.next() * 900,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
            }),
        });
        return light;
    }

    static(x: number, y: number, color: number, radius = 180, intensity = 0.9): Phaser.GameObjects.Light {
        return this.scene.lights.addLight(x, y, radius, color, intensity);
    }

    remove(light: Phaser.GameObjects.Light | null): void {
        if (!light) return;
        const ai = this.anims.findIndex((a) => a.light === light);
        if (ai >= 0) {
            // prima il tween girava per sempre anche a luce rimossa
            this.anims[ai].tw.stop();
            this.anims.splice(ai, 1);
        }
        this.scene.lights.removeLight(light);
        this.tracked = this.tracked.filter((t) => t.light !== light);
    }

    update(): void {
        // i tremolii lontani si congelano: nessuno li vede, ripartono al rientro
        const v = this.scene.cameras.main.worldView;
        const m = 320;
        for (const a of this.anims) {
            const inside = a.light.x > v.x - m && a.light.x < v.x + v.width + m && a.light.y > v.y - m && a.light.y < v.y + v.height + m;
            if (inside) {
                if (!a.tw.isPlaying()) a.tw.resume();
            } else if (a.tw.isPlaying()) {
                a.tw.pause();
            }
        }
        for (let i = this.tracked.length - 1; i >= 0; i--) {
            const { light, target, dx, dy } = this.tracked[i];
            if (!target.active) {
                light.setIntensity(Math.max(0, light.intensity - 0.08));
                if (light.intensity <= 0) {
                    this.scene.lights.removeLight(light);
                    this.tracked.splice(i, 1);
                }
            } else {
                light.setPosition(target.x + (target.flipX ? -dx : dx), target.y + dy);
            }
        }
    }
}
