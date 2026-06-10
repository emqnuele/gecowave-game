import Phaser from 'phaser';
import { COMBAT, ZONE_HEX } from '../config';
import { DIALOGUES, TOASTS } from '../content/story';
import { LEVELS } from '../content/levels';
import { bus } from '../engine/events';
import { loadLevel, type LoadedLevel } from '../engine/LevelLoader';
import { sfx } from '../engine/sfx';
import { state } from '../engine/state';
import { generateZoneTextures } from '../engine/textures';
import { Boss } from '../entities/Boss';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import type { AbilityId, LevelDef } from '../types';

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

export class GameScene extends Phaser.Scene {
    private def!: LevelDef;
    private level!: LoadedLevel;
    private player!: Player;
    private boss: Boss | null = null;
    private enemies!: Phaser.GameObjects.Group;
    private playerProjectiles!: Phaser.Physics.Arcade.Group;
    private enemyProjectiles!: Phaser.Physics.Arcade.Group;
    private barreGroup!: Phaser.Physics.Arcade.Group;
    private interactables: Interactable[] = [];
    private prompt!: Phaser.GameObjects.Container;
    private lastSafe!: { x: number; y: number };
    private safeTimer = 0;
    private exiting = false;
    private checkpointSprites = new Map<string, Phaser.GameObjects.Sprite>();
    private bossIntroDone = false;

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
        this.interactables = [];
        this.checkpointSprites.clear();
        this.bossIntroDone = state.save.seenDialogues.includes('boss-intro');

        generateZoneTextures(this, this.def.color);
        this.level = loadLevel(this, this.def);
        this.buildBackground();
        this.level.layer.setDepth(2);
        this.level.spikes.setDepth(2, 0);

        // spawn: checkpoint salvato oppure inizio livello
        let sp = this.level.spawn;
        const cpId = data.checkpointId ?? null;
        if (cpId) {
            const cp = this.level.checkpoints.find((c) => c.id === cpId);
            if (cp) sp = { x: cp.x, y: cp.y - 8 };
        }
        this.player = new Player(this, sp.x, sp.y);
        this.player.setDepth(4);
        this.lastSafe = { ...sp };

        this.enemies = this.add.group({ runChildUpdate: false });
        this.playerProjectiles = this.physics.add.group({ allowGravity: false });
        this.enemyProjectiles = this.physics.add.group({ allowGravity: false });
        this.barreGroup = this.physics.add.group();

        this.spawnEntities();
        this.spawnCheckpoints();
        this.spawnDroppedBarre();
        this.setupColliders();
        this.setupEvents();
        this.setupCamera();
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
        sfx.startPad(this.def.ambientNote ?? 110);

        if (this.def.introDialogue && !state.save.seenDialogues.includes(this.def.introDialogue)) {
            state.save.seenDialogues.push(this.def.introDialogue);
            state.persist();
            this.startDialogue(this.def.introDialogue);
        }
    }

    /* ---------- costruzione ---------- */

    private buildBackground(): void {
        const w = this.level.widthPx;
        const h = this.level.heightPx;
        this.add.image(w / 2, h / 2, `sky-${this.def.color}`).setDisplaySize(w * 1.2, h * 1.2).setDepth(0).setScrollFactor(0.02);

        const factors = [0.12, 0.28, 0.5];
        factors.forEach((f, i) => {
            this.add.tileSprite(0, h - 400, w, 400, `bg-${this.def.color}-${i}`)
                .setOrigin(0, 0)
                .setScrollFactor(f, 1)
                .setDepth(1)
                .setAlpha(0.9);
        });

        // pulviscolo ambientale
        this.add.particles(0, 0, 'p-dot', {
            x: { min: 0, max: w },
            y: { min: 0, max: h },
            scale: { start: 0.18, end: 0 },
            alpha: { start: 0.25, end: 0 },
            tint: ZONE_HEX[this.def.color],
            lifespan: 6000,
            speedX: { min: -8, max: 8 },
            speedY: { min: -14, max: -4 },
            frequency: 220,
        }).setDepth(3);
    }

    private spawnEntities(): void {
        for (const { spec, x, y } of this.level.entities) {
            switch (spec.type) {
                case 'enemy': {
                    const e = new Enemy(this, x, y, spec.kind);
                    e.setDepth(4);
                    this.enemies.add(e);
                    break;
                }
                case 'npc':
                    this.spawnNpc(spec.id, x, y);
                    break;
                case 'ability':
                    this.spawnShrine(spec.ability, x, y);
                    break;
                case 'lore':
                    this.spawnLore(spec.id, x, y);
                    break;
                case 'barre':
                    this.spawnBarrePickup(x, y, spec.amount);
                    break;
                case 'boss': {
                    this.boss = new Boss(this, x, y);
                    break;
                }
            }
        }
    }

    private spawnNpc(dialogueId: string, x: number, y: number): void {
        const texture = dialogueId.startsWith('riba') ? 'npc-riba'
            : dialogueId.startsWith('pedro') ? 'npc-pedro' : 'npc-elder';
        const npc = this.add.sprite(x, y + 6, texture).setDepth(4);
        if (texture !== 'npc-pedro') {
            // pedro non ondeggia: è l'unico dritto della famiglia
            this.tweens.add({ targets: npc, y: npc.y - 3, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        }
        this.interactables.push({ x, y, range: 70, onInteract: () => this.startDialogue(dialogueId) });
    }

    private spawnShrine(ability: AbilityId, x: number, y: number): void {
        if (state.hasAbility(ability)) return;
        const shrine = this.physics.add.sprite(x, y, 'wave-pickup').setDepth(4);
        (shrine.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        this.tweens.add({ targets: shrine, y: y - 8, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.tweens.add({ targets: shrine, angle: 360, duration: 9000, repeat: -1 });
        this.physics.add.overlap(this.player, shrine, () => {
            shrine.destroy();
            state.unlockAbility(ability);
            sfx.unlock();
            bus.emit('abilities-changed', { abilities: state.save.abilities });
            bus.emit('ability-unlocked', { ability });
        });
    }

    private spawnLore(id: string, x: number, y: number): void {
        const collected = state.save.collectedLore.includes(id);
        const tablet = this.add.sprite(x, y + 1, 'lore-tablet').setDepth(4).setAlpha(collected ? 0.45 : 1);
        this.interactables.push({
            x, y, range: 60,
            onInteract: () => {
                if (!state.save.collectedLore.includes(id)) {
                    state.save.collectedLore.push(id);
                    state.persist();
                    tablet.setAlpha(0.45);
                }
                this.startDialogue(id);
            },
        });
    }

    private spawnCheckpoints(): void {
        for (const cp of this.level.checkpoints) {
            const mic = this.add.sprite(cp.x, cp.y - 12, 'mic').setDepth(4);
            this.checkpointSprites.set(cp.id, mic);
            if (state.save.checkpointId === cp.id) mic.setTint(0x4ade80);
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
            enemy.takeDamage(COMBAT.attackDamage, this.player.x);
        });

        this.physics.add.overlap(this.player, this.enemies, (_p, obj) => {
            const enemy = obj as Enemy;
            this.player.hurt(1, enemy.x);
        });

        this.physics.add.overlap(this.playerProjectiles, this.enemies, (proj, obj) => {
            const enemy = obj as Enemy;
            this.popProjectile(proj as Phaser.Physics.Arcade.Sprite);
            enemy.takeDamage(1, this.player.x);
            this.player.onAttackHit();
        });

        this.physics.add.overlap(this.enemyProjectiles, this.player, (_p, proj) => {
            if (this.player.hurt(1, (proj as Phaser.Physics.Arcade.Sprite).x)) {
                this.popProjectile(proj as Phaser.Physics.Arcade.Sprite);
            }
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
            this.physics.add.collider(this.boss, this.level.layer);
            this.physics.add.overlap(this.player.attackHitbox, this.boss, () => {
                if (!this.player.attackActive || !this.boss) return;
                this.player.attackActive = false;
                this.player.onAttackHit();
                this.hitstop();
                this.boss.takeDamage(COMBAT.attackDamage, this.player.x);
            });
            this.physics.add.overlap(this.player, this.boss, () => {
                if (this.boss) this.player.hurt(1, this.boss.x);
            });
            this.physics.add.overlap(this.playerProjectiles, this.boss, (_b, proj) => {
                this.popProjectile(proj as Phaser.Physics.Arcade.Sprite);
                if (this.boss) {
                    this.boss.takeDamage(1, this.player.x);
                    this.player.onAttackHit();
                }
            });
        }
    }

    private setupEvents(): void {
        this.events.on('player-shoot', this.onPlayerShoot, this);
        this.events.on('enemy-shoot', this.onEnemyShoot, this);
        this.events.on('enemy-died', this.onEnemyDied, this);
        this.events.on('player-dead', this.onPlayerDead, this);
        this.events.on('boss-summon', this.onBossSummon, this);
        this.events.on('boss-defeated', this.onBossDefeated, this);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.events.off('player-shoot', this.onPlayerShoot, this);
            this.events.off('enemy-shoot', this.onEnemyShoot, this);
            this.events.off('enemy-died', this.onEnemyDied, this);
            this.events.off('player-dead', this.onPlayerDead, this);
            this.events.off('boss-summon', this.onBossSummon, this);
            this.events.off('boss-defeated', this.onBossDefeated, this);
        });

        this.input.keyboard!.on('keydown-ESC', () => bus.emit('request-pause', {}));
        this.input.keyboard!.on('keydown-E', () => this.tryInteract());
    }

    private setupCamera(): void {
        const cam = this.cameras.main;
        cam.setBounds(0, 0, this.level.widthPx, this.level.heightPx);
        this.physics.world.setBounds(0, 0, this.level.widthPx, this.level.heightPx);
        cam.startFollow(this.player, true, 0.12, 0.12);
        cam.setDeadzone(60, 40);
        const applyZoom = () => cam.setZoom(Math.max(1, this.scale.height / this.level.heightPx));
        applyZoom();
        this.scale.on('resize', applyZoom);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off('resize', applyZoom));
        cam.fadeIn(500, 0, 0, 0);
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
        this.prompt = this.add.container(0, 0, [circle, txt]).setDepth(6).setVisible(false);
        this.tweens.add({ targets: this.prompt, y: '-=5', duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    /* ---------- loop ---------- */

    update(time: number, delta: number): void {
        if (!this.player) return;
        this.player.update(time, delta);
        this.enemies.getChildren().forEach((e) => (e as Enemy).update(time, delta, this.player));
        this.boss?.update(time, delta, this.player);

        this.trackSafePosition(delta);
        this.checkExits();
        this.updatePrompt();
        this.updateBossTrigger();
        this.magnetBarre();
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
        this.exiting = true;
        const next = this.def.next;
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
            this.prompt.setPosition(near.x, near.y - 46 + (this.prompt.y - Math.round(this.prompt.y)));
            this.prompt.x = near.x;
            if (Math.abs(this.prompt.y - (near.y - 46)) > 8) this.prompt.y = near.y - 46;
        } else {
            this.prompt.setVisible(false);
        }
    }

    private updateBossTrigger(): void {
        if (!this.boss || this.boss.engaged || this.player.dead) return;
        const dist = Math.abs(this.player.x - this.boss.x);
        if (dist < 450) {
            if (!this.bossIntroDone) {
                this.bossIntroDone = true;
                state.save.seenDialogues.push('boss-intro');
                state.persist();
                this.startDialogue('boss-intro', () => this.boss?.engage());
            } else {
                this.boss.engage();
            }
        }
    }

    /** le note volano verso il geco quando è vicino */
    private magnetBarre(): void {
        this.barreGroup.getChildren().forEach((obj) => {
            const note = obj as Phaser.Physics.Arcade.Sprite;
            const dx = this.player.x - note.x;
            const dy = this.player.y - note.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 130) {
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
        if (this.player.dead) return;
        this.findNearestInteractable()?.onInteract();
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

    private onPlayerShoot({ x, y, dir }: { x: number; y: number; dir: number }): void {
        const proj = this.playerProjectiles.create(x, y, 'proj-verso') as Phaser.Physics.Arcade.Sprite;
        proj.setDepth(4);
        proj.setVelocityX(dir * COMBAT.versoSpeed);
        this.time.delayedCall(1800, () => proj.active && this.popProjectile(proj));
    }

    private onEnemyShoot({ x, y, tx, ty }: { x: number; y: number; tx: number; ty: number }): void {
        const proj = this.enemyProjectiles.create(x, y, 'proj-drone') as Phaser.Physics.Arcade.Sprite;
        proj.setDepth(4);
        const angle = Math.atan2(ty - y, tx - x);
        proj.setVelocity(Math.cos(angle) * 330, Math.sin(angle) * 330);
        this.time.delayedCall(3200, () => proj.active && this.popProjectile(proj));
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

    private onEnemyDied({ x, y, barre }: { x: number; y: number; barre: number; color: number }): void {
        this.shake(80, 0.004);
        const pieces = Math.max(1, Math.round(barre / 5));
        for (let i = 0; i < pieces; i++) {
            const note = this.barreGroup.create(x, y, 'barra') as Phaser.Physics.Arcade.Sprite;
            note.setData('value', Math.round(barre / pieces));
            note.setDepth(4);
            note.setVelocity((Math.random() - 0.5) * 220, -150 - Math.random() * 130);
            note.setBounce(0.5);
        }
    }

    private onBossSummon({ x, y }: { x: number; y: number }): void {
        const e = new Enemy(this, x, y, 'hater');
        e.setDepth(4);
        this.enemies.add(e);
        this.physics.add.collider(e, this.level.layer);
    }

    private onBossDefeated(): void {
        state.save.bossDefeated = true;
        state.persist();
        sfx.stopPad();
        this.time.delayedCall(600, () => {
            this.scene.pause();
            bus.emit('game-won', {});
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
        if (!lines) return;
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
