import Phaser from 'phaser';
import { Entity } from './Entity';
import { GRAVITY, PLAYER_SPEED, JUMP_STRENGTH, PLAYER_DRAG, PLAYER_ACCELERATION, ATTACK_COOLDOWN, ATTACK_DURATION } from '../utils/constants';
import { PlayerStats } from '../components/PlayerStats';
import { WaveManager } from '../systems/waves/WaveManager';
import { AnalysisWave } from '../systems/waves/AnalysisWave';
import { DoubleJumpWave } from '../systems/waves/DoubleJumpWave';

export class Player extends Entity {
    private keys!: {
        w: Phaser.Input.Keyboard.Key;
        a: Phaser.Input.Keyboard.Key;
        s: Phaser.Input.Keyboard.Key;
        d: Phaser.Input.Keyboard.Key;
    };
    private jumpKey!: Phaser.Input.Keyboard.Key;

    private canAttack: boolean = true;
    private isAttacking: boolean = false;

    // Attack hitbox
    public attackHitbox: Phaser.GameObjects.Zone;

    // State Flags
    private wasGrounded: boolean = true;
    private isLanding: boolean = false;

    // Components
    public stats: PlayerStats;
    public waveManager: WaveManager;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'player', 100); // 100 HP

        // Physics properties for "heavy" feel
        this.setGravityY(GRAVITY);
        this.setDragX(PLAYER_DRAG);

        // Input setup
        if (scene.input.keyboard) {
            this.keys = {
                w: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
                a: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
                s: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
                d: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
            };
            this.jumpKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

            // Mouse Click for Attack
            scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                if (pointer.leftButtonDown() && this.canAttack) {
                    this.attack();
                }
            });
        }

        // Init Attack Hitbox (inactive by default)
        // This is the "square hitbox in front" the user sees in debug mode. 
        // It represents the melee range.
        this.attackHitbox = scene.add.zone(x, y, 60, 60); // Widen range slightly
        scene.physics.add.existing(this.attackHitbox);
        (this.attackHitbox.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        (this.attackHitbox.body as Phaser.Physics.Arcade.Body).moves = false;
        // Disable it initially
        (this.attackHitbox.body as Phaser.Physics.Arcade.Body).checkCollision.none = true;

        // Initialize Stats
        this.stats = new PlayerStats(scene, 100, 100);

        // Initialize Wave Manager
        this.waveManager = new WaveManager(this, scene, this.stats);

        // Equip default waves
        this.waveManager.equipWave(0, new DoubleJumpWave());
        this.waveManager.equipWave(1, new AnalysisWave());

        // Seed storage with extra waves for inventory display
        this.waveManager.addToStorage(new DoubleJumpWave());
        this.waveManager.addToStorage(new AnalysisWave());

        // Create Animations
        const anims = scene.anims;
        // Idle: Row 0 (0-7) - Slow (Breathing)
        if (!anims.exists('player-idle')) {
            anims.create({ key: 'player-idle', frames: anims.generateFrameNumbers('player', { start: 0, end: 7 }), frameRate: 4, repeat: -1 });
        }
        // Run: Row 1 (8-15)
        if (!anims.exists('player-run')) {
            anims.create({ key: 'player-run', frames: anims.generateFrameNumbers('player', { start: 8, end: 15 }), frameRate: 8, repeat: -1 });
        }
        // Jump Up/Fall: Row 2 (16-19)
        if (!anims.exists('player-jump-up')) {
            anims.create({ key: 'player-jump-up', frames: anims.generateFrameNumbers('player', { start: 16, end: 19 }), frameRate: 8, repeat: 0 });
        }
        // Land: Row 2 (20-23)
        if (!anims.exists('player-land')) {
            anims.create({ key: 'player-land', frames: anims.generateFrameNumbers('player', { start: 20, end: 23 }), frameRate: 8, repeat: 0 });
        }
        // Attack: Row 3. In 700x350 grid:
        // Row 0 (0-3), Row 1 (4-7), Row 2 (8-11), Row 3 (12-15).
        if (!anims.exists('player-attack')) {
            anims.create({ key: 'player-attack', frames: anims.generateFrameNumbers('player_atk', { start: 12, end: 15 }), frameRate: 8, repeat: 0 });
        }

        // Fix Hitbox
        // Hitbox
        // Frame: 350x350 (standard). Scale 0.35 -> ~122x122 visual main body.
        // We want a tight hitbox.
        // Let's settle on Width 50, Height 110. centered.
        // Hitbox
        // Frame: 350x350 (standard). Scale 0.35. Visual feet approx at y=345?
        // User reported "penetrates floor", so we need to raise the visual sprite relative to the body bottom.
        // Increasing BodyBottom relative to distinct Sprite Top (OffsetY + Height) lifts the sprite.
        // Previous (OffsetY+Height) = 325.
        // Let's try 345.
        // Width: 150 (Larger than before).
        // Height: 250.
        // Offset Y: 345 - 250 = 95.
        // Offset X: 350/2 - 150/2 = 175 - 75 = 100.
        this.body!.setSize(150, 250);
        this.body!.setOffset(100, 95);

        // Scale Down for High-Res
        this.setScale(0.35);

        const pipelineManager = scene.renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer
            ? scene.renderer.pipelines
            : null;
        if (pipelineManager && pipelineManager.get('Atmosphere')) {
            this.setPipeline('Atmosphere');
        }

        // Start Idle
        this.play('player-idle');
    }

    update(time: number, delta: number): void {
        if (this.hp <= 0) return;

        // Fall Death Check
        if (this.y > this.scene.physics.world.bounds.height + 100) {
            console.log("Player fell out of world bounds detected at Y:", this.y);
            this.hp = 0;
            this.stats.setHp(0); // Trigger GameScene cleanup
            this.die();
        }

        // Update Managers
        this.stats.update(delta);
        this.waveManager.update(time, delta);

        // Optional: Stop movement if attacking
        if (this.isAttacking) {
            // Allow air movement or not? Let's say yes for fluidity, or no for commitment. 
        }

        const body = this.body as Phaser.Physics.Arcade.Body;
        if (!body) return;

        // Horizontal Movement
        if (this.keys.a.isDown) {
            body.setAccelerationX(-PLAYER_ACCELERATION);
            this.setFlipX(true);
        } else if (this.keys.d.isDown) {
            body.setAccelerationX(PLAYER_ACCELERATION);
            this.setFlipX(false);
        } else {
            body.setAccelerationX(0);
        }

        // Cap velocity
        body.setMaxVelocity(PLAYER_SPEED, 1000); // High Y terminal velocity

        // Jump
        // Check if on floor
        if (this.jumpKey.isDown) {
            if (Phaser.Input.Keyboard.JustDown(this.jumpKey)) {
                if (body.blocked.down) {
                    body.setVelocityY(-JUMP_STRENGTH);
                } else {
                    // Air Jump (Double Jump Check)
                    this.waveManager.triggerJump(time);
                }
            }
        }



        // Animation Logic
        if (this.isAttacking) {
            // Attack animation is handled in this.attack() event or ensures priority
            // Ensure Origin is shifted for 700px sprite (Center of left half = 0.25)
            if (this.originX !== 0.25) {
                this.setOrigin(0.25, 0.5);
            }

            // Only attack if not strictly landing? Or allow attack to cancel landing?
            // "migliorerebbe tantissimo l'immersione" -> prioritize landing visual.
            // But usually Attack > Move > Idle.
            // Let's allow Attack to override Landing (responsiveness).
            if (this.anims.currentAnim?.key !== 'player-attack') {
                this.play('player-attack', true);
            }
        } else {
            // Reset Origin for 350px sprites (Center = 0.5)
            if (this.originX !== 0.5) {
                this.setOrigin(0.5, 0.5);
            }

            const isGrounded = body.blocked.down;

            if (isGrounded) {
                // Just Landed Check
                if (!this.wasGrounded) {
                    this.isLanding = true;
                    this.play('player-land', true);
                    this.once('animationcomplete', (anim: Phaser.Animations.Animation) => {
                        if (anim.key === 'player-land') {
                            this.isLanding = false;
                        }
                    });
                }

                // Grounded Logic
                if (this.isLanding) {
                    // Holding landing animation
                    // Optional: Allow running to cancel landing? 
                    // User said: "appena... tocca terra... continua... POI riprende idle". 
                    // This implies the sequence is desired.
                    // However, if player moves, it might look like sliding.
                    // If velocity.x != 0, usually we switch to Run.
                    // Let's TRY allowing Run to interrupt Landing for responsiveness, 
                    // BUT if velocity is small, play full landing.
                    if (Math.abs(body.velocity.x) > 10) {
                        this.isLanding = false; // Cancel landing if moving fast
                        this.play('player-run', true);
                    } else {
                        // Ensure landing is playing (if not interrupted by attack previously)
                        if (this.anims.currentAnim?.key !== 'player-land') {
                            this.play('player-land', true);
                        }
                    }
                } else {
                    // Standard Ground Movement
                    if (body.velocity.x !== 0) {
                        this.play('player-run', true);
                    } else {
                        this.play('player-idle', true);
                    }
                }
            } else {
                // Airborne
                this.isLanding = false; // Cancel landing state if we fall/jump
                // Avoid restarting the animation if it's already "player-jump-up".
                // Even nicely handled by 'true', if it finishes, Phaser might restart it.
                if (this.anims.currentAnim?.key !== 'player-jump-up') {
                    this.play('player-jump-up', true);
                }
            }

            this.wasGrounded = isGrounded;
        }

        // Update Hitbox position to follow player
        // Offset based on direction (adjust for new 160 width)
        // If flipX, offset might need to be inverted relative to center?
        // Phaser handles setOffset with FlipX automatically usually, but let's check.
        // If flipX is true, the texture is flipped around the center.
        // Our Body is offset (64, 110).
        // If flipped, the offset remains relative to top-left of the sprite?
        // Actually, with setOffset, it should work fine if the sprite is centered.
        // But if manually adjusting position of *Attack Hitbox* (Zone):
        const offsetX = this.flipX ? -40 : 40;
        this.attackHitbox.setPosition(this.x + offsetX, this.y);
    }

    private attack(): void {
        this.canAttack = false;
        this.isAttacking = true;
        // Origin shift handled in update loop for robustness, but set here for instant response
        this.setOrigin(0.25, 0.5);
        this.play('player-attack', true);

        // Enable hitbox
        const body = this.attackHitbox.body as Phaser.Physics.Arcade.Body;
        body.checkCollision.none = false;

        // Visual debug for attack (white arc/rect)
        const graphics = this.scene.add.graphics();
        // graphics.fillStyle(0xffffff, 0.5);
        // ... debug visuals ...

        // Wait for animation absolute completion for state reset
        this.once('animationcomplete', (anim: Phaser.Animations.Animation) => {
            if (anim.key === 'player-attack') {
                this.isAttacking = false;
                // Ensure we go back to idle/run immediately
                this.play('player-idle'); // Fallback, update loop corrects it
            }
        });

        // Duration of active hitbox (Matches logic or visual)
        this.scene.time.delayedCall(ATTACK_DURATION, () => {
            body.checkCollision.none = true; // Disable hitbox
            // Note: isAttacking is handled by animation complete now
            graphics.destroy();
            this.clearTint();
        });

        // Cooldown
        this.scene.time.delayedCall(ATTACK_COOLDOWN, () => {
            this.canAttack = true;
        });
    }

    // Override takeDamage to sync stats
    // Override takeDamage to sync stats
    public takeDamage(amount: number): void {
        super.takeDamage(amount);
        // Sync stats and notify UI
        this.stats.setHp(this.hp);
    }

    protected die(): void {
        this.setActive(false);
        this.setVisible(false);
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (body) body.enable = false;

        console.log("Player died (Entity method). awaiting GameScene handler.");
        // Do NOT restart scene here. GameScene handles it.
    }
}
