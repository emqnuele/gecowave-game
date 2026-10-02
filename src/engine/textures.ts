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

/* ---------- nemici ---------- */

function enemies(scene: Phaser.Scene): void {
    // glitchetto: scheggia di pedro, cubetto rotto che saltella
    make(scene, 'enemy-glitchetto', 26, 26, (g) => {
        g.fillStyle(INK, 1);
        g.fillRect(4, 6, 18, 16);
        g.fillRect(8, 2, 10, 6);
        // angoli mangiati dal glitch
        g.fillStyle(0x000000, 1);
        g.fillRect(18, 6, 4, 4);
        g.fillRect(4, 18, 5, 4);
        g.lineStyle(1, 0x2a5a66, 1);
        g.strokeRect(4, 6, 18, 16);
        glow(g, 13, 12, 3, 0x22d3ee, 0.55);
    });

    // citelis: il bus dimensionale di guggu, carica a vista
    make(scene, 'enemy-citelis', 72, 40, (g) => {
        g.fillStyle(0x141820, 1);
        g.fillRoundedRect(2, 4, 66, 26, { tl: 10, tr: 4, bl: 2, br: 2 });
        g.lineStyle(1, 0x3a4252, 1);
        g.strokeRoundedRect(2, 4, 66, 26, { tl: 10, tr: 4, bl: 2, br: 2 });
        // finestrini che brillano di rabbia pendolare
        g.fillStyle(0xfacc15, 0.55);
        for (let i = 0; i < 4; i++) g.fillRect(12 + i * 13, 9, 9, 7);
        g.fillStyle(0xfacc15, 0.8);
        g.fillRect(58, 9, 8, 7);
        // ruote
        g.fillStyle(0x05060a, 1);
        g.fillCircle(16, 32, 7);
        g.fillCircle(52, 32, 7);
        g.lineStyle(1.5, 0x3a4252, 1);
        g.strokeCircle(16, 32, 7);
        g.strokeCircle(52, 32, 7);
        glow(g, 64, 20, 2.5, 0xfacc15, 0.4);
    });

    // pendolare: in loop nel percorso del citelis da anni
    make(scene, 'enemy-pendolare', 30, 44, (g) => {
        g.fillStyle(INK, 1);
        g.fillEllipse(15, 28, 20, 28);
        g.fillCircle(17, 9, 7);
        // testa china sul telefono
        g.lineStyle(2.5, INK, 1);
        g.beginPath();
        g.moveTo(20, 18); g.lineTo(25, 23);
        g.strokePath();
        g.fillStyle(0xfacc15, 0.8);
        g.fillRect(23, 20, 5, 8);
        // badge aziendale che dondola
        g.lineStyle(1, 0x3a4252, 1);
        g.beginPath();
        g.moveTo(13, 16); g.lineTo(12, 24);
        g.strokePath();
        g.fillStyle(0xfacc15, 0.9);
        g.fillRect(10, 24, 5, 6);
        glow(g, 18, 8, 1.8, 0xfacc15, 0.35);
    });

    // pittura viva: vernice di lametta, si moltiplica se colpita
    make(scene, 'enemy-pittura', 38, 32, (g) => {
        g.fillStyle(0x1b1226, 1);
        g.fillEllipse(19, 18, 32, 22);
        g.fillCircle(8, 12, 7);
        g.fillCircle(28, 10, 9);
        // colature
        for (const [x, y1, y2] of [[10, 26, 31], [20, 28, 32], [30, 25, 30]] as const) {
            g.lineStyle(3, 0x1b1226, 1);
            g.beginPath();
            g.moveTo(x, y1); g.lineTo(x, y2);
            g.strokePath();
        }
        glow(g, 24, 13, 3, 0xc084fc, 0.5);
        glow(g, 11, 16, 2, 0xc084fc, 0.35);
    });
    make(scene, 'enemy-pittura-mini', 22, 18, (g) => {
        g.fillStyle(0x1b1226, 1);
        g.fillEllipse(11, 10, 18, 13);
        g.fillCircle(15, 6, 5);
        glow(g, 13, 8, 2, 0xc084fc, 0.5);
    });

    // tecnodrone: giocattolo trasformato di notino
    make(scene, 'enemy-tecnodrone', 38, 28, (g) => {
        g.lineStyle(2, 0x4a2530, 1);
        g.beginPath();
        g.moveTo(4, 4); g.lineTo(34, 4);
        g.strokePath();
        g.lineStyle(2, INK, 1);
        g.beginPath();
        g.moveTo(19, 4); g.lineTo(19, 9);
        g.strokePath();
        g.fillStyle(0x1a1014, 1);
        g.fillRoundedRect(6, 9, 26, 14, 5);
        g.lineStyle(1, 0x4a2530, 1);
        g.strokeRoundedRect(6, 9, 26, 14, 5);
        // adesivo smile storto: era un giocattolo
        g.lineStyle(1, 0xf87171, 0.7);
        g.strokeCircle(13, 16, 3.5);
        glow(g, 25, 16, 2.8, 0xf87171, 0.55);
    });

    // tossico del trenbolone
    make(scene, 'enemy-tossico', 30, 46, (g) => {
        g.fillStyle(0x131a12, 1);
        g.fillEllipse(15, 30, 16, 30);
        g.fillCircle(15, 10, 7);
        // braccia lunghe e storte
        g.lineStyle(2.5, 0x131a12, 1);
        g.beginPath();
        g.moveTo(9, 22); g.lineTo(2, 32);
        g.moveTo(21, 22); g.lineTo(28, 30);
        g.strokePath();
        // fiala che brilla
        g.fillStyle(0xfb923c, 0.9);
        g.fillRect(26, 28, 4, 8);
        glow(g, 13, 9, 2.2, 0x84cc16, 0.5);
        glow(g, 18, 9, 2.2, 0x84cc16, 0.5);
    });

    // green/lime bulky mutant to show muscle growth from trenbo drug
    make(scene, 'enemy-tossico-trenbo', 36, 50, (g) => {
        g.fillStyle(0x1e3514, 1);
        g.fillEllipse(18, 32, 22, 32);
        g.fillCircle(18, 12, 8);
        g.lineStyle(4, 0x1e3514, 1);
        g.beginPath();
        g.moveTo(10, 20); g.lineTo(1, 32);
        g.moveTo(26, 20); g.lineTo(35, 30);
        g.strokePath();
        g.fillStyle(0x84cc16, 1);
        g.fillRect(32, 28, 4, 10);
        g.lineStyle(1, 0xffffff, 0.8);
        g.strokeRect(32, 28, 4, 10);
        g.fillStyle(0xef4444, 1);
        g.fillCircle(15, 11, 1.8);
        g.fillCircle(21, 11, 1.8);
        glow(g, 15, 11, 1.5, 0xef4444, 0.7);
        glow(g, 21, 11, 1.5, 0xef4444, 0.7);
    });

    // formica fr: il villaggio attacca
    make(scene, 'enemy-formica', 32, 18, (g) => {
        g.fillStyle(0x1a0f08, 1);
        g.fillEllipse(8, 10, 12, 9);
        g.fillEllipse(17, 9, 9, 7);
        g.fillCircle(25, 8, 5);
        // zampe
        g.lineStyle(1.5, 0x1a0f08, 1);
        for (const x of [6, 11, 16]) {
            g.beginPath();
            g.moveTo(x, 13); g.lineTo(x - 2, 17);
            g.moveTo(x, 13); g.lineTo(x + 2, 17);
            g.strokePath();
        }
        // antenne
        g.beginPath();
        g.moveTo(27, 5); g.lineTo(30, 2);
        g.moveTo(25, 5); g.lineTo(26, 1);
        g.strokePath();
        glow(g, 26, 7, 1.6, 0xfb923c, 0.5);
    });

    // numero impazzito: analisi 1 ha fatto vittime
    make(scene, 'enemy-numero', 30, 34, (g) => {
        glow(g, 15, 17, 5, 0x60a5fa, 0.3);
        g.lineStyle(3, 0x60a5fa, 0.9);
        // una sigma storta
        g.beginPath();
        g.moveTo(22, 7); g.lineTo(8, 7); g.lineTo(17, 17); g.lineTo(8, 27); g.lineTo(22, 27);
        g.strokePath();
        g.lineStyle(1, 0x60a5fa, 0.4);
        g.strokeCircle(15, 17, 13);
    });

    // specchietto: scheggia di specchio del santuario, riflette male
    make(scene, 'enemy-specchietto', 28, 34, (g) => {
        g.fillStyle(0x0a0812, 1);
        g.fillTriangle(14, 2, 26, 24, 2, 24);
        g.lineStyle(1.5, 0xc084fc, 0.8);
        g.strokeTriangle(14, 2, 26, 24, 2, 24);
        // riflesso storto dentro
        g.lineStyle(1, 0xe9d5ff, 0.5);
        g.beginPath();
        g.moveTo(10, 20); g.lineTo(14, 9); g.lineTo(17, 20);
        g.strokePath();
        glow(g, 14, 28, 2, 0xc084fc, 0.45);
    });

    // padella senziente della tana: sputa olio bollente
    make(scene, 'enemy-padella', 40, 26, (g) => {
        g.fillStyle(0x14100e, 1);
        g.fillEllipse(16, 14, 26, 14);
        g.lineStyle(1.5, 0x3d2f24, 1);
        g.strokeEllipse(16, 14, 26, 14);
        // manico
        g.lineStyle(3, 0x14100e, 1);
        g.beginPath();
        g.moveTo(28, 12); g.lineTo(38, 8);
        g.strokePath();
        // schizzo d'olio che ribolle
        glow(g, 12, 8, 2, 0xf87171, 0.55);
        glow(g, 19, 6, 1.6, 0xfb923c, 0.5);
    });

    // ammiratore: fan sfegatato di lochef85, abbraccia troppo forte
    make(scene, 'enemy-ammiratore', 32, 46, (g) => {
        g.fillStyle(0x1c1014, 1);
        g.fillEllipse(16, 30, 18, 28);
        g.fillCircle(16, 10, 7);
        // braccia spalancate per l'abbraccio
        g.lineStyle(2.5, 0x1c1014, 1);
        g.beginPath();
        g.moveTo(8, 20); g.lineTo(0, 14);
        g.moveTo(24, 20); g.lineTo(32, 14);
        g.strokePath();
        // cuoricino sulla maglietta. inquietante.
        glow(g, 16, 26, 2, 0xf87171, 0.6);
        glow(g, 13, 9, 1.6, 0xf87171, 0.5);
        glow(g, 19, 9, 1.6, 0xf87171, 0.5);
    });

    // notino senza la wave: più piccolo, più arrabbiato, stessa mira
    make(scene, 'enemy-notino-mini', 34, 42, (g) => {
        g.fillStyle(INK, 1);
        g.fillEllipse(14, 28, 15, 20);
        g.fillCircle(14, 11, 8);
        // ciuffo
        g.fillTriangle(9, 4, 13, 0, 16, 5);
        // occhi senza frammento: rossi di rabbia normale
        glow(g, 11, 10, 1.8, 0xf87171, 0.6);
        glow(g, 17, 10, 1.8, 0xf87171, 0.6);
        // pistola giocattolo, quella vera è rimasta nell'arena
        g.fillStyle(0x241a33, 1);
        g.fillRoundedRect(18, 22, 13, 7, 2);
        g.fillRect(28, 24, 5, 4);
        glow(g, 32, 26, 1.8, 0xa855f7, 0.55);
        g.lineStyle(2.5, INK, 1);
        g.beginPath();
        g.moveTo(10, 36); g.lineTo(9, 41);
        g.moveTo(18, 36); g.lineTo(19, 41);
        g.strokePath();
    });

    // eco: un secondo di te, in loop, ostile
    make(scene, 'enemy-eco', 30, 34, (g) => {
        g.fillStyle(0x05080c, 1);
        g.fillEllipse(15, 21, 20, 17);
        g.fillCircle(15, 9, 7);
        // coda da geco registrato male
        g.lineStyle(3, 0x05080c, 1);
        g.beginPath();
        g.moveTo(6, 25); g.lineTo(1, 31);
        g.strokePath();
        // scanlines
        g.lineStyle(1, 0x22d3ee, 0.3);
        for (let y = 5; y < 30; y += 4) {
            g.beginPath();
            g.moveTo(4, y); g.lineTo(26, y);
            g.strokePath();
        }
        glow(g, 12, 8, 1.5, 0x22d3ee, 0.7);
        glow(g, 18, 8, 1.5, 0x22d3ee, 0.7);
    });

    // bottiglia premium dello stabilimento di smela: acqua sacra (non vero)
    make(scene, 'enemy-bottiglia', 22, 36, (g) => {
        g.fillStyle(0x0c1a1e, 1);
        g.fillRoundedRect(5, 10, 12, 24, 4);
        g.fillRect(8, 4, 6, 7);
        g.fillStyle(0x22d3ee, 0.35);
        g.fillRoundedRect(7, 18, 8, 14, 3);
        // tappo
        g.fillStyle(0x2b2d3d, 1);
        g.fillRect(7, 1, 8, 4);
        // etichetta "premium"
        g.lineStyle(1, 0x22d3ee, 0.7);
        g.strokeRect(6, 14, 10, 6);
        glow(g, 11, 16, 1.6, 0x22d3ee, 0.5);
    });

    // ricordo di pedro: un frame sbiadito che fluttua
    make(scene, 'enemy-ricordo', 30, 32, (g) => {
        g.fillStyle(0x10141c, 0.9);
        g.fillRoundedRect(4, 4, 22, 24, 4);
        g.lineStyle(1, 0x94a3b8, 0.5);
        g.strokeRoundedRect(4, 4, 22, 24, 4);
        // dentro, la sagoma di un piccolo pedro felice
        g.fillStyle(0x1c2530, 1);
        g.fillRect(11, 10, 9, 8);
        g.fillCircle(15, 8, 3);
        glow(g, 13, 8, 1.2, 0x67e8f9, 0.5);
        // angolo strappato: il tempo mangia
        g.fillStyle(0x000000, 1);
        g.fillTriangle(26, 4, 26, 12, 19, 4);
    });

    // telecamera della tommasorveglianza: ti guarda. spara pure.
    make(scene, 'enemy-telecamera', 36, 28, (g) => {
        // braccio a muro
        g.lineStyle(2, 0x1a2630, 1);
        g.beginPath();
        g.moveTo(4, 2); g.lineTo(10, 10);
        g.strokePath();
        g.fillStyle(0x10161c, 1);
        g.fillRoundedRect(8, 8, 22, 14, 4);
        g.lineStyle(1, 0x2a4a5a, 1);
        g.strokeRoundedRect(8, 8, 22, 14, 4);
        // obiettivo
        g.fillStyle(0x05060a, 1);
        g.fillCircle(26, 15, 5);
        glow(g, 26, 15, 2.4, 0x22d3ee, 0.7);
        // led rec, sempre acceso
        glow(g, 12, 11, 1.2, 0xf87171, 0.8);
    });

    // fiat tipo di galliate: utilitaria scura che sgomma addosso
    make(scene, 'enemy-fiattipo', 64, 34, (g) => {
        // scocca
        g.fillStyle(0x14171f, 1);
        g.fillRoundedRect(2, 14, 60, 16, { tl: 4, tr: 4, bl: 6, br: 6 });
        // tettuccio basso e tirato
        g.fillStyle(0x191d27, 1);
        g.fillRoundedRect(16, 4, 34, 14, { tl: 10, tr: 8, bl: 0, br: 0 });
        g.lineStyle(1.5, 0x4a2530, 1);
        g.strokeRoundedRect(2, 14, 60, 16, { tl: 4, tr: 4, bl: 6, br: 6 });
        // finestrini
        g.fillStyle(0x05060a, 1);
        g.fillRect(20, 7, 12, 9);
        g.fillRect(34, 7, 12, 9);
        // fari accesi rossi
        glow(g, 60, 20, 2.4, 0xdc2626, 0.7);
        glow(g, 4, 20, 1.8, 0xf59e0b, 0.5);
        // ruote
        g.fillStyle(0x05060a, 1);
        g.fillCircle(16, 30, 7);
        g.fillCircle(48, 30, 7);
        g.lineStyle(1.5, 0x4a2530, 1);
        g.strokeCircle(16, 30, 7);
        g.strokeCircle(48, 30, 7);
    });
}

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

/* ---------- boss ---------- */

function bosses(scene: Phaser.Scene): void {
    // guggu, re dei bus dimensionali
    make(scene, 'boss-guggu', 120, 78, (g) => {
        // corona
        g.fillStyle(0x2e2410, 1);
        g.fillTriangle(34, 12, 40, 0, 46, 12);
        g.fillTriangle(50, 12, 56, 0, 62, 12);
        g.fillTriangle(66, 12, 72, 0, 78, 12);
        g.fillRect(32, 10, 48, 6);
        // corpo bus
        g.fillStyle(0x171b24, 1);
        g.fillRoundedRect(4, 14, 112, 46, { tl: 16, tr: 8, bl: 4, br: 4 });
        g.lineStyle(1.5, 0x4a4252, 1);
        g.strokeRoundedRect(4, 14, 112, 46, { tl: 16, tr: 8, bl: 4, br: 4 });
        // occhi-parabrezza
        g.fillStyle(0xfacc15, 0.8);
        g.fillRect(16, 22, 22, 12);
        g.fillRect(82, 22, 22, 12);
        g.fillStyle(0x000000, 1);
        g.fillRect(24, 25, 8, 8);
        g.fillRect(90, 25, 8, 8);
        // griglia che ringhia
        g.lineStyle(2, 0x4a4252, 1);
        for (let i = 0; i < 5; i++) {
            g.beginPath();
            g.moveTo(44 + i * 7, 44); g.lineTo(44 + i * 7, 54);
            g.strokePath();
        }
        // ruote
        g.fillStyle(0x05060a, 1);
        g.fillCircle(26, 64, 12);
        g.fillCircle(94, 64, 12);
        g.lineStyle(2, 0x4a4252, 1);
        g.strokeCircle(26, 64, 12);
        g.strokeCircle(94, 64, 12);
        glow(g, 60, 38, 4, 0xfacc15, 0.5);
    });

    // breccio, dio del disegno (minore)
    make(scene, 'boss-breccio', 64, 76, (g) => {
        g.fillStyle(0x191223, 1);
        g.fillEllipse(32, 44, 36, 50);
        g.fillCircle(32, 16, 12);
        // tavolozza come scudo
        g.fillStyle(0x241a33, 1);
        g.fillEllipse(14, 40, 20, 26);
        g.fillStyle(0x05050a, 1);
        g.fillCircle(12, 36, 3);
        // macchie di colore
        glow(g, 16, 46, 2, 0xf87171, 0.5);
        glow(g, 10, 42, 2, 0x4ade80, 0.5);
        glow(g, 18, 38, 2, 0x60a5fa, 0.5);
        // pennellone
        g.lineStyle(3, 0x2b2d3d, 1);
        g.beginPath();
        g.moveTo(48, 50); g.lineTo(58, 18);
        g.strokePath();
        g.fillStyle(0xc084fc, 0.95);
        g.fillEllipse(59, 13, 7, 10);
        glow(g, 28, 14, 2.2, 0xc084fc, 0.55);
        glow(g, 37, 14, 2.2, 0xc084fc, 0.55);
    });

    // notino, tecnokid armato
    make(scene, 'boss-notino', 44, 54, (g) => {
        g.fillStyle(INK, 1);
        g.fillEllipse(18, 36, 18, 26);
        g.fillCircle(18, 14, 9);
        // ciuffo
        g.fillTriangle(12, 6, 16, 1, 19, 7);
        // occhi accesi dal frammento
        glow(g, 15, 13, 2.4, 0xc084fc, 0.7);
        glow(g, 22, 13, 2.4, 0xc084fc, 0.7);
        // cannone giocattolo più grande di lui
        g.fillStyle(0x241a33, 1);
        g.fillRoundedRect(22, 24, 20, 10, 3);
        g.fillRect(38, 26, 6, 6);
        g.lineStyle(1, 0x6d28d9, 0.9);
        g.strokeRoundedRect(22, 24, 20, 10, 3);
        glow(g, 42, 29, 2.5, 0xa855f7, 0.6);
        g.lineStyle(3, INK, 1);
        g.beginPath();
        g.moveTo(13, 46); g.lineTo(12, 53);
        g.moveTo(23, 46); g.lineTo(24, 53);
        g.strokePath();
    });

    // riba: bot stupido a guardia della ruhra
    make(scene, 'boss-riba', 56, 58, (g) => {
        g.fillStyle(0x1c1208, 1);
        g.fillEllipse(24, 36, 28, 24);
        g.fillCircle(36, 17, 11);
        g.fillEllipse(44, 19, 14, 10);
        g.beginPath();
        g.moveTo(12, 34); g.lineTo(0, 24); g.lineTo(14, 27);
        g.closePath();
        g.fillPath();
        g.lineStyle(3, 0x1c1208, 1);
        g.beginPath();
        g.moveTo(34, 28); g.lineTo(40, 32);
        g.strokePath();
        g.lineStyle(5, 0x1c1208, 1);
        g.beginPath();
        g.moveTo(19, 46); g.lineTo(18, 56);
        g.moveTo(30, 46); g.lineTo(31, 56);
        g.strokePath();
        g.fillStyle(0x4a3214, 1);
        g.fillTriangle(46, 22, 49, 22, 47.5, 26);
        g.fillTriangle(41, 22, 44, 22, 42.5, 26);
        glow(g, 37, 14, 3.2, 0xfb923c, 0.6);
    });

    // lochef85 in versione caccia: grembiule, mattarello, intenzioni pessime
    make(scene, 'boss-lochef', 64, 80, (g) => {
        g.fillStyle(INK, 1);
        g.fillEllipse(30, 50, 40, 52);
        g.fillCircle(30, 18, 12);
        // cappello da chef gigante
        g.fillStyle(0x26262e, 1);
        g.fillRoundedRect(18, 0, 24, 16, 6);
        g.fillRect(18, 13, 24, 4);
        // grembiule macchiato
        g.fillStyle(0x1f1218, 1);
        g.fillRoundedRect(18, 38, 24, 30, 4);
        glow(g, 24, 48, 1.6, 0xf87171, 0.4);
        glow(g, 34, 58, 1.4, 0xf87171, 0.35);
        // mattarello brandito
        g.lineStyle(4, 0x2b2417, 1);
        g.beginPath();
        g.moveTo(50, 52); g.lineTo(62, 22);
        g.strokePath();
        // occhi a cuore. il problema è proprio quello.
        glow(g, 25, 18, 2.6, 0xf87171, 0.75);
        glow(g, 35, 18, 2.6, 0xf87171, 0.75);
        // sorriso larghissimo
        g.lineStyle(2, 0x4a2530, 1);
        g.beginPath();
        g.arc(30, 21, 6, 0.1, Math.PI - 0.1);
        g.strokePath();
    });

    // l'ombra: il geco visto dalla tommasorveglianza. ha studiato ogni tua mossa
    make(scene, 'boss-ombra', 48, 56, (g) => {
        // silhouette di geco, ma sbagliata
        g.fillStyle(0x05080c, 1);
        g.fillEllipse(24, 34, 30, 26);
        g.fillCircle(24, 14, 10);
        // coda da geco
        g.lineStyle(4, 0x05080c, 1);
        g.beginPath();
        g.moveTo(10, 40); g.lineTo(2, 50);
        g.strokePath();
        // scanlines: è fatta di registrazioni
        g.lineStyle(1, 0x22d3ee, 0.25);
        for (let y = 8; y < 50; y += 5) {
            g.beginPath();
            g.moveTo(6, y); g.lineTo(42, y);
            g.strokePath();
        }
        // occhi rec
        glow(g, 20, 13, 2.2, 0x22d3ee, 0.8);
        glow(g, 28, 13, 2.2, 0x22d3ee, 0.8);
        g.lineStyle(1, 0x22d3ee, 0.6);
        g.strokeEllipse(24, 34, 30, 26);
    });

    // ticummi in modalità combattimento: la sedia volante fa sul serio
    make(scene, 'boss-ticummi', 84, 72, (g) => {
        // propulsori della sedia
        glow(g, 22, 64, 4, 0x60a5fa, 0.55);
        glow(g, 58, 64, 4, 0x60a5fa, 0.55);
        // sedia high tech
        g.fillStyle(0x141820, 1);
        g.fillRoundedRect(10, 38, 62, 16, 6);
        g.fillRoundedRect(12, 8, 14, 32, 4);
        g.lineStyle(1.5, 0x2a4a68, 1);
        g.strokeRoundedRect(10, 38, 62, 16, 6);
        // lui, sempre comodo, circondato di schermi
        g.fillStyle(INK, 1);
        g.fillEllipse(44, 28, 24, 24);
        g.fillCircle(47, 10, 8);
        // tre monitor della tommasorveglianza
        for (const [x, y] of [[60, 4], [68, 18], [62, 32]] as const) {
            g.fillStyle(0x0b0d12, 1);
            g.fillRect(x, y, 13, 9);
            g.fillStyle(0x22d3ee, 0.55);
            g.fillRect(x + 1, y + 1, 11, 7);
        }
        // occhiali che riflettono i grafici
        glow(g, 44, 9, 1.8, 0x22d3ee, 0.6);
        glow(g, 50, 9, 1.8, 0x22d3ee, 0.6);
    });

    // il furgone delle consegne di smela: pubblicità su ogni lato
    make(scene, 'boss-furgone', 120, 70, (g) => {
        g.fillStyle(0x101820, 1);
        g.fillRoundedRect(4, 10, 96, 42, { tl: 6, tr: 14, bl: 2, br: 2 });
        // muso
        g.fillRoundedRect(96, 24, 20, 28, { tl: 10, tr: 6, bl: 2, br: 2 });
        g.lineStyle(1.5, 0x2a4a5a, 1);
        g.strokeRoundedRect(4, 10, 96, 42, { tl: 6, tr: 14, bl: 2, br: 2 });
        // parabrezza con smela dentro, comodo
        g.fillStyle(0x22d3ee, 0.4);
        g.fillRect(100, 27, 12, 10);
        g.fillStyle(INK, 1);
        g.fillCircle(106, 34, 4);
        // scritta pubblicitaria sulla fiancata
        g.lineStyle(1, 0x22d3ee, 0.8);
        g.strokeRect(12, 18, 76, 22);
        g.lineStyle(1.5, 0x22d3ee, 0.6);
        g.beginPath();
        g.moveTo(18, 30); g.lineTo(30, 24); g.lineTo(42, 32); g.lineTo(54, 24); g.lineTo(66, 30);
        g.strokePath();
        // ruote
        g.fillStyle(0x05060a, 1);
        g.fillCircle(26, 56, 11);
        g.fillCircle(86, 56, 11);
        g.lineStyle(2, 0x2a4a5a, 1);
        g.strokeCircle(26, 56, 11);
        g.strokeCircle(86, 56, 11);
        glow(g, 108, 30, 2.5, 0x22d3ee, 0.5);
    });

    // danjilo: il fidanzato di smela, bestione con la damigiana d'acqua
    make(scene, 'boss-danjilo', 70, 84, (g) => {
        g.fillStyle(INK, 1);
        g.fillEllipse(30, 50, 44, 56);
        g.fillCircle(30, 16, 12);
        // spalle larghe da guardia del corpo
        g.fillRoundedRect(6, 28, 48, 18, 6);
        // occhi gelosi
        glow(g, 25, 15, 2.4, 0x22d3ee, 0.7);
        glow(g, 35, 15, 2.4, 0x22d3ee, 0.7);
        // sopracciglio unico, minaccioso
        g.lineStyle(2.5, INK_EDGE, 1);
        g.beginPath();
        g.moveTo(21, 10); g.lineTo(39, 10);
        g.strokePath();
        // damigiana d'acqua di smela come arma
        g.fillStyle(0x22d3ee, 0.45);
        g.fillRoundedRect(48, 40, 20, 26, 6);
        g.fillStyle(INK, 1);
        g.fillRect(54, 34, 8, 8);
        g.lineStyle(2, 0x22d3ee, 0.8);
        g.strokeRoundedRect(48, 40, 20, 26, 6);
        glow(g, 58, 52, 3, 0x22d3ee, 0.5);
        // gambe tozze
        g.lineStyle(5, INK, 1);
        g.beginPath();
        g.moveTo(22, 74); g.lineTo(20, 84);
        g.moveTo(38, 74); g.lineTo(40, 84);
        g.strokePath();
    });

    // smela boss: lo stesso venditore, ma furioso che tu non beva
    make(scene, 'boss-smela', 48, 70, (g) => {
        g.fillStyle(INK, 1);
        g.fillEllipse(22, 46, 22, 44);
        g.fillCircle(22, 16, 11);
        // braccio teso che ti porge la bottiglia, insistente
        g.lineStyle(3, INK, 1);
        g.beginPath();
        g.moveTo(30, 32); g.lineTo(44, 24);
        g.strokePath();
        g.fillStyle(0x22d3ee, 0.7);
        g.fillRoundedRect(40, 14, 9, 16, 3);
        glow(g, 44, 12, 2.2, 0x22d3ee, 0.6);
        // occhi spiritati
        glow(g, 18, 16, 2.2, 0x22d3ee, 0.8);
        glow(g, 26, 16, 2.2, 0x22d3ee, 0.8);
        // sorriso forzato, troppo largo
        g.lineStyle(2, INK_EDGE, 1);
        g.beginPath();
        g.arc(22, 19, 5, 0.15, Math.PI - 0.15);
        g.strokePath();
    });

    // il limite notevole: latitante dai tempi del primo parziale
    make(scene, 'boss-limite', 90, 80, (g) => {
        glow(g, 45, 40, 9, 0x60a5fa, 0.3);
        // lim che tende, scritto con la luce
        g.lineStyle(4, 0x60a5fa, 0.9);
        g.beginPath();
        g.moveTo(14, 24); g.lineTo(14, 50);
        g.moveTo(24, 32); g.lineTo(24, 50);
        g.strokePath();
        g.strokeCircle(24, 27, 2.5);
        g.beginPath();
        g.moveTo(34, 32); g.lineTo(34, 50);
        g.moveTo(34, 36) ; g.lineTo(40, 32); g.lineTo(44, 36);
        g.moveTo(44, 34); g.lineTo(44, 50);
        g.strokePath();
        // la freccia che tende a infinito
        g.lineStyle(3, 0xffffff, 0.8);
        g.beginPath();
        g.moveTo(20, 62); g.lineTo(58, 62);
        g.moveTo(50, 56); g.lineTo(58, 62); g.lineTo(50, 68);
        g.strokePath();
        // infinito
        g.lineStyle(3, 0x60a5fa, 0.9);
        g.strokeCircle(68, 62, 6);
        g.strokeCircle(79, 62, 6);
        // occhi da latitante
        glow(g, 60, 26, 2.6, 0xffffff, 0.7);
        glow(g, 72, 26, 2.6, 0xffffff, 0.7);
    });

    // il teorema incompiuto: un integrale aperto che ha preso coscienza
    make(scene, 'boss-teorema', 70, 84, (g) => {
        glow(g, 35, 42, 8, 0x60a5fa, 0.3);
        // il segno di integrale, storto e mai chiuso
        g.lineStyle(5, 0x60a5fa, 0.9);
        g.beginPath();
        g.arc(42, 16, 9, Math.PI, Math.PI * 1.9);
        g.strokePath();
        g.beginPath();
        g.moveTo(33, 16); g.lineTo(33, 64);
        g.strokePath();
        g.beginPath();
        g.arc(24, 64, 9, 0, Math.PI * 0.9);
        g.strokePath();
        // estremi di integrazione strappati via
        g.lineStyle(2.5, 0xffffff, 0.7);
        g.beginPath();
        g.moveTo(48, 8); g.lineTo(56, 4);
        g.moveTo(10, 76); g.lineTo(18, 80);
        g.strokePath();
        // dx che non arriva mai
        g.lineStyle(3, 0x60a5fa, 0.7);
        g.beginPath();
        g.moveTo(48, 50); g.lineTo(56, 62);
        g.moveTo(56, 50); g.lineTo(48, 62);
        g.strokePath();
        // occhi da enunciato ostile
        glow(g, 28, 34, 2.6, 0xffffff, 0.7);
        glow(g, 40, 34, 2.6, 0xffffff, 0.7);
    });

    // pedro prima del glitch: pulito, intero, quasi tenero
    make(scene, 'boss-pedrino', 56, 72, (g) => {
        g.fillStyle(0x0e1216, 1);
        g.fillRoundedRect(14, 22, 30, 38, 6);
        g.lineStyle(1.5, 0x2a6a7a, 1);
        g.strokeRoundedRect(14, 22, 30, 38, 6);
        // testa integra, antenna dritta
        g.fillStyle(0x0e1216, 1);
        g.fillRoundedRect(17, 4, 24, 18, 4);
        g.lineStyle(1.5, 0x2a6a7a, 1);
        g.strokeRoundedRect(17, 4, 24, 18, 4);
        g.lineStyle(2, 0x2a6a7a, 1);
        g.beginPath();
        g.moveTo(29, 4); g.lineTo(29, -2);
        g.strokePath();
        // due occhi uguali, nessuna crepa
        glow(g, 24, 12, 2.4, 0x67e8f9, 0.7);
        glow(g, 34, 12, 2.4, 0x67e8f9, 0.7);
        // braccia attaccate al corpo, come si deve
        g.fillStyle(0x0e1216, 1);
        g.fillRect(6, 26, 8, 22);
        g.fillRect(44, 26, 8, 22);
        // un cuoricino di led sul petto. glielo aveva disegnato lametta.
        glow(g, 29, 34, 1.6, 0xf87171, 0.5);
    });

    // la formicona: sindaco di formica (fr). ha morso un dio.
    make(scene, 'boss-formicona', 96, 56, (g) => {
        g.fillStyle(0x1a0f08, 1);
        g.fillEllipse(28, 34, 40, 28);
        g.fillEllipse(54, 30, 26, 20);
        g.fillCircle(74, 24, 13);
        // zampe da sindaco: sei, tutte autorevoli
        g.lineStyle(3, 0x1a0f08, 1);
        for (const x of [16, 28, 40, 50]) {
            g.beginPath();
            g.moveTo(x, 44); g.lineTo(x - 4, 54);
            g.moveTo(x, 44); g.lineTo(x + 4, 54);
            g.strokePath();
        }
        // antenne
        g.lineStyle(2, 0x1a0f08, 1);
        g.beginPath();
        g.moveTo(78, 13); g.lineTo(84, 4);
        g.moveTo(72, 12); g.lineTo(74, 2);
        g.strokePath();
        // fascia tricolore da sindaco, in diagonale sul torace
        g.lineStyle(3, 0x4ade80, 0.8);
        g.beginPath();
        g.moveTo(58, 22); g.lineTo(48, 38);
        g.strokePath();
        g.lineStyle(3, 0xffffff, 0.8);
        g.beginPath();
        g.moveTo(62, 24); g.lineTo(52, 40);
        g.strokePath();
        g.lineStyle(3, 0xf87171, 0.8);
        g.beginPath();
        g.moveTo(66, 26); g.lineTo(56, 42);
        g.strokePath();
        // mandibole che hanno morso un dio
        g.lineStyle(2.5, 0x2b1a10, 1);
        g.beginPath();
        g.moveTo(84, 20); g.lineTo(94, 16);
        g.moveTo(84, 28); g.lineTo(94, 32);
        g.strokePath();
        glow(g, 70, 22, 2.6, 0xfb923c, 0.65);
        glow(g, 78, 22, 2.6, 0xfb923c, 0.65);
    });

    // pedro: l'ia glitchata. deve fare paura.
    make(scene, 'boss-pedro', 76, 96, (g) => {
        // torso angolare spezzato
        g.fillStyle(0x0e1216, 1);
        g.beginPath();
        g.moveTo(20, 28); g.lineTo(56, 24); g.lineTo(60, 70); g.lineTo(30, 76); g.lineTo(16, 60);
        g.closePath();
        g.fillPath();
        g.lineStyle(1.5, 0x16414d, 1);
        g.strokePath();
        // testa per metà mancante
        g.fillStyle(0x0e1216, 1);
        g.fillRect(26, 4, 26, 22);
        g.fillStyle(0x000000, 1);
        g.fillTriangle(52, 4, 52, 26, 40, 26);
        g.lineStyle(1.5, 0x16414d, 1);
        g.strokeRect(26, 4, 26, 22);
        // antenna spezzata
        g.lineStyle(2, 0x16414d, 1);
        g.beginPath();
        g.moveTo(30, 4); g.lineTo(26, -2);
        g.strokePath();
        // occhio integro ciano, occhio rotto rosso
        glow(g, 33, 14, 3, 0x22d3ee, 0.7);
        glow(g, 46, 16, 2.2, 0xf87171, 0.7);
        // braccia a segmenti staccati: si muove a scatti
        g.fillStyle(0x0e1216, 1);
        g.fillRect(6, 32, 10, 16);
        g.fillRect(2, 52, 8, 12);
        g.fillRect(62, 30, 10, 14);
        g.fillRect(66, 50, 8, 14);
        // crepe di corruzione
        g.lineStyle(1, 0xf87171, 0.5);
        g.beginPath();
        g.moveTo(36, 40); g.lineTo(42, 48); g.lineTo(38, 56);
        g.moveTo(48, 34); g.lineTo(52, 44);
        g.strokePath();
    });

    // piema e lametta insieme: gli dei, se proprio insisti
    make(scene, 'boss-dei', 120, 110, (g) => {
        // metà lametta
        g.fillStyle(0x1a1622, 1);
        g.fillRoundedRect(12, 16, 44, 80, 8);
        g.fillStyle(0x05050a, 1);
        g.fillRoundedRect(30, 26, 8, 16, 4);
        g.fillRect(20, 52, 28, 7);
        // metà piema
        g.fillStyle(0x16161f, 1);
        g.beginPath();
        g.moveTo(86, 12); g.lineTo(110, 96); g.lineTo(62, 96);
        g.closePath();
        g.fillPath();
        g.lineStyle(1.5, 0xffffff, 0.5);
        g.strokeCircle(80, 30, 5);
        g.strokeCircle(94, 30, 5);
        // aura condivisa
        glow(g, 34, 36, 3, 0xc084fc, 0.6);
        glow(g, 60, 56, 5, 0xffffff, 0.35);
        glow(g, 87, 30, 2.6, 0x60a5fa, 0.6);
        // scintille divine
        g.lineStyle(1, 0xffffff, 0.4);
        g.beginPath();
        g.moveTo(58, 10); g.lineTo(62, 22);
        g.moveTo(54, 100); g.lineTo(60, 88);
        g.strokePath();
    });

    // beer bottle design to fit flauto speroindio lore
    make(scene, 'boss-flauto', 92, 96, (g) => {
        g.fillStyle(0x0f511c, 1);
        g.fillRoundedRect(36, 16, 20, 56, { tl: 8, tr: 8, bl: 4, br: 4 });
        g.fillStyle(0xd97706, 1);
        g.fillRect(43, 10, 6, 6);
        g.fillStyle(0xfef08a, 1);
        g.fillRect(38, 36, 16, 20);
        g.fillStyle(0x134e1a, 1);
        g.fillRoundedRect(12, 32, 16, 48, { tl: 6, tr: 6, bl: 3, br: 3 });
        g.fillStyle(0xd97706, 1);
        g.fillRect(17, 26, 6, 6);
        g.fillStyle(0xfef08a, 1);
        g.fillRect(14, 48, 12, 16);
        g.fillStyle(0x134e1a, 1);
        g.fillRoundedRect(64, 32, 16, 48, { tl: 6, tr: 6, bl: 3, br: 3 });
        g.fillStyle(0xd97706, 1);
        g.fillRect(69, 26, 6, 6);
        g.fillStyle(0xfef08a, 1);
        g.fillRect(66, 48, 12, 16);
        g.fillStyle(0xdc2626, 1);
        g.fillCircle(41, 24, 4);
        g.fillCircle(51, 24, 4);
        glow(g, 41, 24, 2, 0xef4444, 0.85);
        glow(g, 51, 24, 2, 0xef4444, 0.85);
        g.fillStyle(0x84cc16, 0.85);
        g.fillRect(44, 56, 4, 16);
        g.fillCircle(46, 72, 3);
        g.fillRect(20, 80, 4, 8);
        g.fillCircle(22, 88, 3);
        g.fillRect(72, 80, 4, 8);
        g.fillCircle(74, 88, 3);
    });

    // il 7:40: carcassa di citelis sepolto, fari come occhi, paraurti a denti
    make(scene, 'boss-settequaranta', 130, 84, (g) => {
        g.fillStyle(0x3a3000, 1);
        g.fillRoundedRect(6, 14, 118, 58, 8);
        g.lineStyle(2, 0xfacc15, 0.7);
        g.strokeRoundedRect(6, 14, 118, 58, 8);
        // finestrini sporchi
        g.fillStyle(0x0a0d12, 1);
        for (let i = 0; i < 4; i++) g.fillRect(16 + i * 26, 22, 18, 16);
        // fari-occhi gialli
        glow(g, 22, 56, 5, 0xfacc15, 0.9);
        glow(g, 108, 56, 5, 0xfacc15, 0.9);
        g.fillStyle(0xfde047, 1);
        g.fillCircle(22, 56, 4);
        g.fillCircle(108, 56, 4);
        // paraurti a denti
        g.fillStyle(0x9ca3af, 1);
        for (let i = 0; i < 9; i++) g.fillTriangle(14 + i * 13, 72, 20 + i * 13, 72, 17 + i * 13, 82);
        // numero di linea
        g.lineStyle(2.5, 0xfacc15, 0.9);
        g.strokeRect(54, 4, 22, 12);
        g.lineBetween(58, 10, 62, 10);
        g.lineBetween(68, 6, 68, 14);
    });

    // il primo custode: geco spettrale che batte il tempo, aura da disco d'oro
    make(scene, 'boss-custode', 60, 84, (g) => {
        g.fillStyle(0x0c1410, 0.95);
        g.fillRoundedRect(16, 20, 28, 52, 10);
        g.lineStyle(2, 0x4ade80, 0.8);
        g.strokeRoundedRect(16, 20, 28, 52, 10);
        // testa con maschera del custode
        g.fillStyle(0x0c1410, 1);
        g.fillCircle(30, 14, 12);
        g.lineStyle(1.5, 0x4ade80, 0.85);
        g.strokeCircle(30, 14, 12);
        // occhi a fessura ritmica
        glow(g, 25, 13, 2.4, 0x4ade80, 0.9);
        glow(g, 35, 13, 2.4, 0x4ade80, 0.9);
        // coda spettrale che si dissolve
        g.fillStyle(0x4ade80, 0.35);
        g.fillTriangle(16, 64, 16, 78, 2, 84);
        // note che gli orbitano
        g.fillStyle(0xfde047, 0.85);
        g.fillCircle(50, 30, 3); g.fillRect(52, 22, 1.5, 9);
        g.fillCircle(8, 36, 3); g.fillRect(10, 28, 1.5, 9);
        // aura disco d'oro
        glow(g, 30, 44, 7, 0xfde047, 0.25);
    });

    /* ---------- i rimpianti del void ----------
       figure umane deformi, fatte di ricordo: torso, testa, arti, ma
       sbagliate. viola = colpe di lametta, blu = colpe di piema. */

    // scanline da ricordo corrotto, riusata da tutti i rimpianti
    const ricordoScan = (g: Phaser.GameObjects.Graphics, w: number, h: number, c: number) => {
        g.lineStyle(1, c, 0.18);
        for (let y = 6; y < h - 4; y += 5) {
            g.beginPath();
            g.moveTo(4, y); g.lineTo(w - 4, y);
            g.strokePath();
        }
    };

    // il delegato: lametta a braccia aperte che scarica l'ordine. tiene un foglio
    make(scene, 'boss-delegato', 52, 80, (g) => {
        glow(g, 26, 44, 8, 0xc084fc, 0.22);
        g.fillStyle(0x140a1f, 0.95);
        g.fillRoundedRect(16, 22, 22, 40, 8);   // torso
        g.fillCircle(27, 13, 11);               // testa
        g.lineStyle(1.5, 0xc084fc, 0.8);
        g.strokeRoundedRect(16, 22, 22, 40, 8);
        g.strokeCircle(27, 13, 11);
        // braccia spalancate: «non è colpa mia, fallo tu»
        g.lineStyle(4, 0x140a1f, 1);
        g.beginPath();
        g.moveTo(16, 30); g.lineTo(2, 22);
        g.moveTo(38, 30); g.lineTo(50, 22);
        g.strokePath();
        // un foglio sporto in avanti: la delega
        g.fillStyle(0xe9d5ff, 0.85);
        g.fillRect(44, 18, 8, 10);
        // gambe
        g.lineStyle(4, 0x140a1f, 1);
        g.beginPath();
        g.moveTo(22, 62); g.lineTo(20, 78);
        g.moveTo(32, 62); g.lineTo(34, 78);
        g.strokePath();
        // occhi che guardano altrove
        glow(g, 23, 12, 2.2, 0xe9d5ff, 0.8);
        glow(g, 32, 12, 2.2, 0xe9d5ff, 0.8);
        ricordoScan(g, 52, 80, 0xc084fc);
    });

    // il notturno: lametta delle 4, fatto, accasciato, con la boccetta in mano
    make(scene, 'boss-notturno', 52, 80, (g) => {
        glow(g, 26, 46, 8, 0xc084fc, 0.22);
        g.fillStyle(0x140a1f, 0.95);
        g.fillRoundedRect(15, 28, 24, 36, 8);   // torso curvo in avanti
        g.fillCircle(24, 20, 11);               // testa china
        g.lineStyle(1.5, 0xc084fc, 0.7);
        g.strokeRoundedRect(15, 28, 24, 36, 8);
        g.strokeCircle(24, 20, 11);
        // un braccio penzola, l'altro regge la boccetta di trenbolone
        g.lineStyle(4, 0x140a1f, 1);
        g.beginPath();
        g.moveTo(16, 36); g.lineTo(8, 54);
        g.moveTo(38, 36); g.lineTo(44, 50);
        g.strokePath();
        g.fillStyle(0x84cc16, 0.9);             // boccetta verde
        g.fillRoundedRect(42, 48, 6, 12, 2);
        g.fillStyle(0xc084fc, 0.6);
        g.fillRect(43, 45, 4, 4);
        // gambe molli
        g.lineStyle(4, 0x140a1f, 1);
        g.beginPath();
        g.moveTo(22, 64); g.lineTo(18, 78);
        g.moveTo(31, 64); g.lineTo(33, 78);
        g.strokePath();
        // occhi a mezz'asta
        g.lineStyle(2, 0xe9d5ff, 0.8);
        g.beginPath();
        g.moveTo(19, 21); g.lineTo(23, 22);
        g.moveTo(26, 21); g.lineTo(30, 22);
        g.strokePath();
        ricordoScan(g, 52, 80, 0xc084fc);
    });

    // il modello: pedro in posa dentro la cornice, disegnato già storto
    make(scene, 'boss-modello', 54, 82, (g) => {
        // cornice del quadro
        g.lineStyle(3, 0xe9d5ff, 0.7);
        g.strokeRect(5, 5, 44, 72);
        glow(g, 27, 42, 8, 0xc084fc, 0.2);
        g.fillStyle(0x0e1216, 0.95);
        g.fillRoundedRect(18, 26, 20, 34, 6);   // corpo
        g.fillRoundedRect(20, 8, 18, 16, 4);    // testa quadrata da pedro
        g.lineStyle(1.5, 0xc084fc, 0.8);
        g.strokeRoundedRect(18, 26, 20, 34, 6);
        g.strokeRoundedRect(20, 8, 18, 16, 4);
        // posa: un braccio alzato, fermato nel disegno
        g.lineStyle(4, 0x0e1216, 1);
        g.beginPath();
        g.moveTo(20, 32); g.lineTo(12, 18);
        g.moveTo(36, 32); g.lineTo(44, 40);
        g.strokePath();
        // gambe
        g.beginPath();
        g.moveTo(24, 60); g.lineTo(22, 74);
        g.moveTo(32, 60); g.lineTo(34, 74);
        g.strokePath();
        // occhi GIÀ storti: uno alto, uno basso, prima del glitch
        glow(g, 25, 14, 2.2, 0xf87171, 0.85);
        glow(g, 33, 17, 2.2, 0x67e8f9, 0.85);
        ricordoScan(g, 54, 82, 0xc084fc);
    });

    // il revisore: piema con gli occhiali che riscrive i log. penna e cancellature
    make(scene, 'boss-revisore', 52, 80, (g) => {
        glow(g, 26, 44, 8, 0x60a5fa, 0.22);
        g.fillStyle(0x081019, 0.95);
        g.fillRoundedRect(16, 22, 22, 40, 8);
        g.fillCircle(27, 13, 11);
        g.lineStyle(1.5, 0x60a5fa, 0.8);
        g.strokeRoundedRect(16, 22, 22, 40, 8);
        g.strokeCircle(27, 13, 11);
        // occhiali da revisore
        g.lineStyle(1.5, 0x93c5fd, 0.9);
        g.strokeCircle(23, 13, 3.4);
        g.strokeCircle(31, 13, 3.4);
        g.beginPath();
        g.moveTo(26.4, 13); g.lineTo(27.6, 13);
        g.strokePath();
        // braccio che impugna la penna rossa
        g.lineStyle(4, 0x081019, 1);
        g.beginPath();
        g.moveTo(38, 32); g.lineTo(46, 44);
        g.strokePath();
        g.lineStyle(2.5, 0xf87171, 1);
        g.beginPath();
        g.moveTo(46, 44); g.lineTo(50, 50);
        g.strokePath();
        // cancellature rosse sul torace: log riscritti
        g.lineStyle(2, 0xf87171, 0.8);
        g.beginPath();
        g.moveTo(18, 34); g.lineTo(34, 36);
        g.moveTo(18, 42); g.lineTo(32, 40);
        g.strokePath();
        // gambe
        g.lineStyle(4, 0x081019, 1);
        g.beginPath();
        g.moveTo(22, 62); g.lineTo(20, 78);
        g.moveTo(32, 62); g.lineTo(34, 78);
        g.strokePath();
        ricordoScan(g, 52, 80, 0x60a5fa);
    });

    // il 33: due tre giganti e ostili, fatti di numero puro. occhi tra le curve.
    make(scene, 'boss-trentatre', 88, 84, (g) => {
        glow(g, 44, 42, 14, 0xfacc15, 0.3);
        const tre = (cx: number) => {
            g.lineStyle(7, 0xfde047, 0.95);
            // curva superiore del 3
            g.beginPath();
            g.arc(cx, 24, 14, Math.PI * 1.15, Math.PI * 0.5, false);
            g.strokePath();
            // curva inferiore del 3
            g.beginPath();
            g.arc(cx, 52, 14, Math.PI * 1.5, Math.PI * 0.85, false);
            g.strokePath();
            // bordo interno luminoso
            g.lineStyle(2, 0xffffff, 0.6);
            g.beginPath();
            g.arc(cx, 24, 14, Math.PI * 1.15, Math.PI * 0.5, false);
            g.strokePath();
            // occhio ostile annidato nella pancia del numero
            glow(g, cx + 2, 38, 2.6, 0xf87171, 0.9);
        };
        tre(26);
        tre(62);
        // glitch tra i due tre: scariche verticali
        g.lineStyle(1.5, 0xfacc15, 0.5);
        for (const x of [44, 46, 42]) {
            g.beginPath();
            g.moveTo(x, 8); g.lineTo(x, 76);
            g.strokePath();
        }
    });

    // il garante: piema che giura il falso. mano alzata, bocca cucita, cuore nascosto
    make(scene, 'boss-garante', 54, 84, (g) => {
        glow(g, 27, 46, 9, 0x60a5fa, 0.25);
        g.fillStyle(0x081019, 0.95);
        g.fillRoundedRect(17, 24, 22, 42, 8);
        g.fillCircle(28, 14, 11);
        g.lineStyle(1.5, 0x60a5fa, 0.85);
        g.strokeRoundedRect(17, 24, 22, 42, 8);
        g.strokeCircle(28, 14, 11);
        // mano destra alzata nel giuramento
        g.lineStyle(4, 0x081019, 1);
        g.beginPath();
        g.moveTo(39, 32); g.lineTo(46, 16);
        g.strokePath();
        g.fillStyle(0x081019, 1);
        g.fillCircle(46, 14, 4);
        // mano sinistra sul petto, sopra il cuore che nasconde
        g.lineStyle(4, 0x081019, 1);
        g.beginPath();
        g.moveTo(17, 34); g.lineTo(24, 44);
        g.strokePath();
        glow(g, 26, 44, 2.4, 0xf87171, 0.4);   // cuore nascosto sotto la mano
        // bocca cucita: il silenzio
        g.lineStyle(1.5, 0x93c5fd, 0.9);
        g.beginPath();
        g.moveTo(23, 18); g.lineTo(33, 18);
        g.strokePath();
        g.lineStyle(1, 0xf87171, 0.8);
        for (const x of [25, 28, 31]) {
            g.beginPath();
            g.moveTo(x, 16); g.lineTo(x, 20);
            g.strokePath();
        }
        // occhi fermi
        glow(g, 24, 13, 2.2, 0x93c5fd, 0.85);
        glow(g, 32, 13, 2.2, 0x93c5fd, 0.85);
        // gambe
        g.lineStyle(4, 0x081019, 1);
        g.beginPath();
        g.moveTo(23, 66); g.lineTo(21, 82);
        g.moveTo(33, 66); g.lineTo(35, 82);
        g.strokePath();
        ricordoScan(g, 54, 84, 0x60a5fa);
    });

    /* ---------- la quest di walter: maranza, dipendenti e walter boss ---------- */

    // maranza base: tuta, borsello a tracolla, occhi spenti
    make(scene, 'boss-maranza', 56, 80, (g) => {
        g.fillStyle(0x16110f, 1);
        g.fillRoundedRect(16, 24, 24, 42, 8);
        g.fillCircle(28, 14, 11);
        // cappellino col frontino dritto
        g.fillStyle(0x2a1410, 1);
        g.fillRoundedRect(17, 3, 22, 7, 3);
        g.fillRect(15, 9, 18, 3);
        // catena d'oro
        g.lineStyle(2, 0xf59e0b, 0.9);
        g.beginPath();
        g.arc(28, 28, 7, 0.2, Math.PI - 0.2);
        g.strokePath();
        // borsello a tracolla
        g.fillStyle(0x3b0a0a, 1);
        g.fillRoundedRect(34, 36, 12, 14, 3);
        g.lineStyle(2, 0x16110f, 1);
        g.beginPath();
        g.moveTo(18, 26); g.lineTo(40, 44);
        g.strokePath();
        // braccia
        g.lineStyle(4, 0x16110f, 1);
        g.beginPath();
        g.moveTo(17, 32); g.lineTo(8, 46);
        g.moveTo(39, 32); g.lineTo(46, 44);
        g.strokePath();
        // gambe
        g.beginPath();
        g.moveTo(23, 66); g.lineTo(21, 78);
        g.moveTo(33, 66); g.lineTo(35, 78);
        g.strokePath();
        glow(g, 24, 14, 2, 0xdc2626, 0.6);
        glow(g, 32, 14, 2, 0xdc2626, 0.6);
    });

    // maranzone: lo stesso ma gonfio e furibondo. l'hai guardato male
    make(scene, 'boss-maranzone', 72, 92, (g) => {
        g.fillStyle(0x1a0c0a, 1);
        g.fillRoundedRect(18, 26, 36, 50, 10);
        g.fillCircle(36, 16, 13);
        // cappellino
        g.fillStyle(0x2a1410, 1);
        g.fillRoundedRect(22, 2, 28, 9, 3);
        g.fillRect(19, 9, 22, 3);
        // sopracciglia incazzate
        g.lineStyle(2.5, 0x000000, 1);
        g.beginPath();
        g.moveTo(28, 12); g.lineTo(34, 16);
        g.moveTo(44, 12); g.lineTo(38, 16);
        g.strokePath();
        // catenazza
        g.lineStyle(3, 0xfbbf24, 0.95);
        g.beginPath();
        g.arc(36, 32, 9, 0.2, Math.PI - 0.2);
        g.strokePath();
        // braccia gonfie a pugni
        g.lineStyle(6, 0x1a0c0a, 1);
        g.beginPath();
        g.moveTo(20, 34); g.lineTo(8, 50);
        g.moveTo(52, 34); g.lineTo(64, 50);
        g.strokePath();
        g.fillStyle(0x1a0c0a, 1);
        g.fillCircle(7, 52, 6);
        g.fillCircle(65, 52, 6);
        // gambe
        g.lineStyle(5, 0x1a0c0a, 1);
        g.beginPath();
        g.moveTo(29, 76); g.lineTo(26, 90);
        g.moveTo(43, 76); g.lineTo(46, 90);
        g.strokePath();
        glow(g, 31, 16, 2.6, 0xb91c1c, 0.8);
        glow(g, 41, 16, 2.6, 0xb91c1c, 0.8);
    });

    // istruttore di guida: camicia, paletta, sguardo da esame fallito
    make(scene, 'boss-istruttore', 54, 84, (g) => {
        g.fillStyle(0x1b1a12, 1);
        g.fillRoundedRect(16, 24, 24, 44, 7);
        g.fillCircle(28, 14, 10);
        // camicia con taschino
        g.fillStyle(0x2a2818, 1);
        g.fillRect(22, 28, 12, 18);
        g.fillStyle(0xf59e0b, 0.9);
        g.fillRect(24, 32, 4, 4);
        // paletta del segnale stop
        g.lineStyle(3, 0x2b2d3d, 1);
        g.beginPath();
        g.moveTo(40, 40); g.lineTo(48, 22);
        g.strokePath();
        g.fillStyle(0xdc2626, 1);
        g.fillCircle(49, 18, 7);
        g.lineStyle(1.5, 0xffffff, 0.9);
        g.strokeCircle(49, 18, 7);
        // braccio
        g.lineStyle(4, 0x1b1a12, 1);
        g.beginPath();
        g.moveTo(16, 32); g.lineTo(8, 44);
        g.strokePath();
        // gambe
        g.beginPath();
        g.moveTo(23, 68); g.lineTo(21, 82);
        g.moveTo(33, 68); g.lineTo(35, 82);
        g.strokePath();
        glow(g, 24, 14, 2, 0xf59e0b, 0.6);
        glow(g, 32, 14, 2, 0xf59e0b, 0.6);
    });

    // signora anna: dietro la scrivania, timbri e occhiali a catenella
    make(scene, 'boss-annascrivania', 96, 70, (g) => {
        // scrivania
        g.fillStyle(0x1a130c, 1);
        g.fillRoundedRect(4, 40, 88, 26, 4);
        g.lineStyle(1.5, 0x4a3a22, 1);
        g.strokeRoundedRect(4, 40, 88, 26, 4);
        // busto dietro la scrivania
        g.fillStyle(0x22160f, 1);
        g.fillRoundedRect(34, 14, 28, 30, 8);
        g.fillCircle(48, 10, 9);
        // capelli cotonati
        g.fillStyle(0x3a2a18, 1);
        g.fillEllipse(48, 4, 22, 8);
        // occhiali a catenella
        g.lineStyle(1.5, 0xf59e0b, 0.9);
        g.strokeCircle(44, 10, 3);
        g.strokeCircle(52, 10, 3);
        // timbro alzato in mano
        g.lineStyle(3, 0x22160f, 1);
        g.beginPath();
        g.moveTo(62, 24); g.lineTo(72, 14);
        g.strokePath();
        g.fillStyle(0x4a3a22, 1);
        g.fillRect(68, 8, 8, 7);
        // pratiche accatastate
        g.fillStyle(0xe5e7eb, 0.55);
        g.fillRect(10, 34, 14, 8);
        g.fillRect(72, 34, 14, 8);
        glow(g, 44, 10, 1.6, 0xf59e0b, 0.6);
        glow(g, 52, 10, 1.6, 0xf59e0b, 0.6);
    });

    // walter boss: gigantesco, occhi spalancati, chiavi della polo come arma
    make(scene, 'boss-walter', 96, 110, (g) => {
        // corpaccione verde-cupo
        g.fillStyle(0x0f2418, 1);
        g.fillEllipse(48, 70, 70, 78);
        g.fillCircle(48, 26, 22);
        g.lineStyle(2, 0x16a34a, 0.8);
        g.strokeCircle(48, 26, 22);
        // polo gigante: colletto
        g.fillStyle(0x16331f, 1);
        g.fillTriangle(34, 44, 48, 58, 62, 44);
        // occhi ora spalancati: non dorme più
        g.fillStyle(0xffffff, 0.95);
        g.fillCircle(40, 24, 6);
        g.fillCircle(56, 24, 6);
        g.fillStyle(0x000000, 1);
        g.fillCircle(41, 25, 2.5);
        g.fillCircle(55, 25, 2.5);
        // ghigno
        g.lineStyle(2.5, 0x0a0a0a, 1);
        g.beginPath();
        g.arc(48, 32, 9, 0.15, Math.PI - 0.15);
        g.strokePath();
        // braccia enormi
        g.lineStyle(9, 0x0f2418, 1);
        g.beginPath();
        g.moveTo(20, 60); g.lineTo(4, 86);
        g.moveTo(76, 60); g.lineTo(92, 84);
        g.strokePath();
        // mazzo di chiavi della polo come flagello
        g.fillStyle(0x4a4252, 1);
        g.fillCircle(92, 86, 5);
        g.lineStyle(2, 0xf59e0b, 0.9);
        g.beginPath();
        g.moveTo(92, 86); g.lineTo(96, 96);
        g.strokePath();
        glow(g, 40, 24, 3, 0x16a34a, 0.7);
        glow(g, 56, 24, 3, 0x16a34a, 0.7);
        glow(g, 48, 70, 5, 0x16a34a, 0.4);
    });
}

/* ---------- oggetti ---------- */

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
    enemies(scene);
    npcs(scene);
    bosses(scene);
    objects(scene);
    particles(scene);
}
