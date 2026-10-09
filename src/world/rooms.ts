import { mulberry32 } from '../rules/hash';
import { AIR, Grid, SOLID, WATER } from './grid';
import type { Door, Moves, Rect, Room } from './types';

/* lo scavo di ogni stanza dentro il suo rettangolo: si lascia un bordo
   di roccia di una cella, le porte poi lo bucano */

export function inner(r: Rect): Rect {
    return { x: r.x + 1, y: r.y + 1, w: r.w - 2, h: r.h - 2 };
}

const clampInt = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(v)));

/** profilo di pavimento a gradini: segmenti piatti, salti di quota percorribili */
function floorProfile(rnd: () => number, width: number, bottom: number, minFloor: number, maxStep: number): number[] {
    const out: number[] = [];
    let level = bottom - Math.floor(rnd() * 3);
    while (out.length < width) {
        const len = 3 + Math.floor(rnd() * 7);
        for (let i = 0; i < len && out.length < width; i++) out.push(level);
        level = clampInt(level + (Math.floor(rnd() * (maxStep * 2 + 1)) - maxStep), minFloor, bottom);
    }
    return out;
}

function carveColumns(g: Grid, x0: number, ceil: number[], floor: number[]): void {
    for (let i = 0; i < floor.length; i++) {
        for (let y = ceil[i]; y < floor[i]; y++) g.set(x0 + i, y, AIR);
    }
}

function floatingPlatforms(g: Grid, rnd: () => number, I: Rect, count: number, ceil: number[], floor: number[]): void {
    for (let k = 0; k < count; k++) {
        const w = 3 + Math.floor(rnd() * 5);
        const i = Math.floor(rnd() * Math.max(1, floor.length - w));
        const top = Math.max(...ceil.slice(i, i + w)) + 3;
        const bottom = Math.min(...floor.slice(i, i + w)) - 4;
        if (bottom <= top) continue;
        const y = top + Math.floor(rnd() * (bottom - top));
        g.platform(I.x + i, y, w);
    }
}

function hall(g: Grid, room: Room, rnd: () => number, opts: { pits: number; platforms: number; flat?: boolean; water?: boolean }): void {
    const I = inner(room.rect);
    const bottom = I.y + I.h;
    const minFloor = Math.max(I.y + 8, bottom - Math.floor(I.h * 0.45));
    const floor = opts.flat
        ? new Array(I.w).fill(bottom - 1)
        : floorProfile(rnd, I.w, bottom, minFloor, 2);
    const top = room.surface ? 0 : I.y;
    const ceil = floor.map((f, i) => {
        if (room.surface) return 0;
        // soffitto che respira, con qualche massa che scende
        const wave = Math.sin((i / I.w) * Math.PI * (2 + rnd() * 0.2)) * 2;
        return clampInt(top + 1 + wave + rnd() * 2, top, f - 7);
    });
    carveColumns(g, I.x, ceil, floor);

    // pozzi di spine: stretti abbastanza da saltarli
    for (let p = 0; p < opts.pits; p++) {
        const w = 2 + Math.floor(rnd() * 2);
        const i = 4 + Math.floor(rnd() * Math.max(1, I.w - w - 8));
        const lip = Math.min(...floor.slice(i - 1, i + w + 1));
        if (bottom - lip < 2) continue;
        for (let x = i; x < i + w; x++) {
            for (let y = floor[x]; y < bottom; y++) g.set(I.x + x, y, AIR);
            floor[x] = bottom;
        }
        if (opts.water) {
            for (let x = i; x < i + w; x++) for (let y = lip; y < bottom; y++) g.set(I.x + x, y, WATER);
        } else {
            g.spikes(I.x + i, bottom - 1, w);
        }
    }
    floatingPlatforms(g, rnd, I, opts.platforms, ceil, floor);
}

function shaft(g: Grid, room: Room, rnd: () => number, m: Moves): void {
    const I = inner(room.rect);
    // pareti frastagliate, poi una scala di sporgenze a zig-zag
    for (let y = I.y; y < I.y + I.h; y++) {
        const wl = Math.floor(rnd() * 2.2);
        const wr = Math.floor(rnd() * 2.2);
        for (let x = I.x + wl; x < I.x + I.w - wr; x++) g.set(x, y, AIR);
    }
    // sporgenze alternate: sopra ognuna restano 5 righe libere per saltare,
    // e il varco tra un lato e l'altro resta entro la corsa del salto di adesso
    let side = rnd() < 0.5 ? 0 : 1;
    const bottom = I.y + I.h;
    const gap = Math.max(3, Math.min(m.run - 1, 4 + Math.floor(rnd() * 3)));
    const wl = Math.floor((I.w - gap) / 2);
    const wr = I.w - gap - wl;
    for (let y = bottom - 3; y > I.y + 4; y -= 3) {
        if (side === 0) g.platform(I.x, y, wl);
        else g.platform(I.x + I.w - wr, y, wr);
        side = 1 - side;
    }
}

function cave(g: Grid, room: Room, rnd: () => number): void {
    const I = inner(room.rect);
    const blobs = 3 + Math.floor((room.rect.w * room.rect.h) / 900) + Math.floor(rnd() * 3);
    const centers: { x: number; y: number }[] = [];
    for (let i = 0; i < blobs; i++) {
        const rx = 6 + rnd() * 10;
        const ry = 4 + rnd() * 6;
        const cx = I.x + rx + rnd() * Math.max(1, I.w - rx * 2);
        const cy = I.y + ry + rnd() * Math.max(1, I.h - ry * 2);
        g.carveBlob(cx, cy, rx, ry, rnd, I);
        centers.push({ x: cx, y: cy });
    }
    // gallerie spesse tra un blob e l'altro: la caverna è una sola
    centers.sort((a, b) => a.x - b.x);
    for (let i = 1; i < centers.length; i++) {
        const a = centers[i - 1];
        const b = centers[i];
        const steps = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y));
        for (let s = 0; s <= steps; s++) {
            const t = s / Math.max(1, steps);
            g.carveBlob(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, 3, 2.6, rnd, I);
        }
    }
    if (room.surface) {
        for (let x = I.x; x < I.x + I.w; x++) {
            let y = 0;
            while (y < I.y + I.h && g.get(x, y) === SOLID && y < I.y + 6) g.set(x, y++, AIR);
        }
    }
}

function arena(g: Grid, room: Room, rnd: () => number): void {
    const I = inner(room.rect);
    const height = Math.min(I.h, 16);
    const top = room.surface ? 0 : I.y + I.h - height;
    g.carve({ x: I.x, y: top, w: I.w, h: I.y + I.h - top });
    // due mensole laterali per respirare durante gli attacchi
    const ledgeY = I.y + I.h - 6;
    g.platform(I.x, ledgeY, 4 + Math.floor(rnd() * 2));
    g.platform(I.x + I.w - 5, ledgeY, 5);
}

function secret(g: Grid, room: Room, rnd: () => number): void {
    const I = inner(room.rect);
    const w = 14 + Math.floor(rnd() * 8);
    const h = 7 + Math.floor(rnd() * 3);
    const x = I.x + Math.floor((I.w - w) / 2);
    const y = I.y + I.h - h - 2 - Math.floor(rnd() * 4);
    g.carve({ x, y, w, h });
    g.carveBlob(x + w / 2, y + h / 2, w / 2 + 2, h / 2 + 1, rnd, I);
    for (let cx = x - 2; cx < x + w + 2; cx++) g.set(cx, y + h, SOLID);
}

export function carveRoom(g: Grid, room: Room, seed: number, m: Moves): void {
    const rnd = mulberry32(seed + room.id * 131);
    switch (room.kind) {
        case 'start':
        case 'exit':
        case 'rest':
            hall(g, room, rnd, { pits: 0, platforms: room.kind === 'rest' ? 1 : 2, flat: room.kind !== 'start' });
            break;
        case 'hall':
            hall(g, room, rnd, { pits: rnd() < 0.5 ? 1 : 0, platforms: 2 + Math.floor(rnd() * 3) });
            break;
        case 'gauntlet':
            hall(g, room, rnd, { pits: 2 + Math.floor((room.rect.w / 46) * 2), platforms: 3 + Math.floor(rnd() * 3) });
            break;
        case 'pool':
            hall(g, room, rnd, { pits: 2, platforms: 2, water: true });
            break;
        case 'shaft':
            shaft(g, room, rnd, m);
            break;
        case 'cave':
            cave(g, room, rnd);
            break;
        case 'arena':
            arena(g, room, rnd);
            break;
        case 'secret':
            secret(g, room, rnd);
            break;
    }
}

export interface DoorPlan {
    /** celle in piedi da cui si attraversa il varco, una per lato */
    sides: { room: number; c: number; r: number }[];
    air: [number, number][];
    solid: [number, number][];
    /** muri finti o da spaccare dentro l'apertura */
    special: [number, number, string][];
}

/** progetta il varco tra due stanze: aria, pavimenti dei pianerottoli, muri speciali.
    non tocca la griglia: si applicano tutti i varchi insieme, così uno non tappa l'altro */
export function planDoor(g: Grid, d: Door, rooms: Room[]): DoorPlan {
    const A = rooms[d.a];
    const B = rooms[d.b];
    const air: [number, number][] = [];
    const solid: [number, number][] = [];
    const special: [number, number, string][] = [];
    if (d.axis === 'h') {
        const left = A.rect.x < B.rect.x ? A : B;
        const right = left === A ? B : A;
        const bx = right.rect.x;
        const t = d.y;
        // pianerottolo di 5 celle per lato, soglia piena e spessa, varco alto 4
        for (let x = bx - 5; x <= bx + 4; x++) {
            for (let y = t - 4; y < t; y++) air.push([x, y]);
            solid.push([x, t], [x, t + 1]);
        }
        if (d.kind === 'fake' || d.kind === 'breakable') {
            const ch = d.kind === 'fake' ? 'F' : '%';
            for (let y = t - 4; y < t; y++) special.push([bx - 1, y, ch], [bx, y, ch]);
        }
        if (left.surface && right.surface) {
            // tra due stanze all'aperto il muro sparisce: è un paesaggio unico
            for (let x = bx - 1; x <= bx; x++) for (let y = 0; y < t - 4; y++) air.push([x, y]);
        }
        return { sides: [{ room: left.id, c: bx - 3, r: t - 1 }, { room: right.id, c: bx + 2, r: t - 1 }], air, solid, special };
    }
    const top = A.rect.y < B.rect.y ? A : B;
    const bottom = top === A ? B : A;
    const by = bottom.rect.y;
    const x0 = d.x;
    // buco nel pavimento della stanza sopra, prolungato in su finché non trova aria
    for (let x = x0; x < x0 + d.len; x++) {
        if (d.kind === 'breakable') special.push([x, by - 1, '%']);
        else air.push([x, by - 1]);
        air.push([x, by]);
        for (let y = by - 2; y > by - 14 && g.get(x, y) !== AIR; y--) air.push([x, y]);
        for (let y = by - 2; y > by - 6; y--) air.push([x, y]);
    }
    // pianerottoli ai lati del buco, nella stanza sopra
    for (const side of [-1, 1]) {
        for (let k = 1; k <= 4; k++) {
            const x = side < 0 ? x0 - k : x0 + d.len - 1 + k;
            solid.push([x, by - 1]);
            for (let y = by - 5; y < by - 1; y++) air.push([x, y]);
        }
    }
    const sides = [{ room: top.id, c: x0 - 2, r: by - 2 }, { room: top.id, c: x0 + d.len + 1, r: by - 2 }];
    if (d.kind !== 'drop') {
        // mensola appena sotto il buco: da lì si risale con un salto, e ci si cala ai lati.
        // anche il bordo di sopra si apre ai lati: serve spazio per la testa scendendo
        // solo lo stretto necessario resta aria: sotto la mensola le scale possono appoggiarsi
        for (let x = x0 - 2; x <= x0 + d.len + 1; x++) {
            air.push([x, by], [x, by + 1]);
            const side = x < x0 || x >= x0 + d.len;
            if (side) for (let y = by + 2; y <= by + 4; y++) air.push([x, y]);
        }
        for (let x = x0; x < x0 + d.len; x++) solid.push([x, by + 2]);
        sides.push({ room: bottom.id, c: x0 + 1, r: by + 1 });
    } else {
        for (let x = x0; x < x0 + d.len; x++) for (let y = by + 1; y < by + 5; y++) air.push([x, y]);
    }
    return { sides, air, solid, special };
}

/** applica tutti i varchi: prima l'aria, poi i pavimenti che non stanno nell'aria di nessuno */
export function applyDoors(g: Grid, plans: DoorPlan[]): void {
    const airSet = new Set<number>();
    for (const p of plans) {
        for (const [x, y] of p.air) {
            g.force(x, y, AIR);
            airSet.add(y * g.cols + x);
        }
    }
    for (const p of plans) {
        for (const [x, y] of p.solid) if (!airSet.has(y * g.cols + x)) g.force(x, y, SOLID);
    }
    for (const p of plans) for (const [x, y, ch] of p.special) g.force(x, y, ch);
    // i varchi fanno parte dello scheletro: lo scavo delle stanze non li tocca
    for (const p of plans) {
        for (const [x, y] of p.air) g.lock(x, y);
        for (const [x, y] of p.solid) g.lock(x, y);
    }
}
