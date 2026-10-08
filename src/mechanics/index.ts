import { BusDoors } from './BusDoors';
import { CANTINA_CAMS, Cameras, SORVEGLIANZA_CAMS } from './Cameras';
import { BELT, FloorFlow, STREAM } from './FloorFlow';
import { MindDoors } from './MindDoors';
import { Snipers } from './Snipers';
import { Tana } from './Tana';
import type { Mechanic, MechanicCtx } from './types';

export type { Mechanic, MechanicCtx } from './types';

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
        case 'tana': return new Tana(ctx);
        default: return null;
    }
}
