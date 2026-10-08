import { TILE } from '../config';

export type WaveLevel = 0 | 1 | 2;

/** un livello sconosciuto vale come eco, il gradino più basso */
export const waveLevel = (level?: number): WaveLevel => (level === 2 ? 2 : level === 1 ? 1 : 0);

/** la direzione nuova si avvicina a quella voluta di al più maxTurn radianti, dal lato più corto */
export function turnToward(cur: number, want: number, maxTurn: number): number {
    let diff = want - cur;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return cur + Math.max(-maxTurn, Math.min(maxTurn, diff));
}

/** la pozza cade sul pavimento sotto lo scoppio, scendendo al massimo dieci celle */
export function puddleFloorY(x: number, y: number, solid: (c: number, r: number) => boolean): number {
    const c = Math.floor(x / TILE);
    let r = Math.floor(y / TILE);
    for (let k = 0; k < 10 && !solid(c, r + 1); k++) r++;
    return (r + 1) * TILE - 6;
}
