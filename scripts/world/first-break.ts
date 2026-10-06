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
const m = id === 'perduta' ? BASIC : id === 'bus' ? DASH : FULL;
const reach = analyze(g, P, [], m);
const path = reg.layout.rooms.filter(r=>r.pathIndex>=0).sort((a,b)=>a.pathIndex-b.pathIndex);
const cnt = (room) => { let n=0; const R=room.rect; for (let r=R.y;r<R.y+R.h;r++) for(let c=R.x;c<R.x+R.w;c++) if (reach.reached[r*g.cols+c]) n++; return n; };
const bad = path.find(r => cnt(r) === 0);
if (!bad) { console.log('all path rooms reached'); process.exit(0); }
const prev = path[bad.pathIndex - 1];
const d = reg.layout.doors.find(d => (d.a===prev.id&&d.b===bad.id)||(d.b===prev.id&&d.a===bad.id));
console.log('first unreached', bad.pathIndex, bad.kind, 'from', prev.kind, 'door', d);
const cx = d.x, cy = d.y;
for (let r = cy - 14; r <= cy + 10; r++) { let line=''; for (let c = cx - 22; c <= cx + 22; c++) { const ch = rows[r]?.[c] ?? ' '; line += reach.reached[r*g.cols+c] ? 'o' : ch; } console.log(line, r); }
