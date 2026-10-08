import Phaser from 'phaser';
import { FLASHBACKS } from '../content/flashbacks';
import { bus } from '../core/events';
import { matchesAction } from '../input/actions';
import { sfx } from '../audio/sfx';
import { softFail } from '../core/softFail';
import { state } from '../core/state';
import { music } from '../audio/music';
import { acoustics } from '../audio/acoustics';
import { ui } from '../ui/dom';
import { ensureCreature } from '../art/creatures';
import { VortexPipeline, hexToTint } from '../art/fx/VortexPipeline';
import { MemoryPipeline } from '../art/fx/MemoryPipeline';
import { rng } from '../core/rng';

/* Flashback come mini-film, v5. Il palco è il livello vero: la camera
   inquadra un punto accanto al geco, il buio cala sul resto, gli attori
   recitano nel mondo con la sua luce. Alla fine il geco torna esattamente
   dov'era e com'era: niente restart, niente reset. */

const CAST_TEXTURE: Record<string, string> = {
    lametta: 'npc-lametta',
    pedro: 'boss-pedrino',
    ivan: 'npc-ivan',
    bus: 'boss-guggu',
    geco: 'player',
    occhio: 'enemy-telecamera',
    stagista: 'npc-studente',
    realm: 'enemy-ricordo',
    piema: 'npc-piema',
    limite: 'boss-limite',
};

/** altezza palco per attore: nessuno copre mai l'altro */
const CAST_H: Record<string, number> = {
    lametta: 150, pedro: 96, ivan: 132, bus: 96, geco: 72,
    occhio: 64, stagista: 106, realm: 80, piema: 140, limite: 110,
};

type Gesture = 'passa-carta' | 'versa' | 'dipinge' | 'spinge' | 'saluta' | 'registra' | 'conclude' | 'spegne' | 'riscrive' | 'salva' | 'gira-foglio';

interface Scope {
    objs: Phaser.GameObjects.GameObject[];
    timers: Phaser.Time.TimerEvent[];
}

interface Ctx {
    cx: number;
    floorY: number;
    tint: number;
}

/** cosa il film chiede alla scena che lo ospita: la scena di gioco lo implementa, la galleria no */
export interface FilmHost {
    readonly folk?: { setSuspended(v: boolean): void };
    readonly enemyGroup?: Phaser.GameObjects.Group;
    readonly vignette?: Phaser.FX.Vignette | null;
    setPropsVisible?(v: boolean): void;
    findFlatStage?(x: number, y: number): { x: number; y: number } | null;
}

export class FlashbackManager {
    private playing = false;

    get isPlaying(): boolean {
        return this.playing;
    }

    play(scene: Phaser.Scene, player: Phaser.GameObjects.Sprite, id: string, onEnd?: () => void, opts?: { markSeen?: boolean; host?: FilmHost }): void {
        const fb = FLASHBACKS[id];
        if (!fb || this.playing) {
            onEnd?.();
            return;
        }
        const gesture = fb.gesture as Gesture;
        const seen = state.save.seenDialogues.includes(`fb-${id}`);
        this.playing = true;
        // 3 inquadrature che si leggono senza fretta e senza lag: ~17s di film.
        // più la voragine in ingresso e in uscita: tutto dura ~19s.
        const speed = seen ? 0.7 : 1;
        const shotDur = [5500 * speed, 5200 * speed, 6000 * speed];
        const filmDur = shotDur[0]! + shotDur[1]! + shotDur[2]!;
        const ENTER = 1400 * (seen ? 0.8 : 1);
        const EXIT = 900;
        const dur = ENTER + filmDur + EXIT;
        // l'audio si sveglia qui: sfx sopra si arrangia da solo se manca
        acoustics.resume();
        const canAudio = !!acoustics.context();
        // il film è l'unica cosa accesa: hud e scritte di gioco spariscono
        document.body.classList.add('film');
        // comparse e nemici escono di scena: il ricordo è solo suo
        const host: FilmHost = opts?.host ?? {};
        host.folk?.setSuspended(true);
        host.setPropsVisible?.(false);
        const hiddenFoes: Phaser.GameObjects.Sprite[] = [];
        for (const child of host.enemyGroup?.getChildren() ?? []) {
            const e = child as Phaser.GameObjects.Sprite;
            if (e.active && e.visible) {
                e.setVisible(false);
                hiddenFoes.push(e);
            }
        }

        // --- il mondo trattiene il fiato: il geco resta dov'è, congelato ---
        const godPrev = state.godMode;
        state.godMode = true;
        const pbody = player.body as Phaser.Physics.Arcade.Body | null;
        const home = { x: player.x, y: player.y, vx: pbody?.velocity.x ?? 0, vy: pbody?.velocity.y ?? 0 };
        (player as unknown as { stun: (ms: number) => void }).stun?.(dur + 800);
        pbody?.setVelocity(0, 0);
        const wasVisible = player.visible;
        player.setVisible(false);
        music.setGraveDuck(true);
        // tappeto: solo lo swell. niente whoosh, niente respiri.
        if (canAudio) {
            acoustics.swell(Math.min(dur, 2600), 0.85);
        }

        const cam = scene.cameras.main;
        const W = cam.width;
        const H = cam.height;
        // palco in un tratto piano dello stesso livello: il bioma resta,
        // gli attori non finiscono dentro un muro o addosso al boss
        const flat = host.findFlatStage?.(player.x, player.y) ?? null;
        const facing = (player as unknown as { facing?: number }).facing ?? 1;
        const sx = flat ? flat.x : player.x + facing * 260;
        const floorY = flat ? flat.y : player.y + 24;
        const ctx: Ctx = { cx: sx, floorY, tint: fb.tint };
        this.ensureTextures(scene);
        this.ensurePipelines(scene);

        // sala buia a tutto schermo: sta ferma al centro dello schermo, niente buchi
        const dark = scene.add.rectangle(W / 2, H / 2, W * 2.2, H * 2.2, 0x030304, 0).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(150);
        const dip = scene.add.rectangle(W / 2, H / 2, W * 2.2, H * 2.2, 0x000000, 0).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(190);
        const syncFrame = (): void => {
            // coordinate schermo, non mondo: con scrollfactor 0 il mondo sposta fuori vista
            dark.setPosition(W / 2, H / 2);
            dip.setPosition(W / 2, H / 2);
        };
        scene.events.on(Phaser.Scenes.Events.UPDATE, syncFrame);
        // letterbox nel dom: immune alla camera per costruzione
        const barTop = document.createElement('div');
        barTop.id = 'film-bar-top';
        const barBot = document.createElement('div');
        barBot.id = 'film-bar-bot';
        ui().append(barTop, barBot);
        // uscire al menu a metà film: il ricordo non deve sopravvivere alla scena
        const onShutdown = (): void => {
            for (const tm of timers) {
                tm.remove(false);
            }
            restoreGlobals();
        };
        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, onShutdown);
        // occhio di bue sul palco: alone caldo più luce vera per gli attori
        const dressing: Phaser.GameObjects.GameObject[] = [];
        const spotGlow = scene.add.image(sx, floorY - 110, 'fb-glow').setDisplaySize(460, 340)
            .setTint(0xffe2ae).setAlpha(0.5).setDepth(159);
        spotGlow.setBlendMode(Phaser.BlendModes.ADD);
        dressing.push(spotGlow);
        let spotLight: Phaser.GameObjects.Light | null = null;
        spotLight = scene.lights.addLight(sx, floorY - 110, 340, 0xffe2ae, 1.15);
        const clearDressing = (): void => {
            for (const o of dressing) {
                o.destroy();
            }
            dressing.length = 0;
            if (spotLight) {
                scene.lights.removeLight(spotLight);
                spotLight = null;
            }
        };
        // la vignetta del livello si spegne e poi torna: clear() la distruggeva per sempre
        const gameVignette = host.vignette ?? null;
        const gameVigShape = gameVignette ? { radius: gameVignette.radius, strength: gameVignette.strength } : null;
        let filmVignette: Phaser.FX.Vignette | null = null;
        // le post pipeline delle camere ignorano controller.active: raggio enorme e forza zero la rendono neutra
        if (gameVignette) {
            gameVignette.radius = 10;
            gameVignette.strength = 0;
        }
        filmVignette = cam.postFX.addVignette(0.5, 0.5, 0.72, 0.42);
        const zoomFrom = cam.zoom;
        const timers: Phaser.Time.TimerEvent[] = [];
        const later = (ms: number, fn: () => void): void => {
            timers.push(scene.time.delayedCall(ms, () => {
                // un tempo fallito non ferma il film
                try { fn(); } catch (e) { softFail('film', e); }
            }));
        };

        // --- il tornado in ingresso: lo shader avvita il frame live, poi il nero ---
        scene.tweens.add({ targets: dark, alpha: 0.97, duration: ENTER * 0.6, ease: 'Quad.easeOut' });
        // la camera lascia il geco e inquadra il palco
        cam.stopFollow();
        cam.pan(sx, floorY - 130, ENTER, 'Quad.easeInOut');
        // due scosse in crescendo mentre tutto stringe verso il centro
        cam.shake(ENTER * 0.55, 0.004);
        later(ENTER * 0.55, () => {
            cam.shake(ENTER * 0.4, 0.008);
        });
        cam.zoomTo(zoomFrom * 1.7, ENTER - 100, 'Quad.easeIn');
        cam.rotateTo(0.22, false, ENTER - 100, 'Quad.easeIn');
        let vortexPipe: VortexPipeline | null = null;
        let memoryPipe: MemoryPipeline | null = null;
        try {
            vortexPipe = this.vortex(scene, fb.tint, 0, 1, ENTER - 100);
        } catch { vortexPipe = null; }
        // saltando durante l'ingresso il primo vortice resta appeso: va tolto alla fine
        const enterVortex = vortexPipe;
        if (!vortexPipe) {
            // senza WebGL niente shader: almeno le scie (mai più le righe)
            this.warp(scene, fb.tint, 'in', ENTER - 100);
        }
        later(80, () => {
            sfx.death('eco');
            sfx.rumble();
        });
        later(ENTER - 180, () => {
            cam.fadeOut(180, 0, 0, 0);
        });

        // --- sottotitoli (si accendono dopo la voragine) ---
        const cap = document.createElement('div');
        cap.id = 'flashback-caption';
        cap.style.opacity = '0';
        document.body.appendChild(cap);

        // --- regia: 3 inquadrature con stacco ---
        const builders = SHOTS[gesture];
        let scope: Scope = this.fresh();

        const cutTo = (i: number): void => {
            this.clearScope(scene, scope);
            scope = this.fresh();
            builders[i]!(this, scene, scope, ctx, canAudio, shotDur[i] ?? 1400);
        };

        // inquadratura 1 dopo il nero del tornado
        later(ENTER, () => {
            if (vortexPipe) cam.removePostPipeline(vortexPipe);
            memoryPipe = this.memory(scene, fb.tint);
            cam.setZoom(zoomFrom);
            cam.rotateTo(0, true, 150);
            cutTo(0);
            cam.fadeIn(260, 0, 0, 0);
            cam.zoomTo(zoomFrom * 1.06, filmDur);
            showCap(0);
        });
        // stacchi con dip-to-black
        let t = ENTER + shotDur[0]!;
        for (let i = 1; i < 3; i++) {
            const at = t;
            const idx = i;
            later(at - 90, () => scene.tweens.add({ targets: dip, alpha: 1, duration: 90 }));
            later(at + 90, () => {
                cutTo(idx);
                scene.tweens.add({ targets: dip, alpha: 0, duration: 140 });
            });
            t += shotDur[i]!;
        }
        // didascalie: una per inquadratura, il punch con l'ultima
        const showCap = (i: number): void => {
            if (!cap.isConnected || !fb.captions[i]) return;
            cap.style.opacity = '0';
            scene.time.delayedCall(260, () => {
                if (cap.isConnected && fb.captions[i]) {
                    cap.textContent = fb.captions[i]!;
                    cap.style.opacity = '1';
                }
            });
        };
        const t1 = ENTER + shotDur[0]!;
        const t2 = ENTER + shotDur[0]! + shotDur[1]!;
        later(t1 + 220, () => showCap(1));
        // punch sull'ultima didascalia, dentro l'ultima inquadratura
        later(t2 + shotDur[2]! * 0.4, () => {
            if (!cap.isConnected) return;
            cam.flash(110, 255, 250, 235);
            cam.shake(150, 0.0032);
            const z = cam.zoom;
            cam.zoomTo(z * 1.04, 220);
            if (gesture === 'saluta') sfx.chime(0, 1);
            else sfx.heartbeat();
            showCap(2);
        });

        let done = false;
        const finish = (): void => {
            if (done) return;
            done = true;
            document.body.classList.remove('film');
            scene.events.off(Phaser.Scenes.Events.UPDATE, syncFrame);
            window.removeEventListener('keydown', skip);
            for (const tm of timers) {
                tm.remove(false);
            }
            this.clearScope(scene, scope);
            if (cap.isConnected) cap.remove();
            // la seppia cade prima che il ricordo si riavvita: l'uscita lavora sui colori veri
            if (memoryPipe) cam.removePostPipeline(memoryPipe);
            memoryPipe = null;
            // --- il tornado in uscita: il ricordo si riavvita e risputa fuori ---
            sfx.death('tecnodrone');
            // saltando, lo zoom lento del film girava ancora: ignorava l'uscita e restava a 1.06 dopo la fine
            cam.zoomEffect.reset();
            cam.rotateToEffect.reset();
            cam.panEffect.reset();
            cam.shake(EXIT * 0.5, 0.005);
            cam.zoomTo(cam.zoom * 1.5, EXIT * 0.45, 'Quad.easeIn');
            cam.rotateTo(-0.5, false, EXIT * 0.45, 'Quad.easeIn');
            try {
                vortexPipe = this.vortex(scene, fb.tint, 0.45, 1, EXIT * 0.5);
            } catch { vortexPipe = null; }
            if (!vortexPipe) {
                this.warp(scene, fb.tint, 'out', EXIT * 0.5);
            }
            scene.time.delayedCall(EXIT * 0.55, () => {
                cam.fadeOut(220, 0, 0, 0);
            });
            scene.time.delayedCall(EXIT * 0.55 + 240, () => {
                for (const tm of timers) {
                    tm.remove(false);
                }
                for (const o of [dark, dip]) {
                    o.destroy();
                }
                for (const p of [enterVortex, vortexPipe]) if (p) cam.removePostPipeline(p);
                if (filmVignette) cam.postFX.remove(filmVignette);
                if (gameVignette && gameVigShape) {
                    gameVignette.radius = gameVigShape.radius;
                    gameVignette.strength = gameVigShape.strength;
                }
                cam.zoomEffect.reset();
                cam.rotateToEffect.reset();
                cam.setZoom(zoomFrom);
                cam.rotateTo(0, false, 200);
                cam.fadeIn(380, 0, 0, 0);
                restoreGlobals();
                // il geco torna esattamente dov'era e com'era
                player.setPosition(home.x, home.y);
                pbody?.setVelocity(home.vx, home.vy);
                (player as unknown as { wake?: () => void }).wake?.();
                if (wasVisible) player.setVisible(true);
                cam.startFollow(player, true, 0.12, 0.12);
                clearDressing();
                host.folk?.setSuspended(false);
                host.setPropsVisible?.(true);
                for (const e of hiddenFoes) {
                    if (e.active) e.setVisible(true);
                }
                bus.emit('toast', { text: '' });
                onEnd?.();
            });
        };

        // in pausa il tasto serve al menu, non al film
        const skip = (e: KeyboardEvent): void => {
            if (!scene.sys.isActive()) return;
            if (e.code === 'Enter' || matchesAction(e, 'jump') || matchesAction(e, 'attack') || matchesAction(e, 'interact')) finish();
        };
        window.addEventListener('keydown', skip);
        timers.push(scene.time.delayedCall(ENTER + filmDur + 150, () => {
            finish();
        }));
        cap.addEventListener('click', () => {
            if (scene.sys.isActive()) finish();
        });

        let restored = false;
        const restoreGlobals = (): void => {
            if (restored) return;
            restored = true;
            this.playing = false;
            document.body.classList.remove('film');
            scene.events.off(Phaser.Scenes.Events.UPDATE, syncFrame);
            scene.events.off(Phaser.Scenes.Events.SHUTDOWN, onShutdown);
            window.removeEventListener('keydown', skip);
            cap.remove();
            barTop.remove();
            barBot.remove();
            music.setGraveDuck(false);
            state.godMode = godPrev;
        };

        if (!seen && opts?.markSeen !== false) {
            state.save.seenDialogues.push(`fb-${id}`);
            state.persist();
        }
    }

    // ---------- infrastructure ----------

    private fresh(): Scope {
        return { objs: [], timers: [] };
    }

    /** metti in scena: nel mondo con tutti, profondità data, tracciato per la pulizia */
    put<T extends Phaser.GameObjects.GameObject>(scope: Scope, o: T, depth: number): T {
        (o as unknown as { setScrollFactor: (v: number) => void }).setScrollFactor(1);
        (o as unknown as { setDepth: (v: number) => void }).setDepth(depth);
        scope.objs.push(o);
        return o;
    }

    after(scope: Scope, scene: Phaser.Scene, ms: number, fn: () => void): void {
        scope.timers.push(scene.time.delayedCall(ms, () => {
            try { fn(); } catch (e) { softFail('film', e); }
        }));
    }

    loop(scope: Scope, scene: Phaser.Scene, delay: number, fn: () => void): void {
        scope.timers.push(scene.time.addEvent({
            delay, loop: true,
            callback: () => {
                try { fn(); } catch (e) { softFail('film', e); }
            },
        }));
    }

    private clearScope(scene: Phaser.Scene, scope: Scope): void {
        for (const tm of scope.timers) {
            tm.remove(false);
        }
        for (const o of scope.objs) {
            scene.tweens.killTweensOf(o);
            o.destroy();
        }
        scope.objs.length = 0;
        scope.timers.length = 0;
    }

    /** passata come classe, phaser istanzia solo una pipeline post registrata: senza, vortice e seppia non partivano mai */
    private ensurePipelines(scene: Phaser.Scene): void {
        // in canvas non ci sono pipeline: restano le scie di ripiego
        const pipelines = (scene.renderer as Phaser.Renderer.WebGL.WebGLRenderer).pipelines;
        if (!pipelines) return;
        pipelines.addPostPipeline('VortexPipeline', VortexPipeline);
        pipelines.addPostPipeline('MemoryPipeline', MemoryPipeline);
    }

    /** texture condivise: solo l'alone, il resto è il livello vero. una volta sola. */
    private ensureTextures(scene: Phaser.Scene): void {
        if (!scene.textures.exists('fb-glow')) {
            // alone morbido per luna e presenze: nucleo pieno che svanisce
            const t = scene.textures.createCanvas('fb-glow', 128, 128)!;
            const c = t.getContext();
            const g = c.createRadialGradient(64, 64, 4, 64, 64, 64);
            g.addColorStop(0, 'rgba(255,255,255,0.9)');
            g.addColorStop(0.35, 'rgba(255,255,255,0.28)');
            g.addColorStop(1, 'rgba(255,255,255,0)');
            c.fillStyle = g;
            c.fillRect(0, 0, 128, 128);
            t.refresh();
        }
    }

    /** attore leggibile: sprite vero, scuro ma coi tratti, alone della tinta */
    actor(scope: Scope, scene: Phaser.Scene, ctx: Ctx, name: string, dx: number, opts: { flip?: boolean; tints?: number } = {}): Phaser.GameObjects.Sprite {
        const key = CAST_TEXTURE[name] ?? 'npc-markolino';
        let tex = key;
        try { tex = ensureCreature(scene, key); } catch { tex = key; }
        const h = CAST_H[name] ?? 80;
        const s = scene.add.sprite(ctx.cx + dx, ctx.floorY, tex, 0);
        this.put(scope, s, 170);
        const fh = s.height || 48;
        const fw = s.width || 48;
        const sc = Math.min(h / fh, (name === 'bus' ? 210 : 130) / fw);
        s.setScale(sc);
        s.setY(ctx.floorY - s.displayHeight / 2 + 6);
        // niente tinta scura: gli attori vivono della luce del palco e della seppia
        if (opts.flip) {
            s.setFlipX(true);
        }
        const sh = scene.add.ellipse(s.x, ctx.floorY + 5, s.displayWidth * 0.85, 9, 0x141018, 0.55);
        this.put(scope, sh, 169);
        // in scena si dissolve, non si accende di colpo
        s.setAlpha(0);
        scene.tweens.add({ targets: s, alpha: 1, duration: 700, ease: 'Quad.easeOut' });
        scene.tweens.add({ targets: s, y: s.y - 3, duration: 1050, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        // vivi: dondolio e due fotogrammi che respirano
        scene.tweens.add({ targets: s, rotation: { from: -0.03, to: 0.03 }, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        if ((s.texture.frameTotal ?? 1) > 1) {
            let f = 0;
            this.loop(scope, scene, 420, () => {
                f = f ? 0 : 1;
                s.setFrame(f);
            });
        }
        return s;
    }

    /** entra in scena camminando: due hop + scia di polvere */
    enter(scope: Scope, scene: Phaser.Scene, ctx: Ctx, s: Phaser.GameObjects.Sprite, fromDx: number, ms: number): void {
        const toX = s.x;
        s.setX(ctx.cx + fromDx);
        scene.tweens.add({ targets: s, x: toX, duration: ms, ease: 'Quad.easeOut' });
        for (let i = 0; i < 3; i++) {
            this.after(scope, scene, (ms / 3) * i, () => {
                scene.tweens.add({ targets: s, y: s.y - 9, duration: 130, yoyo: true, ease: 'Quad.easeOut' });
                this.puff(scope, scene, s.x, ctx.floorY, 0x9a8c72, 3);
            });
        }
    }

    puff(scope: Scope, scene: Phaser.Scene, x: number, y: number, tint: number, n = 8): void {
        const p = scene.add.particles(x, y, 'p-dot', {
            speed: { min: 20, max: 95 }, scale: { start: 0.55, end: 0 },
            tint, lifespan: 650, quantity: n, stopAfter: n,
        });
        this.put(scope, p, 176);
        this.after(scope, scene, 850, () => p.destroy());
    }

    /** pulviscolo in luce: tiene viva l'aria per tutta l'inquadratura */
    private motes(scope: Scope, scene: Phaser.Scene, _ctx: Ctx, x: number, y: number, w: number, h: number, tint: number): void {
        const p = scene.add.particles(x, y, 'p-dot', {
            x: { min: -w / 2, max: w / 2 },
            y: { min: -h / 2, max: h / 2 },
            speed: { min: 4, max: 14 },
            scale: { min: 0.14, max: 0.4 },
            alpha: { min: 0.1, max: 0.4 },
            tint, lifespan: 2400, frequency: 260, quantity: 1,
        });
        this.put(scope, p, 175);
    }

    /** foschia che scorre sul palco: 'fog' se c'è, puntini se siamo in anteprima senza */
    private mist(scope: Scope, scene: Phaser.Scene, x: number, y: number, alpha: number): void {
        const cam = scene.cameras.main;
        if (scene.textures.exists('fog')) {
            const f = scene.add.tileSprite(x, y, cam.width + 80, 120, 'fog').setAlpha(alpha);
            this.put(scope, f, 178);
            this.loop(scope, scene, 60, () => { f.tilePositionX += 0.9; });
        } else {
            const p = scene.add.particles(x, y, 'p-dot', {
                x: { min: -cam.width / 2, max: cam.width / 2 },
                speed: { min: 6, max: 18 }, scale: { min: 0.4, max: 1.1 },
                alpha: { min: 0.04, max: 0.12 }, tint: 0xaab4c8,
                lifespan: 3200, frequency: 300, quantity: 1,
            });
            this.put(scope, p, 178);
        }
    }

    /** il tornado è uno shader sul frame live: da `from` a `to` in `ms`.
        Ritorna la pipeline, o null se non c'è WebGL (allora il chiamante usa le scie). */
    private vortex(
        scene: Phaser.Scene, tint: number, from: number, to: number, ms: number,
    ): VortexPipeline | null {
        try {
            const cam = scene.cameras.main;
            cam.setPostPipeline(VortexPipeline);
            const got = cam.getPostPipeline(VortexPipeline) as unknown;
            const pipe = (Array.isArray(got) ? got[got.length - 1] : got) as VortexPipeline;
            if (!pipe) return null;
            pipe.tint = hexToTint(tint);
            pipe.progress = from;
            const proxy = { p: from };
            scene.tweens.add({
                targets: proxy, p: to, duration: ms,
                ease: to > from ? 'Quad.easeIn' : 'Quad.easeOut',
                onUpdate: () => {
                    pipe.progress = proxy.p;
                },
            });
            return pipe;
        } catch {
            return null;
        }
    }

    /** il ricordo ingiallisce: seppia sbiadita che sale in 700ms. null se lo shader non parte */
    private memory(scene: Phaser.Scene, tint: number): MemoryPipeline | null {
        // uno shader che non compila sulla scheda di chi gioca non deve fermare il film: resta il colore vero
        try {
            const cam = scene.cameras.main;
            cam.setPostPipeline(MemoryPipeline);
            const got = cam.getPostPipeline(MemoryPipeline) as unknown;
            const pipe = (Array.isArray(got) ? got[got.length - 1] : got) as MemoryPipeline | undefined;
            if (!pipe) return null;
            pipe.tint = hexToTint(tint);
            pipe.strength = 0;
            const mp = { s: 0 };
            scene.tweens.add({
                targets: mp, s: 1, duration: 700, ease: 'Quad.easeOut',
                onUpdate: () => {
                    pipe.strength = mp.s;
                },
            });
            return pipe;
        } catch (e) {
            softFail('film', e);
            return null;
        }
    }

    /** scie della voragine: dentro (bordi → centro) o fuori (centro → bordi) */
    private warp(scene: Phaser.Scene, tint: number, dir: 'in' | 'out', ms: number): void {
        const cam = scene.cameras.main;
        const cx = cam.width / 2;
        const cy = cam.height / 2;
        const maxR = Math.hypot(cam.width, cam.height) / 2;
        for (let i = 0; i < 14; i++) {
            const a = (Math.PI * 2 * i) / 14 + rng.fx.next() * 0.3;
            const len = 60 + rng.fx.next() * 80;
            const r = scene.add.rectangle(0, 0, len, 2 + rng.fx.next() * 2, i % 3 ? 0xffffff : tint, 0.55);
            r.setScrollFactor(0).setDepth(189).setRotation(a);
            r.setBlendMode(Phaser.BlendModes.ADD);
            const r0 = dir === 'in' ? maxR : 40;
            const r1 = dir === 'in' ? 40 : maxR;
            r.setPosition(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
            r.setAlpha(0);
            scene.tweens.add({
                targets: r, alpha: 0.6, duration: ms * 0.3,
                onComplete: () => {
                    scene.tweens.add({
                        targets: r,
                        x: cx + Math.cos(a) * r1,
                        y: cy + Math.sin(a) * r1,
                        alpha: 0, duration: ms * 0.7, ease: dir === 'in' ? 'Quad.easeIn' : 'Quad.easeOut',
                        onComplete: () => r.destroy(),
                    });
                },
            });
        }
    }

    /** stanza: intonaco + legno + lampada che flickera. ritorna la lampada. */
    room(scope: Scope, scene: Phaser.Scene, ctx: Ctx, lampX: number): void {
        // interni: il livello fa da stanza, qui solo un lume che respira male
        const lampY = ctx.floorY - 190;
        const bulb = scene.add.circle(lampX, lampY + 4, 7, 0xffd98a, 1);
        this.put(scope, bulb, 165);
        const glowC = scene.add.circle(lampX, lampY + 10, 90, 0xffc46b, 0.16);
        glowC.setBlendMode(Phaser.BlendModes.ADD);
        this.put(scope, glowC, 166);
        this.loop(scope, scene, 130, () => {
            glowC.setAlpha(0.12 + rng.fx.next() * 0.08);
            bulb.setAlpha(0.75 + rng.fx.next() * 0.25);
        });
        this.motes(scope, scene, ctx, lampX, lampY + 40, 220, 150, 0xffd98a);
    }

    /** esterno notte: cielo + luna che pulsa + dune + foschia */
    night(scope: Scope, scene: Phaser.Scene, ctx: Ctx, moonDx: number): { moon: Phaser.GameObjects.Image } {
        // esterni: il cielo vero sta dietro, qui solo luna, foschia e dune di polvere
        const moon = scene.add.image(ctx.cx + moonDx, ctx.floorY - 210, 'fb-glow').setDisplaySize(120, 120);
        this.put(scope, moon, 161);
        moon.setBlendMode(Phaser.BlendModes.ADD);
        scene.tweens.add({ targets: moon, alpha: 0.85, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.mist(scope, scene, ctx.cx, ctx.floorY + 10, 0.5);
        this.motes(scope, scene, ctx, ctx.cx, ctx.floorY - 60, 420, 200, 0xcdd6ea);
        return { moon };
    }

    /** foley: gli sfx muti da soli se il contesto manca, mai pile di errori */
    private foley(scene: Phaser.Scene, scope: Scope, ms: number, fn: () => void): void {
        this.after(scope, scene, ms, fn);
    }

    // ---------- sound design per gesto ----------

    gestureSound(scene: Phaser.Scene, scope: Scope, _canAudio: boolean, gesture: Gesture, shot: number, at0: number): void {
        const F = (ms: number, fn: () => void): void => this.foley(scene, scope, at0 + ms, fn);
        switch (gesture) {
            case 'passa-carta':
                if (shot === 0) { F(200, () => sfx.step('stone')); F(520, () => sfx.step('stone')); F(750, () => sfx.creak()); }
                if (shot === 1) { F(300, () => sfx.death('ricordo')); }
                if (shot === 2) { F(100, () => sfx.clankFar(0, 0.9)); }
                break;
            case 'gira-foglio':
                if (shot === 0) { F(200, () => sfx.step('stone')); F(520, () => sfx.step('stone')); F(750, () => sfx.creak()); }
                if (shot === 1) { F(300, () => sfx.death('ricordo')); }
                if (shot === 2) { F(100, () => sfx.clankFar(0, 0.9)); }
                break;
            case 'versa':
                if (shot === 0) { F(150, () => sfx.beep(0.4, 1)); F(600, () => sfx.bubble(0, 0.9)); }
                if (shot === 1) { F(200, () => sfx.bubble()); F(650, () => sfx.death('bottiglia')); }
                if (shot === 2) { F(100, () => sfx.beep(-0.3, 1)); F(450, () => sfx.clankFar(0, 0.8)); }
                break;
            case 'dipinge':
                if (shot === 0) { F(300, () => sfx.death('pittura')); F(800, () => sfx.death('pittura')); }
                if (shot === 1) { F(400, () => sfx.death('pittura')); }
                if (shot === 2) { F(150, () => sfx.crack()); F(600, () => sfx.death('pittura')); }
                break;
            case 'spinge':
                if (shot === 0) { F(200, () => sfx.horn(-0.4, 0.8)); F(600, () => sfx.pebble(0.3, 0.9)); }
                if (shot === 1) { F(100, () => sfx.rumble()); F(600, () => sfx.creak()); }
                if (shot === 2) { F(200, () => sfx.creak(0.3, 0.9)); F(700, () => sfx.horn(-0.5, 0.5)); }
                break;
            case 'saluta':
                if (shot === 0) { F(200, () => sfx.cricket(-0.5, 0.9)); F(650, () => sfx.cricket(0.5, 0.8)); }
                if (shot === 1) { F(400, () => sfx.cricket(0, 0.7)); F(900, () => sfx.chime(0, 0.8)); }
                if (shot === 2) { F(300, () => sfx.chime(0.2, 1)); }
                break;
            case 'registra':
                if (shot === 0) { F(250, () => sfx.beep(-0.3, 1)); F(750, () => sfx.beep(-0.3, 1)); F(1100, () => sfx.buzz(0.2, 0.7)); }
                if (shot === 1) { F(300, () => sfx.death('ricordo')); F(800, () => sfx.beep(0.3, 0.9)); }
                if (shot === 2) { F(150, () => sfx.buzz(0, 1)); F(650, () => sfx.death('tecnodrone')); }
                break;
            case 'conclude':
                if (shot === 0) { F(300, () => sfx.death('ricordo')); F(800, () => sfx.rumble()); }
                if (shot === 1) { F(300, () => sfx.buzz(-0.2, 0.8)); F(750, () => sfx.crack()); }
                if (shot === 2) { F(100, () => sfx.crack()); }
                break;
            case 'spegne':
                if (shot === 0) { F(300, () => sfx.buzz(-0.3, 0.6)); F(800, () => sfx.beep(0.2, 0.8)); }
                if (shot === 1) { F(400, () => sfx.beep(0.2, 0.5)); F(900, () => sfx.creak(-0.2, 0.6)); }
                if (shot === 2) { F(200, () => sfx.clankFar(0, 1)); }
                break;
            case 'riscrive':
                if (shot === 0) { F(250, () => sfx.step('stone')); F(700, () => sfx.creak(-0.2, 0.7)); }
                if (shot === 1) { F(200, () => sfx.death('ricordo')); F(900, () => sfx.death('pittura')); }
                if (shot === 2) { F(300, () => sfx.creak(0.2, 0.8)); F(700, () => sfx.clankFar(0, 0.6)); }
                break;
            case 'salva':
                if (shot === 0) { F(250, () => sfx.cricket(-0.4, 0.5)); F(800, () => sfx.death('pittura')); }
                if (shot === 1) { F(500, () => sfx.chime(0, 0.7)); }
                if (shot === 2) { F(200, () => sfx.beep(0, 0.8)); F(800, () => sfx.chime(0.2, 1)); }
                break;
        }
    }
}

// ---------- i film: 3 inquadrature ciascuno ----------
// ogni builder riceve (mgr, scene, scope, ctx, canAudio, shotDur) e riempie scope.

type ShotBuilder = (
    mgr: FlashbackManager,
    scene: Phaser.Scene,
    scope: Scope,
    ctx: Ctx,
    canAudio: boolean,
    shotDur: number,
) => void;

const SHOTS: Record<Gesture, ShotBuilder[]> = {
    /* lametta passa il foglio a pedro. ore 03:58. */
    'passa-carta': [
        (mgr, scene, scope, ctx, canAudio) => {
            mgr['room'](scope, scene, ctx, ctx.cx - 150);
            const desk = scene.add.rectangle(ctx.cx - 60, ctx.floorY - 22, 150, 14, 0x3a2a1a, 1);
            mgr['put'](scope, desk, 163);
            for (let i = 0; i < 3; i++) {
                const p = scene.add.rectangle(ctx.cx - 90 + i * 26, ctx.floorY - 32, 20, 26, 0xe6dcc4, 1).setRotation((i - 1) * 0.14);
                mgr['put'](scope, p, 164);
            }
            const lam = mgr['actor'](scope, scene, ctx, 'lametta', -160);
            mgr['enter'](scope, scene, ctx, lam, -340, 950);
            const ped = mgr['actor'](scope, scene, ctx, 'pedro', 150, { flip: true });
            scene.tweens.add({ targets: ped, y: ped.y - 2, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            mgr['gestureSound'](scene, scope, canAudio, 'passa-carta', 0, 0);
        },
        (mgr, scene, scope, ctx, canAudio) => {
            mgr['room'](scope, scene, ctx, ctx.cx + 120);
            const lam = mgr['actor'](scope, scene, ctx, 'lametta', -70);
            const ped = mgr['actor'](scope, scene, ctx, 'pedro', 90, { flip: true });
            const paper = scene.add.rectangle(lam.x + 34, ctx.floorY - 62, 24, 32, 0xf5efe0, 1).setStrokeStyle(1.5, 0x3a3128, 1);
            mgr['put'](scope, paper, 172);
            scene.tweens.add({ targets: paper, x: ped.x - 20, rotation: 0.16, duration: 800, ease: 'Quad.easeInOut' });
            scene.tweens.add({ targets: lam, x: lam.x + 26, duration: 800, ease: 'Sine.easeInOut' });
            mgr['after'](scope, scene, 820, () => mgr['puff'](scope, scene, ped.x - 20, ctx.floorY - 60, 0xf5efe0, 7));
            mgr['gestureSound'](scene, scope, canAudio, 'passa-carta', 1, 0);
        },
        (mgr, scene, scope, ctx, canAudio) => {
            mgr['room'](scope, scene, ctx, ctx.cx);
            const paper = scene.add.rectangle(ctx.cx, ctx.floorY - 70, 60, 78, 0xf5efe0, 1).setStrokeStyle(2, 0x3a3128, 1);
            mgr['put'](scope, paper, 172);
            const stamp = scene.add.text(ctx.cx, ctx.floorY - 70, 'TU', {
                fontFamily: 'Permanent Marker, cursive', fontSize: '34px', color: '#b91c1c',
            }).setOrigin(0.5).setRotation(-0.14).setScale(2.2).setAlpha(0);
            mgr['put'](scope, stamp, 173);
            scene.tweens.add({ targets: stamp, scale: 1, alpha: 1, duration: 180, ease: 'Quad.easeIn' });
            mgr['after'](scope, scene, 200, () => {
                mgr['puff'](scope, scene, ctx.cx, ctx.floorY - 70, 0xb91c1c, 10);
                scene.cameras.main.shake(130, 0.004);
            });
            const ped = mgr['actor'](scope, scene, ctx, 'pedro', 150, { flip: true });
            scene.tweens.add({ targets: ped, scale: 0.88, duration: 700 });
            mgr['gestureSound'](scene, scope, canAudio, 'passa-carta', 2, 0);
        },
    ],

    /* la mattina dopo: legge il foglio a metà e lo gira a faccia in giù. */
    'gira-foglio': [
        (mgr, scene, scope, ctx, canAudio) => {
            mgr['room'](scope, scene, ctx, ctx.cx - 150);
            const desk = scene.add.rectangle(ctx.cx - 40, ctx.floorY - 22, 170, 14, 0x3a2a1a, 1);
            mgr['put'](scope, desk, 163);
            const bottle = scene.add.rectangle(ctx.cx - 100, ctx.floorY - 44, 14, 30, 0x8a7a5c, 1).setRotation(1.35);
            mgr['put'](scope, bottle, 164);
            const sheet = scene.add.rectangle(ctx.cx, ctx.floorY - 34, 46, 12, 0xe6dcc4, 1).setRotation(-0.08);
            mgr['put'](scope, sheet, 164);
            const lam = mgr['actor'](scope, scene, ctx, 'lametta', -170);
            mgr['enter'](scope, scene, ctx, lam, -350, 1000);
            // la telecamera spenta sullo sfondo: non guarda più nessuno
            const eye = mgr['actor'](scope, scene, ctx, 'occhio', 190);
            eye.setAlpha(0.45);
            mgr['gestureSound'](scene, scope, canAudio, 'gira-foglio', 0, 0);
        },
        (mgr, scene, scope, ctx, canAudio) => {
            mgr['room'](scope, scene, ctx, ctx.cx);
            const sheet = scene.add.rectangle(ctx.cx - 20, ctx.floorY - 80, 120, 90, 0xf5efe0, 1).setStrokeStyle(2, 0x3a3128, 1);
            mgr['put'](scope, sheet, 164);
            const sign = scene.add.text(ctx.cx - 20, ctx.floorY - 52, 'lametta', {
                fontFamily: 'Permanent Marker, cursive', fontSize: '20px', color: '#3a3128',
            }).setOrigin(0.5).setRotation(-0.1);
            mgr['put'](scope, sign, 165);
            const lam = mgr['actor'](scope, scene, ctx, 'lametta', -190);
            scene.tweens.add({ targets: lam, x: lam.x + 40, duration: 800, ease: 'Sine.easeInOut' });
            mgr['after'](scope, scene, 850, () => {
                scene.tweens.add({
                    targets: [sheet, sign], scaleY: 0, duration: 260, ease: 'Quad.easeIn',
                    onComplete: () => {
                        sign.setAlpha(0);
                        scene.tweens.add({ targets: sheet, scaleY: 1, duration: 260, ease: 'Quad.easeOut' });
                    },
                });
                mgr['puff'](scope, scene, sheet.x, sheet.y, 0xf5efe0, 7);
            });
            mgr['gestureSound'](scene, scope, canAudio, 'gira-foglio', 1, 0);
        },
        (mgr, scene, scope, ctx, canAudio) => {
            mgr['room'](scope, scene, ctx, ctx.cx + 120);
            const desk = scene.add.rectangle(ctx.cx, ctx.floorY - 22, 190, 14, 0x3a2a1a, 1);
            mgr['put'](scope, desk, 163);
            const back = scene.add.rectangle(ctx.cx, ctx.floorY - 34, 46, 12, 0xd9cdae, 1).setRotation(0.06);
            mgr['put'](scope, back, 164);
            const lam = mgr['actor'](scope, scene, ctx, 'lametta', -40);
            scene.tweens.add({ targets: lam, x: ctx.cx + 330, duration: 1400, ease: 'Quad.easeIn' });
            for (let i = 0; i < 2; i++) {
                mgr['after'](scope, scene, 300 + i * 400, () => {
                    mgr['puff'](scope, scene, lam.x, ctx.floorY, 0x9a8c72, 3);
                });
            }
            mgr['gestureSound'](scene, scope, canAudio, 'gira-foglio', 2, 0);
        },
    ],

    /* una boccetta in più. «domani mi libero di un pensiero.» */
    'versa': [
        (mgr, scene, scope, ctx, canAudio) => {
            mgr['room'](scope, scene, ctx, ctx.cx + 140);
            const shelfY = [ctx.floorY - 150, ctx.floorY - 108];
            shelfY.forEach((y) => {
                const sh = scene.add.rectangle(ctx.cx - 40, y, 300, 8, 0x3a2a1a, 1);
                mgr['put'](scope, sh, 163);
            });
            const cols = [0xfb923c, 0x4ade80, 0x60a5fa, 0xfb923c, 0xc084fc, 0x4ade80];
            cols.forEach((c, i) => {
                const bx = ctx.cx - 150 + i * 46;
                const by = (i < 3 ? shelfY[0]! : shelfY[1]!) - 16;
                const b = scene.add.rectangle(bx, by, 22, 30 - (i % 3) * 5, c, 0.9).setStrokeStyle(1.5, 0x141018, 1);
                mgr['put'](scope, b, 164);
                if (i === 0) {
                    const g = scene.add.circle(bx, by, 22, c, 0.2);
                    g.setBlendMode(Phaser.BlendModes.ADD);
                    mgr['put'](scope, g, 165);
                }
            });
            const counter = scene.add.rectangle(ctx.cx - 40, ctx.floorY - 18, 340, 26, 0x4a3421, 1);
            mgr['put'](scope, counter, 163);
            const st = mgr['actor'](scope, scene, ctx, 'stagista', -140);
            st.setY(ctx.floorY - st.displayHeight / 2 - 8);
            const lam = mgr['actor'](scope, scene, ctx, 'lametta', -260);
            mgr['enter'](scope, scene, ctx, lam, -380, 1000);
            mgr['gestureSound'](scene, scope, canAudio, 'versa', 0, 0);
        },
        (mgr, scene, scope, ctx, canAudio) => {
            mgr['room'](scope, scene, ctx, ctx.cx - 100);
            const bottle = scene.add.circle(ctx.cx - 40, ctx.floorY - 96, 20, 0xfb923c, 1).setStrokeStyle(3, 0x141018, 1);
            mgr['put'](scope, bottle, 172);
            const bglow = scene.add.circle(bottle.x, bottle.y, 40, 0xfb923c, 0.25);
            bglow.setBlendMode(Phaser.BlendModes.ADD);
            mgr['put'](scope, bglow, 171);
            const glass = scene.add.rectangle(ctx.cx + 60, ctx.floorY - 14, 34, 40, 0x141018, 0).setStrokeStyle(2, 0x8a7a5c, 1);
            mgr['put'](scope, glass, 172);
            const fill = scene.add.rectangle(ctx.cx + 60, ctx.floorY + 4, 28, 2, 0xfb923c, 1).setOrigin(0.5, 1);
            mgr['put'](scope, fill, 173);
            scene.tweens.add({ targets: bottle, rotation: 2.1, duration: 600, ease: 'Quad.easeIn' });
            mgr['after'](scope, scene, 620, () => {
                const stream = scene.add.particles(ctx.cx - 8, ctx.floorY - 70, 'p-dot', {
                    speed: { min: 60, max: 120 }, angle: { min: 80, max: 100 },
                    scale: { start: 0.7, end: 0.3 }, tint: 0xfb923c, lifespan: 380, frequency: 40, quantity: 1,
                });
                mgr['put'](scope, stream, 174);
                mgr['after'](scope, scene, 750, () => stream.destroy());
                scene.tweens.add({ targets: fill, height: 32, duration: 700 });
            });
            mgr['gestureSound'](scene, scope, canAudio, 'versa', 1, 0);
        },
        (mgr, scene, scope, ctx, canAudio) => {
            mgr['room'](scope, scene, ctx, ctx.cx + 60);
            const reg = scene.add.rectangle(ctx.cx - 60, ctx.floorY - 30, 90, 60, 0x2a2118, 1).setStrokeStyle(2, 0x8a7a5c, 1);
            mgr['put'](scope, reg, 163);
            const slip = scene.add.rectangle(ctx.cx - 60, ctx.floorY - 60, 46, 4, 0xf5efe0, 1);
            mgr['put'](scope, slip, 172);
            scene.tweens.add({ targets: slip, height: 96, y: ctx.floorY - 108, duration: 800, ease: 'Quad.easeOut' });
            const coin = scene.add.circle(ctx.cx + 60, ctx.floorY - 40, 12, 0xfacc15, 1).setStrokeStyle(2, 0x6b4d10, 1);
            mgr['put'](scope, coin, 172);
            scene.tweens.add({ targets: coin, y: ctx.floorY - 56, duration: 350, yoyo: true, repeat: 1, ease: 'Quad.easeOut' });
            mgr['after'](scope, scene, 700, () => mgr['puff'](scope, scene, coin.x, ctx.floorY - 40, 0xfacc15, 6));
            mgr['gestureSound'](scene, scope, canAudio, 'versa', 2, 0);
        },
    ],

    /* gli occhi un po' storti. «fidati. è arte.» */
    'dipinge': [
        (mgr, scene, scope, ctx, canAudio) => {
            mgr['room'](scope, scene, ctx, ctx.cx - 120);
            const legL = scene.add.rectangle(ctx.cx - 80, ctx.floorY - 30, 6, 90, 0x3a2a1a, 1).setRotation(0.2);
            const legR = scene.add.rectangle(ctx.cx - 20, ctx.floorY - 30, 6, 90, 0x3a2a1a, 1).setRotation(-0.2);
            mgr['put'](scope, legL, 163); mgr['put'](scope, legR, 163);
            const canvas = scene.add.rectangle(ctx.cx - 50, ctx.floorY - 84, 76, 58, 0xe9e2d0, 1).setStrokeStyle(2, 0x3a2a1a, 1);
            mgr['put'](scope, canvas, 164);
            const lam = mgr['actor'](scope, scene, ctx, 'lametta', -170);
            const ped = mgr['actor'](scope, scene, ctx, 'pedro', 130, { flip: true });
            scene.tweens.add({ targets: ped, scale: 1.06, duration: 800, yoyo: true, repeat: 1 });
            for (let i = 0; i < 3; i++) {
                mgr['after'](scope, scene, 350 + i * 330, () => {
                    const s = scene.add.rectangle(ctx.cx - 66 + i * 16, ctx.floorY - 92 + (i % 2) * 10, 14, 5, ctx.tint, 1).setRotation(0.3);
                    mgr['put'](scope, s, 165);
                    mgr['puff'](scope, scene, s.x, s.y, ctx.tint, 4);
                    scene.tweens.add({ targets: lam, x: lam.x + 8, duration: 160, yoyo: true });
                });
            }
            mgr['gestureSound'](scene, scope, canAudio, 'dipinge', 0, 0);
        },
        (mgr, scene, scope, ctx, canAudio) => {
            mgr['room'](scope, scene, ctx, ctx.cx);
            const canvas = scene.add.rectangle(ctx.cx, ctx.floorY - 92, 150, 116, 0xe9e2d0, 1).setStrokeStyle(3, 0x3a2a1a, 1);
            mgr['put'](scope, canvas, 164);
            const face = scene.add.circle(ctx.cx, ctx.floorY - 80, 30, 0xd9cdae, 1).setStrokeStyle(2, 0x3a3128, 1);
            mgr['put'](scope, face, 165);
            mgr['after'](scope, scene, 350, () => {
                const e1 = scene.add.circle(ctx.cx - 11, ctx.floorY - 86, 4, 0x3a3128, 1);
                mgr['put'](scope, e1, 166);
                mgr['puff'](scope, scene, e1.x, e1.y, 0x3a3128, 4);
            });
            mgr['after'](scope, scene, 750, () => {
                const e2 = scene.add.circle(ctx.cx + 12, ctx.floorY - 96, 4, 0x3a3128, 1);
                mgr['put'](scope, e2, 166);
                mgr['puff'](scope, scene, e2.x, e2.y, 0x3a3128, 4);
                scene.cameras.main.shake(110, 0.0025);
            });
            mgr['gestureSound'](scene, scope, canAudio, 'dipinge', 1, 0);
        },
        (mgr, scene, scope, ctx, canAudio) => {
            mgr['room'](scope, scene, ctx, ctx.cx + 40);
            const ped = mgr['actor'](scope, scene, ctx, 'pedro', 20, { flip: true });
            mgr['after'](scope, scene, 250, () => {
                const e1 = scene.add.circle(ped.x - 7, ped.y - 12, 4, 0xb91c1c, 1);
                const e2 = scene.add.circle(ped.x + 8, ped.y - 6, 4, 0xb91c1c, 1);
                mgr['put'](scope, e1, 173); mgr['put'](scope, e2, 173);
                const g1 = scene.add.circle(e1.x, e1.y, 10, 0xb91c1c, 0.3);
                const g2 = scene.add.circle(e2.x, e2.y, 10, 0xb91c1c, 0.3);
                g1.setBlendMode(Phaser.BlendModes.ADD); g2.setBlendMode(Phaser.BlendModes.ADD);
                mgr['put'](scope, g1, 172); mgr['put'](scope, g2, 172);
                scene.tweens.add({ targets: [g1, g2], alpha: 0.55, duration: 500, yoyo: true, repeat: 1 });
                ped.setTint(0x2a1420);
                mgr['puff'](scope, scene, ped.x, ped.y - 10, 0xb91c1c, 10);
            });
            mgr['gestureSound'](scene, scope, canAudio, 'dipinge', 2, 0);
        },
    ],

    /* la linea era più grande di lui. */
    'spinge': [
        (mgr, scene, scope, ctx, canAudio) => {
            mgr['night'](scope, scene, ctx, 150);
            const roof = scene.add.rectangle(ctx.cx + 90, ctx.floorY - 52, 190, 26, 0x14101c, 1).setStrokeStyle(2, 0xfacc15, 0.5);
            mgr['put'](scope, roof, 166);
            const shield = scene.add.rectangle(ctx.cx + 90, ctx.floorY - 30, 170, 22, 0x1c1626, 1);
            mgr['put'](scope, shield, 165);
            const lamp = scene.add.circle(ctx.cx + 30, ctx.floorY - 26, 5, 0x554f45, 1);
            mgr['put'](scope, lamp, 166);
            mgr['loop'](scope, scene, 900, () => {
                lamp.setAlpha(0.4 + rng.fx.next() * 0.4);
            });
            const ivan = mgr['actor'](scope, scene, ctx, 'ivan', -190);
            mgr['enter'](scope, scene, ctx, ivan, -360, 1000);
            mgr['gestureSound'](scene, scope, canAudio, 'spinge', 0, 0);
        },
        (mgr, scene, scope, ctx, canAudio) => {
            mgr['night'](scope, scene, ctx, 150);
            const bus = mgr['actor'](scope, scene, ctx, 'bus', 70, { flip: true });
            const ivan = mgr['actor'](scope, scene, ctx, 'ivan', -110);
            scene.tweens.add({ targets: ivan, x: ivan.x + 44, duration: 900, ease: 'Quad.easeOut' });
            scene.tweens.add({ targets: bus, x: bus.x + 8, duration: 900, ease: 'Quad.easeOut' });
            mgr['after'](scope, scene, 400, () => mgr['puff'](scope, scene, bus.x - 60, ctx.floorY, 0xc2a35c, 9));
            mgr['after'](scope, scene, 750, () => {
                mgr['puff'](scope, scene, bus.x - 50, ctx.floorY, 0xc2a35c, 9);
                const lamp = scene.add.circle(bus.x - 70, bus.y - 6, 7, 0xfff6d8, 1);
                mgr['put'](scope, lamp, 172);
                mgr['after'](scope, scene, 320, () => {
                    scene.tweens.add({ targets: lamp, alpha: 0.1, duration: 250 });
                });
            });
            mgr['gestureSound'](scene, scope, canAudio, 'spinge', 1, 0);
        },
        (mgr, scene, scope, ctx, canAudio) => {
            mgr['night'](scope, scene, ctx, 150);
            const bus = mgr['actor'](scope, scene, ctx, 'bus', 80, { flip: true });
            bus.setAlpha(0.85);
            const sand = scene.add.ellipse(ctx.cx + 80, ctx.floorY + 22, 230, 8, 0x8a7648, 1);
            mgr['put'](scope, sand, 167);
            scene.tweens.add({ targets: sand, height: 30, y: ctx.floorY + 10, duration: 900, ease: 'Quad.easeOut' });
            const ivan = mgr['actor'](scope, scene, ctx, 'ivan', -90);
            scene.tweens.add({ targets: ivan, y: ivan.y + 16, scaleY: 0.92, duration: 800, ease: 'Quad.easeOut' });
            mgr['after'](scope, scene, 500, () => mgr['puff'](scope, scene, ivan.x, ctx.floorY, 0xc2a35c, 8));
            mgr['gestureSound'](scene, scope, canAudio, 'spinge', 2, 0);
        },
    ],

    /* «ciao.» quattro del mattino, tutte le notti. */
    'saluta': [
        (mgr, scene, scope, ctx, canAudio) => {
            mgr['night'](scope, scene, ctx, 170);
            const wall = scene.add.rectangle(ctx.cx, ctx.floorY - 8, 480, 26, 0x2e2838, 1).setStrokeStyle(2, 0x8d8474, 0.4);
            mgr['put'](scope, wall, 166);
            const win = scene.add.rectangle(ctx.cx + 200, ctx.floorY - 120, 26, 34, 0xffc46b, 0.85);
            mgr['put'](scope, win, 164);
            mgr['loop'](scope, scene, 700, () => {
                win.setAlpha(0.6 + rng.fx.next() * 0.35);
            });
            const geco = mgr['actor'](scope, scene, ctx, 'geco', -60);
            geco.setY(ctx.floorY - 21 - geco.displayHeight / 2);
            mgr['gestureSound'](scene, scope, canAudio, 'saluta', 0, 0);
        },
        (mgr, scene, scope, ctx, canAudio) => {
            mgr['night'](scope, scene, ctx, 170);
            const wall = scene.add.rectangle(ctx.cx, ctx.floorY - 8, 480, 26, 0x2e2838, 1).setStrokeStyle(2, 0x8d8474, 0.4);
            mgr['put'](scope, wall, 166);
            const geco = mgr['actor'](scope, scene, ctx, 'geco', 60);
            geco.setY(ctx.floorY - 21 - geco.displayHeight / 2);
            const ped = mgr['actor'](scope, scene, ctx, 'pedro', -220);
            // tre saltelli fino al muro, poi su
            scene.tweens.add({ targets: ped, x: ctx.cx - 60, duration: 900, ease: 'Quad.easeOut' });
            for (let i = 0; i < 3; i++) {
                mgr['after'](scope, scene, i * 300, () => {
                    scene.tweens.add({ targets: ped, y: ped.y - 16, duration: 140, yoyo: true });
                    mgr['puff'](scope, scene, ped.x, ctx.floorY, 0x8d8474, 3);
                });
            }
            mgr['after'](scope, scene, 950, () => {
                scene.tweens.add({ targets: ped, y: ctx.floorY - 21 - ped.displayHeight / 2, duration: 350, ease: 'Quad.easeOut' });
            });
            mgr['gestureSound'](scene, scope, canAudio, 'saluta', 1, 0);
        },
        (mgr, scene, scope, ctx, canAudio) => {
            mgr['night'](scope, scene, ctx, 170);
            const wall = scene.add.rectangle(ctx.cx, ctx.floorY - 8, 480, 26, 0x2e2838, 1).setStrokeStyle(2, 0x8d8474, 0.4);
            mgr['put'](scope, wall, 166);
            const ped = mgr['actor'](scope, scene, ctx, 'pedro', -50);
            ped.setY(ctx.floorY - 21 - ped.displayHeight / 2);
            const geco = mgr['actor'](scope, scene, ctx, 'geco', 50, { flip: true });
            geco.setY(ctx.floorY - 21 - geco.displayHeight / 2);
            // stella cadente: la notte li guarda
            mgr['after'](scope, scene, 500, () => {
                const st = scene.add.rectangle(ctx.cx - 180, ctx.floorY - 220, 46, 2.5, 0xffffff, 0.9);
                mgr['put'](scope, st, 167);
                scene.tweens.add({ targets: st, x: ctx.cx - 40, y: ctx.floorY - 160, alpha: 0, duration: 600, ease: 'Quad.easeIn' });
            });
            mgr['gestureSound'](scene, scope, canAudio, 'saluta', 2, 0);
        },
    ],

    /* 41.077 secondi di te. clausola 12. */
    'registra': [
        (mgr, scene, scope, ctx, canAudio) => {
            const cam = scene.cameras.main;
            const wall = scene.add.rectangle(ctx.cx, ctx.floorY - 130, cam.width + 40, 260, 0x0a0e16, 1);
            mgr['put'](scope, wall, 160);
            wall.postFX.addBlur(0.6, 0, 0, 1);
            const cells: { r: Phaser.GameObjects.Rectangle; seed: number }[] = [];
            for (let i = 0; i < 6; i++) {
                const r = scene.add.rectangle(ctx.cx - 210 + (i % 3) * 120, ctx.floorY - (i < 3 ? 150 : 70), 104, 66, 0x101827, 1)
                    .setStrokeStyle(2, 0x22d3ee, 0.5);
                mgr['put'](scope, r, 163);
                cells.push({ r, seed: rng.fx.next() * 900 });
            }
            mgr['loop'](scope, scene, 420, () => {
                for (const c of cells) {
                    c.r.setAlpha(0.55 + rng.fx.next() * 0.45);
                }
            });
            // in uno schermo piccolo: un geco che cammina avanti e indietro
            const mini = mgr['actor'](scope, scene, ctx, 'geco', -90);
            mini.setScale(mini.scaleX * 0.55);
            mini.setY(ctx.floorY - 150 + 22);
            scene.tweens.add({ targets: mini, x: mini.x + 44, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            const rec = scene.add.circle(ctx.cx + 250, ctx.floorY - 196, 7, 0xef4444, 1);
            mgr['put'](scope, rec, 164);
            mgr['loop'](scope, scene, 480, () => {
                rec.setAlpha(rec.alpha > 0.5 ? 0.12 : 1);
            });
            mgr['gestureSound'](scene, scope, canAudio, 'registra', 0, 0);
        },
        (mgr, scene, scope, ctx, canAudio) => {
            const wall = scene.add.rectangle(ctx.cx, ctx.floorY - 130, 700, 260, 0x0a0e16, 1);
            mgr['put'](scope, wall, 160);
            const slot = scene.add.rectangle(ctx.cx, ctx.floorY - 60, 150, 10, 0x1c2636, 1);
            mgr['put'](scope, slot, 163);
            const strip = scene.add.rectangle(ctx.cx, ctx.floorY - 66, 120, 4, 0xdde6f2, 1);
            mgr['put'](scope, strip, 164);
            scene.tweens.add({ targets: strip, height: 74, y: ctx.floorY - 104, duration: 850, ease: 'Quad.easeOut' });
            mgr['after'](scope, scene, 500, () => {
                const ghost = mgr['actor'](scope, scene, ctx, 'geco', 0);
                ghost.setScale(ghost.scaleX * 0.5);
                ghost.setY(ctx.floorY - 104);
                ghost.setAlpha(0.9);
            });
            mgr['gestureSound'](scene, scope, canAudio, 'registra', 1, 0);
        },
        (mgr, scene, scope, ctx, canAudio) => {
            const wall = scene.add.rectangle(ctx.cx, ctx.floorY - 130, 700, 260, 0x0a0e16, 1);
            mgr['put'](scope, wall, 160);
            const big = scene.add.rectangle(ctx.cx, ctx.floorY - 120, 220, 140, 0x0d1420, 1).setStrokeStyle(3, 0x22d3ee, 0.7);
            mgr['put'](scope, big, 163);
            const ombra = mgr['actor'](scope, scene, ctx, 'geco', 0, { tints: 0x0a0a12 });
            ombra.setScale(0.5);
            scene.tweens.add({ targets: ombra, scale: 1.7, duration: 850, ease: 'Quad.easeIn' });
            mgr['after'](scope, scene, 700, () => {
                const e1 = scene.add.circle(ombra.x - 10, ombra.y - 14, 4, 0xef4444, 1);
                const e2 = scene.add.circle(ombra.x + 10, ombra.y - 14, 4, 0xef4444, 1);
                mgr['put'](scope, e1, 173); mgr['put'](scope, e2, 173);
                const cone = scene.add.graphics();
                cone.fillStyle(0xef4444, 0.14);
                cone.fillTriangle(ombra.x, ombra.y, ctx.cx - 260, ctx.floorY + 20, ctx.cx + 260, ctx.floorY + 20);
                mgr['put'](scope, cone, 172);
            });
            mgr['gestureSound'](scene, scope, canAudio, 'registra', 2, 0);
        },
    ],

    /* «sistemare = togliere ciò che è storto.» era tutto storto. */
    'conclude': [
        (mgr, scene, scope, ctx, canAudio) => {
            mgr['room'](scope, scene, ctx, ctx.cx + 100);
            for (let i = 0; i < 8; i++) {
                const n = scene.add.rectangle(ctx.cx - 190 + (i % 4) * 90, ctx.floorY - 140 + Math.floor(i / 4) * 60, 34, 44, 0xe6dcc4, 0.92)
                    .setRotation((Math.sin(i * 3.7) * 0.3));
                mgr['put'](scope, n, 164);
                scene.tweens.add({ targets: n, y: n.y - 6, rotation: n.rotation + 0.08, duration: 900 + i * 90, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            }
            const ped = mgr['actor'](scope, scene, ctx, 'pedro', 40, { flip: true });
            const paper = scene.add.rectangle(ped.x - 16, ped.y - 6, 26, 34, 0xf5efe0, 1).setStrokeStyle(1.5, 0x3a3128, 1);
            mgr['put'](scope, paper, 172);
            const realm = mgr['actor'](scope, scene, ctx, 'realm', 190, { flip: true });
            realm.setAlpha(0.8);
            mgr['gestureSound'](scene, scope, canAudio, 'conclude', 0, 0);
        },
        (mgr, scene, scope, ctx, canAudio) => {
            mgr['room'](scope, scene, ctx, ctx.cx);
            const grid = scene.add.graphics();
            grid.lineStyle(2, 0xb91c1c, 0.75);
            for (let i = -2; i <= 2; i++) {
                grid.lineBetween(ctx.cx - 260, ctx.floorY - 190 + i * 46, ctx.cx + 260, ctx.floorY - 190 + i * 46);
                grid.lineBetween(ctx.cx + i * 90, ctx.floorY - 200, ctx.cx + i * 70, ctx.floorY + 20);
            }
            mgr['put'](scope, grid, 164);
            scene.tweens.add({ targets: grid, rotation: 0.07, alpha: 0.55, duration: 1000, ease: 'Quad.easeIn' });
            const ped = mgr['actor'](scope, scene, ctx, 'pedro', 0, { flip: true });
            scene.tweens.add({ targets: ped, y: ped.y - 8, duration: 700, yoyo: true, repeat: 1 });
            mgr['gestureSound'](scene, scope, canAudio, 'conclude', 1, 0);
        },
        (mgr, scene, scope, ctx, canAudio) => {
            mgr['room'](scope, scene, ctx, ctx.cx - 60);
            const ped = mgr['actor'](scope, scene, ctx, 'pedro', 0, { flip: true });
            for (let i = 0; i < 6; i++) {
                mgr['after'](scope, scene, 120 + i * 110, () => {
                    scene.tweens.add({ targets: ped, x: ped.x + (i % 2 ? 7 : -7), duration: 55 });
                    ped.setTint(i % 2 ? 0xb91c1c : 0xf5efe0);
                    if (i === 5) {
                        ped.setTint(0x2b2340);
                        mgr['puff'](scope, scene, ped.x, ped.y, 0xb91c1c, 12);
                    }
                });
            }
            for (let i = 0; i < 5; i++) {
                const n = scene.add.rectangle(ctx.cx - 160 + i * 70, ctx.floorY - 120, 34, 44, 0xe6dcc4, 1).setRotation((i - 2) * 0.2);
                mgr['put'](scope, n, 164);
                mgr['after'](scope, scene, 300 + i * 120, () => {
                    scene.tweens.add({ targets: n, y: n.y + 70, alpha: 0, duration: 450, ease: 'Quad.easeIn' });
                });
            }
            mgr['gestureSound'](scene, scope, canAudio, 'conclude', 2, 0);
        },
    ],

    /* «non voglio vedere.» click. */
    'spegne': [
        (mgr, scene, scope, ctx, canAudio) => {
            const wall = scene.add.rectangle(ctx.cx, ctx.floorY - 130, 700, 260, 0x0a0e1c, 1);
            mgr['put'](scope, wall, 160);
            wall.postFX.addBlur(0.6, 0, 0, 1);
            for (let r = 0; r < 3; r++) {
                const rack = scene.add.rectangle(ctx.cx - 160 + r * 130, ctx.floorY - 90, 90, 150, 0x111a28, 1).setStrokeStyle(2, 0x22d3ee, 0.35);
                mgr['put'](scope, rack, 163);
                for (let l = 0; l < 4; l++) {
                    const led = scene.add.circle(ctx.cx - 185 + r * 130 + (l % 2) * 44, ctx.floorY - 140 + Math.floor(l / 2) * 60, 3, [0x4ade80, 0xfacc15, 0xef4444][(r + l) % 3] as number, 1);
                    mgr['put'](scope, led, 164);
                    mgr['loop'](scope, scene, 380 + ((r * 4 + l) % 5) * 120, () => {
                        led.setAlpha(led.alpha > 0.5 ? 0.1 : 1);
                    });
                }
            }
            // monitor: pedro che dorme
            const mon = scene.add.rectangle(ctx.cx + 60, ctx.floorY - 120, 130, 86, 0x0d1626, 1).setStrokeStyle(2, 0x22d3ee, 0.6);
            mgr['put'](scope, mon, 163);
            const ped = mgr['actor'](scope, scene, ctx, 'pedro', 60);
            ped.setScale(ped.scaleX * 0.55);
            ped.setRotation(1.35);
            ped.setY(ctx.floorY - 118);
            scene.tweens.add({ targets: ped, y: ped.y + 2, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            mgr['gestureSound'](scene, scope, canAudio, 'spegne', 0, 0);
        },
        (mgr, scene, scope, ctx, canAudio) => {
            const wall = scene.add.rectangle(ctx.cx, ctx.floorY - 130, 700, 260, 0x0a0e1c, 1);
            mgr['put'](scope, wall, 160);
            const mon = scene.add.rectangle(ctx.cx - 40, ctx.floorY - 120, 150, 100, 0x0d1626, 1).setStrokeStyle(2, 0x22d3ee, 0.6);
            mgr['put'](scope, mon, 163);
            const ped = mgr['actor'](scope, scene, ctx, 'pedro', -40);
            ped.setScale(ped.scaleX * 0.7);
            const lam = mgr['actor'](scope, scene, ctx, 'lametta', 220);
            mgr['enter'](scope, scene, ctx, lam, 360, 900);
            mgr['after'](scope, scene, 950, () => {
                scene.tweens.add({ targets: lam, x: lam.x - 40, duration: 400 });
            });
            mgr['gestureSound'](scene, scope, canAudio, 'spegne', 1, 0);
        },
        (mgr, scene, scope, ctx, canAudio) => {
            const wall = scene.add.rectangle(ctx.cx, ctx.floorY - 130, 700, 260, 0x0a0e1c, 1);
            mgr['put'](scope, wall, 160);
            const mon = scene.add.rectangle(ctx.cx, ctx.floorY - 120, 150, 100, 0x0d1626, 1).setStrokeStyle(2, 0x22d3ee, 0.6);
            mgr['put'](scope, mon, 163);
            const lamp = scene.add.circle(ctx.cx + 90, ctx.floorY - 170, 10, 0x9fd8ff, 1);
            mgr['put'](scope, lamp, 164);
            const lampGlow = scene.add.circle(lamp.x, lamp.y, 46, 0x9fd8ff, 0.22);
            lampGlow.setBlendMode(Phaser.BlendModes.ADD);
            mgr['put'](scope, lampGlow, 164);
            const lam = mgr['actor'](scope, scene, ctx, 'lametta', 120);
            mgr['after'](scope, scene, 350, () => {
                scene.tweens.add({ targets: [lamp, lampGlow], alpha: 0.05, duration: 180 });
                const black = scene.add.rectangle(mon.x, mon.y, 146, 96, 0x000000, 1);
                mgr['put'](scope, black, 165);
                scene.cameras.main.shake(100, 0.002);
                scene.tweens.add({ targets: lam, x: lam.x + 160, duration: 800, ease: 'Quad.easeIn' });
            });
            mgr['gestureSound'](scene, scope, canAudio, 'spegne', 2, 0);
        },
    ],
    /* giorno 42, notte. riga sette. «piema indaga sull'anomalia.» */
    'riscrive': [
        (mgr, scene, scope, ctx, canAudio) => {
            mgr['room'](scope, scene, ctx, ctx.cx + 140);
            for (let i = 0; i < 4; i++) {
                const shelf = scene.add.rectangle(ctx.cx - 200 + i * 32, ctx.floorY - 120, 26, 170, 0x2a2118, 1).setStrokeStyle(1.5, 0x141018, 1);
                mgr['put'](scope, shelf, 162);
            }
            const desk = scene.add.rectangle(ctx.cx + 40, ctx.floorY - 22, 170, 14, 0x3a2a1a, 1);
            mgr['put'](scope, desk, 163);
            const log = scene.add.rectangle(ctx.cx + 40, ctx.floorY - 36, 64, 14, 0xe6dcc4, 1).setStrokeStyle(1, 0x3a3128, 1);
            mgr['put'](scope, log, 164);
            const pie = mgr['actor'](scope, scene, ctx, 'piema', -150);
            mgr['enter'](scope, scene, ctx, pie, -340, 1000);
            mgr['gestureSound'](scene, scope, canAudio, 'riscrive', 0, 0);
        },
        (mgr, scene, scope, ctx, canAudio) => {
            mgr['room'](scope, scene, ctx, ctx.cx);
            const sheet = scene.add.rectangle(ctx.cx, ctx.floorY - 96, 300, 150, 0xe9e2d0, 1).setStrokeStyle(3, 0x3a2a1a, 1);
            mgr['put'](scope, sheet, 164);
            for (let i = 0; i < 6; i++) {
                const ln = scene.add.rectangle(ctx.cx - 10, ctx.floorY - 150 + i * 20, 240, 3, 0x6b6151, 0.55);
                mgr['put'](scope, ln, 165);
            }
            const line7 = scene.add.text(ctx.cx, ctx.floorY - 96, 'lametta ordina a pedro', {
                fontFamily: 'Martian Mono, monospace', fontSize: '15px', color: '#3a3128',
            }).setOrigin(0.5);
            mgr['put'](scope, line7, 166);
            const strike = scene.add.rectangle(ctx.cx - 120, ctx.floorY - 96, 4, 3, 0x1e3a8a, 1).setOrigin(0, 0.5);
            mgr['put'](scope, strike, 167);
            mgr['after'](scope, scene, 600, () => scene.tweens.add({ targets: strike, width: 240, duration: 500, ease: 'Quad.easeIn' }));
            mgr['after'](scope, scene, 1300, () => {
                const fix = scene.add.text(ctx.cx + 6, ctx.floorY - 120, 'piema indaga sull\'anomalia', {
                    fontFamily: 'Permanent Marker, cursive', fontSize: '16px', color: '#1d4ed8',
                }).setOrigin(0.5).setRotation(-0.04).setAlpha(0);
                mgr['put'](scope, fix, 168);
                scene.tweens.add({ targets: fix, alpha: 1, duration: 600 });
                mgr['puff'](scope, scene, fix.x, fix.y, 0x1d4ed8, 6);
            });
            mgr['gestureSound'](scene, scope, canAudio, 'riscrive', 1, 0);
        },
        (mgr, scene, scope, ctx, canAudio) => {
            mgr['room'](scope, scene, ctx, ctx.cx - 120);
            const drawer = scene.add.rectangle(ctx.cx - 90, ctx.floorY - 40, 110, 50, 0x3a2a1a, 1).setStrokeStyle(2, 0x141018, 1);
            mgr['put'](scope, drawer, 163);
            const pie = mgr['actor'](scope, scene, ctx, 'piema', -90);
            scene.tweens.add({ targets: pie, x: pie.x - 20, duration: 700, ease: 'Sine.easeInOut' });
            // dall'altra parte il socio dorme: è per lui che la riga è sparita
            const lam = mgr['actor'](scope, scene, ctx, 'lametta', 170, { flip: true });
            lam.setRotation(1.4); lam.setY(ctx.floorY - lam.displayWidth / 2 + 4);
            mgr['gestureSound'](scene, scope, canAudio, 'riscrive', 2, 0);
        },
    ],

    /* giorno 30. «sei la cosa migliore che ho disegnato.» cartella IMPORTANTE */
    'salva': [
        (mgr, scene, scope, ctx, canAudio) => {
            mgr['room'](scope, scene, ctx, ctx.cx - 60);
            const easel = scene.add.rectangle(ctx.cx - 20, ctx.floorY - 84, 90, 70, 0xe9e2d0, 1).setStrokeStyle(2, 0x3a2a1a, 1);
            mgr['put'](scope, easel, 164);
            const face = scene.add.circle(ctx.cx - 20, ctx.floorY - 84, 20, 0xd9cdae, 1).setStrokeStyle(2, 0x3a3128, 1);
            mgr['put'](scope, face, 165);
            // occhi dritti: è il ritratto buono, quello prima di tutto
            for (const dx of [-7, 7]) {
                const e = scene.add.circle(ctx.cx - 20 + dx, ctx.floorY - 88, 3, 0x3a3128, 1);
                mgr['put'](scope, e, 166);
            }
            mgr['actor'](scope, scene, ctx, 'lametta', -170);
            const ped = mgr['actor'](scope, scene, ctx, 'pedro', 150, { flip: true });
            scene.tweens.add({ targets: ped, x: ped.x - 30, duration: 1100, ease: 'Sine.easeInOut' });
            mgr['gestureSound'](scene, scope, canAudio, 'salva', 0, 0);
        },
        (mgr, scene, scope, ctx, canAudio) => {
            mgr['room'](scope, scene, ctx, ctx.cx);
            const lam = mgr['actor'](scope, scene, ctx, 'lametta', -80);
            const ped = mgr['actor'](scope, scene, ctx, 'pedro', 80, { flip: true });
            scene.tweens.add({ targets: lam, x: lam.x + 18, duration: 900, ease: 'Sine.easeInOut' });
            mgr['after'](scope, scene, 700, () => {
                const glow = scene.add.circle(ped.x, ped.y - 10, 50, ctx.tint, 0.22);
                glow.setBlendMode(Phaser.BlendModes.ADD);
                mgr['put'](scope, glow, 167);
                scene.tweens.add({ targets: glow, scale: 1.4, alpha: 0, duration: 1200 });
                scene.tweens.add({ targets: ped, scale: ped.scaleX * 1.06, duration: 500, yoyo: true });
            });
            mgr['gestureSound'](scene, scope, canAudio, 'salva', 1, 0);
        },
        (mgr, scene, scope, ctx, canAudio) => {
            mgr['room'](scope, scene, ctx, ctx.cx + 80);
            const folder = scene.add.rectangle(ctx.cx, ctx.floorY - 90, 150, 104, 0xd6a84a, 1).setStrokeStyle(3, 0x5c4214, 1);
            mgr['put'](scope, folder, 164);
            const label = scene.add.text(ctx.cx, ctx.floorY - 90, 'IMPORTANTE', {
                fontFamily: 'Permanent Marker, cursive', fontSize: '20px', color: '#3a2a10',
            }).setOrigin(0.5).setRotation(-0.05);
            mgr['put'](scope, label, 165);
            const words = scene.add.text(ctx.cx - 200, ctx.floorY - 170, 'la cosa migliore', {
                fontFamily: 'Permanent Marker, cursive', fontSize: '15px', color: '#67e8f9',
            }).setOrigin(0.5);
            mgr['put'](scope, words, 166);
            scene.tweens.add({ targets: words, x: ctx.cx, y: ctx.floorY - 96, scale: 0.4, alpha: 0.2, duration: 1100, ease: 'Quad.easeIn' });
            mgr['after'](scope, scene, 1150, () => {
                mgr['puff'](scope, scene, ctx.cx, ctx.floorY - 90, 0x67e8f9, 12);
                scene.cameras.main.shake(90, 0.002);
            });
            mgr['gestureSound'](scene, scope, canAudio, 'salva', 2, 0);
        },
    ],
};

export const flashback = new FlashbackManager();
