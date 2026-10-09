import { describe, expect, it } from 'vitest';
import { FixedStep } from './fixedStep';

const STEP = 1000 / 60;
const run = (hz: number, seconds: number): { steps: number; perFrame: number[]; dts: number[] } => {
    const f = new FixedStep(STEP);
    const perFrame: number[] = [];
    const dts: number[] = [];
    let steps = 0;
    for (let i = 0; i < hz * seconds; i++) {
        const n = f.advance(1000 / hz);
        perFrame.push(n);
        for (let k = 0; k < n; k++) dts.push(f.dt);
        steps += n;
    }
    return { steps, perFrame, dts };
};

describe('FixedStep', () => {
    it('a 60 hz fa un passo per fotogramma, col delta del fotogramma', () => {
        const { perFrame, dts } = run(60, 10);
        expect(perFrame.every((n) => n === 1)).toBe(true);
        expect(dts.every((d) => d === 1000 / 60)).toBe(true);
    });

    it('a 120 e 144 hz il mondo fa gli stessi passi al secondo che a 60', () => {
        expect(run(120, 10).steps).toBe(600);
        expect(Math.abs(run(144, 10).steps - 600)).toBeLessThanOrEqual(1);
    });

    it('a 120 e 240 hz il passo cade sullo stesso istante che a 60', () => {
        expect(run(120, 1).perFrame.slice(0, 6)).toEqual([0, 1, 0, 1, 0, 1]);
        expect(run(240, 1).perFrame.slice(0, 8)).toEqual([0, 0, 0, 1, 0, 0, 0, 1]);
    });

    it('il tempo dei passi somma il tempo vero', () => {
        const { dts } = run(144, 5);
        const total = dts.reduce((a, b) => a + b, 0);
        expect(Math.abs(total - 5000)).toBeLessThan(STEP);
    });

    it('a 60 hz con fotogrammi non esatti resta un passo per fotogramma, per ore', () => {
        // 16,67 è il fotogramma dell'harness, 16,683 un monitor da 59,94 hz
        for (const ms of [16.67, 16.683, 16.65]) {
            const f = new FixedStep(STEP);
            let bad = 0;
            for (let i = 0; i < 60 * 60 * 60; i++) if (f.advance(ms) !== 1 || f.dt !== ms) bad++;
            expect(bad).toBe(0);
        }
    });

    it('a 120 hz con fotogrammi non esatti alterna sempre un passo e nessuno', () => {
        const f = new FixedStep(STEP);
        let prev = -1;
        let bad = 0;
        for (let i = 0; i < 120 * 60 * 60; i++) {
            const n = f.advance(8.335);
            if (n === prev) bad++;
            prev = n;
        }
        expect(bad).toBe(0);
    });

    it('un fotogramma lento recupera i passi, ma non più di quattro', () => {
        const f = new FixedStep(STEP);
        f.advance(STEP);
        expect(f.advance(STEP * 3)).toBe(3);
        expect(f.advance(STEP * 30)).toBe(4);
        expect(f.advance(STEP)).toBe(1);
    });
});
