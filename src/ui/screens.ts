import { ZONE_CSS } from '../config';
import { LEVELS, LEVEL_ORDER } from '../content/levels';
import { ABILITY_CARDS, CREDITS, DEATH_PUNCHLINES } from '../content/story';
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
        // oro all'avvio: coerente col menu, niente flash verde prima del boot
        this.setZone('yellow');

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

    get isMenuOpen(): boolean {
        return this.overlay?.classList.contains('menu-screen') ?? false;
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

        s.append(this.kicker('the flux of coscience', 'glass-acid-gold', '#dfb15b', false));

        const title = el('h1', 'menu-title font-crisis', 'GECO<span class="font-marker" style="color:#dfb15b;display:inline-block;transform:rotate(-3deg);text-transform:lowercase">wave</span>');
        s.append(title);
        const sub = el('div', 'menu-sub');
        s.append(sub);

        const stack = el('div', 'menu-stack');
        stack.append(this.btn('nuova partita', -1.5, () => this.controller.newGame(), 'glass-acid-gold'));
        if (state.hasSave || state.godMode) {
            if (state.hasSave) {
                stack.append(this.btn('continua', 1.2, () => this.controller.continueGame()));
            }
            stack.append(this.btn('capitoli', -1.2, () => this.showChapters(() => this.showMenu())));
        }
        stack.append(this.btn('comandi', -1, () => this.showControls(() => this.showMenu())));
        stack.append(this.btn('impostazioni', 1.4, () => this.showSettings(() => this.showMenu())));
        s.append(stack);

        s.append(el('div', 'menu-foot', 'developed by emqnuele - music by gecowave'));
    }

    /* ---------- viaggio tra i capitoli ---------- */

    private showChapters(back: () => void): void {
        const s = this.openOverlay('screen opaque');
        s.append(el('h2', 'font-crisis', 'CAPITOLI'));
        s.append(el('div', 'font-marker', '<span style="color:rgba(255,255,255,.7)">torna dove sei già stato: maschere, cuori e conti in sospeso.</span>'));

        const reachedIdx = Math.max(0, LEVEL_ORDER.indexOf(state.save.levelId));
        let maxVisitedIdx = -1;
        LEVEL_ORDER.forEach((id, idx) => {
            if (state.hasFlag(`visto-${id}`)) {
                maxVisitedIdx = Math.max(maxVisitedIdx, idx);
            }
        });
        const maxUnlockedIdx = Math.max(reachedIdx, maxVisitedIdx);

        const stack = el('div', 'menu-stack chapters-scroll');
        LEVEL_ORDER.forEach((id, i) => {
            const unlocked = state.godMode || state.save.endingSeen !== null || i <= maxUnlockedIdx;
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

        // capitoli segreti: appaiono solo una volta scoperti dal loro varco
        const secrets = ['barrato', 'custode', 'galliate', 'marcetti'].filter(
            (id) => state.godMode || state.hasFlag(`visto-${id}`),
        );
        if (secrets.length) {
            stack.append(el('div', 'chapters-secret-head font-marker', '※ capitoli segreti'));
            secrets.forEach((id, j) => {
                const def = LEVELS[id];
                const label = `✦ ${def.title.toLowerCase()} ${def.accentWord}`;
                stack.append(this.btn(label, j % 2 ? 1 : -1, () => {
                    state.portalReturn = null;
                    state.save.levelId = id;
                    state.save.checkpointId = null;
                    state.persist();
                    this.controller.travel(id);
                }));
            });
        }

        s.append(stack);
        s.append(this.btn('indietro', 0, back));
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

        // chiudi prima di tornare: showPause ha una guardia su overlay aperto
        const goBack = () => { this.closeOverlay(); back(); };
        s.append(this.btn('indietro', -1, goBack));
        this.onEsc(goBack);
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
        const goBack = () => { this.closeOverlay(); back(); };
        s.append(this.btn('indietro', 1, goBack));
        this.onEsc(goBack);
    }

    /* ---------- morte ---------- */

    private showDeath(lost: number): void {
        const s = this.openOverlay();
        const punch = DEATH_PUNCHLINES[Math.floor(Math.random() * DEATH_PUNCHLINES.length)];
        s.append(el('h1', 'death-title', 'SEI MORTO'));
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
            const s = this.openOverlay('screen opaque narration-screen');
            const panel = el('div', 'narration');
            const orn = el('div', 'narration-orn', '✦');
            const p = el('p', 'narration-text');
            const hint = el('div', 'narration-hint label', 'clic per continuare');
            panel.append(orn, p);
            s.append(panel, hint);

            const full = cards[i].text;
            const punch = cards[i].punch;
            let typing: number | null = null;
            let allDone = false;

            const punchEl = punch ? el('span', 'narration-punch') : null;
            if (punchEl) panel.append(punchEl);

            // digita una stringa su un elemento col ritmo sonoro dei dialoghi npc
            const typeInto = (target: HTMLElement, str: string, onComplete: () => void) => {
                let typed = 0;
                typing = window.setInterval(() => {
                    typed++;
                    target.textContent = str.slice(0, typed);
                    if (typed % 3 === 0) sfx.ui();
                    if (typed >= str.length) {
                        clearInterval(typing!);
                        typing = null;
                        onComplete();
                    }
                }, 28);
            };

            const finishPunch = () => { allDone = true; };
            const startPunch = () => {
                if (punchEl && punch) typeInto(punchEl, punch, finishPunch);
                else allDone = true;
            };
            const startTyping = () => typeInto(p, full, startPunch);

            const advance = () => {
                if (!allDone) {
                    // primo input: completa tutto istantaneamente, secondo input: avanza
                    if (typing) { clearInterval(typing); typing = null; }
                    p.textContent = full;
                    if (punchEl && punch) punchEl.textContent = punch;
                    allDone = true;
                    return;
                }
                sfx.ui();
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
            startTyping();
        };
        showCard();
    }

    /* ---------- finale: storia + titoli di coda ---------- */

    endingSequence(cards: { text: string; punch?: string }[], opts: { outcome: 'win' | 'lose'; title: string }, onDone: () => void): void {
        this.storySequence(cards, () => this.showCredits(opts, onDone));
    }

    private showCredits(opts: { outcome: 'win' | 'lose'; title: string }, onDone: () => void): void {
        const win = opts.outcome === 'win';
        const s = this.openOverlay(`screen opaque credits-screen ${win ? 'credits-win' : 'credits-lose'}`);

        const end = el('h1', 'credits-end');
        end.textContent = 'THE END';
        const sub = el('div', 'credits-sub font-marker');
        sub.textContent = opts.title;

        const roll = el('div', 'credits-roll');
        const inner = el('div', 'credits-inner');
        const game = el('div', 'credits-game');
        game.textContent = 'GECOWAVE';
        inner.append(game);
        for (const c of CREDITS) {
            if (c.role) {
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
        s.append(end, sub, roll);

        let fw: ReturnType<typeof setInterval> | null = null;
        const finish = () => {
            if (fw) { clearInterval(fw); fw = null; }
            this.closeOverlay();
            onDone();
        };
        const back = this.btn('torna al menu', 1, finish, win ? 'glass-acid-gold' : 'glass-acid-red');
        back.classList.add('credits-btn');
        s.append(back);

        if (win) {
            const colors = ['#4ade80', '#facc15', '#60a5fa', '#f472b6', '#22d3ee', '#fb923c'];
            fw = setInterval(() => {
                if (this.overlay !== s) { if (fw) clearInterval(fw); return; }
                const f = el('div', 'firework');
                f.style.left = `${8 + Math.random() * 84}%`;
                f.style.top = `${12 + Math.random() * 56}%`;
                f.style.setProperty('--fw', colors[Math.floor(Math.random() * colors.length)]);
                s.append(f);
                setTimeout(() => f.remove(), 1100);
            }, 420);
        }
        this.onEsc(finish);
    }

    showCharacterCreation(onConfirm: () => void): void {
        const s = this.openOverlay('screen opaque char-forge');
        this.setZone('yellow');

        // atmosfera souls-like: vignetta, brace fluttuante, emblema
        s.append(el('div', 'forge-vignette'));
        const embers = el('div', 'forge-embers');
        for (let i = 0; i < 16; i++) {
            const e = el('div', 'forge-ember');
            e.style.cssText = `left:${(Math.random() * 100).toFixed(1)}%;animation-delay:${(-Math.random() * 14).toFixed(2)}s;animation-duration:${(9 + Math.random() * 9).toFixed(2)}s;--drift:${(Math.random() * 50 - 25).toFixed(0)}px`;
            embers.append(e);
        }
        s.append(embers);
        s.append(el('div', 'forge-emblem font-crisis', '✦'));

        let finalName = 'Geco';
        let doomsdayMode = false;
        let availablePoints = 10;
        const stats = { forza: 0, costituzione: 0, flusso: 0 };

        // --- STEP 1: NOME ---
        const step1 = el('div', 'forge-step active');
        step1.append(el('div', 'forge-eyebrow font-martian', 'capitolo zero — il custode provvisorio'));
        step1.append(el('h1', 'forge-title font-crisis', 'COME TI CHIAMI?'));
        step1.append(el('div', 'forge-rule'));
        step1.append(el('div', 'forge-hint font-marker', 'incidi il tuo nome nella memoria del flusso'));

        const nameWrap = el('div', 'forge-nameplate');
        const input = el('input', 'forge-name-input font-crisis') as HTMLInputElement;
        input.type = 'text';
        input.value = '';
        input.maxLength = 12;
        input.placeholder = 'Geco';
        input.spellcheck = false;
        nameWrap.append(input);
        step1.append(nameWrap);

        const nextBtn = this.btn('continua →', 0, () => goToStep2(), 'glass-acid-gold');
        nextBtn.classList.add('forge-btn');
        step1.append(nextBtn);
        s.append(step1);

        input.addEventListener('keydown', (e) => {
            if (e.code === 'Enter') goToStep2();
        });
        setTimeout(() => input.focus(), 140);

        // --- STEP 2: PUNTI ---
        const step2 = el('div', 'forge-step');
        s.append(step2);

        const goToStep2 = () => {
            finalName = input.value.trim() || 'Geco';
            sfx.ui();
            step1.classList.remove('active');
            setTimeout(() => {
                step1.style.display = 'none';
                step2.style.display = 'flex';
                step2.classList.add('active');
                title2.textContent = `forgia di ${finalName.toLowerCase()}`;
                updateAll();
            }, 220);
        };

        const header = el('div', 'forge-header');
        header.append(el('div', 'forge-eyebrow font-martian', 'capitolo zero — allocazione del flusso'));
        const title2 = el('h1', 'forge-title forge-title-sm font-crisis', 'forgia del geco');
        header.append(title2);
        header.append(el('div', 'forge-rule'));
        step2.append(header);

        const layout = el('div', 'forge-body');
        step2.append(layout);

        const leftCol = el('div', 'forge-stats-col');
        const rightCol = el('div', 'forge-aside');
        layout.append(leftCol, rightCol);

        const pointsEl = el('div', 'forge-points');
        const pointsNum = el('span', 'forge-points-num font-martian', String(availablePoints));
        pointsEl.append(el('span', 'forge-points-lbl font-martian', 'punti da assegnare'), pointsNum);
        leftCol.append(pointsEl);

        // radar chart svg
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        // viewBox allargato: lascia spazio alle label ai vertici, così non sbordano
        svg.setAttribute('viewBox', '-48 -16 305 230');
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

        const labelForza = createRadarLabel(0, 'FORZA', 'middle', -6);
        const labelCost = createRadarLabel(1, 'COST', 'start', 10, 4);
        const labelFlus = createRadarLabel(2, 'FLUSSO', 'end', 10, -4);

        const createStatSelector = (key: 'forza' | 'costituzione' | 'flusso', label: string, desc: string) => {
            const row = el('div', 'forge-stat');

            const head = el('div', 'forge-stat-head');
            head.append(el('span', 'forge-stat-name font-marker', label));
            const valEl = el('span', 'forge-stat-val font-martian', '00');
            head.append(valEl);
            row.append(head);

            row.append(el('div', 'forge-stat-desc font-martian', desc));

            const ctl = el('div', 'forge-stat-ctl');
            const minus = el('button', 'forge-step-btn', '−');
            const plus = el('button', 'forge-step-btn', '+');
            const segmentsWrap = el('div', 'forge-segments');
            const segments: HTMLElement[] = [];
            for (let i = 1; i <= 10; i++) {
                const seg = el('div', 'forge-segment');
                segmentsWrap.append(seg);
                segments.push(seg);
                seg.addEventListener('click', () => {
                    const valToSet = (i === 1 && stats[key] === 1) ? 0 : i;
                    const diff = valToSet - stats[key];
                    if (diff > 0) {
                        const alloc = Math.min(diff, availablePoints);
                        if (alloc <= 0) return;
                        stats[key] += alloc; availablePoints -= alloc;
                    } else if (diff < 0) {
                        stats[key] += diff; availablePoints -= diff;
                    } else return;
                    sfx.ui();
                    updateAll();
                });
            }
            minus.addEventListener('click', () => {
                if (stats[key] <= 0) return;
                stats[key]--; availablePoints++; sfx.ui(); updateAll();
            });
            plus.addEventListener('click', () => {
                if (availablePoints <= 0 || stats[key] >= 10) return;
                stats[key]++; availablePoints--; sfx.ui(); updateAll();
            });
            ctl.append(minus, segmentsWrap, plus);
            row.append(ctl);
            leftCol.append(row);

            return () => {
                valEl.textContent = String(stats[key]).padStart(2, '0');
                segments.forEach((seg, idx) => seg.classList.toggle('filled', idx < stats[key]));
                minus.classList.toggle('disabled', stats[key] <= 0);
                plus.classList.toggle('disabled', availablePoints <= 0 || stats[key] >= 10);
            };
        };

        const updSelForza = createStatSelector('forza', 'forza', 'danno fisico +10% a punto');
        const updSelCost = createStatSelector('costituzione', 'costituzione', 'punti vita massimi +1 a punto');
        const updSelFlus = createStatSelector('flusso', 'flusso', 'flusso max +10 e risonante +10% a punto');

        const updateAll = () => {
            updSelForza();
            updSelCost();
            updSelFlus();

            pointsNum.textContent = String(availablePoints);
            pointsEl.classList.toggle('spent', availablePoints === 0);

            const dForza = 20 + (stats.forza / 10) * 60;
            const dCost = 20 + (stats.costituzione / 10) * 60;
            const dFlus = 20 + (stats.flusso / 10) * 60;

            const p0 = getPoint(dForza, 0);
            const p1 = getPoint(dCost, 1);
            const p2 = getPoint(dFlus, 2);
            statPoly.setAttribute('points', `${p0.x},${p0.y} ${p1.x},${p1.y} ${p2.x},${p2.y}`);

            labelForza.textContent = `FORZA · ${stats.forza}`;
            labelCost.textContent = `COST · ${stats.costituzione}`;
            labelFlus.textContent = `FLUSSO · ${stats.flusso}`;
        };

        const actions = el('div', 'forge-actions');
        const backBtn = this.btn('← nome', 0, () => {
            sfx.ui();
            step2.classList.remove('active');
            setTimeout(() => {
                step2.style.display = 'none';
                step1.style.display = 'flex';
                step1.classList.add('active');
                input.focus();
            }, 200);
        });
        backBtn.classList.add('forge-btn', 'forge-btn-ghost');
        const confirmBtn = this.btn('conferma attributi →', 0, () => {
            sfx.ui();
            step2.classList.remove('active');
            setTimeout(() => {
                step2.style.display = 'none';
                step3.style.display = 'flex';
                step3.classList.add('active');
                selectMode(false);
            }, 200);
        }, 'glass-acid-gold');
        confirmBtn.classList.add('forge-btn');
        actions.append(backBtn, confirmBtn);
        step2.append(actions);

        // --- STEP 3: MODALITÀ DI GIOCO ---
        const step3 = el('div', 'forge-step');
        s.append(step3);

        const header3 = el('div', 'forge-header');
        header3.append(el('div', 'forge-eyebrow font-martian', 'capitolo zero — scelta del destino'));
        const title3 = el('h1', 'forge-title forge-title-sm font-crisis', 'SCEGLI IL TUO DESTINO');
        header3.append(title3);
        header3.append(el('div', 'forge-rule'));
        step3.append(header3);

        const choiceContainer = el('div', 'doomsday-choices');
        
        const standardCard = el('div', 'mode-card standard-card');
        standardCard.append(el('div', 'card-glow'));
        standardCard.append(el('div', 'card-icon', '🧭'));
        standardCard.append(el('div', 'card-title font-marker', 'Standard'));
        standardCard.append(el('div', 'card-desc font-martian', 'L\'esperienza classica di gioco. Nessun timer: affronta i boss e vivi la storia al tuo ritmo.'));
        
        const doomsdayCard = el('div', 'mode-card doomsday-card');
        doomsdayCard.append(el('div', 'card-glow'));
        doomsdayCard.append(el('div', 'card-icon', '☠'));
        doomsdayCard.append(el('div', 'card-title font-marker', 'Doomsday'));
        doomsdayCard.append(el('div', 'card-desc font-martian', 'Il doomsday si avvicina col tempo reale. Se perdi troppo tempo, Pedro ti raggiunge e ti cancella.'));
        
        choiceContainer.append(standardCard, doomsdayCard);
        step3.append(choiceContainer);

        const actions3 = el('div', 'forge-actions');
        const backToStep2Btn = this.btn('← attributi', 0, () => {
            sfx.ui();
            s.classList.remove('doomsday-active');
            step3.classList.remove('active');
            setTimeout(() => {
                step3.style.display = 'none';
                step2.style.display = 'flex';
                step2.classList.add('active');
            }, 200);
        });
        backToStep2Btn.classList.add('forge-btn', 'forge-btn-ghost');

        const confirmRunBtn = this.btn('inizia la run →', 0, () => {
            state.save.playerName = finalName;
            state.save.stats.forza = stats.forza;
            state.save.stats.costituzione = stats.costituzione;
            state.save.stats.flusso = stats.flusso;
            state.save.doomsdayMode = doomsdayMode;
            state.save.doomsday = 0;
            state.persist();
            state.resetRun();
            this.closeOverlay();
            onConfirm();
        });
        confirmRunBtn.classList.add('forge-btn');

        actions3.append(backToStep2Btn, confirmRunBtn);
        step3.append(actions3);

        const selectMode = (isDoomsday: boolean) => {
            doomsdayMode = isDoomsday;
            standardCard.classList.toggle('selected', !isDoomsday);
            doomsdayCard.classList.toggle('selected', isDoomsday);
            s.classList.toggle('doomsday-active', isDoomsday);
            sfx.ui();
            
            // preserva le classi base sticker; cambia solo l'accento
            confirmRunBtn.className = 'btn sticker forge-btn';
            confirmRunBtn.classList.add(isDoomsday ? 'doomsday-confirm' : 'glass-acid-gold');
        };

        standardCard.addEventListener('click', () => selectMode(false));
        doomsdayCard.addEventListener('click', () => selectMode(true));
    }
}
