import type { BiomeDef } from '../../content/biomes';
import { canvas, hashString, hex, mulberry32, range, type Rng } from '../ink';
import type { Ctx } from './brush';
import * as E from './elements';
import { toneFor, type ScenePalette, type Tone } from './palette';

/* i tre piani del parallasse, una ricetta per posto: lontano l'architettura,
   in mezzo le strutture, vicino gli oggetti. tutto tileabile in orizzontale */

export const SKY_W = 2048;
export const LAYER_H = [640, 520, 400] as const;

type Ground = 'grass' | 'rubble' | 'reeds' | 'flat' | 'none';

interface Layer {
    /** elemento e peso nella scelta */
    els: [E.Element, number][];
    /** passo tra un elemento e il successivo */
    gap: [number, number];
    k?: number;
}

interface Recipe {
    far: Layer;
    mid: Layer;
    near: Layer;
    ground: Ground;
    /** quanto ondeggia il profilo del terreno */
    roll: number;
    /** quanto il piano lontano si scioglie nella foschia: alto sui panorami, basso sui dipinti in primo piano */
    air: number;
}

const RECIPES: Record<string, Recipe> = {
    /* il cratere: i palazzoni caduti del dipinto, archi, alberi morti, lapidi */
    crater: {
        far: { els: [[E.tower, 4], [E.arcade, 1]], gap: [340, 640], k: 0.8 },
        mid: { els: [[E.deadTree, 3], [E.arcade, 2], [E.gravestone, 1]], gap: [340, 620], k: 0.8 },
        near: { els: [[E.gravestone, 3], [E.deadTree, 1], [E.rubble, 2], [E.fence, 1]], gap: [380, 720], k: 0.75 },
        ground: 'grass', roll: 38, air: 0.8,
    },
    /* capolinea: autobus a due piani accatastati, pali, fermate */
    depot: {
        far: { els: [[E.doubleDecker, 3], [E.pole, 2]], gap: [320, 560], k: 0.75 },
        mid: { els: [[E.doubleDecker, 2], [E.pole, 3], [E.busStop, 1]], gap: [340, 600], k: 0.8 },
        near: { els: [[E.busStop, 3], [E.fence, 2], [E.rubble, 2], [E.carWreck, 1]], gap: [400, 760], k: 0.8 },
        ground: 'rubble', roll: 12, air: 0.5,
    },
    /* santuario: finestre d'interfaccia appese come quadri, cristalli */
    sanctum: {
        far: { els: [[E.panel, 3], [E.crystals, 2]], gap: [320, 560], k: 0.6 },
        mid: { els: [[E.crystals, 3], [E.arcade, 1], [E.panel, 1]], gap: [340, 600], k: 0.65 },
        near: { els: [[E.crystals, 1]], gap: [420, 800], k: 0.6 },
        ground: 'flat', roll: 14, air: 0.3,
    },
    /* tecnokill: grattacieli sventrati, muri coi graffiti, semafori, barricate */
    wasteland: {
        far: { els: [[E.tower, 2], [E.lattice, 1], [E.wallRuin, 2]], gap: [340, 600], k: 0.7 },
        mid: { els: [[E.wallRuin, 3], [E.trafficLight, 2], [E.pole, 1]], gap: [340, 620], k: 0.75 },
        near: { els: [[E.barricade, 3], [E.carWreck, 2], [E.rubble, 2], [E.trafficLight, 1]], gap: [400, 760], k: 0.8 },
        ground: 'rubble', roll: 26, air: 0.45,
    },
    /* trenbolone: il vicolo. tubi, bidoni, la discarica di bottiglie */
    lab: {
        far: { els: [[E.pipeRun, 3], [E.barrels, 1], [E.tank, 1]], gap: [340, 600], k: 0.65 },
        mid: { els: [[E.bottleHeap, 3], [E.barrels, 2], [E.lamp, 1]], gap: [340, 620], k: 0.75 },
        near: { els: [[E.bottleHeap, 2], [E.rubble, 2], [E.barrels, 1]], gap: [400, 760], k: 0.75 },
        ground: 'rubble', roll: 10, air: 0.3,
    },
    /* la tana: stalagmiti, alberi morti, ossa */
    burrow: {
        far: { els: [[E.stalagmite, 2], [E.deadTree, 1]], gap: [320, 580], k: 0.6 },
        mid: { els: [[E.deadTree, 2], [E.gravestone, 1], [E.stalagmite, 1]], gap: [340, 620], k: 0.7 },
        near: { els: [[E.deadTree, 1], [E.rubble, 2], [E.gravestone, 1]], gap: [400, 760], k: 0.7 },
        ground: 'grass', roll: 30, air: 0.3,
    },
    /* il rio: le mesa del canyon, capanne su palafitte, alberi contorti */
    swamp: {
        far: { els: [[E.mesa, 1]], gap: [460, 760], k: 0.62 },
        mid: { els: [[E.shack, 3], [E.deadTree, 2]], gap: [340, 620], k: 0.8 },
        near: { els: [[E.shack, 2], [E.deadTree, 2], [E.fence, 1]], gap: [420, 800], k: 0.75 },
        ground: 'reeds', roll: 20, air: 0.5,
    },
    /* stabilimento: il nastro delle bottiglie, serbatoi, tubi */
    factory: {
        far: { els: [[E.conveyor, 2], [E.tank, 2], [E.chimney, 1]], gap: [360, 620], k: 0.6 },
        mid: { els: [[E.pipeRun, 3], [E.conveyor, 2]], gap: [360, 640], k: 0.75 },
        near: { els: [[E.pipeRun, 2], [E.barrels, 3]], gap: [400, 760], k: 0.75 },
        ground: 'flat', roll: 6, air: 0.3,
    },
    /* la ruhra: cattedrali in rovina, arcate, scaffali di libri */
    library: {
        far: { els: [[E.gothic, 2], [E.arcade, 2]], gap: [360, 640], k: 0.62 },
        mid: { els: [[E.arcade, 3], [E.shelf, 2]], gap: [340, 620], k: 0.75 },
        near: { els: [[E.rubble, 3], [E.shelf, 1], [E.gravestone, 1]], gap: [400, 760], k: 0.75 },
        ground: 'rubble', roll: 14, air: 0.45,
    },
    /* la mente: porte, cubi e fogli di assi che galleggiano */
    mind: {
        far: { els: [[E.gridSheet, 2], [E.floatDoor, 2], [E.debris, 2]], gap: [300, 560], k: 0.8 },
        mid: { els: [[E.floatDoor, 2], [E.debris, 3]], gap: [360, 640], k: 0.9 },
        near: { els: [[E.debris, 3], [E.crystals, 1]], gap: [440, 820], k: 0.8 },
        ground: 'none', roll: 0, air: 0.55,
    },
    /* il caso: il dipinto è già la strada. lampioni, muretti, auto ferme sotto la pioggia */
    noir: {
        far: { els: [[E.lamp, 3], [E.lowWall, 2]], gap: [300, 520], k: 0.75 },
        mid: { els: [[E.lamp, 2], [E.carWreck, 2], [E.busStop, 1], [E.lowWall, 1]], gap: [340, 620], k: 0.85 },
        near: { els: [[E.lamp, 2], [E.barricade, 1], [E.fence, 1]], gap: [440, 820], k: 0.9 },
        ground: 'flat', roll: 4, air: 0.3,
    },
    /* sorveglianza: banchi di monitor, tralicci, cavi */
    servers: {
        far: { els: [[E.desk, 3], [E.lattice, 2], [E.serverWall, 1]], gap: [320, 560], k: 0.55 },
        mid: { els: [[E.desk, 3], [E.lattice, 1]], gap: [340, 620], k: 0.75 },
        near: { els: [[E.barricade, 2], [E.desk, 1]], gap: [440, 820], k: 0.75 },
        ground: 'flat', roll: 4, air: 0.3,
    },
    /* la cantina: scaffali, botti, un banco coi monitor */
    cellar: {
        far: { els: [[E.shelf, 3], [E.barrels, 1]], gap: [320, 560], k: 0.65 },
        mid: { els: [[E.barrels, 3], [E.desk, 1], [E.shelf, 1]], gap: [340, 620], k: 0.75 },
        near: { els: [[E.barrels, 3], [E.barricade, 1]], gap: [440, 820], k: 0.75 },
        ground: 'flat', roll: 6, air: 0.3,
    },
    /* i ricordi: fotografie sospese */
    memory: {
        far: { els: [[E.polaroid, 3], [E.debris, 1]], gap: [280, 520], k: 0.8 },
        mid: { els: [[E.polaroid, 3], [E.monolith, 1]], gap: [360, 660], k: 0.9 },
        near: { els: [[E.polaroid, 2], [E.debris, 2]], gap: [460, 860], k: 0.85 },
        ground: 'none', roll: 0, air: 0.6,
    },
    /* il void: isole alla deriva con quel che resta sopra */
    void: {
        far: { els: [[E.island, 3], [E.debris, 1]], gap: [300, 560], k: 0.8 },
        mid: { els: [[E.island, 3], [E.monolith, 1]], gap: [380, 680], k: 0.9 },
        near: { els: [[E.island, 2], [E.monolith, 1]], gap: [480, 880], k: 0.85 },
        ground: 'none', roll: 0, air: 0.4,
    },
    /* il nucleo: lastre, torri a pezzi, il palco */
    core: {
        far: { els: [[E.monolith, 3], [E.tower, 1], [E.debris, 1]], gap: [320, 580], k: 0.65 },
        mid: { els: [[E.stage, 2], [E.monolith, 2], [E.debris, 1]], gap: [360, 660], k: 0.75 },
        near: { els: [[E.stage, 1], [E.lattice, 1], [E.debris, 1]], gap: [460, 860], k: 0.7 },
        ground: 'flat', roll: 6, air: 0.4,
    },
    /* la provincia: pali storti, il campanile, muri scrostati, auto bruciate, reti */
    province: {
        far: { els: [[E.pole, 3], [E.belltower, 1], [E.wallRuin, 2]], gap: [340, 600], k: 0.7 },
        mid: { els: [[E.pole, 2], [E.carWreck, 2], [E.fence, 2]], gap: [340, 620], k: 0.85 },
        near: { els: [[E.carWreck, 3], [E.fence, 2], [E.rubble, 1]], gap: [400, 760], k: 0.8 },
        ground: 'rubble', roll: 14, air: 0.45,
    },
    /* la piazza: facciate, il campanile, lampioni accesi */
    piazza: {
        far: { els: [[E.facade, 3], [E.belltower, 1]], gap: [300, 480], k: 0.7 },
        mid: { els: [[E.lamp, 3], [E.arcade, 1], [E.lowWall, 1]], gap: [340, 600], k: 0.8 },
        near: { els: [[E.lamp, 2], [E.busStop, 1], [E.fence, 1]], gap: [440, 820], k: 0.85 },
        ground: 'flat', roll: 6, air: 0.45,
    },
};
RECIPES.title = RECIPES.crater;

function pickElement(layer: Layer, rnd: Rng): E.Element {
    const total = layer.els.reduce((s, [, w]) => s + w, 0);
    let roll = rnd() * total;
    for (const [el, w] of layer.els) {
        roll -= w;
        if (roll <= 0) return el;
    }
    return layer.els[0][0];
}

/** profilo del terreno: armoniche intere, così il bordo si richiude su se stesso */
function ridge(rnd: Rng, amp: number): (x: number) => number {
    const waves = [2, 3, 5, 9, 14].map((n, i) => ({ n, a: amp / (1 + i * 1.3), ph: rnd() * Math.PI * 2 }));
    return (x: number) => {
        let y = 0;
        for (const w of waves) y += Math.sin((x / SKY_W) * Math.PI * 2 * w.n + w.ph) * w.a;
        return y;
    };
}

function ground(ctx: Ctx, kind: Ground, base: number, h: number, roll: number, t: Tone, rnd: Rng): void {
    if (kind === 'none') return;
    const yAt = ridge(rnd, roll * (0.5 + t.depth * 0.25));
    const top = (x: number) => base + 6 - roll * 0.5 + yAt(((x % SKY_W) + SKY_W) % SKY_W);
    const g = ctx.createLinearGradient(0, base - roll, 0, h);
    g.addColorStop(0, hex(t.body));
    g.addColorStop(1, hex(t.shadow));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= SKY_W; x += 6) ctx.lineTo(x, top(x));
    ctx.lineTo(SKY_W, h);
    ctx.closePath();
    ctx.fill();
    const edge = (color: string, width: number, dy: number): void => {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();
        for (let x = 0; x <= SKY_W; x += 6) ctx[x ? 'lineTo' : 'moveTo'](x, top(x) + dy);
        ctx.stroke();
    };
    if (t.rim) edge(t.rim, t.inkW, t.inkW);
    if (t.ink) edge(t.ink, t.inkW, 0);
    // quel che cresce o resta sul bordo: disegnato tre volte, per non lasciare cuciture
    const fringe = (seed: number, off: number): void => {
        const r = mulberry32(seed);
        const s = 0.5 + t.depth * 0.25;
        ctx.strokeStyle = hex(t.shadow);
        ctx.fillStyle = hex(t.body);
        for (let x = r() * 20; x < SKY_W; x += range(r, 10, 60)) {
            const px = x + off;
            const py = top(x) + 2;
            if (kind === 'grass') {
                const blades = 2 + Math.floor(r() * 4);
                ctx.lineWidth = 1.4 * s + 0.4;
                ctx.beginPath();
                for (let b = 0; b < blades; b++) {
                    const lean = range(r, -9, 9) * s;
                    ctx.moveTo(px + b * 3 * s, py);
                    ctx.quadraticCurveTo(px + b * 3 * s + lean * 0.3, py - 10 * s, px + b * 3 * s + lean, py - range(r, 10, 26) * s);
                }
                ctx.stroke();
            } else if (kind === 'reeds') {
                if (r() > 0.45) continue;
                const n = 2 + Math.floor(r() * 4);
                for (let b = 0; b < n; b++) {
                    const rx = px + b * 6 * s;
                    const rh = range(r, 30, 80) * s;
                    const lean = range(r, -10, 10) * s;
                    ctx.lineWidth = 1.6 * s + 0.4;
                    ctx.beginPath();
                    ctx.moveTo(rx, py);
                    ctx.quadraticCurveTo(rx + lean * 0.2, py - rh * 0.6, rx + lean, py - rh);
                    ctx.stroke();
                    if (r() > 0.5) {
                        ctx.beginPath();
                        ctx.ellipse(rx + lean, py - rh, 2.4 * s + 0.6, 8 * s, lean * 0.02, 0, Math.PI * 2);
                        ctx.fillStyle = hex(t.shadow);
                        ctx.fill();
                    }
                }
            } else if (kind === 'rubble') {
                if (r() > 0.5) continue;
                const w = range(r, 8, 26) * s;
                ctx.beginPath();
                ctx.moveTo(px - w / 2, py + 3);
                ctx.lineTo(px - w * 0.3, py - w * range(r, 0.3, 0.7));
                ctx.lineTo(px + w * 0.2, py - w * range(r, 0.4, 0.8));
                ctx.lineTo(px + w / 2, py + 3);
                ctx.closePath();
                ctx.fillStyle = hex(t.body);
                ctx.fill();
                if (t.ink) {
                    ctx.strokeStyle = t.ink;
                    ctx.lineWidth = t.inkW * 0.8;
                    ctx.stroke();
                }
            }
        }
    };
    if (kind !== 'flat') {
        const seed = Math.floor(rnd() * 1e9);
        for (const off of [-SKY_W, 0, SKY_W]) fringe(seed, off);
    }
}

/** la mano del pittore sopra le masse: macchie d'acquerello, grana, i piedi nella foschia */
function finish(ctx: Ctx, h: number, t: Tone, rnd: Rng, floating: boolean): void {
    ctx.globalCompositeOperation = 'source-atop';
    for (let i = 0; i < 46; i++) {
        const x = rnd() * SKY_W;
        const y = rnd() * h;
        const r = range(rnd, 50, 190);
        const c = rnd() > 0.5 ? t.light : t.shadow;
        for (const off of [-SKY_W, 0, SKY_W]) {
            const g = ctx.createRadialGradient(x + off, y, 0, x + off, y, r);
            g.addColorStop(0, hex(c, 0.1));
            g.addColorStop(1, hex(c, 0));
            ctx.fillStyle = g;
            ctx.fillRect(x + off - r, y - r, r * 2, r * 2);
        }
    }
    if (t.depth > 0) {
        for (let i = 0; i < 2600; i++) {
            ctx.fillStyle = hex(rnd() > 0.5 ? t.light : t.shadow, 0.05 + rnd() * 0.09);
            const s = 0.8 + rnd() * 1.6;
            ctx.fillRect(rnd() * SKY_W, rnd() * h, s, s);
        }
    }
    const g = ctx.createLinearGradient(0, floating ? 0 : h * 0.4, 0, h);
    const feet = [0.66, 0.46, 0.24][t.depth];
    g.addColorStop(0, hex(t.haze, floating ? feet * 0.2 : 0));
    g.addColorStop(1, hex(t.haze, feet));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, SKY_W, h);
    ctx.globalCompositeOperation = 'source-over';
}

/** i piani lontani sono fuori fuoco: sfocatura che gira attorno al bordo, senza cuciture */
function soften(src: HTMLCanvasElement, px: number): HTMLCanvasElement {
    if (px <= 0) return src;
    const { el, ctx } = canvas(src.width, src.height);
    ctx.filter = `blur(${px}px)`;
    for (const off of [-src.width, 0, src.width]) ctx.drawImage(src, off, 0);
    ctx.filter = 'none';
    return el;
}

const cache = new Map<string, HTMLCanvasElement>();

export function recipeId(biome: BiomeDef): string {
    return RECIPES[biome.id] ? biome.id : 'crater';
}

/** un piano di parallasse tileabile, base in fondo al canvas. key distingue le palette */
export function sceneryCanvas(key: string, biome: BiomeDef, palette: ScenePalette, depth: number): HTMLCanvasElement {
    const id = `${key}:${depth}`;
    const hit = cache.get(id);
    if (hit) return hit;
    const recipe = RECIPES[recipeId(biome)];
    const layer = [recipe.far, recipe.mid, recipe.near][depth];
    const h = LAYER_H[depth];
    const { el, ctx } = canvas(SKY_W, h);
    const rnd = mulberry32(hashString(`${biome.id}:${depth}`));
    const tone = toneFor(palette, depth, recipe.air);
    const floating = recipe.ground === 'none';
    const base = h - 44;
    const k = layer.k ?? 1;

    // chi sta vicino al bordo si ridisegna dall'altra parte: niente cuciture
    const placed: { el: E.Element; x: number; seed: number }[] = [];
    let x = rnd() * 120;
    while (x < SKY_W - layer.gap[0] * 0.5) {
        placed.push({ el: pickElement(layer, rnd), x, seed: Math.floor(rnd() * 1e9) });
        x += range(rnd, layer.gap[0], layer.gap[1]);
    }
    for (const p of placed) {
        for (const off of [-SKY_W, 0, SKY_W]) p.el(ctx, p.x + off, base, tone, mulberry32(p.seed), k);
    }
    ground(ctx, recipe.ground, base, h, recipe.roll, tone, rnd);
    finish(ctx, h, tone, rnd, floating);

    const out = soften(el, [1.5, 0.6, 0][depth]);
    cache.set(id, out);
    return out;
}
