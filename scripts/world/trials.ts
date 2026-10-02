import { fork } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { cpus } from 'node:os';
import { fileURLToPath } from 'node:url';
import { REGION_IDS } from '../../src/content/levels';
import { decodeGrid, type RegionFile } from '../../src/world/codec';
import { computeTrials } from '../../src/world/trials';
import { abilitiesFor } from './abilities';

/* aggiunge le corse contro il citelis alle regioni già generate, senza rigenerarle.
   build-regions le calcola da sé: questo serve solo a non rifare ore di generazione */

function one(id: string): void {
    const path = `public/regions/${id}.json`;
    const file = JSON.parse(readFileSync(path, 'utf8')) as RegionFile;
    const t0 = performance.now();
    file.layout.trials = computeTrials(decodeGrid(file), file.layout, abilitiesFor(id));
    writeFileSync(path, JSON.stringify(file));
    const secs = file.layout.trials.map((l) => (l.frames / 60).toFixed(1)).join(' ');
    console.log(`${id.padEnd(13)} ${Math.round(performance.now() - t0)}ms  tratte: ${secs}`);
}

const only = process.argv[2];
if (only) one(only);
else {
    const self = fileURLToPath(import.meta.url);
    let next = 0;
    let running = 0;
    const launch = () => {
        while (running < cpus().length && next < REGION_IDS.length) {
            running++;
            fork(self, [REGION_IDS[next++]]).on('exit', () => {
                running--;
                launch();
            });
        }
    };
    launch();
}
