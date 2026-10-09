import type Phaser from 'phaser';
import { TILE } from '../config';
import { checkAchievements } from '../core/achievements';
import { hashString } from '../rules/hash';
import { expectCollectible } from '../core/ChapterCompletion';
import { bus } from '../core/events';
import { sfx } from '../audio/sfx';
import { state } from '../core/state';
import { TimeTrial } from '../mechanics/TimeTrial';
import type { Enemy } from '../entities/Enemy';
import type { EnemyKind } from '../types';
import type { Room } from '../world/types';
import type { GameContext, GameSystem } from './context';

type ChallengesCtx = Pick<GameContext, 'simulates' | 'coop' | 'scene' | 'world' | 'player' | 'lighting' | 'interactions' | 'npcs' | 'groups' | 'enemies' | 'bosses' | 'arena' | 'feel' | 'travel'>;

/** le sfide fuori strada: il microfono rosso a ondate e la corsa contro il citelis */
export class Challenges implements GameSystem {
    /** la corsa contro il citelis: il palo con l'orario accanto a una fermata */
    trial: TimeTrial | null = null;
    /** sfida a ondate in una stanza laterale: il microfono rosso */
    private challenge: { room: Room; wave: number; enemies: Enemy[]; nextAt: number; x: number; y: number } | null = null;
    private challengeSpot: { room: Room; x: number; y: number; mic: Phaser.GameObjects.Sprite } | null = null;
    private readonly ctx: ChallengesCtx;
    private readonly scene: Phaser.Scene;

    constructor(ctx: ChallengesCtx) {
        this.ctx = ctx;
        this.scene = ctx.scene;
    }

    /** a ondate in corso l'arena è sua, non del boss */
    get active(): boolean {
        return !!this.challenge;
    }

    /** una per regione, in una stanza laterale larga: sempre la stessa, scelta dall'id */
    spawnChallenge(): void {
        const L = this.ctx.world.layout;
        if (!L?.spots?.length || this.ctx.world.def.hub) return;
        const rooms = L.rooms.filter((o) => o.pathIndex < 0 && (o.kind === 'hall' || o.kind === 'cave') && o.rect.w >= 18);
        const cands = rooms
            .map((room) => ({ room, spots: L.spots!.filter((sp) => sp[2] === room.id) }))
            .filter((o) => o.spots.length >= 3)
            // il microfono rosso resta fuori dai sigilli: due extra non si sovrappongono
            .filter((o) => !L.seals?.some((s) => s.room === o.room.id));
        if (!cands.length) return;
        const pickFrom = cands.slice().sort((a, b) => hashString(`${this.ctx.world.def.id}-${a.room.id}`) - hashString(`${this.ctx.world.def.id}-${b.room.id}`));
        for (const cand of pickFrom) {
            const sp = cand.spots[Math.floor(cand.spots.length / 2)];
            const x = sp[0] * TILE + TILE / 2;
            const y = (sp[1] + 1) * TILE - 18;
            if (this.ctx.interactions.someNear(x, y, 200, 140)) continue;
            const won = state.hasFlag(`arena-vinta-${this.ctx.world.def.id}`);
            const mic = this.ctx.npcs.castSprite(x, y - 12, 'mic').setDepth(4).setTint(won ? 0x64748b : 0xef4444);
            if (!won) this.ctx.lighting.static(x, y - 30, 0xef4444, 170, 0.9);
            const arenaKey = `arena-vinta-${this.ctx.world.def.id}`;
            const arenaLevel = this.ctx.world.def.id;
            expectCollectible(arenaLevel, arenaKey, 'thing', () => state.hasFlag(arenaKey));
            this.challengeSpot = { room: cand.room, x, y, mic };
            this.ctx.interactions.add({ x, y, range: 60, onInteract: () => this.offerChallenge() });
            return;
        }
    }

    challengePoints(): { x: number; y: number }[] {
        const pts = this.challengeSpot ? [{ x: this.challengeSpot.x, y: this.challengeSpot.y }] : [];
        if (this.trial?.post) pts.push(this.trial.post);
        return pts;
    }

    /** la corsa contro il citelis: il palo con l'orario accanto a una fermata */
    spawnTrial(): void {
        this.trial = null;
        if (!this.ctx.world.layout?.trials?.length || this.ctx.world.def.hub) return;
        const trial = new TimeTrial(this.scene, this.ctx.lighting, this.ctx.world.def.id);
        const it = trial.setup(this.ctx.travel.busStops, this.ctx.world.layout.trials);
        if (!it) return;
        this.trial = trial;
        this.ctx.interactions.add(it);
    }

    private offerChallenge(): void {
        if (!this.ctx.simulates) return;
        const spot = this.challengeSpot;
        if (!spot || this.challenge || this.ctx.bosses.current?.engaged) return;
        if (state.hasFlag(`arena-vinta-${this.ctx.world.def.id}`)) {
            bus.emit('toast', { text: 'il microfono rosso tace. questa arena l\'hai già vinta.' });
            return;
        }
        bus.emit('choice-show', {
            title: 'microfono rosso: tre ondate, porte chiuse, niente fuga. il pubblico vuole sangue.',
            options: [{ label: 'sali sul palco', danger: true }, { label: 'non ora' }],
            onPick: (i) => {
                if (i !== 0) return;
                this.challenge = { room: spot.room, wave: 0, enemies: [], nextAt: this.scene.time.now + 900, x: spot.x, y: spot.y };
                this.ctx.arena.lock(spot.room);
                // in due le sbarre le vede anche l'altro: chi è fuori finisce dentro
                this.ctx.coop?.arenaLocked(spot.room, (p) => this.ctx.arena.contains(spot.room, p.x, p.y));
                bus.emit('toast', { text: 'sfida accettata. prima ondata.' });
            },
        });
    }

    updateChallenge(time: number): void {
        if (!this.ctx.simulates) return;
        const ch = this.challenge!;
        if (this.ctx.player.dead) {
            // chi muore sul palco perde la sfida: il pubblico se ne va, i mostri pure
            for (const e of ch.enemies) if (e.active) e.destroy();
            this.challenge = null;
            this.ctx.arena.unlock();
            return;
        }
        this.ctx.arena.draw(time);
        ch.enemies = ch.enemies.filter((e) => e.active);
        if (ch.enemies.length || time < ch.nextAt) return;
        if (ch.wave === 3) {
            this.winChallenge();
            return;
        }
        ch.wave++;
        const kinds = [...new Set(this.ctx.world.level.entities.filter((e) => e.spec.type === 'enemy').map((e) => (e.spec as { kind: EnemyKind }).kind))];
        const pool: EnemyKind[] = kinds.length ? kinds : ['glitchetto'];
        const spots = (this.ctx.world.layout?.spots ?? []).filter((sp) => sp[2] === ch.room.id);
        const n = 2 + ch.wave;
        for (let k = 0; k < n; k++) {
            const sp = spots[(k * 7 + ch.wave * 3) % spots.length];
            const x = sp ? sp[0] * TILE + TILE / 2 : ch.x + (k - n / 2) * 60;
            const y = sp ? (sp[1] + 1) * TILE - 20 : ch.y;
            // mai addosso al geco: chi nasce troppo vicino si sposta dall'altra parte del palco
            const fx = Math.abs(x - this.ctx.player.x) < 160 ? ch.x * 2 - x : x;
            const elite = ch.wave === 3 && k === 0;
            this.ctx.enemies.spawnEnemy(pool[(k + ch.wave) % pool.length], fx, y, { hunting: true, elite });
            ch.enemies.push(this.ctx.groups.enemies.getLast(true) as Enemy);
        }
        this.ctx.feel.shake(160, 0.004);
        bus.emit('toast', { text: ch.wave === 3 ? 'ultima ondata. c\'è anche uno grosso.' : `ondata ${ch.wave} di 3.` });
        ch.nextAt = time + 1400;
    }

    private winChallenge(): void {
        this.challenge = null;
        this.ctx.arena.unlock();
        state.setFlag(`arena-vinta-${this.ctx.world.def.id}`);
        state.save.barre += 180;
        state.addItem('panino-nonna', 2);
        state.persist();
        sfx.unlock();
        bus.emit('barre-changed', { barre: state.save.barre, gained: true });
        bus.emit('toast', { text: 'il pubblico impazzisce. +180 barre e due panini della nonna.' });
        this.challengeSpot?.mic.setTint(0x64748b);
        checkAchievements();
    }


    destroy(): void {}
}
