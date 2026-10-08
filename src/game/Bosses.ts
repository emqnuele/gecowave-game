import Phaser from 'phaser';
import { TILE } from '../config';
import { barksFor } from '../content/barks';
import { TOASTS } from '../content/story';
import { unlockAchievement } from '../engine/achievements';
import { BossVoice } from '../engine/BossVoice';
import { bus } from '../engine/events';
import { OmbraBrain } from '../engine/OmbraBrain';
import type { OmbraInsight, PlayerAct } from '../rules/ombra';
import { sfx } from '../engine/sfx';
import { state } from '../engine/state';
import { Boss } from '../entities/Boss';
import type { AbilityId, BossKind } from '../types';
import type { GameContext, GameSystem } from './context';

type BossesCtx = Pick<GameContext, 'simulates' | 'scene' | 'world' | 'player' | 'lighting' | 'rewards' | 'dialogues' | 'chapter' | 'doomsday' | 'flow'>;

const BOSS_INTRO: Partial<Record<BossKind, string>> = {
    guggu: 'guggu-intro',
    breccio: 'breccio-intro',
    notino: 'notino-intro',
    riba: 'riba-intro',
    lochef: 'lochef-intro',
    ombra: 'ombra-intro',
    ticummi: 'ticummi-intro',
    formicona: 'formicona-intro',
    teorema: 'teorema-intro',
    furgone: 'furgone-intro',
    danjilo: 'danjilo-intro',
    smela: 'smela-boss',
    limite: 'limite-intro',
    pedrino: 'pedrino-intro',
    flauto: 'flauto-intro',
    settequaranta: 'settequaranta-intro',
    custode: 'custode-intro',
    delegato: 'delegato-intro',
    notturno: 'notturno-intro',
    modello: 'modello-intro',
    revisore: 'revisore-intro',
    garante: 'garante-intro',
    trentatre: 'trentatre-intro',
    maranza: 'maranza-intro',
    maranzone: 'maranzone-intro',
    istruttore: 'istruttore-intro',
    annascrivania: 'annascrivania-intro',
    walter: 'walter-boss-intro',
    glitchpedro: 'glitchpedro-intro',
};

/** il boss in scena: uno alla volta, e la trama lo sostituisce (rimpianti, walter, glitch, dei) */
export class Bosses implements GameSystem {
    current: Boss | null = null;
    /** l'intro si mostra una volta per boss, poi si ingaggia e basta */
    introShown = false;
    /** lo scontro col boss in corso: se ti colpisce niente "intoccabile" */
    fight: { hit: boolean; hp: number } | null = null;
    /** chi parla durante lo scontro (anche lametta, che non è un boss) */
    voice: BossVoice | null = null;
    /** l'ombra che ti studia */
    private ombraBrain: OmbraBrain | null = null;
    // il primo custode attacca sul beat: metronomo interno a 120 bpm
    private readonly beatMs = 500;
    private nextBeatAt = 0;
    private readonly ctx: BossesCtx;
    private readonly scene: Phaser.Scene;

    constructor(ctx: BossesCtx) {
        this.ctx = ctx;
        this.scene = ctx.scene;
    }

    /** voci e ombra vanno avanti solo fuori dai film */
    updateVoices(time: number): void {
        this.voice?.update();
        this.ombraBrain?.update(time);
    }

    /** ogni mossa del geco nutre anche la finestra live dell'ombra */
    observe(act: PlayerAct): void {
        this.ombraBrain?.observeLive(act);
    }

    onPhase(phase: number): void {
        this.voice?.say(phase === 2 ? 'phase2' : 'phase3', true);
    }

    /** tiene il conto dei colpi presi nello scontro: il collasso del doomsday non conta */
    trackFight(collapse: boolean): void {
        const boss = this.current;
        if (boss?.active && boss.engaged && boss.def.guardsExit !== false && !collapse && !this.fight) {
            this.fight = { hit: false, hp: state.run.hp };
        }
        if (this.fight) {
            if (state.run.hp < this.fight.hp) this.fight.hit = true;
            this.fight.hp = state.run.hp;
        }
    }

    /** se sei morto tra la vittoria e la ricompensa, la ricompensa ti aspetta */
    recoverReward(kind: BossKind, x: number, y: number): void {
        const fragmentByBoss: Partial<Record<BossKind, AbilityId>> = {
            guggu: 'rimbalzo',
            breccio: 'riflesso',
            notino: 'risonante',
            ombra: 'scudo',
            teorema: 'analisi',
            smela: 'acquatossica',
            formicona: 'aggrappo',
        };
        const ability = fragmentByBoss[kind];
        if (ability && !state.hasAbility(ability)) this.ctx.rewards.spawnFragment(x, y + 50, ability, true);
        this.ctx.rewards.dropBossCharm(kind, x, y);
        if (kind === 'riba' && !state.hasFlag('dispositivo')) state.setFlag('dispositivo');
        if (kind === 'lochef') this.ctx.rewards.spawnCuore(x, y + 50, 'cuore-lochef', true);
        if (kind === 'formicona') this.ctx.rewards.spawnCuore(x, y + 50, 'cuore-formicona', true);
        if (kind === 'settequaranta') this.ctx.rewards.spawnCuore(x, y + 50, 'cuore-barrato', true);
        if (kind === 'custode') this.ctx.rewards.spawnCuore(x, y + 50, 'cuore-custode', true);
        if (kind === 'limite') {
            state.setFlag('caso-risolto');
            this.ctx.rewards.spawnCuore(x, y + 50, 'cuore-limite', true);
        }
        if (kind === 'furgone' || kind === 'smela') state.setFlag('stabilimento-chiuso');
        if (kind === 'pedrino') state.setFlag('ricordi-visti');
    }

    /** la luce del boss sta un po' sopra la testa: le normal map lo modellano dall'alto */
    light(boss: Boss, color: number, radius: number, intensity: number): Phaser.GameObjects.Light {
        const h = (boss.body as Phaser.Physics.Arcade.Body).height;
        return this.ctx.lighting.follow(boss, color, radius + h * 0.5, intensity, -h * 0.75, -h * 0.25);
    }

    /** un boss nasce sospeso sopra il pavimento più vicino, con la testa sotto il soffitto */
    make(x: number, y: number, kind: BossKind, hpOverride?: number): Boss {
        const boss = new Boss(this.scene, x, y, kind, hpOverride);
        const c = Math.floor(x / TILE);
        let r = Math.floor(y / TILE);
        while (r < this.ctx.world.level.heightPx / TILE - 1 && !this.ctx.world.nav.solid(c, r + 1)) r++;
        const floor = (r + 1) * TILE;
        let top = r;
        while (top > 0 && !this.ctx.world.nav.solid(c, top - 1) && floor - top * TILE < 600) top--;
        const ceil = top * TILE;
        const half = (boss.body as Phaser.Physics.Arcade.Body).height / 2 / (boss.def.bodyScale ?? 0.75);
        let by = floor - half - 70;
        if (by - half < ceil + 16) by = (floor + ceil) / 2;
        boss.relocate(x, by);
        return boss;
    }

    updateRhythm(time: number): void {
        if (this.ctx.world.def.script !== 'custode' || !this.current?.active || !this.current.engaged) return;
        if (time < this.nextBeatAt) return;
        this.nextBeatAt = time + this.beatMs;
        // lampo sul beat: il boss imposta la scala ogni frame, quindi pulsiamo col tint
        const b = this.current;
        b.setTintFill(0xfde047);
        this.scene.time.delayedCall(90, () => b.active && b.clearTint());
        sfx.ui();
    }

    /** il boss entra in scena: da qui parla, e se è l'ombra comincia a studiarti */
    onEngaged(boss: Boss): void {
        this.silence();
        const set = barksFor(boss.def.kind);
        if (!set) return;
        const kind = boss.def.kind;
        const variant = kind === 'pedro' && state.hasFlag('quaderno-completo') ? '-quaderno' : '';
        this.voice = new BossVoice(this.scene, set, { variant, texture: boss.def.texture });
        if (kind === 'ombra' && !state.hasFlag('tommasorveglianza')) this.voice.event('engage-beta');
        else if (kind === 'ticummi' && state.hasFlag('tommasorveglianza')) this.voice.event('engage-cliente');
        else this.voice.say('engage', true);
        if (kind === 'ombra') {
            const voice = this.voice;
            if (!voice) return;
            // la difficoltà è osservazione, non vita: un ritocco, mai una spugna
            const premium = state.save.ombra.premium;
            boss.empower(1 + Math.min(premium ? 0.12 : 0.03, state.save.ombra.sightings * 0.015));
            this.ombraBrain = new OmbraBrain({
                scene: this.scene,
                boss,
                voice,
                player: this.ctx.player,
                profile: state.save.ombra,
                onInsight: (insight) => this.onOmbraInsight(insight),
            });
        }
    }

    /** l'ombra ha letto una mossa: etichetta, una riga, chip hud. niente numeri */
    private onOmbraInsight(insight: OmbraInsight): void {
        const boss = this.current;
        if (!boss?.active || !this.voice) return;
        const label = `ha letto: ${insight.label}`;
        const txt = this.scene.add.text(boss.x, boss.y - 100, label, {
            fontFamily: '"Martian Mono", monospace',
            fontSize: '12px',
            color: '#22d3ee',
            backgroundColor: 'rgba(0,0,0,0.55)',
        }).setOrigin(0.5).setDepth(9);
        this.scene.tweens.add({ targets: txt, alpha: 0, y: boss.y - 118, duration: 1200, onComplete: () => txt.destroy() });
        const a = insight.action;
        let bark: string | null = null;
        if (a === 'attack-side') bark = 'spam-side';
        else if (a === 'attack-up') bark = 'spam-up';
        else if (a === 'attack-down') bark = 'spam-down';
        else if (a === 'dash') bark = 'learn-dash';
        else if (a === 'heal-start' || a === 'heal-done') bark = 'learn-heal';
        else if (a === 'wave-risonante' || a === 'wave-analisi') bark = 'learn-shot';
        else if ((a === 'wave-riflesso' || a === 'wave-acquatossica') && Math.random() < 0.3) bark = 'learn-shot';
        if (bark) this.voice.event(bark);
        bus.emit('ombra-read', { label });
    }

    silence(): void {
        this.voice?.stop();
        this.voice = null;
        this.ombraBrain?.stop();
        this.ombraBrain = null;
    }


    updateTrigger(): void {
        if (!this.ctx.simulates) return;
        if (!this.current || this.current.engaged || this.ctx.player.dead || this.ctx.flow.exiting) return;
        const dist = Math.abs(this.ctx.player.x - this.current.x);
        const near = dist < 440 && Math.abs(this.ctx.player.y - this.current.y) < 380;
        // nelle regioni il boss si sveglia quando entri nella sua stanza, non attraverso la roccia
        const bossRoom = this.ctx.world.roomAt(this.current.x, this.current.y);
        if (bossRoom) {
            const inside = this.ctx.world.roomAt(this.ctx.player.x, this.ctx.player.y) === bossRoom;
            if (!inside && !(near && this.ctx.world.nav.sight(this.ctx.player.x, this.ctx.player.y - 10, this.current.x, this.current.y))) return;
        } else if (!near) {
            return;
        }
        // la formicona sta nella tana: non si sveglia se cammini sul soffitto
        if (this.current.def.kind === 'formicona' && this.ctx.player.y < this.current.y - 60) return;

        if (this.ctx.chapter.beforeBossEngage?.()) return;

        let introId = BOSS_INTRO[this.current.def.kind];
        // choose flauto dialogue depending on drug state
        if (this.current.def.kind === 'flauto') {
            introId = state.run.trenbolone ? 'flauto-fatto-rabbia' : 'flauto-sveglio-rabbia';
        }
        if (this.current.def.kind === 'ombra' && !state.hasFlag('tommasorveglianza')) introId = 'ombra-intro-scarsa';
        // il pensiero sepolto: il garante sa cosa ne hai fatto
        if (this.current.def.kind === 'garante' && state.hasFlag('pensiero-cancellato')) introId = 'garante-cancellato';
        if (this.current.def.kind === 'garante' && state.hasFlag('pensiero-portato')) introId = 'garante-prova';
        if (this.current.def.kind === 'ticummi' && state.hasFlag('tommasorveglianza')) introId = 'ticummi-intro-cliente';
        if (introId && !this.introShown) {
            this.introShown = true;
            const boss = this.current;
            if (!state.save.seenDialogues.includes(introId)) {
                state.save.seenDialogues.push(introId);
                state.persist();
                this.ctx.dialogues.start(introId, () => boss?.engage());
            } else {
                boss.engage();
            }
            if (boss.def.kind === 'guggu' && boss.invulnerable) {
                this.scene.time.delayedCall(600, () => {
                    if (boss.active && boss.invulnerable) bus.emit('toast', { text: TOASTS.gugguDoor });
                });
            }
        } else if (!introId) {
            this.current.engage();
        }
    }

    onDefeated({ kind, x, y }: { kind: BossKind; x: number; y: number }): void {
        this.current = null;
        this.silence();
        bus.emit('bark-clear', {});
        // pedro del doomsday: respinto, non è il pedro della trama. niente finale.
        if (kind === 'pedro' && this.ctx.doomsday.repel()) return;
        if (this.fight && !this.fight.hit) {
            unlockAchievement('intoccabile');
            if (state.save.chapterRun) state.save.chapterRun.noHitBosses++;
        }
        this.fight = null;
        if (kind !== 'pedro' && kind !== 'dei') {
            state.setFlag(`boss-down-${kind}`);
            state.save.record.bosses++;
            this.ctx.rewards.dropBossCharm(kind, x, y);
        }
        const waveBosses: BossKind[] = ['guggu', 'breccio', 'notino', 'smela', 'teorema', 'ombra'];
        if (waveBosses.includes(kind) && state.save.doomsdayMode) {
            state.relieveDoomsday();
            bus.emit('toast', { text: '✦ frammento di wave recuperato! doomsday allontanato ✦' });
        }
        this.ctx.chapter.bossDefeated?.(kind, x, y);
    }


    destroy(): void {}
}
