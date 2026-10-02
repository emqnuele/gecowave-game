import type Phaser from 'phaser';
import { LEVELS } from '../content/levels';
import type { LevelDef } from '../types';
import { decodeGrid, REGION_FORMAT, sourceHash, type RegionFile } from './codec';
import type { RegionLayout } from './types';

/* le regioni pronte in public/regions, caricate dal BootScene: il gioco non
   genera niente a runtime. se una manca si gioca il capitolo vecchio */

export interface LoadedRegion {
    def: LevelDef;
    layout: RegionLayout;
}

export const regionKey = (id: string) => `region-${id}`;
export const regionUrl = (id: string) => `regions/${id}.json`;

const cache = new Map<string, LoadedRegion>();

export function loadRegion(scene: Phaser.Scene, id: string): LoadedRegion | null {
    const hit = cache.get(id);
    if (hit) return hit;
    const base = LEVELS[id];
    const file = scene.cache.json.get(regionKey(id)) as RegionFile | undefined;
    if (!base || !file) return null;
    if (file.format !== REGION_FORMAT || file.id !== id) {
        console.warn(`[regioni] ${id}: formato non valido, si gioca il capitolo vecchio`);
        return null;
    }
    // la regione resta coerente con la sua legenda anche se il capitolo è cambiato dopo
    if (import.meta.env.DEV && file.source !== sourceHash(base)) {
        console.warn(`[regioni] ${id}: capitolo modificato dopo la generazione, lancia npm run regions`);
    }
    const region: LoadedRegion = {
        def: { ...base, grid: decodeGrid(file), entities: file.entities },
        layout: file.layout,
    };
    cache.set(id, region);
    return region;
}
