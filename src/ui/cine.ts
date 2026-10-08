import { sfx } from '../audio/sfx';
import { el, ui } from './dom';
import './chapterSummary.css';

/* il motore cinematico condiviso: schermo nero, un protagonista alla volta
   al centro che poi vola piccolo al suo posto. capitoli e finale usano
   lo stesso palco, gli stessi tempi, gli stessi suoni */

let open = false;

export function isCinematicOpen(): boolean {
    return open;
}

const HEART_PATH = 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';

export function heartIcon(found: boolean): SVGElement {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    const p = document.createElementNS(ns, 'path');
    p.setAttribute('d', HEART_PATH);
    p.setAttribute('fill', found ? '#f87171' : 'none');
    p.setAttribute('stroke', found ? '#7f1d1d' : '#f87171');
    p.setAttribute('stroke-width', '1.6');
    svg.append(p);
    return svg;
}

export function fmt(n: number): string {
    return Math.round(n).toLocaleString('it-IT');
}

export class Cine {
    readonly root: HTMLElement;
    readonly stage: HTMLElement;
    readonly fit: HTMLElement;
    readonly head: HTMLElement;
    readonly hero: HTMLElement;
    readonly dock: HTMLElement;
    readonly hint: HTMLElement;
    readonly flash: HTMLElement;
    readonly reduced: boolean;
    ready = false;

    private timers: number[] = [];
    private rafs = new Set<number>();
    private flights: HTMLElement[] = [];
    private seq = 0;
    private skipped = false;
    private closed = false;
    private continued = false;
    private lastTick = 0;
    private t0 = performance.now();
    private onKey: ((e: KeyboardEvent) => void) | null = null;
    private onResize: (() => void) | null = null;

    private constructor(accent: string) {
        this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const root = el('div', 'chsum-overlay');
        root.setAttribute('role', 'dialog');
        root.setAttribute('aria-label', 'riepilogo');
        root.style.setProperty('--chsum-accent', accent);
        root.append(el('div', 'chsum-glow'), el('div', 'chsum-bar-top'), el('div', 'chsum-bar-bot'));
        this.flash = el('div', 'chsum-flash');
        root.append(this.flash);
        this.stage = el('div', 'chsum-stage');
        root.append(this.stage);
        this.fit = el('div', 'chsum-fit');
        this.stage.append(this.fit);
        ui().append(root);
        this.root = root;
        this.head = el('div', 'chsum-head');
        this.hero = el('div', 'chsum-hero');
        this.dock = el('div', 'chsum-dock');
        this.hint = el('div', 'chsum-go-hint', 'clicca ovunque per continuare');
        this.fit.append(this.head, this.hero, this.dock, this.hint);
        this.fitToScreen();
        this.onResize = () => {
            if (!this.closed) this.fitToScreen();
        };
        window.addEventListener('resize', this.onResize);
        if (document.fonts?.ready) {
            document.fonts.ready.then(() => {
                if (!this.closed) this.fitToScreen();
            }).catch(() => {});
        }
    }

    /** apre il palco; null se ce n'è già uno (non si resta mai bloccati) */
    static open(accent: string): Cine | null {
        if (open) return null;
        open = true;
        sfx.init();
        return new Cine(accent);
    }

    fitToScreen(): void {
        this.fit.style.transform = '';
        const h = this.fit.scrollHeight;
        const avail = window.innerHeight * 0.92;
        const s = h > 0 ? Math.min(1, avail / h) : 1;
        if (s < 1) this.fit.style.transform = `scale(${s})`;
    }

    get done(): boolean {
        return this.skipped || this.closed;
    }

    /** tick morbido, mai più di ~12 al secondo */
    tick(): void {
        const now = performance.now();
        if (now - this.lastTick > 85) {
            this.lastTick = now;
            sfx.barra();
        }
    }

    /** il colpo di chi muore: la sezione diventa rossa e lo schermo trema */
    boom(block: HTMLElement): void {
        block.classList.add('bad');
        sfx.die();
        if (this.reduced) return;
        this.flash.classList.remove('hit');
        void this.flash.offsetWidth;
        this.flash.classList.add('hit');
        this.stage.classList.remove('shake');
        void this.stage.offsetWidth;
        this.stage.classList.add('shake');
    }

    later(ms: number, fn: () => void): void {
        // movimento ridotto: la stessa sequenza, compressa e scaglionata
        if (this.reduced) {
            ms = Math.min(150 + this.seq * 80, 1600);
            this.seq++;
        }
        this.timers.push(window.setTimeout(() => {
            if (this.done) return;
            fn();
        }, ms));
    }

    count(dur: number, to: number, render: (v: number) => void, onEnd?: () => void): void {
        if (this.reduced) {
            render(to);
            if (onEnd) onEnd();
            return;
        }
        const start = performance.now();
        let prev = -1;
        const step = (now: number): void => {
            if (this.done) return;
            const k = Math.min(1, (now - start) / dur);
            const eased = 1 - Math.pow(1 - k, 3);
            const v = to * eased;
            render(v);
            if (Math.floor(v) !== prev) {
                prev = Math.floor(v);
                this.tick();
            }
            if (k < 1) {
                const id = requestAnimationFrame(step);
                this.rafs.add(id);
            } else if (onEnd) {
                onEnd();
            }
        };
        const id = requestAnimationFrame(step);
        this.rafs.add(id);
    }

    chip(text: string, bad: boolean): HTMLElement {
        return el('div', `chsum-chip${bad ? ' bad' : ''}`, text);
    }

    setHero(node: HTMLElement): void {
        this.hero.replaceChildren(node);
        requestAnimationFrame(() => node.classList.add('enter'));
    }

    /** il protagonista vola piccolo al suo posto; l'originale sparisce subito */
    flyTo(from: HTMLElement, parent: HTMLElement, chip: HTMLElement, done: () => void): void {
        parent.append(chip);
        if (this.reduced) {
            chip.classList.add('lit');
            done();
            return;
        }
        const r1 = from.getBoundingClientRect();
        const r2 = chip.getBoundingClientRect();
        if (r1.width === 0 || r2.width === 0) {
            chip.classList.add('lit');
            done();
            return;
        }
        const clone = from.cloneNode(true) as HTMLElement;
        clone.style.cssText += `;position:fixed;left:${r1.left}px;top:${r1.top}px;width:${r1.width}px;height:${r1.height}px;margin:0;z-index:5;pointer-events:none;transform-origin:center center;`;
        this.root.append(clone);
        this.flights.push(clone);
        // l'originale sparisce subito e per davvero: il fill delle animazioni
        // di entrata non deve poterlo tenere acceso
        from.classList.remove('enter');
        from.style.visibility = 'hidden';
        from.classList.add('leaving');
        const dx = r2.left + r2.width / 2 - (r1.left + r1.width / 2);
        const dy = r2.top + r2.height / 2 - (r1.top + r1.height / 2);
        const s = Math.max(0.05, Math.min(1, r2.width / r1.width));
        try {
            const anim = clone.animate(
                [
                    { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                    { transform: `translate(${dx * 0.08}px, ${dy * 0.08}px) scale(1.04)`, opacity: 1, offset: 0.18 },
                    { transform: `translate(${dx}px, ${dy}px) scale(${s})`, opacity: 0.9 },
                ],
                { duration: 650, easing: 'cubic-bezier(.3,.7,.3,1)' },
            );
            anim.finished.then(() => {
                clone.remove();
                chip.classList.add('lit');
                done();
            }).catch(() => {
                clone.remove();
                chip.classList.add('lit');
                done();
            });
        } catch {
            clone.remove();
            chip.classList.add('lit');
            done();
        }
    }

    /** salto alla fine col primo tocco, oltre col secondo */
    arm(skip: () => void, done: () => void): void {
        const onTap = (): void => {
            if (this.closed || this.continued) return;
            if (performance.now() - this.t0 < 1000) return;
            if (!this.ready) skip();
            else {
                this.continued = true;
                sfx.menuSelect();
                this.cleanup();
                done();
            }
        };
        this.onKey = (e: KeyboardEvent) => {
            if (e.code === 'Enter' || e.code === 'Space') {
                e.preventDefault();
                e.stopPropagation();
                onTap();
            }
        };
        window.addEventListener('keydown', this.onKey, true);
        this.root.addEventListener('click', onTap);
    }

    /** ferma tutto e prepara lo stato finale: chi salta chiama i finali */
    freeze(): void {
        this.skipped = true;
        for (const t of this.timers) window.clearTimeout(t);
        this.timers.length = 0;
        for (const c of this.flights) c.remove();
        this.flights.length = 0;
    }

    cleanup(): void {
        this.freeze();
        for (const id of this.rafs) cancelAnimationFrame(id);
        this.rafs.clear();
        if (this.onKey) window.removeEventListener('keydown', this.onKey, true);
        if (this.onResize) window.removeEventListener('resize', this.onResize);
        this.root.remove();
        open = false;
    }
}
