// copertura del corpus sulla build di main: quali funzioni, righe e rami di src/ nessuno scenario esegue mai.
// uso: node scripts/harness/coverage.mjs [--only a,b] [--jobs 4] [--reuse]
//   --reuse: riusa la copertura grezza già raccolta per gli scenari che ce l'hanno
// scrive docs/harness/copertura.md (nella repo) e il report html in .harness/coverage/html
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import v8toIstanbul from 'v8-to-istanbul';
import libCoverage from 'istanbul-lib-coverage';
import libReport from 'istanbul-lib-report';
import reports from 'istanbul-reports';
import v8cov from '@bcoe/v8-coverage';
import { loadScenarios } from './corpus.mjs';
import { runScenario } from './runner.mjs';
import { BundleIndex, enumerate } from './branches.mjs';
import { readdirSync, statSync } from 'node:fs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');
const REF_DIST = resolve(ROOT, process.env.REF_DIST ?? '../gecowave-main/dist-dev');
const RAW = join(ROOT, '.harness/coverage/raw');
const SRC = resolve(REF_DIST, '../src');
const args = process.argv.slice(2);
const opt = (name, def = null) => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 ? args[i + 1] : def;
};
const jobs = Number(opt('jobs', '4'));
const only = opt('only')?.split(',') ?? null;
const reuse = args.includes('--reuse');

/** i file su cui il refactor lavora: lì vogliamo ogni ramo raggiungibile eseguito */
// i percorsi di main (engine/) e quelli dopo il refactor (parte B): lo stesso filtro vale sui due codici
const FOCUS = (f) => f === 'src/scenes/GameScene.ts' || f === 'src/world/NavGraph.ts' || /^src\/(entities|engine|game|core|audio|input|art|stage|story|mechanics|rules)\//.test(f);

async function collect() {
    const all = await loadScenarios();
    const list = all.filter((s) => !only || only.some((o) => s.id === o || s.id.startsWith(o)));
    let next = 0;
    const t0 = Date.now();
    const worker = async () => {
        while (next < list.length) {
            const s = list[next++];
            const file = join(RAW, `${s.id}.json.gz`);
            if (reuse && existsSync(file)) continue;
            const r = await runScenario(s, { dist: REF_DIST, coverage: file, out: join(ROOT, '.harness/traces/cov', `${s.id}.jsonl.gz`) });
            console.log(`  ${s.id.padEnd(38)} ${String(r.frames).padStart(6)} fotogrammi ${(r.ms / 1000).toFixed(1).padStart(6)}s${r.failure ? ' FALLITO' : ''}`);
        }
    };
    await Promise.all(Array.from({ length: Math.min(jobs, list.length) }, worker));
    console.log(`  raccolta in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    return all.map((s) => s.id);
}

async function build(ids) {
    const covs = [];
    let url = null;
    for (const id of ids) {
        const file = join(RAW, `${id}.json.gz`);
        if (!existsSync(file)) continue;
        const raw = JSON.parse(gunzipSync(readFileSync(file)).toString());
        if (!raw.url) continue;
        url = raw.url;
        covs.push({ scriptId: '0', url: raw.url, functions: raw.functions });
    }
    if (!covs.length) throw new Error('nessuna copertura raccolta');
    const merged = v8cov.mergeScriptCovs(covs);
    const name = url.split('/assets/')[1];
    const bundle = join(REF_DIST, 'assets', name);
    const conv = v8toIstanbul(bundle, 0, {
        source: readFileSync(bundle, 'utf8'),
        sourceMap: { sourcemap: JSON.parse(readFileSync(`${bundle}.map`, 'utf8')) },
    }, (p) => !p.includes('/src/') || p.includes('node_modules'));
    await conv.load();
    conv.applyCoverage(merged.functions);
    const data = conv.toIstanbul();
    // i percorsi assoluti del worktree di main diventano src/...
    const norm = {};
    for (const [k, v] of Object.entries(data)) {
        const i = k.lastIndexOf('/src/');
        if (i < 0) continue;
        const rel = k.slice(i + 1);
        norm[rel] = { ...v, path: rel };
    }
    const index = new BundleIndex(readFileSync(bundle, 'utf8'), JSON.parse(readFileSync(`${bundle}.map`, 'utf8')), merged.functions);
    return { map: libCoverage.createCoverageMap(norm), scenarios: covs.length, index };
}

const pct = (c) => (c.total ? (100 * c.covered / c.total).toFixed(1) : '100.0');

/** tutti i .ts dei file del refactor */
function focusFiles() {
    const out = [];
    const walk = (d) => {
        for (const n of readdirSync(join(SRC, d))) {
            const rel = `${d}/${n}`;
            if (statSync(join(SRC, rel)).isDirectory()) walk(rel);
            else if (n.endsWith('.ts') && FOCUS(`src/${rel}`)) out.push(`src/${rel}`);
        }
    };
    walk('scenes');
    walk('entities');
    walk('engine');
    return out.sort();
}

/** rami e funzioni dal sorgente, uno per uno: il denominatore non dipende da cosa v8 ha visto */
function blindSpots(index) {
    const L = [];
    const rows = [];
    let at = 0, ae = 0, ft = 0, fe = 0;
    for (const rel of focusFiles()) {
        const { arms, fns } = enumerate(join(SRC, rel.slice(4)));
        const missArms = [];
        const missFns = [];
        let a = 0, f = 0;
        for (const x of arms) {
            const ok = index.executed(rel, x.line, x.column);
            if (ok === null) continue;
            at++;
            if (ok) { a++; ae++; } else missArms.push(x);
        }
        let fTot = 0;
        for (const x of fns) {
            const ok = index.executed(rel, x.line, x.column);
            if (ok === null) continue;
            ft++; fTot++;
            if (ok) { f++; fe++; } else missFns.push(x);
        }
        rows.push({ rel, a, aTot: a + missArms.length, f, fTot, missArms, missFns });
    }
    L.push(`## rami e funzioni dei file del refactor (dal sorgente)`);
    L.push('');
    L.push(`Ogni ramo (then/else, ?:, && || ??, case, catch, cicli) e ogni funzione di \`GameScene.ts\`, \`entities/\` e dei moduli di gioco (\`engine/\` su main; \`game/\`, \`core/\`, \`stage/\`, \`story/\`, \`mechanics/\` e gli altri dopo il refactor), enumerati dall'ast di typescript e controllati sulla copertura v8 di tutto il corpus. Gli else impliciti non si possono misurare con la copertura a blocchi di v8: restano fuori dal conto.`);
    L.push('');
    L.push(`**rami eseguiti: ${ae}/${at} (${(100 * ae / at).toFixed(1)}%) · funzioni eseguite: ${fe}/${ft} (${(100 * fe / ft).toFixed(1)}%)**`);
    L.push('');
    L.push('| file | rami | funzioni |');
    L.push('|---|---|---|');
    for (const r of rows) L.push(`| ${r.rel} | ${r.a}/${r.aTot} | ${r.f}/${r.fTot} |`);
    L.push('');
    L.push('## punti ciechi');
    L.push('');
    L.push('Funzioni mai chiamate e rami mai presi. Va ridotto a codice davvero morto o irraggiungibile, scenario dopo scenario.');
    for (const r of rows) {
        if (!r.missArms.length && !r.missFns.length) continue;
        L.push('');
        L.push(`### ${r.rel}`);
        if (r.missFns.length) L.push(`- funzioni mai chiamate (${r.missFns.length}): ${r.missFns.map((x) => `${x.name}:${x.decl}`).join(', ')}`);
        // i rami dentro funzioni mai chiamate sono già detti sopra
        const arms = r.missArms.filter((x) => !r.missFns.some((fn) => x.line > fn.decl && x.line <= fn.end));
        if (arms.length) {
            L.push(`- rami mai presi (${arms.length}):`);
            for (const x of arms) L.push(`  - ${x.line} ${x.kind}: \`${x.text.replace(/`/g, "'")}\``);
        }
    }
    return L;
}

function report(map, scenarios, index) {
    const files = map.files().sort();
    const rows = [];
    const groups = new Map();
    for (const f of files) {
        const s = map.fileCoverageFor(f).toSummary();
        rows.push({ f, s });
        const g = f.split('/').slice(0, 2).join('/');
        if (!groups.has(g)) groups.set(g, libCoverage.createCoverageSummary());
        groups.get(g).merge(s);
    }
    const total = libCoverage.createCoverageSummary();
    for (const r of rows) total.merge(r.s);
    const L = [];
    L.push('# copertura del corpus');
    L.push('');
    L.push(`Generato da \`scripts/harness/coverage.mjs\` sulla build di main (${scenarios} scenari). È la mappa dei punti ciechi: una traccia uguale non dimostra niente sul codice che nessuno scenario esegue.`);
    L.push('');
    L.push('| | righe | rami | funzioni |');
    L.push('|---|---|---|---|');
    L.push(`| **totale src** | ${pct(total.lines)}% | ${pct(total.branches)}% | ${pct(total.functions)}% |`);
    for (const [g, s] of [...groups].sort()) L.push(`| ${g} | ${pct(s.lines)}% (${s.lines.covered}/${s.lines.total}) | ${pct(s.branches)}% (${s.branches.covered}/${s.branches.total}) | ${pct(s.functions)}% (${s.functions.covered}/${s.functions.total}) |`);
    L.push('');
    L.push('## per file');
    L.push('');
    L.push('| file | righe | rami | funzioni |');
    L.push('|---|---|---|---|');
    for (const { f, s } of rows) L.push(`| ${f} | ${pct(s.lines)}% | ${pct(s.branches)}% (${s.branches.total - s.branches.covered} mai) | ${pct(s.functions)}% (${s.functions.total - s.functions.covered} mai) |`);
    L.push('');
    L.push(...blindSpots(index));
    return L.join('\n');
}

const ids = await collect();
const { map, scenarios, index } = await build(ids);
mkdirSync(join(ROOT, 'docs/harness'), { recursive: true });
writeFileSync(join(ROOT, 'docs/harness/copertura.md'), `${report(map, scenarios, index)}\n`);
const ctx = libReport.createContext({ dir: join(ROOT, '.harness/coverage/html'), coverageMap: map, sourceFinder: (p) => readFileSync(resolve(REF_DIST, '../', p), 'utf8') });
reports.create('html').execute(ctx);
writeFileSync(join(ROOT, '.harness/coverage/coverage.json'), JSON.stringify(map.toJSON()));
const s = map.getCoverageSummary();
console.log(`copertura src: righe ${pct(s.lines)}%, rami ${pct(s.branches)}%, funzioni ${pct(s.functions)}% -> docs/harness/copertura.md`);
