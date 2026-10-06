import { Grid } from './grid';
import type { Moves, Rect } from './types';

/* il geco in celle: sta in (c, r) col corpo su r-1..r e i piedi su r+1.
   salto singolo ~3.7 celle, doppio ~6.5: teniamo margini prudenti */

export const BASIC: Moves = { rise: 3, run: 5 };
export const DASH: Moves = { rise: 3, run: 7 };
export const FULL: Moves = { rise: 5, run: 8 };

export interface Cell {
    c: number;
    r: number;
}

const MAX_FALL = 70;

/** archi di salto verso l'alto o in piano: colonna di partenza, fascia all'apice, colonna d'arrivo */
function arcClear(g: Grid, c: number, r: number, c2: number, r2: number, apex: number): boolean {
    for (let y = r; y >= apex - 1; y--) if (!g.open(c, y)) return false;
    const step = c2 > c ? 1 : -1;
    if (c2 !== c) {
        for (let x = c; x !== c2 + step; x += step) {
            if (!g.open(x, apex) || !g.open(x, apex - 1)) return false;
        }
    }
    for (let y = apex - 1; y <= r2; y++) if (!g.open(c2, y)) return false;
    return true;
}

/** vicini raggiungibili da una cella in piedi */
export function neighbors(g: Grid, c: number, r: number, m: Moves, out: number[]): void {
    out.length = 0;
    const cols = g.cols;
    // salti in su o in piano
    for (let dr = -m.rise; dr <= 0; dr++) {
        const r2 = r + dr;
        for (let dc = -m.run; dc <= m.run; dc++) {
            if (dc === 0 && dr === 0) continue;
            const c2 = c + dc;
            if (!g.standable(c2, r2)) continue;
            // all'apice i piedi arrivano alla quota d'arrivo: i valori di salto
            // usati sono già più bassi di quelli veri, il margine sta lì
            const apex = Math.max(r - m.rise, Math.min(r, r2));
            if (arcClear(g, c, r, c2, r2, apex)) out.push(r2 * cols + c2);
        }
    }
    // cadute: cammini fino al bordo e ti lasci andare, con deriva fino a `run`
    for (const s of [-1, 1]) {
        for (let h = 1; h <= m.run + 2; h++) {
            const x = c + s * h;
            if (!g.open(x, r) || !g.open(x, r - 1)) break;
            if (g.standable(x, r)) continue;
            let y = r + 1;
            while (y < r + MAX_FALL && g.open(x, y) && y < g.rows) y++;
            if (y >= g.rows) continue;
            if (g.standable(x, y - 1)) out.push((y - 1) * cols + x);
        }
    }
}

export interface Reach {
    /** 1 se la cella in piedi è raggiungibile dalla partenza */
    reached: Uint8Array;
    /** 1 se da lì si può ancora arrivare all'uscita */
    finishes: Uint8Array;
}

/** raggiungibilità in avanti dalla partenza e all'indietro dall'uscita */
export function analyze(g: Grid, start: Cell, exits: Cell[], m: Moves, bounds?: Rect): Reach {
    const n = g.cols * g.rows;
    const reached = new Uint8Array(n);
    const finishes = new Uint8Array(n);
    const inBounds = (c: number, r: number) =>
        !bounds || (c >= bounds.x && r >= bounds.y && c < bounds.x + bounds.w && r < bounds.y + bounds.h);

    // archi salvati per poter rifare la visita al contrario
    const from: number[] = [];
    const to: number[] = [];
    const queue: number[] = [];
    const nb: number[] = [];
    const s0 = start.r * g.cols + start.c;
    if (!g.standable(start.c, start.r)) return { reached, finishes };
    reached[s0] = 1;
    queue.push(s0);
    for (let qi = 0; qi < queue.length; qi++) {
        const cur = queue[qi];
        const c = cur % g.cols;
        const r = (cur - c) / g.cols;
        neighbors(g, c, r, m, nb);
        for (const nx of nb) {
            const nc = nx % g.cols;
            const nr = (nx - nc) / g.cols;
            if (!inBounds(nc, nr)) continue;
            from.push(cur);
            to.push(nx);
            if (!reached[nx]) {
                reached[nx] = 1;
                queue.push(nx);
            }
        }
    }

    // grafo inverso: chi arriva a ogni cella
    const head = new Int32Array(n).fill(-1);
    const next = new Int32Array(from.length);
    for (let i = 0; i < from.length; i++) {
        next[i] = head[to[i]];
        head[to[i]] = i;
    }
    const back: number[] = [];
    for (const e of exits) {
        const k = e.r * g.cols + e.c;
        if (reached[k] && !finishes[k]) {
            finishes[k] = 1;
            back.push(k);
        }
    }
    for (let qi = 0; qi < back.length; qi++) {
        for (let i = head[back[qi]]; i !== -1; i = next[i]) {
            const src = from[i];
            if (!finishes[src]) {
                finishes[src] = 1;
                back.push(src);
            }
        }
    }
    return { reached, finishes };
}

/** la cella in piedi più vicina sotto o accanto a (c, r), entro un raggio */
export function nearestStand(g: Grid, c: number, r: number, radius = 6): Cell | null {
    for (let d = 0; d <= radius; d++) {
        for (let dy = -d; dy <= d; dy++) {
            for (let dx = -d; dx <= d; dx++) {
                if (Math.max(Math.abs(dx), Math.abs(dy)) !== d) continue;
                if (g.standable(c + dx, r + dy)) return { c: c + dx, r: r + dy };
            }
        }
    }
    return null;
}
