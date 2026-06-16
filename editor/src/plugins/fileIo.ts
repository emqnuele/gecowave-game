import { readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import type { Plugin } from 'vite';

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

    return {
        name: 'gecowave-level-file-io',
        configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
                const url = req.url ?? '';
                if (!url.startsWith('/api/')) return next();

                try {
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
