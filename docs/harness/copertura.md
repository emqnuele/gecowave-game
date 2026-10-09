# copertura del corpus

Generato da `scripts/harness/coverage.mjs` sulla build del riferimento (200 scenari). È la mappa dei punti ciechi: una traccia uguale non dimostra niente sul codice che nessuno scenario esegue.

| | righe | rami | funzioni |
|---|---|---|---|
| **totale src** | 95.6% | 90.2% | 95.2% |
| src/art | 99.5% (6689/6724) | 96.8% (1288/1331) | 99.7% (372/373) |
| src/audio | 98.0% (1624/1657) | 93.9% (507/540) | 98.4% (122/124) |
| src/config.ts | 100.0% (149/149) | 100.0% (0/0) | 100.0% (0/0) |
| src/content | 98.6% (6073/6162) | 71.5% (133/186) | 83.6% (46/55) |
| src/core | 98.0% (833/850) | 82.7% (153/185) | 96.9% (63/65) |
| src/dev | 53.3% (24/45) | 100.0% (3/3) | 75.0% (3/4) |
| src/entities | 98.3% (2704/2750) | 94.2% (1040/1104) | 97.9% (140/143) |
| src/game | 96.6% (6545/6776) | 88.5% (2108/2382) | 96.7% (476/492) |
| src/input | 93.5% (476/509) | 68.6% (127/185) | 93.8% (30/32) |
| src/main.ts | 90.7% (244/269) | 86.4% (51/59) | 81.3% (13/16) |
| src/mechanics | 98.3% (2315/2356) | 94.2% (902/958) | 97.2% (105/108) |
| src/rules | 98.9% (434/439) | 90.0% (135/150) | 100.0% (30/30) |
| src/scenes | 88.2% (965/1094) | 91.8% (223/243) | 82.8% (48/58) |
| src/stage | 98.8% (2388/2417) | 96.3% (838/870) | 96.0% (120/125) |
| src/story | 91.0% (2767/3039) | 85.1% (799/939) | 91.7% (144/157) |
| src/types.ts | 100.0% (221/221) | 100.0% (0/0) | 100.0% (0/0) |
| src/ui | 84.2% (4279/5081) | 82.7% (900/1088) | 88.9% (225/253) |
| src/world | 98.9% (618/625) | 94.7% (230/243) | 100.0% (28/28) |

## per file

| file | righe | rami | funzioni |
|---|---|---|---|
| src/art/abilityFx.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/art/blocks.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/art/creatureKit.ts | 100.0% | 91.5% (10 mai) | 100.0% (0 mai) |
| src/art/creatures.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/art/creatures/bossKit.ts | 100.0% | 95.8% (1 mai) | 100.0% (0 mai) |
| src/art/creatures/bosses.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/art/creatures/bossesVoid.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/art/creatures/enemies.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/art/creatures/npcs.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/art/dressing.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/art/folk.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/art/fx/MemoryPipeline.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/art/fx/VortexPipeline.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/art/ink.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/art/materials.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/art/normalFlip.ts | 100.0% | 85.7% (4 mai) | 100.0% (0 mai) |
| src/art/npcTexture.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/art/pickups.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/art/playerSkin.ts | 88.1% | 62.3% (26 mai) | 92.3% (1 mai) |
| src/art/props.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/art/silhouettes.ts | 100.0% | 98.6% (2 mai) | 100.0% (0 mai) |
| src/art/textures.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/audio/Soundscape.ts | 100.0% | 94.1% (6 mai) | 100.0% (0 mai) |
| src/audio/acoustics.ts | 99.1% | 92.1% (6 mai) | 100.0% (0 mai) |
| src/audio/music.ts | 93.3% | 96.0% (6 mai) | 95.5% (1 mai) |
| src/audio/sfx.ts | 98.9% | 93.0% (15 mai) | 98.8% (1 mai) |
| src/config.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/content/achievements.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/content/arcs.ts | 100.0% | 88.9% (1 mai) | 100.0% (0 mai) |
| src/content/barks.ts | 100.0% | 75.0% (2 mai) | 100.0% (0 mai) |
| src/content/biomes.ts | 100.0% | 50.0% (2 mai) | 100.0% (0 mai) |
| src/content/bosses.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/content/codex.ts | 100.0% | 58.8% (7 mai) | 100.0% (0 mai) |
| src/content/enemies.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/content/flashbacks.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/content/folk.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/content/items.ts | 100.0% | 17.4% (19 mai) | 100.0% (0 mai) |
| src/content/lessons.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/content/levels/index.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/content/levels/level00-piazza.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/content/levels/level01-perduta.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/content/levels/level02-bus.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/content/levels/level02b-galliate.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/content/levels/level02c-marcetti.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/content/levels/level03-santuario.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/content/levels/level04-tecnokill.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/content/levels/level05-trenbolone.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/content/levels/level06-tana.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/content/levels/level07-rio.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/content/levels/level08-stabilimento.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/content/levels/level09-ruhra.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/content/levels/level09b-mente.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/content/levels/level10-caso.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/content/levels/level11-sorveglianza.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/content/levels/level12-cantina.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/content/levels/level13-ricordi.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/content/levels/level13b-void.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/content/levels/level14-nucleo.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/content/levels/level15-barrato.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/content/levels/level16-custode.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/content/pedro.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/content/phone.ts | 71.4% | 100.0% (0 mai) | 0.0% (9 mai) |
| src/content/quests.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/content/skins.ts | 100.0% | 80.0% (1 mai) | 100.0% (0 mai) |
| src/content/staging.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/content/story.ts | 97.9% | 72.2% (20 mai) | 100.0% (0 mai) |
| src/content/tone.ts | 100.0% | 50.0% (1 mai) | 100.0% (0 mai) |
| src/core/ChapterCompletion.ts | 96.9% | 69.7% (10 mai) | 100.0% (0 mai) |
| src/core/achievements.ts | 100.0% | 86.7% (2 mai) | 100.0% (0 mai) |
| src/core/events.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/core/inventory.ts | 100.0% | 50.0% (6 mai) | 100.0% (0 mai) |
| src/core/regionView.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/core/rng.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/core/score.ts | 90.5% | 76.9% (3 mai) | 100.0% (0 mai) |
| src/core/softFail.ts | 50.0% | 100.0% (0 mai) | 0.0% (1 mai) |
| src/core/state.ts | 99.1% | 89.0% (11 mai) | 97.2% (1 mai) |
| src/core/worldEvents.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/dev/hooks.ts | 53.3% | 100.0% (0 mai) | 75.0% (1 mai) |
| src/entities/Boss.ts | 99.5% | 94.1% (17 mai) | 97.7% (1 mai) |
| src/entities/Companion.ts | 98.8% | 97.8% (2 mai) | 100.0% (0 mai) |
| src/entities/Enemy.ts | 99.1% | 95.9% (14 mai) | 100.0% (0 mai) |
| src/entities/Player.ts | 96.4% | 93.2% (24 mai) | 95.5% (2 mai) |
| src/entities/Spawner.ts | 100.0% | 80.0% (7 mai) | 100.0% (0 mai) |
| src/game/Arena.ts | 100.0% | 95.5% (2 mai) | 85.7% (1 mai) |
| src/game/Bosses.ts | 97.0% | 88.4% (18 mai) | 94.4% (1 mai) |
| src/game/Challenges.ts | 100.0% | 88.1% (10 mai) | 91.7% (1 mai) |
| src/game/Combat.ts | 91.4% | 84.1% (31 mai) | 94.1% (1 mai) |
| src/game/Dialogues.ts | 94.1% | 94.3% (2 mai) | 92.3% (1 mai) |
| src/game/Doomsday.ts | 80.9% | 89.5% (4 mai) | 80.0% (1 mai) |
| src/game/Enemies.ts | 100.0% | 92.8% (17 mai) | 95.5% (1 mai) |
| src/game/Feel.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/game/Guide.ts | 100.0% | 89.7% (6 mai) | 83.3% (1 mai) |
| src/game/Interactions.ts | 100.0% | 100.0% (0 mai) | 90.0% (1 mai) |
| src/game/Npcs.ts | 100.0% | 100.0% (0 mai) | 88.9% (1 mai) |
| src/game/Progression.ts | 93.9% | 71.4% (40 mai) | 93.8% (1 mai) |
| src/game/Rewards.ts | 98.1% | 93.1% (7 mai) | 94.1% (1 mai) |
| src/game/SafeGround.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/game/Travel.ts | 100.0% | 91.6% (7 mai) | 94.4% (1 mai) |
| src/game/abilities/Analisi.ts | 100.0% | 96.8% (2 mai) | 100.0% (0 mai) |
| src/game/abilities/Bottiglia.ts | 97.4% | 92.3% (4 mai) | 92.9% (1 mai) |
| src/game/abilities/Riflesso.ts | 97.8% | 91.1% (5 mai) | 100.0% (0 mai) |
| src/game/abilities/Risonante.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/game/abilities/Scudo.ts | 100.0% | 87.2% (5 mai) | 100.0% (0 mai) |
| src/game/abilities/Veleno.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/game/abilities/Volo.ts | 96.6% | 67.9% (9 mai) | 100.0% (0 mai) |
| src/game/abilities/index.ts | 98.5% | 92.3% (2 mai) | 95.5% (1 mai) |
| src/game/abilities/shared.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/game/chapters/ChapterScript.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/game/chapters/barrato.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/game/chapters/bus.ts | 100.0% | 90.0% (6 mai) | 100.0% (0 mai) |
| src/game/chapters/cantina.ts | 96.1% | 85.0% (3 mai) | 100.0% (0 mai) |
| src/game/chapters/caso.ts | 98.6% | 90.0% (2 mai) | 100.0% (0 mai) |
| src/game/chapters/custode.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/game/chapters/index.ts | 100.0% | 50.0% (1 mai) | 100.0% (0 mai) |
| src/game/chapters/mente.ts | 83.1% | 78.6% (3 mai) | 100.0% (0 mai) |
| src/game/chapters/nucleo.ts | 98.3% | 94.9% (5 mai) | 95.5% (1 mai) |
| src/game/chapters/perduta.ts | 85.7% | 86.7% (2 mai) | 100.0% (0 mai) |
| src/game/chapters/piazza.ts | 95.3% | 85.7% (11 mai) | 100.0% (0 mai) |
| src/game/chapters/ricordi.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/game/chapters/rio.ts | 99.2% | 92.3% (3 mai) | 100.0% (0 mai) |
| src/game/chapters/ruhra.ts | 100.0% | 85.7% (3 mai) | 100.0% (0 mai) |
| src/game/chapters/santuario.ts | 95.7% | 90.9% (3 mai) | 100.0% (0 mai) |
| src/game/chapters/shared/Ambushes.ts | 100.0% | 97.6% (1 mai) | 100.0% (0 mai) |
| src/game/chapters/shared/WalkingGuide.ts | 72.2% | 77.8% (2 mai) | 100.0% (0 mai) |
| src/game/chapters/shared/smela.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/game/chapters/shared/wave.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/game/chapters/sorveglianza.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/game/chapters/stabilimento.ts | 93.2% | 91.7% (3 mai) | 100.0% (0 mai) |
| src/game/chapters/tana.ts | 89.6% | 73.5% (27 mai) | 100.0% (0 mai) |
| src/game/chapters/tecnokill.ts | 97.9% | 83.3% (2 mai) | 100.0% (0 mai) |
| src/game/chapters/trenbolone.ts | 100.0% | 88.9% (3 mai) | 100.0% (0 mai) |
| src/game/chapters/void.ts | 97.9% | 88.6% (8 mai) | 100.0% (0 mai) |
| src/game/chapters/walter.ts | 95.3% | 79.7% (12 mai) | 100.0% (0 mai) |
| src/game/context.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/game/groups.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/game/world/LevelWorld.ts | 100.0% | 96.4% (3 mai) | 100.0% (0 mai) |
| src/input/Input.ts | 98.4% | 79.3% (19 mai) | 100.0% (0 mai) |
| src/input/actions.ts | 89.1% | 64.9% (13 mai) | 83.3% (1 mai) |
| src/input/keyText.ts | 100.0% | 41.7% (14 mai) | 100.0% (0 mai) |
| src/input/padBridge.ts | 87.7% | 62.5% (12 mai) | 75.0% (1 mai) |
| src/main.ts | 90.7% | 86.4% (8 mai) | 81.3% (3 mai) |
| src/mechanics/AbilitySeals.ts | 92.2% | 87.3% (21 mai) | 90.0% (2 mai) |
| src/mechanics/BusDoors.ts | 100.0% | 98.2% (1 mai) | 100.0% (0 mai) |
| src/mechanics/Cameras.ts | 100.0% | 98.8% (1 mai) | 100.0% (0 mai) |
| src/mechanics/FloorFlow.ts | 100.0% | 98.7% (1 mai) | 100.0% (0 mai) |
| src/mechanics/HazardManager.ts | 100.0% | 97.5% (5 mai) | 100.0% (0 mai) |
| src/mechanics/MindDoors.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/mechanics/Snipers.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/mechanics/Tana.ts | 98.9% | 77.6% (15 mai) | 92.3% (1 mai) |
| src/mechanics/TimeTrial.ts | 97.4% | 79.6% (10 mai) | 100.0% (0 mai) |
| src/mechanics/TrapManager.ts | 100.0% | 99.4% (1 mai) | 100.0% (0 mai) |
| src/mechanics/index.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/mechanics/types.ts | 100.0% | 96.7% (1 mai) | 100.0% (0 mai) |
| src/rules/abilities.ts | 100.0% | 81.8% (2 mai) | 100.0% (0 mai) |
| src/rules/combat.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/rules/fixedStep.ts | 95.2% | 57.1% (3 mai) | 100.0% (0 mai) |
| src/rules/hash.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/rules/ombra.ts | 97.9% | 91.5% (6 mai) | 100.0% (0 mai) |
| src/rules/rng.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/rules/save.ts | 100.0% | 85.2% (4 mai) | 100.0% (0 mai) |
| src/rules/score.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/scenes/BootScene.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/scenes/GalleryScene.ts | 21.3% | 100.0% (0 mai) | 25.0% (6 mai) |
| src/scenes/GameScene.ts | 98.4% | 92.8% (15 mai) | 92.1% (3 mai) |
| src/scenes/MenuScene.ts | 100.0% | 80.8% (5 mai) | 88.9% (1 mai) |
| src/stage/AmbienceManager.ts | 100.0% | 97.9% (1 mai) | 100.0% (0 mai) |
| src/stage/Atmosphere.ts | 100.0% | 98.2% (2 mai) | 100.0% (0 mai) |
| src/stage/DecorationManager.ts | 100.0% | 97.8% (1 mai) | 100.0% (0 mai) |
| src/stage/FolkManager.ts | 100.0% | 97.1% (6 mai) | 100.0% (0 mai) |
| src/stage/LevelLoader.ts | 100.0% | 92.1% (3 mai) | 100.0% (0 mai) |
| src/stage/LightingManager.ts | 96.8% | 91.2% (3 mai) | 100.0% (0 mai) |
| src/stage/ParallaxManager.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/stage/RoomBackdrops.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/stage/StagingManager.ts | 100.0% | 88.7% (8 mai) | 88.9% (1 mai) |
| src/stage/TerrainRenderer.ts | 96.1% | 96.4% (8 mai) | 88.2% (4 mai) |
| src/stage/WaterRenderer.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/story/BossVoice.ts | 100.0% | 96.4% (2 mai) | 100.0% (0 mai) |
| src/story/FlashbackManager.ts | 88.6% | 86.2% (40 mai) | 93.6% (3 mai) |
| src/story/NucleusStraightening.ts | 94.2% | 77.4% (30 mai) | 85.2% (4 mai) |
| src/story/OmbraBrain.ts | 80.4% | 84.0% (15 mai) | 78.6% (3 mai) |
| src/story/PedroApparition.ts | 99.3% | 94.2% (4 mai) | 100.0% (0 mai) |
| src/story/QuestManager.ts | 95.3% | 77.0% (26 mai) | 94.7% (1 mai) |
| src/story/RegionGuide.ts | 98.9% | 91.5% (4 mai) | 100.0% (0 mai) |
| src/story/StoryManager.ts | 97.7% | 80.4% (18 mai) | 100.0% (0 mai) |
| src/story/TrentatreMarks.ts | 85.6% | 97.8% (1 mai) | 75.0% (2 mai) |
| src/types.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/ui/assist.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/ui/banner.ts | 100.0% | 70.0% (3 mai) | 100.0% (0 mai) |
| src/ui/chapterSummary.ts | 55.0% | 68.4% (6 mai) | 83.3% (1 mai) |
| src/ui/cine.ts | 60.6% | 68.8% (10 mai) | 71.4% (6 mai) |
| src/ui/dialogue.ts | 100.0% | 92.5% (3 mai) | 100.0% (0 mai) |
| src/ui/dom.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/ui/endingFx.ts | 99.4% | 87.1% (11 mai) | 94.1% (1 mai) |
| src/ui/finalSummary.ts | 54.2% | 52.4% (10 mai) | 71.4% (2 mai) |
| src/ui/hud.ts | 97.3% | 87.0% (9 mai) | 100.0% (0 mai) |
| src/ui/phone.ts | 84.7% | 81.7% (67 mai) | 94.3% (3 mai) |
| src/ui/photos.ts | 77.7% | 30.0% (7 mai) | 50.0% (2 mai) |
| src/ui/screens.ts | 89.3% | 86.8% (40 mai) | 87.3% (13 mai) |
| src/ui/subtitles.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/ui/trophies.ts | 91.7% | 74.4% (22 mai) | 100.0% (0 mai) |
| src/world/NavGraph.ts | 100.0% | 95.9% (9 mai) | 100.0% (0 mai) |
| src/world/codec.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/world/registry.ts | 87.5% | 85.7% (2 mai) | 100.0% (0 mai) |
| src/world/types.ts | 98.5% | 60.0% (2 mai) | 100.0% (0 mai) |

## rami e funzioni dei file del refactor (dal sorgente)

Ogni ramo (then/else, ?:, && || ??, case, catch, cicli) e ogni funzione di `GameScene.ts`, `entities/` e dei moduli di gioco (`engine/` su main; `game/`, `core/`, `stage/`, `story/`, `mechanics/` e gli altri dopo il refactor), enumerati dall'ast di typescript e controllati sulla copertura v8 di tutto il corpus. Gli else impliciti non si possono misurare con la copertura a blocchi di v8: restano fuori dal conto.

**rami eseguiti: 5390/5953 (90.5%) · funzioni eseguite: 2276/2377 (95.8%)**

| file | rami | funzioni |
|---|---|---|
| src/art/abilityFx.ts | 88/88 | 27/27 |
| src/art/blocks.ts | 15/15 | 5/5 |
| src/art/creatureKit.ts | 75/81 | 38/38 |
| src/art/creatures.ts | 11/11 | 4/4 |
| src/art/creatures/bossKit.ts | 14/15 | 9/9 |
| src/art/creatures/bosses.ts | 51/51 | 32/32 |
| src/art/creatures/bossesVoid.ts | 63/63 | 32/32 |
| src/art/creatures/enemies.ts | 91/91 | 38/38 |
| src/art/creatures/npcs.ts | 13/13 | 27/27 |
| src/art/dressing.ts | 67/67 | 25/25 |
| src/art/folk.ts | 25/25 | 8/8 |
| src/art/fx/MemoryPipeline.ts | 0/0 | 2/2 |
| src/art/fx/VortexPipeline.ts | 0/0 | 3/3 |
| src/art/ink.ts | 20/20 | 23/23 |
| src/art/materials.ts | 54/54 | 36/36 |
| src/art/normalFlip.ts | 14/17 | 5/5 |
| src/art/npcTexture.ts | 24/24 | 1/1 |
| src/art/pickups.ts | 2/2 | 3/3 |
| src/art/playerSkin.ts | 44/70 | 14/15 |
| src/art/props.ts | 48/48 | 41/41 |
| src/art/silhouettes.ts | 105/105 | 31/31 |
| src/art/textures.ts | 7/7 | 23/23 |
| src/audio/Soundscape.ts | 75/78 | 14/14 |
| src/audio/acoustics.ts | 59/62 | 14/14 |
| src/audio/music.ts | 82/86 | 22/25 |
| src/audio/sfx.ts | 106/113 | 87/94 |
| src/core/ChapterCompletion.ts | 19/25 | 14/14 |
| src/core/achievements.ts | 9/9 | 4/4 |
| src/core/events.ts | 1/1 | 4/4 |
| src/core/inventory.ts | 8/9 | 5/5 |
| src/core/regionView.ts | 0/0 | 0/0 |
| src/core/rng.ts | 0/0 | 2/2 |
| src/core/score.ts | 6/7 | 5/5 |
| src/core/softFail.ts | 0/0 | 0/1 |
| src/core/state.ts | 43/47 | 37/38 |
| src/core/worldEvents.ts | 0/0 | 3/3 |
| src/entities/Boss.ts | 176/184 | 65/66 |
| src/entities/Companion.ts | 63/64 | 14/14 |
| src/entities/Enemy.ts | 228/236 | 38/38 |
| src/entities/Player.ts | 239/251 | 52/54 |
| src/entities/Spawner.ts | 20/24 | 8/8 |
| src/game/Arena.ts | 30/30 | 5/5 |
| src/game/Bosses.ts | 101/111 | 19/19 |
| src/game/Challenges.ts | 38/43 | 22/22 |
| src/game/Combat.ts | 114/154 | 46/49 |
| src/game/Dialogues.ts | 11/13 | 14/14 |
| src/game/Doomsday.ts | 22/32 | 4/5 |
| src/game/Enemies.ts | 158/161 | 28/28 |
| src/game/Feel.ts | 1/1 | 4/4 |
| src/game/Guide.ts | 27/30 | 7/7 |
| src/game/Interactions.ts | 6/6 | 11/11 |
| src/game/Npcs.ts | 3/3 | 7/7 |
| src/game/Progression.ts | 70/104 | 23/23 |
| src/game/Rewards.ts | 54/57 | 26/27 |
| src/game/SafeGround.ts | 4/4 | 2/2 |
| src/game/Travel.ts | 43/46 | 27/27 |
| src/game/abilities/Analisi.ts | 31/31 | 20/20 |
| src/game/abilities/Bottiglia.ts | 23/26 | 18/21 |
| src/game/abilities/Riflesso.ts | 24/28 | 21/22 |
| src/game/abilities/Risonante.ts | 14/14 | 3/3 |
| src/game/abilities/Scudo.ts | 15/18 | 15/15 |
| src/game/abilities/Veleno.ts | 6/6 | 4/4 |
| src/game/abilities/Volo.ts | 19/27 | 4/4 |
| src/game/abilities/index.ts | 3/5 | 20/21 |
| src/game/abilities/shared.ts | 0/0 | 1/1 |
| src/game/chapters/ChapterScript.ts | 0/0 | 1/1 |
| src/game/chapters/barrato.ts | 1/1 | 2/2 |
| src/game/chapters/bus.ts | 33/35 | 19/19 |
| src/game/chapters/cantina.ts | 10/12 | 9/9 |
| src/game/chapters/caso.ts | 10/12 | 10/10 |
| src/game/chapters/custode.ts | 1/1 | 2/2 |
| src/game/chapters/index.ts | 0/1 | 1/1 |
| src/game/chapters/mente.ts | 6/6 | 9/10 |
| src/game/chapters/nucleo.ts | 50/53 | 37/38 |
| src/game/chapters/perduta.ts | 7/11 | 4/4 |
| src/game/chapters/piazza.ts | 45/55 | 26/26 |
| src/game/chapters/ricordi.ts | 1/1 | 2/2 |
| src/game/chapters/rio.ts | 21/22 | 14/14 |
| src/game/chapters/ruhra.ts | 9/10 | 11/11 |
| src/game/chapters/santuario.ts | 18/20 | 11/13 |
| src/game/chapters/shared/Ambushes.ts | 25/26 | 9/9 |
| src/game/chapters/shared/WalkingGuide.ts | 6/10 | 2/2 |
| src/game/chapters/shared/smela.ts | 0/0 | 3/3 |
| src/game/chapters/shared/wave.ts | 1/1 | 2/2 |
| src/game/chapters/sorveglianza.ts | 5/5 | 7/7 |
| src/game/chapters/stabilimento.ts | 14/16 | 10/12 |
| src/game/chapters/tana.ts | 52/80 | 25/27 |
| src/game/chapters/tecnokill.ts | 7/8 | 6/6 |
| src/game/chapters/trenbolone.ts | 15/16 | 12/12 |
| src/game/chapters/void.ts | 30/32 | 30/31 |
| src/game/chapters/walter.ts | 26/31 | 26/26 |
| src/game/context.ts | 0/0 | 1/1 |
| src/game/groups.ts | 0/0 | 1/1 |
| src/game/world/LevelWorld.ts | 57/58 | 9/9 |
| src/input/Input.ts | 49/60 | 20/20 |
| src/input/actions.ts | 19/44 | 5/6 |
| src/input/keyText.ts | 5/17 | 6/6 |
| src/input/padBridge.ts | 20/27 | 3/5 |
| src/mechanics/AbilitySeals.ts | 128/146 | 23/26 |
| src/mechanics/BusDoors.ts | 39/39 | 12/12 |
| src/mechanics/Cameras.ts | 49/50 | 14/14 |
| src/mechanics/FloorFlow.ts | 60/60 | 12/12 |
| src/mechanics/HazardManager.ts | 126/126 | 28/28 |
| src/mechanics/MindDoors.ts | 2/2 | 6/6 |
| src/mechanics/Snipers.ts | 28/28 | 7/7 |
| src/mechanics/Tana.ts | 60/67 | 20/20 |
| src/mechanics/TimeTrial.ts | 26/37 | 13/13 |
| src/mechanics/TrapManager.ts | 101/101 | 17/17 |
| src/mechanics/index.ts | 9/9 | 1/1 |
| src/mechanics/types.ts | 23/23 | 3/3 |
| src/rules/abilities.test.ts | 0/0 | 0/0 |
| src/rules/abilities.ts | 8/8 | 3/3 |
| src/rules/combat.test.ts | 0/0 | 0/0 |
| src/rules/combat.ts | 10/10 | 3/3 |
| src/rules/fixedStep.test.ts | 0/0 | 0/0 |
| src/rules/fixedStep.ts | 3/4 | 3/3 |
| src/rules/hash.ts | 1/1 | 3/3 |
| src/rules/ombra.test.ts | 0/0 | 0/0 |
| src/rules/ombra.ts | 43/46 | 6/6 |
| src/rules/rng.test.ts | 0/0 | 0/0 |
| src/rules/rng.ts | 1/1 | 5/5 |
| src/rules/save.test.ts | 0/0 | 0/0 |
| src/rules/save.ts | 18/22 | 7/7 |
| src/rules/score.test.ts | 0/0 | 0/0 |
| src/rules/score.ts | 1/1 | 6/7 |
| src/scenes/GameScene.ts | 97/107 | 75/80 |
| src/stage/AmbienceManager.ts | 26/29 | 20/20 |
| src/stage/Atmosphere.ts | 75/75 | 17/17 |
| src/stage/DecorationManager.ts | 29/30 | 9/9 |
| src/stage/FolkManager.ts | 139/142 | 30/30 |
| src/stage/LevelLoader.ts | 26/27 | 6/6 |
| src/stage/LightingManager.ts | 22/23 | 10/10 |
| src/stage/ParallaxManager.ts | 33/33 | 9/9 |
| src/stage/RoomBackdrops.ts | 5/5 | 2/2 |
| src/stage/StagingManager.ts | 53/58 | 9/9 |
| src/stage/TerrainRenderer.ts | 156/168 | 42/45 |
| src/stage/WaterRenderer.ts | 23/23 | 9/9 |
| src/story/BossVoice.ts | 25/25 | 10/10 |
| src/story/FlashbackManager.ts | 126/178 | 156/185 |
| src/story/NucleusStraightening.ts | 94/107 | 29/34 |
| src/story/OmbraBrain.ts | 70/93 | 17/24 |
| src/story/PedroApparition.ts | 36/36 | 22/23 |
| src/story/QuestManager.ts | 60/77 | 35/38 |
| src/story/RegionGuide.ts | 29/31 | 6/6 |
| src/story/StoryManager.ts | 46/54 | 35/36 |
| src/story/TrentatreMarks.ts | 20/26 | 12/17 |
| src/world/NavGraph.ts | 139/141 | 23/23 |

## punti ciechi

Funzioni mai chiamate e rami mai presi. Va ridotto a codice davvero morto o irraggiungibile, scenario dopo scenario.

### src/art/creatureKit.ts
- rami mai presi (6):
  - 117 ||: `Math.hypot(b.x - a.x, b.y - a.y) || 1`
  - 127 ||: `Math.hypot(end.x - prev.x, end.y - prev.y) || 1`
  - 131 ||: `Math.hypot(nx2.x - st.x, nx2.y - st.y) || 1`
  - 187 ??: `o.hatch ?? 0.5`
  - 187 ??: `o.hatch ?? 0.5`
  - 506 ??: `d.creatureRes ?? 1`

### src/art/creatures/bossKit.ts
- rami mai presi (1):
  - 16 ??: `o.mouth ?? 'flat'`

### src/art/normalFlip.ts
- rami mai presi (3):
  - 27 ??: `s.scaleX ?? 1`
  - 28 ??: `s.scaleY ?? 1`
  - 42 ??: `this.__flip ?? 0`

### src/art/playerSkin.ts
- funzioni mai chiamate (1): hueDist:20
- rami mai presi (24):
  - 34 ?:vero: `l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn)`
  - 36 ?:vero: `g < b ? 6 : 0`
  - 36 ?:falso: `g < b ? 6 : 0`
  - 38 else: `if (mx === g) h = ((b - r) / d + 2) * 60;`
  - 45 then: `if (!s) {`
  - 48 ?:falso: `l < 0.5 ? l * (1 + s) : l + s - l * s`
  - 87 ??: `preset.hue ?? SOURCE_SKIN_HUE`
  - 90 ciclo: `for (let i = 0; i < data.length; i += 4) {`
  - 91 then: `if (a < 10) continue;`
  - 96 then: `if (s < SAT_MIN || l < LIGHT_MIN || l > LIGHT_MAX) continue;`
  - 96 ||: `s < SAT_MIN || l < LIGHT_MIN || l > LIGHT_MAX`
  - 96 ||: `s < SAT_MIN || l < LIGHT_MIN`
  - 97 then: `if (hueDist(h, SOURCE_SKIN_HUE) > HUE_WINDOW) continue;`
  - 101 ??: `preset.satMul ?? 1`
  - 102 ??: `preset.lightAdd ?? 0`
  - 180 ??: `preset.hue ?? SOURCE_SKIN_HUE`
  - 183 ??: `preset.satMul ?? 1`
  - 184 ??: `preset.lightAdd ?? 0`
  - 214 catch: `catch {`
  - 227 ??: `(src as { width?: number }).width ?? 0`
  - 228 ??: `(src as { height?: number }).height ?? 0`
  - 262 ?:falso: `isValidSkinId(skinId) ? skinId : DEFAULT_SKIN_ID`
  - 277 catch: `catch {`
  - 285 catch: `catch {`

### src/audio/Soundscape.ts
- rami mai presi (3):
  - 84 ??: `SOUNDS[biome.id] ?? SOUNDS.crater`
  - 154 ?:vero: `inRock ? 0.5 : 0`
  - 199 ??: `beds[b] ?? 0`

### src/audio/acoustics.ts
- rami mai presi (3):
  - 107 catch: `catch {`
  - 284 ??: `T.echoMul ?? 1`
  - 298 ??: `this.applied ?? 'open'`

### src/audio/music.ts
- funzioni mai chiamate (3): nowPlaying:117, (callback di playPromise.catch):280, (anonima):281
- rami mai presi (3):
  - 174 default: `default:`
  - 251 then: `if (this.currentAudio && this.currentAudio.paused) {`
  - 263 then: `if (this.unlockListener) {`

### src/audio/sfx.ts
- funzioni mai chiamate (7): (callback di document.addEventListener):82, (callback di stops.push):663, (callback di stops.push):666, (callback di stops.push):684, (callback di stops.push):687, stop:732, (callback di stops.forEach):732
- rami mai presi (6):
  - 113 ??: `opts.type ?? 'square'`
  - 116 ??: `opts.vol ?? 0.12`
  - 141 ??: `opts.freq ?? 1800`
  - 145 ??: `opts.vol ?? 0.18`
  - 355 case: `case 'padella':`
  - 486 case: `case 'water':`

### src/core/ChapterCompletion.ts
- rami mai presi (6):
  - 56 then: `if (prev.kind !== kind || prev.levelId !== levelId) {`
  - 57 then: `if (import.meta.env.DEV) console.warn(msg);`
  - 58 else: `if (import.meta.env.DEV) console.warn(msg);`
  - 105 catch: `catch (err) {`
  - 142 ??: `state.save.explored[levelId] ?? []`
  - 143 ??: `roomTotals.get(levelId) ?? 0`

### src/core/inventory.ts
- rami mai presi (1):
  - 32 ??: `HEALS[id] ?? 0`

### src/core/score.ts
- rami mai presi (1):
  - 29 catch: `catch {`

### src/core/softFail.ts
- funzioni mai chiamate (1): softFail:2

### src/core/state.ts
- funzioni mai chiamate (1): setDoomsday:310
- rami mai presi (4):
  - 99 ?:vero: `this.run.patto ? 2 : 1`
  - 224 ??: `ITEMS[id]?.cost ?? 0`
  - 233 &&: `!this.run.nearMic && !this.godMode`
  - 237 ??: `ITEMS[id]?.cost ?? 0`

### src/entities/Boss.ts
- funzioni mai chiamate (1): delayAttack:165
- rami mai presi (8):
  - 102 ??: `this.def.move ?? 'hover'`
  - 180 ??: `this.def.move ?? 'hover'`
  - 224 ??: `this.lastDustAt ?? 0`
  - 266 ??: `this.hopY ?? this.anchorY`
  - 322 ?:falso: `phase === 3 ? 12 : 8`
  - 377 ||: `Math.sign(player.x - this.x) || 1`
  - 585 ??: `body?.velocity.x ?? 0`
  - 707 then: `if (this.shieldGraphics) {`

### src/entities/Companion.ts
- rami mai presi (1):
  - 184 then: `if (this.attacking && this.scene.time.now >= this.attackAnimUntil) {`

### src/entities/Enemy.ts
- rami mai presi (8):
  - 357 ?:falso: `this.nav ? this.nav.segments[this.nav.segmentBelow(this.x, body.bottom`
  - 404 ?:falso: `tb ? tb.bottom - 4 : target.y`
  - 432 then: `if (!nav) {`
  - 467 ?:vero: `edge.vx === 0 ? 0 : Math.sign(edge.vx) * Math.max(Math.abs(edge.vx), 9`
  - 575 ||: `-Math.sign(dx) || 1`
  - 577 then: `if (this.arch.behavior === 'flyer') {`
  - 581 ?:falso: `nav ? nav.segments[nav.segmentBelow(this.x, body.bottom - 4, 2)] : und`
  - 590 ?:vero: `this.staggered ? amount * 2 : amount`

### src/entities/Player.ts
- funzioni mai chiamate (2): isGrounded:140, still:205
- rami mai presi (11):
  - 125 then: `if (!anims.exists(key)) {`
  - 424 else: `if (state.hasAbility('risonante') || state.hasAbility('analisi') || st`
  - 420 ||: `state.hasAbility('risonante') || state.hasAbility('analisi') || state.`
  - 420 ||: `state.hasAbility('risonante') || state.hasAbility('analisi')`
  - 430 then: `if (this.controls.pressed('up')) {`
  - 435 then: `if (this.controls.pressed('down')) {`
  - 530 then: `if (regen > 0 && state.run.flow < state.maxFlow) {`
  - 529 &&: `regen > 0 && state.run.flow < state.maxFlow`
  - 668 then: `if (!this.spendFlow(cost)) {`
  - 736 then: `if (state.run.flow < ecoCost) {`
  - 744 then: `if (!this.charging && this.chargeRing) {`

### src/entities/Spawner.ts
- rami mai presi (4):
  - 36 ??: `ENEMIES[opts.kind]?.glowColor ?? 0xa855f7`
  - 37 ??: `opts.maxAlive ?? 3`
  - 38 ??: `opts.intervalMs ?? 3500`
  - 39 ??: `opts.radius ?? 600`

### src/game/Bosses.ts
- rami mai presi (10):
  - 120 then: `if (kind === 'limite') {`
  - 210 else: `if (a === 'wave-risonante' || a === 'wave-analisi') bark = 'learn-shot`
  - 209 ||: `a === 'wave-risonante' || a === 'wave-analisi'`
  - 210 then: `if ((a === 'wave-riflesso' || a === 'wave-acquatossica') && rng.logic.`
  - 210 &&: `(a === 'wave-riflesso' || a === 'wave-acquatossica') && rng.logic.next`
  - 210 ||: `a === 'wave-riflesso' || a === 'wave-acquatossica'`
  - 233 else: `if (bossRoom) {`
  - 234 then: `if (!near) {`
  - 278 then: `if (this.fight && !this.fight.hit) {`
  - 279 then: `if (state.save.chapterRun) state.save.chapterRun.noHitBosses++;`

### src/game/Challenges.ts
- rami mai presi (5):
  - 55 ?:vero: `won ? 0x64748b : 0xef4444`
  - 122 ?:falso: `kinds.length ? kinds : ['glitchetto']`
  - 123 ??: `this.ctx.world.layout?.spots ?? []`
  - 127 ?:falso: `sp ? sp[0] * TILE + TILE / 2 : ch.x + (k - n / 2) * 60`
  - 128 ?:falso: `sp ? (sp[1] + 1) * TILE - 20 : ch.y`

### src/game/Combat.ts
- funzioni mai chiamate (3): (callback di this.scene.physics.add.collide):78, (callback di this.scene.physics.add.overlap):129, (callback di this.scene.physics.add.overlap):446
- rami mai presi (17):
  - 34 ||: `Math.sign(this.ctx.player.x - enemy.x) || 1`
  - 112 then: `if (enemy.active && enemy.arch.kind === 'specchietto' && this.ctx.play`
  - 111 &&: `enemy.active && enemy.arch.kind === 'specchietto' && this.ctx.player.a`
  - 122 then: `if (this.ctx.player.slamming) {`
  - 157 ||: `Math.sign(enemy.x - this.ctx.player.x) || 1`
  - 168 ?:falso: `a instanceof Enemy ? a : b`
  - 169 ?:falso: `a instanceof Enemy ? b : a`
  - 178 then: `if (enemy.blocks(bullet.x, 'shot') && level !== 2) {`
  - 177 &&: `enemy.blocks(bullet.x, 'shot') && level !== 2`
  - 186 ??: `(bullet.getData('dmg') as number | undefined) ?? COMBAT.scudoReflectNo`
  - 188 &&: `bullet.getData('perfect') && enemy.active`
  - 202 ?:falso: `a === this.ctx.player ? b : a`
  - 213 ?:falso: `a === this.ctx.player ? b : a`
  - 241 then: `if (this.ctx.bosses.current.def.kind === 'limite') {`
  - 248 ?:falso: `obj === this.ctx.bosses.current ? proj : obj`
  - 256 ??: `(bullet.getData('dmg') as number | undefined) ?? COMBAT.scudoReflectNo`
  - 343 ??: `color ?? 0xf87171`

### src/game/Dialogues.ts
- rami mai presi (2):
  - 49 then: `if (!this.hasFilm(id)) {`
  - 86 then: `if (!lines) {`

### src/game/Doomsday.ts
- funzioni mai chiamate (1): (callback di this.ctx.dialogues.start):95

### src/game/Enemies.ts
- rami mai presi (3):
  - 121 ??: `doorCount.get(room.id) ?? 0`
  - 123 ??: `rooms[room.anchor]?.pathIndex ?? 0`
  - 155 &&: `this.ctx.world.nav.solid(c, r - 1) && this.ctx.world.nav.solid(c, r - `

### src/game/Guide.ts
- rami mai presi (3):
  - 69 ?:falso: `this.guide ? '${this.guide.roomAt(this.ctx.player.x, this.ctx.player.y`
  - 69 ??: `this.guide.roomAt(goal.x, goal.y)?.id ?? -1`
  - 72 ?:falso: `this.guide ? this.guide.nextPoint(this.ctx.player.x, this.ctx.player.y`

### src/game/Progression.ts
- rami mai presi (34):
  - 44 &&: `this.ctx.bosses.current?.active && this.ctx.bosses.current.def.guardsE`
  - 46 ??: `ret?.levelId ?? this.ctx.world.def.returnTo`
  - 48 ?:falso: `ret && ret.levelId === target ? { x: ret.x, y: ret.y } : undefined`
  - 81 ??: `ret?.levelId ?? this.ctx.world.def.returnTo`
  - 83 ?:falso: `ret && ret.levelId === target ? { x: ret.x, y: ret.y } : undefined`
  - 92 then: `if (this.exiting || this.ctx.player.dead || this.ctx.world.def.hub) {`
  - 92 then: `if (!this.exiting && !this.ctx.player.dead && this.ctx.world.def.hub) `
  - 92 &&: `!this.exiting && !this.ctx.player.dead && this.ctx.world.def.hub`
  - 92 &&: `!this.exiting && !this.ctx.player.dead`
  - 101 ??: `state.save.explored[this.ctx.world.def.id] ?? []`
  - 120 catch: `catch (e) {`
  - 120 then: `if (import.meta.env.DEV) console.warn('riepilogo capitolo saltato:', e`
  - 123 then: `if (!summary) {`
  - 140 catch: `catch (e) {`
  - 140 then: `if (import.meta.env.DEV) console.warn('riepilogo capitolo saltato:', e`
  - 171 then: `if (state.save.flags.filter((f) => f.startsWith('esplorata-')).length `
  - 194 ?:falso: `this.ctx.world.layout ? (state.save.explored[this.ctx.world.def.id]?.l`
  - 194 ??: `state.save.explored[this.ctx.world.def.id]?.length ?? 0`
  - 203 ||: `!prev || score > prev.score`
  - 204 ??: `this.ctx.world.layout?.rooms.length ?? 0`
  - 221 ?:falso: `this.ctx.world.layout ? (state.save.explored[id]?.length ?? 0) / this.`
  - 221 ??: `state.save.explored[id]?.length ?? 0`
  - 236 ??: `ENDING_BONUS[id] ?? 0`
  - 237 ?:vero: `base === null ? null : base + bonus`
  - 238 ?:vero: `score === null ? 0 : pushBoard({ name: state.save.playerName, score, e`
  - 251 ??: `sc.hearts?.found ?? 0`
  - 252 ??: `sc.hearts?.total ?? 0`
  - 253 ??: `sc.things?.found ?? 0`
  - 269 ??: `titles[id] ?? titles.sconfitta`
  - 287 catch: `catch (e) {`
  - 287 then: `if (import.meta.env.DEV) console.warn('riepilogo finale saltato:', e);`
  - 290 then: `if (!summary) {`
  - 304 catch: `catch (e) {`
  - 304 then: `if (import.meta.env.DEV) console.warn('riepilogo finale saltato:', e);`

### src/game/Rewards.ts
- funzioni mai chiamate (1): (callback di this.scene.time.delayedCall):121
- rami mai presi (3):
  - 41 &&: `charm && state.hasCharm(id)`
  - 120 then: `if (!state.hasFlag('sigilli-spiegati')) {`
  - 255 then: `if (d < bd) { bd = d; bx = e.x; by = e.y; found = true; }`

### src/game/Travel.ts
- rami mai presi (3):
  - 171 ??: `label ?? to`
  - 172 ??: `label ?? to`
  - 176 ??: `label ?? to`

### src/game/abilities/Bottiglia.ts
- funzioni mai chiamate (3): (callback di this.scene.physics.add.collide):103, destroy:191, (callback di this.puddles.forEach):192
- rami mai presi (3):
  - 113 &&: `bottle.active && this.burst(bottle, null)`
  - 141 ciclo: `while (this.puddles.length >= COMBAT.acquaMaxPuddles) {`
  - 142 then: `if (old) this.fx.dry(old);`

### src/game/abilities/Riflesso.ts
- funzioni mai chiamate (1): (callback di this.scene.physics.add.overlap):146
- rami mai presi (3):
  - 136 ?:falso: `a === clone ? b : a`
  - 204 ??: `body?.width ?? 36`
  - 205 ??: `body?.height ?? 55`

### src/game/abilities/Scudo.ts
- rami mai presi (3):
  - 126 ?:falso: `shooter?.active ? shooter : null`
  - 130 ||: `Math.hypot(dx, dy) || 1`
  - 136 &&: `back.active && this.ctx.combat.popProjectile(back)`

### src/game/abilities/Volo.ts
- rami mai presi (8):
  - 20 ||: `Math.hypot(pbody.velocity.x, pbody.velocity.y) || 400`
  - 35 ??: `proj.getData('trailAt') as number ?? 0`
  - 40 ?:falso: `proj.getData('reflected') ? 'scudo' as const : null`
  - 41 ??: `proj.getData('waveAt') as number ?? 0`
  - 44 ??: `pbody?.width ?? 26`
  - 45 ??: `pbody?.height ?? 18`
  - 55 then: `if (homing && !homing.active) {`
  - 54 &&: `homing && !homing.active`

### src/game/abilities/index.ts
- funzioni mai chiamate (1): destroy:131
- rami mai presi (2):
  - 123 ??: `body?.width ?? 36`
  - 124 ??: `body?.height ?? 55`

### src/game/chapters/bus.ts
- rami mai presi (2):
  - 167 ||: `Math.sign(boss.x - ivan.x) || 1`
  - 177 ?:falso: `boss.active ? boss.y + 30 : ivan.y`

### src/game/chapters/cantina.ts
- rami mai presi (2):
  - 47 else: `if (state.hasFlag('boss-down-ticummi')) {`
  - 51 default: `default:`

### src/game/chapters/caso.ts
- rami mai presi (2):
  - 28 ?:falso: `state.hasFlag('lochef-arrestato') ? 'romero-lochef' : null`
  - 43 default: `default:`

### src/game/chapters/index.ts
- rami mai presi (1):
  - 50 ??: `CHAPTERS[levelId] ?? NoChapter`

### src/game/chapters/mente.ts
- funzioni mai chiamate (1): (callback di this.scene.time.delayedCall):76

### src/game/chapters/nucleo.ts
- funzioni mai chiamate (1): storyFight:68
- rami mai presi (2):
  - 217 then: `if (!room || room.kind !== 'arena') {`
  - 217 then: `if (import.meta.env.DEV) console.warn('[ordine] niente arena valida, c`

### src/game/chapters/perduta.ts
- rami mai presi (4):
  - 15 then: `if (state.hasFlag('markolino-dono-visto') && !state.hasAbility('scivol`
  - 16 then: `if (dono) this.ctx.rewards.spawnFragment(dono.x, dono.y - 50, 'scivola`
  - 28 then: `if (!state.hasAbility('scivolata') && !this.ctx.rewards.hasLiveFragmen`
  - 29 then: `if (dono) this.ctx.rewards.spawnFragment(dono.x, dono.y - 50, 'scivola`

### src/game/chapters/piazza.ts
- rami mai presi (10):
  - 94 ?:falso: `worst`
  - 101 &&: `state.save.quests[q.id] && state.save.quests[q.id].s !== 'fatta'`
  - 105 ciclo: `for (const q of open.slice(0, 4)) {`
  - 106 ?:vero: `st.s === 'pronta' ? '✓ da riscuotere' : '· in corso'`
  - 106 ?:falso: `st.s === 'pronta' ? '✓ da riscuotere' : '· in corso'`
  - 106 ??: `LEVELS[q.region]?.accentWord ?? q.region`
  - 110 else: `if (fresh.length) lines.push(say('qualcuno chiede aiuto anche a ${[...`
  - 109 ??: `LEVELS[q.region]?.accentWord ?? q.region`
  - 110 then: `if (!open.length) lines.push(say('nessuna richiesta aperta. il realm p`
  - 160 then: `if (i === 1 && tacca && pay(tacca)) {`

### src/game/chapters/rio.ts
- rami mai presi (1):
  - 84 default: `default:`

### src/game/chapters/ruhra.ts
- rami mai presi (1):
  - 37 ?:vero: `state.hasAbility('analisi') ? null : 'piema ha ancora bisogno di te. l`

### src/game/chapters/santuario.ts
- funzioni mai chiamate (2): (callback di this.scene.physics.add.overlap):128, (callback di this.ctx.dialogues.start):131

### src/game/chapters/shared/Ambushes.ts
- rami mai presi (1):
  - 69 ?:vero: `state.hasFlag('notino-disarmato') ? 'notino-agguato-vendetta' : null`

### src/game/chapters/shared/WalkingGuide.ts
- rami mai presi (4):
  - 36 else: `if (this.ctx.world.layout) {`
  - 21 ||: `Math.sign(objX - player.x) || 1`
  - 42 then: `if (Math.abs(dx) <= step + 1) {`
  - 44 else: `if (Math.abs(dx) <= step + 1) {`

### src/game/chapters/stabilimento.ts
- funzioni mai chiamate (2): (callback di this.ctx.dialogues.start):64, (callback di this.scene.time.delayedCall):67
- rami mai presi (2):
  - 64 case: `case 'smela':`
  - 76 then: `if (state.hasFlag('boss-down-smela')) { this.smelaArena = null; return`

### src/game/chapters/tana.ts
- funzioni mai chiamate (2): (callback di this.ctx.dialogues.start):89, onComplete:98
- rami mai presi (26):
  - 109 ??: `this.chaseEnds[i] ?? Infinity`
  - 140 ?:falso: `statue ? this.ctx.world.roomAt(statue.x, statue.y) : this.ctx.world.ro`
  - 142 ?:falso: `room && layout ? (layout.spots ?? []).filter((s) => (s[2] ?? -1) === r`
  - 142 ??: `layout.spots ?? []`
  - 142 ??: `s[2] ?? -1`
  - 147 else: `if (spots.length) {`
  - 148 then: `if (statue) {`
  - 163 ??: `this.chaseEnds[i] ?? Infinity`
  - 172 ?:falso: `goal && this.ctx.guide.guide ? this.ctx.guide.guide.nextPoint(this.ctx`
  - 173 ?:falso: `next ? Math.sign(next.x - this.ctx.player.x) || 1 : 1`
  - 173 ||: `Math.sign(next.x - this.ctx.player.x) || 1`
  - 203 else: `if (!state.save.seenDialogues.includes(lines.start)) {`
  - 212 ??: `this.chaseEnds[this.chaseZoneIdx] ?? Infinity`
  - 242 ||: `Math.hypot(hx, hy) || 1`
  - 247 else: `if (hdist > 70) {`
  - 249 ||: `Math.hypot(ax, ay) || 1`
  - 253 then: `if (this.scene.time.now >= this.chaseWhisperAt) {`
  - 254 ??: `BOSS_BARKS.lochef?.extra?.whisper ?? []`
  - 255 ?:vero: `lines.length ? lines[this.chaseWhisperIdx++ % lines.length] : 'dove se`
  - 255 ?:falso: `lines.length ? lines[this.chaseWhisperIdx++ % lines.length] : 'dove se`
  - 256 ?:vero: `typeof raw === 'string' ? raw : raw.text`
  - 256 ?:falso: `typeof raw === 'string' ? raw : raw.text`
  - 270 ||: `Math.hypot(dx, dy) || 1`
  - 279 then: `if (this.scene.time.now - this.chaseNearSince > 8000 && this.scene.tim`
  - 278 &&: `this.scene.time.now - this.chaseNearSince > 8000 && this.scene.time.no`
  - 310 ?:falso: `chef.x < this.ctx.player.x ? -1 : 1`

### src/game/chapters/tecnokill.ts
- rami mai presi (1):
  - 26 ?:vero: `letto`

### src/game/chapters/trenbolone.ts
- rami mai presi (1):
  - 59 ?:vero: `state.run.trenbolone ? null : 'la via per il rio merdone è sbarrata. t`

### src/game/chapters/void.ts
- funzioni mai chiamate (1): (callback di this.scene.time.delayedCall):83
- rami mai presi (2):
  - 165 ??: `lastArena?.x ?? this.ctx.player.x`
  - 174 then: `if (state.hasFlag('void-concluso')) {`

### src/game/chapters/walter.ts
- rami mai presi (5):
  - 114 then: `if (this.baruffoniStep >= seq.length) {`
  - 115 then: `if (this.guide.sprite && this.baruffoniArenas.length) {`
  - 114 &&: `this.guide.sprite && this.baruffoniArenas.length`
  - 171 ??: `this.guide.sprite?.x ?? arena.x`
  - 203 ??: `lastArena?.x ?? this.ctx.player.x`

### src/game/world/LevelWorld.ts
- rami mai presi (1):
  - 85 ?:falso: `this.layout ? oldXToProgress(this.layout, oldXPx / TILE) : oldXPx / TI`

### src/input/Input.ts
- rami mai presi (11):
  - 42 ??: `this.curr.get(a) ?? false`
  - 70 ??: `this.curr.get(a) ?? false`
  - 74 ??: `this.curr.get(a) ?? false`
  - 143 ??: `pad.axes[0] ?? 0`
  - 144 ??: `pad.axes[1] ?? 0`
  - 170 then: `if (now[i] && !this.prevPadButtons[i]) {`
  - 169 &&: `now[i] && !this.prevPadButtons[i]`
  - 181 ??: `pad.axes[0] ?? 0`
  - 182 ??: `pad.axes[1] ?? 0`
  - 184 &&: `ax && ay && !dpad`
  - 184 &&: `ax && ay`

### src/input/actions.ts
- funzioni mai chiamate (1): keyNameForCode:149
- rami mai presi (13):
  - 115 case: `case 'SHIFT': return ['ShiftLeft', 'ShiftRight'];`
  - 118 case: `case 'ENTER': return ['Enter'];`
  - 119 case: `case 'LEFT': return ['ArrowLeft'];`
  - 120 case: `case 'RIGHT': return ['ArrowRight'];`
  - 121 case: `case 'UP': return ['ArrowUp'];`
  - 122 case: `case 'DOWN': return ['ArrowDown'];`
  - 124 case: `case 'MOUSE_RIGHT': return [];`
  - 128 then: `if (/^[0-9]$/.test(name)) return ['Digit${name}'];`
  - 175 case: `case 'ENTER': return 'INVIO';`
  - 176 case: `case 'LEFT': return '←';`
  - 177 case: `case 'RIGHT': return '→';`
  - 178 case: `case 'UP': return '↑';`
  - 179 case: `case 'DOWN': return '↓';`

### src/input/keyText.ts
- rami mai presi (12):
  - 19 case: `case 'left': return '←';`
  - 20 case: `case 'right': return '→';`
  - 21 case: `case 'up': return '↑';`
  - 22 case: `case 'down': return '↓';`
  - 23 case: `case 'jump': return 'A';`
  - 24 case: `case 'attack': return 'X';`
  - 25 case: `case 'dash': return 'B';`
  - 26 case: `case 'wave': return 'Y';`
  - 27 case: `case 'scudo': return 'RB';`
  - 28 case: `case 'riflesso': return 'LB';`
  - 31 case: `case 'phone': return 'VIEW';`
  - 32 case: `case 'pause': return 'START';`

### src/input/padBridge.ts
- funzioni mai chiamate (2): press:24, (anonima):77
- rami mai presi (7):
  - 38 ?:falso: `navigator.getGamepads ? navigator.getGamepads() : []`
  - 54 &&: `down && !prevButtons[i]`
  - 57 ??: `pad.axes[0] ?? 0`
  - 58 ??: `pad.axes[1] ?? 0`
  - 67 then: `if (dir) {`
  - 68 then: `if (dir !== lastDir || now - lastDirAt > REPEAT_MS) {`
  - 67 ||: `dir !== lastDir || now - lastDirAt > REPEAT_MS`

### src/mechanics/AbilitySeals.ts
- funzioni mai chiamate (3): onComplete:208, (callback di this.ctx.scene.time.delayedCal):209, onComplete:215
- rami mai presi (18):
  - 133 then: `if (lit !== l.ringLit) {`
  - 140 then: `if (this.cloudRect(l.seal).contains(p.x, p.y) && time >= l.nextTick) {`
  - 139 &&: `this.cloudRect(l.seal).contains(p.x, p.y) && time >= l.nextTick`
  - 141 then: `if (state.run.hp > 1) p.hurt(1, l.cx);`
  - 145 then: `if (kind === 'specchio' && l.holdMs > 0 && !this.ctx.getClone()) {`
  - 174 then: `if ((ev.level ?? 0) >= 1) {`
  - 175 else: `if ((ev.level ?? 0) >= 1) {`
  - 173 ??: `ev.level ?? 0`
  - 176 then: `if (this.ctx.scene.time.now - l.lastFx > 500) {`
  - 188 ?:falso: `now - l.lastHit > 400 ? 200 : l.holdMs + (now - l.lastHit)`
  - 204 then: `if ((ev.level ?? 1) === 2) {`
  - 210 else: `if ((ev.level ?? 1) === 2) {`
  - 202 ??: `ev.level ?? 1`
  - 212 then: `if (this.ctx.scene.time.now - l.lastFx > 400) {`
  - 350 ?:vero: `rect.width < rect.height ? -90 : 0`
  - 396 ?:falso: `l.mark ? [l.mark] : []`
  - 411 else: `if (prize.kind === 'tacca') this.ctx.giveNotch(px, py, key);`
  - 418 else: `if (!state.hasFlag('seme-sigilli-visto')) {`

### src/mechanics/Cameras.ts
- rami mai presi (1):
  - 158 ?:falso: `a ? Phaser.Display.Color.GetColor(Math.round(a.r * 255), Math.round(a.`

### src/mechanics/Tana.ts
- rami mai presi (7):
  - 88 then: `if (this.ctx.player.hidden) {`
  - 88 then: `if (this.hiddenIn === wh) this.unhide(false);`
  - 163 else: `if (p.active) {`
  - 166 ?:falso: `wh.used ? 'tana-armadio-aperto' : 'tana-armadio'`
  - 177 ??: `BOSS_BARKS.lochef?.extra?.whisper ?? []`
  - 183 ?:falso: `typeof raw === 'string' ? raw : raw.text`
  - 201 ?:falso: `a ? Phaser.Display.Color.GetColor(Math.round(a.r * 255), Math.round(a.`

### src/mechanics/TimeTrial.ts
- rami mai presi (11):
  - 81 ?:vero: `best ? ' il tuo record: ${(best / 1000).toFixed(1)}s.' : ''`
  - 106 ?:falso: `Math.abs(dx) > 200 ? (dx > 0 ? 'a destra' : 'a sinistra') : ''`
  - 106 ?:falso: `dx > 0 ? 'a destra' : 'a sinistra'`
  - 106 ?:vero: `dy > 0 ? 'più giù' : 'più su'`
  - 109 ||: `where || 'qui vicino'`
  - 119 then: `if (player.dead) {`
  - 138 ||: `!prev || ms < prev`
  - 146 else: `if (first) {`
  - 146 ?:vero: `!prev || ms < prev ? 'nuovo record: ${t}.' : '${t}. il record resta ${`
  - 146 ?:falso: `!prev || ms < prev ? 'nuovo record: ${t}.' : '${t}. il record resta ${`
  - 146 ||: `!prev || ms < prev`

### src/rules/fixedStep.ts
- rami mai presi (1):
  - 38 then: `if (Math.abs(deltaMs - this.stepMs / k) < SNAP_MS) return this.stepMs `

### src/rules/ombra.ts
- rami mai presi (3):
  - 50 ?:falso: `typeof p.total === 'number' && Number.isFinite(p.total) ? Math.floor(p`
  - 53 ?:falso: `typeof p.sightings === 'number' && Number.isFinite(p.sightings)`
  - 88 default: `default:`

### src/rules/save.ts
- rami mai presi (4):
  - 53 ??: `parsed.record ?? {}`
  - 53 ??: `parsed.explored ?? {}`
  - 85 ??: `save.runScores ?? {}`
  - 86 ??: `save.scores ?? {}`

### src/rules/score.ts
- funzioni mai chiamate (1): (callback di [...list, entry].sort):51

### src/scenes/GameScene.ts
- funzioni mai chiamate (5): (callback di bus.on):203, giveHeart:377, giveItem:378, (callback di bus.on):532, present:583
- rami mai presi (7):
  - 375 ??: `body?.width ?? 36`
  - 559 ?:falso: `this.bosses.current?.active ? this.world.roomAt(this.bosses.current.x,`
  - 578 ?:falso: `Math.abs(k - 1) < 1e-3 ? CAMERA_LERP : 1 - Math.pow(1 - CAMERA_LERP, k`
  - 598 then: `if (this.controls.device === 'gamepad' && this.controls.pressed('up')`
  - 596 &&: `this.controls.device === 'gamepad' && this.controls.pressed('up')`
  - 596 &&: `this.controls.device === 'gamepad' && this.controls.pressed('up')`
  - 596 &&: `this.controls.device === 'gamepad' && this.controls.pressed('up')`

### src/stage/AmbienceManager.ts
- rami mai presi (3):
  - 50 ?:falso: `fps >= 55 ? 1 : fps >= 35 ? 0.6 : 0.35`
  - 50 ?:vero: `fps >= 35 ? 0.6 : 0.35`
  - 50 ?:falso: `fps >= 35 ? 0.6 : 0.35`

### src/stage/DecorationManager.ts
- rami mai presi (1):
  - 26 ??: `grid[r]?.[c] ?? '.'`

### src/stage/FolkManager.ts
- rami mai presi (3):
  - 97 ??: `FOLK[opts.biomeId] ?? FOLK.crater`
  - 115 ?:falso: `opts.layout ? Math.max(8, Math.min(30, Math.round(opts.layout.rooms.le`
  - 146 &&: `news.length && rng.logic.next() < 0.6`

### src/stage/LevelLoader.ts
- rami mai presi (1):
  - 66 ??: `rows[r][c] ?? '.'`

### src/stage/LightingManager.ts
- rami mai presi (1):
  - 94 then: `if (ai >= 0) {`

### src/stage/StagingManager.ts
- rami mai presi (5):
  - 65 ?:vero: `a.pathIndex >= 0 ? a.pathIndex : (layout.rooms[a.anchor]?.pathIndex ??`
  - 65 ??: `layout.rooms[a.anchor]?.pathIndex ?? 0`
  - 66 ?:vero: `b.pathIndex >= 0 ? b.pathIndex : (layout.rooms[b.anchor]?.pathIndex ??`
  - 66 ??: `layout.rooms[b.anchor]?.pathIndex ?? 0`
  - 69 ??: `sorted[Math.floor(sorted.length / 2)] ?? sorted[0]`

### src/stage/TerrainRenderer.ts
- funzioni mai chiamate (3): straightenFakeWalls:586, releaseStraightenedWalls:596, regionsFor:605
- rami mai presi (3):
  - 89 ??: `out.get(key(e.bx, e.by)) ?? []`
  - 100 ??: `cands.find((j) => edges[j].bx - edges[j].ax === rx && edges[j].by - ed`
  - 114 ||: `Math.hypot(dx, dy) || 1`

### src/story/FlashbackManager.ts
- funzioni mai chiamate (29): (callback di cap.addEventListener):367, warp:600, onComplete:617, onComplete:623, (callback di F):689, (callback di F):689, (callback di F):690, (callback di F):690, (callback di F):691, (callback di F):691, (callback di F):709, (callback di F):709, (callback di F):710, (callback di F):710, (callback di F):711, (anonima):971, (callback di mgr['loop']):979, (anonima):986, (callback di mgr['after']):992, (callback di mgr['after']):993, (callback di mgr['after']):997, (anonima):1003, (callback di mgr['after']):1012, (anonima):1195, (callback di mgr['loop']):1205, (anonima):1220, (callback di mgr['after']):1229, (anonima):1234, (callback di mgr['after']):1245
- rami mai presi (38):
  - 73 then: `if (!fb || this.playing) {`
  - 93 ??: `opts?.host ?? {}`
  - 97 ??: `host.enemyGroup?.getChildren() ?? []`
  - 109 ??: `pbody?.velocity.x ?? 0`
  - 109 ??: `pbody?.velocity.y ?? 0`
  - 125 ??: `host.findFlatStage?.(player.x, player.y) ?? null`
  - 126 ??: `(player as unknown as { facing?: number }).facing ?? 1`
  - 127 ?:falso: `flat ? flat.x : player.x + facing * 260`
  - 128 ?:falso: `flat ? flat.y : player.y + 24`
  - 175 ??: `host.vignette ?? null`
  - 176 ?:falso: `gameVignette ? { radius: gameVignette.radius, strength: gameVignette.s`
  - 189 catch: `catch (e) { softFail('film', e); }`
  - 209 catch: `catch { vortexPipe = null; }`
  - 214 then: `if (!vortexPipe) {`
  - 237 ??: `shotDur[i] ?? 1400`
  - 315 catch: `catch { vortexPipe = null; }`
  - 317 then: `if (!vortexPipe) {`
  - 409 catch: `catch (e) { softFail('film', e); }`
  - 417 catch: `catch (e) { softFail('film', e); }`
  - 461 ??: `CAST_TEXTURE[name] ?? 'npc-markolino'`
  - 463 catch: `catch { tex = key; }`
  - 464 ??: `CAST_H[name] ?? 80`
  - 467 ||: `s.height || 48`
  - 468 ||: `s.width || 48`
  - 469 ?:vero: `name === 'bus' ? 210 : 130`
  - 484 ??: `s.texture.frameTotal ?? 1`
  - 537 else: `if (scene.textures.exists('fog')) {`
  - 570 catch: `catch {`
  - 581 ?:vero: `Array.isArray(got) ? got[got.length - 1] : got`
  - 594 catch: `catch (e) {`
  - 689 case: `case 'spinge':`
  - 689 then: `if (shot === 0) { F(200, () => sfx.horn(-0.4, 0.8)); F(600, () => sfx.`
  - 690 then: `if (shot === 1) { F(100, () => sfx.rumble()); F(600, () => sfx.creak()`
  - 691 then: `if (shot === 2) { F(200, () => sfx.creak(0.3, 0.9)); F(700, () => sfx.`
  - 709 case: `case 'spegne':`
  - 709 then: `if (shot === 0) { F(300, () => sfx.buzz(-0.3, 0.6)); F(800, () => sfx.`
  - 710 then: `if (shot === 1) { F(400, () => sfx.beep(0.2, 0.5)); F(900, () => sfx.c`
  - 711 then: `if (shot === 2) { F(200, () => sfx.clankFar(0, 1)); }`

### src/story/NucleusStraightening.ts
- funzioni mai chiamate (5): onComplete:131, cancelPreview:181, onComplete:316, (callback di this.ctx.arenaDoorRects.some):333, onComplete:403
- rami mai presi (13):
  - 46 ?:falso: `typeof first === 'string' ? first : fallback`
  - 79 &&: `this.pendingPhase !== null && (!boss || !boss.active)`
  - 79 ||: `!boss || !boss.active`
  - 119 then: `if (sel.length) {`
  - 140 then: `if (this.collider) {`
  - 144 then: `if (this.selectedGroup) {`
  - 231 then: `if (sel.length) {`
  - 234 ciclo: `for (const w of sel) group.add(w);`
  - 243 ?:vero: `boss.canStrike() ? 0 : 700`
  - 334 then: `if (nearDoor) continue;`
  - 336 ||: `Phaser.Geom.Intersects.RectangleToRectangle(box, playerBox)`
  - 376 ?:falso: `fromTop ? b.top + 24 : b.bottom - 24`
  - 377 ?:falso: `fromTop ? b.bottom - 24 : b.top + 24`

### src/story/OmbraBrain.ts
- funzioni mai chiamate (7): (callback di bus.on):65, (callback di this.after):141, (callback di this.after):158, (callback di this.after):167, reticle:211, glyphs:230, recOff:242
- rami mai presi (12):
  - 122 ?:vero: `a === 'attack-down' ? 'down' : null`
  - 140 then: `if (a === 'heal-start' || a === 'heal-done') {`
  - 156 else: `if (a === 'wave-risonante') {`
  - 157 then: `if (a === 'wave-analisi') {`
  - 165 else: `if (a === 'wave-analisi') {`
  - 166 then: `if (a === 'wave-scudo') {`
  - 171 else: `if (a === 'wave-scudo') {`
  - 174 else: `if (a === 'wave-riflesso' || a === 'wave-acquatossica') {`
  - 171 ||: `a === 'wave-riflesso' || a === 'wave-acquatossica'`
  - 190 ||: `Math.sign(this.player.x - this.boss.x) || 1`
  - 192 ?:vero: `dir === 'down' ? 70 : 0`
  - 261 then: `if (m.active) m.destroy();`

### src/story/PedroApparition.ts
- funzioni mai chiamate (1): (callback di this.timers.forEach):148

### src/story/QuestManager.ts
- funzioni mai chiamate (3): (callback di spots.filter):85, (callback di this.spots.filter):233, placedThings:271
- rami mai presi (17):
  - 79 ?:falso: `early.length ? early : quiet.length ? quiet : spots`
  - 79 ?:vero: `quiet.length ? quiet : spots`
  - 79 ?:falso: `quiet.length ? quiet : spots`
  - 85 ?:falso: `far.length ? far : spots.filter((s) => s.room !== g.room)`
  - 139 ??: `def.thing?.icon ?? '?'`
  - 153 ??: `def.thing?.icon ?? ''`
  - 187 then: `if (st.s === 'fatta') {`
  - 191 then: `if (st.s === 'pronta' && def.kind !== 'consegna') {`
  - 190 &&: `st.s === 'pronta' && def.kind !== 'consegna'`
  - 204 ?:vero: `st?.s === 'fatta' ? def.recipient.thanks[0] : '...sì? aspetto qualcosa`
  - 223 ?:falso: `r.item ? ' · ${ITEMS[r.item]?.icon ?? ''} ${ITEMS[r.item]?.name ?? ''}`
  - 223 ??: `ITEMS[r.item]?.icon ?? ''`
  - 223 ??: `ITEMS[r.item]?.name ?? ''`
  - 233 ?:falso: `side.length ? side : this.spots.filter((s) => s.room !== giverRoom)`
  - 243 &&: `def.hunt.kind && def.hunt.kind !== kind`
  - 246 then: `if (n >= def.hunt.count) {`
  - 251 then: `if (n % 4 === 0) bus.emit('toast', { text: '${def.title}: ${n}/${def.h`

### src/story/RegionGuide.ts
- rami mai presi (2):
  - 25 ?:falso: `A.rect.y < B.rect.y ? A : B`
  - 26 ?:falso: `top === A ? B : A`

### src/story/StoryManager.ts
- funzioni mai chiamate (1): (callback di this.hooks.dialogue):166
- rami mai presi (8):
  - 67 ?:vero: `room.pathIndex >= 0 ? room.pathIndex : layout.rooms.find((o) => o.id =`
  - 67 ??: `layout.rooms.find((o) => o.id === room.anchor)?.pathIndex ?? 0`
  - 95 ??: `claim(secrets.length ? secrets : side, 0.6) ?? claim(pathRooms, 0.7)`
  - 95 ?:falso: `secrets.length ? secrets : side`
  - 101 ??: `claim(side, 0.95) ?? claim(pathRooms, 0.9)`
  - 105 ??: `REGION_NOTES[regionId] ?? []`
  - 107 ??: `claim(side, (i + 0.5) / notes.length) ?? claim(pathRooms, (i + 0.5) / `
  - 130 ?:vero: `state.save.collectedLore.includes(id) ? 0.5 : 1`

### src/story/TrentatreMarks.ts
- funzioni mai chiamate (5): extinguishWalls:115, (callback di this.extinguished.some):118, (callback di m.walls.some):119, restoreExtinguished:126, (callback di this.scene.time.delayedCall):134

### src/world/NavGraph.ts
- rami mai presi (2):
  - 68 ??: `grid[r][c] ?? '.'`
  - 321 ||: `Math.hypot(x1 - x0, y1 - y0) || 1`
