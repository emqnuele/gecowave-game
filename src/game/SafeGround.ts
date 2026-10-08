import type Phaser from 'phaser';
import type { GameContext } from './context';

type Point = { x: number; y: number };

/** l'ultimo punto dove il geco stava fermo coi piedi a terra: lì si rientra dalle spine e lì restano le barre alla morte */
export class SafeGround {
    lastSafe: Point;
    private readonly ctx: Pick<GameContext, 'player' | 'carry'>;

    constructor(ctx: Pick<GameContext, 'player' | 'carry'>, spawn: Point) {
        this.ctx = ctx;
        this.lastSafe = { ...spawn };
    }

    track(delta: number): void {
        const player = this.ctx.player;
        const carry = this.ctx.carry;
        const body = player.body as Phaser.Physics.Arcade.Body;
        if (body.blocked.down && !player.dead) {
            carry.safeTimer += delta;
            if (carry.safeTimer > 250) {
                this.lastSafe = { x: player.x, y: player.y - 4 };
                carry.safeTimer = 0;
            }
        } else {
            carry.safeTimer = 0;
        }
    }
}
