// rami e funzioni del sorgente, enumerati dall'ast di typescript e controllati sulla copertura v8 del bundle.
// la copertura v8 tradotta da istanbul conta solo i blocchi che v8 ha visto: qui il denominatore è il sorgente.
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { SourceMapConsumer } from 'source-map-js';

/** 1 dove il bundle è stato eseguito almeno una volta, 0 altrove (il blocco più interno vince) */
export function executedMask(source, functions) {
    const mask = new Uint8Array(source.length + 1);
    const ranges = [];
    for (const fn of functions) for (const r of fn.ranges) ranges.push(r);
    // dall'esterno verso l'interno: chi è dentro sovrascrive chi lo contiene
    ranges.sort((a, b) => (b.endOffset - b.startOffset) - (a.endOffset - a.startOffset));
    for (const r of ranges) mask.fill(r.count > 0 ? 1 : 0, r.startOffset, r.endOffset);
    return mask;
}

/** i bracci di ramo e le funzioni di un file .ts, con la posizione da controllare */
export function enumerate(file) {
    const text = readFileSync(file, 'utf8');
    const sf = ts.createSourceFile(file, text, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
    const arms = [];
    const fns = [];
    const pos = (node) => {
        // per un blocco conta la prima istruzione: v8 apre il contatore lì
        const target = ts.isBlock(node) && node.statements.length ? node.statements[0] : node;
        const lc = sf.getLineAndCharacterOfPosition(target.getStart(sf));
        return { line: lc.line + 1, column: lc.character };
    };
    const snippet = (node) => node.getText(sf).split('\n')[0].slice(0, 70);
    const fnName = (node) => {
        if (node.name && ts.isIdentifier(node.name)) return node.name.text;
        if (ts.isConstructorDeclaration(node)) return 'constructor';
        const p = node.parent;
        if (p && ts.isVariableDeclaration(p) && ts.isIdentifier(p.name)) return p.name.text;
        if (p && ts.isPropertyAssignment(p) && ts.isIdentifier(p.name)) return p.name.text;
        if (p && ts.isPropertyDeclaration(p) && ts.isIdentifier(p.name)) return p.name.text;
        if (p && ts.isCallExpression(p)) return `(callback di ${snippet(p.expression).slice(0, 30)})`;
        return '(anonima)';
    };
    const arm = (kind, node, owner) => {
        if (ts.isBlock(node) && !node.statements.length) return;
        arms.push({ kind, ...pos(node), text: snippet(owner ?? node) });
    };
    const visit = (node) => {
        if (ts.isIfStatement(node)) {
            arm('then', node.thenStatement, node);
            if (node.elseStatement) arm('else', node.elseStatement, node);
        } else if (ts.isConditionalExpression(node)) {
            arm('?:vero', node.whenTrue, node);
            arm('?:falso', node.whenFalse, node);
        } else if (ts.isBinaryExpression(node)) {
            const k = node.operatorToken.kind;
            if (k === ts.SyntaxKind.AmpersandAmpersandToken || k === ts.SyntaxKind.BarBarToken || k === ts.SyntaxKind.QuestionQuestionToken
                || k === ts.SyntaxKind.AmpersandAmpersandEqualsToken || k === ts.SyntaxKind.BarBarEqualsToken || k === ts.SyntaxKind.QuestionQuestionEqualsToken) {
                arm(ts.tokenToString(k), node.right, node);
            }
        } else if (ts.isCaseClause(node) || ts.isDefaultClause(node)) {
            if (node.statements.length) arm(ts.isCaseClause(node) ? 'case' : 'default', node.statements[0], node);
        } else if (ts.isCatchClause(node)) {
            arm('catch', node.block, node);
        } else if (ts.isForStatement(node) || ts.isForOfStatement(node) || ts.isForInStatement(node) || ts.isWhileStatement(node) || ts.isDoStatement(node)) {
            arm('ciclo', node.statement, node);
        }
        if ((ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) || ts.isArrowFunction(node) || ts.isFunctionExpression(node)
            || ts.isConstructorDeclaration(node) || ts.isGetAccessorDeclaration(node) || ts.isSetAccessorDeclaration(node)) && node.body) {
            const body = node.body;
            const lc = sf.getLineAndCharacterOfPosition(node.getStart(sf));
            const end = sf.getLineAndCharacterOfPosition(node.getEnd()).line + 1;
            if (!ts.isBlock(body) || body.statements.length) fns.push({ name: fnName(node), decl: lc.line + 1, end, ...pos(body) });
        }
        ts.forEachChild(node, visit);
    };
    visit(sf);
    return { arms, fns };
}

/** controlla bracci e funzioni sul bundle eseguito */
export class BundleIndex {
    constructor(bundleSource, sourceMap, functions) {
        this.mask = executedMask(bundleSource, functions);
        this.lineStart = [0];
        for (let i = 0; i < bundleSource.length; i++) if (bundleSource.charCodeAt(i) === 10) this.lineStart.push(i + 1);
        this.consumer = new SourceMapConsumer(sourceMap);
        this.sources = new Map(sourceMap.sources.map((s) => [s.slice(s.lastIndexOf('/src/') + 1), s]));
    }
    /** null se la posizione non ha un corrispondente nel bundle (codice tolto dal bundler) */
    executed(rel, line, column) {
        const source = this.sources.get(rel);
        if (!source) return null;
        let g = this.consumer.generatedPositionFor({ source, line, column, bias: SourceMapConsumer.LEAST_UPPER_BOUND });
        if (g.line === null) g = this.consumer.generatedPositionFor({ source, line, column, bias: SourceMapConsumer.GREATEST_LOWER_BOUND });
        if (g.line === null) return null;
        const off = this.lineStart[g.line - 1] + g.column;
        return this.mask[off] === 1;
    }
}

/** posizione nel bundle di una riga del sorgente (null se il bundler l'ha tolta) */
export function bundleOffset(index, rel, line, column) {
    const source = index.sources.get(rel);
    if (!source) return null;
    let g = index.consumer.generatedPositionFor({ source, line, column, bias: SourceMapConsumer.LEAST_UPPER_BOUND });
    if (g.line === null) g = index.consumer.generatedPositionFor({ source, line, column, bias: SourceMapConsumer.GREATEST_LOWER_BOUND });
    if (g.line === null) return null;
    return index.lineStart[g.line - 1] + g.column;
}

/** quella posizione è stata eseguita in questa copertura? vince il blocco più interno */
/** quante volte gira il blocco più stretto che contiene l'offset (0 se mai) */
export function countAt(functions, off) {
    let best = null;
    for (const fn of functions) {
        for (const r of fn.ranges) {
            if (r.startOffset <= off && off < r.endOffset && (!best || r.endOffset - r.startOffset < best.endOffset - best.startOffset)) best = r;
        }
    }
    return best ? best.count : 0;
}

export function executedAt(functions, off) {
    let best = null;
    for (const fn of functions) {
        for (const r of fn.ranges) {
            if (r.startOffset <= off && off < r.endOffset && (!best || r.endOffset - r.startOffset < best.endOffset - best.startOffset)) best = r;
        }
    }
    return !!best && best.count > 0;
}
