import { COMBAT } from '../config';
import { BASE_NOTCHES, charmMods, ITEMS, STARTING_ITEMS, type CharmMods } from '../content/items';
import type { AbilityId, DroppedBarre, SaveData } from '../types';

const SAVE_KEY = 'gecowave-save-v2';
const SETTINGS_KEY = 'gecowave-settings-v1';

/* il doomsday ci mette ~22 minuti di gioco passivo a riempirsi.
   ogni boss di trama abbattuto lo ricaccia indietro di un bel pezzo. */
const DOOMSDAY_FILL_MS = 22 * 60 * 1000;
const DOOMSDAY_BOSS_RELIEF = 0.14;

export interface Settings {
    volume: number;
    screenShake: boolean;
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
    record: { deaths: 0, kills: 0, bosses: 0, playMs: 0 },
    radio: null,
});

/** stato persistente + stato di run, unica fonte di verità fuori dalle scene */
class GameState {
    save: SaveData = defaultSave();
    settings: Settings = { volume: 0.7, screenShake: true };
    godMode = false;
    /** barre lasciate a terra all'ultima morte, stile souls */
    dropped: DroppedBarre | null = null;
    /** vita, flow e malus della run corrente: non si salvano, si vivono */
    run = { hp: 5, flow: 0, trenbolone: false, smela: false, patto: false, caffeMs: 0, santino: false, nearMic: false };
    private modsCache: CharmMods | null = null;
    /** dove tornare uscendo da un capitolo segreto (transient, non persistito) */
    portalReturn: PortalReturn | null = null;
    private doomsdaySinceSave = 0;

    constructor() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                const fresh = defaultSave();
                this.save = { ...fresh, ...parsed, record: { ...fresh.record, ...(parsed.record ?? {}) } };
                if (typeof this.save.barre !== 'number' || isNaN(this.save.barre)) {
                    this.save.barre = 0;
                }
                // fallback for backward compatibility
                if (parsed.collassoMode !== undefined && this.save.doomsdayMode === false) {
                    this.save.doomsdayMode = parsed.collassoMode;
                }
                if (parsed.collasso !== undefined && this.save.doomsday === 0) {
                    this.save.doomsday = parsed.collasso;
                }
            }
            const s = localStorage.getItem(SETTINGS_KEY);
            if (s) this.settings = { ...this.settings, ...JSON.parse(s) };
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
        return COMBAT.risonanteDamage * (1 + this.save.stats.flusso * 0.1);
    }

    get damageMult(): number {
        return (this.run.trenbolone ? 2 : 1) * (this.run.patto ? 2 : 1) * this.mods.damage;
    }

    resetRun(): void {
        this.modsCache = null;
        this.run = { hp: 0, flow: 0, trenbolone: false, smela: false, patto: false, caffeMs: 0, santino: false, nearMic: false };
        this.run.hp = this.maxHp;
        this.run.trenbolone = this.hasFlag('trenbolone-attivo');
    }

    persist(): void {
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
        localStorage.removeItem(SAVE_KEY);
    }

    get abilities(): AbilityId[] {
        if (this.godMode) {
            return [
                'scivolata',
                'rimbalzo',
                'riflesso',
                'risonante',
                'rigenerazione',
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
    }

    removeItem(id: string, n = 1): boolean {
        if (this.count(id) < n) return false;
        this.save.inventory[id] = this.count(id) - n;
        if (this.save.inventory[id] <= 0) delete this.save.inventory[id];
        this.persist();
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
