// i nomi che il bundler ha rinominato per conflitto (Rectangle2, Systems2...): la sonda li scrive nelle tracce
// come nome del costruttore, quindi devono restare gli stessi tra il riferimento e la build corrente.
// uso: node scripts/harness/names.mjs   (REF_DIST e DIST come corpus.mjs)
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const REF_DIST = process.env.REF_DIST ?? '../gecowave-main/dist-dev';
const CUR_DIST = process.env.DIST ?? 'dist-dev';

function renamed(dist) {
    const dir = join(resolve(dist), 'assets');
    const out = new Set();
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.js'))) {
        for (const m of readFileSync(join(dir, f), 'utf8').matchAll(/^(?:class|var|let|const|function) ([A-Za-z_$][A-Za-z0-9_$]*[A-Za-z_$])(\d+)\b/gm)) out.add(m[1] + m[2]);
    }
    return out;
}

const a = renamed(REF_DIST);
const b = renamed(CUR_DIST);
const lost = [...a].filter((x) => !b.has(x)).sort();
const added = [...b].filter((x) => !a.has(x)).sort();
if (!lost.length && !added.length) {
    console.log(`nomi rinominati identici (${a.size})`);
    process.exit(0);
}
console.log(`spariti: ${lost.join(', ') || '-'}\nnuovi: ${added.join(', ') || '-'}`);
process.exit(1);
