import type { EntitySpec, AbilityId } from '@game/types';
import { ENEMIES } from '@game/content/enemies';
import { BOSSES } from '@game/content/bosses';
import { DIALOGUES, ABILITY_CARDS } from '@game/content/story';
import { npcTexture } from '@game/engine/npcTexture';

/* un elemento piazzabile dalla palette: o un'entit� della legenda,
   o un glyph di tile fisso. la texture � una chiave bakata da phaser. */
export interface PaletteItem {
    id: string;
    group: PaletteGroup;
    label: string;
    /** chiave texture per l'anteprima, o null per tile disegnati a mano */
    texture: string | null;
    /** spec da inserire in legenda; null per i glyph di tile */
    spec: EntitySpec | null;
    /** glyph fisso per i tile (#, ^, ~, P, C, X, .) */
    glyph?: string;
    meta?: string;
}

export type PaletteGroup = 'tile' | 'nemici' | 'npc' | 'boss' | 'abilita' | 'oggetti';

export const TILE_ITEMS: PaletteItem[] = [
    { id: 'tile-empty', group: 'tile', label: 'vuoto', texture: null, spec: null, glyph: '.' },
    { id: 'tile-wall', group: 'tile', label: 'terreno', texture: 'tile-wall', spec: null, glyph: '#' },
    { id: 'tile-fake', group: 'tile', label: 'muro finto', texture: 'tile-fake', spec: null, glyph: 'F' },
    { id: 'tile-break', group: 'tile', label: 'muro distruttibile', texture: 'tile-break', spec: null, glyph: '%' },
    { id: 'tile-spike', group: 'tile', label: 'spine', texture: 'spikes', spec: null, glyph: '^' },
    { id: 'tile-water', group: 'tile', label: 'acqua', texture: null, spec: null, glyph: '~' },
    { id: 'tile-spawn', group: 'tile', label: 'spawn', texture: null, spec: null, glyph: 'P' },
    { id: 'tile-checkpoint', group: 'tile', label: 'microfono', texture: 'mic', spec: null, glyph: 'C' },
    { id: 'tile-exit', group: 'tile', label: 'uscita', texture: null, spec: null, glyph: 'X' },
];

function enemyItems(): PaletteItem[] {
    return Object.values(ENEMIES).map((e) => ({
        id: `enemy-${e.kind}`,
        group: 'nemici',
        label: e.kind,
        texture: e.texture,
        spec: { type: 'enemy', kind: e.kind },
        meta: `${e.behavior} · ${e.hp}hp`,
    }));
}

function bossItems(): PaletteItem[] {
    return Object.values(BOSSES).map((b) => ({
        id: `boss-${b.kind}`,
        group: 'boss',
        label: b.kind,
        texture: b.texture,
        spec: { type: 'boss', kind: b.kind },
        meta: `${b.name} · ${b.hp}hp`,
    }));
}

function dialogueIds(): { npc: string[]; lore: string[] } {
    const npc: string[] = [];
    const lore: string[] = [];
    for (const id of Object.keys(DIALOGUES)) {
        if (id.startsWith('lore-')) lore.push(id);
        else npc.push(id);
    }
    return { npc, lore };
}

function npcItems(): PaletteItem[] {
    return dialogueIds().npc.map((id) => ({
        id: `npc-${id}`,
        group: 'npc',
        label: id,
        texture: npcTexture(id),
        spec: { type: 'npc', id },
    }));
}

function abilityItems(): PaletteItem[] {
    return (Object.keys(ABILITY_CARDS) as AbilityId[]).map((ability) => ({
        id: `ability-${ability}`,
        group: 'abilita',
        label: ABILITY_CARDS[ability].name,
        texture: 'fragment',
        spec: { type: 'ability', ability },
        meta: ABILITY_CARDS[ability].desc,
    }));
}

function objectItems(): PaletteItem[] {
    const lore = dialogueIds().lore.map<PaletteItem>((id) => ({
        id: `lore-${id}`,
        group: 'oggetti',
        label: id,
        texture: 'lore-tablet',
        spec: { type: 'lore', id },
    }));
    const fixed: PaletteItem[] = [
        { id: 'obj-barre', group: 'oggetti', label: 'barre (10)', texture: 'barra', spec: { type: 'barre', amount: 10 } },
        { id: 'obj-cuore', group: 'oggetti', label: 'cuore', texture: 'cuore', spec: { type: 'cuore' } },
        { id: 'obj-maschera', group: 'oggetti', label: 'maschera', texture: 'maschera', spec: { type: 'maschera' } },
        { id: 'obj-portal', group: 'oggetti', label: 'portale', texture: 'portal', spec: { type: 'portal', to: '' } },
    ];
    return [...fixed, ...lore];
}

export function buildCatalog(): Record<PaletteGroup, PaletteItem[]> {
    return {
        tile: TILE_ITEMS,
        nemici: enemyItems(),
        npc: npcItems(),
        boss: bossItems(),
        abilita: abilityItems(),
        oggetti: objectItems(),
    };
}

/** chiave texture per una spec di entit�, per disegnarla sulla griglia */
export function textureForSpec(spec: EntitySpec): string {
    switch (spec.type) {
        case 'enemy':
            return ENEMIES[spec.kind]?.texture ?? 'enemy-glitchetto';
        case 'boss':
            return BOSSES[spec.kind]?.texture ?? 'boss-guggu';
        case 'npc':
            return npcTexture(spec.id);
        case 'lore':
            return 'lore-tablet';
        case 'ability':
            return 'fragment';
        case 'barre':
            return 'barra';
        case 'cuore':
            return 'cuore';
        case 'maschera':
            return 'maschera';
        case 'portal':
            return 'portal';
        case 'spawner':
            return 'spawner-nest';
        case 'item':
            return 'fragment';
    }
}

/** etichetta leggibile per una spec di entita (pannelli e overlay) */
export function describeSpec(spec: EntitySpec): string {
    switch (spec.type) {
        case 'enemy':
            return `nemico: ${spec.kind}`;
        case 'boss':
            return `boss: ${spec.kind}`;
        case 'npc':
            return `npc: ${spec.id}`;
        case 'lore':
            return `lore: ${spec.id}`;
        case 'ability':
            return `abilita: ${spec.ability}`;
        case 'barre':
            return `barre: ${spec.amount}`;
        case 'cuore':
            return 'cuore';
        case 'maschera':
            return 'maschera';
        case 'portal':
            return `portale -> ${spec.to || '?'}`;
        case 'spawner':
            return `nido: ${spec.kind}`;
        case 'item':
            return `oggetto: ${spec.item}${spec.amount && spec.amount > 1 ? ` ×${spec.amount}` : ''}`;
    }
}

const GLYPH_LABEL: Record<string, string> = {
    '.': 'vuoto',
    '#': 'blocco / terreno',
    F: 'muro finto',
    '%': 'muro distruttibile',
    '^': 'spine',
    '~': 'acqua',
    P: 'spawn',
    C: 'microfono (checkpoint)',
    X: 'uscita',
};

/** descrive cosa c'e in una cella: glyph fisso o entita della legenda */
export function describeCell(ch: string, entities: Record<string, EntitySpec>): string {
    if (ch in GLYPH_LABEL) return GLYPH_LABEL[ch];
    const spec = entities[ch];
    if (spec) return describeSpec(spec);
    return `'${ch}' - non in legenda`;
}

/** tutte le chiavi texture richieste dalla palette, per il baker */
export function catalogTextureKeys(): string[] {
    const cat = buildCatalog();
    const keys = new Set<string>();
    for (const items of Object.values(cat)) {
        for (const it of items) if (it.texture && !it.texture.startsWith('tile-')) keys.add(it.texture);
    }
    return [...keys];
}
