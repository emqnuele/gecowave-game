// il menu principale come lo usa un giocatore: nuova partita con creazione e intro, e ogni schermata.
import { prepareSave, ui, waitLevel } from '../lib.mjs';
import { resolveAll } from '../bot.mjs';

const items = (ctx) => ctx.eval(() => window.__h.bot.labels('.screen [data-nav]'));
const clickLabel = async (ctx, re) => {
    const all = await items(ctx);
    const i = all.findIndex((x) => re.test(x));
    if (i < 0) return false;
    await ctx.eval((i) => window.__h.bot.click('.screen [data-nav]', i), i);
    await ctx.wait(30);
    return true;
};

export default [
    {
        id: 'menu-nuova-partita',
        level: null,
        async run(ctx) {
            await ctx.wait(90);
            ctx.mark(`menu: ${(await items(ctx)).join(' | ')}`);
            await clickLabel(ctx, /nuova partita/);
            // la forgia del geco: nome, pelle, e via
            for (let k = 0; k < 30; k++) {
                const u = await ui(ctx);
                const scene = await ctx.eval(() => window.__h.find.levelId());
                if (scene) break;
                const now = await items(ctx);
                ctx.mark(`schermata: ${(u.screen?.title ?? '').slice(0, 30)} [${now.slice(0, 6).join(' | ')}]`);
                const go = now.findIndex((x) => /^(incidi|inizia il viaggio|conferma|avanti)$/i.test(x));
                if (go >= 0) await ctx.eval((i) => window.__h.bot.click('.screen [data-nav]', i), go);
                else await ctx.tap('Enter', 2);
                await ctx.wait(40);
            }
            await waitLevel(ctx, 'perduta', 3000);
            await ctx.wait(300);
            await resolveAll(ctx);
        },
    },
    {
        id: 'menu-schermate',
        level: null,
        // un salvataggio vero: compaiono continua e capitoli
        ...prepareSave({ set: { levelId: 'rio' }, flags: ['visto-perduta', 'visto-bus', 'visto-santuario', 'visto-rio'], abilities: ['scivolata', 'rimbalzo'] }),
        async run(ctx) {
            await ctx.eval(() => window.__state.persist());
            await ctx.wait(90);
            // il menu si ridisegna al ritorno da una schermata: ora sa che c'è un salvataggio
            await clickLabel(ctx, /bacheca/);
            await ctx.tap('Escape', 2);
            await ctx.wait(30);
            const top = await items(ctx);
            ctx.mark(`menu: ${top.join(' | ')}`);
            for (let i = 0; i < top.length; i++) {
                if (/nuova partita|continua|esci/.test(top[i])) continue;
                await ctx.eval((i) => window.__h.bot.click('.screen [data-nav]', i), i);
                await ctx.wait(40);
                const sub = await items(ctx);
                ctx.mark(`${top[i]}: ${sub.slice(0, 12).join(' | ')}`);
                // dentro ogni schermata: frecce e invio, poi indietro
                await ctx.tap('ArrowDown', 2);
                await ctx.tap('ArrowRight', 2);
                await ctx.tap('ArrowDown', 2);
                await ctx.wait(10);
                for (let k = 0; k < 3; k++) {
                    await ctx.tap('Escape', 2);
                    await ctx.wait(20);
                    const back = await items(ctx);
                    if (back.join() === top.join()) break;
                }
            }
            await clickLabel(ctx, /continua/);
            await waitLevel(ctx, null, 1200);
            await ctx.wait(200);
            await resolveAll(ctx);
        },
    },
];
