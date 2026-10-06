// regressione dei bug dei flashback sistemati prima del merge (vedi ANALISI_REMASTER.md):
// fine col salto (vignetta e zoom tornano uguali) e uscita al menu a metà film (niente stato globale appeso).
// uso: node scripts/harness/flashback-lifecycle.mjs
import { launch, openGame, startLevel, waitPlayer } from './game.mjs';

const browser = await launch();
const game = await openGame(browser);
await startLevel(game, 'caso');
await waitPlayer(game);
const { page, step } = game;
const fails = [];
const check = (cond, msg) => { if (!cond) fails.push(msg); };
const snap = () => page.evaluate(() => {
    const s = window.__game.scene.getScene('GameScene');
    const cam = s.cameras.main;
    return {
        god: window.__state.godMode, film: document.body.classList.contains('film'),
        caption: !!document.getElementById('flashback-caption'), bars: !!document.getElementById('film-bar-top'),
        duck: window.__music.graveDuck, vignette: s.vignette ? `${s.vignette.radius}/${s.vignette.strength}` : null,
        pipes: cam.postPipelines.length, zoom: cam.zoom.toFixed(3),
    };
});

await step(60);
const before = await snap();
await page.evaluate(() => window.__game.scene.getScene('GameScene').startDialogue('indizio-1'));
await step(180);
check((await snap()).god, 'durante il film il geco deve essere intoccabile');
await page.keyboard.press('Enter');
await step(90);
for (let i = 0; i < 40 && (await page.$('#dialogue')); i++) { await page.keyboard.press('KeyE'); await step(6); }
await step(30);
const after = await snap();
for (const k of ['god', 'film', 'caption', 'bars', 'duck', 'vignette', 'pipes', 'zoom']) check(after[k] === before[k], `dopo il salto ${k}: ${before[k]} -> ${after[k]}`);

await page.evaluate(() => {
    window.__state.save.seenDialogues = window.__state.save.seenDialogues.filter((d) => !d.startsWith('fb-'));
    window.__game.scene.getScene('GameScene').startDialogue('indizio-1');
});
await step(180);
await page.keyboard.down('Escape'); await step(2); await page.keyboard.up('Escape'); await step(2);
const quit = await page.$('xpath=//*[normalize-space(.)="esci al menu" and not(*)]');
check(!!quit, 'il menu di pausa deve avere "esci al menu"');
await quit?.click({ timeout: 5000 });
await step(30);
await page.keyboard.press('Enter');
await step(120);
const out = await page.evaluate(() => ({
    god: window.__state.godMode, film: document.body.classList.contains('film'),
    caption: !!document.getElementById('flashback-caption'), duck: window.__music.graveDuck,
    dialogue: !!document.getElementById('dialogue'),
}));
for (const [k, v] of Object.entries(out)) check(v === false, `dopo l'uscita al menu ${k} è ancora ${v}`);
check(game.errors.length === 0, `errori di pagina: ${game.errors.join(' | ')}`);
await browser.close();
console.log(fails.length ? `FALLITO\n- ${fails.join('\n- ')}` : 'OK');
process.exit(fails.length ? 1 : 0);
