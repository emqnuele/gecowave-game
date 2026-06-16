import { useCallback, useEffect, useRef, useState } from 'react';
import { Maximize2, Plus, Minus } from 'lucide-react';
import { useEditor } from '@/state/editorStore';
import { describeCell } from '@/lib/catalog';
import { CELL, drawGlyph } from '@/lib/render';
import type { BakedTextures } from '@/lib/textureBaker';

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

interface View {
    x: number;
    y: number;
    zoom: number;
}

export function GridCanvas({ baked }: { baked: BakedTextures }) {
    const def = useEditor((s) => s.def);
    const tool = useEditor((s) => s.tool);
    const brush = useEditor((s) => s.brush);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const wrapRef = useRef<HTMLDivElement>(null);
    const [view, setView] = useState<View>({ x: 40, y: 40, zoom: 1 });
    const viewRef = useRef(view);
    viewRef.current = view;

    const spaceDown = useRef(false);
    const drag = useRef({ panning: false, painting: false, sx: 0, sy: 0, ox: 0, oy: 0 });
    const rectStart = useRef<{ c: number; r: number } | null>(null);
    const [hover, setHover] = useState<{ c: number; r: number } | null>(null);
    const [moving, setMoving] = useState<{ char: string; from: { c: number; r: number } } | null>(null);

    const cols = def ? Math.max(...def.grid.map((r) => r.length), 1) : 1;
    const rows = def ? def.grid.length : 1;

    const draw = useCallback(() => {
        const cv = canvasRef.current;
        if (!cv || !def) return;
        const ctx = cv.getContext('2d')!;
        const dpr = window.devicePixelRatio || 1;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, cv.width, cv.height);
        ctx.save();
        ctx.translate(view.x, view.y);
        ctx.scale(view.zoom, view.zoom);

        // ombra/contorno del livello
        ctx.fillStyle = '#0c0c12';
        ctx.fillRect(-2, -2, cols * CELL + 4, rows * CELL + 4);

        for (let r = 0; r < rows; r++) {
            const row = def.grid[r] ?? '';
            for (let c = 0; c < cols; c++) {
                const ch = row[c] ?? '.';
                if (ch === '.') continue;
                // cella sorgente in trascinamento: attenuata
                if (moving && moving.from.c === c && moving.from.r === r) {
                    ctx.globalAlpha = 0.25;
                    drawGlyph(ctx, baked, def, ch, c, r);
                    ctx.globalAlpha = 1;
                    continue;
                }
                drawGlyph(ctx, baked, def, ch, c, r);
            }
        }

        // griglia: visibile solo quando si � abbastanza vicini
        if (view.zoom > 0.5) {
            ctx.strokeStyle = 'rgba(255,255,255,0.05)';
            ctx.lineWidth = 1 / view.zoom;
            for (let c = 0; c <= cols; c++) {
                ctx.beginPath();
                ctx.moveTo(c * CELL, 0);
                ctx.lineTo(c * CELL, rows * CELL);
                ctx.stroke();
            }
            for (let r = 0; r <= rows; r++) {
                ctx.beginPath();
                ctx.moveTo(0, r * CELL);
                ctx.lineTo(cols * CELL, r * CELL);
                ctx.stroke();
            }
        }

        // fantasma dell'elemento in spostamento, sotto il cursore
        if (moving && hover) {
            ctx.globalAlpha = 0.8;
            drawGlyph(ctx, baked, def, moving.char, hover.c, hover.r);
            ctx.globalAlpha = 1;
            ctx.strokeStyle = '#4ade80';
            ctx.lineWidth = 2 / view.zoom;
            ctx.strokeRect(hover.c * CELL, hover.r * CELL, CELL, CELL);
        } else if (hover) {
            ctx.strokeStyle = '#4ade80';
            ctx.lineWidth = 2 / view.zoom;
            ctx.strokeRect(hover.c * CELL, hover.r * CELL, CELL, CELL);
        }
        ctx.restore();
    }, [def, baked, view, cols, rows, hover, moving]);

    // resize con devicePixelRatio per nitidezza
    useEffect(() => {
        const cv = canvasRef.current;
        const wrap = wrapRef.current;
        if (!cv || !wrap) return;
        const ro = new ResizeObserver(() => {
            const dpr = window.devicePixelRatio || 1;
            cv.width = wrap.clientWidth * dpr;
            cv.height = wrap.clientHeight * dpr;
            cv.style.width = `${wrap.clientWidth}px`;
            cv.style.height = `${wrap.clientHeight}px`;
            draw();
        });
        ro.observe(wrap);
        return () => ro.disconnect();
    }, [draw]);

    useEffect(() => draw(), [draw]);

    // wheel nativo non-passivo: due dita = pan, pinch (ctrl) = zoom sul cursore
    useEffect(() => {
        const cv = canvasRef.current;
        if (!cv) return;
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const rect = cv.getBoundingClientRect();
            if (e.ctrlKey || e.metaKey) {
                const mx = e.clientX - rect.left;
                const my = e.clientY - rect.top;
                setView((v) => {
                    const next = clamp(v.zoom * Math.exp(-e.deltaY * 0.01), 0.2, 6);
                    const k = next / v.zoom;
                    return { zoom: next, x: mx - (mx - v.x) * k, y: my - (my - v.y) * k };
                });
            } else {
                setView((v) => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }));
            }
        };
        cv.addEventListener('wheel', onWheel, { passive: false });
        return () => cv.removeEventListener('wheel', onWheel);
    }, []);

    const fitRef = useRef<() => void>(() => {});

    // spazio premuto = modalit� pan (come figma); shift+1 = fit
    useEffect(() => {
        const dn = (e: KeyboardEvent) => {
            const onField = ['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName);
            if (e.code === 'Space' && !onField) {
                spaceDown.current = true;
            }
            if (e.shiftKey && e.code === 'Digit1' && !onField) {
                e.preventDefault();
                fitRef.current();
            }
        };
        const up = (e: KeyboardEvent) => {
            if (e.code === 'Space') spaceDown.current = false;
        };
        window.addEventListener('keydown', dn);
        window.addEventListener('keyup', up);
        return () => {
            window.removeEventListener('keydown', dn);
            window.removeEventListener('keyup', up);
        };
    }, []);

    const fit = useCallback(() => {
        const wrap = wrapRef.current;
        if (!wrap || !def) return;
        const pad = 48;
        const zx = (wrap.clientWidth - pad * 2) / (cols * CELL);
        const zy = (wrap.clientHeight - pad * 2) / (rows * CELL);
        const zoom = clamp(Math.min(zx, zy), 0.2, 6);
        setView({
            zoom,
            x: (wrap.clientWidth - cols * CELL * zoom) / 2,
            y: (wrap.clientHeight - rows * CELL * zoom) / 2,
        });
    }, [def, cols, rows]);
    fitRef.current = fit;

    // fit al cambio livello e quando lo store lo richiede (es. carica versione)
    const levelFile = useEditor((s) => s.current?.file);
    const fitNonce = useEditor((s) => s.fitNonce);
    useEffect(() => {
        const t = setTimeout(() => fitRef.current(), 0);
        return () => clearTimeout(t);
    }, [levelFile, fitNonce]);

    const cellAt = (e: React.MouseEvent): { c: number; r: number } => {
        const rect = canvasRef.current!.getBoundingClientRect();
        const v = viewRef.current;
        const x = (e.clientX - rect.left - v.x) / v.zoom;
        const y = (e.clientY - rect.top - v.y) / v.zoom;
        return { c: Math.floor(x / CELL), r: Math.floor(y / CELL) };
    };

    const onDown = (e: React.MouseEvent) => {
        if (!def) return;
        if (e.button === 1 || e.button === 2 || spaceDown.current) {
            drag.current = { ...drag.current, panning: true, sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y };
            return;
        }
        const { c, r } = cellAt(e);
        const st = useEditor.getState();
        if (tool === 'move') {
            const char = st.charAt(c, r);
            if (char !== '.') setMoving({ char, from: { c, r } });
            return;
        }
        if (tool === 'fill') {
            st.beginStroke();
            st.floodFill(c, r, brush);
            return;
        }
        if (tool === 'rect') {
            rectStart.current = { c, r };
            return;
        }
        st.beginStroke();
        drag.current.painting = true;
        st.paint(c, r, tool === 'eraser' ? '.' : brush);
    };

    const onMove = (e: React.MouseEvent) => {
        if (drag.current.panning) {
            setView((v) => ({ ...v, x: drag.current.ox + (e.clientX - drag.current.sx), y: drag.current.oy + (e.clientY - drag.current.sy) }));
            return;
        }
        const { c, r } = cellAt(e);
        setHover({ c, r });
        if (drag.current.painting) {
            useEditor.getState().paint(c, r, tool === 'eraser' ? '.' : brush);
        }
    };

    const onUp = (e: React.MouseEvent) => {
        if (moving) {
            const { c, r } = cellAt(e);
            const st = useEditor.getState();
            st.beginStroke();
            st.moveCell(moving.from.c, moving.from.r, c, r);
            setMoving(null);
            drag.current.panning = false;
            drag.current.painting = false;
            return;
        }
        if (rectStart.current && tool === 'rect') {
            const { c, r } = cellAt(e);
            const st = useEditor.getState();
            st.beginStroke();
            st.paintRect(rectStart.current.c, rectStart.current.r, c, r, brush);
            rectStart.current = null;
        }
        drag.current.panning = false;
        drag.current.painting = false;
    };

    const cursor = spaceDown.current
        ? 'grab'
        : tool === 'move'
          ? moving
              ? 'grabbing'
              : 'move'
          : tool === 'eraser'
            ? 'cell'
            : 'crosshair';

    return (
        <div ref={wrapRef} className="relative h-full w-full overflow-hidden bg-[#08080c]" onContextMenu={(e) => e.preventDefault()}>
            <canvas
                ref={canvasRef}
                className="block touch-none"
                style={{ cursor }}
                onMouseDown={onDown}
                onMouseMove={onMove}
                onMouseUp={onUp}
                onMouseLeave={() => {
                    setHover(null);
                    setMoving(null);
                    drag.current.panning = false;
                    drag.current.painting = false;
                }}
            />

            {/* controlli zoom flottanti */}
            <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-lg border border-line bg-panel/90 p-1 backdrop-blur">
                <button onClick={() => setView((v) => ({ ...v, zoom: clamp(v.zoom * 0.8, 0.2, 6) }))} className="rounded p-1.5 text-neutral-400 hover:bg-panel-2 hover:text-white">
                    <Minus size={14} />
                </button>
                <span className="w-12 text-center text-xs tabular-nums text-neutral-300">{(view.zoom * 100).toFixed(0)}%</span>
                <button onClick={() => setView((v) => ({ ...v, zoom: clamp(v.zoom * 1.25, 0.2, 6) }))} className="rounded p-1.5 text-neutral-400 hover:bg-panel-2 hover:text-white">
                    <Plus size={14} />
                </button>
                <div className="mx-0.5 h-4 w-px bg-line" />
                <button onClick={fit} title="adatta allo schermo (shift+1)" className="rounded p-1.5 text-neutral-400 hover:bg-panel-2 hover:text-white">
                    <Maximize2 size={14} />
                </button>
            </div>

            <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2 rounded-md bg-panel/85 px-2.5 py-1.5 text-[11px] backdrop-blur">
                {hover ? (
                    <>
                        <span className="tabular-nums text-neutral-500">
                            {hover.c}, {hover.r}
                        </span>
                        <span className="h-3 w-px bg-line" />
                        {(() => {
                            const ch = def?.grid[hover.r]?.[hover.c] ?? '.';
                            const label = def ? describeCell(ch, def.entities) : 'vuoto';
                            return (
                                <span className={ch === '.' ? 'text-neutral-600' : 'font-medium text-acid'}>
                                    {label}
                                </span>
                            );
                        })()}
                    </>
                ) : (
                    <span className="text-neutral-500">
                        {cols}×{rows}
                    </span>
                )}
            </div>
        </div>
    );
}

