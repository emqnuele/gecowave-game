import Phaser from 'phaser';

export class ParticleManager {
    private scene: Phaser.Scene;
    private dustEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    public createDust(): void {
        // Create a simple white circle texture programmatically if not exists
        if (!this.scene.textures.exists('dust_mote')) {
            const graphics = this.scene.make.graphics({ x: 0, y: 0 });
            graphics.fillStyle(0xffffff);
            graphics.fillCircle(4, 4, 4);
            graphics.generateTexture('dust_mote', 8, 8);
        }

        const { width, height } = this.scene.scale;

        // "Fireflies" / Ambient Life Emitter
        this.dustEmitter = this.scene.add.particles(0, 0, 'dust_mote', {
            // Emit inside a zone larger than the screen to cover movement
            emitZone: {
                type: 'random',
                source: new Phaser.Geom.Rectangle(0, 0, width, height),
                quantity: 1
            } as Phaser.Types.GameObjects.Particles.ParticleEmitterEdgeZoneConfig,
            lifespan: 15000,
            quantity: 1, // Spawn 1 at a time
            frequency: 20, // Every 20ms spawns 1 particle with 15s lifespan
            scale: { start: 0.2, end: 0.5 }, // Slightly larger
            alpha: { start: 0, end: 1, ease: 'Sine.easeInOut' }, // Brighter alpha
            speedX: { min: -20, max: 20 },
            speedY: { min: -20, max: 20 },
            blendMode: 'ADD',
            tint: [0xffffff, 0xf0f0ff, 0xfffff0] // Milky White (Pure White, slight Blue-ish white, slight Warm white)
        });

        // Parallax Depth: -5 (Behind terrain, in front of columns)
        this.dustEmitter.setDepth(-5);
        // Scroll Factor: 1 (Fixed in world)
        this.dustEmitter.setScrollFactor(1);

        // We need to keep the emitter "with" the camera, but applying the scroll factor
        // means if we move the emitter 1px, the particles move 0.5px. 
        // To keep the 'spawn zone' centered on screen relative to that parallax layer,
        // we can just fix it to a camera follower that accounts for scroll factor, 
        // OR simply spawn in a massive area.
        // Easiest: Update emitter position in scene update to match camera * (1 - scrollFactor)?
        // Actually, if scrollFactor is 0.5, and we want it to cover the view, we just move it with the camera.

        // Let's hook into update to keep the emitter with the camera,
        // so we always spawn particles around the player's view.
        this.scene.events.on('update', () => {
            const cam = this.scene.cameras.main;

            // Check if emitZones exists and has at least one zone
            if (this.dustEmitter.emitZones && this.dustEmitter.emitZones.length > 0) {
                const zone = this.dustEmitter.emitZones[0];
                const source = zone.source as Phaser.Geom.Rectangle;

                if (source) {
                    // Update the spawn zone to match camera viewport in world coordinates, but EXPANDED
                    // We want particles to exist "ahead" of the player so they don't just pop in at the edge.
                    // Expand by 2x width/height in all directions.
                    const expandX = cam.width * 2;
                    const expandY = cam.height * 2;

                    source.setPosition(cam.worldView.x - expandX / 2, cam.worldView.y - expandY / 2);
                    source.setSize(cam.worldView.width + expandX, cam.worldView.height + expandY);
                }
            }
        });

        console.log('[ParticleManager] Ambient Dust system active (Parallax 0.5).');
    }
}
