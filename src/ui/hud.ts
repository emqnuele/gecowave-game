import { ZONE_CSS } from '../config';
import { ABILITY_CARDS } from '../content/story';
import { bus } from '../engine/events';
import { state } from '../engine/state';
import type { AbilityId, ZoneColor } from '../types';
import { el } from './dom';

const DOOMSDAY_THEMES: Record<ZoneColor, { primary: string; dark: string; shadow: string; border: string }> = {
    green: { primary: '#4ade80', dark: '#166534', shadow: 'rgba(74, 222, 128, 0.7)', border: 'rgba(74, 222, 128, 0.35)' },
    purple: { primary: '#c084fc', dark: '#6b21a8', shadow: 'rgba(192, 132, 252, 0.7)', border: 'rgba(192, 132, 252, 0.35)' },
    orange: { primary: '#fb923c', dark: '#9a3412', shadow: 'rgba(251, 146, 60, 0.7)', border: 'rgba(251, 146, 60, 0.35)' },
    blue: { primary: '#60a5fa', dark: '#1e40af', shadow: 'rgba(96, 165, 250, 0.7)', border: 'rgba(96, 165, 250, 0.35)' },
    red: { primary: '#f87171', dark: '#991b1b', shadow: 'rgba(248, 113, 113, 0.7)', border: 'rgba(248, 113, 113, 0.35)' },
    yellow: { primary: '#facc15', dark: '#854d0e', shadow: 'rgba(250, 204, 21, 0.7)', border: 'rgba(250, 204, 21, 0.35)' },
    cyan: { primary: '#22d3ee', dark: '#075985', shadow: 'rgba(34, 211, 238, 0.7)', border: 'rgba(34, 211, 238, 0.35)' },
};

const ACTIVE_ORDER: { id: AbilityId; key: string }[] = [
    { id: 'risonante', key: 'F' },
    { id: 'riflesso', key: 'G' },
    { id: 'analisi', key: 'H' },
    { id: 'scudo', key: 'R' },
    { id: 'acquatossica', key: 'V' },
];

export class Hud {
    readonly root: HTMLElement;
    private hpRow: HTMLElement;
    private flowBar: HTMLElement;
    private barre: HTMLElement;
    private fragments: HTMLElement;
    private zone: HTMLElement;
    private waves: HTMLElement;
    private tommaso: HTMLElement;
    private trenboBorder: HTMLElement;
    private doomsday: HTMLElement;
    private doomsdayFill: HTMLElement;
    private bossBar: HTMLElement | null = null;

    constructor() {
        this.root = el('div');
        this.root.id = 'hud';
        this.root.style.display = 'none';

        const topleft = el('div', 'hud-topleft glass-chip glass-acid-orange');
        this.hpRow = el('div', 'hp-row');
        const flowWrap = el('div', 'flow-wrap');
        this.flowBar = el('div', 'flow-bar');
        flowWrap.append(this.flowBar);
        topleft.append(this.hpRow, flowWrap);

        this.barre = el('div', 'hud-barre sticker glass-acid-yellow', '♪ 0 barre');
        this.fragments = el('div', 'hud-fragments sticker glass-acid-green', '');
        this.tommaso = el('div', 'hud-tommaso sticker glass-acid-blue', '🛡️ protetto da tommasorveglianza 👍');
        this.trenboBorder = el('div', 'trenbo-border');
        this.zone = el('div', 'hud-zone sticker', '');
        this.waves = el('div', 'hud-waves');

        this.doomsday = el('div', 'doomsday-meter');
        this.doomsdayFill = el('div', 'doomsday-fill');
        const doomsdayLabel = el('div', 'doomsday-label font-marker', 'doomsday');
        this.doomsday.append(this.doomsdayFill, doomsdayLabel);
        this.doomsday.style.display = 'none';

        this.root.append(topleft, this.barre, this.fragments, this.tommaso, this.zone, this.waves, this.doomsday, this.trenboBorder);

        for (let i = 0; i < state.maxHp; i++) this.hpRow.append(el('div', 'hp-tick'));

        bus.on('hp-changed', ({ hp, maxHp, hurt }) => {
            this.setHp(hp, maxHp, hurt);
            this.updateTrenbo();
        });
        bus.on('flow-changed', ({ flow, maxFlow }) => {
            this.flowBar.style.width = `${(flow / maxFlow) * 100}%`;
            this.updateTrenbo();
        });
        bus.on('barre-changed', ({ barre, gained }) => {
            this.barre.textContent = `♪ ${barre} barre`;
            if (gained) {
                this.barre.classList.remove('bump');
                void this.barre.offsetWidth;
                this.barre.classList.add('bump');
            }
            this.updateTommaso();
        });
        bus.on('fragments-changed', ({ count, total }) => {
            this.fragments.textContent = `✦ wave ${count}/${total}`;
        });
        bus.on('zone-changed', ({ title, accentWord, color }) => {
            this.zone.textContent = `${title.toLowerCase()} ${accentWord}`;
            this.zone.style.color = ZONE_CSS[color];
            this.updateDoomsdayColors(color);
        });
        bus.on('abilities-changed', ({ abilities }) => this.setAbilities(abilities));
        bus.on('boss-hp', (payload) => this.setBoss(payload));
        bus.on('doomsday-changed', ({ value, active }) => {
            this.doomsday.style.display = active ? '' : 'none';
            this.doomsdayFill.style.width = `${Math.min(100, value * 100)}%`;
            this.doomsday.classList.toggle('critical', value >= 0.72);
        });
    }

    show(): void {
        this.root.style.display = '';
        this.updateTommaso();
        this.updateTrenbo();
    }
    hide(): void {
        this.root.style.display = 'none';
        this.setBoss(null);
    }

    private updateTommaso(): void {
        this.tommaso.style.display = state.hasFlag('tommasorveglianza') ? '' : 'none';
    }

    private updateTrenbo(): void {
        this.trenboBorder.style.display = state.run.trenbolone ? 'block' : 'none';
    }

    private updateDoomsdayColors(color: ZoneColor): void {
        const theme = DOOMSDAY_THEMES[color] || DOOMSDAY_THEMES.purple;
        this.doomsday.style.setProperty('--doomsday-primary', theme.primary);
        this.doomsday.style.setProperty('--doomsday-dark', theme.dark);
        this.doomsday.style.setProperty('--doomsday-shadow', theme.shadow);
        this.doomsday.style.setProperty('--doomsday-border', theme.border);
    }

    private setHp(hp: number, maxHp: number, hurt: boolean): void {
        if (this.hpRow.children.length !== maxHp) {
            this.hpRow.replaceChildren();
            for (let i = 0; i < maxHp; i++) {
                this.hpRow.append(el('div', 'hp-tick'));
            }
        }
        const ticks = Array.from(this.hpRow.children) as HTMLElement[];
        ticks.forEach((t, i) => {
            const lost = i >= hp;
            if (lost && !t.classList.contains('lost') && hurt) {
                t.classList.add('hurt');
                setTimeout(() => t.classList.remove('hurt'), 400);
            }
            t.classList.toggle('lost', lost);
        });
    }

    private setAbilities(abilities: AbilityId[]): void {
        this.waves.replaceChildren();
        for (const { id, key } of ACTIVE_ORDER) {
            if (!abilities.includes(id)) continue;
            const card = ABILITY_CARDS[id];
            const chip = el('div', 'wave-chip glass-chip');
            const kbd = el('kbd');
            kbd.textContent = key;
            const name = el('span', 'wave-name');
            name.textContent = card.name.replace('frammento del ', '').replace('frammento della ', '');
            chip.append(kbd, name);
            this.waves.append(chip);
        }
    }

    private setBoss(payload: { hp: number; maxHp: number; name: string } | null): void {
        if (!payload) {
            this.bossBar?.remove();
            this.bossBar = null;
            return;
        }
        if (!this.bossBar) {
            this.bossBar = el('div', 'glass-panel glass-acid-red');
            this.bossBar.id = 'bossbar';
            const name = el('div', 'boss-name');
            name.textContent = payload.name;
            this.bossBar.append(name, el('div', 'boss-track', '<div class="boss-fill" style="width:100%"></div>'));
            this.root.append(this.bossBar);
        }
        const fill = this.bossBar.querySelector<HTMLElement>('.boss-fill')!;
        fill.style.width = `${(payload.hp / payload.maxHp) * 100}%`;
    }
}
