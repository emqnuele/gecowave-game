import { gl } from './barks';

/* pedro in scena, una volta per regione dal bus in poi: compare sul percorso,
   dice due righe e si sfalda. sempre chiaro, mai un indovinello. l'1% di lui
   che non ha eseguito l'ordine continua a parlarti, e non sa perché */

export const PEDRO_APPARITIONS: Record<string, [string, string]> = {
    bus: [
        `"provvisorio", ti hanno detto. chi te l'ha scritto, a ${gl('matita')}?`,
        'guggu è pieno. ivan sa tagliarlo. non dire a nessuno che te l\'ho detto io.',
    ],
    santuario: [
        `lametta dipinge. ha dipinto anche me, una volta. nel quadro ero ${gl('dritto')}.`,
        'se trovi il ritratto con gli occhi storti, non guardarlo troppo. fa male.',
    ],
    tecnokill: [
        'notino spara perché gli ho detto che la tecnokill non finisce mai. era una bugia.',
        `anche a me hanno detto una cosa così. vai. testa ${gl('bassa')}.`,
    ],
    trenbolone: [
        'lametta comprava qui. alle quattro. sempre alle quattro.',
        `non bere niente, custode. alla fine ti voglio ${gl('pulito')}.`,
    ],
    tana: [
        'lochef apparecchia per due. tu non sederti. corri.',
        `...perché ti sto aiutando? non lo so. il 99% di me dice di ${gl('smettere')}.`,
    ],
    rio: [
        `il fiume ti ha curato. me niente mi cura: io sono l'${gl('ordine')}.`,
        `i 33 sui muri. li hai visti? non so chi li dipinge. ho le dita ${gl('azzurre')}.`,
    ],
    stabilimento: [
        'smela vende acqua che non è acqua. io vendo un realm dritto che non è un realm.',
        'attraversa. non fermarti per me.',
    ],
    ruhra: [
        'piema ha riscritto una riga, tanto tempo fa. una riga su di me.',
        `quando la trovi, non ${gl('cancellarla')}. ti prego.`,
    ],
    mente: [
        'la testa di piema è in ordine. la mia era così, prima degli appunti.',
        `il pensiero in fondo. lo sai già, cosa ${gl('farne')}.`,
    ],
    caso: [
        'romero cerca la mano che mi ha caricato. la insegue da quarant\'anni. solo che non lo sa.',
        `un vecchio con le ginocchia rotte. mi ${gl('piace')}. non dirglielo.`,
    ],
    sorveglianza: [
        'qui mi guardavano dormire. poi una notte: click. più nessuno.',
        `l'ombra sei tu, comprato a 0,09. io sono lametta, ${gl('regalato')}.`,
    ],
    cantina: [
        `è lì sotto, legato. il mio creatore. dovrei ${gl('odiarlo')}.`,
        'slegalo. ...non so perché te lo chiedo.',
    ],
    ricordi: [
        'sei nei miei giorni. cammina piano: sono gli unici puliti.',
        `il giorno 30 non lasciarlo qui. ${gl('portalo')} con te.`,
    ],
    void: [
        'romero ha ragione. su tutto. e non cambia niente.',
        `l'ordine si è mosso. vieni al nucleo, custode del ${gl('muro')}.`,
    ],
};
