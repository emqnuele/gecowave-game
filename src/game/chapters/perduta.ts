import { WAVESUNG } from '../../content/story';
import { state } from '../../engine/state';
import { Chapter, type Target } from './ChapterScript';
import { waveOnce } from './shared/wave';

/** il primo capitolo: markolino regala la scivolata */
export class PerdutaChapter extends Chapter {
    setup(): void {
        waveOnce(this.scene, 'pedro-eco-perduta', WAVESUNG.pedroEcoPerduta, 6000);
        waveOnce(this.scene, 'tease-maschere-perduta', WAVESUNG.markolinoMaschereTease, 45000);
        // chi ha già sentito il dono (anche prima di questa fix) ma non ha la wave:
        // il frammento lo aspetta da markolino, non va perso per strada
        if (state.hasFlag('markolino-dono-visto') && !state.hasAbility('scivolata')
            && !this.ctx.rewards.hasLiveFragment('scivolata')) {
            const dono = this.ctx.npcs.at.get('markolino-dono');
            if (dono) this.ctx.rewards.spawnFragment(dono.x, dono.y - 50, 'scivolata');
        }
    }

    interact(id: string): boolean {
        if (id !== 'markolino-dono') return false;
        this.ctx.dialogues.start(id, () => {
            state.setFlag('markolino-dono-visto');
            // il frammento promesso ("prendilo") cade accanto a lui: senza questo
            // il dialogo lasciava il player a mani vuote e l'unica scivolata
            // restava il pickup libero a ~30 tile di distanza
            if (!state.hasAbility('scivolata') && !this.ctx.rewards.hasLiveFragment('scivolata')) {
                const dono = this.ctx.npcs.at.get('markolino-dono');
                if (dono) this.ctx.rewards.spawnFragment(dono.x, dono.y - 50, 'scivolata');
            }
        });
        return true;
    }

    /** prima lui, poi il frammento, poi l'uscita */
    urgentObjective(): Target | null {
        if (state.hasAbility('scivolata')) return null;
        const dono = this.ctx.npcs.at.get('markolino-dono');
        if (dono && !state.hasFlag('markolino-dono-visto')) return { ...dono, label: 'markolino' };
        return null;
    }
}
