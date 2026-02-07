import Phaser from 'phaser';

export class Projectile extends Phaser.Physics.Arcade.Sprite {
    protected damage: number;
    protected lifespan: number;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, damage: number = 10) {
        super(scene, x, y, texture);

        // Note: Logic moved to WaveManager/GameScene. 
        // We do NOT add to scene/physics here to avoid conflicts with Groups.

        this.damage = damage;
        this.lifespan = 5000; // Default 5s max life

        // Set physics properties
        // NOTE: Body is null here if we don't add to scene. 
        // We must configure this AFTER adding to group.
        // (this.body as Phaser.Physics.Arcade.Body).allowGravity = false;
        // (this.body as Phaser.Physics.Arcade.Body).setImmovable(true); // OBS: Removed causing static behavior?

        console.log(`Projectile spawned at ${x},${y}`);
    }

    public initPhysics(): void {
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (body) {
            body.allowGravity = false;
            // body.setImmovable(true);
        }
    }

    update(_time: number, delta: number): void {
        // super.update(time, delta); // Do not call super.update() on Arcade.Sprite unless you know it exists/updates something vital.
        // It often doesn't exist in standard Phaser types for this chain.

        this.lifespan -= delta;

        // Destroy if out of bounds (approximate based on typical level size or camera)
        // Better: Use checkWorldBounds if set, or manual check.
        if (this.lifespan <= 0 || !this.scene.physics.world.bounds.contains(this.x, this.y)) {
            this.destroy();
        }
    }

    public getDamage(): number {
        return this.damage;
    }

    public onHit(): void {
        console.log("Projectile onHit called");
        this.setActive(false);
        this.setVisible(false);

        if (this.body) {
            this.body.enable = false;
            this.body.stop(); // Stop movement
        }

        // Defer actual destroy to avoid physics loop errors
        this.scene.time.delayedCall(1, () => {
            console.log("Projectile destroying");
            this.destroy();
        });
    }
}
