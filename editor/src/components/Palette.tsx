import { useMemo, useState } from 'react';
import { buildCatalog, type PaletteGroup, type PaletteItem } from '@/lib/catalog';
import { useEditor } from '@/state/editorStore';
import type { BakedTextures } from '@/lib/textureBaker';
import { SpriteIcon } from './SpriteIcon';
import { cn } from '@/lib/utils';

const GROUPS: { id: PaletteGroup; label: string }[] = [
    { id: 'tile', label: 'tile' },
    { id: 'nemici', label: 'nemici' },
    { id: 'npc', label: 'npc' },
    { id: 'boss', label: 'boss' },
    { id: 'abilita', label: 'abilità' },
    { id: 'oggetti', label: 'oggetti' },
];

export function Palette({ baked }: { baked: BakedTextures }) {
    const catalog = useMemo(() => buildCatalog(), []);
    const [group, setGroup] = useState<PaletteGroup>('tile');
    const [filter, setFilter] = useState('');
    const brush = useEditor((s) => s.brush);
    const def = useEditor((s) => s.def);
    const setBrushGlyph = useEditor((s) => s.setBrushGlyph);
    const setBrushEntity = useEditor((s) => s.setBrushEntity);

    const items = catalog[group].filter((it) => it.label.toLowerCase().includes(filter.toLowerCase()));

    const activeId = (it: PaletteItem): boolean => {
        if (it.glyph) return brush === it.glyph;
        if (!def || !it.spec) return false;
        const letter = Object.entries(def.entities).find(([, s]) => JSON.stringify(s) === JSON.stringify(it.spec))?.[0];
        return !!letter && letter === brush;
    };

    const pick = (it: PaletteItem) => {
        if (it.glyph) setBrushGlyph(it.glyph);
        else if (it.spec) setBrushEntity(it.spec);
    };

    return (
        <div className="flex h-full flex-col">
            <div className="flex flex-wrap gap-1 border-b border-line p-2">
                {GROUPS.map((g) => (
                    <button
                        key={g.id}
                        onClick={() => setGroup(g.id)}
                        className={cn(
                            'rounded px-2 py-1 text-xs',
                            group === g.id ? 'bg-acid text-black' : 'bg-panel-2 text-neutral-400 hover:text-white',
                        )}
                    >
                        {g.label}
                    </button>
                ))}
            </div>
            <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="filtra…"
                className="m-2 rounded bg-panel-2 px-2 py-1 text-xs outline-none placeholder:text-neutral-600"
            />
            <div className="grid flex-1 grid-cols-2 content-start gap-1 overflow-y-auto p-2">
                {items.map((it) => (
                    <button
                        key={it.id}
                        onClick={() => pick(it)}
                        title={it.meta}
                        className={cn(
                            'flex items-center gap-2 rounded border p-1.5 text-left',
                            activeId(it) ? 'border-acid bg-acid/10' : 'border-line bg-panel-2 hover:border-neutral-600',
                        )}
                    >
                        {it.texture || it.glyph ? (
                            <SpriteIcon baked={baked} texture={it.texture} size={32} />
                        ) : (
                            <span className="flex h-8 w-8 items-center justify-center rounded bg-ink text-sm text-neutral-500">
                                {it.glyph}
                            </span>
                        )}
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs">{it.label}</span>
                            {it.meta && <span className="block truncate text-[10px] text-neutral-500">{it.meta}</span>}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
