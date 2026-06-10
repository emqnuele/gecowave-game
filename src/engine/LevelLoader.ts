import Phaser from 'phaser';
import { TILE } from '../config';
import type { EntitySpec, LevelDef } from '../types';

export interface PlacedEntity {
    spec: EntitySpec;
    x: number;
    y: number;
}

export interface LoadedLevel {
    layer: Phaser.Tilemaps.TilemapLayer;
    spikes: Phaser.Physics.Arcade.StaticGroup;
    spawn: { x: number; y: number };
    checkpoints: { id: string; x: number; y: number }[];
    exits: Phaser.Geom.Rectangle[];
    entities: PlacedEntity[];
    widthPx: number;
    heightPx: number;
}

export function loadLevel(scene: Phaser.Scene, def: LevelDef): LoadedLevel {
    const rows = def.grid;
    const width = Math.max(...rows.map((r) => r.length));

    const data: number[][] = [];
    const spikes = scene.physics.add.staticGroup();
    const checkpoints: LoadedLevel['checkpoints'] = [];
    const exits: Phaser.Geom.Rectangle[] = [];
    const entities: PlacedEntity[] = [];
    let spawn: { x: number; y: number } | null = null;

    for (let r = 0; r < rows.length; r++) {
        const dataRow: number[] = [];
        for (let c = 0; c < width; c++) {
            const ch = rows[r][c] ?? '.';
            const cx = c * TILE + TILE / 2;
            const cy = r * TILE + TILE / 2;
            dataRow.push(ch === '#' ? 0 : -1);
            if (ch === '#' || ch === '.') continue;

            if (ch === '^') {
                const s = spikes.create(cx, cy, 'spikes') as Phaser.Physics.Arcade.Sprite;
                // hitbox solo sulle punte, non su tutta la tile
                (s.body as Phaser.Physics.Arcade.StaticBody).setSize(TILE - 8, 12).setOffset(4, TILE - 12);
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

    const map = scene.make.tilemap({ data, tileWidth: TILE, tileHeight: TILE });
    const tileset = map.addTilesetImage(`tile-${def.color}`)!;
    const layer = map.createLayer(0, tileset, 0, 0)!;
    layer.setCollision(0);

    return {
        layer,
        spikes,
        spawn,
        checkpoints,
        exits,
        entities,
        widthPx: width * TILE,
        heightPx: rows.length * TILE,
    };
}
