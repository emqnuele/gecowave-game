// due schede dello stesso browser che giocano insieme sulla stanza "locale" (BroadcastChannel), in tempo reale.
// prima: scripts/harness/build.sh   (servono gli hook window.__*)
// uso: node scripts/coop/duo.mjs [scenario] [--headed] [--shots]
import { readFile, mkdir } from 'node:fs/promises';
import { join, extname, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { SCENARIOS } from './scenarios.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');
const ORIGIN = 'http://gecowave.test';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.woff2': 'font/woff2', '.woff': 'font/woff' };
const OUT = join(ROOT, '.harness', 'coop');

const args = process.argv.slice(2);
const name = args.find((a) => !a.startsWith('--')) ?? 'lobby';
const headed = args.includes('--headed');
const scenario = SCENARIOS[name];
if (!scenario) {
    console.error(`scenari: ${Object.keys(SCENARIOS).join(', ')}`);
    process.exit(2);
}
await mkdir(OUT, { recursive: true });

// due schede devono girare insieme: niente rallentamento di quella in secondo piano
const browser = await chromium.launch({
    headless: !headed,
    args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required',
        '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding'],
});
const context = await browser.newContext({ viewport: { width: 960, height: 540 } });
const dist = resolve(ROOT, process.env.DIST ?? 'dist-dev');
await context.route(`${ORIGIN}/**`, async (route) => {
    let p = decodeURIComponent(new URL(route.request().url()).pathname);
    if (p === '/') p = '/index.html';
    try {
        await route.fulfill({ body: await readFile(join(dist, p)), contentType: TYPES[extname(p)] ?? 'application/octet-stream' });
    } catch {
        await route.fulfill({ status: 404, body: '' });
    }
});

const errors = { A: [], B: [] };
async function open(tag) {
    const page = await context.newPage();
    page.on('pageerror', (e) => errors[tag].push(e.message));
    page.on('console', (m) => {
        if (m.type() === 'error' || process.env.VERBOSE) console.log(`[${tag} ${m.type()}] ${m.text()}`);
    });
    await page.goto(`${ORIGIN}/`);
    await page.waitForFunction(() => !!window.__game?.scene?.isActive('MenuScene'), null, { timeout: 60000 });
    await page.keyboard.press('ShiftLeft');
    await page.waitForTimeout(300);
    return page;
}

const A = await open('A');
const B = await open('B');
let shotN = 0;
const tools = {
    A, B, OUT,
    wait: (ms) => new Promise((r) => setTimeout(r, ms)),
    async shot(page, label) {
        const file = join(OUT, `${name}-${String(++shotN).padStart(2, '0')}-${label}.png`);
        await page.screenshot({ path: file });
        console.log(`  foto: ${file}`);
        return file;
    },
    async click(page, text, timeout = 15000) {
        await page.waitForFunction((t) => [...document.querySelectorAll('button')].some((b) => b.offsetParent !== null && (b.textContent || '').toLowerCase().includes(t)), text.toLowerCase(), { timeout });
        await page.evaluate((t) => {
            const b = [...document.querySelectorAll('button')].find((x) => x.offsetParent !== null && (x.textContent || '').toLowerCase().includes(t));
            b.click();
        }, text.toLowerCase());
        await page.waitForTimeout(250);
    },
    async type(page, selector, text) {
        await page.waitForSelector(selector, { state: 'visible' });
        await page.fill(selector, text);
    },
    async until(page, fn, arg, timeout = 30000) {
        await page.waitForFunction(fn, arg, { timeout, polling: 100 });
    },
    check(label, ok, detail = '') {
        console.log(`${ok ? 'ok  ' : 'NO  '} ${label}${detail ? `  (${detail})` : ''}`);
        if (!ok) process.exitCode = 1;
    },
};

console.log(`scenario ${name}`);
try {
    await scenario(tools);
} catch (e) {
    console.error('scenario fallito:', e.message);
    await tools.shot(A, 'errore-A').catch(() => {});
    await tools.shot(B, 'errore-B').catch(() => {});
    process.exitCode = 1;
}
for (const tag of ['A', 'B']) {
    if (errors[tag].length) {
        console.log(`errori ${tag}:`);
        for (const e of errors[tag].slice(0, 10)) console.log(`  ${e}`);
        process.exitCode = 1;
    }
}
if (!headed) await browser.close();
