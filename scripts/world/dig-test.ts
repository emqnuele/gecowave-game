import { dig } from '../../src/world/region';
import { analyze, BASIC } from '../../src/world/moves';
import { Grid } from '../../src/world/grid';
const g = new Grid(46, 40);
// stanza vuota, pavimento in fondo
g.carve({ x: 1, y: 1, w: 44, h: 37 });
const from = { c: 5, r: 37 };
const to = { c: 40, r: 10 };
for (let x = 38; x <= 44; x++) g.set(x, 11, '#');
dig(g, from, to, BASIC, { x: 0, y: 0, w: 46, h: 40 });
const reach = analyze(g, from, [to], BASIC);
const rows = g.toStrings();
rows.forEach((row, r) => console.log([...row].map((ch, c) => reach.reached[r * 46 + c] ? 'o' : ch).join('') + ' ' + r));
console.log('target reached', !!reach.reached[to.r * 46 + to.c]);
