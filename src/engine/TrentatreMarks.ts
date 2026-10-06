import Phaser from 'phaser';
import { TILE } from '../config';
import { WAVESUNG } from '../content/story';
import { hashString } from './art/ink';
import { bus } from './events';
import { state } from './state';

/* i 33 mimetizzati sui muri che non sono muri: li dipinge l'1% di pedro
   che non ha eseguito l'ordine, senza sapere perché, del colore del muro.
   dove c'è un 33, dietro c'è qualcosa. il giocatore impara a leggerli
   come una lingua del realm */

interface Mark {
    img: Phaser.GameObjects.Image;
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
    private extinguished: { img: Phaser.GameObjects.Image; alpha: number }[] = [];

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    /** tint = roccia del bioma verso il fondo: il segno sta DENTRO il muro */
    build(levelId: string, groups: Phaser.Physics.Arcade.StaticGroup[], tint: number): void {
        const walls = groups.flatMap((g) => g.getChildren() as Phaser.Physics.Arcade.Sprite[]);
        if (!walls.length) return;
        const key = `${KEY}-${tint.toString(16)}`;
        this.ensureTexture(key, tint);
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
            // niente luce, niente contorno: solo il tono del muro, appena più caldo
            const img = this.scene.add.image(cx, cy, key).setRotation(rot).setAlpha(0.75).setDepth(5.5);
            this.marks.push({ img, walls: cluster, box: new Phaser.Geom.Rectangle(minX, minY, maxX - minX, maxY - minY), gone: false });
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
                this.scene.tweens.add({ targets: [m.img], alpha: 0, duration: 400 });
                continue;
            }
            m.img.setAlpha(inside ? 0.25 : 0.75);
            if (!state.hasFlag('seme-33-visto') && Math.abs(player.x - m.img.x) < SEEN_R && Math.abs(player.y - m.img.y) < SEEN_R * 0.7) {
                state.setFlag('seme-33-visto');
                this.scene.time.delayedCall(900, () => bus.emit('wavesung', WAVESUNG.markolino33));
            }
        }
    }

    private ensureTexture(key: string, tint: number): void {
        if (this.scene.textures.exists(key)) return;
        const t = this.scene.textures.createCanvas(key, 64, 44);
        if (!t) return;
        const c = t.getContext();
        c.font = '34px "Permanent Marker", cursive';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        // solo tinta, senza contorno: il segno non spicca, affonda
        c.fillStyle = `#${tint.toString(16).padStart(6, '0')}`;
        c.fillText('33', 32, 24);
        t.refresh();
    }

    destroy(): void {
        for (const m of this.marks) {
            m.img.destroy();
        }
        this.marks = [];
        this.extinguished = [];
    }

    /** l'ordine spegne i segni delle pareti scelte, senza romperli: restano nel save */
    extinguishWalls(walls: readonly Phaser.Physics.Arcade.Sprite[]): void {
        for (const m of this.marks) {
            if (m.gone) continue;
            if (this.extinguished.some((e) => e.img === m.img)) continue;
            if (!m.walls.some((w) => walls.includes(w))) continue;
            this.extinguished.push({ img: m.img, alpha: m.img.alpha });
            this.scene.tweens.add({ targets: m.img, alpha: 0, duration: 500, ease: 'Sine.easeIn' });
        }
    }

    /** la rottura riaccende i segni spenti, con un filo di luce */
    restoreExtinguished(): void {
        for (const e of this.extinguished) {
            if (!e.img.scene) continue;
            try {
                const glow = this.scene.add.particles(e.img.x, e.img.y, 'p-spark', {
                    speed: { min: 20, max: 80 }, scale: { start: 0.6, end: 0 },
                    tint: 0x7dd3fc, lifespan: 400, quantity: 6, stopAfter: 6,
                });
                glow.setDepth(6);
                this.scene.time.delayedCall(600, () => glow.destroy());
            } catch { /* test */ }
            this.scene.tweens.add({ targets: e.img, alpha: e.alpha, duration: 600, ease: 'Sine.easeOut' });
        }
        this.extinguished = [];
    }
}
