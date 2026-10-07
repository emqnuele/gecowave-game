# bug trovati per strada

Nei commit di refactor non si sistemano: si annotano qui e si sistemano dopo, in commit separati e dichiarati, aggiornando le tracce di riferimento con una nota in `riferimenti.md`.

Per ognuno: cosa si vede, dove nasce, quale scenario lo mostra, stato.

## trovati costruendo l'harness

### scelta subito dopo un dialogo: "Cannot pause non-running Scene GameScene"
- **si vede**: un avviso in console ogni volta che una scelta parte dalla fine di un dialogo (bottega della piazza, offerta di ticummi, missioni dei passanti). Nessun effetto visibile.
- **nasce**: `Screens.choice` chiama `controller.pause()` mentre la scena è ancora ferma dal dialogo appena chiuso; da capire se è l'ordine tra `scene.resume()` in `startLines` e il `pause` della scelta.
- **scenari**: `piazza`, `arena-rio`, `cap-rio-*` (sezione `con` della traccia).
- **stato**: da indagare.

### il tempo del menu sopravvive al riavvio della scena
- **si vede**: niente a occhio. Il menu del fondale (`MenuScene`) riprende le sue animazioni (braci, parallasse) dal tempo che aveva la volta prima, invece che da zero.
- **nasce**: il campo `t` di `MenuScene` non si azzera in `create()`. Phaser riusa la stessa istanza di scena a ogni restart (la stessa trappola di `GameScene`).
- **trovato**: era una fonte di non determinismo nell'harness (il menu gira già durante il boot, che durava un numero variabile di fotogrammi). L'harness ora rende il boot deterministico, e il campo si porta dietro sempre lo stesso valore.
- **stato**: innocuo; da sistemare dopo, insieme agli altri campi che sopravvivono al restart.

### i shader dei flashback non partono mai (vortice e ricordo)
- **si vede**: l'ingresso e l'uscita dei film usano sempre le "scie" di ripiego (`warp`); il tornado sul frame (`VortexPipeline`) e la tinta del ricordo (`MemoryPipeline`) non si vedono mai.
- **nasce**: `FlashbackManager.vortex` e il blocco della memoria (righe ~251 e ~599) chiamano `cam.setPostPipeline(Classe)`, ma in Phaser 3.90 una pipeline post passata come classe si istanzia solo se è registrata (`PipelineManager.getPostPipeline` controlla `postPipelineClasses.contains`). Nessuno chiama `renderer.pipelines.addPostPipeline` (né c'è `pipeline:` nella config del gioco): `getPostPipeline` torna vuoto e il codice ripiega in silenzio.
- **prova**: la copertura del corpus non vede mai eseguiti i costruttori di `VortexPipeline` e `MemoryPipeline` (`docs/refactor/copertura.md`), in nessuno dei film guardati o saltati.
- **stato**: da decidere con Ema. Sistemarlo cambia l'aspetto dei flashback (che il refactor non deve toccare): è una decisione di prodotto, insieme al ridisegno dei film.

### codice che i dati di oggi non raggiungono mai
Non sono bug, ma vanno decisi (togliere o tenere): nessuno scenario può eseguirli perché le regioni generate non contengono più quei casi.
- `spawnEntities` caso `'spawner'` (`GameScene.ts:767`): i nidi scritti a mano nel JSON di una regione. Nessuna regione ne ha: i nidi del gioco li mette l'algoritmo delle caverne (`spawnCaveSpawners`), che funziona ed è coperto. Da togliere è solo il ramo dei nidi scritti a mano (e il filtro `spec.type === 'spawner'` in `spawnCaveSpawners`).
- `spawnItemPickup` ramo `LEGACY_ITEMS`: le regioni rigenerate (ADR-048) hanno solo crocchetta, panino e tacca.
- boss `furgone`: nessuna regione lo contiene; `onBossDefeated` caso `'furgone'`, `recoverBossReward`, `BOSS_INTRO.furgone` restano senza strada.
- `LightingManager.torch`, `acoustics.meter/rms` (strumento di sviluppo), `StoryManager.destroy` (mai chiamato; svuota solo un array), `Boss.delayAttack` (mai usato dall'ombra), `music.setVolume`, `sfx.startPad/stopPad` parzialmente (il pad non parte mai, `stopPad` sì).
- `TerrainRenderer.straightenFakeWalls/releaseStraightenedWalls` e `TrentatreMarks.extinguishWalls/restoreExtinguished`: la fase 2 del nucleo che si raddrizza non trova muri `F` nell'arena (ADR-041 lo dice già): restano pronti per una rigenerazione.

## già noti dalla revisione del remaster (ANALISI_REMASTER.md)

### i collider dei boss si accumulano
- **nasce**: `setupBossColliders` aggiunge collider a ogni boss evocato dopo il `create` e non toglie quelli del boss distrutto (void, galliate, marcetti, patto, dei, doomsday).
- **scenari**: `cap-void*`, `cap-walter`, `finale-*`, `doomsday-collasso` (diagnostica `colliders`).
- **stato**: da sistemare dopo il refactor.

### `startDialogue` riprova ogni 1,2 s se un film è in corso
- **nasce**: niente coda esplicita, un `delayedCall` che si richiama.
- **scenari**: `film-coda`.
- **stato**: proposta per il sistema di cutscene.

### la logica gira a ogni frame di render
- **nasce**: niente limite agli fps; la fisica arcade ha passo fisso ma `update()` gira a ogni frame (su 120 Hz il doppio: per esempio i controlli casuali per frame del trenbolone).
- **stato**: proposta, non si cambia nel refactor.
