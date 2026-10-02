import Phaser from 'phaser';
// font bundlati localmente: l'eseguibile funziona anche offline
import '@fontsource/climate-crisis/400.css';
import '@fontsource/permanent-marker/400.css';
import '@fontsource/martian-mono/400.css';
import '@fontsource/martian-mono/700.css';
import './style.css';
import { PHYSICS } from './config';
import { FIRST_LEVEL, LEVELS, TOTAL_FRAGMENTS } from './content/levels';
import { endingCards, INTRO_CARDS } from './content/story';
import { bus } from './engine/events';
import { sfx } from './engine/sfx';
import { state } from './engine/state';
import { music } from './engine/music';
import { checkAchievements } from './engine/achievements';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { GalleryScene } from './scenes/GalleryScene';
import { DialogueBox } from './ui/dialogue';
import { Phone } from './ui/phone';
import { Hud } from './ui/hud';
import { Screens, type GameController } from './ui/screens';
import { ui } from './ui/dom';

async function boot(): Promise<void> {
    // i font devono esserci prima che il canvas li usi
    await document.fonts.ready;

    const screens = new Screens();
    const hud = new Hud();
    const dialogue = new DialogueBox();
    ui().append(hud.root);
    // vero solo mentre un capitolo è in corso: il telefono non esce dai menu
    let inGame = false;

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
        scene: [BootScene, GameScene, GalleryScene],
    });

    // handle di debug in sviluppo, mai nel build
    if (import.meta.env.DEV) Object.assign(window, { __game: game, __bus: bus, __state: state, __music: music });

    const startLevel = (levelId: string, checkpointId: string | null, showCard = true): void => {
        inGame = true;
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
            inGame = false;
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

    const phone = new Phone({
        pause: () => controller.pause(),
        resume: () => controller.resume(),
        canOpen: () => inGame && !screens.overlayOpen && !dialogue.open && game.scene.isActive('GameScene'),
    });
    hud.root.append(phone.hintElement);

    bus.on('ending', ({ id, score, rank }) => {
        inGame = false;
        state.setFlag(`finale-${id}`);
        checkAchievements();
        if (phone.isOpen) phone.close();
        sfx.stopPad();
        music.playEnding();
        hud.hide();
        game.scene.stop('GameScene');
        // il render loop di phaser continua a girare: nascondo il canvas trasparente
        // sotto i titoli di coda, altrimenti la compositing race lo fa flickerare
        const gameEl = document.getElementById('game')!;
        gameEl.style.display = 'none';
        const cards = endingCards(id, state.save.flags);
        // pedro (patto) e sconfitta (sfida agli dei persa) sono game over definitivi
        const lose = id === 'pedro' || id === 'sconfitta';
        const title =
            id === 'riscatto' ? 'STORTO NON VUOL DIRE ROTTO'
            : id === 'consegna' ? 'HAI SALVATO IL GECOREALM'
            : id === 'dei' ? 'ORA IL GECOREALM È TUO'
            : id === 'pedro' ? 'GLI DEI TI HANNO RAGGIUNTO'
            : 'IL REALM CONTINUA. TU NO.';
        screens.endingSequence(cards, { outcome: lose ? 'lose' : 'win', title, score, rank }, () => {
            if (lose) {
                // hai perso: il salvataggio viene cancellato, si riparte da zero
                state.reset();
            } else {
                state.save.endingSeen = id;
                // ng+: si riparte dall'inizio con tutte le wave, ma boss e agguati tornano
                state.save.levelId = FIRST_LEVEL;
                // il ng+ è un'altra partita: il punteggio riparte da zero
                state.save.runScores = {};
                state.save.checkpointId = null;
                state.save.flags = state.save.flags.filter((f) => !f.startsWith('boss-down-') && !f.startsWith('agguato-'));
                state.persist();
            }
            gameEl.style.display = '';
            music.playMenu();
            screens.showMenu();
        });
    });

    game.events.once('boot-complete', () => {
        music.init();
        // scorciatoia di sviluppo: ?level=id salta menu e intro
        const devLevel = import.meta.env.DEV ? new URLSearchParams(location.search).get('level') : null;
        if (import.meta.env.DEV && new URLSearchParams(location.search).has('gallery')) {
            game.scene.start('GalleryScene');
        } else if (devLevel && LEVELS[devLevel]) {
            startLevel(devLevel, null, false);
        } else {
            music.playMenu();
            screens.showMenu();
        }
        // il menu è pronto: spengo il loader e lo rimuovo a fine transizione
        const loader = document.getElementById('boot-loader');
        if (loader) {
            loader.classList.add('hide');
            loader.addEventListener('transitionend', () => loader.remove(), { once: true });
        }
    });

    Object.defineProperty(window, 'toggleGecoMode', {
        value: (code: string) => {
            if (code === 'gecowave-flux-resonance-992173') {
                state.godMode = !state.godMode;
                console.log(`%c[GECOWAVE] invincibility: ${state.godMode ? 'ENABLED' : 'DISABLED'}`, 'color: #4ade80; font-weight: bold;');
                bus.emit('abilities-changed', { abilities: state.abilities });
                bus.emit('fragments-changed', { count: state.abilities.length, total: TOTAL_FRAGMENTS });
                if (screens.isMenuOpen) {
                    screens.showMenu();
                }
                return state.godMode ? 'godmode on' : 'godmode off';
            }
            return 'access denied';
        },
        writable: false,
        configurable: false
    });
}

void boot();
