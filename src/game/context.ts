import type Phaser from 'phaser';
import type { Input } from '../input/Input';
import type { LightingManager } from '../stage/LightingManager';
import type { QuestManager } from '../story/QuestManager';
import type { TerrainRenderer } from '../stage/TerrainRenderer';
import type { TrentatreMarks } from '../story/TrentatreMarks';
import type { TrapManager } from '../mechanics/TrapManager';
import type { Player } from '../entities/Player';
import type { RestartCarry } from './carry';
import type { Abilities } from './abilities';
import type { Bosses } from './Bosses';
import type { Arena } from './Arena';
import type { Challenges } from './Challenges';
import type { ChapterScript, EndingId } from './chapters/ChapterScript';
import type { Combat } from './Combat';
import type { Dialogues } from './Dialogues';
import type { Doomsday } from './Doomsday';
import type { Enemies } from './Enemies';
import type { Feel } from './Feel';
import type { GameGroups } from './groups';
import type { Guide } from './Guide';
import type { Interactions } from './Interactions';
import type { Npcs } from './Npcs';
import type { Rewards } from './Rewards';
import type { SafeGround } from './SafeGround';
import type { Travel } from './Travel';
import type { LevelWorld } from './world/LevelWorld';

/** come si riavvia la scena: il capitolo, il microfono di partenza, la carta del titolo */
export interface SceneData {
    levelId: string;
    checkpointId?: string | null;
    showCard?: boolean;
    /** override dello spawn: usato per rientrare accanto a un varco segreto */
    spawnAt?: { x: number; y: number };
}

/** il passaggio tra capitoli e la fine della partita: lo chiedono gli script, lo decide la progressione */
export interface Flow {
    exiting: boolean;
    gotoLevel(next: string, spawnAt?: { x: number; y: number }): void;
    completeChapterAndGo(next: string, spawnAt?: { x: number; y: number }): void;
    returnFromSecret(delay: number): void;
    endGame(id: EndingId): void;
    playerDied(): void;
}

/** phaser riusa la scena: un sistema nasce in create() e muore allo shutdown, mai stato che passa al restart */
export interface GameSystem {
    destroy(): void;
}

/** una vita di scena: ogni sistema ne prende con Pick solo quello che usa, così le dipendenze stanno nel tipo */
export class GameContext {
    readonly scene: Phaser.Scene;
    readonly carry: RestartCarry;
    /** questa istanza decide lo stato del mondo: in single sempre, in coop solo l'host (fase 3) */
    readonly simulates: boolean = true;
    world!: LevelWorld;
    player!: Player;
    controls!: Input;
    lighting!: LightingManager;
    interactions!: Interactions;
    dialogues!: Dialogues;
    rewards!: Rewards;
    feel!: Feel;
    groups!: GameGroups;
    bosses!: Bosses;
    enemies!: Enemies;
    quests!: QuestManager;
    traps!: TrapManager;
    abilities!: Abilities;
    combat!: Combat;
    safe!: SafeGround;
    npcs!: Npcs;
    chapter!: ChapterScript;
    flow!: Flow;
    terrain!: TerrainRenderer;
    marks33!: TrentatreMarks | null;
    arena!: Arena;
    travel!: Travel;
    guide!: Guide;
    challenges!: Challenges;
    doomsday!: Doomsday;

    constructor(scene: Phaser.Scene, carry: RestartCarry) {
        this.scene = scene;
        this.carry = carry;
    }
}
