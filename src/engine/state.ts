import { COMBAT } from '../config';
import type { AbilityId, DroppedBarre, SaveData } from '../types';

const SAVE_KEY = 'gecowave-save-v2';
const SETTINGS_KEY = 'gecowave-settings-v1';

export interface Settings {
    volume: number;
    screenShake: boolean;
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
    stats: {
        forza: 0,
        costituzione: 0,
        flusso: 0,
    },
});

/** stato persistente + stato di run, unica fonte di verità fuori dalle scene */
class GameState {
    save: SaveData = defaultSave();
    settings: Settings = { volume: 0.7, screenShake: true };
    /** barre lasciate a terra all'ultima morte, stile souls */
    dropped: DroppedBarre | null = null;
    /** vita, flow e malus della run corrente: non si salvano, si vivono */
    run = { hp: 5, flow: 0, trenbolone: false, smela: false };

    constructor() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (raw) this.save = { ...defaultSave(), ...JSON.parse(raw) };
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
        return 5 + this.save.stats.costituzione;
    }

    get maxFlow(): number {
        return 99 + this.save.stats.flusso * 10;
    }

    get risonanteDamage(): number {
        return COMBAT.risonanteDamage * (1 + this.save.stats.flusso * 0.1);
    }

    get damageMult(): number {
        return this.run.trenbolone ? 2 : 1;
    }

    resetRun(): void {
        this.run = { hp: this.maxHp, flow: 0, trenbolone: false, smela: false };
    }

    persist(): void {
        localStorage.setItem(SAVE_KEY, JSON.stringify(this.save));
    }

    persistSettings(): void {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    }

    reset(): void {
        this.save = defaultSave();
        this.dropped = null;
        this.resetRun();
        localStorage.removeItem(SAVE_KEY);
    }

    hasAbility(a: AbilityId): boolean {
        return this.save.abilities.includes(a);
    }

    unlockAbility(a: AbilityId): void {
        if (!this.hasAbility(a)) {
            this.save.abilities.push(a);
            this.persist();
        }
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
}

export const state = new GameState();
