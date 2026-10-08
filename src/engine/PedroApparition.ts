import Phaser from 'phaser';
import { TILE } from '../config';
import { PEDRO_APPARITIONS } from '../content/pedro';
import type { RegionLayout } from '../world/types';
import { animateCreature, creatureRes } from './art/creatureKit';
import { ensureCreature } from './art/creatures';
import { bus } from './events';
import type { LightingManager } from './LightingManager';
import { sfx } from './sfx';
import { state } from './state';

/* pedro sul percorso, a metà regione: si accende quando arrivi, dice due
   righe senza fermare il gioco e si sfalda. se gli corri addosso sparisce
   prima, ma la seconda riga la senti lo stesso */

const TRIGGER_R = 330;
const TOO_CLOSE = 80;
const LINE_GAP_MS = 4200;
const LINGER_MS = 3600;

type Phase = 'hidden' | 'speaking' | 'gone';

export class PedroApparition {
    private scene: Phaser.Scene;
    private lighting: LightingManager;
    private sprite: Phaser.GameObjects.Sprite | null = null;
    private light: Phaser.GameObjects.Light | null = null;
    private lines: [string, string] | null = null;
    private flag = '';
    private phase: Phase = 'hidden';
    private said = 0;
    private timers: Phaser.Time.TimerEvent[] = [];
    private baseX = 0;
    private baseY = 0;

    constructor(scene: Phaser.Scene, lighting: LightingManager) {
        this.scene = scene;
        this.lighting = lighting;
    }

    setup(regionId: string, layout: RegionLayout | null): void {
        const lines = PEDRO_APPARITIONS[regionId];
        this.flag = `pedro-visto-${regionId}`;
        if (!lines || !layout?.spots?.length || state.hasFlag(this.flag)) return;
        const spot = this.pickSpot(layout);
        if (!spot) return;
        this.lines = lines;
        this.baseX = spot.x;
        this.baseY = spot.y;
        const key = ensureCreature(this.scene, 'boss-pedro');
        this.sprite = this.scene.add.sprite(spot.x, spot.y, key, 0).setDepth(4).setAlpha(0).setPipeline('Light2D');
        this.sprite.setScale(1.25 / creatureRes(this.scene, key));
        this.sprite.setY(spot.y - this.sprite.displayHeight / 2 + 6);
        this.baseY = this.sprite.y;
        animateCreature(this.sprite);
    }

    /** a metà del percorso, in una stanza di passaggio: lo incontri, non lo cerchi */
    private pickSpot(layout: RegionLayout): { x: number; y: number } | null {
        const quiet = new Set(['start', 'rest', 'arena', 'exit']);
        const rooms = layout.rooms
            .filter((r) => r.pathIndex >= 0 && !quiet.has(r.kind))
            .sort((a, b) => Math.abs(a.pathIndex - layout.pathLength * 0.45) - Math.abs(b.pathIndex - layout.pathLength * 0.45));
        for (const room of rooms) {
            const list = layout.spots!.filter((s) => s[2] === room.id);
            if (!list.length) continue;
            const s = list[Math.floor(list.length / 2)]!;
            return { x: s[0] * TILE + TILE / 2, y: (s[1] + 1) * TILE };
        }
        return null;
    }

    update(player: Phaser.GameObjects.Sprite): void {
        const sp = this.sprite;
        if (!sp || this.phase === 'gone') return;
        const dx = player.x - sp.x;
        const dy = player.y - this.baseY;
        if (this.phase === 'hidden') {
            if (Math.abs(dx) < TRIGGER_R && Math.abs(dy) < 220) this.appear();
            return;
        }
        // glitch: scatti e tremori, mai un movimento morbido
        sp.setFlipX(dx > 0);
        sp.x = this.baseX + (Math.random() > 0.86 ? (Math.random() - 0.5) * 10 : 0);
        sp.y = this.baseY + (Math.random() > 0.9 ? (Math.random() - 0.5) * 6 : 0);
        if (Math.random() > 0.97) {
            sp.setTintFill(Math.random() > 0.5 ? 0x22d3ee : 0xf87171);
            this.scene.time.delayedCall(50, () => sp.active && sp.clearTint());
        }
        if (Math.hypot(dx, dy) < TOO_CLOSE) this.vanish(true);
    }

    private appear(): void {
        const sp = this.sprite!;
        this.phase = 'speaking';
        state.setFlag(this.flag);
        state.persist();
        sfx.bossVoice('boss-pedro');
        this.light = this.lighting.static(this.baseX, this.baseY - 20, 0x22d3ee, 200, 0.9);
        this.scene.cameras.main.flash(90, 34, 211, 238);
        // tre lampi prima di restare: arriva a scatti, come nei suoi boss
        for (let i = 1; i <= 3; i++) {
            this.later(i * 110, () => sp.setAlpha(i === 3 ? 0.92 : i % 2 ? 0.8 : 0.15));
        }
        this.later(420, () => this.sayNext());
        this.later(420 + LINE_GAP_MS, () => this.sayNext());
        this.later(420 + LINE_GAP_MS + LINGER_MS, () => this.vanish(false));
    }

    private sayNext(): void {
        if (!this.lines || this.said >= 2) return;
        const text = this.lines[this.said]!;
        this.said++;
        bus.emit('bark', { speaker: 'pedro', color: 'cyan', text, glitch: true, urgent: this.said === 1 });
    }

    /** si sfalda in scie; chi gli corre addosso lo fa sparire prima, ma la frase resta */
    private vanish(early: boolean): void {
        const sp = this.sprite;
        if (!sp || this.phase === 'gone') return;
        this.phase = 'gone';
        this.timers.forEach((t) => t.remove(false));
        this.timers = [];
        if (early && this.said < 2) {
            this.sayNext();
            this.scene.time.delayedCall(LINE_GAP_MS * 0.6, () => this.sayNext());
        }
        sfx.bossVoice('boss-pedro');
        for (let i = 0; i < 4; i++) {
            const ghost = this.scene.add.image(sp.x + (i - 1.5) * 14, sp.y, sp.texture.key, sp.frame.name)
                .setScale(sp.scaleX).setFlipX(sp.flipX).setDepth(4).setAlpha(0.4).setTint(i % 2 ? 0x22d3ee : 0xf87171);
            this.scene.tweens.add({ targets: ghost, alpha: 0, x: ghost.x + (i - 1.5) * 20, duration: 420, onComplete: () => ghost.destroy() });
        }
        this.lighting.remove(this.light);
        this.light = null;
        this.scene.tweens.add({ targets: sp, alpha: 0, duration: 260, onComplete: () => sp.destroy() });
        this.sprite = null;
    }

    private later(ms: number, fn: () => void): void {
        this.timers.push(this.scene.time.delayedCall(ms, () => {
            if (this.sprite?.active) fn();
        }));
    }

    destroy(): void {
        this.timers.forEach((t) => t.remove(false));
        this.timers = [];
        this.sprite?.destroy();
        this.sprite = null;
    }
}
