import { COMBAT, ZONE_CSS } from '../config';
import { ABILITY_CARDS } from '../content/story';
import { bus } from '../engine/events';
import { formatKeys } from '../engine/input/keyText';
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

/** costo minimo per accendere ogni wave: sotto, la chip si spegne */
const WAVE_MIN_COST: Partial<Record<AbilityId, number>> = {
    riflesso: COMBAT.riflessoCost,
    risonante: COMBAT.risonanteEcoCost,
    analisi: COMBAT.analisiCost,
    scudo: COMBAT.scudoCost,
    acquatossica: COMBAT.acquaCost,
};

const ACTIVE_ORDER: { id: AbilityId; text: string }[] = [
    { id: 'risonante', text: '{k:wave}' },
    { id: 'analisi', text: '{k:up}+{k:wave}' },
    { id: 'acquatossica', text: '{k:down}+{k:wave}' },
    { id: 'scudo', text: '{k:scudo}' },
    { id: 'riflesso', text: '{k:riflesso}' },
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
    private trial: HTMLElement;
    private seenAbilities: AbilityId[] = [];

    constructor() {
        this.root = el('div');
        this.root.id = 'hud';
        this.root.style.display = 'none';

        const topleft = el('div', 'hud-topleft');
        this.hpRow = el('div', 'hp-row');
        const flowWrap = el('div', 'flow-wrap');
        this.flowBar = el('div', 'flow-bar');
        flowWrap.append(this.flowBar);
        topleft.append(this.hpRow, flowWrap);

        this.barre = el('div', 'hud-barre', '♪ 0 barre');
        this.fragments = el('div', 'hud-fragments', '');
        this.tommaso = el('div', 'hud-tommaso', '🛡️ protetto da tommasorveglianza 👍');
        this.trenboBorder = el('div', 'trenbo-border');
        this.zone = el('div', 'hud-zone', '');
        this.waves = el('div', 'hud-waves');

        this.doomsday = el('div', 'doomsday-meter');
        this.doomsdayFill = el('div', 'doomsday-fill');
        const doomsdayLabel = el('div', 'doomsday-label font-marker', 'doomsday');
        this.doomsday.append(this.doomsdayFill, doomsdayLabel);
        this.doomsday.style.display = 'none';

        this.trial = el('div', 'hud-trial', '');
        this.trial.style.display = 'none';

        this.root.append(topleft, this.barre, this.fragments, this.tommaso, this.zone, this.waves, this.doomsday, this.trenboBorder, this.trial);

        for (let i = 0; i < state.maxHp; i++) this.hpRow.append(el('div', 'hp-tick'));

        bus.on('hp-changed', ({ hp, maxHp, hurt, regen }) => {
            this.setHp(hp, maxHp, hurt, regen);
            this.updateTrenbo();
        });
        bus.on('flow-changed', ({ flow, maxFlow }) => {
            this.flowBar.style.width = `${(flow / maxFlow) * 100}%`;
            this.updateTrenbo();
            this.refreshWaveFlow(flow);
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
        bus.on('trial-timer', (t) => {
            this.trial.style.display = t ? '' : 'none';
            if (!t) return;
            this.trial.textContent = `🚌 ${(t.left / 1000).toFixed(1)}`;
            this.trial.classList.toggle('critical', t.left < 5000);
        });
        bus.on('abilities-changed', ({ abilities }) => this.setAbilities(abilities));
        // i tasti veri cambiano col dispositivo e con la rimappatura
        bus.on('input-device', () => this.setAbilities(this.seenAbilities));
        bus.on('controls-changed', () => this.setAbilities(this.seenAbilities));
        bus.on('wave-cooldowns', ({ cds, flow }) => this.setCooldowns(cds, flow));
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
        this.updateDoomsdayVisibility();
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

    private updateDoomsdayVisibility(): void {
        // hide meter if exploration mode, update otherwise
        const active = state.save.doomsdayMode;
        this.doomsday.style.display = active ? '' : 'none';
        if (active) {
            this.doomsdayFill.style.width = `${Math.min(100, state.save.doomsday * 100)}%`;
            this.doomsday.classList.toggle('critical', state.save.doomsday >= 0.72);
        }
    }

    private updateDoomsdayColors(color: ZoneColor): void {
        const theme = DOOMSDAY_THEMES[color] || DOOMSDAY_THEMES.purple;
        this.doomsday.style.setProperty('--doomsday-primary', theme.primary);
        this.doomsday.style.setProperty('--doomsday-dark', theme.dark);
        this.doomsday.style.setProperty('--doomsday-shadow', theme.shadow);
        this.doomsday.style.setProperty('--doomsday-border', theme.border);
    }

    private setHp(hp: number, maxHp: number, hurt: boolean, regen = false): void {
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
        // la cura del rio pulsa sul cuore nuovo
        if (regen && hp > 0) {
            const fresh = ticks[hp - 1];
            if (fresh) {
                fresh.classList.remove('regen');
                void fresh.offsetWidth;
                fresh.classList.add('regen');
                setTimeout(() => fresh.classList.remove('regen'), 900);
            }
        }
    }

    private setAbilities(abilities: AbilityId[]): void {
        this.seenAbilities = [...abilities];
        this.waves.replaceChildren();
        for (const { id, text } of ACTIVE_ORDER) {
            if (!abilities.includes(id)) continue;
            const card = ABILITY_CARDS[id];
            const chip = el('div', 'wave-chip');
            chip.dataset.ability = id;
            chip.style.setProperty('--cd', '0');
            const kbd = el('kbd');
            kbd.textContent = formatKeys(text);
            const name = el('span', 'wave-name');
            name.textContent = card.name.replace('frammento del ', '').replace('frammento della ', '');
            chip.append(kbd, name);
            this.waves.append(chip);
        }
        this.refreshWaveFlow(state.run.flow);
    }

    /** velo di ricarica sulle chip, più chip spenta se il flow non basta */
    private setCooldowns(cds: Partial<Record<AbilityId, number>>, flow: number): void {
        for (const chip of Array.from(this.waves.children) as HTMLElement[]) {
            const id = chip.dataset.ability as AbilityId | undefined;
            if (!id) continue;
            chip.style.setProperty('--cd', `${cds[id] ?? 0}`);
            chip.classList.toggle('cooling', (cds[id] ?? 0) > 0);
        }
        this.refreshWaveFlow(flow);
    }

    private refreshWaveFlow(flow: number): void {
        const mult = state.mods.abilityCost;
        for (const chip of Array.from(this.waves.children) as HTMLElement[]) {
            const id = chip.dataset.ability as AbilityId | undefined;
            if (!id) continue;
            const cost = (WAVE_MIN_COST[id] ?? 0) * mult;
            chip.classList.toggle('noflow', flow < cost);
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
