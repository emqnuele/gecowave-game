import Phaser from 'phaser';
import { TILE } from '../config';
import { ITEMS } from '../content/items';
import { questsFor, type QuestDef, type QuestPerson } from '../content/quests';
import type { DialogueLine, EnemyKind } from '../types';
import type { RegionLayout } from '../world/types';
import { hashString } from './art/ink';
import { ensureFolkTexture } from './art/folk';
import { bus } from './events';
import type { LightingManager } from './LightingManager';
import { sfx } from './sfx';
import { state } from './state';

/* le missioni dei passanti. chi te le dà, cosa cercare e a chi consegnare
   stanno solo sui posti verificati dal simulatore: si arriva sempre */

export type QuestStage = 'attiva' | 'pronta' | 'fatta';

export interface QuestTalk {
    x: number;
    y: number;
    range: number;
    onInteract: () => void;
}

interface Placed {
    def: QuestDef;
    giver: { sprite: Phaser.GameObjects.Image; mark: Phaser.GameObjects.Text; talk: QuestTalk };
    recipient?: { sprite: Phaser.GameObjects.Image; mark: Phaser.GameObjects.Text; talk: QuestTalk };
    thing?: Phaser.Physics.Arcade.Sprite;
}

export function questState(id: string): { s: QuestStage; n: number } | null {
    return state.save.quests[id] ?? null;
}

export class QuestManager {
    private scene: Phaser.Scene;
    private placed: Placed[] = [];
    private talk: (lines: DialogueLine[], onEnd?: () => void) => void;
    private lighting: LightingManager;
    readonly talkables: QuestTalk[] = [];
    private spots: { c: number; r: number; room: RegionLayout['rooms'][number] }[] = [];
    private taken: { x: number; y: number }[] = [];
    private player: Phaser.GameObjects.GameObject | null = null;

    constructor(scene: Phaser.Scene, lighting: LightingManager, talk: (lines: DialogueLine[], onEnd?: () => void) => void) {
        this.scene = scene;
        this.lighting = lighting;
        this.talk = talk;
    }

    setup(regionId: string, layout: RegionLayout | null, eye: number, player: Phaser.GameObjects.GameObject, avoid: { x: number; y: number }[]): void {
        if (!layout?.spots?.length) return;
        const spots = layout.spots.map(([c, r, room]) => ({ c, r, room: layout.rooms[room] })).filter((s) => s.room);
        this.spots = spots;
        this.player = player;
        this.taken = [...avoid];
        const pick = (cands: typeof spots, seed: string) => this.pick(cands, seed);
        const quiet = spots.filter((s) => s.room.pathIndex >= 0 && ['rest', 'start', 'hall'].includes(s.room.kind));
        const early = quiet.filter((s) => s.room.pathIndex <= layout.pathLength * 0.6);
        for (const def of questsFor(regionId)) {
            const st = questState(def.id);
            const g = pick(early.length ? early : quiet.length ? quiet : spots, `${def.id}:giver`);
            if (!g) continue;
            const giver = this.person(def.giver, g.c, g.r, eye, () => this.talkGiver(def));
            const placed: Placed = { def, giver };
            if (def.kind === 'consegna' && def.recipient) {
                const far = spots.filter((s) => s.room.pathIndex >= 0 && Math.abs(s.room.pathIndex - g.room.pathIndex) >= 5 && s.room.kind !== 'arena');
                const rs = pick(far.length ? far : spots.filter((s) => s.room !== g.room), `${def.id}:to`);
                if (rs) placed.recipient = this.person(def.recipient, rs.c, rs.r, eye, () => this.talkRecipient(def));
            }
            this.placed.push(placed);
            if (def.kind === 'cerca' && st?.s === 'attiva') this.respawnThing(def);
        }
        this.refreshMarks();
    }

    private pick(cands: { c: number; r: number; room: RegionLayout['rooms'][number] }[], seed: string): { c: number; r: number; room: RegionLayout['rooms'][number] } | null {
        const free = (s: { c: number; r: number }) => this.taken.every((t) => Math.abs(t.x - (s.c * TILE + 16)) > 140 || Math.abs(t.y - s.r * TILE) > 100);
        const ok = cands.filter(free);
        if (!ok.length) return null;
        const s = ok[hashString(seed) % ok.length];
        this.taken.push({ x: s.c * TILE + 16, y: s.r * TILE });
        return s;
    }

    private person(who: QuestPerson, c: number, r: number, eye: number, onTalk: () => void): Placed['giver'] {
        const key = ensureFolkTexture(this.scene, who.look, eye);
        const x = c * TILE + TILE / 2;
        const feet = (r + 1) * TILE;
        const sprite = this.scene.add.image(x, feet + 1, key).setOrigin(0.5, 1).setDepth(3.7);
        this.scene.tweens.add({ targets: sprite, scaleY: 1.03, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        const mark = this.scene.add.text(x, feet - 66, '!', {
            fontFamily: '"Permanent Marker", cursive',
            fontSize: '22px',
            color: '#facc15',
            stroke: '#000',
            strokeThickness: 4,
        }).setOrigin(0.5).setDepth(8);
        this.scene.tweens.add({ targets: mark, y: feet - 72, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        const talk: QuestTalk = { x, y: feet - 26, range: 64, onInteract: onTalk };
        this.talkables.push(talk);
        return { sprite, mark, talk };
    }

    /** la cosa da cercare: brilla, galleggia, si prende passandoci sopra */
    private thing(def: QuestDef, c: number, r: number, player: Phaser.GameObjects.GameObject): Phaser.Physics.Arcade.Sprite {
        const key = `quest-thing-${def.id}`;
        if (!this.scene.textures.exists(key)) {
            const el = document.createElement('canvas');
            el.width = 40;
            el.height = 40;
            const ctx = el.getContext('2d')!;
            const g = ctx.createRadialGradient(20, 20, 2, 20, 20, 19);
            g.addColorStop(0, 'rgba(250,204,21,0.55)');
            g.addColorStop(1, 'rgba(250,204,21,0)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 40, 40);
            ctx.font = '22px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(def.thing?.icon ?? '?', 20, 21);
            this.scene.textures.addCanvas(key, el);
        }
        const x = c * TILE + TILE / 2;
        const y = r * TILE + 4;
        const s = this.scene.physics.add.sprite(x, y, key).setDepth(5);
        (s.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        this.lighting.follow(s, 0xfacc15, 140, 0.8);
        this.scene.tweens.add({ targets: s, y: y - 8, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.scene.physics.add.overlap(player, s, () => {
            if (!s.active) return;
            s.destroy();
            this.set(def.id, 'pronta', 0);
            sfx.pickup();
            bus.emit('toast', { text: `${def.thing?.icon ?? ''} ${def.thing?.name}: riportalo a chi l'ha perso.` });
            this.refreshMarks();
        });
        return s;
    }

    private set(id: string, s: QuestStage, n: number): void {
        state.save.quests[id] = { s, n };
        state.persist();
    }

    private lines(who: QuestPerson, texts: string[]): DialogueLine[] {
        return texts.map((text) => ({ speaker: who.name, color: who.color, text }));
    }

    private talkGiver(def: QuestDef): void {
        const st = questState(def.id);
        if (!st) {
            this.talk(this.lines(def.giver, def.intro), () => {
                bus.emit('choice-show', {
                    title: `missione: ${def.title}`,
                    options: [{ label: 'ci penso io' }, { label: 'non ora' }],
                    onPick: (i) => {
                        if (i !== 0) return;
                        this.set(def.id, 'attiva', 0);
                        bus.emit('toast', { text: `missione accettata: ${def.title}. la trovi nel diario.` });
                        if (def.kind === 'cerca') this.respawnThing(def);
                        this.refreshMarks();
                    },
                });
            });
            return;
        }
        if (st.s === 'fatta') {
            this.talk(this.lines(def.giver, [def.done[0]]));
            return;
        }
        if (st.s === 'pronta' && def.kind !== 'consegna') {
            this.complete(def, def.giver, def.done);
            return;
        }
        this.talk(this.lines(def.giver, def.waiting));
    }

    private talkRecipient(def: QuestDef): void {
        const st = questState(def.id);
        if (!def.recipient) return;
        if (st?.s === 'attiva') {
            this.complete(def, def.recipient, def.recipient.thanks);
            return;
        }
        this.talk(this.lines(def.recipient, [st?.s === 'fatta' ? def.recipient.thanks[0] : '...sì? aspetto qualcosa. non so cosa. lo saprò quando arriva.']));
    }

    private complete(def: QuestDef, who: QuestPerson, text: string[]): void {
        this.talk(this.lines(who, text), () => {
            this.set(def.id, 'fatta', 0);
            const r = def.reward;
            if (r.barre) {
                state.save.barre += r.barre;
                bus.emit('barre-changed', { barre: state.save.barre, gained: true });
            }
            if (r.item && ITEMS[r.item]) {
                const charm = ITEMS[r.item].kind === 'amuleto';
                state.addItem(r.item, r.amount ?? 1);
                if (charm) bus.emit('charm-found', { id: r.item });
                else bus.emit('inventory-changed', {});
            }
            state.persist();
            sfx.unlock();
            bus.emit('toast', { text: `missione completata: ${def.title}${r.barre ? ` · +${r.barre} barre` : ''}${r.item ? ` · ${ITEMS[r.item]?.icon ?? ''} ${ITEMS[r.item]?.name ?? ''}` : ''}` });
            this.refreshMarks();
        });
    }

    private respawnThing(def: QuestDef): void {
        const p = this.placed.find((x) => x.def === def);
        if (!p || p.thing?.active || !this.player) return;
        const giverRoom = this.spots.find((s) => s.c * TILE + TILE / 2 === p.giver.talk.x)?.room;
        const side = this.spots.filter((s) => s.room.pathIndex < 0 && s.room.kind !== 'arena');
        const ts = this.pick(side.length ? side : this.spots.filter((s) => s.room !== giverRoom), `${def.id}:thing`);
        if (ts) p.thing = this.thing(def, ts.c, ts.r, this.player);
    }

    /** un nemico è caduto: le cacce attive di questa regione avanzano */
    onKill(kind: EnemyKind): void {
        for (const p of this.placed) {
            const def = p.def;
            const st = questState(def.id);
            if (def.kind !== 'caccia' || !def.hunt || st?.s !== 'attiva') continue;
            if (def.hunt.kind && def.hunt.kind !== kind) continue;
            const n = st.n + 1;
            if (n >= def.hunt.count) {
                this.set(def.id, 'pronta', n);
                bus.emit('toast', { text: `${def.title}: fatto. torna a dirlo a chi te l'ha chiesto.` });
                this.refreshMarks();
            } else {
                this.set(def.id, 'attiva', n);
                if (n % 4 === 0) bus.emit('toast', { text: `${def.title}: ${n}/${def.hunt.count}` });
            }
        }
    }

    /** ! = c'è una missione, … = in corso, ? = da riconsegnare */
    private refreshMarks(): void {
        for (const p of this.placed) {
            const st = questState(p.def.id);
            const g = p.giver.mark;
            if (!st) g.setText('!').setColor('#facc15').setVisible(true);
            else if (st.s === 'fatta') g.setVisible(false);
            else if (st.s === 'pronta' && p.def.kind !== 'consegna') g.setText('?').setColor('#4ade80').setVisible(true);
            else g.setText('…').setColor('#94a3b8').setVisible(true);
            if (p.recipient) {
                p.recipient.mark.setText('!').setColor('#facc15').setVisible(st?.s === 'attiva');
            }
        }
    }

    get placedThings(): Placed[] {
        return this.placed;
    }
}
