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
    /** fotogrammi del macro più rapido per ogni arco, allineati a edges */
    frames: Map<number, number[]>;
}

export const keyOf = (m: { cols: number }, b: SimBody): number => {
    const col = Math.floor((b.x + BODY_W / 2) / TILE);
    const floorRow = Math.round((b.y + BODY_H) / TILE);
    return floorRow * m.cols + col;
};

interface Macro {
    frames: number;
    /** air = fotogrammi passati in aria dal primo distacco, -1 se ancora a terra */
    input(f: number, air: number, b: SimBody): Input;
    /** la camminata si ferma appena cambia cella da terra */
    walk?: boolean;
    /** abilità usate da questo macro: i salti normali si fanno senza aggrapparsi
        (chi vuole il doppio salto accanto a un muro molla la direzione) */
    ab?: SimAbilities;
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
    for (const pre of [0, 5, 10]) {
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
    if (ab.wall) {
        // arrampicata: contro il muro, salto dal muro appena attaccati, poi di nuovo verso il muro;
        // dopo k salti si tiene la direzione per montare sul bordo, o si va dall'altra parte
        for (const k of [1, 2, 3, 5]) {
            for (const finish of ['wall', 'away'] as const) {
                let jumps = 0;
                let pressAt = -99;
                out.push({
                    frames: 300,
                    ab,
                    input(f, _air, b) {
                        if (f === 0) {
                            jumps = 0;
                            pressAt = -99;
                        }
                        const attached = b.wallSide !== 0 && b.now < b.wallUntil;
                        let jump = f < 14;
                        if (f >= 14 && attached && jumps < k && f - pressAt > 4) {
                            pressAt = f;
                            jumps++;
                        }
                        if (f >= 14 && f - pressAt <= 13) jump = f - pressAt >= 1;
                        const back = jumps >= k && finish === 'away' ? -d : d;
                        return { dir: back as -1 | 1, jump, dash: false };
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

/** chi atterra in una cella può sempre mettersi al centro: si riparte da lì se il corpo ci sta
    e resta sullo stesso pavimento, altrimenti dal punto d'atterraggio */
function placed(m: SimMap, landed: SimBody, ab: SimAbilities, key: number, x: number): SimBody | null {
    const c = rest(landed);
    c.x = x;
    c.y -= 1;
    for (let i = 0; i < 3; i++) simFrame(m, c, NONE, ab);
    if (c.blockedDown && keyOf(m, c) === key && Math.abs(c.x - x) < 1) return rest(c);
    return null;
}

/** un'altra partenza nella stessa cella: il centro, se il corpo ci sta */
function variants(m: SimMap, landed: SimBody, ab: SimAbilities, key: number): SimBody[] {
    const col = Math.floor((landed.x + BODY_W / 2) / TILE);
    const cx = col * TILE + TILE / 2 - BODY_W / 2;
    const out: SimBody[] = [];
    for (const x of [cx]) {
        if ([landed, ...out].some((o) => Math.abs(o.x - x) < 3)) continue;
        const v = placed(m, landed, ab, key, x);
        if (v) out.push(v);
    }
    return out;
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
    r.wallSide = 0;
    r.wallUntil = 0;
    r.wallLockUntil = 0;
    r.blockedLeft = false;
    r.blockedRight = false;
    return r;
}

export function simReach(m: SimMap, start: SimBody, ab: SimAbilities, limit?: { x0: number; x1: number; y0: number; y1: number }): SimReach {
    const reached = new Map<number, SimBody>();
    const edges = new Map<number, number[]>();
    const frames = new Map<number, number[]>();
    const plain: SimAbilities = { ...ab, wall: false };
    const macros = [...buildMacros(1, ab), ...buildMacros(-1, ab)].map((mac) => (mac.ab ? mac : { ...mac, ab: plain }));
    const k0 = keyOf(m, start);
    reached.set(k0, start);

    // altre partenze per cella: un giocatore vero si sistema dove gli serve
    const alt = new Map<number, SimBody[]>();
    const add = (nk: number, landed: SimBody): void => {
        const r = rest(landed);
        reached.set(nk, r);
        alt.set(nk, variants(m, r, ab, nk));
        queue.push(nk);
    };
    const queue = [k0];
    for (let qi = 0; qi < queue.length; qi++) {
        const k = queue[qi];
        const outs = new Map<number, number>();
        const out = (nk: number, f: number) => outs.set(nk, Math.min(outs.get(nk) ?? Infinity, f + 1));
        const bases = [reached.get(k)!, ...(alt.get(k) ?? [])];
        for (const base of bases) for (const mac of macros) {
            const b = base.clone();
            let airborne = false;
            let airAt = -1;
            for (let f = 0; f < mac.frames; f++) {
                simFrame(m, b, mac.input(f, airAt < 0 ? -1 : f - airAt, b), mac.ab ?? ab);
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
                        out(nk, f);
                        if (!reached.has(nk)) add(nk, b);
                        break;
                    }
                    continue;
                }
                if (!airborne) continue;
                // atterrato: un fotogramma fermo a terra per non contare i rimbalzi sui bordi
                if (nk !== k) {
                    out(nk, f);
                    if (!reached.has(nk) && (!limit || (b.x >= limit.x0 && b.x < limit.x1 && b.y >= limit.y0 && b.y < limit.y1))) add(nk, b);
                }
                break;
            }
        }
        edges.set(k, [...outs.keys()]);
        frames.set(k, [...outs.values()]);
    }
    return { cols: m.cols, rows: m.rows, reached, edges, frames };
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
