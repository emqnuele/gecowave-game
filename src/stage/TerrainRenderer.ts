import Phaser from 'phaser';
import { TILE } from '../config';
import type { BiomeDef } from '../content/biomes';
import { dressReach, dressSpacing, drawDress, type DressItem, type DressKind } from '../art/dressing';
import { chaikinClosed, crossHatch, hex, mix, shade, valueNoise2D, type Pt } from '../art/ink';
import { hashString, mulberry32 } from '../rules/hash';
import { materialCanvas } from '../art/materials';

/* il tilemap resta per le collisioni ma non si vede più: il terreno
   si ridisegna come contorno levigato e sporcato a mano, buio dentro,
   leggibile sul bordo, vestito di erba sopra e radici sotto.
   le regioni sono enormi: i pezzi si dipingono attorno alla camera e
   si buttano quando restano indietro */

const CHUNK = 512;
/** pezzi dipinti in anticipo fuori dalla vista, per lato: l'anello profondo
    fa sì che entrando in una stanza nuova ci sia già quasi tutto pronto */
const AHEAD = 2;
/** oltre questa distanza in pezzi dalla vista, un pezzo si butta */
const KEEP = 3;
/** pezzi fuori vista dipinti per frame: la vista invece si dipinge sempre tutta.
    tre tele da 512 in un frame costano meno di una raffica da cinque all'ingresso */
const PER_FRAME = 3;
/** celle attorno al pezzo da cui si ricavano i contorni: i bordi finti della finestra
    restano più lontani di quanto arrivino la banda e il tratteggio */
const WINDOW = 8;

type ChunkKind = 'interior' | 'mixed' | 'empty' | 'dress';

interface LiveChunk {
    obj: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;
    key: string | null;
}
/** quanto entra il materiale nel terreno prima di sparire nel buio */
const BAND = [
    { width: 120, alpha: 0.16 },
    { width: 76, alpha: 0.32 },
    { width: 44, alpha: 0.6 },
    { width: 24, alpha: 1 },
];

interface Loop {
    pts: Pt[];
    /** normale uscente per punto */
    normals: Pt[];
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

type CellTest = (c: number, r: number) => boolean;

/* bordi orientati con la roccia a destra (orario a schermo): così i
   buchi girano al contrario e il riempimento nonzero li rispetta */
function traceLoops(cols: number, rows: number, rawSolid: CellTest): { x: number; y: number }[][] {
    const out = new Map<number, number[]>();
    const edges: { ax: number; ay: number; bx: number; by: number; used: boolean }[] = [];
    // una cornice di una cella attorno alla mappa: i contorni che toccano
    // il bordo si chiudono lì, fuori dalla vista, invece di restare aperti
    const solid: CellTest = (c, r) => c >= -1 && c <= cols && r >= -1 && r <= rows && rawSolid(c, r);
    const key = (x: number, y: number) => (y + 2) * (cols + 6) + (x + 2);
    const add = (ax: number, ay: number, bx: number, by: number) => {
        const idx = edges.length;
        edges.push({ ax, ay, bx, by, used: false });
        const k = key(ax, ay);
        const list = out.get(k);
        if (list) list.push(idx);
        else out.set(k, [idx]);
    };
    for (let r = -1; r <= rows; r++) {
        for (let c = -1; c <= cols; c++) {
            if (!solid(c, r)) continue;
            if (!solid(c, r - 1)) add(c, r, c + 1, r);
            if (!solid(c + 1, r)) add(c + 1, r, c + 1, r + 1);
            if (!solid(c, r + 1)) add(c + 1, r + 1, c, r + 1);
            if (!solid(c - 1, r)) add(c, r + 1, c, r);
        }
    }
    const loops: { x: number; y: number }[][] = [];
    for (let i = 0; i < edges.length; i++) {
        if (edges[i].used) continue;
        const loop: { x: number; y: number }[] = [];
        let cur = i;
        while (!edges[cur].used) {
            const e = edges[cur];
            e.used = true;
            loop.push({ x: e.ax, y: e.ay });
            const cands = (out.get(key(e.bx, e.by)) ?? []).filter((j) => !edges[j].used);
            if (cands.length === 0) break;
            if (cands.length === 1) {
                cur = cands[0];
                continue;
            }
            // vertice a sella: si gira verso la roccia, le celle in diagonale restano separate
            const dx = e.bx - e.ax;
            const dy = e.by - e.ay;
            const rx = -dy;
            const ry = dx;
            cur = cands.find((j) => edges[j].bx - edges[j].ax === rx && edges[j].by - edges[j].ay === ry) ?? cands[0];
        }
        if (loop.length >= 4) loops.push(loop);
    }
    return loops;
}

function computeNormals(pts: Pt[]): Pt[] {
    const n = pts.length;
    return pts.map((_, i) => {
        const a = pts[(i - 1 + n) % n];
        const b = pts[(i + 1) % n];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        // roccia a destra: la normale uscente è a sinistra della direzione
        return { x: dy / len, y: -dx / len };
    });
}

function roughness(b: BiomeDef): number {
    switch (b.material) {
        case 'roots':
        case 'mud':
            return 6;
        case 'stone':
        case 'void':
            return 4;
        case 'crystal':
            return 3;
        case 'concrete':
        case 'brick':
            return 2;
        default:
            return 1.2;
    }
}

export interface TerrainInput {
    grid: string[];
    biome: BiomeDef;
    seedKey: string;
}

export class TerrainRenderer {
    private scene: Phaser.Scene;
    private biome: BiomeDef;
    private textureKeys: string[] = [];
    private fakeRegions: { image: Phaser.GameObjects.Image; cells: Set<number>; revealed: boolean; straight: boolean }[] = [];
    private cols = 0;
    private seedKey = '';
    private seed = 0;
    private isRock: CellTest = () => false;
    private pattern: HTMLCanvasElement | null = null;
    private widthPx = 0;
    private heightPx = 0;
    private chunkCols = 0;
    private chunkRows = 0;
    private kinds: ChunkKind[] = [];
    /** vestizione divisa per pezzo: ogni pezzo guarda solo la sua */
    private dressByChunk = new Map<number, DressItem[]>();
    private live = new Map<number, LiveChunk>();

    constructor(scene: Phaser.Scene, biome: BiomeDef) {
        this.scene = scene;
        this.biome = biome;
        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
    }

    build({ grid, seedKey }: TerrainInput): void {
        const rows = grid.length;
        const cols = Math.max(...grid.map((r) => r.length));
        this.cols = cols;
        const cell = (c: number, r: number) => grid[r]?.[c] ?? '.';
        // fuori dai bordi è roccia, tranne il cielo sopra
        const outside = (c: number, r: number) => r >= 0 && (c < 0 || c >= cols || r >= rows);
        const isRock: CellTest = (c, r) => outside(c, r) || cell(c, r) === '#';
        const isRockOrFake: CellTest = (c, r) => outside(c, r) || cell(c, r) === '#' || cell(c, r) === 'F';

        const seed = hashString(seedKey);
        this.seedKey = seedKey;
        this.seed = seed;
        this.isRock = isRock;
        // i contorni dell'intera regione servono solo per la vestizione: si dipinge per finestre
        const dress = this.buildDressing(this.buildLoops(traceLoops(cols, rows, isRock), seed), seed);
        this.widthPx = cols * TILE;
        this.heightPx = rows * TILE;
        this.chunkCols = Math.ceil(this.widthPx / CHUNK);
        this.chunkRows = Math.ceil(this.heightPx / CHUNK);
        this.pattern = materialCanvas(this.biome);

        for (const d of dress) {
            const reach = dressReach(d);
            const x0 = Math.max(0, Math.floor((Math.min(d.x, d.x2 ?? d.x) - reach) / CHUNK));
            const x1 = Math.min(this.chunkCols - 1, Math.floor((Math.max(d.x, d.x2 ?? d.x) + reach) / CHUNK));
            const y0 = Math.max(0, Math.floor((Math.min(d.y, d.y2 ?? d.y) - reach) / CHUNK));
            const y1 = Math.min(this.chunkRows - 1, Math.floor((Math.max(d.y, d.y2 ?? d.y) + reach) / CHUNK));
            for (let cy = y0; cy <= y1; cy++) {
                for (let cx = x0; cx <= x1; cx++) {
                    const k = cy * this.chunkCols + cx;
                    const list = this.dressByChunk.get(k);
                    if (list) list.push(d);
                    else this.dressByChunk.set(k, [d]);
                }
            }
        }
        this.kinds = [];
        for (let cy = 0; cy < this.chunkRows; cy++) {
            for (let cx = 0; cx < this.chunkCols; cx++) {
                const kind = this.classifyChunk(this.chunkBounds(cx, cy), cols, rows, isRock);
                const k = cy * this.chunkCols + cx;
                this.kinds.push(kind === 'empty-or-dress' ? (this.dressByChunk.has(k) ? 'dress' : 'empty') : kind);
            }
        }

        this.buildFakeWalls(grid, cols, rows, isRockOrFake, seed, this.pattern);
    }

    /** dipinge i pezzi attorno alla vista e butta quelli rimasti lontani */
    update(view: Phaser.Geom.Rectangle): void {
        if (this.chunkCols === 0) return;
        const vx0 = Math.floor(view.x / CHUNK);
        const vy0 = Math.floor(view.y / CHUNK);
        const vx1 = Math.floor((view.x + view.width) / CHUNK);
        const vy1 = Math.floor((view.y + view.height) / CHUNK);
        // ciò che si vede non può aspettare: un buco nel terreno è peggio di un frame lento
        for (let cy = vy0; cy <= vy1; cy++) for (let cx = vx0; cx <= vx1; cx++) this.ensure(cx, cy);
        let budget = PER_FRAME;
        for (let cy = vy0 - AHEAD; cy <= vy1 + AHEAD && budget > 0; cy++) {
            for (let cx = vx0 - AHEAD; cx <= vx1 + AHEAD && budget > 0; cx++) {
                if (this.ensure(cx, cy)) budget--;
            }
        }
        for (const [k, chunk] of this.live) {
            const cx = k % this.chunkCols;
            const cy = (k - cx) / this.chunkCols;
            if (cx < vx0 - KEEP || cx > vx1 + KEEP || cy < vy0 - KEEP || cy > vy1 + KEEP) {
                chunk.obj.destroy();
                if (chunk.key) this.removeTexture(chunk.key);
                this.live.delete(k);
            }
        }
    }

    private chunkBounds(cx: number, cy: number): { x: number; y: number; w: number; h: number } {
        const x = cx * CHUNK;
        const y = cy * CHUNK;
        return { x, y, w: Math.min(CHUNK, this.widthPx - x), h: Math.min(CHUNK, this.heightPx - y) };
    }

    /** true se ha dovuto dipingere davvero */
    private ensure(cx: number, cy: number): boolean {
        if (cx < 0 || cy < 0 || cx >= this.chunkCols || cy >= this.chunkRows) return false;
        const k = cy * this.chunkCols + cx;
        const kind = this.kinds[k];
        if (kind === 'empty' || this.live.has(k)) return false;
        const bounds = this.chunkBounds(cx, cy);
        if (kind === 'interior') {
            const deep = mix(this.biome.deep, 0x000000, 0.3);
            const obj = this.scene.add.rectangle(bounds.x, bounds.y, bounds.w, bounds.h, deep).setOrigin(0, 0).setDepth(2);
            this.live.set(k, { obj, key: null });
            return false;
        }
        const key = `terrain-${this.seedKey}-${cx}-${cy}`;
        const el = this.paintRegion(bounds, this.isRock, this.dressByChunk.get(k) ?? [], this.pattern!);
        this.addTexture(key, el);
        const obj = this.scene.add.image(bounds.x, bounds.y, key).setOrigin(0, 0).setDepth(2).setPipeline('Light2D');
        this.live.set(k, { obj, key });
        return true;
    }

    /** i muri finti si dissolvono quando ci entri, come in hollow knight */
    updateReveal(px: number, py: number): void {
        const c = Math.floor(px / TILE);
        const r = Math.floor(py / TILE);
        const k = r * this.cols + c;
        for (const reg of this.fakeRegions) {
            // ciò che l'ordine ha raddrizzato resta dritto finché non si spezza
            if (reg.straight) continue;
            const inside = reg.cells.has(k) || reg.cells.has(k - this.cols);
            if (inside && !reg.revealed) {
                reg.revealed = true;
                this.scene.tweens.add({ targets: reg.image, alpha: 0.12, duration: 380, ease: 'Sine.easeOut' });
            }
        }
    }

    /** contorni delle sole celle attorno a un rettangolo del mondo: quel che c'è
        oltre la finestra si considera uguale al bordo, così i contorni non si chiudono vicino */
    private windowLoops(bounds: { x: number; y: number; w: number; h: number }, solid: CellTest): Loop[] {
        const c0 = Math.floor(bounds.x / TILE) - WINDOW;
        const r0 = Math.floor(bounds.y / TILE) - WINDOW;
        const wc = Math.ceil((bounds.x + bounds.w) / TILE) + WINDOW - c0;
        const wr = Math.ceil((bounds.y + bounds.h) / TILE) + WINDOW - r0;
        const local: CellTest = (c, r) => solid(c0 + Math.max(0, Math.min(wc - 1, c)), r0 + Math.max(0, Math.min(wr - 1, r)));
        const raw = traceLoops(wc, wr, local).map((loop) => loop.map((p) => ({ x: p.x + c0, y: p.y + r0 })));
        return this.buildLoops(raw, this.seed);
    }

    private buildLoops(raw: { x: number; y: number }[][], seed: number): Loop[] {
        const noise = valueNoise2D(seed);
        const rough = roughness(this.biome);
        return raw.map((loop) => {
            const pts = loop.map((p) => ({ x: p.x * TILE, y: p.y * TILE }));
            const normals = computeNormals(pts);
            // pavimenti quasi fermi (i piedi non devono galleggiare), pareti e soffitti liberi
            const displaced = pts.map((p, i) => {
                const n = normals[i];
                const floor = n.y < -0.6;
                const amp = floor ? Math.min(rough, 2) : rough;
                const d = noise(p.x / 70, p.y / 70) * amp + noise(p.x / 23, p.y / 23) * amp * 0.5;
                return { x: p.x + n.x * d, y: p.y + n.y * d };
            });
            const smooth = chaikinClosed(displaced, 2);
            const sn = computeNormals(smooth);
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (const p of smooth) {
                if (p.x < minX) minX = p.x;
                if (p.y < minY) minY = p.y;
                if (p.x > maxX) maxX = p.x;
                if (p.y > maxY) maxY = p.y;
            }
            return { pts: smooth, normals: sn, minX, minY, maxX, maxY };
        });
    }

    private buildDressing(loops: Loop[], seed: number): DressItem[] {
        const rnd = mulberry32(seed ^ 0x9e3779b9);
        const b = this.biome;
        const items: DressItem[] = [];
        let counter = 0;
        for (const loop of loops) {
            const acc = new Map<DressKind, number>();
            const n = loop.pts.length;
            let pendingCable: { x: number; y: number } | null = null;
            for (let i = 0; i < n; i++) {
                const a = loop.pts[i];
                const bpt = loop.pts[(i + 1) % n];
                const step = Math.hypot(bpt.x - a.x, bpt.y - a.y);
                const nrm = loop.normals[i];
                let kinds: DressKind[];
                if (nrm.y < -0.72) kinds = b.surface;
                else if (nrm.y > 0.72) kinds = b.ceiling;
                else kinds = b.material === 'roots' || b.material === 'mud' || b.surface.includes('moss') ? ['wallmoss', 'wallvine'] : [];
                // i tratti diversi da ciò che si sta vestendo spezzano i cavi
                if (nrm.y <= 0.72) pendingCable = null;
                for (const kind of kinds) {
                    const spacing = dressSpacing(kind);
                    const sofar = (acc.get(kind) ?? rnd() * spacing) + step;
                    if (sofar < spacing) {
                        acc.set(kind, sofar);
                        continue;
                    }
                    acc.set(kind, sofar - spacing * (0.6 + rnd() * 0.8));
                    if (kind === 'cables' && nrm.y > 0.72) {
                        if (!pendingCable) {
                            pendingCable = { x: a.x, y: a.y };
                            continue;
                        }
                        if (Math.abs(a.x - pendingCable.x) < 50) continue;
                        items.push({ kind, x: pendingCable.x, y: pendingCable.y, x2: a.x, y2: a.y, nx: nrm.x, ny: nrm.y, seed: seed + counter++, size: 1 });
                        pendingCable = null;
                        continue;
                    }
                    if (rnd() < 0.18) continue;
                    items.push({ kind, x: a.x, y: a.y, nx: nrm.x, ny: nrm.y, seed: seed + counter++, size: 0.75 + rnd() * 0.6 });
                }
            }
        }
        return items;
    }

    private itemHits(d: DressItem, r: { x: number; y: number; w: number; h: number }): boolean {
        const reach = dressReach(d);
        const minX = Math.min(d.x, d.x2 ?? d.x) - reach;
        const maxX = Math.max(d.x, d.x2 ?? d.x) + reach;
        const minY = Math.min(d.y, d.y2 ?? d.y) - reach;
        const maxY = Math.max(d.y, d.y2 ?? d.y) + reach;
        return maxX >= r.x && minX <= r.x + r.w && maxY >= r.y && minY <= r.y + r.h;
    }

    private classifyChunk(b: { x: number; y: number; w: number; h: number }, cols: number, rows: number, solid: CellTest): 'interior' | 'mixed' | 'empty-or-dress' {
        // margine di 4 celle: dentro quel raggio la banda di materiale si vede ancora
        const c0 = Math.floor(b.x / TILE) - 4;
        const r0 = Math.floor(b.y / TILE) - 4;
        const c1 = Math.ceil((b.x + b.w) / TILE) + 4;
        const r1 = Math.ceil((b.y + b.h) / TILE) + 4;
        let any = false;
        let all = true;
        for (let r = r0; r < r1; r++) {
            for (let c = c0; c < c1; c++) {
                const cc = Math.min(cols - 1, Math.max(0, c));
                const rr = Math.min(rows + 4, Math.max(-1, r));
                if (solid(cc, rr)) any = true;
                else all = false;
            }
        }
        if (all) return 'interior';
        if (!any) return 'empty-or-dress';
        return 'mixed';
    }

    private loopHits(l: Loop, r: { x: number; y: number; w: number; h: number }, margin: number): boolean {
        return l.maxX + margin >= r.x && l.minX - margin <= r.x + r.w && l.maxY + margin >= r.y && l.minY - margin <= r.y + r.h;
    }

    /** disegna una regione del mondo: roccia, banda di materiale, luce sul bordo, inchiostro, vestizione */
    private paintRegion(
        bounds: { x: number; y: number; w: number; h: number },
        solid: CellTest,
        dress: DressItem[],
        pattern: HTMLCanvasElement,
        extraClip?: (ctx: CanvasRenderingContext2D) => void,
    ): HTMLCanvasElement {
        const b = this.biome;
        const el = document.createElement('canvas');
        el.width = Math.ceil(bounds.w);
        el.height = Math.ceil(bounds.h);
        const ctx = el.getContext('2d')!;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.translate(-bounds.x, -bounds.y);
        if (extraClip) {
            extraClip(ctx);
            ctx.clip();
        }

        const margin = 140;
        const near = this.windowLoops(bounds, solid).filter((l) => this.loopHits(l, bounds, margin));
        const solidPath = new Path2D();
        for (const l of near) {
            solidPath.moveTo(l.pts[0].x, l.pts[0].y);
            for (let i = 1; i < l.pts.length; i++) solidPath.lineTo(l.pts[i].x, l.pts[i].y);
            solidPath.closePath();
        }
        // solo i segmenti vicini al chunk: tracciare 20k punti per chunk è uno spreco
        const edgePath = new Path2D();
        const floorPath = new Path2D();
        const box = { x0: bounds.x - margin, y0: bounds.y - margin, x1: bounds.x + bounds.w + margin, y1: bounds.y + bounds.h + margin };
        for (const l of near) {
            const n = l.pts.length;
            let drawing = false;
            let floorDrawing = false;
            for (let i = 0; i <= n; i++) {
                const p = l.pts[i % n];
                const inside = p.x >= box.x0 && p.x <= box.x1 && p.y >= box.y0 && p.y <= box.y1;
                if (inside) {
                    if (!drawing) edgePath.moveTo(p.x, p.y);
                    else edgePath.lineTo(p.x, p.y);
                    drawing = true;
                    const floor = l.normals[i % n].y < -0.55;
                    if (floor) {
                        if (!floorDrawing) floorPath.moveTo(p.x, p.y);
                        else floorPath.lineTo(p.x, p.y);
                    }
                    floorDrawing = floor;
                } else {
                    drawing = false;
                    floorDrawing = false;
                }
            }
        }

        const pat = ctx.createPattern(pattern, 'repeat')!;

        ctx.save();
        ctx.clip(solidPath, 'nonzero');
        ctx.fillStyle = hex(mix(b.deep, 0x000000, 0.3));
        ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
        // venature profonde appena accennate: il buio non è mai piatto
        ctx.globalAlpha = 0.06;
        ctx.fillStyle = pat;
        ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
        for (const band of BAND) {
            ctx.globalAlpha = band.alpha;
            ctx.strokeStyle = pat;
            ctx.lineWidth = band.width;
            ctx.stroke(edgePath);
        }
        // tratteggio di ombra appena sotto la cresta: lo stile dei dipinti
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = ctx.createPattern(this.hatchTile(), 'repeat')!;
        ctx.lineWidth = 60;
        ctx.stroke(edgePath);
        ctx.globalAlpha = 1;
        // ombra di contatto sotto il bordo superiore e luce sul pavimento
        ctx.strokeStyle = hex(b.ink, 0.55);
        ctx.lineWidth = 34;
        ctx.globalAlpha = 0.35;
        ctx.stroke(floorPath);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = hex(b.rim, 0.42);
        ctx.lineWidth = 7;
        ctx.stroke(floorPath);
        ctx.strokeStyle = hex(shade(b.rim, 0.2), 0.5);
        ctx.lineWidth = 2.5;
        ctx.stroke(floorPath);
        ctx.restore();

        // contorno d'inchiostro, doppia passata per lo spessore irregolare
        ctx.strokeStyle = hex(b.ink);
        ctx.lineWidth = 3.4;
        ctx.stroke(edgePath);
        ctx.strokeStyle = hex(b.ink, 0.6);
        ctx.lineWidth = 5.5;
        ctx.globalAlpha = 0.35;
        ctx.stroke(edgePath);
        ctx.globalAlpha = 1;

        for (const it of dress) {
            if (this.itemHits(it, bounds)) drawDress(ctx, it, b);
        }
        return el;
    }

    private hatchCache: HTMLCanvasElement | null = null;

    /** piastrella di tratteggio diagonale scuro, usata come stroke */
    private hatchTile(): HTMLCanvasElement {
        if (this.hatchCache) return this.hatchCache;
        const el = document.createElement('canvas');
        el.width = 256;
        el.height = 256;
        const ctx = el.getContext('2d')!;
        const rnd = mulberry32(4242);
        ctx.save();
        crossHatch(ctx, -64, -64, 384, 384, rnd, hex(this.biome.ink, 0.7), 0.55, 1);
        ctx.restore();
        this.hatchCache = el;
        return el;
    }

    private buildFakeWalls(grid: string[], cols: number, rows: number, solidWithFake: CellTest, seed: number, pattern: HTMLCanvasElement): void {
        const fake = new Set<number>();
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) if (grid[r]?.[c] === 'F') fake.add(r * cols + c);
        }
        if (fake.size === 0) return;
        const seen = new Set<number>();
        let idx = 0;
        for (const start of fake) {
            if (seen.has(start)) continue;
            // componente connessa di celle finte
            const comp = new Set<number>();
            const stack = [start];
            seen.add(start);
            while (stack.length) {
                const k = stack.pop()!;
                comp.add(k);
                const c = k % cols;
                const r = Math.floor(k / cols);
                for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                    const nc = c + dc;
                    const nr = r + dr;
                    if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
                    const nk = nr * cols + nc;
                    if (fake.has(nk) && !seen.has(nk)) {
                        seen.add(nk);
                        stack.push(nk);
                    }
                }
            }
            let c0 = Infinity, r0 = Infinity, c1 = -Infinity, r1 = -Infinity;
            for (const k of comp) {
                const c = k % cols;
                const r = Math.floor(k / cols);
                c0 = Math.min(c0, c); r0 = Math.min(r0, r); c1 = Math.max(c1, c); r1 = Math.max(r1, r);
            }
            const pad = 6;
            const bounds = { x: c0 * TILE - pad, y: r0 * TILE - pad, w: (c1 - c0 + 1) * TILE + pad * 2, h: (r1 - r0 + 1) * TILE + pad * 2 };
            const el = this.paintRegion(bounds, solidWithFake, [], pattern, (ctx) => {
                ctx.beginPath();
                for (const k of comp) {
                    const c = k % cols;
                    const r = Math.floor(k / cols);
                    ctx.rect(c * TILE - 3, r * TILE - 3, TILE + 6, TILE + 6);
                }
            });
            const key = `terrain-fake-${seed}-${idx++}`;
            this.addTexture(key, el);
            const image = this.scene.add.image(bounds.x, bounds.y, key).setOrigin(0, 0).setDepth(5).setPipeline('Light2D');
            this.fakeRegions.push({ image, cells: comp, revealed: false, straight: false });
        }
    }

    /** solo i grumi che toccano le pareti scelte diventano opachi: l'ordine non tocca il resto */
    straightenFakeWalls(walls: readonly Phaser.Physics.Arcade.Sprite[]): void {
        for (const reg of this.regionsFor(walls)) {
            if (reg.straight) continue;
            reg.straight = true;
            reg.revealed = true;
            this.scene.tweens.add({ targets: reg.image, alpha: 1, duration: 380, ease: 'Sine.easeOut' });
        }
    }

    /** la rottura restituisce i grumi al loro falso: niente muri veri nel save */
    releaseStraightenedWalls(walls: readonly Phaser.Physics.Arcade.Sprite[]): void {
        for (const reg of this.regionsFor(walls)) {
            if (!reg.straight) continue;
            reg.straight = false;
            reg.revealed = false;
            this.scene.tweens.add({ targets: reg.image, alpha: 1, duration: 380, ease: 'Sine.easeOut' });
        }
    }

    private regionsFor(walls: readonly Phaser.Physics.Arcade.Sprite[]): { image: Phaser.GameObjects.Image; cells: Set<number>; revealed: boolean; straight: boolean }[] {
        if (!this.cols) return [];
        const out = new Map<Phaser.GameObjects.Image, { image: Phaser.GameObjects.Image; cells: Set<number>; revealed: boolean; straight: boolean }>();
        for (const w of walls) {
            if (!w.active) continue;
            const k = Math.floor(w.y / TILE) * this.cols + Math.floor(w.x / TILE);
            for (const reg of this.fakeRegions) {
                if (reg.cells.has(k)) out.set(reg.image, reg);
            }
        }
        return [...out.values()];
    }

    private addTexture(key: string, el: HTMLCanvasElement): void {
        if (this.scene.textures.exists(key)) this.scene.textures.remove(key);
        this.scene.textures.addCanvas(key, el);
        this.textureKeys.push(key);
    }

    private removeTexture(key: string): void {
        if (this.scene.textures.exists(key)) this.scene.textures.remove(key);
        const i = this.textureKeys.indexOf(key);
        if (i >= 0) this.textureKeys.splice(i, 1);
    }

    private destroy(): void {
        // le texture dei chunk sono per-livello: liberarle evita di gonfiare la gpu a ogni capitolo
        for (const key of this.textureKeys) {
            if (this.scene.textures.exists(key)) this.scene.textures.remove(key);
        }
        this.textureKeys = [];
        this.fakeRegions = [];
        this.live.clear();
        this.dressByChunk.clear();
        this.kinds = [];
        this.chunkCols = 0;
    }
}
