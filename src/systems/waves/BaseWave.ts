import Phaser from 'phaser';
import { Player } from '../../entities/Player';

export abstract class BaseWave {
    public id: string;
    public name: string;
    public manaCost: number;
    public cooldown: number; // in ms
    public passiveStats: any; // Placeholder for stats

    protected lastUsedTime: number = 0;

    constructor(id: string, name: string, manaCost: number, cooldown: number) {
        this.id = id;
        this.name = name;
        this.manaCost = manaCost;
        this.cooldown = cooldown;
        this.passiveStats = {};
    }

    public isActive: boolean = false;

    /**
     * Optional hook for passive effects triggered by jumping.
     */
    public onJump(_player: Player, _scene: Phaser.Scene): void {
        // Default: Do nothing
    }

    /**
     * Attempts to activate the wave.
     * @returns true if activated (and mana consumed), false otherwise.
     */
    public abstract activate(player: Player, scene: Phaser.Scene): void;

    public canActivate(currentTime: number): boolean {
        return currentTime >= this.lastUsedTime + this.cooldown;
    }

    public putOnCooldown(currentTime: number): void {
        this.lastUsedTime = currentTime;
    }
}
