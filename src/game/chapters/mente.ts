import Phaser from 'phaser';
import { riddleFor, TOASTS } from '../../content/story';
import { bus } from '../../core/events';
import { coopHooks } from '../../coop/hooks';
import { haptics } from '../../input/haptics';
import { sfx } from '../../audio/sfx';
import { state } from '../../core/state';
import type { BossKind } from '../../types';
import type { Interactable } from '../Interactions';
import { Chapter } from './ChapterScript';

/** la mente di piema: porte del dubbio che chiedono una risposta */
export class MenteChapter extends Chapter {
    /** quante volte hai sbagliato ogni porta della mente: la domanda cambia */
    private quizAttempts = new Map<string, number>();

    marker(id: string, x: number, y: number): boolean {
        if (!id.startsWith('porta-teorema')) return false;
        this.spawnQuizDoor(id, x, y);
        return true;
    }

    quizDoor(id: string, x: number, y: number): void {
        this.spawnQuizDoor(id, x, y);
    }

    bossDefeated(kind: BossKind, x: number, y: number): void {
        switch (kind) {
            case 'teorema':
                this.ctx.dialogues.start('mente-ordine', () => {
                    this.ctx.rewards.spawnFragment(x, y + 40, 'analisi', true);
                });
                break;
        }
    }

    /** una porta della mente: chiude il varco finché non rispondi giusto */
    private spawnQuizDoor(id: string, x: number, y: number): void {
        if (state.hasFlag(`aperta-${id}`)) return;
        const door = this.ctx.groups.doors.create(x, y - 48, 'porta-teorema') as Phaser.Physics.Arcade.Sprite;
        door.setDepth(3).setPipeline('Light2D');
        (door.body as Phaser.Physics.Arcade.StaticBody).setSize(28, 128);
        this.ctx.lighting.follow(door, 0x60a5fa, 150, 0.7);
        const entry: Interactable = { x, y, range: 70, onInteract: () => this.interactPorta(id, door, entry) };
        this.ctx.interactions.add(entry);
    }

    private interactPorta(id: string, door: Phaser.Physics.Arcade.Sprite, entry: Interactable): void {
        const attempt = this.quizAttempts.get(id) ?? 0;
        const t = riddleFor(id, attempt);
        bus.emit('choice-show', {
            title: t.q,
            options: t.options.map((label) => ({ label })),
            onPick: (i) => {
                if (i !== t.correct) {
                    // sbagliare costa, ma la testa di piema non ti cancella più: ti morde e cambia domanda
                    this.quizAttempts.set(id, attempt + 1);
                    bus.emit('toast', { text: TOASTS.quizErrore });
                    if (coopHooks.actorKind === 'remote' && this.ctx.coop) {
                        // ha sbagliato l'ospite: la sberla arriva al suo geco, non all'host
                        this.ctx.coop.session.send('cmd', { c: 'hurt', amount: 2, fromX: door.x });
                        this.ctx.coop.session.send('cmd', { c: 'flash', r: 248, g: 113, b: 113 });
                    } else {
                        this.scene.cameras.main.flash(240, 248, 113, 113);
                        // la testa di piema ti morde: il pensiero si piega
                        this.ctx.lens.kick({ barrel: 0.2, chroma: 1, angle: 0.025 }, 50, 150, 650);
                        haptics.rumble(0.5, 0.6, 250);
                        this.ctx.player.hurt(2, door.x);
                    }
                    for (const side of [-1, 1]) {
                        const at = this.ctx.world.openSpotNear(door.x + side * 180, door.y - 40, 8);
                        this.ctx.enemies.spawnEnemy('numero', at.x, at.y, { hunting: true });
                    }
                    return;
                }
                state.setFlag(`aperta-${id}`);
                this.ctx.interactions.remove(entry);
                // in due la porta cade anche dall'altra parte: niente fantasmi che si aprono
                this.ctx.coop?.session.send('quiz-gone', { x: door.x, y: door.y });
                sfx.unlock();                const burst = this.scene.add.particles(door.x, door.y, 'p-spark', {
                    speed: { min: 40, max: 160 },
                    scale: { start: 0.7, end: 0 },
                    tint: 0x60a5fa,
                    lifespan: 500,
                    quantity: 20,
                    stopAfter: 20,
                });
                this.scene.time.delayedCall(900, () => burst.destroy());
                door.destroy();
                bus.emit('toast', { text: TOASTS.portaAperta });
            },
        });
    }

}
