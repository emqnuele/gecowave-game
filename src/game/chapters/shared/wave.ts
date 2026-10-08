import type Phaser from 'phaser';
import { bus } from '../../../engine/events';
import { state } from '../../../engine/state';

/** trama per messaggi: una sola volta per partita, distanziata, chi vuole legge e chi no gioca */
export function waveOnce(scene: Phaser.Scene, flag: string, wave: { sender: string; text: string }, delay: number): void {
    if (state.hasFlag(flag)) return;
    state.setFlag(flag);
    scene.time.delayedCall(delay, () => bus.emit('wavesung', wave));
}
