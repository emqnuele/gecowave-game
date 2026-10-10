import { LEVELS } from '../content/levels';
import { skinPreset } from '../content/skins';
import { skinFinalCss } from '../art/playerSkin';
import { sfx } from '../audio/sfx';
import { state, COOP_SAVE_KEY } from '../core/state';
import { coop, readMeta, rememberedCharacter } from '../coop/runtime';
import { characterOf, type Character, type GameInfo } from '../coop/types';
import { normalizeCode, CODE_LENGTH, RoomError, type RoomKind } from '../net/rooms';
import { el } from './dom';
import type { MenuItem, Screens } from './screens';
import './coop.css';

/* le pagine del multiplayer: chi crea sceglie e apre la stanza, chi entra
   porta il suo geco. tutto passa dal runtime del coop, qui si mostra e basta */

/** cosa le pagine chiedono a main */
export interface CoopUiHost {
    /** l'host parte: intro se la partita è nuova, poi il capitolo */
    startHosted(fresh: boolean): void;
    /** si torna al titolo dal coop: il salvataggio torna quello da solo */
    backToTitle(): void;
}

/** le prove a due schede aprono le stanze sul BroadcastChannel con ?rete=locale: in build pubblica è sempre online */
function roomKind(): RoomKind {
    if (!import.meta.env.DEV) return 'online';
    return new URLSearchParams(location.search).get('rete') === 'locale' ? 'locale' : 'online';
}

/** testo semplice: i nomi arrivano dall'altro giocatore, mai come html */
function txt<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, text: string): HTMLElementTagNameMap[K] {
    const node = el(tag, cls);
    node.textContent = text;
    return node;
}

function chapterLabel(levelId: string): string {
    const lv = LEVELS[levelId];
    return lv ? `${lv.title.toLowerCase()} ${lv.accentWord}` : levelId;
}

function playTime(ms: number): string {
    const min = Math.floor(ms / 60000);
    return min >= 60 ? `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, '0')}m` : `${min}m`;
}

/** la partita in una frase: da dove si parte e con quale destino */
function gameLine(g: { fresh: boolean; levelId: string; playMs: number; doomsday: boolean; assisted: boolean }): HTMLElement {
    const where = g.fresh ? 'si parte dall’inizio' : `si riprende da ${chapterLabel(g.levelId)}, dopo ${playTime(g.playMs)}`;
    const fate = g.doomsday ? ', col doomsday' : '';
    const arrow = g.assisted ? ', freccia accesa' : '';
    return txt('div', 'cx-line', `${where}${fate}${arrow}.`);
}

/** un geco della stanza: pallino della pelle, nome, e chi è */
function gecoTag(c: Character | null, role: string, opts: { ready?: boolean } = {}): HTMLElement {
    const box = el('div', `cx-slot${c ? '' : ' empty'}${opts.ready ? ' ready' : ''}`);
    const dot = el('i', 'cx-dot');
    if (c) dot.style.background = skinFinalCss(skinPreset(c.skin));
    const words = el('div', 'cx-words');
    if (c) words.append(txt('span', 'cx-name', c.name.toLowerCase()));
    words.append(txt('span', 'cx-role', role));
    box.append(dot, words);
    return box;
}

export class CoopScreens {
    private readonly ui: Screens;
    private readonly host: CoopUiHost;
    private readonly kind = roomKind();
    private off: (() => void) | null = null;

    constructor(ui: Screens, host: CoopUiHost) {
        this.ui = ui;
        this.host = host;
    }

    /** si entra nel capitolo: da qui la chiusura della stanza la gestisce il gioco, non queste pagine */
    detach(): void {
        this.stopListening();
    }

    private stopListening(): void {
        this.off?.();
        this.off = null;
    }

    private hasHostedGame(): boolean {
        return localStorage.getItem(COOP_SAVE_KEY) !== null && !!readMeta();
    }

    /** la porta del multiplayer dal titolo */
    show(note?: string): void {
        this.stopListening();
        const s = this.ui.openOverlay('screen sx menu-screen');
        const page = el('div', 'sx-page');
        page.append(el('div', 'sx-kick', 'due gechi, un realm'));
        page.append(...this.ui.heading('multiplayer', 'uno crea la partita, l’altro entra col codice.'));
        page.append(this.ui.menu([
            { label: 'crea partita', onPick: () => this.showHostChoice() },
            { label: 'entra con un codice', onPick: () => this.showJoin() },
            { label: 'indietro', back: true, onPick: () => this.host.backToTitle() },
        ]));
        if (note) page.append(this.noteEl(note));
        s.append(page);
        this.ui.bindNav(page, () => this.host.backToTitle());
    }

    private noteEl(text: string): HTMLElement {
        const n = el('div', 'sx-note cx-warn');
        n.textContent = text;
        return n;
    }

    /* ---------- chi crea ---------- */

    private showHostChoice(): void {
        if (!this.hasHostedGame()) {
            this.newHostedGame();
            return;
        }
        // la partita multiplayer salvata si legge senza toccare quella da solo
        state.useSlot('coop');
        const save = state.save;
        state.useSlot('single');
        const s = this.ui.openOverlay('screen sx menu-screen');
        const page = el('div', 'sx-page');
        page.append(el('div', 'sx-kick', 'multiplayer'));
        page.append(...this.ui.heading('la tua partita'));
        const sub = `${chapterLabel(save.levelId)}, ${playTime(save.record.playMs)}${save.doomsdayMode ? ', doomsday' : ''}`;
        page.append(this.ui.menu([
            { label: 'continua', sub, onPick: () => this.continueHostedGame() },
            { label: 'nuova partita', danger: true, onPick: () => this.confirmNew() },
            { label: 'indietro', back: true, onPick: () => this.show() },
        ]));
        s.append(page);
        this.ui.bindNav(page, () => this.show());
    }

    private confirmNew(): void {
        const s = this.ui.openOverlay('screen sx menu-screen');
        const page = el('div', 'sx-page');
        page.append(...this.ui.heading('nuova partita', 'la partita multiplayer salvata andrà perduta. il tuo viaggio da solo resta com’è.'));
        page.append(this.ui.menu([
            { label: 'ricomincia', danger: true, onPick: () => this.newHostedGame() },
            { label: 'indietro', back: true, onPick: () => this.showHostChoice() },
        ]));
        s.append(page);
        this.ui.bindNav(page, () => this.showHostChoice());
    }

    private newHostedGame(): void {
        this.ui.forge({
            back: () => this.show(),
            backLabel: 'indietro',
            kick: 'multiplayer · il tuo geco',
            kick2: 'multiplayer · allocazione del flusso',
            fate: true,
            doneLabel: 'apri la stanza',
            onDone: (r) => {
                // la partita multiplayer nasce nel suo salvataggio: il viaggio da solo resta dov'è
                state.useSlot('coop');
                state.reset();
                state.save.playerName = r.name;
                state.save.skin = r.skin;
                state.save.stats = { ...r.stats };
                state.save.doomsdayMode = r.doomsday;
                state.save.doomsday = 0;
                state.save.assisted = state.settings.guide;
                state.persist();
                state.flushPersist(true);
                state.resetRun();
                this.openLobby(true);
            },
        });
    }

    private continueHostedGame(): void {
        state.useSlot('coop');
        this.openLobby(false);
    }

    /** la stanza aperta: il codice da dare, chi c'è, e il via */
    private openLobby(fresh: boolean): void {
        this.stopListening();
        const s = this.ui.openOverlay('screen sx menu-screen cx-lobby');
        const page = el('div', 'sx-page');
        page.append(el('div', 'sx-kick', fresh ? 'partita nuova' : 'multiplayer'));
        page.append(...this.ui.heading('la stanza'));

        const codeBox = el('button', 'cx-code');
        codeBox.dataset.nav = '1';
        codeBox.textContent = '· · · · ·';
        codeBox.title = 'copia il codice';
        const codeNote = txt('div', 'cx-code-note', 'apro la stanza…');
        page.append(codeBox, codeNote);
        page.append(gameLine({ fresh, levelId: state.save.levelId, playMs: state.save.record.playMs, doomsday: state.save.doomsdayMode, assisted: state.save.assisted }));

        const party = el('div', 'cx-party');
        page.append(party);
        const status = el('div', 'sx-note cx-status');
        page.append(status);

        let code = '';
        const menu = el('div', 'cx-actions');
        page.append(menu);
        const paint = () => {
            const partner = coop.partner;
            const entering = !partner && !!coop.session?.open;
            party.replaceChildren(
                gecoTag(characterOf(state.save), 'tu'),
                gecoTag(partner, partner ? 'pronto' : entering ? 'sta entrando…' : 'in attesa…', { ready: !!partner }),
            );
            // da soli si può partire: chi ha il codice entra anche a capitolo iniziato
            menu.replaceChildren(this.ui.menu([
                { label: partner ? 'inizia' : 'inizia da solo', onPick: () => {
                    if (!code) return;
                    this.stopListening();
                    this.host.startHosted(fresh);
                } },
                { label: 'chiudi la stanza', back: true, onPick: () => this.leaveLobby() },
            ]));
        };
        paint();
        s.append(page);
        this.ui.bindNav(page, () => this.leaveLobby());

        const copy = () => {
            if (!code) return;
            sfx.ui();
            void navigator.clipboard?.writeText(code).then(
                () => { codeNote.textContent = 'copiato. mandalo a chi gioca con te.'; },
                () => { codeNote.textContent = 'copialo a mano: il browser non lascia.'; },
            );
        };
        codeBox.addEventListener('click', copy);

        let lastPartner: string | null = null;
        this.off = coop.listen((e) => {
            if (e.type === 'partner') {
                if (e.char) status.textContent = '';
                else if (lastPartner) status.textContent = `${lastPartner} è uscito dalla stanza.`;
                lastPartner = e.char?.name.toLowerCase() ?? null;
                paint();
            } else if (e.type === 'room-lost') {
                status.textContent = 'la stanza non accetta più ingressi. chiudila e riaprila.';
            }
        });
        const kind = this.kind;
        coop.host(kind, fresh).then(
            (c) => {
                code = c;
                codeBox.textContent = c.split('').join(' ');
                codeNote.textContent = kind === 'locale' ? 'stanza tra schede: entra dall’altra scheda.' : 'clic per copiarlo';
            },
            (err: unknown) => {
                if (err instanceof Error && err.message === 'annullato') return;
                codeBox.textContent = '— — —';
                codeNote.textContent = err instanceof RoomError ? `${err.message}. controlla la connessione e riprova.` : 'la stanza non si apre. riprova tra poco.';
            },
        );
    }

    private leaveLobby(): void {
        this.stopListening();
        coop.end(null, false);
        state.useSlot('single');
        this.show();
    }

    /* ---------- chi entra ---------- */

    private showJoin(prefill = '', error = ''): void {
        this.stopListening();
        const s = this.ui.openOverlay('screen sx menu-screen cx-lobby');
        const page = el('div', 'sx-page');
        page.append(el('div', 'sx-kick', 'multiplayer'));
        page.append(...this.ui.heading('il codice'));
        const input = el('input', 'sx-name-input cx-code-input');
        input.type = 'text';
        input.maxLength = CODE_LENGTH + 4;
        input.placeholder = '·····';
        input.spellcheck = false;
        input.autocomplete = 'off';
        input.setAttribute('aria-label', 'codice della stanza');
        input.value = prefill;
        page.append(input);
        const status = el('div', 'sx-note cx-status');
        if (error) {
            status.classList.add('cx-warn');
            status.textContent = error;
        }
        page.append(status);
        let busy = false;
        const go = () => {
            if (busy) return;
            const code = normalizeCode(input.value);
            if (!code) {
                status.classList.add('cx-warn');
                status.textContent = `servono ${CODE_LENGTH} caratteri, senza 0, 1, o, i, l.`;
                return;
            }
            busy = true;
            status.classList.remove('cx-warn');
            status.textContent = 'busso alla porta…';
            coop.join(this.kind, code).then(
                (info) => this.showGuestWelcome(info),
                (err: unknown) => {
                    busy = false;
                    if (err instanceof Error && err.message === 'annullato') return;
                    this.showJoin(code, err instanceof Error ? err.message : 'non riesco a entrare');
                },
            );
        };
        input.addEventListener('keydown', (e) => {
            if (e.code === 'Enter') {
                e.preventDefault();
                sfx.menuSelect();
                go();
            }
        });
        // il codice intero basta, senza invio: quello appena rifiutato si riprova solo a richiesta
        const refused = error ? prefill : '';
        input.addEventListener('input', () => {
            const code = normalizeCode(input.value);
            if (code && code !== refused) go();
        });
        page.append(this.ui.menu([
            { label: 'entra', onPick: go },
            { label: 'indietro', back: true, onPick: () => { coop.end(null, false); this.show(); } },
        ]));
        s.append(page);
        this.ui.bindNav(page, () => { coop.end(null, false); this.show(); });
        setTimeout(() => input.focus(), 120);
    }

    /** chi ha creato, com'è la partita, e con chi entri */
    private showGuestWelcome(info: GameInfo): void {
        this.stopListening();
        const s = this.ui.openOverlay('screen sx menu-screen cx-lobby');
        const page = el('div', 'sx-page');
        page.append(el('div', 'sx-kick', 'sei nella stanza'));
        // info arriva già ripulito dal runtime
        const host = info.host;
        page.append(...this.ui.heading(`la partita di ${host.name.toLowerCase()}`));
        page.append(gameLine(info));
        const known = rememberedCharacter(info.gameId);
        const party = el('div', 'cx-party');
        party.append(gecoTag(host, 'crea'), gecoTag(known, known ? 'tu, l’ultima volta' : 'tu'));
        page.append(party);
        const forgeNew = () => this.guestForge(info, known ?? undefined);
        const items: MenuItem[] = known
            ? [
                { label: `entra come ${known.name.toLowerCase()}`, onPick: () => this.guestReady(known) },
                { label: 'forgia un altro geco', onPick: forgeNew },
            ]
            : [{ label: 'forgia il tuo geco', onPick: forgeNew }];
        items.push({ label: 'esci', back: true, onPick: () => this.leaveAsGuest() });
        page.append(this.ui.menu(items));
        s.append(page);
        this.ui.bindNav(page, () => this.leaveAsGuest());
        this.watchGuest();
    }

    private guestForge(info: GameInfo, initial?: Character): void {
        const host = info.host.name.toLowerCase();
        this.ui.forge({
            back: () => this.showGuestWelcome(info),
            backLabel: 'indietro',
            initial,
            kick: `partita di ${host} · il tuo geco`,
            kick2: `partita di ${host} · allocazione del flusso`,
            note: info.doomsday ? `${host} ha scelto il doomsday: il tempo vero scorre anche per te.` : undefined,
            fate: false,
            doneLabel: 'entra nella partita',
            onDone: (r) => this.guestReady({ name: r.name, stats: r.stats, skin: r.skin }),
        });
        this.watchGuest();
    }

    private guestReady(c: Character): void {
        coop.sendCharacter(c);
        this.stopListening();
        const s = this.ui.openOverlay('screen sx menu-screen cx-lobby');
        const page = el('div', 'sx-page');
        page.append(el('div', 'sx-kick', 'sei nella stanza'));
        const name = coop.partner?.name.toLowerCase() ?? 'l’host';
        page.append(...this.ui.heading(coop.info?.playing ? 'entri nel capitolo…' : `aspetti ${name}`));
        const party = el('div', 'cx-party');
        party.append(gecoTag(coop.partner, 'crea'), gecoTag(c, 'tu, pronto', { ready: true }));
        page.append(party);
        page.append(this.ui.menu([{ label: 'esci', back: true, onPick: () => this.leaveAsGuest() }]));
        s.append(page);
        this.ui.bindNav(page, () => this.leaveAsGuest());
        this.watchGuest();
    }

    /** la stanza può chiudersi mentre si forgia o si aspetta */
    private watchGuest(): void {
        this.stopListening();
        this.off = coop.listen((e) => {
            if (e.type === 'closed') {
                this.stopListening();
                this.show(e.reason);
            }
        });
    }

    private leaveAsGuest(): void {
        this.stopListening();
        coop.end(null, false);
        this.show();
    }
}
