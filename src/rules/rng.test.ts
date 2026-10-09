import { describe, expect, it } from 'vitest';
import { Rng } from './rng';

describe('Rng', () => {
    it('stesso seme, stessa sequenza; seme diverso, sequenza diversa', () => {
        const a = new Rng(42);
        const b = new Rng(42);
        const c = new Rng(43);
        const sa = Array.from({ length: 20 }, () => a.next());
        expect(Array.from({ length: 20 }, () => b.next())).toEqual(sa);
        expect(Array.from({ length: 20 }, () => c.next())).not.toEqual(sa);
    });

    it('ripartire dal seme ridà la stessa sequenza', () => {
        const r = new Rng(7);
        const first = [r.next(), r.next(), r.next()];
        r.reseed(7);
        expect([r.next(), r.next(), r.next()]).toEqual(first);
    });

    it('next sta sempre in [0, 1)', () => {
        const r = new Rng(1);
        for (let i = 0; i < 10000; i++) {
            const v = r.next();
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThan(1);
        }
    });

    it('between copre gli estremi compresi e niente fuori', () => {
        const r = new Rng(3);
        const seen = new Set<number>();
        for (let i = 0; i < 2000; i++) seen.add(r.between(2, 5));
        expect([...seen].sort()).toEqual([2, 3, 4, 5]);
    });

    it('shuffle mescola sul posto senza perdere elementi', () => {
        const r = new Rng(9);
        const arr = [1, 2, 3, 4, 5, 6, 7, 8];
        const out = r.shuffle(arr);
        expect(out).toBe(arr);
        expect([...out].sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });

    it('le due sequenze di gioco sono indipendenti: pescare dall\'una non sposta l\'altra', () => {
        const logic = new Rng(100);
        const fx = new Rng(200);
        const alone = [logic.next(), logic.next()];
        logic.reseed(100);
        const first = logic.next();
        fx.next();
        fx.next();
        expect([first, logic.next()]).toEqual(alone);
    });
});
