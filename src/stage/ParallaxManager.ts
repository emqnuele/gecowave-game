import Phaser from 'phaser';
import { ZONE_HEX } from '../config';
import type { BiomeDef } from '../content/biomes';
import { hex } from '../art/ink';
import { FG_H, foregroundCanvas, skylineCanvas } from '../art/silhouettes';
import type { ZoneColor } from '../types';

/* dal fondo verso il giocatore: cielo, dipinto, velo di foschia,
   tre piani di sagome, poi la nebbia e il primo piano nero davanti */

interface Strip {
    sprite: Phaser.GameObjects.TileSprite;
    speedX: number;
    speedY: number;
    /** di quanto la base sporge sotto il bordo dello schermo */
    sink: number;
    anchor: 'bottom' | 'top';
    driftX?: number;
}

interface Painted {
    sprite: Phaser.GameObjects.TileSprite;
    /** la tilesprite ha una texture interna sua: la scala va presa dalla sorgente */
    sourceKey: string;
    speed: number;
}

export class ParallaxManager {
    private scene: Phaser.Scene;
    private strips: Strip[] = [];
    private painted: Painted | null = null;
    private sky: Phaser.GameObjects.Image | null = null;
    private veil: Phaser.GameObjects.Image | null = null;
    private fog: Phaser.GameObjects.TileSprite | null = null;
    /** quota del terreno su cui poggiano le sagome, in pixel del mondo */
    private groundY = 0;
    /** margine del dipinto oltre lo schermo: serve solo a chi lo fa ondeggiare (il menu) */
    private swayRoom = 0;
    /** ondeggiamento del dipinto, -1..1 per asse */
    readonly sway = { x: 0, y: 0 };
    private onResize = () => this.resize();

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    /** zona null: il dipinto non prende tinta, è il fondale del titolo */
    build(zone: ZoneColor | null, levelId: string, biome: BiomeDef, groundY: number): void {
        this.groundY = groundY;
        const key = (k: string) => `${k}-${biome.id}`;

        this.sky = this.scene.add.image(0, 0, this.gradientTexture(key('sky'), [[0, hex(biome.skyTop)], [1, hex(biome.skyBottom)]]))
            .setOrigin(0.5).setScrollFactor(0).setDepth(-30);

        // il dipinto del capitolo resta il fondale: è lo stile del gioco
        const legacy = zone === 'red' || zone === 'orange' || zone === 'cyan' ? 'background2' : 'background';
        const paintedKey = levelId !== 'perduta' && this.scene.textures.exists(`bg-painted-${levelId}`) ? `bg-painted-${levelId}` : legacy;
        if (this.scene.textures.exists(paintedKey)) {
            const sprite = this.scene.add.tileSprite(0, 0, 16, 16, paintedKey).setOrigin(0.5).setScrollFactor(0).setDepth(-20);
            if (zone) {
                const tint = Phaser.Display.Color.IntegerToColor(ZONE_HEX[zone]);
                const s = paintedKey === legacy ? 0.4 : 0.14;
                sprite.setTint(Phaser.Display.Color.GetColor(
                    Math.round(255 * (1 - s) + tint.red * s),
                    Math.round(255 * (1 - s) + tint.green * s),
                    Math.round(255 * (1 - s) + tint.blue * s),
                ));
            }
            this.painted = { sprite, sourceKey: paintedKey, speed: 0.03 };
        }

        // velo di foschia sul dipinto: lo spinge indietro e lo intona al bioma
        this.veil = this.scene.add.image(0, 0, this.gradientTexture(key('veil'), [
            [0, hex(biome.skyTop, 0.3)],
            [0.55, hex(biome.haze, 0.08)],
            [1, hex(biome.haze, 0.38)],
        ])).setOrigin(0.5).setScrollFactor(0).setDepth(-19);

        const layers: { depth: number; speedX: number; speedY: number; sink: number; z: number }[] = [
            { depth: 0, speedX: 0.12, speedY: 0.05, sink: -40, z: -16 },
            { depth: 1, speedX: 0.26, speedY: 0.1, sink: 10, z: -14 },
            { depth: 2, speedX: 0.48, speedY: 0.18, sink: 60, z: -12 },
        ];
        for (const l of layers) {
            const tex = key(`sky${l.depth}`);
            if (!this.scene.textures.exists(tex)) this.scene.textures.addCanvas(tex, skylineCanvas(biome, l.depth));
            const src = this.scene.textures.get(tex).getSourceImage() as HTMLCanvasElement;
            const sprite = this.scene.add.tileSprite(0, 0, 16, src.height, tex).setOrigin(0.5, 1).setScrollFactor(0).setDepth(l.z);
            this.strips.push({ sprite, speedX: l.speedX, speedY: l.speedY, sink: l.sink, anchor: 'bottom' });
        }

        if (this.scene.textures.exists('fog')) {
            this.fog = this.scene.add.tileSprite(0, 0, 16, 16, 'fog').setOrigin(0.5).setScrollFactor(0).setDepth(30).setAlpha(0.16);
        }

        for (const edge of ['top', 'bottom'] as const) {
            const el = foregroundCanvas(biome, edge);
            if (!el) continue;
            const tex = key(`fg-${edge}`);
            if (!this.scene.textures.exists(tex)) this.scene.textures.addCanvas(tex, el);
            const sprite = this.scene.add.tileSprite(0, 0, 16, FG_H, tex)
                .setOrigin(0.5, edge === 'bottom' ? 1 : 0).setScrollFactor(0).setDepth(20).setAlpha(0.92);
            // il primo piano incornicia: si muove solo in orizzontale, più veloce del mondo
            this.strips.push({ sprite, speedX: 1.35, speedY: 0, sink: edge === 'bottom' ? 70 : 60, anchor: edge });
        }

        this.resize();
        this.scene.scale.on('resize', this.onResize);
        this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.scene.scale.off('resize', this.onResize);
            this.strips = [];
            this.painted = null;
            this.sky = null;
            this.veil = null;
            this.fog = null;
        });
    }

    private gradientTexture(key: string, stops: [number, string][]): string {
        if (this.scene.textures.exists(key)) return key;
        const el = document.createElement('canvas');
        el.width = 4;
        el.height = 256;
        const ctx = el.getContext('2d')!;
        const g = ctx.createLinearGradient(0, 0, 0, 256);
        for (const [t, c] of stops) g.addColorStop(t, c);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 4, 256);
        this.scene.textures.addCanvas(key, el);
        return key;
    }

    /** viewport in coordinate scrollFactor 0, tenendo conto dello zoom centrato */
    private view(): { cx: number; cy: number; w: number; h: number } {
        const cam = this.scene.cameras.main;
        return { cx: cam.width / 2, cy: cam.height / 2, w: cam.width / cam.zoom + 8, h: cam.height / cam.zoom + 8 };
    }

    /** il dipinto può ondeggiare di tanti pixel per lato senza scoprire i bordi */
    allowSway(px: number): void {
        this.swayRoom = px;
        this.resize();
    }

    resize(): void {
        const v = this.view();
        for (const img of [this.sky, this.veil]) {
            if (!img) continue;
            img.setPosition(v.cx, v.cy);
            img.setDisplaySize(v.w, v.h);
        }
        if (this.painted) {
            const sp = this.painted.sprite;
            const ph = v.h + this.swayRoom * 2;
            sp.setSize(Math.ceil(v.w), Math.ceil(ph));
            sp.setPosition(v.cx, v.cy);
            const tex = this.scene.textures.get(this.painted.sourceKey).getSourceImage() as HTMLImageElement;
            if (tex.height) sp.setTileScale(ph / tex.height, ph / tex.height);
        }
        if (this.fog) {
            this.fog.setSize(Math.ceil(v.w), Math.ceil(v.h));
            this.fog.setPosition(v.cx, v.cy);
        }
        for (const s of this.strips) s.sprite.width = Math.ceil(v.w);
    }

    update(time: number): void {
        const cam = this.scene.cameras.main;
        const v = this.view();
        const left = v.cx - v.w / 2;
        const top = v.cy - v.h / 2;
        const bottom = top + v.h;
        // riferimento verticale: il fondo della vista appoggiato al terreno.
        // sotto terra le sagome salgono e spariscono, sopra scendono piano
        const rise = this.groundY - (cam.scrollY + cam.height / cam.zoom);

        if (this.painted) {
            const sp = this.painted.sprite;
            sp.tilePositionX = (cam.scrollX * this.painted.speed + this.sway.x * this.swayRoom) / sp.tileScaleX;
            sp.y = v.cy - this.sway.y * this.swayRoom;
        }
        if (this.fog) this.fog.tilePositionX = cam.scrollX * 1.15 + time * 0.006;

        for (const s of this.strips) {
            s.sprite.x = left + v.w / 2;
            s.sprite.tilePositionX = cam.scrollX * s.speedX;
            // nel menu i piani vicini seguono il mouse anche in verticale; in gioco swayRoom è zero
            const lift = this.sway.y * this.swayRoom * s.speedX * 1.2;
            if (s.anchor === 'bottom') {
                s.sprite.y = bottom + s.sink + rise * s.speedY - lift;
            } else {
                s.sprite.y = top - s.sink - lift;
            }
        }
    }
}
