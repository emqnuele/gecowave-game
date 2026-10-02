import { LEVELS } from '../../src/content/levels';
import { generateRegion, GEN_DEBUG, pessimisticReach } from '../../src/world/region';
import { BASIC } from '../../src/world/moves';
let shown = 0; let fails = 0;
GEN_DEBUG.skipCarve = true; GEN_DEBUG.skipRepair = true;
GEN_DEBUG.onSkeletonFail = (g, room, hub, st) => {
  fails++;
  if (shown++ > 0) return;
  const reach = pessimisticReach(g, room.rect, hub, BASIC) ?? new Set();
  console.log('room', room.id, room.kind, 'hub', hub, 'stand', st, 'rect', room.rect);
  const R = room.rect;
  for (let r = R.y; r < R.y + R.h; r++) { let line = ''; for (let c = R.x; c < R.x + R.w; c++) { const locked = g.locked(c, r); line += (c===hub.c&&r===hub.r)?'H':(c===st.c&&r===st.r)?'S':reach.has(r*g.cols+c)?'o':(g.get(c,r)==='#' ? (locked?'#':'+') : (locked?'.':' ')); } console.log(line, r); }
};
generateRegion(LEVELS[process.argv[2] ?? 'perduta'], 1);
console.log('skeleton fails', fails);
