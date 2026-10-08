import { FLASHBACK_BEFORE, FLASHBACK_ONCE } from '../content/flashbacks';
import { DIALOGUES } from '../content/story';
import { bus } from '../engine/events';
import { flashback, type FilmHost } from '../engine/FlashbackManager';
import { state } from '../engine/state';
import type { DialogueLine } from '../types';
import type { GameContext, GameSystem } from './context';

/** i dialoghi fermano la scena: prima l'eventuale film, poi le righe */
export class Dialogues implements GameSystem {
    private readonly ctx: Pick<GameContext, 'scene' | 'player'>;
    private readonly host: FilmHost;

    constructor(ctx: Pick<GameContext, 'scene' | 'player'>, host: FilmHost) {
        this.ctx = ctx;
        this.host = host;
    }

    start(id: string, onEnd?: () => void): void {
        // mostra invece di raccontare: prima il flashback filmico, poi 1-2 righe al max
        const fbId = FLASHBACK_BEFORE[id];
        // certi flashback non si rigiocano: se visti altrove, solo le righe
        const already = fbId !== undefined && FLASHBACK_ONCE.has(id) && state.save.seenDialogues.includes(`fb-${fbId}`);
        if (fbId && !already && !flashback.isPlaying) {
            flashback.play(this.ctx.scene, this.ctx.player, fbId, () => this.lines(DIALOGUES[id], onEnd), { host: this.host });
            return;
        }
        if (fbId && !already) {
            // un film sta già girando: si aspetta il suo turno, mai sopra
            this.ctx.scene.time.delayedCall(1200, () => this.start(id, onEnd));
            return;
        }
        this.lines(DIALOGUES[id], onEnd);
    }

    /** l'intro del capitolo, una volta per partita; chi comincia al buio apre gli occhi alla fine */
    playIntro(introId: string | undefined, dark: boolean): void {
        const scene = this.ctx.scene;
        const wakeUp = () => scene.cameras.main.fadeIn(600, 0, 0, 0);
        if (introId && !state.save.seenDialogues.includes(introId)) {
            state.save.seenDialogues.push(introId);
            state.persist();
            if (dark) {
                scene.time.delayedCall(500, () => this.start(introId, wakeUp));
            } else {
                scene.time.delayedCall(700, () => this.start(introId));
            }
        } else if (dark) {
            // dialogo già visto in una run precedente: svegliati comunque
            wakeUp();
        }
    }

    /** dialogo con righe costruite al volo (i passanti) */
    lines(lines: DialogueLine[] | undefined, onEnd?: () => void): void {
        if (!lines) {
            onEnd?.();
            return;
        }
        const plugin = this.ctx.scene.scene;
        plugin.pause();
        bus.emit('dialogue-start', {
            lines,
            onEnd: () => {
                plugin.resume();
                onEnd?.();
            },
        });
    }

    destroy(): void {}
}
