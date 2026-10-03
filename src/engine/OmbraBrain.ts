import type Phaser from 'phaser';
import type { Boss, HitDir } from '../entities/Boss';
import type { BossVoice } from './BossVoice';
import { state } from './state';

/* l'ombra è addestrata sul tuo footage: guarda cosa fai durante lo scontro
   e ti punisce quando diventi prevedibile. chi ripete la stessa mossa trova
   la parata, chi si cura sempre all'ultimo si prende il colpo mentre si cura.
   con l'abbonamento impara in fretta, senza è una beta che ci mette di più */

interface Act {
    act: string;
    dir?: HitDir;
}

export class OmbraBrain {
    private scene: Phaser.Scene;
    private boss: Boss;
    private voice: BossVoice;
    private player: Phaser.GameObjects.Sprite;
    private strong: boolean;
    private streakDir: HitDir | null = null;
    private streak = 0;
    private variedThisGuard = false;
    private dashes: number[] = [];
    private dashSaidAt = -99999;
    private healLateSaid = false;
    private punishAt = -99999;
    private onAct = (a: Act) => this.observe(a);

    constructor(scene: Phaser.Scene, boss: Boss, voice: BossVoice, player: Phaser.GameObjects.Sprite) {
        this.scene = scene;
        this.boss = boss;
        this.voice = voice;
        this.player = player;
        this.strong = state.hasFlag('tommasorveglianza');
        scene.events.on('player-act', this.onAct);
        // ogni telecamera che ti ha visto nel centro dati ha nutrito il modello
        if (state.run.ombraDati > 0) scene.time.delayedCall(7000, () => this.boss.active && this.voice.event('learn-count', false));
    }

    private get threshold(): number {
        // ogni avvistamento delle telecamere accorcia la pazienza del modello
        const base = this.strong ? 4 : 7;
        return Math.max(3, base - Math.floor(state.run.ombraDati / 2));
    }

    private observe({ act, dir }: Act): void {
        if (!this.boss.active || !this.boss.engaged) return;
        const now = this.scene.time.now;
        if (act === 'attack' && dir) {
            const guarding = this.boss.guarding;
            if (guarding && dir !== guarding && !this.variedThisGuard) {
                this.variedThisGuard = true;
                this.voice.event('vary', false);
            }
            if (dir === this.streakDir) this.streak++;
            else {
                this.streakDir = dir;
                this.streak = 1;
            }
            if (this.streak >= this.threshold && !guarding) {
                this.streak = 0;
                this.variedThisGuard = false;
                this.boss.guard(dir, this.strong ? 4200 : 2600);
                this.voice.event(`spam-${dir}`);
            }
            return;
        }
        if (act === 'dash') {
            this.dashes = this.dashes.filter((t) => now - t < 6000);
            this.dashes.push(now);
            if (this.dashes.length >= 4 && now - this.dashSaidAt > 20000) {
                this.dashSaidAt = now;
                this.voice.event('dash');
                // la versione completa scivola con te e ti ricompare addosso
                if (this.strong) this.boss.strike('teleport', this.player);
            }
            return;
        }
        if (act === 'heal-start') {
            if (state.run.hp <= 1 && !this.healLateSaid) {
                this.healLateSaid = true;
                this.voice.event('heal-late');
            }
            if (this.strong && state.run.hp <= 2 && now - this.punishAt > 8000) {
                this.punishAt = now;
                if (this.boss.strike('snipe', this.player)) this.voice.event('heal-punish', false);
            }
        }
    }

    stop(): void {
        this.scene.events.off('player-act', this.onAct);
    }
}
