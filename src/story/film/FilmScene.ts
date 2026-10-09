import Phaser from 'phaser';
import { FILMS } from '../../content/films';
import { FLASHBACKS } from '../../content/flashbacks';
import { ensureCreature } from '../../art/creatures';
import { MemoryPipeline } from '../../art/fx/MemoryPipeline';
import { hexToTint } from '../../art/fx/VortexPipeline';
import { sfx } from '../../audio/sfx';
import { softFail } from '../../core/softFail';
import { rng } from '../../core/rng';
import { matchesAction } from '../../input/actions';
import { ui } from '../../ui/dom';
import { buildSet, calendarTexture, propTexture, SET_H, type SetPlan } from './sets';
import { STAGE_W, type Action, type ActorDef, type CastName, type Frame, type SfxCue } from './types';

const CAST_TEXTURE: Record<CastName, string> = {
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
    ombra: 'player',
};

// le proporzioni del cast restano quelle dei vecchi film
const CAST_H: Record<CastName, number> = {
    lametta: 168, pedro: 110, ivan: 150, bus: 120, geco: 70,
    occhio: 64, stagista: 120, realm: 84, piema: 156, limite: 124, ombra: 70,
};

const VOICE: Partial<Record<CastName, { hz: number; color: string }>> = {
    lametta: { hz: 150, color: '#c4a0ff' },
    pedro: { hz: 340, color: '#7ad8ff' },
    ivan: { hz: 120, color: '#ffd870' },
    stagista: { hz: 260, color: '#9ae0a0' },
    piema: { hz: 190, color: '#9ab8ff' },
    geco: { hz: 420, color: '#b8f0a0' },
};

export interface FilmData {
    id: string;
    // un ricordo già visto si guarda più in fretta
    quick: boolean;
    onEnd: () => void;
    /** in due chi guarda il film dell'altro non lo salta: lo chiude chi l'ha aperto */
    follow?: boolean;
}

class Actor {
    readonly sprite: Phaser.GameObjects.Sprite;
    readonly shadow: Phaser.GameObjects.Sprite;
    readonly who: CastName;
    private readonly scale: number;
    private walkLoop: Phaser.Time.TimerEvent | null = null;
    private readonly still: boolean;
    readonly light: Phaser.GameObjects.Light | null = null;

    private readonly scene: FilmScene;

    constructor(scene: FilmScene, def: ActorDef) {
        this.scene = scene;
        this.who = def.who;
        const key = CAST_TEXTURE[def.who];
        let tex = key;
        // un attore senza disegno non deve fermare il film: resta il segnaposto
        try { tex = ensureCreature(scene, key); } catch (e) { softFail('film', e); }
        const s = scene.add.sprite(def.x, def.y ?? 0, tex, 0).setOrigin(0.5, 1).setDepth(20);
        const h = def.h ?? CAST_H[def.who];
        this.scale = h / (s.height || 48);
        s.setScale(this.scale).setPipeline('Light2D').setRotation(def.rot ?? 0).setDepth(def.depth ?? 20);
        if (def.who === 'ombra') s.setTintFill(0x050408);
        else if (def.tint !== undefined) s.setTint(def.tint);
        this.still = !!def.still;
        if (def.glow !== undefined) this.light = scene.lights.addLight(s.x, s.y - h / 2, h * 2.4, def.glow, def.hidden ? 0 : 1.6);
        s.setFlipX((def.face ?? 1) === -1);
        this.sprite = s;
        // l'ombra sul muro: è lei che fa il cinema, gli attori sono piccoli
        this.shadow = scene.add.sprite(s.x, s.y, tex, 0).setOrigin(0.5, 1).setDepth(5).setTintFill(0x050408).setAlpha(0.42);
        if (def.hidden) {
            s.setAlpha(0);
            this.shadow.setVisible(false);
        }
        if (this.still) return;
        // respiro: niente sta mai fermo del tutto in un film
        scene.tweens.add({ targets: s, scaleY: this.scale * 1.025, duration: 1400 + rng.fx.next() * 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    syncShadow(key: { x: number; y: number }): void {
        const s = this.sprite;
        if (this.light) this.light.setPosition(s.x, s.y - s.displayHeight / 2).setIntensity(1.6 * s.alpha);
        this.shadow.setVisible(!this.still && s.visible && s.alpha > 0.05);
        this.shadow.setAlpha(0.42 * s.alpha);
        this.shadow.setFrame(s.frame.name);
        this.shadow.setFlipX(s.flipX);
        const k = 1.6;
        this.shadow.setScale(s.scaleX * k, s.scaleY * k);
        this.shadow.setRotation(s.rotation);
        // la luce è davanti e in alto: l'ombra si allunga sul muro dalla parte opposta
        this.shadow.setPosition(s.x + (s.x - key.x) * 0.45, s.y - 16 + (s.y - key.y) * 0.06);
    }

    hand(): { x: number; y: number } {
        const s = this.sprite;
        return { x: s.x + (s.flipX ? -1 : 1) * s.displayWidth * 0.32, y: s.y - s.displayHeight * 0.48 };
    }

    face(dir: 1 | -1): void {
        this.sprite.setFlipX(dir === -1);
    }

    walk(to: number, ms: number): void {
        const s = this.sprite;
        this.face(to >= s.x ? 1 : -1);
        this.scene.tweens.add({ targets: s, x: to, duration: ms, ease: 'Sine.easeInOut' });
        const frames = s.texture.frameTotal - 1;
        let n = 0;
        this.walkLoop?.remove(false);
        this.walkLoop = this.scene.time.addEvent({
            delay: 210,
            repeat: Math.max(0, Math.floor(ms / 210) - 1),
            callback: () => {
                n++;
                if (frames > 1) s.setFrame(n % 2);
                this.scene.tweens.add({ targets: s, y: s.y - 5, duration: 100, yoyo: true, ease: 'Quad.easeOut' });
                if (n % 2) this.scene.cue('passo');
            },
        });
        this.scene.time.delayedCall(ms, () => {
            if (frames > 1) s.setFrame(0);
        });
    }

    hop(): void {
        this.scene.tweens.add({ targets: this.sprite, y: this.sprite.y - 14, duration: 140, yoyo: true, ease: 'Quad.easeOut' });
    }

    nod(): void {
        const dir = this.sprite.flipX ? -1 : 1;
        this.scene.tweens.add({ targets: this.sprite, rotation: 0.16 * dir, duration: 180, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
    }

    lean(angle: number, ms: number): void {
        const dir = this.sprite.flipX ? -1 : 1;
        this.scene.tweens.add({ targets: this.sprite, rotation: angle * dir, duration: ms, ease: 'Sine.easeInOut' });
    }

    shiver(ms: number): void {
        const x = this.sprite.x;
        const ev = this.scene.time.addEvent({
            delay: 40,
            repeat: Math.floor(ms / 40),
            callback: () => this.sprite.setX(x + (rng.fx.next() - 0.5) * 6),
        });
        this.scene.time.delayedCall(ms + 50, () => {
            ev.remove(false);
            this.sprite.setX(x);
        });
    }

    fade(to: number, ms: number): void {
        this.scene.tweens.add({ targets: this.sprite, alpha: to, duration: ms, ease: 'Quad.easeOut' });
    }

    move(x: number | undefined, y: number | undefined, ms: number): void {
        this.scene.tweens.add({ targets: this.sprite, x: x ?? this.sprite.x, y: y ?? this.sprite.y, duration: ms, ease: 'Sine.easeInOut' });
    }

    rescale(by: number, ms: number): void {
        this.scene.tweens.killTweensOf(this.sprite);
        this.scene.tweens.add({ targets: this.sprite, scaleX: this.sprite.scaleX * by, scaleY: this.sprite.scaleY * by, duration: ms, ease: 'Sine.easeIn' });
    }
}

export class FilmScene extends Phaser.Scene {
    private film!: FilmData;
    private plan!: SetPlan;
    private actors = new Map<string, Actor>();
    private props = new Map<string, Phaser.GameObjects.Image>();
    private lightsById = new Map<string, Phaser.GameObjects.Light>();
    private baseIntensity = new Map<string, number>();
    private setImage!: Phaser.GameObjects.Image;
    private veil!: Phaser.GameObjects.Rectangle;
    private clockText: Phaser.GameObjects.Text | null = null;
    private screens = new Map<string, Phaser.GameObjects.Rectangle>();
    private line: HTMLDivElement | null = null;
    private bars: HTMLDivElement[] = [];
    private ending = false;
    private k = 1;
    private glowList: { img: Phaser.GameObjects.Image; light: Phaser.GameObjects.Light }[] = [];
    // dove guarda la macchina: il tremolio della pellicola si aggiunge sopra, senza spostarla
    private eye = { x: 0, y: 0, z: 1, r: 0 };
    private onKey = (e: KeyboardEvent): void => {
        if (this.film.follow) return;
        if (e.code === 'Enter' || matchesAction(e, 'jump') || matchesAction(e, 'attack') || matchesAction(e, 'interact')) this.end(260);
    };

    constructor() {
        super('FilmScene');
    }

    init(data: FilmData): void {
        this.film = data;
        this.actors = new Map();
        this.props = new Map();
        this.lightsById = new Map();
        this.baseIntensity = new Map();
        this.screens = new Map();
        this.clockText = null;
        this.line = null;
        this.bars = [];
        this.ending = false;
        this.glowList = [];
        this.eye = { x: 0, y: 0, z: 1, r: 0 };
        this.k = data.quick ? 0.8 : 1;
    }

    create(): void {
        const script = FILMS[this.film.id];
        const fb = FLASHBACKS[this.film.id];
        if (!script || !fb) {
            this.finish();
            return;
        }
        this.scene.bringToTop();
        const cam = this.cameras.main;
        cam.setBackgroundColor(0x000000);
        const { key, plan } = buildSet(this, script.set, script.mood);
        this.plan = plan;
        this.setImage = this.add.image(0, -SET_H, key).setOrigin(0, 0).setDepth(0).setPipeline('Light2D');
        this.lights.enable().setAmbientColor(plan.ambient);
        for (const l of plan.lights) {
            this.lightsById.set(l.id, this.lights.addLight(l.x, l.y, l.radius, l.color, l.intensity));
            this.baseIntensity.set(l.id, l.intensity);
        }
        this.time.addEvent({
            delay: 90, loop: true,
            callback: () => {
                for (const l of plan.lights) {
                    if (!l.flicker) continue;
                    const light = this.lightsById.get(l.id);
                    const base = this.baseIntensity.get(l.id) ?? l.intensity;
                    if (light) light.setIntensity(base * (0.9 + rng.fx.next() * 0.14));
                }
            },
        });
        if (plan.clock && script.clock) {
            this.clockText = this.add.text(plan.clock.x, plan.clock.y, script.clock, { fontFamily: 'monospace', fontSize: '30px', color: '#ff5a4a' })
                .setOrigin(0.5).setDepth(3);
        }
        if (plan.calendar && script.day !== undefined) {
            const c = plan.calendar;
            this.add.image(c.x, c.y, calendarTexture(this)).setDepth(2).setPipeline('Light2D');
            this.add.text(c.x, c.y + 8, String(script.day), { fontFamily: 'Georgia, serif', fontSize: '40px', color: '#1a1414' })
                .setOrigin(0.5).setDepth(3).setPipeline('Light2D');
        }
        this.glows(plan);
        this.veil = this.add.rectangle(-200, -SET_H - 200, STAGE_W + 400, SET_H + 400, 0x05040a, 0).setOrigin(0, 0).setDepth(30);
        for (const [id, s] of Object.entries(plan.screens ?? {})) {
            const r = this.add.rectangle(s.x, s.y, s.w, s.h, 0x9ad8ff, 0).setOrigin(0, 0).setDepth(2);
            this.screens.set(id, r);
        }
        for (const [id, p] of Object.entries(script.props ?? {})) {
            const img = this.add.image(p.x, p.y, propTexture(this, p.kind)).setDepth(25).setRotation(p.rot ?? 0).setPipeline('Light2D');
            if (p.hidden) img.setAlpha(0);
            this.props.set(id, img);
        }
        for (const [id, a] of Object.entries(script.cast)) this.actors.set(id, new Actor(this, a));

        this.dressUp(fb.tint);
        window.addEventListener('keydown', this.onKey);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.teardown());

        let t = 0;
        script.shots.forEach((shot) => {
            const at = t * this.k;
            this.time.delayedCall(at, () => this.cut(shot.cam, shot.to, shot.ms * this.k, !!shot.focus));
            for (const [ms, action] of shot.cues ?? []) {
                this.time.delayedCall(at + ms * this.k, () => {
                    // un gesto fallito non ferma il film
                    try { this.run(action); } catch (e) { softFail('film', e); }
                });
            }
            t += shot.ms;
        });
        this.time.delayedCall(t * this.k, () => this.end(700));
    }

    update(): void {
        if (!this.plan) return;
        for (const a of this.actors.values()) a.syncShadow(this.plan.key);
        for (const g of this.glowList) g.img.setAlpha(Math.min(0.7, 0.4 * g.light.intensity));
        const cam = this.cameras.main;
        cam.setZoom(this.eye.z);
        cam.setRotation(this.eye.r);
        // il film trema appena, come la pellicola nel proiettore
        cam.centerOn(this.eye.x + (rng.fx.next() - 0.5) * 0.8, this.eye.y + (rng.fx.next() - 0.5) * 0.8);
    }

    private glows(plan: SetPlan): void {
        if (!this.textures.exists('film-glow')) {
            const t = this.textures.createCanvas('film-glow', 128, 128)!;
            const c = t.getContext();
            const g = c.createRadialGradient(64, 64, 2, 64, 64, 64);
            g.addColorStop(0, 'rgba(255,255,255,0.95)');
            g.addColorStop(0.3, 'rgba(255,255,255,0.3)');
            g.addColorStop(1, 'rgba(255,255,255,0)');
            c.fillStyle = g;
            c.fillRect(0, 0, 128, 128);
            t.refresh();
        }
        for (const l of plan.lights) {
            const glow = this.add.image(l.x, l.y, 'film-glow').setDepth(4).setTint(l.color).setAlpha(0.55)
                .setDisplaySize(l.radius * 0.6, l.radius * 0.6).setBlendMode(Phaser.BlendModes.ADD);
            const light = this.lightsById.get(l.id);
            if (light) this.glowList.push({ img: glow, light });
        }
    }

    private dressUp(tint: number): void {
        const cam = this.cameras.main;
        document.body.classList.add('film');
        for (const id of ['film-bar-top', 'film-bar-bot']) {
            const bar = document.createElement('div');
            bar.id = id;
            ui().append(bar);
            this.bars.push(bar);
        }
        this.line = document.createElement('div');
        this.line.id = 'film-line';
        ui().append(this.line);
        cam.postFX.addVignette(0.5, 0.5, 0.78, 0.5);
        const pipelines = (this.renderer as Phaser.Renderer.WebGL.WebGLRenderer).pipelines;
        if (!pipelines) return;
        // uno shader che non compila sulla scheda di chi gioca non deve fermare il film: resta il colore vero
        try {
            pipelines.addPostPipeline('MemoryPipeline', MemoryPipeline);
            cam.setPostPipeline(MemoryPipeline);
            const got = cam.getPostPipeline(MemoryPipeline) as unknown;
            const pipe = (Array.isArray(got) ? got[got.length - 1] : got) as MemoryPipeline | undefined;
            if (pipe) {
                pipe.tint = hexToTint(tint);
                pipe.strength = 0.6;
            }
        } catch (e) {
            softFail('film', e);
        }
        cam.fadeIn(500, 0, 0, 0);
    }

    private cut(from: Frame, to: Partial<Frame> | undefined, ms: number, focus: boolean): void {
        this.tweens.killTweensOf(this.eye);
        this.eye.x = from.x;
        this.eye.y = from.y;
        this.eye.z = from.zoom;
        this.eye.r = from.rot ?? 0;
        this.update();
        this.setImage.postFX.clear();
        if (focus) this.setImage.postFX.addBlur(1, 2, 2, 1.1);
        if (!to) return;
        this.tweens.add({
            targets: this.eye, x: to.x ?? from.x, y: to.y ?? from.y, z: to.zoom ?? from.zoom, r: to.rot ?? from.rot ?? 0,
            duration: ms, ease: 'Sine.easeInOut',
        });
    }

    private run(a: Action): void {
        const actor = 'who' in a ? this.actors.get(a.who) : undefined;
        switch (a.do) {
            case 'walk': actor?.walk(a.to, a.ms * this.k); break;
            case 'face': actor?.face(a.dir); break;
            case 'hop': actor?.hop(); break;
            case 'nod': actor?.nod(); break;
            case 'lean': actor?.lean(a.angle, (a.ms ?? 400) * this.k); break;
            case 'shiver': actor?.shiver(a.ms * this.k); break;
            case 'show': actor?.fade(1, a.ms ?? 500); break;
            case 'hide': actor?.fade(0, a.ms ?? 500); break;
            case 'alpha': actor?.fade(a.to, (a.ms ?? 400) * this.k); break;
            case 'move': actor?.move(a.x, a.y, a.ms * this.k); break;
            case 'scale': actor?.rescale(a.by, a.ms * this.k); break;
            case 'say': this.say(a.who, a.text, (a.ms ?? 900 + a.text.length * 55) * this.k); break;
            case 'prop': {
                const img = this.props.get(a.id);
                if (!img) break;
                if (a.show) this.tweens.add({ targets: img, alpha: 1, duration: 300 });
                if (a.hide) this.tweens.add({ targets: img, alpha: 0, duration: 300 });
                if (a.to) this.tweens.add({ targets: img, x: a.to.x ?? img.x, y: a.to.y ?? img.y, rotation: a.to.rot ?? img.rotation, duration: (a.ms ?? 500) * this.k, ease: 'Sine.easeInOut' });
                break;
            }
            case 'give': {
                const img = this.props.get(a.id);
                const from = this.actors.get(a.from);
                const to = this.actors.get(a.to);
                if (!img || !from || !to) break;
                const h0 = from.hand();
                const h1 = to.hand();
                img.setPosition(h0.x, h0.y).setAlpha(1);
                const p = { t: 0 };
                this.tweens.add({
                    targets: p, t: 1, duration: a.ms * this.k, ease: 'Sine.easeInOut',
                    onUpdate: () => img.setPosition(h0.x + (h1.x - h0.x) * p.t, h0.y + (h1.y - h0.y) * p.t - Math.sin(p.t * Math.PI) * 24),
                });
                this.cue('carta');
                break;
            }
            case 'sfx': this.cue(a.play); break;
            case 'light': {
                const l = this.lightsById.get(a.id);
                if (!l) break;
                this.baseIntensity.set(a.id, a.intensity);
                this.tweens.add({ targets: l, intensity: a.intensity, duration: (a.ms ?? 300) * this.k });
                break;
            }
            case 'flash': this.cameras.main.flash(a.ms ?? 120, 255, 248, 230); break;
            case 'shake': this.cameras.main.shake(a.ms * this.k, a.force ?? 0.004); break;
            case 'screen': {
                const r = this.screens.get(a.id);
                if (!r) break;
                this.tweens.add({ targets: r, fillAlpha: a.on ? 0.55 : 0, duration: a.on ? 260 : 80 });
                break;
            }
            case 'clock': this.clockText?.setText(a.text); break;
            case 'dark': this.tweens.add({ targets: this.veil, fillAlpha: a.to, duration: (a.ms ?? 600) * this.k }); break;
        }
    }

    // niente narratore: parla solo chi è in scena, col suo nome e la sua voce
    private say(who: string, text: string, ms: number): void {
        const actor = this.actors.get(who);
        const cast = actor?.who ?? 'lametta';
        const v = VOICE[cast] ?? { hz: 220, color: '#e8e0d0' };
        if (this.line) {

            const name = document.createElement('span');
            name.className = 'who';
            name.style.color = v.color;
            name.textContent = cast;
            const words = document.createElement('span');
            words.textContent = text;
            this.line.replaceChildren(name, words);
            this.line.classList.add('on');
        }
        const syll = Math.max(2, Math.min(9, Math.round(text.length / 6)));
        for (let i = 0; i < syll; i++) this.time.delayedCall(i * 95, () => sfx.mumble(v.hz * (0.9 + rng.fx.next() * 0.25)));
        this.time.delayedCall(ms, () => this.line?.classList.remove('on'));
    }

    cue(name: SfxCue): void {
        switch (name) {
            case 'passo': sfx.step('concrete', 0.6); break;
            case 'carta': sfx.rustle(); break;
            case 'timbro': sfx.clankFar(0, 1); break;
            case 'porta': sfx.creak(0.3, 0.9); break;
            case 'scricchiolio': sfx.creak(-0.2, 0.6); break;
            case 'vetro': sfx.chime(0.2, 0.6); break;
            case 'versa': sfx.bubble(0, 0.9); break;
            case 'cassa': sfx.beep(0.3, 1); break;
            case 'pennello': sfx.death('pittura'); break;
            case 'clic': sfx.beep(0, 0.7); break;
            case 'ronzio': sfx.buzz(0, 0.7); break;
            case 'bip': sfx.beep(-0.2, 0.8); break;
            case 'stampante': sfx.buzz(0.3, 1); break;
            case 'sabbia': sfx.pebble(0, 0.9); break;
            case 'spinta': sfx.rumble(); break;
            case 'clacson': sfx.horn(-0.3, 0.6); break;
            case 'grilli': sfx.cricket(-0.4, 0.8); break;
            case 'campanello': sfx.chime(0, 1); break;
            case 'cuore': sfx.heartbeat(); break;
            case 'matita': sfx.chalk(); break;
            case 'fuoco': sfx.crack(); break;
            case 'glitch': sfx.death('tecnodrone'); break;
            case 'rombo': sfx.rumble(); break;
            case 'uccelli': sfx.bird(-0.3, 0.8); break;
            case 'vento': sfx.whisper(0, 0.8); break;
        }
    }

    /** l'altro ha chiuso il film: si chiude anche qui */
    endNow(): void {
        this.end(260);
    }

    private end(fadeMs: number): void {
        if (this.ending) return;
        this.ending = true;
        this.line?.classList.remove('on');
        this.cameras.main.fadeOut(fadeMs, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.finish());
    }

    private finish(): void {
        const done = this.film.onEnd;
        this.scene.stop();
        done();
    }

    private teardown(): void {
        window.removeEventListener('keydown', this.onKey);
        document.body.classList.remove('film');
        for (const b of this.bars) b.remove();
        this.line?.remove();
        for (const l of this.lightsById.values()) this.lights.removeLight(l);
        for (const a of this.actors.values()) if (a.light) this.lights.removeLight(a.light);
        this.lights.disable();
    }
}
