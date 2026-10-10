import { coop } from '../../coop/runtime';

/* quanto è più duro il mondo in due: un solo punto di verità.
   hp dei nemici e dei boss ×1,7 con due gechi, nidi più veloci e più élite.
   i danni restano a cuori interi: +15% non cambierebbe niente su 1 danno,
   quindi la difficoltà in più arriva da hp, numero e aggressività, non da colpi più forti */

export function coopCount(): number {
    return coop.together ? 2 : 1;
}

export function enemyHpFor(base: number): number {
    if (coopCount() <= 1) return base;
    return Math.max(1, Math.round(base * 1.7));
}

export function eliteChanceFor(basePerMille: number): number {
    if (coopCount() <= 1) return basePerMille;
    return Math.min(200, Math.round(basePerMille * 1.8));
}

export function spawnerIntervalFor(baseMs: number): number {
    if (coopCount() <= 1) return baseMs;
    return Math.max(1200, Math.round(baseMs * 0.72));
}

export function spawnerMaxAliveFor(base: number): number {
    if (coopCount() <= 1) return base;
    return base + 1;
}
