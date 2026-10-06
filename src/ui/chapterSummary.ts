import { ZONE_CSS } from '../config';
import { bus } from '../engine/events';
import { sfx } from '../engine/sfx';
import type { ChapterSummary } from '../engine/ChapterCompletion';
import { Cine, fmt, heartIcon, isCinematicOpen } from './cine';
import { el } from './dom';

/* il riepilogo animato di fine capitolo sul palco condiviso: un protagonista
   alla volta al centro, poi vola piccolo al suo posto */

export function isChapterSummaryOpen(): boolean {
    return isCinematicOpen();
}

export function initChapterSummary(): void {
    bus.on('chapter-summary-show', ({ summary, onContinue }) => {
        const cine = Cine.open(ZONE_CSS[summary.color] ?? '#4ade80');
        if (!cine) {
            onContinue();
            return;
        }
        try {
            showSummary(cine, summary, onContinue);
        } catch (e) {
            // mai bloccare la campagna per un overlay rotto: si pulisce e si va avanti
            if (import.meta.env.DEV) console.warn('riepilogo capitolo fallito:', e);
            cine.cleanup();
            onContinue();
        }
    });
}

function showSummary(cine: Cine, summary: ChapterSummary, onContinue: () => void): void {
    const reduced = cine.reduced;

    // atto primo: il titolo enorme
    const titleBeat = el('div', 'chsum-beat');
    const kick = el('div', 'chsum-kick', 'capitolo completato');
    const title = el('h1', 'chsum-title huge');
    title.textContent = `${summary.title.toLowerCase()} `;
    const em = el('em');
    em.textContent = summary.accentWord;
    title.append(em);
    const sub = el('div', 'chsum-sub', 'il realm tiene ancora. per ora.');
    titleBeat.append(kick, title, sub);
    if (summary.punchline) {
        const punch = el('div', 'chsum-punch');
        punch.textContent = summary.punchline;
        titleBeat.append(punch);
    }

    // atto secondo: la mappa
    const explore = summary.exploration;
    const exploreBeat = el('div', 'chsum-beat');
    exploreBeat.append(el('div', 'chsum-label', 'mappa esplorata'));
    const pctEl = el('div', 'chsum-hero-num', '0<small>%</small>');
    const roomsEl = el('div', 'chsum-subline', '');
    const bar = el('div', 'chsum-bar');
    const fill = el('div', 'chsum-fill');
    bar.append(fill);
    const mapStamp = el('div', 'chsum-stamp', 'mappa completa');
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

    // atto quinto: lo score voce per voce
    const scoreBeat = el('div', 'chsum-beat');
    scoreBeat.append(el('div', 'chsum-label', 'score capitolo'));
    const rowEls: HTMLElement[] = [];
    for (const [name] of summary.score.lines) {
        const row = el('div', 'chsum-row');
        const n = el('span');
        n.textContent = name;
        const v = el('b');
        v.textContent = '';
        row.append(n, v);
        scoreBeat.append(row);
        rowEls.push(row);
    }
    const totalNum = el('div', 'chsum-mid total', '+ 0');
    scoreBeat.append(totalNum);
    let recordStamp: HTMLElement | null = null;
    if (summary.score.best && !summary.score.assisted) {
        recordStamp = el('div', 'chsum-stamp', 'nuovo record');
        scoreBeat.append(recordStamp);
    }
    if (summary.score.assisted) {
        scoreBeat.append(el('div', 'chsum-note', 'partita assistita · senza punteggio'));
    }

    // atto finale: lo score in numeri
    const runBeat = el('div', 'chsum-beat');
    runBeat.append(el('div', 'chsum-label', 'score attuale'));
    const runNum = el('div', 'chsum-hero-num accent', '0');
    runBeat.append(runNum);

    /* ---------- schermata finale: tutto piccolo, il numero grande ---------- */

    const renderFinal = (): void => {
        cine.freeze();
        cine.head.replaceChildren();
        const headChip = cine.chip(`${summary.title.toLowerCase()} ${summary.accentWord}`, false);
        headChip.classList.add('lit', 'head');
        cine.head.append(headChip);
        cine.dock.replaceChildren();
        const exploreText = explore.percent === null ? 'mappa non disponibile' : `mappa ${explore.percent}%`;
        const eChip = cine.chip(exploreText, explore.percent !== null && explore.percent < 100);
        const hChip = cine.chip(hearts.total === 0 ? 'nessun cuore qui' : `cuori ${hearts.found}/${hearts.total}`, hearts.total > 0 && hearts.found < hearts.total);
        const tChip = cine.chip(`segreti ${things.found}/${things.total}`, things.found < things.total);
        const sChip = cine.chip(`capitolo + ${fmt(summary.score.chapter)}`, false);
        for (const c of [eChip, hChip, tChip, sChip]) {
            c.classList.add('lit');
            cine.dock.append(c);
        }
        cine.setHero(runBeat);
        runBeat.classList.add('lit');
        if (summary.score.runTotal === null) {
            runNum.textContent = '—';
            runNum.classList.add('dim');
            if (!runBeat.querySelector('.chsum-note')) runBeat.append(el('div', 'chsum-note', 'partita assistita · senza punteggio'));
        } else {
            runNum.textContent = fmt(summary.score.runTotal);
        }
        if (summary.score.best && !summary.score.assisted && !runBeat.querySelector('.chsum-stamp')) {
            const stamp = el('div', 'chsum-stamp on', 'nuovo record');
            runBeat.append(stamp);
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
    cine.later(after(700), () => {
        sub.classList.add('lit');
        const punch = titleBeat.querySelector('.chsum-punch');
        if (punch) punch.classList.add('lit');
    });
    cine.later(after(1900), () => {
        const headChip = cine.chip(`${summary.title.toLowerCase()} ${summary.accentWord}`, false);
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
            roomsEl.textContent = 'mappa non disponibile';
            return;
        }
        roomsEl.textContent = `${explore.visited} / ${explore.total} stanze`;
        cine.count(1800, explore.percent, (v) => {
            pctEl.innerHTML = `${fmt(v)}<small>%</small>`;
            fill.style.width = `${Math.min(100, v)}%`;
        }, exploreVerdict);
    });
    cine.later(after(2300), () => {
        const text = explore.percent === null ? 'mappa non disponibile' : `mappa ${explore.percent}%`;
        const c = cine.chip(text, explore.percent !== null && explore.percent < 100);
        cine.flyTo(exploreBeat, cine.dock, c, () => {});
        exploreBeat.classList.add('leaving');
    });

    cine.later(after(900), () => {
        cine.setHero(heartBeat);
        heartBeat.classList.add('lit');
        if (hearts.total === 0) {
            heartNum.textContent = '—';
            heartNote.textContent = 'nessun cuore in questo capitolo';
            return;
        }
        heartNote.textContent = hearts.found === hearts.total ? 'tutti. il realm ti deve la vita.' : 'il resto è ancora là fuori';
        cine.count(1400, hearts.found, (v) => {
            heartNum.textContent = `${Math.floor(v)} / ${hearts.total}`;
        }, () => {
            heartRow.replaceChildren();
            for (let i = 0; i < hearts.total; i++) {
                const icon = heartIcon(i < hearts.found);
                heartRow.append(icon);
                const showAt = i * 400;
                if (reduced) {
                    icon.classList.add(i < hearts.found ? 'pop' : 'miss');
                    continue;
                }
                cine.later(showAt, () => {
                    icon.classList.add(i < hearts.found ? 'pop' : 'miss');
                    if (i < hearts.found) sfx.heartbeat();
                    if (i === hearts.total - 1) {
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
    cine.later(after(1400 + 700 + hearts.total * 400 + 1100), () => {
        const c = cine.chip(hearts.total === 0 ? 'nessun cuore qui' : `cuori ${hearts.found}/${hearts.total}`, hearts.total > 0 && hearts.found < hearts.total);
        cine.flyTo(heartBeat, cine.dock, c, () => {});
        heartBeat.classList.add('leaving');
    });

    cine.later(after(900), () => {
        cine.setHero(thingBeat);
        thingBeat.classList.add('lit');
        if (things.total === 0) {
            thingNum.textContent = '—';
            thingNote.textContent = 'qui niente si nasconde';
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
        summary.score.lines.forEach(([, value], i) => {
            cine.later(i * 450, () => {
                const row = rowEls[i];
                if (!row) return;
                row.classList.add('lit');
                row.querySelector('b')!.textContent = value;
                cine.tick();
            });
        });
        const rowsMs = summary.score.lines.length * 450;
        cine.later(rowsMs + 400, () => {
            cine.count(1400, summary.score.chapter, (v) => {
                totalNum.textContent = `+ ${fmt(v)}`;
            }, () => {
                if (recordStamp) {
                    recordStamp.classList.add('on');
                    sfx.unlock();
                } else if (!summary.score.assisted) {
                    sfx.pickup();
                }
            });
        });
    });
    cine.later(after(2600 + summary.score.lines.length * 450 + 1100), () => {
        for (const row of rowEls) row.classList.add('faded');
        if (recordStamp) {
            recordStamp.classList.remove('on');
            recordStamp.classList.add('faded');
        }
        const c = cine.chip(`capitolo + ${fmt(summary.score.chapter)}`, false);
        cine.flyTo(totalNum, cine.dock, c, () => {});
        scoreBeat.classList.add('leaving');
    });

    cine.later(after(1100), () => {
        cine.setHero(runBeat);
        runBeat.classList.add('lit');
        if (summary.score.runTotal === null) {
            runNum.textContent = '—';
            runNum.classList.add('dim');
            runBeat.append(el('div', 'chsum-note', 'partita assistita · senza punteggio'));
            return;
        }
        cine.count(1600, summary.score.runTotal, (v) => {
            runNum.textContent = fmt(v);
        }, () => sfx.checkpoint());
    });
    cine.later(after(1600 + 900), () => {
        if (summary.score.best && !summary.score.assisted) {
            const stamp = el('div', 'chsum-stamp', 'nuovo record');
            runBeat.append(stamp);
            requestAnimationFrame(() => stamp.classList.add('on'));
        }
        cine.hint.classList.add('lit');
        cine.ready = true;
    });
}
