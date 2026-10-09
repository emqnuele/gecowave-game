import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { REGION_IDS } from '../../src/content/levels';
import { decodeGrid, type RegionFile } from '../../src/world/codec';
import { BODY_H, BODY_W, SimBody, simFrame, SimMap, type Input, type SimAbilities } from '../../src/world/sim';
import { settleAt } from '../../src/world/simreach';
import { abilitiesFor } from './abilities';

// uso: tapes <id,id|all> <cartella> [stanze del percorso]
// nastri di tasti veri per l'harness: il geco simulato cerca una strada dallo spawn verso la stanza
// più avanti nel percorso, e la sequenza di comandi diventa un nastro [fotogramma, tasto, giù/su].
// nel gioco vero il geco la ripete con la fisica vera: non deve arrivare uguale, deve muoversi davvero.
const [which, outDir, roomsArg] = process.argv.slice(2);
const ids = which === 'all' ? REGION_IDS : which.split(',');
const MAX_PATH = Number(roomsArg ?? '6');
const IDLE = 10;
const NONE: Input = { dir: 0, jump: false, dash: false };

type Macro = (f: number, b: SimBody) => Input;

function macros(d: -1 | 1, ab: SimAbilities): { frames: number; walk?: number; input: Macro }[] {
    const out: { frames: number; walk?: number; input: Macro }[] = [];
    for (const n of [10, 24, 48]) out.push({ frames: n, walk: n, input: () => ({ dir: d, jump: false, dash: false }) });
    for (const pre of [0, 6]) {
        for (const hold of [6, 12, 99]) {
            for (const style of ['full', 'none', 'late'] as const) {
                out.push({
                    frames: 160,
                    input: (f) => {
                        if (f < pre) return { dir: d, jump: false, dash: false };
                        const t = f - pre;
                        const dir = style === 'full' ? d : style === 'late' && t >= 8 ? d : 0;
                        return { dir, jump: t < hold, dash: false };
                    },
                });
            }
        }
    }
    if (ab.double) {
        for (const dj of [12, 20, 28]) {
            for (const style of ['full', 'none'] as const) {
                out.push({ frames: 200, input: (f) => ({ dir: style === 'full' ? d : 0, jump: f < dj - 1 || f >= dj, dash: false }) });
            }
        }
    }
    if (ab.dash) {
        out.push({ frames: 40, walk: 40, input: (f) => ({ dir: d, jump: false, dash: f === 1 }) });
        for (const at of [8, 16]) out.push({ frames: 180, input: (f) => ({ dir: d, jump: true, dash: f === at }) });
    }
    if (ab.wall) {
        for (const k of [1, 2, 4]) {
            let jumps = 0;
            let pressAt = -99;
            out.push({
                frames: 260,
                input: (f, b) => {
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
                    return { dir: d, jump, dash: false };
                },
            });
        }
    }
    return out;
}

const keyOf = (cols: number, b: SimBody): number => Math.round((b.y + BODY_H) / 32) * cols + Math.floor((b.x + BODY_W / 2) / 32);

mkdirSync(outDir, { recursive: true });
for (const id of ids) {
    const f = JSON.parse(readFileSync(`public/regions/${id}.json`, 'utf8')) as RegionFile;
    const grid = decodeGrid(f);
    const L = f.layout;
    const m = new SimMap(grid, { breakablesOpen: false });
    const ab = abilitiesFor(id);
    let P = { c: 0, r: 0 };
    grid.forEach((row, r) => {
        const c = row.indexOf('P');
        if (c >= 0) P = { c, r };
    });
    const roomAt = (x: number, y: number) => L.rooms.find((o) => x / 32 >= o.rect.x && x / 32 < o.rect.x + o.rect.w && y / 32 >= o.rect.y && y / 32 < o.rect.y + o.rect.h);
    const pathOf = (b: SimBody): number => {
        const o = roomAt(b.x + BODY_W / 2, b.y + BODY_H / 2);
        if (!o) return -1;
        const p = o.pathIndex >= 0 ? o.pathIndex : L.rooms[o.anchor].pathIndex;
        return p + (o.pathIndex >= 0 ? Math.min(0.99, Math.max(0, ((b.x + BODY_W / 2) / 32 - o.rect.x) / o.rect.w)) : 0);
    };
    const start = settleAt(m, P.c, P.r, ab);
    if (!start) {
        console.log(id, 'niente spawn');
        continue;
    }
    // ricerca in ampiezza sui corpi veri (niente stati canonici): ogni nastro parte da dove il geco è davvero
    const seen = new Map<number, { body: SimBody; parent: number; inputs: Input[] }>();
    const k0 = keyOf(m.cols, start);
    seen.set(k0, { body: start, parent: -1, inputs: [] });
    const queue = [k0];
    const all = [...macros(1, ab), ...macros(-1, ab)];
    for (let qi = 0; qi < queue.length && seen.size < 4000; qi++) {
        const k = queue[qi];
        const node = seen.get(k)!;
        for (const mac of all) {
            const b = node.body.clone();
            const inputs: Input[] = [];
            let airborne = false;
            let ok = false;
            for (let t = 0; t < mac.frames; t++) {
                const inp = mac.input(t, b);
                inputs.push(inp);
                simFrame(m, b, inp, ab);
                if (b.hitSpike || b.y > m.rows * 32) break;
                if (mac.walk) {
                    if (t === mac.frames - 1) ok = true;
                    continue;
                }
                if (!b.blockedDown) {
                    airborne = true;
                    continue;
                }
                if (airborne) {
                    ok = true;
                    break;
                }
            }
            if (!ok) continue;
            for (let i = 0; i < IDLE; i++) {
                inputs.push(NONE);
                simFrame(m, b, NONE, ab);
            }
            if (!b.blockedDown || b.hitSpike) continue;
            const nk = keyOf(m.cols, b);
            if (seen.has(nk)) continue;
            const p = pathOf(b);
            if (p < 0 || p >= MAX_PATH + 1) continue;
            seen.set(nk, { body: b, parent: k, inputs });
            queue.push(nk);
        }
    }
    let best = k0;
    for (const [k, n] of seen) if (pathOf(n.body) > pathOf(seen.get(best)!.body)) best = k;
    const chain: Input[][] = [];
    for (let k = best; k !== k0; k = seen.get(k)!.parent) chain.push(seen.get(k)!.inputs);
    chain.reverse();
    const inputs = chain.flat();
    // da comandi per fotogramma a eventi di tasto
    const events: [number, string, 'down' | 'up'][] = [];
    let prev: Input = NONE;
    const keyFor = (dir: number) => (dir < 0 ? 'KeyA' : 'KeyD');
    inputs.forEach((inp, i) => {
        if (inp.dir !== prev.dir) {
            if (prev.dir) events.push([i, keyFor(prev.dir), 'up']);
            if (inp.dir) events.push([i, keyFor(inp.dir), 'down']);
        }
        if (inp.jump !== prev.jump) events.push([i, 'Space', inp.jump ? 'down' : 'up']);
        if (inp.dash !== prev.dash) events.push([i, 'KeyK', inp.dash ? 'down' : 'up']);
        prev = inp;
    });
    if (prev.dir) events.push([inputs.length, keyFor(prev.dir), 'up']);
    if (prev.jump) events.push([inputs.length, 'Space', 'up']);
    if (prev.dash) events.push([inputs.length, 'KeyK', 'up']);
    // la traiettoria del corpo simulato, per capire dove il geco vero si stacca
    const traj: [number, number][] = [];
    {
        const b = start.clone();
        for (const inp of inputs) {
            simFrame(m, b, inp, ab);
            traj.push([Math.round(b.x * 10) / 10, Math.round(b.y * 10) / 10]);
        }
    }
    const end = seen.get(best)!.body;
    const tape = {
        region: id, abilities: ab, frames: inputs.length, macros: chain.length, states: seen.size,
        expect: { x: Math.round(end.x + BODY_W / 2), y: Math.round(end.y + BODY_H / 2), path: Number(pathOf(end).toFixed(2)) },
        start: [start.x, start.y],
        events,
        traj,
    };
    writeFileSync(`${outDir}/${id}.json`, `${JSON.stringify(tape)}\n`);
    console.log(id, `${chain.length} mosse, ${inputs.length} fotogrammi, stanza ${tape.expect.path}, ${seen.size} stati`);
}
