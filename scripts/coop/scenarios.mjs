// gli scenari a due schede: A ospita, B entra. ognuno controlla una cosa e lascia le foto in .harness/coop
const coopOf = (page) => page.evaluate(() => {
    const c = window.__coop;
    return c ? { role: c.role, partner: c.partner?.name ?? null, ready: c.partnerReady, link: c.link, open: !!c.session?.open } : null;
});

async function hostAndJoin(t, { hostName = 'Ospite', guestName = 'Entra' } = {}) {
    const { A, B } = t;
    await t.click(A, 'multiplayer');
    await t.click(A, 'crea partita');
    await t.type(A, '.sx-step.active .sx-name-input', hostName);
    await t.click(A, 'incidi');
    await t.click(A, 'conferma');
    await t.click(A, 'apri la stanza');
    await t.until(A, () => /[A-Z0-9] [A-Z0-9]/.test(document.querySelector('.cx-code')?.textContent ?? ''));
    const code = (await A.evaluate(() => document.querySelector('.cx-code').textContent)).replace(/\s/g, '');
    await t.click(B, 'multiplayer');
    await t.click(B, 'entra con un codice');
    await t.type(B, '.cx-code-input', code);
    await t.until(B, () => document.body.textContent.includes('la partita di'));
    await t.click(B, 'forgia il tuo geco');
    await t.type(B, '.sx-step.active .sx-name-input', guestName);
    await t.click(B, 'incidi');
    await t.click(B, 'entra nella partita');
    await t.until(A, () => window.__coop?.partnerReady === true);
    return code;
}

async function enterTogether(t) {
    await hostAndJoin(t);
    await t.click(t.A, 'inizia');
    for (let i = 0; i < 40; i++) {
        const inA = await t.A.evaluate(() => !!window.__game.scene.getScene('GameScene')?.sys.isActive());
        const inB = await t.B.evaluate(() => !!window.__game.scene.getScene('GameScene')?.sys.isActive());
        if (inA && inB) break;
        for (const p of [t.A, t.B]) await p.keyboard.press('Enter');
        await t.wait(400);
    }
    await t.wait(3000);
    // i dialoghi d'ingresso si chiudono a invio
    for (let i = 0; i < 12; i++) {
        for (const p of [t.A, t.B]) await p.keyboard.press('Enter');
        await t.wait(250);
    }
}

const scene = (p, fn, arg) => p.evaluate(([src, arg]) => {
    const g = window.__game.scene.getScene('GameScene');
    return new Function('g', 'arg', src)(g, arg);
}, [fn, arg]);

async function joinAs(t, code, { name = null, remembered = false } = {}) {
    const { B } = t;
    await t.click(B, 'multiplayer');
    await t.click(B, 'entra con un codice');
    await t.type(B, '.cx-code-input', code);
    await t.until(B, () => document.body.textContent.includes('la partita di'));
    if (remembered) {
        await t.click(B, 'entra come');
        return;
    }
    await t.click(B, 'forgia il tuo geco');
    await t.type(B, '.sx-step.active .sx-name-input', name ?? 'Entra');
    await t.click(B, 'incidi');
    await t.click(B, 'entra nella partita');
}

export const SCENARIOS = {
    async citelis(t) {
        await enterTogether(t);
        const { A, B } = t;
        const board = (p) => p.evaluate(() => [...document.querySelectorAll('.sx-page')].some((el) => el.textContent.includes('prossima partenza')));
        // due fermate scoperte, così il tabellone ha dove scegliere
        await B.evaluate(() => {
            const save = window.__state.save;
            const g = window.__game.scene.getScene('GameScene');
            for (const s of g.ctx.travel.busStops) if (!save.stops.includes(s.key)) save.stops.push(s.key);
        });
        await A.evaluate(() => {
            const save = window.__state.save;
            const g = window.__game.scene.getScene('GameScene');
            for (const s of g.ctx.travel.busStops) if (!save.stops.includes(s.key)) save.stops.push(s.key);
        });
        // il guest apre il palo: il tabellone deve aprirsi da lui, non dall'host
        const pole = await scene(B, `const s = g.ctx.travel.busStops[0]; return s ? { x: s.x, y: s.y } : null`);
        t.check('c’è un palo del citelis', !!pole, JSON.stringify(pole));
        await scene(B, `g.player.body.reset(arg.x - 20, arg.y)`, pole);
        await t.wait(400);
        await B.keyboard.down('KeyE');
        await t.wait(150);
        await B.keyboard.up('KeyE');
        await t.until(B, () => [...document.querySelectorAll('.sx-page')].some((el) => el.textContent.includes('prossima partenza')), 10000);
        await t.wait(400);
        t.check('il tabellone è del guest', await board(B));
        t.check('l’host non si blocca', !(await board(A)));
        const moving = await scene(A, `return Math.round(g.player.x)`);
        await A.keyboard.down('KeyD');
        await t.wait(700);
        await A.keyboard.up('KeyD');
        const moved = await scene(A, `return Math.round(g.player.x)`);
        t.check('l’host si muove mentre il guest sceglie', moved > moving + 30, `${moving} -> ${moved}`);
        await t.shot(B, 'citelis-ospite');
        // il guest sceglie un'altra fermata: viaggiano tutti e due, l'host non ha mai visto il tabellone
        const dest = await B.evaluate(() => {
            const btns = [...document.querySelectorAll('.sx-page button')].filter((b) => b.offsetParent !== null && !/resto qui|sei qui/i.test(b.textContent));
            const b = btns[btns.length - 1];
            const label = b?.textContent ?? null;
            b?.click();
            return label;
        });
        t.check('il guest sceglie una fermata', !!dest, dest);
        await t.until(A, () => window.__game.scene.getScene('GameScene')?.sys.isActive(), 30000);
        await t.until(B, () => window.__game.scene.getScene('GameScene')?.sys.isActive(), 30000);
        await t.wait(2500);
        const lvA = await A.evaluate(() => window.__state.save.levelId);
        const lvB = await B.evaluate(() => window.__state.save.levelId);
        t.check('viaggiano insieme', lvA === lvB, `host ${lvA}, ospite ${lvB}`);
        // microfono: cura anche l'ospite, non solo l'host
        await B.evaluate(() => { window.__state.run.hp = 1; });
        const cp = await scene(A, `const c = g.world.level.checkpoints[0]; return c ? { x: c.x, y: c.y } : null`);
        await scene(A, `g.player.body.reset(arg.x, arg.y)`, cp);
        await t.wait(400);
        await A.keyboard.down('KeyE');
        await t.wait(150);
        await A.keyboard.up('KeyE');
        await t.wait(1200);
        const healed = await B.evaluate(() => ({ hp: window.__state.run.hp, max: window.__state.maxHp }));
        t.check('il microfono cura l’ospite', healed.hp === healed.max, JSON.stringify(healed));
    },

    async trappole(t) {
        await enterTogether(t);
        const { A, B } = t;
        // tutti e due accanto alla prima sega, in punti diversi della sua corsa:
        // la sega deve stare nello stesso punto sui due schermi
        const saw = await scene(A, `const s = g.traps.traps.find((x) => x.kind === 'sega'); return s ? { a: s.a, b: s.b, y: s.y } : null`);
        t.check('c’è una sega in perduta', !!saw, JSON.stringify(saw));
        if (!saw) return;
        await scene(A, `g.player.body.reset(arg.a - 200, arg.y - 100)`, saw);
        await scene(B, `g.player.body.reset(arg.b + 200, arg.y - 100)`, saw);
        for (let i = 0; i < 3; i++) {
            await t.wait(1500);
            const a = await scene(A, `const s = g.traps.traps.find((x) => x.kind === 'sega'); return s ? Math.round(s.x) : -1`);
            const b = await scene(B, `const s = g.traps.traps.find((x) => x.kind === 'sega'); return s ? Math.round(s.x) : -1`);
            t.check('la sega corre uguale dai due lati', Math.abs(a - b) < 30, `host ${a}, ospite ${b}`);
        }
        // l'host ci finisce dentro: il danno arriva dove lo vede anche il guest
        const hpBefore = await A.evaluate(() => window.__state.run.hp);
        await scene(A, `const s = g.traps.traps.find((x) => x.kind === 'sega'); g.player.body.reset(s.x, s.y - 10);`);
        await t.wait(1200);
        const hpAfter = await A.evaluate(() => window.__state.run.hp);
        t.check('la sega ferisce', hpAfter < hpBefore, `${hpBefore} -> ${hpAfter}`);
        await t.shot(B, 'trappole-ospite');
    },

    async dentro(t) {
        const { A, B } = t;
        await t.click(A, 'multiplayer');
        await t.click(A, 'crea partita');
        await t.type(A, '.sx-step.active .sx-name-input', 'Ospite');
        await t.click(A, 'incidi');
        await t.click(A, 'conferma');
        await t.click(A, 'apri la stanza');
        await t.until(A, () => /[A-Z0-9] [A-Z0-9]/.test(document.querySelector('.cx-code')?.textContent ?? ''));
        const code = (await A.evaluate(() => document.querySelector('.cx-code').textContent)).replace(/\s/g, '');
        // l'host parte da solo
        await t.click(A, 'inizia');
        for (let i = 0; i < 30; i++) {
            if (await A.evaluate(() => window.__game.scene.getScene('GameScene')?.sys.settings.status === 5)) break;
            await A.keyboard.press('Enter');
            await t.wait(400);
        }
        await t.wait(2000);
        await scene(A, `g.player.body.reset(g.player.x + 300, g.player.y - 20)`);
        await t.wait(800);
        const hostAt = await scene(A, `return { x: Math.round(g.player.x), y: Math.round(g.player.y) }`);
        await joinAs(t, code);
        await t.until(B, () => window.__game.scene.getScene('GameScene')?.sys.settings.status === 5, null, 30000);
        await t.wait(2500);
        const guestAt = await scene(B, `return { x: Math.round(g.player.x), y: Math.round(g.player.y), partner: !!g.ctx.coop?.partner?.visible }`);
        t.check('chi entra dopo arriva accanto all’host', Math.abs(guestAt.x - hostAt.x) < 200 && Math.abs(guestAt.y - hostAt.y) < 200, JSON.stringify({ hostAt, guestAt }));
        t.check('e lo vede', guestAt.partner);
        const enemies = [await scene(A, `return g.ctx.groups.enemies.getChildren().filter((e) => e.active).length`), await scene(B, `return g.ctx.groups.enemies.getChildren().filter((e) => e.active).length`)];
        t.check('il mondo arriva intero', enemies[0] === enemies[1] && enemies[0] > 0, JSON.stringify(enemies));
        // l'ospite esce al menu: l'host continua, poi rientra col suo geco
        await B.keyboard.down('Escape');
        await t.wait(200);
        await B.keyboard.up('Escape');
        await t.wait(400);
        await t.click(B, 'esci al menu');
        await t.wait(1500);
        const alone = await scene(A, `return { partner: !!g.ctx.coop?.partner, active: g.sys.settings.status }`);
        t.check('l’host resta in partita senza compagno', !alone.partner && alone.active === 5, JSON.stringify(alone));
        await joinAs(t, code, { remembered: true });
        await t.until(B, () => window.__game.scene.getScene('GameScene')?.sys.settings.status === 5, null, 30000);
        await t.wait(2500);
        const back = await scene(A, `return { partner: !!g.ctx.coop?.partner?.visible, name: g.ctx.coop?.partner?.char.name }`);
        t.check('rientra col geco di prima', back.partner && back.name === 'Entra', JSON.stringify(back));
        await t.shot(B, 'dentro-ospite');
    },

    async lobby(t) {
        const code = await hostAndJoin(t);
        t.check('codice della stanza', /^[A-Z2-9]{5}$/.test(code), code);
        const a = await coopOf(t.A);
        const b = await coopOf(t.B);
        t.check('l’host vede il compagno pronto', a?.ready && a.partner === 'Entra', JSON.stringify(a));
        t.check('il guest vede l’host', b?.role === 'guest' && b.partner === 'Ospite', JSON.stringify(b));
        await t.shot(t.A, 'lobby-host');
        await t.shot(t.B, 'lobby-guest');
    },

    async morte(t) {
        await enterTogether(t);
        const look = (p) => p.evaluate(() => {
            const g = window.__game.scene.getScene('GameScene');
            return {
                band: document.querySelector('.cx-spectate .t')?.textContent ?? null,
                dead: g.player.dead, hp: window.__state.run.hp,
                chip: document.querySelector('.cx-partner .state')?.textContent ?? null,
                death: !!document.querySelector('.sx-death'),
                deathTitle: document.querySelector('.sx-death-title')?.textContent ?? null,
                x: Math.round(g.player.x), level: window.__state.save.levelId, active: g.sys.settings.status,
            };
        });
        await scene(t.B, `g.player.kill()`);
        await t.wait(800);
        const b1 = await look(t.B);
        const a1 = await look(t.A);
        t.check('l’ospite caduto guarda l’altro', b1.band === 'sei a terra' && !b1.death, JSON.stringify(b1));
        t.check('l’host lo vede a terra', a1.chip === 'a terra', JSON.stringify(a1));
        t.check('l’host continua', !a1.dead && !a1.death);
        await t.shot(t.B, 'morte-spettatore');
        // l'host accende un microfono: l'ospite si rialza lì
        const cp = await scene(t.A, `const c = g.world.level.checkpoints[0]; return c ? { x: c.x, y: c.y, id: c.id } : null`);
        t.check('c’è un microfono', !!cp, JSON.stringify(cp));
        await scene(t.A, `g.player.body.reset(arg.x + 10, arg.y - 10)`, cp);
        await t.wait(500);
        await t.A.keyboard.down('KeyE');
        await t.wait(120);
        await t.A.keyboard.up('KeyE');
        await t.wait(1200);
        const b2 = await look(t.B);
        t.check('il microfono rialza l’ospite', !b2.dead && !b2.band && Math.abs(b2.x - cp.x) < 120, JSON.stringify(b2));
        // cadono tutti e due: si riparte insieme
        await scene(t.B, `g.player.kill()`);
        await t.wait(500);
        await scene(t.A, `g.player.kill()`);
        await t.wait(2500);
        const a3 = await look(t.A);
        const b3 = await look(t.B);
        t.check('l’host vede la schermata della morte', a3.death, JSON.stringify(a3));
        t.check('l’ospite vede lo stesso sei morto', b3.death && b3.deathTitle === 'sei morto', JSON.stringify(b3));
        await t.shot(t.B, 'morte-insieme-ospite');
        await t.click(t.A, 'rialzati al microfono');
        await t.wait(4000);
        const a4 = await look(t.A);
        const b4 = await look(t.B);
        t.check('si riparte insieme', !a4.dead && !b4.dead && !b4.band && a4.active === 5 && b4.active === 5, JSON.stringify({ a4, b4 }));
    },

    async dialogo(t) {
        await enterTogether(t);
        await scene(t.A, `g.ctx.dialogues.lines([{ speaker: 'prova', color: 'green', text: 'riga uno' }, { speaker: 'prova', color: 'green', text: 'riga due' }, { speaker: 'prova', color: 'green', text: 'riga tre' }])`);
        await t.until(t.A, () => !!document.getElementById('dialogue'), null, 5000);
        await t.until(t.B, () => !!document.getElementById('dialogue'), null, 5000);
        await t.wait(500);
        const state = (p) => p.evaluate(() => ({
            dlg: !!document.getElementById('dialogue'),
            hint: document.querySelector('#dialogue .hint')?.textContent ?? null,
            paused: window.__game.scene.isPaused('GameScene'),
            text: document.querySelector('#dialogue .speaker')?.textContent ?? null,
        }));
        const a = await state(t.A);
        const b = await state(t.B);
        t.check('il dialogo della trama si apre per tutti e due', a.dlg && b.dlg, JSON.stringify({ a, b }));
        t.check('il mondo è fermo per tutti e due', a.paused && b.paused);
        t.check('l’ospite sa chi manda avanti', /manda avanti/.test(b.hint ?? ''), b.hint);
        await t.shot(t.B, 'dialogo-ospite');
        // l'ospite preme invio: non succede niente
        await t.B.keyboard.press('Enter');
        await t.B.keyboard.press('Enter');
        await t.wait(300);
        t.check('l’ospite non manda avanti', (await state(t.B)).dlg);
        for (let i = 0; i < 30 && (await state(t.A)).dlg; i++) {
            await t.A.keyboard.press('Enter');
            await t.wait(150);
        }
        await t.wait(500);
        const a2 = await state(t.A);
        const b2 = await state(t.B);
        t.check('chiuso dall’host, chiuso per tutti e due', !a2.dlg && !b2.dlg, JSON.stringify({ a2, b2 }));
        t.check('e il mondo riparte', !a2.paused && !b2.paused);

        // un dialogo aperto dall'ospite: lo vede solo lui, il mondo dell'host non si ferma
        const npc = await scene(t.A, `const p = g.ctx.npcs.at.get('markolino-dono'); return p ? { x: p.x, y: p.y } : null`);
        t.check('markolino c’è', !!npc, JSON.stringify(npc));
        await scene(t.B, `g.player.body.reset(arg.x - 30, arg.y - 10)`, npc);
        await t.wait(600);
        await t.B.keyboard.down('KeyE');
        await t.wait(120);
        await t.B.keyboard.up('KeyE');
        await t.until(t.B, () => !!document.getElementById('dialogue'), null, 5000);
        await t.wait(300);
        const a3 = await state(t.A);
        const b3 = await state(t.B);
        t.check('il dialogo dell’ospite è solo suo', b3.dlg && !a3.dlg, JSON.stringify({ a3, b3 }));
        t.check('e nessuno si ferma', !a3.paused && !b3.paused);
        const frozen = await t.B.evaluate(() => window.__game.scene.getScene('GameScene').player.invulnerable);
        t.check('chi parla non si tocca', frozen);
        await t.shot(t.B, 'dialogo-manuale-ospite');
        for (let i = 0; i < 40 && (await state(t.B)).dlg; i++) {
            await t.B.keyboard.press('Enter');
            await t.wait(150);
        }
        await t.wait(1500);
        const gift = await scene(t.A, `return g.ctx.groups && window.__state.hasFlag('markolino-dono-visto')`);
        t.check('il seguito del dialogo dell’ospite lo fa l’host', gift);
    },

    async mondo(t) {
        await enterTogether(t);
        const host = await scene(t.A, `return g.ctx.groups.enemies.getChildren().filter((e) => e.active).length`);
        const guest = await scene(t.B, `return g.ctx.groups.enemies.getChildren().filter((e) => e.active).length`);
        t.check('i nemici dell’host arrivano all’ospite', host > 0 && host === guest, `host ${host}, ospite ${guest}`);
        // l'ospite colpisce a morte il nemico più vicino: deve morire dall'host e sparire dall'ospite
        const victim = await scene(t.B, `
            const p = g.player;
            const list = g.ctx.groups.enemies.getChildren().filter((e) => e.active);
            list.sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y));
            const e = list[0];
            g.ctx.combat.dmgTo(e, 999, p.x);
            return { x: Math.round(e.x), y: Math.round(e.y) };`);
        await t.wait(800);
        const host2 = await scene(t.A, `return g.ctx.groups.enemies.getChildren().filter((e) => e.active).length`);
        const guest2 = await scene(t.B, `return g.ctx.groups.enemies.getChildren().filter((e) => e.active).length`);
        t.check('il colpo dell’ospite uccide dall’host', host2 === host - 1, `prima ${host}, dopo ${host2}`);
        t.check('e il nemico sparisce anche dall’ospite', guest2 === host2, `ospite ${guest2}`);
        const notes = await scene(t.A, `return g.ctx.groups.barre.getChildren().length`);
        const notesB = await scene(t.B, `return g.ctx.groups.barre.getChildren().length`);
        t.check('le note cadute arrivano all’ospite', notes === notesB, `host ${notes}, ospite ${notesB}`);
        // l'ospite raccoglie le note: le barre sono di tutti e due
        const barreBefore = await t.A.evaluate(() => window.__state.save.barre);
        await scene(t.B, `for (const n of g.ctx.groups.barre.getChildren()) g.player.setPosition(n.x, n.y);`);
        await scene(t.B, `const n = g.ctx.groups.barre.getChildren()[0]; if (n) { g.player.body.reset(n.x, n.y); }`);
        await t.wait(1500);
        const barreA = await t.A.evaluate(() => window.__state.save.barre);
        const barreB = await t.B.evaluate(() => window.__state.save.barre);
        t.check('le barre raccolte dall’ospite vanno all’host', barreA >= barreBefore && barreA === barreB, `prima ${barreBefore}, host ${barreA}, ospite ${barreB}, vittima ${JSON.stringify(victim)}`);
        await t.shot(t.B, 'mondo-ospite');
    },

    async start(t) {
        await hostAndJoin(t);
        await t.click(t.A, 'inizia');
        // l'intro della partita nuova: si salta con invio finché non parte il capitolo
        for (let i = 0; i < 40; i++) {
            const inA = await t.A.evaluate(() => !!window.__game.scene.getScene('GameScene')?.sys.isActive());
            const inB = await t.B.evaluate(() => !!window.__game.scene.getScene('GameScene')?.sys.isActive());
            if (inA && inB) break;
            for (const p of [t.A, t.B]) await p.keyboard.press('Enter');
            await t.wait(400);
        }
        await t.wait(4000);
        const lv = (p) => p.evaluate(() => window.__game.scene.getScene('GameScene')?.sys.isActive() ? window.__state.save.levelId : null);
        t.check('host nel capitolo', (await lv(t.A)) === 'perduta');
        t.check('guest nel capitolo', (await lv(t.B)) === 'perduta');
        const where = (p) => p.evaluate(() => {
            const g = window.__game.scene.getScene('GameScene');
            const q = g.ctx.coop?.partner;
            return { me: [Math.round(g.player.x), Math.round(g.player.y)], partner: q?.visible ? [Math.round(q.x), Math.round(q.y)] : null };
        });
        const before = await where(t.B);
        t.check('il guest vede l’host', !!before.partner, JSON.stringify(before));
        await t.A.keyboard.down('KeyD');
        await t.wait(1200);
        await t.A.keyboard.up('KeyD');
        await t.wait(600);
        const a = await where(t.A);
        const after = await where(t.B);
        t.check('l’host si è mosso', a.me[0] > before.partner[0] + 40, JSON.stringify(a));
        t.check('il guest lo vede dove sta', !!after.partner && Math.abs(after.partner[0] - a.me[0]) < 40, JSON.stringify(after));
        t.check('l’host vede il guest', !!a.partner && Math.abs(a.partner[0] - after.me[0]) < 40, JSON.stringify(a));
        await t.shot(t.A, 'capitolo-host');
        await t.shot(t.B, 'capitolo-guest');
    },

    async dispensa(t) {
        await enterTogether(t);
        const { A, B } = t;
        // l'ospite compra dalla cassa comune: paga davvero, oggetto davvero
        await A.evaluate(() => { window.__state.save.barre = 100; window.__state.persist(); });
        await t.wait(1200);
        const hb0 = await A.evaluate(() => window.__state.save.barre);
        const hc0 = await A.evaluate(() => window.__state.save.inventory.crocchetta ?? 0);
        await B.evaluate(() => window.__coop.session.send('shop-buy', { id: 'crocchetta' }));
        await t.wait(1500);
        const shop = await A.evaluate(() => ({ barre: window.__state.save.barre, croc: window.__state.save.inventory.crocchetta ?? 0 }));
        const shopB = await B.evaluate(() => ({ barre: window.__state.save.barre, croc: window.__state.save.inventory.crocchetta ?? 0 }));
        t.check('l’oste addebita la cassa comune', shop.barre === hb0 - 25 && shop.croc === hc0 + 1, JSON.stringify({ shop, hb0, hc0 }));
        t.check('l’ospite vede acquisto e resto', shopB.barre === shop.barre && shopB.croc === shop.croc, JSON.stringify(shopB));
        // l'ospite mangia: il boccone esce dallo zaino, la cura arriva a lui
        await B.evaluate(() => { window.__state.run.hp = 2; });
        await B.evaluate(() => window.__coop.session.send('eat-use', { id: 'crocchetta', amount: 1 }));
        await t.wait(1500);
        const eat = await B.evaluate(() => ({ hp: window.__state.run.hp, croc: window.__state.save.inventory.crocchetta ?? 0 }));
        const eatA = await A.evaluate(() => window.__state.save.inventory.crocchetta ?? 0);
        t.check('il boccone cura l’ospite', eat.hp === 3, JSON.stringify(eat));
        t.check('e sparisce dallo zaino comune', eat.croc === hc0 && eatA === hc0, JSON.stringify({ eat, eatA, hc0 }));
        // mente: la porta chiede a chi bussa; chi sbaglia paga lui, chi indovina la abbatte a tutti
        await scene(A, `g.ctx.flow.gotoLevel('mente')`);
        await t.until(A, () => window.__game.scene.getScene('GameScene')?.sys.isActive() && window.__state.save.levelId === 'mente', null, 30000);
        await t.until(B, () => window.__game.scene.getScene('GameScene')?.sys.isActive() && window.__state.save.levelId === 'mente', null, 30000);
        await t.wait(2500);
        // l'intro di mente è un dialogo condiviso: si manda avanti prima di bussare
        for (let i = 0; i < 15; i++) {
            const open = await B.evaluate(() => !!document.getElementById('dialogue'));
            if (!open) break;
            for (const p of [A, B]) await p.keyboard.press('Enter');
            await t.wait(300);
        }
        const door = await scene(B, `const d = g.ctx.groups.doors.getChildren()[0]; return d ? { x: Math.round(d.x), y: Math.round(d.y) } : null`);
        t.check('c’è una porta-quiz in mente', !!door, JSON.stringify(door));
        if (!door) return;
        await scene(B, `g.player.body.reset(arg.x, arg.y + 40)`, door);
        await t.wait(400);
        let wrongOk = false;
        let rightOk = false;
        // la risposta giusta dipende dal tentativo: si azzera e si provano le opzioni in ordine, stessa porta
        for (let d = 0; d < 4 && !(wrongOk && rightOk); d++) {
            const hasDoor = await scene(B, `return g.ctx.groups.doors.getChildren().length > 0`);
            if (!hasDoor) break;
            for (let opt = 0; opt < 3 && !(wrongOk && rightOk); opt++) {
                await scene(A, `g.ctx.chapter.quizAttempts.clear()`);
                await B.evaluate(() => { window.__state.run.hp = window.__state.maxHp; });
                await scene(A, `for (const e of g.ctx.groups.enemies.getChildren()) { try { g.ctx.combat.dmgTo(e, 9999, e.x - 10); } catch {} }`);
                await t.wait(400);
                const near = await scene(B, `const ds = g.ctx.groups.doors.getChildren(); let best = null, bd = 1e9; for (const x of ds) { const d = Math.hypot(x.x - g.player.x, x.y - g.player.y); if (d < bd) { bd = d; best = { x: Math.round(x.x), y: Math.round(x.y) }; } } return best`);
                if (!near) break;
                await scene(B, `g.player.body.reset(arg.x, arg.y + 40)`, near);
                await t.wait(400);
                await B.keyboard.down('KeyE');
                await t.wait(150);
                await B.keyboard.up('KeyE');
                try {
                    await t.until(B, () => [...document.querySelectorAll('.sx-page button')].filter((b) => b.offsetParent !== null).length >= 2, null, 8000);
                } catch {
                    break;
                }
                const hpA0 = await A.evaluate(() => window.__state.run.hp);
                const hpB0 = await B.evaluate(() => window.__state.run.hp);
                await B.evaluate((o) => {
                    const btns = [...document.querySelectorAll('.sx-page button')].filter((b) => b.offsetParent !== null);
                    btns[Math.min(o, btns.length - 1)].click();
                }, opt);
                await t.wait(1500);
                const hurtB = await B.evaluate(() => window.__state.run.hp);
                const hurtA = await A.evaluate(() => window.__state.run.hp);
                const leftB = await scene(B, `return g.ctx.groups.doors.getChildren().length`);
                const leftA = await scene(A, `return g.ctx.groups.doors.getChildren().length`);
                if (leftB === 0 && leftA === 0) rightOk = true;
                else if (hurtB < hpB0 && hurtA === hpA0) wrongOk = true;
            }
        }
        t.check('chi sbaglia paga lui, host intatto', wrongOk);
        t.check('chi indovina abbatte a tutti', rightOk);
        await t.shot(B, 'dispensa-ospite');
    },

    async corsa(t) {
        await enterTogether(t);
        const { A, B } = t;
        // palo con orario: se perduta non ce l'ha si va al bus
        let post = await scene(B, `return g.ctx.challenges.trial?.post ?? null`);
        if (!post) {
            await scene(A, `g.ctx.flow.gotoLevel('bus')`);
            await t.until(A, () => window.__game.scene.getScene('GameScene')?.sys.isActive() && window.__state.save.levelId === 'bus', null, 30000);
            await t.until(B, () => window.__game.scene.getScene('GameScene')?.sys.isActive() && window.__state.save.levelId === 'bus', null, 30000);
            await t.wait(2500);
            post = await scene(B, `return g.ctx.challenges.trial?.post ?? null`);
        }
        t.check('c’è un palo del trial', !!post, JSON.stringify(post));
        if (!post) return;
        // corre l'ospite: la scelta apre a lui, il cronometro parte dall'host
        await scene(B, `g.player.body.reset(arg.x - 20, arg.y)`, post);
        await t.wait(400);
        await B.keyboard.down('KeyE');
        await t.wait(150);
        await B.keyboard.up('KeyE');
        await t.until(B, () => [...document.querySelectorAll('.sx-page button')].filter((b) => b.offsetParent !== null).some((b) => /corri/i.test(b.textContent || '')), null, 10000);
        await B.evaluate(() => {
            [...document.querySelectorAll('.sx-page button')].find((b) => b.offsetParent !== null && /corri/i.test(b.textContent || '')).click();
        });
        await t.wait(1200);
        const run = await scene(A, `const r = g.ctx.challenges.trial?.run; return r ? { runner: r.runner, to: { x: Math.round(r.to.x), y: Math.round(r.to.y) } } : null`);
        t.check('la corsa parte per l’ospite', run?.runner === 'guest', JSON.stringify(run));
        const seen = await scene(B, `return !!g.ctx.challenges.trial?.run`);
        t.check('l’ospite vede boa e cronometro', seen);
        if (!run) return;
        // l'host al traguardo non chiude la corsa dell'altro
        await scene(A, `g.player.body.reset(arg.x, arg.y)`, run.to);
        await t.wait(1500);
        const early = await scene(A, `return window.__state.save.trials[window.__state.save.levelId] ?? null`);
        t.check('il traguardo dell’host non vale', early === null || early === undefined, String(early));
        // l'ospite al traguardo: vince davvero
        await scene(B, `g.player.body.reset(arg.x, arg.y)`, run.to);
        await t.wait(2000);
        const record = await scene(A, `return window.__state.save.trials[window.__state.save.levelId] ?? null`);
        t.check('l’ospite chiude la sua corsa', typeof record === 'number', String(record));
        await t.shot(B, 'corsa-ospite');
    },

    async finale(t) {
        await enterTogether(t);
        const { A, B } = t;
        // sconfitta diretta: riepilogo, titoli e menu su entrambi (l'ospite al titolo, non in lobby)
        await scene(A, `g.ctx.flow.endGame('sconfitta')`);
        for (let i = 0; i < 120; i++) {
            const aMenu = await A.evaluate(() => !!window.__game.scene.isActive('MenuScene'));
            const bMenu = await B.evaluate(() => !!window.__game.scene.isActive('MenuScene'));
            if (aMenu && bMenu) break;
            for (const p of [A, B]) await p.keyboard.press('Enter');
            for (const p of [A, B]) {
                await p.evaluate(() => {
                    const b = [...document.querySelectorAll('.sx-page button, .credits-screen button')].find((x) => x.offsetParent !== null && /torna al menu|consegna le wave|continua|avanti|chiudi|rialzati/i.test(x.textContent || ''));
                    if (b) b.click();
                }).catch(() => {});
            }
            await t.wait(1000);
        }
        const aMenu = await A.evaluate(() => !!window.__game.scene.isActive('MenuScene'));
        const bMenu = await B.evaluate(() => !!window.__game.scene.isActive('MenuScene'));
        t.check('titoli finiti, menu su entrambi', aMenu && bMenu, `A=${aMenu} B=${bMenu}`);
        t.check('nessuno resta in lobby', !(await B.evaluate(() => !!document.querySelector('.cx-lobby'))), '');
        await t.shot(A, 'finale-host');
        await t.shot(B, 'finale-guest');
    },
};
