import Phaser from 'phaser';
import { TILE } from '../config';
import { mix, mulberry32, shade } from './art/ink';
import type { NavGraph } from './nav/NavGraph';
import { sfx } from './sfx';
import type { RegionLayout, Room } from '../world/types';

/* pericoli del terreno che non toccano la griglia verificata:
   - lastre che crollano sopra i pozzi: solide solo dall'alto, quindi aggiungono
     strade senza toglierne nessuna (si passa da sotto, si cade come prima)
   - allagamenti periodici nelle stanze basse: l'acqua sale, rallenta, e dove è
     tossica morde. si ritira sempre, quindi non chiude niente per sempre */

const SLAB_H = 12;
const SHAKE_MS = 480;
const GONE_MS = 3600;

interface Slab {
    img: Phaser.Physics.Arcade.Image;
    x: number;
    y: number;
    /** 0 intera, 1 trema, 2 caduta */
    state: 0 | 1 | 2;
    at: number;
}

interface Flood {
    room: Room;
    /** quota in pixel dell'acqua a riposo (sotto il pavimento) e al massimo */
    low: number;
    high: number;
    level: number;
    period: number;
    phase: number;
    toxic: boolean;
    /** per riga: tratti d'aria [x0, x1) in pixel, dall'alto */
    runs: { y: number; x0: number; x1: number }[];
    gfx: Phaser.GameObjects.Graphics;
    color: number;
    /** orologio proprio: col temporale corre al doppio, senza salti di quota */
    clock: number;
    warned: boolean;
    cx: number;
    cy: number;
}

const QUIET = new Set(['start', 'rest', 'arena', 'exit', 'secret']);

/** probabilità di lastre per stanza e acqua per bioma */
const BY_BIOME: Record<string, { slabs: number; flood?: { rooms: number; toxic: boolean; color: number } }> = {
    crater: { slabs: 0.45 },
    depot: { slabs: 0.35, flood: { rooms: 2, toxic: false, color: 0x2b4a5c } },
    sanctum: { slabs: 0.5 },
    wasteland: { slabs: 0.4, flood: { rooms: 2, toxic: true, color: 0x4f7a1f } },
    lab: { slabs: 0.3, flood: { rooms: 3, toxic: true, color: 0x3f8f3a } },
    burrow: { slabs: 0.5, flood: { rooms: 2, toxic: false, color: 0x4a3a22 } },
    swamp: { slabs: 0.35, flood: { rooms: 4, toxic: true, color: 0x55702a } },
    factory: { slabs: 0.3, flood: { rooms: 2, toxic: true, color: 0x6b5a1e } },
    library: { slabs: 0.45 },
    mind: { slabs: 0.5 },
    noir: { slabs: 0.3, flood: { rooms: 3, toxic: false, color: 0x1f3446 } },
    servers: { slabs: 0.3 },
    cellar: { slabs: 0.4, flood: { rooms: 3, toxic: false, color: 0x3d2a3a } },
    memory: { slabs: 0.55, flood: { rooms: 1, toxic: false, color: 0x4a5876 } },
    void: { slabs: 0.6 },
    core: { slabs: 0.4 },
    province: { slabs: 0.3, flood: { rooms: 2, toxic: false, color: 0x2e4a52 } },
};

export interface HazardTarget {
    x: number;
    y: number;
    submerged: boolean;
    body: Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | null;
    hurt(amount: number, fromX?: number): boolean;
}

export class HazardManager {
    readonly slabs: Slab[] = [];
    readonly floods: Flood[] = [];
    readonly group: Phaser.Physics.Arcade.StaticGroup;
    private scene: Phaser.Scene;
    private nav: NavGraph;
    private stormy: () => boolean;
    private wasIn = false;
    private nextBite = 0;

    constructor(scene: Phaser.Scene, nav: NavGraph, stormy: () => boolean) {
        this.scene = scene;
        this.nav = nav;
        this.stormy = stormy;
        this.group = scene.physics.add.staticGroup();
    }

    populate(opts: { seed: string; biomeId: string; layout: RegionLayout | null; rim: number; deep: number; avoid: { x: number; y: number }[] }): void {
        const L = opts.layout;
        const cfg = BY_BIOME[opts.biomeId];
        if (!L || !cfg) return;
        let h = 0;
        for (const ch of opts.seed) h = (h * 31 + ch.charCodeAt(0)) | 0;
        const rnd = mulberry32(h ^ 0x51ab);
        this.ensureTexture(opts.biomeId, opts.rim, opts.deep);
        const clear = (x: number, y: number) => opts.avoid.every((p) => Math.abs(p.x - x) > 160 || Math.abs(p.y - y) > 140);
        for (const room of L.rooms) {
            if (QUIET.has(room.kind)) continue;
            if (rnd() < cfg.slabs) this.placeSlabs(room, L, rnd, clear, opts.biomeId);
        }
        if (cfg.flood) {
            const cands = L.rooms.filter((r) => !QUIET.has(r.kind) && (r.kind === 'pool' || r.sy + r.sh >= L.macroH - 1));
            // ordine stabile ma mescolato: le stanze allagabili non sono sempre le prime a sinistra
            const order = cands.map((r) => ({ r, k: rnd() })).sort((a, b) => a.k - b.k).map((o) => o.r);
            for (const room of order) {
                if (this.floods.length >= cfg.flood.rooms) break;
                this.placeFlood(room, L, rnd, cfg.flood.toxic, cfg.flood.color);
            }
        }
    }

    /** un pozzo tra due pavimenti alla stessa quota diventa un ponte di lastre */
    private placeSlabs(room: Room, L: RegionLayout, rnd: () => number, clear: (x: number, y: number) => boolean, biomeId: string): void {
        const R = room.rect;
        const segs = this.nav.segments
            .filter((s) => s.r > R.y + 1 && s.r < R.y + R.h - 2 && s.c0 > R.x && s.c1 < R.x + R.w - 1)
            .sort((a, b) => a.r - b.r || a.c0 - b.c0);
        let placed = 0;
        for (let i = 0; i < segs.length - 1 && placed < 2; i++) {
            const a = segs[i];
            const b = segs[i + 1];
            if (b.r !== a.r) continue;
            const g0 = a.c1 + 1;
            const g1 = b.c0 - 1;
            const gap = g1 - g0 + 1;
            if (gap < 3 || gap > 9) continue;
            let ok = true;
            for (let c = g0; c <= g1 && ok; c++) {
                if (this.nav.solid(c, a.r + 1)) ok = false;
                for (let k = 0; k <= 2 && ok; k++) if (!this.nav.free(c, a.r - k)) ok = false;
            }
            // un buco nel pavimento che porta alla stanza sotto resta un buco
            if (ok && L.doors.some((d) => d.axis === 'v' && d.y >= a.r && d.y <= a.r + 2 && d.x <= g1 && d.x + d.len > g0)) ok = false;
            const y = (a.r + 1) * TILE;
            if (!ok || !clear((g0 + g1 + 1) * TILE / 2, y) || rnd() < 0.25) continue;
            for (let c = g0; c <= g1; c++) this.addSlab(c * TILE + TILE / 2, y, biomeId);
            placed++;
        }
    }

    private addSlab(x: number, y: number, biomeId: string): void {
        const img = this.group.create(x, y + SLAB_H / 2, `hz-slab-${biomeId}`) as Phaser.Physics.Arcade.Image;
        img.setDepth(3).setPipeline('Light2D');
        const body = img.body as Phaser.Physics.Arcade.StaticBody;
        body.setSize(TILE, SLAB_H);
        body.checkCollision.down = false;
        body.checkCollision.left = false;
        body.checkCollision.right = false;
        img.refreshBody();
        this.slabs.push({ img, x, y: y + SLAB_H / 2, state: 0, at: 0 });
    }

    /** chi atterra dall'alto la fa tremare; la callback del collider passa di qui */
    landOn(img: Phaser.GameObjects.GameObject): void {
        const s = this.slabs.find((o) => o.img === img);
        if (!s || s.state !== 0) return;
        const now = this.scene.time.now;
        // tremano anche le vicine: il ponte cede tutto insieme, non una lastra per volta
        for (const o of this.slabs) {
            if (o.state === 0 && Math.abs(o.y - s.y) < 2 && Math.abs(o.x - s.x) <= TILE * 9 && this.contiguous(s, o)) {
                o.state = 1;
                o.at = now + Math.abs(o.x - s.x) * 1.4;
            }
        }
        sfx.crack();
    }

    private contiguous(a: Slab, b: Slab): boolean {
        const [l, r] = a.x < b.x ? [a, b] : [b, a];
        for (let x = l.x; x <= r.x; x += TILE) if (!this.slabs.some((o) => Math.abs(o.x - x) < 1 && Math.abs(o.y - a.y) < 2)) return false;
        return true;
    }

    /** i lati che contano solo da sopra: chi sale da sotto passa, chi cade da sopra si posa */
    canLand(player: HazardTarget, img: Phaser.GameObjects.GameObject): boolean {
        const b = player.body as Phaser.Physics.Arcade.Body | null;
        const s = this.slabs.find((o) => o.img === img);
        if (!b || !s || s.state === 2) return false;
        return b.velocity.y >= 0 && b.prev.y + b.height <= s.y - SLAB_H / 2 + 6;
    }

    private placeFlood(room: Room, L: RegionLayout, rnd: () => number, toxic: boolean, color: number): void {
        const R = room.rect;
        // niente buchi verso la stanza di sotto: l'acqua ci cadrebbe dentro
        if (L.doors.some((d) => d.axis === 'v' && d.y >= R.y + R.h - 2 && d.x < R.x + R.w && d.x + d.len > R.x)) return;
        let floor = -1;
        for (let r = R.y + R.h - 2; r > R.y && floor < 0; r--) {
            for (let c = R.x + 1; c < R.x + R.w - 1; c++) if (this.nav.standable(c, r)) { floor = r; break; }
        }
        if (floor < 0) return;
        // l'acqua non supera la soglia dei varchi laterali, se no uscirebbe dalla stanza
        let top = floor - 3 - Math.floor(rnd() * 2);
        for (const d of L.doors) {
            if (d.axis !== 'h') continue;
            const onSide = d.x === R.x || d.x === R.x + R.w - 1;
            if (!onSide || d.y + d.len <= R.y || d.y >= R.y + R.h) continue;
            top = Math.max(top, d.y + d.len);
        }
        if (floor - top < 1) return;
        const runs: Flood['runs'] = [];
        for (let r = top; r < R.y + R.h - 1; r++) {
            let start = -1;
            for (let c = R.x + 1; c <= R.x + R.w - 1; c++) {
                const air = c < R.x + R.w - 1 && !this.nav.solid(c, r);
                if (air && start < 0) start = c;
                if (!air && start >= 0) {
                    runs.push({ y: r * TILE, x0: start * TILE, x1: c * TILE });
                    start = -1;
                }
            }
        }
        if (!runs.length) return;
        const gfx = this.scene.add.graphics().setDepth(5);
        const low = (floor + 1) * TILE + 2;
        const period = 70000 + rnd() * 40000;
        this.floods.push({
            room, low, high: top * TILE + 6, level: low, period, phase: rnd() * period, toxic, runs, gfx, color, clock: 0, warned: false,
            cx: (R.x + R.w / 2) * TILE, cy: (R.y + R.h / 2) * TILE,
        });
    }

    /** quota dell'acqua nel ciclo: calma, avviso, piena, tenuta, ritirata */
    private levelAt(f: Flood, time: number): { level: number; warn: boolean } {
        const period = f.period;
        const p = (f.clock + f.phase) % period;
        const rise = 9000;
        const hold = 15000;
        const fall = 11000;
        const warn = 6000;
        const start = period - (warn + rise + hold + fall);
        const span = f.low - f.high;
        if (p < start) return { level: f.low, warn: false };
        if (p < start + warn) return { level: f.low, warn: true };
        let q = p - start - warn;
        if (q < rise) return { level: f.low - span * Phaser.Math.Easing.Sine.InOut(q / rise), warn: false };
        q -= rise;
        if (q < hold) return { level: f.high + Math.sin(time * 0.002) * 3, warn: false };
        q -= hold;
        return { level: f.high + span * Phaser.Math.Easing.Sine.InOut(Math.min(1, q / fall)), warn: false };
    }

    update(time: number, delta: number, player: HazardTarget): void {
        const now = this.scene.time.now;
        const pace = this.stormy() ? 2 : 1;
        for (const s of this.slabs) {
            if (s.state === 1) {
                if (now >= s.at + SHAKE_MS) {
                    s.state = 2;
                    s.at = now;
                    (s.img.body as Phaser.Physics.Arcade.StaticBody).enable = false;
                    this.scene.tweens.add({ targets: s.img, y: s.y + 90, alpha: 0, angle: (Math.random() - 0.5) * 40, duration: 420, ease: 'Quad.easeIn' });
                    if (Math.abs(s.x - player.x) < 700) sfx.crumble();
                    const dust = this.scene.add.particles(s.x, s.y, 'p-dot', {
                        speed: { min: 20, max: 80 }, angle: { min: 20, max: 160 }, scale: { start: 0.5, end: 0 },
                        tint: 0x8a8a8a, lifespan: 500, quantity: 6, stopAfter: 6,
                    }).setDepth(4);
                    this.scene.time.delayedCall(700, () => dust.destroy());
                } else if (now >= s.at) {
                    s.img.x = s.x + Math.sin(now * 0.09 + s.x) * 1.6;
                }
            } else if (s.state === 2 && now >= s.at + GONE_MS) {
                // torna solo se nessuno ci sta dentro, se no lo spingerebbe via
                const b = player.body as Phaser.Physics.Arcade.Body | null;
                if (b && b.x < s.x + TILE / 2 && b.right > s.x - TILE / 2 && b.y < s.y + SLAB_H && b.bottom > s.y - SLAB_H) continue;
                s.state = 0;
                this.scene.tweens.killTweensOf(s.img);
                s.img.setPosition(s.x, s.y).setAngle(0).setAlpha(0);
                (s.img.body as Phaser.Physics.Arcade.StaticBody).enable = true;
                s.img.refreshBody();
                this.scene.tweens.add({ targets: s.img, alpha: 1, duration: 350 });
            }
        }
        let inside: Flood | null = null;
        let headUnder = false;
        for (const f of this.floods) {
            f.clock += delta * pace;
            const near = Math.abs(f.cx - player.x) < 1800 && Math.abs(f.cy - player.y) < 1200;
            const { level, warn } = this.levelAt(f, time);
            f.level = level;
            if (warn && !f.warned && near) {
                f.warned = true;
                sfx.rumble();
                this.scene.cameras.main.shake(500, 0.002);
            }
            if (!warn) f.warned = false;
            if (!near) {
                f.gfx.setVisible(false);
                continue;
            }
            f.gfx.setVisible(true);
            this.draw(f, time);
            const R = f.room.rect;
            const inRoom = player.x > R.x * TILE && player.x < (R.x + R.w) * TILE && player.y > R.y * TILE && player.y < (R.y + R.h) * TILE;
            if (inRoom && player.y + 10 > level) {
                inside = f;
                headUnder = player.y - 18 > level;
            }
        }
        if (!!inside !== this.wasIn) {
            sfx.splash();
            if (inside) {
                const p = this.scene.add.particles(player.x, inside.level, 'p-dot', {
                    speed: { min: 60, max: 160 }, angle: { min: 230, max: 310 }, scale: { start: 0.45, end: 0 },
                    tint: 0xcfe8ff, lifespan: 420, quantity: 8, stopAfter: 8, gravityY: 500,
                }).setDepth(6);
                this.scene.time.delayedCall(600, () => p.destroy());
            }
        }
        this.wasIn = !!inside;
        player.submerged = !!inside;
        if (inside?.toxic && headUnder && now >= this.nextBite) {
            this.nextBite = now + 1600;
            player.hurt(1);
        }
    }

    private draw(f: Flood, time: number): void {
        const g = f.gfx;
        g.clear();
        if (f.level >= f.low - 1) return;
        const color = f.color;
        const top = f.level;
        for (const run of f.runs) {
            const y0 = Math.max(run.y, top);
            const y1 = run.y + TILE;
            if (y1 <= y0) continue;
            // più si scende più l'acqua è scura: il fondo si perde come nei dipinti
            const depth = Phaser.Math.Clamp((run.y + TILE / 2 - top) / (f.low - f.high + TILE), 0, 1);
            // la grafica non prende le luci della scena: il colore parte già scuro
            g.fillStyle(mix(color, 0x05060a, 0.62 + depth * 0.28), 0.55 + depth * 0.25);
            g.fillRect(run.x0, y0, run.x1 - run.x0, y1 - y0);
            if (run.y <= top && top < y1) {
                // il pelo dell'acqua: una riga chiara che ondeggia
                g.lineStyle(2, shade(color, 0.15), 0.7);
                g.beginPath();
                for (let x = run.x0; x <= run.x1; x += 8) {
                    const y = top + Math.sin(x * 0.05 + time * 0.004) * 1.6;
                    if (x === run.x0) g.moveTo(x, y);
                    else g.lineTo(x, y);
                }
                g.strokePath();
                g.fillStyle(color, 0.16);
                g.fillRect(run.x0, top + 2, run.x1 - run.x0, 6);
            }
        }
    }

    private ensureTexture(biomeId: string, rim: number, deep: number): void {
        const key = `hz-slab-${biomeId}`;
        if (this.scene.textures.exists(key)) return;
        const g = this.scene.add.graphics();
        // lastra scheggiata: sopra piatta per poggiare, sotto irregolare come roccia spezzata
        const pts = [
            new Phaser.Math.Vector2(1, 2), new Phaser.Math.Vector2(TILE - 1, 1), new Phaser.Math.Vector2(TILE - 2, 7),
            new Phaser.Math.Vector2(TILE - 7, SLAB_H - 1), new Phaser.Math.Vector2(17, SLAB_H - 3), new Phaser.Math.Vector2(9, SLAB_H),
            new Phaser.Math.Vector2(2, 8),
        ];
        g.fillStyle(shade(deep, -0.45), 1);
        g.fillPoints(pts, true);
        g.lineStyle(2, 0x0b0c10, 1);
        g.strokePoints(pts, true);
        g.lineStyle(1.5, mix(rim, deep, 0.35), 0.85);
        g.lineBetween(3, 2.5, TILE - 3, 2);
        // crepe: si capisce da lontano che non regge
        g.lineStyle(1, 0x0b0c10, 1);
        g.lineBetween(10, 3, 13, SLAB_H - 3);
        g.lineBetween(13, 6, 18, 4);
        g.lineBetween(23, 3, 21, SLAB_H - 4);
        g.generateTexture(key, TILE, SLAB_H);
        g.destroy();
    }

    destroy(): void {
        for (const f of this.floods) f.gfx.destroy();
        this.floods.length = 0;
        this.slabs.length = 0;
    }
}
