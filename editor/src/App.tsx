import { useEffect } from 'react';
import { useEditor } from '@/state/editorStore';
import { useTextures } from '@/state/useTextures';
import { GridCanvas } from '@/components/GridCanvas';
import { Palette } from '@/components/Palette';
import { Toolbar } from '@/components/Toolbar';
import { LegendPanel } from '@/components/LegendPanel';
import { MetaPanel } from '@/components/MetaPanel';
import { cn } from '@/lib/utils';

export function App() {
    const { baked, error } = useTextures();
    const init = useEditor((s) => s.init);
    const files = useEditor((s) => s.files);
    const current = useEditor((s) => s.current);
    const dirty = useEditor((s) => s.dirty);
    const selectLevel = useEditor((s) => s.selectLevel);

    useEffect(() => init(), [init]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'SELECT') return;
            const st = useEditor.getState();
            if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
                e.preventDefault();
                e.shiftKey ? st.redo() : st.undo();
            } else if (e.key === 'b') st.setTool('pencil');
            else if (e.key === 'e') st.setTool('eraser');
            else if (e.key === 'r') st.setTool('rect');
            else if (e.key === 'g') st.setTool('fill');
            else if (e.key === 'v') st.setTool('move');
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    return (
        <div className="flex h-full flex-col">
            <header className="surface flex h-14 shrink-0 items-center gap-3 border-b border-line px-4">
                <div className="flex items-center gap-2">
                    <span className="grid h-6 w-6 place-items-center rounded-md bg-acid text-xs font-black text-black">G</span>
                    <span className="font-bold tracking-tight text-acid">GECOWAVE</span>
                    <span className="rounded bg-panel-2 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-neutral-500">
                        editor · dev
                    </span>
                </div>
                <div className="mx-1 h-5 w-px bg-line" />
                <select
                    value={current?.file ?? ''}
                    onChange={(e) => selectLevel(e.target.value)}
                    className="rounded-md border border-line bg-panel-2 px-2.5 py-1.5 text-xs outline-none transition-colors hover:border-neutral-600 focus:border-acid"
                >
                    <option value="">— apri livello —</option>
                    {files.map((f) => (
                        <option key={f.file} value={f.file}>
                            {f.def.id} ({f.file})
                        </option>
                    ))}
                </select>
                {current && (
                    <span className="text-xs text-neutral-500">
                        {current.def.title.toLowerCase()}
                    </span>
                )}
                {dirty && (
                    <span className="ml-auto flex items-center gap-1.5 text-xs text-amber-400">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                        non salvato
                    </span>
                )}
            </header>

            {error && (
                <div className="bg-red-950 px-4 py-2 text-xs text-red-300">errore baking texture: {error}</div>
            )}

            {!baked ? (
                <div className="flex flex-1 items-center justify-center text-neutral-500">cottura texture…</div>
            ) : (
                <div className="flex min-h-0 flex-1">
                    <aside className="surface flex w-72 shrink-0 flex-col border-r border-line">
                        <div className="h-1/2 min-h-0 border-b border-line">
                            <Palette baked={baked} />
                        </div>
                        <div className="h-1/2 min-h-0">
                            <LegendPanel baked={baked} />
                        </div>
                    </aside>

                    <main className={cn('flex min-w-0 flex-1 flex-col', !current && 'items-center justify-center')}>
                        {current ? (
                            <>
                                <Toolbar />
                                <div className="min-h-0 flex-1">
                                    <GridCanvas baked={baked} />
                                </div>
                            </>
                        ) : (
                            <span className="text-neutral-600">scegli un livello dall'alto</span>
                        )}
                    </main>

                    <aside className="surface w-72 shrink-0 border-l border-line">
                        <MetaPanel />
                    </aside>
                </div>
            )}
        </div>
    );
}
