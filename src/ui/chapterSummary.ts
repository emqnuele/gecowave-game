import { ZONE_CSS } from '../config';
import { bus } from '../engine/events';
import { sfx } from '../engine/sfx';
import type { ChapterSummary } from '../engine/ChapterCompletion';
import { el, ui } from './dom';
import './chapterSummary.css';

/* il riepilogo animato di fine capitolo: una carta d'inchiostro che conta
   da sola, poi lascia andare. un solo rAF, tutto distrutto all'uscita */

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

function heartIcon(on: boolean): SVGElement {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    if (!on) svg.setAttribute('class', 'off');
    const p = document.createElementNS(ns, 'path');
    p.setAttribute('d', HEART_PATH);
    p.setAttribute('fill', on ? '#f87171' : 'none');
    p.setAttribute('stroke', on ? '#7f1d1d' : '#5d574b');
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

    const card = el('div', 'chsum-card');
    root.append(card);
    ui().append(root);

    const kick = el('div', 'chsum-kick', 'capitolo completato');
    const title = el('h1', 'chsum-title');
    title.textContent = `${summary.title.toLowerCase()} `;
    const em = el('em');
    em.textContent = summary.accentWord;
    title.append(em);
    const sub = el('div', 'chsum-sub', 'il realm tiene ancora. per ora.');
    card.append(kick, title, sub);
    if (summary.punchline) {
        const punch = el('div', 'chsum-punch');
        punch.textContent = summary.punchline;
        card.append(punch);
    }

    const grid = el('div', 'chsum-grid');
    card.append(grid);

    // esplora
    const exploreCell = el('section', 'chsum-cell hero');
    exploreCell.append(el('div', 'chsum-label', 'mappa esplorata'));
    const pctEl = el('div', 'chsum-big', '0<small>%</small>');
    exploreCell.append(pctEl);
    const roomsEl = el('div', 'chsum-note', '');
    exploreCell.append(roomsEl);
    const bar = el('div', 'chsum-bar');
    const fill = el('div', 'chsum-fill');
    bar.append(fill);
    exploreCell.append(bar);
    const mapStamp = el('div', 'chsum-stamp', 'mappa completa');
    exploreCell.append(mapStamp);
    grid.append(exploreCell);

    // cuori
    const heartCell = el('section', 'chsum-cell');
    heartCell.append(el('div', 'chsum-label', 'cuori del realm'));
    const heartNum = el('div', 'chsum-mid', '');
    const heartRow = el('div', 'chsum-hearts');
    const heartNote = el('div', 'chsum-note', '');
    heartCell.append(heartNum, heartRow, heartNote);
    grid.append(heartCell);

    // cose
    const thingCell = el('section', 'chsum-cell');
    thingCell.append(el('div', 'chsum-label', 'cose trovate'));
    const thingNum = el('div', 'chsum-mid', '');
    const thingNote = el('div', 'chsum-note', 'lore, maschere, tacche, amuleti, missioni');
    thingCell.append(thingNum, thingNote);
    grid.append(thingCell);

    // punteggio
    const scoreBox = el('section', 'chsum-score');
    scoreBox.append(el('div', 'chsum-label', 'score capitolo'));
    const rowsBox = el('div', '');
    const rowEls: HTMLElement[] = [];
    for (const [name] of summary.score.lines) {
        const row = el('div', 'chsum-row');
        const n = el('span');
        n.textContent = name;
        const v = el('b');
        v.textContent = '';
        row.append(n, v);
        rowsBox.append(row);
        rowEls.push(row);
    }
    scoreBox.append(rowsBox);
    const totalLine = el('div', 'chsum-total-line');
    totalLine.append(el('div', 'chsum-label', 'totale capitolo'));
    const totalNum = el('div', 'chsum-mid', '+ 0');
    totalLine.append(totalNum);
    scoreBox.append(totalLine);
    if (summary.score.best && !summary.score.assisted) {
        const stamp = el('div', 'chsum-stamp', 'nuovo record');
        stamp.style.top = '8px';
        scoreBox.append(stamp);
        scoreBox.dataset.stamp = '1';
    }
    if (summary.score.assisted) {
        const note = el('div', 'chsum-note', 'partita assistita · senza punteggio');
        scoreBox.append(note);
    }
    card.append(scoreBox);

    // run totale
    const runBox = el('div', 'chsum-run');
    runBox.append(el('div', 'chsum-label', 'score attuale'));
    const runNum = el('div', 'chsum-big', '0');
    runBox.append(runNum);
    card.append(runBox);

    // continua
    const foot = el('div', 'chsum-foot');
    const hint = el('div', 'chsum-hint');
    hint.innerHTML = 'premi <kbd>invio</kbd> o tocca';
    const goBtn = el('button', 'chsum-go', 'continua →') as HTMLButtonElement;
    goBtn.disabled = true;
    foot.append(hint, goBtn);
    card.append(foot);

    /* ---------- animazione: contatori interpolati col rAF, niente intervalli ---------- */

    let raf = 0;
    const timers: number[] = [];
    let lastTick = 0;
    let enabled = false;
    let done = false;
    const t0 = performance.now();

    const tick = (): void => {
        if (Math.floor(performance.now()) - lastTick > 85) {
            lastTick = Math.floor(performance.now());
            sfx.barra();
        }
    };

    const later = (ms: number, fn: () => void): void => {
        if (reduced) timers.push(window.setTimeout(fn, Math.min(ms, 400)));
        else timers.push(window.setTimeout(fn, ms));
    };

    const count = (at: number, dur: number, to: number, render: (v: number) => void, onEnd?: () => void): void => {
        if (reduced || dur <= 0) {
            render(to);
            if (onEnd) onEnd();
            return;
        }
        let started = false;
        let prev = -1;
        const step = (now: number): void => {
            if (done) return;
            const k = Math.min(1, Math.max(0, (now - t0 - at) / dur));
            if (k > 0 && !started) started = true;
            if (k <= 0) {
                raf = requestAnimationFrame(step);
                return;
            }
            const eased = 1 - Math.pow(1 - k, 3);
            const v = to * eased;
            render(v);
            if (Math.floor(v) !== prev) {
                prev = Math.floor(v);
                tick();
            }
            if (k < 1) raf = requestAnimationFrame(step);
            else if (onEnd) onEnd();
        };
        raf = requestAnimationFrame(step);
    };

    const bits = (n: number): void => {
        if (reduced) return;
        for (let i = 0; i < n; i++) {
            const b = el('i', 'chsum-bit');
            b.style.left = `${8 + Math.random() * 84}%`;
            b.style.top = `${20 + Math.random() * 50}%`;
            b.style.background = i % 3 === 0 ? '#e8dfc8' : accent;
            card.append(b);
            requestAnimationFrame(() => b.classList.add('fly'));
            timers.push(window.setTimeout(() => b.remove(), 1300));
        }
    };

    const cleanup = (): void => {
        cancelAnimationFrame(raf);
        for (const t of timers) window.clearTimeout(t);
        window.removeEventListener('keydown', onKey, true);
        root.remove();
        open = false;
    };

    const go = (): void => {
        if (done || !enabled) return;
        done = true;
        sfx.menuSelect();
        cleanup();
        onContinue();
    };

    const onKey = (e: KeyboardEvent): void => {
        if (e.code === 'Enter' || e.code === 'Space') {
            e.preventDefault();
            e.stopPropagation();
            go();
        }
    };
    window.addEventListener('keydown', onKey, true);
    root.addEventListener('click', () => go());

    /* ---------- sequenza ---------- */

    const explore = summary.exploration;
    later(250, () => {
        exploreCell.classList.add('lit');
        if (explore.percent === null) {
            pctEl.innerHTML = '—';
            roomsEl.textContent = 'mappa non disponibile';
            return;
        }
        roomsEl.textContent = `${explore.visited} / ${explore.total} stanze`;
        count(0, 950, explore.percent, (v) => {
            pctEl.innerHTML = `${fmt(v)}<small>%</small>`;
            fill.style.width = `${Math.min(100, v)}%`;
        }, () => {
            if (explore.percent === 100) {
                mapStamp.classList.add('on');
                sfx.unlock();
                bits(12);
            } else {
                sfx.pickup();
            }
        });
    });

    const hearts = summary.hearts;
    later(1000, () => {
        heartCell.classList.add('lit');
        if (hearts.total === 0) {
            heartNum.textContent = '—';
            heartNote.textContent = 'nessun cuore in questo capitolo';
            return;
        }
        heartNote.textContent = hearts.found === hearts.total ? 'tutti. il realm ti deve la vita.' : 'il resto è ancora là fuori';
        count(0, 700, hearts.found, (v) => {
            heartNum.textContent = `${Math.floor(v)} / ${hearts.total}`;
        }, () => {
            heartRow.replaceChildren();
            for (let i = 0; i < hearts.total; i++) heartRow.append(heartIcon(i < hearts.found));
            heartRow.classList.remove('chsum-beat');
            void heartRow.offsetWidth;
            heartRow.classList.add('chsum-beat');
            sfx.pickup();
        });
    });

    const things = summary.things;
    later(1600, () => {
        thingCell.classList.add('lit');
        if (things.total === 0) {
            thingNum.textContent = '—';
            thingNote.textContent = 'niente da raccogliere qui';
            return;
        }
        count(0, 700, things.found, (v) => {
            thingNum.textContent = `${Math.floor(v)} / ${things.total}`;
        }, () => sfx.pickup());
    });

    later(2250, () => {
        scoreBox.classList.add('lit');
        summary.score.lines.forEach(([, value], i) => {
            later(i * 130, () => {
                const row = rowEls[i];
                if (!row) return;
                row.classList.add('lit');
                row.querySelector('b')!.textContent = value;
                tick();
            });
        });
        const rowsMs = summary.score.lines.length * 130;
        later(rowsMs + 120, () => {
            count(0, 900, summary.score.chapter, (v) => {
                totalNum.textContent = `+ ${fmt(v)}`;
            }, () => {
                const stamp = scoreBox.querySelector('.chsum-stamp');
                if (stamp) {
                    stamp.classList.add('on');
                    sfx.unlock();
                    bits(10);
                } else if (!summary.score.assisted) {
                    sfx.pickup();
                }
            });
        });
        const runAt = rowsMs + 120 + 950;
        later(runAt, () => {
            runBox.classList.add('lit');
            if (summary.score.runTotal === null) {
                runNum.textContent = '—';
                const note = el('div', 'chsum-note', 'partita assistita · senza punteggio');
                runBox.append(note);
                return;
            }
            count(0, 1000, summary.score.runTotal, (v) => {
                runNum.textContent = fmt(v);
            }, () => {
                sfx.checkpoint();
                bits(14);
            });
        });
    });

    later(1700, () => {
        enabled = true;
        goBtn.disabled = false;
        goBtn.focus();
    });
}
