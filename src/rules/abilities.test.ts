import { describe, expect, it } from 'vitest';
import { TILE } from '../config';
import { puddleFloorY, turnToward, waveLevel } from './abilities';

describe('waveLevel', () => {
    it('piena e onda restano, tutto il resto è eco', () => {
        expect(waveLevel(2)).toBe(2);
        expect(waveLevel(1)).toBe(1);
        expect(waveLevel(0)).toBe(0);
        expect(waveLevel(undefined)).toBe(0);
        expect(waveLevel(7)).toBe(0);
    });
});

describe('turnToward', () => {
    it('non gira più del passo massimo', () => {
        expect(turnToward(0, 1, 0.09)).toBeCloseTo(0.09);
        expect(turnToward(0, -1, 0.09)).toBeCloseTo(-0.09);
    });

    it('se la differenza è piccola arriva dritto al bersaglio', () => {
        expect(turnToward(0.5, 0.52, 0.09)).toBeCloseTo(0.52);
    });

    it('gira dal lato più corto attraverso il mezzo giro', () => {
        expect(turnToward(Math.PI - 0.01, -Math.PI + 0.01, 0.09)).toBeCloseTo(Math.PI + 0.01);
        expect(turnToward(-Math.PI + 0.01, Math.PI - 0.01, 0.09)).toBeCloseTo(-Math.PI - 0.01);
    });
});

describe('puddleFloorY', () => {
    it('scende fino alla prima cella piena sotto lo scoppio', () => {
        const solid = (_c: number, r: number) => r >= 5;
        expect(puddleFloorY(TILE * 2.5, TILE * 1.5, solid)).toBe(5 * TILE - 6);
    });

    it('sopra un pavimento resta dov\'è', () => {
        const solid = (_c: number, r: number) => r >= 2;
        expect(puddleFloorY(10, TILE * 1.2, solid)).toBe(2 * TILE - 6);
    });

    it('nel vuoto si ferma dopo dieci celle', () => {
        expect(puddleFloorY(0, 0, () => false)).toBe(11 * TILE - 6);
    });
});
