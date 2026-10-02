import { ITEMS } from '../content/items';
import { bus } from './events';
import { sfx } from './sfx';
import { state } from './state';

/* usare un oggetto dello zaino: ritorna la frase da mostrare.
   se l'oggetto non serve (vita già piena) non viene consumato */

const HEALS: Record<string, number> = { crocchetta: 1, 'panino-nonna': 3, rubinetto: 1, 'brodo-lochef': 99 };

function emitVitals(): void {
    bus.emit('hp-changed', { hp: state.run.hp, maxHp: state.maxHp, hurt: false });
    bus.emit('flow-changed', { flow: state.run.flow, maxFlow: state.maxFlow });
}

export function useItem(id: string): { ok: boolean; text: string } {
    const def = ITEMS[id];
    if (!def || def.kind !== 'consumabile') return { ok: false, text: 'questo non si mangia. credo.' };
    if (state.count(id) <= 0) return { ok: false, text: 'finito. come la pazienza di piema.' };

    const heal = HEALS[id];
    if (heal !== undefined) {
        const cures = id === 'rubinetto' && state.run.smela;
        if (state.run.hp >= state.maxHp && !cures) return { ok: false, text: 'sei già al pieno. conservalo per quando piangi.' };
        state.run.hp = Math.min(state.maxHp, state.run.hp + heal);
        if (id === 'rubinetto') state.run.smela = false;
    } else if (id === 'energetico') {
        if (state.run.flow >= state.maxFlow) return { ok: false, text: 'il flow è già al massimo. il cuore ringrazia.' };
        state.run.flow = Math.min(state.maxFlow, state.run.flow + state.maxFlow / 2);
    } else if (id === 'caffe-mensa') {
        state.run.caffeMs = 40000;
    } else if (id === 'santino') {
        if (state.run.santino) return { ok: false, text: 'guggu ti protegge già. non esagerare con la fede.' };
        state.run.santino = true;
    }

    state.removeItem(id);
    sfx.heal();
    emitVitals();
    bus.emit('inventory-changed', {});
    return { ok: true, text: `${def.name}: fatto.` };
}

/** il tasto rapido: mangia la cura più piccola che basta */
export function quickHeal(): string {
    const order = ['crocchetta', 'rubinetto', 'panino-nonna'];
    const id = order.find((i) => state.count(i) > 0);
    if (!id) return 'niente da mangiare nello zaino. wavezon consegna ovunque.';
    return useItem(id).text;
}
