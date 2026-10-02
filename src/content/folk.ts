import type { ZoneColor } from '../types';

/* la gente del realm: chi abita le regioni mentre tu salvi il mondo.
   battute brevi quando passi, due chiacchiere se premi E, panico se meni */

export type FolkLook =
    | 'pendolare' | 'vecchio' | 'bimbo' | 'operaio' | 'studente' | 'cuoco' | 'nonna'
    | 'raver' | 'pescatore' | 'ombra' | 'tecnico' | 'maranza' | 'chierico' | 'ubriaco';

export interface FolkKind {
    look: FolkLook;
    /** come si presenta nel dialogo */
    name: string;
    color: ZoneColor;
    /** quando ti passa accanto */
    barks: string[];
    /** se ci parli: una delle coppie, a caso */
    talks: string[][];
    /** passo in px/s */
    pace: number;
}

/** battute che valgono ovunque, con il contesto del momento */
export const FOLK_PANIC = ['aiuto!!', 'non sono qui. non mi vedi.', 'mamma!!', 'io non c\'entro!', 'scappo, ciao', 'chiamo la tommasorveglianza!!'];
export const FOLK_PEDRO = [
    'hai sentito? pedro si avvicina.',
    'il cielo fa i glitch. brutto segno.',
    'dicono che pedro non dorma mai. neanche io, adesso.',
    'se vedi pedro digli che non sono in casa.',
];
export const FOLK_CHAT = [
    ['hai visto il custode?', 'quello? sembra stanco.'],
    ['i prezzi della wavezon...', 'una rapina. compro tutto lo stesso.'],
    ['ieri ho sognato la gecowave.', 'e com\'era?', 'in ritardo.'],
    ['secondo te il realm collassa davvero?', 'con calma, ma sì.'],
    ['mio cugino ha visto lametta.', 'sobrio?', 'no.'],
    ['ti ricordi quando i bus passavano?', 'mai successo.'],
];

const C = (look: FolkLook, name: string, color: ZoneColor, pace: number, barks: string[], talks: string[][]): FolkKind =>
    ({ look, name, color, pace, barks, talks });

/** chi abita ogni bioma */
export const FOLK: Record<string, FolkKind[]> = {
    crater: [
        C('vecchio', 'pellegrino del cratere', 'green', 34, ['bello il cratere, eh?', 'qui una volta c\'era un parcheggio.', 'non leccare quel muro. l\'ho già leccato io.'], [
            ['vengo qui ogni anno a guardare il buco.', 'il buco guarda me. siamo amici.'],
            ['la wave è caduta proprio lì.', 'ho raccolto un sassolino. dice che è un frammento. dice.'],
        ]),
        C('operaio', 'raccattarottami', 'green', 52, ['rottami, rottami freschi!', 'questo bullone era di piema. forse.', 'ehi, non calpestare la merce.'], [
            ['vendo pezzi di realm crollato.', 'garanzia: finché non crolla di nuovo.'],
        ]),
        C('bimbo', 'gechino curioso', 'green', 70, ['sei il custode?? fammi vedere la spada!', 'mia mamma dice che sei provvisorio.', 'ciao ciao ciao!'], [
            ['da grande voglio fare il custode.', 'o lo youtuber. vediamo chi paga di più.'],
        ]),
    ],
    depot: [
        C('pendolare', 'pendolare stanco', 'yellow', 40, ['il 33 passa?', 'aspetto qui dal 2019.', 'ho convalidato. tre volte.', 'non spingete.'], [
            ['sono in ritardo per il lavoro.', 'di quattro anni. ormai mi conviene aspettare la pensione qui.'],
            ['guggu ci ha chiusi qui dentro.', 'l\'abbonamento però scade lo stesso.'],
        ]),
        C('studente', 'studente in fuga', 'yellow', 64, ['ho esame tra dieci minuti.', 'il bus è il mio unico amico.', 'mi presti 2 barre?'], [
            ['studio ingegneria dei loop.', 'esame: ripetere l\'anno. lo passo sempre.'],
        ]),
        C('vecchio', 'controllore in pensione', 'yellow', 30, ['biglietto, prego.', 'favorisca il documento.', 'niente biglietto? niente realm.'], [
            ['quarant\'anni di servizio.', 'ho multato pure guggu. una volta. poi mi ha investito.'],
        ]),
    ],
    sanctum: [
        C('chierico', 'discepolo di lametta', 'purple', 36, ['tutto è disegno.', 'non toccare le pareti, sono fresche.', 'il viola è un sentimento.'], [
            ['il maestro dipinge con la rabbia.', 'noi con quello che avanza. di solito beige.'],
            ['breccio non sopporta le asimmetrie.', 'io ho un occhio più grande. vivo nel terrore.'],
        ]),
        C('studente', 'copista', 'purple', 48, ['334 affreschi. tutti uguali.', 'ho sbagliato una virgola. mi uccideranno.'], [
            ['copio gli affreschi da sei anni.', 'l\'originale l\'ho perso il primo giorno. non ditelo a nessuno.'],
        ]),
    ],
    wasteland: [
        C('raver', 'raver della tecnokill', 'red', 72, ['TUNZ TUNZ', 'il drop sta arrivando. da tre giorni.', 'non sento niente, parla più forte!'], [
            ['la festa è iniziata nel 2017.', 'non so come si esce. non so se voglio.'],
            ['notino mette solo tecnokill.', 'ho provato a chiedere un lento. mi ha dato un calcio.'],
        ]),
        C('operaio', 'rottamatore', 'red', 46, ['batterie, cavi, sogni infranti.', 'questa lamiera era un palco.'], [
            ['qui c\'era una discoteca.', 'adesso è una discarica. il dj non se n\'è accorto.'],
        ]),
    ],
    lab: [
        C('ubriaco', 'cavia del laboratorio', 'green', 38, ['mi sento fortissimo. e verde.', 'hai visto le mie vene? sono nuove.', 'la palestra è uno stato mentale.'], [
            ['lo spaccino ha detto che è tutto naturale.', 'naturale come cosa, non l\'ha detto.'],
        ]),
        C('tecnico', 'chimico pentito', 'green', 44, ['non bere niente qui dentro.', 'il trenbolone non è un integratore.', 'io la tesi la volevo fare sui funghi.'], [
            ['sintetizzavo vitamine.', 'poi ho sbagliato provetta e ho fatto flauto speroindio. non chiedere.'],
        ]),
    ],
    burrow: [
        C('cuoco', 'aiuto-cuoco terrorizzato', 'red', 58, ['lochef è nervoso oggi.', 'non fare rumore. sta impiattando.', 'il frigo... non aprire il frigo.'], [
            ['lavoro qui da tre turni.', 'il primo l\'ho passato a pelare. il secondo a scappare. il terzo è adesso.'],
            ['lochef ha una collezione.', 'di cosa, non lo so. so solo che ha uno spazio vuoto della mia misura.'],
        ]),
        C('vecchio', 'assaggiatore', 'red', 30, ['tutto squisito. ho solo un po\' di febbre.', 'il brodo parla. ascoltalo.'], [
            ['assaggio i piatti prima di lochef.', 'sono ancora vivo. lavoro precario, però.'],
        ]),
    ],
    swamp: [
        C('pescatore', 'pescatore del rio', 'blue', 32, ['abboccano solo i sacchetti.', 'oggi niente pesci. solo una scarpa.', 'il rio pulisce. tutto. anche te.'], [
            ['il rio merdone cura qualsiasi cosa.', 'mio nonno ci è caduto ubriaco ed è uscito astemio. e senza un rene.'],
            ['ho pescato un frammento della wave, una volta.', 'l\'ho ributtato. troppo piccolo.'],
        ]),
        C('nonna', 'lavandaia', 'blue', 34, ['lavo i panni nel rio da sessant\'anni.', 'puzzano? è il profumo di casa.'], [
            ['mio figlio vive in città.', 'lavora alla tommasorveglianza. guarda tutti tranne sua madre.'],
        ]),
    ],
    factory: [
        C('operaio', 'imbottigliatore', 'cyan', 50, ['acqua di smela! nuova formula!', 'non bevetela. ve lo dico da amico.', 'turno di 18 ore. normale.'], [
            ['imbottiglio l\'acqua della sorgente.', 'la sorgente è un tubo del bagno. ma ha una bella etichetta.'],
            ['smela dice che siamo una famiglia.', 'io a mia famiglia non pago lo stipendio con buoni pasto scaduti.'],
        ]),
        C('tecnico', 'sindacalista', 'cyan', 42, ['sciopero! ...domani.', 'diritti per gli operai!', 'smela, ridacci la pausa!'], [
            ['organizzo lo sciopero generale.', 'per ora siamo io e una pianta. la pianta è più motivata.'],
        ]),
    ],
    library: [
        C('studente', 'dottorando', 'orange', 46, ['la tesi è quasi pronta. dal 2016.', 'piema ha corretto la mia virgola. in rosso.', 'silenzio, per favore.'], [
            ['studio la teoria della gecowave.', 'conclusione provvisoria: è complicata. mi servono altri sei anni.'],
        ]),
        C('vecchio', 'bibliotecario', 'orange', 28, ['shhh.', 'quel libro è in prestito dal secolo scorso.', 'i libri della ruhra mordono.'], [
            ['piema non esce dal suo studio da mesi.', 'gli porto il caffè. lui mi corregge la grammatica della porta.'],
        ]),
    ],
    mind: [
        C('ombra', 'pensiero vagante', 'blue', 40, ['sono un teorema non dimostrato.', 'quindi... cosa?', 'mi stai pensando o ti sto pensando?'], [
            ['piema mi ha pensato e poi si è distratto.', 'adesso vago qui. a metà dimostrazione.'],
        ]),
    ],
    noir: [
        C('pendolare', 'informatore', 'yellow', 44, ['io non ho visto niente.', 'ho visto tutto, ma costa.', 'sotto la pioggia si dicono cose vere.'], [
            ['il limite non si arresta senza prove.', 'tre indizi. l\'ho sentito dire da uno che poi è sparito.'],
        ]),
        C('vecchio', 'testimone', 'yellow', 30, ['ero qui la notte del delitto.', 'ah no, era un\'altra notte.'], [
            ['romero fa domande strane.', 'mi ha chiesto dov\'ero ieri. io ieri ero oggi.'],
        ]),
    ],
    servers: [
        C('tecnico', 'tecnico premium', 'cyan', 46, ['il tuo traffico è stato registrato. 👍', 'i server sono caldi oggi.', 'abbonati, è sicuro.'], [
            ['controllo 4.000 telecamere.', 'nella mia stanza non ce n\'è nessuna. strano, no?'],
            ['ticummi è un genio.', 'mi paga in abbonamenti. ne ho 340.'],
        ]),
        C('ombra', 'account bannato', 'cyan', 40, ['...', 'mi hanno cancellato. esisto ancora?', 'ero un utente, una volta.'], [
            ['ho scritto una recensione negativa.', 'adesso sono un\'ombra nei server. due stelle, comunque.'],
        ]),
    ],
    cellar: [
        C('ubriaco', 'ospite della cantina', 'purple', 34, ['un altro giro!', 'vodka e disaronno. fidati.', 'il pavimento si muove o sono io?'], [
            ['sono sceso a prendere una bottiglia.', 'tre settimane fa. la bottiglia è finita, io no.'],
        ]),
        C('vecchio', 'sommelier', 'purple', 30, ['annata pessima. ottima.', 'sento note di trenbolone.'], [
            ['assaggio tutto quello che lametta lascia qui.', 'per scienza. e per noia.'],
        ]),
    ],
    memory: [
        C('bimbo', 'ricordo di un compagno di classe', 'cyan', 60, ['pedro? era gentile, una volta.', 'giochiamo a nascondino?', 'non mi ricordo il mio nome.'], [
            ['pedro mi prestava le matite.', 'poi un giorno le ha glitchate tutte. piangeva anche lui.'],
        ]),
        C('ombra', 'ricordo sbiadito', 'cyan', 36, ['...era estate, mi pare.', 'chi sei? chi ero?'], [
            ['sono un pomeriggio qualunque.', 'nessuno mi ricorda, quindi sono qui.'],
        ]),
    ],
    void: [
        C('ombra', 'eco', 'purple', 30, ['...', 'rimpianto. rimpianto.', 'torna indietro.'], [
            ['qui finiscono le cose non dette.', 'io sono un "ti voglio bene" mai detto. molto comodo, il void.'],
        ]),
    ],
    core: [
        C('tecnico', 'tecnico del nucleo', 'cyan', 50, ['la wave è instabile.', 'non toccare quel cavo. né quello.', 'il nucleo canta di notte.'], [
            ['manteniamo il cuore del realm.', 'con nastro adesivo e preghiere. soprattutto nastro.'],
        ]),
        C('operaio', 'operaio glitchato', 'cyan', 44, ['l-l-lavoro qui.', 'p-pausa caffè tra 3... 2...'], [
            ['sono stato troppo vicino al nucleo.', 'adesso esisto un po\' a scatti. ma pago meno tasse.'],
        ]),
    ],
    /* la piazza: chi è scappato dalle regioni che crollano */
    piazza: [
        C('nonna', 'nonna della fontana', 'yellow', 24, ['hai mangiato?', 'la fontana era più bella prima del crollo.', 'non correre che sudi.'], [
            ['abitavo al rio. poi è arrivata la formica.', 'adesso abito qui. la formica no. per ora.'],
            ['mio nipote fa il custode come te.', 'cioè, fa il custode di un parcheggio. ma con lo stesso impegno.'],
        ]),
        C('cuoco', 'profugo della tana', 'yellow', 46, ['niente pesto qui. niente!', 'sento ancora l\'odore della pentola.', 'lochef? non ne parliamo.'], [
            ['lavoravo per lochef.', 'paga in assaggi. ho assaggiato tutto. anche il contratto.'],
        ]),
        C('operaio', 'ex operaio dello stabilimento', 'yellow', 50, ['turno di notte, turno di giorno, turno di piazza.', 'il casco lo tengo, non si sa mai.'], [
            ['mi hanno licenziato via loop.', 'ogni volta che rientro mi rilicenziano. almeno è un lavoro fisso.'],
        ]),
        C('studente', 'fuorisede in piazza', 'yellow', 62, ['qualcuno ha visto il wifi?', 'la ruhra mi deve tre esami.', 'birra a 1 barra, chi ci sta?'], [
            ['sono scappato dalla ruhra.', 'piema mi ha messo 18 sulla fiducia. sulla MIA fiducia.'],
        ]),
        C('bimbo', 'bimbo col pallone', 'yellow', 78, ['passa! passa!', 'sei il custode? fai un tiro!', 'il pallone è finito nel realm di sotto.'], [
            ['il mio pallone è caduto in una crepa.', 'adesso è un frammento. dice la mamma.'],
        ]),
        C('ubriaco', 'cliente fisso del bar', 'yellow', 22, ['un altro giro, samatt!', 'il realm gira. o sono io.', 'io pedro lo conoscevo. prima.'], [
            ['pedro veniva qui tutti i sabati.', 'beveva acqua. ACQUA. già allora si vedeva che non stava bene.'],
            ['il bar non chiude mai.', 'perché nessuno ha mai trovato la chiave. o la porta.'],
        ]),
        C('maranza', 'maranza in trasferta', 'yellow', 64, ['fra la piazza è nostra', 'oh, tu, sì tu', 'zio passami una barra'], [
            ['siamo scesi da galliate col citelis.', 'senza biglietto. il controllore ci ha guardato e ha pianto.'],
        ]),
    ],
    province: [
        C('maranza', 'maranza di galliate', 'red', 66, ['oh frate', 'che guardi?', 'fra mi presti il telefono?', 'zio questa è la mia zona'], [
            ['qua comandiamo noi, fra.', 'cioè, il maranzone. io porto l\'acqua.'],
        ]),
        C('nonna', 'nonna al balcone', 'red', 26, ['ai miei tempi i maranza erano educati.', 'hai mangiato?', 'mettiti la maglia.'], [
            ['walter? un bravo ragazzo.', 'ha venduto un allarme anche a me. non suona mai. come mio marito.'],
        ]),
        C('pendolare', 'allievo di scuola guida', 'red', 40, ['al quinto tentativo lo passo.', 'precedenza a destra... o a sinistra?'], [
            ['l\'istruttore mi ha bocciato per uno stop.', 'non era uno stop. era un gatto. si è fermato lui.'],
        ]),
    ],
};

/** battute di chi ha visto cambiare le cose: valgono solo dopo il flag */
export const FOLK_AFTER: { flag: string; biome: string; line: string }[] = [
    { flag: 'boss-down-guggu', biome: 'depot', line: 'i bus... si fermano?? alle fermate??' },
    { flag: 'boss-down-breccio', biome: 'sanctum', line: 'il maestro breccio è caduto. finalmente possiamo sbagliare.' },
    { flag: 'boss-down-notino', biome: 'wasteland', line: 'la musica è finita. che si fa adesso, si parla?' },
    { flag: 'boss-down-lochef', biome: 'burrow', line: 'lochef è giù. stasera si cucina vegano. per vendetta.' },
    { flag: 'stabilimento-chiuso', biome: 'factory', line: 'lo stabilimento ha chiuso. siamo liberi. e disoccupati.' },
    { flag: 'boss-down-teorema', biome: 'library', line: 'piema ha ritrovato la pace. ci ha dato tutti 18.' },
    { flag: 'caso-risolto', biome: 'noir', line: 'caso chiuso. smetterà di piovere? no. ma meglio.' },
    { flag: 'boss-down-ticummi', biome: 'servers', line: 'i server sono spenti. per la prima volta mi sento solo davvero.' },
];
