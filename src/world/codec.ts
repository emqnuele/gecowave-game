import { hashString } from '../engine/art/ink';
import type { EntitySpec, LevelDef } from '../types';
import type { RegionLayout } from './types';

/* le regioni generate offline viaggiano come json: griglia compressa per
   righe, legenda estesa e layout. i metadati del capitolo restano in LEVELS */

export const REGION_FORMAT = 1;

export interface RegionFile {
    format: number;
    id: string;
    /** impronta del capitolo d'origine: se cambia, la regione va rigenerata */
    source: number;
    /** ogni riga è una sequenza di coppie [carattere, ripetizioni] */
    grid: [string, number][][];
    entities: Record<string, EntitySpec>;
    layout: RegionLayout;
}

export function sourceHash(def: LevelDef): number {
    return hashString(JSON.stringify([def.grid, def.entities]));
}

export function encodeRegion(def: LevelDef, grid: string[], entities: Record<string, EntitySpec>, layout: RegionLayout): RegionFile {
    const rows = grid.map((row) => {
        const runs: [string, number][] = [];
        for (const ch of row) {
            const last = runs[runs.length - 1];
            if (last && last[0] === ch) last[1]++;
            else runs.push([ch, 1]);
        }
        return runs;
    });
    return { format: REGION_FORMAT, id: def.id, source: sourceHash(def), grid: rows, entities, layout };
}

export function decodeGrid(file: RegionFile): string[] {
    return file.grid.map((runs) => runs.map(([ch, n]) => ch.repeat(n)).join(''));
}
