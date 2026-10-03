import type { AbilityId, OmbraAction, OmbraProfile } from '../types';

/* un solo vocabolario per le mosse: lo usano player, scena e cervello dell'ombra */
export type { OmbraAction, OmbraProfile } from '../types';

/** una decisione del geco, mai un tasto fisico */
export interface PlayerAct {
    act: 'attack' | 'dash' | 'jump' | 'heal-start' | 'heal' | 'wave';
    dir?: 'side' | 'up' | 'down' | 'shot';
    wave?: AbilityId;
    level?: number;
}

export interface OmbraInsight {
    action: OmbraAction;
    confidence: number; // 0..1
    label: 'fendente' | 'scivolata' | 'cura' | 'wave';
}

/** profilo vuoto: ogni partita ricomincia da zero */
export function defaultOmbraProfile(): OmbraProfile {
    return {
        version: 1,
        total: 0,
        counts: {
            'attack-side': 0, 'attack-up': 0, 'attack-down': 0,
            dash: 0, jump: 0, 'heal-start': 0, 'heal-done': 0,
            'wave-risonante': 0, 'wave-riflesso': 0, 'wave-analisi': 0,
            'wave-scudo': 0, 'wave-acquatossica': 0,
        },
        sightings: 0,
        premium: false,
    };
}

/** un salvataggio vecchio o corrotto non deve mai rendere il boss ingestibile */
export function sanitizeOmbraProfile(raw: unknown): OmbraProfile {
    const def = defaultOmbraProfile();
    if (!raw || typeof raw !== 'object') return def;
    const p = raw as Partial<OmbraProfile>;
    if (p.version !== 1) return def;
    const counts = { ...def.counts };
    if (p.counts && typeof p.counts === 'object') {
        for (const k of Object.keys(def.counts) as OmbraAction[]) {
            const v = (p.counts as Record<string, unknown>)[k];
            counts[k] = typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0;
        }
    }
    const sum = Object.values(counts).reduce((a, b) => a + b, 0);
    const total = typeof p.total === 'number' && Number.isFinite(p.total) ? Math.floor(p.total) : 0;
    const sightings = typeof p.sightings === 'number' && Number.isFinite(p.sightings)
        ? Math.min(8, Math.max(0, Math.floor(p.sightings)))
        : 0;
    return {
        version: 1,
        total: Math.max(0, total, sum),
        counts,
        sightings,
        premium: p.premium === true,
    };
}

/** dalla decisione alla categoria; null se non è una scelta che conta */
export function normalizeOmbraAct(act: PlayerAct): OmbraAction | null {
    switch (act.act) {
        case 'attack':
            if (act.dir === 'side') return 'attack-side';
            if (act.dir === 'up') return 'attack-up';
            if (act.dir === 'down') return 'attack-down';
            return null;
        case 'dash':
            return 'dash';
        case 'jump':
            return 'jump';
        case 'heal-start':
            return 'heal-start';
        case 'heal':
            return 'heal-done';
        case 'wave':
            if (act.wave === 'risonante') return 'wave-risonante';
            if (act.wave === 'riflesso') return 'wave-riflesso';
            if (act.wave === 'analisi') return 'wave-analisi';
            if (act.wave === 'scudo') return 'wave-scudo';
            if (act.wave === 'acquatossica') return 'wave-acquatossica';
            return null;
        default:
            return null;
    }
}

/** registra una mossa; true se il profilo è cambiato */
export function observe(profile: OmbraProfile, act: PlayerAct): boolean {
    const action = normalizeOmbraAct(act);
    if (!action) return false;
    profile.counts[action] += 1;
    profile.total += 1;
    return true;
}

const CANDIDATES: OmbraAction[] = [
    'attack-side', 'attack-up', 'attack-down',
    'dash', 'heal-start', 'heal-done',
    'wave-risonante', 'wave-riflesso', 'wave-analisi',
    'wave-scudo', 'wave-acquatossica',
];

const LABELS: Record<OmbraAction, OmbraInsight['label']> = {
    'attack-side': 'fendente', 'attack-up': 'fendente', 'attack-down': 'fendente',
    dash: 'scivolata', jump: 'fendente',
    'heal-start': 'cura', 'heal-done': 'cura',
    'wave-risonante': 'wave', 'wave-riflesso': 'wave', 'wave-analisi': 'wave',
    'wave-scudo': 'wave', 'wave-acquatossica': 'wave',
};

/** chi ripete una mossa è leggibile; chi varia va lasciato in pace */
export function strongestHabit(
    profile: OmbraProfile,
    recent: readonly OmbraAction[],
    premium: boolean,
): OmbraInsight | null {
    if (profile.total < 12 || recent.length === 0) return null;
    const footage = premium ? 1 : 0.55 + Math.min(profile.sightings, 4) * 0.08;
    let best: { action: OmbraAction; confidence: number } | null = null;
    let second = 0;
    for (const action of CANDIDATES) {
        const globalShare = profile.counts[action] / Math.max(1, profile.total);
        let n = 0;
        for (const a of recent) if (a === action) n++;
        const recentShare = n / Math.max(1, recent.length);
        const confidence = Math.min(1, (globalShare * 0.35 + recentShare * 0.65) * footage);
        if (!best || confidence > best.confidence) {
            if (best) second = best.confidence;
            best = { action, confidence };
        } else if (confidence > second) {
            second = confidence;
        }
    }
    if (!best || best.confidence < 0.32) return null;
    if (best.confidence - second < 0.06) return null;
    return { action: best.action, confidence: best.confidence, label: LABELS[best.action] };
}
