import Phaser from 'phaser';
import { turnToward } from '../../rules/abilities';
import { waveWorld, type AbilitiesCtx } from './shared';

type Hostile = Phaser.GameObjects.Sprite & { active: boolean };

/** la scia di archi dietro il colpo: una copia che svanisce */
function ghost(scene: Phaser.Scene, proj: Phaser.Physics.Arcade.Sprite): void {
    const g = scene.add.image(proj.x, proj.y, proj.texture.key, proj.frame.name)
        .setFlipX(proj.flipX).setAlpha(0.5).setDepth(4);
    const pbody = proj.body as Phaser.Physics.Arcade.Body | null;
    if (pbody) g.setDisplaySize(pbody.width, pbody.height);
    scene.tweens.add({ targets: g, alpha: 0, duration: 200, onComplete: () => g.destroy() });
}

/** il rimando perfetto curva di poco a ogni fotogramma verso chi l'ha sparato */
function steer(pbody: Phaser.Physics.Arcade.Body, from: { x: number; y: number }, to: Hostile): void {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const speed = Math.hypot(pbody.velocity.x, pbody.velocity.y) || 400;
    const next = turnToward(Math.atan2(pbody.velocity.y, pbody.velocity.x), Math.atan2(dy, dx), 0.09);
    pbody.setVelocity(Math.cos(next) * speed, Math.sin(next) * speed);
}

/** i colpi del geco in volo: alone, scia, tocco del mondo, inseguimento */
export function updateFlight(ctx: AbilitiesCtx, time: number): void {
    const scene = ctx.scene;
    for (const obj of ctx.groups.playerProjectiles.getChildren()) {
        const proj = obj as Phaser.Physics.Arcade.Sprite;
        if (!proj.active) continue;
        const glow = proj.getData('trail') as Phaser.GameObjects.Image | undefined;
        if (glow) glow.setPosition(proj.x, proj.y);
        // scia ogni 40 ms, solo per le onde del risonante
        const level = (proj.getData('level') as number | undefined) ?? -1;
        if (level >= 0 && time - (proj.getData('trailAt') as number ?? 0) >= 40) {
            proj.setData('trailAt', time);
            ghost(scene, proj);
        }
        // il colpo tocca il mondo mentre vola, ogni 60 ms
        const wave = level >= 0 ? 'risonante' as const : (proj.getData('reflected') ? 'scudo' as const : null);
        if (wave && time - (proj.getData('waveAt') as number ?? 0) >= 60) {
            proj.setData('waveAt', time);
            const pbody = proj.body as Phaser.Physics.Arcade.Body | null;
            const w = pbody?.width ?? 26;
            const h = pbody?.height ?? 18;
            waveWorld(scene, wave, proj.x, proj.y,
                new Phaser.Geom.Rectangle(proj.x - w / 2, proj.y - h / 2, w, h),
                level >= 0 ? level : (proj.getData('perfect') ? 2 : 1));
        }
        const homing = proj.getData('homing') as Hostile | undefined;
        if (homing?.active) {
            const pbody = proj.body as Phaser.Physics.Arcade.Body | null;
            if (pbody) steer(pbody, proj, homing);
        } else if (homing && !homing.active) {
            proj.setData('homing', null);
        }
    }
}
