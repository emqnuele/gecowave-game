import Phaser from 'phaser';
import { COMBAT, PHYSICS, PLAYER_SPRITE } from '../config';
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
    /** colpo della combo in corso: 0,1,2 — il terzo spacca */
    comboStep = 0;

    private keys!: Record<'left' | 'right' | 'up' | 'down' | 'jump' | 'attack' | 'dash' | 'dash2' | 'heal' | 'risonante' | 'riflesso' | 'analisi', Phaser.Input.Keyboard.Key>;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

    private coyoteUntil = 0;
    private jumpBufferedUntil = 0;
    private airJumpUsed = false;
    private dashing = false;
    private dashUntil = 0;
    private dashCooldownUntil = 0;
    private attackCooldownUntil = 0;
    private attackActiveUntil = 0;
    private comboResetAt = 0;
    private attacking = false;
    private invulnUntil = 0;
    private healHeldMs = 0;
    private wasGrounded = true;
    private charging = false;
    private chargeStart = 0;
    private chargeEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
    private riflessoReadyAt = 0;
    private analisiReadyAt = 0;
    private stunnedUntil = 0;
    private nextSmelaStun = 0;
    private nextTrenDrain = 0;
    private lastDamageAt = 0;
    private nextRegenAt = 0;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'player', 0);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setScale(PLAYER_SPRITE.scale);
        this.setPipeline('Light2D');
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(PLAYER_SPRITE.bodyWidth, PLAYER_SPRITE.bodyHeight);
        body.setOffset(PLAYER_SPRITE.bodyOffsetX, PLAYER_SPRITE.bodyOffsetY);
        body.setMaxVelocityY(PHYSICS.maxFallSpeed);

        this.createAnims();
        this.play('p-idle');

        this.attackHitbox = scene.add.zone(x, y, COMBAT.attackRange, 52);
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
            risonante: kb.addKey('F'),
            riflesso: kb.addKey('G'),
            analisi: kb.addKey('H'),
        };

        scene.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
            if (p.leftButtonDown()) this.tryAttack('side');
        });

        this.on('animationcomplete-p-attack', () => {
            this.attacking = false;
            this.setOrigin(0.5, 0.5);
        });

        this.emitVitals(false);
    }

    private createAnims(): void {
        const anims = this.scene.anims;
        const def = (key: string, tex: string, start: number, end: number, frameRate: number, repeat: number) => {
            if (!anims.exists(key)) {
                anims.create({ key, frames: anims.generateFrameNumbers(tex, { start, end }), frameRate, repeat });
            }
        };
        def('p-idle', 'player', 0, 7, 5, -1);
        def('p-run', 'player', 8, 15, 11, -1);
        def('p-jump', 'player', 16, 19, 10, 0);
        def('p-land', 'player', 20, 23, 14, 0);
        def('p-attack', 'player_atk', 12, 15, 18, 0);
    }

    get invulnerable(): boolean {
        return this.dashing || this.scene.time.now < this.invulnUntil;
    }

    private get grounded(): boolean {
        return (this.body as Phaser.Physics.Arcade.Body).blocked.down;
    }

    private get stunned(): boolean {
        return this.scene.time.now < this.stunnedUntil;
    }

    private emitVitals(hurt: boolean): void {
        bus.emit('hp-changed', { hp: state.run.hp, maxHp: state.maxHp, hurt });
        bus.emit('flow-changed', { flow: state.run.flow, maxFlow: state.maxFlow });
    }

    update(_time: number, delta: number): void {
        if (this.dead) return;
        const now = this.scene.time.now;
        const body = this.body as Phaser.Physics.Arcade.Body;

        this.updateMalusERigenerazione(now);
        if (this.stunned) {
            body.setAccelerationX(0);
            body.setVelocityX(body.velocity.x * 0.8);
            return;
        }

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
            body.setVelocityX(body.velocity.x * (this.grounded ? 0.8 : 0.96));
        }
        body.setMaxVelocityX(PHYSICS.runSpeed);

        // salto: buffer + coyote + rimbalzo
        if (Phaser.Input.Keyboard.JustDown(this.keys.jump) || Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            this.jumpBufferedUntil = now + PHYSICS.jumpBufferMs;
        }
        if (now < this.jumpBufferedUntil) {
            if (this.grounded || now < this.coyoteUntil) {
                body.setVelocityY(-PHYSICS.jumpVelocity);
                this.jumpBufferedUntil = 0;
                this.coyoteUntil = 0;
                sfx.jump();
            } else if (!this.airJumpUsed && state.hasAbility('rimbalzo')) {
                body.setVelocityY(-PHYSICS.doubleJumpVelocity);
                this.airJumpUsed = true;
                this.jumpBufferedUntil = 0;
                sfx.doubleJump();
                this.burst(0x4ade80, 7);
            }
        }
        // salto variabile: rilascio = taglio della spinta
        if (!this.keys.jump.isDown && !this.cursors.up.isDown && body.velocity.y < 0) {
            body.setVelocityY(body.velocity.y * (1 - (1 - PHYSICS.jumpCutFactor) * (delta / 100)));
        }

        if ((Phaser.Input.Keyboard.JustDown(this.keys.dash) || Phaser.Input.Keyboard.JustDown(this.keys.dash2))
            && state.hasAbility('scivolata') && now >= this.dashCooldownUntil) {
            this.startDash();
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.attack)) {
            this.tryAttack(upHeld ? 'up' : !this.grounded && downHeld ? 'down' : 'side');
        }

        this.updateRisonante(now);

        if (Phaser.Input.Keyboard.JustDown(this.keys.riflesso) && state.hasAbility('riflesso') && now >= this.riflessoReadyAt) {
            if (this.spendFlow(COMBAT.riflessoCost)) {
                this.riflessoReadyAt = now + COMBAT.riflessoCooldownMs;
                sfx.unlock();
                this.scene.events.emit('player-riflesso', { x: this.x, y: this.y, facing: this.facing });
            }
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.analisi) && state.hasAbility('analisi') && now >= this.analisiReadyAt) {
            if (this.spendFlow(COMBAT.analisiCost)) {
                this.analisiReadyAt = now + COMBAT.analisiCooldownMs;
                sfx.unlock();
                this.scene.events.emit('player-analisi', {});
            }
        }

        this.updateHeal(delta, downHeld);
        this.updateAnimation(body);
        this.updateHitbox();

        if (this.attackActive && now >= this.attackActiveUntil) this.attackActive = false;
        if (this.comboStep > 0 && now >= this.comboResetAt) this.comboStep = 0;

        // lampeggio di invulnerabilità
        this.setAlpha(this.invulnerable && !this.dashing ? (Math.floor(now / 70) % 2 ? 0.35 : 0.9) : 1);

        if (!this.wasGrounded && this.grounded) {
            this.play('p-land', true);
            this.dust(4);
        }
        this.wasGrounded = this.grounded;
    }

    /* ---------- malus e rigenerazione ---------- */

    private updateMalusERigenerazione(now: number): void {
        const immune = state.hasAbility('rigenerazione');

        if (state.run.trenbolone && !immune) {
            if (this.nextTrenDrain === 0) this.nextTrenDrain = now + COMBAT.trenboloneDrainMs;
            if (now >= this.nextTrenDrain) {
                this.nextTrenDrain = now + COMBAT.trenboloneDrainMs;
                if (state.run.hp > 1) {
                    state.run.hp -= 1;
                    bus.emit('toast', { text: 'il trenbolone ti mangia da dentro.' });
                    this.burst(0x84cc16, 6);
                    this.emitVitals(true);
                }
            }
        }

        if (state.run.smela && !immune) {
            if (this.nextSmelaStun === 0) this.nextSmelaStun = now + 5000;
            if (now >= this.nextSmelaStun) {
                this.nextSmelaStun = now + 5000;
                this.stunnedUntil = now + 1100;
                // l'animazione che sai. effetto smela III.
                this.scene.add.particles(this.x, this.y + 10, 'p-dot', {
                    speed: { min: 10, max: 40 },
                    angle: { min: 60, max: 120 },
                    scale: { start: 0.5, end: 0 },
                    tint: 0x8b5a2b,
                    lifespan: 500,
                    quantity: 6,
                    stopAfter: 6,
                });
            }
        }

        if (immune && state.run.hp < state.maxHp && now - this.lastDamageAt > COMBAT.regenIdleMs) {
            if (this.nextRegenAt === 0) this.nextRegenAt = now + COMBAT.regenTickMs;
            if (now >= this.nextRegenAt) {
                this.nextRegenAt = now + COMBAT.regenTickMs;
                state.run.hp += 1;
                this.burst(0x4ade80, 5);
                this.emitVitals(false);
            }
        } else if (now - this.lastDamageAt <= COMBAT.regenIdleMs) {
            this.nextRegenAt = 0;
        }
    }

    /* ---------- azioni ---------- */

    private startDash(): void {
        const body = this.body as Phaser.Physics.Arcade.Body;
        this.dashing = true;
        this.dashUntil = this.scene.time.now + PHYSICS.dashMs;
        this.dashCooldownUntil = this.scene.time.now + PHYSICS.dashCooldownMs;
        body.setAllowGravity(false);
        body.setMaxVelocityX(PHYSICS.dashSpeed);
        body.setVelocity(PHYSICS.dashSpeed * this.facing, 0);
        body.setAccelerationX(0);
        sfx.dash();
        this.play('p-jump', true);
        // scia di afterimage
        for (let i = 0; i < 4; i++) {
            this.scene.time.delayedCall(i * 35, () => {
                if (!this.scene) return;
                const ghost = this.scene.add.image(this.x, this.y, this.texture.key, this.frame.name)
                    .setFlipX(this.flipX).setScale(this.scaleX, this.scaleY)
                    .setAlpha(0.35).setTint(0x4ade80).setDepth(this.depth - 1);
                this.scene.tweens.add({ targets: ghost, alpha: 0, duration: 220, onComplete: () => ghost.destroy() });
            });
        }
    }

    private tryAttack(dir: AttackDir): void {
        const now = this.scene.time.now;
        if (this.dead || this.dashing || this.stunned || this.charging || now < this.attackCooldownUntil) return;
        this.attackCooldownUntil = now + COMBAT.attackCooldownMs;
        this.attackActiveUntil = now + COMBAT.attackActiveMs;
        this.attackActive = true;
        this.attackDir = dir;
        this.comboResetAt = now + COMBAT.comboWindowMs;
        sfx.slash();
        this.attacking = true;
        // il frame d'attacco è largo il doppio: l'origine va sul corpo
        this.setOrigin(this.flipX ? 0.75 : 0.25, 0.5);
        this.play('p-attack', true);
        this.slashVisual(dir, this.comboStep);
        this.comboStep = (this.comboStep + 1) % 3;
    }

    /** danno del colpo corrente: il terzo della combo spacca */
    get attackDamage(): number {
        const base = this.comboStep === 0 ? 2 : 1;
        return base * state.damageMult * (1 + state.save.stats.forza * 0.1);
    }

    private updateRisonante(now: number): void {
        if (!state.hasAbility('risonante')) return;
        if (this.keys.risonante.isDown && !this.charging && state.run.flow >= COMBAT.risonanteCost) {
            this.charging = true;
            this.chargeStart = now;
            this.chargeEmitter = this.scene.add.particles(0, 0, 'p-spark', {
                follow: this,
                speed: { min: 40, max: 120 },
                scale: { start: 0.5, end: 0 },
                tint: 0xa855f7,
                lifespan: 300,
                frequency: 40,
            });
        }
        if (this.charging && !this.keys.risonante.isDown) {
            const charged = now - this.chargeStart >= COMBAT.risonanteChargeMs;
            this.chargeEmitter?.destroy();
            this.chargeEmitter = null;
            this.charging = false;
            if (charged && this.spendFlow(COMBAT.risonanteCost)) {
                sfx.shoot();
                this.scene.cameras.main.flash(80, 168, 85, 247);
                this.scene.events.emit('player-risonante', { x: this.x + this.facing * 26, y: this.y, dir: this.facing });
            } else {
                sfx.ui();
            }
        }
    }

    private spendFlow(cost: number): boolean {
        if (state.run.flow < cost) {
            bus.emit('toast', { text: 'flow insufficiente. colpisci qualcosa.' });
            return false;
        }
        state.run.flow -= cost;
        this.emitVitals(false);
        return true;
    }

    private updateHeal(delta: number, downHeld: boolean): void {
        const canHeal = this.grounded && !this.attackActive && !this.charging && state.run.flow >= COMBAT.healCost
            && state.run.hp < state.maxHp && this.keys.heal.isDown && !downHeld;
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
        state.run.flow = Math.min(state.maxFlow, state.run.flow + COMBAT.flowPerHit);
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
        this.lastDamageAt = this.scene.time.now;
        sfx.hurt();
        this.emitVitals(true);
        const body = this.body as Phaser.Physics.Arcade.Body;
        const dir = fromX !== undefined ? Math.sign(this.x - fromX) || 1 : -this.facing;
        body.setVelocity(dir * PHYSICS.knockback, -PHYSICS.knockback * 0.6);
        this.burst(0xf87171, 8);
        if (state.run.hp <= 0) {
            this.dead = true;
            this.chargeEmitter?.destroy();
            sfx.die();
            this.scene.events.emit('player-dead');
        }
        return true;
    }

    /* ---------- visuale ---------- */

    private updateAnimation(body: Phaser.Physics.Arcade.Body): void {
        if (this.dashing || this.attacking) return;
        if (this.originX !== 0.5) this.setOrigin(0.5, 0.5);
        if (!this.grounded) {
            if (this.anims.currentAnim?.key !== 'p-jump') this.play('p-jump', true);
            return;
        }
        const landing = this.anims.currentAnim?.key === 'p-land' && this.anims.isPlaying;
        if (Math.abs(body.velocity.x) > 30) {
            if (this.anims.currentAnim?.key !== 'p-run') this.play('p-run', true);
        } else if (!landing) {
            if (this.anims.currentAnim?.key !== 'p-idle') this.play('p-idle', true);
        }
    }

    private updateHitbox(): void {
        const hb = this.attackHitbox.body as Phaser.Physics.Arcade.Body;
        if (this.attackDir === 'up') {
            hb.setSize(52, COMBAT.attackRange);
            this.attackHitbox.setPosition(this.x, this.y - 48);
        } else if (this.attackDir === 'down') {
            hb.setSize(52, COMBAT.attackRange);
            this.attackHitbox.setPosition(this.x, this.y + 48);
        } else {
            hb.setSize(COMBAT.attackRange, 52);
            this.attackHitbox.setPosition(this.x + this.facing * 44, this.y);
        }
        hb.position.set(this.attackHitbox.x - hb.width / 2, this.attackHitbox.y - hb.height / 2);
    }

    private slashVisual(dir: AttackDir, combo: number): void {
        const g = this.scene.add.graphics().setDepth(this.depth + 1);
        const angle = dir === 'up' ? -Math.PI / 2 : dir === 'down' ? Math.PI / 2 : this.facing === 1 ? 0 : Math.PI;
        const big = combo === 2;
        const radius = big ? 52 : 42;
        g.lineStyle(big ? 4 : 3, 0xffffff, 0.9);
        g.beginPath();
        g.arc(0, 0, radius, angle - 0.95, angle + 0.95);
        g.strokePath();
        g.lineStyle(2, big ? 0xa855f7 : 0x4ade80, 0.6);
        g.beginPath();
        g.arc(0, 0, radius + 7, angle - 0.75, angle + 0.75);
        g.strokePath();
        g.setPosition(this.x, this.y);
        this.scene.tweens.add({
            targets: g,
            alpha: 0,
            scaleX: big ? 1.45 : 1.25,
            scaleY: big ? 1.45 : 1.25,
            duration: big ? 180 : 140,
            onComplete: () => g.destroy(),
        });
    }

    private dust(count: number): void {
        this.scene.add.particles(this.x, this.y + 24, 'p-dot', {
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
