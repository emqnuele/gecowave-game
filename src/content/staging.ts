/* staging muto: una scena ambientale per regione, zero dialoghi.
   Ogni voce descrive un tableau che si capisce guardando: oggetti,
   luci, un gesto in loop. Il manager lo costruisce nel mondo;
   la didascalia (se c'è) è un toast di poche parole, mai un muro. */

export type StagingEffect =
    | 'crater' | 'loop' | 'buried' | 'repaint' | 'shoes'
    | 'still' | 'table' | 'glow' | 'ledger' | 'exam'
    | 'thought' | 'board' | 'wall' | 'cellar'
    | 'backup' | 'drift' | 'log' | 'mixer' | 'keys' | 'desk';

export interface StagingDef {
    region: string;
    /** poche parole, lette in 2 secondi. Vuoto = scena davvero muta. */
    caption: string;
    color: number;
    effect: StagingEffect;
    /** promemoria per chi legge il codice: cosa stai guardando */
    note: string;
}

export const STAGING: Record<string, StagingDef> = {
    perduta: { region: 'perduta', caption: '', color: 0x4ade80, effect: 'crater', note: 'cratere fumante, metro spezzato, 33 inciso ovunque' },
    bus: { region: 'bus', caption: 'giro 851. nessuno scende.', color: 0xfacc15, effect: 'loop', note: 'due sedili uno di fronte all\'altro, tacche sul palo, un biglietto a terra' },
    barrato: { region: 'barrato', caption: '', color: 0xfacc15, effect: 'buried', note: 'citelis sepolto, solo il tetto fuori dalla sabbia, fari spenti' },
    santuario: { region: 'santuario', caption: '', color: 0xc084fc, effect: 'repaint', note: 'parete rifatta 335 volte, una pennellata fuori posto' },
    tecnokill: { region: 'tecnokill', caption: 'la porta è aperta.', color: 0xef4444, effect: 'shoes', note: 'scarpette piccole + sparacchino posato, mai sparato' },
    trenbolone: { region: 'trenbolone', caption: '03:58', color: 0xfb923c, effect: 'still', note: 'bancone, scontrino delle 03:58, boccetta vuota' },
    tana: { region: 'tana', caption: '', color: 0xef4444, effect: 'table', note: 'tavola per due, brodo tiepido, dodicesima sedia vuota' },
    rio: { region: 'rio', caption: '', color: 0x4ade80, effect: 'glow', note: 'fondale che brillava, ora solo un cerchio più chiaro' },
    stabilimento: { region: 'stabilimento', caption: '', color: 0x22d3ee, effect: 'ledger', note: '400 damigiane etichettate tutte uguali, una col nome sbagliato' },
    ruhra: { region: 'ruhra', caption: '', color: 0x60a5fa, effect: 'exam', note: 'banco con carta igienica scritta fitta, timbro 30 e lode' },
    mente: { region: 'mente', caption: '', color: 0x60a5fa, effect: 'thought', note: 'pensiero caldo che trema, gli altri in fila per indice' },
    caso: { region: 'caso', caption: '', color: 0x60a5fa, effect: 'board', note: 'bacheca 40 anni di spilli sullo stesso volto, tazzina sempre piena' },
    sorveglianza: { region: 'sorveglianza', caption: '', color: 0x22d3ee, effect: 'wall', note: 'muro di monitor, uno solo acceso: un geco che dorme' },
    cantina: { region: 'cantina', caption: '', color: 0x22d3ee, effect: 'cellar', note: 'dio legato con fascette, matita e foglio a portata di mano' },
    ricordi: { region: 'ricordi', caption: '', color: 0x67e8f9, effect: 'backup', note: '33 nodi in fila, "cose che tengono", uno sciolto' },
    void: { region: 'void', caption: '', color: 0xc084fc, effect: 'drift', note: 'oggetti alla deriva: boccetta, foglio firmato, chiave' },
    nucleo: { region: 'nucleo', caption: '', color: 0xf87171, effect: 'log', note: 'muro della piazza che non si cancella, 33 tentativi' },
    custode: { region: 'custode', caption: '', color: 0x4ade80, effect: 'mixer', note: 'mixer con ultima traccia in loop, cuffie appese' },
    galliate: { region: 'galliate', caption: '', color: 0xdc2626, effect: 'keys', note: 'motorino con casco appoggiato, nessuno lo tocca' },
    marcetti: { region: 'marcetti', caption: '', color: 0xf59e0b, effect: 'desk', note: 'scrivania del titolare, targa "di nuovo", sedia troppo grande' },
};
