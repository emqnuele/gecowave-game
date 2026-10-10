import Phaser from 'phaser';
import { bus } from '../core/events';
import type { LightingManager } from '../stage/LightingManager';
import { sfx } from '../audio/sfx';
import { state } from '../core/state';
import { checkAchievements } from '../core/achievements';
import { coop } from '../coop/runtime';
import { coopHooks } from '../coop/hooks';
import type { TrialLeg } from '../world/types';

/* la corsa contro il citelis: accanto a una fermata c'è il palo con l'orario.
   lo leggi e il bus parte: devi essere alla fermata dopo prima di lui.
   il tempo viene dal geco simulato offline (layout.trials), quindi è sempre fattibile */

export interface TrialStop {
    key: string;
    x: number;
    y: number;
}

interface Run {
    from: TrialStop;
    to: TrialStop;
    startAt: number;
    limitMs: number;
    beacon: Phaser.GameObjects.Light;
    sparks: Phaser.GameObjects.Particles.ParticleEmitter;
    /** in due corre uno solo: l'altro guarda boa e cronometro */
    runner: 'host' | 'guest';
    /** copia solo vista: non vince mai, il traguardo lo giudica l'host */
    visual: boolean;
}

export class TimeTrial {
    private scene: Phaser.Scene;
    private lighting: LightingManager;
    private regionId: string;
    private pair: { from: TrialStop; to: TrialStop; limitMs: number } | null = null;
    private run: Run | null = null;
    post: { x: number; y: number } | null = null;

    constructor(scene: Phaser.Scene, lighting: LightingManager, regionId: string) {
        this.scene = scene;
        this.lighting = lighting;
        this.regionId = regionId;
    }

    get active(): boolean {
        return !!this.run;
    }

    get flag(): string {
        return `corsa-vinta-${this.regionId}`;
    }

    /** sceglie la tratta e pianta il palo; null se nella regione non c'è una tratta giusta */
    setup(stops: TrialStop[], legs: TrialLeg[]): { x: number; y: number; range: number; onInteract: () => void } | null {
        const byId = new Map(stops.map((s) => [s.key.split(':')[1], s]));
        let best: { from: TrialStop; to: TrialStop; secs: number } | null = null;
        for (const leg of legs) {
            const from = byId.get(leg.from);
            const to = byId.get(leg.to);
            const secs = leg.frames / 60;
            if (!from || !to || secs < 9 || secs > 70) continue;
            // la tratta più lunga tra quelle ragionevoli: una corsa vera, non uno scatto
            if (!best || secs > best.secs) best = { from, to, secs };
        }
        if (!best) return null;
        // il geco simulato corre perfetto e conosce la strada: chi gioca ha un po' di margine
        const limitMs = Math.ceil(best.secs * 1.35 + 5) * 1000;
        this.pair = { from: best.from, to: best.to, limitMs };
        const x = best.from.x + 86;
        const feet = best.from.y + 30;
        this.ensureTexture();
        this.scene.add.image(x, feet + 1, 'trial-post').setOrigin(0.5, 1).setDepth(3).setPipeline('Light2D');
        this.lighting.static(x, feet - 62, 0xfde68a, 110, 0.55);
        this.post = { x, y: feet - 30 };
        return { x, y: feet - 30, range: 50, onInteract: () => this.offer() };
    }

    private offer(): void {
        const p = this.pair;
        if (!p || this.run) return;
        const best = state.save.trials[this.regionId];
        const secs = Math.round(p.limitMs / 1000);
        bus.emit('choice-show', {
            title: `orario del citelis: alla prossima fermata tra ${secs} secondi.${best ? ` il tuo record: ${(best / 1000).toFixed(1)}s.` : ''} lo prendi?`,
            options: [{ label: 'corri', danger: true }, { label: 'aspetto il prossimo' }],
            onPick: (i) => {
                if (i === 0) this.start();
            },
        });
    }

    private start(): void {
        const p = this.pair!;
        const to = p.to;
        const beacon = this.lighting.static(to.x, to.y - 40, 0xfacc15, 300, 1.3);
        const sparks = this.scene.add.particles(to.x, to.y + 20, 'p-dot', {
            x: { min: -14, max: 14 },
            speedY: { min: -260, max: -140 },
            scale: { start: 0.5, end: 0 },
            alpha: { start: 0.9, end: 0 },
            tint: 0xfacc15,
            lifespan: 1600,
            frequency: 60,
            blendMode: Phaser.BlendModes.ADD,
        }).setDepth(6);
        this.run = { from: p.from, to, startAt: this.scene.time.now, limitMs: p.limitMs, beacon, sparks, runner: coopHooks.actorKind === 'remote' ? 'guest' : 'host', visual: false };
        if (coop.isHost && coop.together) coop.session?.send('trial-run', { on: true, limitMs: p.limitMs });
        const dx = to.x - p.from.x;
        const dy = to.y - p.from.y;
        const where = [Math.abs(dx) > 200 ? (dx > 0 ? 'a destra' : 'a sinistra') : '', Math.abs(dy) > 200 ? (dy > 0 ? 'più giù' : 'più su') : '']
            .filter(Boolean).join(', ');
        sfx.unlock();
        bus.emit('toast', { text: `il citelis è partito. la fermata ${where || 'qui vicino'}: segui la luce gialla.` });
    }

    /** la corsa la giudica l'host sul gecco che l'ha partita; l'altro la guarda e basta */
    update(player: { x: number; y: number; dead: boolean }, partner?: { x: number; y: number } | null): void {
        const r = this.run;
        if (!r) return;
        const now = this.scene.time.now;
        const left = r.limitMs - (now - r.startAt);
        bus.emit('trial-timer', { left: Math.max(0, left), total: r.limitMs });
        if (r.visual) {
            if (left <= 0) this.stop();
            return;
        }
        // chi corre è caduto o è uscito: la corsa finisce, non resta appesa col cronometro fermo
        const runner = r.runner === 'guest' ? partner ?? null : player.dead ? null : player;
        if (!runner) {
            this.stop();
            return;
        }
        if (Math.abs(runner.x - r.to.x) < 90 && Math.abs(runner.y - r.to.y) < 100) {
            const ms = now - r.startAt;
            this.stop();
            this.win(ms);
            return;
        }
        if (left <= 0) {
            this.stop();
            sfx.hurt();
            bus.emit('toast', { text: 'il citelis passa, suona il clacson e non si ferma. riprova dal palo.' });
        }
    }

    /** l'ospite accende boa e cronometro: vincere tocca all'host */
    visualRun(limitMs: number): void {
        const p = this.pair;
        if (!p || this.run || !Number.isFinite(limitMs) || limitMs <= 0) return;
        const to = p.to;
        const beacon = this.lighting.static(to.x, to.y - 40, 0xfacc15, 300, 1.3);
        const sparks = this.scene.add.particles(to.x, to.y + 20, 'p-dot', {
            x: { min: -14, max: 14 },
            speedY: { min: -260, max: -140 },
            scale: { start: 0.5, end: 0 },
            alpha: { start: 0.9, end: 0 },
            tint: 0xfacc15,
            lifespan: 1600,
            frequency: 60,
            blendMode: Phaser.BlendModes.ADD,
        }).setDepth(6);
        this.run = { from: p.from, to, startAt: this.scene.time.now, limitMs: Math.min(120000, limitMs), beacon, sparks, runner: 'guest', visual: true };
    }

    private win(ms: number): void {
        const first = !state.hasFlag(this.flag);
        const prev = state.save.trials[this.regionId];
        if (!prev || ms < prev) state.save.trials[this.regionId] = ms;
        const t = `${(ms / 1000).toFixed(1)}s`;
        if (first) {
            state.setFlag(this.flag);
            state.save.barre += 150;
            bus.emit('barre-changed', { barre: state.save.barre, gained: true });
            bus.emit('toast', { text: `preso al volo in ${t}. l'autista ti regala il resto: +150 barre.` });
        } else {
            bus.emit('toast', { text: !prev || ms < prev ? `nuovo record: ${t}.` : `${t}. il record resta ${(prev / 1000).toFixed(1)}s.` });
        }
        state.persist();
        sfx.checkpoint();
        checkAchievements();
    }

    stop(): void {
        const r = this.run;
        if (!r) return;
        this.lighting.remove(r.beacon);
        r.sparks.destroy();
        this.run = null;
        bus.emit('trial-timer', null);
        if (!r.visual && coop.isHost && coop.together) coop.session?.send('trial-run', { on: false, limitMs: 0 });
    }

    private ensureTexture(): void {
        if (this.scene.textures.exists('trial-post')) return;
        const g = this.scene.add.graphics();
        const W = 34;
        const H = 96;
        // palo storto a inchiostro con l'orologio della linea in cima
        g.fillStyle(0x0b0c10, 1);
        g.fillRect(W / 2 - 2.5, 30, 5, H - 30);
        g.fillRect(W / 2 - 8, H - 4, 16, 4);
        g.fillStyle(0x1c1917, 1);
        g.fillCircle(W / 2, 17, 15);
        g.lineStyle(2.5, 0x0b0c10, 1);
        g.strokeCircle(W / 2, 17, 15);
        g.lineStyle(1.5, 0xfde68a, 0.9);
        g.strokeCircle(W / 2, 17, 11.5);
        for (let k = 0; k < 12; k++) {
            const a = (k / 12) * Math.PI * 2;
            g.lineBetween(W / 2 + Math.cos(a) * 9, 17 + Math.sin(a) * 9, W / 2 + Math.cos(a) * 11, 17 + Math.sin(a) * 11);
        }
        g.lineStyle(2, 0xfde68a, 1);
        g.lineBetween(W / 2, 17, W / 2, 9);
        g.lineBetween(W / 2, 17, W / 2 + 6, 20);
        // cartello con la linea
        g.fillStyle(0xfacc15, 0.85);
        g.fillRect(W / 2 + 2, 40, 14, 9);
        g.lineStyle(1.5, 0x0b0c10, 1);
        g.strokeRect(W / 2 + 2, 40, 14, 9);
        g.generateTexture('trial-post', W, H);
        g.destroy();
    }
}
