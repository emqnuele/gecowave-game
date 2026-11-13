import { hex, mix, range, type Rng } from '../ink';
import { box, crack, glow, heap, limb, lit, marks, masonry, mass, sag, smoke, windowGrid, wire, type Ctx, type XY } from './brush';
import type { Tone } from './palette';

/* gli oggetti dei piani di parallasse. ognuno si disegna in piedi su una base,
   con la sua misura: k è la scala del piano */

export type Element = (ctx: Ctx, x: number, base: number, t: Tone, rnd: Rng, k: number) => void;

/** disegna inclinato attorno al piede dell'oggetto */
function tilted(ctx: Ctx, x: number, base: number, angle: number, draw: () => void): void {
    ctx.save();
    ctx.translate(x, base);
    ctx.rotate(angle);
    ctx.translate(-x, -base);
    draw();
    ctx.restore();
}

/* ---------- città e rovine ---------- */

/** palazzone sventrato: solai in fila, cima spezzata, ferri che spuntano */
export const tower: Element = (ctx, x, base, t, rnd, k) => {
    const w = range(rnd, 70, 130) * k;
    const h = range(rnd, 280, 540) * k;
    tilted(ctx, x + w / 2, base, (rnd() - 0.5) * 0.3, () => {
        const top = base - h;
        const pts: XY[] = [[x, base + 30], [x + w * 0.03, top + range(rnd, 0, 40)]];
        const teeth = 4 + Math.floor(rnd() * 3);
        for (let i = 1; i < teeth; i++) pts.push([x + (w * i) / teeth, top + range(rnd, -10, 46)]);
        pts.push([x + w * 0.97, top + range(rnd, 0, 50)], [x + w, base + 30]);
        mass(ctx, pts, t, rnd, { hatch: 0.8 });
        // i solai: una riga di buio e sopra il filo del balcone
        const floor = Math.max(13, 19 * k);
        for (let y = top + 56; y < base - 6; y += floor) {
            ctx.fillStyle = t.recess;
            let cx = x + 6;
            while (cx < x + w - 10) {
                const seg = range(rnd, 8, 26);
                if (rnd() > 0.22) ctx.fillRect(cx, y, Math.min(seg, x + w - 6 - cx), floor * 0.5);
                cx += seg + range(rnd, 3, 7);
            }
            if (t.depth > 0) {
                ctx.fillStyle = hex(t.light, 0.35);
                ctx.fillRect(x + 3, y + floor * 0.5, w - 6, 1.2);
            }
        }
        for (let i = 0; i < 4; i++) {
            const rx = x + range(rnd, 6, w - 6);
            wire(ctx, [[rx, top + 30], [rx + range(rnd, -8, 8), top - range(rnd, 6, 30)]], 1.4, t);
        }
        crack(ctx, x + range(rnd, w * 0.2, w * 0.8), top + 60, h * 0.3, t, rnd);
    });
};

/** palazzo di città: cornicione, persiane, portone, qualche finestra accesa */
export const facade: Element = (ctx, x, base, t, rnd, k) => {
    const w = range(rnd, 150, 260) * k;
    const h = range(rnd, 200, 380) * k;
    const top = base - h;
    mass(ctx, [[x, base + 30], [x, top], [x + w, top], [x + w, base + 30]], t, rnd, { hatch: 0.5 });
    mass(ctx, box(x - 6, top - 9, w + 12, 11), t, rnd, { flat: true });
    // il tetto: comignoli, un'antenna, un abbaino
    for (let i = 0; i < 2 + Math.floor(rnd() * 2); i++) {
        const cx = x + range(rnd, 0.08, 0.86) * w;
        mass(ctx, box(cx, top - 9 - range(rnd, 14, 34) * k, range(rnd, 9, 16) * k, 40 * k), t, rnd, { flat: true });
    }
    const ax = x + range(rnd, 0.2, 0.8) * w;
    wire(ctx, [[ax, top - 8], [ax, top - 52 * k]], 1.2, t);
    wire(ctx, [[ax - 9 * k, top - 44 * k], [ax + 9 * k, top - 44 * k]], 1, t);
    const ground = Math.min(70 * k, h * 0.3);
    windowGrid(ctx, x + 6, top + 8, w - 12, h - ground - 8, t, rnd, { cw: 11 * k + 3, ch: 18 * k + 4, gx: 13 * k + 3, gy: 15 * k + 4, lit: 0.16, blinds: true });
    masonry(ctx, x, top, w, h - ground, t, rnd, 0.12);
    // piano terra: portone ad arco e una vetrina
    const dw = 26 * k + 8;
    const dx = x + range(rnd, 0.12, 0.3) * w;
    ctx.fillStyle = t.recess;
    ctx.beginPath();
    ctx.moveTo(dx, base + 10);
    ctx.lineTo(dx, base - ground * 0.55);
    ctx.quadraticCurveTo(dx + dw / 2, base - ground * 0.95, dx + dw, base - ground * 0.55);
    ctx.lineTo(dx + dw, base + 10);
    ctx.fill();
    if (rnd() > 0.35) lit(ctx, x + w * 0.52, base - ground * 0.78, w * 0.34, ground * 0.5, t, 0.9);
    if (marks(ctx, t)) {
        ctx.beginPath();
        ctx.moveTo(x, base - ground);
        ctx.lineTo(x + w, base - ground);
        // la grondaia
        ctx.moveTo(x + w - 7, top);
        ctx.lineTo(x + w - 7, base);
        ctx.stroke();
    }
};

/** cattedrale gotica in rovina: timpano a punta, pinnacoli, monofore */
export const gothic: Element = (ctx, x, base, t, rnd, k) => {
    const w = range(rnd, 130, 220) * k;
    const h = range(rnd, 230, 400) * k;
    const top = base - h;
    const peak = range(rnd, 70, 130) * k;
    const cut = rnd() > 0.5;
    const pts: XY[] = [[x, base + 30], [x, top - 20 * k], [x + w * 0.06, top - 60 * k], [x + w * 0.12, top - 20 * k], [x + w * 0.14, top]];
    if (cut) pts.push([x + w * 0.4, top - peak * 0.6], [x + w * 0.46, top - peak * 0.3], [x + w * 0.6, top - peak * 0.45], [x + w * 0.72, top + 30 * k]);
    else pts.push([x + w * 0.5, top - peak], [x + w * 0.86, top]);
    pts.push([x + w * 0.88, top - 20 * k], [x + w * 0.94, top - 56 * k], [x + w, top - 20 * k], [x + w, base + 30]);
    mass(ctx, pts, t, rnd, { hatch: 0.8 });
    const lancets = 3 + Math.floor(rnd() * 2);
    const lw = (w * 0.6) / (lancets * 2 - 1);
    for (let i = 0; i < lancets; i++) {
        const lx = x + w * 0.2 + i * lw * 2;
        const lh = h * range(rnd, 0.32, 0.44);
        const ly = top + h * 0.3;
        const on = rnd() < 0.3;
        ctx.beginPath();
        ctx.moveTo(lx, ly + lh);
        ctx.lineTo(lx, ly + lw);
        ctx.quadraticCurveTo(lx, ly, lx + lw / 2, ly - lw * 0.6);
        ctx.quadraticCurveTo(lx + lw, ly, lx + lw, ly + lw);
        ctx.lineTo(lx + lw, ly + lh);
        ctx.closePath();
        ctx.fillStyle = on ? hex(t.glow, t.glowA * 0.8) : t.recess;
        ctx.fill();
        if (on) glow(ctx, lx + lw / 2, ly + lh / 2, lh * 0.9, t, 0.18);
    }
    if (!cut) {
        ctx.beginPath();
        ctx.arc(x + w / 2, top - peak * 0.25, 13 * k + 3, 0, Math.PI * 2);
        ctx.fillStyle = t.recess;
        ctx.fill();
    }
    masonry(ctx, x, top, w, h, t, rnd, 0.14);
    // contrafforte
    mass(ctx, [[x - 16 * k, base + 30], [x - 12 * k, base - h * 0.5], [x + 2, base - h * 0.62], [x + 2, base + 30]], t, rnd, {});
};

/** arcate spezzate: colonne, capitelli, l'ultimo arco a metà */
export const arcade: Element = (ctx, x, base, t, rnd, k) => {
    const n = 2 + Math.floor(rnd() * 3);
    const aw = range(rnd, 70, 110) * k;
    const ah = range(rnd, 110, 200) * k;
    const col = 16 * k + 4;
    const band = 26 * k + 6;
    const broken = rnd() > 0.35;
    const pointed = rnd() > 0.5;
    const top = base - ah - band - aw * 0.45;
    const pts: XY[] = [[x, base + 30], [x, top + range(rnd, 0, 8)]];
    const span = n * aw + col - (broken ? aw * 0.45 : 0);
    pts.push([x + span, top + range(rnd, 0, 10)]);
    if (broken) pts.push([x + span - 10 * k, top + band * 0.7], [x + span + 8 * k, top + band * 1.5]);
    // il sotto: dall'ultimo arco al primo, colonna per colonna
    for (let i = n - 1; i >= 0; i--) {
        const ax = x + col + i * aw;
        const right = ax + aw - col;
        const spring = base - ah;
        if (!(broken && i === n - 1)) pts.push([right + col, base + 30], [right, base + 30], [right, spring]);
        const steps = 6;
        for (let s = broken && i === n - 1 ? 3 : 0; s <= steps; s++) {
            const f = s / steps;
            const a = Math.PI * f;
            const rise = pointed ? Math.pow(Math.sin(a), 0.7) * 1.15 : Math.sin(a);
            pts.push([right - (right - ax) * (1 - Math.cos(a)) / 2, spring - rise * (right - ax) * 0.5]);
        }
        pts.push([ax, spring], [ax, base + 30]);
    }
    mass(ctx, pts, t, rnd, { hatch: 0.5 });
    if (t.depth > 0) {
        for (let i = 0; i <= n - (broken ? 1 : 0); i++) {
            ctx.fillStyle = hex(t.light, 0.45);
            ctx.fillRect(x + i * aw - 2, base - ah - 3, col + 4, 2.5);
        }
    }
    masonry(ctx, x, top, span, band + aw * 0.3, t, rnd, 0.3);
};

/** muro bombardato coi graffiti: quel che resta di un forte di quartiere */
export const wallRuin: Element = (ctx, x, base, t, rnd, k) => {
    const w = range(rnd, 140, 240) * k;
    const h = range(rnd, 130, 230) * k;
    const pts: XY[] = [[x, base + 30], [x + range(rnd, -4, 4), base - h * range(rnd, 0.5, 0.9)]];
    // la cima crolla a gradini, un mattone alla volta
    let cx = x;
    let cy = pts[1][1];
    while (cx < x + w - 14 * k) {
        const step = range(rnd, 12, 34) * k;
        cx += step;
        pts.push([cx, cy]);
        cy = base - h * range(rnd, 0.45, 1) * (0.75 + 0.25 * Math.sin(((cx - x) / w) * Math.PI));
        pts.push([cx, cy]);
    }
    pts.push([x + w, cy], [x + w + range(rnd, -4, 4), base + 30]);
    mass(ctx, pts, t, rnd, { hatch: 0.6 });
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.ellipse(x + range(rnd, 0.15, 0.85) * w, base - h * range(rnd, 0.15, 0.5), range(rnd, 5, 13) * k, range(rnd, 4, 10) * k, rnd() * 3, 0, Math.PI * 2);
        ctx.fillStyle = t.recess;
        ctx.fill();
    }
    masonry(ctx, x, base - h * 0.6, w, h * 0.6, t, rnd, 0.3);
    // scarabocchi a spray, sbiaditi con la distanza
    const cols = [0xf87171, 0x67e8f9, 0xfde047, 0xf0abfc];
    ctx.lineWidth = 2.4 * k + 0.8;
    for (let i = 0; i < 3; i++) {
        const gx = x + range(rnd, 0.15, 0.75) * w;
        const gy = base - h * range(rnd, 0.12, 0.42);
        ctx.strokeStyle = hex(mix(cols[Math.floor(rnd() * cols.length)], t.body, [0.72, 0.5, 0.35][t.depth]), 0.85);
        ctx.beginPath();
        const kind = Math.floor(rnd() * 3);
        if (kind === 0) {
            ctx.arc(gx, gy, 9 * k + 2, 0, Math.PI * 2);
            ctx.moveTo(gx + 4 * k, gy);
            ctx.arc(gx, gy, 4 * k, 0, Math.PI * 2);
        } else if (kind === 1) {
            for (let s = 0; s < 5; s++) ctx.lineTo(gx + s * 8 * k, gy + (s % 2 ? -9 : 6) * k);
        } else {
            ctx.moveTo(gx - 8 * k, gy - 8 * k);
            ctx.lineTo(gx + 8 * k, gy + 8 * k);
            ctx.moveTo(gx + 8 * k, gy - 8 * k);
            ctx.lineTo(gx - 8 * k, gy + 8 * k);
        }
        ctx.stroke();
    }
    for (let i = 0; i < 3; i++) {
        const rx = x + range(rnd, 0.1, 0.9) * w;
        wire(ctx, [[rx, base - h * 0.7], [rx + range(rnd, -10, 10), base - h * range(rnd, 0.95, 1.2)]], 1.3, t);
    }
};

/** campanile di provincia: cella campanaria, orologio, cuspide */
export const belltower: Element = (ctx, x, base, t, rnd, k) => {
    const w = range(rnd, 34, 48) * k;
    const h = range(rnd, 260, 380) * k;
    const top = base - h;
    mass(ctx, [[x, base + 30], [x + 2, top], [x + w / 2, top - 62 * k], [x + w - 2, top], [x + w, base + 30]], t, rnd, { hatch: 0.6 });
    ctx.fillStyle = t.recess;
    for (const fx of [0.22, 0.58]) {
        ctx.beginPath();
        ctx.roundRect(x + w * fx, top + 16 * k, w * 0.2, 28 * k, [w * 0.1, w * 0.1, 0, 0]);
        ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(x + w / 2, top + 70 * k, w * 0.24, 0, Math.PI * 2);
    ctx.fillStyle = hex(t.light, 0.6);
    ctx.fill();
    if (marks(ctx, t)) {
        ctx.beginPath();
        for (let y = top + 100 * k; y < base; y += 50 * k) {
            ctx.moveTo(x, y);
            ctx.lineTo(x + w, y);
        }
        ctx.stroke();
    }
};

/* ---------- strada ---------- */

/** palo della luce storto, con le traverse e i cavi che vanno al prossimo */
export const pole: Element = (ctx, x, base, t, rnd, k) => {
    const h = range(rnd, 210, 320) * k;
    const lean = (rnd() - 0.5) * 0.16;
    const tx = x + Math.sin(lean) * h;
    const ty = base - Math.cos(lean) * h;
    limb(ctx, x, base + 30, tx, ty, 8 * k + 2, 5 * k + 1.5, t, rnd);
    const arms = 1 + Math.floor(rnd() * 2);
    for (let a = 0; a < arms; a++) {
        const ay = ty + 16 * k + a * 24 * k;
        const ax = tx + Math.sin(lean) * (ty - ay);
        const half = (34 - a * 8) * k;
        limb(ctx, ax - half, ay + lean * half, ax + half, ay - lean * half, 4 * k + 1, 4 * k + 1, t, rnd);
        for (const side of [-1, 1]) {
            const wx = ax + side * half * 0.85;
            const reach = range(rnd, 260, 420) * k;
            sag(ctx, wx, ay, wx + reach, ay + range(rnd, -30, 30) * k, range(rnd, 24, 60) * k, 1, t, 0.7);
        }
    }
    if (rnd() > 0.55) {
        // braccio col lampione
        const lx = tx + t.dir * 40 * k;
        wire(ctx, [[tx, ty + 44 * k], [tx + t.dir * 20 * k, ty + 26 * k], [lx, ty + 30 * k]], 2.4 * k + 0.6, t);
        mass(ctx, box(lx - 7 * k, ty + 29 * k, 14 * k, 5 * k), t, rnd, { flat: true });
        if (rnd() > 0.4) glow(ctx, lx, ty + 38 * k, 46 * k, t, 0.42);
    }
};

/** lampione di ghisa col suo alone nella nebbia */
export const lamp: Element = (ctx, x, base, t, rnd, k) => {
    const h = range(rnd, 150, 210) * k;
    const top = base - h;
    limb(ctx, x, base + 30, x, top + 16 * k, 6 * k + 1.5, 3.5 * k + 1, t, rnd);
    mass(ctx, box(x - 6 * k, base - 16 * k, 12 * k, 46), t, rnd, { flat: true });
    const on = rnd() > 0.2;
    if (on) {
        glow(ctx, x, top + 4 * k, 110 * k, t, 0.3);
        ctx.fillStyle = hex(mix(t.glow, 0xffffff, 0.3), t.glowA);
        ctx.fillRect(x - 5 * k, top - 4 * k, 10 * k, 16 * k);
    }
    mass(ctx, [[x - 8 * k, top - 4 * k], [x - 5 * k, top - 12 * k], [x, top - 18 * k], [x + 5 * k, top - 12 * k], [x + 8 * k, top - 4 * k]], t, rnd, { flat: true });
    wire(ctx, [[x - 6 * k, top + 13 * k], [x + 6 * k, top + 13 * k]], 2, t);
    if (on) glow(ctx, x, top + 4 * k, 26 * k, t, 0.7);
};

/** semaforo penzolante: il rosso è l'unica cosa ancora accesa */
export const trafficLight: Element = (ctx, x, base, t, rnd, k) => {
    const h = range(rnd, 170, 230) * k;
    const top = base - h;
    const lean = (rnd() - 0.5) * 0.14;
    tilted(ctx, x, base, lean, () => {
        limb(ctx, x, base + 30, x, top, 7 * k + 1.5, 5 * k + 1, t, rnd);
        const arm = 62 * k * (rnd() > 0.5 ? 1 : -1);
        limb(ctx, x, top + 4 * k, x + arm, top + 2 * k, 4 * k + 1, 3 * k + 1, t, rnd);
        const bx = x + arm - 7 * k;
        mass(ctx, box(bx, top + 4 * k, 14 * k, 36 * k), t, rnd, { flat: true });
        ctx.fillStyle = hex(0xff4a3a, t.glowA);
        ctx.beginPath();
        ctx.arc(bx + 7 * k, top + 11 * k, 3.6 * k, 0, Math.PI * 2);
        ctx.fill();
        glow(ctx, bx + 7 * k, top + 11 * k, 34 * k, t, 0.5, 0xff4a3a);
    });
};

/** palina della fermata: il tondo col numero, come quelle del gioco */
export const busStop: Element = (ctx, x, base, t, rnd, k) => {
    const h = range(rnd, 110, 160) * k;
    const lean = (rnd() - 0.5) * 0.2;
    tilted(ctx, x, base, lean, () => {
        limb(ctx, x, base + 30, x, base - h, 5 * k + 1, 4 * k + 1, t, rnd);
        ctx.beginPath();
        ctx.arc(x, base - h - 12 * k, 14 * k, 0, Math.PI * 2);
        ctx.fillStyle = hex(mix(t.body, t.accent, [0.14, 0.26, 0.34][t.depth]));
        ctx.fill();
        if (t.ink) {
            ctx.strokeStyle = t.ink;
            ctx.lineWidth = t.inkW;
            ctx.stroke();
        }
        if (rnd() > 0.5) mass(ctx, box(x - 16 * k, base - h + 10 * k, 32 * k, 14 * k), t, rnd, { flat: true });
    });
};

/** autobus a due piani abbandonato, a volte accatastato su un altro */
export const doubleDecker: Element = (ctx, x, base, t, rnd, k) => {
    const w = range(rnd, 180, 230) * k;
    const h = 96 * k;
    const stack = rnd() > 0.72 ? 2 : 1;
    for (let s = 0; s < stack; s++) {
        const bx = x + s * range(rnd, -40, 40) * k;
        const by = base - s * (h - 6);
        tilted(ctx, bx + w / 2, by, (rnd() - 0.5) * (s ? 0.3 : 0.1), () => {
            const r = 16 * k;
            mass(ctx, [
                [bx, by - 8 * k], [bx, by - h + r], [bx + r * 0.4, by - h + r * 0.3], [bx + r, by - h],
                [bx + w - r, by - h], [bx + w - r * 0.3, by - h + r * 0.4], [bx + w, by - h + r * 1.4], [bx + w, by - 8 * k],
            ], t, rnd, { hatch: 0.4 });
            for (const row of [0.14, 0.56]) {
                let wx = bx + 10 * k;
                while (wx < bx + w - 24 * k) {
                    const ww = 20 * k;
                    const pane = rnd();
                    ctx.fillStyle = pane > 0.8 ? hex(t.glow, t.glowA * 0.55) : pane > 0.45 ? hex(mix(t.haze, t.light, 0.5), 0.5) : t.recess;
                    ctx.fillRect(wx, by - h + h * row, ww, h * 0.24);
                    wx += ww + 5 * k;
                }
            }
            ctx.fillStyle = t.recess;
            for (const fx of [0.18, 0.78]) {
                ctx.beginPath();
                ctx.arc(bx + w * fx, by - 8 * k, 13 * k, 0, Math.PI * 2);
                ctx.fill();
            }
            if (marks(ctx, t)) {
                ctx.beginPath();
                ctx.moveTo(bx + 4, by - h * 0.5);
                ctx.lineTo(bx + w - 4, by - h * 0.5);
                ctx.stroke();
            }
        });
    }
};

/** carcassa d'auto: senza ruote, cofano aperto, mezza affondata */
export const carWreck: Element = (ctx, x, base, t, rnd, k) => {
    const w = range(rnd, 110, 140) * k;
    const h = 34 * k;
    tilted(ctx, x + w / 2, base, (rnd() - 0.5) * 0.16, () => {
        mass(ctx, [
            [x, base], [x + 2, base - h * 0.75], [x + w * 0.2, base - h], [x + w * 0.3, base - h * 1.75], [x + w * 0.66, base - h * 1.75],
            [x + w * 0.8, base - h], [x + w - 2, base - h * 0.8], [x + w, base],
        ], t, rnd, { hatch: 0.4 });
        ctx.fillStyle = t.recess;
        ctx.beginPath();
        ctx.moveTo(x + w * 0.27, base - h * 1.05);
        ctx.lineTo(x + w * 0.33, base - h * 1.62);
        ctx.lineTo(x + w * 0.63, base - h * 1.62);
        ctx.lineTo(x + w * 0.74, base - h * 1.05);
        ctx.fill();
        for (const fx of [0.2, 0.78]) {
            ctx.beginPath();
            ctx.arc(x + w * fx, base - 2, 11 * k, Math.PI, 0);
            ctx.fill();
        }
        if (rnd() > 0.5) limb(ctx, x + w * 0.82, base - h * 0.85, x + w * 0.98, base - h * 1.8, 3 * k + 1, 2 * k + 1, t, rnd);
    });
};

/** rete da cantiere: paletti storti e maglia accennata */
export const fence: Element = (ctx, x, base, t, rnd, k) => {
    const n = 3 + Math.floor(rnd() * 3);
    const gap = 62 * k;
    const h = 74 * k;
    const tops: XY[] = [];
    for (let i = 0; i <= n; i++) {
        const px = x + i * gap;
        const lean = (rnd() - 0.5) * 14 * k;
        limb(ctx, px, base + 20, px + lean, base - h, 3.5 * k + 1, 3 * k + 1, t, rnd);
        tops.push([px + lean, base - h]);
    }
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, base + 10);
    for (const p of tops) ctx.lineTo(p[0], p[1] + 5 * k);
    ctx.lineTo(x + n * gap, base + 10);
    ctx.clip();
    ctx.strokeStyle = hex(t.shadow, 0.5);
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    for (let d = -h; d < n * gap + h; d += 9 * k + 2) {
        ctx.moveTo(x + d, base);
        ctx.lineTo(x + d + h, base - h);
        ctx.moveTo(x + d + h, base);
        ctx.lineTo(x + d, base - h);
    }
    ctx.stroke();
    ctx.restore();
    for (let i = 0; i < n; i++) sag(ctx, tops[i][0], tops[i][1] + 3, tops[i + 1][0], tops[i + 1][1] + 3, 6 * k, 1.2, t);
};

export const rubble: Element = (ctx, x, base, t, rnd, k) => {
    heap(ctx, x, base, range(rnd, 110, 200) * k, range(rnd, 26, 54) * k, t, rnd, 5);
    for (let i = 0; i < 2; i++) {
        const rx = x + range(rnd, 20, 120) * k;
        limb(ctx, rx, base - 8 * k, rx + range(rnd, -30, 30) * k, base - range(rnd, 40, 80) * k, 4 * k + 1, 3 * k + 1, t, rnd);
    }
};

/** sacchi di sabbia e casse: una barricata */
export const barricade: Element = (ctx, x, base, t, rnd, k) => {
    const rows = 2 + Math.floor(rnd() * 2);
    const bw = 30 * k;
    const bh = 13 * k;
    for (let r = 0; r < rows; r++) {
        const count = 5 - r;
        for (let i = 0; i < count; i++) {
            const sx = x + i * bw * 0.92 + r * bw * 0.46 + range(rnd, -2, 2);
            const sy = base - r * bh * 0.88;
            mass(ctx, [[sx, sy], [sx + 2, sy - bh * 0.8], [sx + bw * 0.5, sy - bh], [sx + bw - 2, sy - bh * 0.8], [sx + bw, sy]], t, rnd, {});
        }
    }
    const cx = x + 5 * bw;
    const cs = range(rnd, 34, 50) * k;
    tilted(ctx, cx + cs / 2, base, (rnd() - 0.5) * 0.2, () => {
        mass(ctx, box(cx, base - cs, cs, cs), t, rnd, { hatch: 0.5 });
        if (marks(ctx, t)) {
            ctx.beginPath();
            ctx.moveTo(cx + 4, base - cs + 4);
            ctx.lineTo(cx + cs - 4, base - 4);
            ctx.moveTo(cx + cs - 4, base - cs + 4);
            ctx.lineTo(cx + 4, base - 4);
            ctx.stroke();
        }
    });
};

export const gravestone: Element = (ctx, x, base, t, rnd, k) => {
    const n = 1 + Math.floor(rnd() * 3);
    for (let i = 0; i < n; i++) {
        const gx = x + i * range(rnd, 44, 70) * k;
        const w = range(rnd, 24, 36) * k;
        const h = range(rnd, 40, 70) * k;
        tilted(ctx, gx + w / 2, base, (rnd() - 0.5) * 0.3, () => {
            if (rnd() > 0.6) {
                limb(ctx, gx + w / 2, base + 10, gx + w / 2, base - h * 1.2, 6 * k + 1, 5 * k + 1, t, rnd);
                limb(ctx, gx, base - h * 0.85, gx + w, base - h * 0.85, 5 * k + 1, 5 * k + 1, t, rnd);
            } else {
                mass(ctx, [[gx, base + 10], [gx, base - h * 0.7], [gx + w * 0.2, base - h * 0.95], [gx + w / 2, base - h], [gx + w * 0.8, base - h * 0.95], [gx + w, base - h * 0.7], [gx + w, base + 10]], t, rnd, { hatch: 0.5 });
            }
        });
    }
};

/* ---------- natura ---------- */

/** albero morto e contorto: rami che si dividono e si assottigliano */
export const deadTree: Element = (ctx, x, base, t, rnd, k) => {
    const h = range(rnd, 190, 330) * k;
    const grow = (bx: number, by: number, a: number, len: number, w: number, d: number): void => {
        const bend = (rnd() - 0.5) * 0.5;
        const mx = bx + Math.cos(a + bend) * len * 0.5;
        const my = by + Math.sin(a + bend) * len * 0.5;
        const ex = mx + Math.cos(a - bend) * len * 0.5;
        const ey = my + Math.sin(a - bend) * len * 0.5;
        limb(ctx, bx, by, mx, my, w, w * 0.82, t, rnd, { open: true });
        limb(ctx, mx, my, ex, ey, w * 0.82, w * 0.62, t, rnd, { open: true });
        if (d <= 0 || w < 1.6) return;
        const forks = d > 3 ? 2 : 2 + Math.floor(rnd() * 2);
        for (let f = 0; f < forks; f++) {
            const spread = (f - (forks - 1) / 2) * range(rnd, 0.5, 0.95) + (rnd() - 0.5) * 0.3;
            grow(ex, ey, a - bend * 0.5 + spread, len * range(rnd, 0.56, 0.76), w * 0.6, d - 1);
        }
    };
    // le radici si aprono al piede
    for (const side of [-1, 1]) limb(ctx, x, base - 14 * k, x + side * range(rnd, 18, 34) * k, base + 12, 8 * k, 3 * k, t, rnd, { open: true });
    grow(x, base + 6, -Math.PI / 2 + (rnd() - 0.5) * 0.4, h * 0.42, 15 * k + 3, 5);
};

/** mesa di roccia a gradoni: il canyon del rio */
export const mesa: Element = (ctx, x, base, t, rnd, k) => {
    const w = range(rnd, 220, 380) * k;
    const h = range(rnd, 200, 400) * k;
    const steps = 4 + Math.floor(rnd() * 2);
    const side = (dirn: 1 | -1): XY[] => {
        const out: XY[] = [];
        let px = dirn > 0 ? x : x + w;
        let py = base + 30;
        out.push([px, py]);
        for (let i = 0; i < steps; i++) {
            // su dritto, poi una cengia che rientra
            py -= ((h + 30) / steps) * range(rnd, 0.8, 1.2);
            out.push([px + dirn * range(rnd, -6, 10) * k, py]);
            px += dirn * range(rnd, 10, 38) * k;
            out.push([px, py - range(rnd, 0, 8) * k]);
        }
        return out;
    };
    const left = side(1);
    const right = side(-1);
    const topY = Math.min(left[left.length - 1][1], right[right.length - 1][1]);
    const crown: XY[] = [];
    const lx = left[left.length - 1][0];
    const rx = right[right.length - 1][0];
    for (let i = 1; i < 5; i++) crown.push([lx + ((rx - lx) * i) / 5, topY - range(rnd, 0, 18) * k]);
    mass(ctx, [...left, ...crown, ...right.reverse()], t, rnd, { hatch: 1 });
    if (marks(ctx, t)) {
        ctx.beginPath();
        for (let y = topY + 24 * k; y < base; y += range(rnd, 20, 40) * k) {
            const f = Math.max(0, (base - y) / h);
            const x0 = x + w * 0.2 * f + range(rnd, 10, 40);
            const x1 = x + w - w * 0.2 * f - range(rnd, 10, 40);
            ctx.moveTo(x0, y);
            for (let cx = x0; cx < x1; cx += 20) ctx.lineTo(cx, y + range(rnd, -2.5, 2.5));
        }
        ctx.stroke();
    }
    // un albero secco sul ciglio
    if (rnd() > 0.5) deadTree(ctx, lx + (rx - lx) * range(rnd, 0.2, 0.8), topY, t, rnd, k * 0.3);
};

/** capanna su palafitte con la tenda: il mercato del fiume */
export const shack: Element = (ctx, x, base, t, rnd, k) => {
    const w = range(rnd, 80, 120) * k;
    const stilts = range(rnd, 26, 56) * k;
    const h = range(rnd, 44, 62) * k;
    const floor = base - stilts;
    for (const fx of [0.08, 0.5, 0.92]) limb(ctx, x + w * fx, base + 20, x + w * fx + range(rnd, -4, 4), floor, 4 * k + 1, 4 * k + 1, t, rnd);
    mass(ctx, [[x, floor], [x + 2, floor - h], [x + w * 0.5, floor - h - 26 * k], [x + w + 12 * k, floor - h + 4 * k], [x + w, floor]], t, rnd, { hatch: 0.6 });
    if (rnd() > 0.35) lit(ctx, x + w * 0.38, floor - h * 0.72, 13 * k, 13 * k, t, 2.2);
    // la tenda rattoppata che pende davanti
    const side = rnd() > 0.5 ? 1 : -1;
    const ax = side > 0 ? x + w : x;
    mass(ctx, [[ax, floor - h + 6 * k], [ax + side * 52 * k, floor - h * 0.45], [ax + side * 46 * k, floor - h * 0.3], [ax, floor - h * 0.55]], t, rnd, { color: mix(t.body, t.light, 0.5) });
    limb(ctx, ax + side * 48 * k, floor - h * 0.4, ax + side * 50 * k, base + 20, 3 * k + 1, 3 * k + 1, t, rnd);
    if (marks(ctx, t)) {
        ctx.beginPath();
        for (let px = x + 10 * k; px < x + w; px += 11 * k) {
            ctx.moveTo(px, floor - 3);
            ctx.lineTo(px, floor - h + 6);
        }
        ctx.stroke();
    }
};

/** stalagmite, e a volte la sua gemella che scende dal soffitto */
export const stalagmite: Element = (ctx, x, base, t, rnd, k) => {
    const w = range(rnd, 50, 120) * k;
    const h = range(rnd, 130, 340) * k;
    mass(ctx, [[x, base + 30], [x + w * 0.2, base - h * 0.3], [x + w * 0.36, base - h * 0.62], [x + w * 0.5, base - h], [x + w * 0.62, base - h * 0.56], [x + w * 0.82, base - h * 0.24], [x + w, base + 30]], t, rnd, { hatch: 0.9 });
    if (rnd() > 0.45) {
        const hx = x + range(rnd, -30, 30) * k;
        const hh = h * range(rnd, 0.3, 0.6);
        mass(ctx, [[hx, -10], [hx + w * 0.3, hh * 0.5], [hx + w * 0.45, hh], [hx + w * 0.6, hh * 0.4], [hx + w * 0.9, -10]], t, rnd, { hatch: 0.6 });
    }
};

/** ciuffo di cristalli sfaccettati */
export const crystals: Element = (ctx, x, base, t, rnd, k) => {
    const n = 3 + Math.floor(rnd() * 3);
    for (let i = 0; i < n; i++) {
        const cx = x + i * range(rnd, 14, 30) * k;
        const h = range(rnd, 90, 300) * k * (1 - Math.abs(i - (n - 1) / 2) / n);
        const w = range(rnd, 16, 34) * k;
        const lean = (rnd() - 0.5) * 70 * k;
        const tipX = cx + lean;
        const tipY = base - h;
        mass(ctx, [[cx - w, base + 20], [cx - w * 0.7 + lean * 0.7, base - h * 0.78], [tipX, tipY], [cx + w * 0.7 + lean * 0.7, base - h * 0.74], [cx + w, base + 20]], t, rnd, { color: mix(t.body, t.accent, [0.1, 0.16, 0.2][t.depth]) });
        // la faccia in luce
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(cx + t.dir * w * 0.7 + lean * 0.7, base - h * 0.76);
        ctx.lineTo(cx + t.dir * w, base + 20);
        ctx.lineTo(cx + t.dir * w * 0.15, base + 20);
        ctx.closePath();
        ctx.fillStyle = hex(mix(t.light, t.accent, 0.4), 0.3);
        ctx.fill();
    }
};

/* ---------- interni e industria ---------- */

/** serbatoio a cupola con la scaletta e il tubo che scende */
export const tank: Element = (ctx, x, base, t, rnd, k) => {
    const w = range(rnd, 90, 150) * k;
    const h = range(rnd, 130, 240) * k;
    const top = base - h;
    const pts: XY[] = [[x, base + 30], [x, top + w * 0.3]];
    for (let i = 1; i < 6; i++) {
        const a = Math.PI * (i / 6);
        pts.push([x + w / 2 - Math.cos(a) * w / 2, top + w * 0.3 - Math.sin(a) * w * 0.3]);
    }
    pts.push([x + w, top + w * 0.3], [x + w, base + 30]);
    mass(ctx, pts, t, rnd, { hatch: 0.7 });
    if (marks(ctx, t)) {
        ctx.beginPath();
        for (let y = top + w * 0.3; y < base; y += 34 * k) {
            ctx.moveTo(x, y);
            ctx.lineTo(x + w, y);
        }
        const lx = x + w * 0.2;
        ctx.moveTo(lx, base);
        ctx.lineTo(lx, top + w * 0.2);
        ctx.moveTo(lx + 9 * k, base);
        ctx.lineTo(lx + 9 * k, top + w * 0.2);
        for (let y = base - 8; y > top + w * 0.2; y -= 10 * k) {
            ctx.moveTo(lx, y);
            ctx.lineTo(lx + 9 * k, y);
        }
        ctx.stroke();
    }
    const side = rnd() > 0.5 ? 1 : -1;
    const px = side > 0 ? x + w : x;
    const reach = range(rnd, 50, 110) * k * side;
    const py = base - h * range(rnd, 0.35, 0.65);
    limb(ctx, px, py, px + reach, py, 10 * k, 10 * k, t, rnd);
    limb(ctx, px + reach, py - 5 * k, px + reach, base + 20, 10 * k, 10 * k, t, rnd);
    mass(ctx, box(px + reach - 8 * k, py - 8 * k, 16 * k, 16 * k), t, rnd, { flat: true });
    if (rnd() > 0.5) smoke(ctx, x + w / 2, top - 4, t, 110 * k, 60 * k);
};

/** ciminiera a fasce col suo fumo */
export const chimney: Element = (ctx, x, base, t, rnd, k) => {
    const w = range(rnd, 30, 46) * k;
    const h = range(rnd, 260, 430) * k;
    mass(ctx, [[x, base + 30], [x + w * 0.14, base - h], [x + w * 0.86, base - h], [x + w, base + 30]], t, rnd, { hatch: 0.7 });
    mass(ctx, box(x + w * 0.06, base - h - 7 * k, w * 0.88, 9 * k), t, rnd, { flat: true });
    if (marks(ctx, t)) {
        ctx.beginPath();
        for (let y = base - h + 30 * k; y < base; y += 44 * k) {
            ctx.moveTo(x + 3, y);
            ctx.lineTo(x + w - 3, y);
        }
        ctx.stroke();
    }
    smoke(ctx, x + w / 2, base - h - 12 * k, t, 170 * k, 90 * k);
};

/** tubi su cavalletti con il volantino della valvola */
export const pipeRun: Element = (ctx, x, base, t, rnd, k) => {
    const len = range(rnd, 200, 340) * k;
    const y = base - range(rnd, 60, 130) * k;
    const r = range(rnd, 9, 15) * k;
    for (let sx = x + 20 * k; sx < x + len; sx += 90 * k) limb(ctx, sx, base + 20, sx, y + r, 5 * k + 1, 5 * k + 1, t, rnd);
    limb(ctx, x, y, x + len, y, r * 2, r * 2, t, rnd, { hatch: 0.4 });
    if (rnd() > 0.4) limb(ctx, x + 10 * k, y - r * 2.4, x + len * 0.7, y - r * 2.4, r, r, t, rnd);
    for (let fx = x + 40 * k; fx < x + len; fx += 100 * k) mass(ctx, box(fx, y - r - 3, 6 * k, r * 2 + 6), t, rnd, { flat: true });
    const vx = x + len * range(rnd, 0.3, 0.7);
    wire(ctx, [[vx, y - r], [vx, y - r - 16 * k]], 2, t);
    ctx.strokeStyle = hex(mix(t.body, t.accent, 0.25));
    ctx.lineWidth = 2.6 * k + 0.6;
    ctx.beginPath();
    ctx.ellipse(vx, y - r - 18 * k, 11 * k, 4 * k, 0, 0, Math.PI * 2);
    ctx.stroke();
    if (rnd() > 0.5) smoke(ctx, x + len * 0.85, y - r, t, 70 * k, 30 * k);
};

/** parete di server: schermi accesi a scacchi e cavi che colano */
export const serverWall: Element = (ctx, x, base, t, rnd, k) => {
    const w = range(rnd, 90, 160) * k;
    const h = range(rnd, 240, 460) * k;
    const top = base - h;
    mass(ctx, box(x, top, w, h + 30), t, rnd, { hatch: 0.5 });
    const cols = Math.max(2, Math.floor(w / (26 * k)));
    const cw = (w - 12) / cols;
    for (let y = top + 10; y < base - 14 * k; y += 20 * k) {
        for (let c = 0; c < cols; c++) {
            const roll = rnd();
            const sx = x + 6 + c * cw;
            if (roll > 0.62) lit(ctx, sx + 2, y, cw - 4, 13 * k, t, 0.9, t.accent);
            else {
                ctx.fillStyle = t.recess;
                ctx.fillRect(sx + 2, y, cw - 4, 13 * k);
            }
        }
    }
    for (let i = 0; i < 4; i++) {
        const cx = x + range(rnd, 0.05, 0.6) * w;
        sag(ctx, cx, top + range(rnd, 0, h * 0.5), cx + range(rnd, 30, 90) * k, top + range(rnd, h * 0.2, h * 0.8), range(rnd, 30, 80) * k, 1.6 * k + 0.6, t);
    }
    wire(ctx, [[x + w * 0.5, top], [x + w * 0.5, top - 46 * k]], 2, t);
};

/** traliccio a croci di sant'andrea */
export const lattice: Element = (ctx, x, base, t, rnd, k) => {
    const h = range(rnd, 280, 460) * k;
    const w = range(rnd, 46, 66) * k;
    const n = 7;
    const half = (i: number) => (w / 2) * (1 - (i / n) * 0.65);
    const cx = x + w / 2;
    const lw = 2.2 * k + 0.8;
    for (const side of [-1, 1]) wire(ctx, [[cx + side * half(0), base + 20], [cx + side * half(n), base - h]], lw * 1.4, t);
    for (let i = 0; i < n; i++) {
        const y0 = base - (h * i) / n;
        const y1 = base - (h * (i + 1)) / n;
        wire(ctx, [[cx - half(i), y0], [cx + half(i + 1), y1]], lw * 0.7, t);
        wire(ctx, [[cx + half(i), y0], [cx - half(i + 1), y1]], lw * 0.7, t);
        wire(ctx, [[cx - half(i + 1), y1], [cx + half(i + 1), y1]], lw * 0.7, t);
    }
    for (const fy of [0.72, 0.9]) {
        const y = base - h * fy;
        wire(ctx, [[cx - w * 0.8, y], [cx + w * 0.8, y]], lw, t);
        for (const side of [-1, 1]) sag(ctx, cx + side * w * 0.8, y, cx + side * w * 0.8 + range(rnd, 280, 400) * k, y + range(rnd, -20, 20), 50 * k, 1, t, 0.65);
    }
    if (rnd() > 0.4) {
        ctx.fillStyle = hex(0xff4a3a, t.glowA);
        ctx.fillRect(cx - 1.5, base - h - 5, 3, 3);
        glow(ctx, cx, base - h - 4, 18 * k, t, 0.5, 0xff4a3a);
    }
};

/** scaffale di cantina: botti, casse, bottiglie, un monitor rimasto acceso */
export const shelf: Element = (ctx, x, base, t, rnd, k) => {
    const w = range(rnd, 90, 150) * k;
    const h = range(rnd, 150, 260) * k;
    const top = base - h;
    tilted(ctx, x + w / 2, base, (rnd() - 0.5) * 0.08, () => {
        for (const sx of [x, x + w]) limb(ctx, sx, base + 20, sx, top, 6 * k + 1, 6 * k + 1, t, rnd);
        const rows = Math.max(2, Math.floor(h / (48 * k)));
        for (let r = 0; r < rows; r++) {
            const y = base - (h * r) / rows - 4;
            limb(ctx, x - 3, y, x + w + 3, y, 5 * k + 1, 5 * k + 1, t, rnd);
            let cx = x + 8 * k;
            while (cx < x + w - 16 * k) {
                const iw = range(rnd, 12, 30) * k;
                const ih = range(rnd, 14, 34) * k;
                const roll = rnd();
                if (roll > 0.9) lit(ctx, cx, y - ih - 3, iw, ih * 0.8, t, 1, t.accent);
                else if (roll > 0.25) mass(ctx, roll > 0.6 ? box(cx, y - ih - 3, iw, ih) : [[cx, y - 3], [cx + iw * 0.2, y - ih - 3], [cx + iw * 0.8, y - ih - 3], [cx + iw, y - 3]], t, rnd, { flat: true });
                cx += iw + range(rnd, 3, 10) * k;
            }
        }
    });
};

/** botti accatastate */
export const barrels: Element = (ctx, x, base, t, rnd, k) => {
    const r = range(rnd, 26, 38) * k;
    const row = 2 + Math.floor(rnd() * 2);
    for (let level = 0; level < 2; level++) {
        for (let i = 0; i < row - level; i++) {
            const cx = x + r + i * r * 2.05 + level * r;
            const cy = base - r - level * r * 1.75;
            const pts: XY[] = [];
            for (let a = 0; a < 10; a++) pts.push([cx + Math.cos((a / 10) * Math.PI * 2) * r, cy + Math.sin((a / 10) * Math.PI * 2) * r]);
            mass(ctx, pts, t, rnd, { hatch: 0.5 });
            ctx.strokeStyle = hex(t.shadow, 0.7);
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.62, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
};

/* ---------- sogno, memoria, vuoto ---------- */

/** pannello d'interfaccia appeso: i quadri del santuario sono finestre di un programma */
export const panel: Element = (ctx, x, base, t, rnd, k) => {
    const w = range(rnd, 90, 170) * k;
    const h = range(rnd, 120, 230) * k;
    const hang = rnd() > 0.4;
    const y = hang ? range(rnd, 60, 200) * k : base - h - range(rnd, 0, 30) * k;
    const a = (rnd() - 0.5) * 0.22;
    if (hang) for (const fx of [0.2, 0.8]) wire(ctx, [[x + w * fx, y + 4], [x + w * fx + range(rnd, -14, 14), -10]], 1.2, t, 0.8);
    tilted(ctx, x + w / 2, y + h / 2, a, () => {
        mass(ctx, box(x, y, w, h), t, rnd, {});
        const m = 7 * k + 2;
        ctx.fillStyle = t.recess;
        ctx.fillRect(x + m, y + m, w - m * 2, h - m * 2);
        ctx.fillStyle = hex(t.light, 0.5);
        ctx.fillRect(x + m, y + m, w - m * 2, 7 * k + 2);
        const kind = Math.floor(rnd() * 3);
        const ix = x + m + 6 * k;
        const iy = y + m + 16 * k;
        const iw = w - m * 2 - 12 * k;
        if (kind === 0) {
            // l'elenco dei livelli
            for (let r = 0; r < (h - m * 2 - 22 * k) / (11 * k); r++) {
                ctx.fillStyle = hex(r === 2 ? t.accent : t.light, r === 2 ? 0.55 : 0.3);
                ctx.fillRect(ix + (r % 3 ? 8 * k : 0), iy + r * 11 * k, iw * range(rnd, 0.4, 0.9), 3 * k + 1);
            }
        } else if (kind === 1) {
            // la griglia degli strumenti
            const cell = 14 * k;
            for (let r = 0; r * cell < h - m * 2 - 26 * k; r++) {
                for (let c = 0; c * cell < iw - cell * 0.5; c++) {
                    ctx.strokeStyle = hex(t.light, 0.4);
                    ctx.lineWidth = 1;
                    ctx.strokeRect(ix + c * cell, iy + r * cell, cell * 0.66, cell * 0.66);
                }
            }
        } else {
            // i campioni di colore
            for (let r = 0; r < 4; r++) {
                ctx.fillStyle = hex(mix(t.accent, r % 2 ? t.light : t.shadow, 0.2 + r * 0.2), 0.6);
                ctx.fillRect(ix, iy + r * 13 * k, iw, 10 * k);
            }
        }
        glow(ctx, x + w / 2, y + h / 2, w * 0.8, t, 0.1, t.accent);
    });
};

/** porta che galleggia, col filo di luce sotto */
export const floatDoor: Element = (ctx, x, base, t, rnd, k) => {
    const w = range(rnd, 44, 66) * k;
    const h = w * range(rnd, 1.9, 2.3);
    const y = base - range(rnd, 150, 460) * k;
    tilted(ctx, x + w / 2, y + h / 2, (rnd() - 0.5) * 0.9, () => {
        mass(ctx, box(x, y, w, h), t, rnd, { hatch: 0.4 });
        ctx.strokeStyle = hex(t.glow, t.glowA * 0.7);
        ctx.lineWidth = 1.6;
        ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
        ctx.fillStyle = t.recess;
        ctx.fillRect(x + w * 0.16, y + h * 0.1, w * 0.68, h * 0.34);
        ctx.fillRect(x + w * 0.16, y + h * 0.52, w * 0.68, h * 0.38);
        glow(ctx, x + w / 2, y + h / 2, h * 0.8, t, 0.16);
    });
};

/** cubi e schegge che si staccano dal mondo */
export const debris: Element = (ctx, x, base, t, rnd, k) => {
    const n = 5 + Math.floor(rnd() * 6);
    const cy = base - range(rnd, 120, 420) * k;
    for (let i = 0; i < n; i++) {
        const s = range(rnd, 7, 30) * k;
        const px = x + range(rnd, -90, 90) * k;
        const py = cy + range(rnd, -80, 80) * k;
        const a = rnd() * Math.PI;
        const pts: XY[] = [];
        const sides = 4 + Math.floor(rnd() * 2);
        for (let v = 0; v < sides; v++) pts.push([px + Math.cos(a + (v / sides) * Math.PI * 2) * s * range(rnd, 0.6, 1), py + Math.sin(a + (v / sides) * Math.PI * 2) * s * range(rnd, 0.6, 1)]);
        mass(ctx, pts, t, rnd, { flat: s < 14 });
    }
};

/** foglio di assi cartesiani che si piega nel vuoto */
export const gridSheet: Element = (ctx, x, base, t, rnd, k) => {
    const w = range(rnd, 150, 260) * k;
    const h = range(rnd, 60, 120) * k;
    const y = base - range(rnd, 60, 300) * k;
    const skew = (rnd() - 0.5) * 120 * k;
    const c: XY[] = [[x, y], [x + w, y - skew * 0.3], [x + w + skew, y + h], [x + skew * 0.6, y + h + skew * 0.2]];
    ctx.fillStyle = hex(t.body, 0.55);
    ctx.beginPath();
    c.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = hex(mix(t.light, t.glow, 0.5), 0.45);
    ctx.lineWidth = 1;
    ctx.beginPath();
    const n = 7;
    for (let i = 0; i <= n; i++) {
        const f = i / n;
        ctx.moveTo(c[0][0] + (c[1][0] - c[0][0]) * f, c[0][1] + (c[1][1] - c[0][1]) * f);
        ctx.lineTo(c[3][0] + (c[2][0] - c[3][0]) * f, c[3][1] + (c[2][1] - c[3][1]) * f);
        ctx.moveTo(c[0][0] + (c[3][0] - c[0][0]) * f, c[0][1] + (c[3][1] - c[0][1]) * f);
        ctx.lineTo(c[1][0] + (c[2][0] - c[1][0]) * f, c[1][1] + (c[2][1] - c[1][1]) * f);
    }
    ctx.stroke();
};

/** fotografia sospesa: dentro, un ricordo che non si distingue più */
export const polaroid: Element = (ctx, x, base, t, rnd, k) => {
    const w = range(rnd, 60, 120) * k;
    const h = w * 1.15;
    const y = base - range(rnd, 140, 470) * k;
    tilted(ctx, x + w / 2, y + h / 2, (rnd() - 0.5) * 0.5, () => {
        mass(ctx, box(x, y, w, h), t, rnd, { color: mix(t.body, t.light, 0.7) });
        ctx.fillStyle = hex(t.shadow, 0.9);
        ctx.fillRect(x + w * 0.09, y + w * 0.09, w * 0.82, w * 0.78);
        const cx = x + w / 2;
        const cy = y + w * 0.62;
        ctx.fillStyle = hex(mix(t.body, t.light, 0.35), 0.8);
        ctx.beginPath();
        if (rnd() > 0.5) {
            // un albero
            ctx.arc(cx, cy - w * 0.22, w * 0.2, 0, Math.PI * 2);
            ctx.rect(cx - w * 0.03, cy - w * 0.1, w * 0.06, w * 0.3);
        } else {
            // due figure
            for (const o of [-0.12, 0.12]) {
                ctx.moveTo(cx + w * o + w * 0.07, cy - w * 0.2);
                ctx.arc(cx + w * o, cy - w * 0.2, w * 0.07, 0, Math.PI * 2);
                ctx.rect(cx + w * o - w * 0.08, cy - w * 0.13, w * 0.16, w * 0.34);
            }
        }
        ctx.fill();
        glow(ctx, cx, y + h / 2, w * 0.9, t, 0.14);
    });
};

/** isola di roccia che galleggia con sopra quello che è rimasto: una sedia, uno specchio, una lapide */
export const island: Element = (ctx, x, base, t, rnd, k) => {
    const w = range(rnd, 90, 190) * k;
    const y = base - range(rnd, 110, 430) * k;
    const d = w * range(rnd, 0.35, 0.6);
    const pts: XY[] = [[x, y + 5], [x + w * 0.04, y], [x + w * 0.96, y - range(rnd, 0, 5)], [x + w, y + 5]];
    // il sotto: denti di roccia che pendono, più lunghi al centro
    const teeth = 4 + Math.floor(rnd() * 3);
    for (let i = teeth; i >= 0; i--) {
        const f = i / teeth;
        const tx = x + w * (0.08 + 0.84 * f);
        const deep = d * Math.sin(f * Math.PI) * range(rnd, 0.55, 1.15);
        pts.push([tx + (w / teeth) * 0.3, y + 10 + deep * 0.35], [tx, y + 12 + deep]);
    }
    mass(ctx, pts, t, rnd, { hatch: 0.8 });
    if (t.depth > 0) {
        ctx.fillStyle = hex(t.light, 0.35);
        ctx.fillRect(x + w * 0.06, y, w * 0.88, 1.6);
    }
    const px = x + w * range(rnd, 0.3, 0.6);
    const kind = Math.floor(rnd() * 4);
    if (kind === 0) {
        // sedia
        const s = 14 * k;
        limb(ctx, px, y, px, y - s * 2.4, 2.5 * k + 1, 2.5 * k + 1, t, rnd);
        limb(ctx, px + s, y, px + s, y - s * 1.1, 2.5 * k + 1, 2.5 * k + 1, t, rnd);
        limb(ctx, px - 1, y - s * 1.1, px + s + 1, y - s * 1.1, 3 * k + 1, 3 * k + 1, t, rnd);
    } else if (kind === 1) {
        // specchio
        limb(ctx, px, y, px, y - 20 * k, 3 * k + 1, 3 * k + 1, t, rnd);
        ctx.beginPath();
        ctx.ellipse(px, y - 40 * k, 13 * k, 22 * k, 0, 0, Math.PI * 2);
        ctx.fillStyle = hex(mix(t.haze, t.glow, 0.5), 0.5);
        ctx.fill();
        if (t.ink) {
            ctx.strokeStyle = t.ink;
            ctx.lineWidth = t.inkW * 1.4;
            ctx.stroke();
        }
    } else if (kind === 2) {
        gravestone(ctx, px, y, t, rnd, k * 0.9);
    } else {
        // statua incappucciata
        mass(ctx, [[px - 10 * k, y], [px - 8 * k, y - 34 * k], [px - 4 * k, y - 50 * k], [px, y - 56 * k], [px + 5 * k, y - 50 * k], [px + 9 * k, y - 32 * k], [px + 11 * k, y]], t, rnd, { hatch: 0.6 });
    }
};

/** lastra storta che spunta dal nulla, con una riga di luce che la taglia */
export const monolith: Element = (ctx, x, base, t, rnd, k) => {
    const w = range(rnd, 34, 76) * k;
    const h = range(rnd, 170, 420) * k;
    const y = base - range(rnd, -20, 120) * k;
    tilted(ctx, x + w / 2, y, (rnd() - 0.5) * 0.5, () => {
        mass(ctx, [[x, y + 30], [x + w * 0.06, y - h], [x + w * 0.6, y - h - 16 * k], [x + w, y - h + 22 * k], [x + w * 0.94, y + 30]], t, rnd, { hatch: 0.8 });
        const ly = y - h * range(rnd, 0.2, 0.8);
        ctx.fillStyle = hex(t.accent, t.glowA * 0.8);
        ctx.fillRect(x + 3, ly, w - 6, 1.6);
        glow(ctx, x + w / 2, ly, w * 0.9, t, 0.22, t.accent);
    });
};

/** cassa e impalcatura: il palco del nucleo */
export const stage: Element = (ctx, x, base, t, rnd, k) => {
    const w = range(rnd, 110, 170) * k;
    const h = range(rnd, 170, 300) * k;
    const lw = 2.4 * k + 0.8;
    for (const sx of [x, x + w]) wire(ctx, [[sx, base + 20], [sx, base - h]], lw * 1.3, t);
    const levels = Math.max(2, Math.floor(h / (64 * k)));
    for (let i = 1; i <= levels; i++) {
        const y0 = base - (h * (i - 1)) / levels;
        const y1 = base - (h * i) / levels;
        wire(ctx, [[x, y1], [x + w, y1]], lw, t);
        wire(ctx, i % 2 ? [[x, y0], [x + w, y1]] : [[x + w, y0], [x, y1]], lw * 0.6, t);
    }
    // le casse appese
    const n = 2 + Math.floor(rnd() * 2);
    for (let i = 0; i < n; i++) {
        const s = 34 * k;
        const sx = x + w * 0.5 - s / 2;
        const sy = base - h + 8 * k + i * (s + 3);
        mass(ctx, box(sx, sy, s, s), t, rnd, {});
        ctx.fillStyle = t.recess;
        ctx.beginPath();
        ctx.arc(sx + s / 2, sy + s / 2, s * 0.32, 0, Math.PI * 2);
        ctx.fill();
    }
    if (rnd() > 0.4) glow(ctx, x + w * 0.5, base - h, 60 * k, t, 0.3, t.accent);
};

/* ---------- cose basse, per i dipinti che sono già un primo piano ---------- */

/** muretto di pietra con la ringhiera */
export const lowWall: Element = (ctx, x, base, t, rnd, k) => {
    const w = range(rnd, 160, 300) * k;
    const h = range(rnd, 26, 44) * k;
    const pts: XY[] = [[x, base + 20], [x, base - h]];
    for (let i = 1; i < 6; i++) pts.push([x + (w * i) / 6, base - h + range(rnd, -3, 3) - (rnd() > 0.8 ? -h * 0.4 : 0)]);
    pts.push([x + w, base - h], [x + w, base + 20]);
    mass(ctx, pts, t, rnd, { hatch: 0.4 });
    masonry(ctx, x, base - h, w, h, t, rnd, 0.5);
    const rail = 30 * k;
    for (let px = x + 8 * k; px < x + w - 4; px += 16 * k) wire(ctx, [[px, base - h], [px, base - h - rail]], 1.4 * k + 0.4, t);
    wire(ctx, [[x + 4, base - h - rail], [x + w - 4, base - h - rail + range(rnd, -4, 4)]], 2 * k + 0.6, t);
};

/** banco coi monitor a tubo: qualcuno è rimasto acceso */
export const desk: Element = (ctx, x, base, t, rnd, k) => {
    const w = range(rnd, 110, 180) * k;
    const h = range(rnd, 46, 60) * k;
    limb(ctx, x - 4, base - h, x + w + 4, base - h, 6 * k + 1, 6 * k + 1, t, rnd);
    for (const fx of [0.06, 0.94]) limb(ctx, x + w * fx, base + 20, x + w * fx, base - h, 5 * k + 1, 5 * k + 1, t, rnd);
    let cx = x + 6 * k;
    while (cx < x + w - 30 * k) {
        const mw = range(rnd, 30, 46) * k;
        const mh = mw * 0.82;
        const stackN = rnd() > 0.7 ? 2 : 1;
        for (let s = 0; s < stackN; s++) {
            const my = base - h - 4 - mh * (s + 1);
            mass(ctx, box(cx, my, mw, mh), t, rnd, {});
            if (rnd() > 0.45) lit(ctx, cx + mw * 0.14, my + mh * 0.14, mw * 0.72, mh * 0.6, t, 1, t.accent);
            else {
                ctx.fillStyle = t.recess;
                ctx.fillRect(cx + mw * 0.14, my + mh * 0.14, mw * 0.72, mh * 0.6);
            }
        }
        cx += mw + range(rnd, 4, 16) * k;
    }
    for (let i = 0; i < 3; i++) sag(ctx, x + range(rnd, 0, w), base - h, x + range(rnd, 0, w), base + 10, 12 * k, 1.4, t);
};

/** nastro trasportatore con le bottiglie in fila */
export const conveyor: Element = (ctx, x, base, t, rnd, k) => {
    const w = range(rnd, 240, 400) * k;
    const y = base - range(rnd, 50, 90) * k;
    limb(ctx, x, y, x + w, y, 12 * k + 2, 12 * k + 2, t, rnd, { hatch: 0.3 });
    for (let px = x + 20 * k; px < x + w; px += 80 * k) {
        limb(ctx, px, base + 20, px, y + 6 * k, 6 * k + 1, 6 * k + 1, t, rnd);
        limb(ctx, px - 14 * k, base + 20, px, y + 30 * k, 3 * k + 1, 3 * k + 1, t, rnd);
    }
    ctx.fillStyle = t.recess;
    for (let rx = x + 8 * k; rx < x + w; rx += 14 * k) {
        ctx.beginPath();
        ctx.arc(rx, y, 3 * k, 0, Math.PI * 2);
        ctx.fill();
    }
    // le bottiglie: una ogni tanto manca, una ogni tanto brilla
    for (let bx = x + 12 * k; bx < x + w - 10 * k; bx += 15 * k) {
        if (rnd() < 0.18) continue;
        const bh = 26 * k;
        const by = y - 7 * k;
        ctx.fillStyle = hex(rnd() > 0.85 ? mix(t.body, t.accent, 0.5) : mix(t.body, t.light, 0.35));
        ctx.fillRect(bx, by - bh * 0.62, 7 * k, bh * 0.62);
        ctx.fillRect(bx + 2.2 * k, by - bh, 2.6 * k, bh * 0.42);
    }
    if (rnd() > 0.4) {
        const mx = x + w * range(rnd, 0.2, 0.8);
        mass(ctx, box(mx, y - 70 * k, 40 * k, 34 * k), t, rnd, { hatch: 0.4 });
        lit(ctx, mx + 6 * k, y - 62 * k, 12 * k, 8 * k, t, 2, t.accent);
        smoke(ctx, mx + 30 * k, y - 72 * k, t, 60 * k, 30 * k);
    }
};

/** discarica di bottiglie: colli di vetro che spuntano dal mucchio */
export const bottleHeap: Element = (ctx, x, base, t, rnd, k) => {
    const w = range(rnd, 130, 220) * k;
    const h = range(rnd, 36, 64) * k;
    for (let i = 0; i < 12; i++) {
        const bx = x + range(rnd, 0.05, 0.95) * w;
        const by = base - h * range(rnd, 0.2, 0.8) * Math.sin(((bx - x) / w) * Math.PI);
        const a = (rnd() - 0.5) * 1.6;
        const bl = range(rnd, 18, 30) * k;
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(a);
        ctx.fillStyle = hex(rnd() > 0.7 ? mix(t.body, t.accent, 0.4) : mix(t.body, t.light, 0.3));
        ctx.fillRect(-3.5 * k, -bl * 0.6, 7 * k, bl * 0.6);
        ctx.fillRect(-1.3 * k, -bl, 2.6 * k, bl * 0.45);
        ctx.restore();
    }
    heap(ctx, x, base, w, h * 0.8, t, rnd, 5);
};
