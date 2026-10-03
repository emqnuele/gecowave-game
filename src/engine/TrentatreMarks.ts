import Phaser from 'phaser';
import { TILE } from '../config';
import { WAVESUNG } from '../content/story';
import { hashString } from './art/ink';
import { bus } from './events';
import { state } from './state';

/* i 33 azzurri sui muri che non sono muri: li dipinge l'1% di pedro che non
   ha eseguito l'ordine, senza sapere perché. dove c'è un 33, dietro c'è
   qualcosa. il giocatore impara a leggerli come una lingua del realm */

interface Mark {
    img: Phaser.GameObjects.Image;
    glow: Phaser.GameObjects.Image;
    walls: Phaser.Physics.Arcade.Sprite[];
    box: Phaser.Geom.Rectangle;
    gone: boolean;
}

const KEY = 'trentatre-mark';
const SHARE = 0.6;
const SEEN_R = 280;

export class TrentatreMarks {
    private scene: Phaser.Scene;
    private marks: Mark[] = [];

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    build(levelId: string, groups: Phaser.Physics.Arcade.StaticGroup[]): void {
        const walls = groups.flatMap((g) => g.getChildren() as Phaser.Physics.Arcade.Sprite[]);
        if (!walls.length) return;
        this.ensureTexture();
        const byCell = new Map<string, Phaser.Physics.Arcade.Sprite>();
        for (const w of walls) byCell.set(`${Math.floor(w.x / TILE)},${Math.floor(w.y / TILE)}`, w);
        const seen = new Set<string>();
        for (const [start] of byCell) {
            if (seen.has(start)) continue;
            // un muro finto è un grumo di celle: un solo 33 per grumo
            const cluster: Phaser.Physics.Arcade.Sprite[] = [];
            const queue = [start];
            seen.add(start);
            while (queue.length) {
                const key = queue.pop()!;
                cluster.push(byCell.get(key)!);
                const [c, r] = key.split(',').map(Number) as [number, number];
                for (const n of [`${c + 1},${r}`, `${c - 1},${r}`, `${c},${r + 1}`, `${c},${r - 1}`]) {
                    if (byCell.has(n) && !seen.has(n)) {
                        seen.add(n);
                        queue.push(n);
                    }
                }
            }
            const minX = Math.min(...cluster.map((w) => w.x)) - TILE / 2;
            const maxX = Math.max(...cluster.map((w) => w.x)) + TILE / 2;
            const minY = Math.min(...cluster.map((w) => w.y)) - TILE / 2;
            const maxY = Math.max(...cluster.map((w) => w.y)) + TILE / 2;
            if ((hashString(`${levelId}:33:${start}`) % 1000) / 1000 > SHARE) continue;
            const cx = (minX + maxX) / 2;
            const cy = minY + Math.min(maxY - minY, TILE * 3) / 2;
            const rot = ((hashString(start) % 100) / 100 - 0.5) * 0.3;
            const glow = this.scene.add.image(cx, cy, 'p-dot').setTint(0x67e8f9).setBlendMode(Phaser.BlendModes.ADD)
                .setAlpha(0.25).setScale(3.4).setDepth(5.4);
            const img = this.scene.add.image(cx, cy, KEY).setRotation(rot).setAlpha(0.9).setDepth(5.5);
            this.scene.tweens.add({ targets: glow, alpha: 0.45, scale: 4, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            this.marks.push({ img, glow, walls: cluster, box: new Phaser.Geom.Rectangle(minX, minY, maxX - minX, maxY - minY), gone: false });
        }
    }

    update(player: Phaser.GameObjects.Sprite): void {
        for (const m of this.marks) {
            if (m.gone) continue;
            // il muro rotto o attraversato si porta via il segno
            const broken = m.walls.every((w) => !w.active);
            const inside = Phaser.Geom.Rectangle.Contains(m.box, player.x, player.y);
            if (broken) {
                m.gone = true;
                this.scene.tweens.add({ targets: [m.img, m.glow], alpha: 0, duration: 400 });
                continue;
            }
            m.img.setAlpha(inside ? 0.2 : 0.9);
            if (!state.hasFlag('seme-33-visto') && Math.abs(player.x - m.img.x) < SEEN_R && Math.abs(player.y - m.img.y) < SEEN_R * 0.7) {
                state.setFlag('seme-33-visto');
                this.scene.time.delayedCall(900, () => bus.emit('wavesung', WAVESUNG.markolino33));
            }
        }
    }

    private ensureTexture(): void {
        if (this.scene.textures.exists(KEY)) return;
        const t = this.scene.textures.createCanvas(KEY, 64, 44);
        if (!t) return;
        const c = t.getContext();
        c.font = '34px "Permanent Marker", cursive';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.lineJoin = 'round';
        // contorno d'inchiostro come il resto del mondo, poi l'azzurro ordinato di pedro
        c.lineWidth = 6;
        c.strokeStyle = '#0b0c10';
        c.strokeText('33', 32, 24);
        c.fillStyle = '#67e8f9';
        c.fillText('33', 32, 24);
        t.refresh();
    }

    destroy(): void {
        for (const m of this.marks) {
            m.img.destroy();
            m.glow.destroy();
        }
        this.marks = [];
    }
}
