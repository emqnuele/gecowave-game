import Phaser from 'phaser';
import { COMBAT, PHYSICS, PLAYER_SPRITE } from '../config';
import { FX } from '../engine/art/abilityFx';
import { bus } from '../engine/events';
import type { Input } from '../engine/input/Input';
import { quickHeal } from '../engine/inventory';
import { sfx } from '../engine/sfx';
import { state } from '../engine/state';
import type { AbilityId } from '../types';

export type AttackDir = 'side' | 'up' | 'down';

export class Player extends Phaser.Physics.Arcade.Sprite {
    facing: 1 | -1 = 1;
    dead = false;
    attackHitbox: Phaser.GameObjects.Zone;
    attackDir: AttackDir = 'side';
    attackActive = false;
    /** colpo della combo in corso: 0,1,2 — il terzo spacca */
    comboStep = 0;

    private controls: Input;

    private coyoteUntil = 0;
    private jumpBufferedUntil = 0;
    private airJumpUsed = false;
    /** aggrappo: muro a cui sei attaccato (-1 sinistra, 1 destra), ultimo contatto e blocco dopo il salto */
    private wallSide: -1 | 0 | 1 = 0;
    private wallUntil = 0;
    private wallLockUntil = 0;
    private wallDustAt = 0;
    /** schianto: picchiata giù+attacco che sfonda i muri dall'alto */
    slamming = false;
    private slamUntil = 0;
    private slamDustAt = 0;
    private dashing = false;
    private dashUntil = 0;
    private dashCooldownUntil = 0;
    private attackCooldownUntil = 0;
    private attackActiveUntil = 0;
    private comboResetAt = 0;
    private attacking = false;
    private attackAnimUntil = 0;
    private invulnUntil = 0;
    private healHeldMs = 0;
    private wasGrounded = true;
    private charging = false;
    private chargeStart = 0;
    private chargeEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
    private chargeRing: Phaser.GameObjects.Image | null = null;
    private chargeHit1 = false;
    private chargeHit2 = false;
    private riflessoReadyAt = 0;
    /** la scena lo alza finché il clone vive e lo scambio non è usato */
    riflessoSwapAvailable = false;
    private analisiReadyAt = 0;
    private scudoReadyAt = 0;
    private acquaReadyAt = 0;
    /** lo imposta la scena quando il geco è dentro un allagamento */
    submerged = false;
    /** testa sott'acqua: il mondo si sente da dentro una vasca */
    headUnder = false;
    /** spinta del posto (corrente del rio, nastri dello stabilimento), px/s; la scena la rimette ogni fotogramma */
    drift = 0;
    /** tana: dentro l'armadio non si vede, non si muove, non si prende danno */
    hidden = false;
    private stunnedUntil = 0;
    private nextSmelaStun = 0;
    private nextTrenDrain = 0;
    private lastDamageAt = 0;
    private nextRegenAt = 0;

    constructor(scene: Phaser.Scene, x: number, y: number, input: Input) {
        super(scene, x, y, 'player', 0);
        this.controls = input;
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

    /** in scivolata: un fotogramma sfocato per chi guarda (telecamere, allarmi) */
    get isDashing(): boolean {
        return this.dashing;
    }

    get isGrounded(): boolean {
        return this.grounded;
    }

    /** frazione di ricarica restante per wave, 0 pronta: la legge l'hud */
    cooldowns(): Partial<Record<AbilityId, number>> {
        const now = this.scene.time.now;
        const frac = (readyAt: number, total: number): number => {
            const left = readyAt - now;
            return left <= 0 ? 0 : Math.min(1, left / total);
        };
        return {
            riflesso: this.riflessoSwapAvailable ? 0 : frac(this.riflessoReadyAt, COMBAT.riflessoCooldownMs),
            risonante: 0,
            analisi: frac(this.analisiReadyAt, COMBAT.analisiCooldownMs),
            scudo: frac(this.scudoReadyAt, COMBAT.scudoCooldownMs),
            acquatossica: frac(this.acquaReadyAt, COMBAT.acquaCooldownMs),
        };
    }

    /** invulnerabilità breve regalata dallo scambio col riflesso */
    grantInvuln(ms: number): void {
        this.invulnUntil = Math.max(this.invulnUntil, this.scene.time.now + ms);
    }

    get invulnerable(): boolean {
        return state.godMode || this.dashing || this.hidden || this.scene.time.now < this.invulnUntil;
    }

    private get grounded(): boolean {
        return (this.body as Phaser.Physics.Arcade.Body).blocked.down;
    }

    private get stunned(): boolean {
        return this.scene.time.now < this.stunnedUntil;
    }

    /** tana: da nascosto, un tasto di movimento fa uscire dall'armadio */
    get movePressed(): boolean {
        return this.controls.down('left') || this.controls.down('right') || this.controls.down('up')
            || this.controls.down('down') || this.controls.down('jump');
    }

    /** fermo a terra: per "su" del pad che vale come interagisci */
    get still(): boolean {
        const body = this.body as Phaser.Physics.Arcade.Body;
        return this.grounded && Math.abs(body.velocity.x) < 40;
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
        this.updateBuffs(delta);
        if (this.hidden) {
            body.setAccelerationX(0);
            body.setVelocity(0, 0);
            return;
        }
        if (this.stunned) {
            body.setAccelerationX(0);
            body.setVelocityX(body.velocity.x * 0.8);
            return;
        }

        const left = this.controls.down('left');
        const right = this.controls.down('right');
        const upHeld = this.controls.down('up');
        const downHeld = this.controls.down('down');

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

        // aggrappo: in aria, spingendo contro un muro mentre si scende
        const pressingWall = (body.blocked.left && left && !right) ? -1 : (body.blocked.right && right && !left) ? 1 : 0;
        if (!this.grounded && pressingWall && state.hasAbility('aggrappo') && body.velocity.y > -40) {
            this.wallSide = pressingWall;
            this.wallUntil = now + PHYSICS.wallCoyoteMs;
            if (body.velocity.y > PHYSICS.wallSlideSpeed) body.setVelocityY(PHYSICS.wallSlideSpeed);
            this.airJumpUsed = false;
            if (now >= this.wallDustAt) {
                this.wallDustAt = now + 90;
                // graffio sul muro: resta e svanisce piano
                const mark = this.scene.add.image(this.x + pressingWall * 14, this.y + 6, FX.scratch)
                    .setDepth(3).setFlipX(pressingWall < 0).setAlpha(0.85);
                this.scene.tweens.add({ targets: mark, alpha: 0, duration: 1200, onComplete: () => mark.destroy() });
            }
        } else if (this.grounded) {
            this.wallUntil = 0;
        }

        // schianto: giù+attacco in aria, picchiata che sfonda dall'alto
        if (this.slamming && !this.grounded) {
            if (body.velocity.y < COMBAT.slamFall) body.setVelocityY(COMBAT.slamFall);
            if (now >= this.slamDustAt) {
                this.slamDustAt = now + 120;
                const dust = this.scene.add.particles(this.x, this.y - 20, 'p-dot', {
                    speed: { min: 10, max: 50 }, angle: { min: 230, max: 310 },
                    scale: { start: 0.4, end: 0 }, alpha: { start: 0.5, end: 0 },
                    tint: 0xd6d3d1, lifespan: 300, quantity: 1, stopAfter: 1,
                });
                this.scene.time.delayedCall(650, () => dust.destroy());
            }
        }

        // movimento orizzontale (subito dopo un salto dal muro i comandi aspettano un attimo)
        const accel = this.grounded ? PHYSICS.runAccel : PHYSICS.airAccel;
        if (now < this.wallLockUntil) {
            body.setAccelerationX(0);
        } else if (left && !right) {
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
        // nell'acqua alta si arranca e si affonda piano; il salto resta pieno, se no le conche allagate diventano trappole
        const run = PHYSICS.runSpeed * state.mods.speed * (this.submerged ? 0.6 : 1);
        body.setMaxVelocityX(run + Math.abs(this.drift));
        if (this.drift !== 0 && now >= this.wallLockUntil) {
            // dentro una corrente si insegue la velocità del posto più quella dei comandi, non la sola accelerazione
            const dir = left && !right ? -1 : right && !left ? 1 : 0;
            body.setAccelerationX(0);
            body.setVelocityX(Phaser.Math.Linear(body.velocity.x, dir * run + this.drift, this.grounded ? 0.2 : 0.07));
        }
        if (this.submerged && body.velocity.y > 300) body.setVelocityY(300);

        // salto: buffer + coyote + rimbalzo
        if (this.controls.pressed('jump')) {
            this.jumpBufferedUntil = now + PHYSICS.jumpBufferMs;
        }
        if (now < this.jumpBufferedUntil) {
            if (this.grounded || now < this.coyoteUntil) {
                body.setVelocityY(-PHYSICS.jumpVelocity);
                this.jumpBufferedUntil = 0;
                this.coyoteUntil = 0;
                sfx.jump();
            } else if (now < this.wallUntil && this.wallSide !== 0) {
                // salto dal muro: su e via dal muro, i comandi tornano dopo un istante
                const away = -this.wallSide as 1 | -1;
                body.setVelocity(away * PHYSICS.wallJumpPush, -PHYSICS.wallJumpVelocity);
                this.facing = away;
                this.setFlipX(away < 0);
                this.wallLockUntil = now + PHYSICS.wallJumpLockMs;
                this.wallUntil = 0;
                this.jumpBufferedUntil = 0;
                sfx.jump();
                this.scene.events.emit('player-act', { act: 'wave', wave: 'aggrappo' });
                // spruzzo d'inchiostro dal lato del muro
                const spray = this.scene.add.particles(this.x - this.wallSide * 14, this.y, 'p-dot', {
                    speed: { min: 60, max: 180 }, angle: this.wallSide < 0 ? { min: -40, max: 40 } : { min: 140, max: 220 },
                    scale: { start: 0.5, end: 0 }, alpha: { start: 0.6, end: 0 }, tint: 0x0b0c10,
                    lifespan: 320, quantity: 6, stopAfter: 6,
                });
                this.scene.time.delayedCall(700, () => spray.destroy());
            } else if (!this.airJumpUsed && state.hasAbility('rimbalzo')) {
                body.setVelocityY(-PHYSICS.doubleJumpVelocity);
                this.airJumpUsed = true;
                this.jumpBufferedUntil = 0;
                sfx.doubleJump();
                this.scene.events.emit('player-act', { act: 'wave', wave: 'rimbalzo' });
                // anello di pennello che si apre sotto i piedi
                const ring = this.scene.add.image(this.x, this.y + 22, FX.ringJump).setDepth(3);
                this.scene.tweens.add({
                    targets: ring, scaleX: 1.7, scaleY: 1.7, alpha: 0, duration: 220,
                    onComplete: () => ring.destroy(),
                });
                const drops = this.scene.add.particles(this.x, this.y + 20, 'p-dot', {
                    speed: { min: 40, max: 120 }, angle: { min: 20, max: 160 },
                    scale: { start: 0.4, end: 0 }, tint: 0x4ade80, lifespan: 380, quantity: 6, stopAfter: 6,
                });
                this.scene.time.delayedCall(800, () => drops.destroy());
            }
        }
        // salto variabile: rilascio = taglio della spinta
        if (!this.controls.down('jump') && body.velocity.y < 0) {
            body.setVelocityY(body.velocity.y * (1 - (1 - PHYSICS.jumpCutFactor) * (delta / 100)));
        }

        if (this.controls.pressed('dash') && state.hasAbility('scivolata') && now >= this.dashCooldownUntil) {
            this.startDash();
        }

        if (this.controls.pressed('attack')) {
            this.tryAttack(upHeld ? 'up' : !this.grounded && downHeld ? 'down' : 'side');
        }

        // la wave si decide alla pressione: su = analisi, giù = bottiglia, da sola = risonante
        if (this.controls.pressed('wave')) {
            if (upHeld) {
                if (state.hasAbility('analisi') && now >= this.analisiReadyAt) {
                    if (this.spendFlow(COMBAT.analisiCost * state.mods.abilityCost)) {
                        this.analisiReadyAt = now + COMBAT.analisiCooldownMs;
                        sfx.unlock();
                        this.scene.events.emit('player-analisi', {});
                        this.scene.events.emit('player-act', { act: 'wave', wave: 'analisi' });
                    }
                } else {
                    sfx.ui();
                }
            } else if (downHeld) {
                if (state.hasAbility('acquatossica') && now >= this.acquaReadyAt) {
                    if (this.spendFlow(COMBAT.acquaCost * state.mods.abilityCost)) {
                        this.acquaReadyAt = now + COMBAT.acquaCooldownMs;
                        sfx.unlock();
                        // in aria la lasci cadere sotto di te, a terra la lanci ad arco
                        const aim = !this.grounded ? 'drop' : 'lob';
                        this.scene.events.emit('player-acqua', { x: this.x, y: this.y, facing: this.facing, aim });
                        this.scene.events.emit('player-act', { act: 'wave', wave: 'acquatossica' });
                    }
                } else {
                    sfx.ui();
                }
            } else if (!state.hasAbility('risonante')) {
                // niente ripieghi: il giocatore impara lo schema
                sfx.ui();
            }
        }
        this.updateRisonante(now);

        if (this.controls.pressed('eat')) bus.emit('toast', { text: quickHeal() });

        if (this.controls.pressed('riflesso') && state.hasAbility('riflesso')) {
            // seconda pressione col clone vivo: scambio di posto, non un clone nuovo
            const scene = this.scene as unknown as { cloneAlive?: boolean };
            if (this.riflessoSwapAvailable && scene.cloneAlive) {
                this.scene.events.emit('player-riflesso-swap', {});
                return;
            }
            if (now < this.riflessoReadyAt) return;
            if (this.spendFlow(COMBAT.riflessoCost * state.mods.abilityCost)) {
                this.riflessoReadyAt = now + COMBAT.riflessoCooldownMs;
                sfx.unlock();
                this.scene.events.emit('player-riflesso', { x: this.x, y: this.y, facing: this.facing });
                this.scene.events.emit('player-act', { act: 'wave', wave: 'riflesso' });
            }
        }

        if (this.controls.pressed('scudo') && state.hasAbility('scudo') && now >= this.scudoReadyAt) {
            if (this.spendFlow(COMBAT.scudoCost * state.mods.abilityCost)) {
                this.scudoReadyAt = now + COMBAT.scudoCooldownMs;
                sfx.unlock();
                this.scene.events.emit('player-scudo', {});
                this.scene.events.emit('player-act', { act: 'wave', wave: 'scudo' });
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
                const puff = this.scene.add.particles(this.x, this.y + 10, 'p-dot', {
                    speed: { min: 10, max: 40 },
                    angle: { min: 60, max: 120 },
                    scale: { start: 0.5, end: 0 },
                    tint: 0x8b5a2b,
                    lifespan: 500,
                    quantity: 6,
                    stopAfter: 6,
                });
                this.scene.time.delayedCall(900, () => puff.destroy());
            }
        }

        if (immune && state.run.hp < state.maxHp && now - this.lastDamageAt > COMBAT.regenIdleMs) {
            if (this.nextRegenAt === 0) this.nextRegenAt = now + COMBAT.regenTickMs;
            if (now >= this.nextRegenAt) {
                this.nextRegenAt = now + COMBAT.regenTickMs;
                state.run.hp += 1;
                // la cura si vede: una goccia scende sul geco
                const drip = this.scene.add.image(this.x, this.y - 34, FX.regenDrip).setDepth(6);
                const glow = this.scene.add.image(this.x, this.y - 34, `${FX.regenDrip}~glow`)
                    .setDepth(5).setBlendMode(Phaser.BlendModes.ADD);
                this.scene.tweens.add({
                    targets: [drip, glow], y: this.y - 6, alpha: 0, duration: 420,
                    onComplete: () => { drip.destroy(); glow.destroy(); },
                });
                sfx.regen();
                this.scene.events.emit('player-act', { act: 'wave', wave: 'rigenerazione' });
                bus.emit('hp-changed', { hp: state.run.hp, maxHp: state.maxHp, hurt: false, regen: true });
                bus.emit('flow-changed', { flow: state.run.flow, maxFlow: state.maxFlow });
            }
        } else if (now - this.lastDamageAt <= COMBAT.regenIdleMs) {
            this.nextRegenAt = 0;
        }
    }

    /** caffè della mensa e sim di pedro: effetti a tempo e rigenerazione del flow */
    private updateBuffs(delta: number): void {
        const regen = state.mods.flowRegen;
        if (regen > 0 && state.run.flow < state.maxFlow) {
            state.run.flow = Math.min(state.maxFlow, state.run.flow + (regen * delta) / 1000);
            bus.emit('flow-changed', { flow: state.run.flow, maxFlow: state.maxFlow });
        }
    }

    /* ---------- azioni ---------- */

    private startDash(): void {
        const body = this.body as Phaser.Physics.Arcade.Body;
        // un dash può interrompere l'animazione d'attacco: chiudi lo stato e l'origine
        if (this.attacking) {
            this.attacking = false;
            this.setOrigin(0.5, 0.5);
        }
        this.dashing = true;
        this.dashUntil = this.scene.time.now + PHYSICS.dashMs;
        this.dashCooldownUntil = this.scene.time.now + PHYSICS.dashCooldownMs * state.mods.dashCooldown;
        body.setAllowGravity(false);
        body.setMaxVelocityX(PHYSICS.dashSpeed);
        body.setVelocity(PHYSICS.dashSpeed * this.facing, 0);
        body.setAccelerationX(0);
        sfx.dash();
        this.scene.events.emit('player-act', { act: 'dash' });
        this.scene.events.emit('player-act', { act: 'wave', wave: 'scivolata' });
        this.play('p-jump', true);
        // sagome d'inchiostro che restano indietro
        for (let i = 0; i < 4; i++) {
            this.scene.time.delayedCall(i * 35, () => {
                if (!this.scene) return;
                const ghost = this.scene.add.image(this.x, this.y, FX.dashGhost)
                    .setFlipX(this.flipX).setScale(0.8)
                    .setAlpha(0.45).setTint(0x4ade80).setDepth(this.depth - 1);
                this.scene.tweens.add({ targets: ghost, alpha: 0, duration: 220, onComplete: () => ghost.destroy() });
            });
        }
        // linee di velocità orizzontali dietro il geco
        const lines = this.scene.add.particles(this.x - this.facing * 20, this.y, 'p-dot', {
            speed: { min: 200, max: 420 }, angle: this.facing > 0 ? { min: 165, max: 195 } : { min: -15, max: 15 },
            scale: { start: 0.35, end: 0 }, alpha: { start: 0.5, end: 0 }, tint: 0xe8e6df,
            lifespan: 260, quantity: 6, stopAfter: 6,
        });
        this.scene.time.delayedCall(600, () => lines.destroy());
        if ((this.body as Phaser.Physics.Arcade.Body).blocked.down) this.dust(5);
    }

    private tryAttack(dir: AttackDir): void {
        const now = this.scene.time.now;
        if (this.dead || this.dashing || this.stunned || this.charging || now < this.attackCooldownUntil) return;
        // tutte le maschere: il ritmo perfetto, si mena più veloce
        const rhythm = state.hasFlag('maschera-completa') ? 0.7 : 1;
        const cooldown = COMBAT.attackCooldownMs * rhythm;
        this.attackCooldownUntil = now + cooldown;
        this.attackActiveUntil = now + COMBAT.attackActiveMs;
        // fallback: se animationcomplete non scatta (anim interrotta da dash/atterraggio)
        // sblocchiamo comunque lo stato. p-attack dura ~222ms (4 frame a 18fps)
        this.attackAnimUntil = now + 260;
        this.attackActive = true;
        this.attackDir = dir;
        {
            // schianto: se stai cadendo, qualsiasi attacco diventa picchiata.
            // parte la picchiata, si ferma a terra o sul pogo
            const slamBody = this.body as Phaser.Physics.Arcade.Body;
            if (!this.grounded && slamBody.velocity.y > COMBAT.slamMinFall) {
                this.attackDir = 'down';
                this.slamming = true;
                this.slamUntil = now + 4000;
                slamBody.setVelocityY(Math.max(slamBody.velocity.y, COMBAT.slamFall));
            }
        }
        this.comboResetAt = now + COMBAT.comboWindowMs;
        this.scene.events.emit('player-act', { act: 'attack', dir: this.attackDir });
        sfx.slash();
        this.attacking = true;
        // il frame d'attacco è largo il doppio: l'origine va sul corpo
        this.setOrigin(this.flipX ? 0.75 : 0.25, 0.5);
        this.play('p-attack', true);
        this.slashVisual(this.attackDir, this.comboStep);
        this.comboStep = (this.comboStep + 1) % 3;
    }

    /** atterraggio dello schianto: una sola volta, consuma la picchiata */
    consumeSlamLanding(): boolean {
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (this.slamming && body.blocked.down && this.scene.time.now < this.slamUntil) {
            this.slamming = false;
            return true;
        }
        if (this.scene.time.now >= this.slamUntil) this.slamming = false;
        return false;
    }

    /** danno del colpo corrente: il terzo della combo spacca */
    get attackDamage(): number {
        const base = this.comboStep === 0 ? 2 : 1;
        return base * state.damageMult * (1 + state.save.stats.forza * 0.1);
    }

    /** la carica non parte al rilascio dentro un dialogo: si cancella e basta */
    cancelCharge(): void {
        if (!this.charging) return;
        this.charging = false;
        this.chargeEmitter?.destroy();
        this.chargeEmitter = null;
        this.chargeRing?.destroy();
        this.chargeRing = null;
    }

    private updateRisonante(now: number): void {
        if (!state.hasAbility('risonante')) {
            if (this.charging) this.cancelCharge();
            return;
        }
        const ecoCost = COMBAT.risonanteEcoCost * state.mods.abilityCost;
        if (this.controls.down('wave') && !this.charging && state.run.flow >= ecoCost) {
            this.charging = true;
            this.chargeStart = now;
            this.chargeHit1 = false;
            this.chargeHit2 = false;
            this.chargeEmitter = this.scene.add.particles(0, 0, 'p-spark', {
                follow: this,
                speed: { min: 40, max: 120 },
                scale: { start: 0.5, end: 0 },
                tint: 0xa855f7,
                lifespan: 300,
                frequency: 40,
            });
            this.chargeRing = this.scene.add.image(this.x, this.y, FX.chargeRing).setDepth(5).setScale(1.4).setAlpha(0.8);
        }
        if (this.charging) {
            const held = now - this.chargeStart;
            // l'anello si stringe sul geco mentre carichi
            this.chargeRing?.setPosition(this.x, this.y).setScale(Math.max(0.6, 1.4 - held / 1400));
            if (!this.chargeHit1 && held >= COMBAT.risonanteChargeMs) {
                this.chargeHit1 = true;
                sfx.chargeStep(1);
                this.scene.cameras.main.flash(60, 168, 85, 247);
            }
            if (!this.chargeHit2 && held >= COMBAT.risonanteFullChargeMs) {
                this.chargeHit2 = true;
                sfx.chargeStep(2);
                this.chargeRing?.setTint(0xa855f7);
                this.scene.cameras.main.flash(90, 168, 85, 247);
            }
        }
        if (this.charging && this.controls.released('wave')) {
            const held = now - this.chargeStart;
            this.chargeEmitter?.destroy();
            this.chargeEmitter = null;
            this.chargeRing?.destroy();
            this.chargeRing = null;
            this.charging = false;
            // tre colpi, mai un rilascio a vuoto: si spara il più forte che puoi pagare
            const fullCost = COMBAT.risonanteFullCost * state.mods.abilityCost;
            const waveCost = COMBAT.risonanteCost * state.mods.abilityCost;
            let level: 0 | 1 | 2 = 0;
            let cost = ecoCost;
            if (held >= COMBAT.risonanteFullChargeMs && state.run.flow >= fullCost) {
                level = 2;
                cost = fullCost;
            } else if (held >= COMBAT.risonanteChargeMs && state.run.flow >= waveCost) {
                level = 1;
                cost = waveCost;
            } else if (state.run.flow < ecoCost) {
                sfx.ui();
                bus.emit('toast', { text: 'flow insufficiente. colpisci qualcosa.' });
                return;
            }
            if (this.spendFlow(cost)) {
                if (level === 2) sfx.shootFull();
                else if (level === 1) sfx.shoot();
                else sfx.shootEco();
                this.scene.cameras.main.flash(80, 168, 85, 247);
                this.scene.events.emit('player-risonante', { x: this.x + this.facing * 26, y: this.y, dir: this.facing, level });
                this.scene.events.emit('player-act', { act: 'attack', dir: 'shot' });
                this.scene.events.emit('player-act', { act: 'wave', wave: 'risonante', level });
            } else {
                sfx.ui();
            }
        }
        // tasto mollato mentre non caricavi: niente
        if (!this.charging && this.chargeRing) {
            this.chargeRing.destroy();
            this.chargeRing = null;
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
            && state.run.hp < state.maxHp && this.controls.down('heal') && !downHeld;
        if (canHeal) {
            if (this.healHeldMs === 0) this.scene.events.emit('player-act', { act: 'heal-start' });
            this.healHeldMs += delta;
            this.setTint(0x4ade80);
            if (this.healHeldMs >= COMBAT.healHoldMs * state.mods.healTime) {
                this.healHeldMs = 0;
                state.run.flow -= COMBAT.healCost;
                state.run.hp += 1;
                sfx.heal();
                this.scene.events.emit('player-act', { act: 'heal' });
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
        state.run.flow = Math.min(state.maxFlow, state.run.flow + COMBAT.flowPerHit * state.mods.flowPerHit);
        this.emitVitals(false);
        // il pogo chiude la picchiata: rimbalzi invece di sprofondare
        this.slamming = false;
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
        this.slamming = false;
        state.run.hp = Math.max(0, state.run.hp - amount * state.mods.damageTaken);
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
            this.chargeRing?.destroy();
            this.chargeRing = null;
            sfx.die();
            this.scene.events.emit('player-dead');
        }
        return true;
    }

    // instant death
    kill(): void {
        if (this.dead) return;
        this.slamming = false;
        state.run.hp = 0;
        this.emitVitals(true);
        this.burst(0xf87171, 14);
        this.dead = true;
        this.chargeEmitter?.destroy();
        this.chargeRing?.destroy();
        this.chargeRing = null;
        sfx.die();
        this.scene.events.emit('player-dead');
    }

    stun(duration: number): void {
        this.stunnedUntil = this.scene.time.now + duration;
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setAccelerationX(0);
        body.setVelocity(0, 0);
    }

    /* ---------- visuale ---------- */

    private updateAnimation(body: Phaser.Physics.Arcade.Body): void {
        // se l'attacco è scaduto ma animationcomplete non è scattato (anim interrotta),
        // sblocchiamo lo stato per non restare congelati su un frame
        if (this.attacking && this.scene.time.now >= this.attackAnimUntil) {
            this.attacking = false;
            this.setOrigin(0.5, 0.5);
        }
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
            hb.setSize(52, COMBAT.attackRange * state.mods.range);
            this.attackHitbox.setPosition(this.x, this.y - 48);
        } else if (this.attackDir === 'down') {
            hb.setSize(52, COMBAT.attackRange * state.mods.range);
            this.attackHitbox.setPosition(this.x, this.y + 48);
        } else {
            const range = COMBAT.attackRange * state.mods.range;
            hb.setSize(range, 52);
            this.attackHitbox.setPosition(this.x + this.facing * (44 + (range - COMBAT.attackRange) / 2), this.y);
        }
        hb.position.set(this.attackHitbox.x - hb.width / 2, this.attackHitbox.y - hb.height / 2);
    }

    private slashVisual(dir: AttackDir, combo: number): void {
        // pennellata: forma piena col bordo chiaro, il terzo con la coda d'inchiostro
        const big = combo === 2;
        const key = big ? FX.slashBig : FX.slash;
        const angle = dir === 'up' ? -Math.PI / 2 : dir === 'down' ? Math.PI / 2 : this.facing === 1 ? 0 : Math.PI;
        const img = this.scene.add.image(this.x, this.y, key).setDepth(this.depth + 1).setRotation(angle);
        this.scene.tweens.add({
            targets: img,
            alpha: 0,
            scaleX: big ? 1.3 : 1.15,
            scaleY: big ? 1.3 : 1.15,
            duration: big ? 180 : 140,
            onComplete: () => img.destroy(),
        });
    }

    private dust(count: number): void {
        const dust = this.scene.add.particles(this.x, this.y + 24, 'p-dot', {
            speed: { min: 20, max: 70 },
            angle: { min: 200, max: 340 },
            scale: { start: 0.5, end: 0 },
            alpha: { start: 0.4, end: 0 },
            lifespan: 350,
            quantity: count,
            stopAfter: count,
        });
        this.scene.time.delayedCall(750, () => dust.destroy());
    }

    private burst(tint: number, count: number): void {
        const burst = this.scene.add.particles(this.x, this.y, 'p-spark', {
            speed: { min: 120, max: 260 },
            scale: { start: 0.9, end: 0 },
            tint,
            lifespan: 320,
            quantity: count,
            stopAfter: count,
        });
        this.scene.time.delayedCall(700, () => burst.destroy());
    }
}
