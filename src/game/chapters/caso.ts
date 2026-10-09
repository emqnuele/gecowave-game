import { bus } from '../../core/events';
import { haptics } from '../../input/haptics';
import { state } from '../../core/state';
import type { BossKind } from '../../types';
import { Chapter, type ChapterCtx } from './ChapterScript';
import { Ambushes } from './shared/Ambushes';

/** il limite si arresta solo con tutti e tre gli indizi */
export function indiziRaccolti(): number {
    return ['indizio-1', 'indizio-2', 'indizio-3'].filter((f) => state.hasFlag(f)).length;
}

/** il caso analisi 1: romero, i tre indizi, il limite notevole */
export class CasoChapter extends Chapter {
    private readonly ambushes: Ambushes;

    constructor(ctx: ChapterCtx) {
        super(ctx);
        this.ambushes = new Ambushes(ctx);
    }

    update(): void {
        this.ambushes.update();
    }

    interact(id: string): boolean {
        switch (id) {
            case 'romero-caso': {
                const pre = state.hasFlag('lochef-arrestato') ? 'romero-lochef' : null;
                if (pre && !state.hasFlag('romero-lochef-detto')) {
                    state.setFlag('romero-lochef-detto');
                    this.ctx.dialogues.start(pre, () => this.ctx.dialogues.start(id));
                } else {
                    this.ctx.dialogues.start(id);
                }
                return true;
            }
            case 'indizio-1':
            case 'indizio-2':
            case 'indizio-3':
                this.interactIndizio(id);
                return true;
            default:
                return false;
        }
    }

    bossDefeated(kind: BossKind, x: number, y: number): void {
        switch (kind) {
            case 'limite':
                this.ctx.dialogues.start('romero-verdetto', () => {
                    state.setFlag('caso-risolto');
                    this.ctx.rewards.spawnCuore(x, y + 40, 'cuore-limite', true);
                });
                break;
        }
    }

    private interactIndizio(id: string): void {
        this.ctx.dialogues.start(id, () => {
            if (!state.hasFlag(id)) {
                state.setFlag(id);
                // la foto per il fascicolo: un istante in bianco e nero
                this.ctx.lens.kick({ desat: 1, zoom: 0.02, dark: 0.25 }, 10, 380, 800);
                haptics.rumble(0, 0.35, 70);
                const n = indiziRaccolti();
                bus.emit('toast', { text: `indizio acquisito al fascicolo (${n}/3).` });
                if (n >= 3) {
                    if (this.ctx.bosses.current?.def.kind === 'limite') this.ctx.bosses.current.invulnerable = false;
                    this.ctx.dialogues.start('caso-completo');
                }
            }
        });
    }

}
