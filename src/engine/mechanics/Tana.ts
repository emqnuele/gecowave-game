import Phaser from 'phaser';
import { TILE } from '../../config';
import { BOSS_BARKS } from '../../content/barks';
import { bus } from '../events';
import { music } from '../music';
import { sfx } from '../sfx';
import { state } from '../state';
import { QUIET_ROOMS, seeded, type Mechanic, type MechanicCtx } from './types';

/* la tana di lochef85: buio, sussurri e nascondigli.
   tutto a runtime come trappole e lastre: la griglia verificata non si tocca */

const DARK_AMBIENT = 0x07040a;
const HIDE_MAX_MS = 6000;

interface Hideout {
    x: number;
    y: number;
    sprite: Phaser.GameObjects.Image;
    light: Phaser.GameObjects.Light | null;
    removeInteract: () => void;
    used: boolean;
}

export class Tana implements Mechanic {
    private ctx: MechanicCtx;
    private ambientBefore: number | null = null;
    private lightBefore: { radius: number; intensity: number } | null = null;
    private hideouts: Hideout[] = [];
    private dialogueOpen = false;
    private offStart: () => void;
    private offEnd: () => void;
    private rnd = seeded('tana:sussurri');
    private nextWhisperAt = 0;
    private lastWhisper = -1;
    private hiddenIn: Hideout | null = null;
    private hiddenSince = 0;
    private nextBeatAt = 0;
    private wasChasing = false;
    private tutorialDone = false;

    constructor(ctx: MechanicCtx) {
        this.ctx = ctx;
        this.ensureTextures();
        this.darken();
        this.offStart = bus.on('dialogue-start', () => { this.dialogueOpen = true; });
        this.offEnd = bus.on('dialogue-end', () => { this.dialogueOpen = false; });
        this.nextWhisperAt = ctx.scene.time.now + 25000 + this.rnd() * 20000;
        const rnd = seeded('tana:nascondigli');
        const ranges = ctx.chaseRanges();
        const rooms = ctx.layout.rooms
            .filter((r) => r.pathIndex >= 0 && !QUIET_ROOMS.has(r.kind)
                && (ranges.length === 0 || ranges.some((g) => r.pathIndex + 0.5 >= g.start && r.pathIndex + 0.5 < g.end)))
            .sort((a, b) => a.pathIndex - b.pathIndex);
        const avoid = [...ctx.avoid];
        // un armadio ogni due o tre stanze del percorso di caccia
        for (let i = 0; i < rooms.length; i += 2 + Math.floor(rnd() * 2)) {
            this.placeIn(rooms[i]!, rnd, avoid);
        }
    }

    private placeIn(room: { id: number; rect: { x: number; y: number; w: number; h: number } }, rnd: () => number, avoid: { x: number; y: number }[]): void {
        const segs = this.ctx.nav.segments.filter((s) =>
            s.r > room.rect.y + 2 && s.r < room.rect.y + room.rect.h - 1 && s.c0 >= room.rect.x && s.c1 < room.rect.x + room.rect.w && s.c1 - s.c0 >= 3,
        );
        for (let tries = 0; tries < 6 && segs.length; tries++) {
            const seg = segs[Math.floor(rnd() * segs.length)]!;
            const c = seg.c0 + 1 + Math.floor(rnd() * (seg.c1 - seg.c0 - 1));
            // due celle libere sopra: l'armadio è alto due tile
            if (!this.ctx.nav.free(c, seg.r - 1) || !this.ctx.nav.free(c, seg.r - 2)) continue;
            const x = c * TILE + TILE / 2;
            const floorY = (seg.r + 1) * TILE;
            if (avoid.some((p) => Math.abs(p.x - x) < 200 && Math.abs(p.y - floorY) < 260)) continue;
            avoid.push({ x, y: floorY });
            const sprite = this.ctx.scene.add.image(x, floorY, 'tana-armadio').setOrigin(0.5, 1).setDepth(4).setPipeline('Light2D');
            const light = this.ctx.lighting.static(x, floorY - 40, 0xfde68a, 90, 0.5);
            const wh: Hideout = {
                x, y: floorY - 30, sprite, light, used: false,
                removeInteract: () => undefined,
            };
            wh.removeInteract = this.ctx.addInteractable(x, floorY - 30, 70, () => {
                if (this.ctx.player.hidden) {
                    if (this.hiddenIn === wh) this.unhide(false);
                } else {
                    this.tryHide(wh);
                }
            });
            this.hideouts.push(wh);
            return;
        }
    }

    update(): void {
        const now = this.ctx.scene.time.now;
        const chasing = this.ctx.chaseRunning();
        // la prima caccia insegna il nascondiglio, una volta sola
        if (chasing && !this.tutorialDone) {
            this.tutorialDone = true;
            if (!state.hasFlag('spiegato-nascondiglio')) {
                state.setFlag('spiegato-nascondiglio');
                bus.emit('toast', { text: 'un armadio. E per nasconderti.' });
                const first = this.hideouts[0];
                if (first && !first.used) this.ctx.scene.tweens.add({ targets: first.sprite, alpha: 0.55, duration: 500, yoyo: true, repeat: 3 });
            }
        }
        // fine caccia: le ante si richiudono e chi era dentro esce
        if (this.wasChasing && !chasing) {
            for (const wh of this.hideouts) {
                wh.used = false;
                wh.sprite.setTexture('tana-armadio');
            }
            if (this.ctx.player.hidden) this.unhide(false);
        }
        this.wasChasing = chasing;
        // da nascosto la musica si ovatta e il cuore batte
        const p = this.ctx.player;
        if (p.hidden) {
            if (now >= this.nextBeatAt) {
                this.nextBeatAt = now + 880;
                try { sfx.heartbeat(0.8); } catch { /* senza audio non si muore */ }
            }
            if (p.movePressed) this.unhide(false);
            else if (now - this.hiddenSince > HIDE_MAX_MS) this.unhide(true);
            return;
        }
        // la voce dalla casa: mai in caccia, mai sopra un dialogo
        if (!chasing && !this.dialogueOpen && !p.dead && now >= this.nextWhisperAt) {
            this.nextWhisperAt = now + 25000 + this.rnd() * 20000;
            this.whisper();
        }
    }

    private tryHide(wh: Hideout): void {
        const p = this.ctx.player;
        if (p.hidden || p.dead || wh.used || !this.ctx.chaseRunning()) return;
        p.hidden = true;
        p.setAlpha(0.1);
        wh.used = true;
        this.hiddenIn = wh;
        this.hiddenSince = this.ctx.scene.time.now;
        this.nextBeatAt = 0;
        music.setGraveDuck(true);
    }

    private unhide(found: boolean): void {
        const p = this.ctx.player;
        const wh = this.hiddenIn;
        this.hiddenIn = null;
        if (p.active) {
            p.hidden = false;
            p.setAlpha(1);
        } else {
            p.hidden = false;
        }
        music.setGraveDuck(false);
        if (wh) wh.sprite.setTexture(wh.used ? 'tana-armadio-aperto' : 'tana-armadio');
        // dopo un'uscita la voce aspetta: niente sussurro addosso
        this.nextWhisperAt = Math.max(this.nextWhisperAt, this.ctx.scene.time.now + 15000);
        // oltre i sei secondi la casa ti sente: fuori, un danno, e lui è già lì
        if (found) {
            p.hurt(1);
            bus.emit('tana-sniffed', {});
        }
    }

    private whisper(): void {
        const set = BOSS_BARKS.lochef?.extra?.whisper ?? [];
        if (!set.length) return;
        let i = Math.floor(this.rnd() * set.length);
        if (set.length > 1 && i === this.lastWhisper) i = (i + 1) % set.length;
        this.lastWhisper = i;
        const raw = set[i]!;
        bus.emit('bark', { speaker: 'lochef85', color: 'red', text: typeof raw === 'string' ? raw : raw.text });
        try {
            sfx.whisper(-0.4, 0.8);
            sfx.growlFar(0.4, 0.7);
        } catch { /* senza audio non si muore */ }
    }

    /** il buio della tana: la luce la porti tu, e ne porti poca */
    private darken(): void {
        const lights = this.ctx.scene.lights;
        const a = lights.ambientColor;
        this.ambientBefore = a ? Phaser.Display.Color.GetColor(Math.round(a.r * 255), Math.round(a.g * 255), Math.round(a.b * 255)) : null;
        lights.setAmbientColor(DARK_AMBIENT);
        const pl = this.ctx.playerLight;
        this.lightBefore = { radius: pl.radius, intensity: pl.intensity };
        pl.setRadius(230);
        pl.setIntensity(1.1);
    }

    private ensureTextures(): void {
        const scene = this.ctx.scene;
        if (scene.textures.exists('tana-armadio')) return;
        const paint = (key: string, open: boolean) => {
            const g = scene.add.graphics();
            // corpo scuro, contorno spesso, ante socchiuse con un filo di luce
            g.fillStyle(0x241a20, 1);
            g.fillRect(4, 2, 32, 60);
            if (open) {
                g.fillStyle(0x3a2a30, 1);
                g.fillRect(9, 8, 22, 48);
                g.fillStyle(0xfde68a, 0.9);
                g.fillRect(18, 8, 4, 48);
            } else {
                g.fillStyle(0xfde68a, 0.75);
                g.fillRect(19, 8, 2, 48);
            }
            g.lineStyle(3, 0x0b0c10, 1);
            g.strokeRect(4, 2, 32, 60);
            g.lineStyle(1.5, 0x0b0c10, 1);
            g.lineBetween(20, 4, 20, 60);
            g.fillStyle(0x0b0c10, 1);
            g.fillCircle(17, 34, 1.4);
            g.fillCircle(23, 34, 1.4);
            g.generateTexture(key, 40, 64);
            g.destroy();
        };
        paint('tana-armadio', false);
        paint('tana-armadio-aperto', true);
    }

    destroy(): void {
        this.offStart();
        this.offEnd();
        const p = this.ctx.player;
        p.hidden = false;
        if (p.active) p.setAlpha(1);
        music.setGraveDuck(false);
        for (const wh of this.hideouts) {
            wh.removeInteract();
            if (wh.light) this.ctx.lighting.remove(wh.light);
            wh.sprite.destroy();
        }
        this.hideouts = [];
        this.hiddenIn = null;
        if (this.ambientBefore !== null) this.ctx.scene.lights.setAmbientColor(this.ambientBefore);
        if (this.lightBefore) {
            this.ctx.playerLight.setRadius(this.lightBefore.radius);
            this.ctx.playerLight.setIntensity(this.lightBefore.intensity);
        }
    }
}
