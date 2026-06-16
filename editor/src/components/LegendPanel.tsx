import { useMemo } from 'react';
import { Trash2 } from 'lucide-react';
import { useEditor } from '@/state/editorStore';
import { textureForSpec } from '@/lib/catalog';
import type { BakedTextures } from '@/lib/textureBaker';
import { SpriteIcon } from './SpriteIcon';
import { cn } from '@/lib/utils';

function describe(spec: import('@game/types').EntitySpec): string {
    switch (spec.type) {
        case 'enemy':
            return `nemico · ${spec.kind}`;
        case 'boss':
            return `boss · ${spec.kind}`;
        case 'npc':
            return `npc · ${spec.id}`;
        case 'lore':
            return `lore · ${spec.id}`;
        case 'ability':
            return `abilità · ${spec.ability}`;
        case 'barre':
            return `barre · ${spec.amount}`;
        case 'portal':
            return `portale → ${spec.to || '?'}`;
        default:
            return spec.type;
    }
}

export function LegendPanel({ baked }: { baked: BakedTextures }) {
    const def = useEditor((s) => s.def);
    const brush = useEditor((s) => s.brush);
    const setBrushGlyph = useEditor((s) => s.setBrushGlyph);
    const setEntities = useEditor((s) => s.setEntities);

    const usage = useMemo(() => {
        const map: Record<string, number> = {};
        if (def) for (const row of def.grid) for (const ch of row) map[ch] = (map[ch] ?? 0) + 1;
        return map;
    }, [def]);

    if (!def) return null;
    const entries = Object.entries(def.entities);

    const remove = (letter: string) => {
        const next = { ...def.entities };
        delete next[letter];
        setEntities(next);
    };

    return (
        <div className="flex h-full flex-col">
            <div className="border-b border-line px-3 py-2 text-xs font-semibold text-neutral-300">
                legenda ({entries.length})
            </div>
            <div className="flex-1 overflow-y-auto p-2">
                {entries.length === 0 && <p className="p-2 text-xs text-neutral-600">nessuna entità</p>}
                {entries.map(([letter, spec]) => {
                    const count = usage[letter] ?? 0;
                    return (
                        <div
                            key={letter}
                            className={cn(
                                'mb-1 flex items-center gap-2 rounded border p-1.5',
                                brush === letter ? 'border-acid bg-acid/10' : 'border-line bg-panel-2',
                            )}
                        >
                            <button onClick={() => setBrushGlyph(letter)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                                <span className="flex h-6 w-6 items-center justify-center rounded bg-ink font-mono text-sm text-acid">
                                    {letter}
                                </span>
                                <SpriteIcon baked={baked} texture={textureForSpec(spec)} size={24} />
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-xs">{describe(spec)}</span>
                                    <span className={cn('text-[10px]', count === 0 ? 'text-orange-400' : 'text-neutral-500')}>
                                        {count === 0 ? 'inutilizzata' : `${count} in griglia`}
                                    </span>
                                </span>
                            </button>
                            <button
                                onClick={() => remove(letter)}
                                title="rimuovi dalla legenda"
                                className="rounded p-1 text-neutral-500 hover:text-red-400"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
