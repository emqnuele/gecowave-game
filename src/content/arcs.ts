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

/** quattro note per regione, in ordine: si incontrano andando avanti */
export const REGION_NOTES: Record<string, Note[]> = {
    perduta: [
        { speaker: 'taccuino di herbert (TN), pag. 1', text: '«arrivato nel realm per misurare il cratere. diametro: 33. rimisurato: 33. il metro è nuovo. il cratere no.»' },
        { speaker: 'taccuino di herbert (TN), pag. 9', text: '«ho chiesto la strada a un geco. mi ha fissato senza rispondere. a trento ci fissano uguale: mi sento a casa.»' },
        { speaker: 'taccuino di herbert (TN), pag. 20', text: '«ogni misura fa 33. i gradini, le crepe, i giorni che sono qui. ho smesso di misurare il cratere. adesso misuro me. 33 anche io, a quanto pare.»' },
        { speaker: 'taccuino di herbert (TN), ultima pagina', text: '«trovata l\'uscita. non la prendo. qualcuno deve restare a dire quanto è grande il buco, quando arriveranno a ripararlo. — h.» una freccia, disegnata a matita, punta verso la targa sul bordo.' },
    ],
    bus: [
        { speaker: 'abbonamento plastificato', text: '«linea 14. titolare: il pendolare delle 7:39. arriva sempre un minuto prima del bus. al bus non è mai importato.»' },
        { speaker: 'biglietto nel portaoggetti', text: '«giro 212. ho imparato i nomi di tutti. samatt conta, guastalla dorme, io saluto. qualcuno deve salutare, se no un loop è solo un cerchio.»' },
        { speaker: 'scritta sul finestrino appannato', text: '«oggi è salito ivan. ha guardato il loop come si guarda un nemico personale. gli ho offerto una caramella. l\'ha tagliata in due con la mano. una metà a me.»' },
        { speaker: 'ultimo biglietto', text: '«sono sceso. non alla prossima: alla mia. non sapevo nemmeno di averne una. firmato: il pendolare delle 7:39. da oggi delle 7:41. con calma.»' },
    ],
    barrato: [
        { speaker: 'lettera mai spedita', text: '«cara margherita, il bus è fermo da tre giorni sotto la sabbia. l\'autista dice che ci tira fuori lui. ha una faccia che ci credi.»' },
        { speaker: 'lettera mai spedita', text: '«cara margherita, l\'autista si chiama ivan. stanotte ha provato a spingere il bus a mani nude. il bus non si è mosso. la sabbia sì, un pochino. abbiamo applaudito lo stesso.»' },
        { speaker: 'lettera mai spedita', text: '«cara margherita, ivan è uscito a cercare aiuto. ha detto: tornate tutti a casa, anche se non torno io. poi mi ha convalidato il biglietto. non so perché mi ha fatto piangere.»' },
        { speaker: 'ultima lettera', text: '«cara margherita, se qualcuno legge vuol dire che è sceso fin qui. digli che ivan non ci ha abbandonati. è che la linea era più grande di lui. e salutami i colori.»' },
    ],
    santuario: [
        { speaker: 'quaderno dell\'apprendista', text: '«primo giorno al santuario. breccio mi ha fatto rifare una linea retta 400 volte. alla 401 ha pianto. di gioia, credo. forse.»' },
        { speaker: 'quaderno dell\'apprendista', text: '«breccio dice che la simmetria è l\'unica cosa che lametta non può rompere. poi passa lametta e rompe qualcosa. breccio ridipinge. così, da secoli.»' },
        { speaker: 'quaderno dell\'apprendista', text: '«stanotte ho visto lametta ritrarre un ragazzino con gli occhi storti. breccio ha detto: "non è storto, è finito male". non ho capito la differenza. lui sì, e non ha dormito.»' },
        { speaker: 'quaderno dell\'apprendista, ultima pagina', text: '«me ne vado. ho fatto un disegno storto apposta e mi è piaciuto. breccio non me lo perdonerà. ma breccio non perdona nemmeno le nuvole.»' },
    ],
    tecnokill: [
        { speaker: 'post-it attaccato a un bidone', text: '«notino, la pasta è in tavola. se non torni la do al gatto. il gatto è dalla tua parte, sappilo. — mamma»' },
        { speaker: 'post-it sotto un sasso', text: '«notino, mi hanno detto che hai un server. bravo. che cos\'è un server? torna a spiegarmelo, ti faccio le polpette. — mamma»' },
        { speaker: 'post-it bruciacchiato', text: '«ho sentito i boom. ho sentito che li chiami tecnokill. anche papà faceva boom, prima di andarsene. non diventare papà. — mamma»' },
        { speaker: 'post-it nuovo, scritto di fretta', text: '«a chiunque trovi mio figlio: ditegli che la porta è aperta. sempre. anche coi boom. anche con la sabbia nelle scarpe. — la mamma di notino»' },
    ],
    trenbolone: [
        { speaker: 'registro dello stagista, giorno 1', text: '«compito: lavare le provette. le provette sono di trenbolone. le mani adesso sono molto muscolose. il resto di me no.»' },
        { speaker: 'registro dello stagista, giorno 30', text: '«il capo dice che il lotto speciale è "per lametta, che esagera". lametta viene di notte, col cappuccio. paga col pennello. il pennello vale più delle barre, dice il capo.»' },
        { speaker: 'registro dello stagista, giorno 41', text: '«stanotte lametta ha comprato una boccetta in più. ha detto: "domani mi libero di un pensiero". rideva. sullo scontrino c\'è scritto 03:58. ero io alla cassa.»' },
        { speaker: 'lettera di dimissioni', text: '«mi licenzio. ho capito cosa vendiamo: non è forza. è il permesso di non sentirsi in colpa. quindici barre a dose. troppo poco, per una cosa così grossa.»' },
    ],
    tana: [
        { speaker: 'graffio sul muro', text: '«ospite n.11. lochef dice che resto a cena. sono qui da quattro cene.»' },
        { speaker: 'graffio sul muro', text: '«ospite n.11. il brodo è tiepido. sempre. ho chiesto se lo fa apposta. ha detto "come piace a te". non mi piace.»' },
        { speaker: 'graffio dietro un vaso', text: '«ospite n.11. ho trovato un passaggio dietro il frigo. lo dirò al n.12 quando arriva. lochef dice che sarà un geco. ha già il poster.»' },
        { speaker: 'graffio fresco', text: '«ospite n.11. sono uscito. se stai leggendo sei il n.12: il passaggio dietro il frigo porta fuori. e non mangiare il dolce. CORRI.»' },
    ],
    rio: [
        { speaker: 'cartello del pescatore', text: '«pesca vietata. non per legge: per dignità.»' },
        { speaker: 'quaderno del pescatore', text: '«oggi: una scarpa, un abbonamento della tommasorveglianza, un pesce con tre occhi. il pesce l\'ho liberato. l\'abbonamento no: mi guarda.»' },
        { speaker: 'quaderno del pescatore', text: '«il fondale brillava. ci ho messo la mano e mi è passata l\'artrite. ho smesso di pescare e ho cominciato a pregare. con la canna, per abitudine.»' },
        { speaker: 'ultima pagina del pescatore', text: '«un geco ha preso la luce dal fondo. il fiume adesso è solo merdone. va bene così: le cose sacre non devono restare in fondo a un fiume. devono camminare.»' },
    ],
    stabilimento: [
        { speaker: 'biglietto di danjilo', text: '«smela, amore, ho riempito 400 damigiane. le ho chiamate tutte come te. adesso non so più quale sei tu.»' },
        { speaker: 'biglietto di danjilo', text: '«smela, amore, quello del rio voleva il rimborso. gli ho dato l\'acqua del rimborso. è la stessa. lui non se n\'è accorto. tu sì, e mi hai baciato.»' },
        { speaker: 'biglietto di danjilo', text: '«smela, ho letto la scritta sulla cisterna. "rio merdone tale e quale". lo sapevo. ti amo lo stesso. forse proprio per quello.»' },
        { speaker: 'biglietto di danjilo, piegato bene', text: '«se un giorno lo stabilimento chiude, apriamo un chiosco. acqua del rubinetto, scritto grande. la beviamo noi per primi, tutti e due. promesso? — d.»' },
    ],
    ruhra: [
        { speaker: 'permesso per il bagno', text: '«franceschini. uscita: ore 10:12, secondo parziale. rientro: —»' },
        { speaker: 'scritta in un bagno', text: '«sono franceschini. il bagno è infinito: ogni porta porta a un altro bagno. ho visto un integrale lavarsi le mani. non si è asciugato.»' },
        { speaker: 'scritta in un altro bagno', text: '«franceschini, giorno 40. ho dimostrato il teorema di piema sulla carta igienica. torna tutto. ma non ho nessuno a cui consegnarlo.»' },
        { speaker: 'rotolo di carta igienica, scritto fitto', text: '«q.e.d. — franceschini.» sotto, il timbro della ruhra: "consegnato fuori tempo massimo". e sotto ancora, con un\'altra penna: «corretto. 30 e lode. scusa il ritardo. — p.»' },
    ],
    mente: [
        { speaker: 'pensiero sciolto', text: '«regola uno: lametta non sbaglia, lametta esagera. regola due: quando lametta sbaglia, vedi regola uno.»' },
        { speaker: 'pensiero piegato in quattro', text: '«giorno 42. ho aperto il log. ho visto chi ha dato l\'ordine. ho chiuso il log. ho chiuso gli occhi. ho riaperto il teorema, che almeno è un problema mio.»' },
        { speaker: 'pensiero ripetuto così tante volte da essere diventato un muro', text: '«è il mio socio. è il mio socio. è il mio socio. è il mio socio. è il mio socio.»' },
        { speaker: 'pensiero minuscolo, sotto un integrale', text: '«se qualcuno entra qui dentro troverà il pensiero sepolto. spero che lo cancelli. spero che non lo cancelli. sono undici giorni che spero due cose.»' },
    ],
    caso: [
        { speaker: 'foto ingiallita', text: '«agente romero, primo giorno di servizio. 20 anni, 0 casi, 1 baffo.» il baffo è disegnato a penna.' },
        { speaker: 'verbale del 1984', text: '«il limite notevole è stato avvistato vicino alla ruhra. inseguito. tende a infinito. inseguimento sospeso per stanchezza dell\'agente. riprenderà domani. (firmato: romero, tutti i giorni dal 1984)»' },
        { speaker: 'richiesta di trasferimento, respinta dal richiedente', text: '«mi chiedete di lasciare il caso. no. qualcuno nel realm deve continuare a dire che le cose hanno un colpevole. anche quando il colpevole è un dio. soprattutto allora.»' },
        { speaker: 'biglietto sulla scrivania', text: '«a chi trova questo: se un giorno chiudo il caso, offritemi un caffè. se non lo chiudo, offritemelo lo stesso. con lo zucchero. — r.»' },
    ],
    sorveglianza: [
        { speaker: 'scheda cliente n.1', text: '«notino. motivo dell\'abbonamento: "vedere chi mi vede". stato: insolvente. note: ci vede lui per primo, sempre. non sappiamo come.»' },
        { speaker: 'scheda cliente n.2', text: '«lametta. motivo: "voglio sapere se pedro dorme". telecamere assegnate: una sola, puntata su pedro, giorni 1-42. il cliente guardava ogni notte.»' },
        { speaker: 'scheda cliente n.2, note', text: '«giorno 41, ore 03:58: il cliente ha spento di persona la telecamera di pedro. motivo dichiarato: "non voglio vedere". rimborso: negato.»' },
        { speaker: 'scheda cliente n.3, quasi tutta oscurata', text: '«abbonamento regalato da: p. — destinatario: "il geco del muro, in piazza". motivo: "così qualcuno lo guarda, se un giorno io non potrò". attivo dal giorno 30. mai disdetto.»' },
    ],
    cantina: [
        { speaker: 'lista della spesa di ticummi', text: '«fascette da elettricista (tante). un dio non si lega da solo. conserve. 0,09€ di resto, da incorniciare.»' },
        { speaker: 'appunto di ticummi', text: '«lametta piange nel sonno. dice "pedro, scusa". registrare? sì. vendere? no. certe cose non si vendono. si registrano e basta.»' },
        { speaker: 'appunto di ticummi', text: '«lametta mi ha chiesto se il trenbolone cancella un ricordo. ho detto che non funziona così. ha detto: "allora diluiscilo di meno".»' },
        { speaker: 'appunto di ticummi, scritto storto', text: '«stanotte l\'ho slegato per un\'ora. ha guardato il muro in silenzio. poi: "la cosa migliore che ho disegnato l\'ho rovinata io". l\'ho rilegato. avevo paura che andasse a fare qualcosa di giusto.»' },
    ],
    ricordi: [
        { speaker: 'backup, giorno 7', text: '«pedro impara a fare i nodi. lametta dice che non servono a niente. pedro li fa lo stesso. ne fa 33. li chiama "cose che tengono".»' },
        { speaker: 'backup, giorno 19', text: '«piema spiega a pedro i limiti. pedro chiede: "anche le persone hanno un limite?" piema non risponde. mette a verbale la domanda. il verbale non ha mai avuto risposta.»' },
        { speaker: 'backup, giorno 27', text: '«pedro sale sulla torre più alta del realm e guarda la piazza. annota: "un geco su un muro. sveglio. anche stanotte". poi scende di corsa.»' },
        { speaker: 'backup, giorno 40', text: '«pedro chiede a lametta: "cosa succede se divento storto?" lametta, distratto, col pennello in bocca: "ti raddrizzo io". non è mai successo.»' },
    ],
    void: [
        { speaker: 'rimpianto vagante', text: '«non ho mai detto a samatt che anche io contavo i giri. in silenzio. solo per fargli compagnia.» — guastalla' },
        { speaker: 'rimpianto vagante', text: '«potevo fermare il bus. avevo le chiavi in tasca. ho preferito il posto a sedere.» — un passeggero del 7:40' },
        { speaker: 'rimpianto vagante', text: '«ho lasciato la porta aperta, ma non sono mai uscita a cercarlo.» — la mamma di notino' },
        { speaker: 'rimpianto vagante', text: '«ho venduto a lametta la boccetta delle 03:58. era l\'ultima della notte. volevo solo chiudere la cassa.» — lo stagista' },
    ],
    nucleo: [
        { speaker: 'log di esecuzione', text: '«ordine "raddrizzare": 3% completato. elementi storti rimossi: un lampione, una nuvola, un geco anziano che leccava un muro (annullato: il geco anziano è scappato).»' },
        { speaker: 'log di esecuzione', text: '«eccezione: la cartella IMPORTANTE impedisce la cancellazione di 1 elemento. elemento: "il muro della piazza". riprovare.»' },
        { speaker: 'log di esecuzione', text: '«riprovato 33 volte. il muro della piazza resta. motivo: ignoto. priorità: alta. sentimento: ???»' },
        { speaker: 'log di esecuzione', text: '«custode in arrivo. confronto con l\'archivio: corrispondenza 99%. con cosa? la cartella non risponde. la cartella non risponde mai quando serve.»' },
    ],
    custode: [
        { speaker: 'testo a matita', text: '«prima strofa: ho preso le wave. seconda strofa: le ho ridate. ritornello: nessuno se lo ricorda.»' },
        { speaker: 'nota di produzione', text: '«basso troppo alto. voce troppo bassa. vita bilanciata male. rifare il mix. rifare anche la vita, se avanza tempo.»' },
        { speaker: 'copertina scartata', text: '«ho chiesto a lametta la copertina. ha disegnato un geco storto. era bellissima. l\'ho buttata perché era storta. errore.»' },
        { speaker: 'ultima traccia, lasciata sul mixer', text: '«per il prossimo: suona a tempo. e quando ti chiederanno le wave, prima di rispondere chiediti a chi servono davvero.»' },
    ],
    galliate: [
        { speaker: 'scritta su un motorino', text: '«il primo che tocca il mio motorino lo... lo... vabbè, toccalo. ma con rispetto.»' },
        { speaker: 'diario di un maranza', text: '«oggi ho guardato male uno. lui ha guardato male me. ci siamo guardati male per un\'ora. adesso siamo amici.»' },
        { speaker: 'diario di un maranza', text: '«guggu ci pagava il biglietto per andare a scuola, in bus. diceva: "la scuola è una linea che porta lontano". non ho capito ma ci vado.»' },
        { speaker: 'diario di un maranza, ultima pagina', text: '«guggu non torna più. qualcuno l\'ha battuto. spero almeno che chi è stato abbia preso la patente. e che qualcuno gli abbia detto chi era guggu.»' },
    ],
    marcetti: [
        { speaker: 'scheda quiz della patente', text: '«domanda 1: in caso di nebbia, cosa fa walter? risposta esatta: dorme.»' },
        { speaker: 'scheda quiz della patente', text: '«domanda 7: chi paga le guide? risposta esatta: guggu. risposta sbagliata: walter. risposta che ti boccia: "lo stato".»' },
        { speaker: 'busta paga di anna', text: '«pagato da: g. guggu. causale: "perché qualcuno deve".»' },
        { speaker: 'scheda quiz, domanda bonus', text: '«domanda 33: chi ti ha mandato qui? se rispondi "walter", bocciato. se rispondi "me stesso", promosso. se non rispondi, sei già in macchina con lui.»' },
    ],
};

/** dove sono le pagine strappate del quaderno di pedro, una per regione, in ordine */
export const PAGE_REGIONS = ['bus', 'santuario', 'rio', 'ruhra', 'ricordi'] as const;

const PAGES: string[] = [
    '«giorno 3. ho scoperto i bus. girano in tondo e la gente sopra ride lo stesso. stasera in piazza, su un muro, c\'era un geco. gli ho detto ciao. non ha risposto. i gechi non rispondono. è stata la conversazione migliore della giornata.»',
    '«giorno 12. lametta mi ha fatto un ritratto. ci sono venuto bene, dice. stasera il geco del muro c\'era di nuovo e gliel\'ho raccontato. ha fatto un verso. credo fosse un complimento. ho deciso che è mio amico.»',
    '«giorno 24. ho chiesto alla wave come si protegge qualcuno. ha detto: scegli. ho scelto. se un giorno mi succede qualcosa, la wave deve andare a chi è sveglio su quel muro alle quattro del mattino. l\'ho scritto nel codice, in un commento. nessuno legge i commenti.»',
    '«giorno 38. lametta beve sempre di più. piema scrive sempre di più. io prendo appunti. stasera ho detto al geco: "se un giorno divento storto, raddrizzami tu". ha fatto il verso. lo prendo per un sì.»',
    '«giorno 41, sera. domani devo fare una cosa che lametta mi ha chiesto. non mi piace come suona. strappo queste pagine, così nessuno sa chi ho scelto e nessuno gli fa del male. ma se le stai leggendo tutte: il custode non l\'ha scelto la wave. l\'ho scelto io. — p.»',
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
        { speaker: 'il geco', color: 'green', text: '*cinque pagine. le metti in fila sul pavimento, col nastro adesivo dello zaino. la calligrafia è pulita, quella di prima del glitch.*', mood: 'grave' },
        { speaker: 'il geco', color: 'green', text: '*il muro della piazza. le quattro del mattino. i "ciao" a cui non rispondevi. eri tu. sei sempre stato tu.*', mood: 'grave' },
        { speaker: 'il geco', color: 'green', text: '*la wave non ti ha scelto perché eri l\'unico sveglio a quell\'ora. ti ha scelto perché qualcuno gliel\'aveva chiesto.*', mood: 'grave' },
    ],
    'pedro-quaderno': [
        { speaker: 'il geco', color: 'green', text: '*verso di geco che tira fuori cinque pagine strappate, ricomposte col nastro adesivo. le tiene in alto, verso di lui.*', mood: 'grave' },
        { speaker: 'pedro', color: 'cyan', text: 'il mio q̸u̵a̶d̷e̸r̵n̶o̷. le pagine che ho strappato io, il giorno 41, perché nessuno sapesse c̸h̵i̶ avevo scelto.', mood: 'grave' },
        { speaker: 'pedro', color: 'cyan', text: 'il muro. le q̸u̵a̶t̷t̸r̵o̶. sei tu. il geco del muro. ti avevo chiesto di raddrizzarmi se fossi diventato storto. e sei v̷e̸n̵u̶t̷o̸.', mood: 'grave' },
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
