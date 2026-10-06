/* navigazione a piattaforme per chi cammina e salta: i pavimenti diventano
   segmenti, i salti sono archi balistici verificati contro la roccia.
   gli agenti non usano i tasti del player: decollano con la velocità giusta
   per l'arco scelto, quindi bastano gravità e misure del corpo.
   niente phaser qui dentro: gira anche negli script offline */

const T = 32;

export interface NavSegment {
    id: number;
    /** riga dove sta il corpo (i piedi poggiano su r+1) */
    r: number;
    c0: number;
    c1: number;
}

export type NavEdgeKind = 'walk' | 'drop' | 'jump';

export interface NavEdge {
    to: number;
    kind: NavEdgeKind;
    /** colonna di partenza sul segmento d'origine e d'arrivo su quello d'arrivo */
    fromC: number;
    toC: number;
    /** velocità di decollo in px/s (drop: solo vx) */
    vx: number;
    vy: number;
    /** quanto deve saltare l'agente, in px: chi salta meno non può usarlo */
    need: number;
    cost: number;
}

export interface NavOptions {
    gravity: number;
    /** salto massimo considerato, in px */
    maxJump: number;
    /** velocità orizzontale massima in volo */
    maxVx: number;
    /** distanza massima tra i bordi dei segmenti, in celle */
    reach: number;
}

const DEFAULTS: NavOptions = { gravity: 2400, maxJump: 190, maxVx: 420, reach: 9 };

export class NavGraph {
    readonly cols: number;
    readonly rows: number;
    readonly segments: NavSegment[] = [];
    private opts: NavOptions;
    private blocked: Uint8Array;
    private spike: Uint8Array;
    /** segmento per cella in piedi, -1 altrove */
    private segAt: Int32Array;
    private edgeCache = new Map<number, NavEdge[]>();
    /** segmenti per riga, per cercare i vicini senza scorrere tutto */
    private byRow = new Map<number, NavSegment[]>();

    constructor(grid: string[], opts: Partial<NavOptions> = {}) {
        this.opts = { ...DEFAULTS, ...opts };
        this.rows = grid.length;
        this.cols = Math.max(...grid.map((r) => r.length));
        const n = this.cols * this.rows;
        this.blocked = new Uint8Array(n);
        this.spike = new Uint8Array(n);
        this.segAt = new Int32Array(n).fill(-1);
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const ch = grid[r][c] ?? '.';
                if (ch === '#' || ch === '%') this.blocked[r * this.cols + c] = 1;
                else if (ch === '^') this.spike[r * this.cols + c] = 1;
            }
        }
        this.buildSegments();
    }

    /** un muro rompibile è caduto: la cella si libera e i segmenti vicini si rifanno */
    open(c: number, r: number): void {
        if (!this.inside(c, r)) return;
        this.blocked[r * this.cols + c] = 0;
        this.segments.length = 0;
        this.byRow.clear();
        this.segAt.fill(-1);
        this.edgeCache.clear();
        this.buildSegments();
    }

    inside(c: number, r: number): boolean {
        return c >= 0 && r >= 0 && c < this.cols && r < this.rows;
    }

    solid(c: number, r: number): boolean {
        if (!this.inside(c, r)) return true;
        return this.blocked[r * this.cols + c] === 1;
    }

    /** aria dove un corpo può stare: niente roccia e niente spine */
    free(c: number, r: number): boolean {
        if (!this.inside(c, r)) return false;
        const k = r * this.cols + c;
        return this.blocked[k] === 0 && this.spike[k] === 0;
    }

    standable(c: number, r: number): boolean {
        return this.free(c, r) && this.free(c, r - 1) && this.solid(c, r + 1) && this.inside(c, r + 1);
    }

    private buildSegments(): void {
        for (let r = 1; r < this.rows - 1; r++) {
            let start = -1;
            for (let c = 0; c <= this.cols; c++) {
                const ok = c < this.cols && this.standable(c, r);
                if (ok && start < 0) start = c;
                if (!ok && start >= 0) {
                    const seg: NavSegment = { id: this.segments.length, r, c0: start, c1: c - 1 };
                    this.segments.push(seg);
                    let list = this.byRow.get(r);
                    if (!list) this.byRow.set(r, (list = []));
                    list.push(seg);
                    for (let x = start; x < c; x++) this.segAt[r * this.cols + x] = seg.id;
                    start = -1;
                }
            }
        }
    }

    segmentAt(c: number, r: number): number {
        if (!this.inside(c, r)) return -1;
        return this.segAt[r * this.cols + c];
    }

    /** il segmento sotto un punto in pixel: si scende finché si trova un pavimento */
    segmentBelow(x: number, y: number, maxDrop = 14): number {
        const c = Math.floor(x / T);
        let r = Math.floor(y / T);
        for (let i = 0; i <= maxDrop && r < this.rows; i++, r++) {
            const s = this.segmentAt(c, r);
            if (s >= 0) return s;
            if (this.solid(c, r)) return -1;
        }
        return -1;
    }

    /** il corpo (w×h px, piedi in fondo) tocca roccia o spine con i piedi in (x, yFeet)? */
    private hits(x: number, yFeet: number, w: number, h: number): boolean {
        const c0 = Math.floor((x - w / 2) / T);
        const c1 = Math.floor((x + w / 2 - 0.01) / T);
        const r0 = Math.floor((yFeet - h) / T);
        const r1 = Math.floor((yFeet - 0.01) / T);
        for (let r = r0; r <= r1; r++) {
            for (let c = c0; c <= c1; c++) {
                if (!this.free(c, r)) return true;
            }
        }
        return false;
    }

    /** arco balistico dal pavimento di `a` (colonna fc) al pavimento di `b` (colonna tc) */
    private arc(fc: number, fr: number, tc: number, tr: number): { vx: number; vy: number; need: number } | null {
        const { gravity: g, maxJump, maxVx } = this.opts;
        const x0 = fc * T + T / 2;
        const y0 = (fr + 1) * T;
        const x1 = tc * T + T / 2;
        const y1 = (tr + 1) * T;
        const rise = y0 - y1;
        // apice sopra il più alto dei due pavimenti, con un margine che cresce con la distanza
        const dxAbs = Math.abs(x1 - x0);
        for (const extra of [20, 44, 72]) {
            const apexH = Math.max(0, rise) + extra + Math.min(40, dxAbs * 0.08);
            if (apexH > maxJump) return null;
            const vy = Math.sqrt(2 * g * apexH);
            const tUp = vy / g;
            const fall = apexH - rise;
            if (fall < 0) continue;
            const tDown = Math.sqrt((2 * fall) / g);
            const t = tUp + tDown;
            const vx = (x1 - x0) / t;
            if (Math.abs(vx) > maxVx) continue;
            // campionamento dell'arco con un corpo prudente (1 cella × 1.7)
            let ok = true;
            const steps = Math.max(8, Math.ceil(t * 60));
            for (let i = 1; i <= steps && ok; i++) {
                const tt = (t * i) / steps;
                const x = x0 + vx * tt;
                const y = y0 - vy * tt + 0.5 * g * tt * tt;
                // gli ultimi istanti sono l'atterraggio: i piedi toccano il pavimento d'arrivo
                const feet = i === steps ? y - 2 : y;
                if (this.hits(x, feet, 26, 52)) ok = false;
            }
            if (ok) return { vx, vy, need: apexH };
        }
        return null;
    }

    edges(id: number): NavEdge[] {
        const hit = this.edgeCache.get(id);
        if (hit) return hit;
        const a = this.segments[id];
        const out: NavEdge[] = [];
        const reach = this.opts.reach;
        // cadute dai due bordi: si cammina oltre e si scende in verticale con un po' di deriva
        for (const dir of [-1, 1]) {
            const ec = dir < 0 ? a.c0 - 1 : a.c1 + 1;
            if (!this.free(ec, a.r) || !this.free(ec, a.r - 1)) continue;
            for (const drift of [0, 1, 2, 3]) {
                const lc = ec + dir * drift;
                let ok = true;
                for (let x = ec; x !== lc + dir; x += dir) if (!this.free(x, a.r) || !this.free(x, a.r - 1)) ok = false;
                if (!ok) break;
                let r = a.r;
                while (r < this.rows - 1 && this.free(lc, r + 1) && this.free(lc, r)) r++;
                const s = this.segmentAt(lc, r);
                if (s < 0 || s === id) continue;
                const fallPx = (r - a.r) * T;
                const tFall = Math.sqrt((2 * Math.max(T, fallPx)) / this.opts.gravity);
                out.push({
                    to: s, kind: 'drop', fromC: dir < 0 ? a.c0 : a.c1, toC: lc,
                    vx: (dir * (drift + 1) * T) / Math.max(0.2, tFall), vy: 0, need: 0, cost: 2 + drift + (r - a.r) * 0.4,
                });
                break;
            }
        }
        // salti verso i segmenti vicini
        const rMin = a.r - Math.ceil(this.opts.maxJump / T);
        const rMax = a.r + 14;
        for (let r = rMin; r <= rMax; r++) {
            for (const b of this.byRow.get(r) ?? []) {
                if (b.id === id) continue;
                const gap = b.c0 > a.c1 ? b.c0 - a.c1 : a.c0 > b.c1 ? a.c0 - b.c1 : 0;
                if (gap > reach) continue;
                if (out.some((e) => e.to === b.id)) continue;
                // decollo e atterraggio: i punti più vicini, poi qualche alternativa verso l'interno
                const pairs: [number, number][] = [];
                if (b.c0 > a.c1) pairs.push([a.c1, b.c0], [a.c1 - 1, b.c0 + 1], [a.c1, Math.min(b.c1, b.c0 + 2)]);
                else if (a.c0 > b.c1) pairs.push([a.c0, b.c1], [a.c0 + 1, b.c1 - 1], [a.c0, Math.max(b.c0, b.c1 - 2)]);
                else {
                    // sovrapposti in verticale: si salta dal bordo verso il centro dell'altro
                    const mid = Math.round((Math.max(a.c0, b.c0) + Math.min(a.c1, b.c1)) / 2);
                    const lo = Math.max(a.c0, b.c0);
                    const hi = Math.min(a.c1, b.c1);
                    pairs.push([mid, mid], [lo, Math.min(b.c1, lo + 2)], [hi, Math.max(b.c0, hi - 2)]);
                    if (a.c0 < b.c0) pairs.push([b.c0 - 1, b.c0 + 1]);
                    if (a.c1 > b.c1) pairs.push([b.c1 + 1, b.c1 - 1]);
                }
                for (const [fc, tc] of pairs) {
                    if (fc < a.c0 || fc > a.c1 || tc < b.c0 || tc > b.c1) continue;
                    const arc = this.arc(fc, a.r, tc, b.r);
                    if (!arc) continue;
                    out.push({
                        to: b.id, kind: 'jump', fromC: fc, toC: tc, vx: arc.vx, vy: arc.vy, need: arc.need,
                        cost: 3 + Math.hypot(tc - fc, b.r - a.r) + arc.need / 60,
                    });
                    break;
                }
            }
        }
        this.edgeCache.set(id, out);
        return out;
    }

    /** a* sui segmenti; jump = quanto sa saltare l'agente in px */
    path(from: number, to: number, jump: number, maxNodes = 1500): NavEdge[] | null {
        if (from < 0 || to < 0) return null;
        if (from === to) return [];
        const goal = this.segments[to];
        const h = (s: NavSegment) => {
            const dc = s.c1 < goal.c0 ? goal.c0 - s.c1 : s.c0 > goal.c1 ? s.c0 - goal.c1 : 0;
            return dc + Math.abs(s.r - goal.r) * 0.5;
        };
        const g = new Map<number, number>([[from, 0]]);
        const came = new Map<number, NavEdge & { from: number }>();
        const open: [number, number][] = [[h(this.segments[from]), from]];
        const closed = new Set<number>();
        let expanded = 0;
        while (open.length && expanded < maxNodes) {
            // coda piccola: basta la ricerca lineare del minimo
            let bi = 0;
            for (let i = 1; i < open.length; i++) if (open[i][0] < open[bi][0]) bi = i;
            const [, cur] = open[bi];
            open[bi] = open[open.length - 1];
            open.pop();
            if (closed.has(cur)) continue;
            if (cur === to) break;
            closed.add(cur);
            expanded++;
            const gc = g.get(cur)!;
            for (const e of this.edges(cur)) {
                if (e.need > jump) continue;
                const ng = gc + e.cost;
                if (ng < (g.get(e.to) ?? Infinity)) {
                    g.set(e.to, ng);
                    came.set(e.to, { ...e, from: cur });
                    open.push([ng + h(this.segments[e.to]), e.to]);
                }
            }
        }
        if (!came.has(to)) return null;
        const out: NavEdge[] = [];
        let cur = to;
        while (cur !== from) {
            const e = came.get(cur)!;
            out.push(e);
            cur = e.from;
        }
        return out.reverse();
    }

    /** linea di vista tra due punti in pixel, passo mezza cella */
    sight(x0: number, y0: number, x1: number, y1: number): boolean {
        const d = Math.hypot(x1 - x0, y1 - y0);
        const n = Math.ceil(d / (T / 2));
        for (let i = 1; i < n; i++) {
            const x = x0 + ((x1 - x0) * i) / n;
            const y = y0 + ((y1 - y0) * i) / n;
            if (this.solid(Math.floor(x / T), Math.floor(y / T))) return false;
        }
        return true;
    }

    /** vista per un corpo largo 2r: tre linee parallele, così non si tagliano gli spigoli */
    sightWide(x0: number, y0: number, x1: number, y1: number, r: number): boolean {
        const d = Math.hypot(x1 - x0, y1 - y0) || 1;
        const nx = (-(y1 - y0) / d) * r;
        const ny = ((x1 - x0) / d) * r;
        return this.sight(x0, y0, x1, y1) && this.sight(x0 + nx, y0 + ny, x1 + nx, y1 + ny) && this.sight(x0 - nx, y0 - ny, x1 - nx, y1 - ny);
    }

    /** percorso in aria per chi vola: a* su blocchi di 2×2 celle (un corpo ci passa sempre), in pixel */
    flyPath(x0: number, y0: number, x1: number, y1: number, maxNodes = 4000): { x: number; y: number }[] | null {
        const B = 2;
        const bw = Math.ceil(this.cols / B);
        const bh = Math.ceil(this.rows / B);
        const fits = (bx: number, by: number) => {
            if (bx < 0 || by < 0 || bx >= bw || by >= bh) return false;
            for (let dy = 0; dy < B; dy++) for (let dx = 0; dx < B; dx++) if (this.solid(bx * B + dx, by * B + dy)) return false;
            return true;
        };
        // il blocco libero più vicino al punto: chi vola rasente a un muro sta a cavallo di due blocchi
        const blockOf = (x: number, y: number): [number, number] | null => {
            const bx = Math.floor(x / T / B);
            const by = Math.floor(y / T / B);
            for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
                if (fits(bx + dx, by + dy)) return [bx + dx, by + dy];
            }
            return null;
        };
        const s0 = blockOf(x0, y0);
        const t0 = blockOf(x1, y1);
        if (!s0 || !t0) return null;
        const [sc, sr] = s0;
        const [tc, tr] = t0;
        const key = (c: number, r: number) => r * bw + c;
        const g = new Map<number, number>([[key(sc, sr), 0]]);
        const came = new Map<number, number>();
        // coda a secchi per costo intero: niente ricerca lineare su migliaia di nodi
        const buckets: number[][] = [];
        const push = (f: number, k: number) => {
            const i = Math.floor(f);
            (buckets[i] ??= []).push(k);
        };
        push(0, key(sc, sr));
        const closed = new Set<number>();
        let best = key(sc, sr);
        let bestH = Infinity;
        let n = 0;
        let bi = 0;
        while (n < maxNodes) {
            while (bi < buckets.length && !(buckets[bi]?.length)) bi++;
            if (bi >= buckets.length) break;
            const cur = buckets[bi].pop()!;
            if (closed.has(cur)) continue;
            closed.add(cur);
            n++;
            const c = cur % bw;
            const r = (cur - c) / bw;
            const hh = Math.max(Math.abs(c - tc), Math.abs(r - tr));
            if (hh < bestH) {
                bestH = hh;
                best = cur;
            }
            if (hh === 0) break;
            for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
                const nc = c + dc;
                const nr = r + dr;
                if (!fits(nc, nr)) continue;
                if (dc && dr && (!fits(c + dc, r) || !fits(c, r + dr))) continue;
                const k = key(nc, nr);
                const ng = g.get(cur)! + (dc && dr ? 1.414 : 1);
                if (ng < (g.get(k) ?? Infinity)) {
                    g.set(k, ng);
                    came.set(k, cur);
                    const f = ng + Math.max(Math.abs(nc - tc), Math.abs(nr - tr));
                    push(f, k);
                    if (Math.floor(f) < bi) bi = Math.floor(f);
                }
            }
        }
        const pts: { x: number; y: number }[] = [];
        let cur = best;
        while (cur !== key(sc, sr)) {
            const c = cur % bw;
            const r = (cur - c) / bw;
            pts.push({ x: (c * B + 1) * T, y: (r * B + 1) * T });
            const pr = came.get(cur);
            if (pr === undefined) break;
            cur = pr;
        }
        return pts.reverse();
    }
}
