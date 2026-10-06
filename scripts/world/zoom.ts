import { LEVELS } from '../../src/content/levels';
import { generateRegion, GEN_DEBUG } from '../../src/world/region';
import { analyze, BASIC, FULL } from '../../src/world/moves';
import { Grid } from '../../src/world/grid';
GEN_DEBUG.skipCarve = !!process.env.NOCARVE; GEN_DEBUG.skipRepair = !!process.env.NOREPAIR;
const [id, x0, x1, y0, y1, sc, sr] = process.argv.slice(2);
const reg = generateRegion(LEVELS[id], 1);
const rows = reg.def.grid;
const g = new Grid(rows[0].length, rows.length);
rows.forEach((row, r) => [...row].forEach((ch, c) => g.set(c, r, '#^~F%'.includes(ch) ? ch : '.')));
let P = { c: +sc, r: +sr }; if (!sc) rows.forEach((row, r) => { const c = row.indexOf('P'); if (c >= 0) P = { c, r }; }); const reach = analyze(g, P, [], id === 'perduta' ? BASIC : FULL);
let head = '    '; for (let c = +x0; c <= +x1; c++) head += String(c % 10); console.log(head);
for (let r = +y0; r <= +y1; r++) { let line = String(r).padStart(3) + ' '; for (let c = +x0; c <= +x1; c++) line += (c===+sc&&r===+sr)?'@':reach.reached[r*g.cols+c] ? 'o' : rows[r][c]; console.log(line); }
