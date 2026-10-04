import { COMBAT } from '../config';
import { BASE_NOTCHES, charmMods, ITEMS, LEGACY_ITEMS, STARTING_ITEMS, type CharmMods } from '../content/items';
import type { AbilityId, DroppedBarre, SaveData } from '../types';
import { bus } from './events';
import { DEFAULT_SKIN_ID, isValidSkinId } from './playerSkin';
import { defaultOmbraProfile, observe as observeOmbraAct, sanitizeOmbraProfile, type PlayerAct } from './OmbraProfile';
import type { Action, PresetId } from './input/actions';

const SAVE_KEY = 'gecowave-save-v2';
const SETTINGS_KEY = 'gecowave-settings-v1';

/* il doomsday ci mette ~22 minuti di gioco passivo a riempirsi.
   ogni boss di trama abbattuto lo ricaccia indietro di un bel pezzo. */
const DOOMSDAY_FILL_MS = 22 * 60 * 1000;
const DOOMSDAY_BOSS_RELIEF = 0.14;

export interface ControlsSettings {
    preset: PresetId;
    custom: Partial<Record<Action, string[]>>;
}

export interface Settings {
    volume: number;
    screenShake: boolean;
    /** modalità assistita: la freccia che indica il prossimo varco verso l'obiettivo */
    guide: boolean;
    /** comandi rimappati: il preset dice tutto, custom solo le eccezioni */
    controls: ControlsSettings;
}

export interface PortalReturn {
    levelId: string;
    x: number;
    y: number;
}

const defaultSave = (): SaveData => ({
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

/** stato persistente + stato di run, unica fonte di verità fuori dalle scene */
class GameState {
    save: SaveData = defaultSave();
    settings: Settings = { volume: 0.7, screenShake: true, guide: false, controls: { preset: 'classico', custom: {} } };
    godMode = false;
    /** barre lasciate a terra all'ultima morte, stile souls */
    dropped: DroppedBarre | null = null;
    /** vita, flow e malus della run corrente: non si salvano, si vivono */
    run = { hp: 5, flow: 0, trenbolone: false, smela: false, patto: false, nearMic: false };
    private modsCache: CharmMods | null = null;
    private lastPersist = 0;
    private dirty = false;
    /** dove tornare uscendo da un capitolo segreto (transient, non persistito) */
    portalReturn: PortalReturn | null = null;
    private doomsdaySinceSave = 0;

    constructor() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                const fresh = defaultSave();
                this.save = { ...fresh, ...parsed, record: { ...fresh.record, ...(parsed.record ?? {}) }, explored: { ...(parsed.explored ?? {}) } };
                if (typeof this.save.barre !== 'number' || isNaN(this.save.barre)) {
                    this.save.barre = 0;
                }
                // i consumabili tolti dall'economia tornano in barre
                for (const [id, value] of Object.entries(LEGACY_ITEMS)) {
                    const n = this.save.inventory?.[id] ?? 0;
                    if (n > 0) this.save.barre += n * value;
                    if (this.save.inventory) delete this.save.inventory[id];
                }
                // la tana non perdona più: chi l'aveva lasciato andare lo ritrova in cella
                if (this.save.flags.includes('lochef-libero')) {
                    this.save.flags = this.save.flags.filter((f) => f !== 'lochef-libero');
                    if (!this.save.flags.includes('lochef-arrestato')) this.save.flags.push('lochef-arrestato');
                }
                // la rigenerazione non esiste più: si cura solo col cibo
                if ((this.save.abilities as string[]).includes('rigenerazione')) {
                    this.save.abilities = this.save.abilities.filter((a) => (a as string) !== 'rigenerazione');
                }
                // fallback for backward compatibility
                if (parsed.collassoMode !== undefined && this.save.doomsdayMode === false) {
                    this.save.doomsdayMode = parsed.collassoMode;
                }
                if (parsed.collasso !== undefined && this.save.doomsday === 0) {
                    this.save.doomsday = parsed.collasso;
                }
                // i punteggi vecchi usavano un'altra scala: si azzerano, non si mescolano
                const oldScale =
                    Object.values(this.save.runScores ?? {}).some((v) => v > 500) ||
                    Object.values(this.save.scores ?? {}).some((s) => s.score > 500);
                if (oldScale) {
                    this.save.runScores = {};
                    this.save.scores = {};
                    this.save.chapterLog = {};
                }
                // l'ombra ha un profilo per partita: i salvataggi vecchi partono puliti
                this.save.ombra = sanitizeOmbraProfile((parsed as { ombra?: unknown }).ombra);
                // le pelli vecchie o manomesse tornano al bosco
                if (!isValidSkinId((parsed as { skin?: unknown }).skin)) {
                    this.save.skin = DEFAULT_SKIN_ID;
                }
                if (this.hasFlag('tommasorveglianza') && !this.save.ombra.premium) {
                    this.save.ombra.premium = true;
                    this.persist();
                }
            }
            const s = localStorage.getItem(SETTINGS_KEY);
            if (s) {
                const parsed = JSON.parse(s);
                // un salvataggio vecchio senza comandi riceve il default
                const preset = parsed.controls?.preset === 'frecce' ? 'frecce' : 'classico';
                const custom = parsed.controls?.custom && typeof parsed.controls.custom === 'object' ? parsed.controls.custom : {};
                this.settings = { ...this.settings, ...parsed, controls: { preset, custom } };
            }
        } catch {
            // storage corrotto o bloccato: si riparte da zero
        }
        this.resetRun();
    }

    get hasSave(): boolean {
        return localStorage.getItem(SAVE_KEY) !== null;
    }

    get maxHp(): number {
        return (5 + this.save.stats.costituzione + this.mods.maxHp) * (this.run.patto ? 2 : 1);
    }

    /** effetti degli amuleti indossati, ricalcolati solo quando cambiano */
    get mods(): CharmMods {
        if (!this.modsCache) this.modsCache = charmMods(this.save.equipped);
        return this.modsCache;
    }

    get maxFlow(): number {
        return (99 + this.save.stats.flusso * 10) * (this.run.patto ? 2 : 1);
    }

    get risonanteDamage(): number {
        return COMBAT.risonanteDamage * (1 + this.save.stats.flusso * 0.1) * this.mods.risonante;
    }

    get damageMult(): number {
        return (this.run.trenbolone ? 2 : 1) * (this.run.patto ? 2 : 1) * this.mods.damage;
    }

    resetRun(): void {
        this.modsCache = null;
        this.run = { hp: 0, flow: 0, trenbolone: false, smela: false, patto: false, nearMic: false };
        this.run.hp = this.maxHp;
        this.run.trenbolone = this.hasFlag('trenbolone-attivo');
    }

    /** segna una stanza come esplorata; true se è nuova */
    explore(regionId: string, room: number): boolean {
        const list = (this.save.explored[regionId] ??= []);
        if (list.includes(room)) return false;
        list.push(room);
        return true;
    }

    persist(): void {
        // scrittura sincrona su disco: in combattimento arrivano a raffica,
        // quindi si scrive al massimo ogni 1.5s e il resto si accoda
        const now = performance.now();
        if (now - this.lastPersist < 1500) {
            this.dirty = true;
            return;
        }
        this.writeSave();
    }

    /** scrive se c'è qualcosa in coda (ogni frame) o subito (cambi di stato) */
    flushPersist(force = false): void {
        if (!this.dirty) return;
        if (!force && performance.now() - this.lastPersist < 2000) return;
        this.writeSave();
    }

    private writeSave(): void {
        this.lastPersist = performance.now();
        this.dirty = false;
        localStorage.setItem(SAVE_KEY, JSON.stringify(this.save));
    }

    persistSettings(): void {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    }

    reset(): void {
        this.save = defaultSave();
        this.modsCache = null;
        this.dropped = null;
        this.resetRun();
        // il prossimo persist scrive subito: hasSave torna vero immediatamente
        this.lastPersist = 0;
        this.dirty = false;
        localStorage.removeItem(SAVE_KEY);
    }

    get abilities(): AbilityId[] {
        if (this.godMode) {
            return [
                'scivolata',
                'rimbalzo',
                'aggrappo',
                'riflesso',
                'risonante',
                'analisi',
                'scudo',
                'acquatossica'
            ];
        }
        return this.save.abilities;
    }

    hasAbility(a: AbilityId): boolean {
        return this.abilities.includes(a);
    }

    unlockAbility(a: AbilityId): void {
        if (!this.save.abilities.includes(a)) {
            this.save.abilities.push(a);
            this.persist();
        }
    }

    /* ---------- zaino e amuleti ---------- */

    count(id: string): number {
        return this.save.inventory[id] ?? 0;
    }

    addItem(id: string, n = 1): void {
        if (ITEMS[id]?.kind === 'amuleto') {
            this.giveCharm(id);
            return;
        }
        if (id === 'tacca') {
            this.save.notches += n;
            this.persist();
            return;
        }
        this.save.inventory[id] = this.count(id) + n;
        this.persist();
        bus.emit('inventory-changed', {});
    }

    removeItem(id: string, n = 1): boolean {
        if (this.count(id) < n) return false;
        this.save.inventory[id] = this.count(id) - n;
        if (this.save.inventory[id] <= 0) delete this.save.inventory[id];
        this.persist();
        bus.emit('inventory-changed', {});
        return true;
    }

    hasCharm(id: string): boolean {
        return this.save.charms.includes(id);
    }

    giveCharm(id: string): void {
        if (this.hasCharm(id)) return;
        this.save.charms.push(id);
        this.persist();
    }

    get usedNotches(): number {
        return this.save.equipped.reduce((sum, id) => sum + (ITEMS[id]?.cost ?? 0), 0);
    }

    isEquipped(id: string): boolean {
        return this.save.equipped.includes(id);
    }

    /** ritorna il motivo del rifiuto, o null se è andata */
    toggleCharm(id: string): string | null {
        if (!this.run.nearMic && !this.godMode) return 'gli amuleti si cambiano solo vicino a un microfono.';
        if (this.isEquipped(id)) {
            this.save.equipped = this.save.equipped.filter((e) => e !== id);
        } else {
            const cost = ITEMS[id]?.cost ?? 0;
            if (this.usedNotches + cost > this.save.notches) return 'tacche finite. togline uno o trovane altre.';
            this.save.equipped.push(id);
        }
        this.modsCache = null;
        this.run.hp = Math.min(this.run.hp, this.maxHp);
        this.persist();
        return null;
    }

    pushMessage(sender: string, text: string): void {
        this.save.messages.push({ sender, text, at: Date.now(), read: false });
        // il telefono non è un archivio infinito
        if (this.save.messages.length > 120) this.save.messages.splice(0, this.save.messages.length - 120);
        this.persist();
    }

    get unreadMessages(): number {
        return this.save.messages.filter((m) => !m.read).length;
    }

    hasFlag(f: string): boolean {
        return this.save.flags.includes(f);
    }

    setFlag(f: string): void {
        if (!this.hasFlag(f)) {
            this.save.flags.push(f);
            this.persist();
        }
    }

    removeFlag(f: string): void {
        const idx = this.save.flags.indexOf(f);
        if (idx !== -1) {
            this.save.flags.splice(idx, 1);
            this.persist();
        }
    }

    /** una mossa del geco finisce nel profilo dell'ombra, una sola volta */
    observeOmbra(act: PlayerAct): void {
        if (observeOmbraAct(this.save.ombra, act)) this.persist();
    }

    /** una ripresa riuscita nel centro dati: alza la precisione, non i danni */
    recordOmbraSighting(): void {
        if (this.save.ombra.sightings >= 8) return;
        this.save.ombra.sightings += 1;
        this.persist();
    }

    /** avanza il doomsday col tempo reale; ritorna il valore aggiornato (0..1) */
    tickDoomsday(deltaMs: number): number {
        if (!this.save.doomsdayMode || this.save.doomsday >= 1) return this.save.doomsday;
        this.save.doomsday = Math.min(1, this.save.doomsday + deltaMs / DOOMSDAY_FILL_MS);
        // persistere ogni frame sarebbe spreco: salviamo ogni ~5s di gioco
        this.doomsdaySinceSave += deltaMs;
        if (this.doomsdaySinceSave > 5000) {
            this.doomsdaySinceSave = 0;
            this.persist();
        }
        return this.save.doomsday;
    }

    /** un boss di trama abbattuto ricaccia indietro il doomsday */
    relieveDoomsday(): void {
        if (!this.save.doomsdayMode) return;
        this.save.doomsday = Math.max(0, this.save.doomsday - DOOMSDAY_BOSS_RELIEF);
        this.persist();
    }

    /** pedro respinto: il realm respira di nuovo, ma non torna a zero */
    setDoomsday(v: number): void {
        this.save.doomsday = Math.max(0, Math.min(1, v));
        this.persist();
    }
}

export const state = new GameState();
