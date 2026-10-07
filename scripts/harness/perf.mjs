// prestazioni in tempo reale: niente orologio finto (sotto l'orologio finto i tempi non sono veri).
// gli stessi scenari del corpus, con il loop di phaser libero sul requestAnimationFrame vero.
// misura nella pagina il tempo di update e di render di ogni fotogramma, le metriche cdp e un profilo cpu
// riportato ai file .ts. uso:
//   node scripts/harness/perf.mjs [--only a,b] [--runs 3] [--dist dir] [--save base|cand] [--profile] [--vs base]
//   --vs base: alla fine confronta scenario per scenario con perf-base.json
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { SourceMapConsumer } from 'source-map-js';
import { launch } from './game.mjs';
import { loadScenarios } from './corpus.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');
const args = process.argv.slice(2);
const opt = (name, def = null) => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 ? args[i + 1] : def;
};
const DIST = resolve(ROOT, opt('dist', process.env.DIST ?? 'dist-dev'));
const runs = Number(opt('runs', '3'));
const only = opt('only')?.split(',') ?? ['livello-perduta', 'livello-bus', 'livello-tana', 'livello-void', 'nastro-perduta', 'nastro-stabilimento', 'nastro-cantina', 'esplora-perduta', 'cap-bus', 'wave-rio'];
const save = opt('save');
const vs = opt('vs');
const profile = args.includes('--profile');
const ORIGIN = 'http://gecowave.test';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };

/** il contesto degli scenari, ma in tempo reale: aspettare n fotogrammi vuol dire n requestAnimationFrame veri */
function realCtx(page) {
    let f = 0;
    const frames = (n) => page.evaluate((n) => new Promise((res) => {
        let k = 0;
        const tick = () => (++k >= n ? res() : requestAnimationFrame(tick));
        requestAnimationFrame(tick);
    }), n);
    const ctx = {
        page,
        get f() { return f; },
        async wait(n) { await frames(n); f += n; },
        async until(pred, max = 600, every = 1) {
            const src = typeof pred === 'function' ? `(${pred.toString()})` : `(() => (${pred}))`;
            for (let k = 0; k < max; k += every) {
                // i predicati vengono dai nostri scenari: eval nella pagina di test è voluto
                if (await page.evaluate((src) => { try { return !!(0, eval)(src)(); } catch { return false; } }, src)) return true;
                await ctx.wait(every);
            }
            return false;
        },
        async down(code) { await page.keyboard.down(code); },
        async up(code) { await page.keyboard.up(code); },
        async tap(code, n = 4) { await page.keyboard.down(code); await ctx.wait(n); await page.keyboard.up(code); },
        async hold(codes, n) { for (const c of codes) await page.keyboard.down(c); await ctx.wait(n); for (const c of [...codes].reverse()) await page.keyboard.up(c); },
        async eval(fn, arg) { return page.evaluate(fn, arg); },
        mark() {},
        async tape(events, tail = 0) {
            const t0 = f;
            for (const [at, code, how] of [...events].sort((a, b) => a[0] - b[0])) {
                if (t0 + at > f) await ctx.wait(t0 + at - f);
                await (how === 'up' ? page.keyboard.up(code) : page.keyboard.down(code));
            }
            if (tail) await ctx.wait(tail);
        },
    };
    return ctx;
}

const PROBE = readFileSync(join(HERE, 'probe.js'), 'utf8');

async function once(scn) {
    const browser = await launch();
    try {
        const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
        await page.route(`${ORIGIN}/**`, async (route) => {
            let p = decodeURIComponent(new URL(route.request().url()).pathname);
            if (p === '/') p = '/index.html';
            try { await route.fulfill({ body: await readFile(join(DIST, p)), contentType: TYPES[extname(p)] }); } catch { await route.fulfill({ status: 404, body: '' }); }
        });
        await page.addInitScript(() => {
            localStorage.clear();
            let s = 1;
            window.__seed = (v) => { s = v >>> 0; };
            Math.random = () => {
                s = (s + 0x6d2b79f5) | 0;
                let t = Math.imul(s ^ (s >>> 15), 1 | s);
                t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
                return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
            };
        });
        // la sonda serve solo per gli strumenti del bot: niente agganci né campionamento
        await page.addInitScript(() => { window.__hPerf = true; });
        await page.addInitScript(PROBE);
        await page.goto(`${ORIGIN}/`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await page.waitForFunction(() => !!window.__startLevel && !!window.__game?.scene?.isActive('MenuScene'), null, { timeout: 120000 });
        await page.keyboard.press('ShiftLeft');
        await page.waitForTimeout(500);
        if (scn.prepare) await page.evaluate(scn.prepare, scn.prepareArg ?? null);
        // i tempi di update e render di ogni passo del gioco, misurati dentro la pagina
        await page.evaluate(() => {
            const g = window.__game;
            const T = (window.__perf = { up: [], re: [], on: false });
            const su = g.scene.update.bind(g.scene);
            const sr = g.scene.render.bind(g.scene);
            g.scene.update = (t, d) => { const a = performance.now(); su(t, d); if (T.on) T.up.push(performance.now() - a); };
            g.scene.render = (r) => { const a = performance.now(); sr(r); if (T.on) T.re.push(performance.now() - a); };
        });
        const tStart = Date.now();
        await page.evaluate(({ level, seed, checkpoint }) => { window.__seed(seed); if (level) window.__startLevel(level, checkpoint); }, { level: scn.level, seed: scn.seed ?? 12345, checkpoint: scn.checkpoint ?? null });
        // l'avvio del livello (costruzione della regione) si misura a parte: non è un fotogramma di gioco
        if (scn.level) await page.waitForFunction(() => !!window.__h.find.player(), null, { timeout: 120000 });
        const startMs = Date.now() - tStart;
        const cdp = await page.context().newCDPSession(page);
        await cdp.send('Performance.enable');
        if (profile) { await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 }); await cdp.send('Profiler.start'); }
        const m0 = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
        await page.evaluate(() => { window.__perf.on = true; });
        const t0 = Date.now();
        let failure = null;
        try { await scn.run(realCtx(page)); } catch (e) { failure = String(e).split('\n')[0]; }
        const wall = Date.now() - t0;
        await page.evaluate(() => { window.__perf.on = false; });
        const m1 = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
        const prof = profile ? (await cdp.send('Profiler.stop')).profile : null;
        const T = await page.evaluate(() => window.__perf);
        return { T, wall, startMs, failure, prof, cdp: { script: m1.ScriptDuration - m0.ScriptDuration, task: m1.TaskDuration - m0.TaskDuration, layout: m1.LayoutDuration - m0.LayoutDuration, style: m1.RecalcStyleDuration - m0.RecalcStyleDuration, heap: m1.JSHeapUsedSize } };
    } finally {
        await browser.close();
    }
}

const stats = (a) => {
    if (!a.length) return { n: 0, mean: 0, p95: 0, p99: 0, max: 0 };
    const s = [...a].sort((x, y) => x - y);
    const q = (p) => s[Math.min(s.length - 1, Math.floor(p * s.length))];
    return { n: s.length, mean: s.reduce((x, y) => x + y, 0) / s.length, p95: q(0.95), p99: q(0.99), max: s[s.length - 1] };
};
const med = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

/** il profilo cpu riportato a file e funzione .ts: dove si spende */
function hotspots(profiles) {
    const bundle = join(DIST, 'assets');
    const files = existsSync(bundle) ? readdirSync(bundle) : [];
    const mapFile = files.find((f) => f.endsWith('.js.map'));
    const consumer = mapFile ? new SourceMapConsumer(JSON.parse(readFileSync(join(bundle, mapFile), 'utf8'))) : null;
    const byFile = new Map();
    const byFn = new Map();
    let total = 0;
    for (const p of profiles) {
        const self = new Map();
        const dt = p.timeDeltas;
        p.samples.forEach((id, i) => self.set(id, (self.get(id) ?? 0) + (dt[i] ?? 0)));
        for (const n of p.nodes) {
            const us = self.get(n.id) ?? 0;
            if (!us) continue;
            total += us;
            const cf = n.callFrame;
            let file = cf.url ? (cf.url.includes('/assets/') ? 'bundle' : cf.url) : `(${cf.functionName || 'nativo'})`;
            let fn = cf.functionName || '(anonima)';
            if (file === 'bundle' && consumer) {
                const o = consumer.originalPositionFor({ line: cf.lineNumber + 1, column: cf.columnNumber });
                if (o.source) {
                    const i = o.source.lastIndexOf('/src/');
                    const j = o.source.lastIndexOf('/node_modules/');
                    file = i >= 0 ? o.source.slice(i + 1) : j >= 0 ? o.source.slice(j + 1).split('/').slice(0, 3).join('/') : o.source;
                    fn = `${fn}:${o.line}`;
                }
            }
            byFile.set(file, (byFile.get(file) ?? 0) + us);
            byFn.set(`${file} ${fn}`, (byFn.get(`${file} ${fn}`) ?? 0) + us);
        }
    }
    const top = (m, n) => [...m].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => [k, (100 * v / total).toFixed(1)]);
    return { files: top(byFile, 25), fns: top(byFn, 40) };
}

const all = await loadScenarios();
const list = all.filter((s) => only.some((o) => s.id === o));
const rows = [];
const profiles = [];
for (const s of list) {
    const res = [];
    for (let k = 0; k < runs; k++) {
        const r = await once(s);
        res.push(r);
        if (r.prof) profiles.push(r.prof);
    }
    const up = res.map((r) => stats(r.T.up));
    const re = res.map((r) => stats(r.T.re));
    const step = res.map((r) => stats(r.T.up.map((u, i) => u + (r.T.re[i] ?? 0))));
    const long = res.map((r) => r.T.up.filter((u, i) => u + (r.T.re[i] ?? 0) > 16.7).length);
    const row = {
        id: s.id, frames: med(up.map((x) => x.n)),
        update: { mean: med(up.map((x) => x.mean)), p95: med(up.map((x) => x.p95)), p99: med(up.map((x) => x.p99)), max: med(up.map((x) => x.max)) },
        render: { mean: med(re.map((x) => x.mean)), p95: med(re.map((x) => x.p95)), max: med(re.map((x) => x.max)) },
        step: { mean: med(step.map((x) => x.mean)), p95: med(step.map((x) => x.p95)), p99: med(step.map((x) => x.p99)) },
        long: med(long),
        startMs: med(res.map((r) => r.startMs)),
        script: med(res.map((r) => r.cdp.script)) * 1000, layout: med(res.map((r) => r.cdp.layout)) * 1000, style: med(res.map((r) => r.cdp.style)) * 1000,
        heapMB: med(res.map((r) => r.cdp.heap)) / 1e6,
        failure: res.find((r) => r.failure)?.failure ?? null,
    };
    rows.push(row);
    const f = (x) => x.toFixed(2);
    console.log(`${s.id.padEnd(24)} ${String(row.frames).padStart(5)} fr  update ${f(row.update.mean)} p95 ${f(row.update.p95)} max ${f(row.update.max)}  render ${f(row.render.mean)} p95 ${f(row.render.p95)}  >16.7ms ${row.long}  avvio ${row.startMs}ms  heap ${row.heapMB.toFixed(0)}MB${row.failure ? `  (${row.failure})` : ''}`);
}
if (save) {
    const out = join(HERE, `perf-${save}.json`);
    writeFileSync(out, `${JSON.stringify({ dist: relative(ROOT, DIST), runs, at: new Date().toISOString(), rows }, null, 1)}\n`);
    console.log(`-> ${relative(ROOT, out)}`);
}
if (vs) {
    const base = JSON.parse(readFileSync(join(HERE, `perf-${vs}.json`), 'utf8'));
    const by = new Map(base.rows.map((r) => [r.id, r]));
    const d = (a, b) => `${a.toFixed(2)} (${b ? `${a >= b ? '+' : ''}${((100 * (a - b)) / b).toFixed(0)}%` : 'n/d'})`;
    console.log(`\ncontro perf-${vs}.json (${base.at}), tra parentesi la differenza:`);
    for (const r of rows) {
        const b = by.get(r.id);
        if (!b) { console.log(`  ${r.id.padEnd(24)} (non c'è nella base)`); continue; }
        console.log(`  ${r.id.padEnd(24)} update ${d(r.update.mean, b.update.mean)} p95 ${d(r.update.p95, b.update.p95)}  render ${d(r.render.mean, b.render.mean)}  >16.7ms ${r.long} (base ${b.long})  avvio ${r.startMs}ms (base ${b.startMs}ms)  heap ${r.heapMB.toFixed(0)}MB (base ${b.heapMB.toFixed(0)}MB)`);
    }
}
if (profiles.length) {
    const h = hotspots(profiles);
    mkdirSync(join(ROOT, '.harness'), { recursive: true });
    writeFileSync(join(ROOT, '.harness/perf-hotspots.json'), JSON.stringify(h, null, 1));
    console.log('\ndove si spende (tempo cpu proprio, % del totale campionato):');
    for (const [k, v] of h.files) console.log(`  ${v.padStart(5)}%  ${k}`);
    console.log('\nfunzioni:');
    for (const [k, v] of h.fns.slice(0, 25)) console.log(`  ${v.padStart(5)}%  ${k}`);
}
