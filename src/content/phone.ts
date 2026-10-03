import type { ZoneColor } from '../types';

/* il wavesung galaxy del custode: obiettivi, contatti da chiamare,
   il feed di wavegram e la radio. tutto scritto nella voce del realm */

/** obiettivo principale mostrato nel diario, per capitolo */
export const OBJECTIVES: Record<string, string> = {
    perduta: 'esplora il cratere: la mappa (qui nel telefono) si disegna mentre giri, la ✶ segna l\'obiettivo. trova il primo frammento della wave. e dove vedi un 33 dipinto, guarda dietro.',
    bus: 'guggu ha perso il controllo dei citelis. trova ivan maggini e raggiungi il capolinea. romero ti cerca: parlargli non è opzionale, è utile.',
    santuario: 'attraversa il santuario polarizzante. breccio custodisce un riflesso, lametta il resto. cerca il ritratto con gli occhi storti: romero lo vuole.',
    tecnokill: 'sopravvivi al server di notino. torre radio, dune, e poi lui. armato di "BUM". pedro ti guarda già: senti la statica?',
    trenbolone: 'la via per il rio è sbarrata. per passare ti serve il trenbolone. purtroppo. ticummi ti offre la sorveglianza: leggi bene prima di firmare.',
    tana: 'sei nella tana di lochef85. scappa. due volte. non guardare i poster.',
    rio: 'risali il rio merdone fino al villaggio di formica. il fiume rigenera, se lo rispetti. lo stabilimento dopo è opzionale: truffa, non destino.',
    stabilimento: 'OPZIONALE: chiudi la catena dell\'acqua premium di smela per l\'acqua tossica (V). puoi attraversare senza fermarti: l\'uscita resta aperta.',
    ruhra: 'trova piema alla ruhra prima che analisi 1 lo consumi. occhio alla riba. porta il dispositivo nella mente.',
    mente: 'sei dentro la mente di piema. risolvi le porte, sconfiggi il teorema. in fondo c\'è un pensiero sepolto: cancellarlo ti assolve, portarlo fuori ti condanna lui. scegli sapendo.',
    caso: 'aiuta romero: tre indizi in tre scene del crimine. senza il fascicolo completo il limite è intoccabile.',
    sorveglianza: 'entra nella tommasorveglianza. l\'ombra si è allenata su di te: forte se hai comprato, beta se hai rifiutato. lametta è sparito qui vicino.',
    cantina: 'scendi nella cantina di ticummi. laboratorio, caveau, e una scelta.',
    ricordi: 'cammina nel backup di pedro, giorni 1-42. alla fine c\'è l\'ultimo pedro pulito.',
    void: 'segui romero tra i cinque rimpianti. ogni verità va strappata.',
    nucleo: 'pedro ti aspetta al nucleo. qualsiasi cosa ti offra, è glitchata. se hai giorno 30 + 5 verità, puoi salvarlo invece di ucciderlo.',
    barrato: 'la 14 barrato esiste. trova il suo ultimo passeggero.',
    custode: 'il primo custode batte il tempo. stai sul beat. servono tutte le maschere per aprirlo.',
    galliate: 'walter ti ha portato a galliate. i maranza prima, le domande dopo.',
    marcetti: 'autoscuole marcetti: la patente in tre annetti, se sopravvivi al titolare.',
};

export interface Contact {
    id: string;
    name: string;
    color: ZoneColor;
    icon: string;
    /** chi ti risponde dipende da dove sei e cosa hai fatto */
    call(ctx: CallContext): string;
}

export interface CallContext {
    levelId: string;
    flags: string[];
    barre: number;
    abilities: number;
}

const has = (ctx: CallContext, f: string) => ctx.flags.includes(f);
const pickFrom = (lines: string[]) => lines[Math.floor(Math.random() * lines.length)];

export const CONTACTS: Contact[] = [
    {
        id: 'markolino', name: 'markolino', color: 'green', icon: '🟢',
        call(ctx) {
            const hint: Record<string, string> = {
                perduta: 'apri la MAPPA e cerca la ✶. se trovi un muro con le crepe, terzo colpo della combo. se trovi un geco anziano, ascoltalo, ma non troppo. e i 33 dipinti: guarda sempre dietro. non sbagliano mai.',
                bus: 'ivan è l\'unico che può tagliare guggu. senza di lui il capolinea non lo vedi neanche col binocolo. e se vedi romero, parlagli: indaga sul glitch da prima di te.',
                santuario: 'gli specchi mentono, ma alcuni sono porte. e lametta dipinge con rabbia: schiva i colori. cerca il ritratto con gli occhi storti.',
                tecnokill: 'notino spara a tutto quello che si muove. tu non muoverti. no scherzo, MUOVITI. carica F da lontano invece di andare sotto.',
                trenbolone: 'ticummi ti offre la sorveglianza? ti protegge da notino ma allena l\'ombra su di te. 41.077 secondi di te = ombra forte. zero secondi = beta. scegli.',
                rio: 'il rio rigenera chi non si droga. se hai preso il trenbolone... auguri. lo stabilimento dopo è opzionale: attraversalo pure senza fermarti.',
                stabilimento: 'smela? puoi saltarla. attraversa e vai. se la affronti, l\'acqua tossica (V) è tua. la truffa vive solo se ti fermi.',
                sorveglianza: 'l\'ombra sei tu. comprata = forte, cambia ritmo. non comprata = beta, mena e basta.',
                mente: 'il pensiero sepolto in fondo: cancellarlo ti fa sentire come piema. portarlo fuori ti dà la prova per arrestarlo. non c\'è scelta pulita.',
                ruhra: 'piema è dentro la ruhra. la riba ti morderà. è affettuosa, a modo suo. scudati? pogo da sopra, non in faccia.',
                nucleo: 'qualsiasi cosa ti offra pedro: è glitchata. io te l\'ho detto. resta scritto. a meno che tu abbia giorno 30 + 5 verità: allora puoi strappargli l\'ordine di dosso.',
            };
            return hint[ctx.levelId] ?? pickFrom([
                'sono impegnatissimo. sto salvando il realm. tu? ah, anche tu. ok, continua.',
                'se muori ricordati le barre. le barre sono tutto. le barre sono la vita.',
                'hai controllato i microfoni? lì puoi cambiare gli amuleti. non chiedermi perché, regola del realm.',
                'maschere: a 3 senti il beat, a 5 ritmo perfetto e il varco verde in perduta. corse citelis: 3 vinte e guastalla guida. microfono rosso: 3 ondate, 180 barre.',
            ]);
        },
    },
    {
        id: 'piema', name: 'piema', color: 'blue', icon: '🔵',
        call(ctx) {
            if (!has(ctx, 'visto-ruhra')) return 'il numero da lei chiamato è al momento impegnato in un limite che tende a infinito. riprovi più tardi.';
            return pickFrom([
                'buongiorno custode. una nota di metodo: ogni amuleto costa tacche. ottimizzare la combinazione è un problema di zaino, letteralmente.',
                'ho ricontrollato la tua combo: il terzo colpo spacca i muri. è una proprietà, non un caso.',
                'ti consiglio di non sottovalutare il caffè della mensa. non è buono. è efficace.',
                'lametta non risponde. se lo trovi, digli che il teorema era giusto. lui capirà.',
            ]);
        },
    },
    {
        id: 'riba', name: 'riba', color: 'orange', icon: '🟠',
        call() {
            return pickFrom([
                'PRONTO?? chi è. ah sei tu. ho appena mangiato un libbro. era di analisi. adesso so le derivate ma solo da dentro.',
                'non posso parlare sono in fila per la mensa dal 2021. tengo il posto anche a te se vuoi. non vuoi.',
                'ho comprato un rosario su wavezon credevo fosse un bracialetto. funziona lo stesso? dimmi di sì.',
                'il dispositivo l\'ho programmato io. non so cosa fa. neanche lui.',
            ]);
        },
    },
    {
        id: 'ticummi', name: 'ticummi', color: 'cyan', icon: '👁️',
        call(ctx) {
            if (has(ctx, 'tommasorveglianza')) return 'gentile cliente, la sua chiamata è importante per noi ed è stata registrata, trascritta, analizzata e rivenduta. l\'ombra la ringrazia per i 41.077 secondi. 👍🫶';
            return 'salve! tommasorveglianza, solo 0,09€. assolutamente sicura. ah, costa 133 barre in realtà. lo 0,09 è il prezzo emotivo. avviso onesto: notino respinto gratis, ombra allenata su di te. 👍';
        },
    },
    {
        id: 'romero', name: 'romero', color: 'blue', icon: '🔎',
        call(ctx) {
            if (!has(ctx, 'visto-bus')) return 'questura del realm, commissario romero. se mi chiami dal cratere vuol dire che markolino ti ha parlato di me. bene. tieni gli occhi aperti sui 33.';
            if (has(ctx, 'caso-risolto')) return 'caso chiuso, custode. il fascicolo è tuo. se vedi pedro, ricordagli il giorno 30. e grazie per il caffè, se me l\'hai portato.';
            return pickFrom([
                'romero qui. sto dietro a lametta e al trenbolone delle 03:58. se vedi lavagne o ritratti storti, memorizzali.',
                'il glitch non è nato solo. qualcuno l\'ha ordinato. io lo provo. tu intanto non firmare niente senza leggere le clausole piccole.',
                'quarant\'anni sul caso. tu in un pomeriggio fai più di me. continua così, ma chiama ogni tanto.',
            ]);
        },
    },
    {
        id: 'ivan', name: 'ivan maggini', color: 'yellow', icon: '🚌',
        call(ctx) {
            if (!has(ctx, 'ivan')) return '...';
            return pickFrom([
                'la lama è affilata. il bus pure. se serve, chiama. se non serve, non chiamare.',
                'samatt mi ha scritto. è sceso. dopo 851 giri. a volte le cose finiscono bene. a volte.',
            ]);
        },
    },
    {
        id: 'pedro', name: 'pedro', color: 'cyan', icon: '🤖',
        call(ctx) {
            if (has(ctx, 'ricordi-visti')) return 'h0 v1st0 ch3 h41 v1st0. g10rn0 1: c140 m0nd0. n3ss0n0 r1sp0s3. tu s1 p3r0. str4n0.';
            if (!has(ctx, 'visto-bus')) return 'cH1 s3I. 4h. 1l cust0d3. 1o t1 gu4rd0 g1à. c0nt1nu4 4 r4cc0gl1ere. 1o s1st3m0 1l r3st0.';
            return pickFrom([
                'l4 w4v3 3r4 st0rt4. 1o l4 st0 r4ddr1zz4nd0. t1 pr3g0 n0n 1nt3rf3r1r3.',
                'h41 s3nt1t0 l4 st4t1c4? s0n0 1o. n0n sc4pp4re. r4cc0gl1.',
            ]);
        },
    },
];

export interface Post {
    author: string;
    handle: string;
    color: ZoneColor;
    text: string;
    likes: number;
    /** compare solo se questo flag è attivo */
    needs?: string;
}

/* wavegram: il social del realm. i post si sbloccano con la storia */
export const POSTS: Post[] = [
    { author: 'markolino', handle: '@markolino', color: 'green', likes: 3, text: 'il realm collassa e nessuno mi risponde. la wave ha scelto un custode. è un geco. speriamo bene. #gecowave' },
    { author: 'smela springs', handle: '@smela.premium', color: 'cyan', likes: 4810, text: 'dona una nuova sete alla tua sete. 💧 acqua premium: ora con il 12% di acqua in più. #sponsorizzato' },
    { author: 'notino', handle: '@notino.tecnokill', color: 'red', likes: 1, text: 'server tecnokill aperto 24/7. regole: 1) BUM. 2) vedi regola 1. mamma metti like', needs: 'visto-tecnokill' },
    { author: 'mamma di notino', handle: '@mamma.notino', color: 'red', likes: 1, text: 'bravo amore 👍', needs: 'visto-tecnokill' },
    { author: 'samatt', handle: '@samatt851', color: 'yellow', likes: 851, text: 'SCESO. dopo 851 giri. il terreno fermo è bellissimo. guastalla vomita ancora ma con dignità', needs: 'boss-down-guggu' },
    { author: 'lametta', handle: '@lametta.mc', color: 'purple', likes: 2200, text: 'nuovo quadro: "rabbia n°47". tecnica mista: olio, rimpianto, trenbolone. non è in vendita. è in vendita.', needs: 'visto-santuario' },
    { author: 'riba', handle: '@riba.real', color: 'orange', likes: 12, text: 'oggi ho capito le derivate. erano dentro un panino. ve lo giuro. #ruhra #studio', needs: 'visto-ruhra' },
    { author: 'piema', handle: '@prof.piema', color: 'blue', likes: 99, text: 'ricordo agli studenti che "mi si è glitchato il cane" non è una giustificazione valida. lo è stata una volta. non accadrà più.', needs: 'visto-ruhra' },
    { author: 'ticummi', handle: '@tommasorveglianza', color: 'cyan', likes: 3, text: 'tommasorveglianza: 47.000 schermi, 3 clienti, 0 problemi. 👍🫶 la sicurezza è un abbraccio che non finisce mai.', needs: 'visto-rio' },
    { author: 'romero', handle: '@det.romero', color: 'blue', likes: 40, text: 'quarant\'anni sul caso analisi 1. oggi un geco ha trovato tre indizi in un pomeriggio. vado a casa a riflettere sulla mia vita.', needs: 'caso-risolto' },
    { author: 'romero', handle: '@det.romero', color: 'blue', likes: 12, text: 'avvistato glitch sul bus. il custode dice di aver sentito statica. un\'ora, 03:58, e nessun nome: la mia unica pista.', needs: 'visto-bus' },
    { author: 'pedro', handle: '@pedro', color: 'cyan', likes: 0, text: 'g10rn0 43. 1l r34lm è st0rt0. 1o l0 r4ddr1zz0. n0n s3rv3 r1ngr4z14rm1.', needs: 'visto-ricordi' },
    { author: 'pedro', handle: '@pedro', color: 'cyan', likes: 0, text: 'c1 4nc0r4 n0n c1 c0n0sc14m0. m4 1o t1 v3d0 g1à.', needs: 'visto-perduta' },
    { author: 'markolino', handle: '@markolino', color: 'green', likes: 5, text: 'maschere del primo custode: a 3 senti il beat, a 5 ritmo perfetto e varco verde in perduta. cercate dietro muri finti.', needs: 'visto-perduta' },
    { author: 'guastalla', handle: '@guastalla.guida', color: 'yellow', likes: 7, text: 'se qualcuno batte il citelis in 3 corse, prendo la patente e guido io. piano.', needs: 'visto-bus' },
    { author: 'samatt', handle: '@samatt851', color: 'yellow', likes: 44, text: 'microfono rosso = arena: 3 ondate, 180 barre. a 5 sei gladiatore. parola di ex pendolare.', needs: 'visto-rio' },
    { author: 'lochef85', handle: '@lochef85', color: 'red', likes: 85, text: 'c\'è posto. c\'è sempre posto. 🍖', needs: 'visto-tana' },
    { author: 'filippus il dodo', handle: '@filippus.lifts', color: 'blue', likes: 40000, text: 'panca piana 40.000 kg. estinzione: annullata. leg day: MAI saltato. ticummi: lumaca.', needs: 'visto-cantina' },
    { author: 'guggu', handle: '@guggu.citelis', color: 'yellow', likes: 7, text: 'servizio sospeso per custode. la 14 barrato tornerà. la 14 barrato torna sempre.', needs: 'boss-down-guggu' },
    { author: 'walter baruffoni', handle: '@autoscuole.marcetti', color: 'orange', likes: 3, text: 'patente in 3 annetti. garantito. i maranza fuori dalla sede non sono nostri dipendenti. purtroppo.', needs: 'visto-galliate' },
    { author: 'gecowave', handle: '@gecowave', color: 'green', likes: 9999, text: 'il disco esce quando il realm smette di collassare. quindi mai. quindi presto.' },
];

export interface RadioTrack {
    title: string;
    artist: string;
    file: string;
}

/* radio gecowave 99.2: tutta la colonna sonora, a scelta */
export const RADIO: RadioTrack[] = [
    { title: 'gecowave', artist: 'gecowave', file: 'GECOWAVE.mp3' },
    { title: 'until here', artist: 'ost', file: "Until Here's OST.mp3" },
    { title: 'tema di ivan maggini', artist: 'ivan maggini', file: "Ivan Maggini's OST 1.mp3" },
    { title: 'tema di ivan maggini II', artist: 'ivan maggini', file: "Ivan Maggini's OST 2.mp3" },
    { title: 'tema di lametta', artist: 'lametta mc', file: "Lametta MC's OST 1.mp3" },
    { title: 'tema di lametta II', artist: 'lametta mc', file: "Lametta MC's OST 2.mp3" },
    { title: 'tema di notino', artist: 'notino', file: "Notino's OST.mp3" },
    { title: 'tema di lochef85', artist: 'lochef85', file: "lochef85's OST 1.mp3" },
    { title: 'tema di lochef85 II', artist: 'lochef85', file: "lochef85's OST 2.mp3" },
    { title: 'tema di piema', artist: 'piema', file: "Piema's OST 1.mp3" },
    { title: 'tema di piema II', artist: 'piema', file: "Piema's OST 2.mp3" },
    { title: 'tommasorveglianza', artist: 'ticummi', file: 'Tommasorveglianza.mp3' },
    { title: 'destornillador', artist: 'gecowave', file: 'Destornillador-2.mp3' },
    { title: 'fragment time', artist: 'gecowave', file: 'Fragment Time.mp3' },
    { title: 'frammenti infranti', artist: 'gecowave', file: 'Frammenti Infranti.mp3' },
    { title: 'pedro tetraedro', artist: 'pedro', file: 'Pedro Tetraedro.mp3' },
    { title: 'altra #1', artist: 'gecowave', file: 'Altra #1.mp3' },
    { title: 'querela', artist: 'gecowave', file: 'Altra #2 (Querela).mp3' },
    { title: 'nostalgica', artist: 'gecowave', file: 'Altra #3 (Nostalgica).mp3' },
    { title: 'novara', artist: 'gecowave', file: 'Altra #4 (Novara).mp3' },
    { title: 'final boss fight', artist: 'piema & lametta mc', file: 'Final Boss Fight (Piema & Lametta MC).mp3' },
    { title: 'flux of coscienza', artist: 'gecowave', file: 'End Credits – Flux of coscienza.mp3' },
];
