import { mkdirSync, writeFileSync } from 'node:fs';
import { LEVELS } from '../../src/content/levels';
import { encodeRegion } from '../../src/world/codec';
import { generateRegion } from '../../src/world/region';

/* genera tutte le regioni in public/regions: il gioco le carica già pronte.
   una regione con vicoli ciechi, trama persa o uscita irraggiungibile ferma tutto */

const only = process.argv[2];
const outDir = 'public/regions';
mkdirSync(outDir, { recursive: true });
const failures: string[] = [];
for (const def of Object.values(LEVELS)) {
    if (only && def.id !== only) continue;
    const t0 = performance.now();
    const region = generateRegion(def, 40);
    const r = region.report;
    const ok = r.exitReached && r.lostBeats === 0 && r.stuck === 0 && r.stuckFull === 0;
    const file = encodeRegion(def, region.def.grid, region.def.entities, region.layout);
    const json = JSON.stringify(file);
    console.log(
        `${def.id.padEnd(13)} ${ok ? 'ok  ' : 'FAIL'} ${String(Math.round(performance.now() - t0)).padStart(5)}ms`,
        `${region.layout.cols}x${region.layout.rows}`,
        `${region.layout.rooms.length} stanze`,
        `${Math.round(json.length / 1024)}kb`,
        ok ? '' : JSON.stringify(r),
    );
    if (!ok) {
        failures.push(def.id);
        continue;
    }
    writeFileSync(`${outDir}/${def.id}.json`, json);
}
if (failures.length) {
    console.error(`regioni non valide: ${failures.join(', ')}`);
    process.exit(1);
}
