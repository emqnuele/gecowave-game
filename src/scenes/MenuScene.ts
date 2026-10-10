import Phaser from 'phaser';
import { LEVELS } from '../content/levels';
import { BIOMES, menuBiome, menuTone, type BiomeDef } from '../content/biomes';
import { ParallaxManager } from '../stage/ParallaxManager';
import { canvas, hex, mix, shade, smoothNoise1D } from '../art/ink';
import { mulberry32 } from '../rules/hash';
import { animateCreature, creatureRes } from '../art/creatureKit';
import { CREATURE_KEYS, ensureCreature } from '../art/creatures';
import { generateFogTexture } from '../art/textures';
import { ensurePlayerSkin } from '../art/playerSkin';
import { state } from '../core/state';

/* il titolo come un falò dei souls: il dipinto dell'ultimo capitolo
   raggiunto (o quello del titolo, a partita nuova), le sagome del parallasse che scorrono piano, una cresta
   d'inchiostro e sopra il microfono che arde. il geco veglia accanto.
   è la stessa pipeline di luci del gioco: niente fondale finto */

/** pixel di spostamento a mouse tutto da un lato: più il piano è vicino, più si muove */
const SWAY = {
    painted: 10,
    camera: 44,
    ridge: { x: 24, y: 9 },
    dust: 34,
    motes: 70,
} as const;

export class MenuScene extends Phaser.Scene {
    private parallax!: ParallaxManager;
    private ridge: Phaser.GameObjects.Image | null = null;
    private mic!: Phaser.GameObjects.Sprite;
    private geco!: Phaser.GameObjects.Sprite;
    private halo!: Phaser.GameObjects.Image;
    private fire!: Phaser.GameObjects.Light;
    private moon!: Phaser.GameObjects.Light;
    private embers!: Phaser.GameObjects.Particles.ParticleEmitter;
    private dust: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
    private motes: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
    private gecoLight!: Phaser.GameObjects.Light;
    /** dove guarda il mouse, -1..1 per asse; la scena lo insegue piano */
    private aim = { x: 0, y: 0 };
    private sway = { x: 0, y: 0 };
    private drift = 0;
    /** i piani vicini: posizione a riposo e quanti pixel si spostano col mouse */
    private near: { obj: { x: number; y: number }; x: number; y: number; depth: { x: number; y: number } }[] = [];
    private biome: BiomeDef = BIOMES.title;
    private noise = smoothNoise1D(7);
    private t = 0;
    /** fogli da costruire in idle: entrando nel livello sono già pronti */
    private warmQueue: string[] = [];
    private onResize = () => this.layout();
    private onPointer = (e: PointerEvent) => {
        this.aim.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.aim.y = (e.clientY / window.innerHeight) * 2 - 1;
    };

    constructor() {
        super('MenuScene');
    }

    create(data: { levelId?: string }): void {
        // phaser riusa la stessa istanza a ogni restart: quello che non si riassegna qui passerebbe alla vita dopo
        this.t = 0;
        this.ridge = null;
        this.dust = null;
        this.motes = null;
        this.near = [];
        this.aim = { x: 0, y: 0 };
        this.sway = { x: 0, y: 0 };
        this.drift = 0;
        const def = data.levelId ? LEVELS[data.levelId] : undefined;
        const biome = this.biome = menuBiome(def);
        const tone = menuTone(biome);
        if (!this.textures.exists('fog')) generateFogTexture(this);

        // il buio del bioma, appena tinto: si legge solo ciò che il fuoco tocca
        this.lights.enable().setAmbientColor(mix(0x0c0b0a, biome.rim, 0.08));
        this.parallax = new ParallaxManager(this);
        this.parallax.build(def ? def.color : null, def ? def.id : 'title', biome, this.scale.height);
        this.parallax.allowSway(SWAY.painted);

        this.mic = this.add.sprite(0, 0, ensureCreature(this, 'mic'), 0).setPipeline('Light2D').setScrollFactor(0).setDepth(10);
        this.mic.setScale(2.1 / creatureRes(this, 'mic'));
        animateCreature(this.mic, 420);
        // la forgia può aver cambiato pelle: le texture vanno allineate prima dello sprite
        ensurePlayerSkin(this, state.save.skin);
        this.geco = this.add.sprite(0, 0, 'player', 0).setPipeline('Light2D').setScrollFactor(0).setDepth(11).setScale(0.34);
        if (!this.anims.exists('p-idle')) this.anims.create({ key: 'p-idle', frames: this.anims.generateFrameNumbers('player', { start: 0, end: 7 }), frameRate: 5, repeat: -1 });
        this.geco.play('p-idle');

        // l'alone caldo sommato sopra la griglia: è lui il falò
        this.halo = this.add.image(0, 0, 'p-dot').setScrollFactor(0).setDepth(12).setBlendMode(Phaser.BlendModes.ADD).setTint(tone.ember).setAlpha(0.55);
        this.fire = this.lights.addLight(0, 0, 520, mix(tone.ember, 0xffffff, 0.08), 1.9).setScrollFactor(0);
        // una lucina tutta sua: il geco si legge anche lontano dal fuoco
        this.gecoLight = this.lights.addLight(0, 0, 150, mix(tone.gold, 0xe8dfc8, 0.55), 0.85).setScrollFactor(0);
        this.moon = this.lights.addLight(0, 0, 900, mix(mix(0x8ea4c8, biome.rim, 0.3), biome.accent, 0.35), 0.55).setScrollFactor(0);

        this.embers = this.add.particles(0, 0, 'p-dot', {
            speedY: { min: -70, max: -22 },
            speedX: { min: -14, max: 14 },
            accelerationX: { min: -8, max: 8 },
            lifespan: { min: 2200, max: 4200 },
            scale: { start: 0.32, end: 0 },
            alpha: { start: 0.95, end: 0 },
            tint: [tone.ember, mix(tone.ember, 0xffffff, 0.35), tone.gold],
            blendMode: Phaser.BlendModes.ADD,
            frequency: 70,
        }).setScrollFactor(0).setDepth(13);

        const cam = this.cameras.main;
        if (cam.postFX) {
            cam.postFX.addVignette(0.6, 0.55, 0.95, 0.55);
        }
        cam.fadeIn(1400, 0, 0, 0);
        this.layout();
        // mentre il menu è aperto si costruiscono i fogli del cast, pochi
        // millisecondi a frame: l'ingresso nel livello non li paga più
        this.warmQueue = CREATURE_KEYS.filter((k) => k !== 'mic');
        this.scale.on('resize', this.onResize);
        window.addEventListener('pointermove', this.onPointer);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.scale.off('resize', this.onResize);
            window.removeEventListener('pointermove', this.onPointer);
        });
    }

    /** cresta d'inchiostro su cui sta il falò: ridisegnata a ogni misura dello schermo */
    private drawRidge(w: number, h: number, fx: number, pad: number): { top: (x: number) => number } {
        const biome = this.biome;
        const rnd = mulberry32(31);
        const n = smoothNoise1D(11);
        const H = Math.round(h * 0.34);
        const base = H * 0.38;
        // un poggio sotto il fuoco, il resto scende verso i bordi
        const top = (x: number) => base + (1 - Math.exp(-(((x - fx) / (w * 0.22)) ** 2))) * H * 0.28 + n(x / 90) * 10 + n(x / 23) * 3;
        // il margine oltre i bordi lascia ondeggiare la cresta senza scoprirli
        const { el, ctx } = canvas(w + pad * 2, H + pad);
        ctx.translate(pad, 0);
        const x0 = -pad;
        const x1 = w + pad;
        const bottom = H + pad;
        const g = ctx.createLinearGradient(0, 0, 0, bottom);
        g.addColorStop(0, hex(shade(biome.rock, -0.55)));
        g.addColorStop(0.25, hex(shade(biome.deep, -0.2)));
        g.addColorStop(1, '#030304');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(x0, bottom);
        for (let x = x0; x <= x1; x += 6) ctx.lineTo(x, top(x));
        ctx.lineTo(x1, bottom);
        ctx.closePath();
        ctx.fill();
        // filo di luce sul bordo e inchiostro
        ctx.strokeStyle = hex(biome.rim, 0.35);
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = x0; x <= x1; x += 6) ctx.lineTo(x, top(x) + 1.5);
        ctx.stroke();
        ctx.strokeStyle = '#050506';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let x = x0; x <= x1; x += 6) ctx.lineTo(x, top(x));
        ctx.stroke();
        // erba secca e sassi a tratti
        ctx.strokeStyle = hex(shade(biome.rock, -0.4));
        ctx.lineWidth = 1.2;
        for (let x = x0; x < x1; x += 3 + rnd() * 9) {
            const y = top(x);
            const l = 3 + rnd() * 9;
            ctx.beginPath();
            ctx.moveTo(x, y + 1);
            ctx.lineTo(x + (rnd() - 0.5) * 6, y - l);
            ctx.stroke();
        }
        // tratteggio nel corpo della roccia, più fitto in basso
        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.lineWidth = 1;
        for (let y = base; y < bottom; y += 5) {
            ctx.beginPath();
            for (let x = x0 - 20; x < x1; x += 14 + rnd() * 12) {
                const len = 6 + rnd() * 10;
                ctx.moveTo(x, y + rnd() * 2);
                ctx.lineTo(x + len, y - len * 0.6);
            }
            ctx.stroke();
        }
        if (this.textures.exists('menu-ridge')) this.textures.remove('menu-ridge');
        this.textures.addCanvas('menu-ridge', el);
        return { top };
    }

    private layout(): void {
        const w = this.scale.width;
        const h = this.scale.height;
        this.parallax.resize();
        // il falò sta a destra: a sinistra c'è il menu
        const fx = w * (w > 900 ? 0.66 : 0.5);
        const pad = Math.ceil(SWAY.ridge.x + SWAY.ridge.y);
        const { top } = this.drawRidge(w, h, fx, pad);
        const ridgeY = h - Math.round(h * 0.34);
        this.ridge?.destroy();
        this.ridge = this.add.image(-pad, ridgeY, 'menu-ridge').setOrigin(0, 0).setScrollFactor(0).setDepth(9).setPipeline('Light2D');
        const groundAt = (x: number) => ridgeY + top(x);
        const s = Math.max(0.75, Math.min(1.4, h / 760));
        this.mic.setScale((2.1 * s) / creatureRes(this, 'mic'));
        this.mic.setPosition(fx, groundAt(fx) - this.mic.displayHeight * 0.36);
        const gx = fx - 92 * s;
        this.geco.setScale(0.34 * s).setPosition(gx, groundAt(gx) - 118 * 0.34 * s * 1.05);
        this.halo.setPosition(fx, this.mic.y - this.mic.displayHeight * 0.3).setScale(9 * s);
        this.fire.setPosition(fx, this.mic.y - this.mic.displayHeight * 0.3);
        // davanti e sopra la testa: la luce cade sul muso, non sulla schiena
        this.gecoLight.setPosition(gx + 18 * s, this.geco.y - 40 * s).setRadius(150 * s);
        this.moon.setPosition(w * 0.15, -h * 0.2);
        this.embers.setPosition(fx, this.mic.y - this.mic.displayHeight * 0.32);
        // polvere che galleggia nella luce, su tutta la scena
        this.dust?.destroy();
        this.dust = this.add.particles(0, 0, 'p-dot', {
            x: { min: -SWAY.dust, max: w + SWAY.dust },
            y: { min: 0, max: h * 0.8 },
            speedX: { min: 4, max: 16 },
            speedY: { min: -6, max: 6 },
            lifespan: 9000,
            scale: { start: 0.12, end: 0.04 },
            alpha: { start: 0.45, end: 0 },
            tint: mix(0xe8d8b0, this.biome.accent, 0.25),
            frequency: 260,
            blendMode: Phaser.BlendModes.ADD,
        }).setScrollFactor(0).setDepth(14);
        // pulviscolo grosso e sfocato a un palmo dall'obiettivo: il piano più vicino
        this.motes?.destroy();
        this.motes = this.add.particles(0, 0, 'p-dot', {
            x: { min: -SWAY.motes, max: w + SWAY.motes },
            y: { min: h * 0.05, max: h * 0.95 },
            speedX: { min: 6, max: 22 },
            speedY: { min: -10, max: 4 },
            lifespan: 11000,
            scale: { start: 0.9, end: 1.6 },
            alpha: { start: 0.1, end: 0 },
            tint: mix(menuTone(this.biome).gold, 0xe8dfc8, 0.5),
            frequency: 700,
            blendMode: Phaser.BlendModes.ADD,
        }).setScrollFactor(0).setDepth(31);
        this.motes.fastForward(8000);

        const near = (obj: { x: number; y: number }, depth: { x: number; y: number }) => ({ obj, x: obj.x, y: obj.y, depth });
        this.near = [
            near(this.ridge, SWAY.ridge), near(this.mic, SWAY.ridge), near(this.geco, SWAY.ridge), near(this.halo, SWAY.ridge),
            near(this.fire, SWAY.ridge), near(this.gecoLight, SWAY.ridge), near(this.embers, SWAY.ridge),
            near(this.dust, { x: SWAY.dust, y: SWAY.dust * 0.3 }), near(this.motes, { x: SWAY.motes, y: SWAY.motes * 0.3 }),
        ];
    }

    update(_time: number, delta: number): void {
        this.t += delta;
        if (this.warmQueue.length) {
            const t0 = performance.now();
            while (this.warmQueue.length && performance.now() - t0 < 8) {
                ensureCreature(this, this.warmQueue.shift()!);
            }
        }
        // il mouse sposta i piani in proporzione alla distanza; a mouse fermo la scena respira da sola
        const live = state.settings.cameraFx;
        const tx = live ? this.aim.x * 0.8 + Math.sin(this.t / 5200) * 0.2 : 0;
        const ty = live ? this.aim.y * 0.8 + Math.sin(this.t / 3700) * 0.2 : 0;
        const ease = 1 - Math.exp(-delta / 650);
        this.sway.x += (tx - this.sway.x) * ease;
        this.sway.y += (ty - this.sway.y) * ease;
        this.parallax.sway.x = this.sway.x;
        this.parallax.sway.y = this.sway.y;
        for (const n of this.near) {
            n.obj.x = n.x - this.sway.x * n.depth.x;
            n.obj.y = n.y - this.sway.y * n.depth.y;
        }
        // il mondo scorre piano dietro al fuoco; sagome e nebbia seguono la camera
        this.drift += delta * 0.014;
        const cam = this.cameras.main;
        cam.scrollX = this.drift + this.sway.x * SWAY.camera;
        this.parallax.update(this.t);
        const k = this.noise(this.t / 160) * 0.5 + this.noise(this.t / 47) * 0.25;
        this.fire.setIntensity(1.85 + k * 0.6);
        this.fire.setRadius(500 + k * 60);
        this.halo.setAlpha(0.5 + k * 0.18);
        this.gecoLight.setIntensity(0.8 + this.noise(this.t / 900) * 0.12);
    }
}
