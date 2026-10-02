import type { LevelDef, ZoneColor } from '../types';

/* ogni capitolo ha un bioma: è lui a decidere di che materia è fatto
   il terreno, cosa cresce sopra e sotto, cosa si vede in lontananza */

export type Material = 'stone' | 'brick' | 'roots' | 'metal' | 'crystal' | 'circuit' | 'mud' | 'concrete' | 'void';
export type SurfaceDress = 'grass' | 'moss' | 'cables' | 'crystals' | 'rubble' | 'reeds' | 'books' | 'ash' | 'glitch' | 'sand' | 'bottles';
export type CeilingDress = 'roots' | 'stalactites' | 'chains' | 'cables' | 'vines' | 'drips' | 'glitch' | 'webs';
export type Skyline = 'crossroads' | 'depot' | 'cathedral' | 'crystals' | 'wreckage' | 'swamp' | 'factory' | 'library' | 'servers' | 'cellar' | 'dream' | 'void' | 'cave' | 'noir';
export type Ambience = 'spores' | 'dust' | 'embers' | 'rain' | 'bubbles' | 'glyphs' | 'ash' | 'data' | 'fireflies' | 'drips';
export type PropKind =
    | 'lantern' | 'gravestone' | 'bush' | 'mushroom' | 'bones' | 'signpost' | 'pillar'
    | 'books' | 'candles' | 'lectern' | 'barrel' | 'valve' | 'crate' | 'rack' | 'camera'
    | 'bottles' | 'busstop' | 'tire' | 'cone' | 'crystal' | 'mirror' | 'reeds' | 'toxic'
    | 'chair' | 'statue' | 'speaker' | 'tv' | 'scaffold' | 'cocoon';
export type SpikeStyle = 'thorns' | 'metal' | 'crystal' | 'glitch' | 'glass';

export interface BiomeDef {
    id: string;
    material: Material;
    /** colore medio della roccia, quello che si vede sul bordo illuminato */
    rock: number;
    /** colore del cuore del terreno, quasi nero */
    deep: number;
    /** luce sul bordo superiore */
    rim: number;
    ink: number;
    /** colore vivo di cristalli, muschio, led, spore */
    accent: number;
    surface: SurfaceDress[];
    ceiling: CeilingDress[];
    skyline: Skyline;
    skyTop: number;
    skyBottom: number;
    /** colore della foschia che schiarisce i piani lontani */
    haze: number;
    ambience: Ambience[];
    props: PropKind[];
    spikes: SpikeStyle;
    /** luce ambiente: più alta = più leggibile, più bassa = più paura */
    ambient: number;
    lightShafts: boolean;
    /** tutto al chiuso: niente cielo, la regione è una tana di stanze */
    indoor?: boolean;
    /** sagome scure in primo piano davanti al giocatore */
    foreground: 'leaves' | 'chains' | 'pillars' | 'pipes' | 'cables' | 'crystals' | 'reeds' | 'none';
}

const base = {
    ink: 0x0b0b10,
    deep: 0x07070b,
};

export const BIOMES: Record<string, BiomeDef> = {
    /* il cratere: pietra vecchia, muschio, lanterne. il crocevia di hk */
    crater: {
        ...base, id: 'crater', material: 'stone',
        rock: 0x5d5a52, rim: 0xb9c7a4, accent: 0x7ee08f,
        surface: ['grass', 'moss'], ceiling: ['roots', 'stalactites'],
        skyline: 'crossroads', skyTop: 0x0b1410, skyBottom: 0x1d2a22, haze: 0x2e4237,
        ambience: ['spores', 'dust'], props: ['lantern', 'gravestone', 'bush', 'mushroom', 'bones', 'signpost', 'pillar'],
        spikes: 'thorns', ambient: 0.11, lightShafts: true, foreground: 'leaves',
    },
    /* capolinea: cemento, asfalto, pensiline, cavi */
    depot: {
        ...base, id: 'depot', material: 'concrete',
        rock: 0x6a6455, rim: 0xe0c97a, accent: 0xfacc15,
        surface: ['rubble', 'cables'], ceiling: ['cables', 'drips'],
        skyline: 'depot', skyTop: 0x16120a, skyBottom: 0x2f2614, haze: 0x4a3d1f,
        ambience: ['dust'], props: ['busstop', 'tire', 'cone', 'signpost', 'crate', 'lantern'],
        spikes: 'metal', ambient: 0.12, lightShafts: false, foreground: 'cables',
    },
    /* santuario polarizzante: cristalli e specchi */
    sanctum: {
        ...base, id: 'sanctum', material: 'crystal',
        rock: 0x4c3f63, rim: 0xd8b8ff, accent: 0xc084fc,
        surface: ['crystals'], ceiling: ['stalactites', 'chains'],
        skyline: 'crystals', skyTop: 0x0e0816, skyBottom: 0x23163a, haze: 0x3b2860,
        ambience: ['glyphs', 'dust'], props: ['crystal', 'mirror', 'candles', 'statue', 'pillar'],
        spikes: 'crystal', ambient: 0.13, lightShafts: true, foreground: 'crystals',
    },
    /* tecnokill: dune, rottami, tralicci, braci */
    wasteland: {
        ...base, id: 'wasteland', material: 'metal',
        rock: 0x5e4a40, rim: 0xf0a080, accent: 0xf87171,
        surface: ['sand', 'rubble'], ceiling: ['cables', 'chains'],
        skyline: 'wreckage', skyTop: 0x170807, skyBottom: 0x3a1610, haze: 0x5a2618,
        ambience: ['embers', 'ash'], props: ['tire', 'crate', 'scaffold', 'tv', 'toxic', 'speaker'],
        spikes: 'metal', ambient: 0.12, lightShafts: false, foreground: 'pipes',
    },
    /* la via del trenbolone: laboratori clandestini, fango tossico */
    lab: {
        ...base, id: 'lab', indoor: true, material: 'mud',
        rock: 0x5a4532, rim: 0xffb86b, accent: 0xfb923c,
        surface: ['bottles', 'moss'], ceiling: ['drips', 'cables'],
        skyline: 'swamp', skyTop: 0x160d06, skyBottom: 0x33200f, haze: 0x5a3818,
        ambience: ['bubbles', 'embers'], props: ['toxic', 'barrel', 'bottles', 'crate', 'lantern'],
        spikes: 'glass', ambient: 0.12, lightShafts: false, foreground: 'pipes',
    },
    /* la tana: grotta di radici, ragnatele, bozzoli */
    burrow: {
        ...base, id: 'burrow', indoor: true, material: 'roots',
        rock: 0x4d3632, rim: 0xd99a8a, accent: 0xf87171,
        surface: ['moss'], ceiling: ['roots', 'webs'],
        skyline: 'cave', skyTop: 0x0c0606, skyBottom: 0x1f0f0d, haze: 0x2f1714,
        ambience: ['dust', 'drips'], props: ['bones', 'cocoon', 'mushroom', 'chair', 'tv'],
        spikes: 'thorns', ambient: 0.08, lightShafts: false, foreground: 'leaves',
    },
    /* il rio merdone: palude, canne, bolle */
    swamp: {
        ...base, id: 'swamp', material: 'mud',
        rock: 0x4e4a30, rim: 0xc8d27a, accent: 0xa3e635,
        surface: ['reeds', 'moss'], ceiling: ['vines', 'drips'],
        skyline: 'swamp', skyTop: 0x0d1006, skyBottom: 0x262b12, haze: 0x3b4220,
        ambience: ['bubbles', 'fireflies'], props: ['reeds', 'mushroom', 'barrel', 'signpost', 'bones', 'lantern'],
        spikes: 'thorns', ambient: 0.11, lightShafts: true, foreground: 'reeds',
    },
    /* lo stabilimento di smela: tubi, valvole, grate */
    factory: {
        ...base, id: 'factory', indoor: true, material: 'metal',
        rock: 0x3f5458, rim: 0x9ee8f0, accent: 0x22d3ee,
        surface: ['cables', 'rubble'], ceiling: ['cables', 'drips', 'chains'],
        skyline: 'factory', skyTop: 0x061214, skyBottom: 0x10292d, haze: 0x1b454b,
        ambience: ['drips', 'dust'], props: ['barrel', 'valve', 'crate', 'scaffold', 'bottles', 'lantern'],
        spikes: 'metal', ambient: 0.12, lightShafts: false, foreground: 'pipes',
    },
    /* la ruhra: biblioteche gotiche allagate */
    library: {
        ...base, id: 'library', material: 'brick',
        rock: 0x4a5368, rim: 0xb6cdf2, accent: 0x60a5fa,
        surface: ['books', 'rubble'], ceiling: ['chains', 'stalactites'],
        skyline: 'library', skyTop: 0x080c16, skyBottom: 0x1a2236, haze: 0x2b3a5a,
        ambience: ['glyphs', 'dust'], props: ['books', 'candles', 'lectern', 'pillar', 'chair', 'statue'],
        spikes: 'metal', ambient: 0.13, lightShafts: true, foreground: 'pillars',
    },
    /* la mente di piema: carta, formule, vuoto bianco */
    mind: {
        ...base, id: 'mind', indoor: true, material: 'crystal',
        rock: 0x50607a, rim: 0xdbe7ff, accent: 0x93c5fd,
        surface: ['books', 'crystals'], ceiling: ['glitch', 'chains'],
        skyline: 'dream', skyTop: 0x0a0f1c, skyBottom: 0x22304d, haze: 0x3a4c74,
        ambience: ['glyphs'], props: ['books', 'lectern', 'candles', 'crystal'],
        spikes: 'glass', ambient: 0.15, lightShafts: true, foreground: 'none',
    },
    /* il caso: città noir sotto la pioggia */
    noir: {
        ...base, id: 'noir', material: 'brick',
        rock: 0x434a5a, rim: 0x9fb0d0, accent: 0x60a5fa,
        surface: ['rubble', 'cables'], ceiling: ['drips', 'cables'],
        skyline: 'noir', skyTop: 0x05070d, skyBottom: 0x141b2a, haze: 0x222d44,
        ambience: ['rain'], props: ['lantern', 'signpost', 'crate', 'barrel', 'chair', 'tv'],
        spikes: 'glass', ambient: 0.1, lightShafts: false, foreground: 'cables',
    },
    /* la tommasorveglianza: data center */
    servers: {
        ...base, id: 'servers', indoor: true, material: 'circuit',
        rock: 0x2f4a50, rim: 0x7ef0ff, accent: 0x22d3ee,
        surface: ['cables'], ceiling: ['cables', 'glitch'],
        skyline: 'servers', skyTop: 0x030b0d, skyBottom: 0x0b2227, haze: 0x13383f,
        ambience: ['data'], props: ['rack', 'camera', 'tv', 'crate', 'speaker'],
        spikes: 'glitch', ambient: 0.11, lightShafts: false, foreground: 'cables',
    },
    /* la cantina di ticummi: mattoni, botti, bottiglie */
    cellar: {
        ...base, id: 'cellar', indoor: true, material: 'brick',
        rock: 0x4f3e3a, rim: 0xd6b494, accent: 0x60a5fa,
        surface: ['bottles', 'rubble'], ceiling: ['webs', 'drips'],
        skyline: 'cellar', skyTop: 0x0a0707, skyBottom: 0x1e1512, haze: 0x2e211c,
        ambience: ['dust', 'drips'], props: ['barrel', 'bottles', 'crate', 'candles', 'chair'],
        spikes: 'glass', ambient: 0.1, lightShafts: false, foreground: 'chains',
    },
    /* i ricordi di pedro: sogno sbiadito, frammenti bianchi */
    memory: {
        ...base, id: 'memory', indoor: true, material: 'stone',
        rock: 0x5a6a72, rim: 0xe6fbff, accent: 0x67e8f9,
        surface: ['ash', 'glitch'], ceiling: ['glitch', 'stalactites'],
        skyline: 'dream', skyTop: 0x0c1418, skyBottom: 0x26383f, haze: 0x45616b,
        ambience: ['ash', 'glyphs'], props: ['chair', 'tv', 'statue', 'books', 'speaker'],
        spikes: 'glitch', ambient: 0.15, lightShafts: true, foreground: 'none',
    },
    /* il void dei rimpianti */
    void: {
        ...base, id: 'void', indoor: true, material: 'void',
        rock: 0x2c3340, rim: 0x9fe9f5, accent: 0x22d3ee,
        surface: ['glitch', 'ash'], ceiling: ['glitch'],
        skyline: 'void', skyTop: 0x020305, skyBottom: 0x0b1218, haze: 0x152027,
        ambience: ['ash', 'data'], props: ['statue', 'chair', 'mirror', 'gravestone'],
        spikes: 'glitch', ambient: 0.08, lightShafts: false, foreground: 'none',
    },
    /* il nucleo di pedro: palco finale, cavi e casse */
    core: {
        ...base, id: 'core', indoor: true, material: 'circuit',
        rock: 0x353d52, rim: 0xa5f3fc, accent: 0x22d3ee,
        surface: ['cables', 'glitch'], ceiling: ['cables', 'chains'],
        skyline: 'servers', skyTop: 0x04060c, skyBottom: 0x10182a, haze: 0x1d2a45,
        ambience: ['data', 'embers'], props: ['speaker', 'rack', 'scaffold', 'tv'],
        spikes: 'glitch', ambient: 0.1, lightShafts: false, foreground: 'cables',
    },
    /* galliate e marcetti: provincia malata */
    province: {
        ...base, id: 'province', material: 'concrete',
        rock: 0x5a4a44, rim: 0xe0a08a, accent: 0xf87171,
        surface: ['rubble', 'sand'], ceiling: ['cables', 'drips'],
        skyline: 'depot', skyTop: 0x120707, skyBottom: 0x2c1512, haze: 0x45221d,
        ambience: ['dust', 'ash'], props: ['cone', 'tire', 'signpost', 'busstop', 'crate', 'chair'],
        spikes: 'glass', ambient: 0.11, lightShafts: false, foreground: 'cables',
    },
    /* la piazza: tufo caldo, lampioni, sedie dei bar. l'unico posto sereno */
    piazza: {
        ...base, id: 'piazza', material: 'concrete',
        rock: 0x6e5d48, rim: 0xf2d39a, accent: 0xfbbf24,
        surface: ['rubble'], ceiling: ['cables'],
        skyline: 'depot', skyTop: 0x0f0d16, skyBottom: 0x2a2030, haze: 0x4a3a35,
        ambience: ['dust'], props: ['lantern', 'chair', 'busstop', 'signpost', 'crate'],
        spikes: 'metal', ambient: 0.16, lightShafts: false, foreground: 'cables',
    },
};

const LEVEL_BIOME: Record<string, string> = {
    perduta: 'crater',
    bus: 'depot',
    barrato: 'depot',
    santuario: 'sanctum',
    tecnokill: 'wasteland',
    trenbolone: 'lab',
    tana: 'burrow',
    rio: 'swamp',
    stabilimento: 'factory',
    ruhra: 'library',
    mente: 'mind',
    caso: 'noir',
    sorveglianza: 'servers',
    cantina: 'cellar',
    ricordi: 'memory',
    void: 'void',
    nucleo: 'core',
    custode: 'crater',
    galliate: 'province',
    marcetti: 'province',
};

const ZONE_FALLBACK: Record<ZoneColor, string> = {
    green: 'crater',
    yellow: 'depot',
    purple: 'sanctum',
    red: 'wasteland',
    orange: 'swamp',
    blue: 'library',
    cyan: 'servers',
};

export function biomeFor(def: Pick<LevelDef, 'id' | 'color'> & { biome?: string }): BiomeDef {
    const id = def.biome ?? LEVEL_BIOME[def.id] ?? ZONE_FALLBACK[def.color];
    return BIOMES[id] ?? BIOMES.crater;
}
