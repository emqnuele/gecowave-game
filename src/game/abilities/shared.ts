import Phaser from 'phaser';
import type { GameContext } from '../context';

export type AbilitiesCtx = Pick<GameContext, 'scene' | 'carry' | 'world' | 'player' | 'lighting' | 'groups' | 'enemies' | 'bosses' | 'combat' | 'traps'>;

export type WaveName = 'risonante' | 'analisi' | 'scudo' | 'acquatossica' | 'riflesso' | 'scivolata';

/** un'abilità tocca il mondo: i sigilli ascoltano l'evento di scena wave-world */
export function waveWorld(scene: Phaser.Scene, wave: WaveName, x: number, y: number, area: Phaser.Geom.Circle | Phaser.Geom.Rectangle, level?: number): void {
    scene.events.emit('wave-world', { wave, x, y, area, level });
}
