import type Phaser from 'phaser';
import { ZONE_HEX } from '../config';
import { animateCreature, creatureRes } from '../art/creatureKit';
import { ensureCreature } from '../art/creatures';
import { npcTexture } from '../art/npcTexture';
import type { GameContext, GameSystem } from './context';
import type { Interactable } from './Interactions';

type NpcsCtx = Pick<GameContext, 'scene' | 'world' | 'lighting' | 'interactions' | 'dialogues' | 'chapter'>;

/** i personaggi di scena: si mostrano, si parla, il capitolo decide i casi speciali */
export class Npcs implements GameSystem {
    /** dove stanno gli npc di trama, per indicarli */
    readonly at = new Map<string, { x: number; y: number }>();
    private readonly ctx: NpcsCtx;

    constructor(ctx: NpcsCtx) {
        this.ctx = ctx;
    }

    /** personaggio di scena: foglio a inchiostro animato se esiste, texture semplice altrimenti */
    castSprite(x: number, y: number, key: string): Phaser.GameObjects.Sprite {
        const scene = this.ctx.scene;
        const sprite = scene.add.sprite(x, y, ensureCreature(scene, key), 0).setPipeline('Light2D');
        sprite.setScale(1 / creatureRes(scene, sprite.texture.key));
        animateCreature(sprite);
        return sprite;
    }

    spawn(id: string, x: number, y: number): void {
        if (this.ctx.chapter.marker?.(id, x, y)) return;
        this.present(id, x, y);
        this.talk(id, x, y);
    }

    /** il personaggio si vede: sprite, luce e il respiro */
    present(id: string, x: number, y: number): Phaser.GameObjects.Sprite {
        this.at.set(id, { x, y });
        const texture = npcTexture(id);
        const npc = this.castSprite(x, y + 4, texture).setDepth(4);
        this.ctx.lighting.follow(npc, ZONE_HEX[this.ctx.world.def.color], 160, 0.7);
        // vavleeh è steso a terra: niente fluttuazione, per rispetto
        if (!id.startsWith('vavleeh')) {
            this.ctx.scene.tweens.add({ targets: npc, y: npc.y - 3, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        }
        return npc;
    }

    /** il personaggio si può interpellare */
    talk(id: string, x: number, y: number): Interactable {
        const entry: Interactable = { x, y, range: 70, onInteract: () => this.interact(id) };
        this.ctx.interactions.add(entry);
        return entry;
    }

    interact(id: string): void {
        if (this.ctx.chapter.interact?.(id)) return;
        this.ctx.dialogues.start(id);
    }

    destroy(): void {}
}
