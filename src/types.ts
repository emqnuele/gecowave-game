export type ZoneColor = 'green' | 'purple' | 'orange' | 'blue' | 'red' | 'yellow';

export type AbilityId = 'doubleJump' | 'dash' | 'verso';

export type EnemyKind = 'zanzarone' | 'cultista' | 'botto' | 'drone' | 'hater';

export type EntitySpec =
    | { type: 'enemy'; kind: EnemyKind }
    | { type: 'npc'; id: string }
    | { type: 'ability'; ability: AbilityId }
    | { type: 'lore'; id: string }
    | { type: 'barre'; amount: number }
    | { type: 'boss' };

export interface LevelDef {
    id: string;
    /** titolo in maiuscolo, senza la parola accento */
    title: string;
    /** parola evidenziata a pennarello nel titolo */
    accentWord: string;
    color: ZoneColor;
    /** battuta mostrata sotto la title card */
    punchline: string;
    /** griglia ascii: vedi legenda in LevelLoader */
    grid: string[];
    /** mappa lettera -> entità */
    entities: Record<string, EntitySpec>;
    /** id del livello successivo (uscita X), assente per l'ultimo */
    next?: string;
    /** dialogo lanciato al primo ingresso */
    introDialogue?: string;
    /** frequenza base del pad ambientale */
    ambientNote?: number;
}

export interface DialogueLine {
    speaker: string;
    color: ZoneColor;
    text: string;
}

export interface SaveData {
    levelId: string;
    checkpointId: string | null;
    barre: number;
    abilities: AbilityId[];
    seenDialogues: string[];
    collectedLore: string[];
    bossDefeated: boolean;
}

export interface DroppedBarre {
    levelId: string;
    x: number;
    y: number;
    amount: number;
}
