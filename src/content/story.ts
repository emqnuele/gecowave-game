import type { AbilityId, DialogueLine } from '../types';

/* la voce del gruppo: minuscolo, autoironico, mai tecnico.
   riba scrive coi refusi, pedro corretto e composto. */

export const INTRO_CARDS: { text: string; punch?: string }[] = [
    {
        text: 'cosenza, anno più o meno presente. una notte come tante: studio aperto, microfoni caldi, gechi sui muri a fare da pubblico.',
    },
    {
        text: "poi l'ALGORITMO si è svegliato. ha analizzato la wave e ha deciso che «non performava». l'ha aspirata tutta: le serate, gli inside joke, i feat mai usciti. perfino i gechi si sono ammosciati.",
    },
    {
        text: 'serviva qualcuno che andasse a riprendersela. un eroe, idealmente.',
        punch: "è toccato al geco. non era il primo della lista: era l'unico sveglio.",
    },
];

export const ENDING_CARDS: { text: string; punch?: string }[] = [
    {
        text: "l'algoritmo si spegne con l'ultimo suono che avrebbe voluto bannare: una risata registrata male.",
    },
    {
        text: 'la wave torna a cosenza. non più forte di prima, non più pulita. uguale identica. era esattamente quello il punto.',
        punch: 'i gechi tornano sui muri. la serata può ricominciare.',
    },
];

export const DEATH_PUNCHLINES = [
    'il flop è parte del processo',
    'manco mille stream, manco mille vite',
    'anche questa la tagliamo dal disco',
    'riprova. il geco crede in te. più o meno.',
    'morire è gratis, ricominciare pure',
    "l'algoritmo ride. fallo smettere.",
    'nemmeno su soundcloud andava così male',
];

export const DIALOGUES: Record<string, DialogueLine[]> = {
    'elder-vico': [
        { speaker: 'nonno geco', color: 'green', text: 'oh, ti sei svegliato. bene. la wave è sparita e con lei metà del quartiere. tocca a te, pare.' },
        { speaker: 'nonno geco', color: 'green', text: 'ti muovi con A e D (o le frecce), salti con SPAZIO. colpisci con J o col mouse, come ti pare.' },
        { speaker: 'nonno geco', color: 'green', text: 'se trovi un microfono, fermati lì vicino e premi E: salva tutto. tipo bonfire, ma più rap.' },
        { speaker: 'nonno geco', color: 'green', text: 'ogni colpo che metti a segno carica il flow. tieni premuto Q per trasformarlo in salute. costa caro: niente è gratis qui, manco morire.' },
        { speaker: 'nonno geco', color: 'green', text: 'se invece muori, lasci a terra tutte le barre che hai in tasca. torna a prendertele prima di rimorire, o le perdi sul serio.' },
        { speaker: 'nonno geco', color: 'green', text: 'vai verso destra. si va sempre verso destra, è il genere.' },
    ],
    'riba-palude': [
        { speaker: 'riba 🦖', color: 'orange', text: 'ooh il geco!! finalmete!! aspeta che mi carico... caricamento... ecco fato.' },
        { speaker: 'riba 🦖', color: 'orange', text: "l'algoritmo ha preso la wave e l'ha mesa in una playlist. una PLAYLIST. «lofi beats to study to». capisci la gravita della situazzione." },
        { speaker: 'riba 🦖', color: 'orange', text: 'tieni, ho trovato sta wave nel fango qua dietro. fa cose veloci. tipo molto veloci. provala contro un muro, fidati.' },
        { speaker: 'riba 🦖', color: 'orange', text: "se mori non è colpa mia. ok forse un po'." },
    ],
    'pedro-torre': [
        { speaker: 'pedro', color: 'blue', text: 'Benvenuto. Avevo calcolato il tuo arrivo con un margine di errore di quattro minuti. Sei in ritardo di quattro minuti.' },
        { speaker: 'pedro', color: 'blue', text: "L'Algoritmo ti aspetta oltre questa torre, sul palco principale. Ho eseguito le simulazioni: le tue probabilità sono basse. Ma non zero. Statisticamente interessante." },
        { speaker: 'pedro', color: 'blue', text: 'Ti ho preparato un modulo offensivo: la wave del verso. Premi F per scagliare una barra a distanza. Usala con criterio, non come farebbe Riba.' },
        { speaker: 'pedro', color: 'blue', text: 'Riba ti saluta. Non ricambiare: si monta la testa.' },
    ],
    'boss-intro': [
        { speaker: "l'algoritmo", color: 'red', text: 'UTENTE NON RICONOSCIUTO. genere: irrilevante. engagement: zero. la tua presenza su questo palco non è stata raccomandata.' },
        { speaker: "l'algoritmo", color: 'red', text: 'la wave è stata ottimizzata. ora è contenuto. il contenuto performa. tu no.' },
        { speaker: 'il geco', color: 'green', text: '*verso di geco determinato*' },
    ],
    'lore-1': [
        { speaker: 'stele della lore', color: 'purple', text: 'prima serata documentata della wave: tre persone, un microfono rotto e un cane. il cane era il pubblico. ha apprezzato.' },
    ],
    'lore-2': [
        { speaker: 'stele della lore', color: 'purple', text: 'qui giace il primo feat mai registrato. non lo sentirete mai. è meglio così, fidatevi della cripta.' },
    ],
    'lore-3': [
        { speaker: 'stele della lore', color: 'purple', text: "la cripta custodisce i demo del 2019. l'algoritmo non li ha aspirati: non li ha voluti nemmeno lui." },
    ],
};

export const ABILITY_CARDS: Record<AbilityId, { name: string; desc: string; key: string }> = {
    doubleJump: {
        name: 'wave del rimbalzo',
        desc: 'premi SPAZIO a mezz\'aria per saltare di nuovo. la fisica non era d\'accordo, ma non l\'abbiamo chiesto a lei.',
        key: 'spazio ×2',
    },
    dash: {
        name: 'wave della scivolata',
        desc: 'premi SHIFT (o K) per scattare in avanti. invincibile mentre scivoli, come quando ignori i commenti.',
        key: 'shift',
    },
    verso: {
        name: 'wave del verso',
        desc: 'premi F per sputare una barra a distanza. costa un po\' di flow. è il dissing, ma proiettile.',
        key: 'f',
    },
};

export const TOASTS = {
    checkpoint: 'il microfono ti riconosce. tutto salvato.',
    barreRecovered: 'barre recuperate. non perderle più.',
    noFlow: 'flow insufficiente. colpisci qualcosa.',
    bossDoor: "si sente un basso che giudica. l'algoritmo è oltre.",
};
