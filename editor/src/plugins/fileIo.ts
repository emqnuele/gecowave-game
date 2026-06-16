import { readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { Plugin } from 'vite';

const exec = promisify(execFile);

/* middleware dev: legge e scrive i file dei livelli del gioco.
   non esiste in produzione, l'editor gira solo in locale. */
export function levelFileIo(gameRoot: string): Plugin {
    const levelsDir = resolve(gameRoot, 'src/content/levels');
    const indexFile = join(levelsDir, 'index.ts');

    const json = (res: import('node:http').ServerResponse, code: number, body: unknown): void => {
        res.statusCode = code;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify(body));
    };

    const readBody = (req: import('node:http').IncomingMessage): Promise<string> =>
        new Promise((ok, no) => {
            let buf = '';
            req.on('data', (c) => (buf += c));
            req.on('end', () => ok(buf));
            req.on('error', no);
        });

    const relPath = (file: string): string => `src/content/levels/${file}`;
    const safeFile = (file: string | null): file is string =>
        !!file && !file.includes('/') && !file.includes('..') && file.endsWith('.ts');

    return {
        name: 'gecowave-level-file-io',
        configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
                const url = req.url ?? '';
                if (!url.startsWith('/api/')) return next();
                const query = new URLSearchParams(url.split('?')[1] ?? '');
                const path = url.split('?')[0];

                try {
                    // cronologia git di un livello: ?file=level07-rio.ts
                    // --name-only cattura il path che il file aveva a OGNI commit
                    // (segue i rinomini), cosi /api/show usa il path giusto.
                    if (path === '/api/history' && req.method === 'GET') {
                        const file = query.get('file');
                        if (!safeFile(file)) return json(res, 400, { error: 'file non valido' });
                        const { stdout } = await exec(
                            'git',
                            ['log', '--follow', '--name-only', '--format=%x00%H%x1f%an%x1f%aI%x1f%s', '--', relPath(file)],
                            { cwd: gameRoot, maxBuffer: 10 * 1024 * 1024 },
                        );
                        const commits = stdout
                            .split('\x00')
                            .filter((b) => b.trim())
                            .map((block) => {
                                const lines = block.split('\n');
                                const [sha, author, date, ...msg] = lines[0].split('\x1f');
                                // prima riga non vuota dopo il meta = path a quel commit
                                const pathAt = lines.slice(1).find((l) => l.trim()) ?? relPath(file);
                                return { sha, author, date, message: msg.join('\x1f'), path: pathAt.trim() };
                            });
                        return json(res, 200, { commits });
                    }

                    // sorgente di un livello a una revisione: ?sha=..&path=..
                    if (path === '/api/show' && req.method === 'GET') {
                        const sha = query.get('sha');
                        const filePath = query.get('path');
                        const okPath = filePath && /^src\/content\/levels\/[\w.-]+\.ts$/.test(filePath);
                        if (!okPath || !sha || !/^[0-9a-f]+$/i.test(sha)) {
                            return json(res, 400, { error: 'parametri non validi' });
                        }
                        const { stdout } = await exec('git', ['show', `${sha}:${filePath}`], {
                            cwd: gameRoot,
                            maxBuffer: 10 * 1024 * 1024,
                        });
                        return json(res, 200, { source: stdout });
                    }

                    // lista dei file livello (escluso il registro index.ts)
                    if (url === '/api/levels' && req.method === 'GET') {
                        const files = (await readdir(levelsDir)).filter(
                            (f) => f.endsWith('.ts') && f !== 'index.ts',
                        );
                        const out = await Promise.all(
                            files.map(async (file) => ({
                                file,
                                source: await readFile(join(levelsDir, file), 'utf8'),
                            })),
                        );
                        return json(res, 200, { levels: out });
                    }

                    // sorgente del registro
                    if (url === '/api/index' && req.method === 'GET') {
                        return json(res, 200, { source: await readFile(indexFile, 'utf8') });
                    }

                    // scrittura di un file livello: { file, source }
                    if (url === '/api/level' && req.method === 'PUT') {
                        const { file, source } = JSON.parse(await readBody(req)) as {
                            file: string;
                            source: string;
                        };
                        if (!file || file.includes('/') || file.includes('..') || !file.endsWith('.ts')) {
                            return json(res, 400, { error: 'nome file non valido' });
                        }
                        await writeFile(join(levelsDir, file), source, 'utf8');
                        return json(res, 200, { ok: true, file });
                    }

                    // scrittura del registro index.ts
                    if (url === '/api/index' && req.method === 'PUT') {
                        const { source } = JSON.parse(await readBody(req)) as { source: string };
                        await writeFile(indexFile, source, 'utf8');
                        return json(res, 200, { ok: true });
                    }

                    return json(res, 404, { error: 'endpoint sconosciuto' });
                } catch (err) {
                    return json(res, 500, { error: String(err) });
                }
            });
        },
    };
}
