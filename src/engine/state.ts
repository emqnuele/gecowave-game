import type { AbilityId, DroppedBarre, SaveData } from '../types';

const SAVE_KEY = 'gecowave-save-v1';
const SETTINGS_KEY = 'gecowave-settings-v1';

export interface Settings {
    volume: number;
    screenShake: boolean;
}

const defaultSave = (): SaveData => ({
    levelId: 'vico',
    checkpointId: null,
    barre: 0,
    abilities: [],
    seenDialogues: [],
    collectedLore: [],
    bossDefeated: false,
});

/** stato persistente + stato di run, unica fonte di verità fuori dalle scene */
class GameState {
    save: SaveData = defaultSave();
    settings: Settings = { volume: 0.7, screenShake: true };
    /** barre lasciate a terra all'ultima morte, stile souls */
    dropped: DroppedBarre | null = null;
    /** vita e flow della run corrente: non si salvano, si vivono */
    run = { hp: 5, flow: 0 };

    resetRun(): void {
        this.run = { hp: 5, flow: 0 };
    }

    constructor() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (raw) this.save = { ...defaultSave(), ...JSON.parse(raw) };
            const s = localStorage.getItem(SETTINGS_KEY);
            if (s) this.settings = { ...this.settings, ...JSON.parse(s) };
        } catch {
            // storage corrotto o bloccato: si riparte da zero
        }
    }

    get hasSave(): boolean {
        return localStorage.getItem(SAVE_KEY) !== null;
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
}

export const state = new GameState();
