/** un generatore con seme (mulberry32): stesso seme, stessa sequenza. le formule sono quelle di phaser */
export class Rng {
    private s: number;

    constructor(seed: number) {
        this.s = seed >>> 0;
    }

    reseed(seed: number): void {
        this.s = seed >>> 0;
    }

    /** in [0, 1), come Math.random */
    next(): number {
        this.s = (this.s + 0x6d2b79f5) | 0;
        let t = Math.imul(this.s ^ (this.s >>> 15), 1 | this.s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
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
