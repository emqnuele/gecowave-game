// avvio deterministico del gioco in chromium headless: build servita da disco, orologio finto, random con seed.
// prima: scripts/harness/build.sh   (servono gli hook window.__*)
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { join, extname, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const HERE = dirname(fileURLToPath(import.meta.url));
const PROBE = readFileSync(join(HERE, 'probe.js'), 'utf8');

export const FRAME = 1000 / 60;
const ORIGIN = 'http://gecowave.test';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
const EPOCH = new Date('2026-01-01T00:00:00Z');
/** frame di gioco finto prima di avviare il livello: il boot ne usa un numero variabile, la partenza no */
export const START_FRAME = 600;

/**
 * gpu (default): angle su metal, 7 volte più veloce di swiftshader. la logica non legge mai i pixel del webgl,
 * quindi il renderer non entra nel confronto; GL=swiftshader resta per le macchine senza gpu.
 */
export async function launch({ gl = process.env.GL ?? 'gpu', headless = true } = {}) {
    const args = gl === 'swiftshader'
        ? ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist']
        : ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'];
    // l'audio parte senza gesto: niente rami "sblocca al primo tasto" che dipendono da quando arriva il tasto
    args.push('--autoplay-policy=no-user-gesture-required');
    return chromium.launch({ args, headless });
}

/* il passo del gioco vive nella pagina: un solo viaggio cdp per tanti fotogrammi.
   l'orologio finto (timer, Date, tween) va a millisecondi interi 17, 17, 16: media esatta a 60 hz senza arrotondamenti.
   il loop di phaser invece riceve 16,67 ms costanti: con 17/17/16 la media mobile del delta oscilla attorno
   a 1000/60 e la fisica arcade salta un passo ogni tre fotogrammi; appena sopra la soglia fa un passo doppio
   ogni ~80 s, come un monitor vero. il tempo del loop dipende solo dal numero del frame */
const STEPPER = (DRAW) => `((DRAW_EVERY) => {
    const frameMs = (f) => (f % 3 === 2 ? 16 : 17);
    const loopTime = (f) => 100000 + f * 16.67;
    window.__h.frame = 0;
    // dopo ogni timer finto l'orologio di playwright cede con un setTimeout(0) vero, che annidato dura 4 ms:
    // un messaggio è lo stesso confine di macrotask (microtask svuotati) senza l'attesa
    const emb = window.__pwClock.controller._embedder;
    if (emb && !emb.__fast) {
        const st = emb.setTimeout;
        const ch = new MessageChannel();
        const q = [];
        ch.port1.onmessage = () => q.shift()?.();
        emb.setTimeout = (f, ms) => { if (ms) return st(f, ms); q.push(f); ch.port2.postMessage(0); return 0; };
        emb.__fast = true;
    }
    // il disegno webgl non entra mai nella logica (camera.preRender sì, e resta a ogni fotogramma): si disegna
    // davvero un fotogramma su DRAW. il processo gpu di chromium era il collo di bottiglia
    const R = window.__game.renderer;
    if (R && !R.__sparse && DRAW_EVERY > 1) {
        const draw = R.render;
        R.render = function (...a) { if (window.__h.frame % DRAW_EVERY === 0) return draw.apply(this, a); };
        R.__sparse = true;
    }
    window.__h.stepOne = async () => {
        await window.__pwClock.controller.runFor(frameMs(window.__h.frame));
        window.__h.driveAnimations();
        window.__h.frame++;
        window.__game.loop.step(loopTime(window.__h.frame));
    };
})(${DRAW})`;

/**
 * apre il gioco fermo al menu con l'orologio in pausa.
 * ritorna la pagina e `step(n)`: avanza n frame, sempre a passi identici.
 */
export async function openGame(browser, { dist = process.env.DIST ?? 'dist-dev', viewport = process.env.VIEW ? { width: Number(process.env.VIEW.split('x')[0]), height: Number(process.env.VIEW.split('x')[1]) } : { width: 960, height: 540 }, coverage = false, draw = Number(process.env.DRAW ?? '4'), storage = null } = {}) {
    const root = resolve(dist);
    const page = await browser.newPage({ viewport });
    // la copertura parte prima del bundle: conta anche il boot
    if (coverage) await page.coverage.startJSCoverage({ resetOnNavigation: false });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.route(`${ORIGIN}/**`, async (route) => {
        let p = decodeURIComponent(new URL(route.request().url()).pathname);
        if (p === '/') p = '/index.html';
        try {
            await route.fulfill({ body: await readFile(join(root, p)), contentType: TYPES[extname(p)] });
        } catch {
            await route.fulfill({ status: 404, body: '' });
        }
    });
    await page.addInitScript((storage) => {
        localStorage.clear();
        // un salvataggio già su disco prima del boot: è così che si provano caricamento e migrazioni
        for (const [k, v] of Object.entries(storage ?? {})) localStorage.setItem(k, v);
        // mulberry32: lo stesso seed dà la stessa sequenza, in ogni build
        let s = 1;
        window.__seed = (v) => { s = v >>> 0; };
        Math.random = () => {
            s = (s + 0x6d2b79f5) | 0;
            let t = Math.imul(s ^ (s >>> 15), 1 | s);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }, storage);
    await page.addInitScript(PROBE);
    // install fa partire l'orologio in tempo reale: sotto carico pauseAt lo troverebbe già oltre l'epoca
    await page.clock.install({ time: new Date(EPOCH.getTime() - 5000) });
    await page.clock.pauseAt(EPOCH);
    await page.goto(`${ORIGIN}/`);
    // install e pauseAt si rigiocano nel documento con un istante reale in mezzo: i tick si portano dietro una
    // frazione di millisecondo, e il requestAnimationFrame finto cade a 16 - tick % 16. si riparte da valori esatti
    await page.evaluate((epoch) => { const n = window.__pwClock.controller._now; n.ticks = 5000; n.time = epoch; }, EPOCH.getTime());

    // fino al loop di phaser l'orologio va avanti da fuori; poi il loop si addormenta e lo guida la pagina
    let pre = 0;
    while (!(await page.evaluate(() => !!window.__game?.loop?.running))) {
        await page.clock.runFor(pre % 3 === 2 ? 16 : 17);
        if (++pre > 3000) throw new Error('phaser non parte');
    }
    await page.evaluate(STEPPER(draw));
    await page.evaluate((n) => { window.__h.frame = n; window.__game.loop.sleep(); }, pre);
    if (!(await page.evaluate(() => window.__h.attach()))) throw new Error('hook di sviluppo assenti: serve la build di scripts/harness/build.sh');

    const step = async (n = 1) => {
        await page.evaluate(async (n) => {
            for (let i = 0; i < n; i++) await window.__h.stepOne();
        }, n);
    };
    while (!(await page.evaluate(() => !!window.__startLevel && !!window.__game?.scene?.isActive('MenuScene')))) {
        // il caricamento degli asset va in tempo reale: mentre il loader lavora il gioco non avanza, così il boot
        // dura sempre gli stessi fotogrammi (la scena del menu gira già qui e si porta dietro il suo tempo)
        // il loader avanza solo nell'update della scena: lo si spinge a mano, senza far avanzare il gioco
        while (await page.evaluate(() => {
            const busy = window.__game.scene.scenes.filter((s) => s.load?.isLoading?.());
            for (const s of busy) s.load.update();
            return busy.length > 0;
        })) await new Promise((r) => setTimeout(r, 15));
        await step();
        if ((await frame()) > 3000) throw new Error('boot bloccato prima del menu');
    }
    // come un giocatore: lo splash "premi un tasto" si mangia il primo tasto e ferma la propagazione
    await page.keyboard.press('ShiftLeft');
    async function frame() {
        return page.evaluate(() => window.__h.frame);
    }
    const bootFrame = await frame();
    return { page, step, errors, frame, bootFrame };
}

/** avvia un livello sempre allo stesso istante finto e con lo stesso seed; prepare gira prima, nella pagina */
export async function startLevel(game, levelId, { seed = 12345, checkpointId = null, prepare = null, prepareArg = null } = {}) {
    const { page, step, frame } = game;
    const f = await frame();
    if (f > START_FRAME) throw new Error(`il boot ha superato START_FRAME (${f})`);
    await step(START_FRAME - f);
    if (prepare) await page.evaluate(prepare, prepareArg);
    // la sonda parte pulita: quello che è successo nel menu non è della partita
    await page.evaluate(() => window.__h.sample(-1));
    await page.evaluate(({ levelId, seed, checkpointId }) => {
        window.__seed(seed);
        // senza livello lo scenario parte dal menu, come un giocatore
        if (levelId) window.__startLevel(levelId, checkpointId);
    }, { levelId, seed, checkpointId });
}

/** aspetta che il geco esista (per gli script che non tracciano) */
export async function waitPlayer(game) {
    while (!(await game.page.evaluate(() => !!window.__game.scene.getScene('GameScene')?.player))) await game.step();
}
