import Phaser from 'phaser';
import { ZONE_HEX } from '../config';
import type { BiomeDef } from '../content/biomes';
import { hex, mix } from '../art/ink';
import { Mist } from '../art/fx/Mist';
import { FG_H, foregroundCanvas } from '../art/scenery/foreground';
import { LAYER_H, sceneryCanvas } from '../art/scenery/layers';
import { samplePalette } from '../art/scenery/palette';
import type { ZoneColor } from '../types';

/* dal fondo verso il giocatore: cielo, dipinto, velo di foschia, tre piani di sagome
   con la foschia viva in mezzo, poi il primo piano nero e la nebbia davanti */

interface Strip {
    sprite: Phaser.GameObjects.TileSprite;
    speedX: number;
    speedY: number;
    /** di quanto la base sporge sotto il bordo dello schermo */
    sink: number;
    anchor: 'bottom' | 'top';
    /** il primo piano ondeggia appena, come mosso dall'aria */
    breathe?: number;
    /** quanto segue l'ondeggiamento del menu, in frazioni di swayRoom: lo sfondo molto, i props poco */
    swayK: number;
}

interface Painted {
    sprite: Phaser.GameObjects.TileSprite;
    /** la tilesprite ha una texture interna sua: la scala va presa dalla sorgente */
    sourceKey: string;
    /** larghezza di un solo dipinto dentro la texture a specchio, in pixel sorgente */
    oneWidth: number;
}

/** quanto scorre il dipinto al massimo: è lontanissimo */
const PAINTED_SPEED = 0.03;
/** oltre questa larghezza certe schede video rifiutano la texture */
const LOOP_MAX_W = 4096;

export class ParallaxManager {
    private scene: Phaser.Scene;
    private strips: Strip[] = [];
    private painted: Painted | null = null;
    private sky: Phaser.GameObjects.Image | null = null;
    private veil: Phaser.GameObjects.Image | null = null;
    private fog: Phaser.GameObjects.TileSprite | null = null;
    /** foschia tra i piani e nebbia davanti: null senza webgl */
    private mists: { mist: Mist; speedX: number; speedY: number; front: boolean }[] = [];
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
        let tint = 0xffffff;
        if (zone) {
            const c = Phaser.Display.Color.IntegerToColor(ZONE_HEX[zone]);
            const s = paintedKey === legacy ? 0.4 : 0.14;
            tint = Phaser.Display.Color.GetColor(
                Math.round(255 * (1 - s) + c.red * s),
                Math.round(255 * (1 - s) + c.green * s),
                Math.round(255 * (1 - s) + c.blue * s),
            );
        }
        const hasPainted = this.scene.textures.exists(paintedKey);
        if (hasPainted) {
            const loop = this.loopTexture(paintedKey);
            const sprite = this.scene.add.tileSprite(0, 0, 16, 16, loop.key).setOrigin(0.5).setScrollFactor(0).setDepth(-20);
            sprite.setTint(tint);
            this.painted = { sprite, sourceKey: loop.key, oneWidth: loop.oneWidth };
        }
        // i piani prendono i colori dal dipinto: sembrano usciti dallo stesso pennello
        const source = hasPainted ? (this.scene.textures.get(paintedKey).getSourceImage() as HTMLImageElement) : null;
        const palette = samplePalette(source, biome, tint);
        const sceneKey = `${paintedKey}:${zone ?? 'none'}:${biome.id}`;

        // velo di foschia sul dipinto: lo spinge indietro e lo intona al bioma
        this.veil = this.scene.add.image(0, 0, this.gradientTexture(key('veil'), [
            [0, hex(biome.skyTop, 0.3)],
            [0.55, hex(biome.haze, 0.08)],
            [1, hex(biome.haze, 0.38)],
        ])).setOrigin(0.5).setScrollFactor(0).setDepth(-19);

        const layers: { depth: number; speedX: number; speedY: number; sink: number; z: number; swayK: number }[] = [
            { depth: 0, speedX: 0.12, speedY: 0.05, sink: -40, z: -16, swayK: 0.85 },
            { depth: 1, speedX: 0.26, speedY: 0.1, sink: 10, z: -14, swayK: 0.65 },
            { depth: 2, speedX: 0.48, speedY: 0.18, sink: 60, z: -12, swayK: 0.45 },
        ];
        for (const l of layers) {
            const tex = `scn-${sceneKey}-${l.depth}`;
            if (!this.scene.textures.exists(tex)) this.scene.textures.addCanvas(tex, sceneryCanvas(sceneKey, biome, palette, l.depth));
            const sprite = this.scene.add.tileSprite(0, 0, 16, LAYER_H[l.depth], tex).setOrigin(0.5, 1).setScrollFactor(0).setDepth(l.z);
            this.strips.push({ sprite, speedX: l.speedX, speedY: l.speedY, sink: l.sink, anchor: 'bottom', swayK: l.swayK });
        }

        // la foschia vive tra un piano e l'altro: li stacca e li lega al dipinto
        const haze = mix(palette.haze, palette.floor, 0.35);
        const between = [
            { depth: -15, speedX: 0.18, speedY: 0.07, look: { color: haze, alpha: 0.5, scale: 300, band: [0.42, 1.02] as [number, number], floor: 0.5 } },
            { depth: -13, speedX: 0.36, speedY: 0.14, look: { color: mix(haze, palette.dark, 0.25), alpha: 0.44, scale: 230, band: [0.56, 1.06] as [number, number], floor: 0.6 } },
        ];
        for (const m of between) {
            const mist = Mist.add(this.scene, m.depth, m.look);
            if (mist) this.mists.push({ mist, speedX: m.speedX, speedY: m.speedY, front: false });
        }
        const front = Mist.add(this.scene, 30, { color: mix(palette.haze, 0xaab4c8, 0.5), alpha: 0.1, scale: 380, band: [-0.5, 1.1], floor: 0 });
        if (front) this.mists.push({ mist: front, speedX: 1.15, speedY: 1, front: true });
        else if (this.scene.textures.exists('fog')) {
            this.fog = this.scene.add.tileSprite(0, 0, 16, 16, 'fog').setOrigin(0.5).setScrollFactor(0).setDepth(30).setAlpha(0.16);
        }

        for (const edge of ['top', 'bottom'] as const) {
            const el = foregroundCanvas(sceneKey, biome, palette, edge);
            if (!el) continue;
            const tex = `fg-${sceneKey}-${edge}`;
            if (!this.scene.textures.exists(tex)) this.scene.textures.addCanvas(tex, el);
            const sprite = this.scene.add.tileSprite(0, 0, 16, FG_H, tex)
                .setOrigin(0.5, edge === 'bottom' ? 1 : 0).setScrollFactor(0).setDepth(20).setAlpha(0.92);
            // il primo piano incornicia: si muove solo in orizzontale, più veloce del mondo
            this.strips.push({ sprite, speedX: 1.35, speedY: 0, sink: edge === 'bottom' ? 70 : 60, anchor: edge, swayK: 0.12, breathe: edge === 'top' ? 0 : 2.1 });
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
            this.mists = [];
        });
    }

    /** il dipinto e la sua copia allo specchio, uno accanto all'altra: quando si ripete non c'è più il taglio */
    private loopTexture(key: string): { key: string; oneWidth: number } {
        const loopKey = `${key}-loop`;
        const src = this.scene.textures.get(key).getSourceImage() as HTMLImageElement;
        const k = Math.min(1, LOOP_MAX_W / (src.width * 2));
        const w = Math.floor(src.width * k);
        const h = Math.floor(src.height * k);
        if (!this.scene.textures.exists(loopKey)) {
            const el = document.createElement('canvas');
            el.width = w * 2;
            el.height = h;
            const ctx = el.getContext('2d')!;
            ctx.drawImage(src, 0, 0, w, h);
            ctx.translate(w * 2, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(src, 0, 0, w, h);
            this.scene.textures.addCanvas(loopKey, el);
        }
        return { key: loopKey, oneWidth: w };
    }

    /** il dipinto attraversa il livello una volta sola: va da un capo all'altro senza mai ripetersi, se ci sta */
    private paintedSpeed(viewW: number): number {
        const cam = this.scene.cameras.main;
        if (!this.painted || !cam.useBounds) return PAINTED_SPEED;
        const span = cam.getBounds().width - viewW;
        if (span <= 0) return PAINTED_SPEED;
        const room = this.painted.oneWidth * this.painted.sprite.tileScaleX - viewW;
        return Math.max(0, Math.min(PAINTED_SPEED, room / span));
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
        for (const m of this.mists) m.mist.place(v.cx, v.cy, Math.ceil(v.w), Math.ceil(v.h));
        for (const s of this.strips) s.sprite.width = Math.ceil(v.w);
    }

    /** outdoor false: nelle stanze chiuse il primo piano svanisce, era fatto per incorniciare il cielo */
    update(time: number, outdoor = true): void {
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
            sp.tilePositionX = (cam.scrollX * this.paintedSpeed(v.w) + this.sway.x * this.swayRoom) / sp.tileScaleX;
            sp.y = v.cy - this.sway.y * this.swayRoom * 0.5;
        }
        if (this.fog) this.fog.tilePositionX = cam.scrollX * 1.15 + time * 0.006;
        for (const m of this.mists) {
            const sx = cam.scrollX * m.speedX + this.sway.x * this.swayRoom * 0.5;
            // la nebbia davanti segue il mondo; quella tra i piani sale e scende con loro
            if (m.front) m.mist.update(time, sx, cam.scrollY * 0.6);
            else m.mist.update(time, sx, 0, (rise * m.speedY) / v.h);
        }

        for (const s of this.strips) {
            s.sprite.x = left + v.w / 2;
            // nel menu ogni piano segue il mouse col suo peso; in gioco swayRoom è zero
            const breath = s.breathe === undefined ? 0 : Math.sin(time / 2300 + s.breathe) * 5;
            s.sprite.tilePositionX = cam.scrollX * s.speedX + this.sway.x * this.swayRoom * s.swayK + breath;
            const lift = this.sway.y * this.swayRoom * s.swayK * 0.5;
            if (s.speedX > 1) {
                const want = outdoor ? 0.92 : 0;
                s.sprite.alpha += (want - s.sprite.alpha) * 0.06;
                s.sprite.visible = s.sprite.alpha > 0.01;
            }
            if (s.anchor === 'bottom') {
                s.sprite.y = bottom + s.sink + rise * s.speedY - lift;
            } else {
                s.sprite.y = top - s.sink - lift;
            }
        }
    }
}
