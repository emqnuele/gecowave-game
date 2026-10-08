# bug trovati per strada

Nei commit di refactor non si sistemano: si annotano qui e si sistemano dopo, in commit separati e dichiarati, aggiornando le tracce di riferimento con una nota in `riferimenti.md`.

Per ognuno: cosa si vede, dove nasce, quale scenario lo mostra, stato.

## trovati costruendo l'harness

### scelta subito dopo un dialogo: "Cannot pause non-running Scene GameScene"
- **si vede**: un avviso in console ogni volta che una scelta parte dalla fine di un dialogo (bottega della piazza, offerta di ticummi, missioni dei passanti). Nessun effetto visibile.
- **nasce**: `Screens.choice` chiama `controller.pause()` mentre la scena è ancora ferma dal dialogo appena chiuso; da capire se è l'ordine tra `scene.resume()` in `startLines` e il `pause` della scelta.
- **scenari**: `piazza`, `arena-rio`, `cap-rio-*` (sezione `con` della traccia).
- **stato**: sistemato in B13. La causa: a fine dialogo `Dialogues.lines` riprendeva la scena col plugin (`scene.scene.resume()`), che mette la ripresa in coda al fotogramma dopo; la scelta chiamava subito `game.scene.pause()`, immediata, che trovava la scena ancora in pausa: avviso e niente pausa. Al fotogramma dopo la ripresa in coda faceva ripartire la scena **con la scelta aperta** (nella traccia di `piazza` la scena è in esecuzione sotto la bottega). Non era solo un avviso: il mondo andava avanti durante le scelte. Ora a fine dialogo la ripresa è immediata, come la pausa della scelta.

### il tempo del menu sopravvive al riavvio della scena
- **si vede**: niente a occhio. Il menu del fondale (`MenuScene`) riprende le sue animazioni (braci, parallasse) dal tempo che aveva la volta prima, invece che da zero.
- **nasce**: il campo `t` di `MenuScene` non si azzera in `create()`. Phaser riusa la stessa istanza di scena a ogni restart (la stessa trappola di `GameScene`).
- **trovato**: era una fonte di non determinismo nell'harness (il menu gira già durante il boot, che durava un numero variabile di fotogrammi). L'harness ora rende il boot deterministico, e il campo si porta dietro sempre lo stesso valore.
- **stato**: sistemato in B13 con tutti gli altri: `MenuScene` azzera `t`, `ridge` e `dust` in `create()`, `GalleryScene` `t` e `sprites` (gli sprite della vita prima restavano nella lista animata), e i 14 campi di `GameScene` raccolti in `RestartCarry` sono tornati ciascuno nel sistema che li usa, che nasce nuovo a ogni vita. `RestartCarry` non esiste più.

### i shader dei flashback non partono mai (vortice e ricordo)
- **si vede**: l'ingresso e l'uscita dei film usano sempre le "scie" di ripiego (`warp`); il tornado sul frame (`VortexPipeline`) e la tinta del ricordo (`MemoryPipeline`) non si vedono mai.
- **nasce**: `FlashbackManager.vortex` e il blocco della memoria (righe ~251 e ~599) chiamano `cam.setPostPipeline(Classe)`, ma in Phaser 3.90 una pipeline post passata come classe si istanzia solo se è registrata (`PipelineManager.getPostPipeline` controlla `postPipelineClasses.contains`). Nessuno chiama `renderer.pipelines.addPostPipeline` (né c'è `pipeline:` nella config del gioco): `getPostPipeline` torna vuoto e il codice ripiega in silenzio.
- **prova**: la copertura del corpus non vede mai eseguiti i costruttori di `VortexPipeline` e `MemoryPipeline` (`docs/refactor/copertura.md`), in nessuno dei film guardati o saltati.
- **stato**: sistemato in B13 (deciso da Ema l'8 ottobre, anche se i film andranno rifatti). `FlashbackManager.ensurePipelines` registra le due classi la prima volta che parte un film: l'avvio del gioco non compila shader in più, e in canvas restano le scie. La seppia ha ora un ripiego come il vortice (`memory()`): uno shader che non compila sulla scheda di chi gioca lascia il colore vero invece di fermare la prima inquadratura.

### codice che i dati di oggi non raggiungono mai
Non sono bug, ma vanno decisi (togliere o tenere): nessuno scenario può eseguirli perché le regioni generate non contengono più quei casi.
- `spawnEntities` caso `'spawner'` (`GameScene.ts:767`): i nidi scritti a mano nel JSON di una regione. Nessuna regione ne ha: i nidi del gioco li mette l'algoritmo delle caverne (`spawnCaveSpawners`), che funziona ed è coperto. Da togliere è solo il ramo dei nidi scritti a mano (e il filtro `spec.type === 'spawner'` in `spawnCaveSpawners`).
- `spawnItemPickup` ramo `LEGACY_ITEMS`: le regioni rigenerate (ADR-048) hanno solo crocchetta, panino e tacca.
- boss `furgone`: nessuna regione lo contiene; `onBossDefeated` caso `'furgone'`, `recoverBossReward`, `BOSS_INTRO.furgone` restano senza strada.
- `LightingManager.torch`, `acoustics.meter/rms` (strumento di sviluppo), `StoryManager.destroy` (mai chiamato; svuota solo un array), `Boss.delayAttack` (mai usato dall'ombra), `music.setVolume`, `sfx.startPad/stopPad` parzialmente (il pad non parte mai, `stopPad` sì).
  - **esito (B12)**: tolti `torch`, `startPad` (con `stopPad`, che senza pad faceva solo `stopBeds`: i chiamanti ora chiamano quello) e `StoryManager.destroy`; `acoustics.meter` spostato in `src/dev/hooks.ts`. **Restano** `music.setVolume` e `Boss.delayAttack`: non sono codice morto, sono codice che il corpus non esegue. Il primo lo chiama il cursore del volume (schermo delle impostazioni e telefono), il secondo l'ombra quando alzi lo scudo vicino a lei (`OmbraBrain`, insight `wave-scudo`). Toglierli cambierebbe il gioco.
- `TerrainRenderer.straightenFakeWalls/releaseStraightenedWalls` e `TrentatreMarks.extinguishWalls/restoreExtinguished`: la fase 2 del nucleo che si raddrizza non trova muri `F` nell'arena (ADR-041 lo dice già): restano pronti per una rigenerazione.

## già noti dalla revisione del remaster (ANALISI_REMASTER.md)

### i collider dei boss si accumulano
- **nasce**: `setupBossColliders` aggiunge collider a ogni boss evocato dopo il `create` e non toglie quelli del boss distrutto (void, galliate, marcetti, patto, dei, doomsday).
- **scenari**: `cap-void*`, `cap-walter`, `finale-*`, `doomsday-collasso` (diagnostica `colliders`).
- **stato**: sistemato in B13: i collider di un boss sono legati al suo `DESTROY` (`Combat.collidersOf`) e muoiono con lui. Non si tolgono quelli del boss precedente quando ne arriva uno nuovo, perché in alcuni capitoli il vecchio resta vivo.

### `startDialogue` riprova ogni 1,2 s se un film è in corso
- **nasce**: niente coda esplicita, un `delayedCall` che si richiama.
- **scenari**: `film-coda`.
- **stato**: sistemato in B13 (`Dialogues`): una fila vera. Un film chiesto mentre un altro gira entra in fila e parte quando il precedente ha chiuso anche le sue righe, al primo fotogramma a scena viva (se le righe hanno aperto una scelta o un altro dialogo, aspetta anche quello). Prima il tentativo ogni 1,2 s poteva cadere nel fotogramma tra la fine del film e la pausa delle sue righe, e far partire il secondo film sopra il dialogo del primo. Un film in fila che nel frattempo è stato visto altrove passa alle sole righe, e la fila va avanti. **Prova**: lo scenario `film-coda` non la esercitava (arrivando all'indizio 2 parte l'agguato di notino e i tasti scorrevano il suo dialogo, nessun film partiva, né su main né dopo). Riscritto: chiude l'agguato, avvia il film dell'indizio 2 e mentre gira chiede l'indizio 3. Con il vecchio tentativo il secondo film non parte entro la fine dello scenario (main e `t11`: visto solo `fb-notte`); con la fila parte subito dopo le righe del primo (`t12`: `fb-notte` e `fb-ritratto`).

### la logica gira a ogni frame di render
- **nasce**: niente limite agli fps; la fisica arcade ha passo fisso ma `update()` gira a ogni frame (su 120 Hz il doppio: per esempio i controlli casuali per frame del trenbolone).
- **stato**: sistemato in B14. La logica di `GameScene` va a passi fissi da 1/60 s (`rules/fixedStep.ts`, con i test): a 120 Hz un passo ogni due fotogrammi, a 144 Hz due o tre, dopo un intoppo fino a quattro di recupero. Il conteggio usa il `delta` dei fotogrammi, quindi il tempo in pausa non si recupera. A 60 Hz ogni fotogramma fa esattamente un passo col suo `delta`, e il gioco è identico a prima: i fotogrammi entro 0,2 ms da un multiplo o da una frazione del passo contano come esatti, altrimenti lo scarto di un monitor vero (16,67 o 16,68 ms) ogni tanto fa due passi in un fotogramma. A 120 e 240 Hz il passo cade nello stesso istante che a 60 Hz, dopo il passo della fisica e i timer di phaser (l'accumulatore parte a 0,2 passi). Le due cose le hanno trovate le tracce, il diario racconta come. Nei fotogrammi senza passo si aggiorna solo quello che si vede e dipende dalla camera (luci, terreno, parallasse, aria, acqua). Il `lerp` della camera di phaser è per fotogramma: si corregge col tempo (`1 - (1 - 0,12)^k`), ed è esattamente 0,12 a 60 Hz. Fisica, tween, timer e animazioni di phaser erano già a tempo.

## trovati nella parte B

### i collider delle bottiglie restano dopo lo scoppio
- **nasce**: `Bottiglia.cast` crea tre o quattro collider per bottiglia (terreno, muri, nemici, boss) e non li distrugge quando la bottiglia scoppia. Phaser salta i collider di un oggetto distrutto, quindi il gioco non cambia, ma la lista dei collider cresce a ogni lancio.
- **scenari**: `wave-*` con l'acqua tossica (diagnostica `colliders`).
- **stato**: sistemato il 9 ottobre (deciso da Ema): i collider sono legati al `DESTROY` della bottiglia, come quelli dei boss. Nei 12 scenari `wave-*` cambia solo la diagnostica (per esempio in `wave-bus` al massimo 81 collider vivi invece di 89); il gioco è identico al bit.

### la fase 2 del nucleo non trova muri da raddrizzare (B13)
- **dato**: l'arena del glitch è la stanza 22 (92×26 celle in fondo alla regione: pavimento, tre piattaforme a mezz'aria, nessun muro finto). L'unico muro finto `F` della regione è un blocco 2×4 tra la stanza 14 (pozzo) e la 29 (grotta), lontano dall'arena. La fase 2 (`NucleusStraightening.selectWalls`) cerca solo `F` dentro l'arena, quindi oggi resta visiva.
- **perché non l'ho deciso da solo**: ogni modo di farla funzionare senza rigenerare cambia lo scontro (muri nuovi nell'arena) oppure tocca il JSON della regione, e Ema ha chiesto di essere interpellato su tutte e due.
- **opzioni**: (1) i muri dell'ordine nascono a runtime: alla fase 2 due o tre colonne dritte e solide sorgono in punti vuoti dell'arena, con gli stessi controlli di oggi (lontano da varchi e attori), e alla sconfitta si rompono come previsto; niente dati toccati, ma lo scontro ha ostacoli nuovi. (2) si aggiungono a mano alcuni `F` dentro l'arena di `nucleo.json`, senza rigenerare: la fase 2 funziona esattamente come era stata scritta (muri finti attraversabili che diventano veri). (3) resta visiva.
- **stato**: sistemato in B13, scelta di Ema (opzione 1). Se nell'arena non ci sono muri finti, al preavviso della fase 2 l'ordine sceglie dove alzare le sue colonne (a 0,3, 0,5 e 0,7 della larghezza, niente caso): tre celle sul pavimento, saltabili, mai vicino ai varchi né sotto una piattaforma. Il contorno si vede nei 650 ms di preavviso; all'attivazione si scartano quelle sopra il geco o il glitch. Solo il geco le sente, come i muri finti. Alla sconfitta si spezzano dopo che le collisioni sono già tolte. Nel nucleo di oggi sorgono due colonne (celle 625 e 644); la terza cadrebbe dentro la piattaforma lunga. Con muri finti nell'arena (una rigenerazione futura) vale il comportamento di prima.