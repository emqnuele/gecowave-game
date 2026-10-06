/* il mondo a regioni: ogni capitolo diventa una regione di stanze collegate.
   tutto in celle da 32px, coordinate di griglia */

import type { AbilityId } from '../types';

export interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
}

export type RoomKind =
    | 'start' | 'exit' | 'hall' | 'shaft' | 'cave' | 'arena'
    | 'rest' | 'secret' | 'gauntlet' | 'pool';

export interface Room {
    id: number;
    /** posizione e misura in slot della macro-griglia */
    sx: number;
    sy: number;
    sw: number;
    sh: number;
    /** rettangolo in celle, bordi compresi */
    rect: Rect;
    kind: RoomKind;
    /** ordine sul percorso critico; -1 per le stanze laterali */
    pathIndex: number;
    /** per le stanze laterali: la stanza del percorso da cui partono */
    anchor: number;
    /** a cielo aperto: niente soffitto, si vede il parallasse */
    surface: boolean;
}

export type DoorKind = 'open' | 'fake' | 'breakable' | 'drop';

export interface Door {
    a: number;
    b: number;
    /** h = stanze affiancate (passaggio nel muro), v = una sopra l'altra (buco nel pavimento) */
    axis: 'h' | 'v';
    /** prima cella dell'apertura e lunghezza */
    x: number;
    y: number;
    len: number;
    kind: DoorKind;
}

/* sigilli delle abilità: una porta laterale chiusa da una situazione che una
   sola wave risolve. il premio sta in uno spot verificato, la chiave è nel save */

export type SealKind =
    | 'cortina' | 'rimbalzo' | 'specchio' | 'risonanza' | 'miasma'
    | 'camino' | 'resina' | 'teorema' | 'ricevitore';

export type SealReward =
    | { kind: 'barre'; amount: number }
    | { kind: 'cuore' }
    | { kind: 'tacca' }
    | { kind: 'item'; item: string };

export interface AbilitySeal {
    /** stabile tra rigenerazioni: `${regionId}-${kind}` */
    id: string;
    kind: SealKind;
    ability: AbilityId;
    /** stanza laterale premiata e porta che la collega alla strada principale */
    room: number;
    door: { a: number; b: number; axis: 'h' | 'v'; x: number; y: number; len: number; kind: DoorKind };
    /** punto in piedi verificato per il premio, in celle */
    reward: { c: number; r: number };
    prize: SealReward;
    /** l'indizio è parte del sigillo, non un pickup */
    mark33: true;
}

/* nicchie di geometria vera già verificate dal simulatore: mensola per il
   doppio salto, camino per l'aggrappo. il simulatore resta l'autorità */
export interface PhysicalAbilityGate {
    kind: 'camino' | 'mensola';
    ability: 'aggrappo' | 'rimbalzo';
    room: number;
    reward: { c: number; r: number };
}

export interface RegionLayout {
    id: string;
    cols: number;
    rows: number;
    slotW: number;
    slotH: number;
    macroW: number;
    macroH: number;
    rooms: Room[];
    doors: Door[];
    pathLength: number;
    /** quota del terreno in superficie, in celle: il parallasse ci si appoggia */
    horizonRow: number;
    /** coppie [vecchia x in celle, progresso sul percorso], ordinate per x:
        agguati e trigger del capitolo lineare si ritrovano nella regione */
    progressPairs: [number, number][];
    /** posizioni in piedi verificate col geco simulato (colonna, riga, stanza):
        missioni e oggetti messi qui sono sempre raggiungibili e mai trappole */
    spots?: [number, number, number][];
    /** corse contro il citelis tra microfoni consecutivi, misurate col geco simulato */
    trials?: TrialLeg[];
    /** nicchie dei cancelli fisici già costruiti: dopo la rigenerazione i sigilli ci si agganciano */
    abilityGates?: PhysicalAbilityGate[];
    /** sigilli delle abilità, solo in stanze laterali: mai sul percorso critico */
    seals?: AbilitySeal[];
}

export interface TrialLeg {
    /** id dei microfoni come li chiama il LevelLoader: cp-colonna-riga */
    from: string;
    to: string;
    /** fotogrammi a 60 al secondo, sommando i macro più rapidi */
    frames: number;
}

/** progresso sul percorso corrispondente a una x del vecchio capitolo lineare */
export function oldXToProgress(layout: RegionLayout, oldX: number): number {
    const pairs = layout.progressPairs;
    for (let i = 1; i < pairs.length; i++) {
        const [x0, p0] = pairs[i - 1];
        const [x1, p1] = pairs[i];
        if (oldX <= x1) return x1 === x0 ? p1 : p0 + ((oldX - x0) / (x1 - x0)) * (p1 - p0);
    }
    return layout.pathLength - 1;
}

/** come si muove il geco, in celle */
export interface Moves {
    rise: number;
    run: number;
}
