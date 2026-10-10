import type { Boss, HitDir } from '../entities/Boss';
import type { Enemy } from '../entities/Enemy';

/* i ganci che il gioco interroga senza sapere del coop. in single restano vuoti:
   le entità non guadagnano campi (la sonda dell'harness li conta tutti) e il
   loro comportamento non cambia di una virgola */

/** cosa fa un nemico fantoccio dell'ospite quando lo si tocca: lo chiede all'host */
export interface PuppetEnemyNet {
    damage(e: Enemy, amount: number, fromX: number): void;
    stun(e: Enemy, ms: number): void;
    stagger(e: Enemy, ms: number): void;
    parried(e: Enemy): void;
    knock(e: Enemy, vx: number, vy: number): void;
}

/** il boss fantoccio dell'ospite: il colpo si chiede, la parata e lo scudo si leggono dallo stato replicato */
export interface PuppetBossNet {
    damage(b: Boss, amount: number, fromX: number, dir?: HitDir): boolean;
}

/** l'host sente i personaggi nati dopo il caricamento: l'ospite li mette identici */
export interface HostNpcNet {
    spawned(id: string, x: number, y: number): void;
    gone(id: string): void;
}

/** l'host sente le battute e i gesti che l'ospite deve vedere */
export interface HostEnemyNet {
    say(e: Enemy, text: string, ms: number): void;
}

export interface HostBossNet {
    fx(b: Boss, fx: string, data?: { tx?: number; ty?: number; n?: number; dir?: number; phase?: number }): void;
}

export const coopHooks = {
    /** i nemici e i boss dell'ospite: disegnati dall'host, mai pensati qui */
    puppets: new WeakSet<object>(),
    puppetEnemy: null as PuppetEnemyNet | null,
    puppetBoss: null as PuppetBossNet | null,
    hostEnemy: null as HostEnemyNet | null,
    hostBoss: null as HostBossNet | null,
    hostNpc: null as HostNpcNet | null,
    /** il geco locale è fermo e intoccabile: dialogo per conto suo, telefono, pausa */
    frozen: false,
    /** il geco locale è a terra e guarda l'altro */
    spectating: false,
    /** l'host sta facendo una cosa sua (il suo geco, il telefono, la pausa): i toast restano suoi */
    personal: 0,
    menuOpen: false,
    /** il film dell'host è finito: l'ospite chiude il suo */
    filmEnded: null as (() => void) | null,
    /** la pausa in due: raggiungere il compagno, chi è, dove sta */
    joinPartner: null as (() => void) | null,
    partnerName: null as (() => string | null) | null,
    /** chi ha mosso per ultimo dentro un dialogo o una scelta: serve a chi esegue per conto dell'altro */
    actorKind: null as 'local' | 'remote' | null,
    /** il boccone dell'ospite passa dalla dispensa dell'host: true se preso in carico */
    requestEat: null as ((id: string | null) => boolean) | null,
    /** le scelte in due passano da qui prima di mostrarsi: true se il coop le ha prese */
    choice: null as ((p: { title: string; options: { label: string; danger?: boolean }[]; onPick: (i: number) => void }) => boolean) | null,
    /** il tabellone del citelis passa da qui prima di mostrarsi: true se il coop l'ha preso */
    travel: null as ((p: { stops: { key: string; levelId: string; label: string }[]; current: string; onPick: (key: string) => void }) => boolean) | null,
};

export function resetCoopHooks(): void {
    coopHooks.puppets = new WeakSet();
    coopHooks.puppetEnemy = null;
    coopHooks.puppetBoss = null;
    coopHooks.hostEnemy = null;
    coopHooks.hostBoss = null;
    coopHooks.hostNpc = null;
    coopHooks.frozen = false;
    coopHooks.spectating = false;
    coopHooks.personal = 0;
    coopHooks.menuOpen = false;
    coopHooks.filmEnded = null;
    coopHooks.choice = null;
    coopHooks.travel = null;
    coopHooks.actorKind = null;
    coopHooks.requestEat = null;
    coopHooks.joinPartner = null;
    coopHooks.partnerName = null;
}
