import type { BossKind } from '../../types';
import { Chapter } from './ChapterScript';

/** la 14 barrato, capitolo segreto */
export class BarratoChapter extends Chapter {
    bossDefeated(kind: BossKind, x: number, y: number): void {
        switch (kind) {
            case 'settequaranta':
                this.ctx.dialogues.start('settequaranta-morte', () => {
                    this.ctx.rewards.spawnCuore(x, y + 40, 'cuore-barrato', true);
                    this.ctx.flow.returnFromSecret(4500);
                });
                break;
        }
    }
}
