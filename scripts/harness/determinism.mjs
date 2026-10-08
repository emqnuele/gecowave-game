// prova che il runner è deterministico: la stessa partita due volte deve dare tracce identiche al bit.
// uso: node scripts/harness/determinism.mjs [livello]
import { createHash } from 'node:crypto';
import { launch, openGame, startLevel, waitPlayer } from './game.mjs';

const level = process.argv[2] ?? 'tecnokill';
// [frame, tasto, su/giù]: i tasti fisici del preset classico
const TAPE = [[0, 'KeyD', 'down'], [90, 'Space', 'down'], [100, 'Space', 'up'], [160, 'KeyJ', 'down'], [165, 'KeyJ', 'up'], [240, 'KeyD', 'up'], [250, 'KeyA', 'down'], [400, 'KeyA', 'up'], [420, 'KeyK', 'down'], [425, 'KeyK', 'up']];

async function play() {
    const browser = await launch();
    const game = await openGame(browser);
    const boot = game.bootFrame;
    await startLevel(game, level);
    await waitPlayer(game);
    const { page, step } = game;
    const trace = [];
    for (let f = 0; f < 600; f++) {
        for (const [at, key, how] of TAPE) if (at === f) await (how === 'down' ? page.keyboard.down(key) : page.keyboard.up(key));
        await step();
        if (f % 10 === 0) {
            trace.push(await page.evaluate(() => {
                const s = window.__game.scene.getScene('GameScene');
                const foes = s.ctx.groups.enemies.getChildren().filter((e) => e.active && !e.dormant).map((e) => `${e.x.toFixed(2)},${e.y.toFixed(2)},${e.mode}`).join(';');
                return `${s.player.x.toFixed(3)},${s.player.y.toFixed(3)},${window.__state.run.hp},${window.__state.run.flow}|${foes}|t=${s.time.now.toFixed(1)}|w=${s.atmosphere?.weather}`;
            }));
        }
    }
    await browser.close();
    return { boot, trace, errors: game.errors };
}

const a = await play();
const b = await play();
const hash = (t) => createHash('sha1').update(t.join('\n')).digest('hex').slice(0, 12);
console.log(`frame di boot ${a.boot}/${b.boot}, hash ${hash(a.trace)}/${hash(b.trace)}, errori ${a.errors.length}/${b.errors.length}`);
const i = a.trace.findIndex((x, k) => x !== b.trace[k]);
console.log(i < 0 ? 'IDENTICHE' : `DIVERGONO al campione ${i}:\n${a.trace[i]}\n${b.trace[i]}`);
process.exit(i < 0 ? 0 : 1);
