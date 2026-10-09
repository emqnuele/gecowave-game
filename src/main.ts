import Phaser from 'phaser';
// font bundlati localmente: l'eseguibile funziona anche offline
import '@fontsource/climate-crisis/400.css';
import '@fontsource/permanent-marker/400.css';
import '@fontsource/martian-mono/400.css';
import '@fontsource/martian-mono/700.css';
import '@fontsource/im-fell-english-sc/400.css';
import '@fontsource/im-fell-english/400-italic.css';
import './style.css';
import { PHYSICS } from './config';
import { FIRST_LEVEL, LEVELS, TOTAL_FRAGMENTS } from './content/levels';
import { endingCards, endingEpilogues, INTRO_CARDS } from './content/story';
import { bus } from './core/events';
import { sfx } from './audio/sfx';
import { state } from './core/state';
import { music } from './audio/music';
import { acoustics } from './audio/acoustics';
import { checkAchievements } from './core/achievements';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { GalleryScene } from './scenes/GalleryScene';
import { FilmScene } from './story/film/FilmScene';
import { MenuScene } from './scenes/MenuScene';
import { DialogueBox } from './ui/dialogue';
import { Subtitles } from './ui/subtitles';
import { Phone } from './ui/phone';
import { startPadBridge } from './input/padBridge';
import { initChapterSummary, isChapterSummaryOpen } from './ui/chapterSummary';
import { initFinalSummary, isFinalSummaryOpen } from './ui/finalSummary';
import { Hud } from './ui/hud';
import { Screens, type GameController } from './ui/screens';
import { ui } from './ui/dom';
import { installDevHandles, installLevelHook } from './dev/hooks';
import { coop } from './coop/runtime';
import { coopHooks } from './coop/hooks';
import { CoopScreens } from './ui/coopScreens';

async function boot(): Promise<void> {
    // i font devono esserci prima che il canvas li usi
    await document.fonts.ready;

    const screens = new Screens();
    const hud = new Hud();
    const dialogue = new DialogueBox();
    ui().append(hud.root);
    new Subtitles();
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
            // hint al browser: il gioco vuole la GPU vera, non il risparmio energetico
            powerPreference: 'high-performance',
        },
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { x: 0, y: PHYSICS.gravity },
                // tile da 160px scalate 0.2: serve un bias alto contro il tunneling
                tileBias: 48,
            },
        },
        input: { gamepad: true },
        scene: [BootScene, GameScene, GalleryScene, MenuScene, FilmScene],
    });

    if (import.meta.env.DEV) installDevHandles(game);
    // chiusura a sorpresa: meglio un write in più che due secondi persi
    window.addEventListener('beforeunload', () => state.flushPersist(true));

    // il falò del titolo: vive solo mentre il menu è aperto
    // livello garantito (bus) e scena sempre fresca: il menu non resta mai nero
    screens.setBackdrop((on) => {
        if (on) {
            const gameEl = document.getElementById('game')!;
            gameEl.style.display = '';
            const wanted = state.hasSave ? state.save.levelId : undefined;
            const levelId = wanted && LEVELS[wanted] ? wanted : 'bus';
            if (game.scene.isActive('MenuScene')) game.scene.stop('MenuScene');
            game.scene.start('MenuScene', { levelId });
        } else if (game.scene.isActive('MenuScene')) {
            game.scene.stop('MenuScene');
        }
    });

    const startLevel = (levelId: string, checkpointId: string | null, showCard = true, spawnAt?: { x: number; y: number }): void => {
        state.flushPersist(true);
        game.scene.stop('MenuScene');
        inGame = true;
        sfx.init();
        music.playLevel(levelId);
        state.resetRun();
        hud.show();
        const scene = game.scene.getScene('GameScene');
        const data = spawnAt ? { levelId, checkpointId, showCard, spawnAt } : { levelId, checkpointId, showCard };
        if (game.scene.isActive('GameScene') || game.scene.isPaused('GameScene')) {
            scene.scene.restart(data);
            game.scene.resume('GameScene');
        } else {
            game.scene.start('GameScene', data);
        }
    };
    if (import.meta.env.DEV) {
        installLevelHook((levelId, checkpointId) => {
            screens.closeOverlay();
            startLevel(levelId, checkpointId, false);
        });
    }

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
            state.flushPersist(true);
            // in due il mondo non si ferma per il telefono o la pausa: si ferma il mio geco
            if (coop.active && inGame) {
                coopHooks.frozen = true;
                coopHooks.menuOpen = true;
                return;
            }
            game.scene.pause('GameScene');
            acoustics.setPaused(true);
        },
        resume() {
            if (coop.active && inGame) {
                coopHooks.frozen = false;
                coopHooks.menuOpen = false;
                return;
            }
            game.scene.resume('GameScene');
            acoustics.setPaused(false);
        },
        quitToMenu() {
            inGame = false;
            state.flushPersist(true);
            sfx.stopBeds();
            acoustics.reset();
            game.scene.stop('GameScene');
            hud.hide();
            // uscire dalla partita in due la chiude per chi ospita, e libera chi è ospite
            if (coop.active || state.saveSlot !== 'single') {
                coop.end(null, false);
                state.useSlot('single');
            }
            screens.showMenu();
            music.playMenu();
        },
        travel(levelId: string) {
            state.flushPersist(true);
            screens.closeOverlay();
            startLevel(levelId, null);
        },
    };
    screens.bind(controller);

    /* ---------- la partita in due ---------- */
    // l'intro della partita nuova la vedono tutti e due: chi finisce prima aspetta il capitolo
    let introBusy = false;
    let pendingCoopLevel: (() => void) | null = null;
    const coopUi = new CoopScreens(screens, {
        startHosted(fresh) {
            if (fresh) {
                if (coop.together) coop.session?.send('intro', {});
                introBusy = true;
                screens.storySequence(INTRO_CARDS, () => {
                    introBusy = false;
                    startLevel(FIRST_LEVEL, null);
                });
                return;
            }
            screens.closeOverlay();
            startLevel(state.save.levelId, state.save.checkpointId);
        },
        backToTitle() {
            coop.end(null, false);
            state.useSlot('single');
            screens.showMenu();
        },
    });
    screens.coopEntry = () => coopUi.show();
    screens.choiceRouter = (p) => coopHooks.choice?.(p) ?? false;
    screens.pauseExtras = () => {
        if (!coop.active) return null;
        const name = coopHooks.partnerName?.();
        const items = name && coopHooks.joinPartner
            ? [{ label: `raggiungi ${name}`, sub: 'se ti sei perso o sei rimasto bloccato', onPick: () => { screens.closeOverlay(); controller.resume(); coopHooks.joinPartner?.(); } }]
            : [];
        const who = coop.isHost ? 'uscire chiude la partita anche per l’altro.' : 'uscire ti riporta al menu: la partita resta all’host.';
        return { items, note: `in due il mondo non aspetta: il tuo geco sì. ${who}` };
    };
    if (import.meta.env.DEV) Object.assign(window, { __coop: coop });
    coop.app = {
        startLevel(levelId, checkpointId, showCard, spawnAt) {
            const go = () => {
                screens.closeOverlay();
                startLevel(levelId, checkpointId, showCard, spawnAt);
            };
            if (introBusy) pendingCoopLevel = go;
            else go();
        },
        toMenu(reason) {
            const wasInGame = inGame;
            inGame = false;
            pendingCoopLevel = null;
            state.flushPersist(true);
            if (wasInGame) {
                sfx.stopBeds();
                acoustics.reset();
                game.scene.stop('GameScene');
                hud.hide();
                music.playMenu();
            }
            state.useSlot('single');
            coopUi.show(reason ?? undefined);
        },
        playIntro(done) {
            introBusy = true;
            screens.storySequence(INTRO_CARDS, () => {
                introBusy = false;
                done();
                const next = pendingCoopLevel;
                pendingCoopLevel = null;
                next?.();
            });
        },
        inLevel: () => inGame,
    };

    const phone = new Phone({
        pause: () => controller.pause(),
        resume: () => controller.resume(),
        canOpen: () => inGame && !screens.overlayOpen && !dialogue.open && !isChapterSummaryOpen() && !isFinalSummaryOpen() && game.scene.isActive('GameScene'),
        snapshot: () => new Promise<string | null>((resolve) => {
            const done = (v: string | null) => resolve(v);
            try {
                const r = game.renderer as unknown as { snapshot?: (cb: (img: HTMLImageElement) => void) => void };
                if (typeof r.snapshot !== 'function') {
                    done(null);
                    return;
                }
                const timer = window.setTimeout(() => done(null), 3000);
                r.snapshot((img) => {
                    window.clearTimeout(timer);
                    done(img && img.src ? img.src : null);
                });
            } catch {
                done(null);
            }
        }),
    });
    hud.root.append(phone.hintElement);
    initChapterSummary();
    initFinalSummary();
    // il pad nei menu imita la tastiera, in gioco lo legge il livello input
    startPadBridge(() => screens.overlayOpen || phone.isOpen || dialogue.open || isChapterSummaryOpen() || isFinalSummaryOpen());

    bus.on('ending', ({ id, score, rank }) => {
        inGame = false;
        // in due i titoli li vedono tutti e due, e la partita insieme finisce qui
        if (coop.active) coop.inEnding = true;
        state.flushPersist(true);
        state.setFlag(`finale-${id}`);
        checkAchievements();
        if (phone.isOpen) phone.close();
        sfx.stopBeds();
        acoustics.reset();
        music.playEnding();
        hud.hide();
        game.scene.stop('GameScene');
        // il render loop di phaser continua a girare: nascondo il canvas trasparente
        // sotto i titoli di coda, altrimenti la compositing race lo fa flickerare.
        // visibility e non display: il contenitore tiene la misura e il canvas non collassa a zero
        const gameEl = document.getElementById('game')!;
        gameEl.style.visibility = 'hidden';
        const cards = endingCards(id, state.save.flags);
        const epilogues = endingEpilogues(id, state.save.flags);
        // pedro (patto) e sconfitta (sfida agli dei persa) sono game over definitivi
        const lose = id === 'pedro' || id === 'sconfitta';
        const title =
            id === 'riscatto' ? 'STORTO NON VUOL DIRE ROTTO'
            : id === 'consegna' ? 'HAI SALVATO IL GECOREALM'
            : id === 'dei' ? 'ORA IL GECOREALM È TUO'
            : id === 'pedro' ? 'GLI DEI TI HANNO RAGGIUNTO'
            : 'IL REALM CONTINUA. TU NO.';
        screens.endingSequence(cards, { outcome: lose ? 'lose' : 'win', title, score, rank, epilogues }, () => {
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
            gameEl.style.visibility = 'visible';
            game.scale.refresh();
            music.playMenu();
            if (coop.active || state.saveSlot !== 'single') {
                coop.inEnding = false;
                coop.end(null, false);
                state.useSlot('single');
            }
            screens.showMenu();
        });
    });

    game.events.once('boot-complete', () => {
        music.init();
        // scorciatoia di sviluppo: ?level=id salta menu e intro
        const devLevel = import.meta.env.DEV ? new URLSearchParams(location.search).get('level') : null;
        if (import.meta.env.DEV && (new URLSearchParams(location.search).has('gallery') || new URLSearchParams(location.search).has('flashback'))) {
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
