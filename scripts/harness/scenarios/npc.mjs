// gli npc negli stati della trama che la campagna non incontra: ogni ramo di interactNpc e della piazza.
import { chapterSave, DEFAULT_CHOICES, K, prepareSave, teleport, waypoints } from '../lib.mjs';
import { resolveAll } from '../bot.mjs';
import { ABILITIES_AT } from './levels.mjs';

const policy = (...rules) => [...rules, ...DEFAULT_CHOICES];

/** parla con l'npc della tappa npc:<id>, due volte (la seconda spesso dice altro) */
function talk(id, level, npc, { patch = {}, choices = DEFAULT_CHOICES, times = 2, before = null } = {}) {
    const s = chapterSave(level);
    return {
        id,
        level,
        ...prepareSave({ ...(s ? { replace: s } : { abilities: ABILITIES_AT[level] ?? [] }), stats: { forza: 0, costituzione: 45, flusso: 0 }, ...patch }),
        async run(ctx) {
            await ctx.wait(30);
            await resolveAll(ctx, { policy: choices });
            if (before) await before(ctx);
            const w = waypoints(level).waypoints.find((x) => x.tag === `npc:${npc}`);
            if (!w) throw new Error(`niente npc:${npc} in ${level}`);
            for (let i = 0; i < times; i++) {
                await teleport(ctx, w.x, w.y - 10);
                await ctx.wait(10);
                await ctx.tap(K.interact, 3);
                await ctx.wait(8);
                await resolveAll(ctx, { policy: choices });
                await ctx.wait(30);
            }
            await ctx.wait(240);
            await resolveAll(ctx, { policy: choices });
        },
    };
}

/** la piazza in uno stato: parla con tutti gli sprite di npc */
function piazza(id, patch, choices = DEFAULT_CHOICES) {
    return {
        id,
        level: 'piazza',
        ...prepareSave({ abilities: ['scivolata', 'rimbalzo', 'riflesso', 'risonante'], ...patch }),
        async run(ctx) {
            await ctx.wait(40);
            await resolveAll(ctx, { policy: choices });
            const npcs = await ctx.eval(() => window.__h.bot.sprites(['npc-']));
            for (const n of npcs) {
                await teleport(ctx, n.x - 20, n.y - 6);
                await ctx.wait(8);
                await ctx.tap(K.interact, 3);
                await ctx.wait(6);
                await resolveAll(ctx, { policy: choices });
            }
            await ctx.wait(60);
        },
    };
}

const SEVEN = ['scivolata', 'rimbalzo', 'riflesso', 'risonante', 'aggrappo', 'analisi', 'scudo'];

export default [
    // trenbolone: lo spaccino a dose già presa, e a flauto già battuto (si dorme e si va alla tana)
    talk('npc-spaccino-fatto', 'trenbolone', 'spaccino', { patch: { flags: ['trenbolone-attivo'] } }),
    talk('npc-spaccino-dopo-flauto', 'trenbolone', 'spaccino', { patch: { flags: ['boss-down-flauto'] }, choices: policy([/trenbolone\?/, 0]), times: 1 }),
    // stabilimento: l'acqua quando l'hai già bevuta
    talk('npc-acqua-due-volte', 'stabilimento', 'venditore-acqua', { choices: policy([/acqua di smela/, 0]) }),
    // rio: l'acqua premium senza barre
    talk('npc-smela-povero', 'rio', 'smela-offerta', { patch: { set: { barre: 3 } }, choices: policy([/acqua premium/, 0]) }),
    // bus: walter prima di guggu, e dopo la sua quest
    talk('npc-walter-dorme', 'bus', 'walter-bus', { patch: { unflags: ['boss-down-guggu'] } }),
    talk('npc-walter-dopo', 'bus', 'walter-bus', { patch: { flags: ['boss-down-guggu', 'boss-down-walter'] } }),
    talk('npc-samatt-libero', 'bus', 'samatt-loop', { patch: { flags: ['boss-down-guggu'] } }),
    talk('npc-ivan-dopo', 'bus', 'ivan-incontro', { patch: { flags: ['boss-down-guggu', 'ivan'] } }),
    // caso: romero con lochef arrestato
    talk('npc-romero-lochef', 'caso', 'romero-caso', { patch: { flags: ['lochef-arrestato'], unflags: ['romero-lochef-detto'] } }),
    // cantina: lametta dopo ticummi
    talk('npc-lametta-libero', 'cantina', 'lametta-cantina', { patch: { flags: ['boss-down-ticummi'] } }),
    // ruhra: piema senza dispositivo, e con l'analisi già presa
    talk('npc-piema-senza', 'ruhra', 'piema-mente', { patch: { unflags: ['dispositivo'] } }),
    talk('npc-piema-dopo', 'ruhra', 'piema-mente', { patch: { abilities: ['analisi'] } }),
    // perduta: il dono di markolino già sentito ma senza scivolata (ripescaggio del frammento)
    talk('npc-markolino-dono', 'perduta', 'markolino-dono', { patch: { flags: ['markolino-dono-visto'], set: { abilities: [] } } }),
    // la piazza in tre momenti della partita
    piazza('piazza-inizio', { flags: ['boss-down-guggu'], set: { barre: 10 } }, policy([/bottega/, 1])),
    piazza('piazza-meta', { flags: ['boss-down-guggu', 'caso-risolto', 'caffe-romero', 'visto-perduta', 'visto-bus', 'visto-santuario', 'visto-tecnokill'], abilities: ['aggrappo'], set: { barre: 900, notches: 9, quests: { 'q-rio-canna': { s: 'pronta', n: 3 }, 'q-bus-abbonamento': { s: 'fatta', n: 0 }, 'q-perduta-bastone': { s: 'attiva', n: 0 } } } }, policy([/bottega/, 1])),
    piazza('piazza-fine', { flags: ['boss-down-guggu', 'notino-a-casa', 'ospite-12-libero', 'caso-risolto', 'visto-perduta', 'visto-bus'], abilities: SEVEN, lore: ['nota-caso-1'], set: { barre: 5000, notches: 99 } }, policy([/bottega/, 1], [/biglietto sulla sua scrivania/, 0])),
];
