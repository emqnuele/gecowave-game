import { readFileSync } from 'node:fs';
import { decodeGrid, type RegionFile } from '../../src/world/codec';
import { writePng } from './png';

// uso: render <id> [scala] [x0 x1 y0 y1] -> png nella cartella tmp
const [id, scaleArg, ...win] = process.argv.slice(2);
const f = JSON.parse(readFileSync(`public/regions/${id}.json`, 'utf8')) as RegionFile;
const rows = decodeGrid(f);
const s = Number(scaleArg ?? 2);
const [x0, x1, y0, y1] = win.length === 4 ? win.map(Number) : [0, rows[0].length, 0, rows.length];
const W = (x1 - x0) * s;
const H = (y1 - y0) * s;
const img = new Uint8Array(W * H * 3);
const col = (ch: string): [number, number, number] => {
    if (ch === '#') return [70, 70, 80];
    if (ch === '.') return [12, 12, 18];
    if (ch === '^') return [230, 40, 40];
    if (ch === '~') return [40, 90, 230];
    if (ch === 'F') return [140, 60, 160];
    if (ch === '%') return [180, 120, 50];
    if (ch === 'P') return [0, 255, 0];
    if (ch === 'X') return [255, 255, 0];
    if (ch === 'C') return [0, 255, 255];
    const e = f.entities[ch];
    if (e?.type === 'enemy') return [255, 120, 120];
    if (e?.type === 'boss') return [255, 0, 255];
    if (e?.type === 'npc') return [255, 255, 255];
    return [255, 200, 120];
};
for (let r = y0; r < y1; r++) for (let c = x0; c < x1; c++) {
    const [R, G, B] = col(rows[r][c]);
    const big = !'#.^~F%'.includes(rows[r][c]);
    for (let dy = -(big ? s : 0); dy < s + (big ? s : 0); dy++) for (let dx = -(big ? s : 0); dx < s + (big ? s : 0); dx++) {
        const px = (c - x0) * s + dx;
        const py = (r - y0) * s + dy;
        if (px < 0 || py < 0 || px >= W || py >= H) continue;
        const k = (py * W + px) * 3;
        img[k] = R; img[k + 1] = G; img[k + 2] = B;
    }
}
const out = `${process.env.OUT ?? '/tmp'}/region-${id}.png`;
writePng(out, W, H, img);
console.log(out, rows[0].length, rows.length);
