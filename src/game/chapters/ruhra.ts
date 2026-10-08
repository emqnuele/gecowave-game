import { TOASTS, WAVESUNG } from '../../content/story';
import { bus } from '../../engine/events';
import { state } from '../../engine/state';
import type { BossKind } from '../../types';
import { Chapter, type ChapterCtx, type Target } from './ChapterScript';
import { Ambushes } from './shared/Ambushes';
import { waveOnce } from './shared/wave';

/** la ruhra: piema ha bisogno di te, la porta non si apre finché non entri nella sua testa */
export class RuhraChapter extends Chapter {
    private readonly ambushes: Ambushes;

    constructor(ctx: ChapterCtx) {
        super(ctx);
        this.ambushes = new Ambushes(ctx);
    }

    setup(): void {
        waveOnce(this.scene, 'tease-corse-ruhra', WAVESUNG.markolinoCorseTease, 30000);
        if (!state.hasFlag('wavesung-piema')) {
            state.setFlag('wavesung-piema');
            this.scene.time.delayedCall(1200, () => bus.emit('wavesung', WAVESUNG.markolinoPiema));
        }
    }

    update(): void {
        this.ambushes.update();
    }

    interact(id: string): boolean {
        if (id !== 'piema-mente') return false;
        this.interactPiema();
        return true;
    }

    exitLock(): string | null {
        return state.hasAbility('analisi') ? null : 'piema ha ancora bisogno di te. la porta non si apre.';
    }

    objective(): Target | null | undefined {
        if (state.hasAbility('analisi')) return undefined;
        const at = this.ctx.npcs.at.get('piema-mente');
        return at ? { ...at, label: 'piema' } : null;
    }

    bossDefeated(kind: BossKind, _x: number, _y: number): void {
        switch (kind) {
            case 'riba':
                this.ctx.dialogues.start('riba-sconfitta', () => {
                    state.setFlag('dispositivo');
                    bus.emit('toast', { text: TOASTS.dispositivo });
                });
                break;
        }
    }

    private interactPiema(): void {
        if (state.hasAbility('analisi')) {
            bus.emit('toast', { text: 'piema sta facendo le valigie per andare da lametta.' });
            return;
        }
        if (!state.hasFlag('dispositivo')) {
            this.ctx.dialogues.start('piema-senza-dispositivo');
            return;
        }
        this.ctx.dialogues.start('piema-folle', () => {
            this.scene.cameras.main.flash(500, 96, 165, 250);
            this.ctx.flow.gotoLevel('mente');
        });
    }

}
