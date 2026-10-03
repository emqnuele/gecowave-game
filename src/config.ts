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
    /** aggrappo: si scivola piano lungo il muro e ci si stacca con un salto */
    wallSlideSpeed: 150,
    wallJumpVelocity: 760,
    wallJumpPush: 300,
    wallJumpLockMs: 110,
    wallCoyoteMs: 110,
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
    /** schianto: giù+attacco in aria, picchiata che sfonda i muri dall'alto.
        parte solo in caduta franca: i tocchi all'apice restano attacchi normali */
    slamMinFall: 300,
    slamFall: 950,
    slamRadius: 110,
    slamDamage: 3,
    /** finestra per concatenare la combo a 3 colpi */
    comboWindowMs: 650,
    invulnMs: 900,
    hitstopMs: 55,
    /** colpo risonante: carica e rilascio */
    risonanteCost: 30,
    risonanteChargeMs: 650,
    risonanteSpeed: 720,
    risonanteDamage: 0.5,
    /** eco corta: il rilascio prima della carica non va più a vuoto */
    risonanteEcoCost: 12,
    risonanteEcoSpeed: 900,
    risonanteEcoLifeMs: 380,
    risonanteLifeMs: 1600,
    /** onda piena: carica lunga, spacca anche gli scudi */
    risonanteFullCost: 45,
    risonanteFullChargeMs: 1400,
    risonanteFullSpeed: 640,
    risonanteFullLifeMs: 1800,
    risonanteFullStunMs: 400,
    /** riflesso distorto: clone esca/aiutante */
    riflessoCost: 25,
    riflessoDurationMs: 7000,
    riflessoCooldownMs: 9000,
    riflessoSwapCost: 10,
    riflessoSpeedMult: 0.85,
    riflessoHitDamageBase: 0.1,
    riflessoHitDamageFlowMult: 0.5,
    riflessoJumpCooldownMs: 900,
    /** ritmo calmo: pausa lunga tra un fendente e l'altro */
    riflessoAttackCooldownMs: 2200,
    /** durata della fase di riposizionamento dopo un colpo */
    riflessoReposeMs: 1200,
    /** attesa iniziale dopo lo spawn prima del primo colpo */
    riflessoFirstAttackDelayMs: 1000,
    /** analisi 1: tempesta matematica */
    analisiCost: 40,
    analisiDurationMs: 2400,
    analisiTickMs: 300,
    analisiRadius: 140,
    analisiCooldownMs: 8000,
    analisiQedDamage: 3,
    analisiQedBossDamage: 4,
    /** tommasoscudo: bolla che riflette i proiettili */
    scudoCost: 20,
    scudoDurationMs: 1600,
    scudoCooldownMs: 6500,
    scudoPerfectMs: 220,
    scudoReflectPerfect: 0.6,
    scudoReflectNormal: 0.25,
    scudoStunMs: 600,
    /** acqua tossica: pozza che rallenta e avvelena i nemici */
    acquaCost: 30,
    acquaCooldownMs: 6000,
    acquaDurationMs: 5000,
    acquaTickMs: 600,
    acquaRadius: 100,
    acquaDamage: 1,
    acquaBottleSpeed: 520,
    acquaBottleDropSpeed: 200,
    acquaMaxPuddles: 2,
    acquaDirectStunMs: 1100,
    poisonMs: 4000,
    poisonMult: 1.3,
    poisonBossMult: 1.15,
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
