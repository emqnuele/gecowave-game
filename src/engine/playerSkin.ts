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

/* ---------- luce di gioco nominale (Light2D, vedi Light.frag) ----------
   Al centro del player la sua stessa luce vale ~1 (attenuazione 1,
   diffuse 1 con la normal map piatta), quindi:
   finale = albedo * (ambient + luce_propria), clamp a 1.
   Ambient del crater (perduta/bus): 6+rim*k, k = 0.11*3.4.
   Luce propria: 0xaaffdd @1.35. Torce e biomi spostano un po' il
   risultato, ma questa è la base su cui sono tarate le pelli. */
export const GAME_LIGHT = {
    r: 75 / 255 + 0xaa / 255,
    g: 80 / 255 + 0xff / 255,
    b: 70 / 255 + 0xdd / 255,
};

/** esposizione del cuore (centro della point light, intensità 1.35): il colore che l'occhio legge */
export const GAME_LIGHT_CORE = {
    r: 75 / 255 + (0xaa / 255) * 1.35,
    g: 80 / 255 + (0xff / 255) * 1.35,
    b: 70 / 255 + (0xdd / 255) * 1.35,
};

/** il cuore vale ~1.32x il bordo: 1.35/1.02 come in Light.frag */
const FALLOFF_TOP = 1.32;

/** applica la luce nominale (esposizione dei bordi) a un buffer RGBA */
export function simulateGameLight(data: Uint8ClampedArray): void {
    for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3]! < 10) continue;
        data[i] = Math.min(255, data[i]! * GAME_LIGHT.r);
        data[i + 1] = Math.min(255, data[i + 1]! * GAME_LIGHT.g);
        data[i + 2] = Math.min(255, data[i + 2]! * GAME_LIGHT.b);
    }
}

/**
 * Caduta della luce propria: la point light sta sul petto del geco.
 * In Light.frag il centro vale 1.35 e i bordi ~1.0: questa funzione parte
 * dalla base (bordi) e solleva solo il cuore, mai oltre il vero.
 * Solo per l'anteprima: in game lo fa lo shader, non duplicarlo nelle texture.
 */
export function applyOwnLightFalloff(data: Uint8ClampedArray, w: number, h: number): void {
    const cx = w / 2;
    const cy = h * 0.42;
    const r = w * 0.55;
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4;
            if (data[i + 3]! < 10) continue;
            const d = Math.hypot(x - cx, y - cy) / r;
            const f = 1 + (FALLOFF_TOP - 1) * Math.max(0, 1 - d * d);
            data[i] = Math.min(255, data[i]! * f);
            data[i + 1] = Math.min(255, data[i + 1]! * f);
            data[i + 2] = Math.min(255, data[i + 2]! * f);
        }
    }
}

/** pixel canonico di pelle (testa, frame 0): da qui nasce il pallino della forgia */
const SKIN_BASE_PIXEL: [number, number, number] = [36, 49, 33];

/** colore finale simulato in game per un preset, in css: il pallino dice la verità */
export function skinFinalCss(preset: SkinPreset): string {
    // l'occhio legge il cuore della luce, non i bordi
    const L = GAME_LIGHT_CORE;
    if (preset.hue === null && preset.satMul === undefined && preset.lightAdd === undefined) {
        const [r, g, b] = SKIN_BASE_PIXEL;
        return `rgb(${Math.min(255, Math.round(r * L.r))},${Math.min(255, Math.round(g * L.g))},${Math.min(255, Math.round(b * L.b))})`;
    }
    const [h, s, l] = rgbToHsl(...SKIN_BASE_PIXEL);
    const target = preset.hue ?? SOURCE_SKIN_HUE;
    const [r, g, b] = hslToRgb(
        target + (h - SOURCE_SKIN_HUE) * 0.75,
        Math.min(1, Math.max(0, s * (preset.satMul ?? 1))),
        Math.min(0.92, Math.max(0.02, l + (preset.lightAdd ?? 0))),
    );
    return `rgb(${Math.min(255, Math.round(r * L.r))},${Math.min(255, Math.round(g * L.g))},${Math.min(255, Math.round(b * L.b))})`;
}

export const PLAYER_FRAME = 350;

/**
 * Anteprima onesta: ritaglia un frame dallo sheet, applica la pelle
 * con lo STESSO codice del gioco e poi la luce nominale. Ciò che vedi
 * è ciò che vedrai in game (a meno di torce e biomi lontani).
 */
export function renderSkinPreview(source: CanvasImageSource, preset: SkinPreset, frameIndex = 0): HTMLCanvasElement | null {
    const cols = Math.max(1, Math.floor((source as { width?: number }).width! / PLAYER_FRAME));
    const sx = (frameIndex % cols) * PLAYER_FRAME;
    const sy = Math.floor(frameIndex / cols) * PLAYER_FRAME;
    const cv = document.createElement('canvas');
    cv.width = PLAYER_FRAME;
    cv.height = PLAYER_FRAME;
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    try {
        ctx.drawImage(source, sx, sy, PLAYER_FRAME, PLAYER_FRAME, 0, 0, PLAYER_FRAME, PLAYER_FRAME);
        const img = ctx.getImageData(0, 0, PLAYER_FRAME, PLAYER_FRAME);
        recolorSkinPixels(img.data, preset);
        simulateGameLight(img.data);
        // la luce propria sta sul geco, non dietro: cuore luminoso che cade ai bordi
        applyOwnLightFalloff(img.data, PLAYER_FRAME, PLAYER_FRAME);
        ctx.putImageData(img, 0, 0);
    } catch {
        return null;
    }
    return cv;
}

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
