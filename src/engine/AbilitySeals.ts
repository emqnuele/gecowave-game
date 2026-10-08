import Phaser from 'phaser';
import { TILE } from '../config';
import { TOASTS, WAVESUNG } from '../content/story';
import type { Player } from '../entities/Player';
import type { LightingManager } from './LightingManager';
import { bus } from './events';
import type { NavGraph } from './nav/NavGraph';
import { regionView, type RegionMarker } from './regionView';
import { sfx } from './sfx';
import { state } from './state';
import type { AbilitySeal, RegionLayout, SealKind } from '../world/types';
import { offWorld, onWorld, type WorldEvents } from './worldEvents';

/* sigilli delle abilità: ogni wave apre il mondo nel suo modo. un solo
   manager ascolta l'evento di scena wave-world e non nove if in GameScene */

export type WaveWorldEvent = WorldEvents['wave-world'];

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
    closing: boolean;
    cx: number;
    cy: number;
    markX: number;
    markY: number;
    barrier: Phaser.GameObjects.Zone[];
    visuals: Phaser.GameObjects.GameObject[];
    lights: Phaser.GameObjects.Light[];
    mark: Phaser.GameObjects.Text | null;
    plate: Phaser.GameObjects.Graphics | null;
    ring: Phaser.GameObjects.Graphics | null;
    ringLit: boolean;
    holdMs: number;
    lastHit: number;
    nextTick: number;
    lastFx: number;
    baseX: number;
}

/* barriera vera solo dove serve: il miasma si attraversa e le nicchie
   di geometria sono già la prova, senza muri finti aggiunti */
const WALLED: ReadonlySet<SealKind> = new Set(['cortina', 'specchio', 'risonanza', 'resina', 'teorema', 'ricevitore']);

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
            this.live.push(this.build(seal));
        }
        onWorld(ctx.scene, 'wave-world', this.onWave, this);
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
            if (l.opened || l.closing) continue;
            if (!state.hasFlag(`visto-sigillo-${l.seal.id}`)
                && Math.abs(p.x - l.markX) < SEEN_R && Math.abs(p.y - l.markY) < SEEN_R) {
                state.setFlag(`visto-sigillo-${l.seal.id}`);
                regionView.markers.push({ x: l.cx, y: l.cy, kind: 'seal', label: '33' });
                // una sola nota di markolino, la prima volta che un 33 si fa vedere
                if (!state.hasFlag('sigilli-spiegati')) {
                    state.setFlag('sigilli-spiegati');
                    this.ctx.scene.time.delayedCall(1200, () => bus.emit('wavesung', WAVESUNG.markolinoSigilli));
                }
            }
            const kind = l.seal.kind;
            // la parete che vibra trema davvero, ma la barriera resta ferma
            if (kind === 'risonanza') {
                for (const v of l.visuals) {
                    if (v instanceof Phaser.GameObjects.Graphics) v.x = l.baseX + Math.sin(time / 46) * 2;
                }
            } else if (kind === 'rimbalzo' || kind === 'camino') {
                // doppio salto e aggrappo si provano col corpo, non con la wave
                const lit = state.hasAbility(l.seal.ability);
                if (lit !== l.ringLit) {
                    l.ringLit = lit;
                    this.paintRing(l);
                }
                if (lit && Math.hypot(p.x - l.cx, p.y - l.cy) < 42) this.open(l);
            } else if (kind === 'miasma') {
                // la nube morde ma non finisce chi è a terra: sotto 1 vita smette
                if (this.cloudRect(l.seal).contains(p.x, p.y) && time >= l.nextTick) {
                    l.nextTick = time + 1200;
                    if (state.run.hp > 1) p.hurt(1, l.cx);
                }
            } else if (kind === 'specchio' && l.holdMs > 0 && !this.ctx.getClone()) {
                // il clone morto o scaduto azzera la piastra
                l.holdMs = 0;
                this.paintPlate(l);
            }
        }
    }

    destroy(): void {
        offWorld(this.ctx.scene, 'wave-world', this.onWave, this);
        for (const l of this.live) {
            for (const z of l.barrier) z.destroy();
            for (const v of l.visuals) v.destroy();
            l.ring?.destroy();
            for (const li of l.lights) this.ctx.lighting.remove(li);
        }
        this.live = [];
        this.solids.destroy();
    }

    private onWave(ev: WaveWorldEvent): void {
        for (const l of this.live) {
            if (l.opened || l.closing) continue;
            const kind = l.seal.kind;
            if (kind === 'rimbalzo' || kind === 'camino') continue;
            if (kind === 'cortina') {
                if (ev.wave === 'scivolata' && intersectsArea(ev.area, doorRect(l.seal.door))) this.open(l);
            } else if (kind === 'risonanza') {
                if (ev.wave !== 'risonante' || !intersectsArea(ev.area, doorRect(l.seal.door))) continue;
                // l'eco è corta: si sente ovattata e non basta, onda e piena sì
                if ((ev.level ?? 0) >= 1) {
                    this.open(l);
                } else if (this.ctx.scene.time.now - l.lastFx > 500) {
                    l.lastFx = this.ctx.scene.time.now;
                    sfx.bubble();
                }
            } else if (kind === 'specchio') {
                // solo il gemello conta: il corpo del geco non apre niente
                if (ev.wave !== 'riflesso' || !this.ctx.getClone()) continue;
                if (!intersectsArea(ev.area, this.plateRect(l))) {
                    l.holdMs = 0;
                    this.paintPlate(l);
                    continue;
                }
                const now = this.ctx.scene.time.now;
                l.holdMs = now - l.lastHit > 400 ? 200 : l.holdMs + (now - l.lastHit);
                l.lastHit = now;
                this.paintPlate(l);
                if (l.holdMs >= 650) this.open(l);
            } else if (kind === 'resina') {
                if (ev.wave === 'acquatossica' && intersectsArea(ev.area, doorRect(l.seal.door))) this.open(l);
            } else if (kind === 'miasma') {
                // l'acqua tossica purifica la nube: la bottiglia o la pozza
                if (ev.wave === 'acquatossica' && intersectsArea(ev.area, this.cloudRect(l.seal))) this.open(l);
            } else if (kind === 'teorema') {
                // apre solo la q.e.d.: i tick dell'analisi non emettono niente
                if (ev.wave === 'analisi' && intersectsArea(ev.area, doorRect(l.seal.door))) this.open(l);
            } else if (kind === 'ricevitore') {
                if (ev.wave !== 'scudo' || !intersectsArea(ev.area, this.lensRect(l))) continue;
                if ((ev.level ?? 1) === 2) {
                    // il perfetto manda in overload: luce, scossa e si apre
                    l.closing = true;
                    sfx.perfectDing();
                    this.ctx.scene.cameras.main.shake(200, 0.004);
                    const flash = this.ctx.scene.add.circle(l.cx, l.cy, 30, 0xffffff, 0.9).setDepth(7);
                    this.ctx.scene.tweens.add({ targets: flash, alpha: 0, scale: 2.2, duration: 800, onComplete: () => flash.destroy() });
                    this.ctx.scene.time.delayedCall(450, () => this.open(l));
                } else if (this.ctx.scene.time.now - l.lastFx > 400) {
                    // il rimando normale lampeggia rosso e non apre
                    l.lastFx = this.ctx.scene.time.now;
                    sfx.clang();
                    const blush = this.ctx.scene.add.circle(l.cx, l.cy, 26, 0xef4444, 0.7).setDepth(7);
                    this.ctx.scene.tweens.add({ targets: blush, alpha: 0, duration: 300, onComplete: () => blush.destroy() });
                }
            }
        }
    }

    private plateRect(l: LiveSeal): Phaser.Geom.Rectangle {
        return new Phaser.Geom.Rectangle(l.cx - 38, l.cy - 38, 76, 76);
    }

    private lensRect(l: LiveSeal): Phaser.Geom.Rectangle {
        return new Phaser.Geom.Rectangle(l.cx - 24, l.cy - 24, 48, 48);
    }

    private cloudRect(seal: AbilitySeal): Phaser.Geom.Rectangle {
        const r = doorRect(seal.door);
        if (seal.door.axis === 'h') return new Phaser.Geom.Rectangle(r.left - 64, r.top, r.width + 128, r.height);
        return new Phaser.Geom.Rectangle(r.left, r.top - 64, r.width, r.height + 128);
    }

    private rewardPx(seal: AbilitySeal): { x: number; y: number } {
        return { x: (seal.reward.c + 0.5) * TILE, y: seal.reward.r * TILE - 10 };
    }

    /** nicchia vera già verificata: il premio è quello del cancello, non se ne aggiunge un altro */
    private hasPhysicalGate(seal: AbilitySeal): boolean {
        return !!this.ctx.layout?.abilityGates?.some(
            (g) => g.room === seal.room && g.reward.c === seal.reward.c && g.reward.r === seal.reward.r,
        );
    }

    private paintRing(l: LiveSeal): void {
        l.ring?.destroy();
        const g = this.ctx.scene.add.graphics().setDepth(5);
        g.lineStyle(3, l.ringLit ? 0x4ade80 : 0x475569, 0.9);
        g.strokeCircle(l.cx, l.cy, 42);
        l.ring = g;
    }

    private paintPlate(l: LiveSeal): void {
        if (!l.plate) return;
        const r = this.plateRect(l);
        l.plate.clear();
        l.plate.lineStyle(3, 0xa5f3fc, 0.9);
        l.plate.strokeRect(r.left, r.top, r.width, r.height);
        l.plate.fillStyle(0xa5f3fc, Math.min(0.55, (l.holdMs / 650) * 0.55));
        l.plate.fillRect(r.left, r.top, r.width, r.height);
    }

    private build(seal: AbilitySeal): LiveSeal {
        const { scene, lighting } = this.ctx;
        const kind = seal.kind;
        const physical = kind === 'rimbalzo' || kind === 'camino';
        const rect = doorRect(seal.door);
        const prize = this.rewardPx(seal);
        const cx = physical ? prize.x : rect.centerX;
        const cy = physical ? prize.y : rect.centerY;
        const color = SEAL_COLORS[kind];
        const live: LiveSeal = {
            seal, opened: false, closing: false, cx, cy,
            markX: cx, markY: (physical ? prize.y : rect.top) - (physical ? 44 : 18),
            barrier: [], visuals: [], lights: [], mark: null, plate: null, ring: null,
            ringLit: state.hasAbility(seal.ability),
            holdMs: 0, lastHit: 0, nextTick: 0, lastFx: 0, baseX: 0,
        };
        const light = lighting.static(cx, cy, color, physical ? 150 : 170, 0.8);
        live.lights.push(light);
        if (WALLED.has(kind)) {
            // la barriera nega la porta al geco soltanto: clone e proiettili passano
            const zone = scene.add.zone(rect.centerX, rect.centerY, Math.max(8, rect.width), Math.max(8, rect.height));
            scene.physics.add.existing(zone, true);
            this.solids.add(zone);
            live.barrier.push(zone);
        }
        if (kind === 'cortina') {
            const g = scene.add.graphics().setDepth(5);
            for (let x = rect.left; x < rect.right; x += 12) {
                g.fillStyle(x / 12 % 2 < 1 ? 0x22d3ee : 0xc084fc, 0.55);
                g.fillRect(x, rect.top, 6, rect.height);
            }
            live.visuals.push(g);
            scene.tweens.add({ targets: g, alpha: 0.65, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        } else if (kind === 'risonanza') {
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
        } else if (kind === 'specchio') {
            const g = scene.add.graphics().setDepth(5);
            g.fillStyle(0xa5f3fc, 0.22);
            g.fillRect(rect.left, rect.top, rect.width, rect.height);
            g.lineStyle(2, 0xe2e8f0, 0.7);
            g.lineBetween(rect.left, rect.top, rect.left + rect.width, rect.top + rect.height);
            live.visuals.push(g);
            const plate = scene.add.graphics().setDepth(5);
            live.plate = plate;
            live.visuals.push(plate);
            this.paintPlate(live);
        } else if (kind === 'miasma') {
            const cloud = this.cloudRect(seal);
            const g = scene.add.graphics().setDepth(4);
            g.fillStyle(0x3f6212, 0.5);
            g.fillEllipse(cloud.centerX, cloud.centerY, cloud.width, cloud.height);
            g.fillStyle(0xa3e635, 0.25);
            g.fillEllipse(cloud.centerX - 20, cloud.centerY - 10, cloud.width / 2, cloud.height / 2);
            live.visuals.push(g);
            // il premio sotto vetro: si vede ma non si tocca, finché la nube resta
            const glass = scene.add.image(prize.x, prize.y, 'cuore').setDepth(5).setTint(0x334155).setAlpha(0.85);
            live.visuals.push(glass);
        } else if (kind === 'rimbalzo' || kind === 'camino') {
            // graffi e pennarello verde sulla nicchia: la geometria è la prova
            const g = scene.add.graphics().setDepth(5);
            g.lineStyle(2, kind === 'camino' ? 0xfb923c : 0x4ade80, 0.8);
            for (let i = -1; i <= 1; i++) {
                g.lineBetween(cx + i * 10 - 4, cy - 40, cx + i * 10 + 4, cy + 10);
            }
            live.visuals.push(g);
            this.paintRing(live);
        } else if (kind === 'resina') {
            const g = scene.add.graphics().setDepth(5);
            g.fillStyle(0x67e8a0, 0.45);
            g.fillRect(rect.left, rect.top, rect.width, rect.height);
            g.lineStyle(2, 0xecfdf5, 0.9);
            g.lineBetween(rect.left + 4, rect.bottom - 4, rect.left + rect.width - 10, rect.top + 4);
            live.visuals.push(g);
            const tag = scene.add.text(cx, cy, 'PREMIUM', {
                fontFamily: '"Martian Mono", monospace', fontSize: '11px', color: '#ecfdf5',
            }).setOrigin(0.5).setDepth(6).setAngle(rect.width < rect.height ? -90 : 0);
            live.visuals.push(tag);
        } else if (kind === 'teorema') {
            const g = scene.add.graphics().setDepth(5);
            g.fillStyle(0x60a5fa, 0.4);
            g.fillRect(rect.left, rect.top, rect.width, rect.height);
            g.lineStyle(3, 0xf8fafc, 0.9);
            for (let i = 0; i < 3; i++) {
                const y = cy - 16 + i * 16;
                g.lineBetween(cx - 14, y, cx + 14, y);
            }
            live.visuals.push(g);
        } else if (kind === 'ricevitore') {
            const g = scene.add.graphics().setDepth(5);
            g.lineStyle(3, 0xef4444, 0.9);
            g.strokeCircle(cx, cy, 24);
            g.fillStyle(0xef4444, 0.5);
            g.fillCircle(cx, cy, 10);
            g.lineStyle(2, 0xef4444, 0.6);
            g.lineBetween(cx, cy + 24, cx, rect.bottom);
            live.visuals.push(g);
            const rec = scene.add.text(cx + 34, cy - 30, 'REC', {
                fontFamily: '"Martian Mono", monospace', fontSize: '11px', color: '#64748b',
            }).setOrigin(0.5).setDepth(6);
            live.visuals.push(rec);
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
        const fading = [...l.visuals, ...(l.ring ? [l.ring] : []), ...(l.mark ? [l.mark] : [])];
        l.visuals = [];
        l.ring = null;
        l.mark = null;
        l.plate = null;
        scene.tweens.add({ targets: fading, alpha: 0, duration: 320, onComplete: () => fading.forEach((v) => v.destroy()) });
        // traguardo di geometria vera: il premio è già lì, non se ne aggiunge un altro
        const traguardo = (l.seal.kind === 'rimbalzo' || l.seal.kind === 'camino') && this.hasPhysicalGate(l.seal);
        if (!traguardo) {
            const key = `sigillo-premio-${l.seal.id}`;
            const { x: px, y: py } = this.rewardPx(l.seal);
            const prize = l.seal.prize;
            if (prize.kind === 'barre') this.ctx.giveBarre(px, py, prize.amount, key);
            else if (prize.kind === 'cuore') this.ctx.giveHeart(px, py, key);
            else if (prize.kind === 'tacca') this.ctx.giveNotch(px, py, key);
            else this.ctx.giveItem(px, py, prize.item, key);
        }
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
