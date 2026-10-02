import { PHYSICS, PLAYER_SPRITE, TILE } from '../config';

/* il geco simulato con la fisica vera: stessa integrazione di arcade, stessa
   separazione dalle tile (facce, bias, ordine degli assi), stesso controllo del
   Player. serve a dire se una regione si gioca davvero, non secondo un modello */

const DT = 1 / 60;
const DT_MS = 1000 / 60;
const BW = PLAYER_SPRITE.bodyWidth * PLAYER_SPRITE.scale;
const BH = PLAYER_SPRITE.bodyHeight * PLAYER_SPRITE.scale;
const TILE_BIAS = 48;

export interface SimAbilities {
    dash: boolean;
    double: boolean;
}

export interface Input {
    dir: -1 | 0 | 1;
    jump: boolean;
    dash: boolean;
}

/** la parte della griglia che conta per la fisica */
export class SimMap {
    readonly cols: number;
    readonly rows: number;
    /** 1 = tile del layer di collisione */
    readonly solid: Uint8Array;
    /** 1 = spine */
    readonly spike: Uint8Array;

    constructor(grid: string[], opts: { breakablesOpen?: boolean } = {}) {
        this.rows = grid.length;
        this.cols = Math.max(...grid.map((r) => r.length));
        this.solid = new Uint8Array(this.cols * this.rows);
        this.spike = new Uint8Array(this.cols * this.rows);
        for (let r = 0; r < this.rows; r++) {
            const row = grid[r];
            for (let c = 0; c < this.cols; c++) {
                const ch = row[c] ?? '.';
                const k = r * this.cols + c;
                if (ch === '#' || (ch === '%' && !opts.breakablesOpen)) this.solid[k] = 1;
                else if (ch === '^') this.spike[k] = 1;
            }
        }
    }

    isSolid(c: number, r: number): boolean {
        if (c < 0 || r < 0 || c >= this.cols || r >= this.rows) return false;
        return this.solid[r * this.cols + c] === 1;
    }
}

export class SimBody {
    x = 0;
    y = 0;
    vx = 0;
    vy = 0;
    ax = 0;
    maxVx: number = PHYSICS.runSpeed;
    gravity = true;
    blockedDown = false;
    // stato del controllo, come in Player
    now = 0;
    coyoteUntil = 0;
    bufferUntil = 0;
    airJumpUsed = false;
    dashing = false;
    dashUntil = 0;
    dashCooldownUntil = 0;
    facing: 1 | -1 = 1;
    prevJump = false;
    prevDash = false;
    hitSpike = false;

    clone(): SimBody {
        return Object.assign(new SimBody(), this);
    }
}

function intersects(b: SimBody, l: number, t: number, r: number, bot: number): boolean {
    return !(b.x + BW <= l || b.y + BH <= t || b.x >= r || b.y >= bot);
}

/** un passo di arcade: velocità, posizione, separazione dalle tile del layer */
function physicsStep(m: SimMap, b: SimBody): void {
    b.blockedDown = false;
    const px = b.x;
    const py = b.y;
    let vx = b.vx;
    let vy = b.vy;
    if (b.gravity) vy += PHYSICS.gravity * DT;
    if (b.ax) vx += b.ax * DT;
    vx = Math.max(-b.maxVx, Math.min(b.maxVx, vx));
    vy = Math.max(-PHYSICS.maxFallSpeed, Math.min(PHYSICS.maxFallSpeed, vy));
    b.vx = vx;
    b.vy = vy;
    b.x += vx * DT;
    b.y += vy * DT;
    const dx = b.x - px;
    const dy = b.y - py;

    // GetTilesWithinWorldXY con l'area allargata di una tile, in ordine di righe
    const c0 = Math.floor((b.x - TILE) / TILE);
    const r0 = Math.floor((b.y - TILE) / TILE);
    const c1 = Math.ceil((b.x + BW) / TILE);
    const r1 = Math.ceil((b.y + BH) / TILE);
    for (let r = r0; r < r1; r++) {
        for (let c = c0; c < c1; c++) {
            if (!m.isSolid(c, r)) continue;
            const l = c * TILE;
            const t = r * TILE;
            const rt = l + TILE;
            const bt = t + TILE;
            if (!intersects(b, l, t, rt, bt)) continue;
            const faceLeft = !m.isSolid(c - 1, r);
            const faceRight = !m.isSolid(c + 1, r);
            const faceTop = !m.isSolid(c, r - 1);
            const faceBottom = !m.isSolid(c, r + 1);
            const faceH = faceLeft || faceRight;
            const faceV = faceTop || faceBottom;
            if (!faceH && !faceV) continue;
            let minX = 0;
            let minY = 1;
            if (Math.abs(dx) > Math.abs(dy)) minX = -1;
            else if (Math.abs(dx) < Math.abs(dy)) minY = -1;
            if (dx !== 0 && dy !== 0 && faceH && faceV) {
                minX = Math.min(Math.abs(b.x - rt), Math.abs(b.x + BW - l));
                minY = Math.min(Math.abs(b.y - bt), Math.abs(b.y + BH - t));
            }
            const checkX = (): number => {
                let ox = 0;
                if (dx < 0) {
                    if (faceRight && b.x < rt) {
                        ox = b.x - rt;
                        if (ox < -TILE_BIAS) ox = 0;
                    }
                } else if (dx > 0) {
                    if (faceLeft && b.x + BW > l) {
                        ox = b.x + BW - l;
                        if (ox > TILE_BIAS) ox = 0;
                    }
                }
                if (ox !== 0) {
                    b.x -= ox;
                    b.vx = 0;
                }
                return ox;
            };
            const checkY = (): number => {
                let oy = 0;
                if (dy < 0) {
                    if (faceBottom && b.y < bt) {
                        oy = b.y - bt;
                        if (oy < -TILE_BIAS) oy = 0;
                    }
                } else if (dy > 0) {
                    if (faceTop && b.y + BH > t) {
                        oy = b.y + BH - t;
                        if (oy > TILE_BIAS) oy = 0;
                    }
                }
                if (oy !== 0) {
                    if (oy > 0) b.blockedDown = true;
                    b.y -= oy;
                    b.vy = 0;
                }
                return oy;
            };
            if (minX < minY) {
                if (faceH) {
                    const ox = checkX();
                    if (ox !== 0 && !intersects(b, l, t, rt, bt)) continue;
                }
                if (faceV) checkY();
            } else {
                if (faceV) {
                    const oy = checkY();
                    if (oy !== 0 && !intersects(b, l, t, rt, bt)) continue;
                }
                if (faceH) checkX();
            }
        }
    }

    // spine: hitbox sulle punte, 4px di rientro e 12px d'altezza in fondo alla cella
    const sc0 = Math.floor(b.x / TILE);
    const sc1 = Math.floor((b.x + BW) / TILE);
    const sr0 = Math.floor(b.y / TILE);
    const sr1 = Math.floor((b.y + BH) / TILE);
    for (let r = sr0; r <= sr1; r++) {
        for (let c = sc0; c <= sc1; c++) {
            if (c < 0 || r < 0 || c >= m.cols || r >= m.rows || !m.spike[r * m.cols + c]) continue;
            const l = c * TILE + 4;
            const t = r * TILE + TILE - 12;
            if (b.x < l + TILE - 8 && b.x + BW > l && b.y < t + 12 && b.y + BH > t) b.hitSpike = true;
        }
    }
}

/** la logica di Player.update che tocca il movimento */
function control(b: SimBody, inp: Input, ab: SimAbilities): void {
    const grounded = b.blockedDown;
    const now = b.now;
    const jumpDown = inp.jump && !b.prevJump;
    const dashDown = inp.dash && !b.prevDash;
    b.prevJump = inp.jump;
    b.prevDash = inp.dash;
    if (grounded) {
        b.coyoteUntil = now + PHYSICS.coyoteMs;
        b.airJumpUsed = false;
    }
    if (b.dashing) {
        if (now >= b.dashUntil) {
            b.dashing = false;
            b.gravity = true;
            b.vx *= 0.4;
        } else {
            return;
        }
    }
    const accel = grounded ? PHYSICS.runAccel : PHYSICS.airAccel;
    if (inp.dir !== 0) {
        b.ax = inp.dir * accel;
        b.facing = inp.dir;
    } else {
        b.ax = 0;
        b.vx *= grounded ? 0.8 : 0.96;
    }
    b.maxVx = PHYSICS.runSpeed;
    if (jumpDown) b.bufferUntil = now + PHYSICS.jumpBufferMs;
    if (now < b.bufferUntil) {
        if (grounded || now < b.coyoteUntil) {
            b.vy = -PHYSICS.jumpVelocity;
            b.bufferUntil = 0;
            b.coyoteUntil = 0;
        } else if (!b.airJumpUsed && ab.double) {
            b.vy = -PHYSICS.doubleJumpVelocity;
            b.airJumpUsed = true;
            b.bufferUntil = 0;
        }
    }
    if (!inp.jump && b.vy < 0) b.vy *= 1 - (1 - PHYSICS.jumpCutFactor) * (DT_MS / 100);
    if (dashDown && ab.dash && now >= b.dashCooldownUntil) {
        b.dashing = true;
        b.dashUntil = now + PHYSICS.dashMs;
        b.dashCooldownUntil = now + PHYSICS.dashCooldownMs;
        b.gravity = false;
        b.maxVx = PHYSICS.dashSpeed;
        b.vx = PHYSICS.dashSpeed * b.facing;
        b.vy = 0;
        b.ax = 0;
    }
}

/** un fotogramma: prima il mondo fisico, poi lo script del player (come in phaser) */
export function simFrame(m: SimMap, b: SimBody, inp: Input, ab: SimAbilities): void {
    physicsStep(m, b);
    b.now += DT_MS;
    control(b, inp, ab);
}

export const BODY_W = BW;
export const BODY_H = BH;
