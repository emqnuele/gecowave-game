import type { AbilityId, EnemyKind } from '../types';

/* ogni regione ha i suoi due o tre nemici simbolo, e ognuno insegna una mossa:
   è duro se lo affronti a caso, facile se usi quella. la prima volta che lo
   vedi markolino te lo dice in una riga, poi è il nemico a ricordartelo */

/** da dove arriva un colpo del geco */
export type HitSource = 'side' | 'up' | 'down' | 'shot' | 'reflect' | 'analisi' | 'acqua';

export interface Lesson {
    /** serve un'abilità per seguire il consiglio: senza, il consiglio aspetta */
    ability?: AbilityId;
    hint: string;
    /** moltiplicatori del danno per provenienza: la debolezza e la corazza */
    mult?: Partial<Record<HitSource, number>>;
    /** blindato, ma appena ha sparato si apre: il colpo in quella finestra vale questo */
    openAfterShot?: number;
    /** la carica si sbanda se ci scivoli attraverso */
    staggerOnDash?: boolean;
    /** tratto obbligato nelle regioni dove è simbolo */
    trait?: 'scudo';
    regions?: string[];
}

export const LESSONS: Partial<Record<EnemyKind, Lesson>> = {
    glitchetto: {
        hint: 'i glitchetti saltano a scatti: aspetta che atterrino, poi tre colpi di fila. il terzo spacca anche i muri con le crepe.',
    },
    pittura: {
        hint: 'la pittura colpita si divide in due macchie. non farti chiudere in un angolo: colpisci e arretra.',
    },
    citelis: {
        ability: 'scivolata',
        hint: 'i citelis caricano a testa bassa. non saltarli: SCIVOLA attraverso la carica ({k:dash}). sbandano storditi e lì prendono il doppio.',
        staggerOnDash: true,
    },
    fiattipo: {
        ability: 'scivolata',
        hint: 'le fiat tipo sgommano dritte. scivolaci attraverso mentre caricano: si piantano e le smonti.',
        staggerOnDash: true,
    },
    pendolare: {
        hint: 'il pendolare tiene la valigia davanti: in faccia non passa niente. salta sopra e premi {k:down} + {k:attack} in aria: pogo. o giralo alle spalle.',
        trait: 'scudo',
        regions: ['bus', 'barrato'],
    },
    specchietto: {
        hint: 'gli specchietti volano all\'altezza della testa e di lato riflettono metà del colpo. colpisci in alto ({k:up} + {k:attack}): li butti giù e fanno il doppio.',
        mult: { side: 0.5, up: 2 },
    },
    tecnodrone: {
        hint: 'i tecnodroni sono blindati: la spada li graffia. ma subito dopo aver sparato si aprono per un attimo. aspetta il colpo, poi mena.',
        mult: { side: 0.4, up: 0.4, down: 0.4, shot: 2.5 },
        openAfterShot: 2,
    },
    'tossico-trenbo': {
        hint: 'i tossici del trenbolone non mollano mai e tengono lo scudo alto. pogo sulla testa, sempre.',
        trait: 'scudo',
        regions: ['trenbolone'],
    },
    ammiratore: {
        ability: 'riflesso',
        hint: 'i fan di lochef inseguono chiunque ti somigli. evoca il riflesso ({k:riflesso}): perdono la testa per lui e tu li colpisci alle spalle.',
    },
    formica: {
        ability: 'aggrappo',
        hint: 'le formiche corrono in branco ma sui muri non salgono. aggrappati, aspettale sotto e scendi col pogo.',
    },
    bottiglia: {
        ability: 'acquatossica',
        hint: 'le bottiglie di smela sono plastica e veleno. lancia la bottiglia ({k:down}+{k:wave}) dove passano: chi la prende si blocca, chi ci cammina si scioglie.',
        mult: { acqua: 99 },
    },
    numero: {
        ability: 'analisi',
        hint: 'i numeri volanti schivano la spada ma non la matematica. analisi ({k:up}+{k:wave}): i teoremi li fanno a pezzi.',
        mult: { analisi: 3 },
    },
    telecamera: {
        ability: 'scudo',
        hint: 'le telecamere sparano da lontano. accendi il tommasoscudo ({k:scudo}) appena prima del colpo: il rimando perfetto torna al mittente e le spegne di netto.',
        mult: { reflect: 99 },
    },
};

/** quanto vale un colpo da questa provenienza contro questo nemico */
export function hitMult(kind: EnemyKind, source: HitSource): number {
    return LESSONS[kind]?.mult?.[source] ?? 1;
}
