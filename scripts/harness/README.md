# harness: il gioco vero, ripetibile al frame

Base del confronto tra `main` e il refactor. Fa girare la build di sviluppo in chromium headless (`playwright-core`) e controlla tutto ciò che il gioco legge come "tempo" o "caso". Lo stesso input produce sempre la stessa partita, al bit. Sopra ci stanno la sonda delle tracce, il diff, il corpus degli scenari, la copertura.

```bash
scripts/harness/build.sh                          # build di sviluppo (hook window.__*, sourcemap, niente minify)
scripts/harness/build.sh ../gecowave-main         # la stessa per il riferimento, nel worktree di main
node scripts/harness/corpus.mjs ref               # tracce di main, hash in reference.json
node scripts/harness/corpus.mjs check             # la build corrente contro main: dice dove diverge
node scripts/harness/corpus.mjs self              # la stessa build due volte: devono essere identiche
node scripts/harness/corpus.mjs run --only campagna   # un giro senza confronti (VERBOSE=1 o 2 per il diario del bot)
node scripts/harness/coverage.mjs                 # copertura del corpus su main -> docs/refactor/copertura.md
node scripts/harness/show.mjs <traccia>           # racconta una traccia: livelli, dialoghi, scelte, toast, morti
node scripts/harness/tracediff.mjs <a> <b>        # il primo fotogramma in cui due tracce divergono
node scripts/harness/corpus.mjs check --tier rapido   # il giro rapido (tiers.json, da tiers.mjs)
node scripts/harness/corpus.mjs run --seed 777    # il corpus con un altro seed, in traces/seed-777
HZ=120 node scripts/harness/corpus.mjs run        # su un monitor a 120 hz (multipli di 60), in traces/hz-120
node scripts/harness/esiti.mjs [dirA] [dirB] --rumore .harness/traces/seed-777   # sugli esiti, non al bit
node scripts/harness/mutate.mjs                   # mutazioni di prova -> docs/refactor/mutazioni.md
node scripts/harness/perf.mjs --save cand --vs base --profile   # prestazioni in tempo reale contro perf-base.json
node scripts/harness/ledger.mjs                   # registro membro per membro -> docs/refactor/ledger.md
node scripts/harness/caso.mjs                     # censimento delle estrazioni casuali -> docs/refactor/caso.md
node scripts/harness/names.mjs                    # i nomi rinominati dal bundler (finiscono nelle tracce) uguali a main
```

**Al bit o sugli esiti.** `check` vuole tracce identiche al bit: è la prova per ogni passo che sposta codice senza cambiare l'ordine delle chiamate. I passi che cambiano l'ordine di proposito (rng centralizzato, eventi riordinati) non possono darla: per quelli `esiti.mjs` confronta la trama (livelli, dialoghi, scelte, boss, abilità, trofei, capitoli, flag e oggetti del salvataggio finale, errori) e riporta a parte i numeri del combattimento (morti, nemici, punteggi, tempi, abitudini lette dall'ombra). La trama deve coincidere; i numeri si giudicano, e il confronto col corpus fatto girare con un altro seed (`run --seed`) dice quanto si muovono già per il solo caso: con `--rumore` gli scenari che cambiano trama anche solo cambiando seed (27 su 198 con seed 777: battute casuali, agguati, nastri, campagna) si riportano a parte; per gli altri la trama deve coincidere.

`--only a,b` sceglie gli scenari (anche per prefisso), `--jobs N` quanti in parallelo (default 4). `REF_DIST` e `DIST` cambiano le build. Le tracce complete stanno in `.harness/` (ignorata da git), gli hash del riferimento in `reference.json`.

## i pezzi

- `game.mjs`: il runner deterministico (sotto).
- `probe.js`: la sonda iniettata prima del gioco. A ogni fotogramma un'impronta dello stato osservabile, indipendente da come è scritto il codice: geco e boss (tutti i campi e il corpo fisico), entità del gioco (ogni oggetto di una classe es6: nemici, nidi, clone...), display list come multiinsieme e, a parte, l'ordine di disegno a parità di profondità, corpi fisici, luci, camera e effetti, salvataggio e stato di run, dom della ui, musica e acustica, eventi del bus e di scena, suoni, scritture su localStorage, errori e avvisi in console. In più una diagnostica (tween, timer, collider, ascoltatori di bus e scena) che non è comportamento ma avvisa in anticipo. Ogni evento, suono e chiamata alla musica porta anche la riga del bundle che l'ha fatto: il diff la riporta al file `.ts`.
- `runner.mjs`: esegue uno scenario e scrive la traccia (gzip, una riga per fotogramma; le sezioni di stato solo quando cambiano).
- `tracediff.mjs`: il primo fotogramma diverso, le sezioni, campo per campo prima e dopo, chi ha emesso cosa. Per display list, entità, corpi e luci `corpus.mjs check` rilancia da solo le due build con le impronte complete attorno alla divergenza.
- `lib.mjs`, `bot.mjs`: i mattoni degli scenari. Salvataggi preparati solo con campi del formato di salvataggio, ui (dialoghi, scelte per titolo, carte, riepiloghi, film), tasti veri, teletrasporto tra tappe, combattimento a tasti.
- `scenarios/`: il corpus. `levels` (ogni capitolo dall'ingresso), `tapes` (nastri di tasti dal geco simulato), `campaign` (la campagna intera col bot), `chapters` (ogni capitolo dal suo salvataggio d'ingresso, con le varianti delle scelte e i capitoli segreti), `endings` (tutti i finali), `explore` (ogni punto verificato di ogni regione), `systems` (wave, morte e barre, cibo, telefono, pausa, menu, piazza, arene, corse, doomsday, film), `menu`.
- `coverage.mjs` + `branches.mjs`: copertura v8 del corpus mappata sui `.ts`. I rami e le funzioni si enumerano dall'ast di typescript, così il denominatore non dipende da cosa v8 ha visto.
- `data/waypoints.json` (tappe del bot, `scripts/world/run.sh waypoints all`), `data/tapes/` (nastri, `scripts/world/run.sh tapes all scripts/harness/data/tapes 6`), `data/saves/` (salvataggi d'ingresso dei capitoli, scritti dalla campagna con `SAVE_CHAPTERS=1`).

## come funziona il runner (`game.mjs`)

- **niente server**: `page.route` serve i file della build da disco su `http://gecowave.test`.
- **random**: `Math.random` sostituito prima del boot da mulberry32. `startLevel` rimette il seed all'avvio del livello.
- **orologio finto**: `page.clock.install` + `pauseAt`. `Date`, `performance.now`, `setTimeout` e i tween di Phaser (che leggono `Date.now`) avanzano solo quando lo dice il bot, a millisecondi interi 17/17/16.
- **loop di phaser addormentato** (`game.loop.sleep()`), poi un passo alla volta con `game.loop.step(t)`, dentro la pagina: un viaggio cdp per centinaia di fotogrammi.
- **tempo del loop costante a 16,67 ms**: dipende solo dal numero del frame (vedi le trappole).
- **animazioni web** (`element.animate`) messe in pausa e portate avanti dall'orologio finto: seguono il tempo reale e i riepiloghi ne dipendono.
- **partenza fissa**: boot fino al menu, un tasto sullo splash come un giocatore, poi `START_FRAME` e `window.__startLevel` (hook di sviluppo in `src/main.ts`). Uno scenario senza livello parte dal menu.
- **gpu**: angle su metal, 7 volte più veloce di swiftshader. La logica non legge mai i pixel del webgl; `GL=swiftshader` resta per le macchine senza gpu.
- **salvataggio vuoto**: `localStorage` viene svuotato a ogni pagina.

## trappole già incontrate (non ricaderci)

- `page.clock.install` da solo lascia scorrere il tempo: serve `pauseAt`. E `install` va messo qualche secondo prima dell'epoca: sotto carico `pauseAt` trovava l'orologio già oltre e falliva.
- Col `requestAnimationFrame` finto certi passi fanno scattare due frame e altri zero, a caso. Per questo il loop si addormenta e si fa avanzare a mano.
- Il `performance.now` finto si porta dietro una frazione dell'origine reale (±1 ms sul tempo assoluto). Per questo il tempo del loop lo decide il bot.
- `runFor` con millisecondi frazionari arrotonda: mai un `runFor` lungo al posto di tanti passi.
- **Il tempo del loop**: con 17/17/16 la media mobile del delta di phaser (10 campioni) oscilla attorno a 1000/60 e la fisica arcade salta un passo ogni tre fotogrammi, poi ne fa due. Il geco vero si staccava dal simulato. Con 16,67 costanti la fisica fa un passo per fotogramma e uno doppio ogni ~80 s, come su un monitor vero.
- Lo splash del menu ("premi un tasto") si mangia il primo tasto vero con `stopPropagation`.
- `page.evaluate(() => game.scene.pause(...))` restituisce lo SceneManager: serializzarlo fa crollare la pagina. Nelle evaluate le istruzioni vanno tra graffe.
- La sonda non deve mai serializzare grafi interi: un payload con dentro una scena pesava 250 MB in un fotogramma. Le istanze si riducono ai loro campi primitivi.
- Una traccia lunga (la campagna, 90 mila fotogrammi) non sta in una stringa sola: si scrive e si legge a pezzi.
- I passi nascosti delle schermate restano nel dom: il bot clicca solo quello che si vede (`offsetParent`), come `bindNav`.
- Viewport fisso (960×540): lo zoom della camera dipende dall'altezza della finestra.
- `sfx.init` consuma `Math.random` per i buffer di rumore in proporzione al sample rate dell'audio: sulla stessa macchina è costante, su un'altra la sequenza del caso si sposta. Riferimento e confronto vanno fatti sulla stessa macchina.
- **Il boot**: il caricamento degli asset va in tempo reale e la scena del menu gira già durante il boot (e si porta dietro il suo tempo anche dopo i titoli di coda). Mentre il loader lavora il gioco non avanza: si chiama a mano `load.update()` (il loader di phaser procede solo nell'update della scena), così il boot dura sempre un fotogramma.
- **`audio.paused`** lo decide la pipeline multimediale del browser in tempo reale: non entra nella traccia (le chiamate alla musica sì).
- **Il resize** arriva con l'evento del browser in tempo reale: si aspetta da fuori che la finestra abbia la misura nuova prima di far avanzare il gioco (i timer della pagina sono fermi, `waitForFunction` con polling non funziona).
- **Gli scenari cambiati dopo l'avvio di un `ref`** risultano diversi al `check`: il corpus si carica all'inizio del giro. Dopo un cambio, `corpus.mjs ref --only <id>`.
- **Il bot non deve girare a vuoto**: due morti contro lo stesso boss e si arrende; se un boss resta invulnerabile ripassa dalle tappe di trama. Senza queste due regole un capitolo segreto arrivava a 268 mila fotogrammi.
- **La scena negli eventi**: phaser passa la scena stessa all'evento `create`; la sonda la serializzava coi suoi campi privati, e togliere un campo dalla scena cambiava la traccia senza cambiare il gioco. Ora una scena negli argomenti di un evento si riduce a `{ scene: <chiave> }`.
- **L'hover sintetico**: quando il dom cambia sotto un cursore fermo (il menu di pausa che si apre), chromium manda `mouseover` e `mousemove` con un suo timer in tempo reale, e il menu suona `menuMove` a un fotogramma che dipende dal carico. La sonda lascia passare gli eventi di passaggio del mouse solo mentre uno scenario rigioca un movimento (`__h.mouseGate`, lo apre `scenarios/recorded.mjs`). Le partite registrate sono gli unici scenari col mouse vero.
- **I nomi delle classi nella traccia**: la sonda registra il nome del costruttore (`$c`, `cls`) e il bundle non minificato rinomina i nomi in conflitto (`Rectangle2`, `Systems2`). Un modulo nuovo con un nome già usato (una classe `Companion`, `Player`, `Rectangle`...) sposta le rinomine e cambia le tracce: controllare i nomi con suffisso numerico tra il bundle di main e quello nuovo.
