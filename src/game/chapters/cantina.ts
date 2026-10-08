import { WAVESUNG } from '../../content/story';
import { bus } from '../../engine/events';
import { sfx } from '../../engine/sfx';
import { state } from '../../engine/state';
import type { BossKind } from '../../types';
import { Chapter, type ChapterCtx } from './ChapterScript';
import { Ambushes } from './shared/Ambushes';
import { waveOnce } from './shared/wave';

/** la cantina: lametta prigioniero di ticummi, filippus e il suo dono */
export class CantinaChapter extends Chapter {
    private readonly ambushes: Ambushes;

    constructor(ctx: ChapterCtx) {
        super(ctx);
        this.ambushes = new Ambushes(ctx);
    }

    setup(): void {
        waveOnce(this.scene, 'tease-arena-cantina', WAVESUNG.markolinoArenaTease, 30000);
        if (!state.hasFlag('wavesung-cantina')) {
            state.setFlag('wavesung-cantina');
            const msg = state.hasFlag('tommasorveglianza') ? WAVESUNG.ticummiClausola : WAVESUNG.ticummiArrabbiato;
            this.scene.time.delayedCall(1200, () => bus.emit('wavesung', msg));
        }
    }

    update(): void {
        this.ambushes.update();
    }

    interact(id: string): boolean {
        switch (id) {
            case 'filippus-dodo':
                this.ctx.dialogues.start('filippus-dodo', () => {
                    if (state.hasFlag('filippus-dono')) return;
                    state.setFlag('filippus-dono');
                    state.save.barre += 40;
                    bus.emit('barre-changed', { barre: state.save.barre, gained: true });
                    sfx.pickup();
                });
                return true;
            case 'lametta-cantina':
                if (state.hasFlag('boss-down-ticummi')) {
                    this.ctx.dialogues.start('lametta-libero');
                } else {
                    this.ctx.dialogues.start(id);
                }
                return true;
            default:
                return false;
        }
    }

    bossDefeated(kind: BossKind, _x: number, _y: number): void {
        switch (kind) {
            case 'ticummi':
                this.ctx.dialogues.start('ticummi-caduto', () => {
                    bus.emit('choice-show', {
                        title: 'la boccetta di trenbolone è lì. ticummi pure.',
                        options: [{ label: 'ridagli la boccetta' }, { label: 'calpestala davanti a lui', danger: true }],
                        onPick: (i) => {
                            if (i === 0) {
                                state.setFlag('ticummi-graziato');
                                this.ctx.dialogues.start('ticummi-pieta');
                            } else {
                                state.setFlag('trenbolone-distrutto');
                                this.ctx.dialogues.start('ticummi-niente');
                            }
                        },
                    });
                });
                break;
        }
    }
}
