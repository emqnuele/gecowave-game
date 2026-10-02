import Phaser from 'phaser';
import { BOSSES, type BossAttack, type BossDef } from '../content/bosses';
import { bus } from '../engine/events';
import { sfx } from '../engine/sfx';
import { state } from '../engine/state';
import type { BossKind } from '../types';
import { ensureCreature } from '../engine/art/creatures';
import { acoustics } from '../engine/audio/acoustics';
import { CreatureGlow, creatureBody, creatureFaces, creatureFrames, creatureRes } from '../engine/art/creatureKit';

type Phase = 1 | 2 | 3;

export class Boss extends Phaser.Physics.Arcade.Sprite {
    readonly def: BossDef;
    readonly maxHp: number;
    hp: number;
    engaged = false;
    invulnerable: boolean;
    /** la scena può cambiare cosa evoca (gli echi di ticummi col tuo abbonamento) */
    summonOverride: BossDef['summonKind'] = undefined;
    /** modalità dei nel patto con pedro: attacchi a raffica continua */
    frenzy = false;
    /** insegue il player muovendo lentamente l'ancoraggio (es. il 33) */
    chase = false;
    private shieldGraphics?: Phaser.GameObjects.Graphics;
    /** le sagome dei boss nascono piccole: nelle arene delle regioni devono incombere */
    baseScale: number;

    private anchorX: number;
    private anchorY: number;
    private t = 0;
    private nextAttackAt = 0;
    private busy = false;
    private summonedAtPhase: Phase | 0 = 0;
    private look: CreatureGlow;
    private frames: number;
    private res: number;
    /** di profilo: si gira verso chi combatte */
    private faces: boolean;

    constructor(scene: Phaser.Scene, x: number, y: number, kind: BossKind, hpOverride?: number) {
        super(scene, x, y, ensureCreature(scene, BOSSES[kind].texture));
        this.def = BOSSES[kind];
        this.maxHp = hpOverride ?? this.def.hp;
        this.hp = this.maxHp;
        this.invulnerable = this.def.startsInvulnerable ?? false;
        this.anchorX = x;
        this.anchorY = y;
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setPipeline('Light2D');
        // la scala si decide sulla misura logica; i fogli a inchiostro sono disegnati al doppio
        this.res = creatureRes(scene, this.texture.key);
        this.frames = creatureFrames(scene, this.texture.key);
        this.faces = creatureFaces(scene, this.texture.key);
        const frame = creatureBody(this);
        const big = Math.max(frame.w, frame.h) / this.res;
        this.baseScale = (big < 70 ? 2.1 : big < 100 ? 1.75 : 1.45) / this.res;
        this.setScale(this.baseScale);
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(false);
        body.setSize(frame.w * (this.def.bodyScale ?? 0.75), frame.h * (this.def.bodyScale ?? 0.75));
        this.look = new CreatureGlow(this);
        scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.syncLook, this);
        this.setDepth(5);

        if (kind === 'guggu' && !state.hasFlag('ivan')) {
            this.shieldGraphics = scene.add.graphics();
            this.shieldGraphics.setDepth(6);
        }
    }

    /** spostato dalla scena dopo la nascita: sospeso sopra il pavimento dell'arena */
    relocate(x: number, y: number): void {
        this.setPosition(x, y);
        this.anchorX = x;
        this.anchorY = y;
        (this.body as Phaser.Physics.Arcade.Body).reset(x, y);
    }

    get phase(): Phase {
        if (this.hp > this.maxHp * 0.66) return 1;
        if (this.hp > this.maxHp * 0.33) return 2;
        return 3;
    }

    engage(): void {
        if (this.engaged) return;
        this.engaged = true;
        this.nextAttackAt = this.scene.time.now + (this.frenzy ? 400 : 1600);
        sfx.bossRoar();
        bus.emit('boss-hp', { hp: this.hp, maxHp: this.maxHp, name: this.def.name });
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
            if (this.scaleX !== this.baseScale) this.setScale(this.baseScale);
            // scatti, tremori, niente movimenti morbidi: deve fare paura
            this.setDisplayOrigin(
                this.width / 2 + (Math.random() > 0.85 ? (Math.random() - 0.5) * 8 * this.res : 0),
                this.height / 2 + (Math.random() > 0.9 ? (Math.random() - 0.5) * 6 * this.res : 0)
            );
            if (Math.random() > 0.985) {
                this.setTintFill(Math.random() > 0.5 ? 0x22d3ee : 0xf87171);
                this.scene.time.delayedCall(60, () => this.active && !this.busy && this.clearTint());
            }
        } else {
            this.rotation = Math.sin(this.t / 1400) * 0.12;
            const pulse = 1 + Math.sin(this.t / 300) * 0.03;
            this.setScale(this.baseScale * pulse);
        }

        if (this.faces && player.active && Math.abs(player.x - this.x) > 24) this.setFlipX(player.x > this.x);

        if (!this.engaged || this.busy) return;

        // in frenzy l'ancora insegue il bersaglio: non si scappa dagli dei
        if (this.frenzy && player.active) {
            this.anchorX = player.x;
            this.anchorY = player.y - 130;
        } else if (this.chase && player.active) {
            // inseguimento morbido: l'ancora scivola verso il player, ma niente raffica
            this.anchorX += (player.x - this.anchorX) * 0.05;
            this.anchorY += (player.y - 150 - this.anchorY) * 0.05;
        }

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
        if (this.frenzy) cd = 500;
        this.nextAttackAt = now + cd;

        // evocazione una tantum a inizio fase
        const summonKind = this.summonOverride ?? this.def.summonKind;
        if (summonKind && phase >= 2 && this.summonedAtPhase < phase) {
            this.summonedAtPhase = phase;
            this.scene.events.emit('boss-summon', { x: this.anchorX - 180, y: this.anchorY, kind: summonKind });
            this.scene.events.emit('boss-summon', { x: this.anchorX + 180, y: this.anchorY, kind: summonKind });
            sfx.bossRoar();
            return;
        }

        const pool = this.def.attacks[this.frenzy ? 3 : phase];
        this.execute(pool[Math.floor(Math.random() * pool.length)], player, this.frenzy ? 3 : phase);
    }

    private execute(attack: BossAttack, player: Phaser.GameObjects.Sprite, phase: Phase): void {
        // non a ogni colpo: la voce resta un segnale, non un rumore di fondo
        if (Math.random() < 0.55) sfx.bossVoice(this.def.texture);
        switch (attack) {
            case 'dive': return this.dive(player, 700);
            case 'charge': return this.charge(player);
            case 'radial': return this.radial(phase === 3 ? 12 : 8);
            case 'rain': return this.rain(phase === 3 ? 7 : 5);
            case 'burst': return this.burst(player, phase === 1 ? 3 : 5);
            case 'teleport': return this.teleport(player);
            case 'lamette': return this.lamette(player, phase + 2);
            case 'summon': {
                const kind = this.summonOverride ?? this.def.summonKind;
                if (kind) {
                    this.scene.events.emit('boss-summon', { x: this.x, y: this.y, kind });
                }
                return;
            }
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
        this.engage();
        this.hp -= amount;
        this.setTintFill(0xffffff);
        this.scene.time.delayedCall(60, () => this.active && !this.busy && this.clearTint());
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.velocity.x += Math.sign(this.x - fromX) * 40;
        bus.emit('boss-hp', { hp: Math.max(0, this.hp), maxHp: this.maxHp, name: this.def.name });
        if (this.hp <= 0) this.die();
        else if (this.phase !== this.heardPhase) {
            // cambio di fase: un ruggito e la stanza che trattiene il fiato
            this.heardPhase = this.phase;
            sfx.bossRoar();
            acoustics.swell(1300, 0.7);
            this.scene.cameras.main.shake(350, 0.008);
        }
        return true;
    }

    private die(): void {
        if (this.shieldGraphics) {
            this.shieldGraphics.destroy();
        }
        bus.emit('boss-hp', null);
        acoustics.swell(3200, 1);
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

    private animT = 0;
    private heardPhase: Phase = 1;

    /** ciclo dei fotogrammi (più rapido a ogni fase) e strato emissivo che pulsa con la rabbia */
    private syncLook(_time: number, delta: number): void {
        if (!this.active) return;
        this.animT += delta * (this.engaged ? 0.8 + this.phase * 0.35 : 0.6);
        if (this.frames > 1) {
            const f = Math.floor(this.animT / 160) % this.frames;
            if (String(this.frame.name) !== String(f)) this.setFrame(f);
        }
        const rage = this.engaged ? 0.85 + Math.sin(this.animT / (420 - this.phase * 90)) * 0.15 : 0.8;
        this.look.sync(rage);
    }

    destroy(fromScene?: boolean): void {
        this.scene?.events.off(Phaser.Scenes.Events.POST_UPDATE, this.syncLook, this);
        this.look?.destroy();
        super.destroy(fromScene);
    }
}
