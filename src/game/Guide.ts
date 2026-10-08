import Phaser from 'phaser';
import { ZONE_HEX } from '../config';
import type { AbilitySeals } from '../engine/AbilitySeals';
import { RegionGuide } from '../engine/RegionGuide';
import { regionView } from '../engine/regionView';
import { state } from '../engine/state';
import type { Target } from './chapters/ChapterScript';
import type { GameContext, GameSystem } from './context';

type GuideCtx = Pick<GameContext, 'scene' | 'world' | 'player' | 'bosses' | 'chapter' | 'rewards' | 'travel'>;

/** dove andare adesso: l'obiettivo, la mappa del telefono e la freccia della modalità assistita */
export class Guide implements GameSystem {
    /** le stanze della regione per la freccia: null nel capitolo vecchio */
    readonly guide: RegionGuide | null;
    /** percorso della freccia: ricalcolato solo cambiando stanza */
    private guideCacheKey = '';
    private guideCache: { x: number; y: number; rooms: number } | null = null;
    private guideGfx!: Phaser.GameObjects.Graphics;
    private readonly ctx: GuideCtx;
    private readonly scene: Phaser.Scene;

    constructor(ctx: GuideCtx) {
        this.ctx = ctx;
        this.scene = ctx.scene;
        this.guide = ctx.world.layout ? new RegionGuide(ctx.world.layout) : null;
    }

    /** cosa serve adesso per andare avanti, in ordine di urgenza */
    currentObjective(): Target | null {
        // la wave libera prima dell'uscita: se il capitolo nasconde un frammento
        // non ancora preso (es. la scivolata in perduta), la freccia ci porta lì.
        // in perduta markolino la annuncia: prima lui, poi il frammento, poi l'uscita.
        const urgent = this.ctx.chapter.urgentObjective?.();
        if (urgent) return urgent;
        const free = this.ctx.rewards.freeFragment();
        if (free) return free;
        const boss = this.ctx.bosses.current;
        if (boss?.active && !boss.engaged && boss.def.guardsExit !== false) return { x: boss.x, y: boss.y, label: boss.def.name.split(',')[0] };
        const story = this.ctx.chapter.objective?.();
        if (story !== undefined) return story;
        const exit = this.ctx.world.level.exits[0];
        if (exit) return { x: exit.centerX, y: exit.centerY, label: this.ctx.world.def.next ? 'uscita' : 'ritorno' };
        return null;
    }

    buildGuide(seals: AbilitySeals | null): void {
        this.guideGfx = this.scene.add.graphics().setDepth(9);
        regionView.id = this.ctx.world.def.id;
        regionView.layout = this.ctx.world.layout;
        regionView.markers = [
            ...this.ctx.world.level.checkpoints.map((c) => ({ x: c.x, y: c.y, kind: 'mic' as const })),
            ...this.ctx.world.level.exits.slice(0, 1).map((e) => ({ x: e.centerX, y: e.centerY, kind: 'exit' as const })),
            ...this.ctx.travel.busStops.map((s) => ({ x: s.x, y: s.y, kind: 'stop' as const })),
            ...(seals ? seals.markers() : []),
        ];
    }

    /** freccia attorno al geco verso il prossimo varco giusto; sparisce in combattimento e quando sei arrivato */
    updateGuide(time: number): void {
        const g = this.guideGfx;
        g.clear();
        const goal = this.currentObjective();
        regionView.player = { x: this.ctx.player.x, y: this.ctx.player.y };
        regionView.goal = goal;
        if (!goal || !state.settings.guide || this.ctx.player.dead || this.ctx.bosses.current?.engaged || this.ctx.chapter.pursuer?.()) return;
        // la BFS costa: vale finché player e bersaglio restano nelle stesse stanze;
        // l'obiettivo cambia (wave presa → uscita), quindi la chiave include anche il bersaglio
        const key = this.guide ? `${this.guide.roomAt(this.ctx.player.x, this.ctx.player.y)?.id ?? -1}:${this.guide.roomAt(goal.x, goal.y)?.id ?? -1}:${Math.round(goal.x)}:${Math.round(goal.y)}` : `direct:${Math.round(goal.x)}:${Math.round(goal.y)}`;
        let next = key === this.guideCacheKey ? this.guideCache : null;
        if (!next) {
            next = this.guide ? this.guide.nextPoint(this.ctx.player.x, this.ctx.player.y, goal.x, goal.y) : { x: goal.x, y: goal.y, rooms: 0 };
            this.guideCacheKey = key;
            this.guideCache = next;
        }
        if (!next) return;
        const dx = next.x - this.ctx.player.x;
        const dy = next.y - this.ctx.player.y;
        const d = Math.hypot(dx, dy);
        if (next.rooms === 0 && d < 140) return;
        const a = Math.atan2(dy, dx);
        const R = 64;
        const cx = this.ctx.player.x + Math.cos(a) * R;
        const cy = this.ctx.player.y - 6 + Math.sin(a) * R;
        const pulse = 0.55 + Math.sin(time / 260) * 0.2;
        const tip = { x: cx + Math.cos(a) * 11, y: cy + Math.sin(a) * 11 };
        const l = { x: cx + Math.cos(a + 2.5) * 10, y: cy + Math.sin(a + 2.5) * 10 };
        const r = { x: cx + Math.cos(a - 2.5) * 10, y: cy + Math.sin(a - 2.5) * 10 };
        g.fillStyle(0x000000, 0.6 * pulse);
        g.fillTriangle(tip.x + 2, tip.y + 2, l.x + 2, l.y + 2, r.x + 2, r.y + 2);
        g.fillStyle(ZONE_HEX[this.ctx.world.def.color], pulse);
        g.fillTriangle(tip.x, tip.y, l.x, l.y, r.x, r.y);
        g.lineStyle(2, 0x000000, 0.8 * pulse);
        g.strokeTriangle(tip.x, tip.y, l.x, l.y, r.x, r.y);
    }


    destroy(): void {}
}
