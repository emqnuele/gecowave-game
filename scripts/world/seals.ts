import { readFileSync, writeFileSync } from 'node:fs';
import { hashString } from '../../src/engine/art/ink';
import { decodeGrid, type RegionFile } from '../../src/world/codec';
import type { AbilitySeal, DoorKind, RegionLayout, Room, SealKind, SealReward } from '../../src/world/types';
import type { AbilityId } from '../../src/types';

/* sigilli delle abilità: arricchisce i json già generati senza rigenerarli.
   per ogni sigillo sceglie una stanza laterale e la porta verso l'ancora,
   in modo deterministico: stesso seed, stesso sigillo.
   uso: scripts/world/run.sh seals [id|all] */

interface PlanEntry {
    id: string;
    region: string;
    kind: SealKind;
    ability: AbilityId;
    prize: SealReward;
}

// la distribuzione è intenzionale: il primo insegna, il centro manda indietro,
// gli ultimi rendono le wave avanzate più che attacchi. il miasma chiede
// l'acquatossica (come la resina: una wave, due sigilli) e il camino sta in
// perduta, l'unico con nicchia vera e porta diretta verso il percorso.
const PLAN: readonly PlanEntry[] = [
    { id: 'perduta-cortina', region: 'perduta', kind: 'cortina', ability: 'scivolata', prize: { kind: 'barre', amount: 60 } },
    { id: 'perduta-rimbalzo', region: 'perduta', kind: 'rimbalzo', ability: 'rimbalzo', prize: { kind: 'cuore' } },
    { id: 'bus-specchio', region: 'bus', kind: 'specchio', ability: 'riflesso', prize: { kind: 'barre', amount: 90 } },
    { id: 'perduta-camino', region: 'perduta', kind: 'camino', ability: 'aggrappo', prize: { kind: 'cuore' } },
    { id: 'santuario-risonanza', region: 'santuario', kind: 'risonanza', ability: 'risonante', prize: { kind: 'cuore' } },
    { id: 'trenbolone-miasma', region: 'trenbolone', kind: 'miasma', ability: 'acquatossica', prize: { kind: 'barre', amount: 90 } },
    { id: 'rio-resina', region: 'rio', kind: 'resina', ability: 'acquatossica', prize: { kind: 'tacca' } },
    { id: 'ruhra-teorema', region: 'ruhra', kind: 'teorema', ability: 'analisi', prize: { kind: 'cuore' } },
    { id: 'sorveglianza-ricevitore', region: 'sorveglianza', kind: 'ricevitore', ability: 'scudo', prize: { kind: 'barre', amount: 120 } },
];

const PLAN_REGIONS = [...new Set(PLAN.map((p) => p.region))];

function fail(msg: string): never {
    console.error(`seals: ${msg}`);
    process.exit(1);
}

function roomById(layout: RegionLayout, id: number): Room {
    const room = layout.rooms.find((r) => r.id === id);
    if (!room) fail(`stanza ${id} introvabile nel layout`);
    return room;
}

function validateSeal(file: RegionFile, seal: AbilitySeal, others: AbilitySeal[]): void {
    const layout = file.layout;
    const room = layout.rooms.find((r) => r.id === seal.room);
    if (!room) fail(`${seal.id}: stanza ${seal.room} introvabile`);
    if (room.pathIndex >= 0) fail(`${seal.id}: stanza ${seal.room} sul percorso, i sigilli stanno solo fuori`);
    if (seal.door.a !== room.id && seal.door.b !== room.id) fail(`${seal.id}: porta estranea alla stanza`);
    const other = seal.door.a === room.id ? seal.door.b : seal.door.a;
    if (other !== room.anchor) fail(`${seal.id}: porta non verso l'ancora ${room.anchor}`);
    if (seal.door.kind === 'drop') fail(`${seal.id}: porta a caduta, serve un varco attraversabile`);
    const layoutDoor = layout.doors.find(
        (d) => d.a === seal.door.a && d.b === seal.door.b && d.axis === seal.door.axis && d.x === seal.door.x && d.y === seal.door.y && d.len === seal.door.len,
    );
    if (!layoutDoor) fail(`${seal.id}: porta non nel layout`);
    const physical = (seal.kind === 'rimbalzo' || seal.kind === 'camino')
        && layout.abilityGates?.some((g) => g.room === seal.room && g.reward.c === seal.reward.c && g.reward.r === seal.reward.r);
    if (!physical && !layout.spots?.some(([c, r, roomId]) => roomId === seal.room && c === seal.reward.c && r === seal.reward.r)) {
        fail(`${seal.id}: premio ${seal.reward.c},${seal.reward.r} fuori dagli spot verificati`);
    }
    if (others.some((o) => o.reward.c === seal.reward.c && o.reward.r === seal.reward.r)) {
        fail(`${seal.id}: premio già usato da un altro sigillo`);
    }
}

function buildSeals(regionId: string): AbilitySeal[] {
    const path = `public/regions/${regionId}.json`;
    const file = JSON.parse(readFileSync(path, 'utf8')) as RegionFile;
    const layout = file.layout;
    const grid = decodeGrid(file);
    if (file.id !== regionId) fail(`${regionId}: id del file diverso (${file.id})`);

    // celle da tenere lontane dal premio: checkpoint, uscite e roba di trama
    const avoid: { c: number; r: number }[] = [];
    grid.forEach((row, r) => [...row].forEach((ch, c) => {
        if (ch === 'C' || ch === 'X' || ch === 'P') {
            avoid.push({ c, r });
            return;
        }
        const spec = file.entities[ch];
        if (spec && spec.type !== 'enemy') avoid.push({ c, r });
    }));
    const nearAvoid = (c: number, r: number) => avoid.some((a) => Math.abs(a.c - c) + Math.abs(a.r - r) <= 3);

    const anchorPath = (room: Room): number =>
        room.pathIndex >= 0 ? room.pathIndex : roomById(layout, room.anchor).pathIndex;
    const spotsOf = (roomId: number): [number, number][] =>
        (layout.spots ?? []).filter((s) => s[2] === roomId).map(([c, r]) => [c, r]);

    // stanze papabili: laterali tranquille con almeno uno spot, senza premi
    // di trama dentro e senza microfono rosso probabile (sale larghe da arena)
    const lateral = layout.rooms.filter((room) => {
        if (room.pathIndex >= 0) return false;
        if (room.kind === 'arena' || room.kind === 'rest' || room.kind === 'secret') return false;
        if (room.kind === 'start' || room.kind === 'exit') return false;
        if (spotsOf(room.id).length === 0) return false;
        if (room.kind === 'hall' && room.rect.w >= 18 && spotsOf(room.id).length >= 3) return false;
        if (room.kind === 'cave' && room.rect.w >= 18 && spotsOf(room.id).length >= 3) return false;
        return true;
    });
    const ordered = [...lateral].sort((a, b) => anchorPath(a) - anchorPath(b) || a.id - b.id);

    const usedRooms = new Set<number>();
    // le nicchie vere sono dei loro sigilli: le stanze normali non le toccano
    for (const g of layout.abilityGates ?? []) usedRooms.add(g.room);
    const takenGates = new Set<number>();
    const out: AbilitySeal[] = [];
    for (const entry of PLAN.filter((p) => p.region === regionId)) {
        let room: Room | null = null;
        let gateReward: { c: number; r: number } | null = null;
        // rimbalzo e camino vivono nelle nicchie vere, se il generatore le ha salvate
        if (entry.kind === 'rimbalzo' || entry.kind === 'camino') {
            const want = entry.kind === 'rimbalzo' ? 'rimbalzo' : 'aggrappo';
            const gate = layout.abilityGates?.find((g) => g.ability === want && !takenGates.has(g.room));
            if (gate) {
                const gr = roomById(layout, gate.room);
                if (gr.pathIndex < 0 && gr.kind !== 'arena' && gr.kind !== 'rest' && gr.kind !== 'secret') {
                    room = gr;
                    gateReward = gate.reward;
                    takenGates.add(gate.room);
                }
            }
            if (!room) {
                fail(`${entry.id}: nessun cancello fisico, rigenera le regioni`);
            }
        }
        if (!room) {
            const doorsOf = (r: Room) =>
                layout.doors
                    .filter((d) =>
                        d.kind !== 'drop'
                        && (d.a === r.id || d.b === r.id)
                        && (d.a === r.anchor || d.b === r.anchor),
                    )
                    .sort((a, b) => a.x - b.x || a.y - b.y);
            const cands = ordered.filter((r) => !usedRooms.has(r.id) && doorsOf(r).length > 0);
            if (!cands.length) fail(`${entry.id}: nessuna stanza laterale con porta in ${regionId}`);
            room = cands[hashString(`seal:${regionId}:${entry.kind}`) % cands.length];
        }
        const doors = layout.doors
            .filter((d) =>
                d.kind !== 'drop'
                && (d.a === room.id || d.b === room.id)
                && (d.a === room.anchor || d.b === room.anchor),
            )
            .sort((a, b) => a.x - b.x || a.y - b.y);
        if (!doors.length) fail(`${entry.id}: nessuna porta verso l'ancora ${room.anchor}`);
        const door = doors[hashString(`seal:${regionId}:${entry.kind}:porta`) % doors.length];
        usedRooms.add(room.id);

        let reward: { c: number; r: number };
        if (gateReward) {
            reward = gateReward;
        } else {
            const doorCell = { c: door.x, r: door.y };
            const cands = spotsOf(room.id)
                .filter(([c, r]) => !nearAvoid(c, r))
                .sort((a, b) =>
                    (Math.abs(b[0] - doorCell.c) + Math.abs(b[1] - doorCell.r))
                    - (Math.abs(a[0] - doorCell.c) + Math.abs(a[1] - doorCell.r)),
                );
            if (!cands.length) fail(`${entry.id}: nessuno spot libero in stanza ${room.id}`);
            reward = { c: cands[0][0], r: cands[0][1] };
        }
        const seal: AbilitySeal = {
            id: entry.id,
            kind: entry.kind,
            ability: entry.ability,
            room: room.id,
            door: { a: door.a, b: door.b, axis: door.axis, x: door.x, y: door.y, len: door.len, kind: door.kind as DoorKind },
            reward,
            prize: entry.prize,
            mark33: true,
        };
        validateSeal(file, seal, out);
        if (gateReward) {
            // la nicchia vera paga da sola: il premio scritto deve essere quello del mondo
            const ch = grid[seal.reward.r]?.[seal.reward.c];
            const spec = ch ? file.entities[ch] : undefined;
            const wantCuore = seal.prize.kind === 'cuore';
            const hasCuore = !!spec && spec.type === 'cuore';
            const wantTacca = seal.prize.kind === 'tacca';
            const hasTacca = !!spec && spec.type === 'item' && (spec as { item?: string }).item === 'tacca';
            if ((wantCuore && !hasCuore) || (wantTacca && !hasTacca)) {
                fail(`${seal.id}: premio ${seal.prize.kind} ma il mondo dà ${JSON.stringify(spec)}`);
            }
        }
        out.push(seal);
    }
    return out;
}

function one(regionId: string): void {
    const path = `public/regions/${regionId}.json`;
    const file = JSON.parse(readFileSync(path, 'utf8')) as RegionFile;
    const seals = buildSeals(regionId);
    file.layout.seals = seals.sort((a, b) => (a.id < b.id ? -1 : 1));
    writeFileSync(path, JSON.stringify(file));
    for (const s of seals) {
        const prize = s.prize.kind === 'barre' ? `${s.prize.amount} barre` : s.prize.kind === 'item' ? s.prize.item : s.prize.kind;
        console.log(`${s.id.padEnd(26)} stanza ${s.room} porta ${s.door.a}-${s.door.b} ${s.door.axis} ${s.door.x},${s.door.y} premio ${s.reward.c},${s.reward.r} ${prize}`);
    }
}

const arg = process.argv[2];
if (!arg || arg === 'all') {
    for (const id of PLAN_REGIONS) one(id);
} else {
    one(arg);
}
