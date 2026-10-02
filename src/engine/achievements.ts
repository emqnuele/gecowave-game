import { ACHIEVEMENTS } from '../content/achievements';
import { bus } from './events';
import { state } from './state';

/* i trofei si prendono solo giocando senza aiuti: con la freccia accesa niente */

export function achievementsBlocked(): boolean {
    return state.settings.guide;
}

export function unlockAchievement(id: string): void {
    if (achievementsBlocked() || state.save.achievements.includes(id)) return;
    if (!ACHIEVEMENTS.some((a) => a.id === id)) return;
    state.save.achievements.push(id);
    state.persist();
    bus.emit('achievement', { id });
}

/** quelli che dipendono solo dal salvataggio: si ricontrollano spesso, costano niente */
export function checkAchievements(): void {
    if (achievementsBlocked()) return;
    for (const a of ACHIEVEMENTS) {
        if (a.check && !state.save.achievements.includes(a.id) && a.check(state.save)) unlockAchievement(a.id);
    }
}
