/* client verso il backend dev (plugin fileIo). esiste solo in sviluppo. */

export async function saveLevelFile(file: string, source: string): Promise<void> {
    const res = await fetch('/api/level', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ file, source }),
    });
    if (!res.ok) throw new Error(`salvataggio fallito: ${(await res.json()).error ?? res.status}`);
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
