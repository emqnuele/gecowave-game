import { sfx } from '../audio/sfx';
import { state } from '../core/state';
import { el } from './dom';

/* l'interruttore della freccia guida, uguale ovunque: accenderla durante una
   partita la rende assistita fino alla fine, quindi si chiede conferma */

export function assistToggle(opts: { rowClass: string; newGame?: boolean }): HTMLElement {
    const row = el('div', `${opts.rowClass} assist-row`);
    const words = el('div', 'assist-words');
    const name = el('span', 'name');
    name.textContent = 'freccia guida (modalità assistita)';
    const note = el('span', 'assist-note');
    words.append(name, note);
    const t = el('button', 'toggle sticker');
    let confirming = false;
    const inRun = () => !opts.newGame && state.hasSave;
    const paint = () => {
        const on = state.settings.guide;
        t.classList.toggle('on', on);
        t.setAttribute('aria-pressed', String(on));
        t.textContent = confirming ? 'sicuro?' : on ? 'accesa' : 'spenta';
        note.textContent = confirming
            ? 'vale per tutta la partita: niente trofei e niente punteggio fino alla fine, anche se poi la spegni. premi di nuovo per accenderla.'
            : inRun() && state.save.assisted
              ? 'questa partita è assistita: trofei e punteggio restano spenti fino alla fine, anche con la freccia spenta.'
              : 'una freccia ti indica il prossimo varco. accenderla rende la partita assistita fino alla fine: niente trofei e niente punteggio.';
    };
    paint();
    t.addEventListener('click', () => {
        sfx.ui();
        if (!state.settings.guide && inRun() && !state.save.assisted && !confirming) {
            confirming = true;
            paint();
            return;
        }
        confirming = false;
        state.settings.guide = !state.settings.guide;
        if (state.settings.guide && inRun()) {
            state.save.assisted = true;
            state.persist();
        }
        state.persistSettings();
        paint();
    });
    row.append(words, t);
    return row;
}
