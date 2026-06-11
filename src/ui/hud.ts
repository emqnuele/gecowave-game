import { ZONE_CSS } from '../config';
import { ABILITY_CARDS } from '../content/story';
import { bus } from '../engine/events';
import { state } from '../engine/state';
import type { AbilityId } from '../types';
import { el } from './dom';

const ACTIVE_ORDER: { id: AbilityId; key: string }[] = [
    { id: 'risonante', key: 'F' },
    { id: 'riflesso', key: 'G' },
    { id: 'analisi', key: 'H' },
];

export class Hud {
    readonly root: HTMLElement;
    private hpRow: HTMLElement;
    private flowBar: HTMLElement;
    private barre: HTMLElement;
    private fragments: HTMLElement;
    private zone: HTMLElement;
    private waves: HTMLElement;
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
        this.zone = el('div', 'hud-zone sticker', '');
        this.waves = el('div', 'hud-waves');

        this.root.append(topleft, this.barre, this.fragments, this.zone, this.waves);

        for (let i = 0; i < state.maxHp; i++) this.hpRow.append(el('div', 'hp-tick'));

        bus.on('hp-changed', ({ hp, maxHp, hurt }) => this.setHp(hp, maxHp, hurt));
        bus.on('flow-changed', ({ flow, maxFlow }) => {
            this.flowBar.style.width = `${(flow / maxFlow) * 100}%`;
        });
        bus.on('barre-changed', ({ barre, gained }) => {
            this.barre.textContent = `♪ ${barre} barre`;
            if (gained) {
                this.barre.classList.remove('bump');
                void this.barre.offsetWidth;
                this.barre.classList.add('bump');
            }
        });
        bus.on('fragments-changed', ({ count, total }) => {
            this.fragments.textContent = `✦ wave ${count}/${total}`;
        });
        bus.on('zone-changed', ({ title, accentWord, color }) => {
            this.zone.textContent = `${title.toLowerCase()} ${accentWord}`;
            this.zone.style.color = ZONE_CSS[color];
        });
        bus.on('abilities-changed', ({ abilities }) => this.setAbilities(abilities));
        bus.on('boss-hp', (payload) => this.setBoss(payload));
    }

    show(): void { this.root.style.display = ''; }
    hide(): void {
        this.root.style.display = 'none';
        this.setBoss(null);
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
