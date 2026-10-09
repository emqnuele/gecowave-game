/* le pelli del geco: dati puri, li usano il salvataggio, la forgia e la cottura della texture */

export interface SkinPreset {
    id: string;
    name: string;
    /** hue di destinazione in gradi; null = texture originale intatta */
    hue: number | null;
    satMul?: number;
    lightAdd?: number;
    /** pallino di riserva prima che l'anteprima vera sia pronta */
    swatch: string;
}

/* I finali sono tarati sulla luce vera del gioco (vedi GAME_LIGHT):
   saturazione e luminosità alte in texture, perché in scena il buio
   e il verde della luce del geco comprimono tutto. */

export const SKIN_PRESETS: SkinPreset[] = [
    { id: 'bosco', name: 'bosco', hue: null, swatch: '#2c5230' },
    { id: 'laguna', name: 'laguna', hue: 180, satMul: 3.0, lightAdd: 0.16, swatch: '#29b7bc' },
    { id: 'abisso', name: 'abisso', hue: 224, satMul: 3.0, lightAdd: 0.16, swatch: '#2962bc' },
    { id: 'ametista', name: 'ametista', hue: 282, satMul: 3.2, lightAdd: 0.18, swatch: '#8f37cc' },
    { id: 'ciliegia', name: 'ciliegia', hue: 338, satMul: 3.4, lightAdd: 0.16, swatch: '#a22f4f' },
    { id: 'spettro', name: 'spettro', hue: 100, satMul: 0.15, lightAdd: 0.22, swatch: '#73a688' },
];

export const DEFAULT_SKIN_ID = 'bosco';

export function skinPreset(id: unknown): SkinPreset {
    const found = SKIN_PRESETS.find((p) => p.id === id);
    return found ?? SKIN_PRESETS[0]!;
}

export function isValidSkinId(id: unknown): boolean {
    return typeof id === 'string' && SKIN_PRESETS.some((p) => p.id === id);
}
