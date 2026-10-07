// confronta due giri sugli esiti, non al bit: per i passi che cambiano di proposito l'ordine del caso
// (rng centralizzato, eventi riordinati) e quindi non possono dare tracce identiche.
// trama (livelli, dialoghi, scelte, boss, abilità, trofei, salvataggio finale, errori) deve coincidere;
// i numeri del combattimento (morti, nemici, barre, punteggi) si riportano con la differenza, da giudicare.
// uso: node scripts/harness/esiti.mjs [dirA] [dirB] [--only a,b] [--rumore dirSeed]   (default .harness/traces/ref e .harness/traces/cur)
//   --rumore: gli scenari la cui trama cambia già tra dirA e dirSeed (stesso codice, altro seed) sono sensibili al caso:
//   le loro differenze si riportano a parte, da giudicare; per tutti gli altri la trama deve coincidere
//      node scripts/harness/esiti.mjs a.jsonl.gz b.jsonl.gz
import { existsSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deepDiff, readTrace } from './tracediff.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const oi = args.indexOf('--only');
const only = oi >= 0 ? args[oi + 1].split(',') : null;
const ri = args.indexOf('--rumore');
const pos = args.filter((a, i) => !a.startsWith('--') && i !== oi + 1 && i !== ri + 1);
const A = resolve(ROOT, pos[0] ?? '.harness/traces/ref');
const B = resolve(ROOT, pos[1] ?? '.harness/traces/cur');
const NOISE = ri >= 0 ? resolve(ROOT, args[ri + 1]) : null;

/** gli esiti di una traccia */
export function outcomes(file) {
    const T = readTrace(file);
    const o = { livelli: [], dialoghi: [], scelte: [], boss: [], abilita: [], trofei: [], capitoli: [], toast: new Map(), errori: [], morti: 0, nemici: 0, punteggi: {}, save: null };
    let level;
    for (const s of T.samples) {
        const lv = s.D.meta?.data?.levelId ?? null;
        if (lv !== level) { o.livelli.push(lv); level = lv; }
        if (s.D.save) o.save = s.D.save;
        for (const [name, p] of s.D.ev ?? []) {
            if (name === 'dialogue-start') o.dialoghi.push(`${p.lines?.[0]?.speaker}: ${p.lines?.[0]?.text}`);
            else if (name === 'choice-show') o.scelte.push(p.title);
            else if (name === 'ability-unlocked') o.abilita.push(p.ability);
            else if (name === 'achievement') o.trofei.push(p.id);
            else if (name === 'chapter-score') { o.capitoli.push(p.id); o.punteggi[p.id] = p.score; }
            else if (name === 'toast') o.toast.set(p.text, (o.toast.get(p.text) ?? 0) + 1);
        }
        for (const [, name, a] of s.D.sev ?? []) {
            if (name === 'boss-defeated') o.boss.push(a?.[0]?.kind);
            else if (name === 'player-dead') o.morti++;
            else if (name === 'enemy-died') o.nemici++;
        }
        for (const [kind, msg] of s.D.con ?? []) if (kind === 'error' || kind === 'pageerror') o.errori.push(msg.join(' ').slice(0, 160));
    }
    o.fotogrammi = T.samples.length;
    o.fallimento = T.end?.failure ?? null;
    return o;
}

const setDiff = (a, b) => ({ via: [...new Set(a)].filter((x) => !b.includes(x)), nuovi: [...new Set(b)].filter((x) => !a.includes(x)) });
const SAVE_SETS = ['flags', 'abilities', 'seenDialogues', 'collectedLore', 'charms', 'equipped'];
// tempi, uccisioni, punteggi e abitudini lette dall'ombra seguono il combattimento, non la trama
const SAVE_NUMBERS = ['record', 'inventory', 'scores', 'runScores', 'chapterLog', 'chapterRun', 'ombra'];

/** le differenze di trama (devono essere zero) e quelle di numeri (da giudicare) */
export function compareOutcomes(a, b) {
    const trama = [];
    const numeri = [];
    const seq = (name) => {
        const x = a[name], y = b[name];
        if (JSON.stringify(x) === JSON.stringify(y)) return;
        const i = x.findIndex((v, k) => v !== y[k]);
        const at = i < 0 ? Math.min(x.length, y.length) : i;
        trama.push(`${name}: diversi dal n.${at + 1} (${x.length} contro ${y.length}): ${JSON.stringify(x[at] ?? '(fine)').slice(0, 100)} -> ${JSON.stringify(y[at] ?? '(fine)').slice(0, 100)}`);
    };
    for (const k of ['livelli', 'dialoghi', 'scelte', 'boss', 'abilita', 'capitoli']) seq(k);
    const t = setDiff(a.trofei, b.trofei);
    if (t.via.length || t.nuovi.length) trama.push(`trofei: persi ${JSON.stringify(t.via)}, nuovi ${JSON.stringify(t.nuovi)}`);
    const e = setDiff(a.errori, b.errori);
    if (e.nuovi.length) trama.push(`errori nuovi in console: ${e.nuovi.slice(0, 3).join(' | ')}`);
    if (a.fallimento !== b.fallimento) trama.push(`fallimento dello scenario: ${a.fallimento} -> ${b.fallimento}`);
    const sa = a.save ? JSON.parse(a.save) : {};
    const sb = b.save ? JSON.parse(b.save) : {};
    for (const k of new Set([...Object.keys(sa), ...Object.keys(sb)])) {
        const x = sa[k], y = sb[k];
        if (JSON.stringify(x) === JSON.stringify(y)) continue;
        if (SAVE_SETS.includes(k) && Array.isArray(x) && Array.isArray(y)) {
            const d = setDiff(x.map(String), y.map(String));
            if (d.via.length || d.nuovi.length) trama.push(`salvataggio.${k}: tolti ${JSON.stringify(d.via).slice(0, 160)}, aggiunti ${JSON.stringify(d.nuovi).slice(0, 160)}`);
        } else if (k === 'messages') {
            // l'ora di arrivo dipende dal tempo di gioco: conta chi scrive e cosa
            const m = (v) => (v ?? []).map((q) => `${q.sender}: ${q.text}`);
            if (JSON.stringify(m(x)) !== JSON.stringify(m(y))) trama.push(`salvataggio.messages: ${m(x).length} -> ${m(y).length} messaggi, diversi`);
        } else if (typeof x === 'number' && typeof y === 'number') numeri.push(`salvataggio.${k}: ${x} -> ${y}`);
        else if (SAVE_NUMBERS.includes(k)) {
            const d = deepDiff(x, y, k, [], 4).map((q) => `${q.path} ${JSON.stringify(q.a)} -> ${JSON.stringify(q.b)}`);
            numeri.push(`salvataggio.${d.join(', ')}`);
        } else trama.push(`salvataggio.${k}: ${JSON.stringify(x).slice(0, 120)} -> ${JSON.stringify(y).slice(0, 120)}`);
    }
    const num = (name, x, y) => { if (x !== y) numeri.push(`${name}: ${x} -> ${y}`); };
    num('morti', a.morti, b.morti);
    num('nemici uccisi', a.nemici, b.nemici);
    num('fotogrammi', a.fotogrammi, b.fotogrammi);
    for (const id of Object.keys(a.punteggi)) num(`punteggio ${id}`, a.punteggi[id], b.punteggi[id]);
    const toasts = new Set([...a.toast.keys(), ...b.toast.keys()]);
    const tt = [...toasts].filter((k) => (a.toast.get(k) ?? 0) !== (b.toast.get(k) ?? 0));
    if (tt.length) numeri.push(`toast con conteggi diversi: ${tt.slice(0, 4).map((k) => `"${k.slice(0, 40)}" ${a.toast.get(k) ?? 0}->${b.toast.get(k) ?? 0}`).join(', ')}${tt.length > 4 ? ` (+${tt.length - 4})` : ''}`);
    return { trama, numeri };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const pairs = [];
    if (statSync(A).isFile()) pairs.push([basename(A).replace('.jsonl.gz', ''), A, B]);
    else {
        for (const f of readdirSync(A).filter((x) => x.endsWith('.jsonl.gz')).sort()) {
            const id = f.replace('.jsonl.gz', '');
            if (only && !only.some((o) => id === o || id.startsWith(o))) continue;
            pairs.push([id, join(A, f), join(B, f)]);
        }
    }
    const L = [];
    let bad = 0, judge = 0, same = 0, miss = 0, noisy = 0;
    for (const [id, fa, fb] of pairs) {
        if (!existsSync(fb)) { miss++; continue; }
        const oa = outcomes(fa);
        const { trama, numeri } = compareOutcomes(oa, outcomes(fb));
        const fn = NOISE && join(NOISE, basename(fa));
        if (trama.length && fn && existsSync(fn) && compareOutcomes(oa, outcomes(fn)).trama.length) {
            noisy++;
            L.push(`${id}: trama diversa, ma sensibile al caso (cambia anche con l'altro seed): da giudicare`, ...trama.map((x) => `    ${x}`));
        } else if (trama.length) {
            bad++;
            L.push(`${id}: TRAMA DIVERSA`, ...trama.map((x) => `    ${x}`), ...numeri.map((x) => `    (numeri) ${x}`));
        } else if (numeri.length) {
            judge++;
            L.push(`${id}: stessa trama, numeri diversi`, ...numeri.map((x) => `    ${x}`));
        } else same++;
    }
    L.push('', `${pairs.length - miss} confrontati: ${same} uguali negli esiti, ${judge} con numeri diversi da giudicare, ${noisy ? `${noisy} sensibili al caso con la trama diversa (da giudicare), ` : ''}${bad} con la trama diversa${miss ? `, ${miss} senza la seconda traccia` : ''}`);
    const out = L.join('\n');
    console.log(out);
    writeFileSync(join(ROOT, '.harness/report-esiti.txt'), `${out}\n`);
    process.exit(bad ? 1 : 0);
}
