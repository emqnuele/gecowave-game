// censimento delle estrazioni casuali di src/: ogni pescata dalle due sequenze (rng.logic, rng.fx) e ogni
// Math.random o helper di phaser rimasto, con file, riga, funzione che lo contiene e il testo.
// fuori dal seme in src/core/rng.ts nessuno deve pescare da Math.random: se succede esce con errore.
// uso: node scripts/harness/caso.mjs   -> docs/refactor/caso.md
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SRC = join(ROOT, 'src');
// gli helper di phaser che chiamano Math.random dentro
const STREAM = /^rng\.(logic|fx)\.(next|between|shuffle)$/;
const PHASER = /^(Phaser\.)?(Math\.(Between|FloatBetween|RND\.\w+|RandomXY|RandomXYZ|RandomXYZW|Rotate)|Utils\.Array\.(Shuffle|GetRandom))$/;

const files = [];
const walk = (d) => {
    for (const n of readdirSync(d)) {
        const p = join(d, n);
        if (statSync(p).isDirectory()) walk(p);
        else if (n.endsWith('.ts')) files.push(p);
    }
};
walk(SRC);

const rows = [];
for (const file of files.sort()) {
    const text = readFileSync(file, 'utf8');
    const sf = ts.createSourceFile(file, text, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
    const rel = relative(ROOT, file);
    const owner = (node) => {
        for (let n = node.parent; n; n = n.parent) {
            if ((ts.isMethodDeclaration(n) || ts.isFunctionDeclaration(n) || ts.isGetAccessor(n)) && n.name) {
                const cls = ts.isClassDeclaration(n.parent) && n.parent.name ? `${n.parent.name.text}.` : '';
                return `${cls}${n.name.getText(sf)}`;
            }
            if (ts.isConstructorDeclaration(n)) return `${n.parent.name?.text ?? ''}.constructor`;
            if (ts.isVariableDeclaration(n) && n.initializer && (ts.isArrowFunction(n.initializer) || ts.isFunctionExpression(n.initializer))) return n.name.getText(sf);
        }
        return '(modulo)';
    };
    const visit = (node) => {
        if (ts.isCallExpression(node)) {
            const callee = node.expression.getText(sf);
            if (callee === 'Math.random' || PHASER.test(callee) || STREAM.test(callee)) {
                const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
                const src = text.split('\n')[line].trim();
                rows.push({ rel, line: line + 1, fn: owner(node), callee, src });
            }
        }
        ts.forEachChild(node, visit);
    };
    visit(sf);
}

// il tipo scritto a mano si conserva per testo della riga: sopravvive agli spostamenti del refactor
const kept = new Map();
const OUT = join(ROOT, 'docs/refactor/caso.md');
if (existsSync(OUT)) {
    for (const l of readFileSync(OUT, 'utf8').split('\n')) {
        const m = /^\| \d+ \| [^|]+ \| [^|]+ \| (.*) \|\s*([^|]*?)\s*\|$/.exec(l);
        // il cosmetico si legge dal codice: si conserva solo quello che il codice non dice (sottotipo della logica, seme)
        if (m && m[2] === 'cosmetico') continue;
        if (m && m[2]) (kept.get(m[1]) ?? kept.set(m[1], []).get(m[1])).push(m[2]);
    }
}
const byFile = new Map();
for (const r of rows) byFile.set(r.rel, [...(byFile.get(r.rel) ?? []), r]);
const loose = rows.filter((r) => !STREAM.test(r.callee) && r.rel !== 'src/core/rng.ts');
const count = (s) => rows.filter((r) => r.callee.startsWith(s)).length;
const L = [
    '# il caso nel codice',
    '',
    `Generato da \`scripts/harness/caso.mjs\` su \`src/\`: ${rows.length} estrazioni casuali in ${byFile.size} file. ${count('rng.logic.')} dalla sequenza della logica, ${count('rng.fx.')} da quella cosmetica, ${rows.length - count('rng.')} da \`Math.random\` (solo il seme).`,
    '',
    'Il gioco pesca da due sequenze con seme (`src/core/rng.ts`, ripartono a ogni livello da semi pescati dal caso del browser): **logica** decide cosa succede, **cosmetico** solo cosa si vede o si sente. Così una particella in più non sposta più la trama. Il caso interno di phaser (particelle con valori `random`) resta su `Math.random` e non tocca nessuna delle due.',
    '',
    'La colonna **tipo** per la sequenza cosmetica è sempre **cosmetico**; per la logica può dire di più, scritto a mano e conservato per testo della riga: **logica (testo)** sceglie una battuta o un testo, non cambia lo stato ma cambia la trama letta; **logica (dato salvato)** finisce nel salvataggio. Una pescata nuova sceglie la sequenza leggendo cosa cambia.',
    '',
    '| file | estrazioni |',
    '|---|---|',
    ...[...byFile].sort((a, b) => b[1].length - a[1].length).map(([f, rs]) => `| ${f} | ${rs.length} |`),
];
for (const [f, rs] of byFile) {
    L.push('', `## ${f}`, '', '| riga | funzione | chiamata | testo | tipo |', '|---|---|---|---|---|');
    for (const r of rs) {
        const shown = `\`${r.src.replace(/\|/g, '\\|').replace(/`/g, "'").slice(0, 110)}\``;
        const known = kept.get(shown)?.shift();
        const tipo = r.callee.startsWith('rng.fx.') ? 'cosmetico' : r.callee.startsWith('rng.logic.') ? (known?.startsWith('logica') ? known : 'logica') : (known ?? '');
        L.push(`| ${r.line} | ${r.fn} | ${r.callee} | ${shown} | ${tipo} |`);
    }
}
writeFileSync(OUT, `${L.join('\n')}\n`);
console.log(`${rows.length} estrazioni in ${byFile.size} file -> docs/refactor/caso.md`);
if (loose.length) {
    for (const r of loose) console.error(`pesca da Math.random fuori dal seme: ${r.rel}:${r.line} ${r.callee}`);
    process.exit(1);
}
