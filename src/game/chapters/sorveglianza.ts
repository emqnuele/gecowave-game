import { WAVESUNG } from '../../content/story';
import { bus } from '../../core/events';
import { state } from '../../core/state';
import type { BossKind } from '../../types';
import { Chapter, type ChapterCtx } from './ChapterScript';
import { Ambushes } from './shared/Ambushes';
import { waveOnce } from './shared/wave';

/** il centro sorveglianza: le telecamere nutrono l'ombra */
export class SorveglianzaChapter extends Chapter {
    private readonly ambushes: Ambushes;

    constructor(ctx: ChapterCtx) {
        super(ctx);
        this.ambushes = new Ambushes(ctx);
    }

    /** la tommasorveglianza ti accoglie diversamente se non sei cliente premium */
    introDialogue(id: string): string {
        return id === 'tommaso-benvenuto' && !state.hasFlag('tommasorveglianza') ? 'tommaso-benvenuto-estraneo' : id;
    }

    setup(): void {
        waveOnce(this.scene, 'pedro-footage-visto', WAVESUNG.pedroFootage, 12000);
        if (!state.hasFlag('wavesung-sorveglianza')) {
            state.setFlag('wavesung-sorveglianza');
            this.scene.time.delayedCall(1200, () => bus.emit('wavesung', WAVESUNG.piemaAiuto));
        }
    }

    update(): void {
        this.ambushes.update();
        // il consiglio di markolino arriva solo dopo che l'ombra si è mostrata: prima il geco non sa niente
        const boss = this.ctx.bosses.current;
        if (boss?.def.kind === 'ombra' && boss.engaged) waveOnce(this.scene, 'tutorial-ombra-visto', WAVESUNG.markolinoOmbra, 4000);
    }

    bossDefeated(kind: BossKind, x: number, y: number): void {
        switch (kind) {
            case 'ombra':
                this.ctx.dialogues.start('ombra-sconfitta', () => {
                    this.ctx.rewards.spawnFragment(x, y + 40, 'scudo', true);
                });
                break;
        }
    }
}
