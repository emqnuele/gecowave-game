import type { LevelDef } from '@game/types';

const RESERVED = new Set(['.', '#', 'F', '%', '^', '~', 'P', 'C', 'X']);

/* controlli minimi prima del salvataggio, gli stessi che il LevelLoader
   imporrebbe a runtime (spawn presente, lettere tutte in legenda). */
export function validateLevel(def: LevelDef): string[] {
    const errors: string[] = [];
    const flat = def.grid.join('');
    if (!flat.includes('P')) errors.push('manca lo spawn P');
    if ((flat.match(/P/g)?.length ?? 0) > 1) errors.push('più di uno spawn P');

    const unknown = new Set<string>();
    for (const ch of flat) {
        if (RESERVED.has(ch)) continue;
        if (!def.entities[ch]) unknown.add(ch);
    }
    if (unknown.size) errors.push(`lettere in griglia non in legenda: ${[...unknown].join(' ')}`);

    if (def.next && !flat.includes('X')) errors.push("c'è un next ma manca l'uscita X");
    if (!def.next && !def.secret && flat.includes('X')) errors.push("c'è un'uscita X ma manca il next");
    return errors;
}
