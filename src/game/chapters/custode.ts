import type { BossKind } from '../../types';
import { Chapter } from './ChapterScript';

/** il primo custode, capitolo segreto */
export class CustodeChapter extends Chapter {
    bossDefeated(kind: BossKind, x: number, y: number): void {
        switch (kind) {
            case 'custode':
                this.ctx.dialogues.start('custode-morte', () => {
                    this.ctx.rewards.spawnCuore(x, y + 40, 'cuore-custode', true);
                    this.ctx.flow.returnFromSecret(4500);
                });
                break;
        }
    }
}
