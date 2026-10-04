import { ui } from './dom';

/* fuochi e sangue dei titoli di coda: una tela sopra tutto, niente phaser.
   win = razzi che salgono e scoppiano in scie con gravità e crepitio;
   lose = gocce di sangue sull'obiettivo che colano, cadono e schizzano. */

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

interface Splat {
    x: number; y: number;
    blobs: { dx: number; dy: number; r: number }[];
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
    private specks: { x: number; y: number; r: number }[] = [];
    private splats: Splat[] = [];
    private nextLaunch = 0;
    private nextBurst = 0;
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
            for (let i = 0; i < 2; i++) this.burst();
            this.splats.push(this.newSplat());
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
            else this.stepBlood(dt, now / 1000);
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

    /** uno schizzo: nucleo grosso, satellite scagliati, puntini che restano */
    private burst(): void {
        const x = this.w * (0.08 + Math.random() * 0.84);
        const y = this.h * (0.08 + Math.random() * 0.7);
        const big = 6 + Math.random() * 7;
        this.dropToSpecks(x, y, big);
        const n = 7 + Math.floor(Math.random() * 7);
        for (let i = 0; i < n; i++) {
            const a = Math.random() * Math.PI * 2;
            const sp = 90 + Math.random() * 260;
            this.droplets.push({
                x, y, px: x, py: y,
                vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60,
                life: 0.45 + Math.random() * 0.4,
                r: 1.2 + Math.random() * 2.4,
            });
        }
    }

    private dropToSpecks(x: number, y: number, r: number): void {
        this.specks.push({ x, y, r });
        for (let i = 0; i < 5; i++) {
            this.specks.push({
                x: x + (Math.random() - 0.5) * r * 7,
                y: y + (Math.random() - 0.5) * r * 6,
                r: 0.8 + Math.random() * 2,
            });
        }
        if (this.specks.length > 170) this.specks.splice(0, this.specks.length - 170);
    }

    private newSplat(): Splat {
        const blobs: Splat['blobs'] = [];
        const n = 5 + Math.floor(Math.random() * 5);
        for (let i = 0; i < n; i++) {
            blobs.push({
                dx: (Math.random() - 0.5) * 46,
                dy: (Math.random() - 0.5) * 36,
                r: 1 + Math.random() * 3,
            });
        }
        blobs.push({ dx: (Math.random() - 0.5) * 10, dy: (Math.random() - 0.5) * 8, r: 5 + Math.random() * 4 });
        return { x: Math.random() * this.w, y: Math.random() * this.h, blobs };
    }

    private stepBlood(dt: number, t: number): void {
        const ctx = this.ctx;
        if (!ctx) return;
        ctx.clearRect(0, 0, this.w, this.h);
        if (t * 1000 >= this.nextBurst) {
            this.nextBurst = t * 1000 + 1900 + Math.random() * 2200;
            this.burst();
            if (Math.random() < 0.4) this.splats.push(this.newSplat());
            if (this.splats.length > 8) this.splats.shift();
        }
        // resti fermi: schizzi vecchi e puntini atterrati
        for (const s of this.splats) {
            this.dropBlob(ctx, s.x, s.y, 7);
            for (const b of s.blobs) this.dropBlob(ctx, s.x + b.dx, s.y + b.dy, b.r);
        }
        for (const p of this.specks) this.dropBlob(ctx, p.x, p.y, p.r);
        // satelliti in volo: scia corta, poi restano dove cadono
        for (let i = this.droplets.length - 1; i >= 0; i--) {
            const d = this.droplets[i];
            d.life -= dt;
            d.vy += 780 * dt;
            d.px = d.x;
            d.py = d.y;
            d.x += d.vx * dt;
            d.y += d.vy * dt;
            if (d.life <= 0) {
                this.dropToSpecks(d.x, d.y, d.r);
                this.droplets.splice(i, 1);
                continue;
            }
            ctx.strokeStyle = '#7d1212';
            ctx.lineWidth = d.r * 1.4;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(d.px, d.py);
            ctx.lineTo(d.x, d.y);
            ctx.stroke();
            this.dropBlob(ctx, d.x, d.y, d.r);
        }
    }

    private dropBlob(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
        const g = ctx.createRadialGradient(x - r * 0.25, y - r * 0.3, r * 0.1, x, y, r);
        g.addColorStop(0, '#b02323');
        g.addColorStop(0.55, '#7d1212');
        g.addColorStop(1, '#4a0a0a');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        // riflesso: vetro bagnato, non plastica
        ctx.fillStyle = 'rgba(255,150,150,0.32)';
        ctx.beginPath();
        ctx.ellipse(x - r * 0.28, y - r * 0.32, r * 0.3, r * 0.18, -0.5, 0, Math.PI * 2);
        ctx.fill();
    }
}
