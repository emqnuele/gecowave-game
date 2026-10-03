/* lo zaino del custode: consumabili, oggetti chiave (dedotti dai flag
   di storia, così non esiste uno stato doppio) e amuleti da equipaggiare
   ai microfoni, ognuno con il suo costo in tacche */

export type ItemKind = 'consumabile' | 'chiave' | 'amuleto' | 'potenziamento';

export interface ItemDef {
    id: string;
    name: string;
    icon: string;
    kind: ItemKind;
    desc: string;
    /** battuta a pennarello sotto la descrizione */
    punch?: string;
    /** prezzo su wavezon; assente = non si compra */
    price?: number;
    /** amuleti: tacche occupate */
    cost?: number;
    /** oggetti chiave: compaiono quando il flag è attivo */
    flag?: string;
}

export const ITEMS: Record<string, ItemDef> = {
    /* ---------- consumabili ---------- */
    crocchetta: {
        id: 'crocchetta', name: 'crocchetta del bar', icon: '🍘', kind: 'consumabile', price: 15,
        desc: 'ridà 1 vita. fritta nel 2019, ancora calda dentro.',
        punch: 'non chiedere che olio.',
    },
    'panino-nonna': {
        id: 'panino-nonna', name: 'panino della nonna di markolino', icon: '🥪', kind: 'consumabile', price: 60,
        desc: 'ridà 3 vite. la nonna lo prepara per chiunque passi, anche per i nemici.',
        punch: 'c\'è dentro amore e mortadella.',
    },
    energetico: {
        id: 'energetico', name: 'energetico scaduto', icon: '🥫', kind: 'consumabile', price: 22,
        desc: 'riempie metà del flow. scaduto da quattro anni, il che lo rende più forte.',
        punch: 'il cuore fa un rumore nuovo.',
    },
    'caffe-mensa': {
        id: 'caffe-mensa', name: 'caffè della mensa della ruhra', icon: '☕', kind: 'consumabile', price: 35,
        desc: 'per 40 secondi attacchi molto più veloce. piema ne beve sei prima di analisi 1.',
        punch: 'sa di bruciato e di teoremi.',
    },
    rubinetto: {
        id: 'rubinetto', name: 'acqua del rubinetto (dichiarata)', icon: '🚰', kind: 'consumabile', price: 10,
        desc: 'ridà 1 vita e lava via la sete di smela. dichiarata come tale, per legge.',
        punch: 'finalmente un\'etichetta onesta.',
    },
    'brodo-lochef': {
        id: 'brodo-lochef', name: 'brodo tiepido di lochef', icon: '🍲', kind: 'consumabile',
        desc: 'ridà tutta la vita. tiepido. sempre tiepido. non chiederti chi l\'ha assaggiato prima.',
        punch: '"come piace a te".',
    },
    santino: {
        id: 'santino', name: 'santino di guggu', icon: '🃏', kind: 'consumabile', price: 50,
        desc: 'il prossimo colpo che ricevi viene assorbito dal santo. guggu benedice chi paga il biglietto.',
        punch: 'sul retro c\'è scritto "capolinea".',
    },

    /* ---------- amuleti ---------- */
    'catena-lametta': {
        id: 'catena-lametta', name: 'catena d\'oro di lametta', icon: '⛓️', kind: 'amuleto', cost: 2,
        desc: 'i colpi fanno il 25% di danno in più. pesa come un ritornello.',
    },
    'cuffie-notino': {
        id: 'cuffie-notino', name: 'cuffie di notino', icon: '🎧', kind: 'amuleto', cost: 1,
        desc: 'le barre vengono da te da molto più lontano. notino le usava per non sentire le critiche.',
    },
    'scarpe-markolino': {
        id: 'scarpe-markolino', name: 'scarpe di markolino', icon: '👟', kind: 'amuleto', cost: 2, price: 100,
        desc: 'corri il 15% più veloce. puzzano di fretta.',
    },
    'occhiali-piema': {
        id: 'occhiali-piema', name: 'occhiali di piema', icon: '👓', kind: 'amuleto', cost: 1,
        desc: 'ogni colpo dà il 40% di flow in più. vedi il mondo come un insieme di limiti.',
    },
    'rosario-riba': {
        id: 'rosario-riba', name: 'rosario di riba', icon: '📿', kind: 'amuleto', cost: 2, price: 130,
        desc: 'ti curi quasi il doppio più in fretta. riba lo ha comprato credendo fosse un braccialetto.',
    },
    'microfono-oro': {
        id: 'microfono-oro', name: 'microfono d\'oro', icon: '🎤', kind: 'amuleto', cost: 2,
        desc: 'i fendenti arrivano un terzo più lontano. il primo disco d\'oro del realm, fuso.',
    },
    'ciabatte-rio': {
        id: 'ciabatte-rio', name: 'ciabatte del rio', icon: '🩴', kind: 'amuleto', cost: 1,
        desc: 'la scivolata si ricarica il 40% prima. sono di guggu: le perde a ogni capolinea.',
    },
    'pancia-lochef': {
        id: 'pancia-lochef', name: 'pancia di lochef', icon: '🍖', kind: 'amuleto', cost: 2,
        desc: '+2 vite massime. c\'è sempre posto.',
    },
    'teorema-tascabile': {
        id: 'teorema-tascabile', name: 'teorema tascabile', icon: '📐', kind: 'amuleto', cost: 1,
        desc: 'le wave attive costano un quarto di flow in meno. dimostrato, non chiedere come.',
    },
    'geco-portafortuna': {
        id: 'geco-portafortuna', name: 'geco portafortuna', icon: '🦎', kind: 'amuleto', cost: 1, price: 110,
        desc: 'i nemici lasciano il 30% di barre in più. ti guarda. ti giudica. ti arricchisce.',
    },
    'cuore-vetro': {
        id: 'cuore-vetro', name: 'cuore di vetro', icon: '💔', kind: 'amuleto', cost: 3,
        desc: 'danno +60%, ma ogni colpo che prendi vale doppio. per chi vive di dissing.',
    },
    'sim-pedro': {
        id: 'sim-pedro', name: 'sim di pedro', icon: '📶', kind: 'amuleto', cost: 2,
        desc: 'il flow si ricarica da solo, piano piano. dentro c\'è ancora un po\' di lui.',
    },
    /* le ricompense delle missioni dei passanti */
    'biglietto-citelis': {
        id: 'biglietto-citelis', name: 'abbonamento del citelis', icon: '🎫', kind: 'amuleto', cost: 1,
        desc: 'corri un po\' più veloce e la scivolata torna prima. scaduto nel 2019, nessuno controlla.',
    },
    'pennello-copista': {
        id: 'pennello-copista', name: 'pennello del copista', icon: '🖌️', kind: 'amuleto', cost: 1,
        desc: 'i colpi fanno il 12% di danno in più. tratto pulito, coscienza sporca.',
    },
    'canna-pescatore': {
        id: 'canna-pescatore', name: 'canna da pesca del rio', icon: '🎣', kind: 'amuleto', cost: 1,
        desc: 'le barre arrivano da più lontano e ne cadono un po\' di più. abboccano solo i sacchetti.',
    },
    'grembiule-cuoco': {
        id: 'grembiule-cuoco', name: 'grembiule dell\'aiuto-cuoco', icon: '🧑‍🍳', kind: 'amuleto', cost: 2,
        desc: '+1 vita massima e ti curi più in fretta. macchiato di cose che è meglio non sapere.',
    },
    'casco-operaio': {
        id: 'casco-operaio', name: 'caschetto del sindacato', icon: '⛑️', kind: 'amuleto', cost: 2,
        desc: 'prendi un quarto di danno in meno. omologato per scioperi e crolli.',
    },
    'tesi-dottorando': {
        id: 'tesi-dottorando', name: 'tesi del dottorando', icon: '📚', kind: 'amuleto', cost: 1,
        desc: 'ogni colpo dà il 25% di flow in più. 400 pagine, nessuna conclusione.',
    },
    'quaderno-pedro': {
        id: 'quaderno-pedro', name: 'il quaderno ricomposto di pedro', icon: '📒', kind: 'amuleto', cost: 2,
        desc: 'il flow torna da solo e ti curi più in fretta. cinque pagine tenute insieme col nastro adesivo.',
        punch: 'c\'è scritto il tuo nome. cioè: "geco". vale lo stesso.',
    },
    sparacchino: {
        id: 'sparacchino', name: 'lo sparacchino di notino', icon: '🔫', kind: 'amuleto', cost: 1,
        desc: 'il colpo risonante fa il 50% di danno in più. sequestrato a un bambino, quindi tecnicamente è una prova.',
        punch: 'sul calcio, a pennarello: "BUM".',
    },
    'catenina-maranza': {
        id: 'catenina-maranza', name: 'catenina del maranza', icon: '🪙', kind: 'amuleto', cost: 1,
        desc: 'i fendenti arrivano un po\' più lontano. finto oro, vera arroganza.',
    },

    /* ---------- potenziamenti ---------- */
    tacca: {
        id: 'tacca', name: 'tacca per amuleti', icon: '➕', kind: 'potenziamento',
        desc: 'una tacca in più per portare amuleti. il realm è pieno di gente che ti vuole carico.',
    },

    /* ---------- oggetti chiave (dai flag) ---------- */
    dispositivo: {
        id: 'dispositivo', name: 'il dispositivo di riba', icon: '📟', kind: 'chiave', flag: 'dispositivo',
        desc: 'riba giura che serve a qualcosa. piema giura che è un tamagotchi.',
    },
    abbonamento: {
        id: 'abbonamento', name: 'abbonamento tommasorveglianza', icon: '👁️', kind: 'chiave', flag: 'tommasorveglianza',
        desc: 'protezione premium. ti protegge da tutti tranne che da chi ti protegge.',
    },
    fascicolo: {
        id: 'fascicolo', name: 'fascicolo del caso analisi 1', icon: '🗂️', kind: 'chiave', flag: 'caso-risolto',
        desc: 'quarant\'anni di indagini, tre indizi, un arresto. romero l\'ha incorniciato.',
    },
    ivan: {
        id: 'ivan', name: 'la promessa di ivan', icon: '🚌', kind: 'chiave', flag: 'ivan',
        desc: 'ivan maggini sta dalla tua parte. ha ancora la chiave del bus in tasca.',
    },
    ricordi: {
        id: 'ricordi', name: 'il backup di pedro', icon: '💾', kind: 'chiave', flag: 'ricordi-visti',
        desc: 'giorni 1-42. hai visto chi era prima di diventare chi è.',
    },
};

/** prezzi crescenti delle tacche extra su wavezon */
export const NOTCH_PRICES = [120, 280, 520];
export const BASE_NOTCHES = 3;

/** l'amuleto che ogni boss lascia cadere */
export const BOSS_CHARMS: Record<string, string> = {
    guggu: 'ciabatte-rio',
    breccio: 'catena-lametta',
    notino: 'cuffie-notino',
    riba: 'occhiali-piema',
    lochef: 'pancia-lochef',
    teorema: 'teorema-tascabile',
    ticummi: 'cuore-vetro',
    pedrino: 'sim-pedro',
    limite: 'microfono-oro',
};

export const STARTING_ITEMS: Record<string, number> = {
    crocchetta: 2,
};

/** effetti aggregati degli amuleti: moltiplicatori e bonus */
export interface CharmMods {
    damage: number;
    speed: number;
    magnet: number;
    flowPerHit: number;
    healTime: number;
    range: number;
    dashCooldown: number;
    maxHp: number;
    abilityCost: number;
    barre: number;
    damageTaken: number;
    /** flow al secondo */
    flowRegen: number;
    /** moltiplicatore del colpo risonante */
    risonante: number;
}

export function charmMods(equipped: readonly string[]): CharmMods {
    const m: CharmMods = {
        damage: 1, speed: 1, magnet: 1, flowPerHit: 1, healTime: 1, range: 1,
        dashCooldown: 1, maxHp: 0, abilityCost: 1, barre: 1, damageTaken: 1, flowRegen: 0, risonante: 1,
    };
    for (const id of equipped) {
        switch (id) {
            case 'catena-lametta': m.damage *= 1.25; break;
            case 'cuffie-notino': m.magnet *= 3; break;
            case 'scarpe-markolino': m.speed *= 1.15; break;
            case 'occhiali-piema': m.flowPerHit *= 1.4; break;
            case 'rosario-riba': m.healTime *= 0.55; break;
            case 'microfono-oro': m.range *= 1.33; break;
            case 'ciabatte-rio': m.dashCooldown *= 0.6; break;
            case 'pancia-lochef': m.maxHp += 2; break;
            case 'teorema-tascabile': m.abilityCost *= 0.75; break;
            case 'geco-portafortuna': m.barre *= 1.3; break;
            case 'cuore-vetro': m.damage *= 1.6; m.damageTaken *= 2; break;
            case 'sim-pedro': m.flowRegen += 4; break;
            case 'biglietto-citelis': m.speed *= 1.08; m.dashCooldown *= 0.85; break;
            case 'pennello-copista': m.damage *= 1.12; break;
            case 'canna-pescatore': m.magnet *= 2; m.barre *= 1.1; break;
            case 'grembiule-cuoco': m.maxHp += 1; m.healTime *= 0.8; break;
            case 'casco-operaio': m.damageTaken *= 0.75; break;
            case 'tesi-dottorando': m.flowPerHit *= 1.25; break;
            case 'catenina-maranza': m.range *= 1.15; break;
            case 'quaderno-pedro': m.flowRegen += 3; m.healTime *= 0.85; break;
            case 'sparacchino': m.risonante *= 1.5; break;
        }
    }
    return m;
}
