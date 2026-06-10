import Phaser from 'phaser';
import { generateBaseTextures } from '../engine/textures';

export class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    create(): void {
        generateBaseTextures(this);
        this.game.events.emit('boot-complete');
    }
}
