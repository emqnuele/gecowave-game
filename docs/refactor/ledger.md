# registro del refactor

Ogni membro delle classi toccate, con le righe su main (`a16f39c`). **destinazione**: dove finisce nel codice nuovo; **stato**: da fare, portato, verificato. Una riga senza destinazione e senza verifica non è portata.
Gli scenari sono quelli che eseguono la prima istruzione del metodo (copertura per scenario), i più corti per primi. Generato da `scripts/harness/ledger.mjs`: destinazione e stato scritti a mano si conservano.

Metodi eseguiti da almeno uno scenario: 186/186.

## src/scenes/GameScene.ts

| | membro | tipo | righe | scenari | destinazione | stato |
|---|---|---|---|---|---|---|
| | def | campo | 159-159 |  | game/world/LevelWorld.def | portato |
| | layout | campo | 161-161 |  | game/world/LevelWorld.layout | portato |
| | roomBySlot | campo | 163-163 |  | game/world/LevelWorld | portato |
| | level | campo | 164-164 |  | game/world/LevelWorld.level | portato |
| | nav | campo | 166-166 |  | game/world/LevelWorld.nav | portato |
| | player | campo | 167-167 |  | scene/GameScene (orchestratore) | portato |
| | controls | campo | 169-169 |  | scene/GameScene (orchestratore) | portato |
| | boss | campo | 170-170 |  | game/Bosses.current | portato |
| | enemies | campo | 171-171 |  | game/groups.enemies (logica in game/Enemies) | portato |
| | spawners | campo | 173-173 |  | game/groups.spawners | portato |
| | spawnerToastShown | campo | 174-174 |  | game/Enemies.spawnerToastShown (B13: era in RestartCarry, ora rinasce a ogni vita) | portato |
| | threatCache | campo | 176-176 |  | game/Enemies.threatCache | portato |
| | playerProjectiles | campo | 177-177 |  | game/groups | portato |
| | enemyProjectiles | campo | 178-178 |  | game/groups | portato |
| | lametteGroup | campo | 179-179 |  | game/groups.lamette | portato |
| | barreGroup | campo | 180-180 |  | game/groups.barre | portato |
| | doorGroup | campo | 181-181 |  | game/groups.doors | portato |
| | interactables | campo | 182-182 |  | game/Interactions.list | portato |
| | prompt | campo | 183-183 |  | game/Interactions | portato |
| | promptTxt | campo | 184-184 |  | game/Interactions | portato |
| | lastSafe | campo | 185-185 |  | game/SafeGround.lastSafe | portato |
| | safeTimer | campo | 186-186 |  | game/SafeGround.safeTimer (B13: era in RestartCarry, ora rinasce a ogni vita) | portato |
| | exiting | campo | 187-187 |  | game/Progression.exiting | portato |
| | checkpointSprites | campo | 188-188 |  | game/Travel.checkpointSprites | portato |
| | propDressing | campo | 190-190 |  | game/Travel.propDressing | portato |
| | lighting | campo | 191-191 |  | scene/GameScene (orchestratore) | portato |
| | parallax | campo | 192-192 |  | scene/GameScene (orchestratore) | portato |
| | biome | campo | 193-193 |  | game/world/LevelWorld.biome | portato |
| | terrain | campo | 194-194 |  | scene/GameScene (orchestratore) | portato |
| | ambience | campo | 195-195 |  | scene/GameScene (orchestratore) | portato |
| | water | campo | 196-196 |  | scene/GameScene (orchestratore) | portato |
| | clone | campo | 197-197 |  | game/abilities/Riflesso.clone | portato |
| | cloneUntil | campo | 198-198 |  | game/abilities/Riflesso.cloneUntil (B13: era in RestartCarry, ora rinasce a ogni vita) | portato |
| | cloneColliders | campo | 199-199 |  | game/abilities/Riflesso.colliders | portato |
| | cloneTwin | campo | 200-200 |  | game/abilities/Riflesso (RiflessoFx.twin) | portato |
| | cloneJitterAt | campo | 201-201 |  | game/abilities/Riflesso (RiflessoFx.jitterAt) | portato |
| | cloneWaveAt | campo | 202-202 |  | game/abilities/Riflesso.waveAt | portato |
| | cloneSwapUsed | campo | 203-203 |  | game/abilities/Riflesso.swapUsed | portato |
| | cloneAlive | get | 205-207 | riflesso-senza-flow, sigillo-bus-specchio, wave-rio (+7) | game/abilities/Riflesso.alive (+ facciata Abilities e della scena) | portato |
| | analisiUntil | campo | 208-208 |  | game/abilities/Analisi.until | portato |
| | nextAnalisiTick | campo | 209-209 |  | game/abilities/Analisi.nextTick | portato |
| | analisiGlyphs | campo | 210-210 |  | game/abilities/Analisi (AnalisiFx.glyphs) | portato |
| | analisiPhase | campo | 211-211 |  | game/abilities/Analisi.phase | portato |
| | analisiStart | campo | 212-212 |  | game/abilities/Analisi.start | portato |
| | analisiQedDone | campo | 213-213 |  | game/abilities/Analisi.qedDone | portato |
| | analisiMarked | campo | 214-214 |  | game/abilities/Analisi.marked | portato |
| | analisiMarks | campo | 215-215 |  | game/abilities/Analisi (AnalisiFx.marks) | portato |
| | analisiBossMarked | campo | 216-216 |  | game/abilities/Analisi.bossMarked | portato |
| | analisiCircle | campo | 217-217 |  | game/abilities/Analisi (AnalisiFx.circle) | portato |
| | analisiQed | campo | 218-218 |  | game/abilities/Analisi (AnalisiFx.qed) | portato |
| | lastCooldownEmit | campo | 219-219 |  | game/abilities (Abilities.lastCooldownEmit) | portato |
| | lastDashWaveAt | campo | 220-220 |  | game/abilities (Abilities.lastDashWaveAt) | portato |
| | guide | campo | 221-221 |  | game/Guide.guide | portato |
| | guideCacheKey | campo | 223-223 |  | game/Guide.guideCacheKey | portato |
| | guideCache | campo | 224-224 |  | game/Guide.guideCache | portato |
| | liveFragments | campo | 226-226 |  | game/Rewards.liveFragments | portato |
| | folk | campo | 227-227 |  | scene/GameScene (orchestratore) | portato |
| | traps | campo | 228-228 |  | scene/GameScene (orchestratore) | portato |
| | hazards | campo | 229-229 |  | scene/GameScene (orchestratore) | portato |
| | trial | campo | 230-230 |  | game/Challenges.trial | portato |
| | story | campo | 231-231 |  | scene/GameScene (orchestratore) | portato |
| | pedroGhost | campo | 232-232 |  | scene/GameScene (orchestratore) | portato |
| | marks33 | campo | 233-233 |  | scene/GameScene (orchestratore) | portato |
| | seals | campo | 235-235 |  | scene/GameScene (orchestratore) | portato |
| | staging | campo | 236-236 |  | scene/GameScene (orchestratore) | portato |
| | quests | campo | 237-237 |  | scene/GameScene (orchestratore) | portato |
| | atmosphere | campo | 238-238 |  | scene/GameScene (orchestratore) | portato |
| | soundscape | campo | 239-239 |  | scene/GameScene (orchestratore) | portato |
| | nextTrophyCheckAt | campo | 240-240 |  | game/Progression.nextTrophyCheckAt | portato |
| | bossFight | campo | 242-242 |  | game/Bosses.fight | portato |
| | guideGfx | campo | 243-243 |  | game/Guide.guideGfx | portato |
| | lastRoom | campo | 244-244 |  | game/Progression.lastRoom | portato |
| | npcAt | campo | 246-246 |  | game/Npcs.at | portato |
| | arenaBars | campo | 248-248 |  | game/groups.arenaBars | portato |
| | arenaGfx | campo | 249-249 |  | game/Arena.gfx | portato |
| | arenaRoom | campo | 250-250 |  | game/Arena.room | portato |
| | challenge | campo | 252-252 |  | game/Challenges.challenge | portato |
| | challengeSpot | campo | 253-253 |  | game/Challenges.challengeSpot | portato |
| | busStops | campo | 254-254 |  | game/Travel.busStops | portato |
| | homing | campo | 255-255 |  | game/Rewards.homing | portato |
| | bossIntroShown | campo | 256-256 |  | game/Bosses.introShown | portato |
| | exitLockToastAt | campo | 257-257 |  | game/Progression.exitLockToastAt (B13: era in RestartCarry, ora rinasce a ogni vita) | portato |
| | lamettaCenter | campo | 259-259 |  | game/chapters/santuario.lamettaCenter | portato |
| | lamettaActive | campo | 260-260 |  | game/chapters/santuario.lamettaActive | portato |
| | lamettaFloorY | campo | 261-261 |  | game/chapters/santuario.lamettaFloorY (B13: era in RestartCarry, ora rinasce a ogni vita) | portato |
| | smelaArena | campo | 262-262 |  | game/chapters/stabilimento.smelaArena | portato |
| | acquaPuddles | campo | 263-263 |  | game/abilities/Bottiglia.puddles | portato |
| | nextLametteAt | campo | 264-264 |  | game/chapters/santuario.nextLametteAt (B13: era in RestartCarry, ora rinasce a ogni vita) | portato |
| | nextPitturaAt | campo | 265-265 |  | game/chapters/santuario.nextPitturaAt (B13: era in RestartCarry, ora rinasce a ogni vita) | portato |
| | colorDropsTaken | campo | 266-266 |  | game/chapters/santuario.colorDropsTaken | portato |
| | mirror | campo | 267-267 |  | game/chapters/santuario.mirror | portato |
| | pedroChoiceShown | campo | 268-268 |  | game/chapters/nucleo.pedroChoiceShown | portato |
| | pedroShell | campo | 270-270 |  | game/chapters/nucleo.pedroShell | portato |
| | nucleusStraightening | campo | 272-272 |  | game/chapters/nucleo.nucleusStraightening | portato |
| | pattoActive | campo | 274-274 |  | game/chapters/nucleo.pattoActive | portato |
| | finalGodsFight | campo | 277-277 |  | game/chapters/nucleo.finalGodsFight | portato |
| | pattoDeiAt | campo | 278-278 |  | game/chapters/nucleo.pattoDeiAt (B13: era in RestartCarry, ora rinasce a ogni vita) | portato |
| | pattoNextSpawnAt | campo | 279-279 |  | game/chapters/nucleo.pattoNextSpawnAt (B13: era in RestartCarry, ora rinasce a ogni vita) | portato |
| | pattoWarned | campo | 280-280 |  | game/chapters/nucleo.pattoWarned | portato |
| | scudoUntil | campo | 282-282 |  | game/abilities/Scudo.until | portato |
| | scudoGfx | campo | 283-283 |  | tolto: sempre null (DEV_LOG_REFACTOR) | portato |
| | scudoStart | campo | 284-284 |  | game/abilities/Scudo.start | portato |
| | scudoBubble | campo | 285-285 |  | game/abilities/Scudo (ScudoFx.bubble) | portato |
| | scudoBubbleGlow | campo | 286-286 |  | game/abilities/Scudo (ScudoFx.glow) | portato |
| | scudoRec | campo | 287-287 |  | game/abilities/Scudo (ScudoFx.rec) | portato |
| | acquaBottles | campo | 289-289 |  | tolto: scritto e mai letto (DEV_LOG_REFACTOR) | portato |
| | poisoned | campo | 290-290 |  | game/abilities/Veleno.poisoned | portato |
| | chaseSprite | campo | 292-292 |  | game/chapters/tana.chaseSprite | portato |
| | chaseLastSeen | campo | 293-293 |  | game/chapters/tana.chaseLastSeen (B13: era in RestartCarry, ora rinasce a ogni vita) | portato |
| | chaseWhisperAt | campo | 294-294 |  | game/chapters/tana.chaseWhisperAt | portato |
| | chaseWhisperIdx | campo | 295-295 |  | game/chapters/tana.chaseWhisperIdx | portato |
| | chaseTrail | campo | 296-296 |  | game/chapters/tana.chaseTrail | portato |
| | chaseStarts | campo | 297-297 |  | game/chapters/tana.chaseStarts | portato |
| | chaseEnds | campo | 298-298 |  | game/chapters/tana.chaseEnds | portato |
| | chaseZoneIdx | campo | 299-299 |  | game/chapters/tana.chaseZoneIdx | portato |
| | chaseStartedAt | campo | 300-300 |  | game/chapters/tana.chaseStartedAt (B13: era in RestartCarry, ora rinasce a ogni vita) | portato |
| | chaseDone | campo | 301-301 |  | game/chapters/tana.chaseDone | portato |
| | chaseNearSince | campo | 303-303 |  | game/chapters/tana.chaseNearSince | portato |
| | chaseTiredUntil | campo | 304-304 |  | game/chapters/tana.chaseTiredUntil | portato |
| | ospite12Sprite | campo | 306-306 |  | game/chapters/tana.ospite12Sprite | portato |
| | ospite12Interact | campo | 307-307 |  | game/chapters/tana.ospite12Interact | portato |
| | ivanSprite | campo | 309-309 |  | game/chapters/bus.ivanSprite | portato |
| | ivanInArena | campo | 310-310 |  | game/chapters/bus.ivanInArena | portato |
| | ivanBusy | campo | 311-311 |  | game/chapters/bus.ivanBusy | portato |
| | nextIvanStrikeAt | campo | 312-312 |  | game/chapters/bus.nextIvanStrikeAt (B13: era in RestartCarry, ora rinasce a ogni vita) | portato |
| | ivanDead | campo | 313-313 |  | game/chapters/bus.ivanDead | portato |
| | companion | campo | 315-315 |  | game/chapters/shared/WalkingGuide.sprite | portato |
| | companionBaseY | campo | 316-316 |  | game/chapters/shared/WalkingGuide.baseY | portato |
| | companionInteract | campo | 317-317 |  | game/chapters/shared/WalkingGuide.entry | portato |
| | voidArenas | campo | 318-318 |  | game/chapters/void.voidArenas | portato |
| | voidStep | campo | 319-319 |  | game/chapters/void.voidStep | portato |
| | voidBusy | campo | 320-320 |  | game/chapters/void.voidBusy | portato |
| | baruffoniArenas | campo | 322-322 |  | game/chapters/walter.baruffoniArenas | portato |
| | baruffoniStep | campo | 323-323 |  | game/chapters/walter.baruffoniStep | portato |
| | baruffoniBusy | campo | 324-324 |  | game/chapters/walter.baruffoniBusy | portato |
| | collapsePedro | campo | 326-326 |  | game/Doomsday.collapsePedro | portato |
| | collapseTriggered | campo | 327-327 |  | game/Doomsday.collapseTriggered | portato |
| | doomsdayWarned | campo | 328-328 |  | game/Doomsday.doomsdayWarned | portato |
| | replacedBossKind | campo | 329-329 |  | game/Doomsday.replacedBossKind | portato |
| | replacedBossX | campo | 330-330 |  | game/Doomsday.replacedBossX | portato |
| | replacedBossY | campo | 331-331 |  | game/Doomsday.replacedBossY | portato |
| | nextWildGlitchAt | campo | 332-332 |  | game/Doomsday.nextWildGlitchAt | portato |
| | parryUntil | campo | 334-334 |  | game/Combat.parryUntil (B13: era in RestartCarry, ora rinasce a ogni vita) | portato |
| | mechanic | campo | 336-336 |  | scene/GameScene (orchestratore) | portato |
| | playerLightRef | campo | 337-337 |  | scene/GameScene (orchestratore) | portato |
| | vignette | campo | 339-339 |  | scene/GameScene (facciata del film) | portato |
| | quizAttempts | campo | 341-341 |  | game/chapters/mente.quizAttempts | portato |
| | nextLessonCheck | campo | 342-342 |  | game/Enemies.nextLessonCheck (B13: era in RestartCarry, ora rinasce a ogni vita) | portato |
| | voice | campo | 344-344 |  | game/Bosses.voice | portato |
| | ombraBrain | campo | 345-345 |  | game/Bosses.ombraBrain | portato |
| | beatMs | campo | 347-347 |  | game/Bosses.beatMs | portato |
| | nextBeatAt | campo | 348-348 |  | game/Bosses.nextBeatAt | portato |
| | constructor | costruttore | 350-352 | riflesso-senza-flow, carica-corrotto, rio-cura (+195) | scene/GameScene (orchestratore) | portato |
| | init | metodo | 354-370 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | scene/GameScene (orchestratore) | portato |
| | create | metodo | 372-753 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | scene/GameScene (orchestratore) | portato |
| | spawnEntities | metodo | 757-823 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | scene/GameScene (smista le entità ai sistemi) | portato |
| | spawnItemPickup | metodo | 826-863 | riflesso-senza-flow, rio-cura, nidi-rio (+179) | game/Rewards.spawnItemPickup | portato |
| | dropBossCharm | metodo | 866-870 | npc-spaccino-dopo-flauto, npc-ivan-dopo, npc-walter-dopo (+42) | game/Rewards.dropBossCharm | portato |
| | recoverBossReward | metodo | 873-897 | npc-spaccino-dopo-flauto, npc-ivan-dopo, npc-walter-dopo (+11) | game/Bosses.recoverReward | portato |
| | castSprite | metodo | 900-905 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | game/Npcs.castSprite | portato |
| | lightBoss | metodo | 908-911 | riflesso-senza-flow, rio-cura, nidi-rio (+168) | game/Bosses.light | portato |
| | makeBoss | metodo | 914-928 | riflesso-senza-flow, rio-cura, nidi-rio (+168) | game/Bosses.make | portato |
| | isEliteSpot | metodo | 931-938 | riflesso-senza-flow, rio-cura, nidi-rio (+186) | game/Enemies.isEliteSpot | portato |
| | traitFor | metodo | 941-956 | riflesso-senza-flow, rio-cura, nidi-rio (+186) | game/Enemies.traitFor | portato |
| | spawnEnemy | metodo | 958-969 | riflesso-senza-flow, rio-cura, nidi-rio (+187) | game/Enemies.spawnEnemy | portato |
| | spawnSpawner | metodo | 973-979 | riflesso-senza-flow, rio-cura, nidi-rio (+189) | game/Enemies.spawnSpawner | portato |
| | spawnCaveSpawners | metodo | 984-1036 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | game/Enemies.spawnCaveSpawners | portato |
| | caveSpawnerSpot | metodo | 1039-1057 | riflesso-senza-flow, rio-cura, nidi-rio (+189) | game/Enemies.caveSpawnerSpot | portato |
| | updateSpawners | metodo | 1061-1110 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | game/Enemies.updateSpawners | portato |
| | damageSpawner | metodo | 1112-1120 | nidi-stabilimento, nidi-cantina, arena-perduta (+38) | game/Enemies.damageSpawner | portato |
| | breakSpawner | metodo | 1122-1141 | nidi-stabilimento, nidi-cantina, arena-perduta (+1) | game/Enemies.breakSpawner | portato |
| | parry | metodo | 1144-1156 | arena-ruhra, cap-trenbolone-rifiuta, wave-caso (+4) | game/Combat.parry | portato |
| | onEnemyExplode | metodo | 1158-1175 | colpo-pausa, cibo, livello-nucleo (+12) | game/Combat.onEnemyExplode | portato |
| | spawnNpc | metodo | 1178-1275 | riflesso-senza-flow, rio-cura, nidi-rio (+162) | game/Npcs.spawn (+ capitoli: marker) | portato |
| | spawnOspite12 | metodo | 1278-1294 | cap-tana, cap-tana-ospite, campagna | game/chapters/tana.spawnOspite12 | portato |
| | interactNpc | metodo | 1296-1537 | npc-spaccino-dopo-flauto, npc-spaccino-fatto, npc-walter-dorme (+44) | game/Npcs.interact (+ capitoli: interact) | portato |
| | spawnPiazzaGuests | metodo | 1542-1550 | viaggio, piazza-inizio, livello-piazza (+3) | game/chapters/piazza.spawnPiazzaGuests | portato |
| | interactRomeroPiazza | metodo | 1552-1569 | piazza | game/chapters/piazza.interactRomeroPiazza | portato |
| | oracleLines | metodo | 1572-1590 | piazza-inizio, piazza-meta, piazza-fine (+1) | game/chapters/piazza.oracleLines | portato |
| | boardLines | metodo | 1593-1606 | piazza | game/chapters/piazza.boardLines | portato |
| | barRumors | metodo | 1609-1626 | piazza-inizio, piazza-meta, piazza-fine (+1) | game/chapters/piazza.barRumors | portato |
| | openPiazzaShop | metodo | 1629-1661 | piazza-inizio, piazza-meta, piazza-fine (+1) | game/chapters/piazza.openPiazzaShop | portato |
| | interactPiema | metodo | 1663-1676 | npc-piema-dopo, npc-piema-senza, cap-ruhra (+1) | game/chapters/ruhra.interactPiema | portato |
| | spawnQuizDoor | metodo | 1680-1688 | livello-mente, esplora-mente-cancella, esplora-mente-porta (+5) | game/chapters/mente.spawnQuizDoor | portato |
| | interactPorta | metodo | 1690-1725 | cap-mente, campagna | game/chapters/mente.interactPorta | portato |
| | rewardSpot | metodo | 1728-1745 | npc-ivan-dopo, sigillo-rio-resina, npc-walter-dopo (+29) | game/world/LevelWorld.rewardSpot | portato |
| | homeIn | metodo | 1748-1750 | npc-ivan-dopo, sigillo-rio-resina, npc-walter-dopo (+29) | game/Rewards.homeIn | portato |
| | updateHoming | metodo | 1752-1769 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | game/Rewards.updateHoming | portato |
| | spawnFragment | metodo | 1771-1797 | gamepad, guida-perduta, npc-ivan-dopo (+27) | game/Rewards.spawnFragment | portato |
| | spawnLore | metodo | 1799-1814 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | game/Rewards.spawnLore | portato |
| | micKey | metodo | 1816-1818 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | game/Travel.micKey | portato |
| | spawnBusStops | metodo | 1821-1834 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | game/Travel.spawnBusStops | portato |
| | setPropsVisible | metodo | 1837-1842 | film-uscita, livello-barrato, guida-void (+27) | game/Travel.setPropsVisible (+ facciata della scena) | portato |
| | updateBusStops | metodo | 1844-1853 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | game/Travel.updateBusStops | portato |
| | openTravel | metodo | 1855-1877 | viaggio, corsa-vinta, esplora-mente-cancella (+22) | game/Travel.openTravel | portato |
| | travelTo | metodo | 1880-1895 | viaggio | game/Travel.travelTo | portato |
| | spawnCheckpoints | metodo | 1897-1920 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | game/Travel.spawnCheckpoints | portato |
| | spawnDroppedBarre | metodo | 1922-1938 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | game/Rewards.spawnDroppedBarre | portato |
| | spawnBarrePickup | metodo | 1940-1955 | riflesso-senza-flow, rio-cura, nidi-rio (+189) | game/Rewards.spawnBarrePickup | portato |
| | spawnCuore | metodo | 1958-1979 | rio-cura, nidi-rio, sigillo-perduta-camino (+83) | game/Rewards.spawnCuore | portato |
| | maschereCount | metodo | 1983-1985 | esplora-ricordi, esplora-stabilimento, esplora-cantina (+32) | game/Rewards.maschereCount | portato |
| | spawnMaschera | metodo | 1987-2016 | riflesso-senza-flow, sigillo-perduta-camino, sigillo-perduta-rimbalzo (+125) | game/Rewards.spawnMaschera | portato |
| | spawnPortal | metodo | 2020-2066 | riflesso-senza-flow, sigillo-perduta-camino, sigillo-perduta-rimbalzo (+29) | game/Travel.spawnPortal | portato |
| | indiziRaccolti | metodo | 2070-2072 | npc-romero-lochef, film-coda, film-uscita (+8) | game/chapters/caso (funzione) | portato |
| | interactIndizio | metodo | 2074-2086 | film-uscita, cap-caso, campagna | game/chapters/caso.interactIndizio | portato |
| | setupColliders | metodo | 2090-2294 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | game/Combat.setupColliders | portato |
| | setupEvents | metodo | 2296-2336 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | scenes/GameScene.setupEvents | portato |
| | roomAt | metodo | 2340-2348 | riflesso-senza-flow, rio-cura, nidi-rio (+189) | game/world/LevelWorld.roomAt | portato |
| | findFlatStage | metodo | 2352-2373 | film-uscita, livello-barrato, guida-void (+27) | game/world/LevelWorld.findFlatStage (+ facciata della scena) | portato |
| | progressAt | metodo | 2376-2384 | rio-cura, nidi-rio, ridimensiona (+96) | game/world/LevelWorld.progressAt | portato |
| | progressOfOldX | metodo | 2387-2389 | rio-cura, nidi-rio, schianto-tana (+75) | game/world/LevelWorld.progressOfOldX | portato |
| | openSpotNear | metodo | 2392-2411 | spine, schianto-santuario, npc-piema-dopo (+96) | game/world/LevelWorld.openSpotNear | portato |
| | setupCamera | metodo | 2413-2434 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | scenes/GameScene.setupCamera | portato |
| | buildPrompt | metodo | 2436-2449 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | game/Interactions.buildPrompt | portato |
| | setupScript | metodo | 2453-2525 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | scene/GameScene.setupScript + capitoli: setup | portato |
| | baruffoniSeq | metodo | 2530-2532 | ridimensiona, livello-galliate, livello-marcetti (+6) | game/chapters/walter.baruffoniSeq | portato |
| | setupBaruffoni | metodo | 2534-2552 | ridimensiona, livello-galliate, livello-marcetti (+6) | game/chapters/walter.setupBaruffoni | portato |
| | spawnBaruffoniBoss | metodo | 2555-2568 | ridimensiona, livello-galliate, livello-marcetti (+6) | game/chapters/walter.spawnBaruffoniBoss | portato |
| | onBaruffoniDown | metodo | 2571-2584 | cap-walter | game/chapters/walter.onBaruffoniDown | portato |
| | onBaruffoniComplete | metodo | 2587-2590 | cap-walter | game/chapters/walter.onBaruffoniComplete | portato |
| | walterReveal | metodo | 2593-2623 | cap-walter | game/chapters/walter.walterReveal | portato |
| | updateBaruffoni | metodo | 2626-2637 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | game/chapters/walter.updateBaruffoni | portato |
| | interactWalterGuida | metodo | 2640-2644 | esplora-galliate, esplora-marcetti, cap-walter | game/chapters/walter.interactWalterGuida | portato |
| | nextRegret | metodo | 2649-2652 | trentatre, uscita-chiusa-void, livello-void (+10) | game/chapters/void.nextRegret | portato |
| | setupVoid | metodo | 2654-2678 | trentatre, uscita-chiusa-void, livello-void (+10) | game/chapters/void.setupVoid | portato |
| | spawnRegret | metodo | 2681-2689 | trentatre, livello-void, guida-void (+9) | game/chapters/void.spawnRegret | portato |
| | onVeritaRivelata | metodo | 2692-2703 | cap-void-garante-cancella, cap-void-garante-porta, cap-void (+2) | game/chapters/void.onVeritaRivelata | portato |
| | updateVoid | metodo | 2706-2720 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | game/chapters/void.updateVoid | portato |
| | moveGuide | metodo | 2724-2758 | ridimensiona, livello-galliate, livello-marcetti (+19) | game/chapters/shared/WalkingGuide.move | portato |
| | interactGuida | metodo | 2761-2768 | esplora-void, cap-void-garante-cancella, cap-void-garante-porta (+3) | game/chapters/void.interactGuida | portato |
| | interactSfida33 | metodo | 2772-2793 | trentatre, cap-void-garante-cancella, cap-void-garante-porta (+3) | game/chapters/void.interactSfida33 | portato |
| | voidClimax | metodo | 2796-2821 | uscita-chiusa-void, cap-void-garante-cancella, cap-void-garante-porta (+3) | game/chapters/void.voidClimax | portato |
| | update | metodo | 2825-2912 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | scene/GameScene (orchestratore) | portato |
| | awakeEnemies | metodo | 2915-2922 | riflesso-senza-flow, rio-cura, nidi-rio (+189) | game/Enemies.awakeEnemies | portato |
| | updateEnemies | metodo | 2926-2941 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | game/Enemies.updateEnemies | portato |
| | updateDoomsday | metodo | 2945-2996 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | game/Doomsday.update | portato |
| | updateRhythm | metodo | 3000-3009 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | game/Bosses.updateRhythm | portato |
| | updateFakeWalls | metodo | 3011-3013 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | scenes/GameScene.updateFakeWalls | portato |
| | destroyBreakableWall | metodo | 3015-3030 | schianto-santuario, cap-ricordi, cap-cantina-calpesta (+7) | game/Combat.destroyBreakableWall | portato |
| | slamLand | metodo | 3033-3060 | schianto-santuario, livello-bus, livello-santuario (+56) | game/Combat.slamLand | portato |
| | updateIvan | metodo | 3064-3093 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | game/chapters/bus.updateIvan | portato |
| | killIvanCutscene | metodo | 3095-3136 | doomsday-sollievo, wave-boss-guggu, cap-bus (+1) | game/chapters/bus.killIvanCutscene | portato |
| | ivanStrike | metodo | 3138-3190 | doomsday-sollievo, wave-boss-guggu, cap-bus (+1) | game/chapters/bus.ivanStrike | portato |
| | trackSafePosition | metodo | 3192-3203 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | game/SafeGround.track | portato |
| | checkExits | metodo | 3205-3260 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | game/Progression.checkExits | portato |
| | returnFromSecret | metodo | 3263-3275 | cap-custode, cap-barrato, cap-walter | game/Progression.returnFromSecret (Flow) | portato |
| | completeChapterAndGo | metodo | 3278-3334 | uscita-chiusa-void, cap-trenbolone, cap-mente (+27) | game/Progression.completeChapterAndGo (Flow) | portato |
| | gotoLevel | metodo | 3336-3347 | npc-spaccino-dopo-flauto, uscita-chiusa-void, cap-trenbolone (+29) | game/Progression.gotoLevel (Flow) | portato |
| | updatePrompt | metodo | 3349-3358 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | game/Interactions.updatePrompt | portato |
| | updateExplore | metodo | 3362-3377 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | game/Progression.updateExplore | portato |
| | updateTrophies | metodo | 3380-3393 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | game/Progression.updateTrophies | portato |
| | finishChapter | metodo | 3396-3422 | npc-spaccino-dopo-flauto, uscita-chiusa-void, cap-trenbolone (+29) | game/Progression.finishChapter | portato |
| | liveChapterScore | metodo | 3425-3434 | caduta, morte-barre, arena-perduta (+24) | game/Progression.liveChapterScore | portato |
| | endGame | metodo | 3437-3518 | doomsday-collasso, finale-consegna, finale-giorno30-vuoto (+7) | game/Progression.endGame (Flow) | portato |
| | currentObjective | metodo | 3521-3551 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | game/Guide.currentObjective | portato |
| | freeFragment | metodo | 3554-3575 | riflesso-senza-flow, rio-cura, nidi-rio (+184) | game/Rewards.freeFragment | portato |
| | buildGuide | metodo | 3577-3587 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | game/Guide.buildGuide | portato |
| | updateGuide | metodo | 3590-3625 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | game/Guide.updateGuide | portato |
| | updateArenaLock | metodo | 3628-3650 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | scene/GameScene.updateArenaLock + game/Arena.updateBossLock | portato |
| | doorRects | metodo | 3653-3672 | guida-santuario, guggu-senza-ivan, schianto (+64) | game/world/LevelWorld.doorRects | portato |
| | lockArena | metodo | 3674-3686 | guida-santuario, guggu-senza-ivan, schianto (+64) | game/Arena.lock | portato |
| | unlockArena | metodo | 3688-3697 | flauto-fatto, wave-boss-breccio, wave-boss-ticummi (+39) | game/Arena.unlock | portato |
| | spawnChallenge | metodo | 3702-3728 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | game/Challenges.spawnChallenge | portato |
| | challengePoints | metodo | 3730-3734 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | game/Challenges.challengePoints | portato |
| | spawnTrial | metodo | 3737-3745 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | game/Challenges.spawnTrial | portato |
| | offerChallenge | metodo | 3747-3764 | arena-perduta, arena-ruhra, arena-rio (+22) | game/Challenges.offerChallenge | portato |
| | updateChallenge | metodo | 3766-3800 | arena-perduta, arena-ruhra, arena-rio | game/Challenges.updateChallenge | portato |
| | winChallenge | metodo | 3802-3814 | arena-ruhra, arena-rio | game/Challenges.winChallenge | portato |
| | drawArenaBars | metodo | 3817-3845 | guida-santuario, guggu-senza-ivan, schianto (+64) | game/Arena.draw | portato |
| | updateBossTrigger | metodo | 3847-3913 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | game/Bosses.updateTrigger (+ capitoli: beforeBossEngage) | portato |
| | magnetBarre | metodo | 3916-3927 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | game/Enemies.magnetBarre | portato |
| | findNearestInteractable | metodo | 3929-3940 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | game/Interactions.nearest | portato |
| | tryInteract | metodo | 3942-3945 | npc-spaccino-dopo-flauto, npc-spaccino-fatto, npc-walter-dorme (+107) | scenes/GameScene.tryInteract | portato |
| | onRisonante | metodo | 3949-3969 | sigillo-santuario-risonanza, wave-boss-breccio, wave-boss-ticummi (+12) | game/abilities/Risonante.cast | portato |
| | onRiflesso | metodo | 3971-4031 | riflesso-senza-flow, sigillo-bus-specchio, wave-boss-breccio (+12) | game/abilities/Riflesso.cast | portato |
| | onRiflessoSwap | metodo | 4034-4070 | riflesso-senza-flow, sigillo-bus-specchio, wave-rio (+7) | game/abilities/Riflesso.swap | portato |
| | killClone | metodo | 4072-4080 | riflesso-senza-flow, sigillo-bus-specchio, wave-boss-breccio (+12) | game/abilities/Riflesso.kill | portato |
| | cloneHitFx | metodo | 4082-4092 | sigillo-bus-specchio, wave-boss-breccio, wave-boss-ticummi (+11) | game/abilities/Riflesso (RiflessoFx.hit) | portato |
| | nearestHostile | metodo | 4094-4108 | riflesso-senza-flow, guida-santuario, sigillo-bus-specchio (+95) | game/Enemies.nearestHostile | portato |
| | nearHostile | metodo | 4111-4115 | riflesso-senza-flow, sigillo-bus-specchio, wave-boss-breccio (+12) | game/abilities/Riflesso.nearHostile | portato |
| | updateClone | metodo | 4117-4141 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | game/abilities/Riflesso.update | portato |
| | onAnalisi | metodo | 4143-4153 | sigillo-ruhra-teorema, wave-boss-breccio, wave-boss-ticummi (+12) | game/abilities/Analisi.cast | portato |
| | updateAnalisi | metodo | 4156-4222 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | game/abilities/Analisi.update | portato |
| | markAnalisiTargets | metodo | 4225-4237 | sigillo-ruhra-teorema, wave-boss-breccio, wave-boss-ticummi (+12) | game/abilities/Analisi.markTargets | portato |
| | qedAnalisi | metodo | 4240-4260 | sigillo-ruhra-teorema, wave-boss-breccio, wave-boss-ticummi (+12) | game/abilities/Analisi.qed | portato |
| | clearAnalisiFx | metodo | 4262-4278 | sigillo-ruhra-teorema, wave-boss-breccio, wave-boss-ticummi (+12) | game/abilities/Analisi.clear | portato |
| | onScudo | metodo | 4282-4293 | sigillo-sorveglianza-ricevitore, wave-boss-breccio, wave-boss-ticummi (+13) | game/abilities/Scudo.cast | portato |
| | updateScudo | metodo | 4295-4308 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | game/abilities/Scudo.update | portato |
| | clearScudoFx | metodo | 4310-4319 | sigillo-sorveglianza-ricevitore, wave-boss-breccio, wave-boss-ticummi (+13) | game/abilities/Scudo (ScudoFx.clear) | portato |
| | refundNote | metodo | 4322-4325 | wave-boss-ticummi, rimando-sorveglianza, rimando-tecnokill | game/abilities/Scudo.refundNote | portato |
| | onAcquaTossica | metodo | 4328-4349 | sigillo-rio-resina, sigillo-trenbolone-miasma, wave-boss-breccio (+12) | game/abilities/Bottiglia.cast | portato |
| | burstBottle | metodo | 4352-4388 | sigillo-rio-resina, sigillo-trenbolone-miasma, wave-boss-breccio (+12) | game/abilities/Bottiglia.burst | portato |
| | spawnPuddle | metodo | 4390-4407 | sigillo-rio-resina, sigillo-trenbolone-miasma, wave-boss-breccio (+12) | game/abilities/Bottiglia.spawnPuddle | portato |
| | updateAcquaTossica | metodo | 4409-4452 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | game/abilities/Bottiglia.update | portato |
| | applyPoison | metodo | 4455-4459 | sigillo-rio-resina, sigillo-trenbolone-miasma, wave-boss-ticummi (+5) | game/abilities/Veleno.apply | portato |
| | updatePoison | metodo | 4461-4468 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | game/abilities/Veleno.update | portato |
| | dmgTo | metodo | 4471-4477 | schianto-santuario, sigillo-bus-specchio, sigillo-rio-resina (+73) | game/Combat.dmgTo | portato |
| | waveWorld | metodo | 4480-4488 | riflesso-senza-flow, sigillo-perduta-cortina, sigillo-bus-specchio (+56) | game/abilities/shared.waveWorld | portato |
| | updateAbilityFx | metodo | 4491-4551 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | game/abilities (Abilities.updateAbilityFx + Volo.updateFlight) | portato |
| | reflectProjectile | metodo | 4552-4585 | wave-boss-ticummi, wave-boss-guggu, wave-boss-ombra (+3) | game/abilities/Scudo.reflect | portato |
| | static CHASE_LINES | campo | 4590-4593 |  | game/chapters/tana | portato |
| | updateChase | metodo | 4595-4745 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | game/chapters/tana.updateChase | portato |
| | onTanaSniffed | metodo | 4748-4755 | tana-armadio | game/chapters/tana (sniffed) | portato |
| | updateLamettaArena | metodo | 4759-4792 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | game/chapters/santuario.updateLamettaArena | portato |
| | updateSmelaArena | metodo | 4795-4807 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | game/chapters/stabilimento.updateSmelaArena | portato |
| | spawnColorDrop | metodo | 4809-4835 | guida-santuario, lametta-attesa, esplora-santuario (+2) | game/chapters/santuario.spawnColorDrop | portato |
| | spawnMirror | metodo | 4837-4855 | cap-santuario, campagna | game/chapters/santuario.spawnMirror | portato |
| | updateWaterCure | metodo | 4859-4877 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | game/chapters/rio.updateWaterCure | portato |
| | playSmelaPoisonEffect | metodo | 4879-4935 | npc-acqua-due-volte, cap-rio-acqua, cap-rio-povero (+1) | game/chapters/shared/smela.drinkSmela | portato |
| | updateAmbush | metodo | 4937-4992 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | game/chapters/shared/Ambushes.update | portato |
| | spawnNotinoAmbush | metodo | 4995-5009 | npc-piema-dopo, carica-microfono, npc-lametta-libero (+27) | game/chapters/shared/Ambushes | portato |
| | startPatto | metodo | 5013-5045 | finale-patto | game/chapters/nucleo.startPatto | portato |
| | updatePatto | metodo | 5047-5069 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | game/chapters/nucleo.updatePatto | portato |
| | arrivoDei | metodo | 5072-5085 | finale-patto | game/chapters/nucleo.arrivoDei | portato |
| | onSpikes | metodo | 5089-5098 | spine, sigillo-santuario-risonanza, cibo (+5) | game/Combat.onSpikes | portato |
| | onEnemyShoot | metodo | 5100-5134 | guida-santuario, carica-microfono, npc-lametta-libero (+88) | game/Combat.onEnemyShoot | portato |
| | onBossLamette | metodo | 5136-5161 | schianto-santuario, guida-santuario, schianto (+25) | game/Combat.onBossLamette | portato |
| | popProjectile | metodo | 5163-5175 | guida-santuario, npc-lametta-libero, colpo-pausa (+92) | game/Combat.popProjectile | portato |
| | onEnemyDied | metodo | 5177-5202 | schianto-santuario, sigillo-rio-resina, sigillo-trenbolone-miasma (+70) | game/Enemies.onEnemyDied | portato |
| | onEnemyAlert | metodo | 5205-5211 | rio-cura, sigillo-perduta-rimbalzo, sigillo-perduta-cortina (+117) | game/Enemies.onEnemyAlert | portato |
| | onBossSummon | metodo | 5213-5217 | agguato-vendetta, trentatre, flauto-fatto (+37) | game/Enemies.onBossSummon | portato |
| | updateLessons | metodo | 5220-5235 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | game/Enemies.updateLessons | portato |
| | weakFeedback | metodo | 5238-5247 | colpo-pausa, sigillo-ruhra-teorema, nidi-stabilimento (+63) | game/Combat.weakFeedback | portato |
| | onBossEngaged | metodo | 5250-5275 | schianto-santuario, guida-santuario, guggu-senza-ivan (+81) | game/Bosses.onEngaged | portato |
| | onOmbraInsight | metodo | 5278-5300 | ombra-beta, wave-boss-ombra, cap-sorveglianza (+3) | game/Bosses.onOmbraInsight | portato |
| | silenceBoss | metodo | 5302-5307 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | game/Bosses.silence | portato |
| | onBossDefeated | metodo | 5309-5542 | trentatre, flauto-fatto, doomsday-respinto (+39) | game/Bosses.onDefeated (+ Doomsday.repel, capitoli: bossDefeated) | portato |
| | giorno30 | metodo | 5545-5576 | finale-giorno30-vuoto, finale-riscatto-senza-caso, finale-riscatto-solo (+1) | game/chapters/nucleo.giorno30 | portato |
| | startOrder | metodo | 5579-5603 | finale-riscatto-senza-caso, finale-riscatto-solo, finale-riscatto | game/chapters/nucleo.startOrder | portato |
| | sceltaFinale | metodo | 5606-5650 | finale-consegna, finale-giorno30-vuoto, finale-riscatto-senza-caso (+5) | game/chapters/nucleo.sceltaFinale | portato |
| | setupBossColliders | metodo | 5653-5682 | ridimensiona, livello-galliate, livello-marcetti (+28) | game/Combat.setupBossColliders | portato |
| | onPlayerDead | metodo | 5684-5713 | npc-acqua-due-volte, caduta, morte-barre (+18) | game/Progression.onPlayerDead | portato |
| | activateCheckpoint | metodo | 5715-5743 | livello-tana, piazza, esplora-mente-cancella (+21) | game/Travel.activateCheckpoint | portato |
| | threats | metodo | 5746-5755 | riflesso-senza-flow, rio-cura, nidi-rio (+194) | game/Enemies.threats + scene/GameScene.threats (lochef) | portato |
| | startDialogue | metodo | 5757-5772 | rio-cura, nidi-rio, ridimensiona (+133) | game/Dialogues.start | portato |
| | startLines | metodo | 5775-5788 | rio-cura, nidi-rio, ridimensiona (+132) | game/Dialogues.lines | portato |
| | hitstop | metodo | 5792-5799 | colpo-pausa, nidi-stabilimento, nidi-cantina (+63) | game/Feel.hitstop | portato |
| | shake | metodo | 5801-5803 | rio-cura, nidi-rio, schianto-tana (+138) | game/Feel.shake | portato |

