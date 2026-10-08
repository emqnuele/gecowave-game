import Phaser from 'phaser';
import { TILE } from '../config';
import { ENEMIES } from '../content/enemies';
import { LESSONS } from '../content/lessons';
import { NOTINO_FUGHE } from '../content/story';
import { hashString } from '../engine/art/ink';
import { bus } from '../engine/events';
import { sfx } from '../engine/sfx';
import { state } from '../engine/state';
import { Enemy, type EnemyTrait } from '../entities/Enemy';
import { Spawner } from '../entities/Spawner';
import type { EnemyKind } from '../types';
import type { GameContext, GameSystem } from './context';
import { emitWorld } from '../engine/worldEvents';
import { rng } from '../engine/rng';

type EnemiesCtx = Pick<GameContext, 'simulates' | 'scene' | 'carry' | 'world' | 'player' | 'lighting' | 'groups' | 'feel' | 'rewards' | 'quests' | 'bosses'>;

/** nemici e nidi: chi nasce, chi dorme lontano, chi muore e cosa lascia */
export class Enemies implements GameSystem {
    private readonly ctx: EnemiesCtx;
    private readonly scene: Phaser.Scene;
    /** riusato ogni frame per le minacce: niente array nuovi per il GC */
    private readonly threatCache: { x: number; y: number }[] = [];

    constructor(ctx: EnemiesCtx) {
        this.ctx = ctx;
        this.scene = ctx.scene;
    }

    /** chi è sveglio e cattivo, per i passanti che devono scappare */
    threats(): { x: number; y: number }[] {
        const out = this.threatCache;
        out.length = 0;
        for (const child of this.ctx.groups.enemies.getChildren()) {
            const e = child as Enemy;
            if (e.active && !e.dormant && (e.mode === 'chase' || e.mode === 'alert')) out.push({ x: e.x, y: e.y });
        }
        return out;
    }

    /** poche élite per regione: avanti nel percorso, nelle stanze grandi, mai vicino all'inizio */
    isEliteSpot(x: number, y: number, h: number): boolean {
        if (!this.ctx.world.layout) return false;
        const room = this.ctx.world.roomAt(x, y);
        if (!room || !['hall', 'cave', 'gauntlet', 'shaft'].includes(room.kind)) return false;
        const p = room.pathIndex >= 0 ? room.pathIndex : this.ctx.world.layout.rooms[room.anchor].pathIndex;
        if (p < this.ctx.world.layout.pathLength * 0.3) return false;
        return h % 1000 < 22;
    }

    /** varianti dei nemici delle regioni: deterministiche, per bioma e comportamento */
    traitFor(kind: EnemyKind, x: number, y: number, h: number): EnemyTrait | null {
        if (!this.ctx.world.layout) return null;
        const room = this.ctx.world.roomAt(x, y);
        if (!room || room.kind === 'start' || room.kind === 'rest') return null;
        const b = ENEMIES[kind].behavior;
        const biome = this.ctx.world.biome.id;
        const roll = (h >>> 10) % 1000;
        // il nemico simbolo della regione porta il suo tratto quasi sempre: è lui che insegna il pogo
        const lesson = LESSONS[kind];
        if (lesson?.trait && lesson.regions?.includes(this.ctx.world.def.id) && roll < 650) return lesson.trait;
        const hard = (list: string[], hi: number, lo: number) => (list.includes(biome) ? hi : lo);
        if ((b === 'walker' || b === 'charger') && roll < hard(['sanctum', 'factory', 'servers', 'core', 'noir', 'library', 'province', 'depot'], 200, 100)) return 'scudo';
        if ((b === 'walker' || b === 'hopper' || b === 'chaser') && !room.surface && roll >= 300 && roll < 300 + hard(['burrow', 'cellar', 'memory', 'mind', 'lab', 'void', 'swamp'], 170, 80)) return 'soffitto';
        if ((b === 'hopper' || b === 'flyer') && roll >= 600 && roll < 600 + hard(['wasteland', 'factory', 'core', 'void', 'servers', 'lab'], 140, 50)) return 'kamikaze';
        return null;
    }

    spawnEnemy(kind: EnemyKind, x: number, y: number, opts: { sleeping?: boolean; hunting?: boolean; elite?: boolean; trait?: EnemyTrait | null } = {}): Enemy {
        const e = new Enemy(this.scene, x, y, kind, this.ctx.world.nav, { sleeping: opts.sleeping && !opts.elite, elite: opts.elite, trait: opts.trait });
        if (opts.hunting) e.hunt();
        e.setDepth(4);
        this.ctx.groups.enemies.add(e);
        // il kamikaze si annuncia con una luce rossa, chi sta appeso al buio no
        if (e.trait !== 'soffitto') {
            const h = (e.body as Phaser.Physics.Arcade.Body).height;
            this.ctx.lighting.follow(e, e.trait === 'kamikaze' ? 0xef4444 : e.arch.glowColor, 120 + h, 0.6, -h * 0.9 - 8, -h * 0.35);
        }
        emitWorld(this.scene, 'enemy-spawned', { enemy: e });
        return e;
    }

    spawnSpawner(kind: EnemyKind, x: number, y: number, opts: { maxAlive?: number; intervalMs?: number; radius?: number } = {}): Spawner {
        const s = new Spawner(this.scene, x, y, { kind, ...opts });
        this.ctx.groups.spawners.add(s);
        this.scene.physics.add.collider(this.ctx.player, s);
        this.ctx.lighting.follow(s, s.glowColor, 190, 0.85, 0, -20);
        emitWorld(this.scene, 'nest-spawned', { nest: s });
        return s;
    }

    /** nidi ovunque ci stia una tana: cave, secret e anse piccole con tetto,
        al massimo tre porte, mai nelle stanze sicure (start/rest/exit/arena)
        né a inizio gioco né dove c'è trama. deterministico per regione. */
    spawnCaveSpawners(): void {
        if (!this.ctx.simulates) return;
        if (!this.ctx.world.layout) return;
        const rooms = this.ctx.world.layout.rooms;
        const doorCount = new Map<number, number>();
        for (const d of this.ctx.world.layout.doors) {
            doorCount.set(d.a, (doorCount.get(d.a) ?? 0) + 1);
            doorCount.set(d.b, (doorCount.get(d.b) ?? 0) + 1);
        }
        const poolKinds = [...new Set(
            this.ctx.world.level.entities.filter((e) => e.spec.type === 'enemy')
                .map((e) => (e.spec as { kind: EnemyKind }).kind),
        )].filter((k) => {
            const b = ENEMIES[k]?.behavior;
            return b === 'walker' || b === 'hopper' || b === 'chaser' || b === 'charger';
        });
        const fallback: EnemyKind[] = ['tossico', 'formica', 'glitchetto', 'pendolare'];
        const kinds = poolKinds.length ? poolKinds : fallback.filter((k) => k in ENEMIES);
        for (const room of rooms) {
            if (room.kind === 'start' || room.kind === 'exit' || room.kind === 'rest' || room.kind === 'arena') continue;
            if (room.kind !== 'cave' && room.kind !== 'secret' && room.kind !== 'hall' && room.kind !== 'gauntlet' && room.kind !== 'pool') continue;
            if (room.surface) continue;
            if (room.rect.w > 80 || room.rect.h > 44 || room.rect.w * room.rect.h > 2400) continue;
            if ((doorCount.get(room.id) ?? 0) > 3) continue;
            // niente nidi a inizio gioco: sono tane opzionali, non il tutorial
            const anchorPath = room.pathIndex >= 0 ? room.pathIndex : rooms[room.anchor]?.pathIndex ?? 0;
            if (anchorPath < this.ctx.world.layout.pathLength * 0.1) continue;
            // niente nidi dove c'è trama (boss, npc, frammenti, lore, portali)
            const hasStory = this.ctx.world.level.entities.some((e) =>
                (e.spec.type === 'boss' || e.spec.type === 'npc' || e.spec.type === 'ability' || e.spec.type === 'lore' || e.spec.type === 'portal')
                && e.x >= room.rect.x * TILE && e.x < (room.rect.x + room.rect.w) * TILE
                && e.y >= room.rect.y * TILE && e.y < (room.rect.y + room.rect.h) * TILE,
            );
            if (hasStory) continue;
            const h = hashString(`${this.ctx.world.def.id}:spawner:${room.id}`);
            const chance = room.kind === 'secret' ? 80 : room.kind === 'cave' ? 70 : 60;
            if (h % 100 >= chance) continue;
            const kind = kinds[h % kinds.length];
            const spot = this.caveSpawnerSpot(room);
            if (!spot) continue;
            this.spawnSpawner(kind, spot.x, spot.y, {
                maxAlive: 3,
                intervalMs: 3000 + (h % 2000),
                radius: 600,
            });
        }
    }

    /** il punto a terra più vicino al centro della grotta, lontano dai bordi */
    private caveSpawnerSpot(room: { rect: { x: number; y: number; w: number; h: number } }): { x: number; y: number } | null {
        const cx = room.rect.x + room.rect.w / 2;
        const cy = room.rect.y + room.rect.h - 2;
        let best: { c: number; r: number } | null = null;
        let bd = Infinity;
        for (let r = room.rect.y + 2; r < room.rect.y + room.rect.h - 1; r++) {
            for (let c = room.rect.x + 3; c < room.rect.x + room.rect.w - 3; c++) {
                if (!this.ctx.world.nav.standable(c, r)) continue;
                if (this.ctx.world.nav.solid(c, r - 1) && this.ctx.world.nav.solid(c, r - 2)) continue;
                const d = Math.abs(c - cx) + Math.abs(r - cy) * 2;
                if (d < bd) {
                    bd = d;
                    best = { c, r };
                }
            }
        }
        if (!best) return null;
        return { x: best.c * TILE + TILE / 2, y: best.r * TILE + TILE / 2 };
    }

    /** stile minecraft: spento da lontano, da vicino (600px) spawna
        finché attorno al nido ci sono meno di maxAlive vivi */
    updateSpawners(time: number): void {
        if (!this.ctx.simulates) return;
        if (this.ctx.groups.spawners.getChildren().length === 0) return;
        if (this.awakeEnemies() >= 40) return;
        const px = this.ctx.player.x;
        const py = this.ctx.player.y;
        for (const child of this.ctx.groups.spawners.getChildren()) {
            const s = child as Spawner;
            if (!s.active || s.broken) continue;
            const dx = Math.abs(s.x - px);
            const dy = Math.abs(s.y - py);
            if (s.dormant) {
                if (dx < 1500 && dy < 1000) s.setDormant(false);
                else continue;
            } else if (dx > 1800 || dy > 1250) {
                s.setDormant(true);
                continue;
            }
            s.syncAura();
            const dist = Math.hypot(s.x - px, s.y - py);
            const armed = dist < s.radius && !this.ctx.player.dead;
            s.setArmed(armed);
            if (!armed || time < s.nextAt) continue;
            let alive = 0;
            for (const obj of this.ctx.groups.enemies.getChildren()) {
                const e = obj as Enemy;
                if (!e.active || e.dormant) continue;
                if (Math.hypot(e.x - s.x, e.y - s.y) < 760) {
                    alive++;
                    if (alive >= s.maxAlive) break;
                }
            }
            if (alive >= s.maxAlive) {
                s.nextAt = time + 600;
                continue;
            }
            const at = this.ctx.world.openSpotNear(s.x, s.y - 30, 6);
            this.spawnEnemy(s.kind, at.x, at.y, { hunting: true });
            s.nextAt = time + s.intervalMs * (0.85 + rng.logic.next() * 0.3);
            sfx.crack();
            const puff = this.scene.add.particles(s.x, s.y - 14, 'p-spark', {
                speed: { min: 40, max: 160 },
                scale: { start: 0.8, end: 0 },
                tint: s.glowColor,
                lifespan: 380,
                quantity: 8,
                stopAfter: 8,
            }).setDepth(6);
            this.scene.time.delayedCall(600, () => puff.destroy());
        }
    }

    damageSpawner(s: Spawner, amount: number): void {
        if (!this.ctx.simulates) return;
        if (!s.active || s.broken) return;
        if (s.takeDamage(amount)) this.breakSpawner(s);
        else {
            sfx.hit();
            this.ctx.player.onAttackHit();
            this.ctx.feel.hitstop();
        }
    }

    private breakSpawner(s: Spawner): void {
        const { x, y, glowColor, kind } = s;
        sfx.crumble();
        this.ctx.feel.shake(200, 0.008);
        const burst = this.scene.add.particles(x, y - 10, 'p-spark', {
            speed: { min: 80, max: 280 },
            scale: { start: 1, end: 0 },
            tint: [glowColor, 0xf5f5f4],
            lifespan: 500,
            quantity: 18,
            stopAfter: 18,
        }).setDepth(6);
        this.scene.time.delayedCall(800, () => burst.destroy());
        this.ctx.rewards.spawnBarrePickup(x, y - 20, 12);
        s.destroy();
        if (!this.ctx.carry.spawnerToastShown) {
            this.ctx.carry.spawnerToastShown = true;
            bus.emit('toast', { text: `nido di ${kind} distrutto. niente più spawn da qui.` });
        }
    }

    /** i tetti delle comparse contano solo chi è sveglio: la regione intera ne ha centinaia */
    awakeEnemies(): number {
        let n = 0;
        for (const child of this.ctx.groups.enemies.getChildren()) {
            const e = child as Enemy;
            if (e.active && !e.dormant) n++;
        }
        return n;
    }

    /** i nemici lontani dormono; si svegliano prima di entrare in vista, e il margine
        tra sveglia e sonno evita che chi sta sul confine si accenda e spenga di continuo */
    updateEnemies(time: number, delta: number, target: Phaser.GameObjects.Sprite): void {
        if (!this.ctx.simulates) return;
        const px = this.ctx.player.x;
        const py = this.ctx.player.y;
        for (const child of this.ctx.groups.enemies.getChildren()) {
            const e = child as Enemy;
            if (!e.active) continue;
            const dx = Math.abs(e.x - px);
            const dy = Math.abs(e.y - py);
            if (e.dormant) {
                if (dx < 1500 && dy < 1000) e.setDormant(false);
            } else if (dx > 1800 || dy > 1250) {
                e.setDormant(true);
            }
            if (!e.dormant) e.update(time, delta, target);
        }
    }

    /** le note volano verso il geco quando è vicino */
    magnetBarre(): void {
        this.ctx.groups.barre.getChildren().forEach((obj) => {
            const note = obj as Phaser.Physics.Arcade.Sprite;
            const dx = this.ctx.player.x - note.x;
            const dy = this.ctx.player.y - note.y;
            if (Math.hypot(dx, dy) < 130 * state.mods.magnet) {
                const body = note.body as Phaser.Physics.Arcade.Body;
                body.setAllowGravity(false);
                body.setVelocity(dx * 6, dy * 6);
            }
        });
    }

    nearestHostile(x: number, y: number): (Phaser.GameObjects.Sprite & { active: boolean }) | null {
        let best: (Phaser.GameObjects.Sprite & { active: boolean }) | null = null;
        let bestDist = Infinity;
        const candidates = [...this.ctx.groups.enemies.getChildren(), ...(this.ctx.bosses.current ? [this.ctx.bosses.current] : [])];
        for (const c of candidates) {
            const e = c as Phaser.GameObjects.Sprite & { active: boolean };
            if (!e.active) continue;
            const d = Math.hypot(x - e.x, y - e.y);
            if (d < bestDist) {
                best = e;
                bestDist = d;
            }
        }
        return best;
    }

    onEnemyDied({ x, y, kind, barre, splitsInto }: { x: number; y: number; kind: EnemyKind; barre: number; color: number; splitsInto: { kind: EnemyKind; count: number } | null }): void {
        this.ctx.feel.shake(80, 0.004);
        sfx.death(kind);
        // notino non muore: "si ritira strategicamente"
        if (kind === 'notino-mini') {
            const line = NOTINO_FUGHE[Math.floor(rng.logic.next() * NOTINO_FUGHE.length)];
            bus.emit('toast', { text: line });
        }
        if (splitsInto) {
            for (let i = 0; i < splitsInto.count; i++) {
                const mini = this.spawnEnemy(splitsInto.kind, x + (i ? 20 : -20), y - 10, { hunting: true });
                this.scene.physics.add.collider(mini, this.ctx.world.level.layer);
            }
        }
        state.save.record.kills++;
        this.ctx.quests.onKill(kind);
        const total = Math.round(barre * state.mods.barre);
        const pieces = Math.max(1, Math.round(total / 5));
        for (let i = 0; i < pieces; i++) {
            const note = this.ctx.groups.barre.create(x, y, 'barra') as Phaser.Physics.Arcade.Sprite;
            note.setData('value', Math.round(total / pieces));
            note.setDepth(4);
            note.setVelocity((rng.logic.next() - 0.5) * 220, -150 - rng.logic.next() * 130);
            note.setBounce(0.5);
        }
    }

    /** chi ti vede chiama i compagni vicini: si radunano */
    onEnemyAlert({ x, y, from }: { x: number; y: number; from: Enemy }): void {
        for (const child of this.ctx.groups.enemies.getChildren()) {
            const e = child as Enemy;
            if (e === from || !e.active || e.dormant) continue;
            if (Math.abs(e.x - x) < 340 && Math.abs(e.y - y) < 220) e.alertFrom(x, y);
        }
    }

    onBossSummon({ x, y, kind }: { x: number; y: number; kind: EnemyKind }): void {
        const at = this.ctx.world.openSpotNear(x, y, 6);
        const e = this.spawnEnemy(kind, at.x, at.y, { hunting: true });
        this.scene.physics.add.collider(e, this.ctx.world.level.layer);
    }

    /** la prima volta che vedi un nemico simbolo, markolino ti dice come si batte */
    updateLessons(time: number): void {
        if (time < this.ctx.carry.nextLessonCheck || this.ctx.player.dead) return;
        this.ctx.carry.nextLessonCheck = time + 300;
        for (const obj of this.ctx.groups.enemies.getChildren()) {
            const e = obj as Enemy;
            if (!e.active || e.dormant) continue;
            const lesson = LESSONS[e.arch.kind];
            const flag = `lezione-${e.arch.kind}`;
            if (!lesson || state.hasFlag(flag) || (lesson.ability && !state.hasAbility(lesson.ability))) continue;
            if (Math.abs(e.x - this.ctx.player.x) > 520 || Math.abs(e.y - this.ctx.player.y) > 340) continue;
            if (!this.ctx.world.nav.sight(this.ctx.player.x, this.ctx.player.y - 10, e.x, e.y)) continue;
            state.setFlag(flag);
            bus.emit('wavesung', { sender: 'markolino', text: lesson.hint });
            return;
        }
    }


    destroy(): void {}
}
