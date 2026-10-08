import type Phaser from 'phaser';
import { acoustics } from '../engine/audio/acoustics';
import { bus } from '../engine/events';
import { music } from '../engine/music';
import { sfx } from '../engine/sfx';
import { state } from '../engine/state';

/* gli strumenti di sviluppo in un posto solo: main li chiama dietro import.meta.env.DEV,
   quindi il build di produzione non li contiene. harness e bot li usano da window */

/** le maniglie del gioco per la console, l'harness e il bot */
export function installDevHandles(game: Phaser.Game): void {
    Object.assign(window, { __game: game, __bus: bus, __state: state, __music: music, __acoustics: acoustics, __sfx: sfx, __meter: audioMeter });
}

/** il bot di test avvia il livello a un istante preciso dell'orologio finto, come fa "continua" */
export function installLevelHook(start: (levelId: string, checkpointId: string | null) => void): void {
    Object.assign(window, { __startLevel: (levelId: string, checkpointId: string | null = null) => start(levelId, checkpointId) });
}

let meters: { m: AnalyserNode; e: AnalyserNode } | null = null;

/** rms di musica ed effetti, per tarare i livelli */
export function audioMeter(): { music: number; sfx: number } | null {
    // gli ingressi esistono solo a contesto già acceso: misurare non deve mai accendere l'audio
    if (!acoustics.musicIn || !acoustics.sfxIn) return null;
    const ctx = acoustics.context();
    if (!ctx) return null;
    if (!meters) {
        const m = ctx.createAnalyser();
        const e = ctx.createAnalyser();
        m.fftSize = e.fftSize = 2048;
        acoustics.musicIn.connect(m);
        acoustics.sfxIn.connect(e);
        meters = { m, e };
    }
    const rms = (a: AnalyserNode): number => {
        const d = new Float32Array(a.fftSize);
        a.getFloatTimeDomainData(d);
        let s = 0;
        for (const v of d) s += v * v;
        return Math.sqrt(s / d.length);
    };
    return { music: rms(meters.m), sfx: rms(meters.e) };
}
