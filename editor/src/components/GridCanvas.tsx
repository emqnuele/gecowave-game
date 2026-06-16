import { useCallback, useEffect, useRef, useState } from 'react';
import { Maximize2, Plus, Minus } from 'lucide-react';
import { useEditor } from '@/state/editorStore';
import { textureForSpec } from '@/lib/catalog';
import { tileFrameIndex } from '@/lib/tileFrames';
import type { BakedTextures } from '@/lib/textureBaker';

const CELL = 28;
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

    // fit automatico SOLO al cambio livello, non a ogni modifica
    const levelFile = useEditor((s) => s.current?.file);
    useEffect(() => {
        const t = setTimeout(() => fitRef.current(), 0);
        return () => clearTimeout(t);
    }, [levelFile]);

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

            <div className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-panel/80 px-2 py-1 text-[11px] text-neutral-400 backdrop-blur">
                {hover ? `${hover.c}, ${hover.r}` : `${cols}×${rows}`} · due dita = scorri · pinch = zoom · spazio+trascina = pan
            </div>
        </div>
    );
}

function drawGlyph(
    ctx: CanvasRenderingContext2D,
    baked: BakedTextures,
    def: import('@game/types').LevelDef,
    ch: string,
    c: number,
    r: number,
) {
    const x = c * CELL;
    const y = r * CELL;
    if (ch === '#' || ch === 'F' || ch === '%') {
        const frame = baked.tiles[tileFrameIndex(def.grid, c, r)] ?? baked.tiles[0];
        if (frame) ctx.drawImage(frame, x, y, CELL, CELL);
        if (ch === 'F') outline(ctx, x, y, '#facc15');
        if (ch === '%') outline(ctx, x, y, '#f87171');
        return;
    }
    if (ch === '~') {
        ctx.fillStyle = 'rgba(96,165,250,0.4)';
        ctx.fillRect(x, y, CELL, CELL);
        return;
    }
    if (ch === '^') return drawSprite(ctx, baked, 'spikes', x, y);
    if (ch === 'P') return badge(ctx, x, y, '#4ade80', 'P');
    if (ch === 'C') return drawSprite(ctx, baked, 'mic', x, y);
    if (ch === 'X') return badge(ctx, x, y, '#c084fc', 'X');
    const spec = def.entities[ch];
    if (spec) {
        drawSprite(ctx, baked, textureForSpec(spec), x, y);
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.font = '8px monospace';
        ctx.fillText(ch, x + 1, y + 8);
    } else {
        ctx.fillStyle = '#f87171';
        ctx.fillRect(x, y, CELL, CELL);
        ctx.fillStyle = '#000';
        ctx.font = '10px monospace';
        ctx.fillText(ch, x + 9, y + 18);
    }
}

function drawSprite(ctx: CanvasRenderingContext2D, baked: BakedTextures, key: string, x: number, y: number) {
    const img = baked.sprites.get(key);
    if (!img) {
        ctx.fillStyle = '#333';
        ctx.fillRect(x + 4, y + 4, CELL - 8, CELL - 8);
        return;
    }
    const scale = Math.min(CELL / img.width, CELL / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, x + (CELL - w) / 2, y + (CELL - h) / 2, w, h);
}

function outline(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 2]);
    ctx.strokeRect(x + 1, y + 1, CELL - 2, CELL - 2);
    ctx.setLineDash([]);
}

function badge(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, label: string) {
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.25;
    ctx.fillRect(x, y, CELL, CELL);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, CELL - 2, CELL - 2);
    ctx.fillStyle = color;
    ctx.font = 'bold 14px monospace';
    ctx.fillText(label, x + 9, y + 19);
}
