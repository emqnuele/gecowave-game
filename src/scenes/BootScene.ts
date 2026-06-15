import Phaser from 'phaser';
import { generateBaseTextures } from '../engine/textures';
import { LEVEL_ORDER } from '../content/levels';

export class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload(): void {
        this.load.spritesheet('tileset_main', 'assets/tileset_main.png', { frameWidth: 160, frameHeight: 160 });
        this.load.image('background', 'assets/background.png');
        this.load.image('background2', 'assets/background2.png');
        this.load.image('ruins_columns', 'assets/ruins_columns.png');
        this.load.image('props_atlas', 'assets/props.png');

        // sfondi dipinti per livello (perduta tenuto a mano, escluso).
        // file mancanti vengono ignorati: il parallax ricade sul fondale legacy
        this.load.on('loaderror', () => {});
        for (const id of LEVEL_ORDER) {
            if (id === 'perduta') continue;
            this.load.image(`bg-painted-${id}`, `assets/backgrounds/${id}.png`);
        }
        // capitoli segreti di walter: fondali dedicati (se mancano, fallback al parallax legacy)
        this.load.image('bg-painted-galliate', 'assets/backgrounds/galliate.png');
        this.load.image('bg-painted-marcetti', 'assets/backgrounds/marcetti.png');

        // sheet 2828x1403: righe 0-2 da 8 frame 350x350, riga 3 attacco a 700x350
        this.load.spritesheet('player', 'assets/sprites/player_sheet.png', { frameWidth: 350, frameHeight: 350 });
        this.load.spritesheet('player_atk', 'assets/sprites/player_sheet.png', { frameWidth: 700, frameHeight: 350 });
    }

    create(): void {
        this.definePropFrames();
        generateBaseTextures(this);
        this.game.events.emit('boot-complete');
    }

    /** l'atlante dei props ha 3 fasce: terra, fondale, soffitto */
    private definePropFrames(): void {
        const atlas = this.textures.get('props_atlas');
        if (!atlas || atlas.key === '__MISSING') return;

        for (let i = 0; i < 8; i++) {
            atlas.add(`prop_ground_${i}`, 0, i * 350, 0, 350, 350);
            atlas.add(`prop_bg_${i}`, 0, i * 350, 525, 350, 350);
        }
        const ceilWidths = [525, 350, 350, 525, 350, 700];
        let x = 0;
        ceilWidths.forEach((width, index) => {
            atlas.add(`prop_ceil_${index}`, 0, x, 1050, width, 350);
            x += width;
        });
    }
}
