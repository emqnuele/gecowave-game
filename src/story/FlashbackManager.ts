import Phaser from 'phaser';
import { FLASHBACKS } from '../content/flashbacks';
import { FILMS } from '../content/films';
import { sfx } from '../audio/sfx';
import { softFail } from '../core/softFail';
import { state } from '../core/state';
import { music } from '../audio/music';
import { acoustics } from '../audio/acoustics';
import { VortexPipeline, hexToTint } from '../art/fx/VortexPipeline';
import type { FilmData } from './film/FilmScene';

// il mondo si ferma come sotto un dialogo: il film gira in una scena sua e alla fine si riparte da dov'era

const ENTER = 2600;
const EXIT = 1800;

export class FlashbackManager {
    private playing = false;

    get isPlaying(): boolean {
        return this.playing;
    }

    play(scene: Phaser.Scene, _player: Phaser.GameObjects.Sprite, id: string, onEnd?: () => void, opts?: { markSeen?: boolean }): void {
        const fb = FLASHBACKS[id];
        if (!fb || !FILMS[id] || this.playing) {
            onEnd?.();
            return;
        }
        this.playing = true;
        const seen = state.save.seenDialogues.includes(`fb-${id}`);
        acoustics.resume();
        music.setGraveDuck(true);
        document.body.classList.add('film');
        const cam = scene.cameras.main;
        const key = scene.scene.key;
        const zoomFrom = cam.zoom;
        let vortex = this.vortex(scene, fb.tint, 0, 1, ENTER);
        cam.shake(ENTER * 0.6, 0.004);
        cam.zoomTo(zoomFrom * 1.5, ENTER, 'Quad.easeIn');
        cam.rotateTo(0.2, false, ENTER, 'Quad.easeIn');
        sfx.death('eco');
        sfx.rumble();
        scene.time.delayedCall(ENTER - 300, () => cam.fadeOut(300, 0, 0, 0));
        // la scena se ne va a metà ingresso (uscita al menu): niente film appeso
        const onShutdown = (): void => {
            this.playing = false;
            music.setGraveDuck(false);
            document.body.classList.remove('film');
            if (scene.game.scene.isActive('FilmScene')) scene.game.scene.stop('FilmScene');
        };
        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, onShutdown);

        scene.time.delayedCall(ENTER, () => {
            if (vortex) cam.removePostPipeline(vortex);
            vortex = null;
            cam.zoomEffect.reset();
            cam.rotateToEffect.reset();
            cam.setZoom(zoomFrom);
            cam.setRotation(0);
            // il mondo si ferma come sotto un dialogo: niente geco nascosto, niente invincibilità
            scene.game.scene.pause(key);
            const data: FilmData = { id, quick: seen, onEnd: () => back() };
            scene.game.scene.run('FilmScene', data);
        });

        const back = (): void => {
            scene.events.off(Phaser.Scenes.Events.SHUTDOWN, onShutdown);
            scene.game.scene.resume(key);
            music.setGraveDuck(false);
            document.body.classList.remove('film');
            const out = this.vortex(scene, fb.tint, 0.5, 0, EXIT);
            cam.fadeIn(EXIT, 0, 0, 0);
            sfx.death('tecnodrone');
            scene.time.delayedCall(EXIT, () => {
                if (out) cam.removePostPipeline(out);
                this.playing = false;
                onEnd?.();
            });
        };

        if (!seen && opts?.markSeen !== false) {
            state.save.seenDialogues.push(`fb-${id}`);
            state.persist();
        }
    }

    // senza webgl niente vortice: basta il nero della dissolvenza
    private vortex(scene: Phaser.Scene, tint: number, from: number, to: number, ms: number): VortexPipeline | null {
        const pipelines = (scene.renderer as Phaser.Renderer.WebGL.WebGLRenderer).pipelines;
        if (!pipelines) return null;
        try {
            pipelines.addPostPipeline('VortexPipeline', VortexPipeline);
            const cam = scene.cameras.main;
            cam.setPostPipeline(VortexPipeline);
            const got = cam.getPostPipeline(VortexPipeline) as unknown;
            const pipe = (Array.isArray(got) ? got[got.length - 1] : got) as VortexPipeline | undefined;
            if (!pipe) return null;
            pipe.tint = hexToTint(tint);
            pipe.progress = from;
            const proxy = { p: from };
            scene.tweens.add({
                targets: proxy, p: to, duration: ms, ease: to > from ? 'Quad.easeIn' : 'Quad.easeOut',
                onUpdate: () => { pipe.progress = proxy.p; },
            });
            return pipe;
        } catch (e) {
            softFail('film', e);
            return null;
        }
    }
}

export const flashback = new FlashbackManager();
