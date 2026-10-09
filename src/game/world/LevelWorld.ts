import Phaser from 'phaser';
import { TILE } from '../../config';
import type { BiomeDef } from '../../content/biomes';
import type { LoadedLevel } from '../../stage/LevelLoader';
import type { NavGraph } from '../../world/NavGraph';
import type { LevelDef } from '../../types';
import { oldXToProgress, type RegionLayout, type Room } from '../../world/types';
import type { GameContext } from '../context';

type Point = { x: number; y: number };

/** il capitolo come luogo: cosa c'è dove, per chiunque debba far comparire, guidare o inseguire qualcosa */
export class LevelWorld {
    readonly def: LevelDef;
    /** la regione a stanze; null quando si gioca il capitolo vecchio */
    readonly layout: RegionLayout | null;
    biome!: BiomeDef;
    level!: LoadedLevel;
    /** pavimenti e salti per chi insegue o passeggia */
    nav!: NavGraph;
    private readonly ctx: Pick<GameContext, 'player'>;
    /** stanza per slot della macro-griglia */
    private readonly roomBySlot: Int16Array | null = null;

    constructor(ctx: Pick<GameContext, 'player'>, def: LevelDef, layout: RegionLayout | null) {
        this.ctx = ctx;
        this.def = def;
        this.layout = layout;
        if (layout) {
            this.roomBySlot = new Int16Array(layout.macroW * layout.macroH).fill(-1);
            for (const room of layout.rooms) {
                for (let y = room.sy; y < room.sy + room.sh; y++) {
                    for (let x = room.sx; x < room.sx + room.sw; x++) this.roomBySlot[y * layout.macroW + x] = room.id;
                }
            }
        }
    }

    roomAt(x: number, y: number): Room | null {
        const L = this.layout;
        if (!L || !this.roomBySlot) return null;
        const sx = Math.floor(x / TILE / L.slotW);
        const sy = Math.floor(y / TILE / L.slotH);
        if (sx < 0 || sy < 0 || sx >= L.macroW || sy >= L.macroH) return null;
        const id = this.roomBySlot[sy * L.macroW + sx];
        return id >= 0 ? L.rooms[id] : null;
    }

    /** quanto si è avanti nel capitolo: celle nel capitolo vecchio, stanze del percorso nella regione */
    progressAt(x: number, y: number): number {
        if (!this.layout) return x / TILE;
        const room = this.roomAt(x, y);
        if (!room) return 0;
        // le stanze laterali contano come l'inizio della stanza da cui partono
        if (room.pathIndex < 0) return this.layout.rooms[room.anchor].pathIndex;
        const f = (x / TILE - room.rect.x) / room.rect.w;
        return room.pathIndex + Phaser.Math.Clamp(f, 0, 0.999);
    }

    /** una x del capitolo vecchio, in pixel, tradotta in progresso */
    progressOfOldX(oldXPx: number): number {
        return this.layout ? oldXToProgress(this.layout, oldXPx / TILE) : oldXPx / TILE;
    }

    /** il punto libero più vicino dove far comparire qualcuno alto due celle */
    openSpotNear(x: number, y: number, radius = 12): Point {
        const grid = this.def.grid;
        const open = (c: number, r: number) => {
            const ch = grid[r]?.[c];
            return ch !== undefined && ch !== '#' && ch !== '%' && ch !== '^' && ch !== 'F';
        };
        const c0 = Math.floor(x / TILE);
        const r0 = Math.floor(y / TILE);
        for (let d = 0; d <= radius; d++) {
            for (let dy = -d; dy <= d; dy++) {
                for (let dx = -d; dx <= d; dx++) {
                    if (Math.max(Math.abs(dx), Math.abs(dy)) !== d) continue;
                    const c = c0 + dx;
                    const r = r0 + dy;
                    if (open(c, r) && open(c, r - 1)) return { x: c * TILE + TILE / 2, y: r * TILE + TILE / 2 };
                }
            }
        }
        const p = this.ctx.player;
        return { x: p.x, y: p.y - 40 };
    }

    /** un posto calpestabile vicino a dove è morto il boss: mai in aria o nella roccia */
    rewardSpot(x: number, y: number): Point {
        const c0 = Math.floor(x / TILE);
        const r0 = Math.floor(y / TILE);
        const room = this.roomAt(x, y);
        for (let d = 0; d <= 16; d++) {
            for (let dy = -d; dy <= d; dy++) {
                for (let dx = -d; dx <= d; dx++) {
                    if (Math.max(Math.abs(dx), Math.abs(dy)) !== d) continue;
                    const c = c0 + dx;
                    const r = r0 + dy;
                    if (this.nav.segmentAt(c, r) < 0) continue;
                    if (room && this.roomAt(c * TILE, r * TILE) !== room) continue;
                    return { x: c * TILE + TILE / 2, y: r * TILE + 6 };
                }
            }
        }
        const p = this.ctx.player;
        return { x: p.x, y: p.y - 30 };
    }

    /** i rettangoli dei varchi della stanza, in pixel */
    doorRects(room: Room): Phaser.Geom.Rectangle[] {
        const L = this.layout!;
        const out: Phaser.Geom.Rectangle[] = [];
        for (const d of L.doors) {
            if (d.a !== room.id && d.b !== room.id) continue;
            const A = L.rooms[d.a];
            const B = L.rooms[d.b];
            if (d.axis === 'h') {
                const right = A.rect.x < B.rect.x ? B : A;
                const left = right === A ? B : A;
                const bx = right.rect.x;
                const top = left.surface && right.surface ? 0 : d.y - 4;
                out.push(new Phaser.Geom.Rectangle((bx - 1) * TILE, top * TILE, TILE * 2, (d.y - top) * TILE));
            } else {
                const bottom = A.rect.y < B.rect.y ? B : A;
                out.push(new Phaser.Geom.Rectangle(d.x * TILE, (bottom.rect.y - 1) * TILE, d.len * TILE, TILE * 2));
            }
        }
        return out;
    }
}
