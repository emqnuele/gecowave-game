import { LEVELS } from '../../src/content/levels';
import { generateRegion, GEN_DEBUG } from '../../src/world/region';
GEN_DEBUG.skipCarve = true; GEN_DEBUG.skipRepair = true;
const [id, roomId, x0, x1, y0, y1] = process.argv.slice(2);
let done = false;
GEN_DEBUG.trace = (g, room, label) => {
  if (done || room.id !== +roomId) return;
  console.log('--', label);
  for (let r = +y0; r <= +y1; r++) { let line = String(r).padStart(3) + ' '; for (let c = +x0; c <= +x1; c++) line += g.get(c, r); console.log(line); }
};
generateRegion(LEVELS[id], 1);
