import Phaser from 'phaser';
import { bus } from '../engine/events';
import { sfx } from '../engine/sfx';

const MAX_HP = 60;
const NAME = "l'algoritmo";

type Phase = 1 | 2 | 3;

export class Boss extends Phaser.Physics.Arcade.Sprite {
    hp = MAX_HP;
    engaged = false;
    private anchorX: number;
    private anchorY: number;
    private t = 0;
    private nextAttackAt = 0;
    private diving = false;
    private summonedAtPhase: Phase | 0 = 0;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'boss-core');
        this.anchorX = x;
        this.anchorY = y;
        scene.add.existing(this);
        scene.physics.add.existing(this);
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(false);
        body.setSize(80, 80);
        this.setDepth(5);
    }

    get phase(): Phase {
        if (this.hp > MAX_HP * 0.66) return 1;
        if (this.hp > MAX_HP * 0.33) return 2;
        return 3;
    }

    engage(): void {
        if (this.engaged) return;
        this.engaged = true;
        this.nextAttackAt = this.scene.time.now + 1800;
        sfx.bossRoar();
        bus.emit('boss-hp', { hp: this.hp, maxHp: MAX_HP, name: NAME });
    }

    update(_time: number, delta: number, player: Phaser.GameObjects.Sprite): void {
        if (!this.active) return;
        this.t += delta;
        const body = this.body as Phaser.Physics.Arcade.Body;
        const now = this.scene.time.now;

        // rotazione lenta e pulsazione: deve sembrare un logo che ti giudica
        this.rotation = Math.sin(this.t / 1400) * 0.15;
        const pulse = 1 + Math.sin(this.t / 300) * 0.03;
        this.setScale(pulse);

        if (!this.engaged || this.diving) return;

        // ritorno morbido verso il punto di hover
        body.setVelocity(
            (this.anchorX - this.x) * 1.2 + Math.sin(this.t / 800) * 50,
            (this.anchorY - this.y) * 1.2 + Math.cos(this.t / 600) * 40
        );

        if (now < this.nextAttackAt) return;
        const phase = this.phase;
        const cooldown = phase === 1 ? 2600 : phase === 2 ? 2100 : 1500;
        this.nextAttackAt = now + cooldown;

        // evocazione una tantum a inizio fase 2 e 3
        if (phase >= 2 && this.summonedAtPhase < phase) {
            this.summonedAtPhase = phase;
            this.scene.events.emit('boss-summon', { x: this.anchorX - 200, y: this.anchorY });
            this.scene.events.emit('boss-summon', { x: this.anchorX + 200, y: this.anchorY });
            sfx.bossRoar();
            return;
        }

        const roll = Math.random();
        if (roll < 0.5) {
            this.dive(player);
        } else if (phase >= 2 && roll < 0.8) {
            this.radialBurst(phase === 3 ? 12 : 8);
        } else {
            this.rain(phase === 3 ? 7 : 5);
        }
    }

    /** picchiata telegrafata sulla posizione del giocatore */
    private dive(player: Phaser.GameObjects.Sprite): void {
        this.diving = true;
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0, 0);
        const tx = player.x;
        const ty = player.y;
        this.setTintFill(0xf87171);
        this.scene.time.delayedCall(450, () => {
            if (!this.active) return;
            this.clearTint();
            const angle = Math.atan2(ty - this.y, tx - this.x);
            body.setVelocity(Math.cos(angle) * 700, Math.sin(angle) * 700);
            sfx.dash();
            this.scene.time.delayedCall(420, () => {
                if (!this.active) return;
                body.setVelocity(0, 0);
                this.diving = false;
            });
        });
    }

    private radialBurst(count: number): void {
        sfx.shoot();
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.2;
            this.scene.events.emit('enemy-shoot', {
                x: this.x,
                y: this.y,
                tx: this.x + Math.cos(angle) * 100,
                ty: this.y + Math.sin(angle) * 100,
            });
        }
    }

    /** pioggia di cubi dall'alto sopra il giocatore */
    private rain(count: number): void {
        sfx.shoot();
        for (let i = 0; i < count; i++) {
            const ox = (i - count / 2) * 70 + Math.random() * 40;
            this.scene.events.emit('enemy-shoot', {
                x: this.anchorX + ox,
                y: this.anchorY - 260,
                tx: this.anchorX + ox,
                ty: this.anchorY + 200,
            });
        }
    }

    takeDamage(amount: number, fromX: number): void {
        if (!this.active) return;
        this.engage();
        this.hp -= amount;
        this.setTintFill(0xffffff);
        this.scene.time.delayedCall(60, () => this.active && this.clearTint());
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.velocity.x += Math.sign(this.x - fromX) * 40;
        bus.emit('boss-hp', { hp: Math.max(0, this.hp), maxHp: MAX_HP, name: NAME });
        if (this.hp <= 0) this.die();
    }

    private die(): void {
        bus.emit('boss-hp', null);
        const { x, y } = this;
        const scene = this.scene;
        this.destroy();
        sfx.bossRoar();
        for (let i = 0; i < 5; i++) {
            scene.time.delayedCall(i * 180, () => {
                scene.add.particles(x + (Math.random() - 0.5) * 120, y + (Math.random() - 0.5) * 120, 'p-spark', {
                    speed: { min: 150, max: 400 },
                    scale: { start: 1.4, end: 0 },
                    tint: [0xf87171, 0xffffff, 0x4ade80],
                    lifespan: 600,
                    quantity: 20,
                    stopAfter: 20,
                });
            });
        }
        scene.cameras.main.shake(800, 0.012);
        scene.time.delayedCall(1400, () => scene.events.emit('boss-defeated'));
    }
}
