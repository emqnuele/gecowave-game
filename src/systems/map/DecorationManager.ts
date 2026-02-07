export class DecorationManager {
    private scene: Phaser.Scene;
    private propsGroup: Phaser.GameObjects.Group | null;
    private readonly roofOffsetPx = 4;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.propsGroup = this.scene.add.group();
    }

    public decorateLevel(layer: Phaser.Tilemaps.TilemapLayer): void {
        console.log('[DecorationManager] Loading props from map objects...');
        if (!this.propsGroup) return;
        this.propsGroup.clear(true, true);

        const map = layer.tilemap;
        const objectLayer = map.getObjectLayer('Objects');

        if (!objectLayer) {
            console.warn('[DecorationManager] No Objects layer found in map.');
            return;
        }

        let count = 0;

        objectLayer.objects.forEach(obj => {
            if (obj.type === 'Prop') {
                this.spawnProp(obj);
                count++;
            }
        });

        console.log(`[DecorationManager] Spawned ${count} props.`);
    }

    private spawnProp(obj: Phaser.Types.Tilemaps.TiledObject): void {
        // Tiled Objects coordinates are in pixels (based on 160px tiles).
        // The game world is scaled down to 0.2.
        // So we need to position the props at (obj.x * 0.2, obj.y * 0.2).

        const SCALE = 0.2;
        const x = (obj.x || 0) * SCALE;
        const y = (obj.y || 0) * SCALE;

        // Ensure texture exists
        if (!this.scene.textures.exists('props_atlas')) return;

        // Properties
        // Properties parsing (handle both Array and Object formats from Phaser/Tiled)
        let kind = 'floor';
        if (obj.properties) {
            if (Array.isArray(obj.properties)) {
                const p = obj.properties.find((p: any) => p.name === 'kind');
                if (p) kind = p.value;
            } else {
                // Determine if it's a direct dictionary (Phaser sometimes converts)
                const props = obj.properties as any;
                if (props.kind) kind = props.kind;
            }
        }

        // console.log(`[DecorationManager] Prop: ${obj.name}, Kind: ${kind}`);

        const prop = this.scene.add.image(x, y, 'props_atlas', obj.name);

        // Orientation & Scale
        if (kind === 'roof') {
            return;
        } else if (kind === 'floor') {
            prop.setOrigin(0.5, 1); // Bottom-Center used in generation
            prop.y += 15; // Shift down to embed (User requested +5 more, total ~15)

            // Force behind terrain (Terrain is likely depth 0)
            prop.setDepth(-1);

            const isBg = obj.name.includes('bg');
            if (isBg) {
                prop.setTint(0xcccccc);
            }
        } else if (kind === 'roof') {
            // ROOF PROPS: Anchored to screen top (Header style)
            // Rendered in GameScene so they move with the camera.
            console.log(`[DecorationManager] Spawning Roof Prop: ${obj.name} at Screen Y=${this.roofOffsetPx}`);
            prop.setScrollFactor(1, 1);
            prop.setOrigin(0.5, 0); // Top-Center
            prop.setDepth(1000); // Overlay everything (Parallax Fog is depth 10)
            const camera = this.scene.cameras.main;
            prop.setY(camera.scrollY + (this.roofOffsetPx / camera.zoom));
        } else {
            // Ceiling (Normal)
            prop.setOrigin(0.5, 0);
            prop.setDepth(-1);
        }

        // Scale Variation
        // Base scale to match the 0.2 world:
        // Props are 350px. Tiles are 160px.
        // 350 * 0.2 = 70px.
        // We want some variation around 0.2 - 0.35.
        if (kind === 'roof') {
            prop.setScale(0.3);
        } else {
            const scale = Phaser.Math.FloatBetween(0.2, 0.35);
            prop.setScale(scale);
        }

        if (this.propsGroup) {
            this.propsGroup.add(prop);
        }
    }

    public update(): void {
        return;
    }

    public destroy(): void {
        if (!this.propsGroup) return;

        const group = this.propsGroup as any;
        if (!group.children) {
            this.propsGroup = null;
            return;
        }

        this.propsGroup.clear(true, true);
        this.propsGroup.destroy(true);
        this.propsGroup = null;

    }
}
