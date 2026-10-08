import Phaser from 'phaser';
import type { GameContext } from '../context';
import { emitWorld, type WaveName } from '../../engine/worldEvents';

export type AbilitiesCtx = Pick<GameContext, 'scene' | 'carry' | 'world' | 'player' | 'lighting' | 'groups' | 'enemies' | 'bosses' | 'combat' | 'traps'>;

/** un'abilità tocca il mondo: i sigilli ascoltano l'evento di scena wave-world */
export function waveWorld(scene: Phaser.Scene, wave: WaveName, x: number, y: number, area: Phaser.Geom.Circle | Phaser.Geom.Rectangle, level?: number): void {
    emitWorld(scene, 'wave-world', { wave, x, y, area, level });
}
