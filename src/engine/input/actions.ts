import { state } from '../state';

/* le azioni del gioco: nessuno legge più tasti fisici, tutti chiedono
   "l'azione X è premuta?". i nomi dei tasti sono quelli di phaser
   ('A', 'SPACE', 'SHIFT', 'LEFT', 'TAB', 'ESC'...) più due pseudo-tasti
   per il mouse: 'MOUSE_LEFT' e 'MOUSE_RIGHT'. */

export type Action =
    | 'left' | 'right' | 'up' | 'down'
    | 'jump' | 'attack' | 'dash'
    | 'wave'
    | 'scudo' | 'riflesso'
    | 'heal'
    | 'eat' | 'interact' | 'phone' | 'pause';

export const ACTIONS: Action[] = [
    'left', 'right', 'up', 'down',
    'jump', 'attack', 'dash',
    'wave', 'scudo', 'riflesso',
    'heal', 'eat', 'interact', 'phone', 'pause',
];

/* nome dell'azione in italiano minuscolo, per la schermata comandi */
export const ACTION_LABEL: Record<Action, string> = {
    left: 'sinistra',
    right: 'destra',
    up: 'su',
    down: 'giù',
    jump: 'salto',
    attack: 'attacco',
    dash: 'scivolata',
    wave: 'wave',
    scudo: 'scudo',
    riflesso: 'riflesso',
    heal: 'cura',
    eat: 'mangia',
    interact: 'interagisci',
    phone: 'telefono',
    pause: 'pausa',
};

export type PresetId = 'classico' | 'frecce';

export const PRESET_LABEL: Record<PresetId, string> = {
    classico: 'classico',
    frecce: 'frecce',
};

export const PRESETS: Record<PresetId, Record<Action, string[]>> = {
    classico: {
        left: ['A'],
        right: ['D'],
        up: ['W'],
        down: ['S'],
        jump: ['SPACE'],
        attack: ['J', 'MOUSE_LEFT'],
        dash: ['K', 'SHIFT'],
        wave: ['L'],
        scudo: ['I', 'MOUSE_RIGHT'],
        riflesso: ['U'],
        heal: ['Q'],
        eat: ['C'],
        interact: ['E'],
        phone: ['TAB', 'P'],
        pause: ['ESC'],
    },
    frecce: {
        left: ['LEFT'],
        right: ['RIGHT'],
        up: ['UP'],
        down: ['DOWN'],
        jump: ['Z'],
        attack: ['X'],
        dash: ['C'],
        wave: ['A'],
        scudo: ['S'],
        riflesso: ['D'],
        heal: ['Q'],
        eat: ['F'],
        interact: ['E'],
        phone: ['TAB'],
        pause: ['ESC'],
    },
};

/* gamepad con mappatura standard w3c: indici dei pulsanti, oppure la
   direzione della levetta sinistra (con la croce 12-15 sempre inclusa).
   interagisci non ha pulsante: è "su" da fermo vicino a qualcosa. */
export const GAMEPAD: Record<Action, number[] | 'stick-left' | 'stick-right' | 'stick-up' | 'stick-down'> = {
    left: 'stick-left',
    right: 'stick-right',
    up: 'stick-up',
    down: 'stick-down',
    jump: [0],
    attack: [2],
    dash: [1],
    wave: [3],
    scudo: [5],
    riflesso: [4],
    heal: [7],
    eat: [6],
    interact: [],
    phone: [8],
    pause: [9],
};

/** i tasti legati all'azione: la rimappatura vince sul preset */
export function bindingsFor(action: Action): string[] {
    const controls = state.settings.controls;
    const custom = controls?.custom?.[action];
    if (custom) return custom;
    const preset = (controls?.preset === 'frecce' ? 'frecce' : 'classico') as PresetId;
    return PRESETS[preset][action];
}

/* conversione tra nomi di phaser e KeyboardEvent.code del dom */
function codesForKey(name: string): string[] {
    switch (name) {
        case 'SPACE': return ['Space'];
        case 'SHIFT': return ['ShiftLeft', 'ShiftRight'];
        case 'TAB': return ['Tab'];
        case 'ESC': return ['Escape'];
        case 'ENTER': return ['Enter'];
        case 'LEFT': return ['ArrowLeft'];
        case 'RIGHT': return ['ArrowRight'];
        case 'UP': return ['ArrowUp'];
        case 'DOWN': return ['ArrowDown'];
        case 'MOUSE_LEFT': return [];
        case 'MOUSE_RIGHT': return [];
        default: break;
    }
    if (/^[A-Z]$/.test(name)) return [`Key${name}`];
    if (/^[0-9]$/.test(name)) return [`Digit${name}`];
    return [];
}

/** i KeyboardEvent.code legati all'azione, per dialoghi e telefono */
export function codesForAction(action: Action): string[] {
    const out: string[] = [];
    for (const key of bindingsFor(action)) {
        for (const code of codesForKey(key)) {
            if (!out.includes(code)) out.push(code);
        }
    }
    return out;
}

/** true se questo evento di tastiera è l'azione col preset attivo */
export function matchesAction(e: KeyboardEvent, action: Action): boolean {
    return codesForAction(action).includes(e.code);
}

/** nome di phaser da un KeyboardEvent.code, o null se non si lega */
export function keyNameForCode(code: string): string | null {
    switch (code) {
        case 'Space': return 'SPACE';
        case 'ShiftLeft':
        case 'ShiftRight': return 'SHIFT';
        case 'Tab': return 'TAB';
        case 'Escape': return 'ESC';
        case 'Enter': return 'ENTER';
        case 'ArrowLeft': return 'LEFT';
        case 'ArrowRight': return 'RIGHT';
        case 'ArrowUp': return 'UP';
        case 'ArrowDown': return 'DOWN';
        default: break;
    }
    if (/^Key[A-Z]$/.test(code)) return code.slice(3);
    if (/^Digit[0-9]$/.test(code)) return code.slice(5);
    return null;
}

/** etichetta leggibile di un singolo tasto di phaser */
export function bindingLabel(name: string): string {
    switch (name) {
        case 'SPACE': return 'SPAZIO';
        case 'SHIFT': return 'SHIFT';
        case 'TAB': return 'TAB';
        case 'ESC': return 'ESC';
        case 'ENTER': return 'INVIO';
        case 'LEFT': return '←';
        case 'RIGHT': return '→';
        case 'UP': return '↑';
        case 'DOWN': return '↓';
        case 'MOUSE_LEFT': return 'CLIC';
        case 'MOUSE_RIGHT': return 'CLIC DX';
        default: return name;
    }
}
