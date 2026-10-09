import { TILE } from '../config';
import type { Door, RegionLayout, Room } from '../world/types';

/* la strada tra le stanze di una regione: a chi si perde serve il prossimo
   varco giusto, non una freccia in linea d'aria che punta nella roccia */
export class RegionGuide {
    private layout: RegionLayout;
    private bySlot: Int16Array;
    private adj: { to: number; door: Door }[][];

    constructor(layout: RegionLayout) {
        this.layout = layout;
        this.bySlot = new Int16Array(layout.macroW * layout.macroH).fill(-1);
        for (const room of layout.rooms) {
            for (let y = room.sy; y < room.sy + room.sh; y++) {
                for (let x = room.sx; x < room.sx + room.sw; x++) this.bySlot[y * layout.macroW + x] = room.id;
            }
        }
        this.adj = layout.rooms.map(() => []);
        for (const d of layout.doors) {
            const A = layout.rooms[d.a];
            const B = layout.rooms[d.b];
            if (d.kind === 'drop') {
                // a senso unico: si scende e basta
                const top = A.rect.y < B.rect.y ? A : B;
                const bottom = top === A ? B : A;
                this.adj[top.id].push({ to: bottom.id, door: d });
            } else {
                this.adj[d.a].push({ to: d.b, door: d });
                this.adj[d.b].push({ to: d.a, door: d });
            }
        }
    }

    roomAt(x: number, y: number): Room | null {
        const L = this.layout;
        const sx = Math.floor(x / TILE / L.slotW);
        const sy = Math.floor(y / TILE / L.slotH);
        if (sx < 0 || sy < 0 || sx >= L.macroW || sy >= L.macroH) return null;
        const id = this.bySlot[sy * L.macroW + sx];
        return id >= 0 ? L.rooms[id] : null;
    }

    /** il centro del varco, in pixel, all'altezza del corpo */
    doorPoint(d: Door): { x: number; y: number } {
        const A = this.layout.rooms[d.a];
        const B = this.layout.rooms[d.b];
        if (d.axis === 'h') {
            const right = A.rect.x < B.rect.x ? B : A;
            return { x: right.rect.x * TILE, y: (d.y - 2) * TILE };
        }
        const bottom = A.rect.y < B.rect.y ? B : A;
        return { x: (d.x + d.len / 2) * TILE, y: bottom.rect.y * TILE };
    }

    /** stanze da attraversare, partenza esclusa */
    route(from: number, to: number): { room: number; door: Door }[] | null {
        if (from === to) return [];
        const prev = new Map<number, { room: number; door: Door }>();
        const q = [from];
        const seen = new Set([from]);
        for (let i = 0; i < q.length; i++) {
            const cur = q[i];
            for (const e of this.adj[cur]) {
                if (seen.has(e.to)) continue;
                seen.add(e.to);
                prev.set(e.to, { room: cur, door: e.door });
                if (e.to === to) {
                    const out: { room: number; door: Door }[] = [];
                    let k = to;
                    while (k !== from) {
                        const p = prev.get(k)!;
                        out.push({ room: k, door: p.door });
                        k = p.room;
                    }
                    return out.reverse();
                }
                q.push(e.to);
            }
        }
        return null;
    }

    /** dove andare adesso per arrivare al bersaglio: il varco della prossima stanza, o il bersaglio stesso */
    nextPoint(px: number, py: number, tx: number, ty: number): { x: number; y: number; rooms: number } | null {
        const a = this.roomAt(px, py);
        const b = this.roomAt(tx, ty);
        if (!a || !b) return { x: tx, y: ty, rooms: 0 };
        const r = this.route(a.id, b.id);
        if (!r) return null;
        if (r.length === 0) return { x: tx, y: ty, rooms: 0 };
        return { ...this.doorPoint(r[0].door), rooms: r.length };
    }
}
