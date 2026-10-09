// la campagna intera col bot: tutti i capitoli in ordine, dalla perduta al finale.
import { botState, prepareSave, waitLevel } from '../lib.mjs';
import { dumpSave, playChapter, resolveAll } from '../bot.mjs';

const log = (id) => (s) => {
    if (process.env.VERBOSE) console.log(`[${id}] ${s}`);
};

/**
 * gioca capitolo dopo capitolo finché il gioco non finisce. opts.choices: politica delle scelte;
 * SAVE_CHAPTERS=1 scrive il salvataggio d'ingresso di ogni capitolo (per gli scenari a metà gioco).
 */
export async function campaign(ctx, id, opts = {}) {
    const say = log(id);
    const seen = new Map();
    for (let i = 0; i < 40; i++) {
        if (process.env.CHAPTERS && i >= Number(process.env.CHAPTERS)) return;
        const s = await botState(ctx);
        if (s.status !== 5 && s.status !== 6) break;
        const n = (seen.get(s.level) ?? 0) + 1;
        seen.set(s.level, n);
        if (n > 3) {
            say(`!!! fermo in ${s.level}`);
            throw new Error(`il bot gira a vuoto in ${s.level}`);
        }
        if (process.env.SAVE_CHAPTERS && n === 1) await dumpSave(ctx, s.level);
        const next = await playChapter(ctx, { log: say, ...opts });
        say(`   -> ${next}`);
        if (next === s.level) await waitLevel(ctx, null, 300);
    }
    // il finale: riepilogo, carte, titoli di coda, poi il menu
    say('== finale');
    for (let k = 0; k < 40; k++) {
        await resolveAll(ctx, opts);
        await ctx.tap('Enter', 2);
        await ctx.wait(60);
        const menu = await ctx.eval(() => !!window.__game.scene.isActive('MenuScene'));
        if (menu) break;
    }
    await ctx.wait(120);
}

const NEW_GAME = { stats: { forza: 0, costituzione: 45, flusso: 0 } };

export default [
    {
        id: 'campagna',
        level: 'perduta',
        ...prepareSave(NEW_GAME),
        run: (ctx) => campaign(ctx, 'campagna'),
    },
];
