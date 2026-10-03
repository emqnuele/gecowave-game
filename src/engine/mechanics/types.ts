import Phaser from 'phaser';
import type { Player } from '../../entities/Player';
import type { EnemyKind } from '../../types';
import type { Door, RegionLayout, Room } from '../../world/types';
import type { LightingManager } from '../LightingManager';
import type { NavGraph } from '../nav/NavGraph';
import { TILE } from '../../config';

/* una meccanica per bioma: il posto cambia il modo di giocare, non solo la
   palette. tutte sono additive come trappole e lastre: costano vita o tempo,
   mai una strada che il geco simulato ha già verificato */

export interface MechanicCtx {
    scene: Phaser.Scene;
    regionId: string;
    nav: NavGraph;
    layout: RegionLayout;
    water: Phaser.Geom.Rectangle[];
    lighting: LightingManager;
    playerLight: Phaser.GameObjects.Light;
    player: Player;
    /** punti dove non mettere niente: microfoni, fermate, npc */
    avoid: { x: number; y: number }[];
    /** i nemici della regione, per gli allarmi */
    enemyKinds: EnemyKind[];
    spawnHunter: (kind: EnemyKind, x: number, y: number) => void;
    awakeEnemies: () => number;
    /** una porta della mente con la sua domanda: la logica vive nella scena */
    quizDoor: (id: string, x: number, y: number) => void;
    /** la corsa contro il citelis è in corso: i tempi sono stati misurati senza porte */
    trialRunning: () => boolean;
}

export interface Mechanic {
    update(time: number, delta: number): void;
    destroy(): void;
}

export const QUIET_ROOMS = new Set(['start', 'rest', 'arena', 'exit', 'secret']);

/** generatore deterministico per regione: stessa partita, stesso posto */
export function seeded(seed: string): () => number {
    let h = 0;
    for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) | 0;
    let a = h ^ 0x5bd1e995;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export interface Gap {
    door: Door;
    /** centro del varco in px e rettangolo del vano (due celle per quattro) */
    x: number;
    y: number;
    rect: Phaser.Geom.Rectangle;
    left: Room;
    right: Room;
}

/** i varchi nel muro tra due stanze del percorso, controllati sulla griglia vera */
export function pathGaps(ctx: MechanicCtx): Gap[] {
    const L = ctx.layout;
    const out: Gap[] = [];
    for (const d of L.doors) {
        if (d.axis !== 'h' || d.kind !== 'open') continue;
        const A = L.rooms[d.a];
        const B = L.rooms[d.b];
        if (!A || !B || A.pathIndex < 0 || B.pathIndex < 0) continue;
        if (QUIET_ROOMS.has(A.kind) || QUIET_ROOMS.has(B.kind)) continue;
        const left = A.rect.x < B.rect.x ? A : B;
        const right = left === A ? B : A;
        // tra due stanze all'aperto il muro non c'è: una porta lì si scavalca
        if (left.surface && right.surface) continue;
        const bx = right.rect.x;
        const t = d.y;
        let ok = ctx.nav.solid(bx - 1, t) && ctx.nav.solid(bx, t) && ctx.nav.solid(bx - 1, t - 5) && ctx.nav.solid(bx, t - 5);
        for (let r = t - 4; r < t && ok; r++) ok = ctx.nav.free(bx - 1, r) && ctx.nav.free(bx, r);
        if (!ok) continue;
        out.push({
            door: d, left, right,
            x: bx * TILE, y: (t - 2) * TILE,
            rect: new Phaser.Geom.Rectangle((bx - 1) * TILE, (t - 4) * TILE, TILE * 2, TILE * 4),
        });
    }
    return out;
}
