/* il mondo a regioni: ogni capitolo diventa una regione di stanze collegate.
   tutto in celle da 32px, coordinate di griglia */

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
