import type { Rect } from './types';

/* la griglia della regione con le operazioni del room builder:
   si parte dalla roccia piena e si scava */

export const SOLID = '#';
export const AIR = '.';
export const SPIKE = '^';
export const WATER = '~';
export const FAKE = 'F';
export const BREAK = '%';

export class Grid {
    readonly cols: number;
    readonly rows: number;
    private cells: string[];
    /** celle dello scheletro percorribile: l'aria resta aria, i gradini restano pieni */
    private lockAir: Uint8Array;
    private lockSolid: Uint8Array;

    constructor(cols: number, rows: number, fill = SOLID) {
        this.cols = cols;
        this.rows = rows;
        this.cells = new Array(cols * rows).fill(fill);
        this.lockAir = new Uint8Array(cols * rows);
        this.lockSolid = new Uint8Array(cols * rows);
    }

    lock(c: number, r: number): void {
        if (!this.inside(c, r)) return;
        const k = r * this.cols + c;
        if (this.solid(c, r)) this.lockSolid[k] = 1;
        else this.lockAir[k] = 1;
    }

    lockedAir(c: number, r: number): boolean {
        return this.inside(c, r) && this.lockAir[r * this.cols + c] === 1;
    }

    lockedSolid(c: number, r: number): boolean {
        return this.inside(c, r) && this.lockSolid[r * this.cols + c] === 1;
    }

    locked(c: number, r: number): boolean {
        const k = r * this.cols + c;
        return this.inside(c, r) && (this.lockAir[k] === 1 || this.lockSolid[k] === 1);
    }

    /** scrittura che ignora i blocchi: per varchi e lettere delle entità */
    force(c: number, r: number, ch: string): void {
        if (this.inside(c, r)) this.cells[r * this.cols + c] = ch;
    }

    inside(c: number, r: number): boolean {
        return c >= 0 && r >= 0 && c < this.cols && r < this.rows;
    }

    get(c: number, r: number): string {
        return this.inside(c, r) ? this.cells[r * this.cols + c] : SOLID;
    }

    set(c: number, r: number, ch: string): void {
        if (!this.inside(c, r)) return;
        const k = r * this.cols + c;
        const blocking = ch === SOLID || ch === BREAK || ch === SPIKE;
        if (blocking && this.lockAir[k]) return;
        if (!blocking && this.lockSolid[k]) return;
        this.cells[k] = ch;
    }

    solid(c: number, r: number): boolean {
        const ch = this.get(c, r);
        return ch === SOLID || ch === BREAK;
    }

    /** cella attraversabile dal corpo del geco */
    open(c: number, r: number): boolean {
        const ch = this.get(c, r);
        return ch !== SOLID && ch !== BREAK && ch !== SPIKE;
    }

    /** cella completamente vuota, buona per piazzare cose */
    empty(c: number, r: number): boolean {
        return this.get(c, r) === AIR;
    }

    fill(r: Rect, ch: string): void {
        for (let y = r.y; y < r.y + r.h; y++) {
            for (let x = r.x; x < r.x + r.w; x++) this.set(x, y, ch);
        }
    }

    carve(r: Rect): void {
        this.fill(r, AIR);
    }

    /** ellisse scavata con bordo sfrangiato dal rumore */
    carveBlob(cx: number, cy: number, rx: number, ry: number, rnd: () => number, clip?: Rect): void {
        const x0 = Math.floor(cx - rx - 1);
        const x1 = Math.ceil(cx + rx + 1);
        const y0 = Math.floor(cy - ry - 1);
        const y1 = Math.ceil(cy + ry + 1);
        for (let y = y0; y <= y1; y++) {
            for (let x = x0; x <= x1; x++) {
                if (clip && (x < clip.x || y < clip.y || x >= clip.x + clip.w || y >= clip.y + clip.h)) continue;
                const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
                if (d < 0.82 + rnd() * 0.3) this.set(x, y, AIR);
            }
        }
    }

    /** piattaforma piena, spessa `thick` celle */
    platform(c: number, r: number, w: number, thick = 1): void {
        for (let y = r; y < r + thick; y++) {
            for (let x = c; x < c + w; x++) this.set(x, y, SOLID);
        }
    }

    /** spine appoggiate sul pavimento della fila r (le spine stanno in r, la roccia in r+1) */
    spikes(c: number, r: number, w: number): void {
        for (let x = c; x < c + w; x++) {
            if (this.get(x, r) === AIR && this.solid(x, r + 1)) this.set(x, r, SPIKE);
        }
    }

    toStrings(): string[] {
        const out: string[] = [];
        for (let r = 0; r < this.rows; r++) out.push(this.cells.slice(r * this.cols, (r + 1) * this.cols).join(''));
        return out;
    }

    /** cella dove il geco sta in piedi: libera, testa libera, roccia sotto */
    standable(c: number, r: number): boolean {
        const here = this.get(c, r);
        if (here !== AIR && here !== WATER && here !== FAKE) return false;
        if (!this.open(c, r - 1)) return false;
        const below = this.get(c, r + 1);
        return below === SOLID || below === BREAK;
    }
}
