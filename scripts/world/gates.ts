import { LEVELS } from '../../src/content/levels';
import { generateRegion } from '../../src/world/region';
import { analyze, BASIC, DASH, FULL } from '../../src/world/moves';
import { Grid } from '../../src/world/grid';
// stanze laterali che si aprono solo col doppio salto: si torna dopo
for (const id of ['perduta', 'bus']) {
  const reg = generateRegion(LEVELS[id], 1);
  const rows = reg.def.grid;
  const g = new Grid(rows[0].length, rows.length);
  let P = { c: 0, r: 0 };
  rows.forEach((row, r) => [...row].forEach((ch, c) => { g.set(c, r, '#^~F%'.includes(ch) ? ch : '.'); if (ch === 'P') P = { c, r }; }));
  const now = analyze(g, P, [], id === 'perduta' ? BASIC : DASH);
  const later = analyze(g, P, [], FULL);
  const side = reg.layout.rooms.filter((r) => r.pathIndex < 0);
  let gated = 0;
  for (const room of side) {
    const R = room.rect; let a = 0, b = 0;
    for (let r = R.y; r < R.y + R.h; r++) for (let c = R.x; c < R.x + R.w; c++) { const k = r * g.cols + c; a += now.reached[k]; b += later.reached[k]; }
    if (a === 0 && b > 0) gated++;
  }
  console.log(id, 'side rooms', side.length, 'only with double jump', gated);
}
