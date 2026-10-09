import { mulberry32, type SeededRandom } from './hash';

/** un generatore con seme che si può far ripartire: stesso seme, stessa sequenza. le formule sono quelle di phaser */
export class Rng {
    private gen: SeededRandom;

    constructor(seed: number) {
        this.gen = mulberry32(seed >>> 0);
    }

    reseed(seed: number): void {
        this.gen = mulberry32(seed >>> 0);
    }

    /** in [0, 1), come Math.random */
    next(): number {
        return this.gen();
    }

    /** intero tra min e max compresi, come Phaser.Math.Between */
    between(min: number, max: number): number {
        return Math.floor(this.next() * (max - min + 1) + min);
    }

    /** mescola sul posto e restituisce lo stesso array, come Phaser.Utils.Array.Shuffle */
    shuffle<T>(array: T[]): T[] {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(this.next() * (i + 1));
            const tmp = array[i]!;
            array[i] = array[j]!;
            array[j] = tmp;
        }
        return array;
    }
}
