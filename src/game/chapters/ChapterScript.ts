import type Phaser from 'phaser';
import type { BossKind } from '../../types';
import type { GameContext, GameSystem } from '../context';

export type Target = { x: number; y: number; label: string };
export type EndingId = 'consegna' | 'dei' | 'pedro' | 'sconfitta' | 'riscatto';

/** quello che uno script di capitolo usa: tutto il gioco, ma solo attraverso i sistemi */
export type ChapterCtx = Pick<GameContext,
    'scene' | 'world' | 'player' | 'lighting' | 'groups' | 'feel' | 'bosses' | 'enemies' | 'combat'
    | 'rewards' | 'interactions' | 'dialogues' | 'npcs' | 'flow' | 'guide' | 'terrain' | 'marks33' | 'lens'>;

/** la trama di un capitolo: la scena chiama ogni aggancio dove il vecchio codice controllava def.id, così l'ordine resta */
export interface ChapterScript extends GameSystem {
    /** marker e npc speciali del json: true se li gestisce il capitolo */
    marker?(id: string, x: number, y: number): boolean;
    /** l'intro del capitolo, se il capitolo la cambia */
    introDialogue?(id: string): string;
    /** il capitolo comincia al buio: gli occhi si aprono a fine intro */
    startsInDark?(): boolean;
    /** il posto ha un suo velo sopra il fondale */
    dressStage?(): void;
    /** chi abita il posto oltre al json (gli ospiti della piazza) */
    populate?(): void;
    /** a fine create(), dopo il consiglio sulla meccanica */
    setup?(): void;
    /** dentro il combattimento: si ferma con nemici e boss durante i film */
    updateFoes?(time: number): void;
    update?(time: number, delta: number): void;
    /** un npc di questo capitolo: true se l'ha gestito */
    interact?(npcId: string): boolean;
    /** prima dell'intro del boss: true se il capitolo prende la scena */
    beforeBossEngage?(): boolean;
    bossDefeated?(kind: BossKind, x: number, y: number): void;
    /** obiettivo che passa davanti anche ai frammenti a terra */
    urgentObjective?(): Target | null;
    /** obiettivo di trama, dopo il boss e prima dell'uscita: undefined lascia decidere al resto */
    objective?(): Target | null | undefined;
    /** l'uscita è chiusa dalla trama: il toast da mostrare */
    exitLock?(): string | null;
    /** chi ti insegue fuori dal combattimento (lochef nella tana) */
    pursuer?(): Phaser.GameObjects.Sprite | null;
    chaseRanges?(): { start: number; end: number }[];
    /** la casa ti ha sentito nell'armadio */
    sniffed?(): void;
    /** una porta della mente, chiesta dalla sua meccanica */
    quizDoor?(id: string, x: number, y: number): void;
    /** uno scontro di trama già teso: il doomsday aspetta */
    storyFight?(): boolean;
    /** morire qui chiude la partita */
    deathEnding?(): EndingId | null;
}

/** la base comune: il contesto e la scena a portata di mano */
export abstract class Chapter implements ChapterScript {
    protected readonly ctx: ChapterCtx;
    protected readonly scene: Phaser.Scene;

    constructor(ctx: ChapterCtx) {
        this.ctx = ctx;
        this.scene = ctx.scene;
    }

    destroy(): void {}
}

/** i capitoli senza trama propria */
export class NoChapter extends Chapter {}
