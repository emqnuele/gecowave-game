import Phaser from 'phaser';
import './style.css';
import { PHYSICS } from './config';
import { FIRST_LEVEL } from './content/levels';
import { ENDING_CONSEGNA, ENDING_DEI, ENDING_PEDRO, INTRO_CARDS } from './content/story';
import { bus } from './engine/events';
import { sfx } from './engine/sfx';
import { state } from './engine/state';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { DialogueBox } from './ui/dialogue';
import { Hud } from './ui/hud';
import { Screens, type GameController } from './ui/screens';
import { ui } from './ui/dom';

async function boot(): Promise<void> {
    // i font devono esserci prima che il canvas li usi
    await document.fonts.ready;

    const screens = new Screens();
    const hud = new Hud();
    new DialogueBox();
    ui().append(hud.root);

    const game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: 'game',
        transparent: true,
        scale: {
            mode: Phaser.Scale.RESIZE,
            width: '100%',
            height: '100%',
        },
        render: {
            maxLights: 24,
        },
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { x: 0, y: PHYSICS.gravity },
                // tile da 160px scalate 0.2: serve un bias alto contro il tunneling
                tileBias: 48,
            },
        },
        scene: [BootScene, GameScene],
    });

    const startLevel = (levelId: string, checkpointId: string | null, showCard = true): void => {
        sfx.init();
        state.resetRun();
        hud.show();
        const scene = game.scene.getScene('GameScene');
        if (game.scene.isActive('GameScene') || game.scene.isPaused('GameScene')) {
            scene.scene.restart({ levelId, checkpointId, showCard });
            game.scene.resume('GameScene');
        } else {
            game.scene.start('GameScene', { levelId, checkpointId, showCard });
        }
    };

    const controller: GameController = {
        newGame() {
            state.reset();
            screens.closeOverlay();
            screens.storySequence(INTRO_CARDS, () => startLevel(FIRST_LEVEL, null));
        },
        continueGame() {
            screens.closeOverlay();
            startLevel(state.save.levelId, state.save.checkpointId);
        },
        retry() {
            startLevel(state.save.levelId, state.save.checkpointId, false);
        },
        pause() {
            game.scene.pause('GameScene');
        },
        resume() {
            game.scene.resume('GameScene');
        },
        quitToMenu() {
            sfx.stopPad();
            game.scene.stop('GameScene');
            hud.hide();
            screens.showMenu();
        },
    };
    screens.bind(controller);

    bus.on('ending', ({ id }) => {
        sfx.stopPad();
        if (id === 'pedro') {
            // finale sbagliato: gli dei ti oneshottano, si riprova dalla scelta
            screens.storySequence(ENDING_PEDRO, () => controller.retry());
            return;
        }
        const cards = id === 'consegna' ? ENDING_CONSEGNA : ENDING_DEI;
        hud.hide();
        game.scene.stop('GameScene');
        screens.storySequence(cards, () => {
            state.save.endingSeen = id;
            // ng+: si riparte dall'inizio ma con tutte le wave addosso
            state.save.levelId = FIRST_LEVEL;
            state.save.checkpointId = null;
            state.persist();
            screens.showMenu();
        });
    });

    game.events.once('boot-complete', () => screens.showMenu());
}

void boot();
