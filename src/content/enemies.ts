import type { EnemyKind } from '../types';

export type EnemyBehavior = 'flyer' | 'walker' | 'hopper' | 'turret' | 'chaser' | 'charger';

export interface EnemyArchetype {
    kind: EnemyKind;
    texture: string;
    behavior: EnemyBehavior;
    hp: number;
    speed: number;
    aggroRange: number;
    /** barre rilasciate alla morte: [min, max] */
    barre: [number, number];
    glowColor: number;
    fireRateMs?: number;
    lungeSpeed?: number;
    /** alla morte si divide in n copie di questo tipo */
    splitsInto?: { kind: EnemyKind; count: number };
}

export const ENEMIES: Record<EnemyKind, EnemyArchetype> = {
    glitchetto: {
        kind: 'glitchetto',
        texture: 'enemy-glitchetto',
        behavior: 'hopper',
        hp: 2,
        speed: 200,
        aggroRange: 300,
        barre: [1, 2],
        glowColor: 0x22d3ee,
    },
    citelis: {
        kind: 'citelis',
        texture: 'enemy-citelis',
        behavior: 'charger',
        hp: 4,
        speed: 520,
        aggroRange: 380,
        barre: [1, 3],
        glowColor: 0xfacc15,
    },
    pendolare: {
        kind: 'pendolare',
        texture: 'enemy-pendolare',
        behavior: 'walker',
        hp: 3,
        speed: 60,
        aggroRange: 190,
        lungeSpeed: 260,
        barre: [1, 2],
        glowColor: 0xfacc15,
    },
    pittura: {
        kind: 'pittura',
        texture: 'enemy-pittura',
        behavior: 'walker',
        hp: 3,
        speed: 80,
        aggroRange: 240,
        lungeSpeed: 240,
        barre: [1, 3],
        glowColor: 0xc084fc,
        splitsInto: { kind: 'pittura-mini', count: 2 },
    },
    'pittura-mini': {
        kind: 'pittura-mini',
        texture: 'enemy-pittura-mini',
        behavior: 'hopper',
        hp: 1,
        speed: 240,
        aggroRange: 280,
        barre: [1, 1],
        glowColor: 0xc084fc,
    },
    tecnodrone: {
        kind: 'tecnodrone',
        texture: 'enemy-tecnodrone',
        behavior: 'turret',
        hp: 2,
        speed: 0,
        aggroRange: 420,
        fireRateMs: 2000,
        barre: [2, 3],
        glowColor: 0xf87171,
    },
    tossico: {
        kind: 'tossico',
        texture: 'enemy-tossico',
        behavior: 'hopper',
        hp: 3,
        speed: 230,
        aggroRange: 320,
        barre: [1, 3],
        glowColor: 0x84cc16,
    },
    formica: {
        kind: 'formica',
        texture: 'enemy-formica',
        behavior: 'chaser',
        hp: 2,
        speed: 210,
        aggroRange: 360,
        barre: [1, 3],
        glowColor: 0xfb923c,
    },
    numero: {
        kind: 'numero',
        texture: 'enemy-numero',
        behavior: 'flyer',
        hp: 2,
        speed: 100,
        aggroRange: 300,
        barre: [2, 4],
        glowColor: 0x60a5fa,
    },
    specchietto: {
        kind: 'specchietto',
        texture: 'enemy-specchietto',
        behavior: 'flyer',
        hp: 2,
        speed: 130,
        aggroRange: 340,
        barre: [2, 3],
        glowColor: 0xc084fc,
    },
    padella: {
        kind: 'padella',
        texture: 'enemy-padella',
        behavior: 'turret',
        hp: 3,
        speed: 0,
        aggroRange: 380,
        fireRateMs: 2400,
        barre: [2, 4],
        glowColor: 0xf87171,
    },
    ammiratore: {
        kind: 'ammiratore',
        texture: 'enemy-ammiratore',
        behavior: 'chaser',
        hp: 3,
        speed: 190,
        aggroRange: 420,
        barre: [2, 4],
        glowColor: 0xf87171,
    },
    telecamera: {
        kind: 'telecamera',
        texture: 'enemy-telecamera',
        behavior: 'turret',
        hp: 2,
        speed: 0,
        aggroRange: 460,
        fireRateMs: 1800,
        barre: [2, 4],
        glowColor: 0x22d3ee,
    },
    // notino senza la wave: saltella, spara e non sta mai zitto
    'notino-mini': {
        kind: 'notino-mini',
        texture: 'enemy-notino-mini',
        behavior: 'hopper',
        hp: 8,
        speed: 280,
        aggroRange: 520,
        fireRateMs: 1500,
        barre: [2, 4],
        glowColor: 0xa855f7,
    },
    // eco della tommasorveglianza: un frammento di registrazione di te
    eco: {
        kind: 'eco',
        texture: 'enemy-eco',
        behavior: 'chaser',
        hp: 2,
        speed: 290,
        aggroRange: 520,
        barre: [3, 5],
        glowColor: 0x22d3ee,
    },
    // bottiglia premium dello stabilimento: rimbalza e schizza
    bottiglia: {
        kind: 'bottiglia',
        texture: 'enemy-bottiglia',
        behavior: 'hopper',
        hp: 2,
        speed: 250,
        aggroRange: 330,
        barre: [1, 2],
        glowColor: 0x22d3ee,
    },
    // ricordo di pedro: fluttua, sbiadito, non vuole essere dimenticato
    ricordo: {
        kind: 'ricordo',
        texture: 'enemy-ricordo',
        behavior: 'flyer',
        hp: 2,
        speed: 120,
        aggroRange: 340,
        barre: [3, 6],
        glowColor: 0x94a3b8,
    },
    'tossico-trenbo': {
        kind: 'tossico-trenbo',
        texture: 'enemy-tossico-trenbo',
        behavior: 'chaser',
        hp: 2,
        speed: 245,
        aggroRange: 350,
        barre: [2, 4],
        glowColor: 0x84cc16,
    },
    // le fiat tipo di galliate: sgommano addosso al player
    fiattipo: {
        kind: 'fiattipo',
        texture: 'enemy-fiattipo',
        behavior: 'charger',
        hp: 5,
        speed: 560,
        aggroRange: 420,
        barre: [2, 5],
        glowColor: 0xdc2626,
    },
};
