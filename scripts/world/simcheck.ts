import { readFileSync } from 'node:fs';
import { LEVELS, LEVEL_ORDER } from '../../src/content/levels';
import { decodeGrid, type RegionFile } from '../../src/world/codec';
import { BODY_H, BODY_W, SimMap, type SimAbilities } from '../../src/world/sim';
import { canFinish, keyOf, settleAt, simReach } from '../../src/world/simreach';

// uso: simcheck <id|all> [old]  -> raggiungibilità col geco simulato
export function abilitiesFor(id: string): SimAbilities {
    const idx = LEVEL_ORDER.indexOf(id);
    if (idx === 0) return { dash: false, double: false };
    if (idx === 1) return { dash: true, double: false };
    return { dash: true, double: true };
}

function check(id: string, useOld: boolean): void {
    const def = LEVELS[id];
    const grid = useOld ? def.grid : decodeGrid(JSON.parse(readFileSync(`public/regions/${id}.json`, 'utf8')) as RegionFile);
    const ents = useOld ? def.entities : (JSON.parse(readFileSync(`public/regions/${id}.json`, 'utf8')) as RegionFile).entities;
    const m = new SimMap(grid, { breakablesOpen: process.env.CLOSED !== '1' });
    const ab = abilitiesFor(id);
    let P = { c: 0, r: 0 };
    const targets: { c: number; r: number; ch: string; what: string }[] = [];
    grid.forEach((row, r) => [...row].forEach((ch, c) => {
        if (ch === 'P') P = { c, r };
        else if (ch === 'X' || ch === 'C') targets.push({ c, r, ch, what: ch === 'X' ? 'exit' : 'mic' });
        else if (!'#.^~F%'.includes(ch)) {
            const e = ents[ch];
            const what = !e ? '?' : e.type === 'enemy' ? '' : e.type === 'npc' ? `npc:${e.id}` : e.type === 'boss' ? `boss:${e.kind}` : e.type === 'lore' ? `lore:${e.id}` : e.type === 'ability' ? `ability:${e.ability}` : e.type === 'portal' ? `portal:${e.to}` : e.type === 'item' ? `item:${e.item}` : e.type;
            if (what) targets.push({ c, r, ch, what });
        }
    }));
    const t0 = performance.now();
    const start = settleAt(m, P.c, P.r, ab);
    if (!start) { console.log(id, 'spawn non valido'); return; }
    const reach = simReach(m, start, ab);
    const ms = Math.round(performance.now() - t0);
    const pts = [...reach.reached.values()].map((b) => ({ x: b.x + BODY_W / 2, y: b.y + BODY_H / 2 }));
    const near = (c: number, r: number, R: number, Ry = R) => {
        const x = c * 32 + 16, y = r * 32 + 16;
        return pts.some((p) => Math.abs(p.x - x) < R && Math.abs(p.y - y) < Ry);
    };
    const exitKeys: number[] = [];
    for (const [k, b] of reach.reached) {
        const x = b.x + BODY_W / 2, y = b.y + BODY_H / 2;
        if (targets.some((t) => t.what === 'exit' && Math.abs(t.c * 32 + 16 - x) < 40 && Math.abs(t.r * 32 + 16 - y) < 48)) exitKeys.push(k);
    }
    const fin = canFinish(reach, exitKeys);
    const stuck = reach.reached.size - fin.size;
    const missing = targets.filter((t) => t.what.startsWith('boss') ? !near(t.c, t.r, 420, 360) : !near(t.c, t.r, 60, 64));
    console.log(`${id.padEnd(13)} ${ms}ms stati=${reach.reached.size} uscita=${exitKeys.length > 0} bloccati=${stuck} mancanti=${missing.length}`);
    for (const t of missing.slice(0, 40)) console.log(`   manca ${t.what} @${t.c},${t.r}`);
    void keyOf;
}

const [which, old] = process.argv.slice(2);
const ids = which === 'all' ? Object.keys(LEVELS) : which.split(',');
for (const id of ids) check(id, old === 'old');
