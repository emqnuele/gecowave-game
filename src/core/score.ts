import { rankBoard, runTotal, type BoardEntry } from '../rules/score';
import { state } from './state';

export type { BoardEntry } from '../rules/score';

/* il punteggio della partita: i capitoli finiti, il capitolo in corso, il finale.
   una partita che ha acceso la freccia guida resta assistita fino in fondo:
   niente punteggio e niente trofei. la classifica vive fuori dal salvataggio,
   così sopravvive alle partite nuove */

export function runAssisted(): boolean {
    return state.save.assisted || state.settings.guide;
}

/** capitoli finiti in questa partita più la stima del capitolo in corso; null se assistita */
export function runScore(live = 0): number | null {
    if (runAssisted()) return null;
    return runTotal(state.save.runScores, state.save.achievements.length, live);
}

const BOARD_KEY = 'gecowave-classifica-v3';

export function loadBoard(): BoardEntry[] {
    try {
        const raw = localStorage.getItem(BOARD_KEY);
        const list = raw ? (JSON.parse(raw) as BoardEntry[]) : [];
        return Array.isArray(list) ? list.filter((e) => typeof e.score === 'number') : [];
    } catch {
        return [];
    }
}

/** registra una partita finita; ritorna la posizione in classifica (1 = la migliore), 0 se fuori dai dieci */
export function pushBoard(entry: BoardEntry): number {
    const { list, rank } = rankBoard(loadBoard(), entry);
    try {
        localStorage.setItem(BOARD_KEY, JSON.stringify(list));
    } catch {
        // storage pieno o bloccato: la partita vale lo stesso, solo non resta scritta
    }
    return rank;
}
