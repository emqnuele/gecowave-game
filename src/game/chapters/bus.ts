import type Phaser from 'phaser';
import { WAVESUNG } from '../../content/story';
import { bus } from '../../core/events';
import { haptics } from '../../input/haptics';
import { sfx } from '../../audio/sfx';
import { state } from '../../core/state';
import type { Boss } from '../../entities/Boss';
import type { BossKind } from '../../types';
import { Chapter } from './ChapterScript';
import { waveOnce } from './shared/wave';

/** il citelis: guggu nel loop, ivan maggini che si sacrifica, walter che dorme al palo */
export class BusChapter extends Chapter {
    private nextIvanStrikeAt = 0;
    // ivan maggini nello scontro con guggu
    private ivanSprite: Phaser.GameObjects.Sprite | null = null;
    private ivanInArena = false;
    private ivanBusy = false;
    private ivanDead = false;

    marker(id: string, x: number, y: number): boolean {
        if (id !== 'ivan-incontro') return false;
        this.ivanSprite = this.ctx.npcs.present(id, x, y);
        this.ctx.npcs.talk(id, x, y);
        return true;
    }

    setup(): void {
        waveOnce(this.scene, 'romero-prima-bus', WAVESUNG.romeroBus, 25000);
    }

    update(time: number): void {
        this.updateIvan(time);
    }

    interact(id: string): boolean {
        switch (id) {
            case 'ivan-incontro':
                if (state.hasFlag('boss-down-guggu')) {
                    bus.emit('toast', { text: 'ivan non risponde più. il loop è finito davvero.' });
                    return true;
                }
                this.ctx.dialogues.start(id, () => {
                    if (!state.hasFlag('ivan')) {
                        state.setFlag('ivan');
                        if (this.ctx.bosses.current?.def.kind === 'guggu') this.ctx.bosses.current.invulnerable = false;
                        bus.emit('toast', { text: 'la furia di ivan ti accompagna. guggu ora si taglia.' });
                    }
                });
                return true;
            case 'samatt-loop':
                this.ctx.dialogues.start(state.hasFlag('boss-down-guggu') ? 'samatt-libero' : id);
                return true;
            case 'walter-bus':
                // walter si sblocca solo dopo guggu: prima dorme della grossa
                if (!state.hasFlag('boss-down-guggu')) {
                    bus.emit('toast', { text: 'walter ronfa appoggiato a un palo. meglio non svegliarlo ora.' });
                    return true;
                }
                if (state.hasFlag('boss-down-walter')) {
                    this.ctx.dialogues.start('walter-bus-dopo');
                    return true;
                }
                this.ctx.dialogues.start('walter-bus-intro', () => {
                    bus.emit('choice-show', {
                        title: 'walter sbadiglia: "mi daresti una mano a galliate? è una cosa veloce, 3 annetti al massimo."',
                        options: [{ label: 'aiuta walter (vai a galliate)' }, { label: 'no, ho da fare' }],
                        onPick: (i) => {
                            if (i !== 0) {
                                bus.emit('toast', { text: 'walter: "...va beh. torna quando vuoi. io intanto schiaccio un pisolino."' });
                                return;
                            }
                            state.portalReturn = { levelId: 'bus', x: this.ctx.player.x, y: this.ctx.player.y };
                            bus.emit('toast', { text: 'sali sulla wolkswagen polo di walter. destinazione: galliate.' });
                            this.ctx.flow.gotoLevel('galliate');
                        },
                    });
                });
                return true;
            default:
                return false;
        }
    }

    bossDefeated(kind: BossKind, x: number, y: number): void {
        if (kind === 'guggu') this.ctx.rewards.spawnFragment(x, y + 60, 'rimbalzo', true);
    }

    private updateIvan(time: number): void {
        if (!this.ivanSprite?.active) return;
        const boss = this.ctx.bosses.current;
        if (!boss?.active || !boss.engaged || !state.hasFlag('ivan')) return;

        if (boss.hp <= 15 && this.ivanInArena && !this.ivanDead) {
            this.ivanDead = true;
            this.killIvanCutscene();
            return;
        }

        if (!this.ivanInArena) {
            this.ivanInArena = true;
            this.ivanSprite.setPosition(boss.x - 600, boss.y + 30);
            this.ivanSprite.setFlipX(false);
            this.scene.tweens.killTweensOf(this.ivanSprite);
            this.scene.tweens.add({
                targets: this.ivanSprite,
                x: boss.x - 330,
                duration: 1000,
                ease: 'Quad.easeInOut',
            });
            this.nextIvanStrikeAt = time + 2600;
            bus.emit('toast', { text: 'ivan maggini entra nel caos. la furia è carica.' });
            return;
        }
        if (!this.ivanBusy && time >= this.nextIvanStrikeAt) {
            this.ivanStrike(boss);
        }
    }

    private killIvanCutscene(): void {
        const boss = this.ctx.bosses.current;
        const ivan = this.ivanSprite;
        if (!boss || !ivan) return;

        this.scene.tweens.killTweensOf(ivan);
        this.scene.tweens.killTweensOf(boss);
        // se lo becca a metà carica, il busy resterebbe incastrato per sempre
        boss.release();
        this.ivanBusy = true;
        boss.engaged = false;

        sfx.dash();
        this.scene.tweens.add({
            targets: boss,
            x: ivan.x + Math.sign(boss.x - ivan.x) * 80,
            y: ivan.y - 20,
            duration: 350,
            ease: 'Quad.easeIn',
            onComplete: () => {
                sfx.hit();
                this.ctx.feel.shake(200, 0.01);
                // ivan si prende il colpo per te: il mondo perde colore per un momento
                this.ctx.lens.kick({ desat: 0.75, zoom: 0.03, chroma: 0.4 }, 60, 900, 1600);
                haptics.rumble(0.8, 0.4, 400);
                ivan.setTint(0xf87171);
                
                this.scene.tweens.add({
                    targets: ivan,
                    x: ivan.x - 250,
                    y: ivan.y + 100,
                    angle: 85,
                    alpha: 0.4,
                    duration: 800,
                    ease: 'Quad.easeOut',
                    onComplete: () => {
                        this.ctx.dialogues.start('ivan-sacrificio', () => {
                            ivan.destroy();
                            boss.engaged = true;
                        });
                    }
                });
            }
        });
    }

    private ivanStrike(boss: Boss): void {
        const ivan = this.ivanSprite!;
        this.ivanBusy = true;
        const homeX = ivan.x;
        const homeY = ivan.y;
        const dir = Math.sign(boss.x - ivan.x) || 1;
        ivan.setFlipX(dir < 0);
        ivan.setTintFill(0xfacc15);
        this.scene.time.delayedCall(350, () => {
            if (!ivan.active) return;
            ivan.clearTint();
            sfx.dash();
            this.scene.tweens.add({
                targets: ivan,
                x: boss.active ? boss.x + dir * 130 : homeX,
                y: boss.active ? boss.y + 30 : ivan.y,
                duration: 260,
                ease: 'Quad.easeIn',
                onComplete: () => {
                    if (boss.active) {
                        const g = this.scene.add.graphics().setDepth(6);
                        g.lineStyle(5, 0xfacc15, 0.95);
                        g.beginPath();
                        g.moveTo(boss.x - 75, boss.y + 55);
                        g.lineTo(boss.x + 75, boss.y - 55);
                        g.strokePath();
                        this.scene.tweens.add({ targets: g, alpha: 0, scaleX: 1.2, scaleY: 1.2, duration: 280, onComplete: () => g.destroy() });
                        sfx.hit();
                        this.ctx.feel.shake(130, 0.006);
                        
                        const dmg = Math.min(4, boss.hp - 15);
                        if (dmg > 0) boss.takeDamage(dmg, ivan.x);
                    }
                    this.scene.time.delayedCall(450, () => {
                        if (!ivan.active) return;
                        ivan.setFlipX(true);
                        this.scene.tweens.add({
                            targets: ivan,
                            x: homeX,
                            y: homeY,
                            duration: 650,
                            ease: 'Quad.easeOut',
                            onComplete: () => {
                                ivan.setFlipX(false);
                                this.ivanBusy = false;
                                this.nextIvanStrikeAt = this.scene.time.now + 4200;
                            },
                        });
                    });
                },
            });
        });
    }

}
