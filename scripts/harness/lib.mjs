// mattoni per gli scenari: salvataggi preparati, ui, movimento, combattimento.
// tutto passa da tasti veri o dagli strumenti della sonda (window.__h.bot), mai dai campi privati della scena.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

/** i tasti fisici del preset classico */
export const K = {
    left: 'KeyA', right: 'KeyD', up: 'KeyW', down: 'KeyS', jump: 'Space', attack: 'KeyJ', dash: 'KeyK',
    wave: 'KeyL', scudo: 'KeyI', riflesso: 'KeyU', eat: 'KeyC', interact: 'KeyE', phone: 'Tab', pause: 'Escape',
};

export const ALL_ABILITIES = ['scivolata', 'rimbalzo', 'aggrappo', 'riflesso', 'risonante', 'analisi', 'scudo', 'acquatossica'];

let wpCache = null;
/** le tappe del geco simulato (scripts/world/run.sh waypoints all) */
export function waypoints(levelId) {
    wpCache ??= JSON.parse(readFileSync(join(HERE, 'data/waypoints.json'), 'utf8'));
    return wpCache[levelId] ?? null;
}

let regionCache = new Map();
/** il json della regione: entità, layout, stanze (dati statici, uguali su entrambe le build) */
export function region(levelId) {
    if (!regionCache.has(levelId)) regionCache.set(levelId, JSON.parse(readFileSync(join(HERE, '../../public/regions', `${levelId}.json`), 'utf8')));
    return regionCache.get(levelId);
}

/**
 * prepara il salvataggio nella pagina, prima del livello: solo campi del formato di salvataggio,
 * così la stessa preparazione vale su main e sul refactor.
 */
export function prepareSave(patch) {
    return {
        prepare: (p) => {
            const st = window.__state;
            if (p.replace) st.save = JSON.parse(JSON.stringify(p.replace));
            const s = st.save;
            for (const [k, v] of Object.entries(p.set ?? {})) s[k] = v;
            for (const f of p.flags ?? []) if (!s.flags.includes(f)) s.flags.push(f);
            if (p.unflags) s.flags = s.flags.filter((f) => !p.unflags.includes(f));
            for (const a of p.abilities ?? []) if (!s.abilities.includes(a)) s.abilities.push(a);
            for (const [id, n] of Object.entries(p.inventory ?? {})) s.inventory[id] = n;
            for (const c of p.charms ?? []) if (!s.charms.includes(c)) s.charms.push(c);
            for (const d of p.seen ?? []) if (!s.seenDialogues.includes(d)) s.seenDialogues.push(d);
            for (const l of p.lore ?? []) if (!s.collectedLore.includes(l)) s.collectedLore.push(l);
            if (p.stats) Object.assign(s.stats, p.stats);
            if (p.ombra) { const { counts, ...rest } = p.ombra; Object.assign(s.ombra, rest); if (counts) Object.assign(s.ombra.counts, counts); }
            if (p.settings) Object.assign(st.settings, p.settings);
            if (p.dropped) st.dropped = p.dropped;
        },
        prepareArg: patch,
    };
}

/** salvataggio di un capitolo della campagna (scritto dal bot al passaggio, vedi campaign.mjs) */
export function chapterSave(levelId) {
    try {
        return JSON.parse(readFileSync(join(HERE, 'data/saves', `${levelId}.json`), 'utf8'));
    } catch {
        return null;
    }
}

/** politica di default delle scelte: per titolo, come farebbe un giocatore "di trama" */
export const DEFAULT_CHOICES = [
    [/^citelis$/, (items) => items.length - 1],
    [/orario del citelis/, 1],
    [/varco verso/, 1],
    [/walter sbadiglia/, 1],
    [/pedro aspetta/, 1],
    [/le wave tornano/, 0],
    [/trenbolone\?/, 0],
    [/acqua di smela/, 1],
    [/acqua premium/, 1],
    [/microfono rosso/, 1],
    [/bottega/, 2],
    [/tommasorveglianza/, 1],
    [/notino è a terra/, 0],
    [/boccetta di trenbolone/, 0],
    [/il 33 pulsa/, 1],
    [/biglietto sulla sua scrivania/, 1],
    [/pensiero/, 0],
];

export function choose(policy, title, items) {
    for (const [re, i] of policy) if (re.test(title)) return typeof i === 'function' ? i(items) : i;
    return 0;
}

export const ui = (ctx) => ctx.eval(() => window.__h.bot.ui());
export const botState = (ctx) => ctx.eval(() => window.__h.bot.state());

/**
 * chiude tutto quello che la ui apre: dialoghi (invio), scelte (politica), carte e riepiloghi.
 * ritorna quello che ha visto, così gli scenari possono controllare la trama.
 */
export async function resolveUI(ctx, { policy = DEFAULT_CHOICES, max = 80, log = null, death = 0 } = {}) {
    const seen = [];
    for (let k = 0; k < max; k++) {
        const u = await ui(ctx);
        if (u.dialogue) {
            await ctx.tap('Enter', 2);
            await ctx.wait(4);
            continue;
        }
        if (u.summary) {
            // il riepilogo ignora i tasti nel primo secondo
            await ctx.wait(70);
            await ctx.tap('Enter', 2);
            await ctx.wait(10);
            continue;
        }
        // il menu principale non è una scelta di gioco: lo guida lo scenario
        if (u.screen && u.screen.items.length && u.inGame) {
            const death_ = /sx-death/.test(u.screen.cls);
            const i = death_ ? death : u.screen.items.length === 1 ? 0 : choose(policy, u.screen.title, u.screen.items);
            seen.push(`${u.screen.title} -> ${u.screen.items[i]}`);
            log?.(`scelta "${u.screen.title}" -> ${u.screen.items[i]}`);
            ctx.mark(`ui:${u.screen.title.slice(0, 40)}->${i}`);
            if (death_) await ctx.wait(150);
            await ctx.eval((i) => window.__h.bot.pick(i), i);
            await ctx.wait(6);
            continue;
        }
        break;
    }
    return seen;
}

export async function teleport(ctx, x, y) {
    return ctx.eval(([x, y]) => window.__h.bot.teleport(x, y), [x, y]);
}

/** un giro di comandi veri sul posto: corsa, salto, attacco */
export async function jiggle(ctx, dir = 1) {
    const k = dir > 0 ? K.right : K.left;
    await ctx.hold([k], 12);
    await ctx.tap(K.jump, 8);
    await ctx.wait(10);
    await ctx.tap(K.attack, 3);
    await ctx.wait(12);
}

/** combatte il boss con tasti veri finché cade (o scade il tempo); ritorna l'esito */
export async function fightBoss(ctx, { maxFrames = 9000, policy, log } = {}) {
    const end = ctx.f + maxFrames;
    let hits = 0;
    while (ctx.f < end) {
        await resolveUI(ctx, { policy, log });
        const s = await botState(ctx);
        if (!s.p || s.p.dead || s.status !== 5) {
            if (s.status !== 5 && s.status !== 6) return 'livello cambiato';
            await ctx.wait(10);
            continue;
        }
        if (!s.boss) return 'giù';
        const b = s.boss;
        const dx = b.x - s.p.x;
        if (!b.engaged || Math.abs(dx) > 420 || Math.abs(b.y - s.p.y) > 300) {
            await teleport(ctx, b.x - Math.sign(dx || 1) * 140, b.y);
            await ctx.wait(20);
            continue;
        }
        const toward = dx > 0 ? K.right : K.left;
        // ci si mette di fronte, poi fendenti; ogni tanto un salto per i boss in alto
        if (Math.abs(dx) > 90) await ctx.hold([toward], 6);
        else await ctx.tap(toward, 1);
        if (b.y < s.p.y - 80) {
            await ctx.tap(K.jump, 10);
            await ctx.hold([K.up, K.attack], 3);
        } else {
            await ctx.tap(K.attack, 3);
        }
        await ctx.wait(6);
        hits++;
    }
    return 'tempo scaduto';
}

/** aspetta che parta un livello (anche lo stesso, dopo una morte) e che il geco esista */
export async function waitLevel(ctx, levelId = null, max = 2400) {
    return ctx.until(`(() => { const h = window.__h; const s = h.find.scene(); return s && s.sys.settings.status === 5 && (${JSON.stringify(levelId)} === null || h.find.levelId() === ${JSON.stringify(levelId)}) && !!h.find.player(); })()`, max, 4);
}
