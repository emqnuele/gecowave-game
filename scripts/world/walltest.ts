import { readFileSync } from 'node:fs';
import { decodeGrid, type RegionFile } from '../../src/world/codec';
import { SimBody, SimMap, simFrame } from '../../src/world/sim';
import { BODY_H, BODY_W } from '../../src/world/sim';

// stessa prova del gioco vero: rio, muro alla colonna 275 riga 22, quattro salti dal muro
const f = JSON.parse(readFileSync('public/regions/rio.json', 'utf8')) as RegionFile;
const m = new SimMap(decodeGrid(f), { breakablesOpen: true });
const ab = { dash: true, double: true, wall: true };
const b = new SimBody();
b.x = (275 - 2) * 32 + 16 - BODY_W / 2;
b.y = 22 * 32 - BODY_H - 10;
for (let i = 0; i < 30; i++) simFrame(m, b, { dir: 0, jump: false, dash: false }, ab);
const sx = b.x, sy = b.y;
let pressAt = -99, jumps = 0;
const tr: number[][] = [];
let minY = 0;
for (let fr = 0; fr < 200; fr++) {
    const attached = b.wallSide !== 0 && b.now < b.wallUntil;
    let jump = fr < 14;
    if (fr >= 14 && attached && jumps < 4 && fr - pressAt > 4) { pressAt = fr; jumps++; }
    if (fr >= 14 && fr - pressAt <= 13) jump = fr - pressAt >= 1;
    simFrame(m, b, { dir: 1, jump, dash: false }, ab);
    minY = Math.min(minY, b.y - sy);
    if (fr % 10 === 0) tr.push([Math.round(b.x - sx), Math.round(b.y - sy)]);
}
console.log(JSON.stringify({ minY: Math.round(minY), jumps, tr }));
