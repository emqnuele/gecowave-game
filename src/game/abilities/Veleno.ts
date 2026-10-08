import type Phaser from 'phaser';
import { COMBAT } from '../../config';
import type { Boss } from '../../entities/Boss';
import type { Enemy } from '../../entities/Enemy';

/** avvelenato: per qualche secondo prende più danni da tutto, tinto di verde-ciano */
export class Veleno {
    private readonly poisoned = new Map<Enemy | Boss, number>();
    private readonly scene: Phaser.Scene;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    /** l'avvelenamento moltiplica i danni di tutto il resto */
    has(target: Enemy | Boss, now: number): boolean {
        return (this.poisoned.get(target) ?? 0) > now;
    }

    apply(target: Enemy | Boss): void {
        const until = this.scene.time.now + COMBAT.poisonMs;
        if (!this.poisoned.has(target)) target.setTint(0x67e8a0);
        this.poisoned.set(target, until);
    }

    update(time: number): void {
        for (const [target, until] of this.poisoned) {
            if (!target.active || time >= until) {
                if (target.active) target.clearTint();
                this.poisoned.delete(target);
            }
        }
    }
}
