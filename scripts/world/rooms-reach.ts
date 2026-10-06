import { LEVELS } from '../../src/content/levels';
import { generateRegion, GEN_DEBUG } from '../../src/world/region';
if (process.env.NOCARVE) GEN_DEBUG.skipCarve = true; if (process.env.NOREPAIR) GEN_DEBUG.skipRepair = true;
import { analyze, BASIC, DASH, FULL } from '../../src/world/moves';
import { Grid } from '../../src/world/grid';
const id = process.argv[2] ?? 'perduta';
const reg = generateRegion(LEVELS[id], 1);
const rows = reg.def.grid;
const g = new Grid(rows[0].length, rows.length);
let P = {c:0,r:0};
rows.forEach((row, r) => [...row].forEach((ch, c) => { g.set(c, r, '#^~F%'.includes(ch) ? ch : '.'); if (ch==='P') P={c,r}; }));
const reach = analyze(g, P, [], id === 'perduta' ? BASIC : id === 'bus' ? DASH : FULL);
const path = reg.layout.rooms.filter(r=>r.pathIndex>=0).sort((a,b)=>a.pathIndex-b.pathIndex);
for (const room of path) {
  let n=0; const R=room.rect;
  for (let r=R.y;r<R.y+R.h;r++) for(let c=R.x;c<R.x+R.w;c++) if (reach.reached[r*g.cols+c]) n++;
  const doors = reg.layout.doors.filter(d=>d.a===room.id||d.b===room.id).map(d=>`${d.axis}${d.kind[0]}->${d.a===room.id?d.b:d.a}@${d.x},${d.y}`).join(' ');
  console.log(room.pathIndex, room.id, room.kind, `slot ${room.sx},${room.sy} ${room.sw}x${room.sh}`, 'reached', n, doors);
}
// stampa la stanza 1 del percorso a piena risoluzione
const which = Number(process.argv[3] ?? 1);
const room = path[which]; const R = room.rect;
for (let r=R.y-1;r<R.y+R.h+1;r++){ let line=''; for(let c=R.x-1;c<R.x+R.w+1;c++){ const ch=rows[r]?.[c]??' '; line += reach.reached[r*g.cols+c] ? (ch==='.'?'o':ch) : ch; } console.log(line); }
