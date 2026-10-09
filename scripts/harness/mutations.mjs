// mutazioni di prova: righe di comportamento tolte o cambiate a mano, una alla volta.
// ogni mutazione deve far fallire almeno uno scenario indicando il punto giusto (vedi mutate.mjs).
// find deve comparire una volta sola nel file (o la volta nth). puntano al codice dopo il refactor (parte B).
export default [
    { id: 'sfx-microfono', file: 'src/game/Travel.ts', find: '        sfx.checkpoint();\n', replace: '', kind: 'sfx tolto' },
    { id: 'flag-dispositivo', file: 'src/game/chapters/ruhra.ts', find: "                    state.setFlag('dispositivo');\n                    bus.emit('toast', { text: TOASTS.dispositivo });", replace: "                    bus.emit('toast', { text: TOASTS.dispositivo });", kind: 'setFlag tolto' },
    { id: 'toast-arena', file: 'src/game/Arena.ts', find: "        bus.emit('toast', { text: 'le uscite si chiudono. o lui o te.' });\n", replace: '', kind: 'bus.emit tolto' },
    { id: 'tween-cuore', file: 'src/game/Rewards.ts', find: "        this.scene.tweens.add({ targets: heart, scale: { from: 1, to: 1.15 }, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });\n", replace: '', kind: 'tween tolto' },
    { id: 'gocce-lametta', file: 'src/game/chapters/santuario.ts', find: 'if (this.colorDropsTaken >= 5) {', replace: 'if (this.colorDropsTaken > 5) {', kind: 'confronto >= in >' },
    // stessa profondità (3): cambia davvero l'ordine di disegno. scambiare crepa e bagliore no: profondità diverse
    { id: 'ordine-pali-nidi', file: 'src/scenes/GameScene.ts', find: '        this.spawnEntities();\n        this.enemies.spawnCaveSpawners();\n        this.chapter.populate?.();\n        this.travel.spawnCheckpoints();\n        this.travel.spawnBusStops();\n', replace: '        this.spawnEntities();\n        this.travel.spawnBusStops();\n        this.enemies.spawnCaveSpawners();\n        this.chapter.populate?.();\n        this.travel.spawnCheckpoints();\n', kind: 'ordine di creazione' },
    { id: 'persist-lore', file: 'src/game/Rewards.ts', find: '                    state.save.collectedLore.push(id);\n                    state.persist();\n                    tablet.setAlpha(0.5);', replace: '                    state.save.collectedLore.push(id);\n                    tablet.setAlpha(0.5);', kind: 'persist tolto' },
    { id: 'profondita-prompt', file: 'src/game/Interactions.ts', find: '.setDepth(8).setVisible(false);', replace: '.setDepth(7).setVisible(false);', kind: 'profondità' },
    { id: 'salto-sfx', file: 'src/entities/Player.ts', find: '                sfx.jump();\n', replace: '', nth: 0, kind: 'sfx tolto (entità)' },
    { id: 'rinculo-nemico', file: 'src/entities/Enemy.ts', find: 'body.velocity.x += Math.sign(this.x - fromX) * 240;', replace: 'body.velocity.x += Math.sign(this.x - fromX) * 200;', kind: 'costante (entità)' },
    { id: 'fase-boss', file: 'src/rules/combat.ts', find: 'if (hp > maxHp * 0.66) return 1;', replace: 'if (hp > maxHp * 0.6) return 1;', kind: 'soglia (regola)' },
    { id: 'lastre-suono', file: 'src/mechanics/HazardManager.ts', find: 'if (Math.abs(s.x - player.x) < 700) sfx.crumble();', replace: 'if (Math.abs(s.x - player.x) < 500) sfx.crumble();', kind: 'soglia (motore)' },
    { id: 'hud-barre', file: 'src/ui/hud.ts', find: 'this.barre.textContent = `♪ ${barre} barre`;', replace: 'this.barre.textContent = `♪ ${barre}  barre`;', kind: 'testo ui' },
    { id: 'film-ombra', file: 'src/story/film/FilmScene.ts', find: 'this.shadow.setAlpha(0.42 * s.alpha);', replace: 'this.shadow.setAlpha(0.4 * s.alpha);', kind: 'alfa (film)' },
];
