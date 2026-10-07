// sonda in pagina: a ogni fotogramma un'impronta dello stato osservabile, indipendente da come è scritto il codice.
// si inietta prima del gioco (addInitScript); attach() aggancia bus, audio ed eventi di scena dopo il boot.
(() => {
    if (window.__h) return;
    const H = (window.__h = {
        attached: false,
        log: { ev: [], sev: [], sfx: [], mus: [], store: [], con: [] },
        anims: [],
        sites: true,
        prevSave: '',
        prevUi: '',
        uiDirty: true,
    });

    /* ---------- hash e serializzazione ---------- */

    // cyrb53: veloce, 53 bit, abbastanza per confrontare impronte
    const hash = (str, seed = 0) => {
        let h1 = 0xdeadbeef ^ seed;
        let h2 = 0x41c6ce57 ^ seed;
        for (let i = 0; i < str.length; i++) {
            const ch = str.charCodeAt(i);
            h1 = Math.imul(h1 ^ ch, 2654435761);
            h2 = Math.imul(h2 ^ ch, 1597334677);
        }
        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
        h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
        return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
    };
    H.hash = hash;
    /** due hash a 32 bit della stessa stringa */
    // fnv-1a a 32 bit e un secondo valore dallo stesso giro: la sicurezza contro le collisioni qui non serve
    const h32 = (str) => {
        let a = 0x811c9dc5;
        for (let i = 0; i < str.length; i++) a = Math.imul(a ^ str.charCodeAt(i), 16777619);
        a >>>= 0;
        return [a, Math.imul(a ^ (a >>> 16), 0x45d9f3b) >>> 0];
    };
    // multiinsieme: somma degli hash, non dipende dall'ordine e non serve ordinare né concatenare
    const bag = (items) => {
        let a = 0;
        let b = 0;
        for (const it of items) {
            const [x, y] = typeof it === 'string' ? h32(it) : it;
            a = (a + x) >>> 0;
            b = (b + y) >>> 0;
        }
        return `${items.length}.${a.toString(36)}.${b.toString(36)}`;
    };
    // sequenza: l'ordine conta
    const seq = (items) => {
        let a = 0x12345;
        let b = 0x6789a;
        for (const it of items) {
            const [x, y] = typeof it === 'string' ? h32(it) : it;
            a = (Math.imul(a, 31) + x) >>> 0;
            b = (Math.imul(b, 37) ^ y) >>> 0;
        }
        return `${items.length}.${a.toString(36)}.${b.toString(36)}`;
    };
    // la grafica si confronta al millesimo di pixel: lo stato delle entità resta a precisione piena
    const R = (v) => (typeof v === 'number' ? Math.round(v * 1000) / 1000 : v);
    const isClass = (fn) => typeof fn === 'function' && Function.prototype.toString.call(fn).startsWith('class');
    const ctorName = (o) => o?.constructor?.name ?? '?';

    /** riduce un payload a dati: niente funzioni, niente oggetti di phaser interi, chiavi in ordine */
    const reduce = (v, depth = 0) => {
        if (v === null || v === undefined) return v ?? null;
        const t = typeof v;
        if (t === 'number') return Number.isFinite(v) ? v : String(v);
        if (t === 'string' || t === 'boolean') return v;
        if (t === 'function') return 'ƒ';
        if (t !== 'object') return String(v);
        if (depth > 6) return '…';
        if (typeof Node !== 'undefined' && v instanceof Node) return `<${v.nodeName}>`;
        if (v.scene && typeof v.type === 'string' && 'x' in v) return { go: v.type, cls: ctorName(v), tex: v.texture?.key ?? null, x: v.x, y: v.y };
        if (Array.isArray(v) || ArrayBuffer.isView(v)) return Array.from(v).slice(0, 200).map((x) => reduce(x, depth + 1));
        if (v instanceof Set) return [...v].slice(0, 200).map((x) => reduce(x, depth + 1));
        if (v instanceof Map) return [...v].slice(0, 200).map(([k, x]) => [reduce(k, depth + 1), reduce(x, depth + 1)]);
        const proto = Object.getPrototypeOf(v);
        if (proto !== Object.prototype && proto !== null) {
            // istanze (scene, sistemi, geometrie): solo i campi primitivi, mai il grafo che si portano dietro
            const out = { $c: ctorName(v) };
            for (const k of Object.keys(v).sort().slice(0, 60)) {
                const x = v[k];
                if (x === null || typeof x === 'number' || typeof x === 'string' || typeof x === 'boolean') out[k] = x;
            }
            return out;
        }
        const out = {};
        for (const k of Object.keys(v).sort()) out[k] = reduce(v[k], depth + 1);
        return out;
    };
    H.reduce = reduce;

    /** chi ha chiamato: la prima riga dello stack dentro il bundle, fuori dal modulo agganciato */
    const site = () => {
        if (!H.sites) return null;
        const lines = (new Error().stack ?? '').split('\n');
        for (const l of lines) {
            const m = /\/assets\/[^:]+\.js:(\d+):(\d+)/.exec(l);
            if (m) return `${m[1]}:${m[2]}`;
        }
        return null;
    };
    const stack = () => {
        const out = [];
        for (const l of (new Error().stack ?? '').split('\n')) {
            const m = /\/assets\/[^:]+\.js:(\d+):(\d+)/.exec(l);
            if (m) out.push(`${m[1]}:${m[2]}`);
            if (out.length >= 6) break;
        }
        return out;
    };

    /* ---------- prima del gioco: salvataggi, animazioni web, dom ---------- */

    // in tempo reale (perf.mjs) la sonda dà solo gli strumenti del bot: niente agganci che costano
    const perf = !!window.__hPerf;
    // errori e avvisi sono comportamento: un refactor che ne fa sparire o comparire uno va visto
    for (const level of perf ? [] : ['error', 'warn']) {
        const orig = console[level];
        console[level] = (...args) => {
            H.log.con.push([level, args.map((a) => (a instanceof Error ? `${a.name}: ${a.message}` : typeof a === 'string' ? a : JSON.stringify(reduce(a))))]);
            return orig.apply(console, args);
        };
    }
    window.addEventListener('error', (e) => H.log.con.push(['pageerror', [String(e.message)]]));
    window.addEventListener('unhandledrejection', (e) => H.log.con.push(['rejection', [String(e.reason?.message ?? e.reason)]]));

    const ls = Storage.prototype;
    const setItem = ls.setItem;
    const removeItem = ls.removeItem;
    ls.setItem = function (k, v) {
        H.log.store.push(['set', k, String(v).length, hash(String(v))]);
        return setItem.call(this, k, v);
    };
    ls.removeItem = function (k) {
        H.log.store.push(['del', k]);
        return removeItem.call(this, k);
    };

    // le animazioni web seguono il tempo reale: qui le porta avanti l'orologio finto, fotogramma per fotogramma
    const animate = Element.prototype.animate;
    if (!perf) Element.prototype.animate = function (...args) {
        const a = animate.apply(this, args);
        a.pause();
        H.anims.push({ a, t0: performance.now() });
        return a;
    };
    H.driveAnimations = () => {
        const now = performance.now();
        H.anims = H.anims.filter(({ a, t0 }) => {
            if (a.playState === 'finished' || a.playState === 'idle') return false;
            const end = a.effect?.getComputedTiming().endTime ?? 0;
            const t = now - t0;
            if (t >= end) {
                a.finish();
                return false;
            }
            a.currentTime = t;
            return true;
        });
    };

    // le animazioni e transizioni css vanno in tempo reale: chi legge il layout a metà (il telefono che apre un'app
    // dall'icona) leggerebbe un istante a caso. nell'harness arrivano subito allo stato finale
    if (!perf) {
        const css = '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; transition-delay: 0s !important; }';
        const add = () => {
            const st = document.createElement('style');
            st.textContent = css;
            (document.head ?? document.documentElement).append(st);
        };
        if (document.documentElement) add();
        else document.addEventListener('readystatechange', add, { once: true });
    }

    let observer = null;
    const observe = () => {
        observer = new MutationObserver(() => { H.uiDirty = true; });
        observer.observe(document.documentElement, { subtree: true, childList: true, attributes: true, characterData: true });
    };
    if (document.documentElement) observe();
    else document.addEventListener('readystatechange', observe, { once: true });

    const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'LINK', 'META', 'CANVAS', 'HEAD']);
    const serUi = (el) => {
        if (el.nodeType === 3) return el.nodeValue.trim() ? JSON.stringify(el.nodeValue) : '';
        if (el.nodeType !== 1 || SKIP_TAGS.has(el.tagName)) return '';
        let s = `<${el.tagName.toLowerCase()}`;
        for (const a of el.attributes) {
            // le immagini data: sono foto del canvas, pixel della gpu: conta che ci siano, non cosa contengono
            const v = a.name === 'src' && a.value.startsWith('data:') ? 'data:' : a.value;
            s += ` ${a.name}=${JSON.stringify(v)}`;
        }
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') s += ` value=${JSON.stringify(el.value)}`;
        s += '>';
        for (const c of el.childNodes) s += serUi(c);
        return `${s}</>`;
    };

    /* ---------- dopo il boot: bus, audio, eventi di scena ---------- */

    // plumbing interno dell'audio: chiamato a ogni suono, non dice niente di nuovo
    const QUIET = new Set(['context', 'resume', 'meter', 'duckFactor', 'getLevelTrack', 'getBossTrack', 'normalRate', 'route']);
    const wrapMethods = (obj, tag, sinkKey) => {
        let depth = 0;
        const names = new Set();
        for (let p = Object.getPrototypeOf(obj); p && p !== Object.prototype; p = Object.getPrototypeOf(p)) {
            for (const n of Object.getOwnPropertyNames(p)) {
                if (n === 'constructor' || QUIET.has(n)) continue;
                const d = Object.getOwnPropertyDescriptor(p, n);
                if (d && typeof d.value === 'function') names.add(n);
            }
        }
        for (const n of names) {
            const orig = obj[n];
            obj[n] = function (...args) {
                // solo la chiamata esterna: i metodi interni dello stesso modulo non sono comportamento nuovo
                if (depth === 0) H.log[sinkKey].push([tag, n, reduce(args), site()]);
                depth++;
                try {
                    return orig.apply(this, args);
                } finally {
                    depth--;
                }
            };
        }
    };

    const PHASER_FRAME_EVENTS = new Set(['preupdate', 'update', 'postupdate', 'prerender', 'render', 'addedtoscene', 'removedfromscene']);
    const wrapSceneEvents = (scene) => {
        const ev = scene.sys.events;
        if (ev.__wrapped) return;
        ev.__wrapped = true;
        const emit = ev.emit;
        ev.emit = function (name, ...args) {
            if (!PHASER_FRAME_EVENTS.has(name)) H.log.sev.push([scene.sys.settings.key, name, reduce(args), site()]);
            return emit.call(this, name, ...args);
        };
    };

    H.attach = () => {
        if (H.attached) return true;
        if (!window.__bus || !window.__sfx || !window.__music || !window.__game?.scene?.scenes?.length) return false;
        const bus = window.__bus;
        const emit = bus.emit.bind(bus);
        bus.emit = (name, payload) => {
            H.log.ev.push([name, reduce(payload), site()]);
            return emit(name, payload);
        };
        wrapMethods(window.__sfx, "sfx", "sfx");
        wrapMethods(window.__music, "music", "mus");
        if (window.__acoustics) wrapMethods(window.__acoustics, "acoustics", "mus");
        for (const s of window.__game.scene.scenes) wrapSceneEvents(s);
        H.attached = true;
        return true;
    };

    /* ---------- l'impronta del fotogramma ---------- */

    // un numero si mescola per i suoi bit: niente stringhe per ogni campo di ogni oggetto a ogni fotogramma
    const f64 = new Float64Array(1);
    const u32 = new Uint32Array(f64.buffer);
    const strHash = new Map();
    const hstr = (str) => {
        let h = strHash.get(str);
        if (h === undefined) {
            h = h32(str)[0];
            if (strHash.size < 50000) strHash.set(str, h);
        }
        return h;
    };
    const mix = (h, v) => {
        if (typeof v === 'number') {
            f64[0] = v;
            h = Math.imul(h ^ u32[0], 16777619);
            return Math.imul(h ^ u32[1], 16777619);
        }
        return Math.imul(h ^ hstr(String(v)), 16777619);
    };
    /** i campi di un oggetto grafico, nello stesso ordine per l'impronta e per il dump */
    const objFields = (o, path) => {
        const v = [path + o.type, o.texture?.key ?? '', o.frame?.name ?? '', R(o.x), R(o.y), o.depth, R(o.alpha), o.visible ? 1 : 0,
            R(o.scaleX), R(o.scaleY), R(o.rotation), o.flipX ? 1 : 0, o.flipY ? 1 : 0, R(o.originX), R(o.originY),
            o.blendMode, R(o.scrollFactorX), R(o.scrollFactorY), o.pipeline?.name ?? ''];
        if (o.tintTopLeft !== undefined) v.push('t', o.tintTopLeft, o.tintTopRight, o.tintBottomLeft, o.tintBottomRight, o.tintFill ? 1 : 0);
        if (o.width !== undefined) v.push('wh', R(o.width), R(o.height));
        if (o.type === 'Text') v.push('tx', o.text, o.style?.color ?? '', o.style?.fontSize ?? '', o.style?.backgroundColor ?? '');
        if (o.type === 'Graphics') {
            let g = 0x811c9dc5;
            for (const c of o.commandBuffer) g = mix(g, c);
            v.push('g', g >>> 0);
        }
        if (o.fillColor !== undefined) v.push('fc', o.fillColor, R(o.fillAlpha), o.isFilled ? 1 : 0, o.strokeColor, R(o.lineWidth), o.isStroked ? 1 : 0);
        if (o.tilePositionX !== undefined) v.push('tp', R(o.tilePositionX), R(o.tilePositionY));
        if (o.type === 'ParticleEmitter') {
            let p = 0x811c9dc5;
            for (const q of o.alive) {
                p = mix(p, Math.round(q.x));
                p = mix(p, Math.round(q.y));
                p = mix(p, R(q.alpha));
                p = mix(p, R(q.scaleX));
                p = mix(p, q.tint);
            }
            v.push('pe', o.alive.length, o.emitting ? 1 : 0, o.frequency, p >>> 0);
        }
        if (o.isCropped) v.push('crop');
        if (o.mask) v.push('mask');
        return v;
    };
    const fieldsHash = (v) => {
        let h = 0x811c9dc5;
        for (const x of v) h = mix(h, x);
        h >>>= 0;
        return [h, Math.imul(h ^ (h >>> 16), 0x45d9f3b) >>> 0];
    };

    const walk = (list, path, out) => {
        for (const o of list) {
            const fields = objFields(o, path);
            out.push({ o, fields, h: fieldsHash(fields) });
            if (o.list && Array.isArray(o.list) && (o.type === 'Container' || o.type === 'Layer')) walk(o.list, `${path}${o.type}>`, out);
        }
    };

    const bodyEntry = (b) => {
        const go = b.gameObject;
        return `${go?.type ?? '-'}|${go?.texture?.key ?? ''}|${b.enable ? 1 : 0}|${b.position.x},${b.position.y}|${b.width},${b.height}|${b.velocity.x},${b.velocity.y}`
            + `|${b.blocked?.down ? 1 : 0}${b.blocked?.up ? 1 : 0}${b.blocked?.left ? 1 : 0}${b.blocked?.right ? 1 : 0}|${b.allowGravity ? 1 : 0}${b.immovable ? 1 : 0}${b.moves ? 1 : 0}`
            + `|${b.checkCollision ? `${b.checkCollision.up ? 1 : 0}${b.checkCollision.down ? 1 : 0}${b.checkCollision.left ? 1 : 0}${b.checkCollision.right ? 1 : 0}` : ''}`;
    };

    // i campi che phaser mette su ogni oggetto: li porta già la display list. si imparano dagli oggetti di phaser
    const phaserKeys = new Set();
    const learnPhaser = (o) => {
        for (const k of Object.keys(o)) phaserKeys.add(k);
    };
    const KEEP = new Set(['x', 'y', 'active', 'visible', 'alpha', 'depth', 'flipX', 'flipY', 'scaleX', 'scaleY', 'rotation']);
    /** campi primitivi propri di un'entità del gioco (classi es6, non phaser), più il corpo fisico */
    const entityData = (o) => {
        const d = { cls: ctorName(o) };
        for (const k of Object.keys(o).sort()) {
            if (phaserKeys.has(k) && !KEEP.has(k)) continue;
            const v = o[k];
            const t = typeof v;
            if (v === null || t === 'number' || t === 'string' || t === 'boolean') d[k] = t === 'number' && !Number.isFinite(v) ? String(v) : v;
            else if (v instanceof Set || v instanceof Map) d[k] = `#${v.size}`;
            else if (Array.isArray(v)) d[k] = `[${v.length}]`;
        }
        const b = o.body;
        if (b) d.$body = bodyEntry(b);
        d.$anim = o.anims?.currentAnim?.key ?? null;
        return d;
    };

    const camData = (cam) => {
        const e = (fx) => (fx ? { r: fx.isRunning ? 1 : 0, p: R(fx.progress ?? 0), a: R(fx.alpha ?? 0) } : null);
        return {
            sx: cam.scrollX, sy: cam.scrollY, z: cam.zoom, rot: cam.rotation, a: cam.alpha, x: cam.x, y: cam.y, w: cam.width, h: cam.height,
            wv: [R(cam.worldView.x), R(cam.worldView.y), R(cam.worldView.width), R(cam.worldView.height)],
            b: cam.useBounds ? [cam._bounds.x, cam._bounds.y, cam._bounds.width, cam._bounds.height] : null,
            fol: cam._follow ? ctorName(cam._follow) : null, lerp: [cam.lerp.x, cam.lerp.y],
            dz: cam.deadzone ? [cam.deadzone.width, cam.deadzone.height] : null,
            bg: cam.backgroundColor?.rgba ?? null,
            shake: e(cam.shakeEffect), flash: e(cam.flashEffect), fade: { ...e(cam.fadeEffect), d: cam.fadeEffect?.direction ? 1 : 0 },
            zfx: e(cam.zoomEffect), pan: e(cam.panEffect), rfx: e(cam.rotateToEffect),
            post: (cam.postFX?.list ?? []).map((fx) => `${fx.type ?? ctorName(fx)}:${R(fx.x ?? 0)},${R(fx.y ?? 0)},${R(fx.radius ?? 0)},${R(fx.strength ?? 0)},${fx.active ? 1 : 0}`),
            pipes: (cam.postPipelines ?? []).map((p) => p.name),
        };
    };

    const liveScenes = () => window.__game.scene.scenes.filter((s) => s.sys.settings.status === 5 || s.sys.settings.status === 6);

    const volatileSave = (save) => {
        const { record, doomsday, ...rest } = save;
        const { playMs, ...rec } = record ?? {};
        return { json: JSON.stringify({ ...rest, record: rec }), vol: { playMs, doomsday } };
    };

    /**
     * l'impronta del fotogramma. full: anche il contenuto di display list, entità, corpi e luci
     * (normalmente solo l'hash: cambia a ogni fotogramma ed è pesante da tenere).
     */
    H.sample = (f, full = false) => {
        const game = window.__game;
        const st = window.__state;
        const D = {};
        const Hs = {};
        const scenes = liveScenes();
        D.meta = {
            frame: game.loop.frame,
            scenes: game.scene.scenes.map((s) => `${s.sys.settings.key}:${s.sys.settings.status}`).join(' '),
            data: reduce(scenes.find((s) => s.sys.settings.key === 'GameScene')?.sys.settings.data ?? null),
            time: Object.fromEntries(scenes.map((s) => [s.sys.settings.key, s.sys.time?.now ?? null])),
            ts: Object.fromEntries(scenes.map((s) => [s.sys.settings.key, s.physics?.world ? s.physics.world.timeScale : null])),
            anims: H.anims.length,
        };

        const dl = [];
        const ents = [];
        const bodies = [];
        const lights = [];
        const cams = {};
        for (const s of scenes) {
            const key = s.sys.settings.key;
            const items = [];
            walk(s.children.list, `${key}:`, items);
            for (const it of items) if (!isClass(it.o.constructor) && phaserKeys.size < 400) learnPhaser(it.o);
            for (const it of items) {
                dl.push(it);
                if (isClass(it.o.constructor)) ents.push(entityData(it.o));
            }
            const w = s.physics?.world;
            if (w) {
                for (const b of w.bodies.entries ?? w.bodies) bodies.push(bodyEntry(b));
                for (const b of w.staticBodies.entries ?? w.staticBodies) bodies.push(`S${bodyEntry(b)}`);
            }
            if (s.lights) {
                lights.push(`${key}:amb${s.lights.ambientColor.r},${s.lights.ambientColor.g},${s.lights.ambientColor.b},${s.lights.active ? 1 : 0}`);
                for (const l of s.lights.lights) lights.push(`${R(l.x)},${R(l.y)},${R(l.radius)},${R(l.intensity)},${R(l.color.r)},${R(l.color.g)},${R(l.color.b)},${l.renderFlags},${R(l.scrollFactorX)}`);
            }
            if (s.cameras?.main) cams[key] = camData(s.cameras.main);
        }
        Hs.dl = bag(dl.map((x) => x.h));
        // phaser disegna per profondità con ordinamento stabile: a parità di profondità conta l'ordine nella lista
        const order = dl.map((x, i) => ({ d: x.o.depth, i, x })).sort((a, b) => a.d - b.d || a.i - b.i).map((y) => y.x);
        Hs.dlo = seq(order.map((x) => x.h));
        const entJson = ents.map((e) => JSON.stringify(e));
        Hs.ent = seq(entJson);
        Hs.bod = bag(bodies);
        Hs.lit = bag(lights);
        D.cam = cams;
        D.counts = { dl: dl.length, ent: ents.length, bod: bodies.length, lit: lights.length };

        // il geco e il boss in chiaro a ogni fotogramma: sono quasi sempre il primo posto dove si vede una differenza
        const player = dl.find((x) => x.o.attackHitbox && x.o.facing !== undefined && ctorName(x.o) === 'Player')?.o
            ?? dl.find((x) => x.o.attackHitbox && x.o.facing !== undefined && typeof x.o.cooldowns === 'function')?.o;
        D.pl = player ? { ...entityData(player), $cd: reduce(player.cooldowns?.()) } : null;
        const boss = dl.find((x) => x.o.def?.kind && 'engaged' in x.o && typeof x.o.takeDamage === 'function' && x.o.active)?.o;
        D.boss = boss ? entityData(boss) : null;

        const sv = volatileSave(st.save);
        if (sv.json !== H.prevSave) {
            D.save = sv.json;
            H.prevSave = sv.json;
        }
        Hs.save = hash(sv.json);
        D.vol = sv.vol;
        D.st = reduce({ run: st.run, godMode: st.godMode, dropped: st.dropped, portalReturn: st.portalReturn, settings: st.settings });

        const m = window.__music;
        const a = m.currentAudio;
        D.au = {
            now: m.currentPath ?? null, grave: m.graveDuck, lvl: m.levelDuck,
            vol: a ? R(a.volume) : null, rate: a ? R(a.playbackRate) : null, paused: a ? a.paused : null,
            ac: reduce(window.__acoustics?.current ?? null),
        };

        if (observer) {
            if (observer.takeRecords().length) H.uiDirty = true;
        }
        if (H.uiDirty) {
            H.uiDirty = false;
            const ui = serUi(document.body);
            if (ui !== H.prevUi) {
                D.ui = ui;
                H.prevUi = ui;
            }
        }
        Hs.ui = hash(H.prevUi);

        const L = H.log;
        const strip = (arr, keep) => arr.map((x) => x.slice(0, keep));
        D.ev = L.ev.length ? strip(L.ev, 2) : undefined;
        D.sev = L.sev.length ? strip(L.sev, 3) : undefined;
        D.sfx = L.sfx.length ? L.sfx.map((x) => [x[1], x[2]]) : undefined;
        D.mus = L.mus.length ? L.mus.map((x) => [x[0], x[1], x[2]]) : undefined;
        D.store = L.store.length ? L.store : undefined;
        D.con = L.con.length ? L.con : undefined;
        const sites = {};
        if (L.ev.length) sites.ev = L.ev.map((x) => x[2]);
        if (L.sev.length) sites.sev = L.sev.map((x) => x[3]);
        if (L.sfx.length) sites.sfx = L.sfx.map((x) => x[3]);
        if (L.mus.length) sites.mus = L.mus.map((x) => x[3]);
        H.log = { ev: [], sev: [], sfx: [], mus: [], store: [], con: [] };

        // diagnostica: non è comportamento in sé, ma dice in anticipo che qualcosa è stato dimenticato
        const gs = scenes.find((s) => s.sys.settings.key === 'GameScene');
        D.diag = gs ? {
            tweens: gs.tweens?.getTweens?.().length ?? null,
            timers: (gs.time?._active?.length ?? 0) + (gs.time?._pendingInsertion?.length ?? 0),
            colliders: gs.physics?.world?.colliders?.length ?? null,
            busHandlers: window.__bus.handlers ? [...window.__bus.handlers].map(([k, v]) => `${k}:${v.size}`).join(',') : null,
            // ascoltatori di scena: un sistema che non si stacca allo shutdown si vede qui
            sceneListeners: gs.sys.events.eventNames().map((n) => `${String(n)}:${gs.sys.events.listenerCount(n)}`).join(','),
            scaleListeners: window.__game.scale.eventNames().map((n) => `${String(n)}:${window.__game.scale.listenerCount(n)}`).join(','),
        } : null;

        for (const k of ['meta', 'cam', 'pl', 'boss', 'st', 'vol', 'au', 'ev', 'sev', 'sfx', 'mus', 'store', 'con']) Hs[k] = hash(JSON.stringify(D[k] ?? null));
        Hs.diag = hash(JSON.stringify(D.diag));

        if (full) {
            D.full = { dl: order.map((x) => x.fields.join('|')), ent: ents, bod: bodies.slice().sort(), lit: lights.slice().sort() };
        }
        return { f, H: Hs, D, sites };
    };

    H.stack = stack;

    /* ---------- strumenti del bot: trovano le cose per forma, mai per campo privato della scena ---------- */

    const gameScene = () => window.__game.scene.getScene('GameScene');
    const objects = () => gameScene()?.children?.list ?? [];
    H.find = {
        scene: gameScene,
        levelId: () => gameScene()?.sys.settings.data?.levelId ?? null,
        running: () => {
            const s = gameScene();
            return s ? s.sys.settings.status : -1;
        },
        player: () => objects().find((o) => o.attackHitbox && typeof o.cooldowns === 'function' && o.facing !== undefined) ?? null,
        boss: () => objects().find((o) => o.def?.kind && 'engaged' in o && typeof o.takeDamage === 'function' && o.active) ?? null,
        enemies: () => objects().filter((o) => o.arch && 'mode' in o && o.active),
    };
    H.bot = {
        /** cosa è aperto adesso nella ui */
        ui: () => {
            const dlg = document.getElementById('dialogue');
            const sum = document.querySelector('.chsum-overlay');
            const scr = [...document.querySelectorAll('.screen')].at(-1) ?? null;
            const items = scr ? [...scr.querySelectorAll('[data-nav]')].filter((e) => !e.hasAttribute('disabled') && e.offsetParent !== null).map((e) => e.textContent.trim().replace(/\s+/g, ' ')) : [];
            return {
                dialogue: dlg ? { speaker: dlg.querySelector('.speaker')?.textContent ?? '', text: dlg.querySelector('.text')?.textContent ?? '' } : null,
                summary: !!sum,
                screen: scr ? { cls: scr.className, title: (scr.querySelector('.sx-name, h2, h1')?.textContent ?? '').trim(), items } : null,
                phone: !!document.querySelector('.phone.open, #phone.open'),
                film: document.body.classList.contains('film'),
                inGame: [5, 6].includes(H.find.running()),
            };
        },
        /** clic sulla voce i del menu aperto (come col mouse: il gestore di click della ui) */
        pick: (i) => {
            const scr = [...document.querySelectorAll('.screen')].at(-1);
            const items = scr ? [...scr.querySelectorAll('[data-nav]')].filter((e) => !e.hasAttribute('disabled') && e.offsetParent !== null) : [];
            if (!items[i]) return false;
            items[i].click();
            return true;
        },
        state: () => {
            const p = H.find.player();
            const b = H.find.boss();
            const st = window.__state;
            return {
                level: H.find.levelId(),
                status: H.find.running(),
                p: p ? { x: p.x, y: p.y, dead: p.dead, facing: p.facing, ground: !!p.body?.blocked.down } : null,
                boss: b ? { kind: b.def.kind, x: b.x, y: b.y, hp: b.hp, engaged: b.engaged, inv: !!b.invulnerable } : null,
                hp: st.run.hp,
                maxHp: st.maxHp,
                abilities: st.save.abilities.slice(),
                flagsN: st.save.flags.length,
                barre: st.save.barre,
            };
        },
        teleport: (x, y) => {
            const p = H.find.player();
            if (!p || p.dead) return false;
            p.body.reset(x, y);
            return true;
        },
        /** le cose da raccogliere vicine, per texture: frammenti, cuori, maschere, amuleti, gocce... */
        pickups: (r = 700) => {
            const p = H.find.player();
            if (!p) return [];
            const KEYS = new Set(['fragment', 'cuore', 'maschera', 'pickup-charm', 'pickup-item', 'drop-ghost', 'color-drop', 'barra']);
            return objects()
                .filter((o) => o.active && o.visible !== false && KEYS.has(o.texture?.key) && Math.hypot(o.x - p.x, o.y - p.y) < r)
                .map((o) => ({ key: o.texture.key, x: o.x, y: o.y }))
                .sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y));
        },
        /** uno sprite per texture (lo specchio nero, il portale...) */
        sprite: (key) => {
            const o = objects().find((x) => x.active && x.texture?.key === key);
            return o ? { x: o.x, y: o.y, alpha: o.alpha } : null;
        },
        film: () => document.body.classList.contains('film'),
        /** clic sull'i-esimo elemento che corrisponde al selettore (come col mouse) */
        click: (sel, i = 0) => {
            // solo quello che si vede: i passi nascosti di una schermata restano nel dom
            const els = [...document.querySelectorAll(sel)].filter((e) => e.offsetParent !== null);
            if (!els[i]) return false;
            els[i].click();
            return true;
        },
        labels: (sel) => [...document.querySelectorAll(sel)].filter((e) => e.offsetParent !== null).map((e) => (e.getAttribute('aria-label') ?? e.textContent ?? '').trim().replace(/\s+/g, ' ')),
        /** sprite della scena per prefisso di texture: npc, microfoni, tavolette... */
        sprites: (prefixes) => objects()
            .filter((o) => o.active && o.visible !== false && typeof o.texture?.key === 'string' && prefixes.some((p) => o.texture.key.startsWith(p)))
            .map((o) => ({ key: o.texture.key, x: Math.round(o.x), y: Math.round(o.y), tint: o.tintTopLeft })),
        /** i nemici svegli vicini, dal più vicino */
        enemies: (r = 900) => {
            const p = H.find.player();
            if (!p) return [];
            return H.find.enemies()
                .filter((e) => !e.dormant && Math.hypot(e.x - p.x, e.y - p.y) < r)
                .map((e) => ({ kind: e.arch?.kind ?? '?', x: e.x, y: e.y, hp: e.hp, mode: e.mode }))
                .sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y));
        },
        flags: () => window.__state.save.flags.slice(),
    };
})();
