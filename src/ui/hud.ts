import { COMBAT, ZONE_CSS } from '../config';
import { ABILITY_CARDS } from '../content/story';
import { bus } from '../engine/events';
import type { AbilityId } from '../types';
import { el } from './dom';

const ABILITY_ORDER: AbilityId[] = ['doubleJump', 'dash', 'verso'];

export class Hud {
    readonly root: HTMLElement;
    private hpRow: HTMLElement;
    private flowBar: HTMLElement;
    private barre: HTMLElement;
    private zone: HTMLElement;
    private waves: HTMLElement;
    private bossBar: HTMLElement | null = null;

    constructor() {
        this.root = el('div');
        this.root.id = 'hud';
        this.root.style.display = 'none';

        const topleft = el('div', 'hud-topleft glass-chip glass-acid-green');
        this.hpRow = el('div', 'hp-row');
        const flowWrap = el('div', 'flow-wrap');
        this.flowBar = el('div', 'flow-bar');
        flowWrap.append(this.flowBar);
        topleft.append(this.hpRow, flowWrap);

        this.barre = el('div', 'hud-barre sticker glass-acid-yellow', '♪ 0 barre');
        this.zone = el('div', 'hud-zone sticker', '');
        this.waves = el('div', 'hud-waves');

        this.root.append(topleft, this.barre, this.zone, this.waves);

        for (let i = 0; i < COMBAT.maxHp; i++) this.hpRow.append(el('div', 'hp-tick'));

        bus.on('hp-changed', ({ hp, hurt }) => this.setHp(hp, hurt));
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

    private setHp(hp: number, hurt: boolean): void {
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
        for (const id of ABILITY_ORDER) {
            if (!abilities.includes(id)) continue;
            const card = ABILITY_CARDS[id];
            const chip = el('div', 'wave-chip glass-chip');
            chip.append(el('kbd', '', card.key), el('span', 'wave-name', card.name.replace('wave del ', '').replace('wave della ', '')));
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
            this.bossBar.append(
                el('div', 'boss-name', payload.name),
                el('div', 'boss-track', '<div class="boss-fill" style="width:100%"></div>')
            );
            this.root.append(this.bossBar);
        }
        const fill = this.bossBar.querySelector<HTMLElement>('.boss-fill')!;
        fill.style.width = `${(payload.hp / payload.maxHp) * 100}%`;
    }
}
