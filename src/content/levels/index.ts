import type { LevelDef } from '../../types';
import { perduta } from './level01-perduta';
import { bus } from './level02-bus';
import { santuario } from './level03-santuario';
import { tecnokill } from './level04-tecnokill';
import { rio } from './level05-rio';
import { ruhra } from './level06-ruhra';
import { nucleo } from './level07-nucleo';

/* per aggiungere un capitolo: crea un file qui accanto, importalo
   e aggiungilo alla lista. collega le zone col campo `next`. */

const all: LevelDef[] = [perduta, bus, santuario, tecnokill, rio, ruhra, nucleo];

export const LEVELS: Record<string, LevelDef> = Object.fromEntries(all.map((l) => [l.id, l]));

export const FIRST_LEVEL = perduta.id;

export const TOTAL_FRAGMENTS = 6;
