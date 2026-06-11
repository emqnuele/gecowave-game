import Phaser from 'phaser';
import './style.css';
import { PHYSICS } from './config';
import { FIRST_LEVEL } from './content/levels';
import { endingCards, INTRO_CARDS } from './content/story';
import { bus } from './engine/events';
import { sfx } from './engine/sfx';
import { state } from './engine/state';
import { music } from './engine/music';
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
        music.playLevel(levelId);
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
            screens.showCharacterCreation(() => {
                screens.storySequence(INTRO_CARDS, () => startLevel(FIRST_LEVEL, null));
            });
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
            music.playMenu();
        },
        travel(levelId: string) {
            screens.closeOverlay();
            startLevel(levelId, null);
        },
    };
    screens.bind(controller);

    bus.on('ending', ({ id }) => {
        sfx.stopPad();
        const cards = endingCards(id, state.save.flags);
        if (id === 'pedro') {
            // finale sbagliato: gli dei ti hanno raggiunto, si riprova dalla scelta
            screens.storySequence(cards, () => controller.retry());
            return;
        }
        music.playEnding();
        hud.hide();
        game.scene.stop('GameScene');
        screens.storySequence(cards, () => {
            state.save.endingSeen = id;
            // ng+: si riparte dall'inizio con tutte le wave, ma boss e agguati tornano
            state.save.levelId = FIRST_LEVEL;
            state.save.checkpointId = null;
            state.save.flags = state.save.flags.filter((f) => !f.startsWith('boss-down-') && !f.startsWith('agguato-'));
            state.persist();
            screens.showMenu();
        });
    });

    game.events.once('boot-complete', () => {
        music.init();
        music.playMenu();
        screens.showMenu();
    });

    Object.defineProperty(window, 'toggleGecoMode', {
        value: (code: string) => {
            if (code === 'gecowave-flux-resonance-992173') {
                state.godMode = !state.godMode;
                console.log(`%c[GECOWAVE] invincibility: ${state.godMode ? 'ENABLED' : 'DISABLED'}`, 'color: #4ade80; font-weight: bold;');
                return state.godMode ? 'godmode on' : 'godmode off';
            }
            return 'access denied';
        },
        writable: false,
        configurable: false
    });
}

void boot();
