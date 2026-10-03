import type { BossKind, EnemyKind } from '../types';

/* Ogni boss ha un archetipo di combattimento distinto: non solo pool di
   proiettili diversa, ma movimento, range e firma scenica diversi.
   - move: come tiene il palco (hover/stalk/strafe/turret/erratic/orbit)
   - Gli attacchi nuovi (spiral/cross/snipe/slam/mines) sono implementati
     in entities/Boss.ts: spirale rotante, croce mirata, cecchino telegrafato,
     schianto AoE, mine predittive. */

export type BossAttack =
    | 'dive' | 'charge' | 'radial' | 'rain' | 'burst' | 'teleport' | 'lamette' | 'summon'
    | 'spiral' | 'cross' | 'snipe' | 'slam' | 'mines';

export type BossMove = 'hover' | 'stalk' | 'strafe' | 'turret' | 'erratic' | 'orbit';

export interface BossDef {
    kind: BossKind;
    name: string;
    texture: string;
    hp: number;
    glowColor: number;
    /** attacchi pescati a caso, pesati per fase (1..3) */
    attacks: Record<1 | 2 | 3, BossAttack[]>;
    cooldownMs: Record<1 | 2 | 3, number>;
    summonKind?: EnemyKind;
    /** invulnerabile finché la scena non decide altrimenti (guggu senza ivan) */
    startsInvulnerable?: boolean;
    /** false per i boss opzionali: da vivi non bloccano l'uscita del livello */
    guardsExit?: boolean;
    /** sprite che trema e si teletrasporta a scatti (pedro) */
    glitchy?: boolean;
    contactDamage: number;
    bodyScale?: number;
    /** come tiene il palco: ogni boss si muove in modo diverso */
    move?: BossMove;
    /** firma scenica: cosa fa vedere invece di raccontare (usata per staging/telegraph) */
    signature?: string;
}

export const BOSSES: Record<BossKind, BossDef> = {
    // juggernaut dei bus: carica a tutto schermo + schianto che fa tremare l'arena
    guggu: {
        kind: 'guggu',
        name: 'guggu, re dei bus',
        texture: 'boss-guggu',
        hp: 60,
        glowColor: 0xfacc15,
        attacks: {
            1: ['charge', 'slam'],
            2: ['charge', 'slam', 'mines'],
            3: ['charge', 'charge', 'slam', 'mines'],
        },
        cooldownMs: { 1: 2600, 2: 2200, 3: 1700 },
        startsInvulnerable: true,
        contactDamage: 1,
        move: 'stalk',
        signature: 'carica orizzontale da capolinea + schianto',
    },
    // pittore: torrette di lame + croci di colore, quasi fermo, dipinge muri
    breccio: {
        kind: 'breccio',
        name: 'breccio, dio del disegno',
        texture: 'boss-breccio',
        hp: 26,
        glowColor: 0xc084fc,
        attacks: {
            1: ['lamette', 'cross'],
            2: ['lamette', 'cross', 'radial'],
            3: ['lamette', 'cross', 'radial'],
        },
        cooldownMs: { 1: 2400, 2: 2000, 3: 1700 },
        contactDamage: 1,
        move: 'turret',
        signature: 'muri di lame dipinte a croce',
    },
    // bambino sparacchino: panico, raffiche a spirale, cecchino quando ti avvicini
    notino: {
        kind: 'notino',
        name: 'notino, custode della tecnokill',
        texture: 'boss-notino',
        hp: 65,
        glowColor: 0xa855f7,
        attacks: {
            1: ['burst', 'spiral'],
            2: ['burst', 'spiral', 'snipe'],
            3: ['burst', 'spiral', 'snipe', 'dive'],
        },
        cooldownMs: { 1: 2200, 2: 1700, 3: 1300 },
        contactDamage: 1,
        move: 'erratic',
        signature: 'spirali di BUM + cecchino in panico',
    },
    // bot confuso: scatti casuali, picchiate sbagliate, telemetria rotta
    riba: {
        kind: 'riba',
        name: 'la riba (bot confuso)',
        texture: 'boss-riba',
        hp: 38,
        glowColor: 0xfb923c,
        attacks: {
            1: ['dive', 'teleport'],
            2: ['dive', 'teleport', 'spiral'],
            3: ['dive', 'teleport', 'spiral'],
        },
        cooldownMs: { 1: 2300, 2: 1900, 3: 1500 },
        contactDamage: 1,
        move: 'erratic',
        signature: 'teletrasporti sbagliati + picchiate storte',
    },
    // furgone consegne: pattuglia l'arena e semina mine (pacchi)
    furgone: {
        kind: 'furgone',
        name: 'il furgone delle consegne (guida smela)',
        texture: 'boss-furgone',
        hp: 60,
        glowColor: 0x22d3ee,
        attacks: {
            1: ['charge', 'mines'],
            2: ['charge', 'mines', 'summon'],
            3: ['charge', 'charge', 'mines', 'summon'],
        },
        cooldownMs: { 1: 2500, 2: 2000, 3: 1500 },
        summonKind: 'bottiglia',
        contactDamage: 1,
        guardsExit: false,
        move: 'stalk',
        signature: 'ronde + pacchi-mina sul percorso',
    },
    // fidanzato geloso: boxeur, solo corpo a corpo + schianti
    danjilo: {
        kind: 'danjilo',
        name: 'danjilo, il fidanzato di smela',
        texture: 'boss-danjilo',
        hp: 48,
        glowColor: 0x22d3ee,
        attacks: {
            1: ['charge', 'slam'],
            2: ['charge', 'slam', 'dive'],
            3: ['charge', 'charge', 'slam', 'dive'],
        },
        cooldownMs: { 1: 2400, 2: 2000, 3: 1600 },
        guardsExit: false,
        contactDamage: 1,
        move: 'stalk',
        signature: 'pressing da buttafuori, niente proiettili fase 1',
    },
    // truffatrice: zoner che allaga l'arena, sta larga e mina
    smela: {
        kind: 'smela',
        name: 'smela, in persona',
        texture: 'boss-smela',
        hp: 70,
        glowColor: 0x22d3ee,
        attacks: {
            1: ['rain', 'mines'],
            2: ['rain', 'mines', 'summon'],
            3: ['rain', 'rain', 'mines', 'summon'],
        },
        cooldownMs: { 1: 2300, 2: 1900, 3: 1500 },
        summonKind: 'bottiglia',
        contactDamage: 1,
        guardsExit: false,
        move: 'strafe',
        signature: 'allaga l\'arena, ti attira nelle pozze',
    },
    // latitante matematico: non si fa toccare, croci + cecchino da lontano
    limite: {
        kind: 'limite',
        name: 'il limite notevole (latitante)',
        texture: 'boss-limite',
        hp: 55,
        glowColor: 0x60a5fa,
        attacks: {
            1: ['cross', 'snipe'],
            2: ['cross', 'snipe', 'teleport'],
            3: ['teleport', 'cross', 'snipe', 'spiral'],
        },
        cooldownMs: { 1: 2400, 2: 1900, 3: 1400 },
        startsInvulnerable: true,
        contactDamage: 1,
        move: 'strafe',
        signature: 'tende a infinito: scappa e cecchina',
    },
    // chef stalker: ti viene addosso, schianti + cariche in cucina
    lochef: {
        kind: 'lochef',
        name: 'lochef85',
        texture: 'boss-lochef',
        hp: 70,
        glowColor: 0xf87171,
        attacks: {
            1: ['dive', 'slam'],
            2: ['dive', 'charge', 'slam'],
            3: ['charge', 'slam', 'dive', 'summon'],
        },
        cooldownMs: { 1: 2300, 2: 1900, 3: 1500 },
        summonKind: 'ammiratore',
        contactDamage: 1,
        move: 'stalk',
        signature: 'caccia col mattarello: solo melee + shockwave',
    },
    // specchio: ti orbita e spara quando spari tu, duello
    ombra: {
        kind: 'ombra',
        name: 'la tua ombra (ha studiato)',
        texture: 'boss-ombra',
        hp: 60,
        glowColor: 0x22d3ee,
        attacks: {
            1: ['snipe', 'burst'],
            2: ['snipe', 'burst', 'teleport'],
            3: ['teleport', 'snipe', 'cross', 'dive'],
        },
        cooldownMs: { 1: 2100, 2: 1700, 3: 1300 },
        glitchy: true,
        contactDamage: 1,
        bodyScale: 0.6,
        move: 'orbit',
        signature: 'duello allo specchio: orbita + cecchino',
    },
    // scienziato drone: comandante che resta alto ed evoca, spirali di copertura
    ticummi: {
        kind: 'ticummi',
        name: 'ticummi, scienziato in sedia volante',
        texture: 'boss-ticummi',
        hp: 75,
        glowColor: 0x22d3ee,
        attacks: {
            1: ['summon', 'spiral'],
            2: ['summon', 'spiral', 'rain'],
            3: ['summon', 'spiral', 'cross', 'rain'],
        },
        cooldownMs: { 1: 2400, 2: 1900, 3: 1400 },
        summonKind: 'telecamera',
        contactDamage: 1,
        move: 'hover',
        signature: 'torre di controllo: evoca e copre a spirale',
    },
    // sindaca formica: fortezza che sforna sciami, quasi immobile
    formicona: {
        kind: 'formicona',
        name: 'la formicona, sindaco di formica (FR)',
        texture: 'boss-formicona',
        hp: 40,
        glowColor: 0xfb923c,
        attacks: {
            1: ['summon', 'slam'],
            2: ['summon', 'slam', 'dive'],
            3: ['summon', 'slam', 'mines', 'dive'],
        },
        cooldownMs: { 1: 2200, 2: 1800, 3: 1400 },
        summonKind: 'formica',
        guardsExit: false,
        contactDamage: 1,
        move: 'turret',
        signature: 'fortezza-sciame: evoca, schianta chi si avvicina',
    },
    // teorema: professore geometrico, muri di croci + pioggia di numeri
    teorema: {
        kind: 'teorema',
        name: 'il teorema incompiuto',
        texture: 'boss-teorema',
        hp: 45,
        glowColor: 0x60a5fa,
        attacks: {
            1: ['cross', 'rain'],
            2: ['cross', 'rain', 'teleport'],
            3: ['teleport', 'cross', 'spiral', 'summon'],
        },
        cooldownMs: { 1: 2400, 2: 1900, 3: 1500 },
        summonKind: 'numero',
        contactDamage: 1,
        move: 'turret',
        signature: 'dimostrazione: muri geometrici da leggere',
    },
    // ricordo gentile: lento, prevedibile, quasi non vuole colpirti
    pedrino: {
        kind: 'pedrino',
        name: 'pedro, prima del glitch (un ricordo)',
        texture: 'boss-pedrino',
        hp: 50,
        glowColor: 0x67e8f9,
        attacks: {
            1: ['burst', 'cross'],
            2: ['burst', 'cross', 'dive'],
            3: ['cross', 'burst', 'spiral', 'dive'],
        },
        cooldownMs: { 1: 2700, 2: 2200, 3: 1800 },
        contactDamage: 1,
        move: 'hover',
        signature: 'ricordo gentile: pattern lenti e leggibili',
    },
    // traditore: duellante orbitale, tutto il kit glitch
    pedro: {
        kind: 'pedro',
        name: 'pedro, il traditore',
        texture: 'boss-pedro',
        hp: 100,
        glowColor: 0x22d3ee,
        attacks: {
            1: ['teleport', 'spiral', 'slam'],
            2: ['teleport', 'spiral', 'cross', 'summon'],
            3: ['teleport', 'teleport', 'spiral', 'snipe', 'summon'],
        },
        cooldownMs: { 1: 2000, 2: 1600, 3: 1200 },
        summonKind: 'glitchetto',
        glitchy: true,
        contactDamage: 1,
        move: 'orbit',
        signature: 'duello glitch: orbita + spirali + cecchino',
    },
    /* il finale vero: non si combatte pedro, si combatte l'ordine che gli hanno dato */
    glitchpedro: {
        kind: 'glitchpedro',
        name: 'il glitch (l\'ordine di lametta)',
        texture: 'boss-pedro',
        hp: 120,
        glowColor: 0xf87171,
        attacks: {
            1: ['cross', 'spiral', 'snipe'],
            2: ['cross', 'spiral', 'slam', 'summon'],
            3: ['teleport', 'teleport', 'cross', 'spiral', 'slam'],
        },
        cooldownMs: { 1: 1700, 2: 1350, 3: 1000 },
        summonKind: 'glitchetto',
        glitchy: true,
        contactDamage: 1,
        move: 'orbit',
        signature: 'l\'ordine impazzito: geometrie perfette e crudeli',
    },
    // apoteosi: due dei, uno dipinge muri l'altro riscrive proiettili
    dei: {
        kind: 'dei',
        name: 'piema & lametta',
        texture: 'boss-dei',
        hp: 200,
        glowColor: 0xffffff,
        attacks: {
            1: ['lamette', 'cross', 'slam'],
            2: ['lamette', 'cross', 'spiral', 'teleport'],
            3: ['lamette', 'spiral', 'cross', 'teleport', 'slam'],
        },
        cooldownMs: { 1: 1900, 2: 1500, 3: 1100 },
        contactDamage: 2,
        move: 'strafe',
        signature: 'duetto divino: lame + spirali in sincrono',
    },
    // ubriaco: carica a caso, rutta shockwave, imprevedibile ma lento
    flauto: {
        kind: 'flauto',
        name: 'flauto speroindio',
        texture: 'boss-flauto',
        hp: 45,
        glowColor: 0x84cc16,
        attacks: {
            1: ['charge', 'slam'],
            2: ['charge', 'slam', 'burst'],
            3: ['charge', 'slam', 'burst', 'mines'],
        },
        cooldownMs: { 1: 2400, 2: 2000, 3: 1600 },
        summonKind: 'bottiglia',
        contactDamage: 1,
        move: 'erratic',
        signature: 'rissa da osteria: cariche storte + rutto-shockwave',
    },
    // capitolo segreto: il citelis delle 7:40, sepolto sotto le dune, morde da fermo
    settequaranta: {
        kind: 'settequaranta',
        name: 'il 7:40 (morde anche da fermo)',
        texture: 'boss-settequaranta',
        hp: 80,
        glowColor: 0xfacc15,
        attacks: {
            1: ['slam', 'mines'],
            2: ['slam', 'mines', 'charge'],
            3: ['slam', 'slam', 'mines', 'charge', 'summon'],
        },
        cooldownMs: { 1: 2300, 2: 1800, 3: 1300 },
        summonKind: 'pendolare',
        contactDamage: 2,
        move: 'turret',
        signature: 'imboscata ferma: non insegue, fa esplodere il pavimento',
    },
    // capitolo segreto: il fantasma del primo custode, attacca sul beat
    custode: {
        kind: 'custode',
        name: 'il primo custode (il ritmo perfetto)',
        texture: 'boss-custode',
        hp: 90,
        glowColor: 0x4ade80,
        attacks: {
            1: ['cross', 'burst'],
            2: ['cross', 'burst', 'spiral'],
            3: ['cross', 'spiral', 'snipe', 'dive'],
        },
        // cooldown allineati al beat (500ms): 4, 3, 2 battiti
        cooldownMs: { 1: 2000, 2: 1500, 3: 1000 },
        contactDamage: 1,
        move: 'strafe',
        signature: 'metronomo: ogni colpo cade sul beat',
    },

    /* ---------- i rimpianti del void: cinque persone-ricordo, deformi,
       che custodiscono ognuna una verità: lametta (1-2) o piema (3-5).
       sono ricordi sbagliati del passato che non vogliono essere visti. */

    // burocrate: ti seppellisce di carte (mine) + raffiche d'ufficio
    delegato: {
        kind: 'delegato',
        name: 'il delegato (un rimpianto di piema)',
        texture: 'boss-delegato',
        hp: 46,
        glowColor: 0x60a5fa,
        attacks: {
            1: ['mines', 'burst'],
            2: ['mines', 'burst', 'cross'],
            3: ['mines', 'cross', 'snipe'],
        },
        cooldownMs: { 1: 2200, 2: 1800, 3: 1500 },
        guardsExit: false,
        glitchy: true,
        contactDamage: 1,
        move: 'strafe',
        signature: 'scarica-barile: mine di fogli + timbri',
    },
    // ubriaco delle 4 di notte: cariche sbilenche + lame + rutto
    notturno: {
        kind: 'notturno',
        name: 'il notturno (un rimpianto di lametta)',
        texture: 'boss-notturno',
        hp: 34,
        glowColor: 0xc084fc,
        attacks: {
            1: ['charge', 'lamette'],
            2: ['charge', 'lamette', 'slam'],
            3: ['charge', 'lamette', 'slam', 'spiral'],
        },
        cooldownMs: { 1: 2300, 2: 1900, 3: 1500 },
        contactDamage: 1,
        move: 'erratic',
        signature: 'sbronza divina: cariche storte + lame',
    },
    // modello in posa: prima posa (telegraph), poi cecchino. moda crudele
    modello: {
        kind: 'modello',
        name: 'il modello (un rimpianto di lametta)',
        texture: 'boss-modello',
        hp: 38,
        glowColor: 0xc084fc,
        attacks: {
            1: ['snipe', 'lamette'],
            2: ['snipe', 'lamette', 'cross'],
            3: ['snipe', 'lamette', 'cross', 'teleport'],
        },
        cooldownMs: { 1: 2200, 2: 1800, 3: 1400 },
        contactDamage: 1,
        move: 'strafe',
        signature: 'servizio fotografico: posa, flash, cecchino',
    },
    // revisore: cancella e riscrive i tuoi proiettili, geometrie fredde
    revisore: {
        kind: 'revisore',
        name: 'il revisore (un rimpianto di piema)',
        texture: 'boss-revisore',
        hp: 42,
        glowColor: 0x60a5fa,
        attacks: {
            1: ['cross', 'rain'],
            2: ['cross', 'rain', 'snipe'],
            3: ['cross', 'rain', 'snipe', 'summon'],
        },
        cooldownMs: { 1: 2200, 2: 1800, 3: 1400 },
        summonKind: 'numero',
        contactDamage: 1,
        move: 'hover',
        signature: 'correzione bozze: croci fredde + pioggia',
    },
    // il 33: il numero che ricorre in tutto il realm. nessuno sa perché.
    // quando si manifesta in persona, è la cosa più potente del void.
    trentatre: {
        kind: 'trentatre',
        name: 'il 33 (il numero che non doveva esistere)',
        texture: 'boss-trentatre',
        hp: 160,
        glowColor: 0xfacc15,
        // zoner puro e crudele: solo geometrie a distanza, mai corpo a corpo
        attacks: {
            1: ['spiral', 'cross', 'snipe'],
            2: ['spiral', 'cross', 'snipe', 'mines'],
            3: ['spiral', 'spiral', 'cross', 'snipe', 'lamette'],
        },
        cooldownMs: { 1: 1300, 2: 950, 3: 650 },
        summonKind: 'numero',
        guardsExit: false,
        glitchy: true,
        contactDamage: 3,
        bodyScale: 1.4,
        move: 'orbit',
        signature: 'numerologia ostile: spirali + croci + cecchino, mai vicino',
    },
    garante: {
        kind: 'garante',
        name: 'il garante (l\'ultimo rimpianto di piema)',
        texture: 'boss-garante',
        hp: 50,
        glowColor: 0x60a5fa,
        attacks: {
            1: ['snipe', 'cross', 'dive'],
            2: ['snipe', 'cross', 'teleport', 'rain'],
            3: ['snipe', 'cross', 'teleport', 'spiral', 'summon'],
        },
        cooldownMs: { 1: 2000, 2: 1600, 3: 1200 },
        summonKind: 'numero',
        glitchy: true,
        contactDamage: 1,
        move: 'hover',
        signature: 'giura il falso: nega (teleport) e cecchina',
    },

    /* ---------- la quest di walter baruffoni: galliate e le autoscuole marcetti ---------- */

    // primo maranza di galliate: spaccone, solo melee + schianto da strada
    maranza: {
        kind: 'maranza',
        name: 'un maranza con la borsa a tracolla',
        texture: 'boss-maranza',
        hp: 40,
        glowColor: 0xdc2626,
        attacks: {
            1: ['charge', 'slam'],
            2: ['charge', 'slam', 'dive'],
            3: ['charge', 'charge', 'slam'],
        },
        cooldownMs: { 1: 2200, 2: 1800, 3: 1400 },
        contactDamage: 1,
        move: 'stalk',
        signature: 'spaccone da strada: solo corpo, niente trucchi',
    },
    // il maranzone: rissa allargata, chiama la banda
    maranzone: {
        kind: 'maranzone',
        name: 'il maranzone (l\'hai guardato male)',
        texture: 'boss-maranzone',
        hp: 70,
        glowColor: 0xb91c1c,
        attacks: {
            1: ['charge', 'slam', 'mines'],
            2: ['charge', 'slam', 'mines', 'summon'],
            3: ['charge', 'charge', 'slam', 'cross', 'summon'],
        },
        cooldownMs: { 1: 2000, 2: 1600, 3: 1200 },
        summonKind: 'fiattipo',
        contactDamage: 1,
        move: 'stalk',
        signature: 'rissa: cariche + bottiglie-mine + banda',
    },
    // istruttore: esaminatore, coni di snipe + pioggia di quiz
    istruttore: {
        kind: 'istruttore',
        name: 'l\'istruttore di guida (3 annetti di livore)',
        texture: 'boss-istruttore',
        hp: 60,
        glowColor: 0xf59e0b,
        attacks: {
            1: ['snipe', 'rain'],
            2: ['snipe', 'rain', 'cross'],
            3: ['snipe', 'rain', 'cross', 'dive'],
        },
        cooldownMs: { 1: 2200, 2: 1800, 3: 1400 },
        contactDamage: 1,
        move: 'strafe',
        signature: 'esame: coni telegrafati + pioggia di quiz',
    },
    // signora anna: burocrazia offensiva, scartoffie ovunque
    annascrivania: {
        kind: 'annascrivania',
        name: 'la signora anna (alla scrivania)',
        texture: 'boss-annascrivania',
        hp: 75,
        glowColor: 0xf59e0b,
        attacks: {
            1: ['mines', 'rain'],
            2: ['mines', 'rain', 'summon'],
            3: ['mines', 'rain', 'cross', 'summon'],
        },
        cooldownMs: { 1: 2100, 2: 1700, 3: 1300 },
        summonKind: 'fiattipo',
        contactDamage: 1,
        move: 'turret',
        signature: 'sportello: scartoffie-mine + file di attesa',
    },
    // walter baruffoni: esame finale, cambia guida ogni fase
    walter: {
        kind: 'walter',
        name: 'walter baruffoni, re delle autoscuole',
        texture: 'boss-walter',
        hp: 110,
        glowColor: 0x16a34a,
        attacks: {
            1: ['charge', 'slam', 'mines'],
            2: ['charge', 'slam', 'cross', 'summon'],
            3: ['charge', 'slam', 'cross', 'spiral', 'summon'],
        },
        cooldownMs: { 1: 2000, 2: 1500, 3: 1100 },
        summonKind: 'fiattipo',
        bodyScale: 0.8,
        contactDamage: 1,
        move: 'stalk',
        signature: 'esame finale: fase 1 buttafuori, fase 2 esaminatore, fase 3 incubo',
    },
};
