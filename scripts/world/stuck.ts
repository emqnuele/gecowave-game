import { LEVELS } from '../../src/content/levels';
import { generateRegion } from '../../src/world/region';
import { analyze, BASIC, DASH, FULL } from '../../src/world/moves';
import { Grid } from '../../src/world/grid';
// vicoli ciechi per stanza: x = raggiunta ma senza ritorno, o = raggiunta e con ritorno
const id = process.argv[2] ?? 'perduta';
const attempts = Number(process.argv[3] ?? 1);
const show = Number(process.argv[4] ?? 1);
const reg = generateRegion(LEVELS[id], attempts);
const rows = reg.def.grid;
const g = new Grid(rows[0].length, rows.length);
let P = { c: 0, r: 0 };
let X = { c: 0, r: 0 };
rows.forEach((row, r) => [...row].forEach((ch, c) => {
  g.set(c, r, '#^~F%'.includes(ch) ? ch : '.');
  if (ch === 'P') P = { c, r };
  if (ch === 'X' && rows[r + 1]?.[c] !== 'X') X = { c, r };
}));
const reach = analyze(g, P, [X], id === 'perduta' ? BASIC : id === 'bus' ? DASH : FULL);
const per = reg.layout.rooms.map((room) => {
  let n = 0; const R = room.rect;
  for (let r = R.y; r < R.y + R.h; r++) for (let c = R.x; c < R.x + R.w; c++) {
    const k = r * g.cols + c; if (reach.reached[k] && !reach.finishes[k]) n++;
  }
  return { room, n };
}).filter((x) => x.n > 0).sort((a, b) => b.n - a.n);
console.log('attempt', reg.attempt, JSON.stringify(reg.report));
for (const { room, n } of per) console.log(`room ${room.id} ${room.kind} path=${room.pathIndex} slot ${room.sx},${room.sy} ${room.sw}x${room.sh} stuck=${n}`);
for (const { room } of per.slice(0, show)) {
  const R = room.rect;
  console.log(`--- room ${room.id} ${room.kind} x${R.x} y${R.y}`);
  for (let r = R.y - 1; r < R.y + R.h + 1; r++) {
    let line = String(r).padStart(4) + ' ';
    for (let c = R.x - 1; c < R.x + R.w + 1; c++) {
      const k = r * g.cols + c; const ch = rows[r]?.[c] ?? ' ';
      line += reach.reached[k] ? (reach.finishes[k] ? 'o' : 'x') : ch;
    }
    console.log(line);
  }
}
