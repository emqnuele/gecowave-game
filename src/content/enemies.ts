import type { EnemyKind } from '../types';

export type EnemyBehavior = 'flyer' | 'walker' | 'hopper' | 'turret' | 'chaser';

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
}

export const ENEMIES: Record<EnemyKind, EnemyArchetype> = {
    zanzarone: {
        kind: 'zanzarone',
        texture: 'enemy-zanzarone',
        behavior: 'flyer',
        hp: 2,
        speed: 95,
        aggroRange: 280,
        barre: [4, 8],
        glowColor: 0xf87171,
    },
    cultista: {
        kind: 'cultista',
        texture: 'enemy-cultista',
        behavior: 'walker',
        hp: 3,
        speed: 65,
        aggroRange: 200,
        lungeSpeed: 270,
        barre: [8, 14],
        glowColor: 0xc084fc,
    },
    botto: {
        kind: 'botto',
        texture: 'enemy-botto',
        behavior: 'hopper',
        hp: 3,
        speed: 220,
        aggroRange: 320,
        barre: [8, 14],
        glowColor: 0xfb923c,
    },
    drone: {
        kind: 'drone',
        texture: 'enemy-drone',
        behavior: 'turret',
        hp: 2,
        speed: 0,
        aggroRange: 400,
        fireRateMs: 2100,
        barre: [10, 16],
        glowColor: 0x60a5fa,
    },
    hater: {
        kind: 'hater',
        texture: 'enemy-hater',
        behavior: 'chaser',
        hp: 4,
        speed: 185,
        aggroRange: 360,
        barre: [12, 20],
        glowColor: 0xf87171,
    },
};
