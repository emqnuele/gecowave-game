import { LEVELS, REGION_IDS } from '../../src/content/levels';
import { generateRegion } from '../../src/world/region';
const only = process.argv[2]; const attempts = Number(process.argv[3] ?? 1);
for (const id of REGION_IDS) {
  if (only && only !== 'all' && id !== only) continue;
  const t0 = performance.now();
  try { const r = generateRegion(LEVELS[id], attempts); console.log(id.padEnd(13), Math.round(performance.now()-t0)+'ms', 'attempt', r.attempt, JSON.stringify(r.report)); }
  catch (e) { console.log(id, 'FAIL', (e as Error).message); }
}
