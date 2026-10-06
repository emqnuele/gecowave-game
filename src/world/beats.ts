import { BOSSES } from '../content/bosses';
import type { EntitySpec, LevelDef } from '../types';

/* i contenuti dei vecchi capitoli diventano "beat": la sequenza da
   sinistra a destra resta quella, cambia solo dove finiscono */

export type BeatRole =
    | 'story' | 'boss' | 'arena' | 'secret' | 'loot' | 'enemy'
    | 'door' | 'chase' | 'companion';

export interface Beat {
    ch: string;
    spec: EntitySpec;
    oldX: number;
    oldY: number;
    role: BeatRole;
}

const ARENA_MARKERS = ['smela-arena', 'lametta-arena'];

export function roleOf(spec: EntitySpec): BeatRole {
    switch (spec.type) {
        case 'enemy':
            return 'enemy';
        case 'spawner':
            // nido piazzato a mano: resta un singolo nido in posizione di trama,
            // non entra nel pool dei nemici che si sparge per le stanze
            return 'story';
        case 'barre':
            return 'loot';
        case 'cuore':
        case 'maschera':
        case 'portal':
        case 'item':
            return 'secret';
        case 'boss':
            return BOSSES[spec.kind]?.guardsExit === false ? 'secret' : 'boss';
        case 'npc': {
            const id = spec.id;
            if (id.startsWith('arena-') || id.startsWith('warena-') || ARENA_MARKERS.includes(id)) return 'arena';
            if (id.startsWith('porta-teorema')) return 'door';
            if (id === 'caccia-inizio' || id === 'caccia-fine') return 'chase';
            if (id === 'romero-guida' || id === 'walter-guida') return 'companion';
            if (id === 'sfida-33') return 'secret';
            return 'story';
        }
        default:
            return 'story';
    }
}

export interface Extracted {
    beats: Beat[];
    oldWidth: number;
    /** pesi dei nemici del capitolo, per ripopolare le stanze */
    enemyPool: { ch: string; weight: number }[];
}

export function extractBeats(def: LevelDef): Extracted {
    const beats: Beat[] = [];
    const counts = new Map<string, number>();
    const oldWidth = Math.max(...def.grid.map((r) => r.length));
    def.grid.forEach((row, r) => {
        for (let c = 0; c < row.length; c++) {
            const ch = row[c];
            const spec = def.entities[ch];
            if (!spec) continue;
            const role = roleOf(spec);
            if (role === 'enemy') {
                counts.set(ch, (counts.get(ch) ?? 0) + 1);
                continue;
            }
            beats.push({ ch, spec, oldX: c, oldY: r, role });
        }
    });
    beats.sort((a, b) => a.oldX - b.oldX || a.oldY - b.oldY);
    return {
        beats,
        oldWidth,
        enemyPool: [...counts.entries()].map(([ch, weight]) => ({ ch, weight })),
    };
}
