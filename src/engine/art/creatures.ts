import type Phaser from 'phaser';
import { buildCreature, type CreatureSpec } from './creatureKit';
import { ENEMY_ART } from './creatures/enemies';
import { BOSS_ART } from './creatures/bosses';
import { patchNormalFlip } from './normalFlip';

const ALL: CreatureSpec[] = [...ENEMY_ART, ...BOSS_ART];
export const CREATURE_KEYS = ALL.map((s) => s.key);

/** sovrascrive le sagome vecchie con i fogli a inchiostro animati */
export function buildCreatures(scene: Phaser.Scene): void {
    patchNormalFlip();
    const t0 = performance.now();
    for (const spec of ALL) buildCreature(scene, spec);
    if (import.meta.env.DEV) console.log(`[creature] ${ALL.length} fogli in ${Math.round(performance.now() - t0)} ms`);
}
