import { readFileSync } from 'node:fs';
import { decodeGrid, type RegionFile } from '../../src/world/codec';
import { BODY_H, BODY_W, SimMap } from '../../src/world/sim';
import { settleAt, simReach } from '../../src/world/simreach';
import { abilitiesFor } from './abilities';

// uso: simfrom <id> c r x0 x1 y0 y1 : raggiungibilità partendo da una cella, stampata in una finestra
const [id, c, r, ...w] = process.argv.slice(2);
const f = JSON.parse(readFileSync(`public/regions/${id}.json`, 'utf8')) as RegionFile;
const grid = decodeGrid(f);
const m = new SimMap(grid, { breakablesOpen: true });
const ab = abilitiesFor(id);
const [x0, x1, y0, y1] = w.map(Number);
const start = settleAt(m, Number(c), Number(r), ab)!;
const reach = simReach(m, start, ab, { x0: x0 * 32 - 200, x1: x1 * 32 + 200, y0: y0 * 32 - 200, y1: y1 * 32 + 200 });
const on = new Set<string>();
for (const b of reach.reached.values()) on.add(`${Math.floor((b.x + BODY_W / 2) / 32)},${Math.round((b.y + BODY_H) / 32) - 1}`);
console.log('stati', reach.reached.size, JSON.stringify(ab));
for (let y = y0; y < y1; y++) {
    let s = '';
    for (let x = x0; x < x1; x++) s += on.has(`${x},${y}`) ? 'o' : grid[y][x];
    console.log(String(y).padStart(3), s);
}
