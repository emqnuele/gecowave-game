import { LEVELS } from '../../src/content/levels';
import { BODY_H, BODY_W, SimMap } from '../../src/world/sim';
import { settleAt, simReach } from '../../src/world/simreach';

// uso: hubcheck <id> -> colonne e righe raggiunte dal geco simulato in un livello fatto a mano
const def = LEVELS[process.argv[2] ?? 'piazza'];
const m = new SimMap(def.grid, { breakablesOpen: true });
let P = { c: 0, r: 0 };
def.grid.forEach((row, r) => { const c = row.indexOf('P'); if (c >= 0) P = { c, r }; });
const start = settleAt(m, P.c, P.r, { dash: true, double: true });
if (!start) throw new Error('spawn non valido');
const reach = simReach(m, start, { dash: true, double: true });
const rows = def.grid.map((r) => [...r]);
for (const b of reach.reached.values()) {
    const c = Math.floor((b.x + BODY_W / 2) / 32);
    const r = Math.floor((b.y + BODY_H - 1) / 32);
    if (rows[r]?.[c] === '.') rows[r][c] = '+';
}
console.log(reach.reached.size, 'stati');
for (const r of rows) console.log(r.join(''));
