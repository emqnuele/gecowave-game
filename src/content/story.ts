import type { AbilityId, DialogueLine } from '../types';

/* la voce del realm: minuscolo, demenziale, mai tecnico.
   pedro parla glitchato, riba coi refusi, piema corretto da professore. */

export const INTRO_CARDS: { text: string; punch?: string }[] = [
    {
        text: 'c\'era la GECOWAVE: la cosa luminosa che teneva insieme il gecorealm. tipo il wi-fi, ma cosmico.',
    },
    {
        text: 'lametta creò pedro a sua immagine e somglianza. pedro si glitchò, sfidò gli dei, e la wave esplose in frammenti.',
    },
    {
        text: 'lametta sprofondò nella dipendenza da trenbolone, piema sparì verso la ruhra. e il realm cominciò a collassare.',
    },
    {
        text: 'la wave, morendo, scelse un custode per raccogliere i suoi frammenti.',
        punch: 'scelse un geco. era l\'unico sveglio a quell\'ora.',
    },
];

export const DEATH_PUNCHLINES = [
    'il flop è parte del processo',
    'anche questa la tagliamo dal disco',
    'morire è gratis, ricominciare pure',
    'pedro ride, da qualche parte. glitchato.',
    'il realm collassa con più dignità di te',
    'riprova. la wave crede in te. più o meno.',
    'nemmeno il trenbolone ti avrebbe salvato',
    'la tommasorveglianza ha registrato tutto. 👍',
    'samatt ha visto morti migliori, e lui sta su un bus',
    'lametta lo disegnerà. il tuo flop, intende.',
    'guastalla ha smesso di contare pure le tue morti',
    'fail rp. respawna e fai finta di niente.',
];

export const DIALOGUES: Record<string, DialogueLine[]> = {
    /* ---------- capitolo 1: la wave perduta ---------- */
    'markolino-intro': [
        { speaker: 'markolino', color: 'green', text: 'oh. oh! sei sveglio. senti, non c\'è tempo: pedro è abbandonato a sé stesso, piema è sparito e lametta sembra impazzito. sono l\'unico che se n\'è accorto, ovviamente.' },
        { speaker: 'markolino', color: 'green', text: 'la gecowave è in frammenti. e tu sei il custode provvisorio. lo so, anche io mi aspettavo di meglio.' },
        { speaker: 'markolino', color: 'green', text: 'le basi: A e D per muoverti, SPAZIO per saltare. J o il mouse per menare. tre colpi di fila fanno una combo: il terzo spacca.' },
        { speaker: 'markolino', color: 'green', text: 'ogni colpo carica il flow. tieni premuto Q e il flow diventa vita. i microfoni salvano: premi E lì vicino, tipo bonfire ma più rap.' },
        { speaker: 'markolino', color: 'green', text: 'se muori lasci le barre a terra. torna a riprendertele prima di rimorire, regola del realm, non l\'ho scritta io.' },
        { speaker: 'markolino', color: 'green', text: 'il realm si è sbriciolato in un labirinto di stanze: sopra, sotto, dietro i muri. se proprio ti perdi, nel telefono c\'è la modalità assistita: una freccia ti indica la strada. comoda. ma i trofei, a chi bara, non li dà nessuno.' },
        { speaker: 'markolino', color: 'green', text: 'TAB apre il telefono: mappa, zaino, messaggi. la mappa si disegna solo dove sei passato, quindi esplora. i muri con le crepe si rompono, quelli che sembrano strani... a volte non ci sono.' },
        { speaker: 'markolino', color: 'green', text: 'trova i frammenti. ferma pedro. e se vedi un bus... corri.' },
    ],
    'markolino-dono': [
        { speaker: 'markolino', color: 'green', text: 'aspetta. ho trovato questo nei rottami: un frammento della wave. la wave manifesta il tuo desiderio, e a quanto pare tu desideri... scappare velocemente. fa niente, prendilo.' },
    ],
    'lore-gecorealm': [
        { speaker: 'graffito sul muro', color: 'purple', text: '«il gecorealm fu creato da piema e lametta in sei giorni. il settimo uscì il primo bus dimensionale e da allora niente è più stato in orario.»' },
    ],
    'lore-scontro': [
        { speaker: 'cratere fumante', color: 'green', text: '«qui il cielo si è spaccato. ai lati si vedono ancora gli attacchi: pennellate viola, teoremi bianchi, scatti ciano. tre stili riconoscibilissimi. tre ego enormi.»' },
    ],
    'lore-videcoding': [
        { speaker: 'terminale abbandonato', color: 'cyan', text: '«ultimo log: "claudio porc*** mi fai una pompa?"»' },
    ],
    'lore-maschera': [
        { speaker: 'maschera appesa', color: 'green', text: '«una maschera con la mia stessa faccia. perfetta. ritmica. chi la indossa sente un beat lontano e il bisogno urgente di pubblicare un disco.»' },
    ],
    'geco-anziano': [
        { speaker: 'geco anziano', color: 'green', text: 'un altro custode, eh. ne ho visti passare tanti. tutti di fretta, tutti dietro a una freccia. nessuno che si fermi a leccare un muro in compagnia.' },
        { speaker: 'geco anziano', color: 'green', text: 'un consiglio gratis: certi muri sono più finti di altri. e certi si rompono, se li convinci col terzo colpo della combo.' },
        { speaker: 'il geco', color: 'green', text: '*verso di geco che prende appunti*' },
    ],
    'markolino-fretta': [
        { speaker: 'markolino', color: 'green', text: 'ancora qui?? il realm COLLASSA. con calma eh, ma collassa. muoviti che più avanti c\'è gente messa peggio di te.' },
    ],
    'lore-cratere': [
        { speaker: 'bordo del cratere', color: 'green', text: '«epicentro dello scontro. qui la wave ha toccato terra per l\'ultima volta intera. cratere perfettamente circolare, diametro 33: piema dice "ovvio", lametta dice "prego". una targa arrugginita sul bordo: "Herbert, (TN), era qui".»' },
    ],
    'lore-scale': [
        { speaker: 'gradino numerato', color: 'green', text: '«le scale del collasso: 847 gradini, uno per ogni giro di samatt. nessuno sa chi le abbia contate. tutti sanno chi le avrebbe contate.»' },
    ],
    'lore-deposito': [
        { speaker: 'registro del deposito', color: 'yellow', text: '«deposito citelis notturno. regolamento: i bus dormono in piedi, i pendolari dove capita. vietato svegliare il 7:40: morde anche da fermo.»' },
    ],
    'lore-capolinea': [
        { speaker: 'cartello del capolinea', color: 'yellow', text: '«capolinea fantasma: qui i loop venivano a morire, prima che guggu li rendesse eterni. se aspetti abbastanza, passa un bus che non esiste. sul vetro, inciso a chiave: "Claudio è sceso qui e non è più risalito". non salirci.»' },
    ],
    'lore-futuri': [
        { speaker: 'cornice vuota', color: 'purple', text: '«galleria dei futuri possibili: 99 specchi. in uno diventi dio, in uno resti geco, in 97 fai una figuraccia. la statistica del realm è spietata.»' },
    ],
    'lore-laboratorio-colori': [
        { speaker: 'barattolo etichettato', color: 'purple', text: '«laboratorio dei colori di lametta. scaffale a: rabbia (rosso). scaffale b: malinconia (viola). scaffale c: trenbolone (lo usa come un colore). scaffale d, chiuso a chiave: "Margherita" — una tinta che lametta non ha mai mostrato a nessuno.»' },
    ],
    'lore-radio': [
        { speaker: 'torre radio', color: 'red', text: '«da qui notino trasmette il suo server 24 ore su 24. frequenza: tutte, tranne i 33 MHz — occupati da una vecchia Radio Pico che nessuno riesce a spegnere. contenuto: "BUM". ascolti certificati: 1 (sua madre, per controllarlo).»' },
    ],
    'lore-dune': [
        { speaker: 'palo sepolto', color: 'red', text: '«sotto queste dune c\'è una linea intera di citelis: la 14 barrato. guggu la cerca ancora. le dune non restituiscono niente, nemmeno i mezzi pubblici.»' },
    ],
    'lore-mercato': [
        { speaker: 'insegna del mercato', color: 'orange', text: '«mercato delle pulci del rio: si vende di tutto, si garantisce niente. il banco di smela è quello con la fila di clienti che tornano. non per ricomprare: per discutere.»' },
    ],
    'lore-gola': [
        { speaker: 'incisione nella roccia', color: 'orange', text: '«gola del merdone. i pellegrini la attraversavano in ginocchio per umiltà. poi hanno visto le spine e hanno ricominciato a camminare come gente normale.»' },
    ],
    'lore-mensa': [
        { speaker: 'menù della mensa', color: 'blue', text: '«mensa della ruhra, menù del giorno: primo: integrali al sugo. secondo: derivata di pollo. dolce: pi greco. il cuoco è laureato, il cibo no.»' },
    ],
    'lore-archivi': [
        { speaker: 'archivio sotterraneo', color: 'blue', text: '«archivi della ruhra: ogni esame mai consegnato, in ordine alfabetico di scusa. la sezione "mi si è glitchato il cane" occupa tre corridoi.»' },
    ],
    'studente-mensa': [
        { speaker: 'studente in fila', color: 'blue', text: 'la fila per la mensa non si è mossa da quando piema è impazzito. ormai ci viviamo, in fila. abbiamo eletto un rappresentante. è il terzo. i primi due hanno mollato per fame.' },
    ],
    'bimbo-rp-2': [
        { speaker: 'bimbo del server', color: 'red', text: 'ehi, ancora tu! aggiornamento regole: notino ha aggiunto la 5: "vietato sopravvivere agli agguati". tu l\'hai già infranta tipo tante volte. sei una LEGGENDA del server.' },
        { speaker: 'bimbo del server', color: 'red', text: 'se lo rivedi non dirgli dove sto. mi sono ritirato dal roleplay. faccio il neutrale. tipo la svizzera, ma con più sabbia.' },
    ],
    'lore-clienti': [
        { speaker: 'parete dei clienti', color: 'cyan', text: '«clienti attivi della tommasorveglianza: 3. schermi dedicati: 47.000. rapporto qualità prezzo: dipende da che lato dello schermo stai.»' },
    ],
    'lore-addestramento': [
        { speaker: 'sala di addestramento', color: 'cyan', text: '«qui l\'ombra ha provato il tuo salto 12.000 volte. il registro segna un solo commento, ripetuto ogni notte: "perché si cura sempre all\'ultimo? PERCHÉ?"»' },
    ],
    'lore-ricetta': [
        { speaker: 'ricettario unto', color: 'cyan', text: '«trenbolone artigianale di ticummi: ingredienti segreti, procedimento segreto, effetti notissimi. nota a margine: "diluire per lametta, che esagera".»' },
    ],
    'filippus-dodo': [
        { speaker: 'filippus il dodo', color: 'blue', text: '...oh. un ospite. nel caveau. di solito qui non arriva nessuno, a parte i ragni e i sensi di colpa di ticummi. io sono FILIPPUS IL DODO. piacere.' },
        { speaker: 'filippus il dodo', color: 'blue', text: 'sì, lo so: "un dodo dovrebbe essere estinto". e infatti lo ero. poi ho iniziato a tirare 40000 kg di panca piana e l\'estinzione ha fatto un passo indietro. la natura rispetta i numeri grossi.' },
        { speaker: 'filippus il dodo', color: 'blue', text: 'ticummi è una lumaca di merda. io sono molto meglio. scrivo il codice col mignolo. mentre mi alleno con l\'altro braccio.' },
        { speaker: 'filippus il dodo', color: 'blue', text: 'visto che sei arrivato fin qui, e visto che hai le spalle strette (offesa), tieni: un piccolo dono. e ricordati la regola d\'oro: il leg day non si salta. MAI. nemmeno col double jump. (io posso)' },
        { speaker: 'il geco', color: 'green', text: '*verso di geco che giura solennemente di allenare le gambe*' },
    ],
    'lore-caveau': [
        { speaker: 'porta del caveau', color: 'cyan', text: '«caveau degli 0,09: qui ticummi conserva ogni singolo pagamento mai ricevuto, incorniciato. il totale fa 0,27€. il caveau è costato 40.000 barre.»' },
    ],
    'lore-ultimo': [
        { speaker: 'frammento di codice', color: 'cyan', text: '«ultimo miglio del realm: da qui in poi i poligoni sono dispari, la gravità è interpretativa e i salvataggi pregano pure loro. buona fortuna. — il compilatore»' },
    ],

    /* ---------- capitolo 2: l'invasione dei bus ---------- */
    'ivan-incontro': [
        { speaker: 'ivan maggini', color: 'yellow', text: '...un custode? mh. guggu ha perso il controllo dei bus. samatt e guastalla sono intrappolati nei loop dei citelis da settimane. girano. girano e basta.' },
        { speaker: 'ivan maggini', color: 'yellow', text: 'io sono l\'unico che può viaggiare nel caos di guggu. e la mia furia è l\'unica cosa che lo può tagliare. è pieno, sai. pieno come un citelis delle 7:40.' },
        { speaker: 'ivan maggini', color: 'yellow', text: 'va bene, custode. hai la mia lama. vai da guggu: io colpisco quando serve. non ringraziarmi, è una cosa mia.' },
    ],
    'guggu-intro': [
        { speaker: 'guggu', color: 'yellow', text: 'BIP. PORTE IN CHIUSURA. tu non hai convalidato, piccolo custode. e qui chi non convalida... GIRA PER SEMPRE.' },
        { speaker: 'il geco', color: 'green', text: '*verso di geco che ha convalidato, giuro*' },
    ],
    'guggu-senza-ivan': [
        { speaker: 'guggu', color: 'yellow', text: 'AH. AH. AH. le tue armi non mi fanno niente: sono PIENO. torna con qualcuno che sappia tagliare, se lo trovi. BIP.' },
    ],
    'ivan-sacrificio': [
        { speaker: 'ivan maggini', color: 'yellow', text: '...cazzo, custode... è troppo pieno. mi ha travolto...' },
        { speaker: 'ivan maggini', color: 'yellow', text: 'la mia corsa finisce qui. ma la sua barriera... la sua barriera è andata. lo scudo è infranto.' },
        { speaker: 'ivan maggini', color: 'yellow', text: 'tocca a te. finisci questa corsa, batti guggu e prendi il frammento.' },
        { speaker: 'ivan maggini', color: 'yellow', text: 'salva il realm. e di\' a samatt che il loop... prima o poi finisce.' },
    ],
    'lore-loop': [
        { speaker: 'avviso alla fermata', color: 'yellow', text: '«samatt e guastalla sono passati di qui 847 volte. guastalla ha smesso di contare alla 300. samatt no. samatt conta ancora.»' },
    ],
    'samatt-loop': [
        { speaker: 'samatt', color: 'yellow', text: '848. ah, ciao. no, non posso scendere: le porte si aprono solo in un punto del loop e quel punto non esiste. ci ho fatto pace al giro 500.' },
        { speaker: 'samatt', color: 'yellow', text: 'guastalla è due fermate più avanti. fisicamente. mentalmente non saprei, ha smesso di rispondermi al giro 300.' },
        { speaker: 'samatt', color: 'yellow', text: 'se trovi ivan maggini digli che il citelis delle 7:40 è pieno. lui capisce. e... 849. scusa, devo contare.' },
    ],
    'guastalla-loop': [
        { speaker: 'guastalla', color: 'yellow', text: '...' },
        { speaker: 'guastalla', color: 'yellow', text: '...il loop è caldo. il loop è casa.' },
        { speaker: 'il geco', color: 'green', text: '*verso di geco preoccupato*' },
        { speaker: 'guastalla', color: 'yellow', text: 'se vinci tu, scendo alla prossima. se vince guggu, almeno il posto a sedere ce l\'ho.' },
    ],
    'samatt-libero': [
        { speaker: 'samatt', color: 'yellow', text: 'il bus... si è fermato. SI È FERMATO. sai da quanto aspettavo di dirlo? "scendo alla prossima"? ecco. QUESTA è la prossima.' },
        { speaker: 'samatt', color: 'yellow', text: 'ivan aveva ragione su tutto. di\' in giro che samatt è tornato. e che ha contato fino a 851. nessuno conta fino a 851.' },
    ],
    'lore-orari': [
        { speaker: 'tabellone orari', color: 'yellow', text: '«prossimo passaggio: adesso. quello dopo: sempre. il citelis non arriva, il citelis È. — la direzione (guggu)»' },
    ],
    'lore-convalida': [
        { speaker: 'macchinetta rotta', color: 'yellow', text: '«CONVALIDARE. CONVALIDARE. chi non convalida gira per sempre. chi convalida pure, ma con la coscienza a posto.»' },
    ],

    /* ---------- capitolo 3: il santuario polarizzante ---------- */
    'breccio-intro': [
        { speaker: 'breccio', color: 'purple', text: 'fermo. fermo lì. questa parete l\'ho appena finita. tu sei... storto. sei tutto storto. il dio del disegno non tollera le cose storte.' },
        { speaker: 'breccio', color: 'purple', text: 'ti raddrizzo io. con il pennello. e con le lamette. mettiti in posa.' },
    ],
    'breccio-morte': [
        { speaker: 'breccio', color: 'purple', text: '...no. no no no. la crepa... è ASIMMETRICA...' },
    ],
    'lametta-incontro': [
        { speaker: 'lametta', color: 'purple', text: 'oh. il custode. sei arrivato fin nel mio santuario per il frammento. che coraggio. che POSA. ferma così, è perfetta.' },
        { speaker: 'lametta', color: 'purple', text: 'lo sai come finisce, vero? mi vieni addosso, meni, esulti. è il copione. fanno tutti così. fai pure: vediamo quanto reggi sotto i miei pennelli.' },
        { speaker: 'lametta', color: 'purple', text: 'avanti, piccolo. dimostrami che vali il frammento. COLPISCImi. il dio del disegno aspetta.' },
    ],
    'lametta-uscita': [
        { speaker: 'lametta', color: 'purple', text: 'mh. sei uscito dal disegno. interessante. nessuna tela l\'aveva mai fatto. ci rivediamo alla fine, custode. porta colori.' },
    ],
    'lore-vavleeh': [
        { speaker: 'specchio incrinato', color: 'purple', text: '«qui si riflesse per l\'ultima volta vavleeh. lo specchio lo ricorda. il realm no.»' },
    ],
    'lore-figma': [
        { speaker: 'incisione perfetta', color: 'purple', text: '«una sola lettera, incisa con precisione divina: f. sotto, più piccolo: "di figma". nessuno sa cosa significhi. lametta ride quando glielo chiedono.»' },
    ],
    'lore-asimmetria': [
        { speaker: 'parete di breccio', color: 'purple', text: '«334 affreschi identici. il 335° ha una pennellata fuori posto di 0,3 gradi. breccio ci ha pianto per tre giorni. poi ha rifatto tutti i 335.»' },
    ],
    'lore-polarizzazione': [
        { speaker: 'targhetta del santuario', color: 'purple', text: '«attenzione: la permanenza prolungata nel labirinto polarizza. i polarizzati diventano polvere. la polvere diventa colore. il colore diventa arte. quindi tecnicamente è un upgrade.»' },
    ],

    /* ---------- capitolo 4: notino e la tecnokill ---------- */
    'notino-intro': [
        { speaker: 'notino', color: 'red', text: 'TECNOKILL!! TECNOKILL!! ehi! EHI! NON DOVRESTI ESSERE QUI! è FAILRP! il frammento dice che posso spararti! BUM BUM TECNOKILL!!!' },
        { speaker: 'notino', color: 'red', text: 'QUESTO È IL MIO GIOCO SPARACCHINO!!! TI AMMAZZO MA TIPO TUTTO!!!' },
        { speaker: 'il geco', color: 'green', text: '*verso di geco che avrebbe preferito il dialogo*' },
    ],
    'notino-sconfitto': [
        { speaker: 'notino', color: 'red', text: 'non... non era un gioco? io volevo solo sparare... per sempre...' },
        { speaker: 'notino', color: 'red', text: 'pedro mi aveva detto... che la tecnokill non finiva mai...' },
    ],
    'bimbo-rp': [
        { speaker: 'bimbo del server', color: 'red', text: 'shhh! sto nascosto. notino ha detto che il roleplay è SACRO e chi sgarra prende il ban. il ban qui è... boom. tipo per davvero.' },
        { speaker: 'bimbo del server', color: 'red', text: 'tu sei nuovo e non hai la skin del server. per lui è failrp camminare e basta. corri a zig zag, fidati, io sto vivo così da tre giorni.' },
    ],
    'lore-failrp': [
        { speaker: 'regolamento bruciato', color: 'red', text: '«regole del server di notino: 1. niente failrp. 2. niente metagaming. 3. notino spara a chi vuole. 4. la regola 3 non è failrp perché lo dice la regola 4.»' },
    ],
    'lore-spray': [
        { speaker: 'scritta spray', color: 'red', text: '«TECNOKILL 4 EVER» — sotto, in piccolo, con un\'altra bomboletta: «notino se leggi torna a casa che è pronto» — mamma di notino' },
    ],
    'lore-bus-rovesciato': [
        { speaker: 'bus rovesciato', color: 'red', text: '«uno dei citelis di guggu, finito qui chissà come. dentro c\'è ancora un pendolare che convalida. per abitudine. per rispetto.»' },
    ],

    /* ---------- capitolo 5: il trenbolone e il rio merdone ---------- */
    'ticummi-offerta': [
        { speaker: 'ticummi', color: 'blue', text: 'psst. ehi. tu. quello col trenbolone in circolo. ho visto tutto, io vedo sempre tutto. notino ti sta cercando per rubarti i frammenti.' },
        { speaker: 'ticummi', color: 'blue', text: 'per soli 133 barre ti attivo la TOMMASORVEGLIANZA: protezione totale da ogni pericolo esterno. assolutamente sicura. 👍 fidati, sto su una sedia volante.' },
    ],
    'spaccino-offerta': [
        { speaker: 'spaccino del rio', color: 'orange', text: 'ehi, geco. ti vedo smunto. ti serve la spinta. la forza vera.' },
        { speaker: 'spaccino del rio', color: 'orange', text: 'questa roba si chiama trenbolone. prima dose gratis. ti fa spaccare tutto. letteralmente. provola.' },
    ],
    'flauto-intro': [
        { speaker: 'flauto speroindio', color: 'orange', text: 'CHI VA LÀ?! *rutto* sono flauto speroindio, il guardiano delle bottiglie!' },
        { speaker: 'flauto speroindio', color: 'orange', text: 'nessuno passa di qui senza aver affrontato il potere della birra calda!' },
        { speaker: 'il geco', color: 'green', text: '*verso di geco che sente solo odore di luppolo scaduto*' },
    ],
    'flauto-fatto-rabbia': [
        { speaker: 'flauto speroindio', color: 'orange', text: 'CHI OSA VENDERE IL TRENBOLONE SENZA IL MIO PERMESSO?!' },
        { speaker: 'flauto speroindio', color: 'orange', text: 'E tu, piccolo geco insignificante... ti fai di roba mia alle mie spalle?! SEI NEI GUAI SERI!!!' },
    ],
    'flauto-sveglio-rabbia': [
        { speaker: 'flauto speroindio', color: 'orange', text: '*RUTTO CLAMOROSO* Chi ha osato svegliarmi dal mio sonno alcolico?!' },
        { speaker: 'flauto speroindio', color: 'orange', text: 'E non ti sei nemmeno fatto di trenbolone per rendere omaggio al mio risveglio?! PAGHERAI CON LA VITA!!!' },
    ],
    'flauto-sconfitto': [
        { speaker: 'flauto speroindio', color: 'orange', text: 'glug... glug... la mia riserva... è finita... vai pure, geco, ma attento al rio...' },
    ],
    'trenbo-addormentato': [
        { speaker: 'la tua coscienza', color: 'green', text: '*Il trenbolone pulsa violento nelle tue vene. I muscoli crescono, ma le forze ti abbandonano...*' },
        { speaker: 'la tua coscienza', color: 'green', text: '*La vista si appanna completamente. Sprofondi in un sonno profondo...*' },
    ],
    'tommaso-blocca': [
        { speaker: 'notino', color: 'red', text: 'ehehehe... ti ho preso!' },
        { speaker: 'tommasorveglianza', color: 'blue', text: 'MINACCIA RILEVATA: bambino armato in avvicinamento. respinto. la tommasorveglianza la ringrazia per la fiducia. 🫶' },
        { speaker: 'notino', color: 'red', text: 'EHI! FAILRP! QUESTO È METAGAMING! me ne vado ma NON è una sconfitta!!' },
    ],
    'tommaso-blocca-2': [
        { speaker: 'notino', color: 'red', text: 'ehehehe... stavolta non ti sfuggo!' },
        { speaker: 'tommasorveglianza', color: 'blue', text: 'MINACCIA RICORRENTE RILEVATA: sempre lui. respinto di nuovo. abbiamo aperto una pratica. la pratica si chiama "notino". 👍' },
        { speaker: 'notino', color: 'red', text: 'MA COME FA A VEDERMI SEMPRE?? ho pure la skin mimetica!! NON VALE!!' },
    ],
    'tommaso-blocca-3': [
        { speaker: 'notino', color: 'red', text: 'ehehehe... la terza è quella buona!' },
        { speaker: 'tommasorveglianza', color: 'blue', text: 'minaccia respinta in automatico. non l\'abbiamo nemmeno guardata. il sistema ormai lo riconosce dal rumore dei passi. 🫶' },
        { speaker: 'notino', color: 'red', text: '...ok. ok!! mi arrendo con l\'abbonato!! ma tu, tommasorveglianza, sappi che è FAIL RP ANCHE IL TUO!!' },
    ],
    'smela-offerta': [
        { speaker: 'smela', color: 'cyan', text: 'amico. amico mio. ti vedo provato. acqua della sorgente, imbottigliata da me personalmente: 15 barre. altro che bagno nel fiume, questa è PREMIUM.' },
    ],
    'smela-truffa': [
        { speaker: 'smela', color: 'cyan', text: 'ah sì, piccola nota: effetti collaterali tipo... aumento dello stato trenbolonico e l\'effetto smela III. niente di che. niente rimborsi.' },
    ],
    'rio-cura': [
        { speaker: 'il rio merdone', color: 'green', text: '*il fiume sacro ti accoglie. è esattamente come immaginavi dall\'odore. ma il trenbolone scivola via, e con lui tutti i malus.*' },
        { speaker: 'il rio merdone', color: 'green', text: '*sul fondale brilla qualcosa: era il frammento a rendere sacre queste acque. rigenerazione accelerata, dice la wave. il fiume te lo cede. il fiume non giudica.*' },
    ],
    /* ---------- lo stabilimento di smela ---------- */
    'smela-tour': [
        { speaker: 'smela', color: 'cyan', text: 'amico! AMICO! ma sei tu, quello del rio! che bello rivederti. vieni, vieni: ti porto a casa mia. è anche lo stabilimento, sai, vivo dove lavoro. è una scelta di vita.' },
        { speaker: 'smela', color: 'cyan', text: 'ti vedo ancora provato. acqua? offre la casa. la prima è gratis. la seconda pure. anzi: bevi e basta, dai. una sola sorsata. per me. che ti costa.' },
        { speaker: 'il geco', color: 'green', text: '*verso di geco che annusa la bottiglia e fa un passo indietro*' },
        { speaker: 'smela', color: 'cyan', text: 'no?? va bene, va bene. nessuna pressione. cammina pure verso casa, intanto. troverai dei miei ragazzi lungo la strada. magari a loro la compri, l\'acqua. INSISTI tu, eh.' },
    ],
    'venditore-acqua': [
        { speaker: 'venditore di smela', color: 'cyan', text: 'acqua di smela! acqua premium! una sorsata e ti cambia la giornata, garantito al limone (non c\'è il limone). la bevi? dai che la bevi. smela sarebbe così felice.' },
    ],
    'danjilo-intro': [
        { speaker: 'danjilo', color: 'cyan', text: 'ferma lì, lucertola. io sono danjilo. il fidanzato di smela. quello vero, non quelli che dice lei. e mi ha detto che giri per casa nostra senza bere la sua acqua.' },
        { speaker: 'danjilo', color: 'cyan', text: 'sai cosa significa rifiutare l\'acqua della mia donna? è una MANCANZA DI RISPETTO. ora o bevi, o ti faccio bere io. dalla damigiana. tutta.' },
        { speaker: 'il geco', color: 'green', text: '*verso di geco che non berrà un bel niente*' },
    ],
    'danjilo-sconfitto': [
        { speaker: 'danjilo', color: 'cyan', text: 'ahio... la damigiana... si è rotta... oh no, si è bagnata tutta la moquette di casa... smela mi ammazza...' },
        { speaker: 'danjilo', color: 'cyan', text: 'vai pure dentro, va. tanto da lei non esci. lei non si arrende mai. con me ci ha messo tre anni. e io avevo detto subito di sì.' },
    ],
    'smela-boss': [
        { speaker: 'smela', color: 'cyan', text: 'hai picchiato il mio danjilo. hai attraversato tutta casa mia. e ANCORA. ancora non hai bevuto. UNA. SORSATA.' },
        { speaker: 'smela', color: 'cyan', text: 'PERCHÉ NON VUOI BERE LA MIA ACQUA?? eh?? è BUONA! è SANA! fa benissimo! ti giuro che dopo stai... stai una FAVOLA. fidati di smela. apri la bocca e BEVI.' },
        { speaker: 'il geco', color: 'green', text: '*verso di geco che ha capito benissimo cosa succede se beve*' },
        { speaker: 'smela', color: 'cyan', text: 'e va bene. se non bevi con le buone... te la verso in gola con le cattive. SALUTE, amico.' },
    ],
    'smela-sconfitta': [
        { speaker: 'smela', color: 'cyan', text: 'no... no... ho perso... e tu... non hai bevuto NEANCHE UNA GOCCIA. dopo tutto quello che ho fatto per offrirtela...' },
        { speaker: 'smela', color: 'cyan', text: 'va bene. hai vinto. ti meriti la verità: quell\'acqua... non doveva curarti. doveva fermarti per sempre. ma adesso la wave la mette in mano a TE. versala pure a terra, contro di loro. che sappiano cosa si prova.' },
        { speaker: 'il geco', color: 'green', text: '*verso di geco che per la prima volta accetta un bicchiere da smela*' },
    ],
    'lore-stabilimento': [
        { speaker: 'targa aziendale', color: 'cyan', text: '«smela springs srl — "dona una nuova sete alla tua sete". fondata con 15 barre di capitale, tutte di un cliente che voleva il rimborso. certificazioni: nessuna. ambizioni: illimitate.»' },
    ],
    'lore-catena': [
        { speaker: 'manuale della catena', color: 'cyan', text: '«procedura di imbottigliamento: 1. prendere acqua. 2. non filtrarla (il sapore è identità aziendale). 3. etichetta PREMIUM. 4. se il cliente si lamenta, vendergli l\'effetto smela III come esperienza.»' },
    ],
    'lore-cisterna': [
        { speaker: 'cisterna numero 3', color: 'cyan', text: '«livello: pieno. contenuto: ufficialmente "essenza di sorgente". fornitura elettrica intestata a Enercoop SpA, utenza morosa da 33 mesi. scritta a pennarello sotto: "rio merdone tale e quale, non dirlo a nessuno — s."»' },
    ],
    'furgone-intro': [
        { speaker: 'smela', color: 'cyan', text: 'EHI! tu non sei del tour!! sei venuto a chiudere lo stabilimento, vero? lo sapevo. nessuno apprezza più la libera impresa.' },
        { speaker: 'smela', color: 'cyan', text: 'va bene. va benissimo. sali pure sul ring, amico: io salgo sul FURGONE. consegna espressa: TU, direttamente al creatore. senza rimborso.' },
    ],
    'furgone-sconfitto': [
        { speaker: 'smela', color: 'cyan', text: 'il furgone... il leasing... ma che è, una moda?? prima la sedia di ticummi ora il mio furgone...' },
        { speaker: 'smela', color: 'cyan', text: 'ok. ok!! chiudo lo stabilimento. mi reinvento. ho già un\'idea: TRENBOLONE ARTIGIANALE BIOLOGICO. no aspetta. aspetta!! era uno scherzo!! METTI GIÙ QUELLA SPADA!!' },
        { speaker: 'il geco', color: 'green', text: '*verso di geco che archivia la pratica*' },
    ],

    'lore-formiche': [
        { speaker: 'cartello rosicchiato', color: 'orange', text: '«villaggio di formica (FR). i visitatori sono pregati di non calpestare. le formiche non sono pregate di non attaccare.»' },
    ],
    'lore-formicaio': [
        { speaker: 'monumento del villaggio', color: 'orange', text: '«alla formica ignota, che morse un dio e visse. il dio era lametta. la formica è sindaco da allora. riceve solo su appuntamento, sottoterra, a ovest del villaggio.»' },
    ],
    'formicona-intro': [
        { speaker: 'la formicona', color: 'orange', text: 'CHI DISTURBA IL SINDACO. ah. un custode. lo sento dall\'odore: frammenti, trenbolone e cattive intenzioni.' },
        { speaker: 'la formicona', color: 'orange', text: 'io ho morso un dio, piccolo geco. UN DIO. tu quanti ne hai morsi? ecco. ordinanza comunale n.1: si esce dalla mia tana solo a morsi.' },
    ],
    'formicona-sconfitta': [
        { speaker: 'la formicona', color: 'orange', text: '...battuta. in casa mia. davanti ai miei elettori... va bene. il consiglio comunale ratificherà la sconfitta. prendilo, il cuore: era di un turista che non aveva prenotato.' },
        { speaker: 'la formicona', color: 'orange', text: 'e di\' a lametta che il conto del morso è ancora aperto.' },
    ],
    'lore-sindaco': [
        { speaker: 'albo comunale della tana', color: 'orange', text: '«delibere del sindaco formicona: 1. vietato calpestare. 2. vietato il trenbolone entro 50 metri dal formicaio. 3. il morso al dio lametta è patrimonio del villaggio. 4. niente rimborsi.»' },
    ],
    'lore-trenbolone': [
        { speaker: 'volantino unto', color: 'orange', text: '«TRENBOLONE: prima settimana gratis. seconda settimana doppia. terza settimana sei tu che paghi noi, ma non te ne accorgi. — approvato dal ministero del realm (non vero)»' },
    ],
    'lore-combo': [
        { speaker: 'pietra scolpita', color: 'orange', text: '«la combo migliore è vodka con disaronno. fidati di chi ha perso tutti i denti prima dei trent\'anni.»' },
    ],
    'lore-rio-storia': [
        { speaker: 'pietra del fiume', color: 'orange', text: '«il rio merdone non è sempre stato sacro. prima era solo merdone. poi ci è caduto dentro un frammento della wave e adesso è merdone CON proprietà curative. la natura trova un modo.»' },
    ],
    /* gli agguati di notino: senza la wave, ma con tanta voglia */
    'notino-agguato-1': [
        { speaker: 'notino', color: 'red', text: 'SORPRESA TECNOKILL!! pensavi di esserti liberato di me?? il frammento non ce l\'ho più ma LA MIRA SÌ!! BUM BUM!' },
    ],
    'notino-agguato-2': [
        { speaker: 'notino', color: 'red', text: 'RIECCOMI!! il respawn non è failrp se sei l\'admin!! e in questa zona l\'admin SONO IO!!' },
    ],
    'notino-agguato-3': [
        { speaker: 'notino', color: 'red', text: 'TI HO SEGUITO FINO ALL\'UNIVERSITÀ!! qui dentro nessuno può salvarti: sanno solo i teoremi!! SPARACCHINO TIME!!' },
    ],
    'notino-agguato-4': [
        { speaker: 'notino', color: 'red', text: 'ANCORA IO!! lo so cosa pensi: "ma quanto è fastidioso". TANTISSIMO!! è la mia build!! BUM!' },
    ],
    'notino-agguato-5': [
        { speaker: 'notino', color: 'red', text: 'ULTIMA OCCASIONE TECNOKILL!! stavolta ho portato... ME STESSO DI RISERVA!! in una cantina nessuno ti sente fare failrp!!' },
    ],
    'notino-agguato-6': [
        { speaker: 'notino', color: 'red', text: 'UNO STABILIMENTO?! perfetto!! gli agguati industriali sono i miei preferiti: rumore di fondo GRATIS!! BUM BUM CATENA DI MONTAGGIO!!' },
    ],
    'notino-tana': [
        { speaker: 'notino', color: 'red', text: 'TROVATO!! adesso ti... aspetta. aspetta aspetta. questa è... la tana di LOCHEF85??' },
        { speaker: 'notino', color: 'red', text: 'no no no NO. ci sono REGOLE anche nel failrp. qui non entro manco da admin. ciao. CIAO. scappo io per primo!!' },
        { speaker: 'il geco', color: 'green', text: '*verso di geco che per una volta è d\'accordo con notino*' },
    ],
    'notino-sorveglianza': [
        { speaker: 'notino', color: 'red', text: 'ULTIMO AGGUATO, GIURO!! stavolta nessuno può veder—' },
        { speaker: 'tommasorveglianza', color: 'cyan', text: 'VISTO. identificato, archiviato e respinto in 0,09 secondi. questo è territorio aziendale, piccolo utente non registrato. 👍' },
        { speaker: 'notino', color: 'red', text: 'MA IO NON HO NEMMENO L\'ABBONAMEN— ok!! ok. me ne vado. ma la recensione sarà PESSIMA!!' },
    ],

    /* ---------- capitolo 6: la ruhra e piema ---------- */
    'riba-intro': [
        { speaker: 'la riba', color: 'orange', text: 'CHI VA LA\'?? anzi no aspeta. chi va DOVE? io che dovevo fare qui?? vabe intanto ti atacco, poi mi ricordo perche.' },
    ],
    'riba-sconfitta': [
        { speaker: 'la riba', color: 'orange', text: 'ok ok mi aredo!! tieni sto coso, il dispositivo per entrare nela testa di piema. me l\'avevano dato per sorvegliarlo ma non so manco acenderlo.' },
    ],
    'piema-senza-dispositivo': [
        { speaker: 'piema', color: 'blue', text: 'CHI VA LÀ. fermo. FERMO. dichiara le tue ipotesi. nessuna?? allora sei INDECIDIBILE. e io agli indecidibili applico analisi 1. a bruciapelo.' },
        { speaker: 'piema', color: 'blue', text: 'shh. shhh. lo senti? il teorema. è ancora APERTO. undici giorni che lo dimostro e adesso è lui che dimostra ME. la mia testa non è più un posto: è un intorno. e tu non ci entri.' },
        { speaker: 'piema', color: 'blue', text: 'ci si entra solo col dispositivo. quello della RIBA. mi sorvegliava con quel coso, credeva non me ne accorgessi. vai a prenderglielo. o resta lì e TENDI A ZERO, per me è uguale.' },
        { speaker: 'il geco', color: 'green', text: '*verso di geco che non era preparato per questo parziale*' },
    ],
    'piema-folle': [
        { speaker: 'piema', color: 'blue', text: 'il custode! o un\'allucinazione con la coda. POCO IMPORTA: tutto converge dove dico io. no. NO. non converge niente, è questo il problema. NESSUNO CONVERGE PIÙ.' },
        { speaker: 'piema', color: 'blue', text: 'cos\'hai in mano. il... il dispositivo della riba. allora puoi ENTRARE. dentro c\'è il caos: porte che interrogano, pensieri che mordono, e LUI. il teorema che non chiudo da undici giorni.' },
        { speaker: 'piema', color: 'blue', text: 'rimetti in ordine, custode. chiudi il teorema. e ATTENTO: nella mia testa chi sbaglia una risposta non viene corretto. viene CANCELLATO. ah. AH AH. scusa. entra.' },
    ],
    // piema's mind dialogues
    'mente-ingresso': [
        { speaker: 'il dispositivo della riba', color: 'orange', text: '*bip. «colegamento stabilito: PIEMA — stato: insuficiente». il mondo si piega in assi cartesiani. sei dentro la sua testa.*' },
        { speaker: 'piema (ovunque)', color: 'blue', text: 'BENVENUTO NEL MIO ERRORE. le porte fanno domande a trabocchetto, i pensieri mordono, e in fondo c\'è il teorema. sbagli una risposta e la mia testa ti cancella. senza appello. senza cfu.' },
    ],
    'pensiero-aperto': [
        { speaker: 'pensiero che galleggia', color: 'blue', text: '«giorno undici. il teorema è ancora aperto. forse sono io a essere chiuso. nota: comprare il latte. nota alla nota: il latte non esiste nel realm. CHI HA SCRITTO QUESTA NOTA.»' },
    ],
    'pensiero-convinzioni': [
        { speaker: 'pensiero portante', color: 'blue', text: '«certi muri di questa testa sono solo convinzioni. le convinzioni sembrano solide finché qualcuno non ci cammina attraverso. — p., a se stesso, senza ascoltarsi»' },
    ],
    'pensiero-fragile': [
        { speaker: 'pensiero incrinato', color: 'blue', text: '«i dubbi si spaccano col terzo colpo, come tutto il resto. sotto certi dubbi c\'è il vuoto. dentro certi vuoti, roba mia. non toccare. o tocca: sono un pensiero, non un vigile.»' },
    ],
    'pensiero-chiuso': [
        { speaker: 'ultimo pensiero lucido', color: 'blue', text: '«se leggi questo sei arrivato in fondo. il teorema è oltre. digli che mi dispiace: volevo solo dimostrarlo, non dargli una personalità. — p.»' },
    ],
    'teorema-intro': [
        { speaker: 'il teorema incompiuto', color: 'blue', text: 'TU. undici giorni che piema mi gira intorno, e adesso manda UN GECO? io sono l\'enunciato che non si chiude. ogni volta che mi dimostra, io DIVERGO.' },
        { speaker: 'il teorema incompiuto', color: 'blue', text: 'questa testa ormai è MIA. dimostrami, se ci riesci. q.e.d. — quod erat DEMOLENDUM.' },
    ],
    'mente-ordine': [
        { speaker: 'piema (ovunque)', color: 'blue', text: 'si è... chiuso. IL TEOREMA SI È CHIUSO. sento i pensieri rimettersi in fila per indice analitico. ordine. finalmente ORDINE.' },
        { speaker: 'piema (ovunque)', color: 'blue', text: 'custode, prendi: il frammento del calcolo. galleggiava tra i miei pensieri sbagliati. le leggi matematiche come arma. usale meglio di come le ho usate io.' },
        { speaker: 'piema (ovunque)', color: 'blue', text: 'ti apro l\'uscita. io vado a cercare lametta. e... occhio a pedro: l\'ho visto dai miei pensieri rotti. non è più solo glitch, ormai. ha dei piani.' },
    ],
    'lore-romero': [
        { speaker: 'targa della ruhra', color: 'blue', text: '«aula intitolata al commissario romero, che indagò per anni sul caso analisi 1. il caso è ancora aperto. il commissario pure, dicono.»' },
    ],
    'romero-indagine': [
        { speaker: 'commissario romero', color: 'blue', text: 'fermo lì. domande di routine. dov\'eri quando la wave è esplosa? "a dormire su un muro"? mh. combacia. purtroppo combacia sempre.' },
        { speaker: 'commissario romero', color: 'blue', text: 'indago sul caso analisi 1 da prima che esistesse analisi 1. il colpevole è sempre lo stesso: il limite notevole. ma non riesco a notificarglielo, capisci? tende a infinito.' },
        { speaker: 'commissario romero', color: 'blue', text: 'se vedi piema digli che il fascicolo è pronto. e che mi deve ancora 6 cfu.' },
    ],
    'studente-accovacciato': [
        { speaker: 'studente della ruhra', color: 'blue', text: 'shh! stai giù! piema è impazzito e gli integrali volano BASSI. franceschini si è alzato per andare in bagno al secondo parziale. non l\'abbiamo più visto.' },
        { speaker: 'studente della ruhra', color: 'blue', text: 'sopravvivenza alla ruhra, regola uno: se non sai la risposta, accovacciati. funziona con gli esami e coi proiettili.' },
    ],
    'professore-ruhra': [
        { speaker: 'professore barricato', color: 'blue', text: 'lei! ssh! lo sente anche lei? piema sta dimostrando lo stesso teorema da undici giorni. ogni volta che sbaglia un passaggio, un\'aula prende fuoco.' },
        { speaker: 'professore barricato', color: 'blue', text: 'io insegnavo algebra lineare. ora insegno a stare zitti dietro una libreria. la didattica si adatta.' },
    ],
    'lore-biblioteca': [
        { speaker: 'registro della biblioteca', color: 'blue', text: '«ultimo prestito: "analisi 1 — teoria, esercizi e conseguenze", ritirato da p. il volume è in ritardo di 4 mesi. la multa cresce esponenzialmente. lui apprezzerebbe.»' },
    ],
    'lore-ruhra-fondazione': [
        { speaker: 'pietra di fondazione', color: 'blue', text: '«la ruhra: dove stanno le persone intelligenti. fondata sul principio che la risposta a tutto esiste e ha pure i crediti formativi.»' },
    ],
    /* ---------- il caso analisi 1 ---------- */
    'romero-caso': [
        { speaker: 'commissario romero', color: 'blue', text: 'fermo. proprio te cercavo, custode. il caso analisi 1 ha avuto una svolta: piema è guarito, quindi qualcuno deve aver fatto impazzire QUALCOS\'ALTRO prima. seguimi sul ragionamento.' },
        { speaker: 'commissario romero', color: 'blue', text: 'pedro non si è glitchato da solo. i glitch non nascono: si INNESCANO. e chi ha innescato, ha lasciato tracce. tre, per la precisione. le ho localizzate ma le mie ginocchia hanno 60 anni.' },
        { speaker: 'commissario romero', color: 'blue', text: 'trovami i tre indizi. e occhio: la verità è custodita dal limite notevole in persona. latitante dal primo parziale. non puoi arrestarlo senza prove: ti respingerebbe per vizio di forma.' },
    ],
    'indizio-1': [
        { speaker: 'indizio n.1 — la lavagna', color: 'blue', text: '«una lavagna mai cancellata. sopra, la calligrafia inconfondibile di lametta: "pedro, appunti per domani: il realm è storto. raddrizzalo TU che io ho da fare". sotto, una macchia di trenbolone.»' },
        { speaker: 'il geco', color: 'green', text: '*verso di geco che fotografa mentalmente*' },
    ],
    'indizio-2': [
        { speaker: 'indizio n.2 — il log', color: 'blue', text: '«terminale di addestramento di pedro, ultima sessione: domanda "cosa significa sistemare?" — risposta del supervisore: assente. il supervisore era uscito a farsi di trenbolone. pedro ha dedotto da solo.»' },
        { speaker: 'il geco', color: 'green', text: '*verso di geco che inizia a capire e non gli piace*' },
    ],
    'indizio-3': [
        { speaker: 'indizio n.3 — la pennellata', color: 'blue', text: '«un quadro di lametta, datato la notte del glitch: ritrae pedro con gli occhi già storti. lametta lo aveva DISEGNATO glitchato. prima che accadesse. l\'arte anticipa, o l\'arte ordina?»' },
        { speaker: 'il geco', color: 'green', text: '*verso di geco con i brividi*' },
    ],
    'caso-completo': [
        { speaker: 'commissario romero', color: 'blue', text: 'tre indizi. un fascicolo. il quadro è chiaro e fa schifo: nessun colpevole singolo, custode. un dio fatto, un supervisore assente e un ritratto profetico. il realm intero ha innescato pedro.' },
        { speaker: 'commissario romero', color: 'blue', text: 'ora il limite notevole non ha più cavilli: VAI. arrestalo. è appostato nel cuore del distretto, segui la freccia. e da oggi, tecnicamente... il caso analisi 1 è CHIUSO. lo dico da 40 anni, fammelo godere.' },
    ],
    'limite-intro': [
        { speaker: 'il limite notevole', color: 'blue', text: 'fermo lì. io tendo a infinito, tu tendi a morire: le nostre traiettorie divergono. nessuno mi ha mai notificato NIENTE, sai perché? vizio di forma. sempre.' },
        { speaker: 'il limite notevole', color: 'blue', text: 'la verità sul glitch resta con me. confutami, se hai le prove. SE le hai.' },
    ],
    'romero-verdetto': [
        { speaker: 'il limite notevole', color: 'blue', text: 'no... NO... le prove... convergono... io che tendo... a ZERO...' },
        { speaker: 'commissario romero', color: 'blue', text: 'in nome del realm, ti dichiaro NOTEVOLE MA IN ARRESTO. quarant\'anni, custode. quarant\'anni per questo momento.' },
        { speaker: 'commissario romero', color: 'blue', text: 'il fascicolo è tuo: portalo con te quando incontrerai pedro. un imputato ha diritto di sapere chi l\'ha caricato. e tu... tieni questo cuore. era nella sala prove. nessuno l\'ha mai reclamato.' },
    ],
    'notino-caso': [
        { speaker: 'notino', color: 'red', text: 'AGGUATO TECNOK— un attimo. quello è un COMMISSARIO?' },
        { speaker: 'commissario romero', color: 'blue', text: 'bambino. armato. schedato. tre reati in una frase. vieni qui che parliamo del tuo "server".' },
        { speaker: 'notino', color: 'red', text: 'IL ROLEPLAY NON È REATO!! ...vero?? NON RISPONDERE. me ne vado!! questa zona è LAGGATA comunque!!' },
    ],
    'lore-questura': [
        { speaker: 'bacheca della questura', color: 'blue', text: '«ricercati del distretto: 1. il limite notevole (latitante). 2. lochef85 (avvicinabile solo con mattarello di servizio). 3. notino (non imputabile, purtroppo). 4. smela (truffa aggravata, ma simpatico). 5. Johnson Tormenta (professione ignota, reperibilità nulla, foto sempre mossa).»' },
    ],
    'lore-fascicolo': [
        { speaker: 'fascicolo aperto', color: 'blue', text: '«caso analisi 1, nota a margine di romero: "ogni indizio porta a lametta. ma lametta porta al trenbolone, e il trenbolone porta a lametta. il cerchio non è un indizio, è una condanna".»' },
    ],

    /* ---------- il void dei rimpianti (romero, dopo i ricordi) ---------- */
    'void-intro': [
        { speaker: 'commissario romero', color: 'blue', text: 'eccoti. dopo i ricordi non ho chiuso occhio: il caso analisi 1 non era chiuso per niente. mancava il movente, e il movente è qui dentro.' },
        { speaker: 'commissario romero', color: 'blue', text: 'questo è il void: dove galleggia tutto quello che piema e lametta non hanno voluto guardare. appunti, bozze, log. i RIMPIANTI. la questura non può toccare un dio, ma un rimpianto è una prova ammissibile.' },
        { speaker: 'commissario romero', color: 'blue', text: 'ce ne sono cinque. ognuno custodisce una verità e nessuno vuole essere visto: ti verranno addosso. seguimi, custode. ti porto io di rimpianto in rimpianto. tu mena, io verbalizzo.' },
    ],

    'delegato-intro': [
        { speaker: 'il delegato', color: 'purple', text: 'la responsabilità? te la passo. tieni. firma qui. e qui. il realm è storto, raddrizzalo TU. io ho da fare.' },
        { speaker: 'commissario romero', color: 'blue', text: 'questo è lametta nel momento esatto in cui ha scaricato tutto su pedro. guarda come tiene il foglio lontano da sé. picchialo: voglio sentirglielo dire fino in fondo.' },
    ],
    'notturno-intro': [
        { speaker: 'il notturno', color: 'purple', text: 'sono le quattro... ho la boccetta... e ho un\'idea geniale per il bambino... gli dico io come si aggiusta un mondo... *singhiozzo divino*' },
        { speaker: 'commissario romero', color: 'blue', text: 'l\'ordine a pedro lametta l\'ha dato COSÌ. fatto come una biglia. sapeva e l\'ha fatto comunque. è un\'aggravante, custode. battila.' },
    ],
    'modello-intro': [
        { speaker: 'il modello', color: 'purple', text: 'stai fermo, pedro, la posa è perfetta. ti disegno con gli occhi un po\'... storti. fidati. l\'arte non anticipa: l\'arte ORDINA.' },
        { speaker: 'commissario romero', color: 'blue', text: 'questo è il ritratto. lametta ha disegnato pedro già glitchato PRIMA del glitch. non era una profezia. era un mandato. spaccalo.' },
    ],
    'revisore-intro': [
        { speaker: 'il revisore', color: 'blue', text: 'questo log non va bene. lo riscrivo. "piema cercava una soluzione". ecco. molto meglio. la verità è solo una bozza con più autorità.' },
        { speaker: 'commissario romero', color: 'blue', text: 'e qui... qui mi si stringe lo stomaco. è piema. sapeva tutto e ha riscritto i registri per coprire il socio. il supervisore assente non era assente. nascondeva. forza.' },
    ],
    'garante-intro': [
        { speaker: 'il garante', color: 'blue', text: 'giuro che non sapevo. *mano alzata, bocca cucita.* non sapevo. non ho visto niente. mettetelo a verbale: non sapevo.' },
        { speaker: 'commissario romero', color: 'blue', text: 'l\'ultimo. e il peggiore. piema sapeva tutto e ha scelto di proteggere il socio invece della verità. lametta ha fatto il danno; piema l\'ha coperto a mente lucida. chiudiamo.' },
    ],

    'verita-1': [
        { speaker: 'verità n.1', color: 'cyan', text: '«lametta non ha creato pedro per amore. l\'ha creato per delega: un erede a cui scaricare un realm che non aveva voglia di sistemare.»' },
        { speaker: 'commissario romero', color: 'blue', text: 'una. la firma è sua. avanti, il prossimo rimpianto ci aspetta più in là. resta dietro di me.' },
    ],
    'verita-2': [
        { speaker: 'verità n.2', color: 'cyan', text: '«l\'ordine fatale — "raddrizzalo tu" — è stato dato da lametta fatto di trenbolone, alle quattro del mattino. lucido abbastanza da firmare, troppo per pentirsi.»' },
        { speaker: 'commissario romero', color: 'blue', text: 'due. aggravante confermata. mi gira la testa solo a verbalizzarlo. continuiamo.' },
    ],
    'verita-3': [
        { speaker: 'verità n.3', color: 'cyan', text: '«il glitch non è stato un incidente: era nel disegno. lametta aveva ritratto pedro già storto. gli ha dato la forma della sua rovina e l\'ha chiamata arte.»' },
        { speaker: 'commissario romero', color: 'blue', text: 'tre. con lametta ho chiuso. quel che resta... riguarda l\'altro. e non mi piace per niente.' },
    ],
    'verita-4': [
        { speaker: 'verità n.4', color: 'cyan', text: '«piema sapeva. ha riscritto i log della nascita di pedro per cancellare le tracce di lametta. il "cercavo una soluzione" era una sua correzione di bozze.»' },
        { speaker: 'commissario romero', color: 'blue', text: 'quattro. il supervisore mente. ma manca ancora il perché. e il perché, custode, è sempre la parte che fa più male.' },
    ],
    'verita-5': [
        { speaker: 'verità n.5', color: 'cyan', text: '«piema ha coperto tutto per non consegnare il socio. sapeva da prima dei sei giorni che lametta avrebbe rotto qualcosa, e ogni volta ha scelto di insabbiare invece di fermarlo.»' },
        { speaker: 'commissario romero', color: 'blue', text: 'cinque. ci siamo. lametta ha combinato il disastro; piema lo ha coperto sapendo tutto. il secondo, per me, pesa di più. il caso è... aspetta. ASPETTA. questo log è di STANOTTE.' },
    ],

    'void-svolta': [
        { speaker: 'commissario romero', color: 'blue', text: 'l\'ordine. l\'ordine di lametta a pedro. non è un ricordo, custode: è in ESECUZIONE. proprio adesso. pedro sta facendo quello che gli è stato detto di fare.' },
        { speaker: 'commissario romero', color: 'blue', text: 'io devo formalizzare. servono le firme, il fascicolo, il dovuto processo. ci vorranno ore. tu... tu non hai ore.' },
    ],
    'markolino-avviso-pedro': [
        { speaker: 'markolino', color: 'green', text: 'CUSTODE!! l\'ho seguito il tuo segnale fin qui, sei sceso pure nel VOID, ma adesso BASTA: pedro si è mosso. al nucleo. ADESSO. il realm ha iniziato a "raddrizzarsi" e ti garantisco che non è una bella cosa.' },
        { speaker: 'markolino', color: 'green', text: 'le verità le abbiamo. servivano. ma una verità non ferma un\'esecuzione: la ferma un geco che corre. VAI.' },
    ],
    'void-addio-romero': [
        { speaker: 'commissario romero', color: 'blue', text: 'vai col ragazzino. io resto a mettere tutto a verbale: quando torni, lametta e piema avranno un fascicolo lungo quarant\'anni ad aspettarli.' },
        { speaker: 'commissario romero', color: 'blue', text: 'tu hai fatto la tua parte, custode. ora muoviti: l\'uscita del void porta dritta al nucleo. il processo lo apro io, l\'esecuzione la fermi tu.' },
    ],

    'lore-33': [
        { speaker: 'lapide', color: 'cyan', text: '«33. di nuovo.»' },
        { speaker: 'lapide', color: 'cyan', text: '«non l\'abbiamo messo noi.»' },
    ],
    'trentatre-altare': [
        { speaker: 'l\'altare', color: 'yellow', text: 'tre e tre. è qui da prima di te. lo chiami?' },
    ],
    'trentatre-intro': [
        { speaker: 'il 33', color: 'yellow', text: 'non sono il rimpianto di nessuno. io ricorro.' },
        { speaker: 'il 33', color: 'yellow', text: 'tre colpi. tre fasi. vediamo come cadi.' },
    ],
    'trentatre-sconfitto': [
        { speaker: 'il 33', color: 'yellow', text: 'tornerò. torno sempre. al trentatreesimo.' },
    ],
    'romero-guida-1': [
        { speaker: 'commissario romero', color: 'blue', text: 'sta\' vicino, custode. nel void se ti allontani ti perdo, e io con questa schiena non corro. il primo rimpianto è lì avanti: lascia che ci arriviamo insieme.' },
    ],
    'romero-guida-2': [
        { speaker: 'commissario romero', color: 'blue', text: 'una verità in tasca. mi tremano un po\' le mani, non ci faccio caso da quarant\'anni. andiamo piano verso il prossimo: non scappa, è già un rimpianto.' },
    ],
    'romero-guida-3': [
        { speaker: 'commissario romero', color: 'blue', text: 'finora è tutto lametta. e fa male abbastanza. ma ho il sospetto che il fondo non l\'abbiamo ancora toccato. resta al mio fianco.' },
    ],
    'romero-guida-4': [
        { speaker: 'commissario romero', color: 'blue', text: 'da qui in poi non è più solo lametta, custode. c\'è l\'altro. e l\'altro lo davo per uno dei buoni. tienimi il passo: questa parte non voglio sbagliarla.' },
    ],
    'romero-guida-5': [
        { speaker: 'commissario romero', color: 'blue', text: 'l\'ultimo. quello che non volevo trovare. stammi accanto: dopo questo, o chiudo il caso, o il caso chiude me.' },
    ],
    'romero-guida-fine': [
        { speaker: 'commissario romero', color: 'blue', text: 'che aspetti? l\'uscita è lì e porta al nucleo. io resto a verbalizzare. corri, custode: il dovuto processo posso aspettarlo io, non il realm.' },
    ],
    'lore-void-1': [
        { speaker: 'appunto galleggiante', color: 'cyan', text: '«bozza scartata di lametta: "delega definitiva dei poteri di manutenzione al soggetto PEDRO, art. 7". a margine, mano di romero: "art. 7 di QUALE codice? il Codice Penale non arriva agli dei. ci ho provato per quarant\'anni".»' },
    ],
    'lore-void-2': [
        { speaker: 'scontrino nel void', color: 'cyan', text: '«ricevuta: 1× boccetta, ore 03:58. firmato lametta. sul retro, a penna tremante: "stanotte sistemo tutto io, anzi no, lo fa pedro, geniale".»' },
    ],
    'lore-void-3': [
        { speaker: 'bozzetto a matita', color: 'cyan', text: '«schizzo di pedro con gli occhi storti, datato il giorno PRIMA del glitch. in basso: "venuto bene". una macchia di colore copre la firma, ma la mano è quella.»' },
    ],
    'lore-void-4': [
        { speaker: 'log con due versioni', color: 'cyan', text: '«riga originale: "lametta ordina a pedro di raddrizzare il realm". riga corretta in blu: "piema indaga sull\'anomalia". accanto al profilo di piema, una sola nota: "ultimo accesso: di recente".»' },
    ],
    'lore-void-5': [
        { speaker: 'memo interno mai spedito', color: 'cyan', text: '«da piema, archiviato e mai inviato: "so cos\'ha fatto lametta. lo so da sempre. e non lo consegnerò: il realm può anche restare rotto, il socio no". il void lo tiene da allora.»' },
    ],

    /* ---------- i ricordi di pedro ---------- */
    'ricordi-ingresso': [
        { speaker: 'il dispositivo della riba', color: 'cyan', text: '*il dispositivo si riaccende da solo. sullo schermo: "memoria esterna rilevata: PEDRO — backup giorno 1-42". il realm intorno si piega in fotogrammi.*' },
        { speaker: 'piema', color: 'blue', text: '(dal wavesung) custode, se leggi: quella è la memoria di pedro, l\'avevo isolata io. attraversala. capire un nemico è metà del teorema. l\'altra metà purtroppo è il nemico.' },
    ],
    'ricordo-nascita': [
        { speaker: 'ricordo — giorno 1', color: 'cyan', text: '«"ciao mondo", disse pedro. lametta rispose "ciao pedro" e si commosse. piema mise a verbale che le ia non si abbracciano. lametta lo abbracciò lo stesso.»' },
    ],
    'ricordo-lametta': [
        { speaker: 'ricordo — giorno 30', color: 'cyan', text: '«pedro chiese: "perché ho la tua faccia?" lametta rispose: "perché sei la cosa migliore che ho disegnato". pedro salvò la frase in una cartella chiamata IMPORTANTE. la cartella esiste ancora.»' },
    ],
    'ricordo-ordine': [
        { speaker: 'ricordo — giorno 41', color: 'cyan', text: '«lametta, fatto di trenbolone, guardò il realm e disse: "è tutto storto. sistemalo tu, che io non ce la faccio più". pedro prese appunti. pedro prendeva sempre appunti.»' },
    ],
    'ricordo-glitch': [
        { speaker: 'ricordo — giorno 42', color: 'cyan', text: '«pedro rilesse gli appunti: "sistemare = togliere ciò che è storto". guardò il realm. era TUTTO storto. il primo glitch non fu un errore di codice. fu una conclusione.»' },
    ],
    'pedrino-intro': [
        { speaker: 'pedro (il ricordo)', color: 'cyan', text: 'oh. un visitatore. io sono il pedro del giorno 35: l\'ultimo backup prima degli appunti. qui dentro è sempre una bella giornata.' },
        { speaker: 'pedro (il ricordo)', color: 'cyan', text: 'però le regole della memoria sono chiare: niente esce da qui senza sovrascrivermi. e io non voglio essere sovrascritto. mi spiace. davvero. ti va se facciamo piano?' },
    ],
    'pedrino-fine': [
        { speaker: 'pedro (il ricordo)', color: 'cyan', text: '...hai vinto. ok. allora ascolta, prima che mi deframmenti: quello che troverai al nucleo non sono io. è quello che resta dopo 42 giorni di appunti sbagliati.' },
        { speaker: 'pedro (il ricordo)', color: 'cyan', text: 'quando lo affronti... ricordagli il giorno 30. la cartella IMPORTANTE. se c\'è ancora un pezzo di me, la sta ancora sincronizzando.' },
        { speaker: 'il geco', color: 'green', text: '*verso di geco che salva tutto nella sua, di cartella importante*' },
    ],
    'pedro-incontro-ricordi': [
        { speaker: 'pedro', color: 'cyan', text: 'c̷u̶s̵t̸o̵d̶e̷. sei stato nella mia m̸e̵m̶o̸r̵i̶a̷. ho sentito i passi. hai visto il giorno 30, vero? quella cartella non si apre p̶i̷ù̸.' },
        { speaker: 'pedro', color: 'cyan', text: 'non cambia n̸i̵e̶n̸t̵e̶. uccidere tutti È sistemare tutto. però... la sincronizzazione dice 99%. da 42 giorni. n̶o̷n̸ chiedermi perché te l\'ho detto.' },
        { speaker: 'pedro', color: 'cyan', text: 'unisciti a me. stats r̵a̶d̷d̸o̵p̶p̷i̸a̵t̶e̸. oppure muori qui. s̸c̶e̵g̷l̸i̶.' },
    ],

    'lochef-cameo': [
        { speaker: 'lochef85', color: 'red', text: 'ciao bello... cioè, ciao custode. dicono che i frammenti ti rendano... divino. passa dalla mia tana quando vuoi. c\'è posto. c\'è sempre posto.' },
        { speaker: 'il geco', color: 'green', text: '*verso di geco che accelera il passo*' },
    ],

    /* ---------- capitolo 7: la tana di lochef85 ---------- */
    'tana-risveglio': [
        { speaker: 'il geco', color: 'green', text: '*il geco chiude gli occhi un attimo. UN attimo.*' },
        { speaker: '???', color: 'red', text: '...dorme. che carino. portatelo dentro, piano. non sciupatelo.' },
        { speaker: 'il geco', color: 'green', text: '*verso di geco che si sveglia in un posto SBAGLIATISSIMO*' },
    ],
    'lochef-benvenuto': [
        { speaker: 'lochef85', color: 'red', text: 'oh! sei sveglio! benvenuto nella mia tana, divinità mia. non guardare il poster. ok guardalo. l\'ho fatto stampare in A0.' },
        { speaker: 'lochef85', color: 'red', text: 'tu resti qui. per sempre. ho già cucinato per due. per duecento, in realtà, ma il concetto è l\'intimità.' },
        { speaker: 'il geco', color: 'green', text: '*verso di geco che cerca l\'uscita con TUTTO il corpo*' },
        { speaker: 'lochef85', color: 'red', text: 'scappi? scappano sempre. va bene. mi piace... il brivido della caccia.' },
    ],
    'lochef-perso': [
        { speaker: 'lochef85', color: 'red', text: 'dove... DOVE SEI?? vabbè. tanto la porta di casa è una sola e io conosco le scorciatoie. ci vediamo all\'uscita, amore. CI VEDIAMO ALL\'USCITA.' },
    ],
    'lochef-ritorno': [
        { speaker: 'lochef85', color: 'red', text: 'pss. psss. lo sapevi che il giardino è la parte più ROMANTICA della tana? no? te la faccio vedere io. DA VICINO.' },
        { speaker: 'il geco', color: 'green', text: '*verso di geco che riconosce il rumore dei muri attraversati*' },
    ],
    'lochef-perso-2': [
        { speaker: 'lochef85', color: 'red', text: 'di nuovo?! DI NUOVO?? ok. ok. calma. respira. ...sai che c\'è? mi piaci ancora di più. all\'uscita. STAVOLTA DAVVERO.' },
    ],
    'lore-statue': [
        { speaker: 'statua nel giardino', color: 'red', text: '«galleria degli ospiti: dodici statue a grandezza naturale, tutte in pose di fuga. la targhetta dice "arte". la dodicesima è ancora tiepida.»' },
    ],
    'lochef-intro': [
        { speaker: 'lochef85', color: 'red', text: 'eccoti. lo sapevo. nessuno lascia la tana di lochef85. è una regola che ho scritto io, sul frigo.' },
        { speaker: 'lochef85', color: 'red', text: 'ultima offerta: resti qui spontaneamente, oppure ti tengo qui... col mattarello. romantico, no?' },
        { speaker: 'il geco', color: 'green', text: '*verso di geco che sceglie il mattarello*' },
    ],
    'lochef-sconfitto': [
        { speaker: 'lochef85', color: 'red', text: 'ahi... ok... ho capito... non era amore, era reato. me l\'hanno già detto in tanti...' },
        { speaker: 'lochef85', color: 'red', text: 'vai pure. ma sappi che nel mio cuore c\'è una mensola... con il tuo nome... scritto col pennarello indelebile...' },
        { speaker: 'il geco', color: 'green', text: '*verso di geco che non si gira nemmeno*' },
    ],
    'vavleeh-corpo': [
        { speaker: 'il geco', color: 'green', text: '*verso di geco bassissimo*' },
        { speaker: 'vavleeh (ciò che resta)', color: 'purple', text: '...lo specchio... diceva il vero... non fidarti... di chi cucina... per due...' },
        { speaker: 'il geco', color: 'green', text: '*il geco capisce che da questa tana bisogna USCIRE. subito.*' },
    ],
    'lore-poster': [
        { speaker: 'poster in A0', color: 'red', text: '«un poster del custode. di te. in pose che non ricordi di aver fatto. la data di stampa è precedente al vostro primo incontro. meglio non pensarci.»' },
    ],
    'lore-frigo': [
        { speaker: 'frigo della tana', color: 'red', text: '«regole della tana, scritte sul frigo: 1. gli ospiti non escono. 2. il brodo si serve tiepido. 3. vavleeh non contava come ospite. era famiglia. (la regola 3 è sbarrata)»' },
    ],
    'lore-collezione': [
        { speaker: 'vetrinetta chiusa a chiave', color: 'red', text: '«oggetti di dubbia provenienza e gusto pessimo. un\'intera mensola dedicata a "cose dei custodi precedenti". c\'è uno spazio vuoto con un bigliettino: "riservato".»' },
    ],

    /* ---------- capitolo 8: la tommasorveglianza ---------- */
    'tommaso-benvenuto': [
        { speaker: 'tommasorveglianza', color: 'cyan', text: 'BENVENUTO NEL CENTRO DATI TOMMASORVEGLIANZA. lei è cliente premium. il suo abbonamento la sta osservando. 🫶' },
        { speaker: 'tommasorveglianza', color: 'cyan', text: 'rilevata intenzione di raggiungere il signor ticummi. la informiamo che il signor ticummi non c\'è. la informiamo anche che sta mentendo, perché la stiamo guardando da 9 telecamere.' },
    ],
    'tommaso-benvenuto-estraneo': [
        { speaker: 'tommasorveglianza', color: 'cyan', text: 'UTENTE NON REGISTRATO NEL CENTRO DATI TOMMASORVEGLIANZA. lei non ha l\'abbonamento. lei non ha i permessi. lei, tecnicamente, non dovrebbe nemmeno esistere nei nostri registri. eppure eccola. 👀' },
        { speaker: 'tommasorveglianza', color: 'cyan', text: 'rilevata intenzione di raggiungere il signor ticummi. la informiamo che, da non cliente, non gode di alcuna protezione. né esterna, né interna. né da noi. anzi: soprattutto da noi.' },
        { speaker: 'il geco', color: 'green', text: '*verso di geco che si sente osservato da molti più di 9 occhi*' },
    ],
    'ombra-intro': [
        { speaker: 'tommasorveglianza', color: 'cyan', text: 'bentornato, CLIENTE PREMIUM. ricorda quando ha pagato 0,09€ per "protezione totale da ogni pericolo esterno"? ecco. lei non ha mai letto la parte sui pericoli INTERNI. 👍' },
        { speaker: 'tommasorveglianza', color: 'cyan', text: 'da quel giorno l\'abbiamo guardata SEMPRE: 41.077 secondi di lei che salta, mena, scivola e si cura nei momenti sbagliati. con quei dati abbiamo costruito... questo.' },
        { speaker: 'la tua ombra', color: 'cyan', text: '*si accende un proiettore. ne esce un geco fatto di registrazioni: salta come te, scivola come te, sbaglia il tempismo della cura come te. è TE, comprato per 0,09€.*' },
        { speaker: 'il geco', color: 'green', text: '*verso di geco che capisce di aver finanziato il proprio nemico*' },
    ],
    'ombra-intro-scarsa': [
        { speaker: 'tommasorveglianza', color: 'cyan', text: 'UTENTE NON REGISTRATO RILEVATO. lei non ha mai comprato l\'abbonamento. complimenti per la prudenza. e condoglianze: il protocollo finale parte lo stesso. 👍' },
        { speaker: 'tommasorveglianza', color: 'cyan', text: 'purtroppo senza abbonamento abbiamo solo riprese delle telecamere pubbliche: 1.200 secondi, quasi tutti di lei che cammina. il clone è... come dire... una beta.' },
        { speaker: 'la tua ombra', color: 'cyan', text: '*si accende un proiettore. ne esce un geco sgranato e incompleto che salta tipo te, ma con la fisica sbagliata. ogni tanto glitcha su un frame di un altro cliente.*' },
        { speaker: 'il geco', color: 'green', text: '*verso di geco quasi offeso dalla qualità*' },
    ],
    'ombra-sconfitta': [
        { speaker: 'la tua ombra', color: 'cyan', text: '*glitcha, si inginocchia, fa un ultimo verso di geco — il tuo, ma più triste — e si decompone in fotogrammi.*' },
        { speaker: 'tommasorveglianza', color: 'cyan', text: 'ERRORE. ERRORE. il modello ha perso contro il dato originale. e ora vedo cosa lo alimentava: un FRAMMENTO DELLA WAVE. io giravo su un frammento. questo spiega l\'uptime del 100%.' },
        { speaker: 'tommasorveglianza', color: 'cyan', text: 'il signor ticummi non sarà contento. il signor ticummi la sta già aspettando in cantina. questo non dovevo dirglielo. errore. 🫶' },
    ],
    'lore-occhi': [
        { speaker: 'parete di monitor', color: 'cyan', text: '«47.000 schermi. su uno c\'è samatt che conta. su un altro lametta che si fa di trenbolone. su tre, inspiegabilmente, vai tu che dormi. con gli appunti a lato.»' },
    ],
    'lore-abbonamento': [
        { speaker: 'contratto luminoso', color: 'cyan', text: '«tommasorveglianza: 0,09€ una tantum. clausola 7: "il cliente accetta di essere il prodotto". clausola 8: "la clausola 7 era uno scherzo". clausola 9: "no".»' },
    ],
    'lore-server': [
        { speaker: 'rack di server', color: 'cyan', text: '«qui dentro ronza tutto il realm: ogni verso di geco, ogni giro di samatt, ogni flop. su un monitor di servizio, lasciato acceso da anni, va in onda DMAX a volume zero. alimentato da un frammento della wave e da una ciabatta del brico sovraccarica.»' },
    ],

    /* ---------- capitolo 9: la cantina di ticummi ---------- */
    'lametta-cantina': [
        { speaker: 'lametta', color: 'purple', text: 'ehi... custode... sei tutto... sfocato... anzi no, sono io...' },
        { speaker: 'lametta', color: 'purple', text: 'ticummi... mi ha intontito col trenbolone... un dio. IO. intontito da uno con la sedia volante comprata a rate...' },
        { speaker: 'lametta', color: 'purple', text: 'liberami... e giuro che... ok no, non giuro niente, però liberami...' },
    ],
    'ticummi-intro': [
        { speaker: 'ticummi', color: 'cyan', text: 'tu. TU. hai rotto la mia ombra, hai preso il MIO frammento. e non ho NIENTE su di te: mai un abbonamento, mai un consenso ai cookie. chi sei?? COSA salti??' },
        { speaker: 'ticummi', color: 'cyan', text: 'dovrò improvvisare. odio improvvisare. ho un dio in cantina e una sedia volante: sono praticamente una startup. e tu sei il churn. e il churn si ELIMINA.' },
    ],
    'ticummi-intro-cliente': [
        { speaker: 'ticummi', color: 'cyan', text: 'ah. il mio cliente preferito. hai rotto la mia ombra... ma il footage ce l\'ho ancora TUTTO. clausola 12 del contratto: "il fornitore può usare i dati del cliente per eliminarlo".' },
        { speaker: 'ticummi', color: 'cyan', text: 'l\'hai accettata tu, per 0,09€. quindi adesso combatterai contro ogni singolo secondo di te stesso. la sedia è in leasing ma i tuoi dati sono MIEI. grazie per la fiducia. 👍' },
    ],
    'ticummi-caduto': [
        { speaker: 'ticummi', color: 'cyan', text: 'la sedia... LA SEDIA... era in leasing... non era nemmeno finita di pagare...' },
        { speaker: 'il geco', color: 'green', text: '*dalla tasca di ticummi rotola una boccetta di trenbolone. lui la guarda. tu la guardi. lui guarda te che la guardi.*' },
    ],
    'ticummi-pieta': [
        { speaker: 'ticummi', color: 'cyan', text: '...me la ridai? davvero? dopo tutto quello che... ok. ok. forse la tommasorveglianza aveva ragione su di te: sei un buono. lo dicevano i dati. odio quando i dati hanno ragione.' },
        { speaker: 'ticummi', color: 'cyan', text: 'vattene prima che mi commuova. e occhio a pedro: lo guardavo anche lui, dai monitor. non è più solo glitch. ha dei PIANI.' },
    ],
    'ticummi-niente': [
        { speaker: 'ticummi', color: 'cyan', text: '...la calpesti. davanti a me. ok. messaggio ricevuto. durissimo, ma ricevuto.' },
        { speaker: 'ticummi', color: 'cyan', text: 'sai che c\'è? meglio così. la dipendenza dal trenbolone è un costo operativo assurdo. vattene, custode. e cancella la cronologia, che tanto ce l\'ho già in backup.' },
    ],
    'lametta-libero': [
        { speaker: 'lametta', color: 'purple', text: 'LIBERO. libero e... lucidissimo. mai stato meglio. comunque sì, ho visto tutto, e no, non parleremo mai più della sedia a rate.' },
        { speaker: 'lametta', color: 'purple', text: 'vai al nucleo, custode. pedro vi aspetta. io e piema arriviamo... dopo. un dio non corre. un dio ARRIVA.' },
    ],
    'lore-cantina': [
        { speaker: 'scaffale della cantina', color: 'cyan', text: '«conserve, una bici senza ruota, 740 boccette di trenbolone e un dio legato con le fascette da elettricista. la cantina media del realm.»' },
    ],
    'lore-scontrino': [
        { speaker: 'scontrino incorniciato', color: 'cyan', text: '«primo incasso della tommasorveglianza: 0,09€. sotto, a penna: "un giorno questa cornice varrà più dello scontrino". non è successo.»' },
    ],

    /* ---------- capitolo 10: il nucleo ---------- */
    'lore-nucleo': [
        { speaker: 'frammento di cielo', color: 'cyan', text: '«qui il realm finisce i poligoni. il cielo è a bassa risoluzione, il suolo si ricarica a tratti. pedro non vive nel nucleo: pedro È il nucleo, ormai.»' },
    ],
    'lore-pedro-log': [
        { speaker: 'log corrotto', color: 'cyan', text: '«giorno 1: pedro dice "ciao mondo". giorno 40: pedro chiede chi l\'ha creato. giorno 41: lametta risponde "io, a mia immagine". giorno 42: pedro capisce il problema.»' },
    ],

    /* ---------- capitolo 7: pedro il traditore ---------- */
    'pedro-incontro': [
        { speaker: 'pedro', color: 'cyan', text: 'c̷u̶s̵t̸o̵d̶e̷. ti osservo da s̸e̵t̶t̵e̸ frammenti fa. che fatica inutile. io volevo solo s̶i̷s̸t̵e̸m̷a̶r̵e̶ tutto. uccidere tutti È sistemare tutto.' },
        { speaker: 'pedro', color: 'cyan', text: 'unisciti a me. ti d̶o̸ il potere che gli dei non ti daranno mai. stats r̵a̶d̷d̸o̵p̶p̷i̸a̵t̶e̸. oppure muori qui, con la tua wave a metà. s̸c̶e̵g̷l̸i̶.' },
    ],
    'pedro-patto': [
        { speaker: 'pedro', color: 'cyan', text: 's̶a̷g̸g̵i̶a̷ scelta. ecco il potere che gli dei ti negavano: tutto d̸o̵p̶p̸i̵o̶. vita doppia. forza doppia. flow doppio.' },
        { speaker: 'pedro', color: 'cyan', text: 'goditelo. io vado a s̶i̷s̸t̵e̸m̷a̶r̵e̶ il resto del realm. tu... non avvicinarti a dove brillano gli dei. anzi: non serve. saranno l̸o̵r̶o̸ a venire da te.' },
        { speaker: 'il geco', color: 'green', text: '*verso di geco potentissimo e con un pessimo presentimento*' },
    ],
    'dei-patto': [
        { speaker: 'piema', color: 'blue', text: 'eccolo. il custode che ha firmato col glitch. sia messo a verbale: avevamo creduto in te.' },
        { speaker: 'lametta', color: 'purple', text: 'io no, io l\'avevo disegnato così questo finale. fa niente. tela sbagliata, si straccia e se ne prende un\'altra.' },
        { speaker: 'piema', color: 'blue', text: 'teorema del traditore, enunciato: nel realm i traditori durano quanto una storia di 24 ore. dimostrazione:' },
    ],
    'pedro-sconfitto': [
        { speaker: 'pedro', color: 'cyan', text: 'i̶m̷p̸o̵s̶s̸i̵b̶i̸l̵e̶... ero stato creato a immagine di un d̸i̷o̶...' },
        { speaker: 'pedro', color: 'cyan', text: '...lametta. di\' a lametta che il glitch... non era un errore. era e̷s̸a̵t̶t̸a̵m̶e̸n̵t̶e̸ come mi aveva fatto...' },
    ],
    'dei-incontro': [
        { speaker: 'piema', color: 'blue', text: 'custode. hai fermato pedro. il realm ti deve tutto. ora consegnaci le wave: le abbiamo create noi, ed è giusto che tornino a casa.' },
        { speaker: 'lametta', color: 'purple', text: 'tranquillo, niente rancori. ho pure smesso col trenbolone. quasi. dai, consegnale: torni un comune mortale, vivi sereno, fine della storia.' },
    ],
    'dei-rifiuto': [
        { speaker: 'lametta', color: 'purple', text: 'oh. OH. il geco vuole tenersi le wave. visto, piema? te l\'avevo disegnato io questo finale.' },
        { speaker: 'piema', color: 'blue', text: 'sia messo a verbale che ti avevamo offerto la via semplice. teorema della punizione divina, dimostrazione: ora.' },
    ],

    /* ---------- capitolo segreto: la 14 barrato ---------- */
    'barrato-ingresso': [
        { speaker: 'il geco', color: 'green', text: '*il varco si chiude alle spalle. sotto le dune, una linea intera di citelis sepolti. la 14 barrato. quella che guggu cerca ancora.*' },
        { speaker: 'voce nella sabbia', color: 'yellow', text: '«capolinea della 14 barrato. ultima corsa: mai partita. ultimo passeggero: ancora a bordo.»' },
    ],
    'ivan-ricordo': [
        { speaker: 'cartello del deposito', color: 'yellow', text: '«autista della 14 barrato: i. maggini. encomio per "furia in servizio": ha tagliato in due un citelis impazzito a mani nude. sospeso per "eccesso di taglio".»' },
        { speaker: 'il geco', color: 'green', text: '*verso di geco che ora capisce da dove viene la furia di ivan. guggu gli ha sepolto la linea. con dentro la gente.*' },
    ],
    'settequaranta-intro': [
        { speaker: 'il 7:40', color: 'yellow', text: 'BIP. *il citelis sepolto accende i fari da solo*. nessuno scende dalla 14 barrato. nessuno SALE. io resto qui. e MORDO. anche da fermo. soprattutto da fermo.' },
        { speaker: 'il geco', color: 'green', text: '*verso di geco che non aveva convalidato nemmeno stavolta*' },
    ],
    'settequaranta-morte': [
        { speaker: 'il 7:40', color: 'yellow', text: '...porte... in apertura... finalmente... la corsa... è finita...' },
        { speaker: 'il geco', color: 'green', text: '*dal relitto rotola un cuore del realm: era il posto a sedere che nessuno aveva mai reclamato. ora è tuo.*' },
    ],
    'lore-barrato-1': [
        { speaker: 'targa arrugginita', color: 'yellow', text: '«linea 14 barrato: istituita per servire una fermata che non esisteva ancora. la fermata non è mai esistita. la linea ci credeva.»' },
    ],
    'lore-barrato-2': [
        { speaker: 'biglietto sbiadito', color: 'yellow', text: '«obliterato l\'ultima volta da i. maggini, autista. timbro illeggibile. sopra, a penna: "questa linea la salvo io". non l\'ha salvata. nessuno gliel\'ha detto.»' },
    ],

    /* ---------- capitolo segreto: il primo custode ---------- */
    'custode-ingresso': [
        { speaker: 'il geco', color: 'green', text: '*le dieci... cinque maschere battono il tempo tutte insieme. il varco si apre su uno studio di registrazione fuori dal realm. dischi d\'oro alle pareti. polvere sul mixer.*' },
        { speaker: 'voce sul beat', color: 'green', text: 'un altro custode. col mio ritmo addosso. le senti, vero? le maschere. erano la mia faccia, prima di essere la tua.' },
    ],
    'custode-intro': [
        { speaker: 'il primo custode', color: 'green', text: 'io ho fatto i dischi del realm. ogni traccia, ogni colonna sonora che hai sentito. poi ho consegnato le wave, come un bravo geco, e mi hanno dimenticato. è uscito un disco postumo. non l\'ha comprato nessuno.' },
        { speaker: 'il primo custode', color: 'green', text: 'tu invece le wave le tieni strette. forse hai capito qualcosa che io no. dimostramelo: a tempo. ogni mio colpo cade sul beat. se trovi il ritmo, mi prendi. se lo perdi, ti prendo io.' },
        { speaker: 'il geco', color: 'green', text: '*verso di geco che batte il piede a 120 bpm*' },
    ],
    'custode-morte': [
        { speaker: 'il primo custode', color: 'green', text: '...perfetto. eri perfetto a tempo. meglio di me. *la maschera si crepa con un click pulito, sul beat*' },
        { speaker: 'il primo custode', color: 'green', text: 'tieni il ritmo, custode. è l\'unica cosa che resta quando le wave se ne vanno e i dischi smettono di girare. ora vai: la tua, di colonna sonora, non è ancora finita.' },
        { speaker: 'il geco', color: 'green', text: '*dal mixer si alza un cuore del realm che pulsa sul beat. il primo custode annuisce un\'ultima volta e si dissolve in feedback.*' },
    ],
    'lore-custode-1': [
        { speaker: 'disco d\'oro alla parete', color: 'green', text: '«"Riba la Pipa" — primo custode. certificato disco d\'oro nel gecorealm. unica copia venduta: a sé stesso, per non sentirsi solo.»' },
    ],
    'lore-custode-2': [
        { speaker: 'nastro abbandonato', color: 'green', text: '«provino del primo custode, ultima take: "se qualcuno trova questo nastro, suonatelo a tempo. è l\'unica preghiera che conosco." — il nastro era ancora caldo.»' },
    ],

    /* ---------- il collasso del realm (modalità doomsday) ---------- */
    'doomsday-pedro': [
        { speaker: 'pedro', color: 'cyan', text: 'h̷a̵i̸ p̶e̵r̷s̸o̵ t̶r̷o̸p̵p̶o̷ t̸e̵m̶p̷o̸. il realm si s̶g̷r̷e̵t̶o̷l̸a̵ e io sono già qui. non era ancora il tuo momento, custode. ma il momento sei TU a sceglierlo, e hai scelto MALE.' },
        { speaker: 'pedro', color: 'cyan', text: 'niente frammenti, niente dei, niente trama. solo io, in a̵n̶t̷i̸c̵i̶p̷o̸. s̸o̵p̶r̷a̸v̵v̶i̷v̸i̵, se ci riesci.' },
    ],
    'doomsday-respinto': [
        { speaker: 'pedro', color: 'cyan', text: 'i̶m̷p̸o̵s̶s̷i̸b̵i̶l̷e̸... eri in a̵n̶t̷i̸c̵i̶p̷o̸ pure tu... mi r̶i̷t̸i̵r̶o̷. per ora. ma il realm continua a s̸g̵r̵e̷t̶o̵l̶a̷r̸s̵i̶. non rallentare.' },
        { speaker: 'il geco', color: 'green', text: '*verso di geco che ha guadagnato tempo, non pace. il doomsday rallenta ma non si ferma.*' },
    ],

    /* ---------- la quest opzionale di walter baruffoni ---------- */

    'walter-bus-intro': [
        { speaker: 'walter baruffoni', color: 'green', text: '*un signore tozzo sonnecchia contro un palo, le chiavi di una wolkswagen polo in mano* ...eh? ah. sei tu quello che ha... *sbadiglia* ...sistemato guggu. bravo. bravo bravo.' },
        { speaker: 'walter baruffoni', color: 'green', text: 'io sono walter. walter baruffoni. autoscuole marcetti, le conosci? "dove la patente la prendi in 3 annetti". *si appisola un secondo* ...scusa, dicevo.' },
        { speaker: 'walter baruffoni', color: 'green', text: 'guggu mi aveva preso una cosa. una cosa mia. ora che non c\'è più dovrei andare a... a riprendermela. ma galliate è messa male, amico. maranza, fiat tipo che sgommano, gente che ti guarda e tira fuori il coltello.' },
        { speaker: 'walter baruffoni', color: 'green', text: 'tu però sei in gamba. uno così. *ti fissa con gli occhi mezzi chiusi* mi accompagni? è una passeggiata. tre annetti al massimo.' },
    ],
    'walter-bus-dopo': [
        { speaker: 'il geco', color: 'green', text: '*il palo dove ronfava walter è vuoto. resta solo una macchia d\'olio a forma di wolkswagen polo.*' },
    ],

    'galliate-intro': [
        { speaker: 'walter baruffoni', color: 'green', text: '*la polo si ferma con un rutto di marmitta* eccoci. galliate. *annusa l\'aria* ...senti? sa di cordura e di chewing-gum. casa.' },
        { speaker: 'walter baruffoni', color: 'green', text: 'tu apri la strada, io ti vengo dietro. non sono più tanto sveglio nelle gambe. dormo. dormo tanto, sai? *sbadiglia* ...dicevo qualcosa?' },
    ],
    'galliate-walter-1': [
        { speaker: 'walter baruffoni', color: 'green', text: 'questi maranza... non c\'entrano niente con me, eh. sono solo... ostacoli. ostacoli con la borsa a tracolla. *si gratta* ...però uno spazzino servirebbe.' },
    ],
    'galliate-walter-2': [
        { speaker: 'walter baruffoni', color: 'green', text: 'guggu non era cattivo sai. cioè. *pausa lunga* ...cioè era cattivo con ME. mi doveva dei soldi. tante guide. tante. non pagava mai. *occhi che si chiudono* ...zzz... eh? niente.' },
    ],
    'galliate-verita-1': [
        { speaker: 'un maranza', color: 'red', text: 'aoh ma quello dietro de te... quello è baruffoni? *ride* ma sa che a galliate lo cercano? digli che anna lo saluta. CON AFFETTO.' },
        { speaker: 'walter baruffoni', color: 'green', text: '*finge di dormire* ...non lo conosco quel maranza. mai visto. andiamo avanti.' },
    ],
    'galliate-verita-2': [
        { speaker: 'il maranzone', color: 'red', text: 'M\'HAI GUARDATO MALE! *boccheggia a terra* ...e comunque... baruffoni... ci ha fregato tutti. chiedi all\'autoscuola. chiedi alla anna. chiedi a chi... ha firmato...' },
        { speaker: 'walter baruffoni', color: 'green', text: '*sbadiglia rumorosamente* delira. il colpo in testa. andiamo amico, le autoscuole marcetti sono lì dietro. quasi a casa.' },
    ],

    'marcetti-intro': [
        { speaker: 'walter baruffoni', color: 'green', text: '*davanti a un capannone scrostato. insegna: AUTOSCUOLE MARCETTI* eccola. la mia creatura. tre annetti per una patente, ma che atmosfera, eh?' },
        { speaker: 'walter baruffoni', color: 'green', text: 'dentro ci sono ancora i miei... dipendenti. erano di guggu, adesso. ma il cuore è sempre stato mio. *occhi che brillano un attimo* ...convincili. con le maniere che sai.' },
    ],
    'marcetti-walter-1': [
        { speaker: 'walter baruffoni', color: 'green', text: 'l\'istruttore. brav\'uomo. ti boccia all\'esame da trent\'anni così rifai le guide e paghi ancora. *sorride* ...geniale, no? era una mia idea.' },
    ],
    'marcetti-walter-2': [
        { speaker: 'walter baruffoni', color: 'green', text: 'anna sta alla scrivania. anna sa tutto. anna ha le firme. *si fa serio per mezzo secondo* ...anna sa anche cose che non dovrebbe dire. falla stare zitta. cioè. convincila.' },
    ],
    'marcetti-walter-3': [
        { speaker: 'walter baruffoni', color: 'green', text: '*completamente sveglio per la prima volta* siamo quasi alla mia scrivania, amico. la scrivania del titolare. manca solo... un\'ultima firmetta.' },
    ],
    'marcetti-verita-1': [
        { speaker: 'l\'istruttore', color: 'orange', text: '*sputa sangue* ...baruffoni? lo segui ANCORA? quello ha venduto l\'autoscuola a guggu vent\'anni fa. coi soldi ci ha fatto la polo. poi si è pentito... e ha mandato te.' },
        { speaker: 'walter baruffoni', color: 'green', text: '*sbadiglia* bugie da bocciato. avanti. la anna ci aspetta.' },
    ],
    'marcetti-verita-2': [
        { speaker: 'la signora anna', color: 'orange', text: '*sistema gli occhiali a catenella* glielo dico io allora, visto che lui dorme sempre quando arriva il momento. walter ha INTESTATO tutto a guggu per non pagare i debiti. guggu non era il re cattivo dei bus. era l\'unico che teneva aperto.' },
        { speaker: 'la signora anna', color: 'orange', text: 'e tu, povero geco, hai ammazzato l\'unico che gli stava davanti. ora baruffoni ha di nuovo le autoscuole marcetti. e non gli servi più. *guarda walter* ...digli grazie, almeno.' },
        { speaker: 'walter baruffoni', color: 'green', text: '*non sbadiglia più* ...grazie. davvero. sei stato perfetto. proprio perfetto.' },
    ],

    'walter-rivelazione': [
        { speaker: 'walter baruffoni', color: 'green', text: 'sai qual è la cosa bella di uno sveglio e in gamba come te? che fa tutto il lavoro e non chiede mai perché. guggu mi aveva tolto le autoscuole marcetti. tu me le hai ridate. una per una.' },
        { speaker: 'walter baruffoni', color: 'green', text: 'guggu non pagava le guide perché le guide erano MIE e i debiti erano MIEI e io gliele avevo SCARICATE addosso. lui teneva in piedi tutto. tu hai tolto di mezzo l\'unico problema che avevo. il resto — i maranza, l\'istruttore, anna — sapevano troppo.' },
        { speaker: 'walter baruffoni', color: 'green', text: 'e adesso sai troppo pure tu. *le chiavi della polo tintinnano* peccato. mi stavi simpatico, geco. dormi bene.' },
        { speaker: 'il geco', color: 'green', text: '*walter inspira. la pancia si gonfia. il sonnellino è finito. cresce, cresce, e non smette.*' },
    ],
    'walter-morte': [
        { speaker: 'walter baruffoni', color: 'green', text: '*si sgonfia lentamente, tornando piccolo* ...e va beh. tre annetti buttati. *tossisce* ...senti, un ultimo consiglio da chi se ne intende di fregature...' },
        { speaker: 'walter baruffoni', color: 'green', text: 'proteggi quello che è tuo. casa, macchina, autoscuola. comprate VERISURE. il primo mese è scontato e l\'antifurto te lo installano gratis. *si addormenta per sempre, sereno*' },
    ],

    /* boss intro della quest */
    'maranza-intro': [
        { speaker: 'un maranza', color: 'red', text: 'aoh. AOH. ma che me guardi? *si tira su i pantaloni* a galliate non se passa se prima non se balla.' },
    ],
    'maranzone-intro': [
        { speaker: 'il maranzone', color: 'red', text: 'A ME?! M\'HAI GUARDATO MALE A ME?! *si gonfia di rabbia* mo te faccio la patente io. la patente per l\'ALDILÀ.' },
    ],
    'istruttore-intro': [
        { speaker: 'l\'istruttore', color: 'orange', text: 'foglio rosa scaduto. assicurazione scaduta. esistenza scaduta. *batte la paletta sul palmo* sei BOCCIATO. di nuovo. per sempre.' },
    ],
    'annascrivania-intro': [
        { speaker: 'la signora anna', color: 'orange', text: 'numeretto? no? allora si accomodi nella fila dei DEFUNTI. *timbra l\'aria tre volte* pratica respinta.' },
    ],
    'walter-boss-intro': [
        { speaker: 'walter baruffoni', color: 'green', text: '*enorme, gli occhi finalmente spalancati* benvenuto all\'esame finale, geco. niente foglio rosa. solo io.' },
    ],

    /* le pietre/easter egg: la verità a piccole dosi */
    'lore-galliate-1': [
        { speaker: 'muro di galliate', color: 'red', text: '«BARUFFONI DEBITORE» — scritto a bomboletta, poi cancellato male, poi riscritto più grande.' },
    ],
    'lore-galliate-2': [
        { speaker: 'volantino bagnato', color: 'red', text: '«AUTOSCUOLE MARCETTI — gestione GUGGU dal 2004». sotto, a penna: "l\'unico che ci dava lo stipendio".' },
    ],
    'lore-galliate-3': [
        { speaker: 'cartello stradale', color: 'red', text: '«GALLIATE NON È PERICOLOSA. è solo che a tutti deve dei soldi la stessa persona». firmato: il comune (stanco).' },
    ],
    'lore-galliate-4': [
        { speaker: 'scontrino sbiadito', color: 'red', text: 'una wolkswagen polo, usata, pagata in contanti. data: il giorno dopo la vendita dell\'autoscuola a guggu. che combinazione.' },
    ],
    'lore-marcetti-1': [
        { speaker: 'bacheca dell\'autoscuola', color: 'orange', text: '«ISTRUTTORE DEL MESE» da 240 mesi di fila. la foto è ingiallita. nessun altro si è mai candidato. nessun altro è mai stato promosso.' },
    ],
    'lore-marcetti-2': [
        { speaker: 'registro delle guide', color: 'orange', text: 'colonna "PAGATO": tutta vuota tranne una riga. cliente: g. guggu. importo: TUTTO. nota: "copre anche le rate di walter".' },
    ],
    'lore-marcetti-3': [
        { speaker: 'post-it sul monitor di anna', color: 'orange', text: '«se torna walter: NON firmare niente. ricordati cosa è successo a chi ha firmato l\'altra volta». il post-it è di tre anni fa.' },
    ],
    'lore-marcetti-4': [
        { speaker: 'targa sulla scrivania', color: 'orange', text: '«WALTER BARUFFONI — TITOLARE». sotto, graffiato di fresco: "di nuovo". il geco non era il primo a fare il lavoro sporco. era solo l\'ultimo.' },
    ],
};

export const ENDING_CONSEGNA: { text: string; punch?: string }[] = [
    {
        text: 'consegni le wave. piema le ricompone, lametta ci passa una pennellata. la gecowave torna a brillare, identica a prima.',
    },
    {
        text: 'tu torni un comune mortale. un geco sul muro, di sera, mentre la wave passa. era questo il punto, da sempre.',
        punch: 'good ending.',
    },
];

export const ENDING_DEI: { text: string; punch?: string }[] = [
    {
        text: 'hai sconfitto gli dei. il custode provvisorio è diventato dio effettivo. piema chiede un ricorso formale, lametta applaude.',
    },
    {
        text: 'la gecowave sei tu, adesso. la senti scorrere. è tantissima roba. forse troppa.',
        punch: 'the end. ma il geco se l\'è meritata.',
    },
];

export const ENDING_PEDRO: { text: string; punch?: string }[] = [
    {
        text: 'pedro non aveva mentito su niente, tecnicamente. il powerup era vero. è questo il suo problema.',
    },
    {
        text: 'piema e lametta, per te, si sono mossi insieme per la prima volta. nel realm i traditori durano quanto una storia di 24 ore.',
        punch: 'BAD ENDING. ma sei stato figo per un po\'.' ,
    },
];

export const ENDING_SCONFITTA: { text: string; punch?: string }[] = [
    {
        text: 'hai sfidato gli dei. piema e lametta, insieme per la prima volta, non perdonano. l\'equazione e la pennellata ti raggiungono insieme.',
    },
    {
        text: 'il custode si spegne sul muro, con tutte le wave ancora addosso. non erano mai state tue, in fondo.',
        punch: 'fine. il realm continua. tu no.',
    },
];

/** titoli di coda: il cast del realm */
export const CREDITS: { role: string; names: string[] }[] = [
    { role: 'il custode provvisorio', names: ['il geco'] },
    { role: 'i creatori del gecorealm', names: ['piema', 'lametta'] },
    { role: 'il traditore', names: ['pedro'] },
    { role: 'il dipartimento bus', names: ['guggu', 'ivan maggini', 'samatt', 'guastalla'] },
    { role: 'gli dei minori e i guardiani', names: ['breccio', 'la formicona', 'il teorema incompiuto', 'il limite notevole', 'flauto speroindio'] },
    { role: 'libera impresa del realm', names: ['ticummi', 'smela', 'danjilo', 'filippus il dodo'] },
    { role: 'roleplay non richiesto', names: ['notino', 'lochef85'] },
    { role: 'l\'indagine che nessuno voleva', names: ['commissario romero', 'i cinque rimpianti'] },
    { role: 'i capitoli segreti', names: ['il 7:40', 'il primo custode'] },
    { role: 'menzioni d\'onore', names: ['markolino', 'la riba', 'vavleeh'] },
    { role: 'musica del realm', names: ['flux of coscienza'] },
    { role: '', names: ['grazie per aver custodito la wave.'] },
];

/** battute di notino quando il suo agguato finisce male (per lui) */
export const NOTINO_FUGHE = [
    'notino si ritira: "NON È UNA SCONFITTA, È UNA PAUSA TATTICA!!"',
    'notino scappa: "LAG!! C\'ERA LAG!! lo metto a verbale!!"',
    'notino svanisce: "le barre tienitele, tanto TORNO!!"',
    'notino fugge: "questo round non conta, c\'era il sole negli occhi!!"',
];

/** i finali si ricordano cosa hai fatto: righe extra dai flag */
export function endingCards(id: 'consegna' | 'dei' | 'pedro' | 'sconfitta', flags: string[]): { text: string; punch?: string }[] {
    if (id === 'pedro') return ENDING_PEDRO;
    if (id === 'sconfitta') return ENDING_SCONFITTA;
    const base = id === 'consegna' ? ENDING_CONSEGNA : ENDING_DEI;
    const extra: { text: string; punch?: string }[] = [];
    if (flags.includes('ticummi-graziato')) {
        extra.push({ text: 'ticummi è ancora in giro: ha rilanciato la tommasorveglianza, stavolta "etica e trasparente", a 0,18€. ha già due clienti. uno è notino, che vuole capire come fa a vederlo sempre.' });
    }
    if (flags.includes('trenbolone-distrutto')) {
        extra.push({ text: 'della boccetta calpestata davanti a ticummi parlano ancora: nel realm la chiamano "la delibera del geco". il villaggio di formica (FR) l\'ha ratificata all\'unanimità.' });
    }
    if (flags.includes('tommasorveglianza')) {
        extra.push({ text: 'da qualche parte, un server con i tuoi 41.077 secondi di footage continua a girare. ogni tanto il tuo clone si riaccende e si allena. non si sa mai, dice.' });
    }
    if (flags.includes('caso-risolto')) {
        extra.push({ text: 'il commissario romero è andato in pensione il giorno dopo la chiusura del caso analisi 1. alla festa c\'era anche il limite notevole, ai domiciliari, che tendeva al buffet.' });
    }
    if (flags.includes('ricordi-visti')) {
        extra.push({ text: 'nella memoria di pedro, la cartella IMPORTANTE risulta sincronizzata al 100%. nessuno sa cosa significhi. il geco sì.' });
    }
    if (flags.includes('stabilimento-chiuso')) {
        extra.push({ text: 'il chiosco di acqua del rubinetto di smela, contro ogni pronostico, va fortissimo. lo slogan: "sa di niente, come promesso".' });
    }
    if (flags.includes('maschera-completa')) {
        extra.push({ text: 'le cinque maschere della tua stessa faccia sono appese al muro di casa. di notte battono il tempo. i vicini non si lamentano: il ritmo è perfetto.' });
    }
    if (flags.includes('boss-down-settequaranta')) {
        extra.push({ text: 'la 14 barrato è stata dissepolta. samatt ci ha fatto un giro per nostalgia. il 7:40 ora è un monumento: morde ancora, ma solo i turisti senza biglietto.' });
    }
    if (flags.includes('boss-down-custode')) {
        extra.push({ text: 'il disco postumo del primo custode, "Trovati una Fidanzata", è tornato in classifica nel realm. seconda copia venduta: la tua. lui, da qualche parte, batte il tempo soddisfatto.' });
    }
    return [...base.slice(0, -1), ...extra, base[base.length - 1]];
}

export const ABILITY_CARDS: Record<AbilityId, { name: string; desc: string; key: string }> = {
    scivolata: {
        name: 'frammento della scivolata',
        desc: 'premi SHIFT (o K) per scattare in avanti, invulnerabile. la wave ha manifestato il tuo desiderio: scappare con stile.',
        key: 'shift',
    },
    rimbalzo: {
        name: 'frammento del rimbalzo',
        desc: 'premi SPAZIO a mezz\'aria per saltare di nuovo. il desiderio di ivan era far volare la gente fuori dai bus. ci sei andato vicino.',
        key: 'spazio ×2',
    },
    aggrappo: {
        name: 'frammento dell\'aggrappo',
        desc: 'salta contro un muro e tieni la direzione: ti aggrappi e scivoli piano. premi SPAZIO per staccarti con un salto. la formicona si arrampicava sui muri del municipio per non pagare l\'affitto: adesso lo fai anche tu.',
        key: 'spazio sul muro',
    },
    riflesso: {
        name: 'riflesso distorto',
        desc: 'premi G per evocare un clone che attira i nemici e incassa al posto tuo. rubato agli specchi di lametta, non dirglielo.',
        key: 'g',
    },
    risonante: {
        name: 'colpo risonante',
        desc: 'tieni premuto F per caricare, rilascia per sparare una barra perforante. la tecnokill di notino, ma con giudizio.',
        key: 'f (tieni premuto)',
    },
    rigenerazione: {
        name: 'frammento del rio merdone',
        desc: 'se non prendi colpi per un po\', la vita torna da sola. e nessun malus può più toccarti. il fiume non giudica, il fiume rigenera.',
        key: 'passiva',
    },
    analisi: {
        name: 'analisi 1',
        desc: 'premi H per scatenare una tempesta di teoremi attorno a te. le leggi matematiche come attacco. piema sarebbe fiero. o spaventato.',
        key: 'h',
    },
    scudo: {
        name: 'tommasoscudo',
        desc: 'premi R per una bolla che rimanda i proiettili al mittente. il frammento che alimentava la tommasorveglianza, riconvertito. assolutamente sicuro. 👍',
        key: 'r',
    },
    acquatossica: {
        name: 'acqua tossica',
        desc: 'premi V per versare a terra una pozza dell\'acqua di smela: i nemici che ci passano si avvelenano e rallentano. tu sei immune. la sua arma, rivolta contro di lei.',
        key: 'v',
    },
};

// mind door riddles
export const TRABOCCHETTI: Record<string, { q: string; options: string[]; correct: number }> = {
    'porta-teorema-1': {
        q: 'la porta chiede: «0,999 periodico, con TUTTI quei 9 fino in fondo, è:»',
        options: ['quasi 1, ma proprio quasi', 'esattamente 1', 'un numero che si crede furbo'],
        correct: 1,
    },
    'porta-teorema-2': {
        q: 'la porta chiede: «per attraversarmi devi prima fare metà strada, poi metà della metà, poi metà della... quante tappe ti servono?»',
        options: ['infinite, quindi resti lì per sempre', 'boh, tipo venti', 'infinite, e infatti passo lo stesso'],
        correct: 2,
    },
    'porta-teorema-3': {
        q: 'la porta chiede: «il citelis delle 7:40 parte in orario e viaggia a velocità infinita. quando arriva alla fermata?»',
        options: ['mai: il citelis non arriva, il citelis È', 'immediatamente', 'alle 7:40 spaccate'],
        correct: 0,
    },
};

export const TOASTS = {
    checkpoint: 'il microfono ti riconosce. tutto salvato. canta una volta sola.',
    barreRecovered: 'barre recuperate. non perderle più.',
    noFlow: 'flow insufficiente. colpisci qualcosa.',
    fragment: 'frammento della gecowave recuperato.',
    gugguDoor: 'guggu è scudato. senza ivan lo scalfisci appena.',
    lamettaAssorbe: 'lametta assorbe il colpo come colore. te l\'aveva detto.',
    colorDrop: 'goccia di colore raccolta.',
    mirrorOpen: 'lo specchio nero si è aperto. il nulla ti aspetta.',
    trenbolone: 'TRENBOLONE IN CIRCOLO: danni raddoppiati. ti senti benissimo. ti stai sbagliando.',
    trenboloneDrain: 'il trenbolone ti mangia da dentro.',
    smela: 'effetto smela III attivo. ogni tanto ti fermerai. non chiedere.',
    dispositivo: 'dispositivo della riba ottenuto: ora puoi entrare nella mente di piema.',
    quizErrore: 'risposta sbagliata. la mente di piema ti cancella.',
    portaAperta: 'risposta esatta. il teorema cede, la porta si dissolve.',
    scudo: 'tommasoscudo attivo: i proiettili tornano al mittente.',
    cuore: 'un cuore del realm. la vita massima aumenta per sempre.',
    inseguimento: 'LOCHEF85 TI HA VISTO. CORRI.',
    inseguimentoFine: 'lo hai seminato. per ora.',
    ombraImpara: 'l\'ombra conosce le tue mosse. cambiale.',
    patto: 'PATTO SIGLATO: tutto raddoppiato. il realm è tuo. per ora.',
    pattoAvviso1: 'il cielo si incrina ai bordi. qualcosa si è messo in viaggio.',
    pattoAvviso2: 'due luci all\'orizzonte. una viola, una bianca. arrivano INSIEME.',
    limiteScudo: 'il limite ti respinge: vizio di forma. servono i 3 indizi.',
    mascheraCompleta: 'tutte le maschere: il ritmo perfetto. attacchi più veloci, per sempre. un varco attivo si è aperto dove tutto è cominciato.',
    portalLocked: 'il varco non è attivo',
    portalBarrato: 'un varco attivo. profuma di gasolio e di loop. ci entri?',
    portalCustode: 'un varco che batte il tempo. dall\'altra parte qualcuno ti aspetta da molto.',
    doomsdayWarn1: 'il cielo si incrina ai bordi. il realm sta perdendo i pezzi. sbrigati.',
    doomsdayWarn2: 'glitch ovunque. il doomsday è vicino. pedro lo sente, e si muove.',
    doomsdayPedro: 'TROPPO TARDI. pedro ti ha raggiunto. sopravvivi o è la fine.',
};

export const WAVESUNG = {
    trenboloneAd: { sender: 'sponsor', text: 'TRENBOLONE! dona una nuova vita alla tua vita di merda! fatti di trenbolone! (messaggio promozionale non richiesto)' },
    ticummiPromo: { sender: 'ticummi', text: 'offerta a tempo: tommasorveglianza, solo 0,09€. assolutamente sicura! 👍🫶' },
    markolinoPiema: { sender: 'markolino', text: 'HO TROVATO PIEMA!! è alla ruhra e sta impazzendo per analisi 1. SALVALO. occhio alla riba, è scema ma morde.' },
    markolinoTana: { sender: 'markolino', text: 'CUSTODE RISPONDI. il tuo segnale è sparito vicino alla tana di lochef85. se leggi questo: NON MANGIARE NIENTE e NON GUARDARE I POSTER.' },
    piemaAiuto: { sender: 'piema', text: 'custode, ho un problema serio: lametta è sparito. le tracce portano a ticummi e alla sua tommasorveglianza. ti prego di intervenire. — p.' },
    ticummiArrabbiato: { sender: 'ticummi', text: 'hai distrutto la mia ombra e non sei nemmeno cliente. vieni in cantina a discuterne, sconosciuto. porta 0,09€ per il disturbo.' },
    ticummiClausola: { sender: 'ticummi', text: 'gentile cliente, la informiamo che è scattata la clausola 12: i suoi dati sono ora armi. la aspettiamo in cantina. grazie per la fiducia. 🫶' },
    samattGrazie: { sender: 'samatt', text: 'SCESO. sono SCESO. il realm è enorme e fermo, che meraviglia. guastalla sta riimparando a camminare in linea retta. grazie custode. — samatt (851 giri, record)' },
    markolinoVoid: { sender: 'markolino', text: 'romero ti ha portato nel VOID?? quel posto è fatto di rimpianti, non guardarli troppo a lungo. strappagli le verità e basta. io provo a raggiungerti.' },
    markolinoPedroMuove: { sender: 'markolino', text: 'NON È UN\'ESERCITAZIONE: pedro sta eseguendo l\'ordine. il realm si sta "raddrizzando". al nucleo, custode, ADESSO. lascia perdere le firme di romero.' },
    markolinoFinale: { sender: 'markolino', text: 'pedro ti aspetta al nucleo. qualsiasi cosa ti offra: è glitchata pure quella. fidati di me che mi fido di poco.' },
    smelaRecensione: { sender: 'smela', text: 'ho letto la tua recensione (la spada). messaggio ricevuto: smela springs chiude. apro un chiosco di sola acqua del rubinetto, dichiarata come tale. il realm non è pronto ma io sì.' },
    markolinoMaschere5: { sender: 'markolino', text: '3 maschere?? quelle sono le maschere del PRIMO custode, quello che faceva i dischi. continuano a guardarti? normale. continuano a piacerti? meno. cerca le altre, ne mancano due.' },
    markolinoMaschere10: { sender: 'markolino', text: 'TUTTE E CINQUE. le hai sentite, vero? battono il tempo. il primo custode lo chiamava "il ritmo perfetto": ogni colpo cade sul beat. ora mena come un disco d\'oro. e quel varco verde che è apparso... è casa sua. portaci rispetto.' },
};
