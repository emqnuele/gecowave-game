import { state } from '../core/state';

/* la vibrazione del pad: gli stessi momenti dell'obiettivo, sentiti in mano.
   solo uscita verso il controller: niente torna nella logica del gioco */

type Actuator = { playEffect?: (type: string, params: Record<string, number>) => Promise<unknown>; reset?: () => Promise<unknown> };

class Haptics {
    /** fino a quando il motore è occupato da un effetto più forte di quello che arriva */
    private busyUntil = 0;
    private busyStrength = 0;

    /** strong è il motore grosso (colpi, terremoti), weak quello piccolo (ronzii, scatti) */
    rumble(strong: number, weak: number, ms: number): void {
        if (!state.settings.rumble) return;
        const now = performance.now();
        const strength = Math.max(strong, weak);
        // un effetto piccolo non taglia uno grosso ancora in corso
        if (now < this.busyUntil && strength < this.busyStrength) return;
        const pad = this.actuator();
        if (!pad?.playEffect) return;
        this.busyUntil = now + ms;
        this.busyStrength = strength;
        pad.playEffect('dual-rumble', {
            duration: Math.round(ms),
            startDelay: 0,
            strongMagnitude: Math.min(1, Math.max(0, strong)),
            weakMagnitude: Math.min(1, Math.max(0, weak)),
        }).catch(() => {});
    }

    /** il battito in due colpi, come quello che si sente */
    heartbeat(vol = 1): void {
        this.rumble(0.55 * vol, 0, 90);
        window.setTimeout(() => this.rumble(0.35 * vol, 0, 80), 190);
    }

    stop(): void {
        this.busyUntil = 0;
        this.actuator()?.reset?.().catch(() => {});
    }

    private actuator(): Actuator | null {
        let pads: (Gamepad | null)[] = [];
        // getGamepads lancia se la pagina non ha il permesso: senza pad non si vibra
        try {
            pads = navigator.getGamepads ? [...navigator.getGamepads()] : [];
        } catch {
            return null;
        }
        for (const p of pads) {
            const a = (p as (Gamepad & { vibrationActuator?: Actuator }) | null)?.vibrationActuator;
            if (p?.connected && a) return a;
        }
        return null;
    }
}

export const haptics = new Haptics();
