import Phaser from 'phaser';
import { TOASTS, WAVESUNG } from '../content/story';
import { TOTAL_FRAGMENTS, TOTAL_MASCHERE } from '../content/levels';
import { BOSS_CHARMS, ITEMS } from '../content/items';
import { ensurePickupTextures } from '../art/pickups';
import { expectCollectible, expectLoreKey } from '../core/ChapterCompletion';
import { bus } from '../core/events';
import { sfx } from '../audio/sfx';
import { state } from '../core/state';
import type { AbilityId, BossKind } from '../types';
import type { GameContext, GameSystem } from './context';
import type { PickupSpawn } from '../coop/protocol';


type RewardsCtx = Pick<GameContext, 'coop' | 'scene' | 'world' | 'player' | 'lighting' | 'interactions' | 'dialogues'>;

/** tutto quello che si raccoglie: oggetti, frammenti, cuori, maschere, barre, note */
export class Rewards implements GameSystem {
    private readonly ctx: RewardsCtx;
    private readonly scene: Phaser.Scene;
    private homing: { obj: Phaser.Physics.Arcade.Sprite; at: number; moving: boolean }[] = [];
    /** frammenti della wave vivi nel mondo: la freccia ci punta finché non li prendi */
    private liveFragments: { x: number; y: number; ability: AbilityId; obj: Phaser.Physics.Arcade.Sprite }[] = [];
    /** ogni premio vivo, per chiave: l'host lo ritrova anche se il coop si è agganciato dopo */
    private readonly coopPickups = new Map<string, { spec: PickupSpawn; sprite: Phaser.GameObjects.GameObject }>();

    constructor(ctx: RewardsCtx) {
        this.ctx = ctx;
        this.scene = ctx.scene;
    }

    hasLiveFragment(ability: AbilityId): boolean {
        return this.liveFragments.some((f) => f.ability === ability);
    }

    /** i premi vivi in questo capitolo: l'host li adotta quando il coop si aggancia a partita iniziata */
    livePickups(): IterableIterator<{ spec: PickupSpawn; sprite: Phaser.GameObjects.GameObject }> {
        return this.coopPickups.values();
    }

    /** registra un premio per il coop: lo tiene per chiave e lo annuncia a chi comanda il mondo */
    private publish(spec: PickupSpawn, sprite: Phaser.GameObjects.GameObject, always = false): void {
        this.coopPickups.set(spec.key, { spec, sprite });
        sprite.once(Phaser.GameObjects.Events.DESTROY, () => {
            if (this.coopPickups.get(spec.key)?.sprite === sprite) this.coopPickups.delete(spec.key);
        });
        this.ctx.coop?.pickupSpawned(spec, sprite, always);
    }

    /** sacchetto o amuleto a terra: si raccoglie una volta sola per salvataggio */
    spawnItemPickup(x: number, y: number, item: string, amount: number, persistKey: string, loose = false): void {
        // il denominatore si registra prima del controllo: vale anche a oggetto già preso
        const kind = ITEMS[item]?.kind;
        if (kind === 'amuleto' || kind === 'potenziamento') {
            const id = item;
            const key = persistKey;
            const charm = kind === 'amuleto';
            expectCollectible(this.ctx.world.def.id, key, 'thing', () => state.save.collectedLore.includes(key) || (charm && state.hasCharm(id)));
        }
        if (!ITEMS[item] || state.save.collectedLore.includes(persistKey)) return;
        const isCharm = ITEMS[item].kind === 'amuleto';
        if (isCharm && state.hasCharm(item)) return;
        ensurePickupTextures(this.scene);
        if (loose) ({ x, y } = this.ctx.world.rewardSpot(x, y));
        const pickup = this.scene.physics.add.sprite(x, y, isCharm ? 'pickup-charm' : 'pickup-item').setDepth(5);
        if (loose) this.homeIn(pickup);
        (pickup.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        this.ctx.lighting.follow(pickup, isCharm ? 0xc084fc : 0xfacc15, 150, 0.8);
        this.scene.tweens.add({ targets: pickup, y: y - 7, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.scene.physics.add.overlap(this.ctx.player, pickup, () => {
            // in due decide l'host: qui si chiede, il premio torna col save
            if (this.ctx.coop?.mirror) {
                this.ctx.coop.mirror.claim(persistKey, pickup);
                return;
            }
            pickup.destroy();
            state.save.collectedLore.push(persistKey);
            state.addItem(item, amount);
            sfx.pickup();
            if (isCharm) {
                bus.emit('charm-found', { id: item });
            } else {
                bus.emit('toast', { text: `${ITEMS[item].icon} ${ITEMS[item].name}${amount > 1 ? ` ×${amount}` : ''} nello zaino` });
                bus.emit('inventory-changed', {});
            }
        });
        this.publish({ kind: 'item', key: persistKey, x, y, item, amount, loose }, pickup);
    }

    /** ogni boss lascia il suo amuleto, una volta sola */
    dropBossCharm(kind: BossKind, x: number, y: number): void {
        const id = BOSS_CHARMS[kind];
        if (!id || state.hasCharm(id)) return;
        this.spawnItemPickup(x + 40, y + 30, id, 1, `charm-${id}`, true);
    }

    /** le ricompense dei boss, dopo un attimo, vengono a cercarti: non si perdono */
    private homeIn(obj: Phaser.Physics.Arcade.Sprite): void {
        this.homing.push({ obj, at: this.scene.time.now + 1200, moving: false });
    }

    updateHoming(delta: number): void {
        const now = this.scene.time.now;
        this.homing = this.homing.filter((h) => h.obj.active);
        for (const h of this.homing) {
            if (now < h.at || this.ctx.player.dead) continue;
            const dx = this.ctx.player.x - h.obj.x;
            const dy = this.ctx.player.y - h.obj.y;
            const d = Math.hypot(dx, dy);
            if (d < 30) continue;
            if (!h.moving) {
                h.moving = true;
                this.scene.tweens.killTweensOf(h.obj);
            }
            const v = Math.min(d, (420 + d * 0.9) * (delta / 1000));
            h.obj.x += (dx / d) * v;
            h.obj.y += (dy / d) * v;
        }
    }

    spawnFragment(x: number, y: number, ability: AbilityId, loose = false): void {
        if (loose) ({ x, y } = this.ctx.world.rewardSpot(x, y));
        const key = `frammento-${ability}-${Math.round(x)}-${Math.round(y)}`;
        const shard = this.scene.physics.add.sprite(x, y, 'fragment').setDepth(5);
        (shard.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        this.ctx.lighting.follow(shard, 0x4ade80, 200, 1.0);
        this.scene.tweens.add({ targets: shard, y: y - 10, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.scene.tweens.add({ targets: shard, angle: { from: -8, to: 8 }, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        if (loose) this.homeIn(shard);
        this.liveFragments.push({ x, y, ability, obj: shard });
        this.scene.physics.add.overlap(this.ctx.player, shard, () => {
            if (!shard.active) return;
            // in due decide l'host: qui si chiede, il premio torna col save
            if (this.ctx.coop?.mirror) {
                this.ctx.coop.mirror.claim(key, shard);
                return;
            }
            this.liveFragments = this.liveFragments.filter((f) => f.obj !== shard);
            shard.destroy();
            // doppione (es. dono di markolino + pickup libero): sparisce in silenzio
            if (state.hasAbility(ability)) return;
            state.unlockAbility(ability);
            sfx.unlock();
            bus.emit('abilities-changed', { abilities: state.abilities });
            bus.emit('fragments-changed', { count: state.abilities.length, total: TOTAL_FRAGMENTS });
            bus.emit('ability-unlocked', { ability });
            // la prima wave insegna i 33: una nota sola, poi parlano i muri
            if (!state.hasFlag('sigilli-spiegati')) {
                state.setFlag('sigilli-spiegati');
                this.scene.time.delayedCall(1500, () => bus.emit('wavesung', WAVESUNG.markolinoSigilli));
            }
        });
        this.publish({ kind: 'fragment', key, x, y, ability, loose }, shard);
    }

    spawnLore(id: string, x: number, y: number): void {
        expectLoreKey(this.ctx.world.def.id, id, 'thing');
        const collected = state.save.collectedLore.includes(id);
        const tablet = this.scene.add.sprite(x, y + 1, 'lore-tablet').setDepth(4).setPipeline('Light2D').setAlpha(collected ? 0.5 : 1);
        this.ctx.interactions.add({
            x, y, range: 60,
            onInteract: () => {
                if (!state.save.collectedLore.includes(id)) {
                    state.save.collectedLore.push(id);
                    state.persist();
                    tablet.setAlpha(0.5);
                }
                this.ctx.dialogues.start(id);
            },
        });
    }

    spawnDroppedBarre(): void {
        const drop = state.dropped;
        if (!drop || drop.levelId !== this.ctx.world.def.id || drop.amount <= 0) return;
        const ghost = this.scene.physics.add.sprite(drop.x, drop.y, 'drop-ghost').setDepth(4);
        (ghost.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        this.ctx.lighting.follow(ghost, 0x4ade80, 130, 0.7);
        this.scene.tweens.add({ targets: ghost, y: drop.y - 8, alpha: 0.6, duration: 900, yoyo: true, repeat: -1 });
        this.scene.physics.add.overlap(this.ctx.player, ghost, () => {
            // in due decide l'host: qui si chiede, il premio torna col save
            if (this.ctx.coop?.mirror) {
                this.ctx.coop.mirror.claim('barre-perse', ghost);
                return;
            }
            ghost.destroy();
            state.save.barre += drop.amount;
            state.dropped = null;
            state.persist();
            sfx.pickup();
            bus.emit('barre-changed', { barre: state.save.barre, gained: true });
            bus.emit('toast', { text: TOASTS.barreRecovered });
        });
        this.publish({ kind: 'barre', key: 'barre-perse', x: drop.x, y: drop.y, amount: drop.amount }, ghost, true);
    }

    spawnBarrePickup(x: number, y: number, amount: number, persistKey?: string): void {
        // i pickup piazzati a mano non riappaiono una volta presi
        const key = persistKey ?? `${this.ctx.world.def.id}-${Math.round(x)}-${Math.round(y)}`;
        if (state.save.collectedLore.includes(key)) return;
        const note = this.scene.physics.add.sprite(x, y, 'barra').setDepth(4);
        (note.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        this.scene.tweens.add({ targets: note, y: y - 6, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.scene.physics.add.overlap(this.ctx.player, note, () => {
            // in due decide l'host: qui si chiede, il premio torna col save
            if (this.ctx.coop?.mirror) {
                this.ctx.coop.mirror.claim(key, note);
                return;
            }
            note.destroy();
            state.save.collectedLore.push(key);
            state.save.barre += amount;
            state.persist();
            sfx.pickup();
            bus.emit('barre-changed', { barre: state.save.barre, gained: true });
        });
        this.publish({ kind: 'barre', key, x, y, amount }, note);
    }

    /** cuore del realm: +1 vita massima, per sempre. in due lo assegna l'host e torna a tutti col grant */
    spawnCuore(x: number, y: number, persistKey: string, loose = false): void {
        expectLoreKey(this.ctx.world.def.id, persistKey, 'heart');
        if (state.save.collectedLore.includes(persistKey)) return;
        if (loose) ({ x, y } = this.ctx.world.rewardSpot(x, y));
        const heart = this.scene.physics.add.sprite(x, y, 'cuore').setDepth(5);
        if (loose) this.homeIn(heart);
        (heart.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        this.ctx.lighting.follow(heart, 0xf87171, 170, 0.9);
        this.scene.tweens.add({ targets: heart, y: y - 8, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.scene.tweens.add({ targets: heart, scale: { from: 1, to: 1.15 }, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.scene.physics.add.overlap(this.ctx.player, heart, () => {
            // in due decide l'host: qui si chiede, il premio torna col save
            if (this.ctx.coop?.mirror) {
                this.ctx.coop.mirror.claim(persistKey, heart);
                return;
            }
            heart.destroy();
            state.save.collectedLore.push(persistKey);
            state.save.stats.costituzione += 1;
            state.run.hp = state.maxHp;
            state.persist();
            sfx.heal();
            this.scene.cameras.main.flash(180, 248, 113, 113);
            bus.emit('hp-changed', { hp: state.run.hp, maxHp: state.maxHp, hurt: false });
            bus.emit('toast', { text: TOASTS.cuore });
        });
        this.publish({ kind: 'cuore', key: persistKey, x, y, loose }, heart);
    }

    private maschereCount(): number {
        return state.save.collectedLore.filter((k) => k.startsWith('maschera-')).length;
    }

    spawnMaschera(x: number, y: number, persistKey: string): void {
        expectLoreKey(this.ctx.world.def.id, persistKey, 'thing');
        if (state.save.collectedLore.includes(persistKey)) return;
        const mask = this.scene.physics.add.sprite(x, y, 'maschera').setDepth(5);
        (mask.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        this.ctx.lighting.follow(mask, 0x4ade80, 170, 0.9);
        this.scene.tweens.add({ targets: mask, y: y - 8, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.scene.tweens.add({ targets: mask, angle: { from: -6, to: 6 }, duration: 1700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.scene.physics.add.overlap(this.ctx.player, mask, () => {
            // in due decide l'host: qui si chiede, il premio torna col save
            if (this.ctx.coop?.mirror) {
                this.ctx.coop.mirror.claim(persistKey, mask);
                return;
            }
            mask.destroy();
            state.save.collectedLore.push(persistKey);
            state.save.barre += 25;
            state.persist();
            sfx.unlock();
            bus.emit('barre-changed', { barre: state.save.barre, gained: true });
            const n = this.maschereCount();
            bus.emit('toast', { text: `una maschera della tua stessa faccia (${n}/${TOTAL_MASCHERE}). +25 barre.` });
            if (n === 3 && !state.hasFlag('maschere-5')) {
                state.setFlag('maschere-5');
                state.save.stats.forza += 1;
                state.persist();
                bus.emit('wavesung', WAVESUNG.markolinoMaschere5);
            }
            if (n >= TOTAL_MASCHERE && !state.hasFlag('maschera-completa')) {
                state.setFlag('maschera-completa');
                bus.emit('wavesung', WAVESUNG.markolinoMaschere10);
                bus.emit('toast', { text: TOASTS.mascheraCompleta });
            }
        });
        this.publish({ kind: 'maschera', key: persistKey, x, y }, mask);
    }

    /** frammento della wave ancora a terra in questo capitolo, il più vicino: la freccia ci porta prima qui */
    freeFragment(): { x: number; y: number; label: string } | null {
        if (!this.ctx.player) return null;
        let bx = 0;
        let by = 0;
        let bd = Infinity;
        let found = false;
        // prima quelli vivi nel mondo (es. il dono appena caduto ai piedi di markolino)
        for (const f of this.liveFragments) {
            if (!f.obj.active || state.hasAbility(f.ability)) continue;
            const d = Math.hypot(f.x - this.ctx.player.x, f.y - this.ctx.player.y);
            if (d < bd) { bd = d; bx = f.x; by = f.y; found = true; }
        }
        // fallback: piazzamenti statici del capitolo non ancora presi
        if (!found) {
            for (const e of this.ctx.world.level.entities) {
                if (e.spec.type !== 'ability' || state.hasAbility(e.spec.ability)) continue;
                const d = Math.hypot(e.x - this.ctx.player.x, e.y - this.ctx.player.y);
                if (d < bd) { bd = d; bx = e.x; by = e.y; found = true; }
            }
        }
        return found ? { x: bx, y: by, label: 'frammento della wave' } : null;
    }


    destroy(): void {}
}
