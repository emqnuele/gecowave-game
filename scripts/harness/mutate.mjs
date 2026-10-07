// prova degli strumenti: ogni mutazione (mutations.mjs) toglie o cambia una riga di comportamento in un worktree a parte.
// si fanno girare solo gli scenari che eseguono quella riga (copertura per scenario), fermandosi al primo che diverge.
// uso: node scripts/harness/mutate.mjs [--only id,id] [--per 6]
//   prima: coverage.mjs (serve la copertura grezza per scenario) e corpus.mjs ref (tracce e hash di main)
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { BundleIndex, bundleOffset, countAt } from './branches.mjs';
import { loadScenarios } from './corpus.mjs';
import { runScenario } from './runner.mjs';
import { compare, readTrace } from './tracediff.mjs';
import MUTATIONS from './mutations.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');
const MUT = resolve(ROOT, '../gecowave-mut');
const REF_DIST = resolve(ROOT, process.env.REF_DIST ?? '../gecowave-main/dist-dev');
const RAW = join(ROOT, '.harness/coverage/raw');
const args = process.argv.slice(2);
const opt = (name, def = null) => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 ? args[i + 1] : def;
};
const only = opt('only')?.split(',') ?? null;
const per = Number(opt('per', '6'));
const git = (...a) => execFileSync('git', a, { cwd: MUT }).toString().trim();

function prepareWorktree() {
    const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT }).toString().trim();
    if (!existsSync(MUT)) {
        execFileSync('git', ['worktree', 'add', '--detach', MUT, head], { cwd: ROOT });
        symlinkSync(join(ROOT, 'node_modules'), join(MUT, 'node_modules'));
    }
    git('checkout', '--detach', head);
    git('checkout', '--', '.');
}

/** applica la mutazione (l'occorrenza nth di find) e ritorna la riga cambiata */
function apply(m) {
    const file = join(MUT, m.file);
    const src = readFileSync(file, 'utf8');
    const parts = src.split(m.find);
    if (parts.length < 2) throw new Error(`${m.id}: testo non trovato in ${m.file}`);
    const nth = m.nth ?? 0;
    if (m.nth === undefined && parts.length > 2) throw new Error(`${m.id}: testo non unico in ${m.file}`);
    const before = parts.slice(0, nth + 1).join(m.find);
    const after = parts.slice(nth + 1).join(m.find);
    writeFileSync(file, before + m.replace + after);
    const line = before.split('\n').length + (m.find.startsWith('\n') ? 1 : 0);
    const text = src.split('\n')[line - 1];
    return { line, column: text.length - text.trimStart().length };
}

let base = null;
const covCache = new Map();
/** gli scenari che eseguono quella riga di main */
function covering(scenarios, rel, line, column) {
    const out = [];
    for (const s of scenarios) {
        const raw = join(RAW, `${s.id}.json.gz`);
        if (!existsSync(raw)) continue;
        if (!covCache.has(s.id)) covCache.set(s.id, JSON.parse(gunzipSync(readFileSync(raw)).toString()));
        const cov = covCache.get(s.id);
        if (!base) {
            const bundle = join(REF_DIST, 'assets', cov.url.split('/assets/')[1]);
            base = new BundleIndex(readFileSync(bundle, 'utf8'), JSON.parse(readFileSync(`${bundle}.map`, 'utf8')), []);
        }
        const off = bundleOffset(base, rel, line, column);
        const n = off === null ? 0 : countAt(cov.functions, off);
        if (n > 0) out.push({ s, n });
    }
    return out;
}

const ref = JSON.parse(readFileSync(join(HERE, 'reference.json'), 'utf8'));
const all = await loadScenarios();
const list = MUTATIONS.filter((m) => !only || only.includes(m.id));
const rows = [];
prepareWorktree();
for (const m of list) {
    git('checkout', '--', '.');
    const { line, column } = apply(m);
    // metà i più corti, metà quelli che eseguono la riga più volte: un getter chiamato ovunque conta solo dove si combatte davvero
    const hits = covering(all, m.file, line, column);
    const frames = (s) => ref.scenarios[s.id]?.frames ?? 1e9;
    const short = [...hits].sort((a, b) => frames(a.s) - frames(b.s)).map((x) => x.s);
    const busy = [...hits].sort((a, b) => b.n - a.n || frames(a.s) - frames(b.s)).map((x) => x.s);
    const cands = [];
    for (let k = 0; cands.length < hits.length; k++) for (const s of [short[k], busy[k]]) if (s && !cands.includes(s)) cands.push(s);
    console.log(`\n${m.id} (${m.kind}) ${m.file}:${line}: ${cands.length} scenari la eseguono`);
    if (!cands.length) {
        rows.push({ m, line, verdict: 'non coperta', note: 'nessuno scenario esegue la riga' });
        continue;
    }
    execFileSync(join(HERE, 'build.sh'), [MUT]);
    let found = null;
    for (const s of cands.slice(0, per)) {
        const out = join(ROOT, '.harness/traces/mut', m.id, `${s.id}.jsonl.gz`);
        const r = await runScenario(s, { dist: join(MUT, 'dist-dev'), out });
        const want = ref.scenarios[s.id]?.strict;
        console.log(`  ${s.id}: ${r.strict === want ? 'uguale' : 'DIVERSO'}`);
        if (r.strict !== want) {
            const refTrace = join(ROOT, '.harness/traces/ref', `${s.id}.jsonl.gz`);
            const res = existsSync(refTrace) ? compare(readTrace(refTrace), readTrace(out)) : { report: ['(manca la traccia di riferimento)'] };
            found = { s, frame: res.frame, sections: res.sections ?? [], report: res.report.slice(0, 14) };
            break;
        }
    }
    if (found) {
        console.log(`  -> scoperta da ${found.s.id} al fotogramma ${found.frame} [${found.sections.join(',')}]`);
        console.log(found.report.map((l) => `     ${l}`).join('\n'));
        rows.push({ m, line, verdict: 'scoperta', note: `${found.s.id}, fotogramma ${found.frame}, sezioni ${found.sections.join(', ')}`, report: found.report });
    } else {
        rows.push({ m, line, verdict: 'SOPRAVVISSUTA', note: `eseguita da ${cands.length} scenari, provati ${Math.min(per, cands.length)}: nessuna differenza` });
    }
}
git('checkout', '--', '.');

const L = ['# mutazioni di prova', '', 'Generato da `scripts/harness/mutate.mjs`. Ogni mutazione toglie o cambia una riga di comportamento; gli strumenti devono accorgersene e indicare il punto giusto.', '', '| mutazione | tipo | riga | esito | dove |', '|---|---|---|---|---|'];
for (const r of rows) L.push(`| ${r.m.id} | ${r.m.kind} | ${r.m.file}:${r.line} | ${r.verdict} | ${r.note} |`);
for (const r of rows.filter((x) => x.report)) {
    L.push('', `## ${r.m.id}`, '', '```', ...r.report, '```');
}
mkdirSync(join(ROOT, 'docs/refactor'), { recursive: true });
writeFileSync(join(ROOT, 'docs/refactor/mutazioni.md'), `${L.join('\n')}\n`);
console.log(`\n${rows.filter((r) => r.verdict === 'scoperta').length}/${rows.length} scoperte -> docs/refactor/mutazioni.md`);
