import Phaser from 'phaser';
import { WAVESUNG } from '../../content/story';
import { bus } from '../../engine/events';
import { state } from '../../engine/state';
import type { BossKind } from '../../types';
import { Chapter, type ChapterCtx, type Target } from './ChapterScript';
import { WalkingGuide } from './shared/WalkingGuide';

/* l'ordine dei rimpianti nel void: due di lametta, poi tre di piema */
const VOID_REGRETS: BossKind[] = ['notturno', 'modello', 'revisore', 'delegato', 'garante'];

/** il void: romero ti guida tra i rimpianti, uno scontro per ogni verità */
export class VoidChapter extends Chapter {
    private voidArenas: { x: number; y: number }[] = [];
    private voidStep = 0;
    private voidBusy = false;
    private readonly guide: WalkingGuide;

    constructor(ctx: ChapterCtx) {
        super(ctx);
        this.guide = new WalkingGuide(ctx);
    }

    marker(id: string, x: number, y: number): boolean {
        // marker invisibili delle arene del void: una per ogni rimpianto
        if (id.startsWith('arena-')) {
            this.voidArenas.push({ x, y });
            this.voidArenas.sort((a, b) => this.ctx.world.progressAt(a.x, a.y) - this.ctx.world.progressAt(b.x, b.y));
            return true;
        }
        // romero che ti fa da guida tra i rimpianti: cammina piano accanto a te e si parla
        if (id === 'romero-guida') {
            const guide = this.ctx.npcs.castSprite(x, y + 4, 'npc-romero').setDepth(4);
            this.ctx.lighting.follow(guide, 0x60a5fa, 170, 0.8);
            this.guide.sprite = guide;
            this.guide.baseY = y + 4;
            this.guide.entry = { x, y, range: 48, onInteract: () => this.interactGuida() };
            this.ctx.interactions.add(this.guide.entry);
            return true;
        }
        // l'altare del 33: sfida opt-in al miniboss più potente del void
        if (id === 'sfida-33') {
            if (state.hasFlag('boss-down-trentatre')) return true;
            const altar = this.scene.add.sprite(x, y, 'lore-tablet').setDepth(4).setPipeline('Light2D');
            altar.setScale(1.3).setTint(0xfde047);
            this.ctx.lighting.follow(altar, 0xfacc15, 200, 0.95);
            this.scene.tweens.add({ targets: altar, y: y - 5, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            this.ctx.interactions.add({ x, y, range: 70, onInteract: () => this.interactSfida33(altar) });
            return true;
        }
        return false;
    }

    setup(): void {
        this.setupVoid();
    }

    update(time: number, delta: number): void {
        this.updateVoid(time, delta);
    }

    objective(): Target | undefined {
        if (state.hasFlag('void-concluso')) return undefined;
        const a = this.voidArenas[Math.min(this.voidStep, this.voidArenas.length - 1)];
        if (a) return { ...a, label: 'il prossimo rimpianto' };
        return undefined;
    }

    exitLock(): string | null {
        return state.hasFlag('void-concluso') ? null : 'romero non ha finito. i rimpianti vanno guardati fino in fondo.';
    }

    bossDefeated(kind: BossKind, _x: number, _y: number): void {
        switch (kind) {
            case 'trentatre':
                this.ctx.dialogues.start('trentatre-sconfitto', () => {
                    state.save.barre += 333;
                    bus.emit('barre-changed', { barre: state.save.barre, gained: true });
                    bus.emit('toast', { text: '✦ hai battuto il 33. +333 barre. il numero ti rispetta, ora ✦' });
                    state.persist();
                    // rievoco il rimpianto accantonato, così la sequenza riprende
                    if (!state.hasFlag('void-concluso') && this.voidStep < VOID_REGRETS.length) {
                        this.scene.time.delayedCall(900, () => this.spawnRegret(this.voidStep));
                    }
                });
                break;
            case 'delegato':
            case 'notturno':
            case 'modello':
            case 'revisore':
            case 'garante':
                this.onVeritaRivelata(VOID_REGRETS.indexOf(kind));
                break;
        }
    }

    /** il primo rimpianto ancora in piedi: con l'ordine cambiato, contare non basta */
    private nextRegret(): number {
        const i = VOID_REGRETS.findIndex((k) => !state.hasFlag(`boss-down-${k}`));
        return i < 0 ? VOID_REGRETS.length : i;
    }

    private setupVoid(): void {
        this.voidStep = this.nextRegret();
        // riallineo romero alla verità a cui siamo arrivati
        if (this.guide.sprite) {
            const here = this.voidArenas[Math.min(this.voidStep, this.voidArenas.length - 1)];
            if (here) this.guide.sprite.setPosition(here.x - 90, this.guide.baseY);
        }
        if (this.voidStep >= VOID_REGRETS.length) {
            // tutto già visto: il void è solo un corridoio verso il nucleo
            if (this.guide.sprite && this.voidArenas.length) {
                const last = this.voidArenas[this.voidArenas.length - 1];
                this.guide.sprite.setPosition(last.x + 60, this.guide.baseY);
            }
            // se sei uscito prima della chiusura, la riproponiamo così l'uscita si apre
            if (!state.hasFlag('void-concluso')) {
                this.scene.time.delayedCall(1200, () => this.voidClimax());
            }
            return;
        }
        if (!state.hasFlag('wavesung-void')) {
            state.setFlag('wavesung-void');
            this.scene.time.delayedCall(2200, () => bus.emit('wavesung', WAVESUNG.markolinoVoid));
        }
        this.spawnRegret(this.voidStep);
    }

    /** materializza il rimpianto di turno nella sua arena */
    private spawnRegret(idx: number): void {
        const arena = this.voidArenas[idx];
        if (!arena) return;
        const kind = VOID_REGRETS[idx];
        this.ctx.bosses.current = this.ctx.bosses.make(arena.x, arena.y - 20, kind);
        this.ctx.bosses.introShown = false;
        this.ctx.bosses.light(this.ctx.bosses.current, this.ctx.bosses.current.def.glowColor, 260, 1.0);
        this.ctx.combat.setupBossColliders();
    }

    /** un rimpianto è caduto: si rivela la verità e romero ti porta al prossimo */
    private onVeritaRivelata(idx: number): void {
        this.ctx.dialogues.start(`verita-${idx + 1}`, () => {
            const next = this.nextRegret();
            this.voidStep = next;
            if (next >= VOID_REGRETS.length) {
                this.voidClimax();
                return;
            }
            // romero non teletrasporta: cammina col player verso la prossima arena (updateVoid)
            this.scene.time.delayedCall(900, () => this.spawnRegret(next));
        });
    }

    /** romero cammina piano, resta accanto al player e si ferma se lo perde */
    private updateVoid(time: number, delta: number): void {
        const c = this.guide.sprite;
        if (!c) return;

        // obiettivo: il punto a sinistra dell'arena di turno (o oltre l'ultima, a fine void)
        let objX: number;
        if (this.voidStep < this.voidArenas.length) {
            objX = this.voidArenas[this.voidStep].x - 70;
        } else {
            const lastArena = this.voidArenas[this.voidArenas.length - 1];
            objX = (lastArena?.x ?? this.ctx.player.x) + 80;
        }

        this.guide.move(c, objX, time, delta);
    }

    /** parlare con romero lungo il cammino: commento contestuale alla verità di turno */
    private interactGuida(): void {
        if (state.hasFlag('void-concluso')) {
            this.ctx.dialogues.start('romero-guida-fine');
            return;
        }
        const n = Math.min(this.voidStep + 1, VOID_REGRETS.length);
        this.ctx.dialogues.start(`romero-guida-${n}`);
    }

    /** l'altare del 33: evocabile in qualsiasi momento, anche coi rimpianti vivi.
        il rimpianto in corso viene accantonato e rievocato dopo la sfida. */
    private interactSfida33(altar: Phaser.GameObjects.Sprite): void {
        this.ctx.dialogues.start('trentatre-altare', () => {
            bus.emit('choice-show', {
                title: 'il 33 pulsa nell\'altare. lo evochi? è molto più forte di te.',
                options: [{ label: 'evoca il 33', danger: true }, { label: 'non ancora' }],
                onPick: (i) => {
                    if (i !== 0) return;
                    // accantono il rimpianto in corso: tornerà fresco dopo il 33
                    if (this.ctx.bosses.current?.active && VOID_REGRETS.includes(this.ctx.bosses.current.def.kind)) {
                        this.ctx.bosses.current.destroy();
                        bus.emit('boss-hp', null);
                    }
                    altar.destroy();
                    this.ctx.bosses.current = this.ctx.bosses.make(altar.x, altar.y - 30, 'trentatre');
                    this.ctx.bosses.current.chase = true;
                    this.ctx.bosses.introShown = false;
                    this.ctx.bosses.light(this.ctx.bosses.current, this.ctx.bosses.current.def.glowColor, 320, 1.1);
                    this.ctx.combat.setupBossColliders();
                },
            });
        });
    }

    /** l'ultima verità: pedro sta eseguendo l'ordine ORA. arriva markolino. */
    private voidClimax(): void {
        if (this.voidBusy) return;
        this.voidBusy = true;
        this.ctx.dialogues.start('void-svolta', () => {
            // markolino piomba di corsa da destra
            const mx = this.ctx.player.x + 520;
            const mk = this.ctx.npcs.castSprite(mx, this.ctx.player.y, 'npc-markolino').setDepth(5);
            this.ctx.lighting.follow(mk, 0x4ade80, 200, 0.9);
            mk.setFlipX(true);
            bus.emit('wavesung', WAVESUNG.markolinoPedroMuove);
            this.scene.tweens.add({
                targets: mk,
                x: this.ctx.player.x + 90,
                duration: 1100,
                ease: 'Quad.easeOut',
                onComplete: () => {
                    this.ctx.dialogues.start('markolino-avviso-pedro', () => {
                        this.ctx.dialogues.start('void-addio-romero', () => {
                            state.setFlag('void-concluso');
                            bus.emit('toast', { text: 'pianti romero e corri verso il nucleo.' });
                        });
                    });
                },
            });
        });
    }

}
