import { ByteReader, ByteWriter } from './codec';
import type { Transport } from './transport';

/* una sessione tra due giocatori sopra un trasporto qualsiasi: stretta di mano con
   la versione, messaggi affidabili tipati, pacchetti veloci binari, battito, ritardo
   e orologio dell'altro. non sa niente del gioco: i tipi dei messaggi li dà chi la usa */

/** si cambia a ogni modifica del protocollo: due build diverse non si parlano */
export const PROTOCOL_VERSION = 1;

/** i primi tipi veloci sono della sessione: il gioco usa da FAST_GAME in su */
const FAST_PING = 1;
const FAST_PONG = 2;
export const FAST_GAME = 16;

const CHUNK = 48000;
const CHUNK_MARK = '\u0001';
const PING_MS = 500;
/** senza niente dall'altro: prima instabile, poi persa */
const UNSTABLE_MS = 2500;
const LOST_MS = 15000;

export type LinkState = 'buono' | 'instabile' | 'perso';

export interface SessionInfo {
    proto: number;
    build: string;
}

type Envelope = { t: string; [k: string]: unknown };

export class NetSession<M extends Record<string, object>> {
    private readonly transport: Transport;
    private readonly handlers = new Map<string, Set<(m: never) => void>>();
    private readonly fastHandlers = new Map<number, (r: ByteReader, sentAt: number) => void>();
    private readonly chunks = new Map<string, string[]>();
    private chunkSeq = 0;
    private pingTimer = 0;
    private pingSeq = 0;
    private lastHeard = 0;
    private samples: { rtt: number; offset: number }[] = [];
    private closed = false;
    /** ritardo di andata e ritorno, ms, smussato */
    rtt = 0;
    /** orologio dell'altro meno il mio, ms: serve a mettere i suoi tempi sulla mia linea */
    offset = 0;
    link: LinkState = 'buono';
    /** la versione dell'altro, dopo la stretta di mano */
    remote: SessionInfo | null = null;
    onLink: (s: LinkState) => void = () => {};
    onClose: (reason: string) => void = () => {};
    onReady: (info: SessionInfo) => void = () => {};
    private readonly local: SessionInfo;
    private readonly clock: () => number;

    constructor(transport: Transport, local: Omit<SessionInfo, 'proto'>, clock: () => number = () => performance.now()) {
        this.transport = transport;
        this.local = { proto: PROTOCOL_VERSION, ...local };
        this.clock = clock;
        this.lastHeard = clock();
        transport.onReliable = (text) => this.receiveText(text);
        transport.onFast = (data) => this.receiveFast(data);
        transport.onClose = (reason) => this.end(reason === 'remote' ? 'l’altro giocatore ha chiuso' : reason);
        this.sendRaw({ t: 'hello', ...this.local });
        this.pingTimer = setInterval(() => this.tick(), PING_MS);
    }

    get open(): boolean {
        return !this.closed && this.transport.open;
    }

    /** il tempo dell'altro, stimato adesso */
    remoteNow(): number {
        return this.clock() + this.offset;
    }

    /** un istante dell'orologio dell'altro portato sul mio */
    toLocal(remoteTime: number): number {
        return remoteTime - this.offset;
    }

    send<K extends keyof M & string>(t: K, payload: M[K]): void {
        this.sendRaw({ ...(payload as object), t });
    }

    on<K extends keyof M & string>(t: K, fn: (m: M[K]) => void): () => void {
        let set = this.handlers.get(t);
        if (!set) {
            set = new Set();
            this.handlers.set(t, set);
        }
        set.add(fn as (m: never) => void);
        return () => set!.delete(fn as (m: never) => void);
    }

    /** un tipo veloce ha un solo ascoltatore: lo stato si legge una volta */
    onFast(type: number, fn: (r: ByteReader, sentAt: number) => void): () => void {
        this.fastHandlers.set(type, fn);
        return () => {
            if (this.fastHandlers.get(type) === fn) this.fastHandlers.delete(type);
        };
    }

    /** ogni pacchetto veloce porta l'ora di chi lo manda: chi riceve interpola sul suo orologio */
    sendFast(type: number, fill: (w: ByteWriter) => void): void {
        if (!this.open) return;
        const w = new ByteWriter(128);
        w.u8(type).u32(Math.floor(this.clock()));
        fill(w);
        this.transport.sendFast(w.finish());
    }

    close(reason = 'chiusa'): void {
        if (this.closed) return;
        this.sendRaw({ t: 'bye', reason });
        this.end(reason);
        this.transport.close();
    }

    private end(reason: string): void {
        if (this.closed) return;
        this.closed = true;
        clearInterval(this.pingTimer);
        this.setLink('perso');
        this.onClose(reason);
    }

    private sendRaw(env: Envelope): void {
        if (this.closed || !this.transport.open) return;
        const text = JSON.stringify(env);
        if (text.length <= CHUNK) {
            this.transport.sendReliable(text);
            return;
        }
        // i messaggi grandi (salvataggio, mondo intero) passano a pezzi: i canali hanno un tetto
        const id = String(++this.chunkSeq);
        const n = Math.ceil(text.length / CHUNK);
        for (let i = 0; i < n; i++) this.transport.sendReliable(`${CHUNK_MARK}${id}:${i}:${n}:${text.slice(i * CHUNK, (i + 1) * CHUNK)}`);
    }

    private receiveText(text: string): void {
        this.heard();
        if (text.startsWith(CHUNK_MARK)) {
            const m = /^\u0001(\d+):(\d+):(\d+):/.exec(text);
            if (!m) return;
            const [head, id, is, ns] = m as unknown as [string, string, string, string];
            const i = Number(is);
            const n = Number(ns);
            if (n <= 0 || n > 4096 || i >= n) return;
            const parts = this.chunks.get(id) ?? new Array<string>(n);
            parts[i] = text.slice(head.length);
            this.chunks.set(id, parts);
            for (let k = 0; k < n; k++) if (parts[k] === undefined) return;
            this.chunks.delete(id);
            this.receiveText(parts.join(''));
            return;
        }
        let env: Envelope;
        try {
            env = JSON.parse(text) as Envelope;
        } catch {
            // un pacchetto rotto non deve far cadere la partita
            return;
        }
        if (!env || typeof env.t !== 'string') return;
        if (env.t === 'hello') {
            const info = { proto: Number(env.proto), build: String(env.build ?? '') };
            this.remote = info;
            if (info.proto !== PROTOCOL_VERSION || info.build !== this.local.build) {
                this.close(`versioni diverse: tu ${this.local.build}, l’altro ${info.build || '?'}`);
                return;
            }
            this.onReady(info);
            return;
        }
        if (env.t === 'bye') {
            this.end(typeof env.reason === 'string' ? env.reason : 'l’altro giocatore ha chiuso');
            this.transport.close();
            return;
        }
        if (env.t === 'room-full') {
            this.end('la partita ha già due giocatori');
            this.transport.close();
            return;
        }
        const set = this.handlers.get(env.t);
        if (!set) return;
        for (const fn of [...set]) (fn as (m: Envelope) => void)(env);
    }

    private receiveFast(data: Uint8Array): void {
        this.heard();
        const r = new ByteReader(data);
        const type = r.u8();
        const sentAt = r.u32();
        if (r.broken) return;
        if (type === FAST_PING) {
            const seq = r.u16();
            if (r.broken) return;
            const w = new ByteWriter(16);
            w.u8(FAST_PONG).u32(Math.floor(this.clock())).u32(sentAt).u16(seq);
            if (this.open) this.transport.sendFast(w.finish());
            return;
        }
        if (type === FAST_PONG) {
            const echoed = r.u32();
            if (r.broken) return;
            this.pong(echoed, sentAt);
            return;
        }
        const fn = this.fastHandlers.get(type);
        if (fn) fn(r, sentAt);
    }

    private pong(echoed: number, theirTime: number): void {
        const now = this.clock();
        // l'orologio a 32 bit gira ogni 49 giorni: il ritardo si conta modulo
        const rtt = ((Math.floor(now) - echoed) >>> 0);
        if (rtt > 10000) return;
        const offset = theirTime + rtt / 2 - now;
        this.samples.push({ rtt, offset });
        if (this.samples.length > 24) this.samples.shift();
        this.rtt = this.rtt === 0 ? rtt : this.rtt * 0.8 + rtt * 0.2;
        // i campioni col ritardo più basso sono i più onesti sull'orologio
        const best = [...this.samples].sort((a, b) => a.rtt - b.rtt).slice(0, Math.max(1, Math.ceil(this.samples.length / 3)));
        const offsets = best.map((s) => s.offset).sort((a, b) => a - b);
        this.offset = offsets[Math.floor(offsets.length / 2)]!;
    }

    private heard(): void {
        this.lastHeard = this.clock();
        if (this.link !== 'buono') this.setLink('buono');
    }

    private tick(): void {
        if (this.closed) return;
        const silent = this.clock() - this.lastHeard;
        if (silent > LOST_MS) {
            this.end('connessione persa');
            this.transport.close();
            return;
        }
        if (silent > UNSTABLE_MS) this.setLink('instabile');
        const w = new ByteWriter(16);
        this.pingSeq = (this.pingSeq + 1) & 0xffff;
        w.u8(FAST_PING).u32(Math.floor(this.clock())).u16(this.pingSeq);
        if (this.transport.open) this.transport.sendFast(w.finish());
    }

    private setLink(s: LinkState): void {
        if (this.link === s) return;
        this.link = s;
        this.onLink(s);
    }
}
