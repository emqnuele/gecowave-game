import type Phaser from 'phaser';
import type { ByteReader, ByteWriter } from '../../net/codec';
import type { EnemyMode } from '../../entities/Enemy';

/* lo stato del mondo sul filo, dall'host all'ospite 20 volte al secondo:
   i nemici svegli vicino all'ospite, il boss, le comparse della trama */

export const MODES: EnemyMode[] = ['sleep', 'patrol', 'alert', 'chase', 'return', 'flee'];

export interface EnemyLook {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    flipX: boolean;
    flipY: boolean;
    /** 0 niente, 1 tinta, 2 tinta piena */
    tint: 0 | 1 | 2;
    color: number;
    stunned: boolean;
    mode: number;
    angle: number;
    alpha: number;
}

export interface BossLook {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    rot: number;
    sx: number;
    sy: number;
    alpha: number;
    flipX: boolean;
    tint: 0 | 1 | 2;
    color: number;
    engaged: boolean;
    invulnerable: boolean;
    guard: 'side' | 'up' | 'down' | 'shot' | null;
    hp: number;
    maxHp: number;
}

/** una comparsa della trama: basta sapere cosa disegnare e dove */
export interface ActorLook {
    id: number;
    x: number;
    y: number;
    frame: number;
    flipX: boolean;
    visible: boolean;
    alpha: number;
    angle: number;
    scale: number;
    tint: 0 | 1 | 2;
    color: number;
}

const GUARDS = [null, 'side', 'up', 'down', 'shot'] as const;

const rgb = (w: ByteWriter, c: number) => w.u8((c >> 16) & 0xff).u8((c >> 8) & 0xff).u8(c & 0xff);
const readRgb = (r: ByteReader) => (r.u8() << 16) | (r.u8() << 8) | r.u8();
const clampI8 = (v: number) => Math.max(-127, Math.min(127, Math.round(v)));

export interface WorldFrame {
    levelSeq: number;
    enemies: EnemyLook[];
    boss: BossLook | null;
    actors: ActorLook[];
}

export function writeWorld(w: ByteWriter, f: WorldFrame): void {
    w.u16(f.levelSeq).u8(Math.min(255, f.enemies.length));
    for (const e of f.enemies.slice(0, 255)) {
        let flags = 0;
        if (e.flipX) flags |= 1;
        if (e.flipY) flags |= 2;
        if (e.stunned) flags |= 4;
        flags |= e.tint << 3;
        w.u16(e.id).f32(e.x).f32(e.y).i16(e.vx).i16(e.vy).u8(flags).u8(e.mode);
        rgb(w, e.color);
        w.u8(clampI8(e.angle) & 0xff).u8(Math.round(Math.max(0, Math.min(1, e.alpha)) * 255));
    }
    const b = f.boss;
    w.u8(b ? 1 : 0);
    if (b) {
        let flags = 0;
        if (b.flipX) flags |= 1;
        if (b.engaged) flags |= 2;
        if (b.invulnerable) flags |= 4;
        flags |= b.tint << 3;
        flags |= GUARDS.indexOf(b.guard) << 5;
        w.u16(b.id).f32(b.x).f32(b.y).i16(b.vx).i16(b.vy).i16(b.rot * 1000).u16(b.sx * 1000).u16(b.sy * 1000).u8(Math.round(Math.max(0, Math.min(1, b.alpha)) * 255)).u8(flags);
        rgb(w, b.color);
        w.f32(b.hp).f32(b.maxHp);
    }
    w.u8(Math.min(255, f.actors.length));
    for (const a of f.actors.slice(0, 255)) {
        let flags = 0;
        if (a.flipX) flags |= 1;
        if (a.visible) flags |= 2;
        flags |= a.tint << 2;
        w.u16(a.id).f32(a.x).f32(a.y).u8(a.frame).u8(flags).u8(Math.round(Math.max(0, Math.min(1, a.alpha)) * 255)).i16(a.angle * 10).u16(a.scale * 1000);
        rgb(w, a.color);
    }
}

export function readWorld(r: ByteReader): WorldFrame | null {
    const levelSeq = r.u16();
    const n = r.u8();
    const enemies: EnemyLook[] = [];
    for (let i = 0; i < n; i++) {
        const id = r.u16();
        const x = r.f32();
        const y = r.f32();
        const vx = r.i16();
        const vy = r.i16();
        const flags = r.u8();
        const mode = r.u8();
        const color = readRgb(r);
        const angle = (r.u8() << 24) >> 24;
        const alpha = r.u8() / 255;
        enemies.push({ id, x, y, vx, vy, flipX: !!(flags & 1), flipY: !!(flags & 2), stunned: !!(flags & 4), tint: ((flags >> 3) & 3) as 0 | 1 | 2, color, mode, angle, alpha });
    }
    let boss: BossLook | null = null;
    if (r.u8()) {
        const id = r.u16();
        const x = r.f32();
        const y = r.f32();
        const vx = r.i16();
        const vy = r.i16();
        const rot = r.i16() / 1000;
        const sx = r.u16() / 1000;
        const sy = r.u16() / 1000;
        const alpha = r.u8() / 255;
        const flags = r.u8();
        const color = readRgb(r);
        const hp = r.f32();
        const maxHp = r.f32();
        boss = {
            id, x, y, vx, vy, rot, sx, sy, alpha, color, hp, maxHp,
            flipX: !!(flags & 1), engaged: !!(flags & 2), invulnerable: !!(flags & 4),
            tint: ((flags >> 3) & 3) as 0 | 1 | 2, guard: GUARDS[(flags >> 5) & 7] ?? null,
        };
    }
    const m = r.u8();
    const actors: ActorLook[] = [];
    for (let i = 0; i < m; i++) {
        const id = r.u16();
        const x = r.f32();
        const y = r.f32();
        const frame = r.u8();
        const flags = r.u8();
        const alpha = r.u8() / 255;
        const angle = r.i16() / 10;
        const scale = r.u16() / 1000;
        const color = readRgb(r);
        actors.push({ id, x, y, frame, flipX: !!(flags & 1), visible: !!(flags & 2), tint: ((flags >> 2) & 3) as 0 | 1 | 2, alpha, angle, scale, color });
    }
    if (r.broken) return null;
    return { levelSeq, enemies, boss, actors };
}

/** la tinta di uno sprite come la vede chi la deve rifare */
export function tintOf(s: { isTinted: boolean; tintFill: boolean; tintTopLeft: number }): { tint: 0 | 1 | 2; color: number } {
    if (!s.isTinted) return { tint: 0, color: 0 };
    return { tint: s.tintFill ? 2 : 1, color: s.tintTopLeft & 0xffffff };
}

export function applyTint(s: Phaser.GameObjects.Components.Tint, tint: 0 | 1 | 2, color: number): void {
    if (tint === 0) s.clearTint();
    else if (tint === 2) s.setTintFill(color);
    else s.setTint(color);
}
