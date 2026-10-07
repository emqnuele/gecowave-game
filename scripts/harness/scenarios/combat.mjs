// il combattimento nei dettagli: rimando dello scudo, schianto, wave contro i boss, l'ombra che legge, uscite chiuse.
import { ALL_ABILITIES, botState, chapterSave, DEFAULT_CHOICES, K, prepareSave, region, teleport, waypoints } from '../lib.mjs';
import { fight, resolveAll } from '../bot.mjs';
import { ABILITIES_AT } from './levels.mjs';

const policy = (...rules) => [...rules, ...DEFAULT_CHOICES];
const fillFlow = (ctx) => ctx.eval(() => { window.__state.run.flow = window.__state.maxFlow; });

function at(id, level, run, patch = {}) {
    const s = chapterSave(level);
    return { id, level, ...prepareSave({ ...(s ? { replace: s } : { abilities: ABILITIES_AT[level] ?? [] }), stats: { forza: 0, costituzione: 45, flusso: 0 }, ...patch }), run };
}

const tag = (level, t) => waypoints(level).waypoints.find((w) => w.tag === t);

/** davanti al boss, ingaggiato, senza combatterlo ancora */
async function faceBoss(ctx, level, kind) {
    const w = tag(level, `boss:${kind}`);
    if (!w) throw new Error(`niente boss:${kind} in ${level}`);
    await teleport(ctx, w.x, w.y - 10);
    await ctx.wait(20);
    await resolveAll(ctx);
    for (let k = 0; k < 20; k++) {
        const s = await botState(ctx);
        if (s.boss?.engaged) break;
        if (s.boss) await teleport(ctx, s.boss.x - 140, s.boss.y);
        await ctx.wait(20);
        await resolveAll(ctx);
    }
}

/** tutte le wave addosso al boss, col pieno di flow prima di ognuna */
async function wavesOnBoss(ctx) {
    for (const keys of [[K.wave], [K.up, K.wave], [K.scudo], [K.riflesso], [K.down, K.wave]]) {
        const s = await botState(ctx);
        if (!s.boss || !s.p) return;
        await teleport(ctx, s.boss.x - 110, s.boss.y);
        await ctx.wait(4);
        await ctx.tap(K.right, 1);
        await fillFlow(ctx);
        await ctx.hold(keys, keys[0] === K.wave && keys.length === 1 ? 50 : 4);
        await ctx.wait(keys.length === 2 && keys[0] === K.up ? 140 : 50);
        await resolveAll(ctx);
    }
    // tre bottiglie di fila: le pozze sono al massimo due
    for (let i = 0; i < 3; i++) {
        await fillFlow(ctx);
        await ctx.hold([K.down, K.wave], 4);
        await ctx.wait(20);
    }
    // la bottiglia in aria cade dritta
    await ctx.tap(K.jump, 12);
    await ctx.hold([K.down, K.wave], 4);
    await ctx.wait(60);
}

/** aspetta un proiettile nemico vicino e alza lo scudo nel momento giusto */
async function parryShots(ctx, level, tries = 5) {
    const wp = waypoints(level).waypoints;
    let done = 0;
    for (const w of wp.slice(0, 40)) {
        if (done >= tries) break;
        await teleport(ctx, w.x, w.y - 10);
        await ctx.wait(30);
        await resolveAll(ctx);
        const near = await ctx.until(() => {
            const p = window.__h.find.player();
            return !!p && window.__h.bot.sprites(['proj-ball']).some((b) => Math.hypot(b.x - p.x, b.y - p.y) < 110);
        }, 240);
        if (!near) continue;
        await fillFlow(ctx);
        await ctx.tap(K.scudo, 2);
        await ctx.wait(160);
        done++;
    }
    ctx.mark(`rimandi tentati: ${done}`);
}

export default [
    // il rimando: perfetto (homing verso chi ha sparato) e normale, contro i tiratori
    ...['tecnokill', 'sorveglianza', 'nucleo'].map((level) => at(`rimando-${level}`, level, (ctx) => parryShots(ctx, level), { abilities: ALL_ABILITIES })),

    // lo schianto: da in alto sui muri rompibili e sui nidi
    ...['santuario', 'tana'].map((level) => at(`schianto-${level}`, level, async (ctx) => {
        await ctx.wait(20);
        await resolveAll(ctx);
        const walls = [];
        region(level).grid.forEach((runs, r) => {
            let c = 0;
            for (const [x, n] of runs) {
                if (x === '%') walls.push({ x: c * 32 + 16, y: r * 32 + 16 });
                c += n;
            }
        });
        for (const w of walls.filter((_, i) => i % 7 === 0).slice(0, 6)) {
            await teleport(ctx, w.x, w.y - 420);
            await ctx.wait(14);
            await ctx.hold([K.down, K.attack], 8);
            await ctx.wait(60);
            await resolveAll(ctx);
        }
    }, { abilities: ALL_ABILITIES })),

    // le wave contro i boss: analisi segna il boss, la pozza lo avvelena, il riflesso lo picchia
    ...[['bus', 'guggu'], ['santuario', 'breccio'], ['caso', 'limite'], ['sorveglianza', 'ombra'], ['cantina', 'ticummi']].map(([level, kind]) => at(`wave-boss-${kind}`, level, async (ctx) => {
        await ctx.wait(20);
        await resolveAll(ctx);
        await faceBoss(ctx, level, kind);
        for (let k = 0; k < 3; k++) await wavesOnBoss(ctx);
        await fight(ctx, { bossFrames: 4000 });
        await resolveAll(ctx);
    }, { abilities: ALL_ABILITIES, flags: ['ivan', 'indizio-1', 'indizio-2', 'indizio-3'] })),

    // guggu senza ivan: si taglia la porta, il boss respinge
    at('guggu-senza-ivan', 'bus', async (ctx) => {
        await ctx.wait(20);
        await resolveAll(ctx);
        await faceBoss(ctx, 'bus', 'guggu');
        await fight(ctx, { bossFrames: 900 });
        await resolveAll(ctx);
    }, { unflags: ['ivan'] }),

    // un boss battuto senza farsi toccare: il trofeo intoccabile
    at('boss-intoccabile', 'bus', async (ctx) => {
        await ctx.wait(20);
        await resolveAll(ctx);
        await faceBoss(ctx, 'bus', 'guggu');
        await fight(ctx, { bossFrames: 3000 });
        await ctx.wait(200);
        await resolveAll(ctx);
    }, { flags: ['ivan'], stats: { forza: 80, costituzione: 45, flusso: 0 } }),

    // l'ombra che legge: ogni abitudine ha la sua contromossa (premium e beta)
    ...[['premium', true], ['beta', false]].map(([name, premium]) => at(`ombra-${name}`, 'sorveglianza', async (ctx) => {
        await ctx.wait(20);
        await resolveAll(ctx);
        await faceBoss(ctx, 'sorveglianza', 'ombra');
        const spam = async (keys, n, hold = 3, gap = 12) => {
            for (let i = 0; i < n; i++) {
                const s = await botState(ctx);
                if (!s.boss || !s.p || s.p.dead) return;
                if (Math.abs(s.boss.x - s.p.x) > 200) await teleport(ctx, s.boss.x - 90, s.boss.y);
                await fillFlow(ctx);
                await ctx.hold(keys, hold);
                await ctx.wait(gap);
                await resolveAll(ctx);
            }
        };
        await spam([K.up, K.attack], 16);
        await spam([K.down, K.attack], 10, 3, 4);
        await spam([K.dash], 12, 3, 30);
        await spam([K.wave], 8, 50, 20);
        await spam([K.up, K.wave], 6, 4, 130);
        await spam([K.scudo], 6, 3, 60);
        await spam([K.riflesso], 6, 3, 60);
        await spam([K.down, K.wave], 6, 4, 40);
        await ctx.eval(() => { window.__state.run.hp = 2; window.__state.save.inventory.crocchetta = 6; });
        await spam([K.eat], 6, 3, 60);
        await fight(ctx, { bossFrames: 6000 });
        await resolveAll(ctx);
    }, { abilities: ALL_ABILITIES, flags: premium ? ['tommasorveglianza'] : [], ombra: { premium, sightings: premium ? 8 : 0 } })),

    // le uscite chiuse dalla trama: il toast e niente uscita
    // il boss vivo blocca prima della trama: per vedere il lucchetto della trama il boss del capitolo dev'essere giù
    ...[['ruhra', { flags: ['boss-down-riba'] }], ['void', { flags: ['boss-down-notturno', 'boss-down-modello', 'boss-down-revisore', 'boss-down-delegato', 'boss-down-garante'], unflags: ['void-concluso'] }], ['galliate', { unflags: ['boss-down-maranzone'] }], ['trenbolone', { unflags: ['trenbolone-attivo'] }]].map(([level, patch]) => at(`uscita-chiusa-${level}`, level, async (ctx) => {
        await ctx.wait(30);
        await resolveAll(ctx);
        const ex = waypoints(level).exit;
        for (let i = 0; i < 3; i++) {
            await teleport(ctx, ex.x, ex.y - 12);
            await ctx.wait(200);
            await resolveAll(ctx);
        }
    }, patch)),

    // l'arena di lametta: si resta dentro e la pittura evoca i suoi mostri prima delle gocce
    at('lametta-attesa', 'santuario', async (ctx) => {
        await ctx.wait(20);
        await resolveAll(ctx);
        const w = tag('santuario', 'npc:lametta-arena');
        await teleport(ctx, w.x - 100, w.y - 10);
        await ctx.wait(30);
        await resolveAll(ctx);
        for (let k = 0; k < 8; k++) {
            await ctx.wait(120);
            await resolveAll(ctx);
            await ctx.tap(K.attack, 3);
        }
    }),

    // il flauto quando sei già fatto di trenbolone
    at('flauto-fatto', 'trenbolone', async (ctx) => {
        await ctx.wait(20);
        await resolveAll(ctx);
        await faceBoss(ctx, 'trenbolone', 'flauto');
        await fight(ctx, { bossFrames: 6000 });
        await ctx.wait(200);
        await resolveAll(ctx);
    }, { flags: ['trenbolone-attivo'] }),

    // il rio che cura due volte: la prima con la scena, la seconda col toast
    at('rio-cura', 'rio', async (ctx) => {
        await ctx.wait(20);
        await resolveAll(ctx);
        const water = [];
        region('rio').grid.forEach((runs, r) => {
            let c = 0;
            for (const [x, n] of runs) {
                if (x === '~') water.push({ x: (c + Math.floor(n / 2)) * 32 + 16, y: r * 32 + 16 });
                c += n;
            }
        });
        for (let k = 0; k < 2 && water.length; k++) {
            await ctx.eval(() => { window.__state.run.trenbolone = true; });
            const w = water[Math.floor(water.length / 2)];
            await teleport(ctx, w.x, w.y - 20);
            await ctx.wait(60);
            await resolveAll(ctx);
            await teleport(ctx, w.x + 300, w.y - 300);
            await ctx.wait(30);
        }
        ctx.mark(`acqua: ${water.length} celle`);
    }, { flags: ['trenbolone-attivo'], unflags: ['rio-curato'] }),

    // il 33 del void evocato e battuto (forte: è il più forte dei miniboss)
    at('trentatre', 'void', async (ctx) => {
        await ctx.wait(20);
        await resolveAll(ctx);
        const w = tag('void', 'npc:sfida-33');
        await teleport(ctx, w.x, w.y - 10);
        await ctx.wait(10);
        await ctx.tap(K.interact, 3);
        await ctx.wait(10);
        await resolveAll(ctx, { policy: policy([/il 33 pulsa/, 0]) });
        await fight(ctx, { bossFrames: 15000, policy: policy([/il 33 pulsa/, 0]) });
        await ctx.wait(240);
        await resolveAll(ctx);
    }, { stats: { forza: 20, costituzione: 300, flusso: 0 } }),

    // il pedro del doomsday respinto: il boss di turno torna al suo posto
    at('doomsday-respinto', 'bus', async (ctx) => {
        await ctx.wait(40);
        for (let k = 0; k < 40; k++) {
            await ctx.wait(60);
            await resolveAll(ctx);
            if ((await botState(ctx)).boss?.kind === 'pedro') break;
        }
        await fight(ctx, { bossFrames: 15000 });
        await ctx.wait(240);
        await resolveAll(ctx);
        ctx.mark(`dopo: boss ${(await botState(ctx)).boss?.kind ?? '-'}`);
    }, { stats: { forza: 20, costituzione: 300, flusso: 0 }, set: { doomsdayMode: true, doomsday: 0.995 } }),

    // il citelis: da una fermata a un'altra regione e ritorno
    at('viaggio', 'rio', async (ctx) => {
        await ctx.wait(20);
        await resolveAll(ctx);
        const mics = [];
        region('rio').grid.forEach((runs, r) => {
            let c = 0;
            for (const [x, n] of runs) {
                if (x === 'C') for (let i = 0; i < n; i++) mics.push({ x: (c + i) * 32 + 16, y: r * 32 + 16 });
                c += n;
            }
        });
        for (const pick of [0, 2]) {
            const s = await botState(ctx);
            const m = s.level === 'rio' ? mics[0] : null;
            if (m) await teleport(ctx, m.x + 58, m.y - 14);
            else {
                const stop = (await ctx.eval(() => window.__h.bot.sprites(['busstop', 'prop-']))).find((x) => x.key.includes('busstop'));
                if (stop) await teleport(ctx, stop.x, stop.y - 40);
            }
            await ctx.wait(10);
            await ctx.tap(K.interact, 3);
            await ctx.wait(10);
            await resolveAll(ctx, { policy: [[/^citelis$/, pick], ...DEFAULT_CHOICES] });
            await ctx.wait(120);
            await resolveAll(ctx);
            ctx.mark(`dopo il viaggio: ${(await botState(ctx)).level}`);
        }
    }, { flags: ['boss-down-guggu'], set: { stops: ['perduta:cp-13-21', 'bus:cp-13-23', 'rio:cp-19-23'] } }),

    // il riflesso senza flow per lo scambio
    at('riflesso-senza-flow', 'tecnokill', async (ctx) => {
        await ctx.wait(20);
        await fillFlow(ctx);
        await ctx.tap(K.riflesso, 3);
        await ctx.wait(20);
        await ctx.eval(() => { window.__state.run.flow = 0; });
        await ctx.tap(K.riflesso, 3);
        await ctx.wait(60);
    }, { abilities: ALL_ABILITIES }),

    // doomsday senza boss nel capitolo, e un boss di wave battuto che lo ricaccia indietro
    at('doomsday-senza-boss', 'perduta', async (ctx) => {
        await ctx.wait(40 * 60);
        await resolveAll(ctx);
    }, { set: { doomsdayMode: true, doomsday: 0.997 } }),
    at('doomsday-sollievo', 'bus', async (ctx) => {
        await ctx.wait(20);
        await resolveAll(ctx);
        await faceBoss(ctx, 'bus', 'guggu');
        await fight(ctx, { bossFrames: 6000 });
        await ctx.wait(200);
        await resolveAll(ctx);
    }, { flags: ['ivan'], set: { doomsdayMode: true, doomsday: 0.5 } }),

    // gli agguati di notino col geco che gli ha preso lo sparacchino, e il rio che cura due volte
    at('agguato-vendetta', 'rio', async (ctx) => {
        await ctx.wait(20);
        await resolveAll(ctx);
        for (const w of waypoints('rio').waypoints.filter((_, i) => i % 3 === 0)) {
            await teleport(ctx, w.x, w.y - 10);
            await ctx.wait(10);
            await resolveAll(ctx);
        }
    }, { flags: ['notino-disarmato', 'trenbolone-attivo', 'rio-curato'], unflags: ['notino-variante-detta'] }),

    // la scelta di pedro senza aver visto i ricordi
    at('pedro-senza-ricordi', 'nucleo', async (ctx) => {
        await ctx.wait(20);
        await resolveAll(ctx);
        await faceBoss(ctx, 'nucleo', 'pedro');
        await ctx.wait(60);
        await resolveAll(ctx, { policy: policy([/pedro aspetta/, 1]) });
        await fight(ctx, { bossFrames: 2000 });
    }, { unflags: ['ricordi-visti'] }),
];
