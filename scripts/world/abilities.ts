import { LEVEL_ORDER } from '../../src/content/levels';
import type { SimAbilities } from '../../src/world/sim';

/** cosa sa fare il geco quando entra nel capitolo: scivolata da perduta, doppio salto da guggu, aggrappo dalla formicona (rio) */
export function abilitiesFor(id: string): SimAbilities {
    const idx = LEVEL_ORDER.indexOf(id);
    if (idx === 0) return { dash: false, double: false };
    if (idx === 1) return { dash: true, double: false };
    return { dash: true, double: true, wall: idx > LEVEL_ORDER.indexOf('rio') };
}
