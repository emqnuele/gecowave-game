import Phaser from 'phaser';
import { LAMETTA_BARKS } from '../../content/barks';
import { TOASTS, WAVESUNG } from '../../content/story';
import { BossVoice } from '../../engine/BossVoice';
import { bus } from '../../engine/events';
import { music } from '../../engine/music';
import { sfx } from '../../engine/sfx';
import { state } from '../../engine/state';
import type { BossKind } from '../../types';
import { Chapter } from './ChapterScript';
import { waveOnce } from './shared/wave';

/** il santuario: lametta presiede l'arena delle gocce di colore, poi lo specchio nero */
export class SantuarioChapter extends Chapter {
    private lamettaCenter: { x: number; y: number } | null = null;
    private lamettaActive = false;
    private colorDropsTaken = 0;
    private mirror: Phaser.GameObjects.Sprite | null = null;

    /** lametta presiede l'arena: si vede ma non si parla */
    marker(id: string, x: number, y: number): boolean {
        if (id !== 'lametta-arena') return false;
        this.ctx.npcs.present(id, x, y);
        this.lamettaCenter = { x, y };
        return true;
    }

    setup(): void {
        waveOnce(this.scene, 'romero-prima-santuario', WAVESUNG.romeroSantuario, 30000);
        // samatt ha un telefono e una gratitudine infinita
        if (state.hasFlag('boss-down-guggu') && !state.hasFlag('wavesung-samatt')) {
            state.setFlag('wavesung-samatt');
            this.scene.time.delayedCall(2000, () => bus.emit('wavesung', WAVESUNG.samattGrazie));
        }
    }

    update(time: number): void {
        this.updateLamettaArena(time);
    }

    bossDefeated(kind: BossKind, x: number, y: number): void {
        switch (kind) {
            case 'breccio':
                this.ctx.dialogues.start('breccio-morte', () => {
                    this.ctx.rewards.spawnFragment(x, y + 40, 'riflesso', true);
                });
                break;
        }
    }

    private updateLamettaArena(time: number): void {
        if (!this.lamettaCenter || this.ctx.flow.exiting) return;
        const c = this.lamettaCenter;

        if (!this.lamettaActive) {
            if (Math.abs(this.ctx.player.x - c.x) < 380 && Math.abs(this.ctx.player.y - c.y) < 380 && !this.ctx.player.dead) {
                this.lamettaActive = true;
                // pavimento catturato col player a terra: le gocce successive nascono in aria
                this.ctx.carry.lamettaFloorY = this.ctx.player.y;
                music.playBoss('lametta-arena');
                this.ctx.dialogues.start('lametta-incontro', () => {
                    this.ctx.bosses.silence();
                    this.ctx.bosses.voice = new BossVoice(this.scene, LAMETTA_BARKS);
                    this.ctx.bosses.voice.say('engage', true);
                    this.ctx.carry.nextLametteAt = this.scene.time.now + 1500;
                    this.ctx.carry.nextPitturaAt = this.scene.time.now + 4000;
                    this.spawnColorDrop();
                });
            }
            return;
        }
        if (this.mirror) return;

        if (time >= this.ctx.carry.nextLametteAt) {
            this.ctx.carry.nextLametteAt = time + 2600;
            const xs = [this.ctx.player.x - 70 + Math.random() * 40, this.ctx.player.x + 40 + Math.random() * 40];
            this.ctx.combat.onBossLamette({ xs, y: this.ctx.player.y });
        }
        if (time >= this.ctx.carry.nextPitturaAt && this.ctx.enemies.awakeEnemies() < 5) {
            this.ctx.carry.nextPitturaAt = time + 6500;
            const at = this.ctx.world.openSpotNear(c.x + (Math.random() - 0.5) * 400, c.y - 60, 8);
            this.ctx.enemies.spawnEnemy('pittura-mini', at.x, at.y, { hunting: true });
        }
    }

    private spawnColorDrop(): void {
        if (!this.lamettaCenter) return;
        const c = this.lamettaCenter;
        const colors = [0xf87171, 0x4ade80, 0x60a5fa, 0xfacc15, 0xc084fc];
        const color = colors[this.colorDropsTaken % colors.length];
        const x = c.x + (Math.random() - 0.5) * 620;
        // tetto a ~90px (sotto la soglia col double jump), ma fascia ampia: da quasi-terra in su
        const y = this.ctx.carry.lamettaFloorY - 8 - Math.random() * 82;
        const drop = this.scene.physics.add.sprite(x, y, 'color-drop').setTint(color).setDepth(5);
        (drop.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        this.ctx.lighting.follow(drop, color, 140, 0.9);
        this.scene.tweens.add({ targets: drop, y: y - 10, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.scene.physics.add.overlap(this.ctx.player, drop, () => {
            drop.destroy();
            this.colorDropsTaken++;
            sfx.pickup();
            this.ctx.bosses.voice?.event(`goccia-${this.colorDropsTaken}`);
            if (this.colorDropsTaken >= 5) {
                this.ctx.bosses.silence();
                bus.emit('toast', { text: TOASTS.mirrorOpen });
                this.spawnMirror();
            } else {
                bus.emit('toast', { text: `${TOASTS.colorDrop} (${this.colorDropsTaken}/5)` });
                this.spawnColorDrop();
            }
        });
    }

    private spawnMirror(): void {
        if (!this.lamettaCenter) return;
        const c = this.lamettaCenter;
        const mirror = this.scene.add.sprite(c.x + 180, c.y + 12, 'black-mirror').setDepth(5).setAlpha(0).setPipeline('Light2D');
        this.mirror = mirror;
        this.ctx.lighting.static(mirror.x, mirror.y, 0xc084fc, 220, 1.0);
        this.scene.tweens.add({ targets: mirror, alpha: 1, duration: 800 });
        const zone = this.scene.add.zone(mirror.x, mirror.y, 50, 80);
        this.scene.physics.add.existing(zone);
        (zone.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        this.scene.physics.add.overlap(this.ctx.player, zone, () => {
            if (this.ctx.flow.exiting || !this.ctx.world.def.next) return;
            this.ctx.flow.exiting = true;
            this.ctx.dialogues.start('lametta-uscita', () => {
                this.ctx.flow.exiting = false;
                this.ctx.flow.gotoLevel(this.ctx.world.def.next!);
            });
        });
    }

}
