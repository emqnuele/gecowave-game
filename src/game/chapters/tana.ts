import Phaser from 'phaser';
import { BOSS_BARKS } from '../../content/barks';
import { TOASTS, WAVESUNG } from '../../content/story';
import { TILE } from '../../config';
import { creatureFrames, creatureRes } from '../../art/creatureKit';
import { ensureCreature } from '../../art/creatures';
import { bus } from '../../core/events';
import { music } from '../../audio/music';
import { state } from '../../core/state';
import type { BossKind } from '../../types';
import type { Interactable } from '../Interactions';
import { Chapter, type ChapterCtx } from './ChapterScript';
import { Ambushes } from './shared/Ambushes';

/** dialoghi per zona di caccia: la prima volta e la ricaduta */
const CHASE_LINES = [
    { start: 'lochef-benvenuto', end: 'lochef-perso' },
    { start: 'lochef-ritorno', end: 'lochef-perso-2' },
];

/** la tana di lochef: un capitolo horror per sottrazione, cacce e nascondigli */
export class TanaChapter extends Chapter {
    private readonly ambushes: Ambushes;
    // inseguimenti nella tana: lochef ci prova più di una volta
    private chaseSprite: Phaser.GameObjects.Sprite | null = null;
    private chaseWhisperAt = 0;
    private chaseWhisperIdx = 0;
    private chaseTrail: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
    private chaseStarts: number[] = [];
    private chaseEnds: number[] = [];
    private chaseZoneIdx = -1;
    private chaseDone: boolean[] = [];
    /** fatica di lochef: dopo 8s a contatto rallenta del 30% per 3s */
    private chaseNearSince = 0;
    private chaseTiredUntil = 0;
    /** l'ospite n.12 dopo l'arresto: si parla e poi torna a casa */
    private ospite12Sprite: Phaser.GameObjects.Sprite | null = null;
    private ospite12Interact: Interactable | null = null;

    constructor(ctx: ChapterCtx) {
        super(ctx);
        this.ambushes = new Ambushes(ctx);
    }

    marker(id: string, x: number, y: number): boolean {
        // marker invisibili degli inseguimenti nella tana (solo finché il boss è vivo)
        if (id === 'caccia-inizio') {
            if (state.hasFlag('boss-down-lochef')) return true;
            this.chaseStarts.push(this.ctx.world.progressAt(x, y));
            this.chaseStarts.sort((a, b) => a - b);
            this.chaseDone = this.chaseStarts.map(() => false);
            return true;
        }
        if (id === 'caccia-fine') {
            if (state.hasFlag('boss-down-lochef')) return true;
            this.chaseEnds.push(this.ctx.world.progressAt(x, y));
            this.chaseEnds.sort((a, b) => a - b);
            return true;
        }
        if (id === 'ospite-12') {
            this.ospite12Sprite = this.ctx.npcs.present(id, x, y);
            this.ospite12Interact = this.ctx.npcs.talk(id, x, y);
            return true;
        }
        return false;
    }

    /** nella tana il risveglio gira sul nero, poi gli occhi si aprono */
    startsInDark(): boolean {
        return true;
    }

    setup(): void {
        if (!state.hasFlag('wavesung-tana')) {
            state.setFlag('wavesung-tana');
            this.scene.time.delayedCall(2500, () => bus.emit('wavesung', WAVESUNG.markolinoTana));
        }
    }

    update(_time: number, delta: number): void {
        this.ambushes.update();
        this.updateChase(delta);
    }

    interact(id: string): boolean {
        if (id !== 'ospite-12') return false;
        this.ctx.dialogues.start(id, () => {
            state.setFlag('ospite-12-libero');
            state.persist();
            const npc = this.ospite12Sprite;
            const entry = this.ospite12Interact;
            if (entry) this.ctx.interactions.remove(entry);
            this.ospite12Sprite = null;
            this.ospite12Interact = null;
            if (npc?.active) {
                this.scene.tweens.add({ targets: npc, alpha: 0, y: npc.y - 20, duration: 1200, onComplete: () => npc.destroy() });
            }
        });
        return true;
    }

    pursuer(): Phaser.GameObjects.Sprite | null {
        return this.chaseSprite;
    }

    chaseRanges(): { start: number; end: number }[] {
        return this.chaseStarts.map((start, i) => ({ start, end: this.chaseEnds[i] ?? Infinity }));
    }

    sniffed(): void {
        this.onTanaSniffed();
    }

    bossDefeated(kind: BossKind, x: number, y: number): void {
        switch (kind) {
            case 'lochef':
                this.ctx.dialogues.start('lochef-sconfitto', () => {
                    this.ctx.rewards.spawnCuore(x, y + 40, 'cuore-lochef', true);
                    if (state.hasFlag('lochef-arrestato')) return;
                    state.setFlag('lochef-arrestato');
                    this.ctx.dialogues.start('lochef-consegna', () => {
                        state.save.barre += 200;
                        state.persist();
                        bus.emit('barre-changed', { barre: state.save.barre, gained: true });
                        bus.emit('toast', { text: 'taglia della questura: +200 barre.' });
                        this.spawnOspite12();
                    });
                });
                break;
        }
    }

    /** l'ospite n.12 accanto alle statue del giardino, dopo l'arresto */
    private spawnOspite12(): void {
        let x = this.ctx.player.x + 80;
        let y = this.ctx.player.y;
        const statue = this.ctx.world.level.entities.find((e) => e.spec.type === 'lore' && e.spec.id === 'lore-statue');
        const room = statue ? this.ctx.world.roomAt(statue.x, statue.y) : this.ctx.world.roomAt(x, y);
        const layout = this.ctx.world.layout;
        const spots = room && layout ? (layout.spots ?? []).filter((s) => (s[2] ?? -1) === room.id) : [];
        if (spots.length) {
            const s = spots[Math.floor(spots.length / 2)]!;
            x = s[0] * TILE + TILE / 2;
            y = (s[1] + 1) * TILE - 18;
        } else if (statue) {
            x = statue.x + 60;
            y = statue.y;
        }
        this.ctx.npcs.spawn('ospite-12', x, y);
    }

    private updateChase(delta: number): void {
        // a boss sconfitto la tana è murata: niente più cacce al ritorno
        if (state.hasFlag('boss-down-lochef')) return;
        if (this.chaseStarts.length === 0 || this.ctx.player.dead || this.ctx.flow.exiting) return;

        if (!this.chaseSprite) {
            // c'è una zona di caccia non ancora completata sotto i piedi?
            const here = this.ctx.world.progressAt(this.ctx.player.x, this.ctx.player.y);
            const idx = this.chaseStarts.findIndex((sx, i) => {
                const ex = this.chaseEnds[i] ?? Infinity;
                return !this.chaseDone[i] && here >= sx && here < ex;
            });
            if (idx < 0) return;
            this.chaseZoneIdx = idx;
            const lines = CHASE_LINES[Math.min(idx, CHASE_LINES.length - 1)];
            const spawn = () => {
                // arriva da dietro: dal lato opposto a dove ti porta la strada
                const goal = this.ctx.guide.currentObjective();
                const next = goal && this.ctx.guide.guide ? this.ctx.guide.guide.nextPoint(this.ctx.player.x, this.ctx.player.y, goal.x, goal.y) : null;
                const ahead = next ? Math.sign(next.x - this.ctx.player.x) || 1 : 1;
                const cam = this.scene.cameras.main.worldView;
                const sx = ahead > 0 ? cam.x - 60 : cam.right + 60;
                // fuori dalle luci: lochef si vede sempre, è lui la luce cattiva
                const chef = this.scene.add.sprite(sx, this.ctx.player.y - 70, ensureCreature(this.scene, 'boss-lochef'), 0).setDepth(7).setScale(1.25 / creatureRes(this.scene, 'boss-lochef'));
                this.chaseSprite = chef;
                this.ctx.carry.chaseStartedAt = this.scene.time.now;
                this.chaseNearSince = 0;
                this.chaseTiredUntil = 0;
                this.ctx.lighting.follow(chef, 0xf87171, 300, 1.2);
                this.chaseTrail?.destroy();
                this.chaseTrail = this.scene.add.particles(0, 0, 'p-dot', {
                    follow: chef,
                    speed: { min: 10, max: 40 },
                    scale: { start: 0.6, end: 0 },
                    alpha: { start: 0.5, end: 0 },
                    tint: 0xf87171,
                    lifespan: 600,
                    frequency: 60,
                }).setDepth(6);
                this.scene.cameras.main.flash(160, 120, 10, 10);
                this.ctx.feel.shake(260, 0.006);
                music.playCustom("assets/music/lochef85's OST 2.mp3");
                bus.emit('toast', { text: TOASTS.inseguimento });
            };
            if (!state.save.seenDialogues.includes(lines.start)) {
                state.save.seenDialogues.push(lines.start);
                state.persist();
                this.ctx.dialogues.start(lines.start, spawn);
            } else {
                spawn();
            }
            return;
        }

        const chef = this.chaseSprite;
        if (!chef?.active) return;

        // fine corsa: lochef ti perde di vista. per ora. (o si stufa: nemmeno lui corre per sempre)
        const endP = this.chaseEnds[this.chaseZoneIdx] ?? Infinity;
        if (this.ctx.world.progressAt(this.ctx.player.x, this.ctx.player.y) >= endP || this.scene.time.now - this.ctx.carry.chaseStartedAt > 50000) {
            this.chaseDone[this.chaseZoneIdx] = true;
            this.chaseSprite = null;
            this.chaseTrail?.destroy();
            this.chaseTrail = null;
            this.scene.tweens.add({
                targets: chef,
                x: chef.x - 500,
                alpha: 0,
                duration: 900,
                ease: 'Quad.easeIn',
                onComplete: () => chef.destroy(),
            });
            music.playLevel(this.ctx.world.def.id);
            bus.emit('toast', { text: TOASTS.inseguimentoFine });
            const lines = CHASE_LINES[Math.min(this.chaseZoneIdx, CHASE_LINES.length - 1)];
            if (!state.save.seenDialogues.includes(lines.end)) {
                state.save.seenDialogues.push(lines.end);
                state.persist();
                this.ctx.dialogues.start(lines.end);
            }
            return;
        }

        // da nascosto lochef perde la traccia: punta l'ultimo punto visto, poi si allontana
        if (this.ctx.player.hidden) {
            const ls = this.ctx.carry.chaseLastSeen;
            const hx = ls.x - chef.x;
            const hy = ls.y - 30 - chef.y;
            const hdist = Math.hypot(hx, hy) || 1;
            if (hdist > 70) {
                chef.x += (hx / hdist) * 235 * (delta / 1000);
                chef.y += (hy / hdist) * 235 * 0.75 * (delta / 1000);
            } else {
                const ax = chef.x - this.ctx.player.x;
                const ay = chef.y - this.ctx.player.y;
                const adist = Math.hypot(ax, ay) || 1;
                chef.x += (ax / adist) * 60 * (delta / 1000);
                chef.y += (ay / adist) * 60 * (delta / 1000);
                if (this.scene.time.now >= this.chaseWhisperAt) {
                    this.chaseWhisperAt = this.scene.time.now + 5000;
                    const lines = BOSS_BARKS.lochef?.extra?.whisper ?? [];
                    const raw = lines.length ? lines[this.chaseWhisperIdx++ % lines.length] : 'dove sei, piccolo?';
                    bus.emit('bark', { speaker: 'lochef85', color: 'red', text: typeof raw === 'string' ? raw : raw.text, urgent: true });
                }
            }
            chef.setFlipX(hx > 0);
            chef.setFrame(Math.floor(this.scene.time.now / 110) % creatureFrames(this.scene, 'boss-lochef'));
            return;
        }
        this.ctx.carry.chaseLastSeen = { x: this.ctx.player.x, y: this.ctx.player.y };

        // fluttua verso di te, ma fa i gradini: in verticale è lento,
        // sui dislivelli si pianta in orizzontale. a elastico: lontano corre,
        // vicino ti lascia un respiro. vola, ma con la fatica di chi cucina.
        const dx = this.ctx.player.x - chef.x;
        const dy = this.ctx.player.y - 30 - chef.y;
        const dist = Math.hypot(dx, dy) || 1;
        let speed = dist > 620 ? 380 : dist > 320 ? 250 : 200;
        // partenza morbida: 1.5s per entrare in caccia, il salto iniziale non uccide
        const ramp = Math.min(1, (this.scene.time.now - this.ctx.carry.chaseStartedAt) / 1500);
        speed *= 0.4 + 0.6 * ramp;
        // fatica: dopo 8s a contatto (dist < 200) rallenta del 30% per 3s
        if (dist < 200) {
            if (!this.chaseNearSince) this.chaseNearSince = this.scene.time.now;
            else if (this.scene.time.now - this.chaseNearSince > 8000 && this.scene.time.now >= this.chaseTiredUntil) {
                this.chaseTiredUntil = this.scene.time.now + 3000;
                this.chaseNearSince = 0;
            }
        } else {
            this.chaseNearSince = 0;
        }
        if (this.scene.time.now < this.chaseTiredUntil) speed *= 0.7;
        // gradini: in verticale scende a metà, in salita ancora più piano;
        // sul dislivello grosso (>120px) dimezza anche l'avanzata orizzontale
        let yFactor = 0.55;
        if (dy < 0) yFactor *= 0.65;
        const xFactor = Math.abs(dy) > 120 ? 0.5 : 1;
        chef.x += (dx / dist) * speed * xFactor * (delta / 1000);
        chef.y += (dy / dist) * speed * yFactor * (delta / 1000);
        chef.setFlipX(dx > 0);
        chef.setFrame(Math.floor(this.scene.time.now / 110) % creatureFrames(this.scene, 'boss-lochef'));
        // ondeggia: inquietante ma con stile
        chef.y += Math.sin(this.scene.time.now / 200) * 0.6;

        if (dist < 45) {
            if (this.ctx.player.hurt(1, chef.x)) {
                // il colpo lo rallenta: ti vuole vivo
                chef.x -= Math.sign(dx) * 260;
            }
        }
    }

    /** la casa ti ha sentito nell'armadio: lochef torna in caccia da vicino */
    private onTanaSniffed(): void {
        const chef = this.chaseSprite;
        if (!chef?.active || this.ctx.player.dead || this.ctx.flow.exiting) return;
        const side = chef.x < this.ctx.player.x ? -1 : 1;
        chef.x = this.ctx.player.x + side * 200;
        chef.y = this.ctx.player.y - 30;
        bus.emit('bark', { speaker: 'lochef85', color: 'red', text: 'la casa ti sente.', urgent: true });
    }

}
