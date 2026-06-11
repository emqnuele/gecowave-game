import { ZONE_CSS } from '../config';
import { LEVELS, LEVEL_ORDER } from '../content/levels';
import { ABILITY_CARDS, DEATH_PUNCHLINES } from '../content/story';
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
    /** viaggia a un capitolo già visitato (per segreti e maschere persi) */
    travel(levelId: string): void;
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
    ['tommasoscudo', 'R'],
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

    private kicker(text: string, acid: string, color: string, showDot = true): HTMLElement {
        const k = el('span', `kicker sticker ${acid}`);
        const label = el('span', 'label');
        label.textContent = text;
        label.style.color = color;
        if (showDot) {
            k.append(el('span', 'dot'), label);
        } else {
            k.append(label);
        }
        return k;
    }

    /* ---------- menu principale ---------- */

    showMenu(): void {
        const s = this.openOverlay('screen opaque menu-screen');
        this.setZone('yellow');

        s.append(this.kicker('the flux of cosenza', 'glass-acid-gold', '#dfb15b', false));

        const title = el('h1', 'menu-title font-crisis', 'GECO<span class="font-marker" style="color:#dfb15b;display:inline-block;transform:rotate(-3deg);text-transform:lowercase">wave</span>');
        s.append(title);
        const sub = el('div', 'menu-sub');
        sub.textContent = state.save.endingSeen
            ? 'la wave è tornata. o sei tu la wave. rigioca pure.'
            : 'la gecowave è in frammenti. qualcuno deve raccoglierli.';
        s.append(sub);

        const stack = el('div', 'menu-stack');
        stack.append(this.btn('nuova partita', -1.5, () => this.controller.newGame(), 'glass-acid-gold'));
        if (state.hasSave) {
            stack.append(this.btn('continua', 1.2, () => this.controller.continueGame()));
            stack.append(this.btn('capitoli', -1.2, () => this.showChapters(() => this.showMenu())));
        }
        stack.append(this.btn('comandi', -1, () => this.showControls(() => this.showMenu())));
        stack.append(this.btn('impostazioni', 1.4, () => this.showSettings(() => this.showMenu())));
        s.append(stack);

        s.append(el('div', 'menu-foot', 'si va a destra finché non torna la wave.'));
    }

    /* ---------- viaggio tra i capitoli ---------- */

    private showChapters(back: () => void): void {
        const s = this.openOverlay('screen opaque');
        s.append(el('h2', 'font-crisis', 'CAPITOLI'));
        s.append(el('div', 'font-marker', '<span style="color:rgba(255,255,255,.7)">torna dove sei già stato: maschere, cuori e conti in sospeso.</span>'));

        const reachedIdx = Math.max(0, LEVEL_ORDER.indexOf(state.save.levelId));
        const stack = el('div', 'menu-stack');
        LEVEL_ORDER.forEach((id, i) => {
            const unlocked = state.save.endingSeen !== null || i <= reachedIdx || state.hasFlag(`visto-${id}`);
            if (!unlocked) return;
            const def = LEVELS[id];
            const label = `${i + 1}. ${def.title.toLowerCase()} ${def.accentWord}`;
            stack.append(this.btn(label, i % 2 ? 1 : -1, () => {
                state.save.levelId = id;
                state.save.checkpointId = null;
                state.persist();
                this.controller.travel(id);
            }));
        });
        s.append(stack);
        stack.append(this.btn('indietro', 0, back));
        this.onEsc(back);
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

    /* ---------- scelte ---------- */

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

    showCharacterCreation(onConfirm: () => void): void {
        const s = this.openOverlay('screen opaque char-creation-screen');
        this.setZone('yellow');

        const panel = el('div', 'glass-panel glass-acid-gold char-sheet-panel');
        s.append(panel);

        // --- STEP 1: NOME ---
        const step1 = el('div', 'char-step active');
        step1.append(el('h2', 'font-crisis char-step-title', 'COME TI CHIAMI?'));

        const sub1 = el('div', 'char-subtitle font-marker');
        sub1.textContent = 'scrivi il tuo nome nella memoria del flusso';
        step1.append(sub1);

        const nameRow = el('div', 'char-name-row glass-chip');
        const input = el('input', 'char-name-input') as HTMLInputElement;
        input.type = 'text';
        input.value = 'Geco';
        input.maxLength = 12;
        input.placeholder = 'Geco';
        nameRow.append(input);
        step1.append(nameRow);

        const nextBtn = this.btn('continua', -1.2, () => goToStep2(), 'glass-acid-gold');
        step1.append(nextBtn);
        panel.append(step1);

        input.addEventListener('keydown', (e) => {
            if (e.code === 'Enter') {
                goToStep2();
            }
        });

        // --- STEP 2: PUNTI ---
        const step2 = el('div', 'char-step');
        panel.append(step2);

        let finalName = 'Geco';
        let availablePoints = 10;
        const stats = {
            forza: 0,
            costituzione: 0,
            flusso: 0,
        };

        const goToStep2 = () => {
            finalName = input.value.trim() || 'Geco';
            sfx.ui();

            step1.classList.remove('active');
            setTimeout(() => {
                step1.style.display = 'none';
                step2.style.display = 'flex';
                step2.classList.add('active');

                title2.innerHTML = `CREAZIONE ${finalName.toUpperCase()}`;
                updateAll();
            }, 200);
        };

        const title2 = el('h2', 'font-crisis char-title', 'CREAZIONE GECO');
        const sub2 = el('div', 'char-subtitle font-marker', 'alloca i 10 punti per plasmare il tuo geco');
        step2.append(title2, sub2);

        const layout = el('div', 'char-layout-container');
        step2.append(layout);

        const leftCol = el('div', 'char-left-col');
        const rightCol = el('div', 'char-right-col');
        layout.append(leftCol, rightCol);

        const pointsEl = el('div', 'char-points-counter sticker glass-acid-yellow', `punti da assegnare: ${availablePoints}`);
        leftCol.append(pointsEl);

        // radar chart svg
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 220 220');
        svg.classList.add('char-radar-chart');
        rightCol.append(svg);

        const cx = 110, cy = 110;
        const getPoint = (d: number, index: number) => {
            const angle = -Math.PI / 2 + (index * 2 * Math.PI) / 3;
            return {
                x: cx + d * Math.cos(angle),
                y: cy + d * Math.sin(angle)
            };
        };

        const drawGridTriangle = (d: number) => {
            const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            const p0 = getPoint(d, 0);
            const p1 = getPoint(d, 1);
            const p2 = getPoint(d, 2);
            poly.setAttribute('points', `${p0.x},${p0.y} ${p1.x},${p1.y} ${p2.x},${p2.y}`);
            poly.setAttribute('class', 'radar-grid');
            svg.appendChild(poly);
        };
        drawGridTriangle(20);
        drawGridTriangle(50);
        drawGridTriangle(80);

        for (let i = 0; i < 3; i++) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            const pOuter = getPoint(80, i);
            line.setAttribute('x1', String(cx));
            line.setAttribute('y1', String(cy));
            line.setAttribute('x2', String(pOuter.x));
            line.setAttribute('y2', String(pOuter.y));
            line.setAttribute('class', 'radar-axis');
            svg.appendChild(line);
        }

        const statPoly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        statPoly.setAttribute('class', 'radar-value');
        svg.appendChild(statPoly);

        const createRadarLabel = (index: number, text: string, textAnchor: string, dy: number, dx = 0) => {
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            const p = getPoint(95, index);
            label.setAttribute('x', String(p.x + dx));
            label.setAttribute('y', String(p.y + dy));
            label.setAttribute('text-anchor', textAnchor);
            label.setAttribute('class', 'radar-label font-marker');
            label.textContent = text;
            svg.appendChild(label);
            return label;
        };

        const labelForza = createRadarLabel(0, 'FORZA', 'middle', -5);
        const labelCost = createRadarLabel(1, 'COSTITUZIONE', 'start', 8, 5);
        const labelFlus = createRadarLabel(2, 'FLUSSO', 'end', 8, -5);

        const createStatSelector = (key: 'forza' | 'costituzione' | 'flusso', label: string, desc: string) => {
            const container = el('div', 'char-stat-selector glass-chip');

            const info = el('div', 'char-stat-info');
            const nameEl = el('span', 'char-stat-name font-marker', label);
            const descEl = el('span', 'char-stat-desc', desc);
            info.append(nameEl, descEl);
            container.append(info);

            const segmentsWrap = el('div', 'char-stat-segments');
            const segments: HTMLElement[] = [];
            for (let i = 1; i <= 10; i++) {
                const seg = el('div', 'char-segment');
                seg.dataset.val = String(i);
                segmentsWrap.append(seg);
                segments.push(seg);

                seg.addEventListener('click', () => {
                    const targetVal = i;
                    const curVal = stats[key];
                    const valToSet = (targetVal === 1 && curVal === 1) ? 0 : targetVal;
                    const diff = valToSet - curVal;

                    if (diff > 0) {
                        const alloc = Math.min(diff, availablePoints);
                        if (alloc > 0) {
                            stats[key] += alloc;
                            availablePoints -= alloc;
                            sfx.ui();
                            updateAll();
                        }
                    } else if (diff < 0) {
                        stats[key] += diff;
                        availablePoints -= diff;
                        sfx.ui();
                        updateAll();
                    }
                });
            }
            container.append(segmentsWrap);
            leftCol.append(container);

            return () => {
                segments.forEach((seg, idx) => {
                    seg.classList.toggle('filled', idx < stats[key]);
                });
            };
        };

        const updSelForza = createStatSelector('forza', 'forza', 'danno fisico +10% a punto');
        const updSelCost = createStatSelector('costituzione', 'costituzione', 'punti vita massimi +1 a punto');
        const updSelFlus = createStatSelector('flusso', 'flusso', 'flusso max +10 e risonante +10% a punto');

        const updateAll = () => {
            updSelForza();
            updSelCost();
            updSelFlus();

            pointsEl.textContent = `punti da assegnare: ${availablePoints}`;

            const dForza = 20 + (stats.forza / 10) * 60;
            const dCost = 20 + (stats.costituzione / 10) * 60;
            const dFlus = 20 + (stats.flusso / 10) * 60;

            const p0 = getPoint(dForza, 0);
            const p1 = getPoint(dCost, 1);
            const p2 = getPoint(dFlus, 2);
            statPoly.setAttribute('points', `${p0.x},${p0.y} ${p1.x},${p1.y} ${p2.x},${p2.y}`);

            labelForza.textContent = `FORZA (${stats.forza})`;
            labelCost.textContent = `COSTITUZIONE (${stats.costituzione})`;
            labelFlus.textContent = `FLUSSO (${stats.flusso})`;
        };

        const confirmBtn = this.btn('inizia la run', -1.2, () => {
            state.save.playerName = finalName;
            state.save.stats.forza = stats.forza;
            state.save.stats.costituzione = stats.costituzione;
            state.save.stats.flusso = stats.flusso;
            state.persist();
            state.resetRun();
            this.closeOverlay();
            onConfirm();
        }, 'glass-acid-yellow');

        step2.append(confirmBtn);
    }
}
