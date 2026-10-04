import Phaser from 'phaser';
import { ENEMIES } from '../content/enemies';
import type { EnemyKind } from '../types';

export interface SpawnerOpts {
    kind: EnemyKind;
    maxAlive?: number;
    intervalMs?: number;
    /** distanza di attivazione in px, stile minecraft */
    radius?: number;
    hp?: number;
}

/* nido di mostri nelle grotte chiuse: finché sei lontano resta spento,
   da vicino pulsa e sputa un mostro ogni tanto, finché non lo rompi */

export class Spawner extends Phaser.Physics.Arcade.Sprite {
    readonly kind: EnemyKind;
    readonly glowColor: number;
    maxAlive: number;
    intervalMs: number;
    radius: number;
    hp: number;
    readonly maxHp: number;
    nextAt = 0;
    dormant = false;
    broken = false;
    private aura: Phaser.GameObjects.Image | null = null;
    private pulse: Phaser.Tweens.Tween | null = null;

    constructor(scene: Phaser.Scene, x: number, y: number, opts: SpawnerOpts) {
        Spawner.ensureTexture(scene);
        super(scene, x, y, 'spawner-nest');
        this.kind = opts.kind;
        this.glowColor = ENEMIES[opts.kind]?.glowColor ?? 0xa855f7;
        this.maxAlive = opts.maxAlive ?? 3;
        this.intervalMs = opts.intervalMs ?? 3500;
        this.radius = opts.radius ?? 600;
        this.hp = opts.hp ?? 6;
        this.maxHp = this.hp;
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setDepth(3);
        this.setPipeline('Light2D');
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(false);
        body.setImmovable(true);
        body.setSize(this.width * 0.75, this.height * 0.55);
        body.setOffset(this.width * 0.125, this.height * 0.45);
        this.aura = scene.add
            .image(x, y - 6, 'p-dot')
            .setTint(this.glowColor)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setAlpha(0.25)
            .setScale(3)
            .setDepth(3.1);
        this.nextAt = scene.time.now + 1200 + Math.random() * 1500;
    }

    static ensureTexture(scene: Phaser.Scene): void {
        if (scene.textures.exists('spawner-nest')) return;
        const g = scene.add.graphics();
        const W = 56;
        const H = 44;
        // base di roccia e ossa: scura, sta bene in ogni bioma
        g.fillStyle(0x1c1917, 1);
        g.fillEllipse(4, H - 18, W - 8, 18);
        g.lineStyle(2, 0x0b0c10, 1);
        g.strokeEllipse(4, H - 18, W - 8, 18);
        // rametti del nido
        g.lineStyle(2, 0x57534e, 1);
        for (let i = 0; i < 7; i++) {
            const x0 = 8 + i * 6;
            g.lineBetween(x0, H - 8, x0 + 4, H - 20);
        }
        // crepe luminose della pietra
        g.lineStyle(1.5, 0xa8a29e, 0.8);
        g.lineBetween(10, H - 12, 22, H - 10);
        g.lineBetween(34, H - 14, 48, H - 11);
        // tre uova bianche: la luce colorata della scena le tinge da sola
        g.fillStyle(0xf5f5f4, 1);
        g.fillEllipse(14, 12, 12, 16);
        g.fillEllipse(28, 8, 13, 18);
        g.fillEllipse(40, 14, 10, 14);
        g.lineStyle(1.5, 0x0b0c10, 1);
        g.strokeEllipse(14, 12, 12, 16);
        g.strokeEllipse(28, 8, 13, 18);
        g.strokeEllipse(40, 14, 10, 14);
        // puntini sulle uova: si capisce che sta per schiudersi qualcosa
        g.fillStyle(0x0b0c10, 1);
        g.fillCircle(19, 18, 1.6);
        g.fillCircle(34, 15, 1.8);
        g.fillCircle(44, 19, 1.4);
        g.generateTexture('spawner-nest', W, H);
        g.destroy();
    }

    setDormant(dormant: boolean): void {
        if (dormant === this.dormant || !this.body) return;
        this.dormant = dormant;
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.enable = !dormant;
        this.setVisible(!dormant);
        this.aura?.setVisible(!dormant);
    }

    /** vicino al player: l'aura si accende, lontano resta fioca */
    setArmed(armed: boolean): void {
        if (!this.aura || this.broken) return;
        const target = armed ? 0.65 : 0.22;
        if (Math.abs(this.aura.alpha - target) > 0.05) this.aura.setAlpha(target);
        if (armed && !this.pulse) {
            this.pulse = this.scene.tweens.add({
                targets: this.aura,
                scale: 4.2,
                duration: 550,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
            });
        } else if (!armed && this.pulse) {
            this.pulse.stop();
            this.pulse = null;
            this.aura.setScale(3);
        }
    }

    /** colpo preso: true se si è rotto */
    takeDamage(amount: number): boolean {
        if (this.broken || !this.active) return false;
        this.hp -= amount;
        this.setTintFill(0xffffff);
        this.scene.time.delayedCall(70, () => this.active && !this.broken && this.clearTint());
        this.scene.tweens.add({ targets: this, x: this.x + 3, duration: 50, yoyo: true, repeat: 3 });
        if (this.hp <= 0) {
            this.broken = true;
            return true;
        }
        return false;
    }

    syncAura(): void {
        this.aura?.setPosition(this.x, this.y - 6);
    }

    destroy(fromScene?: boolean): void {
        this.pulse?.stop();
        this.pulse = null;
        this.aura?.destroy();
        this.aura = null;
        super.destroy(fromScene);
    }
}
