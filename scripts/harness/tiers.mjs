// il giro rapido: il sottoinsieme di scenari che esegue gli stessi rami del corpus intero nel minor numero di fotogrammi.
// copertura di insiemi greedy sui rami di GameScene, entities/ e dei moduli di gioco (dalla copertura per scenario).
// uso: node scripts/harness/tiers.mjs [--budget 0.97]   -> scripts/harness/tiers.json
//   poi: node scripts/harness/corpus.mjs check --tier rapido
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { BundleIndex, bundleOffset, enumerate, executedMask } from './branches.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');
const REF_DIST = resolve(ROOT, process.env.REF_DIST ?? '../gecowave-main/dist-dev');
const SRC = resolve(REF_DIST, '../src');
const RAW = join(ROOT, '.harness/coverage/raw');
const i = process.argv.indexOf('--budget');
const budget = i > 0 ? Number(process.argv[i + 1]) : 0.97;

// i percorsi di main (engine/) e quelli dopo il refactor (parte B): lo stesso filtro vale sui due codici
const FOCUS = (f) => f === 'src/scenes/GameScene.ts' || f === 'src/world/NavGraph.ts' || /^src\/(entities|engine|game|core|audio|input|art|stage|story|mechanics|rules)\//.test(f);
const files = [];
const walk = (d) => {
    for (const n of readdirSync(join(SRC, d))) {
        const rel = `${d}/${n}`;
        if (statSync(join(SRC, rel)).isDirectory()) walk(rel);
        else if (n.endsWith('.ts') && FOCUS(`src/${rel}`)) files.push(`src/${rel}`);
    }
};
for (const d of ['scenes', 'entities', 'engine']) walk(d);

const raws = readdirSync(RAW).filter((f) => f.endsWith('.json.gz')).map((f) => ({ id: f.replace('.json.gz', ''), cov: JSON.parse(gunzipSync(readFileSync(join(RAW, f))).toString()) }));
const bundle = join(REF_DIST, 'assets', raws[0].cov.url.split('/assets/')[1]);
const source = readFileSync(bundle, 'utf8');
const base = new BundleIndex(source, JSON.parse(readFileSync(`${bundle}.map`, 'utf8')), []);

// i punti da controllare: ogni braccio di ramo e ogni funzione, come offset nel bundle
const points = [];
for (const rel of files) {
    const { arms, fns } = enumerate(join(SRC, rel.slice(4)));
    for (const x of [...arms, ...fns]) {
        const off = bundleOffset(base, rel, x.line, x.column);
        if (off !== null) points.push(off);
    }
}
const ref = JSON.parse(readFileSync(join(HERE, 'reference.json'), 'utf8'));
const sets = raws.map(({ id, cov }) => {
    const mask = executedMask(source, cov.functions);
    const hit = new Set();
    points.forEach((off, k) => { if (mask[off]) hit.add(k); });
    return { id, hit, cost: ref.scenarios[id]?.frames ?? 20000 };
});
const all = new Set();
for (const s of sets) for (const k of s.hit) all.add(k);
const chosen = [];
const got = new Set();
while (got.size < all.size * budget) {
    let best = null;
    let bestScore = 0;
    for (const s of sets) {
        if (chosen.includes(s)) continue;
        let gain = 0;
        for (const k of s.hit) if (!got.has(k)) gain++;
        const score = gain / Math.max(500, s.cost);
        if (gain && score > bestScore) { best = s; bestScore = score; }
    }
    if (!best) break;
    chosen.push(best);
    for (const k of best.hit) got.add(k);
}
const frames = chosen.reduce((a, s) => a + s.cost, 0);
const total = sets.reduce((a, s) => a + s.cost, 0);
const out = { budget, points: points.length, covered: all.size, rapido: { scenarios: chosen.map((s) => s.id), reach: got.size, frames } };
writeFileSync(join(HERE, 'tiers.json'), `${JSON.stringify(out, null, 1)}\n`);
console.log(`rapido: ${chosen.length}/${sets.length} scenari, ${got.size}/${all.size} punti coperti (${(100 * got.size / all.size).toFixed(1)}%), ${frames} fotogrammi su ${total} (${(100 * frames / total).toFixed(0)}%)`);
console.log(chosen.map((s) => s.id).join(' '));
