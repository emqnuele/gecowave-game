import { ZONE_CSS } from '../config';
import { ABILITY_CARDS, DEATH_PUNCHLINES, QUIZ_ANALISI } from '../content/story';
import { bus } from '../engine/events';
import { sfx } from '../engine/sfx';
import { state } from '../engine/state';
import { music } from '../engine/music';
import type { ZoneColor } from '../types';
import { el, ui } from './dom';

export interface GameController {
    newGame(): void;
    continueGame(): void;
    retry(): void;
    pause(): void;
    resume(): void;
    quitToMenu(): void;
}

const CONTROLS: [string, string][] = [
    ['muoviti', 'A / D'],
    ['salta (e rimbalzo a mezz\'aria)', 'SPAZIO'],
    ['attacca — 3 colpi = combo', 'J / clic'],
    ['attacca in alto / in basso', 'W+J / S+J in aria'],
    ['scivolata', 'SHIFT / K'],
    ['colpo risonante (carica)', 'F tieni premuto'],
    ['riflesso distorto', 'G'],
    ['analisi 1', 'H'],
    ['cura (tieni premuto)', 'Q'],
    ['interagisci', 'E'],
    ['pausa', 'ESC'],
];

export class Screens {
    private controller!: GameController;
    private overlay: HTMLElement | null = null;
    private bg: HTMLElement;
    private blobs: HTMLElement[] = [];
    private escHandler: ((e: KeyboardEvent) => void) | null = null;

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
        this.setZone('green');

        bus.on('zone-changed', ({ title, accentWord, color, punchline, showCard }) => {
            this.setZone(color);
            if (showCard) this.zoneCard(title, accentWord, color, punchline);
        });
        bus.on('toast', ({ text }) => this.toast(text));
        bus.on('wavesung', ({ sender, text }) => this.wavesung(sender, text));
        bus.on('player-died', ({ lost }) => this.showDeath(lost));
        bus.on('ability-unlocked', ({ ability }) => this.abilityCard(ability));
        bus.on('choice-show', ({ title, options, onPick }) => this.choice(title, options, onPick));
        bus.on('quiz-show', ({ onDone }) => this.quiz(onDone));
        bus.on('request-pause', () => this.showPause());
    }

    bind(controller: GameController): void {
        this.controller = controller;
    }

    /* ---------- atmosfera ---------- */

    setZone(color: ZoneColor): void {
        const css = ZONE_CSS[color];
        document.documentElement.style.setProperty('--accent', css);
        this.bg.style.background = `radial-gradient(ellipse 110% 80% at 50% 110%, ${css}14, transparent 60%), #000`;
        this.blobs.forEach((b, i) => {
            b.style.background = css + (i ? '12' : '1a');
        });
    }

    /* ---------- helpers ---------- */

    private openOverlay(cls = 'screen'): HTMLElement {
        this.closeOverlay();
        this.overlay = el('div', cls);
        ui().append(this.overlay);
        return this.overlay;
    }

    closeOverlay(): void {
        this.overlay?.remove();
        this.overlay = null;
        if (this.escHandler) {
            window.removeEventListener('keydown', this.escHandler);
            this.escHandler = null;
        }
    }

    get overlayOpen(): boolean {
        return this.overlay !== null;
    }

    private onEsc(fn: () => void): void {
        this.escHandler = (e) => {
            if (e.code === 'Escape') {
                e.preventDefault();
                fn();
            }
        };
        window.addEventListener('keydown', this.escHandler);
    }

    private btn(label: string, tilt: number, onClick: () => void, acid = ''): HTMLElement {
        const b = el('button', `btn sticker ${acid}`);
        b.textContent = label;
        b.style.transform = `rotate(${tilt}deg)`;
        b.addEventListener('click', () => {
            sfx.init();
            sfx.ui();
            onClick();
        });
        return b;
    }

    private kicker(text: string, acid: string, color: string): HTMLElement {
        const k = el('span', `kicker sticker ${acid}`);
        const label = el('span', 'label');
        label.textContent = text;
        label.style.color = color;
        k.append(el('span', 'dot'), label);
        return k;
    }

    /* ---------- menu principale ---------- */

    showMenu(): void {
        const s = this.openOverlay('screen opaque menu-screen');
        this.setZone('green');

        s.append(this.kicker('the flux of cosenza — rec', 'glass-acid-green', ZONE_CSS.green));

        const title = el('h1', 'menu-title font-crisis', 'GECO<span class="font-marker" style="color:var(--green);display:inline-block;transform:rotate(-3deg);text-transform:lowercase">wave</span>');
        s.append(title);
        const sub = el('div', 'menu-sub');
        sub.textContent = state.save.endingSeen
            ? 'la wave è tornata. o sei tu la wave. rigioca pure.'
            : 'la gecowave è in frammenti. qualcuno deve raccoglierli.';
        s.append(sub);

        const stack = el('div', 'menu-stack');
        stack.append(this.btn('nuova partita', -1.5, () => this.controller.newGame(), 'glass-acid-green'));
        if (state.hasSave) {
            stack.append(this.btn('continua', 1.2, () => this.controller.continueGame()));
        }
        stack.append(this.btn('comandi', -1, () => this.showControls(() => this.showMenu())));
        stack.append(this.btn('impostazioni', 1.4, () => this.showSettings(() => this.showMenu())));
        s.append(stack);

        s.append(el('div', 'menu-foot', 'si va a destra finché non torna la wave.'));
    }

    /* ---------- pausa ---------- */

    showPause(): void {
        if (this.overlayOpen) return;
        this.controller.pause();
        const s = this.openOverlay();
        s.append(el('h2', 'font-crisis', 'PAUSA'));
        s.append(el('div', 'font-marker', '<span style="color:rgba(255,255,255,.7)">il gioco aspetta. pedro no.</span>'));
        const stack = el('div', 'menu-stack');
        const resume = () => {
            this.closeOverlay();
            this.controller.resume();
        };
        stack.append(this.btn('riprendi', -1.2, resume, 'glass-acid-green'));
        stack.append(this.btn('comandi', 1, () => this.showControls(() => this.showPause(), true)));
        stack.append(this.btn('impostazioni', -1, () => this.showSettings(() => this.showPause(), true)));
        stack.append(this.btn('esci al menu', 1.3, () => {
            this.closeOverlay();
            this.controller.quitToMenu();
        }));
        s.append(stack);
        this.onEsc(resume);
    }

    /* ---------- impostazioni ---------- */

    showSettings(back: () => void, fromPause = false): void {
        const s = this.openOverlay(fromPause ? 'screen' : 'screen opaque');
        s.append(el('h2', 'font-crisis', 'IMPOSTAZIONI'));

        const vol = el('div', 'settings-row glass-chip');
        const volName = el('span', 'name');
        volName.textContent = 'volume';
        vol.append(volName);
        const slider = el('input');
        slider.type = 'range';
        slider.min = '0';
        slider.max = '1';
        slider.step = '0.05';
        slider.value = String(state.settings.volume);
        slider.addEventListener('input', () => {
            state.settings.volume = Number(slider.value);
            state.persistSettings();
            sfx.setVolume(state.settings.volume);
            music.setVolume(state.settings.volume);
            sfx.ui();
        });
        vol.append(slider);
        s.append(vol);

        const shake = el('div', 'settings-row glass-chip');
        const shakeName = el('span', 'name');
        shakeName.textContent = 'screen shake';
        shake.append(shakeName);
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
        s.append(shake);

        const danger = el('div', 'settings-row glass-chip glass-acid-red');
        const dangerName = el('span', 'name');
        dangerName.textContent = 'cancella salvataggio';
        danger.append(dangerName);
        const reset = el('button', 'toggle sticker');
        reset.textContent = 'cancella';
        reset.style.color = ZONE_CSS.red;
        reset.addEventListener('click', () => {
            if (reset.textContent === 'cancella') {
                reset.textContent = 'sicuro?';
                return;
            }
            state.reset();
            sfx.ui();
            this.toast('fatto. come se niente fosse mai successo.');
            this.showMenu();
        });
        danger.append(reset);
        s.append(danger);

        s.append(this.btn('indietro', -1, back));
        this.onEsc(back);
    }

    /* ---------- comandi ---------- */

    showControls(back: () => void, fromPause = false): void {
        const s = this.openOverlay(fromPause ? 'screen' : 'screen opaque');
        s.append(el('h2', 'font-crisis', 'COMANDI'));
        const grid = el('div', 'controls-grid glass-panel');
        for (const [action, key] of CONTROLS) {
            const a = el('span');
            a.textContent = action;
            const k = el('kbd');
            k.textContent = key;
            grid.append(a, k);
        }
        s.append(grid);
        s.append(el('div', 'font-marker', '<span style="color:rgba(255,255,255,.55)">le wave si sbloccano giocando. tranquillo.</span>'));
        s.append(this.btn('indietro', 1, back));
        this.onEsc(back);
    }

    /* ---------- morte ---------- */

    private showDeath(lost: number): void {
        const s = this.openOverlay();
        const punch = DEATH_PUNCHLINES[Math.floor(Math.random() * DEATH_PUNCHLINES.length)];
        s.append(el('h1', 'death-title', 'FLOPPATO'));
        const p = el('div', 'death-punch');
        p.textContent = punch;
        s.append(p);
        if (lost > 0) {
            const loss = el('div', 'death-loss');
            loss.textContent = `hai lasciato ${lost} barre a terra — torna a riprendertele`;
            s.append(loss);
        }
        const stack = el('div', 'menu-stack');
        stack.append(this.btn('riprova dal microfono', -1.3, () => {
            this.closeOverlay();
            this.controller.retry();
        }, 'glass-acid-green'));
        stack.append(this.btn('esci al menu', 1, () => {
            this.closeOverlay();
            this.controller.quitToMenu();
        }));
        s.append(stack);
    }

    /* ---------- scelte e quiz ---------- */

    private choice(title: string, options: { label: string; danger?: boolean }[], onPick: (i: number) => void): void {
        this.controller.pause();
        const s = this.openOverlay();
        const panel = el('div', 'story-card glass-panel glass-acid-green');
        const t = el('div', 'font-marker choice-title');
        t.textContent = title;
        panel.append(t);
        s.append(panel);
        const stack = el('div', 'menu-stack');
        options.forEach((opt, i) => {
            stack.append(this.btn(opt.label, i % 2 ? 1.2 : -1.2, () => {
                this.closeOverlay();
                this.controller.resume();
                onPick(i);
            }, opt.danger ? 'glass-acid-red' : 'glass-acid-green'));
        });
        s.append(stack);
    }

    private quiz(onDone: (errors: number) => void): void {
        let index = 0;
        let errors = 0;
        const ask = () => {
            const q = QUIZ_ANALISI[index];
            const s = this.openOverlay();
            s.append(this.kicker(`mente di piema — enigma ${index + 1}/${QUIZ_ANALISI.length}`, 'glass-acid-blue', ZONE_CSS.blue));
            const panel = el('div', 'story-card glass-panel glass-acid-blue');
            const t = el('p');
            t.textContent = q.q;
            panel.append(t);
            s.append(panel);
            const stack = el('div', 'menu-stack');
            q.options.forEach((opt, i) => {
                stack.append(this.btn(opt, i % 2 ? 1 : -1, () => {
                    if (i !== q.correct) errors++;
                    index++;
                    if (index < QUIZ_ANALISI.length) ask();
                    else {
                        this.closeOverlay();
                        onDone(errors);
                    }
                }));
            });
            s.append(stack);
        };
        ask();
    }

    /* ---------- card di zona, toast, wavesung, abilità ---------- */

    private zoneCard(title: string, accent: string, color: ZoneColor, punchline: string): void {
        document.getElementById('zonecard')?.remove();
        const card = el('div');
        card.id = 'zonecard';
        const h1 = el('h1');
        h1.textContent = title + ' ';
        const span = el('span', 'accent');
        span.textContent = accent;
        span.style.color = ZONE_CSS[color];
        h1.append(span);
        const p = el('div', 'font-marker');
        p.style.cssText = 'color:rgba(255,255,255,.75);font-size:17px;transform:rotate(-1deg)';
        p.textContent = punchline;
        card.append(h1, p);
        ui().append(card);
        setTimeout(() => card.remove(), 3300);
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
        document.getElementById('wavesung')?.remove();
        const w = el('div', 'glass-panel glass-acid-blue');
        w.id = 'wavesung';
        const head = el('div', 'wavesung-head font-marker', '');
        head.textContent = `📱 wavesung — ${sender}`;
        const body = el('div', 'wavesung-body');
        body.textContent = text;
        w.append(head, body);
        ui().append(w);
        sfx.pickup();
        setTimeout(() => w.classList.add('fade-out'), 4600);
        setTimeout(() => w.remove(), 5100);
    }

    private abilityCard(ability: keyof typeof ABILITY_CARDS): void {
        this.controller.pause();
        const card = ABILITY_CARDS[ability];
        const s = this.openOverlay();
        s.append(this.kicker('frammento della gecowave — rec', 'glass-acid-green', ZONE_CSS.green));
        const panel = el('div', 'story-card glass-panel glass-acid-green');
        const name = el('div', 'font-marker');
        name.style.cssText = 'font-size:30px;color:var(--green);transform:rotate(-2deg);margin-bottom:14px';
        name.textContent = card.name;
        const desc = el('p');
        desc.textContent = card.desc;
        const key = el('div');
        key.style.marginTop = '16px';
        const kbd = el('kbd');
        kbd.style.cssText = 'font-size:12px;padding:6px 14px;border:1px solid rgba(255,255,255,.25);border-radius:8px';
        kbd.textContent = card.key;
        key.append(kbd);
        panel.append(name, desc, key);
        s.append(panel);
        const close = () => {
            this.closeOverlay();
            this.controller.resume();
        };
        const stack = el('div', 'menu-stack');
        stack.append(this.btn('bella', -1.5, close, 'glass-acid-green'));
        s.append(stack);
        this.onEsc(close);
    }

    /* ---------- sequenze narrative ---------- */

    storySequence(cards: { text: string; punch?: string }[], onDone: () => void): void {
        let i = 0;
        const showCard = () => {
            const s = this.openOverlay('screen opaque');
            const panel = el('div', 'story-card glass-panel');
            const p = el('p');
            p.textContent = cards[i].text;
            panel.append(p);
            if (cards[i].punch) {
                const punch = el('span', 'punch');
                punch.textContent = cards[i].punch!;
                panel.append(punch);
            }
            s.append(panel);
            const hint = el('div', 'label');
            hint.textContent = 'clic per continuare';
            hint.style.cssText = 'color:rgba(255,255,255,.4);margin-top:6px;animation:soft-pulse 1.6s ease-in-out infinite';
            s.append(hint);
            const advance = () => {
                sfx.ui();
                i++;
                if (i < cards.length) showCard();
                else {
                    this.closeOverlay();
                    onDone();
                }
            };
            s.addEventListener('click', advance, { once: true });
            this.escHandler = (e) => {
                if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE') {
                    e.preventDefault();
                    advance();
                }
            };
            window.addEventListener('keydown', this.escHandler, { once: true });
        };
        showCard();
    }
}
