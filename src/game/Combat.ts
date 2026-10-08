import Phaser from 'phaser';
import { COMBAT, TILE } from '../config';
import { hitMult, LESSONS } from '../content/lessons';
import { TOASTS } from '../content/story';
import { bus } from '../core/events';
import { sfx } from '../audio/sfx';
import { state } from '../core/state';
import { Boss } from '../entities/Boss';
import { Enemy } from '../entities/Enemy';
import { Spawner } from '../entities/Spawner';
import { poisonMultiplier, risonanteStep } from '../rules/combat';
import type { GameContext, GameSystem } from './context';
import { emitWorld } from '../core/worldEvents';

type CombatCtx = Pick<GameContext, 'simulates' | 'scene' | 'carry' | 'world' | 'player' | 'lighting' | 'groups' | 'enemies' | 'bosses' | 'abilities' | 'feel' | 'safe'>;

/** chi colpisce chi: collider, danni, proiettili, esplosioni, schianto */
export class Combat implements GameSystem {
    private readonly ctx: CombatCtx;
    private readonly scene: Phaser.Scene;

    constructor(ctx: CombatCtx) {
        this.ctx = ctx;
        this.scene = ctx.scene;
    }

    /** lo scudo para: clang, rinculo, nessun flow */
    parry(enemy: Enemy): void {
        const now = this.scene.time.now;
        if (now < this.ctx.carry.parryUntil) return;
        this.ctx.carry.parryUntil = now + 350;
        sfx.clang();
        const dir = Math.sign(this.ctx.player.x - enemy.x) || 1;
        (this.ctx.player.body as Phaser.Physics.Arcade.Body).setVelocityX(dir * 260);
        const sparks = this.scene.add.particles(enemy.x - dir * 18, enemy.y, 'p-spark', {
            speed: { min: 80, max: 220 }, angle: dir > 0 ? { min: -60, max: 60 } : { min: 120, max: 240 },
            scale: { start: 0.7, end: 0 }, tint: 0xe5e7eb, lifespan: 260, quantity: 8, stopAfter: 8,
        }).setDepth(6);
        this.scene.time.delayedCall(400, () => sparks.destroy());
    }

    onEnemyExplode({ x, y, r, from }: { x: number; y: number; r: number; from: Enemy }): void {
        sfx.crumble();
        sfx.hit();
        this.ctx.feel.shake(220, 0.01);
        const boom = this.scene.add.particles(x, y, 'p-spark', {
            speed: { min: 120, max: 340 }, scale: { start: 1.3, end: 0 }, tint: [0xef4444, 0xf97316, 0xfacc15],
            lifespan: 420, quantity: 26, stopAfter: 26,
        }).setDepth(6);
        this.scene.time.delayedCall(600, () => boom.destroy());
        const flash = this.ctx.lighting.static(x, y, 0xf97316, 200, 1.4);
        this.scene.time.delayedCall(260, () => this.ctx.lighting.remove(flash));
        if (Math.hypot(this.ctx.player.x - x, this.ctx.player.y - y) < r) this.ctx.player.hurt(1, x);
        // lo scoppio non guarda in faccia nessuno: anche i compagni si fanno male
        for (const obj of this.ctx.groups.enemies.getChildren()) {
            const e = obj as Enemy;
            if (e !== from && e.active && Math.hypot(e.x - x, e.y - y) < r) e.takeDamage(2, x);
        }
    }

    setupColliders(): void {
        const layer = this.ctx.world.level.layer;
        this.scene.physics.add.collider(this.ctx.player, layer);
        this.scene.physics.add.collider(this.ctx.groups.enemies, layer);
        this.scene.physics.add.collider(this.ctx.groups.barre, layer);
        this.scene.physics.add.collider(this.ctx.groups.playerProjectiles, layer, (proj) => this.popProjectile(proj as Phaser.Physics.Arcade.Sprite));
        this.scene.physics.add.collider(this.ctx.groups.enemyProjectiles, layer, (proj) => this.popProjectile(proj as Phaser.Physics.Arcade.Sprite));

        this.scene.physics.add.collider(this.ctx.player, this.ctx.groups.doors);
        this.scene.physics.add.collider(this.ctx.player, this.ctx.groups.arenaBars);
        this.scene.physics.add.collider(this.ctx.groups.enemies, this.ctx.groups.arenaBars);
        this.scene.physics.add.collider(this.ctx.groups.enemies, this.ctx.groups.doors);

        this.scene.physics.add.collider(this.ctx.player, this.ctx.world.level.breakableWalls);
        this.scene.physics.add.collider(this.ctx.groups.enemies, this.ctx.world.level.breakableWalls);
        this.scene.physics.add.collider(this.ctx.groups.barre, this.ctx.world.level.breakableWalls);
        this.scene.physics.add.collider(this.ctx.groups.playerProjectiles, this.ctx.world.level.breakableWalls, (proj) => {
            this.popProjectile(proj as Phaser.Physics.Arcade.Sprite);
            this.destroyBreakableWall(proj as Phaser.Physics.Arcade.Sprite);
        });
        this.scene.physics.add.overlap(this.ctx.player.attackHitbox, this.ctx.world.level.breakableWalls, (_hb, obj) => {
            if (!this.ctx.player.attackActive && !this.ctx.player.slamming) return;
            if (this.ctx.player.slamming) {
                // schianto: sfonda e continua a scendere, senza pogo
                this.destroyBreakableWall(obj as Phaser.Physics.Arcade.Sprite);
                return;
            }
            this.ctx.player.attackActive = false;
            this.ctx.player.onAttackHit();
            this.ctx.feel.hitstop();
            this.destroyBreakableWall(obj as Phaser.Physics.Arcade.Sprite);
        });

        this.scene.physics.add.overlap(this.ctx.player.attackHitbox, this.ctx.groups.enemies, (_hb, obj) => {
            if (!this.ctx.player.attackActive && !this.ctx.player.slamming) return;
            const enemy = obj as Enemy;
            if (enemy.blocks(this.ctx.player.x, this.ctx.player.attackDir)) {
                this.ctx.player.attackActive = false;
                this.parry(enemy);
                return;
            }
            this.ctx.player.attackActive = false;
            this.ctx.player.onAttackHit();
            this.ctx.feel.hitstop();
            const open = LESSONS[enemy.arch.kind]?.openAfterShot;
            const mult = open && enemy.justFired ? open : hitMult(enemy.arch.kind, this.ctx.player.attackDir);
            this.dmgTo(enemy, this.ctx.player.attackDamage * mult, this.ctx.player.x);
            this.weakFeedback(enemy, mult);
            // lo specchietto colpito dal basso perde quota e resta lì un attimo
            if (enemy.active && enemy.arch.kind === 'specchietto' && this.ctx.player.attackDir === 'up') {
                enemy.stun(650);
                (enemy.body as Phaser.Physics.Arcade.Body).setVelocityY(240);
            }
        });

        // i nidi si rompono a colpi: mezza dozzina di sciabolate, o un paio di onde
        this.scene.physics.add.overlap(this.ctx.player.attackHitbox, this.ctx.groups.spawners, (_hb, obj) => {
            if (!this.ctx.player.attackActive && !this.ctx.player.slamming) return;
            const s = obj as Spawner;
            if (this.ctx.player.slamming) {
                this.ctx.enemies.damageSpawner(s, 2);
                return;
            }
            this.ctx.player.attackActive = false;
            this.ctx.enemies.damageSpawner(s, this.ctx.player.attackDamage);
        });

        this.scene.physics.add.overlap(this.ctx.groups.playerProjectiles, this.ctx.groups.spawners, (a, b) => {
            const s = (a instanceof Spawner ? a : b) as Spawner;
            const bullet = (a instanceof Spawner ? b : a) as Phaser.Physics.Arcade.Sprite;
            if (!s.active || s.broken || !bullet.active) return;
            const level = (bullet.getData('level') as number | undefined) ?? -1;
            const reflected = !!bullet.getData('reflected');
            if (reflected) {
                const dmg = (bullet.getData('dmg') as number | undefined) ?? COMBAT.scudoReflectNormal;
                this.ctx.enemies.damageSpawner(s, dmg);
            } else {
                const step = risonanteStep(level);
                this.ctx.enemies.damageSpawner(s, state.risonanteDamage * state.damageMult * step);
                if (level === 0) this.popProjectile(bullet);
            }
            this.ctx.player.onAttackHit();
        });

        this.scene.physics.add.overlap(this.ctx.player, this.ctx.groups.enemies, (_p, obj) => {
            const enemy = obj as Enemy;
            // la lezione del citelis: attraverso la carica in scivolata, e lui sbanda
            if (this.ctx.player.isDashing && enemy.isCharging && LESSONS[enemy.arch.kind]?.staggerOnDash) {
                enemy.stagger(1700);
                sfx.clang();
                this.weakFeedback(enemy, 2);
                return;
            }
            // rimando perfetto: chi ti tocca in quella finestra viene respinto senza farti danno
            if (this.ctx.abilities.shieldPerfect(this.scene.time.now)) {
                const dir = Math.sign(enemy.x - this.ctx.player.x) || 1;
                (enemy.body as Phaser.Physics.Arcade.Body)?.setVelocity(dir * 420, -260);
                enemy.stun(COMBAT.scudoStunMs);
                sfx.perfectDing();
                this.ctx.abilities.refundNote();
                return;
            }
            this.ctx.player.hurt(1, enemy.x);
        });

        this.scene.physics.add.overlap(this.ctx.groups.playerProjectiles, this.ctx.groups.enemies, (a, b) => {
            const enemy = (a instanceof Enemy ? a : b) as Enemy;
            const bullet = (a instanceof Enemy ? b : a) as Phaser.Physics.Arcade.Sprite;
            if (!enemy.active || !bullet.active) return;
            // il colpo risonante perfora ma ogni bersaglio lo subisce una volta
            const hitSet = (bullet.getData('hit') ?? new Set()) as Set<Enemy>;
            if (hitSet.has(enemy)) return;
            const level = (bullet.getData('level') as number | undefined) ?? -1;
            const reflected = !!bullet.getData('reflected');
            // l'onda piena spacca anche gli scudi, eco e onda no
            if (enemy.blocks(bullet.x, 'shot') && level !== 2) {
                this.parry(enemy);
                this.popProjectile(bullet);
                return;
            }
            hitSet.add(enemy);
            bullet.setData('hit', hitSet);
            const mult = hitMult(enemy.arch.kind, reflected ? 'reflect' : 'shot');
            if (reflected) {
                const dmg = (bullet.getData('dmg') as number | undefined) ?? COMBAT.scudoReflectNormal;
                this.dmgTo(enemy, dmg * mult, bullet.x);
                if (bullet.getData('perfect') && enemy.active) enemy.stun(COMBAT.scudoStunMs);
            } else {
                const step = risonanteStep(level);
                this.dmgTo(enemy, state.risonanteDamage * state.damageMult * step * mult, bullet.x);
                // il colpo può uccidere: lo stordimento solo se è ancora in piedi
                if (level === 2 && enemy.active) enemy.stun(COMBAT.risonanteFullStunMs);
                // l'eco corta non perfora: si ferma al primo
                if (level === 0) this.popProjectile(bullet);
            }
            this.weakFeedback(enemy, mult);
            this.ctx.player.onAttackHit();
        });

        this.scene.physics.add.overlap(this.ctx.groups.enemyProjectiles, this.ctx.player, (a, b) => {
            const proj = (a === this.ctx.player ? b : a) as Phaser.Physics.Arcade.Sprite;
            if (this.ctx.abilities.shieldUp(this.scene.time.now)) {
                this.ctx.abilities.reflectProjectile(proj);
                return;
            }
            if (this.ctx.player.hurt(1, proj.x)) {
                this.popProjectile(proj);
            }
        });

        this.scene.physics.add.overlap(this.ctx.groups.lamette, this.ctx.player, (a, b) => {
            const blade = (a === this.ctx.player ? b : a) as Phaser.Physics.Arcade.Sprite;
            this.ctx.player.hurt(1, blade.x);
        });

        this.scene.physics.add.overlap(this.ctx.player, this.ctx.world.level.spikes, () => this.onSpikes());

        this.scene.physics.add.overlap(this.ctx.player, this.ctx.groups.barre, (_p, obj) => {
            const note = obj as Phaser.Physics.Arcade.Sprite;
            const value = note.getData('value') as number;
            note.destroy();
            state.save.barre += value;
            state.persist();
            sfx.barra();
            bus.emit('barre-changed', { barre: state.save.barre, gained: true });
        });

        if (this.ctx.bosses.current) {
            const cols = this.collidersOf(this.ctx.bosses.current);
            cols.push(this.scene.physics.add.collider(this.ctx.bosses.current, layer));
            cols.push(this.scene.physics.add.overlap(this.ctx.player.attackHitbox, this.ctx.bosses.current, () => {
                if (!this.ctx.player.attackActive || !this.ctx.bosses.current) return;
                this.ctx.player.attackActive = false;
                if (this.dmgTo(this.ctx.bosses.current, this.ctx.player.attackDamage, this.ctx.player.x, this.ctx.player.attackDir)) {
                    this.ctx.player.onAttackHit();
                    this.ctx.feel.hitstop();
                } else if (this.ctx.bosses.current.def.kind === 'guggu') {
                    bus.emit('toast', { text: TOASTS.gugguDoor });
                } else if (this.ctx.bosses.current.def.kind === 'limite') {
                    bus.emit('toast', { text: TOASTS.limiteScudo });
                }
            }));
            cols.push(this.scene.physics.add.overlap(this.ctx.player, this.ctx.bosses.current, () => {
                if (this.ctx.bosses.current) this.ctx.player.hurt(this.ctx.bosses.current.def.contactDamage, this.ctx.bosses.current.x);
            }));
            cols.push(this.scene.physics.add.overlap(this.ctx.groups.playerProjectiles, this.ctx.bosses.current, (obj, proj) => {
                const bullet = (obj === this.ctx.bosses.current ? proj : obj) as Phaser.Physics.Arcade.Sprite;
                if (!this.ctx.bosses.current || !bullet.active) return;
                const level = (bullet.getData('level') as number | undefined) ?? -1;
                if (bullet.getData('reflected')) {
                    // il rimando tocca il boss una volta sola: l'homing restava
                    // addosso e mitragliava a ogni frame
                    if (bullet.getData('bossHit')) return;
                    bullet.setData('bossHit', true);
                    const dmg = (bullet.getData('dmg') as number | undefined) ?? COMBAT.scudoReflectNormal;
                    if (this.dmgTo(this.ctx.bosses.current, dmg, bullet.x, 'shot')) this.ctx.player.onAttackHit();
                } else {
                    const step = risonanteStep(level);
                    if (this.dmgTo(this.ctx.bosses.current, state.risonanteDamage * state.damageMult * step, bullet.x, 'shot')) {
                        this.ctx.player.onAttackHit();
                    }
                    if (level === 0) this.popProjectile(bullet);
                }
            }));
        }
    }

    destroyBreakableWall(wall: Phaser.Physics.Arcade.Sprite): void {
        sfx.hit();
        sfx.crumble();
        this.scene.cameras.main.shake(80, 0.005);
        const burst = this.scene.add.particles(wall.x, wall.y, 'p-spark', {
            speed: { min: 60, max: 200 },
            scale: { start: 0.8, end: 0 },
            tint: 0xcccccc,
            lifespan: 400,
            quantity: 12,
            stopAfter: 12,
        });
        this.scene.time.delayedCall(800, () => burst.destroy());
        this.ctx.world.nav.open(Math.floor(wall.x / TILE), Math.floor(wall.y / TILE));
        wall.destroy();
    }

    /** l'impatto dello schianto: sfonda sotto i piedi e investe i nemici */
    slamLand(x: number, y: number): void {
        const r = COMBAT.slamRadius;
        sfx.crumble();
        this.scene.cameras.main.shake(180, 0.008);
        const dust = this.scene.add.particles(x, y + 10, 'p-dot', {
            speed: { min: 60, max: 220 }, angle: { min: 200, max: 340 },
            scale: { start: 0.6, end: 0 }, alpha: { start: 0.6, end: 0 },
            tint: 0xa8a29e, lifespan: 450, quantity: 12, stopAfter: 12,
        }).setDepth(6);
        this.scene.time.delayedCall(850, () => dust.destroy());
        const walls = this.ctx.world.level.breakableWalls.getChildren().filter((c) => {
            const w = c as Phaser.Physics.Arcade.Sprite;
            return Math.abs(w.x - x) < r && w.y > y - 20 && w.y < y + TILE * 1.5;
        });
        for (const w of walls) this.destroyBreakableWall(w as Phaser.Physics.Arcade.Sprite);
        for (const child of this.ctx.groups.enemies.getChildren()) {
            const e = child as Enemy;
            if (e.active && Math.hypot(e.x - x, e.y - y) < r + 40) this.dmgTo(e, COMBAT.slamDamage, x);
        }
        for (const child of this.ctx.groups.spawners.getChildren()) {
            const s = child as Spawner;
            if (s.active && !s.broken && Math.hypot(s.x - x, s.y - y) < r + 40) this.ctx.enemies.damageSpawner(s, COMBAT.slamDamage);
        }
        if (!state.hasFlag('spiegato-schianto')) {
            state.setFlag('spiegato-schianto');
            bus.emit('toast', { text: 'schianto! attacca ({k:attack}) mentre cadi per sfondare dall\u2019alto.' });
        }
    }

    /** danno del geco con l'avvelenamento: +30%, +15% sui boss */
    dmgTo(target: Enemy | Boss, amount: number, fromX: number, dir?: 'side' | 'up' | 'down' | 'shot'): boolean {
        if (!this.ctx.simulates) return false;
        const poisoned = this.ctx.abilities.isPoisoned(target, this.scene.time.now);
        const mult = poisonMultiplier(poisoned, target instanceof Boss);
        let landed = true;
        if (target instanceof Boss) landed = target.takeDamage(amount * mult, fromX, dir);
        else target.takeDamage(amount * mult, fromX);
        emitWorld(this.scene, 'damage', { target, amount: amount * mult, landed });
        return landed;
    }

    onSpikes(): void {
        if (!this.ctx.player.hurt(1, undefined)) return;
        // rientro morbido sull'ultima posizione sicura
        this.scene.cameras.main.flash(150, 248, 113, 113);
        this.scene.time.delayedCall(120, () => {
            if (this.ctx.player.dead) return;
            this.ctx.player.setPosition(this.ctx.safe.lastSafe.x, this.ctx.safe.lastSafe.y);
            (this.ctx.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
        });
    }

    onEnemyShoot({ x, y, tx, ty, color, speed, size }: { x: number; y: number; tx: number; ty: number; color?: number; speed?: number; size?: number }): void {
        if (!this.ctx.simulates) return;
        const proj = this.ctx.groups.enemyProjectiles.create(x, y, 'proj-ball') as Phaser.Physics.Arcade.Sprite;
        proj.setDepth(5);
        proj.setTint(color ?? 0xf87171);
        // chi ha sparato: il rimando perfetto deve sapere a chi tornare
        const shooter = this.ctx.enemies.nearestHostile(x, y);
        if (shooter && Math.hypot(shooter.x - x, shooter.y - y) < 80) proj.setData('shooter', shooter);
        // ogni attacco ha la sua voce: il cecchino è un ago, la croce un mattone, la spirale ronza
        const v = speed ?? 330;
        const s = size ?? 1;
        proj.setScale(s);
        const angle = Math.atan2(ty - y, tx - x);
        proj.setVelocity(Math.cos(angle) * v, Math.sin(angle) * v);
        if (v >= 550) {
            // ago caldo: allungato nella direzione di volo + scia
            proj.setRotation(angle);
            proj.setScale(s * 1.6, s * 0.7);
            const trail = this.scene.add.particles(0, 0, 'p-dot', {
                follow: proj, speed: 10, scale: { start: 0.45, end: 0 },
                tint: color ?? 0xffffff, lifespan: 220, frequency: 30,
            });
            trail.setDepth(4);
            proj.setData('trail', trail);
        } else if (s >= 1.1) {
            proj.setRotation(angle);
        }
        // pop di nascita: il colpo "esce" dal boss, non appare
        const pop = this.scene.add.particles(x, y, 'p-dot', {
            speed: { min: 20, max: 80 }, scale: { start: 0.5, end: 0 },
            tint: color ?? 0xf87171, lifespan: 180, quantity: 3, stopAfter: 3,
        });
        pop.setDepth(4);
        this.scene.time.delayedCall(400, () => pop.destroy());
        this.scene.time.delayedCall(3200, () => proj.active && this.popProjectile(proj));
    }

    onBossLamette({ xs, y }: { xs: number[]; y: number }): void {
        if (!this.ctx.simulates) return;
        for (const x of xs) {
            // telegrafo a terra prima della lama
            const tele = this.scene.add.particles(x, y + 40, 'p-dot', {
                speed: { min: 10, max: 50 },
                angle: { min: 250, max: 290 },
                scale: { start: 0.5, end: 0 },
                tint: 0xc084fc,
                lifespan: 350,
                quantity: 8,
                stopAfter: 8,
            });
            this.scene.time.delayedCall(750, () => tele.destroy());
            this.scene.time.delayedCall(480, () => {
                if (!this.scene.scene.isActive()) return;
                const blade = this.ctx.groups.lamette.create(x, y + 90, 'proj-lametta') as Phaser.Physics.Arcade.Sprite;
                blade.setDepth(5);
                blade.setVelocityY(-430);
                sfx.slash();
                this.scene.time.delayedCall(420, () => {
                    if (!blade.active) return;
                    this.scene.tweens.add({ targets: blade, alpha: 0, duration: 200, onComplete: () => blade.destroy() });
                });
            });
        }
    }

    popProjectile(proj: Phaser.Physics.Arcade.Sprite): void {
        if (!proj.active) return;
        (proj.getData('trail') as Phaser.GameObjects.Particles.ParticleEmitter | undefined)?.destroy();
        const pop = this.scene.add.particles(proj.x, proj.y, 'p-dot', {
            speed: { min: 30, max: 90 },
            scale: { start: 0.4, end: 0 },
            lifespan: 200,
            quantity: 4,
            stopAfter: 4,
        });
        this.scene.time.delayedCall(600, () => pop.destroy());
        proj.destroy();
    }

    /** la corazza suona, il punto debole brilla: la lezione si sente prima di leggerla */
    weakFeedback(enemy: Enemy, mult: number): void {
        if (mult === 1) return;
        const weak = mult > 1;
        if (!weak) sfx.clang();
        const sparks = this.scene.add.particles(enemy.x, enemy.y, 'p-spark', {
            speed: { min: 60, max: weak ? 260 : 140 }, scale: { start: weak ? 0.9 : 0.5, end: 0 },
            tint: weak ? 0xfacc15 : 0x9ca3af, lifespan: weak ? 380 : 220, quantity: weak ? 12 : 6, stopAfter: weak ? 12 : 6,
        }).setDepth(6);
        this.scene.time.delayedCall(500, () => sparks.destroy());
    }

    /** colliders per un boss evocato dopo il create (gli dei) */
    setupBossColliders(): void {
        if (!this.ctx.bosses.current) return;
        const cols = this.collidersOf(this.ctx.bosses.current);
        cols.push(this.scene.physics.add.collider(this.ctx.bosses.current, this.ctx.world.level.layer));
        cols.push(this.scene.physics.add.overlap(this.ctx.player.attackHitbox, this.ctx.bosses.current, () => {
            if (!this.ctx.player.attackActive || !this.ctx.bosses.current) return;
            this.ctx.player.attackActive = false;
            if (this.dmgTo(this.ctx.bosses.current, this.ctx.player.attackDamage, this.ctx.player.x, this.ctx.player.attackDir)) {
                this.ctx.player.onAttackHit();
                this.ctx.feel.hitstop();
            }
        }));
        cols.push(this.scene.physics.add.overlap(this.ctx.player, this.ctx.bosses.current, () => {
            if (this.ctx.bosses.current) this.ctx.player.hurt(this.ctx.bosses.current.def.contactDamage, this.ctx.bosses.current.x);
        }));
        cols.push(this.scene.physics.add.overlap(this.ctx.groups.playerProjectiles, this.ctx.bosses.current, (obj, proj) => {
            const bullet = (obj === this.ctx.bosses.current ? proj : obj) as Phaser.Physics.Arcade.Sprite;
            if (!this.ctx.bosses.current || !bullet.active) return;
            const level = (bullet.getData('level') as number | undefined) ?? -1;
            if (bullet.getData('reflected')) {
                const dmg = (bullet.getData('dmg') as number | undefined) ?? COMBAT.scudoReflectNormal;
                if (this.dmgTo(this.ctx.bosses.current, dmg, bullet.x, 'shot')) this.ctx.player.onAttackHit();
            } else {
                const step = risonanteStep(level);
                if (this.dmgTo(this.ctx.bosses.current, state.risonanteDamage * state.damageMult * step, bullet.x, 'shot')) {
                    this.ctx.player.onAttackHit();
                }
                if (level === 0) this.popProjectile(bullet);
            }
        }));
    }

    /** i collider di un boss muoiono con lui: chi arriva dopo non si trascina dietro quelli del boss distrutto */
    private collidersOf(boss: Boss): Phaser.Physics.Arcade.Collider[] {
        const cols: Phaser.Physics.Arcade.Collider[] = [];
        boss.once(Phaser.GameObjects.Events.DESTROY, () => {
            // allo spegnimento della scena il mondo fisico li ha già tolti: un collider si distrugge una volta sola
            for (const c of cols) if (c.world) c.destroy();
        });
        return cols;
    }

    destroy(): void {}
}
