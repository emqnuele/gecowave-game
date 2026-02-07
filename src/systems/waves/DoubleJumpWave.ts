import Phaser from 'phaser';
import { BaseWave } from './BaseWave';
import { Player } from '../../entities/Player';
import { JUMP_STRENGTH } from '../../utils/constants';

export class DoubleJumpWave extends BaseWave {
    constructor() {
        super('double_jump_wave', 'Double Jump', 15, 500); // 15 Mana, 0.5s Cooldown
    }

    public activate(player: Player, scene: Phaser.Scene): void {
        this.isActive = !this.isActive;
        const status = this.isActive ? "ENABLED" : "DISABLED";
        console.log(`Double Jump ${status}`);

        // Visual Feedback for Toggle
        const text = scene.add.text(player.x, player.y - 50, `Double Jump: ${status}`, {
            fontSize: '16px',
            color: this.isActive ? '#00ff00' : '#ff0000',
            stroke: '#000000',
            strokeThickness: 3
        });
        scene.tweens.add({
            targets: text,
            y: player.y - 100,
            alpha: 0,
            duration: 1000,
            onComplete: () => text.destroy()
        });
    }

    public onJump(player: Player, scene: Phaser.Scene): void {
        if (!this.isActive) return;

        if (player.stats.currentMana < this.manaCost) {
            return;
        }

        player.stats.modifyMana(-this.manaCost);

        const body = player.body as Phaser.Physics.Arcade.Body;
        if (body) {
            body.setVelocityY(-JUMP_STRENGTH);

            // Visual Effects: Little white puff exactly at feet (y + 55)
            const particles = scene.add.particles(player.x, player.y + 55, 'particle', {
                speed: { min: 50, max: 150 },
                angle: { min: 220, max: 320 }, // Mostly upwards
                scale: { start: 0.6, end: 0 },
                lifespan: 200,
                alpha: { start: 0.8, end: 0 },
                emitting: false
            });

            particles.explode(6);
            scene.time.delayedCall(300, () => particles.destroy());

            // Minimal White Pulse
            const graphics = scene.add.graphics({ x: player.x, y: player.y + 55 });
            graphics.lineStyle(2, 0xffffff, 0.4);
            graphics.strokeCircle(0, 0, 20);
            scene.tweens.add({
                targets: graphics,
                scale: 1.5,
                alpha: 0,
                duration: 150,
                onComplete: () => graphics.destroy()
            });
        }
    }
}
