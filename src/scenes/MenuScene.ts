import Phaser from 'phaser';
import { LEVELS } from '../content/levels';
import { biomeFor } from '../content/biomes';
import { ParallaxManager } from '../engine/ParallaxManager';
import { canvas, hex, mix, mulberry32, shade, smoothNoise1D } from '../engine/art/ink';
import { animateCreature, creatureRes } from '../engine/art/creatureKit';
import { ensureCreature } from '../engine/art/creatures';
import { generateFogTexture } from '../engine/textures';

/* il titolo come un falò dei souls: il dipinto dell'ultimo capitolo
   raggiunto, le sagome del parallasse che scorrono piano, una cresta
   d'inchiostro e sopra il microfono che arde. il geco veglia accanto.
   è la stessa pipeline di luci del gioco: niente fondale finto */

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
    private levelId = 'bus';
    private noise = smoothNoise1D(7);
    private t = 0;
    private onResize = () => this.layout();

    constructor() {
        super('MenuScene');
    }

    create(data: { levelId?: string }): void {
        this.levelId = data.levelId && LEVELS[data.levelId] ? data.levelId : 'bus';
        const def = LEVELS[this.levelId];
        const biome = biomeFor(def);
        if (!this.textures.exists('fog')) generateFogTexture(this);

        // il buio del bioma, appena tinto: si legge solo ciò che il fuoco tocca
        this.lights.enable().setAmbientColor(mix(0x0c0b0a, biome.rim, 0.08));
        this.parallax = new ParallaxManager(this);
        this.parallax.build(def.color, this.levelId, biome, this.scale.height);

        this.mic = this.add.sprite(0, 0, ensureCreature(this, 'mic'), 0).setPipeline('Light2D').setScrollFactor(0).setDepth(10);
        this.mic.setScale(2.1 / creatureRes(this, 'mic'));
        animateCreature(this.mic, 420);
        this.geco = this.add.sprite(0, 0, 'player', 0).setPipeline('Light2D').setScrollFactor(0).setDepth(11).setScale(0.34);
        if (!this.anims.exists('p-idle')) this.anims.create({ key: 'p-idle', frames: this.anims.generateFrameNumbers('player', { start: 0, end: 7 }), frameRate: 5, repeat: -1 });
        this.geco.play('p-idle');

        // l'alone caldo sommato sopra la griglia: è lui il falò
        this.halo = this.add.image(0, 0, 'p-dot').setScrollFactor(0).setDepth(12).setBlendMode(Phaser.BlendModes.ADD).setTint(0xffa24a).setAlpha(0.55);
        this.fire = this.lights.addLight(0, 0, 520, 0xffa95e, 1.9).setScrollFactor(0);
        this.moon = this.lights.addLight(0, 0, 900, mix(0x8ea4c8, biome.rim, 0.3), 0.55).setScrollFactor(0);

        this.embers = this.add.particles(0, 0, 'p-dot', {
            speedY: { min: -70, max: -22 },
            speedX: { min: -14, max: 14 },
            accelerationX: { min: -8, max: 8 },
            lifespan: { min: 2200, max: 4200 },
            scale: { start: 0.32, end: 0 },
            alpha: { start: 0.95, end: 0 },
            tint: [0xffc078, 0xff8a3d, 0xffe2a8],
            blendMode: Phaser.BlendModes.ADD,
            frequency: 70,
        }).setScrollFactor(0).setDepth(13);

        const cam = this.cameras.main;
        if (cam.postFX) {
            cam.postFX.addVignette(0.6, 0.55, 0.95, 0.55);
        }
        cam.fadeIn(1400, 0, 0, 0);
        this.layout();
        this.scale.on('resize', this.onResize);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off('resize', this.onResize));
    }

    /** cresta d'inchiostro su cui sta il falò: ridisegnata a ogni misura dello schermo */
    private drawRidge(w: number, h: number, fx: number): { top: (x: number) => number } {
        const biome = biomeFor(LEVELS[this.levelId]);
        const rnd = mulberry32(31);
        const n = smoothNoise1D(11);
        const H = Math.round(h * 0.34);
        const base = H * 0.38;
        // un poggio sotto il fuoco, il resto scende verso i bordi
        const top = (x: number) => base + (1 - Math.exp(-(((x - fx) / (w * 0.22)) ** 2))) * H * 0.28 + n(x / 90) * 10 + n(x / 23) * 3;
        const { el, ctx } = canvas(w, H);
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, hex(shade(biome.rock, -0.55)));
        g.addColorStop(0.25, hex(shade(biome.deep, -0.2)));
        g.addColorStop(1, '#030304');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(0, H);
        for (let x = 0; x <= w; x += 6) ctx.lineTo(x, top(x));
        ctx.lineTo(w, H);
        ctx.closePath();
        ctx.fill();
        // filo di luce sul bordo e inchiostro
        ctx.strokeStyle = hex(biome.rim, 0.35);
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 6) ctx.lineTo(x, top(x) + 1.5);
        ctx.stroke();
        ctx.strokeStyle = '#050506';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 6) ctx.lineTo(x, top(x));
        ctx.stroke();
        // erba secca e sassi a tratti
        ctx.strokeStyle = hex(shade(biome.rock, -0.4));
        ctx.lineWidth = 1.2;
        for (let x = 0; x < w; x += 3 + rnd() * 9) {
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
        for (let y = base; y < H; y += 5) {
            ctx.beginPath();
            for (let x = -20; x < w; x += 14 + rnd() * 12) {
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
        const { top } = this.drawRidge(w, h, fx);
        const ridgeY = h - Math.round(h * 0.34);
        this.ridge?.destroy();
        this.ridge = this.add.image(0, ridgeY, 'menu-ridge').setOrigin(0, 0).setScrollFactor(0).setDepth(9).setPipeline('Light2D');
        const groundAt = (x: number) => ridgeY + top(x);
        const s = Math.max(0.75, Math.min(1.4, h / 760));
        this.mic.setScale((2.1 * s) / creatureRes(this, 'mic'));
        this.mic.setPosition(fx, groundAt(fx) - this.mic.displayHeight * 0.36);
        const gx = fx - 92 * s;
        this.geco.setScale(0.34 * s).setPosition(gx, groundAt(gx) - 118 * 0.34 * s * 1.05);
        this.halo.setPosition(fx, this.mic.y - this.mic.displayHeight * 0.3).setScale(9 * s);
        this.fire.setPosition(fx, this.mic.y - this.mic.displayHeight * 0.3);
        this.moon.setPosition(w * 0.15, -h * 0.2);
        this.embers.setPosition(fx, this.mic.y - this.mic.displayHeight * 0.32);
        // polvere che galleggia nella luce, su tutta la scena
        this.dust?.destroy();
        this.dust = this.add.particles(0, 0, 'p-dot', {
            x: { min: 0, max: w },
            y: { min: 0, max: h * 0.8 },
            speedX: { min: 4, max: 16 },
            speedY: { min: -6, max: 6 },
            lifespan: 9000,
            scale: { start: 0.12, end: 0.04 },
            alpha: { start: 0.45, end: 0 },
            tint: 0xe8d8b0,
            frequency: 260,
            blendMode: Phaser.BlendModes.ADD,
        }).setScrollFactor(0).setDepth(14);
    }

    update(_time: number, delta: number): void {
        this.t += delta;
        // il mondo scorre piano dietro al fuoco
        this.cameras.main.scrollX += delta * 0.014;
        this.parallax.update(this.t);
        const k = this.noise(this.t / 160) * 0.5 + this.noise(this.t / 47) * 0.25;
        this.fire.setIntensity(1.85 + k * 0.6);
        this.fire.setRadius(500 + k * 60);
        this.halo.setAlpha(0.5 + k * 0.18);
    }
}
