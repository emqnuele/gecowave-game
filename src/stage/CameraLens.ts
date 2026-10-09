import Phaser from 'phaser';
import { LensPipeline } from '../art/fx/LensPipeline';
import { bus } from '../core/events';
import { softFail } from '../core/softFail';
import { state } from '../core/state';
import { offWorld, onWorld, type WorldEvent, type WorldHandler } from '../core/worldEvents';
import { combine, coverZoom, envelope, heartbeat, isRest, type LensPart } from '../rules/lens';

/* l'obiettivo della camera: colpi brevi (un boss che cambia fase, un'esplosione),
   stati che durano (testa sott'acqua, vita al lumicino, la caccia di lochef) e
   onde d'urto. solo presentazione: non tocca la camera di phaser, quindi la parte
   di mondo inquadrata, e con lei la logica, resta quella di sempre */

interface Kick {
    lens: LensPart;
    at: number;
    attack: number;
    hold: number;
    release: number;
}

interface Hold {
    lens: LensPart;
    weight: number;
    target: number;
    /** quanto peso al secondo guadagna o perde */
    rate: number;
}

interface Ring {
    x: number;
    y: number;
    at: number;
    ms: number;
    strength: number;
}

/** un po' d'atmosfera fissa dove il posto non è del tutto reale */
const BIOME_AIR: Record<string, LensPart> = {
    mind: { wave: 0.35, chroma: 0.15 },
    memory: { desat: 0.28, tint: 0.05, tintColor: 0x8a6a3c },
    void: { chroma: 0.3, desat: 0.12 },
};

export class CameraLens {
    private readonly scene: Phaser.Scene;
    private pipe: LensPipeline | null = null;
    private kicks: Kick[] = [];
    private holds = new Map<string, Hold>();
    private ring: Ring | null = null;
    private offs: (() => void)[] = [];
    private lastNow = 0;
    private doomsday = 0;
    private nextDoomGlitchAt = 0;
    private lastHp: number;
    private readonly bossAt: () => { x: number; y: number } | null;

    constructor(scene: Phaser.Scene, biomeId: string, bossAt: () => { x: number; y: number } | null) {
        this.scene = scene;
        this.bossAt = bossAt;
        this.lastHp = state.run.hp;
        this.attach();
        const air = BIOME_AIR[biomeId];
        if (air) this.hold('bioma', air, 1, 1000);
        this.listen();
    }

    private attach(): void {
        const pipelines = (this.scene.renderer as Phaser.Renderer.WebGL.WebGLRenderer).pipelines;
        // in canvas niente shader: il gioco resta com'era
        if (!pipelines) return;
        try {
            pipelines.addPostPipeline('LensPipeline', LensPipeline);
            const cam = this.scene.cameras.main;
            cam.setPostPipeline(LensPipeline);
            const got = cam.getPostPipeline(LensPipeline) as unknown;
            this.pipe = ((Array.isArray(got) ? got[got.length - 1] : got) as LensPipeline | undefined) ?? null;
            if (this.pipe) this.pipe.active = false;
        } catch (e) {
            softFail('obiettivo', e);
            this.pipe = null;
        }
    }

    /** un colpo d'obiettivo che sale, resta e si spegne da solo */
    kick(lens: LensPart, attack: number, hold: number, release: number): void {
        this.kicks.push({ lens, at: this.scene.time.now, attack, hold, release });
    }

    /** uno stato che dura finché non lo si lascia: il peso ci arriva piano */
    hold(key: string, lens: LensPart, target = 1, rate = 3): void {
        const h = this.holds.get(key);
        if (h) {
            h.lens = lens;
            h.target = target;
            h.rate = rate;
            return;
        }
        this.holds.set(key, { lens, weight: 0, target, rate });
    }

    release(key: string, rate?: number): void {
        const h = this.holds.get(key);
        if (!h) return;
        h.target = 0;
        if (rate !== undefined) h.rate = rate;
    }

    /** onda d'urto da un punto del mondo */
    shockwave(x: number, y: number, strength: number, ms = 650): void {
        if (strength <= 0) return;
        if (this.ring && this.ring.strength > strength && this.scene.time.now - this.ring.at < this.ring.ms * 0.5) return;
        this.ring = { x, y, at: this.scene.time.now, ms, strength };
    }

    glitch(ms: number, amount: number): void {
        this.kick({ glitch: amount, chroma: amount * 0.8 }, 20, ms, 120);
    }

    /** ogni ascolto si toglie da solo: off senza funzione svuoterebbe l'evento anche per gli altri */
    private on<K extends WorldEvent>(event: K, fn: WorldHandler<K>): void {
        onWorld(this.scene, event, fn, this);
        this.offs.push(() => offWorld(this.scene, event, fn, this));
    }

    private listen(): void {
        this.on('boss-engaged', (boss) => {
            const side = boss.x < this.scene.cameras.main.midPoint.x ? -1 : 1;
            this.kick({ angle: 0.028 * side, chroma: 0.5 }, 260, 300, 1700);
        });
        this.on('boss-phase', () => {
            this.kick({ chroma: 1.2, barrel: 0.12 }, 60, 80, 520);
            const b = this.bossAt();
            if (b) this.shockwave(b.x, b.y, 1);
        });
        this.on('boss-dying', () => {
            this.kick({ desat: 0.85, zoom: 0.04, chroma: 0.4 }, 220, 1100, 1300);
        });
        this.on('boss-parried', () => {
            this.kick({ chroma: 0.8, zoom: 0.015 }, 20, 40, 220);
        });
        this.on('player-dead', () => {
            this.kick({ desat: 1, barrel: -0.12, dark: 0.45 }, 450, 2600, 600);
        });
        this.on('checkpoint', () => {
            this.kick({ tint: 0.14, tintColor: 0xffb347, desat: -0.15 }, 300, 250, 1500);
            const p = this.focus();
            this.shockwave(p.x, p.y, 0.5, 900);
        });
        this.on('enemy-explode', ({ x, y }) => {
            const p = this.focus();
            const d = Math.hypot(x - p.x, y - p.y);
            if (d < 650) this.shockwave(x, y, 0.85 * (1 - d / 650), 520);
        });
        this.on('player-risonante', ({ x, y, level }) => {
            if ((level ?? 1) >= 2) this.shockwave(x, y, 0.22 * (level ?? 1), 480);
        });
        this.offs.push(
            bus.on('hp-changed', ({ hp, hurt }) => {
                if (hurt && hp < this.lastHp) this.kick({ chroma: 0.9, pulse: 0.22 }, 30, 60, 280);
                this.lastHp = hp;
            }),
            bus.on('ability-unlocked', () => {
                const p = this.focus();
                this.shockwave(p.x, p.y, 1.3, 1100);
                this.kick({ chroma: 0.8, desat: -0.3 }, 120, 300, 1200);
            }),
            bus.on('doomsday-changed', ({ value }) => {
                this.doomsday = value;
            }),
            bus.on('ombra-read', () => {
                this.glitch(260, 0.45);
                this.kick({ desat: 0.4 }, 40, 200, 400);
            }),
        );
    }

    private focus(): { x: number; y: number } {
        const m = this.scene.cameras.main.midPoint;
        return { x: m.x, y: m.y };
    }

    /** a ogni fotogramma disegnato: legge lo stato del geco, non lo cambia */
    update(player: { x: number; y: number; headUnder: boolean; dead: boolean } | null): void {
        const now = this.scene.time.now;
        const dt = Math.min(0.1, Math.max(0, (now - this.lastNow) / 1000));
        this.lastNow = now;
        if (player) this.readPlayer(player, now);
        this.readDoomsday(now);
        if (!this.pipe) return;
        if (!state.settings.cameraFx) {
            this.pipe.active = false;
            return;
        }
        const parts: { lens: LensPart; weight: number }[] = [];
        this.kicks = this.kicks.filter((k) => {
            const t = now - k.at;
            const w = envelope(t, k.attack, k.hold, k.release);
            if (t > k.attack + k.hold + k.release) return false;
            parts.push({ lens: k.lens, weight: w });
            return true;
        });
        for (const [key, h] of this.holds) {
            const step = h.rate * dt;
            h.weight = h.weight < h.target ? Math.min(h.target, h.weight + step) : Math.max(h.target, h.weight - step);
            if (h.weight <= 0 && h.target <= 0) {
                this.holds.delete(key);
                continue;
            }
            parts.push({ lens: h.lens, weight: h.weight });
        }
        const lens = combine(parts);
        const pipe = this.pipe;
        let ringOn = false;
        if (this.ring) {
            const r = this.ring;
            const t = (now - r.at) / r.ms;
            if (t >= 1) {
                this.ring = null;
            } else {
                const v = this.scene.cameras.main.worldView;
                const sx = (r.x - v.x) / v.width;
                const sy = (r.y - v.y) / v.height;
                pipe.ring = [sx, 1 - sy, 0.05 + t * 0.85, r.strength * (1 - t) * (1 - t)];
                ringOn = true;
            }
        }
        if (!ringOn) pipe.ring = [0.5, 0.5, 0, 0];
        if (isRest(lens) && !ringOn) {
            pipe.active = false;
            return;
        }
        const cam = this.scene.cameras.main;
        if (player) {
            const v = cam.worldView;
            pipe.focus = [(player.x - v.x) / v.width, 1 - (player.y - 20 - v.y) / v.height];
        }
        pipe.lens = lens;
        pipe.coverZoom = coverZoom(lens.angle, cam.width / Math.max(1, cam.height), lens.barrel) * (1 + lens.zoom);
        pipe.time = now / 1000;
        // le righe del glitch saltano a scatti, non a ogni fotogramma
        pipe.seed = Math.floor(now / 70) % 997;
        pipe.active = true;
    }

    private readPlayer(p: { headUnder: boolean; dead: boolean }, now: number): void {
        if (p.headUnder && !p.dead) this.hold('acqua', { wave: 1, tint: 0.2, tintColor: 0x0f3a44, chroma: 0.25, desat: 0.15 }, 1, 4);
        else this.release('acqua', 3);
        const max = state.maxHp;
        const hp = state.run.hp;
        const low = !p.dead && hp > 0 && (hp <= 1 || hp / max <= 0.25);
        if (low) this.hold('vita', { pulse: 0.24 * heartbeat(now, 900), desat: 0.15 }, 1, 2);
        else this.release('vita', 2);
        // dura due capitoli, fino al fiume: un'ombra di troppo colore, niente che ondeggi
        if (state.run.trenbolone) this.hold('trenbolone', { chroma: 0.15, desat: -0.2 }, 1, 1);
        else this.release('trenbolone', 1);
        if (state.run.patto) this.hold('patto', { chroma: 0.45, desat: -0.3, glitch: 0.08 + 0.08 * Math.max(0, Math.sin(now / 430)) }, 1, 1);
        else this.release('patto', 1);
    }

    /** col doomsday che avanza il realm glitcha sempre più spesso */
    private readDoomsday(now: number): void {
        const v = this.doomsday;
        if (v < 0.35) return;
        if (now < this.nextDoomGlitchAt) return;
        const k = Math.min(1, (v - 0.35) / 0.65);
        // intervallo e durata dal tempo stesso: nessuna estrazione dal caso del gioco
        const jitter = (Math.sin(now * 0.0137) + 1) / 2;
        this.nextDoomGlitchAt = now + (14000 - 10500 * k) * (0.7 + 0.6 * jitter);
        this.glitch(120 + 200 * k * jitter, 0.35 + 0.45 * k);
    }

    destroy(): void {
        for (const off of this.offs) off();
        this.offs = [];
        // allo shutdown la camera può essere già andata: con lei se ne va anche la pipeline
        const cam = this.scene.cameras?.main;
        if (cam && this.pipe) cam.removePostPipeline(this.pipe);
        this.pipe = null;
        this.kicks = [];
        this.holds.clear();
    }
}
