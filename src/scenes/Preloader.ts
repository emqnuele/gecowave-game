import Phaser from 'phaser';

export class Preloader extends Phaser.Scene {
    constructor() {
        super('Preloader');
    }

    preload() {
        // Load Tilemap and Tileset
        this.load.image('tileset_main', 'assets/tileset_main.png');

        this.load.image('props_atlas', 'assets/props.png');
        this.load.image('background', 'assets/background.png');
        this.load.image('mainmenu', 'assets/mainmenu.png');
        this.load.image('ruins_columns', 'assets/ruins_columns.png');
        this.load.tilemapTiledJSON('level2', 'assets/level2.json');

        // UI Icons
        this.load.image('icon_analysis', 'assets/icon_analysis_1.png');
        this.load.image('icon_doublejump', 'assets/icon_doublejump.png');

        // Player Sprite Sheet
        // Sheet: 2800x1400. 4 rows.
        // Rows 0-2 (Idle, Run, Jump): 8 columns, 350x350.
        // Row 3 (Attack): 4 columns, 700x350.

        // Load for Standard actions (350x350).
        this.load.spritesheet('player', 'assets/sprites/player_sheet.png', { frameWidth: 350, frameHeight: 350 });

        // Load for Attack (700x350).
        // Since we need row 3, we can treat the whole sheet as 700x350 blocks.
        // Row 0: 4 frames (instead of 8 small ones).
        // Row 1: 4 frames.
        // Row 2: 4 frames.
        // Row 3: 4 frames (This is what we want! Indices 12-15).
        this.load.spritesheet('player_atk', 'assets/sprites/player_sheet.png', { frameWidth: 700, frameHeight: 350 });

        const graphics = this.make.graphics({ x: 0, y: 0 });

        // Player (Legacy graphics generation commented out)
        /*
        graphics.fillStyle(0x3366ff);
        graphics.fillRect(0, 0, 32, 64);
        graphics.generateTexture('player', 32, 64);
        graphics.clear();
        */

        // Enemy
        graphics.fillStyle(0xff3333);
        graphics.fillRect(0, 0, 32, 32);
        graphics.generateTexture('enemy', 32, 32);
        graphics.clear();

        // Ground - Only needed if map not loaded
        // ...

        // ------------------------------------
        // Generated Textures
        // ------------------------------------
        // Collision Box (for debugging invisible walls)
        graphics.fillStyle(0xff0000, 0.5); // Red with 50% opacity
        graphics.fillRect(0, 0, 32, 32);
        graphics.generateTexture('collision_box', 32, 32);
        graphics.clear();
        // Layer 1: Sky (Deep Blue/Black)
        graphics.fillStyle(0x0a0a1a); // Very dark blue
        graphics.fillRect(0, 0, 800, 600);
        graphics.generateTexture('bg_layer_1', 800, 600);
        graphics.clear();

        // Layer 2: Far Mountains (Dark Purple/Grey)
        graphics.fillStyle(0x1a1a2e);
        // Draw some mountain shapes or just a block
        graphics.fillRect(0, 200, 800, 400); // Bottom part
        graphics.generateTexture('bg_layer_2', 800, 600);
        graphics.clear();

        // Layer 3: Mid Ruins (Dark Cyan/Gray)
        graphics.fillStyle(0x2a2a4e);
        graphics.fillRect(0, 0, 800, 600);
        // Add vertical stripes for "pillars"
        graphics.fillStyle(0x16213e);
        graphics.fillRect(100, 0, 50, 600);
        graphics.fillRect(400, 0, 50, 600);
        graphics.generateTexture('bg_layer_3', 800, 600);
        graphics.clear();

        // Layer 4: Close Ruins (Darker, faster)
        graphics.fillStyle(0x0f3460); // Transparent-ish ideally, but solid for now
        // Just some props
        graphics.fillRect(200, 100, 100, 500);
        graphics.generateTexture('bg_layer_4', 800, 600);
        graphics.clear();

        // Fog Layer (Dusty Grey)
        graphics.fillStyle(0x8899aa, 1); // Solid color, controlled by alpha in ParallaxConfig
        graphics.generateTexture('fog', 800, 600);
        graphics.clear();

        // Particle Texture (Soft White Circle)
        graphics.clear();
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(4, 4, 4);
        // Add a bit of aura?
        graphics.fillStyle(0xffffff, 0.3);
        graphics.fillCircle(4, 4, 6);
        graphics.generateTexture('particle', 12, 12);
        graphics.clear();

    }

    create() {
        // Define Custom Frames for Props
        const atlas = this.textures.get('props_atlas');
        if (atlas) {
            const img = atlas.getSourceImage();
            console.log(`[Preloader] Props Atlas Dimensions: ${img.width}x${img.height}`);

            // ROW 1: Ground Props (Y=0, 350x350 each, 8 frames)
            for (let i = 0; i < 8; i++) {
                atlas.add(`prop_ground_${i}`, 0, i * 350, 0, 350, 350);
            }

            // ROW 2: Background Props (Y=525, 350x350 each, 8 frames)
            // Note: 175px spacer between row 1 (350) and row 2 (525).
            for (let i = 0; i < 8; i++) {
                atlas.add(`prop_bg_${i}`, 0, i * 350, 525, 350, 350);
            }

            // ROW 3: Ceiling Props (Y=1050, Variable Widths)
            // Note: 175px spacer between row 2 (525+350=875) and row 3 (1050).
            const ceilY = 1050;
            const ceilHeight = 350;
            // Widths: 525, 350, 350, 525, 350, 700
            const ceilWidths = [525, 350, 350, 525, 350, 700];
            let currentX = 0;

            ceilWidths.forEach((width, index) => {
                atlas.add(`prop_ceil_${index}`, 0, currentX, ceilY, width, ceilHeight);
                currentX += width;
            });

            console.log('[Preloader] Prop frames generated.');
        }

        this.scene.start('MainMenuScene');
    }
}
