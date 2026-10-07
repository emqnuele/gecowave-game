# copertura del corpus

Generato da `scripts/harness/coverage.mjs` sulla build di main (2 scenari). È la mappa dei punti ciechi: una traccia uguale non dimostra niente sul codice che nessuno scenario esegue.

| | righe | rami | funzioni |
|---|---|---|---|
| **totale src** | 60.5% | 74.0% | 53.0% |
| src/config.ts | 100.0% (144/144) | 100.0% (0/0) | 100.0% (0/0) |
| src/content | 95.8% (5902/6163) | 91.4% (53/58) | 57.7% (30/52) |
| src/engine | 66.8% (12195/18255) | 80.1% (2142/2674) | 62.9% (612/973) |
| src/entities | 44.4% (1218/2741) | 63.9% (202/316) | 34.1% (45/132) |
| src/main.ts | 60.3% (164/272) | 55.0% (11/20) | 25.0% (4/16) |
| src/scenes | 40.5% (2509/6194) | 54.5% (370/679) | 40.4% (99/245) |
| src/types.ts | 100.0% (225/225) | 100.0% (0/0) | 100.0% (0/0) |
| src/ui | 23.6% (1197/5079) | 70.6% (89/126) | 29.7% (52/175) |
| src/world | 94.0% (203/216) | 63.6% (7/11) | 83.3% (5/6) |

## per file

| file | righe | rami | funzioni |
|---|---|---|---|
| src/config.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/content/achievements.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/content/arcs.ts | 100.0% | 88.9% (1 mai) | 100.0% (0 mai) |
| src/content/barks.ts | 99.5% | 83.3% (1 mai) | 80.0% (1 mai) |
| src/content/biomes.ts | 100.0% | 33.3% (2 mai) | 100.0% (0 mai) |
| src/content/bosses.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/content/codex.ts | 36.4% | 100.0% (0 mai) | 0.0% (2 mai) |
| src/content/enemies.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/content/flashbacks.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/content/folk.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/content/items.ts | 89.6% | 50.0% (1 mai) | 100.0% (0 mai) |
| src/content/lessons.ts | 97.8% | 100.0% (0 mai) | 0.0% (1 mai) |
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
| src/content/phone.ts | 71.2% | 100.0% (0 mai) | 0.0% (9 mai) |
| src/content/quests.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/content/staging.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/content/story.ts | 91.4% | 100.0% (0 mai) | 0.0% (8 mai) |
| src/content/tone.ts | 96.2% | 100.0% (0 mai) | 0.0% (1 mai) |
| src/engine/AbilitySeals.ts | 58.0% | 60.0% (28 mai) | 57.9% (8 mai) |
| src/engine/AmbienceManager.ts | 80.1% | 68.4% (12 mai) | 100.0% (0 mai) |
| src/engine/Atmosphere.ts | 87.3% | 47.5% (32 mai) | 78.6% (3 mai) |
| src/engine/BossVoice.ts | 29.8% | 100.0% (0 mai) | 0.0% (7 mai) |
| src/engine/ChapterCompletion.ts | 69.1% | 66.7% (2 mai) | 44.4% (5 mai) |
| src/engine/DecorationManager.ts | 100.0% | 95.5% (2 mai) | 100.0% (0 mai) |
| src/engine/FlashbackManager.ts | 14.4% | 100.0% (0 mai) | 6.5% (29 mai) |
| src/engine/FolkManager.ts | 61.6% | 70.2% (28 mai) | 64.7% (6 mai) |
| src/engine/HazardManager.ts | 73.4% | 78.2% (27 mai) | 66.7% (5 mai) |
| src/engine/LevelLoader.ts | 99.3% | 89.2% (4 mai) | 100.0% (0 mai) |
| src/engine/LightingManager.ts | 77.4% | 92.3% (2 mai) | 80.0% (2 mai) |
| src/engine/NucleusStraightening.ts | 22.9% | 100.0% (0 mai) | 0.0% (19 mai) |
| src/engine/OmbraBrain.ts | 28.5% | 100.0% (0 mai) | 0.0% (14 mai) |
| src/engine/OmbraProfile.ts | 62.0% | 56.5% (10 mai) | 60.0% (2 mai) |
| src/engine/ParallaxManager.ts | 100.0% | 94.6% (2 mai) | 88.9% (1 mai) |
| src/engine/PedroApparition.ts | 63.2% | 60.0% (10 mai) | 50.0% (5 mai) |
| src/engine/QuestManager.ts | 56.2% | 71.4% (10 mai) | 50.0% (9 mai) |
| src/engine/RegionGuide.ts | 43.6% | 87.5% (1 mai) | 33.3% (4 mai) |
| src/engine/RoomBackdrops.ts | 100.0% | 87.5% (1 mai) | 100.0% (0 mai) |
| src/engine/StagingManager.ts | 51.2% | 34.8% (30 mai) | 77.8% (2 mai) |
| src/engine/StoryManager.ts | 69.1% | 63.5% (19 mai) | 62.5% (6 mai) |
| src/engine/TerrainRenderer.ts | 92.2% | 91.6% (17 mai) | 82.4% (6 mai) |
| src/engine/TimeTrial.ts | 60.9% | 68.8% (5 mai) | 50.0% (6 mai) |
| src/engine/TrapManager.ts | 66.6% | 92.1% (6 mai) | 69.2% (4 mai) |
| src/engine/TrentatreMarks.ts | 75.2% | 73.3% (8 mai) | 62.5% (3 mai) |
| src/engine/WaterRenderer.ts | 27.1% | 66.7% (2 mai) | 66.7% (2 mai) |
| src/engine/achievements.ts | 100.0% | 72.7% (3 mai) | 100.0% (0 mai) |
| src/engine/art/abilityFx.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/engine/art/blocks.ts | 83.6% | 76.9% (3 mai) | 100.0% (0 mai) |
| src/engine/art/creatureKit.ts | 99.8% | 86.6% (15 mai) | 100.0% (0 mai) |
| src/engine/art/creatures.ts | 100.0% | 87.5% (2 mai) | 100.0% (0 mai) |
| src/engine/art/creatures/bossKit.ts | 100.0% | 95.8% (1 mai) | 100.0% (0 mai) |
| src/engine/art/creatures/bosses.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/engine/art/creatures/bossesVoid.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/engine/art/creatures/enemies.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/engine/art/creatures/npcs.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/engine/art/dressing.ts | 63.2% | 82.0% (11 mai) | 58.3% (10 mai) |
| src/engine/art/folk.ts | 67.9% | 69.0% (9 mai) | 100.0% (0 mai) |
| src/engine/art/ink.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/engine/art/materials.ts | 41.9% | 100.0% (0 mai) | 53.3% (7 mai) |
| src/engine/art/normalFlip.ts | 100.0% | 85.2% (4 mai) | 100.0% (0 mai) |
| src/engine/art/pickups.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/engine/art/props.ts | 54.2% | 100.0% (0 mai) | 50.0% (18 mai) |
| src/engine/art/silhouettes.ts | 56.2% | 90.4% (8 mai) | 58.1% (13 mai) |
| src/engine/audio/Soundscape.ts | 96.4% | 68.6% (22 mai) | 100.0% (0 mai) |
| src/engine/audio/acoustics.ts | 88.3% | 67.3% (17 mai) | 73.3% (4 mai) |
| src/engine/events.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/engine/fx/MemoryPipeline.ts | 86.8% | 100.0% (0 mai) | 0.0% (3 mai) |
| src/engine/fx/VortexPipeline.ts | 83.3% | 100.0% (0 mai) | 0.0% (4 mai) |
| src/engine/input/Input.ts | 86.2% | 59.7% (25 mai) | 89.5% (2 mai) |
| src/engine/input/actions.ts | 89.1% | 30.3% (23 mai) | 83.3% (1 mai) |
| src/engine/input/keyText.ts | 60.8% | 50.0% (3 mai) | 66.7% (1 mai) |
| src/engine/input/padBridge.ts | 65.4% | 43.8% (9 mai) | 50.0% (2 mai) |
| src/engine/inventory.ts | 46.3% | 100.0% (0 mai) | 0.0% (4 mai) |
| src/engine/mechanics/BusDoors.ts | 92.5% | 86.0% (7 mai) | 80.0% (1 mai) |
| src/engine/mechanics/Cameras.ts | 32.3% | 100.0% (0 mai) | 0.0% (9 mai) |
| src/engine/mechanics/FloorFlow.ts | 28.2% | 100.0% (0 mai) | 0.0% (7 mai) |
| src/engine/mechanics/Snipers.ts | 31.3% | 100.0% (0 mai) | 0.0% (6 mai) |
| src/engine/mechanics/Tana.ts | 18.5% | 100.0% (0 mai) | 0.0% (11 mai) |
| src/engine/mechanics/index.ts | 76.7% | 30.0% (7 mai) | 25.0% (3 mai) |
| src/engine/mechanics/types.ts | 100.0% | 85.7% (4 mai) | 100.0% (0 mai) |
| src/engine/music.ts | 52.7% | 42.0% (29 mai) | 47.6% (11 mai) |
| src/engine/nav/NavGraph.ts | 37.2% | 83.8% (6 mai) | 52.9% (8 mai) |
| src/engine/npcTexture.ts | 100.0% | 60.5% (15 mai) | 100.0% (0 mai) |
| src/engine/playerSkin.ts | 61.9% | 50.0% (17 mai) | 42.9% (8 mai) |
| src/engine/regionView.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/engine/score.ts | 58.8% | 100.0% (0 mai) | 0.0% (6 mai) |
| src/engine/sfx.ts | 60.0% | 72.0% (26 mai) | 30.5% (57 mai) |
| src/engine/state.ts | 60.5% | 78.9% (8 mai) | 54.1% (17 mai) |
| src/engine/textures.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/entities/Boss.ts | 30.5% | 21.9% (25 mai) | 16.7% (30 mai) |
| src/entities/Companion.ts | 15.2% | 100.0% (0 mai) | 0.0% (12 mai) |
| src/entities/Enemy.ts | 47.6% | 62.6% (34 mai) | 31.3% (22 mai) |
| src/entities/Player.ts | 56.3% | 72.2% (50 mai) | 56.8% (19 mai) |
| src/entities/Spawner.ts | 75.8% | 61.5% (5 mai) | 50.0% (4 mai) |
| src/main.ts | 60.3% | 55.0% (9 mai) | 25.0% (12 mai) |
| src/scenes/BootScene.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/scenes/GalleryScene.ts | 21.8% | 100.0% (0 mai) | 25.0% (6 mai) |
| src/scenes/GameScene.ts | 38.5% | 53.0% (303 mai) | 38.2% (139 mai) |
| src/scenes/MenuScene.ts | 100.0% | 76.0% (6 mai) | 88.9% (1 mai) |
| src/types.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/ui/assist.ts | 16.7% | 100.0% (0 mai) | 0.0% (1 mai) |
| src/ui/banner.ts | 91.4% | 20.0% (4 mai) | 50.0% (1 mai) |
| src/ui/chapterSummary.ts | 5.8% | 100.0% (0 mai) | 66.7% (1 mai) |
| src/ui/cine.ts | 20.6% | 100.0% (0 mai) | 5.6% (17 mai) |
| src/ui/dialogue.ts | 29.5% | 100.0% (0 mai) | 37.5% (5 mai) |
| src/ui/dom.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/ui/endingFx.ts | 17.7% | 100.0% (0 mai) | 0.0% (14 mai) |
| src/ui/finalSummary.ts | 6.3% | 100.0% (0 mai) | 66.7% (1 mai) |
| src/ui/hud.ts | 72.9% | 59.5% (15 mai) | 81.3% (3 mai) |
| src/ui/phone.ts | 18.2% | 64.7% (6 mai) | 19.0% (34 mai) |
| src/ui/photos.ts | 35.1% | 100.0% (0 mai) | 0.0% (4 mai) |
| src/ui/screens.ts | 24.1% | 77.4% (12 mai) | 34.6% (34 mai) |
| src/ui/subtitles.ts | 46.8% | 100.0% (0 mai) | 33.3% (4 mai) |
| src/ui/trophies.ts | 12.5% | 100.0% (0 mai) | 0.0% (4 mai) |
| src/world/codec.ts | 100.0% | 100.0% (0 mai) | 100.0% (0 mai) |
| src/world/registry.ts | 87.5% | 42.9% (4 mai) | 100.0% (0 mai) |
| src/world/types.ts | 94.1% | 100.0% (0 mai) | 0.0% (1 mai) |

## rami e funzioni dei file del refactor (dal sorgente)

Ogni ramo (then/else, ?:, && || ??, case, catch, cicli) e ogni funzione di `GameScene.ts`, `entities/` ed `engine/`, enumerati dall'ast di typescript e controllati sulla copertura v8 di tutto il corpus. Gli else impliciti non si possono misurare con la copertura a blocchi di v8: restano fuori dal conto.

**rami eseguiti: 2179/5956 (36.6%) · funzioni eseguite: 898/2164 (41.5%)**

| file | rami | funzioni |
|---|---|---|
| src/engine/AbilitySeals.ts | 54/146 | 11/26 |
| src/engine/AmbienceManager.ts | 12/29 | 16/20 |
| src/engine/Atmosphere.ts | 47/75 | 11/17 |
| src/engine/BossVoice.ts | 0/25 | 0/10 |
| src/engine/ChapterCompletion.ts | 3/24 | 5/14 |
| src/engine/DecorationManager.ts | 28/30 | 9/9 |
| src/engine/FlashbackManager.ts | 0/173 | 1/183 |
| src/engine/FolkManager.ts | 59/142 | 14/30 |
| src/engine/HazardManager.ts | 72/126 | 18/28 |
| src/engine/LevelLoader.ts | 25/27 | 6/6 |
| src/engine/LightingManager.ts | 19/24 | 7/11 |
| src/engine/NucleusStraightening.ts | 0/88 | 0/24 |
| src/engine/OmbraBrain.ts | 0/93 | 0/24 |
| src/engine/OmbraProfile.ts | 13/46 | 3/6 |
| src/engine/ParallaxManager.ts | 32/33 | 8/9 |
| src/engine/PedroApparition.ts | 11/36 | 7/23 |
| src/engine/QuestManager.ts | 23/77 | 15/38 |
| src/engine/RegionGuide.ts | 5/31 | 2/6 |
| src/engine/RoomBackdrops.ts | 4/5 | 2/2 |
| src/engine/StagingManager.ts | 16/58 | 8/9 |
| src/engine/StoryManager.ts | 26/54 | 21/37 |
| src/engine/TerrainRenderer.ts | 144/168 | 39/45 |
| src/engine/TimeTrial.ts | 11/37 | 6/13 |
| src/engine/TrapManager.ts | 49/101 | 12/17 |
| src/engine/TrentatreMarks.ts | 15/26 | 10/17 |
| src/engine/WaterRenderer.ts | 1/23 | 3/9 |
| src/engine/achievements.ts | 9/9 | 4/4 |
| src/engine/art/abilityFx.ts | 88/88 | 27/27 |
| src/engine/art/blocks.ts | 7/15 | 5/5 |
| src/engine/art/creatureKit.ts | 73/81 | 38/38 |
| src/engine/art/creatures.ts | 11/11 | 4/4 |
| src/engine/art/creatures/bossKit.ts | 14/15 | 9/9 |
| src/engine/art/creatures/bosses.ts | 52/52 | 35/35 |
| src/engine/art/creatures/bossesVoid.ts | 63/63 | 32/32 |
| src/engine/art/creatures/enemies.ts | 91/91 | 38/38 |
| src/engine/art/creatures/npcs.ts | 13/13 | 27/27 |
| src/engine/art/dressing.ts | 33/67 | 14/25 |
| src/engine/art/folk.ts | 12/25 | 8/8 |
| src/engine/art/ink.ts | 21/21 | 26/26 |
| src/engine/art/materials.ts | 15/54 | 11/36 |
| src/engine/art/normalFlip.ts | 14/17 | 5/5 |
| src/engine/art/pickups.ts | 2/2 | 3/3 |
| src/engine/art/props.ts | 20/48 | 20/41 |
| src/engine/art/silhouettes.ts | 60/105 | 18/31 |
| src/engine/audio/Soundscape.ts | 51/78 | 10/14 |
| src/engine/audio/acoustics.ts | 42/67 | 10/16 |
| src/engine/events.ts | 1/1 | 3/4 |
| src/engine/fx/MemoryPipeline.ts | 0/0 | 0/2 |
| src/engine/fx/VortexPipeline.ts | 0/0 | 0/3 |
| src/engine/input/Input.ts | 35/59 | 16/20 |
| src/engine/input/actions.ts | 10/44 | 5/6 |
| src/engine/input/keyText.ts | 3/17 | 3/6 |
| src/engine/input/padBridge.ts | 6/27 | 2/5 |
| src/engine/inventory.ts | 0/9 | 0/5 |
| src/engine/mechanics/BusDoors.ts | 36/39 | 10/12 |
| src/engine/mechanics/Cameras.ts | 0/50 | 0/14 |
| src/engine/mechanics/FloorFlow.ts | 0/60 | 0/12 |
| src/engine/mechanics/Snipers.ts | 0/28 | 0/7 |
| src/engine/mechanics/Tana.ts | 0/67 | 0/20 |
| src/engine/mechanics/index.ts | 2/11 | 1/7 |
| src/engine/mechanics/types.ts | 21/23 | 3/3 |
| src/engine/music.ts | 18/87 | 10/25 |
| src/engine/nav/NavGraph.ts | 28/141 | 9/23 |
| src/engine/npcTexture.ts | 24/24 | 1/1 |
| src/engine/playerSkin.ts | 24/72 | 10/19 |
| src/engine/regionView.ts | 0/0 | 0/0 |
| src/engine/score.ts | 0/8 | 0/10 |
| src/engine/sfx.ts | 52/116 | 28/98 |
| src/engine/state.ts | 13/68 | 20/43 |
| src/engine/textures.ts | 7/7 | 23/23 |
| src/entities/Boss.ts | 23/186 | 5/66 |
| src/entities/Companion.ts | 0/64 | 0/14 |
| src/entities/Enemy.ts | 58/236 | 9/38 |
| src/entities/Player.ts | 103/251 | 28/54 |
| src/entities/Spawner.ts | 5/24 | 3/8 |
| src/scenes/GameScene.ts | 350/1618 | 131/559 |

## punti ciechi

Funzioni mai chiamate e rami mai presi. Va ridotto a codice davvero morto o irraggiungibile, scenario dopo scenario.

### src/engine/AbilitySeals.ts
- funzioni mai chiamate (15): intersectsArea:86, (callback di this.live):110, (callback di this.ctx.scene.time.delayedCal):125, destroy:156, onComplete:213, (callback di this.ctx.scene.time.delayedCal):214, onComplete:220, lensRect:230, cloudRect:234, hasPhysicalGate:245, (callback di this.ctx.layout?.abilityGates?):247, open:391, onComplete:406, (callback di fading.forEach):406, (callback di regionView.markers.findIndex):425
- rami mai presi (62):
  - 100 ??: `ctx.layout?.seals ?? []`
  - 120 then: `if (!state.hasFlag('visto-sigillo-${l.seal.id}')`
  - 119 &&: `!state.hasFlag('visto-sigillo-${l.seal.id}')`
  - 124 then: `if (!state.hasFlag('sigilli-spiegati')) {`
  - 131 then: `if (kind === 'risonanza') {`
  - 132 ciclo: `for (const v of l.visuals) {`
  - 132 then: `if (v instanceof Phaser.GameObjects.Graphics) v.x = l.baseX + Math.sin`
  - 138 then: `if (lit !== l.ringLit) {`
  - 141 &&: `lit && Math.hypot(p.x - l.cx, p.y - l.cy) < 42`
  - 144 then: `if (kind === 'miasma') {`
  - 145 then: `if (this.cloudRect(l.seal).contains(p.x, p.y) && time >= l.nextTick) {`
  - 144 &&: `this.cloudRect(l.seal).contains(p.x, p.y) && time >= l.nextTick`
  - 146 then: `if (state.run.hp > 1) p.hurt(1, l.cx);`
  - 150 then: `if (kind === 'specchio' && l.holdMs > 0 && !this.ctx.getClone()) {`
  - 148 &&: `kind === 'specchio' && l.holdMs > 0 && !this.ctx.getClone()`
  - 174 then: `if (kind === 'cortina') {`
  - 174 then: `if (ev.wave === 'scivolata' && intersectsArea(ev.area, doorRect(l.seal`
  - 174 &&: `ev.wave === 'scivolata' && intersectsArea(ev.area, doorRect(l.seal.doo`
  - 176 then: `if (kind === 'risonanza') {`
  - 176 then: `if (ev.wave !== 'risonante' || !intersectsArea(ev.area, doorRect(l.sea`
  - 176 ||: `ev.wave !== 'risonante' || !intersectsArea(ev.area, doorRect(l.seal.do`
  - 179 then: `if ((ev.level ?? 0) >= 1) {`
  - 180 else: `if ((ev.level ?? 0) >= 1) {`
  - 178 ??: `ev.level ?? 0`
  - 181 then: `if (this.ctx.scene.time.now - l.lastFx > 500) {`
  - 197 else: `if (kind === 'specchio') {`
  - 186 ||: `ev.wave !== 'riflesso' || !this.ctx.getClone()`
  - 188 then: `if (!intersectsArea(ev.area, this.plateRect(l))) {`
  - 193 ?:vero: `now - l.lastHit > 400 ? 200 : l.holdMs + (now - l.lastHit)`
  - 193 ?:falso: `now - l.lastHit > 400 ? 200 : l.holdMs + (now - l.lastHit)`
  - 198 then: `if (kind === 'resina') {`
  - 199 else: `if (kind === 'resina') {`
  - 198 then: `if (ev.wave === 'acquatossica' && intersectsArea(ev.area, doorRect(l.s`
  - 198 &&: `ev.wave === 'acquatossica' && intersectsArea(ev.area, doorRect(l.seal.`
  - 201 then: `if (kind === 'miasma') {`
  - 202 else: `if (kind === 'miasma') {`
  - 201 then: `if (ev.wave === 'acquatossica' && intersectsArea(ev.area, this.cloudRe`
  - 201 &&: `ev.wave === 'acquatossica' && intersectsArea(ev.area, this.cloudRect(l`
  - 204 then: `if (kind === 'teorema') {`
  - 205 else: `if (kind === 'teorema') {`
  - 204 then: `if (ev.wave === 'analisi' && intersectsArea(ev.area, doorRect(l.seal.d`
  - 204 &&: `ev.wave === 'analisi' && intersectsArea(ev.area, doorRect(l.seal.door)`
  - 206 then: `if (kind === 'ricevitore') {`
  - 206 then: `if (ev.wave !== 'scudo' || !intersectsArea(ev.area, this.lensRect(l)))`
  - 206 ||: `ev.wave !== 'scudo' || !intersectsArea(ev.area, this.lensRect(l))`
  - 209 then: `if ((ev.level ?? 1) === 2) {`
  - 215 else: `if ((ev.level ?? 1) === 2) {`
  - 207 ??: `ev.level ?? 1`
  - 217 then: `if (this.ctx.scene.time.now - l.lastFx > 400) {`
  - 254 ?:vero: `l.ringLit ? 0x4ade80 : 0x475569`
  - 303 then: `if (kind === 'risonanza') {`
  - 308 ciclo: `for (let y = rect.top; y < rect.bottom; y += 14) {`
  - 327 then: `if (kind === 'miasma') {`
  - 346 else: `if (kind === 'rimbalzo' || kind === 'camino') {`
  - 347 then: `if (kind === 'resina') {`
  - 357 else: `if (kind === 'resina') {`
  - 355 ?:vero: `rect.width < rect.height ? -90 : 0`
  - 355 ?:falso: `rect.width < rect.height ? -90 : 0`
  - 358 then: `if (kind === 'teorema') {`
  - 367 else: `if (kind === 'teorema') {`
  - 363 ciclo: `for (let i = 0; i < 3; i++) {`
  - 368 then: `if (kind === 'ricevitore') {`

### src/engine/AmbienceManager.ts
- funzioni mai chiamate (4): (callback di scene.events.once):25, (callback di GLYPHS.forEach):115, (callback di make):115, (callback di GLYPHS.map):163
- rami mai presi (17):
  - 49 ?:falso: `fps >= 55 ? 1 : fps >= 35 ? 0.6 : 0.35`
  - 49 ?:vero: `fps >= 35 ? 0.6 : 0.35`
  - 49 ?:falso: `fps >= 35 ? 0.6 : 0.35`
  - 51 ciclo: `for (const r of this.rain) {`
  - 52 ?:vero: `outdoor ? 1 : 0`
  - 52 ?:falso: `outdoor ? 1 : 0`
  - 53 then: `if (outdoor) r.emitter.frequency = Math.round(r.baseFreq / q);`
  - 115 then: `if (biome.ambience.includes('glyphs')) {`
  - 150 case: `case 'embers':`
  - 154 case: `case 'rain': {`
  - 160 case: `case 'bubbles':`
  - 163 case: `case 'glyphs': {`
  - 165 ciclo: `for (let i = 0; i < 4; i++) {`
  - 170 case: `case 'ash':`
  - 173 case: `case 'data':`
  - 176 case: `case 'fireflies':`
  - 183 case: `case 'drips':`

### src/engine/Atmosphere.ts
- funzioni mai chiamate (6): realmClock:32, onResize:105, (callback di this.scene.events.once):107, bolt:194, onComplete:201, (callback di this.scene.time.delayedCall):203
- rami mai presi (28):
  - 62 ?:vero: `biome.indoor ? [] : CLIMATE[biome.id] ?? [['sereno', 1]]`
  - 62 ??: `CLIMATE[biome.id] ?? [['sereno', 1]]`
  - 95 ?:vero: `this.biome.id === 'wasteland' ? 0x8a7560 : 0xb0b8c0`
  - 152 ?:falso: `outdoor ? 1 : 0`
  - 169 ||: `this.weather === 'pioggia' || this.weather === 'temporale'`
  - 170 ?:falso: `wet ? k * (this.weather === 'temporale' ? 1 : 0.6) : 0`
  - 170 ?:vero: `this.weather === 'temporale' ? 1 : 0.6`
  - 176 ?:falso: `wet ? this.amount * (0.25 + 0.75 * this.outdoor) : 0`
  - 179 ?:vero: `windy && k > 0.05 ? Math.ceil(k * 3) : 0`
  - 179 &&: `windy && k > 0.05`
  - 180 &&: `windy && k > 0.05`
  - 181 ?:vero: `this.weather === 'cenere' ? 0x3a3434 : this.biome.id === 'wasteland' ?`
  - 181 ?:vero: `this.biome.id === 'wasteland' ? 0x8a7560 : 0xb0b8c0`
  - 183 ?:vero: `this.weather === 'nebbia' ? k : wet ? k * 0.3 : 0`
  - 183 ?:falso: `wet ? k * 0.3 : 0`
  - 185 ?:vero: `windy ? 0.25 : 0.03`
  - 188 then: `if (this.weather === 'temporale' && k > 0.5 && time >= this.nextBoltAt`
  - 187 &&: `this.weather === 'temporale' && k > 0.5 && time >= this.nextBoltAt`
  - 187 &&: `this.weather === 'temporale' && k > 0.5`
  - 213 then: `if (p < 0.08) {`
  - 217 else: `if (p < 0.5) {`
  - 218 then: `if (p < 0.6) {`
  - 223 else: `if (p < 0.6) {`
  - 219 ?:vero: `t < 0.5 ? 0x7a3a10 : 0x1a1440`
  - 219 ?:falso: `t < 0.5 ? 0x7a3a10 : 0x1a1440`
  - 228 then: `if (this.biome.indoor) {`
  - 240 ||: `this.weather === 'pioggia' || this.weather === 'temporale'`
  - 241 ?:vero: `this.weather === 'temporale' ? 1 : 0.6`

### src/engine/BossVoice.ts
- funzioni mai chiamate (10): constructor:29, (callback di bus.on):35, onAct:47, (callback di this.offs.push):55, say:59, event:65, update:69, speak:77, stop:98, (callback di this.offs.forEach):101

### src/engine/ChapterCompletion.ts
- funzioni mai chiamate (9): (callback di expectCollectible):66, (callback di expectCollectible):83, countsFor:94, hasCompletionData:110, chapterCompletion:138, buildChapterSummary:169, (callback di input.lines.map):185, buildFinalSummary:236, (callback di input.lines.map):250
- rami mai presi (5):
  - 54 then: `if (prev) {`
  - 55 then: `if (prev.kind !== kind || prev.levelId !== levelId) {`
  - 54 ||: `prev.kind !== kind || prev.levelId !== levelId`
  - 56 then: `if (import.meta.env.DEV) console.warn(msg);`
  - 57 else: `if (import.meta.env.DEV) console.warn(msg);`

### src/engine/DecorationManager.ts
- rami mai presi (2):
  - 25 ??: `grid[r]?.[c] ?? '.'`
  - 26 ??: `grid[r]?.[c] ?? '#'`

### src/engine/FlashbackManager.ts
- funzioni mai chiamate (182): play:58, syncFrame:131, onShutdown:146, clearDressing:163, later:187, (callback di scene.time.delayedCall):188, (callback di later):203, (callback di later):220, (callback di later):224, cutTo:238, (callback di later):245, onUpdate:260, (callback di later):282, (callback di later):283, showCap:290, (callback di scene.time.delayedCall):293, (callback di later):302, (callback di later):304, finish:320, (callback di scene.time.delayedCall):353, (callback di scene.time.delayedCall):356, skip:397, (callback di scene.time.delayedCall):402, (callback di cap.addEventListener):405, restoreGlobals:410, fresh:433, put:438, after:445, (callback di scene.time.delayedCall):446, loop:451, callback:454, clearScope:460, ensureTextures:473, actor:491, (callback di this.loop):522, enter:534, (callback di this.after):539, puff:546, (callback di this.after):553, motes:558, mist:573, (callback di this.loop):579, vortex:594, onUpdate:609, warp:620, onComplete:638, onComplete:644, room:653, (callback di this.loop):661, night:671, foley:683, gestureSound:689, F:690, (callback di F):693, (callback di F):693, (callback di F):693, (callback di F):694, (callback di F):695, (callback di F):698, (callback di F):698, (callback di F):698, (callback di F):699, (callback di F):700, (callback di F):703, (callback di F):703, (callback di F):704, (callback di F):704, (callback di F):705, (callback di F):705, (callback di F):708, (callback di F):708, (callback di F):709, (callback di F):710, (callback di F):710, (callback di F):713, (callback di F):713, (callback di F):714, (callback di F):714, (callback di F):715, (callback di F):715, (callback di F):718, (callback di F):718, (callback di F):719, (callback di F):719, (callback di F):720, (callback di F):723, (callback di F):723, (callback di F):723, (callback di F):724, (callback di F):724, (callback di F):725, (callback di F):725, (callback di F):728, (callback di F):728, (callback di F):729, (callback di F):729, (callback di F):730, (callback di F):733, (callback di F):733, (callback di F):734, (callback di F):734, (callback di F):735, (callback di F):738, (callback di F):738, (callback di F):739, (callback di F):739, (callback di F):740, (callback di F):740, (callback di F):743, (callback di F):743, (callback di F):744, (callback di F):745, (callback di F):745, (anonima):766, (anonima):780, (callback di mgr['after']):788, (anonima):791, (callback di mgr['after']):800, (anonima):812, (anonima):827, (callback di mgr['after']):837, onComplete:840, (anonima):849, (callback di mgr['after']):858, (anonima):868, (callback di shelfY.forEach):871, (callback di cols.forEach):876, (anonima):895, (callback di mgr['after']):907, (callback di mgr['after']):914, (anonima):920, (callback di mgr['after']):930, (anonima):937, (callback di mgr['after']):948, (anonima):957, (callback di mgr['after']):963, (callback di mgr['after']):968, (anonima):976, (callback di mgr['after']):979, (anonima):997, (callback di mgr['loop']):1005, (anonima):1012, (callback di mgr['after']):1018, (callback di mgr['after']):1019, (callback di mgr['after']):1023, (anonima):1029, (callback di mgr['after']):1038, (anonima):1045, (callback di mgr['loop']):1051, (anonima):1058, (callback di mgr['after']):1068, (callback di mgr['after']):1073, (anonima):1078, (callback di mgr['after']):1087, (anonima):1098, (callback di mgr['loop']):1110, (callback di mgr['loop']):1122, (anonima):1127, (callback di mgr['after']):1135, (anonima):1145, (callback di mgr['after']):1153, (anonima):1168, (anonima):1183, (anonima):1197, (callback di mgr['after']):1201, (callback di mgr['after']):1213, (anonima):1223, (callback di mgr['loop']):1233, (anonima):1250, (callback di mgr['after']):1259, (anonima):1264, (callback di mgr['after']):1275, (anonima):1287, (anonima):1301, (callback di mgr['after']):1315, (callback di mgr['after']):1316, (anonima):1326, (anonima):1341, (anonima):1357, (callback di mgr['after']):1362, (anonima):1371, (callback di mgr['after']):1384

### src/engine/FolkManager.ts
- funzioni mai chiamate (16): onInteract:59, setSuspended:82, (anonima):135, converse:141, pick:142, (callback di pick(w.kind.talks).map):143, (callback di FOLK_AFTER.filter):144, say:153, (callback di this.folk.some):200, (callback di threats.some):214, (callback di threats.find):218, (callback di chat.forEach):257, (callback di this.scene.time.delayedCall):259, (callback di this.nav.edges(w.seg).filter):274, inHome:292, destroy:344
- rami mai presi (66):
  - 96 ??: `FOLK[opts.biomeId] ?? FOLK.crater`
  - 114 ?:falso: `opts.layout ? Math.max(8, Math.min(30, Math.round(opts.layout.rooms.le`
  - 187 ?:vero: `w.mode === 'flee' ? 70 : 110`
  - 193 ?:vero: `w.mode === 'flee' ? 80 : 140`
  - 198 then: `if (w.bubble) {`
  - 200 &&: `o !== w && o.bubble && o.bubble.text.visible && o.bubble.until < w.bub`
  - 200 &&: `o !== w && o.bubble && o.bubble.text.visible && o.bubble.until < w.bub`
  - 200 &&: `o !== w && o.bubble && o.bubble.text.visible && o.bubble.until < w.bub`
  - 200 &&: `o !== w && o.bubble && o.bubble.text.visible`
  - 200 &&: `o !== w && o.bubble`
  - 201 ?:vero: `below ? 22 : 0`
  - 201 ?:falso: `below ? 22 : 0`
  - 202 then: `if (left <= 0) w.bubble.text.setVisible(false);`
  - 203 else: `if (left <= 0) w.bubble.text.setVisible(false);`
  - 203 then: `if (left < 400) w.bubble.text.setAlpha(left / 400);`
  - 214 &&: `Math.abs(t.x - w.x) < 190 && Math.abs(t.y - w.feet) < 120`
  - 216 &&: `bossFight && dP < 700`
  - 218 then: `if (danger && w.mode !== 'flee') {`
  - 217 &&: `danger && w.mode !== 'flee'`
  - 218 ??: `threats.find((t) => Math.abs(t.x - w.x) < 190)?.x ?? px`
  - 221 ?:vero: `w.x < from ? -1 : 1`
  - 221 ?:falso: `w.x < from ? -1 : 1`
  - 223 then: `if (w.partner) {`
  - 226 then: `if (Math.random() < 0.7) this.say(w, FOLK_PANIC[Math.floor(Math.random`
  - 230 then: `if (w.mode === 'flee') {`
  - 230 then: `if (now < w.until) return;`
  - 236 then: `if (dP < 90 && now >= w.nextBarkAt && w.mode !== 'chat') {`
  - 235 &&: `dP < 90 && now >= w.nextBarkAt && w.mode !== 'chat'`
  - 235 &&: `dP < 90 && now >= w.nextBarkAt`
  - 239 ?:vero: `px < w.x ? -1 : 1`
  - 239 ?:falso: `px < w.x ? -1 : 1`
  - 240 ?:vero: `toneFor(state.save.levelId).folk === 'quieto' && Math.random() < 0.6 ?`
  - 241 ?:falso: `toneFor(state.save.levelId).folk === 'quieto' && Math.random() < 0.6 ?`
  - 240 &&: `toneFor(state.save.levelId).folk === 'quieto' && Math.random() < 0.6`
  - 241 ?:vero: `state.save.doomsday > 0.45 && Math.random() < 0.4 ? FOLK_PEDRO : w.kin`
  - 241 ?:falso: `state.save.doomsday > 0.45 && Math.random() < 0.4 ? FOLK_PEDRO : w.kin`
  - 241 &&: `state.save.doomsday > 0.45 && Math.random() < 0.4`
  - 248 &&: `o !== w && !o.partner && o.mode !== 'flee' && o.mode !== 'air' && Math`
  - 250 then: `if (mate && !w.partner && roll < 0.35) {`
  - 249 &&: `mate && !w.partner && roll < 0.35`
  - 249 &&: `mate && !w.partner`
  - 254 ?:vero: `mate.x > w.x ? 1 : -1`
  - 254 ?:falso: `mate.x > w.x ? 1 : -1`
  - 264 then: `if (w.partner) {`
  - 272 else: `if (roll < 0.55) {`
  - 274 then: `if (roll < 0.75) {`
  - 286 else: `if (roll < 0.75) {`
  - 274 &&: `e.need <= 110 && this.inHome(w, e.to)`
  - 277 then: `if (e) {`
  - 288 then: `if (Math.random() < 0.4) w.facing = (-w.facing) as 1 | -1;`
  - 301 then: `if (w.mode === 'air' && w.air) {`
  - 300 &&: `w.mode === 'air' && w.air`
  - 307 then: `if (y >= land && a.t > 0.1) {`
  - 313 else: `if (y >= land && a.t > 0.1) {`
  - 306 &&: `y >= land && a.t > 0.1`
  - 321 ?:vero: `w.mode === 'flee' ? 3.2 : 1`
  - 322 ?:vero: `w.mode === 'flee' ? (w.facing > 0 ? hi : lo) : w.targetX`
  - 322 ?:vero: `w.facing > 0 ? hi : lo`
  - 322 ?:falso: `w.facing > 0 ? hi : lo`
  - 326 then: `if (w.mode === 'walk' && w.edge) {`
  - 329 ?:vero: `e.kind === 'jump' ? e.vx : Math.sign(e.vx) * 70`
  - 329 ?:falso: `e.kind === 'jump' ? e.vx : Math.sign(e.vx) * 70`
  - 329 ?:vero: `e.kind === 'jump' ? e.vy : 0`
  - 329 ?:falso: `e.kind === 'jump' ? e.vy : 0`
  - 330 ?:vero: `e.vx >= 0 ? 1 : -1`
  - 330 ?:falso: `e.vx >= 0 ? 1 : -1`

### src/engine/HazardManager.ts
- funzioni mai chiamate (10): landOn:164, (callback di this.slabs.find):165, contiguous:178, (callback di this.slabs.some):180, canLand:185, (callback di this.slabs.find):187, (callback di this.scene.time.delayedCall):267, (callback di this.scene.time.delayedCall):321, draw:333, destroy:389
- rami mai presi (29):
  - 143 &&: `d.axis === 'v' && d.y >= a.r && d.y <= a.r + 2 && d.x <= g1 && d.x + d`
  - 257 then: `if (s.state === 1) {`
  - 258 then: `if (now >= s.at + SHAKE_MS) {`
  - 268 else: `if (now >= s.at + SHAKE_MS) {`
  - 262 then: `if (Math.abs(s.x - player.x) < 700) sfx.crumble();`
  - 269 then: `if (now >= s.at) {`
  - 273 then: `if (s.state === 2 && now >= s.at + GONE_MS) {`
  - 271 &&: `s.state === 2 && now >= s.at + GONE_MS`
  - 274 then: `if (b && b.x < s.x + TILE / 2 && b.right > s.x - TILE / 2 && b.y < s.y`
  - 274 &&: `b && b.x < s.x + TILE / 2 && b.right > s.x - TILE / 2 && b.y < s.y + S`
  - 274 &&: `b && b.x < s.x + TILE / 2 && b.right > s.x - TILE / 2 && b.y < s.y + S`
  - 274 &&: `b && b.x < s.x + TILE / 2 && b.right > s.x - TILE / 2`
  - 274 &&: `b && b.x < s.x + TILE / 2`
  - 287 &&: `Math.abs(f.cx - player.x) < 1800 && Math.abs(f.cy - player.y) < 1200`
  - 291 then: `if (warn && !f.warned && near) {`
  - 290 &&: `warn && !f.warned && near`
  - 290 &&: `warn && !f.warned`
  - 304 then: `if (time - f.lastDraw >= 50) {`
  - 308 &&: `player.x > R.x * TILE && player.x < (R.x + R.w) * TILE && player.y > R`
  - 308 &&: `player.x > R.x * TILE && player.x < (R.x + R.w) * TILE && player.y > R`
  - 308 &&: `player.x > R.x * TILE && player.x < (R.x + R.w) * TILE`
  - 310 then: `if (inRoom && player.y + 10 > level) {`
  - 309 &&: `inRoom && player.y + 10 > level`
  - 315 then: `if (!!inside !== this.wasIn) {`
  - 317 then: `if (inside) {`
  - 326 &&: `!!inside && headUnder`
  - 328 then: `if (inside?.toxic && headUnder && now >= this.nextBite) {`
  - 327 &&: `inside?.toxic && headUnder && now >= this.nextBite`
  - 327 &&: `inside?.toxic && headUnder`

### src/engine/LevelLoader.ts
- rami mai presi (2):
  - 66 ??: `rows[r][c] ?? '.'`
  - 101 then: `if (ch === '~') {`

### src/engine/LightingManager.ts
- funzioni mai chiamate (4): torch:64, remove:109, (callback di this.anims.findIndex):111, (callback di this.tracked.filter):118
- rami mai presi (2):
  - 136 then: `if (!target.active) {`
  - 138 then: `if (light.intensity <= 0) {`

### src/engine/NucleusStraightening.ts
- funzioni mai chiamate (24): transitionFor:33, orderLine:43, constructor:67, update:73, shatter:97, onComplete:127, destroy:134, nextPreview:157, fallbackLine:167, cancelPreview:173, say:178, redraw:189, applyPhase:209, orderShake:237, selectWalls:242, (callback di this.ctx.arenaDoorRects.some):254, paintGrid:265, fireOrderRow:285, (callback di this.ctx.scene.time.delayedCal):288, (callback di [0, 1, 3, 5].map):299, (callback di this.ctx.scene.time.delayedCal):305, back33Single:314, onComplete:324, platformEdges:328

### src/engine/OmbraBrain.ts
- funzioni mai chiamate (24): constructor:56, (callback di bus.on):65, (callback di ctx.scene.time.delayedCall):70, observeLive:77, update:93, counter:112, (callback di this.after):125, (callback di this.after):132, (callback di this.after):141, (callback di this.after):151, (callback di this.after):158, (callback di this.after):167, after:180, (callback di this.scene.time.delayedCall):181, edge:188, ghost:201, (callback di this.scene.time.delayedCall):209, reticle:213, aimLine:223, glyphs:232, recOff:244, keep:253, (callback di this.scene.time.delayedCall):255, stop:260

### src/engine/OmbraProfile.ts
- funzioni mai chiamate (3): sanitizeOmbraProfile:37, (callback di Object.values(counts).reduce):49, strongestHabit:117
- rami mai presi (3):
  - 76 case: `case 'heal-start':`
  - 79 case: `case 'heal':`
  - 88 default: `default:`

### src/engine/ParallaxManager.ts
- funzioni mai chiamate (1): onResize:37
- rami mai presi (1):
  - 51 ?:vero: `zone === 'red' || zone === 'orange' || zone === 'cyan' ? 'background2'`

### src/engine/PedroApparition.ts
- funzioni mai chiamate (16): (callback di this.scene.time.delayedCall):88, appear:93, (callback di this.later):103, (callback di this.later):105, (callback di this.later):106, (callback di this.later):107, sayNext:110, vanish:118, (callback di this.timers.forEach):122, (callback di this.scene.time.delayedCall):126, onComplete:132, onComplete:136, later:140, (callback di this.scene.time.delayedCall):141, destroy:146, (callback di this.timers.forEach):147
- rami mai presi (10):
  - 79 &&: `Math.abs(dx) < TRIGGER_R && Math.abs(dy) < 220`
  - 84 ?:vero: `Math.random() > 0.86 ? (Math.random() - 0.5) * 10 : 0`
  - 84 ?:falso: `Math.random() > 0.86 ? (Math.random() - 0.5) * 10 : 0`
  - 85 ?:vero: `Math.random() > 0.9 ? (Math.random() - 0.5) * 6 : 0`
  - 85 ?:falso: `Math.random() > 0.9 ? (Math.random() - 0.5) * 6 : 0`
  - 87 then: `if (Math.random() > 0.97) {`
  - 87 ?:vero: `Math.random() > 0.5 ? 0x22d3ee : 0xf87171`
  - 87 ?:falso: `Math.random() > 0.5 ? 0x22d3ee : 0xf87171`
  - 88 &&: `sp.active && sp.clearTint()`
  - 90 then: `if (Math.hypot(dx, dy) < TOO_CLOSE) this.vanish(true);`

### src/engine/QuestManager.ts
- funzioni mai chiamate (23): (callback di expectCollectible):62, (callback di expectCollectible):65, (callback di this.person):81, (callback di spots.filter):85, (callback di this.person):86, thing:124, (callback di this.scene.physics.add.overlap):148, set:159, lines:164, (callback di texts.map):165, talkGiver:168, (callback di this.talk):171, onPick:175, talkRecipient:197, complete:207, (callback di this.talk):208, respawnThing:228, (callback di this.placed.find):229, (callback di this.spots.find):231, (callback di this.spots.filter):232, (callback di this.spots.filter):233, onKill:238, placedThings:271
- rami mai presi (11):
  - 71 ??: `layout.seals ?? []`
  - 79 ?:falso: `early.length ? early : quiet.length ? quiet : spots`
  - 79 ?:vero: `quiet.length ? quiet : spots`
  - 79 ?:falso: `quiet.length ? quiet : spots`
  - 85 ?:falso: `far.length ? far : spots.filter((s) => s.room !== g.room)`
  - 262 else: `if (!st) g.setText('!').setColor('#facc15').setVisible(true);`
  - 262 then: `if (st.s === 'fatta') g.setVisible(false);`
  - 263 else: `if (st.s === 'fatta') g.setVisible(false);`
  - 263 then: `if (st.s === 'pronta' && p.def.kind !== 'consegna') g.setText('?').set`
  - 264 else: `if (st.s === 'pronta' && p.def.kind !== 'consegna') g.setText('?').set`
  - 263 &&: `st.s === 'pronta' && p.def.kind !== 'consegna'`

### src/engine/RegionGuide.ts
- funzioni mai chiamate (4): roomAt:35, doorPoint:45, route:57, nextPoint:85
- rami mai presi (5):
  - 25 then: `if (d.kind === 'drop') {`
  - 25 ?:vero: `A.rect.y < B.rect.y ? A : B`
  - 25 ?:falso: `A.rect.y < B.rect.y ? A : B`
  - 26 ?:vero: `top === A ? B : A`
  - 26 ?:falso: `top === A ? B : A`

### src/engine/RoomBackdrops.ts
- rami mai presi (1):
  - 26 ?:vero: `room.sy === 0 ? 0.62 : 0.96`

### src/engine/StagingManager.ts
- funzioni mai chiamate (1): glowDot:80
- rami mai presi (42):
  - 52 then: `if (Math.hypot(player.x - px, player.y - py) < 320) {`
  - 65 ?:vero: `a.pathIndex >= 0 ? a.pathIndex : (layout.rooms[a.anchor]?.pathIndex ??`
  - 65 ??: `layout.rooms[a.anchor]?.pathIndex ?? 0`
  - 66 ?:vero: `b.pathIndex >= 0 ? b.pathIndex : (layout.rooms[b.anchor]?.pathIndex ??`
  - 66 ??: `layout.rooms[b.anchor]?.pathIndex ?? 0`
  - 69 ??: `sorted[Math.floor(sorted.length / 2)] ?? sorted[0]`
  - 115 case: `case 'buried':`
  - 122 case: `case 'repaint':`
  - 124 ciclo: `for (let i = 0; i < 12; i++) {`
  - 126 then: `if (i === 8) g.lineBetween(px - 50, y, px + 44, y + 5);`
  - 127 else: `if (i === 8) g.lineBetween(px - 50, y, px + 44, y + 5);`
  - 133 case: `case 'shoes':`
  - 139 case: `case 'still':`
  - 144 case: `case 'table':`
  - 151 case: `case 'glow':`
  - 159 case: `case 'ledger':`
  - 159 ciclo: `for (let i = 0; i < 5; i++) this.prop(px - 60 + i * 30, py, 20, 34, i `
  - 159 ?:vero: `i === 3 ? 0xef4444 : color`
  - 159 ?:falso: `i === 3 ? 0xef4444 : color`
  - 163 case: `case 'exam':`
  - 167 ciclo: `for (let i = 0; i < 5; i++) g.lineBetween(px - 24, py - 44 + i * 5, px`
  - 173 case: `case 'thought':`
  - 175 ciclo: `for (let i = 0; i < 4; i++) this.prop(px - 60 + i * 26, py + 10, 16, 1`
  - 181 case: `case 'board':`
  - 184 ciclo: `for (let i = 0; i < 6; i++) this.glowDot(px - 40 + i * 16, py - 40, 0x`
  - 189 case: `case 'wall':`
  - 189 ciclo: `for (let i = 0; i < 5; i++) this.prop(px - 56 + i * 28, py - 20, 24, 1`
  - 189 ?:vero: `i === 2 ? 0.95 : 0.35`
  - 189 ?:falso: `i === 2 ? 0.95 : 0.35`
  - 190 then: `if (true) this.glowDot(px, py - 32, color);`
  - 194 case: `case 'cellar':`
  - 200 case: `case 'backup':`
  - 203 ciclo: `for (let i = 0; i < 8; i++) {`
  - 204 ?:vero: `i === 5 ? py - 34 : py - 26`
  - 204 ?:falso: `i === 5 ? py - 34 : py - 26`
  - 210 case: `case 'drift':`
  - 211 ciclo: `for (let i = 0; i < 3; i++) {`
  - 218 case: `case 'log':`
  - 222 ciclo: `for (let i = 0; i < 11; i++) g.lineBetween(px - 44 + i * 8, py - 16, p`
  - 227 case: `case 'mixer':`
  - 236 case: `case 'keys':`
  - 247 default: `default:`

### src/engine/StoryManager.ts
- funzioni mai chiamate (16): (callback di expectCollectible):51, forget:112, read:118, (callback di state.save.collectedLore.filte):122, onInteract:133, onInteract:149, (callback di Array.from):155, (callback di Array.from({ length: TOTAL_PAG):155, (callback di this.hooks.dialogue):156, (callback di this.scene.time.delayedCall):160, (callback di this.hooks.dialogue):166, spawnThought:173, onInteract:180, (callback di this.hooks.dialogue):181, (callback di this.hooks.choice):185, destroy:217
- rami mai presi (14):
  - 47 ??: `REGION_NOTES[regionId] ?? []`
  - 51 then: `if (regionId === 'mente') {`
  - 51 ||: `state.hasFlag('pensiero-cancellato') || state.hasFlag('pensiero-portat`
  - 67 ?:vero: `room.pathIndex >= 0 ? room.pathIndex : layout.rooms.find((o) => o.id =`
  - 67 ??: `layout.rooms.find((o) => o.id === room.anchor)?.pathIndex ?? 0`
  - 69 ??: `layout.seals ?? []`
  - 95 ??: `claim(secrets.length ? secrets : side, 0.6) ?? claim(pathRooms, 0.7)`
  - 95 ?:falso: `secrets.length ? secrets : side`
  - 101 then: `if (regionId === 'mente') {`
  - 101 ??: `claim(side, 0.95) ?? claim(pathRooms, 0.9)`
  - 102 then: `if (at) this.spawnThought(at.x, at.y);`
  - 105 ??: `REGION_NOTES[regionId] ?? []`
  - 107 ??: `claim(side, (i + 0.5) / notes.length) ?? claim(pathRooms, (i + 0.5) / `
  - 130 ?:vero: `state.save.collectedLore.includes(id) ? 0.5 : 1`

### src/engine/TerrainRenderer.ts
- funzioni mai chiamate (6): (callback di scene.events.once):165, straightenFakeWalls:585, releaseStraightenedWalls:595, regionsFor:604, removeTexture:623, destroy:629
- rami mai presi (11):
  - 88 ??: `out.get(key(e.bx, e.by)) ?? []`
  - 99 ??: `cands.find((j) => edges[j].bx - edges[j].ax === rx && edges[j].by - ed`
  - 113 ||: `Math.hypot(dx, dy) || 1`
  - 123 case: `case 'mud':`
  - 128 case: `case 'crystal':`
  - 133 default: `default:`
  - 236 then: `if (cx < vx0 - KEEP || cx > vx1 + KEEP || cy < vy0 - KEEP || cy > vy1 `
  - 237 then: `if (chunk.key) this.removeTexture(chunk.key);`
  - 263 ??: `this.dressByChunk.get(k) ?? []`
  - 280 then: `if (inside && !reg.revealed) {`
  - 279 &&: `inside && !reg.revealed`

### src/engine/TimeTrial.ts
- funzioni mai chiamate (7): flag:46, onInteract:72, offer:75, onPick:83, start:89, win:135, stop:153
- rami mai presi (4):
  - 119 then: `if (player.dead) {`
  - 123 then: `if (Math.abs(player.x - r.to.x) < 90 && Math.abs(player.y - r.to.y) < `
  - 122 &&: `Math.abs(player.x - r.to.x) < 90 && Math.abs(player.y - r.to.y) < 100`
  - 129 then: `if (left <= 0) {`

### src/engine/TrapManager.ts
- funzioni mai chiamate (5): suppress:173, slam:258, (callback di this.scene.time.delayedCall):271, drawRod:275, destroy:338
- rami mai presi (42):
  - 137 then: `if (kind === 'pressa') {`
  - 137 then: `if (seg.c1 - seg.c0 < 7) return false;`
  - 142 ciclo: `for (let k = 2; k <= 7; k++) {`
  - 143 then: `if (this.nav.solid(c, seg.r - k) && this.nav.solid(c + 1, seg.r - k)) `
  - 142 &&: `this.nav.solid(c, seg.r - k) && this.nav.solid(c + 1, seg.r - k)`
  - 146 then: `if (this.nav.solid(c, seg.r - k) !== this.nav.solid(c + 1, seg.r - k))`
  - 148 then: `if (top < 0 || seg.r - top + 1 < 3) return false;`
  - 148 ||: `top < 0 || seg.r - top + 1 < 3`
  - 150 then: `if (!clear(x, floorY)) return false;`
  - 190 ||: `Math.abs(t.x - player.x) > 1300 || Math.abs(t.y - player.y) > 900`
  - 192 then: `if (t.kind === 'sega') {`
  - 193 then: `if (t.x > t.b) { t.x = t.b; t.dir = -1; }`
  - 194 then: `if (t.x < t.a) { t.x = t.a; t.dir = 1; }`
  - 200 then: `if ((nx - t.x) ** 2 + (ny - t.y) ** 2 < (SAW_R - 2) ** 2) player.hurt(`
  - 206 then: `if (t.kind === 'pressa') {`
  - 209 then: `if (p < wait) bottom = t.a;`
  - 210 else: `if (p < wait) bottom = t.a;`
  - 211 then: `if (p < wait + 450) {`
  - 213 else: `if (p < wait + 450) {`
  - 214 then: `if (p < wait + 560) {`
  - 216 else: `if (p < wait + 560) {`
  - 217 then: `if (p < wait + 1060) {`
  - 224 else: `if (p < wait + 1060) {`
  - 220 then: `if (t.state === 0) {`
  - 227 then: `if (p < wait) {`
  - 233 then: `if (deadly && px1 > t.x - PRESS_W / 2 + 4 && px0 < t.x + PRESS_W / 2 -`
  - 233 &&: `deadly && px1 > t.x - PRESS_W / 2 + 4 && px0 < t.x + PRESS_W / 2 - 4 &`
  - 233 &&: `deadly && px1 > t.x - PRESS_W / 2 + 4 && px0 < t.x + PRESS_W / 2 - 4 &`
  - 233 &&: `deadly && px1 > t.x - PRESS_W / 2 + 4 && px0 < t.x + PRESS_W / 2 - 4`
  - 233 &&: `deadly && px1 > t.x - PRESS_W / 2 + 4`
  - 240 then: `if (time < t.suppressedUntil) continue;`
  - 243 then: `if (p >= warn && p < warn + 600) {`
  - 245 else: `if (p >= warn && p < warn + 600) {`
  - 242 &&: `p >= warn && p < warn + 600`
  - 244 ciclo: `for (let k = 0; k < 3; k++) g.fillCircle(t.x + Math.sin(p * 0.01 + k *`
  - 246 then: `if (p >= warn + 600 && p < warn + 1800) {`
  - 245 &&: `p >= warn + 600 && p < warn + 1800`
  - 252 ciclo: `for (let i = 0; i < 6; i++) g.fillCircle(t.x + Math.sin(p * 0.02 + i) `
  - 253 then: `if (px1 > t.x - 9 && px0 < t.x + 9 && py1 > top && py0 < t.b) player.h`
  - 253 &&: `px1 > t.x - 9 && px0 < t.x + 9 && py1 > top && py0 < t.b`
  - 253 &&: `px1 > t.x - 9 && px0 < t.x + 9 && py1 > top`
  - 253 &&: `px1 > t.x - 9 && px0 < t.x + 9`

### src/engine/TrentatreMarks.ts
- funzioni mai chiamate (7): (callback di this.scene.time.delayedCall):87, destroy:106, extinguishWalls:115, (callback di this.extinguished.some):118, (callback di m.walls.some):119, restoreExtinguished:126, (callback di this.scene.time.delayedCall):135
- rami mai presi (4):
  - 80 then: `if (broken) {`
  - 84 ?:vero: `inside ? 0.25 : 0.75`
  - 86 then: `if (!state.hasFlag('seme-33-visto') && Math.abs(player.x - m.img.x) < `
  - 85 &&: `!state.hasFlag('seme-33-visto') && Math.abs(player.x - m.img.x) < SEEN`

### src/engine/WaterRenderer.ts
- funzioni mai chiamate (6): (callback di scene.events.once):20, merge:55, (callback di row.sort):64, (callback di runs.sort):75, (callback di pools.find):78, ensureTextures:85
- rami mai presi (2):
  - 30 ciclo: `for (const pool of this.merge(cells)) {`
  - 51 ciclo: `for (const p of this.pools) p.surface.tilePositionX = time * p.speed;`

### src/engine/art/blocks.ts
- rami mai presi (8):
  - 53 case: `case 'glass': {`
  - 54 ciclo: `for (let i = 0; i < 4; i++) {`
  - 56 ?:vero: `b.spikes === 'crystal' ? hex(mix(b.rock, b.accent, 0.55)) : hex(0xb8d8`
  - 56 ?:falso: `b.spikes === 'crystal' ? hex(mix(b.rock, b.accent, 0.55)) : hex(0xb8d8`
  - 64 case: `case 'glitch': {`
  - 65 ciclo: `for (let i = 0; i < 4; i++) {`
  - 67 ?:vero: `i % 2 ? b.accent : 0xff3df0`
  - 67 ?:falso: `i % 2 ? b.accent : 0xff3df0`

### src/engine/art/creatureKit.ts
- rami mai presi (8):
  - 116 ||: `Math.hypot(b.x - a.x, b.y - a.y) || 1`
  - 126 ||: `Math.hypot(end.x - prev.x, end.y - prev.y) || 1`
  - 130 ||: `Math.hypot(nx2.x - st.x, nx2.y - st.y) || 1`
  - 186 ??: `o.hatch ?? 0.5`
  - 186 ??: `o.hatch ?? 0.5`
  - 487 ??: `(tex.customData as { creatureFrames?: number }).creatureFrames ?? 1`
  - 493 ??: `(tex.customData as { creatureRes?: number }).creatureRes ?? 1`
  - 505 ??: `d.creatureRes ?? 1`

### src/engine/art/creatures/bossKit.ts
- rami mai presi (1):
  - 16 ??: `o.mouth ?? 'flat'`

### src/engine/art/dressing.ts
- funzioni mai chiamate (11): crystals:90, reeds:127, books:147, ash:170, glitch:179, sand:191, bottles:208, pickGlass:231, chains:285, webs:374, (callback di Array.from):379
- rami mai presi (11):
  - 35 case: `case 'reeds':`
  - 428 case: `case 'crystals': return 70;`
  - 430 case: `case 'reeds': return 45;`
  - 431 case: `case 'books': return 90;`
  - 432 case: `case 'ash': return 50;`
  - 433 case: `case 'glitch': return 110;`
  - 434 case: `case 'sand': return 55;`
  - 435 case: `case 'bottles': return 120;`
  - 439 case: `case 'chains': return 190;`
  - 440 case: `case 'vines': return 70;`
  - 442 case: `case 'webs': return 260;`

### src/engine/art/folk.ts
- rami mai presi (13):
  - 118 case: `case 'cuoco': {`
  - 124 case: `case 'nonna': {`
  - 131 case: `case 'raver': {`
  - 132 ciclo: `for (let i = 0; i < 4; i++) p.shape([{ x: w.hx - 6 + i * 4, y: w.hy - `
  - 132 ?:vero: `i % 2 ? 0xdb2777 : 0x7c3aed`
  - 132 ?:falso: `i % 2 ? 0xdb2777 : 0x7c3aed`
  - 139 case: `case 'pescatore': {`
  - 149 case: `case 'ombra': {`
  - 150 ciclo: `for (let i = 0; i < 6; i++) p.flat(p.ellipse(cx + Math.sin(i + t * TAU`
  - 156 case: `case 'tecnico': {`
  - 165 case: `case 'maranza': {`
  - 174 case: `case 'chierico': {`
  - 185 case: `case 'ubriaco': {`

### src/engine/art/materials.ts
- funzioni mai chiamate (25): brick:117, (callback di Array.from):124, (callback di Array.from):125, (callback di wrapped):126, roots:141, (callback di Array.from):158, (callback di wrapped):159, (callback di cv.map):172, (callback di pts.map):183, metal:189, (callback di wrapped):198, crystal:229, at:240, (callback di wrapped):252, (callback di [t.a, t.b, t.c].map):255, (callback di poly.map):264, (callback di poly.map):264, circuit:275, (callback di wrapped):289, (callback di t.map):291, mud:307, (callback di Array.from):311, (callback di Array.from):312, (callback di wrapped):313, voidStone:378

### src/engine/art/normalFlip.ts
- rami mai presi (3):
  - 27 ??: `s.scaleX ?? 1`
  - 28 ??: `s.scaleY ?? 1`
  - 42 ??: `this.__flip ?? 0`

### src/engine/art/props.ts
- funzioni mai chiamate (21): paint:208, paint:229, paint:248, paint:267, paint:288, paint:323, paint:346, paint:359, paint:433, paint:458, (callback di pts.map):466, paint:486, paint:502, paint:520, paint:537, paint:565, cone:568, paint:586, paint:612, bar:615, paint:634

### src/engine/art/silhouettes.ts
- funzioni mai chiamate (13): crystalSpire:140, chimney:222, tank:239, gothicTower:257, shelf:275, serverTower:293, vault:319, floating:344, monolith:360, stalagmite:375, skyscraper:383, swampTree:401, hut:433
- rami mai presi (17):
  - 579 case: `case 'chains': {`
  - 580 then: `if (dir < 0) {`
  - 585 ciclo: `for (let i = 0; i < n; i++) {`
  - 589 ciclo: `for (let y = 0; y < len; y += 16) {`
  - 597 case: `case 'pillars': {`
  - 600 then: `if (dir > 0) {`
  - 612 else: `if (dir > 0) {`
  - 623 ciclo: `for (let k = 0; k < 4; k++) {`
  - 631 case: `case 'pipes': {`
  - 633 then: `if (dir < 0) {`
  - 636 else: `if (dir < 0) {`
  - 660 case: `case 'crystals': {`
  - 662 ciclo: `for (let i = 0; i < n; i++) {`
  - 675 case: `case 'reeds': {`
  - 675 then: `if (dir > 0) break;`
  - 678 ciclo: `for (let i = 0; i < n; i++) {`
  - 683 then: `if (rnd() > 0.5) {`

### src/engine/audio/Soundscape.ts
- funzioni mai chiamate (4): (callback di bus.on):89, (callback di bus.on):90, (callback di scene.events.once):92, (callback di this.offs.forEach):93
- rami mai presi (27):
  - 83 ??: `SOUNDS[biome.id] ?? SOUNDS.crater`
  - 112 then: `if (this.hp === 1 && !p.dead && time >= this.nextBeatAt) {`
  - 111 &&: `this.hp === 1 && !p.dead && time >= this.nextBeatAt`
  - 111 &&: `this.hp === 1 && !p.dead`
  - 113 ?:vero: `input.boss ? 0.7 : 1`
  - 113 ?:falso: `input.boss ? 0.7 : 1`
  - 152 ?:falso: `room ? !room.surface : !!this.biome.indoor`
  - 153 ?:falso: `this.horizonRow !== null ? Math.max(0, Math.min(1, (r0 - this.horizonR`
  - 153 ?:vero: `inRock ? 0.5 : 0`
  - 153 ?:falso: `inRock ? 0.5 : 0`
  - 155 ?:vero: `inRock ? 1 : ceiling && enclosure > 0.7 ? 0.45 : 0`
  - 161 then: `if (u > 0.5) {`
  - 162 then: `if (space === 'cave' && size > 0.55) space = 'cavern';`
  - 162 &&: `space === 'cave' && size > 0.55`
  - 163 then: `if (space === 'room' && size > 0.6) space = 'library';`
  - 163 &&: `space === 'room' && size > 0.6`
  - 169 then: `if (input.boss && room?.kind === 'arena') space = this.sound.under ===`
  - 169 &&: `input.boss && room?.kind === 'arena'`
  - 169 ?:vero: `this.sound.under === 'void' ? 'void' : 'arena'`
  - 169 ?:falso: `this.sound.under === 'void' ? 'void' : 'arena'`
  - 172 ?:vero: `this.biome.indoor ? 0.75 : 1`
  - 177 ?:vero: `u > 0.5 ? size : size * 0.5`
  - 181 ?:vero: `this.hp === 1 ? 1 : 0`
  - 197 ?:vero: `input.boss ? 0.35 : 1`
  - 197 ?:vero: `underwater ? 0.4 : 1`
  - 198 ??: `beds[b] ?? 0`
  - 203 ?:vero: `this.underground > 0.5 ? this.sound.below : this.sound.surface`

### src/engine/audio/acoustics.ts
- funzioni mai chiamate (6): setPaused:232, setDuck:239, swell:294, (callback di window.setTimeout):304, meter:316, rms:327
- rami mai presi (14):
  - 107 catch: `catch {`
  - 250 ?:vero: `T.underwater ? 'water' : T.space`
  - 255 ?:vero: `T.boss ? 0.35 : 1`
  - 256 ?:vero: `T.underwater ? 420 : 20000`
  - 257 ?:vero: `this.paused ? 800 : 20000`
  - 260 ?:vero: `order >= 3 ? 2800 : order === 2 ? 4500 : order === 1 ? 8000 : 20000`
  - 260 ?:vero: `order === 2 ? 4500 : order === 1 ? 8000 : 20000`
  - 260 ?:vero: `order === 1 ? 8000 : 20000`
  - 263 ?:vero: `T.underwater ? 900 : T.muffle > 0.5 ? 11000 : 20000`
  - 263 ?:vero: `T.muffle > 0.5 ? 11000 : 20000`
  - 280 ?:vero: `T.boss ? 0.45 : 1`
  - 280 ?:vero: `this.paused ? 0.5 : 1`
  - 284 ??: `T.echoMul ?? 1`
  - 288 ?:vero: `T.boss ? 0.3 : 1`

### src/engine/events.ts
- funzioni mai chiamate (1): (anonima):61

### src/engine/fx/MemoryPipeline.ts
- funzioni mai chiamate (2): constructor:44, onPreRender:48

### src/engine/fx/VortexPipeline.ts
- funzioni mai chiamate (3): constructor:40, onPreRender:44, hexToTint:52

### src/engine/input/Input.ts
- funzioni mai chiamate (4): destroy:107, btn:147, (callback di pad.buttons.map):164, (callback di [12, 13, 14, 15].some):185
- rami mai presi (24):
  - 42 ??: `this.curr.get(a) ?? false`
  - 54 then: `if (padEdge) {`
  - 70 ??: `this.curr.get(a) ?? false`
  - 74 ??: `this.curr.get(a) ?? false`
  - 145 then: `if (typeof map === 'string') {`
  - 145 ??: `pad.axes[0] ?? 0`
  - 146 ??: `pad.axes[1] ?? 0`
  - 149 case: `case 'stick-left': return ax < -STICK_DEAD || btn(14);`
  - 149 ||: `ax < -STICK_DEAD || btn(14)`
  - 150 case: `case 'stick-right': return ax > STICK_DEAD || btn(15);`
  - 150 ||: `ax > STICK_DEAD || btn(15)`
  - 151 case: `case 'stick-up': return ay < -STICK_DEAD || btn(12);`
  - 151 ||: `ay < -STICK_DEAD || btn(12)`
  - 152 case: `case 'stick-down': return ay > STICK_DEAD || btn(13);`
  - 152 ||: `ay > STICK_DEAD || btn(13)`
  - 156 ciclo: `for (const i of map) {`
  - 156 then: `if (pad.buttons[i]?.pressed) return true;`
  - 171 ciclo: `for (let i = 0; i < now.length; i++) {`
  - 172 then: `if (now[i] && !this.prevPadButtons[i]) {`
  - 171 &&: `now[i] && !this.prevPadButtons[i]`
  - 183 ??: `pad.axes[0] ?? 0`
  - 184 ??: `pad.axes[1] ?? 0`
  - 186 &&: `ax && ay && !dpad`
  - 186 &&: `ax && ay`

### src/engine/input/actions.ts
- funzioni mai chiamate (1): keyNameForCode:149
- rami mai presi (22):
  - 107 ?:vero: `controls?.preset === 'frecce' ? 'frecce' : 'classico'`
  - 114 case: `case 'SPACE': return ['Space'];`
  - 115 case: `case 'SHIFT': return ['ShiftLeft', 'ShiftRight'];`
  - 117 case: `case 'ESC': return ['Escape'];`
  - 118 case: `case 'ENTER': return ['Enter'];`
  - 119 case: `case 'LEFT': return ['ArrowLeft'];`
  - 120 case: `case 'RIGHT': return ['ArrowRight'];`
  - 121 case: `case 'UP': return ['ArrowUp'];`
  - 122 case: `case 'DOWN': return ['ArrowDown'];`
  - 123 case: `case 'MOUSE_LEFT': return [];`
  - 124 case: `case 'MOUSE_RIGHT': return [];`
  - 128 then: `if (/^[0-9]$/.test(name)) return ['Digit${name}'];`
  - 171 case: `case 'SPACE': return 'SPAZIO';`
  - 172 case: `case 'SHIFT': return 'SHIFT';`
  - 174 case: `case 'ESC': return 'ESC';`
  - 175 case: `case 'ENTER': return 'INVIO';`
  - 176 case: `case 'LEFT': return '←';`
  - 177 case: `case 'RIGHT': return '→';`
  - 178 case: `case 'UP': return '↑';`
  - 179 case: `case 'DOWN': return '↓';`
  - 180 case: `case 'MOUSE_LEFT': return 'CLIC';`
  - 181 case: `case 'MOUSE_RIGHT': return 'CLIC DX';`

### src/engine/input/keyText.ts
- funzioni mai chiamate (3): (callback di bus.on):8, currentDevice:12, padLabel:17

### src/engine/input/padBridge.ts
- funzioni mai chiamate (3): press:24, btn:59, (anonima):77
- rami mai presi (21):
  - 38 ?:falso: `navigator.getGamepads ? navigator.getGamepads() : []`
  - 41 then: `if (p?.connected) {`
  - 52 ciclo: `for (const [index, mapped] of Object.entries(BUTTON_KEY)) {`
  - 54 then: `if (down && !prevButtons[i]) press(mapped.code, mapped.key);`
  - 54 &&: `down && !prevButtons[i]`
  - 57 ??: `pad.axes[0] ?? 0`
  - 58 ??: `pad.axes[1] ?? 0`
  - 62 else: `if (btn(14) || ax < -DEAD) dir = 'ArrowLeft';`
  - 61 ||: `btn(14) || ax < -DEAD`
  - 62 then: `if (btn(15) || ax > DEAD) dir = 'ArrowRight';`
  - 63 else: `if (btn(15) || ax > DEAD) dir = 'ArrowRight';`
  - 62 ||: `btn(15) || ax > DEAD`
  - 63 then: `if (btn(12) || ay < -DEAD) dir = 'ArrowUp';`
  - 64 else: `if (btn(12) || ay < -DEAD) dir = 'ArrowUp';`
  - 63 ||: `btn(12) || ay < -DEAD`
  - 64 then: `if (btn(13) || ay > DEAD) dir = 'ArrowDown';`
  - 64 ||: `btn(13) || ay > DEAD`
  - 67 then: `if (dir) {`
  - 73 else: `if (dir) {`
  - 68 then: `if (dir !== lastDir || now - lastDirAt > REPEAT_MS) {`
  - 67 ||: `dir !== lastDir || now - lastDirAt > REPEAT_MS`

### src/engine/inventory.ts
- funzioni mai chiamate (5): emitVitals:11, pickSnack:17, (callback di order.find):19, eatProblem:23, completeEat:30

### src/engine/mechanics/BusDoors.ts
- funzioni mai chiamate (2): destroy:123, (callback di d.leaves.forEach):127
- rami mai presi (2):
  - 65 ?:vero: `this.ctx.trialRunning() ? 'open' : t < OPEN_MS ? 'open' : t < OPEN_MS `
  - 76 &&: `Math.abs(this.ctx.player.x - d.gap.x) < 700 && Math.abs(this.ctx.playe`

### src/engine/mechanics/Cameras.ts
- funzioni mai chiamate (14): constructor:52, (callback di gaps.map):59, (callback di ctx.nav.segments.filter):62, (callback di avoid.some):79, add:86, color:94, update:99, alarm:132, (callback di this.ctx.scene.time.delayedCal):135, (callback di this.ctx.scene.time.delayedCal):137, (callback di this.ctx.scene.time.delayedCal):150, darken:155, ensureTexture:166, destroy:185

### src/engine/mechanics/FloorFlow.ts
- funzioni mai chiamate (12): constructor:42, (callback di gaps.map):49, clear:50, (callback di avoid.every):50, (callback di ctx.nav.segments.filter):53, place:62, (callback di [x0, x1].map):74, update:79, nearest:112, ensureTextures:125, destroy:169, (callback di f.ends.forEach):173

### src/engine/mechanics/Snipers.ts
- funzioni mai chiamate (7): constructor:20, active:26, (callback di this.ctx.avoid.every):31, roomAt:34, (callback di L.rooms.find):38, update:41, destroy:80

### src/engine/mechanics/Tana.ts
- funzioni mai chiamate (20): constructor:44, (callback di bus.on):50, (callback di bus.on):51, (callback di ctx.layout.rooms):57, (callback di ranges.some):58, (callback di ctx.layout.rooms):59, placeIn:67, (callback di this.ctx.nav.segments.filter):68, (callback di avoid.some):78, removeInteract:84, (callback di this.ctx.addInteractable):86, update:98, tryHide:143, unhide:155, whisper:176, rumble:191, darken:202, ensureTextures:213, paint:216, destroy:244

### src/engine/mechanics/index.ts
- funzioni mai chiamate (6): constructor:13, (callback di pathGaps(ctx)):16, (callback di ctx.avoid.every):16, (callback di pathGaps(ctx)):17, (callback di [0.25, 0.55, 0.85].map):19, (callback di [...new Set(picks)].forEach):20
- rami mai presi (7):
  - 34 case: `case 'rio': return new FloorFlow(ctx, STREAM);`
  - 35 case: `case 'stabilimento': return new FloorFlow(ctx, BELT);`
  - 36 case: `case 'cantina': return new Cameras(ctx, CANTINA_CAMS);`
  - 37 case: `case 'sorveglianza': return new Cameras(ctx, SORVEGLIANZA_CAMS);`
  - 38 case: `case 'tecnokill': return new Snipers(ctx);`
  - 39 case: `case 'mente': return new MindDoors(ctx);`
  - 40 case: `case 'tana': return new Tana(ctx);`

### src/engine/mechanics/types.ts
- rami mai presi (2):
  - 81 ?:falso: `A.rect.x < B.rect.x ? A : B`
  - 82 ?:falso: `left === A ? B : A`

### src/engine/music.ts
- funzioni mai chiamate (15): (callback di bus.on):17, tapeStop:45, tick:50, setVolume:65, setGraveDuck:72, setLevelDuck:80, setOrder:88, playEnding:101, setRadio:111, nowPlaying:117, playBoss:121, playCustom:125, getBossTrack:178, (callback di playPromise.catch):280, (anonima):281
- rami mai presi (26):
  - 94 ?:vero: `this.graveDuck ? 0.3 : 1`
  - 94 ?:vero: `this.levelDuck ? 0.55 : 1`
  - 107 ?:vero: `state.save.radio ? 'assets/music/${state.save.radio}' : this.getLevelT`
  - 136 case: `case 'piazza':`
  - 138 case: `case 'galliate':`
  - 140 case: `case 'marcetti':`
  - 142 case: `case 'santuario':`
  - 144 case: `case 'tecnokill':`
  - 146 case: `case 'trenbolone':`
  - 148 case: `case 'tana':`
  - 150 case: `case 'rio':`
  - 152 case: `case 'stabilimento':`
  - 154 case: `case 'ruhra':`
  - 156 case: `case 'mente':`
  - 158 case: `case 'caso':`
  - 160 case: `case 'sorveglianza':`
  - 162 case: `case 'cantina':`
  - 164 case: `case 'ricordi':`
  - 166 case: `case 'void':`
  - 168 case: `case 'nucleo':`
  - 170 case: `case 'barrato':`
  - 172 case: `case 'custode':`
  - 174 default: `default:`
  - 251 then: `if (this.currentAudio && this.currentAudio.paused) {`
  - 258 then: `if (this.fadeInterval) {`
  - 263 then: `if (this.unlockListener) {`

### src/engine/nav/NavGraph.ts
- funzioni mai chiamate (14): open:77, hits:144, arc:158, edges:194, (callback di out.some):230, path:261, h:265, sight:308, sightWide:320, flyPath:328, fits:332, blockOf:338, key:351, push:356
- rami mai presi (2):
  - 68 ??: `grid[r][c] ?? '.'`
  - 138 then: `if (this.solid(c, r)) return -1;`

### src/engine/playerSkin.ts
- funzioni mai chiamate (9): hueDist:54, rgbToHsl:59, hslToRgb:76, ch:84, boostFactor:106, simulateGameLight:170, applyOwnLightFalloff:185, skinFinalCss:206, renderSkinPreview:230
- rami mai presi (15):
  - 37 ??: `found ?? SKIN_PRESETS[0]!`
  - 121 ??: `preset.hue ?? SOURCE_SKIN_HUE`
  - 124 ciclo: `for (let i = 0; i < data.length; i += 4) {`
  - 125 then: `if (a < 10) continue;`
  - 130 then: `if (s < SAT_MIN || l < LIGHT_MIN || l > LIGHT_MAX) continue;`
  - 130 ||: `s < SAT_MIN || l < LIGHT_MIN || l > LIGHT_MAX`
  - 130 ||: `s < SAT_MIN || l < LIGHT_MIN`
  - 131 then: `if (hueDist(h, SOURCE_SKIN_HUE) > HUE_WINDOW) continue;`
  - 135 ??: `preset.satMul ?? 1`
  - 136 ??: `preset.lightAdd ?? 0`
  - 261 ??: `(src as { width?: number }).width ?? 0`
  - 262 ??: `(src as { height?: number }).height ?? 0`
  - 300 ?:falso: `isValidSkinId(skinId) ? skinId : DEFAULT_SKIN_ID`
  - 315 catch: `catch {`
  - 323 catch: `catch {`

### src/engine/score.ts
- funzioni mai chiamate (10): chapterParts:18, sumParts:31, (callback di parts.reduce):31, runAssisted:41, runScore:46, (callback di Object.values(state.save.runSc):48, loadBoard:61, (callback di list.filter):65, pushBoard:72, (callback di [...loadBoard(), entry].sort):73

### src/engine/sfx.ts
- funzioni mai chiamate (70): (callback di document.addEventListener):82, setVolume:92, doubleJump:163, hit:169, hurt:173, die:177, barra:185, heal:191, eat:193, shoot:202, shootEco:204, shootFull:209, chargeStep:215, mirrorBirth:220, mirrorSwap:226, chalk:231, analisiTick:233, qed:235, (callback di [261.6, 329.6, 392, 523.3].for):236, crt:240, perfectDing:245, bottleThrow:250, bottleCrack:252, bossRoar:256, ui:260, menuMove:262, menuSelect:267, menuBack:274, clang:283, fuse:287, (callback di [0, 160, 320, 480].forEach):287, shriek:288, crack:289, graveTick:292, splash:301, rumble:303, thunder:306, death:312, bossVoice:377, (callback di [880, 1320, 990].forEach):389, (callback di [0, 140, 280].forEach):393, (callback di [261.6, 329.6, 392, 523.3].for):400, drip:503, beep:516, cricket:522, whisper:539, bubble:545, chime:550, horn:556, squeak:561, creak:571, buzz:576, pebble:581, growlFar:585, heartbeat:589, gate:594, straighten:600, orderLock:605, orderBreak:610, stopBeds:632, (callback di stops.push):663, (callback di stops.push):666, (callback di stops.push):684, (callback di stops.push):687, stop:732, (callback di stops.forEach):732, startPad:758, (callback di [baseFreq, baseFreq * 1.5, bas):761, stopPad:775, (callback di this.padNodes.forEach):778
- rami mai presi (18):
  - 113 ??: `opts.type ?? 'square'`
  - 116 ??: `opts.vol ?? 0.12`
  - 141 ??: `opts.freq ?? 1800`
  - 143 ??: `opts.q ?? 1`
  - 145 ??: `opts.vol ?? 0.18`
  - 457 case: `case 'brick':`
  - 461 case: `case 'metal':`
  - 466 case: `case 'crystal':`
  - 470 case: `case 'mud':`
  - 474 case: `case 'roots':`
  - 478 case: `case 'circuit':`
  - 482 case: `case 'void':`
  - 486 case: `case 'water':`
  - 701 case: `case 'hum':`
  - 705 case: `case 'servers':`
  - 713 case: `case 'void':`
  - 717 case: `case 'crystal':`
  - 725 case: `case 'fire':`

### src/engine/state.ts
- funzioni mai chiamate (23): (callback di this.save.flags.filter):109, (callback di this.save.abilities.filter):114, (callback di Object.values(this.save.runSco):125, (callback di Object.values(this.save.scores):126, risonanteDamage:175, damageMult:179, persistSettings:222, reset:226, unlockAbility:257, addItem:270, removeItem:285, hasCharm:294, giveCharm:298, usedNotches:304, (callback di this.save.equipped.reduce):305, isEquipped:308, toggleCharm:313, (callback di this.save.equipped.filter):316, removeFlag:350, recordOmbraSighting:364, tickDoomsday:371, relieveDoomsday:384, setDoomsday:391
- rami mai presi (32):
  - 95 then: `if (raw) {`
  - 97 ??: `parsed.record ?? {}`
  - 97 ??: `parsed.explored ?? {}`
  - 99 then: `if (typeof this.save.barre !== 'number' || isNaN(this.save.barre)) {`
  - 98 ||: `typeof this.save.barre !== 'number' || isNaN(this.save.barre)`
  - 103 ciclo: `for (const [id, value] of Object.entries(LEGACY_ITEMS)) {`
  - 103 ??: `this.save.inventory?.[id] ?? 0`
  - 104 then: `if (n > 0) this.save.barre += n * value;`
  - 105 then: `if (this.save.inventory) delete this.save.inventory[id];`
  - 109 then: `if (this.save.flags.includes('lochef-libero')) {`
  - 110 then: `if (!this.save.flags.includes('lochef-arrestato')) this.save.flags.pus`
  - 114 then: `if ((this.save.abilities as string[]).includes('rigenerazione')) {`
  - 118 then: `if (parsed.collassoMode !== undefined && this.save.doomsdayMode === fa`
  - 117 &&: `parsed.collassoMode !== undefined && this.save.doomsdayMode === false`
  - 121 then: `if (parsed.collasso !== undefined && this.save.doomsday === 0) {`
  - 120 &&: `parsed.collasso !== undefined && this.save.doomsday === 0`
  - 126 ||: `Object.values(this.save.runScores ?? {}).some((v) => v > 500) ||`
  - 125 ??: `this.save.runScores ?? {}`
  - 126 ??: `this.save.scores ?? {}`
  - 128 then: `if (oldScale) {`
  - 136 then: `if (!isValidSkinId((parsed as { skin?: unknown }).skin)) {`
  - 139 then: `if (this.hasFlag('tommasorveglianza') && !this.save.ombra.premium) {`
  - 138 &&: `this.hasFlag('tommasorveglianza') && !this.save.ombra.premium`
  - 145 then: `if (s) {`
  - 147 ?:vero: `parsed.controls?.preset === 'frecce' ? 'frecce' : 'classico'`
  - 147 ?:falso: `parsed.controls?.preset === 'frecce' ? 'frecce' : 'classico'`
  - 148 ?:vero: `parsed.controls?.custom && typeof parsed.controls.custom === 'object' `
  - 148 ?:falso: `parsed.controls?.custom && typeof parsed.controls.custom === 'object' `
  - 148 &&: `parsed.controls?.custom && typeof parsed.controls.custom === 'object'`
  - 162 ?:vero: `this.run.patto ? 2 : 1`
  - 172 ?:vero: `this.run.patto ? 2 : 1`
  - 239 then: `if (this.godMode) {`

### src/entities/Boss.ts
- funzioni mai chiamate (61): engage:96, (callback di this.scene.time.delayedCall):105, (callback di this.scene.time.delayedCall):112, empower:133, guard:141, guarding:146, strike:151, canStrike:159, delayAttack:164, release:169, (callback di this.scene.time.delayedCall):207, execute:314, dive:341, (callback di this.scene.time.delayedCall):352, (callback di this.scene.time.delayedCall):355, (callback di this.scene.time.delayedCall):361, charge:371, (callback di this.scene.time.delayedCall):382, (callback di this.scene.time.delayedCall):386, (callback di this.scene.time.delayedCall):394, onComplete:398, radial:403, rain:413, burst:423, (callback di this.scene.time.delayedCall):426, teleport:435, onComplete:444, onComplete:454, lamette:465, spiral:474, (callback di this.scene.time.delayedCall):479, cross:492, (callback di this.scene.time.delayedCall):502, snipe:506, (callback di this.scene.time.delayedCall):518, slam:535, (callback di this.scene.time.delayedCall):545, (callback di this.scene.time.delayedCall):548, onComplete:555, (callback di this.scene.time.delayedCall):567, onComplete:572, mines:581, (callback di this.scene.time.delayedCall):592, shot:600, anticipate:607, (callback di this.scene.time.delayedCall):611, dust:618, (callback di this.scene.time.delayedCall):627, ringShock:632, onComplete:639, builtinImpact:644, afterimage:650, onComplete:655, takeDamage:659, (callback di this.scene.time.delayedCall):681, (callback di this.scene.time.delayedCall):700, (callback di this.scene.time.delayedCall):704, die:709, (callback di scene.time.delayedCall):722, (callback di scene.time.delayedCall):734, destroy:752
- rami mai presi (64):
  - 55 ??: `this.def.startsInvulnerable ?? false`
  - 67 ?:vero: `big < 70 ? 2.1 : big < 100 ? 1.75 : 1.45`
  - 67 ?:vero: `big < 100 ? 1.75 : 1.45`
  - 92 then: `if (this.hp > this.maxHp * 0.33) return 2;`
  - 179 ??: `this.def.move ?? 'hover'`
  - 184 then: `if (state.hasFlag('ivan')) {`
  - 189 then: `if (this.engaged) {`
  - 199 then: `if (this.def.glitchy) {`
  - 199 then: `if (this.scaleX !== this.baseScale) this.setScale(this.baseScale);`
  - 202 ?:vero: `Math.random() > 0.85 ? (Math.random() - 0.5) * 8 * this.res : 0`
  - 202 ?:falso: `Math.random() > 0.85 ? (Math.random() - 0.5) * 8 * this.res : 0`
  - 203 ?:vero: `Math.random() > 0.9 ? (Math.random() - 0.5) * 6 * this.res : 0`
  - 203 ?:falso: `Math.random() > 0.9 ? (Math.random() - 0.5) * 6 * this.res : 0`
  - 206 then: `if (Math.random() > 0.985) {`
  - 206 ?:vero: `Math.random() > 0.5 ? 0x22d3ee : 0xf87171`
  - 206 ?:falso: `Math.random() > 0.5 ? 0x22d3ee : 0xf87171`
  - 207 &&: `this.active && !this.busy && this.clearTint()`
  - 207 &&: `this.active && !this.busy`
  - 214 ?:vero: `this.def.move === 'turret' ? 0.012 : 0.03`
  - 220 then: `if (this.engaged && !this.busy) {`
  - 219 &&: `this.engaged && !this.busy`
  - 221 then: `if ((this.def.glitchy || this.def.move === 'orbit') && Math.random() >`
  - 221 &&: `(this.def.glitchy || this.def.move === 'orbit') && Math.random() > 0.9`
  - 221 ||: `this.def.glitchy || this.def.move === 'orbit'`
  - 223 then: `if (spd > 420 && this.t - (this.lastDustAt ?? 0) > 320) {`
  - 222 &&: `spd > 420 && this.t - (this.lastDustAt ?? 0) > 320`
  - 222 ??: `this.lastDustAt ?? 0`
  - 230 ||: `!this.engaged || this.busy`
  - 234 then: `if (this.frenzy && player.active) {`
  - 236 else: `if (this.frenzy && player.active) {`
  - 233 &&: `this.frenzy && player.active`
  - 237 then: `if (this.chase && player.active) {`
  - 239 else: `if (this.chase && player.active) {`
  - 236 &&: `this.chase && player.active`
  - 240 then: `if (player.active) {`
  - 240 ?:vero: `phase === 3 ? 1.6 : 1`
  - 240 ?:falso: `phase === 3 ? 1.6 : 1`
  - 244 case: `case 'stalk':`
  - 249 case: `case 'strafe':`
  - 254 case: `case 'turret':`
  - 257 case: `case 'erratic':`
  - 258 then: `if (!this.nextHopAt || now > this.nextHopAt) {`
  - 257 ||: `!this.nextHopAt || now > this.nextHopAt`
  - 263 then: `if (this.hopX !== undefined) {`
  - 264 ??: `this.hopY ?? this.anchorY`
  - 270 case: `case 'orbit':`
  - 278 default: `default:`
  - 282 then: `if (phase === 3 && (move === 'stalk' || move === 'orbit')) {`
  - 281 &&: `phase === 3 && (move === 'stalk' || move === 'orbit')`
  - 281 ||: `move === 'stalk' || move === 'orbit'`
  - 292 then: `if (now < this.nextAttackAt) return;`
  - 295 then: `if (this.def.kind === 'guggu' && !state.hasFlag('ivan')) {`
  - 294 &&: `this.def.kind === 'guggu' && !state.hasFlag('ivan')`
  - 297 then: `if (this.frenzy) cd = 500;`
  - 301 ??: `this.summonOverride ?? this.def.summonKind`
  - 303 then: `if (summonKind && phase >= 2 && this.summonedAtPhase < phase) {`
  - 302 &&: `summonKind && phase >= 2 && this.summonedAtPhase < phase`
  - 302 &&: `summonKind && phase >= 2`
  - 310 ?:vero: `this.frenzy ? 3 : phase`
  - 310 ?:falso: `this.frenzy ? 3 : phase`
  - 311 ?:vero: `this.frenzy ? 3 : phase`
  - 311 ?:falso: `this.frenzy ? 3 : phase`
  - 743 ?:vero: `this.engaged ? 0.8 + this.phase * 0.35 : 0.6`
  - 748 ?:vero: `this.engaged ? 0.85 + Math.sin(this.animT / (420 - this.phase * 90)) *`

### src/entities/Companion.ts
- funzioni mai chiamate (14): constructor:29, (callback di this.on):59, grounded:65, attackDamage:70, update:75, afterMove:149, tryAttack:156, consumeSwing:177, updateAnimation:181, updateHitbox:199, slashVisual:211, onComplete:221, kill:225, onComplete:238

### src/entities/Enemy.ts
- funzioni mai chiamate (29): blocks:162, ground:183, hideMark:210, alertFrom:215, (callback di this.scene.time.delayedCall):313, drop:318, explode:330, wake:337, chase:382, goTo:408, clampToSeg:436, stepToward:471, flyTo:501, chargerAttack:544, (callback di this.scene.time.delayedCall):561, flee:572, takeDamage:584, (callback di this.scene.time.delayedCall):594, die:603, (callback di this.scene.time.delayedCall):622, destroy:641, justFired:654, isCharging:660, staggered:664, stagger:669, onComplete:674, (callback di this.scene.time.delayedCall):675, hunt:679, stun:684
- rami mai presi (57):
  - 88 ?:vero: `base.fireRateMs ? base.fireRateMs * 0.7 : undefined`
  - 192 else: `if (mode === 'sleep') this.showMark('z z', '#94a3b8');`
  - 192 then: `if (mode === 'alert') this.showMark('!', '#facc15');`
  - 193 else: `if (mode === 'alert') this.showMark('!', '#facc15');`
  - 193 then: `if (mode === 'flee') this.showMark('!!', '#f87171');`
  - 236 then: `if (this.hanging) {`
  - 236 then: `if (Math.abs(dx) < 70 && dy > 0 && dy < 420 && (!this.nav || this.nav.`
  - 236 &&: `Math.abs(dx) < 70 && dy > 0 && dy < 420 && (!this.nav || this.nav.sigh`
  - 236 &&: `Math.abs(dx) < 70 && dy > 0 && dy < 420`
  - 236 &&: `Math.abs(dx) < 70 && dy > 0`
  - 236 ||: `!this.nav || this.nav.sight(this.x, this.y + 10, target.x, target.y - `
  - 240 then: `if (this.fuseAt) {`
  - 241 ?:vero: `Math.floor(now / 90) % 2 ? 0xffffff : 0xef4444`
  - 241 ?:falso: `Math.floor(now / 90) % 2 ? 0xffffff : 0xef4444`
  - 242 then: `if (now >= this.fuseAt) this.explode();`
  - 246 then: `if (this.trait === 'kamikaze' && this.mode === 'chase' && dist < 80) {`
  - 245 &&: `this.trait === 'kamikaze' && this.mode === 'chase' && dist < 80`
  - 245 &&: `this.trait === 'kamikaze' && this.mode === 'chase'`
  - 252 then: `if (now < this.stunnedUntil) {`
  - 256 &&: `dist < this.arch.aggroRange && (!this.nav || this.nav.sight(this.x, th`
  - 256 ||: `!this.nav || this.nav.sight(this.x, this.y - 6, target.x, target.y - 1`
  - 257 then: `if (sees) this.lastSeenAt = now;`
  - 263 &&: `sees && dist < this.arch.aggroRange * 0.45`
  - 267 then: `if (sees) {`
  - 274 case: `case 'alert':`
  - 276 then: `if (now >= this.modeUntil) this.setMode('chase');`
  - 279 case: `case 'chase': {`
  - 283 then: `if (!relentless && (lostFor > (this.elite ? 9000 : 4500) || leash > (t`
  - 282 &&: `!relentless && (lostFor > (this.elite ? 9000 : 4500) || leash > (this.`
  - 282 ||: `lostFor > (this.elite ? 9000 : 4500) || leash > (this.elite ? 2600 : 1`
  - 282 ?:vero: `this.elite ? 9000 : 4500`
  - 282 ?:falso: `this.elite ? 9000 : 4500`
  - 282 ?:vero: `this.elite ? 2600 : 1500`
  - 282 ?:falso: `this.elite ? 2600 : 1500`
  - 287 then: `if (SKITTISH.has(this.arch.kind) && this.hp <= Math.max(1, this.arch.h`
  - 286 &&: `SKITTISH.has(this.arch.kind) && this.hp <= Math.max(1, this.arch.hp * `
  - 286 &&: `SKITTISH.has(this.arch.kind) && this.hp <= Math.max(1, this.arch.hp * `
  - 294 case: `case 'return':`
  - 295 then: `if (sees) {`
  - 298 then: `if (this.goTo(body, this.homeX, this.homeY, now, this.arch.speed * 0.8`
  - 301 case: `case 'flee':`
  - 302 then: `if (now >= this.modeUntil) this.setMode(sees ? 'chase' : 'patrol');`
  - 302 ?:vero: `sees ? 'chase' : 'patrol'`
  - 302 ?:falso: `sees ? 'chase' : 'patrol'`
  - 308 then: `if (this.arch.fireRateMs && sees && this.mode === 'chase' && now >= th`
  - 307 &&: `this.arch.fireRateMs && sees && this.mode === 'chase' && now >= this.n`
  - 307 &&: `this.arch.fireRateMs && sees && this.mode === 'chase'`
  - 307 &&: `this.arch.fireRateMs && sees`
  - 312 then: `if (this.arch.behavior === 'turret') {`
  - 313 &&: `this.active && this.clearTint()`
  - 348 then: `if (b === 'turret') {`
  - 352 then: `if (b === 'flyer') {`
  - 355 ?:falso: `this.nav ? this.nav.segments[this.nav.segmentBelow(this.x, body.bottom`
  - 366 then: `if (b === 'hopper') {`
  - 367 then: `if (this.ground && now >= this.nextActionAt) {`
  - 366 &&: `this.ground && now >= this.nextActionAt`
  - 371 then: `if (this.ground) body.setVelocityX(body.velocity.x * 0.85);`

### src/entities/Player.ts
- funzioni mai chiamate (26): isGrounded:130, grantInvuln:151, startEat:156, cancelEat:172, movePressed:189, still:195, (callback di this.scene.time.delayedCall):240, (callback di this.scene.time.delayedCall):290, (callback di this.scene.time.delayedCall):306, (callback di this.scene.time.delayedCall):366, onComplete:378, (callback di this.scene.time.delayedCall):384, (callback di this.scene.time.delayedCall):512, attackDamage:613, cancelCharge:619, tryAnalisi:629, tryAcqua:642, fireRisonante:657, spendFlow:740, onAttackHit:752, hurt:768, kill:792, stun:806, wake:815, burst:887, (callback di this.scene.time.delayedCall):896
- rami mai presi (108):
  - 115 then: `if (!anims.exists(key)) {`
  - 139 ?:falso: `left <= 0 ? 0 : Math.min(1, left / total)`
  - 142 ?:vero: `this.riflessoSwapAvailable ? 0 : frac(this.riflessoReadyAt, COMBAT.rif`
  - 218 then: `if (this.hidden) {`
  - 224 then: `if (this.eating) {`
  - 225 then: `if (now >= this.eating.until) {`
  - 231 else: `if (now >= this.eating.until) {`
  - 234 then: `if (now >= this.eatCrumbsAt) {`
  - 248 then: `if (this.stunned) {`
  - 278 then: `if (!this.grounded && pressingWall && state.hasAbility('aggrappo') && `
  - 277 &&: `!this.grounded && pressingWall && state.hasAbility('aggrappo') && body`
  - 280 then: `if (body.velocity.y > PHYSICS.wallSlideSpeed) body.setVelocityY(PHYSIC`
  - 283 then: `if (now >= this.wallDustAt) {`
  - 298 then: `if (this.slamming && !this.grounded) {`
  - 298 then: `if (body.velocity.y < COMBAT.slamFall) body.setVelocityY(COMBAT.slamFa`
  - 300 then: `if (now >= this.slamDustAt) {`
  - 313 then: `if (now < this.wallLockUntil) {`
  - 324 ?:falso: `this.grounded ? 0.8 : 0.96`
  - 327 ?:vero: `this.submerged ? 0.6 : 1`
  - 331 then: `if (this.drift !== 0 && now >= this.wallLockUntil) {`
  - 329 &&: `this.drift !== 0 && now >= this.wallLockUntil`
  - 331 ?:vero: `left && !right ? -1 : right && !left ? 1 : 0`
  - 331 ?:falso: `left && !right ? -1 : right && !left ? 1 : 0`
  - 331 &&: `left && !right`
  - 331 ?:vero: `right && !left ? 1 : 0`
  - 331 ?:falso: `right && !left ? 1 : 0`
  - 331 &&: `right && !left`
  - 333 ?:vero: `this.grounded ? 0.2 : 0.07`
  - 333 ?:falso: `this.grounded ? 0.2 : 0.07`
  - 335 &&: `this.submerged && body.velocity.y > 300`
  - 348 else: `if (this.grounded || now < this.coyoteUntil) {`
  - 342 ||: `this.grounded || now < this.coyoteUntil`
  - 350 then: `if (now < this.wallUntil && this.wallSide !== 0) {`
  - 367 else: `if (now < this.wallUntil && this.wallSide !== 0) {`
  - 348 &&: `now < this.wallUntil && this.wallSide !== 0`
  - 362 ?:vero: `this.wallSide < 0 ? { min: -40, max: 40 } : { min: 140, max: 220 }`
  - 362 ?:falso: `this.wallSide < 0 ? { min: -40, max: 40 } : { min: 140, max: 220 }`
  - 368 then: `if (!this.airJumpUsed && state.hasAbility('rimbalzo')) {`
  - 367 &&: `!this.airJumpUsed && state.hasAbility('rimbalzo')`
  - 397 ?:vero: `upHeld ? 'up' : !this.grounded && downHeld ? 'down' : 'side'`
  - 402 then: `if (this.controls.pressed('wave')) {`
  - 405 then: `if (upHeld) {`
  - 407 else: `if (upHeld) {`
  - 408 then: `if (downHeld) {`
  - 410 else: `if (downHeld) {`
  - 412 then: `if (state.hasAbility('risonante') || state.hasAbility('analisi') || st`
  - 414 else: `if (state.hasAbility('risonante') || state.hasAbility('analisi') || st`
  - 410 ||: `state.hasAbility('risonante') || state.hasAbility('analisi') || state.`
  - 410 ||: `state.hasAbility('risonante') || state.hasAbility('analisi')`
  - 417 then: `if (this.waveArmedUntil !== 0) {`
  - 418 then: `if (now >= this.waveArmedUntil) {`
  - 419 else: `if (now >= this.waveArmedUntil) {`
  - 420 then: `if (this.controls.pressed('up')) {`
  - 424 else: `if (this.controls.pressed('up')) {`
  - 425 then: `if (this.controls.pressed('down')) {`
  - 431 then: `if (this.controls.released('wave')) this.waveConsumed = false;`
  - 435 then: `if (this.controls.pressed('eat')) {`
  - 436 then: `if (msg) bus.emit('toast', { text: msg });`
  - 441 then: `if (this.controls.pressed('riflesso') && state.hasAbility('riflesso'))`
  - 439 &&: `this.controls.pressed('riflesso') && state.hasAbility('riflesso')`
  - 443 then: `if (this.riflessoSwapAvailable && scene.cloneAlive) {`
  - 442 &&: `this.riflessoSwapAvailable && scene.cloneAlive`
  - 446 then: `if (now < this.riflessoReadyAt) return;`
  - 448 then: `if (this.spendFlow(COMBAT.riflessoCost * state.mods.abilityCost)) {`
  - 456 then: `if (this.controls.pressed('scudo') && state.hasAbility('scudo') && now`
  - 455 &&: `this.controls.pressed('scudo') && state.hasAbility('scudo') && now >= `
  - 455 &&: `this.controls.pressed('scudo') && state.hasAbility('scudo')`
  - 457 then: `if (this.spendFlow(COMBAT.scudoCost * state.mods.abilityCost)) {`
  - 471 ?:vero: `this.invulnerable && !this.dashing ? (Math.floor(now / 70) % 2 ? 0.35 `
  - 471 ?:vero: `Math.floor(now / 70) % 2 ? 0.35 : 0.9`
  - 471 ?:falso: `Math.floor(now / 70) % 2 ? 0.35 : 0.9`
  - 484 then: `if (state.run.trenbolone) {`
  - 484 then: `if (this.nextTrenDrain === 0) this.nextTrenDrain = now + COMBAT.trenbo`
  - 486 then: `if (now >= this.nextTrenDrain) {`
  - 488 then: `if (state.run.hp > 1) {`
  - 498 then: `if (state.run.smela) {`
  - 498 then: `if (this.nextSmelaStun === 0) this.nextSmelaStun = now + 5000;`
  - 500 then: `if (now >= this.nextSmelaStun) {`
  - 521 then: `if (regen > 0 && state.run.flow < state.maxFlow) {`
  - 520 &&: `regen > 0 && state.run.flow < state.maxFlow`
  - 558 ?:falso: `this.facing > 0 ? { min: 165, max: 195 } : { min: -15, max: 15 }`
  - 570 ?:vero: `state.hasFlag('maschera-completa') ? 0.7 : 1`
  - 676 then: `if (this.waveConsumed) return;`
  - 678 then: `if (this.controls.down('wave') && !this.charging && state.run.flow >= `
  - 677 &&: `this.controls.down('wave') && !this.charging && state.run.flow >= ecoC`
  - 677 &&: `this.controls.down('wave') && !this.charging`
  - 693 then: `if (this.charging) {`
  - 697 then: `if (!this.chargeHit1 && held >= COMBAT.risonanteChargeMs) {`
  - 696 &&: `!this.chargeHit1 && held >= COMBAT.risonanteChargeMs`
  - 702 then: `if (!this.chargeHit2 && held >= COMBAT.risonanteFullChargeMs) {`
  - 701 &&: `!this.chargeHit2 && held >= COMBAT.risonanteFullChargeMs`
  - 709 then: `if (this.charging && this.controls.released('wave')) {`
  - 708 &&: `this.charging && this.controls.released('wave')`
  - 721 then: `if (held >= COMBAT.risonanteFullChargeMs && state.run.flow >= fullCost`
  - 723 else: `if (held >= COMBAT.risonanteFullChargeMs && state.run.flow >= fullCost`
  - 720 &&: `held >= COMBAT.risonanteFullChargeMs && state.run.flow >= fullCost`
  - 724 then: `if (held >= COMBAT.risonanteChargeMs && state.run.flow >= waveCost) {`
  - 726 else: `if (held >= COMBAT.risonanteChargeMs && state.run.flow >= waveCost) {`
  - 723 &&: `held >= COMBAT.risonanteChargeMs && state.run.flow >= waveCost`
  - 727 then: `if (state.run.flow < ecoCost) {`
  - 735 then: `if (!this.charging && this.chargeRing) {`
  - 734 &&: `!this.charging && this.chargeRing`
  - 845 then: `if (this.attackDir === 'up') {`
  - 861 ?:vero: `big ? FX.slashBig : FX.slash`
  - 862 ?:vero: `dir === 'up' ? -Math.PI / 2 : dir === 'down' ? Math.PI / 2 : this.faci`
  - 867 ?:vero: `big ? 1.3 : 1.15`
  - 868 ?:vero: `big ? 1.3 : 1.15`
  - 869 ?:vero: `big ? 180 : 140`

### src/entities/Spawner.ts
- funzioni mai chiamate (5): setArmed:108, takeDamage:129, (callback di this.scene.time.delayedCall):133, syncAura:142, destroy:146
- rami mai presi (4):
  - 35 ??: `ENEMIES[opts.kind]?.glowColor ?? 0xa855f7`
  - 36 ??: `opts.maxAlive ?? 3`
  - 37 ??: `opts.intervalMs ?? 3500`
  - 38 ??: `opts.radius ?? 600`

### src/scenes/GameScene.ts
- funzioni mai chiamate (428): cloneAlive:205, (callback di this.acquaPuddles.forEach):411, (callback di this.level.checkpoints.find):507, (callback di bus.on):514, onResume:515, (callback di this.events.once):520, (anonima):548, (anonima):559, dialogue:568, choice:569, forget:570, (callback di this.interactables.filter):571, (callback di this.physics.add.collider):623, (callback di this.physics.add.collider):624, spawnHunter:634, awakeEnemies:638, quizDoor:639, chaseRunning:641, chaseRanges:642, (callback di this.chaseStarts.map):642, addInteractable:643, (anonima):646, (callback di this.interactables.filter):647, (callback di bus.on):653, (callback di this.events.once):654, getClone:692, giveHeart:698, giveItem:699, giveBarre:700, giveNotch:701, fitVeil:711, (callback di this.events.once):715, wakeUp:737, (callback di this.time.delayedCall):743, (callback di this.time.delayedCall):745, (callback di expectCollectible):833, (callback di this.physics.add.overlap):851, dropBossCharm:866, recoverBossReward:873, (callback di fallback.filter):1000, (callback di this.time.delayedCall):1108, damageSpawner:1112, breakSpawner:1122, (callback di this.time.delayedCall):1134, parry:1144, (callback di this.time.delayedCall):1155, onEnemyExplode:1158, (callback di this.time.delayedCall):1166, (callback di this.time.delayedCall):1168, (callback di this.chaseStarts.sort):1183, (callback di this.chaseStarts.map):1184, (callback di this.chaseEnds.sort):1190, (callback di this.voidArenas.sort):1203, (callback di this.baruffoniArenas.sort):1210, onInteract:1220, onInteract:1232, onInteract:1244, onInteract:1269, spawnOspite12:1278, (callback di this.level.entities.find):1281, (callback di (layout.spots ?? []).filter):1284, interactNpc:1296, (callback di this.startDialogue):1303, (callback di this.startDialogue):1312, onPick:1317, (callback di this.startDialogue):1339, onPick:1343, (callback di this.startDialogue):1361, (callback di this.time.delayedCall):1366, (callback di this.startDialogue):1368, (callback di this.startDialogue):1381, (callback di this.startDialogue):1390, onPick:1398, (callback di this.startDialogue):1401, (callback di this.startDialogue):1409, onPick:1413, (callback di this.startDialogue):1418, (callback di this.startDialogue):1445, onPick:1449, (callback di this.startDialogue):1468, (callback di this.startDialogue):1491, (callback di this.interactables.filter):1496, onComplete:1500, (callback di this.startDialogue):1505, (callback di this.startDialogue):1508, (callback di this.startDialogue):1511, (callback di this.startDialogue):1514, (callback di this.startDialogue):1523, (callback di this.liveFragments.some):1528, spawnPiazzaGuests:1542, interactRomeroPiazza:1552, (callback di this.startDialogue):1557, onPick:1562, oracleLines:1572, say:1573, (callback di Object.keys(LEVELS).filter):1576, boardLines:1593, say:1594, (callback di QUESTS.filter):1595, (callback di QUESTS.filter):1596, (callback di QUESTS.filter):1602, (callback di fresh.map):1603, barRumors:1609, say:1610, (callback di state.save.collectedLore.filte):1617, (callback di state.save.flags.filter):1620, openPiazzaShop:1629, onPick:1636, pay:1637, interactPiema:1663, (callback di this.startDialogue):1672, spawnQuizDoor:1680, onInteract:1686, interactPorta:1690, (callback di t.options.map):1695, onPick:1696, (callback di this.interactables.filter):1710, (callback di this.time.delayedCall):1720, rewardSpot:1728, homeIn:1748, (callback di this.homing.filter):1754, (callback di this.physics.add.overlap):1780, (callback di this.liveFragments.filter):1782, (callback di this.time.delayedCall):1794, onInteract:1805, onInteract:1832, setPropsVisible:1837, openTravel:1855, (callback di Object.keys(LEVELS).filter):1863, (callback di Object.keys(LEVELS).filter):1863, (callback di state.save.stops):1865, (callback di state.save.stops):1869, (callback di state.save.stops):1870, (callback di state.save.stops):1871, (callback di all.filter):1872, onPick:1876, travelTo:1880, (callback di this.cameras.main.once):1892, (callback di this.physics.add.overlap):1929, (callback di this.physics.add.overlap):1947, (callback di this.physics.add.overlap):1968, maschereCount:1983, (callback di state.save.collectedLore.filte):1984, (callback di this.physics.add.overlap):1995, onInteract:2028, (callback di this.time.delayedCall):2046, onInteract:2052, onPick:2057, indiziRaccolti:2070, (callback di ['indizio-1', 'indizio-2', 'in):2071, interactIndizio:2074, (callback di this.startDialogue):2075, (callback di this.physics.add.collider):2095, (callback di this.physics.add.collider):2096, (callback di this.physics.add.collider):2106, (callback di this.physics.add.overlap):2110, (callback di this.physics.add.overlap):2123, (callback di this.physics.add.overlap):2146, (callback di this.physics.add.overlap):2157, (callback di this.physics.add.overlap):2174, (callback di this.physics.add.overlap):2195, (callback di this.physics.add.overlap):2229, (callback di this.physics.add.overlap):2240, (callback di this.physics.add.overlap):2245, (callback di this.physics.add.overlap):2247, (callback di this.physics.add.overlap):2259, (callback di this.physics.add.overlap):2271, (callback di this.physics.add.overlap):2274, (callback di this.events.once):2299, (anonima):2310, (anonima):2311, (anonima):2318, (callback di bus.on):2325, (callback di this.events.once):2328, (callback di bus.on):2330, (callback di this.events.once):2334, (anonima):2335, findFlatStage:2352, progressAt:2376, progressOfOldX:2387, openSpotNear:2392, open:2394, (callback di this.events.once):2428, (callback di this.liveFragments.some):2467, (callback di this.time.delayedCall):2489, (callback di this.time.delayedCall):2500, (callback di this.time.delayedCall):2504, (callback di this.time.delayedCall):2508, (callback di this.time.delayedCall):2512, (callback di this.time.delayedCall):2517, (callback di this.time.delayedCall):2521, baruffoniSeq:2530, setupBaruffoni:2534, (callback di seq.filter):2537, spawnBaruffoniBoss:2555, onBaruffoniDown:2571, (callback di this.startDialogue):2577, (callback di this.time.delayedCall):2582, onBaruffoniComplete:2587, walterReveal:2593, (callback di this.startDialogue):2596, (callback di this.interactables.filter):2599, onComplete:2620, interactWalterGuida:2640, nextRegret:2649, (callback di VOID_REGRETS.findIndex):2650, setupVoid:2654, (callback di this.time.delayedCall):2669, (callback di this.time.delayedCall):2675, spawnRegret:2681, onVeritaRivelata:2692, (callback di this.startDialogue):2693, (callback di this.time.delayedCall):2701, moveGuide:2724, interactGuida:2761, interactSfida33:2772, (callback di this.startDialogue):2773, onPick:2777, voidClimax:2796, (callback di this.startDialogue):2799, onComplete:2811, (callback di this.startDialogue):2812, (callback di this.startDialogue):2813, (callback di this.level.water.some):2887, (callback di this.startDialogue):2986, (callback di this.time.delayedCall):3007, destroyBreakableWall:3015, (callback di this.time.delayedCall):3027, killIvanCutscene:3095, onComplete:3114, onComplete:3127, (callback di this.startDialogue):3128, ivanStrike:3138, (callback di this.time.delayedCall):3146, onComplete:3156, onComplete:3164, (callback di this.time.delayedCall):3171, onComplete:3180, (callback di this.level.exits.some):3210, returnFromSecret:3263, (callback di this.time.delayedCall):3266, completeChapterAndGo:3278, onContinue:3318, gotoLevel:3336, (callback di this.cameras.main.once):3344, (callback di state.save.flags.filter):3372, finishChapter:3396, (callback di parts.filter):3415, (callback di parts.filter(([, v]) => v !== ):3415, liveChapterScore:3425, endGame:3437, (callback di Object.values(state.save.runSc):3464, onContinue:3503, npc:3533, doorRects:3653, lockArena:3674, unlockArena:3688, (callback di expectCollectible):3723, onInteract:3725, offerChallenge:3747, onPick:3757, updateChallenge:3766, (callback di ch.enemies.filter):3776, (callback di this.level.entities.filter):3783, (callback di this.level.entities.filter((e)):3783, (callback di (this.layout?.spots ?? []).fil):3785, winChallenge:3802, drawArenaBars:3817, prima:3867, (callback di this.startDialogue):3867, (callback di prima):3868, onPick:3875, (callback di this.startDialogue):3901, (callback di this.time.delayedCall):3906, (callback di this.barreGroup.getChildren().):3917, onRisonante:3949, (callback di this.time.delayedCall):3968, onRiflesso:3971, onComplete:3991, (callback di this.physics.add.overlap):4002, (callback di this.physics.add.overlap):4006, (callback di this.physics.add.overlap):4013, (callback di this.physics.add.overlap):4023, onRiflessoSwap:4034, onComplete:4066, killClone:4072, (callback di this.cloneColliders.forEach):4073, cloneHitFx:4082, (callback di this.time.delayedCall):4091, nearestHostile:4094, nearHostile:4111, onAnalisi:4143, (callback di FX.glyphs.map):4179, (callback di this.analisiGlyphs.forEach):4184, markAnalisiTargets:4225, qedAnalisi:4240, clearAnalisiFx:4262, (callback di this.analisiGlyphs.forEach):4269, onComplete:4276, onScudo:4282, clearScudoFx:4310, refundNote:4322, onComplete:4324, onAcquaTossica:4328, (callback di this.physics.add.collider):4342, (callback di this.physics.add.collider):4343, (callback di this.physics.add.overlap):4344, (callback di this.physics.add.overlap):4346, (callback di this.time.delayedCall):4348, burstBottle:4352, (callback di this.acquaBottles.filter):4357, onComplete:4371, spawnPuddle:4390, (callback di this.time.delayedCall):4428, applyPoison:4455, dmgTo:4471, onComplete:4517, reflectProjectile:4552, (callback di this.time.delayedCall):4584, (callback di this.chaseStarts.findIndex):4603, spawn:4610, onComplete:4665, onTanaSniffed:4748, (callback di this.startDialogue):4769, spawnColorDrop:4809, (callback di this.physics.add.overlap):4821, spawnMirror:4837, (callback di this.physics.add.overlap):4847, (callback di this.startDialogue):4850, (callback di this.level.water.some):4862, playSmelaPoisonEffect:4879, callback:4916, (callback di this.time.delayedCall):4923, (callback di spawned.forEach):4954, (callback di this.time.delayedCall):4956, (callback di this.startDialogue):4965, (callback di spawned.forEach):4967, onComplete:4976, (callback di spawned.forEach):4986, spawnNotinoAmbush:4995, startPatto:5013, (callback di this.time.delayedCall):5035, onComplete:5036, (callback di this.startDialogue):5038, arrivoDei:5072, (callback di this.startDialogue):5073, onSpikes:5089, (callback di this.time.delayedCall):5093, onEnemyShoot:5100, (callback di this.time.delayedCall):5132, (callback di this.time.delayedCall):5133, onBossLamette:5136, (callback di this.time.delayedCall):5148, (callback di this.time.delayedCall):5149, (callback di this.time.delayedCall):5155, onComplete:5157, popProjectile:5163, (callback di this.time.delayedCall):5173, onEnemyDied:5177, onEnemyAlert:5205, onBossSummon:5213, weakFeedback:5238, (callback di this.time.delayedCall):5246, onBossEngaged:5250, onInsight:5272, onOmbraInsight:5278, onComplete:5288, onBossDefeated:5309, (callback di this.startDialogue):5324, (callback di this.startDialogue):5357, (callback di this.startDialogue):5362, onPick:5371, (callback di this.startDialogue):5377, (callback di expectCollectible):5378, (callback di this.startDialogue):5388, (callback di this.startDialogue):5394, (callback di this.startDialogue):5398, (callback di this.startDialogue):5408, (callback di this.startDialogue):5414, (callback di this.time.delayedCall):5416, (callback di this.startDialogue):5423, (callback di this.time.delayedCall):5426, (callback di this.startDialogue):5430, (callback di this.startDialogue):5436, (callback di this.startDialogue):5441, (callback di this.startDialogue):5446, (callback di this.startDialogue):5451, onPick:5455, (callback di this.startDialogue):5468, (callback di this.startDialogue):5474, (callback di this.startDialogue):5486, (callback di this.startDialogue):5493, (callback di this.time.delayedCall):5496, (callback di this.startDialogue):5498, (callback di this.startDialogue):5506, (callback di this.time.delayedCall):5513, (callback di this.startDialogue):5525, (callback di this.startDialogue):5533, (callback di this.time.delayedCall):5537, giorno30:5545, (callback di this.startDialogue):5546, (callback di this.startDialogue):5548, (callback di this.startDialogue):5551, (callback di this.time.delayedCall):5561, startOrder:5579, solid:5599, emitOrderShot:5601, sceltaFinale:5606, after:5607, onPick:5613, (callback di this.startDialogue):5619, (callback di this.startDialogue):5634, (callback di this.startDialogue):5637, (callback di this.startDialogue):5642, setupBossColliders:5653, (callback di this.physics.add.overlap):5656, (callback di this.physics.add.overlap):5664, (callback di this.physics.add.overlap):5667, onPlayerDead:5684, (callback di this.time.delayedCall):5701, startDialogue:5757, (callback di flashback.play):5763, (callback di this.time.delayedCall):5768, startLines:5775, onEnd:5783, hitstop:5792, (callback di this.time.delayedCall):5795, shake:5801
- rami mai presi (438):
  - 356 ??: `region?.def ?? LEVELS[data.levelId]`
  - 358 ??: `region?.layout ?? null`
  - 403 ?:falso: `this.layout ? new RegionGuide(this.layout) : null`
  - 507 then: `if (cpId) {`
  - 508 then: `if (cp) sp = { x: cp.x, y: cp.y - 8 };`
  - 556 ?:vero: `this.def.hub ? 18 : undefined`
  - 581 ??: `this.layout?.rooms.length ?? 0`
  - 642 ??: `this.chaseEnds[i] ?? Infinity`
  - 676 ?:falso: `this.layout ? this.layout.horizonRow * TILE : this.level.heightPx`
  - 680 ?:falso: `this.layout ? this.layout.horizonRow : null`
  - 707 then: `if (this.def.script === 'galliate' || this.def.script === 'marcetti') `
  - 708 ?:vero: `this.def.script === 'galliate' ? 0x150406 : 0x1a1206`
  - 708 ?:falso: `this.def.script === 'galliate' ? 0x150406 : 0x1a1206`
  - 734 then: `if (introId === 'tommaso-benvenuto' && !state.hasFlag('tommasorveglian`
  - 733 &&: `introId === 'tommaso-benvenuto' && !state.hasFlag('tommasorveglianza')`
  - 740 then: `if (introId && !state.save.seenDialogues.includes(introId)) {`
  - 739 &&: `introId && !state.save.seenDialogues.includes(introId)`
  - 743 then: `if (isTanaIntro) {`
  - 745 else: `if (isTanaIntro) {`
  - 749 then: `if (isTanaIntro) {`
  - 768 case: `case 'spawner': {`
  - 769 ??: `spec.maxAlive ?? 3`
  - 770 ??: `spec.intervalMs ?? 3500`
  - 771 ??: `spec.radius ?? 600`
  - 804 then: `if (state.hasFlag('boss-down-${spec.kind}')) {`
  - 808 ?:vero: `spec.kind === 'ombra' && !state.hasFlag('tommasorveglianza') ? 34 : un`
  - 808 &&: `spec.kind === 'ombra' && !state.hasFlag('tommasorveglianza')`
  - 815 &&: `spec.kind === 'limite' && this.indiziRaccolti() >= 3`
  - 817 &&: `spec.kind === 'ticummi' && state.hasFlag('tommasorveglianza')`
  - 833 ||: `state.save.collectedLore.includes(key) || (charm && state.hasCharm(id)`
  - 833 &&: `charm && state.hasCharm(id)`
  - 837 then: `if (LEGACY_ITEMS[item] && !state.save.collectedLore.includes(persistKe`
  - 836 &&: `LEGACY_ITEMS[item] && !state.save.collectedLore.includes(persistKey)`
  - 843 &&: `isCharm && state.hasCharm(item)`
  - 845 then: `if (loose) ({ x, y } = this.rewardSpot(x, y));`
  - 846 ?:vero: `isCharm ? 'pickup-charm' : 'pickup-item'`
  - 849 ?:vero: `isCharm ? 0xc084fc : 0xfacc15`
  - 1000 ?:falso: `poolKinds.length ? poolKinds : fallback.filter((k) => k in ENEMIES)`
  - 1006 ??: `doorCount.get(room.id) ?? 0`
  - 1008 ??: `rooms[room.anchor]?.pathIndex ?? 0`
  - 1024 &&: `e.spec.type === 'spawner'`
  - 1024 &&: `e.spec.type === 'spawner'`
  - 1023 &&: `e.spec.type === 'spawner'`
  - 1023 &&: `e.spec.type === 'spawner'`
  - 1047 &&: `this.nav.solid(c, r - 1) && this.nav.solid(c, r - 2)`
  - 1072 &&: `dx < 1500 && dy < 1000`
  - 1074 ||: `dx > 1800 || dy > 1250`
  - 1080 &&: `dist < s.radius && !this.player.dead`
  - 1082 ||: `!armed || time < s.nextAt`
  - 1085 ciclo: `for (const obj of this.enemies.getChildren()) {`
  - 1086 then: `if (!e.active || e.dormant) continue;`
  - 1086 ||: `!e.active || e.dormant`
  - 1088 then: `if (Math.hypot(e.x - s.x, e.y - s.y) < 760) {`
  - 1089 then: `if (alive >= s.maxAlive) break;`
  - 1093 then: `if (alive >= s.maxAlive) {`
  - 1181 then: `if (id === 'caccia-inizio') {`
  - 1181 then: `if (state.hasFlag('boss-down-lochef')) return;`
  - 1188 then: `if (id === 'caccia-fine') {`
  - 1188 then: `if (state.hasFlag('boss-down-lochef')) return;`
  - 1196 then: `if (id === 'smela-arena') {`
  - 1202 then: `if (id.startsWith('arena-')) {`
  - 1209 then: `if (id.startsWith('warena-')) {`
  - 1216 then: `if (id === 'walter-guida') {`
  - 1227 then: `if (id === 'romero-guida') {`
  - 1239 then: `if (id === 'sfida-33') {`
  - 1239 then: `if (state.hasFlag('boss-down-trentatre')) return;`
  - 1250 then: `if (id.startsWith('porta-teorema')) {`
  - 1265 then: `if (id === 'lametta-arena') {`
  - 1272 then: `if (id === 'ospite-12') {`
  - 1756 ciclo: `for (const h of this.homing) {`
  - 1756 then: `if (now < h.at || this.player.dead) continue;`
  - 1756 ||: `now < h.at || this.player.dead`
  - 1760 then: `if (d < 30) continue;`
  - 1762 then: `if (!h.moving) {`
  - 1772 then: `if (loose) ({ x, y } = this.rewardSpot(x, y));`
  - 1802 ?:vero: `collected ? 0.5 : 1`
  - 1905 then: `if (state.save.checkpointId === cp.id) {`
  - 1909 then: `if (used) {`
  - 1924 ||: `!drop || drop.levelId !== this.def.id || drop.amount <= 0`
  - 1924 ||: `!drop || drop.levelId !== this.def.id`
  - 1961 then: `if (loose) ({ x, y } = this.rewardSpot(x, y));`
  - 2032 ?:vero: `to === 'barrato' ? 0xfacc15 : 0x4ade80`
  - 2032 ?:falso: `to === 'barrato' ? 0xfacc15 : 0x4ade80`
  - 2038 ?:vero: `to === 'barrato' ? 0xfacc15 : 0x4ade80`
  - 2045 then: `if (!state.hasFlag(hintShown)) {`
  - 2335 ?:vero: `phase === 2 ? 'phase2' : 'phase3'`
  - 2335 ?:falso: `phase === 2 ? 'phase2' : 'phase3'`
  - 2415 ?:falso: `this.layout ? 220 : 0`
  - 2431 then: `if (this.def.id === 'tana') cam.fadeOut(0, 0, 0, 0);`
  - 2468 then: `if (state.hasFlag('markolino-dono-visto') && !state.hasAbility('scivol`
  - 2467 &&: `state.hasFlag('markolino-dono-visto') && !state.hasAbility('scivolata'`
  - 2466 &&: `state.hasFlag('markolino-dono-visto') && !state.hasAbility('scivolata'`
  - 2469 then: `if (dono) this.spawnFragment(dono.x, dono.y - 50, 'scivolata');`
  - 2475 then: `if (this.def.id === 'santuario') waveOnce('romero-prima-santuario', WA`
  - 2476 then: `if (this.def.id === 'rio') waveOnce('smela-opzionale-detta', WAVESUNG.`
  - 2478 then: `if (this.def.id === 'ruhra') {`
  - 2481 then: `if (this.def.id === 'sorveglianza') {`
  - 2485 then: `if (this.def.id === 'cantina') {`
  - 2488 then: `if (this.def.script === 'trenbolone') {`
  - 2489 then: `if (!state.hasFlag('rio-curato') && !state.run.trenbolone) {`
  - 2488 &&: `!state.hasFlag('rio-curato') && !state.run.trenbolone`
  - 2499 then: `if (this.def.id === 'santuario' && state.hasFlag('boss-down-guggu') &&`
  - 2498 &&: `this.def.id === 'santuario' && state.hasFlag('boss-down-guggu') && !st`
  - 2498 &&: `this.def.id === 'santuario' && state.hasFlag('boss-down-guggu')`
  - 2503 then: `if (this.def.script === 'ruhra' && !state.hasFlag('wavesung-piema')) {`
  - 2502 &&: `this.def.script === 'ruhra' && !state.hasFlag('wavesung-piema')`
  - 2507 then: `if (this.def.script === 'tana' && !state.hasFlag('wavesung-tana')) {`
  - 2506 &&: `this.def.script === 'tana' && !state.hasFlag('wavesung-tana')`
  - 2511 then: `if (this.def.script === 'sorveglianza' && !state.hasFlag('wavesung-sor`
  - 2510 &&: `this.def.script === 'sorveglianza' && !state.hasFlag('wavesung-sorvegl`
  - 2515 then: `if (this.def.script === 'cantina' && !state.hasFlag('wavesung-cantina'`
  - 2514 &&: `this.def.script === 'cantina' && !state.hasFlag('wavesung-cantina')`
  - 2516 ?:vero: `state.hasFlag('tommasorveglianza') ? WAVESUNG.ticummiClausola : WAVESU`
  - 2516 ?:falso: `state.hasFlag('tommasorveglianza') ? WAVESUNG.ticummiClausola : WAVESU`
  - 2520 then: `if (this.def.script === 'pedro' && !state.hasFlag('wavesung-finale')) `
  - 2519 &&: `this.def.script === 'pedro' && !state.hasFlag('wavesung-finale')`
  - 2523 then: `if (this.def.script === 'indagine') this.setupVoid();`
  - 2628 ||: `(this.def.script !== 'galliate' && this.def.script !== 'marcetti') || `
  - 2631 then: `if (this.baruffoniStep < this.baruffoniArenas.length) {`
  - 2633 else: `if (this.baruffoniStep < this.baruffoniArenas.length) {`
  - 2634 ??: `lastArena?.x ?? this.player.x`
  - 2708 ||: `this.def.script !== 'indagine' || !c`
  - 2713 then: `if (this.voidStep < this.voidArenas.length) {`
  - 2715 else: `if (this.voidStep < this.voidArenas.length) {`
  - 2716 ??: `lastArena?.x ?? this.player.x`
  - 2832 then: `if (this.controls.device === 'gamepad' && this.controls.pressed('up')`
  - 2830 &&: `this.controls.device === 'gamepad' && this.controls.pressed('up')`
  - 2830 &&: `this.controls.device === 'gamepad' && this.controls.pressed('up')`
  - 2830 &&: `this.controls.device === 'gamepad' && this.controls.pressed('up')`
  - 2829 &&: `this.controls.device === 'gamepad' && this.controls.pressed('up')`
  - 2839 then: `if (!this.player.dead && this.player.y > this.level.heightPx + FALL_DE`
  - 2842 ?:vero: `this.clone && this.clone.active ? (this.clone as Phaser.GameObjects.Sp`
  - 2842 &&: `this.clone && this.clone.active`
  - 2860 ?:falso: `this.layout ? !!this.roomAt(this.player.x, this.player.y)?.surface : !`
  - 2882 ?:falso: `this.layout ? this.roomAt(this.player.x, this.player.y) : null`
  - 2883 ?:falso: `this.layout ? !!here?.surface : !this.biome.indoor`
  - 2885 ?:vero: `this.boss?.engaged ? 0 : this.atmosphere.night * 0.85`
  - 2910 then: `if (state.run.trenbolone && Math.random() < 0.2) {`
  - 2909 &&: `state.run.trenbolone && Math.random() < 0.2`
  - 2946 ||: `!state.save.doomsdayMode || this.player.dead || this.exiting`
  - 2946 ||: `!state.save.doomsdayMode || this.player.dead`
  - 2948 ||: `this.pattoActive || this.finalGodsFight`
  - 2953 then: `if (v >= 0.45 && this.doomsdayWarned < 1) {`
  - 2952 &&: `v >= 0.45 && this.doomsdayWarned < 1`
  - 2957 then: `if (v >= 0.72 && this.doomsdayWarned < 2) {`
  - 2956 &&: `v >= 0.72 && this.doomsdayWarned < 2`
  - 2961 &&: `this.boss && this.boss.engaged`
  - 2965 then: `if (v >= 0.6 && !activeBoss && time >= this.nextWildGlitchAt) {`
  - 2964 &&: `v >= 0.6 && !activeBoss && time >= this.nextWildGlitchAt`
  - 2964 &&: `v >= 0.6 && !activeBoss`
  - 2966 ?:vero: `Math.random() < 0.5 ? -1 : 1`
  - 2966 ?:falso: `Math.random() < 0.5 ? -1 : 1`
  - 2974 then: `if (v >= 1 && !this.collapseTriggered && !activeBoss && this.def.scrip`
  - 2973 &&: `v >= 1 && !this.collapseTriggered && !activeBoss && this.def.script !=`
  - 2973 &&: `v >= 1 && !this.collapseTriggered && !activeBoss`
  - 2973 &&: `v >= 1 && !this.collapseTriggered`
  - 2977 then: `if (this.boss) {`
  - 2982 else: `if (this.boss) {`
  - 3001 ||: `this.def.script !== 'custode' || !this.boss?.active || !this.boss.enga`
  - 3001 ||: `this.def.script !== 'custode' || !this.boss?.active`
  - 3002 then: `if (time < this.nextBeatAt) return;`
  - 3007 &&: `b.active && b.clearTint()`
  - 3045 &&: `Math.abs(w.x - x) < r && w.y > y - 20 && w.y < y + TILE * 1.5`
  - 3045 &&: `Math.abs(w.x - x) < r && w.y > y - 20`
  - 3054 then: `if (s.active && !s.broken && Math.hypot(s.x - x, s.y - y) < r + 40) th`
  - 3067 ||: `!boss?.active || !boss.engaged || !state.hasFlag('ivan')`
  - 3070 then: `if (boss.hp <= 15 && this.ivanInArena && !this.ivanDead) {`
  - 3069 &&: `boss.hp <= 15 && this.ivanInArena && !this.ivanDead`
  - 3069 &&: `boss.hp <= 15 && this.ivanInArena`
  - 3076 then: `if (!this.ivanInArena) {`
  - 3091 then: `if (!this.ivanBusy && time >= this.nextIvanStrikeAt) {`
  - 3090 &&: `!this.ivanBusy && time >= this.nextIvanStrikeAt`
  - 3209 then: `if (!this.def.next) {`
  - 3209 then: `if (!this.def.secret) return;`
  - 3211 then: `if (!hit) return;`
  - 3212 then: `if (this.boss?.active && this.boss.def.guardsExit !== false) return;`
  - 3212 &&: `this.boss?.active && this.boss.def.guardsExit !== false`
  - 3214 ??: `ret?.levelId ?? this.def.returnTo`
  - 3215 then: `if (!target) return;`
  - 3216 ?:vero: `ret && ret.levelId === target ? { x: ret.x, y: ret.y } : undefined`
  - 3216 ?:falso: `ret && ret.levelId === target ? { x: ret.x, y: ret.y } : undefined`
  - 3216 &&: `ret && ret.levelId === target`
  - 3225 then: `if (this.boss?.active && this.boss.def.guardsExit !== false) {`
  - 3224 &&: `this.boss?.active && this.boss.def.guardsExit !== false`
  - 3226 then: `if (this.time.now > this.exitLockToastAt) {`
  - 3232 then: `if (this.def.script === 'ruhra' && !state.hasAbility('analisi')) {`
  - 3231 &&: `this.def.script === 'ruhra' && !state.hasAbility('analisi')`
  - 3233 then: `if (this.time.now > this.exitLockToastAt) {`
  - 3239 then: `if (this.def.script === 'indagine' && !state.hasFlag('void-concluso'))`
  - 3238 &&: `this.def.script === 'indagine' && !state.hasFlag('void-concluso')`
  - 3240 then: `if (this.time.now > this.exitLockToastAt) {`
  - 3246 then: `if (this.def.script === 'galliate' && !state.hasFlag('boss-down-maranz`
  - 3245 &&: `this.def.script === 'galliate' && !state.hasFlag('boss-down-maranzone'`
  - 3247 then: `if (this.time.now > this.exitLockToastAt) {`
  - 3253 then: `if (this.def.id === 'trenbolone' && !state.run.trenbolone) {`
  - 3252 &&: `this.def.id === 'trenbolone' && !state.run.trenbolone`
  - 3254 then: `if (this.time.now > this.exitLockToastAt) {`
  - 3369 then: `if (state.save.explored[this.def.id].length >= this.layout.rooms.lengt`
  - 3368 &&: `state.save.explored[this.def.id].length >= this.layout.rooms.length &&`
  - 3372 then: `if (state.save.flags.filter((f) => f.startsWith('esplorata-')).length `
  - 3383 then: `if (boss?.active && boss.engaged && boss.def.guardsExit !== false && !`
  - 3382 &&: `boss?.active && boss.engaged && boss.def.guardsExit !== false && !this`
  - 3382 &&: `boss?.active && boss.engaged && boss.def.guardsExit !== false && !this`
  - 3382 &&: `boss?.active && boss.engaged && boss.def.guardsExit !== false`
  - 3386 then: `if (this.bossFight) {`
  - 3386 then: `if (state.run.hp < this.bossFight.hp) this.bossFight.hit = true;`
  - 3537 &&: `this.def.script === 'ruhra' && !state.hasAbility('analisi')`
  - 3538 &&: `this.def.id === 'trenbolone' && !state.run.trenbolone && !state.hasFla`
  - 3538 &&: `this.def.id === 'trenbolone' && !state.run.trenbolone`
  - 3540 then: `if (this.def.script === 'indagine' && !state.hasFlag('void-concluso'))`
  - 3539 &&: `this.def.script === 'indagine' && !state.hasFlag('void-concluso')`
  - 3541 then: `if (a) return { ...a, label: 'il prossimo rimpianto' };`
  - 3544 then: `if ((this.def.script === 'galliate' || this.def.script === 'marcetti')`
  - 3543 &&: `(this.def.script === 'galliate' || this.def.script === 'marcetti') && `
  - 3543 ||: `this.def.script === 'galliate' || this.def.script === 'marcetti'`
  - 3545 then: `if (a) return { ...a, label: 'la prossima arena' };`
  - 3547 &&: `this.smelaArena && state.hasFlag('boss-down-danjilo')`
  - 3549 then: `if (exit) return { x: exit.centerX, y: exit.centerY, label: this.def.n`
  - 3549 ?:vero: `this.def.next ? 'uscita' : 'ritorno'`
  - 3549 ?:falso: `this.def.next ? 'uscita' : 'ritorno'`
  - 3562 ciclo: `for (const f of this.liveFragments) {`
  - 3562 then: `if (state.hasAbility(f.ability)) continue;`
  - 3564 then: `if (d < bd) { bd = d; bx = f.x; by = f.y; found = true; }`
  - 3569 ||: `e.spec.type !== 'ability' || state.hasAbility(e.spec.ability)`
  - 3571 then: `if (d < bd) { bd = d; bx = e.x; by = e.y; found = true; }`
  - 3574 ?:vero: `found ? { x: bx, y: by, label: 'frammento della wave' } : null`
  - 3596 ||: `!goal || !state.settings.guide || this.player.dead || this.boss?.engag`
  - 3596 ||: `!goal || !state.settings.guide || this.player.dead || this.boss?.engag`
  - 3596 ||: `!goal || !state.settings.guide || this.player.dead`
  - 3599 ?:vero: `this.guide ? '${this.guide.roomAt(this.player.x, this.player.y)?.id ??`
  - 3599 ?:falso: `this.guide ? '${this.guide.roomAt(this.player.x, this.player.y)?.id ??`
  - 3599 ??: `this.guide.roomAt(this.player.x, this.player.y)?.id ?? -1`
  - 3599 ??: `this.guide.roomAt(goal.x, goal.y)?.id ?? -1`
  - 3600 ?:vero: `key === this.guideCacheKey ? this.guideCache : null`
  - 3600 ?:falso: `key === this.guideCacheKey ? this.guideCache : null`
  - 3602 then: `if (!next) {`
  - 3602 ?:vero: `this.guide ? this.guide.nextPoint(this.player.x, this.player.y, goal.x`
  - 3602 ?:falso: `this.guide ? this.guide.nextPoint(this.player.x, this.player.y, goal.x`
  - 3606 then: `if (!next) return;`
  - 3610 &&: `next.rooms === 0 && d < 140`
  - 3630 then: `if (this.challenge) {`
  - 3634 &&: `!!boss?.active && boss.engaged && !boss.frenzy && !this.player.dead`
  - 3634 &&: `!!boss?.active && boss.engaged && !boss.frenzy`
  - 3637 then: `if (this.arenaRoom) {`
  - 3637 then: `if (!boss?.active || this.player.dead) this.unlockArena();`
  - 3638 else: `if (!boss?.active || this.player.dead) this.unlockArena();`
  - 3637 ||: `!boss?.active || this.player.dead`
  - 3641 ||: `!fighting || !this.layout`
  - 3643 ||: `!room || room.kind !== 'arena' || this.roomAt(this.player.x, this.play`
  - 3643 ||: `!room || room.kind !== 'arena'`
  - 3648 ||: `c < R.x + 4 || c > R.x + R.w - 4 || r < R.y + 2 || r > R.y + R.h - 2`
  - 3648 ||: `c < R.x + 4 || c > R.x + R.w - 4 || r < R.y + 2`
  - 3648 ||: `c < R.x + 4 || c > R.x + R.w - 4`
  - 3719 ?:vero: `won ? 0x64748b : 0xef4444`
  - 3731 ?:falso: `this.challengeSpot ? [{ x: this.challengeSpot.x, y: this.challengeSpot`
  - 3850 &&: `dist < 440 && Math.abs(this.player.y - this.boss.y) < 380`
  - 3856 else: `if (bossRoom) {`
  - 3855 &&: `near && this.nav.sight(this.player.x, this.player.y - 10, this.boss.x,`
  - 3857 then: `if (!near) {`
  - 3860 &&: `this.boss.def.kind === 'formicona' && this.player.y < this.boss.y - 60`
  - 3863 then: `if (this.def.script === 'pedro' && !this.pedroChoiceShown) {`
  - 3862 &&: `this.def.script === 'pedro' && !this.pedroChoiceShown`
  - 3865 ?:vero: `state.hasFlag('ricordi-visti') ? 'pedro-incontro-ricordi' : 'pedro-inc`
  - 3865 ?:falso: `state.hasFlag('ricordi-visti') ? 'pedro-incontro-ricordi' : 'pedro-inc`
  - 3867 ?:vero: `state.hasFlag('quaderno-completo') ? this.startDialogue(incontro, () =`
  - 3867 ?:falso: `state.hasFlag('quaderno-completo') ? this.startDialogue(incontro, () =`
  - 3888 then: `if (this.boss.def.kind === 'flauto') {`
  - 3888 ?:vero: `state.run.trenbolone ? 'flauto-fatto-rabbia' : 'flauto-sveglio-rabbia'`
  - 3888 ?:falso: `state.run.trenbolone ? 'flauto-fatto-rabbia' : 'flauto-sveglio-rabbia'`
  - 3890 &&: `this.boss.def.kind === 'ombra' && !state.hasFlag('tommasorveglianza')`
  - 3892 &&: `this.boss.def.kind === 'garante' && state.hasFlag('pensiero-cancellato`
  - 3893 &&: `this.boss.def.kind === 'garante' && state.hasFlag('pensiero-portato')`
  - 3894 &&: `this.boss.def.kind === 'ticummi' && state.hasFlag('tommasorveglianza')`
  - 3896 then: `if (introId && !this.bossIntroShown) {`
  - 3910 else: `if (introId && !this.bossIntroShown) {`
  - 3895 &&: `introId && !this.bossIntroShown`
  - 3899 then: `if (!state.save.seenDialogues.includes(introId)) {`
  - 3903 else: `if (!state.save.seenDialogues.includes(introId)) {`
  - 3906 then: `if (boss.def.kind === 'guggu' && boss.invulnerable) {`
  - 3905 &&: `boss.def.kind === 'guggu' && boss.invulnerable`
  - 3911 then: `if (!introId) {`
  - 4119 ||: `!clone || !clone.active`
  - 4121 then: `if (time >= this.cloneUntil) {`
  - 4127 then: `if (this.cloneTwin) {`
  - 4129 then: `if (time >= this.cloneJitterAt) {`
  - 4130 ?:vero: `Math.random() < 0.5 ? -2 : 2`
  - 4130 ?:falso: `Math.random() < 0.5 ? -2 : 2`
  - 4135 then: `if (time - this.cloneWaveAt >= 200) {`
  - 4137 ??: `body?.width ?? 36`
  - 4138 ??: `body?.height ?? 55`
  - 4160 then: `if (time >= this.analisiUntil) {`
  - 4168 then: `if (elapsed < 600) {`
  - 4176 else: `if (elapsed < 600) {`
  - 4177 then: `if (this.analisiPhase === 1) {`
  - 4191 then: `if (time >= this.nextAnalisiTick) {`
  - 4194 ciclo: `for (const obj of this.enemies.getChildren()) {`
  - 4195 then: `if (!e.active || Math.hypot(e.x - px, e.y - py) >= r) continue;`
  - 4195 ||: `!e.active || Math.hypot(e.x - px, e.y - py) >= r`
  - 4202 then: `if (this.boss?.active && Math.hypot(this.boss.x - px, this.boss.y - py`
  - 4201 &&: `this.boss?.active && Math.hypot(this.boss.x - px, this.boss.y - py) < `
  - 4207 then: `if (elapsed >= 1800 && !this.analisiQedDone) {`
  - 4206 &&: `elapsed >= 1800 && !this.analisiQedDone`
  - 4214 ciclo: `for (const [e, mark] of this.analisiMarks) {`
  - 4215 then: `if (!e.active) {`
  - 4298 then: `if (time >= this.scudoUntil) {`
  - 4303 ?:vero: `perfect ? FX.shieldPerfect : FX.shield`
  - 4303 ?:falso: `perfect ? FX.shieldPerfect : FX.shield`
  - 4412 ciclo: `for (let i = this.acquaPuddles.length - 1; i >= 0; i--) {`
  - 4414 then: `if (time >= p.until) {`
  - 4420 then: `if (tick) p.nextTick = time + COMBAT.acquaTickMs;`
  - 4422 then: `if (tick && Math.random() < 0.6) sfx.bubble();`
  - 4422 &&: `tick && Math.random() < 0.6`
  - 4424 then: `if (tick) {`
  - 4432 then: `if (time - p.waveAt >= 300) {`
  - 4436 ciclo: `for (const obj of this.enemies.getChildren()) {`
  - 4437 then: `if (!e.active) continue;`
  - 4438 then: `if (Math.abs(e.x - p.x) > r || Math.abs(e.y - p.y) > r * 0.7) continue`
  - 4438 ||: `Math.abs(e.x - p.x) > r || Math.abs(e.y - p.y) > r * 0.7`
  - 4444 then: `if (tick) {`
  - 4449 then: `if (this.boss?.active && Math.abs(this.boss.x - p.x) < r && Math.abs(t`
  - 4448 &&: `this.boss?.active && Math.abs(this.boss.x - p.x) < r && Math.abs(this.`
  - 4448 &&: `this.boss?.active && Math.abs(this.boss.x - p.x) < r`
  - 4463 ciclo: `for (const [target, until] of this.poisoned) {`
  - 4464 then: `if (!target.active || time >= until) {`
  - 4463 ||: `!target.active || time >= until`
  - 4464 then: `if (target.active) target.clearTint();`
  - 4499 ??: `body?.width ?? 36`
  - 4500 ??: `body?.height ?? 55`
  - 4505 ciclo: `for (const obj of this.playerProjectiles.getChildren()) {`
  - 4506 then: `if (!proj.active) continue;`
  - 4508 then: `if (glow) glow.setPosition(proj.x, proj.y);`
  - 4510 ??: `(proj.getData('level') as number | undefined) ?? -1`
  - 4512 then: `if (level >= 0 && time - (proj.getData('trailAt') as number ?? 0) >= 4`
  - 4511 &&: `level >= 0 && time - (proj.getData('trailAt') as number ?? 0) >= 40`
  - 4511 ??: `proj.getData('trailAt') as number ?? 0`
  - 4516 then: `if (pbody) ghost.setDisplaySize(pbody.width, pbody.height);`
  - 4520 ?:vero: `level >= 0 ? 'risonante' as const : (proj.getData('reflected') ? 'scud`
  - 4520 ?:falso: `level >= 0 ? 'risonante' as const : (proj.getData('reflected') ? 'scud`
  - 4520 ?:vero: `proj.getData('reflected') ? 'scudo' as const : null`
  - 4520 ?:falso: `proj.getData('reflected') ? 'scudo' as const : null`
  - 4522 then: `if (wave && time - (proj.getData('waveAt') as number ?? 0) >= 60) {`
  - 4521 &&: `wave && time - (proj.getData('waveAt') as number ?? 0) >= 60`
  - 4521 ??: `proj.getData('waveAt') as number ?? 0`
  - 4524 ??: `pbody?.width ?? 26`
  - 4525 ??: `pbody?.height ?? 18`
  - 4528 ?:vero: `level >= 0 ? level : (proj.getData('perfect') ? 2 : 1)`
  - 4528 ?:falso: `level >= 0 ? level : (proj.getData('perfect') ? 2 : 1)`
  - 4528 ?:vero: `proj.getData('perfect') ? 2 : 1`
  - 4528 ?:falso: `proj.getData('perfect') ? 2 : 1`
  - 4533 then: `if (homing?.active) {`
  - 4547 else: `if (homing?.active) {`
  - 4535 then: `if (pbody) {`
  - 4537 ||: `Math.hypot(pbody.velocity.x, pbody.velocity.y) || 400`
  - 4541 ciclo: `while (diff > Math.PI) diff -= Math.PI * 2;`
  - 4542 ciclo: `while (diff < -Math.PI) diff += Math.PI * 2;`
  - 4548 then: `if (homing && !homing.active) {`
  - 4547 &&: `homing && !homing.active`
  - 4598 ||: `this.def.script !== 'tana' || this.chaseStarts.length === 0 || this.pl`
  - 4598 ||: `this.def.script !== 'tana' || this.chaseStarts.length === 0 || this.pl`
  - 4598 ||: `this.def.script !== 'tana' || this.chaseStarts.length === 0`
  - 4602 then: `if (!this.chaseSprite) {`
  - 4607 then: `if (idx < 0) return;`
  - 4640 then: `if (!state.save.seenDialogues.includes(lines.start)) {`
  - 4644 else: `if (!state.save.seenDialogues.includes(lines.start)) {`
  - 4653 ??: `this.chaseEnds[this.chaseZoneIdx] ?? Infinity`
  - 4655 then: `if (this.progressAt(this.player.x, this.player.y) >= endP || this.time`
  - 4654 ||: `this.progressAt(this.player.x, this.player.y) >= endP || this.time.now`
  - 4671 then: `if (!state.save.seenDialogues.includes(lines.end)) {`
  - 4680 then: `if (this.player.hidden) {`
  - 4683 ||: `Math.hypot(hx, hy) || 1`
  - 4685 then: `if (hdist > 70) {`
  - 4688 else: `if (hdist > 70) {`
  - 4690 ||: `Math.hypot(ax, ay) || 1`
  - 4694 then: `if (this.time.now >= this.chaseWhisperAt) {`
  - 4695 ??: `BOSS_BARKS.lochef?.extra?.whisper ?? []`
  - 4696 ?:vero: `lines.length ? lines[this.chaseWhisperIdx++ % lines.length] : 'dove se`
  - 4696 ?:falso: `lines.length ? lines[this.chaseWhisperIdx++ % lines.length] : 'dove se`
  - 4697 ?:vero: `typeof raw === 'string' ? raw : raw.text`
  - 4697 ?:falso: `typeof raw === 'string' ? raw : raw.text`
  - 4711 ||: `Math.hypot(dx, dy) || 1`
  - 4712 ?:vero: `dist > 620 ? 380 : dist > 320 ? 250 : 200`
  - 4712 ?:falso: `dist > 620 ? 380 : dist > 320 ? 250 : 200`
  - 4712 ?:vero: `dist > 320 ? 250 : 200`
  - 4712 ?:falso: `dist > 320 ? 250 : 200`
  - 4718 then: `if (dist < 200) {`
  - 4724 else: `if (dist < 200) {`
  - 4718 then: `if (!this.chaseNearSince) this.chaseNearSince = this.time.now;`
  - 4719 else: `if (!this.chaseNearSince) this.chaseNearSince = this.time.now;`
  - 4720 then: `if (this.time.now - this.chaseNearSince > 8000 && this.time.now >= thi`
  - 4719 &&: `this.time.now - this.chaseNearSince > 8000 && this.time.now >= this.ch`
  - 4726 then: `if (this.time.now < this.chaseTiredUntil) speed *= 0.7;`
  - 4730 then: `if (dy < 0) yFactor *= 0.65;`
  - 4731 ?:vero: `Math.abs(dy) > 120 ? 0.5 : 1`
  - 4731 ?:falso: `Math.abs(dy) > 120 ? 0.5 : 1`
  - 4740 then: `if (dist < 45) {`
  - 4742 then: `if (this.player.hurt(1, chef.x)) {`
  - 4760 ||: `!this.lamettaCenter || this.exiting`
  - 4764 then: `if (!this.lamettaActive) {`
  - 4765 then: `if (Math.abs(this.player.x - c.x) < 380 && Math.abs(this.player.y - c.`
  - 4764 &&: `Math.abs(this.player.x - c.x) < 380 && Math.abs(this.player.y - c.y) <`
  - 4764 &&: `Math.abs(this.player.x - c.x) < 380 && Math.abs(this.player.y - c.y) <`
  - 4780 then: `if (this.mirror) return;`
  - 4783 then: `if (time >= this.nextLametteAt) {`
  - 4788 then: `if (time >= this.nextPitturaAt && this.awakeEnemies() < 5) {`
  - 4787 &&: `time >= this.nextPitturaAt && this.awakeEnemies() < 5`
  - 4796 ||: `!this.smelaArena || this.boss || this.exiting || this.player.dead`
  - 4796 ||: `!this.smelaArena || this.boss || this.exiting`
  - 4796 ||: `!this.smelaArena || this.boss`
  - 4797 then: `if (state.hasFlag('boss-down-smela')) { this.smelaArena = null; return`
  - 4799 then: `if (!state.hasFlag('boss-down-danjilo')) return;`
  - 4800 ||: `Math.abs(this.player.x - this.smelaArena.x) > 360 || Math.abs(this.pla`
  - 4860 ||: `this.def.script !== 'trenbolone' || this.level.water.length === 0`
  - 4861 &&: `!state.run.trenbolone && !state.run.smela`
  - 4863 then: `if (!inWater) return;`
  - 4872 then: `if (!state.hasFlag('rio-curato')) {`
  - 4875 else: `if (!state.hasFlag('rio-curato')) {`
  - 4939 ||: `!list || this.player.dead || this.exiting`
  - 4939 ||: `!list || this.player.dead`
  - 4941 ciclo: `for (let i = 0; i < list.length; i++) {`
  - 4943 then: `if (state.hasFlag(flag) || this.progressAt(this.player.x, this.player.`
  - 4943 ||: `state.hasFlag(flag) || this.progressAt(this.player.x, this.player.y) <`
  - 4946 then: `if (a.type === 'gag') {`
  - 4950 ??: `a.count ?? 1`
  - 5048 ||: `!this.pattoActive || this.player.dead || this.boss`
  - 5048 ||: `!this.pattoActive || this.player.dead`
  - 5051 then: `if (time >= this.pattoNextSpawnAt && this.awakeEnemies() < 7) {`
  - 5050 &&: `time >= this.pattoNextSpawnAt && this.awakeEnemies() < 7`
  - 5052 ?:vero: `Math.random() > 0.5 ? 1 : -1`
  - 5052 ?:falso: `Math.random() > 0.5 ? 1 : -1`
  - 5059 then: `if (left <= 12000 && this.pattoWarned < 1) {`
  - 5058 &&: `left <= 12000 && this.pattoWarned < 1`
  - 5063 then: `if (left <= 6000 && this.pattoWarned < 2) {`
  - 5062 &&: `left <= 6000 && this.pattoWarned < 2`
  - 5068 then: `if (left <= 0) this.arrivoDei();`
  - 5228 &&: `lesson.ability && !state.hasAbility(lesson.ability)`
  - 5229 ||: `Math.abs(e.x - this.player.x) > 520 || Math.abs(e.y - this.player.y) >`
  - 5230 then: `if (!this.nav.sight(this.player.x, this.player.y - 10, e.x, e.y)) cont`
  - 5726 then: `if (state.save.collectedLore.includes(this.micKey(mid))) {`
