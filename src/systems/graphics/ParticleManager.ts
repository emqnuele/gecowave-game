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
                source: new Phaser.Geom.Rectangle(-width, -height, width * 3, height * 3),
                quantity: 1
            } as Phaser.Types.GameObjects.Particles.ParticleEmitterEdgeZoneConfig,
            lifespan: 15000,
            quantity: 3, // Spawn 3 at a time
            frequency: 20, // Every 20ms (High density)
            scale: { start: 0.2, end: 0.5 }, // Slightly larger
            alpha: { start: 0, end: 1, ease: 'Sine.easeInOut' }, // Brighter alpha
            speedX: { min: -20, max: 20 },
            speedY: { min: -20, max: 20 },
            blendMode: 'ADD',
            tint: [0xffffff, 0xf0f0ff, 0xfffff0] // Milky White (Pure White, slight Blue-ish white, slight Warm white)
        });

        // Parallax Depth: -5 (Behind terrain, in front of columns)
        this.dustEmitter.setDepth(-5);
        // Scroll Factor: 0.5 (Moves with background/midground)
        this.dustEmitter.setScrollFactor(0.5);

        // We need to keep the emitter "with" the camera, but applying the scroll factor
        // means if we move the emitter 1px, the particles move 0.5px. 
        // To keep the 'spawn zone' centered on screen relative to that parallax layer,
        // we can just fix it to a camera follower that accounts for scroll factor, 
        // OR simply spawn in a massive area.
        // Easiest: Update emitter position in scene update to match camera * (1 - scrollFactor)?
        // Actually, if scrollFactor is 0.5, and we want it to cover the view, we just move it with the camera.

        // Let's hook into update to keep the center relatively close to the player
        this.scene.events.on('update', () => {
            const cam = this.scene.cameras.main;
            // We position the emitter center at the camera center
            // But since ScrollFactor is 0.5, we must compensate?
            // No, if we just move the emitter XY, the emitted particles will inherit that offset?
            // Phaser Particle Emitters with ScrollFactor are slightly tricky.
            // If ScrollFactor is 0.5, moving the emitter 100px moves particles 50px visually.
            // Let's simply center it on the camera.
            this.dustEmitter.setPosition(cam.scrollX * 0.5 + cam.centerX, cam.scrollY * 0.5 + cam.centerY);
            // Note: Multiplied by scrollX * (1 - scrollFactor) is usually the "fixed" pos, 
            // but here we want it to travel. 
            // Actually, if we want them to be "in the background", we can just position the emitter 
            // covering the whole map if possible, but that's wasteful.
            // Let's try centering on Camera Scroll * ScrollFactor.
        });

        console.log('[ParticleManager] Ambient Dust system active (Parallax 0.5).');
    }
}
