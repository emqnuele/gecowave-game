import Phaser from 'phaser';
import { TILE } from '../config';
import { TOASTS } from '../content/story';
import type { Player } from '../entities/Player';
import type { LightingManager } from './LightingManager';
import { bus } from './events';
import type { NavGraph } from './nav/NavGraph';
import { regionView, type RegionMarker } from './regionView';
import { sfx } from './sfx';
import { state } from './state';
import type { AbilitySeal, RegionLayout, SealKind } from '../world/types';

/* sigilli delle abilità: ogni wave apre il mondo nel suo modo. un solo
   manager ascolta l'evento di scena wave-world e non nove if in GameScene */

export interface WaveWorldEvent {
    wave: string;
    x: number;
    y: number;
    area: Phaser.Geom.Circle | Phaser.Geom.Rectangle;
    level?: number;
}

export interface AbilitySealsContext {
    scene: Phaser.Scene;
    regionId: string;
    layout: RegionLayout | null;
    player: Player;
    nav: NavGraph;
    lighting: LightingManager;
    fakeWalls: Phaser.Physics.Arcade.StaticGroup;
    breakableWalls: Phaser.Physics.Arcade.StaticGroup;
    /** il gemello del riflesso, l'unico che conta per lo specchio */
    getClone(): { x: number; y: number; w: number; h: number } | null;
    giveHeart(x: number, y: number, key: string): void;
    giveItem(x: number, y: number, item: string, key: string): void;
    giveBarre(x: number, y: number, amount: number, key?: string): void;
    giveNotch(x: number, y: number, key: string): void;
}

interface LiveSeal {
    seal: AbilitySeal;
    opened: boolean;
    cx: number;
    cy: number;
    markX: number;
    markY: number;
    barrier: Phaser.GameObjects.Zone[];
    visuals: Phaser.GameObjects.GameObject[];
    lights: Phaser.GameObjects.Light[];
    mark: Phaser.GameObjects.Text | null;
    holdMs: number;
    lastHit: number;
    nextTick: number;
    lastEcoSfx: number;
    baseX: number;
}

// i tipi costruiti finora: gli altri arrivano con la fase dopo
const BUILT: ReadonlySet<SealKind> = new Set(['cortina', 'risonanza']);

const SEAL_COLORS: Record<SealKind, number> = {
    cortina: 0x22d3ee,
    rimbalzo: 0x4ade80,
    specchio: 0xa5f3fc,
    risonanza: 0x4ade80,
    miasma: 0xa3e635,
    camino: 0xfb923c,
    resina: 0x67e8a0,
    teorema: 0x60a5fa,
    ricevitore: 0xef4444,
};

const SEEN_R = 250;

export function doorRect(d: AbilitySeal['door']): Phaser.Geom.Rectangle {
    if (d.axis === 'h') return new Phaser.Geom.Rectangle(d.x * TILE - 8, (d.y - 3) * TILE, 16, Math.max(1, d.len + 3) * TILE);
    return new Phaser.Geom.Rectangle((d.x - 1) * TILE, d.y * TILE - 8, Math.max(1, d.len) * TILE, 16);
}

function intersectsArea(area: Phaser.Geom.Circle | Phaser.Geom.Rectangle, rect: Phaser.Geom.Rectangle): boolean {
    if (area instanceof Phaser.Geom.Circle) return Phaser.Geom.Intersects.CircleToRectangle(area, rect);
    return Phaser.Geom.Intersects.RectangleToRectangle(area, rect);
}

export class AbilitySeals {
    private ctx: AbilitySealsContext;
    private live: LiveSeal[] = [];
    private solids: Phaser.Physics.Arcade.StaticGroup;

    constructor(ctx: AbilitySealsContext) {
        this.ctx = ctx;
        this.solids = ctx.scene.physics.add.staticGroup();
        ctx.scene.physics.add.collider(ctx.player, this.solids);
        for (const seal of ctx.layout?.seals ?? []) {
            if (state.hasFlag(`sigillo-${seal.id}`)) continue;
            if (!BUILT.has(seal.kind)) {
                if (import.meta.env.DEV) console.warn(`[sigilli] ${seal.id} non ancora costruito`);
                continue;
            }
            this.live.push(this.build(seal));
        }
        ctx.scene.events.on('wave-world', this.onWave, this);
    }

    markers(): RegionMarker[] {
        return this.live
            .filter((l) => !l.opened && state.hasFlag(`visto-sigillo-${l.seal.id}`))
            .map((l) => ({ x: l.cx, y: l.cy, kind: 'seal' as const, label: '33' }));
    }

    update(time: number): void {
        const p = this.ctx.player;
        if (p.dead) return;
        for (const l of this.live) {
            if (l.opened) continue;
            if (!state.hasFlag(`visto-sigillo-${l.seal.id}`)
                && Math.abs(p.x - l.markX) < SEEN_R && Math.abs(p.y - l.markY) < SEEN_R) {
                state.setFlag(`visto-sigillo-${l.seal.id}`);
                regionView.markers.push({ x: l.cx, y: l.cy, kind: 'seal', label: '33' });
            }
            // la parete che vibra trema davvero, ma la barriera resta ferma
            if (l.seal.kind === 'risonanza') {
                for (const v of l.visuals) {
                    if (v instanceof Phaser.GameObjects.Graphics) v.x = l.baseX + Math.sin(time / 46) * 2;
                }
            }
        }
    }

    destroy(): void {
        this.ctx.scene.events.off('wave-world', this.onWave, this);
        for (const l of this.live) {
            for (const z of l.barrier) z.destroy();
            for (const v of l.visuals) v.destroy();
            for (const li of l.lights) this.ctx.lighting.remove(li);
        }
        this.live = [];
        this.solids.destroy();
    }

    private onWave(ev: WaveWorldEvent): void {
        for (const l of this.live) {
            if (l.opened) continue;
            const trigger = doorRect(l.seal.door);
            if (l.seal.kind === 'cortina') {
                if (ev.wave === 'scivolata' && intersectsArea(ev.area, trigger)) this.open(l);
            } else if (l.seal.kind === 'risonanza') {
                if (ev.wave !== 'risonante' || !intersectsArea(ev.area, trigger)) continue;
                // l'eco è corta: si sente ovattata e non basta, onda e piena sì
                if ((ev.level ?? 0) >= 1) {
                    this.open(l);
                } else if (this.ctx.scene.time.now - l.lastEcoSfx > 500) {
                    l.lastEcoSfx = this.ctx.scene.time.now;
                    sfx.bubble();
                }
            }
        }
    }

    private build(seal: AbilitySeal): LiveSeal {
        const { scene, lighting } = this.ctx;
        const rect = doorRect(seal.door);
        const cx = rect.centerX;
        const cy = rect.centerY;
        const color = SEAL_COLORS[seal.kind];
        const live: LiveSeal = {
            seal, opened: false, cx, cy,
            markX: cx, markY: rect.top - 18,
            barrier: [], visuals: [], lights: [], mark: null,
            holdMs: 0, lastHit: 0, nextTick: 0, lastEcoSfx: 0, baseX: 0,
        };
        // la barriera nega la porta al geco soltanto: clone e proiettili passano
        const zone = scene.add.zone(cx, cy, Math.max(8, rect.width), Math.max(8, rect.height));
        scene.physics.add.existing(zone, true);
        this.solids.add(zone);
        live.barrier.push(zone);
        const light = lighting.static(cx, cy, color, 170, 0.8);
        live.lights.push(light);
        if (seal.kind === 'cortina') {
            const g = scene.add.graphics().setDepth(5);
            for (let x = rect.left; x < rect.right; x += 12) {
                g.fillStyle(x / 12 % 2 < 1 ? 0x22d3ee : 0xc084fc, 0.55);
                g.fillRect(x, rect.top, 6, rect.height);
            }
            live.visuals.push(g);
            scene.tweens.add({ targets: g, alpha: 0.65, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        } else if (seal.kind === 'risonanza') {
            const g = scene.add.graphics().setDepth(5);
            g.fillStyle(0x4ade80, 0.35);
            g.fillRect(rect.left, rect.top, rect.width, rect.height);
            g.lineStyle(3, 0x4ade80, 0.9);
            for (let y = rect.top; y < rect.bottom; y += 14) {
                g.lineBetween(rect.left, y, rect.left + rect.width / 2, y);
                g.lineBetween(rect.left + rect.width / 2, y + 7, rect.left + rect.width, y + 7);
            }
            g.lineStyle(2, 0xd1fae5, 0.8);
            g.strokeCircle(cx, cy, 12);
            live.baseX = g.x;
            live.visuals.push(g);
        }
        // il 33 azzurro sta sul bordo, come quelli dell'1% di pedro
        const mark = scene.add.text(live.markX, live.markY, '33', {
            fontFamily: '"Permanent Marker", cursive',
            fontSize: '26px',
            color: '#7dd3fc',
        }).setOrigin(0.5).setDepth(6);
        live.mark = mark;
        return live;
    }

    private open(l: LiveSeal): void {
        if (l.opened || state.hasFlag(`sigillo-${l.seal.id}`)) return;
        l.opened = true;
        const { scene } = this.ctx;
        // prima il flag, poi il premio: niente doppi premi al riavvio
        state.setFlag(`sigillo-${l.seal.id}`);
        for (const z of l.barrier) z.destroy();
        l.barrier = [];
        for (const li of l.lights) this.ctx.lighting.remove(li);
        l.lights = [];
        const fading = [...l.visuals, ...(l.mark ? [l.mark] : [])];
        l.visuals = [];
        l.mark = null;
        scene.tweens.add({ targets: fading, alpha: 0, duration: 320, onComplete: () => fading.forEach((v) => v.destroy()) });
        const key = `sigillo-premio-${l.seal.id}`;
        const px = (l.seal.reward.c + 0.5) * TILE;
        const py = l.seal.reward.r * TILE - 10;
        const prize = l.seal.prize;
        if (prize.kind === 'barre') this.ctx.giveBarre(px, py, prize.amount, key);
        else if (prize.kind === 'cuore') this.ctx.giveHeart(px, py, key);
        else if (prize.kind === 'tacca') this.ctx.giveNotch(px, py, key);
        else this.ctx.giveItem(px, py, prize.item, key);
        sfx.unlock();
        if (!state.hasFlag('seme-sigilli-visto')) {
            state.setFlag('seme-sigilli-visto');
            bus.emit('toast', { text: TOASTS.sigilloPrima });
        } else {
            bus.emit('toast', { text: TOASTS.sigilloDopo });
        }
        const idx = regionView.markers.findIndex((m) => m.kind === 'seal' && Math.abs(m.x - l.cx) < 4 && Math.abs(m.y - l.cy) < 4);
        if (idx >= 0) regionView.markers.splice(idx, 1);
        state.persist();
    }
}
