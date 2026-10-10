/** due canali tra due giocatori: l'affidabile per gli eventi (ordinato, json), il veloce per lo stato (binario, si perde) */
export interface Transport {
    sendReliable(text: string): void;
    sendFast(data: Uint8Array): void;
    onReliable: (text: string) => void;
    onFast: (data: Uint8Array) => void;
    /** il canale è caduto: chi lo sente chiude la sessione */
    onClose: (reason: string) => void;
    readonly open: boolean;
    close(): void;
}

/** base comune: i gestori sono vuoti finché la sessione non li aggancia */
export abstract class BaseTransport implements Transport {
    onReliable: (text: string) => void = () => {};
    onFast: (data: Uint8Array) => void = () => {};
    onClose: (reason: string) => void = () => {};
    abstract readonly open: boolean;
    abstract sendReliable(text: string): void;
    abstract sendFast(data: Uint8Array): void;
    abstract close(): void;
}

/** due capi collegati in memoria: i test della sessione senza rete né browser */
export class MemoryTransport extends BaseTransport {
    private peer: MemoryTransport | null = null;
    private closed = false;
    /** quota di pacchetti veloci persi, per provare la tenuta */
    lossRate = 0;
    private readonly random: () => number;
    private readonly deliver: (fn: () => void) => void;

    private constructor(random: () => number, deliver: (fn: () => void) => void) {
        super();
        this.random = random;
        this.deliver = deliver;
    }

    /** consegna differita come una rete vera: un messaggio non arriva mai dentro la send che lo spedisce */
    static pair(deliver: (fn: () => void) => void = (fn) => queueMicrotask(fn), random: () => number = Math.random): [MemoryTransport, MemoryTransport] {
        const a = new MemoryTransport(random, deliver);
        const b = new MemoryTransport(random, deliver);
        a.peer = b;
        b.peer = a;
        return [a, b];
    }

    get open(): boolean {
        return !this.closed && !!this.peer && !this.peer.closed;
    }

    sendReliable(text: string): void {
        const peer = this.peer;
        if (!this.open || !peer) return;
        this.deliver(() => {
            if (!peer.closed) peer.onReliable(text);
        });
    }

    sendFast(data: Uint8Array): void {
        const peer = this.peer;
        if (!this.open || !peer) return;
        if (this.lossRate > 0 && this.random() < this.lossRate) return;
        const copy = data.slice();
        this.deliver(() => {
            if (!peer.closed) peer.onFast(copy);
        });
    }

    close(): void {
        if (this.closed) return;
        this.closed = true;
        const peer = this.peer;
        if (peer && !peer.closed) {
            this.deliver(() => {
                if (peer.closed) return;
                peer.closed = true;
                peer.onClose('remote');
            });
        }
    }
}
