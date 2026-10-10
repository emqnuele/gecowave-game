import { DEFAULT_SKIN_ID, isValidSkinId } from '../content/skins';
import type { SaveData } from '../types';

/** il personaggio forgiato: ognuno porta il suo, anche nella partita di un altro */
export interface Character {
    name: string;
    stats: { forza: number; costituzione: number; flusso: number };
    skin: string;
}

/** quello che l'ospite vede della partita prima di entrare */
export interface GameInfo {
    gameId: string;
    host: Character;
    levelId: string;
    playMs: number;
    doomsday: boolean;
    assisted: boolean;
    /** partita appena creata: l'ospite vede anche l'intro */
    fresh: boolean;
    /** l'host è già dentro un capitolo: chi entra ci finisce subito */
    playing: boolean;
}

/** i campi che sono del giocatore e non della partita: non viaggiano col mondo */
export const PERSONAL_KEYS = ['playerName', 'skin', 'stats', 'equipped'] as const satisfies readonly (keyof SaveData)[];

export type SharedSave = Omit<SaveData, (typeof PERSONAL_KEYS)[number]>;

export function characterOf(save: SaveData): Character {
    return { name: save.playerName, stats: { ...save.stats }, skin: save.skin };
}

const MAX_POINTS = 10;

/** un personaggio arrivato dalla rete si pulisce: nomi lunghi, punti in più, pelli inventate */
export function sanitizeCharacter(raw: unknown): Character | null {
    if (!raw || typeof raw !== 'object') return null;
    const c = raw as Partial<Character>;
    if (typeof c.name !== 'string' || !c.stats || typeof c.stats !== 'object') return null;
    const pt = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(MAX_POINTS, Math.round(v))) : 0);
    const stats = { forza: pt(c.stats.forza), costituzione: pt(c.stats.costituzione), flusso: pt(c.stats.flusso) };
    // chi manda più punti di quanti la forgia ne dà riparte da zero: niente trucchi a metà
    const total = stats.forza + stats.costituzione + stats.flusso;
    const fair = total <= MAX_POINTS ? stats : { forza: 0, costituzione: 0, flusso: 0 };
    // il nome finisce in titoli e toast montati come html: niente markup dall'altra parte
    const name = c.name.replace(/[\u0000-\u001f<>&"'`]/g, '').trim().slice(0, 12) || 'Geco';
    return { name, stats: fair, skin: isValidSkinId(c.skin) ? c.skin! : DEFAULT_SKIN_ID };
}
