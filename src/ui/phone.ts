import { ZONE_CSS } from '../config';
import { TOTAL_NOTES, TOTAL_PAGES } from '../content/arcs';
import { codexSections } from '../content/codex';
import { DIALOGUES } from '../content/story';
import { ITEMS, NOTCH_PRICES, BASE_NOTCHES, type ItemDef } from '../content/items';
import { LEVELS, LEVEL_ORDER, TOTAL_FRAGMENTS } from '../content/levels';
import { CONTACTS, OBJECTIVES, POSTS, RADIO, type Contact } from '../content/phone';
import { ABILITY_CARDS } from '../content/story';
import { deletePhoto, listPhotos, PHOTO_FILTERS, processPhoto, savePhoto, type PhotoFilter } from './photos';
import { bus } from '../engine/events';
import { useItem } from '../engine/inventory';
import { music } from '../engine/music';
import { sfx } from '../engine/sfx';
import { state } from '../engine/state';
import { regionView } from '../engine/regionView';
import { realmClock } from '../engine/Atmosphere';
import { buildTrophyCabinet } from './trophies';
import { assistToggle } from './assist';
import { QUESTS } from '../content/quests';
import { TOTAL_MASCHERE } from '../scenes/GameScene';
import type { ZoneColor } from '../types';
import './phone.css';
import { el, ui } from './dom';

/* il wavesung galaxy: TAB lo tira fuori dalla tasca. il gioco si ferma,
   come quando guardi il telefono a cena e il mondo aspetta */

export interface PhoneHost {
    pause(): void;
    resume(): void;
    /** il telefono si apre solo in gioco, senza menu o dialoghi aperti */
    canOpen(): boolean;
    /** scatto del canvas di gioco, o null se l'obiettivo è tappato */
    snapshot(): Promise<string | null>;
}

type AppId = 'messaggi' | 'wavegram' | 'fotocamera' | 'galleria' | 'mappa' | 'zaino' | 'amuleti' | 'wavezon' | 'diario' | 'codex' | 'radio' | 'trofei' | 'profilo' | 'impostazioni';

interface AppDef {
    id: AppId;
    name: string;
    icon: string;
    tint: ZoneColor;
    title: string;
    sub: string;
}

const APPS: AppDef[] = [
    { id: 'messaggi', name: 'messaggi', icon: '💬', tint: 'blue', title: 'MESSAGGI', sub: 'tutti ti scrivono, nessuno ti chiede come stai' },
    { id: 'wavegram', name: 'wavegram', icon: '📸', tint: 'purple', title: 'WAVEGRAM', sub: 'il realm che collassa, ma con i filtri' },
    { id: 'fotocamera', name: 'fotocamera', icon: '📷', tint: 'red', title: 'FOTOCAMERA', sub: 'il realm in posa, poi in cornice' },
    { id: 'galleria', name: 'galleria', icon: '🖼️', tint: 'yellow', title: 'GALLERIA', sub: 'scatti dal realm, da portare via' },
    { id: 'mappa', name: 'mappa', icon: '🗺️', tint: 'green', title: 'MAPPA', sub: 'tu sei qui. purtroppo.' },
    { id: 'zaino', name: 'zaino', icon: '🎒', tint: 'orange', title: 'ZAINO', sub: 'tutto quello che un geco può portare' },
    { id: 'amuleti', name: 'amuleti', icon: '🔮', tint: 'purple', title: 'AMULETI', sub: 'si cambiano solo vicino a un microfono' },
    { id: 'wavezon', name: 'wavezon', icon: '📦', tint: 'yellow', title: 'WAVEZON', sub: 'consegna in giornata, anche nel void' },
    { id: 'diario', name: 'diario', icon: '📓', tint: 'red', title: 'DIARIO', sub: 'cose da fare prima che il realm finisca' },
    { id: 'codex', name: 'codex', icon: '📖', tint: 'cyan', title: 'CODEX', sub: 'note, pagine, misteri: rileggili in ordine' },
    { id: 'radio', name: 'radio', icon: '📻', tint: 'yellow', title: 'RADIO', sub: 'radio gecowave, l\'unica che non chiude' },
    { id: 'trofei', name: 'trofei', icon: '🏆', tint: 'yellow', title: 'TROFEI', sub: 'la gloria, ma in pixel' },
    { id: 'profilo', name: 'io', icon: '🦎', tint: 'green', title: 'IO', sub: 'il custode, in numeri' },
    { id: 'impostazioni', name: 'impostazioni', icon: '⚙️', tint: 'cyan', title: 'IMPOSTAZIONI', sub: 'per chi vuole il realm più basso' },
];

/** le app fisse nel dock in basso */
const DOCK: AppId[] = ['messaggi', 'mappa', 'zaino', 'trofei'];

/** i capitoli che hanno un dipinto loro: lo sfondo della home è il posto dove sei */
const PAINTED = new Set(['bus', 'cantina', 'caso', 'galliate', 'marcetti', 'mente', 'nucleo', 'ricordi', 'rio', 'ruhra', 'santuario', 'sorveglianza', 'stabilimento', 'tana', 'tecnokill', 'trenbolone']);

function wallpaperFor(levelId: string): string {
    return PAINTED.has(levelId) ? `assets/backgrounds/${levelId}.png` : 'assets/background.png';
}

const SHOP_STOCK = ['crocchetta', 'rubinetto', 'energetico', 'caffe-mensa', 'panino-nonna', 'santino', 'scarpe-markolino', 'rosario-riba', 'geco-portafortuna'];

const CRACK_SVG = `<svg class="phone-crack" viewBox="0 0 356 736" preserveAspectRatio="none" aria-hidden="true">
<path d="M356 70 L300 110 L318 160 L262 214 L276 250 M300 110 L248 98 L210 132 M318 160 L356 176 M262 214 L214 236" fill="none" stroke="#fff" stroke-width="1.2"/>
<path d="M300 110 L292 128 L310 140" fill="none" stroke="#fff" stroke-width="0.7"/>
</svg>`;

function since(at: number): string {
    const s = Math.floor((Date.now() - at) / 1000);
    if (s < 60) return 'ora';
    if (s < 3600) return `${Math.floor(s / 60)} min`;
    if (s < 86400) return `${Math.floor(s / 3600)} h`;
    return `${Math.floor(s / 86400)} g`;
}

function text(tag: keyof HTMLElementTagNameMap, cls: string, value: string): HTMLElement {
    const node = el(tag, cls);
    node.textContent = value;
    return node;
}

function contactFor(sender: string): Contact | undefined {
    return CONTACTS.find((c) => c.name === sender || c.id === sender);
}

export class Phone {
    private host: PhoneHost;
    private root: HTMLElement | null = null;
    private screen: HTMLElement | null = null;
    private view: HTMLElement | null = null;
    private body: HTMLElement | null = null;
    /** da dove si è aperta l'app: l'animazione parte dall'icona */
    private origin: { x: number; y: number } | null = null;
    private hint: HTMLElement;
    private app: AppId | null = null;
    private stack: (() => void)[] = [];
    private liked = new Set<number>();
    private clock: number | null = null;
    private keyHandler = (e: KeyboardEvent) => this.onKey(e);

    constructor(host: PhoneHost) {
        this.host = host;
        this.hint = el('button', 'phone-hint sticker glass-acid-blue');
        this.hint.addEventListener('click', () => this.toggle());
        this.renderHint();

        bus.on('wavesung', ({ sender, text: body }) => {
            state.pushMessage(sender, body);
            this.renderHint();
            if (this.app === 'messaggi') this.refresh();
        });
        bus.on('inventory-changed', () => this.refresh());
        bus.on('barre-changed', () => {
            if (this.app === 'wavezon') this.refresh();
        });
        window.addEventListener('keydown', this.keyHandler, true);
    }

    /** la chip del telefono vive nell'hud */
    get hintElement(): HTMLElement {
        return this.hint;
    }

    get isOpen(): boolean {
        return this.root !== null;
    }

    toggle(): void {
        if (this.isOpen) this.close();
        else this.open();
    }

    open(app?: AppId): void {
        if (this.isOpen || !this.host.canOpen()) return;
        this.host.pause();
        sfx.init();
        sfx.ui();
        const scrim = el('div', 'phone-scrim');
        scrim.addEventListener('click', () => this.close());
        const phone = el('div', 'phone');
        phone.setAttribute('role', 'dialog');
        phone.setAttribute('aria-label', 'telefono');
        const screen = el('div', 'phone-screen', CRACK_SVG);

        // status bar: l'ora è quella del realm, l'operatore è la zona, la batteria è il flow
        const status = el('div', 'phone-status');
        const left = el('span', 'left');
        const time = text('span', 'time', '');
        const level = LEVELS[state.save.levelId];
        left.append(time, text('span', 'carrier', level ? level.accentWord : 'gecowave 5g'));
        const right = el('span', 'right');
        const battery = el('span', 'battery');
        right.append(el('span', 'bars', '<i></i><i></i><i></i><i></i>'), battery);
        status.append(left, el('span', 'island'), right);

        const view = el('div', 'phone-view');
        const bar = el('button', 'phone-home-bar', '<span></span>');
        bar.setAttribute('aria-label', 'home');
        bar.addEventListener('click', () => this.home());
        screen.append(view, status, bar);
        phone.append(screen);

        const wrap = el('div');
        wrap.style.cssText = 'position:absolute;inset:0;z-index:50;';
        wrap.append(scrim, phone);
        ui().append(wrap);
        this.root = wrap;
        this.screen = screen;
        this.view = view;

        const tick = () => {
            time.textContent = realmClock();
            const lv = Math.round((state.run.flow / Math.max(1, state.maxFlow)) * 100);
            battery.style.setProperty('--level', `${Math.max(8, lv)}%`);
            battery.classList.toggle('low', lv < 20);
        };
        tick();
        this.clock = window.setInterval(tick, 2000);

        if (app) this.openApp(app);
        else this.home();
    }

    close(): void {
        if (!this.root) return;
        const root = this.root;
        this.root = null;
        this.screen = null;
        this.view = null;
        this.body = null;
        this.app = null;
        this.stack = [];
        if (this.clock !== null) window.clearInterval(this.clock);
        this.clock = null;
        root.querySelector('.phone')?.classList.add('closing');
        sfx.ui();
        window.setTimeout(() => root.remove(), 260);
        this.renderHint();
        this.host.resume();
    }

    private onKey(e: KeyboardEvent): void {
        if (e.code === 'Tab' || (e.code === 'KeyP' && !this.isTyping(e))) {
            if (!this.isOpen && !this.host.canOpen()) return;
            e.preventDefault();
            e.stopImmediatePropagation();
            this.toggle();
            return;
        }
        if (!this.isOpen) return;
        if (e.code === 'Escape' || e.code === 'Backspace') {
            if (this.isTyping(e)) return;
            e.preventDefault();
            e.stopImmediatePropagation();
            this.back();
        }
    }

    private isTyping(e: KeyboardEvent): boolean {
        const t = e.target as HTMLElement | null;
        return t?.tagName === 'INPUT' && (t as HTMLInputElement).type === 'text';
    }

    private back(): void {
        const prev = this.stack.pop();
        if (prev) prev();
        else if (this.app) this.home();
        else this.close();
    }

    private renderHint(): void {
        const unread = state.unreadMessages;
        this.hint.replaceChildren();
        this.hint.append(text('span', '', '📱'), text('kbd', '', 'tab'));
        if (unread > 0) this.hint.append(text('span', 'unread', String(unread)));
    }

    private setTint(tint: ZoneColor | null): void {
        if (!this.screen) return;
        const css = tint ? ZONE_CSS[tint] : getComputedStyle(document.documentElement).getPropertyValue('--accent');
        this.screen.parentElement!.style.setProperty('--tint', css);
    }

    private refresh(): void {
        if (!this.isOpen) return;
        if (this.app) this.openApp(this.app, true);
    }

    /* ---------- home ---------- */

    private home(): void {
        if (!this.view) return;
        const fromApp = this.app !== null;
        this.app = null;
        this.stack = [];
        this.setTint(null);
        const v = this.view;
        v.className = `phone-view home${fromApp ? ' back' : ''}`;
        v.replaceChildren();
        const wall = el('div', 'home-wall');
        wall.style.backgroundImage = `url('${wallpaperFor(state.save.levelId)}')`;
        const b = el('div', 'phone-body home-body');
        this.body = b;
        v.append(wall, b);

        b.append(text('div', 'phone-clock', realmClock()));
        const level = LEVELS[state.save.levelId];
        b.append(text('div', 'phone-greet', level ? `${level.title.toLowerCase()} ${level.accentWord}` : 'segnale: gecowave 5g'));

        // il widget dell'obiettivo apre il diario
        const widget = el('button', 'home-widget');
        widget.append(
            text('span', 'w-kick', 'adesso'),
            text('span', 'w-waves', `✦ ${state.abilities.length}/${TOTAL_FRAGMENTS}`),
            text('span', 'w-text', OBJECTIVES[state.save.levelId] ?? 'vai avanti. il realm non si salva da solo.'),
        );
        widget.addEventListener('click', (e) => this.launch('diario', e.currentTarget as HTMLElement));
        b.append(widget);

        const grid = el('div', 'phone-grid');
        const dock = el('div', 'phone-dock');
        for (const app of APPS) (DOCK.includes(app.id) ? dock : grid).append(this.appIcon(app));
        b.append(grid, dock);
        (grid.firstElementChild as HTMLElement | null)?.focus();
    }

    private appIcon(app: AppDef): HTMLElement {
        const btn = el('button', 'phone-app');
        btn.setAttribute('aria-label', app.name);
        const icon = el('span', 'icon');
        icon.style.setProperty('--app', ZONE_CSS[app.tint]);
        icon.textContent = app.icon;
        const badge = this.badgeFor(app.id);
        if (badge > 0) icon.append(text('span', 'badge', String(badge)));
        btn.append(icon, text('span', '', app.name));
        btn.addEventListener('click', () => this.launch(app.id, icon));
        return btn;
    }

    /** apre un'app partendo dal punto toccato */
    private launch(id: AppId, from: HTMLElement): void {
        sfx.ui();
        const s = this.screen?.getBoundingClientRect();
        const r = from.getBoundingClientRect();
        this.origin = s ? { x: r.left + r.width / 2 - s.left, y: r.top + r.height / 2 - s.top } : null;
        this.openApp(id);
    }

    private badgeFor(id: AppId): number {
        if (id === 'messaggi') return state.unreadMessages;
        return 0;
    }

    private openApp(id: AppId, keepScroll = false): void {
        if (!this.view) return;
        const scroll = keepScroll && this.body ? this.body.scrollTop : 0;
        const fresh = this.app !== id;
        this.app = id;
        const def = APPS.find((a) => a.id === id)!;
        this.setTint(def.tint);
        const v = this.view;
        v.className = `phone-view app${fresh ? '' : ' still'}`;
        if (this.origin) {
            v.style.setProperty('--ox', `${this.origin.x}px`);
            v.style.setProperty('--oy', `${this.origin.y}px`);
        }
        this.origin = null;
        v.replaceChildren();
        const b = el('div', 'phone-body');
        this.body = b;
        v.append(b);
        const head = el('div', 'phone-head');
        const back = el('button', 'phone-back');
        back.append(text('b', '', '‹'), text('span', '', 'home'));
        back.addEventListener('click', () => {
            sfx.ui();
            this.home();
        });
        head.append(back, text('span', 'app-icon', def.icon));
        b.append(head, text('div', 'phone-title', def.title), text('div', 'phone-sub', def.sub));
        const content = el('div');
        b.append(content);
        switch (id) {
            case 'messaggi': this.renderMessages(content); break;
            case 'wavegram': this.renderWavegram(content); break;
            case 'fotocamera': this.renderCamera(content); break;
            case 'galleria': this.renderGallery(content); break;
            case 'zaino': this.renderInventory(content); break;
            case 'amuleti': this.renderCharms(content); break;
            case 'wavezon': this.renderShop(content); break;
            case 'mappa': this.renderMap(content); break;
            case 'diario': this.renderJournal(content); break;
            case 'codex': this.renderCodex(content); break;
            case 'radio': this.renderRadio(content); break;
            case 'trofei': buildTrophyCabinet(content); break;
            case 'profilo': this.renderProfile(content); break;
            case 'impostazioni': this.renderSettings(content); break;
        }
        b.scrollTop = scroll;
        if (!keepScroll) back.focus();
    }

    /* ---------- messaggi e chiamate ---------- */

    private renderMessages(root: HTMLElement, tab: 'chat' | 'rubrica' = 'chat'): void {
        root.replaceChildren();
        const tabs = el('div', 'phone-tabs');
        for (const t of ['chat', 'rubrica'] as const) {
            const btn = el('button', `phone-tab sticker ${t === tab ? 'active' : ''}`);
            btn.textContent = t;
            btn.addEventListener('click', () => this.renderMessages(root, t));
            tabs.append(btn);
        }
        root.append(tabs);

        if (tab === 'rubrica') {
            for (const c of CONTACTS) {
                const row = el('button', `phone-row glass-chip glass-acid-${c.color}`);
                row.append(text('span', 'lead', c.icon));
                const main = el('div', 'main');
                main.append(text('div', 'name', c.name), text('div', 'preview', 'tocca per chiamare'));
                row.append(main, text('span', 'meta', '📞'));
                row.addEventListener('click', () => this.call(root, c));
                root.append(row);
            }
            return;
        }

        const threads = new Map<string, { last: number; preview: string; unread: number }>();
        for (const m of state.save.messages) {
            const t = threads.get(m.sender) ?? { last: 0, preview: '', unread: 0 };
            t.last = m.at;
            t.preview = m.text;
            if (!m.read) t.unread++;
            threads.set(m.sender, t);
        }
        if (threads.size === 0) {
            root.append(text('div', 'phone-empty', 'nessun messaggio. il realm ti ignora, per ora.'));
            return;
        }
        const sorted = [...threads.entries()].sort((a, b) => b[1].last - a[1].last);
        for (const [sender, t] of sorted) {
            const contact = contactFor(sender);
            const row = el('button', `phone-row glass-chip glass-acid-${contact?.color ?? 'blue'}`);
            row.append(text('span', 'lead', contact?.icon ?? '📨'));
            const main = el('div', 'main');
            main.append(text('div', 'name', sender), text('div', 'preview', t.preview));
            row.append(main);
            if (t.unread) row.append(el('span', 'dot'));
            row.append(text('span', 'meta', since(t.last)));
            row.addEventListener('click', () => this.thread(root, sender));
            root.append(row);
        }
    }

    private thread(root: HTMLElement, sender: string): void {
        this.stack.push(() => this.openApp('messaggi'));
        root.replaceChildren();
        const contact = contactFor(sender);
        root.append(text('div', 'phone-section', `chat con ${sender}`));
        for (const m of state.save.messages) {
            if (m.sender !== sender) continue;
            m.read = true;
            const bubble = el('div', `bubble glass-chip glass-acid-${contact?.color ?? 'blue'}`);
            bubble.textContent = m.text;
            bubble.append(text('span', 'when', since(m.at)));
            root.append(bubble);
        }
        state.persist();
        this.renderHint();
        if (contact) {
            const call = el('button', 'phone-btn sticker glass-acid-green');
            call.textContent = 'chiama';
            call.style.transform = 'rotate(-1.5deg)';
            call.addEventListener('click', () => this.call(root, contact));
            root.append(call);
        }
        this.body?.scrollTo({ top: this.body.scrollHeight });
    }

    private call(root: HTMLElement, c: Contact): void {
        this.stack.push(() => this.openApp('messaggi'));
        sfx.ui();
        root.replaceChildren();
        const screen = el('div', 'call-screen');
        const avatar = el('div', `call-avatar sticker glass-acid-${c.color} call-ring`);
        avatar.textContent = c.icon;
        const stateLine = text('div', 'call-state', 'squilla…');
        screen.append(avatar, text('div', 'call-name', c.name.toUpperCase()), stateLine);
        const hang = el('button', 'phone-btn sticker glass-acid-red');
        hang.textContent = 'riattacca';
        hang.addEventListener('click', () => this.back());
        screen.append(hang);
        root.append(screen);
        hang.focus();
        window.setTimeout(() => {
            if (!avatar.isConnected) return;
            avatar.classList.remove('call-ring');
            stateLine.textContent = 'in chiamata';
            const reply = el('div', `bubble glass-chip glass-acid-${c.color}`);
            reply.textContent = c.call({
                levelId: state.save.levelId,
                flags: state.save.flags,
                barre: state.save.barre,
                abilities: state.abilities.length,
            });
            reply.style.textAlign = 'left';
            screen.insertBefore(reply, hang);
            sfx.pickup();
        }, 1100);
    }

    /* ---------- wavegram ---------- */

    private renderWavegram(root: HTMLElement): void {
        const visible = POSTS.map((p, i) => ({ p, i })).filter(({ p }) => !p.needs || state.hasFlag(p.needs)).reverse();
        for (const { p, i } of visible) {
            const post = el('article', `post glass-chip glass-acid-${p.color}`);
            const who = el('div', 'who');
            const author = text('span', 'author', p.author);
            author.style.color = ZONE_CSS[p.color];
            who.append(author, text('span', 'handle', p.handle));
            const like = el('button', `like ${this.liked.has(i) ? 'on' : ''}`);
            const paint = () => {
                like.textContent = `${this.liked.has(i) ? '♥' : '♡'} ${p.likes + (this.liked.has(i) ? 1 : 0)}`;
                like.classList.toggle('on', this.liked.has(i));
            };
            paint();
            like.addEventListener('click', () => {
                if (this.liked.has(i)) this.liked.delete(i);
                else this.liked.add(i);
                sfx.ui();
                paint();
            });
            post.append(who, text('p', '', p.text), like);
            root.append(post);
        }
        root.append(text('div', 'phone-empty', 'vai avanti nel realm: la gente posta di più quando succede qualcosa.'));
    }

    /* ---------- fotocamera e galleria ---------- */

    private photoDraft: { img: HTMLImageElement; filter: PhotoFilter; letterbox: boolean; caption: string } | null = null;
    private galleryOpen: string | null = null;

    private renderCamera(root: HTMLElement): void {
        root.replaceChildren();
        const draft = this.photoDraft;
        if (!draft) {
            const vf = el('div', 'vf');
            vf.append(el('div', 'vf-cross'));
            vf.append(text('div', 'vf-hint', 'l\u2019obiettivo vede quello che vedi tu. il realm resta fermo in posa.'));
            const note = el('div', 'phone-note');
            const shoot = el('button', 'cam-shoot', 'scatta');
            shoot.type = 'button';
            shoot.addEventListener('click', async () => {
                shoot.textContent = '···';
                const src = await this.host.snapshot();
                if (!src) {
                    shoot.textContent = 'scatta';
                    note.textContent = 'obiettivo tappato. riprova.';
                    note.className = 'phone-note bad';
                    return;
                }
                const img = new Image();
                img.onload = () => {
                    const lv = LEVELS[state.save.levelId];
                    this.photoDraft = { img, filter: 'naturale', letterbox: true, caption: lv ? `${lv.title.toLowerCase()} ${lv.accentWord}` : '' };
                    this.renderCamera(root);
                };
                img.onerror = () => {
                    shoot.textContent = 'scatta';
                    note.textContent = 'obiettivo tappato. riprova.';
                    note.className = 'phone-note bad';
                };
                img.src = src;
            });
            root.append(vf, shoot, note);
            return;
        }

        const develop = () => processPhoto(draft.img, { filter: draft.filter, letterbox: draft.letterbox, caption: draft.caption });
        const preview = el('img', 'cam-preview');
        preview.alt = 'anteprima dello scatto';
        preview.src = develop();

        const filters = el('div', 'cam-filters');
        const paintFilters = () => {
            filters.replaceChildren();
            for (const f of PHOTO_FILTERS) {
                const b = el('button', `cam-filter${f.id === draft.filter ? ' on' : ''}`);
                b.textContent = f.name;
                b.addEventListener('click', () => {
                    draft.filter = f.id;
                    sfx.ui();
                    preview.src = develop();
                    paintFilters();
                });
                filters.append(b);
            }
        };
        paintFilters();

        const frameRow = el('div', 'cam-row');
        frameRow.append(text('span', 'cam-label', 'mascherino'));
        const frameBtn = el('button', 'cam-toggle');
        const paintFrame = () => {
            frameBtn.textContent = `‹ ${draft.letterbox ? 'cinema' : 'pieno'} ›`;
        };
        paintFrame();
        frameBtn.addEventListener('click', () => {
            draft.letterbox = !draft.letterbox;
            sfx.ui();
            preview.src = develop();
            paintFrame();
        });
        frameRow.append(frameBtn);

        const caption = el('input', 'cam-caption');
        caption.type = 'text';
        caption.maxLength = 60;
        caption.placeholder = 'didascalia…';
        caption.value = draft.caption;
        caption.setAttribute('aria-label', 'didascalia della foto');
        caption.addEventListener('input', () => {
            draft.caption = caption.value;
        });
        caption.addEventListener('keydown', (e) => e.stopPropagation());

        const actions = el('div', 'cam-actions');
        const actNote = el('div', 'phone-note');
        const save = el('button', 'btn-gold', 'salva in galleria');
        save.type = 'button';
        save.addEventListener('click', () => {
            const url = develop();
            const done = savePhoto({ levelId: state.save.levelId, filter: draft.filter, caption: draft.caption, dataUrl: url });
            if (!done) {
                // rullino bloccato: lo scatto si scarica subito, non si perde
                const dl = document.createElement('a');
                dl.href = url;
                dl.download = `gecowave-${Date.now().toString(36)}.jpg`;
                dl.click();
                actNote.textContent = 'rullino bloccato: scatto scaricato al volo.';
                actNote.className = 'phone-note bad';
                sfx.ui();
                return;
            }
            sfx.unlock();
            this.photoDraft = null;
            this.galleryOpen = done.id;
            this.openApp('galleria');
        });
        const trash = el('button', 'btn-ghost', 'butta');
        trash.type = 'button';
        trash.addEventListener('click', () => {
            sfx.ui();
            this.photoDraft = null;
            this.renderCamera(root);
        });
        actions.append(save, trash);
        root.append(preview, filters, frameRow, caption, actions, actNote);
    }

    private renderGallery(root: HTMLElement): void {
        root.replaceChildren();
        const photos = listPhotos();
        const openId = this.galleryOpen;
        this.galleryOpen = null;
        if (!photos.length) {
            root.append(text('div', 'phone-empty', 'rullino vuoto. scatta dalla fotocamera: il realm posa sempre.'));
            return;
        }
        const open = openId ? photos.find((p) => p.id === openId) ?? photos[0] : null;
        if (open) {
            const view = el('div', 'ph-viewer');
            const img = el('img', 'ph-photo');
            img.src = open.dataUrl;
            img.alt = open.caption || 'scatto dal realm';
            view.append(img);
            if (open.caption) view.append(text('div', 'ph-caption', open.caption));
            view.append(text('div', 'ph-meta', `${since(open.at)} · ${open.filter}`));
            const actions = el('div', 'ph-actions');
            const dl = el('a', 'btn-gold');
            dl.textContent = 'scarica';
            dl.href = open.dataUrl;
            dl.download = `gecowave-${open.id}.jpg`;
            const del = el('button', 'btn-ghost', 'strappa');
            del.type = 'button';
            del.addEventListener('click', () => {
                deletePhoto(open.id);
                sfx.ui();
                this.renderGallery(root);
            });
            const close = el('button', 'btn-ghost', 'chiudi');
            close.type = 'button';
            close.addEventListener('click', () => {
                sfx.ui();
                this.renderGallery(root);
            });
            actions.append(dl, del, close);
            view.append(actions);
            root.append(view);
            return;
        }
        const grid = el('div', 'ph-grid');
        for (const p of photos) {
            const b = el('button', 'ph-thumb');
            const img = el('img');
            img.src = p.dataUrl;
            img.alt = p.caption || 'scatto dal realm';
            img.loading = 'lazy';
            b.append(img);
            b.addEventListener('click', () => {
                sfx.ui();
                this.galleryOpen = p.id;
                this.renderGallery(root);
            });
            grid.append(b);
        }
        root.append(grid);
    }

    /* ---------- zaino ---------- */

    private renderInventory(root: HTMLElement, selected?: string): void {
        root.replaceChildren();
        const consumables = Object.entries(state.save.inventory).filter(([id, n]) => n > 0 && ITEMS[id]);
        const keys = Object.values(ITEMS).filter((it) => it.kind === 'chiave' && it.flag && state.hasFlag(it.flag));

        root.append(text('div', 'phone-section', 'da usare'));
        if (consumables.length === 0) {
            root.append(text('div', 'phone-note', 'zaino vuoto. wavezon consegna ovunque.'));
        } else {
            const grid = el('div', 'slot-grid');
            for (const [id, n] of consumables) grid.append(this.slot(ITEMS[id], n, id === selected, () => this.renderInventory(root, id)));
            root.append(grid);
        }

        if (keys.length) {
            root.append(text('div', 'phone-section', 'oggetti chiave'));
            const grid = el('div', 'slot-grid');
            for (const it of keys) grid.append(this.slot(it, 0, it.id === selected, () => this.renderInventory(root, it.id)));
            root.append(grid);
        }

        root.append(text('div', 'phone-section', 'collezione'));
        const lore = state.save.collectedLore;
        const lines: [string, string][] = [
            ['maschere del primo custode', `${lore.filter((k) => k.startsWith('maschera-')).length}/${TOTAL_MASCHERE}`],
            ['cuori del realm', String(lore.filter((k) => k.startsWith('cuore-')).length)],
            ['pagine di lore', String(lore.filter((k) => !k.startsWith('mic-') && !k.startsWith('maschera-') && !k.startsWith('cuore-') && !k.startsWith('item-') && !k.startsWith('charm-')).length)],
        ];
        for (const [k, v] of lines) {
            const line = el('div', 'stat-line');
            line.append(text('span', '', k), text('b', '', v));
            root.append(line);
        }

        if (selected && ITEMS[selected]) {
            const it = ITEMS[selected];
            const detail = this.detail(it);
            if (it.kind === 'consumabile') {
                const actions = el('div', 'actions');
                const use = el('button', 'phone-btn sticker glass-acid-green');
                use.textContent = 'usa';
                const note = el('span', 'phone-note');
                use.addEventListener('click', () => {
                    const res = useItem(it.id);
                    note.textContent = res.text;
                    note.className = `phone-note ${res.ok ? 'good' : 'bad'}`;
                    if (res.ok) window.setTimeout(() => this.renderInventory(root, state.count(it.id) > 0 ? it.id : undefined), 700);
                });
                actions.append(use, note);
                detail.append(actions);
            }
            root.append(detail);
            detail.scrollIntoView({ block: 'nearest' });
        }
    }

    private slot(it: ItemDef, qty: number, selected: boolean, onPick: () => void): HTMLElement {
        const s = el('button', `slot glass-chip glass-acid-orange ${selected ? 'selected' : ''}`);
        s.setAttribute('aria-label', it.name);
        s.textContent = it.icon;
        if (qty > 1) s.append(text('span', 'qty', `×${qty}`));
        s.addEventListener('click', () => {
            sfx.ui();
            onPick();
        });
        return s;
    }

    private detail(it: ItemDef): HTMLElement {
        const d = el('div', 'detail glass-panel');
        d.append(text('div', 'name', `${it.icon} ${it.name}`), text('p', '', it.desc));
        if (it.punch) d.append(text('div', 'punch', it.punch));
        return d;
    }

    /* ---------- amuleti ---------- */

    private renderCharms(root: HTMLElement, selected?: string, message?: { text: string; ok: boolean }): void {
        root.replaceChildren();
        const notches = el('div', 'notches');
        const used = state.usedNotches;
        for (let i = 0; i < state.save.notches; i++) {
            const n = el('i');
            if (i < used) n.className = 'used';
            notches.append(n);
        }
        root.append(text('div', 'phone-section', `tacche ${used}/${state.save.notches}`), notches);
        root.append(text('div', `phone-note ${state.run.nearMic ? 'good' : ''}`,
            state.run.nearMic ? 'sei vicino a un microfono: puoi cambiarli.' : 'trova un microfono per cambiarli. intanto puoi guardarli.'));

        const owned = state.save.charms.map((id) => ITEMS[id]).filter(Boolean);
        if (owned.length === 0) {
            root.append(text('div', 'phone-empty', 'nessun amuleto. i boss li lasciano cadere, wavezon li vende.'));
            return;
        }
        const grid = el('div', 'slot-grid');
        for (const it of owned) {
            const s = el('button', `slot glass-chip glass-acid-purple ${it.id === selected ? 'selected' : ''} ${state.isEquipped(it.id) ? 'equipped' : ''}`);
            s.setAttribute('aria-label', it.name);
            s.textContent = it.icon;
            const pips = el('span', 'pips');
            for (let i = 0; i < (it.cost ?? 0); i++) pips.append(el('i'));
            s.append(pips);
            s.addEventListener('click', () => {
                sfx.ui();
                this.renderCharms(root, it.id);
            });
            grid.append(s);
        }
        root.append(grid);

        if (selected && ITEMS[selected]) {
            const it = ITEMS[selected];
            const d = this.detail(it);
            d.append(text('div', 'punch', `costo: ${it.cost} ${it.cost === 1 ? 'tacca' : 'tacche'}`));
            const actions = el('div', 'actions');
            const toggle = el('button', 'phone-btn sticker glass-acid-purple');
            toggle.textContent = state.isEquipped(it.id) ? 'togli' : 'indossa';
            toggle.addEventListener('click', () => {
                const err = state.toggleCharm(it.id);
                if (!err) {
                    sfx.checkpoint();
                    bus.emit('hp-changed', { hp: state.run.hp, maxHp: state.maxHp, hurt: false });
                }
                this.renderCharms(root, it.id, err ? { text: err, ok: false } : { text: state.isEquipped(it.id) ? 'indossato.' : 'tolto.', ok: true });
            });
            actions.append(toggle);
            if (message) actions.append(text('span', `phone-note ${message.ok ? 'good' : 'bad'}`, message.text));
            d.append(actions);
            root.append(d);
            d.scrollIntoView({ block: 'nearest' });
        }
    }

    /* ---------- wavezon ---------- */

    private renderShop(root: HTMLElement, message?: { text: string; ok: boolean }): void {
        root.replaceChildren();
        root.append(text('div', 'wallet sticker glass-acid-yellow', `♪ ${state.save.barre} barre`));
        if (message) root.append(text('div', `phone-note ${message.ok ? 'good' : 'bad'}`, message.text));

        const buy = (label: string, price: number, give: () => void) => {
            if (state.save.barre < price) {
                this.renderShop(root, { text: 'barre insufficienti. il realm non fa credito.', ok: false });
                return;
            }
            state.save.barre -= price;
            give();
            state.persist();
            sfx.barra();
            bus.emit('barre-changed', { barre: state.save.barre, gained: false });
            this.renderShop(root, { text: `${label}: consegnato nello zaino.`, ok: true });
        };

        root.append(text('div', 'phone-section', 'consumabili'));
        for (const id of SHOP_STOCK) {
            const it = ITEMS[id];
            if (!it?.price) continue;
            const owned = it.kind === 'amuleto' && state.hasCharm(id);
            if (it.kind === 'amuleto' && root.querySelector('[data-charms]') === null) {
                const sec = text('div', 'phone-section', 'amuleti');
                sec.dataset.charms = '1';
                root.append(sec);
            }
            const row = el('button', 'phone-row glass-chip glass-acid-yellow');
            row.append(text('span', 'lead', it.icon));
            const main = el('div', 'main');
            main.append(text('div', 'name', it.name), text('div', 'preview', it.desc));
            row.append(main, text('span', 'price', owned ? 'già tuo' : `♪ ${it.price}`));
            if (owned) row.setAttribute('disabled', '');
            else row.addEventListener('click', () => buy(it.name, it.price!, () => state.addItem(id)));
            root.append(row);
        }

        const bought = state.save.notches - BASE_NOTCHES;
        if (bought < NOTCH_PRICES.length) {
            root.append(text('div', 'phone-section', 'potenziamenti'));
            const price = NOTCH_PRICES[bought];
            const row = el('button', 'phone-row glass-chip glass-acid-yellow');
            row.append(text('span', 'lead', ITEMS.tacca.icon));
            const main = el('div', 'main');
            main.append(text('div', 'name', ITEMS.tacca.name), text('div', 'preview', ITEMS.tacca.desc));
            row.append(main, text('span', 'price', `♪ ${price}`));
            row.addEventListener('click', () => buy('tacca', price, () => state.addItem('tacca')));
            root.append(row);
        }
    }

    /* ---------- mappa del realm ---------- */

    /** la regione in corso: si vede solo dove sei passato, più il contorno dei varchi accanto */
    private renderRegionMap(root: HTMLElement): void {
        const L = regionView.layout;
        if (!L || regionView.id !== state.save.levelId) return;
        const lv = LEVELS[regionView.id];
        const explored = new Set(state.save.explored[regionView.id] ?? []);
        const ns = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('viewBox', `-4 -4 ${L.cols + 8} ${L.rows + 8}`);
        svg.setAttribute('role', 'img');
        svg.setAttribute('aria-label', `mappa di ${lv?.accentWord ?? 'questa regione'}`);
        const add = (tag: string, attrs: Record<string, string | number>) => {
            const n = document.createElementNS(ns, tag);
            for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
            svg.append(n);
            return n;
        };
        const accent = lv ? ZONE_CSS[lv.color] : '#4ade80';
        const near = new Set<number>();
        for (const d of L.doors) {
            if (explored.has(d.a)) near.add(d.b);
            if (explored.has(d.b)) near.add(d.a);
        }
        const fillOf: Record<string, string> = { arena: '#3b0d12', rest: '#0d2a1a', secret: '#2a1240', start: '#10202a', exit: '#2a2508' };
        for (const room of L.rooms) {
            const R = room.rect;
            if (explored.has(room.id)) {
                add('rect', { x: R.x + 1, y: R.y + 1, width: R.w - 2, height: R.h - 2, rx: 3, fill: fillOf[room.kind] ?? '#15151c', stroke: room.id === regionView.room ? accent : 'rgba(255,255,255,0.55)', 'stroke-width': room.id === regionView.room ? 3 : 1.5 });
            } else if (near.has(room.id)) {
                add('rect', { x: R.x + 1, y: R.y + 1, width: R.w - 2, height: R.h - 2, rx: 3, fill: 'none', stroke: 'rgba(255,255,255,0.18)', 'stroke-width': 1.2, 'stroke-dasharray': '4 4' });
            }
        }
        // i varchi tra stanze note
        for (const d of L.doors) {
            if (!explored.has(d.a) && !explored.has(d.b)) continue;
            const A = L.rooms[d.a];
            const B = L.rooms[d.b];
            if (d.axis === 'h') {
                const right = A.rect.x < B.rect.x ? B : A;
                add('rect', { x: right.rect.x - 2, y: d.y - 4, width: 4, height: 4, fill: d.kind === 'open' ? accent : '#a855f7' });
            } else {
                const bottom = A.rect.y < B.rect.y ? B : A;
                add('rect', { x: d.x, y: bottom.rect.y - 2, width: d.len, height: 4, fill: d.kind === 'drop' ? '#f87171' : accent });
            }
        }
        const T = 32;
        const roomOf = (x: number, y: number) => L.rooms.find((o) => x / T >= o.rect.x && x / T < o.rect.x + o.rect.w && y / T >= o.rect.y && y / T < o.rect.y + o.rect.h);
        for (const m of regionView.markers) {
            const room = roomOf(m.x, m.y);
            if (!room || !explored.has(room.id)) continue;
            if (m.kind === 'mic') add('circle', { cx: m.x / T, cy: m.y / T, r: 3.5, fill: '#22d3ee', stroke: '#000', 'stroke-width': 1 });
            if (m.kind === 'stop') add('rect', { x: m.x / T - 2, y: m.y / T - 5, width: 4, height: 7, fill: '#facc15', stroke: '#000', 'stroke-width': 0.8 });
            if (m.kind === 'exit') add('rect', { x: m.x / T - 3, y: m.y / T - 6, width: 6, height: 9, fill: '#facc15', stroke: '#000', 'stroke-width': 1 });
        }
        const goal = regionView.goal;
        if (goal) {
            const star = add('text', { x: goal.x / T, y: goal.y / T + 5, 'text-anchor': 'middle', 'font-size': 16, fill: '#f87171' });
            star.textContent = '✶';
        }
        if (regionView.player) {
            add('circle', { cx: regionView.player.x / T, cy: regionView.player.y / T, r: 4.5, fill: '#fff', stroke: accent, 'stroke-width': 2, class: 'here' });
        }
        const map = el('div', 'region-map glass-panel');
        map.append(svg);
        root.append(text('div', 'phone-section', `${lv ? lv.accentWord : 'regione'} · ${explored.size}/${L.rooms.length} stanze`), map);
        if (goal) root.append(text('div', 'region-goal', `✶ obiettivo: ${goal.label}`));
        root.append(text('div', 'phone-section', 'il gecorealm'));
    }

    private renderMap(root: HTMLElement): void {
        this.renderRegionMap(root);
        const ids = LEVEL_ORDER;
        const step = 64;
        const w = 300;
        const h = ids.length * step + 30;
        const pts = ids.map((_, i) => ({ x: i % 2 === 0 ? 70 : 230, y: 30 + i * step }));
        const ns = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
        svg.setAttribute('role', 'img');
        svg.setAttribute('aria-label', 'mappa del gecorealm');

        // sentiero a pennarello tra i capitoli
        let d = `M ${pts[0].x} ${pts[0].y}`;
        for (let i = 1; i < pts.length; i++) {
            const a = pts[i - 1];
            const b = pts[i];
            d += ` C ${a.x} ${a.y + step * 0.6}, ${b.x} ${b.y - step * 0.6}, ${b.x} ${b.y}`;
        }
        const path = document.createElementNS(ns, 'path');
        path.setAttribute('d', d);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', 'rgba(207,167,92,0.45)');
        path.setAttribute('stroke-width', '3');
        path.setAttribute('stroke-dasharray', '7 7');
        path.setAttribute('stroke-linecap', 'round');
        svg.append(path);

        const info = el('div');
        ids.forEach((id, i) => {
            const lv = LEVELS[id];
            const seen = state.hasFlag(`visto-${id}`);
            const here = state.save.levelId === id;
            const g = document.createElementNS(ns, 'g');
            g.setAttribute('class', `node ${seen ? '' : 'locked'}`);
            g.setAttribute('tabindex', seen ? '0' : '-1');
            const c = document.createElementNS(ns, 'circle');
            c.setAttribute('cx', String(pts[i].x));
            c.setAttribute('cy', String(pts[i].y));
            c.setAttribute('r', here ? '11' : '8');
            c.setAttribute('fill', seen ? ZONE_CSS[lv.color] : '#1a1a1e');
            c.setAttribute('stroke', 'rgba(0,0,0,0.9)');
            c.setAttribute('stroke-width', '3');
            g.append(c);
            if (here) {
                const ring = document.createElementNS(ns, 'circle');
                ring.setAttribute('cx', String(pts[i].x));
                ring.setAttribute('cy', String(pts[i].y));
                ring.setAttribute('r', '17');
                ring.setAttribute('fill', 'none');
                ring.setAttribute('stroke', ZONE_CSS[lv.color]);
                ring.setAttribute('stroke-width', '2');
                ring.setAttribute('class', 'here');
                g.append(ring);
            }
            const t = document.createElementNS(ns, 'text');
            const left = pts[i].x > w / 2;
            t.setAttribute('x', String(pts[i].x + (left ? -20 : 20)));
            t.setAttribute('y', String(pts[i].y + 5));
            t.setAttribute('text-anchor', left ? 'end' : 'start');
            t.setAttribute('transform', `rotate(${left ? 2 : -2} ${pts[i].x} ${pts[i].y})`);
            t.textContent = seen ? lv.accentWord : '???';
            g.append(t);
            if (seen) {
                const show = () => {
                    info.replaceChildren();
                    const card = el('div', 'detail glass-panel');
                    card.append(text('div', 'name', `${lv.title.toLowerCase()} ${lv.accentWord}`), text('p', '', lv.punchline));
                    const mask = state.save.collectedLore.includes(`maschera-${id}`);
                    card.append(text('div', 'punch', mask ? 'maschera trovata' : 'qui potrebbe esserci una maschera'));
                    info.append(card);
                    card.scrollIntoView({ block: 'nearest' });
                };
                g.addEventListener('click', show);
                g.addEventListener('keydown', (e) => {
                    if ((e as KeyboardEvent).code === 'Enter') show();
                });
            }
            svg.append(g);
        });
        const map = el('div', 'realm-map');
        map.append(svg);
        root.append(map, info);
    }

    /* ---------- diario ---------- */

    private renderJournal(root: HTMLElement): void {
        const lv = LEVELS[state.save.levelId];
        const obj = el('div', 'objective glass-panel glass-acid-red');
        obj.append(text('span', 'where', lv ? `${lv.title.toLowerCase()} ${lv.accentWord}` : 'da qualche parte'));
        obj.append(document.createTextNode(OBJECTIVES[state.save.levelId] ?? 'vai avanti. il realm non si salva da solo.'));
        root.append(obj);

        root.append(text('div', 'phone-section', 'il resto della vita'));
        const lore = state.save.collectedLore;
        const quests: { name: string; done: number; total: number; show: boolean }[] = [
            { name: 'frammenti della gecowave', done: state.save.abilities.length, total: TOTAL_FRAGMENTS, show: true },
            { name: 'le maschere del primo custode', done: lore.filter((k) => k.startsWith('maschera-')).length, total: TOTAL_MASCHERE, show: true },
            { name: 'il caso analisi 1', done: ['indizio-1', 'indizio-2', 'indizio-3'].filter((f) => state.hasFlag(f)).length, total: 3, show: state.hasFlag('visto-caso') },
            { name: 'la quest di walter baruffoni', done: ['boss-down-maranza', 'boss-down-maranzone', 'boss-down-istruttore', 'boss-down-annascrivania', 'boss-down-walter'].filter((f) => state.hasFlag(f)).length, total: 5, show: state.hasFlag('visto-galliate') },
            { name: 'il quaderno strappato di pedro', done: lore.filter((k) => k.startsWith('pagina-pedro-')).length, total: TOTAL_PAGES, show: lore.some((k) => k.startsWith('pagina-pedro-')) },
            { name: 'storie sparse del realm', done: lore.filter((k) => k.startsWith('nota-')).length, total: TOTAL_NOTES, show: lore.some((k) => k.startsWith('nota-')) },
            { name: 'amuleti collezionati', done: state.save.charms.length, total: Object.values(ITEMS).filter((i) => i.kind === 'amuleto').length, show: true },
        ];
        // le missioni dei passanti accettate, con lo stato
        const mine = QUESTS.filter((q) => state.save.quests[q.id]);
        if (mine.length) {
            root.append(text('div', 'phone-section', 'missioni dei passanti'));
            for (const q of mine) {
                const st = state.save.quests[q.id];
                const row = el('div', `phone-row glass-chip ${st.s === 'fatta' ? '' : 'glass-acid-yellow'}`);
                const main = el('div', 'main');
                const lv = LEVELS[q.region];
                const how = st.s === 'fatta' ? 'completata' : st.s === 'pronta' ? 'torna da chi te l\'ha chiesto'
                    : q.kind === 'caccia' && q.hunt ? `${st.n}/${q.hunt.count} ${q.hunt.label}`
                    : q.kind === 'cerca' ? `cerca: ${q.thing?.name} (stanze laterali)` : `porta ${q.thing?.name} a ${q.recipient?.name}`;
                main.append(text('div', 'name', q.title), text('div', 'preview', `${lv?.accentWord ?? q.region} · ${how}`));
                row.append(main, text('span', 'meta', st.s === 'fatta' ? '✓' : st.s === 'pronta' ? '?' : '…'));
                if (st.s === 'fatta') row.style.opacity = '0.6';
                root.append(row);
            }
            root.append(text('div', 'phone-section', 'collezioni'));
        }
        for (const q of quests.filter((q) => q.show)) {
            const row = el('div', 'phone-row glass-chip');
            const main = el('div', 'main');
            main.append(text('div', 'name', q.name));
            const bar = el('div', 'progress', `<span style="width:${Math.min(100, (q.done / q.total) * 100)}%"></span>`);
            main.append(bar);
            row.append(main, text('span', 'meta', `${q.done}/${q.total}`));
            root.append(row);
        }
    }

    /* ---------- codex: note, pagine, misteri in ordine ---------- */

    private renderCodex(root: HTMLElement): void {
        const sections = codexSections(state.save.collectedLore, (f) => state.hasFlag(f));
        if (!sections.length) {
            root.append(text('div', 'phone-empty', 'ancora niente da rileggere. esplora le stanze laterali: chi cerca, legge.'));
            return;
        }
        root.append(text('div', 'phone-note', 'tocca una riga raccolta per rileggerla. le ??? sono cose che non hai ancora trovato.'));
        for (const s of sections) {
            root.append(text('div', 'phone-section', `${s.title} — ${s.sub}`));
            for (const e of s.entries) {
                const row = el('button', `phone-row glass-chip ${e.collected ? 'glass-acid-cyan' : ''}`);
                const main = el('div', 'main');
                main.append(text('div', 'name', e.collected ? e.title : `${e.title.split('—')[0]}— ???`), text('div', 'preview', e.collected ? (DIALOGUES[e.id]?.[0]?.text ?? '') : 'non ancora trovato: esplora le stanze laterali.'));
                row.append(text('span', 'lead', e.collected ? '📖' : '❔'), main, text('span', 'meta', e.collected ? '✓' : '…'));
                if (e.collected && DIALOGUES[e.id]) {
                    row.addEventListener('click', () => {
                        const lines = DIALOGUES[e.id];
                        const full = lines.map((l) => `${l.speaker}: ${l.text}`).join('\n\n');
                        const overlay = el('div', 'phone-row glass-chip glass-acid-cyan');
                        overlay.append(text('div', 'preview', full));
                        row.after(overlay);
                    });
                }
                if (!e.collected) (row as HTMLButtonElement).disabled = true;
                root.append(row);
            }
        }
    }

    /* ---------- radio ---------- */

    private renderRadio(root: HTMLElement): void {
        const current = state.save.radio;
        const np = el('div', 'now-playing glass-panel glass-acid-yellow');
        np.append(text('div', 'freq', '99.2'));
        const track = RADIO.find((r) => r.file === current);
        const line = el('div', 'track');
        line.append(document.createTextNode(track ? `${track.title} — ${track.artist} ` : 'la musica del capitolo '), el('span', 'eq', '<i></i><i></i><i></i>'));
        np.append(line);
        root.append(np);

        const reset = el('button', 'phone-btn sticker glass-acid-yellow');
        reset.textContent = 'musica del capitolo';
        reset.style.transform = 'rotate(-1deg)';
        reset.disabled = current === null;
        reset.addEventListener('click', () => {
            music.setRadio(null);
            this.renderRadio(this.clear(root));
        });
        root.append(reset, text('div', 'phone-section', 'scaletta'));
        for (const r of RADIO) {
            const row = el('button', `phone-row glass-chip ${r.file === current ? 'glass-acid-yellow' : ''}`);
            row.append(text('span', 'lead', r.file === current ? '▶' : '♪'));
            const main = el('div', 'main');
            main.append(text('div', 'name', r.title), text('div', 'preview', r.artist));
            row.append(main);
            row.addEventListener('click', () => {
                music.setRadio(r.file);
                sfx.ui();
                this.renderRadio(this.clear(root));
            });
            root.append(row);
        }
    }

    private clear(root: HTMLElement): HTMLElement {
        root.replaceChildren();
        return root;
    }

    /* ---------- profilo ---------- */

    private renderProfile(root: HTMLElement): void {
        const card = el('div', 'player-card glass-panel glass-acid-green');
        const who = el('div');
        who.append(text('div', 'pname', state.save.playerName), text('div', 'phone-note', 'custode provvisorio della gecowave'));
        card.append(text('span', 'avatar', '🦎'), who);
        root.append(card);

        const r = state.save.record;
        const hours = Math.floor(r.playMs / 3600000);
        const mins = Math.floor((r.playMs % 3600000) / 60000);
        const lines: [string, string][] = [
            ['forza', String(state.save.stats.forza)],
            ['costituzione', String(state.save.stats.costituzione)],
            ['flusso', String(state.save.stats.flusso)],
            ['vita massima', String(state.maxHp)],
            ['nemici abbattuti', String(r.kills)],
            ['boss sconfitti', String(r.bosses)],
            ['morti', String(r.deaths)],
            ['tempo nel realm', `${hours} h ${mins} min`],
            ['punteggio totale', Object.values(state.save.scores).reduce((n, sc) => n + sc.score, 0).toLocaleString('it-IT')],
            ['trofei', `${state.save.achievements.length}`],
        ];
        for (const [k, v] of lines) {
            const line = el('div', 'stat-line');
            line.append(text('span', '', k), text('b', '', v));
            root.append(line);
        }
        root.append(text('div', 'phone-section', 'le tue wave'));
        if (state.abilities.length === 0) root.append(text('div', 'phone-note', 'ancora nessuna. markolino ti guarda deluso.'));
        for (const a of state.abilities) {
            const card2 = ABILITY_CARDS[a];
            const row = el('div', 'phone-row glass-chip glass-acid-green');
            const main = el('div', 'main');
            main.append(text('div', 'name', card2.name), text('div', 'preview', card2.desc));
            row.append(main, text('span', 'meta', card2.key));
            root.append(row);
        }
    }

    /* ---------- impostazioni ---------- */

    private renderSettings(root: HTMLElement): void {
        const vol = el('div', 'phone-row glass-chip');
        vol.append(text('span', 'name', 'volume'));
        const slider = el('input');
        slider.type = 'range';
        slider.min = '0';
        slider.max = '1';
        slider.step = '0.05';
        slider.value = String(state.settings.volume);
        slider.setAttribute('aria-label', 'volume');
        slider.addEventListener('input', () => {
            state.settings.volume = Number(slider.value);
            state.persistSettings();
            sfx.setVolume(state.settings.volume);
            music.setVolume(state.settings.volume);
        });
        vol.append(slider);
        root.append(vol);

        const shake = el('div', 'phone-row glass-chip');
        shake.append(text('span', 'name', 'screen shake'));
        const toggle = el('button', `toggle sticker ${state.settings.screenShake ? 'on' : ''}`);
        toggle.textContent = state.settings.screenShake ? 'attivo' : 'spento';
        toggle.addEventListener('click', () => {
            state.settings.screenShake = !state.settings.screenShake;
            state.persistSettings();
            toggle.classList.toggle('on', state.settings.screenShake);
            toggle.textContent = state.settings.screenShake ? 'attivo' : 'spento';
            sfx.ui();
        });
        shake.append(toggle);
        root.append(shake);

        root.append(assistToggle({ rowClass: 'phone-row glass-chip' }));

        root.append(text('div', 'phone-section', 'comandi del telefono'));
        for (const [k, v] of [['apri e chiudi', 'TAB / P'], ['indietro', 'ESC'], ['mangia al volo', 'C']]) {
            const line = el('div', 'stat-line');
            line.append(text('span', '', k), text('b', '', v));
            root.append(line);
        }
    }
}
