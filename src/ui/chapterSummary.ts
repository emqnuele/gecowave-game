import { ZONE_CSS } from '../config';
import { bus } from '../engine/events';
import { sfx } from '../engine/sfx';
import type { ChapterSummary } from '../engine/ChapterCompletion';
import { el, ui } from './dom';
import './chapterSummary.css';

/* il riepilogo cinematico di fine capitolo: schermo nero, tutto appare
   piano e in ordine. chi tocca salta alla fine, chi tocca ancora va oltre */

let open = false;

export function isChapterSummaryOpen(): boolean {
    return open;
}

export function initChapterSummary(): void {
    bus.on('chapter-summary-show', ({ summary, onContinue }) => {
        try {
            showSummary(summary, onContinue);
        } catch (e) {
            // mai bloccare la campagna per un overlay rotto: si pulisce e si va avanti
            if (import.meta.env.DEV) console.warn('riepilogo capitolo fallito:', e);
            document.querySelectorAll('.chsum-overlay').forEach((n) => n.remove());
            open = false;
            onContinue();
        }
    });
}

const HEART_PATH = 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';

function heartIcon(found: boolean): SVGElement {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    const p = document.createElementNS(ns, 'path');
    p.setAttribute('d', HEART_PATH);
    p.setAttribute('fill', found ? '#f87171' : 'none');
    p.setAttribute('stroke', found ? '#7f1d1d' : '#f87171');
    p.setAttribute('stroke-width', '1.6');
    svg.append(p);
    return svg;
}

function fmt(n: number): string {
    return Math.round(n).toLocaleString('it-IT');
}

function showSummary(summary: ChapterSummary, onContinue: () => void): void {
    if (open) return;
    open = true;
    sfx.init();

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const accent = ZONE_CSS[summary.color] ?? '#4ade80';
    const root = el('div', 'chsum-overlay');
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-label', 'riepilogo del capitolo');
    root.style.setProperty('--chsum-accent', accent);
    root.append(el('div', 'chsum-glow'), el('div', 'chsum-bar-top'), el('div', 'chsum-bar-bot'));
    const flash = el('div', 'chsum-flash');
    root.append(flash);
    const stage = el('div', 'chsum-stage');
    root.append(stage);
    // tutto il contenuto scala per entrare in un'inquadratura sola, senza scorrere
    const fit = el('div', 'chsum-fit');
    stage.append(fit);
    ui().append(root);

    const kick = el('div', 'chsum-kick', 'capitolo completato');
    const title = el('h1', 'chsum-title');
    title.textContent = `${summary.title.toLowerCase()} `;
    const em = el('em');
    em.textContent = summary.accentWord;
    title.append(em);
    const sub = el('div', 'chsum-sub', 'il realm tiene ancora. per ora.');
    fit.append(kick, title, sub);
    if (summary.punchline) {
        const punch = el('div', 'chsum-punch');
        punch.textContent = summary.punchline;
        fit.append(punch);
    }

    // esplorazione
    const exploreBlock = el('section', 'chsum-block');
    exploreBlock.append(el('div', 'chsum-label', 'mappa esplorata'));
    const pctEl = el('div', 'chsum-hero-num', '0<small>%</small>');
    const roomsEl = el('div', 'chsum-subline', '');
    const bar = el('div', 'chsum-bar');
    const fill = el('div', 'chsum-fill');
    bar.append(fill);
    const mapStamp = el('div', 'chsum-stamp', 'mappa completa');
    exploreBlock.append(pctEl, roomsEl, bar, mapStamp);
    fit.append(exploreBlock);

    // cuori
    const heartBlock = el('section', 'chsum-block');
    heartBlock.append(el('div', 'chsum-label', 'cuori del realm'));
    const heartNum = el('div', 'chsum-mid', '');
    const heartRow = el('div', 'chsum-hearts');
    const heartNote = el('div', 'chsum-subline', '');
    heartBlock.append(heartNum, heartRow, heartNote);
    fit.append(heartBlock);

    // cose
    const thingBlock = el('section', 'chsum-block');
    thingBlock.append(el('div', 'chsum-label', 'cose trovate'));
    const thingNum = el('div', 'chsum-mid', '');
    const thingNote = el('div', 'chsum-subline', 'lore, maschere, tacche, amuleti, missioni');
    thingBlock.append(thingNum, thingNote);
    fit.append(thingBlock);

    // punteggio
    const scoreBox = el('section', 'chsum-score');
    scoreBox.append(el('div', 'chsum-label', 'score capitolo'));
    const rowEls: HTMLElement[] = [];
    for (const [name] of summary.score.lines) {
        const row = el('div', 'chsum-row');
        const n = el('span');
        n.textContent = name;
        const v = el('b');
        v.textContent = '';
        row.append(n, v);
        scoreBox.append(row);
        rowEls.push(row);
    }
    const totalBox = el('div', 'chsum-total');
    totalBox.append(el('div', 'chsum-label', 'totale capitolo'));
    const totalNum = el('div', 'chsum-mid', '+ 0');
    totalBox.append(totalNum);
    scoreBox.append(totalBox);
    let recordStamp: HTMLElement | null = null;
    if (summary.score.best && !summary.score.assisted) {
        recordStamp = el('div', 'chsum-stamp', 'nuovo record');
        scoreBox.append(recordStamp);
    }
    if (summary.score.assisted) {
        scoreBox.append(el('div', 'chsum-note', 'partita assistita · senza punteggio'));
    }
    fit.append(scoreBox);

    // run totale
    const runBox = el('section', 'chsum-score chsum-run');
    runBox.append(el('div', 'chsum-label', 'score attuale'));
    const runNum = el('div', 'chsum-hero-num', '0');
    runBox.append(runNum);
    fit.append(runBox);

    const hint = el('div', 'chsum-go-hint', 'clicca ovunque per continuare');
    fit.append(hint);

    /* ---------- regia: battiti lenti, salto alla fine, poi oltre ---------- */

    const t0 = performance.now();
    const timers: number[] = [];
    const rafs = new Set<number>();
    const finals: (() => void)[] = [];
    let seq = 0;
    let skipped = false;
    let closed = false;
    let ready = false;
    let continued = false;
    let lastTick = 0;

    // l'inquadratura contiene tutto: se lo schermo è basso si rimpicciolisce
    const fitToScreen = (): void => {
        fit.style.transform = '';
        const h = fit.scrollHeight;
        const avail = window.innerHeight * 0.9;
        const s = h > 0 ? Math.min(1, avail / h) : 1;
        if (s < 1) fit.style.transform = `scale(${s})`;
    };
    const onResize = (): void => {
        if (!closed) fitToScreen();
    };
    window.addEventListener('resize', onResize);
    fitToScreen();
    if (document.fonts?.ready) {
        document.fonts.ready.then(() => {
            if (!closed) fitToScreen();
        }).catch(() => {});
    }

    const tick = (): void => {
        const now = performance.now();
        if (now - lastTick > 85) {
            lastTick = now;
            sfx.barra();
        }
    };

    /** il colpo di chi muore: la sezione diventa rossa e lo schermo trema */
    const boom = (block: HTMLElement): void => {
        block.classList.add('bad');
        sfx.die();
        if (reduced) return;
        flash.classList.remove('hit');
        void flash.offsetWidth;
        flash.classList.add('hit');
        stage.classList.remove('shake');
        void stage.offsetWidth;
        stage.classList.add('shake');
    };

    const later = (ms: number, fn: () => void): void => {
        // movimento ridotto: la stessa sequenza, compressa e scaglionata
        if (reduced) {
            ms = Math.min(150 + seq * 80, 1600);
            seq++;
        }
        timers.push(window.setTimeout(() => {
            if (closed || skipped) return;
            fn();
        }, ms));
    };

    const count = (dur: number, to: number, render: (v: number) => void, onEnd?: () => void): void => {
        if (reduced) {
            render(to);
            if (onEnd) onEnd();
            return;
        }
        const start = performance.now();
        let prev = -1;
        const step = (now: number): void => {
            if (closed || skipped) return;
            const k = Math.min(1, (now - start) / dur);
            const eased = 1 - Math.pow(1 - k, 3);
            const v = to * eased;
            render(v);
            if (Math.floor(v) !== prev) {
                prev = Math.floor(v);
                tick();
            }
            if (k < 1) {
                const id = requestAnimationFrame(step);
                rafs.add(id);
            } else if (onEnd) {
                onEnd();
            }
        };
        const id = requestAnimationFrame(step);
        rafs.add(id);
    };

    const cleanup = (): void => {
        for (const t of timers) window.clearTimeout(t);
        for (const id of rafs) cancelAnimationFrame(id);
        rafs.clear();
        window.removeEventListener('keydown', onKey, true);
        window.removeEventListener('resize', onResize);
        root.remove();
        open = false;
    };

    const proceed = (): void => {
        if (continued) return;
        continued = true;
        sfx.menuSelect();
        cleanup();
        onContinue();
    };

    const finishAll = (): void => {
        skipped = true;
        for (const t of timers) window.clearTimeout(t);
        timers.length = 0;
        for (const f of finals) f();
        finals.length = 0;
        hint.classList.add('lit');
        ready = true;
    };

    const onTap = (): void => {
        if (closed || continued) return;
        if (performance.now() - t0 < 1000) return;
        if (!ready) finishAll();
        else proceed();
    };

    const onKey = (e: KeyboardEvent): void => {
        if (e.code === 'Enter' || e.code === 'Space') {
            e.preventDefault();
            e.stopPropagation();
            onTap();
        }
    };
    window.addEventListener('keydown', onKey, true);
    root.addEventListener('click', onTap);

    /* ---------- sequenza ---------- */

    let at = 0;
    const after = (ms: number): number => (at += ms);

    // titolo
    later(after(800), () => kick.classList.add('lit'));
    finals.push(() => kick.classList.add('lit'));
    later(after(700), () => {
        title.classList.add('lit');
        sfx.checkpoint();
    });
    finals.push(() => title.classList.add('lit'));
    later(after(800), () => {
        sub.classList.add('lit');
        const punch = stage.querySelector('.chsum-punch');
        if (punch) punch.classList.add('lit');
    });
    finals.push(() => {
        sub.classList.add('lit');
        const punch = stage.querySelector('.chsum-punch');
        if (punch) punch.classList.add('lit');
    });

    // esplorazione
    const explore = summary.exploration;
    const exploreVerdict = (): void => {
        if (explore.percent === 100) {
            mapStamp.classList.add('on');
            sfx.unlock();
        } else {
            boom(exploreBlock);
        }
    };
    const exploreFinal = (): void => {
        exploreBlock.classList.add('lit');
        if (explore.percent === null) {
            pctEl.textContent = '—';
            roomsEl.textContent = 'mappa non disponibile';
            return;
        }
        pctEl.innerHTML = `${fmt(explore.percent)}<small>%</small>`;
        roomsEl.textContent = `${explore.visited} / ${explore.total} stanze`;
        fill.style.width = `${explore.percent}%`;
        if (explore.percent === 100) mapStamp.classList.add('on');
        else exploreBlock.classList.add('bad');
    };
    later(after(800), () => {
        exploreBlock.classList.add('lit');
        if (explore.percent === null) {
            pctEl.textContent = '—';
            roomsEl.textContent = 'mappa non disponibile';
            return;
        }
        roomsEl.textContent = `${explore.visited} / ${explore.total} stanze`;
        count(1800, explore.percent, (v) => {
            pctEl.innerHTML = `${fmt(v)}<small>%</small>`;
            fill.style.width = `${Math.min(100, v)}%`;
        }, exploreVerdict);
    });
    finals.push(exploreFinal);
    after(2100);

    // cuori
    const hearts = summary.hearts;
    const heartsFinal = (): void => {
        heartBlock.classList.add('lit');
        if (hearts.total === 0) {
            heartNum.textContent = '—';
            heartNote.textContent = 'nessun cuore in questo capitolo';
            return;
        }
        heartNum.textContent = `${hearts.found} / ${hearts.total}`;
        heartRow.replaceChildren();
        for (let i = 0; i < hearts.total; i++) {
            const icon = heartIcon(i < hearts.found);
            icon.classList.add(i < hearts.found ? 'pop' : 'miss');
            heartRow.append(icon);
        }
        heartNote.textContent = hearts.found === hearts.total ? 'tutti. il realm ti deve la vita.' : 'il resto è ancora là fuori';
        if (hearts.found < hearts.total) heartBlock.classList.add('bad');
    };
    later(after(700), () => {
        heartBlock.classList.add('lit');
        if (hearts.total === 0) {
            heartNum.textContent = '—';
            heartNote.textContent = 'nessun cuore in questo capitolo';
            return;
        }
        heartNote.textContent = hearts.found === hearts.total ? 'tutti. il realm ti deve la vita.' : 'il resto è ancora là fuori';
        count(1400, hearts.found, (v) => {
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
                timers.push(window.setTimeout(() => {
                    if (closed || skipped) return;
                    icon.classList.add(i < hearts.found ? 'pop' : 'miss');
                    if (i < hearts.found) sfx.heartbeat();
                    if (i === hearts.total - 1) {
                        if (hearts.found === hearts.total) sfx.unlock();
                        else boom(heartBlock);
                    }
                }, showAt));
            }
            if (reduced) {
                if (hearts.found === hearts.total) sfx.unlock();
                else boom(heartBlock);
            }
        });
    });
    finals.push(heartsFinal);
    after(1400 + 700 + hearts.total * 400 + 500);

    // cose
    const things = summary.things;
    const thingsFinal = (): void => {
        thingBlock.classList.add('lit');
        if (things.total === 0) {
            thingNum.textContent = '—';
            thingNote.textContent = 'niente da raccogliere qui';
            return;
        }
        thingNum.textContent = `${things.found} / ${things.total}`;
        if (things.found < things.total) thingBlock.classList.add('bad');
    };
    later(after(700), () => {
        thingBlock.classList.add('lit');
        if (things.total === 0) {
            thingNum.textContent = '—';
            thingNote.textContent = 'niente da raccogliere qui';
            return;
        }
        count(1400, things.found, (v) => {
            thingNum.textContent = `${Math.floor(v)} / ${things.total}`;
        }, () => {
            if (things.found === things.total) sfx.unlock();
            else boom(thingBlock);
        });
    });
    finals.push(thingsFinal);
    after(1400 + 700 + 500);

    // punteggio voce per voce
    later(after(700), () => scoreBox.classList.add('lit'));
    finals.push(() => scoreBox.classList.add('lit'));
    summary.score.lines.forEach(([, value], i) => {
        later(after(450), () => {
            const row = rowEls[i];
            if (!row) return;
            row.classList.add('lit');
            row.querySelector('b')!.textContent = value;
            tick();
        });
        finals.push(() => {
            const row = rowEls[i];
            if (!row) return;
            row.classList.add('lit');
            row.querySelector('b')!.textContent = value;
        });
    });
    later(after(500), () => {
        count(1400, summary.score.chapter, (v) => {
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
    finals.push(() => {
        totalNum.textContent = `+ ${fmt(summary.score.chapter)}`;
        if (recordStamp) recordStamp.classList.add('on');
    });
    after(1400 + 500);

    // score attuale
    later(after(600), () => {
        runBox.classList.add('lit');
        if (summary.score.runTotal === null) {
            runNum.textContent = '—';
            runBox.append(el('div', 'chsum-note', 'partita assistita · senza punteggio'));
            return;
        }
        count(1600, summary.score.runTotal, (v) => {
            runNum.textContent = fmt(v);
        }, () => sfx.checkpoint());
    });
    finals.push(() => {
        runBox.classList.add('lit');
        if (summary.score.runTotal === null) {
            runNum.textContent = '—';
            if (!runBox.querySelector('.chsum-note')) runBox.append(el('div', 'chsum-note', 'partita assistita · senza punteggio'));
            return;
        }
        runNum.textContent = fmt(summary.score.runTotal);
    });
    after(1600 + 600);

    // invito a continuare
    later(after(400), () => {
        hint.classList.add('lit');
        ready = true;
    });
    finals.push(() => {
        hint.classList.add('lit');
        ready = true;
    });
}
