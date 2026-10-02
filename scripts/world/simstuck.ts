import { readFileSync } from 'node:fs';
import { decodeGrid, type RegionFile } from '../../src/world/codec';
import { BODY_H, BODY_W, SimMap } from '../../src/world/sim';
import { canFinish, settleAt, simReach } from '../../src/world/simreach';
import { abilitiesFor } from './abilities';

// uso: simstuck <id> : dove sono le posizioni da cui l'uscita non si raggiunge più, con la mappa attorno
const id = process.argv[2];
const f = JSON.parse(readFileSync(`public/regions/${id}.json`, 'utf8')) as RegionFile;
const grid = decodeGrid(f);
const m = new SimMap(grid, { breakablesOpen: true });
const ab = abilitiesFor(id);
let P = { c: 0, r: 0 }, X = { c: 0, r: 0 };
grid.forEach((row, r) => { const c = row.indexOf('P'); if (c >= 0) P = { c, r }; const x = row.indexOf('X'); if (x >= 0) X = { c: x, r }; });
const reach = simReach(m, settleAt(m, P.c, P.r, ab)!, ab);
const exitKeys = [...reach.reached.entries()].filter(([, b]) => Math.abs(b.x + BODY_W / 2 - (X.c * 32 + 16)) < 40 && Math.abs(b.y + BODY_H / 2 - (X.r * 32 + 48)) < 70).map(([k]) => k);
const fin = canFinish(reach, exitKeys);
const stuck = [...reach.reached.entries()].filter(([k]) => !fin.has(k)).map(([, b]) => ({ c: Math.floor((b.x + BODY_W / 2) / 32), r: Math.round((b.y + BODY_H) / 32) - 1 }));
console.log('stuck', stuck.length, JSON.stringify(stuck.slice(0, 30)));
const groups: { c: number; r: number }[][] = [];
for (const s of stuck) {
    const g = groups.find((gr) => gr.some((o) => Math.abs(o.c - s.c) < 12 && Math.abs(o.r - s.r) < 8));
    if (g) g.push(s); else groups.push([s]);
}
for (const g of groups.slice(0, 4)) {
    const c0 = Math.min(...g.map((s) => s.c)) - 14, c1 = Math.max(...g.map((s) => s.c)) + 14;
    const r0 = Math.min(...g.map((s) => s.r)) - 10, r1 = Math.max(...g.map((s) => s.r)) + 6;
    const on = new Set(g.map((s) => `${s.c},${s.r}`));
    const room = f.layout.rooms.find((o) => g[0].c >= o.rect.x && g[0].c < o.rect.x + o.rect.w && g[0].r >= o.rect.y && g[0].r < o.rect.y + o.rect.h);
    console.log(`\n--- gruppo di ${g.length}, stanza ${room?.id} ${room?.kind} path ${room?.pathIndex}`);
    for (let r = r0; r <= r1; r++) {
        let line = '';
        for (let c = c0; c <= c1; c++) line += on.has(`${c},${r}`) ? 'S' : grid[r]?.[c] ?? ' ';
        console.log(String(r).padStart(3), line);
    }
}
