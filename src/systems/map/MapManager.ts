import Phaser from 'phaser';

export class MapManager {
    private scene: Phaser.Scene;
    private map!: Phaser.Tilemaps.Tilemap;
    private platformsLayer!: Phaser.Tilemaps.TilemapLayer;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    public getMap(): Phaser.Tilemaps.Tilemap {
        return this.map;
    }

    public createLevel(key: string): void {
        this.map = this.scene.make.tilemap({ key });
        console.log(`[MapManager] Map created with key: ${key}, Width: ${this.map.widthInPixels}, Height: ${this.map.heightInPixels}`);

        // 1. Add Tilesets
        const tileset = this.map.addTilesetImage('tileset_main', 'tileset_main');

        if (!tileset) {
            console.error('[MapManager] Tileset "tileset_main" not found!');
            return;
        }

        // 2. Create Layers
        // 'Platforms' layer from JSON
        this.platformsLayer = this.map.createLayer('Platforms', tileset)!;

        // 3. Collision
        if (this.platformsLayer) {
            // SCALE FIX: usage of 160px tiles scaled down to 32px (0.2 scale)
            this.platformsLayer.setScale(0.2);

            this.platformsLayer.setCollisionByExclusion([-1, 0]);
            this.platformsLayer.setAlpha(1); // Visible
            this.platformsLayer.setPipeline('Light2D'); // React to lights

            console.log('[MapManager] Collisions set for Platforms layer (Scaled 0.2)');

            // DEBUG RENDERING (Disable to see actual tiles)
            /*
            if (this.scene.game.config.physics.arcade?.debug) {
                const debugGraphics = this.scene.add.graphics().setAlpha(0.75);
                this.platformsLayer.renderDebug(debugGraphics, {
                    // tileColor: null, 
                    collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255),
                    faceColor: new Phaser.Display.Color(40, 39, 37, 255)
                });
            }
            */
        }

        // 4. Objects (Spawns)
        this.createVisuals();

        // Bounds
        this.scene.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.scene.physics.world.setBoundsCollision(true, true, true, false);
        this.scene.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    }

    private createVisuals(): void {
        const objectLayer = this.map.getObjectLayer('Objects');
        if (!objectLayer) return;

        objectLayer.objects.forEach(obj => {
            // Tiled Objects with GID are usually anchored Bottom-Left.
            // We need to adjust for this if we use standard Image (Center or Top-Left).

            if (obj.name === 'TerrainBase') {
                // Giant Terrain
                const img = this.scene.add.image(obj.x!, obj.y!, 'terrain_base');
                img.setOrigin(0, 0); // Top-Left anchor for easier alignment with grid
                img.setDepth(-10); // Behind players
                console.log('Created TerrainBase at', obj.x, obj.y);
            }
            else if (obj.name.startsWith('Prop_')) {
                // Props (Grass, Rocks, etc.)
                // These use the 'props' spritesheet/image.
                // Since we are not doing complex GID parsing for correct frame yet,
                // we will just spawn the whole 'props' image or a frame if we had one.
                // Wait, 'props' is a tileset.
                // For now, let's just spawn a placeholder or a specific frame if we knew it.
                // Since we don't have frame data easily mapped, we might skip or just show the whole image scaled?
                // Actually, let's try to map the GID to a frame if possible, or just use a generic 'props' image for now.

                // Temporary: Just create a specialized sprite or ignore if too complex without Atlas.
                // If it's a single image tileset, we can't easily pick a "tile" unless we made a Spritesheet.
                // Let's assume for now we just want the big terrain. Props can be added later or refined.

                // If props1.png is a grid, we can load it as a spritesheet in Preloader to pick frames.
                // For now, let's skip visual props to focus on the big Terrain.
            }
        });
    }

    public getSpawnPoint(objectLayerName: string, objectName: string): Phaser.Math.Vector2 | null {
        const objectLayer = this.map.getObjectLayer(objectLayerName);
        if (!objectLayer) {
            console.warn(`Object layer '${objectLayerName}' not found.`);
            return null;
        }

        const obj = objectLayer.objects.find(o => o.name === objectName);
        if (!obj) {
            console.warn(`Object '${objectName}' not found in layer '${objectLayerName}'.`);
            return null;
        }

        // Tiled objects x/y are top-left, but for points they are exact.
        // Ensure we handle potential nulls for x/y
        return new Phaser.Math.Vector2(obj.x ?? 100, obj.y ?? 100);
    }

    public getPlatformsLayer(): Phaser.Tilemaps.TilemapLayer {
        return this.platformsLayer;
    }

    public getMapWidth(): number {
        return this.map.widthInPixels;
    }

    public getMapHeight(): number {
        return this.map.heightInPixels;
    }

    public getMapProperty(key: string): any {
        if (!this.map || !this.map.properties) return null;
        // Phaser Tilemap properties can be an object or an array depending on how it's loaded.
        // Usually it's an object if coming from Tiled JSON directly into Phaser.
        const props = this.map.properties as any;

        // If it's an array of objects {name, value} (common in some Tiled exports)
        if (Array.isArray(props)) {
            const prop = props.find((p: any) => p.name === key);
            return prop ? prop.value : null;
        }

        // If it's a key-value object
        return props[key];
    }

    public destroy(): void {
        console.log('[MapManager] Destroying map...');
        if (this.map) {
            this.map.destroy();
        }
    }
}
