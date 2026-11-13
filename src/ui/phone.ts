import { ZONE_CSS } from '../config';
import { TOTAL_NOTES, TOTAL_PAGES } from '../content/arcs';
import { codexSections, CODEX_HINT } from '../content/codex';
import { DIALOGUES } from '../content/story';
import { ITEMS, NOTCH_PRICES, BASE_NOTCHES, type ItemDef } from '../content/items';
import { LEVELS, LEVEL_ORDER, TOTAL_FRAGMENTS, TOTAL_MASCHERE } from '../content/levels';
import { CONTACTS, OBJECTIVES, POSTS, RADIO, type Contact } from '../content/phone';
import { ABILITY_CARDS } from '../content/story';
import { deletePhoto, listPhotos, PHOTO_FILTERS, processPhoto, savePhoto, type PhotoFilter } from './photos';
import { bus } from '../core/events';
import { matchesAction } from '../input/actions';
import { haptics } from '../input/haptics';
import { formatKeys, keyLabel } from '../input/keyText';
import { eatProblem } from '../core/inventory';
import { coop } from '../coop/runtime';
import { music } from '../audio/music';
import { sfx } from '../audio/sfx';
import { state } from '../core/state';
import { regionView } from '../core/regionView';
import { realmClock } from '../stage/Atmosphere';
import { pixelIcon } from './phoneIcons';
import { buildTrophyCabinet } from './trophies';
import { assistToggle } from './assist';
import { QUESTS } from '../content/quests';
import { chapterCompletion } from '../core/ChapterCompletion';
import type { ZoneColor } from '../types';
import './phone.css';
import { el, ui } from './dom';

/* il wavesung galaxy: il tasto del telefono lo tira fuori dalla tasca. il gioco si ferma,
   come quando guardi il telefono a cena e il mondo aspetta */

export interface PhoneHost {
    pause(): void;
    resume(): void;
    /** il telefono si apre solo in gioco, senza menu o dialoghi aperti */
    canOpen(): boolean;
    /** scatto del canvas di gioco, o null se l'obiettivo è tappato */
    snapshot(): Promise<string | null>;
}

type AppId = 'messaggi' | 'wavegram' | 'fotocamera' | 'galleria' | 'mappa' | 'zaino' | 'amuleti' | 'wavezon' | 'diario' | 'taccuino' | 'radio' | 'trofei' | 'profilo' | 'impostazioni';

interface AppDef {
    id: AppId;
    name: string;
    tint: ZoneColor;
    title: string;
    sub: string;
}

const APPS: AppDef[] = [
    { id: 'messaggi', name: 'messaggi', tint: 'blue', title: 'MESSAGGI', sub: 'tutti ti scrivono, nessuno ti chiede come stai' },
    { id: 'wavegram', name: 'wavegram', tint: 'purple', title: 'WAVEGRAM', sub: 'il realm che collassa, ma con i filtri' },
    { id: 'fotocamera', name: 'fotocamera', tint: 'red', title: 'FOTOCAMERA', sub: 'il realm in posa, poi in cornice' },
    { id: 'galleria', name: 'galleria', tint: 'yellow', title: 'GALLERIA', sub: 'scatti dal realm, da portare via' },
    { id: 'mappa', name: 'mappa', tint: 'green', title: 'MAPPA', sub: 'tu sei qui. purtroppo.' },
    { id: 'zaino', name: 'zaino', tint: 'orange', title: 'ZAINO', sub: 'tutto quello che un geco può portare' },
    { id: 'amuleti', name: 'amuleti', tint: 'purple', title: 'AMULETI', sub: 'si cambiano solo vicino a un microfono' },
    { id: 'wavezon', name: 'wavezon', tint: 'yellow', title: 'WAVEZON', sub: 'consegna in giornata, anche nel void' },
    { id: 'diario', name: 'diario', tint: 'red', title: 'DIARIO', sub: 'cose da fare prima che il realm finisca' },
    { id: 'taccuino', name: 'taccuino', tint: 'cyan', title: 'TACCUINO', sub: 'note, pagine, misteri: rileggili in ordine' },
    { id: 'radio', name: 'radio', tint: 'yellow', title: 'RADIO', sub: 'radio gecowave, l\'unica che non chiude' },
    { id: 'trofei', name: 'trofei', tint: 'yellow', title: 'TROFEI', sub: 'la gloria, ma in pixel' },
    { id: 'profilo', name: 'io', tint: 'green', title: 'IO', sub: 'il custode, in numeri' },
    { id: 'impostazioni', name: 'impostazioni', tint: 'cyan', title: 'IMPOSTAZIONI', sub: 'per chi vuole il realm più basso' },
];

/** le app fisse nel dock in basso */
const DOCK: AppId[] = ['messaggi', 'mappa', 'zaino', 'trofei'];

/** i capitoli che hanno un dipinto loro: lo sfondo della home è il posto dove sei */
const PAINTED = new Set(['bus', 'cantina', 'caso', 'galliate', 'marcetti', 'mente', 'nucleo', 'ricordi', 'rio', 'ruhra', 'santuario', 'sorveglianza', 'stabilimento', 'tana', 'tecnokill', 'trenbolone', 'void']);

function wallpaperFor(levelId: string): string {
    return PAINTED.has(levelId) ? `assets/backgrounds/${levelId}.png` : 'assets/background.png';
}

const SHOP_STOCK = ['crocchetta', 'panino-nonna', 'scarpe-markolino', 'rosario-riba', 'geco-portafortuna'];

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

function glyph(id: string, cls = 'gl'): HTMLElement {
    return el('span', cls, pixelIcon(id));
}

/** la tessera a gradini con dentro una faccia: contatti, autori, il geco */
function avatar(icon: string, color: ZoneColor, cls = ''): HTMLElement {
    const a = text('span', `os-avatar ${cls}`, icon);
    a.style.setProperty('--app', ZONE_CSS[color]);
    a.setAttribute('aria-hidden', 'true');
    return a;
}

function cell(o: { tag?: 'button' | 'div'; lead?: Node; name: string; sub?: string; trail?: string; lines?: number }): HTMLElement {
    const c = el(o.tag ?? 'div', 'os-cell');
    if (o.lead) c.append(o.lead);
    const main = el('span', 'main');
    main.append(text('span', 'name', o.name));
    if (o.sub) {
        const sub = text('span', 'sub', o.sub);
        if (o.lines) sub.style.setProperty('--lines', String(o.lines));
        main.append(sub);
    }
    c.append(main);
    if (o.trail !== undefined) c.append(text('span', 'trail', o.trail));
    return c;
}

function heading(title: string, aside = ''): HTMLElement {
    const h = el('div', 'os-h');
    h.append(text('span', '', title));
    if (aside) h.append(text('span', 'aside', aside));
    return h;
}

function tile(label: string, value: string, sub = ''): HTMLElement {
    const t = el('div', 'os-tile');
    t.append(text('span', 'label', label), text('span', 'value', value));
    if (sub) t.append(text('span', 'sub', sub));
    return t;
}

/** barra a blocchi: un pezzo per unità finché ci stanno, poi in proporzione */
function meter(done: number, total: number, tone = ''): HTMLElement {
    const m = el('span', `os-meter ${tone}`);
    const blocks = Math.max(1, Math.min(total, 12));
    const lit = total > 0 ? Math.round((Math.min(done, total) / total) * blocks) : 0;
    for (let i = 0; i < blocks; i++) m.append(el('i', i < lit ? 'on' : ''));
    m.setAttribute('role', 'img');
    m.setAttribute('aria-label', `${done} su ${total}`);
    return m;
}

function button(label: string, kind: 'fill' | 'ghost' | 'danger', onClick: () => void): HTMLButtonElement {
    const b = el('button', `os-btn ${kind}`);
    b.type = 'button';
    b.textContent = label;
    b.addEventListener('click', () => {
        sfx.ui();
        onClick();
    });
    return b;
}

function empty(icon: string, title: string, body: string): HTMLElement {
    const e = el('div', 'os-empty');
    e.append(glyph(icon, 'gl big'), text('div', 'title', title), text('div', 'body', body));
    return e;
}

function switchCell(name: string, get: () => boolean, set: (v: boolean) => void): HTMLElement {
    const c = el('div', 'os-cell');
    const s = el('button', 'os-switch');
    s.type = 'button';
    s.setAttribute('role', 'switch');
    s.setAttribute('aria-label', name);
    const paint = () => s.setAttribute('aria-checked', String(get()));
    paint();
    s.addEventListener('click', () => {
        set(!get());
        paint();
        sfx.ui();
    });
    c.append(text('span', 'name', name), s);
    return c;
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
    /** la scheda aperta in ogni app: resta quella anche se l'app si ridisegna */
    private tabOf: Partial<Record<AppId, string>> = {};
    private titleEl: HTMLElement | null = null;
    private subEl: HTMLElement | null = null;
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
        bus.on('controls-changed', () => this.renderHint());
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
        if (matchesAction(e, 'phone') && (e.code === 'Tab' || !this.isTyping(e))) {
            if (!this.isOpen && !this.host.canOpen()) return;
            e.preventDefault();
            e.stopImmediatePropagation();
            this.toggle();
            return;
        }
        if (!this.isOpen) return;
        if (matchesAction(e, 'pause') || e.code === 'Backspace') {
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
        const icon = text('span', 'icon', '📱');
        if (unread > 0) icon.append(text('span', 'unread', String(unread)));
        this.hint.append(icon, text('kbd', '', keyLabel('phone').toLowerCase()));
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

        const level = LEVELS[state.save.levelId];
        b.append(text('div', 'phone-clock', realmClock()));
        b.append(text('div', 'phone-greet', level ? `${level.title.toLowerCase()} ${level.accentWord}` : 'segnale: gecowave 5g'));

        // la notifica sta sopra tutto, come su un telefono vero
        const unread = state.unreadMessages;
        if (unread > 0) {
            const last = state.save.messages[state.save.messages.length - 1];
            const note = el('button', 'home-notice');
            const words = el('span', 'main');
            words.append(text('span', 'name', last ? last.sender : 'messaggi'), text('span', 'sub', last ? formatKeys(last.text) : ''));
            note.append(glyph('messaggi', 'gl tile-s'), words, text('span', 'count', String(unread)));
            (note.firstElementChild as HTMLElement).style.setProperty('--app', ZONE_CSS.blue);
            note.addEventListener('click', (e) => this.launch('messaggi', e.currentTarget as HTMLElement));
            b.append(note);
        }

        const widgets = el('div', 'home-widgets');
        const goal = el('button', 'home-widget wide');
        goal.append(
            text('span', 'w-kick', 'adesso'),
            text('span', 'w-text', formatKeys(OBJECTIVES[state.save.levelId] ?? 'vai avanti. il realm non si salva da solo.')),
        );
        goal.addEventListener('click', (e) => this.launch('diario', e.currentTarget as HTMLElement));

        const life = el('button', 'home-widget');
        life.append(text('span', 'w-kick', 'vita'), text('span', 'w-big', `${state.run.hp}/${state.maxHp}`), meter(state.run.hp, state.maxHp, 'red'));
        life.addEventListener('click', (e) => this.launch('profilo', e.currentTarget as HTMLElement));

        const purse = el('button', 'home-widget');
        purse.append(text('span', 'w-kick', 'barre'), text('span', 'w-big', `♪ ${state.save.barre}`), text('span', 'w-sub', `${state.abilities.length}/${TOTAL_FRAGMENTS} frammenti`));
        purse.addEventListener('click', (e) => this.launch('wavezon', e.currentTarget as HTMLElement));
        widgets.append(goal, life, purse);
        b.append(widgets);

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
        icon.append(el('span', 'tile', pixelIcon(app.id)));
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
        this.stack = [];
        const def = APPS.find((a) => a.id === id)!;
        this.setTint(def.tint);
        const v = this.view;
        v.className = `phone-view app app-${id}${fresh ? '' : ' still'}`;
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
        back.append(text('b', '', '‹'), text('span', '', 'indietro'));
        back.addEventListener('click', () => {
            sfx.ui();
            this.back();
        });
        const badge = el('span', 'app-icon', pixelIcon(def.id));
        badge.style.setProperty('--app', ZONE_CSS[def.tint]);
        head.append(back, badge);
        this.titleEl = text('div', 'phone-title', def.title);
        this.subEl = text('div', 'phone-sub', def.sub);
        b.append(head, this.titleEl, this.subEl);
        const content = el('div', 'app-content');
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
            case 'taccuino': this.renderCodex(content); break;
            case 'radio': this.renderRadio(content); break;
            case 'trofei': buildTrophyCabinet(content); break;
            case 'profilo': this.renderProfile(content); break;
            case 'impostazioni': this.renderSettings(content); break;
        }
        b.scrollTop = scroll;
        if (!keepScroll) back.focus();
    }

    /* ---------- pezzi comuni: testata, schede, foglio, avviso ---------- */

    /** una schermata interna cambia la testata, o la toglie del tutto */
    private chrome(title: string | null, sub = ''): void {
        if (!this.titleEl || !this.subEl) return;
        this.titleEl.hidden = title === null;
        this.subEl.hidden = title === null || sub === '';
        if (title !== null) {
            this.titleEl.textContent = title;
            this.subEl.textContent = sub;
        }
    }

    private tabbar(tabs: { id: string; label: string; glyph: string }[], active: string, pick: (id: string) => void): void {
        if (!this.view) return;
        this.dropTabbar();
        const bar = el('div', 'os-tabbar');
        bar.setAttribute('role', 'tablist');
        for (const t of tabs) {
            const btn = el('button', `os-tab${t.id === active ? ' on' : ''}`);
            btn.setAttribute('role', 'tab');
            btn.setAttribute('aria-selected', String(t.id === active));
            btn.append(glyph(t.glyph), text('span', '', t.label));
            btn.addEventListener('click', () => {
                sfx.ui();
                pick(t.id);
            });
            bar.append(btn);
        }
        this.view.append(bar);
        this.body?.classList.add('has-tabbar');
    }

    private dropTabbar(): void {
        this.view?.querySelector('.os-tabbar')?.remove();
        this.body?.classList.remove('has-tabbar');
    }

    /** il foglio che sale dal basso: i dettagli stanno qui, non in fondo alla lista */
    private sheet(build: (box: HTMLElement, close: () => void) => void): void {
        if (!this.view) return;
        const scrim = el('div', 'os-sheet-scrim');
        const box = el('div', 'os-sheet');
        box.setAttribute('role', 'dialog');
        const close = () => {
            if (!scrim.isConnected) return;
            scrim.remove();
            const i = this.stack.indexOf(close);
            if (i >= 0) this.stack.splice(i, 1);
        };
        scrim.addEventListener('click', (e) => {
            if (e.target === scrim) close();
        });
        box.append(el('span', 'os-grab'));
        build(box, close);
        scrim.append(box);
        this.view.append(scrim);
        this.stack.push(close);
        (box.querySelector('button') as HTMLElement | null)?.focus();
    }

    /** sta sullo schermo e non nell'app: sopravvive a quando l'app si ridisegna */
    private toast(message: string, ok: boolean): void {
        if (!this.screen) return;
        this.screen.querySelector('.os-toast')?.remove();
        const t = text('div', `os-toast ${ok ? 'good' : 'bad'}`, message);
        t.setAttribute('role', 'status');
        this.screen.append(t);
        window.setTimeout(() => t.remove(), 2600);
    }

    /* ---------- messaggi e chiamate ---------- */

    private renderMessages(root: HTMLElement): void {
        root.replaceChildren();
        const tab = this.tabOf.messaggi ?? 'chat';
        this.tabbar([
            { id: 'chat', label: 'chat', glyph: 'messaggi' },
            { id: 'rubrica', label: 'rubrica', glyph: 'persona' },
        ], tab, (id) => {
            this.tabOf.messaggi = id;
            this.renderMessages(root);
        });

        if (tab === 'rubrica') {
            this.chrome('RUBRICA', 'rispondono sempre. quasi sempre.');
            const grid = el('div', 'contact-grid');
            for (const c of CONTACTS) {
                const card = el('button', 'contact-card');
                card.setAttribute('aria-label', `chiama ${c.name}`);
                const call = el('span', 'call-chip');
                call.append(glyph('telefono'), text('span', '', 'chiama'));
                card.append(avatar(c.icon, c.color, 'big'), text('span', 'name', c.name), call);
                card.addEventListener('click', () => this.call(root, c));
                grid.append(card);
            }
            root.append(grid);
            return;
        }

        this.chrome('MESSAGGI', 'tutti ti scrivono, nessuno ti chiede come stai');
        const threads = new Map<string, { last: number; preview: string; unread: number }>();
        for (const m of state.save.messages) {
            const t = threads.get(m.sender) ?? { last: 0, preview: '', unread: 0 };
            t.last = m.at;
            t.preview = m.text;
            if (!m.read) t.unread++;
            threads.set(m.sender, t);
        }
        if (threads.size === 0) {
            root.append(empty('messaggi', 'nessun messaggio', 'il realm ti ignora, per ora. prova a chiamare qualcuno dalla rubrica.'));
            return;
        }
        const list = el('div', 'os-group');
        const sorted = [...threads.entries()].sort((a, b) => b[1].last - a[1].last);
        for (const [sender, t] of sorted) {
            const contact = contactFor(sender);
            const row = cell({ tag: 'button', lead: avatar(contact?.icon ?? '📨', contact?.color ?? 'blue'), name: sender, sub: formatKeys(t.preview), lines: 2 });
            const trail = el('span', 'trail col');
            trail.append(text('span', 'when', since(t.last)));
            if (t.unread) trail.append(text('span', 'os-count', String(t.unread)));
            row.append(trail);
            if (t.unread) row.classList.add('unread');
            row.addEventListener('click', () => this.thread(root, sender));
            list.append(row);
        }
        root.append(list);
    }

    private thread(root: HTMLElement, sender: string): void {
        this.stack.push(() => this.openApp('messaggi'));
        this.dropTabbar();
        this.chrome(null);
        root.replaceChildren();
        const contact = contactFor(sender);

        const bar = el('div', 'thread-bar');
        const who = el('div', 'who');
        who.append(text('div', 'name', sender), text('div', 'sub', contact ? 'in linea, purtroppo' : 'numero sconosciuto'));
        bar.append(avatar(contact?.icon ?? '📨', contact?.color ?? 'blue'), who);
        if (contact) {
            const call = el('button', 'round-btn good');
            call.setAttribute('aria-label', `chiama ${sender}`);
            call.append(glyph('telefono'));
            call.addEventListener('click', () => this.call(root, contact));
            bar.append(call);
        }
        root.append(bar);

        const log = el('div', 'thread');
        let lastAt = 0;
        for (const m of state.save.messages) {
            if (m.sender !== sender) continue;
            m.read = true;
            // un'ora di silenzio e la conversazione riparte con l'orario
            if (m.at - lastAt > 3600000) log.append(text('div', 'stamp', since(m.at) === 'ora' ? 'adesso' : `${since(m.at)} fa`));
            lastAt = m.at;
            log.append(text('div', 'bubble', formatKeys(m.text)));
        }
        root.append(log);
        state.persist();
        this.renderHint();
        this.body?.scrollTo({ top: this.body.scrollHeight });
    }

    private call(root: HTMLElement, c: Contact): void {
        this.stack.push(() => this.openApp('messaggi'));
        this.dropTabbar();
        this.chrome(null);
        sfx.ui();
        root.replaceChildren();
        const screen = el('div', 'call-screen');
        screen.style.setProperty('--app', ZONE_CSS[c.color]);
        const ring = el('div', 'call-ring');
        ring.append(avatar(c.icon, c.color, 'huge'));
        const stateLine = text('div', 'call-state', 'squilla…');
        const talk = el('div', 'call-talk');
        const hang = el('button', 'round-btn bad big');
        hang.setAttribute('aria-label', 'riattacca');
        hang.append(glyph('telefono'));
        hang.addEventListener('click', () => this.back());
        screen.append(ring, text('div', 'call-name', c.name), stateLine, talk, hang, text('div', 'call-hint', 'riattacca'));
        root.append(screen);
        hang.focus();
        window.setTimeout(() => {
            if (!ring.isConnected) return;
            ring.classList.add('live');
            stateLine.textContent = 'in chiamata';
            talk.append(text('div', 'bubble', formatKeys(c.call({
                levelId: state.save.levelId,
                flags: state.save.flags,
                barre: state.save.barre,
                abilities: state.abilities.length,
            }))));
            sfx.pickup();
        }, 1100);
    }

    /* ---------- wavegram ---------- */

    private renderWavegram(root: HTMLElement): void {
        const visible = POSTS.map((p, i) => ({ p, i })).filter(({ p }) => !p.needs || state.hasFlag(p.needs)).reverse();

        // le storie: chi ha postato, in fila. toccarne una porta al suo post
        const stories = el('div', 'stories');
        const seen = new Set<string>();
        const anchors = new Map<string, HTMLElement>();
        for (const { p } of visible) {
            if (seen.has(p.author)) continue;
            seen.add(p.author);
            const s = el('button', 'story');
            s.append(avatar(p.author[0], p.color, 'letter ring'), text('span', '', p.author.split(' ')[0]));
            s.addEventListener('click', () => anchors.get(p.author)?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
            stories.append(s);
        }
        root.append(stories);

        for (const { p, i } of visible) {
            const post = el('article', 'post');
            post.style.setProperty('--app', ZONE_CSS[p.color]);
            if (!anchors.has(p.author)) anchors.set(p.author, post);
            const who = el('div', 'who');
            const names = el('div', 'names');
            names.append(text('span', 'author', p.author), text('span', 'handle', p.handle));
            who.append(avatar(p.author[0], p.color, 'letter'), names);

            const media = el('div', 'media');
            media.append(text('p', '', p.text));

            const like = el('button', 'like');
            const count = text('span', '', '');
            const heart = el('span', 'gl');
            like.append(heart, count);
            const paint = () => {
                const on = this.liked.has(i);
                heart.innerHTML = pixelIcon(on ? 'cuore' : 'cuorevuoto');
                count.textContent = (p.likes + (on ? 1 : 0)).toLocaleString('it-IT');
                like.classList.toggle('on', on);
                like.setAttribute('aria-pressed', String(on));
                like.setAttribute('aria-label', on ? 'togli il mi piace' : 'metti mi piace');
            };
            const flip = () => {
                if (this.liked.has(i)) this.liked.delete(i);
                else this.liked.add(i);
                sfx.ui();
                paint();
            };
            paint();
            like.addEventListener('click', flip);
            // doppio tocco sul post, come sull'originale
            media.addEventListener('dblclick', () => {
                if (!this.liked.has(i)) flip();
            });
            post.append(who, media, like);
            root.append(post);
        }
        root.append(text('div', 'os-foot', 'vai avanti nel realm: la gente posta di più quando succede qualcosa.'));
    }

    /* ---------- fotocamera e galleria ---------- */

    private photoDraft: { img: HTMLImageElement; filter: PhotoFilter; letterbox: boolean; caption: string } | null = null;
    private galleryOpen: string | null = null;

    private renderCamera(root: HTMLElement): void {
        root.replaceChildren();
        this.chrome(null);
        const draft = this.photoDraft;
        if (!draft) {
            const vf = el('div', 'vf', '<i class="c tl"></i><i class="c tr"></i><i class="c bl"></i><i class="c br"></i><i class="thirds"></i>');
            vf.append(text('div', 'vf-hint', 'l’obiettivo vede quello che vedi tu. il realm resta fermo in posa.'));
            const note = text('div', 'cam-note', '');
            const bar = el('div', 'cam-bar');
            const last = listPhotos()[0];
            const roll = el('button', 'cam-roll');
            roll.setAttribute('aria-label', 'apri la galleria');
            if (last) {
                const img = el('img');
                img.src = last.dataUrl;
                img.alt = '';
                roll.append(img);
            }
            roll.addEventListener('click', () => {
                sfx.ui();
                this.openApp('galleria');
            });
            const shoot = el('button', 'cam-shoot');
            shoot.type = 'button';
            shoot.setAttribute('aria-label', 'scatta');
            const fail = () => {
                shoot.disabled = false;
                note.textContent = 'obiettivo tappato. riprova.';
            };
            shoot.addEventListener('click', async () => {
                shoot.disabled = true;
                const src = await this.host.snapshot();
                if (!src) {
                    fail();
                    return;
                }
                const img = new Image();
                img.onload = () => {
                    const lv = LEVELS[state.save.levelId];
                    this.photoDraft = { img, filter: 'naturale', letterbox: true, caption: lv ? `${lv.title.toLowerCase()} ${lv.accentWord}` : '' };
                    this.renderCamera(root);
                };
                img.onerror = fail;
                img.src = src;
            });
            bar.append(roll, shoot, text('span', 'cam-mode', 'foto'));
            root.append(vf, note, bar);
            return;
        }

        const develop = () => processPhoto(draft.img, { filter: draft.filter, letterbox: draft.letterbox, caption: draft.caption });
        const preview = el('img', 'cam-preview');
        preview.alt = 'anteprima dello scatto';
        preview.src = develop();

        const filters = el('div', 'os-seg');
        const paintFilters = () => {
            filters.replaceChildren();
            for (const f of PHOTO_FILTERS) {
                const b = el('button', f.id === draft.filter ? 'on' : '');
                b.textContent = f.name;
                b.setAttribute('aria-pressed', String(f.id === draft.filter));
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

        const options = el('div', 'os-group');
        options.append(switchCell('mascherino da cinema', () => draft.letterbox, (v) => {
            draft.letterbox = v;
            preview.src = develop();
        }));
        const captionCell = el('label', 'os-cell');
        const caption = el('input', 'os-input');
        caption.type = 'text';
        caption.maxLength = 60;
        caption.placeholder = 'scrivi una didascalia';
        caption.value = draft.caption;
        caption.setAttribute('aria-label', 'didascalia della foto');
        caption.addEventListener('input', () => {
            draft.caption = caption.value;
        });
        caption.addEventListener('change', () => {
            preview.src = develop();
        });
        caption.addEventListener('keydown', (e) => e.stopPropagation());
        captionCell.append(caption);
        options.append(captionCell);

        const actions = el('div', 'os-actions');
        actions.append(
            button('butta', 'ghost', () => {
                this.photoDraft = null;
                this.renderCamera(root);
            }),
            button('salva in galleria', 'fill', () => {
                const url = develop();
                const done = savePhoto({ levelId: state.save.levelId, filter: draft.filter, caption: draft.caption, dataUrl: url });
                if (!done) {
                    // rullino bloccato: lo scatto si scarica subito, non si perde
                    const dl = document.createElement('a');
                    dl.href = url;
                    dl.download = `gecowave-${Date.now().toString(36)}.jpg`;
                    dl.click();
                    this.toast('rullino bloccato: scatto scaricato al volo.', false);
                    return;
                }
                sfx.unlock();
                this.photoDraft = null;
                this.galleryOpen = done.id;
                this.openApp('galleria');
            }),
        );
        root.append(preview, filters, options, actions);
    }

    private renderGallery(root: HTMLElement): void {
        root.replaceChildren();
        const photos = listPhotos();
        const openId = this.galleryOpen;
        this.galleryOpen = null;
        if (!photos.length) {
            this.chrome('GALLERIA', 'scatti dal realm, da portare via');
            const hole = empty('fotocamera', 'rullino vuoto', 'il realm posa sempre: fai il primo scatto.');
            hole.append(button('apri la fotocamera', 'fill', () => this.openApp('fotocamera')));
            root.append(hole);
            return;
        }
        const open = openId ? photos.find((p) => p.id === openId) ?? photos[0] : null;
        if (open) {
            this.stack.push(() => this.renderGallery(root));
            this.chrome(null);
            const view = el('div', 'ph-viewer');
            const img = el('img', 'ph-photo');
            img.src = open.dataUrl;
            img.alt = open.caption || 'scatto dal realm';
            view.append(img);
            if (open.caption) view.append(text('div', 'ph-caption', open.caption));
            view.append(text('div', 'ph-meta', `${since(open.at) === 'ora' ? 'adesso' : `${since(open.at)} fa`}, filtro ${open.filter}`));
            const actions = el('div', 'os-actions');
            const dl = el('a', 'os-btn fill');
            dl.textContent = 'scarica';
            dl.href = open.dataUrl;
            dl.download = `gecowave-${open.id}.jpg`;
            actions.append(
                button('strappa', 'danger', () => {
                    deletePhoto(open.id);
                    this.stack.pop();
                    this.renderGallery(root);
                }),
                dl,
            );
            view.append(actions);
            root.append(view);
            return;
        }
        this.chrome('GALLERIA', `${photos.length} ${photos.length === 1 ? 'scatto' : 'scatti'} nel rullino`);
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

    private renderInventory(root: HTMLElement): void {
        root.replaceChildren();
        const consumables = Object.entries(state.save.inventory).filter(([id, n]) => n > 0 && ITEMS[id]);
        const keys = Object.values(ITEMS).filter((it) => it.kind === 'chiave' && it.flag && state.hasFlag(it.flag));

        root.append(heading('da usare', consumables.length ? `${consumables.reduce((n, [, q]) => n + q, 0)} pezzi` : ''));
        if (consumables.length === 0) {
            const hole = empty('zaino', 'zaino vuoto', 'wavezon consegna ovunque, anche qui.');
            hole.append(button('apri wavezon', 'fill', () => this.openApp('wavezon')));
            root.append(hole);
        } else {
            const grid = el('div', 'slot-grid');
            for (const [id, n] of consumables) grid.append(this.slot(ITEMS[id], n, () => this.itemSheet(ITEMS[id], n)));
            root.append(grid);
        }

        if (keys.length) {
            root.append(heading('oggetti chiave'));
            const grid = el('div', 'slot-grid');
            for (const it of keys) grid.append(this.slot(it, 0, () => this.itemSheet(it, 0)));
            root.append(grid);
        }

        root.append(heading('collezione'));
        const lore = state.save.collectedLore;
        const tiles = el('div', 'os-tiles three');
        tiles.append(
            tile('maschere', `${lore.filter((k) => k.startsWith('maschera-')).length}/${TOTAL_MASCHERE}`),
            tile('cuori', String(lore.filter((k) => k.startsWith('cuore-')).length)),
            tile('pagine', String(lore.filter((k) => !k.startsWith('mic-') && !k.startsWith('maschera-') && !k.startsWith('cuore-') && !k.startsWith('item-') && !k.startsWith('charm-')).length)),
        );
        root.append(tiles);
    }

    private slot(it: ItemDef, qty: number, onPick: () => void): HTMLElement {
        const s = el('button', 'slot');
        s.setAttribute('aria-label', it.name);
        s.append(text('span', 'emoji', it.icon));
        if (qty > 1) s.append(text('span', 'qty', String(qty)));
        s.addEventListener('click', () => {
            sfx.ui();
            onPick();
        });
        return s;
    }

    /** la testa di ogni foglio di dettaglio: icona grande, nome, descrizione, battuta */
    private itemHead(box: HTMLElement, it: ItemDef, kicker: string): void {
        const head = el('div', 'sheet-head');
        const words = el('div', 'words');
        words.append(text('div', 'kicker', kicker), text('div', 'name', it.name));
        head.append(text('span', 'emoji', it.icon), words);
        box.append(head, text('p', 'desc', it.desc));
        if (it.punch) box.append(text('p', 'punch', it.punch));
    }

    private itemSheet(it: ItemDef, qty: number): void {
        this.sheet((box) => {
            this.itemHead(box, it, it.kind === 'consumabile' ? `ne hai ${qty}` : 'oggetto chiave');
            if (it.kind !== 'consumabile') return;
            const problem = eatProblem(it.id);
            const use = button('usa adesso', 'fill', () => {
                // il telefono si chiude e il mondo riparte: il boccone vive lì
                bus.emit('eat-requested', { id: it.id });
                this.close();
            });
            if (problem) {
                (use as HTMLButtonElement).disabled = true;
                box.append(text('p', 'sheet-note bad', problem));
            } else {
                box.append(text('p', 'sheet-note', 'il telefono si chiude e mangi: il boccone vuole tempo.'));
            }
            box.append(use);
        });
    }

    /* ---------- amuleti ---------- */

    private renderCharms(root: HTMLElement): void {
        root.replaceChildren();
        const used = state.usedNotches;
        const total = state.save.notches;
        const owned = state.save.charms.map((id) => ITEMS[id]).filter(Boolean);
        const worn = owned.filter((it) => state.isEquipped(it.id));

        // l'assetto in cima: cosa indossi e quante tacche restano
        const load = el('div', 'loadout');
        const top = el('div', 'top');
        top.append(text('span', 'label', 'tacche'), text('span', 'value', `${used}/${total}`));
        const notches = el('div', 'notches');
        for (let i = 0; i < total; i++) notches.append(el('i', i < used ? 'used' : ''));
        const wornRow = el('div', 'worn');
        if (worn.length === 0) wornRow.append(text('span', 'none', 'non indossi niente'));
        for (const it of worn) wornRow.append(text('span', 'emoji', it.icon));
        load.append(top, notches, wornRow);
        root.append(load);
        root.append(text('div', `os-banner ${state.run.nearMic ? 'good' : ''}`,
            state.run.nearMic ? 'sei vicino a un microfono: puoi cambiarli.' : 'si cambiano solo vicino a un microfono. intanto puoi guardarli.'));

        if (owned.length === 0) {
            root.append(empty('amuleti', 'nessun amuleto', 'i boss li lasciano cadere, wavezon li vende.'));
            return;
        }
        root.append(heading('i tuoi amuleti', `${owned.length}`));
        const grid = el('div', 'slot-grid');
        for (const it of owned) {
            const s = this.slot(it, 0, () => this.charmSheet(root, it));
            if (state.isEquipped(it.id)) {
                s.classList.add('equipped');
                s.append(glyph('check', 'gl mark'));
            }
            const pips = el('span', 'pips');
            for (let i = 0; i < (it.cost ?? 0); i++) pips.append(el('i'));
            s.append(pips);
            grid.append(s);
        }
        root.append(grid);
    }

    private charmSheet(root: HTMLElement, it: ItemDef): void {
        this.sheet((box) => {
            this.itemHead(box, it, `costa ${it.cost} ${it.cost === 1 ? 'tacca' : 'tacche'}`);
            const note = text('p', 'sheet-note', '');
            const toggle = button('', 'fill', () => {
                const err = state.toggleCharm(it.id);
                if (!err) {
                    sfx.checkpoint();
                    bus.emit('hp-changed', { hp: state.run.hp, maxHp: state.maxHp, hurt: false });
                    this.renderCharms(root);
                }
                note.textContent = err ?? (state.isEquipped(it.id) ? 'indossato.' : 'tolto.');
                note.className = `sheet-note ${err ? 'bad' : 'good'}`;
                paint();
            });
            const paint = () => {
                toggle.textContent = state.isEquipped(it.id) ? 'togli' : 'indossa';
            };
            paint();
            box.append(note, toggle);
        });
    }

    /* ---------- wavezon ---------- */

    private renderShop(root: HTMLElement): void {
        root.replaceChildren();
        const wallet = el('div', 'wallet');
        wallet.append(text('span', 'label', 'il tuo saldo'), text('span', 'value', `♪ ${state.save.barre}`), text('span', 'sub', 'le barre servono a due cose: curarti e costruirti.'));
        root.append(wallet);

        const buy = (id: string, label: string, price: number, give: () => void) => {
            // in due la cassa è una sola: compra l'host, per tutti e due
            if (coop.isGuest && coop.active) {
                coop.session?.send('shop-buy', { id });
                sfx.barra();
                this.toast(`${label}: ordine mandato alla cassa.`, true);
                return;
            }
            if (state.save.barre < price) {
                this.toast('barre insufficienti. il realm non fa credito.', false);
                return;
            }
            state.save.barre -= price;
            give();
            state.persist();
            sfx.barra();
            bus.emit('barre-changed', { barre: state.save.barre, gained: false });
            this.toast(`${label}: consegnato.`, true);
        };

        const product = (it: ItemDef, price: number, owned: boolean, give: () => void): HTMLElement => {
            const card = el('button', 'product');
            card.append(text('span', 'emoji', it.icon), text('span', 'name', it.name), text('span', 'desc', it.desc));
            card.append(text('span', `price${owned ? ' owned' : state.save.barre < price ? ' short' : ''}`, owned ? 'già tuo' : `♪ ${price}`));
            if (owned) {
                card.disabled = true;
                return card;
            }
            card.addEventListener('click', () => {
                sfx.ui();
                this.sheet((box, close) => {
                    this.itemHead(box, it, `♪ ${price}`);
                    const short = state.save.barre < price;
                    if (short) box.append(text('p', 'sheet-note bad', `ti mancano ${price - state.save.barre} barre.`));
                    const pay = button(`compra per ♪ ${price}`, 'fill', () => {
                        close();
                        buy(it.id, it.name, price, give);
                    });
                    (pay as HTMLButtonElement).disabled = short;
                    box.append(pay);
                });
            });
            return card;
        };

        const stock = SHOP_STOCK.map((id) => ITEMS[id]).filter((it) => it?.price);
        const shelves: [string, ItemDef[]][] = [
            ['cure', stock.filter((it) => it.kind !== 'amuleto')],
            ['amuleti', stock.filter((it) => it.kind === 'amuleto')],
        ];
        for (const [name, items] of shelves) {
            if (!items.length) continue;
            root.append(heading(name));
            const grid = el('div', 'products');
            for (const it of items) grid.append(product(it, it.price!, it.kind === 'amuleto' && state.hasCharm(it.id), () => state.addItem(it.id)));
            root.append(grid);
        }

        const bought = state.save.notches - BASE_NOTCHES;
        if (bought < NOTCH_PRICES.length) {
            root.append(heading('potenziamenti'));
            const grid = el('div', 'products');
            grid.append(product(ITEMS.tacca, NOTCH_PRICES[bought], false, () => state.addItem('tacca')));
            root.append(grid);
        }
    }

    /* ---------- mappa ---------- */

    private renderMap(root: HTMLElement): void {
        root.replaceChildren();
        const hasRegion = regionView.layout !== null && regionView.id === state.save.levelId;
        const tab = this.tabOf.mappa ?? (hasRegion ? 'zona' : 'realm');
        this.tabbar([
            { id: 'zona', label: 'qui', glyph: 'mappa' },
            { id: 'realm', label: 'il realm', glyph: 'globo' },
        ], tab, (id) => {
            this.tabOf.mappa = id;
            this.renderMap(root);
        });
        if (tab === 'zona') {
            if (hasRegion) this.renderRegionMap(root);
            else root.append(empty('mappa', 'niente mappa qui', 'questa zona non si lascia disegnare. guarda il realm intero.'));
            return;
        }
        this.renderRealm(root);
    }

    /** la regione in corso: si vede solo dove sei passato, più il contorno dei varchi accanto */
    private renderRegionMap(root: HTMLElement): void {
        const L = regionView.layout;
        if (!L || regionView.id !== state.save.levelId) return;
        const lv = LEVELS[regionView.id];
        const explored = new Set(state.save.explored[regionView.id] ?? []);
        const ns = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(ns, 'svg');
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
        // si inquadra solo dove sei passato: tutta la regione in miniatura non si legge
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for (const room of L.rooms) {
            if (!explored.has(room.id) && !near.has(room.id)) continue;
            const R = room.rect;
            x0 = Math.min(x0, R.x); y0 = Math.min(y0, R.y);
            x1 = Math.max(x1, R.x + R.w); y1 = Math.max(y1, R.y + R.h);
        }
        if (x0 > x1) { x0 = 0; y0 = 0; x1 = L.cols; y1 = L.rows; }
        const pad = 10;
        svg.setAttribute('viewBox', `${x0 - pad} ${y0 - pad} ${x1 - x0 + pad * 2} ${y1 - y0 + pad * 2}`);
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
            // il 33 azzurro barrato di viola: solo stanze viste, mai dopo l'apertura
            if (m.kind === 'seal') {
                const t = add('text', { x: m.x / T, y: m.y / T + 2, 'text-anchor': 'middle', 'font-size': 9, fill: '#7dd3fc', class: 'seal-33' });
                t.textContent = '33';
                add('line', { x1: m.x / T - 7, y1: m.y / T + 4, x2: m.x / T + 7, y2: m.y / T + 2, stroke: '#c084fc', 'stroke-width': 1.4 });
            }
        }
        const goal = regionView.goal;
        if (goal) {
            const star = add('text', { x: goal.x / T, y: goal.y / T + 5, 'text-anchor': 'middle', 'font-size': 16, fill: '#f87171' });
            star.textContent = '✶';
        }
        if (regionView.player) {
            add('circle', { cx: regionView.player.x / T, cy: regionView.player.y / T, r: 4.5, fill: '#fff', stroke: accent, 'stroke-width': 2, class: 'here' });
        }
        this.chrome(lv ? lv.accentWord.toUpperCase() : 'MAPPA', `${explored.size} stanze viste su ${L.rooms.length}`);
        const map = el('div', 'region-map');
        map.append(svg);
        root.append(map);
        if (goal) {
            const g = el('div', 'os-banner goal');
            g.append(text('b', '', '✶'), text('span', '', `obiettivo: ${goal.label}`));
            root.append(g);
        }
        const legend = el('div', 'legend');
        for (const [cls, label] of [['you', 'tu'], ['mic', 'microfono'], ['exit', 'uscita'], ['door', 'varco']]) {
            const k = el('span', 'key');
            k.append(el('i', cls), text('span', '', label));
            legend.append(k);
        }
        root.append(legend);
        // completamento del capitolo: gli stessi numeri del riepilogo di fine livello
        const comp = regionView.id ? chapterCompletion(regionView.id) : null;
        if (comp) {
            const tiles = el('div', 'os-tiles three');
            tiles.append(
                tile('esplorato', comp.total > 0 ? `${comp.percent}%` : '—', comp.total > 0 ? `${comp.visited}/${comp.total}` : ''),
                tile('cuori', comp.hearts.total > 0 ? `${comp.hearts.found}/${comp.hearts.total}` : '—'),
                tile('segreti', `${comp.things.found}/${comp.things.total}`),
            );
            root.append(tiles);
        }
        // i 33 letti nel mondo: aperti su visti, senza dire quanti ne restano
        const seals = L.seals ?? [];
        const visti = seals.filter((s) => state.hasFlag(`visto-sigillo-${s.id}`)).length;
        if (visti > 0) {
            const aperti = seals.filter((s) => state.hasFlag(`sigillo-${s.id}`)).length;
            const g = el('div', 'os-group');
            g.append(cell({ name: '33 letti', trail: `${aperti}/${visti}` }));
            root.append(g);
        }
    }

    /** tutti i capitoli in fila, dal primo all'ultimo: una linea del tempo, non un disegno */
    private renderRealm(root: HTMLElement): void {
        const seenCount = LEVEL_ORDER.filter((id) => id === state.save.levelId || state.hasFlag(`visto-${id}`)).length;
        this.chrome('IL REALM', `${seenCount} ${seenCount === 1 ? 'capitolo visto' : 'capitoli visti'} su ${LEVEL_ORDER.length}`);
        const line = el('div', 'timeline');
        for (const id of LEVEL_ORDER) {
            const lv = LEVELS[id];
            const here = state.save.levelId === id;
            const seen = here || state.hasFlag(`visto-${id}`);
            const row = el('button', `stop${seen ? '' : ' locked'}${here ? ' here' : ''}`);
            row.style.setProperty('--app', ZONE_CSS[lv.color]);
            const node = el('span', 'node');
            if (!seen) node.append(glyph('lucchetto'));
            const words = el('span', 'words');
            words.append(text('span', 'name', seen ? lv.accentWord : '???'), text('span', 'sub', seen ? lv.title.toLowerCase() : 'non ci sei ancora stato'));
            row.append(node, words);
            if (here) row.append(text('span', 'os-pill', 'sei qui'));
            else if (seen) {
                const comp = chapterCompletion(id);
                if (comp && comp.total > 0) row.append(text('span', 'pct', `${comp.percent}%`));
            }
            if (!seen) row.disabled = true;
            else row.addEventListener('click', () => {
                sfx.ui();
                this.sheet((box) => {
                    const head = el('div', 'sheet-head');
                    const words2 = el('div', 'words');
                    words2.append(text('div', 'kicker', lv.title.toLowerCase()), text('div', 'name', lv.accentWord));
                    const dot = el('span', 'node big');
                    dot.style.setProperty('--app', ZONE_CSS[lv.color]);
                    head.append(dot, words2);
                    box.append(head, text('p', 'desc', lv.punchline));
                    const comp = chapterCompletion(id);
                    const tiles = el('div', 'os-tiles three');
                    tiles.append(
                        tile('esplorato', comp && comp.total > 0 ? `${comp.percent}%` : '—'),
                        tile('cuori', comp && comp.hearts.total > 0 ? `${comp.hearts.found}/${comp.hearts.total}` : '—'),
                        tile('segreti', comp ? `${comp.things.found}/${comp.things.total}` : '—'),
                    );
                    box.append(tiles);
                    const mask = state.save.collectedLore.includes(`maschera-${id}`);
                    box.append(text('p', `sheet-note ${mask ? 'good' : ''}`, mask ? 'maschera trovata.' : 'qui potrebbe esserci una maschera.'));
                });
            });
            line.append(row);
        }
        root.append(line);
    }

    /* ---------- diario ---------- */

    private renderJournal(root: HTMLElement): void {
        const lv = LEVELS[state.save.levelId];
        const hero = el('div', 'hero');
        hero.append(
            text('span', 'kicker', lv ? `${lv.title.toLowerCase()} ${lv.accentWord}` : 'da qualche parte'),
            text('p', 'text', formatKeys(OBJECTIVES[state.save.levelId] ?? 'vai avanti. il realm non si salva da solo.')),
        );
        const frag = el('div', 'frag');
        frag.append(text('span', '', 'frammenti della gecowave'), text('b', '', `${state.save.abilities.length}/${TOTAL_FRAGMENTS}`));
        hero.append(frag, meter(state.save.abilities.length, TOTAL_FRAGMENTS));
        root.append(hero);

        // le missioni dei passanti accettate, con lo stato
        const mine = QUESTS.filter((q) => state.save.quests[q.id]);
        if (mine.length) {
            root.append(heading('missioni dei passanti', `${mine.filter((q) => state.save.quests[q.id].s === 'fatta').length}/${mine.length}`));
            const list = el('div', 'os-group');
            for (const q of mine) {
                const st = state.save.quests[q.id];
                const where = LEVELS[q.region];
                const how = st.s === 'fatta' ? 'completata' : st.s === 'pronta' ? 'torna da chi te l\'ha chiesto'
                    : q.kind === 'caccia' && q.hunt ? `${st.n}/${q.hunt.count} ${q.hunt.label}`
                    : q.kind === 'cerca' ? `cerca: ${q.thing?.name} (stanze laterali)` : `porta ${q.thing?.name} a ${q.recipient?.name}`;
                const row = cell({ name: q.title, sub: `${where?.accentWord ?? q.region}, ${how}`, lines: 2 });
                row.append(text('span', `os-pill ${st.s === 'fatta' ? 'done' : st.s === 'pronta' ? 'ready' : ''}`, st.s === 'fatta' ? 'fatta' : st.s === 'pronta' ? 'pronta' : 'in corso'));
                if (st.s === 'fatta') row.classList.add('dim');
                list.append(row);
            }
            root.append(list);
        }

        const lore = state.save.collectedLore;
        const quests: { name: string; done: number; total: number; show: boolean }[] = [
            { name: 'maschere del primo custode', done: lore.filter((k) => k.startsWith('maschera-')).length, total: TOTAL_MASCHERE, show: true },
            { name: 'amuleti', done: state.save.charms.length, total: Object.values(ITEMS).filter((i) => i.kind === 'amuleto').length, show: true },
            { name: 'il caso analisi 1', done: ['indizio-1', 'indizio-2', 'indizio-3'].filter((f) => state.hasFlag(f)).length, total: 3, show: state.hasFlag('visto-caso') },
            { name: 'la quest di walter baruffoni', done: ['boss-down-maranza', 'boss-down-maranzone', 'boss-down-istruttore', 'boss-down-annascrivania', 'boss-down-walter'].filter((f) => state.hasFlag(f)).length, total: 5, show: state.hasFlag('visto-galliate') },
            { name: 'il quaderno strappato di pedro', done: lore.filter((k) => k.startsWith('pagina-pedro-')).length, total: TOTAL_PAGES, show: lore.some((k) => k.startsWith('pagina-pedro-')) },
            { name: 'storie sparse del realm', done: lore.filter((k) => k.startsWith('nota-')).length, total: TOTAL_NOTES, show: lore.some((k) => k.startsWith('nota-')) },
        ];
        root.append(heading('il resto della vita'));
        const tiles = el('div', 'os-tiles two');
        for (const q of quests.filter((q) => q.show)) {
            const t = tile(q.name, `${q.done}/${q.total}`);
            t.append(meter(q.done, q.total));
            if (q.done >= q.total) t.classList.add('done');
            tiles.append(t);
        }
        root.append(tiles);
    }

    /* ---------- codex: note, pagine, misteri in ordine ---------- */

    private renderCodex(root: HTMLElement): void {
        const sections = codexSections(state.save.collectedLore, (f) => state.hasFlag(f));
        if (!sections.length) {
            root.append(empty('taccuino', 'ancora niente da rileggere', 'esplora le stanze laterali: chi cerca, legge.'));
            return;
        }
        root.append(text('div', 'os-banner', CODEX_HINT));
        for (const s of sections) {
            const found = s.entries.filter((e) => e.collected).length;
            root.append(heading(s.title, `${found}/${s.entries.length}`), text('div', 'os-sub', s.sub));
            const list = el('div', 'os-group');
            for (const e of s.entries) {
                const lines = e.collected ? DIALOGUES[e.id] : undefined;
                const row = cell({
                    tag: 'button',
                    lead: glyph(e.collected ? 'nota' : 'lucchetto', `gl lead-gl${e.collected ? ' on' : ''}`),
                    name: e.collected ? e.title : `${e.title.split('—')[0].trim()}, ???`,
                    sub: e.collected ? (lines?.[0]?.text ?? '') : 'non ancora trovato.',
                    trail: lines ? '›' : undefined,
                });
                if (lines) {
                    row.addEventListener('click', () => {
                        sfx.ui();
                        this.sheet((box) => {
                            box.classList.add('reader');
                            box.append(text('div', 'reader-title', e.title));
                            for (const l of lines) {
                                const p = el('p', 'line');
                                p.append(text('b', '', l.speaker), document.createTextNode(l.text));
                                box.append(p);
                            }
                        });
                    });
                } else (row as HTMLButtonElement).disabled = true;
                list.append(row);
            }
            root.append(list);
        }
    }

    /* ---------- radio ---------- */

    private renderRadio(root: HTMLElement): void {
        root.replaceChildren();
        const current = state.save.radio;
        const at = RADIO.findIndex((r) => r.file === current);
        const track = at >= 0 ? RADIO[at] : null;
        const tune = (file: string | null) => {
            music.setRadio(file);
            sfx.ui();
            this.renderRadio(root);
        };

        const player = el('div', 'player');
        player.append(el('div', 'cover', '<span class="eq"><i></i><i></i><i></i><i></i><i></i></span>'));
        player.append(text('div', 'freq', track ? 'radio gecowave 99.2' : 'in onda adesso'));
        player.append(text('div', 'title', track ? track.title : 'la musica del capitolo'));
        player.append(text('div', 'artist', track ? track.artist : 'quella che suona dove sei'));
        const controls = el('div', 'controls');
        const step = (dir: number) => tune(RADIO[(at + dir + RADIO.length) % RADIO.length].file);
        const prev = el('button', 'round-btn');
        prev.setAttribute('aria-label', 'brano precedente');
        prev.append(glyph('indietro'));
        prev.addEventListener('click', () => step(at < 0 ? 0 : -1));
        const next = el('button', 'round-btn');
        next.setAttribute('aria-label', 'brano successivo');
        next.append(glyph('avanti'));
        next.addEventListener('click', () => step(at < 0 ? 0 : 1));
        const auto = el('button', `round-btn big${track ? '' : ' on'}`);
        auto.setAttribute('aria-label', 'torna alla musica del capitolo');
        auto.setAttribute('aria-pressed', String(!track));
        auto.append(glyph('musica'));
        auto.addEventListener('click', () => tune(null));
        controls.append(prev, auto, next);
        player.append(controls);
        root.append(player);

        root.append(heading('scaletta', `${RADIO.length} brani`));
        const list = el('div', 'os-group');
        RADIO.forEach((r, i) => {
            const on = r.file === current;
            const lead = on ? el('span', 'eq small', '<i></i><i></i><i></i>') : text('span', 'num', String(i + 1));
            const row = cell({ tag: 'button', lead, name: r.title, sub: r.artist });
            if (on) row.classList.add('on');
            row.addEventListener('click', () => tune(r.file));
            list.append(row);
        });
        root.append(list);
    }

    /* ---------- profilo ---------- */

    private renderProfile(root: HTMLElement): void {
        this.chrome(null);
        const card = el('div', 'profile');
        card.append(
            avatar('🦎', 'green', 'huge'),
            text('div', 'pname', state.save.playerName),
            text('div', 'role', state.hasFlag('quaderno-completo') ? 'custode della gecowave' : 'custode provvisorio della gecowave'),
        );
        root.append(card);

        const build = el('div', 'os-tiles three');
        build.append(
            tile('forza', String(state.save.stats.forza)),
            tile('costituzione', String(state.save.stats.costituzione)),
            tile('flusso', String(state.save.stats.flusso)),
        );
        root.append(build);

        const r = state.save.record;
        const hours = Math.floor(r.playMs / 3600000);
        const mins = Math.floor((r.playMs % 3600000) / 60000);
        const pair = el('div', 'os-tiles two');
        pair.append(
            tile('vita massima', String(state.maxHp)),
            tile('tempo nel realm', `${hours}h ${mins}m`),
        );
        root.append(pair);

        root.append(heading('il conto'));
        const lines: [string, string][] = [
            ['nemici abbattuti', String(r.kills)],
            ['boss sconfitti', String(r.bosses)],
            ['morti', String(r.deaths)],
            ['punteggio totale', Object.values(state.save.scores).reduce((n, sc) => n + sc.score, 0).toLocaleString('it-IT')],
            ['trofei', `${state.save.achievements.length}`],
        ];
        const list = el('div', 'os-group');
        for (const [k, v] of lines) list.append(cell({ name: k, trail: v }));
        root.append(list);

        root.append(heading('le tue wave', `${state.abilities.length}/${TOTAL_FRAGMENTS}`));
        if (state.abilities.length === 0) {
            root.append(text('div', 'os-banner', 'ancora nessuna. markolino ti guarda deluso.'));
            return;
        }
        const waves = el('div', 'os-group');
        for (const a of state.abilities) {
            const card2 = ABILITY_CARDS[a];
            const row = cell({ name: card2.name, sub: formatKeys(card2.desc), lines: 3 });
            row.append(text('kbd', 'os-key', formatKeys(card2.key)));
            waves.append(row);
        }
        root.append(waves);
    }

    /* ---------- impostazioni ---------- */

    private renderSettings(root: HTMLElement): void {
        root.append(heading('audio'));
        const audio = el('div', 'os-group');
        const vol = el('label', 'os-cell');
        const slider = el('input', 'os-range');
        slider.type = 'range';
        slider.min = '0';
        slider.max = '1';
        slider.step = '0.05';
        slider.value = String(state.settings.volume);
        slider.setAttribute('aria-label', 'volume');
        const fill = () => slider.style.setProperty('--fill', `${Number(slider.value) * 100}%`);
        fill();
        slider.addEventListener('input', () => {
            state.settings.volume = Number(slider.value);
            state.persistSettings();
            sfx.setVolume(state.settings.volume);
            music.setVolume(state.settings.volume);
            fill();
        });
        vol.append(text('span', 'name', 'volume'), slider);
        audio.append(vol);
        root.append(audio);

        root.append(heading('sensazioni'));
        const feel = el('div', 'os-group');
        feel.append(
            switchCell('screen shake', () => state.settings.screenShake, (v) => {
                state.settings.screenShake = v;
                state.persistSettings();
            }),
            switchCell('effetti di camera', () => state.settings.cameraFx, (v) => {
                state.settings.cameraFx = v;
                state.persistSettings();
            }),
            switchCell('vibrazione del pad', () => state.settings.rumble, (v) => {
                state.settings.rumble = v;
                state.persistSettings();
                if (v) haptics.rumble(0.3, 0.5, 160);
                else haptics.stop();
            }),
        );
        root.append(feel);

        root.append(heading('aiuto'));
        const help = el('div', 'os-group');
        help.append(assistToggle({ rowClass: 'os-cell' }));
        root.append(help);

        root.append(heading('comandi del telefono'));
        const keys = el('div', 'os-group');
        for (const [k, v] of [['apri e chiudi', keyLabel('phone')], ['indietro', keyLabel('pause')], ['mangia al volo', keyLabel('eat')]]) {
            const row = cell({ name: k });
            row.append(text('kbd', 'os-key', v.toLowerCase()));
            keys.append(row);
        }
        root.append(keys);
    }
}
