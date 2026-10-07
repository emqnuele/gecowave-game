// il corpus degli scenari: riferimento su main, confronto del refactor, prova di determinismo.
// uso:
//   node scripts/harness/corpus.mjs ref   [--only a,b] [--jobs 4]   tracce di main (REF_DIST), hash in reference.json
//   node scripts/harness/corpus.mjs check [--only a,b] [--jobs 4]   tracce della build corrente contro il riferimento
//   node scripts/harness/corpus.mjs self  [--only a,b]              la stessa build due volte: devono essere identiche
//   node scripts/harness/corpus.mjs run   [--only a,b]              solo un giro sulla build corrente (VERBOSE=1 per il diario del bot)
//   node scripts/harness/corpus.mjs list
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { runScenario } from './runner.mjs';
import { compare, readTrace } from './tracediff.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');
const REF_FILE = join(HERE, 'reference.json');
const TRACES = join(ROOT, '.harness/traces');
const REF_DIST = process.env.REF_DIST ?? '../gecowave-main/dist-dev';
const CUR_DIST = process.env.DIST ?? 'dist-dev';

const args = process.argv.slice(2);
const mode = args[0] ?? 'check';
const opt = (name, def = null) => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 ? args[i + 1] : def;
};
const jobs = Number(opt('jobs', '4'));
const only = opt('only')?.split(',') ?? null;
const skip = opt('skip')?.split(',') ?? [];

export async function loadScenarios() {
    const dir = join(HERE, 'scenarios');
    const out = [];
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.mjs')).sort()) {
        const mod = await import(pathToFileURL(join(dir, f)).href);
        const list = Array.isArray(mod.default) ? mod.default : [mod.default];
        for (const s of list) out.push({ ...s, file: f });
    }
    const ids = new Set();
    for (const s of out) {
        if (ids.has(s.id)) throw new Error(`scenario doppio: ${s.id}`);
        ids.add(s.id);
    }
    return out;
}

async function pool(items, n, fn) {
    const results = [];
    let next = 0;
    const worker = async () => {
        while (next < items.length) {
            const i = next++;
            results[i] = await fn(items[i], i);
        }
    };
    await Promise.all(Array.from({ length: Math.min(n, items.length) }, worker));
    return results;
}

const pick = (all) => all.filter((s) => (!only || only.some((o) => s.id === o || s.id.startsWith(`${o}`))) && !skip.includes(s.id));
const tracePath = (tag, id) => join(TRACES, tag, `${id}.jsonl.gz`);
const fmt = (ms) => `${(ms / 1000).toFixed(1)}s`;

async function runAll(list, dist, tag) {
    const t0 = Date.now();
    const res = await pool(list, jobs, async (s) => {
        const r = await runScenario(s, { dist, out: tracePath(tag, s.id) });
        const warn = r.failure ? ` FALLITO: ${r.failure.split('\n')[0]}` : '';
        console.log(`  ${s.id.padEnd(38)} ${String(r.frames).padStart(6)} fotogrammi ${fmt(r.ms).padStart(7)}  ${r.strict}${warn}`);
        return r;
    });
    console.log(`  totale ${fmt(Date.now() - t0)}`);
    return res;
}

/** rilancia uno scenario su entrambe le build con le impronte complete attorno alla divergenza */
async function detail(s, frame) {
    const fullAt = [frame - 1, frame];
    const [a, b] = await Promise.all([
        runScenario(s, { dist: REF_DIST, out: tracePath('ref-detail', s.id), fullAt }),
        runScenario(s, { dist: CUR_DIST, out: tracePath('cur-detail', s.id), fullAt }),
    ]);
    void a; void b;
    return compare(readTrace(tracePath('ref-detail', s.id)), readTrace(tracePath('cur-detail', s.id)));
}

async function main() {
    const all = await loadScenarios();
    if (mode === 'list') {
        for (const s of all) console.log(`${s.id.padEnd(40)} ${s.level.padEnd(14)} ${s.file}`);
        return 0;
    }
    const list = pick(all);
    if (!list.length) throw new Error('nessuno scenario selezionato');

    if (mode === 'run') {
        // giro di prova sulla build corrente, senza confronti: per scrivere e mettere a punto gli scenari
        const res = await runAll(list, CUR_DIST, 'run');
        for (const r of res) if (r.failure) console.log(`\n${r.id}: ${r.failure}`);
        return res.some((r) => r.failure) ? 1 : 0;
    }

    if (mode === 'ref') {
        if (!existsSync(resolve(ROOT, REF_DIST))) throw new Error(`manca la build di riferimento ${REF_DIST}: scripts/harness/build.sh ../gecowave-main`);
        const refDir = resolve(ROOT, REF_DIST, '..');
        const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: refDir }).toString().trim();
        console.log(`riferimento: ${REF_DIST} @ ${commit.slice(0, 8)}, ${list.length} scenari`);
        const res = await runAll(list, REF_DIST, 'ref');
        const prev = existsSync(REF_FILE) ? JSON.parse(readFileSync(REF_FILE, 'utf8')) : { scenarios: {} };
        if (prev.commit && prev.commit !== commit && !only) prev.scenarios = {};
        const out = { commit, note: prev.commit === commit ? prev.note : null, scenarios: { ...prev.scenarios } };
        for (const r of res) out.scenarios[r.id] = { strict: r.strict, diag: r.diag, frames: r.frames, failure: r.failure ? r.failure.split('\n')[0] : null };
        const sorted = Object.fromEntries(Object.entries(out.scenarios).sort(([a], [b]) => a.localeCompare(b)));
        writeFileSync(REF_FILE, `${JSON.stringify({ ...out, scenarios: sorted }, null, 1)}\n`);
        const failed = res.filter((r) => r.failure);
        if (failed.length) console.log(`\nATTENZIONE: ${failed.length} scenari falliti sul riferimento (lo scenario va sistemato, non il gioco)`);
        return failed.length ? 1 : 0;
    }

    if (mode === 'self') {
        console.log(`determinismo: ${CUR_DIST}, ${list.length} scenari, due volte`);
        const a = await runAll(list, CUR_DIST, 'self-a');
        const b = await runAll(list, CUR_DIST, 'self-b');
        let bad = 0;
        for (let i = 0; i < list.length; i++) {
            if (a[i].strict === b[i].strict && a[i].diag === b[i].diag) continue;
            bad++;
            console.log(`\n${list[i].id}: DIVERSE`);
            console.log(compare(readTrace(tracePath('self-a', list[i].id)), readTrace(tracePath('self-b', list[i].id))).report.join('\n'));
        }
        console.log(bad ? `\n${bad} scenari NON deterministici` : '\ntutti deterministici');
        return bad ? 1 : 0;
    }

    if (mode === 'check') {
        const ref = JSON.parse(readFileSync(REF_FILE, 'utf8'));
        console.log(`confronto: ${CUR_DIST} contro main @ ${ref.commit.slice(0, 8)}, ${list.length} scenari`);
        const res = await runAll(list, CUR_DIST, 'cur');
        const reports = [];
        let bad = 0;
        let missing = 0;
        for (let i = 0; i < list.length; i++) {
            const s = list[i];
            const r = res[i];
            const want = ref.scenarios[s.id];
            if (!want) {
                missing++;
                console.log(`  ${s.id}: niente riferimento (corpus.mjs ref --only ${s.id})`);
                continue;
            }
            if (want.strict === r.strict) {
                if (want.diag !== r.diag) console.log(`  ${s.id}: strette uguali, diagnostica diversa (da guardare)`);
                continue;
            }
            bad++;
            let res2 = existsSync(tracePath('ref', s.id))
                ? compare(readTrace(tracePath('ref', s.id)), readTrace(tracePath('cur', s.id)))
                : { report: ['manca la traccia completa del riferimento: rigenerala con corpus.mjs ref --only ' + s.id] };
            const heavy = (res2.sections ?? []).some((k) => ['dl', 'dlo', 'ent', 'bod', 'lit'].includes(k));
            if (heavy && res2.frame !== undefined && !args.includes('--no-detail')) res2 = await detail(s, res2.frame);
            const text = `\n===== ${s.id} =====\n${res2.report.join('\n')}`;
            reports.push(text);
            console.log(text);
        }
        mkdirSync(join(ROOT, '.harness'), { recursive: true });
        writeFileSync(join(ROOT, '.harness/report-check.txt'), reports.join('\n'));
        console.log(bad ? `\n${bad} scenari DIVERSI da main` : `\ntutti uguali a main${missing ? ` (${missing} senza riferimento)` : ''}`);
        return bad || missing ? 1 : 0;
    }
    throw new Error(`modo sconosciuto: ${mode}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main().then((code) => process.exit(code), (e) => {
        console.error(e);
        process.exit(2);
    });
}
