import { BusDoors } from './BusDoors';
import { CANTINA_CAMS, Cameras, SORVEGLIANZA_CAMS } from './Cameras';
import { BELT, FloorFlow, STREAM } from './FloorFlow';
import { Snipers } from './Snipers';
import { pathGaps, seeded, type Mechanic, type MechanicCtx } from './types';
import { TILE } from '../../config';

export type { Mechanic, MechanicCtx } from './types';

/** porte del dubbio: varchi del percorso chiusi da una domanda di piema */
class MindDoors implements Mechanic {
    constructor(ctx: MechanicCtx) {
        const rnd = seeded(`${ctx.regionId}:dubbio`);
        const gaps = pathGaps(ctx)
            .filter((g) => ctx.avoid.every((p) => Math.abs(p.x - g.x) > 260 || Math.abs(p.y - g.y) > 200))
            .sort((a, b) => Math.min(a.left.pathIndex, a.right.pathIndex) - Math.min(b.left.pathIndex, b.right.pathIndex));
        // tre porte distribuite lungo la testa, non tutte in fila
        const picks = [0.25, 0.55, 0.85].map((f) => gaps[Math.min(gaps.length - 1, Math.floor(f * gaps.length + rnd()))]);
        [...new Set(picks)].forEach((g, i) => {
            if (g) ctx.quizDoor(`porta-dubbio-${i + 1}`, g.x, g.y + TILE + 16);
        });
    }

    update(): void {}

    destroy(): void {}
}

/** la meccanica del posto, se ne ha una */
export function createMechanic(ctx: MechanicCtx): Mechanic | null {
    switch (ctx.regionId) {
        case 'bus': return new BusDoors(ctx);
        case 'rio': return new FloorFlow(ctx, STREAM);
        case 'stabilimento': return new FloorFlow(ctx, BELT);
        case 'cantina': return new Cameras(ctx, CANTINA_CAMS);
        case 'sorveglianza': return new Cameras(ctx, SORVEGLIANZA_CAMS);
        case 'tecnokill': return new Snipers(ctx);
        case 'mente': return new MindDoors(ctx);
        default: return null;
    }
}
