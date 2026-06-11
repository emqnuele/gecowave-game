export type ZoneColor = 'green' | 'purple' | 'orange' | 'blue' | 'red' | 'yellow' | 'cyan';

/* le wave sono frammenti della gecowave: 2 di movimento,
   4 attive, 1 passiva */
export type AbilityId =
    | 'scivolata'
    | 'rimbalzo'
    | 'riflesso'
    | 'risonante'
    | 'rigenerazione'
    | 'analisi'
    | 'scudo';

export type EnemyKind =
    | 'glitchetto'
    | 'citelis'
    | 'pendolare'
    | 'pittura'
    | 'pittura-mini'
    | 'tecnodrone'
    | 'tossico'
    | 'formica'
    | 'numero'
    | 'specchietto'
    | 'padella'
    | 'ammiratore'
    | 'telecamera';

export type BossKind = 'guggu' | 'breccio' | 'notino' | 'riba' | 'lochef' | 'ombra' | 'ticummi' | 'pedro' | 'dei';

export type EntitySpec =
    | { type: 'enemy'; kind: EnemyKind }
    | { type: 'npc'; id: string }
    | { type: 'ability'; ability: AbilityId }
    | { type: 'lore'; id: string }
    | { type: 'barre'; amount: number }
    | { type: 'cuore' }
    | { type: 'boss'; kind: BossKind };

/** script speciali di livello gestiti dalla GameScene */
export type LevelScript = 'bus' | 'lametta' | 'trenbolone' | 'ruhra' | 'tana' | 'sorveglianza' | 'cantina' | 'pedro';

export interface LevelDef {
    id: string;
    /** titolo in maiuscolo, senza la parola accento */
    title: string;
    /** parola evidenziata a pennarello nel titolo */
    accentWord: string;
    color: ZoneColor;
    /** battuta mostrata sotto la title card */
    punchline: string;
    /** griglia ascii: # terreno, ^ spine, ~ acqua, P spawn, C microfono, X uscita */
    grid: string[];
    /** mappa lettera -> entità */
    entities: Record<string, EntitySpec>;
    /** id del livello successivo (uscita X), assente per l'ultimo */
    next?: string;
    /** dialogo lanciato al primo ingresso */
    introDialogue?: string;
    /** logica speciale del capitolo */
    script?: LevelScript;
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
    /** flag di storia: ivan, tommasorveglianza, dispositivo, smela... */
    flags: string[];
    endingSeen: string | null;
    playerName: string;
    stats: {
        forza: number;
        costituzione: number;
        flusso: number;
    };
}

export interface DroppedBarre {
    levelId: string;
    x: number;
    y: number;
    amount: number;
}
