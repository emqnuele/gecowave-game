import Phaser from 'phaser';
import { TOASTS } from '../content/story';
import { bus } from '../engine/events';
import { state } from '../engine/state';
import type { BossKind } from '../types';
import { indiziRaccolti } from './chapters/caso';
import type { GameContext, GameSystem } from './context';

type DoomsdayCtx = Pick<GameContext, 'simulates' | 'world' | 'player' | 'bosses' | 'chapter' | 'enemies' | 'combat' | 'dialogues' | 'feel' | 'flow'>;

/** la modalità doomsday del realm: il tempo stringe, i glitch infestano, pedro raggiunge il custode */
export class Doomsday implements GameSystem {
    /** il pedro in campo è quello del collasso, non quello della trama: morire qui chiude la partita */
    collapsePedro = false;
    private collapseTriggered = false;
    private doomsdayWarned = 0;
    private replacedBossKind: BossKind | null = null;
    private replacedBossX = 0;
    private replacedBossY = 0;
    private nextWildGlitchAt = 0;
    private readonly ctx: DoomsdayCtx;

    constructor(ctx: DoomsdayCtx) {
        this.ctx = ctx;
    }

    update(time: number, delta: number): void {
        if (!this.ctx.simulates) return;
        if (!state.save.doomsdayMode || this.ctx.player.dead || this.ctx.flow.exiting) return;
        // niente doomsday durante gli scontri di trama già tesi
        if (this.ctx.chapter.storyFight?.()) return;
        const v = state.tickDoomsday(delta);
        bus.emit('doomsday-changed', { value: v, active: true });

        if (v >= 0.45 && this.doomsdayWarned < 1) {
            this.doomsdayWarned = 1;
            bus.emit('toast', { text: TOASTS.doomsdayWarn1 });
        }
        if (v >= 0.72 && this.doomsdayWarned < 2) {
            this.doomsdayWarned = 2;
            bus.emit('toast', { text: TOASTS.doomsdayWarn2 });
        }

        const activeBoss = this.ctx.bosses.current && this.ctx.bosses.current.engaged;

        // glitch selvaggi che infestano qualsiasi zona quando il doomsday avanza
        if (v >= 0.6 && !activeBoss && time >= this.nextWildGlitchAt) {
            this.nextWildGlitchAt = time + Phaser.Math.Between(3500, 6500);
            const side = Math.random() < 0.5 ? -1 : 1;
            const gx = Phaser.Math.Clamp(this.ctx.player.x + side * 420, 40, this.ctx.world.level.widthPx - 40);
            const at = this.ctx.world.openSpotNear(gx, this.ctx.player.y - 80);
            this.ctx.enemies.spawnEnemy('glitchetto', at.x, at.y, { hunting: true });
        }

        // doomsday pieno: pedro raggiunge il custode. boss anticipato, quasi impossibile.
        if (v >= 1 && !this.collapseTriggered && !activeBoss && this.ctx.world.def.script !== 'pedro') {
            this.collapseTriggered = true;
            this.collapsePedro = true;
            if (this.ctx.bosses.current) {
                this.replacedBossKind = this.ctx.bosses.current.def.kind;
                this.replacedBossX = this.ctx.bosses.current.x;
                this.replacedBossY = this.ctx.bosses.current.y;
                this.ctx.bosses.current.destroy();
            } else {
                this.replacedBossKind = null;
            }
            bus.emit('toast', { text: TOASTS.doomsdayPedro });
            this.ctx.feel.shake(400, 0.012);
            this.ctx.dialogues.start('doomsday-pedro', () => {
                const px = Phaser.Math.Clamp(this.ctx.player.x + 220, 80, this.ctx.world.level.widthPx - 80);
                const at = this.ctx.world.openSpotNear(px, this.ctx.player.y - 120);
                this.ctx.bosses.current = this.ctx.bosses.make(at.x, at.y, 'pedro');
                this.ctx.bosses.current.frenzy = true;
                this.ctx.bosses.light(this.ctx.bosses.current, this.ctx.bosses.current.def.glowColor, 320, 1.1);
                this.ctx.combat.setupBossColliders();
                this.ctx.bosses.current.engage();
            });
        }
    }


    /** pedro del doomsday: respinto, non è il pedro della trama. niente finale, torna il boss di prima */
    repel(): boolean {
        if (!this.collapsePedro) return false;
        this.collapsePedro = false;
        this.collapseTriggered = false;
        this.doomsdayWarned = 1;
        state.setDoomsday(0.55);
        const replaced = this.replacedBossKind;
        const rx = this.replacedBossX;
        const ry = this.replacedBossY;
        this.replacedBossKind = null;
        this.ctx.bosses.introShown = false;
        this.ctx.dialogues.start('doomsday-respinto', () => {
            if (replaced) {
                const hpOverride = replaced === 'ombra' && !state.hasFlag('tommasorveglianza') ? 34 : undefined;
                this.ctx.bosses.current = this.ctx.bosses.make(rx, ry, replaced, hpOverride);
                if (replaced === 'guggu' && state.hasFlag('ivan')) this.ctx.bosses.current.invulnerable = false;
                if (replaced === 'limite' && indiziRaccolti() >= 3) this.ctx.bosses.current.invulnerable = false;
                if (replaced === 'ticummi' && state.hasFlag('tommasorveglianza')) this.ctx.bosses.current.summonOverride = 'eco';
                this.ctx.bosses.light(this.ctx.bosses.current, this.ctx.bosses.current.def.glowColor, 280, 1.0);
                this.ctx.combat.setupBossColliders();
            }
        });
        return true;
    }

    destroy(): void {}
}
