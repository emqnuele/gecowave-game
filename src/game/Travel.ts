import Phaser from 'phaser';
import { TILE } from '../config';
import { HUB_STOP, LEVEL_ORDER, LEVELS } from '../content/levels';
import { TOASTS } from '../content/story';
import { propArt } from '../engine/art/props';
import { bus } from '../engine/events';
import { sfx } from '../engine/sfx';
import { state } from '../engine/state';
import type { GameContext, GameSystem, SceneData } from './context';
import type { Interactable } from './Interactions';
import { emitWorld } from '../engine/worldEvents';

type TravelCtx = Pick<GameContext, 'scene' | 'world' | 'player' | 'lighting' | 'interactions' | 'npcs' | 'bosses' | 'chapter' | 'flow'>;

/** microfoni, fermate del citelis e varchi: dove si salva e da dove si parte */
export class Travel implements GameSystem {
    /** le fermate del capitolo: nessuno ci piazza sopra trappole o meccaniche */
    readonly busStops: { key: string; x: number; y: number }[] = [];
    private readonly checkpointSprites = new Map<string, Phaser.GameObjects.Sprite>();
    /** microfoni e pali che spariscono durante i film */
    private readonly propDressing: { img: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image; light: Phaser.GameObjects.Light | null; glow: number }[] = [];
    private readonly ctx: TravelCtx;
    private readonly scene: Phaser.Scene;

    constructor(ctx: TravelCtx) {
        this.ctx = ctx;
        this.scene = ctx.scene;
    }

    private micKey(cpId: string): string {
        return `mic-${this.ctx.world.def.id}-${cpId}`;
    }

    /** accanto a ogni microfono una fermata del citelis: si scopre passando, da lì si viaggia */
    spawnBusStops(): void {
        for (const cp of this.ctx.world.level.checkpoints) {
            const art = propArt(this.ctx.world.biome, 'busstop', 0);
            if (!this.scene.textures.exists(art.id)) this.scene.textures.addCanvas(art.id, art.canvas);
            const sx = cp.x + 58;
            const sy = cp.y + TILE / 2;
            const pole = this.scene.add.image(sx, sy + 1, art.id).setOrigin(0.5, 1).setDepth(3).setPipeline('Light2D');
            const glow = this.ctx.lighting.static(sx, sy - 70, 0xfacc15, 150, 0.7);
            this.propDressing.push({ img: pole, light: glow, glow: 0.7 });
            const key = `${this.ctx.world.def.id}:${cp.id}`;
            this.busStops.push({ key, x: sx, y: sy - 30 });
            this.ctx.interactions.add({ x: sx, y: sy - 30, range: 56, onInteract: () => this.openTravel(key) });
        }
    }

    /** durante i film restano solo roccia e attori: si spengono i servizi */
    setPropsVisible(v: boolean): void {
        for (const p of this.propDressing) {
            if (p.img.active) p.img.setVisible(v);
            if (p.light) p.light.intensity = v ? p.glow : 0;
        }
    }

    updateBusStops(): void {
        for (const s of this.busStops) {
            if (state.save.stops.includes(s.key)) continue;
            if (Math.abs(this.ctx.player.x - s.x) < 140 && Math.abs(this.ctx.player.y - s.y) < 110) {
                state.save.stops.push(s.key);
                state.persist();
                bus.emit('toast', { text: 'fermata del citelis scoperta. da qui si viaggia ({k:interact} sul palo).' });
            }
        }
    }

    private openTravel(current: string): void {
        if (this.ctx.flow.exiting || this.ctx.bosses.current?.engaged || this.ctx.chapter.pursuer?.()) {
            bus.emit('toast', { text: 'il citelis non si ferma con qualcuno che ti insegue.' });
            return;
        }
        if (!state.save.stops.includes(current)) state.save.stops.push(current);
        // dopo guggu il citelis porta anche in piazza, da qualsiasi fermata
        if (state.hasFlag('boss-down-guggu') && !state.save.stops.includes(HUB_STOP)) state.save.stops.push(HUB_STOP);
        const order = [...Object.keys(LEVELS).filter((k) => LEVELS[k].hub), ...LEVEL_ORDER, ...Object.keys(LEVELS).filter((k) => !LEVEL_ORDER.includes(k) && !LEVELS[k].hub)];
        const stops = state.save.stops
            .map((key) => {
                const [levelId, cpId] = key.split(':');
                return { key, levelId, cpId };
            })
            .filter((s) => LEVELS[s.levelId])
            .sort((a, b) => order.indexOf(a.levelId) - order.indexOf(b.levelId) || Number(a.cpId.split('-')[1]) - Number(b.cpId.split('-')[1]))
            .map((s, i, all) => {
                const n = all.filter((o, j) => o.levelId === s.levelId && j <= i).length;
                const label = LEVELS[s.levelId].hub ? `capolinea ${LEVELS[s.levelId].accentWord}` : `${LEVELS[s.levelId].accentWord} · fermata ${n}`;
                return { key: s.key, levelId: s.levelId, label };
            });
        bus.emit('travel-show', { stops, current, onPick: (key) => this.travelTo(key) });
    }

    /** viaggio col citelis: si scende alla fermata scelta, accanto al suo microfono */
    private travelTo(key: string): void {
        const [levelId, cpId] = key.split(':');
        if (!LEVELS[levelId]) return;
        sfx.dash();
        bus.emit('toast', { text: 'sali sul citelis. convalidare, prego.' });
        this.ctx.flow.exiting = true;
        state.portalReturn = null;
        state.save.levelId = levelId;
        state.save.checkpointId = cpId;
        state.persist();
        sfx.stopPad();
        this.scene.cameras.main.fadeOut(450, 0, 0, 0);
        this.scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.scene.restart({ levelId, checkpointId: cpId, showCard: levelId !== this.ctx.world.def.id } satisfies SceneData);
        });
    }

    spawnCheckpoints(): void {
        for (const cp of this.ctx.world.level.checkpoints) {
            const mic = this.ctx.npcs.castSprite(cp.x, cp.y - 12, 'mic').setDepth(4);
            this.checkpointSprites.set(cp.id, mic);
            let glow: Phaser.GameObjects.Light | null = null;
            let level = 0;
            const used = state.save.collectedLore.includes(this.micKey(cp.id));
            if (state.save.checkpointId === cp.id) {
                mic.setTint(0x4ade80);
                glow = this.ctx.lighting.static(cp.x, cp.y - 20, 0x4ade80, 160, 0.8);
                level = 0.8;
            } else if (used) {
                mic.setTint(0x64748b).setAlpha(0.55);
            }
            this.propDressing.push({ img: mic, light: glow, glow: level });
            // checkpoints are one-time use
            if (used) continue;
            const entry: Interactable = {
                x: cp.x, y: cp.y, range: 60,
                onInteract: () => this.activateCheckpoint(cp.id, mic, entry),
            };
            this.ctx.interactions.add(entry);
        }
    }

    spawnPortal(x: number, y: number, to: string, needsFlag?: string, label?: string): void {
        const unlocked = !needsFlag || state.hasFlag(needsFlag);
        const portal = this.scene.add.sprite(x, y - 8, 'portal').setDepth(5);
        if (!unlocked) {
            // varco spento: si intravede appena finché non scatta la condizione
            portal.setAlpha(0.16).setTint(0x445544);
            this.ctx.interactions.add({
                x, y: y - 8, range: 60,
                onInteract: () => bus.emit('toast', { text: TOASTS.portalLocked }),
            });
            return;
        }
        this.ctx.lighting.follow(portal, to === 'barrato' ? 0xfacc15 : 0x4ade80, 220, 1.0);
        this.scene.tweens.add({ targets: portal, scaleX: { from: 0.92, to: 1.08 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.scene.tweens.add({ targets: portal, angle: { from: -3, to: 3 }, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.scene.add.particles(x, y - 8, 'p-dot', {
            scale: { start: 0.4, end: 0 },
            alpha: { start: 0.6, end: 0 },
            tint: to === 'barrato' ? 0xfacc15 : 0x4ade80,
            speed: { min: 10, max: 40 },
            lifespan: 1000,
            frequency: 120,
        }).setDepth(4);
        const hintShown = `portal-hint-${to}`;
        if (!state.hasFlag(hintShown)) {
            state.setFlag(hintShown);
            this.scene.time.delayedCall(900, () => bus.emit('toast', {
                text: to === 'barrato' ? TOASTS.portalBarrato : TOASTS.portalCustode,
            }));
        }
        this.ctx.interactions.add({
            x, y: y - 8, range: 58,
            onInteract: () => {
                if (this.ctx.flow.exiting) return;
                bus.emit('choice-show', {
                    title: `un varco verso ${label ?? to}. ci entri?`,
                    options: [{ label: `entra: ${label ?? to}` }, { label: 'resta qui' }],
                    onPick: (i) => {
                        if (i !== 0 || this.ctx.flow.exiting) return;
                        state.portalReturn = { levelId: this.ctx.world.def.id, x, y };
                        bus.emit('toast', { text: `entri nel varco: ${label ?? to}.` });
                        this.ctx.flow.gotoLevel(to);
                    },
                });
            },
        });
    }

    private activateCheckpoint(id: string, mic: Phaser.GameObjects.Sprite, entry: Interactable): void {
        state.save.collectedLore.push(this.micKey(id));
        state.save.levelId = this.ctx.world.def.id;
        state.save.checkpointId = id;
        state.persist();
        state.run.hp = state.maxHp;
        emitWorld(this.scene, 'checkpoint', { id, levelId: this.ctx.world.def.id });
        sfx.checkpoint();
        this.ctx.interactions.remove(entry);
        this.checkpointSprites.forEach((m, mid) => {
            if (mid === id) return;
            if (state.save.collectedLore.includes(this.micKey(mid))) {
                m.setTint(0x64748b).setAlpha(0.55);
            } else {
                m.clearTint();
            }
        });
        mic.setTint(0x4ade80);
        bus.emit('hp-changed', { hp: state.run.hp, maxHp: state.maxHp, hurt: false });
        bus.emit('toast', { text: TOASTS.checkpoint });
        const lit = this.scene.add.particles(mic.x, mic.y - 10, 'p-spark', {
            speed: { min: 60, max: 180 },
            scale: { start: 0.8, end: 0 },
            tint: 0x4ade80,
            lifespan: 500,
            quantity: 16,
            stopAfter: 16,
        });
        this.scene.time.delayedCall(900, () => lit.destroy());
    }


    destroy(): void {}
}
