import { state } from '../core/state';
import { NetSession, type LinkState } from '../net/session';
import { joinRoom, openRoom, type HostRoom, type RoomKind } from '../net/rooms';
import type { Transport } from '../net/transport';
import type { SaveData } from '../types';
import type { CoopMsgs, SharedRun, Spot } from './protocol';
import { characterOf, PERSONAL_KEYS, sanitizeCharacter, type Character, type GameInfo, type SharedSave } from './types';

/* la partita in due fuori dalle scene: la stanza, il compagno, la connessione.
   le scene la leggono per sapere chi decide il mondo; main le dà le mani per
   avviare capitoli e tornare al menu */

export type Role = 'host' | 'guest';

const META_KEY = 'gecowave-coop-meta-v1';
const CHARS_KEY = 'gecowave-coop-chars-v1';

export interface CoopMeta {
    gameId: string;
    partner: string | null;
}

/** cosa il coop chiede al resto del gioco */
export interface CoopApp {
    startLevel(levelId: string, checkpointId: string | null, showCard: boolean, spawnAt?: Spot): void;
    /** fine della partita in due: si torna al menu con il perché */
    toMenu(reason: string | null): void;
    playIntro(done: () => void): void;
    /** l'ospite in partita che non è dentro un capitolo (menu, forgia): niente da fare */
    inLevel(): boolean;
    /** l'host è già dentro un capitolo quando il guest si presenta: aggancia il coop alla scena viva */
    attachHostCoop(): void;
    /** dove sta l'host adesso, se è dentro un capitolo: per far apparire chi entra lì accanto */
    hostSpot(): Spot | null;
}

export type CoopEvent =
    | { type: 'partner'; char: Character | null }
    | { type: 'link'; link: LinkState }
    | { type: 'closed'; reason: string }
    | { type: 'info'; info: GameInfo }
    | { type: 'room'; code: string; kind: RoomKind }
    | { type: 'room-lost'; reason: string };

export function readMeta(): CoopMeta | null {
    try {
        const raw = localStorage.getItem(META_KEY);
        if (!raw) return null;
        const m = JSON.parse(raw) as Partial<CoopMeta>;
        return typeof m.gameId === 'string' ? { gameId: m.gameId, partner: typeof m.partner === 'string' ? m.partner : null } : null;
    } catch {
        return null;
    }
}

function writeMeta(m: CoopMeta): void {
    localStorage.setItem(META_KEY, JSON.stringify(m));
}

/** l'ospite ricorda il suo personaggio per ogni partita in cui è entrato */
export function rememberedCharacter(gameId: string): Character | null {
    try {
        const all = JSON.parse(localStorage.getItem(CHARS_KEY) ?? '{}') as Record<string, unknown>;
        return sanitizeCharacter(all[gameId]);
    } catch {
        return null;
    }
}

function rememberCharacter(gameId: string, c: Character): void {
    let all: Record<string, Character & { at?: number }> = {};
    try {
        all = JSON.parse(localStorage.getItem(CHARS_KEY) ?? '{}');
    } catch {
        all = {};
    }
    all[gameId] = { ...c, at: Date.now() } as Character & { at: number };
    // le partite vecchie si dimenticano: ne bastano otto
    const keep = Object.entries(all).sort((a, b) => (b[1].at ?? 0) - (a[1].at ?? 0)).slice(0, 8);
    localStorage.setItem(CHARS_KEY, JSON.stringify(Object.fromEntries(keep)));
}

export function newGameId(): string {
    const a = crypto.getRandomValues(new Uint32Array(2));
    return `${a[0]!.toString(36)}${a[1]!.toString(36)}`;
}

/** il salvataggio senza i campi del giocatore: quello che viaggia */
export function sharedOf(save: SaveData): SharedSave {
    const out = { ...save } as Partial<SaveData>;
    for (const k of PERSONAL_KEYS) delete out[k];
    return out as SharedSave;
}

/** il mondo dell'host con dentro il personaggio dell'ospite */
export function mirrorSave(shared: SharedSave, me: Character, equipped: string[]): SaveData {
    return { ...(shared as SaveData), playerName: me.name, skin: me.skin, stats: { ...me.stats }, equipped: [...equipped] };
}

class CoopRuntime {
    role: Role | null = null;
    session: NetSession<CoopMsgs> | null = null;
    room: HostRoom | null = null;
    me: Character | null = null;
    partner: Character | null = null;
    /** l'host: il guest si è forgiato ed è entrato (o sta entrando) nel capitolo */
    partnerReady = false;
    gameId = '';
    info: GameInfo | null = null;
    link: LinkState = 'buono';
    app: CoopApp | null = null;
    /** a ogni capitolo nuovo dell'host: i messaggi del capitolo vecchio si buttano */
    levelSeq = 0;
    /** i titoli di coda sono partiti: la fine della partita in due non deve interromperli */
    inEnding = false;
    private listeners = new Set<(e: CoopEvent) => void>();
    private offSession: (() => void)[] = [];
    /** l'ospite non ha ancora mai caricato un capitolo di questa partita */
    private guestFirstLevel = true;

    get active(): boolean {
        return this.role !== null;
    }

    get isHost(): boolean {
        return this.role === 'host';
    }

    get isGuest(): boolean {
        return this.role === 'guest';
    }

    /** c'è qualcuno dall'altra parte, collegato e dentro la partita */
    get together(): boolean {
        return !!this.session?.open && (this.role === 'guest' || this.partnerReady);
    }

    listen(fn: (e: CoopEvent) => void): () => void {
        this.listeners.add(fn);
        return () => this.listeners.delete(fn);
    }

    private emit(e: CoopEvent): void {
        for (const fn of [...this.listeners]) fn(e);
    }

    /* ---------- host ---------- */

    /** apre la partita in due: il salvataggio co-op è già in uso, il personaggio dell'host dentro */
    async host(kind: RoomKind, fresh: boolean): Promise<string> {
        this.end(null, false);
        let meta = readMeta();
        if (fresh || !meta) {
            meta = { gameId: newGameId(), partner: null };
            writeMeta(meta);
        }
        this.role = 'host';
        this.gameId = meta.gameId;
        this.me = characterOf(state.save);
        this.freshGame = fresh;
        const room = await openRoom(kind);
        // chi ha annullato mentre la stanza si apriva non la vuole più
        if (this.role !== 'host') {
            room.close();
            throw new Error('annullato');
        }
        this.room = room;
        room.onGuest = (t) => this.acceptGuest(t);
        room.onLost = (reason) => this.emit({ type: 'room-lost', reason });
        this.emit({ type: 'room', code: room.code, kind });
        return room.code;
    }

    private freshGame = false;
    /** l'host è dentro un capitolo: chi entra adesso ci arriva subito */
    private hostLevel: { levelId: string; checkpointId: string | null; spawn: Spot } | null = null;

    private acceptGuest(t: Transport): void {
        // un ospite nuovo prende il posto di uno sparito senza salutare
        if (this.session) this.dropSession('sostituito');
        const s = new NetSession<CoopMsgs>(t, { build: __GAME_VERSION__ });
        this.session = s;
        this.partnerReady = false;
        this.partner = null;
        s.onReady = () => s.send('info', this.gameInfo());
        s.onLink = (link) => {
            this.link = link;
            this.emit({ type: 'link', link });
        };
        s.onClose = () => {
            if (this.session !== s) return;
            this.session = null;
            this.partner = null;
            this.partnerReady = false;
            this.clearSessionHandlers();
            this.emit({ type: 'partner', char: null });
        };
        this.offSession.push(s.on('char', (m) => {
            const c = sanitizeCharacter(m.char);
            if (!c) return;
            this.partner = c;
            this.partnerReady = true;
            const meta = readMeta();
            if (meta) writeMeta({ ...meta, partner: c.name });
            this.emit({ type: 'partner', char: c });
            if (this.hostLevel) {
                // chi entra a partita iniziata appare accanto all'host, non allo spawn del capitolo
                const live = this.app?.hostSpot();
                const spawn = live ?? this.hostLevel.spawn;
                this.hostLevel.spawn = spawn;
                // l'host partito da solo non ha il coop in scena: lo si aggancia prima del ready
                this.app?.attachHostCoop();
                this.sendLevel(this.hostLevel.levelId, this.hostLevel.checkpointId, spawn, true);
            }
        }));
        this.offSession.push(s.on('leave', () => {
            this.dropSession('uscito');
        }));
    }

    private gameInfo(): GameInfo {
        return {
            gameId: this.gameId,
            host: this.me ?? characterOf(state.save),
            levelId: state.save.levelId,
            playMs: state.save.record.playMs,
            doomsday: state.save.doomsdayMode,
            assisted: state.save.assisted,
            fresh: this.freshGame,
            playing: !!this.hostLevel,
        };
    }

    /** l'host è entrato in un capitolo: il guest lo segue */
    hostEnteredLevel(levelId: string, checkpointId: string | null, spawn: Spot, showCard: boolean): void {
        if (!this.isHost) return;
        this.freshGame = false;
        this.hostLevel = { levelId, checkpointId, spawn };
        this.levelSeq++;
        if (this.together) this.sendLevel(levelId, checkpointId, spawn, showCard);
    }

    private sendLevel(levelId: string, checkpointId: string | null, spawn: Spot, showCard: boolean): void {
        this.session?.send('level', {
            levelId,
            checkpointId,
            seq: this.levelSeq,
            spawn,
            showCard,
            save: sharedOf(state.save),
            run: this.sharedRun(),
        });
    }

    sharedRun(): SharedRun {
        return { patto: state.run.patto, smela: state.run.smela, trenbolone: state.run.trenbolone };
    }

    /** l'host lascia il capitolo per il menu: il guest torna in attesa */
    hostLeftLevel(): void {
        this.hostLevel = null;
    }

    /* ---------- guest ---------- */

    async join(kind: RoomKind, code: string): Promise<GameInfo> {
        this.end(null, false);
        this.role = 'guest';
        this.guestFirstLevel = true;
        const t = await joinRoom(kind, code);
        if (this.role !== 'guest') {
            t.close();
            throw new Error('annullato');
        }
        const s = new NetSession<CoopMsgs>(t, { build: __GAME_VERSION__ });
        this.session = s;
        s.onLink = (link) => {
            this.link = link;
            this.emit({ type: 'link', link });
        };
        return new Promise<GameInfo>((resolve, reject) => {
            let got = false;
            s.onClose = (reason) => {
                if (this.session !== s) return;
                if (!got) {
                    reject(new Error(reason));
                    this.end(null, false);
                    return;
                }
                this.end(reason, true);
            };
            this.offSession.push(s.on('info', (info) => {
                this.info = info;
                this.gameId = info.gameId;
                this.partner = sanitizeCharacter(info.host);
                this.emit({ type: 'info', info });
                if (!got) {
                    got = true;
                    resolve(info);
                }
            }));
            this.offSession.push(s.on('level', (m) => this.guestLevel(m)));
            this.offSession.push(s.on('intro', () => this.app?.playIntro(() => {})));
            this.offSession.push(s.on('leave', (m) => this.end(m.reason || 'l’host ha chiuso la partita', true)));
        });
    }

    /** il guest si è forgiato: si presenta e aspetta il capitolo */
    sendCharacter(c: Character): void {
        this.me = c;
        if (this.gameId) rememberCharacter(this.gameId, c);
        this.session?.send('char', { char: c });
    }

    private guestLevel(m: CoopMsgs['level']): void {
        if (!this.me) return;
        this.levelSeq = m.seq;
        // il primo capitolo cambia salvataggio: da qui l'ospite vive nella copia del mondo dell'host
        if (this.guestFirstLevel || state.saveSlot !== 'ospite') {
            this.guestFirstLevel = false;
            state.useSlot('ospite', mirrorSave(m.save, this.me, []));
        } else {
            this.applyShared(m.save);
        }
        state.run.patto = m.run.patto;
        state.run.smela = m.run.smela;
        state.run.trenbolone = m.run.trenbolone;
        this.app?.startLevel(m.levelId, m.checkpointId, m.showCard, m.spawn);
    }

    /** il mondo dell'host sopra la copia: i campi del giocatore restano miei */
    applyShared(keys: Partial<SharedSave>): void {
        const save = state.save as unknown as Record<string, unknown>;
        for (const [k, v] of Object.entries(keys)) {
            if ((PERSONAL_KEYS as readonly string[]).includes(k)) continue;
            save[k] = v;
        }
        state.invalidateMods();
    }

    /** un premio che cambia il personaggio dell'ospite resta con lui alla prossima volta */
    updateMyCharacter(): void {
        if (!this.isGuest || !this.gameId) return;
        this.me = characterOf(state.save);
        rememberCharacter(this.gameId, this.me);
    }

    /* ---------- fine ---------- */

    private clearSessionHandlers(): void {
        for (const off of this.offSession) off();
        this.offSession = [];
    }

    private dropSession(reason: string): void {
        const s = this.session;
        this.session = null;
        this.clearSessionHandlers();
        this.partner = null;
        this.partnerReady = false;
        s?.close(reason);
        this.emit({ type: 'partner', char: null });
    }

    /** chiude tutto. con toMenu il gioco torna al menu e dice il perché.
        senza announce non saluta l'altro: per chi se ne va avendo già finito */
    end(reason: string | null, toMenu: boolean, announce = true): void {
        const wasActive = this.active;
        const s = this.session;
        this.session = null;
        this.clearSessionHandlers();
        if (s?.open) {
            if (announce) s.send('leave', { reason: this.isHost ? 'l’host ha chiuso la partita' : `${this.me?.name.toLowerCase() ?? 'l’ospite'} ha lasciato la partita` });
            s.close(reason ?? 'chiusa');
        }
        this.room?.close();
        this.room = null;
        this.role = null;
        this.partner = null;
        this.partnerReady = false;
        this.info = null;
        this.hostLevel = null;
        this.levelSeq = 0;
        this.link = 'buono';
        const ending = this.inEnding;
        this.inEnding = false;
        if (!wasActive) return;
        // dentro i titoli non si avvisa nessuno: finiti quelli si torna al titolo comunque
        if (reason && !ending) this.emit({ type: 'closed', reason });
        if (toMenu && !ending) this.app?.toMenu(reason);
    }
}

export const coop = new CoopRuntime();
