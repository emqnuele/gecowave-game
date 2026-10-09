import Phaser from 'phaser';
import { TILE } from '../../config';
import { TOASTS, WAVESUNG } from '../../content/story';
import { bus } from '../../core/events';
import { music } from '../../audio/music';
import { haptics } from '../../input/haptics';
import { NucleusStraightening } from '../../story/NucleusStraightening';
import { state } from '../../core/state';
import type { Boss } from '../../entities/Boss';
import type { BossKind } from '../../types';
import { Chapter, type EndingId } from './ChapterScript';
import { rng } from '../../core/rng';

/** il nucleo: pedro chiede una risposta, poi il patto, il giorno 30 o gli dei */
export class NucleoChapter extends Chapter {
    private pattoDeiAt = 0;
    private pattoNextSpawnAt = 0;
    private pedroChoiceShown = false;
    /** pedro spento mentre combatti il suo glitch */
    private pedroShell: Boss | null = null;
    /** l'ordine raddrizza il nucleo solo contro il glitch, mai per patto o dei */
    private nucleusStraightening: NucleusStraightening | null = null;
    // il patto con pedro: potere vero, poi arrivano gli dei
    private pattoActive = false;
    // scontro finale con gli dei dopo aver rifiutato di consegnare le wave:
    // qui la morte è definitiva (game over, niente respawn)
    private finalGodsFight = false;
    private pattoWarned = 0;

    setup(): void {
        if (!state.hasFlag('wavesung-finale')) {
            state.setFlag('wavesung-finale');
            this.scene.time.delayedCall(1200, () => bus.emit('wavesung', WAVESUNG.markolinoFinale));
        }
    }

    updateFoes(time: number): void {
        this.nucleusStraightening?.update(time, this.ctx.bosses.current);
        this.crookedLens(time);
    }

    /** il nucleo è storto e l'ordine lo raddrizza: la camera parte inclinata e si drizza a ogni fase, perdendo colore */
    private crookedLens(time: number): void {
        const phase = this.nucleusStraightening?.straightened;
        const boss = this.ctx.bosses.current;
        if (phase === null || phase === undefined || boss?.def.kind !== 'glitchpedro' || !boss.engaged) {
            this.ctx.lens.release('ordine', 1.5);
            return;
        }
        const crooked = 1 - phase / 3;
        this.ctx.lens.hold('ordine', {
            angle: (0.032 + Math.sin(time / 1300) * 0.006) * crooked,
            desat: 0.14 * phase,
            chroma: 0.25 * crooked,
        }, 1, 0.8);
    }

    update(time: number): void {
        this.updatePatto(time);
    }

    beforeBossEngage(): boolean {
        if (this.pedroChoiceShown) return false;
        this.pedroChoiceShown = true;
        // se hai camminato nei suoi ricordi, pedro lo sa. e gli pesa.
        const incontro = state.hasFlag('ricordi-visti') ? 'pedro-incontro-ricordi' : 'pedro-incontro';
        // chi ha ricomposto il quaderno gli mostra le pagine prima di rispondere
        const prima = (next: () => void) => (state.hasFlag('quaderno-completo') ? this.ctx.dialogues.start(incontro, () => this.ctx.dialogues.start('pedro-quaderno', next)) : this.ctx.dialogues.start(incontro, next));
        prima(() => {
            // chi ha camminato nei ricordi ha una terza strada: la cartella del giorno 30
            const options = [{ label: 'seguilo: stats raddoppiate', danger: true }, { label: 'contrastalo' }];
            if (state.hasFlag('ricordi-visti')) options.push({ label: 'ricordagli il giorno 30' });
            bus.emit('choice-show', {
                title: 'pedro aspetta una risposta.',
                options,
                onPick: (i) => {
                    if (i === 0) this.startPatto();
                    else if (i === 2) this.giorno30();
                    else this.ctx.bosses.current?.engage();
                },
            });
        });
        return true;
    }

    storyFight(): boolean {
        return this.pattoActive || this.finalGodsFight;
    }

    deathEnding(): EndingId | null {
        // il patto finisce come doveva finire: morte definitiva; gli dei sfidati non perdonano
        if (this.pattoActive) return 'pedro';
        if (this.finalGodsFight) return 'sconfitta';
        return null;
    }

    bossDefeated(kind: BossKind, x: number, y: number): void {
        switch (kind) {
            case 'pedro':
                this.ctx.dialogues.start(state.hasFlag('quaderno-completo') ? 'pedro-sconfitto-quaderno' : 'pedro-sconfitto', () => this.sceltaFinale(x, y, false));
                break;
            case 'glitchpedro': {
                // il glitch si strappa via: pedro torna in sé
                const shell = this.pedroShell;
                this.nucleusStraightening?.shatter();
                // l'ordine va in pezzi: lo storto torna di colpo, e resta
                this.ctx.lens.glitch(700, 0.9);
                this.ctx.lens.kick({ angle: -0.05, barrel: 0.18 }, 30, 250, 1600);
                haptics.rumble(1, 0.6, 600);
                if (shell?.scene) this.scene.tweens.add({ targets: shell, alpha: 1, duration: 900 });
                state.setFlag('pedro-redento');
                this.ctx.dialogues.start('pedro-redento', () => this.sceltaFinale(x, y, true));
                break;
            }
            case 'dei':
                this.scene.time.delayedCall(800, () => {
                    this.ctx.flow.endGame('dei');
                });
                break;
        }
    }

    private startPatto(): void {
        const pedro = this.ctx.bosses.current;
        this.ctx.bosses.current = null;
        // il patto chiude lo scontro: barra via, voce zitta, niente code
        bus.emit('boss-hp', null);
        this.ctx.bosses.silence();
        bus.emit('bark-clear', {});
        state.run.patto = true;
        state.run.hp = state.maxHp;
        state.run.flow = state.maxFlow;
        bus.emit('hp-changed', { hp: state.run.hp, maxHp: state.maxHp, hurt: false });
        bus.emit('flow-changed', { flow: state.run.flow, maxFlow: state.maxFlow });
        if (pedro) {
            // pedro ha quello che voleva: si dissolve in glitch
            const glitch = this.scene.add.particles(pedro.x, pedro.y, 'p-spark', {
                speed: { min: 100, max: 300 },
                scale: { start: 1.2, end: 0 },
                tint: 0x22d3ee,
                lifespan: 500,
                quantity: 24,
                stopAfter: 24,
            });
            this.scene.time.delayedCall(900, () => glitch.destroy());
            this.scene.tweens.add({ targets: pedro, alpha: 0, duration: 600, onComplete: () => pedro.destroy() });
        }
        this.ctx.dialogues.start('pedro-patto', () => {
            bus.emit('toast', { text: TOASTS.patto });
            this.pattoActive = true;
            this.pattoDeiAt = this.scene.time.now + 20000;
            this.pattoNextSpawnAt = this.scene.time.now + 2500;
            this.pattoWarned = 0;
        });
    }

    private updatePatto(time: number): void {
        if (!this.pattoActive || this.ctx.player.dead || this.ctx.bosses.current) return;
        // ondate di glitch per assaporare il potere rubato
        if (time >= this.pattoNextSpawnAt && this.ctx.enemies.awakeEnemies() < 7) {
            this.pattoNextSpawnAt = time + 3500;
            const dir = rng.logic.next() > 0.5 ? 1 : -1;
            const at = this.ctx.world.openSpotNear(this.ctx.player.x + dir * 420, this.ctx.player.y - 60, 10);
            const e = this.ctx.enemies.spawnEnemy('glitchetto', at.x, at.y, { hunting: true });
            this.scene.physics.add.collider(e, this.ctx.world.level.layer);
        }
        const left = this.pattoDeiAt - time;
        if (left <= 12000 && this.pattoWarned < 1) {
            this.pattoWarned = 1;
            bus.emit('toast', { text: TOASTS.pattoAvviso1 });
        }
        if (left <= 6000 && this.pattoWarned < 2) {
            this.pattoWarned = 2;
            this.scene.cameras.main.flash(150, 255, 255, 255);
            this.ctx.feel.shake(400, 0.005);
            bus.emit('toast', { text: TOASTS.pattoAvviso2 });
        }
        if (left <= 0) this.arrivoDei();
    }

    /** piema e lametta, insieme, immortali, senza pause: non si vince */
    private arrivoDei(): void {
        this.ctx.dialogues.start('dei-patto', () => {
            const x = this.ctx.player.x + 280;
            const y = Math.max(120, this.ctx.player.y - 160);
            this.ctx.bosses.current = this.ctx.bosses.make(x, y, 'dei');
            this.ctx.bosses.current.invulnerable = true;
            this.ctx.bosses.current.frenzy = true;
            this.ctx.bosses.light(this.ctx.bosses.current, 0xffffff, 340, 1.2);
            this.ctx.combat.setupBossColliders();
            this.ctx.bosses.current.engage();
            this.scene.cameras.main.flash(220, 255, 255, 255);
            this.ctx.feel.shake(700, 0.012);
            this.ctx.lens.kick({ chroma: 1.6, barrel: 0.16, desat: -0.4 }, 60, 500, 1800);
            this.ctx.lens.shockwave(x, y, 1.4, 1200);
            haptics.rumble(1, 1, 700);
        });
    }

    /** il finale vero comincia qui: con le verità del void pedro si ferma e il nemico diventa l'ordine */
    private giorno30(): void {
        this.ctx.dialogues.start('pedro-giorno30', () => {
            if (!state.hasFlag('void-concluso')) {
                this.ctx.dialogues.start('pedro-giorno30-vuoto', () => this.ctx.bosses.current?.engage());
                return;
            }
            this.ctx.dialogues.start('pedro-verita', () => {
                const pedro = this.ctx.bosses.current;
                if (!pedro) return;
                const { x, y } = pedro;
                this.ctx.bosses.current = null;
                // pedro esce di scena spento: lo scontro con lui finisce qui
                bus.emit('boss-hp', null);
                this.ctx.bosses.silence();
                bus.emit('bark-clear', {});
                const boom = this.scene.add.particles(x, y, 'p-spark', { speed: { min: 80, max: 260 }, scale: { start: 1.2, end: 0 }, tint: [0x22d3ee, 0xf87171], lifespan: 600, quantity: 30, stopAfter: 30 });
                this.scene.time.delayedCall(1000, () => boom.destroy());
                this.scene.tweens.add({ targets: pedro, alpha: 0.35, duration: 500 });
                // pedro resta lì, spento, mentre il glitch esce da lui
                pedro.engaged = false;
                pedro.setActive(false);
                (pedro.body as Phaser.Physics.Arcade.Body).enable = false;
                this.pedroShell = pedro;
                this.ctx.bosses.current = this.ctx.bosses.make(x + 160, y - 60, 'glitchpedro');
                this.ctx.bosses.introShown = false;
                this.ctx.bosses.light(this.ctx.bosses.current, this.ctx.bosses.current.def.glowColor, 300, 1.1);
                this.ctx.combat.setupBossColliders();
                this.startOrder();
                this.ctx.feel.shake(500, 0.012);
            });
        });
    }

    /** l'ordine raddrizza il nucleo solo contro il glitch, mai per patto o dei */
    private startOrder(): void {
        const boss = this.ctx.bosses.current;
        if (!boss || this.ctx.world.def.id !== 'nucleo' || !this.ctx.world.layout || !this.ctx.marks33) return;
        const room = this.ctx.world.roomAt(boss.x, boss.y);
        // nel ramo giorno 30 pedro non si è mai ingaggiato: l'arena si chiude
        // da sola dopo l'intro, qui basta che il glitch stia in una stanza arena
        if (!room || room.kind !== 'arena') {
            if (import.meta.env.DEV) console.warn('[ordine] niente arena valida, combattimento invariato');
            return;
        }
        const R = room.rect;
        this.nucleusStraightening?.destroy();
        this.nucleusStraightening = new NucleusStraightening({
            scene: this.scene,
            player: this.ctx.player,
            terrain: this.ctx.terrain,
            marks: this.ctx.marks33,
            fakeWalls: this.ctx.world.level.fakeWalls,
            arenaBounds: new Phaser.Geom.Rectangle(R.x * TILE, R.y * TILE, R.w * TILE, R.h * TILE),
            arenaDoorRects: this.ctx.world.doorRects(room),
            solid: (c, r) => this.ctx.world.nav.solid(c, r),
            music,
            emitOrderShot: (x, y, tx, ty) => this.ctx.combat.onEnemyShoot({ x, y, tx, ty, color: 0xf87171, speed: 360, size: 1 }),
        });
    }

    /** le wave dopo il finale vero: agli dei, a te, o a pedro */
    private sceltaFinale(x: number, y: number, redento: boolean): void {
        const after = () => {
            const options = [{ label: 'consegna le wave agli dei' }, { label: 'tienitele. sfida gli dei.', danger: true }];
            if (redento) options.push({ label: 'affidale a pedro, quello del giorno 30' });
            bus.emit('choice-show', {
                title: 'le wave tornano a chi le ha create?',
                options,
                onPick: (i) => {
                    if (i === 0) {
                        this.ctx.flow.endGame('consegna');
                    } else if (i === 2) {
                        this.ctx.flow.endGame('riscatto');
                    } else {
                        this.ctx.dialogues.start('dei-rifiuto', () => {
                            this.finalGodsFight = true;
                            this.ctx.bosses.current = this.ctx.bosses.make(x, y - 40, 'dei');
                            this.ctx.bosses.light(this.ctx.bosses.current, 0xffffff, 320, 1.1);
                            this.ctx.combat.setupBossColliders();
                            this.ctx.bosses.current.engage();
                        });
                    }
                },
            });
        };
        if (!redento) {
            this.ctx.dialogues.start('dei-incontro', after);
            return;
        }
        this.ctx.dialogues.start('dei-processo', () => {
            if (state.hasFlag('caso-risolto') && state.hasFlag('pensiero-cancellato')) {
                // la riga originale l'hai cancellata tu: piema resta libero
                this.ctx.dialogues.start('dei-processo-romero-solo', () => {
                    state.setFlag('lametta-arrestato');
                    this.ctx.dialogues.start('dei-scelta-wave', after);
                });
            } else if (state.hasFlag('caso-risolto')) {
                this.ctx.dialogues.start('dei-processo-romero', () => {
                    state.setFlag('dei-arrestati');
                    this.ctx.dialogues.start('dei-scelta-wave', after);
                });
            } else {
                this.ctx.dialogues.start('dei-scelta-wave', after);
            }
        });
    }


    destroy(): void {
        this.nucleusStraightening?.destroy();
        this.nucleusStraightening = null;
    }
}
