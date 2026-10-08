import Phaser from 'phaser';
import { TILE } from '../config';
import { FOLK, FOLK_AFTER, FOLK_CHAT, FOLK_PANIC, FOLK_PEDRO, FOLK_QUIET, type FolkKind } from '../content/folk';
import { toneFor } from '../content/tone';
import { mulberry32 } from './art/ink';
import { folkImage } from './art/folk';
import { CreatureGlow } from './art/creatureKit';
import type { NavGraph } from './nav/NavGraph';
import { state } from './state';
import type { DialogueLine } from '../types';
import type { RegionLayout, Room } from '../world/types';
import { rng } from './rng';

/* i passanti: niente fisica, si muovono sui segmenti del grafo di navigazione
   (camminate, cadute, saltelli) e restano nella loro stanza. vivono solo
   vicino alla camera, il resto della regione dorme */

type Mode = 'idle' | 'walk' | 'air' | 'chat' | 'flee' | 'face';

interface Bubble {
    text: Phaser.GameObjects.Text;
    until: number;
}

export interface FolkTalk {
    x: number;
    y: number;
    range: number;
    onInteract: () => void;
}

class Wanderer {
    readonly kind: FolkKind;
    readonly sprite: Phaser.GameObjects.Image;
    /** occhi accesi del passante */
    readonly glow: CreatureGlow;
    readonly talk: FolkTalk;
    seg: number;
    x: number;
    feet: number;
    mode: Mode = 'idle';
    until = 0;
    targetX = 0;
    facing: 1 | -1 = 1;
    partner: Wanderer | null = null;
    nextBarkAt = 0;
    bubble: Bubble | null = null;
    home: Room | null;
    air: { x0: number; y0: number; vx: number; vy: number; t: number; to: number } | null = null;
    phase = rng.fx.next() * 1000;

    constructor(sprite: Phaser.GameObjects.Image, kind: FolkKind, seg: number, x: number, feet: number, home: Room | null, onTalk: (w: Wanderer) => void) {
        this.sprite = sprite;
        this.glow = new CreatureGlow(sprite);
        this.kind = kind;
        this.seg = seg;
        this.x = x;
        this.feet = feet;
        this.home = home;
        this.talk = { x, y: feet - 26, range: 70, onInteract: () => onTalk(this) };
    }
}

export class FolkManager {
    private scene: Phaser.Scene;
    private nav: NavGraph;
    private folk: Wanderer[] = [];
    private biomeId = 'crater';
    private talker: (lines: DialogueLine[]) => void;
    /** durante un film: nessuno si muove, nessuno parla */
    private suspended = false;

    constructor(scene: Phaser.Scene, nav: NavGraph, talker: (lines: DialogueLine[]) => void) {
        this.scene = scene;
        this.nav = nav;
        this.talker = talker;
    }

    get talkables(): FolkTalk[] {
        return this.folk.map((w) => w.talk);
    }

    setSuspended(v: boolean): void {
        this.suspended = v;
        if (v) {
            for (const w of this.folk) {
                w.sprite.setVisible(false);
                w.glow.setVisible(false);
                if (w.bubble) w.bubble.text.setVisible(false);
            }
        }
    }

    /** popola la regione: stanze tranquille, pavimenti larghi, lontano dai nemici */
    populate(opts: { seed: string; biomeId: string; eye: number; layout: RegionLayout | null; avoid: { x: number; y: number }[]; widthPx: number; crowd?: number }): void {
        this.biomeId = opts.biomeId;
        const cast = FOLK[opts.biomeId] ?? FOLK.crater;
        let h = 0;
        for (const ch of opts.seed) h = (h * 31 + ch.charCodeAt(0)) | 0;
        const rnd = mulberry32(h ^ 0x51f0);
        const quiet = new Set(['start', 'rest', 'hall', 'cave', 'pool', 'exit', 'shaft']);
        const roomOf = (x: number, y: number): Room | null => {
            const L = opts.layout;
            if (!L) return null;
            return L.rooms.find((o) => x / TILE >= o.rect.x && x / TILE < o.rect.x + o.rect.w && y / TILE >= o.rect.y && y / TILE < o.rect.y + o.rect.h) ?? null;
        };
        const candidates = this.nav.segments.filter((s) => {
            if (s.c1 - s.c0 < 4) return false;
            const x = ((s.c0 + s.c1 + 1) / 2) * TILE;
            const y = s.r * TILE;
            const room = roomOf(x, y);
            if (opts.layout && (!room || !quiet.has(room.kind))) return false;
            return opts.avoid.every((a) => Math.abs(a.x - x) > 260 || Math.abs(a.y - y) > 160);
        });
        const target = opts.crowd ?? (opts.layout ? Math.max(8, Math.min(30, Math.round(opts.layout.rooms.length * 0.45))) : Math.max(5, Math.round(opts.widthPx / 1400)));
        const used = new Set<number>();
        for (let n = 0; n < target && candidates.length; n++) {
            const s = candidates[Math.floor(rnd() * candidates.length)];
            // in una piazza affollata più passanti dividono lo stesso marciapiede
            if (used.has(s.id) && !opts.crowd) continue;
            used.add(s.id);
            const pair = rnd() < 0.3 && s.c1 - s.c0 >= 7;
            const count = pair ? 2 : 1;
            for (let k = 0; k < count; k++) {
                const kind = cast[Math.floor(rnd() * cast.length)];
                const c = s.c0 + 1 + Math.floor(rnd() * Math.max(1, s.c1 - s.c0 - 1));
                this.spawn(kind, s.id, c * TILE + TILE / 2 + k * 40, opts.eye, roomOf(c * TILE, s.r * TILE));
            }
        }
    }

    private spawn(kind: FolkKind, seg: number, x: number, eye: number, home: Room | null): void {
        const s = this.nav.segments[seg];
        const feet = (s.r + 1) * TILE;
        const sprite = folkImage(this.scene, x, feet + 1, kind.look, eye).setDepth(3.6);
        const w = new Wanderer(sprite, kind, seg, x, feet, home, (who) => this.converse(who));
        w.facing = rng.logic.next() < 0.5 ? -1 : 1;
        this.folk.push(w);
    }

    /** due chiacchiere: battute del tipo, notizie del realm, e la paura di pedro quando serve */
    private converse(w: Wanderer): void {
        const pick = <T,>(a: T[]) => a[Math.floor(rng.logic.next() * a.length)];
        const lines: DialogueLine[] = pick(w.kind.talks).map((text) => ({ speaker: w.kind.name, color: w.kind.color, text }));
        const news = FOLK_AFTER.filter((n) => n.biome === this.biomeId && state.hasFlag(n.flag));
        if (news.length && rng.logic.next() < 0.6) lines.push({ speaker: w.kind.name, color: w.kind.color, text: pick(news).line });
        else if (state.save.doomsday > 0.4) lines.push({ speaker: w.kind.name, color: w.kind.color, text: pick(FOLK_PEDRO) });
        w.mode = 'face';
        w.until = this.scene.time.now + 2500;
        state.save.record.talks++;
        this.talker(lines);
    }

    private say(w: Wanderer, text: string, ms = 2400): void {
        const now = this.scene.time.now;
        if (!w.bubble) {
            const t = this.scene.add.text(w.x, w.feet - 60, '', {
                fontFamily: '"Permanent Marker", cursive',
                fontSize: '13px',
                color: '#f1f5f9',
                stroke: '#000000',
                strokeThickness: 4,
                padding: { x: 4, y: 2 },
                wordWrap: { width: 190 },
                align: 'center',
            }).setOrigin(0.5, 1).setDepth(8);
            w.bubble = { text: t, until: 0 };
        }
        w.bubble.text.setText(text).setVisible(true).setAlpha(1).setRotation((rng.fx.next() - 0.5) * 0.06);
        w.bubble.until = now + ms;
    }

    update(time: number, delta: number, player: Phaser.GameObjects.Sprite & { attackActive?: boolean }, threats: { x: number; y: number }[], bossFight: boolean): void {
        if (this.suspended) return;
        const cam = this.scene.cameras.main.worldView;
        const dt = delta / 1000;
        for (const w of this.folk) {
            // fuori scena non si muove nessuno
            const visible = w.x > cam.x - 500 && w.x < cam.right + 500 && w.feet > cam.y - 400 && w.feet < cam.bottom + 500;
            w.sprite.setVisible(visible);
            if (!visible) {
                w.glow.setVisible(false);
                if (w.bubble) w.bubble.text.setVisible(false);
                continue;
            }
            this.think(w, time, player, threats, bossFight);
            this.move(w, time, dt);
            const bob = w.mode === 'walk' || w.mode === 'flee' ? Math.abs(Math.sin((time + w.phase) / (w.mode === 'flee' ? 70 : 110))) * 2.5 : Math.sin((time + w.phase) / 700) * 0.6;
            w.sprite.setPosition(w.x, w.feet + 1 - bob);
            w.sprite.setFlipX(w.facing < 0);
            w.sprite.setRotation(w.mode === 'walk' ? Math.sin((time + w.phase) / 110) * 0.05 : 0);
            // passo a fotogrammi: chi scappa corre, chi è fermo resta sul primo
            const moving = w.mode === 'walk' || w.mode === 'flee';
            w.sprite.setFrame(moving ? Math.floor((time + w.phase) / (w.mode === 'flee' ? 80 : 140)) % 4 : 0);
            w.glow.sync();
            w.talk.x = w.x;
            w.talk.y = w.feet - 26;
            if (w.bubble) {
                const left = w.bubble.until - time;

                const below = this.folk.some((o) => o !== w && o.bubble && o.bubble.text.visible && o.bubble.until < w.bubble!.until && Math.abs(o.x - w.x) < 150 && Math.abs(o.feet - w.feet) < 40);
                w.bubble.text.setPosition(w.x, w.feet - 56 - (below ? 22 : 0));
                if (left <= 0) w.bubble.text.setVisible(false);
                else if (left < 400) w.bubble.text.setAlpha(left / 400);
            }
        }
    }

    private think(w: Wanderer, now: number, player: Phaser.GameObjects.Sprite & { attackActive?: boolean }, threats: { x: number; y: number }[], bossFight: boolean): void {
        if (w.mode === 'air') return;
        const px = player.x;
        const py = player.y;
        const dP = Math.hypot(px - w.x, py - (w.feet - 26));
        // pericolo: nemici svegli vicini, colpi menati accanto, un boss nella stanza
        const danger = threats.some((t) => Math.abs(t.x - w.x) < 190 && Math.abs(t.y - w.feet) < 120)
            || (player.attackActive && dP < 120)
            || (bossFight && dP < 700);
        if (danger && w.mode !== 'flee') {
            const from = threats.find((t) => Math.abs(t.x - w.x) < 190)?.x ?? px;
            w.mode = 'flee';
            w.until = now + 2600;
            w.facing = w.x < from ? -1 : 1;
            if (w.partner) {
                w.partner.partner = null;
                w.partner = null;
            }
            if (rng.logic.next() < 0.7) this.say(w, FOLK_PANIC[Math.floor(rng.logic.next() * FOLK_PANIC.length)], 1500);
            return;
        }
        if (w.mode === 'flee') {
            if (now < w.until) return;
            w.mode = 'idle';
            w.until = now + 1500;
        }
        // il custode passa: ci si gira e si dice la propria
        if (dP < 90 && now >= w.nextBarkAt && w.mode !== 'chat') {
            w.nextBarkAt = now + 9000 + rng.logic.next() * 6000;
            w.mode = 'face';
            w.until = now + 1800;
            w.facing = px < w.x ? -1 : 1;
            const pool = toneFor(state.save.levelId).folk === 'quieto' && rng.logic.next() < 0.6 ? FOLK_QUIET
                : state.save.doomsday > 0.45 && rng.logic.next() < 0.4 ? FOLK_PEDRO : w.kind.barks;
            this.say(w, pool[Math.floor(rng.logic.next() * pool.length)]);
            return;
        }
        if (now < w.until) return;
        // fine di uno stato: si sceglie cosa fare dopo
        const roll = rng.logic.next();
        const mate = this.folk.find((o) => o !== w && !o.partner && o.mode !== 'flee' && o.mode !== 'air' && Math.abs(o.x - w.x) < 140 && Math.abs(o.feet - w.feet) < 8);
        if (mate && !w.partner && roll < 0.35) {
            w.partner = mate;
            mate.partner = w;
            w.mode = mate.mode = 'chat';
            w.until = mate.until = now + 7000;
            w.facing = mate.x > w.x ? 1 : -1;
            mate.facing = (-w.facing) as 1 | -1;
            const chat = FOLK_CHAT[Math.floor(rng.logic.next() * FOLK_CHAT.length)];
            chat.forEach((line, i) => {
                const who = i % 2 === 0 ? w : mate;
                this.scene.time.delayedCall(i * 2200, () => who.mode === 'chat' && this.say(who, line, 2000));
            });
            return;
        }
        if (w.partner) {
            w.partner.partner = null;
            w.partner = null;
        }
        const seg = this.nav.segments[w.seg];
        if (roll < 0.55) {
            w.mode = 'walk';
            w.targetX = (seg.c0 + 0.5 + rng.logic.next() * (seg.c1 - seg.c0)) * TILE;
            w.until = now + 9000;
        } else if (roll < 0.75) {
            // un salto o un passo verso un pavimento vicino, senza uscire di casa
            const edges = this.nav.edges(w.seg).filter((e) => e.need <= 110 && this.inHome(w, e.to));
            const e = edges[Math.floor(rng.logic.next() * edges.length)];
            if (e) {
                w.mode = 'walk';
                w.targetX = e.fromC * TILE + TILE / 2;
                w.until = now + 8000;
                (w as Wanderer & { edge?: typeof e }).edge = e;
                return;
            }
            w.mode = 'idle';
            w.until = now + 1500 + rng.logic.next() * 2500;
        } else {
            w.mode = 'idle';
            w.until = now + 1500 + rng.logic.next() * 3500;
            if (rng.logic.next() < 0.4) w.facing = (-w.facing) as 1 | -1;
        }
    }

    private inHome(w: Wanderer, seg: number): boolean {
        if (!w.home) return true;
        const s = this.nav.segments[seg];
        const R = w.home.rect;
        return s.c0 > R.x && s.c1 < R.x + R.w - 1 && s.r > R.y && s.r < R.y + R.h - 1;
    }

    private move(w: Wanderer & { edge?: ReturnType<NavGraph['edges']>[number] }, now: number, dt: number): void {
        if (w.mode === 'air' && w.air) {
            const a = w.air;
            a.t += dt;
            w.x = a.x0 + a.vx * a.t;
            const y = a.y0 - a.vy * a.t + 1200 * a.t * a.t;
            const land = (this.nav.segments[a.to].r + 1) * TILE;
            if (y >= land && a.t > 0.1) {
                w.feet = land;
                w.seg = a.to;
                w.air = null;
                w.mode = 'idle';
                w.until = now + 800;
            } else {
                w.feet = y;
            }
            return;
        }
        const seg = this.nav.segments[w.seg];
        const lo = seg.c0 * TILE + 10;
        const hi = (seg.c1 + 1) * TILE - 10;
        if (w.mode === 'walk' || w.mode === 'flee') {
            const pace = w.kind.pace * (w.mode === 'flee' ? 3.2 : 1);
            const goal = w.mode === 'flee' ? (w.facing > 0 ? hi : lo) : w.targetX;
            const d = goal - w.x;
            if (Math.abs(d) < 3) {
                if (w.mode === 'walk' && w.edge) {
                    const e = w.edge;
                    w.edge = undefined;
                    w.mode = 'air';
                    w.air = { x0: w.x, y0: w.feet, vx: e.kind === 'jump' ? e.vx : Math.sign(e.vx) * 70, vy: e.kind === 'jump' ? e.vy : 0, t: 0, to: e.to };
                    w.facing = e.vx >= 0 ? 1 : -1;
                    return;
                }
                if (w.mode === 'walk') {
                    w.mode = 'idle';
                    w.until = now + 1200 + rng.logic.next() * 2000;
                }
                return;
            }
            w.facing = d > 0 ? 1 : -1;
            w.x = Phaser.Math.Clamp(w.x + Math.sign(d) * Math.min(Math.abs(d), pace * dt), lo, hi);
        }
    }

    destroy(): void {
        for (const w of this.folk) {
            w.sprite.destroy();
            w.glow.destroy();
            w.bubble?.text.destroy();
        }
        this.folk = [];
    }
}
