# mappa dei sistemi di GameScene

## com'è venuta (parte B, blocchi B1-B9)

La bozza qui sotto è stata messa alla prova spostando il codice. Il risultato, con le differenze dalla bozza:

| sistema | file | cosa fa | note rispetto alla bozza |
|---|---|---|---|
| contesto | `src/game/context.ts` | `GameContext` (una vita di scena), `GameSystem`, `Flow`, `SceneData` | i sistemi prendono il contesto con `Pick` (ADR-051) |
| campi che sopravvivono al restart | `src/game/carry.ts` | `RestartCarry`: i 14 campi che `create()` non azzerava | bug da chiudere in B13 |
| mondo | `src/game/world/LevelWorld.ts` | definizione, layout, livello, nav, bioma; stanze, progresso, punti liberi, palco dei film, varchi | la costruzione (luci, terreno, fondali) resta nella scena: è composizione |
| gruppi fisici | `src/game/groups.ts` | gli 8 gruppi nell'ordine di creazione di prima | nuovo: phaser processa i gruppi nell'ordine in cui nascono, e nemici, proiettili, porte e sbarre li toccano in tanti |
| peso dei colpi | `src/game/Feel.ts` | scossa e hitstop | nuovo, prima erano due metodi usati ovunque |
| interattivi | `src/game/Interactions.ts` | il registro (ordine d'inserimento conservato), il più vicino, il prompt | come da bozza |
| dialoghi | `src/game/Dialogues.ts` | film poi righe, righe al volo, intro del capitolo | anticipato da B9: tutti lo usano; la coda dei film resta il `delayedCall` (B13) |
| ricompense | `src/game/Rewards.ts` | oggetti, frammenti, cuori, maschere, barre, note, ricompense che volano | come da bozza |
| nemici | `src/game/Enemies.ts` | nascita, tratti, élite, nidi, sonno e risveglio, morte e barre, lezioni, minacce | |
| combattimento | `src/game/Combat.ts` | collider, danni, proiettili, esplosioni, schianto, spine | con abilità nello stesso passo: si chiamano a vicenda |
| abilità | `src/game/abilities/` | una cartella, un modulo per abilità (riflesso, analisi, scudo e rimando, bottiglia, veleno, risonante) più i colpi in volo; `index.ts` è la facciata `Abilities` | in ogni modulo la grafica sta in una classe `...Fx` chiamata negli stessi punti di prima; le regole pure in `src/rules/combat.ts` e `src/rules/abilities.ts` |
| posizione sicura | `src/game/SafeGround.ts` | l'ultimo punto a terra (spine, barre alla morte) | nuovo, era in progressione |
| boss | `src/game/Bosses.ts` | creazione, luce, intro e ingaggio, voce e ombra, ritmo del custode, trofeo intoccabile, parte comune della sconfitta | |
| arena | `src/game/Arena.ts` | sbarre e blocco della stanza | condiviso con le sfide |
| npc | `src/game/Npcs.ts` | comparsa e interazione generiche | i casi speciali vanno ai capitoli |
| capitoli | `src/game/chapters/` | uno script per capitolo, registrati per id (`index.ts`), con pezzi condivisi in `shared/` (agguati di notino, guida che accompagna, acqua di smela, messaggi una tantum) | gli agganci sono in `ChapterScript.ts`; ogni aggancio si chiama dove il vecchio codice controllava `def.id` |
| progressione | `src/game/Progression.ts` | uscite, riepiloghi, punteggi, fine partita, morte, esplorazione, trofei | implementa `Flow`, l'unica cosa che i capitoli vedono del flusso |
| viaggio | `src/game/Travel.ts` | microfoni, fermate, viaggio, varchi, servizi spenti nei film | |
| guida | `src/game/Guide.ts` | obiettivo, mappa del telefono, freccia | |
| sfide | `src/game/Challenges.ts` | microfono rosso a ondate, corsa contro il citelis | |
| doomsday | `src/game/Doomsday.ts` | tempo che stringe, glitch, pedro del collasso e il ritorno del boss di prima | |
| regole pure | `src/rules/` | combattimento, punteggi, salvataggio, profilo dell'ombra, con i test vitest accanto | nuovo strato: niente phaser, lo importano tutti |

`GameScene` (673 righe) compone i sistemi in `create()` nello stesso ordine di prima, li chiama in `update()` nello stesso ordine (sotto), collega gli eventi in un posto solo (`setupEvents`) e implementa la facciata per il film e il geco (`FilmHost`, `PlayerHost`).

---

## la bozza di partenza (parte A)

Righe su `main` a16f39c (`src/scenes/GameScene.ts`, 5804 righe, 168 metodi, ~180 campi). È una **bozza da confermare**: nasce dalla lettura completa del file e dalle chiamate incrociate, non è ancora stata messa alla prova spostando codice. Il registro membro per membro (con gli scenari che eseguono ogni metodo) è `ledger.md`.

Regola per ogni sistema estratto: nasce in `create()` e muore allo `SHUTDOWN` della scena (Phaser riusa l'istanza della scena a ogni restart), ha la sua `update()` chiamata dalla scena **nello stesso punto dell'ordine attuale di `update()`**, un `destroy()` che stacca ogni ascoltatore (bus, eventi di scena, `scale`, dom), e lo stato separato da quello che disegna e suona.

---

## l'ordine di update() oggi (righe 2825-2912)

È il contratto più delicato: ogni sistema estratto deve essere chiamato nello stesso punto, o le tracce cambiano (ordine delle chiamate a `Math.random`, degli eventi, della creazione degli oggetti).

1. `controls.update()`, interagisci (tasto o su del pad da fermo), pausa
2. `player.update`, `mechanic.update`
3. morte per caduta sotto la mappa
4. **se non c'è un film**: nemici, nidi, boss, raddrizzamento del nucleo, voce del boss, cervello dell'ombra
5. apparizione di pedro, 33, sigilli, lezioni dei nemici, luci, terreno, parallasse, ambiente, acqua
6. posizione sicura, tempo di gioco (`record.playMs`), `flushPersist`, `nearMic`, uscite, prompt
7. **se non c'è un film**: ingaggio del boss
8. barre calamitate, clone, ricompense che volano, passanti, trappole, pericoli, corsa
9. arena chiusa / sfida a ondate, esplorazione, fermate, trofei
10. atmosfera, notte nella musica, testa sott'acqua nelle vasche, soundscape
11. freccia guida, analisi, scudo, bottiglia/pozze, effetti delle wave, veleno
12. script: arena di lametta, arena di smela, cura del rio, agguati, caccia della tana, patto, ivan, void, baruffoni
13. muri finti, atterraggio dello schianto, doomsday, ritmo del custode
14. tremito del trenbolone (`Math.random() < 0.2` **a ogni frame di render**)

## sistemi proposti

### 1. LevelWorld (costruzione e geometria) — ~350 righe
`init` 354, buona parte di `create` 372-753 (luci, livello, terreno, fondali, parallasse, decorazioni, acqua, ambiente, camera), `setupCamera` 2413, `roomAt` 2340, `progressAt` 2376, `progressOfOldX` 2387, `openSpotNear` 2392, `rewardSpot` 1728, `findFlatStage` 2352 (**pubblica: la chiama `FlashbackManager` per duck typing**), `doorRects` 3653, `destroyBreakableWall` 3015, `updateFakeWalls` 3011, il velo di galliate/marcetti (706-716).
Campi: `def, layout, roomBySlot, level, nav, lighting, parallax, biome, terrain, ambience, water, vignette` (**`vignette` pubblica: la usa `FlashbackManager`**).
Note: è il posto delle query sul mondo ("che stanza è", "dove posso far comparire qualcuno"); quasi tutti gli altri sistemi ne dipendono. Va estratto per primo come servizio di sola lettura.

### 2. Combat (danno, colpi, proiettili) — ~550 righe
`setupColliders` 2090-2294 (205 righe di overlap), `setupBossColliders` 5653, `dmgTo` 4471, `parry` 1144, `weakFeedback` 5238, `hitstop` 5792, `shake` 5801, `popProjectile` 5163, `onEnemyShoot` 5100, `reflectProjectile` 4552, `onBossLamette` 5136, `slamLand` 3033, `onSpikes` 5089, `onEnemyExplode` 1158, `nearestHostile` 4094.
Campi: `playerProjectiles, enemyProjectiles, lametteGroup, parryUntil, poisoned` (il veleno moltiplica i danni in `dmgTo`).
Note: `setupBossColliders` accumula collider dei boss distrutti (bug noto, **non sistemarlo nel refactor**). Il blocco dei collider del boss in `setupColliders` (2257-2293) è quasi un duplicato di `setupBossColliders` ma **non identico** (il toast di guggu/limite c'è solo nel primo; il rimando che tocca il boss una volta sola c'è solo nel primo): conservare entrambe le varianti.

### 3. Abilities (le wave del geco) — ~650 righe
Riflesso: `onRiflesso` 3971, `onRiflessoSwap` 4034, `killClone` 4072, `cloneHitFx` 4082, `nearHostile` 4111, `updateClone` 4117, getter `cloneAlive` 205 (**pubblico: lo legge `Player` per duck typing**, `Player.ts:441`). Analisi: `onAnalisi` 4143, `updateAnalisi` 4156, `markAnalisiTargets` 4225, `qedAnalisi` 4240, `clearAnalisiFx` 4262. Scudo: `onScudo` 4282, `updateScudo` 4295, `clearScudoFx` 4310, `refundNote` 4322. Acqua: `onAcquaTossica` 4328, `burstBottle` 4352, `spawnPuddle` 4390, `updateAcquaTossica` 4409, `applyPoison` 4455, `updatePoison` 4461. Risonante: `onRisonante` 3949. Comuni: `waveWorld` 4480 (evento `wave-world` per i sigilli), `updateAbilityFx` 4491 (cooldown all'hud ogni 100 ms, scie, homing del rimando).
Campi: `clone*` (6), `analisi*` (11), `scudo*` (7), `acquaPuddles, acquaBottles, poisoned, lastCooldownEmit, lastDashWaveAt`.
Note: logica e grafica mescolate in ogni funzione (danni, tween e particelle insieme). Separarle senza cambiare l'ordine delle chiamate a `Math.random` e della creazione degli oggetti (le tracce lo vedono).

### 4. Enemies (nemici e nidi) — ~280 righe
`spawnEnemy` 958, `isEliteSpot` 931, `traitFor` 941, `updateEnemies` 2926, `awakeEnemies` 2915, `onEnemyDied` 5177, `onEnemyAlert` 5205, `onBossSummon` 5213, `updateLessons` 5220, `threats` 5746, `magnetBarre` 3916. Nidi: `spawnSpawner` 973, `spawnCaveSpawners` 984, `caveSpawnerSpot` 1039, `updateSpawners` 2061, `damageSpawner` 1112, `breakSpawner` 1122.
Campi: `enemies, spawners, spawnerToastShown, threatCache, nextLessonCheck, barreGroup`.

### 5. Bosses (boss, voce, ombra, arene) — ~400 righe
`makeBoss` 914, `lightBoss` 908, `updateBossTrigger` 3847 (con le varianti delle intro e la scelta di pedro), `onBossEngaged` 5250, `onOmbraInsight` 5278, `silenceBoss` 5302, `updateArenaLock` 3628, `lockArena` 3674, `unlockArena` 3688, `drawArenaBars` 3817, `updateRhythm` 3000 (custode), `dropBossCharm` 866, `recoverBossReward` 873, costante `BOSS_INTRO` 85.
Campi: `boss, bossIntroShown, voice, ombraBrain, arenaBars, arenaGfx, arenaRoom, beatMs, nextBeatAt, bossFight, exitLockToastAt`.
Note: `onBossDefeated` (5309-5542, 234 righe) è uno `switch` sul tipo di boss che chiama mezza trama: va spezzato tra Bosses (parte comune: flag, trofeo intoccabile, amuleto, doomsday) e gli script dei capitoli (il caso per caso).

### 6. Chapter scripts (uno per capitolo invece dei rami `def.id === '…'`) — ~1500 righe
- bus: `updateIvan` 3064, `killIvanCutscene` 3095, `ivanStrike` 3138 (campi `ivan*`)
- santuario (lametta): `updateLamettaArena` 4759, `spawnColorDrop` 4809, `spawnMirror` 4837 (campi `lamettaCenter, lamettaActive, lamettaFloorY, nextLametteAt, nextPitturaAt, colorDropsTaken, mirror`)
- stabilimento: `updateSmelaArena` 4795 (`smelaArena`)
- trenbolone/rio: `updateWaterCure` 4859, `playSmelaPoisonEffect` 4879
- agguati di notino (rio, stabilimento, ruhra, caso, tana, sorveglianza, cantina): `updateAmbush` 4937, `spawnNotinoAmbush` 4995, costanti `AMBUSHES`, `TOMMASO_BLOCCA`
- tana: `updateChase` 4595 (151 righe), `onTanaSniffed` 4748, `spawnOspite12` 1278, `CHASE_LINES` 4590 (campi `chase*`, `ospite12*`)
- caso: `indiziRaccolti` 2070, `interactIndizio` 2074
- mente: `spawnQuizDoor` 1680, `interactPorta` 1690 (`quizAttempts`)
- void: `setupVoid` 2654, `nextRegret` 2649, `spawnRegret` 2681, `onVeritaRivelata` 2692, `updateVoid` 2706, `interactGuida` 2761, `interactSfida33` 2772, `voidClimax` 2796, `VOID_REGRETS` (campi `void*`, `companion*`)
- galliate/marcetti: `setupBaruffoni` 2534, `baruffoniSeq` 2530, `spawnBaruffoniBoss` 2555, `onBaruffoniDown` 2571, `onBaruffoniComplete` 2587, `walterReveal` 2593, `updateBaruffoni` 2626, `interactWalterGuida` 2640, `BARUFFONI_SEQ` (campi `baruffoni*`)
- comune a void e baruffoni: `moveGuide` 2724
- nucleo: `giorno30` 5545, `startOrder` 5579, `sceltaFinale` 5606, `startPatto` 5013, `updatePatto` 5047, `arrivoDei` 5072 (campi `pedroChoiceShown, pedroShell, nucleusStraightening, pattoActive, finalGodsFight, patto*`)
- doomsday (non è un capitolo: vale ovunque in modalità doomsday): `updateDoomsday` 2945 (campi `collapse*, doomsdayWarned, replacedBoss*, nextWildGlitchAt`)
- messaggi del capitolo: `setupScript` 2453 (wavesung una tantum per capitolo)
Note: gli script leggono e scrivono `this.boss`, `this.player`, `this.exiting`: serve un contesto esplicito (interfaccia) che la scena passa, non l'accesso alla scena intera.

### 7. Npc e interazioni — ~550 righe
`spawnNpc` 1178 (98 righe: marker invisibili, guide, altare del 33, porte, npc veri), `interactNpc` 1296 (242 righe, uno `switch` per npc), `castSprite` 900, piazza: `spawnPiazzaGuests` 1542, `interactRomeroPiazza` 1552, `oracleLines` 1572, `boardLines` 1593, `barRumors` 1609 (`Phaser.Utils.Array.Shuffle`: consuma `Math.random`), `openPiazzaShop` 1629, `interactPiema` 1663. Prompt: `buildPrompt` 2436, `updatePrompt` 3349, `findNearestInteractable` 3929, `tryInteract` 3942.
Campi: `interactables, prompt, promptTxt, npcAt`.
Note: `interactables` è un array condiviso in cui scrivono npc, passanti, missioni, storia, meccaniche, sigilli, sfide e corse: diventa un registro con un'interfaccia (aggiungi/togli), l'ordine di inserimento resta (a parità di distanza vince il primo).

### 8. Rewards e pickup — ~300 righe
`spawnItemPickup` 826, `spawnFragment` 1771, `spawnLore` 1799, `spawnBarrePickup` 1940, `spawnCuore` 1958, `spawnMaschera` 1987, `maschereCount` 1983, `spawnDroppedBarre` 1922, `homeIn` 1748, `updateHoming` 1752, `freeFragment` 3554. Costante `TOTAL_MASCHERE` (esportata: la usa `ui/phone.ts`).
Campi: `homing, liveFragments`.

### 9. Progressione del capitolo e viaggio — ~400 righe
Checkpoint: `spawnCheckpoints` 1897, `activateCheckpoint` 5715, `micKey` 1816. Fermate: `spawnBusStops` 1821, `updateBusStops` 1844, `openTravel` 1855, `travelTo` 1880, `setPropsVisible` 1837 (**pubblica: la usa `FlashbackManager`**). Varchi: `spawnPortal` 2020. Uscite: `checkExits` 3205, `returnFromSecret` 3263, `completeChapterAndGo` 3278, `gotoLevel` 3336. Punteggi e fine: `finishChapter` 3396, `liveChapterScore` 3425, `endGame` 3437, `updateTrophies` 3380, `updateExplore` 3362. Morte: `onPlayerDead` 5684, `trackSafePosition` 3192. Freccia: `currentObjective` 3521, `buildGuide` 3577, `updateGuide` 3590.
Campi: `exiting, checkpointSprites, propDressing, busStops, lastSafe, safeTimer, lastRoom, guide, guideCache*, guideGfx, nextTrophyCheckAt`.

### 10. Sfide (microfono rosso e corsa) — ~150 righe
`spawnChallenge` 3702, `challengePoints` 3730, `offerChallenge` 3747, `updateChallenge` 3766, `winChallenge` 3802, `spawnTrial` 3737. Campi: `challenge, challengeSpot, trial`. Usa `lockArena`/`unlockArena`/`drawArenaBars` (condivisi con Bosses: vanno in un piccolo modulo Arena).

### 11. Dialoghi e cutscene
`startDialogue` 5757 (film prima delle righe; se un film gira riprova ogni 1,2 s: diventa una coda esplicita), `startLines` 5775 (mette in pausa la scena e emette `dialogue-start`). Più `FlashbackManager` (singleton, 1393 righe) e le scenette tween di ivan, walter, markolino, smela. I flashback **non** mettono in pausa la simulazione: congelano solo nemici, nidi, boss, voci e ingaggi (`flashback.isPlaying` in `update`). Il sistema di cutscene nuovo deve restare identico nell'aspetto e nei tempi; il ridisegno è una decisione di Ema per dopo.

### 12. Eventi
`setupEvents` 2296: gli eventi di scena del geco (`player-*`), dei nemici e dei boss, `player-act` per il profilo dell'ombra, `player-healed` e `eat-requested` dal bus. Gli ascoltatori di bus della scena (`controls-changed`, `tana-sniffed`, `player-healed`, `eat-requested`) si staccano allo shutdown: un sistema che li sposta deve fare lo stesso (la diagnostica `busHandlers` della traccia lo controlla).

## quello che resta nella scena
`create()` come composizione dei sistemi nell'ordine attuale, `update()` come sequenza di chiamate nell'ordine sopra, lo shutdown che chiama i `destroy()`. Le quattro cose pubbliche usate da fuori per duck typing (`vignette`, `setPropsVisible`, `findFlatStage` da `FlashbackManager`; `cloneAlive` da `Player`) restano sulla scena come facciata, o diventano un'interfaccia tipata passata esplicitamente (decisione da annotare in un ADR).

## trappole già viste leggendo
- `create()` azzera a mano circa 180 campi: ogni sistema deve nascere nuovo in `create`, mai sopravvivere al restart.
- Ci sono due `events.once(SHUTDOWN)` separati in `create` più quelli dentro `setupEvents`, `setupCamera` e il velo: l'ordine degli shutdown conta poco ma va tenuto.
- `interactNpc('spaccino')` scrive `(boss as any).anchorX`: un campo privato del boss da fuori.
- Il secondo argomento di `updateEnemies`/`boss.update` è il bersaglio: il clone se vivo, altrimenti il geco.
- `Math.random` nella scena: tremito del trenbolone, nidi, schegge di bottiglia e specchio, gocce di lametta, patto, doomsday, notino che scappa, barre dei nemici morti, bar della piazza (`Shuffle`). Spostarli cambia l'ordine solo se cambia l'ordine delle chiamate.
