import type Phaser from 'phaser';
import { COMBAT } from '../config';
import { state } from '../engine/state';

/** il peso dei colpi: scossa di camera e fisica che si ferma un istante */
export class Feel {
    private readonly scene: Phaser.Scene;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    hitstop(): void {
        this.scene.physics.world.timeScale = 6;
        // orologio di scena: con setTimeout una pausa entro 55ms lasciava la fisica al rallentatore
        this.scene.time.delayedCall(COMBAT.hitstopMs, () => {
            this.scene.physics.world.timeScale = 1;
        });
        this.shake(60, 0.003);
    }

    shake(duration: number, intensity: number): void {
        if (state.settings.screenShake) this.scene.cameras.main.shake(duration, intensity);
    }
}
