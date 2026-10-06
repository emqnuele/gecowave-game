import { state } from './state';
import { bus } from './events';
import { acoustics } from './audio/acoustics';

const MUSIC_VOLUME_MULT = 0.06;

class MusicManager {
    private currentAudio: HTMLAudioElement | null = null;
    private currentPath: string | null = null;
    private fadeInterval: ReturnType<typeof setInterval> | null = null;
    private unlockListener: (() => void) | null = null;
    /** true durante una battuta grave: la musica resta sotto i dialoghi seri */
    private graveDuck = false;
    /** true per tutto un capitolo cupo: la musica resta bassa (vedi Tana) */
    private levelDuck = false;
    init(): void {
        bus.on('boss-hp', (payload) => {
            if (payload) {
                this.playBoss(payload.name);
            } else {
                this.playLevel(state.save.levelId);
            }
        });
    }

    /** 0 giorno, 1 notte fonda: di notte la musica si fa ovattata */
    setNight(n: number): void {
        const v = Math.max(0, Math.min(1, n));
        if (Math.abs(v - acoustics.current.night) < 0.02) return;
        acoustics.set({ night: v });
    }

    /** collega l'elemento alla catena acustica; se il browser non lo permette la musica suona lo stesso, asciutta */
    private route(audio: HTMLAudioElement): void {
        try {
            const ctx = acoustics.context();
            if (!ctx || !acoustics.musicIn) return;
            ctx.createMediaElementSource(audio).connect(acoustics.musicIn);
        } catch {
            // niente webaudio: si resta sull'uscita normale dell'elemento
        }
    }

    /** nastro che rallenta: la musica scende di tono e si spegne (morte, collasso) */
    tapeStop(ms = 1400): void {
        const a = this.currentAudio;
        if (!a) return;
        const t0 = performance.now();
        (a as HTMLAudioElement & { preservesPitch?: boolean }).preservesPitch = false;
        const tick = () => {
            if (this.currentAudio !== a) return;
            const k = Math.min(1, (performance.now() - t0) / ms);
            a.playbackRate = Math.max(0.35, 1 - 0.65 * k * k);
            if (k < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }

    /** di nuovo a velocità normale, col tono giusto */
    private normalRate(a: HTMLAudioElement): void {
        a.playbackRate = 1;
        (a as HTMLAudioElement & { preservesPitch?: boolean }).preservesPitch = true;
    }

    setVolume(vol: number): void {
        if (this.currentAudio) {
            this.currentAudio.volume = vol * MUSIC_VOLUME_MULT * this.duckFactor();
        }
    }

    /** abbassa/alza la musica sotto le battute gravi (vedi DialogueBox) */
    setGraveDuck(on: boolean): void {
        this.graveDuck = on;
        if (this.currentAudio) {
            this.currentAudio.volume = state.settings.volume * MUSIC_VOLUME_MULT * this.duckFactor();
        }
    }

    /** abbassa/alza la musica per tutto un capitolo */
    setLevelDuck(on: boolean): void {
        this.levelDuck = on;
        if (this.currentAudio) {
            this.currentAudio.volume = state.settings.volume * MUSIC_VOLUME_MULT * this.duckFactor();
        }
    }

    /** l'ordine raddrizza anche il suono: passa-basso graduale sullo stesso grafo */
    setOrder(amount: 0 | 1 | 2 | 3): void {
        acoustics.set({ order: amount });
    }

    /** 0.3 sotto le gravi, 0.55 nel capitolo cupo: si moltiplicano */
    private duckFactor(): number {
        return (this.graveDuck ? 0.3 : 1) * (this.levelDuck ? 0.55 : 1);
    }

    playMenu(): void {
        this.transitionTo("assets/music/Until Here's OST.mp3");
    }

    playEnding(): void {
        this.transitionTo('assets/music/End Credits – Flux of coscienza.mp3', false);
    }

    playLevel(levelId: string): void {
        // la radio del telefono vince sulla traccia del capitolo, non sui boss
        this.transitionTo(state.save.radio ? `assets/music/${state.save.radio}` : this.getLevelTrack(levelId));
    }

    /** sintonizza la radio su un file della colonna sonora, null = musica del capitolo */
    setRadio(file: string | null): void {
        state.save.radio = file;
        state.persist();
        this.playLevel(state.save.levelId);
    }

    get nowPlaying(): string | null {
        return this.currentPath;
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
            case 'piazza':
                return "assets/music/Until Here's OST.mp3";
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
            if (this.currentAudio) this.normalRate(this.currentAudio);
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
        this.route(newAudio);

        const playPromise = newAudio.play();
        if (playPromise !== undefined) {
            // browser security blocks autoplay before user gestures
            playPromise.catch(() => {
                this.unlockListener = () => {
                    acoustics.resume();
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
            newAudio.volume = state.settings.volume * MUSIC_VOLUME_MULT * this.duckFactor() * progress;

            if (currentStep >= steps) {
                if (this.fadeInterval) {
                    clearInterval(this.fadeInterval);
                    this.fadeInterval = null;
                }
                if (oldAudio) {
                    oldAudio.pause();
                    oldAudio.remove();
                }
                newAudio.volume = state.settings.volume * MUSIC_VOLUME_MULT * this.duckFactor();
            }
        }, stepTime);
    }
}

export const music = new MusicManager();
