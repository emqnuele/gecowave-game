/* quali ricordi esistono, di che colore e prima di quale dialogo: il film vero, inquadratura per inquadratura, è in films.ts */

export interface FlashbackDef {
    id: string;
    /** tinta d'epoca del ricordo */
    tint: number;
    note: string;
}

export const FLASHBACKS: Record<string, FlashbackDef> = {
    // lametta passa il foglio a pedro: «raddrizzalo tu»
    'fb-ordine': {
        id: 'fb-ordine', tint: 0xc084fc,
        note: 'indizio-1 / delegato: la delega, in un foglio',
    },
    // lametta compra la boccetta dallo stagista
    'fb-notte': {
        id: 'fb-notte', tint: 0xfb923c,
        note: 'indizio-2 / notturno / scontrino 03:58',
    },
    // lametta ritrae pedro già storto
    'fb-ritratto': {
        id: 'fb-ritratto', tint: 0xc084fc,
        note: 'indizio-3 / modello: il mandato disegnato',
    },
    // ivan spinge il bus sepolto a mani nude
    'fb-bus': {
        id: 'fb-bus', tint: 0xfacc15,
        note: 'barrato / ivan: la furia prima del loop',
    },
    // pedro e il geco sul muro, notte dopo notte
    'fb-muro': {
        id: 'fb-muro', tint: 0x67e8f9,
        note: 'quaderno / ricordi: chi ha scelto il custode',
    },
    // la tommasorveglianza registra il geco e costruisce l'ombra
    'fb-ombra': {
        id: 'fb-ombra', tint: 0x22d3ee,
        note: 'ombra / ticummi: il prezzo dello 0,09',
    },
    // giorno 42: pedro rilegge gli appunti e conclude
    'fb-glitch': {
        id: 'fb-glitch', tint: 0xf87171,
        note: 'ricordo-glitch / glitchpedro: non un errore, una conclusione',
    },
    // lametta spegne la telecamera di pedro, notte 41
    'fb-telecamera': {
        id: 'fb-telecamera', tint: 0x1e293b,
        note: 'sorveglianza scheda-2 / cantina: il rimorso registrato',
    },
    // piema corregge il log di nascita di pedro per coprire il socio
    'fb-riscrive': {
        id: 'fb-riscrive', tint: 0x60a5fa,
        note: 'pensiero sepolto / revisore: la copertura, in una riga',
    },
    // giorno 30: la frase che pedro salva nella cartella IMPORTANTE
    'fb-giorno30': {
        id: 'fb-giorno30', tint: 0x67e8f9,
        note: 'ricordo-lametta / giorno30: l\'unica cosa sua',
    },
    // lametta, la mattina dopo: gira il foglio e non chiede niente
    'fb-mattina': {
        id: 'fb-mattina', tint: 0x9d7bd8,
        note: 'notturno / verita-1: la vergogna, non il piano',
    },
    // giorno 37: la promessa che lametta non ricorderà
    'fb-promessa': {
        id: 'fb-promessa', tint: 0xc084fc,
        note: 'modello / verita-2: la promessa rovesciata',
    },
    // quarant'anni fa: piema riscrive il verbale dell'aula bruciata
    'fb-verbale': {
        id: 'fb-verbale', tint: 0x3b6fb6,
        note: 'delegato / verita-4: la prima copertura',
    },
};

/** quale flashback prima di quale dialogo (mostra, poi 1-2 righe al max) */
export const FLASHBACK_BEFORE: Record<string, string> = {
    'indizio-1': 'fb-ordine',
    'indizio-2': 'fb-notte',
    'indizio-3': 'fb-ritratto',
    'notturno-intro': 'fb-mattina',
    'modello-intro': 'fb-promessa',
    'delegato-intro': 'fb-verbale',
    'pensiero-sepolto': 'fb-riscrive',
    'revisore-intro': 'fb-riscrive',
    'lametta-cantina': 'fb-telecamera',
    'ricordo-lametta': 'fb-giorno30',
    'pedro-quaderno': 'fb-muro',
    'quaderno-completo': 'fb-muro',
    'ricordo-ordine': 'fb-notte',
    'ricordo-glitch': 'fb-glitch',
    'ombra-intro': 'fb-ombra',
    'ombra-intro-scarsa': 'fb-ombra',
    'ticummi-intro-cliente': 'fb-ombra',
    'ivan-ricordo': 'fb-bus',
    'barrato-ingresso': 'fb-bus',
    'pedro-giorno30': 'fb-giorno30',
    'glitchpedro-intro': 'fb-glitch',
};

/** dialoghi il cui flashback, se già visto altrove, non si rigioca */
export const FLASHBACK_ONCE = new Set(['revisore-intro']);
