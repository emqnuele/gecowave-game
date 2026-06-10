import type { LevelDef } from '../../types';
import { vico } from './level01-vico';
import { cripta } from './level02-cripta';
import { palude } from './level03-palude';
import { torre } from './level04-torre';
import { palco } from './level05-palco';

/* per aggiungere un livello: crea un file qui accanto, importalo
   e aggiungilo alla lista. collega le zone col campo `next`. */

const all: LevelDef[] = [vico, cripta, palude, torre, palco];

export const LEVELS: Record<string, LevelDef> = Object.fromEntries(all.map((l) => [l.id, l]));

export const FIRST_LEVEL = vico.id;
