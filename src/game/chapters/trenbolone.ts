import { bus } from '../../engine/events';
import { sfx } from '../../engine/sfx';
import { state } from '../../engine/state';
import type { BossKind } from '../../types';
import { Chapter, type Target } from './ChapterScript';

/** il trenbolone: senza la dose dello spaccino la via per il rio resta sbarrata */
export class TrenboloneChapter extends Chapter {
    interact(id: string): boolean {
        if (id !== 'spaccino') return false;
        if (state.run.trenbolone) {
            bus.emit('toast', { text: 'spaccino: "amico sei già a posto, inutile sprecare roba."' });
            return true;
        }
        this.ctx.dialogues.start('spaccino-offerta', () => {
            bus.emit('choice-show', {
                title: 'comprare una dose di trenbolone? (costa 0 barre, è un omaggio)',
                options: [{ label: 'accetta (fatti di trenbolone)' }, { label: 'no grazie' }],
                onPick: (i) => {
                    if (i === 0) {
                        state.run.trenbolone = true;
                        state.setFlag('trenbolone-attivo');
                        bus.emit('toast', { text: 'ti sei fatto di trenbolone. ti senti una bestia ma lo schermo gira.' });
                        sfx.pickup();
                        bus.emit('hp-changed', { hp: state.run.hp, maxHp: state.maxHp, hurt: false });

                        const boss = this.ctx.bosses.current;
                        const bossIsAlive = boss && boss.active && boss.def.kind === 'flauto';
                        if (bossIsAlive) {
                            // teleport the boss to the player for surprise attack
                            boss.x = this.ctx.player.x + 220;
                            boss.y = this.ctx.player.y - 100;
                            (boss as any).anchorX = this.ctx.player.x + 220;
                            (boss as any).anchorY = this.ctx.player.y - 100;

                            this.ctx.bosses.introShown = true;
                            this.ctx.dialogues.start('flauto-fatto-rabbia', () => {
                                boss.engage();
                            });
                        } else {
                            // fall asleep since boss is already defeated
                            this.scene.time.delayedCall(1000, () => {
                                this.ctx.player.stun(999999);
                                this.ctx.dialogues.start('trenbo-addormentato', () => {
                                    this.ctx.flow.gotoLevel('tana');
                                });
                            });
                        }
                    } else {
                        bus.emit('toast', { text: 'spaccino: "come vuoi, torna quando hai fegato."' });
                    }
                }
            });
        });
        return true;
    }

    exitLock(): string | null {
        return state.run.trenbolone ? null : 'la via per il rio merdone è sbarrata. ti serve il trenbolone.';
    }

    objective(): Target | null | undefined {
        if (state.run.trenbolone || state.hasFlag('boss-down-flauto')) return undefined;
        const at = this.ctx.npcs.at.get('spaccino');
        return at ? { ...at, label: 'lo spaccino' } : null;
    }

    bossDefeated(kind: BossKind, _x: number, _y: number): void {
        switch (kind) {
            case 'flauto':
                this.ctx.dialogues.start('flauto-sconfitto', () => {
                    if (state.run.trenbolone) {
                        // fall asleep after battle if drug is active
                        this.scene.time.delayedCall(1000, () => {
                            this.ctx.player.stun(999999);
                            this.ctx.dialogues.start('trenbo-addormentato', () => {
                                this.ctx.flow.completeChapterAndGo('tana');
                            });
                        });
                    }
                });
                break;
        }
    }
}
