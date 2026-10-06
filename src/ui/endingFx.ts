import { ui } from './dom';

/* fuochi e sangue dei titoli di coda: una tela sopra tutto, niente phaser.
   win = razzi che salgono e scoppiano in scie con gravità e crepitio;
   lose = schizzi arteriosi sull'obiettivo: stella con filamenti, satelliti,
   nebbiolina e coli, cotti in una tela statica. */

export type EndingFxMode = 'win' | 'lose';

const PALETTES: string[][] = [
    ['#fde68a', '#facc15', '#f59e0b'],
    ['#fdba74', '#ff9a4a', '#f97316'],
    ['#ffffff', '#e8dfc8', '#cbbf9f'],
    ['#a5f3fc', '#67e8f9', '#22d3ee'],
    ['#fecaca', '#f87171', '#dc2626'],
];

interface Spark {
    x: number; y: number; px: number; py: number;
    vx: number; vy: number;
    life: number; max: number;
    size: number; color: string;
    seed: number;
}

interface Rocket {
    x: number; y: number; vx: number; vy: number;
    fuse: number; palette: string[]; power: number;
    kind: 'peony' | 'ring' | 'willow';
}

interface Flash {
    x: number; y: number; r: number; a: number;
}

interface Droplet {
    x: number; y: number; px: number; py: number;
    vx: number; vy: number;
    life: number; r: number;
}

/** uno schizzo cotto: tela prerenderizzata, posizione, scala, nascita */
interface Baked {
    sprite: HTMLCanvasElement;
    x: number; y: number;
    scale: number; rot: number;
    born: number;
    stored: boolean;
}

export class EndingFx {
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private raf = 0;
    private running = false;
    private last = 0;
    private w = 0;
    private h = 0;
    private rockets: Rocket[] = [];
    private sparks: Spark[] = [];
    private flashes: Flash[] = [];
    private droplets: Droplet[] = [];
    private baked: Baked[] = [];
    private still: HTMLCanvasElement | null = null;
    private stillCtx: CanvasRenderingContext2D | null = null;
    private pending: { at: number; x: number; y: number; radius: number }[] = [];
    private nextLaunch = 0;
    private lastActive = 0;
    private onResize = (): void => this.resize();
    private mode: EndingFxMode;

    constructor(mode: EndingFxMode) {
        this.mode = mode;
    }

    /** la tela vive nella radice ui: resta sopra carte e rotolo fino alla fine */
    mount(): void {
        const canvas = document.createElement('canvas');
        canvas.className = 'ending-fx';
        ui().append(canvas);
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        this.canvas = canvas;
        this.ctx = ctx;
        this.resize();
        window.addEventListener('resize', this.onResize);
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        if (this.mode === 'lose') {
            // tre impatti nei primi secondi, poi l'obiettivo resta sporco e fermo
            this.lastActive = performance.now();
            this.scheduleHits();
        }
        this.running = true;
        this.last = performance.now();
        this.nextLaunch = this.last + 400;
        const tick = (now: number): void => {
            if (!this.running) return;
            if (!document.body.contains(canvas)) {
                this.running = false;
                return;
            }
            const dt = Math.min(0.05, (now - this.last) / 1000);
            this.last = now;
            if (this.mode === 'win') this.stepFireworks(dt, now / 1000);
            else this.stepBlood(dt, now);
            this.raf = requestAnimationFrame(tick);
        };
        this.raf = requestAnimationFrame(tick);
    }

    destroy(): void {
        this.running = false;
        cancelAnimationFrame(this.raf);
        window.removeEventListener('resize', this.onResize);
        this.canvas?.remove();
        this.canvas = null;
        this.ctx = null;
    }

    private resize(): void {
        if (!this.canvas) return;
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        this.w = window.innerWidth;
        this.h = window.innerHeight;
        this.canvas.width = Math.round(this.w * dpr);
        this.canvas.height = Math.round(this.h * dpr);
        this.ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
        // tela statica alla stessa scala: ci si cuoce dentro il sangue fermo
        const still = document.createElement('canvas');
        still.width = this.canvas.width;
        still.height = this.canvas.height;
        this.still = still;
        this.stillCtx = still.getContext('2d');
        this.stillCtx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    /* ---------- fuochi ---------- */

    private stepFireworks(dt: number, t: number): void {
        const ctx = this.ctx;
        if (!ctx) return;
        if (t * 1000 >= this.nextLaunch && this.rockets.length < 3) {
            this.nextLaunch = t * 1000 + 380 + Math.random() * 480;
            const kinds: Rocket['kind'][] = ['peony', 'peony', 'ring', 'willow'];
            const kind = kinds[Math.floor(Math.random() * kinds.length)];
            const x = this.w * (0.12 + Math.random() * 0.76);
            this.rockets.push({
                x, y: this.h + 8,
                vx: (Math.random() - 0.5) * 30,
                vy: -(this.h * (0.52 + Math.random() * 0.2)),
                fuse: 0.9 + Math.random() * 0.6,
                palette: PALETTES[Math.floor(Math.random() * PALETTES.length)],
                power: Math.min(this.w, this.h) * (0.16 + Math.random() * 0.1),
                kind,
            });
        }
        ctx.globalCompositeOperation = 'source-over';
        ctx.clearRect(0, 0, this.w, this.h);
        ctx.globalCompositeOperation = 'lighter';
        for (let i = this.rockets.length - 1; i >= 0; i--) {
            const r = this.rockets[i];
            r.fuse -= dt;
            r.vy += 60 * dt;
            r.x += (r.vx + Math.sin(t * 9 + r.y * 0.02) * 12) * dt;
            r.y += r.vy * dt;
            // scia di brace mentre sale
            for (let k = 0; k < 2; k++) {
                this.sparks.push({
                    x: r.x + (Math.random() - 0.5) * 3, y: r.y + Math.random() * 6,
                    px: r.x, py: r.y + 8,
                    vx: (Math.random() - 0.5) * 40, vy: 60 + Math.random() * 60,
                    life: 0.35, max: 0.35, size: 1.1, color: '#ffb347', seed: Math.random() * 10,
                });
            }
            ctx.fillStyle = '#fff7e0';
            ctx.beginPath();
            ctx.arc(r.x, r.y, 2.2, 0, Math.PI * 2);
            ctx.fill();
            if (r.fuse <= 0 || r.y < this.h * 0.12) {
                this.rockets.splice(i, 1);
                this.explode(r);
            }
        }
        this.stepSparks(dt, t);
        // lampi di nascita: alone che si apre e muore in fretta
        for (let i = this.flashes.length - 1; i >= 0; i--) {
            const f = this.flashes[i];
            f.a -= dt * 2.2;
            if (f.a <= 0) {
                this.flashes.splice(i, 1);
                continue;
            }
            const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
            g.addColorStop(0, `rgba(255,250,235,${(f.a * 0.8).toFixed(3)})`);
            g.addColorStop(1, 'rgba(255,250,235,0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
    }

    private explode(r: Rocket): void {
        this.flashes.push({ x: r.x, y: r.y, r: r.power * 0.9, a: 0.6 });
        const n = r.kind === 'willow' ? 55 : 90 + Math.floor(Math.random() * 50);
        for (let i = 0; i < n; i++) {
            const a = r.kind === 'ring'
                ? (Math.PI * 2 * i) / n + (Math.random() - 0.5) * 0.1
                : Math.random() * Math.PI * 2;
            const sp = r.kind === 'ring'
                ? r.power * (0.95 + Math.random() * 0.1)
                : r.power * (0.35 + Math.pow(Math.random(), 0.6) * 0.75);
            const life = r.kind === 'willow' ? 2 + Math.random() * 0.9 : 1.1 + Math.random() * 0.9;
            this.sparks.push({
                x: r.x, y: r.y, px: r.x, py: r.y,
                vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
                life, max: life,
                size: 1 + Math.random() * 1.6,
                color: r.palette[Math.floor(Math.random() * r.palette.length)],
                seed: Math.random() * 10,
            });
        }
        if (this.sparks.length > 800) this.sparks.splice(0, this.sparks.length - 800);
    }

    private stepSparks(dt: number, t: number): void {
        const ctx = this.ctx;
        if (!ctx) return;
        ctx.lineCap = 'round';
        for (let i = this.sparks.length - 1; i >= 0; i--) {
            const s = this.sparks[i];
            s.life -= dt;
            if (s.life <= 0) {
                this.sparks.splice(i, 1);
                continue;
            }
            s.vy += 110 * dt;
            s.vx *= 1 - 0.7 * dt;
            s.vy *= 1 - 0.25 * dt;
            s.px = s.x;
            s.py = s.y;
            s.x += s.vx * dt;
            s.y += s.vy * dt;
            // tremolio: la scia respira invece di spegnersi liscia
            const k = s.life / s.max;
            const tw = 0.55 + 0.45 * Math.sin(t * 31 + s.seed * 7);
            ctx.globalAlpha = Math.min(1, k * 1.6) * tw;
            ctx.strokeStyle = s.color;
            ctx.lineWidth = s.size * (0.5 + k * 0.7);
            ctx.beginPath();
            ctx.moveTo(s.px, s.py);
            ctx.lineTo(s.x, s.y);
            ctx.stroke();
            // crepitio finale: microscintille bianche
            if (k < 0.4 && Math.random() < 0.1 && this.sparks.length < 800) {
                this.sparks.push({
                    x: s.x, y: s.y, px: s.x, py: s.y,
                    vx: (Math.random() - 0.5) * 90, vy: (Math.random() - 0.5) * 90,
                    life: 0.3, max: 0.3, size: 0.9, color: '#ffffff', seed: Math.random() * 10,
                });
            }
        }
        ctx.globalAlpha = 1;
    }

    /* ---------- sangue ---------- */

    /** uno schizzo arterioso cotto in una tela: stella con filamenti, satelliti, coli */
    private makeSplat(radius: number): HTMLCanvasElement {
        const side = Math.ceil(radius * 3.4);
        const c = document.createElement('canvas');
        c.width = side;
        c.height = side;
        const g = c.getContext('2d');
        if (!g) return c;
        const cx = side / 2;
        const cy = side / 2;
        // filamenti: dita lunghe e sottili in tutte le direzioni
        const spikes = 14 + Math.floor(Math.random() * 8);
        g.fillStyle = '#c1121f';
        for (let i = 0; i < spikes; i++) {
            const a = (Math.PI * 2 * i) / spikes + (Math.random() - 0.5) * 0.5;
            const len = radius * (0.7 + Math.random() * 0.9);
            const wdt = 1.5 + Math.random() * (radius * 0.09);
            const tipX = cx + Math.cos(a) * len;
            const tipY = cy + Math.sin(a) * len;
            g.strokeStyle = '#c1121f';
            g.lineWidth = wdt;
            g.lineCap = 'round';
            g.beginPath();
            g.moveTo(cx + Math.cos(a) * radius * 0.3, cy + Math.sin(a) * radius * 0.3);
            g.lineTo(tipX, tipY);
            g.stroke();
            // perlina in punta a metà dei filamenti
            if (Math.random() < 0.5) {
                g.fillStyle = '#e5383b';
                g.beginPath();
                g.arc(tipX, tipY, wdt * 0.8, 0, Math.PI * 2);
                g.fill();
                g.fillStyle = '#c1121f';
            }
        }
        // corpo: stella irregolare rosso vivo
        const lobes = 9 + Math.floor(Math.random() * 5);
        g.fillStyle = '#c1121f';
        g.beginPath();
        for (let i = 0; i <= lobes; i++) {
            const a = (Math.PI * 2 * i) / lobes;
            const rr = radius * (0.55 + Math.random() * 0.5);
            const x = cx + Math.cos(a) * rr;
            const y = cy + Math.sin(a) * rr;
            if (i === 0) g.moveTo(x, y);
            else g.lineTo(x, y);
        }
        g.closePath();
        g.fill();
        // cuore scuro al centro
        const core = radius * 0.5;
        const grad = g.createRadialGradient(cx, cy, 0, cx, cy, core);
        grad.addColorStop(0, '#7f1d1d');
        grad.addColorStop(1, 'rgba(127,29,29,0)');
        g.fillStyle = grad;
        g.beginPath();
        g.arc(cx, cy, core, 0, Math.PI * 2);
        g.fill();
        // coli: 2-4 rigagnoli che scendono con la perlina in fondo
        const drips = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < drips; i++) {
            const dx = cx + (Math.random() - 0.5) * radius;
            const len = radius * (0.5 + Math.random() * 0.8);
            g.strokeStyle = '#b30f0f';
            g.lineWidth = 2 + Math.random() * 2;
            g.lineCap = 'round';
            g.beginPath();
            g.moveTo(dx, cy + radius * 0.4);
            g.lineTo(dx + (Math.random() - 0.5) * 8, cy + radius * 0.4 + len);
            g.stroke();
            g.fillStyle = '#e5383b';
            g.beginPath();
            g.arc(dx, cy + radius * 0.4 + len, 2.5 + Math.random() * 2, 0, Math.PI * 2);
            g.fill();
        }
        // nebbiolina: puntini fitti attorno
        for (let i = 0; i < 46; i++) {
            const a = Math.random() * Math.PI * 2;
            const d = radius * (0.9 + Math.random() * 0.7);
            g.fillStyle = Math.random() < 0.7 ? '#c1121f' : '#e5383b';
            g.beginPath();
            g.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 0.6 + Math.random() * 1.4, 0, Math.PI * 2);
            g.fill();
        }
        // riflessi bagnati sui lobi in alto a sinistra
        g.fillStyle = 'rgba(255,150,150,0.5)';
        for (let i = 0; i < 4; i++) {
            const a = Math.PI * (0.9 + Math.random() * 0.5);
            const d = radius * (0.2 + Math.random() * 0.35);
            g.beginPath();
            g.ellipse(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 3 + Math.random() * 4, 1.5 + Math.random() * 2, -0.5, 0, Math.PI * 2);
            g.fill();
        }
        return c;
    }

    private bakeSprite(b: Baked): void {
        const s = this.stillCtx;
        if (!s) return;
        const side = b.sprite.width;
        s.save();
        s.translate(b.x, b.y);
        s.rotate(b.rot);
        s.scale(b.scale, b.scale);
        s.drawImage(b.sprite, -side / 2, -side / 2);
        s.restore();
    }

    private bakeDot(x: number, y: number, r: number, bright: boolean): void {
        const s = this.stillCtx;
        if (!s) return;
        s.fillStyle = bright ? '#e5383b' : '#c1121f';
        s.beginPath();
        s.arc(x, y, r, 0, Math.PI * 2);
        s.fill();
    }

    private scheduleHits(): void {
        const now = performance.now();
        // uno per fascia orizzontale: copre l'obiettivo senza impastare il centro
        const zones = [0.2, 0.5, 0.8].sort(() => Math.random() - 0.5);
        const delays = [350, 2100, 3900];
        for (let i = 0; i < 3; i++) {
            this.pending.push({
                at: now + delays[i],
                x: this.w * (zones[i] + (Math.random() - 0.5) * 0.12),
                y: this.h * (0.2 + Math.random() * 0.45),
                radius: Math.min(this.w, this.h) * (0.09 + Math.random() * 0.08),
            });
        }
    }

    private strike(p: { x: number; y: number; radius: number }): void {
        const sprite = this.makeSplat(p.radius);
        this.baked.push({ sprite, x: p.x, y: p.y, scale: 0.01, rot: Math.random() * Math.PI * 2, born: performance.now(), stored: false });
        for (let i = 0; i < 12; i++) {
            const a = Math.random() * Math.PI * 2;
            const sp = 200 + Math.random() * 320;
            this.droplets.push({
                x: p.x, y: p.y, px: p.x, py: p.y,
                vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 80,
                life: 0.3 + Math.random() * 0.25,
                r: 1.5 + Math.random() * 2.5,
            });
        }
        this.lastActive = performance.now();
    }

    private stepBlood(_dt: number, nowMs: number): void {
        const ctx = this.ctx;
        if (!ctx) return;
        // impatti in arrivo
        for (let i = this.pending.length - 1; i >= 0; i--) {
            if (nowMs >= this.pending[i].at) {
                const p = this.pending.splice(i, 1)[0];
                this.strike(p);
            }
        }
        ctx.clearRect(0, 0, this.w, this.h);
        if (this.still) ctx.drawImage(this.still, 0, 0, this.w, this.h);
        // schizzi che sbocciano con un colpo secco
        for (const b of this.baked) {
            const k = Math.min(1, (nowMs - b.born) / 450);
            const e = 1 + 2.7 * Math.pow(k - 1, 3) + 1.7 * Math.pow(k - 1, 2);
            const side = b.sprite.width;
            const draw = (c: CanvasRenderingContext2D): void => {
                c.save();
                c.translate(b.x, b.y);
                c.rotate(b.rot);
                c.scale(b.scale * e, b.scale * e);
                c.drawImage(b.sprite, -side / 2, -side / 2);
                c.restore();
            };
            draw(ctx);
            if (k >= 1 && !b.stored) {
                b.stored = true;
                this.bakeSprite(b);
                this.lastActive = nowMs;
            }
        }
        // satelliti in volo: scia corta, poi restano cotti dentro
        for (let i = this.droplets.length - 1; i >= 0; i--) {
            const d = this.droplets[i];
            d.life -= _dt;
            d.vy += 900 * _dt;
            d.px = d.x;
            d.py = d.y;
            d.x += d.vx * _dt;
            d.y += d.vy * _dt;
            if (d.life <= 0) {
                this.bakeDot(d.x, d.y, d.r, Math.random() < 0.4);
                this.droplets.splice(i, 1);
                continue;
            }
            ctx.strokeStyle = '#e5383b';
            ctx.lineWidth = d.r * 1.5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(d.px, d.py);
            ctx.lineTo(d.x, d.y);
            ctx.stroke();
            ctx.fillStyle = '#e5383b';
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
            ctx.fill();
        }
        // a impatti finiti il loop si spegne: resta tutto cotto dentro
        if (!this.pending.length && !this.droplets.length && nowMs - this.lastActive > 1500) {
            this.running = false;
        }
    }
}
