import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X, GitCommitHorizontal, Download, Loader2 } from 'lucide-react';
import type { LevelDef } from '@game/types';
import { getHistory, getSourceAt, type Commit } from '@/lib/api';
import { parseLevelSource } from '@/lib/parseLevel';
import { renderLevelFit, diffCells } from '@/lib/render';
import type { BakedTextures } from '@/lib/textureBaker';
import { useEditor } from '@/state/editorStore';
import { cn } from '@/lib/utils';

function when(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function HistoryModal({ baked, file, current, onClose }: { baked: BakedTextures; file: string; current: LevelDef; onClose: () => void }) {
    const [commits, setCommits] = useState<Commit[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [sel, setSel] = useState<Commit | null>(null);
    const [preview, setPreview] = useState<LevelDef | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const applyDef = useEditor((s) => s.applyDef);

    useEffect(() => {
        getHistory(file).then(setCommits).catch((e) => setError(String(e)));
    }, [file]);

    useEffect(() => {
        if (!sel) return;
        setLoadingPreview(true);
        setError(null);
        getSourceAt(sel.path, sel.sha)
            .then((src) => setPreview(parseLevelSource(src)))
            .catch((e) => setError(String(e)))
            .finally(() => setLoadingPreview(false));
    }, [sel]);

    useEffect(() => {
        const cv = canvasRef.current;
        if (!preview || !cv) return;
        const render = () => {
            if (cv.clientWidth > 0 && cv.clientHeight > 0) {
                renderLevelFit(cv, baked, preview, diffCells(current, preview));
            }
        };
        const raf = requestAnimationFrame(render);
        const ro = new ResizeObserver(render);
        ro.observe(cv);
        return () => {
            cancelAnimationFrame(raf);
            ro.disconnect();
        };
    }, [preview, baked, current]);

    const load = () => {
        if (!preview) return;
        applyDef(preview);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onMouseDown={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                onMouseDown={(e) => e.stopPropagation()}
                className="surface flex h-[80vh] w-[min(1000px,92vw)] flex-col overflow-hidden rounded-xl border border-line shadow-2xl"
            >
                <div className="flex items-center justify-between border-b border-line px-4 py-3">
                    <div className="flex items-center gap-2">
                        <GitCommitHorizontal size={16} className="text-acid" />
                        <span className="text-sm font-semibold">cronologia · {file}</span>
                    </div>
                    <button onClick={onClose} className="rounded p-1 text-neutral-400 hover:bg-panel-2 hover:text-white">
                        <X size={16} />
                    </button>
                </div>

                <div className="flex min-h-0 flex-1">
                    {/* lista commit */}
                    <div className="w-80 shrink-0 overflow-y-auto border-r border-line">
                        {error && <p className="p-3 text-xs text-red-400">{error}</p>}
                        {!commits && !error && (
                            <div className="flex items-center gap-2 p-3 text-xs text-neutral-500">
                                <Loader2 size={14} className="animate-spin" /> carico la cronologia…
                            </div>
                        )}
                        {commits?.length === 0 && <p className="p-3 text-xs text-neutral-500">nessun commit per questo file</p>}
                        {commits?.map((c) => (
                            <button
                                key={c.sha}
                                onClick={() => setSel(c)}
                                className={cn(
                                    'block w-full border-b border-line/60 px-3 py-2 text-left hover:bg-panel-2',
                                    sel?.sha === c.sha && 'bg-acid/10',
                                )}
                            >
                                <div className="truncate text-xs text-neutral-200">{c.message}</div>
                                <div className="mt-0.5 flex items-center gap-2 text-[10px] text-neutral-500">
                                    <span className="font-mono text-acid-dim">{c.sha.slice(0, 7)}</span>
                                    <span>{c.author}</span>
                                    <span>· {when(c.date)}</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* anteprima della versione selezionata */}
                    <div className="flex min-w-0 flex-1 flex-col bg-[#08080c]">
                        {!sel ? (
                            <div className="flex flex-1 items-center justify-center text-xs text-neutral-600">
                                seleziona un commit per vedere quella versione
                            </div>
                        ) : loadingPreview ? (
                            <div className="flex flex-1 items-center justify-center text-neutral-500">
                                <Loader2 size={18} className="animate-spin" />
                            </div>
                        ) : (
                            <>
                                <div className="min-h-0 flex-1 p-3">
                                    <canvas ref={canvasRef} className="h-full w-full" />
                                </div>
                                <div className="flex items-center justify-between border-t border-line px-4 py-3">
                                    <span className="text-[11px] text-neutral-500">
                                        <span className="mr-1 inline-block h-2 w-2 rounded-sm bg-amber-500 align-middle" />
                                        celle diverse dalla versione attuale
                                    </span>
                                    <button
                                        onClick={load}
                                        className="flex items-center gap-2 rounded-md bg-acid px-3 py-1.5 text-xs font-semibold text-black hover:brightness-110"
                                    >
                                        <Download size={14} /> carica questa versione
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
