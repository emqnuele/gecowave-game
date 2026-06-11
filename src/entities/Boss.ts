import Phaser from 'phaser';
import { BOSSES, type BossAttack, type BossDef } from '../content/bosses';
import { bus } from '../engine/events';
import { sfx } from '../engine/sfx';
import { state } from '../engine/state';
import type { BossKind } from '../types';

type Phase = 1 | 2 | 3;

export class Boss extends Phaser.Physics.Arcade.Sprite {
    readonly def: BossDef;
    hp: number;
    engaged = false;
    invulnerable: boolean;
    private shieldGraphics?: Phaser.GameObjects.Graphics;

    private anchorX: number;
    private anchorY: number;
    private t = 0;
    private nextAttackAt = 0;
    private busy = false;
    private summonedAtPhase: Phase | 0 = 0;

    constructor(scene: Phaser.Scene, x: number, y: number, kind: BossKind) {
        super(scene, x, y, BOSSES[kind].texture);
        this.def = BOSSES[kind];
        this.hp = this.def.hp;
        this.invulnerable = this.def.startsInvulnerable ?? false;
        this.anchorX = x;
        this.anchorY = y;
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setPipeline('Light2D');
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(false);
        body.setSize(this.width * (this.def.bodyScale ?? 0.75), this.height * (this.def.bodyScale ?? 0.75));
        this.setDepth(5);

        if (kind === 'guggu' && !state.hasFlag('ivan')) {
            this.shieldGraphics = scene.add.graphics();
            this.shieldGraphics.setDepth(6);
        }
    }

    get phase(): Phase {
        if (this.hp > this.def.hp * 0.66) return 1;
        if (this.hp > this.def.hp * 0.33) return 2;
        return 3;
    }

    engage(): void {
        if (this.engaged) return;
        this.engaged = true;
        this.nextAttackAt = this.scene.time.now + 1600;
        sfx.bossRoar();
        bus.emit('boss-hp', { hp: this.hp, maxHp: this.def.hp, name: this.def.name });
    }

    update(_time: number, delta: number, player: Phaser.GameObjects.Sprite): void {
        if (!this.active) return;
        this.t += delta;
        const body = this.body as Phaser.Physics.Arcade.Body;
        const now = this.scene.time.now;

        if (this.shieldGraphics && this.active) {
            if (state.hasFlag('ivan')) {
                this.shieldGraphics.destroy();
                this.shieldGraphics = undefined;
            } else {
                this.shieldGraphics.clear();
                if (this.engaged) {
                    const pulse = 95 + Math.sin(this.t / 150) * 10;
                    this.shieldGraphics.lineStyle(3, 0xfacc15, 0.85);
                    this.shieldGraphics.fillStyle(0xfacc15, 0.12);
                    this.shieldGraphics.strokeCircle(this.x, this.y, pulse);
                    this.shieldGraphics.fillCircle(this.x, this.y, pulse);
                }
            }
        }

        if (this.def.glitchy) {
            // scatti, tremori, niente movimenti morbidi: deve fare paura
            this.setDisplayOrigin(
                this.width / 2 + (Math.random() > 0.85 ? (Math.random() - 0.5) * 8 : 0),
                this.height / 2 + (Math.random() > 0.9 ? (Math.random() - 0.5) * 6 : 0)
            );
            if (Math.random() > 0.985) {
                this.setTintFill(Math.random() > 0.5 ? 0x22d3ee : 0xf87171);
                this.scene.time.delayedCall(60, () => this.active && !this.busy && this.clearTint());
            }
        } else {
            this.rotation = Math.sin(this.t / 1400) * 0.12;
            const pulse = 1 + Math.sin(this.t / 300) * 0.03;
            this.setScale(pulse);
        }

        if (!this.engaged || this.busy) return;

        // ritorno morbido verso il punto di hover
        body.setVelocity(
            (this.anchorX - this.x) * 1.2 + Math.sin(this.t / 800) * 50,
            (this.anchorY - this.y) * 1.2 + Math.cos(this.t / 600) * 40
        );

        if (now < this.nextAttackAt) return;
        const phase = this.phase;
        let cd = this.def.cooldownMs[phase];
        if (this.def.kind === 'guggu' && !state.hasFlag('ivan')) {
            cd *= 0.6;
        }
        this.nextAttackAt = now + cd;

        // evocazione una tantum a inizio fase
        if (this.def.summonKind && phase >= 2 && this.summonedAtPhase < phase) {
            this.summonedAtPhase = phase;
            this.scene.events.emit('boss-summon', { x: this.anchorX - 180, y: this.anchorY, kind: this.def.summonKind });
            this.scene.events.emit('boss-summon', { x: this.anchorX + 180, y: this.anchorY, kind: this.def.summonKind });
            sfx.bossRoar();
            return;
        }

        const pool = this.def.attacks[phase];
        this.execute(pool[Math.floor(Math.random() * pool.length)], player, phase);
    }

    private execute(attack: BossAttack, player: Phaser.GameObjects.Sprite, phase: Phase): void {
        switch (attack) {
            case 'dive': return this.dive(player, 700);
            case 'charge': return this.charge(player);
            case 'radial': return this.radial(phase === 3 ? 12 : 8);
            case 'rain': return this.rain(phase === 3 ? 7 : 5);
            case 'burst': return this.burst(player, phase === 1 ? 3 : 5);
            case 'teleport': return this.teleport(player);
            case 'lamette': return this.lamette(player, phase + 2);
            case 'summon':
                if (this.def.summonKind) {
                    this.scene.events.emit('boss-summon', { x: this.x, y: this.y, kind: this.def.summonKind });
                }
                return;
        }
    }

    /** picchiata telegrafata sulla posizione del bersaglio */
    private dive(player: Phaser.GameObjects.Sprite, speed: number): void {
        this.busy = true;
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0, 0);
        const tx = player.x;
        const ty = player.y;
        this.setTintFill(this.def.glowColor);
        this.scene.time.delayedCall(420, () => {
            if (!this.active) return;
            this.clearTint();
            const angle = Math.atan2(ty - this.y, tx - this.x);
            body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
            sfx.dash();
            this.scene.time.delayedCall(420, () => {
                if (!this.active) return;
                body.setVelocity(0, 0);
                this.busy = false;
            });
        });
    }

    /** carica orizzontale da bus: tutta la stanza, poi torna */
    private charge(player: Phaser.GameObjects.Sprite): void {
        this.busy = true;
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0, 0);
        const dir = Math.sign(player.x - this.x) || 1;
        this.setFlipX(dir < 0);
        this.setTintFill(this.def.glowColor);
        this.scene.tweens.add({ targets: this, x: this.x + 4, duration: 60, yoyo: true, repeat: 4 });
        this.scene.time.delayedCall(480, () => {
            if (!this.active) return;
            this.clearTint();
            // scende all'altezza del giocatore e travolge
            this.scene.tweens.add({ targets: this, y: player.y - 6, duration: 180, ease: 'Quad.easeIn' });
            body.setVelocityX(dir * 640);
            sfx.dash();
            this.scene.time.delayedCall(900, () => {
                if (!this.active) return;
                body.setVelocity(0, 0);
                this.scene.tweens.add({ targets: this, y: this.anchorY, duration: 500, ease: 'Quad.easeOut', onComplete: () => { this.busy = false; } });
            });
        });
    }

    private radial(count: number): void {
        sfx.shoot();
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.2;
            this.scene.events.emit('enemy-shoot', {
                x: this.x,
                y: this.y,
                tx: this.x + Math.cos(angle) * 100,
                ty: this.y + Math.sin(angle) * 100,
                color: this.def.glowColor,
            });
        }
    }

    /** pioggia dall'alto attorno all'ancora */
    private rain(count: number): void {
        sfx.shoot();
        for (let i = 0; i < count; i++) {
            const ox = (i - count / 2) * 70 + Math.random() * 40;
            this.scene.events.emit('enemy-shoot', {
                x: this.anchorX + ox,
                y: this.anchorY - 260,
                tx: this.anchorX + ox,
                ty: this.anchorY + 240,
                color: this.def.glowColor,
            });
        }
    }

    /** raffica mirata, stile gioco sparacchino */
    private burst(player: Phaser.GameObjects.Sprite, count: number): void {
        for (let i = 0; i < count; i++) {
            this.scene.time.delayedCall(i * 130, () => {
                if (!this.active || !player.active) return;
                sfx.shoot();
                this.scene.events.emit('enemy-shoot', {
                    x: this.x,
                    y: this.y,
                    tx: player.x + (Math.random() - 0.5) * 60,
                    ty: player.y + (Math.random() - 0.5) * 40,
                    color: this.def.glowColor,
                });
            });
        }
    }

    /** sparisce e riappare addosso al giocatore */
    private teleport(player: Phaser.GameObjects.Sprite): void {
        this.busy = true;
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0, 0);
        sfx.dash();
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: 160,
            onComplete: () => {
                if (!this.active) return;
                const side = Math.random() > 0.5 ? 1 : -1;
                this.setPosition(player.x + side * 130, player.y - 80);
                this.scene.cameras.main.flash(60, 34, 211, 238);
                this.scene.tweens.add({
                    targets: this,
                    alpha: 1,
                    duration: 120,
                    onComplete: () => {
                        if (!this.active) return;
                        this.burst(player, 3);
                        this.busy = false;
                    },
                });
            },
        });
    }

    /** lame che salgono dal suolo a colonne, marchio di lametta */
    private lamette(player: Phaser.GameObjects.Sprite, count: number): void {
        const xs: number[] = [];
        for (let i = 0; i < count; i++) {
            xs.push(player.x + (i - count / 2) * 64 + Math.random() * 24);
        }
        this.scene.events.emit('boss-lamette', { xs, y: player.y });
    }

    takeDamage(amount: number, fromX: number): boolean {
        if (!this.active) return false;
        if (this.invulnerable) {
            this.scene.add.particles(this.x + Math.sign(fromX - this.x) * 30, this.y, 'p-dot', {
                speed: { min: 40, max: 100 },
                scale: { start: 0.6, end: 0 },
                tint: this.def.glowColor,
                lifespan: 250,
                quantity: 5,
                stopAfter: 5,
            });
            return false;
        }
        if (this.def.kind === 'guggu' && !state.hasFlag('ivan')) {
            amount = Math.max(1, Math.round(amount * 0.2));
            bus.emit('toast', { text: 'lo scudo attenua il colpo!' });
        }
        this.engage();
        this.hp -= amount;
        this.setTintFill(0xffffff);
        this.scene.time.delayedCall(60, () => this.active && !this.busy && this.clearTint());
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.velocity.x += Math.sign(this.x - fromX) * 40;
        bus.emit('boss-hp', { hp: Math.max(0, this.hp), maxHp: this.def.hp, name: this.def.name });
        if (this.hp <= 0) this.die();
        return true;
    }

    private die(): void {
        if (this.shieldGraphics) {
            this.shieldGraphics.destroy();
        }
        bus.emit('boss-hp', null);
        const { x, y } = this;
        const scene = this.scene;
        const kind = this.def.kind;
        this.destroy();
        sfx.bossRoar();
        for (let i = 0; i < 5; i++) {
            scene.time.delayedCall(i * 180, () => {
                scene.add.particles(x + (Math.random() - 0.5) * 140, y + (Math.random() - 0.5) * 140, 'p-spark', {
                    speed: { min: 150, max: 400 },
                    scale: { start: 1.4, end: 0 },
                    tint: [this.def.glowColor, 0xffffff],
                    lifespan: 600,
                    quantity: 20,
                    stopAfter: 20,
                });
            });
        }
        scene.cameras.main.shake(800, 0.012);
        scene.time.delayedCall(1300, () => scene.events.emit('boss-defeated', { kind, x, y }));
    }
}
