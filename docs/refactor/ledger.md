# registro del refactor

Ogni membro delle classi toccate, con le righe su main (`a16f39c`). **destinazione**: dove finisce nel codice nuovo; **stato**: da fare, portato, verificato. Una riga senza destinazione e senza verifica non è portata.
Gli scenari sono quelli che eseguono la prima istruzione del metodo (copertura per scenario), i più corti per primi. Generato da `scripts/harness/ledger.mjs`: destinazione e stato scritti a mano si conservano.

Metodi eseguiti da almeno uno scenario: 184/186.

## src/scenes/GameScene.ts

| | membro | tipo | righe | scenari | destinazione | stato |
|---|---|---|---|---|---|---|
| | def | campo | 159-159 |  | LevelWorld (proposta) | da fare |
| | layout | campo | 161-161 |  | LevelWorld (proposta) | da fare |
| | roomBySlot | campo | 163-163 |  | LevelWorld (proposta) | da fare |
| | level | campo | 164-164 |  | LevelWorld (proposta) | da fare |
| | nav | campo | 166-166 |  | LevelWorld (proposta) | da fare |
| | player | campo | 167-167 |  | Orchestratore (proposta) | da fare |
| | controls | campo | 169-169 |  | Orchestratore (proposta) | da fare |
| | boss | campo | 170-170 |  | Bosses (proposta) | da fare |
| | enemies | campo | 171-171 |  | Enemies (proposta) | da fare |
| | spawners | campo | 173-173 |  | Enemies (proposta) | da fare |
| | spawnerToastShown | campo | 174-174 |  | Enemies (proposta) | da fare |
| | threatCache | campo | 176-176 |  | Enemies (proposta) | da fare |
| | playerProjectiles | campo | 177-177 |  | Combat (proposta) | da fare |
| | enemyProjectiles | campo | 178-178 |  | Combat (proposta) | da fare |
| | lametteGroup | campo | 179-179 |  | Combat (proposta) | da fare |
| | barreGroup | campo | 180-180 |  | Enemies (proposta) | da fare |
| | doorGroup | campo | 181-181 |  | script: mente (porte del quiz) (proposta) | da fare |
| | interactables | campo | 182-182 |  | Interazioni (proposta) | da fare |
| | prompt | campo | 183-183 |  | Interazioni (proposta) | da fare |
| | promptTxt | campo | 184-184 |  | Interazioni (proposta) | da fare |
| | lastSafe | campo | 185-185 |  | Progressione (proposta) | da fare |
| | safeTimer | campo | 186-186 |  | Progressione (proposta) | da fare |
| | exiting | campo | 187-187 |  | Progressione (proposta) | da fare |
| | checkpointSprites | campo | 188-188 |  | Progressione (proposta) | da fare |
| | propDressing | campo | 190-190 |  | Progressione (proposta) | da fare |
| | lighting | campo | 191-191 |  | LevelWorld (proposta) | da fare |
| | parallax | campo | 192-192 |  | LevelWorld (proposta) | da fare |
| | biome | campo | 193-193 |  | LevelWorld (proposta) | da fare |
| | terrain | campo | 194-194 |  | LevelWorld (proposta) | da fare |
| | ambience | campo | 195-195 |  | LevelWorld (proposta) | da fare |
| | water | campo | 196-196 |  | LevelWorld (proposta) | da fare |
| | clone | campo | 197-197 |  | Abilities (proposta) | da fare |
| | cloneUntil | campo | 198-198 |  | Abilities (proposta) | da fare |
| | cloneColliders | campo | 199-199 |  | Abilities (proposta) | da fare |
| | cloneTwin | campo | 200-200 |  | Abilities (proposta) | da fare |
| | cloneJitterAt | campo | 201-201 |  | Abilities (proposta) | da fare |
| | cloneWaveAt | campo | 202-202 |  | Abilities (proposta) | da fare |
| | cloneSwapUsed | campo | 203-203 |  | Abilities (proposta) | da fare |
| | cloneAlive | get | 205-207 | riflesso-senza-flow, sigillo-bus-specchio, wave-rio (+7) | Abilities (proposta) | da fare |
| | analisiUntil | campo | 208-208 |  | Abilities (proposta) | da fare |
| | nextAnalisiTick | campo | 209-209 |  | Abilities (proposta) | da fare |
| | analisiGlyphs | campo | 210-210 |  | Abilities (proposta) | da fare |
| | analisiPhase | campo | 211-211 |  | Abilities (proposta) | da fare |
| | analisiStart | campo | 212-212 |  | Abilities (proposta) | da fare |
| | analisiQedDone | campo | 213-213 |  | Abilities (proposta) | da fare |
| | analisiMarked | campo | 214-214 |  | Abilities (proposta) | da fare |
| | analisiMarks | campo | 215-215 |  | Abilities (proposta) | da fare |
| | analisiBossMarked | campo | 216-216 |  | Abilities (proposta) | da fare |
| | analisiCircle | campo | 217-217 |  | Abilities (proposta) | da fare |
| | analisiQed | campo | 218-218 |  | Abilities (proposta) | da fare |
| | lastCooldownEmit | campo | 219-219 |  | Abilities (proposta) | da fare |
| | lastDashWaveAt | campo | 220-220 |  | Abilities (proposta) | da fare |
| | guide | campo | 221-221 |  | Progressione (proposta) | da fare |
| | guideCacheKey | campo | 223-223 |  | Progressione (proposta) | da fare |
| | guideCache | campo | 224-224 |  | Progressione (proposta) | da fare |
| | liveFragments | campo | 226-226 |  | Rewards (proposta) | da fare |
| | folk | campo | 227-227 |  | Orchestratore (proposta) | da fare |
| | traps | campo | 228-228 |  | Orchestratore (proposta) | da fare |
| | hazards | campo | 229-229 |  | Orchestratore (proposta) | da fare |
| | trial | campo | 230-230 |  | Sfide (proposta) | da fare |
| | story | campo | 231-231 |  | Orchestratore (proposta) | da fare |
| | pedroGhost | campo | 232-232 |  | Orchestratore (proposta) | da fare |
| | marks33 | campo | 233-233 |  | Orchestratore (proposta) | da fare |
| | seals | campo | 235-235 |  | Orchestratore (proposta) | da fare |
| | staging | campo | 236-236 |  | Orchestratore (proposta) | da fare |
| | quests | campo | 237-237 |  | Orchestratore (proposta) | da fare |
| | atmosphere | campo | 238-238 |  | Orchestratore (proposta) | da fare |
| | soundscape | campo | 239-239 |  | Orchestratore (proposta) | da fare |
| | nextTrophyCheckAt | campo | 240-240 |  | Progressione (proposta) | da fare |
| | bossFight | campo | 242-242 |  | Bosses (proposta) | da fare |
| | guideGfx | campo | 243-243 |  | Progressione (proposta) | da fare |
| | lastRoom | campo | 244-244 |  | Progressione (proposta) | da fare |
| | npcAt | campo | 246-246 |  | Npc (proposta) | da fare |
| | arenaBars | campo | 248-248 |  | Arena (proposta) | da fare |
| | arenaGfx | campo | 249-249 |  | Arena (proposta) | da fare |
| | arenaRoom | campo | 250-250 |  | Arena (proposta) | da fare |
| | challenge | campo | 252-252 |  | Sfide (proposta) | da fare |
| | challengeSpot | campo | 253-253 |  | Sfide (proposta) | da fare |
| | busStops | campo | 254-254 |  | Progressione (proposta) | da fare |
| | homing | campo | 255-255 |  | Rewards (proposta) | da fare |
| | bossIntroShown | campo | 256-256 |  | Bosses (proposta) | da fare |
| | exitLockToastAt | campo | 257-257 |  | Bosses (proposta) | da fare |
| | lamettaCenter | campo | 259-259 |  | script: santuario (proposta) | da fare |
| | lamettaActive | campo | 260-260 |  | script: santuario (proposta) | da fare |
| | lamettaFloorY | campo | 261-261 |  | script: santuario (proposta) | da fare |
| | smelaArena | campo | 262-262 |  | script: stabilimento (proposta) | da fare |
| | acquaPuddles | campo | 263-263 |  | Abilities (proposta) | da fare |
| | nextLametteAt | campo | 264-264 |  | script: santuario (proposta) | da fare |
| | nextPitturaAt | campo | 265-265 |  | script: santuario (proposta) | da fare |
| | colorDropsTaken | campo | 266-266 |  | script: santuario (proposta) | da fare |
| | mirror | campo | 267-267 |  | script: santuario (proposta) | da fare |
| | pedroChoiceShown | campo | 268-268 |  | script: nucleo (proposta) | da fare |
| | pedroShell | campo | 270-270 |  | script: nucleo (proposta) | da fare |
| | nucleusStraightening | campo | 272-272 |  | script: nucleo (proposta) | da fare |
| | pattoActive | campo | 274-274 |  | script: nucleo (proposta) | da fare |
| | finalGodsFight | campo | 277-277 |  | script: nucleo (proposta) | da fare |
| | pattoDeiAt | campo | 278-278 |  | script: nucleo (proposta) | da fare |
| | pattoNextSpawnAt | campo | 279-279 |  | script: nucleo (proposta) | da fare |
| | pattoWarned | campo | 280-280 |  | script: nucleo (proposta) | da fare |
| | scudoUntil | campo | 282-282 |  | Abilities (proposta) | da fare |
| | scudoGfx | campo | 283-283 |  | Abilities (proposta) | da fare |
| | scudoStart | campo | 284-284 |  | Abilities (proposta) | da fare |
| | scudoBubble | campo | 285-285 |  | Abilities (proposta) | da fare |
| | scudoBubbleGlow | campo | 286-286 |  | Abilities (proposta) | da fare |
| | scudoRec | campo | 287-287 |  | Abilities (proposta) | da fare |
| | acquaBottles | campo | 289-289 |  | Abilities (proposta) | da fare |
| | poisoned | campo | 290-290 |  | Abilities (proposta) | da fare |
| | chaseSprite | campo | 292-292 |  | script: tana (proposta) | da fare |
| | chaseLastSeen | campo | 293-293 |  | script: tana (proposta) | da fare |
| | chaseWhisperAt | campo | 294-294 |  | script: tana (proposta) | da fare |
| | chaseWhisperIdx | campo | 295-295 |  | script: tana (proposta) | da fare |
| | chaseTrail | campo | 296-296 |  | script: tana (proposta) | da fare |
| | chaseStarts | campo | 297-297 |  | script: tana (proposta) | da fare |
| | chaseEnds | campo | 298-298 |  | script: tana (proposta) | da fare |
| | chaseZoneIdx | campo | 299-299 |  | script: tana (proposta) | da fare |
| | chaseStartedAt | campo | 300-300 |  | script: tana (proposta) | da fare |
| | chaseDone | campo | 301-301 |  | script: tana (proposta) | da fare |
| | chaseNearSince | campo | 303-303 |  | script: tana (proposta) | da fare |
| | chaseTiredUntil | campo | 304-304 |  | script: tana (proposta) | da fare |
| | ospite12Sprite | campo | 306-306 |  | script: tana (proposta) | da fare |
| | ospite12Interact | campo | 307-307 |  | script: tana (proposta) | da fare |
| | ivanSprite | campo | 309-309 |  | script: bus (proposta) | da fare |
| | ivanInArena | campo | 310-310 |  | script: bus (proposta) | da fare |
| | ivanBusy | campo | 311-311 |  | script: bus (proposta) | da fare |
| | nextIvanStrikeAt | campo | 312-312 |  | script: bus (proposta) | da fare |
| | ivanDead | campo | 313-313 |  | script: bus (proposta) | da fare |
| | companion | campo | 315-315 |  | script: guide (void, walter) (proposta) | da fare |
| | companionBaseY | campo | 316-316 |  | script: guide (void, walter) (proposta) | da fare |
| | companionInteract | campo | 317-317 |  | script: guide (void, walter) (proposta) | da fare |
| | voidArenas | campo | 318-318 |  | script: void (proposta) | da fare |
| | voidStep | campo | 319-319 |  | script: void (proposta) | da fare |
| | voidBusy | campo | 320-320 |  | script: void (proposta) | da fare |
| | baruffoniArenas | campo | 322-322 |  | script: walter (proposta) | da fare |
| | baruffoniStep | campo | 323-323 |  | script: walter (proposta) | da fare |
| | baruffoniBusy | campo | 324-324 |  | script: walter (proposta) | da fare |
| | collapsePedro | campo | 326-326 |  | Doomsday (proposta) | da fare |
| | collapseTriggered | campo | 327-327 |  | Doomsday (proposta) | da fare |
| | doomsdayWarned | campo | 328-328 |  | Doomsday (proposta) | da fare |
| | replacedBossKind | campo | 329-329 |  | Doomsday (proposta) | da fare |
| | replacedBossX | campo | 330-330 |  | Doomsday (proposta) | da fare |
| | replacedBossY | campo | 331-331 |  | Doomsday (proposta) | da fare |
| | nextWildGlitchAt | campo | 332-332 |  | Doomsday (proposta) | da fare |
| | parryUntil | campo | 334-334 |  | Combat (proposta) | da fare |
| | mechanic | campo | 336-336 |  | Orchestratore (proposta) | da fare |
| | playerLightRef | campo | 337-337 |  | LevelWorld (proposta) | da fare |
| | vignette | campo | 339-339 |  | LevelWorld (proposta) | da fare |
| | quizAttempts | campo | 341-341 |  | script: mente (proposta) | da fare |
| | nextLessonCheck | campo | 342-342 |  | Enemies (proposta) | da fare |
| | voice | campo | 344-344 |  | Bosses (proposta) | da fare |
| | ombraBrain | campo | 345-345 |  | Bosses (proposta) | da fare |
| | beatMs | campo | 347-347 |  | Bosses (proposta) | da fare |
| | nextBeatAt | campo | 348-348 |  | Bosses (proposta) | da fare |
| | constructor | costruttore | 350-352 | riflesso-senza-flow, carica-corrotto, rio-cura (+193) | Orchestratore (proposta) | da fare |
| | init | metodo | 354-370 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | LevelWorld (proposta) | da fare |
| | create | metodo | 372-753 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | LevelWorld (proposta) | da fare |
| | spawnEntities | metodo | 757-823 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | Orchestratore: smista le entità ai sistemi (proposta) | da fare |
| | spawnItemPickup | metodo | 826-863 | riflesso-senza-flow, rio-cura, nidi-rio (+177) | Rewards (proposta) | da fare |
| | dropBossCharm | metodo | 866-870 | npc-spaccino-dopo-flauto, npc-ivan-dopo, npc-walter-dopo (+42) | Bosses (proposta) | da fare |
| | recoverBossReward | metodo | 873-897 | npc-spaccino-dopo-flauto, npc-ivan-dopo, npc-walter-dopo (+11) | Bosses (proposta) | da fare |
| | castSprite | metodo | 900-905 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | Npc (proposta) | da fare |
| | lightBoss | metodo | 908-911 | riflesso-senza-flow, rio-cura, nidi-rio (+166) | Bosses (proposta) | da fare |
| | makeBoss | metodo | 914-928 | riflesso-senza-flow, rio-cura, nidi-rio (+166) | Bosses (proposta) | da fare |
| | isEliteSpot | metodo | 931-938 | riflesso-senza-flow, rio-cura, nidi-rio (+184) | Enemies (proposta) | da fare |
| | traitFor | metodo | 941-956 | riflesso-senza-flow, rio-cura, nidi-rio (+184) | Enemies (proposta) | da fare |
| | spawnEnemy | metodo | 958-969 | riflesso-senza-flow, rio-cura, nidi-rio (+185) | Enemies (proposta) | da fare |
| | spawnSpawner | metodo | 973-979 | riflesso-senza-flow, rio-cura, nidi-rio (+187) | Enemies (proposta) | da fare |
| | spawnCaveSpawners | metodo | 984-1036 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | Enemies (proposta) | da fare |
| | caveSpawnerSpot | metodo | 1039-1057 | riflesso-senza-flow, rio-cura, nidi-rio (+187) | Enemies (proposta) | da fare |
| | updateSpawners | metodo | 1061-1110 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | Enemies (proposta) | da fare |
| | damageSpawner | metodo | 1112-1120 | nidi-stabilimento, nidi-cantina, arena-perduta (+38) | Enemies (proposta) | da fare |
| | breakSpawner | metodo | 1122-1141 | nidi-stabilimento, nidi-cantina, arena-perduta (+1) | Enemies (proposta) | da fare |
| | parry | metodo | 1144-1156 | arena-ruhra, cap-trenbolone-rifiuta, wave-caso (+4) | Combat (proposta) | da fare |
| | onEnemyExplode | metodo | 1158-1175 | colpo-pausa, cibo, livello-nucleo (+12) | Combat (proposta) | da fare |
| | spawnNpc | metodo | 1178-1275 | riflesso-senza-flow, rio-cura, nidi-rio (+161) | Npc (proposta) | da fare |
| | spawnOspite12 | metodo | 1278-1294 | cap-tana, cap-tana-ospite, campagna | script: tana (proposta) | da fare |
| | interactNpc | metodo | 1296-1537 | npc-spaccino-dopo-flauto, npc-spaccino-fatto, npc-walter-dorme (+44) | Npc (proposta) | da fare |
| | spawnPiazzaGuests | metodo | 1542-1550 | viaggio, piazza-inizio, livello-piazza (+3) | Npc (proposta) | da fare |
| | interactRomeroPiazza | metodo | 1552-1569 | piazza | Npc (proposta) | da fare |
| | oracleLines | metodo | 1572-1590 | piazza-inizio, piazza-meta, piazza-fine (+1) | Npc (proposta) | da fare |
| | boardLines | metodo | 1593-1606 | piazza | Npc (proposta) | da fare |
| | barRumors | metodo | 1609-1626 | piazza-inizio, piazza-meta, piazza-fine (+1) | Npc (proposta) | da fare |
| | openPiazzaShop | metodo | 1629-1661 | piazza-inizio, piazza-meta, piazza-fine (+1) | Npc (proposta) | da fare |
| | interactPiema | metodo | 1663-1676 | npc-piema-dopo, npc-piema-senza, cap-ruhra (+1) | Npc (proposta) | da fare |
| | spawnQuizDoor | metodo | 1680-1688 | livello-mente, esplora-mente-cancella, esplora-mente-porta (+5) | script: mente (proposta) | da fare |
| | interactPorta | metodo | 1690-1725 | cap-mente, campagna | script: mente (proposta) | da fare |
| | rewardSpot | metodo | 1728-1745 | npc-ivan-dopo, sigillo-rio-resina, npc-walter-dopo (+29) | LevelWorld (proposta) | da fare |
| | homeIn | metodo | 1748-1750 | npc-ivan-dopo, sigillo-rio-resina, npc-walter-dopo (+29) | Rewards (proposta) | da fare |
| | updateHoming | metodo | 1752-1769 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | Rewards (proposta) | da fare |
| | spawnFragment | metodo | 1771-1797 | gamepad, guida-perduta, npc-ivan-dopo (+27) | Rewards (proposta) | da fare |
| | spawnLore | metodo | 1799-1814 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | Rewards (proposta) | da fare |
| | micKey | metodo | 1816-1818 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | Progressione (proposta) | da fare |
| | spawnBusStops | metodo | 1821-1834 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | Progressione (proposta) | da fare |
| | setPropsVisible | metodo | 1837-1842 | film-uscita, livello-barrato, guida-void (+27) | Progressione (proposta) | da fare |
| | updateBusStops | metodo | 1844-1853 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | Progressione (proposta) | da fare |
| | openTravel | metodo | 1855-1877 | viaggio, corsa-vinta, esplora-mente-cancella (+22) | Progressione (proposta) | da fare |
| | travelTo | metodo | 1880-1895 | viaggio | Progressione (proposta) | da fare |
| | spawnCheckpoints | metodo | 1897-1920 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | Progressione (proposta) | da fare |
| | spawnDroppedBarre | metodo | 1922-1938 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | Rewards (proposta) | da fare |
| | spawnBarrePickup | metodo | 1940-1955 | riflesso-senza-flow, rio-cura, nidi-rio (+187) | Rewards (proposta) | da fare |
| | spawnCuore | metodo | 1958-1979 | rio-cura, nidi-rio, sigillo-perduta-camino (+82) | Rewards (proposta) | da fare |
| | maschereCount | metodo | 1983-1985 | esplora-ricordi, esplora-stabilimento, esplora-cantina (+32) | Rewards (proposta) | da fare |
| | spawnMaschera | metodo | 1987-2016 | riflesso-senza-flow, sigillo-perduta-camino, sigillo-perduta-rimbalzo (+123) | Rewards (proposta) | da fare |
| | spawnPortal | metodo | 2020-2066 | riflesso-senza-flow, sigillo-perduta-camino, sigillo-perduta-rimbalzo (+29) | Progressione (proposta) | da fare |
| | indiziRaccolti | metodo | 2070-2072 | npc-romero-lochef, film-coda, film-uscita (+8) | script: caso (proposta) | da fare |
| | interactIndizio | metodo | 2074-2086 | film-uscita, cap-caso, campagna | script: caso (proposta) | da fare |
| | setupColliders | metodo | 2090-2294 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | Combat (proposta) | da fare |
| | setupEvents | metodo | 2296-2336 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | Eventi (proposta) | da fare |
| | roomAt | metodo | 2340-2348 | riflesso-senza-flow, rio-cura, nidi-rio (+187) | LevelWorld (proposta) | da fare |
| | findFlatStage | metodo | 2352-2373 | film-uscita, livello-barrato, guida-void (+27) | LevelWorld (proposta) | da fare |
| | progressAt | metodo | 2376-2384 | rio-cura, nidi-rio, ridimensiona (+95) | LevelWorld (proposta) | da fare |
| | progressOfOldX | metodo | 2387-2389 | rio-cura, nidi-rio, schianto-tana (+74) | LevelWorld (proposta) | da fare |
| | openSpotNear | metodo | 2392-2411 | spine, schianto-santuario, npc-piema-dopo (+94) | LevelWorld (proposta) | da fare |
| | setupCamera | metodo | 2413-2434 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | LevelWorld (proposta) | da fare |
| | buildPrompt | metodo | 2436-2449 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | Interazioni (proposta) | da fare |
| | setupScript | metodo | 2453-2525 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | script: messaggi (proposta) | da fare |
| | baruffoniSeq | metodo | 2530-2532 | ridimensiona, livello-galliate, livello-marcetti (+6) | script: walter (proposta) | da fare |
| | setupBaruffoni | metodo | 2534-2552 | ridimensiona, livello-galliate, livello-marcetti (+6) | script: walter (proposta) | da fare |
| | spawnBaruffoniBoss | metodo | 2555-2568 | ridimensiona, livello-galliate, livello-marcetti (+6) | script: walter (proposta) | da fare |
| | onBaruffoniDown | metodo | 2571-2584 | cap-walter | script: walter (proposta) | da fare |
| | onBaruffoniComplete | metodo | 2587-2590 | cap-walter | script: walter (proposta) | da fare |
| | walterReveal | metodo | 2593-2623 | cap-walter | script: walter (proposta) | da fare |
| | updateBaruffoni | metodo | 2626-2637 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | script: walter (proposta) | da fare |
| | interactWalterGuida | metodo | 2640-2644 | esplora-galliate, esplora-marcetti, cap-walter | script: walter (proposta) | da fare |
| | nextRegret | metodo | 2649-2652 | trentatre, uscita-chiusa-void, livello-void (+10) | script: void (proposta) | da fare |
| | setupVoid | metodo | 2654-2678 | trentatre, uscita-chiusa-void, livello-void (+10) | script: void (proposta) | da fare |
| | spawnRegret | metodo | 2681-2689 | trentatre, livello-void, guida-void (+9) | script: void (proposta) | da fare |
| | onVeritaRivelata | metodo | 2692-2703 | cap-void-garante-cancella, cap-void-garante-porta, cap-void (+2) | script: void (proposta) | da fare |
| | updateVoid | metodo | 2706-2720 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | script: void (proposta) | da fare |
| | moveGuide | metodo | 2724-2758 | ridimensiona, livello-galliate, livello-marcetti (+19) | script: guide (void, walter) (proposta) | da fare |
| | interactGuida | metodo | 2761-2768 | esplora-void, cap-void-garante-cancella, cap-void-garante-porta (+3) | script: void (proposta) | da fare |
| | interactSfida33 | metodo | 2772-2793 | trentatre, cap-void-garante-cancella, cap-void-garante-porta (+3) | script: void (proposta) | da fare |
| | voidClimax | metodo | 2796-2821 | uscita-chiusa-void, cap-void-garante-cancella, cap-void-garante-porta (+3) | script: void (proposta) | da fare |
| | update | metodo | 2825-2912 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | Orchestratore (proposta) | da fare |
| | awakeEnemies | metodo | 2915-2922 | riflesso-senza-flow, rio-cura, nidi-rio (+187) | Enemies (proposta) | da fare |
| | updateEnemies | metodo | 2926-2941 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | Enemies (proposta) | da fare |
| | updateDoomsday | metodo | 2945-2996 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | Doomsday (proposta) | da fare |
| | updateRhythm | metodo | 3000-3009 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | Bosses (proposta) | da fare |
| | updateFakeWalls | metodo | 3011-3013 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | LevelWorld (proposta) | da fare |
| | destroyBreakableWall | metodo | 3015-3030 | schianto-santuario, cap-ricordi, cap-cantina-calpesta (+7) | LevelWorld (proposta) | da fare |
| | slamLand | metodo | 3033-3060 | schianto-santuario, livello-bus, livello-santuario (+56) | Combat (proposta) | da fare |
| | updateIvan | metodo | 3064-3093 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | script: bus (proposta) | da fare |
| | killIvanCutscene | metodo | 3095-3136 | doomsday-sollievo, wave-boss-guggu, cap-bus (+1) | script: bus (proposta) | da fare |
| | ivanStrike | metodo | 3138-3190 | doomsday-sollievo, wave-boss-guggu, cap-bus (+1) | script: bus (proposta) | da fare |
| | trackSafePosition | metodo | 3192-3203 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | Progressione (proposta) | da fare |
| | checkExits | metodo | 3205-3260 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | Progressione (proposta) | da fare |
| | returnFromSecret | metodo | 3263-3275 | cap-custode, cap-barrato, cap-walter | Progressione (proposta) | da fare |
| | completeChapterAndGo | metodo | 3278-3334 | uscita-chiusa-void, cap-trenbolone, cap-mente (+27) | Progressione (proposta) | da fare |
| | gotoLevel | metodo | 3336-3347 | npc-spaccino-dopo-flauto, uscita-chiusa-void, cap-trenbolone (+29) | Progressione (proposta) | da fare |
| | updatePrompt | metodo | 3349-3358 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | Interazioni (proposta) | da fare |
| | updateExplore | metodo | 3362-3377 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | Progressione (proposta) | da fare |
| | updateTrophies | metodo | 3380-3393 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | Progressione (proposta) | da fare |
| | finishChapter | metodo | 3396-3422 | npc-spaccino-dopo-flauto, uscita-chiusa-void, cap-trenbolone (+29) | Progressione (proposta) | da fare |
| | liveChapterScore | metodo | 3425-3434 | caduta, morte-barre, arena-perduta (+24) | Progressione (proposta) | da fare |
| | endGame | metodo | 3437-3518 | doomsday-collasso, finale-patto, finale-consegna (+7) | Progressione (proposta) | da fare |
| | currentObjective | metodo | 3521-3551 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | Progressione (proposta) | da fare |
| | freeFragment | metodo | 3554-3575 | riflesso-senza-flow, rio-cura, nidi-rio (+182) | Rewards (proposta) | da fare |
| | buildGuide | metodo | 3577-3587 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | Progressione (proposta) | da fare |
| | updateGuide | metodo | 3590-3625 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | Progressione (proposta) | da fare |
| | updateArenaLock | metodo | 3628-3650 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | Arena (proposta) | da fare |
| | doorRects | metodo | 3653-3672 | guida-santuario, guggu-senza-ivan, schianto (+64) | LevelWorld (proposta) | da fare |
| | lockArena | metodo | 3674-3686 | guida-santuario, guggu-senza-ivan, schianto (+64) | Arena (proposta) | da fare |
| | unlockArena | metodo | 3688-3697 | flauto-fatto, wave-boss-breccio, wave-boss-ticummi (+39) | Arena (proposta) | da fare |
| | spawnChallenge | metodo | 3702-3728 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | Sfide (proposta) | da fare |
| | challengePoints | metodo | 3730-3734 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | Sfide (proposta) | da fare |
| | spawnTrial | metodo | 3737-3745 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | Sfide (proposta) | da fare |
| | offerChallenge | metodo | 3747-3764 | arena-perduta, arena-ruhra, arena-rio (+22) | Sfide (proposta) | da fare |
| | updateChallenge | metodo | 3766-3800 | arena-perduta, arena-ruhra, arena-rio | Sfide (proposta) | da fare |
| | winChallenge | metodo | 3802-3814 | arena-ruhra, arena-rio | Sfide (proposta) | da fare |
| | drawArenaBars | metodo | 3817-3845 | guida-santuario, guggu-senza-ivan, schianto (+64) | Arena (proposta) | da fare |
| | updateBossTrigger | metodo | 3847-3913 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | Bosses (proposta) | da fare |
| | magnetBarre | metodo | 3916-3927 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | Enemies (proposta) | da fare |
| | findNearestInteractable | metodo | 3929-3940 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | Interazioni (proposta) | da fare |
| | tryInteract | metodo | 3942-3945 | npc-spaccino-dopo-flauto, npc-spaccino-fatto, npc-walter-dorme (+107) | Interazioni (proposta) | da fare |
| | onRisonante | metodo | 3949-3969 | sigillo-santuario-risonanza, wave-boss-breccio, wave-boss-ticummi (+12) | Abilities (proposta) | da fare |
| | onRiflesso | metodo | 3971-4031 | riflesso-senza-flow, sigillo-bus-specchio, wave-boss-breccio (+12) | Abilities (proposta) | da fare |
| | onRiflessoSwap | metodo | 4034-4070 | riflesso-senza-flow, sigillo-bus-specchio, wave-rio (+7) | Abilities (proposta) | da fare |
| | killClone | metodo | 4072-4080 | riflesso-senza-flow, sigillo-bus-specchio, wave-boss-breccio (+12) | Abilities (proposta) | da fare |
| | cloneHitFx | metodo | 4082-4092 | sigillo-bus-specchio, wave-boss-breccio, wave-boss-ticummi (+11) | Abilities (proposta) | da fare |
| | nearestHostile | metodo | 4094-4108 | riflesso-senza-flow, guida-santuario, sigillo-bus-specchio (+94) | Combat (proposta) | da fare |
| | nearHostile | metodo | 4111-4115 | riflesso-senza-flow, sigillo-bus-specchio, wave-boss-breccio (+12) | Abilities (proposta) | da fare |
| | updateClone | metodo | 4117-4141 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | Abilities (proposta) | da fare |
| | onAnalisi | metodo | 4143-4153 | sigillo-ruhra-teorema, wave-boss-breccio, wave-boss-ticummi (+12) | Abilities (proposta) | da fare |
| | updateAnalisi | metodo | 4156-4222 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | Abilities (proposta) | da fare |
| | markAnalisiTargets | metodo | 4225-4237 | sigillo-ruhra-teorema, wave-boss-breccio, wave-boss-ticummi (+12) | Abilities (proposta) | da fare |
| | qedAnalisi | metodo | 4240-4260 | sigillo-ruhra-teorema, wave-boss-breccio, wave-boss-ticummi (+12) | Abilities (proposta) | da fare |
| | clearAnalisiFx | metodo | 4262-4278 | sigillo-ruhra-teorema, wave-boss-breccio, wave-boss-ticummi (+12) | Abilities (proposta) | da fare |
| | onScudo | metodo | 4282-4293 | sigillo-sorveglianza-ricevitore, wave-boss-breccio, wave-boss-ticummi (+13) | Abilities (proposta) | da fare |
| | updateScudo | metodo | 4295-4308 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | Abilities (proposta) | da fare |
| | clearScudoFx | metodo | 4310-4319 | sigillo-sorveglianza-ricevitore, wave-boss-breccio, wave-boss-ticummi (+13) | Abilities (proposta) | da fare |
| | refundNote | metodo | 4322-4325 | wave-boss-ticummi, rimando-sorveglianza, rimando-tecnokill | Abilities (proposta) | da fare |
| | onAcquaTossica | metodo | 4328-4349 | sigillo-rio-resina, sigillo-trenbolone-miasma, wave-boss-breccio (+12) | Abilities (proposta) | da fare |
| | burstBottle | metodo | 4352-4388 | sigillo-rio-resina, sigillo-trenbolone-miasma, wave-boss-breccio (+12) | Abilities (proposta) | da fare |
| | spawnPuddle | metodo | 4390-4407 | sigillo-rio-resina, sigillo-trenbolone-miasma, wave-boss-breccio (+12) | Abilities (proposta) | da fare |
| | updateAcquaTossica | metodo | 4409-4452 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | Abilities (proposta) | da fare |
| | applyPoison | metodo | 4455-4459 | sigillo-rio-resina, sigillo-trenbolone-miasma, wave-boss-ticummi (+5) | Abilities (proposta) | da fare |
| | updatePoison | metodo | 4461-4468 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | Abilities (proposta) | da fare |
| | dmgTo | metodo | 4471-4477 | schianto-santuario, sigillo-bus-specchio, sigillo-rio-resina (+73) | Combat (proposta) | da fare |
| | waveWorld | metodo | 4480-4488 | riflesso-senza-flow, sigillo-perduta-cortina, sigillo-bus-specchio (+56) | Abilities (proposta) | da fare |
| | updateAbilityFx | metodo | 4491-4551 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | Abilities (proposta) | da fare |
| | reflectProjectile | metodo | 4552-4585 | wave-boss-ticummi, wave-boss-guggu, wave-boss-ombra (+3) | Combat (proposta) | da fare |
| | static CHASE_LINES | campo | 4590-4593 |  | script: tana (proposta) | da fare |
| | updateChase | metodo | 4595-4745 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | script: tana (proposta) | da fare |
| | onTanaSniffed | metodo | 4748-4755 | **mai** | script: tana (proposta) | da fare |
| | updateLamettaArena | metodo | 4759-4792 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | script: santuario (proposta) | da fare |
| | updateSmelaArena | metodo | 4795-4807 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | script: stabilimento (proposta) | da fare |
| | spawnColorDrop | metodo | 4809-4835 | guida-santuario, lametta-attesa, esplora-santuario (+2) | script: santuario (proposta) | da fare |
| | spawnMirror | metodo | 4837-4855 | cap-santuario, campagna | script: santuario (proposta) | da fare |
| | updateWaterCure | metodo | 4859-4877 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | script: rio/trenbolone (proposta) | da fare |
| | playSmelaPoisonEffect | metodo | 4879-4935 | npc-acqua-due-volte, cap-rio-acqua, cap-rio-povero (+1) | script: rio/trenbolone (proposta) | da fare |
| | updateAmbush | metodo | 4937-4992 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | script: agguati (proposta) | da fare |
| | spawnNotinoAmbush | metodo | 4995-5009 | npc-piema-dopo, carica-microfono, npc-lametta-libero (+27) | script: agguati (proposta) | da fare |
| | startPatto | metodo | 5013-5045 | finale-patto | script: nucleo (proposta) | da fare |
| | updatePatto | metodo | 5047-5069 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | script: nucleo (proposta) | da fare |
| | arrivoDei | metodo | 5072-5085 | **mai** | script: nucleo (proposta) | da fare |
| | onSpikes | metodo | 5089-5098 | spine, sigillo-santuario-risonanza, cibo (+5) | Combat (proposta) | da fare |
| | onEnemyShoot | metodo | 5100-5134 | guida-santuario, carica-microfono, npc-lametta-libero (+87) | Combat (proposta) | da fare |
| | onBossLamette | metodo | 5136-5161 | schianto-santuario, guida-santuario, schianto (+24) | Combat (proposta) | da fare |
| | popProjectile | metodo | 5163-5175 | guida-santuario, npc-lametta-libero, colpo-pausa (+91) | Combat (proposta) | da fare |
| | onEnemyDied | metodo | 5177-5202 | schianto-santuario, sigillo-rio-resina, sigillo-trenbolone-miasma (+70) | Enemies (proposta) | da fare |
| | onEnemyAlert | metodo | 5205-5211 | rio-cura, sigillo-perduta-rimbalzo, sigillo-perduta-cortina (+115) | Enemies (proposta) | da fare |
| | onBossSummon | metodo | 5213-5217 | agguato-vendetta, trentatre, flauto-fatto (+37) | Enemies (proposta) | da fare |
| | updateLessons | metodo | 5220-5235 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | Enemies (proposta) | da fare |
| | weakFeedback | metodo | 5238-5247 | colpo-pausa, sigillo-ruhra-teorema, nidi-stabilimento (+63) | Combat (proposta) | da fare |
| | onBossEngaged | metodo | 5250-5275 | schianto-santuario, guida-santuario, guggu-senza-ivan (+81) | Bosses (proposta) | da fare |
| | onOmbraInsight | metodo | 5278-5300 | ombra-beta, wave-boss-ombra, cap-sorveglianza (+3) | Bosses (proposta) | da fare |
| | silenceBoss | metodo | 5302-5307 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | Bosses (proposta) | da fare |
| | onBossDefeated | metodo | 5309-5542 | trentatre, flauto-fatto, doomsday-respinto (+39) | Bosses (proposta) | da fare |
| | giorno30 | metodo | 5545-5576 | finale-giorno30-vuoto, finale-riscatto-senza-caso, finale-riscatto-solo (+1) | script: nucleo (proposta) | da fare |
| | startOrder | metodo | 5579-5603 | finale-riscatto-senza-caso, finale-riscatto-solo, finale-riscatto | script: nucleo (proposta) | da fare |
| | sceltaFinale | metodo | 5606-5650 | finale-consegna, finale-giorno30-vuoto, finale-riscatto-senza-caso (+5) | script: nucleo (proposta) | da fare |
| | setupBossColliders | metodo | 5653-5682 | ridimensiona, livello-galliate, livello-marcetti (+27) | Combat (proposta) | da fare |
| | onPlayerDead | metodo | 5684-5713 | npc-acqua-due-volte, caduta, morte-barre (+18) | Progressione (proposta) | da fare |
| | activateCheckpoint | metodo | 5715-5743 | livello-tana, piazza, esplora-mente-cancella (+21) | Progressione (proposta) | da fare |
| | threats | metodo | 5746-5755 | riflesso-senza-flow, rio-cura, nidi-rio (+192) | Enemies (proposta) | da fare |
| | startDialogue | metodo | 5757-5772 | rio-cura, nidi-rio, ridimensiona (+132) | Dialoghi e cutscene (proposta) | da fare |
| | startLines | metodo | 5775-5788 | rio-cura, nidi-rio, ridimensiona (+131) | Dialoghi e cutscene (proposta) | da fare |
| | hitstop | metodo | 5792-5799 | colpo-pausa, nidi-stabilimento, nidi-cantina (+63) | Combat (proposta) | da fare |
| | shake | metodo | 5801-5803 | rio-cura, nidi-rio, schianto-tana (+136) | Combat (proposta) | da fare |

