/* chi arriva dalla rete si disegna un po' nel passato, tra due stati veri:
   si vede fluido anche se i pacchetti arrivano a scatti o qualcuno si perde */

export interface Sample {
    /** istante dello stato, già portato sul mio orologio */
    t: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
}

const KEEP = 12;
/** oltre l'ultimo stato si prosegue per poco: poi meglio fermarsi che inventare */
const MAX_EXTRAPOLATE_MS = 120;

/** gli stati di un corpo, in ordine di tempo */
export class NetTrack<S extends Sample = Sample> {
    private samples: S[] = [];

    push(s: S): void {
        const list = this.samples;
        // fuori ordine o doppio: lo stato più vecchio di quello che ho non serve
        if (list.length && s.t <= list[list.length - 1]!.t) return;
        list.push(s);
        if (list.length > KEEP) list.splice(0, list.length - KEEP);
    }

    clear(): void {
        this.samples = [];
    }

    get latest(): S | null {
        return this.samples[this.samples.length - 1] ?? null;
    }

    get size(): number {
        return this.samples.length;
    }

    /** posizione all'istante t; insieme lo stato discreto più vicino (animazione, versi) */
    at(t: number, out: { x: number; y: number; vx: number; vy: number }): S | null {
        const list = this.samples;
        if (!list.length) return null;
        const first = list[0]!;
        if (t <= first.t) {
            out.x = first.x;
            out.y = first.y;
            out.vx = first.vx;
            out.vy = first.vy;
            return first;
        }
        for (let i = list.length - 1; i > 0; i--) {
            const a = list[i - 1]!;
            const b = list[i]!;
            if (t >= a.t && t <= b.t) {
                const k = b.t === a.t ? 1 : (t - a.t) / (b.t - a.t);
                // un salto enorme tra due stati è un teletrasporto, non un movimento
                if (Math.abs(b.x - a.x) > 600 || Math.abs(b.y - a.y) > 600) {
                    out.x = k < 0.5 ? a.x : b.x;
                    out.y = k < 0.5 ? a.y : b.y;
                } else {
                    out.x = a.x + (b.x - a.x) * k;
                    out.y = a.y + (b.y - a.y) * k;
                }
                out.vx = a.vx + (b.vx - a.vx) * k;
                out.vy = a.vy + (b.vy - a.vy) * k;
                return k < 0.5 ? a : b;
            }
        }
        const last = list[list.length - 1]!;
        const dt = Math.min(MAX_EXTRAPOLATE_MS, t - last.t) / 1000;
        out.x = last.x + last.vx * dt;
        out.y = last.y + last.vy * dt;
        out.vx = last.vx;
        out.vy = last.vy;
        return last;
    }
}

/** quanto indietro disegnare: il minimo che copre il ritmo dei pacchetti e il loro tremolio */
export class InterpDelay {
    private lastArrival = 0;
    private gapAvg: number;
    private jitter = 0;
    private readonly minMs: number;
    private readonly maxMs: number;

    constructor(expectedGapMs: number, minMs = 60, maxMs = 300) {
        this.gapAvg = expectedGapMs;
        this.minMs = minMs;
        this.maxMs = maxMs;
    }

    arrived(now: number): void {
        if (this.lastArrival > 0) {
            const gap = now - this.lastArrival;
            if (gap < 2000) {
                this.jitter = this.jitter * 0.9 + Math.abs(gap - this.gapAvg) * 0.1;
                this.gapAvg = this.gapAvg * 0.95 + gap * 0.05;
            }
        }
        this.lastArrival = now;
    }

    get ms(): number {
        return Math.max(this.minMs, Math.min(this.maxMs, this.gapAvg * 1.5 + this.jitter * 2.5));
    }
}
