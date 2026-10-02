import type { LevelDef } from '../../types';

/* la piazza: l'hub del realm. ci si arriva col citelis da qualsiasi fermata
   dopo guggu. niente nemici: botteghe, il bar delle voci, la bacheca delle
   missioni, l'oracolo della mappa. la griglia si disegna da codice perché
   è architettura (palazzi, balconi, portici), non una caverna */

const W = 190;
const H = 32;
const GROUND = 26;

function build(): string[] {
    const g: string[][] = Array.from({ length: H }, () => Array(W).fill('.'));
    const fill = (x0: number, y0: number, x1: number, y1: number, ch = '#') => {
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (x >= 0 && y >= 0 && x < W && y < H) g[y][x] = ch;
    };
    // la strada e il sottosuolo
    fill(0, GROUND + 1, W - 1, H - 1);
    // muri di bordo
    fill(0, 0, 1, H - 1);
    fill(W - 2, 0, W - 1, H - 1);
    // palazzi su portici: il piano terra è aperto, sul lato sinistro si sale
    // a zig-zag tra balconi attaccati al muro e mensole staccate
    const palazzo = (x0: number, w: number, h: number) => {
        const top = GROUND - h;
        fill(x0, top, x0 + w - 1, GROUND - 5);
        // archi del portico: un dente per lato, sotto restano 4 righe libere
        fill(x0 + 1, GROUND - 4, x0 + 1, GROUND - 4);
        fill(x0 + w - 2, GROUND - 4, x0 + w - 2, GROUND - 4);
        // il primo gradino è pieno fino a terra: una mensola bassa sarebbe un muro sul marciapiede
        fill(x0 - 7, GROUND, x0 - 5, GROUND);
        for (let y = GROUND - 6; y > top; y -= 6) fill(x0 - 7, y, x0 - 5, y);
        for (let y = GROUND - 3; y > top; y -= 6) fill(x0 - 3, y, x0 - 1, y);
    };
    palazzo(24, 14, 17);
    palazzo(62, 12, 15);
    palazzo(104, 16, 19);
    palazzo(146, 12, 14);
    // la fontana al centro: un rialzo basso
    fill(86, GROUND - 1, 94, GROUND);
    // gradinata verso il capolinea
    fill(170, GROUND - 1, 186, GROUND);
    fill(176, GROUND - 2, 186, GROUND);
    return g.map((r) => r.join(''));
}

const grid = build();
// entità: spawn al capolinea, microfono alla fontana, la gente
const put = (x: number, y: number, ch: string) => {
    const row = grid[y].split('');
    row[x] = ch;
    grid[y] = row.join('');
};
put(180, GROUND - 3, 'P');
put(90, GROUND - 2, 'C');
put(12, GROUND, 'o');
put(46, GROUND, 'w');
put(52, GROUND, 'q');
put(77, GROUND, 'b');
put(82, GROUND, 'm');
put(130, GROUND, 'n');
put(160, GROUND, 'r');
put(31, GROUND - 18, 'l');
put(112, GROUND - 20, 'k');

export const piazza: LevelDef = {
    id: 'piazza',
    title: 'LA',
    accentWord: 'piazza',
    color: 'yellow',
    biome: 'piazza',
    hub: true,
    punchline: 'il realm crolla, ma il bar è aperto.',
    introDialogue: 'piazza-arrivo',
    ambientNote: 98,
    entities: {
        o: { type: 'npc', id: 'oracolo-mappa' },
        w: { type: 'npc', id: 'bottega-wavezon' },
        q: { type: 'npc', id: 'bacheca-missioni' },
        b: { type: 'npc', id: 'samatt-bar' },
        m: { type: 'npc', id: 'markolino-piazza' },
        n: { type: 'npc', id: 'guastalla-piazza' },
        r: { type: 'npc', id: 'ivan-targa' },
        l: { type: 'lore', id: 'lore-piazza-1' },
        k: { type: 'lore', id: 'lore-piazza-2' },
    },
    grid,
};
