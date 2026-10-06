import { SimMap, SimBody, simFrame } from '../../src/world/sim';
const row = '#'.repeat(200);
const g = [...Array(20).fill('.'.repeat(200)), row, row];
const m = new SimMap(g);
const ab = { dash: false, double: false };
const b = new SimBody(); b.x = 100; b.y = 20 * 32 - 56;
for (let i = 0; i < 30; i++) simFrame(m, b, { dir: 1, jump: false, dash: false }, ab);
console.log('ground', b.blockedDown, b.x, b.y, b.vx);
const x0 = b.x; let minY = b.y; let f = 0;
for (f = 0; f < 120; f++) { simFrame(m, b, { dir: 1, jump: true, dash: false }, ab); minY = Math.min(minY, b.y); if (f > 3 && b.blockedDown) break; }
console.log('frames', f, 'dist', b.x - x0, 'apex', 20 * 32 - 55.2 - minY);
