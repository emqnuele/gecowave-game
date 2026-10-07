// mutazioni di prova: righe di comportamento tolte o cambiate a mano, una alla volta.
// ogni mutazione deve far fallire almeno uno scenario indicando il punto giusto (vedi mutate.mjs).
// find deve comparire una volta sola nel file.
export default [
    { id: 'sfx-microfono', file: 'src/scenes/GameScene.ts', find: '        sfx.checkpoint();\n', replace: '', kind: 'sfx tolto' },
    { id: 'flag-dispositivo', file: 'src/scenes/GameScene.ts', find: "                    state.setFlag('dispositivo');\n                    bus.emit('toast', { text: TOASTS.dispositivo });", replace: "                    bus.emit('toast', { text: TOASTS.dispositivo });", kind: 'setFlag tolto' },
    { id: 'toast-arena', file: 'src/scenes/GameScene.ts', find: "        bus.emit('toast', { text: 'le uscite si chiudono. o lui o te.' });\n", replace: '', kind: 'bus.emit tolto' },
    { id: 'tween-cuore', file: 'src/scenes/GameScene.ts', find: "        this.tweens.add({ targets: heart, scale: { from: 1, to: 1.15 }, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });\n", replace: '', kind: 'tween tolto' },
    { id: 'gocce-lametta', file: 'src/scenes/GameScene.ts', find: 'if (this.colorDropsTaken >= 5) {', replace: 'if (this.colorDropsTaken > 5) {', kind: 'confronto >= in >' },
    { id: 'ordine-crepa', file: 'src/scenes/GameScene.ts', find: "        const crack = this.add.image(x, y, FX.mirrorCrack).setDepth(6).setScale(0.4).setAlpha(0.9);\n        const crackGlow = this.add.image(x, y, `${FX.mirrorCrack}~glow`).setDepth(5)\n            .setBlendMode(Phaser.BlendModes.ADD).setScale(0.4).setAlpha(0.7);", replace: "        const crackGlow = this.add.image(x, y, `${FX.mirrorCrack}~glow`).setDepth(5)\n            .setBlendMode(Phaser.BlendModes.ADD).setScale(0.4).setAlpha(0.7);\n        const crack = this.add.image(x, y, FX.mirrorCrack).setDepth(6).setScale(0.4).setAlpha(0.9);", kind: 'ordine di creazione' },
    { id: 'persist-lore', file: 'src/scenes/GameScene.ts', find: '                    state.save.collectedLore.push(id);\n                    state.persist();\n                    tablet.setAlpha(0.5);', replace: '                    state.save.collectedLore.push(id);\n                    tablet.setAlpha(0.5);', kind: 'persist tolto' },
    { id: 'profondita-prompt', file: 'src/scenes/GameScene.ts', find: '.setDepth(8).setVisible(false);', replace: '.setDepth(7).setVisible(false);', kind: 'profondità' },
    { id: 'salto-sfx', file: 'src/entities/Player.ts', find: '                sfx.jump();\n', replace: '', nth: 0, kind: 'sfx tolto (entità)' },
    { id: 'rinculo-nemico', file: 'src/entities/Enemy.ts', find: 'body.velocity.x += Math.sign(this.x - fromX) * 240;', replace: 'body.velocity.x += Math.sign(this.x - fromX) * 200;', kind: 'costante (entità)' },
    { id: 'fase-boss', file: 'src/entities/Boss.ts', find: 'if (this.hp > this.maxHp * 0.66) return 1;', replace: 'if (this.hp > this.maxHp * 0.6) return 1;', kind: 'soglia (entità)' },
    { id: 'lastre-suono', file: 'src/engine/HazardManager.ts', find: 'if (Math.abs(s.x - player.x) < 700) sfx.crumble();', replace: 'if (Math.abs(s.x - player.x) < 500) sfx.crumble();', kind: 'soglia (motore)' },
    { id: 'hud-barre', file: 'src/ui/hud.ts', find: 'this.barre.textContent = `♪ ${barre} barre`;', replace: 'this.barre.textContent = `♪ ${barre}  barre`;', kind: 'testo ui' },
    { id: 'film-buio', file: 'src/engine/FlashbackManager.ts', find: "scene.tweens.add({ targets: dark, alpha: 0.97, duration: ENTER * 0.6, ease: 'Quad.easeOut' });", replace: "scene.tweens.add({ targets: dark, alpha: 0.95, duration: ENTER * 0.6, ease: 'Quad.easeOut' });", kind: 'tween (film)' },
];
