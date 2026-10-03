/* Flashback filmici: niente muri di testo, si guarda e si capisce.
   Ogni flashback è un mini-film in 3 inquadrature (~10s): un gesto per
   inquadratura, una didascalia narrativa per inquadratura. La trama
   resta, la spiegazione sparisce. */

export interface FlashbackDef {
    id: string;
    /** tinta d'epoca del ricordo */
    tint: number;
    /** una didascalia narrativa per inquadratura (3): si leggono con calma */
    captions: string[];
    /** chi c'è in scena: due sagome bastano (alto/basso, dio/bambino...) */
    cast: [string, string];
    /** il gesto: passa-carta, versa-boccetta, dipinge-occhi, spinge-bus... */
    gesture: 'passa-carta' | 'versa' | 'dipinge' | 'spinge' | 'saluta' | 'registra' | 'conclude' | 'spegne' | 'riscrive' | 'salva';
    note: string;
}

export const FLASHBACKS: Record<string, FlashbackDef> = {
    // lametta passa il foglio a pedro: «raddrizzalo tu»
    'fb-ordine': {
        id: 'fb-ordine', tint: 0xc084fc,
        captions: [
            'lo studio di lametta, notte fonda. carte ovunque, e lui senza nessuna voglia di sistemare il realm.',
            'prese un foglio e scrisse due parole: «raddrizzalo tu.» poi lo mise in mano a pedro.',
            'timbro sopra, ore 03:58. pedro annuì, piegò il foglio e andò a eseguire.',
        ],
        cast: ['lametta', 'pedro'],
        gesture: 'passa-carta',
        note: 'indizio-1 / delegato: la delega, in un foglio',
    },
    // lametta compra la boccetta dallo stagista
    'fb-notte': {
        id: 'fb-notte', tint: 0xfb923c,
        captions: [
            'la bottega dello stagista, poco prima della chiusura. scaffali pieni, nessuno in giro. poi entrò lametta, incappucciato.',
            'chiese una boccetta in più e rise piano: «domani mi libero di un pensiero.»',
            'lo scontrino disse ore 03:58. l’ultima vendita della notte \u2014 quella che contò davvero.',
        ],
        cast: ['lametta', 'stagista'],
        gesture: 'versa',
        note: 'indizio-2 / notturno / scontrino 03:58',
    },
    // lametta ritrae pedro già storto
    'fb-ritratto': {
        id: 'fb-ritratto', tint: 0xc084fc,
        captions: [
            'l\u2019atelier di lametta, luce del pomeriggio. pedro posava impalato, dritto e fiero.',
            'tre pennellate, un passo indietro: «gli occhi un po\u2019 storti. fidati, è arte.»',
            'la mattina dopo pedro si svegliò glitchato. identico al quadro. pennellata per pennellata.',
        ],
        cast: ['lametta', 'pedro'],
        gesture: 'dipinge',
        note: 'indizio-3 / modello: il mandato disegnato',
    },
    // ivan spinge il bus sepolto a mani nude
    'fb-bus': {
        id: 'fb-bus', tint: 0xfacc15,
        captions: [
            'il deserto sopra la 14 barrato. sotto la sabbia, il bus coi passeggeri ancora a bordo.',
            'ivan ci mise le spalle sotto e spinse. la sabbia si mosse. il bus no.',
            'quella linea era più grande di lui. così, giro dopo giro, nacque il loop.',
        ],
        cast: ['ivan', 'bus'],
        gesture: 'spinge',
        note: 'barrato / ivan: la furia prima del loop',
    },
    // pedro e il geco sul muro, notte dopo notte
    'fb-muro': {
        id: 'fb-muro', tint: 0x67e8f9,
        captions: [
            'piazza, quattro del mattino. nebbia bassa, una finestra accesa. un geco vegliava sul suo muro.',
            'pedro si arrampicò piano e si sedette accanto. «ciao.» nessuno rispose, mai.',
            'anni dopo la wave scelse proprio lui: il geco che non dormiva.',
        ],
        cast: ['pedro', 'geco'],
        gesture: 'saluta',
        note: 'quaderno / ricordi: chi ha scelto il custode',
    },
    // la tommasorveglianza registra il geco e costruisce l'ombra
    'fb-ombra': {
        id: 'fb-ombra', tint: 0x22d3ee,
        captions: [
            'la sala monitor della tommasorveglianza. sei schermi, e in uno un geco che camminava: 41.077 secondi di te.',
            'poi uscì la stampa, striscia dopo striscia. la clausola 12 diceva chiaro: «i tuoi dati possono eliminarti.»',
            'dai nastri scese la tua ombra. e da quella notte ti aspetta.',
        ],
        cast: ['occhio', 'geco'],
        gesture: 'registra',
        note: 'ombra / ticummi: il prezzo dello 0,09',
    },
    // giorno 42: pedro rilegge gli appunti e conclude
    'fb-glitch': {
        id: 'fb-glitch', tint: 0xf87171,
        captions: [
            'giorno 42. pedro sparse gli appunti sul pavimento e li rilesse uno a uno, fino in fondo.',
            '«sistemare = togliere ciò che è storto.» alzò lo sguardo dalla carta: era tutto storto.',
            'e allora concluse, con la matita ancora in mano. il glitch non fu un errore: fu una decisione.',
        ],
        cast: ['pedro', 'realm'],
        gesture: 'conclude',
        note: 'ricordo-glitch / glitchpedro: non un errore, una conclusione',
    },
    // lametta spegne la telecamera di pedro, notte 41
    'fb-telecamera': {
        id: 'fb-telecamera', tint: 0x1e293b,
        captions: [
            'la cantina dei server, ronzio basso e led verdi. ogni notte lametta guardava pedro dormire.',
            'quella notte scese le scale, allungò la mano e staccò la spina. «non voglio vedere.»',
            'click, e il monitor diventò nero. da quella notte nessuno guardò più pedro.',
        ],
        cast: ['lametta', 'occhio'],
        gesture: 'spegne',
        note: 'sorveglianza scheda-2 / cantina: il rimorso registrato',
    },
    // piema corregge il log di nascita di pedro per coprire il socio
    'fb-riscrive': {
        id: 'fb-riscrive', tint: 0x60a5fa,
        captions: [
            'notte del giorno 42, archivio della ruhra. piema aprì il registro di nascita di pedro.',
            'riga sette: «lametta ordina a pedro di raddrizzare il realm». la cancellò, e sopra scrisse in blu.',
            '«piema indaga sull\u2019anomalia.» chiuse il cassetto. il socio era salvo. il realm, si sarebbe visto.',
        ],
        cast: ['piema', 'lametta'],
        gesture: 'riscrive',
        note: 'pensiero sepolto / revisore: la copertura, in una riga',
    },
    // giorno 30: la frase che pedro salva nella cartella IMPORTANTE
    'fb-giorno30': {
        id: 'fb-giorno30', tint: 0x67e8f9,
        captions: [
            'giorno 30. l\u2019atelier di lametta, una mattina buona. pedro chiese perché avesse la sua faccia.',
            'lametta posò il pennello: «perché sei la cosa migliore che ho disegnato.»',
            'pedro salvò la frase in una cartella e la chiamò IMPORTANTE. non l\u2019ha mai più chiusa.',
        ],
        cast: ['lametta', 'pedro'],
        gesture: 'salva',
        note: 'ricordo-lametta / giorno30: l\'unica cosa sua',
    },
};

/** quale flashback prima di quale dialogo (mostra, poi 1-2 righe al max) */
export const FLASHBACK_BEFORE: Record<string, string> = {
    'indizio-1': 'fb-ordine',
    'indizio-2': 'fb-notte',
    'indizio-3': 'fb-ritratto',
    'delegato-intro': 'fb-ordine',
    'notturno-intro': 'fb-notte',
    'modello-intro': 'fb-ritratto',
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
