// uso: scripts/world/run.sh waypoints all /tmp/wp.json  poi  node scripts/playtest/bot.mjs perduta /tmp/wp.json 20
// serve un dev server attivo (GAME_URL, default :5173) e playwright con chromium (PLAYWRIGHT_MODULE se non è installato nel progetto)
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
import { readFileSync, writeFileSync } from 'node:fs';
// bot di playtest: gioca la campagna dal livello dato, tappa per tappa, nel gioco vero
const [startLevel, wpFile, maxLevels = '3', choiceMode = 'default'] = process.argv.slice(2);
const WP = JSON.parse(readFileSync(wpFile, 'utf8'));
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const log = [];
const say = (s) => { log.push(s); console.log(s); };
page.on('pageerror', (e) => say(`PAGEERROR ${e.message}`));
page.on('console', (m) => { const t = m.text(); if (m.type() === 'error' && !t.includes('bg-painted')) say(`console.error ${t}`); if (t.startsWith('[regioni]')) say(t); });
await page.goto(`${process.env.GAME_URL ?? 'http://localhost:5173'}/?level=${startLevel}`);
await page.waitForFunction(() => window.__game?.scene?.getScene('GameScene')?.player, null, { timeout: 60000 });
await page.evaluate((choiceMode) => {
  const g = window.__game;
  g.loop.sleep();
  window.__t = performance.now();
  window.__ev = [];
  const ev = (s) => window.__ev.push(s);
  __bus.on('toast', ({ text }) => ev(`toast: ${text}`));
  __bus.on('dialogue-start', ({ lines }) => ev(`dialogo: ${lines[0]?.speaker}: ${lines[0]?.text.slice(0, 60)}`));
  __bus.on('choice-show', ({ title, options }) => ev(`scelta: ${title} [${options.map((o) => o.label).join(' | ')}]`));
  __bus.on('boss-hp', (p) => { if (p && !window.__bossSeen?.[p.name]) { window.__bossSeen = { ...(window.__bossSeen || {}), [p.name]: 1 }; ev(`boss ingaggiato: ${p.name}`); } });
  __bus.on('ending', ({ id }) => ev(`FINALE ${id}`));
  __bus.on('player-died', () => ev('MORTO'));
  __bus.on('ability-unlocked', ({ ability }) => ev(`abilità: ${ability}`));
  __bus.on('zone-changed', ({ title, accentWord }) => ev(`zona: ${title} ${accentWord}`));
  window.__frames = (n) => {
    for (let i = 0; i < n; i++) {
      window.__t += 1000 / 60;
      g.scene.update(window.__t, 1000 / 60);
    }
  };
  // chiude dialoghi e scelte aperti; politica delle scelte per titolo
  window.__ui = () => {
    let acted = false;
    for (let k = 0; k < 400; k++) {
      const d = document.getElementById('dialogue');
      if (d) { window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE' })); acted = true; continue; }
      const stack = document.querySelector('.menu-stack');
      const title = document.querySelector('.choice-title')?.textContent ?? '';
      if (stack && title) {
        const btns = [...stack.querySelectorAll('button, .btn, [role=button]')];
        const all = btns.length ? btns : [...stack.children];
        let pick = 0;
        if (/varco/.test(title)) pick = 1;           // i capitoli segreti si provano a parte
        if (/walter/.test(title) && choiceMode !== 'walter') pick = 1;
        if (/pedro aspetta/.test(title)) pick = 1;   // contrastalo
        if (/le wave tornano/.test(title)) pick = 0;
        if (/trenbolone\?/.test(title)) pick = 0;
        if (/acqua/.test(title)) pick = 1;
        ev(`  -> scelgo ${pick}`);
        all[pick]?.click();
        acted = true;
        continue;
      }
      if (stack) { const b = stack.querySelector('button') ?? stack.firstElementChild; ev('  -> chiudo una card'); b?.click(); acted = true; continue; }
      break;
    }
    return acted;
  };
}, choiceMode);

const state = () => page.evaluate(() => {
  const s = window.__game.scene.getScene('GameScene');
  return { level: s.def?.id, active: s.sys.isActive(), paused: s.sys.isPaused(), exiting: s.exiting, px: s.player?.x, py: s.player?.y, boss: s.boss && s.boss.active ? { kind: s.boss.def.kind, engaged: s.boss.engaged, inv: s.boss.invulnerable, hp: s.boss.hp, x: s.boss.x, y: s.boss.y } : null };
});
const flush = async () => { const e = await page.evaluate(() => { const e = window.__ev; window.__ev = []; return e; }); e.forEach((x) => say('   ' + x)); };

// un turno di gioco su una tappa: teletrasporto, qualche fotogramma, interazioni, ui, boss
async function visit(x, y, tag) {
  await page.evaluate(({ x, y }) => {
    const s = window.__game.scene.getScene('GameScene');
    const p = s.player;
    if (!p || p.dead) return;
    p.hurt = () => false;
    p.body.reset(x, y - 10);
  }, { x, y });
  for (let k = 0; k < 6; k++) {
    await page.evaluate(() => { window.__frames(12); window.__ui(); });
  }
  // parla con chi c'è vicino (una volta per tappa)
  await page.evaluate(() => {
    const s = window.__game.scene.getScene('GameScene');
    if (s.sys.isActive() && !s.exiting) s.tryInteract();
    window.__frames(4); window.__ui(); window.__frames(10); window.__ui();
  });
}

async function fightBoss() {
  for (let round = 0; round < 80; round++) {
    const st = await state();
    if (!st.boss) return true;
    const res = await page.evaluate(() => {
      const s = window.__game.scene.getScene('GameScene');
      const b = s.boss;
      if (!b?.active) return 'giù';
      const p = s.player;
      p.hurt = () => false;
      if (!b.engaged) { p.body.reset(b.x - 120, b.y); window.__frames(20); window.__ui(); return 'avvicino'; }
      const ok = b.takeDamage(6, p.x);
      if (!ok) window.__ev.push(`colpo respinto: inv=${b.invulnerable} active=${b.active} eng=${b.engaged} hp=${b.hp} ivan=${__state.hasFlag('ivan')}`);
      window.__frames(20); window.__ui();
      return ok ? 'colpito' : 'invulnerabile';
    });
    await flush();
    if (res === 'invulnerabile') { say('   stato boss: ' + JSON.stringify(await state())); return false; }
    if (res === 'giù') { await page.evaluate(() => { for (let i = 0; i < 10; i++) { window.__frames(20); window.__ui(); } }); await flush(); return true; }
  }
  return false;
}

let levelsDone = 0;
let current = startLevel;
while (levelsDone < Number(maxLevels)) {
  const st0 = await state();
  current = st0.level;
  const wp = WP[current];
  say(`\n=== ${current} (${wp ? wp.waypoints.length : 0} tappe) ===`);
  if (!wp) { say('niente tappe per questo livello'); break; }
  for (const w of wp.waypoints) {
    const st = await state();
    if (st.level !== current) break;
    await visit(w.x, w.y, w.tag);
    await flush();
    const st2 = await state();
    if (st2.boss && st2.boss.engaged) {
      say(`   [boss ${st2.boss.kind} attivo alla tappa ${w.tag}]`);
      const ok = await fightBoss();
      if (!ok) say(`   !!! boss ${st2.boss.kind} non si può colpire (invulnerabile)`);
    }
  }
  // il capitolo è già cambiato a metà giro (uscita toccata, sonno del trenbolone...)
  if ((await state()).level !== current) { levelsDone++; continue; }
  // all'uscita
  const before = (await state()).level;
  await visit(wp.exit.x, wp.exit.y, 'uscita');
  for (let k = 0; k < 8; k++) { await page.evaluate(() => { window.__frames(15); window.__ui(); }); }
  await flush();
  const after = await state();
  if (after.level === before) {
    say(`!!! BLOCCATO: l'uscita di ${before} non porta avanti. boss=${JSON.stringify(after.boss)}`);
    // un ultimo giro: il boss residuo
    if (after.boss) { await fightBoss(); await visit(wp.exit.x, wp.exit.y, 'uscita'); for (let k = 0; k < 8; k++) await page.evaluate(() => { window.__frames(15); window.__ui(); }); await flush(); }
    const again = await state();
    if (again.level === before) break;
  }
  levelsDone++;
}
const flags = await page.evaluate(() => __state.save.flags);
say(`flag: ${flags.join(', ')}`);
writeFileSync(`bot-${startLevel}.log`, log.join('\n'));
await browser.close();
