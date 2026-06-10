import { ZONE_CSS } from '../config';
import { ABILITY_CARDS, DEATH_PUNCHLINES } from '../content/story';
import { bus } from '../engine/events';
import { sfx } from '../engine/sfx';
import { state } from '../engine/state';
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
    ['salta (e doppio salta)', 'SPAZIO'],
    ['attacca', 'J / clic'],
    ['attacca in alto / in basso', 'W+J / S+J in aria'],
    ['scivolata', 'SHIFT / K'],
    ['verso a distanza', 'F'],
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
        bus.on('player-died', ({ lost }) => this.showDeath(lost));
        bus.on('ability-unlocked', ({ ability }) => this.abilityCard(ability));
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
        k.append(
            el('span', 'dot'),
            el('span', `label`, ''),
        );
        const label = k.querySelector<HTMLElement>('.label')!;
        label.textContent = text;
        label.style.color = color;
        return k;
    }

    /* ---------- menu principale ---------- */

    showMenu(): void {
        const s = this.openOverlay('screen opaque');
        this.setZone('green');

        const mark = el('div', 'watermark', '🦎');
        mark.style.transform = 'rotate(-14deg)';
        s.append(mark);

        s.append(this.kicker('the flux of cosenza — rec', 'glass-acid-green', ZONE_CSS.green));

        const title = el('h1', 'menu-title font-crisis', 'GECO<span class="font-marker" style="color:var(--green);display:inline-block;transform:rotate(-3deg);text-transform:lowercase">wave</span>');
        s.append(title);
        s.append(el('div', 'menu-sub', state.save.bossDefeated ? 'la wave è tornata. rigioca, se ti va.' : 'qualcuno deve riprendersi la wave.'));

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
        s.append(el('div', 'font-marker', '<span style="color:rgba(255,255,255,.7)">il gioco aspetta. l\'algoritmo no.</span>'));
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
        vol.append(el('span', 'name', 'volume'));
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
            sfx.ui();
        });
        vol.append(slider);
        s.append(vol);

        const shake = el('div', 'settings-row glass-chip');
        shake.append(el('span', 'name', 'screen shake'));
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
        danger.append(el('span', 'name', 'cancella salvataggio'));
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

    /* ---------- card di zona, toast, abilità ---------- */

    private zoneCard(title: string, accent: string, color: ZoneColor, punchline: string): void {
        document.getElementById('zonecard')?.remove();
        const card = el('div');
        card.id = 'zonecard';
        const h1 = el('h1', '', '');
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

    private abilityCard(ability: keyof typeof ABILITY_CARDS): void {
        this.controller.pause();
        const card = ABILITY_CARDS[ability];
        const s = this.openOverlay();
        s.append(this.kicker('nuova wave — rec', 'glass-acid-green', ZONE_CSS.green));
        const panel = el('div', 'story-card glass-panel glass-acid-green');
        const name = el('div', 'font-marker');
        name.style.cssText = 'font-size:30px;color:var(--green);transform:rotate(-2deg);margin-bottom:14px';
        name.textContent = card.name;
        const desc = el('p');
        desc.textContent = card.desc;
        const key = el('div', '', '');
        key.style.marginTop = '16px';
        const kbd = el('kbd', '');
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
            const hint = el('div', 'label', '');
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
