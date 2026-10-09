// i film dei ricordi: il mondo si ferma come sotto un dialogo, il film gira in una scena sua, e saltandolo tutto torna come prima.
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
        line: !!document.getElementById('film-line'), bars: !!document.getElementById('film-bar-top'),
        duck: window.__music.graveDuck, pipes: cam.postPipelines.length, zoom: cam.zoom.toFixed(3),
        paused: window.__game.scene.isPaused('GameScene'), filmScene: window.__game.scene.isActive('FilmScene'),
    };
});

await step(60);
const before = await snap();
await page.evaluate(() => window.__game.scene.getScene('GameScene').ctx.dialogues.start('indizio-1'));
await step(180);
const mid = await snap();
check(mid.paused && mid.filmScene, `durante il film la partita è ferma e il film gira: ${JSON.stringify(mid)}`);
check(!mid.god, 'il film non tocca più l\'invincibilità del geco');
check(mid.bars && mid.line, 'bande nere e riga dei sottotitoli in scena');
await page.keyboard.down('Escape'); await step(2); await page.keyboard.up('Escape'); await step(4);
check(!(await page.$('#ui > .screen')), 'a film in corso il menu di pausa non si apre');
await page.keyboard.press('Enter');
await step(130);
for (let i = 0; i < 40 && (await page.$('#dialogue')); i++) { await page.keyboard.press('KeyE'); await step(6); }
await step(30);
const after = await snap();
for (const k of ['god', 'film', 'line', 'bars', 'duck', 'pipes', 'zoom', 'paused', 'filmScene']) check(after[k] === before[k], `dopo il salto ${k}: ${before[k]} -> ${after[k]}`);
check(game.errors.length === 0, `errori di pagina: ${game.errors.join(' | ')}`);
await browser.close();
console.log(fails.length ? `FALLITO\n- ${fails.join('\n- ')}` : 'OK');
process.exit(fails.length ? 1 : 0);
