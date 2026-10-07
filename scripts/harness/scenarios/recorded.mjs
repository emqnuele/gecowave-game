// le partite registrate da ema (record.mjs), rigiocate tasto per tasto e clic per clic.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chapterSave, prepareSave } from '../lib.mjs';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '../data/nastri');
const BUTTONS = ['left', 'middle', 'right'];

export default existsSync(DIR)
    ? readdirSync(DIR).filter((f) => f.endsWith('.json')).sort().map((f) => {
        const t = JSON.parse(readFileSync(join(DIR, f), 'utf8'));
        const save = t.chapter ? chapterSave(t.chapter) : null;
        return {
            id: `registrata-${t.name}`,
            level: t.level,
            ...(save ? prepareSave({ replace: save }) : {}),
            async run(ctx) {
                for (const e of [...t.events].sort((a, b) => a[0] - b[0])) {
                    if (e[0] > ctx.f) await ctx.wait(e[0] - ctx.f);
                    const [, kind, a, b, x, y] = e;
                    if (kind === 'key') await (b === 'down' ? ctx.down(a) : ctx.up(a));
                    else if (kind === 'move') await ctx.page.mouse.move(a, b);
                    else if (kind === 'mouse') {
                        await ctx.page.mouse.move(x, y);
                        await (b === 'down' ? ctx.page.mouse.down({ button: BUTTONS[a] ?? 'left' }) : ctx.page.mouse.up({ button: BUTTONS[a] ?? 'left' }));
                    }
                }
                if (t.frames > ctx.f) await ctx.wait(t.frames - ctx.f);
            },
        };
    })
    : [];
