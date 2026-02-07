import Phaser from 'phaser';
import { Projectile } from './Projectile';

export class MathProjectile extends Projectile {
    constructor(scene: Phaser.Scene, x: number, y: number, direction: number) {
        // Using a built-in texture or creating one if possible. 
        // For MVP, we assume a texture 'projectile' exists or we use 'ground'/Color.
        // If 'projectile' doesn't exist, we can use a graphics object to generate a texture, 
        // OR just use a simple placeholder from existing assets like 'ground' scaled down.
        // Let's assume 'ground' exists from the previous steps, but we can make a dynamic texture if needed.
        // Actually, let's just make a graphics square if we can't ensure assets.
        // But `Sprite` needs a key. Let's try 'ground' and tint it yellow.
        super(scene, x, y, 'ground', 20); // 20 Damage

        this.setScale(0.5, 0.5); // Smaller than ground
        this.setTint(0xFFFF00); // Yellow
        this.setFlipX(direction === -1);
    }
}
