/* le regole del punteggio, senza stato: un capitolo vale un centinaio, la partita somma capitoli, trofei e finale */

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
    // numeri piccoli: un capitolo vale un centinaio, non migliaia
    const parts: [string, number][] = [
        ['esplorazione', Math.round(c.explored * 100)],
        ['segreti', c.secrets * 5],
        ['nemici', c.kills],
        ['boss senza un graffio', c.noHitBosses * 20],
        ['morti', -c.deaths * 10],
    ];
    if (c.minutes !== undefined) parts.splice(3, 0, ['tempo', Math.max(0, Math.round(100 - c.minutes * 4))]);
    return parts;
}

export const sumParts = (parts: [string, number][]) => Math.max(0, parts.reduce((s, [, v]) => s + v, 0));

export const ENDING_BONUS: Record<string, number> = {
    riscatto: 300,
    consegna: 200,
    dei: 250,
    pedro: 50,
    sconfitta: 0,
};

/** capitoli finiti in questa partita, più la stima del capitolo in corso, più 10 a trofeo */
export function runTotal(runScores: Record<string, number>, achievements: number, live = 0): number {
    const done = Object.values(runScores).reduce((s, v) => s + v, 0);
    return done + Math.max(0, live) + achievements * 10;
}

export interface BoardEntry {
    name: string;
    score: number;
    ending: string;
    at: number;
}

/** la classifica locale tiene le dieci migliori; la posizione parte da 1, 0 se la partita resta fuori */
export function rankBoard(list: BoardEntry[], entry: BoardEntry): { list: BoardEntry[]; rank: number } {
    const sorted = [...list, entry].sort((a, b) => b.score - a.score).slice(0, 10);
    return { list: sorted, rank: sorted.indexOf(entry) + 1 };
}
