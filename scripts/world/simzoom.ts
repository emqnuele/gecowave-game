import { readFileSync } from 'node:fs';
import { LEVELS } from '../../src/content/levels';
import { decodeGrid, type RegionFile } from '../../src/world/codec';
import { BODY_H, BODY_W, SimMap } from '../../src/world/sim';
import { settleAt, simReach } from '../../src/world/simreach';
import { abilitiesFor } from './abilities';

// uso: simzoom <id> <old|new> x0 x1 y0 y1 : griglia con 'o' dove il geco simulato sta in piedi
const [id, src, ...w] = process.argv.slice(2);
const def = LEVELS[id];
const grid = src === 'old' ? def.grid : decodeGrid(JSON.parse(readFileSync(`public/regions/${id}.json`, 'utf8')) as RegionFile);
const m = new SimMap(grid, { breakablesOpen: true });
const ab = abilitiesFor(id);
let P = { c: 0, r: 0 };
grid.forEach((row, r) => { const c = row.indexOf('P'); if (c >= 0) P = { c, r }; });
const reach = simReach(m, settleAt(m, P.c, P.r, ab)!, ab);
const on = new Set<string>();
let maxC = 0;
for (const b of reach.reached.values()) {
    const c = Math.floor((b.x + BODY_W / 2) / 32), r = Math.round((b.y + BODY_H) / 32) - 1;
    on.add(`${c},${r}`);
    maxC = Math.max(maxC, c);
}
const [x0, x1, y0, y1] = w.length ? w.map(Number) : [Math.max(0, maxC - 40), maxC + 40, 0, grid.length];
console.log('max col', maxC);
for (let r = y0; r < y1; r++) {
    let s = '';
    for (let c = x0; c < x1; c++) s += on.has(`${c},${r}`) ? 'o' : (grid[r][c] ?? ' ');
    console.log(String(r).padStart(3), s);
}
