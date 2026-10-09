import { COMBAT } from '../config';

export type BossPhase = 1 | 2 | 3;

/** il risonante carica in tre gradini: l'eco fa metà danno, l'onda pieno, la piena il doppio */
export const risonanteStep = (level: number): number => (level === 2 ? 2 : level === 1 ? 1 : 0.5);

/** l'avvelenamento fa male di più a tutti, meno ai boss */
export function poisonMultiplier(poisoned: boolean, boss: boolean): number {
    return poisoned ? (boss ? COMBAT.poisonBossMult : COMBAT.poisonMult) : 1;
}

/** un boss cambia fase sotto i due terzi e sotto un terzo della vita */
export function bossPhase(hp: number, maxHp: number): BossPhase {
    if (hp > maxHp * 0.66) return 1;
    if (hp > maxHp * 0.33) return 2;
    return 3;
}
