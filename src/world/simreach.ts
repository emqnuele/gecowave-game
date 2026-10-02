import { TILE } from '../config';
import { BODY_H, BODY_W, SimBody, simFrame, type Input, type SimAbilities, type SimMap } from './sim';

/* raggiungibilità col geco simulato: da ogni posizione in piedi si provano
   camminate, cadute e un ventaglio di salti (corti, lunghi, doppi, col dash).
   le posizioni sono chiavi di cella (colonna del centro, riga del pavimento) */

export interface SimReach {
    cols: number;
    rows: number;
    /** chiave = riga del pavimento * cols + colonna del centro del corpo */
    reached: Map<number, SimBody>;
    /** archi trovati, per la visita all'indietro */
    edges: Map<number, number[]>;
}

export const keyOf = (m: { cols: number }, b: SimBody): number => {
    const col = Math.floor((b.x + BODY_W / 2) / TILE);
    const floorRow = Math.round((b.y + BODY_H) / TILE);
    return floorRow * m.cols + col;
};

interface Macro {
    frames: number;
    /** air = fotogrammi passati in aria dal primo distacco, -1 se ancora a terra */
    input(f: number, air: number): Input;
    /** la camminata si ferma appena cambia cella da terra */
    walk?: boolean;
}

const NONE: Input = { dir: 0, jump: false, dash: false };

function buildMacros(d: -1 | 1, ab: SimAbilities): Macro[] {
    const out: Macro[] = [];
    // camminate: un passo, o giù dal bordo con tre modi di cadere
    for (const fall of ['hold', 'release', 'reverse'] as const) {
        out.push({
            frames: 260,
            walk: true,
            input(_f, air) {
                if (fall === 'hold' || air < 2) return { dir: d, jump: false, dash: false };
                return { dir: fall === 'release' ? 0 : (-d as -1 | 1), jump: false, dash: false };
            },
        });
    }
    const hz: [number, number][] = [[0, 999], [8, 999], [16, 999], [24, 999], [0, 8], [0, 16], [0, 26], [999, 999]];
    for (const pre of [0, 5]) {
        for (const hold of [4, 10, 99]) {
            for (const [h0, h1] of hz) {
                out.push({
                    frames: 200,
                    input(f) {
                        if (f < pre) return { dir: d, jump: false, dash: false };
                        const t = f - pre;
                        const dir = t >= h0 && t < h1 ? d : 0;
                        return { dir, jump: t < hold, dash: false };
                    },
                });
            }
        }
    }
    if (ab.double) {
        const hz2: [number, number][] = [[0, 999], [16, 999], [30, 999], [0, 20], [0, 36], [999, 999]];
        for (const dj of [10, 18, 26, 34]) {
            for (const [h0, h1] of hz2) {
                out.push({
                    frames: 220,
                    input(f) {
                        const dir = f >= h0 && f < h1 ? d : 0;
                        // il secondo salto è un nuovo "premuto": un fotogramma di rilascio prima
                        const jump = f < dj - 1 || f >= dj;
                        return { dir, jump, dash: false };
                    },
                });
            }
        }
    }
    if (ab.dash) {
        out.push({
            frames: 200,
            input(f) {
                return { dir: d, jump: false, dash: f === 1 };
            },
        });
        for (const at of [6, 14, 24, 34]) {
            for (const stop of [999, at + 14]) {
                out.push({
                    frames: 220,
                    input(f) {
                        return { dir: f < stop ? d : 0, jump: true, dash: f === at };
                    },
                });
            }
        }
        if (ab.double) {
            for (const [dj, at] of [[20, 10], [20, 30], [14, 36], [30, 18]]) {
                out.push({
                    frames: 240,
                    input(f) {
                        return { dir: d, jump: f < dj - 1 || f >= dj, dash: f === at };
                    },
                });
            }
        }
    }
    return out;
}

/** il corpo fermo in piedi sulla cella più vicina sotto (c, r) */
export function settleAt(m: SimMap, c: number, r: number, ab: SimAbilities): SimBody | null {
    let fr = r;
    while (fr < m.rows && !m.isSolid(c, fr)) fr++;
    if (fr >= m.rows) return null;
    const b = new SimBody();
    b.x = c * TILE + TILE / 2 - BODY_W / 2;
    b.y = fr * TILE - BODY_H - 1;
    for (let i = 0; i < 20; i++) simFrame(m, b, NONE, ab);
    if (!b.blockedDown) return null;
    return rest(b);
}

/** stato canonico a riposo: fermo, timer azzerati */
function rest(b: SimBody): SimBody {
    const r = b.clone();
    r.vx = 0;
    r.vy = 0;
    r.ax = 0;
    r.now = 0;
    r.coyoteUntil = 0;
    r.bufferUntil = 0;
    r.airJumpUsed = false;
    r.dashing = false;
    r.dashUntil = 0;
    r.dashCooldownUntil = 0;
    r.gravity = true;
    r.prevJump = false;
    r.prevDash = false;
    r.hitSpike = false;
    return r;
}

export function simReach(m: SimMap, start: SimBody, ab: SimAbilities, limit?: { x0: number; x1: number; y0: number; y1: number }): SimReach {
    const reached = new Map<number, SimBody>();
    const edges = new Map<number, number[]>();
    const macros = [...buildMacros(1, ab), ...buildMacros(-1, ab)];
    const k0 = keyOf(m, start);
    reached.set(k0, start);
    const queue = [k0];
    for (let qi = 0; qi < queue.length; qi++) {
        const k = queue[qi];
        const base = reached.get(k)!;
        const outs = new Set<number>();
        for (const mac of macros) {
            const b = base.clone();
            let airborne = false;
            let airAt = -1;
            for (let f = 0; f < mac.frames; f++) {
                simFrame(m, b, mac.input(f, airAt < 0 ? -1 : f - airAt), ab);
                if (b.hitSpike) break;
                if (b.y > m.rows * TILE) break;
                if (!b.blockedDown) {
                    if (!airborne) airAt = f;
                    airborne = true;
                    continue;
                }
                const nk = keyOf(m, b);
                if (mac.walk && !airborne) {
                    if (nk !== k) {
                        outs.add(nk);
                        if (!reached.has(nk)) {
                            reached.set(nk, rest(b));
                            queue.push(nk);
                        }
                        break;
                    }
                    continue;
                }
                if (!airborne) continue;
                // atterrato: un fotogramma fermo a terra per non contare i rimbalzi sui bordi
                if (nk !== k) {
                    outs.add(nk);
                    if (!reached.has(nk)) {
                        const nb = rest(b);
                        if (!limit || (nb.x >= limit.x0 && nb.x < limit.x1 && nb.y >= limit.y0 && nb.y < limit.y1)) {
                            reached.set(nk, nb);
                            queue.push(nk);
                        }
                    }
                }
                break;
            }
        }
        edges.set(k, [...outs]);
    }
    return { cols: m.cols, rows: m.rows, reached, edges };
}

/** chi da lì può ancora arrivare a una delle chiavi d'arrivo */
export function canFinish(r: SimReach, goals: number[]): Set<number> {
    const back = new Map<number, number[]>();
    for (const [from, tos] of r.edges) {
        for (const to of tos) {
            let l = back.get(to);
            if (!l) back.set(to, (l = []));
            l.push(from);
        }
    }
    const ok = new Set<number>();
    const q: number[] = [];
    for (const g of goals) {
        if (r.reached.has(g) && !ok.has(g)) {
            ok.add(g);
            q.push(g);
        }
    }
    for (let i = 0; i < q.length; i++) {
        for (const p of back.get(q[i]) ?? []) {
            if (!ok.has(p)) {
                ok.add(p);
                q.push(p);
            }
        }
    }
    return ok;
}
