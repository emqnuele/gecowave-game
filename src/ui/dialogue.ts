import { ZONE_CSS } from '../config';
import { bus } from '../engine/events';
import { sfx } from '../engine/sfx';
import type { DialogueLine } from '../types';
import { el, ui } from './dom';

/** bolla di dialogo con typewriter: E/spazio/clic per avanzare */
export class DialogueBox {
    private box: HTMLElement | null = null;
    private lines: DialogueLine[] = [];
    private index = 0;
    private typed = 0;
    private typing: number | null = null;
    private onEnd?: () => void;
    private keyHandler = (e: KeyboardEvent) => {
        if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') {
            e.preventDefault();
            this.advance();
        }
    };

    constructor() {
        bus.on('dialogue-start', ({ lines, onEnd }) => this.start(lines, onEnd));
    }

    get open(): boolean {
        return this.box !== null;
    }

    private start(lines: DialogueLine[], onEnd?: () => void): void {
        this.close(false);
        this.lines = lines;
        this.index = 0;
        this.onEnd = onEnd;

        this.box = el('div', 'glass-panel');
        this.box.id = 'dialogue';
        this.box.dataset.anim = '1';
        const speaker = el('div', 'speaker sticker');
        const text = el('div', 'text font-martian');
        const hint = el('div', 'hint', 'E / clic per continuare');
        this.box.append(speaker, text, hint);
        this.box.addEventListener('click', () => this.advance());
        ui().append(this.box);
        window.addEventListener('keydown', this.keyHandler);
        this.showLine();
    }

    private showLine(): void {
        if (!this.box) return;
        const line = this.lines[this.index];
        const speaker = this.box.querySelector<HTMLElement>('.speaker')!;
        speaker.textContent = line.speaker;
        speaker.style.color = ZONE_CSS[line.color];
        this.box.className = `glass-panel glass-acid-${line.color}`;

        const text = this.box.querySelector<HTMLElement>('.text')!;
        text.textContent = '';
        this.typed = 0;
        if (this.typing) clearInterval(this.typing);
        this.typing = window.setInterval(() => {
            this.typed++;
            text.textContent = line.text.slice(0, this.typed);
            if (this.typed % 3 === 0) sfx.ui();
            if (this.typed >= line.text.length) {
                clearInterval(this.typing!);
                this.typing = null;
            }
        }, 18);
    }

    private advance(): void {
        if (!this.box) return;
        const line = this.lines[this.index];
        if (this.typing) {
            // primo input: completa la riga, secondo input: avanza
            clearInterval(this.typing);
            this.typing = null;
            this.box.querySelector<HTMLElement>('.text')!.textContent = line.text;
            return;
        }
        this.index++;
        if (this.index < this.lines.length) {
            this.showLine();
        } else {
            this.close(true);
        }
    }

    private close(fireEnd: boolean): void {
        if (this.typing) {
            clearInterval(this.typing);
            this.typing = null;
        }
        window.removeEventListener('keydown', this.keyHandler);
        this.box?.remove();
        this.box = null;
        if (fireEnd) {
            const cb = this.onEnd;
            this.onEnd = undefined;
            cb?.();
        }
    }
}
