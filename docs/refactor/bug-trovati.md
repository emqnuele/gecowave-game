# bug trovati per strada

Nei commit di refactor non si sistemano: si annotano qui e si sistemano dopo, in commit separati e dichiarati, aggiornando le tracce di riferimento con una nota in `riferimenti.md`.

Per ognuno: cosa si vede, dove nasce, quale scenario lo mostra, stato.

## trovati costruendo l'harness

### scelta subito dopo un dialogo: "Cannot pause non-running Scene GameScene"
- **si vede**: un avviso in console ogni volta che una scelta parte dalla fine di un dialogo (bottega della piazza, offerta di ticummi, missioni dei passanti). Nessun effetto visibile.
- **nasce**: `Screens.choice` chiama `controller.pause()` mentre la scena è ancora ferma dal dialogo appena chiuso; da capire se è l'ordine tra `scene.resume()` in `startLines` e il `pause` della scelta.
- **scenari**: `piazza`, `arena-rio`, `cap-rio-*` (sezione `con` della traccia).
- **stato**: da indagare.

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
