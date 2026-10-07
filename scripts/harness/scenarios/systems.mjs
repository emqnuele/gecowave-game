// i sistemi uno per uno: abilità in combattimento, morte e barre, cibo, telefono, pausa e menu, piazza, arene, corse, doomsday.
import { ALL_ABILITIES, botState, chapterSave, DEFAULT_CHOICES, K, prepareSave, region, teleport, ui, waitLevel } from '../lib.mjs';
import { collect, fight, resolveAll } from '../bot.mjs';

const policy = (...rules) => [...rules, ...DEFAULT_CHOICES];
const strong = { stats: { forza: 0, costituzione: 45, flusso: 0 } };
const fillFlow = (ctx) => ctx.eval(() => { window.__state.run.flow = window.__state.maxFlow; });

/** le celle di una lettera nella griglia della regione, in pixel al centro */
function cells(level, ch) {
    const out = [];
    region(level).grid.forEach((runs, r) => {
        let c = 0;
        for (const [x, n] of runs) {
            if (x === ch) for (let i = 0; i < n; i++) out.push({ x: (c + i) * 32 + 16, y: r * 32 + 16 });
            c += n;
        }
    });
    return out;
}

/** vicino al primo gruppo di nemici svegli; ritorna il più vicino */
async function nearEnemies(ctx, level) {
    const wp = (await import('../lib.mjs')).waypoints(level).waypoints;
    for (const w of wp) {
        await teleport(ctx, w.x, w.y - 10);
        await ctx.wait(10);
        await resolveAll(ctx);
        const es = await ctx.eval(() => window.__h.bot.enemies(420));
        if (es.length) return es[0];
    }
    return null;
}

/** combatte i nemici vicini con tasti veri; ritorna quanti ne restano */
export async function fightEnemies(ctx, frames = 1800, r = 700) {
    const end = ctx.f + frames;
    while (ctx.f < end) {
        await resolveAll(ctx);
        const s = await botState(ctx);
        if (!s.p || s.p.dead || s.status !== 5) {
            await ctx.wait(10);
            continue;
        }
        const es = await ctx.eval((r) => window.__h.bot.enemies(r), r);
        if (!es.length) return 0;
        const e = es[0];
        const dx = e.x - s.p.x;
        if (Math.abs(dx) > 260 || Math.abs(e.y - s.p.y) > 160) {
            await teleport(ctx, e.x - (Math.sign(dx) || 1) * 70, e.y - 10);
            await ctx.wait(8);
            continue;
        }
        await ctx.tap(dx > 0 ? K.right : K.left, 2);
        if (e.y < s.p.y - 60) {
            await ctx.tap(K.jump, 8);
            await ctx.hold([K.up, K.attack], 3);
        } else await ctx.tap(K.attack, 3);
        await ctx.wait(6);
    }
    return (await ctx.eval((r) => window.__h.bot.enemies(r), r)).length;
}

/** un giro di tutte le wave addosso ai nemici: ogni colpo coi suoi tasti veri */
async function waves(ctx) {
    await fillFlow(ctx);
    // risonante: eco (tocco), onda (650 ms), piena (1400 ms)
    await ctx.tap(K.wave, 3);
    await ctx.wait(30);
    await ctx.hold([K.wave], 45);
    await ctx.wait(30);
    await fillFlow(ctx);
    await ctx.hold([K.wave], 95);
    await ctx.wait(40);
    // riflesso e scambio
    await fillFlow(ctx);
    await ctx.tap(K.riflesso, 3);
    await ctx.wait(50);
    await ctx.tap(K.riflesso, 3);
    await ctx.wait(60);
    // analisi in tre tempi
    await fillFlow(ctx);
    await ctx.hold([K.up, K.wave], 4);
    await ctx.wait(160);
    // scudo
    await fillFlow(ctx);
    await ctx.tap(K.scudo, 3);
    await ctx.wait(100);
    // bottiglia a terra (lancio) e in aria (caduta)
    await fillFlow(ctx);
    await ctx.hold([K.down, K.wave], 4);
    await ctx.wait(80);
    await ctx.tap(K.jump, 10);
    await ctx.hold([K.down, K.wave], 4);
    await ctx.wait(120);
    // scivolata attraverso, pogo e schianto
    await ctx.hold([K.right], 6);
    await ctx.tap(K.dash, 3);
    await ctx.wait(30);
    await ctx.tap(K.jump, 14);
    await ctx.hold([K.down, K.attack], 4);
    await ctx.wait(40);
}

function atLevel(id, level, run, { patch = {}, save = true } = {}) {
    const s = save ? chapterSave(level) : null;
    return { id, level, ...prepareSave({ ...(s ? { replace: s } : {}), ...strong, ...patch }), run };
}

/** la tappa con quell'etichetta (npc:..., boss:..., lore:...) */
async function toTag(ctx, level, tag) {
    const w = (await import('../lib.mjs')).waypoints(level).waypoints.find((x) => x.tag === tag);
    if (!w) throw new Error(`niente tappa ${tag} in ${level}`);
    await teleport(ctx, w.x, w.y - 10);
    await ctx.wait(10);
    return w;
}

export default [
    // uscire al menu a metà film: niente stato globale appeso (godMode, didascalia, musica bassa)
    atLevel('film-uscita', 'caso', async (ctx) => {
        await ctx.wait(30);
        await resolveAll(ctx);
        await toTag(ctx, 'caso', 'npc:indizio-1');
        await ctx.tap(K.interact, 3);
        await ctx.wait(180);
        ctx.mark(`film: ${(await ui(ctx)).film}`);
        await ctx.tap(K.pause, 2);
        await ctx.wait(30);
        const items = await ctx.eval(() => window.__h.bot.labels('.screen [data-nav]'));
        const quit = items.findIndex((x) => /esci al menu/.test(x));
        if (quit >= 0) await ctx.eval((i) => window.__h.bot.click('.screen [data-nav]', i), quit);
        await ctx.wait(60);
        await ctx.tap('Enter', 2);
        await ctx.wait(120);
        const menu = await ctx.eval(() => window.__h.bot.labels('.screen [data-nav]'));
        ctx.mark(`menu: ${menu.join(' | ')}`);
        const cont = menu.findIndex((x) => /continua/.test(x));
        if (cont >= 0) await ctx.eval((i) => window.__h.bot.click('.screen [data-nav]', i), cont);
        await waitLevel(ctx);
        await ctx.wait(200);
        await resolveAll(ctx);
    }, { patch: { unflags: ['indizio-1'] } }),

    // un film saltato e uno guardato fino in fondo, e un secondo indizio mentre il primo gira
    atLevel('film-coda', 'caso', async (ctx) => {
        await ctx.wait(30);
        await resolveAll(ctx);
        await toTag(ctx, 'caso', 'npc:indizio-2');
        await ctx.tap(K.interact, 3);
        await ctx.wait(120);
        await toTag(ctx, 'caso', 'npc:indizio-3');
        await ctx.tap(K.interact, 3);
        await ctx.wait(60);
        await resolveAll(ctx, { film: 'watch' });
        await resolveAll(ctx, { film: 'skip' });
        await ctx.wait(200);
        await resolveAll(ctx);
    }, { patch: { unflags: ['indizio-2', 'indizio-3'] } }),

    // pausa subito dopo un colpo andato a segno: la fisica non resta al rallentatore
    atLevel('colpo-pausa', 'tecnokill', async (ctx) => {
        for (let k = 0; k < 4; k++) {
            const e = await nearEnemies(ctx, 'tecnokill');
            if (!e) break;
            await teleport(ctx, e.x - 40, e.y - 10);
            await ctx.tap(K.right, 1);
            await ctx.tap(K.attack, 2);
            await ctx.tap(K.pause, 1);
            await ctx.wait(20);
            await ctx.tap('Escape', 2);
            await ctx.wait(30);
        }
    }),

    // le wave contro i nemici di regioni diverse (corazze, scudi, volanti, torrette)
    ...['bus', 'tecnokill', 'rio', 'stabilimento', 'caso', 'cantina', 'void'].map((level) => atLevel(`wave-${level}`, level, async (ctx) => {
        for (let round = 0; round < 3; round++) {
            const e = await nearEnemies(ctx, level);
            if (!e) break;
            await waves(ctx);
            await fightEnemies(ctx, 600);
        }
    }, { patch: { abilities: ALL_ABILITIES } })),

    // lo schianto sui muri rompibili e il pogo dall'alto
    atLevel('schianto', 'santuario', async (ctx) => {
        const walls = cells('santuario', '%').slice(0, 30);
        for (const w of walls.filter((_, i) => i % 3 === 0)) {
            await teleport(ctx, w.x, w.y - 260);
            await ctx.wait(4);
            await ctx.hold([K.down, K.attack], 6);
            await ctx.wait(50);
            await resolveAll(ctx);
        }
    }),

    // morte, barre lasciate e riprese, poi la seconda morte e l'uscita al menu con "continua"
    atLevel('morte-barre', 'perduta', async (ctx) => {
        for (let k = 0; k < 2; k++) {
            await nearEnemies(ctx, 'perduta');
            for (let i = 0; i < 120; i++) {
                const s = await botState(ctx);
                if (s.p?.dead || (await ui(ctx)).screen) break;
                const es = await ctx.eval(() => window.__h.bot.enemies(600));
                if (es[0]) await teleport(ctx, es[0].x, es[0].y - 10);
                await ctx.wait(20);
            }
            await ctx.wait(160);
            const u = await ui(ctx);
            ctx.mark(`morte ${k}: ${u.screen?.title ?? '-'}`);
            if (k === 0) {
                await resolveAll(ctx, { death: 0 });
                await waitLevel(ctx);
                await ctx.wait(30);
                await ctx.until(() => window.__h.bot.pickups(99999).some((p) => p.key === 'drop-ghost'), 30);
                const ghost = (await ctx.eval(() => window.__h.bot.pickups(99999))).find((p) => p.key === 'drop-ghost');
                if (ghost) await teleport(ctx, ghost.x, ghost.y);
                await ctx.wait(30);
            } else {
                await resolveAll(ctx, { death: 1 });
                await ctx.wait(120);
                // dal menu: "continua" riparte dal microfono salvato
                const items = await ctx.eval(() => window.__h.bot.labels('.screen [data-nav]'));
                ctx.mark(`menu: ${items.join(' | ')}`);
                const i = items.findIndex((x) => /continua/.test(x));
                if (i >= 0) await ctx.eval((i) => window.__h.bot.click('.screen [data-nav]', i), i);
                await waitLevel(ctx);
                await ctx.wait(120);
            }
        }
    }, { patch: { set: { barre: 77 }, stats: { forza: 0, costituzione: 0, flusso: 0 } } }),

    // caduta nel vuoto sotto la mappa
    atLevel('caduta', 'perduta', async (ctx) => {
        await ctx.wait(30);
        const h = region('perduta').grid.length * 32;
        await teleport(ctx, 600, h + 3200);
        await ctx.wait(200);
        await resolveAll(ctx);
        await ctx.wait(60);
    }),

    // spine: danno e rientro sull'ultima posizione sicura
    atLevel('spine', 'santuario', async (ctx) => {
        for (const sp of cells('santuario', '^').filter((_, i) => i % 9 === 0).slice(0, 6)) {
            await teleport(ctx, sp.x, sp.y - 40);
            await ctx.wait(60);
            await resolveAll(ctx);
        }
    }),

    // il cibo: il canale da 700 ms, intero e interrotto dal danno
    atLevel('cibo', 'tecnokill', async (ctx) => {
        await ctx.wait(30);
        await ctx.eval(() => { window.__state.run.hp = 2; });
        await ctx.tap(K.eat, 3);
        await ctx.wait(80);
        await ctx.tap(K.eat, 3);
        await ctx.wait(80);
        const e = await nearEnemies(ctx, 'tecnokill');
        if (e) {
            for (let i = 0; i < 6; i++) {
                await ctx.tap(K.eat, 3);
                await ctx.wait(30);
            }
        }
        await ctx.wait(60);
        await resolveAll(ctx);
        // zaino vuoto
        await ctx.eval(() => { for (const k of Object.keys(window.__state.save.inventory)) delete window.__state.save.inventory[k]; });
        await ctx.tap(K.eat, 3);
        await ctx.wait(30);
    }, { patch: { inventory: { crocchetta: 3, 'panino-nonna': 2 } } }),

    // il telefono: ogni app, qualche tocco dentro ciascuna, vicino a un microfono per gli amuleti
    atLevel('telefono', 'cantina', async (ctx) => {
        const mic = cells('cantina', 'C')[0];
        if (mic) await teleport(ctx, mic.x, mic.y - 12);
        await ctx.wait(40);
        await resolveAll(ctx);
        await ctx.tap(K.phone, 2);
        await ctx.wait(30);
        const apps = await ctx.eval(() => window.__h.bot.labels('.phone .phone-app'));
        ctx.mark(`app: ${apps.join(',')}`);
        for (let a = 0; a < apps.length; a++) {
            await ctx.eval((a) => window.__h.bot.click('.phone .phone-app', a), a);
            await ctx.wait(20);
            for (let b = 0; b < 4; b++) {
                const ok = await ctx.eval((b) => {
                    const all = [...document.querySelectorAll('.phone .phone-body button, .phone .phone-body [role=button]')].filter((x) => !x.classList.contains('phone-back'));
                    if (!all[b]) return false;
                    all[b].click();
                    return true;
                }, b);
                await ctx.wait(15);
                if (!ok) break;
            }
            await ctx.tap('Escape', 2);
            await ctx.wait(10);
            await ctx.eval(() => window.__h.bot.click('.phone .phone-home-bar'));
            await ctx.wait(15);
        }
        await ctx.tap(K.phone, 2);
        await ctx.wait(60);
        await resolveAll(ctx);
        await ctx.wait(120);
    }, { patch: { set: { barre: 500 }, inventory: { crocchetta: 2 } } }),

    // pausa: tutte le voci, poi esci al menu e rientra con continua
    atLevel('pausa', 'ruhra', async (ctx) => {
        await ctx.wait(60);
        await resolveAll(ctx);
        await ctx.tap(K.pause, 2);
        await ctx.wait(30);
        const items = await ctx.eval(() => window.__h.bot.labels('.screen [data-nav]'));
        ctx.mark(`pausa: ${items.join(' | ')}`);
        for (let i = 0; i < items.length; i++) {
            if (/esci|menu|riprendi|continua/.test(items[i])) continue;
            await ctx.eval((i) => window.__h.bot.click('.screen [data-nav]', i), i);
            await ctx.wait(30);
            const sub = await ctx.eval(() => window.__h.bot.labels('.screen [data-nav]'));
            ctx.mark(`  ${items[i]}: ${sub.join(' | ')}`);
            await ctx.tap('Escape', 2);
            await ctx.wait(20);
            if (!(await ui(ctx)).screen) {
                await ctx.tap(K.pause, 2);
                await ctx.wait(20);
            }
        }
        const now = await ctx.eval(() => window.__h.bot.labels('.screen [data-nav]'));
        const quit = now.findIndex((x) => /esci al menu/.test(x));
        if (quit >= 0) await ctx.eval((i) => window.__h.bot.click('.screen [data-nav]', i), quit);
        await ctx.wait(120);
        const menu = await ctx.eval(() => window.__h.bot.labels('.screen [data-nav]'));
        ctx.mark(`menu: ${menu.join(' | ')}`);
        const cont = menu.findIndex((x) => /continua/.test(x));
        if (cont >= 0) await ctx.eval((i) => window.__h.bot.click('.screen [data-nav]', i), cont);
        await waitLevel(ctx);
        await ctx.wait(120);
    }),

    // la piazza: ogni personaggio, la bottega, l'oracolo, la bacheca e il bar
    atLevel('piazza', 'piazza', async (ctx) => {
        await ctx.wait(40);
        await resolveAll(ctx, { policy: policy([/bottega/, 0], [/biglietto sulla sua scrivania/, 0]) });
        const npcs = await ctx.eval(() => window.__h.bot.sprites(['npc-', 'mic', 'lore-']));
        ctx.mark(`piazza: ${npcs.length} da visitare`);
        for (const [i, n] of npcs.entries()) {
            await teleport(ctx, n.x + (i % 2 ? 20 : -20), n.y - 6);
            await ctx.wait(8);
            await ctx.tap(K.interact, 3);
            await ctx.wait(6);
            await resolveAll(ctx, { policy: policy([/bottega/, i % 3], [/biglietto sulla sua scrivania/, 0]) });
        }
        await ctx.wait(60);
    }, { save: false, patch: { abilities: ['scivolata', 'rimbalzo', 'riflesso', 'risonante'], flags: ['boss-down-guggu', 'notino-a-casa', 'ospite-12-libero', 'caso-risolto', 'visto-perduta', 'visto-bus', 'visto-rio'], lore: ['nota-caso-1'], set: { barre: 2000 } } }),

    // il microfono rosso: tre ondate a porte chiuse, vinte coi tasti veri
    ...[['perduta', null], ['rio', 'formicona'], ['ruhra', 'riba']].map(([level, boss]) => atLevel(`arena-${level}`, level, async (ctx) => {
        await ctx.wait(20);
        await resolveAll(ctx);
        // il microfono rosso è l'unico microfono tinto di rosso
        const mic = (await ctx.eval(() => window.__h.bot.sprites(['mic']))).find((m) => m.tint === 0xef4444);
        ctx.mark(`arena trovata: ${!!mic}`);
        if (!mic) return;
        await teleport(ctx, mic.x + 30, mic.y);
        await ctx.wait(10);
        await ctx.tap(K.interact, 3);
        await ctx.wait(6);
        await resolveAll(ctx, { policy: policy([/microfono rosso/, 0]) });
        await fillFlow(ctx);
        for (let k = 0; k < 10; k++) {
            await ctx.wait(90);
            await fightEnemies(ctx, 1500, 1200);
            const flags = await ctx.eval(() => window.__h.bot.flags());
            if (flags.includes(`arena-vinta-${level}`)) break;
        }
        await ctx.wait(120);
        await resolveAll(ctx);
        // di nuovo: il microfono rosso tace
        await teleport(ctx, mic.x + 30, mic.y);
        await ctx.wait(10);
        await ctx.tap(K.interact, 3);
        await ctx.wait(30);
    }, { patch: boss ? { flags: [`boss-down-${boss}`] } : { stats: { forza: 0, costituzione: 0, flusso: 0 } } })),

    // la corsa contro il citelis: presa e vinta, presa e persa
    ...[['corsa-vinta', 'bus', true], ['corsa-persa', 'rio', false]].map(([id, level, win]) => atLevel(id, level, async (ctx) => {
        const trials = region(level).layout.trials ?? [];
        const mics = cells(level, 'C');
        let started = false;
        for (const m of mics) {
            for (const dx of [-90, -60, 90, 130]) {
                await teleport(ctx, m.x + dx, m.y - 12);
                await ctx.wait(4);
                await ctx.tap(K.interact, 3);
                await ctx.wait(4);
                const u = await ui(ctx);
                if (u.screen && /orario del citelis/.test(u.screen.title)) {
                    await resolveAll(ctx, { policy: policy([/orario del citelis/, 0]) });
                    started = true;
                    break;
                }
                await resolveAll(ctx);
            }
            if (started) break;
        }
        ctx.mark(`corsa trovata: ${started}`);
        if (!started) return;
        if (win) {
            // la fermata d'arrivo è una delle tratte misurate: si prova ad andare su ognuna
            for (const t of trials) {
                const [, c, r] = String(t.to).split('-').map(Number);
                await teleport(ctx, c * 32 + 16 + 58, r * 32 - 14);
                await ctx.wait(20);
                await resolveAll(ctx);
            }
        } else {
            await ctx.wait(80 * 60);
        }
        await resolveAll(ctx);
        await ctx.wait(120);
    })),

    // il doomsday: avvisi, glitch selvaggi, e pedro che arriva al posto del boss di turno
    atLevel('doomsday-avvisi', 'tecnokill', async (ctx) => {
        await ctx.wait(40 * 60);
        await resolveAll(ctx);
        await nearEnemies(ctx, 'tecnokill');
        await ctx.wait(30 * 60);
    }, { patch: { set: { doomsdayMode: true, doomsday: 0.443 } } }),
    atLevel('doomsday-collasso', 'bus', async (ctx) => {
        await ctx.wait(40);
        for (let k = 0; k < 40; k++) {
            await ctx.wait(60);
            await resolveAll(ctx);
            const s = await botState(ctx);
            if (s.boss?.kind === 'pedro') break;
        }
        const r = await fight(ctx, { bossFrames: 15000 });
        ctx.mark(`pedro del doomsday: ${r}`);
        await resolveAll(ctx);
        await ctx.wait(240);
        const s = await botState(ctx);
        ctx.mark(`dopo: boss ${s.boss?.kind ?? '-'}`);
    }, { patch: { set: { doomsdayMode: true, doomsday: 0.995 } } }),
];
