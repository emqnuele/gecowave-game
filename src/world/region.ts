import { biomeFor } from '../content/biomes';
import { ENEMIES } from '../content/enemies';
import { LEVEL_ORDER } from '../content/levels';
import { hashString, mulberry32 } from '../engine/art/ink';
import type { EntitySpec, LevelDef } from '../types';
import { extractBeats, type Beat } from './beats';
import { AIR, Grid, SOLID } from './grid';
import { buildMacro } from './layout';
import { analyze, BASIC, DASH, FULL, nearestStand, type Cell } from './moves';
import { applyDoors, carveRoom, inner, planDoor } from './rooms';
import type { Moves, Rect, RegionLayout, Room } from './types';

/* da un capitolo lineare a una regione: macro-layout, scavo, varchi,
   riparazioni finché il geco non può andare ovunque debba andare,
   poi trama, nemici e ricompense sopra celle davvero raggiungibili */

/** interruttori per il banco di prova offline */
export const GEN_DEBUG: {
    skipCarve: boolean;
    skipRepair?: boolean;
    trace?: (g: Grid, room: Room, label: string) => void;
    onSkeletonFail?: (g: Grid, room: Room, hub: Cell, stand: Cell) => void;
} = { skipCarve: false };

export const SLOT_W = 46;
export const SLOT_H = 26;

export interface Region {
    def: LevelDef;
    layout: RegionLayout;
}

const RESERVED = new Set(['.', '#', 'F', '%', '^', '~', 'P', 'C', 'X']);
const LETTER_POOL = '0123456789!?&$@*+=<>:;|/{}()[]_-abcdefghijklmnopqrstuvwxyzABDEGHIJKLMNOQRSTUVWYZ';

/** ricompense dei rami laterali: un po' di tutto, mai troppo */
const SIDE_REWARDS: { spec: EntitySpec; w: number }[] = [
    { spec: { type: 'barre', amount: 15 }, w: 30 },
    { spec: { type: 'barre', amount: 30 }, w: 14 },
    { spec: { type: 'item', item: 'crocchetta', amount: 2 }, w: 10 },
    { spec: { type: 'barre', amount: 50 }, w: 14 },
    { spec: { type: 'item', item: 'panino-nonna' }, w: 5 },
];

/** capitoli dove si nasconde una tacca per amuleti */
const NOTCH_REGIONS = new Set(['perduta', 'rio', 'ruhra', 'cantina', 'void']);

function movesFor(id: string): Moves {
    const idx = LEVEL_ORDER.indexOf(id);
    if (idx === 0) return BASIC;
    if (idx === 1) return DASH;
    return FULL;
}

interface Placement {
    c: number;
    r: number;
    ch: string;
}

export interface RegionReport {
    exitReached: boolean;
    /** beat del percorso rimasti senza posto */
    lostBeats: number;
    /** celle da cui non si torna all'uscita */
    stuck: number;
    stuckFull: number;
}

/** genera e valida; se qualcosa non torna si riprova con un altro seme */
export function generateRegion(def: LevelDef, maxAttempts = 40, firstAttempt = 0): Region & { report: RegionReport; attempt: number } {
    let best: (Region & { report: RegionReport; attempt: number }) | null = null;
    let lastError: Error | null = null;
    const score = (r: RegionReport) => (r.exitReached ? 0 : 1e6) + r.lostBeats * 1e4 + r.stuck * 10 + r.stuckFull;
    for (let attempt = firstAttempt; attempt < firstAttempt + maxAttempts; attempt++) {
        let res: Region & { report: RegionReport };
        try {
            res = attemptRegion(def, attempt);
        } catch (e) {
            GEN_DEBUG.trace?.(new Grid(1, 1), { id: -1 } as Room, `tentativo ${attempt} fallito: ${(e as Error).message}`);
            lastError = e as Error;
            continue;
        }
        if (!best || score(res.report) < score(best.report)) best = { ...res, attempt };
        if (score(res.report) === 0) break;
    }
    if (!best) throw new Error(`regione ${def.id}: nessun tentativo riuscito (${lastError?.message})`);
    return best;
}

function attemptRegion(def: LevelDef, attempt: number): Region & { report: RegionReport } {
    const biome = biomeFor(def);
    const seed = hashString(`region:${def.id}:${attempt}`);
    const rnd = mulberry32(seed ^ 0x2545f491);
    const ex = extractBeats(def);
    const pathMoves = movesFor(def.id);

    const arenaBeats = ex.beats.filter((b) => b.role === 'boss' || b.role === 'arena');
    const baseW = Math.max(12, Math.min(20, Math.round(ex.oldWidth / 38)));
    const macroH = biome.indoor ? 8 : 7;
    const pathLength = Math.max(18, Math.min(34, Math.max(Math.round(baseW * 1.6), arenaBeats.length * 3 + 10)));
    // tante arene vogliono un percorso lungo, e un percorso lungo vuole spazio
    let macroW = Math.max(baseW, Math.ceil(pathLength * 0.62));
    const branches = Math.round(pathLength * 0.5);

    // ogni beat del percorso finisce nella stanza proporzionale alla sua vecchia x
    const pathBeats = ex.beats.filter((b) => b.role !== 'secret' && b.role !== 'loot');
    const indexOf = (b: Beat) => 1 + Math.floor((b.oldX / Math.max(1, ex.oldWidth)) * (pathLength - 2));
    const arenaAt = new Set<number>();
    const beatRoom = new Map<Beat, number>();
    let lastArena = 0;
    for (const b of pathBeats) {
        let i = Math.min(pathLength - 2, Math.max(1, indexOf(b)));
        if (b.role === 'boss' || b.role === 'arena') {
            // arene distinte e mai attaccate: in mezzo serve almeno una stanza
            while ((arenaAt.has(i) || i <= lastArena + 1) && i < pathLength - 2) i++;
            arenaAt.add(i);
            lastArena = i;
        }
        beatRoom.set(b, i);
    }
    for (const b of pathBeats) {
        if (b.role === 'boss' || b.role === 'arena') continue;
        // il resto della trama non sta nelle arene: arretra alla stanza prima
        let i = beatRoom.get(b)!;
        while (arenaAt.has(i) && i > 1) i--;
        beatRoom.set(b, i);
    }
    const restAt = new Set<number>();
    for (let i = 3; i < pathLength - 1; i += 4) if (!arenaAt.has(i)) restAt.add(i);
    for (const a of arenaAt) if (a - 1 > 0 && !arenaAt.has(a - 1)) restAt.add(a - 1);

    // se il percorso non ci sta, la regione si allarga un po' alla volta
    let macro: ReturnType<typeof buildMacro> | null = null;
    for (let widen = 0; widen <= 8 && !macro; widen += 2) {
        try {
            macro = buildMacro({
                seed,
                macroW: macroW + widen,
                macroH,
                slotW: SLOT_W,
                slotH: SLOT_H,
                pathLength,
                arenaAt,
                restAt,
                branches,
                outdoor: !biome.indoor,
                water: biome.surface.includes('reeds') || biome.ambience.includes('bubbles'),
            });
            macroW += widen;
        } catch {
            macro = null;
        }
    }
    if (!macro) throw new Error('layout: impossibile costruire la regione anche allargandola');
    const rooms = macro.rooms;
    const cols = macroW * SLOT_W;
    const rows = macroH * SLOT_H;
    const g = new Grid(cols, rows);

    // prima i varchi e lo scheletro percorribile nella roccia piena, poi lo stile delle stanze attorno
    const stands = macro.doors.map((d) => planDoor(g, d, rooms));
    applyDoors(g, stands);
    buildSkeletons(g, rooms, stands, pathMoves, mulberry32(seed ^ 0x5eed));
    if (!GEN_DEBUG.skipCarve) for (const room of rooms) carveRoom(g, room, seed, pathMoves);

    const byPath = rooms.filter((r) => r.pathIndex >= 0).sort((a, b) => a.pathIndex - b.pathIndex);
    const startRoom = byPath[0];
    const exitRoom = byPath[byPath.length - 1];
    const sI = inner(startRoom.rect);
    const spawn = nearestStand(g, sI.x + 4, sI.y + sI.h - 2, 30) ?? forceStand(g, sI.x + 4, sI.y + sI.h - 2);
    const eI = inner(exitRoom.rect);
    const exit = nearestStand(g, eI.x + eI.w - 4, eI.y + eI.h - 2, 30) ?? forceStand(g, eI.x + eI.w - 4, eI.y + eI.h - 2);

    // obiettivi da rendere raggiungibili: varchi e cuore di ogni stanza
    const targets: { cell: Cell; room: Room; full: boolean }[] = [];
    stands.forEach((s, di) => {
        const d = macro.doors[di];
        const side = rooms[d.a].pathIndex < 0 || rooms[d.b].pathIndex < 0 || d.kind !== 'open';
        for (const st of s.sides) targets.push({ cell: { c: st.c, r: st.r }, room: rooms[st.room], full: side });
    });
    for (const room of rooms) {
        const I = inner(room.rect);
        const center = nearestStand(g, I.x + Math.floor(I.w / 2), I.y + I.h - 3, 14);
        if (center) targets.push({ cell: center, room, full: room.pathIndex < 0 });
    }
    targets.push({ cell: exit, room: exitRoom, full: false });

    if (!GEN_DEBUG.skipRepair) repair(g, spawn, exit, targets, pathMoves, rooms);

    // ---------- piazzamenti: solo su celle davvero raggiungibili ----------
    const reachPath = analyze(g, spawn, [exit], pathMoves);
    const reachFull = analyze(g, spawn, [exit], FULL);
    const placements: Placement[] = [];
    const taken: Cell[] = [spawn, exit];
    const doorCells = stands.flatMap((s) => s.sides.map((x) => ({ c: x.c, r: x.r })));
    const entities: Record<string, EntitySpec> = { ...def.entities };
    const used = new Set<string>([...Object.keys(def.entities), ...RESERVED]);
    const letters = [...LETTER_POOL].filter((ch) => !used.has(ch));
    const letterFor = (spec: EntitySpec): string => {
        const key = JSON.stringify(spec);
        const found = Object.entries(entities).find(([, s]) => JSON.stringify(s) === key);
        if (found) return found[0];
        const ch = letters.shift();
        if (!ch) throw new Error(`regione ${def.id}: lettere finite per la legenda`);
        entities[ch] = spec;
        return ch;
    };

    const spots = (room: Room, reach: Uint8Array, minDoorDist = 4): Cell[] => {
        const I = inner(room.rect);
        const out: Cell[] = [];
        for (let r = I.y; r < I.y + I.h; r++) {
            for (let c = I.x; c < I.x + I.w; c++) {
                if (!reach[r * cols + c] || g.get(c, r) !== AIR) continue;
                if (doorCells.some((d) => Math.abs(d.c - c) + Math.abs(d.r - r) < minDoorDist)) continue;
                if (g.get(c - 1, r) === '^' || g.get(c + 1, r) === '^') continue;
                out.push({ c, r });
            }
        }
        return out;
    };
    const place = (cell: Cell | null, ch: string): Cell | null => {
        if (!cell) return null;
        placements.push({ c: cell.c, r: cell.r, ch });
        taken.push(cell);
        return cell;
    };
    const far = (cell: Cell, d = 3) => taken.every((t) => Math.abs(t.c - cell.c) + Math.abs(t.r - cell.r) >= d);
    /** la cella libera più vicina a un punto ideale, tra quelle candidate */
    const pickNear = (cands: Cell[], c: number, r: number): Cell | null => {
        let best: Cell | null = null;
        let bd = Infinity;
        for (const x of cands) {
            if (!far(x)) continue;
            const d = Math.abs(x.c - c) + Math.abs(x.r - r) * 2;
            if (d < bd) {
                bd = d;
                best = x;
            }
        }
        return best;
    };

    place(spawn, 'P');
    for (let k = 0; k < 3; k++) placements.push({ c: exit.c, r: exit.r - k, ch: 'X' });

    // microfoni: nelle stanze di riposo e all'inizio
    for (const room of byPath) {
        if (room.kind !== 'rest' && room.pathIndex !== 0) continue;
        const I = inner(room.rect);
        const cand = spots(room, reachPath.reached);
        place(pickNear(cand, room.pathIndex === 0 ? I.x + 12 : I.x + I.w / 2, I.y + I.h), 'C');
    }

    // trama del percorso, in ordine, distribuita dentro ogni stanza
    const progressPairs: [number, number][] = [[0, 0]];
    let lostBeats = 0;
    const perRoom = new Map<number, Beat[]>();
    for (const b of pathBeats) {
        const list = perRoom.get(beatRoom.get(b)!) ?? [];
        list.push(b);
        perRoom.set(beatRoom.get(b)!, list);
    }
    for (const [idx, list] of perRoom) {
        const room = byPath[idx];
        const I = inner(room.rect);
        const cand = spots(room, reachPath.reached);
        list.forEach((b, k) => {
            let cell: Cell | null;
            if (b.role === 'door') {
                cell = doorGate(macro.doors, rooms, room) ?? pickNear(cand, I.x + I.w / 2, I.y + I.h);
            } else if (b.role === 'boss' || b.role === 'arena') {
                cell = pickNear(cand, I.x + I.w / 2, I.y + I.h);
            } else {
                const t = (k + 1) / (list.length + 1);
                cell = pickNear(cand, I.x + I.w * t, I.y + I.h);
            }
            if (cell) {
                place(cell, b.ch);
                progressPairs.push([b.oldX, room.pathIndex + (cell.c - room.rect.x) / room.rect.w]);
            } else {
                lostBeats++;
            }
        });
    }
    progressPairs.push([ex.oldWidth, pathLength - 1]);
    progressPairs.sort((a, b) => a[0] - b[0]);

    // segreti: in fondo ai rami, poi dove capita fuori dal percorso
    const sideRooms = rooms.filter((r) => r.pathIndex < 0);
    const secretRooms = [...sideRooms.filter((r) => r.kind === 'secret'), ...sideRooms.filter((r) => r.kind !== 'secret')];
    const secrets = ex.beats.filter((b) => b.role === 'secret');
    let si = 0;
    for (const b of secrets) {
        let cell: Cell | null = null;
        for (let tries = 0; tries < secretRooms.length && !cell; tries++) {
            const room = secretRooms[(si + tries) % secretRooms.length];
            const I = inner(room.rect);
            cell = pickNear(spots(room, reachFull.reached), I.x + I.w / 2, I.y + I.h);
        }
        if (!cell) {
            const room = byPath[Math.min(byPath.length - 2, 1 + Math.floor(rnd() * (byPath.length - 2)))];
            cell = pickNear(spots(room, reachPath.reached), room.rect.x + room.rect.w / 2, room.rect.y + room.rect.h);
        }
        place(cell, b.ch);
        si++;
    }

    // ricompense nei rami rimasti vuoti
    const loot = ex.beats.filter((b) => b.role === 'loot');
    let notchPlaced = !NOTCH_REGIONS.has(def.id);
    for (const room of sideRooms) {
        const I = inner(room.rect);
        const cand = spots(room, reachFull.reached);
        if (cand.length === 0) continue;
        let spec: EntitySpec | null = null;
        if (room.kind === 'secret' && !notchPlaced) {
            spec = { type: 'item', item: 'tacca' };
            notchPlaced = true;
        } else if (loot.length) {
            place(pickNear(cand, I.x + I.w / 2, I.y + I.h), loot.shift()!.ch);
            continue;
        } else if (room.kind === 'secret' || rnd() < 0.55) {
            spec = pickWeighted(rnd, SIDE_REWARDS);
        }
        if (spec) place(pickNear(cand, I.x + I.w * (0.3 + rnd() * 0.4), I.y + I.h), letterFor(spec));
    }

    // nemici: più fitti avanti nel percorso e nei rami, mai nelle stanze sicure
    const pool = ex.enemyPool.length ? ex.enemyPool : [];
    if (pool.length) {
        for (const room of rooms) {
            if (room.kind === 'start' || room.kind === 'rest' || room.kind === 'arena' || room.kind === 'exit') continue;
            const area = (room.rect.w * room.rect.h) / (SLOT_W * SLOT_H);
            const late = room.pathIndex >= 0 ? room.pathIndex / pathLength : 0.6;
            const base = room.kind === 'secret' ? 1 : room.kind === 'gauntlet' ? 3 : 2;
            const count = Math.round(base * area + late * 2 + rnd() * 1.5);
            const reach = room.pathIndex >= 0 ? reachPath.reached : reachFull.reached;
            const cand = spots(room, reach, 7);
            for (let k = 0; k < count && cand.length; k++) {
                const ch = pickWeighted(rnd, pool.map((p) => ({ spec: p.ch, w: p.weight })));
                const spec = def.entities[ch];
                const kind = spec.type === 'enemy' ? spec.kind : null;
                const flyer = kind ? ENEMIES[kind].behavior === 'flyer' : false;
                const cell = cand[Math.floor(rnd() * cand.length)];
                if (!far(cell, 5)) continue;
                if (flyer) {
                    // i volanti stanno a mezz'aria sopra un punto calpestabile
                    let r = cell.r;
                    for (let up = 0; up < 5 && g.open(cell.c, r - 1) && g.open(cell.c, r - 2); up++) r--;
                    place({ c: cell.c, r }, ch);
                } else {
                    place(cell, ch);
                }
            }
        }
    }

    // verifica finale prima di scrivere le lettere: le celle con entità restano aria
    const finalPath = analyze(g, spawn, [exit], pathMoves);
    const finalFull = analyze(g, spawn, [exit], FULL);
    let stuck = 0;
    let stuckFull = 0;
    for (let i = 0; i < finalPath.reached.length; i++) {
        if (finalPath.reached[i] && !finalPath.finishes[i]) stuck++;
        if (finalFull.reached[i] && !finalFull.finishes[i]) stuckFull++;
    }
    const report: RegionReport = { exitReached: finalPath.reached[exit.r * cols + exit.c] === 1, lostBeats, stuck, stuckFull };

    for (const p of placements) g.force(p.c, p.r, p.ch);

    // la linea dell'orizzonte: il pavimento medio delle stanze in superficie
    const surfaceFloors: number[] = [];
    for (const room of rooms.filter((r) => r.surface)) {
        const I = inner(room.rect);
        for (let c = I.x; c < I.x + I.w; c += 4) {
            let r = 0;
            while (r < rows && !g.solid(c, r)) r++;
            if (r < rows) surfaceFloors.push(r);
        }
    }
    const horizonRow = surfaceFloors.length
        ? Math.round(surfaceFloors.reduce((a, b) => a + b, 0) / surfaceFloors.length)
        : Math.round(rows * 0.4);

    const layout: RegionLayout = {
        id: def.id,
        cols,
        rows,
        slotW: SLOT_W,
        slotH: SLOT_H,
        macroW,
        macroH,
        rooms,
        doors: macro.doors,
        pathLength,
        horizonRow,
        progressPairs,
    };
    return { def: { ...def, grid: g.toStrings(), entities }, layout, report };
}

function pickWeighted<T>(rnd: () => number, list: { spec: T; w: number }[]): T {
    const total = list.reduce((s, e) => s + e.w, 0);
    let x = rnd() * total;
    for (const e of list) {
        x -= e.w;
        if (x <= 0) return e.spec;
    }
    return list[list.length - 1].spec;
}

/** se manca un punto d'appoggio, lo si costruisce */
function forceStand(g: Grid, c: number, r: number): Cell {
    for (let y = r - 3; y <= r; y++) for (let x = c - 2; x <= c + 2; x++) g.set(x, y, AIR);
    for (let x = c - 2; x <= c + 2; x++) g.set(x, r + 1, SOLID);
    return { c, r };
}

/** una porta della mente: il cancello va dentro un varco orizzontale del percorso */
function doorGate(doors: RegionLayout['doors'], rooms: Room[], room: Room): Cell | null {
    for (let i = 0; i < doors.length; i++) {
        const d = doors[i];
        if (d.axis !== 'h' || d.kind !== 'open') continue;
        const other = d.a === room.id ? rooms[d.b] : d.b === room.id ? rooms[d.a] : null;
        if (!other || other.pathIndex !== room.pathIndex + 1) continue;
        return { c: d.x, r: d.y - 1 };
    }
    return null;
}

/* ---------- scheletro ---------- */

/** in ogni stanza: un tronco verticale a due corsie dal fondo fino alla porta
    più alta, e da lì un ramo verso ogni porta, sul lato giusto, così le scale
    non si incrociano. a inizio gioco alcuni rami laterali chiedono salti che
    arriveranno dopo: si torna */
function buildSkeletons(g: Grid, rooms: Room[], plans: ReturnType<typeof planDoor>[], pathMoves: Moves, rnd: () => number): void {
    for (const room of rooms) {
        const I = inner(room.rect);
        // il cancello sta sul ramo verso la stanza dopo, mai sulla stanza stessa:
        // una scala si scende sempre, quindi chi ci cade dentro può risalire
        const gated = room.pathIndex < 0 && pathMoves !== FULL && rnd() < 0.6;
        const m = pathMoves.rise > 3 ? BASIC : pathMoves;
        const step = Math.min(m.rise, 5);
        const doorsHere = plans.flatMap((p) => p.sides.filter((s) => s.room === room.id));
        const meanC = doorsHere.length ? doorsHere.reduce((sum, d) => sum + d.c, 0) / doorsHere.length : I.x + I.w / 2;
        const bottomR = I.y + I.h - 1;
        const top = Math.min(bottomR, ...doorsHere.map((d) => d.r));
        const planTrunk = (t1: number): Cell[] => {
            const t2 = t1 + 5;
            const pts: Cell[] = [{ c: t1, r: bottomR }];
            // solo passi pieni: un passo corto finirebbe sopra la testa del gradino sotto
            while (pts[pts.length - 1].r > top) {
                const prev = pts[pts.length - 1];
                const r = prev.r - step;
                if (r < I.y + 1) break;
                pts.push({ c: prev.c === t1 ? t2 : t1, r });
            }
            return pts;
        };
        // il tronco non deve nascere sopra un buco né scontrarsi coi pianerottoli dei varchi
        const trunkOk = (pts: Cell[]): boolean => {
            for (let i = 0; i < pts.length; i++) {
                const p = pts[i];
                for (let x = p.c - 1; x <= p.c + 1; x++) if (g.lockedAir(x, p.r + 1)) return false;
                if (i === 0) for (let x = p.c - 1; x <= p.c + 1; x++) if (!g.solid(x, p.r + 1)) return false;
                const q = pts[i - 1];
                if (!q) continue;
                for (let x = Math.min(p.c, q.c) - 1; x <= Math.max(p.c, q.c) + 1; x++) {
                    for (let y = p.r - 3; y <= q.r; y++) if (g.lockedSolid(x, y)) return false;
                }
            }
            return true;
        };
        const preferred = Math.round(meanC + (rnd() - 0.5) * 8);
        let t1 = Math.max(I.x + 4, Math.min(I.x + I.w - 10, preferred));
        for (let off = 0; off < I.w; off++) {
            const cand = preferred + (off % 2 ? -1 : 1) * Math.ceil(off / 2);
            if (cand < I.x + 4 || cand > I.x + I.w - 10) continue;
            if (trunkOk(planTrunk(cand))) {
                t1 = cand;
                break;
            }
        }
        const t2 = t1 + 5;
        const trunk = planTrunk(t1);
        const hub = trunk[0];
        forceStand(g, hub.c, hub.r);
        const touched: [number, number][] = [];
        const carve = (x: number, y: number) => {
            if (x <= room.rect.x || y <= room.rect.y || x >= room.rect.x + room.rect.w - 1 || y >= room.rect.y + room.rect.h - 1) return;
            g.set(x, y, AIR);
            touched.push([x, y]);
        };
        const floor = (x: number, y: number) => {
            if (x <= room.rect.x || x >= room.rect.x + room.rect.w - 1 || y >= room.rect.y + room.rect.h) return;
            g.set(x, y, SOLID);
            touched.push([x, y]);
        };
        for (let i = 1; i < trunk.length; i++) {
            const a = trunk[i - 1];
            const b = trunk[i];
            for (let x = Math.min(a.c, b.c) - 1; x <= Math.max(a.c, b.c) + 1; x++) for (let y = b.r - 3; y <= a.r; y++) carve(x, y);
        }
        for (const t of trunk) for (let x = t.c - 1; x <= t.c + 1; x++) floor(x, t.r + 1);
        for (const [x, y] of touched) g.lock(x, y);
        GEN_DEBUG.trace?.(g, room, `tronco t1=${t1} punti=${JSON.stringify(trunk)}`);

        for (const st of doorsHere) {
            // i rami nascono in ordine: un vicino laterale con id più alto è la stanza dopo
            const deeper = plans.some((p) => p.sides.includes(st) && p.sides.some((o) => o.room > room.id && rooms[o.room].pathIndex < 0));
            const bm = gated && deeper ? FULL : m;
            // basi candidate: prima i punti del tronco appena sotto la porta, sul suo lato
            const side = st.c >= (t1 + t2) / 2 ? t2 : t1;
            const bases = [...trunk].sort((x, y) => {
                const score = (t: Cell) => (t.r < st.r ? 100 : 0) + Math.abs(t.r - st.r) + (t.c === side ? 0 : 3);
                return score(x) - score(y);
            });
            let done = false;
            for (const base of bases) {
                if (dig(g, base, { c: st.c, r: st.r }, bm, room.rect, { lock: true, awayFrom: (t1 + t2) / 2, mustWork: true })) {
                    done = true;
                    GEN_DEBUG.trace?.(g, room, `ramo verso ${st.c},${st.r} da ${JSON.stringify(base)}`);
                    break;
                }
            }
            // nessuna base regge: si scava comunque dalla migliore, ci penserà la riparazione
            if (!done) dig(g, bases[0], { c: st.c, r: st.r }, bm, room.rect, { lock: true, awayFrom: (t1 + t2) / 2 });
        }
        if (GEN_DEBUG.onSkeletonFail) {
            const reach = pessimisticReach(g, room.rect, hub, m);
            for (const st of doorsHere) if (!reach?.has(st.r * g.cols + st.c)) GEN_DEBUG.onSkeletonFail(g, room, hub, st);
        }
    }
}

/* ---------- riparazioni ---------- */

interface DigPlan {
    pts: Cell[];
    air: [number, number][];
    solid: [number, number][];
}

/** progetta una scalinata da `from` a `to`: in salita due corsie sfalsate di 5 celle,
    costruite a ritroso dal bersaglio, così nessun pavimento sta sopra la testa del
    salto successivo; in discesa gradini di 3. `sgn` sceglie il lato delle corsie,
    `shift` le sposta di qualche cella per aggirare i conflitti */
function planDig(from: Cell, to: Cell, m: Moves, clip: Rect, sgn: number, shift: number): DigPlan {
    const minC = clip.x + 3;
    const maxC = clip.x + clip.w - 4;
    const clampC = (c: number) => Math.max(minC, Math.min(maxC, c));
    const step = Math.min(m.rise, 5);
    const pts: Cell[] = [{ ...from }];
    if (to.r < from.r) {
        const laneA = clampC(to.c + sgn * (3 + shift));
        const laneB = clampC(to.c + sgn * (8 + shift));
        const seq: Cell[] = [];
        let r = to.r + step;
        for (let k = 0; r < from.r && k < 60; k++, r += step) seq.push({ c: k % 2 === 0 ? laneA : laneB, r });
        const lowest = seq[seq.length - 1];
        if (lowest) {
            // dal punto di partenza si cammina in piano fino sotto l'altra corsia
            const other = lowest.c === laneA ? laneB : laneA;
            if (other !== from.c) pts.push({ c: other, r: from.r });
            for (let i = seq.length - 1; i >= 0; i--) pts.push(seq[i]);
        } else {
            // dislivello piccolo: in piano fino a ridosso, poi un salto solo
            const near = clampC(to.c + sgn * (3 + shift));
            if (Math.abs(near - from.c) > 1) pts.push({ c: near, r: from.r });
        }
    } else if (to.r > from.r) {
        const dir = Math.sign(to.c - from.c) || sgn;
        let cur = { ...from };
        for (let k = 0; cur.r < to.r && k < 60; k++) {
            let nc = cur.c + dir * 3;
            if (nc < minC || nc > maxC) nc = cur.c - dir * 3;
            cur = { c: clampC(nc), r: Math.min(to.r, cur.r + 3) };
            pts.push(cur);
        }
    }
    pts.push({ ...to });

    const inClip = (x: number, y: number) => x > clip.x && y > clip.y && x < clip.x + clip.w - 1 && y < clip.y + clip.h - 1;
    const air: [number, number][] = [];
    const solid: [number, number][] = [];
    const airSet = new Set<string>();
    for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1];
        const b2 = pts[i];
        for (let x = Math.min(a.c, b2.c) - 1; x <= Math.max(a.c, b2.c) + 1; x++) {
            for (let y = Math.min(a.r, b2.r) - 3; y <= Math.max(a.r, b2.r); y++) {
                if (inClip(x, y)) {
                    air.push([x, y]);
                    airSet.add(`${x},${y}`);
                }
            }
        }
    }
    const addSolid = (x: number, y: number) => {
        if (inClip(x, y)) solid.push([x, y]);
    };
    for (let i = 0; i < pts.length; i++) {
        const q = pts[i];
        for (let x = q.c - 1; x <= q.c + 1; x++) addSolid(x, q.r + 1);
        // i tratti in piano vogliono pavimento per tutta la camminata
        const nx = pts[i + 1];
        if (nx && nx.r === q.r) for (let x = Math.min(q.c, nx.c); x <= Math.max(q.c, nx.c); x++) addSolid(x, q.r + 1);
    }
    return { pts, air, solid };
}

/** raggiungibilità nel caso peggiore: dentro la stanza contano solo celle bloccate
    (lo scavo successivo può togliere la roccia libera e aggiungere piattaforme
    nell'aria libera), più le celle che un progetto sta per bloccare. il bordo resta */
export function pessimisticReach(g: Grid, clip: Rect, from: Cell, m: Moves, air?: Set<number>, solid?: Set<number>): Set<number> | null {
    return localReach(g, clip, from, m, true, air, solid);
}

/** raggiungibilità dentro un rettangolo; `pessimistic` vale solo prima dello scavo delle stanze */
function localReach(g: Grid, clip: Rect, from: Cell, m: Moves, pessimistic: boolean, air?: Set<number>, solid?: Set<number>): Set<number> | null {
    const cols = g.cols;
    const view = new Grid(clip.w, clip.h);
    for (let y = 0; y < clip.h; y++) {
        for (let x = 0; x < clip.w; x++) {
            const gx = clip.x + x;
            const gy = clip.y + y;
            const k = gy * cols + gx;
            const border = x === 0 || y === 0 || x === clip.w - 1 || y === clip.h - 1;
            let ch: string;
            if (!pessimistic || border || g.lockedSolid(gx, gy) || g.lockedAir(gx, gy)) ch = g.get(gx, gy);
            else if (solid?.has(k)) ch = SOLID;
            else if (air?.has(k)) ch = AIR;
            else ch = '^';
            view.force(x, y, ch);
        }
    }
    const f = { c: from.c - clip.x, r: from.r - clip.y };
    if (!view.standable(f.c, f.r)) return null;
    const reach = analyze(view, f, [], m);
    const out = new Set<number>();
    for (let i = 0; i < reach.reached.length; i++) {
        if (reach.reached[i]) out.add((clip.y + Math.floor(i / clip.w)) * cols + clip.x + (i % clip.w));
    }
    return out;
}

export interface DigOptions {
    /** celle già percorribili da non rovinare */
    protect?: Uint8Array;
    /** blocca il risultato: lo scavo delle stanze non lo tocca */
    lock?: boolean;
    /** colonna da cui allontanare le corsie */
    awayFrom?: number;
    /** se nessuna variante regge non si scava niente */
    mustWork?: boolean;
    /** verifica sulla griglia vera: le stanze sono già scavate */
    carved?: boolean;
}

/** scava una scalinata percorribile da `from` a `to`, restando dentro `clip`.
    ogni variante viene applicata e verificata col simulatore di salti; se non porta
    a destinazione si annulla e si prova la successiva */
export function dig(g: Grid, from: Cell, to: Cell, m: Moves, clip: Rect, opts: DigOptions = {}): Cell[] | null {
    const { protect, awayFrom, mustWork = false } = opts;
    const baseSgn = awayFrom !== undefined ? Math.sign(to.c - awayFrom) || 1 : Math.sign(from.c - to.c) || 1;
    const cols = g.cols;
    const apply = (plan: DigPlan): [number, string][] => {
        const undo: [number, string][] = [];
        const write = (x: number, y: number, ch: string) => {
            const before = g.get(x, y);
            g.set(x, y, ch);
            if (g.get(x, y) !== before) undo.push([y * cols + x, before]);
        };
        for (const [x, y] of plan.air) {
            // ciò che è già percorribile resta percorribile: niente scavi sotto i piedi altrui
            if (protect && g.solid(x, y) && protect[(y - 1) * cols + x]) continue;
            write(x, y, AIR);
        }
        for (const [x, y] of plan.solid) {
            if (protect && (protect[y * cols + x] || protect[(y + 1) * cols + x])) continue;
            write(x, y, SOLID);
        }
        return undo;
    };
    const revert = (undo: [number, string][]) => {
        for (let i = undo.length - 1; i >= 0; i--) {
            const [k, ch] = undo[i];
            g.force(k % cols, Math.floor(k / cols), ch);
        }
    };
    /* prima dello scavo delle stanze la verifica è pessimistica: dentro la stanza conta
       solo ciò che è bloccato, perché lo scavo successivo può togliere qualsiasi roccia
       libera e aggiungere piattaforme in qualsiasi aria libera. il bordo non si tocca mai */
    const works = (plan: DigPlan): boolean => {
        if (opts.carved) return localReach(g, clip, from, m, false)?.has(to.r * cols + to.c) ?? false;
        const air = new Set(plan.air.map(([x, y]) => y * cols + x));
        const solid = new Set(plan.solid.map(([x, y]) => y * cols + x));
        return pessimisticReach(g, clip, from, m, air, solid)?.has(to.r * cols + to.c) ?? false;
    };
    let chosen: DigPlan | null = null;
    let fallback: DigPlan | null = null;
    outer: for (const sgn of [baseSgn, -baseSgn]) {
        for (const shift of [0, 1, 2, 4, 6]) {
            const plan = planDig(from, to, m, clip, sgn, shift);
            fallback ??= plan;
            const undo = apply(plan);
            if (works(plan)) {
                chosen = plan;
                break outer;
            }
            revert(undo);
        }
    }
    if (!chosen) {
        if (mustWork) return null;
        chosen = fallback!;
        apply(chosen);
    }
    if (opts.lock) {
        for (const [x, y] of chosen.air) g.lock(x, y);
        for (const [x, y] of chosen.solid) g.lock(x, y);
    }
    return chosen.pts;
}

function roomOfCell(rooms: Room[], c: number, r: number): Room | null {
    for (const room of rooms) {
        const R = room.rect;
        if (c >= R.x && r >= R.y && c < R.x + R.w && r < R.y + R.h) return room;
    }
    return null;
}

/** finché qualcosa resta irraggiungibile o senza ritorno, si scava */
function repair(g: Grid, spawn: Cell, exit: Cell, targets: { cell: Cell; room: Room; full: boolean }[], pathMoves: Moves, rooms: Room[]): void {
    const cols = g.cols;
    for (let pass = 0; pass < 2; pass++) {
        const moves = pass === 0 ? pathMoves : FULL;
        for (let iter = 0; iter < 120; iter++) {
            const reach = analyze(g, spawn, [exit], moves);
            const missing = targets.filter((t) => (pass === 1 || !t.full) && !reach.reached[t.cell.r * cols + t.cell.c]);
            if (missing.length === 0) break;
            // si ripara ogni stanza dove c'è già un appiglio raggiungibile; le altre al giro dopo
            let fixed = 0;
            const busy = new Set<number>();
            for (const t of missing) {
                if (busy.has(t.room.id)) continue;
                const src = nearestReached(reach.reached, cols, inner(t.room.rect), t.cell);
                if (!src) continue;
                busy.add(t.room.id);
                if (!g.standable(t.cell.c, t.cell.r)) forceStand(g, t.cell.c, t.cell.r);
                dig(g, src, t.cell, moves, t.room.rect, { protect: reach.reached, carved: true });
                fixed++;
            }
            if (fixed === 0) break;
        }
        // niente vicoli ciechi: da ovunque arrivi, devi poter ripartire verso l'uscita
        for (let iter = 0; iter < 60; iter++) {
            const reach = analyze(g, spawn, [exit], moves);
            // una cella bloccata per stanza a ogni giro
            const stuckByRoom = new Map<number, Cell>();
            for (let i = 0; i < reach.reached.length; i++) {
                if (!reach.reached[i] || reach.finishes[i]) continue;
                const cell = { c: i % cols, r: Math.floor(i / cols) };
                const room = roomOfCell(rooms, cell.c, cell.r);
                if (room && !stuckByRoom.has(room.id)) stuckByRoom.set(room.id, cell);
            }
            if (stuckByRoom.size === 0) break;
            let fixed = 0;
            for (const [rid, stuck] of stuckByRoom) {
                const room = rooms[rid];
                const dsts = nearestCells(reach.finishes, cols, inner(room.rect), stuck, 8);
                if (dsts.length === 0) continue;
                // la più vicina non sempre si lascia raggiungere: si provano anche le altre
                const ok = dsts.some((dst) => dig(g, stuck, dst, moves, room.rect, { protect: reach.finishes, carved: true, mustWork: true }));
                if (!ok) dig(g, stuck, dsts[0], moves, room.rect, { protect: reach.finishes, carved: true });
                fixed++;
            }
            if (fixed === 0) break;
        }
    }
}

/** fino a `count` celle della maschera vicine a `to`, distanti tra loro almeno 6 */
function nearestCells(mask: Uint8Array, cols: number, I: Rect, to: Cell, count: number): Cell[] {
    const all: { c: number; r: number; d: number }[] = [];
    for (let r = I.y; r < I.y + I.h; r++) {
        for (let c = I.x; c < I.x + I.w; c++) {
            if (mask[r * cols + c]) all.push({ c, r, d: Math.abs(c - to.c) + Math.abs(r - to.r) * 1.5 });
        }
    }
    all.sort((a, b) => a.d - b.d);
    const out: Cell[] = [];
    for (const x of all) {
        if (out.length >= count) break;
        if (out.every((o) => Math.abs(o.c - x.c) + Math.abs(o.r - x.r) >= 6)) out.push({ c: x.c, r: x.r });
    }
    return out;
}

function nearestReached(mask: Uint8Array, cols: number, I: Rect, to: Cell): Cell | null {
    let best: Cell | null = null;
    let bd = Infinity;
    for (let r = I.y; r < I.y + I.h; r++) {
        for (let c = I.x; c < I.x + I.w; c++) {
            if (!mask[r * cols + c]) continue;
            const d = Math.abs(c - to.c) + Math.abs(r - to.r) * 1.5;
            if (d < bd) {
                bd = d;
                best = { c, r };
            }
        }
    }
    return best;
}
