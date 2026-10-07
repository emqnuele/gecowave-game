// racconta una traccia: livelli, segni del bot, dialoghi, scelte, toast, morti, boss, finali, errori.
// uso: node scripts/harness/show.mjs <traccia.jsonl.gz> [--all]   (--all: anche suoni ed eventi di scena)
import { readTrace } from './tracediff.mjs';

const [file, flag] = process.argv.slice(2);
const T = readTrace(file);
const all = flag === '--all';
const out = [];
const marks = new Map();
for (const m of T.marks) marks.set(m.f, [...(marks.get(m.f) ?? []), m.mark]);
let level = null;
const QUIET = new Set(['wave-cooldowns', 'hp-changed', 'flow-changed', 'barre-changed', 'doomsday-changed', 'trial-timer', 'input-device', 'inventory-changed', 'messages-changed', 'abilities-changed', 'fragments-changed']);
for (const s of T.samples) {
    for (const m of marks.get(s.f) ?? []) out.push(`${s.f} # ${m}`);
    const lv = s.D.meta?.data?.levelId ?? null;
    if (lv !== level) {
        out.push(`${s.f} == livello ${lv}`);
        level = lv;
    }
    for (const [name, p] of s.D.ev ?? []) {
        if (QUIET.has(name) && !all) continue;
        let t = '';
        if (name === 'dialogue-start') t = `${p.lines?.[0]?.speaker}: ${p.lines?.[0]?.text}`.slice(0, 90);
        else if (name === 'choice-show') t = `${p.title} [${(p.options ?? []).map((o) => o.label).join(' | ')}]`.slice(0, 140);
        else if (name === 'toast' || name === 'wavesung' || name === 'bark') t = (p.text ?? '').slice(0, 90);
        else if (name === 'boss-hp') t = p ? `${p.name} ${p.hp}/${p.maxHp}` : 'via';
        else t = JSON.stringify(p).slice(0, 120);
        out.push(`${s.f} ${name} ${t}`);
    }
    if (all) for (const [sc, name, a] of s.D.sev ?? []) out.push(`${s.f} [${sc}] ${name} ${JSON.stringify(a).slice(0, 80)}`);
    if (all) for (const [m, a] of s.D.sfx ?? []) out.push(`${s.f} sfx.${m} ${JSON.stringify(a).slice(0, 60)}`);
    for (const [kind, msg] of s.D.con ?? []) out.push(`${s.f} !! ${kind}: ${msg.join(' ').slice(0, 160)}`);
}
console.log(out.join('\n'));
console.log(`\nfotogrammi ${T.samples.length}, fine: ${JSON.stringify(T.end)}`);
