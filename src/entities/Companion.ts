import Phaser from 'phaser';
import { COMBAT, PHYSICS, PLAYER_SPRITE } from '../config';
import { FX } from '../engine/art/abilityFx';
import { sfx } from '../engine/sfx';
import { state } from '../engine/state';
import { rng } from '../engine/rng';

type Hostile = Phaser.GameObjects.Sprite & { active: boolean };

/** riflesso distorto: un clone del player guidato da ai, depotenziato.
    riusa fisica, animazioni e logica d'attacco del player. */
export class Companion extends Phaser.Physics.Arcade.Sprite {
    facing: 1 | -1 = 1;
    attackHitbox: Phaser.GameObjects.Zone;
    attackActive = false;
    attackDir: 'side' | 'up' = 'side';

    private comboStep = 0;
    private attackCooldownUntil = 0;
    private attackActiveUntil = 0;
    private comboResetAt = 0;
    private attacking = false;
    private attackAnimUntil = 0;
    private jumpReadyAt = 0;
    private reposeUntil = 0;
    private calmUntil = 0;
    private strafeDir: 1 | -1 = 1;
    private strafeFlipAt = 0;

    constructor(scene: Phaser.Scene, x: number, y: number, facing: 1 | -1) {
        super(scene, x, y, 'player', 0);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.facing = facing;
        this.setScale(PLAYER_SPRITE.scale)
            .setFlipX(facing < 0)
            .setAlpha(0.75)
            .setTint(0xa5f3fc)
            .setDepth(4)
            .setPipeline('Light2D');

        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(PLAYER_SPRITE.bodyWidth, PLAYER_SPRITE.bodyHeight);
        body.setOffset(PLAYER_SPRITE.bodyOffsetX, PLAYER_SPRITE.bodyOffsetY);
        body.setMaxVelocityY(PHYSICS.maxFallSpeed);

        this.play('p-idle');

        this.attackHitbox = scene.add.zone(x, y, COMBAT.attackRange, 52);
        scene.physics.add.existing(this.attackHitbox);
        const hb = this.attackHitbox.body as Phaser.Physics.Arcade.Body;
        hb.setAllowGravity(false);
        hb.moves = false;

        // resta calmo qualche istante dopo lo spawn: niente salto/inseguimento/colpo
        this.calmUntil = scene.time.now + COMBAT.riflessoFirstAttackDelayMs;
        this.attackCooldownUntil = this.calmUntil;

        this.on('animationcomplete-p-attack', () => {
            this.attacking = false;
            this.setOrigin(0.5, 0.5);
        });
    }

    private get grounded(): boolean {
        return (this.body as Phaser.Physics.Arcade.Body).blocked.down;
    }

    /** danno depotenziato che cresce col flow accumulato dal player */
    get attackDamage(): number {
        const flowRatio = state.run.flow / state.maxFlow;
        return (COMBAT.riflessoHitDamageBase + COMBAT.riflessoHitDamageFlowMult * flowRatio) * state.damageMult;
    }

    update(_time: number, _delta: number, target: Hostile | null): void {
        const now = this.scene.time.now;
        const body = this.body as Phaser.Physics.Arcade.Body;

        if (!target) {
            body.setAccelerationX(0);
            body.setVelocityX(body.velocity.x * (this.grounded ? 0.8 : 0.96));
            this.afterMove(body, now);
            return;
        }

        const dx = target.x - this.x;
        const dy = target.y - this.y;

        // fase calma dopo lo spawn: resta fermo a guardare, non fa nulla
        if (now < this.calmUntil) {
            this.facing = dx < 0 ? -1 : 1;
            this.setFlipX(this.facing < 0);
            body.setAccelerationX(0);
            body.setVelocityX(body.velocity.x * (this.grounded ? 0.8 : 0.96));
            this.afterMove(body, now);
            return;
        }

        const adx = Math.abs(dx);
        const inRange = adx < COMBAT.attackRange * 0.7;
        const accel = this.grounded ? PHYSICS.runAccel : PHYSICS.airAccel;
        const maxSpeed = PHYSICS.runSpeed * COMBAT.riflessoSpeedMult;
        body.setMaxVelocityX(maxSpeed);

        // fase di riposizionamento dopo un colpo: non insegue, ondeggia destra/sinistra
        const reposing = now < this.reposeUntil;

        // guarda il bersaglio (tranne mentre strafa, dove segue la direzione del passo)
        if (!reposing) {
            this.facing = dx < 0 ? -1 : 1;
            this.setFlipX(this.facing < 0);
        }

        if (this.attacking) {
            body.setAccelerationX(0);
            body.setVelocityX(body.velocity.x * (this.grounded ? 0.8 : 0.96));
        } else if (reposing) {
            // passi corti avanti/indietro, sguardo sempre al bersaglio
            if (now >= this.strafeFlipAt) {
                this.strafeDir = (this.strafeDir * -1) as 1 | -1;
                this.strafeFlipAt = now + 180 + rng.logic.next() * 160;
            }
            this.facing = dx < 0 ? -1 : 1;
            this.setFlipX(this.facing < 0);
            body.setAccelerationX(0);
            body.setVelocityX(this.strafeDir * maxSpeed * 0.45);
        } else if (!inRange) {
            // insegue finche' non e' a tiro
            body.setAccelerationX(this.facing * accel);
        } else {
            body.setAccelerationX(0);
            body.setVelocityX(body.velocity.x * (this.grounded ? 0.8 : 0.96));
        }

        // salto: se il bersaglio e' piu' in alto o se sbatte contro un muro
        const blocked = (body.blocked.left && this.facing < 0) || (body.blocked.right && this.facing > 0);
        if (!reposing && this.grounded && now >= this.jumpReadyAt && (dy < -60 || blocked)) {
            body.setVelocityY(-PHYSICS.jumpVelocity);
            this.jumpReadyAt = now + COMBAT.riflessoJumpCooldownMs;
            sfx.jump();
        }

        // attacca solo se a tiro, fermo e fuori dalla pausa
        if (inRange && !reposing && Math.abs(dy) < 70) this.tryAttack(dy < -30 ? 'up' : 'side');

        this.afterMove(body, now);
    }

    private afterMove(body: Phaser.Physics.Arcade.Body, now: number): void {
        if (this.attackActive && now >= this.attackActiveUntil) this.attackActive = false;
        if (this.comboStep > 0 && now >= this.comboResetAt) this.comboStep = 0;
        this.updateAnimation(body);
        this.updateHitbox();
    }

    private tryAttack(dir: 'side' | 'up'): void {
        const now = this.scene.time.now;
        if (this.attacking || now < this.attackCooldownUntil) return;
        this.attackCooldownUntil = now + COMBAT.riflessoAttackCooldownMs;
        // dopo il colpo si riposiziona prima di ricaricare
        this.reposeUntil = now + COMBAT.attackActiveMs + COMBAT.riflessoReposeMs;
        this.strafeFlipAt = 0;
        this.attackActiveUntil = now + COMBAT.attackActiveMs;
        this.attackAnimUntil = now + 260;
        this.attackActive = true;
        this.attackDir = dir;
        this.comboResetAt = now + COMBAT.comboWindowMs;
        sfx.slash();
        this.attacking = true;
        this.setOrigin(this.flipX ? 0.75 : 0.25, 0.5);
        this.play('p-attack', true);
        this.slashVisual(dir);
        this.comboStep = (this.comboStep + 1) % 3;
    }

    /** consumato da GameScene quando l'hitbox colpisce: evita multi-hit per fendente */
    consumeSwing(): void {
        this.attackActive = false;
    }

    private updateAnimation(body: Phaser.Physics.Arcade.Body): void {
        if (this.attacking && this.scene.time.now >= this.attackAnimUntil) {
            this.attacking = false;
            this.setOrigin(0.5, 0.5);
        }
        if (this.attacking) return;
        if (this.originX !== 0.5) this.setOrigin(0.5, 0.5);
        if (!this.grounded) {
            if (this.anims.currentAnim?.key !== 'p-jump') this.play('p-jump', true);
            return;
        }
        if (Math.abs(body.velocity.x) > 30) {
            if (this.anims.currentAnim?.key !== 'p-run') this.play('p-run', true);
        } else if (this.anims.currentAnim?.key !== 'p-idle') {
            this.play('p-idle', true);
        }
    }

    private updateHitbox(): void {
        const hb = this.attackHitbox.body as Phaser.Physics.Arcade.Body;
        if (this.attackDir === 'up') {
            hb.setSize(52, COMBAT.attackRange);
            this.attackHitbox.setPosition(this.x, this.y - 48);
        } else {
            hb.setSize(COMBAT.attackRange, 52);
            this.attackHitbox.setPosition(this.x + this.facing * 44, this.y);
        }
        hb.position.set(this.attackHitbox.x - hb.width / 2, this.attackHitbox.y - hb.height / 2);
    }

    private slashVisual(dir: 'side' | 'up'): void {
        const angle = dir === 'up' ? -Math.PI / 2 : this.facing === 1 ? 0 : Math.PI;
        const img = this.scene.add.image(this.x, this.y, FX.slash).setDepth(this.depth + 1)
            .setRotation(angle).setTint(0xa5f3fc).setAlpha(0.9);
        this.scene.tweens.add({
            targets: img,
            alpha: 0,
            scaleX: 1.15,
            scaleY: 1.15,
            duration: 140,
            onComplete: () => img.destroy(),
        });
    }

    kill(): void {
        // si sbriciola in schegge di specchio
        for (let i = 0; i < 8; i++) {
            const s = this.scene.add.image(this.x, this.y, FX.mirrorShard).setDepth(6);
            const a = (i / 8) * Math.PI * 2;
            this.scene.tweens.add({
                targets: s,
                x: this.x + Math.cos(a) * 70,
                y: this.y + Math.sin(a) * 70,
                angle: 200,
                alpha: 0,
                duration: 450,
                ease: 'Quad.easeOut',
                onComplete: () => s.destroy(),
            });
        }
        this.attackHitbox.destroy();
        this.destroy();
    }
}
