import { readFileSync } from 'node:fs';
import { LEVELS, REGION_IDS } from '../../src/content/levels';
import { decodeGrid, type RegionFile } from '../../src/world/codec';
import { Grid } from '../../src/world/grid';
import { analyze, FULL } from '../../src/world/moves';
// posizioni in piedi raggiungibili dallo spawn: quanto c'è da camminare, prima e dopo
function walkable(rows: string[]): number {
    const g = new Grid(rows[0].length, rows.length);
    let P = { c: 0, r: 0 };
    rows.forEach((row, r) => [...row].forEach((ch, c) => {
        g.force(c, r, '#^~F%'.includes(ch) ? ch : '.');
        if (ch === 'P') P = { c, r };
    }));
    return analyze(g, P, [], FULL).reached.reduce((a, b) => a + b, 0);
}
let oldT = 0;
let newT = 0;
for (const def of REGION_IDS.map((id) => LEVELS[id])) {
    const f = JSON.parse(readFileSync(`public/regions/${def.id}.json`, 'utf8')) as RegionFile;
    const a = walkable(def.grid);
    const b = walkable(decodeGrid(f));
    oldT += a;
    newT += b;
    console.log(def.id.padEnd(13), String(a).padStart(6), String(b).padStart(7), `${(b / a).toFixed(1)}x`);
}
console.log('totale', oldT, newT, `${(newT / oldT).toFixed(1)}x`);
