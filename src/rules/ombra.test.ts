import { describe, expect, it } from 'vitest';
import { defaultOmbraProfile, normalizeOmbraAct, observe, sanitizeOmbraProfile, strongestHabit, type OmbraAction } from './ombra';

const profileWith = (counts: Partial<Record<OmbraAction, number>>, extra: { sightings?: number } = {}) => {
    const p = defaultOmbraProfile();
    for (const [k, v] of Object.entries(counts)) p.counts[k as OmbraAction] = v;
    p.total = Object.values(p.counts).reduce((a, b) => a + b, 0);
    p.sightings = extra.sightings ?? 0;
    return p;
};

describe('sanitizeOmbraProfile', () => {
    it('un salvataggio vuoto o di un\'altra versione riparte da zero', () => {
        expect(sanitizeOmbraProfile(null)).toEqual(defaultOmbraProfile());
        expect(sanitizeOmbraProfile('x')).toEqual(defaultOmbraProfile());
        expect(sanitizeOmbraProfile({ version: 2, total: 50 })).toEqual(defaultOmbraProfile());
    });

    it('conti sporchi diventano interi non negativi, le riprese restano tra 0 e 8', () => {
        const p = sanitizeOmbraProfile({
            version: 1,
            total: 3,
            counts: { 'attack-side': 7.9, dash: -4, jump: Number.NaN, 'wave-scudo': 'tanti' },
            sightings: 40,
            premium: 'sì',
        });
        expect(p.counts['attack-side']).toBe(7);
        expect(p.counts.dash).toBe(0);
        expect(p.counts.jump).toBe(0);
        expect(p.counts['wave-scudo']).toBe(0);
        // il totale non può stare sotto la somma dei conti
        expect(p.total).toBe(7);
        expect(p.sightings).toBe(8);
        expect(p.premium).toBe(false);
    });
});

describe('normalizeOmbraAct', () => {
    it('ogni decisione che conta ha la sua categoria', () => {
        expect(normalizeOmbraAct({ act: 'attack', dir: 'side' })).toBe('attack-side');
        expect(normalizeOmbraAct({ act: 'attack', dir: 'up' })).toBe('attack-up');
        expect(normalizeOmbraAct({ act: 'attack', dir: 'down' })).toBe('attack-down');
        expect(normalizeOmbraAct({ act: 'heal' })).toBe('heal-done');
        expect(normalizeOmbraAct({ act: 'wave', wave: 'acquatossica' })).toBe('wave-acquatossica');
    });

    it('quello che non è una scelta leggibile non entra nel profilo', () => {
        expect(normalizeOmbraAct({ act: 'attack', dir: 'shot' })).toBeNull();
        expect(normalizeOmbraAct({ act: 'wave', wave: 'scivolata' })).toBeNull();
        const p = defaultOmbraProfile();
        expect(observe(p, { act: 'attack', dir: 'shot' })).toBe(false);
        expect(p.total).toBe(0);
    });

    it('observe conta la mossa e il totale', () => {
        const p = defaultOmbraProfile();
        expect(observe(p, { act: 'dash' })).toBe(true);
        expect(p.counts.dash).toBe(1);
        expect(p.total).toBe(1);
    });
});

describe('strongestHabit', () => {
    const side10: OmbraAction[] = Array(10).fill('attack-side');

    it('sotto le 12 mosse non legge niente', () => {
        expect(strongestHabit(profileWith({ 'attack-side': 11 }), side10, true)).toBeNull();
        expect(strongestHabit(profileWith({ 'attack-side': 20 }), [], true)).toBeNull();
    });

    it('chi abusa del fendente laterale viene letto', () => {
        const insight = strongestHabit(profileWith({ 'attack-side': 14, dash: 6 }), side10, true);
        expect(insight?.action).toBe('attack-side');
        expect(insight?.label).toBe('fendente');
        expect(insight?.confidence).toBeCloseTo(0.7 * 0.35 + 0.65, 6);
    });

    it('l\'ombra beta vede meno, ma un\'abitudine forte la vede lo stesso', () => {
        const insight = strongestHabit(profileWith({ 'attack-side': 14, dash: 6 }), side10, false);
        expect(insight?.confidence).toBeCloseTo((0.7 * 0.35 + 0.65) * 0.55, 6);
    });

    it('chi varia viene lasciato in pace', () => {
        const recent: OmbraAction[] = [...Array(5).fill('attack-side'), ...Array(5).fill('attack-up')];
        expect(strongestHabit(profileWith({ 'attack-side': 10, 'attack-up': 10 }), recent, true)).toBeNull();
    });
});
