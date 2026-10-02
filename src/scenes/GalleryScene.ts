import Phaser from 'phaser';
import { CreatureGlow, creatureFrames, creatureRes } from '../engine/art/creatureKit';
import { CREATURE_KEYS, ensureCreature } from '../engine/art/creatures';

/* solo sviluppo (?gallery): tutto il cast vivo in griglia sotto una luce
   che segue il mouse, per controllare disegni, normal map e fotogrammi */
export class GalleryScene extends Phaser.Scene {
    private sprites: { s: Phaser.GameObjects.Sprite; g: CreatureGlow; n: number }[] = [];
    private t = 0;

    constructor() {
        super('GalleryScene');
    }

    create(): void {
        const filter = new URLSearchParams(location.search).get('gallery') ?? '';
        const keys = CREATURE_KEYS.filter((k) => !filter || filter === '1' || k.includes(filter));
        this.cameras.main.setBackgroundColor(0x1a1c24);
        this.lights.enable().setAmbientColor(0x202430);
        const big = keys.some((k) => k.startsWith('boss-'));
        const cell = Number(new URLSearchParams(location.search).get('cell')) || (big ? 210 : 120);
        const cols = Math.max(1, Math.floor((this.scale.width - 20) / cell));
        keys.forEach((key, i) => {
            const x = 20 + cell / 2 + (i % cols) * cell;
            const y = 20 + cell / 2 + Math.floor(i / cols) * cell;
            ensureCreature(this, key);
            const res = creatureRes(this, key);
            const tex = this.textures.get(key).get(0);
            const logical = Math.max(tex.width, tex.height) / res;
            const scale = (key.startsWith('boss-') ? Math.min(2.1, (cell - 30) / logical) : Math.min(cell / 50, (cell - 30) / logical)) / res;
            const s = this.add.sprite(x, y, key, 0).setScale(scale).setPipeline('Light2D');
            const g = new CreatureGlow(s);
            this.sprites.push({ s, g, n: creatureFrames(this, key) });
            this.add.text(x, y + cell / 2 - 14, key.replace(/^(enemy|boss)-/, ''), { fontFamily: 'monospace', fontSize: '11px', color: '#94a3b8' }).setOrigin(0.5);
            this.lights.addLight(x - 30, y - 50, 150, 0xfff1d6, 1.2);
        });
        const mouse = this.lights.addLight(0, 0, 260, 0x9ff5d0, 1.4);
        this.input.on('pointermove', (p: Phaser.Input.Pointer) => mouse.setPosition(p.worldX, p.worldY));
    }

    update(_time: number, delta: number): void {
        this.t += delta;
        for (const { s, g, n } of this.sprites) {
            s.setFrame(Math.floor(this.t / 170) % n);
            g.sync();
        }
    }
}
