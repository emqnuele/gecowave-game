// il bot della campagna: tappa per tappa nel gioco vero, con tasti veri per muoversi, parlare e combattere.
// si sposta tra le tappe col teletrasporto (le tappe sono posizioni dove il geco simulato sta in piedi):
// attraversare le stanze a tasti è il lavoro degli scenari di movimento, qui conta la trama.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { botState, DEFAULT_CHOICES, K, resolveUI as baseResolveUI, teleport, ui, waitLevel, waypoints } from './lib.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

/** ui con i film: di default si guardano fino in fondo, con skip si saltano */
export async function resolveAll(ctx, opts = {}) {
    const seen = [];
    for (let k = 0; k < 60; k++) {
        const u = await ui(ctx);
        if (u.film && !u.dialogue && !u.screen) {
            if (opts.film === 'skip') {
                await ctx.wait(30);
                await ctx.tap('Enter', 2);
                await ctx.wait(20);
            } else {
                await ctx.until(() => !document.body.classList.contains('film') || !!document.getElementById('dialogue'), 2400, 10);
            }
            continue;
        }
        if (!u.dialogue && !(u.screen && u.inGame) && !u.summary) break;
        seen.push(...(await baseResolveUI(ctx, { ...opts, max: 40 })));
    }
    return seen;
}

/** raccoglie quello che brilla vicino: frammenti, cuori, maschere, amuleti, ricompense dei boss */
export async function collect(ctx, opts = {}, r = 700) {
    for (let k = 0; k < 12; k++) {
        const items = await ctx.eval((r) => window.__h.bot.pickups(r), r);
        const next = items.find((x) => x.key !== 'barra') ?? null;
        if (!next) return;
        await teleport(ctx, next.x, next.y);
        await ctx.wait(10);
        await resolveAll(ctx, opts);
    }
}

/** combatte il boss con tasti veri; si arrende se resta invulnerabile (serve qualcosa della trama prima) */
export async function fight(ctx, opts = {}) {
    const maxFrames = opts.bossFrames ?? 12000;
    const end = ctx.f + maxFrames;
    let invuln = 0;
    let lastHp = null;
    let still = 0;
    while (ctx.f < end) {
        await resolveAll(ctx, opts);
        const s = await botState(ctx);
        if (s.status !== 5) {
            if (s.status === 6) {
                await ctx.wait(10);
                continue;
            }
            return 'scena cambiata';
        }
        if (!s.p || s.p.dead) {
            await ctx.wait(20);
            continue;
        }
        if (!s.boss) return 'giù';
        const b = s.boss;
        if (b.inv && b.engaged) {
            if (++invuln > 40) return 'invulnerabile';
        } else invuln = 0;
        if (lastHp === b.hp) still++;
        else still = 0;
        lastHp = b.hp;
        // fermo da troppo: il boss è fuori portata (in aria, dietro un muro): ci si rimette accanto
        const dx = b.x - s.p.x;
        if (!b.engaged || Math.abs(dx) > 420 || Math.abs(b.y - s.p.y) > 260 || still > 25) {
            still = 0;
            await teleport(ctx, b.x - (Math.sign(dx) || 1) * 120, b.y);
            await ctx.wait(16);
            continue;
        }
        const toward = dx > 0 ? K.right : K.left;
        if (Math.abs(dx) > 80) await ctx.hold([toward], 5);
        else await ctx.tap(toward, 1);
        if (b.y < s.p.y - 70) {
            await ctx.tap(K.jump, 9);
            await ctx.hold([K.up, K.attack], 3);
        } else if (b.y > s.p.y + 70) {
            await ctx.tap(K.jump, 6);
            await ctx.hold([K.down, K.attack], 3);
        } else {
            await ctx.tap(K.attack, 3);
        }
        await ctx.wait(5);
    }
    return 'tempo scaduto';
}

/** porta il geco dentro l'uscita e chiude il riepilogo: ritorna il livello dopo */
async function exitChapter(ctx, level, opts) {
    const wp = waypoints(level);
    if (!wp) return false;
    for (let k = 0; k < 4; k++) {
        await teleport(ctx, wp.exit.x, wp.exit.y - 12);
        await ctx.wait(20);
        await resolveAll(ctx, opts);
        const s = await botState(ctx);
        if (s.level !== level || s.status !== 5) break;
    }
    return waitLevel(ctx, null, 600);
}

/**
 * gioca il capitolo corrente: tappe in ordine di percorso, interazioni, raccolta, boss.
 * ritorna quando il capitolo è cambiato o le tappe sono finite.
 */
export async function playChapter(ctx, opts = {}) {
    const log = opts.log ?? (() => {});
    const start = await botState(ctx);
    const level = start.level;
    const wp = waypoints(level);
    if (!wp) throw new Error(`niente tappe per ${level}`);
    log(`== ${level} (${wp.waypoints.length} tappe)`);
    ctx.mark(`capitolo:${level}`);
    // anche i varchi: se entrarci lo decide la politica delle scelte (di default si resta)
    const talk = opts.talk ?? ((tag) => /^(npc|lore|portal):/.test(tag));
    let pendingBoss = false;
    for (const w of wp.waypoints) {
        let s = await botState(ctx);
        if (s.level !== level || s.status === 8) break;
        if (!s.p || s.p.dead) {
            await resolveAll(ctx, opts);
            await waitLevel(ctx, null, 600);
            s = await botState(ctx);
            if (s.level !== level) break;
        }
        if (process.env.VERBOSE === "2") log(`   tappa ${w.tag} ${Math.round(w.x)},${Math.round(w.y)} f=${ctx.f}`);
        await teleport(ctx, w.x, w.y - 10);
        await ctx.wait(8);
        await resolveAll(ctx, opts);
        if (talk(w.tag)) {
            await ctx.tap(K.interact, 3);
            await ctx.wait(6);
            await resolveAll(ctx, opts);
        }
        if (opts.jiggle !== false) {
            await ctx.tap(K.attack, 3);
            await ctx.wait(6);
        }
        await collect(ctx, opts, 420);
        s = await botState(ctx);
        if (s.level !== level) break;
        if (s.boss && (s.boss.engaged || Math.hypot(s.boss.x - s.p.x, s.boss.y - s.p.y) < 500)) {
            const r = await fight(ctx, opts);
            log(`   boss ${s.boss.kind}: ${r}`);
            if (r === 'invulnerabile') pendingBoss = true;
            await resolveAll(ctx, opts);
            await collect(ctx, opts);
        }
    }
    // i boss lasciati indietro (invulnerabili finché la trama non li apre), e quelli che arrivano dopo
    for (let k = 0; k < 8; k++) {
        const s = await botState(ctx);
        if (s.level !== level) return s.level;
        if (!s.boss) break;
        const r = await fight(ctx, opts);
        log(`   boss ${s.boss.kind} (ripresa): ${r}`);
        await resolveAll(ctx, opts);
        await collect(ctx, opts);
        if (r !== 'giù') break;
    }
    void pendingBoss;
    if (opts.beforeExit) await opts.beforeExit(ctx, level);
    const s = await botState(ctx);
    if (s.level !== level) return s.level;
    if (opts.exit === false) return level;
    await exitChapter(ctx, level, opts);
    return (await botState(ctx)).level;
}

/** scrive il salvataggio d'ingresso di un capitolo per gli scenari che partono a metà gioco */
export async function dumpSave(ctx, level) {
    const save = await ctx.eval(() => JSON.parse(JSON.stringify(window.__state.save)));
    const dir = join(HERE, 'data/saves');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, `${level}.json`), `${JSON.stringify(save)}\n`);
}

export { DEFAULT_CHOICES, K };

/** dopo il finale: riepilogo, carte e titoli di coda fino al menu */
export async function toMenu(ctx, opts = {}) {
    for (let k = 0; k < 60; k++) {
        await resolveAll(ctx, opts);
        if (await ctx.eval(() => !!window.__game.scene.isActive('MenuScene'))) break;
        await ctx.tap('Enter', 2);
        await ctx.wait(60);
    }
    await ctx.wait(120);
}
