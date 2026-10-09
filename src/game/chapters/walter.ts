import Phaser from 'phaser';
import { bus } from '../../core/events';
import { state } from '../../core/state';
import type { BossKind } from '../../types';
import { Chapter, type ChapterCtx, type Target } from './ChapterScript';
import { WalkingGuide } from './shared/WalkingGuide';

/* la quest di walter baruffoni: sequenza di boss per capitolo.
   l'ultimo di marcetti è walter stesso, rivelato e ingrandito. */
const BARUFFONI_SEQ: Record<string, BossKind[]> = {
    galliate: ['maranza', 'maranzone'],
    marcetti: ['istruttore', 'annascrivania', 'walter'],
};

/** galliate e marcetti: arene in fila, walter ti accompagna e alla fine si rivela */
export class WalterChapter extends Chapter {
    private baruffoniArenas: { x: number; y: number }[] = [];
    private baruffoniStep = 0;
    private baruffoniBusy = false;
    private readonly guide: WalkingGuide;

    constructor(ctx: ChapterCtx) {
        super(ctx);
        this.guide = new WalkingGuide(ctx);
    }

    marker(id: string, x: number, y: number): boolean {
        // marker invisibili delle arene della quest di walter
        if (id.startsWith('warena-')) {
            this.baruffoniArenas.push({ x, y });
            this.baruffoniArenas.sort((a, b) => this.ctx.world.progressAt(a.x, a.y) - this.ctx.world.progressAt(b.x, b.y));
            return true;
        }
        // walter ti accompagna come faceva romero: cammina piano e si parla
        if (id === 'walter-guida') {
            const guide = this.ctx.npcs.castSprite(x, y + 4, 'npc-walter').setDepth(4);
            this.ctx.lighting.follow(guide, 0x86efac, 160, 0.8);
            this.guide.sprite = guide;
            this.guide.baseY = y + 4;
            this.guide.entry = { x, y, range: 48, onInteract: () => this.interactWalterGuida() };
            this.ctx.interactions.add(this.guide.entry);
            return true;
        }
        return false;
    }

    /** i capitoli di walter riusano il fondale del trenbolone ma cupo e malato */
    dressStage(): void {
        const cam = this.scene.cameras.main;
        const tint = this.ctx.world.def.script === 'galliate' ? 0x150406 : 0x1a1206;
        const veil = this.scene.add.rectangle(0, 0, cam.width, cam.height, tint, 0.42)
            .setOrigin(0, 0).setScrollFactor(0).setDepth(3);
        const fitVeil = (): void => {
            veil.setSize(cam.width, cam.height);
        };
        this.scene.scale.on('resize', fitVeil);
        this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scene.scale.off('resize', fitVeil));
    }

    setup(): void {
        this.setupBaruffoni();
    }

    update(time: number, delta: number): void {
        this.updateBaruffoni(time, delta);
    }

    objective(): Target | undefined {
        if (this.baruffoniStep >= this.baruffoniSeq().length) return undefined;
        const a = this.baruffoniArenas[this.baruffoniStep];
        if (a) return { ...a, label: 'la prossima arena' };
        return undefined;
    }

    exitLock(): string | null {
        if (this.ctx.world.def.id !== 'galliate' || state.hasFlag('boss-down-maranzone')) return null;
        return 'walter sbadiglia: "aspetta... prima questi maranza. galliate non si attraversa così."';
    }

    bossDefeated(kind: BossKind, x: number, y: number): void {
        switch (kind) {
            case 'maranza':
            case 'maranzone':
            case 'istruttore':
            case 'annascrivania':
                this.onBaruffoniDown(kind);
                break;
            case 'walter':
                this.ctx.dialogues.start('walter-morte', () => {
                    this.ctx.rewards.spawnCuore(x, y + 40, 'cuore-walter', true);
                    bus.emit('toast', { text: 'walter, spirando: "...comprate verisure. il primo mese è scontato."' });
                    this.ctx.flow.returnFromSecret(5000);
                });
                break;
        }
    }

    /** la sequenza di boss di questo capitolo (vuota fuori dalla quest) */
    private baruffoniSeq(): BossKind[] {
        return BARUFFONI_SEQ[this.ctx.world.def.id] ?? [];
    }

    private setupBaruffoni(): void {
        const seq = this.baruffoniSeq();
        if (seq.length === 0) return;
        this.baruffoniStep = seq.filter((k) => state.hasFlag(`boss-down-${k}`)).length;
        // riallineo walter all'arena di turno
        if (this.guide.sprite) {
            const here = this.baruffoniArenas[Math.min(this.baruffoniStep, this.baruffoniArenas.length - 1)];
            if (here) this.guide.sprite.setPosition(here.x - 90, this.guide.baseY);
        }
        if (this.baruffoniStep >= seq.length) {
            // capitolo già concluso: walter resta in fondo, l'uscita è libera
            if (this.guide.sprite && this.baruffoniArenas.length) {
                const last = this.baruffoniArenas[this.baruffoniArenas.length - 1];
                this.guide.sprite.setPosition(last.x + 60, this.guide.baseY);
            }
            return;
        }
        this.spawnBaruffoniBoss(this.baruffoniStep);
    }

    /** materializza il boss di turno nella sua arena (l'ultimo di marcetti è walter) */
    private spawnBaruffoniBoss(idx: number): void {
        const seq = this.baruffoniSeq();
        const kind = seq[idx];
        const arena = this.baruffoniArenas[idx];
        if (!kind || !arena) return;
        if (kind === 'walter') {
            this.walterReveal(arena);
            return;
        }
        this.ctx.bosses.current = this.ctx.bosses.make(arena.x, arena.y - 20, kind);
        this.ctx.bosses.introShown = false;
        this.ctx.bosses.light(this.ctx.bosses.current, this.ctx.bosses.current.def.glowColor, 260, 1.0);
        this.ctx.combat.setupBossColliders();
    }

    /** un boss della quest è caduto: walter commenta e fa avanzare la sequenza */
    private onBaruffoniDown(kind: BossKind): void {
        const seq = this.baruffoniSeq();
        const idx = seq.indexOf(kind);
        if (idx < 0) return;
        this.baruffoniStep = idx + 1;
        const last = idx >= seq.length - 1;
        this.ctx.dialogues.start(`${this.ctx.world.def.id}-verita-${idx + 1}`, () => {
            if (last) {
                this.onBaruffoniComplete();
                return;
            }
            this.scene.time.delayedCall(900, () => this.spawnBaruffoniBoss(idx + 1));
        });
    }

    /** galliate: ultimo maranza giù → strada libera verso le autoscuole */
    private onBaruffoniComplete(): void {
        if (this.ctx.world.def.id !== 'galliate') return;
        bus.emit('toast', { text: 'la strada per le autoscuole marcetti è libera. walter sorride.' });
    }

    /** walter smette di sonnacchiare: si rivela boss finale e si ingrandisce */
    private walterReveal(arena: { x: number; y: number }): void {
        if (this.baruffoniBusy) return;
        this.baruffoniBusy = true;
        this.ctx.dialogues.start('walter-rivelazione', () => {
            // l'npc che ti seguiva sparisce: ora è il boss
            if (this.guide.entry) {
                this.ctx.interactions.remove(this.guide.entry);
                this.guide.entry = null;
            }
            const cx = this.guide.sprite?.x ?? arena.x;
            this.guide.sprite?.destroy();
            this.guide.sprite = null;
            const wy = arena.y - 30;
            const boss = this.ctx.bosses.make(cx, wy, 'walter');
            const full = boss.baseScale * 1.1;
            boss.baseScale = full * 0.3;
            this.ctx.bosses.current = boss;
            this.ctx.bosses.introShown = true; // l'ingaggio lo faccio io dopo la crescita
            this.ctx.bosses.light(boss, boss.def.glowColor, 320, 1.1);
            this.ctx.combat.setupBossColliders();
            this.scene.cameras.main.shake(600, 0.01);
            this.scene.cameras.main.flash(300, 22, 163, 74);
            this.scene.tweens.add({
                targets: boss,
                baseScale: full,
                duration: 1500,
                ease: 'Back.easeOut',
                onComplete: () => boss.active && boss.engage(),
            });
        });
    }

    /** walter cammina piano accanto al player, come faceva romero nel void */
    private updateBaruffoni(time: number, delta: number): void {
        const c = this.guide.sprite;
        if (!c) return;
        let objX: number;
        if (this.baruffoniStep < this.baruffoniArenas.length) {
            objX = this.baruffoniArenas[this.baruffoniStep].x - 70;
        } else {
            const lastArena = this.baruffoniArenas[this.baruffoniArenas.length - 1];
            objX = (lastArena?.x ?? this.ctx.player.x) + 80;
        }
        this.guide.move(c, objX, time, delta);
    }

    /** parlare con walter lungo il cammino: commento contestuale e strano */
    private interactWalterGuida(): void {
        const seq = this.baruffoniSeq();
        const n = Math.min(this.baruffoniStep + 1, seq.length);
        this.ctx.dialogues.start(`${this.ctx.world.def.id}-walter-${n}`);
    }

}
