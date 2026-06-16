import type { EntitySpec, LevelDef } from '@game/types';

/* serializza un LevelDef nel sorgente .ts, nello stile dei file scritti
   a mano: import del tipo, export nominato, griglia come array di stringhe. */

const q = (s: string): string => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

function spec(s: EntitySpec): string {
    const parts: string[] = [`type: ${q(s.type)}`];
    switch (s.type) {
        case 'enemy':
            parts.push(`kind: ${q(s.kind)}`);
            break;
        case 'boss':
            parts.push(`kind: ${q(s.kind)}`);
            break;
        case 'npc':
            parts.push(`id: ${q(s.id)}`);
            break;
        case 'lore':
            parts.push(`id: ${q(s.id)}`);
            break;
        case 'ability':
            parts.push(`ability: ${q(s.ability)}`);
            break;
        case 'barre':
            parts.push(`amount: ${s.amount}`);
            break;
        case 'portal':
            parts.push(`to: ${q(s.to)}`);
            if (s.needsFlag) parts.push(`needsFlag: ${q(s.needsFlag)}`);
            if (s.label) parts.push(`label: ${q(s.label)}`);
            break;
    }
    return `{ ${parts.join(', ')} }`;
}

export function serializeLevel(def: LevelDef, exportName: string): string {
    const lines: string[] = [];
    lines.push(`import type { LevelDef } from '../../types';`);
    lines.push('');
    lines.push(`export const ${exportName}: LevelDef = {`);
    lines.push(`    id: ${q(def.id)},`);
    lines.push(`    title: ${q(def.title)},`);
    lines.push(`    accentWord: ${q(def.accentWord)},`);
    lines.push(`    color: ${q(def.color)},`);
    lines.push(`    punchline: ${q(def.punchline)},`);
    if (def.next !== undefined) lines.push(`    next: ${q(def.next)},`);
    if (def.secret) lines.push(`    secret: true,`);
    if (def.returnTo !== undefined) lines.push(`    returnTo: ${q(def.returnTo)},`);
    if (def.introDialogue !== undefined) lines.push(`    introDialogue: ${q(def.introDialogue)},`);
    if (def.script !== undefined) lines.push(`    script: ${q(def.script)},`);
    if (def.ambientNote !== undefined) lines.push(`    ambientNote: ${def.ambientNote},`);

    lines.push(`    entities: {`);
    for (const [letter, s] of Object.entries(def.entities)) {
        lines.push(`        ${q(letter)}: ${spec(s)},`);
    }
    lines.push(`    },`);

    lines.push(`    grid: [`);
    for (const row of def.grid) {
        lines.push(`        ${q(row)},`);
    }
    lines.push(`    ],`);

    lines.push(`};`);
    lines.push('');
    return lines.join('\n');
}
