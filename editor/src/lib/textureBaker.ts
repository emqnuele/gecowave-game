import Phaser from 'phaser';
import { ART_TILE } from '@game/config';
import { generateBaseTextures } from '@game/engine/textures';
import { ensureCreature } from '@game/engine/art/creatures';
import { catalogTextureKeys } from './catalog';

/* cuoce le texture procedurali del gioco in immagini riutilizzabili.
   gira nel browser dell'editor: avvia un phaser minimale in canvas,
   chiama le stesse funzioni del gioco, estrae le texture come <img>. */
export interface BakedTextures {
    /** chiave texture -> immagine pronta da disegnare su canvas 2d */
    sprites: Map<string, HTMLImageElement>;
    /** i 16 frame del tileset (160px) per disegnare i muri */
    tiles: HTMLCanvasElement[];
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((ok, no) => {
        const img = new Image();
        img.onload = () => ok(img);
        img.onerror = no;
        img.src = src;
    });
}

async function sliceTileset(): Promise<HTMLCanvasElement[]> {
    const img = await loadImage('/assets/tileset_main.png');
    const cols = Math.max(1, Math.floor(img.width / ART_TILE));
    const rows = Math.max(1, Math.floor(img.height / ART_TILE));
    const out: HTMLCanvasElement[] = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cv = document.createElement('canvas');
            cv.width = ART_TILE;
            cv.height = ART_TILE;
            cv.getContext('2d')!.drawImage(
                img,
                c * ART_TILE,
                r * ART_TILE,
                ART_TILE,
                ART_TILE,
                0,
                0,
                ART_TILE,
                ART_TILE,
            );
            out.push(cv);
        }
    }
    return out;
}

function bakeSprites(): Promise<Map<string, HTMLImageElement>> {
    return new Promise((resolve, reject) => {
        const keys = catalogTextureKeys();
        let game: Phaser.Game | null = null;

        class BakeScene extends Phaser.Scene {
            create() {
                try {
                    generateBaseTextures(this);
                    const map = new Map<string, HTMLImageElement>();
                    const pending: Promise<void>[] = [];
                    for (const key of keys) {
                        // nemici, boss e personaggi sono fogli a inchiostro disegnati al primo uso
                        ensureCreature(this, key);
                        if (!this.textures.exists(key)) {
                            console.warn(`[baker] texture mancante: ${key}`);
                            continue;
                        }
                        // dei fogli animati basta il primo fotogramma
                        const b64 = this.textures.getBase64(key, this.textures.get(key).has('0') ? 0 : undefined);
                        pending.push(loadImage(b64).then((img) => void map.set(key, img)));
                    }
                    Promise.all(pending)
                        .then(() => {
                            game?.destroy(true);
                            resolve(map);
                        })
                        .catch(reject);
                } catch (err) {
                    game?.destroy(true);
                    reject(err);
                }
            }
        }

        game = new Phaser.Game({
            type: Phaser.CANVAS,
            width: 8,
            height: 8,
            parent: undefined,
            scene: BakeScene,
            audio: { noAudio: true },
            banner: false,
        });
    });
}

let cache: BakedTextures | null = null;

export async function bakeTextures(): Promise<BakedTextures> {
    if (cache) return cache;
    const [sprites, tiles] = await Promise.all([bakeSprites(), sliceTileset()]);
    cache = { sprites, tiles };
    return cache;
}
