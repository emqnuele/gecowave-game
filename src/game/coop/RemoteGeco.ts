import Phaser from 'phaser';
import { PLAYER_SPRITE } from '../../config';
import { FX } from '../../art/abilityFx';
import { ensurePartnerSkin, skinFinalCss } from '../../art/playerSkin';
import { skinPreset } from '../../content/skins';
import { sfx } from '../../audio/sfx';
import type { Act } from '../../coop/protocol';
import type { Character } from '../../coop/types';
import type { LightingManager } from '../../stage/LightingManager';

/** lo stato del geco come lo manda chi lo guida */
export interface GecoState {
    x: number;
    y: number;
    vx: number;
    vy: number;
    facing: 1 | -1;
    grounded: boolean;
    dashing: boolean;
    attacking: boolean;
    blink: boolean;
    dead: boolean;
    hidden: boolean;
    eating: boolean;
    charging: boolean;
    frozen: boolean;
    down: boolean;
    anim: number;
    hp: number;
    maxHp: number;
    decoy: { x: number; y: number } | null;
}

export const ANIMS = ['idle', 'run', 'jump', 'land', 'attack'] as const;

/** il geco del compagno: si muove solo da quello che arriva, ma si vede e si sente come un geco vero */
export class RemoteGeco extends Phaser.Physics.Arcade.Sprite {
    readonly char: Character;
    private readonly tag: Phaser.GameObjects.Text;
    private light: Phaser.GameObjects.Light | null = null;
    private readonly lighting: LightingManager;
    private anim = -1;
    /** l'ultimo stato applicato: chi deve mirare o contare i gechi lo legge da qui */
    last: GecoState | null = null;
    private chargeRing: Phaser.GameObjects.Image | null = null;
    private wasDead = false;
    private eatCrumbsAt = 0;

    constructor(scene: Phaser.Scene, x: number, y: number, char: Character, lighting: LightingManager) {
        ensurePartnerSkin(scene, char.skin);
        super(scene, x, y, 'player2', 0);
        this.char = char;
        this.lighting = lighting;
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setScale(PLAYER_SPRITE.scale);
        this.setPipeline('Light2D');
        this.setDepth(3.9);
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(PLAYER_SPRITE.bodyWidth, PLAYER_SPRITE.bodyHeight);
        body.setOffset(PLAYER_SPRITE.bodyOffsetX, PLAYER_SPRITE.bodyOffsetY);
        body.setAllowGravity(false);
        body.moves = false;
        body.immovable = true;
        this.play('p2-idle');
        this.on('animationcomplete-p2-attack', () => this.setOrigin(0.5, 0.5));
        this.tag = scene.add.text(x, y - 52, char.name.toLowerCase(), {
            fontFamily: '"Permanent Marker", cursive',
            fontSize: '13px',
            color: skinFinalCss(skinPreset(char.skin)),
            stroke: '#000000',
            strokeThickness: 4,
        }).setOrigin(0.5, 1).setDepth(8).setAlpha(0.9);
        // il compagno porta la sua luce: nel buio della tana si ritrova
        this.light = lighting.follow(this, 0xaaffdd, 230, 0.9);
    }

    /** dove sta il geco con i piedi: chi insegue mira lì */
    get feet(): number {
        return (this.body as Phaser.Physics.Arcade.Body).bottom;
    }

    get alive(): boolean {
        return this.active && !!this.last && !this.last.dead && !this.last.down;
    }

    /** nessuno lo può bersagliare: è nascosto, fermo in un dialogo o a terra */
    get untouchable(): boolean {
        const s = this.last;
        return !s || s.dead || s.down || s.hidden || s.frozen;
    }

    apply(s: GecoState, now: number): void {
        this.last = s;
        this.setPosition(s.x, s.y);
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.velocity.set(s.vx, s.vy);
        const gone = s.dead || s.down;
        if (gone !== this.wasDead) {
            this.wasDead = gone;
            if (gone) {
                this.burst(0xf87171, 14);
                this.scene.tweens.add({ targets: this, alpha: 0.25, angle: 90, duration: 500 });
            } else {
                this.scene.tweens.killTweensOf(this);
                this.setAngle(0);
                this.setAlpha(1);
                this.burst(0x4ade80, 12);
            }
        }
        this.tag.setPosition(s.x, s.y - 46);
        this.tag.setText(gone ? `${this.char.name.toLowerCase()} · a terra` : this.char.name.toLowerCase());
        if (gone) return;
        this.setFlipX(s.facing < 0);
        const alpha = s.hidden ? 0.08 : s.frozen ? 0.55 : s.blink && !s.dashing ? (Math.floor(now / 70) % 2 ? 0.35 : 0.9) : 1;
        this.setAlpha(alpha);
        this.tag.setVisible(!s.hidden);
        if (s.anim !== this.anim || (s.anim === 4 && !this.anims.isPlaying)) {
            this.anim = s.anim;
            const name = ANIMS[s.anim] ?? 'idle';
            if (name === 'attack') this.setOrigin(this.flipX ? 0.75 : 0.25, 0.5);
            else this.setOrigin(0.5, 0.5);
            this.play(`p2-${name}`, true);
        }
        if (s.charging) {
            if (!this.chargeRing) this.chargeRing = this.scene.add.image(this.x, this.y, FX.chargeRing).setDepth(5).setScale(1.2).setAlpha(0.7);
            this.chargeRing.setPosition(this.x, this.y);
        } else if (this.chargeRing) {
            this.chargeRing.destroy();
            this.chargeRing = null;
        }
        if (s.eating && now >= this.eatCrumbsAt) {
            this.eatCrumbsAt = now + 200;
            this.puff(this.x, this.y - 10, 0xd97706, 3, { min: 200, max: 340 });
        }
    }

    /** i gesti dell'altro: si vedono qui come li vede lui */
    act(a: Act): void {
        switch (a.a) {
            case 'slash': {
                const big = a.combo === 2;
                const angle = a.dir === 'up' ? -Math.PI / 2 : a.dir === 'down' ? Math.PI / 2 : this.flipX ? Math.PI : 0;
                const img = this.scene.add.image(this.x, this.y, big ? FX.slashBig : FX.slash).setDepth(this.depth + 1).setRotation(angle);
                this.scene.tweens.add({ targets: img, alpha: 0, scaleX: big ? 1.3 : 1.15, scaleY: big ? 1.3 : 1.15, duration: big ? 180 : 140, onComplete: () => img.destroy() });
                this.setOrigin(this.flipX ? 0.75 : 0.25, 0.5);
                this.play('p2-attack', true);
                this.anim = 4;
                sfx.slash();
                return;
            }
            case 'dash': {
                for (let i = 0; i < 4; i++) {
                    this.scene.time.delayedCall(i * 35, () => {
                        if (!this.active) return;
                        const g = this.scene.add.image(this.x, this.y, FX.dashGhost).setFlipX(this.flipX).setScale(0.8).setAlpha(0.45).setTint(0x4ade80).setDepth(this.depth - 1);
                        this.scene.tweens.add({ targets: g, alpha: 0, duration: 220, onComplete: () => g.destroy() });
                    });
                }
                return;
            }
            case 'jump2': {
                const ring = this.scene.add.image(this.x, this.y + 22, FX.ringJump).setDepth(3);
                this.scene.tweens.add({ targets: ring, scaleX: 1.7, scaleY: 1.7, alpha: 0, duration: 220, onComplete: () => ring.destroy() });
                return;
            }
            case 'walljump':
                this.puff(this.x - a.side * 14, this.y, 0x0b0c10, 6, a.side < 0 ? { min: -40, max: 40 } : { min: 140, max: 220 });
                return;
            case 'hurt':
                this.burst(0xf87171, 8);
                return;
            case 'slam':
                this.puff(a.x, a.y + 10, 0xa8a29e, 12, { min: 200, max: 340 });
                return;
            default:
                return;
        }
    }

    private puff(x: number, y: number, tint: number, n: number, angle: { min: number; max: number }): void {
        const p = this.scene.add.particles(x, y, 'p-dot', {
            speed: { min: 40, max: 160 }, angle, scale: { start: 0.5, end: 0 }, alpha: { start: 0.6, end: 0 },
            tint, lifespan: 340, quantity: n, stopAfter: n,
        }).setDepth(4);
        this.scene.time.delayedCall(800, () => p.destroy());
    }

    private burst(tint: number, count: number): void {
        const p = this.scene.add.particles(this.x, this.y, 'p-spark', {
            speed: { min: 120, max: 260 }, scale: { start: 0.9, end: 0 }, tint, lifespan: 320, quantity: count, stopAfter: count,
        }).setDepth(5);
        this.scene.time.delayedCall(700, () => p.destroy());
    }

    destroy(fromScene?: boolean): void {
        if (this.light) this.lighting.remove(this.light);
        this.light = null;
        this.tag.destroy();
        this.chargeRing?.destroy();
        this.chargeRing = null;
        super.destroy(fromScene);
    }
}
