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
    private facingDir: 1 | -1 = -1;

    constructor(scene: Phaser.Scene, x: number, y: number, kind: EnemyKind) {
        super(scene, x, y, ENEMIES[kind].texture);
        this.arch = ENEMIES[kind];
        this.hp = this.arch.hp;
        this.anchorX = x;
        this.anchorY = y;
        scene.add.existing(this);
        scene.physics.add.existing(this);

        const body = this.body as Phaser.Physics.Arcade.Body;
        const airborne = this.arch.behavior === 'flyer' || this.arch.behavior === 'turret';
        body.setAllowGravity(!airborne);
        body.setSize(this.width * 0.8, this.height * 0.8);
        if (!airborne) body.setBounce(0, 0);
    }

    update(_time: number, delta: number, player: Phaser.GameObjects.Sprite): void {
        if (!this.active) return;
        this.t += delta;
        const body = this.body as Phaser.Physics.Arcade.Body;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);
        const aggro = dist < this.arch.aggroRange;
        const now = this.scene.time.now;

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
                    body.setVelocity(dir * this.arch.speed, -480);
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
                    this.scene.events.emit('enemy-shoot', { x: this.x, y: this.y + 6, tx: player.x, ty: player.y });
                }
                break;
            }
            case 'chaser': {
                if (aggro) {
                    body.setVelocityX(Math.sign(dx) * this.arch.speed);
                    this.setFlipX(dx > 0);
                    if ((body.blocked.left || body.blocked.right) && body.blocked.down) {
                        body.setVelocityY(-520);
                    }
                } else {
                    body.setVelocityX(body.velocity.x * 0.9);
                }
                break;
            }
        }
    }

    takeDamage(amount: number, fromX: number): void {
        if (!this.active) return;
        this.hp -= amount;
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.velocity.x += Math.sign(this.x - fromX) * 240;
        this.setTintFill(0xffffff);
        this.scene.time.delayedCall(70, () => this.active && this.clearTint());
        if (this.hp <= 0) this.die();
    }

    private die(): void {
        const [min, max] = this.arch.barre;
        const amount = Phaser.Math.Between(min, max);
        this.scene.events.emit('enemy-died', { x: this.x, y: this.y, barre: amount, color: this.arch.glowColor });
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
}
