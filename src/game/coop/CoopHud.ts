import type Phaser from 'phaser';
import { skinFinalCss } from '../../art/playerSkin';
import { skinPreset } from '../../content/skins';
import type { LinkState } from '../../net/session';
import { el, ui } from '../../ui/dom';
import type { RemoteGeco } from './RemoteGeco';

/* il compagno a colpo d'occhio: chi è, quanti cuori ha, cosa sta facendo,
   e una freccia sul bordo quando esce dallo schermo */
export class CoopHud {
    private readonly chip: HTMLElement;
    private readonly dot: HTMLElement;
    private readonly who: HTMLElement;
    private readonly hearts: HTMLElement;
    private readonly state: HTMLElement;
    private readonly arrow: HTMLElement;
    private readonly arrowLbl: HTMLElement;
    private link: LinkState = 'buono';
    private lastKey = '';

    constructor() {
        this.chip = el('div', 'cx-partner');
        this.dot = el('i', 'cx-dot');
        this.who = el('span', 'who');
        this.hearts = el('div', 'hearts');
        this.state = el('span', 'state');
        this.chip.append(this.dot, this.who, this.hearts, this.state);
        this.chip.style.opacity = '0';
        this.arrow = el('div', 'cx-arrow');
        const tip = el('div', 'tip');
        this.arrowLbl = el('div', 'lbl');
        this.arrow.append(tip, this.arrowLbl);
        ui().append(this.chip, this.arrow);
    }

    setLink(link: LinkState): void {
        this.link = link;
        this.lastKey = '';
    }

    update(partner: RemoteGeco | null, cam: Phaser.Cameras.Scene2D.Camera): void {
        if (!partner?.active || !partner.visible || !partner.last) {
            this.chip.style.opacity = this.link === 'buono' ? '0' : '1';
            if (this.link !== 'buono') this.paintLost();
            this.arrow.classList.remove('on');
            return;
        }
        const s = partner.last;
        const name = partner.char.name.toLowerCase();
        const status = this.link !== 'buono' ? 'connessione instabile' : s.dead || s.down ? 'a terra' : s.frozen ? 'legge' : s.hidden ? 'nascosto' : '';
        const key = `${name}|${s.hp}|${s.maxHp}|${status}|${partner.char.skin}`;
        if (key !== this.lastKey) {
            this.lastKey = key;
            this.chip.style.opacity = '1';
            this.dot.style.background = skinFinalCss(skinPreset(partner.char.skin));
            this.who.textContent = name;
            const max = Math.max(1, Math.min(20, s.maxHp));
            const hp = Math.max(0, Math.min(max, s.hp));
            const hearts: HTMLElement[] = [];
            for (let i = 0; i < max; i++) hearts.push(el('i', i < hp ? '' : 'off'));
            this.hearts.replaceChildren(...hearts);
            this.state.textContent = status;
            this.chip.classList.toggle('down', s.dead || s.down);
            this.chip.classList.toggle('weak', this.link !== 'buono');
            this.arrowLbl.textContent = name;
            this.arrow.style.setProperty('--cx-skin', skinFinalCss(skinPreset(partner.char.skin)));
        }
        this.pointAt(partner, cam);
    }

    private paintLost(): void {
        const key = `perso|${this.link}`;
        if (key === this.lastKey) return;
        this.lastKey = key;
        this.who.textContent = 'il compagno';
        this.hearts.replaceChildren();
        this.state.textContent = this.link === 'perso' ? 'connessione persa' : 'connessione instabile';
        this.chip.classList.add('weak');
    }

    /** fuori dallo schermo: una punta sul bordo, nella sua direzione */
    private pointAt(p: RemoteGeco, cam: Phaser.Cameras.Scene2D.Camera): void {
        const v = cam.worldView;
        const inside = p.x > v.x && p.x < v.right && p.y > v.y && p.y < v.bottom;
        if (inside) {
            this.arrow.classList.remove('on');
            return;
        }
        const cx = v.centerX;
        const cy = v.centerY;
        const ang = Math.atan2(p.y - cy, p.x - cx);
        const w = window.innerWidth;
        const h = window.innerHeight;
        const m = 46;
        // dal centro verso il compagno, fino al bordo dello schermo
        const dx = Math.cos(ang);
        const dy = Math.sin(ang);
        const kx = dx !== 0 ? (w / 2 - m) / Math.abs(dx) : Infinity;
        const ky = dy !== 0 ? (h / 2 - m) / Math.abs(dy) : Infinity;
        const k = Math.min(kx, ky);
        const sx = w / 2 + dx * k;
        const sy = h / 2 + dy * k;
        this.arrow.style.transform = `translate(calc(${sx}px - 50%), calc(${sy}px - 50%))`;
        (this.arrow.firstElementChild as HTMLElement).style.transform = `rotate(${ang + Math.PI / 2}rad)`;
        this.arrow.classList.add('on');
    }

    destroy(): void {
        this.chip.remove();
        this.arrow.remove();
    }
}
