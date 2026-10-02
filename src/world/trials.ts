import { TILE } from '../config';
import { BODY_H, BODY_W, SimMap, type SimAbilities } from './sim';
import { settleAt, simReach } from './simreach';
import type { RegionLayout, TrialLeg } from './types';

/* le corse contro il citelis: per ogni coppia di microfoni consecutivi sul
   percorso, il tempo più breve del geco simulato con la fisica vera.
   il gioco ci costruisce il limite: mai una corsa impossibile */

export function computeTrials(grid: string[], layout: RegionLayout, ab: SimAbilities): TrialLeg[] {
    const m = new SimMap(grid, { breakablesOpen: true });
    let P = { c: 0, r: 0 };
    const mics: { id: string; c: number; r: number; order: number }[] = [];
    grid.forEach((row, r) => {
        for (let c = 0; c < row.length; c++) {
            if (row[c] === 'P') P = { c, r };
            if (row[c] !== 'C') continue;
            const room = layout.rooms.find((o) => c >= o.rect.x && c < o.rect.x + o.rect.w && r >= o.rect.y && r < o.rect.y + o.rect.h);
            const anchor = room && room.pathIndex < 0 ? layout.rooms.find((o) => o.id === room.anchor) : room;
            mics.push({ id: `cp-${c}-${r}`, c, r, order: (anchor?.pathIndex ?? 999) + c / 1e5 });
        }
    });
    const start = settleAt(m, P.c, P.r, ab);
    if (!start || mics.length < 2) return [];
    const reach = simReach(m, start, ab);
    // la chiave in piedi più vicina al microfono, sullo stesso pavimento o quasi
    const keyNear = (c: number, r: number): number | null => {
        let best: number | null = null;
        let bd = Infinity;
        for (const [k, b] of reach.reached) {
            const bc = Math.floor((b.x + BODY_W / 2) / TILE);
            const br = Math.round((b.y + BODY_H) / TILE) - 1;
            const d = Math.abs(bc - c) + Math.abs(br - r) * 2;
            if (d < bd && d <= 6) {
                bd = d;
                best = k;
            }
        }
        return best;
    };
    mics.sort((a, b) => a.order - b.order);
    const legs: TrialLeg[] = [];
    for (let i = 0; i + 1 < mics.length; i++) {
        const a = keyNear(mics[i].c, mics[i].r);
        const b = keyNear(mics[i + 1].c, mics[i + 1].r);
        if (a === null || b === null) continue;
        const f = shortest(reach.edges, reach.frames, a, b);
        if (f !== null) legs.push({ from: mics[i].id, to: mics[i + 1].id, frames: f });
    }
    return legs;
}

/** dijkstra sugli archi pesati in fotogrammi */
function shortest(edges: Map<number, number[]>, frames: Map<number, number[]>, from: number, to: number): number | null {
    const dist = new Map<number, number>([[from, 0]]);
    // coda a mucchio binario: le regioni hanno migliaia di stati
    const heap: [number, number][] = [[0, from]];
    const push = (d: number, k: number) => {
        heap.push([d, k]);
        let i = heap.length - 1;
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (heap[p][0] <= heap[i][0]) break;
            [heap[p], heap[i]] = [heap[i], heap[p]];
            i = p;
        }
    };
    const pop = (): [number, number] => {
        const top = heap[0];
        const last = heap.pop()!;
        if (heap.length) {
            heap[0] = last;
            let i = 0;
            for (;;) {
                const l = i * 2 + 1;
                const r = l + 1;
                let s = i;
                if (l < heap.length && heap[l][0] < heap[s][0]) s = l;
                if (r < heap.length && heap[r][0] < heap[s][0]) s = r;
                if (s === i) break;
                [heap[s], heap[i]] = [heap[i], heap[s]];
                i = s;
            }
        }
        return top;
    };
    while (heap.length) {
        const [d, k] = pop();
        if (k === to) return d;
        if (d > (dist.get(k) ?? Infinity)) continue;
        const outs = edges.get(k) ?? [];
        const fs = frames.get(k) ?? [];
        for (let i = 0; i < outs.length; i++) {
            const nd = d + fs[i];
            if (nd < (dist.get(outs[i]) ?? Infinity)) {
                dist.set(outs[i], nd);
                push(nd, outs[i]);
            }
        }
    }
    return null;
}
