import type { BossKind, EnemyKind } from '../types';

export type BossAttack = 'dive' | 'charge' | 'radial' | 'rain' | 'burst' | 'teleport' | 'lamette' | 'summon';

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
}

export const BOSSES: Record<BossKind, BossDef> = {
    guggu: {
        kind: 'guggu',
        name: 'guggu, re dei bus',
        texture: 'boss-guggu',
        hp: 60,
        glowColor: 0xfacc15,
        attacks: {
            1: ['charge', 'rain'],
            2: ['charge', 'rain', 'summon'],
            3: ['charge', 'charge', 'rain', 'summon'],
        },
        cooldownMs: { 1: 2600, 2: 2200, 3: 1700 },
        summonKind: 'pendolare',
        startsInvulnerable: true,
        contactDamage: 1,
    },
    breccio: {
        kind: 'breccio',
        name: 'breccio, dio del disegno',
        texture: 'boss-breccio',
        hp: 26,
        glowColor: 0xc084fc,
        attacks: {
            1: ['radial', 'lamette'],
            2: ['radial', 'lamette', 'burst'],
            3: ['radial', 'lamette', 'burst'],
        },
        cooldownMs: { 1: 2400, 2: 2000, 3: 1700 },
        contactDamage: 1,
    },
    notino: {
        kind: 'notino',
        name: 'notino, custode della tecnokill',
        texture: 'boss-notino',
        hp: 65,
        glowColor: 0xa855f7,
        attacks: {
            1: ['burst', 'dive'],
            2: ['burst', 'burst', 'rain'],
            3: ['burst', 'rain', 'radial', 'dive'],
        },
        cooldownMs: { 1: 2200, 2: 1700, 3: 1300 },
        contactDamage: 1,
    },
    riba: {
        kind: 'riba',
        name: 'la riba (bot confuso)',
        texture: 'boss-riba',
        hp: 38,
        glowColor: 0xfb923c,
        attacks: {
            1: ['dive', 'burst'],
            2: ['dive', 'burst', 'radial'],
            3: ['dive', 'radial', 'burst'],
        },
        cooldownMs: { 1: 2300, 2: 1900, 3: 1500 },
        contactDamage: 1,
    },
    furgone: {
        kind: 'furgone',
        name: 'il furgone delle consegne (guida smela)',
        texture: 'boss-furgone',
        hp: 60,
        glowColor: 0x22d3ee,
        attacks: {
            1: ['charge', 'rain'],
            2: ['charge', 'rain', 'summon'],
            3: ['charge', 'charge', 'rain', 'summon'],
        },
        cooldownMs: { 1: 2500, 2: 2000, 3: 1500 },
        summonKind: 'bottiglia',
        contactDamage: 1,
    },
    danjilo: {
        kind: 'danjilo',
        name: 'danjilo, il fidanzato di smela',
        texture: 'boss-danjilo',
        hp: 48,
        glowColor: 0x22d3ee,
        attacks: {
            1: ['charge', 'dive'],
            2: ['charge', 'dive', 'burst'],
            3: ['charge', 'charge', 'dive', 'burst'],
        },
        cooldownMs: { 1: 2400, 2: 2000, 3: 1600 },
        // miniboss di metà livello: non blocca l'uscita se lo schivi
        guardsExit: false,
        contactDamage: 1,
    },
    smela: {
        kind: 'smela',
        name: 'smela, in persona',
        texture: 'boss-smela',
        hp: 70,
        glowColor: 0x22d3ee,
        attacks: {
            1: ['rain', 'burst'],
            2: ['rain', 'burst', 'summon'],
            3: ['rain', 'rain', 'burst', 'summon'],
        },
        cooldownMs: { 1: 2300, 2: 1900, 3: 1500 },
        summonKind: 'bottiglia',
        contactDamage: 1,
    },
    limite: {
        kind: 'limite',
        name: 'il limite notevole (latitante)',
        texture: 'boss-limite',
        hp: 55,
        glowColor: 0x60a5fa,
        attacks: {
            1: ['radial', 'rain'],
            2: ['radial', 'rain', 'teleport'],
            3: ['teleport', 'radial', 'rain', 'burst'],
        },
        cooldownMs: { 1: 2400, 2: 1900, 3: 1400 },
        // non si arresta un limite senza prove: servono i 3 indizi
        startsInvulnerable: true,
        contactDamage: 1,
    },
    lochef: {
        kind: 'lochef',
        name: 'lochef85, il perverso',
        texture: 'boss-lochef',
        hp: 70,
        glowColor: 0xf87171,
        attacks: {
            1: ['dive', 'burst'],
            2: ['dive', 'charge', 'burst'],
            3: ['charge', 'dive', 'burst', 'summon'],
        },
        cooldownMs: { 1: 2300, 2: 1900, 3: 1500 },
        summonKind: 'ammiratore',
        contactDamage: 1,
    },
    ombra: {
        kind: 'ombra',
        name: 'la tua ombra (ha studiato)',
        texture: 'boss-ombra',
        /* hp da cliente premium: con l'abbonamento il clone ha mesi di footage.
           senza, la scena lo declassa a 34: dataset incompleto */
        hp: 60,
        glowColor: 0x22d3ee,
        attacks: {
            1: ['charge', 'dive'],
            2: ['charge', 'dive', 'teleport'],
            3: ['teleport', 'charge', 'burst', 'dive'],
        },
        cooldownMs: { 1: 2100, 2: 1700, 3: 1300 },
        glitchy: true,
        contactDamage: 1,
        bodyScale: 0.6,
    },
    ticummi: {
        kind: 'ticummi',
        name: 'ticummi, scienziato in sedia volante',
        texture: 'boss-ticummi',
        hp: 75,
        glowColor: 0x22d3ee,
        attacks: {
            1: ['radial', 'rain'],
            2: ['radial', 'rain', 'summon'],
            3: ['radial', 'rain', 'burst', 'summon'],
        },
        cooldownMs: { 1: 2400, 2: 1900, 3: 1400 },
        summonKind: 'telecamera',
        contactDamage: 1,
    },
    formicona: {
        kind: 'formicona',
        name: 'la formicona, sindaco di formica (FR)',
        texture: 'boss-formicona',
        hp: 40,
        glowColor: 0xfb923c,
        attacks: {
            1: ['charge', 'dive'],
            2: ['charge', 'dive', 'summon'],
            3: ['charge', 'summon', 'dive', 'burst'],
        },
        cooldownMs: { 1: 2200, 2: 1800, 3: 1400 },
        summonKind: 'formica',
        guardsExit: false,
        contactDamage: 1,
    },
    teorema: {
        kind: 'teorema',
        name: 'il teorema incompiuto',
        texture: 'boss-teorema',
        hp: 45,
        glowColor: 0x60a5fa,
        attacks: {
            1: ['radial', 'rain'],
            2: ['radial', 'rain', 'teleport'],
            3: ['teleport', 'radial', 'burst', 'summon'],
        },
        cooldownMs: { 1: 2400, 2: 1900, 3: 1500 },
        summonKind: 'numero',
        contactDamage: 1,
    },
    pedrino: {
        kind: 'pedrino',
        name: 'pedro, prima del glitch (un ricordo)',
        texture: 'boss-pedrino',
        hp: 50,
        glowColor: 0x67e8f9,
        attacks: {
            1: ['burst', 'dive'],
            2: ['burst', 'dive', 'teleport'],
            3: ['teleport', 'burst', 'radial', 'dive'],
        },
        cooldownMs: { 1: 2300, 2: 1800, 3: 1400 },
        contactDamage: 1,
    },
    pedro: {
        kind: 'pedro',
        name: 'pedro, il traditore',
        texture: 'boss-pedro',
        hp: 100,
        glowColor: 0x22d3ee,
        attacks: {
            1: ['teleport', 'burst', 'dive'],
            2: ['teleport', 'radial', 'burst', 'summon'],
            3: ['teleport', 'teleport', 'radial', 'rain', 'summon'],
        },
        cooldownMs: { 1: 2000, 2: 1600, 3: 1200 },
        summonKind: 'glitchetto',
        glitchy: true,
        contactDamage: 1,
    },
    dei: {
        kind: 'dei',
        name: 'piema & lametta',
        texture: 'boss-dei',
        hp: 120,
        glowColor: 0xffffff,
        attacks: {
            1: ['lamette', 'radial', 'dive'],
            2: ['lamette', 'radial', 'rain', 'teleport'],
            3: ['lamette', 'rain', 'radial', 'teleport', 'dive'],
        },
        cooldownMs: { 1: 1900, 2: 1500, 3: 1100 },
        contactDamage: 2,
    },
    flauto: {
        kind: 'flauto',
        name: 'flauto speroindio',
        texture: 'boss-flauto',
        hp: 45,
        glowColor: 0x84cc16,
        attacks: {
            1: ['charge', 'burst'],
            2: ['charge', 'burst', 'summon'],
            3: ['charge', 'burst', 'summon', 'radial'],
        },
        cooldownMs: { 1: 2400, 2: 2000, 3: 1600 },
        summonKind: 'bottiglia',
        contactDamage: 1,
    },
    // capitolo segreto: il citelis delle 7:40, sepolto sotto le dune, morde da fermo
    settequaranta: {
        kind: 'settequaranta',
        name: 'il 7:40 (morde anche da fermo)',
        texture: 'boss-settequaranta',
        hp: 80,
        glowColor: 0xfacc15,
        attacks: {
            1: ['charge', 'rain'],
            2: ['charge', 'rain', 'summon'],
            3: ['charge', 'charge', 'rain', 'burst', 'summon'],
        },
        cooldownMs: { 1: 2300, 2: 1800, 3: 1300 },
        summonKind: 'pendolare',
        contactDamage: 2,
    },
    // capitolo segreto: il fantasma del primo custode, attacca sul beat
    custode: {
        kind: 'custode',
        name: 'il primo custode (il ritmo perfetto)',
        texture: 'boss-custode',
        hp: 90,
        glowColor: 0x4ade80,
        attacks: {
            1: ['radial', 'burst'],
            2: ['radial', 'burst', 'rain'],
            3: ['radial', 'rain', 'burst', 'dive'],
        },
        // cooldown allineati al beat (500ms): 4, 3, 2 battiti
        cooldownMs: { 1: 2000, 2: 1500, 3: 1000 },
        contactDamage: 1,
    },

    /* ---------- i rimpianti del void: cinque persone-ricordo, deformi,
       che custodiscono ognuna una verità su lametta (1-3) o piema (4-5).
       sono ricordi sbagliati del passato che non vogliono essere visti. */

    // lametta che delega: «raddrizzalo tu». scarica responsabilità a mani aperte
    delegato: {
        kind: 'delegato',
        name: 'il delegato (un rimpianto di lametta)',
        texture: 'boss-delegato',
        hp: 28,
        glowColor: 0xc084fc,
        attacks: {
            1: ['radial', 'burst'],
            2: ['radial', 'burst', 'dive'],
            3: ['radial', 'burst', 'dive'],
        },
        cooldownMs: { 1: 2400, 2: 2000, 3: 1700 },
        guardsExit: false,
        glitchy: true,
        contactDamage: 1,
    },
    // lametta delle quattro di notte, fatto di trenbolone, che firma l'ordine
    notturno: {
        kind: 'notturno',
        name: 'il notturno (un rimpianto di lametta)',
        texture: 'boss-notturno',
        hp: 34,
        glowColor: 0xc084fc,
        attacks: {
            1: ['charge', 'lamette'],
            2: ['charge', 'lamette', 'rain'],
            3: ['charge', 'lamette', 'rain', 'burst'],
        },
        cooldownMs: { 1: 2300, 2: 1900, 3: 1500 },
        contactDamage: 1,
    },
    // pedro in posa nel ritratto: disegnato già storto, prima del glitch
    modello: {
        kind: 'modello',
        name: 'il modello (un rimpianto di lametta)',
        texture: 'boss-modello',
        hp: 38,
        glowColor: 0xc084fc,
        attacks: {
            1: ['radial', 'lamette'],
            2: ['radial', 'lamette', 'teleport'],
            3: ['radial', 'lamette', 'teleport', 'burst'],
        },
        cooldownMs: { 1: 2200, 2: 1800, 3: 1400 },
        contactDamage: 1,
    },
    // piema che riscrive i log per coprire il socio: cancella e riscrive
    revisore: {
        kind: 'revisore',
        name: 'il revisore (un rimpianto di piema)',
        texture: 'boss-revisore',
        hp: 42,
        glowColor: 0x60a5fa,
        attacks: {
            1: ['rain', 'radial'],
            2: ['rain', 'radial', 'teleport'],
            3: ['rain', 'radial', 'teleport', 'summon'],
        },
        cooldownMs: { 1: 2200, 2: 1800, 3: 1400 },
        summonKind: 'numero',
        contactDamage: 1,
    },
    // piema che giura il falso e tace per amore: il rimpianto peggiore
    garante: {
        kind: 'garante',
        name: 'il garante (l\'ultimo rimpianto di piema)',
        texture: 'boss-garante',
        hp: 50,
        glowColor: 0x60a5fa,
        attacks: {
            1: ['radial', 'rain', 'dive'],
            2: ['radial', 'rain', 'teleport', 'burst'],
            3: ['radial', 'rain', 'teleport', 'burst', 'summon'],
        },
        cooldownMs: { 1: 2000, 2: 1600, 3: 1200 },
        summonKind: 'numero',
        glitchy: true,
        contactDamage: 1,
    },
};
