import { ZONE_CSS } from '../config';
import { bus, type GameEvents } from '../engine/events';
import { formatKeys } from '../engine/input/keyText';
import { sfx } from '../engine/sfx';
import { el, ui } from './dom';
import './subtitles.css';

/* chi parla mentre si combatte non ferma il gioco: una riga sola in basso,
   come i sottotitoli di un film. le battute urgenti scavalcano la coda */

type Bark = GameEvents['bark'];

const MAX_QUEUE = 2;

export class Subtitles {
    private root: HTMLElement;
    private speaker: HTMLElement;
    private text: HTMLElement;
    private queue: Bark[] = [];
    private current: Bark | null = null;
    private typing: number | null = null;
    private hideAt: number | null = null;

    constructor() {
        this.root = el('div', 'subs');
        this.root.setAttribute('aria-live', 'polite');
        this.speaker = el('span', 'subs-speaker');
        this.text = el('span', 'subs-text');
        this.root.append(this.speaker, this.text);
        ui().append(this.root);
        bus.on('bark', (b) => this.push(b));
        bus.on('bark-clear', () => this.clear());
        // un dialogo vero si prende la scena: le battute di sottofondo tacciono
        bus.on('dialogue-start', () => this.clear());
    }

    private push(b: Bark): void {
        if (b.urgent) {
            this.queue = [b];
            this.next();
            return;
        }
        if (!this.current) {
            this.queue.push(b);
            this.next();
            return;
        }
        if (this.queue.length < MAX_QUEUE) this.queue.push(b);
    }

    private next(): void {
        this.stopTimers();
        const b = this.queue.shift();
        this.current = b ?? null;
        if (!b) {
            this.root.classList.remove('subs-on');
            return;
        }
        this.root.classList.toggle('subs-glitch', !!b.glitch);
        this.speaker.textContent = b.speaker;
        this.speaker.style.color = ZONE_CSS[b.color];
        this.text.textContent = '';
        this.root.classList.add('subs-on');
        // chi attacca parla: un solo tocco all'apertura, non un ticchettio in battaglia
        sfx.ui();
        const chars = [...formatKeys(b.text)];
        let typed = 0;
        const speed = b.glitch ? 22 : 15;
        this.typing = window.setInterval(() => {
            typed += 2;
            this.text.textContent = chars.slice(0, typed).join('');
            if (typed >= chars.length) {
                if (this.typing) clearInterval(this.typing);
                this.typing = null;
                // tempo di lettura: una riga corta resta due secondi, una lunga di più
                this.hideAt = window.setTimeout(() => this.next(), Math.max(2200, chars.length * 52));
            }
        }, speed);
    }

    private stopTimers(): void {
        if (this.typing) clearInterval(this.typing);
        if (this.hideAt) clearTimeout(this.hideAt);
        this.typing = null;
        this.hideAt = null;
    }

    clear(): void {
        this.queue = [];
        this.current = null;
        this.stopTimers();
        this.root.classList.remove('subs-on');
    }
}
