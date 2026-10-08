import Phaser from 'phaser';
import { ART_SCALE, ART_TILE, TILE } from '../config';
import type { BiomeDef } from '../content/biomes';
import type { EntitySpec, LevelDef } from '../types';
import { breakableKey, ensureBlockTextures, spikeKey } from '../art/blocks';

export interface PlacedEntity {
    spec: EntitySpec;
    x: number;
    y: number;
}

export interface LoadedLevel {
    layer: Phaser.Tilemaps.TilemapLayer;
    spikes: Phaser.Physics.Arcade.StaticGroup;
    water: Phaser.Geom.Rectangle[];
    spawn: { x: number; y: number };
    checkpoints: { id: string; x: number; y: number }[];
    exits: Phaser.Geom.Rectangle[];
    entities: PlacedEntity[];
    fakeWalls: Phaser.Physics.Arcade.StaticGroup;
    breakableWalls: Phaser.Physics.Arcade.StaticGroup;
    widthPx: number;
    heightPx: number;
}

/* indici nel tileset 4x4 da 160px: righe alte = pietra,
   mattoni per le superfici, legno per le passerelle sospese */
const TOP_TILES = [8, 9, 10, 11];
const FILL_TILES = [0, 1, 2, 3, 4, 5, 6, 7];
const WOOD_TILES = [12];

function mulberry32(seed: number): () => number {
    let a = seed;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export function loadLevel(scene: Phaser.Scene, def: LevelDef, biome: BiomeDef): LoadedLevel {
    ensureBlockTextures(scene, biome);
    const rows = def.grid;
    const width = Math.max(...rows.map((r) => r.length));
    const rnd = mulberry32(def.id.length * 31337);

    const isWall = (ch: string): boolean => ch === '#' || ch === 'F' || ch === '%';
    const solid = (c: number, r: number): boolean => isWall(rows[r]?.[c] ?? '.');

    const data: number[][] = [];
    const spikes = scene.physics.add.staticGroup();
    const water: Phaser.Geom.Rectangle[] = [];
    const checkpoints: LoadedLevel['checkpoints'] = [];
    const exits: Phaser.Geom.Rectangle[] = [];
    const entities: PlacedEntity[] = [];
    const fakeWalls = scene.physics.add.staticGroup();
    const breakableWalls = scene.physics.add.staticGroup();
    let spawn: { x: number; y: number } | null = null;

    for (let r = 0; r < rows.length; r++) {
        const dataRow: number[] = [];
        for (let c = 0; c < width; c++) {
            const ch = rows[r][c] ?? '.';
            const cx = c * TILE + TILE / 2;
            const cy = r * TILE + TILE / 2;

            if (ch === '#') {
                const float = !solid(c, r - 1) && !solid(c, r + 1);
                const exposed = !solid(c, r - 1);
                const pool = float ? WOOD_TILES : exposed ? TOP_TILES : FILL_TILES;
                dataRow.push(pool[Math.floor(rnd() * pool.length)]);
                continue;
            }
            if (ch === 'F') {
                dataRow.push(-1);
                // il muro finto lo disegna il TerrainRenderer: qui resta solo il corpo
                const s = fakeWalls.create(cx, cy, breakableKey(biome)) as Phaser.Physics.Arcade.Sprite;
                s.setVisible(false);
                s.refreshBody();
                continue;
            }
            if (ch === '%') {
                dataRow.push(-1);
                const s = breakableWalls.create(cx, cy, breakableKey(biome)) as Phaser.Physics.Arcade.Sprite;
                s.refreshBody();
                s.setPipeline('Light2D');
                continue;
            }
            dataRow.push(-1);
            if (ch === '.') continue;

            if (ch === '^') {
                const s = spikes.create(cx, cy, spikeKey(biome)) as Phaser.Physics.Arcade.Sprite;
                // hitbox solo sulle punte, non su tutta la tile
                (s.body as Phaser.Physics.Arcade.StaticBody).setSize(TILE - 8, 12).setOffset(4, TILE - 12);
                s.setPipeline('Light2D');
            } else if (ch === '~') {
                water.push(new Phaser.Geom.Rectangle(c * TILE, r * TILE, TILE, TILE));
            } else if (ch === 'P') {
                spawn = { x: cx, y: cy };
            } else if (ch === 'C') {
                checkpoints.push({ id: `cp-${c}-${r}`, x: cx, y: cy });
            } else if (ch === 'X') {
                exits.push(new Phaser.Geom.Rectangle(c * TILE, r * TILE, TILE, TILE));
            } else {
                const spec = def.entities[ch];
                if (!spec) throw new Error(`livello ${def.id}: lettera '${ch}' a (${c},${r}) non in legenda`);
                entities.push({ spec, x: cx, y: cy });
            }
        }
        data.push(dataRow);
    }

    if (!spawn) throw new Error(`livello ${def.id}: manca lo spawn P`);

    const map = scene.make.tilemap({ data, tileWidth: ART_TILE, tileHeight: ART_TILE });
    const tileset = map.addTilesetImage('tileset_main')!;
    const layer = map.createLayer(0, tileset, 0, 0)!;
    layer.setScale(ART_SCALE);
    layer.setCollisionByExclusion([-1]);
    // le collisioni restano sul tilemap, la grafica la fa il TerrainRenderer
    layer.setVisible(false);

    return {
        layer,
        spikes,
        water,
        spawn,
        checkpoints,
        exits,
        entities,
        fakeWalls,
        breakableWalls,
        widthPx: width * TILE,
        heightPx: rows.length * TILE,
    };
}
