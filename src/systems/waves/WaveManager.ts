import Phaser from 'phaser';
import { Player } from '../../entities/Player';
import { PlayerStats } from '../../components/PlayerStats';
import { BaseWave } from './BaseWave';

export class WaveManager {
    private player: Player;
    private scene: Phaser.Scene;
    private stats: PlayerStats;

    private equippedWaves: (BaseWave | null)[] = [null, null, null]; // Max 3 slots
    private storageWaves: BaseWave[] = [];
    private keys!: Phaser.Input.Keyboard.Key[];
    private castKey!: Phaser.Input.Keyboard.Key;

    private selectedSlot: number = 0; // Default slot 0

    public getLoadoutNames(): string[] {
        return this.equippedWaves.map(w => w ? w.name : 'Empty');
    }

    public getLoadoutSummary(): ({ id: string; name: string } | null)[] {
        return this.equippedWaves.map(w => w ? { id: w.id, name: w.name } : null);
    }

    public getStorageNames(): string[] {
        return this.storageWaves.map(w => w.name);
    }

    public getStorageSummary(): { id: string; name: string }[] {
        return this.storageWaves.map(w => ({ id: w.id, name: w.name }));
    }

    public getSelectedSlot(): number {
        return this.selectedSlot;
    }

    public setSelectedSlot(slot: number): void {
        if (slot < 0 || slot >= this.equippedWaves.length) return;
        this.selectedSlot = slot;
        this.emitSelectionChange();
    }

    public getActiveWave(): BaseWave | null {
        return this.equippedWaves[this.selectedSlot];
    }

    constructor(player: Player, scene: Phaser.Scene, stats: PlayerStats) {
        this.player = player;
        this.scene = scene;
        this.stats = stats;


        // Setup inputs (1, 2, 3) + Cast (R)
        if (this.scene.input.keyboard) {
            this.keys = [
                this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
                this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
                this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE)
            ];
            this.castKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        }

        // Mouse Input Removed (Used for Attack now)
    }

    public equipWave(slot: number, wave: BaseWave): void {
        if (slot >= 0 && slot < this.equippedWaves.length) {
            const previous = this.equippedWaves[slot];
            if (previous && previous.id !== wave.id) {
                this.storageWaves.push(previous);
            }

            // Remove from storage if it exists there
            const storageIndex = this.storageWaves.findIndex(w => w.id === wave.id);
            if (storageIndex >= 0) {
                this.storageWaves.splice(storageIndex, 1);
            }

            this.equippedWaves[slot] = wave;
            console.log(`Equipped ${wave.name} to slot ${slot + 1}`);

            // Always emit change to update UI loadout
            this.emitSelectionChange();
            this.emitStorageChange();
        }
    }

    public equipWaveFromStorage(storageIndex: number, equipSlot: number): void {
        if (storageIndex < 0 || storageIndex >= this.storageWaves.length) return;
        const wave = this.storageWaves[storageIndex];
        this.storageWaves.splice(storageIndex, 1);
        this.equipWave(equipSlot, wave);
    }

    public unequipWave(slot: number): void {
        if (slot < 0 || slot >= this.equippedWaves.length) return;
        const wave = this.equippedWaves[slot];
        if (!wave) return;
        this.equippedWaves[slot] = null;
        this.storageWaves.push(wave);
        this.emitSelectionChange();
        this.emitStorageChange();
    }

    public addToStorage(wave: BaseWave): void {
        this.storageWaves.push(wave);
        this.emitStorageChange();
    }

    public update(_time: number, _delta: number): void {
        // Check inputs for Selection
        this.keys.forEach((key, index) => {
            if (Phaser.Input.Keyboard.JustDown(key)) {
                this.selectedSlot = index;
                this.emitSelectionChange();
                console.log(`Selected Slot ${index + 1}`);
            }
        });

        // Cast Wave
        if (Phaser.Input.Keyboard.JustDown(this.castKey)) {
            this.tryUseWave(this.selectedSlot, this.scene.time.now);
        }
    }

    private emitSelectionChange() {
        const wave = this.equippedWaves[this.selectedSlot];
        // Even if null, we emit so UI clears or shows empty
        this.scene.events.emit('player-active-wave-changed', {
            type: 'selection', // Differentiate if needed
            waveName: wave ? wave.name : 'Empty',
            manaCost: wave ? wave.manaCost : 0,
            cooldown: wave ? wave.cooldown : 0,
            selectedSlot: this.selectedSlot,
            loadout: this.equippedWaves.map(w => w ? w.name : 'Empty'),
            loadoutSummary: this.getLoadoutSummary()
        });
    }

    private emitStorageChange() {
        this.scene.events.emit('player-wave-storage-changed', {
            storage: this.getStorageNames(),
            storageSummary: this.getStorageSummary()
        });
    }

    private tryUseWave(slot: number, time: number): void {
        const wave = this.equippedWaves[slot];
        if (!wave) return;

        if (!wave.canActivate(time)) {
            console.log(`${wave.name} is on cooldown!`);
            return;
        }

        if (this.stats.currentMana < wave.manaCost) {
            console.log(`Not enough mana for ${wave.name}!`);
            return;
        }

        // Activate
        if (this.stats.modifyMana(-wave.manaCost)) {
            wave.activate(this.player, this.scene);
            wave.putOnCooldown(time);
            console.log(`Used ${wave.name}`);

            this.scene.events.emit('player-wave-used', {
                waveName: wave.name,
                cooldown: wave.cooldown
            });
        }
    }

    public triggerJump(time: number): void {
        // Trigger generic jump effects if needed

        // Trigger Wave onJump if selected and ready
        // Logic: Should it trigger ONLY if selected? Or all active passives?
        // User said: "questa skill... se è attiva è passiva".
        // Usually passives work in background. But "Double Jump" usually implies it's an ability you have equipped.
        // Let's iterate all equipped waves. If any are "Active" and have onJump, trigger them.
        // But double jump typically requires a specific input (Jump in air).

        this.equippedWaves.forEach(wave => {
            if (wave && wave.isActive && wave.canActivate(time)) {
                // For Double Jump, we might want to govern the cooldown differently?
                // Or just use the standard cooldown?
                // If it's a passive "mode", maybe cooldown applies per jump.

                wave.onJump(this.player, this.scene);
                wave.putOnCooldown(time);
            }
        });
    }
}
