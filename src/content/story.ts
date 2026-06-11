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
        { speaker: 'ivan maggini', color: 'yellow', text: 'visto? ti ho detto che lo tagliavo... ahh. l\'esplosione... mi sa che questa corsa la finisco qui, custode.' },
        { speaker: 'ivan maggini', color: 'yellow', text: 'guarda tra le lamiere: c\'è un frammento. la wave manifesta il desiderio... e io desideravo solo che i bus tornassero in orario. che spreco, eh?' },
        { speaker: 'ivan maggini', color: 'yellow', text: 'salva il realm. e di\' a samatt che il loop è finito.' },
    ],
    'lore-loop': [
        { speaker: 'avviso alla fermata', color: 'yellow', text: '«samatt e guastalla sono passati di qui 847 volte. guastalla ha smesso di contare alla 300. samatt no. samatt conta ancora.»' },
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
    'lochef-cameo': [
        { speaker: 'lochef85', color: 'red', text: 'ciao bello... cioè, ciao custode. dicono che i frammenti ti rendano... divino. passa dalla mia tana quando vuoi. c\'è posto. c\'è sempre posto.' },
        { speaker: 'il geco', color: 'green', text: '*verso di geco che accelera il passo*' },
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
};

export const WAVESUNG = {
    trenboloneAd: { sender: 'sponsor', text: 'TRENBOLONE! dona una nuova vita alla tua vita di merda! fatti di trenbolone! (messaggio promozionale non richiesto)' },
    ticummiPromo: { sender: 'ticummi', text: 'offerta a tempo: tommasorveglianza, solo 0,09€. assolutamente sicura! 👍🫶' },
    markolinoPiema: { sender: 'markolino', text: 'HO TROVATO PIEMA!! è alla ruhra e sta impazzendo per analisi 1. SALVALO. occhio alla riba, è scema ma morde.' },
    markolinoFinale: { sender: 'markolino', text: 'pedro ti aspetta al nucleo. qualsiasi cosa ti offra: è glitchata pure quella. fidati di me che mi fido di poco.' },
};
