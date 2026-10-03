import type { FolkLook } from './folk';
import type { EnemyKind, ZoneColor } from '../types';

/* le missioni dei passanti: piccole storie di gente che il realm se lo vive.
   cerca = un oggetto perso in una stanza laterale; caccia = n nemici della regione;
   consegna = un pacco da portare a qualcuno in un'altra stanza */

export type QuestKind = 'cerca' | 'caccia' | 'consegna';

export interface QuestPerson {
    look: FolkLook;
    name: string;
    color: ZoneColor;
}

export interface QuestDef {
    id: string;
    region: string;
    title: string;
    kind: QuestKind;
    giver: QuestPerson;
    /** cerca: la cosa persa; consegna: il pacco */
    thing?: { name: string; icon: string };
    recipient?: QuestPerson & { thanks: string[] };
    hunt?: { count: number; kind?: EnemyKind; label: string };
    intro: string[];
    /** se ci torni prima di finire */
    waiting: string[];
    done: string[];
    reward: { barre?: number; item?: string; amount?: number };
}

const P = (look: FolkLook, name: string, color: ZoneColor): QuestPerson => ({ look, name, color });

export const QUESTS: QuestDef[] = [
    {
        id: 'q-perduta-bastone', region: 'perduta', title: 'il bastone del pellegrino', kind: 'cerca',
        giver: P('vecchio', 'pellegrino zoppo', 'green'),
        thing: { name: 'bastone del pellegrino', icon: '🦯' },
        intro: ['ho perso il bastone quando è crollato il cielo. è rotolato in una stanza laterale, giù da qualche parte.', 'senza bastone non leggo neanche i muri. me lo riporti? ti do quello che ho.'],
        waiting: ['il bastone, custode. cerca nelle stanze fuori strada: il realm ama nascondere le cose dove non serve andare.'],
        done: ['il mio bastone! ha ancora la mia saliva sopra. sei un brav\'uomo, o un bravo geco, o quello che sei.', 'tieni: le ho conservate per il funerale, ma ormai.'],
        reward: { barre: 60, item: 'panino-nonna' },
    },
    {
        id: 'q-bus-abbonamento', region: 'bus', title: 'convalida per me', kind: 'consegna',
        giver: P('pendolare', 'pendolare disperato', 'yellow'),
        thing: { name: 'abbonamento da convalidare', icon: '🎫' },
        recipient: { ...P('vecchio', 'controllore in pensione', 'yellow'), thanks: ['un abbonamento? da convalidare? nel 2026?', 'mi hai fatto commuovere. digli che è a posto. e dagli questo, a te.'] },
        intro: ['il controllore in pensione gira ancora per il deposito. se non timbra il mio abbonamento, mi multano per l\'eternità.', 'portaglielo tu. io non posso muovermi: se mi alzo perdo il posto.'],
        waiting: ['il controllore è da qualche parte nel deposito. sembra un pendolare ma con più rancore.'],
        done: ['l\'ha timbrato?? sono libero. cioè, sono in ritardo, ma libero.'],
        reward: { barre: 40, item: 'biglietto-citelis' },
    },
    {
        id: 'q-santuario-pennello', region: 'santuario', title: 'il pennello perduto', kind: 'cerca',
        giver: P('studente', 'copista in lacrime', 'purple'),
        thing: { name: 'pennello di setola di geco', icon: '🖌️' },
        intro: ['ho perso il pennello buono. se il maestro breccio se ne accorge mi ridipinge.', 'l\'ho lanciato in una stanza laterale dalla rabbia. un attimo di arte contemporanea.'],
        waiting: ['il pennello! nelle stanze laterali. ha le setole di un mio ex compagno di corso.'],
        done: ['eccolo! adesso posso tornare a copiare 334 affreschi identici. grazie, credo.', 'questo prendilo tu: ne ho uno di riserva. è quello buono, in realtà.'],
        reward: { item: 'pennello-copista' },
    },
    {
        id: 'q-tecnokill-ban', region: 'tecnokill', title: 'ban hammer', kind: 'caccia',
        giver: P('raver', 'moderatore del server', 'red'),
        hunt: { count: 12, label: 'nemici della tecnokill' },
        intro: ['il server di notino è pieno di gente che fa failrp. io sono un moderatore. moderami il server.', 'banne una dozzina. a mano. con violenza. è l\'unico linguaggio che capiscono.'],
        waiting: ['ne mancano ancora. il roleplay è sacro, custode.'],
        done: ['server pulito. per tre secondi. è il mio record.', 'eccoti la paga da moderatore: zero. scherzo, tieni.'],
        reward: { barre: 130 },
    },
    {
        id: 'q-trenbolone-provetta', region: 'trenbolone', title: 'la provetta giusta', kind: 'cerca',
        giver: P('tecnico', 'chimico pentito', 'green'),
        thing: { name: 'provetta di vitamine vere', icon: '🧪' },
        intro: ['da qualche parte nel laboratorio c\'è l\'unica provetta che ho riempito bene. vitamine. vere.', 'trovala prima che qualcuno se la inietti per sbaglio.'],
        waiting: ['la provetta, custode. ha l\'etichetta scritta a mano: "NON È TRENBOLONE".'],
        done: ['ce l\'hai fatta. la mia carriera scientifica, in un tubetto. la regalo a te: io ormai sono fatto di altro.'],
        reward: { barre: 50, item: 'crocchetta', amount: 3 },
    },
    {
        id: 'q-tana-ricetta', region: 'tana', title: 'la ricetta segreta', kind: 'consegna',
        giver: P('cuoco', 'aiuto-cuoco tremante', 'red'),
        thing: { name: 'ricetta della nonna di qualcuno', icon: '📜' },
        recipient: { ...P('vecchio', 'assaggiatore', 'red'), thanks: ['la ricetta! finalmente qualcosa che non sa di collezione.', 'dì al ragazzo che stasera si mangia. e tu prendi questo.'] },
        intro: ['ho trovato la ricetta vera. senza ingredienti umani. va portata all\'assaggiatore prima che lochef la bruci.', 'io non posso: se esco dalla cucina mi mette nel frigo.'],
        waiting: ['l\'assaggiatore è in un\'altra stanza della tana. ha la febbre, ma ascolta.'],
        done: ['l\'ha ricevuta? allora stasera si cucina e nessuno viene cucinato. per una volta.'],
        reward: { item: 'grembiule-cuoco' },
    },
    {
        id: 'q-rio-canna', region: 'rio', title: 'il pesce più grosso', kind: 'caccia',
        giver: P('pescatore', 'pescatore filosofo', 'blue'),
        hunt: { count: 10, label: 'creature del rio' },
        intro: ['il rio è pieno di bestie che mi spaventano i sacchetti. e senza sacchetti non pesco niente.', 'fanne fuori dieci e ti regalo la canna. tanto non abbocca mai niente.'],
        waiting: ['ancora troppe bestie. i sacchetti hanno paura, custode.'],
        done: ['il rio respira. i sacchetti tornano. la canna è tua, con lei abboccano le barre.'],
        reward: { item: 'canna-pescatore' },
    },
    {
        id: 'q-stabilimento-sciopero', region: 'stabilimento', title: 'sciopero generale', kind: 'consegna',
        giver: P('tecnico', 'sindacalista', 'cyan'),
        thing: { name: 'volantino dello sciopero', icon: '📣' },
        recipient: { ...P('operaio', 'imbottigliatore stanco', 'cyan'), thanks: ['sciopero?? domani?? ...ci sto. tanto l\'acqua non la beve nessuno.', 'il sindacato ringrazia. tieni il caschetto: me l\'hanno dato a vita, la vita è lunga.'] },
        intro: ['devo far arrivare il volantino all\'imbottigliatore del turno di notte. se lo porto io, smela mi licenzia.', 'se lo porti tu, smela licenzia te. ma tu non lavori qui. vinciamo.'],
        waiting: ['l\'imbottigliatore è in un\'altra stanza. è quello con la faccia di chi imbottiglia.'],
        done: ['il turno di notte è con noi. è la prima volta che vinciamo qualcosa dal 1987.'],
        reward: { item: 'casco-operaio' },
    },
    {
        id: 'q-ruhra-tesi', region: 'ruhra', title: 'la tesi smarrita', kind: 'cerca',
        giver: P('studente', 'dottorando in crisi', 'orange'),
        thing: { name: 'tesi di dottorato (unica copia)', icon: '📚' },
        intro: ['ho perso la tesi. unica copia. niente backup, perché il backup è per chi non ha fiducia.', 'piema l\'ha lanciata dalla finestra dopo il primo capitolo. è finita in una stanza laterale.'],
        waiting: ['400 pagine, copertina rilegata. se la trovi non leggerla: è brutta.'],
        done: ['la mia tesi! ...in realtà ho deciso di mollare e aprire un bar. tienila tu. ha un buon flow, almeno.'],
        reward: { barre: 40, item: 'tesi-dottorando' },
    },
    {
        id: 'q-caso-testimone', region: 'caso', title: 'il testimone chiave', kind: 'consegna',
        giver: P('pendolare', 'informatore sotto la pioggia', 'yellow'),
        thing: { name: 'busta senza mittente', icon: '✉️' },
        recipient: { ...P('vecchio', 'testimone smemorato', 'yellow'), thanks: ['una busta? per me? ...ah. ah! adesso ricordo tutto.', 'ricordo anche che ti devo questi. strano, eh.'] },
        intro: ['c\'è un testimone che ha visto troppo e ricorda troppo poco. questa busta gli rinfresca la memoria.', 'non chiedermi cosa c\'è dentro. non chiedermi niente. è più sicuro così. per me.'],
        waiting: ['il testimone sta in un\'altra stanza del distretto. fissa la pioggia. come tutti.'],
        done: ['consegnata? bene. io non ti ho mai visto. tu non mi hai mai visto. la pioggia ci ha visti, ma non parla.'],
        reward: { barre: 120 },
    },
    {
        id: 'q-sorveglianza-cookie', region: 'sorveglianza', title: 'accetta i cookie', kind: 'caccia',
        giver: P('ombra', 'account bannato', 'cyan'),
        hunt: { count: 12, label: 'sentinelle dei server' },
        intro: ['mi hanno bannato per una recensione da due stelle. adesso sono un\'ombra nei server.', 'spegni dodici sentinelle e forse il sistema si dimentica di me. forse.'],
        waiting: ['ancora telecamere accese. sento i loro occhi nei miei metadati.'],
        done: ['il sistema ha un buco. ci sto passando dentro. addio, custode. tieni i miei risparmi, a me non servono più.'],
        reward: { barre: 220 },
    },
    {
        id: 'q-cantina-bottiglia', region: 'cantina', title: 'l\'annata perfetta', kind: 'cerca',
        giver: P('vecchio', 'sommelier', 'purple'),
        thing: { name: 'bottiglia dell\'annata perfetta', icon: '🍷' },
        intro: ['nella cantina c\'è una bottiglia dell\'annata perfetta. ticummi non lo sa. lametta l\'ha nascosta, una volta.', 'trovala. io sono troppo ubriaco per scendere le scale, e troppo sobrio per ammetterlo.'],
        waiting: ['una bottiglia polverosa, in una stanza fuori strada. la riconosci: è l\'unica piena.'],
        done: ['l\'annata perfetta... la stappo stasera. con te? no. da solo. ma ti pago.'],
        reward: { barre: 150 },
    },
    {
        id: 'q-ricordi-matita', region: 'ricordi', title: 'la matita di pedro', kind: 'cerca',
        giver: P('bimbo', 'ricordo di un compagno di classe', 'cyan'),
        thing: { name: 'matita prestata a pedro', icon: '✏️' },
        intro: ['pedro mi aveva prestato una matita. non me l\'ha mai ridata. adesso che sono un ricordo vorrei riaverla.', 'è rimasta in qualche stanza di questi giorni. i ricordi perdono le cose negli angoli.'],
        waiting: ['una matita mangiucchiata. pedro la mordeva quando pensava. pensava tanto.'],
        done: ['...è lei. ha ancora i segni dei suoi denti. pedro era un bambino, sai? prima di tutto.', 'tienila tu. io adesso posso sbiadire in pace.'],
        reward: { barre: 80, item: 'panino-nonna' },
    },
    {
        id: 'q-void-eco', region: 'void', title: 'un ti voglio bene', kind: 'consegna',
        giver: P('ombra', 'eco di un rimpianto', 'purple'),
        thing: { name: 'frase mai detta', icon: '💬' },
        recipient: { ...P('ombra', 'eco che aspetta', 'purple'), thanks: ['...me lo ha detto davvero? dopo tutto questo tempo?', 'allora posso andare. prendi questo: è l\'ultima cosa che avevo.'] },
        intro: ['sono un "ti voglio bene" mai detto. c\'è un\'altra eco che mi aspetta, in un\'altra stanza del void.', 'portami da lei. io non posso muovermi: i rimpianti stanno fermi, è la loro condanna.'],
        waiting: ['l\'altra eco sta in una stanza lontana. la riconosci: aspetta.'],
        done: ['grazie. il void è un po\' più leggero, adesso. di poco. ma è qualcosa.'],
        reward: { barre: 120, item: 'panino-nonna' },
    },
    {
        id: 'q-nucleo-cavi', region: 'nucleo', title: 'nastro adesivo', kind: 'caccia',
        giver: P('tecnico', 'tecnico del nucleo', 'cyan'),
        hunt: { count: 15, label: 'glitch del nucleo' },
        intro: ['i glitch rosicchiano i cavi del nucleo. io ho solo il nastro adesivo, e il nastro adesivo non mena.', 'tu meni. menane quindici.'],
        waiting: ['ancora glitch. sento il nucleo che si sfilaccia.'],
        done: ['cavi salvi. il realm tiene ancora un po\'. con nastro adesivo e te.'],
        reward: { barre: 230 },
    },
    {
        id: 'q-galliate-catenina', region: 'galliate', title: 'la catenina del fra', kind: 'cerca',
        giver: P('maranza', 'maranza piccolo', 'red'),
        thing: { name: 'catenina d\'oro (finto)', icon: '🪙' },
        intro: ['fra ho perso la catenina. se il maranzone lo scopre mi mette a portare l\'acqua per sempre.', 'è caduta in una stanza fuori strada. vai tu che io ho le scarpe nuove.'],
        waiting: ['la catenina fra. brilla. cioè brillava.'],
        done: ['fra sei un grande. tienila tu, io ne compro un\'altra. sono uguali, si colorano le dita uguale.'],
        reward: { item: 'catenina-maranza' },
    },
];

export function questsFor(region: string): QuestDef[] {
    return QUESTS.filter((q) => q.region === region);
}
