// gli scenari a due schede: A ospita, B entra. ognuno controlla una cosa e lascia le foto in .harness/coop
const coopOf = (page) => page.evaluate(() => {
    const c = window.__coop;
    return c ? { role: c.role, partner: c.partner?.name ?? null, ready: c.partnerReady, link: c.link, open: !!c.session?.open } : null;
});

async function hostAndJoin(t, { hostName = 'Ospite', guestName = 'Entra' } = {}) {
    const { A, B } = t;
    await t.click(A, 'gioca in due');
    await t.click(A, 'rete: online');
    await t.click(A, 'ospita una partita');
    await t.type(A, '.sx-step.active .sx-name-input', hostName);
    await t.click(A, 'incidi');
    await t.click(A, 'conferma');
    await t.click(A, 'apri la partita');
    await t.until(A, () => /[A-Z0-9] [A-Z0-9]/.test(document.querySelector('.cx-code')?.textContent ?? ''));
    const code = (await A.evaluate(() => document.querySelector('.cx-code').textContent)).replace(/\s/g, '');
    await t.click(B, 'gioca in due');
    await t.click(B, 'rete: online');
    await t.click(B, 'entra in una partita');
    await t.type(B, '.cx-code-input', code);
    await t.click(B, 'entra');
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
    await t.click(B, 'gioca in due');
    if (await B.evaluate(() => [...document.querySelectorAll('button')].some((b) => (b.textContent || '').includes('rete: online')))) await t.click(B, 'rete: online');
    await t.click(B, 'entra in una partita');
    await t.type(B, '.cx-code-input', code);
    await t.click(B, 'entra');
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
    async dentro(t) {
        const { A, B } = t;
        await t.click(A, 'gioca in due');
        await t.click(A, 'rete: online');
        await t.click(A, 'ospita una partita');
        await t.type(A, '.sx-step.active .sx-name-input', 'Ospite');
        await t.click(A, 'incidi');
        await t.click(A, 'conferma');
        await t.click(A, 'apri la partita');
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
};
