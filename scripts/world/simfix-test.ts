import { readFileSync, writeFileSync } from 'node:fs';
import { decodeGrid, encodeRegion, type RegionFile } from '../../src/world/codec';
import { LEVELS } from '../../src/content/levels';
import { simRepair } from '../../src/world/simfix';
import { abilitiesFor } from './abilities';

// uso: simfix-test <id> [write] : ripara le trappole di una regione già generata
const [id, write] = process.argv.slice(2);
const f = JSON.parse(readFileSync(`public/regions/${id}.json`, 'utf8')) as RegionFile;
const t0 = performance.now();
const res = simRepair(decodeGrid(f), f.entities, f.layout, abilitiesFor(id));
console.log(id, Math.round(performance.now() - t0) + 'ms', 'giri', res.rounds, 'uscita', res.verdict.exit, 'bloccati', res.verdict.stuck.length, 'mancanti', JSON.stringify(res.verdict.missing));
if (write === 'write') writeFileSync(`public/regions/${id}.json`, JSON.stringify(encodeRegion(LEVELS[id], res.grid, f.entities, f.layout)));
