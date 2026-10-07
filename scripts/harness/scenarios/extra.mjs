// i sistemi che la campagna non tocca: sigilli delle wave, nidi, nascondigli della tana, freccia guida, gamepad.
import { ALL_ABILITIES, botState, chapterSave, K, prepareSave, region, teleport, waypoints } from '../lib.mjs';
import { collect, resolveAll } from '../bot.mjs';
import { ABILITIES_AT } from './levels.mjs';

const fillFlow = (ctx) => ctx.eval(() => { window.__state.run.flow = window.__state.maxFlow; });

function at(id, level, run, patch = {}) {
    const s = chapterSave(level);
    return { id, level, ...prepareSave({ ...(s ? { replace: s } : { abilities: ABILITIES_AT[level] ?? [] }), stats: { forza: 0, costituzione: 45, flusso: 0 }, ...patch }), run };
}

/** la mossa che apre ogni tipo di sigillo, fatta coi tasti veri guardando verso il varco */
async function solve(ctx, kind, dir) {
    const toward = dir > 0 ? K.right : K.left;
    await fillFlow(ctx);
    await ctx.tap(toward, 2);
    switch (kind) {
        case 'cortina':
            await ctx.hold([toward], 4);
            await ctx.tap(K.dash, 3);
            await ctx.wait(30);
            break;
        case 'risonanza':
            await ctx.tap(K.wave, 3);
            await ctx.wait(30);
            await ctx.hold([K.wave], 45);
            await ctx.wait(60);
            break;
        case 'specchio':
            await ctx.tap(K.riflesso, 3);
            await ctx.wait(90);
            break;
        case 'resina':
        case 'miasma':
            await ctx.hold([K.down, K.wave], 4);
            await ctx.wait(90);
            break;
        case 'teorema':
            await ctx.hold([K.up, K.wave], 4);
            await ctx.wait(150);
            break;
        case 'ricevitore':
            for (let i = 0; i < 3; i++) {
                await ctx.tap(K.scudo, 3);
                await ctx.wait(120);
            }
            break;
        default:
            await ctx.wait(20);
    }
}

const SEALS = [];
for (const level of ['perduta', 'bus', 'santuario', 'trenbolone', 'rio', 'ruhra', 'sorveglianza']) {
    for (const seal of region(level).layout.seals ?? []) SEALS.push({ level, seal });
}

export default [
    // ogni sigillo: prima senza l'abilità (il 33 spento), poi con, da entrambi i lati; poi il premio
    ...SEALS.map(({ level, seal }) => at(`sigillo-${seal.id}`, level, async (ctx) => {
        const d = seal.door;
        const cx = d.axis === 'h' ? d.x * 32 : (d.x + d.len / 2) * 32;
        const cy = d.axis === 'h' ? (d.y - 1) * 32 : d.y * 32 - 40;
        await ctx.wait(20);
        await resolveAll(ctx);
        for (const side of [-1, 1]) {
            await teleport(ctx, cx + side * 110, cy - 10);
            await ctx.wait(30);
            await resolveAll(ctx);
            await solve(ctx, seal.kind, -side);
            await resolveAll(ctx);
        }
        await teleport(ctx, seal.reward.c * 32 + 16, seal.reward.r * 32 + 4);
        await ctx.wait(60);
        await collect(ctx, {}, 400);
        await resolveAll(ctx);
        await ctx.wait(60);
    }, { abilities: ALL_ABILITIES })),

    // i nidi: si rompono a colpi
    ...['rio', 'stabilimento', 'cantina'].map((level) => at(`nidi-${level}`, level, async (ctx) => {
        await ctx.wait(20);
        await resolveAll(ctx);
        const wp = waypoints(level).waypoints;
        let broken = 0;
        for (const w of wp.filter((_, i) => i % 6 === 0)) {
            await teleport(ctx, w.x, w.y - 10);
            await ctx.wait(6);
            const nests = await ctx.eval(() => window.__h.bot.sprites(['spawner-nest']));
            const p = (await botState(ctx)).p;
            const n = nests.find((x) => p && Math.hypot(x.x - p.x, x.y - p.y) < 1400);
            if (!n) continue;
            await teleport(ctx, n.x - 50, n.y - 20);
            await ctx.wait(10);
            for (let i = 0; i < 16; i++) {
                await ctx.tap(K.right, 1);
                await ctx.tap(K.attack, 3);
                await ctx.wait(10);
                await resolveAll(ctx);
            }
            if (++broken >= 2) break;
        }
        ctx.mark(`nidi provati: ${broken}`);
        await ctx.wait(60);
    }, { abilities: ALL_ABILITIES })),

    // la tana: la caccia di lochef, l'armadio, la casa che ti sente
    at('tana-armadio', 'tana', async (ctx) => {
        await ctx.wait(40);
        await resolveAll(ctx);
        const wp = waypoints('tana').waypoints;
        const start = wp.find((w) => w.tag === 'npc:caccia-inizio');
        if (start) await teleport(ctx, start.x + 40, start.y - 10);
        await ctx.wait(20);
        await resolveAll(ctx);
        for (let k = 0; k < 2; k++) {
            const closets = await ctx.eval(() => window.__h.bot.sprites(['tana-armadio']));
            const p = (await botState(ctx)).p;
            const c = closets.sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
            ctx.mark(`armadi: ${closets.length}`);
            if (!c) break;
            await teleport(ctx, c.x, c.y - 30);
            await ctx.wait(6);
            await ctx.tap(K.interact, 3);
            // oltre 6 s dentro la casa ti sente
            await ctx.wait(k === 0 ? 120 : 420);
            await resolveAll(ctx);
            await ctx.tap(K.right, 4);
            await ctx.wait(60);
            await resolveAll(ctx);
        }
        await ctx.wait(120);
        await resolveAll(ctx);
    }),

    // la freccia guida accesa: la partita diventa assistita per sempre
    ...['perduta', 'santuario', 'void'].map((level) => at(`guida-${level}`, level, async (ctx) => {
        await ctx.wait(20);
        await resolveAll(ctx);
        const wp = waypoints(level).waypoints;
        for (const w of wp.filter((_, i) => i % 10 === 0)) {
            await teleport(ctx, w.x, w.y - 10);
            await ctx.wait(20);
            await resolveAll(ctx);
        }
    }, { settings: { guide: true, screenShake: false } })),

    // il gamepad: levetta, salto, attacco, interagisci con su da fermo, pausa
    at('gamepad', 'perduta', async (ctx) => {
        await ctx.eval(() => {
            const btn = () => ({ pressed: false, touched: false, value: 0 });
            const pad = { id: 'pad di prova (STANDARD GAMEPAD)', index: 0, connected: true, mapping: 'standard', timestamp: 0, buttons: Array.from({ length: 17 }, btn), axes: [0, 0, 0, 0], vibrationActuator: null };
            window.__pad = pad;
            navigator.getGamepads = () => [pad, null, null, null];
            const ev = new Event('gamepadconnected');
            Object.defineProperty(ev, 'gamepad', { value: pad });
            window.dispatchEvent(ev);
        });
        const press = async (i, frames = 4) => {
            await ctx.eval((i) => { const b = window.__pad.buttons[i]; b.pressed = true; b.value = 1; window.__pad.timestamp++; }, i);
            await ctx.wait(frames);
            await ctx.eval((i) => { const b = window.__pad.buttons[i]; b.pressed = false; b.value = 0; window.__pad.timestamp++; }, i);
        };
        const stick = (x, y) => ctx.eval(([x, y]) => { window.__pad.axes[0] = x; window.__pad.axes[1] = y; window.__pad.timestamp++; }, [x, y]);
        await ctx.wait(30);
        await stick(1, 0);
        await ctx.wait(60);
        await press(0, 10);
        await ctx.wait(20);
        await press(2, 3);
        await ctx.wait(20);
        await stick(0, 0);
        await ctx.wait(30);
        const npc = waypoints('perduta').waypoints.find((w) => w.tag === 'npc:markolino-intro');
        if (npc) await teleport(ctx, npc.x, npc.y - 10);
        await ctx.wait(30);
        await press(12, 4);
        await ctx.wait(30);
        await resolveAll(ctx);
        await press(9, 4);
        await ctx.wait(40);
        await ctx.tap('Escape', 2);
        await ctx.wait(40);
        await resolveAll(ctx);
    }),
];
