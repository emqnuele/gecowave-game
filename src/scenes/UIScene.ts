import Phaser from 'phaser';
import type { ProgressionSnapshot, StatKey } from '../components/PlayerStats';

type WaveSummary = {
    id: string;
    name: string;
};

type InventorySlot = {
    container: Phaser.GameObjects.Container;
    bg: Phaser.GameObjects.Graphics;
    icon: Phaser.GameObjects.Image;
    label: Phaser.GameObjects.Text;
    size: number;
    baseBorderColor: number;
};

export class UIScene extends Phaser.Scene {
    private healthBar!: Phaser.GameObjects.Graphics;
    private manaBar!: Phaser.GameObjects.Graphics;

    private healthText!: Phaser.GameObjects.Text;
    private manaText!: Phaser.GameObjects.Text;

    // Equipment Widget Components
    private widgetContainer!: Phaser.GameObjects.Container;
    private skillSlots: {
        container: Phaser.GameObjects.Container;
        bg: Phaser.GameObjects.Graphics;
        border: Phaser.GameObjects.Graphics;
        icon: Phaser.GameObjects.Image;
        cooldownOverlay: Phaser.GameObjects.Graphics;
        assignedLoadoutIndex: number; // Tracks which loadout index this slot is showing
    }[] = [];

    // UI State
    private currentLoadout: string[] = ['Empty', 'Empty', 'Empty'];
    private currentLoadoutSummary: (WaveSummary | null)[] = [null, null, null];
    private selectedSlotIndex: number = 0;

    // Inventory State
    private inventoryBackdrop!: Phaser.GameObjects.Graphics;
    private inventoryContainer!: Phaser.GameObjects.Container;
    private inventoryOpen: boolean = false;
    private tabHandler?: (event: KeyboardEvent) => void;
    private selectedEquippedSlotIndex: number | null = null;
    private inventoryEquippedSlots: InventorySlot[] = [];
    private inventoryStorageSlots: InventorySlot[] = [];
    private inventoryStatsTexts!: {
        level: Phaser.GameObjects.Text;
        xp: Phaser.GameObjects.Text;
        points: Phaser.GameObjects.Text;
        strength: Phaser.GameObjects.Text;
        vitality: Phaser.GameObjects.Text;
        mana: Phaser.GameObjects.Text;
    };
    private inventoryStatButtons: Record<StatKey, Phaser.GameObjects.Text> = {
        strength: null as unknown as Phaser.GameObjects.Text,
        vitality: null as unknown as Phaser.GameObjects.Text,
        mana: null as unknown as Phaser.GameObjects.Text
    };
    private storageWaves: string[] = [];
    private storageSummary: WaveSummary[] = [];
    private progression: ProgressionSnapshot = {
        level: 1,
        xp: 0,
        xpToNext: 100,
        statPoints: 0,
        strength: 0,
        vitality: 0,
        manaPower: 0
    };

    // Constants for visuals
    private readonly BAR_WIDTH = 250;
    private readonly BAR_HEIGHT = 20;
    private readonly MANA_BAR_HEIGHT = 15;
    private readonly PADDING = 20;

    // Inventory Layout Config
    private readonly INV_LAYOUT = {
        WIDTH: 900,
        HEIGHT: 520,
        PAD: 24,
        COL_GAP: 24,
        LEFT_RATIO: 0.38, // 38% for Left Column
        COLORS: {
            PANEL_BG: 0x0f1114,
            PANEL_BORDER: 0x6b5b46,
            SLOT_BG: 0x171513,
            SLOT_BORDER: 0x6b5b46,
            SLOT_BORDER_SELECT: 0x9e7b3b,
            TEXT_TITLE: '#e6d9c7',
            TEXT_LABEL: '#d3c4b1',
            TEXT_VALUE: '#f0e6d2',
            TEXT_HINT: '#8c7a66'
        },
        SLOT_SIZE: {
            ARMOR: 40,
            EQUIP: 40,
            WAVE_EQUIPPED: 50,
            WAVE_STORAGE: 42
        }
    };

    constructor() {
        super('UIScene');
    }

    create(data: {
        hp: number,
        maxHp: number,
        mana: number,
        maxMana: number,
        waveName: string,
        selectedSlot?: number,
        loadout?: string[],
        loadoutSummary?: (WaveSummary | null)[],
        storage?: string[],
        storageSummary?: WaveSummary[],
        progression?: ProgressionSnapshot
    }) {
        // Initialize Graphics for Bars
        this.healthBar = this.add.graphics();
        this.manaBar = this.add.graphics();

        // Initialize Text for Bars
        this.healthText = this.add.text(this.PADDING + 10, this.PADDING + 2, '', {
            font: 'bold 12px serif',
            color: '#bdc3c7', // Muted silver
            shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 2, fill: true }
        }).setDepth(10); // Ensure on top

        this.manaText = this.add.text(this.PADDING + 10, this.PADDING + this.BAR_HEIGHT + 12, '', {
            font: 'italic 10px serif',
            color: '#aab7b8', // Darker gray
            shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 2, fill: true }
        }).setDepth(10);

        // Create Equipment Widget Container
        const { width, height } = this.scale;
        this.widgetContainer = this.add.container(width - 120, height - 80);

        // Setup Skills Widget (3 Slots)
        this.createSkillsWidget();

        // Update Initial Wave Data
        // Use provided data or defaults
        this.updateWaveInfo(
            data.waveName || 'Analysis Wave',
            0,
            data.selectedSlot || 0,
            data.loadout || ['Analysis Wave', 'Empty', 'Empty'],
            data.loadoutSummary || null
        );

        this.storageWaves = data.storage || [];
        this.storageSummary = data.storageSummary || [];
        if (data.progression) {
            this.progression = data.progression;
        }

        // Setup Events
        const gameScene = this.scene.get('GameScene');
        if (gameScene) {
            gameScene.events.on('player-stats-changed', this.handleStatsChange, this);
            gameScene.events.on('player-active-wave-changed', this.handleWaveChange, this);
            gameScene.events.on('player-wave-used', this.handleWaveUsed, this);
            gameScene.events.on('player-wave-storage-changed', this.handleStorageChange, this);
            gameScene.events.on('player-progression-changed', this.handleProgressionChange, this);
        }

        // Draw Initial State
        this.updateHealthBar(data.hp, data.maxHp);
        this.updateManaBar(data.mana, data.maxMana);

        // Inventory UI
        this.createInventoryUI();
        this.closeInventory();

        // Input
        if (this.input.keyboard) {
            this.tabHandler = (event: KeyboardEvent) => {
                event.preventDefault();
                this.toggleInventory();
            };
            this.input.keyboard.on('keydown-TAB', this.tabHandler);
        }

        if (this.input.mouse) {
            this.input.mouse.disableContextMenu();
        }

        this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);

        // Clean up on shutdown
        this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
            if (gameScene && gameScene.sys && gameScene.sys.isActive()) {
                gameScene.events.off('player-stats-changed', this.handleStatsChange, this);
                gameScene.events.off('player-active-wave-changed', this.handleWaveChange, this);
                gameScene.events.off('player-wave-used', this.handleWaveUsed, this);
                gameScene.events.off('player-wave-storage-changed', this.handleStorageChange, this);
                gameScene.events.off('player-progression-changed', this.handleProgressionChange, this);
            }
            if (this.input.keyboard && this.tabHandler) {
                this.input.keyboard.off('keydown-TAB', this.tabHandler);
            }
            this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
        });
    }

    private createSkillsWidget() {
        // Clear existing slots to prevent duplicates on restart
        this.skillSlots = [];

        // Create 3 static visual slots
        // Visual Slot 0: Center (Active)
        // Visual Slot 1: Left (Inactive)
        // Visual Slot 2: Right (Inactive)

        const configs = [
            { x: 0, y: -20, size: 50, isMain: true },   // Center
            { x: -50, y: 20, size: 30, isMain: false }, // Left
            { x: 50, y: 20, size: 30, isMain: false }   // Right
        ];

        const { width, height } = this.scale;
        const widgetX = width - 120;
        const widgetY = height - 80;

        configs.forEach((config) => {
            const slotContainer = this.add.container(config.x, config.y);

            // 1. Background (Fill Only)
            const bg = this.add.graphics();
            this.drawDiamond(bg, 0, 0, config.size, 0x000000, config.isMain ? 0.8 : 0.6, undefined);

            // 2. Icon Mask (Absolute Positioning)
            // We create a separate graphics object in World Space (not in container)
            // This avoids Container transform issues with Masks.
            const absX = widgetX + config.x;
            const absY = widgetY + config.y;

            const maskGraphics = this.make.graphics({ x: absX, y: absY }, false);
            this.drawDiamond(maskGraphics, 0, 0, config.size, 0xffffff, 1, 0xffffff);

            // Should be invisible, but active as a mask
            maskGraphics.setVisible(false);

            const mask = maskGraphics.createGeometryMask();

            const icon = this.add.image(0, 0, '').setVisible(false);
            icon.setMask(mask);

            // 3. Border (Stroke Only)
            const border = this.add.graphics();
            this.drawDiamond(border, 0, 0, config.size, undefined, 0, config.isMain ? 0xffffff : 0xbdc3c7);

            const cooldownOverlay = this.add.graphics();

            // Add components to container
            slotContainer.add([bg, icon, border, cooldownOverlay]);

            this.widgetContainer.add(slotContainer);

            this.skillSlots.push({
                container: slotContainer,
                bg,
                border,
                icon,
                cooldownOverlay,
                assignedLoadoutIndex: -1
            });
        });

        // Initialize FX Particles (One-shot burst)
        this.switchParticles = this.add.particles(0, 0, 'particle', {
            speed: { min: 50, max: 150 },
            scale: { start: 0.6, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 500,
            gravityY: 0,
            quantity: 10,
            emitting: false
        });
        this.widgetContainer.add(this.switchParticles); // Add to container so it moves with widget

        // Initial update
        this.updateWidgetContent();
    }

    private updateWidgetContent() {
        // Map Loadout Indices to Visual Slots
        // Visual Slot 0 (Center) -> selectedSlotIndex
        // Visual Slot 1 (Left) -> First non-selected index
        // Visual Slot 2 (Right) -> Second non-selected index

        const indices = [0, 1, 2];
        const nonSelectedIndices = indices.filter(i => i !== this.selectedSlotIndex);

        // Mapping: Visual Index -> Loadout Index
        const mapping = [
            this.selectedSlotIndex, // Visual 0 gets Selected
            nonSelectedIndices[0],  // Visual 1 gets first other
            nonSelectedIndices[1]   // Visual 2 gets second other
        ];

        const sizes = [50, 30, 30]; // Matches create config

        this.skillSlots.forEach((slot, visualIndex) => {
            const loadoutIndex = mapping[visualIndex];
            slot.assignedLoadoutIndex = loadoutIndex;

            if (loadoutIndex !== undefined) {
                const waveName = this.currentLoadout[loadoutIndex];
                const texture = this.getIconForWave(waveName);

                if (texture) {
                    slot.icon.setTexture(texture);
                    slot.icon.setVisible(true);

                    const slotSize = sizes[visualIndex];
                    // Scale to fill diamond (Size is radius, Width is 2*Size)
                    // We use 2.1 to ensure full coverage without gaps
                    const scaleSize = slotSize * 2.1;
                    slot.icon.setDisplaySize(scaleSize, scaleSize);
                } else {
                    slot.icon.setVisible(false);
                }
            } else {
                slot.icon.setVisible(false);
            }
        });
    }

    private drawDiamond(graphics: Phaser.GameObjects.Graphics, x: number, y: number, size: number, fillColor: number | undefined, alpha: number, strokeColor: number | undefined) {
        if (fillColor !== undefined) {
            graphics.fillStyle(fillColor, alpha);
        }
        if (strokeColor !== undefined) {
            graphics.lineStyle(2, strokeColor);
        }

        // Draw Diamond path
        const path = new Phaser.Geom.Polygon([
            x, y - size, // Top
            x + size, y, // Right
            x, y + size, // Bottom
            x - size, y  // Left
        ]);

        if (fillColor !== undefined) {
            graphics.fillPoints(path.points, true);
        }
        if (strokeColor !== undefined) {
            graphics.strokePoints(path.points, true);
        }
    }

    private handleStatsChange(data: { hp: number, maxHp: number, mana: number, maxMana: number }) {
        this.updateHealthBar(data.hp, data.maxHp);
        this.updateManaBar(data.mana, data.maxMana);
    }

    private handleWaveChange(data: { type: string, waveName: string, manaCost: number, selectedSlot: number, loadout: string[], loadoutSummary?: (WaveSummary | null)[] }) {
        // receive full state
        this.updateWaveInfo(data.waveName, data.manaCost, data.selectedSlot, data.loadout, data.loadoutSummary || null);
    }

    // FX
    private switchParticles!: Phaser.GameObjects.Particles.ParticleEmitter;

    private updateWaveInfo(_activeName: string, _manaCost: number, selectedSlot: number, loadout: string[], loadoutSummary: (WaveSummary | null)[] | null) {
        const previousSlot = this.selectedSlotIndex;
        this.selectedSlotIndex = selectedSlot;
        if (loadout) this.currentLoadout = loadout;
        if (loadoutSummary) {
            this.currentLoadoutSummary = loadoutSummary;
        } else {
            this.currentLoadoutSummary = this.currentLoadout.map(name => name === 'Empty' ? null : { id: name, name });
        }

        this.selectedEquippedSlotIndex = this.selectedSlotIndex;

        this.updateWidgetContent();
        if (this.inventoryOpen) {
            this.updateInventoryWaves();
        }

        // Play Effect if Slot Changed
        if (previousSlot !== this.selectedSlotIndex) {
            this.playSwitchEffect();
        }
    }

    private playSwitchEffect() {
        const mainSlot = this.skillSlots[0]; // Visual Slot 0 is always Center/Main

        // 1. Gold Flash
        // We can't tween "lineColor" easily on Graphics object directly without redrawing.
        // Instead, we can overlay a "Gold" diamond and fade it out.
        const flash = this.add.graphics();
        mainSlot.container.add(flash); // Add to main slot container
        this.drawDiamond(flash, 0, 0, 50, undefined, 0, 0xFFD700); // Transparent fill (undefined), Gold stroke

        this.tweens.add({
            targets: flash,
            alpha: { from: 1, to: 0 },
            duration: 500,
            onComplete: () => flash.destroy()
        });

        // 2. Pulse Animation
        this.tweens.add({
            targets: mainSlot.container,
            scale: { from: 1.2, to: 1 },
            duration: 300,
            ease: 'Back.easeOut'
        });

        // 3. Particle Burst
        // Emit from center (relative to widgetContainer)
        // Main slot is at (0, -20) inside widgetContainer
        this.switchParticles.setPosition(0, -20);
        this.switchParticles.explode(15);
    }

    private getIconForWave(waveName: string): string | null {
        if (!waveName || waveName === 'Empty') return null;

        const map: Record<string, string> = {
            'Analysis Wave': 'icon_analysis',
            'Double Jump': 'icon_doublejump'
        };

        return map[waveName] || null;
    }

    private handleWaveUsed(data: { waveName: string, cooldown: number }) {
        // Find which loadout index used it
        const loadoutIndex = this.currentLoadout.indexOf(data.waveName);
        if (loadoutIndex === -1) return;

        // Find which Visual Slot is displaying this loadout index
        const slot = this.skillSlots.find(s => s.assignedLoadoutIndex === loadoutIndex);
        if (!slot) return;

        const overlay = slot.cooldownOverlay;
        const size = (slot === this.skillSlots[0]) ? 50 : 30; // 0 is always Main/Center

        overlay.clear();
        this.drawDiamond(overlay, 0, 0, size, 0x000000, 0.8, 0x000000);
        overlay.alpha = 0.7;

        this.tweens.add({
            targets: overlay,
            scaleY: 0,
            duration: data.cooldown,
            ease: 'Linear',
            onComplete: () => {
                overlay.clear();
                overlay.scaleY = 1;
            }
        });
    }

    private handleStorageChange(data: { storage: string[]; storageSummary?: WaveSummary[] }) {
        this.storageWaves = data.storage || [];
        this.storageSummary = data.storageSummary || [];
        if (this.inventoryOpen) {
            this.updateInventoryWaves();
        }
    }

    private handleProgressionChange(data: ProgressionSnapshot) {
        this.progression = data;
        if (this.inventoryOpen) {
            this.updateInventoryStats();
        }
    }

    private toggleInventory() {
        if (this.inventoryOpen) {
            this.closeInventory();
        } else {
            this.openInventory();
        }
    }

    private openInventory() {
        this.inventoryOpen = true;
        this.inventoryBackdrop.setVisible(true);
        this.inventoryContainer.setVisible(true);
        this.updateInventoryWaves();
        this.updateInventoryStats();

        if (this.scene.isActive('GameScene')) {
            this.scene.pause('GameScene');
        }
    }

    private closeInventory() {
        this.inventoryOpen = false;
        if (this.inventoryBackdrop) this.inventoryBackdrop.setVisible(false);
        if (this.inventoryContainer) this.inventoryContainer.setVisible(false);

        if (this.scene.isPaused('GameScene')) {
            this.scene.resume('GameScene');
        }
    }

    private handleResize(_gameSize: Phaser.Structs.Size) {
        if (!this.inventoryContainer) return;

        const wasOpen = this.inventoryOpen;
        this.destroyInventoryUI();
        this.createInventoryUI();

        if (wasOpen) {
            this.openInventory();
        } else {
            this.closeInventory();
        }
    }

    private destroyInventoryUI() {
        if (this.inventoryBackdrop) this.inventoryBackdrop.destroy();
        if (this.inventoryContainer) this.inventoryContainer.destroy();
    }

    private createInventoryUI() {
        const { width, height } = this.scale;
        const L = this.INV_LAYOUT;

        // 1. Backdrop
        this.inventoryBackdrop = this.add.graphics().setDepth(30);
        this.inventoryBackdrop.fillStyle(0x000000, 0.7);
        this.inventoryBackdrop.fillRect(0, 0, width, height);

        // 2. Main Container
        this.inventoryContainer = this.add.container(width / 2, height / 2).setDepth(31);

        // Panel Dimensions
        const panelW = Math.min(width * 0.9, L.WIDTH);
        const panelH = Math.min(height * 0.9, L.HEIGHT);
        const halfW = panelW / 2;
        const halfH = panelH / 2;

        // Background
        const bg = this.add.graphics();
        bg.fillStyle(L.COLORS.PANEL_BG, 0.98);
        bg.fillRoundedRect(-halfW, -halfH, panelW, panelH, 8);
        bg.lineStyle(2, L.COLORS.PANEL_BORDER, 1);
        bg.strokeRoundedRect(-halfW, -halfH, panelW, panelH, 8);
        // Inner cosmetic border
        bg.lineStyle(1, 0x2b2a28, 0.5);
        bg.strokeRoundedRect(-halfW + 6, -halfH + 6, panelW - 12, panelH - 12, 6);
        this.inventoryContainer.add(bg);

        // Header Title
        const titleY = -halfH + L.PAD;
        const title = this.add.text(-halfW + L.PAD, titleY, 'Inventory', {
            font: 'bold 22px serif',
            color: L.COLORS.TEXT_TITLE
        }).setOrigin(0, 0);
        this.inventoryContainer.add(title);

        // Header Divider
        const dividerY = titleY + 35;
        const headerLine = this.add.graphics();
        headerLine.lineStyle(1, L.COLORS.PANEL_BORDER, 0.5);
        headerLine.lineBetween(-halfW + L.PAD, dividerY, halfW - L.PAD, dividerY);
        this.inventoryContainer.add(headerLine);

        // --- Layout Columns ---
        const contentTop = dividerY + L.PAD;
        const contentBottom = halfH - L.PAD;


        // Widths
        const totalContentW = panelW - (L.PAD * 2);
        const leftColW = Math.floor(totalContentW * L.LEFT_RATIO);
        const rightColW = totalContentW - leftColW - L.COL_GAP;

        // X Positions (Center of each column)
        const leftColCenterX = -halfW + L.PAD + (leftColW / 2);
        const rightColCenterX = halfW - L.PAD - (rightColW / 2);

        // Vertical Divider
        const vDividerX = -halfW + L.PAD + leftColW + (L.COL_GAP / 2);
        const vDivider = this.add.graphics();
        vDivider.lineStyle(1, L.COLORS.PANEL_BORDER, 0.3);
        vDivider.lineBetween(vDividerX, contentTop, vDividerX, contentBottom);
        this.inventoryContainer.add(vDivider);


        // ==========================
        // LEFT COLUMN: Character & Equipment
        // ==========================

        // 1. Character Preview & Armor
        // Group them to center visually
        const previewSize = 140;
        const armorSize = L.SLOT_SIZE.ARMOR;
        const armorGap = 8;
        const groupW = previewSize + 16 + armorSize; // Preview + gap + armor column
        const groupStartX = leftColCenterX - (groupW / 2);
        const groupY = contentTop;

        // Preview Box
        const previewFrame = this.add.graphics();
        previewFrame.fillStyle(0x000000, 0.3);
        previewFrame.fillRect(groupStartX, groupY, previewSize, previewSize);
        previewFrame.lineStyle(1, L.COLORS.PANEL_BORDER, 0.8);
        previewFrame.strokeRect(groupStartX, groupY, previewSize, previewSize);
        this.inventoryContainer.add(previewFrame);

        // Character Sprite
        const charSprite = this.add.sprite(groupStartX + previewSize / 2, groupY + previewSize / 2 + 10, 'player', 0);
        charSprite.setScale(0.2); // Adjust scale as needed
        this.inventoryContainer.add(charSprite);

        // Armor Slots (Vertical stack to right of preview)
        const armorStartX = groupStartX + previewSize + 16 + (armorSize / 2);
        const armorTotalH = (armorSize * 4) + (armorGap * 3);
        const armorStartY = groupY + (previewSize / 2) - (armorTotalH / 2) + (armorSize / 2);

        const armorLabel = this.add.text(armorStartX, armorStartY - (armorSize / 2) - 15, 'Armor', {
            font: '12px serif', color: L.COLORS.TEXT_LABEL
        }).setOrigin(0.5, 1);
        this.inventoryContainer.add(armorLabel);

        for (let i = 0; i < 4; i++) {
            const y = armorStartY + i * (armorSize + armorGap);
            this.createInventorySlot(this.inventoryContainer, armorStartX, y, armorSize);
            // Label empty for now
        }

        // 2. Equipment Grid (Below Character)
        const equipY = groupY + previewSize + 30;

        const equipLabel = this.add.text(leftColCenterX - (leftColW / 2), equipY, 'Equipment', {
            font: 'bold 16px serif', color: L.COLORS.TEXT_TITLE
        }).setOrigin(0, 1);
        this.inventoryContainer.add(equipLabel);

        const equipSlotSize = L.SLOT_SIZE.EQUIP;
        const equipGap = 8;
        const equipCols = 5; // Fit 5 in row
        const equipRows = 3;

        // Calculate grid centering
        const equipGridW = (equipCols * equipSlotSize) + ((equipCols - 1) * equipGap);
        const equipGridStartX = leftColCenterX - (equipGridW / 2) + (equipSlotSize / 2);
        const equipGridStartY = equipY + 10 + (equipSlotSize / 2);

        for (let r = 0; r < equipRows; r++) {
            for (let c = 0; c < equipCols; c++) {
                const x = equipGridStartX + c * (equipSlotSize + equipGap);
                const y = equipGridStartY + r * (equipSlotSize + equipGap);
                // Just visual slots for now
                this.createInventorySlot(this.inventoryContainer, x, y, equipSlotSize);
            }
        }


        // ==========================
        // RIGHT COLUMN: Waves & Stats
        // ==========================
        const rightColLeftX = vDividerX + (L.COL_GAP / 2);

        // 1. Waves Header
        this.add.text(rightColLeftX, contentTop, 'Waves', {
            font: 'bold 18px serif', color: L.COLORS.TEXT_TITLE
        }).setOrigin(0, 0);

        // Hint Text
        this.add.text(halfW - L.PAD, contentTop + 4, 'L-Click: Equip / R-Click: Unequip', {
            font: 'italic 11px serif', color: L.COLORS.TEXT_HINT
        }).setOrigin(1, 0);

        // 2. Equipped Waves
        const waveEquipY = contentTop + 40;
        const wEquipSize = L.SLOT_SIZE.WAVE_EQUIPPED;
        const wEquipGap = 20;

        this.add.text(rightColLeftX, waveEquipY + (wEquipSize / 2), 'Equipped', {
            font: '14px serif', color: L.COLORS.TEXT_LABEL
        }).setOrigin(0, 0.5);

        // Center the 3 equipped slots in the remaining space of right col? 
        // Or just align them nicely. Let's align right.
        const wGroupX = rightColLeftX + 100; // Offset for label

        this.inventoryEquippedSlots = [];
        for (let i = 0; i < 3; i++) {
            const x = wGroupX + i * (wEquipSize + wEquipGap) + (wEquipSize / 2);
            const y = waveEquipY + (wEquipSize / 2);

            const slot = this.createInventorySlot(this.inventoryContainer, x, y, wEquipSize);

            // Interaction
            slot.container.setInteractive(new Phaser.Geom.Rectangle(-wEquipSize / 2, -wEquipSize / 2, wEquipSize, wEquipSize), Phaser.Geom.Rectangle.Contains);
            slot.container.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                if (pointer.rightButtonDown()) {
                    const gameScene = this.scene.get('GameScene');
                    if (gameScene) gameScene.events.emit('ui-unequip-wave', { equipSlot: i });
                } else {
                    this.selectEquippedSlot(i);
                    const gameScene = this.scene.get('GameScene');
                    if (gameScene) gameScene.events.emit('ui-select-wave-slot', { equipSlot: i });
                }
            });
            this.inventoryEquippedSlots.push(slot);
        }

        // 3. Storage Waves
        const waveStorageY = waveEquipY + wEquipSize + 30;

        this.add.text(rightColLeftX, waveStorageY, 'Storage', {
            font: '14px serif', color: L.COLORS.TEXT_LABEL
        }).setOrigin(0, 0);

        const wStoreSize = L.SLOT_SIZE.WAVE_STORAGE;
        const wStoreGap = 10;
        const wStoreCols = 6;
        const wStoreRows = 2;

        // Grid Calculation
        const wStoreGridW = (wStoreCols * wStoreSize) + ((wStoreCols - 1) * wStoreGap);
        // Center this grid in the right column space
        const wStoreStartX = rightColCenterX - (wStoreGridW / 2) + (wStoreSize / 2);
        const wStoreStartY = waveStorageY + 25 + (wStoreSize / 2);

        this.inventoryStorageSlots = [];
        for (let r = 0; r < wStoreRows; r++) {
            for (let c = 0; c < wStoreCols; c++) {
                const x = wStoreStartX + c * (wStoreSize + wStoreGap);
                const y = wStoreStartY + r * (wStoreSize + wStoreGap + 20); // Extra vertical gap

                const slot = this.createInventorySlot(this.inventoryContainer, x, y, wStoreSize);

                // Interaction
                const index = r * wStoreCols + c;
                slot.container.setInteractive(new Phaser.Geom.Rectangle(-wStoreSize / 2, -wStoreSize / 2, wStoreSize, wStoreSize), Phaser.Geom.Rectangle.Contains);
                slot.container.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                    if (!pointer.rightButtonDown()) {
                        const hasWave = !!this.storageSummary[index] || !!this.storageWaves[index];
                        if (hasWave) {
                            const target = this.getPreferredEquipSlot();
                            if (target !== null) {
                                const gameScene = this.scene.get('GameScene');
                                if (gameScene) gameScene.events.emit('ui-equip-wave', { storageIndex: index, equipSlot: target });
                            }
                        }
                    }
                });
                this.inventoryStorageSlots.push(slot);
            }
        }

        // 4. Stats Section (Bottom of Right Column)
        const statsY = contentBottom - 120;

        // Divider above stats
        const starDiv = this.add.graphics();
        starDiv.lineStyle(1, L.COLORS.PANEL_BORDER, 0.3);
        starDiv.lineBetween(rightColLeftX, statsY - 15, halfW - L.PAD, statsY - 15);
        this.inventoryContainer.add(starDiv);

        this.add.text(rightColLeftX, statsY, 'Stats', {
            font: 'bold 16px serif', color: L.COLORS.TEXT_TITLE
        }).setOrigin(0, 0);

        // Stats Columns
        const statsContentY = statsY + 30;
        const col1X = rightColLeftX + 20;
        const col2X = rightColCenterX + 20;

        // Helper to create stat row
        const createStatText = (x: number, y: number, label: string) => {
            const t = this.add.text(x, y, label, { font: '14px serif', color: L.COLORS.TEXT_VALUE });
            this.inventoryContainer.add(t);
            return t;
        };

        const levelText = createStatText(col1X, statsContentY, '');
        const xpText = createStatText(col1X, statsContentY + 25, '');
        const pointsText = createStatText(col1X, statsContentY + 50, '');

        const strText = createStatText(col2X, statsContentY, '');
        const vitText = createStatText(col2X, statsContentY + 25, '');
        const manaText = createStatText(col2X, statsContentY + 50, '');

        // Buttons (Aligned to right of numbers)
        // We'll place them dynamically or fixed relative to col2X
        const btnX = halfW - L.PAD - 20;
        const strengthButton = this.createStatButton(btnX, statsContentY, 'strength').setOrigin(1, 0);
        const vitalityButton = this.createStatButton(btnX, statsContentY + 25, 'vitality').setOrigin(1, 0);
        const manaButton = this.createStatButton(btnX, statsContentY + 50, 'mana').setOrigin(1, 0);

        this.inventoryContainer.add([strengthButton, vitalityButton, manaButton]);

        this.inventoryStatsTexts = {
            level: levelText,
            xp: xpText,
            points: pointsText,
            strength: strText,
            vitality: vitText,
            mana: manaText
        };

        // Initial Populates
        this.updateInventoryWaves();
        this.updateInventoryStats();
    }

    private createInventorySlot(parent: Phaser.GameObjects.Container, x: number, y: number, size: number): InventorySlot {
        const container = this.add.container(x, y);
        const bg = this.add.graphics();
        const baseBorderColor = 0x6b5b46;
        this.redrawInventorySlot(bg, size, baseBorderColor);

        const icon = this.add.image(0, 0, '').setVisible(false);
        const label = this.add.text(0, size / 2 + 6, '', {
            font: '10px serif',
            color: '#d0c1ae'
        }).setOrigin(0.5, 0);

        container.add([bg, icon, label]);
        parent.add(container);

        return { container, bg, icon, label, size, baseBorderColor };
    }

    private redrawInventorySlot(bg: Phaser.GameObjects.Graphics, size: number, borderColor: number) {
        bg.clear();
        bg.fillStyle(this.INV_LAYOUT.COLORS.SLOT_BG, 0.95);
        bg.fillRect(-size / 2, -size / 2, size, size);
        bg.lineStyle(2, borderColor, 0.9);
        bg.strokeRect(-size / 2, -size / 2, size, size);
        bg.lineStyle(1, 0x2b2a28, 0.8);
        bg.strokeRect(-size / 2 + 3, -size / 2 + 3, size - 6, size - 6);
    }

    private setSlotContent(slot: InventorySlot, waveName: string) {
        if (!waveName || waveName === 'Empty') {
            slot.icon.setVisible(false);
            slot.label.setText('');
            return;
        }

        const texture = this.getIconForWave(waveName);
        if (texture) {
            slot.icon.setTexture(texture);
            slot.icon.setVisible(true);
            slot.icon.setDisplaySize(slot.size * 0.8, slot.size * 0.8);
        } else {
            slot.icon.setVisible(false);
        }

        slot.label.setText(this.shortenWaveName(waveName));
    }

    private shortenWaveName(name: string): string {
        if (name.length <= 12) return name;
        return `${name.slice(0, 10)}...`;
    }

    private selectEquippedSlot(index: number) {
        if (this.selectedEquippedSlotIndex === index) {
            this.selectedEquippedSlotIndex = null;
        } else {
            this.selectedEquippedSlotIndex = index;
        }

        this.updateEquippedSelection();
    }

    private updateEquippedSelection() {
        this.inventoryEquippedSlots.forEach((slot, index) => {
            const isSelected = this.selectedEquippedSlotIndex === index;
            const borderColor = isSelected ? 0x9e7b3b : slot.baseBorderColor;
            this.redrawInventorySlot(slot.bg, slot.size, borderColor);
        });
    }

    private getPreferredEquipSlot(): number | null {
        if (this.selectedEquippedSlotIndex !== null) {
            return this.selectedEquippedSlotIndex;
        }

        const emptyIndex = this.currentLoadout.findIndex((_name, index) => this.isEquippedSlotEmpty(index));
        if (emptyIndex >= 0) return emptyIndex;

        return 0;
    }

    private isEquippedSlotEmpty(index: number): boolean {
        const summary = this.currentLoadoutSummary[index];
        if (summary === null) return true;
        if (summary) return false;

        const name = this.currentLoadout[index];
        return !name || name === 'Empty';
    }

    private updateInventoryWaves() {
        this.inventoryEquippedSlots.forEach((slot, index) => {
            const waveSummary = this.currentLoadoutSummary[index];
            const waveName = waveSummary ? waveSummary.name : (this.currentLoadout[index] || 'Empty');
            this.setSlotContent(slot, waveName);
        });

        this.inventoryStorageSlots.forEach((slot, index) => {
            const waveSummary = this.storageSummary[index];
            const waveName = waveSummary ? waveSummary.name : (this.storageWaves[index] || 'Empty');
            this.setSlotContent(slot, waveName);
        });

        this.updateEquippedSelection();
    }

    private updateInventoryStats() {
        const { level, xp, xpToNext, statPoints, strength, vitality, manaPower } = this.progression;

        this.inventoryStatsTexts.level.setText(`Level: ${level}`);
        this.inventoryStatsTexts.xp.setText(`XP: ${xp} / ${xpToNext}`);
        this.inventoryStatsTexts.points.setText(`Points: ${statPoints}`);
        this.inventoryStatsTexts.strength.setText(`Strength: ${strength}`);
        this.inventoryStatsTexts.vitality.setText(`Vitality: ${vitality}`);
        this.inventoryStatsTexts.mana.setText(`Mana: ${manaPower}`);

        const buttonAlpha = statPoints > 0 ? 1 : 0.35;
        const buttons = [
            this.inventoryStatButtons.strength,
            this.inventoryStatButtons.vitality,
            this.inventoryStatButtons.mana
        ];

        buttons.forEach(button => {
            button.setAlpha(buttonAlpha);
            if (statPoints > 0) {
                button.setInteractive({ useHandCursor: true });
            } else {
                button.disableInteractive();
            }
        });
    }

    private createStatButton(x: number, y: number, stat: StatKey): Phaser.GameObjects.Text {
        const button = this.add.text(x, y, '+', {
            font: 'bold 14px serif',
            color: this.INV_LAYOUT.COLORS.TEXT_TITLE
        }).setOrigin(0, 0);

        button.setInteractive({ useHandCursor: true });
        button.on('pointerover', () => {
            button.setColor('#f5e7d4');
        });
        button.on('pointerout', () => {
            button.setColor('#e6d9c7');
        });
        button.on('pointerdown', () => {
            if (this.progression.statPoints <= 0) return;

            const gameScene = this.scene.get('GameScene');
            if (gameScene) {
                gameScene.events.emit('ui-allocate-stat', { stat });
            }
        });

        this.inventoryStatButtons[stat] = button;
        return button;
    }

    private updateHealthBar(current: number, max: number) {
        this.healthBar.clear();

        const x = this.PADDING;
        const y = this.PADDING;
        const width = this.BAR_WIDTH;
        const height = this.BAR_HEIGHT;
        const slant = 10;

        // Background (Darker, more opaque)
        this.healthBar.fillStyle(0x000000, 0.7);
        const bgPoints = [
            { x: x, y: y },
            { x: x + width, y: y },
            { x: x + width - slant, y: y + height },
            { x: x, y: y + height }
        ];
        this.healthBar.fillPoints(bgPoints, true);

        // Current HP (Blood Red Gradient)
        if (current > 0) {
            const currentWidth = Math.max(0, (current / max) * width);
            // Deep crimson to dark red
            this.healthBar.fillGradientStyle(0x641e16, 0x922b21, 0x4a235a, 0x641e16, 1);

            const fillSlant = currentWidth < slant ? currentWidth : slant;
            const fillPoints = [
                { x: x, y: y },
                { x: x + currentWidth, y: y },
                { x: x + currentWidth - fillSlant, y: y + height },
                { x: x, y: y + height }
            ];
            this.healthBar.fillPoints(fillPoints, true);
        }

        // Outer Glow/Border (Dark Iron)
        this.healthBar.lineStyle(2, 0x2e4053, 0.9);
        this.healthBar.strokePoints(bgPoints, true);

        // Inner Highlight (Faint Iron)
        this.healthBar.lineStyle(1, 0x566573, 0.4);
        this.healthBar.strokePoints(bgPoints, true);

        // Update Text
        this.healthText.setText(`${Math.floor(current)} / ${Math.floor(max)}`);
        this.healthText.setX(x + 10);
    }

    private updateManaBar(current: number, max: number) {
        this.manaBar.clear();

        const x = this.PADDING;
        const y = this.PADDING + this.BAR_HEIGHT + 8;
        const width = this.BAR_WIDTH * 0.8; // Mana bar slightly shorter
        const height = this.MANA_BAR_HEIGHT;
        const slant = 8;

        // Background
        this.manaBar.fillStyle(0x000000, 0.7);
        const bgPoints = [
            { x: x, y: y },
            { x: x + width, y: y },
            { x: x + width - slant, y: y + height },
            { x: x, y: y + height }
        ];
        this.manaBar.fillPoints(bgPoints, true);

        // Current Mana (Deep Indigo/Purple Gradient)
        if (current > 0) {
            const currentWidth = Math.max(0, (current / max) * width);
            // Dark violet to deep indigo
            this.manaBar.fillGradientStyle(0x4a235a, 0x5b2c6f, 0x154360, 0x4a235a, 1);

            const fillSlant = currentWidth < slant ? currentWidth : slant;
            const fillPoints = [
                { x: x, y: y },
                { x: x + currentWidth, y: y },
                { x: x + currentWidth - fillSlant, y: y + height },
                { x: x, y: y + height }
            ];
            this.manaBar.fillPoints(fillPoints, true);
        }

        // Border (Iron)
        this.manaBar.lineStyle(1.5, 0x2e4053, 0.7);
        this.manaBar.strokePoints(bgPoints, true);

        // Update Text
        this.manaText.setText(`${Math.floor(current)} / ${Math.floor(max)}`);
        this.manaText.setPosition(x + 10, y + 1);
    }
}
