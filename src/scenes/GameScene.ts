import Phaser from 'phaser';
import { COMBAT, ZONE_HEX } from '../config';
import { DIALOGUES, TOASTS, WAVESUNG } from '../content/story';
import { LEVELS, TOTAL_FRAGMENTS } from '../content/levels';
import { bus } from '../engine/events';
import { DecorationManager } from '../engine/DecorationManager';
import { LightingManager } from '../engine/LightingManager';
import { loadLevel, type LoadedLevel } from '../engine/LevelLoader';
import { ParallaxManager } from '../engine/ParallaxManager';
import { sfx } from '../engine/sfx';
import { state } from '../engine/state';
import { generateZoneTextures } from '../engine/textures';
import { Boss } from '../entities/Boss';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import type { AbilityId, BossKind, EnemyKind, LevelDef } from '../types';

interface SceneData {
    levelId: string;
    checkpointId?: string | null;
    showCard?: boolean;
}

interface Interactable {
    x: number;
    y: number;
    range: number;
    onInteract: () => void;
}

const BOSS_INTRO: Partial<Record<BossKind, string>> = {
    guggu: 'guggu-intro',
    breccio: 'breccio-intro',
    notino: 'notino-intro',
    riba: 'riba-intro',
};

export class GameScene extends Phaser.Scene {
    private def!: LevelDef;
    private level!: LoadedLevel;
    private player!: Player;
    private boss: Boss | null = null;
    private enemies!: Phaser.GameObjects.Group;
    private playerProjectiles!: Phaser.Physics.Arcade.Group;
    private enemyProjectiles!: Phaser.Physics.Arcade.Group;
    private lametteGroup!: Phaser.Physics.Arcade.Group;
    private barreGroup!: Phaser.Physics.Arcade.Group;
    private interactables: Interactable[] = [];
    private prompt!: Phaser.GameObjects.Container;
    private lastSafe!: { x: number; y: number };
    private safeTimer = 0;
    private exiting = false;
    private checkpointSprites = new Map<string, Phaser.GameObjects.Sprite>();
    private lighting!: LightingManager;
    private parallax!: ParallaxManager;
    private clone: Phaser.GameObjects.Sprite | null = null;
    private cloneUntil = 0;
    private analisiUntil = 0;
    private nextAnalisiTick = 0;
    private analisiGlyphs: Phaser.GameObjects.Image[] = [];
    private bossIntroShown = false;
    private exitLockToastAt = 0;
    // arena di lametta
    private lamettaCenter: { x: number; y: number } | null = null;
    private lamettaActive = false;
    private nextLametteAt = 0;
    private nextPitturaAt = 0;
    private colorDropsTaken = 0;
    private mirror: Phaser.GameObjects.Sprite | null = null;
    // rio
    private ambushDone = false;
    private pedroChoiceShown = false;

    constructor() {
        super('GameScene');
    }

    init(data: SceneData): void {
        this.def = LEVELS[data.levelId];
        if (!this.def) throw new Error(`livello sconosciuto: ${data.levelId}`);
    }

    create(data: SceneData): void {
        this.exiting = false;
        this.boss = null;
        this.clone = null;
        this.mirror = null;
        this.interactables = [];
        this.analisiGlyphs = [];
        this.checkpointSprites.clear();
        this.lamettaCenter = null;
        this.lamettaActive = false;
        this.colorDropsTaken = 0;
        this.bossIntroShown = false;
        this.pedroChoiceShown = false;
        this.ambushDone = state.hasFlag('agguato-fatto');

        generateZoneTextures(this, this.def.color);

        this.lighting = new LightingManager(this);
        this.lighting.enable(this.def.color);

        this.level = loadLevel(this, this.def);
        this.level.layer.setDepth(2);
        this.level.spikes.setDepth(2, 0);

        this.parallax = new ParallaxManager(this);
        new DecorationManager(this, this.lighting).decorate(this.def.grid, this.def.color);
        this.buildWater();
        this.buildDust();

        let sp = this.level.spawn;
        const cpId = data.checkpointId ?? null;
        if (cpId) {
            const cp = this.level.checkpoints.find((c) => c.id === cpId);
            if (cp) sp = { x: cp.x, y: cp.y - 8 };
        }
        this.player = new Player(this, sp.x, sp.y);
        this.player.setDepth(4);
        this.lighting.playerLight(this.player);
        this.lastSafe = { ...sp };

        this.enemies = this.add.group({ runChildUpdate: false });
        this.playerProjectiles = this.physics.add.group({ allowGravity: false });
        this.enemyProjectiles = this.physics.add.group({ allowGravity: false });
        this.lametteGroup = this.physics.add.group({ allowGravity: false });
        this.barreGroup = this.physics.add.group();

        this.spawnEntities();
        this.spawnCheckpoints();
        this.spawnDroppedBarre();
        this.setupColliders();
        this.setupEvents();
        this.setupCamera();
        this.parallax.build(this.def.color);
        this.parallax.resize();
        this.buildPrompt();

        bus.emit('zone-changed', {
            title: this.def.title,
            accentWord: this.def.accentWord,
            color: this.def.color,
            punchline: this.def.punchline,
            showCard: data.showCard !== false,
        });
        bus.emit('barre-changed', { barre: state.save.barre, gained: false });
        bus.emit('abilities-changed', { abilities: state.save.abilities });
        bus.emit('fragments-changed', { count: state.save.abilities.length, total: TOTAL_FRAGMENTS });
        sfx.startPad(this.def.ambientNote ?? 110);

        this.setupScript();
    }

    /* ---------- costruzione ---------- */

    private buildWater(): void {
        if (this.level.water.length === 0) return;
        const g = this.add.graphics().setDepth(3);
        for (const rect of this.level.water) {
            g.fillStyle(0x22d3ee, 0.18);
            g.fillRect(rect.x, rect.y + 6, rect.width, rect.height - 6);
            g.fillStyle(0x67e8f9, 0.35);
            g.fillRect(rect.x, rect.y + 6, rect.width, 3);
        }
        const first = this.level.water[0];
        const last = this.level.water[this.level.water.length - 1];
        const cx = (first.x + last.x + last.width) / 2;
        this.lighting.static(cx, first.y, 0x22d3ee, 300, 0.8);
        this.add.particles(cx, first.y + 4, 'p-dot', {
            x: { min: -(last.x + last.width - first.x) / 2, max: (last.x + last.width - first.x) / 2 },
            speedY: { min: -30, max: -10 },
            scale: { start: 0.3, end: 0 },
            alpha: { start: 0.5, end: 0 },
            tint: 0x67e8f9,
            lifespan: 1600,
            frequency: 180,
        }).setDepth(3);
    }

    private buildDust(): void {
        const w = this.level.widthPx;
        const h = this.level.heightPx;
        this.add.particles(0, 0, 'p-dot', {
            x: { min: 0, max: w },
            y: { min: 0, max: h },
            scale: { start: 0.18, end: 0 },
            alpha: { start: 0.22, end: 0 },
            tint: ZONE_HEX[this.def.color],
            lifespan: 6000,
            speedX: { min: -8, max: 8 },
            speedY: { min: -14, max: -4 },
            frequency: 240,
        }).setDepth(3);
    }

    private spawnEntities(): void {
        for (const { spec, x, y } of this.level.entities) {
            switch (spec.type) {
                case 'enemy':
                    this.spawnEnemy(spec.kind, x, y);
                    break;
                case 'npc':
                    this.spawnNpc(spec.id, x, y);
                    break;
                case 'ability':
                    if (!state.hasAbility(spec.ability)) this.spawnFragment(x, y, spec.ability);
                    break;
                case 'lore':
                    this.spawnLore(spec.id, x, y);
                    break;
                case 'barre':
                    this.spawnBarrePickup(x, y, spec.amount);
                    break;
                case 'boss': {
                    this.boss = new Boss(this, x, y, spec.kind);
                    // in ng+ ivan è già dei nostri: guggu si taglia subito
                    if (spec.kind === 'guggu' && state.hasFlag('ivan')) this.boss.invulnerable = false;
                    this.lighting.follow(this.boss, this.boss.def.glowColor, 280, 1.0);
                    break;
                }
            }
        }
    }

    private spawnEnemy(kind: EnemyKind, x: number, y: number): Enemy {
        const e = new Enemy(this, x, y, kind);
        e.setDepth(4);
        this.enemies.add(e);
        this.lighting.follow(e, e.arch.glowColor, 110, 0.55);
        return e;
    }

    private npcTexture(id: string): string {
        if (id.startsWith('ivan')) return 'npc-ivan';
        if (id.startsWith('ticummi')) return 'npc-ticummi';
        if (id.startsWith('smela')) return 'npc-smela';
        if (id.startsWith('piema')) return 'npc-piema';
        if (id.startsWith('lochef')) return 'npc-lochef';
        if (id.startsWith('lametta')) return 'npc-lametta';
        return 'npc-markolino';
    }

    private spawnNpc(id: string, x: number, y: number): void {
        const texture = this.npcTexture(id);
        const npc = this.add.sprite(x, y + 4, texture).setDepth(4).setPipeline('Light2D');
        this.lighting.follow(npc, ZONE_HEX[this.def.color], 160, 0.7);
        this.tweens.add({ targets: npc, y: npc.y - 3, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

        if (id === 'lametta-arena') {
            this.lamettaCenter = { x, y };
            return;
        }
        this.interactables.push({ x, y, range: 70, onInteract: () => this.interactNpc(id) });
    }

    private interactNpc(id: string): void {
        switch (id) {
            case 'ivan-incontro':
                this.startDialogue(id, () => {
                    if (!state.hasFlag('ivan')) {
                        state.setFlag('ivan');
                        if (this.boss?.def.kind === 'guggu') this.boss.invulnerable = false;
                        bus.emit('toast', { text: 'la furia di ivan ti accompagna. guggu ora si taglia.' });
                    }
                });
                break;
            case 'ticummi-offerta':
                this.startDialogue(id, () => {
                    if (state.hasFlag('tommasorveglianza')) return;
                    bus.emit('choice-show', {
                        title: 'tommasorveglianza: 9 barre. assolutamente sicura. 👍',
                        options: [{ label: 'compra (9 barre)' }, { label: 'rifiuta l\'affare' }],
                        onPick: (i) => {
                            if (i === 0 && state.save.barre >= 9) {
                                state.save.barre -= 9;
                                state.setFlag('tommasorveglianza');
                                bus.emit('barre-changed', { barre: state.save.barre, gained: false });
                                bus.emit('toast', { text: 'tommasorveglianza attiva. ti senti osservato, ma protetto.' });
                            } else if (i === 0) {
                                bus.emit('toast', { text: 'non hai 9 barre. ticummi ti guarda con pietà.' });
                            }
                        },
                    });
                });
                break;
            case 'smela-offerta':
                this.startDialogue(id, () => {
                    bus.emit('choice-show', {
                        title: 'acqua premium della sorgente: 15 barre.',
                        options: [{ label: 'compra e bevi (15 barre)', danger: true }, { label: 'nuota e basta' }],
                        onPick: (i) => {
                            if (i === 0 && state.save.barre >= 15) {
                                state.save.barre -= 15;
                                bus.emit('barre-changed', { barre: state.save.barre, gained: false });
                                state.run.smela = true;
                                this.startDialogue('smela-truffa');
                                bus.emit('toast', { text: TOASTS.smela });
                            } else if (i === 0) {
                                bus.emit('toast', { text: 'non hai 15 barre. smela perde interesse immediatamente.' });
                            }
                        },
                    });
                });
                break;
            case 'piema-mente':
                this.interactPiema();
                break;
            default:
                this.startDialogue(id);
        }
    }

    private interactPiema(): void {
        if (state.hasAbility('analisi')) {
            bus.emit('toast', { text: 'piema sta facendo le valigie per andare da lametta.' });
            return;
        }
        if (!state.hasFlag('dispositivo')) {
            bus.emit('toast', { text: 'serve il dispositivo della riba per entrare nella sua mente.' });
            return;
        }
        this.startDialogue('piema-folle', () => {
            this.scene.pause();
            bus.emit('quiz-show', {
                onDone: (errors) => {
                    this.scene.resume();
                    if (errors > 0) {
                        this.player.hurt(Math.min(errors, 2));
                        bus.emit('toast', { text: TOASTS.quizErrore });
                    }
                    if (state.run.hp > 0) {
                        this.startDialogue('piema-grazie', () => {
                            this.spawnFragment(this.player.x, this.player.y - 40, 'analisi');
                        });
                    }
                },
            });
        });
    }

    private spawnFragment(x: number, y: number, ability: AbilityId): void {
        const shard = this.physics.add.sprite(x, y, 'fragment').setDepth(5);
        (shard.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        this.lighting.follow(shard, 0x4ade80, 200, 1.0);
        this.tweens.add({ targets: shard, y: y - 10, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.tweens.add({ targets: shard, angle: { from: -8, to: 8 }, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.physics.add.overlap(this.player, shard, () => {
            shard.destroy();
            state.unlockAbility(ability);
            sfx.unlock();
            bus.emit('abilities-changed', { abilities: state.save.abilities });
            bus.emit('fragments-changed', { count: state.save.abilities.length, total: TOTAL_FRAGMENTS });
            bus.emit('ability-unlocked', { ability });
        });
    }

    private spawnLore(id: string, x: number, y: number): void {
        const collected = state.save.collectedLore.includes(id);
        const tablet = this.add.sprite(x, y + 1, 'lore-tablet').setDepth(4).setPipeline('Light2D').setAlpha(collected ? 0.5 : 1);
        this.interactables.push({
            x, y, range: 60,
            onInteract: () => {
                if (!state.save.collectedLore.includes(id)) {
                    state.save.collectedLore.push(id);
                    state.persist();
                    tablet.setAlpha(0.5);
                }
                this.startDialogue(id);
            },
        });
    }

    private spawnCheckpoints(): void {
        for (const cp of this.level.checkpoints) {
            const mic = this.add.sprite(cp.x, cp.y - 12, 'mic').setDepth(4).setPipeline('Light2D');
            this.checkpointSprites.set(cp.id, mic);
            if (state.save.checkpointId === cp.id) {
                mic.setTint(0x4ade80);
                this.lighting.static(cp.x, cp.y - 20, 0x4ade80, 160, 0.8);
            }
            this.interactables.push({
                x: cp.x, y: cp.y, range: 60,
                onInteract: () => this.activateCheckpoint(cp.id, mic),
            });
        }
    }

    private spawnDroppedBarre(): void {
        const drop = state.dropped;
        if (!drop || drop.levelId !== this.def.id || drop.amount <= 0) return;
        const ghost = this.physics.add.sprite(drop.x, drop.y, 'drop-ghost').setDepth(4);
        (ghost.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        this.lighting.follow(ghost, 0x4ade80, 130, 0.7);
        this.tweens.add({ targets: ghost, y: drop.y - 8, alpha: 0.6, duration: 900, yoyo: true, repeat: -1 });
        this.physics.add.overlap(this.player, ghost, () => {
            ghost.destroy();
            state.save.barre += drop.amount;
            state.dropped = null;
            state.persist();
            sfx.pickup();
            bus.emit('barre-changed', { barre: state.save.barre, gained: true });
            bus.emit('toast', { text: TOASTS.barreRecovered });
        });
    }

    private spawnBarrePickup(x: number, y: number, amount: number): void {
        // i pickup piazzati a mano non riappaiono una volta presi
        const key = `${this.def.id}-${Math.round(x)}-${Math.round(y)}`;
        if (state.save.collectedLore.includes(key)) return;
        const note = this.physics.add.sprite(x, y, 'barra').setDepth(4);
        (note.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        this.tweens.add({ targets: note, y: y - 6, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.physics.add.overlap(this.player, note, () => {
            note.destroy();
            state.save.collectedLore.push(key);
            state.save.barre += amount;
            state.persist();
            sfx.pickup();
            bus.emit('barre-changed', { barre: state.save.barre, gained: true });
        });
    }

    /* ---------- colliders ed eventi ---------- */

    private setupColliders(): void {
        const layer = this.level.layer;
        this.physics.add.collider(this.player, layer);
        this.physics.add.collider(this.enemies, layer);
        this.physics.add.collider(this.barreGroup, layer);
        this.physics.add.collider(this.playerProjectiles, layer, (proj) => this.popProjectile(proj as Phaser.Physics.Arcade.Sprite));
        this.physics.add.collider(this.enemyProjectiles, layer, (proj) => this.popProjectile(proj as Phaser.Physics.Arcade.Sprite));

        this.physics.add.overlap(this.player.attackHitbox, this.enemies, (_hb, obj) => {
            if (!this.player.attackActive) return;
            const enemy = obj as Enemy;
            this.player.attackActive = false;
            this.player.onAttackHit();
            this.hitstop();
            enemy.takeDamage(this.player.attackDamage, this.player.x);
        });

        this.physics.add.overlap(this.player, this.enemies, (_p, obj) => {
            const enemy = obj as Enemy;
            this.player.hurt(1, enemy.x);
        });

        this.physics.add.overlap(this.playerProjectiles, this.enemies, (a, b) => {
            const enemy = (a instanceof Enemy ? a : b) as Enemy;
            const bullet = (a instanceof Enemy ? b : a) as Phaser.Physics.Arcade.Sprite;
            if (!enemy.active || !bullet.active) return;
            // il colpo risonante perfora ma ogni bersaglio lo subisce una volta
            const hitSet = (bullet.getData('hit') ?? new Set()) as Set<Enemy>;
            if (hitSet.has(enemy)) return;
            hitSet.add(enemy);
            bullet.setData('hit', hitSet);
            enemy.takeDamage(COMBAT.risonanteDamage * state.damageMult, bullet.x);
            this.player.onAttackHit();
        });

        this.physics.add.overlap(this.enemyProjectiles, this.player, (a, b) => {
            const proj = (a === this.player ? b : a) as Phaser.Physics.Arcade.Sprite;
            if (this.player.hurt(1, proj.x)) {
                this.popProjectile(proj);
            }
        });

        this.physics.add.overlap(this.lametteGroup, this.player, (a, b) => {
            const blade = (a === this.player ? b : a) as Phaser.Physics.Arcade.Sprite;
            this.player.hurt(1, blade.x);
        });

        this.physics.add.overlap(this.player, this.level.spikes, () => this.onSpikes());

        this.physics.add.overlap(this.player, this.barreGroup, (_p, obj) => {
            const note = obj as Phaser.Physics.Arcade.Sprite;
            note.destroy();
            state.save.barre += note.getData('value') as number;
            state.persist();
            sfx.barra();
            bus.emit('barre-changed', { barre: state.save.barre, gained: true });
        });

        if (this.boss) {
            this.physics.add.collider(this.boss, layer);
            this.physics.add.overlap(this.player.attackHitbox, this.boss, () => {
                if (!this.player.attackActive || !this.boss) return;
                this.player.attackActive = false;
                if (this.boss.takeDamage(this.player.attackDamage, this.player.x)) {
                    this.player.onAttackHit();
                    this.hitstop();
                } else if (this.boss.def.kind === 'guggu') {
                    bus.emit('toast', { text: TOASTS.gugguDoor });
                }
            });
            this.physics.add.overlap(this.player, this.boss, () => {
                if (this.boss) this.player.hurt(this.boss.def.contactDamage, this.boss.x);
            });
            this.physics.add.overlap(this.playerProjectiles, this.boss, (obj, proj) => {
                const bullet = (obj === this.boss ? proj : obj) as Phaser.Physics.Arcade.Sprite;
                if (!this.boss || !bullet.active) return;
                if (this.boss.takeDamage(COMBAT.risonanteDamage * state.damageMult, bullet.x)) {
                    this.player.onAttackHit();
                }
            });
        }
    }

    private setupEvents(): void {
        const on = (event: string, fn: (...args: never[]) => void) => {
            this.events.on(event, fn, this);
            this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.events.off(event, fn, this));
        };
        on('player-risonante', this.onRisonante as never);
        on('player-riflesso', this.onRiflesso as never);
        on('player-analisi', this.onAnalisi as never);
        on('enemy-shoot', this.onEnemyShoot as never);
        on('enemy-died', this.onEnemyDied as never);
        on('player-dead', this.onPlayerDead as never);
        on('boss-summon', this.onBossSummon as never);
        on('boss-lamette', this.onBossLamette as never);
        on('boss-defeated', this.onBossDefeated as never);

        this.input.keyboard!.on('keydown-ESC', () => bus.emit('request-pause', {}));
        this.input.keyboard!.on('keydown-E', () => this.tryInteract());
    }

    private setupCamera(): void {
        const cam = this.cameras.main;
        cam.setBounds(0, 0, this.level.widthPx, this.level.heightPx);
        this.physics.world.setBounds(0, 0, this.level.widthPx, this.level.heightPx);
        cam.startFollow(this.player, true, 0.12, 0.12);
        cam.setDeadzone(50, 36);
        const applyZoom = () => {
            cam.setZoom(Math.max(1.05, this.scale.height / this.level.heightPx));
            this.parallax?.resize();
        };
        applyZoom();
        this.scale.on('resize', applyZoom);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off('resize', applyZoom));
        cam.fadeIn(500, 0, 0, 0);
        if (cam.postFX) cam.postFX.addVignette(0.5, 0.5, 0.86);
    }

    private buildPrompt(): void {
        const circle = this.add.graphics();
        circle.fillStyle(0x000000, 0.6);
        circle.fillCircle(0, 0, 11);
        circle.lineStyle(1.5, 0x4ade80, 0.8);
        circle.strokeCircle(0, 0, 11);
        const txt = this.add.text(0, 0, 'E', {
            fontFamily: '"Martian Mono", monospace',
            fontSize: '11px',
            color: '#4ade80',
        }).setOrigin(0.5);
        this.prompt = this.add.container(0, 0, [circle, txt]).setDepth(8).setVisible(false);
    }

    /* ---------- script per capitolo ---------- */

    private setupScript(): void {
        if (this.def.script === 'trenbolone') {
            if (!state.hasFlag('rio-curato') && !state.run.trenbolone) {
                this.time.delayedCall(900, () => {
                    bus.emit('wavesung', WAVESUNG.trenboloneAd);
                    state.run.trenbolone = true;
                    bus.emit('toast', { text: TOASTS.trenbolone });
                });
            }
        }
        if (this.def.script === 'ruhra' && !state.hasFlag('wavesung-piema')) {
            state.setFlag('wavesung-piema');
            this.time.delayedCall(1200, () => bus.emit('wavesung', WAVESUNG.markolinoPiema));
        }
        if (this.def.script === 'pedro' && !state.hasFlag('wavesung-finale')) {
            state.setFlag('wavesung-finale');
            this.time.delayedCall(1200, () => bus.emit('wavesung', WAVESUNG.markolinoFinale));
        }
    }

    /* ---------- loop ---------- */

    update(time: number, delta: number): void {
        if (!this.player) return;
        this.player.update(time, delta);
        const target = this.clone && this.clone.active ? (this.clone as Phaser.GameObjects.Sprite) : this.player;
        this.enemies.getChildren().forEach((e) => (e as Enemy).update(time, delta, target));
        this.boss?.update(time, delta, target);
        this.lighting.update();
        this.parallax.update(time);

        this.trackSafePosition(delta);
        this.checkExits();
        this.updatePrompt();
        this.updateBossTrigger();
        this.magnetBarre();
        this.updateClone();
        this.updateAnalisi(time);
        this.updateLamettaArena(time);
        this.updateWaterCure();
        this.updateAmbush();
    }

    private trackSafePosition(delta: number): void {
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        if (body.blocked.down && !this.player.dead) {
            this.safeTimer += delta;
            if (this.safeTimer > 250) {
                this.lastSafe = { x: this.player.x, y: this.player.y - 4 };
                this.safeTimer = 0;
            }
        } else {
            this.safeTimer = 0;
        }
    }

    private checkExits(): void {
        if (this.exiting || !this.def.next || this.player.dead) return;
        const hit = this.level.exits.some((r) => r.contains(this.player.x, this.player.y));
        if (!hit) return;
        // i boss non si superano scappando
        if (this.boss?.active) {
            if (this.time.now > this.exitLockToastAt) {
                this.exitLockToastAt = this.time.now + 3000;
                bus.emit('toast', { text: 'qualcosa di grosso blocca ancora la strada.' });
            }
            return;
        }
        if (this.def.script === 'ruhra' && !state.hasAbility('analisi')) {
            if (this.time.now > this.exitLockToastAt) {
                this.exitLockToastAt = this.time.now + 3000;
                bus.emit('toast', { text: 'piema ha ancora bisogno di te. la porta non si apre.' });
            }
            return;
        }
        this.gotoLevel(this.def.next);
    }

    private gotoLevel(next: string): void {
        this.exiting = true;
        state.save.levelId = next;
        state.save.checkpointId = null;
        state.persist();
        sfx.stopPad();
        this.cameras.main.fadeOut(450, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.restart({ levelId: next, checkpointId: null } satisfies SceneData);
        });
    }

    private updatePrompt(): void {
        const near = this.findNearestInteractable();
        if (near) {
            this.prompt.setVisible(true);
            this.prompt.setPosition(near.x, near.y - 48 + Math.sin(this.time.now / 300) * 3);
        } else {
            this.prompt.setVisible(false);
        }
    }

    private updateBossTrigger(): void {
        if (!this.boss || this.boss.engaged || this.player.dead || this.exiting) return;
        const dist = Math.abs(this.player.x - this.boss.x);
        if (dist >= 440) return;

        if (this.def.script === 'pedro' && !this.pedroChoiceShown) {
            this.pedroChoiceShown = true;
            this.startDialogue('pedro-incontro', () => {
                bus.emit('choice-show', {
                    title: 'pedro aspetta una risposta.',
                    options: [{ label: 'seguilo: stats raddoppiate', danger: true }, { label: 'contrastalo' }],
                    onPick: (i) => {
                        if (i === 0) {
                            this.scene.pause();
                            bus.emit('ending', { id: 'pedro' });
                        } else {
                            this.boss?.engage();
                        }
                    },
                });
            });
            return;
        }

        const introId = BOSS_INTRO[this.boss.def.kind];
        if (introId && !this.bossIntroShown) {
            this.bossIntroShown = true;
            const boss = this.boss;
            if (!state.save.seenDialogues.includes(introId)) {
                state.save.seenDialogues.push(introId);
                state.persist();
                this.startDialogue(introId, () => boss?.engage());
            } else {
                boss.engage();
            }
            if (boss.def.kind === 'guggu' && boss.invulnerable) {
                this.time.delayedCall(600, () => {
                    if (boss.active && boss.invulnerable) bus.emit('toast', { text: TOASTS.gugguDoor });
                });
            }
        } else if (!introId) {
            this.boss.engage();
        }
    }

    /** le note volano verso il geco quando è vicino */
    private magnetBarre(): void {
        this.barreGroup.getChildren().forEach((obj) => {
            const note = obj as Phaser.Physics.Arcade.Sprite;
            const dx = this.player.x - note.x;
            const dy = this.player.y - note.y;
            if (Math.hypot(dx, dy) < 130) {
                const body = note.body as Phaser.Physics.Arcade.Body;
                body.setAllowGravity(false);
                body.setVelocity(dx * 6, dy * 6);
            }
        });
    }

    private findNearestInteractable(): Interactable | null {
        let best: Interactable | null = null;
        let bestDist = Infinity;
        for (const it of this.interactables) {
            const d = Math.hypot(this.player.x - it.x, this.player.y - it.y);
            if (d < it.range && d < bestDist) {
                best = it;
                bestDist = d;
            }
        }
        return best;
    }

    private tryInteract(): void {
        if (this.player.dead || this.exiting) return;
        this.findNearestInteractable()?.onInteract();
    }

    /* ---------- abilità attive ---------- */

    private onRisonante({ x, y, dir }: { x: number; y: number; dir: number }): void {
        const proj = this.playerProjectiles.create(x, y, 'proj-risonante') as Phaser.Physics.Arcade.Sprite;
        proj.setDepth(5);
        proj.setFlipX(dir < 0);
        proj.setVelocityX(dir * COMBAT.risonanteSpeed);
        this.lighting.follow(proj, 0x4ade80, 130, 0.8);
        this.add.particles(0, 0, 'p-spark', {
            follow: proj,
            speed: 30,
            scale: { start: 0.5, end: 0 },
            tint: 0x4ade80,
            lifespan: 200,
            frequency: 30,
        }).setDepth(4);
        this.time.delayedCall(1600, () => proj.active && this.popProjectile(proj));
    }

    private onRiflesso({ x, y, facing }: { x: number; y: number; facing: number }): void {
        this.clone?.destroy();
        const clone = this.physics.add.sprite(x, y, 'player', 0)
            .setScale(this.player.scaleX, this.player.scaleY)
            .setFlipX(facing < 0)
            .setAlpha(0.65)
            .setTint(0x22d3ee)
            .setDepth(4);
        (clone.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        clone.play('p-idle');
        this.clone = clone;
        this.cloneUntil = this.time.now + COMBAT.riflessoDurationMs;
        this.lighting.follow(clone, 0x22d3ee, 180, 0.9);
        // il riflesso assorbe i colpi nemici
        this.physics.add.overlap(this.enemyProjectiles, clone, (a, b) => {
            this.popProjectile((a === clone ? b : a) as Phaser.Physics.Arcade.Sprite);
        });
        this.tweens.add({ targets: clone, y: y - 6, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    private updateClone(): void {
        if (this.clone && this.clone.active && this.time.now >= this.cloneUntil) {
            this.add.particles(this.clone.x, this.clone.y, 'p-spark', {
                speed: { min: 80, max: 200 },
                scale: { start: 0.8, end: 0 },
                tint: 0x22d3ee,
                lifespan: 350,
                quantity: 12,
                stopAfter: 12,
            });
            this.clone.destroy();
            this.clone = null;
        }
    }

    private onAnalisi(): void {
        this.analisiUntil = this.time.now + COMBAT.analisiDurationMs;
        this.nextAnalisiTick = 0;
        this.analisiGlyphs.forEach((g) => g.destroy());
        this.analisiGlyphs = [0, 1, 2].map((i) => this.add.image(this.player.x, this.player.y, `glyph-${i}`).setDepth(6));
        this.cameras.main.flash(90, 96, 165, 250);
    }

    private updateAnalisi(time: number): void {
        if (this.analisiGlyphs.length === 0) return;
        if (time >= this.analisiUntil) {
            this.analisiGlyphs.forEach((g) => g.destroy());
            this.analisiGlyphs = [];
            return;
        }
        this.analisiGlyphs.forEach((g, i) => {
            const angle = time / 250 + (i * Math.PI * 2) / 3;
            g.setPosition(
                this.player.x + Math.cos(angle) * COMBAT.analisiRadius * 0.7,
                this.player.y + Math.sin(angle) * COMBAT.analisiRadius * 0.7
            );
            g.setRotation(angle + Math.PI / 2);
        });
        if (time >= this.nextAnalisiTick) {
            this.nextAnalisiTick = time + COMBAT.analisiTickMs;
            const hits: (Enemy | Boss)[] = [];
            this.enemies.getChildren().forEach((obj) => {
                const e = obj as Enemy;
                if (e.active && Math.hypot(e.x - this.player.x, e.y - this.player.y) < COMBAT.analisiRadius) hits.push(e);
            });
            if (this.boss?.active && Math.hypot(this.boss.x - this.player.x, this.boss.y - this.player.y) < COMBAT.analisiRadius + 40) {
                hits.push(this.boss);
            }
            for (const h of hits) {
                h.takeDamage(1 * state.damageMult, this.player.x);
                this.player.onAttackHit();
            }
        }
    }

    /* ---------- arena di lametta ---------- */

    private updateLamettaArena(time: number): void {
        if (!this.lamettaCenter || this.exiting) return;
        const c = this.lamettaCenter;

        if (!this.lamettaActive) {
            if (Math.abs(this.player.x - c.x) < 380 && !this.player.dead) {
                this.lamettaActive = true;
                this.startDialogue('lametta-incontro', () => {
                    this.nextLametteAt = this.time.now + 1500;
                    this.nextPitturaAt = this.time.now + 4000;
                    this.spawnColorDrop();
                });
            }
            return;
        }
        if (this.mirror) return;

        if (time >= this.nextLametteAt) {
            this.nextLametteAt = time + 2600;
            const xs = [this.player.x - 70 + Math.random() * 40, this.player.x + 40 + Math.random() * 40];
            this.onBossLamette({ xs, y: this.player.y });
        }
        if (time >= this.nextPitturaAt && this.enemies.getLength() < 5) {
            this.nextPitturaAt = time + 6500;
            this.spawnEnemy('pittura-mini', c.x + (Math.random() - 0.5) * 400, c.y - 60);
        }
    }

    private spawnColorDrop(): void {
        if (!this.lamettaCenter) return;
        const c = this.lamettaCenter;
        const colors = [0xf87171, 0x4ade80, 0x60a5fa, 0xfacc15, 0xc084fc];
        const color = colors[this.colorDropsTaken % colors.length];
        const x = c.x + (Math.random() - 0.5) * 480;
        const y = c.y - 30 - Math.random() * 90;
        const drop = this.physics.add.sprite(x, y, 'color-drop').setTint(color).setDepth(5);
        (drop.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        this.lighting.follow(drop, color, 140, 0.9);
        this.tweens.add({ targets: drop, y: y - 10, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.physics.add.overlap(this.player, drop, () => {
            drop.destroy();
            this.colorDropsTaken++;
            sfx.pickup();
            if (this.colorDropsTaken >= 5) {
                bus.emit('toast', { text: TOASTS.mirrorOpen });
                this.spawnMirror();
            } else {
                bus.emit('toast', { text: `${TOASTS.colorDrop} (${this.colorDropsTaken}/5)` });
                this.spawnColorDrop();
            }
        });
    }

    private spawnMirror(): void {
        if (!this.lamettaCenter) return;
        const c = this.lamettaCenter;
        const mirror = this.add.sprite(c.x + 180, c.y + 12, 'black-mirror').setDepth(5).setAlpha(0);
        this.mirror = mirror;
        this.lighting.static(mirror.x, mirror.y, 0xc084fc, 220, 1.0);
        this.tweens.add({ targets: mirror, alpha: 1, duration: 800 });
        const zone = this.add.zone(mirror.x, mirror.y, 50, 80);
        this.physics.add.existing(zone);
        (zone.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        this.physics.add.overlap(this.player, zone, () => {
            if (this.exiting || !this.def.next) return;
            this.exiting = true;
            this.startDialogue('lametta-uscita', () => {
                this.exiting = false;
                this.gotoLevel(this.def.next!);
            });
        });
    }

    /* ---------- rio merdone ---------- */

    private updateWaterCure(): void {
        if (this.def.script !== 'trenbolone' || this.level.water.length === 0) return;
        if (!state.run.trenbolone && !state.run.smela) return;
        const inWater = this.level.water.some((r) => r.contains(this.player.x, this.player.y + 20));
        if (!inWater) return;
        state.run.trenbolone = false;
        state.run.smela = false;
        sfx.heal();
        this.cameras.main.flash(200, 74, 222, 128);
        if (!state.hasFlag('rio-curato')) {
            state.setFlag('rio-curato');
            this.startDialogue('rio-cura', () => {
                this.spawnFragment(this.player.x, this.player.y - 50, 'rigenerazione');
            });
        } else {
            bus.emit('toast', { text: 'il fiume ti ripulisce. di nuovo. senza giudicare. quasi.' });
        }
    }

    private updateAmbush(): void {
        if (this.def.script !== 'trenbolone' || this.ambushDone || this.player.dead) return;
        if (this.player.x < 90 * 32) return;
        this.ambushDone = true;
        state.setFlag('agguato-fatto');
        if (state.hasFlag('tommasorveglianza')) {
            this.startDialogue('tommaso-blocca');
        } else {
            this.startDialogue('notino-furto', () => {
                const stolen = Math.max(10, Math.round(state.save.barre * 0.25));
                state.save.barre = Math.max(0, state.save.barre - stolen);
                state.persist();
                bus.emit('barre-changed', { barre: state.save.barre, gained: false });
                bus.emit('toast', { text: `notino ti ha rubato ${stolen} barre. e ride.` });
                this.cameras.main.shake(200, 0.008);
            });
        }
    }

    /* ---------- reazioni ---------- */

    private onSpikes(): void {
        if (!this.player.hurt(1, undefined)) return;
        // rientro morbido sull'ultima posizione sicura
        this.cameras.main.flash(150, 248, 113, 113);
        this.time.delayedCall(120, () => {
            if (this.player.dead) return;
            this.player.setPosition(this.lastSafe.x, this.lastSafe.y);
            (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
        });
    }

    private onEnemyShoot({ x, y, tx, ty, color }: { x: number; y: number; tx: number; ty: number; color?: number }): void {
        const proj = this.enemyProjectiles.create(x, y, 'proj-ball') as Phaser.Physics.Arcade.Sprite;
        proj.setDepth(5);
        proj.setTint(color ?? 0xf87171);
        const angle = Math.atan2(ty - y, tx - x);
        proj.setVelocity(Math.cos(angle) * 330, Math.sin(angle) * 330);
        this.time.delayedCall(3200, () => proj.active && this.popProjectile(proj));
    }

    private onBossLamette({ xs, y }: { xs: number[]; y: number }): void {
        for (const x of xs) {
            // telegrafo a terra prima della lama
            this.add.particles(x, y + 40, 'p-dot', {
                speed: { min: 10, max: 50 },
                angle: { min: 250, max: 290 },
                scale: { start: 0.5, end: 0 },
                tint: 0xc084fc,
                lifespan: 350,
                quantity: 8,
                stopAfter: 8,
            });
            this.time.delayedCall(480, () => {
                if (!this.scene.isActive()) return;
                const blade = this.lametteGroup.create(x, y + 90, 'proj-lametta') as Phaser.Physics.Arcade.Sprite;
                blade.setDepth(5);
                blade.setVelocityY(-430);
                sfx.slash();
                this.time.delayedCall(420, () => {
                    if (!blade.active) return;
                    this.tweens.add({ targets: blade, alpha: 0, duration: 200, onComplete: () => blade.destroy() });
                });
            });
        }
    }

    private popProjectile(proj: Phaser.Physics.Arcade.Sprite): void {
        if (!proj.active) return;
        this.add.particles(proj.x, proj.y, 'p-dot', {
            speed: { min: 30, max: 90 },
            scale: { start: 0.4, end: 0 },
            lifespan: 200,
            quantity: 4,
            stopAfter: 4,
        });
        proj.destroy();
    }

    private onEnemyDied({ x, y, barre, splitsInto }: { x: number; y: number; barre: number; color: number; splitsInto: { kind: EnemyKind; count: number } | null }): void {
        this.shake(80, 0.004);
        if (splitsInto) {
            for (let i = 0; i < splitsInto.count; i++) {
                const mini = this.spawnEnemy(splitsInto.kind, x + (i ? 20 : -20), y - 10);
                this.physics.add.collider(mini, this.level.layer);
            }
        }
        const pieces = Math.max(1, Math.round(barre / 5));
        for (let i = 0; i < pieces; i++) {
            const note = this.barreGroup.create(x, y, 'barra') as Phaser.Physics.Arcade.Sprite;
            note.setData('value', Math.round(barre / pieces));
            note.setDepth(4);
            note.setVelocity((Math.random() - 0.5) * 220, -150 - Math.random() * 130);
            note.setBounce(0.5);
        }
    }

    private onBossSummon({ x, y, kind }: { x: number; y: number; kind: EnemyKind }): void {
        const e = this.spawnEnemy(kind, x, y);
        this.physics.add.collider(e, this.level.layer);
    }

    private onBossDefeated({ kind, x, y }: { kind: BossKind; x: number; y: number }): void {
        this.boss = null;
        switch (kind) {
            case 'guggu':
                this.startDialogue('ivan-sacrificio', () => {
                    this.spawnFragment(x, y + 60, 'rimbalzo');
                });
                break;
            case 'breccio':
                this.startDialogue('breccio-morte', () => {
                    this.spawnFragment(x, y + 40, 'riflesso');
                });
                break;
            case 'notino':
                this.startDialogue('notino-sconfitto', () => {
                    this.spawnFragment(x, y + 40, 'risonante');
                });
                break;
            case 'riba':
                this.startDialogue('riba-sconfitta', () => {
                    state.setFlag('dispositivo');
                    bus.emit('toast', { text: TOASTS.dispositivo });
                });
                break;
            case 'pedro':
                this.startDialogue('pedro-sconfitto', () => {
                    this.startDialogue('dei-incontro', () => {
                        bus.emit('choice-show', {
                            title: 'le wave tornano a chi le ha create?',
                            options: [{ label: 'consegna le wave' }, { label: 'tienitele. sfida gli dei.', danger: true }],
                            onPick: (i) => {
                                if (i === 0) {
                                    this.scene.pause();
                                    bus.emit('ending', { id: 'consegna' });
                                } else {
                                    this.startDialogue('dei-rifiuto', () => {
                                        this.boss = new Boss(this, x, y - 40, 'dei');
                                        this.lighting.follow(this.boss, 0xffffff, 320, 1.1);
                                        this.setupBossColliders();
                                        this.boss.engage();
                                    });
                                }
                            },
                        });
                    });
                });
                break;
            case 'dei':
                this.time.delayedCall(800, () => {
                    this.scene.pause();
                    bus.emit('ending', { id: 'dei' });
                });
                break;
        }
    }

    /** colliders per un boss evocato dopo il create (gli dei) */
    private setupBossColliders(): void {
        if (!this.boss) return;
        this.physics.add.collider(this.boss, this.level.layer);
        this.physics.add.overlap(this.player.attackHitbox, this.boss, () => {
            if (!this.player.attackActive || !this.boss) return;
            this.player.attackActive = false;
            if (this.boss.takeDamage(this.player.attackDamage, this.player.x)) {
                this.player.onAttackHit();
                this.hitstop();
            }
        });
        this.physics.add.overlap(this.player, this.boss, () => {
            if (this.boss) this.player.hurt(this.boss.def.contactDamage, this.boss.x);
        });
        this.physics.add.overlap(this.playerProjectiles, this.boss, (obj, proj) => {
            const bullet = (obj === this.boss ? proj : obj) as Phaser.Physics.Arcade.Sprite;
            if (!this.boss || !bullet.active) return;
            if (this.boss.takeDamage(COMBAT.risonanteDamage * state.damageMult, bullet.x)) {
                this.player.onAttackHit();
            }
        });
    }

    private onPlayerDead(): void {
        const lost = state.save.barre;
        // le barre restano dove sei morto, stile souls
        state.dropped = lost > 0 ? { levelId: this.def.id, x: this.lastSafe.x, y: this.lastSafe.y, amount: lost } : null;
        state.save.barre = 0;
        state.persist();
        this.shake(300, 0.01);
        this.player.setTint(0xf87171);
        this.tweens.add({ targets: this.player, alpha: 0, angle: 180, duration: 600 });
        sfx.stopPad();
        this.time.delayedCall(900, () => {
            this.scene.pause();
            bus.emit('player-died', { lost });
        });
    }

    private activateCheckpoint(id: string, mic: Phaser.GameObjects.Sprite): void {
        state.save.levelId = this.def.id;
        state.save.checkpointId = id;
        state.persist();
        state.run.hp = COMBAT.maxHp;
        sfx.checkpoint();
        this.checkpointSprites.forEach((m) => m.clearTint());
        mic.setTint(0x4ade80);
        bus.emit('hp-changed', { hp: state.run.hp, maxHp: COMBAT.maxHp, hurt: false });
        bus.emit('toast', { text: TOASTS.checkpoint });
        this.add.particles(mic.x, mic.y - 10, 'p-spark', {
            speed: { min: 60, max: 180 },
            scale: { start: 0.8, end: 0 },
            tint: 0x4ade80,
            lifespan: 500,
            quantity: 16,
            stopAfter: 16,
        });
    }

    private startDialogue(id: string, onEnd?: () => void): void {
        const lines = DIALOGUES[id];
        if (!lines) {
            onEnd?.();
            return;
        }
        this.scene.pause();
        bus.emit('dialogue-start', {
            lines,
            onEnd: () => {
                this.scene.resume();
                onEnd?.();
            },
        });
    }

    /* ---------- feel ---------- */

    private hitstop(): void {
        this.physics.world.timeScale = 6;
        setTimeout(() => {
            if (this.scene.isActive()) this.physics.world.timeScale = 1;
        }, COMBAT.hitstopMs);
        this.shake(60, 0.003);
    }

    private shake(duration: number, intensity: number): void {
        if (state.settings.screenShake) this.cameras.main.shake(duration, intensity);
    }
}
