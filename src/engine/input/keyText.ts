import { ACTIONS, bindingLabel, bindingsFor, type Action } from './actions';
import { bus } from '../events';

/* nei testi si scrive {k:azione}: a schermo compare il tasto vero del
   dispositivo in uso, così una rimappatura aggiorna tutto da sola */

let device: 'tastiera' | 'gamepad' = 'tastiera';
bus.on('input-device', ({ device: d }) => {
    device = d;
});

export function currentDevice(): 'tastiera' | 'gamepad' {
    return device;
}

/** etichette del pad con mappatura standard */
function padLabel(a: Action): string {
    switch (a) {
        case 'left': return '←';
        case 'right': return '→';
        case 'up': return '↑';
        case 'down': return '↓';
        case 'jump': return 'A';
        case 'attack': return 'X';
        case 'dash': return 'B';
        case 'wave': return 'Y';
        case 'scudo': return 'RB';
        case 'riflesso': return 'LB';
        case 'heal': return 'RT';
        case 'eat': return 'LT';
        case 'interact': return '↑';
        case 'phone': return 'VIEW';
        case 'pause': return 'START';
    }
}

/** l'etichetta del primo tasto legato all'azione, per il dispositivo in uso */
export function keyLabel(a: Action): string {
    if (device === 'gamepad') return padLabel(a);
    const first = bindingsFor(a)[0];
    if (!first) return '?';
    return bindingLabel(first);
}

/** sostituisce {k:azione} con l'etichetta del tasto */
export function formatKeys(text: string): string {
    return text.replace(/\{k:([a-z]+)\}/g, (whole, name) => {
        const action = name as Action;
        if (!ACTIONS.includes(action)) return whole;
        return keyLabel(action);
    });
}
