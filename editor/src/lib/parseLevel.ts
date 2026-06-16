import type { LevelDef } from '@game/types';

/* trasforma il sorgente .ts di un livello (dato puro) in un LevelDef.
   serve per le versioni storiche di git, che non passano dal bundler.

   nota sicurezza: usa new Function per valutare il literal. l'input e il
   contenuto dei file di livello DI QUESTO repo (git show <sha>:path), gli
   stessi che il gioco e l'editor gia importano ed eseguono. non e una nuova
   superficie d'attacco e il tool gira solo in locale, mai in produzione. */
export function parseLevelSource(source: string): LevelDef {
    // accetta solo sorgenti che sono davvero un file di livello del progetto
    if (!/import type \{ LevelDef \}/.test(source) || !/export const \w+: LevelDef/.test(source)) {
        throw new Error('non e un file di livello valido');
    }
    const eqAt = source.indexOf('=', source.indexOf('export const'));
    if (eqAt < 0) throw new Error('export del livello non trovato');
    let body = source.slice(eqAt + 1).trim();
    // togli il ; finale e tutto cio che segue la graffa di chiusura
    const end = body.lastIndexOf('}');
    if (end < 0) throw new Error('literal del livello malformato');
    body = body.slice(0, end + 1);
    // il literal e gia valido js una volta rimosse le annotazioni di tipo
    const def = new Function(`return (${body})`)() as LevelDef;
    if (!Array.isArray(def.grid) || !def.entities) throw new Error('non e un LevelDef');
    return def;
}
