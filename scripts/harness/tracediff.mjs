// confronta due tracce: il primo fotogramma in cui divergono, quale campo, prima e dopo, e chi l'ha causato.
// uso: node scripts/harness/tracediff.mjs <riferimento.jsonl.gz> <candidata.jsonl.gz>
import { existsSync, readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SourceMapConsumer } from 'source-map-js';
import { STRICT } from './runner.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

export function readTrace(file) {
    const lines = gunzipSync(readFileSync(file)).toString().split('\n').filter(Boolean).map((l) => JSON.parse(l));
    const meta = lines[0].meta;
    const samples = [];
    const marks = [];
    let end = null;
    for (const l of lines.slice(1)) {
        if (l.mark !== undefined) marks.push(l);
        else if (l.end !== undefined) end = l.end;
        else samples.push(l);
    }
    return { meta, samples, marks, end };
}

/** le differenze foglia tra due valori json, con il percorso */
export function deepDiff(a, b, path = '', out = [], max = 25) {
    if (out.length >= max) return out;
    if (a === b) return out;
    const ta = a === null ? 'null' : Array.isArray(a) ? 'array' : typeof a;
    const tb = b === null ? 'null' : Array.isArray(b) ? 'array' : typeof b;
    if (ta !== tb || (ta !== 'object' && ta !== 'array')) {
        out.push({ path: path || '.', a, b });
        return out;
    }
    if (ta === 'array') {
        const n = Math.max(a.length, b.length);
        for (let i = 0; i < n && out.length < max; i++) {
            if (i >= a.length) out.push({ path: `${path}[${i}]`, a: '(assente)', b: b[i] });
            else if (i >= b.length) out.push({ path: `${path}[${i}]`, a: a[i], b: '(assente)' });
            else deepDiff(a[i], b[i], `${path}[${i}]`, out, max);
        }
        return out;
    }
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
        if (out.length >= max) break;
        if (!(k in a)) out.push({ path: `${path}.${k}`, a: '(assente)', b: b[k] });
        else if (!(k in b)) out.push({ path: `${path}.${k}`, a: a[k], b: '(assente)' });
        else deepDiff(a[k], b[k], `${path}.${k}`, out, max);
    }
    return out;
}

/** multiinsiemi di righe: cosa c'è in più e cosa manca */
function setDiff(a, b, max = 12) {
    const count = (arr) => arr.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map());
    const ca = count(a);
    const cb = count(b);
    const onlyA = [];
    const onlyB = [];
    for (const [k, n] of ca) for (let i = (cb.get(k) ?? 0); i < n; i++) onlyA.push(k);
    for (const [k, n] of cb) for (let i = (ca.get(k) ?? 0); i < n; i++) onlyB.push(k);
    return { onlyA: onlyA.slice(0, max), onlyB: onlyB.slice(0, max), nA: onlyA.length, nB: onlyB.length };
}

/** ricostruisce i campi che la traccia scrive solo quando cambiano */
function stateAt(samples, idx, key) {
    for (let i = idx; i >= 0; i--) if (samples[i].D[key] !== undefined) return samples[i].D[key];
    return null;
}

const SECTION_HELP = {
    meta: 'scene attive, tempo di scena, dati del livello',
    pl: 'il geco (tutti i suoi campi e il corpo fisico)',
    boss: 'il boss (tutti i suoi campi)',
    ent: 'le entità del gioco (classi: nemici, nidi, clone, compagni...)',
    dl: 'la display list come multiinsieme: un oggetto grafico in più, in meno o diverso',
    dlo: 'l\'ordine di disegno a parità di profondità',
    bod: 'i corpi fisici',
    lit: 'le luci 2d',
    cam: 'la camera e i suoi effetti',
    st: 'stato di run (vita, flow, malus), godMode, barre lasciate, impostazioni',
    vol: 'tempo di gioco e doomsday nel salvataggio',
    save: 'il salvataggio',
    ui: 'il dom della ui',
    au: 'musica e acustica',
    ev: 'eventi del bus',
    sev: 'eventi di scena',
    sfx: 'effetti sonori',
    mus: 'chiamate a musica e acustica',
    store: 'scritture su localStorage',
    con: 'errori e avvisi in console',
};

class SiteMapper {
    constructor(meta) {
        this.consumer = null;
        const dist = meta.dist;
        const file = meta.bundle ? meta.bundle.split('/assets/')[1] : null;
        if (!dist || !file) return;
        const map = join(resolve(ROOT, dist), 'assets', `${file}.map`);
        if (!existsSync(map)) return;
        this.consumer = new SourceMapConsumer(JSON.parse(readFileSync(map, 'utf8')));
        this.base = dirname(map);
    }
    /** "riga:colonna" del bundle -> file.ts:riga (funzione) */
    map(site) {
        if (!site || !this.consumer) return site;
        const [line, column] = site.split(':').map(Number);
        const p = this.consumer.originalPositionFor({ line, column: column - 1 });
        if (!p.source) return site;
        const abs = resolve(this.base, p.source);
        const rel = relative(ROOT, abs).replace(/^\.\.\/gecowave-main\//, '');
        return `${rel}:${p.line}${enclosing(abs, p.line)}`;
    }
}

const srcCache = new Map();
/** il metodo che contiene la riga, cercando all'indietro una firma */
function enclosing(abs, line) {
    if (!existsSync(abs)) return '';
    if (!srcCache.has(abs)) srcCache.set(abs, readFileSync(abs, 'utf8').split('\n'));
    const lines = srcCache.get(abs);
    for (let i = line - 1; i >= 0; i--) {
        const m = /^\s{4}(?:private |public |protected |static |async |get |set )*([a-zA-Z_$][\w$]*)\s*(?:<[^>]*>)?\(.*\)\s*(?::[^{]*)?\{\s*$/.exec(lines[i]);
        if (m && !['if', 'for', 'while', 'switch', 'catch'].includes(m[1])) return ` (${m[1]})`;
    }
    return '';
}

const show = (v) => {
    const s = typeof v === 'string' ? v : JSON.stringify(v);
    return s && s.length > 220 ? `${s.slice(0, 220)}…` : s;
};

/** le righe della ui serializzata attorno alla prima differenza */
function uiDiff(a, b) {
    const ta = (a ?? '').split('<');
    const tb = (b ?? '').split('<');
    let i = 0;
    while (i < ta.length && i < tb.length && ta[i] === tb[i]) i++;
    const ctx = (arr) => arr.slice(Math.max(0, i - 2), i + 3).map((x) => `<${x}`).join('');
    return { at: i, a: ctx(ta), b: ctx(tb) };
}

/**
 * confronta: ritorna un resoconto leggibile e la struttura della prima divergenza.
 * opts.full: tracce con impronte complete ai fotogrammi indicati (per i dettagli di dl, ent, bod, lit)
 */
export function compare(A, B) {
    const report = [];
    const byF = new Map(B.samples.map((s, i) => [s.f, i]));
    const mapA = new SiteMapper(A.meta);
    const mapB = new SiteMapper(B.meta);
    let firstDiag = null;
    for (let ia = 0; ia < A.samples.length; ia++) {
        const sa = A.samples[ia];
        const ib = byF.get(sa.f);
        if (ib === undefined) {
            report.push(`la candidata non ha il fotogramma ${sa.f} (finisce al ${B.samples.at(-1)?.f})`);
            return { same: false, frame: sa.f, report };
        }
        const sb = B.samples[ib];
        if (!firstDiag && sa.H.diag !== sb.H.diag) firstDiag = { f: sa.f, a: sa.D.diag, b: sb.D.diag };
        const bad = STRICT.filter((k) => sa.H[k] !== sb.H[k]);
        if (!bad.length) continue;
        report.push(`PRIMA DIVERGENZA al fotogramma ${sa.f} (tempo di scena ${JSON.stringify(sa.D.meta?.time)})`);
        report.push(`sezioni diverse: ${bad.join(', ')}`);
        for (const k of bad) {
            report.push(`\n[${k}] ${SECTION_HELP[k] ?? ''}`);
            if (k === 'save') {
                const ja = JSON.parse(stateAt(A.samples, ia, 'save') ?? 'null');
                const jb = JSON.parse(stateAt(B.samples, ib, 'save') ?? 'null');
                for (const d of deepDiff(ja, jb)) report.push(`  ${d.path}: ${show(d.a)}  ->  ${show(d.b)}`);
            } else if (k === 'ui') {
                const u = uiDiff(stateAt(A.samples, ia, 'ui'), stateAt(B.samples, ib, 'ui'));
                report.push(`  riferimento: ${show(u.a)}`);
                report.push(`  candidata:   ${show(u.b)}`);
            } else if (['dl', 'dlo', 'ent', 'bod', 'lit'].includes(k)) {
                const key = k === 'dlo' ? 'dl' : k;
                const fa = sa.D.full?.[key];
                const fb = sb.D.full?.[key];
                report.push(`  conteggi: ${show(sa.D.counts)} -> ${show(sb.D.counts)}`);
                if (!fa || !fb) {
                    report.push('  (servono le impronte complete di questo fotogramma: rilancia con --full)');
                } else if (k === 'dlo') {
                    let i = 0;
                    while (i < fa.length && fa[i] === fb[i]) i++;
                    report.push(`  ordine diverso dalla posizione ${i}:`);
                    report.push(`  riferimento: ${fa.slice(i, i + 3).map(show).join(' | ')}`);
                    report.push(`  candidata:   ${fb.slice(i, i + 3).map(show).join(' | ')}`);
                } else {
                    const toLines = (arr) => arr.map((x) => (typeof x === 'string' ? x : JSON.stringify(x)));
                    const d = setDiff(toLines(fa), toLines(fb));
                    report.push(`  solo nel riferimento (${d.nA}):`);
                    for (const x of d.onlyA) report.push(`    - ${show(x)}`);
                    report.push(`  solo nella candidata (${d.nB}):`);
                    for (const x of d.onlyB) report.push(`    + ${show(x)}`);
                    if (k === 'ent' && d.onlyA.length && d.onlyB.length) {
                        for (const x of deepDiff(JSON.parse(d.onlyA[0]), JSON.parse(d.onlyB[0]))) report.push(`    campo ${x.path}: ${show(x.a)} -> ${show(x.b)}`);
                    }
                }
            } else {
                const da = sa.D[k] ?? null;
                const db = sb.D[k] ?? null;
                for (const d of deepDiff(da, db)) report.push(`  ${d.path}: ${show(d.a)}  ->  ${show(d.b)}`);
                // chi l'ha fatto: le righe di codice che hanno emesso eventi o suoni in questo fotogramma
                if (['ev', 'sev', 'sfx', 'mus'].includes(k)) {
                    const siteA = (sa.sites?.[k] ?? []).map((s) => mapA.map(s));
                    const siteB = (sb.sites?.[k] ?? []).map((s) => mapB.map(s));
                    if (siteA.length) report.push(`  emessi nel riferimento da: ${[...new Set(siteA)].join(', ')}`);
                    if (siteB.length) report.push(`  emessi nella candidata da: ${[...new Set(siteB)].join(', ')}`);
                }
            }
        }
        // il contesto: cosa è successo poco prima, uguale in entrambe
        const recent = [];
        for (let j = Math.max(0, ia - 30); j < ia; j++) {
            const s = A.samples[j];
            for (const [name, payload] of s.D.ev ?? []) if (name !== 'wave-cooldowns') recent.push(`${s.f} ${name} ${show(payload)}`);
            for (const [sc, name] of s.D.sev ?? []) recent.push(`${s.f} ${sc}:${name}`);
        }
        if (recent.length) report.push(`\nultimi eventi prima (riferimento):\n  ${recent.slice(-10).join('\n  ')}`);
        if (firstDiag && firstDiag.f < sa.f) report.push(`\nla diagnostica divergeva già al fotogramma ${firstDiag.f}: ${show(deepDiff(firstDiag.a, firstDiag.b))}`);
        return { same: false, frame: sa.f, sections: bad, report };
    }
    if (B.samples.length > A.samples.length) report.push(`la candidata ha ${B.samples.length - A.samples.length} fotogrammi in più`);
    if (firstDiag) report.push(`strette uguali; la diagnostica diverge al fotogramma ${firstDiag.f}: ${show(deepDiff(firstDiag.a, firstDiag.b))}`);
    return { same: B.samples.length === A.samples.length, report };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const [a, b] = process.argv.slice(2);
    const res = compare(readTrace(a), readTrace(b));
    console.log(res.same ? 'IDENTICHE' : res.report.join('\n'));
    process.exit(res.same ? 0 : 1);
}
