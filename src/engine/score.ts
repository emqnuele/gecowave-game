import { state } from './state';

/* il punteggio della partita: i capitoli finiti, il capitolo in corso, il finale.
   una partita che ha acceso la freccia guida resta assistita fino in fondo:
   niente punteggio e niente trofei. la classifica vive fuori dal salvataggio,
   così sopravvive alle partite nuove */

export interface ChapterInput {
    explored: number;
    secrets: number;
    kills: number;
    noHitBosses: number;
    deaths: number;
    /** minuti nel capitolo; assente per la stima del capitolo in corso */
    minutes?: number;
}

export function chapterParts(c: ChapterInput): [string, number][] {
    // numeri piccoli: un capitolo vale centinaia, non migliaia
    const parts: [string, number][] = [
        ['esplorazione', Math.round(c.explored * 300)],
        ['segreti', c.secrets * 15],
        ['nemici', c.kills * 2],
        ['boss senza un graffio', c.noHitBosses * 60],
        ['morti', -c.deaths * 25],
    ];
    if (c.minutes !== undefined) parts.splice(3, 0, ['tempo', Math.max(0, Math.round(300 - c.minutes * 12))]);
    return parts;
}

export const sumParts = (parts: [string, number][]) => Math.max(0, parts.reduce((s, [, v]) => s + v, 0));

export const ENDING_BONUS: Record<string, number> = {
    riscatto: 800,
    consegna: 500,
    dei: 600,
    pedro: 150,
    sconfitta: 0,
};

export function runAssisted(): boolean {
    return state.save.assisted || state.settings.guide;
}

/** capitoli finiti in questa partita più la stima del capitolo in corso; null se assistita */
export function runScore(live = 0): number | null {
    if (runAssisted()) return null;
    const done = Object.values(state.save.runScores).reduce((s, v) => s + v, 0);
    return done + Math.max(0, live) + state.save.achievements.length * 25;
}

export interface BoardEntry {
    name: string;
    score: number;
    ending: string;
    at: number;
}

const BOARD_KEY = 'gecowave-classifica-v2';

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
    const list = [...loadBoard(), entry].sort((a, b) => b.score - a.score).slice(0, 10);
    try {
        localStorage.setItem(BOARD_KEY, JSON.stringify(list));
    } catch {
        // storage pieno o bloccato: la partita vale lo stesso, solo non resta scritta
    }
    return list.indexOf(entry) + 1;
}
