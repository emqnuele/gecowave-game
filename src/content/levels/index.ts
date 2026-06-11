import type { LevelDef } from '../../types';
import { perduta } from './level01-perduta';
import { bus } from './level02-bus';
import { santuario } from './level03-santuario';
import { tecnokill } from './level04-tecnokill';
import { trenbolone } from './level04b-trenbolone';
import { rio } from './level05-rio';
import { stabilimento } from './level06-stabilimento';
import { ruhra } from './level07-ruhra';
import { mente } from './level07b-mente';
import { caso } from './level08-caso';
import { tana } from './level09-tana';
import { sorveglianza } from './level10-sorveglianza';
import { cantina } from './level11-cantina';
import { ricordi } from './level12-ricordi';
import { nucleo } from './level13-nucleo';

/* per aggiungere un capitolo: crea un file qui accanto, importalo
   e aggiungilo alla lista. collega le zone col campo `next`. */

const all: LevelDef[] = [
    perduta, bus, santuario, tecnokill, trenbolone, rio, stabilimento,
    ruhra, mente, caso, tana, sorveglianza, cantina, ricordi, nucleo,
];

export const LEVELS: Record<string, LevelDef> = Object.fromEntries(all.map((l) => [l.id, l]));

/** ordine canonico dei capitoli, per la schermata di viaggio */
export const LEVEL_ORDER: string[] = all.map((l) => l.id);

export const FIRST_LEVEL = perduta.id;

export const TOTAL_FRAGMENTS = 7;
