import { state } from './state';
import { bus } from './events';

const MUSIC_VOLUME_MULT = 0.06;

class MusicManager {
    private currentAudio: HTMLAudioElement | null = null;
    private currentPath: string | null = null;
    private fadeInterval: ReturnType<typeof setInterval> | null = null;
    private unlockListener: (() => void) | null = null;

    init(): void {
        bus.on('boss-hp', (payload) => {
            if (payload) {
                this.playBoss(payload.name);
            } else {
                this.playLevel(state.save.levelId);
            }
        });
    }

    setVolume(vol: number): void {
        if (this.currentAudio) {
            this.currentAudio.volume = vol * MUSIC_VOLUME_MULT;
        }
    }

    playMenu(): void {
        this.transitionTo("assets/music/Until Here's OST.mp3");
    }

    playEnding(): void {
        this.transitionTo('assets/music/End Credits – Flux of coscienza.mp3', false);
    }

    playLevel(levelId: string): void {
        this.transitionTo(this.getLevelTrack(levelId));
    }

    playBoss(bossName: string): void {
        this.transitionTo(this.getBossTrack(bossName));
    }

    playCustom(path: string): void {
        this.transitionTo(path);
    }

    private getLevelTrack(levelId: string): string {
        switch (levelId) {
            case 'perduta':
                return 'assets/music/GECOWAVE.mp3';
            case 'bus':
                return "assets/music/Ivan Maggini's OST 1.mp3";
            case 'galliate':
                return 'assets/music/Altra #4 (Novara).mp3';
            case 'marcetti':
                return 'assets/music/Altra #2 (Querela).mp3';
            case 'santuario':
                return "assets/music/Lametta MC's OST 1.mp3";
            case 'tecnokill':
                return "assets/music/Notino's OST.mp3";
            case 'trenbolone':
                return 'assets/music/Altra #1.mp3';
            case 'tana':
                return "assets/music/lochef85's OST 1.mp3";
            case 'rio':
                return 'assets/music/Tommasorveglianza.mp3';
            case 'stabilimento':
                return "assets/music/Ivan Maggini's OST 2.mp3";
            case 'ruhra':
                return "assets/music/Piema's OST 1.mp3";
            case 'mente':
                return "assets/music/Piema's OST 2.mp3";
            case 'caso':
                return 'assets/music/Fragment Time.mp3';
            case 'sorveglianza':
                return 'assets/music/Destornillador-2.mp3';
            case 'cantina':
                return "assets/music/Lametta MC's OST 2.mp3";
            case 'ricordi':
                return 'assets/music/Altra #3 (Nostalgica).mp3';
            case 'void':
                return 'assets/music/Frammenti Infranti.mp3';
            case 'nucleo':
                return "assets/music/lochef85's OST 2.mp3";
            case 'barrato':
                return "assets/music/Ivan Maggini's OST 1.mp3";
            case 'custode':
                return 'assets/music/GECOWAVE.mp3';
            default:
                return 'assets/music/GECOWAVE.mp3';
        }
    }

    private getBossTrack(bossName: string): string {
        const name = bossName.toLowerCase();
        // finale: la sfida agli dei, 'piema & lametta'
        if (name.includes('piema') && name.includes('lametta')) {
            return 'assets/music/Final Boss Fight (Piema & Lametta MC).mp3';
        }
        // pedro traditore: check prima di pedrino, che contiene anch'esso 'pedro'
        if (name.includes('traditore')) {
            return 'assets/music/Pedro Tetraedro.mp3';
        }
        // pedrino: il ricordo nostalgico di pedro
        if (name.includes('pedro') || name.includes('ricordo')) {
            return 'assets/music/Altra #3 (Nostalgica).mp3';
        }
        if (name.includes('guggu')) {
            return "assets/music/Ivan Maggini's OST 1.mp3";
        }
        if (name.includes('breccio')) {
            return "assets/music/Lametta MC's OST 1.mp3";
        }
        if (name.includes('notino')) {
            return "assets/music/Notino's OST.mp3";
        }
        if (name.includes('riba')) {
            return "assets/music/Piema's OST 1.mp3";
        }
        // arco consegne: danjilo, smela, il furgone
        if (name.includes('furgone') || name.includes('smela') || name.includes('danjilo')) {
            return "assets/music/Ivan Maggini's OST 2.mp3";
        }
        if (name.includes('lochef') || name.includes('7:40') || name.includes('settequaranta')) {
            return "assets/music/lochef85's OST 2.mp3";
        }
        if (name.includes('limite')) {
            return 'assets/music/Fragment Time.mp3';
        }
        if (name.includes('ombra') || name.includes('33') || name.includes('trentatre')) {
            return 'assets/music/Destornillador-2.mp3';
        }
        if (name.includes('ticummi')) {
            return 'assets/music/Frammenti Infranti.mp3';
        }
        if (name.includes('formicona')) {
            return 'assets/music/Tommasorveglianza.mp3';
        }
        if (name.includes('teorema')) {
            return "assets/music/Piema's OST 2.mp3";
        }
        if (name.includes('flauto')) {
            return 'assets/music/Altra #1.mp3';
        }
        // rimpianti del void
        if (name.includes('delegato') || name.includes('notturno') || name.includes('modello') || name.includes('revisore') || name.includes('garante')) {
            return 'assets/music/Frammenti Infranti.mp3';
        }
        // arco autoscuole: maranza, istruttore, anna, walter
        if (name.includes('maranza') || name.includes('istruttore') || name.includes('anna') || name.includes('walter')) {
            return 'assets/music/Altra #2 (Querela).mp3';
        }
        if (name.includes('custode')) {
            return 'assets/music/GECOWAVE.mp3';
        }
        // arena speciale di lametta (lametta-arena)
        if (name.includes('lametta')) {
            return "assets/music/Lametta MC's OST 2.mp3";
        }
        return 'assets/music/GECOWAVE.mp3';
    }

    private transitionTo(path: string, loop = true): void {
        if (this.currentPath === path) {
            if (this.currentAudio && this.currentAudio.paused) {
                this.currentAudio.play().catch(() => {});
            }
            return;
        }
        this.currentPath = path;

        if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
            this.fadeInterval = null;
        }

        if (this.unlockListener) {
            window.removeEventListener('click', this.unlockListener);
            window.removeEventListener('keydown', this.unlockListener);
            this.unlockListener = null;
        }

        const oldAudio = this.currentAudio;
        // encodeURI non codifica '#': i nomi file con '#' verrebbero letti come fragment
        const encodedPath = path.split('/').map(encodeURIComponent).join('/');
        // use html5 audio to stream large files without decoding delay
        const newAudio = new Audio(encodedPath);
        newAudio.loop = loop;
        newAudio.volume = 0;

        const playPromise = newAudio.play();
        if (playPromise !== undefined) {
            // browser security blocks autoplay before user gestures
            playPromise.catch(() => {
                this.unlockListener = () => {
                    newAudio.play().catch(() => {});
                    if (this.unlockListener) {
                        window.removeEventListener('click', this.unlockListener);
                        window.removeEventListener('keydown', this.unlockListener);
                        this.unlockListener = null;
                    }
                };
                window.addEventListener('click', this.unlockListener);
                window.addEventListener('keydown', this.unlockListener);
            });
        }

        this.currentAudio = newAudio;

        const fadeDuration = 800;
        const steps = 16;
        const stepTime = fadeDuration / steps;
        let currentStep = 0;

        const startVol = oldAudio ? oldAudio.volume : 0;

        this.fadeInterval = setInterval(() => {
            currentStep++;
            const progress = currentStep / steps;

            if (oldAudio) {
                oldAudio.volume = Math.max(0, startVol * (1 - progress));
            }
            newAudio.volume = state.settings.volume * MUSIC_VOLUME_MULT * progress;

            if (currentStep >= steps) {
                if (this.fadeInterval) {
                    clearInterval(this.fadeInterval);
                    this.fadeInterval = null;
                }
                if (oldAudio) {
                    oldAudio.pause();
                    oldAudio.remove();
                }
                newAudio.volume = state.settings.volume * MUSIC_VOLUME_MULT;
            }
        }, stepTime);
    }
}

export const music = new MusicManager();
