import { FLASHBACK_BEFORE, FLASHBACK_ONCE } from '../content/flashbacks';
import { DIALOGUES } from '../content/story';
import { bus } from '../core/events';
import { flashback } from '../story/FlashbackManager';
import { state } from '../core/state';
import type { DialogueLine } from '../types';
import type { GameContext, GameSystem } from './context';

/** i dialoghi fermano la scena: prima l'eventuale film, poi le righe */
export class Dialogues implements GameSystem {
    private readonly ctx: Pick<GameContext, 'scene' | 'player' | 'coop'>;
    /** i film in attesa: ognuno parte quando il precedente ha chiuso anche le sue righe */
    private readonly queue: { id: string; onEnd?: () => void }[] = [];
    private filming = false;

    constructor(ctx: Pick<GameContext, 'scene' | 'player' | 'coop'>) {
        this.ctx = ctx;
    }

    start(id: string, onEnd?: () => void): void {
        if (!this.hasFilm(id)) {
            this.lines(DIALOGUES[id], onEnd);
            return;
        }
        if (this.filming) {
            this.queue.push({ id, onEnd });
            return;
        }
        this.playFilm(id, onEnd);
    }

    /** mostra invece di raccontare: prima il flashback filmico, poi 1-2 righe al max */
    private hasFilm(id: string): boolean {
        const fbId = FLASHBACK_BEFORE[id];
        // certi flashback non si rigiocano: se visti altrove, solo le righe
        return fbId !== undefined && !(FLASHBACK_ONCE.has(id) && state.save.seenDialogues.includes(`fb-${fbId}`));
    }

    private playFilm(id: string, onEnd?: () => void): void {
        this.filming = true;
        const done = (): void => {
            onEnd?.();
            this.nextFilm();
        };
        // in fila può essere diventato già visto: restano le righe, e la fila va avanti lo stesso
        if (!this.hasFilm(id)) {
            this.lines(DIALOGUES[id], done);
            return;
        }
        // in due il ricordo lo guardano tutti e due
        this.ctx.coop?.rules.film(FLASHBACK_BEFORE[id]!);
        flashback.play(this.ctx.scene, this.ctx.player, FLASHBACK_BEFORE[id]!, () => this.lines(DIALOGUES[id], done));
    }

    private nextFilm(): void {
        const next = this.queue.shift();
        if (!next) {
            this.filming = false;
            return;
        }
        // il primo fotogramma a scena viva: se le righe hanno aperto un altro dialogo, si aspetta anche quello
        this.ctx.scene.time.delayedCall(0, () => this.playFilm(next.id, next.onEnd));
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
        if (this.ctx.coop) {
            this.ctx.coop.rules.dialogue(lines, onEnd);
            return;
        }
        const scene = this.ctx.scene;
        scene.scene.pause();
        bus.emit('dialogue-start', {
            lines,
            onEnd: () => {
                // la ripresa del plugin aspetta il fotogramma dopo: una scelta aperta qui troverebbe la scena ancora ferma e poi la vedrebbe ripartire
                scene.game.scene.resume(scene.scene.key);
                onEnd?.();
            },
        });
    }

    destroy(): void {}
}
