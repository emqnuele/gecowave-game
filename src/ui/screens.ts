import { ZONE_CSS } from '../config';
import { ACHIEVEMENTS } from '../content/achievements';
import { buildTrophyCabinet } from './trophies';
import { loadBoard } from '../engine/score';
import { assistToggle } from './assist';
import { LEVELS, LEVEL_ORDER } from '../content/levels';
import { ITEMS } from '../content/items';
import { ABILITY_CARDS, CREDITS, deathPunchline } from '../content/story';
import { bus } from '../engine/events';
import { sfx } from '../engine/sfx';
import { state } from '../engine/state';
import { music } from '../engine/music';
import type { ZoneColor } from '../types';
import { el, ui } from './dom';
import { phoneBanner } from './banner';
import './souls.css';

export interface GameController {
    newGame(): void;
    continueGame(): void;
    retry(): void;
    pause(): void;
    resume(): void;
    quitToMenu(): void;
    /** viaggia a un capitolo già visitato (per segreti e maschere persi) */
    travel(levelId: string): void;
}

const CONTROLS: [string, string][] = [
    ['muoviti', 'A / D'],
    ['salta (e rimbalzo a mezz\'aria)', 'SPAZIO'],
    ['attacca — 3 colpi = combo', 'J / clic'],
    ['attacca in alto', 'W+J in aria'],
    ['schianto (sfonda muri e nemici)', 'attacca mentre cadi'],
    ['scivolata', 'SHIFT / K'],
    ['colpo risonante (carica)', 'F tieni premuto'],
    ['riflesso distorto', 'G'],
    ['analisi 1', 'H'],
    ['tommasoscudo', 'R'],
    ['cura (tieni premuto)', 'Q'],
    ['interagisci', 'E'],
    ['telefono: zaino, amuleti, mappa', 'TAB / P'],
    ['mangia al volo', 'C'],
    ['pausa', 'ESC'],
];

interface MenuItem {
    label: string;
    onPick: () => void;
    sub?: string;
    danger?: boolean;
    small?: boolean;
    /** suono di ritorno invece di quello di scelta */
    back?: boolean;
}

/* il menu e le pagine come un codice a inchiostro: serif da stampa antica,
   voci di testo con la fiammella, tastiera ovunque (frecce, invio, esc).
   la voce del gioco (battute a pennarello) resta dentro la cornice */

export class Screens {
    private controller!: GameController;
    private overlay: HTMLElement | null = null;
    private bg: HTMLElement;
    private blobs: HTMLElement[] = [];
    private navHandler: ((e: KeyboardEvent) => void) | null = null;
    private escHandler: ((e: KeyboardEvent) => void) | null = null;
    /** la scena del falò dietro al menu: la accende e la spegne main */
    private backdrop: (on: boolean) => void = () => {};
    /** il primo menu dopo l'avvio chiede un tasto: sblocca l'audio ed è un ingresso */
    private awake = false;

    constructor() {
        this.bg = el('div');
        this.bg.style.cssText = 'position:fixed;inset:0;overflow:hidden;background:#000;';
        for (let i = 0; i < 2; i++) {
            const blob = el('div', 'glass-ambient');
            blob.style.cssText += `width:55vmin;height:55vmin;${i ? 'right:-10vmin;bottom:-10vmin' : 'left:-10vmin;top:-10vmin'};animation-delay:${i * -9}s;`;
            this.blobs.push(blob);
            this.bg.append(blob);
        }
        document.body.prepend(this.bg);
        // il filtro che fa sbavare l'inchiostro dei titoli
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        defs.setAttribute('width', '0');
        defs.setAttribute('height', '0');
        defs.style.position = 'absolute';
        defs.innerHTML = '<filter id="sx-ink" x="-5%" y="-20%" width="110%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="0.035 0.09" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="2.6"/></filter>';
        document.body.append(defs);
        // oro all'avvio: coerente col menu, niente flash verde prima del boot
        this.setZone('yellow');

        bus.on('zone-changed', ({ title, accentWord, color, punchline, showCard }) => {
            this.setZone(color);
            if (showCard) this.zoneCard(title, accentWord, color, punchline);
        });
        bus.on('toast', ({ text }) => this.toast(text));
        bus.on('wavesung', ({ sender, text }) => this.wavesung(sender, text));
        bus.on('player-died', ({ lost, score }) => this.showDeath(lost, score));
        bus.on('ability-unlocked', ({ ability }) => this.abilityCard(ability));
        bus.on('charm-found', ({ id }) => this.charmCard(id));
        bus.on('achievement', ({ id }) => this.trophy(id));
        bus.on('travel-show', (p) => this.travelBoard(p));
        bus.on('chapter-score', (p) => this.chapterScore(p));
        bus.on('choice-show', ({ title, options, onPick }) => this.choice(title, options, onPick));
        bus.on('request-pause', () => this.showPause());
    }

    bind(controller: GameController): void {
        this.controller = controller;
    }

    setBackdrop(fn: (on: boolean) => void): void {
        this.backdrop = fn;
    }

    /* ---------- atmosfera ---------- */

    setZone(color: ZoneColor): void {
        const css = ZONE_CSS[color];
        document.documentElement.style.setProperty('--accent', css);
        this.bg.style.background = `radial-gradient(ellipse 110% 80% at 50% 110%, ${css}10, transparent 60%), #000`;
        this.blobs.forEach((b, i) => {
            b.style.background = css + (i ? '12' : '1a');
        });
    }

    /* ---------- mattoni ---------- */

    private openOverlay(cls = 'screen'): HTMLElement {
        this.closeOverlay();
        this.overlay = el('div', cls);
        ui().append(this.overlay);
        return this.overlay;
    }

    closeOverlay(): void {
        this.overlay?.remove();
        this.overlay = null;
        for (const h of [this.escHandler, this.navHandler]) if (h) window.removeEventListener('keydown', h);
        this.escHandler = null;
        this.navHandler = null;
    }

    get overlayOpen(): boolean {
        return this.overlay !== null;
    }

    get isMenuOpen(): boolean {
        return this.overlay?.classList.contains('menu-screen') ?? false;
    }

    /** ornamento tracciato a mano: due tratti, un rombo, due riccioli */
    private orn(): HTMLElement {
        const wrap = el('div', '');
        wrap.innerHTML = `<svg class="sx-orn" viewBox="0 0 420 18" aria-hidden="true"><path d="M8 9 C70 9, 120 8, 186 9"/><path d="M234 9 C300 10, 350 9, 412 9"/><path d="M186 9 c6 -7 12 -7 16 0"/><path d="M234 9 c-6 7 -12 7 -16 0"/><rect class="gem" x="205" y="4" width="10" height="10" transform="rotate(45 210 9)"/><circle class="gem" cx="8" cy="9" r="1.6"/><circle class="gem" cx="412" cy="9" r="1.6"/></svg>`;
        return wrap.firstElementChild as HTMLElement;
    }

    private heading(title: string, sub?: string): HTMLElement[] {
        const out: HTMLElement[] = [el('h2', 'sx-h', title), this.orn()];
        if (sub) {
            const s = el('div', 'sx-sub');
            s.textContent = sub;
            out.splice(1, 0, s);
        }
        return out;
    }

    private item(o: MenuItem): HTMLElement {
        const b = el('button', `sx-item${o.danger ? ' danger' : ''}${o.small ? ' small' : ''}`);
        b.dataset.nav = '1';
        const label = el('span', 'sx-label');
        label.textContent = o.label;
        b.append(label);
        if (o.sub) {
            const s = el('span', 'sx-subline');
            s.textContent = o.sub;
            b.append(s);
        }
        b.addEventListener('click', () => {
            sfx.init();
            if (o.back) sfx.menuBack();
            else sfx.menuSelect();
            o.onPick();
        });
        return b;
    }

    private menu(items: MenuItem[], cls = ''): HTMLElement {
        const m = el('nav', `sx-menu ${cls}`);
        items.forEach((it, i) => {
            const b = this.item(it);
            b.style.animationDelay = `${0.08 * i}s`;
            m.append(b);
        });
        return m;
    }

    /** frecce e invio su tutto ciò che ha data-nav; sinistra e destra cambiano i valori */
    private bindNav(root: HTMLElement, onBack?: () => void): void {
        const list = () => [...root.querySelectorAll<HTMLElement>('[data-nav]')].filter((e) => e.offsetParent !== null && !e.hasAttribute('disabled'));
        let idx = -1;
        const focus = (i: number, sound = true) => {
            const items = list();
            if (!items.length) return;
            idx = (i + items.length) % items.length;
            items.forEach((e, k) => e.classList.toggle('on', k === idx));
            items[idx].scrollIntoView({ block: 'nearest' });
            if (sound) sfx.menuMove();
        };
        root.addEventListener('mouseover', (e) => {
            const t = (e.target as HTMLElement).closest<HTMLElement>('[data-nav]');
            if (!t) return;
            const k = list().indexOf(t);
            if (k >= 0 && k !== idx) focus(k);
        });
        this.navHandler = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement && e.code !== 'Enter' && e.code !== 'Escape') return;
            const cur = list()[idx];
            const inRow = !!cur?.closest('.sx-menu.row');
            switch (e.code) {
                case 'ArrowUp': case 'KeyW':
                    focus(idx - 1); break;
                case 'ArrowDown': case 'KeyS':
                    focus(idx + 1); break;
                case 'ArrowLeft': case 'KeyA':
                    if (inRow) focus(idx - 1);
                    else cur?.dispatchEvent(new CustomEvent('nav-left'));
                    break;
                case 'ArrowRight': case 'KeyD':
                    if (inRow) focus(idx + 1);
                    else cur?.dispatchEvent(new CustomEvent('nav-right'));
                    break;
                case 'Enter': case 'Space': case 'KeyE':
                    if (e.target instanceof HTMLInputElement) return;
                    cur?.click(); break;
                case 'Escape': case 'Backspace':
                    if (!onBack || e.target instanceof HTMLInputElement) return;
                    sfx.menuBack();
                    onBack();
                    break;
                default:
                    return;
            }
            e.preventDefault();
        };
        window.addEventListener('keydown', this.navHandler);
        requestAnimationFrame(() => focus(0, false));
    }

    /** cambia passo nella forgia senza chiudere la schermata */
    private closeNavOnly(): void {
        if (this.navHandler) window.removeEventListener('keydown', this.navHandler);
        this.navHandler = null;
    }

    /* ---------- menu principale ---------- */

    showMenu(): void {
        this.backdrop(true);
        const s = this.openOverlay('screen sx sx-clear sx-title-screen menu-screen');
        this.setZone('yellow');

        const col = el('div', 'sx-col');
        col.append(el('h1', 'sx-logo', 'Geco<span class="w">wave</span>'));
        col.append(el('div', 'sx-tagline', 'the flux of coscience'));

        const items: MenuItem[] = [];
        if (state.hasSave) {
            const lv = LEVELS[state.save.levelId];
            const min = Math.floor(state.save.record.playMs / 60000);
            const time = min >= 60 ? `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, '0')}m` : `${min}m`;
            items.push({ label: 'continua', sub: `${state.save.playerName.toLowerCase()} · ${lv ? `${lv.title.toLowerCase()} ${lv.accentWord}` : state.save.levelId} · ${time}`, onPick: () => this.controller.continueGame() });
        }
        items.push({ label: 'nuova partita', onPick: () => (state.hasSave ? this.confirmNewGame() : this.controller.newGame()) });
        if (state.hasSave || state.godMode) items.push({ label: 'capitoli', onPick: () => this.showChapters(() => this.showMenu()) });
        items.push({ label: 'bacheca', onPick: () => this.showTrophies(() => this.showMenu()) });
        items.push({ label: 'comandi', onPick: () => this.showControls(() => this.showMenu()) });
        items.push({ label: 'impostazioni', onPick: () => this.showSettings(() => this.showMenu()) });
        col.append(this.menu(items, 'left'));
        col.append(el('div', 'sx-foot', 'sviluppato da <b>emqnuele</b> · musica dei <b>gecowave</b>'));
        s.append(col);

        if (!this.awake) {
            // il titolo aspetta un tasto: è l'ingresso, e il browser sblocca l'audio
            col.classList.add('waiting');
            const splash = el('div', 'sx-splash');
            splash.append(el('h1', 'sx-logo', 'Geco<span class="w">wave</span>'), el('div', 'sx-tagline', 'the flux of coscience'), el('div', 'sx-press', 'premi un tasto'));
            s.append(splash);
            const wake = (e: Event) => {
                if (e instanceof KeyboardEvent && (e.repeat || e.code === 'Tab')) return;
                window.removeEventListener('keydown', wake, true);
                splash.removeEventListener('pointerdown', wake);
                e.preventDefault();
                e.stopPropagation();
                this.awake = true;
                sfx.init();
                sfx.awaken();
                music.playMenu();
                splash.classList.add('gone');
                col.classList.remove('waiting');
                setTimeout(() => splash.remove(), 1200);
                this.bindNav(col);
            };
            window.addEventListener('keydown', wake, true);
            splash.addEventListener('pointerdown', wake);
            return;
        }
        this.bindNav(col);
    }

    private confirmNewGame(): void {
        const s = this.openOverlay('screen sx menu-screen');
        const page = el('div', 'sx-page');
        page.append(...this.heading('nuova partita', 'il viaggio salvato andrà perduto: nome, wave, barre, scelte. il realm non ricorda due volte.'));
        page.append(this.menu([
            { label: 'ricomincia da capo', danger: true, onPick: () => this.controller.newGame() },
            { label: 'torna indietro', back: true, onPick: () => this.showMenu() },
        ]));
        s.append(page);
        this.bindNav(page, () => this.showMenu());
    }

    /* ---------- bacheca ---------- */

    private showTrophies(back: () => void): void {
        const s = this.openOverlay('screen sx menu-screen');
        const page = el('div', 'sx-page');
        page.append(...this.heading('bacheca', 'medaglie, record e il conto di ogni capitolo chiuso'));
        const body = el('div', 'sx-body');
        buildTrophyCabinet(body, { wide: true });
        page.append(body);
        const goBack = () => { this.closeOverlay(); back(); };
        page.append(this.menu([{ label: 'indietro', back: true, onPick: goBack }]));
        s.append(page);
        this.bindNav(page, goBack);
    }

    /* ---------- viaggio tra i capitoli ---------- */

    private showChapters(back: () => void): void {
        const s = this.openOverlay('screen sx menu-screen');
        const page = el('div', 'sx-page');
        page.append(...this.heading('capitoli', 'torna dove sei già stato: maschere, cuori e conti in sospeso'));

        const reachedIdx = Math.max(0, LEVEL_ORDER.indexOf(state.save.levelId));
        let maxVisitedIdx = -1;
        LEVEL_ORDER.forEach((id, idx) => {
            if (state.hasFlag(`visto-${id}`)) maxVisitedIdx = Math.max(maxVisitedIdx, idx);
        });
        const maxUnlockedIdx = Math.max(reachedIdx, maxVisitedIdx);

        const body = el('div', 'sx-body narrow');
        const items: MenuItem[] = [];
        LEVEL_ORDER.forEach((id, i) => {
            const unlocked = state.godMode || state.save.endingSeen !== null || i <= maxUnlockedIdx;
            if (!unlocked) return;
            const def = LEVELS[id];
            items.push({
                label: `${def.title.toLowerCase()} ${def.accentWord}`,
                sub: `capitolo ${i + 1}`,
                small: true,
                onPick: () => {
                    state.save.levelId = id;
                    state.save.checkpointId = null;
                    state.persist();
                    this.controller.travel(id);
                },
            });
        });
        body.append(this.menu(items));

        // capitoli segreti: appaiono solo una volta scoperti dal loro varco
        const secrets = ['barrato', 'custode', 'galliate', 'marcetti'].filter((id) => state.godMode || state.hasFlag(`visto-${id}`));
        if (secrets.length) {
            body.append(el('div', 'sx-group', 'capitoli segreti'));
            body.append(this.menu(secrets.map((id) => {
                const def = LEVELS[id];
                return {
                    label: `${def.title.toLowerCase()} ${def.accentWord}`,
                    small: true,
                    onPick: () => {
                        state.portalReturn = null;
                        state.save.levelId = id;
                        state.save.checkpointId = null;
                        state.persist();
                        this.controller.travel(id);
                    },
                };
            })));
        }
        page.append(body);
        page.append(this.menu([{ label: 'indietro', back: true, onPick: back }]));
        s.append(page);
        this.bindNav(page, back);
    }

    /* ---------- pausa ---------- */

    showPause(): void {
        if (this.overlayOpen) return;
        this.controller.pause();
        const s = this.openOverlay('screen sx');
        const page = el('div', 'sx-page');
        page.append(...this.heading('pausa'));
        const resume = () => {
            this.closeOverlay();
            this.controller.resume();
        };
        page.append(this.menu([
            { label: 'riprendi', onPick: resume },
            { label: 'comandi', onPick: () => this.showControls(() => this.showPause(), true) },
            { label: 'impostazioni', onPick: () => this.showSettings(() => this.showPause(), true) },
            { label: 'esci al menu', danger: true, onPick: () => { this.closeOverlay(); this.controller.quitToMenu(); } },
        ]), el('div', 'sx-note', 'il gioco aspetta. pedro no.'));
        s.append(page);
        this.bindNav(page, resume);
    }

    /* ---------- impostazioni ---------- */

    showSettings(back: () => void, fromPause = false): void {
        const s = this.openOverlay(`screen sx${fromPause ? '' : ' menu-screen'}`);
        const page = el('div', 'sx-page');
        page.append(...this.heading('impostazioni'));
        const body = el('div', 'sx-body narrow');

        const vol = el('div', 'sx-row');
        vol.dataset.nav = '1';
        vol.append(el('span', 'name', 'volume'));
        const slider = el('input', 'sx-range');
        slider.type = 'range';
        slider.min = '0';
        slider.max = '1';
        slider.step = '0.05';
        slider.value = String(state.settings.volume);
        const paintVol = () => slider.style.setProperty('--v', `${Number(slider.value) * 100}%`);
        const setVol = (v: number) => {
            state.settings.volume = Math.max(0, Math.min(1, Math.round(v * 20) / 20));
            slider.value = String(state.settings.volume);
            paintVol();
            state.persistSettings();
            sfx.setVolume(state.settings.volume);
            music.setVolume(state.settings.volume);
            sfx.menuMove();
        };
        paintVol();
        slider.addEventListener('input', () => setVol(Number(slider.value)));
        vol.addEventListener('nav-left', () => setVol(state.settings.volume - 0.05));
        vol.addEventListener('nav-right', () => setVol(state.settings.volume + 0.05));
        vol.append(slider);
        body.append(vol);

        const shake = el('div', 'sx-row');
        shake.append(el('span', 'name', 'scossa dello schermo'));
        const toggle = el('button', `toggle ${state.settings.screenShake ? 'on' : ''}`);
        toggle.dataset.nav = '1';
        const paintShake = () => {
            toggle.classList.toggle('on', state.settings.screenShake);
            toggle.textContent = state.settings.screenShake ? 'attiva' : 'spenta';
        };
        const flipShake = () => {
            state.settings.screenShake = !state.settings.screenShake;
            state.persistSettings();
            paintShake();
            sfx.menuMove();
        };
        paintShake();
        toggle.addEventListener('click', flipShake);
        toggle.addEventListener('nav-left', flipShake);
        toggle.addEventListener('nav-right', flipShake);
        shake.append(toggle);
        body.append(shake);

        const assist = assistToggle({ rowClass: 'sx-row' });
        assist.querySelector<HTMLElement>('.toggle')?.setAttribute('data-nav', '1');
        body.append(assist);

        const danger = el('div', 'sx-row danger');
        danger.append(el('span', 'name', 'cancella il salvataggio'));
        const reset = el('button', 'toggle');
        reset.dataset.nav = '1';
        reset.textContent = 'cancella';
        reset.style.color = ZONE_CSS.red;
        reset.addEventListener('click', () => {
            if (reset.textContent === 'cancella') {
                reset.textContent = 'sicuro?';
                sfx.menuMove();
                return;
            }
            state.reset();
            sfx.menuBack();
            this.toast('fatto. come se niente fosse mai successo.');
            this.showMenu();
        });
        danger.append(reset);
        body.append(danger);
        page.append(body);

        // chiudi prima di tornare: showPause ha una guardia su overlay aperto
        const goBack = () => { this.closeOverlay(); back(); };
        page.append(this.menu([{ label: 'indietro', back: true, onPick: goBack }]));
        s.append(page);
        this.bindNav(page, goBack);
    }

    /* ---------- comandi ---------- */

    showControls(back: () => void, fromPause = false): void {
        const s = this.openOverlay(`screen sx${fromPause ? '' : ' menu-screen'}`);
        const page = el('div', 'sx-page');
        page.append(...this.heading('comandi'));
        const body = el('div', 'sx-body narrow');
        const grid = el('div', 'sx-keys');
        for (const [action, key] of CONTROLS) {
            const a = el('span');
            a.textContent = action;
            const k = el('kbd');
            k.textContent = key;
            grid.append(a, k);
        }
        body.append(grid, el('div', 'sx-note', 'le wave si sbloccano giocando. tranquillo.'));
        page.append(body);
        const goBack = () => { this.closeOverlay(); back(); };
        page.append(this.menu([{ label: 'indietro', back: true, onPick: goBack }]));
        s.append(page);
        this.bindNav(page, goBack);
    }

    /* ---------- morte ---------- */

    private showDeath(lost: number, score: number | null): void {
        const s = this.openOverlay('screen sx sx-death');
        const band = el('div', 'sx-death-band');
        band.append(el('h1', 'sx-death-title', 'sei morto'));
        const p = el('div', 'sx-death-punch');
        p.textContent = deathPunchline(state.save.levelId);
        band.append(p);
        if (lost > 0) {
            const loss = el('div', 'sx-death-loss');
            loss.textContent = `${lost} barre giacciono dove sei caduto. torna a riprendertele.`;
            band.append(loss);
        }
        band.append(this.scoreBadge(score, 'punteggio della partita'));
        band.append(this.menu([
            { label: 'rialzati al microfono', onPick: () => { this.closeOverlay(); this.controller.retry(); } },
            { label: 'esci al menu', back: true, onPick: () => { this.closeOverlay(); this.controller.quitToMenu(); } },
        ], 'row'));
        s.append(band);
        // le scelte arrivano dopo il titolo: prima si incassa
        setTimeout(() => { if (this.overlay === s) this.bindNav(band); }, 2400);
    }

    /** il punteggio della partita, con il record della classifica locale accanto */
    private scoreBadge(score: number | null, label: string, rank = 0): HTMLElement {
        const box = el('div', `sx-run${score === null ? ' off' : ''}`);
        if (score === null) {
            box.append(el('span', '', 'partita assistita'), el('b', '', 'senza punteggio'));
            return box;
        }
        const best = loadBoard()[0]?.score ?? 0;
        box.append(el('span', '', label), el('b', '', score.toLocaleString('it-IT')));
        const note = rank === 1 ? 'nuovo record della classifica!' : rank > 1 ? `${rank}° nella classifica` : best > 0 ? `record: ${best.toLocaleString('it-IT')}` : '';
        if (note) box.append(el('span', 'note', note));
        return box;
    }

    /* ---------- scelte ---------- */

    private choice(title: string, options: { label: string; danger?: boolean }[], onPick: (i: number) => void): void {
        this.controller.pause();
        const s = this.openOverlay('screen sx');
        const page = el('div', 'sx-page');
        const box = el('div', 'sx-announce');
        box.append(el('div', 'sx-kick', 'una scelta'));
        const t = el('div', 'sx-name');
        t.textContent = title;
        box.append(t, this.orn());
        page.append(box);
        page.append(this.menu(options.map((opt, i) => ({
            label: opt.label,
            danger: opt.danger,
            onPick: () => {
                this.closeOverlay();
                this.controller.resume();
                onPick(i);
            },
        }))));
        s.append(page);
        this.bindNav(page);
    }

    /* ---------- annunci: area, toast, wavesung, abilità ---------- */

    private zoneCard(title: string, accent: string, color: ZoneColor, punchline: string): void {
        document.getElementById('zonecard')?.remove();
        const card = el('div');
        card.id = 'zonecard';
        const line = el('div', 'zc-line');
        const h1 = el('h1');
        h1.textContent = `${title.toLowerCase()} `;
        const span = el('span', 'accent');
        span.textContent = accent;
        span.style.color = ZONE_CSS[color];
        h1.append(span);
        line.append(h1);
        const p = el('div', 'zc-punch');
        p.textContent = punchline;
        card.append(line, p);
        ui().append(card);
        setTimeout(() => card.remove(), 4300);
    }

    /** il tabellone della fermata: tutte le fermate scoperte, capitolo per capitolo */
    private travelBoard(p: { stops: { key: string; levelId: string; label: string }[]; current: string; onPick: (key: string) => void }): void {
        this.controller.pause();
        const s = this.openOverlay('screen sx');
        const page = el('div', 'sx-page');
        page.append(...this.heading('citelis', 'prossima partenza: adesso. quella dopo: sempre.'));
        const close = () => {
            this.closeOverlay();
            this.controller.resume();
        };
        const body = el('div', 'sx-body narrow');
        let lastLevel = '';
        let group: MenuItem[] = [];
        const flush = () => {
            if (group.length) body.append(this.menu(group));
            group = [];
        };
        for (const stop of p.stops) {
            if (stop.levelId !== lastLevel) {
                flush();
                lastLevel = stop.levelId;
                const lv = LEVELS[stop.levelId];
                body.append(el('div', 'sx-group', `${lv.title.toLowerCase()} ${lv.accentWord}`));
            }
            const here = stop.key === p.current;
            group.push({
                label: stop.label,
                sub: here ? 'sei qui' : undefined,
                small: true,
                onPick: () => {
                    if (here) return;
                    close();
                    p.onPick(stop.key);
                },
            });
        }
        flush();
        page.append(body);
        page.append(this.menu([{ label: 'resto qui', back: true, onPick: close }]));
        s.append(page);
        this.bindNav(page, close);
    }

    /** trofeo sbloccato: medaglia dorata in alto a sinistra, non ferma il gioco */
    private trophy(id: string): void {
        const a = ACHIEVEMENTS.find((x) => x.id === id);
        if (!a) return;
        const t = el('div', 'trophy glass-panel');
        const icon = el('div', 'trophy-icon', a.icon);
        const txt = el('div', 'trophy-text');
        txt.append(el('div', 'trophy-kicker font-marker', 'trofeo sbloccato'), el('div', 'trophy-name', a.name), el('div', 'trophy-desc', a.desc));
        t.append(icon, txt);
        // più trofei insieme si impilano
        const stack = document.querySelectorAll('.trophy').length;
        t.style.top = `${110 + stack * 84}px`;
        ui().append(t);
        sfx.unlock();
        setTimeout(() => t.classList.add('fade-out'), 4800);
        setTimeout(() => t.remove(), 5300);
    }

    /** fine capitolo: una notifica del telefono, discreta; il conto intero sta nella bacheca */
    private chapterScore(p: { id: string; score: number; best: boolean; assisted: boolean; timeMs: number }): void {
        const lv = LEVELS[p.id];
        const name = lv ? `${lv.title.toLowerCase()} ${lv.accentWord}` : p.id;
        const m = Math.floor(p.timeMs / 60000);
        const sec = String(Math.floor((p.timeMs / 1000) % 60)).padStart(2, '0');
        const body = p.assisted
            ? `capitolo chiuso · ${m}:${sec} · assistita, senza punteggio`
            : `capitolo chiuso · ${p.score.toLocaleString('it-IT')} punti · ${m}:${sec}${p.best ? ' · record' : ''}`;
        phoneBanner({ app: 'bacheca', title: name, body, accent: p.best && !p.assisted ? 'gold' : 'plain' });
    }

    private toast(text: string): void {
        document.getElementById('toast')?.remove();
        const t = el('div', 'sticker glass-chip');
        t.id = 'toast';
        t.textContent = text;
        ui().append(t);
        setTimeout(() => t.remove(), 2700);
    }

    private wavesung(sender: string, text: string): void {
        phoneBanner({ app: 'wavesung', title: sender, body: text, accent: 'blue', wrap: true, ms: 5200 });
    }

    /** un oggetto ottenuto: il nome inciso al centro, la descrizione sotto */
    private announce(kick: string, name: string, lines: string[], extra: HTMLElement | null, ok: string, color: string): void {
        this.controller.pause();
        const s = this.openOverlay('screen sx');
        const page = el('div', 'sx-page');
        const box = el('div', 'sx-announce');
        box.append(el('div', 'sx-kick', kick));
        const n = el('div', 'sx-name');
        n.textContent = name;
        n.style.color = color;
        box.append(n, this.orn());
        for (const l of lines) {
            const d = el('p', 'sx-desc');
            d.textContent = l;
            box.append(d);
        }
        if (extra) box.append(extra);
        page.append(box);
        const close = () => {
            this.closeOverlay();
            this.controller.resume();
        };
        page.append(this.menu([{ label: ok, onPick: close }]));
        s.append(page);
        sfx.unlock();
        this.bindNav(page, close);
    }

    private abilityCard(ability: keyof typeof ABILITY_CARDS): void {
        const card = ABILITY_CARDS[ability];
        const kbd = el('kbd');
        kbd.textContent = card.key;
        this.announce('frammento della gecowave', card.name, [card.desc], kbd, 'bella', 'var(--sx-bone)');
    }

    private charmCard(id: string): void {
        const item = ITEMS[id];
        if (!item) return;
        const how = `costa ${item.cost} ${item.cost === 1 ? 'tacca' : 'tacche'}. si indossa dal telefono (tab), vicino a un microfono.`;
        this.announce('amuleto trovato', `${item.icon} ${item.name}`, [item.desc, how], null, 'in tasca', 'var(--sx-gold)');
    }

    /* ---------- sequenze narrative ---------- */

    storySequence(cards: { text: string; punch?: string }[], onDone: () => void): void {
        let i = 0;
        const showCard = () => {
            const s = this.openOverlay('screen sx narration-screen');
            const panel = el('div', 'sx-narration');
            const p = el('p');
            panel.append(this.orn(), p);
            s.append(panel, el('div', 'sx-hint', 'premi per continuare'));

            const full = cards[i].text;
            const punch = cards[i].punch;
            let typing: number | null = null;
            let allDone = false;

            const punchEl = punch ? el('span', 'punch') : null;
            if (punchEl) panel.append(punchEl);

            // digita una stringa col ritmo sonoro dei dialoghi
            const typeInto = (target: HTMLElement, str: string, onComplete: () => void) => {
                let typed = 0;
                typing = window.setInterval(() => {
                    typed++;
                    target.textContent = str.slice(0, typed);
                    if (typed % 4 === 0) sfx.ui();
                    if (typed >= str.length) {
                        clearInterval(typing!);
                        typing = null;
                        onComplete();
                    }
                }, 30);
            };

            const startPunch = () => {
                if (punchEl && punch) typeInto(punchEl, punch, () => (allDone = true));
                else allDone = true;
            };

            const advance = () => {
                if (!allDone) {
                    // primo input: completa tutto, secondo input: avanza
                    if (typing) { clearInterval(typing); typing = null; }
                    p.textContent = full;
                    if (punchEl && punch) punchEl.textContent = punch;
                    allDone = true;
                    return;
                }
                sfx.menuMove();
                i++;
                if (i < cards.length) showCard();
                else {
                    this.closeOverlay();
                    onDone();
                }
            };

            s.addEventListener('click', advance);
            this.escHandler = (e) => {
                if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE') {
                    e.preventDefault();
                    advance();
                }
            };
            window.addEventListener('keydown', this.escHandler);
            typeInto(p, full, startPunch);
        };
        showCard();
    }

    /* ---------- finale: storia + titoli di coda ---------- */

    endingSequence(cards: { text: string; punch?: string }[], opts: { outcome: 'win' | 'lose'; title: string; score?: number | null; rank?: number }, onDone: () => void): void {
        this.storySequence(cards, () => this.showCredits(opts, onDone));
    }

    private showCredits(opts: { outcome: 'win' | 'lose'; title: string; score?: number | null; rank?: number }, onDone: () => void): void {
        const win = opts.outcome === 'win';
        const s = this.openOverlay(`screen sx opaque credits-screen sx-credits ${win ? 'credits-win' : 'credits-lose'}`);
        const ROLL_MS = 38000;

        const head = el('div', 'credits-head');
        const end = el('h1', 'credits-end');
        end.textContent = 'fine';
        const sub = el('div', 'credits-sub');
        sub.textContent = opts.title.toLowerCase();
        head.append(end, sub);

        const roll = el('div', 'credits-roll');
        const inner = el('div', 'credits-inner');
        const game = el('div', 'credits-game');
        game.textContent = 'gecowave';
        inner.append(game);
        let first = true;
        for (const c of CREDITS) {
            if (c.role) {
                if (!first) inner.append(this.orn());
                first = false;
                const r = el('div', 'credits-role');
                r.textContent = c.role;
                inner.append(r);
            }
            for (const n of c.names) {
                const nm = el('div', 'credits-name');
                nm.textContent = n;
                inner.append(nm);
            }
        }
        roll.append(inner);

        const final = el('div', 'credits-final');
        if (opts.score !== undefined) final.append(this.scoreBadge(opts.score, 'punteggio finale', opts.rank ?? 0));
        const closing = el('div', 'credits-closing');
        closing.textContent = win ? 'grazie per aver viaggiato fino in fondo.' : 'ogni caduta insegna la strada.';
        final.append(closing);

        let fw: ReturnType<typeof setInterval> | null = null;
        const timers: number[] = [];
        const finish = () => {
            for (const t of timers) clearTimeout(t);
            if (fw) { clearInterval(fw); fw = null; }
            this.closeOverlay();
            onDone();
        };
        const back = this.menu([{ label: 'torna al menu', onPick: finish }]);
        back.classList.add('credits-btn');
        final.append(back);
        s.append(head, roll, final);

        // atto secondo: il rotolo parte e i fuochi si accendono
        const startRoll = () => {
            if (phase !== 1 || this.overlay !== s) return;
            phase = 2;
            s.classList.add('phase-2');
            if (win && !fw) {
                const colors = ['#facc15', '#e8dfc8', '#ff9a4a', '#cfa75c'];
                fw = setInterval(() => {
                    if (this.overlay !== s) { if (fw) clearInterval(fw); fw = null; return; }
                    const f = el('div', 'firework');
                    f.style.left = `${8 + Math.random() * 84}%`;
                    f.style.top = `${12 + Math.random() * 56}%`;
                    f.style.setProperty('--fw', colors[Math.floor(Math.random() * colors.length)]);
                    s.append(f);
                    setTimeout(() => f.remove(), 1100);
                }, 420);
            }
            timers[1] = window.setTimeout(showEnd, ROLL_MS);
        };
        // atto terzo: resta solo la chiusura
        const showEnd = () => {
            if (phase === 3 || this.overlay !== s) return;
            phase = 3;
            s.classList.add('phase-3');
            this.closeNavOnly();
            this.bindNav(final, finish);
        };
        let phase = 1;
        timers.push(window.setTimeout(startRoll, 4600));
        timers.push(window.setTimeout(showEnd, 4600 + ROLL_MS));
        s.addEventListener('click', () => {
            if (phase === 1) {
                clearTimeout(timers[0]);
                startRoll();
            } else if (phase === 2) {
                showEnd();
            }
        });
        this.escHandler = (e) => {
            if (e.code === 'Escape') {
                e.preventDefault();
                finish();
            } else if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE') {
                e.preventDefault();
                s.dispatchEvent(new Event('click'));
            }
        };
        window.addEventListener('keydown', this.escHandler);
    }

    /* ---------- forgia del personaggio ---------- */

    showCharacterCreation(onConfirm: () => void): void {
        const s = this.openOverlay('screen sx sx-forge menu-screen');
        this.setZone('yellow');

        // ogni nuova run parte non assistita: la freccia è opt-in,
        // mai ereditata dalle impostazioni o dalla partita precedente
        state.settings.guide = false;
        state.persistSettings();

        let finalName = 'Geco';
        let doomsdayMode = false;
        let availablePoints = 10;
        const stats = { forza: 0, costituzione: 0, flusso: 0 };

        const backs = new Map<HTMLElement, (() => void) | undefined>();
        const show = (from: HTMLElement, to: HTMLElement) => {
            from.classList.remove('active');
            to.classList.add('active');
            this.closeNavOnly();
            this.bindNav(to, backs.get(to));
            if (to === step1) setTimeout(() => input.focus(), 60);
        };

        // --- il nome ---
        const step1 = el('div', 'sx-step active');
        step1.append(el('div', 'sx-kick', 'capitolo zero · il custode provvisorio'));
        step1.append(...this.heading('come ti chiami?', 'incidi il tuo nome nella memoria del flusso'));
        const input = el('input', 'sx-name-input');
        input.type = 'text';
        input.value = '';
        input.maxLength = 12;
        input.placeholder = 'Geco';
        input.spellcheck = false;
        const goToStep2 = () => {
            finalName = input.value.trim() || 'Geco';
            title2.textContent = `la forgia di ${finalName.toLowerCase()}`;
            updateAll();
            show(step1, step2);
        };
        step1.append(input);
        step1.append(this.menu([
            { label: 'incidi', onPick: goToStep2 },
            { label: 'torna al titolo', back: true, onPick: () => this.showMenu() },
        ]));
        input.addEventListener('keydown', (e) => {
            if (e.code === 'Enter') {
                e.preventDefault();
                sfx.menuSelect();
                goToStep2();
            }
        });
        s.append(step1);
        backs.set(step1, () => this.showMenu());

        // --- gli attributi ---
        const step2 = el('div', 'sx-step');
        step2.append(el('div', 'sx-kick', 'capitolo zero · allocazione del flusso'));
        const [title2, ...rest2] = this.heading('la forgia');
        step2.append(title2, ...rest2);
        const grid = el('div', 'sx-forge-grid');
        const left = el('div', '');
        const right = el('div', 'sx-portrait');
        grid.append(left, right);
        step2.append(grid);

        const pointsEl = el('div', 'sx-points', 'punti del flusso da assegnare');
        const pointsNum = el('b', '', '10');
        pointsEl.append(pointsNum);
        left.append(pointsEl);

        const attr = (key: 'forza' | 'costituzione' | 'flusso', label: string, desc: string) => {
            const row = el('div', 'sx-attr');
            row.dataset.nav = '1';
            row.append(el('div', 'an', label), el('div', 'ad', desc));
            const pips = el('div', 'sx-pips');
            const pipEls: HTMLElement[] = [];
            for (let i = 0; i < 10; i++) {
                const pip = el('i');
                pipEls.push(pip);
                pips.append(pip);
            }
            row.append(pips);
            const av = el('div', 'av');
            const minus = el('button', '', '‹');
            const num = el('span', 'num', '0');
            const plus = el('button', '', '›');
            av.append(minus, num, plus);
            row.append(av);
            const dec = () => {
                if (stats[key] <= 0) return;
                stats[key]--;
                availablePoints++;
                sfx.menuMove();
                updateAll();
            };
            const inc = () => {
                if (availablePoints <= 0 || stats[key] >= 10) return;
                stats[key]++;
                availablePoints--;
                sfx.menuMove();
                updateAll();
            };
            minus.addEventListener('click', dec);
            plus.addEventListener('click', inc);
            row.addEventListener('nav-left', dec);
            row.addEventListener('nav-right', inc);
            // invio sulla riga: un punto in più, come la destra
            row.addEventListener('click', (e) => {
                if (e.target === row) inc();
            });
            left.append(row);

            return () => {
                num.textContent = String(stats[key]);
                pipEls.forEach((pg, i) => pg.classList.toggle('full', i < stats[key]));
                minus.classList.toggle('disabled', stats[key] <= 0);
                plus.classList.toggle('disabled', availablePoints <= 0 || stats[key] >= 10);
            };
        };
        const updForza = attr('forza', 'forza', 'il danno dei colpi: +10% a punto');
        const updCost = attr('costituzione', 'costituzione', 'i cuori che reggi: +1 a punto');
        const updFlus = attr('flusso', 'flusso', 'flusso massimo +10 e risonante +10% a punto');

        right.append(el('div', 'sx-geco'));
        const derived = el('div', 'sx-derived');
        right.append(derived);
        const dRow = (label: string) => {
            const d = el('div');
            const v = el('b');
            d.append(el('span', '', label), v);
            derived.append(d);
            return v;
        };
        const dHp = dRow('cuori');
        const dDmg = dRow('danno');
        const dFlow = dRow('flusso massimo');
        const dRes = dRow('colpo risonante');

        const updateAll = () => {
            updForza();
            updCost();
            updFlus();
            pointsNum.textContent = String(availablePoints);
            pointsEl.classList.toggle('spent', availablePoints === 0);
            dHp.textContent = String(5 + stats.costituzione);
            dHp.classList.toggle('up', stats.costituzione > 0);
            dDmg.textContent = `×${(1 + stats.forza * 0.1).toFixed(1)}`;
            dDmg.classList.toggle('up', stats.forza > 0);
            dFlow.textContent = String(99 + stats.flusso * 10);
            dFlow.classList.toggle('up', stats.flusso > 0);
            dRes.textContent = `×${(1 + stats.flusso * 0.1).toFixed(1)}`;
            dRes.classList.toggle('up', stats.flusso > 0);
        };

        const back2 = () => show(step2, step1);
        step2.append(this.menu([
            { label: 'indietro', back: true, onPick: back2 },
            { label: 'conferma', onPick: () => { selectMode(doomsdayMode, false); show(step2, step3); } },
        ], 'row'));
        s.append(step2);
        backs.set(step2, back2);

        // --- il destino ---
        const step3 = el('div', 'sx-step');
        step3.append(el('div', 'sx-kick', 'capitolo zero · la scelta del destino'));
        step3.append(...this.heading('scegli il tuo destino'));
        const fates = el('div', 'sx-fates');
        const fate = (cls: string, svg: string, name: string, desc: string) => {
            const c = el('div', `sx-fate ${cls}`);
            c.dataset.nav = '1';
            c.innerHTML = svg;
            c.append(el('div', 'fn', name), el('div', 'fd', desc));
            fates.append(c);
            return c;
        };
        // una candela: il cammino senza fretta
        const standardCard = fate('', '<svg viewBox="0 0 96 96" aria-hidden="true"><path d="M48 14c-6 8-8 13-5 18 2 4 8 4 10 0 3-5 1-10-5-18Z"/><path d="M48 26c-2 3-2 5 0 6"/><rect x="38" y="38" width="20" height="40" rx="2"/><path d="M38 46c4 2 8-2 10 2s6 0 10-2"/><path d="M26 82h44"/><path d="M30 78c0-4 6-4 8-4M66 78c0-4-6-4-8-4"/></svg>',
            'il cammino', 'l\'esperienza classica. nessun orologio: i boss e la storia aspettano te.');
        // una clessidra che si svuota: il doomsday
        const doomsdayCard = fate('doom', '<svg viewBox="0 0 96 96" aria-hidden="true"><path d="M28 12h40M28 84h40"/><path d="M32 12c0 22 16 26 16 36S32 62 32 84M64 12c0 22-16 26-16 36s16 14 16 36"/><path d="M40 30c4 4 12 4 16 0"/><path d="M48 52v14"/><path d="M38 80c4-6 16-6 20 0"/><path d="M20 20l-6-6M76 20l6-6"/></svg>',
            'doomsday', 'il tempo vero scorre. se ti attardi troppo, pedro ti raggiunge e ti cancella.');
        step3.append(fates);
        const assist = assistToggle({ rowClass: 'sx-row', newGame: true });
        assist.querySelector<HTMLElement>('.toggle')?.setAttribute('data-nav', '1');
        step3.append(assist);

        const back3 = () => {
            s.classList.remove('doom');
            show(step3, step2);
        };
        const start = () => {
            state.save.playerName = finalName;
            state.save.stats.forza = stats.forza;
            state.save.stats.costituzione = stats.costituzione;
            state.save.stats.flusso = stats.flusso;
            state.save.doomsdayMode = doomsdayMode;
            state.save.doomsday = 0;
            // chi parte con la freccia accesa gioca assistito dal primo passo
            state.save.assisted = state.settings.guide;
            state.persist();
            state.resetRun();
            this.closeOverlay();
            onConfirm();
        };
        step3.append(this.menu([
            { label: 'indietro', back: true, onPick: back3 },
            { label: 'inizia il viaggio', onPick: start },
        ], 'row'));
        s.append(step3);
        backs.set(step3, back3);

        const selectMode = (isDoomsday: boolean, sound = true) => {
            doomsdayMode = isDoomsday;
            standardCard.classList.toggle('chosen', !isDoomsday);
            doomsdayCard.classList.toggle('chosen', isDoomsday);
            s.classList.toggle('doom', isDoomsday);
            if (sound) sfx.menuSelect();
        };

        standardCard.addEventListener('click', () => selectMode(false));
        doomsdayCard.addEventListener('click', () => selectMode(true));

        this.bindNav(step1, () => this.showMenu());
        setTimeout(() => input.focus(), 140);
        updateAll();
        selectMode(false, false);
    }
}
