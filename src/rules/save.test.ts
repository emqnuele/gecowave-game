import { describe, expect, it } from 'vitest';
import { defaultSave, loadedSave, migrateSave } from './save';

const load = (raw: Record<string, unknown>) => {
    const save = loadedSave(raw);
    const persist = migrateSave(save, raw);
    return { save, persist };
};

describe('loadedSave', () => {
    it('ogni partita nuova ha i suoi oggetti, mai condivisi', () => {
        const a = defaultSave();
        const b = defaultSave();
        a.flags.push('x');
        a.record.deaths = 3;
        expect(b.flags).toEqual([]);
        expect(b.record.deaths).toBe(0);
    });

    it('il disco vince sui default, anche nei record e nelle stanze viste', () => {
        const save = loadedSave({ barre: 12, record: { deaths: 4 }, explored: { bus: [1, 2] } } as never);
        expect(save.barre).toBe(12);
        expect(save.record).toEqual({ deaths: 4, kills: 0, bosses: 0, playMs: 0, talks: 0 });
        expect(save.explored).toEqual({ bus: [1, 2] });
        expect(save.levelId).toBe('perduta');
    });
});

describe('migrateSave', () => {
    it('barre rovinate tornano a zero', () => {
        expect(load({ barre: Number.NaN }).save.barre).toBe(0);
        expect(load({ barre: 'tante' }).save.barre).toBe(0);
    });

    it('i consumabili tolti dall\'economia diventano barre', () => {
        const { save } = load({ barre: 5, inventory: { energetico: 2, santino: 1, crocchetta: 3 } });
        expect(save.barre).toBe(5 + 2 * 22 + 50);
        expect(save.inventory).toEqual({ crocchetta: 3 });
    });

    it('chi aveva lasciato andare lochef lo ritrova arrestato, una volta sola', () => {
        expect(load({ flags: ['lochef-libero'] }).save.flags).toEqual(['lochef-arrestato']);
        expect(load({ flags: ['lochef-libero', 'lochef-arrestato'] }).save.flags).toEqual(['lochef-arrestato']);
    });

    it('la rigenerazione sparisce dalle abilità', () => {
        expect(load({ abilities: ['scivolata', 'rigenerazione'] }).save.abilities).toEqual(['scivolata']);
    });

    it('il collasso dei salvataggi vecchi diventa doomsday', () => {
        const { save } = load({ collassoMode: true, collasso: 0.4 });
        expect(save.doomsdayMode).toBe(true);
        expect(save.doomsday).toBe(0.4);
    });

    it('i punteggi in scala vecchia si azzerano invece di mescolarsi', () => {
        const old = load({ runScores: { bus: 900 }, scores: { bus: { score: 40 } }, chapterLog: { bus: {} } }).save;
        expect(old.runScores).toEqual({});
        expect(old.scores).toEqual({});
        expect(old.chapterLog).toEqual({});
        const fresh = load({ runScores: { bus: 90 } }).save;
        expect(fresh.runScores).toEqual({ bus: 90 });
    });

    it('una pelle sconosciuta torna al bosco', () => {
        expect(load({ skin: 'oro' }).save.skin).toBe('bosco');
        expect(load({ skin: 'laguna' }).save.skin).toBe('laguna');
    });

    it('il cliente della tommasorveglianza ha l\'ombra premium, e il salvataggio va riscritto', () => {
        const before = load({ flags: ['tommasorveglianza'] });
        expect(before.save.ombra.premium).toBe(true);
        expect(before.persist).toBe(true);
        expect(load({ flags: [] }).persist).toBe(false);
    });

    it('se una migrazione lancia a metà, restano fatte quelle prima', () => {
        const raw = { barre: 1, inventory: { energetico: 1 }, flags: 42 };
        const save = loadedSave(raw as never);
        expect(() => migrateSave(save, raw as never)).toThrow();
        expect(save.barre).toBe(23);
    });
});
