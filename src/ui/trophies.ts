import { ACHIEVEMENTS, type AchievementDef } from '../content/achievements';
import { LEVELS, LEVEL_ORDER } from '../content/levels';
import { achievementsBlocked } from '../core/achievements';
import { sfx } from '../audio/sfx';
import { state } from '../core/state';
import { loadBoard } from '../core/score';
import { el } from './dom';
import './trophies.css';

/* la bacheca dei trofei: medaglie in griglia, una scheda che sale dal basso
   e i record per capitolo. la stessa nel telefono e nel menu principale.
   niente vetro sfocato qui dentro: sono cinquanta medaglie, devono scorrere lisce */

type Filter = 'tutti' | 'presi' | 'mancanti';

function node(tag: keyof HTMLElementTagNameMap, cls: string, value?: string): HTMLElement {
    const n = el(tag, cls);
    if (value !== undefined) n.textContent = value;
    return n;
}

const ENDING_NAMES: Record<string, string> = {
    riscatto: 'finale vero', consegna: 'wave consegnate', dei: 'più forte degli dei', pedro: 'il patto', sconfitta: 'sconfitta',
};

const RING_R = 30;
const RING_C = 2 * Math.PI * RING_R;

function ring(have: number, total: number): HTMLElement {
    const wrap = node('div', 'cab-ring');
    const k = total ? have / total : 0;
    wrap.innerHTML = `<svg viewBox="0 0 72 72" aria-hidden="true">
<circle cx="36" cy="36" r="${RING_R}" class="track"/>
<circle cx="36" cy="36" r="${RING_R}" class="fill" stroke-dasharray="${RING_C}" stroke-dashoffset="${RING_C * (1 - k)}"/>
</svg>`;
    const count = node('div', 'count');
    count.append(node('b', '', String(have)), node('span', '', `/${total}`));
    wrap.append(count);
    return wrap;
}

function fmtTime(ms: number): string {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms / 1000) % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
}

/** costruisce la bacheca dentro root; wide = layout largo del menu principale */
export function buildTrophyCabinet(root: HTMLElement, opts: { wide?: boolean } = {}): void {
    const got = new Set(state.save.achievements);
    const total = ACHIEVEMENTS.length;
    const blocked = achievementsBlocked();
    const cab = node('div', `cabinet${opts.wide ? ' wide' : ''}${blocked ? ' assisted' : ''}`);

    const head = node('div', 'cab-head');
    head.append(ring(got.size, total));
    const intro = node('div', 'cab-intro');
    const left = total - got.size;
    intro.append(
        node('div', 'cab-title', 'BACHECA'),
        node('div', 'cab-line', left === 0 ? 'tutte. il realm ti deve una statua.' : left === 1 ? 'ne manca una. la peggiore, di solito.' : `ne mancano ${left}. il realm è lungo.`),
    );
    head.append(intro);
    cab.append(head);

    if (blocked) {
        cab.append(node('div', 'cab-warn', 'hai usato la modalità assistita.'));
    }

    const tabs = node('div', 'cab-tabs');
    tabs.setAttribute('role', 'tablist');
    const grid = node('div', 'medals');
    const sheet = node('div', 'cab-sheet');
    sheet.setAttribute('aria-live', 'polite');
    let filter: Filter = 'tutti';
    let openId: string | null = null;

    const showSheet = (a: AchievementDef | null) => {
        sheet.replaceChildren();
        openId = a?.id ?? null;
        grid.querySelectorAll('.medal.selected').forEach((m) => m.classList.remove('selected'));
        if (!a) {
            sheet.classList.remove('open');
            return;
        }
        grid.querySelector(`[data-id="${a.id}"]`)?.classList.add('selected');
        const have = got.has(a.id);
        const hidden = a.secret && !have;
        sheet.classList.toggle('have', have);
        const close = node('button', 'sheet-close', '×');
        close.setAttribute('aria-label', 'chiudi');
        close.addEventListener('click', () => showSheet(null));
        sheet.append(
            close,
            node('div', 'sheet-icon', hidden ? '?' : a.icon),
            node('div', 'sheet-name', hidden ? 'trofeo segreto' : a.name),
            node('div', 'sheet-desc', hidden ? 'si scopre solo prendendolo. gioca, sbaglia, scegli male: prima o poi salta fuori.' : a.desc),
            node('div', 'sheet-state', have ? 'preso' : achievementsBlocked() ? 'bloccato dalla modalità assistita' : 'ancora da prendere'),
        );
        sheet.classList.add('open');
    };

    const renderGrid = () => {
        grid.replaceChildren();
        const list = ACHIEVEMENTS.filter((a) => (filter === 'presi' ? got.has(a.id) : filter === 'mancanti' ? !got.has(a.id) : true));
        if (!list.length) {
            grid.append(node('div', 'medals-empty', filter === 'presi' ? 'ancora nessuno. il primo arriva prima di quanto pensi.' : 'presi tutti. non c\'è altro da lucidare.'));
            return;
        }
        list.forEach((a, i) => {
            const have = got.has(a.id);
            const hidden = a.secret && !have;
            const m = node('button', `medal${have ? ' have' : ''}${hidden ? ' secret' : ''}`);
            m.dataset.id = a.id;
            m.style.setProperty('--tilt', `${((i * 37) % 7) - 3}deg`);
            m.setAttribute('aria-label', hidden ? 'trofeo segreto' : `${a.name}${have ? ', preso' : ''}`);
            const disc = node('span', 'disc');
            disc.append(node('span', 'glyph', hidden ? '?' : a.icon));
            m.append(disc, node('span', 'medal-name', hidden ? '???' : a.name));
            m.addEventListener('click', () => {
                sfx.ui();
                showSheet(openId === a.id ? null : a);
            });
            grid.append(m);
        });
    };

    for (const f of ['tutti', 'presi', 'mancanti'] as Filter[]) {
        const n = f === 'tutti' ? total : f === 'presi' ? got.size : total - got.size;
        const t = node('button', `cab-tab${f === filter ? ' on' : ''}`);
        t.setAttribute('role', 'tab');
        t.append(node('span', '', f), node('i', '', String(n)));
        t.addEventListener('click', () => {
            if (filter === f) return;
            filter = f;
            tabs.querySelectorAll('.cab-tab').forEach((x) => x.classList.toggle('on', x === t));
            sfx.ui();
            showSheet(null);
            renderGrid();
        });
        tabs.append(t);
    }
    cab.append(tabs, grid, sheet);
    renderGrid();

    // i capitoli finiti: record, e al tocco il conto dell'ultima uscita voce per voce
    const recs = node('div', 'records');
    recs.append(node('div', 'records-title', 'capitoli'));
    let sum = 0;
    let rows = 0;
    for (const id of [...LEVEL_ORDER, ...Object.keys(LEVELS).filter((k) => !LEVEL_ORDER.includes(k))]) {
        const sc = state.save.scores[id];
        const log = state.save.chapterLog?.[id];
        if (!sc && !log) continue;
        rows++;
        if (sc) sum += sc.score;
        const assistedOnly = !sc && !!log?.assisted;
        const r = node('button', `rec rec-open${assistedOnly ? ' assisted' : ''}`) as HTMLButtonElement;
        r.type = 'button';
        r.setAttribute('aria-expanded', 'false');
        const meta = sc ? `${fmtTime(sc.timeMs)}  ${Math.round(sc.explored * 100)}%` : log ? `${fmtTime(log.timeMs)}  assistito` : '';
        r.append(
            node('span', 'rec-name', LEVELS[id]?.accentWord ?? id),
            node('span', 'rec-meta', meta),
            node('b', 'rec-score', sc ? sc.score.toLocaleString('it-IT') : '—'),
        );
        const detail = node('div', 'rec-detail');
        detail.hidden = true;
        if (log) {
            const d = new Date(log.at);
            detail.append(node('div', 'rec-detail-head', `ultima uscita · ${fmtTime(log.timeMs)} · ${d.getDate()}/${d.getMonth() + 1}${log.best ? ' · record' : ''}${log.assisted ? ' · assistita' : ''}`));
            for (const [k, v] of log.lines) {
                const line = node('div', 'rec-line');
                line.append(node('span', '', k), node('b', '', v));
                detail.append(line);
            }
            const tot = node('div', 'rec-line total');
            tot.append(node('span', '', 'totale'), node('b', '', log.assisted ? 'senza punteggio' : log.score.toLocaleString('it-IT')));
            detail.append(tot);
        } else {
            detail.append(node('div', 'rec-detail-head', 'il conto voce per voce arriva alla prossima uscita dal capitolo.'));
        }
        r.addEventListener('click', () => {
            detail.hidden = !detail.hidden;
            r.setAttribute('aria-expanded', String(!detail.hidden));
            sfx.ui();
        });
        recs.append(r, detail);
    }
    if (rows) {
        const tot = node('div', 'rec total');
        tot.append(node('span', 'rec-name', 'totale'), node('span', 'rec-meta', ''), node('b', 'rec-score', sum.toLocaleString('it-IT')));
        recs.append(tot);
    } else {
        recs.append(node('div', 'medals-empty', 'nessun capitolo finito. il conto si scrive all\'uscita.'));
    }
    cab.append(recs);

    // la classifica delle partite finite: sopravvive alle partite nuove
    const board = loadBoard();
    const lb = node('div', 'records');
    lb.append(node('div', 'records-title', 'classifica delle partite'));
    if (!board.length) lb.append(node('div', 'medals-empty', 'ancora nessuna partita finita. il primo nome qui sopra sarà il tuo.'));
    board.forEach((e, i) => {
        const r = node('div', `rec board${i === 0 ? ' first' : ''}`);
        const d = new Date(e.at);
        r.append(
            node('span', 'rec-name', `${i + 1}. ${e.name}`),
            node('span', 'rec-meta', `${ENDING_NAMES[e.ending] ?? e.ending}  ${d.getDate()}/${d.getMonth() + 1}`),
            node('b', 'rec-score', e.score.toLocaleString('it-IT')),
        );
        lb.append(r);
    });
    cab.append(lb);
    root.append(cab);
}
