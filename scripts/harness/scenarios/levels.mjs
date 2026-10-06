// ogni capitolo, dall'ingresso: costruzione della regione, script del capitolo, un minuto di comandi veri.
import { K, prepareSave, resolveUI } from '../lib.mjs';

/** le wave che il geco ha entrando nel capitolo, seguendo la campagna */
export const ABILITIES_AT = {
    perduta: [],
    bus: ['scivolata'],
    santuario: ['scivolata', 'rimbalzo'],
    tecnokill: ['scivolata', 'rimbalzo', 'riflesso'],
    trenbolone: ['scivolata', 'rimbalzo', 'riflesso', 'risonante'],
    tana: ['scivolata', 'rimbalzo', 'riflesso', 'risonante'],
    rio: ['scivolata', 'rimbalzo', 'riflesso', 'risonante'],
    stabilimento: ['scivolata', 'rimbalzo', 'riflesso', 'risonante', 'aggrappo'],
    ruhra: ['scivolata', 'rimbalzo', 'riflesso', 'risonante', 'aggrappo', 'acquatossica'],
    mente: ['scivolata', 'rimbalzo', 'riflesso', 'risonante', 'aggrappo', 'acquatossica'],
    caso: ['scivolata', 'rimbalzo', 'riflesso', 'risonante', 'aggrappo', 'acquatossica', 'analisi'],
    sorveglianza: ['scivolata', 'rimbalzo', 'riflesso', 'risonante', 'aggrappo', 'acquatossica', 'analisi'],
    cantina: ['scivolata', 'rimbalzo', 'riflesso', 'risonante', 'aggrappo', 'acquatossica', 'analisi', 'scudo'],
    ricordi: ['scivolata', 'rimbalzo', 'riflesso', 'risonante', 'aggrappo', 'acquatossica', 'analisi', 'scudo'],
    void: ['scivolata', 'rimbalzo', 'riflesso', 'risonante', 'aggrappo', 'acquatossica', 'analisi', 'scudo'],
    nucleo: ['scivolata', 'rimbalzo', 'riflesso', 'risonante', 'aggrappo', 'acquatossica', 'analisi', 'scudo'],
    barrato: ['scivolata', 'rimbalzo', 'riflesso', 'risonante', 'aggrappo'],
    custode: ['scivolata', 'rimbalzo', 'riflesso', 'risonante', 'aggrappo', 'acquatossica', 'analisi', 'scudo'],
    galliate: ['scivolata', 'rimbalzo'],
    marcetti: ['scivolata', 'rimbalzo'],
    piazza: ['scivolata', 'rimbalzo', 'riflesso', 'risonante'],
};

/** un minuto di gioco vero: corsa, salti, attacchi, e le wave che ci sono */
async function play(ctx, abilities) {
    const has = (a) => abilities.includes(a);
    await ctx.wait(40);
    await resolveUI(ctx);
    await ctx.down(K.right);
    await ctx.wait(30);
    await ctx.tap(K.jump, 14);
    await ctx.wait(20);
    await ctx.tap(K.attack, 3);
    await ctx.wait(12);
    await ctx.tap(K.attack, 3);
    await ctx.wait(12);
    await ctx.tap(K.attack, 3);
    if (has('scivolata')) await ctx.tap(K.dash, 4);
    await ctx.wait(30);
    await ctx.tap(K.jump, 6);
    if (has('rimbalzo')) {
        await ctx.wait(10);
        await ctx.tap(K.jump, 6);
    }
    await ctx.wait(40);
    await ctx.up(K.right);
    await resolveUI(ctx);
    if (has('risonante')) {
        await ctx.tap(K.wave, 3);
        await ctx.wait(30);
        await ctx.hold([K.wave], 70);
        await ctx.wait(30);
    }
    if (has('riflesso')) {
        await ctx.tap(K.riflesso, 3);
        await ctx.wait(40);
        await ctx.tap(K.riflesso, 3);
        await ctx.wait(20);
    }
    if (has('analisi')) {
        await ctx.hold([K.up, K.wave], 4);
        await ctx.wait(140);
    }
    if (has('scudo')) {
        await ctx.tap(K.scudo, 3);
        await ctx.wait(60);
    }
    if (has('acquatossica')) {
        await ctx.hold([K.down, K.wave], 4);
        await ctx.wait(60);
    }
    await resolveUI(ctx);
    await ctx.down(K.left);
    await ctx.wait(50);
    await ctx.tap(K.down, 2);
    await ctx.hold([K.down, K.attack], 3);
    await ctx.wait(40);
    await ctx.up(K.left);
    await ctx.tap(K.interact, 3);
    await ctx.wait(30);
    await resolveUI(ctx);
    await ctx.wait(120);
    await resolveUI(ctx);
}

export default Object.entries(ABILITIES_AT).map(([level, abilities]) => ({
    id: `livello-${level}`,
    level,
    ...prepareSave({ abilities }),
    run: (ctx) => play(ctx, abilities),
}));
