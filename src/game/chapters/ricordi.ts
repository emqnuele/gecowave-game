import { state } from '../../core/state';
import type { BossKind } from '../../types';
import { Chapter } from './ChapterScript';

/** i ricordi di pedro */
export class RicordiChapter extends Chapter {
    bossDefeated(kind: BossKind, _x: number, _y: number): void {
        switch (kind) {
            case 'pedrino':
                this.ctx.dialogues.start('pedrino-fine', () => {
                    state.setFlag('ricordi-visti');
                });
                break;
        }
    }
}
