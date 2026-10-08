import type Phaser from 'phaser';
import type { OmbraProfile } from '../types';
import type { Boss, HitDir } from '../entities/Boss';
import type { BossVoice } from './BossVoice';
import type { Player } from '../entities/Player';
import { bus } from './events';
import {
    normalizeOmbraAct,
    strongestHabit,
    type OmbraAction,
    type OmbraInsight,
    type PlayerAct,
} from '../rules/ombra';
import { sfx } from './sfx';
import { state } from './state';

/* l'ombra ti ha guardato per tutta la partita e punta una sola abitudine
   per volta, sempre annunciata: chi varia ritmo la lascia senza parole */

export interface OmbraContext {
    scene: Phaser.Scene;
    boss: Boss;
    voice: BossVoice;
    player: Player;
    profile: OmbraProfile;
    onInsight: (insight: OmbraInsight) => void;
}

/** tra un tentativo di lettura e l'altro il giocatore cambia ritmo */
const ADAPT_MS = 1400;
/** la beta ragiona su poche mosse e con più calma */
const BETA_WINDOW = 10;
const PREMIUM_WINDOW = 18;
const PREMIUM_CD = 6500;
const BETA_CD = 9500;
const REPEAT_EXTRA = 2500;
const DIALOG_COOL_MS = 1500;

export class OmbraBrain {
    private scene: Phaser.Scene;
    private boss: Boss;
    private voice: BossVoice;
    private player: Player;
    private profile: OmbraProfile;
    private onInsight: (insight: OmbraInsight) => void;
    private premium: boolean;
    private recent: OmbraAction[] = [];
    private nextAdaptAt: number;
    private lastInsight: OmbraAction | null = null;
    private variedSaid = false;
    private variedThisGuard = false;
    private dialogueCoolUntil = 0;
    private offDialogue: (() => void) | null = null;
    private marks: Phaser.GameObjects.GameObject[] = [];

    constructor(ctx: OmbraContext) {
        this.scene = ctx.scene;
        this.boss = ctx.boss;
        this.voice = ctx.voice;
        this.player = ctx.player;
        this.profile = ctx.profile;
        this.onInsight = ctx.onInsight;
        this.premium = ctx.profile.premium;
        this.nextAdaptAt = ctx.scene.time.now + ADAPT_MS;
        this.offDialogue = bus.on('dialogue-end', () => {
            this.dialogueCoolUntil = this.scene.time.now + DIALOG_COOL_MS;
        });
        // il modello ringrazia chi l'ha nutrito, una volta sola
        if (ctx.profile.sightings > 0) {
            ctx.scene.time.delayedCall(7000, () => {
                if (this.boss.active) this.voice.event('learn-count', false);
            });
        }
    }

    /** la scena inoltra ogni mossa; la finestra corta vive solo qui */
    observeLive(act: PlayerAct): void {
        if (!this.boss.active) return;
        const a = normalizeOmbraAct(act);
        if (a === 'attack-side' || a === 'attack-up' || a === 'attack-down') {
            const g = this.boss.guarding;
            if ((g === 'side' || g === 'up' || g === 'down') && a !== `attack-${g}` && !this.variedThisGuard) {
                this.variedThisGuard = true;
                this.voice.event('vary', false);
            }
        }
        if (!a) return;
        this.recent.push(a);
        const max = this.premium ? PREMIUM_WINDOW : BETA_WINDOW;
        while (this.recent.length > max) this.recent.shift();
    }

    update(_time: number): void {
        const now = this.scene.time.now;
        if (now < this.nextAdaptAt) return;
        this.nextAdaptAt = now + ADAPT_MS;
        if (!this.boss.active || !this.boss.engaged || this.player.dead) return;
        if (now < this.dialogueCoolUntil) return;
        const insight = strongestHabit(this.profile, this.recent, this.premium);
        if (!insight) {
            // chi varia davvero merita una riga: il modello lo ammette
            if (!this.variedSaid && this.profile.total >= 12) {
                this.variedSaid = true;
                this.voice.event('learn-varied');
            }
            return;
        }
        this.counter(insight, now);
    }

    /** una sola contromossa, annunciata prima di partire */
    private counter(insight: OmbraInsight, now: number): void {
        if (!this.boss.active || !this.boss.engaged || this.player.dead) return;
        if (now < this.dialogueCoolUntil) return;
        const a = insight.action;
        const needsStrike = a === 'dash' || a === 'heal-start' || a === 'heal-done' || a === 'wave-analisi';
        if (needsStrike && !this.boss.canStrike()) return;
        if (this.player.invulnerable && needsStrike) return;
        const cd = (this.premium ? PREMIUM_CD : BETA_CD) + (this.lastInsight === a ? REPEAT_EXTRA : 0);
        this.nextAdaptAt = now + cd;
        this.lastInsight = a;
        const dir = a === 'attack-side' ? 'side' : a === 'attack-up' ? 'up' : a === 'attack-down' ? 'down' : null;
        if (dir) {
            this.edge(dir);
            this.after(600, () => {
                if (!this.boss.active) return;
                this.variedThisGuard = false;
                this.boss.guard(dir as HitDir, this.premium ? 3200 : 1900);
            });
        } else if (a === 'dash') {
            this.ghost();
            this.after(550, () => {
                if (this.boss.canStrike() && !this.player.dead && !this.player.invulnerable) {
                    this.boss.strike('teleport', this.player);
                } else {
                    this.nextAdaptAt = this.scene.time.now + ADAPT_MS;
                }
            });
        } else if (a === 'heal-start' || a === 'heal-done') {
            this.reticle();
            this.after(650, () => {
                // il cibo non avvisa: si punisce solo chi è davvero a terra
                if (this.boss.canStrike() && !this.player.dead && !this.player.invulnerable && state.run.hp <= 2) {
                    this.boss.strike('snipe', this.player);
                } else {
                    this.nextAdaptAt = this.scene.time.now + ADAPT_MS;
                }
            });
        } else if (a === 'wave-risonante') {
            this.aimLine();
            this.after(600, () => {
                if (!this.boss.active) return;
                this.variedThisGuard = false;
                this.boss.guard('shot', 2200);
            });
        } else if (a === 'wave-analisi') {
            this.glyphs();
            this.after(450, () => {
                if (this.boss.canStrike() && !this.player.dead && !this.player.invulnerable) {
                    this.boss.strike('teleport', this.player);
                } else {
                    this.nextAdaptAt = this.scene.time.now + ADAPT_MS;
                }
            });
        } else if (a === 'wave-scudo') {
            this.recOff();
            this.after(350, () => {
                // lo scudo resta tuo: l'ombra aspetta invece di spararci dentro
                if (this.boss.active) this.boss.delayAttack(500);
            });
        } else if (a === 'wave-riflesso' || a === 'wave-acquatossica') {
            // clone e pozze non hanno un pattern da forzare: solo un'occhiata
        } else {
            return;
        }
        this.onInsight(insight);
    }

    /** segnale rimandato: se il cervello muore prima, non parte niente */
    private after(ms: number, fn: () => void): void {
        this.scene.time.delayedCall(ms, () => {
            if (!this.boss.active) return;
            fn();
        });
    }

    /** tratto ciano dal lato da cui arrivi: la parata si vede prima */
    private edge(dir: 'side' | 'up' | 'down'): void {
        const g = this.scene.add.graphics().setDepth(7);
        const side = dir === 'side' ? Math.sign(this.player.x - this.boss.x) || 1 : 0;
        const x = this.boss.x + (dir === 'side' ? side * 70 : 0);
        const y = this.boss.y + (dir === 'up' ? -70 : dir === 'down' ? 70 : 0);
        g.lineStyle(3, 0x22d3ee, 0.9);
        if (dir === 'side') g.lineBetween(x, this.boss.y - 50, x, this.boss.y + 50);
        else g.lineBetween(this.boss.x - 50, y, this.boss.x + 50, y);
        this.keep(g, 650);
        sfx.ui();
    }

    /** sagoma verso di te più un bip che sale: tra poco si teletrasporta */
    private ghost(): void {
        const ghost = this.scene.add.image(this.boss.x, this.boss.y, this.boss.texture.key, this.boss.frame.name)
            .setScale(this.boss.scaleX).setAlpha(0.45).setTint(0x22d3ee).setDepth(4);
        this.scene.tweens.add({ targets: ghost, alpha: 0, x: this.player.x, duration: 550 });
        this.keep(ghost, 600);
        sfx.beep(0, 1);
        this.scene.time.delayedCall(160, () => sfx.beep(0, 1));
    }

    /** mirino rosso sopra di te: chi si cura qui lo sa prima */
    private reticle(): void {
        const g = this.scene.add.graphics().setDepth(7);
        g.lineStyle(2, 0xef4444, 0.9);
        g.strokeCircle(this.player.x, this.player.y - 40, 22);
        g.lineBetween(this.player.x - 30, this.player.y - 40, this.player.x + 30, this.player.y - 40);
        this.keep(g, 650);
        sfx.beep(0, 1);
    }

    /** si mette di lato col rumore di un tubo catodico: l'onda la para */
    private aimLine(): void {
        const g = this.scene.add.graphics().setDepth(7);
        g.lineStyle(2, 0x22d3ee, 0.7);
        g.lineBetween(this.boss.x - 90, this.boss.y, this.boss.x + 90, this.boss.y);
        this.keep(g, 600);
        sfx.crt();
    }

    /** tre glifi che si allontanano: l'analisi conviene lanciarla dopo */
    private glyphs(): void {
        for (let i = 0; i < 3; i++) {
            const c = this.scene.add.graphics().setDepth(7);
            c.lineStyle(2, 0x22d3ee, 0.8);
            c.strokeCircle(this.boss.x, this.boss.y, 14 + i * 14);
            this.scene.tweens.add({ targets: c, alpha: 0, duration: 450 });
            this.keep(c, 480);
        }
        sfx.ui();
    }

    /** la lente rec si spegne: per mezzo secondo non attacca */
    private recOff(): void {
        const c = this.scene.add.graphics().setDepth(7);
        c.lineStyle(3, 0x22d3ee, 0.9);
        c.strokeCircle(this.boss.x, this.boss.y - 60, 12);
        this.scene.tweens.add({ targets: c, alpha: 0.15, duration: 350 });
        this.keep(c, 380);
        sfx.ui();
    }

    private keep(obj: Phaser.GameObjects.GameObject, ms: number): void {
        this.marks.push(obj);
        this.scene.time.delayedCall(ms, () => {
            if (obj.active) obj.destroy();
        });
    }

    stop(): void {
        this.offDialogue?.();
        this.offDialogue = null;
        for (const m of this.marks) if (m.active) m.destroy();
        this.marks = [];
        this.recent = [];
    }
}
