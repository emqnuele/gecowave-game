import Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { rng } from '../core/rng';

/* il geco che esce dall'acqua si porta dietro il posto: gocciola per qualche
   secondo e lascia impronte che si asciugano. solo grafica e suono */

const WET_MS = 4500;
const PRINT_GAP = 30;
const PRINT_FADE_MS = 3200;

interface Walker {
    x: number;
    y: number;
    dead: boolean;
    hidden: boolean;
    body: Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | null;
}

export class WetTrail {
    private scene: Phaser.Scene;
    private wasIn = false;
    private wetUntil = 0;
    private nextDrip = 0;
    private drips = 0;
    private lastPrintX = 0;
    private side: 1 | -1 = 1;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.ensureTextures();
    }

    update(p: Walker, inWater: boolean): void {
        const now = this.scene.time.now;
        if (this.wasIn && !inWater) {
            this.wetUntil = now + WET_MS;
            this.lastPrintX = p.x;
        }
        this.wasIn = inWater;
        if (inWater || now >= this.wetUntil || p.dead || p.hidden) return;
        const k = (this.wetUntil - now) / WET_MS;
        const body = p.body as Phaser.Physics.Arcade.Body | null;
        if (now >= this.nextDrip) {
            // più passa il tempo più le gocce si diradano
            this.nextDrip = now + 90 + (1 - k) * 300;
            this.drop(p.x + (rng.fx.next() - 0.5) * 18, (body ? body.bottom : p.y + 24) - 10 - rng.fx.next() * 26, k);
            if (++this.drips % 5 === 0) sfx.drip((rng.fx.next() - 0.5) * 0.3, 0.25 * k);
        }
        if (body?.blocked.down && Math.abs(p.x - this.lastPrintX) >= PRINT_GAP) {
            this.lastPrintX = p.x;
            this.side = this.side > 0 ? -1 : 1;
            this.print(p.x + this.side * 5, body.bottom, k);
        }
    }

    private drop(x: number, y: number, k: number): void {
        const img = this.scene.add.image(x, y, 'wet-drop').setDepth(6).setAlpha(0.75 * k + 0.25);
        this.scene.tweens.add({
            targets: img, y: y + 34, alpha: 0, duration: 380, ease: 'Quad.easeIn',
            onComplete: () => img.destroy(),
        });
    }

    private print(x: number, y: number, k: number): void {
        // sopra l'erba del bordo del terreno, se no sparisce sotto
        const img = this.scene.add.image(x, y - 2, 'wet-print').setDepth(5.5).setAlpha(0.45 * k + 0.2);
        this.scene.tweens.add({ targets: img, alpha: 0, duration: PRINT_FADE_MS, ease: 'Sine.easeIn', onComplete: () => img.destroy() });
    }

    private ensureTextures(): void {
        if (!this.scene.textures.exists('wet-drop')) {
            const g = this.scene.add.graphics();
            g.fillStyle(0xcfe8ff, 1);
            g.fillEllipse(2, 4, 3, 7);
            g.generateTexture('wet-drop', 4, 8);
            g.destroy();
        }
        if (!this.scene.textures.exists('wet-print')) {
            // sul suolo a inchiostro il bagnato si vede come un riflesso, non come una macchia
            const g = this.scene.add.graphics();
            g.fillStyle(0xbfe3f0, 0.55);
            g.fillEllipse(6, 2, 11, 3);
            g.fillStyle(0xe8f6ff, 0.8);
            g.fillEllipse(5, 1.5, 5, 1.2);
            g.generateTexture('wet-print', 12, 4);
            g.destroy();
        }
    }
}
