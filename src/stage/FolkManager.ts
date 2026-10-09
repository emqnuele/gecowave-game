import Phaser from 'phaser';
import { TILE } from '../config';
import { FOLK, FOLK_AFTER, FOLK_CHAT, FOLK_CHEER, FOLK_HEARD, FOLK_HIDING, FOLK_PANIC, FOLK_PEDRO, FOLK_QUIET, FOLK_RAIN, FOLK_RELIEF, FOLK_TERROR, FOLK_TIDE, type FolkKind } from '../content/folk';
import { toneFor } from '../content/tone';
import { mulberry32 } from '../rules/hash';
import { folkImage } from '../art/folk';
import { CreatureGlow } from '../art/creatureKit';
import type { NavGraph } from '../world/NavGraph';
import { state } from '../core/state';
import type { DialogueLine } from '../types';
import type { RegionLayout, Room } from '../world/types';
import { rng } from '../core/rng';

/* i passanti: niente fisica, si muovono sui segmenti del grafo di navigazione
   (camminate, cadute, saltelli) e restano nella loro stanza. vivono solo
   vicino alla camera, il resto della regione dorme */

type Mode = 'idle' | 'walk' | 'air' | 'chat' | 'flee' | 'face' | 'hide';

/** quanto lontano un passante vede chi lo insegue, fuori dalla sua stanza */
const SIGHT_X = 560;
const SIGHT_Y = 260;
/** salti e cadute che un passante in fuga fa prima di rintanarsi */
const FLEE_HOPS = 2;
/** chi sente il fischio fin dove lo sente */
const HEAR_R = 1300;
/** sopra la testa, quante celle cercare un tetto per la pioggia */
const COVER_ROWS = 8;
/** pioggia oltre cui all'aperto ci si ripara */
const RAIN_SHELTER = 0.35;

/** quello che un passante sa del mondo a ogni passo */
export interface FolkWorld {
    player: Phaser.GameObjects.Sprite & { attackActive?: boolean };
    threats: { x: number; y: number }[];
    bossFight: boolean;
    /** chi insegue il custode, se c'è (lochef nella tana) */
    pursuer: { x: number; y: number } | null;
    /** il pelo della marea adesso, null senza acqua */
    water: number | null;
    /** fin dove arriverà la marea che sta per salire, null se non sale */
    flood: number | null;
    /** 0..1, quanta pioggia cade */
    rain: number;
}

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
    /** ha visto chi insegue: scappa, si rintana, poi aspetta che se ne vada */
    terror = false;
    lastSaw = 0;
    hops = 0;
    /** sale verso l'alto prima che arrivi l'acqua */
    climbing = false;
    /** sotto un tetto ad aspettare che spiova */
    sheltered = false;
    /** sotto la pioggia, curvo */
    hunch = false;
    /** dopo un boss: si gira a guardarti, una volta */
    cheerUntil = 0;
    readonly baseScaleY: number;

    constructor(sprite: Phaser.GameObjects.Image, kind: FolkKind, seg: number, x: number, feet: number, home: Room | null, onTalk: (w: Wanderer) => void) {
        this.sprite = sprite;
        this.glow = new CreatureGlow(sprite);
        this.kind = kind;
        this.seg = seg;
        this.x = x;
        this.feet = feet;
        this.home = home;
        this.talk = { x, y: feet - 26, range: 70, onInteract: () => onTalk(this) };
        this.baseScaleY = sprite.scaleY;
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

    update(time: number, delta: number, world: FolkWorld): void {
        if (this.suspended) return;
        const water = world.water;
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
            // la marea sopra la testa: si sono messi al riparo, tornano quando l'acqua scende
            const under = water !== null && w.feet - 34 > water;
            w.sprite.setAlpha(Phaser.Math.Clamp(w.sprite.alpha + (under ? -3 : 3) * dt, 0, 1));
            w.talk.range = under ? 0 : 70;
            if (under) {
                w.glow.setVisible(false);
                if (w.bubble) w.bubble.text.setVisible(false);
                if (w.sprite.alpha <= 0) w.sprite.setVisible(false);
                continue;
            }
            this.think(w, time, world);
            this.move(w, time, dt);
            const bob = w.mode === 'walk' || w.mode === 'flee' ? Math.abs(Math.sin((time + w.phase) / (w.mode === 'flee' ? 70 : 110))) * 2.5 : Math.sin((time + w.phase) / 700) * 0.6;
            // rintanato: rannicchiato e scosso dai brividi
            const shiver = w.mode === 'hide' ? Math.sin((time + w.phase) / 28) * 0.9 : 0;
            w.sprite.setPosition(w.x + shiver, w.feet + 1 - (w.mode === 'hide' ? 0 : bob));
            w.sprite.scaleY = w.baseScaleY * (w.mode === 'hide' ? 0.8 : w.hunch ? 0.9 : 1);
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

    private think(w: Wanderer, now: number, world: FolkWorld): void {
        if (w.mode === 'air') return;
        const { player, threats, bossFight } = world;
        if (this.terrified(w, now, world.pursuer)) return;
        if (this.fleeWater(w, now, world.flood)) return;
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
        if (this.cheer(w, now, px)) return;
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
        if (this.shelter(w, now, world.rain)) return;
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

    /** chi insegue il custode fa paura a tutti: chi lo vede scappa lontano da lui e si rintana finché non se ne va */
    private terrified(w: Wanderer, now: number, pursuer: { x: number; y: number } | null): boolean {
        if (pursuer && this.sees(w, pursuer)) {
            w.lastSaw = now;
            const away: 1 | -1 = pursuer.x < w.x ? 1 : -1;
            if (!w.terror) {
                w.terror = true;
                w.hops = 0;
                if (w.partner) {
                    w.partner.partner = null;
                    w.partner = null;
                }
                (w as Wanderer & { edge?: unknown }).edge = undefined;
                if (rng.logic.next() < 0.75) this.say(w, FOLK_TERROR[Math.floor(rng.logic.next() * FOLK_TERROR.length)], 1600);
            }
            // rintanato resta giù, a meno che non gli arrivi addosso dal lato del muro
            if (w.mode === 'hide' && (away === w.facing || Math.abs(pursuer.x - w.x) > 140)) return true;
            if (w.mode !== 'flee') w.mode = 'flee';
            w.facing = away;
            return true;
        }
        if (!w.terror) return false;
        // se ne è andato: si aspetta ancora un po', poi si torna a respirare
        if (now - w.lastSaw < 3200 + (w.phase % 1800)) {
            if (w.mode === 'hide' && rng.logic.next() < 0.002) this.say(w, FOLK_HIDING[Math.floor(rng.logic.next() * FOLK_HIDING.length)], 1800);
            return true;
        }
        w.terror = false;
        w.mode = 'idle';
        w.until = now + 2000;
        if (rng.logic.next() < 0.6) this.say(w, FOLK_RELIEF[Math.floor(rng.logic.next() * FOLK_RELIEF.length)], 2200);
        return true;
    }

    /** il fischio di chi insegue: chi lo sente sa cosa vuol dire, e si rintana prima di vederlo */
    hear(x: number, y: number): void {
        const now = this.scene.time.now;
        for (const w of this.folk) {
            if (w.mode === 'air' || Math.abs(w.x - x) > HEAR_R || Math.abs(w.feet - y) > HEAR_R * 0.6) continue;
            const fresh = !w.terror;
            w.terror = true;
            w.lastSaw = now;
            if (!fresh) continue;
            w.hops = 0;
            this.unpair(w);
            (w as Wanderer & { edge?: unknown }).edge = undefined;
            w.mode = 'flee';
            w.facing = x < w.x ? 1 : -1;
            if (rng.logic.next() < 0.6) this.say(w, FOLK_HEARD[Math.floor(rng.logic.next() * FOLK_HEARD.length)], 1600);
        }
    }

    /** un boss è caduto: chi è intorno si gira a guardarti, una volta */
    cheerFrom(x: number, y: number): void {
        const until = this.scene.time.now + 9000;
        for (const w of this.folk) if (Math.abs(w.x - x) < 2200 && Math.abs(w.feet - y) < 1200) w.cheerUntil = until;
    }

    private cheer(w: Wanderer, now: number, px: number): boolean {
        if (!w.cheerUntil) return false;
        if (now > w.cheerUntil) {
            w.cheerUntil = 0;
            return false;
        }
        w.cheerUntil = 0;
        this.unpair(w);
        w.mode = 'face';
        w.until = now + 2600;
        w.facing = px < w.x ? -1 : 1;
        if (rng.logic.next() < 0.8) this.say(w, FOLK_CHEER[Math.floor(rng.logic.next() * FOLK_CHEER.length)], 2400);
        return true;
    }

    /** la marea sta per salire: chi resterebbe sotto sale di piano finché può */
    private fleeWater(w: Wanderer, now: number, flood: number | null): boolean {
        if (flood === null) {
            w.climbing = false;
            return false;
        }
        const seg = this.nav.segments[w.seg];
        if ((seg.r + 1) * TILE - 34 <= flood) {
            if (w.climbing) {
                w.climbing = false;
                w.mode = 'idle';
                w.until = now + 2500;
            }
            return false;
        }
        const going = (w as Wanderer & { edge?: unknown }).edge;
        if (w.climbing && w.mode === 'walk' && going) return true;
        if (!w.climbing) {
            w.climbing = true;
            this.unpair(w);
            if (rng.logic.next() < 0.7) this.say(w, FOLK_TIDE[Math.floor(rng.logic.next() * FOLK_TIDE.length)], 1800);
        }
        const up = this.nav.edges(w.seg)
            .filter((e) => e.need <= 110 && this.nav.segments[e.to].r < seg.r)
            .sort((a, b) => Math.abs(a.fromC * TILE - w.x) - Math.abs(b.fromC * TILE - w.x))[0];
        if (up) {
            w.mode = 'walk';
            w.targetX = up.fromC * TILE + TILE / 2;
            w.until = now + 8000;
            (w as Wanderer & { edge?: typeof up }).edge = up;
        } else if (w.mode !== 'idle' || now >= w.until) {
            // più su non si va: si aspetta guardando in basso
            w.mode = 'idle';
            w.until = now + 1500;
        }
        return true;
    }

    /** sotto la pioggia, all'aperto: si cerca un tetto sul proprio pavimento, se no si cammina curvi */
    private shelter(w: Wanderer, now: number, rain: number): boolean {
        const wet = rain > RAIN_SHELTER && !!w.home?.surface;
        w.hunch = wet && !w.sheltered;
        if (!wet) {
            w.sheltered = false;
            return false;
        }
        if (w.mode === 'face' && now < w.until) return false;
        if (w.sheltered) {
            if (now >= w.until) {
                w.until = now + 5000;
                if (rng.logic.next() < 0.15) this.say(w, FOLK_RAIN[Math.floor(rng.logic.next() * FOLK_RAIN.length)], 2000);
            }
            w.mode = 'idle';
            return true;
        }
        const cx = this.coverNear(w);
        if (cx === null) return false;
        this.unpair(w);
        if (Math.abs(cx - w.x) < 6) {
            w.sheltered = true;
            w.mode = 'idle';
            w.until = now + 5000;
            if (rng.logic.next() < 0.5) this.say(w, FOLK_RAIN[Math.floor(rng.logic.next() * FOLK_RAIN.length)], 2000);
            return true;
        }
        if (w.mode !== 'walk' || w.targetX !== cx) {
            w.mode = 'walk';
            w.targetX = cx;
            w.until = now + 9000;
            (w as Wanderer & { edge?: unknown }).edge = undefined;
        }
        return true;
    }

    /** colonne del pavimento con un tetto sopra, per pavimento; calcolate la prima volta che servono */
    private covers = new Map<number, number[]>();

    private coverNear(w: Wanderer): number | null {
        let cols = this.covers.get(w.seg);
        if (!cols) {
            const seg = this.nav.segments[w.seg];
            cols = [];
            for (let c = seg.c0; c <= seg.c1; c++) {
                for (let r = seg.r - 2; r >= seg.r - COVER_ROWS; r--) {
                    if (this.nav.solid(c, r)) {
                        cols.push(c * TILE + TILE / 2);
                        break;
                    }
                }
            }
            this.covers.set(w.seg, cols);
        }
        let best: number | null = null;
        for (const x of cols) if (best === null || Math.abs(x - w.x) < Math.abs(best - w.x)) best = x;
        return best;
    }

    private unpair(w: Wanderer): void {
        if (!w.partner) return;
        w.partner.partner = null;
        w.partner = null;
    }

    private sees(w: Wanderer, p: { x: number; y: number }): boolean {
        const R = w.home?.rect;
        if (R && p.x >= R.x * TILE && p.x < (R.x + R.w) * TILE && p.y >= R.y * TILE && p.y < (R.y + R.h) * TILE) return true;
        return Math.abs(p.x - w.x) < SIGHT_X && Math.abs(p.y - (w.feet - 26)) < SIGHT_Y;
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
                w.mode = w.terror ? 'flee' : 'idle';
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
            const pace = w.kind.pace * (w.mode === 'flee' ? 3.2 : w.climbing ? 2.4 : w.hunch ? 1.5 : 1);
            const goal = w.mode === 'flee' ? (w.facing > 0 ? hi : lo) : w.targetX;
            const d = goal - w.x;
            if (Math.abs(d) < 3) {
                if (w.mode === 'flee' && w.terror) {
                    // in fondo al pavimento: un salto o una caduta ancora più lontano, poi ci si rintana
                    const dir = w.facing;
                    const out = w.hops < FLEE_HOPS
                        ? this.nav.edges(w.seg).find((e) => e.need <= 110 && Math.sign(e.vx || e.toC - e.fromC) === dir && Math.abs(e.fromC * TILE + TILE / 2 - w.x) < TILE * 1.5)
                        : undefined;
                    if (out) {
                        w.hops++;
                        w.mode = 'air';
                        w.air = { x0: w.x, y0: w.feet, vx: out.kind === 'jump' ? out.vx : dir * 110, vy: out.kind === 'jump' ? out.vy : 0, t: 0, to: out.to };
                        return;
                    }
                    w.mode = 'hide';
                    // la faccia al muro: non guardarlo negli occhi
                    w.facing = dir;
                    return;
                }
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
