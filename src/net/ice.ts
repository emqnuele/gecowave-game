/* i server per attraversare i router: stun sempre, turn solo se configurato.
   i valori VITE_* finiscono nella build, quindi chi scarica il gioco li può leggere:
   per un turn a pagamento meglio VITE_TURN_ENDPOINT, che dà credenziali a tempo */

export interface PeerServer {
    host: string;
    port: number;
    path: string;
    key: string;
    secure: boolean;
}

function env(key: string): string {
    const v = (import.meta.env as Record<string, string | undefined>)[key];
    return (v ?? '').trim();
}

function staticIce(): RTCIceServer[] {
    const out: RTCIceServer[] = [];
    const own = env('VITE_OWN_TURN_HOST');
    const ownCred = env('VITE_OWN_TURN_CRED');
    if (own) {
        out.push({ urls: `stun:${own}:3478` });
        if (ownCred) {
            const username = env('VITE_OWN_TURN_USER') || 'geco';
            out.push({ urls: [`turn:${own}:3478?transport=udp`, `turn:${own}:3478?transport=tcp`, `turns:${own}:5349?transport=tcp`], username, credential: ownCred });
        }
    }
    const mUser = env('VITE_METERED_USER');
    const mCred = env('VITE_METERED_CRED');
    if (mUser && mCred) {
        out.push({
            urls: ['turn:standard.relay.metered.ca:80', 'turn:standard.relay.metered.ca:80?transport=tcp', 'turn:standard.relay.metered.ca:443', 'turns:standard.relay.metered.ca:443?transport=tcp'],
            username: mUser,
            credential: mCred,
        });
    }
    out.push({ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] });
    return out;
}

/** credenziali a tempo da un endpoint proprio, se c'è: non bloccano mai la connessione oltre due secondi e mezzo */
export async function iceServers(): Promise<RTCIceServer[]> {
    const base = staticIce();
    const endpoint = env('VITE_TURN_ENDPOINT');
    if (!endpoint) return base;
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), 2500);
    try {
        const res = await fetch(endpoint, { cache: 'no-store', signal: ctrl.signal });
        if (!res.ok) return base;
        const data = (await res.json()) as { iceServers?: RTCIceServer[] } | RTCIceServer[];
        const list = Array.isArray(data) ? data : data.iceServers;
        if (!Array.isArray(list) || !list.length) return base;
        return [...list.filter((s) => s && s.urls), ...base];
    } catch {
        // endpoint giù o lento: si prova lo stesso con stun e turn statici
        return base;
    } finally {
        window.clearTimeout(timer);
    }
}

/** il signaling proprio, se configurato; senza, il cloud pubblico di peerjs */
export function ownPeerServer(): PeerServer | null {
    const host = env('VITE_OWN_PEER_HOST');
    if (!host) return null;
    const port = Number.parseInt(env('VITE_OWN_PEER_PORT'), 10);
    return {
        host,
        port: Number.isFinite(port) && port > 0 ? port : 443,
        path: env('VITE_OWN_PEER_PATH') || '/',
        key: env('VITE_OWN_PEER_KEY') || 'peerjs',
        secure: host !== 'localhost' && host !== '127.0.0.1',
    };
}

/** per la diagnostica: la connessione è diretta o passa dal relay */
export async function routeOf(pc: RTCPeerConnection | undefined): Promise<'diretta' | 'relay' | null> {
    if (!pc) return null;
    try {
        const stats = await pc.getStats();
        let pairLocal = '';
        const types = new Map<string, string>();
        stats.forEach((r: RTCStats & { selected?: boolean; nominated?: boolean; state?: string; localCandidateId?: string; candidateType?: string }) => {
            if (r.type === 'local-candidate') types.set(r.id, r.candidateType ?? '');
            if (r.type === 'candidate-pair' && r.state === 'succeeded' && (r.nominated || r.selected)) pairLocal = r.localCandidateId ?? '';
        });
        if (!pairLocal) return null;
        return types.get(pairLocal) === 'relay' ? 'relay' : 'diretta';
    } catch {
        return null;
    }
}
