import Phaser from 'phaser';

/* Pelle del geco: palette swap mirato sullo sheet originale.
   Ricordati solo una cosa: lo swap avviene UNA volta sola (boot, menu,
   forgia), mai per-frame. In gioco il costo è zero: stessa texture,
   stessi draw call. Ogni variante attiva è una copia dello sheet
   (~16MB GPU), quindi ne esiste una sola alla volta. */

export interface SkinPreset {
    id: string;
    name: string;
    /** hue di destinazione in gradi; null = texture originale intatta */
    hue: number | null;
    satMul?: number;
    lightAdd?: number;
    /** pallino mostrato nella forgia */
    swatch: string;
    /** filtro CSS completo per l'anteprima DOM (approssimata) */
    previewFilter: string;
}

const BASE_PREVIEW = 'drop-shadow(0 0 30px rgba(255, 140, 60, 0.18)) sepia(0.25)';

export const SKIN_PRESETS: SkinPreset[] = [
    { id: 'bosco', name: 'bosco', hue: null, swatch: '#33402c', previewFilter: BASE_PREVIEW },
    { id: 'laguna', name: 'laguna', hue: 186, swatch: '#35c4b5', previewFilter: `${BASE_PREVIEW} hue-rotate(86deg)` },
    { id: 'abisso', name: 'abisso', hue: 218, swatch: '#4a7dd6', previewFilter: `${BASE_PREVIEW} hue-rotate(118deg)` },
    { id: 'ametista', name: 'ametista', hue: 282, swatch: '#a06ee0', previewFilter: `${BASE_PREVIEW} hue-rotate(-178deg)` },
    { id: 'ciliegia', name: 'ciliegia', hue: 338, swatch: '#e0528a', previewFilter: `${BASE_PREVIEW} hue-rotate(-122deg)` },
    { id: 'spettro', name: 'spettro', hue: 100, satMul: 0.15, lightAdd: 0.22, swatch: '#cfd4c8', previewFilter: `${BASE_PREVIEW} grayscale(0.85) brightness(1.25)` },
];

export const DEFAULT_SKIN_ID = 'bosco';

export function skinPreset(id: unknown): SkinPreset {
    const found = SKIN_PRESETS.find((p) => p.id === id);
    return found ?? SKIN_PRESETS[0]!;
}

export function isValidSkinId(id: unknown): boolean {
    return typeof id === 'string' && SKIN_PRESETS.some((p) => p.id === id);
}

/* ---------- matematica colore pura (niente DOM, testabile) ---------- */

/** hue misurato della pelle originale: verde bosco scuro (~100°) */
export const SOURCE_SKIN_HUE = 100;
/** mantello (~25°) e occhi (~0°) restano fuori da questa finestra */
const HUE_WINDOW = 38;
const SAT_MIN = 0.07;
const LIGHT_MIN = 0.04;
const LIGHT_MAX = 0.65;

const hueDist = (a: number, b: number): number => {
    const d = Math.abs(a - b) % 360;
    return d > 180 ? 360 - d : d;
};

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    r /= 255;
    g /= 255;
    b /= 255;
    const mx = Math.max(r, g, b);
    const mn = Math.min(r, g, b);
    const l = (mx + mn) / 2;
    const d = mx - mn;
    if (!d) return [0, 0, l];
    const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    let h: number;
    if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (mx === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
    return [h, s, l];
}

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
    h = ((h % 360) + 360) % 360 / 360;
    if (!s) {
        const v = Math.round(l * 255);
        return [v, v, v];
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const ch = (t: number): number => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };
    return [Math.round(ch(h + 1 / 3) * 255), Math.round(ch(h) * 255), Math.round(ch(h - 1 / 3) * 255)];
}

/** true se il pixel appartiene alla pelle (verde bosco), non a mantello/occhi/effetti */
export function isSkinPixel(r: number, g: number, b: number, a: number): boolean {
    if (a < 10) return false;
    const [h, s, l] = rgbToHsl(r, g, b);
    return s >= SAT_MIN && l >= LIGHT_MIN && l <= LIGHT_MAX && hueDist(h, SOURCE_SKIN_HUE) <= HUE_WINDOW;
}

/**
 * Ricolora in place i pixel di pelle di un buffer RGBA.
 * Conserva shading (lightness) e variazione di tinta: solo lo hue ruota.
 */
export function recolorSkinPixels(data: Uint8ClampedArray, preset: SkinPreset): { changed: number; total: number } {
    if (preset.hue === null && preset.satMul === undefined && preset.lightAdd === undefined) {
        return { changed: 0, total: data.length / 4 };
    }
    const target = preset.hue ?? SOURCE_SKIN_HUE;
    let changed = 0;
    for (let i = 0; i < data.length; i += 4) {
        const a = data[i + 3]!;
        if (a < 10) continue;
        const r = data[i]!;
        const g = data[i + 1]!;
        const b = data[i + 2]!;
        const [h, s, l] = rgbToHsl(r, g, b);
        if (s < SAT_MIN || l < LIGHT_MIN || l > LIGHT_MAX) continue;
        if (hueDist(h, SOURCE_SKIN_HUE) > HUE_WINDOW) continue;
        const nh = target + (h - SOURCE_SKIN_HUE) * 0.75;
        const ns = Math.min(1, Math.max(0, s * (preset.satMul ?? 1)));
        const nl = Math.min(0.92, Math.max(0.02, l + (preset.lightAdd ?? 0)));
        const [nr, ng, nb] = hslToRgb(nh, ns, nl);
        data[i] = nr;
        data[i + 1] = ng;
        data[i + 2] = nb;
        changed++;
    }
    return { changed, total: data.length / 4 };
}

/* ---------- applicazione alle texture di gioco ---------- */

/** copia incontaminata dello sheet, catturata prima del primo swap */
let pristine: HTMLCanvasElement | null = null;
let appliedId: string | null = null;

function capturePristine(scene: Phaser.Scene): boolean {
    if (pristine) return true;
    if (!scene.textures.exists('player')) return false;
    const src = scene.textures.get('player').getSourceImage() as unknown as CanvasImageSource & { width?: number; height?: number };
    const w = (src as { width?: number }).width ?? 0;
    const h = (src as { height?: number }).height ?? 0;
    if (!w || !h) return false;
    const cv = document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    if (!ctx) return false;
    ctx.drawImage(src, 0, 0);
    pristine = cv;
    return true;
}

/** ricrea le anim del player sui frame della texture (eventualmente) sostituita */
export function refreshPlayerAnims(scene: Phaser.Scene): void {
    const defs: Array<[string, string, number, number, number, number]> = [
        ['p-idle', 'player', 0, 7, 5, -1],
        ['p-run', 'player', 8, 15, 11, -1],
        ['p-jump', 'player', 16, 19, 10, 0],
        ['p-land', 'player', 20, 23, 14, 0],
        ['p-attack', 'player_atk', 12, 15, 18, 0],
    ];
    for (const [key, tex, start, end, frameRate, repeat] of defs) {
        try {
            if (!scene.textures.exists(tex)) continue;
            if (scene.anims.exists(key)) scene.anims.remove(key);
            scene.anims.create({ key, frames: scene.anims.generateFrameNumbers(tex, { start, end }), frameRate, repeat });
        } catch {
            /* test */
        }
    }
}

/**
 * Garantisce che le texture `player`/`player_atk` usino la pelle scelta.
 * Idempotente: se la pelle è già quella, non tocca niente.
 * Va chiamata prima di creare sprite del player (Boot/Menu/Game).
 */
export function ensurePlayerSkin(scene: Phaser.Scene, skinId: unknown): void {
    const preset = skinPreset(isValidSkinId(skinId) ? skinId : DEFAULT_SKIN_ID);
    if (appliedId === preset.id && scene.textures.exists('player') && scene.textures.exists('player_atk')) return;
    if (!capturePristine(scene)) return;
    const src = pristine!;
    const out = document.createElement('canvas');
    out.width = src.width;
    out.height = src.height;
    const ctx = out.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.drawImage(src, 0, 0);
    try {
        const img = ctx.getImageData(0, 0, out.width, out.height);
        recolorSkinPixels(img.data, preset);
        ctx.putImageData(img, 0, 0);
    } catch {
        return;
    }
    try {
        if (scene.textures.exists('player')) scene.textures.remove('player');
        if (scene.textures.exists('player_atk')) scene.textures.remove('player_atk');
        scene.textures.addSpriteSheet('player', out as unknown as HTMLImageElement, { frameWidth: 350, frameHeight: 350 });
        scene.textures.addSpriteSheet('player_atk', out as unknown as HTMLImageElement, { frameWidth: 700, frameHeight: 350 });
    } catch {
        return;
    }
    refreshPlayerAnims(scene);
    appliedId = preset.id;
}

/** solo per test/dev: dimentica lo stato e ricattura dal loader */
export function resetPlayerSkinCache(): void {
    pristine = null;
    appliedId = null;
}
