import { ACHIEVEMENTS } from '../content/achievements';
import { bus } from './events';
import { state } from './state';
import { coop } from '../coop/runtime';

/* i trofei si prendono solo giocando senza aiuti: con la freccia accesa niente */

export function achievementsBlocked(): boolean {
    // una partita che ha acceso la freccia resta assistita fino in fondo
    return state.settings.guide || state.save.assisted;
}

export function unlockAchievement(id: string): void {
    if (achievementsBlocked() || state.save.achievements.includes(id)) return;
    if (!ACHIEVEMENTS.some((a) => a.id === id)) return;
    state.save.achievements.push(id);
    state.persist();
    bus.emit('achievement', { id });
    // in due il trofeo è della partita: l'host lo incide, il sync lo riporta indietro
    if (coop.isGuest && coop.together) coop.session?.send('achieve', { id });
}

/** quelli che dipendono solo dal salvataggio: si ricontrollano spesso, costano niente */
export function checkAchievements(): void {
    if (achievementsBlocked()) return;
    for (const a of ACHIEVEMENTS) {
        if (a.check && !state.save.achievements.includes(a.id) && a.check(state.save)) unlockAchievement(a.id);
    }
}
