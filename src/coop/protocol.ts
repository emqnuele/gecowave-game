import { FAST_GAME } from '../net/session';
import type { AbilityId, BossKind, DialogueLine, EnemyKind } from '../types';
import type { Character, GameInfo, SharedSave } from './types';

/* tutto quello che due giocatori si dicono. l'host decide il mondo, ognuno il suo geco:
   chi non decide manda richieste, chi decide manda fatti */

/** pacchetti veloci: stato del geco (in entrambi i sensi) e del mondo (dall'host) */
export const FAST_PLAYER = FAST_GAME;
export const FAST_WORLD = FAST_GAME + 1;

/** stati della run che la trama cambia per entrambi (patto, smela) */
export interface SharedRun {
    patto: boolean;
    smela: boolean;
}

export interface Spot {
    x: number;
    y: number;
}

/** un nemico come lo vede chi lo deve solo disegnare */
export interface EnemySpawn {
    id: number;
    kind: EnemyKind;
    x: number;
    y: number;
    elite: boolean;
    trait: 'scudo' | 'soffitto' | 'kamikaze' | null;
    sleeping: boolean;
    hunting: boolean;
}

export interface NestSpawn {
    id: number;
    kind: EnemyKind;
    x: number;
    y: number;
    broken: boolean;
}

export interface BossSpawn {
    id: number;
    kind: BossKind;
    x: number;
    y: number;
    hp: number;
    maxHp: number;
    engaged: boolean;
    invulnerable: boolean;
}

/** un oggetto del mondo che l'host ha fatto nascere dopo il caricamento (premi dei boss, note) */
export type PickupSpawn =
    | { kind: 'fragment'; key: string; x: number; y: number; ability: AbilityId; loose: boolean }
    | { kind: 'item'; key: string; x: number; y: number; item: string; amount: number; loose: boolean }
    | { kind: 'cuore'; key: string; x: number; y: number; loose: boolean }
    | { kind: 'barre'; key: string; x: number; y: number; amount: number }
    | { kind: 'note'; key: string; x: number; y: number; vx: number; vy: number; value: number };

/** il mondo com'è adesso, per chi arriva (a capitolo iniziato o dopo un caricamento) */
export interface WorldDump {
    levelSeq: number;
    enemies: EnemySpawn[];
    nests: NestSpawn[];
    boss: BossSpawn | null;
    pickups: PickupSpawn[];
    /** le chiavi degli oggetti del livello già presi o spariti */
    gone: string[];
    /** muri rotti e porte aperte, per cella */
    walls: number[];
    arena: boolean;
    host: Spot;
}

/** chi colpisce cosa: il guest lo chiede, l'host lo applica */
export type Hit =
    | { on: 'enemy'; id: number; k: 'dmg' | 'stun' | 'stagger' | 'parry'; v: number; fromX: number }
    | { on: 'boss'; id: number; v: number; fromX: number; dir?: 'side' | 'up' | 'down' | 'shot' }
    | { on: 'nest'; id: number; v: number };

/** un gesto del geco che l'altro deve vedere: le wave e i colpi, non i tasti */
export type Act =
    | { a: 'slash'; dir: 'side' | 'up' | 'down'; combo: number }
    | { a: 'dash' }
    | { a: 'jump2' }
    | { a: 'walljump'; side: number }
    | { a: 'risonante'; x: number; y: number; dir: number; level: number }
    | { a: 'riflesso'; x: number; y: number; facing: number }
    | { a: 'riflesso-swap' }
    | { a: 'scudo' }
    | { a: 'analisi' }
    | { a: 'acqua'; x: number; y: number; facing: number; aim: 'lob' | 'drop' }
    | { a: 'hurt'; fromX: number }
    | { a: 'eat' }
    | { a: 'slam'; x: number; y: number };

export interface CoopMsgs {
    // --- la stanza ---
    /** l'host presenta la partita a chi entra */
    'info': GameInfo;
    /** il guest si è forgiato e chiede di entrare */
    'char': { char: Character };
    /** il guest entra nel capitolo dell'host: dove, e il mondo condiviso */
    'level': { levelId: string; checkpointId: string | null; seq: number; spawn: Spot; showCard: boolean; save: SharedSave; run: SharedRun };
    /** partita nuova: l'intro la vedono tutti e due */
    'intro': Record<string, never>;
    /** il guest ha caricato il capitolo: l'host gli manda il mondo */
    'ready': { seq: number };
    'world': WorldDump;
    /** chi resta nel capitolo e chi esce dalla partita */
    'leave': { reason: string };

    // --- il mondo condiviso ---
    'save': { keys: Partial<SharedSave> };
    'run': SharedRun;
    /** un premio che vale per tutti e due (cuori, maschere): ognuno lo mette sul suo personaggio */
    'grant': { costituzione?: number; forza?: number; heal?: boolean };

    // --- nemici, boss, nidi ---
    'spawn': EnemySpawn;
    'despawn': { id: number; died: boolean; x: number; y: number; kind: EnemyKind; color: number };
    'nest': NestSpawn;
    'nest-gone': { id: number };
    'enemy-fx': { id: number; fx: 'hurt' | 'parry' | 'stagger' | 'wake' | 'drop' | 'fuse' | 'charge' | 'fired'; ms?: number };
    'enemy-say': { id: number; text: string; ms: number };
    'boss': BossSpawn;
    'boss-fx': { id: number; fx: string; tx?: number; ty?: number; n?: number; dir?: number; xs?: number[]; phase?: number };
    'boss-gone': { id: number; kind: BossKind; x: number; y: number };
    'shoot': { id: number; x: number; y: number; tx: number; ty: number; color?: number; speed?: number; size?: number };
    'boom': { x: number; y: number; r: number };
    /** una comparsa della trama che l'ospite deve vedere (lochef che insegue, ivan, le guide) */
    'actor': { id: number; texture: string; frame: number; x: number; y: number; depth: number; scale: number; originX: number; originY: number; light: number | null; hostile: number; pipeline: boolean };
    'actor-gone': { id: number };
    'lamette': { xs: number[]; y: number };
    'proj-gone': { id: number };

    // --- oggetti ---
    'pickup': PickupSpawn;
    'gone': { key: string };
    'wall': { cell: number };
    'arena': { locked: boolean; doors?: { x: number; y: number; w: number; h: number }[]; color?: number };

    // --- richieste del guest ---
    'hit': Hit;
    'take': { key: string };
    'break': { cell: number };
    'interact': { key: string };
    /** le scoperte dell'ospite (fermate, stanze, dialoghi letti, flag) da unire al salvataggio */
    'merge': { flags?: string[]; abilities?: string[]; seenDialogues?: string[]; collectedLore?: string[]; charms?: string[]; stops?: string[]; explored?: Record<string, number[]> };

    // --- i gechi ---
    'act': Act;
    /** l'host comanda al geco del guest: la trama lo ferma, lo sposta, lo ferisce */
    'cmd': { c: 'stun'; ms: number } | { c: 'teleport'; x: number; y: number } | { c: 'hurt'; amount: number; fromX?: number } | { c: 'kill' } | { c: 'revive'; x: number; y: number };
    /** il mio geco è caduto o si è rialzato */
    'down': { down: boolean };

    // --- dialoghi, scelte, film, ui ---
    'dlg-open': { token: number; lines: DialogueLine[]; shared: boolean };
    'dlg-step': { token: number; index: number };
    'dlg-close': { token: number };
    'choice-open': { token: number; title: string; options: { label: string; danger?: boolean }[]; shared: boolean };
    'choice-pick': { token: number; index: number };
    'film': { id: string; token: number };
    'film-end': { token: number };
    /** gli eventi della ui che contano per tutti e due (toast di trama, battute, premi) */
    'ui': { e: string; p: unknown };
    /** l'host ha chiesto una pausa di trama, o l'ha tolta */
    'hold': { on: boolean; why: 'dialogo' | 'film' | 'scelta' | 'riepilogo' | 'morte' };
    /** riepilogo di fine capitolo e fine partita */
    'summary': { kind: 'chapter' | 'final'; data: unknown; token: number };
    'summary-close': { token: number };
    'ending': { id: string; score?: number | null; rank?: number };
    'died': { lost: number; score: number | null };
    'retry': Record<string, never>;
}
