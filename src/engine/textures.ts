import Phaser from 'phaser';
import { TILE } from '../config';

/* il protagonista e il mondo usano gli asset dipinti della legacy;
   qui si genera il resto del cast: silhouette scure + glow acidi,
   pensate per stare sotto le luci 2d senza stonare coi dipinti */

function mulberry32(seed: number): () => number {
    let a = seed;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function glow(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number, color: number, alpha = 0.35): void {
    for (let i = 3; i >= 1; i--) {
        g.fillStyle(color, (alpha / 3) * (4 - i));
        g.fillCircle(x, y, (r * i) / 1.6);
    }
    g.fillStyle(color, 1);
    g.fillCircle(x, y, r / 2);
}

function make(scene: Phaser.Scene, key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void): void {
    const g = scene.add.graphics();
    draw(g);
    g.generateTexture(key, w, h);
    g.destroy();
}


function objects(scene: Phaser.Scene): void {
    // microfono checkpoint

    // porta-teorema: lastra di enunciato che blocca i corridoi della mente
    make(scene, 'porta-teorema', 36, 128, (p) => {
        p.fillStyle(0x0c1322, 0.92);
        p.fillRoundedRect(4, 0, 28, 128, 5);
        p.lineStyle(2, 0x60a5fa, 0.85);
        p.strokeRoundedRect(4, 0, 28, 128, 5);
        // righe di dimostrazione illeggibili
        p.lineStyle(1.5, 0x60a5fa, 0.45);
        for (let i = 0; i < 7; i++) {
            p.beginPath();
            p.moveTo(9, 12 + i * 16); p.lineTo(9 + 8 + (i % 3) * 6, 12 + i * 16);
            p.strokePath();
        }
        // il punto di domanda al centro
        p.lineStyle(3, 0xffffff, 0.85);
        p.beginPath();
        p.arc(18, 56, 7, Math.PI * 0.8, Math.PI * 2.2);
        p.strokePath();
        p.beginPath();
        p.moveTo(18, 63); p.lineTo(18, 70);
        p.strokePath();
        glow(p, 18, 78, 2, 0xffffff, 0.6);
    });

    // barra: nota musicale gialla
    make(scene, 'barra', 14, 16, (n) => {
        glow(n, 5, 12, 3.2, 0xfacc15, 0.45);
        n.lineStyle(1.5, 0xfacc15, 0.95);
        n.beginPath();
        n.moveTo(7, 12); n.lineTo(7, 2); n.lineTo(11, 4);
        n.strokePath();
    });

    // frammento della gecowave
    make(scene, 'fragment', 36, 36, (w) => {
        glow(w, 18, 18, 7, 0x4ade80, 0.35);
        w.fillStyle(0x0f1f16, 1);
        w.beginPath();
        w.moveTo(18, 3); w.lineTo(30, 14); w.lineTo(25, 32); w.lineTo(11, 32); w.lineTo(6, 14);
        w.closePath();
        w.fillPath();
        w.lineStyle(1.5, 0x4ade80, 0.9);
        w.strokePath();
        w.lineStyle(1, 0x4ade80, 0.45);
        w.beginPath();
        w.moveTo(18, 3); w.lineTo(18, 32);
        w.moveTo(6, 14); w.lineTo(25, 32);
        w.moveTo(30, 14); w.lineTo(11, 32);
        w.strokePath();
    });

    // cuore del realm: +1 tacca di vita per sempre
    make(scene, 'cuore', 30, 30, (c) => {
        glow(c, 15, 15, 6, 0xf87171, 0.35);
        c.fillStyle(0x2a0f14, 1);
        c.fillCircle(10, 11, 6);
        c.fillCircle(20, 11, 6);
        c.fillTriangle(4.5, 14, 25.5, 14, 15, 27);
        c.lineStyle(1.5, 0xf87171, 0.9);
        c.beginPath();
        c.arc(10, 11, 6, Math.PI * 0.8, Math.PI * 1.95);
        c.strokePath();
        c.beginPath();
        c.arc(20, 11, 6, Math.PI * 1.05, Math.PI * 2.2);
        c.strokePath();
        c.beginPath();
        c.moveTo(4.5, 14); c.lineTo(15, 27); c.lineTo(25.5, 14);
        c.strokePath();
    });

    // maschera della mia stessa faccia: collezionabile, perfetta, ritmica
    make(scene, 'maschera', 28, 32, (m) => {
        glow(m, 14, 16, 6, 0x4ade80, 0.3);
        m.fillStyle(0x0f1a14, 1);
        m.fillEllipse(14, 16, 20, 26);
        m.lineStyle(1.5, 0x4ade80, 0.9);
        m.strokeEllipse(14, 16, 20, 26);
        // occhi da geco, vuoti
        m.fillStyle(0x000000, 1);
        m.fillEllipse(10, 12, 5, 7);
        m.fillEllipse(18, 12, 5, 7);
        m.lineStyle(1, 0x4ade80, 0.6);
        m.strokeEllipse(10, 12, 5, 7);
        m.strokeEllipse(18, 12, 5, 7);
        // sorriso fisso, perfetto, ritmico
        m.lineStyle(1.5, 0x4ade80, 0.8);
        m.beginPath();
        m.arc(14, 20, 5, 0.3, Math.PI - 0.3);
        m.strokePath();
    });

    // varco verso i capitoli segreti: anello che pulsa, vuoto al centro
    make(scene, 'portal', 52, 64, (p) => {
        // una fenditura appena percettibile: si nota solo se la cerchi
        glow(p, 26, 32, 10, 0x4ade80, 0.12);
        p.lineStyle(1, 0x4ade80, 0.25);
        p.strokeEllipse(26, 32, 34, 50);
        p.lineStyle(1, 0xa855f7, 0.2);
        p.strokeEllipse(26, 32, 24, 38);
        p.fillStyle(0x05080a, 0.7);
        p.fillEllipse(26, 32, 18, 30);
        // un solo frammento smorto, quasi spento
        p.fillStyle(0xfde047, 0.35);
        p.fillCircle(26, 9, 1.6);
    });

    // stele della lore
    make(scene, 'lore-tablet', 28, 38, (l) => {
        l.fillStyle(0x140e1c, 1);
        l.fillRoundedRect(4, 4, 20, 30, { tl: 9, tr: 9, bl: 2, br: 2 });
        l.lineStyle(1, 0x3b2752, 1);
        l.strokeRoundedRect(4, 4, 20, 30, { tl: 9, tr: 9, bl: 2, br: 2 });
        l.lineStyle(1, 0xc084fc, 0.5);
        l.beginPath();
        l.moveTo(9, 12); l.lineTo(19, 12);
        l.moveTo(9, 17); l.lineTo(19, 17);
        l.moveTo(9, 22); l.lineTo(15, 22);
        l.strokePath();
    });

    // proiettili (tinta a runtime)
    make(scene, 'proj-ball', 14, 14, (p) => glow(p, 7, 7, 3.4, 0xffffff, 0.55));
    // lametta dal suolo
    make(scene, 'proj-lametta', 18, 40, (p) => {
        p.fillStyle(0x1a1622, 1);
        p.fillTriangle(9, 0, 16, 40, 2, 40);
        p.lineStyle(1, 0xc084fc, 0.7);
        p.strokeTriangle(9, 0, 16, 40, 2, 40);
        glow(p, 9, 8, 1.6, 0xc084fc, 0.4);
    });

    // fantasmino delle barre perse
    make(scene, 'drop-ghost', 30, 26, (gh) => {
        gh.fillStyle(0x4ade80, 0.25);
        gh.fillEllipse(14, 16, 20, 14);
        gh.fillCircle(20, 9, 6);
        glow(gh, 21, 8, 2.5, 0x4ade80, 0.5);
    });

    // goccia di colore (arena di lametta)
    make(scene, 'color-drop', 18, 18, (c) => glow(c, 9, 9, 4, 0xffffff, 0.6));

    // lo specchio nero: l'unica uscita
    make(scene, 'black-mirror', 44, 72, (m) => {
        m.fillStyle(0x000000, 1);
        m.fillEllipse(22, 36, 36, 64);
        m.lineStyle(2, 0xc084fc, 0.8);
        m.strokeEllipse(22, 36, 36, 64);
        m.lineStyle(1, 0xc084fc, 0.3);
        m.strokeEllipse(22, 36, 28, 54);
    });

    // i glifi dell'analisi vivono in abilityFx: sei simboli a gesso
}

/* ---------- particelle e spine ---------- */

function particles(scene: Phaser.Scene): void {
    make(scene, 'p-dot', 16, 16, (dot) => {
        for (let i = 4; i >= 1; i--) {
            dot.fillStyle(0xffffff, 0.25 * ((5 - i) / 4));
            dot.fillCircle(8, 8, i * 2);
        }
    });
    make(scene, 'p-spark', 12, 6, (spark) => {
        spark.fillStyle(0xffffff, 1);
        spark.fillTriangle(0, 3, 12, 0, 12, 6);
    });

    make(scene, 'spikes', TILE, TILE, (s) => {
        s.fillStyle(0x16161c, 1);
        for (let i = 0; i < 4; i++) {
            const x = i * 8;
            s.fillTriangle(x, TILE, x + 4, TILE - 14, x + 8, TILE);
        }
        s.fillStyle(0xf87171, 0.45);
        for (let i = 0; i < 4; i++) {
            const x = i * 8;
            s.fillTriangle(x + 2.5, TILE - 8, x + 4, TILE - 14, x + 5.5, TILE - 8);
        }
    });
}

/* ---------- nebbia frontale ---------- */

export function generateFogTexture(scene: Phaser.Scene): void {
    // velo di nebbia tileabile, passa DAVANTI al giocatore
    if (!scene.textures.exists('fog')) {
        const tex = scene.textures.createCanvas('fog', 512, 512)!;
        const ctx = tex.getContext();
        const rnd = mulberry32(777);
        for (let i = 0; i < 90; i++) {
            const x = rnd() * 512;
            const y = rnd() * 512;
            const r = 40 + rnd() * 90;
            const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
            grad.addColorStop(0, 'rgba(170,180,200,0.05)');
            grad.addColorStop(1, 'rgba(170,180,200,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(x - r, y - r, r * 2, r * 2);
        }
        tex.refresh();
    }
}

export function generateBaseTextures(scene: Phaser.Scene): void {
    objects(scene);
    particles(scene);
}
