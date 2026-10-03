import { fork } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { cpus } from 'node:os';
import { fileURLToPath } from 'node:url';
import { LEVEL_ORDER, LEVELS, REGION_IDS } from '../../src/content/levels';
import { addGates } from '../../src/world/gates';
import type { SimAbilities } from '../../src/world/sim';
import { encodeRegion } from '../../src/world/codec';
import { generateRegion } from '../../src/world/region';
import { simRepair } from '../../src/world/simfix';
import { computeTrials } from '../../src/world/trials';
import type { PhysicalAbilityGate } from '../../src/world/types';
import { abilitiesFor } from './abilities';

/* genera tutte le regioni in public/regions: il gioco le carica già pronte.
   prima il generatore col suo modello di salti, poi il geco simulato con la
   fisica vera ripara le conche e controlla tutto. una regione con trappole,
   trama irraggiungibile o uscita irraggiungibile ferma tutto */

const outDir = 'public/regions';

/** il simulatore boccia anche regioni che il modello astratto approva: si riprova col tentativo dopo */
const SIM_RETRIES = 6;

function buildOne(id: string): boolean {
    let from = 0;
    for (let k = 0; k <= SIM_RETRIES; k++) {
        const res = buildAttempt(id, from, k === SIM_RETRIES);
        if (res.ok) return true;
        from = res.attempt + 1;
    }
    return false;
}

function buildAttempt(id: string, firstAttempt: number, last: boolean): { ok: boolean; attempt: number } {
    const def = LEVELS[id];
    const t0 = performance.now();
    const region = generateRegion(def, 40, firstAttempt);
    const r = region.report;
    let fixed = simRepair(region.def.grid, region.def.entities, region.layout, abilitiesFor(id));
    // chi torna più avanti con abilità nuove non deve trovare trappole: si ripara anche per loro
    const idx0 = LEVEL_ORDER.indexOf(id);
    if (idx0 >= 0 && idx0 <= LEVEL_ORDER.indexOf('rio')) {
        let rounds = fixed.rounds;
        for (const later of [{ dash: true, double: true }, { dash: true, double: true, wall: true }] as SimAbilities[]) {
            const f2 = simRepair(fixed.grid, region.def.entities, region.layout, later);
            rounds += f2.rounds;
            if (f2.verdict.stuck.length) console.log(`${id.padEnd(13)} trappole rimaste con ${JSON.stringify(later)}: ${f2.verdict.stuck.length}`);
            fixed = { ...f2, rounds };
        }
        // e il capitolo deve restare giocabile come prima
        const back = simRepair(fixed.grid, region.def.entities, region.layout, abilitiesFor(id));
        fixed = { ...back, rounds: rounds + back.rounds };
    }
    const v = fixed.verdict;
    const ok = r.exitReached && r.lostBeats === 0 && v.exit && v.stuck.length === 0 && v.missing.length === 0;
    // cancelli d'abilità nei primi capitoli: si torna col doppio salto o con aggrappo
    let grid = fixed.grid;
    let entities = region.def.entities;
    const idx = LEVEL_ORDER.indexOf(id);
    const gateLog: string[] = [];
    if (ok && idx >= 0 && idx <= LEVEL_ORDER.indexOf('rio')) {
        const now = abilitiesFor(id);
        const passes: SimAbilities[] = [];
        if (!now.double) passes.push({ dash: true, double: true });
        passes.push({ dash: true, double: true, wall: true });
        const gated: { c: number; r: number }[] = [];
        const physical: PhysicalAbilityGate[] = [];
        for (const later of passes) {
            const want = later.wall ? 2 : 1;
            const g = addGates(grid, entities, region.layout, now, later, v.good, want, (s) => gateLog.push(s), gated);
            grid = g.grid;
            entities = g.entities;
            gated.push(...g.gates);
            physical.push(...g.physical);
        }
        // i sigilli del piano 7 ci si agganciano senza rigenerare a caso
        if (physical.length) region.layout.abilityGates = physical;
    }
    // fino a 4 posti per stanza, sparsi in larghezza, su aria libera con la testa libera
    const rows = grid;
    const spots: [number, number, number][] = [];
    for (const room of region.layout.rooms) {
        const R = room.rect;
        const here = v.good.filter((g) => g.c > R.x && g.c < R.x + R.w - 1 && g.r > R.y && g.r < R.y + R.h - 1
            && rows[g.r][g.c] === '.' && rows[g.r - 1][g.c] === '.' && rows[g.r + 1][g.c] === '#').sort((a, b) => a.c - b.c);
        for (const k of [0.15, 0.4, 0.65, 0.9]) {
            const s = here[Math.floor(k * (here.length - 1))];
            if (s && !spots.some(([c, r]) => c === s.c && r === s.r)) spots.push([s.c, s.r, room.id]);
        }
    }
    region.layout.spots = spots;
    if (ok) region.layout.trials = computeTrials(grid, region.layout, abilitiesFor(id));
    const file = encodeRegion(def, grid, entities, region.layout);
    const json = JSON.stringify(file);
    console.log(
        `${id.padEnd(13)} ${ok ? 'ok  ' : last ? 'FAIL' : 'riprovo'} ${String(Math.round(performance.now() - t0)).padStart(6)}ms`,
        `tentativo ${region.attempt}`,
        `${region.layout.cols}x${region.layout.rows}`,
        `${region.layout.rooms.length} stanze`,
        `${v.states} posizioni`,
        fixed.rounds ? `${fixed.rounds} riparazioni` : '',
        `${Math.round(json.length / 1024)}kb`,
        ok ? '' : JSON.stringify({ ...r, simExit: v.exit, stuck: v.stuck.length, missing: v.missing }),
    );
    for (const line of gateLog) if (!line.includes('scartato') || process.env.GATE_DEBUG) console.log(`${id.padEnd(13)}${line}`);
    if (ok) writeFileSync(`${outDir}/${id}.json`, json);
    else if (process.env.KEEP_FAIL) writeFileSync(`${process.env.TMPDIR ?? '/tmp'}/${id}.fail.json`, json);
    return { ok, attempt: region.attempt };
}

const only = process.argv[2];
mkdirSync(outDir, { recursive: true });
if (only) {
    process.exit(buildOne(only) ? 0 : 1);
} else {
    // un processo per regione, quanti ne regge la macchina
    const ids = REGION_IDS;
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
