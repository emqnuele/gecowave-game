// il registro del refactor: ogni membro di una classe (metodi, campi, accessori) con le sue righe su main,
// gli scenari che lo eseguono (dalla copertura per scenario) e due colonne da tenere a mano: destinazione e stato.
// uso: node scripts/harness/ledger.mjs [file.ts ...]   (default src/scenes/GameScene.ts)
// rigenerandolo, destinazione e stato già scritti in docs/refactor/ledger.md si conservano.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import ts from 'typescript';
import { BundleIndex, bundleOffset, executedAt } from './branches.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');
const REF = resolve(ROOT, '../gecowave-main');
const REF_DIST = join(REF, 'dist-dev');
const RAW = join(ROOT, '.harness/coverage/raw');
const OUT = join(ROOT, 'docs/refactor/ledger.md');
const files = process.argv.slice(2).length ? process.argv.slice(2) : ['src/scenes/GameScene.ts'];

/** i membri di ogni classe del file, con righe e posizione della prima istruzione */
function members(rel) {
    const text = readFileSync(join(REF, rel), 'utf8');
    const sf = ts.createSourceFile(rel, text, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
    const out = [];
    const line = (pos) => sf.getLineAndCharacterOfPosition(pos).line + 1;
    const col = (pos) => sf.getLineAndCharacterOfPosition(pos).character;
    sf.forEachChild((node) => {
        if (!ts.isClassDeclaration(node)) return;
        const cls = node.name?.text ?? '(anonima)';
        for (const m of node.members) {
            const name = m.name && (ts.isIdentifier(m.name) || ts.isPrivateIdentifier(m.name)) ? m.name.text : m.kind === ts.SyntaxKind.Constructor ? 'constructor' : m.name?.getText(sf) ?? '?';
            const kind = ts.isMethodDeclaration(m) ? 'metodo' : ts.isPropertyDeclaration(m) ? 'campo' : ts.isGetAccessor(m) ? 'get' : ts.isSetAccessor(m) ? 'set' : ts.isConstructorDeclaration(m) ? 'costruttore' : 'altro';
            const start = line(m.getStart(sf));
            const end = line(m.getEnd());
            const body = m.body && ts.isBlock(m.body) && m.body.statements.length ? m.body.statements[0] : null;
            const probe = body ? { line: line(body.getStart(sf)), column: col(body.getStart(sf)) } : null;
            out.push({ cls, name, kind, start, end, probe, static: !!m.modifiers?.some((x) => x.kind === ts.SyntaxKind.StaticKeyword) });
        }
    });
    return out;
}

/** le righe già scritte a mano nel registro: destinazione e stato si conservano */
function previous() {
    const keep = new Map();
    if (!existsSync(OUT)) return keep;
    for (const l of readFileSync(OUT, 'utf8').split('\n')) {
        const c = l.split('|').map((x) => x.trim());
        if (c.length < 8 || !c[1] || c[1] === 'membro' || c[1].startsWith('---')) continue;
        keep.set(`${c[0] ? '' : ''}${c[1]}@${c[2]}`, { dest: c[5], state: c[6] });
    }
    return keep;
}

const covs = existsSync(RAW) ? readdirSync(RAW).filter((f) => f.endsWith('.json.gz')).map((f) => ({ id: f.replace('.json.gz', ''), cov: JSON.parse(gunzipSync(readFileSync(join(RAW, f))).toString()) })) : [];
let base = null;
if (covs.length) {
    const bundle = join(REF_DIST, 'assets', covs[0].cov.url.split('/assets/')[1]);
    base = new BundleIndex(readFileSync(bundle, 'utf8'), JSON.parse(readFileSync(`${bundle}.map`, 'utf8')), []);
}
const ref = JSON.parse(readFileSync(join(HERE, 'reference.json'), 'utf8'));
const frames = (id) => ref.scenarios[id]?.frames ?? 1e9;
const keep = previous();

const L = [
    '# registro del refactor',
    '',
    'Ogni membro delle classi toccate, con le righe su main (`a16f39c`). **destinazione**: dove finisce nel codice nuovo; **stato**: da fare, portato, verificato. Una riga senza destinazione e senza verifica non è portata.',
    'Gli scenari sono quelli che eseguono la prima istruzione del metodo (copertura per scenario), i più corti per primi. Generato da `scripts/harness/ledger.mjs`: destinazione e stato scritti a mano si conservano.',
    '',
];
let total = 0;
let covered = 0;
for (const rel of files) {
    const ms = members(rel);
    L.push(`## ${rel}`, '', '| | membro | tipo | righe | scenari | destinazione | stato |', '|---|---|---|---|---|---|---|');
    for (const m of ms) {
        let scen = '';
        if (m.probe && base) {
            const off = bundleOffset(base, rel, m.probe.line, m.probe.column);
            const hit = off === null ? [] : covs.filter((c) => executedAt(c.cov.functions, off)).map((c) => c.id).sort((a, b) => frames(a) - frames(b));
            scen = hit.length ? `${hit.slice(0, 3).join(', ')}${hit.length > 3 ? ` (+${hit.length - 3})` : ''}` : '**mai**';
            total++;
            if (hit.length) covered++;
        }
        const prev = keep.get(`${m.name}@${m.kind}`) ?? { dest: '', state: 'da fare' };
        L.push(`| | ${m.static ? 'static ' : ''}${m.name} | ${m.kind} | ${m.start}-${m.end} | ${scen} | ${prev.dest} | ${prev.state} |`);
    }
    L.push('');
}
L.splice(5, 0, `Metodi eseguiti da almeno uno scenario: ${covered}/${total}.`, '');
writeFileSync(OUT, `${L.join('\n')}\n`);
console.log(`registro: ${covered}/${total} metodi coperti -> docs/refactor/ledger.md`);
