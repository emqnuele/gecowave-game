import { describe, expect, it } from 'vitest';
import { combine, coverZoom, envelope, heartbeat, isRest, restLens } from './lens';

describe('lens', () => {
    it('a riposo non tocca niente', () => {
        expect(isRest(restLens())).toBe(true);
        expect(isRest(combine([]))).toBe(true);
        expect(isRest(combine([{ lens: { chroma: 1 }, weight: 0 }]))).toBe(true);
    });

    it('somma i canali e prende il più forte per serratura e scolorimento', () => {
        const l = combine([
            { lens: { chroma: 0.4, desat: 0.3, keyhole: 0.5 }, weight: 1 },
            { lens: { chroma: 0.4, desat: 0.8, keyhole: 0.2 }, weight: 0.5 },
        ]);
        expect(l.chroma).toBeCloseTo(0.6);
        expect(l.desat).toBeCloseTo(0.4);
        expect(l.keyhole).toBeCloseTo(0.5);
    });

    it('i limiti tengono anche se si accumulano tanti colpi', () => {
        const many = Array.from({ length: 20 }, () => ({ lens: { angle: 0.05, chroma: 1, dark: 0.5 }, weight: 1 }));
        const l = combine(many);
        expect(l.angle).toBeLessThanOrEqual(0.08);
        expect(l.chroma).toBeLessThanOrEqual(2);
        expect(l.dark).toBeLessThanOrEqual(0.85);
    });

    it('il colore del velo è la media pesata', () => {
        const l = combine([
            { lens: { tint: 0.2, tintColor: 0xff0000 }, weight: 1 },
            { lens: { tint: 0.2, tintColor: 0x0000ff }, weight: 1 },
        ]);
        expect(l.tint).toBeCloseTo(0.4);
        expect(l.tintColor).toBe(0x800080);
    });

    it('l inviluppo sale, resta e torna a zero', () => {
        expect(envelope(-1, 100, 100, 100)).toBe(0);
        expect(envelope(0, 100, 100, 100)).toBe(0);
        expect(envelope(50, 100, 100, 100)).toBeCloseTo(0.5);
        expect(envelope(150, 100, 100, 100)).toBe(1);
        expect(envelope(250, 100, 100, 100)).toBeCloseTo(0.5);
        expect(envelope(300, 100, 100, 100)).toBe(0);
        expect(envelope(0, 0, 10, 10)).toBe(1);
    });

    it('lo zoom di copertura nasconde gli angoli', () => {
        expect(coverZoom(0, 16 / 9, 0)).toBeCloseTo(1);
        // un angolo dello schermo ruotato deve restare dentro l'immagine ingrandita
        const aspect = 16 / 9;
        for (const a of [0.01, 0.03, 0.08]) {
            const z = coverZoom(a, aspect, 0);
            const x = aspect / 2;
            const y = 0.5;
            const rx = (Math.cos(a) * x - Math.sin(a) * y) / z;
            const ry = (Math.sin(a) * x + Math.cos(a) * y) / z;
            expect(Math.abs(rx)).toBeLessThanOrEqual(aspect / 2 + 1e-9);
            expect(Math.abs(ry)).toBeLessThanOrEqual(0.5 + 1e-9);
        }
        expect(coverZoom(0, aspect, 0.2)).toBeGreaterThan(1);
    });

    it('il battito ha due colpi e poi silenzio', () => {
        expect(heartbeat(44, 880)).toBeGreaterThan(0.9);
        expect(heartbeat(600, 880)).toBeLessThan(0.01);
    });
});
