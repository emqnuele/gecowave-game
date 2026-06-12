import { COMBAT } from '../config';
import type { AbilityId, DroppedBarre, SaveData } from '../types';

const SAVE_KEY = 'gecowave-save-v2';
const SETTINGS_KEY = 'gecowave-settings-v1';

/* il collasso ci mette ~22 minuti di gioco passivo a riempirsi.
   ogni boss di trama abbattuto lo ricaccia indietro di un bel pezzo. */
const COLLASSO_FILL_MS = 22 * 60 * 1000;
const COLLASSO_BOSS_RELIEF = 0.14;

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
    collassoMode: false,
    collasso: 0,
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
    godMode = false;
    /** barre lasciate a terra all'ultima morte, stile souls */
    dropped: DroppedBarre | null = null;
    /** vita, flow e malus della run corrente: non si salvano, si vivono */
    run = { hp: 5, flow: 0, trenbolone: false, smela: false, patto: false };
    /** dove tornare uscendo da un capitolo segreto (transient, non persistito) */
    portalReturn: PortalReturn | null = null;
    private collassoSinceSave = 0;

    constructor() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (raw) {
                this.save = { ...defaultSave(), ...JSON.parse(raw) };
                if (typeof this.save.barre !== 'number' || isNaN(this.save.barre)) {
                    this.save.barre = 0;
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
        return (5 + this.save.stats.costituzione) * (this.run.patto ? 2 : 1);
    }

    get maxFlow(): number {
        return (99 + this.save.stats.flusso * 10) * (this.run.patto ? 2 : 1);
    }

    get risonanteDamage(): number {
        return COMBAT.risonanteDamage * (1 + this.save.stats.flusso * 0.1);
    }

    get damageMult(): number {
        return (this.run.trenbolone ? 2 : 1) * (this.run.patto ? 2 : 1);
    }

    resetRun(): void {
        this.run = { hp: 0, flow: 0, trenbolone: false, smela: false, patto: false };
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

    /** avanza il collasso col tempo reale; ritorna il valore aggiornato (0..1) */
    tickCollasso(deltaMs: number): number {
        if (!this.save.collassoMode || this.save.collasso >= 1) return this.save.collasso;
        this.save.collasso = Math.min(1, this.save.collasso + deltaMs / COLLASSO_FILL_MS);
        // persistere ogni frame sarebbe spreco: salviamo ogni ~5s di gioco
        this.collassoSinceSave += deltaMs;
        if (this.collassoSinceSave > 5000) {
            this.collassoSinceSave = 0;
            this.persist();
        }
        return this.save.collasso;
    }

    /** un boss di trama abbattuto ricaccia indietro il collasso */
    relieveCollasso(): void {
        if (!this.save.collassoMode) return;
        this.save.collasso = Math.max(0, this.save.collasso - COLLASSO_BOSS_RELIEF);
        this.persist();
    }

    /** pedro respinto: il realm respira di nuovo, ma non torna a zero */
    setCollasso(v: number): void {
        this.save.collasso = Math.max(0, Math.min(1, v));
        this.persist();
    }
}

export const state = new GameState();
