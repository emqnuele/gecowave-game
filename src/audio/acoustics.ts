/* il suono prende la forma del posto: un solo AudioContext per musica ed
   effetti, con un passa-basso (ovattato sotto terra, di notte, in acqua),
   un riverbero a convoluzione con risposte all'impulso generate per tipo
   di spazio e un'eco con la coda che si scurisce. tutto si muove piano
   verso il bersaglio, mai a scatti */

export type Space =
    | 'open' | 'street' | 'cave' | 'cavern' | 'sewer' | 'metal' | 'crystal'
    | 'void' | 'library' | 'room' | 'arena' | 'water';

interface SpacePreset {
    /** coda del riverbero in secondi (fino a -60 dB) */
    decay: number;
    /** frequenza a cui la coda si spegne: basso = pietra bagnata, alto = vetro */
    damp: number;
    /** ritardo prima della coda */
    pre: number;
    /** riflessioni ravvicinate: pareti vicine */
    early: number;
    musicWet: number;
    sfxWet: number;
    echoTime: number;
    echoFb: number;
    echoWet: number;
    echoDamp: number;
}

export const SPACES: Record<Space, SpacePreset> = {
    open: { decay: 0.5, damp: 6000, pre: 0.01, early: 0, musicWet: 0.0, sfxWet: 0.06, echoTime: 0.25, echoFb: 0, echoWet: 0, echoDamp: 3000 },
    street: { decay: 0.9, damp: 5000, pre: 0.02, early: 4, musicWet: 0.04, sfxWet: 0.14, echoTime: 0.14, echoFb: 0.12, echoWet: 0.1, echoDamp: 3500 },
    cave: { decay: 1.9, damp: 2600, pre: 0.025, early: 6, musicWet: 0.22, sfxWet: 0.36, echoTime: 0.32, echoFb: 0.3, echoWet: 0.18, echoDamp: 1900 },
    cavern: { decay: 3.8, damp: 2000, pre: 0.05, early: 5, musicWet: 0.3, sfxWet: 0.46, echoTime: 0.56, echoFb: 0.42, echoWet: 0.26, echoDamp: 1500 },
    sewer: { decay: 2.4, damp: 3200, pre: 0.02, early: 9, musicWet: 0.26, sfxWet: 0.42, echoTime: 0.19, echoFb: 0.45, echoWet: 0.2, echoDamp: 2600 },
    metal: { decay: 2.2, damp: 5200, pre: 0.015, early: 10, musicWet: 0.2, sfxWet: 0.4, echoTime: 0.12, echoFb: 0.5, echoWet: 0.16, echoDamp: 4200 },
    crystal: { decay: 4.2, damp: 8000, pre: 0.03, early: 4, musicWet: 0.3, sfxWet: 0.45, echoTime: 0.42, echoFb: 0.38, echoWet: 0.2, echoDamp: 6000 },
    void: { decay: 6.5, damp: 3000, pre: 0.08, early: 0, musicWet: 0.4, sfxWet: 0.55, echoTime: 0.74, echoFb: 0.55, echoWet: 0.3, echoDamp: 1800 },
    library: { decay: 1.6, damp: 3800, pre: 0.02, early: 6, musicWet: 0.16, sfxWet: 0.26, echoTime: 0.22, echoFb: 0.1, echoWet: 0.05, echoDamp: 3000 },
    room: { decay: 0.8, damp: 4200, pre: 0.008, early: 8, musicWet: 0.1, sfxWet: 0.22, echoTime: 0.09, echoFb: 0.15, echoWet: 0.05, echoDamp: 3000 },
    arena: { decay: 2.6, damp: 3400, pre: 0.035, early: 6, musicWet: 0.14, sfxWet: 0.34, echoTime: 0.38, echoFb: 0.28, echoWet: 0.14, echoDamp: 2200 },
    water: { decay: 1.4, damp: 700, pre: 0.01, early: 3, musicWet: 0.3, sfxWet: 0.5, echoTime: 0.11, echoFb: 0.35, echoWet: 0.2, echoDamp: 600 },
};

export interface AcousticTarget {
    space: Space;
    /** 0..1: quanto lo spazio è grande, scala bagnato ed eco */
    size: number;
    /** 0..1: musica ovattata per la roccia sopra la testa */
    muffle: number;
    /** 0..1: notte fonda */
    night: number;
    /** testa sott'acqua */
    underwater: boolean;
    /** boss in corso: la musica resta piena e asciutta */
    boss: boolean;
    /** 0..1: vita agli sgoccioli, il mondo si stringe */
    danger: number;
    /** 0..3: l'ordine raddrizza il nucleo, il suono perde aria */
    order: number;
    /** coda dell'eco del bioma: la tana rimbomba più del dovuto */
    echoMul: number;
}

const DEFAULT: AcousticTarget = { space: 'open', size: 0.5, muffle: 0, night: 0, underwater: false, boss: false, danger: 0, order: 0, echoMul: 1 };

class Acoustics {
    private ctx: AudioContext | null = null;
    /** ingresso della musica (le tracce html passano di qui) */
    musicIn: GainNode | null = null;
    /** ingresso degli effetti */
    sfxIn: GainNode | null = null;
    private musicLP!: BiquadFilterNode;
    private sfxLP!: BiquadFilterNode;
    private musicDuck!: GainNode;
    private musicRevSend!: GainNode;
    private sfxRevSend!: GainNode;
    private musicEchoSend!: GainNode;
    private sfxEchoSend!: GainNode;
    private rev: { conv: ConvolverNode; gain: GainNode; space: Space | null }[] = [];
    private active = 0;
    private echoDelay!: DelayNode;
    private echoFb!: GainNode;
    private echoLP!: BiquadFilterNode;
    private echoOut!: GainNode;
    private irCache = new Map<Space, AudioBuffer>();
    private target: AcousticTarget = { ...DEFAULT };
    private applied: Space | null = null;
    private paused = false;
    private duck = 1;
    private failed = false;

    /** il contesto condiviso; null se il browser non ha webaudio */
    context(): AudioContext | null {
        if (this.ctx || this.failed) return this.ctx;
        try {
            this.ctx = new AudioContext();
            this.build(this.ctx);
            const wake = () => {
                void this.ctx?.resume();
                if (this.ctx?.state === 'running') {
                    window.removeEventListener('click', wake);
                    window.removeEventListener('keydown', wake);
                }
            };
            window.addEventListener('click', wake);
            window.addEventListener('keydown', wake);
        } catch {
            this.failed = true;
            this.ctx = null;
        }
        return this.ctx;
    }

    resume(): void {
        if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume();
    }

    private build(ctx: AudioContext): void {
        // compressore finale: riverbero ed eco sommati non devono mai saturare
        const comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -14;
        comp.knee.value = 12;
        comp.ratio.value = 3;
        comp.attack.value = 0.008;
        comp.release.value = 0.25;
        comp.connect(ctx.destination);

        this.musicIn = ctx.createGain();
        this.musicLP = ctx.createBiquadFilter();
        this.musicLP.type = 'lowpass';
        this.musicLP.Q.value = 0.5;
        this.musicLP.frequency.value = 20000;
        this.musicDuck = ctx.createGain();
        this.musicIn.connect(this.musicLP).connect(this.musicDuck).connect(comp);

        this.sfxIn = ctx.createGain();
        this.sfxLP = ctx.createBiquadFilter();
        this.sfxLP.type = 'lowpass';
        this.sfxLP.Q.value = 0.4;
        this.sfxLP.frequency.value = 20000;
        this.sfxIn.connect(this.sfxLP).connect(comp);

        // riverbero: due convolutori, si passa dall'uno all'altro in dissolvenza
        for (let i = 0; i < 2; i++) {
            const conv = ctx.createConvolver();
            const gain = ctx.createGain();
            gain.gain.value = 0;
            conv.connect(gain).connect(comp);
            this.rev.push({ conv, gain, space: null });
        }
        this.musicRevSend = ctx.createGain();
        this.sfxRevSend = ctx.createGain();
        this.musicRevSend.gain.value = 0;
        this.sfxRevSend.gain.value = 0;
        this.musicDuck.connect(this.musicRevSend);
        this.sfxLP.connect(this.sfxRevSend);
        for (const r of this.rev) {
            this.musicRevSend.connect(r.conv);
            this.sfxRevSend.connect(r.conv);
        }

        // eco: ritardo con la coda che perde gli alti a ogni giro
        this.echoDelay = ctx.createDelay(1.5);
        this.echoFb = ctx.createGain();
        this.echoLP = ctx.createBiquadFilter();
        this.echoLP.type = 'lowpass';
        this.echoOut = ctx.createGain();
        this.echoFb.gain.value = 0;
        this.echoOut.gain.value = 1;
        this.echoDelay.connect(this.echoLP).connect(this.echoFb).connect(this.echoDelay);
        this.echoLP.connect(this.echoOut).connect(comp);
        // un filo d'eco finisce anche nel riverbero: le ripetizioni non suonano incollate
        const echoToRev = ctx.createGain();
        echoToRev.gain.value = 0.35;
        this.echoLP.connect(echoToRev);
        for (const r of this.rev) echoToRev.connect(r.conv);
        this.musicEchoSend = ctx.createGain();
        this.sfxEchoSend = ctx.createGain();
        this.musicEchoSend.gain.value = 0;
        this.sfxEchoSend.gain.value = 0;
        this.musicDuck.connect(this.musicEchoSend).connect(this.echoDelay);
        this.sfxLP.connect(this.sfxEchoSend).connect(this.echoDelay);
        this.apply(true);
    }

    /** risposta all'impulso sintetica: riflessioni vicine più una coda di rumore che si scurisce */
    private impulse(space: Space): AudioBuffer {
        const cached = this.irCache.get(space);
        if (cached) return cached;
        const ctx = this.ctx!;
        const p = SPACES[space];
        const sr = ctx.sampleRate;
        const len = Math.max(1, Math.floor((p.pre + p.decay) * sr));
        const buf = ctx.createBuffer(2, len, sr);
        let seed = space.length * 977 + 13;
        const rnd = () => {
            seed = (seed * 16807) % 2147483647;
            return seed / 2147483647;
        };
        for (let ch = 0; ch < 2; ch++) {
            const d = buf.getChannelData(ch);
            const pre = Math.floor(p.pre * sr);
            let lp = 0;
            for (let i = pre; i < len; i++) {
                const t = (i - pre) / sr;
                const env = Math.exp((-6.9 * t) / p.decay);
                // il filtro si chiude col tempo: la coda perde gli alti come nella roccia
                const cutoff = p.damp * (1 - 0.7 * Math.min(1, t / p.decay)) + 120;
                const a = Math.exp((-2 * Math.PI * cutoff) / sr);
                lp = a * lp + (1 - a) * (rnd() * 2 - 1);
                d[i] = lp * env * (0.6 + 0.4 * Math.min(1, t * 30));
            }
            // riflessioni ravvicinate, diverse per canale: larghezza stereo
            for (let k = 0; k < p.early; k++) {
                const t = 0.004 + rnd() * 0.07;
                const i = pre + Math.floor(t * sr);
                if (i < len) d[i] += (rnd() < 0.5 ? -1 : 1) * (0.7 - k * 0.04);
            }
            let peak = 0;
            for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(d[i]));
            if (peak > 0) for (let i = 0; i < len; i++) d[i] /= peak;
        }
        this.irCache.set(space, buf);
        return buf;
    }

    set(t: Partial<AcousticTarget>): void {
        Object.assign(this.target, t);
        this.apply(false);
    }

    /** telefono o pausa: la musica arriva come da un'altra stanza */
    setPaused(p: boolean): void {
        if (p === this.paused) return;
        this.paused = p;
        this.apply(false);
    }

    /** dialoghi: la musica si fa da parte */
    setDuck(v: number): void {
        this.duck = v;
        if (this.ctx && this.musicDuck) this.musicDuck.gain.setTargetAtTime(v, this.ctx.currentTime, 0.4);
    }

    private apply(instant: boolean): void {
        const ctx = this.ctx;
        if (!ctx || !this.musicIn) return;
        const now = ctx.currentTime;
        const tau = instant ? 0.01 : 0.6;
        const T = this.target;
        const space: Space = T.underwater ? 'water' : T.space;
        const p = SPACES[space];

        // passa-basso della musica: vince il più chiuso tra notte, roccia, acqua, pausa
        const night = 20000 * Math.pow(1600 / 20000, T.night);
        const rock = 20000 * Math.pow(650 / 20000, Math.min(1, T.muffle * (T.boss ? 0.35 : 1)));
        const water = T.underwater ? 420 : 20000;
        const pause = this.paused ? 800 : 20000;
        const danger = 20000 * Math.pow(2400 / 20000, T.danger * 0.8);
        const order = Math.max(0, Math.min(3, T.order));
        const orderCut = order >= 3 ? 2800 : order === 2 ? 4500 : order === 1 ? 8000 : 20000;
        const music = Math.min(night, rock, water, pause, danger, orderCut);
        this.musicLP.frequency.setTargetAtTime(music, now, tau);
        const sfxCut = T.underwater ? 900 : T.muffle > 0.5 ? 11000 : 20000;
        this.sfxLP.frequency.setTargetAtTime(sfxCut, now, tau);

        // il riverbero cambia solo quando cambia lo spazio: dissolvenza tra i convolutori
        if (space !== this.applied) {
            this.applied = space;
            const next = this.rev[1 - this.active];
            if (next.space !== space) {
                next.conv.buffer = this.impulse(space);
                next.space = space;
            }
            next.gain.gain.setTargetAtTime(1, now, instant ? 0.01 : 0.8);
            this.rev[this.active].gain.gain.setTargetAtTime(0, now, instant ? 0.01 : 0.8);
            this.active = 1 - this.active;
        }
        const size = 0.55 + 0.9 * T.size;
        // l'ordine asciuga un filo anche l'ambiente, oltre a chiudere il passa-basso
        const musicWet = p.musicWet * size * (T.boss ? 0.45 : 1) * (this.paused ? 0.5 : 1) * (1 - 0.07 * Math.max(0, Math.min(3, T.order)));
        this.musicRevSend.gain.setTargetAtTime(musicWet, now, tau);
        this.sfxRevSend.gain.setTargetAtTime(Math.min(0.9, p.sfxWet * size + T.danger * 0.1), now, tau);
        // eco: più lunga e più ripetuta negli spazi grandi (e nella tana, sempre)
        const echoMul = T.echoMul ?? 1;
        this.echoDelay.delayTime.setTargetAtTime(p.echoTime * (0.8 + 0.4 * T.size), now, instant ? 0.01 : 1.2);
        this.echoFb.gain.setTargetAtTime(Math.min(0.7, p.echoFb * (0.8 + 0.4 * T.size) * echoMul), now, tau);
        this.echoLP.frequency.setTargetAtTime(p.echoDamp, now, tau);
        this.musicEchoSend.gain.setTargetAtTime(p.echoWet * 0.55 * size * (T.boss ? 0.3 : 1) * echoMul, now, tau);
        this.sfxEchoSend.gain.setTargetAtTime(Math.min(0.9, p.echoWet * size * echoMul), now, tau);
        this.musicDuck.gain.setTargetAtTime(this.duck, now, tau);
    }

    /** un respiro del posto: il riverbero si gonfia e il filtro della musica affonda, poi torna */
    swell(ms = 1600, depth = 1): void {
        const ctx = this.ctx;
        if (!ctx || !this.musicIn) return;
        const now = ctx.currentTime;
        const p = SPACES[this.applied ?? 'open'];
        const wet = Math.max(0.35, p.sfxWet) * (1 + depth);
        this.musicRevSend.gain.cancelScheduledValues(now);
        this.musicRevSend.gain.setTargetAtTime(Math.min(1.2, wet), now, 0.08);
        this.musicLP.frequency.cancelScheduledValues(now);
        this.musicLP.frequency.setTargetAtTime(500 + 1500 * (1 - depth * 0.6), now, 0.1);
        window.setTimeout(() => this.apply(false), ms);
    }

    /** di nuovo all'aperto: menu, titoli, cambio di capitolo */
    reset(): void {
        this.target = { ...DEFAULT };
        this.paused = false;
        this.duck = 1;
        this.apply(false);
    }

    get current(): Readonly<AcousticTarget> {
        return this.target;
    }
}

export const acoustics = new Acoustics();
