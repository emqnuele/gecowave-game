/* l'obiettivo della camera: quanto si storce, si sporca e si scolora l'immagine.
   solo presentazione: nessun numero di qui torna mai nella logica del gioco */

export interface Lens {
    /** rotazione in radianti */
    angle: number;
    /** ingrandimento in più, sopra quello che serve a coprire i bordi */
    zoom: number;
    /** botte (+) o cuscino (-) */
    barrel: number;
    /** colori che si separano verso i bordi */
    chroma: number;
    /** 1 bianco e nero, negativo satura */
    desat: number;
    /** velo di colore sopra tutto, anche sul cielo dietro al canvas */
    tint: number;
    tintColor: number;
    /** l'acqua: l'immagine ondeggia */
    wave: number;
    /** righe che saltano */
    glitch: number;
    /** la serratura dell'armadio */
    keyhole: number;
    /** il bordo che pulsa di rosso */
    pulse: number;
    /** il bordo che si chiude nel buio */
    dark: number;
}

export const LENS_KEYS = ['angle', 'zoom', 'barrel', 'chroma', 'desat', 'tint', 'wave', 'glitch', 'keyhole', 'pulse', 'dark'] as const;
type Channel = (typeof LENS_KEYS)[number];

export type LensPart = Partial<Lens>;

export function restLens(): Lens {
    return { angle: 0, zoom: 0, barrel: 0, chroma: 0, desat: 0, tint: 0, tintColor: 0x000000, wave: 0, glitch: 0, keyhole: 0, pulse: 0, dark: 0 };
}

/** i canali che si sommano; serratura e scolorimento prendono il più forte */
const MAXED = new Set<Channel>(['keyhole', 'desat']);

const LIMITS: Record<Channel, [number, number]> = {
    angle: [-0.08, 0.08],
    zoom: [0, 0.25],
    barrel: [-0.35, 0.35],
    chroma: [0, 2],
    desat: [-0.6, 1],
    tint: [0, 0.6],
    wave: [0, 1.5],
    glitch: [0, 1],
    keyhole: [0, 1],
    pulse: [0, 0.6],
    dark: [0, 0.85],
};

/** somma i contributi, ognuno già pesato dal suo inviluppo. il colore del velo è la media pesata */
export function combine(parts: { lens: LensPart; weight: number }[]): Lens {
    const out = restLens();
    let tr = 0;
    let tg = 0;
    let tb = 0;
    for (const { lens, weight } of parts) {
        if (weight <= 0) continue;
        for (const k of LENS_KEYS) {
            const v = lens[k];
            if (v === undefined) continue;
            if (MAXED.has(k)) {
                const w = v * weight;
                if (Math.abs(w) > Math.abs(out[k])) out[k] = w;
            } else {
                out[k] += v * weight;
            }
        }
        if (lens.tint && lens.tintColor !== undefined) {
            const a = lens.tint * weight;
            tr += ((lens.tintColor >> 16) & 255) * a;
            tg += ((lens.tintColor >> 8) & 255) * a;
            tb += (lens.tintColor & 255) * a;
        }
    }
    if (out.tint > 0) {
        out.tintColor = (Math.round(tr / out.tint) << 16) | (Math.round(tg / out.tint) << 8) | Math.round(tb / out.tint);
    }
    for (const k of LENS_KEYS) {
        const [lo, hi] = LIMITS[k];
        out[k] = Math.min(hi, Math.max(lo, out[k]));
    }
    return out;
}

/** un colpo d'obiettivo: sale in attack, resta per hold, scende in release. 0 fuori */
export function envelope(t: number, attack: number, hold: number, release: number): number {
    if (t < 0) return 0;
    if (t < attack) return attack > 0 ? smooth(t / attack) : 1;
    t -= attack;
    if (t < hold) return 1;
    t -= hold;
    if (t < release) return 1 - smooth(t / release);
    return 0;
}

function smooth(x: number): number {
    return x * x * (3 - 2 * x);
}

/** quanto ingrandire perché rotazione e botte non scoprano mai gli angoli dello schermo */
export function coverZoom(angle: number, aspect: number, barrel: number): number {
    const a = Math.abs(angle);
    const long = Math.max(aspect, 1 / aspect);
    const rot = Math.cos(a) + Math.sin(a) * long;
    // la botte campiona più in fuori agli angoli: r^2 dell'angolo con la x scalata dall'aspetto
    const corner = aspect * aspect * 0.25 + 0.25;
    const bulge = barrel > 0 ? 1 + barrel * corner : 1;
    return rot * bulge;
}

/** vero se l'obiettivo è a riposo: lo shader si può spegnere */
export function isRest(l: Lens): boolean {
    return LENS_KEYS.every((k) => Math.abs(l[k]) < 1e-4);
}

/** il battito: un picco breve per ogni colpo, quasi zero tra uno e l'altro */
export function heartbeat(t: number, periodMs: number): number {
    const p = (t % periodMs) / periodMs;
    const lub = Math.exp(-Math.pow((p - 0.05) / 0.045, 2));
    const dub = 0.6 * Math.exp(-Math.pow((p - 0.22) / 0.05, 2));
    return Math.min(1, lub + dub);
}
