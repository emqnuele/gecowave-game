import type { BossKind, ZoneColor } from '../types';

/* i boss parlano mentre si combatte: all'ingaggio, a ogni fase, quando ti
   colpiscono, quando ti curi, quando sei a un cuore, e ogni tanto da soli.
   una riga, mai un muro: chi mena non legge romanzi */

export interface BarkLine {
    by: string;
    color: ZoneColor;
    text: string;
    glitch?: boolean;
}

/** una battuta: testo nudo (parla il boss) o un'altra voce che interviene */
export type Bark = string | BarkLine;

export type BarkTrigger = 'engage' | 'phase2' | 'phase3' | 'hit' | 'heal' | 'low' | 'idle';

export interface BarkSet {
    by: string;
    color: ZoneColor;
    glitch?: boolean;
    lines: Partial<Record<BarkTrigger, Bark[]>>;
    /** momenti propri del boss (le gocce di lametta, le abitudini dell'ombra) */
    extra?: Record<string, Bark[]>;
}

const MARKS = ['̷', '̶', '̸', '̵'];

/** la parola che si sfalda: il glitch di pedro, una lettera alla volta */
export function gl(word: string): string {
    return [...word].map((c, i) => (c === ' ' ? c : c + MARKS[i % MARKS.length])).join('');
}

const pedroVoice = (text: string): BarkLine => ({ by: 'pedro', color: 'cyan', text, glitch: true });
const piema = (text: string): BarkLine => ({ by: 'piema', color: 'blue', text });
const lamettaV = (text: string): BarkLine => ({ by: 'lametta', color: 'purple', text });

export const BOSS_BARKS: Partial<Record<BossKind, BarkSet>> = {
    guggu: {
        by: 'guggu', color: 'yellow',
        lines: {
            engage: ['BIP. corsa in partenza. destinazione: TU.'],
            phase2: ['PORTE IN CHIUSURA. tenersi agli appositi sostegni.', 'deviazione! la tua fermata è soppressa!'],
            phase3: ['il loop... il loop deve girare... BIIIIP.'],
            hit: ['convalidato. sulla tua faccia.', 'si prega di non sostare sulla linea.'],
            heal: ['vietato mangiare a bordo!'],
            low: ['ultima corsa, custode. scendi qui.'],
            idle: ['il citelis non arriva. il citelis È.', 'prossima fermata: capolinea. il tuo.'],
        },
    },
    breccio: {
        by: 'breccio', color: 'purple',
        lines: {
            engage: ['in posa. non respirare, sporchi la simmetria.'],
            phase2: ['storto! sei STORTO! ti raddrizzo a lamette!'],
            phase3: ['una crepa... c\'è una crepa nel mio affresco... sei tu?'],
            hit: ['ecco. ora sei dritto. da un lato.'],
            heal: ['ti ritocchi da solo? quella è arte MIA.'],
            idle: ['0,3 gradi. ti muovi di 0,3 gradi fuori asse. lo sento.'],
        },
    },
    notino: {
        by: 'notino', color: 'red',
        lines: {
            engage: ['TECNOKILL ROUND DUE!! SPAWN PROTECTION FINITA!!'],
            phase2: ['NON VALE!! HAI HACKATO!! ti reporto!!', 'mamma!! MAMMA GUARDA!! ...no aspetta non guardare.'],
            phase3: ['pedro mi aveva detto che non finiva mai... la tecnokill...'],
            hit: ['HEADSHOT!! cioè. bodyshot. vale uguale!!'],
            heal: ['ti curi?? curarsi è FAILRP!!'],
            low: ['GG EZ!! ...no aspetta, non ancora.'],
            idle: ['regola 6: se mi colpisci è metagaming!!'],
        },
    },
    riba: {
        by: 'la riba', color: 'orange',
        lines: {
            engage: ['ok ok ora mi ricordo! dovevo ataccarti! credo'],
            phase2: ['aspeta aspeta ho sbagliato teletrasporto'],
            phase3: ['eror 404: piano non trovato. ataco a caso!'],
            hit: ['preso!! scusa!! cioè non scusa!!'],
            idle: ['chi mi ha programato? io? MALE.'],
        },
    },
    furgone: {
        by: 'smela', color: 'cyan',
        lines: {
            engage: ['consegna espressa! firma qui. col sangue.'],
            phase2: ['il navigatore dice: SOPRA DI TE. ricalcolo.'],
            phase3: ['il leasing scade domani! devo FINIRE il giro!'],
            hit: ['pacco consegnato! cinque stelle, grazie.'],
            idle: ['clacson! CLACSON! spostati, pedone del realm!'],
        },
    },
    smela: {
        by: 'smela', color: 'cyan',
        lines: {
            engage: ['una sorsata. UNA. ti cambierebbe la vita.'],
            phase2: ['è acqua PREMIUM! perché nessuno la vuole?!'],
            phase3: ['ho fatto tutto per danjilo... e per l\'azienda. soprattutto l\'azienda.'],
            hit: ['visto? ti ho idratato.'],
            heal: ['ti curi con roba non mia?! tradimento!'],
            idle: ['niente rimborsi. mai. è la filosofia aziendale.'],
        },
    },
    danjilo: {
        by: 'danjilo', color: 'cyan',
        lines: {
            engage: ['bevi. o ti faccio bere io.'],
            phase2: ['smela mi guarda! devo vincere! SMELA MI GUARDA!'],
            phase3: ['tre anni per dirle di sì... non mi rovini tutto tu.'],
            hit: ['questa era per la moquette.'],
            idle: ['rispetta la mia donna. e la sua acqua.'],
        },
    },
    limite: {
        by: 'il limite notevole', color: 'blue',
        lines: {
            engage: ['ti avvicini? io tendo. tu non arrivi mai.'],
            phase2: ['dammi un epsilon e ti scappo!'],
            phase3: ['converg... no. NO. non convergo. non per te.'],
            hit: ['vizio di forma. il tuo corpo.'],
            idle: ['romero mi cerca da quarant\'anni. mi troverà... al limite.'],
        },
    },
    lochef: {
        by: 'lochef85', color: 'red',
        lines: {
            engage: ['finalmente soli. il mattarello è per te. con affetto.'],
            phase2: ['non scappare! il brodo si intiepidisce!'],
            phase3: ['dodici statue... tredici... che bel numero, tredici.'],
            hit: ['scusa amore. no, non è vero.'],
            heal: ['mangi roba non mia?? GELOSIA.'],
            idle: ['ti ho preparato la camera. la serratura è fuori.'],
        },
    },
    ombra: {
        by: 'tommasorveglianza', color: 'cyan',
        lines: {
            engage: ['ANALISI IN CORSO. soggetto: lei. affidabilità del modello: 97%. 👍'],
            phase2: ['modello riaddestrato sugli ultimi trenta secondi. grazie per i dati.'],
            phase3: [{ by: 'la tua ombra', color: 'cyan', text: '*fa il tuo verso di geco. identico. solo più triste.*' }, 'ERRORE: il soggetto fa cose mai viste. ...interessante.'],
            hit: ['colpito. come da previsione. 👍'],
            idle: ['ogni suo passo ci costa 0,00 e ci rende 0,09.'],
        },
        extra: {
            'engage-beta': ['ANALISI IN CORSO. dati insufficienti. il modello improvviserà. 🫤'],
            'spam-side': ['sempre di lato. sempre. il modello ora para di lato.'],
            'spam-down': ['pogo, pogo, pogo. aggiornamento: niente più testa scoperta.'],
            'spam-up': ['sempre verso l\'alto. l\'ombra adesso guarda in alto.'],
            'spam-shot': ['un colpo risonante dopo l\'altro. il modello si è abituato al rumore.'],
            vary: ['cambio di ritmo rilevato. il modello... non era pronto.', 'questa non era nel footage.'],
            'heal-late': ['si cura sempre all\'ultimo. PERCHÉ? il registro lo chiede ogni notte.'],
            'heal-punish': ['previsto. si cura sempre lì. sempre adesso.'],
            dash: ['scivolata ogni due secondi. il modello scivola con lei.'],
            'learn-count': ['ogni telecamera che l\'ha vista oggi ha lavorato per me.'],
        },
    },
    ticummi: {
        by: 'ticummi', color: 'cyan',
        lines: {
            engage: ['churn rilevato. procedo all\'eliminazione.'],
            phase2: ['la sedia ha il turbo! rata extra, ma ne vale la pena.'],
            phase3: ['non ho NIENTE su di te. come si combatte uno che non accetta i cookie?'],
            hit: ['addebitato. 0,09€.'],
            idle: ['questa chiamata è registrata. per la formazione del personale.'],
        },
        extra: {
            'engage-cliente': ['cliente premium! benvenuto alla sua cancellazione.'],
        },
    },
    formicona: {
        by: 'la formicona', color: 'orange',
        lines: {
            engage: ['ordinanza n.2: il custode viene morso. seduta tolta.'],
            phase2: ['elettori! guardate il vostro sindaco!'],
            phase3: ['ho morso un dio. posso mordere anche te.'],
            hit: ['delibera approvata.'],
            idle: ['quorum raggiunto: sono tutte contro di te.'],
        },
    },
    teorema: {
        by: 'il teorema incompiuto', color: 'blue',
        lines: {
            engage: ['ipotesi: tu. tesi: morto.'],
            phase2: ['sto divergendo! è bellissimo divergere!'],
            phase3: ['piema... mi stai chiudendo tu? attraverso un GECO?'],
            hit: ['dimostrato.'],
            idle: ['ogni colpo che prendo, mi aggiungo un lemma.'],
        },
    },
    pedrino: {
        by: 'pedro (il ricordo)', color: 'cyan',
        lines: {
            engage: ['facciamo piano, va bene? qui dentro fa sempre bel tempo.'],
            phase2: ['ahia. scusa. nei backup non ci si fa male, di solito.'],
            phase3: ['il giorno 30 lametta mi ha detto una cosa bella. non voglio perderla.'],
            hit: ['oh! scusa! scusa davvero.'],
            heal: ['bravo, curati. io non posso: sono un file.'],
            idle: ['sai cosa fa un geco alle quattro del mattino? io lo so. c\'ero.'],
        },
    },
    pedro: {
        by: 'pedro', color: 'cyan', glitch: true,
        lines: {
            engage: [`va bene. ${gl('sistemo')} anche te.`],
            phase2: [`sei ${gl('storto')}. come tutto. perché non stai fermo?`],
            phase3: [`perché mi viene in mente un ${gl('muro')}? alle quattro. un ${gl('muro')}.`, `cartella ${gl('IMPORTANTE')}: accesso negato. da chi?`],
            hit: [`${gl('scusa')}. no. non scusa.`, `uno ${gl('storto')} in meno.`],
            heal: [`ti ripari. io ${gl('riparo')} il realm. siamo uguali.`],
            low: [`resta giù, custode. da sdraiati si è più ${gl('dritti')}.`],
            idle: [`raddrizzalo tu. me l'ha detto lui. alle ${gl('03:58')}.`],
        },
        extra: {
            'engage-quaderno': [`le pagine. le hai ${gl('lette')}. allora sai che mi fa male farlo.`],
            'phase2-quaderno': [`il glitch dice: colpisci. io dico: ${gl('piano')}.`],
            'phase3-quaderno': [`ciao. ciao. ${gl('ciao')}. trentatré notti. non hai mai risposto.`],
            'hit-quaderno': [`${gl('scusa')}. stavolta scusa davvero.`],
            'heal-quaderno': [`curati. ti prego, ${gl('curati')}.`],
            'low-quaderno': [`non morire. non te l'ho chiesto per ${gl('questo')}.`],
            'idle-quaderno': [`il geco del muro. non dovevi essere tu. ${gl('dovevi')} essere tu.`],
        },
    },
    glitchpedro: {
        by: 'l\'ordine', color: 'red', glitch: true,
        lines: {
            engage: ['RADDRIZZARE. tutto ciò che è storto va TOLTO.'],
            phase2: [pedroVoice(`custode... la faccia è mia ma non sono io. ${gl('colpisci')}.`), 'il custode è STORTO. procedo.'],
            phase3: [pedroVoice(`il giorno 30. tienilo in mente mentre meni. io lo ${gl('tengo')}.`), 'firmato: lametta. ore 03:58. firmato. FIRMATO.'],
            hit: ['correzione applicata.'],
            heal: ['riparare è vietato. solo togliere.'],
            low: [pedroVoice(`non mollare adesso. ${gl('adesso')} no.`)],
            idle: [pedroVoice('ancora un po\'. lo sento che si spezza.'), 'sistemare = togliere. sistemare = togliere.'],
        },
    },
    dei: {
        by: 'lametta', color: 'purple',
        lines: {
            engage: [lamettaV('tela sbagliata. si straccia.'), piema('sia messo a verbale: avevamo creduto in te.')],
            phase2: [piema('teorema della punizione, lemma due.'), lamettaV('il viola ti dona. peccato.')],
            phase3: [lamettaV('piema... e se avesse ragione lui?'), piema('non metterlo a verbale. NON metterlo a verbale.')],
            hit: [lamettaV('una pennellata. firmata.')],
            idle: [piema('quarantadue giorni per farlo. a te ne bastano quaranta minuti per rovinarlo.')],
        },
    },
    flauto: {
        by: 'flauto speroindio', color: 'orange',
        lines: {
            engage: ['*rutto di guerra*'],
            phase2: ['la birra calda è un\'arte! *rutto*'],
            phase3: ['la riserva finisce... come la mia dignità...'],
            hit: ['glug. vinto.'],
            idle: ['*canticchia una canzone di bottiglie vuote*'],
        },
    },
    settequaranta: {
        by: 'il 7:40', color: 'yellow',
        lines: {
            engage: ['BIP. nessuno scende.'],
            phase2: ['convalidare. CONVALIDARE.'],
            phase3: ['ivan diceva che la linea... la salvava lui...'],
            hit: ['morso. anche da fermo.'],
        },
    },
    custode: {
        by: 'il primo custode', color: 'green',
        lines: {
            engage: ['a tempo, custode. uno, due, tre, quattro.'],
            phase2: ['hai perso il beat. ritrovalo.'],
            phase3: ['così. COSÌ. è la mia canzone e la balli meglio di me.'],
            hit: ['fuori tempo. si paga.'],
            idle: ['centoventi battiti. il cuore del realm.'],
        },
    },
    delegato: {
        by: 'il delegato', color: 'purple',
        lines: {
            engage: ['firma qui. e qui. e qui. il realm è tuo, pedro.'],
            phase2: ['non guardare me. guarda il foglio.'],
            phase3: ['io avevo DA FARE. capisci? da fare.'],
            idle: ['raddrizzalo tu. raddrizzalo tu. raddrizzalo tu.'],
        },
    },
    notturno: {
        by: 'il notturno', color: 'purple',
        lines: {
            engage: ['*hic* sono le quattro... ho un\'idea geniale...'],
            phase2: ['domani mi libero di un pensiero! *hic*'],
            phase3: ['l\'ho detto io? l\'ho detto io, a lui?'],
            idle: ['03:58. l\'ultima boccetta. l\'ultima, giuro.'],
        },
    },
    modello: {
        by: 'il modello', color: 'purple',
        lines: {
            engage: ['in posa, pedro. gli occhi un po\' storti.'],
            phase2: ['flash! l\'arte non anticipa. ORDINA.'],
            phase3: ['era venuto bene... perché ha fatto quello che ho disegnato?'],
            idle: ['tre pennellate. un passo indietro.'],
        },
    },
    revisore: {
        by: 'il revisore', color: 'blue',
        lines: {
            engage: ['questa riga non va bene. la correggo.'],
            phase2: ['penna blu. la verità è solo una bozza.'],
            phase3: ['l\'ho fatto per lui. per il socio. per il socio.'],
            idle: ['"piema indaga sull\'anomalia". molto meglio.'],
        },
    },
    garante: {
        by: 'il garante', color: 'blue',
        lines: {
            engage: ['non sapevo. non sapevo. non sapevo.'],
            phase2: ['mettetelo a verbale: NON sapevo.'],
            phase3: ['...sapevo. sapevo da prima dei sei giorni.'],
            idle: ['*mano alzata. bocca cucita.*'],
        },
    },
    trentatre: {
        by: 'il 33', color: 'yellow',
        lines: {
            engage: ['trentatré. contale.'],
            phase2: ['ventidue... ventitré... conto le notti. le sue.'],
            phase3: ['la trentatreesima. l\'ultima volta che è venuto. io sono quella notte.'],
            idle: ['tre e tre. ciao e ciao.'],
        },
    },
    walter: {
        by: 'walter baruffoni', color: 'green',
        lines: {
            engage: ['esame finale. niente foglio rosa.'],
            phase2: ['tre annetti! TRE ANNETTI per questo!'],
            phase3: ['zzz... no. sveglio. SVEGLIO.'],
            hit: ['bocciato.'],
            idle: ['verisure. pensaci.'],
        },
    },
    maranza: {
        by: 'un maranza', color: 'red',
        lines: { engage: ['aoh! che me guardi?'], phase3: ['mo chiamo mi cugino.'], hit: ['VIA!'] },
    },
    maranzone: {
        by: 'il maranzone', color: 'red',
        lines: { engage: ['m\'hai guardato MALE.'], phase2: ['A ME?!'], hit: ['patente per l\'aldilà. timbrata.'] },
    },
    istruttore: {
        by: 'l\'istruttore', color: 'orange',
        lines: { engage: ['precedenza a destra. tu no.'], phase2: ['bocciato. di nuovo.'], hit: ['meno dieci punti.'] },
    },
    annascrivania: {
        by: 'la signora anna', color: 'orange',
        lines: { engage: ['numeretto?'], phase2: ['pratica respinta.'], hit: ['timbrato.'] },
    },
};

/** lametta presiede l'arena del santuario: non è un boss, ma parla come uno */
export const LAMETTA_BARKS: BarkSet = {
    by: 'lametta', color: 'purple',
    lines: {
        engage: ['ferma così. no. quella posa è banale.'],
        hit: ['una lametta. firmata.', 'sangue. finalmente un po\' di colore.'],
        heal: ['ti ritocchi? lascia fare a chi sa.'],
        idle: ['ti disegnerei storto. mi viene benissimo, storto.', 'non guardarmi così. tutti mi guardano così, alla fine.'],
    },
    extra: {
        'goccia-1': ['il rosso. ti dona. è il colore della rabbia, lo sapevi?'],
        'goccia-2': ['verde. mi stai rubando i colori. nessuno ci aveva mai provato.'],
        'goccia-3': ['blu... anche lui stava fermo così, in posa. poi si muoveva. come te.'],
        'goccia-4': ['giallo. basta. un dio non si fa svuotare la tavolozza da un geco.'],
        'goccia-5': ['...viola. lo specchio è aperto. vai, prima che ti ridisegni.'],
    },
};

/** il set di battute di un boss, con le varianti che dipendono dalla storia */
export function barksFor(kind: BossKind): BarkSet | null {
    return BOSS_BARKS[kind] ?? null;
}

