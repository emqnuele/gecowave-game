import Phaser from 'phaser';
import { TILE } from '../config';
import type { Ambience, BiomeDef } from '../content/biomes';
import { hashString, mulberry32, shade } from './art/ink';

/* l'aria del bioma: spore, braci, pioggia, glifi. gli emettitori seguono
   la camera ma le particelle restano nel mondo, così il parallasse è vero */

const GLYPHS = ['∫', '∑', 'π', '∂', '√', '∞', 'λ', 'ε', 'δ', 'lim', 'dx'];

interface Follower {
    emitter: Phaser.GameObjects.Particles.ParticleEmitter;
    /** margine oltre la vista dove nascono le particelle */
    pad: number;
}

export class AmbienceManager {
    private scene: Phaser.Scene;
    private followers: Follower[] = [];
    /** gli emettitori di pioggia: si spengono al coperto */
    private rain: { emitter: Phaser.GameObjects.Particles.ParticleEmitter; baseFreq: number }[] = [];

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.followers = [];
            this.rain = [];
        });
    }

    build(biome: BiomeDef, grid: string[], seedKey: string): void {
        this.ensureTextures(biome);
        for (const a of biome.ambience) this.addAmbience(a, biome);
        if (biome.lightShafts) this.addLightShafts(biome, grid, seedKey);
    }

    update(outdoor: boolean): void {
        const v = this.scene.cameras.main.worldView;
        for (const f of this.followers) {
            f.emitter.setPosition(v.x - f.pad, v.y - f.pad);
            const zone = f.emitter.emitZones[0] as Phaser.GameObjects.Particles.Zones.RandomZone | undefined;
            const shape = zone?.source as Phaser.Geom.Rectangle | undefined;
            if (shape) shape.setSize(v.width + f.pad * 2, v.height + f.pad * 2);
        }
        // al coperto non piove: si risparmiano ~280 particelle e smette
        // di piovere in testa dentro le stanze
        for (const r of this.rain) {
            r.emitter.setVisible(outdoor);
            r.emitter.quantity = outdoor ? 1 : 0;
        }
    }

    private ensureTextures(biome: BiomeDef): void {
        const t = this.scene.textures;
        const make = (key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) => {
            if (t.exists(key)) return;
            const el = document.createElement('canvas');
            el.width = w;
            el.height = h;
            draw(el.getContext('2d')!);
            t.addCanvas(key, el);
        };
        make('amb-streak', 2, 26, (ctx) => {
            const g = ctx.createLinearGradient(0, 0, 0, 26);
            g.addColorStop(0, 'rgba(255,255,255,0)');
            g.addColorStop(1, 'rgba(255,255,255,0.9)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 2, 26);
        });
        make('amb-flake', 6, 6, (ctx) => {
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.ellipse(3, 3, 3, 1.6, 0.6, 0, Math.PI * 2);
            ctx.fill();
        });
        make('amb-square', 4, 4, (ctx) => {
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, 4, 4);
        });
        make('amb-bubble', 14, 14, (ctx) => {
            ctx.strokeStyle = 'rgba(255,255,255,0.9)';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.arc(7, 7, 5.5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.fillRect(4, 4, 2, 2);
        });
        make('amb-shaft', 128, 512, (ctx) => {
            // raggio di luce: trapezio sfumato sui lati e verso il basso
            const g = ctx.createLinearGradient(0, 0, 0, 512);
            g.addColorStop(0, 'rgba(255,255,255,0.55)');
            g.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(44, 0);
            ctx.lineTo(84, 0);
            ctx.lineTo(128, 512);
            ctx.lineTo(0, 512);
            ctx.closePath();
            ctx.fill();
            ctx.globalCompositeOperation = 'destination-in';
            const side = ctx.createLinearGradient(0, 0, 128, 0);
            side.addColorStop(0, 'rgba(0,0,0,0)');
            side.addColorStop(0.5, 'rgba(0,0,0,1)');
            side.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = side;
            ctx.fillRect(0, 0, 128, 512);
        });
        if (biome.ambience.includes('glyphs')) {
            GLYPHS.forEach((gl, i) => make(`amb-glyph-${i}`, 40, 28, (ctx) => {
                ctx.fillStyle = '#fff';
                ctx.font = '20px "Martian Mono", monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(gl, 20, 14);
            }));
        }
    }

    private follow(emitter: Phaser.GameObjects.Particles.ParticleEmitter, pad = 120): void {
        this.followers.push({ emitter, pad });
    }

    private zone(): Phaser.Types.GameObjects.Particles.ParticleEmitterRandomZoneConfig {
        const v = this.scene.cameras.main.worldView;
        return { type: 'random', source: new Phaser.Geom.Rectangle(0, 0, Math.max(400, v.width + 240), Math.max(300, v.height + 240)) } as Phaser.Types.GameObjects.Particles.ParticleEmitterRandomZoneConfig;
    }

    private addAmbience(kind: Ambience, b: BiomeDef): void {
        const add = (tex: string, cfg: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig, depth: number) => {
            const e = this.scene.add.particles(0, 0, tex, { ...cfg, emitZone: this.zone() });
            e.setDepth(depth);
            this.follow(e);
            return e;
        };
        switch (kind) {
            case 'spores':
                add('p-dot', { lifespan: 7000, speedX: { min: -6, max: 6 }, speedY: { min: -18, max: -6 }, scale: { start: 0.35, end: 0 }, alpha: { start: 0.7, end: 0 }, tint: b.accent, frequency: 140, blendMode: Phaser.BlendModes.ADD }, 3);
                add('p-dot', { lifespan: 5000, speedX: { min: -10, max: 10 }, speedY: { min: -14, max: -4 }, scale: { start: 1.1, end: 0 }, alpha: { start: 0.25, end: 0 }, tint: b.accent, frequency: 900, blendMode: Phaser.BlendModes.ADD }, 21);
                break;
            case 'dust':
                add('p-dot', { lifespan: 6000, speedX: { min: -10, max: 10 }, speedY: { min: -6, max: 6 }, scale: { start: 0.18, end: 0 }, alpha: { start: 0.35, end: 0 }, tint: shade(b.rim, -0.2), frequency: 110 }, 3);
                break;
            case 'embers':
                add('p-dot', { lifespan: 3200, speedX: { min: -30, max: 30 }, speedY: { min: -80, max: -30 }, scale: { start: 0.3, end: 0 }, alpha: { start: 1, end: 0 }, tint: [0xff8a3d, 0xffc06b, b.accent], frequency: 90, blendMode: Phaser.BlendModes.ADD }, 21);
                break;
            case 'rain': {
                const r1 = add('amb-streak', { lifespan: 900, speedX: { min: -140, max: -110 }, speedY: { min: 900, max: 1100 }, rotate: 8, scaleY: { min: 0.8, max: 1.4 }, alpha: { start: 0.3, end: 0.15 }, tint: shade(b.rim, 0.1), frequency: 6 }, 21);
                const r2 = add('amb-streak', { lifespan: 1300, speedX: { min: -80, max: -60 }, speedY: { min: 600, max: 700 }, rotate: 6, alpha: { start: 0.16, end: 0.05 }, tint: b.haze, frequency: 10 }, 0);
                this.rain.push({ emitter: r1, baseFreq: 6 }, { emitter: r2, baseFreq: 10 });
                break;
            }
            case 'bubbles':
                add('amb-bubble', { lifespan: 4000, speedX: { min: -8, max: 8 }, speedY: { min: -50, max: -20 }, scale: { min: 0.4, max: 1 }, alpha: { start: 0.45, end: 0 }, tint: b.accent, frequency: 260 }, 3);
                break;
            case 'glyphs': {
                const keys = GLYPHS.map((_, i) => `amb-glyph-${i}`);
                for (let i = 0; i < 4; i++) {
                    add(keys[i * 2 % keys.length], { lifespan: 6000, speedX: { min: -8, max: 8 }, speedY: { min: -16, max: -4 }, rotate: { min: -20, max: 20 }, scale: { start: 0.7, end: 0.3 }, alpha: { start: 0.5, end: 0 }, tint: b.accent, frequency: 1600, blendMode: Phaser.BlendModes.ADD }, 3);
                }
                break;
            }
            case 'ash':
                add('amb-flake', { lifespan: 8000, speedX: { min: -20, max: 10 }, speedY: { min: 14, max: 34 }, rotate: { min: 0, max: 360 }, scale: { min: 0.5, max: 1.2 }, alpha: { start: 0.55, end: 0 }, tint: shade(b.rim, -0.1), frequency: 120 }, 21);
                break;
            case 'data':
                add('amb-square', { lifespan: 2400, speedY: { min: 80, max: 180 }, scale: { min: 0.4, max: 0.9 }, alpha: { start: 0.65, end: 0 }, tint: [b.accent, 0x4ade80], frequency: 70, blendMode: Phaser.BlendModes.ADD }, 3);
                break;
            case 'fireflies':
                add('p-dot', {
                    lifespan: 5000, speedX: { min: -24, max: 24 }, speedY: { min: -24, max: 24 }, scale: { start: 0.45, end: 0.1 },
                    alpha: { start: 0.9, end: 0, ease: 'Sine.easeIn' },
                    tint: 0xd9f99d, frequency: 380, blendMode: Phaser.BlendModes.ADD,
                }, 21);
                break;
            case 'drips':
                add('amb-streak', { lifespan: 1400, speedY: { min: 260, max: 420 }, scaleY: 0.35, alpha: { start: 0.5, end: 0.2 }, tint: b.accent, frequency: 280 }, 3);
                break;
        }
    }

    /** raggi di luce dall'alto, nei punti dove c'è cielo aperto sopra spazio vuoto */
    private addLightShafts(b: BiomeDef, grid: string[], seedKey: string): void {
        const rnd = mulberry32(hashString(seedKey) ^ 0xa11ce);
        const width = Math.max(...grid.map((r) => r.length));
        const color = shade(b.rim, 0.2);
        let c = 10 + Math.floor(rnd() * 30);
        while (c < width - 4) {
            // primo pieno dall'alto: il raggio cade fin lì
            let r = 0;
            while (r < grid.length && grid[r][c] !== '#') r++;
            const floorY = r * TILE;
            if (floorY > TILE * 6) {
                const x = c * TILE;
                const shaft = this.scene.add.image(x, 0, 'amb-shaft').setOrigin(0.5, 0).setDepth(-2)
                    .setBlendMode(Phaser.BlendModes.ADD).setTint(color).setAlpha(0.0);
                shaft.setDisplaySize(140 + rnd() * 160, floorY + 40);
                shaft.setRotation(-0.18 + (rnd() - 0.5) * 0.12);
                const peak = 0.1 + rnd() * 0.1;
                this.scene.tweens.add({ targets: shaft, alpha: { from: peak * 0.5, to: peak }, duration: 3000 + rnd() * 3000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            }
            c += 25 + Math.floor(rnd() * 45);
        }
    }
}
