import type { LevelDef } from '../../types';
import { perduta } from './level01-perduta';
import { bus } from './level02-bus';
import { santuario } from './level03-santuario';
import { tecnokill } from './level04-tecnokill';
import { trenbolone } from './level05-trenbolone';
import { tana } from './level06-tana';
import { rio } from './level07-rio';
import { stabilimento } from './level08-stabilimento';
import { ruhra } from './level09-ruhra';
import { mente } from './level09b-mente';
import { caso } from './level10-caso';
import { sorveglianza } from './level11-sorveglianza';
import { cantina } from './level12-cantina';
import { ricordi } from './level13-ricordi';
import { voidlv } from './level13b-void';
import { nucleo } from './level14-nucleo';
import { barrato } from './level15-barrato';
import { custode } from './level16-custode';
import { galliate } from './level02b-galliate';
import { marcetti } from './level02c-marcetti';
import { piazza } from './level00-piazza';

/* per aggiungere un capitolo: crea un file qui accanto, importalo
   e aggiungilo alla lista. collega le zone col campo `next`. */

const all: LevelDef[] = [
    perduta, bus, santuario, tecnokill, trenbolone, tana, rio, stabilimento,
    ruhra, mente, caso, sorveglianza, cantina, ricordi, voidlv, nucleo,
];

/* capitoli segreti: raggiungibili solo dai varchi, fuori dalla progressione
   e dalla schermata viaggio. */
const secret: LevelDef[] = [barrato, custode, galliate, marcetti];

/* hub: fuori dalla progressione, niente regione generata */
const hubs: LevelDef[] = [piazza];

export const LEVELS: Record<string, LevelDef> = Object.fromEntries(
    [...all, ...secret, ...hubs].map((l) => [l.id, l]),
);

/** i capitoli che diventano regioni a stanze */
export const REGION_IDS: string[] = [...all, ...secret].map((l) => l.id);

export const HUB_ID = piazza.id;
export const HUB_STOP = 'piazza:cp-90-24';

/** ordine canonico dei capitoli, per la schermata di viaggio */
export const LEVEL_ORDER: string[] = all.map((l) => l.id);

export const FIRST_LEVEL = perduta.id;

export const TOTAL_FRAGMENTS = 8;
