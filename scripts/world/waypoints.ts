import { readFileSync, writeFileSync } from 'node:fs';
import { LEVELS } from '../../src/content/levels';
import { decodeGrid, type RegionFile } from '../../src/world/codec';
import { BODY_H, BODY_W, SimMap } from '../../src/world/sim';
import { settleAt, simReach } from '../../src/world/simreach';
import { abilitiesFor } from './simcheck';

// uso: waypoints <id,id|all> <out.json> : tappe per il bot, solo posizioni dove il geco simulato sta in piedi
const [which, outPath] = process.argv.slice(2);
const ids = which === 'all' ? Object.keys(LEVELS) : which.split(',');
const out: Record<string, unknown> = {};
for (const id of ids) {
    const f = JSON.parse(readFileSync(`public/regions/${id}.json`, 'utf8')) as RegionFile;
    const grid = decodeGrid(f);
    const L = f.layout;
    const m = new SimMap(grid, { breakablesOpen: true });
    const ab = abilitiesFor(id);
    let P = { c: 0, r: 0 };
    grid.forEach((row, r) => { const c = row.indexOf('P'); if (c >= 0) P = { c, r }; });
    const reach = simReach(m, settleAt(m, P.c, P.r, ab)!, ab);
    const stands = [...reach.reached.values()].map((b) => ({ x: b.x + BODY_W / 2, y: b.y + BODY_H / 2 }));
    const roomAt = (x: number, y: number) => L.rooms.find((o) => x / 32 >= o.rect.x && x / 32 < o.rect.x + o.rect.w && y / 32 >= o.rect.y && y / 32 < o.rect.y + o.rect.h);
    const prog = (x: number, y: number) => {
        const o = roomAt(x, y);
        if (!o) return -1;
        if (o.pathIndex < 0) return L.rooms[o.anchor].pathIndex + 0.5;
        return o.pathIndex + Math.min(0.99, Math.max(0, (x / 32 - o.rect.x) / o.rect.w)) * 0.4;
    };
    const wps: { x: number; y: number; p: number; tag: string }[] = [];
    // tappe del percorso: qualche punto per stanza, da sinistra a destra
    for (const room of L.rooms.filter((o) => o.pathIndex >= 0)) {
        const inRoom = stands.filter((s) => roomAt(s.x, s.y) === room).sort((a, b) => a.x - b.x);
        for (const k of [0.1, 0.4, 0.7, 0.95]) {
            const s = inRoom[Math.floor(k * (inRoom.length - 1))];
            if (s) wps.push({ ...s, p: prog(s.x, s.y), tag: `room${room.pathIndex}` });
        }
    }
    // ogni entità che non è un nemico: la posizione in piedi più vicina
    grid.forEach((row, r) => [...row].forEach((ch, c) => {
        const e = f.entities[ch];
        if (!e || e.type === 'enemy') return;
        const x = c * 32 + 16, y = r * 32 + 16;
        let best = null as null | { x: number; y: number };
        let bd = Infinity;
        for (const s of stands) {
            const d = Math.hypot(s.x - x, (s.y - y) * 1.3);
            if (d < bd) { bd = d; best = s; }
        }
        if (best && bd < 160) {
            const tag = e.type === 'npc' ? `npc:${e.id}` : e.type === 'boss' ? `boss:${e.kind}` : e.type === 'lore' ? `lore:${e.id}` : e.type === 'portal' ? `portal:${e.to}` : e.type === 'ability' ? `ability:${e.ability}` : e.type;
            wps.push({ x: best.x, y: best.y, p: prog(x, y), tag });
        }
    }));
    let X = { c: 0, r: 0 };
    grid.forEach((row, r) => { const c = row.indexOf('X'); if (c >= 0 && !X.c) X = { c, r }; });
    wps.sort((a, b) => a.p - b.p);
    out[id] = { waypoints: wps, exit: { x: X.c * 32 + 16, y: (X.r + 2) * 32 } };
    console.log(id, wps.length);
}
writeFileSync(outPath, JSON.stringify(out));
