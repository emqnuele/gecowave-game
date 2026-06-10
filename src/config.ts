import type { ZoneColor } from './types';

export const TILE = 32;

export const PHYSICS = {
    gravity: 2400,
    runSpeed: 330,
    runAccel: 3400,
    airAccel: 2600,
    groundDrag: 2400,
    jumpVelocity: 700,
    doubleJumpVelocity: 620,
    // rilasciare il salto taglia la velocità: salto variabile
    jumpCutFactor: 0.42,
    coyoteMs: 110,
    jumpBufferMs: 130,
    maxFallSpeed: 1100,
    dashSpeed: 760,
    dashMs: 170,
    dashCooldownMs: 450,
    knockback: 320,
    pogoVelocity: 640,
} as const;

export const COMBAT = {
    maxHp: 5,
    maxFlow: 99,
    flowPerHit: 18,
    healCost: 33,
    healHoldMs: 850,
    attackCooldownMs: 330,
    attackActiveMs: 130,
    attackDamage: 1,
    attackRange: 56,
    versoCost: 15,
    versoSpeed: 560,
    invulnMs: 900,
    hitstopMs: 55,
} as const;

export const ZONE_HEX: Record<ZoneColor, number> = {
    green: 0x4ade80,
    purple: 0xc084fc,
    orange: 0xfb923c,
    blue: 0x60a5fa,
    red: 0xf87171,
    yellow: 0xfacc15,
};

export const ZONE_CSS: Record<ZoneColor, string> = {
    green: '#4ade80',
    purple: '#c084fc',
    orange: '#fb923c',
    blue: '#60a5fa',
    red: '#f87171',
    yellow: '#facc15',
};
