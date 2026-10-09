import type { Transport } from './transport';

/** online passa da webrtc; locale sono due schede dello stesso browser, per provare senza rete */
export type RoomKind = 'online' | 'locale';

/** la stanza aperta dall'host: resta in ascolto anche a partita iniziata, così chi cade rientra */
export interface HostRoom {
    readonly code: string;
    readonly kind: RoomKind;
    onGuest: (t: Transport) => void;
    /** la stanza non accetta più ingressi (signaling perso): la partita in corso continua */
    onLost: (reason: string) => void;
    close(): void;
}

export class RoomError extends Error {
    readonly code: 'non-trovata' | 'rete' | 'tempo' | 'browser' | 'occupata';

    constructor(code: RoomError['code'], message: string) {
        super(message);
        this.code = code;
    }
}

/* niente lettere che si confondono a voce o a occhio: 0/o, 1/i/l */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const CODE_LENGTH = 5;

export function makeCode(random: () => number = () => crypto.getRandomValues(new Uint32Array(1))[0]! / 2 ** 32): string {
    let out = '';
    for (let i = 0; i < CODE_LENGTH; i++) out += ALPHABET[Math.floor(random() * ALPHABET.length)];
    return out;
}

/** quello che si digita o si incolla diventa un codice, o null se non lo è */
export function normalizeCode(raw: string): string | null {
    const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (clean.length !== CODE_LENGTH) return null;
    for (const ch of clean) if (!ALPHABET.includes(ch)) return null;
    return clean;
}

export async function openRoom(kind: RoomKind): Promise<HostRoom> {
    if (kind === 'locale') return (await import('./localRoom')).openLocalRoom();
    return (await import('./peerRoom')).openPeerRoom();
}

export async function joinRoom(kind: RoomKind, code: string): Promise<Transport> {
    if (kind === 'locale') return (await import('./localRoom')).joinLocalRoom(code);
    return (await import('./peerRoom')).joinPeerRoom(code);
}
