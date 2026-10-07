// ogni capitolo da solo, dal salvataggio con cui la campagna ci entra: film saltati, e le varianti delle scelte.
import { botState, chapterSave, DEFAULT_CHOICES, prepareSave } from '../lib.mjs';
import { playChapter, resolveAll } from '../bot.mjs';

const say = (id) => (s) => {
    if (process.env.VERBOSE) console.log(`[${id}] ${s}`);
};

/** la politica di default con qualche regola davanti */
const policy = (...rules) => [...rules, ...DEFAULT_CHOICES];

/**
 * un capitolo dal suo salvataggio d'ingresso. patch: cosa cambiare nel salvataggio (flag, barre...);
 * chain: quanti capitoli giocare di fila (per le uscite verso i capitoli segreti e ritorno)
 */
export function chapter(id, level, { patch = {}, choices = DEFAULT_CHOICES, film = 'skip', chain = 1, after = null, exit = true } = {}) {
    const save = chapterSave(level);
    return {
        id,
        level,
        ...prepareSave({ ...(save ? { replace: save } : {}), stats: { forza: 0, costituzione: 45, flusso: 0 }, ...patch }),
        async run(ctx) {
            if (!save) throw new Error(`manca il salvataggio d'ingresso di ${level}: SAVE_CHAPTERS=1 corpus.mjs run --only campagna`);
            const log = say(id);
            for (let i = 0; i < chain; i++) {
                const s = await botState(ctx);
                if (s.status !== 5 && s.status !== 6) break;
                const next = await playChapter(ctx, { log, policy: choices, film, exit: i < chain - 1 || exit });
                log(`   -> ${next}`);
            }
            if (after) await after(ctx, log);
            await resolveAll(ctx, { policy: choices, film });
            await ctx.wait(120);
        },
    };
}

const MAIN = ['perduta', 'bus', 'santuario', 'tecnokill', 'trenbolone', 'tana', 'rio', 'stabilimento', 'ruhra', 'mente', 'caso', 'sorveglianza', 'cantina', 'ricordi', 'void'];

export default [
    ...MAIN.map((l) => chapter(`cap-${l}`, l)),
    // varianti delle scelte di trama
    chapter('cap-tecnokill-disarmato', 'tecnokill', { choices: policy([/notino è a terra/, 1]) }),
    chapter('cap-trenbolone-rifiuta', 'trenbolone', { choices: policy([/trenbolone\?/, 1]), exit: false }),
    chapter('cap-rio-tommaso', 'rio', { patch: { set: { barre: 400 } }, choices: policy([/tommasorveglianza/, 0]) }),
    chapter('cap-rio-povero', 'rio', { patch: { set: { barre: 0 } }, choices: policy([/tommasorveglianza/, 0], [/acqua premium/, 0]) }),
    chapter('cap-rio-acqua', 'rio', { patch: { set: { barre: 100 } }, choices: policy([/acqua premium/, 0]), exit: false }),
    chapter('cap-stabilimento-acqua', 'stabilimento', { choices: policy([/acqua di smela/, 0]), exit: false }),
    chapter('cap-mente-cancella', 'mente', { choices: policy([/pensiero/, 0]) }),
    chapter('cap-mente-porta', 'mente', { choices: policy([/pensiero/, 1]) }),
    chapter('cap-sorveglianza-premium', 'sorveglianza', { patch: { flags: ['tommasorveglianza'], ombra: { premium: true, sightings: 6, total: 60, counts: { 'attack-side': 50, dash: 10 } } } }),
    chapter('cap-cantina-cliente', 'cantina', { patch: { flags: ['tommasorveglianza'] }, film: 'watch' }),
    chapter('cap-cantina-calpesta', 'cantina', { choices: policy([/boccetta di trenbolone/, 1]) }),
    chapter('cap-void-33', 'void', { choices: policy([/il 33 pulsa/, 0]) }),
    chapter('cap-void-garante-porta', 'void', { patch: { flags: ['pensiero-portato'] } }),
    chapter('cap-void-garante-cancella', 'void', { patch: { flags: ['pensiero-cancellato'] } }),
    // walter: galliate e marcetti, poi di nuovo al bus
    chapter('cap-walter', 'bus', { patch: { flags: ['boss-down-guggu', 'ivan'] }, choices: policy([/walter sbadiglia/, 0]), chain: 3 }),
    // i varchi segreti
    chapter('cap-custode', 'perduta', { patch: { flags: ['maschera-completa'], abilities: ['scivolata', 'rimbalzo', 'riflesso', 'risonante', 'aggrappo'] }, choices: policy([/varco verso/, 0]), chain: 2 }),
    chapter('cap-barrato', 'tecnokill', { patch: { flags: ['boss-down-walter'] }, choices: policy([/varco verso/, 0]), chain: 2 }),
];
