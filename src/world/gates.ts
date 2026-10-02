import type { EntitySpec } from '../types';
import type { SimAbilities } from './sim';
import { simVerify } from './simfix';
import type { RegionLayout, Room } from './types';

/* cancelli d'abilità: una nicchia con una ricompensa che si vede subito ma si
   raggiunge solo tornando con un'abilità che arriva più avanti. ogni cancello
   è un tentativo verificato due volte dal geco simulato: con le abilità del
   capitolo non ci si arriva e niente si rompe; con quelle future sì */

export interface GateResult {
    grid: string[];
    entities: Record<string, EntitySpec>;
    gates: { c: number; r: number; kind: 'camino' | 'mensola'; room: number }[];
}

const LETTERS = '0123456789!?&$@*+=<>:;|/{}()[]_-abcdefghijklmnopqrstuvwxyzABDEGHIJKLMNOQRSTUVWYZ';
const FREE = '.';

type Edit = { cells: [number, number, string][]; reward: { c: number; r: number } };

/** camino chiuso largo 3 accanto a un muro della stanza, nicchia in cima scavata nel muro */
function chimney(rows: string[][], c: number, r: number, side: -1 | 1): Edit | null {
    const H = 12;
    const top = r - H;
    const cells: [number, number, string][] = [];
    const at = (x: number, y: number) => rows[y]?.[x];
    // colonne del camino (dal muro verso l'interno) e del pilastro
    const ch = [0, 1, 2].map((k) => c + side * k);
    const pil = [3, 4].map((k) => c + side * k);
    const wall = [1, 2, 3].map((k) => c - side * k);
    for (const x of [...ch, ...pil, ...wall]) for (let y = top - 2; y <= r + 1; y++) if (at(x, y) === undefined) return null;
    // il muro della stanza dev'essere roccia piena accanto al camino
    for (let y = top; y <= r; y++) if (at(c - side, y) !== '#') return null;
    for (const x of ch) for (let y = top; y <= r; y++) cells.push([x, y, '.']);
    for (const x of ch) cells.push([x, r + 1, '#']);
    // pilastro dall'alto fino a lasciare un ingresso di 3 righe in fondo
    for (const x of pil) for (let y = top; y <= r - 3; y++) cells.push([x, y, '#']);
    for (const x of pil) for (let y = r - 2; y <= r; y++) cells.push([x, y, '.']);
    for (const x of pil) cells.push([x, r + 1, '#']);
    // coperchio sopra camino e pilastro
    for (const x of [...ch, ...pil]) cells.push([x, top - 1, '#']);
    // nicchia nel muro: due righe d'aria con il pavimento sotto
    for (const x of wall) {
        cells.push([x, top + 1, '.'], [x, top + 2, '.'], [x, top + 3, '#']);
    }
    return { cells, reward: { c: c - side * 2, r: top + 2 } };
}

/** mensola nel muro a 5 celle d'altezza: col salto singolo no, col doppio sì */
function ledge(rows: string[][], c: number, r: number, side: -1 | 1): Edit | null {
    const stand = r - 5;
    const cells: [number, number, string][] = [];
    const wall = [1, 2, 3].map((k) => c - side * k);
    for (const x of wall) for (let y = stand - 2; y <= stand + 1; y++) if (rows[y]?.[x] !== '#') return null;
    for (const x of wall) cells.push([x, stand - 1, '.'], [x, stand, '.'], [x, stand + 1, '#']);
    return { cells, reward: { c: c - side * 2, r: stand } };
}

function apply(rows: string[][], e: Edit): string[][] | null {
    const out = rows.map((r) => [...r]);
    for (const [x, y, ch] of e.cells) {
        const cur = out[y][x];
        // le lettere (trama, nemici, microfoni) non si toccano mai
        if (cur !== '#' && cur !== '.' && cur !== '^' && cur !== 'F' && cur !== '%' && cur !== '~') return null;
        out[y][x] = ch;
    }
    return out;
}

export function addGates(
    grid: string[],
    entities: Record<string, EntitySpec>,
    layout: RegionLayout,
    now: SimAbilities,
    later: SimAbilities,
    good: { c: number; r: number }[],
    want: number,
    log: (s: string) => void = () => {},
    /** ricompense già chiuse da un cancello precedente: ora irraggiungibili per scelta */
    already: { c: number; r: number }[] = [],
): GateResult {
    const needWall = !now.wall && !!later.wall;
    const kind: 'camino' | 'mensola' = needWall ? 'camino' : 'mensola';
    const rewards: EntitySpec[] = [{ type: 'cuore' }, { type: 'item', item: 'tacca' }];
    let rows = grid.map((r) => [...r]);
    let ents = { ...entities };
    const gates: GateResult['gates'] = [];
    const used = new Set(Object.keys(ents));
    const free = [...LETTERS].filter((ch) => !used.has(ch) && !'#.^~F%PCX'.includes(ch));
    const sideRooms = layout.rooms.filter((o) => o.pathIndex < 0 && o.kind !== 'arena');
    const candidates: { room: Room; c: number; r: number; side: -1 | 1 }[] = [];
    for (const room of sideRooms) {
        const R = room.rect;
        const here = good.filter((g) => g.c > R.x && g.c < R.x + R.w - 1 && g.r > R.y + 14 && g.r < R.y + R.h - 1);
        // vicino al muro sinistro o destro della stanza
        const left = here.filter((g) => g.c <= R.x + 3).sort((a, b) => b.r - a.r)[0];
        const right = here.filter((g) => g.c >= R.x + R.w - 4).sort((a, b) => b.r - a.r)[0];
        if (left) candidates.push({ room, c: left.c, r: left.r, side: 1 });
        if (right) candidates.push({ room, c: right.c, r: right.r, side: -1 });
    }
    for (const cand of candidates) {
        if (gates.length >= want || !free.length) break;
        if (gates.some((g) => g.room === cand.room.id)) continue;
        const edit = kind === 'camino' ? chimney(rows, cand.c, cand.r, cand.side) : ledge(rows, cand.c, cand.r, cand.side);
        if (!edit) continue;
        const next = apply(rows, edit);
        if (!next) continue;
        const ch = free[0];
        const spec = rewards[gates.length % rewards.length];
        next[edit.reward.r][edit.reward.c] = ch;
        const nextEnts = { ...ents, [ch]: spec };
        const g2 = next.map((r) => r.join(''));
        // ora: si gioca come prima e la ricompensa non si prende
        const v1 = simVerify(g2, nextEnts, now);
        const lockedNow = v1.missing.some((m) => m.c === edit.reward.c && m.r === edit.reward.r);
        const otherMissing = v1.missing.filter((m) => !(m.c === edit.reward.c && m.r === edit.reward.r) && !already.some((a) => a.c === m.c && a.r === m.r));
        if (!v1.exit || v1.stuck.length || otherMissing.length || !lockedNow) {
            log(`  cancello scartato in stanza ${cand.room.id}: ora ${JSON.stringify({ exit: v1.exit, stuck: v1.stuck.length, other: otherMissing.length, locked: lockedNow })}`);
            continue;
        }
        // dopo: con l'abilità nuova ci si arriva, e non si resta incastrati
        const v2 = simVerify(g2, nextEnts, later);
        const openLater = !v2.missing.some((m) => m.c === edit.reward.c && m.r === edit.reward.r);
        const brokeOld = v2.missing.some((m) => !(m.c === edit.reward.c && m.r === edit.reward.r) && !already.some((a) => a.c === m.c && a.r === m.r));
        if (!v2.exit || v2.stuck.length || !openLater || brokeOld) {
            log(`  cancello scartato in stanza ${cand.room.id}: dopo ${JSON.stringify({ exit: v2.exit, stuck: v2.stuck.length, open: openLater, brokeOld })}`);
            continue;
        }
        rows = next;
        ents = nextEnts;
        free.shift();
        gates.push({ c: edit.reward.c, r: edit.reward.r, kind, room: cand.room.id });
        log(`  cancello (${kind}) in stanza ${cand.room.id} a ${edit.reward.c},${edit.reward.r}`);
    }
    void FREE;
    return { grid: rows.map((r) => r.join('')), entities: ents, gates };
}
