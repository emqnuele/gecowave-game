import { bus } from '../../core/events';
import { state } from '../../core/state';
import { coop } from '../../coop/runtime';
import type { CoopMsgs } from '../../coop/protocol';
import { PERSONAL_KEYS, type SharedSave } from '../../coop/types';
import { TOTAL_FRAGMENTS } from '../../content/levels';
import type { NetSession } from '../../net/session';
import type { SaveData } from '../../types';

/* il salvataggio della partita in due ha un padrone, l'host. l'ospite ne tiene una copia:
   quello che scopre lui (fermate, stanze, dialoghi letti, flag) torna all'host e si unisce,
   tutto il resto lo decide l'host e qui si sovrascrive */

const SYNC_MS = 250;
/** i campi che crescono e basta: si uniscono, non si sovrascrivono */
const GROW = ['flags', 'abilities', 'seenDialogues', 'collectedLore', 'charms', 'stops'] as const;
type GrowKey = (typeof GROW)[number];

type Merge = Partial<Record<GrowKey, string[]>> & { explored?: Record<string, number[]> };

const personal = new Set<string>(PERSONAL_KEYS);

export class SaveLink {
    private readonly session: NetSession<CoopMsgs>;
    private acc = 0;
    private recordAcc = 0;
    /** host: l'ultima versione mandata di ogni campo */
    private readonly sent = new Map<string, string>();
    /** ospite: l'ultima versione dell'host di ogni campo, per capire cosa ho aggiunto io */
    private readonly host = new Map<string, unknown>();
    /** ospite: le aggiunte mandate e non ancora tornate dall'host */
    private pending: Merge = {};
    private readonly offs: (() => void)[] = [];
    private lastStats = '';

    constructor(session: NetSession<CoopMsgs>) {
        this.session = session;
        if (coop.isHost) {
            this.offs.push(session.on('merge', (m) => this.merge(m)));
            // chi arriva riparte da zero: il primo giro manda tutto
            this.lastStats = JSON.stringify(state.save.stats);
        } else {
            for (const [k, v] of Object.entries(state.save)) if (!personal.has(k)) this.host.set(k, structuredClone(v));
            this.offs.push(session.on('save', (m) => this.receive(m.keys)));
            this.offs.push(session.on('grant', (g) => this.grant(g)));
            this.offs.push(session.on('run', (r) => this.receiveRun(r)));
        }
    }

    tick(delta: number): void {
        this.acc += delta;
        if (this.acc < SYNC_MS) return;
        this.acc = 0;
        if (coop.isHost) {
            this.sendChanges(delta);
            this.sendRun();
        } else this.sendAdditions();
    }

    /* ---------- host ---------- */

    /** patto, smela e droga cambiano di rado: viaggiano quando cambiano */
    private lastRun = '';

    private sendRun(): void {
        if (!coop.together) {
            this.lastRun = '';
            return;
        }
        const run = JSON.stringify(coop.sharedRun());
        if (run === this.lastRun) return;
        this.lastRun = run;
        this.session.send('run', coop.sharedRun());
    }

    private sendChanges(_delta: number): void {
        // senza nessuno dall'altra parte non si manda niente: chi entra riceve il salvataggio intero
        if (!coop.together) {
            this.sent.clear();
            this.lastStats = JSON.stringify(state.save.stats);
            return;
        }
        this.recordAcc += SYNC_MS;
        const keys: Record<string, unknown> = {};
        let any = false;
        const save = state.save as unknown as Record<string, unknown>;
        for (const [k, v] of Object.entries(save)) {
            if (personal.has(k)) continue;
            // il tempo di gioco cambia a ogni passo: il registro viaggia ogni cinque secondi, il resto quando cambia
            if (k === 'record' && this.recordAcc < 5000) continue;
            const json = JSON.stringify(v);
            if (this.sent.get(k) === json) continue;
            this.sent.set(k, json);
            keys[k] = v;
            any = true;
        }
        if (this.recordAcc >= 5000) this.recordAcc = 0;
        if (any) this.session.send('save', { keys: keys as Partial<SharedSave> });
        // un premio che sale sul personaggio dell'host (cuori, maschere) sale anche sull'altro
        const stats = JSON.stringify(state.save.stats);
        if (stats !== this.lastStats) {
            const before = JSON.parse(this.lastStats) as SaveData['stats'];
            this.lastStats = stats;
            const dc = state.save.stats.costituzione - before.costituzione;
            const df = state.save.stats.forza - before.forza;
            if (dc > 0 || df > 0) this.session.send('grant', { costituzione: Math.max(0, dc), forza: Math.max(0, df), heal: dc > 0 });
        }
    }

    private merge(m: Merge): void {
        let changed = false;
        for (const k of GROW) {
            const add = m[k];
            if (!Array.isArray(add)) continue;
            const list = state.save[k] as string[];
            for (const v of add) {
                if (typeof v !== 'string' || list.includes(v)) continue;
                // una wave o un amuleto si guadagnano nel mondo dell'host, non per richiesta
                if (k === 'abilities' || k === 'charms') continue;
                list.push(v);
                changed = true;
            }
        }
        if (m.explored && typeof m.explored === 'object') {
            for (const [region, rooms] of Object.entries(m.explored)) {
                if (!Array.isArray(rooms)) continue;
                const list = (state.save.explored[region] ??= []);
                for (const r of rooms) {
                    if (typeof r === 'number' && !list.includes(r)) {
                        list.push(r);
                        changed = true;
                    }
                }
            }
        }
        if (changed) state.persist();
    }

    /* ---------- ospite ---------- */

    private additions(): Merge {
        const out: Merge = {};
        for (const k of GROW) {
            const base = (this.host.get(k) as string[] | undefined) ?? [];
            const add = (state.save[k] as string[]).filter((v) => !base.includes(v));
            if (add.length) out[k] = add;
        }
        const baseEx = (this.host.get('explored') as Record<string, number[]> | undefined) ?? {};
        for (const [region, rooms] of Object.entries(state.save.explored)) {
            const add = rooms.filter((r) => !(baseEx[region] ?? []).includes(r));
            if (add.length) (out.explored ??= {})[region] = add;
        }
        return out;
    }

    private sendAdditions(): void {
        const add = this.additions();
        const fresh: Merge = {};
        let any = false;
        for (const k of GROW) {
            const now = (add[k] ?? []).filter((v) => !(this.pending[k] ?? []).includes(v));
            if (now.length) {
                fresh[k] = now;
                (this.pending[k] ??= []).push(...now);
                any = true;
            }
        }
        for (const [region, rooms] of Object.entries(add.explored ?? {})) {
            const sent = this.pending.explored?.[region] ?? [];
            const now = rooms.filter((r) => !sent.includes(r));
            if (now.length) {
                ((fresh.explored ??= {})[region] = now);
                (((this.pending.explored ??= {})[region] ??= []).push(...now));
                any = true;
            }
        }
        if (any) this.session.send('merge', fresh);
    }

    private receiveRun(r: CoopMsgs['run']): void {
        state.run.patto = !!r.patto;
        state.run.smela = !!r.smela;
        state.run.trenbolone = !!r.trenbolone;
    }

    private receive(keys: Partial<SharedSave>): void {
        const save = state.save as unknown as Record<string, unknown>;
        const before = { barre: state.save.barre, abilities: state.save.abilities.length, inv: JSON.stringify(state.save.inventory) };
        for (const [k, v] of Object.entries(keys)) {
            if (personal.has(k)) continue;
            this.host.set(k, structuredClone(v));
            // le mie aggiunte non ancora arrivate all'host restano: niente scoperte fatte due volte
            if ((GROW as readonly string[]).includes(k) && Array.isArray(v)) {
                const mine = (this.pending[k as GrowKey] ?? []).filter((x) => !(v as string[]).includes(x));
                this.pending[k as GrowKey] = mine;
                save[k] = [...(v as string[]), ...mine];
            } else if (k === 'explored' && v && typeof v === 'object') {
                const merged = structuredClone(v) as Record<string, number[]>;
                for (const [region, rooms] of Object.entries(this.pending.explored ?? {})) {
                    const left = rooms.filter((r) => !(merged[region] ?? []).includes(r));
                    this.pending.explored![region] = left;
                    (merged[region] ??= []).push(...left);
                }
                save[k] = merged;
            } else {
                save[k] = structuredClone(v);
            }
        }
        state.invalidateMods();
        if (state.save.barre !== before.barre) bus.emit('barre-changed', { barre: state.save.barre, gained: state.save.barre > before.barre });
        if (state.save.abilities.length !== before.abilities) {
            bus.emit('abilities-changed', { abilities: state.abilities });
            bus.emit('fragments-changed', { count: state.abilities.length, total: TOTAL_FRAGMENTS });
        }
        if (JSON.stringify(state.save.inventory) !== before.inv) bus.emit('inventory-changed', {});
    }

    private grant(g: CoopMsgs['grant']): void {
        if (g.costituzione) state.save.stats.costituzione += g.costituzione;
        if (g.forza) state.save.stats.forza += g.forza;
        if (g.heal) state.run.hp = state.maxHp;
        coop.updateMyCharacter();
        bus.emit('hp-changed', { hp: state.run.hp, maxHp: state.maxHp, hurt: false });
    }

    destroy(): void {
        for (const off of this.offs) off();
        this.offs.length = 0;
    }
}
