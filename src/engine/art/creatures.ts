import type Phaser from 'phaser';
import { ENEMIES } from '../../content/enemies';
import { BOSSES } from '../../content/bosses';
import type { EntitySpec } from '../../types';
import { buildCreature, type CreatureSpec } from './creatureKit';
import { ENEMY_ART } from './creatures/enemies';
import { BOSS_ART } from './creatures/bosses';
import { patchNormalFlip } from './normalFlip';

const SPECS = new Map<string, CreatureSpec>([...ENEMY_ART, ...BOSS_ART].map((s) => [s.key, s]));
export const CREATURE_KEYS = [...SPECS.keys()];

/** i fogli costano (normal map comprese): si disegnano al primo uso, non al boot */
export function ensureCreature(scene: Phaser.Scene, key: string): string {
    const spec = SPECS.get(key);
    if (!spec) return key;
    if (scene.textures.exists(key) && (scene.textures.get(key).customData as { creatureFrames?: number }).creatureFrames) return key;
    patchNormalFlip();
    buildCreature(scene, spec);
    return key;
}

/** prima di aprire un capitolo: tutto il cast della legenda e chi evocano i boss */
export function prewarmCreatures(scene: Phaser.Scene, entities: Iterable<EntitySpec>): void {
    const t0 = performance.now();
    const keys = new Set<string>();
    for (const e of entities) {
        if (e.type === 'enemy') keys.add(ENEMIES[e.kind].texture);
        if (e.type === 'boss') {
            const b = BOSSES[e.kind];
            keys.add(b.texture);
            if (b.summonKind) keys.add(ENEMIES[b.summonKind].texture);
        }
    }
    for (const k of [...keys]) {
        const split = Object.values(ENEMIES).find((a) => a.texture === k)?.splitsInto;
        if (split) keys.add(ENEMIES[split.kind].texture);
    }
    for (const k of keys) ensureCreature(scene, k);
    if (import.meta.env.DEV) console.log(`[creature] ${keys.size} fogli in ${Math.round(performance.now() - t0)} ms`);
}
