import { Peer, type DataConnection } from 'peerjs';
import { iceServers, ownPeerServer, routeOf } from './ice';
import { makeCode, RoomError, type HostRoom } from './rooms';
import { BaseTransport, type Transport } from './transport';

/* webrtc con peerjs solo per il signaling e il canale affidabile.
   il canale veloce è negoziato a mano sulla stessa connessione: quello "non
   affidabile" di peerjs ritrasmette, e uno stato vecchio arrivato tardi è peggio di uno perso */

const PEER_PREFIX = 'gecowave-coop-';
const FAST_CHANNEL_ID = 77;
const LABEL = 'gecowave';

class PeerTransport extends BaseTransport {
    private readonly conn: DataConnection;
    private fast: RTCDataChannel | null = null;
    private alive = true;

    constructor(conn: DataConnection) {
        super();
        this.conn = conn;
        conn.on('data', (data) => {
            if (typeof data === 'string') this.onReliable(data);
            // canale veloce non ancora aperto: lo stato viaggia sull'affidabile
            else if (data instanceof ArrayBuffer) this.onFast(new Uint8Array(data));
            else if (ArrayBuffer.isView(data)) this.onFast(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
        });
        conn.on('close', () => this.drop('canale chiuso'));
        conn.on('error', () => this.drop('errore del canale'));
        const pc = conn.peerConnection;
        if (pc) {
            try {
                const fast = pc.createDataChannel('geco-fast', { negotiated: true, id: FAST_CHANNEL_ID, ordered: false, maxRetransmits: 0 });
                fast.binaryType = 'arraybuffer';
                fast.onmessage = (e) => {
                    if (e.data instanceof ArrayBuffer) this.onFast(new Uint8Array(e.data));
                };
                this.fast = fast;
            } catch {
                // senza canali negoziati si resta sull'affidabile: più lento, ma gioca
                this.fast = null;
            }
            pc.addEventListener('connectionstatechange', () => {
                if (pc.connectionState === 'failed' || pc.connectionState === 'closed') this.drop('connessione persa');
            });
        }
    }

    get open(): boolean {
        return this.alive && this.conn.open;
    }

    get peerConnection(): RTCPeerConnection | undefined {
        return this.conn.peerConnection;
    }

    sendReliable(text: string): void {
        if (!this.open) return;
        void this.conn.send(text);
    }

    sendFast(data: Uint8Array): void {
        if (!this.open) return;
        const fast = this.fast;
        // un buffer pieno vuol dire rete intasata: lo stato vecchio si butta invece di accodarlo
        if (fast && fast.readyState === 'open') {
            if (fast.bufferedAmount < 64 * 1024) fast.send(data as Uint8Array<ArrayBuffer>);
            return;
        }
        void this.conn.send(data.slice().buffer);
    }

    private drop(reason: string): void {
        if (!this.alive) return;
        this.alive = false;
        this.fast?.close();
        this.onClose(reason);
    }

    close(): void {
        if (!this.alive) return;
        this.alive = false;
        this.fast?.close();
        this.conn.close();
    }
}

async function makePeer(id: string | undefined): Promise<Peer> {
    const config: RTCConfiguration = { iceServers: await iceServers() };
    const own = ownPeerServer();
    const opts = own ? { ...own, config } : { config };
    return id ? new Peer(id, opts) : new Peer(opts);
}

function waitOpen(peer: Peer, ms: number): Promise<void> {
    return new Promise((resolve, reject) => {
        const timer = window.setTimeout(() => reject(new RoomError('tempo', 'il server delle stanze non risponde')), ms);
        peer.once('open', () => {
            window.clearTimeout(timer);
            resolve();
        });
        peer.once('error', (err) => {
            window.clearTimeout(timer);
            const type = (err as { type?: string }).type;
            if (type === 'unavailable-id') reject(new RoomError('occupata', 'codice già in uso'));
            else if (type === 'browser-incompatible') reject(new RoomError('browser', 'questo browser non supporta webrtc'));
            else reject(new RoomError('rete', 'server delle stanze irraggiungibile'));
        });
    });
}

export async function openPeerRoom(): Promise<HostRoom> {
    if (typeof RTCPeerConnection === 'undefined') throw new RoomError('browser', 'questo browser non supporta webrtc');
    // un codice preso da un'altra partita si cambia in silenzio
    for (let attempt = 0; attempt < 4; attempt++) {
        const code = makeCode();
        const peer = await makePeer(PEER_PREFIX + code);
        try {
            await waitOpen(peer, 10000);
        } catch (e) {
            peer.destroy();
            if (e instanceof RoomError && e.code === 'occupata') continue;
            throw e;
        }
        let guest: PeerTransport | null = null;
        let closed = false;
        const room: HostRoom = {
            code,
            kind: 'online',
            onGuest: () => {},
            onLost: () => {},
            close: () => {
                closed = true;
                guest?.close();
                peer.destroy();
            },
        };
        peer.on('connection', (conn) => {
            if (conn.label !== LABEL) {
                conn.close();
                return;
            }
            conn.on('open', () => {
                if (guest?.open) {
                    // la stanza ne tiene uno: il secondo riceve il perché e se ne va
                    void conn.send(JSON.stringify({ t: 'room-full' }));
                    window.setTimeout(() => conn.close(), 300);
                    return;
                }
                guest = new PeerTransport(conn);
                room.onGuest(guest);
            });
        });
        // il socket del signaling cade da solo dopo un po' di silenzio: senza, chi cade non rientra
        peer.on('disconnected', () => {
            if (closed || peer.destroyed) return;
            window.setTimeout(() => {
                if (closed || peer.destroyed) return;
                peer.reconnect();
            }, 1000);
        });
        peer.on('error', (err) => {
            const type = (err as { type?: string }).type;
            if (!closed && (type === 'network' || type === 'server-error' || type === 'socket-closed')) room.onLost('server delle stanze irraggiungibile');
        });
        return room;
    }
    throw new RoomError('occupata', 'nessun codice libero, riprova');
}

export async function joinPeerRoom(code: string): Promise<Transport> {
    if (typeof RTCPeerConnection === 'undefined') throw new RoomError('browser', 'questo browser non supporta webrtc');
    const peer = await makePeer(undefined);
    try {
        await waitOpen(peer, 10000);
    } catch (e) {
        peer.destroy();
        throw e;
    }
    return new Promise<Transport>((resolve, reject) => {
        let done = false;
        const fail = (err: RoomError) => {
            if (done) return;
            done = true;
            window.clearTimeout(timer);
            peer.destroy();
            reject(err);
        };
        const timer = window.setTimeout(() => fail(new RoomError('tempo', 'la partita non risponde: router o firewall bloccano la connessione')), 20000);
        peer.on('error', (err) => {
            const type = (err as { type?: string }).type;
            if (type === 'peer-unavailable') fail(new RoomError('non-trovata', 'nessuna partita con questo codice'));
            else if (type === 'network' || type === 'server-error') fail(new RoomError('rete', 'server delle stanze irraggiungibile'));
        });
        const conn = peer.connect(PEER_PREFIX + code, { label: LABEL, reliable: true, serialization: 'raw' });
        conn.on('open', () => {
            if (done) return;
            done = true;
            window.clearTimeout(timer);
            const t = new PeerTransport(conn);
            // il signaling non serve più: la connessione è diretta, il socket si chiude
            const prevClose = t.close.bind(t);
            t.close = () => {
                prevClose();
                peer.destroy();
            };
            peer.disconnect();
            resolve(t);
        });
    });
}

/** strada presa dalla connessione, per la diagnostica nel menu */
export function transportRoute(t: Transport): Promise<'diretta' | 'relay' | null> {
    return routeOf(t instanceof PeerTransport ? t.peerConnection : undefined);
}
