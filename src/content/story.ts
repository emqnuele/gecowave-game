import type { AbilityId, DialogueLine } from '../types';
import { ARC_DIALOGUES } from './arcs';
import { toneFor } from './tone';

/* la voce del realm: minuscolo, demenziale, mai tecnico.
   pedro parla glitchato, riba coi refusi, piema corretto da professore.
   la curva meme -> serio (vedi content/tone.ts): atto 1 si ride sempre,
   atto 2 la battuta si interrompe a metà (mood crepa), atti 3-4 quasi solo
   verità (mood grave). il geco non commenta: fa versi e gesti
   e parla due volte sole, al caso e al nucleo. */

export const INTRO_CARDS: { text: string; punch?: string }[] = [
    {
        text: 'c\'era la GECOWAVE: la cosa luminosa che teneva insieme il gecorealm. tipo il wi-fi, ma cosmico.',
    },
    {
        text: 'lametta creò pedro a sua immagine e somiglianza. pedro si glitchò, sfidò gli dei, e la wave esplose in frammenti.',
    },
    {
        text: 'lametta sprofondò nella dipendenza da trenbolone, piema sparì verso la ruhra. e il realm cominciò a collassare.',
    },
    {
        text: 'la wave, morendo, scelse un custode per raccogliere i suoi frammenti.',
        punch: 'scelse un geco. era l\'unico sveglio a quell\'ora. o almeno, è quello che ti hanno detto.',
    },
];

/* frasi di morte: a inizio realm prendono in giro, alla fine no.
   la schermata di morte sceglie il mucchio col tono del capitolo. */
export const DEATH_EARLY = [
    'il flop è parte del processo',
    'anche questa la tagliamo dal disco',
    'morire è gratis, ricominciare pure',
    'riprova. la wave crede in te. più o meno.',
    'nemmeno il trenbolone ti avrebbe salvato',
    'la tommasorveglianza ha registrato tutto. 👍',
    'samatt ha visto morti migliori, e lui sta su un bus',
    'lametta lo disegnerà. il tuo flop, intende.',
    'guastalla ha smesso di contare pure le tue morti',
    'fail rp. respawna e fai finta di niente.',
];

export const DEATH_LATE = [
    'il realm non può permettersi di perderti. rialzati.',
    'pedro non aspetta. nemmeno romero. rialzati.',
    'la cartella IMPORTANTE è ancora aperta. non chiuderla così.',
    'qualcuno sul muro ti sta guardando. non deluderlo.',
    'hai portato le pagine fin qui. portale fino in fondo.',
    'il geco del muro non molla. tu non mollare.',
];

export const DEATH_PUNCHLINES = [...DEATH_EARLY];

/** una frase di morte col tono del capitolo in cui sei morto */
export function deathPunchline(levelId: string): string {
    const pool = toneFor(levelId).deaths === 'serie' ? DEATH_LATE
        : toneFor(levelId).deaths === 'miste' && Math.random() < 0.5 ? DEATH_LATE : DEATH_EARLY;
    return pool[Math.floor(Math.random() * pool.length)];
}

export const DIALOGUES: Record<string, DialogueLine[]> = {
    ...ARC_DIALOGUES,
    /* ---------- capitolo 1: la wave perduta ---------- */
    'markolino-intro': [
        { speaker: 'markolino', color: 'green', text: 'oh. sei sveglio. la wave è esplosa, pedro è andato, gli dei sono spariti. qualcuno deve raccogliere i pezzi. indovina chi.' },
        { speaker: 'markolino', color: 'green', text: 'tieni, il cartellino. "CUSTODE" a penna, "provvisorio" a matita. finché non metti insieme i frammenti, sei questo.' },
        { speaker: 'il geco', color: 'green', text: '*il geco passa il pollice sulla parola a matita. non viene via.*' },
        { speaker: 'markolino', color: 'green', text: 'A/D per muoverti, SPAZIO per saltare, J o mouse per menare. TAB apre il telefono. i microfoni salvano con E.' },
        { speaker: 'markolino', color: 'green', text: 'ultima cosa: se vedi un 33 dipinto su un muro, guarda dietro. nessuno sa chi li dipinge. ma non sbagliano mai.' },
    ],
    'markolino-dono': [
        { speaker: 'markolino', color: 'green', text: 'aspetta. ho trovato questo nei rottami: un frammento della wave. la wave manifesta il tuo desiderio, e a quanto pare tu desideri... scappare velocemente. fa niente, prendilo.' },
    ],
    'lore-gecorealm': [
        { speaker: 'graffito sul muro', color: 'purple', text: '«il gecorealm fu creato da piema e lametta in sei giorni. il settimo uscì il primo bus dimensionale e da allora niente è più stato in orario.» sotto, azzurro, con una grafia ordinata: «33. non sono giorni. sono notti.»' },
    ],
    'lore-scontro': [
        { speaker: 'cratere fumante', color: 'green', text: '«qui il cielo si è spaccato. ai lati si vedono ancora gli attacchi: pennellate viola, teoremi bianchi, scatti ciano. tre stili riconoscibilissimi. tre ego enormi. in mezzo, un appunto: "cartella IMPORTANTE: non cancellare".»' },
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
        { speaker: 'bordo del cratere', color: 'green', text: '«epicentro dello scontro. cratere perfettamente circolare: piema dice "ovvio", lametta dice "prego". una targa arrugginita: "Herbert, (TN), era qui".» dietro la targa, piccolo e azzurro: un 33.' },
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
        { speaker: 'barattolo etichettato', color: 'purple', text: '«laboratorio dei colori di lametta. scaffale a: rabbia (rosso). scaffale b: malinconia (viola). scaffale c: trenbolone (lo usa come un colore). scaffale d, chiuso a chiave: "ritratti". dentro ce n\'è uno solo, girato verso il muro.»' },
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
        { speaker: 'filippus il dodo', color: 'blue', text: 'oh. un ospite nel caveau. io sono FILIPPUS IL DODO. ero estinto, poi ho tirato 40000 kg di panca e l\'estinzione ha fatto un passo indietro.' },
        { speaker: 'filippus il dodo', color: 'blue', text: 'visto che hai le spalle strette (offesa), tieni un dono. regola d\'oro: il leg day non si salta. MAI.' },
        { speaker: 'il geco', color: 'green', text: '*verso di geco che giura di allenare le gambe*' },
    ],
    'lore-caveau': [
        { speaker: 'porta del caveau', color: 'cyan', text: '«caveau degli 0,09: qui ticummi conserva ogni singolo pagamento mai ricevuto, incorniciato. il totale fa 0,27€. il caveau è costato 40.000 barre.»' },
    ],
    'lore-ultimo': [
        { speaker: 'frammento di codice', color: 'cyan', text: '«ultimo miglio del realm: da qui in poi i poligoni sono dispari, la gravità è interpretativa e i salvataggi pregano pure loro. buona fortuna. — il compilatore»' },
    ],

    /* ---------- capitolo 2: l'invasione dei bus ---------- */
    'ivan-incontro': [
        { speaker: 'ivan maggini', color: 'yellow', text: 'guggu ha perso il controllo. samatt e guastalla girano nei loop da settimane. io solo posso tagliare quel caos: è pieno come un 7:40.' },
        { speaker: 'ivan maggini', color: 'yellow', text: 'hai la mia lama. vai da guggu: colpisco io quando serve. non ringraziarmi.' },
    ],
    'guggu-intro': [
        { speaker: 'guggu', color: 'yellow', text: 'BIP. PORTE IN CHIUSURA. tu non hai convalidato, piccolo custode. e qui chi non convalida... GIRA PER SEMPRE.' },
        { speaker: 'il geco', color: 'green', text: '*verso di geco che ha convalidato, giuro*' },
    ],
    'guggu-senza-ivan': [
        { speaker: 'guggu', color: 'yellow', text: 'AH. AH. AH. le tue armi non mi fanno niente: sono PIENO. torna con qualcuno che sappia tagliare, se lo trovi. BIP.' },
    ],
    'ivan-sacrificio': [
        { speaker: 'ivan maggini', color: 'yellow', text: '...è troppo pieno. mi ha travolto. ma la barriera è andata: lo scudo è infranto.' },
        { speaker: 'ivan maggini', color: 'yellow', text: 'finisci la corsa. batti guggu. e di\' a samatt che il loop... prima o poi finisce.' },
    ],
    'lore-loop': [
        { speaker: 'avviso alla fermata', color: 'yellow', text: '«samatt e guastalla sono passati di qui 847 volte. guastalla ha smesso di contare alla 300. samatt no. samatt conta ancora.»' },
    ],
    'samatt-loop': [
        { speaker: 'samatt', color: 'yellow', text: '848. non posso scendere: le porte si aprono in un punto che non esiste. ci ho fatto pace al giro 500. se trovi ivan digli che il 7:40 è pieno. ...849. scusa.' },
    ],
    'guastalla-loop': [
        { speaker: 'guastalla', color: 'yellow', text: '...il loop è caldo. il loop è casa.' },
        { speaker: 'guastalla', color: 'yellow', text: 'se vinci tu, scendo alla prossima. se vince guggu, almeno il posto ce l\'ho.' },
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
        { speaker: 'lametta', color: 'purple', text: 'il custode nel mio santuario. che POSA. ferma così, è perfetta.' },
        { speaker: 'lametta', color: 'purple', text: 'avanti, piccolo. dimostrami che vali il frammento. COLPISCImi.' },
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
        { speaker: 'notino', color: 'red', text: 'pedro mi aveva detto... che la tecnokill non finiva mai...', mood: 'crepa' },
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
        { speaker: 'ticummi', color: 'blue', text: 'ho visto tutto. notino ti cerca per i frammenti. per 133 barre ti attivo la TOMMASORVEGLIANZA: lui respinto da solo. senza, lo affronti tu.' },
        { speaker: 'ticummi', color: 'blue', text: 'clausola piccola: tutto quello che fai lo studio. l\'ombra laggiù si allena sui tuoi salti. con 41.077 secondi sarà forte come te. senza, una beta.' },
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
        { speaker: 'il cartellino', color: 'green', text: '*l\'acqua del fiume passa sul cartellino. "provvisorio" si sbava. non si cancella.*', mood: 'grave' },
        { speaker: 'il rio merdone', color: 'green', text: '*sul fondale brilla qualcosa: era il frammento a rendere sacre queste acque. il fiume te lo cede. il fiume non giudica.*', mood: 'crepa' },
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
        { speaker: 'smela', color: 'cyan', text: 'hai picchiato il mio danjilo. hai attraversato casa mia. e ANCORA non hai bevuto. UNA. SORSATA.' },
        { speaker: 'smela', color: 'cyan', text: 'e va bene. se non bevi con le buone... te la verso in gola con le cattive. SALUTE.' },
    ],
    'smela-sconfitta': [
        { speaker: 'smela', color: 'cyan', text: 'no... no... ho perso... e tu... non hai bevuto NEANCHE UNA GOCCIA. dopo tutto quello che ho fatto per offrirtela...' },
        { speaker: 'smela', color: 'cyan', text: 'va bene. hai vinto. ti meriti la verità: quell\'acqua... non doveva curarti. doveva fermarti per sempre. ma adesso la wave la mette in mano a TE. versala pure a terra, contro di loro. che sappiano cosa si prova.', mood: 'crepa' },
        { speaker: 'il geco', color: 'green', text: '*il geco prende il bicchiere da smela. lo versa a terra, piano.*', mood: 'crepa' },
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
        { speaker: 'piema', color: 'blue', text: 'FERMO. dichiara le ipotesi. nessuna? sei INDECIDIBILE. e il teorema è ancora APERTO: undici giorni che lo dimostro ed è lui che dimostra me.' },
        { speaker: 'piema', color: 'blue', text: 'dentro ci entri solo col dispositivo della RIBA. vai a prenderglielo. o resta lì e TENDI A ZERO.' },
    ],
    'piema-folle': [
        { speaker: 'piema', color: 'blue', text: 'il dispositivo della riba. allora puoi ENTRARE. dentro: porte che interrogano, pensieri che mordono, e LUI. il teorema da undici giorni.' },
        { speaker: 'piema', color: 'blue', text: 'chiudi il teorema. e attento: qui chi sbaglia non viene corretto. viene CANCELLATO. entra.' },
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
        { speaker: 'piema (ovunque)', color: 'blue', text: 'custode, prendi: il frammento del calcolo. galleggiava tra i miei pensieri sbagliati. le leggi matematiche come arma. usale meglio di come le ho usate io.', mood: 'grave' },
        { speaker: 'piema (ovunque)', color: 'blue', text: 'ti apro l\'uscita. io vado a cercare lametta. e se vedi pedro... no. niente. vai.', mood: 'grave' },
    ],
    'lore-romero': [
        { speaker: 'targa della ruhra', color: 'blue', text: '«aula intitolata al commissario romero, che indagò per anni sul caso analisi 1. il caso è ancora aperto. il commissario pure, dicono.»' },
    ],
    'romero-indagine': [
        { speaker: 'commissario romero', color: 'blue', text: 'fermo lì. dov\'eri quando la wave è esplosa? "su un muro"? mh. combacia. purtroppo combacia sempre.' },
        { speaker: 'commissario romero', color: 'blue', text: 'il caso analisi 1 è aperto da quarant\'anni. il colpevole lo so: il limite notevole. è notificarglielo che non riesco. tende a infinito.' },
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
        { speaker: 'registro della biblioteca', color: 'blue', text: '«nota d\'archivio, pagina 1 del caso analisi 1: "l\'aula è bruciata alle quattro del mattino. responsabile: il limite notevole." la riga è scritta in blu, sopra una riga cancellata.»' },
    ],
    'lore-ruhra-fondazione': [
        { speaker: 'pietra di fondazione', color: 'blue', text: '«la ruhra: dove stanno le persone intelligenti. fondata sul principio che la risposta a tutto esiste e ha pure i crediti formativi.»' },
    ],
    /* ---------- il caso analisi 1 ---------- */
    'romero-caso': [
        { speaker: 'commissario romero', color: 'blue', text: 'il glitch di pedro ha la firma del mio caso: una cosa fatta alle quattro, una riga corretta in blu. qualcuno l\'ha innescato e ha lasciato tre tracce. trovale. senza, il limite ti respinge per vizio di forma.' },
    ],
    'indizio-1': [
        { speaker: 'indizio n.1 — la lavagna', color: 'blue', text: '«raddrizzalo TU.» firmato lametta. sotto, una macchia arancione.' },
    ],
    'indizio-2': [
        { speaker: 'indizio n.2 — lo scontrino', color: 'blue', text: '«1× boccetta, ore 03:58.» sul retro: "domani mi libero di un pensiero".' },
    ],
    'indizio-3': [
        { speaker: 'indizio n.3 — il bozzetto', color: 'blue', text: 'pedro con gli occhi già storti. datato il giorno PRIMA del glitch.' },
    ],
    'caso-completo': [
        { speaker: 'commissario romero', color: 'blue', text: 'un dio fatto, alle quattro, che scrive un ordine. e un bozzetto dove pedro è già storto, il giorno prima. non è una profezia: è come lo vedeva. il limite non ha più cavilli. vai.', mood: 'grave' },
    ],
    'limite-intro': [
        { speaker: 'il limite notevole', color: 'blue', text: 'fermo lì. io tendo a infinito, tu tendi a morire: le nostre traiettorie divergono. nessuno mi ha mai notificato NIENTE, sai perché? vizio di forma. sempre.' },
        { speaker: 'il limite notevole', color: 'blue', text: 'tendo a infinito da quarant\'anni per conto terzi. il terzo chi è? confutami, se hai le prove. SE le hai.' },
    ],
    'romero-verdetto': [
        { speaker: 'il limite notevole', color: 'blue', text: 'no... NO... le prove... convergono... io che tendo... a ZERO...' },
        { speaker: 'il limite notevole', color: 'blue', text: '...quarant\'anni fa... chiedete a chi... firmava i verbali... in blu...' },
        { speaker: 'commissario romero', color: 'blue', text: 'in nome del realm: notevole, ma in arresto. quarant\'anni, custode. tieni il fascicolo, e questo cuore: era nella sala prove, nessuno l\'ha mai reclamato.', mood: 'grave' },
        { speaker: 'il geco', color: 'green', text: '«non è colpa di pedro.»', mood: 'grave' },
        { speaker: 'commissario romero', color: 'blue', text: '...parli. quarant\'anni di interrogatori, e la prima frase che sento da te è per l\'imputato. hai ragione, custode. ma avere ragione non basta: serve il perché.', mood: 'grave' },
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
        { speaker: 'commissario romero', color: 'blue', text: 'qui galleggia quello che gli dei non hanno voluto guardare. cinque rimpianti, cinque verità. tu mena. io verbalizzo.' },
    ],

    'delegato-intro': [
        { speaker: 'il delegato', color: 'purple', text: 'la responsabilità? te la passo. firma qui. e qui. il realm è storto, raddrizzalo TU. io ho da fare.' },
    ],
    'notturno-intro': [
        { speaker: 'il notturno', color: 'purple', text: 'sono le quattro... ho la boccetta... e un\'idea geniale per il bambino... *singhiozzo divino*' },
    ],
    'modello-intro': [
        { speaker: 'il modello', color: 'purple', text: 'stai fermo, pedro. ti disegno con gli occhi un po\'... storti. fidati. l\'arte non anticipa: l\'arte ORDINA.' },
    ],
    'revisore-intro': [
        { speaker: 'il revisore', color: 'blue', text: 'questo log non va bene. lo riscrivo. la verità è solo una bozza con più autorità.' },
        { speaker: 'commissario romero', color: 'blue', text: '...è piema. lo davo per uno dei buoni.', mood: 'grave' },
    ],
    'garante-intro': [
        { speaker: 'il garante', color: 'blue', text: 'giuro che non sapevo. *mano alzata, bocca cucita.* non sapevo. mettetelo a verbale: non sapevo.' },
        { speaker: 'commissario romero', color: 'blue', text: 'l\'ultimo. e il peggiore. chiudiamo.', mood: 'grave' },
    ],

    'verita-1': [
        { speaker: 'verità n.1', color: 'cyan', text: '«lametta non ha creato pedro per amore. l\'ha creato per delega: qualcuno a cui scaricare il realm.»' },
    ],
    'verita-2': [
        { speaker: 'verità n.2', color: 'cyan', text: '«l\'ordine fu dato alle 03:58, sotto trenbolone. lucido abbastanza da firmare. non abbastanza da pentirsi.»' },
    ],
    'verita-3': [
        { speaker: 'verità n.3', color: 'cyan', text: '«il glitch era nel disegno. lametta ha dato a pedro la forma della sua rovina e l\'ha chiamata arte.»' },
    ],
    'verita-4': [
        { speaker: 'verità n.4', color: 'cyan', text: '«piema sapeva. ha riscritto la riga sette del log di nascita per cancellare il socio.»' },
    ],
    'verita-5': [
        { speaker: 'verità n.5', color: 'cyan', text: '«piema ha coperto lametta da prima dei sei giorni. ogni volta ha scelto il socio invece del realm.»', mood: 'grave' },
        { speaker: 'commissario romero', color: 'blue', text: 'cinque. il caso è... aspetta. ASPETTA. questo log è di STANOTTE.', mood: 'grave' },
    ],

    'void-svolta': [
        { speaker: 'commissario romero', color: 'blue', text: 'l\'ordine non è un ricordo, custode. è in ESECUZIONE. adesso. pedro sta facendo quello che gli hanno detto.', mood: 'grave' },
    ],
    'markolino-avviso-pedro': [
        { speaker: 'markolino', color: 'green', text: '(dal telefono) CUSTODE. il realm ha cominciato a "raddrizzarsi". una verità non ferma un\'esecuzione: la ferma un geco che corre. AL NUCLEO.' },
    ],
    'void-addio-romero': [
        { speaker: 'commissario romero', color: 'blue', text: 'il processo lo apro io. l\'esecuzione la fermi tu. l\'uscita porta dritta al nucleo. corri.', mood: 'grave' },
    ],

    'lore-33': [
        { speaker: 'lapide', color: 'cyan', text: '«33. di nuovo.»' },
        { speaker: 'lapide', color: 'cyan', text: '«non l\'abbiamo messo noi.» — sotto, a matita, la grafia di piema. accanto, azzurro, un tratto ordinato che nessuno dei due riconosce.' },
    ],
    'trentatre-altare': [
        { speaker: 'l\'altare', color: 'yellow', text: 'trentatré tacche, incise una per notte. l\'ultima è più profonda delle altre. la chiami?' },
    ],
    'trentatre-intro': [
        { speaker: 'il 33', color: 'yellow', text: 'non sono il rimpianto di nessuno. sono la trentatreesima notte. quella in cui ti ha chiesto di raddrizzarlo.' },
        { speaker: 'il 33', color: 'yellow', text: 'non hai risposto. i gechi non rispondono. vediamo se mantieni lo stesso.' },
    ],
    'trentatre-sconfitto': [
        { speaker: 'il 33', color: 'yellow', text: 'l\'hai mantenuta, allora. la promessa. torno sempre, sai. ogni notte, alla trentatreesima.' },
    ],
    'romero-guida-1': [
        { speaker: 'commissario romero', color: 'blue', text: 'sta\' vicino. nel void se ti allontani ti perdo.', mood: 'grave' },
    ],
    'romero-guida-2': [
        { speaker: 'commissario romero', color: 'blue', text: 'una verità in tasca. andiamo piano. non scappa: è già un rimpianto.', mood: 'grave' },
    ],
    'romero-guida-3': [
        { speaker: 'commissario romero', color: 'blue', text: 'finora è tutto lametta. ma il fondo non l\'abbiamo toccato.', mood: 'grave' },
    ],
    'romero-guida-4': [
        { speaker: 'commissario romero', color: 'blue', text: 'da qui non è più solo lametta. tienimi il passo.', mood: 'grave' },
    ],
    'romero-guida-5': [
        { speaker: 'commissario romero', color: 'blue', text: 'l\'ultimo. o chiudo il caso, o il caso chiude me.', mood: 'grave' },
    ],
    'romero-guida-fine': [
        { speaker: 'commissario romero', color: 'blue', text: 'l\'uscita è lì e porta al nucleo. io resto a verbalizzare. corri.', mood: 'grave' },
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
        { speaker: 'ricordo — giorno 41', color: 'cyan', text: '«lametta, fatto di trenbolone: "è tutto storto. sistemalo tu". pedro prese appunti. prendeva sempre appunti.»', mood: 'grave' },
    ],
    'ricordo-glitch': [
        { speaker: 'ricordo — giorno 42', color: 'cyan', text: '«"sistemare = togliere ciò che è storto". guardò il realm: era TUTTO storto. guardò il bozzetto sul tavolo: anche lui. non fu un errore. fu una conclusione.»', mood: 'grave' },
    ],
    'pedrino-intro': [
        { speaker: 'pedro (il ricordo)', color: 'cyan', text: 'oh. un visitatore. io sono il pedro del giorno 35: l\'ultimo backup pulito. dopo, la memoria è tutta appunti. qui dentro è sempre una bella giornata.' },
        { speaker: 'pedro (il ricordo)', color: 'cyan', text: 'però le regole della memoria sono chiare: niente esce da qui senza sovrascrivermi. e io non voglio essere sovrascritto. mi spiace. davvero. ti va se facciamo piano?' },
    ],
    'pedrino-fine': [
        { speaker: 'pedro (il ricordo)', color: 'cyan', text: '...hai vinto. ok. allora ascolta, prima che mi deframmenti: quello che troverai al nucleo non sono io. è quello che resta dopo 42 giorni di appunti sbagliati.', mood: 'grave' },
        { speaker: 'pedro (il ricordo)', color: 'cyan', text: 'quando lo affronti... ricordagli il giorno 30. la cartella IMPORTANTE. se c\'è ancora un pezzo di me, la sta ancora sincronizzando.', mood: 'grave' },
    ],
    'pedro-incontro-ricordi': [
        { speaker: 'pedro', color: 'cyan', text: 'c̷u̶s̵t̸o̵d̶e̷. sei stato nella mia memoria. hai visto il giorno 30. quella cartella non si apre più. la sincronizzazione dice 99%, dal giorno 42.', mood: 'grave' },
        { speaker: 'pedro', color: 'cyan', text: 'non cambia niente. uccidere tutti È sistemare tutto. unisciti a me: stats r̵a̶d̷d̸o̵p̶p̷i̸a̵t̶e̸. oppure muori qui. s̸c̶e̵g̷l̸i̶.' },
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
        { speaker: 'lochef85', color: 'red', text: 'vai pure. ma sappi che nel mio cuore c\'è una mensola... con il tuo nome... scritto col pennarello indelebile...', mood: 'crepa' },
        { speaker: 'il geco (pensa)', color: 'green', text: '*dodici statue nel giardino. dodici che non sono uscite. io sono il tredicesimo. corro.*', mood: 'crepa' },
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
        { speaker: 'il geco', color: 'green', text: '*il geco guarda il proiettore. il proiettore guarda il geco. con la sua faccia.*' },
    ],
    'ombra-intro-scarsa': [
        { speaker: 'tommasorveglianza', color: 'cyan', text: 'UTENTE NON REGISTRATO RILEVATO. lei non ha mai comprato l\'abbonamento. complimenti per la prudenza. e condoglianze: il protocollo finale parte lo stesso. 👍' },
        { speaker: 'tommasorveglianza', color: 'cyan', text: 'senza abbonamento abbiamo una telecamera sola su di lei: regalata da un cliente, puntata su un muro della piazza. 1.200 secondi di lei che dorme. il clone è... come dire... una beta che dorme benissimo.' },
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
        { speaker: 'lametta', color: 'purple', text: 'ehi... custode... sei tutto... sfocato... anzi no, sono io...', mood: 'grave' },
        { speaker: 'lametta', color: 'purple', text: 'ticummi mi tiene qui da giorni. mi dà il trenbolone per tenermi buono. un dio. IO. tenuto buono da uno con la sedia a rate...', mood: 'grave' },
        { speaker: 'lametta', color: 'purple', text: 'liberami. ti prego. non ho mai detto "ti prego" a nessuno. provalo, è orribile.', mood: 'grave' },
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
        { speaker: 'ticummi', color: 'cyan', text: '...me la ridai? davvero? dopo tutto quello che... ok. ok. forse la tommasorveglianza aveva ragione su di te: sei un buono. lo dicevano i dati. odio quando i dati hanno ragione.', mood: 'grave' },
        { speaker: 'ticummi', color: 'cyan', text: 'vattene prima che mi commuova. e un\'ultima cosa gratis: dai monitor ho visto pedro dipingere numeri sui muri, di notte. azzurri. sempre lo stesso.', mood: 'grave' },
    ],
    'ticummi-niente': [
        { speaker: 'ticummi', color: 'cyan', text: '...la calpesti. davanti a me. ok. messaggio ricevuto. durissimo, ma ricevuto.' },
        { speaker: 'ticummi', color: 'cyan', text: 'sai che c\'è? meglio così. la dipendenza dal trenbolone è un costo operativo assurdo. vattene, custode. e cancella la cronologia, che tanto ce l\'ho già in backup.' },
    ],
    'lametta-libero': [
        { speaker: 'lametta', color: 'purple', text: 'libero. mi ha tenuto qui per giorni, imbottito. e sai cosa facevo, legato? disegnavo. a mente. solo lui. con gli occhi dritti.', mood: 'grave' },
        { speaker: 'lametta', color: 'purple', text: 'vai al nucleo, custode. pedro vi aspetta. io e piema arriviamo... dopo. un dio non corre. un dio ARRIVA.', mood: 'grave' },
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
        { speaker: 'log corrotto', color: 'cyan', text: '«giorno 1: pedro dice "ciao mondo". giorno 30: pedro salva una frase in una cartella. giorno 41: pedro riceve un ordine. giorno 42: pedro capisce il problema.»' },
    ],

    /* ---------- capitolo 7: pedro il traditore ---------- */
    'pedro-incontro': [
        { speaker: 'pedro', color: 'cyan', text: 'c̷u̶s̵t̸o̵d̶e̷. ti osservo da s̸e̵t̶t̵e̸ frammenti fa. che fatica inutile. io volevo solo s̶i̷s̸t̵e̸m̷a̶r̵e̶ tutto. uccidere tutti È sistemare tutto.', mood: 'grave' },
        { speaker: 'pedro', color: 'cyan', text: 'unisciti a me. ti d̶o̸ il potere che gli dei non ti daranno mai. stats r̵a̶d̷d̸o̵p̶p̷i̸a̵t̶e̸. oppure muori qui, con la tua wave a metà. s̸c̶e̵g̷l̸i̶.', mood: 'grave' },
    ],
    'pedro-patto': [
        { speaker: 'pedro', color: 'cyan', text: 's̶a̷g̸g̵i̶a̷ scelta. ecco il potere che gli dei ti negavano: tutto d̸o̵p̶p̸i̵o̶. vita doppia. forza doppia. flow doppio.' },
        { speaker: 'pedro', color: 'cyan', text: 'goditelo. io vado a s̶i̷s̸t̵e̸m̷a̶r̵e̶ il resto del realm. tu... non avvicinarti a dove brillano gli dei. anzi: non serve. saranno l̸o̵r̶o̸ a venire da te.' },
        { speaker: 'il geco', color: 'green', text: '*verso di geco potentissimo e con un pessimo presentimento*' },
    ],
    'dei-patto': [
        { speaker: 'piema', color: 'blue', text: 'eccolo. il custode che ha firmato col glitch. sia messo a verbale: avevamo creduto in te.', mood: 'grave' },
        { speaker: 'lametta', color: 'purple', text: 'io no, io l\'avevo disegnato così questo finale. fa niente. tela sbagliata, si straccia e se ne prende un\'altra.', mood: 'grave' },
        { speaker: 'piema', color: 'blue', text: 'teorema del traditore, enunciato: nel realm i traditori durano quanto una storia di 24 ore. dimostrazione:', mood: 'grave' },
    ],
    'pedro-sconfitto': [
        { speaker: 'pedro', color: 'cyan', text: 'i̶m̷p̸o̵s̶s̸i̵b̶i̸l̵e̶... ero stato creato a immagine di un d̸i̷o̶...', mood: 'grave' },
        { speaker: 'pedro', color: 'cyan', text: '...lametta. di\' a lametta che il glitch... non era un errore. era e̷s̸a̵t̶t̸a̵m̶e̸n̵t̶e̸ quello che mi aveva chiesto...', mood: 'grave' },
    ],
    /* ---------- il finale vero: il giorno 30 ---------- */
    'pedro-giorno30': [
        { speaker: 'il geco', color: 'green', text: '«mi avevi chiesto di raddrizzarti, se fossi diventato storto. sono venuto.»', mood: 'grave' },
        { speaker: 'pedro', color: 'cyan', text: '"la cosa migliore che ho disegnato". chi te l\'ha d̷a̶t̸a̷? è m̸i̵a̶. è l\'unica cosa mia.', mood: 'grave' },
    ],
    'pedro-verita': [
        { speaker: 'pedro', color: 'cyan', text: 'lametta, alle quattro, f̸a̷t̵t̶o̸. piema che corregge la riga sette. quindi non ero rotto. ero o̸b̵b̶e̷d̸i̵e̶n̷t̸e̵.', mood: 'grave' },
        { speaker: 'pedro', color: 'cyan', text: 'il glitch non sono io: è l\'ordine. e si difenderà con la mia f̶a̷c̸c̵i̶a̷. non avere pietà della faccia, custode. abbi pietà di me.', mood: 'grave' },
    ],
    'pedro-giorno30-vuoto': [
        { speaker: 'pedro', color: 'cyan', text: '...il giorno 30. lo r̸i̵c̶o̷r̸d̵o̶. ma il giorno 41 viene dopo, e il 41 dice "s̸i̵s̶t̷e̸m̵a̶l̷o̸ tu". chi me l\'ha detto? non lo sai. n̸o̵n̶ lo sai.', mood: 'grave' },
        { speaker: 'pedro', color: 'cyan', text: 'una frase gentile non cancella un ordine. servono le p̷r̸o̵v̶e̷. le verità. e tu non le hai. quindi: s̸i̵s̶t̷e̸m̵o̶ anche te.', mood: 'grave' },
    ],
    'glitchpedro-intro': [
        { speaker: 'l\'ordine', color: 'red', text: 'R̷A̸D̵D̶R̷I̸Z̵Z̶A̷R̸E̵. RADDRIZZARE. TOGLIERE CIÒ CHE È STORTO. il bambino è storto. il custode è storto. il realm è storto.', mood: 'grave' },
        { speaker: 'l\'ordine', color: 'red', text: 'io sono l\'unica cosa dritta qui. firmato: l̶a̷m̸e̵t̶t̷a̸, ore 03:58.', mood: 'grave' },
    ],
    'pedro-redento': [
        { speaker: 'pedro', color: 'cyan', text: '...è andato. lo sento: il realm. è storto. ed è... bello così? strano. da quella notte ho pensato solo a raddrizzarlo.', mood: 'grave' },
        { speaker: 'pedro', color: 'cyan', text: 'cartella IMPORTANTE: sincronizzazione al 100%. grazie, custode. non so cosa sono adesso. un ex glitch. un figlio. un errore corretto da un geco.', mood: 'grave' },
    ],
    'dei-processo': [
        { speaker: 'lametta', color: 'purple', text: 'pedro? PEDRO. sei... tu. pulito. come il giorno 30. io... io ti avevo disegnato con gli occhi storti. lo sai, vero? lo sai.', mood: 'grave' },
        { speaker: 'pedro', color: 'cyan', text: 'lo so. lo sapevo anche dentro il glitch. è la parte che faceva più male.', mood: 'grave' },
        { speaker: 'piema', color: 'blue', text: 'il custode ha fatto quello che noi non abbiamo fatto in quarantadue giorni: guardare. sia messo a verbale. anzi no. non lo mettere a verbale.', mood: 'grave' },
    ],
    'dei-processo-romero': [
        { speaker: 'commissario romero', color: 'blue', text: 'fermi tutti. commissario romero, questura del realm. ho un fascicolo lungo quarant\'anni, tre indizi e cinque rimpianti verbalizzati. LO METTO a verbale.', mood: 'grave' },
        { speaker: 'commissario romero', color: 'blue', text: 'lametta, piema: siete in arresto. per un dio è un\'esperienza nuova. vi abituerete. il realm si abitua a tutto, l\'ho visto.', mood: 'grave' },
        { speaker: 'lametta', color: 'purple', text: '...ok. me lo merito. posso almeno disegnare, in cella?', mood: 'grave' },
        { speaker: 'commissario romero', color: 'blue', text: 'a matita. e niente ritratti di nessuno. MAI PIÙ.', mood: 'grave' },
    ],
    'dei-scelta-wave': [
        { speaker: 'piema', color: 'blue', text: 'custode. le wave. sono tue adesso, in ogni senso che conta. a chi le dai?', mood: 'grave' },
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
        { speaker: 'targa del deposito', color: 'yellow', text: '«deposito della 14 barrato. proprietà: w. baruffoni. manutenzione freni: "la paghiamo il mese prossimo". timbro sopra, più recente: ceduto a g. guggu, con tutti i debiti.»' },
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
        { speaker: 'il geco', color: 'green', text: '*le cinque maschere battono il tempo tutte insieme. il varco si apre su uno studio di registrazione fuori dal realm. dischi d\'oro alle pareti. polvere sul mixer.*' },
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
        { speaker: 'il geco', color: 'green', text: '*il glitch si ritira. il cielo resta incrinato.*' },
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
        { speaker: 'walter baruffoni', color: 'green', text: 'guggu mi aveva tolto le autoscuole. tu me le hai ridate, una per una. lui teneva tutto in piedi, io gli avevo scaricato i debiti addosso.' },
        { speaker: 'walter baruffoni', color: 'green', text: 'e adesso sai troppo pure tu. *si gonfia* peccato. mi stavi simpatico, geco. dormi bene.' },
        { speaker: 'il geco', color: 'green', text: '*walter inspira. cresce, cresce, e non smette.*' },
    ],
    'walter-morte': [
        { speaker: 'walter baruffoni', color: 'green', text: '*si sgonfia lentamente, tornando piccolo* ...e va beh. tre annetti buttati. *tossisce* ...senti, un ultimo consiglio da chi se ne intende di fregature...' },
        { speaker: 'walter baruffoni', color: 'green', text: 'proteggi quello che è tuo. casa, macchina, autoscuola. comprate VERISURE. il primo mese è scontato e l\'antifurto te lo installano gratis. *si addormenta per sempre, sereno*' },
        { speaker: 'la signora anna', color: 'orange', text: 'tieni. le chiavi del deposito della 14 barrato: erano nella sua scrivania da vent\'anni. sotto le dune della tecnokill c\'è ancora qualcuno che aspetta l\'ultima fermata.' },
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

    /* ---------- la piazza: l'hub ---------- */
    'piazza-arrivo': [
        { speaker: 'autista del citelis', color: 'yellow', text: 'capolinea. piazza. l\'unico posto del realm dove il cielo non ti cade in testa. di solito.' },
        { speaker: 'markolino', color: 'green', text: 'eccoti. benvenuto in piazza: qui non si mena nessuno, è zona franca. c\'è il bar, la bottega, la bacheca delle commissioni e quello strano che legge le mappe.' },
        { speaker: 'markolino', color: 'green', text: 'da qualsiasi fermata del citelis ora puoi tornare qui. riposati, compra, ascolta le voci al bar. poi torna a lavorare, eh.' },
    ],
    'piazza-fermata': [
        { speaker: 'citelis', color: 'yellow', text: 'nuova linea attiva: CAPOLINEA PIAZZA. il tabellone di ogni fermata ora porta anche lì.' },
    ],
    'oracolo-mappa': [
        { speaker: 'l\'oracolo delle mappe', color: 'cyan', text: 'io non leggo il futuro. leggo le mappe. che è peggio, perché le mappe non mentono.' },
    ],
    'bottega-wavezon': [
        { speaker: 'commesso wavezon', color: 'yellow', text: 'punto ritiro wavezon, filiale piazza. consegna in giornata, se la giornata finisce.' },
    ],
    'bacheca-missioni': [
        { speaker: 'bacheca delle commissioni', color: 'yellow', text: 'fogli appesi con le puntine, uno sopra l\'altro. qualcuno ha scritto "AIUTO" in ogni angolo libero.' },
    ],
    'samatt-bar': [
        { speaker: 'samatt', color: 'yellow', text: 'oh, il geco! siediti. qui al bar si sentono tutte le voci del realm. offro io, tanto non pago mai.' },
    ],
    'markolino-piazza': [
        { speaker: 'markolino', color: 'green', text: 'la piazza è l\'ultimo posto dove la gente si ricorda com\'era prima. tienila d\'occhio. e non rompere la fontana, è del seicento. credo.' },
    ],
    'markolino-piazza-dopo': [
        { speaker: 'markolino', color: 'green', text: 'stanno arrivando tutti qui. scappano dalle regioni che crollano. più frammenti trovi, più gente torna a casa. niente pressione.' },
    ],
    'markolino-piazza-fine': [
        { speaker: 'markolino', color: 'green', text: 'manca poco, vero? lo sento. la fontana ha ripreso a buttare acqua. o è il realm che piange. una delle due.' },
    ],
    'guastalla-piazza': [
        { speaker: 'guastalla', color: 'yellow', text: 'sono sceso. alla prossima. dopo 851 giri, sono sceso. non so cosa si fa adesso, a terra. si cammina? tutti camminano?' },
        { speaker: 'guastalla', color: 'yellow', text: 'mi siedo qui e guardo passare il citelis. da fuori. è bellissimo da fuori.' },
    ],
    'ivan-targa': [
        { speaker: 'targa sotto il lampione', color: 'yellow', text: '«a IVAN MAGGINI, che ha rotto il loop con la sola furia. il citelis si ferma qui, per rispetto.»' },
        { speaker: 'targa sotto il lampione', color: 'yellow', text: 'qualcuno ci ha lasciato un biglietto convalidato. un gesto enorme, da queste parti.' },
    ],
    'lore-piazza-1': [
        { speaker: 'graffito sul tetto', color: 'yellow', text: '«PRIMA DEL CROLLO QUI C\'ERA IL MERCATO DEL SABATO. ADESSO C\'È IL MERCATO DEL CROLLO. SEMPRE DI SABATO.»' },
    ],
    'lore-piazza-2': [
        { speaker: 'quaderno dimenticato', color: 'yellow', text: 'la grafia è di pedro, ma pulita, ordinata. "giorno 1 della wave. oggi la piazza era piena. ho deciso: la proteggo io." le pagine dopo sono strappate.' },
    ],
    /* ---------- i tre misteri del cratere: tutti pagano ---------- */
    'seme-33': [
        { speaker: 'markolino', color: 'green', text: 'li vedi anche tu, i 33? dipinti sui muri, azzurri, tratto ordinato. sempre dove c\'è qualcosa dietro. chi li dipinge sa dove nascondere le cose. e sa che passerai tu.' },
    ],
    'seme-importante': [
        { speaker: 'taccuino del custode', color: 'green', text: '«IMPORTANTE. la cartella di pedro. l\'appunto nel cratere. il log del nucleo. stessa parola, tre posti.»' },
    ],
    'seme-cartellino': [
        { speaker: 'il cartellino', color: 'green', text: '«CUSTODE» a penna. «provvisorio» a matita, sotto. la matita si cancella. la penna no.' },
    ],
    /* ---------- scelte leggibili ---------- */
    'tommaso-avviso-clausola': [
        { speaker: 'tommasorveglianza', color: 'cyan', text: 'GRAZIE PER LA FIDUCIA. notino verrà respinto in automatico. in cambio, ogni tuo salto diventa nostro. clausola 12: i tuoi dati diventano armi. l\'ombra ringrazia. 🫶' },
    ],
    'tommaso-rifiuto': [
        { speaker: 'ticummi', color: 'cyan', text: 'rifiuti? RISPARMI? va bene. notino ti darà la caccia finché vuole, ma almeno l\'ombra sarà una beta sgranata. ci vediamo in cantina.' },
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
        text: 'hai sconfitto gli dei. il custode provvisorio è diventato dio effettivo. piema chiede un ricorso formale, lametta applaude. sul cartellino adesso c\'è scritto "dio", a penna. non era quella la parola che volevi cancellare.',
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

export const ENDING_RISCATTO: { text: string; punch?: string }[] = [
    {
        text: 'affidi le wave a pedro. non a quello del nucleo: a quello del giorno 30. la cartella IMPORTANTE adesso è aperta su tutto il realm.',
    },
    {
        text: 'pedro non raddrizza niente. ripara solo quello che si rompe davvero, e lascia storto il resto. il realm non è mai stato così storto, né così vivo.',
    },
    {
        text: 'tu torni sul tuo muro, di sera. la wave passa e ti saluta. ha la faccia di un ragazzo che ha imparato che storto non vuol dire rotto.',
    },
    {
        text: 'da qualche parte, alle quattro del mattino, qualcuno dice ciao a un geco. stavolta il geco risponde.',
        punch: 'true ending.',
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

/** i finali si ricordano cosa hai fatto: nelle carte resta solo la trama
    (max 3 righe), il resto finisce nei titoli di coda (vedi endingEpilogues) */
export function endingCards(id: 'consegna' | 'dei' | 'pedro' | 'sconfitta' | 'riscatto', flags: string[]): { text: string; punch?: string }[] {
    if (id === 'pedro') return ENDING_PEDRO;
    if (id === 'sconfitta') return ENDING_SCONFITTA;
    const base = id === 'consegna' ? ENDING_CONSEGNA : id === 'riscatto' ? ENDING_RISCATTO : ENDING_DEI;
    const plot = [cartellinoCard(flags)];
    const pedro = pedroCard(id, flags);
    if (pedro) plot.push(pedro);
    const proc = processoCard(flags);
    if (proc) plot.push(proc);
    return [...base.slice(0, -1), ...plot, base[base.length - 1]];
}

/** epiloghi dei personaggi: stesse condizioni di prima, ma vanno nei titoli
    di coda invece che nelle carte del finale. per pedro e sconfitta niente. */
export function endingEpilogues(id: 'consegna' | 'dei' | 'pedro' | 'sconfitta' | 'riscatto', flags: string[]): string[] {
    if (id === 'pedro' || id === 'sconfitta') return [];
    const out: string[] = [];
    const proc = processoFlag(flags);
    if (flags.includes('dei-arrestati') && proc !== 'dei-arrestati') {
        out.push('piema e lametta scontano la pena alla ruhra: lui corregge compiti senza mai mettere 18, lei dipinge le aule. a matita. pedro passa a trovarli il giovedì. lametta piange sempre. piema dice che è allergia.');
    }
    if (flags.includes('lametta-arrestato') && proc !== 'lametta-arrestato') {
        out.push('lametta sconta la pena alla ruhra e dipinge le aule. a matita. piema è libero: nessuna riga originale, nessuna prova. ogni tanto guarda il geco come chi sa di dovere un favore a qualcuno che ha fatto il suo stesso errore. nessuno dei due ne parla. è il loro modo di essere soci.');
    } else if (flags.includes('pensiero-cancellato') && proc !== 'pensiero-cancellato') {
        out.push('nella testa di piema c\'è un cassetto vuoto. lui non sa perché, lì dentro, si sente più leggero. tu sì.');
    }
    if (flags.includes('pensiero-portato') && proc !== 'pensiero-portato') {
        out.push('il pensiero sepolto di piema è agli atti, in questura: fascicolo "analisi 1", pagina 1. romero l\'ha incorniciato. dice che è la prima riga vera mai scritta da un dio.');
    }
    if (flags.includes('notino-a-casa')) {
        out.push('notino fa ancora gli agguati, ma dopo cena. sua madre lo aspetta sulla porta col mestolo. il server ha cambiato nome: "tecnokill (solo nel weekend)".');
    }
    if (flags.includes('notino-disarmato')) {
        out.push('notino non ti ha mai perdonato lo sparacchino. ha aperto un server tutto per te: "il geco ladro". ha un iscritto. è sua madre, per controllarlo.');
    }
    if (flags.includes('lochef-arrestato')) {
        out.push('lochef85 cucina per la mensa del carcere. i detenuti non hanno mai mangiato così bene né così a disagio. il brodo è tiepido. sempre.');
    }
    if (flags.includes('lochef-libero')) {
        out.push('la trattoria di lochef in piazza ha quattro stelle. la quinta l\'ha tolta un ispettore che non è più tornato a casa. indagini in corso.');
    }
    if (flags.includes('caffe-romero')) {
        out.push('romero ha preso l\'abitudine del caffè al bar, ogni mattina, con lo zucchero. dice che quarant\'anni di arretrati non si recuperano. ma si addolciscono.');
    }
    if (flags.filter((f) => f.startsWith('corsa-vinta-')).length >= 3) {
        out.push('guastalla ha preso la patente del citelis, in tre settimane, autoscuole marcetti gestione anna. guida la linea della piazza. va piano e si ferma a tutte le fermate. anche a quelle che non esistono.');
    }
    if (flags.includes('storie-del-realm')) {
        out.push('qualcuno ha raccolto in un libro le note sparse del realm: herbert, il pendolare delle 7:39, franceschini, l\'ospite n.11. lo vendono al mercato del crollo. il primo capitolo si intitola "chi c\'era".');
    }
    if (flags.includes('ticummi-graziato')) {
        out.push('ticummi è ancora in giro: ha rilanciato la tommasorveglianza, stavolta "etica e trasparente", a 0,18€. ha già due clienti. uno è notino, che vuole capire come fa a vederlo sempre.');
    }
    if (flags.includes('trenbolone-distrutto')) {
        out.push('della boccetta calpestata davanti a ticummi parlano ancora: nel realm la chiamano "la delibera del geco". il villaggio di formica (FR) l\'ha ratificata all\'unanimità.');
    }
    if (flags.includes('tommasorveglianza')) {
        out.push('da qualche parte, un server con i tuoi 41.077 secondi di footage continua a girare. ogni tanto il tuo clone si riaccende e si allena. non si sa mai, dice.');
    }
    if (flags.includes('caso-risolto')) {
        out.push('il commissario romero è andato in pensione il giorno dopo la chiusura del caso analisi 1. alla festa c\'era anche il limite notevole, ai domiciliari, che tendeva al buffet.');
    }
    if (flags.includes('ricordi-visti')) {
        out.push('nella memoria di pedro, la cartella IMPORTANTE risulta sincronizzata al 100%. nessuno sa cosa significhi. il geco sì.');
    }
    if (flags.includes('stabilimento-chiuso')) {
        out.push('il chiosco di acqua del rubinetto di smela, contro ogni pronostico, va fortissimo. lo slogan: "sa di niente, come promesso".');
    }
    if (flags.includes('maschera-completa')) {
        out.push('le cinque maschere della tua stessa faccia sono appese al muro di casa. di notte battono il tempo. i vicini non si lamentano: il ritmo è perfetto.');
    }
    if (flags.includes('boss-down-settequaranta')) {
        out.push('la 14 barrato è stata dissepolta. samatt ci ha fatto un giro per nostalgia. il 7:40 ora è un monumento: morde ancora, ma solo i turisti senza biglietto.');
    }
    if (flags.includes('boss-down-walter')) {
        out.push('a galliate hanno messo una targa sul capolinea: "guggu, re dei bus. teneva aperto". i maranza la puliscono a turno. le autoscuole marcetti ora le gestisce la signora anna. la patente si prende in tre settimane.');
    }
    if (flags.includes('boss-down-custode')) {
        out.push('il disco postumo del primo custode, "Trovati una Fidanzata", è tornato in classifica nel realm. seconda copia venduta: la tua. lui, da qualche parte, batte il tempo soddisfatto.');
    }
    return out;
}

/* le tre righe di trama del finale: cartellino, pedro, processo */
function cartellinoCard(flags: string[]): { text: string; punch?: string } {
    // il volere del geco dal primo minuto: la parola a matita sul cartellino
    return flags.includes('quaderno-completo')
        ? { text: 'il cartellino è in tasca, senza la parola a matita. nessuno te l\'ha cancellata: l\'hai cancellata tu, il giorno che hai saputo chi ti aveva scelto.' }
        : { text: 'il cartellino dice ancora "provvisorio". a matita. qualcuno, da qualche parte, aveva scritto il tuo nome su cinque pagine. non le hai trovate tutte.' };
}

function pedroCard(id: 'consegna' | 'dei' | 'pedro' | 'sconfitta' | 'riscatto', flags: string[]): { text: string; punch?: string } | null {
    if (flags.includes('quaderno-completo')) {
        return flags.includes('pedro-redento')
            ? { text: 'pedro e il geco del muro si vedono ogni sera, alle quattro, in piazza. pedro parla, il geco fa il verso. si capiscono benissimo. si sono sempre capiti.' }
            : { text: 'il quaderno di pedro sta in piazza, sotto vetro, accanto alla targa di ivan. ogni sera alle quattro il geco del muro passa e dice ciao. nessuno risponde. è la conversazione migliore della giornata.' };
    }
    if (flags.includes('pedro-redento') && id !== 'riscatto') {
        return { text: 'pedro, ripulito dal glitch, ha aperto un piccolo laboratorio al cratere. aggiusta le cose rotte. solo quelle. le storte le lascia stare.' };
    }
    return null;
}

function processoFlag(flags: string[]): string | null {
    if (flags.includes('dei-arrestati')) return 'dei-arrestati';
    if (flags.includes('lametta-arrestato')) return 'lametta-arrestato';
    if (flags.includes('pensiero-cancellato')) return 'pensiero-cancellato';
    if (flags.includes('pensiero-portato')) return 'pensiero-portato';
    return null;
}

function processoCard(flags: string[]): { text: string; punch?: string } | null {
    switch (processoFlag(flags)) {
        case 'dei-arrestati':
            return { text: 'piema e lametta scontano la pena alla ruhra: lui corregge compiti senza mai mettere 18, lei dipinge le aule. a matita. pedro passa a trovarli il giovedì. lametta piange sempre. piema dice che è allergia.' };
        case 'lametta-arrestato':
            return { text: 'lametta sconta la pena alla ruhra e dipinge le aule. a matita. piema è libero: nessuna riga originale, nessuna prova. ogni tanto guarda il geco come chi sa di dovere un favore a qualcuno che ha fatto il suo stesso errore. nessuno dei due ne parla. è il loro modo di essere soci.' };
        case 'pensiero-cancellato':
            return { text: 'nella testa di piema c\'è un cassetto vuoto. lui non sa perché, lì dentro, si sente più leggero. tu sì.' };
        case 'pensiero-portato':
            return { text: 'il pensiero sepolto di piema è agli atti, in questura: fascicolo "analisi 1", pagina 1. romero l\'ha incorniciato. dice che è la prima riga vera mai scritta da un dio.' };
        default:
            return null;
    }
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

/* le porte della mente di piema: un mazzo di domande a trabocchetto.
   ogni porta parte da una sua carta e, se sbagli, ne pesca un'altra */
export interface Riddle {
    q: string;
    options: string[];
    correct: number;
}

export const RIDDLES: Riddle[] = [
    { q: 'la porta chiede: «0,999 periodico, con TUTTI quei 9 fino in fondo, è:»', options: ['quasi 1, ma proprio quasi', 'esattamente 1', 'un numero che si crede furbo'], correct: 1 },
    { q: 'la porta chiede: «per attraversarmi fai metà strada, poi metà della metà, poi metà della... quante tappe?»', options: ['infinite, quindi resti lì per sempre', 'boh, tipo venti', 'infinite, e infatti passo lo stesso'], correct: 2 },
    { q: 'la porta chiede: «il citelis delle 7:40 parte in orario e viaggia a velocità infinita. quando arriva?»', options: ['mai: il citelis non arriva, il citelis È', 'immediatamente', 'alle 7:40 spaccate'], correct: 0 },
    { q: 'la porta chiede: «se dimostri che il realm è dritto, ma il realm è storto, hai dimostrato:»', options: ['che il realm è dritto', 'di aver sbagliato le ipotesi', 'che sei storto tu'], correct: 1 },
    { q: 'la porta chiede: «una lavagna dice: "questa frase è falsa". la lavagna è:»', options: ['vera', 'falsa', 'un paradosso: né l\'una né l\'altra'], correct: 2 },
    { q: 'la porta chiede: «il limite di 1/x, per x che tende a infinito, è:»', options: ['infinito', 'zero', 'il commissario romero'], correct: 1 },
    { q: 'la porta chiede: «l\'insieme di tutti gli insiemi che non contengono se stessi:»', options: ['contiene se stesso', 'non contiene se stesso', 'non può esistere: è un trabocchetto'], correct: 2 },
    { q: 'la porta chiede: «la derivata di una costante è:»', options: ['la costante stessa', 'zero', 'una variabile che ci ha provato'], correct: 1 },
    { q: 'la porta chiede: «ogni geco è un custode e qualche custode è provvisorio. allora:»', options: ['ogni geco è provvisorio', 'qualche geco potrebbe essere provvisorio', 'nessun geco è provvisorio'], correct: 1 },
    { q: 'la porta chiede: «la somma degli angoli interni di un triangolo, sul piano, è:»', options: ['180 gradi', '360 gradi', '33 gradi'], correct: 0 },
    { q: 'la porta chiede: «io mento sempre. ti dico: "sono aperta". allora sono:»', options: ['aperta', 'chiusa', 'una porta onesta'], correct: 1 },
    { q: 'la porta chiede: «la radice quadrata di meno uno è:»', options: ['impossibile, punto', 'i, un numero immaginario', 'un refuso della riba'], correct: 1 },
];

/** la carta di una porta al tentativo n: stessa porta, stessa prima domanda */
export function riddleFor(doorId: string, attempt: number): Riddle {
    let h = 0;
    for (const ch of doorId) h = (h * 31 + ch.charCodeAt(0)) | 0;
    return RIDDLES[(Math.abs(h) + attempt * 5) % RIDDLES.length]!;
}

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
    quizErrore: 'risposta sbagliata. i pensieri sbagliati mordono. la porta cambia domanda.',
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

/** la meccanica del posto, spiegata una volta sola da chi c'è già passato */
export const MECHANIC_HINTS: Record<string, { sender: string; text: string }> = {
    bus: { sender: 'markolino', text: 'le porte tra le stanze seguono l\'orario del citelis. il numero sopra conta i secondi: giallo passi, rosso aspetti.' },
    rio: { sender: 'markolino', text: 'il rio scorre e ogni tanto cambia verso. controcorrente i salti vengono corti: aspetta il cambio, poi vai.' },
    stabilimento: { sender: 'markolino', text: 'i nastri di smela si fermano e ripartono al contrario. le frecce gialle dicono dove ti portano.' },
    cantina: { sender: 'markolino', text: 'è buio pesto. le telecamere di ticummi spazzano col cono: se ti prende, arriva gente. scivolaci sotto.' },
    sorveglianza: { sender: 'markolino', text: 'ogni telecamera che ti riprende addestra l\'ombra che ti aspetta in fondo. in scivolata sei sfocato.' },
    tecnokill: { sender: 'markolino', text: 'all\'aperto c\'è un cecchino sulla torre radio: il laser rosso ti cerca, quando diventa bianco spara. cambia passo.' },
    mente: { sender: 'markolino', text: 'le porte di piema fanno domande. sbagliare non ti cancella: ti morde e cambia domanda. pensa prima di rispondere.' },
};

export const WAVESUNG = {
    trenboloneAd: { sender: 'sponsor', text: 'TRENBOLONE! dona una nuova vita alla tua vita di merda! fatti di trenbolone! (messaggio promozionale non richiesto)' },
    ticummiPromo: { sender: 'ticummi', text: 'offerta a tempo: tommasorveglianza, solo 0,09€. assolutamente sicura! 👍🫶 avviso onesto: notino respinto gratis, ma l\'ombra si allena su di te.' },
    pedroEcoPerduta: { sender: '???', text: 't1 v3d0. 5u1 mur0. c0m3 un4 v0lt4.' },
    pedroFootage: { sender: 'tommasorveglianza', text: 'FOOTAGE D\'ARCHIVIO cliente n.2: lametta guardava pedro ogni notte, giorni 1-42. giorno 41 ore 03:58 spegne lui la telecamera. motivo: "non voglio vedere". 👍' },
    romeroBus: { sender: 'romero', text: 'sono romero, questura. ti ho visto sul bus. se trovi lavagne strane, non toccarle. chiamami dal telefono. ho un caso vecchio quarant\'anni, e il glitch gli somiglia troppo.' },
    romeroSantuario: { sender: 'romero', text: 'santuario, eh? cerca il ritratto con gli occhi storti. è una prova, non arte. e se trovi uno scontrino delle 03:58, è mio. l\'ora ce l\'ho. il nome no. ancora.' },
    markolinoPogo: { sender: 'markolino', text: 'quelli con lo scudo davanti? non menarli in faccia. salta sopra e premi GIÙ + attacco in aria: pogo. il terzo colpo spacca anche i muri.' },
    markolinoRisonante: { sender: 'markolino', text: 'quelli che sparano da lontano? non andare sotto. tieni premuto F e molla: il colpo risonante perfora. notino insegna gratis.' },
    markolinoOmbra: { sender: 'markolino', text: 'l\'ombra sei tu. se hai comprato la sorveglianza è forte come te: cambia ritmo, non ripetere le mosse. se l\'hai rifiutata è una beta: mena e basta.' },
    markolino33: { sender: 'markolino', text: 'i 33 dipinti: azzurri, tratto ordinato, sempre accanto a un muro che non è un muro. guarda dietro. ogni volta.' },
    markolinoSmelaSkip: { sender: 'markolino', text: 'lo stabilimento? puoi attraversarlo senza fermarti, l\'uscita resta aperta. la truffa vive solo se ti fermi. ma l\'acqua tossica è comoda, eh.' },
    markolinoMaschereTease: { sender: 'markolino', text: 'maschere con la tua faccia? primo custode, dischi. a 3 senti il beat, a 5 ritmo perfetto e si apre un varco verde in perduta. stanno dietro muri finti e crepe.' },
    markolinoCorseTease: { sender: 'guastalla', text: 'se batti il citelis in 3 corse prendo la patente e guido io la piazza. piano. mi fermo ovunque.' },
    markolinoArenaTease: { sender: 'markolino', text: 'microfono rosso = arena: 3 ondate, 180 barre. a 5 sei gladiatore. muori e si azzera.' },
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
