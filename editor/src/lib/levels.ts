import type { LevelDef } from '@game/types';

/* carica i file livello del gioco gi� parsati (dati puri), insieme al
   nome file e al nome dell'export, che servono per riscriverli su disco. */
export interface LoadedLevelFile {
    def: LevelDef;
    file: string;
    exportName: string;
    /** commento /* ... *​/ in testa al file, da preservare al salvataggio */
    header: string | null;
}

const modules = import.meta.glob('../../../src/content/levels/level*.ts', { eager: true }) as Record<
    string,
    Record<string, unknown>
>;

const sources = import.meta.glob('../../../src/content/levels/level*.ts', {
    eager: true,
    query: '?raw',
    import: 'default',
}) as Record<string, string>;

function extractHeader(src: string | undefined): string | null {
    if (!src) return null;
    // primo blocco /* ... */ prima della prima export
    const exportAt = src.indexOf('export const');
    const head = exportAt >= 0 ? src.slice(0, exportAt) : src;
    const m = head.match(/\/\*[\s\S]*?\*\//);
    return m ? m[0] : null;
}

function isLevelDef(v: unknown): v is LevelDef {
    return !!v && typeof v === 'object' && Array.isArray((v as LevelDef).grid) && 'entities' in v;
}

export function loadLevelFiles(): LoadedLevelFile[] {
    const out: LoadedLevelFile[] = [];
    for (const [path, mod] of Object.entries(modules)) {
        const file = path.split('/').pop()!;
        for (const [exportName, value] of Object.entries(mod)) {
            if (isLevelDef(value)) {
                // copia profonda: l'editor non deve mutare i moduli importati
                out.push({
                    def: structuredClone(value),
                    file,
                    exportName,
                    header: extractHeader(sources[path]),
                });
            }
        }
    }
    out.sort((a, b) => a.file.localeCompare(b.file));
    return out;
}
