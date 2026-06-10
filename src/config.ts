import type { ZoneColor } from './types';

/* il mondo è in tile da 32px; il tileset dipinto è a 160px scalato 0.2,
   come nella legacy */
export const TILE = 32;
export const ART_TILE = 160;
export const ART_SCALE = TILE / ART_TILE;

export const PHYSICS = {
    gravity: 2400,
    runSpeed: 340,
    runAccel: 3400,
    airAccel: 2600,
    jumpVelocity: 760,
    doubleJumpVelocity: 660,
    // rilasciare il salto taglia la velocità: salto variabile
    jumpCutFactor: 0.42,
    coyoteMs: 110,
    jumpBufferMs: 130,
    maxFallSpeed: 1150,
    dashSpeed: 800,
    dashMs: 170,
    dashCooldownMs: 450,
    knockback: 330,
    pogoVelocity: 700,
} as const;

export const COMBAT = {
    maxHp: 5,
    maxFlow: 99,
    flowPerHit: 16,
    healCost: 33,
    healHoldMs: 850,
    attackCooldownMs: 300,
    attackActiveMs: 140,
    attackRange: 78,
    /** finestra per concatenare la combo a 3 colpi */
    comboWindowMs: 650,
    invulnMs: 900,
    hitstopMs: 55,
    /** colpo risonante: carica e rilascio */
    risonanteCost: 30,
    risonanteChargeMs: 650,
    risonanteSpeed: 720,
    risonanteDamage: 3,
    /** riflesso distorto: clone esca */
    riflessoCost: 25,
    riflessoDurationMs: 3200,
    riflessoCooldownMs: 6000,
    /** analisi 1: tempesta matematica */
    analisiCost: 40,
    analisiDurationMs: 3000,
    analisiTickMs: 320,
    analisiRadius: 120,
    analisiCooldownMs: 8000,
    /** rigenerazione del rio merdone */
    regenIdleMs: 5000,
    regenTickMs: 6000,
    /** trenbolone: più forte ma ti mangia da dentro */
    trenboloneDrainMs: 22000,
} as const;

export const PLAYER_SPRITE = {
    scale: 0.24,
    bodyWidth: 150,
    bodyHeight: 230,
    bodyOffsetX: 100,
    bodyOffsetY: 110,
} as const;

export const ZONE_HEX: Record<ZoneColor, number> = {
    green: 0x4ade80,
    purple: 0xc084fc,
    orange: 0xfb923c,
    blue: 0x60a5fa,
    red: 0xf87171,
    yellow: 0xfacc15,
    cyan: 0x22d3ee,
};

export const ZONE_CSS: Record<ZoneColor, string> = {
    green: '#4ade80',
    purple: '#c084fc',
    orange: '#fb923c',
    blue: '#60a5fa',
    red: '#f87171',
    yellow: '#facc15',
    cyan: '#22d3ee',
};
