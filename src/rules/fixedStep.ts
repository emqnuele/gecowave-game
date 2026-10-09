// scarti più piccoli dai multipli e dalle frazioni del passo sono rumore dell'orologio del monitor, non tempo
const SNAP_MS = 0.2;

/** la logica del gioco va a passi fissi: lo schermo può disegnare a 60, 120 o 144 hz, il mondo avanza sempre allo stesso ritmo */
export class FixedStep {
    private readonly stepMs: number;
    private readonly maxSteps: number;
    private acc: number;
    private since = 0;
    /** il tempo vero che tocca a ciascun passo dell'ultimo fotogramma */
    dt = 0;

    constructor(stepMs: number, maxSteps = 4) {
        this.stepMs = stepMs;
        this.maxSteps = maxSteps;
        // a 120 e 240 hz il passo cade sull'ultimo fotogramma del suo sedicesimo di secondo, dopo il passo della fisica e dei timer come a 60
        this.acc = stepMs * 0.2;
    }

    /** quanti passi toccano a un fotogramma lungo deltaMs; il tempo in pausa non arriva qui, quindi alla ripresa non c'è niente da recuperare */
    advance(deltaMs: number): number {
        // agganciato: un 60 hz vero dà 16,67 ms o 16,68 ms, e lo scarto accumulato farebbe ogni tanto un fotogramma da due passi
        this.acc += this.snapped(deltaMs);
        this.since += deltaMs;
        const due = Math.floor(this.acc / this.stepMs);
        if (due === 0) return 0;
        this.acc -= due * this.stepMs;
        // dopo un intoppo lungo (scheda in background, caricamento) non si corre: si riparte
        const n = Math.min(due, this.maxSteps);
        this.dt = this.since / n;
        this.since = 0;
        return n;
    }

    private snapped(deltaMs: number): number {
        for (let k = 1; k <= 4; k++) {
            if (Math.abs(deltaMs - this.stepMs * k) < SNAP_MS) return this.stepMs * k;
            if (Math.abs(deltaMs - this.stepMs / k) < SNAP_MS) return this.stepMs / k;
        }
        return deltaMs;
    }
}
