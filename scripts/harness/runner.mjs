// esegue uno scenario nel gioco vero e ne registra la traccia: un'impronta dello stato osservabile a ogni fotogramma.
import { createHash } from 'node:crypto';
import { createWriteStream, mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { createGzip, gzipSync } from 'node:zlib';
import { launch, openGame, startLevel } from './game.mjs';

/** le sezioni che devono coincidere al bit; diag dice solo "guarda qui" */
/** sezioni di stato: nella traccia si scrivono solo quando cambiano (chi legge le porta avanti) */
export const CARRY = ['meta', 'cam', 'pl', 'boss', 'st', 'vol', 'au', 'diag', 'counts'];
export const STRICT = ['meta', 'pl', 'boss', 'ent', 'dl', 'dlo', 'bod', 'lit', 'cam', 'st', 'vol', 'save', 'ui', 'au', 'ev', 'sev', 'sfx', 'mus', 'store', 'con'];

/**
 * il contesto che lo scenario usa per giocare. ogni azione accade tra due fotogrammi,
 * quindi a un numero di frame preciso: è questo che rende la partita ripetibile.
 */
function makeCtx(game, sink, opts) {
    const { page } = game;
    let f = 0;
    const fullAt = new Set(opts.fullAt ?? []);
    const advance = async (n, predSrc = null, every = 1) => {
        const res = await page.evaluate(async ({ n, f0, every, sampleEvery, fullAt, fullAll, predSrc }) => {
            const H = window.__h;
            // i predicati vengono dai nostri scenari: eval nella pagina di test è voluto
            const pred = predSrc ? (0, eval)(predSrc) : null;
            const out = [];
            const full = new Set(fullAt);
            let f = f0;
            let hit = false;
            for (let i = 0; i < n; i++) {
                await H.stepOne();
                f++;
                if (f % sampleEvery === 0 || full.has(f) || fullAll) out.push(H.sample(f, fullAll || full.has(f)));
                if (pred && i % every === every - 1) {
                    let ok = false;
                    try { ok = !!pred(); } catch { ok = false; }
                    if (ok) { hit = true; break; }
                }
            }
            return { f, out, hit };
        }, { n, f0: f, every, sampleEvery: opts.sampleEvery ?? 1, fullAt: [...fullAt].filter((x) => x > f && x <= f + n), fullAll: !!opts.fullAll, predSrc });
        f = res.f;
        for (const s of res.out) sink.sample(s);
        return res.hit;
    };
    const ctx = {
        page,
        get f() { return f; },
        /** avanza n fotogrammi, a blocchi per non accumulare troppo in memoria */
        async wait(n) {
            while (n > 0) {
                const k = Math.min(n, 240);
                await advance(k);
                n -= k;
            }
        },
        /** avanza finché il predicato (una funzione valutata nella pagina) è vero; ritorna false a tempo scaduto */
        async until(pred, max = 600, every = 1) {
            const src = typeof pred === 'function' ? `(${pred.toString()})` : `(() => (${pred}))`;
            let left = max;
            while (left > 0) {
                const k = Math.min(left, 240);
                if (await advance(k, src, every)) return true;
                left -= k;
            }
            return false;
        },
        async down(code) { await page.keyboard.down(code); },
        async up(code) { await page.keyboard.up(code); },
        /** premi e rilascia dopo `frames` fotogrammi */
        async tap(code, frames = 4) {
            await page.keyboard.down(code);
            await ctx.wait(frames);
            await page.keyboard.up(code);
        },
        /** tieni premuti più tasti per `frames` fotogrammi */
        async hold(codes, frames) {
            for (const c of codes) await page.keyboard.down(c);
            await ctx.wait(frames);
            for (const c of [...codes].reverse()) await page.keyboard.up(c);
        },
        async eval(fn, arg) { return page.evaluate(fn, arg); },
        mark(label) { sink.mark(f, label); },
        /** un nastro di tasti: [frame, codice, 'down'|'up'], frame relativi a ora */
        async tape(events, tail = 0) {
            const t0 = f;
            const sorted = [...events].sort((a, b) => a[0] - b[0]);
            for (const [at, code, how] of sorted) {
                if (t0 + at > f) await ctx.wait(t0 + at - f);
                await (how === 'up' ? page.keyboard.up(code) : page.keyboard.down(code));
            }
            if (tail) await ctx.wait(tail);
        },
    };
    return ctx;
}

class Trace {
    constructor(meta, out) {
        this.strict = createHash('sha1');
        this.diag = createHash('sha1');
        this.frames = 0;
        this.prev = {};
        this.gz = null;
        this.done = null;
        if (out) {
            mkdirSync(dirname(out), { recursive: true });
            this.gz = createGzip();
            const file = createWriteStream(out);
            this.gz.pipe(file);
            this.done = new Promise((res, rej) => { file.on('finish', res); file.on('error', rej); });
        }
        this.write({ meta });
    }
    write(obj) {
        this.gz?.write(`${JSON.stringify(obj)}\n`);
    }
    sample(s) {
        this.frames++;
        const h = STRICT.map((k) => s.H[k] ?? '-').join(',');
        this.strict.update(`${s.f}:${h}\n`);
        this.diag.update(`${s.f}:${s.H.diag}\n`);
        // le sezioni di stato uguali al fotogramma prima non si ripetono: la traccia resta piccola
        const keep = s.D.full !== undefined;
        for (const k of CARRY) {
            const hk = k === 'counts' ? JSON.stringify(s.D.counts) : s.H[k];
            if (!keep && this.prev[k] === hk) delete s.D[k];
            this.prev[k] = hk;
        }
        this.write(s);
    }
    mark(f, label) {
        this.write({ f, mark: label });
        this.strict.update(`${f}#${label}\n`);
    }
    async finish(extra) {
        this.write({ end: extra });
        if (this.gz) {
            this.gz.end();
            await this.done;
        }
        return { strict: this.strict.digest('hex').slice(0, 16), diag: this.diag.digest('hex').slice(0, 16), frames: this.frames };
    }
}

/**
 * scenario: { id, level, checkpoint?, seed?, prepare?(arg) (nella pagina, prima del livello), prepareArg?, run(ctx) }
 * opts: { dist, out (file .jsonl.gz), sampleEvery, fullAt: [frame], fullAll }
 */
export async function runScenario(scn, opts = {}) {
    const browser = await launch();
    const t0 = Date.now();
    try {
        const game = await openGame(browser, { dist: opts.dist, coverage: !!opts.coverage, storage: scn.storage ?? null, ...(scn.viewport ? { viewport: scn.viewport } : {}) });
        const bundle = await game.page.evaluate(() => [...document.scripts].map((s) => s.src).find((s) => s.includes('/assets/')) ?? null);
        const trace = new Trace({ id: scn.id, level: scn.level, dist: opts.dist ?? process.env.DIST ?? 'dist-dev', bundle, boot: game.bootFrame }, opts.out);
        await startLevel(game, scn.level, { seed: scn.seed ?? 12345, checkpointId: scn.checkpoint ?? null, prepare: scn.prepare ?? null, prepareArg: scn.prepareArg ?? null });
        // la prima impronta porta salvataggio e ui per intero: la traccia si legge da sola
        await game.page.evaluate(() => { window.__h.prevSave = ''; window.__h.prevUi = ''; window.__h.uiDirty = true; });
        const ctx = makeCtx(game, trace, opts);
        let failure = null;
        try {
            await scn.run(ctx);
        } catch (e) {
            failure = String(e?.stack ?? e);
        }
        // l'ultimo fotogramma sempre per intero: il confronto finale non dipende dal campionamento
        const last = await game.page.evaluate(async (f) => { await window.__h.stepOne(); return window.__h.sample(f + 1, true); }, ctx.f);
        trace.sample(last);
        const summary = await trace.finish({ failure, errors: game.errors, ms: Date.now() - t0 });
        if (opts.coverage) {
            const cov = await game.page.coverage.stopJSCoverage();
            const js = cov.find((c) => c.url.includes('/assets/'));
            mkdirSync(dirname(opts.coverage), { recursive: true });
            writeFileSync(opts.coverage, gzipSync(JSON.stringify({ url: js?.url ?? null, functions: js?.functions ?? [] })));
        }
        return { id: scn.id, ...summary, failure, errors: game.errors, ms: Date.now() - t0 };
    } finally {
        await browser.close();
    }
}
