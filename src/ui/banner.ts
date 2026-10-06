import { sfx } from '../engine/sfx';
import { el, ui } from './dom';
import './banner.css';

/* notifiche del telefono: entrano da destra, piccole, opache come il
   telefono stesso, e se ne vanno da sole. un tocco le chiude prima */

const ICONS: Record<string, string> = {
    wavesung: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 19 16h-8l-4.5 3.5V16H5a1.5 1.5 0 0 1-1.5-1.5v-8A1.5 1.5 0 0 1 5 5Z"/><path d="M8 9.5h8M8 12.5h5"/></svg>',
    bacheca: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10v3a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4.5a2.5 2.5 0 0 0 3 3.2M17 6h2.5a2.5 2.5 0 0 1-3 3.2"/><path d="M12 12v4M8.5 20h7M10 16h4l.6 4h-5.2l.6-4Z"/></svg>',
};

export interface BannerOpts {
    app: keyof typeof ICONS;
    title: string;
    body: string;
    accent?: 'gold' | 'blue' | 'plain';
    /** titolo su più righe (i messaggi lunghi non si tagliano) */
    wrap?: boolean;
    ms?: number;
}

export function phoneBanner(o: BannerOpts): void {
    let stack = document.getElementById('phone-banners');
    if (!stack) {
        stack = el('div', '');
        stack.id = 'phone-banners';
        ui().append(stack);
    }
    const b = el('div', `pb${o.accent ? ` pb-${o.accent}` : ''}`);
    b.setAttribute('role', 'status');
    const icon = el('div', 'pb-icon');
    icon.innerHTML = ICONS[o.app] ?? '';
    const txt = el('div', 'pb-text');
    const head = el('div', 'pb-head');
    const app = el('span', 'pb-app');
    app.textContent = o.app;
    const when = el('span', 'pb-when');
    when.textContent = 'ora';
    head.append(app, when);
    const title = el('div', 'pb-title');
    title.textContent = o.title;
    const body = el('div', `pb-body${o.wrap ? ' pb-wrap' : ''}`);
    body.textContent = o.body;
    txt.append(head, title, body);
    b.append(icon, txt);
    stack.prepend(b);
    sfx.pickup();
    let gone = false;
    const close = () => {
        if (gone) return;
        gone = true;
        b.classList.add('pb-out');
        setTimeout(() => b.remove(), 320);
    };
    b.addEventListener('click', close);
    setTimeout(close, o.ms ?? 4200);
}
