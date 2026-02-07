import Phaser from 'phaser';
import { Player } from '../entities/Player';
import type { StatKey } from '../components/PlayerStats';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/projectiles/Projectile';
import { MapManager } from '../systems/map/MapManager';
import { DecorationManager } from '../systems/map/DecorationManager';
import { ParallaxManager } from '../systems/map/ParallaxManager';
import { LightingManager } from '../systems/graphics/LightingManager';
import { ParticleManager } from '../systems/graphics/ParticleManager';

export class GameScene extends Phaser.Scene {
    private player!: Player;
    private enemies!: Phaser.GameObjects.Group;
    public projectiles!: Phaser.GameObjects.Group;

    private mapManager!: MapManager;
    private decorationManager!: DecorationManager;
    private parallaxManager!: ParallaxManager;
    private lightingManager!: LightingManager;
    private particleManager!: ParticleManager;

    private escapeKey!: Phaser.Input.Keyboard.Key;
    private isGameOver: boolean = false;

    constructor() {
        super('GameScene');
    }

    preload() {
        // Custom shader pipelines are no longer directly supported in modern Phaser 3.
        // Apply atmosphere effects via camera post-processing instead.
    }

    create() {
        console.log('GameScene.create started');
        try {
            this.isGameOver = false;
            this.physics.resume();

            this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);

            // --- GRAPHICS & ATMOSPHERE ---
            this.lightingManager = new LightingManager(this);
            this.lightingManager.enable();

            this.particleManager = new ParticleManager(this);
            this.particleManager.createDust();
            // 1. Setup Level
            this.mapManager = new MapManager(this);
            this.mapManager.createLevel('level2');

            // 2. Parallax
            this.parallaxManager = new ParallaxManager(this);
            const theme = this.mapManager.getMapProperty('theme') || 'default';
            this.parallaxManager.loadTheme(theme);

            // 3. Projectiles
            this.projectiles = this.physics.add.group({
                runChildUpdate: true
            });

            // 4. Player
            const SCALE_FACTOR = 0.2;
            const spawnPoint = this.mapManager.getMap().findObject("Objects", obj => obj.name === "PlayerSpawn");
            const startX = spawnPoint ? (spawnPoint.x! * SCALE_FACTOR) : 100;
            const startY = spawnPoint ? (spawnPoint.y! * SCALE_FACTOR) : 100;

            this.player = new Player(this, startX, startY);

            // Add Player Light ("Soul Glow")
            this.lightingManager.addPlayerLight(this.player);

            // Spawn Torches
            const objectLayer = this.mapManager.getMap().getObjectLayer('Objects');
            if (objectLayer) {
                objectLayer.objects.forEach(obj => {
                    if (obj.name === 'Torch') {
                        // Tiled objects are 160px based, scale to 0.2
                        const tx = (obj.x || 0) * SCALE_FACTOR;
                        const ty = (obj.y || 0) * SCALE_FACTOR;
                        this.lightingManager.addTorch(tx, ty);
                    }
                });
            }

            this.enemies = this.add.group();
            const enemy1 = new Enemy(this, 600, 400);
            this.enemies.add(enemy1);
            this.lightingManager.addEnemyLight(enemy1);

            // 5. Collisions
            const platformsLayer = this.mapManager.getPlatformsLayer();
            this.physics.add.collider(this.player, platformsLayer);
            this.physics.add.collider(this.enemies, platformsLayer);

            // 6. Interactions
            this.physics.add.overlap(this.player.attackHitbox, this.enemies, this.handleAttackHit, undefined, this);
            this.physics.add.overlap(this.player, this.enemies, this.handlePlayerHit, undefined, this);
            this.physics.add.overlap(this.projectiles, this.enemies, this.handleProjectileHit, undefined, this);
            this.physics.add.collider(this.projectiles, platformsLayer, this.handleProjectileWallHit, undefined, this);

            // 7. Camera & Post-FX
            this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
            this.cameras.main.setZoom(1.5);

            // Vignette (Dark borders)
            if (this.cameras.main.postFX) {
                this.cameras.main.postFX.addVignette(0.5, 0.5, 0.8);
            }
            // Bloom (Glow)
            if (this.cameras.main.postFX) {
                // this.cameras.main.postFX.addBloom(0xffffff, 1, 1, 1.2, 1.0); // Can be expensive, perform test
            }

            console.log('[GameScene] Camera and FX setup complete');

            // 8. Launch UI
            const activeWave = this.player.waveManager.getActiveWave();
            this.scene.launch('UIScene', {
                hp: this.player.stats.hp,
                maxHp: this.player.stats.maxHp,
                mana: this.player.stats.mana,
                maxMana: this.player.stats.maxMana,
                waveName: activeWave ? activeWave.name : 'Empty',
                selectedSlot: this.player.waveManager.getSelectedSlot(),
                loadout: this.player.waveManager.getLoadoutNames(),
                loadoutSummary: this.player.waveManager.getLoadoutSummary(),
                storage: this.player.waveManager.getStorageNames(),
                storageSummary: this.player.waveManager.getStorageSummary(),
                progression: this.player.stats.getProgressionSnapshot()
            });

            // UI -> Game events
            this.events.on('ui-allocate-stat', this.handleStatAllocation, this);
            this.events.on('ui-equip-wave', this.handleEquipWave, this);
            this.events.on('ui-unequip-wave', this.handleUnequipWave, this);
            this.events.on('ui-select-wave-slot', this.handleSelectWaveSlot, this);

            // 1.5 Decoration (after camera is configured)
            this.decorationManager = new DecorationManager(this);
            const layerForDecoration = this.mapManager.getPlatformsLayer();
            if (layerForDecoration) {
                this.decorationManager.decorateLevel(layerForDecoration);
            }

            // 9. Input
            this.escapeKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

            // Debug Toggle (F1)
            this.input.keyboard!.on('keydown-F1', () => {
                this.toggleDebug();
            });

            console.log('GameScene.create finished successfully');
        } catch (error) {
            console.error('CRITICAL ERROR in GameScene.create:', error);
        }
    }

    update(time: number, delta: number) {
        if (this.isGameOver) return;

        if (this.isGameOver) return;

        if (this.parallaxManager) {
            this.parallaxManager.update();
        }

        if (this.decorationManager) {
            this.decorationManager.update();
        }


        if (this.player) {
            this.player.update(time, delta);

            // Check for Death
            // Player might deactivate itself via Die(), so we check stats or active state
            if (this.player.stats.hp <= 0) {
                this.handlePlayerDeath();
            }
        }

        if (this.enemies) {
            this.enemies.getChildren().forEach((child: Phaser.GameObjects.GameObject) => {
                if (child.active) {
                    (child as Enemy).update(time, delta);
                }
            });
        }

        // Check Pause
        if (Phaser.Input.Keyboard.JustDown(this.escapeKey)) {
            this.scene.pause();
            this.scene.launch('PauseScene');
            this.scene.bringToTop('PauseScene');
        }
    }

    private handlePlayerDeath() {
        if (this.isGameOver) return;
        this.isGameOver = true;

        console.log('Player died! Initiating death sequence...');

        // 1. Disable Player
        this.player.setActive(false);
        // Keep body for physics to preventing falling through world immediately if we want, 
        // but User asked to "Pause physics".

        // 2. Pause Physics - This pauses Arcade Physics, so falling stops.
        this.physics.pause();

        // 3. Tint Red
        this.player.setTint(0xff0000);

        // 4. Wait 100ms then Game Over (Almost instant)
        this.time.delayedCall(100, () => {
            console.log('Time up! Launching GameOverScene...');

            // Stop UI scene so it doesn't overlap
            if (this.scene.isActive('UIScene')) {
                this.scene.stop('UIScene');
            }

            // Launch Game Over
            this.scene.launch('GameOverScene');
            this.scene.bringToTop('GameOverScene');

            // Pause this scene so it stops updating/rendering changes (but keeps last frame)
            this.scene.pause();

            console.log('GameOverScene launched.');
        });
    }

    private handleAttackHit(_hitbox: any, enemy: any) {
        // Ensure types
        const e = enemy as Enemy;
        e.takeDamage(10);
    }

    private handlePlayerHit(player: any, _enemy: any) {
        const p = player as Player;
        // Only take damage if alive
        if (p.stats.hp > 0) {
            p.takeDamage(10);
        }
    }

    public addProjectile(projectile: Phaser.GameObjects.GameObject) {
        this.projectiles.add(projectile);
    }

    private handleProjectileHit(projectile: any, enemy: any) {
        try {
            let p: Projectile | null = null;
            let e: Enemy | null = null;

            // Robust Type Checking
            if (projectile instanceof Projectile) {
                p = projectile;
            } else if (projectile instanceof Enemy) {
                e = projectile;
            }

            if (enemy instanceof Projectile) {
                p = enemy;
            } else if (enemy instanceof Enemy) {
                e = enemy;
            }

            // Fallback for simple property checks if instanceof fails
            if (!p) {
                if (typeof (projectile as any).getDamage === 'function') p = projectile;
                else if (typeof (enemy as any).getDamage === 'function') p = enemy;
            }
            if (!e) {
                if (typeof (projectile as any).takeDamage === 'function' && typeof (projectile as any).die === 'function') e = projectile;
                else if (typeof (enemy as any).takeDamage === 'function' && typeof (enemy as any).die === 'function') e = enemy;
            }

            if (!p || !e) return;
            if (!p.active || !e.active) return;

            // Collision Resolved
            if (p.body) p.body.enable = false;
            p.onHit();
            e.takeDamage(p.getDamage());

        } catch (err) {
            console.error("Collision error:", err);
        }
    }

    private handleProjectileWallHit(projectile: any, _platform: any) {
        const p = projectile as import('../entities/projectiles/Projectile').Projectile;
        p.onHit();
    }

    private toggleDebug() {
        if (this.physics.world.drawDebug) {
            this.physics.world.drawDebug = false;
            this.physics.world.debugGraphic.clear();
        } else {
            this.physics.world.drawDebug = true;
        }
        console.log(`[GameScene] Physics Debug toggled: ${this.physics.world.drawDebug}`);
    }

    private shutdown() {
        console.log('[GameScene] Shutting down...');

        // 1. Cleanup Player
        if (this.player) {
            this.player.destroy();
        }

        // 2. Cleanup Enemies
        try {
            if (this.enemies && this.enemies.active) {
                this.enemies.clear(true, true);
                this.enemies.destroy();
            }
        } catch (e) {
            console.warn('Error clearing enemies group:', e);
        }

        // 3. Cleanup Projectiles
        try {
            if (this.projectiles && this.projectiles.active) {
                this.projectiles.clear(true, true);
                this.projectiles.destroy();
            }
        } catch (e) {
            console.warn('Error clearing projectiles group:', e);
        }

        // 4. Cleanup Map
        // 4. Cleanup Map (and Parallax)
        if (this.mapManager) {
            this.mapManager.destroy();
        }
        if (this.decorationManager) {
            this.decorationManager.destroy();
        }
        if (this.parallaxManager) {
            this.parallaxManager.destroy();
        }

        // 5. Cleanup Inputs
        if (this.escapeKey) {
            this.input.keyboard!.removeKey(this.escapeKey);
        }
        this.input.keyboard!.removeAllKeys();

        // 6. Cleanup Events
        this.events.off('ui-allocate-stat', this.handleStatAllocation, this);
        this.events.off('ui-equip-wave', this.handleEquipWave, this);
        this.events.off('ui-unequip-wave', this.handleUnequipWave, this);
        this.events.off('ui-select-wave-slot', this.handleSelectWaveSlot, this);
        this.events.off(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);

        console.log('[GameScene] Shutdown complete.');
    }

    private handleStatAllocation(data: { stat: StatKey }) {
        if (!this.player || !data || !data.stat) return;
        this.player.stats.spendStatPoint(data.stat);
    }

    private handleEquipWave(data: { storageIndex: number; equipSlot: number }) {
        if (!this.player) return;
        this.player.waveManager.equipWaveFromStorage(data.storageIndex, data.equipSlot);
    }

    private handleUnequipWave(data: { equipSlot: number }) {
        if (!this.player) return;
        this.player.waveManager.unequipWave(data.equipSlot);
    }

    private handleSelectWaveSlot(data: { equipSlot: number }) {
        if (!this.player) return;
        this.player.waveManager.setSelectedSlot(data.equipSlot);
    }
}
