import { TOASTS, WAVESUNG } from '../../content/story';
import { bus } from '../../engine/events';
import { state } from '../../engine/state';
import type { BossKind } from '../../types';
import { Chapter, type ChapterCtx, type Target } from './ChapterScript';
import { Ambushes } from './shared/Ambushes';
import { drinkSmela } from './shared/smela';

/** lo stabilimento: danjilo a metà, smela che si rivela alla sorgente */
export class StabilimentoChapter extends Chapter {
    private smelaArena: { x: number; y: number } | null = null;
    private readonly ambushes: Ambushes;

    constructor(ctx: ChapterCtx) {
        super(ctx);
        this.ambushes = new Ambushes(ctx);
    }

    /** marker invisibile: qui smela si rivela come boss finale */
    marker(id: string, x: number, y: number): boolean {
        if (id !== 'smela-arena') return false;
        this.smelaArena = { x, y };
        return true;
    }

    update(): void {
        this.updateSmelaArena();
        this.ambushes.update();
    }

    interact(id: string): boolean {
        if (id !== 'venditore-acqua') return false;
        this.ctx.dialogues.start(id, () => {
            if (state.run.smela) {
                bus.emit('toast', { text: 'ne hai già bevuta. l\'effetto smela III è già al lavoro.' });
                return;
            }
            bus.emit('choice-show', {
                title: 'acqua di smela, gratis. una sorsata?',
                options: [{ label: 'bevi', danger: true }, { label: 'no, grazie' }],
                onPick: (i) => {
                    if (i === 0) {
                        state.run.smela = true;
                        this.ctx.dialogues.start('smela-truffa', () => drinkSmela(this.ctx));
                        bus.emit('toast', { text: TOASTS.smela });
                    }
                },
            });
        });
        return true;
    }

    objective(): Target | undefined {
        if (this.smelaArena && state.hasFlag('boss-down-danjilo')) return { ...this.smelaArena, label: 'la sorgente' };
        return undefined;
    }

    bossDefeated(kind: BossKind, x: number, y: number): void {
        switch (kind) {
            case 'danjilo':
                this.ctx.dialogues.start('danjilo-sconfitto');
                break;
            case 'smela':
                this.ctx.dialogues.start('smela-sconfitta', () => {
                    state.setFlag('stabilimento-chiuso');
                    this.ctx.rewards.spawnFragment(x, y + 40, 'acquatossica', true);
                    this.scene.time.delayedCall(1500, () => bus.emit('wavesung', WAVESUNG.smelaRecensione));
                });
                break;
        }
    }

    /** smela si rivela boss finale quando arrivi in fondo (danjilo già fatto fuori) */
    private updateSmelaArena(): void {
        if (!this.smelaArena || this.ctx.bosses.current || this.ctx.flow.exiting || this.ctx.player.dead) return;
        if (state.hasFlag('boss-down-smela')) { this.smelaArena = null; return; }
        // smela si rivela solo dopo che hai sistemato danjilo a metà livello
        if (!state.hasFlag('boss-down-danjilo')) return;
        if (Math.abs(this.ctx.player.x - this.smelaArena.x) > 360 || Math.abs(this.ctx.player.y - this.smelaArena.y) > 380) return;
        const a = this.smelaArena;
        this.smelaArena = null;
        this.ctx.bosses.current = this.ctx.bosses.make(a.x, a.y, 'smela');
        this.ctx.bosses.introShown = false;
        this.ctx.bosses.light(this.ctx.bosses.current, this.ctx.bosses.current.def.glowColor, 280, 1.0);
        this.ctx.combat.setupBossColliders();
    }

}
