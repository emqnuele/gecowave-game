import { makeCode, RoomError, type HostRoom } from './rooms';
import { BaseTransport, type Transport } from './transport';

/* due schede dello stesso browser su un BroadcastChannel: lo stesso protocollo
   senza webrtc, per lo sviluppo e per le prove a due schede */

type Frame =
    | { k: 'join'; from: string }
    | { k: 'accept'; to: string; from: string }
    | { k: 'full'; to: string }
    | { k: 'r'; to: string; from: string; text: string }
    | { k: 'f'; to: string; from: string; data: Uint8Array }
    | { k: 'bye'; to: string; from: string };

const channelName = (code: string) => `gecowave-coop-${code}`;
const newId = () => Math.random().toString(36).slice(2, 10);

class LocalTransport extends BaseTransport {
    private alive = true;
    private readonly ch: BroadcastChannel;
    private readonly me: string;
    private readonly other: string;
    private readonly ownsChannel: boolean;

    constructor(ch: BroadcastChannel, me: string, other: string, ownsChannel: boolean) {
        super();
        this.ch = ch;
        this.me = me;
        this.other = other;
        this.ownsChannel = ownsChannel;
    }

    get open(): boolean {
        return this.alive;
    }

    handle(f: Frame): void {
        if (!this.alive || !('from' in f) || f.from !== this.other) return;
        if (f.k === 'r') this.onReliable(f.text);
        else if (f.k === 'f') this.onFast(f.data);
        else if (f.k === 'bye') this.drop('remote');
    }

    sendReliable(text: string): void {
        if (this.alive) this.ch.postMessage({ k: 'r', to: this.other, from: this.me, text } satisfies Frame);
    }

    sendFast(data: Uint8Array): void {
        if (this.alive) this.ch.postMessage({ k: 'f', to: this.other, from: this.me, data } satisfies Frame);
    }

    drop(reason: string): void {
        if (!this.alive) return;
        this.alive = false;
        if (this.ownsChannel) this.ch.close();
        this.onClose(reason);
    }

    close(): void {
        if (!this.alive) return;
        this.ch.postMessage({ k: 'bye', to: this.other, from: this.me } satisfies Frame);
        this.alive = false;
        if (this.ownsChannel) this.ch.close();
    }
}

export async function openLocalRoom(): Promise<HostRoom> {
    if (typeof BroadcastChannel === 'undefined') throw new RoomError('browser', 'questo browser non apre stanze locali');
    const code = makeCode();
    const ch = new BroadcastChannel(channelName(code));
    const me = newId();
    let guest: LocalTransport | null = null;
    const room: HostRoom = {
        code,
        kind: 'locale',
        onGuest: () => {},
        onLost: () => {},
        close: () => {
            guest?.close();
            ch.close();
        },
    };
    ch.onmessage = (e: MessageEvent<Frame>) => {
        const f = e.data;
        if (f.k === 'join') {
            // un ospite alla volta: chi arriva con la stanza piena lo sa subito
            if (guest?.open) {
                ch.postMessage({ k: 'full', to: f.from } satisfies Frame);
                return;
            }
            guest = new LocalTransport(ch, me, f.from, false);
            ch.postMessage({ k: 'accept', to: f.from, from: me } satisfies Frame);
            room.onGuest(guest);
            return;
        }
        if ('to' in f && f.to === me) guest?.handle(f);
    };
    return room;
}

export function joinLocalRoom(code: string): Promise<Transport> {
    if (typeof BroadcastChannel === 'undefined') return Promise.reject(new RoomError('browser', 'questo browser non apre stanze locali'));
    return new Promise((resolve, reject) => {
        const ch = new BroadcastChannel(channelName(code));
        const me = newId();
        let t: LocalTransport | null = null;
        const timer = window.setTimeout(() => {
            ch.close();
            reject(new RoomError('non-trovata', 'nessuna partita con questo codice'));
        }, 3000);
        ch.onmessage = (e: MessageEvent<Frame>) => {
            const f = e.data;
            if (!('to' in f) || f.to !== me) return;
            if (f.k === 'full') {
                window.clearTimeout(timer);
                ch.close();
                reject(new RoomError('occupata', 'la partita ha già due giocatori'));
                return;
            }
            if (f.k === 'accept' && !t) {
                window.clearTimeout(timer);
                t = new LocalTransport(ch, me, f.from, true);
                resolve(t);
                return;
            }
            t?.handle(f);
        };
        ch.postMessage({ k: 'join', from: me } satisfies Frame);
    });
}
