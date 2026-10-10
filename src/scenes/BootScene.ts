import Phaser from 'phaser';
import { generateBaseTextures } from '../art/textures';
import { ensurePlayerSkin } from '../art/playerSkin';
import { state } from '../core/state';
import { LEVEL_ORDER, REGION_IDS } from '../content/levels';
import { regionKey, regionUrl } from '../world/registry';

export class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload(): void {
        this.load.spritesheet('tileset_main', 'assets/tileset_main.png', { frameWidth: 160, frameHeight: 160 });
        this.load.image('background', 'assets/background.png');
        this.load.image('background2', 'assets/background2.png');

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
        this.load.image('bg-painted-title', 'assets/mainmenu.png');

        // le regioni generate offline: se una manca si gioca il capitolo vecchio
        for (const id of REGION_IDS) this.load.json(regionKey(id), regionUrl(id));

        // sheet 2828x1403: righe 0-2 da 8 frame 350x350, riga 3 attacco a 700x350
        this.load.spritesheet('player', 'assets/sprites/player_sheet.png', { frameWidth: 350, frameHeight: 350 });
        this.load.spritesheet('player_atk', 'assets/sprites/player_sheet.png', { frameWidth: 700, frameHeight: 350 });
    }

    create(): void {
        generateBaseTextures(this);
        // la pelle scelta vive nelle texture: chi crea sprite dopo trova già tutto pronto
        ensurePlayerSkin(this, state.save.skin);
        this.game.events.emit('boot-complete');
    }
}
