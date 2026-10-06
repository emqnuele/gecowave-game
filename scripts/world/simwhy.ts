import { readFileSync } from 'node:fs';
import { decodeGrid, type RegionFile } from '../../src/world/codec';
import { BODY_H, BODY_W, SimMap } from '../../src/world/sim';
import { keyOf, settleAt, simReach } from '../../src/world/simreach';
import { abilitiesFor } from './abilities';

// uso: simwhy <id> c r tc tr : la posizione (c,r) è raggiunta globalmente? e da lì si arriva a (tc,tr)?
const [id, c, r, tc, tr] = process.argv.slice(2).map((v, i) => (i ? Number(v) : v)) as [string, number, number, number, number];
const f = JSON.parse(readFileSync(`public/regions/${id}.json`, 'utf8')) as RegionFile;
const grid = decodeGrid(f);
const m = new SimMap(grid, { breakablesOpen: true });
const ab = process.env.NOWALL ? { ...abilitiesFor(id), wall: false } : abilitiesFor(id);
let P = { c: 0, r: 0 };
grid.forEach((row, y) => { const x = row.indexOf('P'); if (x >= 0) P = { c: x, r: y }; });
const glob = simReach(m, settleAt(m, P.c, P.r, ab)!, ab);
const key = (r + 1) * m.cols + c;
const b = glob.reached.get(key);
console.log('globale: stati', glob.reached.size, 'cella', c, r, b ? `raggiunta x=${b.x.toFixed(2)} (centro ${(c * 32 + 16 - BODY_W / 2).toFixed(2)})` : 'NON raggiunta');
const tkey = (tr + 1) * m.cols + tc;
console.log('bersaglio raggiunto globalmente:', glob.reached.has(tkey));
// chi arriva vicino
const near = [...glob.reached.entries()].filter(([, s]) => Math.abs((s.x + BODY_W / 2) / 32 - c) < 8 && Math.abs((s.y + BODY_H) / 32 - 1 - r) < 6).map(([k, s]) => `${Math.floor((s.x + BODY_W / 2) / 32)},${Math.round((s.y + BODY_H) / 32) - 1}`);
console.log('vicini raggiunti:', near.join(' '));
if (b) {
    const loc = simReach(m, b, ab, { x0: (c - 30) * 32, x1: (c + 30) * 32, y0: (r - 30) * 32, y1: (r + 10) * 32 });
    console.log('da lì il bersaglio:', loc.reached.has(tkey), 'stati locali', loc.reached.size, 'archi da qui', (glob.edges.get(key) ?? []).length);
}
void keyOf;
