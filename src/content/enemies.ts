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
        barre: [4, 8],
        glowColor: 0x22d3ee,
    },
    citelis: {
        kind: 'citelis',
        texture: 'enemy-citelis',
        behavior: 'charger',
        hp: 4,
        speed: 520,
        aggroRange: 380,
        barre: [12, 18],
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
        barre: [8, 14],
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
        barre: [10, 14],
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
        barre: [2, 4],
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
        barre: [10, 16],
        glowColor: 0xf87171,
    },
    tossico: {
        kind: 'tossico',
        texture: 'enemy-tossico',
        behavior: 'hopper',
        hp: 3,
        speed: 230,
        aggroRange: 320,
        barre: [8, 14],
        glowColor: 0x84cc16,
    },
    formica: {
        kind: 'formica',
        texture: 'enemy-formica',
        behavior: 'chaser',
        hp: 2,
        speed: 210,
        aggroRange: 360,
        barre: [5, 9],
        glowColor: 0xfb923c,
    },
    numero: {
        kind: 'numero',
        texture: 'enemy-numero',
        behavior: 'flyer',
        hp: 2,
        speed: 100,
        aggroRange: 300,
        barre: [8, 12],
        glowColor: 0x60a5fa,
    },
};
