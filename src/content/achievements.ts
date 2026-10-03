import type { SaveData } from '../types';
import { QUESTS } from './quests';

/* i trofei del realm: si sbloccano solo senza modalità assistita.
   quelli segreti restano ??? finché non li prendi */

export interface AchievementDef {
    id: string;
    name: string;
    desc: string;
    icon: string;
    secret?: boolean;
    /** condizione sul salvataggio; quelli senza si sbloccano da un evento */
    check?: (s: SaveData) => boolean;
}

const flag = (f: string) => (s: SaveData) => s.flags.includes(f);

export const REGION_COUNT = 20;
const QUEST_TOTAL = QUESTS.length;

export const ACHIEVEMENTS: AchievementDef[] = [
    // la strada principale
    { id: 'custode-provvisorio', icon: '✦', name: 'custode provvisorio', desc: 'raccogli il primo frammento della gecowave.', check: (s) => s.abilities.length >= 1 },
    { id: 'convalidato', icon: '🚌', name: 'convalidato', desc: 'sconfiggi guggu, re dei bus.', check: flag('boss-down-guggu') },
    { id: 'critico-d-arte', icon: '🎨', name: 'critico d\'arte', desc: 'spacca la simmetria di breccio.', check: flag('boss-down-breccio') },
    { id: 'failrp', icon: '🔫', name: 'fail rp', desc: 'chiudi il server di notino.', check: flag('boss-down-notino') },
    { id: 'astemio', icon: '🍾', name: 'astemio per forza', desc: 'manda a dormire flauto speroindio.', check: flag('boss-down-flauto') },
    { id: 'chef-stellato', icon: '🔪', name: 'chef stellato', desc: 'sopravvivi alla tana e batti lochef85.', check: flag('boss-down-lochef') },
    { id: 'sindaco-decaduto', icon: '🐜', name: 'sindaco decaduto', desc: 'sfratta la formicona.', check: flag('boss-down-formicona') },
    { id: 'acqua-passata', icon: '💧', name: 'acqua passata', desc: 'chiudi lo stabilimento di smela.', check: flag('stabilimento-chiuso') },
    { id: 'qed', icon: '∎', name: 'come volevasi dimostrare', desc: 'completa il teorema nella mente di piema.', check: flag('boss-down-teorema') },
    { id: 'caso-chiuso', icon: '🕵️', name: 'caso chiuso', desc: 'arresta il limite notevole.', check: flag('caso-risolto') },
    { id: 'specchio-rotto', icon: '🪞', name: 'specchio rotto', desc: 'batti la tua ombra.', check: flag('boss-down-ombra') },
    { id: 'disdetta', icon: '📡', name: 'disdetta', desc: 'chiudi il conto con ticummi.', check: flag('boss-down-ticummi') },
    { id: 'infanzia', icon: '🧸', name: 'prima del glitch', desc: 'cammina nei ricordi di pedro fino in fondo.', check: flag('ricordi-visti') },
    { id: 'rimpianti', icon: '🕳️', name: 'cinque verità', desc: 'guarda tutti i rimpianti del void.', check: flag('void-concluso') },
    // finali
    { id: 'finale-consegna', icon: '🌊', name: 'la wave torna a casa', desc: 'consegna le wave agli dei.', secret: true, check: flag('finale-consegna') },
    { id: 'finale-dei', icon: '⚡', name: 'più forte degli dei', desc: 'tieniti le wave e vinci.', secret: true, check: flag('finale-dei') },
    { id: 'finale-riscatto', icon: '📁', name: 'cartella importante', desc: 'il finale vero: affida le wave a pedro, quello del giorno 30.', secret: true, check: flag('finale-riscatto') },
    { id: 'finale-pedro', icon: '🌀', name: 'il patto', desc: 'segui pedro fino alla fine.', secret: true, check: flag('finale-pedro') },
    // segreti e scelte
    { id: 'geco-del-muro', icon: '📒', name: 'il geco del muro', desc: 'ricomponi il quaderno strappato di pedro.', secret: true, check: flag('quaderno-completo') },
    { id: 'come-piema', icon: '🫥', name: 'come piema', desc: 'cancella il pensiero sepolto.', secret: true, check: flag('pensiero-cancellato') },
    { id: 'la-riga-vera', icon: '🧾', name: 'la riga vera', desc: 'porta fuori dalla testa di piema il pensiero sepolto.', secret: true, check: flag('pensiero-portato') },
    { id: 'polpette', icon: '🍝', name: 'è pronto in tavola', desc: 'rimanda notino da sua madre.', secret: true, check: flag('notino-a-casa') },
    { id: 'zucchero', icon: '☕', name: 'con lo zucchero', desc: 'offri a romero il caffè che aspettava da quarant\'anni.', secret: true, check: flag('caffe-romero') },
    { id: 'storie', icon: '📜', name: 'chi c\'era', desc: 'leggi quaranta note sparse per il realm.', check: flag('storie-del-realm') },
    { id: 'archivista', icon: '📖', name: 'archivista', desc: 'leggi 20 voci del codex (note + pagine).', check: (s) => s.collectedLore.filter((k) => k.startsWith('nota-') || k.startsWith('pagina-pedro-')).length >= 20 },
    { id: 'ti-guarda', icon: '📡', name: 'ti guarda già', desc: 'ascolta tutti gli echi di pedro prima del nucleo.', check: (s) => ['pedro-eco-perduta', 'pedro-eco-bus', 'pedro-eco-santuario', 'pedro-eco-tecnokill', 'pedro-eco-trenbolone', 'pedro-osserva-rio'].every((f) => s.flags.includes(f)) },
    { id: 'il-33', icon: '3️⃣', name: 'il numero ti rispetta', desc: 'batti il 33 nel void.', secret: true, check: flag('boss-down-trentatre') },
    { id: 'capolinea', icon: '🚏', name: 'ultima corsa', desc: 'trova la 14 barrato e il suo passeggero.', secret: true, check: flag('boss-down-settequaranta') },
    { id: 'sul-beat', icon: '🥁', name: 'sul beat', desc: 'batti il primo custode.', secret: true, check: flag('boss-down-custode') },
    { id: 'patente', icon: '🚗', name: 'patente in tre annetti', desc: 'chiudi la faccenda con walter baruffoni.', secret: true, check: flag('boss-down-walter') },
    { id: 'abbonato', icon: '👍', name: 'assolutamente sicuro', desc: 'abbonati alla tommasorveglianza.', check: flag('tommasorveglianza') },
    { id: 'pieta', icon: '🤲', name: 'pietà', desc: 'ridai la boccetta a ticummi.', secret: true, check: flag('ticummi-graziato') },
    { id: 'tolleranza-zero', icon: '🥾', name: 'tolleranza zero', desc: 'calpesta il trenbolone davanti a ticummi.', secret: true, check: flag('trenbolone-distrutto') },
    // collezioni
    { id: 'maschere', icon: '🎭', name: 'tutte le facce', desc: 'raccogli tutte le maschere.', check: flag('maschera-completa') },
    { id: 'wave-intera', icon: '🌊', name: 'la wave intera', desc: 'riunisci tutti e otto i frammenti.', check: (s) => s.abilities.length >= 8 },
    { id: 'cuore-grande', icon: '❤️', name: 'cuore grande', desc: 'trova cinque cuori del realm.', check: (s) => s.collectedLore.filter((k) => k.startsWith('cuore-')).length >= 5 },
    { id: 'collezionista', icon: '🔮', name: 'collezionista', desc: 'possiedi otto amuleti.', check: (s) => s.charms.length >= 8 },
    { id: 'ricco', icon: '♪', name: 'disco d\'oro', desc: 'tieni in tasca 1000 barre.', check: (s) => s.barre >= 1000 },
    // esplorazione e gente
    { id: 'cartografo', icon: '🗺️', name: 'cartografo', desc: 'esplora ogni stanza di una regione.' },
    { id: 'gecografo', icon: '🧭', name: 'gecografo', desc: 'esplora ogni stanza di tutte le regioni.' },
    { id: 'chiacchierone', icon: '💬', name: 'chiacchierone', desc: 'fai due chiacchiere con 25 passanti.', check: (s) => s.record.talks >= 25 },
    { id: 'buon-samaritano', icon: '🤝', name: 'buon samaritano', desc: 'completa 5 missioni dei passanti.', check: (s) => Object.values(s.quests).filter((q) => q.s === 'fatta').length >= 5 },
    { id: 'tuttofare', icon: '🧰', name: 'tuttofare del realm', desc: 'completa tutte le missioni dei passanti.', check: (s) => Object.values(s.quests).filter((q) => q.s === 'fatta').length >= QUEST_TOTAL },
    // combattimento
    { id: 'intoccabile', icon: '🛡️', name: 'intoccabile', desc: 'batti un boss di trama senza farti colpire.' },
    { id: 'sterminatore', icon: '💀', name: 'sterminatore', desc: 'sconfiggi 300 nemici.', check: (s) => s.record.kills >= 300 },
    { id: 'flop', icon: '🪦', name: 'il flop è parte del processo', desc: 'muori 25 volte. succede.', check: (s) => s.record.deaths >= 25 },
    { id: 'gladiatore', icon: '🎤', name: 'gladiatore del realm', desc: 'vinci cinque sfide del microfono rosso.', check: (s) => s.flags.filter((f) => f.startsWith('arena-vinta-')).length >= 5 },
    { id: 'lancette', icon: '🚌', name: 'più veloce del citelis', desc: 'vinci cinque corse contro il citelis.', check: (s) => s.flags.filter((f) => f.startsWith('corsa-vinta-')).length >= 5 },
    { id: 'speedrun', icon: '⏱️', name: 'di corsa', desc: 'completa la wave perduta in meno di 6 minuti.' },
];
