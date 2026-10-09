import Phaser from 'phaser';
import { TILE } from '../config';
import { STAGING } from '../content/staging';
import { bus } from '../core/events';
import type { LightingManager } from './LightingManager';
import type { RegionLayout, Room } from '../world/types';

/* staging muto: un tableau ambientale per regione, zero dialoghi.
   Si costruisce in una stanza laterale: luce colorata, polvere lenta,
   2-3 sagome-prop e un gesto in loop. Si capisce guardando.
   La didascalia (se c'è) è un toast di poche parole all'avvistamento. */

export class StagingManager {
    private shownCaption = false;
    private scene: Phaser.Scene;
    private lighting: LightingManager;

    constructor(scene: Phaser.Scene, lighting: LightingManager) {
        this.scene = scene;
        this.lighting = lighting;
    }

    setup(regionId: string, layout: RegionLayout | null, player: Phaser.GameObjects.Sprite): void {
        const def = STAGING[regionId];
        if (!def || !layout?.rooms?.length) return;
        const room = this.pickRoom(layout);
        if (!room) return;
        const px = (room.rect.x + room.rect.w / 2) * TILE;
        const py = (room.rect.y + room.rect.h / 2) * TILE;
        // luce del tableau: il colore della regione, bassa e calda
        this.lighting.static(px, py - 20, def.color, 220, 0.85);
        // polvere lenta: il tempo passa anche senza parole
        const dust = this.scene.add.particles(px, py - 40, 'p-dot', {
            speed: { min: 6, max: 22 },
            scale: { start: 0.5, end: 0 },
            alpha: { start: 0.5, end: 0 },
            tint: def.color,
            lifespan: 2600,
            frequency: 420,
            quantity: 1,
        });
        dust.setDepth(3);
        // sagome-prop: pochi rettangoli d'inchiostro che suggeriscono la scena
        this.buildTableau(def.effect, px, py, def.color);
        // didascalia muta: un toast una tantum quando ti avvicini
        if (def.caption) {
            this.scene.time.addEvent({
                delay: 400, loop: true,
                callback: () => {
                    if (this.shownCaption || !player.active) return;
                    if (Math.hypot(player.x - px, player.y - py) < 320) {
                        this.shownCaption = true;
                        bus.emit('toast', { text: def.caption });
                    }
                },
            });
        }
    }

    private pickRoom(layout: RegionLayout): Room | null {
        const sides = layout.rooms.filter((r) => r.pathIndex < 0 && (r.kind === 'hall' || r.kind === 'cave' || r.kind === 'secret'));
        if (!sides.length) return null;
        // tableau a metà percorso: lo incontri, non lo cerchi
        const sorted = [...sides].sort((a, b) => {
            const pa = a.pathIndex >= 0 ? a.pathIndex : (layout.rooms[a.anchor]?.pathIndex ?? 0);
            const pb = b.pathIndex >= 0 ? b.pathIndex : (layout.rooms[b.anchor]?.pathIndex ?? 0);
            return pa - pb;
        });
        return sorted[Math.floor(sorted.length / 2)] ?? sorted[0] ?? null;
    }

    private prop(x: number, y: number, w: number, h: number, color: number, alpha = 0.85): void {
        const g = this.scene.add.graphics().setDepth(3);
        g.fillStyle(0x0b0c10, alpha);
        g.fillRoundedRect(x - w / 2, y - h, w, h, 3);
        g.lineStyle(1.5, color, 0.9);
        g.strokeRoundedRect(x - w / 2, y - h, w, h, 3);
    }

    private glowDot(x: number, y: number, color: number): void {
        const c = this.scene.add.circle(x, y, 4, color, 0.95).setDepth(4);
        this.scene.tweens.add({ targets: c, alpha: 0.25, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    private buildTableau(effect: string, px: number, py: number, color: number): void {
        switch (effect) {
            case 'crater':
                // cratere: anello + fumo + 33 inciso (due tacche)
                {
                    const g = this.scene.add.graphics().setDepth(3);
                    g.lineStyle(2, color, 0.8);
                    g.strokeCircle(px, py - 10, 46);
                    g.lineStyle(3, color, 0.9);
                    g.lineBetween(px - 40, py + 34, px - 16, py + 34);
                    g.lineBetween(px + 16, py + 34, px + 40, py + 34);
                    const smoke = this.scene.add.particles(px, py - 30, 'p-dot', {
                        speed: { min: 10, max: 30 }, scale: { start: 0.9, end: 0 },
                        alpha: { start: 0.35, end: 0 }, tint: 0x9ca3af, lifespan: 2200, frequency: 500,
                    });
                    smoke.setDepth(3);
                }
                break;
            case 'loop':
                // due sedili + tacche del conteggio
                this.prop(px - 34, py, 26, 22, color);
                this.prop(px + 34, py, 26, 22, color);
                {
                    const g = this.scene.add.graphics().setDepth(3);
                    g.lineStyle(1, color, 0.7);
                    for (let i = 0; i < 7; i++) g.lineBetween(px - 8 + i * 3, py - 44, px - 8 + i * 3, py - 32);
                }
                break;
            case 'buried':
                // tetto del bus fuori dalla sabbia + faro spento che ogni tanto trema
                this.prop(px, py - 6, 120, 26, color);
                this.glowDot(px - 40, py - 12, 0x3f3f46);
                this.glowDot(px + 40, py - 12, 0x3f3f46);
                break;
            case 'repaint':
                // parete con 335 linee, una storta
                {
                    const g = this.scene.add.graphics().setDepth(3);
                    for (let i = 0; i < 12; i++) {
                        g.lineStyle(1.5, color, 0.75);
                        const y = py - 70 + i * 6;
                        if (i === 8) g.lineBetween(px - 50, y, px + 44, y + 5);
                        else g.lineBetween(px - 50, y, px + 50, y);
                    }
                }
                break;
            case 'shoes':
                // scarpette piccole + sparacchino posato a terra
                this.prop(px - 18, py, 14, 10, color);
                this.prop(px - 2, py, 14, 10, color);
                this.prop(px + 30, py - 4, 44, 8, color, 0.6);
                break;
            case 'still':
                // bancone + scontrino + boccetta
                this.prop(px, py, 110, 30, color);
                this.glowDot(px + 20, py - 36, color);
                break;
            case 'table':
                // tavola per due, una sedia vuota
                this.prop(px, py, 90, 16, color);
                this.prop(px - 30, py + 6, 18, 26, color, 0.7);
                this.prop(px + 30, py + 6, 18, 26, color, 0.35);
                break;
            case 'glow':
                // cerchio più chiaro sul fondale: qui brillava qualcosa
                {
                    const g = this.scene.add.graphics().setDepth(3);
                    g.lineStyle(2, color, 0.85);
                    g.strokeCircle(px, py - 8, 30);
                    this.glowDot(px, py - 8, color);
                }
                break;
            case 'ledger':
                // damigiane in fila, una diversa
                for (let i = 0; i < 5; i++) this.prop(px - 60 + i * 30, py, 20, 34, i === 3 ? 0xef4444 : color, 0.8);
                break;
            case 'exam':
                // banco + rotolo scritto fitto
                this.prop(px, py, 70, 20, color);
                {
                    const g = this.scene.add.graphics().setDepth(4);
                    g.lineStyle(1, color, 0.8);
                    for (let i = 0; i < 5; i++) g.lineBetween(px - 24, py - 44 + i * 5, px + 24, py - 44 + i * 5);
                }
                break;
            case 'thought':
                // un pensiero caldo che trema, gli altri in fila
                {
                    const hot = this.scene.add.circle(px, py - 30, 9, color, 0.95).setDepth(4);
                    this.scene.tweens.add({ targets: hot, x: '+=3', duration: 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
                    for (let i = 0; i < 4; i++) this.prop(px - 60 + i * 26, py + 10, 16, 16, color, 0.5);
                }
                break;
            case 'board':
                // bacheca di spilli sullo stesso volto
                {
                    const g = this.scene.add.graphics().setDepth(3);
                    g.lineStyle(1.5, color, 0.8);
                    g.strokeRect(px - 55, py - 70, 110, 60);
                    for (let i = 0; i < 6; i++) this.glowDot(px - 40 + i * 16, py - 40, 0xef4444);
                }
                break;
            case 'wall':
                // muro di monitor, uno solo acceso
                for (let i = 0; i < 5; i++) this.prop(px - 56 + i * 28, py - 20, 24, 18, color, i === 2 ? 0.95 : 0.35);
                if (true) this.glowDot(px, py - 32, color);
                break;
            case 'cellar':
                // dio legato: sagoma grande seduta + fascette + foglio a portata di mano
                this.prop(px, py, 34, 52, color);
                this.prop(px + 44, py + 4, 20, 14, 0xe7e5e4, 0.9);
                break;
            case 'backup':
                // 33 nodi in fila, uno sciolto
                {
                    const g = this.scene.add.graphics().setDepth(4);
                    g.lineStyle(2, color, 0.85);
                    for (let i = 0; i < 8; i++) {
                        const x = px - 56 + i * 16;
                        g.strokeCircle(x, i === 5 ? py - 34 : py - 26, 5);
                    }
                }
                break;
            case 'drift':
                // oggetti alla deriva nel void
                for (let i = 0; i < 3; i++) {
                    const c = this.scene.add.circle(px - 30 + i * 30, py - 30 - i * 8, 5, color, 0.8).setDepth(4);
                    this.scene.tweens.add({ targets: c, y: '-=10', duration: 1600 + i * 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
                }
                break;
            case 'log':
                // muro che non si cancella: 33 tacche
                {
                    const g = this.scene.add.graphics().setDepth(3);
                    g.lineStyle(2, color, 0.85);
                    g.strokeRect(px - 50, py - 60, 100, 50);
                    g.lineStyle(1, color, 0.7);
                    for (let i = 0; i < 11; i++) g.lineBetween(px - 44 + i * 8, py - 16, px - 44 + i * 8, py - 8);
                }
                break;
            case 'mixer':
                // mixer + cuffie appese
                this.prop(px, py, 80, 22, color);
                {
                    const g = this.scene.add.graphics().setDepth(4);
                    g.lineStyle(2, color, 0.85);
                    g.strokeCircle(px + 52, py - 34, 10);
                }
                break;
            case 'keys':
                // motorino + casco
                this.prop(px, py, 64, 20, color);
                {
                    const g = this.scene.add.graphics().setDepth(4);
                    g.lineStyle(2, color, 0.9);
                    g.strokeCircle(px - 28, py - 2, 8);
                    g.strokeCircle(px + 28, py - 2, 8);
                }
                break;
            case 'desk':
            default:
                // scrivania del titolare, sedia troppo grande
                this.prop(px, py, 84, 24, color);
                this.prop(px, py + 10, 30, 40, color, 0.6);
                break;
        }
    }

    destroy(): void {}
}
