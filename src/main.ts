import Phaser from 'phaser';
import './style.css';
import { Preloader } from './scenes/Preloader';
import { MainMenuScene } from './scenes/MainMenuScene';
import { SettingsScene } from './scenes/SettingsScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';
import { GameOverScene } from './scenes/GameOverScene';
import { PauseScene } from './scenes/PauseScene';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.RESIZE,
        width: '100%',
        height: '100%',
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    parent: 'app', // Vite vanilla-ts uses <div id="app"></div>
    physics: {
        default: 'arcade',
        arcade: {
            // Constants say GRAVITY = 1500. Let's set global Y gravity here just in case,
            // but Entity classes set their own.
            // Actually, if we set it here, all dynamic bodies get it.
            // Let's rely on Entity settings for precision or set a sane default.
            gravity: { y: 0, x: 0 },
            debug: true,
            tileBias: 48, // Increase to prevent tunneling at high gravity
            fps: 60,       // Ensure stable physics step
        },
    },
    scene: [Preloader, MainMenuScene, SettingsScene, GameScene, UIScene, GameOverScene, PauseScene],
};

new Phaser.Game(config);
