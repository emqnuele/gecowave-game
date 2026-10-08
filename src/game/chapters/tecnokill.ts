import { expectCollectible } from '../../engine/ChapterCompletion';
import { bus } from '../../engine/events';
import { music } from '../../engine/music';
import { state } from '../../engine/state';
import type { BossKind } from '../../types';
import { Chapter } from './ChapterScript';

/** la tecnokill: notino col suo sparacchino, e lochef di passaggio */
export class TecnokillChapter extends Chapter {
    interact(id: string): boolean {
        if (id !== 'lochef-cameo') return false;
        music.playCustom("assets/music/lochef85's OST 1.mp3");
        this.ctx.dialogues.start(id);
        return true;
    }

    bossDefeated(kind: BossKind, x: number, y: number): void {
        switch (kind) {
            case 'notino':
                this.ctx.dialogues.start('notino-sconfitto', () => {
                    this.ctx.rewards.spawnFragment(x, y + 40, 'risonante', true);
                    if (state.hasFlag('notino-a-casa') || state.hasFlag('notino-disarmato')) return;
                    const letto = state.save.collectedLore.includes('nota-tecnokill-1');
                    bus.emit('choice-show', {
                        title: letto
                            ? 'notino è a terra, lo sparacchino accanto. in tasca hai il post-it di sua madre.'
                            : 'notino è a terra, lo sparacchino accanto. piagnucola qualcosa su una pasta che si fredda.',
                        options: [{ label: 'rimandalo a casa' }, { label: 'sequestra lo sparacchino', danger: true }],
                        onPick: (i) => {
                            if (i === 0) {
                                state.setFlag('notino-a-casa');
                                this.ctx.dialogues.start('notino-casa');
                            } else {
                                state.setFlag('notino-disarmato');
                                this.ctx.dialogues.start('notino-disarmato', () => {
                                    expectCollectible(this.ctx.world.def.id, 'charm-sparacchino', 'thing', () => state.hasCharm('sparacchino'));
                                    state.giveCharm('sparacchino');
                                    bus.emit('charm-found', { id: 'sparacchino' });
                                });
                            }
                        },
                    });
                });
                break;
        }
    }
}
