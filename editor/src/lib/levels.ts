import type { LevelDef } from '@game/types';

/* carica i file livello del gioco gi� parsati (dati puri), insieme al
   nome file e al nome dell'export, che servono per riscriverli su disco. */
export interface LoadedLevelFile {
    def: LevelDef;
    file: string;
    exportName: string;
}

const modules = import.meta.glob('../../../src/content/levels/level*.ts', { eager: true }) as Record<
    string,
    Record<string, unknown>
>;

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
                out.push({ def: structuredClone(value), file, exportName });
            }
        }
    }
    out.sort((a, b) => a.file.localeCompare(b.file));
    return out;
}
