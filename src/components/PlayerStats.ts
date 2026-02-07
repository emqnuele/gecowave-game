import Phaser from 'phaser';

export type StatKey = 'strength' | 'vitality' | 'mana';

export interface ProgressionSnapshot {
    level: number;
    xp: number;
    xpToNext: number;
    statPoints: number;
    strength: number;
    vitality: number;
    manaPower: number;
}

export class PlayerStats {
    private scene: Phaser.Scene;

    // Core Stats
    public hp: number;
    public maxHp: number;
    public mana: number;
    public maxMana: number;
    private manaRegenRate: number = 5; // Mana per second
    private manaRegenAccumulator: number = 0;

    // Progression
    public level: number = 1;
    public xp: number = 0;
    public statPoints: number = 0;
    public strength: number = 0;
    public vitality: number = 0;
    public manaPower: number = 0;

    constructor(scene: Phaser.Scene, maxHp: number = 100, maxMana: number = 100) {
        this.scene = scene;
        this.maxHp = maxHp;
        this.hp = maxHp;
        this.maxMana = maxMana;
        this.mana = maxMana;

        this.statPoints = 1;

        // Initial emit
        this.emitStats();
        this.emitProgression();
    }

    public update(delta: number): void {
        // Passive Mana Regen
        if (this.mana < this.maxMana) {
            this.manaRegenAccumulator += delta;
            // Regenerate every 100ms chunk or just smooth addition
            if (this.manaRegenAccumulator >= 1000) {
                this.modifyMana(this.manaRegenRate);
                this.manaRegenAccumulator -= 1000;
            }
        }
    }

    public modifyHp(amount: number): void {
        this.hp += amount;
        if (this.hp > this.maxHp) this.hp = this.maxHp;
        if (this.hp < 0) this.hp = 0;
        this.emitStats();
    }

    public setHp(value: number): void {
        this.hp = value;
        this.emitStats();
    }

    public modifyMana(amount: number): boolean {
        if (this.mana + amount < 0) {
            return false; // Not enough mana
        }

        this.mana += amount;
        if (this.mana > this.maxMana) this.mana = this.maxMana;
        this.emitStats();
        return true;
    }

    public addExperience(amount: number): void {
        if (amount <= 0) return;

        this.xp += amount;
        let leveledUp = false;

        while (this.xp >= this.getXpToNextLevel()) {
            this.xp -= this.getXpToNextLevel();
            this.level += 1;
            this.statPoints += 1;
            leveledUp = true;
        }

        if (leveledUp) {
            this.emitStats();
        }

        this.emitProgression();
    }

    public spendStatPoint(stat: StatKey): boolean {
        if (this.statPoints <= 0) return false;

        switch (stat) {
            case 'strength':
                this.strength += 1;
                break;
            case 'vitality':
                this.vitality += 1;
                this.maxHp += 10;
                this.hp += 10;
                break;
            case 'mana':
                this.manaPower += 1;
                this.maxMana += 10;
                this.mana += 10;
                break;
            default:
                return false;
        }

        this.statPoints -= 1;
        this.emitStats();
        this.emitProgression();
        return true;
    }

    public getProgressionSnapshot(): ProgressionSnapshot {
        return {
            level: this.level,
            xp: this.xp,
            xpToNext: this.getXpToNextLevel(),
            statPoints: this.statPoints,
            strength: this.strength,
            vitality: this.vitality,
            manaPower: this.manaPower
        };
    }

    private emitStats(): void {
        this.scene.events.emit('player-stats-changed', {
            hp: this.hp,
            maxHp: this.maxHp,
            mana: this.mana,
            maxMana: this.maxMana
        });
    }

    private emitProgression(): void {
        this.scene.events.emit('player-progression-changed', this.getProgressionSnapshot());
    }

    private getXpToNextLevel(): number {
        return 100 + (this.level - 1) * 50;
    }

    public get currentMana(): number {
        return this.mana;
    }
}
