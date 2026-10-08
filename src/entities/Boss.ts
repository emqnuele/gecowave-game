import Phaser from 'phaser';
import { BOSSES, type BossAttack, type BossDef } from '../content/bosses';
import { bus } from '../engine/events';
import { sfx } from '../engine/sfx';
import { state } from '../engine/state';
import type { BossKind } from '../types';
import { bossPhase, type BossPhase } from '../rules/combat';
import { ensureCreature } from '../engine/art/creatures';
import { acoustics } from '../engine/audio/acoustics';
import { CreatureGlow, creatureBody, creatureFaces, creatureFrames, creatureRes } from '../engine/art/creatureKit';
import { emitWorld } from '../engine/worldEvents';

type Phase = BossPhase;

/** da dove arriva un colpo: serve a chi para una direzione sola (l'ombra che impara) */
export type HitDir = 'side' | 'up' | 'down' | 'shot';

export class Boss extends Phaser.Physics.Arcade.Sprite {
    readonly def: BossDef;
    maxHp: number;
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
    private guardDir: HitDir | null = null;
    private guardUntil = 0;
    /** le sagome dei boss nascono piccole: nelle arene delle regioni devono incombere */
    baseScale: number;

    private anchorX: number;
    private anchorY: number;
    private t = 0;
    private nextAttackAt = 0;
    private busy = false;
    private nextHopAt = 0;
    private hopX?: number;
    private hopY?: number;
    private lastDustAt = 0;
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
        return bossPhase(this.hp, this.maxHp);
    }

    engage(): void {
        if (this.engaged) return;
        this.engaged = true;
        this.nextAttackAt = this.scene.time.now + (this.frenzy ? 400 : 1600);
        // ingresso in scena per archetipo: ognuno entra a modo suo
        const move = this.def.move ?? 'hover';
        this.setScale(this.baseScale * 0.5);
        this.scene.tweens.add({ targets: this, scale: this.baseScale, duration: 420, ease: 'Back.easeOut' });
        this.setTintFill(this.def.glowColor);
        this.scene.time.delayedCall(160, () => this.active && this.clearTint());
        this.ringShock(this.x, this.y, this.def.glowColor);
        this.dust(10);
        if (move === 'erratic' || this.def.glitchy) {
            // appare a scatti: 3 blink prima di stare fermo
            this.setAlpha(0.2);
            for (let i = 1; i <= 3; i++) {
                this.scene.time.delayedCall(i * 120, () => {
                    if (!this.active) return;
                    this.setAlpha(i % 2 ? 1 : 0.2);
                    if (i === 3) this.setAlpha(1);
                });
            }
        } else if (move === 'turret') {
            // emerge dal basso
            const y0 = this.y + 70;
            this.setY(y0);
            this.scene.tweens.add({ targets: this, y: this.anchorY, duration: 550, ease: 'Quad.easeOut' });
        } else if (move === 'stalk') {
            // entra di lato con la polvere
            this.scene.tweens.add({ targets: this, x: this.anchorX, duration: 450, ease: 'Quad.easeOut' });
        }
        sfx.bossRoar();
        bus.emit('boss-hp', { hp: this.hp, maxHp: this.maxHp, name: this.def.name });
        emitWorld(this.scene, 'boss-engaged', this);
    }

    /** più robusto prima che lo scontro entri nel vivo (l'ombra nutrita dalle telecamere) */
    empower(mult: number): void {
        if (mult <= 1 || this.hp < this.maxHp) return;
        this.maxHp = Math.round(this.maxHp * mult);
        this.hp = this.maxHp;
        bus.emit('boss-hp', { hp: this.hp, maxHp: this.maxHp, name: this.def.name });
    }

    /** para i colpi da una direzione per un po': chi ripete la stessa mossa trova il muro */
    guard(dir: HitDir, ms: number): void {
        this.guardDir = dir;
        this.guardUntil = this.scene.time.now + ms;
    }

    get guarding(): HitDir | null {
        return this.guardDir && this.scene.time.now < this.guardUntil ? this.guardDir : null;
    }

    /** attacco ordinato dalla scena (l'ombra che punisce una cura prevedibile) */
    strike(attack: BossAttack, player: Phaser.GameObjects.Sprite): boolean {
        if (!this.canStrike()) return false;
        this.execute(attack, player, this.phase);
        this.nextAttackAt = this.scene.time.now + this.def.cooldownMs[this.phase];
        return true;
    }

    /** l'ombra ordina un contrattacco solo a boss libero e ingaggiato */
    canStrike(): boolean {
        return !!this.active && this.engaged && !this.busy;
    }

    /** letto lo scudo, l'ombra non spara dentro il perfetto: rimanda l'attacco */
    delayAttack(ms: number): void {
        this.nextAttackAt = Math.max(this.nextAttackAt, this.scene.time.now + ms);
    }

    /** la cutscene può ammazzare i tween a metà attacco: si riparte liberi */
    release(): void {
        this.busy = false;
    }

    update(_time: number, delta: number, player: Phaser.GameObjects.Sprite): void {
        if (!this.active) return;
        this.t += delta;
        const body = this.body as Phaser.Physics.Arcade.Body;
        const now = this.scene.time.now;
        // stile di movimento per archetipo: ogni boss tiene il palco a modo suo
        const move = this.def.move ?? 'hover';
        const phase = this.phase;

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
            // respiro + beccheggio: il corpo pende dalla parte dove va
            const vx = body.velocity.x;
            const bank = Phaser.Math.Clamp(vx * 0.00035, -0.16, 0.16);
            this.rotation = Math.sin(this.t / 1400) * 0.12 + bank;
            const amp = this.def.move === 'turret' ? 0.012 : 0.03;
            const pulse = 1 + Math.sin(this.t / 300) * amp;
            this.setScale(this.baseScale * pulse);
        }
        // scia viva: chi orbita o glitcha lascia afterimage, chi carica alza polvere
        if (this.engaged && !this.busy) {
            const spd = Math.abs(body.velocity.x) + Math.abs(body.velocity.y);
            if ((this.def.glitchy || this.def.move === 'orbit') && Math.random() > 0.93) this.afterimage();
            if (spd > 420 && this.t - (this.lastDustAt ?? 0) > 320) {
                this.lastDustAt = this.t;
                this.dust(3);
            }
        }

        if (this.faces && player.active && Math.abs(player.x - this.x) > 24) this.setFlipX(player.x > this.x);

        if (!this.engaged || this.busy) return;

        // in frenzy l'ancora insegue il bersaglio: non si scappa dagli dei
        if (this.frenzy && player.active) {
            this.anchorX = player.x;
            this.anchorY = player.y - 130;
        } else if (this.chase && player.active) {
            this.anchorX += (player.x - this.anchorX) * 0.05;
            this.anchorY += (player.y - 150 - this.anchorY) * 0.05;
        } else if (player.active) {
            const k = phase === 3 ? 1.6 : 1;
            switch (move) {
                case 'stalk':
                    // insegue in orizzontale, resta sopra il pavimento
                    this.anchorX += (player.x - this.anchorX) * 0.03 * k;
                    this.anchorY += ((player.y - 150) - this.anchorY) * 0.02 * k;
                    break;
                case 'strafe':
                    // pattuglia laterale: avanti e indietro davanti al player
                    this.anchorX += Math.sin(this.t / 900) * 2.2 * k;
                    this.anchorY += ((player.y - 170) - this.anchorY) * 0.02;
                    break;
                case 'turret':
                    // quasi immobile: la minaccia sono i pattern, non il corpo
                    break;
                case 'erratic':
                    // scatti casuali ogni ~1.2s
                    if (!this.nextHopAt || now > this.nextHopAt) {
                        this.nextHopAt = now + 900 + Math.random() * 700;
                        this.hopX = this.anchorX + (Math.random() - 0.5) * 360;
                        this.hopY = this.anchorY + (Math.random() - 0.5) * 140;
                    }
                    if (this.hopX !== undefined) {
                        this.anchorX += (this.hopX - this.anchorX) * 0.06 * k;
                        this.anchorY += ((this.hopY ?? this.anchorY) - this.anchorY) * 0.06 * k;
                    }
                    break;
                case 'orbit':
                    // orbita attorno al player: duello vero
                    {
                        const r = 190;
                        const a = this.t / 1100;
                        this.anchorX += ((player.x + Math.cos(a) * r) - this.anchorX) * 0.05 * k;
                        this.anchorY += ((player.y - 90 + Math.sin(a) * 70) - this.anchorY) * 0.05 * k;
                    }
                    break;
                case 'hover':
                default:
                    break;
            }
            // fase 3: tutti diventano un filo più aggressivi nel tenere il palco
            if (phase === 3 && (move === 'stalk' || move === 'orbit')) {
                this.anchorX += (player.x - this.anchorX) * 0.01;
            }
        }

        // ritorno morbido verso il punto di hover
        body.setVelocity(
            (this.anchorX - this.x) * 1.2 + Math.sin(this.t / 800) * 50,
            (this.anchorY - this.y) * 1.2 + Math.cos(this.t / 600) * 40
        );

        if (now < this.nextAttackAt) return;
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
            emitWorld(this.scene, 'boss-summon', { x: this.anchorX - 180, y: this.anchorY, kind: summonKind });
            emitWorld(this.scene, 'boss-summon', { x: this.anchorX + 180, y: this.anchorY, kind: summonKind });
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
            case 'spiral': return this.spiral(phase === 1 ? 2 : 3);
            case 'cross': return this.cross(player);
            case 'snipe': return this.snipe(player);
            case 'slam': return this.slam(player);
            case 'mines': return this.mines(player, phase === 3 ? 5 : 3);
            case 'summon': {
                const kind = this.summonOverride ?? this.def.summonKind;
                if (kind) {
                    emitWorld(this.scene, 'boss-summon', { x: this.x, y: this.y, kind });
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
        // marcatore a terra: dove atterra, si vede prima
        const mark = this.scene.add.graphics().setDepth(6);
        mark.lineStyle(2, this.def.glowColor, 0.85);
        mark.strokeCircle(tx, ty, 26);
        this.scene.tweens.add({ targets: mark, scale: 0.55, duration: 420, ease: 'Quad.easeIn' });
        this.scene.time.delayedCall(430, () => mark.destroy());
        this.anticipate(380);
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
                this.builtinImpact(90, 0.5);
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
        // linea di carica: si legge dove passa prima che parta
        const lane = this.scene.add.graphics().setDepth(6);
        lane.lineStyle(3, this.def.glowColor, 0.5);
        lane.lineBetween(this.x, player.y - 6, this.x + dir * 700, player.y - 6);
        this.scene.tweens.add({ targets: lane, alpha: 0.15, duration: 480 });
        this.scene.time.delayedCall(490, () => lane.destroy());
        this.anticipate(420);
        this.setTintFill(this.def.glowColor);
        this.scene.tweens.add({ targets: this, x: this.x + 4, duration: 60, yoyo: true, repeat: 4 });
        this.scene.time.delayedCall(480, () => {
            if (!this.active) return;
            this.clearTint();
            // scende all'altezza del giocatore e travolge
            this.scene.tweens.add({ targets: this, y: player.y - 6, duration: 180, ease: 'Quad.easeIn' });
            body.setVelocityX(dir * 640);
            sfx.dash();
            this.dust(6);
            this.scene.time.delayedCall(900, () => {
                if (!this.active) return;
                body.setVelocity(0, 0);
                this.builtinImpact(120, 0.6);
                this.scene.tweens.add({ targets: this, y: this.anchorY, duration: 500, ease: 'Quad.easeOut', onComplete: () => { this.busy = false; } });
            });
        });
    }

    private radial(count: number): void {
        this.anticipate(140);
        sfx.shoot();
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.2;
            this.shot(this.x, this.y, this.x + Math.cos(angle) * 100, this.y + Math.sin(angle) * 100, { speed: 220, size: 1 });
        }
    }

    /** pioggia dall'alto attorno all'ancora */
    private rain(count: number): void {
        this.anticipate(140);
        sfx.shoot();
        for (let i = 0; i < count; i++) {
            const ox = (i - count / 2) * 70 + Math.random() * 40;
            this.shot(this.anchorX + ox, this.anchorY - 260, this.anchorX + ox, this.anchorY + 240, { speed: 300, size: 0.95 });
        }
    }

    /** raffica mirata, stile gioco sparacchino */
    private burst(player: Phaser.GameObjects.Sprite, count: number): void {
        this.anticipate(120);
        for (let i = 0; i < count; i++) {
            this.scene.time.delayedCall(i * 130, () => {
                if (!this.active || !player.active) return;
                sfx.shoot();
                this.shot(this.x, this.y, player.x + (Math.random() - 0.5) * 60, player.y + (Math.random() - 0.5) * 40, { speed: 390, size: 0.8 });
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
                this.afterimage();
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
        emitWorld(this.scene, 'boss-lamette', { xs, y: player.y });
    }

    /** spirale rotante: 2-3 ventagli sfasati, firma dei boss glitch/divini */
    private spiral(waves: number): void {
        this.anticipate(160);
        sfx.shoot();
        const base = Math.random() * Math.PI * 2;
        for (let w = 0; w < waves; w++) {
            this.scene.time.delayedCall(w * 260, () => {
                if (!this.active) return;
                sfx.shoot();
                const n = 8;
                for (let i = 0; i < n; i++) {
                    const angle = base + (Math.PI * 2 * i) / n + w * 0.45;
                    this.shot(this.x, this.y, this.x + Math.cos(angle) * 100, this.y + Math.sin(angle) * 100, { speed: 260, size: 0.9 });
                }
            });
        }
    }

    /** croce mirata: 8 direzioni ruotate verso il player, si legge e si schiva in diagonale */
    private cross(player: Phaser.GameObjects.Sprite): void {
        this.anticipate(160);
        sfx.shoot();
        const aim = Math.atan2(player.y - this.y, player.x - this.x);
        for (let i = 0; i < 8; i++) {
            const angle = aim + (Math.PI / 4) * i;
            this.shot(this.x, this.y, this.x + Math.cos(angle) * 120, this.y + Math.sin(angle) * 120, { speed: 300, size: 1.15 });
        }
        // flash di lettura: la croce si vede prima di partire
        this.setTintFill(this.def.glowColor);
        this.scene.time.delayedCall(120, () => this.active && !this.busy && this.clearTint());
    }

    /** cecchino telegrafato: linea di mira 450ms, poi un colpo veloce */
    private snipe(player: Phaser.GameObjects.Sprite): void {
        this.anticipate(120);
        const gfx = this.scene.add.graphics().setDepth(6);
        const tx = player.x;
        const ty = player.y;
        gfx.lineStyle(2, this.def.glowColor, 0.7);
        gfx.lineBetween(this.x, this.y, tx, ty);
        // secondo tratto bianco: il colpo sta caricando
        gfx.lineStyle(1, 0xffffff, 0.9);
        gfx.lineBetween(this.x, this.y, tx, ty);
        sfx.ui();
        this.scene.tweens.add({ targets: gfx, alpha: 0.25, duration: 150, yoyo: true, repeat: 2 });
        this.scene.time.delayedCall(450, () => {
            gfx.destroy();
            if (!this.active || !player.active) return;
            sfx.shoot();
            emitWorld(this.scene, 'enemy-shoot', {
                x: this.x,
                y: this.y,
                tx: player.x,
                ty: player.y,
                color: 0xffffff,
                speed: 640,
                size: 0.7,
            });
        });
    }

    /** schianto AoE: piomba a terra dove sei, shockwave + shake. firma dei picchiatori */
    private slam(player: Phaser.GameObjects.Sprite): void {
        this.busy = true;
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0, 0);
        const tx = player.x;
        // anello a terra: qui atterra. spostati.
        const ring = this.scene.add.graphics().setDepth(6);
        ring.lineStyle(3, this.def.glowColor, 0.9);
        ring.strokeCircle(tx, player.y, 52);
        this.scene.tweens.add({ targets: ring, scale: 0.5, duration: 420, ease: 'Quad.easeIn' });
        this.scene.time.delayedCall(430, () => ring.destroy());
        this.anticipate(380);
        this.setTintFill(this.def.glowColor);
        this.scene.time.delayedCall(420, () => {
            if (!this.active) return;
            this.clearTint();
            const fromX = this.x;
            // vola sopra il bersaglio poi schianta
            this.scene.tweens.add({
                targets: this, x: tx, y: player.y - 40, duration: 220, ease: 'Quad.easeIn',
                onComplete: () => {
                    if (!this.active) return;
                    this.scene.cameras.main.shake(280, 0.01);
                    sfx.bossRoar();
                    this.dust(14);
                    this.ringShock(tx, player.y - 20, this.def.glowColor);
                    // shockwave radiale corta
                    for (let i = 0; i < 8; i++) {
                        const angle = (Math.PI * 2 * i) / 8;
                        this.shot(this.x, this.y - 20, this.x + Math.cos(angle) * 100, this.y - 20 + Math.sin(angle) * 100, { speed: 260, size: 1 });
                    }
                    // polvere + ritorno in aria
                    this.scene.time.delayedCall(350, () => {
                        if (!this.active) return;
                        this.scene.tweens.add({
                            targets: this, y: this.anchorY, x: fromX,
                            duration: 500, ease: 'Quad.easeOut',
                            onComplete: () => { this.busy = false; },
                        });
                    });
                },
            });
        });
    }

    /** mine predittive: colonne di lame dove STAI ANDANDO, non dove sei */
    private mines(player: Phaser.GameObjects.Sprite, count: number): void {
        const body = player.body as Phaser.Physics.Arcade.Body | null;
        const vx = body?.velocity.x ?? 0;
        const lead = Phaser.Math.Clamp(vx * 0.45, -220, 220);
        const xs: number[] = [];
        for (let i = 0; i < count; i++) {
            xs.push(player.x + lead + (i - (count - 1) / 2) * 72 + (Math.random() - 0.5) * 20);
        }
        // doppio tick: prima le esterne, poi il centro (costringe a muoversi)
        emitWorld(this.scene, 'boss-lamette', { xs, y: player.y });
        if (count >= 4) {
            this.scene.time.delayedCall(420, () => {
                if (!this.active || !player.active) return;
                emitWorld(this.scene, 'boss-lamette', { xs: [player.x + lead * 0.5], y: player.y });
            });
        }
    }

    /** proiettile firmato: ogni attacco ha la sua velocità e taglia */
    private shot(x: number, y: number, tx: number, ty: number, opts: { speed: number; size: number }): void {
        emitWorld(this.scene, 'enemy-shoot', {
            x, y, tx, ty, color: this.def.glowColor, speed: opts.speed, size: opts.size,
        });
    }

    /** anticipazione: il corpo si carica (squash) prima di colpire. si legge, è vivo. */
    private anticipate(ms: number): void {
        if (!this.active) return;
        const s = this.baseScale;
        this.scene.tweens.add({ targets: this, scaleX: s * 1.1, scaleY: s * 0.84, duration: Math.min(200, ms * 0.5), ease: 'Quad.easeOut' });
        this.scene.time.delayedCall(ms, () => {
            if (!this.active) return;
            this.scene.tweens.add({ targets: this, scaleX: s, scaleY: s, duration: 180, ease: 'Back.easeOut' });
        });
    }

    /** polvere ai piedi: peso e attrito */
    private dust(n: number): void {
        if (!this.active) return;
        const p = this.scene.add.particles(this.x, this.y + 30, 'p-dot', {
            speed: { min: 40, max: 160 }, angle: { min: 200, max: 340 },
            scale: { start: 0.7, end: 0 }, alpha: { start: 0.5, end: 0 },
            tint: 0xd6d3d1, lifespan: 450, quantity: n, stopAfter: n,
        });
        p.setDepth(4);
        this.scene.time.delayedCall(600, () => p.destroy());
    }

    /** onda d'urto ad anello: fasi, slam, engage. si sente. */
    private ringShock(x: number, y: number, color: number): void {
        if (!this.active) return;
        const g = this.scene.add.graphics().setDepth(6);
        g.lineStyle(4, color, 0.9);
        g.strokeCircle(x, y, 18);
        this.scene.tweens.add({
            targets: g, scale: 4.2, alpha: 0, duration: 420, ease: 'Quad.easeOut',
            onComplete: () => g.destroy(),
        });
    }

    /** contraccolpo degli atterraggi: polvere + shake piccolo */
    private builtinImpact(strength: number, shake: number): void {
        this.dust(5);
        this.scene.cameras.main.shake(Math.round(strength), shake * 0.01);
    }

    /** afterimage: scia per chi si muove da glitch */
    private afterimage(): void {
        if (!this.active) return;
        const ghost = this.scene.add.image(this.x, this.y, this.texture.key, this.frame.name)
            .setDepth(4).setScale(this.scaleX).setAlpha(0.35).setTint(this.def.glowColor);
        this.scene.tweens.add({ targets: ghost, alpha: 0, duration: 320, onComplete: () => ghost.destroy() });
    }

    takeDamage(amount: number, fromX: number, dir?: HitDir): boolean {
        if (!this.active) return false;
        if (dir && dir === this.guarding) {
            emitWorld(this.scene, 'boss-parried', { dir });
            this.ringShock(this.x + Math.sign(fromX - this.x) * 30, this.y, 0xffffff);
            sfx.clang();
            return false;
        }
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
            // cambio di fase: la stanza trattiene il fiato e il boss cambia pelle
            this.heardPhase = this.phase;
            emitWorld(this.scene, 'boss-phase', { phase: this.phase });
            sfx.bossRoar();
            acoustics.swell(1300, 0.7);
            this.scene.cameras.main.shake(350, 0.008);
            this.ringShock(this.x, this.y, this.def.glowColor);
            this.dust(10);
            // punch della camera: dentro e fuori in 300ms
            const cam = this.scene.cameras.main;
            const z = cam.zoom;
            cam.zoomTo(z * 1.05, 140);
            this.scene.time.delayedCall(160, () => cam.zoomTo(z, 220));
            // l'aura si scalda: più rabbia, più luce
            this.setTintFill(0xffffff);
            this.scene.time.delayedCall(140, () => this.active && this.clearTint());
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
        emitWorld(scene, 'boss-dying', { kind });
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
        scene.time.delayedCall(1300, () => emitWorld(scene, 'boss-defeated', { kind, x, y }));
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
