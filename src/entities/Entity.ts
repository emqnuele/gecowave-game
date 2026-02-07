import Phaser from 'phaser';

export abstract class Entity extends Phaser.Physics.Arcade.Sprite {
    protected hp: number;
    protected maxHp: number;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, health: number) {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.hp = health;
        this.maxHp = health;

        // Default origin for platformer usually bottom-center, but consistent with rectangles (top-left vs center) is key.
        // Phaser Sprites default to 0.5, 0.5. Let's keep that or adjust.
        // Let's set to 0.5, 0.5 for now and manage positioning carefully.
        this.setOrigin(0.5, 0.5);

        // Ensure physics body is enabled
        this.setCollideWorldBounds(true);

        // Enable Lighting Pipeline
        this.setPipeline('Light2D');
    }

    public takeDamage(amount: number): void {
        if (this.hp <= 0) return;

        this.hp -= amount;

        // Visual feedback (only if active)
        // if (this.active) {
        //     this.scene.tweens.add({
        //         targets: this,
        //         alpha: 0.2, // REMOVED (User Request)
        //         duration: 50,
        //         yoyo: true,
        //         repeat: 1
        //     });
        // }

        if (this.hp <= 0) {
            this.die();
        }
    }

    protected abstract die(): void;

    public destroy(fromScene?: boolean): void {
        // Kill any active tweens on this object
        if (this.scene && this.scene.sys) {
            this.scene.tweens.killTweensOf(this);
        }
        super.destroy(fromScene);
    }
}
