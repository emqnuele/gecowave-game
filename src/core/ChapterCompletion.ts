import { BOSS_CHARMS } from '../content/items';
import type { BossKind, ZoneColor } from '../types';
import { softFail } from './softFail';
import { state } from './state';

/* il catalogo dei collezionabili di ogni capitolo: una sola fonte per i
   denominatori di cuori e cose, così overlay e telefono dicono gli stessi
   numeri. ogni voce riusa la chiave persistente vera del salvataggio */

export type CompletionKind = 'heart' | 'thing';

export interface CompletionEntry {
    key: string;
    kind: CompletionKind;
    levelId: string;
    collected(): boolean;
}

export interface ChapterSummary {
    levelId: string;
    title: string;
    accentWord: string;
    color: ZoneColor;
    punchline: string;
    exploration: {
        visited: number;
        total: number;
        percent: number | null;
    };
    hearts: {
        found: number;
        total: number;
    };
    things: {
        found: number;
        total: number;
    };
    score: {
        chapter: number;
        lines: [string, string][];
        best: boolean;
        assisted: boolean;
        runTotal: number | null;
    };
}

const entries = new Map<string, CompletionEntry>();
const sealed = new Set<string>();
const roomTotals = new Map<string, number>();

/** registra una voce attesa; la prima registrazione vince, i conflitti si segnalano */
export function expectCollectible(levelId: string, key: string, kind: CompletionKind, collected: () => boolean): void {
    const prev = entries.get(key);
    if (prev) {
        if (prev.kind !== kind || prev.levelId !== levelId) {
            const msg = `catalogo collezionabili: chiave ${key} già registrata come ${prev.kind} di ${prev.levelId}, ignorata come ${kind} di ${levelId}`;
            if (import.meta.env.DEV) console.warn(msg);
            else console.error(msg);
        }
        return;
    }
    entries.set(key, { key, kind, levelId, collected });
}

/** scorciatoia per le voci lette da collectedLore */
export function expectLoreKey(levelId: string, key: string, kind: CompletionKind): void {
    expectCollectible(levelId, key, kind, () => state.save.collectedLore.includes(key));
}

/* i cuori lasciati dai boss: la chiave è globale ma il proprietario è il
   capitolo che carica il boss, così il denominatore resta attribuito */
const BOSS_HEARTS: Partial<Record<BossKind, string>> = {
    lochef: 'cuore-lochef',
    formicona: 'cuore-formicona',
    settequaranta: 'cuore-barrato',
    custode: 'cuore-custode',
    limite: 'cuore-limite',
    walter: 'cuore-walter',
};

/** premi attesi di un boss al caricamento del capitolo, anche se è già caduto */
export function expectBossRewards(levelId: string, kind: BossKind): void {
    const charm = BOSS_CHARMS[kind];
    if (charm) expectCollectible(levelId, `charm-${charm}`, 'thing', () => state.hasCharm(charm));
    const heart = BOSS_HEARTS[kind];
    if (heart) expectLoreKey(levelId, heart, 'heart');
}

export interface ChapterCounts {
    found: number;
    total: number;
}

/** trovati e attesi di un capitolo per categoria */
export function countsFor(levelId: string, kind: CompletionKind): ChapterCounts {
    let found = 0;
    let total = 0;
    for (const e of entries.values()) {
        if (e.levelId !== levelId || e.kind !== kind) continue;
        total++;
        // un predicato rotto non deve mai rompere il riepilogo
        try {
            if (e.collected()) found++;
        } catch (err) {
            softFail(`completamento ${e.key}`, err);
        }
    }
    return { found, total };
}

/** il capitolo ha dati da mostrare: sigillato e con almeno una voce */
export function hasCompletionData(levelId: string): boolean {
    if (!sealed.has(levelId)) return false;
    for (const e of entries.values()) {
        if (e.levelId === levelId) return true;
    }
    return false;
}

/** stanze del capitolo registrate al caricamento, per il telefono */
export function roomTotalOf(levelId: string): number {
    return roomTotals.get(levelId) ?? 0;
}

/** sigilla il catalogo del capitolo a fine caricamento: da qui i totali sono stabili */
export function sealLevel(levelId: string, rooms: number): void {
    roomTotals.set(levelId, rooms);
    sealed.add(levelId);
}

export interface ChapterCompletion {
    visited: number;
    total: number;
    percent: number | null;
    hearts: ChapterCounts;
    things: ChapterCounts;
}

/** numeri di completamento di un capitolo, stessa fonte per overlay e telefono */
export function chapterCompletion(levelId: string): ChapterCompletion | null {
    if (!hasCompletionData(levelId)) return null;
    const seen = new Set(state.save.explored[levelId] ?? []);
    const total = roomTotals.get(levelId) ?? 0;
    return {
        visited: seen.size,
        total,
        percent: total > 0 ? Math.round((seen.size / total) * 100) : null,
        hearts: countsFor(levelId, 'heart'),
        things: countsFor(levelId, 'thing'),
    };
}

export interface SummaryInput {
    levelId: string;
    title: string;
    accentWord: string;
    color: ZoneColor;
    punchline: string;
    visited: number;
    rooms: number;
    hearts: ChapterCounts;
    things: ChapterCounts;
    chapter: number;
    lines: [string, string][];
    best: boolean;
    assisted: boolean;
    runTotal: number | null;
}

/** snapshot immutabile per la ui: la scena può cambiare mentre si anima */
export function buildChapterSummary(input: SummaryInput): ChapterSummary {
    return Object.freeze({
        levelId: input.levelId,
        title: input.title,
        accentWord: input.accentWord,
        color: input.color,
        punchline: input.punchline,
        exploration: {
            visited: input.visited,
            total: input.rooms,
            percent: input.rooms > 0 ? Math.round((input.visited / input.rooms) * 100) : null,
        },
        hearts: { ...input.hearts },
        things: { ...input.things },
        score: {
            chapter: input.chapter,
            lines: input.lines.map(([k, v]) => [k, v] as [string, string]),
            best: input.best,
            assisted: input.assisted,
            runTotal: input.runTotal,
        },
    });
}

/** riepilogo di fine gioco: gli stessi numeri dei capitoli, un piano sopra */
export interface FinalSummary {
    title: string;
    subtitle: string;
    color: ZoneColor;
    exploration: {
        visited: number;
        total: number;
        percent: number | null;
    };
    hearts: {
        found: number;
        total: number;
    };
    things: {
        found: number;
        total: number;
    };
    score: {
        total: number | null;
        lines: [string, string][];
        best: boolean;
        rank: number;
        assisted: boolean;
    };
}

export interface FinalSummaryInput {
    title: string;
    subtitle: string;
    color: ZoneColor;
    visited: number;
    rooms: number;
    hearts: ChapterCounts;
    things: ChapterCounts;
    total: number | null;
    lines: [string, string][];
    best: boolean;
    rank: number;
    assisted: boolean;
}

/** snapshot immutabile del finale: tutto già calcolato e salvato, niente da ricalcolare */
export function buildFinalSummary(input: FinalSummaryInput): FinalSummary {
    return Object.freeze({
        title: input.title,
        subtitle: input.subtitle,
        color: input.color,
        exploration: {
            visited: input.visited,
            total: input.rooms,
            percent: input.rooms > 0 ? Math.round((input.visited / input.rooms) * 100) : null,
        },
        hearts: { ...input.hearts },
        things: { ...input.things },
        score: {
            total: input.total,
            lines: input.lines.map(([k, v]) => [k, v] as [string, string]),
            best: input.best,
            rank: input.rank,
            assisted: input.assisted,
        },
    });
}
