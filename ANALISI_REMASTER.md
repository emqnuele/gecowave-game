# Analisi di `remaster` prima del merge

6 ottobre 2026. Branch `remaster`: 232 commit sopra `main`, in fast-forward (nessun conflitto). Contesto: `REMASTER.md` (visione), `DEV_LOG.md` (ADR e stato), `PIANO_REFACTOR.md` (piano).

## Verdetto

Il gioco regge. La parte di contenuti e sistemi è ricca e in gran parte ben separata. Il problema strutturale è uno solo, ed è quello che già sapevamo: `GameScene` fa da collante per tutto, e il codice non è mai stato provato a runtime in modo automatico (232 commit in 3 giorni, verificati solo con `tsc`). Non ho trovato blocchi gravi. Ho trovato e sistemato alcuni bug reali, soprattutto nei flashback. Il merge si può fare. Il refactor ha senso solo con il bot di test davanti.

## Piano contro realtà

| fase di REMASTER.md | stato | nota |
|---|---|---|
| 1 motore a inchiostro | fatto | biomi, terreno organico, props, parallasse a strati |
| 2 telefono e inventario | fatto | telefono opaco (ADR-015), amuleti, negozi |
| 3 regioni interconnesse | fatto | pipeline offline con simulatore fisico che verifica ogni regione: è la parte più solida del progetto |
| 4 gameplay | fatto | aggrappo, élite, tratti nemici, missioni, sigilli, arene, corse |
| 4b trofei e assistita | fatto | |
| 5 e 5b trama | fatto | canone (ADR-028), voce del geco, archi secondari, finali estesi |
| 6 cast e suono | fatto | creature a inchiostro con normal map, acustica per spazio |

Fuori piano (dal DEV_LOG): abilità rifatte (ADR-034), livello input con gamepad e rimappatura (ADR-035), cure solo col cibo e canale da 700 ms (ADR-036/047), ombra che impara (ADR-039), riepiloghi di capitolo e di fine gioco (ADR-025/027), tana horror (ADR-031), nucleo che si raddrizza (ADR-041), flashback rifatti cinque volte (ADR-037/043).

Rimasti aperti nel DEV_LOG:
- il bot sulla campagna intera con le regioni rigenerate non è mai stato rifatto;
- lo stabilimento "full-optional" aspetta una tua decisione (serve rigenerare le regioni e migrare i salvataggi);
- il DEV_LOG cita `HANDOFF.md`, che è stato cancellato.

## Com'è impostato

### Punti forti
- **Contenuti separati dal codice**: storia, boss, nemici, oggetti, missioni, toni stanno in `src/content/`.
- **Mondo generato offline e verificato**: `src/world/sim.ts` replica la fisica arcade e il controllo del geco ed è calibrato sul gioco vero. Ogni regione è dimostrata percorribile. Il principio "additivo" (trappole, lastre, meccaniche e sigilli non chiudono mai una strada verificata) è giusto e va tenuto.
- **TypeScript strict**, quasi zero `any` e pochi cast.
- **Un bus tipato** (`engine/events.ts`) tra Phaser e DOM.
- **Un solo punto di input** (`engine/input/Input.ts`): tutto il gioco legge azioni, non tasti. Sarà comodissimo per registrare e rigiocare le partite.
- Molti sistemi sono già fuori dalla scena: trappole, pericoli, passanti, missioni, storia, sigilli, meccaniche di bioma, ombra, voce dei boss.

### Punti deboli
1. **`GameScene.ts` ha 5.8k righe e circa 180 campi** azzerati a mano in `create()`. Il DEV_LOG lo ammette: "ogni campo nuovo va azzerato lì". Contiene ancora le abilità (clone, analisi, scudo, bottiglia: ~600 righe), gli script dei capitoli (lametta, smela, ivan, void, baruffoni, patto, inseguimento nella tana, doomsday: ~1500 righe), le interazioni con gli npc, le ricompense, le arene, le sfide e il flusso dei capitoli. Ci sono 40 rami `def.id/def.script === '…'`, 143 letture o scritture di flag, 160 `bus.emit`, 55 `delayedCall` e 42 tween.
2. **Singleton globali con stato mutabile**: `state` (anche `godMode`), `flashback`, `music`, `acoustics`, `sfx`, `bus`. È da qui che nascono i bug di "stato rimasto appeso" trovati sotto.
3. **Errori inghiottiti**: ci sono 123 `catch {}` vuoti, di cui 90 solo nel `FlashbackManager`. I bug ci sono ma non si vedono.
4. **Non è deterministico**: 201 `Math.random` (21 nelle scene, 29 nelle entità, 85 nel motore), tween di Phaser sul tempo reale (`TweenManager.getDelta` usa `Date.now`), un `setTimeout` nella logica (l'hitstop, ora corretto), `performance.now` sparsi. Due partite con gli stessi tasti non danno lo stesso risultato.
5. **Zero test**. Il bot esistente (`scripts/playtest/bot.mjs`) è un giro di fumo: si teletrasporta tra le tappe, toglie il danno al geco e chiama `boss.takeDamage` direttamente. È utile per scovare i blocchi, ma non verifica il comportamento.
6. Bundle in un solo chunk da 2.6 MB. Per un gioco non è grave, lo annoto e basta.

## Bug trovati e sistemati su `remaster` (verificati a runtime)

Li ho verificati con un harness headless (Playwright, frame fatti avanzare a mano). Ogni bug è confermato sulla build originale e risolto su quella corretta.

| bug | effetto | causa | fix |
|---|---|---|---|
| uscire al menu durante un flashback | **invincibilità** per il resto della sessione, **tutti i capitoli sbloccati** nel menu capitoli (legge `godMode`), musica al 30% anche nel menu, didascalia del film incollata sullo schermo, e un Invio successivo poteva far ripartire il dialogo del film nel livello nuovo | lo SHUTDOWN della scena non ripristinava lo stato globale e lasciava il listener `keydown` vivo | `restoreGlobals()` unico, chiamato sia alla fine normale sia allo shutdown |
| dopo ogni flashback | la **vignetta del livello spariva** fino al cambio di livello | `cam.postFX.clear()` distruggeva anche la vignetta del gioco | la vignetta del gioco viene neutralizzata e ripristinata, e si rimuovono solo le pipeline del film |
| saltare un flashback | **lo zoom della camera cresceva** a ogni film saltato (1.05 → 1.061 → 1.072…) | lo zoom lento del film continuava a girare e ignorava quello di uscita | reset degli effetti della camera prima dell'uscita e alla fine |
| fine del film | tra la fine visiva e il ripristino poteva partire un secondo film sopra il primo | `playing = false` veniva impostato all'inizio dell'uscita | `playing` resta vero finché tutto non è ripristinato |
| pausa durante un film | didascalia e barre coprivano il menu di pausa e ne **rubavano i clic** | z-index sopra `#ui` | nascoste mentre è aperta una schermata |
| pausa entro 55 ms da un colpo | **fisica al rallentatore (×1/6)** fino al colpo successivo | l'hitstop usava `setTimeout` e `isActive()` è falso in pausa | orologio della scena |
| velo di galliate e marcetti | listener di resize mai rimosso a ogni ingresso | | rimosso allo shutdown |
| editor | `tsc` dell'editor falliva | mancava il caso `spawner` | aggiunto |

## Giro di fumo col bot vecchio

Ho rigenerato le tappe (`scripts/world/run.sh waypoints all`) e fatto girare `scripts/playtest/bot.mjs` sulla build di sviluppo. Il bot è rimasto indietro rispetto alla UI: non sapeva chiudere il riepilogo di capitolo, la card del frammento e il tabellone del citelis (ora scritto in minuscolo). Dopo averlo adattato in locale passa perduta e arriva a guggu nel bus. Lì si ferma, ma per un limite suo: fa avanzare i frame in modo sincrono, mentre i tween di Phaser seguono il tempo reale, quindi la scena del sacrificio di ivan per lui non finisce mai. Rifatto a tempo reale, lo scontro si chiude normalmente (ivan si sacrifica a 15, guggu muore).

Conclusione: niente blocchi trovati, ma il bot vecchio non basta per una campagna completa. È il motivo per cui il bot nuovo deve controllare l'orologio (vedi sotto).

Rumore in console: `assets/backgrounds/void.png` non esiste (404). È gestito, perché si ricade sul fondale generico, ma il void non ha un dipinto suo.

## I flashback

Oltre ai bug sopra, ci sono problemi di impostazione:
- **Non fermano il mondo**: congelano solo nemici, boss, voci e ingaggi. Trappole, allagamenti, meccaniche di bioma, inseguimento della tana, doomsday (che può aprire un dialogo e mettere in pausa la scena a metà film), timer delle corse e agguati continuano a girare. Il geco viene reso invisibile, stordito e invincibile tramite `state.godMode` globale, poi rimesso al suo posto.
- **Sono una presentazione con didascalie**: due sprite che ondeggiano su un rettangolo nero al 97% (il "livello vero come palco" in pratica non si vede), con tre didascalie lunghe che raccontano cose che non si vedono ("carte ovunque", "timbro sopra"). È l'opposto del "mostrare, non spiegare" dell'ADR-029. Durano circa 19 secondi.
- Sono stati riscritti 5 volte in 3 giorni, sempre dentro lo stesso schema.

Proposta: **non rifarli adesso**. Nel refactor diventano un sistema di cutscene vero, che mette in pausa la simulazione come fanno i dialoghi (niente `godMode`, stun o giocatore nascosto) e possiede tutto il proprio ciclo di vita. Restano identici nell'aspetto, perché il refactor non deve cambiare niente. Ridisegnarli (per esempio tavole illustrate a inchiostro, o scene giocate dal motore con attori veri) è una decisione di prodotto tua, da prendere dopo il refactor, su una base pulita.

## Altro da annotare per il refactor (non bloccante)
- Il `create()` di `GameScene` registra due listener SHUTDOWN separati e decine di reset manuali: ogni sistema estratto deve avere un proprio `destroy()`.
- `startDialogue` riprova ogni 1.2 s se un film è in corso: andrebbe messo in una coda esplicita.
- `setupBossColliders` aggiunge collider a ogni boss senza toglierli: restano quelli del boss distrutto.
- Logica e grafica mescolate ovunque nelle abilità: danni, tween e particelle nella stessa funzione.
- Il gioco non ha un limite agli fps. La fisica arcade ha passo fisso, ma la logica gira a ogni frame: su uno schermo a 120 Hz `update()` gira il doppio delle volte (per esempio i controlli casuali per frame del trenbolone).
- I file `editor/*.tsbuildinfo` sono tracciati da git e cambiano a ogni typecheck: vanno nel `.gitignore`.

## Prerequisito del refactor: il bot di test

L'obiettivo è che il giocatore non si accorga di nulla. Per dimostrarlo servono partite **ripetibili al frame**, giocate su `main` e sul branch del refactor, con lo stesso risultato. Proposta:

1. **Runner deterministico** (nessuna modifica al gioco): Chromium headless con `playwright-core` (già nei `node_modules` del branch multiplayer), la build servita via route interception (niente dev server), `Math.random` con seed iniettato prima del boot, orologio finto (`Date.now`, `performance.now`, timer) e game loop fatto avanzare a mano a 60 Hz, render compreso. Lo stesso input produce sempre la stessa partita.
2. **Tracce**: a ogni frame (o ogni N frame) un'impronta dello stato osservabile: posizione, velocità e vita del geco, stanza, boss e nemici svegli, salvataggio (flag, oggetti, barre, abilità), eventi del bus (dialoghi, scelte, toast, ingaggi, finali), DOM della UI. Il confronto `main` contro refactor dice esattamente il primo frame in cui qualcosa diverge.
3. **Scenari**:
   - il bot della campagna, riscritto: tutti i capitoli, i rami delle scelte, tutti i finali e i capitoli segreti;
   - scenari mirati: ogni boss, ogni flashback, ogni meccanica di bioma, morte e ripresa, salvataggio e caricamento, telefono, negozio, missioni, corse, arene, sigilli;
   - **partite vere registrate da te**: i tasti con il numero del frame, rigiocati sui due branch.
4. **Prestazioni**: tempo CPU per frame e per sistema sugli stessi scenari, prima e dopo.

Regola per il refactor: i passi puramente strutturali (spostare codice in sistemi senza cambiare l'ordine delle chiamate) devono dare **tracce identiche al bit**. I passi che cambiano l'ordine di proposito (RNG centralizzato, eventi espliciti, `simulates`) si fanno dopo, uno alla volta: le tracce di riferimento si rigenerano solo dopo aver controllato l'equivalenza sugli esiti degli scenari.
