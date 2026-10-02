import type { EntitySpec } from '../types';
import { AIR, Grid } from './grid';
import { BASIC } from './moves';
import { dig } from './region';
import { inner } from './rooms';
import { BODY_H, BODY_W, SimMap, type SimAbilities } from './sim';
import { canFinish, settleAt, simReach } from './simreach';
import type { RegionLayout, Room } from './types';

/* l'ultima parola sulla regione la dà il geco simulato con la fisica vera:
   uscita raggiungibile, ogni cosa di trama a portata, nessuna conca da cui
   non si esce. le trappole si riparano con scalinate prudenti e si ricontrolla */

export interface SimVerdict {
    exit: boolean;
    stuck: { c: number; r: number }[];
    /** entità (non nemici) senza una posizione in piedi abbastanza vicina */
    missing: { c: number; r: number; what: string }[];
    states: number;
    /** posizioni in piedi da cui l'uscita resta raggiungibile */
    good: { c: number; r: number }[];
}

const ENTITY_FREE = '#.^~F%';

export function simVerify(grid: string[], entities: Record<string, EntitySpec>, ab: SimAbilities, layout?: RegionLayout): SimVerdict {
    const m = new SimMap(grid, { breakablesOpen: true });
    let P = { c: 0, r: 0 };
    const exits: { c: number; r: number }[] = [];
    const targets: { c: number; r: number; what: string; boss: boolean }[] = [];
    grid.forEach((row, r) => {
        for (let c = 0; c < row.length; c++) {
            const ch = row[c];
            if (ch === 'P') P = { c, r };
            else if (ch === 'X') exits.push({ c, r });
            else if (ch === 'C') targets.push({ c, r, what: 'microfono', boss: false });
            else if (!ENTITY_FREE.includes(ch)) {
                const e = entities[ch];
                if (!e || e.type === 'enemy') continue;
                const what = e.type === 'npc' ? `npc:${e.id}` : e.type === 'boss' ? `boss:${e.kind}` : e.type === 'lore' ? `lore:${e.id}` : e.type;
                targets.push({ c, r, what, boss: e.type === 'boss' });
            }
        }
    });
    const start = settleAt(m, P.c, P.r, ab);
    if (!start) return { exit: false, stuck: [], missing: [], states: 0, good: [] };
    const reach = simReach(m, start, ab);
    const pts: { k: number; x: number; y: number }[] = [];
    for (const [k, b] of reach.reached) pts.push({ k, x: b.x + BODY_W / 2, y: b.y + BODY_H / 2 });
    const exitKeys = pts.filter((p) => exits.some((e) => Math.abs(e.c * 32 + 16 - p.x) < 40 && Math.abs(e.r * 32 + 16 - p.y) < 48)).map((p) => p.k);
    const fin = canFinish(reach, exitKeys);
    const stuck: { c: number; r: number }[] = [];
    const good: { c: number; r: number }[] = [];
    for (const [k, b] of reach.reached) {
        const cell = { c: Math.floor((b.x + BODY_W / 2) / 32), r: Math.round((b.y + BODY_H) / 32) - 1 };
        if (!fin.has(k)) stuck.push(cell);
        else good.push(cell);
    }
    // un boss o un'arena valgono solo se si entra nella loro stanza: la vicinanza attraverso la roccia non conta
    const sameRoom = (t: { c: number; r: number }, p: { x: number; y: number }) => {
        if (!layout) return true;
        return roomOf(layout, t.c, t.r) === roomOf(layout, Math.floor(p.x / 32), Math.floor(p.y / 32));
    };
    const missing = targets.filter((t) => {
        const x = t.c * 32 + 16;
        const y = t.r * 32 + 16;
        const arena = t.boss || /^npc:(arena-|warena-|smela-arena|lametta-arena)/.test(t.what);
        const [rx, ry] = arena ? [700, 500] : [60, 64];
        return !pts.some((p) => Math.abs(p.x - x) < rx && Math.abs(p.y - y) < ry && (!arena || sameRoom(t, p)));
    }).map(({ c, r, what }) => ({ c, r, what }));
    return { exit: exitKeys.length > 0, stuck, missing, states: reach.reached.size, good };
}

function roomOf(layout: RegionLayout, c: number, r: number): Room | null {
    return layout.rooms.find((o) => c >= o.rect.x && c < o.rect.x + o.rect.w && r >= o.rect.y && r < o.rect.y + o.rect.h) ?? null;
}

/** ripara le conche: da una posizione intrappolata scava una scalinata a passi di base
    verso la posizione buona più vicina della stessa stanza. le lettere restano dove sono */
export function simRepair(grid: string[], entities: Record<string, EntitySpec>, layout: RegionLayout, ab: SimAbilities, maxRounds = 6): { grid: string[]; verdict: SimVerdict; rounds: number } {
    let verdict = simVerify(grid, entities, ab, layout);
    let rounds = 0;
    while (verdict.stuck.length && rounds < maxRounds) {
        rounds++;
        const g = new Grid(grid[0].length, grid.length);
        const letters: { c: number; r: number; ch: string }[] = [];
        grid.forEach((row, r) => {
            for (let c = 0; c < row.length; c++) {
                const ch = row[c];
                if ('#^~F%.'.includes(ch)) g.force(c, r, ch);
                else {
                    letters.push({ c, r, ch });
                    g.force(c, r, AIR);
                }
            }
        });
        // le posizioni buone, per stanza, ricalcolate sulla griglia di prima del giro
        const ok = finishCells(grid, entities, ab);
        const done = new Set<number>();
        for (const s of verdict.stuck) {
            const room = roomOf(layout, s.c, s.r);
            if (!room || done.has(room.id)) continue;
            done.add(room.id);
            const I = inner(room.rect);
            const cands = ok.filter((o) => o.c >= I.x && o.c < I.x + I.w && o.r >= I.y && o.r < I.y + I.h)
                .sort((a, b) => Math.abs(a.c - s.c) + Math.abs(a.r - s.r) * 1.5 - (Math.abs(b.c - s.c) + Math.abs(b.r - s.r) * 1.5));
            let fixed = false;
            if (g.standable(s.c, s.r)) {
                for (const dst of cands.slice(0, 8)) {
                    if (!g.standable(dst.c, dst.r)) continue;
                    if (dig(g, s, dst, BASIC, room.rect, { carved: true, mustWork: true })) {
                        fixed = true;
                        break;
                    }
                }
            }
            // una tasca piccola non si scala: si riempie, e chi ci cadeva ora ci cammina sopra
            const group = verdict.stuck.filter((o) => roomOf(layout, o.c, o.r) === room);
            if (!fixed && group.length <= 16) {
                for (const o of group) {
                    for (const y of [o.r, o.r - 1]) if (g.get(o.c, y) === AIR) g.force(o.c, y, '#');
                }
            }
        }
        // le lettere tornano al loro posto; se la roccia le ha coperte salgono finché trovano aria
        for (const l of letters) {
            let r = l.r;
            while (r > 0 && g.solid(l.c, r)) r--;
            g.force(l.c, r, l.ch);
        }
        grid = g.toStrings();
        const next = simVerify(grid, entities, ab, layout);
        if (next.stuck.length >= verdict.stuck.length && !next.exit === !verdict.exit) {
            verdict = next;
            break;
        }
        verdict = next;
    }
    if (verdict.missing.length) {
        const fixedGrid = relocateLoot(grid, entities, verdict, ab);
        if (fixedGrid) {
            grid = fixedGrid;
            verdict = simVerify(grid, entities, ab, layout);
        }
    }
    return { grid, verdict, rounds };
}

/** le ricompense finite dove non si arriva tornano a portata; la trama no, quella va rifatta */
function relocateLoot(grid: string[], entities: Record<string, EntitySpec>, verdict: SimVerdict, ab: SimAbilities): string[] | null {
    const movable = new Set(['barre', 'item', 'cuore', 'maschera', 'lore']);
    const ok = finishCells(grid, entities, ab);
    const rows = grid.map((r) => r.split(''));
    let moved = false;
    for (const m of verdict.missing) {
        const ch = rows[m.r][m.c];
        const spec = entities[ch];
        if (!spec || !movable.has(spec.type)) continue;
        let best: { c: number; r: number } | null = null;
        let bd = Infinity;
        for (const o of ok) {
            if (rows[o.r][o.c] !== '.') continue;
            const d = Math.abs(o.c - m.c) + Math.abs(o.r - m.r) * 1.5;
            if (d < bd) {
                bd = d;
                best = o;
            }
        }
        if (!best) continue;
        rows[m.r][m.c] = '.';
        rows[best.r][best.c] = ch;
        moved = true;
    }
    return moved ? rows.map((r) => r.join('')) : null;
}

/** celle in piedi da cui l'uscita si raggiunge ancora */
function finishCells(grid: string[], entities: Record<string, EntitySpec>, ab: SimAbilities): { c: number; r: number }[] {
    const m = new SimMap(grid, { breakablesOpen: true });
    let P = { c: 0, r: 0 };
    const exits: { c: number; r: number }[] = [];
    grid.forEach((row, r) => {
        const c = row.indexOf('P');
        if (c >= 0) P = { c, r };
        for (let x = 0; x < row.length; x++) if (row[x] === 'X') exits.push({ c: x, r });
    });
    void entities;
    const reach = simReach(m, settleAt(m, P.c, P.r, ab)!, ab);
    const exitKeys: number[] = [];
    for (const [k, b] of reach.reached) {
        const x = b.x + BODY_W / 2;
        const y = b.y + BODY_H / 2;
        if (exits.some((e) => Math.abs(e.c * 32 + 16 - x) < 40 && Math.abs(e.r * 32 + 16 - y) < 48)) exitKeys.push(k);
    }
    const fin = canFinish(reach, exitKeys);
    const out: { c: number; r: number }[] = [];
    for (const [k, b] of reach.reached) if (fin.has(k)) out.push({ c: Math.floor((b.x + BODY_W / 2) / 32), r: Math.round((b.y + BODY_H) / 32) - 1 });
    return out;
}
