// salvataggi già su disco prima del boot: caricamento, migrazioni dei formati vecchi, continua dal menu.
// i salvataggi di main devono caricarsi identici nel refactor: questi scenari lo controllano.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chapterSave, waitLevel } from '../lib.mjs';
import { resolveAll } from '../bot.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const items = (ctx) => ctx.eval(() => window.__h.bot.labels('.screen [data-nav]'));

/** dal menu: continua, poi un po' di gioco */
async function continueFromMenu(ctx) {
    await ctx.wait(90);
    const top = await items(ctx);
    ctx.mark(`menu: ${top.join(' | ')}`);
    const i = top.findIndex((x) => /continua/.test(x));
    if (i < 0) throw new Error('niente "continua" nel menu');
    await ctx.eval((i) => window.__h.bot.click('.screen [data-nav]', i), i);
    await waitLevel(ctx, null, 1200);
    await ctx.wait(300);
    await resolveAll(ctx);
    const save = await ctx.eval(() => window.__state.save);
    ctx.mark(`caricato: ${save.levelId} ${save.checkpointId} barre ${save.barre} wave ${save.abilities.join(',')} flag ${save.flags.length}`);
}

// un salvataggio come lo scriveva il gioco qualche versione fa: ogni migrazione di state.ts ha qualcosa da fare
const OLD = {
    ...JSON.parse(readFileSync(join(HERE, '../data/saves/rio.json'), 'utf8')),
    barre: 'NaN',
    inventory: { energetico: 2, santino: 1, 'brodo-lochef': 1, crocchetta: 1 },
    flags: ['lochef-libero', 'tommasorveglianza', 'visto-perduta', 'boss-down-guggu'],
    abilities: ['scivolata', 'rimbalzo', 'rigenerazione'],
    runScores: { perduta: 2400 },
    scores: { perduta: { score: 2400, timeMs: 1, deaths: 0, kills: 0, explored: 1, secrets: 0, assisted: false } },
    skin: 'oro-massiccio',
    collassoMode: true,
    collasso: 0.3,
    doomsdayMode: false,
    doomsday: 0,
    ombra: undefined,
    record: { deaths: 3 },
};

export default [
    {
        id: 'carica-vecchio',
        level: null,
        storage: {
            'gecowave-save-v2': JSON.stringify(OLD),
            'gecowave-settings-v1': JSON.stringify({ volume: 0.4, screenShake: false, guide: false }),
        },
        run: continueFromMenu,
    },
    {
        id: 'carica-microfono',
        level: null,
        // un salvataggio a metà ruhra con un microfono acceso: si riparte da lì, col microfono verde
        storage: {
            'gecowave-save-v2': JSON.stringify({ ...chapterSave('ruhra'), checkpointId: 'cp-345-102', collectedLore: [...chapterSave('ruhra').collectedLore, 'mic-ruhra-cp-345-102'] }),
            'gecowave-settings-v1': JSON.stringify({ volume: 0.7, screenShake: true, guide: true, controls: { preset: 'frecce', custom: { jump: ['X'] } } }),
        },
        run: continueFromMenu,
    },
    {
        id: 'carica-corrotto',
        level: null,
        storage: { 'gecowave-save-v2': '{questo non è json', 'gecowave-settings-v1': 'nemmeno questo' },
        async run(ctx) {
            await ctx.wait(120);
            ctx.mark(`menu: ${(await items(ctx)).join(' | ')}`);
        },
    },
    {
        // la finestra che cambia misura a metà partita: zoom della camera, parallasse, veli, ui
        id: 'ridimensiona',
        level: 'galliate',
        async run(ctx) {
            await ctx.wait(60);
            await resolveAll(ctx);
            for (const [w, h] of [[1280, 720], [800, 600], [960, 540]]) {
                await ctx.page.setViewportSize({ width: w, height: h });
                // il resize arriva col tempo reale del browser: si aspetta che phaser l'abbia visto prima di avanzare
                // (con l'orologio finto i timer della pagina sono fermi: si aspetta da fuori)
                while (!(await ctx.eval(([w, h]) => window.innerWidth === w && window.innerHeight === h, [w, h]))) await new Promise((r) => setTimeout(r, 20));
                await new Promise((r) => setTimeout(r, 100));
                await ctx.wait(60);
                await resolveAll(ctx);
            }
        },
    },
];
