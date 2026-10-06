import type Phaser from 'phaser';
import type { Bark, BarkSet, BarkTrigger } from '../content/barks';
import { bus } from './events';
import type { PlayerAct } from './OmbraProfile';
import { sfx } from './sfx';

/* la voce di un boss durante lo scontro: decide quando parlare, così le
   battute restano un segnale e non diventano rumore di fondo */

const GAP_MS = 3200;
const HIT_COOLDOWN_MS = 6000;
const HEAL_COOLDOWN_MS = 9000;

export class BossVoice {
    private scene: Phaser.Scene;
    private set: BarkSet;
    private variant: string;
    private texture: string | null;
    private lastAt = -99999;
    private hitAt = -99999;
    private healAt = -99999;
    private nextIdleAt: number;
    private saidLow = false;
    private last = new Map<string, number>();
    private offs: (() => void)[] = [];
    private active = true;

    /** variant: suffisso delle battute alternative (es. "-quaderno"), se il boss le ha */
    constructor(scene: Phaser.Scene, set: BarkSet, opts: { variant?: string; texture?: string } = {}) {
        this.scene = scene;
        this.set = set;
        this.variant = opts.variant ?? '';
        this.texture = opts.texture ?? null;
        this.nextIdleAt = scene.time.now + 9000 + Math.random() * 5000;
        this.offs.push(bus.on('hp-changed', ({ hp, hurt }) => {
            if (!hurt || !this.active) return;
            if (hp === 1 && !this.saidLow) {
                this.saidLow = true;
                this.say('low', true);
                return;
            }
            const now = this.scene.time.now;
            if (now - this.hitAt < HIT_COOLDOWN_MS || Math.random() > 0.45) return;
            this.hitAt = now;
            this.say('hit');
        }));
        const onAct = ({ act }: PlayerAct) => {
            if (act !== 'heal' || !this.active) return;
            const now = this.scene.time.now;
            if (now - this.healAt < HEAL_COOLDOWN_MS || Math.random() > 0.7) return;
            this.healAt = now;
            this.say('heal');
        };
        scene.events.on('player-act', onAct);
        this.offs.push(() => scene.events.off('player-act', onAct));
    }

    /** battuta per un momento standard; urgent scavalca la pausa tra una battuta e l'altra */
    say(trigger: BarkTrigger, urgent = false): boolean {
        const pool = this.set.extra?.[`${trigger}${this.variant}`] ?? this.set.lines[trigger];
        return this.speak(trigger, pool, urgent);
    }

    /** battuta per un momento proprio del boss (le gocce di lametta, le abitudini dell'ombra) */
    event(key: string, urgent = true): boolean {
        return this.speak(key, this.set.extra?.[key], urgent);
    }

    update(): void {
        if (!this.active) return;
        const now = this.scene.time.now;
        if (now < this.nextIdleAt) return;
        this.nextIdleAt = now + 11000 + Math.random() * 6000;
        this.say('idle');
    }

    private speak(key: string, pool: Bark[] | undefined, urgent: boolean): boolean {
        if (!this.active || !pool?.length) return false;
        const now = this.scene.time.now;
        if (!urgent && now - this.lastAt < GAP_MS) return false;
        // mai la stessa riga due volte di fila
        let i = Math.floor(Math.random() * pool.length);
        if (pool.length > 1 && i === this.last.get(key)) i = (i + 1) % pool.length;
        this.last.set(key, i);
        this.lastAt = now;
        // chi parla da solo rimanda il prossimo borbottio
        this.nextIdleAt = Math.max(this.nextIdleAt, now + 7000);
        const line = pool[i]!;
        if (typeof line === 'string') {
            if (this.texture) sfx.bossVoice(this.texture);
            bus.emit('bark', { speaker: this.set.by, color: this.set.color, text: line, glitch: this.set.glitch, urgent });
        } else {
            bus.emit('bark', { speaker: line.by, color: line.color, text: line.text, glitch: line.glitch, urgent });
        }
        return true;
    }

    stop(): void {
        if (!this.active) return;
        this.active = false;
        this.offs.forEach((off) => off());
        this.offs = [];
    }
}
