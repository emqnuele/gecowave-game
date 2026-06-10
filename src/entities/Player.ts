import Phaser from 'phaser';
import { COMBAT, PHYSICS } from '../config';
import { bus } from '../engine/events';
import { sfx } from '../engine/sfx';
import { state } from '../engine/state';

export type AttackDir = 'side' | 'up' | 'down';

export class Player extends Phaser.Physics.Arcade.Sprite {
    facing: 1 | -1 = 1;
    dead = false;
    attackHitbox: Phaser.GameObjects.Zone;
    attackDir: AttackDir = 'side';
    attackActive = false;

    private keys!: Record<'left' | 'right' | 'up' | 'down' | 'jump' | 'attack' | 'dash' | 'dash2' | 'heal' | 'verso', Phaser.Input.Keyboard.Key>;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

    private coyoteUntil = 0;
    private jumpBufferedUntil = 0;
    private airJumpUsed = false;
    private dashing = false;
    private dashUntil = 0;
    private dashCooldownUntil = 0;
    private attackCooldownUntil = 0;
    private attackActiveUntil = 0;
    private invulnUntil = 0;
    private healHeldMs = 0;
    private runAnimTimer = 0;
    private runFrame = 0;
    private wasGrounded = true;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'geco-idle');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(30, 26);
        body.setOffset(17, 12);
        body.setMaxVelocityY(PHYSICS.maxFallSpeed);

        this.attackHitbox = scene.add.zone(x, y, COMBAT.attackRange, 44);
        scene.physics.add.existing(this.attackHitbox);
        const hb = this.attackHitbox.body as Phaser.Physics.Arcade.Body;
        hb.setAllowGravity(false);
        hb.moves = false;

        const kb = scene.input.keyboard!;
        this.cursors = kb.createCursorKeys();
        this.keys = {
            left: kb.addKey('A'),
            right: kb.addKey('D'),
            up: kb.addKey('W'),
            down: kb.addKey('S'),
            jump: kb.addKey('SPACE'),
            attack: kb.addKey('J'),
            dash: kb.addKey('SHIFT'),
            dash2: kb.addKey('K'),
            heal: kb.addKey('Q'),
            verso: kb.addKey('F'),
        };

        scene.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
            if (p.leftButtonDown()) this.tryAttack();
        });

        this.emitVitals(false);
    }

    get invulnerable(): boolean {
        return this.dashing || this.scene.time.now < this.invulnUntil;
    }

    private get grounded(): boolean {
        const body = this.body as Phaser.Physics.Arcade.Body;
        return body.blocked.down;
    }

    private emitVitals(hurt: boolean): void {
        bus.emit('hp-changed', { hp: state.run.hp, maxHp: COMBAT.maxHp, hurt });
        bus.emit('flow-changed', { flow: state.run.flow, maxFlow: COMBAT.maxFlow });
    }

    update(_time: number, delta: number): void {
        if (this.dead) return;
        const now = this.scene.time.now;
        const body = this.body as Phaser.Physics.Arcade.Body;

        const left = this.keys.left.isDown || this.cursors.left.isDown;
        const right = this.keys.right.isDown || this.cursors.right.isDown;
        const upHeld = this.keys.up.isDown || this.cursors.up.isDown;
        const downHeld = this.keys.down.isDown || this.cursors.down.isDown;

        if (this.grounded) {
            this.coyoteUntil = now + PHYSICS.coyoteMs;
            this.airJumpUsed = false;
        }

        // dash in corso: traiettoria bloccata, tutto il resto ignorato
        if (this.dashing) {
            if (now >= this.dashUntil) {
                this.dashing = false;
                body.setAllowGravity(true);
                body.setVelocityX(body.velocity.x * 0.4);
            } else {
                this.updateHitbox();
                return;
            }
        }

        // movimento orizzontale
        const accel = this.grounded ? PHYSICS.runAccel : PHYSICS.airAccel;
        if (left && !right) {
            body.setAccelerationX(-accel);
            this.facing = -1;
            this.setFlipX(true);
        } else if (right && !left) {
            body.setAccelerationX(accel);
            this.facing = 1;
            this.setFlipX(false);
        } else {
            body.setAccelerationX(0);
            body.setVelocityX(this.grounded ? body.velocity.x * 0.8 : body.velocity.x * 0.96);
        }
        body.setMaxVelocityX(this.dashing ? PHYSICS.dashSpeed : PHYSICS.runSpeed);

        // salto: buffer + coyote + doppio
        if (Phaser.Input.Keyboard.JustDown(this.keys.jump) || Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            this.jumpBufferedUntil = now + PHYSICS.jumpBufferMs;
        }
        if (now < this.jumpBufferedUntil) {
            if (this.grounded || now < this.coyoteUntil) {
                body.setVelocityY(-PHYSICS.jumpVelocity);
                this.jumpBufferedUntil = 0;
                this.coyoteUntil = 0;
                sfx.jump();
                this.squash(0.85, 1.15);
            } else if (!this.airJumpUsed && state.hasAbility('doubleJump')) {
                body.setVelocityY(-PHYSICS.doubleJumpVelocity);
                this.airJumpUsed = true;
                this.jumpBufferedUntil = 0;
                sfx.doubleJump();
                this.burst(0x4ade80, 6);
            }
        }
        // salto variabile: rilascio = taglio della spinta
        if (!this.keys.jump.isDown && !this.cursors.up.isDown && body.velocity.y < 0) {
            body.setVelocityY(body.velocity.y * (1 - (1 - PHYSICS.jumpCutFactor) * (delta / 100)));
        }

        if ((Phaser.Input.Keyboard.JustDown(this.keys.dash) || Phaser.Input.Keyboard.JustDown(this.keys.dash2))
            && state.hasAbility('dash') && now >= this.dashCooldownUntil) {
            this.startDash();
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.attack)) {
            this.tryAttack(upHeld ? 'up' : !this.grounded && downHeld ? 'down' : 'side');
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.verso) && state.hasAbility('verso')) {
            this.tryVerso();
        }

        this.updateHeal(delta, downHeld);
        this.updateAnimation(delta, body);
        this.updateHitbox();

        if (this.attackActive && now >= this.attackActiveUntil) this.attackActive = false;

        // lampeggio di invulnerabilità
        this.setAlpha(this.invulnerable && !this.dashing ? (Math.floor(now / 70) % 2 ? 0.35 : 0.9) : 1);

        if (!this.wasGrounded && this.grounded) {
            this.squash(1.25, 0.75);
            this.dust(4);
        }
        this.wasGrounded = this.grounded;
    }

    /* ---------- azioni ---------- */

    private startDash(): void {
        const body = this.body as Phaser.Physics.Arcade.Body;
        this.dashing = true;
        this.dashUntil = this.scene.time.now + PHYSICS.dashMs;
        this.dashCooldownUntil = this.scene.time.now + PHYSICS.dashCooldownMs;
        body.setAllowGravity(false);
        body.setVelocity(PHYSICS.dashSpeed * this.facing, 0);
        body.setAccelerationX(0);
        sfx.dash();
        this.setTexture('geco-dash');
        // scia di afterimage
        for (let i = 0; i < 4; i++) {
            this.scene.time.delayedCall(i * 35, () => {
                if (!this.scene) return;
                const ghost = this.scene.add.image(this.x, this.y, 'geco-dash')
                    .setFlipX(this.flipX).setAlpha(0.3).setTint(0x4ade80).setDepth(this.depth - 1);
                this.scene.tweens.add({ targets: ghost, alpha: 0, duration: 200, onComplete: () => ghost.destroy() });
            });
        }
    }

    private tryAttack(dir: AttackDir = 'side'): void {
        const now = this.scene.time.now;
        if (this.dead || this.dashing || now < this.attackCooldownUntil) return;
        this.attackCooldownUntil = now + COMBAT.attackCooldownMs;
        this.attackActiveUntil = now + COMBAT.attackActiveMs;
        this.attackActive = true;
        this.attackDir = dir;
        sfx.slash();
        this.slashVisual(dir);
    }

    private tryVerso(): void {
        if (state.run.flow < COMBAT.versoCost) {
            bus.emit('toast', { text: 'flow insufficiente. colpisci qualcosa.' });
            return;
        }
        state.run.flow -= COMBAT.versoCost;
        this.emitVitals(false);
        sfx.shoot();
        this.scene.events.emit('player-shoot', { x: this.x + this.facing * 20, y: this.y, dir: this.facing });
    }

    private updateHeal(delta: number, downHeld: boolean): void {
        const canHeal = this.grounded && !this.attackActive && state.run.flow >= COMBAT.healCost
            && state.run.hp < COMBAT.maxHp && this.keys.heal.isDown && !downHeld;
        if (canHeal) {
            this.healHeldMs += delta;
            this.setTint(0x4ade80);
            if (this.healHeldMs >= COMBAT.healHoldMs) {
                this.healHeldMs = 0;
                state.run.flow -= COMBAT.healCost;
                state.run.hp += 1;
                sfx.heal();
                this.burst(0x4ade80, 12);
                this.emitVitals(false);
            }
        } else {
            this.healHeldMs = 0;
            this.clearTint();
        }
    }

    /* ---------- reazioni ---------- */

    onAttackHit(): void {
        const body = this.body as Phaser.Physics.Arcade.Body;
        sfx.hit();
        state.run.flow = Math.min(COMBAT.maxFlow, state.run.flow + COMBAT.flowPerHit);
        this.emitVitals(false);
        if (this.attackDir === 'down') {
            // pogo: rimbalzo sul colpo dal basso
            body.setVelocityY(-PHYSICS.pogoVelocity);
            this.airJumpUsed = false;
        } else if (this.attackDir === 'side') {
            body.setVelocityX(body.velocity.x - this.facing * 60);
        }
    }

    hurt(amount: number, fromX?: number): boolean {
        if (this.dead || this.invulnerable) return false;
        state.run.hp = Math.max(0, state.run.hp - amount);
        this.invulnUntil = this.scene.time.now + COMBAT.invulnMs;
        sfx.hurt();
        this.emitVitals(true);
        const body = this.body as Phaser.Physics.Arcade.Body;
        const dir = fromX !== undefined ? Math.sign(this.x - fromX) || 1 : -this.facing;
        body.setVelocity(dir * PHYSICS.knockback, -PHYSICS.knockback * 0.6);
        this.burst(0xf87171, 8);
        if (state.run.hp <= 0) {
            this.dead = true;
            sfx.die();
            this.scene.events.emit('player-dead');
        }
        return true;
    }

    /* ---------- visuale ---------- */

    private updateAnimation(delta: number, body: Phaser.Physics.Arcade.Body): void {
        if (this.dashing) return;
        if (!this.grounded) {
            this.setTexture('geco-air');
            return;
        }
        if (Math.abs(body.velocity.x) > 30) {
            this.runAnimTimer += delta;
            if (this.runAnimTimer > 90) {
                this.runAnimTimer = 0;
                this.runFrame = 1 - this.runFrame;
                if (this.runFrame === 0) this.dust(1);
            }
            this.setTexture(this.runFrame ? 'geco-run1' : 'geco-run2');
        } else {
            this.setTexture('geco-idle');
        }
    }

    private updateHitbox(): void {
        const hb = this.attackHitbox.body as Phaser.Physics.Arcade.Body;
        if (this.attackDir === 'up') {
            hb.setSize(44, COMBAT.attackRange);
            this.attackHitbox.setPosition(this.x, this.y - 36);
        } else if (this.attackDir === 'down') {
            hb.setSize(44, COMBAT.attackRange);
            this.attackHitbox.setPosition(this.x, this.y + 36);
        } else {
            hb.setSize(COMBAT.attackRange, 44);
            this.attackHitbox.setPosition(this.x + this.facing * 34, this.y);
        }
        hb.position.set(this.attackHitbox.x - hb.width / 2, this.attackHitbox.y - hb.height / 2);
    }

    private slashVisual(dir: AttackDir): void {
        const g = this.scene.add.graphics().setDepth(this.depth + 1);
        const angle = dir === 'up' ? -Math.PI / 2 : dir === 'down' ? Math.PI / 2 : this.facing === 1 ? 0 : Math.PI;
        g.lineStyle(3, 0xffffff, 0.9);
        g.beginPath();
        g.arc(0, 0, 34, angle - 0.9, angle + 0.9);
        g.strokePath();
        g.lineStyle(2, 0x4ade80, 0.5);
        g.beginPath();
        g.arc(0, 0, 40, angle - 0.7, angle + 0.7);
        g.strokePath();
        g.setPosition(this.x, this.y);
        this.scene.tweens.add({
            targets: g,
            alpha: 0,
            scaleX: 1.25,
            scaleY: 1.25,
            duration: 140,
            onComplete: () => g.destroy(),
        });
    }

    private squash(sx: number, sy: number): void {
        this.scene.tweens.add({
            targets: this,
            scaleX: { from: sx, to: 1 },
            scaleY: { from: sy, to: 1 },
            duration: 180,
            ease: 'Quad.easeOut',
        });
    }

    private dust(count: number): void {
        this.scene.add.particles(this.x, this.y + 14, 'p-dot', {
            speed: { min: 20, max: 70 },
            angle: { min: 200, max: 340 },
            scale: { start: 0.5, end: 0 },
            alpha: { start: 0.4, end: 0 },
            lifespan: 350,
            quantity: count,
            stopAfter: count,
        });
    }

    private burst(tint: number, count: number): void {
        this.scene.add.particles(this.x, this.y, 'p-spark', {
            speed: { min: 120, max: 260 },
            scale: { start: 0.9, end: 0 },
            tint,
            lifespan: 320,
            quantity: count,
            stopAfter: count,
        });
    }
}
