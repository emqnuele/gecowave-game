import Phaser from 'phaser';
import type { Interactable } from '../../Interactions';
import type { ChapterCtx } from '../ChapterScript';

/** chi ti accompagna e si parla lungo il cammino: romero nel void, walter a galliate e marcetti */
export class WalkingGuide {
    sprite: Phaser.GameObjects.Sprite | null = null;
    baseY = 0;
    /** l'interattivo segue la guida: la sua posizione si aggiorna nel loop */
    entry: Interactable | null = null;
    private readonly ctx: Pick<ChapterCtx, 'world' | 'player'>;

    constructor(ctx: Pick<ChapterCtx, 'world' | 'player'>) {
        this.ctx = ctx;
    }

    /** nei capitoli lineari cammina verso l'obiettivo senza mai staccarsi, nelle regioni fluttua al suo fianco dal lato dell'obiettivo */
    move(c: Phaser.GameObjects.Sprite, objX: number, time: number, delta: number): void {
        const player = this.ctx.player;
        if (this.ctx.world.layout) {
            const side = Math.sign(objX - player.x) || 1;
            // da fermo la guida si avvicina: così ci si parla senza rincorrerla
            const body = player.body as Phaser.Physics.Arcade.Body;
            const still = Math.abs(body.velocity.x) < 20 && body.blocked.down;
            const tx = player.x + side * (still ? 34 : 70);
            const ty = player.y - 26;
            // rimasta in un'altra stanza: ti raggiunge invece di attraversare mezza regione
            if (Math.hypot(tx - c.x, ty - c.y) > 900) c.setPosition(tx, ty);
            const k = 1 - Math.exp(-delta / 260);
            c.x += (tx - c.x) * k;
            c.y += (ty - c.y) * k + Math.sin(time / 320) * 0.4;
            c.setFlipX(side < 0);
        } else {
            // guida ma resta vicino: non si allontana mai più di `lead` dal player.
            // se il player resta indietro, la guida non supera player+lead → di fatto lo aspetta.
            const lead = 150;
            const targetX = Phaser.Math.Clamp(objX, player.x - lead, player.x + lead);
            const speed = 150; // px/s, più lento del geco: non vola mai avanti
            const step = (speed * delta) / 1000;
            const dx = targetX - c.x;
            if (Math.abs(dx) <= step + 1) {
                c.x = targetX;
            } else {
                c.x += Math.sign(dx) * step;
                c.setFlipX(dx < 0);
            }
            c.y = this.baseY + Math.sin(time / 320) * 2;
        }
        if (this.entry) {
            this.entry.x = c.x;
            this.entry.y = c.y;
        }
    }
}
