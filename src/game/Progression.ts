import Phaser from 'phaser';
import { REGION_COUNT } from '../content/achievements';
import { acoustics } from '../audio/acoustics';
import { achievementsBlocked, checkAchievements, unlockAchievement } from '../core/achievements';
import { buildChapterSummary, buildFinalSummary, countsFor } from '../core/ChapterCompletion';
import { bus } from '../core/events';
import { music } from '../audio/music';
import { regionView } from '../core/regionView';
import { pushBoard, runScore } from '../core/score';
import { chapterParts, ENDING_BONUS, sumParts } from '../rules/score';
import { sfx } from '../audio/sfx';
import { state } from '../core/state';
import type { EndingId } from './chapters/ChapterScript';
import type { Flow, GameContext, GameSystem, SceneData } from './context';

type ProgressionCtx = Pick<GameContext, 'scene' | 'carry' | 'world' | 'player' | 'bosses' | 'chapter' | 'safe' | 'feel' | 'doomsday' | 'flow'>;

/** il capitolo come percorso: uscite, riepiloghi, punteggi, morte e fine partita */
export class Progression implements Flow, GameSystem {
    /** la scena sta per cambiare capitolo: niente più uscite, morti o ingaggi */
    exiting = false;
    private lastRoom = -1;
    private nextTrophyCheckAt = 0;
    private readonly ctx: ProgressionCtx;
    private readonly scene: Phaser.Scene;

    constructor(ctx: ProgressionCtx) {
        this.ctx = ctx;
        this.scene = ctx.scene;
    }

    playerDied(): void {
        this.onPlayerDead();
    }

    checkExits(): void {
        if (this.exiting || this.ctx.player.dead) return;
        // i capitoli segreti non hanno `next`: l'uscita riporta al varco d'origine
        if (!this.ctx.world.def.next) {
            if (!this.ctx.world.def.secret) return;
            const hit = this.ctx.world.level.exits.some((r) => r.contains(this.ctx.player.x, this.ctx.player.y));
            if (!hit) return;
            if (this.ctx.bosses.current?.active && this.ctx.bosses.current.def.guardsExit !== false) return;
            const ret = state.portalReturn;
            const target = ret?.levelId ?? this.ctx.world.def.returnTo;
            if (!target) return;
            const spawnAt = ret && ret.levelId === target ? { x: ret.x, y: ret.y } : undefined;
            state.portalReturn = null;
            this.completeChapterAndGo(target, spawnAt);
            return;
        }
        const hit = this.ctx.world.level.exits.some((r) => r.contains(this.ctx.player.x, this.ctx.player.y));
        if (!hit) return;
        // i boss non si superano scappando (quelli opzionali sì)
        if (this.ctx.bosses.current?.active && this.ctx.bosses.current.def.guardsExit !== false) {
            if (this.scene.time.now > this.ctx.carry.exitLockToastAt) {
                this.ctx.carry.exitLockToastAt = this.scene.time.now + 3000;
                bus.emit('toast', { text: `${this.ctx.bosses.current.def.name.split(',')[0]} ti sbarra ancora la strada. segui la freccia.` });
            }
            return;
        }
        const lock = this.ctx.chapter.exitLock?.();
        if (lock) {
            if (this.scene.time.now > this.ctx.carry.exitLockToastAt) {
                this.ctx.carry.exitLockToastAt = this.scene.time.now + 3000;
                bus.emit('toast', { text: lock });
            }
            return;
        }
        this.completeChapterAndGo(this.ctx.world.def.next);
    }

    /** rientro da un capitolo segreto verso il varco d'origine (o il returnTo) */
    returnFromSecret(delay: number): void {
        if (!this.ctx.world.def.secret) return;
        bus.emit('toast', { text: 'capitolo segreto completato. il varco ti riporta indietro...' });
        this.scene.time.delayedCall(delay, () => {
            if (this.exiting || this.ctx.player.dead) return;
            const ret = state.portalReturn;
            const target = ret?.levelId ?? this.ctx.world.def.returnTo;
            if (!target) return;
            const spawnAt = ret && ret.levelId === target ? { x: ret.x, y: ret.y } : undefined;
            state.portalReturn = null;
            this.completeChapterAndGo(target, spawnAt);
        });
    }

    /** uscita del capitolo con riepilogo animato: score una volta sola, poi la ui decide quando partire */
    completeChapterAndGo(next: string, spawnAt?: { x: number; y: number }): void {
        if (this.exiting || this.ctx.player.dead || this.ctx.world.def.hub) {
            if (!this.exiting && !this.ctx.player.dead && this.ctx.world.def.hub) this.gotoLevel(next, spawnAt);
            return;
        }
        this.exiting = true;
        let summary = null;
        try {
            // finishChapter calcola, persiste ed emette chapter-score: da qui è idempotente
            const result = this.finishChapter();
            if (result) {
                const seen = new Set(state.save.explored[this.ctx.world.def.id] ?? []);
                summary = buildChapterSummary({
                    levelId: this.ctx.world.def.id,
                    title: this.ctx.world.def.title,
                    accentWord: this.ctx.world.def.accentWord,
                    color: this.ctx.world.def.color,
                    punchline: this.ctx.world.def.punchline,
                    visited: seen.size,
                    rooms: this.ctx.world.layout?.rooms.length ?? 0,
                    hearts: countsFor(this.ctx.world.def.id, 'heart'),
                    things: countsFor(this.ctx.world.def.id, 'thing'),
                    chapter: result.score,
                    lines: result.lines,
                    best: result.best,
                    assisted: result.assisted,
                    runTotal: runScore(0),
                });
            }
        } catch (e) {
            if (import.meta.env.DEV) console.warn('riepilogo capitolo saltato:', e);
        }
        if (!summary) {
            this.gotoLevel(next, spawnAt);
            return;
        }
        // il mondo aspetta dietro la carta: musica bassa, scena ferma
        music.setGraveDuck(true);
        this.scene.scene.pause();
        let continued = false;
        const onContinue = (): void => {
            if (continued) return;
            continued = true;
            music.setGraveDuck(false);
            if (this.scene.scene.isPaused()) this.scene.scene.resume();
            this.gotoLevel(next, spawnAt);
        };
        try {
            bus.emit('chapter-summary-show', { summary, onContinue });
        } catch (e) {
            if (import.meta.env.DEV) console.warn('riepilogo capitolo saltato:', e);
            onContinue();
            return;
        }
        // senza ui pronta non si resta bloccati: transizione normale
        if (!document.querySelector('.chsum-overlay')) onContinue();
    }

    gotoLevel(next: string, spawnAt?: { x: number; y: number }): void {
        if (next !== this.ctx.world.def.id) this.finishChapter();
        this.exiting = true;
        state.save.levelId = next;
        state.save.checkpointId = null;
        state.persist();
        sfx.stopBeds();
        this.scene.cameras.main.fadeOut(450, 0, 0, 0);
        this.scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.scene.restart({ levelId: next, checkpointId: null, spawnAt } satisfies SceneData);
        });
    }

    updateExplore(): void {
        if (!this.ctx.world.layout) return;
        const room = this.ctx.world.roomAt(this.ctx.player.x, this.ctx.player.y);
        if (!room || room.id === this.lastRoom) return;
        this.lastRoom = room.id;
        if (state.explore(this.ctx.world.def.id, room.id)) {
            if (state.save.explored[this.ctx.world.def.id].length >= this.ctx.world.layout.rooms.length && !state.hasFlag(`esplorata-${this.ctx.world.def.id}`)) {
                state.setFlag(`esplorata-${this.ctx.world.def.id}`);
                bus.emit('toast', { text: 'regione esplorata al 100%. la mappa è completa.' });
                unlockAchievement('cartografo');
                if (state.save.flags.filter((f) => f.startsWith('esplorata-')).length >= REGION_COUNT) unlockAchievement('gecografo');
            }
            state.persist();
        }
        regionView.room = room.id;
    }

    /** trofei e boss senza danni */
    updateTrophies(time: number): void {
        this.ctx.bosses.trackFight(this.ctx.doomsday.collapsePedro);
        if (time >= this.nextTrophyCheckAt) {
            this.nextTrophyCheckAt = time + 1000;
            checkAchievements();
        }
    }

    /** punteggio del capitolo quando lo lasci per andare avanti */
    private finishChapter(): { id: string; score: number; best: boolean; assisted: boolean; timeMs: number; lines: [string, string][] } | null {
        const run = state.save.chapterRun;
        if (!run || run.id !== this.ctx.world.def.id) return null;
        const timeMs = state.save.record.playMs - run.startMs;
        const deaths = state.save.record.deaths - run.deaths0;
        const kills = state.save.record.kills - run.kills0;
        const explored = this.ctx.world.layout ? (state.save.explored[this.ctx.world.def.id]?.length ?? 0) / this.ctx.world.layout.rooms.length : 1;
        const id = this.ctx.world.def.id;
        const secrets = countsFor(id, 'thing').found;
        const minutes = timeMs / 60000;
        const parts = chapterParts({ explored, secrets, kills, noHitBosses: run.noHitBosses, deaths, minutes });
        const score = sumParts(parts);
        // la partita assistita non fa punteggio: né record né somma della partita
        const assisted = achievementsBlocked();
        const prev = state.save.scores[id];
        const best = !assisted && (!prev || score > prev.score);
        if (best) state.save.scores[id] = { score, timeMs, deaths, kills, explored, secrets, assisted, rooms: this.ctx.world.layout?.rooms.length ?? 0, hearts: countsFor(id, 'heart'), things: countsFor(id, 'thing') };
        if (!assisted) state.save.runScores[id] = Math.max(state.save.runScores[id] ?? 0, score);
        if (id === 'perduta' && minutes < 6) unlockAchievement('speedrun');
        const lines = parts.filter(([, v]) => v !== 0).map(([k, v]) => [k, (v > 0 ? '+' : '') + v] as [string, string]);
        // il conto voce per voce resta nella bacheca: a schermo solo una notifica
        state.save.chapterLog = { ...state.save.chapterLog, [id]: { score, best, assisted, timeMs, lines, at: Date.now() } };
        state.save.chapterRun = null;
        state.persist();
        bus.emit('chapter-score', { id, score, best, assisted, timeMs });
        return { id, score, best, assisted, timeMs, lines };
    }

    /** il capitolo in corso, stimato come se finisse adesso (senza il bonus del tempo) */
    private liveChapterScore(): number {
        const run = state.save.chapterRun;
        if (!run || run.id !== this.ctx.world.def.id) return 0;
        const id = this.ctx.world.def.id;
        const explored = this.ctx.world.layout ? (state.save.explored[id]?.length ?? 0) / this.ctx.world.layout.rooms.length : 0;
        const secrets = countsFor(id, 'thing').found;
        return sumParts(chapterParts({
            explored, secrets, kills: state.save.record.kills - run.kills0, noHitBosses: run.noHitBosses, deaths: state.save.record.deaths - run.deaths0,
        }));
    }

    /** la partita finisce: prima il riepilogo cinematico, poi i titoli di coda */
    endGame(id: EndingId): void {
        this.scene.scene.pause();
        // a partita finita nessuno scontro resta aperto: barra, voce e battute si chiudono qui
        bus.emit('boss-hp', null);
        this.ctx.bosses.silence();
        bus.emit('bark-clear', {});
        const base = runScore(this.liveChapterScore());
        const bonus = ENDING_BONUS[id] ?? 0;
        const score = base === null ? null : base + bonus;
        const rank = score === null ? 0 : pushBoard({ name: state.save.playerName, score, ending: id, at: Date.now() });
        const assisted = base === null;
        // aggregati dai record dei capitoli: già salvati, niente da ricalcolare
        let visited = 0;
        let rooms = 0;
        let heartsFound = 0;
        let heartsTotal = 0;
        let thingsFound = 0;
        let thingsTotal = 0;
        for (const sc of Object.values(state.save.scores)) {
            if (!sc.rooms) continue;
            rooms += sc.rooms;
            visited += Math.round(sc.explored * sc.rooms);
            heartsFound += sc.hearts?.found ?? 0;
            heartsTotal += sc.hearts?.total ?? 0;
            thingsFound += sc.things?.found ?? 0;
            thingsTotal += sc.things?.total ?? 0;
        }
        const runSum = Object.values(state.save.runScores).reduce((s, v) => s + v, 0);
        const trophyPts = state.save.achievements.length * 10;
        const lines: [string, string][] = [];
        if (runSum > 0) lines.push(['capitoli', `+${runSum.toLocaleString('it-IT')}`]);
        if (trophyPts > 0) lines.push(['trofei', `+${trophyPts.toLocaleString('it-IT')}`]);
        if (bonus > 0) lines.push(['bonus finale', `+${bonus.toLocaleString('it-IT')}`]);
        const titles: Record<string, { title: string; win: boolean; color: 'green' | 'yellow' | 'cyan' | 'red' }> = {
            riscatto: { title: 'storto non vuol dire rotto', win: true, color: 'green' },
            consegna: { title: 'hai salvato il gecorealm', win: true, color: 'yellow' },
            dei: { title: 'ora il gecorealm è tuo', win: true, color: 'cyan' },
            pedro: { title: 'gli dei ti hanno raggiunto', win: false, color: 'red' },
            sconfitta: { title: 'il realm continua. tu no.', win: false, color: 'red' },
        };
        const end = titles[id] ?? titles.sconfitta;
        let summary = null;
        try {
            summary = buildFinalSummary({
                title: end.title,
                subtitle: end.win ? 'il realm tiene. questa volta davvero.' : 'ogni caduta insegna la strada.',
                color: end.color,
                visited,
                rooms,
                hearts: { found: heartsFound, total: heartsTotal },
                things: { found: thingsFound, total: thingsTotal },
                total: score,
                lines,
                best: rank === 1 && score !== null,
                rank,
                assisted,
            });
        } catch (e) {
            if (import.meta.env.DEV) console.warn('riepilogo finale saltato:', e);
        }
        if (!summary) {
            bus.emit('ending', { id, score, rank });
            return;
        }
        music.setGraveDuck(true);
        let continued = false;
        const onContinue = (): void => {
            if (continued) return;
            continued = true;
            music.setGraveDuck(false);
            bus.emit('ending', { id, score, rank });
        };
        try {
            bus.emit('final-summary-show', { summary, onContinue });
        } catch (e) {
            if (import.meta.env.DEV) console.warn('riepilogo finale saltato:', e);
            onContinue();
            return;
        }
        // senza ui pronta i titoli partono lo stesso
        if (!document.querySelector('.chsum-overlay')) onContinue();
    }

    onPlayerDead(): void {
        state.save.record.deaths++;
        const lost = state.save.barre;
        // morto in uno scontro: la voce tace e la barra si toglie, alla ripresa si ricomincia
        this.ctx.bosses.silence();
        bus.emit('bark-clear', {});
        bus.emit('boss-hp', null);
        // le barre restano dove sei morto, stile souls
        state.dropped = lost > 0 ? { levelId: this.ctx.world.def.id, x: this.ctx.safe.lastSafe.x, y: this.ctx.safe.lastSafe.y, amount: lost } : null;
        state.save.barre = 0;
        state.persist();
        this.ctx.feel.shake(300, 0.01);
        this.ctx.player.setTint(0xf87171);
        this.scene.tweens.add({ targets: this.ctx.player, alpha: 0, angle: 180, duration: 600 });
        sfx.stopBeds();
        music.tapeStop();
        acoustics.swell(1800, 0.8);
        this.scene.time.delayedCall(900, () => {
            this.scene.scene.pause();
            // il patto e gli dei sfidati chiudono la partita; anche il collasso del doomsday
            const ending = this.ctx.chapter.deathEnding?.() ?? (this.ctx.doomsday.collapsePedro ? 'sconfitta' : null);
            if (ending) {
                this.endGame(ending);
            } else {
                bus.emit('player-died', { lost, score: runScore(this.liveChapterScore()) });
            }
        });
    }


    destroy(): void {}
}
