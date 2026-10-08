import { BASE_NOTCHES, STARTING_ITEMS } from '../content/items';
import { DEFAULT_SKIN_ID, isValidSkinId } from '../content/skins';
import type { SaveData } from '../types';
import { defaultOmbraProfile, sanitizeOmbraProfile } from './ombra';

/** vecchi consumabili tolti dall'economia: chi li aveva li ritrova in barre, al prezzo di wavezon */
const LEGACY_ITEMS: Record<string, number> = { energetico: 22, 'caffe-mensa': 35, rubinetto: 10, santino: 50, 'brodo-lochef': 80 };

/** il salvataggio di una partita nuova */
export const defaultSave = (): SaveData => ({
    levelId: 'perduta',
    checkpointId: null,
    barre: 0,
    abilities: [],
    seenDialogues: [],
    collectedLore: [],
    flags: [],
    endingSeen: null,
    playerName: 'Geco',
    skin: DEFAULT_SKIN_ID,
    doomsdayMode: false,
    doomsday: 0,
    stats: {
        forza: 0,
        costituzione: 0,
        flusso: 0,
    },
    inventory: { ...STARTING_ITEMS },
    charms: [],
    equipped: [],
    notches: BASE_NOTCHES,
    messages: [],
    record: { deaths: 0, kills: 0, bosses: 0, playMs: 0, talks: 0 },
    radio: null,
    explored: {},
    stops: [],
    quests: {},
    trials: {},
    achievements: [],
    assisted: false,
    scores: {},
    runScores: {},
    chapterLog: {},
    chapterRun: null,
    ombra: defaultOmbraProfile(),
});

type RawSave = Partial<SaveData> & Record<string, unknown>;

/** il salvataggio letto da disco sopra i default: può lanciare con un json di forma sbagliata */
export function loadedSave(parsed: RawSave): SaveData {
    const fresh = defaultSave();
    return { ...fresh, ...parsed, record: { ...fresh.record, ...(parsed.record ?? {}) }, explored: { ...(parsed.explored ?? {}) } } as SaveData;
}

/** porta un salvataggio vecchio al formato di oggi sul posto: se lancia a metà restano le migrazioni già fatte; true se va riscritto */
export function migrateSave(save: SaveData, parsed: RawSave): boolean {
    if (typeof save.barre !== 'number' || isNaN(save.barre)) {
        save.barre = 0;
    }
    // i consumabili tolti dall'economia tornano in barre
    for (const [id, value] of Object.entries(LEGACY_ITEMS)) {
        const n = save.inventory?.[id] ?? 0;
        if (n > 0) save.barre += n * value;
        if (save.inventory) delete save.inventory[id];
    }
    // la tana non perdona più: chi l'aveva lasciato andare lo ritrova in cella
    if (save.flags.includes('lochef-libero')) {
        save.flags = save.flags.filter((f) => f !== 'lochef-libero');
        if (!save.flags.includes('lochef-arrestato')) save.flags.push('lochef-arrestato');
    }
    // la rigenerazione non esiste più: si cura solo col cibo
    if ((save.abilities as string[]).includes('rigenerazione')) {
        save.abilities = save.abilities.filter((a) => (a as string) !== 'rigenerazione');
    }
    // fallback for backward compatibility
    if (parsed.collassoMode !== undefined && save.doomsdayMode === false) {
        save.doomsdayMode = parsed.collassoMode as boolean;
    }
    if (parsed.collasso !== undefined && save.doomsday === 0) {
        save.doomsday = parsed.collasso as number;
    }
    // i punteggi vecchi usavano un'altra scala: si azzerano, non si mescolano
    const oldScale =
        Object.values(save.runScores ?? {}).some((v) => v > 500) ||
        Object.values(save.scores ?? {}).some((s) => s.score > 500);
    if (oldScale) {
        save.runScores = {};
        save.scores = {};
        save.chapterLog = {};
    }
    // l'ombra ha un profilo per partita: i salvataggi vecchi partono puliti
    save.ombra = sanitizeOmbraProfile((parsed as { ombra?: unknown }).ombra);
    // le pelli vecchie o manomesse tornano al bosco
    if (!isValidSkinId((parsed as { skin?: unknown }).skin)) {
        save.skin = DEFAULT_SKIN_ID;
    }
    if (save.flags.includes('tommasorveglianza') && !save.ombra.premium) {
        save.ombra.premium = true;
        return true;
    }
    return false;
}
