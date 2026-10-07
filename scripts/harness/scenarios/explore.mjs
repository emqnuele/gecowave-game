// ogni regione per intero: tutti i punti verificati, tutti i microfoni e le fermate, "interagisci" ovunque.
// trova le note, le pagine di pedro, le missioni, i sigilli, le corse, il microfono rosso, il 100% della mappa.
import { botState, chapterSave, K, prepareSave, region, teleport } from '../lib.mjs';
import { collect, resolveAll } from '../bot.mjs';
import { ABILITIES_AT } from './levels.mjs';

const REGIONS = ['perduta', 'bus', 'santuario', 'tecnokill', 'trenbolone', 'tana', 'rio', 'stabilimento', 'ruhra', 'mente', 'caso', 'sorveglianza', 'cantina', 'ricordi', 'void', 'nucleo', 'barrato', 'custode', 'galliate', 'marcetti'];

/** le celle di una lettera nella griglia della regione */
function cells(level, ch) {
    const f = region(level);
    const out = [];
    f.grid.forEach((runs, r) => {
        let c = 0;
        for (const [x, n] of runs) {
            if (x === ch) for (let i = 0; i < n; i++) out.push([c + i, r]);
            c += n;
        }
    });
    return out;
}

export function explore(level, { policy, film = 'skip', patch = {} } = {}) {
    const save = chapterSave(level);
    return {
        id: `esplora-${level}`,
        level,
        ...prepareSave({ ...(save ? { replace: save } : { abilities: ABILITIES_AT[level] ?? [] }), stats: { forza: 0, costituzione: 45, flusso: 0 }, ...patch }),
        async run(ctx) {
            const f = region(level);
            const rooms = f.layout.rooms;
            const order = (room) => (room.pathIndex >= 0 ? room.pathIndex : rooms[room.anchor].pathIndex + 0.5);
            const spots = [...(f.layout.spots ?? [])].sort((a, b) => order(rooms[a[2]]) - order(rooms[b[2]]) || a[0] - b[0]);
            const mics = cells(level, 'C');
            const opts = { policy, film };
            const visit = async (x, y, interact = true) => {
                const s = await botState(ctx);
                if (s.level !== level || s.status === 8) return false;
                await teleport(ctx, x, y);
                await ctx.wait(6);
                await resolveAll(ctx, opts);
                if (interact) {
                    await ctx.tap(K.interact, 3);
                    await ctx.wait(4);
                    await resolveAll(ctx, opts);
                }
                await collect(ctx, opts, 300);
                return true;
            };
            for (const [c, r] of mics) {
                if (!(await visit(c * 32 + 16, r * 32 + 4))) return;
                // la fermata del citelis sta accanto al microfono
                if (!(await visit(c * 32 + 16 + 58, r * 32 - 14))) return;
            }
            for (const [c, r] of spots) if (!(await visit(c * 32 + 16, (r + 1) * 32 - 30))) return;
            await ctx.wait(60);
            await resolveAll(ctx, opts);
        },
    };
}

export default REGIONS.map((l) => explore(l));
