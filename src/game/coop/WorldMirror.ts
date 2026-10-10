import Phaser from 'phaser';
import { sfx } from '../../audio/sfx';
import { coop } from '../../coop/runtime';
import { coopHooks } from '../../coop/hooks';
import { FAST_WORLD, type CoopMsgs, type EnemySpawn, type NestSpawn, type PickupSpawn } from '../../coop/protocol';
import type { Enemy } from '../../entities/Enemy';
import type { Boss } from '../../entities/Boss';
import { acoustics } from '../../audio/acoustics';
import { bus } from '../../core/events';
import { rng } from '../../core/rng';
import type { BossSpawn } from '../../coop/protocol';
import type { Spawner } from '../../entities/Spawner';
import { InterpDelay, NetTrack, type Sample } from '../../net/interp';
import type { NetSession } from '../../net/session';
import type { GameContext } from '../context';
import { cellOf } from './WorldHost';
import { applyTint, MODES, readWorld, type BossLook, type EnemyLook } from './worldWire';

type EnemySample = Sample & { look: EnemyLook };
type BossSample = Sample & { look: BossLook };

/** un nemico che non arriva da un po' si ferma dov'è, come fa dall'host chi dorme */
const STALE_MS = 700;

/* l'ospite rifà il mondo dell'host: nemici e nidi come fantocci delle stesse classi,
   colpi nemici rifatti uguali, oggetti con la loro chiave. quello che il mio geco
   fa al mondo diventa una richiesta */
export class WorldMirror {
    private readonly ctx: GameContext;
    private readonly scene: Phaser.Scene;
    private readonly session: NetSession<CoopMsgs>;
    private readonly enemies = new Map<number, Enemy>();
    private readonly ids = new WeakMap<object, number>();
    private readonly tracks = new Map<number, NetTrack<EnemySample>>();
    private readonly seen = new Map<number, number>();
    private readonly nests = new Map<number, Spawner>();
    private readonly projs = new Map<number, Phaser.Physics.Arcade.Sprite>();
    private readonly projIds = new WeakMap<object, number>();
    private readonly pickups = new Map<string, Phaser.GameObjects.GameObject>();
    private readonly delay = new InterpDelay(50, 70, 300);
    private readonly offs: (() => void)[] = [];
    private readonly out = { x: 0, y: 0, vx: 0, vy: 0 };
    /** il mondo dell'host è arrivato: prima di questo non c'è niente da colpire */
    arrived = false;
    private notesHooked = false;
    private boss: { id: number; b: Boss; track: NetTrack<BossSample>; look: BossLook | null } | null = null;

    constructor(ctx: GameContext, session: NetSession<CoopMsgs>) {
        this.ctx = ctx;
        this.scene = ctx.scene;
        this.session = session;
        coopHooks.puppetEnemy = {
            damage: (e, amount, fromX) => this.claimDamage(e, 'dmg', amount, fromX),
            stun: (e, ms) => this.claimDamage(e, 'stun', ms, e.x),
            stagger: (e, ms) => this.claimDamage(e, 'stagger', ms, e.x),
            parried: (e) => this.claimDamage(e, 'parry', 0, e.x),
            knock: () => {},
        };
        coopHooks.puppetBoss = { damage: (b, amount, fromX, dir) => this.bossHit(b, amount, fromX, dir) };
        const on = <K extends keyof CoopMsgs & string>(t: K, fn: (m: CoopMsgs[K]) => void) => this.offs.push(session.on(t, fn));
        on('world', (d) => {
            if (d.levelSeq !== coop.levelSeq) return;
            this.arrived = true;
            for (const e of d.enemies) this.spawn(e);
            for (const n of d.nests) this.nest(n);
            for (const n of d.npcs ?? []) this.npc(n);
            for (const p of d.pickups) this.pickup(p);
            for (const c of d.walls) this.wall(c);
            if (d.boss) this.spawnBoss(d.boss);
            if (d.arena >= 0) this.arena(true, d.arena);
            this.reconcilePickups(d.pickups);
        });
        on('arena', (m) => this.arena(m.locked, m.room));
        on('boss', (m) => this.spawnBoss(m));
        on('boss-gone', (m) => this.bossGone(m));
        on('boss-fx', (m) => this.bossFx(m));
        on('spawn', (e) => this.spawn(e));
        on('despawn', (m) => this.despawn(m));
        on('nest', (n) => this.nest(n));
        on('nest-gone', ({ id }) => {
            const s = this.nests.get(id);
            this.nests.delete(id);
            if (s?.active) this.ctx.enemies.breakSpawner(s);
        });
        on('npc', (m) => this.npc(m));
        on('npc-gone', ({ id }) => this.ctx.npcs.despawn(id));
        on('shoot', (m) => {
            const proj = this.ctx.combat.shootProjectile(m);
            this.projs.set(m.id, proj);
            this.projIds.set(proj, m.id);
            proj.once(Phaser.GameObjects.Events.DESTROY, () => this.projs.delete(m.id));
        });
        on('proj-gone', ({ id }) => {
            const p = this.projs.get(id);
            if (p?.active) this.ctx.combat.popProjectile(p);
        });
        on('lamette', (m) => this.ctx.combat.lamette(m));
        on('boom', (m) => this.ctx.combat.onEnemyExplode({ ...m, from: null }));
        on('pickup', (p) => this.pickup(p));
        on('gone', ({ key }) => {
            const s = this.pickups.get(key);
            this.pickups.delete(key);
            if (s?.active) s.destroy();
        });
        on('wall', ({ cell }) => this.wall(cell));
        on('enemy-say', ({ id, text, ms }) => this.enemies.get(id)?.speak(text, ms));
        this.offs.push(session.onFast(FAST_WORLD, (r, sentAt) => {
            const f = readWorld(r);
            if (!f || f.levelSeq !== coop.levelSeq) return;
            const now = performance.now();
            this.delay.arrived(now);
            const t = session.toLocal(sentAt);
            if (f.boss && this.boss?.id === f.boss.id) this.boss.track.push({ t, x: f.boss.x, y: f.boss.y, vx: f.boss.vx, vy: f.boss.vy, look: f.boss });
            for (const look of f.enemies) {
                if (!this.enemies.has(look.id)) continue;
                let tr = this.tracks.get(look.id);
                if (!tr) this.tracks.set(look.id, (tr = new NetTrack()));
                tr.push({ t, x: look.x, y: look.y, vx: look.vx, vy: look.vy, look });
                this.seen.set(look.id, now);
            }
            // le trappole non si interpolano: la sega si integra uguale, le altre si settano
            for (const trap of f.traps) {
                this.ctx.traps.applyTrap(trap.id, trap.kind === 0 ? 'sega' : trap.kind === 1 ? 'pressa' : 'vapore', trap.x, trap.y, trap.p, trap.dir, trap.speed, trap.state, trap.suppressed);
            }
        }));
    }

    private claimDamage(e: Enemy, k: 'dmg' | 'stun' | 'stagger' | 'parry', v: number, fromX: number): void {
        const id = this.ids.get(e);
        if (id) this.session.send('hit', { on: 'enemy', id, k, v, fromX });
    }

    /** il colpo a un nido: true se il nido è dell'host (allora il colpo è partito) */
    nestHit(s: Spawner, amount: number): boolean {
        const id = this.ids.get(s);
        if (!id) return false;
        this.session.send('hit', { on: 'nest', id, v: amount });
        s.setTintFill(0xffffff);
        this.scene.time.delayedCall(70, () => s.active && s.clearTint());
        return true;
    }

    /* ---------- fantocci ---------- */

    private spawn(m: EnemySpawn): void {
        if (this.enemies.has(m.id)) return;
        const e = this.ctx.enemies.spawnEnemy(m.kind, m.x, m.y, { sleeping: m.sleeping, elite: m.elite, trait: m.trait, hunting: m.hunting });
        coopHooks.puppets.add(e);
        const body = e.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(false);
        body.moves = false;
        body.immovable = true;
        body.stop();
        this.enemies.set(m.id, e);
        this.ids.set(e, m.id);
    }

    private despawn(m: CoopMsgs['despawn']): void {
        const e = this.enemies.get(m.id);
        this.enemies.delete(m.id);
        this.tracks.delete(m.id);
        this.seen.delete(m.id);
        if (m.died) {
            // la morte si vede e si sente qui: le note le manda l'host
            sfx.death(m.kind);
            this.ctx.feel.shake(80, 0.004);
            const burst = this.scene.add.particles(m.x, m.y, 'p-spark', {
                speed: { min: 100, max: 280 }, scale: { start: 1, end: 0 }, tint: m.color, lifespan: 400, quantity: 14, stopAfter: 14,
            });
            this.scene.time.delayedCall(800, () => burst.destroy());
        }
        e?.destroy();
    }

    private nest(n: NestSpawn): void {
        if (this.nests.has(n.id) || n.broken) return;
        const s = this.ctx.enemies.spawnSpawner(n.kind, n.x, n.y);
        coopHooks.puppets.add(s);
        this.nests.set(n.id, s);
        this.ids.set(s, n.id);
    }

    /** un personaggio nato dall'host: se ce l'ho già (caricamento) non si sdoppia */
    private npc(m: { id: string; x: number; y: number }): void {
        if (typeof m.id !== 'string' || !Number.isFinite(m.x) || !Number.isFinite(m.y)) return;
        if (this.ctx.npcs.at.has(m.id)) return;
        try {
            this.ctx.npcs.spawn(m.id.slice(0, 64), m.x, m.y);
        } catch {
            // id di contenuto ignoto: meglio un npc in meno che un capitolo rotto
        }
    }

    private wall(cell: number): void {
        for (const c of this.ctx.world.level.breakableWalls.getChildren()) {
            const w = c as Phaser.Physics.Arcade.Sprite;
            if (w.active && cellOf(w.x, w.y) === cell) {
                this.remoteWall = true;
                this.ctx.combat.destroyBreakableWall(w);
                this.remoteWall = false;
                return;
            }
        }
    }

    private remoteWall = false;

    /** un muro rotto da me: l'host lo rompe anche da lui */
    wallBroken(wall: Phaser.GameObjects.Sprite): void {
        if (!this.remoteWall) this.session.send('break', { cell: cellOf(wall.x, wall.y) });
    }

    projectileSpent(proj: Phaser.GameObjects.GameObject): void {
        const id = this.projIds.get(proj);
        if (id) this.session.send('proj-gone', { id });
    }

    private arena(locked: boolean, roomId: number): void {
        const arena = this.ctx.arena;
        if (!locked) {
            if (arena.lockedRoom) arena.unlock(true);
            return;
        }
        const room = this.ctx.world.layout?.rooms.find((r) => r.id === roomId);
        if (room && !arena.lockedRoom) arena.lock(room, true);
    }

    /* ---------- il boss ---------- */

    private spawnBoss(m: BossSpawn): void {
        if (this.boss?.id === m.id) return;
        if (this.boss?.b.active) this.boss.b.destroy();
        const bosses = this.ctx.bosses;
        const b = bosses.make(m.x, m.y, m.kind, m.maxHp);
        coopHooks.puppets.add(b);
        b.hp = m.hp;
        b.invulnerable = m.invulnerable;
        b.engaged = m.engaged;
        b.setPosition(m.x, m.y);
        const body = b.body as Phaser.Physics.Arcade.Body;
        body.moves = false;
        body.immovable = true;
        bosses.current = b;
        bosses.light(b, b.def.glowColor, 280, 1.0);
        this.ctx.combat.setupBossColliders();
        this.boss = { id: m.id, b, track: new NetTrack(), look: null };
    }

    private bossGone(m: CoopMsgs['boss-gone']): void {
        if (this.boss?.id !== m.id) return;
        const b = this.boss.b;
        this.boss = null;
        if (this.ctx.bosses.current === b) this.ctx.bosses.current = null;
        if (m.died) {
            const scene = this.scene;
            const color = b.def.glowColor;
            acoustics.swell(3200, 1);
            sfx.bossRoar();
            for (let i = 0; i < 5; i++) {
                scene.time.delayedCall(i * 180, () => {
                    const p = scene.add.particles(m.x + (rng.fx.next() - 0.5) * 140, m.y + (rng.fx.next() - 0.5) * 140, 'p-spark', {
                        speed: { min: 150, max: 400 }, scale: { start: 1.4, end: 0 }, tint: [color, 0xffffff], lifespan: 600, quantity: 20, stopAfter: 20,
                    });
                    scene.time.delayedCall(900, () => p.destroy());
                });
            }
            scene.cameras.main.shake(800, 0.012);
            bus.emit('boss-hp', null);
        }
        if (b.active) b.destroy();
    }

    private bossFx(m: CoopMsgs['boss-fx']): void {
        const b = this.boss?.id === m.id ? this.boss.b : null;
        if (!b?.active) return;
        const tx = m.tx ?? b.x;
        const ty = m.ty ?? b.y;
        switch (m.fx) {
            case 'engage': b.entrance(); break;
            case 'phase': b.phaseLook(); break;
            case 'dive': b.teleDive(tx, ty); break;
            case 'charge': b.teleCharge(tx, ty, m.dir ?? 1); break;
            case 'snipe': {
                const g = b.teleSnipe(tx, ty);
                this.scene.time.delayedCall(450, () => g.destroy());
                break;
            }
            case 'slam': b.teleSlam(tx, ty); break;
            case 'slam-hit': b.slamHit(tx, ty); break;
            case 'impact': b.builtinImpact(m.n ?? 90, m.dir ?? 0.5); break;
        }
    }

    /** un colpo al boss: la parata e l'invulnerabilità si leggono da quello che manda l'host */
    private bossHit(b: Boss, amount: number, fromX: number, dir?: 'side' | 'up' | 'down' | 'shot'): boolean {
        const cur = this.boss;
        if (!cur || cur.b !== b) return false;
        const look = cur.look;
        if (look && dir && look.guard === dir) {
            sfx.clang();
            return false;
        }
        if (look?.invulnerable ?? b.invulnerable) {
            const p = this.scene.add.particles(b.x + Math.sign(fromX - b.x) * 30, b.y, 'p-dot', {
                speed: { min: 40, max: 100 }, scale: { start: 0.6, end: 0 }, tint: b.def.glowColor, lifespan: 250, quantity: 5, stopAfter: 5,
            });
            this.scene.time.delayedCall(500, () => p.destroy());
            return false;
        }
        this.session.send('hit', { on: 'boss', id: cur.id, v: amount, fromX, dir });
        b.setTintFill(0xffffff);
        this.scene.time.delayedCall(60, () => b.active && b.clearTint());
        return true;
    }

    /* ---------- oggetti ---------- */
    /* la raccolta la chiede il premio stesso (Rewards guarda ctx.coop.mirror): qui si tiene
       solo il registro per chiave, così take/claim/reconcile sanno di chi è uno sprite */

    registerPickup(key: string, sprite: Phaser.GameObjects.GameObject): void {
        this.pickups.set(key, sprite);
    }

    /** la raccolta dell'ospite passa sempre da qui: niente premi locali, li applica l'host e tornano col save */
    claim(key: string, sprite: Phaser.GameObjects.GameObject): boolean {
        if (!sprite.active || this.pickups.get(key) !== sprite) return false;
        this.take(key, sprite);
        return true;
    }

    private take(key: string, sprite: Phaser.GameObjects.GameObject): void {
        if (!sprite.active) return;
        this.pickups.delete(key);
        sprite.destroy();
        sfx.pickup();
        this.session.send('take', { key });
    }

    /** chi entra dopo ha già generato i pickup del livello: quelli che l'host non ha più sono già presi */
    private reconcilePickups(live: PickupSpawn[]): void {
        const keys = new Set(live.map((p) => p.key));
        for (const [key, sprite] of [...this.pickups]) {
            if (!keys.has(key)) {
                this.pickups.delete(key);
                if (sprite.active) sprite.destroy();
            }
        }
    }

    private pickup(p: PickupSpawn): void {
        if (this.pickups.has(p.key)) return;
        const r = this.ctx.rewards;
        switch (p.kind) {
            case 'fragment': r.spawnFragment(p.x, p.y, p.ability, p.loose); break;
            case 'item': r.spawnItemPickup(p.x, p.y, p.item, p.amount, p.key, p.loose); break;
            case 'cuore': r.spawnCuore(p.x, p.y, p.key, p.loose); break;
            case 'barre': r.spawnBarrePickup(p.x, p.y, p.amount, p.key); break;
            case 'maschera': r.spawnMaschera(p.x, p.y, p.key); break;
            case 'note': this.note(p); break;
        }
    }

    private note(p: Extract<PickupSpawn, { kind: 'note' }>): void {
        this.hookNotes();
        const note = this.ctx.groups.barre.create(p.x, p.y, 'barra') as Phaser.Physics.Arcade.Sprite;
        note.setData('value', p.value);
        note.setData('coopKey', p.key);
        note.setDepth(4);
        note.setVelocity(p.vx, p.vy);
        note.setBounce(0.5);
        this.pickups.set(p.key, note);
    }

    /** le note si prendono in gruppo: il raccoglitore del gruppo diventa una richiesta */
    private hookNotes(): void {
        if (this.notesHooked) return;
        const player = this.ctx.player;
        const collider = this.scene.physics.world.colliders.getActive().find((c) => c.object1 === player && c.object2 === this.ctx.groups.barre);
        if (!collider) return;
        this.notesHooked = true;
        collider.collideCallback = (_p, obj) => {
            const note = obj as Phaser.Physics.Arcade.Sprite;
            const key = note.getData('coopKey') as string | undefined;
            if (!key) return;
            this.take(key, note);
            sfx.barra();
        };
    }

    /* ---------- a ogni fotogramma ---------- */

    present(delta: number): void {
        const now = performance.now();
        const at = now - this.delay.ms;
        const sceneNow = this.scene.time.now;
        const boss = this.boss;
        if (boss?.b.active) {
            const s = boss.track.at(at, this.out);
            if (s) {
                const b = boss.b;
                const look = s.look;
                boss.look = look;
                b.setPosition(this.out.x, this.out.y);
                (b.body as Phaser.Physics.Arcade.Body).velocity.set(this.out.vx, this.out.vy);
                b.setRotation(look.rot);
                b.setScale(look.sx, look.sy);
                b.setAlpha(look.alpha);
                b.setFlipX(look.flipX);
                applyTint(b, look.tint, look.color);
                b.engaged = look.engaged;
                b.invulnerable = look.invulnerable;
                b.hp = look.hp;
                b.maxHp = look.maxHp;
            }
            boss.b.puppetTick(delta);
        }
        for (const [id, e] of this.enemies) {
            if (!e.active) {
                this.enemies.delete(id);
                continue;
            }
            const tr = this.tracks.get(id);
            const fresh = now - (this.seen.get(id) ?? -1e9) < STALE_MS;
            if (!tr || !fresh) {
                e.setDormant(true);
                continue;
            }
            e.setDormant(false);
            const s = tr.at(at, this.out);
            if (!s) continue;
            const look = s.look;
            e.setPosition(this.out.x, this.out.y);
            const body = e.body as Phaser.Physics.Arcade.Body;
            body.velocity.set(this.out.vx, this.out.vy);
            e.setFlipX(look.flipX);
            e.setFlipY(look.flipY);
            applyTint(e, look.tint, look.color);
            e.puppetMode(MODES[look.mode] ?? 'patrol');
            e.puppetStun(look.stunned ? sceneNow + 120 : 0);
            e.setAngle(look.angle);
            e.setAlpha(look.alpha);
            e.dress(body, sceneNow, delta);
        }
    }

    destroy(): void {
        for (const off of this.offs) off();
        this.offs.length = 0;
        coopHooks.puppetEnemy = null;
        coopHooks.puppetBoss = null;
    }
}
