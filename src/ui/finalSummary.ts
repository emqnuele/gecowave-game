import { ZONE_CSS } from '../config';
import { bus } from '../core/events';
import { sfx } from '../audio/sfx';
import type { FinalSummary } from '../core/ChapterCompletion';
import { Cine, fmt, heartIcon, isCinematicOpen } from './cine';
import { el } from './dom';

/* il riepilogo di fine gioco: stesso palco del capitolo, un piano sopra.
   mappa, cuori e segreti di tutta la run, il conto e il numero finale */

export function isFinalSummaryOpen(): boolean {
    return isCinematicOpen();
}

export function initFinalSummary(): void {
    bus.on('final-summary-show', ({ summary, onContinue }) => {
        const cine = Cine.open(ZONE_CSS[summary.color] ?? '#4ade80');
        if (!cine) {
            onContinue();
            return;
        }
        try {
            showFinal(cine, summary, onContinue);
        } catch (e) {
            // mai bloccare i titoli di coda per un overlay rotto
            if (import.meta.env.DEV) console.warn('riepilogo finale fallito:', e);
            cine.cleanup();
            onContinue();
        }
    });
}

function showFinal(cine: Cine, summary: FinalSummary, onContinue: () => void): void {
    const reduced = cine.reduced;

    // atto primo: il titolo enorme
    const titleBeat = el('div', 'chsum-beat');
    const kick = el('div', 'chsum-kick', 'fine del viaggio');
    const title = el('h1', 'chsum-title huge', summary.title);
    const sub = el('div', 'chsum-sub', summary.subtitle);
    titleBeat.append(kick, title, sub);

    // atto secondo: il mondo esplorato
    const explore = summary.exploration;
    const exploreBeat = el('div', 'chsum-beat');
    exploreBeat.append(el('div', 'chsum-label', 'mondo esplorato'));
    const pctEl = el('div', 'chsum-hero-num', '0<small>%</small>');
    const roomsEl = el('div', 'chsum-subline', '');
    const bar = el('div', 'chsum-bar');
    const fill = el('div', 'chsum-fill');
    bar.append(fill);
    const mapStamp = el('div', 'chsum-stamp', 'realm intero');
    exploreBeat.append(pctEl, roomsEl, bar, mapStamp);
    const exploreVerdict = (): void => {
        if (explore.percent === 100) {
            mapStamp.classList.add('on');
            sfx.unlock();
        } else {
            cine.boom(exploreBeat);
        }
    };

    // atto terzo: i cuori
    const hearts = summary.hearts;
    const heartBeat = el('div', 'chsum-beat');
    heartBeat.append(el('div', 'chsum-label', 'cuori del realm'));
    const heartNum = el('div', 'chsum-mid', '');
    const heartRow = el('div', 'chsum-hearts');
    const heartNote = el('div', 'chsum-subline', '');
    heartBeat.append(heartNum, heartRow, heartNote);

    // atto quarto: i segreti
    const things = summary.things;
    const thingBeat = el('div', 'chsum-beat');
    thingBeat.append(el('div', 'chsum-label', 'segreti del realm'));
    const thingNum = el('div', 'chsum-mid', '');
    const thingNote = el('div', 'chsum-subline', 'lore, maschere, tacche, amuleti, missioni');
    thingBeat.append(thingNum, thingNote);

    // atto quinto: il conto e il numero finale
    const score = summary.score;
    const scoreBeat = el('div', 'chsum-beat');
    scoreBeat.append(el('div', 'chsum-label', 'score della run'));
    const rowEls: HTMLElement[] = [];
    for (const [name] of score.lines) {
        const row = el('div', 'chsum-row');
        const n = el('span');
        n.textContent = name;
        const v = el('b');
        v.textContent = '';
        row.append(n, v);
        scoreBeat.append(row);
        rowEls.push(row);
    }
    const totalNum = el('div', 'chsum-hero-num accent', score.total === null ? '—' : '+ 0');
    if (score.total === null) totalNum.classList.add('dim');
    scoreBeat.append(totalNum);
    const rankNote = (): void => {
        if (score.assisted || score.total === null) {
            if (!scoreBeat.querySelector('.chsum-note')) scoreBeat.append(el('div', 'chsum-note', 'partita assistita · senza punteggio'));
            return;
        }
        if (score.best) {
            if (!scoreBeat.querySelector('.chsum-stamp')) {
                const stamp = el('div', 'chsum-stamp', 'nuovo record');
                scoreBeat.append(stamp);
                requestAnimationFrame(() => stamp.classList.add('on'));
                sfx.unlock();
            }
            return;
        }
        if (score.rank > 1 && !scoreBeat.querySelector('.chsum-note')) {
            scoreBeat.append(el('div', 'chsum-note', `${score.rank}° nella classifica`));
        }
    };

    /* ---------- schermata finale: tutto piccolo, il numero grande ---------- */

    const renderFinal = (): void => {
        cine.freeze();
        cine.head.replaceChildren();
        const headChip = cine.chip(summary.title, false);
        headChip.classList.add('lit', 'head');
        cine.head.append(headChip);
        cine.dock.replaceChildren();
        const exploreText = explore.percent === null ? 'mondo non contato' : `mondo ${explore.percent}%`;
        const chips: [string, boolean][] = [
            [exploreText, explore.percent !== null && explore.percent < 100],
            [hearts.total === 0 ? 'nessun cuore' : `cuori ${hearts.found}/${hearts.total}`, hearts.total > 0 && hearts.found < hearts.total],
            [`segreti ${things.found}/${things.total}`, things.found < things.total],
        ];
        for (const [text, bad] of chips) {
            const c = cine.chip(text, bad);
            c.classList.add('lit');
            cine.dock.append(c);
        }
        cine.setHero(scoreBeat);
        scoreBeat.classList.add('lit');
        score.lines.forEach(([, value], i) => {
            const row = rowEls[i];
            if (!row) return;
            row.classList.add('lit');
            row.querySelector('b')!.textContent = value;
        });
        if (score.total === null) {
            totalNum.textContent = '—';
            totalNum.classList.add('dim');
        } else {
            totalNum.textContent = `+ ${fmt(score.total)}`;
        }
        if (score.best && !score.assisted) {
            if (!scoreBeat.querySelector('.chsum-stamp')) scoreBeat.append(el('div', 'chsum-stamp on', 'nuovo record'));
        } else if (score.rank > 1 && !score.assisted) {
            if (!scoreBeat.querySelector('.chsum-note')) scoreBeat.append(el('div', 'chsum-note', `${score.rank}° nella classifica`));
        } else if (score.assisted && !scoreBeat.querySelector('.chsum-note')) {
            scoreBeat.append(el('div', 'chsum-note', 'partita assistita · senza punteggio'));
        }
        cine.hint.classList.add('lit');
        cine.ready = true;
        cine.fitToScreen();
    };

    cine.arm(renderFinal, onContinue);

    /* ---------- sequenza ---------- */

    let at = 0;
    const after = (ms: number): number => (at += ms);

    cine.later(after(600), () => {
        cine.setHero(titleBeat);
        kick.classList.add('lit');
    });
    cine.later(after(600), () => {
        title.classList.add('lit');
        sfx.checkpoint();
    });
    cine.later(after(700), () => sub.classList.add('lit'));
    cine.later(after(1900), () => {
        const headChip = cine.chip(summary.title, false);
        cine.flyTo(titleBeat, cine.head, headChip, () => {
            headChip.classList.add('lit', 'head');
        });
        titleBeat.classList.add('leaving');
    });

    cine.later(after(900), () => {
        cine.setHero(exploreBeat);
        exploreBeat.classList.add('lit');
        if (explore.percent === null) {
            pctEl.textContent = '—';
            roomsEl.textContent = 'mondo non contato';
            return;
        }
        roomsEl.textContent = `${explore.visited} / ${explore.total} stanze`;
        cine.count(1800, explore.percent, (v) => {
            pctEl.innerHTML = `${fmt(v)}<small>%</small>`;
            fill.style.width = `${Math.min(100, v)}%`;
        }, exploreVerdict);
    });
    cine.later(after(2300), () => {
        const text = explore.percent === null ? 'mondo non contato' : `mondo ${explore.percent}%`;
        const c = cine.chip(text, explore.percent !== null && explore.percent < 100);
        cine.flyTo(exploreBeat, cine.dock, c, () => {});
        exploreBeat.classList.add('leaving');
    });

    cine.later(after(900), () => {
        cine.setHero(heartBeat);
        heartBeat.classList.add('lit');
        if (hearts.total === 0) {
            heartNum.textContent = '—';
            heartNote.textContent = 'nessun cuore nel viaggio';
            return;
        }
        heartNote.textContent = hearts.found === hearts.total ? 'tutti. il realm ti deve la vita.' : 'il resto è ancora là fuori';
        cine.count(1400, hearts.found, (v) => {
            heartNum.textContent = `${Math.floor(v)} / ${hearts.total}`;
        }, () => {
            heartRow.replaceChildren();
            const show = Math.min(hearts.total, 12);
            for (let i = 0; i < show; i++) {
                const icon = heartIcon(i < Math.min(hearts.found, show));
                heartRow.append(icon);
                if (reduced) {
                    icon.classList.add(i < hearts.found ? 'pop' : 'miss');
                    continue;
                }
                cine.later(i * 300, () => {
                    icon.classList.add(i < hearts.found ? 'pop' : 'miss');
                    if (i < hearts.found) sfx.heartbeat();
                    if (i === show - 1) {
                        if (hearts.found === hearts.total) sfx.unlock();
                        else cine.boom(heartBeat);
                    }
                });
            }
            if (reduced) {
                if (hearts.found === hearts.total) sfx.unlock();
                else cine.boom(heartBeat);
            }
        });
    });
    cine.later(after(1400 + 700 + Math.min(hearts.total, 12) * 300 + 1100), () => {
        const c = cine.chip(hearts.total === 0 ? 'nessun cuore' : `cuori ${hearts.found}/${hearts.total}`, hearts.total > 0 && hearts.found < hearts.total);
        cine.flyTo(heartBeat, cine.dock, c, () => {});
        heartBeat.classList.add('leaving');
    });

    cine.later(after(900), () => {
        cine.setHero(thingBeat);
        thingBeat.classList.add('lit');
        if (things.total === 0) {
            thingNum.textContent = '—';
            thingNote.textContent = 'segreti non contati in questa run';
            return;
        }
        cine.count(1400, things.found, (v) => {
            thingNum.textContent = `${Math.floor(v)} / ${things.total}`;
        }, () => {
            if (things.found === things.total) sfx.unlock();
            else cine.boom(thingBeat);
        });
    });
    cine.later(after(1400 + 700 + 1100), () => {
        const c = cine.chip(`segreti ${things.found}/${things.total}`, things.found < things.total);
        cine.flyTo(thingBeat, cine.dock, c, () => {});
        thingBeat.classList.add('leaving');
    });

    cine.later(after(900), () => {
        cine.setHero(scoreBeat);
        scoreBeat.classList.add('lit');
        score.lines.forEach(([, value], i) => {
            cine.later(i * 450, () => {
                const row = rowEls[i];
                if (!row) return;
                row.classList.add('lit');
                row.querySelector('b')!.textContent = value;
                cine.tick();
            });
        });
        const rowsMs = score.lines.length * 450;
        cine.later(rowsMs + 400, () => {
            if (score.total === null) {
                rankNote();
                return;
            }
            cine.count(1600, score.total, (v) => {
                totalNum.textContent = `+ ${fmt(v)}`;
            }, () => {
                sfx.checkpoint();
                rankNote();
            });
        });
    });
    cine.later(after(score.lines.length * 450 + 400 + 1600 + 900), () => {
        cine.hint.classList.add('lit');
        cine.ready = true;
    });
}
