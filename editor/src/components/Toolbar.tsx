import { Pencil, Eraser, Square, PaintBucket, Undo2, Redo2, Move } from 'lucide-react';
import { useEditor, type Tool } from '@/state/editorStore';
import { cn } from '@/lib/utils';

const TOOLS: { id: Tool; icon: typeof Pencil; label: string }[] = [
    { id: 'pencil', icon: Pencil, label: 'matita (b)' },
    { id: 'eraser', icon: Eraser, label: 'gomma (e)' },
    { id: 'rect', icon: Square, label: 'rettangolo (r)' },
    { id: 'fill', icon: PaintBucket, label: 'riempi (g)' },
    { id: 'move', icon: Move, label: 'sposta (v)' },
];

export function Toolbar() {
    const tool = useEditor((s) => s.tool);
    const setTool = useEditor((s) => s.setTool);
    const undo = useEditor((s) => s.undo);
    const redo = useEditor((s) => s.redo);
    const canUndo = useEditor((s) => s.past.length > 0);
    const canRedo = useEditor((s) => s.future.length > 0);

    return (
        <div className="flex items-center gap-1 border-b border-line bg-panel px-2 py-1.5">
            {TOOLS.map((t) => (
                <button
                    key={t.id}
                    onClick={() => setTool(t.id)}
                    title={t.label}
                    className={cn(
                        'rounded p-1.5',
                        tool === t.id ? 'bg-acid text-black' : 'text-neutral-400 hover:bg-panel-2 hover:text-white',
                    )}
                >
                    <t.icon size={16} />
                </button>
            ))}
            <div className="mx-1 h-5 w-px bg-line" />
            <button
                onClick={undo}
                disabled={!canUndo}
                title="annulla"
                className="rounded p-1.5 text-neutral-400 hover:bg-panel-2 hover:text-white disabled:opacity-30"
            >
                <Undo2 size={16} />
            </button>
            <button
                onClick={redo}
                disabled={!canRedo}
                title="ripeti"
                className="rounded p-1.5 text-neutral-400 hover:bg-panel-2 hover:text-white disabled:opacity-30"
            >
                <Redo2 size={16} />
            </button>
        </div>
    );
}
