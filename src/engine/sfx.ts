import { state } from './state';

/** synth webaudio minimale: nessun asset, tutto generato */
class Sfx {
    private ctx: AudioContext | null = null;
    private master: GainNode | null = null;
    private noiseBuffer: AudioBuffer | null = null;
    private padNodes: { osc: OscillatorNode; gain: GainNode }[] = [];

    /** va chiamato dopo un gesto utente per sbloccare l'audio */
    init(): void {
        if (this.ctx) {
            // già creato: assicurati solo che non sia rimasto sospeso
            this.resume();
            return;
        }
        this.ctx = new AudioContext();
        this.master = this.ctx.createGain();
        this.master.gain.value = state.settings.volume;
        this.master.connect(this.ctx.destination);

        const len = this.ctx.sampleRate;
        this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

        this.resume();
        // il browser sospende il contesto quando la tab va in background:
        // riprenderlo al ritorno evita che i suoni restino accodati e in ritardo
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) this.resume();
        });
    }

    /** riavvia il contesto se sospeso: currentTime congelato = suoni in ritardo */
    resume(): void {
        if (this.ctx && this.ctx.state === 'suspended') {
            void this.ctx.resume();
        }
    }

    setVolume(v: number): void {
        if (this.master) this.master.gain.value = v;
    }

    private tone(
        freq: number,
        durMs: number,
        opts: { type?: OscillatorType; to?: number; vol?: number; delayMs?: number } = {}
    ): void {
        if (!this.ctx || !this.master) return;
        this.resume();
        const t0 = this.ctx.currentTime + (opts.delayMs ?? 0) / 1000;
        const t1 = t0 + durMs / 1000;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = opts.type ?? 'square';
        osc.frequency.setValueAtTime(freq, t0);
        if (opts.to) osc.frequency.exponentialRampToValueAtTime(opts.to, t1);
        gain.gain.setValueAtTime(opts.vol ?? 0.12, t0);
        gain.gain.exponentialRampToValueAtTime(0.0001, t1);
        osc.connect(gain).connect(this.master);
        osc.start(t0);
        osc.stop(t1 + 0.05);
    }

    private noise(durMs: number, opts: { freq?: number; q?: number; vol?: number } = {}): void {
        if (!this.ctx || !this.master || !this.noiseBuffer) return;
        this.resume();
        const t0 = this.ctx.currentTime;
        const t1 = t0 + durMs / 1000;
        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = opts.freq ?? 1800;
        filter.Q.value = opts.q ?? 1;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(opts.vol ?? 0.18, t0);
        gain.gain.exponentialRampToValueAtTime(0.0001, t1);
        src.connect(filter).connect(gain).connect(this.master);
        src.start(t0);
        src.stop(t1 + 0.05);
    }

    jump(): void { this.tone(280, 140, { type: 'square', to: 540, vol: 0.07 }); }
    doubleJump(): void { this.tone(380, 160, { type: 'square', to: 760, vol: 0.07 }); }
    dash(): void { this.noise(160, { freq: 900, q: 0.7, vol: 0.2 }); }
    slash(): void { this.noise(90, { freq: 2600, q: 2, vol: 0.15 }); }
    hit(): void {
        this.noise(110, { freq: 600, q: 1, vol: 0.25 });
        this.tone(140, 110, { type: 'sawtooth', to: 70, vol: 0.1 });
    }
    hurt(): void {
        this.tone(220, 240, { type: 'sawtooth', to: 80, vol: 0.14 });
        this.noise(180, { freq: 400, vol: 0.2 });
    }
    die(): void {
        this.tone(300, 600, { type: 'sawtooth', to: 50, vol: 0.16 });
        this.noise(500, { freq: 250, vol: 0.22 });
    }
    pickup(): void {
        this.tone(660, 90, { type: 'square', vol: 0.06 });
        this.tone(990, 140, { type: 'square', vol: 0.06, delayMs: 70 });
    }
    barra(): void { this.tone(880 + Math.random() * 220, 70, { type: 'triangle', vol: 0.05 }); }
    checkpoint(): void {
        [523, 659, 784, 1046].forEach((f, i) =>
            this.tone(f, 280, { type: 'triangle', vol: 0.07, delayMs: i * 90 })
        );
    }
    heal(): void { this.tone(440, 500, { type: 'sine', to: 880, vol: 0.08 }); }
    unlock(): void {
        [392, 523, 659, 784, 1046].forEach((f, i) =>
            this.tone(f, 320, { type: 'triangle', vol: 0.08, delayMs: i * 80 })
        );
    }
    shoot(): void { this.tone(900, 120, { type: 'square', to: 300, vol: 0.07 }); }
    bossRoar(): void {
        this.tone(80, 900, { type: 'sawtooth', to: 45, vol: 0.2 });
        this.noise(800, { freq: 180, q: 0.6, vol: 0.25 });
    }
    ui(): void { this.tone(520, 60, { type: 'square', vol: 0.04 }); }

    /** drone ambientale per zona, due oscillatori detunati */
    startPad(baseFreq: number): void {
        this.stopPad();
        if (!this.ctx || !this.master) return;
        [baseFreq, baseFreq * 1.5, baseFreq * 2.02].forEach((f, i) => {
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();
            osc.type = 'sine';
            osc.frequency.value = f;
            osc.detune.value = i * 7;
            gain.gain.value = 0;
            gain.gain.linearRampToValueAtTime(0.028 / (i + 1), this.ctx!.currentTime + 2.5);
            osc.connect(gain).connect(this.master!);
            osc.start();
            this.padNodes.push({ osc, gain });
        });
    }

    stopPad(): void {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        this.padNodes.forEach(({ osc, gain }) => {
            gain.gain.linearRampToValueAtTime(0, t + 1);
            osc.stop(t + 1.2);
        });
        this.padNodes = [];
    }
}

export const sfx = new Sfx();
