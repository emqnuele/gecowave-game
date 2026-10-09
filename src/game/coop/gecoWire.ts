import type { ByteReader, ByteWriter } from '../../net/codec';
import type { GecoState } from './RemoteGeco';

/* lo stato del geco sul filo: 30 volte al secondo in entrambi i sensi, una trentina di byte */

const F = {
    left: 1 << 0,
    grounded: 1 << 1,
    dashing: 1 << 2,
    attacking: 1 << 3,
    blink: 1 << 4,
    dead: 1 << 5,
    hidden: 1 << 6,
    eating: 1 << 7,
    charging: 1 << 8,
    frozen: 1 << 9,
    down: 1 << 10,
    decoy: 1 << 11,
} as const;

export function writeGeco(w: ByteWriter, levelSeq: number, seq: number, s: GecoState): void {
    let flags = 0;
    if (s.facing < 0) flags |= F.left;
    if (s.grounded) flags |= F.grounded;
    if (s.dashing) flags |= F.dashing;
    if (s.attacking) flags |= F.attacking;
    if (s.blink) flags |= F.blink;
    if (s.dead) flags |= F.dead;
    if (s.hidden) flags |= F.hidden;
    if (s.eating) flags |= F.eating;
    if (s.charging) flags |= F.charging;
    if (s.frozen) flags |= F.frozen;
    if (s.down) flags |= F.down;
    if (s.decoy) flags |= F.decoy;
    w.u16(levelSeq).u16(seq).f32(s.x).f32(s.y).i16(s.vx).i16(s.vy).u16(flags).u8(s.anim).u8(Math.max(0, Math.min(255, Math.round(s.hp)))).u8(Math.max(0, Math.min(255, Math.round(s.maxHp))));
    if (s.decoy) w.f32(s.decoy.x).f32(s.decoy.y);
}

export function readGeco(r: ByteReader): { levelSeq: number; seq: number; s: GecoState } | null {
    const levelSeq = r.u16();
    const seq = r.u16();
    const x = r.f32();
    const y = r.f32();
    const vx = r.i16();
    const vy = r.i16();
    const flags = r.u16();
    const anim = r.u8();
    const hp = r.u8();
    const maxHp = r.u8();
    const decoy = flags & F.decoy ? { x: r.f32(), y: r.f32() } : null;
    if (r.broken || !Number.isFinite(x) || !Number.isFinite(y)) return null;
    return {
        levelSeq,
        seq,
        s: {
            x, y, vx, vy,
            facing: flags & F.left ? -1 : 1,
            grounded: !!(flags & F.grounded),
            dashing: !!(flags & F.dashing),
            attacking: !!(flags & F.attacking),
            blink: !!(flags & F.blink),
            dead: !!(flags & F.dead),
            hidden: !!(flags & F.hidden),
            eating: !!(flags & F.eating),
            charging: !!(flags & F.charging),
            frozen: !!(flags & F.frozen),
            down: !!(flags & F.down),
            anim,
            hp,
            maxHp,
            decoy,
        },
    };
}
