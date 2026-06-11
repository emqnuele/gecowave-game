import Phaser from 'phaser';
import { ENEMIES, type EnemyArchetype } from '../content/enemies';
import type { EnemyKind } from '../types';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
    readonly arch: EnemyArchetype;
    hp: number;

    private anchorX: number;
    private anchorY: number;
    private t = Math.random() * 1000;
    private nextActionAt = 0;
    private nextShotAt = 0;
    private facingDir: 1 | -1 = -1;
    private chargingUntil = 0;
    private stunnedUntil = 0;

    constructor(scene: Phaser.Scene, x: number, y: number, kind: EnemyKind) {
        super(scene, x, y, ENEMIES[kind].texture);
        this.arch = ENEMIES[kind];
        this.hp = this.arch.hp;
        this.anchorX = x;
        this.anchorY = y;
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setPipeline('Light2D');

        const body = this.body as Phaser.Physics.Arcade.Body;
        const airborne = this.arch.behavior === 'flyer' || this.arch.behavior === 'turret';
        body.setAllowGravity(!airborne);
        body.setSize(this.width * 0.8, this.height * 0.8);
    }

    /** target = giocatore, o il suo riflesso distorto se attivo */
    update(_time: number, delta: number, target: Phaser.GameObjects.Sprite): void {
        if (!this.active) return;
        this.t += delta;
        const body = this.body as Phaser.Physics.Arcade.Body;
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.hypot(dx, dy);
        const aggro = dist < this.arch.aggroRange;
        const now = this.scene.time.now;

        if (now < this.stunnedUntil) {
            body.setVelocityX(body.velocity.x * 0.9);
            return;
        }

        switch (this.arch.behavior) {
            case 'flyer': {
                if (aggro) {
                    const angle = Math.atan2(dy, dx);
                    body.setVelocity(Math.cos(angle) * this.arch.speed, Math.sin(angle) * this.arch.speed);
                } else {
                    // ronda attorno al punto di spawn
                    body.setVelocity(
                        Math.sin(this.t / 900) * 40,
                        Math.cos(this.t / 700) * 30 + (this.anchorY - this.y) * 0.5
                    );
                }
                this.setFlipX(dx > 0);
                break;
            }
            case 'walker': {
                if (aggro && Math.abs(dy) < 60 && now >= this.nextActionAt && this.arch.lungeSpeed) {
                    body.setVelocityX(Math.sign(dx) * this.arch.lungeSpeed);
                    this.nextActionAt = now + 1400;
                    this.setFlipX(dx > 0);
                } else if (now >= this.nextActionAt - 1000) {
                    if (Math.abs(this.x - this.anchorX) > 90) this.facingDir = this.x > this.anchorX ? -1 : 1;
                    if (body.blocked.left) this.facingDir = 1;
                    if (body.blocked.right) this.facingDir = -1;
                    body.setVelocityX(this.facingDir * this.arch.speed);
                    this.setFlipX(this.facingDir > 0);
                }
                break;
            }
            case 'hopper': {
                if (body.blocked.down && now >= this.nextActionAt) {
                    const dir = aggro ? Math.sign(dx) || 1 : (Math.random() > 0.5 ? 1 : -1);
                    body.setVelocity(dir * this.arch.speed, -460);
                    this.nextActionAt = now + 900 + Math.random() * 600;
                    this.setFlipX(dir > 0);
                }
                if (body.blocked.down) body.setVelocityX(body.velocity.x * 0.85);
                break;
            }
            case 'turret': {
                this.y = this.anchorY + Math.sin(this.t / 600) * 8;
                this.setFlipX(dx > 0);
                if (aggro && now >= this.nextActionAt && this.arch.fireRateMs) {
                    this.nextActionAt = now + this.arch.fireRateMs;
                    this.scene.events.emit('enemy-shoot', { x: this.x, y: this.y + 6, tx: target.x, ty: target.y, color: this.arch.glowColor });
                }
                break;
            }
            case 'chaser': {
                if (aggro) {
                    body.setVelocityX(Math.sign(dx) * this.arch.speed);
                    this.setFlipX(dx > 0);
                    if ((body.blocked.left || body.blocked.right) && body.blocked.down) {
                        body.setVelocityY(-480);
                    }
                } else {
                    body.setVelocityX(body.velocity.x * 0.9);
                }
                break;
            }
            case 'charger': {
                const charging = now < this.chargingUntil;
                if (charging) {
                    // il muro ferma la corsa, e fa male solo a lui
                    if (body.blocked.left || body.blocked.right) {
                        this.chargingUntil = 0;
                        this.stunnedUntil = now + 800;
                        body.setVelocityX(0);
                        this.scene.cameras.main.shake(120, 0.004);
                    }
                } else if (aggro && Math.abs(dy) < 70 && now >= this.nextActionAt) {
                    // telegrafo: trema, poi parte
                    this.nextActionAt = now + 2600;
                    this.setTintFill(0xfacc15);
                    this.setFlipX(dx > 0);
                    this.scene.tweens.add({ targets: this, x: this.x + 3, duration: 50, yoyo: true, repeat: 5 });
                    this.scene.time.delayedCall(380, () => {
                        if (!this.active) return;
                        this.clearTint();
                        this.chargingUntil = this.scene.time.now + 1200;
                        body.setVelocityX(Math.sign(dx) * this.arch.speed);
                    });
                } else {
                    body.setVelocityX(body.velocity.x * 0.92);
                }
                break;
            }
        }

        // chi ha un'arma spara anche in movimento (la torretta fa già da sé)
        if (this.arch.fireRateMs && this.arch.behavior !== 'turret' && aggro && now >= this.nextShotAt) {
            this.nextShotAt = now + this.arch.fireRateMs;
            this.scene.events.emit('enemy-shoot', { x: this.x, y: this.y, tx: target.x, ty: target.y, color: this.arch.glowColor });
        }
    }

    takeDamage(amount: number, fromX: number): void {
        if (!this.active) return;
        this.hp -= amount;
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (this.arch.behavior !== 'charger') {
            body.velocity.x += Math.sign(this.x - fromX) * 240;
        }
        this.setTintFill(0xffffff);
        this.scene.time.delayedCall(70, () => this.active && this.clearTint());
        if (this.hp <= 0) this.die();
    }

    private die(): void {
        const [min, max] = this.arch.barre;
        const amount = Phaser.Math.Between(min, max);
        this.scene.events.emit('enemy-died', {
            x: this.x,
            y: this.y,
            kind: this.arch.kind,
            barre: amount,
            color: this.arch.glowColor,
            splitsInto: this.arch.splitsInto ?? null,
        });
        this.scene.add.particles(this.x, this.y, 'p-spark', {
            speed: { min: 100, max: 280 },
            scale: { start: 1, end: 0 },
            tint: this.arch.glowColor,
            lifespan: 400,
            quantity: 14,
            stopAfter: 14,
        });
        this.destroy();
    }

    stun(duration: number): void {
        this.stunnedUntil = this.scene.time.now + duration;
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0, 0);
    }
}
