import { describe, expect, it } from 'vitest';
import { COMBAT } from '../config';
import { bossPhase, poisonMultiplier, risonanteStep } from './combat';

describe('risonanteStep', () => {
    it('eco, onda e piena valgono metà, pieno e doppio', () => {
        expect(risonanteStep(0)).toBe(0.5);
        expect(risonanteStep(1)).toBe(1);
        expect(risonanteStep(2)).toBe(2);
    });

    it('un livello sconosciuto (il rimando dello scudo) conta come eco', () => {
        expect(risonanteStep(-1)).toBe(0.5);
    });
});

describe('poisonMultiplier', () => {
    it('senza veleno il danno resta quello', () => {
        expect(poisonMultiplier(false, false)).toBe(1);
        expect(poisonMultiplier(false, true)).toBe(1);
    });

    it('il veleno pesa più sui nemici che sui boss', () => {
        expect(poisonMultiplier(true, false)).toBe(COMBAT.poisonMult);
        expect(poisonMultiplier(true, true)).toBe(COMBAT.poisonBossMult);
        expect(COMBAT.poisonMult).toBeGreaterThan(COMBAT.poisonBossMult);
    });
});

describe('bossPhase', () => {
    it('cambia fase sotto i due terzi e sotto un terzo, mai prima', () => {
        expect(bossPhase(120, 120)).toBe(1);
        expect(bossPhase(80, 120)).toBe(1);
        expect(bossPhase(79, 120)).toBe(2);
        expect(bossPhase(40, 120)).toBe(2);
        expect(bossPhase(39, 120)).toBe(3);
        expect(bossPhase(0, 120)).toBe(3);
    });
});
