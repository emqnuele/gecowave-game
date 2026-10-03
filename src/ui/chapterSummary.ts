import { ZONE_CSS } from '../config';
import { bus } from '../engine/events';
import { sfx } from '../engine/sfx';
import type { ChapterSummary } from '../engine/ChapterCompletion';
import { el, ui } from './dom';
import './chapterSummary.css';

/* il riepilogo cinematico: un protagonista alla volta al centro, poi vola
   piccolo al suo posto. chi tocca salta alla fine, chi tocca ancora va oltre */

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
    const fit = el('div', 'chsum-fit');
    stage.append(fit);
    ui().append(root);

    // cornice persistente: testata, palco, dock dei verdetti, invito
    const head = el('div', 'chsum-head');
    const hero = el('div', 'chsum-hero');
    const dock = el('div', 'chsum-dock');
    const hint = el('div', 'chsum-go-hint', 'clicca ovunque per continuare');
    fit.append(head, hero, dock, hint);

    const t0 = performance.now();
    const timers: number[] = [];
    const rafs = new Set<number>();
    const flights: HTMLElement[] = [];
    let seq = 0;
    let skipped = false;
    let closed = false;
    let ready = false;
    let continued = false;
    let lastTick = 0;

    const fitToScreen = (): void => {
        fit.style.transform = '';
        const h = fit.scrollHeight;
        const avail = window.innerHeight * 0.92;
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

    /** il protagonista vola piccolo al suo posto */
    const flyTo = (from: HTMLElement, parent: HTMLElement, chip: HTMLElement, done: () => void): void => {
        parent.append(chip);
        if (reduced) {
            chip.classList.add('lit');
            done();
            return;
        }
        const r1 = from.getBoundingClientRect();
        const r2 = chip.getBoundingClientRect();
        if (r1.width === 0 || r2.width === 0) {
            chip.classList.add('lit');
            done();
            return;
        }
        const clone = from.cloneNode(true) as HTMLElement;
        clone.style.cssText += `;position:fixed;left:${r1.left}px;top:${r1.top}px;width:${r1.width}px;height:${r1.height}px;margin:0;z-index:5;pointer-events:none;transform-origin:center center;`;
        root.append(clone);
        flights.push(clone);
        // l'originale sparisce subito: quello che vola è l'unico visibile
        from.classList.add('leaving');
        const dx = r2.left + r2.width / 2 - (r1.left + r1.width / 2);
        const dy = r2.top + r2.height / 2 - (r1.top + r1.height / 2);
        const s = Math.max(0.05, Math.min(1, r2.width / r1.width));
        try {
            const anim = clone.animate(
                [
                    { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                    { transform: `translate(${dx * 0.08}px, ${dy * 0.08}px) scale(1.04)`, opacity: 1, offset: 0.18 },
                    { transform: `translate(${dx}px, ${dy}px) scale(${s})`, opacity: 0.9 },
                ],
                { duration: 650, easing: 'cubic-bezier(.3,.7,.3,1)' },
            );
            anim.finished.then(() => {
                clone.remove();
                chip.classList.add('lit');
                done();
            }).catch(() => {
                clone.remove();
                chip.classList.add('lit');
                done();
            });
        } catch {
            clone.remove();
            chip.classList.add('lit');
            done();
        }
    };

    const chip = (text: string, bad: boolean): HTMLElement => {
        const c = el('div', `chsum-chip${bad ? ' bad' : ''}`, text);
        return c;
    };

    const setHero = (node: HTMLElement): void => {
        hero.replaceChildren(node);
        requestAnimationFrame(() => node.classList.add('enter'));
    };

    const clearFlights = (): void => {
        for (const c of flights) c.remove();
        flights.length = 0;
    };

    const cleanup = (): void => {
        for (const t of timers) window.clearTimeout(t);
        for (const id of rafs) cancelAnimationFrame(id);
        rafs.clear();
        clearFlights();
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

    /* ---------- schermata finale: tutto piccolo, il numero grande ---------- */

    const renderFinal = (): void => {
        skipped = true;
        for (const t of timers) window.clearTimeout(t);
        timers.length = 0;
        clearFlights();
        const explore = summary.exploration;
        head.replaceChildren();
        const headChip = chip(`${summary.title.toLowerCase()} ${summary.accentWord}`, false);
        headChip.classList.add('lit', 'head');
        head.append(headChip);
        dock.replaceChildren();
        const exploreText = explore.percent === null ? 'mappa non disponibile' : `mappa ${explore.percent}% · ${explore.visited}/${explore.total}`;
        const eChip = chip(exploreText, explore.percent !== null && explore.percent < 100);
        const hearts = summary.hearts;
        const hChip = chip(hearts.total === 0 ? 'nessun cuore qui' : `cuori ${hearts.found}/${hearts.total}`, hearts.total > 0 && hearts.found < hearts.total);
        const things = summary.things;
        const tChip = chip(`cose ${things.found}/${things.total}`, things.found < things.total);
        const sChip = chip(`capitolo + ${fmt(summary.score.chapter)}`, false);
        for (const c of [eChip, hChip, tChip, sChip]) {
            c.classList.add('lit');
            dock.append(c);
        }
        hero.replaceChildren();
        const run = el('div', 'chsum-beat enter');
        run.append(el('div', 'chsum-label', 'score attuale'));
        const runNum = el('div', 'chsum-hero-num', summary.score.runTotal === null ? '—' : fmt(summary.score.runTotal));
        if (summary.score.runTotal !== null) runNum.style.color = 'var(--chsum-accent)';
        run.append(runNum);
        if (summary.score.runTotal === null) {
            run.append(el('div', 'chsum-note', 'partita assistita · senza punteggio'));
        }
        if (summary.score.best && !summary.score.assisted) {
            const stamp = el('div', 'chsum-stamp on', 'nuovo record');
            run.append(stamp);
        }
        hero.append(run);
        hint.classList.add('lit');
        ready = true;
        fitToScreen();
    };

    const onTap = (): void => {
        if (closed || continued) return;
        if (performance.now() - t0 < 1000) return;
        if (!ready) renderFinal();
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
    later(after(600), () => {
        setHero(titleBeat);
        kick.classList.add('lit');
    });
    later(after(600), () => {
        title.classList.add('lit');
        sfx.checkpoint();
    });
    later(after(700), () => {
        sub.classList.add('lit');
        const punch = titleBeat.querySelector('.chsum-punch');
        if (punch) punch.classList.add('lit');
    });
    later(after(1900), () => {
        const headChip = chip(`${summary.title.toLowerCase()} ${summary.accentWord}`, false);
        flyTo(titleBeat, head, headChip, () => {
            headChip.classList.add('lit', 'head');
        });
        titleBeat.classList.add('leaving');
    });

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
            boom(exploreBeat);
        }
    };
    later(after(900), () => {
        setHero(exploreBeat);
        exploreBeat.classList.add('lit');
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
    later(after(2300), () => {
        const text = explore.percent === null ? 'mappa non disponibile' : `mappa ${explore.percent}% · ${explore.visited}/${explore.total}`;
        const c = chip(text, explore.percent !== null && explore.percent < 100);
        flyTo(exploreBeat, dock, c, () => {});
        exploreBeat.classList.add('leaving');
    });

    // atto terzo: i cuori
    const hearts = summary.hearts;
    const heartBeat = el('div', 'chsum-beat');
    heartBeat.append(el('div', 'chsum-label', 'cuori del realm'));
    const heartNum = el('div', 'chsum-mid', '');
    const heartRow = el('div', 'chsum-hearts');
    const heartNote = el('div', 'chsum-subline', '');
    heartBeat.append(heartNum, heartRow, heartNote);
    later(after(900), () => {
        setHero(heartBeat);
        heartBeat.classList.add('lit');
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
                        else boom(heartBeat);
                    }
                }, showAt));
            }
            if (reduced) {
                if (hearts.found === hearts.total) sfx.unlock();
                else boom(heartBeat);
            }
        });
    });
    later(after(1400 + 700 + hearts.total * 400 + 1100), () => {
        const c = chip(hearts.total === 0 ? 'nessun cuore qui' : `cuori ${hearts.found}/${hearts.total}`, hearts.total > 0 && hearts.found < hearts.total);
        flyTo(heartBeat, dock, c, () => {});
        heartBeat.classList.add('leaving');
    });

    // atto quarto: le cose
    const things = summary.things;
    const thingBeat = el('div', 'chsum-beat');
    thingBeat.append(el('div', 'chsum-label', 'cose trovate'));
    const thingNum = el('div', 'chsum-mid', '');
    const thingNote = el('div', 'chsum-subline', 'lore, maschere, tacche, amuleti, missioni');
    thingBeat.append(thingNum, thingNote);
    later(after(900), () => {
        setHero(thingBeat);
        thingBeat.classList.add('lit');
        if (things.total === 0) {
            thingNum.textContent = '—';
            thingNote.textContent = 'niente da raccogliere qui';
            return;
        }
        count(1400, things.found, (v) => {
            thingNum.textContent = `${Math.floor(v)} / ${things.total}`;
        }, () => {
            if (things.found === things.total) sfx.unlock();
            else boom(thingBeat);
        });
    });
    later(after(1400 + 700 + 1100), () => {
        const c = chip(`cose ${things.found}/${things.total}`, things.found < things.total);
        flyTo(thingBeat, dock, c, () => {});
        thingBeat.classList.add('leaving');
    });

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
    later(after(900), () => {
        setHero(scoreBeat);
        scoreBeat.classList.add('lit');
        summary.score.lines.forEach(([, value], i) => {
            later(i * 450, () => {
                const row = rowEls[i];
                if (!row || closed || skipped) return;
                row.classList.add('lit');
                row.querySelector('b')!.textContent = value;
                tick();
            });
        });
        const rowsMs = summary.score.lines.length * 450;
        later(rowsMs + 400, () => {
            if (closed || skipped) return;
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
    });
    later(after(2600 + summary.score.lines.length * 450 + 1100), () => {
        for (const row of rowEls) row.classList.add('faded');
        const c = chip(`capitolo + ${fmt(summary.score.chapter)}`, false);
        flyTo(totalNum, dock, c, () => {});
        scoreBeat.classList.add('leaving');
    });

    // atto finale: lo score in numeri
    const runBeat = el('div', 'chsum-beat');
    runBeat.append(el('div', 'chsum-label', 'score attuale'));
    const runNum = el('div', 'chsum-hero-num accent', '0');
    runBeat.append(runNum);
    later(after(1100), () => {
        setHero(runBeat);
        runBeat.classList.add('lit');
        if (summary.score.runTotal === null) {
            runNum.textContent = '—';
            runBeat.append(el('div', 'chsum-note', 'partita assistita · senza punteggio'));
            return;
        }
        count(1600, summary.score.runTotal, (v) => {
            runNum.textContent = fmt(v);
        }, () => sfx.checkpoint());
    });
    later(after(1600 + 900), () => {
        if (summary.score.best && !summary.score.assisted) {
            const stamp = el('div', 'chsum-stamp', 'nuovo record');
            runBeat.append(stamp);
            requestAnimationFrame(() => stamp.classList.add('on'));
        }
        hint.classList.add('lit');
        ready = true;
    });
}
