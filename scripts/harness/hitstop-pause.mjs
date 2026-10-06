// regressione: una pausa subito dopo un colpo non deve lasciare la fisica al rallentatore.
// uso: node scripts/harness/hitstop-pause.mjs
import { launch, openGame, startLevel } from './game.mjs';

const browser = await launch();
const game = await openGame(browser);
await startLevel(game, 'perduta');
const { page, step } = game;
await step(30);
await page.evaluate(() => {
    window.__game.scene.getScene('GameScene').hitstop();
    window.__game.scene.pause('GameScene');
});
await step(10);
await page.evaluate(() => { window.__game.scene.resume('GameScene'); });
await step(30);
const scale = await page.evaluate(() => window.__game.scene.getScene('GameScene').physics.world.timeScale);
await browser.close();
console.log(scale === 1 ? 'OK' : `FALLITO: timeScale ${scale}`);
process.exit(scale === 1 ? 0 : 1);
