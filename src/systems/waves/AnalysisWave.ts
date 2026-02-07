import Phaser from 'phaser';
import { BaseWave } from './BaseWave';
import { Player } from '../../entities/Player';
import { MathProjectile } from '../../entities/projectiles/MathProjectile';
// We need to reference GameScene to access the 'projectiles' group if we want strict typing,
// but for strict decoupling, we can just rely on the Scene to have a way, or finding it.
// However, the cleanest way in Phaser is for the object to add itself to the scene's list OR
// for us to cast the scene.
import { GameScene } from '../../scenes/GameScene';

export class AnalysisWave extends BaseWave {
    constructor() {
        super('analysis_wave', 'Analysis Wave', 20, 1000); // 20 Mana, 1s Cooldown
    }

    public activate(player: Player, scene: Phaser.Scene): void {
        // Calculate spawn position (slightly in front of player)
        const direction = player.flipX ? -1 : 1;
        const spawnX = player.x + (direction * 40);
        const spawnY = player.y;

        const projectile = new MathProjectile(scene, spawnX, spawnY, direction);

        // Add to GameScene projectiles group for collision
        if (scene instanceof GameScene) {
            (scene as GameScene).addProjectile(projectile);

            // Initialize Physics properties (now that body exists)
            projectile.initPhysics();

            // Re-apply velocity here to ensure it's picked up by the physics body of the group
            // Sometimes adding to a group resets the body.
            const speed = 400;
            projectile.setVelocityX(speed * direction);
        }
    }
}
