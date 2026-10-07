// censimento delle estrazioni casuali di src/: ogni Math.random e ogni helper di phaser che lo usa,
// con file, riga, funzione che lo contiene e il testo. serve al passo "rng centralizzato" della parte B:
// la colonna logica/cosmetico si decide leggendo, non si indovina.
// uso: node scripts/harness/caso.mjs   -> docs/refactor/caso.md
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SRC = join(ROOT, 'src');
// gli helper di phaser che chiamano Math.random dentro
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
            if (callee === 'Math.random' || PHASER.test(callee)) {
                const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
                const src = text.split('\n')[line].trim();
                rows.push({ rel, line: line + 1, fn: owner(node), callee, src });
            }
        }
        ts.forEachChild(node, visit);
    };
    visit(sf);
}

const byFile = new Map();
for (const r of rows) byFile.set(r.rel, [...(byFile.get(r.rel) ?? []), r]);
const L = [
    '# il caso nel codice',
    '',
    `Generato da \`scripts/harness/caso.mjs\` su \`src/\`: ${rows.length} estrazioni casuali (\`Math.random\` e gli helper di phaser che lo usano: \`Between\`, \`FloatBetween\`, \`RND\`, \`Shuffle\`, \`GetRandom\`...) in ${byFile.size} file. Non conta il caso interno di phaser (particelle con valori \`random\`, \`Phaser.Math.RND\` dei sistemi): anche quello consuma \`Math.random\` e quindi sposta la sequenza.`,
    '',
    'Serve al passo "rng centralizzato" della parte B. Oggi tutto pesca dalla stessa sequenza globale: un\'estrazione cosmetica in più (una particella, una scheggia) sposta tutte le estrazioni di logica che vengono dopo. La colonna **tipo** (logica: cambia cosa succede; cosmetico: cambia solo cosa si vede o si sente) va riempita leggendo il codice, prima di spostare qualsiasi chiamata.',
    '',
    '| file | estrazioni |',
    '|---|---|',
    ...[...byFile].sort((a, b) => b[1].length - a[1].length).map(([f, rs]) => `| ${f} | ${rs.length} |`),
];
for (const [f, rs] of byFile) {
    L.push('', `## ${f}`, '', '| riga | funzione | chiamata | testo | tipo |', '|---|---|---|---|---|');
    for (const r of rs) L.push(`| ${r.line} | ${r.fn} | ${r.callee} | \`${r.src.replace(/\|/g, '\\|').replace(/`/g, "'").slice(0, 110)}\` | |`);
}
writeFileSync(join(ROOT, 'docs/refactor/caso.md'), `${L.join('\n')}\n`);
console.log(`${rows.length} estrazioni in ${byFile.size} file -> docs/refactor/caso.md`);
