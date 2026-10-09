import type Phaser from 'phaser';
import type { BossKind, EnemyKind } from '../types';
import type { PlayerAct } from '../rules/ombra';
import type { Boss, HitDir } from '../entities/Boss';
import type { Enemy } from '../entities/Enemy';
import type { Spawner } from '../entities/Spawner';

export type WaveName = 'risonante' | 'analisi' | 'scudo' | 'acquatossica' | 'riflesso' | 'scivolata';

/** gli eventi del mondo di gioco, sulla scena: muoiono con lei. il bus resta per la ui */
export interface WorldEvents {
    // il geco
    'player-act': PlayerAct;
    'player-dead': void;
    'player-risonante': { x: number; y: number; dir: number; level?: number };
    'player-riflesso': { x: number; y: number; facing: number };
    'player-riflesso-swap': Record<string, never>;
    'player-scudo': Record<string, never>;
    'player-analisi': Record<string, never>;
    'player-acqua': { x: number; y: number; facing: number; aim: 'lob' | 'drop' };
    /** un'abilità tocca il mondo: i sigilli ascoltano */
    'wave-world': { wave: WaveName; x: number; y: number; area: Phaser.Geom.Circle | Phaser.Geom.Rectangle; level?: number };
    'checkpoint': { id: string; levelId: string };
    // nemici e nidi
    'enemy-spawned': { enemy: Enemy };
    'nest-spawned': { nest: Spawner };
    'enemy-shoot': { x: number; y: number; tx: number; ty: number; color?: number; speed?: number; size?: number };
    'enemy-fuse': { x: number; y: number };
    'enemy-alert': { x: number; y: number; from: Enemy };
    'enemy-drop': { x: number; y: number };
    'enemy-explode': { x: number; y: number; r: number; from: Enemy };
    'enemy-died': { x: number; y: number; kind: EnemyKind; barre: number; color: number; splitsInto: { kind: EnemyKind; count: number } | null };
    /** un colpo arrivato a un nemico o a un boss; landed è falso se il boss l'ha schivato o parato */
    'damage': { target: Enemy | Boss; amount: number; landed: boolean };
    // boss
    'boss-spawned': { boss: Boss };
    'boss-engaged': Boss;
    'boss-summon': { x: number; y: number; kind: EnemyKind };
    'boss-lamette': { xs: number[]; y: number };
    'boss-parried': { dir: HitDir };
    'boss-phase': { phase: number };
    'boss-dying': { kind: BossKind };
    'boss-defeated': { kind: BossKind; x: number; y: number };
    // chi insegue si fa sentire prima di farsi vedere: i passanti lo riconoscono
    'pursuer-whistle': { x: number; y: number };
}

export type WorldEvent = keyof WorldEvents;
type Args<K extends WorldEvent> = WorldEvents[K] extends void ? [] : [WorldEvents[K]];
export type WorldHandler<K extends WorldEvent> = (...args: Args<K>) => void;

/** senza dato non passa argomenti: chi ascolta riceve esattamente quello che riceveva prima */
export function emitWorld<K extends WorldEvent>(scene: Phaser.Scene, event: K, ...args: Args<K>): void {
    scene.events.emit(event, ...args);
}

export function onWorld<K extends WorldEvent>(scene: Phaser.Scene, event: K, fn: WorldHandler<K>, owner?: object): void {
    scene.events.on(event, fn, owner);
}

export function offWorld<K extends WorldEvent>(scene: Phaser.Scene, event: K, fn: WorldHandler<K>, owner?: object): void {
    scene.events.off(event, fn, owner);
}
