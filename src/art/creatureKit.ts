import Phaser from 'phaser';
import { canvas, chaikinClosed, hashString, hatch, hex, mix, mulberry32, shade, tracePath, wobble, type Pt, type Rng } from './ink';
import { rng } from '../core/rng';

/* il cast vivo (nemici e boss) disegnato come il geco dei dipinti: forme
   piene a colori sporchi, ombra a tratteggio dal lato lontano dalla luce,
   un unico contorno d'inchiostro spesso attorno alla sagoma, occhi accesi
   su uno strato emissivo che il buio non spegne. ogni foglio ha più
   fotogrammi e una normal map ricavata dalla sagoma per la pipeline Light2D */

/** le texture sono disegnate al doppio e scalate a metà: nitide anche sui boss ingranditi */
export const CREATURE_RES = 2;
export const INK = 0x07080c;
const INK_CSS = hex(INK);

export interface CreatureSpec {
    key: string;
    /** misura logica del fotogramma: è quella che usa la fisica */
    w: number;
    h: number;
    frames?: number;
    /** spessore del contorno esterno in px logici */
    outline?: number;
    /** margine attorno al fotogramma: zampe e code possono uscire dalla misura logica */
    pad?: number;
    /** disegnato di profilo verso sinistra: il boss si gira verso il giocatore */
    faces?: boolean;
    draw: (p: Painter, t: number, f: number) => void;
}

export interface ShapeOpts {
    /** iterazioni di chaikin: 0 lascia gli spigoli */
    smooth?: number;
    /** tremolio del contorno */
    amp?: number;
    /** 0..1: quanto scurisce il lato in ombra */
    shadow?: number;
    /** densità del tratteggio nell'ombra, 0 = niente */
    hatch?: number;
    /** colore del filo di luce sul bordo illuminato */
    rim?: number;
    /** spessore della linea interna d'inchiostro, 0 = niente */
    line?: number;
    /** pattern sopra il colore base, dentro la forma */
    detail?: (p: Painter) => void;
}

export class Painter {
    readonly ctx: CanvasRenderingContext2D;
    /** strato emissivo: occhi, fiamme, schermi */
    readonly glowCtx: CanvasRenderingContext2D;
    readonly rnd: Rng;
    readonly w: number;
    readonly h: number;
    /** direzione della luce (verso cui guarda il lato chiaro) */
    lightX = -0.55;
    lightY = -0.85;
    private scratch: { el: HTMLCanvasElement; ctx: CanvasRenderingContext2D };

    private pad: number;

    constructor(ctx: CanvasRenderingContext2D, glowCtx: CanvasRenderingContext2D, rnd: Rng, w: number, h: number, pad: number) {
        this.ctx = ctx;
        this.glowCtx = glowCtx;
        this.rnd = rnd;
        this.w = w;
        this.h = h;
        this.pad = pad;
        this.scratch = canvas((w + pad * 2) * CREATURE_RES, (h + pad * 2) * CREATURE_RES);
    }

    /* ---------- geometria ---------- */

    ellipse(cx: number, cy: number, rx: number, ry: number, rot = 0, n = 22): Pt[] {
        const out: Pt[] = [];
        const c = Math.cos(rot);
        const s = Math.sin(rot);
        for (let i = 0; i < n; i++) {
            const a = (i / n) * Math.PI * 2;
            const x = Math.cos(a) * rx;
            const y = Math.sin(a) * ry;
            out.push({ x: cx + x * c - y * s, y: cy + x * s + y * c });
        }
        return out;
    }

    rect(x: number, y: number, w: number, h: number): Pt[] {
        return [{ x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }];
    }

    /** rettangolo con angoli tondi: si passa a shape con smooth 0 */
    rrect(x: number, y: number, w: number, h: number, r: number): Pt[] {
        const out: Pt[] = [];
        const rr = Math.min(r, w / 2, h / 2);
        const corners: [number, number, number][] = [
            [x + w - rr, y + rr, -Math.PI / 2],
            [x + w - rr, y + h - rr, 0],
            [x + rr, y + h - rr, Math.PI / 2],
            [x + rr, y + rr, Math.PI],
        ];
        for (const [cx, cy, a0] of corners) {
            for (let k = 0; k <= 4; k++) {
                const a = a0 + (k / 4) * (Math.PI / 2);
                out.push({ x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr });
            }
        }
        return out;
    }

    /** contorno di un arto: polilinea con spessore che passa da w0 a w1 */
    limbPts(pts: Pt[], w0: number, w1: number): Pt[] {
        const left: Pt[] = [];
        const right: Pt[] = [];
        for (let i = 0; i < pts.length; i++) {
            const a = pts[Math.max(0, i - 1)];
            const b = pts[Math.min(pts.length - 1, i + 1)];
            const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
            const nx = -(b.y - a.y) / len;
            const ny = (b.x - a.x) / len;
            const w = (w0 + (w1 - w0) * (i / Math.max(1, pts.length - 1))) / 2;
            left.push({ x: pts[i].x + nx * w, y: pts[i].y + ny * w });
            right.push({ x: pts[i].x - nx * w, y: pts[i].y - ny * w });
        }
        // punte arrotondate: un punto in più oltre gli estremi
        const end = pts[pts.length - 1];
        const prev = pts[Math.max(0, pts.length - 2)];
        const el = Math.hypot(end.x - prev.x, end.y - prev.y) || 1;
        const tip = { x: end.x + ((end.x - prev.x) / el) * w1 * 0.45, y: end.y + ((end.y - prev.y) / el) * w1 * 0.45 };
        const st = pts[0];
        const nx2 = pts[Math.min(1, pts.length - 1)];
        const sl = Math.hypot(nx2.x - st.x, nx2.y - st.y) || 1;
        const base = { x: st.x - ((nx2.x - st.x) / sl) * w0 * 0.45, y: st.y - ((nx2.y - st.y) / sl) * w0 * 0.45 };
        return [base, ...left, tip, ...right.reverse()];
    }

    /** curva quadratica campionata, per code, antenne, cavi */
    curve(a: Pt, c: Pt, b: Pt, n = 8): Pt[] {
        const out: Pt[] = [];
        for (let i = 0; i <= n; i++) {
            const t = i / n;
            const u = 1 - t;
            out.push({ x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y });
        }
        return out;
    }

    /* ---------- pittura ---------- */

    private bbox(pts: Pt[]): { x: number; y: number; w: number; h: number } {
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for (const p of pts) {
            x0 = Math.min(x0, p.x);
            y0 = Math.min(y0, p.y);
            x1 = Math.max(x1, p.x);
            y1 = Math.max(y1, p.y);
        }
        return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    }

    /** volume pieno: colore, ombra sfumata e tratteggiata, filo di luce, linea */
    shape(raw: Pt[], color: number, o: ShapeOpts = {}): Pt[] {
        const ctx = this.ctx;
        const smooth = o.smooth ?? 2;
        const pts = wobble([...(smooth ? chaikinClosed(raw, smooth) : raw), smooth ? chaikinClosed(raw, smooth)[0] : raw[0]], this.rnd, o.amp ?? 0.35, 3);
        const b = this.bbox(pts);
        ctx.save();
        tracePath(ctx, pts, true);
        ctx.fillStyle = hex(color);
        ctx.fill();
        ctx.clip();
        o.detail?.(this);
        // ombra: gradiente lungo la direzione della luce, dal lato chiaro a quello scuro
        const cx = b.x + b.w / 2;
        const cy = b.y + b.h / 2;
        const r = Math.max(b.w, b.h) / 2 + 1;
        const lx = this.lightX;
        const ly = this.lightY;
        const shadow = o.shadow ?? 0.6;
        const g = ctx.createLinearGradient(cx + lx * r, cy + ly * r, cx - lx * r, cy - ly * r);
        g.addColorStop(0, hex(shade(color, 0.22), 0.55));
        g.addColorStop(0.42, hex(color, 0));
        g.addColorStop(0.62, hex(INK, shadow * 0.35));
        g.addColorStop(1, hex(INK, shadow * 0.85));
        ctx.fillStyle = g;
        ctx.fillRect(b.x - 2, b.y - 2, b.w + 4, b.h + 4);
        // tratteggio solo dove è buio: disegnato a parte e mascherato dallo stesso gradiente
        if ((o.hatch ?? 0.5) > 0) this.shadowHatch(b, o.hatch ?? 0.5);
        // filo di luce sul bordo verso la luce
        const rim = o.rim ?? shade(color, 0.45);
        ctx.strokeStyle = hex(rim, 0.85);
        ctx.lineWidth = Math.max(0.9, Math.min(2.2, r * 0.12));
        ctx.save();
        ctx.translate(-lx * 1.3, -ly * 1.3);
        tracePath(ctx, pts, true);
        ctx.stroke();
        ctx.restore();
        ctx.restore();
        const line = o.line ?? 1;
        if (line > 0) {
            ctx.strokeStyle = INK_CSS;
            ctx.lineWidth = line;
            tracePath(ctx, pts, true);
            ctx.stroke();
        }
        return pts;
    }

    private shadowHatch(b: { x: number; y: number; w: number; h: number }, density: number): void {
        const R = CREATURE_RES;
        const s = this.scratch;
        s.ctx.setTransform(1, 0, 0, 1, 0, 0);
        s.ctx.clearRect(0, 0, s.el.width, s.el.height);
        s.ctx.setTransform(R, 0, 0, R, this.pad * R, this.pad * R);
        s.ctx.globalCompositeOperation = 'source-over';
        const spacing = 3.4 - density * 1.6;
        hatch(s.ctx, b.x - 2, b.y - 2, b.w + 4, b.h + 4, this.rnd, hex(INK, 0.75), -0.75, spacing, 0.55);
        if (density > 0.55) hatch(s.ctx, b.x - 2, b.y - 2, b.w + 4, b.h + 4, this.rnd, hex(INK, 0.6), 0.8, spacing * 1.25, 0.45);
        const cx = b.x + b.w / 2;
        const cy = b.y + b.h / 2;
        const r = Math.max(b.w, b.h) / 2 + 1;
        const g = s.ctx.createLinearGradient(cx + this.lightX * r, cy + this.lightY * r, cx - this.lightX * r, cy - this.lightY * r);
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(0.5, 'rgba(0,0,0,0)');
        g.addColorStop(0.75, 'rgba(0,0,0,0.7)');
        g.addColorStop(1, 'rgba(0,0,0,1)');
        s.ctx.globalCompositeOperation = 'destination-in';
        s.ctx.fillStyle = g;
        s.ctx.fillRect(b.x - 3, b.y - 3, b.w + 6, b.h + 6);
        s.ctx.globalCompositeOperation = 'source-over';
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.drawImage(s.el, 0, 0);
        this.ctx.restore();
    }

    /** forma piatta senza ombra: macchie, toppe, scritte */
    flat(raw: Pt[], color: number, alpha = 1, smooth = 1): Pt[] {
        const pts = wobble([...(smooth ? chaikinClosed(raw, smooth) : raw), (smooth ? chaikinClosed(raw, smooth) : raw)[0]], this.rnd, 0.25, 3);
        this.ctx.fillStyle = hex(color, alpha);
        tracePath(this.ctx, pts, true);
        this.ctx.fill();
        return pts;
    }

    /** arto, coda, tentacolo: un volume affusolato */
    limb(pts: Pt[], w0: number, w1: number, color: number, o: ShapeOpts = {}): void {
        this.shape(this.limbPts(pts, w0, w1), color, { smooth: 1, hatch: 0.35, ...o });
    }

    /** tratto d'inchiostro libero */
    line(pts: Pt[], width = 1, color = INK, alpha = 1): void {
        const ctx = this.ctx;
        ctx.strokeStyle = hex(color, alpha);
        ctx.lineWidth = width;
        tracePath(ctx, wobble(pts, this.rnd, 0.3, 3));
        ctx.stroke();
    }

    /** occhio acceso: orbita scura, iride luminosa, riflesso, alone sullo strato emissivo */
    eye(x: number, y: number, r: number, color: number, o: { angry?: number; pupil?: boolean; socket?: boolean; lid?: number } = {}): void {
        const ctx = this.ctx;
        if (o.socket !== false) {
            ctx.fillStyle = INK_CSS;
            ctx.beginPath();
            ctx.ellipse(x, y, r * 1.45, r * 1.3, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        const iris = (c: CanvasRenderingContext2D, alpha: number) => {
            const g = c.createRadialGradient(x - r * 0.2, y - r * 0.2, 0, x, y, r);
            g.addColorStop(0, hex(shade(color, 0.6), alpha));
            g.addColorStop(0.55, hex(color, alpha));
            g.addColorStop(1, hex(shade(color, -0.35), alpha));
            c.fillStyle = g;
            c.beginPath();
            c.ellipse(x, y, r, r * 0.92, 0, 0, Math.PI * 2);
            c.fill();
        };
        iris(ctx, 1);
        if (o.pupil) {
            ctx.fillStyle = INK_CSS;
            ctx.beginPath();
            ctx.ellipse(x - r * 0.15, y, r * 0.3, r * 0.62, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        // palpebra arrabbiata: una lama d'inchiostro inclinata sopra l'occhio
        const lid = o.angry ?? 0;
        const top = o.lid ?? 0;
        if (lid || top) {
            ctx.fillStyle = INK_CSS;
            ctx.beginPath();
            ctx.moveTo(x - r * 1.6, y - r * (1.5 - top) + lid * r);
            ctx.lineTo(x + r * 1.6, y - r * (1.5 - top) - lid * r);
            ctx.lineTo(x + r * 1.6, y - r * 2);
            ctx.lineTo(x - r * 1.6, y - r * 2);
            ctx.closePath();
            ctx.fill();
        }
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath();
        ctx.arc(x - r * 0.35, y - r * 0.35, Math.max(0.5, r * 0.22), 0, Math.PI * 2);
        ctx.fill();
        // strato emissivo: iride piena più alone
        const gc = this.glowCtx;
        const halo = gc.createRadialGradient(x, y, 0, x, y, r * 3.4);
        halo.addColorStop(0, hex(color, 0.55));
        halo.addColorStop(1, hex(color, 0));
        gc.fillStyle = halo;
        gc.fillRect(x - r * 3.4, y - r * 3.4, r * 6.8, r * 6.8);
        iris(gc, 0.9);
        if (lid || top) {
            gc.save();
            gc.globalCompositeOperation = 'destination-out';
            gc.beginPath();
            gc.moveTo(x - r * 1.6, y - r * (1.5 - top) + lid * r);
            gc.lineTo(x + r * 1.6, y - r * (1.5 - top) - lid * r);
            gc.lineTo(x + r * 1.6, y - r * 2.2);
            gc.lineTo(x - r * 1.6, y - r * 2.2);
            gc.closePath();
            gc.fill();
            gc.restore();
        }
    }

    /** coppia di occhi: la rabbia piega le palpebre a v verso il naso */
    eyes(cx: number, y: number, gap: number, r: number, color: number, o: { angry?: number; pupil?: boolean; socket?: boolean; lid?: number } = {}): void {
        const a = o.angry ?? 0;
        this.eye(cx - gap / 2, y, r, color, { ...o, angry: -a });
        this.eye(cx + gap / 2, y, r, color, { ...o, angry: a });
    }

    /** luce propria: un punto acceso con alone, sia dipinto sia emissivo */
    glow(x: number, y: number, r: number, color: number, alpha = 0.8): void {
        for (const c of [this.ctx, this.glowCtx]) {
            const g = c.createRadialGradient(x, y, 0, x, y, r * 2.6);
            g.addColorStop(0, hex(shade(color, 0.5), alpha));
            g.addColorStop(0.3, hex(color, alpha * 0.7));
            g.addColorStop(1, hex(color, 0));
            c.fillStyle = g;
            c.fillRect(x - r * 2.6, y - r * 2.6, r * 5.2, r * 5.2);
        }
    }

    /** superficie che emette: schermi, finestrini, liquidi */
    lit(raw: Pt[], color: number, alpha = 0.9, smooth = 0): void {
        const pts = smooth ? chaikinClosed(raw, smooth) : raw;
        const b = this.bbox(pts);
        for (const c of [this.ctx, this.glowCtx]) {
            const g = c.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
            g.addColorStop(0, hex(shade(color, 0.45), alpha));
            g.addColorStop(1, hex(color, alpha * 0.75));
            c.fillStyle = g;
            tracePath(c, pts, true);
            c.fill();
        }
        this.ctx.strokeStyle = INK_CSS;
        this.ctx.lineWidth = 0.8;
        tracePath(this.ctx, pts, true);
        this.ctx.stroke();
    }

    /** granelli e macchie sulla pelle */
    speckle(x: number, y: number, w: number, h: number, color: number, n: number, size = 0.9, alpha = 0.5): void {
        const ctx = this.ctx;
        ctx.fillStyle = hex(color, alpha);
        for (let i = 0; i < n; i++) {
            const s = size * (0.5 + this.rnd());
            ctx.beginPath();
            ctx.arc(x + this.rnd() * w, y + this.rnd() * h, s, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /** bocca a denti: zig zag chiaro su fondo scuro */
    teeth(x: number, y: number, w: number, h: number, n: number, color = 0xe7e2d0, open = 1): void {
        const ctx = this.ctx;
        ctx.fillStyle = hex(0x1a0608);
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + (h * open) / 2, w / 2, Math.max(0.6, (h * open) / 2), 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = hex(color);
        const step = w / n;
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
            ctx.moveTo(x + i * step, y);
            ctx.lineTo(x + i * step + step / 2, y + h * 0.45);
            ctx.lineTo(x + (i + 1) * step, y);
        }
        for (let i = 0; i < n - 1; i++) {
            ctx.moveTo(x + step / 2 + i * step, y + h * open);
            ctx.lineTo(x + step + i * step, y + h * open - h * 0.4);
            ctx.lineTo(x + step * 1.5 + i * step, y + h * open);
        }
        ctx.fill();
        ctx.strokeStyle = INK_CSS;
        ctx.lineWidth = 0.6;
        ctx.stroke();
    }
}

/* ---------- foglio: contorno, emissivo, normal map ---------- */

function silhouetteOutline(src: HTMLCanvasElement, px: number): HTMLCanvasElement {
    const { el, ctx } = canvas(src.width, src.height);
    const sil = canvas(src.width, src.height);
    sil.ctx.drawImage(src, 0, 0);
    sil.ctx.globalCompositeOperation = 'source-in';
    sil.ctx.fillStyle = INK_CSS;
    sil.ctx.fillRect(0, 0, src.width, src.height);
    const steps = 16;
    for (let i = 0; i < steps; i++) {
        const a = (i / steps) * Math.PI * 2;
        ctx.drawImage(sil.el, Math.cos(a) * px, Math.sin(a) * px);
    }
    ctx.drawImage(sil.el, 0, 0);
    ctx.drawImage(src, 0, 0);
    return el;
}

function boxBlur(src: Float32Array, w: number, h: number, r: number): Float32Array {
    const tmp = new Float32Array(w * h);
    const out = new Float32Array(w * h);
    const k = 2 * r + 1;
    for (let y = 0; y < h; y++) {
        let acc = 0;
        for (let x = -r; x <= r; x++) acc += src[y * w + Math.min(w - 1, Math.max(0, x))];
        for (let x = 0; x < w; x++) {
            tmp[y * w + x] = acc / k;
            acc += src[y * w + Math.min(w - 1, x + r + 1)] - src[y * w + Math.max(0, x - r)];
        }
    }
    for (let x = 0; x < w; x++) {
        let acc = 0;
        for (let y = -r; y <= r; y++) acc += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
        for (let y = 0; y < h; y++) {
            out[y * w + x] = acc / k;
            acc += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
        }
    }
    return out;
}

/** rilievo dalla sagoma (cupola morbida) più i solchi dell'inchiostro; verde = su */
function normalMap(src: HTMLCanvasElement): HTMLCanvasElement {
    const w = src.width;
    const h = src.height;
    const data = src.getContext('2d')!.getImageData(0, 0, w, h).data;
    const alpha = new Float32Array(w * h);
    const lum = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) {
        const a = data[i * 4 + 3] / 255;
        alpha[i] = a;
        lum[i] = ((data[i * 4] * 0.3 + data[i * 4 + 1] * 0.59 + data[i * 4 + 2] * 0.11) / 255) * a;
    }
    const r = Math.max(2, Math.round(3 * CREATURE_RES));
    let dome = boxBlur(alpha, w, h, r);
    dome = boxBlur(dome, w, h, r);
    const fine = boxBlur(lum, w, h, 1);
    const height = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) height[i] = Math.sqrt(Math.max(0, dome[i])) * alpha[i] * 1.0 + fine[i] * 0.22;
    const out = canvas(w, h);
    const img = out.ctx.createImageData(w, h);
    const strength = 3.2;
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const i = y * w + x;
            const hl = height[y * w + Math.max(0, x - 1)];
            const hr = height[y * w + Math.min(w - 1, x + 1)];
            const hu = height[Math.max(0, y - 1) * w + x];
            const hd = height[Math.min(h - 1, y + 1) * w + x];
            const nx = -(hr - hl) * strength;
            const ny = (hd - hu) * strength;
            const len = Math.hypot(nx, ny, 1);
            img.data[i * 4] = Math.round(((nx / len) * 0.5 + 0.5) * 255);
            img.data[i * 4 + 1] = Math.round(((ny / len) * 0.5 + 0.5) * 255);
            img.data[i * 4 + 2] = Math.round(((1 / len) * 0.5 + 0.5) * 255);
            img.data[i * 4 + 3] = 255;
        }
    }
    out.ctx.putImageData(img, 0, 0);
    return out.el;
}

export const glowKey = (key: string): string => `${key}~glow`;

/** quanti fotogrammi ha il foglio di una creatura (1 se non è un foglio del kit) */
export function creatureFrames(scene: Phaser.Scene, key: string): number {
    const tex = scene.textures.get(key);
    return (tex.customData as { creatureFrames?: number }).creatureFrames ?? 1;
}

/** scala a cui va mostrata la texture per avere la misura logica */
export function creatureRes(scene: Phaser.Scene, key: string): number {
    const tex = scene.textures.get(key);
    return (tex.customData as { creatureRes?: number }).creatureRes ?? 1;
}

/** true se il foglio guarda a sinistra e va girato verso il bersaglio */
export function creatureFaces(scene: Phaser.Scene, key: string): boolean {
    return !!(scene.textures.get(key).customData as { creatureFaces?: boolean }).creatureFaces;
}

/** misura del corpo in px di texture: quella logica, senza il margine del foglio */
export function creatureBody(sprite: Phaser.GameObjects.Sprite): { w: number; h: number } {
    const d = sprite.texture.customData as { creatureW?: number; creatureH?: number; creatureRes?: number };
    if (!d.creatureW || !d.creatureH) return { w: sprite.width, h: sprite.height };
    const r = d.creatureRes ?? 1;
    return { w: d.creatureW * r, h: d.creatureH * r };
}

export function buildCreature(scene: Phaser.Scene, spec: CreatureSpec): void {
    const R = CREATURE_RES;
    const frames = spec.frames ?? 4;
    const pad = spec.pad ?? 5;
    const fw = (spec.w + pad * 2) * R;
    const fh = (spec.h + pad * 2) * R;
    // un filo vuoto tra i fotogrammi: il filtro lineare non deve pescare dal vicino
    const step = fw + 2;
    const sheet = canvas(step * frames, fh);
    const glowSheet = canvas(step * frames, fh);
    const normals = canvas(step * frames, fh);
    let anyGlow = false;
    for (let f = 0; f < frames; f++) {
        // stesso seme per ogni fotogramma: il tremolio non deve far ballare il disegno
        const rnd = mulberry32(hashString(spec.key));
        const main = canvas(fw, fh);
        const glow = canvas(fw, fh);
        main.ctx.setTransform(R, 0, 0, R, pad * R, pad * R);
        glow.ctx.setTransform(R, 0, 0, R, pad * R, pad * R);
        spec.draw(new Painter(main.ctx, glow.ctx, rnd, spec.w, spec.h, pad), frames > 1 ? f / frames : 0, f);
        const outlined = silhouetteOutline(main.el, (spec.outline ?? 1.15) * R);
        sheet.ctx.drawImage(outlined, f * step, 0);
        glowSheet.ctx.drawImage(glow.el, f * step, 0);
        normals.ctx.drawImage(normalMap(outlined), f * step, 0);
        if (!anyGlow) {
            const d = glow.ctx.getImageData(0, 0, fw, fh).data;
            for (let i = 3; i < d.length; i += 16) if (d[i] > 8) { anyGlow = true; break; }
        }
    }
    register(scene, spec, spec.key, sheet.el, frames, step, fw, fh, normals.el);
    if (anyGlow) register(scene, spec, glowKey(spec.key), glowSheet.el, frames, step, fw, fh, null);
}

function register(scene: Phaser.Scene, spec: CreatureSpec, key: string, el: HTMLCanvasElement, frames: number, step: number, fw: number, fh: number, normals: HTMLCanvasElement | null): void {
    if (scene.textures.exists(key)) scene.textures.remove(key);
    const tex = scene.textures.addCanvas(key, el);
    if (!tex) return;
    for (let f = 0; f < frames; f++) tex.add(f, 0, f * step, 0, fw, fh);
    tex.customData = { ...tex.customData, creatureFrames: frames, creatureRes: CREATURE_RES, creatureW: spec.w, creatureH: spec.h, creatureFaces: !!spec.faces };
    if (normals) tex.setDataSource(normals);
}

/* ---------- a runtime ---------- */

/** lo strato emissivo che segue la creatura: sommato, fuori dalla pipeline delle luci */
export class CreatureGlow {
    readonly image: Phaser.GameObjects.Image | null;
    private target: Phaser.GameObjects.Image;

    constructor(target: Phaser.GameObjects.Image) {
        this.target = target;
        const key = glowKey(target.texture.key);
        this.image = target.scene.textures.exists(key)
            ? target.scene.add.image(target.x, target.y, key, 0).setBlendMode(Phaser.BlendModes.ADD)
            : null;
    }

    sync(alpha = 1): void {
        const img = this.image;
        if (!img) return;
        const t = this.target;
        img.setPosition(t.x, t.y)
            .setFrame(t.frame.name)
            .setScale(t.scaleX, t.scaleY)
            .setRotation(t.rotation)
            .setFlip(t.flipX, t.flipY)
            .setOrigin(t.originX, t.originY)
            .setDepth(t.depth + 0.05)
            .setVisible(t.visible)
            .setAlpha(t.alpha * alpha);
        if (t.displayOriginX !== img.displayOriginX || t.displayOriginY !== img.displayOriginY) img.setDisplayOrigin(t.displayOriginX, t.displayOriginY);
    }

    setVisible(v: boolean): void {
        this.image?.setVisible(v);
    }

    destroy(): void {
        this.image?.destroy();
    }
}

/** sprite di scena (personaggi, comparse): respiro a fotogrammi e occhi accesi */
export function animateCreature(sprite: Phaser.GameObjects.Image, msPerFrame = 240): void {
    const scene = sprite.scene;
    const key = sprite.texture.key;
    const n = creatureFrames(scene, key);
    const glow = new CreatureGlow(sprite);
    let t = rng.fx.next() * 1000;
    const tick = (_time: number, delta: number) => {
        if (!sprite.active) return;
        t += delta;
        if (n > 1) {
            const f = Math.floor(t / msPerFrame) % n;
            if (String(sprite.frame.name) !== String(f)) sprite.setFrame(f);
        }
        glow.sync();
    };
    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, tick);
    sprite.once(Phaser.GameObjects.Events.DESTROY, () => {
        scene.events.off(Phaser.Scenes.Events.POST_UPDATE, tick);
        glow.destroy();
    });
}

/** colore misto comodo per le palette */
export const tone = (c: number, t: number): number => shade(c, t);
export const blend = (a: number, b: number, t: number): number => mix(a, b, t);
