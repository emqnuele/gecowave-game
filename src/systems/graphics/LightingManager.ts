import Phaser from 'phaser';

export class LightingManager {
    private scene: Phaser.Scene;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    public enable(): void {
        this.scene.lights.enable();
        // Deep Blue/Black Ambient
        this.scene.lights.setAmbientColor(0x050510);
        console.log('[LightingManager] Lights enabled. Ambient set to Deep Blue.');
    }

    public addPlayerLight(player: Phaser.GameObjects.GameObject): Phaser.GameObjects.Light {
        // Soul Glow (Cyan/White)
        const light = this.scene.lights.addLight(0, 0, 300, 0xAAFFFF, 1.2);

        // Track player
        this.scene.events.on('update', () => {
            if (player.active) {
                const body = player.body as Phaser.Physics.Arcade.Body;
                // Lights use center?
                if (body) {
                    light.setPosition(body.center.x, body.center.y);
                }
            } else {
                light.setVisible(false);
            }
        });

        return light;
    }

    public addTorch(x: number, y: number): Phaser.GameObjects.Light {
        // Orange flickering light
        const light = this.scene.lights.addLight(x, y, 250, 0xFFAA00, 1.0);

        // Flicker effect
        this.scene.tweens.add({
            targets: light,
            intensity: { from: 1.0, to: 0.8 },
            radius: { from: 250, to: 230 },
            duration: 100 + Math.random() * 200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        return light;
    }

    public addEnemyLight(enemy: Phaser.GameObjects.GameObject): Phaser.GameObjects.Light {
        // Malevolent Red Glow
        const light = this.scene.lights.addLight(0, 0, 150, 0xFF3333, 0.8);

        // Track enemy
        this.scene.events.on('update', () => {
            if (enemy.active) {
                const body = enemy.body as Phaser.Physics.Arcade.Body;
                if (body) {
                    light.setPosition(body.center.x, body.center.y);
                }
            } else {
                light.setVisible(false);
            }
        });

        // Subtle pulse for enemies
        this.scene.tweens.add({
            targets: light,
            intensity: { from: 0.8, to: 0.6 },
            radius: { from: 150, to: 130 },
            duration: 500 + Math.random() * 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        return light;
    }

    public applyPipeline(layer: Phaser.GameObjects.Layer | Phaser.GameObjects.Sprite | Phaser.GameObjects.Image | Phaser.Tilemaps.TilemapLayer): void {
        // Cast to any to access setPipeline safely if types are strict
        (layer as any).setPipeline('Light2D');
    }
}
