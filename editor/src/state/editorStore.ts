import { create } from 'zustand';
import type { EntitySpec, LevelDef } from '@game/types';
import { loadLevelFiles, type LoadedLevelFile } from '@/lib/levels';

export type Tool = 'pencil' | 'eraser' | 'rect' | 'fill' | 'move';

/* glyph riservati dalla griglia: non possono essere lettere di legenda */
const RESERVED = new Set(['.', '#', 'F', '%', '^', '~', 'P', 'C', 'X']);

const LETTER_POOL = (() => {
    const pool: string[] = [];
    const push = (a: number, b: number) => {
        for (let c = a; c <= b; c++) pool.push(String.fromCharCode(c));
    };
    push(97, 122); // a-z
    push(65, 90); // A-Z
    push(48, 57); // 0-9
    return pool.filter((c) => !RESERVED.has(c));
})();

const sameSpec = (a: EntitySpec, b: EntitySpec): boolean => JSON.stringify(a) === JSON.stringify(b);

interface Snapshot {
    grid: string[];
    entities: Record<string, EntitySpec>;
}

interface EditorState {
    files: LoadedLevelFile[];
    current: LoadedLevelFile | null;
    def: LevelDef | null;
    tool: Tool;
    brush: string; // carattere che la matita scrive
    dirty: boolean;
    past: Snapshot[];
    future: Snapshot[];
    /** incrementato quando il canvas deve rifare il fit (apri/carica livello) */
    fitNonce: number;

    init: () => void;
    selectLevel: (file: string) => void;
    setTool: (t: Tool) => void;
    setBrushGlyph: (glyph: string) => void;
    /** assegna (o riusa) una lettera di legenda per lo spec e la rende brush */
    setBrushEntity: (spec: EntitySpec) => void;
    paint: (c: number, r: number, ch: string) => void;
    paintRect: (c0: number, r0: number, c1: number, r1: number, ch: string) => void;
    floodFill: (c: number, r: number, ch: string) => void;
    /** legge il carattere a una cella (per il tool sposta) */
    charAt: (c: number, r: number) => string;
    /** sposta il contenuto di una cella in un'altra (sovrascrive la destinazione) */
    moveCell: (fromC: number, fromR: number, toC: number, toR: number) => void;
    commit: () => void; // chiude un tratto: salva snapshot per undo
    beginStroke: () => void;
    undo: () => void;
    redo: () => void;
    patchMeta: (patch: Partial<LevelDef>) => void;
    /** carica un intero LevelDef (es. una versione storica) come copia di lavoro */
    applyDef: (def: LevelDef) => void;
    setEntities: (entities: Record<string, EntitySpec>) => void;
    resize: (cols: number, rows: number) => void;
}

function snapshot(def: LevelDef): Snapshot {
    return { grid: [...def.grid], entities: structuredClone(def.entities) };
}

export const useEditor = create<EditorState>((set, get) => ({
    files: [],
    current: null,
    def: null,
    tool: 'pencil',
    brush: '#',
    dirty: false,
    past: [],
    future: [],
    fitNonce: 0,

    init: () => {
        const files = loadLevelFiles();
        set({ files });
    },

    selectLevel: (file) => {
        const current = get().files.find((f) => f.file === file) ?? null;
        set({
            current,
            def: current ? structuredClone(current.def) : null,
            past: [],
            future: [],
            dirty: false,
        });
    },

    setTool: (tool) => set({ tool }),
    setBrushGlyph: (brush) => set({ brush, tool: get().tool === 'eraser' ? 'pencil' : get().tool }),

    setBrushEntity: (spec) => {
        const def = get().def;
        if (!def) return;
        const existing = Object.entries(def.entities).find(([, s]) => sameSpec(s, spec));
        if (existing) {
            set({ brush: existing[0] });
            return;
        }
        const used = new Set(Object.keys(def.entities));
        const letter = LETTER_POOL.find((c) => !used.has(c));
        if (!letter) {
            alert('finite le lettere di legenda disponibili');
            return;
        }
        get().beginStroke();
        set({
            def: { ...def, entities: { ...def.entities, [letter]: spec } },
            brush: letter,
            dirty: true,
        });
    },

    beginStroke: () => {
        const def = get().def;
        if (!def) return;
        set({ past: [...get().past, snapshot(def)], future: [] });
    },

    commit: () => set({ dirty: true }),

    paint: (c, r, ch) => {
        const def = get().def;
        if (!def) return;
        const grid = [...def.grid];
        const width = Math.max(...grid.map((row) => row.length));
        const row = (grid[r] ?? '').padEnd(width, '.');
        if (c < 0 || c >= width || r < 0 || r >= grid.length) return;
        grid[r] = row.slice(0, c) + ch + row.slice(c + 1);
        set({ def: { ...def, grid }, dirty: true });
    },

    paintRect: (c0, r0, c1, r1, ch) => {
        const def = get().def;
        if (!def) return;
        const grid = [...def.grid];
        const width = Math.max(...grid.map((row) => row.length));
        const [ra, rb] = [Math.min(r0, r1), Math.max(r0, r1)];
        const [ca, cb] = [Math.min(c0, c1), Math.max(c0, c1)];
        for (let r = ra; r <= rb && r < grid.length; r++) {
            let row = (grid[r] ?? '').padEnd(width, '.').split('');
            for (let c = ca; c <= cb && c < width; c++) row[c] = ch;
            grid[r] = row.join('');
        }
        set({ def: { ...def, grid }, dirty: true });
    },

    floodFill: (c, r, ch) => {
        const def = get().def;
        if (!def) return;
        const grid = def.grid.map((row) => row.split(''));
        const width = Math.max(...grid.map((row) => row.length));
        for (const row of grid) while (row.length < width) row.push('.');
        const target = grid[r]?.[c];
        if (target === undefined || target === ch) return;
        const stack: [number, number][] = [[c, r]];
        while (stack.length) {
            const [cc, rr] = stack.pop()!;
            if (rr < 0 || rr >= grid.length || cc < 0 || cc >= width) continue;
            if (grid[rr][cc] !== target) continue;
            grid[rr][cc] = ch;
            stack.push([cc + 1, rr], [cc - 1, rr], [cc, rr + 1], [cc, rr - 1]);
        }
        set({ def: { ...def, grid: grid.map((row) => row.join('')) }, dirty: true });
    },

    charAt: (c, r) => {
        const def = get().def;
        return def?.grid[r]?.[c] ?? '.';
    },

    moveCell: (fromC, fromR, toC, toR) => {
        const def = get().def;
        if (!def) return;
        if (fromC === toC && fromR === toR) return;
        const ch = def.grid[fromR]?.[fromC] ?? '.';
        if (ch === '.') return;
        const width = Math.max(...def.grid.map((row) => row.length));
        const grid = def.grid.map((row) => row.padEnd(width, '.').split(''));
        if (toR < 0 || toR >= grid.length || toC < 0 || toC >= width) return;
        grid[fromR][fromC] = '.';
        grid[toR][toC] = ch;
        set({ def: { ...def, grid: grid.map((row) => row.join('')) }, dirty: true });
    },

    undo: () => {
        const { past, def } = get();
        if (!def || past.length === 0) return;
        const prev = past[past.length - 1];
        set({
            past: past.slice(0, -1),
            future: [snapshot(def), ...get().future],
            def: { ...def, grid: prev.grid, entities: prev.entities },
            dirty: true,
        });
    },

    redo: () => {
        const { future, def } = get();
        if (!def || future.length === 0) return;
        const next = future[0];
        set({
            future: future.slice(1),
            past: [...get().past, snapshot(def)],
            def: { ...def, grid: next.grid, entities: next.entities },
            dirty: true,
        });
    },

    patchMeta: (patch) => {
        const def = get().def;
        if (!def) return;
        set({ def: { ...def, ...patch }, dirty: true });
    },

    applyDef: (incoming) => {
        const def = get().def;
        if (!def) return;
        get().beginStroke();
        // la versione storica e un LevelDef completo; rifa il fit dopo
        set({ def: structuredClone(incoming), dirty: true, fitNonce: get().fitNonce + 1 });
    },

    setEntities: (entities) => {
        const def = get().def;
        if (!def) return;
        get().beginStroke();
        set({ def: { ...def, entities }, dirty: true });
    },

    resize: (cols, rows) => {
        const def = get().def;
        if (!def) return;
        get().beginStroke();
        const grid: string[] = [];
        for (let r = 0; r < rows; r++) {
            const old = def.grid[r] ?? '';
            grid.push(old.slice(0, cols).padEnd(cols, '.'));
        }
        set({ def: { ...def, grid }, dirty: true });
    },
}));
