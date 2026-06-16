/* sceglie il frame del tileset per una cella muro, rispecchiando la
   logica di LevelLoader: legno se sospeso, top se esposto, fill se interno.
   indici come nel gioco (tileset 4x4 da 160px). */
const TOP_TILES = [8, 9, 10, 11];
const FILL_TILES = [0, 1, 2, 3, 4, 5, 6, 7];
const WOOD_TILES = [12];

const isWall = (ch: string | undefined): boolean => ch === '#' || ch === 'F' || ch === '%';

export function tileFrameIndex(grid: string[], c: number, r: number): number {
    const solid = (cc: number, rr: number): boolean => isWall(grid[rr]?.[cc]);
    const float = !solid(c, r - 1) && !solid(c, r + 1);
    const exposed = !solid(c, r - 1);
    const pool = float ? WOOD_TILES : exposed ? TOP_TILES : FILL_TILES;
    // deterministico per cella: niente sfarfallio tra un redraw e l'altro
    const h = (c * 73856093) ^ (r * 19349663);
    return pool[Math.abs(h) % pool.length];
}
