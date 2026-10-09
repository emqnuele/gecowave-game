import type Phaser from 'phaser';
import { sfx } from '../../../audio/sfx';
import { haptics } from '../../../input/haptics';
import { state } from '../../../core/state';
import type { Enemy } from '../../../entities/Enemy';
import type { ChapterCtx } from '../ChapterScript';

/* gli agguati di notino: senza tommasorveglianza spawna e combatte,
   con l'abbonamento viene respinto. le gag succedono comunque. */
interface AmbushDef {
    x: number;
    type: 'fight' | 'gag';
    intro: string;
    count?: number;
}

const AMBUSHES: Record<string, AmbushDef[]> = {
    rio: [
        { x: 95 * 32, type: 'fight', intro: 'notino-agguato-1' },
        { x: 520 * 32, type: 'fight', intro: 'notino-agguato-2' },
    ],
    stabilimento: [{ x: 220 * 32, type: 'fight', intro: 'notino-agguato-6' }],
    ruhra: [
        { x: 100 * 32, type: 'fight', intro: 'notino-agguato-3' },
        { x: 430 * 32, type: 'fight', intro: 'notino-agguato-4' },
    ],
    caso: [{ x: 250 * 32, type: 'gag', intro: 'notino-caso' }],
    tana: [{ x: 60 * 32, type: 'gag', intro: 'notino-tana' }],
    sorveglianza: [{ x: 100 * 32, type: 'gag', intro: 'notino-sorveglianza' }],
    cantina: [{ x: 120 * 32, type: 'fight', intro: 'notino-agguato-5', count: 2 }],
};

const TOMMASO_BLOCCA = ['tommaso-blocca', 'tommaso-blocca-2', 'tommaso-blocca-3'];

/** notino ti aspetta lungo il percorso, a punti fissi del capitolo vecchio */
export class Ambushes {
    private readonly ctx: ChapterCtx;
    private readonly scene: Phaser.Scene;

    constructor(ctx: ChapterCtx) {
        this.ctx = ctx;
        this.scene = ctx.scene;
    }

    update(): void {
        const list = AMBUSHES[this.ctx.world.def.id];
        if (!list || this.ctx.player.dead || this.ctx.flow.exiting) return;
        for (let i = 0; i < list.length; i++) {
            const a = list[i];
            const flag = `agguato-${this.ctx.world.def.id}-${i}`;
            if (state.hasFlag(flag) || this.ctx.world.progressAt(this.ctx.player.x, this.ctx.player.y) < this.ctx.world.progressOfOldX(a.x)) continue;
            state.setFlag(flag);
            if (a.type === 'gag') {
                this.ctx.dialogues.start(a.intro);
                return;
            }

            const count = a.count ?? 1;
            const spawned = this.spawnNotinoAmbush(count);

            this.ctx.player.stun(999999);
            spawned.forEach((e) => e.stun(999999));

            this.scene.time.delayedCall(2000, () => {
                const dialogueId = state.hasFlag('tommasorveglianza')
                    ? TOMMASO_BLOCCA[i % TOMMASO_BLOCCA.length]
                    : a.intro;
                // la scelta della tecnokill si sente al primo agguato dopo
                const variant = state.hasFlag('tommasorveglianza') || state.hasFlag('notino-variante-detta') ? null
                    : state.hasFlag('notino-a-casa') ? 'notino-agguato-casa' : state.hasFlag('notino-disarmato') ? 'notino-agguato-vendetta' : null;
                if (variant) state.setFlag('notino-variante-detta');

                this.ctx.dialogues.start(variant ?? dialogueId, () => {
                    if (state.hasFlag('tommasorveglianza')) {
                        spawned.forEach((e, idx) => {
                            (e.body as Phaser.Physics.Arcade.Body).enable = false;
                            e.setFlipX(false);
                            this.scene.tweens.add({
                                targets: e,
                                x: e.x - 800,
                                y: e.y - 40,
                                duration: 1500,
                                ease: 'Sine.easeInOut',
                                onComplete: () => {
                                    e.destroy();
                                    if (idx === spawned.length - 1) {
                                        this.ctx.player.stun(0);
                                    }
                                },
                            });
                        });
                    } else {
                        this.ctx.player.stun(0);
                        spawned.forEach((e) => e.stun(0));
                    }
                });
            });
            return;
        }
    }

    /** notino senza wave: piomba dall'alto, saltella, spara, e poi "non perde" */
    private spawnNotinoAmbush(count: number): Enemy[] {
        this.scene.cameras.main.flash(120, 168, 85, 247);
        this.ctx.feel.shake(180, 0.006);
        this.ctx.lens.kick({ chroma: 0.9, angle: 0.02, barrel: 0.06 }, 40, 140, 650);
        haptics.rumble(0.5, 0.5, 220);
        sfx.bossRoar();
        const spawned: Enemy[] = [];
        for (let i = 0; i < count; i++) {
            const dir = i % 2 === 0 ? 1 : -1;
            const at = this.ctx.world.openSpotNear(this.ctx.player.x + dir * (300 + i * 60), this.ctx.player.y - 140);
            // con lo sparacchino di papà il primo notino è un osso duro
            const e = this.ctx.enemies.spawnEnemy('notino-mini', at.x, at.y, { hunting: true, elite: i === 0 && state.hasFlag('notino-disarmato') });
            this.scene.physics.add.collider(e, this.ctx.world.level.layer);
            spawned.push(e);
        }
        return spawned;
    }

}
