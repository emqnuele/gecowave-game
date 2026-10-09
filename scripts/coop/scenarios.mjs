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

export const SCENARIOS = {
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
        t.check('l’host si è mosso', a.me[0] > before.partner[0] + 100, JSON.stringify(a));
        t.check('il guest lo vede dove sta', !!after.partner && Math.abs(after.partner[0] - a.me[0]) < 40, JSON.stringify(after));
        t.check('l’host vede il guest', !!a.partner && Math.abs(a.partner[0] - after.me[0]) < 40, JSON.stringify(a));
        await t.shot(t.A, 'capitolo-host');
        await t.shot(t.B, 'capitolo-guest');
    },
};
