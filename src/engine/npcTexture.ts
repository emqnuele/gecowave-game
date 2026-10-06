/* mappa l'id di dialogo di un npc alla sua texture, per prefisso.
   condiviso tra il gioco (GameScene) e l'editor di livelli. */
export function npcTexture(id: string): string {
    if (id.startsWith('ivan')) return 'npc-ivan';
    if (id.startsWith('mamma-notino')) return 'npc-mamma';
    if (id.startsWith('notino')) return 'npc-notino';
    if (id.startsWith('ticummi')) return 'npc-ticummi';
    if (id.startsWith('smela') || id.startsWith('venditore')) return 'npc-smela';
    if (id.startsWith('filippus')) return 'npc-filippus';
    if (id.startsWith('piema')) return 'npc-piema';
    if (id.startsWith('lochef')) return 'npc-lochef';
    if (id.startsWith('ospite-12')) return 'npc-studente';
    if (id.startsWith('lametta')) return 'npc-lametta';
    if (id.startsWith('samatt')) return 'npc-samatt';
    if (id.startsWith('guastalla')) return 'npc-guastalla';
    if (id.startsWith('studente') || id.startsWith('professore') || id.startsWith('bimbo')) return 'npc-studente';
    if (id.startsWith('romero')) return 'npc-romero';
    if (id.startsWith('walter')) return 'npc-walter';
    if (id.startsWith('vavleeh')) return 'npc-vavleeh';
    if (id.startsWith('indizio') || id.endsWith('-targa') || id.startsWith('bacheca')) return 'lore-tablet';
    if (id.startsWith('bottega')) return 'npc-smela';
    if (id.startsWith('oracolo')) return 'npc-filippus';
    return 'npc-markolino';
}
