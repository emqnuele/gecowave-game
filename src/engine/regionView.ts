import type { RegionLayout } from '../world/types';

/* quello che la scena sa della regione in corso, letto dalla mappa del telefono */
export interface RegionMarker {
    x: number;
    y: number;
    kind: 'mic' | 'boss' | 'exit' | 'npc' | 'goal' | 'stop' | 'seal';
    label?: string;
}

export const regionView: {
    id: string | null;
    layout: RegionLayout | null;
    player: { x: number; y: number } | null;
    room: number;
    markers: RegionMarker[];
    goal: { x: number; y: number; label: string } | null;
} = { id: null, layout: null, player: null, room: -1, markers: [], goal: null };
