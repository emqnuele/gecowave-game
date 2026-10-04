import { ITEMS } from '../content/items';
import { bus } from './events';
import { sfx } from './sfx';
import { state } from './state';

/* usare un oggetto dello zaino: ritorna la frase da mostrare.
   se l'oggetto non serve (vita già piena) non viene consumato */

const HEALS: Record<string, number> = { crocchetta: 1, 'panino-nonna': 3 };

function emitVitals(): void {
    bus.emit('hp-changed', { hp: state.run.hp, maxHp: state.maxHp, hurt: false });
    bus.emit('flow-changed', { flow: state.run.flow, maxFlow: state.maxFlow });
}

/* il tasto rapido sceglie da solo: prima la crocchetta, poi il panino */
export function pickSnack(): string | null {
    const order = ['crocchetta', 'panino-nonna'];
    return order.find((i) => state.count(i) > 0) ?? null;
}

/* perché non si può mangiare adesso: null quando si può partire */
export function eatProblem(id: string): string | null {
    if (!HEALS[id] || state.count(id) <= 0) return 'niente da mangiare nello zaino. wavezon consegna ovunque.';
    if (state.run.hp >= state.maxHp) return 'sei già al pieno. conservalo per quando piangi.';
    return null;
}

/* fine del boccone: consuma, cura, fa rumore (l'ombra sente solo questo) */
export function completeEat(id: string): string {
    const def = ITEMS[id];
    const heal = HEALS[id] ?? 0;
    if (!def || heal <= 0) return 'questo non si mangia. credo.';
    if (state.run.hp >= state.maxHp) return 'sei già al pieno. conservalo per quando piangi.';
    if (!state.removeItem(id)) return 'finito. come la pazienza di piema.';
    state.run.hp = Math.min(state.maxHp, state.run.hp + heal + state.mods.foodHeal);
    sfx.heal();
    emitVitals();
    bus.emit('player-healed', {});
    return `${def.name}: fatto.`;
}
