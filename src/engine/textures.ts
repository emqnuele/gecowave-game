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

const INK = 0x12131a;
const INK_EDGE = 0x2b2d3d;

/* ---------- npc ---------- */

function npcs(scene: Phaser.Scene): void {
    // markolino: l'unico che ha capito cosa sta succedendo
    make(scene, 'npc-markolino', 32, 48, (g) => {
        g.fillStyle(INK, 1);
        g.fillEllipse(16, 32, 18, 26);
        g.fillCircle(16, 12, 8);
        // cappellino storto
        g.fillStyle(0x14301f, 1);
        g.fillEllipse(15, 7, 16, 7);
        g.fillRect(4, 5, 10, 4);
        g.lineStyle(3, INK, 1);
        g.beginPath();
        g.moveTo(10, 38); g.lineTo(9, 46);
        g.moveTo(22, 38); g.lineTo(23, 46);
        g.strokePath();
        glow(g, 13, 13, 1.8, 0x4ade80, 0.5);
        glow(g, 19, 13, 1.8, 0x4ade80, 0.5);
    });

    // ivan maggini: la furia che può tagliare guggu
    make(scene, 'npc-ivan', 44, 56, (g) => {
        // spadone sulla schiena
        g.fillStyle(0x232633, 1);
        g.fillTriangle(34, 2, 40, 2, 37, 34);
        g.lineStyle(1, 0x3a4252, 1);
        g.strokeTriangle(34, 2, 40, 2, 37, 34);
        g.fillStyle(INK, 1);
        g.fillEllipse(20, 36, 30, 36);
        g.fillCircle(20, 13, 9);
        // spalle enormi
        g.fillEllipse(20, 24, 36, 14);
        g.lineStyle(4, INK, 1);
        g.beginPath();
        g.moveTo(12, 48); g.lineTo(11, 55);
        g.moveTo(28, 48); g.lineTo(29, 55);
        g.strokePath();
        glow(g, 17, 12, 2, 0xfacc15, 0.5);
        glow(g, 24, 12, 2, 0xfacc15, 0.5);
    });

    // smela: vende l'acqua della sorgente. non comprarla.
    make(scene, 'npc-smela', 30, 48, (g) => {
        g.fillStyle(INK, 1);
        g.fillEllipse(14, 32, 14, 30);
        g.fillCircle(14, 11, 7);
        // braccio col prodotto in bella vista
        g.lineStyle(2.5, INK, 1);
        g.beginPath();
        g.moveTo(19, 22); g.lineTo(26, 18);
        g.strokePath();
        g.fillStyle(0x22d3ee, 0.7);
        g.fillRoundedRect(24, 10, 6, 11, 2);
        glow(g, 27, 9, 1.6, 0x22d3ee, 0.4);
        // sorriso da venditore
        g.lineStyle(1.5, INK_EDGE, 1);
        g.beginPath();
        g.arc(14, 13, 3, 0.2, Math.PI - 0.2);
        g.strokePath();
    });

    // filippus il dodo: dodo estinto ma troppo muscoloso per restarlo
    make(scene, 'npc-filippus', 46, 54, (g) => {
        g.fillStyle(INK, 1);
        // petto enorme da panca piana
        g.fillEllipse(23, 36, 42, 34);
        // braccia gonfie
        g.fillEllipse(7, 34, 13, 24);
        g.fillEllipse(39, 34, 13, 24);
        // testolina da dodo, sproporzionata
        g.fillCircle(23, 13, 9);
        // becco
        g.fillStyle(0x3a4252, 1);
        g.fillTriangle(23, 11, 23, 19, 35, 16);
        // ciuffo di piume
        g.fillStyle(INK, 1);
        g.fillTriangle(15, 5, 17, 1, 20, 6);
        g.fillTriangle(19, 4, 21, 0, 24, 5);
        // occhio acceso
        glow(g, 21, 11, 2.2, 0x60a5fa, 0.7);
        // zampette tozze
        g.lineStyle(4.5, INK, 1);
        g.beginPath();
        g.moveTo(17, 51); g.lineTo(16, 54);
        g.moveTo(29, 51); g.lineTo(30, 54);
        g.strokePath();
    });

    // piema: dio creatore, attualmente fuso per analisi 1
    make(scene, 'npc-piema', 34, 52, (g) => {
        g.fillStyle(0x16161f, 1);
        g.beginPath();
        g.moveTo(17, 6);
        g.lineTo(31, 50);
        g.lineTo(3, 50);
        g.closePath();
        g.fillPath();
        g.lineStyle(1, 0x3a4252, 0.9);
        g.strokePath();
        g.fillStyle(0x16161f, 1);
        g.fillCircle(17, 10, 8);
        // occhiali che brillano di teoremi
        g.lineStyle(1.5, 0xffffff, 0.85);
        g.strokeCircle(13, 10, 3);
        g.strokeCircle(21, 10, 3);
        g.beginPath();
        g.moveTo(16, 10); g.lineTo(18, 10);
        g.strokePath();
        glow(g, 17, 4, 2, 0xc084fc, 0.4);
    });

    // ticummi sulla sedia volante high tech
    make(scene, 'npc-ticummi', 46, 52, (g) => {
        // sedia che fluttua
        g.fillStyle(0x141820, 1);
        g.fillRoundedRect(8, 26, 32, 10, 4);
        g.fillRoundedRect(10, 10, 8, 18, 3);
        g.lineStyle(1, 0x2a4a68, 1);
        g.strokeRoundedRect(8, 26, 32, 10, 4);
        glow(g, 16, 42, 3, 0x60a5fa, 0.45);
        glow(g, 32, 42, 3, 0x60a5fa, 0.45);
        // lui, comodo
        g.fillStyle(INK, 1);
        g.fillEllipse(26, 20, 18, 18);
        g.fillCircle(28, 7, 7);
        // laptop della tommasorveglianza
        g.fillStyle(0x0b0d12, 1);
        g.fillRect(22, 22, 14, 8);
        g.fillStyle(0x60a5fa, 0.6);
        g.fillRect(23, 23, 12, 6);
    });

    // lochef85: meglio non chiedere
    make(scene, 'npc-lochef', 32, 50, (g) => {
        g.fillStyle(INK, 1);
        g.fillEllipse(16, 34, 20, 28);
        g.fillCircle(16, 14, 8);
        // cappello da chef
        g.fillStyle(0x26262e, 1);
        g.fillRoundedRect(9, 1, 14, 10, 4);
        g.fillRect(9, 9, 14, 3);
        glow(g, 13, 14, 1.8, 0xf87171, 0.55);
        glow(g, 19, 14, 1.8, 0xf87171, 0.55);
        // sorriso largo. troppo largo.
        g.lineStyle(1.5, 0x4a2530, 1);
        g.beginPath();
        g.arc(16, 16, 4.5, 0.15, Math.PI - 0.15);
        g.strokePath();
    });

    // samatt: conta ancora i giri del citelis
    make(scene, 'npc-samatt', 30, 46, (g) => {
        g.fillStyle(INK, 1);
        g.fillEllipse(15, 31, 16, 26);
        g.fillCircle(15, 11, 7);
        // seduto composto, mani sulle ginocchia: routine da loop
        g.lineStyle(2.5, INK, 1);
        g.beginPath();
        g.moveTo(9, 24); g.lineTo(6, 34);
        g.moveTo(21, 24); g.lineTo(24, 34);
        g.strokePath();
        // tacche dei giri contati sul muro... no, sul braccio
        g.lineStyle(1, 0xfacc15, 0.6);
        for (let i = 0; i < 4; i++) {
            g.beginPath();
            g.moveTo(23 + i * 1.5, 28); g.lineTo(23 + i * 1.5, 32);
            g.strokePath();
        }
        glow(g, 12, 10, 1.6, 0xfacc15, 0.4);
        glow(g, 18, 10, 1.6, 0xfacc15, 0.4);
    });

    // guastalla: ha smesso di contare al giro 300
    make(scene, 'npc-guastalla', 32, 44, (g) => {
        g.fillStyle(INK, 1);
        g.fillEllipse(16, 30, 20, 24);
        // testa reclinata: si è arreso al loop
        g.fillCircle(22, 12, 7);
        g.lineStyle(2.5, INK, 1);
        g.beginPath();
        g.moveTo(10, 38); g.lineTo(8, 43);
        g.moveTo(22, 38); g.lineTo(24, 43);
        g.strokePath();
        // occhi spenti
        g.fillStyle(0x3a4252, 1);
        g.fillCircle(20, 11, 1.5);
        g.fillCircle(25, 11, 1.5);
        glow(g, 16, 24, 1.8, 0xfacc15, 0.25);
    });

    // studente della ruhra: accovacciato, sopravvive ad analisi 1
    make(scene, 'npc-studente', 30, 36, (g) => {
        g.fillStyle(INK, 1);
        g.fillEllipse(15, 24, 20, 20);
        g.fillCircle(15, 10, 7);
        // libro come scudo
        g.fillStyle(0x16202e, 1);
        g.fillRect(6, 16, 18, 12);
        g.lineStyle(1, 0x60a5fa, 0.6);
        g.strokeRect(6, 16, 18, 12);
        g.beginPath();
        g.moveTo(15, 16); g.lineTo(15, 28);
        g.strokePath();
        glow(g, 12, 9, 1.5, 0x60a5fa, 0.4);
        glow(g, 18, 9, 1.5, 0x60a5fa, 0.4);
    });

    // commissario romero: il caso analisi 1 è ancora aperto
    make(scene, 'npc-romero', 32, 50, (g) => {
        g.fillStyle(INK, 1);
        g.fillEllipse(16, 33, 20, 28);
        g.fillCircle(16, 13, 8);
        // cappello da commissario
        g.fillStyle(0x1a2230, 1);
        g.fillEllipse(16, 8, 20, 5);
        g.fillRoundedRect(10, 1, 12, 8, 3);
        // taccuino degli indizi
        g.fillStyle(0xe5e7eb, 0.7);
        g.fillRect(24, 24, 6, 9);
        g.lineStyle(2.5, INK, 1);
        g.beginPath();
        g.moveTo(10, 40); g.lineTo(9, 48);
        g.moveTo(22, 40); g.lineTo(23, 48);
        g.strokePath();
        glow(g, 13, 13, 1.6, 0x60a5fa, 0.45);
        glow(g, 19, 13, 1.6, 0x60a5fa, 0.45);
    });

    // vavleeh: trovato nella tana. il realm lo ricorda così
    make(scene, 'npc-vavleeh', 44, 22, (g) => {
        // sagoma a terra, contorno da scena del crimine
        g.lineStyle(1.5, 0xe5e7eb, 0.5);
        g.strokeEllipse(22, 14, 38, 12);
        g.fillStyle(0x0c0c12, 1);
        g.fillEllipse(22, 14, 34, 9);
        g.fillCircle(36, 11, 5);
        // un glow flebile: qualcosa di lui brilla ancora
        glow(g, 36, 10, 1.5, 0xc084fc, 0.3);
    });

    // lametta: un dio fatto a lametta, letteralmente
    make(scene, 'npc-lametta', 54, 84, (g) => {
        g.fillStyle(0x1a1622, 1);
        g.fillRoundedRect(9, 8, 36, 64, 8);
        g.lineStyle(1.5, 0x4a3f63, 1);
        g.strokeRoundedRect(9, 8, 36, 64, 8);
        // i fori classici della lametta
        g.fillStyle(0x05050a, 1);
        g.fillRoundedRect(24, 14, 6, 14, 3);
        g.fillRoundedRect(24, 52, 6, 14, 3);
        g.fillRect(14, 36, 26, 6);
        // lame laterali
        g.fillStyle(0x2b2d3d, 1);
        g.fillTriangle(9, 12, 2, 20, 9, 28);
        g.fillTriangle(45, 12, 52, 20, 45, 28);
        g.fillTriangle(9, 52, 2, 60, 9, 68);
        g.fillTriangle(45, 52, 52, 60, 45, 68);
        // occhi da dio del disegno
        glow(g, 21, 24, 2.4, 0xc084fc, 0.6);
        glow(g, 33, 24, 2.4, 0xc084fc, 0.6);
        // pennello
        g.lineStyle(2.5, 0x2b2d3d, 1);
        g.beginPath();
        g.moveTo(48, 40); g.lineTo(53, 26);
        g.strokePath();
        g.fillStyle(0xc084fc, 0.9);
        g.fillEllipse(53, 23, 5, 7);
    });

    // walter baruffoni: proprietario sonnacchioso delle autoscuole marcetti
    make(scene, 'npc-walter', 40, 54, (g) => {
        // pancetta e polo verdina (la sua wolkswagen polo se la porta addosso)
        g.fillStyle(0x14241a, 1);
        g.fillEllipse(20, 36, 26, 30);
        g.fillCircle(20, 14, 9);
        // colletto della polo
        g.fillStyle(0x1e3a2a, 1);
        g.fillTriangle(13, 24, 20, 30, 27, 24);
        // chiavi della polo in mano
        g.lineStyle(2, 0x4a4252, 1);
        g.beginPath();
        g.moveTo(30, 34); g.lineTo(35, 40);
        g.strokePath();
        g.fillStyle(0xf59e0b, 0.9);
        g.fillCircle(36, 41, 2.5);
        // occhi mezzi chiusi: si addormenta sempre
        g.lineStyle(2, 0x0a0a0a, 0.9);
        g.beginPath();
        g.moveTo(14, 14); g.lineTo(18, 14);
        g.moveTo(22, 14); g.lineTo(26, 14);
        g.strokePath();
        // zzz del sonnellino
        g.fillStyle(0x86efac, 0.7);
        g.fillRect(30, 4, 4, 1.5);
        g.fillRect(31, 7, 3, 1.5);
        // gambette
        g.lineStyle(3, 0x14241a, 1);
        g.beginPath();
        g.moveTo(14, 48); g.lineTo(13, 53);
        g.moveTo(26, 48); g.lineTo(27, 53);
        g.strokePath();
        glow(g, 16, 14, 1.3, 0x86efac, 0.4);
        glow(g, 24, 14, 1.3, 0x86efac, 0.4);
    });

    // notino a casa: niente sparacchino, cappellino storto e una forchetta
    make(scene, 'npc-notino', 28, 38, (g) => {
        g.fillStyle(INK, 1);
        g.fillEllipse(14, 27, 16, 18);
        g.fillCircle(14, 11, 7);
        // cappellino girato all'indietro
        g.fillStyle(0x7f1d1d, 1);
        g.fillRect(7, 4, 13, 4);
        g.fillRect(3, 6, 6, 2);
        g.lineStyle(2, 0x9ca3af, 1);
        g.beginPath();
        g.moveTo(23, 22); g.lineTo(26, 14);
        g.strokePath();
        g.lineStyle(2.5, INK, 1);
        g.beginPath();
        g.moveTo(10, 34); g.lineTo(9, 38);
        g.moveTo(18, 34); g.lineTo(19, 38);
        g.strokePath();
        glow(g, 11, 11, 1.4, 0xf87171, 0.45);
        glow(g, 17, 11, 1.4, 0xf87171, 0.45);
    });

    // la mamma di notino: grembiule, mestolo, la porta sempre aperta
    make(scene, 'npc-mamma', 34, 52, (g) => {
        g.fillStyle(INK, 1);
        g.fillEllipse(17, 34, 24, 32);
        g.fillCircle(17, 12, 8);
        // crocchia
        g.fillCircle(17, 3, 4);
        // grembiule a quadretti, appena visibile
        g.fillStyle(0x3f1d1d, 1);
        g.fillRect(11, 26, 12, 16);
        g.lineStyle(1, 0x7f1d1d, 0.8);
        for (let k = 0; k < 4; k++) g.lineBetween(11, 28 + k * 4, 23, 28 + k * 4);
        // mestolo
        g.lineStyle(2, 0x9ca3af, 1);
        g.beginPath();
        g.moveTo(28, 26); g.lineTo(31, 40);
        g.strokePath();
        g.fillStyle(0x9ca3af, 1);
        g.fillCircle(31, 41, 3);
        glow(g, 14, 12, 1.3, 0xfca5a5, 0.4);
        glow(g, 20, 12, 1.3, 0xfca5a5, 0.4);
    });
}

function objects(scene: Phaser.Scene): void {
    // microfono checkpoint
    make(scene, 'mic', 24, 58, (m) => {
        m.lineStyle(2.5, 0x222228, 1);
        m.beginPath();
        m.moveTo(12, 18); m.lineTo(12, 50);
        m.strokePath();
        m.lineStyle(2, 0x222228, 1);
        m.beginPath();
        m.moveTo(4, 56); m.lineTo(12, 48); m.lineTo(20, 56);
        m.strokePath();
        m.fillStyle(0x18181c, 1);
        m.fillCircle(12, 11, 8);
        m.lineStyle(1, 0x3a3a42, 1);
        m.strokeCircle(12, 11, 8);
        m.beginPath();
        m.moveTo(6, 8); m.lineTo(18, 8);
        m.moveTo(5, 11); m.lineTo(19, 11);
        m.moveTo(6, 14); m.lineTo(18, 14);
        m.strokePath();
    });

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
    make(scene, 'proj-risonante', 26, 18, (p) => {
        glow(p, 13, 9, 5, 0x4ade80, 0.5);
        p.lineStyle(2, 0x4ade80, 0.9);
        p.beginPath();
        p.moveTo(2, 9);
        for (let x = 0; x <= 22; x++) p.lineTo(2 + x, 9 - Math.sin((x / 22) * Math.PI * 2) * 4);
        p.strokePath();
    });
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

    // glifi per la tempesta di analisi 1
    const glyphs = [
        (p: Phaser.GameObjects.Graphics) => {
            // sommatoria
            p.beginPath();
            p.moveTo(14, 3); p.lineTo(4, 3); p.lineTo(10, 9); p.lineTo(4, 15); p.lineTo(14, 15);
            p.strokePath();
        },
        (p: Phaser.GameObjects.Graphics) => {
            // radice
            p.beginPath();
            p.moveTo(2, 10); p.lineTo(6, 15); p.lineTo(10, 3); p.lineTo(16, 3);
            p.strokePath();
        },
        (p: Phaser.GameObjects.Graphics) => {
            // pi greco
            p.beginPath();
            p.moveTo(3, 5); p.lineTo(16, 5);
            p.moveTo(6, 5); p.lineTo(6, 15);
            p.moveTo(13, 5); p.lineTo(13, 15);
            p.strokePath();
        },
    ];
    glyphs.forEach((draw, i) => {
        make(scene, `glyph-${i}`, 18, 18, (p) => {
            p.lineStyle(2, 0x60a5fa, 0.95);
            draw(p);
        });
    });
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
    npcs(scene);
    objects(scene);
    particles(scene);
}
