import Phaser from 'phaser';
import { TILE } from '../../config';
import { coop } from '../../coop/runtime';
import { FAST_WORLD, type CoopMsgs, type EnemySpawn, type NestSpawn, type PickupSpawn, type WorldDump } from '../../coop/protocol';
import { emitWorld, offWorld, onWorld } from '../../core/worldEvents';
import { Enemy } from '../../entities/Enemy';
import type { Boss } from '../../entities/Boss';
import { coopHooks } from '../../coop/hooks';
import type { BossSpawn } from '../../coop/protocol';
import type { Spawner } from '../../entities/Spawner';
import type { NetSession } from '../../net/session';
import type { GameContext } from '../context';
import { MODES, tintOf, writeWorld, type BossLook, type EnemyLook, type TrapLook } from './worldWire';
import { enemyHpFor, spawnerIntervalFor, spawnerMaxAliveFor } from './scaling';

const SNAP_MS = 50;
/** l'ospite vede i nemici attorno a sé: oltre questo non gli servono */
const VIEW_X = 1900;
const VIEW_Y = 1300;

/** una cella della griglia in un numero solo: i muri si chiamano così */
export function cellOf(x: number, y: number): number {
    return Math.floor(y / TILE) * 65536 + Math.floor(x / TILE);
}

/* l'host racconta il suo mondo: chi nasce, chi muore, dove sta, cosa spara.
   e ascolta le richieste dell'ospite: i colpi, le raccolte, i muri */
export class WorldHost {
    private readonly ctx: GameContext;
    private readonly scene: Phaser.Scene;
    private readonly session: NetSession<CoopMsgs>;
    private readonly ids = new WeakMap<object, number>();
    private readonly byId = new Map<number, Enemy | Spawner>();
    private readonly bosses = new Map<number, Boss>();
    private nextId = 1;
    private projId = 1;
    private readonly projs = new Map<number, Phaser.Physics.Arcade.Sprite>();
    private readonly projIds = new WeakMap<object, number>();
    /** gli oggetti da raccogliere, per chiave: chi li prende li prende per tutti e due.
        lo spec resta sempre: serve a chi entra a capitolo iniziato (dump) */
    private readonly pickups = new Map<string, { spec: PickupSpawn; sprite: Phaser.GameObjects.GameObject }>();
    private noteSeq = 0;
    private readonly brokenWalls = new Set<number>();
    /** l'ospite ha caricato questo capitolo: da qui i fatti gli arrivano uno a uno */
    ready = false;
    /** durante il caricamento nascono gli oggetti del livello, che l'ospite fa da sé */
    loading = true;
    private snapAcc = 0;
    private readonly offs: (() => void)[] = [];
    private remoteTake = false;

    constructor(ctx: GameContext, session: NetSession<CoopMsgs>) {
        this.ctx = ctx;
        this.scene = ctx.scene;
        this.session = session;
        const on = <K extends Parameters<typeof onWorld>[1]>(event: K, fn: Parameters<typeof onWorld<K>>[2]) => {
            onWorld(this.scene, event, fn, this);
            this.offs.push(() => offWorld(this.scene, event, fn, this));
        };
        on('enemy-spawned', ({ enemy }) => this.registerEnemy(enemy, true));
        on('nest-spawned', ({ nest }) => this.registerNest(nest, true));
        on('enemy-explode', ({ x, y, r }) => this.send('boom', { x, y, r }));
        coopHooks.hostNpc = {
            spawned: (id, x, y) => this.registerNpc(id, x, y, true),
            gone: (id) => this.unregisterNpc(id, true),
        };
        on('boss-spawned', ({ boss }) => this.registerBoss(boss, true));
        coopHooks.hostBoss = {
            fx: (b, fx, data) => {
                const id = this.ids.get(b);
                if (id) this.send('boss-fx', { id, fx, ...data });
            },
        };
        coopHooks.hostEnemy = {
            say: (e, text, ms) => {
                const id = this.ids.get(e);
                if (id) this.send('enemy-say', { id, text, ms });
            },
        };
        this.offs.push(session.on('hit', (h) => this.onHit(h)));
        this.offs.push(session.on('take', ({ key }) => this.onTake(key)));
        this.offs.push(session.on('break', ({ cell }) => this.onBreak(cell)));
        this.offs.push(session.on('proj-gone', ({ id }) => {
            const p = this.projs.get(id);
            if (p?.active) this.ctx.combat.popProjectile(p);
        }));
    }

    private send<K extends keyof CoopMsgs & string>(t: K, m: CoopMsgs[K]): void {
        if (this.ready && coop.together) this.session.send(t, m);
    }

    idOf(o: object): number {
        return this.ids.get(o) ?? 0;
    }

    /* ---------- registro ---------- */

    /** i nemici nati prima del coop (il caricamento del capitolo) si contano una volta */
    adoptExisting(): void {
        for (const c of this.ctx.groups.enemies.getChildren()) this.registerEnemy(c as Enemy, false);
        for (const c of this.ctx.groups.spawners.getChildren()) this.registerNest(c as Spawner, false);
        for (const [id, at] of this.ctx.npcs.at) this.registerNpc(id, at.x, at.y, false);
        const b = this.ctx.bosses.current;
        if (b?.active) this.registerBoss(b, false);
        // i premi del livello sono nati prima che il coop si agganciasse: si adottano, o chi entra dopo non li vede
        for (const { spec, sprite } of this.ctx.rewards.livePickups()) this.registerPickup(spec, sprite, false);
    }

    private bossOf(b: Boss): BossSpawn {
        return { id: this.ids.get(b)!, kind: b.def.kind, x: b.x, y: b.y, hp: b.hp, maxHp: b.maxHp, engaged: b.engaged, invulnerable: b.invulnerable };
    }

    private registerBoss(b: Boss, announce: boolean): void {
        if (this.ids.has(b) || !b.active) return;
        const id = this.nextId++ & 0xffff;
        this.ids.set(b, id);
        this.bosses.set(id, b);
        b.once(Phaser.GameObjects.Events.DESTROY, () => {
            this.bosses.delete(id);
            this.send('boss-gone', { id, kind: b.def.kind, x: b.x, y: b.y, died: b.hp <= 0 });
        });
        if (announce) this.send('boss', this.bossOf(b));
    }

    private bossLook(): BossLook | null {
        const b = this.ctx.bosses.current;
        const id = b?.active ? this.ids.get(b) : undefined;
        if (!b || !id) return null;
        const body = b.body as Phaser.Physics.Arcade.Body;
        const t = tintOf(b);
        return {
            id, x: b.x, y: b.y, vx: body.velocity.x, vy: body.velocity.y, rot: b.rotation, sx: b.scaleX, sy: b.scaleY, alpha: b.alpha,
            flipX: b.flipX, tint: t.tint, color: t.color, engaged: b.engaged, invulnerable: b.invulnerable, guard: b.guarding, hp: b.hp, maxHp: b.maxHp,
        };
    }

    private spawnOf(e: Enemy): EnemySpawn {
        return {
            id: this.ids.get(e)!,
            kind: e.arch.kind,
            x: e.x,
            y: e.y,
            elite: e.elite,
            trait: e.trait,
            sleeping: e.mode === 'sleep',
            hunting: e.mode === 'chase' || e.mode === 'alert',
        };
    }

    private registerEnemy(e: Enemy, announce: boolean): void {
        if (this.ids.has(e) || !e.active) return;
        const id = this.nextId++ & 0xffff;
        this.ids.set(e, id);
        this.byId.set(id, e);
        e.once(Phaser.GameObjects.Events.DESTROY, () => {
            this.byId.delete(id);
            this.send('despawn', { id, died: e.hp <= 0, x: e.x, y: e.y, kind: e.arch.kind, color: e.arch.glowColor });
        });
        if (announce) this.send('spawn', this.spawnOf(e));
    }

    private nestOf(s: Spawner): NestSpawn {
        return { id: this.ids.get(s)!, kind: s.kind, x: s.x, y: s.y, broken: s.broken };
    }

    /** un personaggio nato dopo il caricamento l'ospite lo mette identico; prima, ce l'ha già */
    private readonly npcIds = new Set<string>();

    private registerNpc(id: string, x: number, y: number, announce: boolean): void {
        if (typeof id !== 'string' || !Number.isFinite(x) || !Number.isFinite(y)) return;
        const known = this.npcIds.has(id);
        this.npcIds.add(id);
        if (announce && !known) this.send('npc', { id: id.slice(0, 64), x, y });
    }

    private unregisterNpc(id: string, announce: boolean): void {
        if (!this.npcIds.delete(id)) return;
        if (announce) this.send('npc-gone', { id });
    }

    private registerNest(s: Spawner, announce: boolean): void {
        if (this.ids.has(s)) return;
        const id = this.nextId++ & 0xffff;
        this.ids.set(s, id);
        this.byId.set(id, s);
        s.once(Phaser.GameObjects.Events.DESTROY, () => {
            this.byId.delete(id);
            this.send('nest-gone', { id });
        });
        if (announce) this.send('nest', this.nestOf(s));
    }

    /** le note cadute dai nemici: ognuna ha una chiave, chi la prende la prende per tutti */
    private tagNotes(): void {
        for (const c of this.ctx.groups.barre.getChildren()) {
            const note = c as Phaser.Physics.Arcade.Sprite;
            if (note.getData('coopKey')) continue;
            const key = `nota-${++this.noteSeq}`;
            note.setData('coopKey', key);
            const body = note.body as Phaser.Physics.Arcade.Body;
            this.registerPickup({ kind: 'note', key, x: note.x, y: note.y, vx: body.velocity.x, vy: body.velocity.y, value: note.getData('value') as number }, note);
        }
    }

    /** un oggetto da raccogliere: l'ospite lo riceve se nasce dopo il caricamento,
        ma resta nel registro per il dump a chi entra dopo */
    registerPickup(spec: PickupSpawn, sprite: Phaser.GameObjects.GameObject, always = false): void {
        // adottare di nuovo lo stesso sprite (caricamento + late join) non deve raddoppiare gli avvisi
        if (this.pickups.get(spec.key)?.sprite === sprite) return;
        const dynamic = always || !this.loading;
        this.pickups.set(spec.key, { spec, sprite });
        sprite.once(Phaser.GameObjects.Events.DESTROY, () => {
            if (this.pickups.get(spec.key)?.sprite === sprite) this.pickups.delete(spec.key);
            this.send('gone', { key: spec.key });
        });
        if (dynamic) this.send('pickup', spec);
    }

    /* ---------- fatti verso l'ospite ---------- */

    shot(proj: Phaser.Physics.Arcade.Sprite, shot: { x: number; y: number; tx: number; ty: number; color?: number; speed?: number; size?: number }): void {
        const id = this.projId = (this.projId % 65535) + 1;
        this.projs.set(id, proj);
        this.projIds.set(proj, id);
        proj.once(Phaser.GameObjects.Events.DESTROY, () => this.projs.delete(id));
        this.send('shoot', { id, ...shot });
    }

    projectileSpent(proj: Phaser.GameObjects.GameObject): void {
        const id = this.projIds.get(proj);
        if (id) this.send('proj-gone', { id });
    }

    lamette(e: { xs: number[]; y: number }): void {
        this.send('lamette', e);
    }

    wallBroken(wall: Phaser.GameObjects.Sprite): void {
        const cell = cellOf(wall.x, wall.y);
        this.brokenWalls.add(cell);
        this.send('wall', { cell });
    }

    /** il mondo intero per l'ospite appena arrivato */
    dump(): WorldDump {
        const enemies: EnemySpawn[] = [];
        for (const c of this.ctx.groups.enemies.getChildren()) {
            const e = c as Enemy;
            if (!e.active) continue;
            this.registerEnemy(e, false);
            enemies.push(this.spawnOf(e));
        }
        const nests: NestSpawn[] = [];
        for (const c of this.ctx.groups.spawners.getChildren()) {
            const s = c as Spawner;
            if (!s.active) continue;
            this.registerNest(s, false);
            nests.push(this.nestOf(s));
        }
        const npcs: { id: string; x: number; y: number }[] = [];
        for (const [id, at] of this.ctx.npcs.at) {
            this.npcIds.add(id);
            npcs.push({ id, x: at.x, y: at.y });
        }
        const pickups: PickupSpawn[] = [];
        for (const [, p] of this.pickups) {
            if (!p.sprite.active) continue;
            const live = p.sprite as Phaser.GameObjects.Sprite;
            pickups.push({ ...p.spec, x: live.x, y: live.y } as PickupSpawn);
        }
        const boss = this.ctx.bosses.current;
        if (boss?.active) this.registerBoss(boss, false);
        return {
            levelSeq: coop.levelSeq,
            enemies,
            nests,
            npcs,
            boss: boss?.active ? this.bossOf(boss) : null,
            pickups,
            gone: [],
            walls: [...this.brokenWalls],
            arena: this.ctx.arena.lockedRoom?.id ?? -1,
            host: { x: this.ctx.player.x, y: this.ctx.player.y },
        };
    }

    /** l'ospite è arrivato: gli si manda il mondo, e da qui ogni fatto */
    welcome(): void {
        this.scaleExisting();
        this.ready = true;
        this.session.send('world', this.dump());
    }

    /** chi era già vivo da solo diventa più duro in due: una volta sola, senza curarlo */
    private scaleExisting(): void {
        for (const c of this.ctx.groups.enemies.getChildren()) {
            const e = c as Enemy;
            if (!e.active || e.getData('coopScaled')) continue;
            e.setData('coopScaled', true);
            e.hp = Math.min(enemyHpFor(e.hp), enemyHpFor(e.arch.hp * (e.elite ? 3.5 : 1)));
        }
        const b = this.ctx.bosses.current;
        if (b?.active && !b.getData('coopScaled')) {
            b.setData('coopScaled', true);
            b.maxHp = enemyHpFor(b.maxHp);
            b.hp = Math.min(enemyHpFor(b.hp), b.maxHp);
        }
        for (const c of this.ctx.groups.spawners.getChildren()) {
            const s = c as Spawner & { intervalMs: number; maxAlive: number };
            if (s.getData('coopScaled')) continue;
            s.setData('coopScaled', true);
            s.intervalMs = spawnerIntervalFor(s.intervalMs);
            s.maxAlive = spawnerMaxAliveFor(s.maxAlive);
        }
    }

    /** view: dove guarda l'ospite (vivo o a terra davanti al compagno). null solo se non c'è nessuno:
        gli snapshot continuano comunque intorno all'host, altrimenti lo spettatore vede tutto fermo */
    tick(delta: number, view: { x: number; y: number } | null): void {
        // le note nascono dopo la morte, nel gestore dei nemici: si contano al passo dopo
        this.tagNotes();
        if (!this.ready || !coop.together) return;
        this.snapAcc += delta;
        if (this.snapAcc < SNAP_MS) return;
        this.snapAcc = 0;
        const enemies: EnemyLook[] = [];
        const px = this.ctx.player.x;
        const py = this.ctx.player.y;
        for (const c of this.ctx.groups.enemies.getChildren()) {
            const e = c as Enemy;
            if (!e.active || e.dormant) continue;
            // l'ospite non vede oltre il suo schermo largo, l'host oltre il suo: gli altri restano fermi dove sono
            const nearGuest = !!view && Math.abs(e.x - view.x) < VIEW_X && Math.abs(e.y - view.y) < VIEW_Y;
            if (!nearGuest && (Math.abs(e.x - px) >= VIEW_X || Math.abs(e.y - py) >= VIEW_Y)) continue;
            const id = this.ids.get(e);
            if (!id) continue;
            const body = e.body as Phaser.Physics.Arcade.Body;
            const t = tintOf(e);
            enemies.push({
                id, x: e.x, y: e.y, vx: body.velocity.x, vy: body.velocity.y,
                flipX: e.flipX, flipY: e.flipY, tint: t.tint, color: t.color,
                stunned: (e as unknown as { stunnedUntil: number }).stunnedUntil > this.scene.time.now,
                mode: Math.max(0, MODES.indexOf(e.mode)), angle: e.angle, alpha: e.alpha,
            });
        }
        this.session.sendFast(FAST_WORLD, (w) => writeWorld(w, { levelSeq: coop.levelSeq, enemies, boss: this.bossLook(), actors: [], traps: this.trapLooks(view) }));
    }

    /** le trappole dove guarda l'ospite (anche a terra) o l'host: poche, stato piccolo */
    private trapLooks(view: { x: number; y: number } | null): TrapLook[] {
        const out: TrapLook[] = [];
        const traps = this.ctx.traps.traps;
        if (!traps.length) return out;
        const px = this.ctx.player.x;
        const py = this.ctx.player.y;
        const now = this.scene.time.now;
        for (let i = 0; i < traps.length; i++) {
            const t = traps[i];
            const nearGuest = !!view && Math.abs(t.x - view.x) < VIEW_X && Math.abs(t.y - view.y) < VIEW_Y;
            if (!nearGuest && (Math.abs(t.x - px) >= VIEW_X || Math.abs(t.y - py) >= VIEW_Y)) continue;
            const kind = t.kind === 'sega' ? 0 : t.kind === 'pressa' ? 1 : 2;
            out.push({
                id: i, kind: kind as 0 | 1 | 2, x: t.x, y: t.y,
                p: t.kind === 'vapore' ? (now + t.phase) % t.period : 0,
                dir: t.dir, speed: t.speed, state: t.state,
                suppressed: t.kind === 'vapore' && now < t.suppressedUntil,
            });
        }
        return out;
    }

    /* ---------- richieste dell'ospite ---------- */

    private onHit(h: CoopMsgs['hit']): void {
        if (h.on === 'enemy') {
            const e = this.byId.get(h.id);
            if (!(e instanceof Enemy) || !e.active) return;
            const v = Number.isFinite(h.v) ? Math.max(0, Math.min(500, h.v)) : 0;
            if (h.k === 'dmg') {
                e.takeDamage(v, h.fromX);
                emitWorld(this.scene, 'damage', { target: e, amount: v, landed: true });
            } else if (h.k === 'stun') e.stun(Math.min(5000, v));
            else if (h.k === 'stagger') e.stagger(Math.min(5000, v));
            else if (h.k === 'parry') e.parried();
        } else if (h.on === 'boss') {
            const b = this.bosses.get(h.id);
            if (!b?.active) return;
            const v = Number.isFinite(h.v) ? Math.max(0, Math.min(500, h.v)) : 0;
            const landed = b.takeDamage(v, h.fromX, h.dir);
            emitWorld(this.scene, 'damage', { target: b, amount: v, landed });
        } else if (h.on === 'nest') {
            const s = this.byId.get(h.id);
            if (!s || s instanceof Enemy || !s.active || s.broken) return;
            if (s.takeDamage(Math.max(0, Math.min(100, h.v)))) this.ctx.enemies.breakSpawner(s);
        }
    }

    /** l'ospite ha preso qualcosa: qui si raccoglie davvero, con lo stesso codice di quando la prendo io */
    private onTake(key: string): void {
        const p = this.pickups.get(key);
        if (!p || !p.sprite.active) return;
        const target = p.sprite;
        const player = this.ctx.player;
        const note = key.startsWith('nota-');
        const collider = this.scene.physics.world.colliders.getActive().find((c) => note
            ? c.object1 === player && c.object2 === this.ctx.groups.barre
            : (c.object1 === player && c.object2 === target) || (c.object2 === player && c.object1 === target));
        if (!collider?.collideCallback) {
            target.destroy();
            return;
        }
        this.remoteTake = true;
        const a = collider.object1 === target ? target : player;
        const b = collider.object1 === target ? player : target;
        (collider.collideCallback as (a: unknown, b: unknown) => void).call(collider.callbackContext, a, b);
        this.remoteTake = false;
        if (target.active) target.destroy();
    }

    /** chi sta raccogliendo per conto dell'ospite: certi premi lo vogliono sapere */
    get takingForPartner(): boolean {
        return this.remoteTake;
    }

    private onBreak(cell: number): void {
        for (const c of this.ctx.world.level.breakableWalls.getChildren()) {
            const w = c as Phaser.Physics.Arcade.Sprite;
            if (w.active && cellOf(w.x, w.y) === cell) {
                this.ctx.combat.destroyBreakableWall(w);
                return;
            }
        }
    }

    destroy(): void {
        for (const off of this.offs) off();
        this.offs.length = 0;
        coopHooks.hostBoss = null;
        coopHooks.hostEnemy = null;
        coopHooks.hostNpc = null;
    }
}
