// registratore di partite vere: lo stesso runner deterministico dell'harness, ma in una finestra e in tempo reale.
// i tasti e i clic finiscono in un nastro col numero del fotogramma; lo scenario "registrati" li rigioca
// identici su main e sul refactor (la partita rigiocata è esattamente quella registrata: stesso orologio, stesso caso).
// uso: node scripts/harness/record.mjs <nome> [livello] [--capitolo id]   (F9 o chiudere la finestra per finire)
//   livello: il capitolo da cui partire (senza: dal menu). --capitolo: parte col salvataggio d'ingresso di quel capitolo
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, openGame, startLevel } from './game.mjs';
import { chapterSave, prepareSave } from './lib.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const [name, level = null] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const capIdx = process.argv.indexOf('--capitolo');
const chapter = capIdx > 0 ? process.argv[capIdx + 1] : null;
if (!name) {
    console.log('uso: node scripts/harness/record.mjs <nome> [livello] [--capitolo id]');
    process.exit(1);
}
const save = chapter ? chapterSave(chapter) : null;
const prep = save ? prepareSave({ replace: save }) : { prepare: null, prepareArg: null };

const browser = await launch({ headless: false });
// chi gioca deve vedere ogni fotogramma: il disegno non cambia la partita
const game = await openGame(browser, { draw: 1 });
await startLevel(game, level, { prepare: prep.prepare, prepareArg: prep.prepareArg });
const { page } = game;
const f0 = await game.frame();
// gli eventi veri si registrano nella pagina col fotogramma in cui arrivano (prima del passo dopo)
await page.evaluate((f0) => {
    const tape = (window.__tape = []);
    const at = () => window.__h.frame - f0;
    window.addEventListener('keydown', (e) => { if (!e.repeat && e.code !== 'F9') tape.push([at(), 'key', e.code, 'down']); if (e.code === 'F9') window.__stop = true; }, true);
    window.addEventListener('keyup', (e) => { if (e.code !== 'F9') tape.push([at(), 'key', e.code, 'up']); }, true);
    window.addEventListener('mousedown', (e) => tape.push([at(), 'mouse', e.button, 'down', e.clientX, e.clientY]), true);
    window.addEventListener('mouseup', (e) => tape.push([at(), 'mouse', e.button, 'up', e.clientX, e.clientY]), true);
    window.addEventListener('mousemove', (e) => { const last = tape.at(-1); if (last?.[1] === 'move' && last[0] === at()) { last[2] = e.clientX; last[3] = e.clientY; } else tape.push([at(), 'move', e.clientX, e.clientY]); }, true);
}, f0);
console.log('registrazione in corso: gioca. F9 o chiudi la finestra per finire.');
const FRAME_MS = 1000 / 60;
let next = Date.now();
let frames = 0;
let closed = false;
const events = [];
// gli eventi passano di qui ogni mezzo secondo: chiudere la finestra non li perde
const pull = async () => { events.push(...(await page.evaluate(() => window.__tape.splice(0)))); };
page.on('close', () => { closed = true; });
try {
    while (!closed) {
        await game.step(1);
        frames++;
        if (frames % 30 === 0) await pull();
        if (await page.evaluate(() => !!window.__stop)) break;
        next += FRAME_MS;
        const wait = next - Date.now();
        if (wait > 0) await new Promise((r) => setTimeout(r, wait));
        else next = Date.now();
    }
} catch {
    // finestra chiusa a metà passo
}
if (!closed) await pull().catch(() => {});
const out = join(HERE, 'data/nastri', `${name}.json`);
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `${JSON.stringify({ name, level, chapter, frames, events })}\n`);
console.log(`${events.length} eventi in ${frames} fotogrammi -> ${out}`);
await browser.close();
