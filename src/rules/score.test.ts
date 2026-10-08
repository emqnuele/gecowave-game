import { describe, expect, it } from 'vitest';
import { chapterParts, ENDING_BONUS, rankBoard, runTotal, sumParts, type BoardEntry } from './score';

describe('chapterParts', () => {
    it('un capitolo pulito vale circa un centinaio, e il tempo entra solo a capitolo finito', () => {
        const live = chapterParts({ explored: 0.5, secrets: 2, kills: 7, noHitBosses: 1, deaths: 1 });
        expect(live).toEqual([['esplorazione', 50], ['segreti', 10], ['nemici', 7], ['boss senza un graffio', 20], ['morti', -10]]);
        const done = chapterParts({ explored: 0.5, secrets: 2, kills: 7, noHitBosses: 1, deaths: 1, minutes: 10 });
        expect(done[3]).toEqual(['tempo', 60]);
        expect(sumParts(done)).toBe(50 + 10 + 7 + 60 + 20 - 10);
    });

    it('il tempo non scende sotto zero e il totale nemmeno', () => {
        expect(chapterParts({ explored: 0, secrets: 0, kills: 0, noHitBosses: 0, deaths: 30, minutes: 90 })[3]).toEqual(['tempo', 0]);
        expect(sumParts(chapterParts({ explored: 0, secrets: 0, kills: 0, noHitBosses: 0, deaths: 30 }))).toBe(0);
    });
});

describe('punteggio della partita', () => {
    it('somma i capitoli, la stima in corso (mai negativa) e 10 a trofeo', () => {
        expect(runTotal({ bus: 80, rio: 60 }, 3, 25)).toBe(80 + 60 + 25 + 30);
        expect(runTotal({ bus: 80 }, 0, -40)).toBe(80);
    });

    it('il finale vero vale più di tutti', () => {
        expect(Math.max(...Object.values(ENDING_BONUS))).toBe(ENDING_BONUS.riscatto);
    });
});

describe('rankBoard', () => {
    const entry = (score: number): BoardEntry => ({ name: 'geco', score, ending: 'consegna', at: score });

    it('tiene le dieci migliori e dice la posizione', () => {
        const list = Array.from({ length: 10 }, (_, i) => entry(100 - i * 10));
        const mid = rankBoard(list, entry(55));
        expect(mid.rank).toBe(6);
        expect(mid.list).toHaveLength(10);
        expect(rankBoard(list, entry(1)).rank).toBe(0);
        expect(rankBoard([], entry(1)).rank).toBe(1);
    });
});
