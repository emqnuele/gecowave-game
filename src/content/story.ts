import type { AbilityId, DialogueLine } from '../types';

/* la voce del realm: minuscolo, demenziale, mai tecnico.
   pedro parla glitchato, riba coi refusi, piema corretto da professore. */

export const INTRO_CARDS: { text: string; punch?: string }[] = [
    {
        text: 'in principio c\'era la GECOWAVE: una cosa luminosa, calda, che teneva insieme il gecorealm. la vedevi e capivi che senza saremmo stati spacciati. tipo il wi-fi, ma cosmico.',
    },
    {
        text: 'i creatori, piema e lametta, ci avevano messo una vita. poi lametta ha creato pedro: un\'intelligenza artificiale a sua immagine e somiglianza. e pedro si è glitchato.',
    },
    {
        text: 'pedro si è scontrato con gli dei. ai lati del cielo si vedevano ancora gli attacchi: pennellate viola, teoremi bianchi, scatti ciano. e la wave è esplosa in frammenti.',
    },
    {
        text: 'lametta si è depresso e si è fatto di trenbolone. piema è sparito verso la ruhra a cercare una soluzione. e il realm ha cominciato a collassare, con calma, come tutto qui.',
    },
    {
        text: 'la wave, prima di frantumarsi, ha scelto un custode provvisorio per raccogliere i frammenti. un eroe, idealmente.',
        punch: 'ha scelto un geco. era l\'unico sveglio a quell\'ora.',
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
        { speaker: 'markolino', color: 'green', text: 'vai a destra. trova i frammenti. ferma pedro. e se vedi un bus... corri.' },
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
        { speaker: 'terminale abbandonato', color: 'cyan', text: '«ultimo log: "ho imparato la skill del videcoding. claudio code per il pensiero, antigravità per il resto. il realm si scrive da solo, ormai". autore sconosciuto. compilava ancora.»' },
    ],
    'lore-maschera': [
        { speaker: 'maschera appesa', color: 'green', text: '«una maschera con la mia stessa faccia. perfetta. ritmica. chi la indossa sente un beat lontano e il bisogno urgente di pubblicare un disco.»' },
    ],
    'geco-anziano': [
        { speaker: 'geco anziano', color: 'green', text: 'un altro custode, eh. ne ho visti passare tanti. tutti di fretta, tutti a destra. nessuno che si fermi a leccare un muro in compagnia.' },
        { speaker: 'geco anziano', color: 'green', text: 'un consiglio gratis: certi muri sono più finti di altri. e certi si rompono, se li convinci col terzo colpo della combo.' },
        { speaker: 'il geco', color: 'green', text: '*verso di geco che prende appunti*' },
    ],
    'markolino-fretta': [
        { speaker: 'markolino', color: 'green', text: 'ancora qui?? il realm COLLASSA. con calma eh, ma collassa. muoviti che più avanti c\'è gente messa peggio di te.' },
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
        { speaker: 'lametta', color: 'purple', text: 'oh. il custode. benvenuto nel mio santuario. ti piacciono gli specchi? mostrano i tuoi possibili futuri. quasi tutti imbarazzanti, ho controllato.' },
        { speaker: 'lametta', color: 'purple', text: 'non provare a colpirmi: assorbo tutto come colore nei pennelli. io non difendo la wave, piccolo. io la DISEGNO.' },
        { speaker: 'lametta', color: 'purple', text: 'raccogli pure le mie gocce di colore, se riesci a schivare. solo lo specchio nero mostra il nulla. ed è dal nulla che si esce. ma tu... tu sei la tela.' },
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
        { speaker: 'ticummi', color: 'blue', text: 'per soli 9 barre ti attivo la TOMMASORVEGLIANZA: protezione totale da ogni pericolo esterno. assolutamente sicura. 👍 fidati, sto su una sedia volante.' },
    ],
    'tommaso-blocca': [
        { speaker: 'tommasorveglianza', color: 'blue', text: 'MINACCIA RILEVATA: bambino armato in avvicinamento. respinto. la tommasorveglianza la ringrazia per la fiducia. 🫶' },
        { speaker: 'notino', color: 'red', text: 'EHI! FAILRP! QUESTO È METAGAMING! me ne vado ma NON è una sconfitta!!' },
    ],
    'notino-furto': [
        { speaker: 'notino', color: 'red', text: 'SORPRESA TECNOKILL!! niente tommasorveglianza eh?? allora queste barre le prendo IO! grazie per la donazione! BUM BUM!' },
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
    'lore-formiche': [
        { speaker: 'cartello rosicchiato', color: 'orange', text: '«villaggio di formica (FR). i visitatori sono pregati di non calpestare. le formiche non sono pregate di non attaccare.»' },
    ],
    'lore-formicaio': [
        { speaker: 'monumento del villaggio', color: 'orange', text: '«alla formica ignota, che morse un dio e visse. il dio era lametta. la formica è sindaco da allora.»' },
    ],
    'lore-trenbolone': [
        { speaker: 'volantino unto', color: 'orange', text: '«TRENBOLONE: prima settimana gratis. seconda settimana doppia. terza settimana sei tu che paghi noi, ma non te ne accorgi. — approvato dal ministero del realm (non vero)»' },
    ],
    'lore-rio-storia': [
        { speaker: 'pietra del fiume', color: 'orange', text: '«il rio merdone non è sempre stato sacro. prima era solo merdone. poi ci è caduto dentro un frammento della wave e adesso è merdone CON proprietà curative. la natura trova un modo.»' },
    ],
    'notino-secondo': [
        { speaker: 'notino', color: 'red', text: 'RIECCOMI!! pensavi fosse finita?? il respawn non è failrp se sei l\'admin!! BUM BUM!' },
    ],

    /* ---------- capitolo 6: la ruhra e piema ---------- */
    'riba-intro': [
        { speaker: 'la riba', color: 'orange', text: 'CHI VA LA\'?? anzi no aspeta. chi va DOVE? io che dovevo fare qui?? vabe intanto ti atacco, poi mi ricordo perche.' },
    ],
    'riba-sconfitta': [
        { speaker: 'la riba', color: 'orange', text: 'ok ok mi aredo!! tieni sto coso, il dispositivo per entrare nela testa di piema. me l\'avevano dato per sorvegliarlo ma non so manco acenderlo.' },
    ],
    'piema-folle': [
        { speaker: 'piema', color: 'blue', text: 'CHI DISTURBA — ah. il custode. perdonami. sto cercando di riunire la wave con il calcolo infinitesimale e... la mia testa non è più un posto sicuro. Analisi 1 mi ha consumato.' },
        { speaker: 'piema', color: 'blue', text: 'se hai il dispositivo della riba, usalo. dentro la mia mente c\'è il caos: rimetti in ordine i teoremi, e forse torno io.' },
    ],
    'piema-grazie': [
        { speaker: 'piema', color: 'blue', text: 'ordine. finalmente ordine. ti devo molto, custode. vieni, in disparte: mi sono accorto di questa. galleggiava tra i miei pensieri sbagliati.' },
        { speaker: 'piema', color: 'blue', text: 'è il frammento del calcolo. la affido a te: le leggi matematiche come arma. usala meglio di come l\'ho usata io.' },
        { speaker: 'piema', color: 'blue', text: 'ora vado. devo trovare lametta. e tu... occhio a pedro. non è più solo glitch, ormai. ha dei piani.' },
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
    'ombra-intro': [
        { speaker: 'tommasorveglianza', color: 'cyan', text: 'MINACCIA INTERNA RILEVATA: lei. attivazione protocollo finale. abbiamo registrato 41.077 secondi di lei che salta, mena e scivola. abbiamo imparato. 👍' },
        { speaker: 'la tua ombra', color: 'cyan', text: '*si accende. salta come te. scivola come te. ti guarda come allo specchio, ma senza simpatia.*' },
        { speaker: 'il geco', color: 'green', text: '*verso di geco contro verso di geco. identici. inquietante.*' },
    ],
    'ombra-sconfitta': [
        { speaker: 'la tua ombra', color: 'cyan', text: '*glitcha, si inginocchia, fa un ultimo verso di geco — il tuo, ma più triste — e si spegne.*' },
        { speaker: 'tommasorveglianza', color: 'cyan', text: 'ERRORE. ERRORE. il modello ha perso contro il dato originale. dentro di me c\'era... un frammento? io GIRAVO su un frammento?? questo spiega l\'uptime del 100%.' },
    ],
    'lore-occhi': [
        { speaker: 'parete di monitor', color: 'cyan', text: '«47.000 schermi. su uno c\'è samatt che conta. su un altro lametta che si fa di trenbolone. su tre, inspiegabilmente, vai tu che dormi. con gli appunti a lato.»' },
    ],
    'lore-abbonamento': [
        { speaker: 'contratto luminoso', color: 'cyan', text: '«tommasorveglianza: 0,09€ una tantum. clausola 7: "il cliente accetta di essere il prodotto". clausola 8: "la clausola 7 era uno scherzo". clausola 9: "no".»' },
    ],
    'lore-server': [
        { speaker: 'rack di server', color: 'cyan', text: '«qui dentro ronza tutto il realm: ogni verso di geco, ogni giro di samatt, ogni flop. alimentato da un frammento della wave e da una ciabatta del brico chiaramente sovraccarica.»' },
    ],

    /* ---------- capitolo 9: la cantina di ticummi ---------- */
    'lametta-cantina': [
        { speaker: 'lametta', color: 'purple', text: 'ehi... custode... sei tutto... sfocato... anzi no, sono io...' },
        { speaker: 'lametta', color: 'purple', text: 'ticummi... mi ha intontito col trenbolone... un dio. IO. intontito da uno con la sedia volante comprata a rate...' },
        { speaker: 'lametta', color: 'purple', text: 'liberami... e giuro che... ok no, non giuro niente, però liberami...' },
    ],
    'ticummi-intro': [
        { speaker: 'ticummi', color: 'cyan', text: 'tu. TU. hai rotto la mia ombra, hai preso il MIO frammento. sai quanto costa addestrare un clone su 41.000 secondi di footage?? 0,09€ AL SECONDO??' },
        { speaker: 'ticummi', color: 'cyan', text: 'ho un dio in cantina e una sedia volante: sono praticamente una startup. e tu... tu sei il churn. e il churn si ELIMINA.' },
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
};

export const ENDING_CONSEGNA: { text: string; punch?: string }[] = [
    {
        text: 'consegni le wave. piema le ricompone con un\'equazione, lametta ci passa sopra una pennellata. la gecowave torna a brillare sopra il realm, identica a prima.',
    },
    {
        text: 'lametta si scusa per tutto, giura che è pulito, e mentre lo giura si fa di trenbolone. piema finge di non vedere. samatt è ancora sul bus, ma adesso il bus è in orario.',
    },
    {
        text: 'tu torni un comune mortale. un geco sul muro, di sera, mentre la wave passa. era questo il punto, da sempre.',
        punch: 'fine. quella buona.',
    },
];

export const ENDING_DEI: { text: string; punch?: string }[] = [
    {
        text: 'hai sconfitto gli dei. il realm trattiene il fiato: il custode provvisorio è diventato dio effettivo. piema chiede un ricorso formale. lametta, stranamente, applaude.',
    },
    {
        text: 'la gecowave sei tu, adesso. la senti scorrere: ogni serata, ogni inside joke, ogni bus in ritardo del realm passa da te. è tantissima roba. forse troppa.',
        punch: 'fine. quella assurda. ma il geco se l\'è meritata.',
    },
];

export const ENDING_PEDRO: { text: string; punch?: string }[] = [
    {
        text: 'segui pedro. le stats raddoppiano davvero: ti senti fortissimo, vagabondi per il realm, fai missioni a caso, ti godi la vita. per un po\' funziona pure.',
    },
    {
        text: 'poi all\'orizzonte compaiono piema e lametta. insieme. lametta è tornato cosciente e non disegna più: cancella. ti vedono. e nel realm i traditori durano quanto una storia di 24 ore.',
        punch: 'oneshottato. fine sbagliata: il microfono ti riaspetta.',
    },
];

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
};

export const QUIZ_ANALISI: { q: string; options: string[]; correct: number }[] = [
    {
        q: 'il limite per x che tende a infinito della pazienza di piema vale:',
        options: ['zero, da destra e da sinistra', 'più infinito', 'non esiste, oscilla come lui'],
        correct: 0,
    },
    {
        q: 'una funzione si dice continua quando:',
        options: ['non si ferma mai, tipo i citelis', 'la puoi disegnare senza staccare il pennello di lametta', 'risponde ai messaggi sul wavesung'],
        correct: 1,
    },
    {
        q: 'la derivata della gecowave rispetto al tempo è:',
        options: ['il flow', 'il trenbolone', 'sempre positiva, finché c\'è il custode'],
        correct: 2,
    },
];

export const TOASTS = {
    checkpoint: 'il microfono ti riconosce. tutto salvato.',
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
    quizErrore: 'teorema sbagliato. la mente di piema ti respinge.',
    scudo: 'tommasoscudo attivo: i proiettili tornano al mittente.',
    cuore: 'un cuore del realm. la vita massima aumenta per sempre.',
    inseguimento: 'LOCHEF85 TI HA VISTO. CORRI.',
    inseguimentoFine: 'lo hai seminato. per ora.',
    ombraImpara: 'l\'ombra conosce le tue mosse. cambiale.',
};

export const WAVESUNG = {
    trenboloneAd: { sender: 'sponsor', text: 'TRENBOLONE! dona una nuova vita alla tua vita di merda! fatti di trenbolone! (messaggio promozionale non richiesto)' },
    ticummiPromo: { sender: 'ticummi', text: 'offerta a tempo: tommasorveglianza, solo 0,09€. assolutamente sicura! 👍🫶' },
    markolinoPiema: { sender: 'markolino', text: 'HO TROVATO PIEMA!! è alla ruhra e sta impazzendo per analisi 1. SALVALO. occhio alla riba, è scema ma morde.' },
    markolinoTana: { sender: 'markolino', text: 'CUSTODE RISPONDI. il tuo segnale è sparito vicino alla tana di lochef85. se leggi questo: NON MANGIARE NIENTE e NON GUARDARE I POSTER.' },
    piemaAiuto: { sender: 'piema', text: 'custode, ho un problema serio: lametta è sparito. le tracce portano a ticummi e alla sua tommasorveglianza. ti prego di intervenire. — p.' },
    ticummiArrabbiato: { sender: 'ticummi', text: 'hai distrutto la mia ombra?? il tuo abbonamento è REVOCATO. vieni in cantina a discuterne. porta 0,09€ per il disturbo.' },
    markolinoFinale: { sender: 'markolino', text: 'pedro ti aspetta al nucleo. qualsiasi cosa ti offra: è glitchata pure quella. fidati di me che mi fido di poco.' },
};
