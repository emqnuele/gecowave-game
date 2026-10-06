// avvio deterministico del gioco in chromium headless: build servita da disco, orologio finto, random con seed.
// prima: NODE_ENV=development npx vite build --outDir dist-dev   (servono gli hook window.__*)
import { readFile } from 'node:fs/promises';
import { join, extname, resolve } from 'node:path';
import { chromium } from 'playwright-core';

export const FRAME = 1000 / 60;
/** millisecondi interi per frame (17, 17, 16): media esatta a 60 hz senza arrotondamenti dell'orologio finto */
const frameMs = (f) => (f % 3 === 2 ? 16 : 17);
/** tempo del loop al frame f: dipende solo da f, mai da quando il boot ha finito */
const loopTime = (f) => 100000 + 50 * Math.floor(f / 3) + [0, 17, 34][f % 3];
const ORIGIN = 'http://gecowave.test';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
const EPOCH = new Date('2026-01-01T00:00:00Z');
/** frame di gioco finto prima di avviare il livello: il boot ne usa un numero variabile, la partenza no */
export const START_FRAME = 600;

export async function launch() {
    return chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
}

/**
 * apre il gioco fermo al menu con l'orologio in pausa.
 * ritorna la pagina e `step(n)`: avanza n frame, sempre a passi identici (un runFor per frame,
 * mai un runFor lungo: l'orologio finto arrotonda i millisecondi frazionari).
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
    await page.clock.install({ time: EPOCH });
    await page.clock.pauseAt(EPOCH);
    await page.goto(`${ORIGIN}/`);

    // il loop di phaser va addormentato: col requestAnimationFrame finto certi passi scattano due frame a caso.
    // si avanza a mano: prima timer e Date (tween compresi), poi un passo del loop col tempo nostro
    let frame = 0;
    while (!(await page.evaluate(() => !!window.__game?.loop?.running))) {
        await page.clock.runFor(frameMs(frame));
        if (++frame > 3000) throw new Error('phaser non parte');
    }
    // il tempo del loop è nostro: il performance.now finto si porta dietro una frazione dell'origine reale
    await page.evaluate(() => { window.__game.loop.sleep(); });
    const step = async (n = 1) => {
        for (let i = 0; i < n; i++) {
            const ms = frameMs(frame);
            await page.clock.runFor(ms);
            frame++;
            await page.evaluate((t) => { window.__game.loop.step(t); }, loopTime(frame));
        }
    };
    while (!(await page.evaluate(() => !!window.__startLevel && !!window.__game?.scene?.isActive('MenuScene')))) {
        await step();
        if (frame > 3000) throw new Error('boot bloccato prima del menu');
    }
    // come un giocatore: lo splash "premi un tasto" si mangia il primo tasto e ferma la propagazione
    await page.keyboard.press('ShiftLeft');
    return { page, step, errors, frame: () => frame };
}

/** avvia un livello sempre allo stesso istante finto e con lo stesso seed */
export async function startLevel(game, levelId, { seed = 12345, checkpointId = null } = {}) {
    const { page, step, frame } = game;
    if (frame() > START_FRAME) throw new Error(`il boot ha superato START_FRAME (${frame()})`);
    await step(START_FRAME - frame());
    await page.evaluate(({ levelId, seed, checkpointId }) => {
        window.__seed(seed);
        window.__startLevel(levelId, checkpointId);
    }, { levelId, seed, checkpointId });
    while (!(await page.evaluate(() => !!window.__game.scene.getScene('GameScene')?.player))) await step();
}
