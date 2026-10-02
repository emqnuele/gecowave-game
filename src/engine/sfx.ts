import { state } from './state';
import { acoustics } from './audio/acoustics';

/** di cosa è fatto il pavimento sotto i piedi: decide il suono dei passi */
export type StepMaterial = 'stone' | 'concrete' | 'metal' | 'crystal' | 'mud' | 'roots' | 'brick' | 'circuit' | 'void' | 'water';

/** letti sonori continui: si mescolano a livelli diversi per ogni posto */
export type Bed = 'wind' | 'cave' | 'hum' | 'water' | 'void' | 'crystal' | 'city' | 'fire' | 'servers' | 'rain-roof';

interface ToneOpts {
    type?: OscillatorType;
    to?: number;
    vol?: number;
    delayMs?: number;
    /** -1 sinistra, 1 destra */
    pan?: number;
    attackMs?: number;
}

interface NoiseOpts {
    freq?: number;
    q?: number;
    vol?: number;
    delayMs?: number;
    pan?: number;
    type?: BiquadFilterType;
    /** il filtro scivola verso questa frequenza */
    to?: number;
    attackMs?: number;
}

/** taratura misurata: a livello 1 ogni letto sta attorno a 0.008 rms, sotto la pioggia e vicino alla musica */
const BED_TRIM: Record<Bed, number> = {
    wind: 0.22, cave: 0.11, hum: 0.2, servers: 0.85, water: 0.22, void: 0.4, crystal: 0.3, city: 0.13, fire: 0.2, 'rain-roof': 2,
};

interface BedNodes {
    gain: GainNode;
    stop: () => void;
}

/** synth webaudio: nessun asset, tutto generato, tutto passa per l'acustica del posto */
class Sfx {
    private ctx: AudioContext | null = null;
    private master: GainNode | null = null;
    private noiseBuffer: AudioBuffer | null = null;
    private brownBuffer: AudioBuffer | null = null;
    private rain: { src: AudioBufferSourceNode; gain: GainNode } | null = null;
    private padNodes: { osc: OscillatorNode; gain: GainNode }[] = [];
    private beds = new Map<Bed, BedNodes>();

    /** va chiamato dopo un gesto utente per sbloccare l'audio */
    init(): void {
        if (this.ctx) {
            // già creato: assicurati solo che non sia rimasto sospeso
            this.resume();
            return;
        }
        const ctx = acoustics.context();
        if (!ctx || !acoustics.sfxIn) return;
        this.ctx = ctx;
        this.master = ctx.createGain();
        this.master.gain.value = state.settings.volume;
        this.master.connect(acoustics.sfxIn);

        const len = ctx.sampleRate * 2;
        this.noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
        // rumore marrone: il fondo dei letti (vento, roccia, acqua) senza fruscio aspro
        this.brownBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
        const b = this.brownBuffer.getChannelData(0);
        let last = 0;
        for (let i = 0; i < len; i++) {
            last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
            b[i] = last * 3.5;
        }

        this.resume();
        // il browser sospende il contesto quando la tab va in background:
        // riprenderlo al ritorno evita che i suoni restino accodati e in ritardo
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) this.resume();
        });
    }

    /** riavvia il contesto se sospeso: currentTime congelato = suoni in ritardo */
    resume(): void {
        acoustics.resume();
    }

    setVolume(v: number): void {
        if (this.master) this.master.gain.value = v;
    }

    private out(pan = 0): AudioNode | null {
        if (!this.ctx || !this.master) return null;
        if (!pan) return this.master;
        const p = this.ctx.createStereoPanner();
        p.pan.value = Math.max(-1, Math.min(1, pan));
        p.connect(this.master);
        return p;
    }

    private tone(freq: number, durMs: number, opts: ToneOpts = {}): void {
        const dest = this.out(opts.pan);
        if (!this.ctx || !dest) return;
        this.resume();
        const t0 = this.ctx.currentTime + (opts.delayMs ?? 0) / 1000;
        const t1 = t0 + durMs / 1000;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = opts.type ?? 'square';
        osc.frequency.setValueAtTime(freq, t0);
        if (opts.to) osc.frequency.exponentialRampToValueAtTime(opts.to, t1);
        const vol = opts.vol ?? 0.12;
        if (opts.attackMs) {
            gain.gain.setValueAtTime(0.0001, t0);
            gain.gain.exponentialRampToValueAtTime(vol, t0 + opts.attackMs / 1000);
        } else {
            gain.gain.setValueAtTime(vol, t0);
        }
        gain.gain.exponentialRampToValueAtTime(0.0001, t1);
        osc.connect(gain).connect(dest);
        osc.start(t0);
        osc.stop(t1 + 0.05);
    }

    private noise(durMs: number, opts: NoiseOpts = {}): void {
        const dest = this.out(opts.pan);
        if (!this.ctx || !dest || !this.noiseBuffer) return;
        this.resume();
        const t0 = this.ctx.currentTime + (opts.delayMs ?? 0) / 1000;
        const t1 = t0 + durMs / 1000;
        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        // ogni colpo parte da un punto diverso del buffer: niente fruscio identico
        const offset = Math.random() * 1.5;
        const filter = this.ctx.createBiquadFilter();
        filter.type = opts.type ?? 'bandpass';
        filter.frequency.setValueAtTime(opts.freq ?? 1800, t0);
        if (opts.to) filter.frequency.exponentialRampToValueAtTime(opts.to, t1);
        filter.Q.value = opts.q ?? 1;
        const gain = this.ctx.createGain();
        const vol = opts.vol ?? 0.18;
        if (opts.attackMs) {
            gain.gain.setValueAtTime(0.0001, t0);
            gain.gain.exponentialRampToValueAtTime(vol, t0 + opts.attackMs / 1000);
        } else {
            gain.gain.setValueAtTime(vol, t0);
        }
        gain.gain.exponentialRampToValueAtTime(0.0001, t1);
        src.connect(filter).connect(gain).connect(dest);
        src.start(t0, offset);
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
    clang(): void {
        this.tone(1800, 120, { type: 'square', to: 1200, vol: 0.06 });
        this.noise(80, { freq: 4200, q: 4, vol: 0.12 });
    }
    fuse(): void { [0, 160, 320, 480].forEach((d, i) => this.tone(900 + i * 180, 60, { type: 'square', vol: 0.05, delayMs: d })); }
    shriek(): void { this.tone(1300, 260, { type: 'sawtooth', to: 500, vol: 0.06 }); }
    crack(): void { this.noise(120, { freq: 1400, q: 3, vol: 0.12 }); }
    crumble(): void {
        this.noise(420, { freq: 300, q: 0.7, vol: 0.2 });
        this.tone(120, 300, { type: 'triangle', to: 60, vol: 0.06 });
    }
    splash(): void { this.noise(260, { freq: 700, q: 0.6, vol: 0.14 }); }
    /** l'acqua che sale: un brontolio basso dalle tubature */
    rumble(): void { this.noise(1800, { freq: 70, q: 0.4, vol: 0.22 }); }

    /** tuono lontano: rombo basso e lungo, poi la coda */
    thunder(): void {
        this.noise(2600, { freq: 90, q: 0.5, vol: 0.32 });
        this.noise(900, { freq: 260, q: 0.8, vol: 0.12 });
    }

    /** ogni nemico muore col suo materiale: vetro, ferro, vernice, carne, gesso, nastro */
    death(kind: string): void {
        switch (kind) {
            case 'specchietto':
                // vetro che va in mille pezzi
                for (let k = 0; k < 6; k++) this.tone(2600 + Math.random() * 2400, 160 + k * 40, { type: 'sine', vol: 0.025, delayMs: k * 28 });
                this.noise(220, { freq: 6000, q: 1.5, vol: 0.12 });
                break;
            case 'bottiglia':
                this.noise(140, { freq: 2800, q: 2.5, vol: 0.1 });
                this.noise(300, { freq: 900, q: 0.7, vol: 0.08, delayMs: 60, to: 300 });
                break;
            case 'ricordo':
                // carta che si strappa
                this.noise(260, { freq: 3200, q: 0.9, vol: 0.09, to: 1800 });
                this.tone(440, 500, { type: 'sine', to: 220, vol: 0.03, delayMs: 120 });
                break;
            case 'tecnodrone':
            case 'telecamera':
                this.buzz(0, 1.4);
                this.tone(900, 300, { type: 'square', to: 80, vol: 0.05 });
                this.noise(160, { freq: 3500, q: 3, vol: 0.06, delayMs: 120 });
                break;
            case 'citelis':
            case 'fiattipo':
                // lamiera che si accartoccia
                this.noise(500, { freq: 400, q: 0.6, vol: 0.2, type: 'lowpass' });
                this.clankFar(0, 2);
                this.tone(220, 400, { type: 'sawtooth', to: 60, vol: 0.05 });
                break;
            case 'glitchetto':
                for (let k = 0; k < 5; k++) this.tone(200 + Math.random() * 2000, 40, { type: 'square', vol: 0.035, delayMs: k * 45 });
                break;
            case 'pittura':
            case 'pittura-mini':
                // splat di vernice
                this.noise(240, { freq: 600, q: 0.8, vol: 0.16, type: 'lowpass', to: 180 });
                this.tone(320, 160, { type: 'sine', to: 90, vol: 0.06 });
                break;
            case 'formica':
                this.noise(70, { freq: 3000, q: 2, vol: 0.12 });
                this.noise(60, { freq: 1600, q: 2, vol: 0.08, delayMs: 50 });
                break;
            case 'padella':
                this.tone(620, 900, { type: 'triangle', vol: 0.06 });
                this.tone(1710, 600, { type: 'sine', vol: 0.03 });
                this.noise(80, { freq: 3000, q: 3, vol: 0.1 });
                break;
            case 'numero':
                // il gesso che si sbriciola sulla lavagna
                this.noise(300, { freq: 4500, q: 4, vol: 0.06, to: 2500 });
                this.pebble(0, 1.2);
                break;
            case 'eco':
                // un nastro che si riavvolge e si spezza
                this.tone(300, 450, { type: 'sawtooth', to: 1800, vol: 0.04 });
                this.noise(200, { freq: 1500, q: 1, vol: 0.06, delayMs: 380 });
                break;
            default:
                // carne: un lamento corto e il tonfo
                this.tone(180 + Math.random() * 60, 260, { type: 'sawtooth', to: 90, vol: 0.05, attackMs: 15 });
                this.noise(140, { freq: 300, q: 0.7, vol: 0.12, type: 'lowpass', delayMs: 120 });
        }
    }

    /* ---------- passi e atterraggi ---------- */

    /** un passo: il materiale decide il colore, un filo di caso il resto */
    step(m: StepMaterial, heavy = 1): void {
        // i passi stanno sotto i colpi: si sentono, non coprono
        const v = (0.8 + Math.random() * 0.4) * heavy * 0.55;
        const j = 0.9 + Math.random() * 0.2;
        switch (m) {
            case 'stone':
                this.noise(55, { freq: 1100 * j, q: 1.1, vol: 0.07 * v });
                this.tone(95 * j, 60, { type: 'sine', vol: 0.05 * v });
                break;
            case 'concrete':
                this.noise(45, { freq: 1900 * j, q: 1.4, vol: 0.07 * v });
                this.tone(120 * j, 40, { type: 'sine', vol: 0.03 * v });
                break;
            case 'brick':
                this.noise(50, { freq: 1500 * j, q: 1.2, vol: 0.065 * v });
                this.tone(110 * j, 50, { type: 'sine', vol: 0.04 * v });
                break;
            case 'metal':
                this.noise(40, { freq: 3200 * j, q: 5, vol: 0.06 * v });
                this.tone(1350 * j, 140, { type: 'triangle', vol: 0.018 * v });
                this.tone(2090 * j, 90, { type: 'sine', vol: 0.012 * v });
                break;
            case 'crystal':
                this.noise(35, { freq: 4200 * j, q: 3, vol: 0.05 * v });
                this.tone(2400 * j, 220, { type: 'sine', vol: 0.016 * v });
                break;
            case 'mud':
                this.noise(90, { freq: 420 * j, q: 0.9, vol: 0.08 * v, type: 'lowpass', to: 200 });
                this.tone(260 * j, 90, { type: 'sine', to: 110, vol: 0.03 * v });
                break;
            case 'roots':
                this.noise(60, { freq: 750 * j, q: 1.6, vol: 0.07 * v });
                this.tone(180 * j, 30, { type: 'triangle', vol: 0.03 * v });
                break;
            case 'circuit':
                this.noise(40, { freq: 2600 * j, q: 2, vol: 0.05 * v });
                this.tone(1700 * j, 25, { type: 'square', vol: 0.012 * v });
                break;
            case 'void':
                this.tone(210 * j, 260, { type: 'sine', to: 160, vol: 0.03 * v, attackMs: 15 });
                this.noise(120, { freq: 600, q: 0.6, vol: 0.02 * v, attackMs: 20 });
                break;
            case 'water':
                this.noise(140, { freq: 900 * j, q: 0.7, vol: 0.07 * v, to: 400 });
                this.tone(520 * j, 70, { type: 'sine', to: 900, vol: 0.02 * v });
                break;
        }
    }

    /** atterraggio: un passo pesante più il tonfo, più forte se cadi da lontano */
    land(m: StepMaterial, strength: number): void {
        const s = Math.max(0.4, Math.min(1.6, strength));
        this.step(m, 1.5 * s);
        this.noise(120, { freq: 220, q: 0.7, vol: 0.08 * s, type: 'lowpass' });
        this.tone(70, 120, { type: 'sine', to: 40, vol: 0.06 * s });
    }

    /* ---------- suoni d'ambiente, a una certa distanza ---------- */

    /** goccia che cade nella pozza: in grotta si porta dietro l'eco */
    drip(pan = 0, vol = 1): void {
        const f = 900 + Math.random() * 900;
        this.tone(f, 90, { type: 'sine', to: f * 2.2, vol: 0.05 * vol, pan });
        this.tone(f * 0.5, 60, { type: 'sine', to: f * 0.8, vol: 0.02 * vol, pan, delayMs: 10 });
    }
    /** metallo lontano che sbatte */
    clankFar(pan = 0, vol = 1): void {
        const f = 300 + Math.random() * 500;
        this.tone(f, 700, { type: 'triangle', vol: 0.03 * vol, pan });
        this.tone(f * 2.76, 400, { type: 'sine', vol: 0.015 * vol, pan });
        this.noise(60, { freq: 2500, q: 2, vol: 0.05 * vol, pan });
    }
    /** bip di un server o di un macchinario */
    beep(pan = 0, vol = 1): void {
        const f = [1320, 1760, 2093, 990][Math.floor(Math.random() * 4)];
        this.tone(f, 70, { type: 'square', vol: 0.012 * vol, pan });
        if (Math.random() < 0.5) this.tone(f * 1.5, 70, { type: 'square', vol: 0.01 * vol, pan, delayMs: 110 });
    }
    /** grillo della notte */
    cricket(pan = 0, vol = 1): void {
        for (let k = 0; k < 3; k++) this.tone(4200 + Math.random() * 300, 35, { type: 'sine', vol: 0.012 * vol, pan, delayMs: k * 55 });
    }
    /** cinguettio di giorno */
    bird(pan = 0, vol = 1): void {
        const f = 2400 + Math.random() * 1200;
        const n = 2 + Math.floor(Math.random() * 3);
        for (let k = 0; k < n; k++) this.tone(f, 80, { type: 'sine', to: f * 1.4, vol: 0.014 * vol, pan, delayMs: k * 120 });
    }
    /** corvo sopra il cratere */
    crow(pan = 0, vol = 1): void {
        for (let k = 0; k < 2; k++) {
            this.noise(220, { freq: 1100, q: 4, vol: 0.04 * vol, pan, delayMs: k * 330, attackMs: 20 });
            this.tone(560, 220, { type: 'sawtooth', to: 420, vol: 0.012 * vol, pan, delayMs: k * 330 });
        }
    }
    /** sussurro: rumore formantico che si apre e si chiude */
    whisper(pan = 0, vol = 1): void {
        const f = 1400 + Math.random() * 1600;
        this.noise(700, { freq: f, q: 7, vol: 0.03 * vol, pan, to: f * 0.6, attackMs: 200 });
        this.noise(500, { freq: f * 1.6, q: 9, vol: 0.02 * vol, pan, to: f, attackMs: 150, delayMs: 180 });
    }
    /** bolla che sale e scoppia */
    bubble(pan = 0, vol = 1): void {
        const f = 300 + Math.random() * 300;
        this.tone(f, 120, { type: 'sine', to: f * 3, vol: 0.03 * vol, pan });
    }
    /** cristallo che vibra da solo */
    chime(pan = 0, vol = 1): void {
        const base = [1568, 1760, 2093, 2349, 2637][Math.floor(Math.random() * 5)];
        this.tone(base, 1400, { type: 'sine', vol: 0.016 * vol, pan, attackMs: 5 });
        this.tone(base * 2.01, 900, { type: 'sine', vol: 0.006 * vol, pan, attackMs: 5 });
    }
    /** clacson del bus, lontano */
    horn(pan = 0, vol = 1): void {
        this.tone(311, 600, { type: 'sawtooth', vol: 0.014 * vol, pan, attackMs: 30 });
        this.tone(392, 600, { type: 'sawtooth', vol: 0.012 * vol, pan, attackMs: 30 });
    }
    /** topo nella cantina */
    squeak(pan = 0, vol = 1): void {
        this.tone(3200 + Math.random() * 800, 60, { type: 'sine', to: 4400, vol: 0.012 * vol, pan });
        this.tone(3600, 50, { type: 'sine', to: 3000, vol: 0.01 * vol, pan, delayMs: 90 });
    }
    /** macchina che passa in lontananza */
    traffic(pan = 0, vol = 1): void {
        this.noise(2600, { freq: 300, q: 0.6, vol: 0.035 * vol, pan, to: 160, attackMs: 900 });
        this.tone(90, 2400, { type: 'sawtooth', to: 70, vol: 0.006 * vol, pan, attackMs: 900 });
    }
    /** legno o trave che scricchiola */
    creak(pan = 0, vol = 1): void {
        const f = 140 + Math.random() * 120;
        this.tone(f, 500, { type: 'sawtooth', to: f * 1.5, vol: 0.012 * vol, pan, attackMs: 80 });
    }
    /** scarica elettrica di un cavo scoperto */
    buzz(pan = 0, vol = 1): void {
        this.tone(120, 260, { type: 'sawtooth', vol: 0.02 * vol, pan });
        this.noise(160, { freq: 5000, q: 1, vol: 0.03 * vol, pan });
    }
    /** pietruzza che rotola giù */
    pebble(pan = 0, vol = 1): void {
        for (let k = 0; k < 4; k++) this.noise(25, { freq: 2200 - k * 200, q: 3, vol: (0.05 - k * 0.01) * vol, pan, delayMs: k * (60 + k * 30) });
    }
    /** respiro lontano di qualcosa di grosso, sotto */
    growlFar(pan = 0, vol = 1): void {
        this.noise(1600, { freq: 160, q: 2, vol: 0.05 * vol, pan, to: 90, attackMs: 500 });
    }
    /** il cuore quando resta un cuore solo */
    heartbeat(vol = 1): void {
        this.tone(58, 110, { type: 'sine', to: 40, vol: 0.16 * vol });
        this.tone(52, 120, { type: 'sine', to: 38, vol: 0.12 * vol, delayMs: 190 });
    }
    /** la porta dell'arena che si chiude */
    gate(): void {
        this.noise(500, { freq: 200, q: 0.8, vol: 0.2, type: 'lowpass' });
        this.tone(60, 600, { type: 'sawtooth', to: 40, vol: 0.06 });
        this.noise(90, { freq: 2600, q: 3, vol: 0.08, delayMs: 380 });
    }

    /* ---------- letti continui ---------- */

    /** livelli dei letti d'ambiente: quelli non citati si spengono piano */
    setBeds(levels: Partial<Record<Bed, number>>): void {
        if (!this.ctx || !this.master) return;
        const now = this.ctx.currentTime;
        for (const [bed, nodes] of this.beds) {
            if (!(bed in levels)) nodes.gain.gain.setTargetAtTime(0, now, 1.2);
        }
        for (const [bed, lvl] of Object.entries(levels) as [Bed, number][]) {
            const nodes = this.beds.get(bed) ?? this.makeBed(bed);
            if (!nodes) continue;
            nodes.gain.gain.setTargetAtTime(Math.max(0, lvl) * BED_TRIM[bed], now, 1.2);
        }
    }

    stopBeds(): void {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        for (const n of this.beds.values()) n.gain.gain.setTargetAtTime(0, now, 0.4);
    }

    private makeBed(bed: Bed): BedNodes | null {
        const ctx = this.ctx;
        if (!ctx || !this.master || !this.noiseBuffer || !this.brownBuffer) return null;
        const gain = ctx.createGain();
        gain.gain.value = 0;
        gain.connect(this.master);
        const stops: (() => void)[] = [];
        const loop = (buf: AudioBuffer, type: BiquadFilterType, freq: number, q: number, vol: number, lfo?: { rate: number; depth: number; onGain?: boolean }) => {
            const src = ctx.createBufferSource();
            src.buffer = buf;
            src.loop = true;
            const f = ctx.createBiquadFilter();
            f.type = type;
            f.frequency.value = freq;
            f.Q.value = q;
            const g = ctx.createGain();
            g.gain.value = vol;
            src.connect(f).connect(g).connect(gain);
            if (lfo) {
                const o = ctx.createOscillator();
                const d = ctx.createGain();
                o.frequency.value = lfo.rate;
                d.gain.value = lfo.depth;
                o.connect(d).connect(lfo.onGain ? g.gain : f.frequency);
                o.start();
                stops.push(() => o.stop());
            }
            src.start(0, Math.random() * 1.5);
            stops.push(() => src.stop());
        };
        const drone = (freqs: number[], type: OscillatorType, vol: number, wobble = 0) => {
            freqs.forEach((fr, i) => {
                const o = ctx.createOscillator();
                o.type = type;
                o.frequency.value = fr;
                o.detune.value = (i - freqs.length / 2) * 6;
                const g = ctx.createGain();
                g.gain.value = vol / (i + 1);
                o.connect(g).connect(gain);
                if (wobble) {
                    const l = ctx.createOscillator();
                    const d = ctx.createGain();
                    l.frequency.value = 0.07 + i * 0.05;
                    d.gain.value = vol / (i + 1) * wobble;
                    l.connect(d).connect(g.gain);
                    l.start();
                    stops.push(() => l.stop());
                }
                o.start();
                stops.push(() => o.stop());
            });
        };
        switch (bed) {
            case 'wind':
                loop(this.brownBuffer, 'bandpass', 420, 0.6, 0.5, { rate: 0.09, depth: 260 });
                loop(this.noiseBuffer, 'bandpass', 1800, 2.5, 0.025, { rate: 0.13, depth: 900 });
                break;
            case 'cave':
                // il respiro della roccia: un fondo basso che pulsa lentissimo
                loop(this.brownBuffer, 'lowpass', 140, 0.5, 0.7, { rate: 0.05, depth: 0.25, onGain: true });
                drone([55, 82.5], 'sine', 0.025, 0.6);
                break;
            case 'hum':
                drone([50, 100, 150], 'sawtooth', 0.012);
                loop(this.brownBuffer, 'lowpass', 300, 0.7, 0.3);
                break;
            case 'servers':
                loop(this.noiseBuffer, 'highpass', 5000, 0.5, 0.012);
                drone([60, 120, 7800], 'sine', 0.01);
                break;
            case 'water':
                loop(this.noiseBuffer, 'bandpass', 700, 0.8, 0.06, { rate: 0.21, depth: 260 });
                loop(this.brownBuffer, 'lowpass', 260, 0.6, 0.35, { rate: 0.17, depth: 0.15, onGain: true });
                break;
            case 'void':
                drone([73.4, 110.2, 146.8, 220.4], 'sine', 0.03, 0.9);
                loop(this.noiseBuffer, 'bandpass', 900, 12, 0.02, { rate: 0.03, depth: 500 });
                break;
            case 'crystal':
                drone([1046.5, 1568, 2093], 'sine', 0.006, 1);
                loop(this.brownBuffer, 'lowpass', 200, 0.5, 0.2);
                break;
            case 'city':
                loop(this.brownBuffer, 'lowpass', 380, 0.5, 0.45, { rate: 0.04, depth: 120 });
                loop(this.noiseBuffer, 'bandpass', 2400, 0.8, 0.008);
                break;
            case 'fire':
                loop(this.noiseBuffer, 'bandpass', 900, 0.6, 0.03, { rate: 7.5, depth: 0.025, onGain: true });
                loop(this.brownBuffer, 'lowpass', 180, 0.5, 0.3);
                break;
            case 'rain-roof':
                loop(this.noiseBuffer, 'bandpass', 2600, 0.7, 0.02, { rate: 0.4, depth: 0.008, onGain: true });
                break;
        }
        const nodes: BedNodes = { gain, stop: () => stops.forEach((s) => s()) };
        this.beds.set(bed, nodes);
        return nodes;
    }

    /** pioggia continua: rumore filtrato con un volume che segue l'intensità */
    setRain(level: number): void {
        if (!this.ctx || !this.master || !this.noiseBuffer) return;
        if (!this.rain && level <= 0) return;
        if (!this.rain) {
            const src = this.ctx.createBufferSource();
            src.buffer = this.noiseBuffer;
            src.loop = true;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 1400;
            const gain = this.ctx.createGain();
            gain.gain.value = 0;
            src.connect(filter).connect(gain).connect(this.master);
            src.start();
            this.rain = { src, gain };
        }
        this.rain.gain.gain.setTargetAtTime(Math.max(0, Math.min(1, level)) * 0.06, this.ctx.currentTime, 0.8);
    }

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
        this.stopBeds();
    }
}

export const sfx = new Sfx();
