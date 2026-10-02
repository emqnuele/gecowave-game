import Phaser from 'phaser';
import type { BiomeDef } from '../content/biomes';
import { sfx } from './sfx';
import { state } from './state';

/* il cielo che cambia: un orologio del realm (un giorno ogni 12 minuti di gioco)
   che tinge il cielo, e un meteo per bioma che gira da solo. tutto ciò che cade
   dal cielo si vede solo all'aperto: sotto terra resta il rumore lontano */

export type Weather = 'sereno' | 'pioggia' | 'temporale' | 'nebbia' | 'vento' | 'cenere';

const DAY_MS = 12 * 60 * 1000;

/** che tempo può fare in ogni bioma, con i pesi */
const CLIMATE: Record<string, [Weather, number][]> = {
    crater: [['sereno', 4], ['pioggia', 3], ['nebbia', 2], ['temporale', 1]],
    depot: [['sereno', 4], ['pioggia', 3], ['vento', 2], ['temporale', 1]],
    sanctum: [['sereno', 5], ['nebbia', 3]],
    wasteland: [['sereno', 3], ['vento', 3], ['cenere', 3]],
    swamp: [['pioggia', 4], ['nebbia', 3], ['temporale', 2], ['sereno', 2]],
    library: [['sereno', 4], ['pioggia', 3], ['nebbia', 2]],
    noir: [['pioggia', 5], ['temporale', 3]],
    province: [['sereno', 4], ['pioggia', 2], ['vento', 2]],
};

/** fase del giorno 0..1: 0 alba, 0.25 mezzogiorno, 0.55 tramonto, 0.75 mezzanotte */
export function dayPhase(): number {
    return ((state.save.record.playMs + DAY_MS * 0.12) % DAY_MS) / DAY_MS;
}

/** l'ora del realm per il telefono */
export function realmClock(): string {
    const minutes = Math.floor(((dayPhase() * 24 + 6) % 24) * 60);
    return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

export class Atmosphere {
    private scene: Phaser.Scene;
    private biome!: BiomeDef;
    private sky!: Phaser.GameObjects.Rectangle;
    private stars!: Phaser.GameObjects.TileSprite;
    private flash!: Phaser.GameObjects.Rectangle;
    private fogBank!: Phaser.GameObjects.TileSprite;
    private rain: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
    private dust: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
    private rainZone = new Phaser.Geom.Rectangle(0, 0, 10, 10);
    weather: Weather = 'sereno';
    private next: Weather = 'sereno';
    /** 0..1: quanto il tempo in corso è arrivato */
    private amount = 0;
    private changeAt = 0;
    private nextBoltAt = 0;
    private outdoor = 1;
    private climate: [Weather, number][] = [];

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    build(biome: BiomeDef, seedKey: string): void {
        this.biome = biome;
        this.climate = biome.indoor ? [] : CLIMATE[biome.id] ?? [['sereno', 1]];
        // la tinta del cielo sta sopra il parallasse e sotto le stanze: la roccia resta com'è
        this.sky = this.scene.add.rectangle(0, 0, 16, 16, 0x000000, 0).setOrigin(0.5).setScrollFactor(0).setDepth(-6);
        this.stars = this.scene.add.tileSprite(0, 0, 16, 16, this.starTexture()).setOrigin(0.5).setScrollFactor(0).setDepth(-28).setAlpha(0);
        this.fogBank = this.scene.add.tileSprite(0, 0, 16, 16, 'fog').setOrigin(0.5).setScrollFactor(0).setDepth(19).setAlpha(0);
        this.flash = this.scene.add.rectangle(0, 0, 16, 16, 0xe8f0ff, 0).setOrigin(0.5).setScrollFactor(0).setDepth(29);
        if (!this.scene.textures.exists('p-rain')) {
            const g = this.scene.add.graphics();
            g.fillStyle(0xcfe3ff, 0.7);
            g.fillRect(0, 0, 2, 16);
            g.generateTexture('p-rain', 2, 16);
            g.destroy();
        }
        if (this.climate.length) {
            this.rain = this.scene.add.particles(0, 0, 'p-rain', {
                emitZone: { type: 'random', source: this.rainZone as unknown as Phaser.Types.GameObjects.Particles.RandomZoneSource, quantity: 1 },
                speedY: { min: 900, max: 1200 },
                speedX: { min: -120, max: -60 },
                lifespan: 900,
                quantity: 0,
                frequency: 16,
                alpha: { start: 0.5, end: 0.2 },
                rotate: 6,
            }).setDepth(21);
            this.dust = this.scene.add.particles(0, 0, 'p-dot', {
                emitZone: { type: 'random', source: this.rainZone as unknown as Phaser.Types.GameObjects.Particles.RandomZoneSource, quantity: 1 },
                speedX: { min: -620, max: -380 },
                speedY: { min: -40, max: 60 },
                lifespan: 1400,
                quantity: 0,
                frequency: 20,
                scale: { start: 0.35, end: 0.1 },
                alpha: { start: 0.45, end: 0 },
                tint: this.biome.id === 'wasteland' ? 0x8a7560 : 0xb0b8c0,
            }).setDepth(21);
            // il tempo d'arrivo dipende dal capitolo e dall'ora: entrare due volte non è uguale
            let h = 0;
            for (const ch of seedKey) h = (h * 33 + ch.charCodeAt(0)) | 0;
            this.weather = this.pick((Math.abs(h) % 997) / 997 * 0.5 + dayPhase() * 0.5);
            this.amount = this.weather === 'sereno' ? 0 : 1;
            this.changeAt = this.scene.time.now + 60000 + Math.random() * 60000;
        }
        this.resize();
        const onResize = () => this.resize();
        this.scene.scale.on('resize', onResize);
        this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.scene.scale.off('resize', onResize);
            sfx.setRain(0);
        });
    }

    private pick(roll: number): Weather {
        const total = this.climate.reduce((s, [, w]) => s + w, 0);
        let x = roll * total;
        for (const [w, n] of this.climate) {
            x -= n;
            if (x <= 0) return w;
        }
        return this.climate[0]?.[0] ?? 'sereno';
    }

    private starTexture(): string {
        const key = 'sky-stars';
        if (this.scene.textures.exists(key)) return key;
        const el = document.createElement('canvas');
        el.width = 256;
        el.height = 256;
        const ctx = el.getContext('2d')!;
        for (let i = 0; i < 70; i++) {
            const a = Math.random();
            ctx.fillStyle = `rgba(230,240,255,${0.25 + a * 0.6})`;
            const r = a > 0.92 ? 1.6 : 0.8;
            ctx.beginPath();
            ctx.arc(Math.random() * 256, Math.random() * 256, r, 0, Math.PI * 2);
            ctx.fill();
        }
        this.scene.textures.addCanvas(key, el);
        return key;
    }

    private resize(): void {
        const cam = this.scene.cameras.main;
        const w = cam.width / cam.zoom + 8;
        const h = cam.height / cam.zoom + 8;
        for (const o of [this.sky, this.flash]) o.setPosition(cam.width / 2, cam.height / 2).setSize(w, h);
        for (const t of [this.stars, this.fogBank]) t.setPosition(cam.width / 2, cam.height / 2).setSize(w, h);
    }

    /** outdoor = quanto il player sta all'aperto (0 sotto terra, 1 in superficie) */
    update(time: number, delta: number, outdoor: boolean): void {
        this.outdoor += ((outdoor ? 1 : 0) - this.outdoor) * Math.min(1, delta / 600);
        this.updateDay();
        if (!this.climate.length) return;
        // cambio di tempo: il vecchio sfuma, il nuovo entra
        if (time >= this.changeAt) {
            this.changeAt = time + 70000 + Math.random() * 70000;
            this.next = this.pick(Math.random());
        }
        if (this.next !== this.weather) {
            this.amount = Math.max(0, this.amount - delta / 4000);
            if (this.amount <= 0) this.weather = this.next;
        } else if (this.weather !== 'sereno') {
            this.amount = Math.min(1, this.amount + delta / 5000);
        }
        const cam = this.scene.cameras.main.worldView;
        this.rainZone.setTo(cam.x - 100, cam.y - 140, cam.width + 300, 40);
        const k = this.amount * this.outdoor;
        const wet = this.weather === 'pioggia' || this.weather === 'temporale';
        const rainLevel = wet ? k * (this.weather === 'temporale' ? 1 : 0.6) : 0;
        if (this.rain) {
            this.rain.quantity = rainLevel > 0.05 ? Math.ceil(rainLevel * 6) : 0;
            this.rain.setVisible(rainLevel > 0.05);
        }
        // sotto terra la pioggia si sente ancora, attutita
        sfx.setRain(wet ? this.amount * (0.25 + 0.75 * this.outdoor) : 0);
        const windy = this.weather === 'vento' || this.weather === 'cenere';
        if (this.dust) {
            this.dust.quantity = windy && k > 0.05 ? Math.ceil(k * 3) : 0;
            this.dust.setVisible(windy && k > 0.05);
            this.dust.setParticleTint(this.weather === 'cenere' ? 0x3a3434 : this.biome.id === 'wasteland' ? 0x8a7560 : 0xb0b8c0);
        }
        const foggy = this.weather === 'nebbia' ? k : wet ? k * 0.3 : 0;
        this.fogBank.setAlpha(foggy * 0.42);
        this.fogBank.tilePositionX += delta * (windy ? 0.25 : 0.03);
        this.fogBank.tilePositionY = Math.sin(time / 5000) * 20;
        if (this.weather === 'temporale' && k > 0.5 && time >= this.nextBoltAt) {
            this.nextBoltAt = time + 5000 + Math.random() * 9000;
            this.bolt();
        }
    }

    /** lampo: due bagliori ravvicinati, il tuono arriva dopo */
    private bolt(): void {
        const a = 0.35 + 0.35 * this.outdoor;
        this.scene.tweens.add({
            targets: this.flash,
            fillAlpha: { from: a, to: 0 },
            duration: 140,
            yoyo: false,
            onComplete: () => this.scene.tweens.add({ targets: this.flash, fillAlpha: { from: a * 0.7, to: 0 }, duration: 380, delay: 70 }),
        });
        this.scene.time.delayedCall(300 + Math.random() * 900, () => sfx.thunder());
    }

    /** il cielo: blu profondo di notte, arancio al tramonto, niente di giorno */
    private updateDay(): void {
        const p = dayPhase();
        let color = 0x000000;
        let alpha = 0;
        let starA = 0;
        if (p < 0.08) {
            color = 0x3a2a4a;
            alpha = 0.28 * (1 - p / 0.08);
        } else if (p < 0.5) {
            alpha = 0;
        } else if (p < 0.6) {
            const t = (p - 0.5) / 0.1;
            color = t < 0.5 ? 0x7a3a10 : 0x1a1440;
            alpha = 0.18 + t * 0.2;
            starA = Math.max(0, t - 0.5);
        } else {
            color = 0x05081a;
            alpha = 0.45;
            starA = 1;
        }
        if (this.biome.indoor) {
            alpha = 0;
            starA = 0;
        }
        this.sky.setFillStyle(color, alpha);
        // le stelle si vedono solo col cielo pulito
        const clear = this.weather === 'sereno' ? 1 : 1 - this.amount;
        this.stars.setAlpha(starA * clear * 0.8);
    }

    /** di notte le luci contano di più: un moltiplicatore per l'ambiente all'aperto */
    get night(): number {
        const p = dayPhase();
        if (p >= 0.6) return 1;
        if (p >= 0.5) return (p - 0.5) / 0.1;
        if (p < 0.08) return 1 - p / 0.08;
        return 0;
    }
}
