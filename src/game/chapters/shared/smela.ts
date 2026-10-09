import type { ChapterCtx } from '../ChapterScript';

/** l'acqua di smela iii: il mondo gira, si fa buio e si muore (rio e stabilimento la vendono) */
export function drinkSmela(ctx: ChapterCtx): void {
    ctx.player.stun(999999);
    const overlay = ctx.scene.add.graphics();
    overlay.fillStyle(0x000000, 1);
    overlay.fillRect(0, 0, ctx.scene.cameras.main.width, ctx.scene.cameras.main.height);
    overlay.setScrollFactor(0);
    overlay.setDepth(999);
    overlay.setAlpha(0);

    ctx.scene.tweens.add({
        targets: overlay,
        alpha: { from: 0, to: 0.9 },
        duration: 5000,
        ease: 'Quad.easeIn',
    });

    const zoomTween = ctx.scene.tweens.add({
        targets: ctx.scene.cameras.main,
        zoom: 1.25,
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
    });

    const rotationTween = ctx.scene.tweens.add({
        targets: ctx.scene.cameras.main,
        rotation: 0.08,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
    });

    let shakeIntensity = 0.002;
    const shakeTimer = ctx.scene.time.addEvent({
        delay: 150,
        callback: () => {
            shakeIntensity += 0.0012;
            ctx.feel.shake(120, shakeIntensity);
        },
        repeat: 30,
    });

    ctx.scene.time.delayedCall(5000, () => {
        zoomTween.remove();
        rotationTween.remove();
        shakeTimer.destroy();
        overlay.destroy();

        ctx.scene.cameras.main.setZoom(1);
        ctx.scene.cameras.main.setRotation(0);

        ctx.player.stun(0);
        ctx.flow.playerDied();
    });
}

