import { fork } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { cpus } from 'node:os';
import { fileURLToPath } from 'node:url';
import { LEVELS } from '../../src/content/levels';
import { encodeRegion } from '../../src/world/codec';
import { generateRegion } from '../../src/world/region';
import { simRepair } from '../../src/world/simfix';
import { abilitiesFor } from './abilities';

/* genera tutte le regioni in public/regions: il gioco le carica già pronte.
   prima il generatore col suo modello di salti, poi il geco simulato con la
   fisica vera ripara le conche e controlla tutto. una regione con trappole,
   trama irraggiungibile o uscita irraggiungibile ferma tutto */

const outDir = 'public/regions';

function buildOne(id: string): boolean {
    const def = LEVELS[id];
    const t0 = performance.now();
    const region = generateRegion(def, 40);
    const r = region.report;
    const fixed = simRepair(region.def.grid, region.def.entities, region.layout, abilitiesFor(id));
    const v = fixed.verdict;
    const ok = r.exitReached && r.lostBeats === 0 && v.exit && v.stuck.length === 0 && v.missing.length === 0;
    const file = encodeRegion(def, fixed.grid, region.def.entities, region.layout);
    const json = JSON.stringify(file);
    console.log(
        `${id.padEnd(13)} ${ok ? 'ok  ' : 'FAIL'} ${String(Math.round(performance.now() - t0)).padStart(6)}ms`,
        `${region.layout.cols}x${region.layout.rows}`,
        `${region.layout.rooms.length} stanze`,
        `${v.states} posizioni`,
        fixed.rounds ? `${fixed.rounds} riparazioni` : '',
        `${Math.round(json.length / 1024)}kb`,
        ok ? '' : JSON.stringify({ ...r, simExit: v.exit, stuck: v.stuck.length, missing: v.missing }),
    );
    if (ok) writeFileSync(`${outDir}/${id}.json`, json);
    return ok;
}

const only = process.argv[2];
mkdirSync(outDir, { recursive: true });
if (only) {
    process.exit(buildOne(only) ? 0 : 1);
} else {
    // un processo per regione, quanti ne regge la macchina
    const ids = Object.keys(LEVELS);
    const self = fileURLToPath(import.meta.url);
    const failures: string[] = [];
    let next = 0;
    let running = 0;
    const launch = () => {
        while (running < Math.max(1, cpus().length) && next < ids.length) {
            const id = ids[next++];
            running++;
            fork(self, [id]).on('exit', (code) => {
                running--;
                if (code !== 0) failures.push(id);
                if (next < ids.length) launch();
                else if (running === 0) {
                    if (failures.length) {
                        console.error(`regioni non valide: ${failures.join(', ')}`);
                        process.exit(1);
                    }
                }
            });
        }
    };
    launch();
}
