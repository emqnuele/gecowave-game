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
    | 'scudo'
    | 'acquatossica';

export type EnemyKind =
    | 'glitchetto'
    | 'citelis'
    | 'pendolare'
    | 'pittura'
    | 'pittura-mini'
    | 'tecnodrone'
    | 'tossico'
    | 'tossico-trenbo'
    | 'formica'
    | 'numero'
    | 'specchietto'
    | 'padella'
    | 'ammiratore'
    | 'telecamera'
    | 'notino-mini'
    | 'eco'
    | 'bottiglia'
    | 'ricordo'
    | 'fiattipo';

export type BossKind =
    | 'guggu' | 'breccio' | 'notino' | 'riba' | 'furgone' | 'limite'
    | 'lochef' | 'ombra' | 'ticummi' | 'formicona' | 'teorema' | 'pedrino' | 'pedro' | 'dei' | 'flauto'
    | 'danjilo' | 'smela' | 'settequaranta' | 'custode'
    | 'delegato' | 'notturno' | 'modello' | 'revisore' | 'garante'
    | 'trentatre'
    | 'maranza' | 'maranzone' | 'istruttore' | 'annascrivania' | 'walter';

export type EntitySpec =
    | { type: 'enemy'; kind: EnemyKind }
    | { type: 'npc'; id: string }
    | { type: 'ability'; ability: AbilityId }
    | { type: 'lore'; id: string }
    | { type: 'barre'; amount: number }
    | { type: 'cuore' }
    | { type: 'maschera' }
    | { type: 'boss'; kind: BossKind }
    /** oggetto dello zaino o amuleto (vedi content/items.ts) */
    | { type: 'item'; item: string; amount?: number }
    /** varco verso un capitolo segreto; appare solo se needsFlag è attivo */
    | { type: 'portal'; to: string; needsFlag?: string; label?: string };

/** script speciali di livello gestiti dalla GameScene */
export type LevelScript = 'bus' | 'lametta' | 'trenbolone' | 'caso' | 'ruhra' | 'tana' | 'sorveglianza' | 'cantina' | 'ricordi' | 'indagine' | 'pedro' | 'custode' | 'galliate' | 'marcetti';

export interface LevelDef {
    id: string;
    /** titolo in maiuscolo, senza la parola accento */
    title: string;
    /** parola evidenziata a pennarello nel titolo */
    accentWord: string;
    color: ZoneColor;
    /** bioma grafico (vedi content/biomes.ts); se manca si deduce dall'id o dal colore */
    biome?: string;
    /** battuta mostrata sotto la title card */
    punchline: string;
    /** griglia ascii: # terreno, ^ spine, ~ acqua, P spawn, C microfono, X uscita */
    grid: string[];
    /** mappa lettera -> entità */
    entities: Record<string, EntitySpec>;
    /** id del livello successivo (uscita X), assente per l'ultimo */
    next?: string;
    /** capitolo segreto: non entra nella progressione né nella schermata viaggio */
    secret?: boolean;
    /** dove sputa l'uscita di un capitolo segreto se manca il portale d'origine */
    returnTo?: string;
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
    /** modalità doomsday: il realm si sgretola se perdi tempo, scelta alla forgia */
    doomsdayMode: boolean;
    /** avanzamento del doomsday 0..1, persistito così non si azzera riavviando */
    doomsday: number;
    stats: {
        forza: number;
        costituzione: number;
        flusso: number;
    };
    /** zaino: id oggetto -> quantità */
    inventory: Record<string, number>;
    /** amuleti posseduti */
    charms: string[];
    /** amuleti indossati, cambiabili solo ai microfoni */
    equipped: string[];
    /** tacche totali per gli amuleti */
    notches: number;
    /** storico dei messaggi wavesung */
    messages: PhoneMessage[];
    /** contatori per il profilo */
    record: { deaths: number; kills: number; bosses: number; playMs: number; talks: number };
    /** traccia scelta dalla radio, null = musica del capitolo */
    radio: string | null;
    /** stanze visitate per regione: la mappa del telefono si rivela da qui */
    explored: Record<string, number[]>;
    /** fermate del citelis scoperte: "capitolo:microfono" */
    stops: string[];
    /** missioni dei passanti: fase e contatore */
    quests: Record<string, { s: 'attiva' | 'pronta' | 'fatta'; n: number }>;
    /** trofei sbloccati */
    achievements: string[];
    /** la modalità assistita è stata accesa almeno una volta in questa partita */
    assisted: boolean;
    /** record per capitolo */
    scores: Record<string, ChapterScore>;
    /** il capitolo in corso: da quando, con quante morti e uccisioni all'ingresso */
    chapterRun: { id: string; startMs: number; deaths0: number; kills0: number; noHitBosses: number } | null;
}

export interface ChapterScore {
    score: number;
    timeMs: number;
    deaths: number;
    kills: number;
    explored: number;
    secrets: number;
    assisted: boolean;
}

export interface PhoneMessage {
    sender: string;
    text: string;
    at: number;
    read: boolean;
}

export interface DroppedBarre {
    levelId: string;
    x: number;
    y: number;
    amount: number;
}
