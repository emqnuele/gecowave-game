import { TOASTS, WAVESUNG } from '../../content/story';
import { bus } from '../../core/events';
import { sfx } from '../../audio/sfx';
import { state } from '../../core/state';
import type { BossKind } from '../../types';
import { Chapter, type ChapterCtx } from './ChapterScript';
import { Ambushes } from './shared/Ambushes';
import { drinkSmela } from './shared/smela';
import { waveOnce } from './shared/wave';

/** il rio merdone: il fiume cura il trenbolone e l'acqua di smela, ticummi vende sorveglianza */
export class RioChapter extends Chapter {
    private readonly ambushes: Ambushes;

    constructor(ctx: ChapterCtx) {
        super(ctx);
        this.ambushes = new Ambushes(ctx);
    }

    setup(): void {
        waveOnce(this.scene, 'smela-opzionale-detta', WAVESUNG.markolinoSmelaSkip, 40000);
        if (!state.hasFlag('rio-curato') && !state.run.trenbolone) {
            this.scene.time.delayedCall(900, () => {
                bus.emit('wavesung', WAVESUNG.trenboloneAd);
                state.run.trenbolone = true;
                state.setFlag('trenbolone-attivo');
                bus.emit('toast', { text: TOASTS.trenbolone });
            });
        }
    }

    update(): void {
        this.updateWaterCure();
        this.ambushes.update();
    }

    interact(id: string): boolean {
        switch (id) {
            case 'ticummi-offerta':
                this.ctx.dialogues.start(id, () => {
                    if (state.hasFlag('tommasorveglianza')) return;
                    bus.emit('choice-show', {
                        title: 'tommasorveglianza 133 barre: notino respinto gratis, ma l\'ombra si allena su di te (forte). senza: affronti notino tu, ombra beta.',
                        options: [{ label: 'compra (133 barre): protetto, ma spiato' }, { label: 'rifiuta: libero, ma agguati veri' }],
                        onPick: (i) => {
                            if (i === 0 && state.save.barre >= 133) {
                                state.save.barre -= 133;
                                state.setFlag('tommasorveglianza');
                                state.save.ombra.premium = true;
                                state.persist();
                                bus.emit('barre-changed', { barre: state.save.barre, gained: false });
                                this.ctx.dialogues.start('tommaso-avviso-clausola');
                            } else if (i === 0) {
                                bus.emit('toast', { text: 'non hai 133 barre. ticummi ti guarda con pietà.' });
                            } else {
                                this.ctx.dialogues.start('tommaso-rifiuto');
                            }
                        },
                    });
                });
                return true;
            case 'smela-offerta':
                this.ctx.dialogues.start(id, () => {
                    bus.emit('choice-show', {
                        title: 'acqua premium della sorgente: 15 barre.',
                        options: [{ label: 'compra e bevi (15 barre)', danger: true }, { label: 'no grazie' }],
                        onPick: (i) => {
                            if (i === 0 && state.save.barre >= 15) {
                                state.save.barre -= 15;
                                bus.emit('barre-changed', { barre: state.save.barre, gained: false });
                                state.run.smela = true;
                                this.ctx.dialogues.start('smela-truffa', () => {
                                    drinkSmela(this.ctx);
                                });
                                bus.emit('toast', { text: TOASTS.smela });
                            } else if (i === 0) {
                                bus.emit('toast', { text: 'non hai 15 barre. smela perde interesse immediatamente.' });
                            }
                        },
                    });
                });
                return true;
            default:
                return false;
        }
    }

    bossDefeated(kind: BossKind, x: number, y: number): void {
        switch (kind) {
            case 'formicona':
                this.ctx.dialogues.start('formicona-sconfitta', () => {
                    this.ctx.rewards.spawnCuore(x, y + 40, 'cuore-formicona', true);
                    this.ctx.rewards.spawnFragment(x + 60, y + 40, 'aggrappo', true);
                });
                break;
        }
    }

    private updateWaterCure(): void {
        if (this.ctx.world.level.water.length === 0) return;
        if (!state.run.trenbolone && !state.run.smela) return;
        const inWater = this.ctx.world.level.water.some((r) => r.contains(this.ctx.player.x, this.ctx.player.y + 20));
        if (!inWater) return;
        state.run.trenbolone = false;
        state.run.smela = false;
        state.removeFlag('trenbolone-attivo');
        sfx.heal();
        this.scene.cameras.main.flash(200, 74, 222, 128);
        // refresh hud when player gets cured in the river
        bus.emit('hp-changed', { hp: state.run.hp, maxHp: state.maxHp, hurt: false });
        if (!state.hasFlag('rio-curato')) {
            state.setFlag('rio-curato');
            this.ctx.dialogues.start('rio-cura');
        } else {
            bus.emit('toast', { text: 'il fiume ti ripulisce. di nuovo. senza giudicare. quasi.' });
        }
    }

}
