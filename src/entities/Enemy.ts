import Phaser from 'phaser';
import { Entity } from './Entity';

export class Enemy extends Entity {
    private direction: number = 1;
    private moveSpeed: number = 100;
    private startX: number;
    private patrolRange: number = 150;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'enemy', 30); // 30 HP
        this.startX = x;
        this.setGravityY(1000); // Standard gravity
        this.setImmovable(false); // Can be pushed? Maybe not for simple enemies. Let's make them normal.
        // If we want them to push the player, they need mass.
        // For now, simple patroller.
    }

    update(_time: number, _delta: number): void {
        if (this.hp <= 0) return;

        this.setVelocityX(this.moveSpeed * this.direction);

        // Simple patrol based on distance
        if (this.x > this.startX + this.patrolRange) {
            this.direction = -1;
        } else if (this.x < this.startX - this.patrolRange) {
            this.direction = 1;
        }
    }

    protected die(): void {
        this.scene.tweens.killTweensOf(this); // Ensure flash tween stops

        this.setActive(false);
        this.setVisible(false);

        if (this.body) {
            this.body.enable = false;
            this.body.stop();
        }

        this.scene.time.delayedCall(1, () => {
            this.destroy();
        });
    }
}
