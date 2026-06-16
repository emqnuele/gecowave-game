/* client verso il backend dev (plugin fileIo). esiste solo in sviluppo. */

export async function saveLevelFile(file: string, source: string): Promise<void> {
    const res = await fetch('/api/level', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ file, source }),
    });
    if (!res.ok) throw new Error(`salvataggio fallito: ${(await res.json()).error ?? res.status}`);
}

export interface Commit {
    sha: string;
    author: string;
    date: string;
    message: string;
    /** path che il file aveva a questo commit (segue i rinomini) */
    path: string;
}

export async function getHistory(file: string): Promise<Commit[]> {
    const res = await fetch(`/api/history?file=${encodeURIComponent(file)}`);
    if (!res.ok) throw new Error('lettura cronologia fallita');
    return (await res.json()).commits as Commit[];
}

export async function getSourceAt(path: string, sha: string): Promise<string> {
    const res = await fetch(`/api/show?path=${encodeURIComponent(path)}&sha=${encodeURIComponent(sha)}`);
    if (!res.ok) throw new Error('lettura versione fallita');
    return (await res.json()).source as string;
}

export async function getIndexSource(): Promise<string> {
    const res = await fetch('/api/index');
    if (!res.ok) throw new Error('lettura index.ts fallita');
    return (await res.json()).source as string;
}

export async function saveIndexSource(source: string): Promise<void> {
    const res = await fetch('/api/index', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ source }),
    });
    if (!res.ok) throw new Error('scrittura index.ts fallita');
}
