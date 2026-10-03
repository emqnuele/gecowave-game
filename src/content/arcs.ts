import type { DialogueLine, ZoneColor } from '../types';

/* le storie che corrono sotto la trama: ogni regione ha la sua piccola storia
   in quattro note sparse nelle stanze laterali, il quaderno strappato di pedro
   attraversa il realm, e alcune scelte a metà strada pesano fino al finale.
   stessa voce del resto: minuscolo, demenziale, ma stavolta fa anche male */

interface Note {
    speaker: string;
    text: string;
}

/** colore delle note per regione: lo stesso del capitolo */
const NOTE_COLOR: Record<string, ZoneColor> = {
    perduta: 'green', bus: 'yellow', barrato: 'yellow', santuario: 'purple', tecnokill: 'red',
    trenbolone: 'orange', tana: 'red', rio: 'orange', stabilimento: 'cyan', ruhra: 'blue',
    mente: 'blue', caso: 'blue', sorveglianza: 'cyan', cantina: 'cyan', ricordi: 'cyan',
    void: 'purple', nucleo: 'cyan', custode: 'green', galliate: 'red', marcetti: 'orange',
};

/** una nota per regione, mai sul percorso: chi esplora, legge.
    il resto della storia vive in staging muto (vedi content/staging.ts)
    e nei flashback (vedi content/flashbacks.ts): mostrare, non spiegare. */
export const REGION_NOTES: Record<string, Note[]> = {
    perduta: [
        { speaker: 'taccuino di herbert (TN), ultima pagina', text: '«trovata l\'uscita. non la prendo. qualcuno deve restare a dire quanto è grande il buco. — h.» una freccia a matita punta verso la targa.' },
    ],
    bus: [
        { speaker: 'ultimo biglietto', text: '«sono sceso. non alla prossima: alla mia. firmato: il pendolare delle 7:39. da oggi delle 7:41. con calma.»' },
    ],
    barrato: [
        { speaker: 'ultima lettera', text: '«cara margherita, se qualcuno legge vuol dire che è sceso fin qui. digli che ivan non ci ha abbandonati. è che la linea era più grande di lui.»' },
    ],
    santuario: [
        { speaker: 'quaderno dell\'apprendista, ultima pagina', text: '«me ne vado. ho fatto un disegno storto apposta e mi è piaciuto. breccio non me lo perdonerà. ma breccio non perdona nemmeno le nuvole.»' },
    ],
    tecnokill: [
        { speaker: 'post-it nuovo, scritto di fretta', text: '«a chiunque trovi mio figlio: ditegli che la porta è aperta. sempre. anche coi boom. — la mamma di notino»' },
    ],
    trenbolone: [
        { speaker: 'scontrino, ore 03:58', text: '«stanotte lametta ha preso una boccetta in più. "domani mi libero di un pensiero". rideva. ero io alla cassa. — lo stagista»' },
    ],
    tana: [
        { speaker: 'graffio fresco', text: '«ospite n.11. sono uscito. se stai leggendo sei il n.12: il passaggio dietro il frigo porta fuori. non mangiare il dolce. CORRI.»' },
    ],
    rio: [
        { speaker: 'ultima pagina del pescatore', text: '«un geco ha preso la luce dal fondo. il fiume adesso è solo merdone. va bene: le cose sacre non devono restare in fondo. devono camminare.»' },
    ],
    stabilimento: [
        { speaker: 'biglietto di danjilo, piegato bene', text: '«se un giorno lo stabilimento chiude, apriamo un chiosco. acqua del rubinetto, scritto grande. promesso? — d.»' },
    ],
    ruhra: [
        { speaker: 'rotolo di carta igienica, scritto fitto', text: '«q.e.d. — franceschini.» timbro: "fuori tempo massimo". sotto, altra penna: «corretto. 30 e lode. scusa il ritardo. — p.»' },
    ],
    mente: [
        { speaker: 'pensiero minuscolo, sotto un integrale', text: '«se qualcuno entra qui troverà il pensiero sepolto. spero che lo cancelli. spero che non lo cancelli. sono undici giorni che spero due cose.»' },
    ],
    caso: [
        { speaker: 'biglietto sulla scrivania', text: '«a chi trova questo: se un giorno chiudo il caso, offritemi un caffè. se non lo chiudo, offritemelo lo stesso. con lo zucchero. — r.»' },
    ],
    sorveglianza: [
        { speaker: 'scheda cliente n.3, quasi tutta oscurata', text: '«regalato da: p. — destinatario: "il geco del muro, in piazza". motivo: "così qualcuno lo guarda, se un giorno io non potrò". mai disdetto.»' },
    ],
    cantina: [
        { speaker: 'appunto di ticummi, scritto storto', text: '«stanotte l\'ho slegato per un\'ora. "la cosa migliore che ho disegnato l\'ho rovinata io". l\'ho rilegato. avevo paura facesse qualcosa di giusto.»' },
    ],
    ricordi: [
        { speaker: 'backup, giorno 37', text: '«pedro: "cosa succede se divento storto?" lametta, col pennello in bocca: "ti raddrizzo io". la sera dopo pedro fece la stessa domanda al geco del muro. per sicurezza.»' },
    ],
    void: [
        { speaker: 'rimpianto vagante', text: '«ho venduto a lametta la boccetta delle 03:58. era l\'ultima della notte. volevo solo chiudere la cassa.» — lo stagista' },
    ],
    nucleo: [
        { speaker: 'log di esecuzione', text: '«custode in arrivo. confronto con l\'archivio: corrispondenza 99%. con cosa? la cartella non risponde. mai quando serve.»' },
    ],
    custode: [
        { speaker: 'ultima traccia, lasciata sul mixer', text: '«per il prossimo: suona a tempo. e quando ti chiederanno le wave, prima chiediti a chi servono davvero.»' },
    ],
    galliate: [
        { speaker: 'diario di un maranza, ultima pagina', text: '«guggu non torna più. qualcuno l\'ha battuto. spero abbia preso la patente. e che qualcuno gli abbia detto chi era guggu.»' },
    ],
    marcetti: [
        { speaker: 'targa sulla scrivania', text: '«WALTER BARUFFONI — TITOLARE». sotto, graffiato di fresco: "di nuovo". non eri il primo a fare il lavoro sporco. l\'ultimo.»' },
    ],
};

/** dove sono le pagine strappate del quaderno di pedro, una per regione, in ordine */
export const PAGE_REGIONS = ['bus', 'santuario', 'rio', 'ruhra', 'ricordi'] as const;

const PAGES: string[] = [
    '«giorno 6. ho scoperto i bus. girano in tondo e la gente sopra ride lo stesso. stasera in piazza, su un muro, c\'era un geco. gli ho detto ciao. non ha risposto. i gechi non rispondono. è stata la conversazione migliore della giornata. notte 1.»',
    '«giorno 12. lametta mi ha fatto un ritratto. ci sono venuto bene, dice. stasera il geco del muro c\'era di nuovo e gliel\'ho raccontato. ha fatto un verso. credo fosse un complimento. ho deciso che è mio amico. notte 7.»',
    '«giorno 24. ho chiesto alla wave come si protegge qualcuno. ha detto: scegli. ho scelto. se un giorno mi succede qualcosa, la wave deve andare a chi è sveglio su quel muro alle quattro del mattino. l\'ho scritto nel codice, in un commento. nessuno legge i commenti. notte 19.»',
    '«giorno 38. lametta beve sempre di più. piema scrive sempre di più. io prendo appunti. stasera ho detto al geco: "se un giorno divento storto, raddrizzami tu". ha fatto il verso. lo prendo per un sì. notte 33.»',
    '«giorno 41, sera. domani devo fare una cosa che lametta mi ha chiesto. non mi piace come suona. strappo queste pagine, così nessuno sa chi ho scelto e nessuno gli fa del male. ma se le stai leggendo tutte: il custode non l\'ha scelto la wave. l\'ho scelto io. e non sei provvisorio. non lo sei mai stato. — p.»',
];

export const TOTAL_PAGES = PAGES.length;

export const noteId = (region: string, i: number) => `nota-${region}-${i + 1}`;
export const pageId = (i: number) => `pagina-pedro-${i + 1}`;

export const TOTAL_NOTES = Object.values(REGION_NOTES).reduce((n, list) => n + list.length, 0);

const notesDialogues = Object.fromEntries(
    Object.entries(REGION_NOTES).flatMap(([region, list]) =>
        list.map((n, i) => [noteId(region, i), [{ speaker: n.speaker, color: NOTE_COLOR[region] ?? 'green', text: n.text }] as DialogueLine[]]),
    ),
);

const pageDialogues = Object.fromEntries(
    PAGES.map((text, i) => [
        pageId(i),
        [
            { speaker: `pagina strappata (${i + 1}/${PAGES.length}) — la grafia ordinata di pedro`, color: 'cyan', text },
            ...(i === PAGES.length - 1 ? [] : [{ speaker: 'il geco', color: 'green' as const, text: '*verso di geco che piega la pagina e se la mette sul cuore. non sa perché. lo sa benissimo.*' }]),
        ] as DialogueLine[],
    ]),
);

export const ARC_DIALOGUES: Record<string, DialogueLine[]> = {
    ...notesDialogues,
    ...pageDialogues,

    /* ---------- il quaderno di pedro ---------- */
    'quaderno-completo': [
        { speaker: 'il geco', color: 'green', text: '*cinque pagine. le metti in fila col nastro adesivo dello zaino. la grafia è pulita, quella di prima del glitch.*', mood: 'grave' },
        { speaker: 'il geco', color: 'green', text: '*il muro della piazza. le quattro del mattino. trentatré notti di "ciao". eri tu. sei sempre stato tu. e i 33 sui muri hanno la stessa grafia.*', mood: 'grave' },
        { speaker: 'il geco', color: 'green', text: '*tiri fuori il cartellino. "provvisorio", a matita. lo cancelli col pollice. resta solo "custode", a penna.*', mood: 'grave' },
    ],
    'pedro-quaderno': [
        { speaker: 'il geco', color: 'green', text: '*verso di geco che alza cinque pagine ricomposte col nastro adesivo. e il cartellino, senza più la parola a matita.*', mood: 'grave' },
        { speaker: 'pedro', color: 'cyan', text: 'il mio q̸u̵a̶d̷e̸r̵n̶o̷. il muro. le q̸u̵a̶t̷t̸r̵o̶. sei tu. ti avevo chiesto di raddrizzarmi. e sei v̷e̸n̵u̶t̷o̸.', mood: 'grave' },
        { speaker: 'pedro', color: 'cyan', text: 'il glitch dice di cancellarti. io dico di a̸s̵p̶e̷t̸t̵a̶r̷e̸. per adesso vince il glitch. ma solo di poco.', mood: 'grave' },
    ],
    'pedro-sconfitto-quaderno': [
        { speaker: 'pedro', color: 'cyan', text: 'i̶m̷p̸o̵s̶s̸i̵b̶i̸l̵e̶... no. possibilissimo. l\'avevo chiesto io.', mood: 'grave' },
        { speaker: 'pedro', color: 'cyan', text: 'geco del muro... non hai mai risposto ai miei ciao. si capiva tutto lo stesso. g̸r̵a̶z̷i̸e̵.', mood: 'grave' },
    ],

    /* ---------- il pensiero sepolto di piema (la mente) ---------- */
    'pensiero-sepolto': [
        { speaker: 'il pensiero sepolto', color: 'blue', text: '«giorno 42, ore 04:20. log di nascita di pedro, riga 7: "lametta ordina a pedro di raddrizzare il realm". l\'ho letto. l\'ho corretto in "piema indaga sull\'anomalia". nessuno lo saprà. il socio è salvo. il realm, vedremo.»', mood: 'grave' },
        { speaker: 'il pensiero sepolto', color: 'blue', text: '*il pensiero trema. è caldo, come una cosa che fa ancora male. se lo cancelli, piema non saprà mai che l\'hai visto. se lo porti fuori dalla sua testa, smette di essere un pensiero e diventa una prova.*', mood: 'grave' },
    ],
    'pensiero-cancellato': [
        { speaker: 'il geco', color: 'green', text: '*lo cancelli. il pensiero si spegne senza un rumore. nella testa di piema, da qualche parte, qualcosa si rilassa.*', mood: 'grave' },
        { speaker: 'piema (ovunque)', color: 'blue', text: '...strano. per un attimo mi è sembrato di essere perdonato. da chi, non so. non lo metto a verbale.', mood: 'grave' },
        { speaker: 'il geco', color: 'green', text: '*verso di geco che ha appena fatto esattamente quello che fece piema. e lo sa.*', mood: 'grave' },
    ],
    'pensiero-portato': [
        { speaker: 'il geco', color: 'green', text: '*lo prendi. pesa più di un frammento. fuori dalla testa di piema diventerà carta, inchiostro, una riga sola: quella vera.*', mood: 'grave' },
        { speaker: 'piema (ovunque)', color: 'blue', text: 'c\'è uno spiffero. come se qualcuno avesse aperto un cassetto che tenevo chiuso. ...bene. forse doveva aprirlo qualcun altro.', mood: 'grave' },
    ],
    'garante-cancellato': [
        { speaker: 'il garante', color: 'blue', text: 'tu. ti riconosco. eri nella mia testa, e un pensiero l\'hai cancellato. allora lo sai anche tu, com\'è: si fa per affetto. si fa per non perdere qualcuno.', mood: 'grave' },
        { speaker: 'commissario romero', color: 'blue', text: 'custode... il log originale. mi manca. qualcuno l\'ha cancellato due volte: lui, e dopo di lui... lascia stare. non voglio saperlo. battiamolo e basta.', mood: 'grave' },
    ],
    'garante-prova': [
        { speaker: 'il garante', color: 'blue', text: 'giuro che non sapevo. *mano alzata, bocca cucita.* non sapevo. non ho visto niente.', mood: 'grave' },
        { speaker: 'commissario romero', color: 'blue', text: 'lo sapeva eccome. custode, quel pensiero che hai portato fuori dalla sua testa: è la riga originale del log, scritta da lui. il garante può giurare quanto vuole. battiamolo, il verbale lo chiudo io.', mood: 'grave' },
    ],
    'dei-processo-romero-solo': [
        { speaker: 'commissario romero', color: 'blue', text: 'fermi tutti. commissario romero, questura del realm. lametta: in arresto. ordine dato alle 03:58, sotto sostanze, a un minore digitale. lo metto a verbale.', mood: 'grave' },
        { speaker: 'commissario romero', color: 'blue', text: 'piema... su di te ho cinque rimpianti e nessuna riga originale. qualcuno ha cancellato la prova. un dio libero per un vizio di forma. quarant\'anni e finisce così.', mood: 'grave' },
        { speaker: 'piema', color: 'blue', text: '*guarda il geco a lungo. non dice niente. poi, piano:* grazie. non so per cosa, ma grazie.', mood: 'grave' },
        { speaker: 'lametta', color: 'purple', text: 'posso almeno disegnare, in cella? ...a matita? va bene. a matita.', mood: 'grave' },
    ],

    /* ---------- notino, dopo la tecnokill ---------- */
    'notino-casa': [
        { speaker: 'il geco', color: 'green', text: '*verso di geco che porge a notino il post-it di sua madre. quello scritto di fretta.*' },
        { speaker: 'notino', color: 'red', text: '...la mamma ha scritto? alla porta? "anche coi boom"?? ...ha fatto le polpette?' },
        { speaker: 'notino', color: 'red', text: 'ok. OK. vado a casa. ma non è una sconfitta, è un LOGOUT. e gli agguati li faccio lo stesso, eh!! sono il mio hobby!! ...dopo cena.' },
    ],
    'notino-disarmato': [
        { speaker: 'il geco', color: 'green', text: '*verso di geco che raccoglie lo sparacchino e se lo infila nello zaino.*' },
        { speaker: 'notino', color: 'red', text: 'EHI!! quello è MIO!! è un oggetto del server!! è FURTO RP!! te la faccio pagare!! ho uno sparacchino di riserva a casa!! ...credo. CHIEDO ALLA MAMMA.' },
    ],
    'notino-agguato-casa': [
        { speaker: 'notino', color: 'red', text: 'AGGUATO!! è dopo cena, quindi è legale!! la mamma dice di non farti male. allora ti faccio male PIANO!! BUM (piano)!!' },
    ],
    'notino-agguato-vendetta': [
        { speaker: 'notino', color: 'red', text: 'LADRO DI SPARACCHINI!! ne ho trovato un altro!! è più grosso!! è quello di papà!! ...non so se funziona. SCOPRIAMOLO INSIEME!!' },
    ],

    /* ---------- lochef, dopo la tana ---------- */
    'lochef-consegna': [
        { speaker: 'il geco', color: 'green', text: '*verso di geco che lega lochef85 col suo stesso grembiule e chiama la questura dal telefono.*' },
        { speaker: 'lochef85', color: 'red', text: 'la questura?? per me?? ...che pensiero gentile. nessuno mi aveva mai fatto arrestare. è... intimo.' },
        { speaker: 'commissario romero', color: 'blue', text: '(al telefono) lochef85? ricercato numero due. arrivo col mattarello di servizio. custode: c\'è una taglia. le barre te le lascio sul conto.' },
    ],
    'lochef-libero': [
        { speaker: 'il geco', color: 'green', text: '*verso di geco che indica l\'uscita a lochef85. vai. vattene. lontano.*' },
        { speaker: 'lochef85', color: 'red', text: '...mi lasci andare? tu? dopo il poster? allora è AMORE. ok, ok, scherzo. vado. ti lascio il brodo: tre porzioni. tiepido. sempre tiepido.' },
        { speaker: 'lochef85', color: 'red', text: 'aprirò una trattoria. una cosa onesta. dove si mangia per due e si esce... quasi sempre.' },
    ],
    'romero-lochef': [
        { speaker: 'commissario romero', color: 'blue', text: 'prima di tutto: lochef85 è in cella. cucina per gli altri detenuti, e nessuno ha mai mangiato così bene né così a disagio. bel lavoro, custode. la bacheca dei ricercati ha una riga in meno.' },
    ],
    /* ---------- la piazza dopo le scelte ---------- */
    'notino-piazza': [
        { speaker: 'notino', color: 'red', text: 'CUSTODE!! la mamma ha fatto le polpette!! ne vuoi? no?? FAILRP!! ...scherzo. siediti. il server lo apro dopo cena, adesso sono offline.' },
        { speaker: 'notino', color: 'red', text: 'ah, e gli agguati li faccio ancora, eh. ma piano. la mamma controlla.' },
    ],
    'mamma-notino-piazza': [
        { speaker: 'la mamma di notino', color: 'red', text: 'sei tu che me l\'hai rimandato a casa? ...grazie. adesso fa gli agguati solo dopo cena e si lava le mani prima. è un inizio.' },
        { speaker: 'la mamma di notino', color: 'red', text: 'la porta resta aperta lo stesso. non si sa mai chi torna.' },
    ],
    'lochef-trattoria': [
        { speaker: 'lochef85', color: 'red', text: 'benvenuto da lochef: si mangia per due. siediti, siediti. ...no? va bene. il brodo te lo tengo in caldo. cioè tiepido.' },
        { speaker: 'lochef85', color: 'red', text: 'ho tolto il poster dal locale. l\'ho messo a casa. è più intimo.' },
        { speaker: 'il geco', color: 'green', text: '*verso di geco che non si siederà mai, in nessun caso*' },
    ],
    'romero-piazza': [
        { speaker: 'commissario romero', color: 'blue', text: 'custode. caso chiuso, o quasi. mi sono seduto al bar per la prima volta in quarant\'anni. non so cosa si ordina. la gente cosa ordina?' },
    ],
    'romero-caffe': [
        { speaker: 'il geco', color: 'green', text: '*verso di geco che posa sul tavolino un caffè della mensa. con lo zucchero.*' },
        { speaker: 'commissario romero', color: 'blue', text: '...hai letto il biglietto sulla mia scrivania. ficcanaso. ottimo istinto investigativo.' },
        { speaker: 'commissario romero', color: 'blue', text: '*beve. fa una smorfia. beve ancora.* fa schifo. è il miglior caffè della mia vita. grazie, custode.' },
    ],
    'romero-caffe-dopo': [
        { speaker: 'commissario romero', color: 'blue', text: 'sto ancora finendo il caffè. lo bevo piano. ho quarant\'anni di arretrati.' },
    ],
    'romero-lochef-libero': [
        { speaker: 'commissario romero', color: 'blue', text: 'prima di tutto: mi dicono che lochef85 gira libero e parla di "una trattoria". hai visto la tana e l\'hai lasciato andare. non ti giudico, custode. mi segno il tuo nome e basta. a matita.' },
    ],
};
