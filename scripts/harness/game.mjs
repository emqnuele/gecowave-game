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
   millisecondi interi per frame (17, 17, 16): media esatta a 60 hz senza arrotondamenti dell'orologio finto;
   il tempo del loop dipende solo dal numero del frame, mai da quando il boot ha finito */
const STEPPER = `(() => {
    const frameMs = (f) => (f % 3 === 2 ? 16 : 17);
    const loopTime = (f) => 100000 + 50 * Math.floor(f / 3) + [0, 17, 34][f % 3];
    window.__h.frame = 0;
    window.__h.stepOne = async () => {
        await window.__pwClock.controller.runFor(frameMs(window.__h.frame));
        window.__h.driveAnimations();
        window.__h.frame++;
        window.__game.loop.step(loopTime(window.__h.frame));
    };
})()`;

/**
 * apre il gioco fermo al menu con l'orologio in pausa.
 * ritorna la pagina e `step(n)`: avanza n frame, sempre a passi identici.
 */
export async function openGame(browser, { dist = process.env.DIST ?? 'dist-dev', viewport = { width: 960, height: 540 } } = {}) {
    const root = resolve(dist);
    const page = await browser.newPage({ viewport });
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
    await page.addInitScript(() => {
        localStorage.clear();
        // mulberry32: lo stesso seed dà la stessa sequenza, in ogni build
        let s = 1;
        window.__seed = (v) => { s = v >>> 0; };
        Math.random = () => {
            s = (s + 0x6d2b79f5) | 0;
            let t = Math.imul(s ^ (s >>> 15), 1 | s);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    });
    await page.addInitScript(PROBE);
    await page.clock.install({ time: EPOCH });
    await page.clock.pauseAt(EPOCH);
    await page.goto(`${ORIGIN}/`);

    // fino al loop di phaser l'orologio va avanti da fuori; poi il loop si addormenta e lo guida la pagina
    let pre = 0;
    while (!(await page.evaluate(() => !!window.__game?.loop?.running))) {
        await page.clock.runFor(pre % 3 === 2 ? 16 : 17);
        if (++pre > 3000) throw new Error('phaser non parte');
    }
    await page.evaluate(STEPPER);
    await page.evaluate((n) => { window.__h.frame = n; window.__game.loop.sleep(); }, pre);
    if (!(await page.evaluate(() => window.__h.attach()))) throw new Error('hook di sviluppo assenti: serve la build di scripts/harness/build.sh');

    const step = async (n = 1) => {
        await page.evaluate(async (n) => {
            for (let i = 0; i < n; i++) await window.__h.stepOne();
        }, n);
    };
    while (!(await page.evaluate(() => !!window.__startLevel && !!window.__game?.scene?.isActive('MenuScene')))) {
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
        window.__startLevel(levelId, checkpointId);
    }, { levelId, seed, checkpointId });
}

/** aspetta che il geco esista (per gli script che non tracciano) */
export async function waitPlayer(game) {
    while (!(await game.page.evaluate(() => !!window.__game.scene.getScene('GameScene')?.player))) await game.step();
}
