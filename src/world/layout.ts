import { mulberry32 } from '../engine/art/ink';
import type { Door, DoorKind, Room, RoomKind } from './types';

/* la macro-griglia della regione: un percorso critico di stanze che
   avanza verso destra scendendo e salendo, rami laterali che finiscono
   in segreti, e qualche scorciatoia murata tra pezzi lontani del percorso */

export interface LayoutParams {
    seed: number;
    macroW: number;
    macroH: number;
    slotW: number;
    slotH: number;
    pathLength: number;
    /** indici del percorso che devono essere arene (boss) */
    arenaAt: Set<number>;
    /** indici del percorso con un microfono */
    restAt: Set<number>;
    branches: number;
    outdoor: boolean;
    water: boolean;
}

export interface MacroLayout {
    rooms: Room[];
    doors: Door[];
}

type Shape = [number, number];

const PATH_SHAPES: { s: Shape; w: number }[] = [
    { s: [1, 1], w: 30 },
    { s: [2, 1], w: 28 },
    { s: [3, 1], w: 10 },
    { s: [1, 2], w: 16 },
    { s: [2, 2], w: 10 },
    { s: [1, 3], w: 6 },
];
const ARENA_SHAPES: Shape[] = [[2, 1], [3, 1], [2, 2]];
const SIDE_SHAPES: { s: Shape; w: number }[] = [
    { s: [1, 1], w: 50 },
    { s: [2, 1], w: 20 },
    { s: [1, 2], w: 20 },
    { s: [2, 2], w: 10 },
];

function weighted<T>(rnd: () => number, list: { s: T; w: number }[]): T[] {
    // ordine casuale pesato: si prova prima ciò che pesa di più, con rumore
    return list
        .map((e) => ({ e, k: Math.pow(rnd(), 1 / e.w) }))
        .sort((a, b) => b.k - a.k)
        .map((x) => x.e.s);
}

class Occupancy {
    private cells: Int16Array;
    readonly w: number;
    readonly h: number;
    constructor(w: number, h: number) {
        this.w = w;
        this.h = h;
        this.cells = new Int16Array(w * h).fill(-1);
    }
    fits(sx: number, sy: number, sw: number, sh: number): boolean {
        if (sx < 0 || sy < 0 || sx + sw > this.w || sy + sh > this.h) return false;
        for (let y = sy; y < sy + sh; y++) {
            for (let x = sx; x < sx + sw; x++) if (this.cells[y * this.w + x] !== -1) return false;
        }
        return true;
    }
    mark(sx: number, sy: number, sw: number, sh: number, id: number): void {
        for (let y = sy; y < sy + sh; y++) {
            for (let x = sx; x < sx + sw; x++) this.cells[y * this.w + x] = id;
        }
    }
    at(sx: number, sy: number): number {
        if (sx < 0 || sy < 0 || sx >= this.w || sy >= this.h) return -1;
        return this.cells[sy * this.w + sx];
    }
}

interface Placement {
    sx: number;
    sy: number;
    sw: number;
    sh: number;
}

/** tutte le posizioni dove una forma tocca `prev` lungo un lato, nella direzione data */
function attachments(prev: Placement, shape: Shape, dir: 'r' | 'l' | 'u' | 'd'): Placement[] {
    const [sw, sh] = shape;
    const out: Placement[] = [];
    if (dir === 'r' || dir === 'l') {
        const sx = dir === 'r' ? prev.sx + prev.sw : prev.sx - sw;
        for (let sy = prev.sy - sh + 1; sy <= prev.sy + prev.sh - 1; sy++) out.push({ sx, sy, sw, sh });
    } else {
        const sy = dir === 'd' ? prev.sy + prev.sh : prev.sy - sh;
        for (let sx = prev.sx - sw + 1; sx <= prev.sx + prev.sw - 1; sx++) out.push({ sx, sy, sw, sh });
    }
    return out;
}

function shuffle<T>(rnd: () => number, arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

export function buildMacro(p: LayoutParams): MacroLayout {
    for (let attempt = 0; attempt < 400; attempt++) {
        const res = tryBuild(p, mulberry32(p.seed + attempt * 7919));
        if (res) return res;
    }
    throw new Error('layout: impossibile costruire la regione, parametri troppo stretti');
}

function tryBuild(p: LayoutParams, rnd: () => number): MacroLayout | null {
    const occ = new Occupancy(p.macroW, p.macroH);
    const rooms: Room[] = [];
    const doors: Door[] = [];

    const addRoom = (pl: Placement, kind: RoomKind, pathIndex: number, anchor: number): Room => {
        const id = rooms.length;
        occ.mark(pl.sx, pl.sy, pl.sw, pl.sh, id);
        const room: Room = {
            id, ...pl, kind, pathIndex, anchor,
            rect: { x: pl.sx * p.slotW, y: pl.sy * p.slotH, w: pl.sw * p.slotW, h: pl.sh * p.slotH },
            surface: p.outdoor && pl.sy === 0,
        };
        rooms.push(room);
        return room;
    };

    // la partenza sta a sinistra; all'aperto in superficie, al chiuso a mezza altezza
    const startRow = p.outdoor ? 0 : Math.floor(rnd() * Math.max(1, p.macroH - 1));
    const first = addRoom({ sx: 0, sy: startRow, sw: 1, sh: 1 }, 'start', 0, 0);
    let prev: Room = first;

    for (let i = 1; i < p.pathLength; i++) {
        const isArena = p.arenaAt.has(i);
        const isLast = i === p.pathLength - 1;
        const left = p.pathLength - i;
        const colsLeft = p.macroW - (prev.sx + prev.sw);
        // più è stretto lo spazio rimasto, più si tira dritto a destra
        const pressure = colsLeft / Math.max(1, left);
        const dirs = weighted(rnd, [
            { s: 'r' as const, w: pressure < 1.1 ? 80 : 40 },
            { s: 'd' as const, w: prev.sy + prev.sh < p.macroH ? (pressure < 1 ? 6 : 22) : 0.001 },
            { s: 'u' as const, w: prev.sy > 0 ? (pressure < 1 ? 5 : 18) : 0.001 },
            { s: 'l' as const, w: pressure > 1.8 ? 6 : 0.001 },
        ]);
        const shapes = isArena ? shuffle(rnd, [...ARENA_SHAPES]) : isLast ? [[1, 1] as Shape, [2, 1] as Shape] : weighted(rnd, PATH_SHAPES);
        let placed: Placement | null = null;
        let dirUsed: 'r' | 'l' | 'u' | 'd' = 'r';
        outer: for (const dir of dirs) {
            if (isArena && (dir === 'u' || dir === 'd') && rnd() < 0.6) continue;
            for (const shape of shapes) {
                for (const pl of shuffle(rnd, attachments(prev, shape, dir))) {
                    if (!occ.fits(pl.sx, pl.sy, pl.sw, pl.sh)) continue;
                    // non chiudersi in un angolo: deve restare una via verso destra
                    if (!isLast && pl.sx + pl.sw >= p.macroW && left > 2) continue;
                    placed = pl;
                    dirUsed = dir;
                    break outer;
                }
            }
        }
        if (!placed) return null;
        const kind: RoomKind = isLast ? 'exit' : isArena ? 'arena' : p.restAt.has(i) ? 'rest' : pathKind(rnd, placed, p.water);
        const room = addRoom(placed, kind, i, i);
        const door = makeDoor(prev, room, rnd, p, dirUsed === 'd' && !isArena && kind !== 'rest' && rnd() < 0.14 ? 'drop' : 'open');
        if (!door) return null;
        doors.push(door);
        prev = room;
    }
    // l'uscita deve stare verso il bordo destro, altrimenti la regione non "va" da nessuna parte
    if (prev.sx + prev.sw < p.macroW - 2) return null;

    // rami laterali: partono dal percorso e finiscono in un segreto
    const pathRooms = rooms.filter((r) => r.kind !== 'start' && r.kind !== 'exit' && r.kind !== 'arena');
    let made = 0;
    for (let tries = 0; tries < p.branches * 8 && made < p.branches; tries++) {
        const anchor = pathRooms[Math.floor(rnd() * pathRooms.length)];
        const length = 1 + Math.floor(rnd() * 3);
        let cur: Room = anchor;
        const chain: Room[] = [];
        for (let k = 0; k < length; k++) {
            const isEnd = k === length - 1;
            const shapes = isEnd ? [[1, 1] as Shape] : weighted(rnd, SIDE_SHAPES);
            let placed: Placement | null = null;
            for (const dir of shuffle(rnd, ['r', 'l', 'u', 'd'] as const)) {
                for (const shape of shapes) {
                    const opts = shuffle(rnd, attachments(cur, shape, dir)).filter((pl) => occ.fits(pl.sx, pl.sy, pl.sw, pl.sh));
                    if (opts.length) {
                        placed = opts[0];
                        break;
                    }
                }
                if (placed) break;
            }
            if (!placed) break;
            const kind: RoomKind = isEnd ? 'secret' : pathKind(rnd, placed, p.water);
            const room = addRoom(placed, kind, -1, anchor.id);
            // il primo varco del ramo a volte è nascosto: un muro finto o da spaccare
            let dk: DoorKind = 'open';
            if (k === 0) {
                const roll = rnd();
                dk = roll < 0.3 ? 'fake' : roll < 0.5 ? 'breakable' : 'open';
            }
            const door = makeDoor(cur, room, rnd, p, dk);
            if (!door) break;
            doors.push(door);
            chain.push(room);
            cur = room;
        }
        if (chain.length) made++;
    }

    // scorciatoie: stanze del percorso lontane tra loro ma confinanti
    const linked = new Set(doors.map((d) => `${Math.min(d.a, d.b)}-${Math.max(d.a, d.b)}`));
    for (const a of rooms) {
        if (a.pathIndex < 0) continue;
        for (const b of rooms) {
            if (b.pathIndex < 0 || b.pathIndex - a.pathIndex < 4) continue;
            if (linked.has(`${a.id}-${b.id}`) || !adjacent(a, b)) continue;
            if (rnd() > 0.45) continue;
            const door = makeDoor(a, b, rnd, p, 'breakable');
            if (door) {
                doors.push(door);
                linked.add(`${a.id}-${b.id}`);
            }
        }
    }
    return { rooms, doors };
}

function pathKind(rnd: () => number, pl: Placement, water: boolean): RoomKind {
    if (pl.sh > pl.sw) return 'shaft';
    if (pl.sw >= 2 && pl.sh >= 2) return 'cave';
    const roll = rnd();
    if (water && roll < 0.18) return 'pool';
    if (roll < 0.36) return 'gauntlet';
    if (roll < 0.62) return 'cave';
    return 'hall';
}

function adjacent(a: Room, b: Room): boolean {
    const hTouch = (a.sx + a.sw === b.sx || b.sx + b.sw === a.sx) && a.sy < b.sy + b.sh && b.sy < a.sy + a.sh;
    const vTouch = (a.sy + a.sh === b.sy || b.sy + b.sh === a.sy) && a.sx < b.sx + b.sw && b.sx < a.sx + a.sw;
    return hTouch || vTouch;
}

/** il varco sul lato condiviso: nel muro per le affiancate, nel pavimento per le impilate */
function makeDoor(a: Room, b: Room, rnd: () => number, p: LayoutParams, kind: DoorKind): Door | null {
    if (a.sx + a.sw === b.sx || b.sx + b.sw === a.sx) {
        const left = a.sx < b.sx ? a : b;
        const right = left === a ? b : a;
        const sy0 = Math.max(left.sy, right.sy);
        const sy1 = Math.min(left.sy + left.sh, right.sy + right.sh);
        if (sy1 <= sy0) return null;
        const slotRow = sy0 + Math.floor(rnd() * (sy1 - sy0));
        // la soglia sta nella metà bassa dello slot: le porte stanno vicino ai pavimenti
        const threshold = slotRow * p.slotH + p.slotH - 2 - Math.floor(rnd() * (p.slotH * 0.35));
        return { a: a.id, b: b.id, axis: 'h', x: right.rect.x, y: threshold, len: 4, kind: kind === 'drop' ? 'open' : kind };
    }
    const top = a.sy < b.sy ? a : b;
    const bottom = top === a ? b : a;
    const sx0 = Math.max(top.sx, bottom.sx);
    const sx1 = Math.min(top.sx + top.sw, bottom.sx + bottom.sw);
    if (sx1 <= sx0) return null;
    const slotCol = sx0 + Math.floor(rnd() * (sx1 - sx0));
    const x = slotCol * p.slotW + 6 + Math.floor(rnd() * (p.slotW - 16));
    // i muri finti nel pavimento sarebbero trappole invisibili: si aprono e basta
    const vk: DoorKind = kind === 'fake' ? 'open' : kind;
    return { a: a.id, b: b.id, axis: 'v', x, y: bottom.rect.y, len: 4, kind: vk };
}
