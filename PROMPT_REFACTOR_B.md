# Prompt per la sessione del refactor di GECOWAVE: parte B (il refactor vero)

Lavori su **GECOWAVE: The Flux of Cosenza**, un metroidvania souls-like in Phaser 3 + TypeScript + Vite. La repo è `/Users/ema/Projects/geco-game/gecowave-game` (remote `github.com/emqnuele/gecowave-game`). Io sono Ema, l'autore. Parlami in italiano.

## Il compito, in una frase

Rifattorizza il gioco, a partire dal god object `GameScene` (5804 righe, 168 metodi, ~180 campi), migliorando enormemente la qualità del codice e le prestazioni **senza cambiare nemmeno un comportamento**. Il giocatore non deve accorgersi di nulla, a parte il gioco più fluido. Gli strumenti per dimostrarlo esistono già (parte A, fatta da un'altra sessione): ogni passo si confronta empiricamente con `main` e il diff ti dice "qui hai dimenticato qualcosa", "qui è diverso", con fotogramma, campo e riga `.ts`. La regola d'oro è **niente passo di refactor senza una prova che dice che è uguale a main**.

## Leggi prima di toccare qualsiasi cosa

Nell'ordine:
1. `DEV_LOG_REFACTOR.md`: il diario della parte A. Cosa è stato fatto, come, perché, cosa è stato trovato. È la memoria tra le sessioni: **tienilo aggiornato tu** a ogni traguardo.
2. `docs/refactor/parte-a.md`: il resoconto finale della parte A (numeri, limiti, punti ciechi, cosa fidarsi e cosa no).
3. `scripts/harness/README.md`: tutti i comandi e le trappole già incontrate. Leggilo tutto: ogni trappola è costata ore.
4. `docs/refactor/mappa-sistemi.md`: la bozza dei sistemi da estrarre, con righe, campi, contratti pubblici della scena e **l'ordine di `update()` da conservare**.
5. `docs/refactor/ledger.md`: il registro membro per membro di `GameScene` (righe su main, scenari che lo eseguono, destinazione, stato).
6. `docs/refactor/copertura.md`, `docs/refactor/mutazioni.md`, `docs/refactor/prestazioni.md`, `docs/refactor/bug-trovati.md`, `docs/refactor/riferimenti.md`.
7. `PIANO_REFACTOR.md` (fase 2 è tua; fase 3, il coop, **non è tua**), `ANALISI_REMASTER.md`, `DEV_LOG.md` (architettura e ADR fino a ADR-050: le regole sottili che il refactor deve conservare), `REMASTER.md`, `README.md`.
8. Poi il codice: `src/scenes/GameScene.ts`, `src/entities/*`, `src/engine/*`, `src/main.ts`, `src/ui/*`.

## Stato di partenza

- Branch `refactor` (tagliato da `main` al commit `a16f39c`): contiene solo strumenti, scenari e documenti, **nessuna riga del gioco è cambiata** (`git diff a16f39c -- src` è vuoto). Lavora lì. Non committare su `main` e non pusharlo senza chiedermelo; pushare `refactor` va bene.
- Il riferimento è il worktree `../gecowave-main` allo stesso commit `a16f39c`, con `node_modules` in symlink. Se manca: `git worktree add ../gecowave-main a16f39c && ln -s ../gecowave-game/node_modules ../gecowave-main/node_modules`, poi `scripts/harness/build.sh ../gecowave-main`.
- Gli hash del riferimento sono in `scripts/harness/reference.json`. Le tracce complete di main stanno in `.harness/traces/ref` (cartella ignorata da git): se mancano, `node scripts/harness/corpus.mjs ref` le rigenera e **gli hash devono tornare identici** a `reference.json` (è anche una prova che la macchina va bene).
- Nella cartella ci sono cose non tracciate da ignorare: `.env` (segreti del coop, **mai committarlo**), `tests/coop-2tab/out`.
- Il branch `multiplayer-p2p` è un tentativo di coop: **non toccarlo**.
- Il tag `v2-pre-refactor` del piano lo faccio io.

## Gli strumenti (già pronti, provati)

```bash
scripts/harness/build.sh                                  # build di sviluppo del branch (dist-dev): hook, sourcemap, niente minify
node scripts/harness/corpus.mjs check --tier rapido       # il giro rapido (vedi sotto): dopo ogni micro-passo
node scripts/harness/corpus.mjs check                     # tutto il corpus contro main: prima di ogni commit
node scripts/harness/corpus.mjs check --only cap-bus,campagna   # scenari scelti (anche per prefisso)
node scripts/harness/corpus.mjs self --only ...           # la stessa build due volte: se diverge, è un buco dell'harness
node scripts/harness/show.mjs .harness/traces/cur/<id>.jsonl.gz      # racconta una traccia
node scripts/harness/coverage.mjs --reuse                 # copertura (rigenera docs/refactor/copertura.md)
node scripts/harness/mutate.mjs                           # mutazioni di prova (docs/refactor/mutazioni.md)
node scripts/harness/perf.mjs --save cand --profile       # prestazioni in tempo reale, da confrontare con perf-base.json
node scripts/harness/ledger.mjs                           # rigenera il registro (conserva destinazione e stato scritti a mano)
node scripts/harness/tiers.mjs                            # ricalcola il giro rapido dalla copertura
node scripts/harness/corpus.mjs run --seed 777            # il corpus con un altro seed (traces/seed-777)
node scripts/harness/esiti.mjs [dirA] [dirB]              # confronto sugli esiti, non al bit (default: ref contro cur)
node scripts/harness/caso.mjs                             # censimento delle estrazioni casuali -> docs/refactor/caso.md
```

`check` stampa per ogni scenario diverso il **primo fotogramma** in cui diverge, le sezioni (geco, boss, entità, display list, ordine di disegno, corpi, luci, camera, stato di run, salvataggio, ui, musica, eventi, suoni, localStorage, console), campo per campo prima e dopo, e le righe `.ts` che hanno emesso eventi e suoni in quel fotogramma. Per display list, entità, corpi e luci rilancia da solo le due build con le impronte complete. Il report va anche in `.harness/report-check.txt`.

Tempi indicativi su questa macchina (Apple M5, 4 job): giro rapido ~XX minuti, corpus intero ~XX minuti. Più di 4 job non conviene (core di efficienza e processo gpu di chromium).

Cosa sa e non sa la rete (dettagli in `docs/refactor/parte-a.md`):
- La copertura del corpus su `GameScene`, `entities/`, `engine/`: XX% dei bracci di ramo e XX% delle funzioni enumerati dal sorgente. I punti ciechi rimasti sono elencati e classificati (difensivi, codice che i dati non raggiungono, raggiungibili ma scoperti).
- Le mutazioni di prova: XX/XX scoperte.
- Il determinismo è dimostrato su tutto il corpus tra processi diversi (`ref` contro `check` della stessa build).
- Il disegno webgl non si confronta (si disegna un fotogramma su quattro e i pixel non entrano nella traccia): si confronta la display list, che è più robusta. Se tocchi codice che gira solo al momento del disegno (`normalFlip`, pipeline), la rete lo vede solo se cambia lo stato o lancia un errore.
- La sonda e il bot trovano le cose **per forma** (il geco è l'oggetto con `attackHitbox` e `cooldowns()`, il boss quello con `def.kind` ed `engaged`, i nemici quelli con `arch` e `mode`), mai per campo privato della scena: spostare campi nei sistemi non rompe gli strumenti. Unica eccezione: `waitPlayer` in `scripts/harness/game.mjs:165` aspetta `GameScene.player`. Se quel campo cambia nome o posto, passa a `__h.find.player()` e prova con `self` che i fotogrammi restino gli stessi. Gli script vecchi `determinism.mjs`, `flashback-lifecycle.mjs` e `hitstop-pause.mjs` chiamano metodi privati: sono precedenti al corpus e non fanno parte della rete.
- **Al bit o sugli esiti.** `check` vuole tracce identiche al bit. Per i passi che cambiano l'ordine di proposito c'è `esiti.mjs`: la trama (livelli, dialoghi, scelte, boss, abilità, trofei, capitoli, flag e oggetti del salvataggio, errori) deve coincidere; i numeri del combattimento (morti, nemici, punteggi, tempi, abitudini lette dall'ombra) si riportano a parte, da giudicare. Il corpus fatto girare con un altro seed (`run --seed`) è la misura di quanto quei numeri si muovono già per il solo caso: __SEED_ESITO__

## Regole di lavoro (non negoziabili)

- **Commit**: dopo ogni passo completato e verificato. Messaggio in italiano, minuscolo, al massimo 5-6 parole, linguaggio semplice (`git add .` e `git commit -m "..."`). **Mai co-autori, firme o menzioni di Claude.**
- **Commenti nel codice**: solo il PERCHÉ di una scelta, mai il cosa. Una riga sola, tutta minuscola, in italiano come il resto del codice. Pochi; nel dubbio, niente commento. Niente emoji.
- **Python**: solo con `uv` (`uv run`, `uvx`), mai `pip` o `python3` diretto.
- **Browser**: non usare mai il browser pane né un dev server per verificare. Usa l'harness headless. Per le verifiche di tipo, `npx tsc --noEmit` e `npm run build`. Anche l'editor deve compilare: `cd editor && npx tsc -b --noEmit`, poi `git checkout -- editor/*.tsbuildinfo` (sono tracciati e cambiano a ogni typecheck).
- **Non toccare**: lo stile grafico, i testi di trama (la voce è minuscola, demenziale, in italiano), i JSON in `public/regions/` (**non rigenerarli**), il formato del salvataggio. I salvataggi di `main` devono caricarsi identici nel refactor (ci sono scenari che lo controllano: `carica-*`).
- **Bug trovati per strada**: nei commit di refactor **non si sistemano**. Si annotano in `docs/refactor/bug-trovati.md` (ce ne sono già: leggili) e si sistemano dopo, in commit separati e dichiarati, rigenerando il riferimento con una nota in `docs/refactor/riferimenti.md`.
- **Il riferimento si rigenera solo con il mio ok.**
- Pensa da ingegnere senior: corretto prima che veloce, chiaro prima che furbo. Se una richiesta ti sembra sbagliata o c'è un rischio, dimmelo.

## Il refactor

### Obiettivo architetturale

`GameScene` diventa solo un orchestratore: `create()` compone i sistemi nell'ordine attuale, `update()` li chiama nell'ordine attuale, lo shutdown chiama i loro `destroy()`. Ogni sistema ha la sua `update()`, lo stato separato dal rendering e il proprio `destroy()`. La bozza dei sistemi è in `docs/refactor/mappa-sistemi.md` (LevelWorld, Combat, Abilities, Enemies, Bosses, script dei capitoli uno per capitolo invece dei 40 rami `def.id === '…'`, Npc e interazioni, Rewards, progressione e viaggio, Sfide, Dialoghi e cutscene, Eventi): confermala o correggila dopo averla messa alla prova, e scrivi la decisione come ADR nel `DEV_LOG.md`. La logica (cosa succede) va separata dalla presentazione (cosa si disegna e si suona). Le cose importanti diventano eventi espliciti: spawn, danno, morte, inizio e fine dialogo, checkpoint.

### Metodo

1. **Mappa prima, sposta dopo.** Il registro `docs/refactor/ledger.md` c'è già (generato dall'AST, con gli scenari che eseguono ogni metodo). Compila la colonna destinazione prima di spostare un sistema; aggiorna lo stato (da fare, portato, verificato) dopo. Per gli altri file che tocchi: `node scripts/harness/ledger.mjs src/entities/Player.ts ...`. Una riga senza destinazione e senza verifica non è portata.
2. **Un sistema per commit, gioco funzionante dopo ogni commit.** Dopo ogni micro-passo: `tsc`, build, giro rapido. Prima del commit: `npm run build`, editor, **corpus intero** contro il riferimento, registro aggiornato, `DEV_LOG_REFACTOR.md` aggiornato.
3. **I passi strutturali devono dare tracce identiche al bit.** Spostare codice senza cambiare l'ordine delle chiamate (comprese le chiamate a `Math.random`, i `delayedCall`, la creazione degli oggetti, la registrazione degli ascoltatori e dei collider) mantiene le tracce identiche. Se una traccia diverge, il passo non è finito: trova la causa col diff. "È equivalente" non basta.
4. **I cambi che cambiano l'ordine di proposito vengono dopo, uno alla volta, con un riferimento nuovo dichiarato e il mio ok**: RNG centralizzato con seed al posto delle 204 estrazioni casuali (almeno quelle di logica; l'elenco con file, riga e funzione è `docs/refactor/caso.md`), eventi espliciti dove cambiano l'ordine, e il flag unico `simulates` pensato per il coop. Per questi passi l'uguaglianza al bit non è possibile:
   - prima `esiti.mjs` tra il riferimento e il candidato: la trama deve coincidere su tutto il corpus, i numeri devono restare nella forbice che lo stesso corpus mostra con un altro seed (`run --seed 777`, poi `esiti.mjs .harness/traces/ref .harness/traces/seed-777`);
   - poi, con il mio ok, il riferimento nuovo si prende **dal commit del refactor** che introduce il cambio, non più da main: `git worktree add ../gecowave-base <commit>`, `ln -s ../gecowave-game/node_modules ../gecowave-base/node_modules`, `scripts/harness/build.sh ../gecowave-base`, `REF_DIST=../gecowave-base/dist-dev node scripts/harness/corpus.mjs ref`. Da lì in avanti `check` si fa con lo stesso `REF_DIST`, e la riga va in `docs/refactor/riferimenti.md` (data, commit, perché, scenari);
   - `../gecowave-main` resta com'è: serve a `ledger.mjs`, `coverage.mjs` e `mutate.mjs`, che ragionano sulle righe di main.
5. **Test di unità** (vitest, `npm i -D vitest`) sulla logica pura che estrai: danni, fasi dei boss, cervello dell'ombra, punteggi, migrazioni del salvataggio.
6. **Dopo ogni sistema estratto** rifai la prova delle mutazioni sul codice nuovo (`mutations.mjs` va aggiornato: le righe si spostano): la rete deve restare fitta. Rifai la copertura ogni tanto (`coverage.mjs --reuse` dopo aver tolto i grezzi degli scenari cambiati) e ricalcola il giro rapido.
7. **Prestazioni**: ogni gruppo di sistemi, `perf.mjs --save cand --profile` contro `perf-base.json` (a macchina scarica, niente altri job). Il DEV_LOG (ADR-032) e il profilo di base dicono dove si spende oggi.

### Trappole note del codice

- `GameScene.create()` azzera a mano circa 180 campi, perché Phaser **riusa la stessa istanza di scena** a ogni restart. Un sistema estratto deve nascere e morire con la scena: mai stato che sopravvive al restart per sbaglio.
- **L'ordine di `update()`** (righe 2825-2912, ricopiato in `mappa-sistemi.md`) è un contratto: nemici, boss e voci si fermano durante i film, l'ingaggio dei boss aspetta la fine del film, il tremito del trenbolone chiama `Math.random` a ogni frame di render.
- **Contratto implicito della scena**: `FlashbackManager` usa per duck typing `vignette`, `setPropsVisible` e `findFlatStage`; `Player` usa `cloneAlive` (`Player.ts:441`). Vanno conservati o sostituiti da un'interfaccia tipata passata esplicitamente.
- `setupColliders` contiene un blocco per il boss quasi uguale a `setupBossColliders`, ma **non identico** (toast di guggu e limite, rimando che tocca il boss una volta sola): conserva entrambe le varianti finché non decidi diversamente come bug dichiarato.
- `interactables` è un array condiviso in cui scrivono npc, passanti, missioni, storia, meccaniche, sigilli, sfide e corse: l'ordine di inserimento conta (a parità di distanza vince il primo).
- Ci sono singleton globali con stato mutabile: `state` (anche `godMode`), `flashback`, `music`, `acoustics`, `sfx`, `bus`. I bug trovati in revisione nascevano da stato globale non ripristinato. I listener sul DOM, su `window`, su `scale` e sul bus vanno sempre tolti: la diagnostica della traccia (`busHandlers`, `sceneListeners`, `scaleListeners`) lo controlla.
- I flashback oggi non mettono in pausa la simulazione: congelano solo alcuni sistemi e rendono il geco invisibile e invincibile. Nel refactor diventano un sistema di cutscene vero, ma **identico nell'aspetto e nei tempi**. Il ridisegno (e la questione dei shader mai registrati, vedi i bug) è una decisione mia, per dopo.
- Ci sono 109 `catch {}` vuoti (87 nel `FlashbackManager`; contati sul sorgente, senza i `.catch(() => {})` delle promesse). Quando li sostituisci con controlli espliciti, il comportamento nei casi normali deve restare uguale. Le tracce te lo dicono (la sezione `con` registra errori e avvisi).
- La logica gira a ogni frame di render (non c'è un limite agli fps), mentre la fisica arcade ha passo fisso a 60. Non cambiare questo rapporto nel refactor: annotalo come proposta.
- `setupBossColliders` accumula collider dei boss distrutti: bug da annotare (già in `bug-trovati.md`), non da sistemare dentro un commit di refactor.

### Quando una traccia diverge

Il report dice fotogramma, sezione e campo. Le cause tipiche di un passo "strutturale" che non lo è:
- **`dlo` (ordine di disegno) diverso, `dl` uguale**: hai cambiato l'ordine di creazione di oggetti alla stessa profondità.
- **`ev`/`sev` con gli stessi eventi in ordine diverso**: ascoltatori registrati in un altro ordine (bus, eventi di scena), o un `emit` spostato prima o dopo un altro.
- **`pl`/`ent`/`bod` diversi di poco, poi a valanga**: ordine dei collider o dell'`update` dei sistemi cambiato, oppure un `Math.random` estratto in un altro ordine. Guarda le righe `.ts` di `sfx` ed `ev` nel fotogramma.
- **`diag` diverso ma tutto il resto uguale**: un ascoltatore o un timer in più o in meno. Non è ancora comportamento, ma lo diventerà al prossimo restart della scena: sistemalo subito.
- **diverge solo dopo un restart della scena** (morte, cambio di capitolo): un campo che il sistema nuovo non azzera, o un ascoltatore non staccato allo `SHUTDOWN`.
- **`con` con un errore nuovo**: un `catch {}` vuoto che prima inghiottiva un errore e ora no, o il contrario.
- Prima di dare la colpa al codice, `corpus.mjs self --only <id>`: se la stessa build diverge da sé, è un buco dell'harness e va chiuso prima di tutto.

### I blocchi della parte B

Ogni blocco finisce con: `tsc`, build, editor, corpus intero uguale al riferimento, registro aggiornato, `DEV_LOG_REFACTOR.md` aggiornato, commit. Dentro un blocco, un micro-passo alla volta col giro rapido.

**B0. Preparazione (niente codice del gioco).**
- Leggi tutto l'elenco sopra.
- Controlla la macchina: `node scripts/harness/corpus.mjs ref --only cap-bus,campagna` deve ridare gli stessi hash di `reference.json` (se no, la macchina o l'harness sono cambiati: fermati e capisci perché).
- `npm i -D vitest` e uno script `test` in `package.json`.
- Scrivi l'ADR-051 nel `DEV_LOG.md`: forma di un sistema, contesto passato ai sistemi, facciata pubblica della scena.

**B1. Lo scheletro.**
- Un'interfaccia piccola per i sistemi (per esempio `update(time, delta)` e `destroy()`) e un contesto tipato con quello che serve davvero (scena, geco, mondo, bus...), al posto dell'accesso alla scena intera.
- La facciata per i quattro usi esterni per duck typing (`vignette`, `setPropsVisible`, `findFlatStage`, `cloneAlive`): un'interfaccia tipata, implementata dalla scena.
- Nessuna logica spostata: le tracce devono restare identiche al bit (è la prova che lo scheletro non cambia l'ordine di niente).

**B2. `LevelWorld`, servizio di sola lettura.**
- Le query sul mondo: stanze, progresso, punti liberi, palco dei film.
- Quasi tutti gli altri sistemi ne dipendono, ed è il passo con meno stato.

**B3. `Rewards` e `Interactions`.**
- Il registro degli interattivi, con l'ordine di inserimento conservato.
- Piccoli e ben coperti: insegnano il metodo.

**B4. `Abilities`.**
- Clone, analisi, scudo, bottiglia, veleno, risonante: circa 650 righe, molto coperte da `wave-*`, `wave-boss-*`, `rimando-*`, `sigillo-*`.
- Qui si separa per la prima volta la logica dalla presentazione dentro un sistema: le funzioni pure (danni, durate, bersagli) escono e prendono i loro test vitest.

**B5. `Enemies` e nidi, poi `Combat`.**
- `Combat` comprende collider, danni e proiettili.
- Attenzione all'ordine di creazione dei collider: phaser li processa nell'ordine in cui sono nati, e la diagnostica `colliders` della traccia lo conta.

**B6. `Bosses` e il modulo `Arena`.**
- `Arena` (sbarre, blocco della stanza) è condiviso con le sfide.
- Spezza `onBossDefeated` (234 righe) in una parte comune (flag, trofeo intoccabile, amuleto, doomsday) e nei casi per capitolo.

**B7. Gli script dei capitoli.**
- Uno per capitolo invece degli 80 rami su `def.id` e dei `case` sparsi in `GameScene`.
- Un'interfaccia con gli agganci che servono (preparazione, `update`, boss sconfitto, interazione), registrata per id di capitolo.
- `interactNpc` (242 righe) si divide tra npc e capitoli.
- **L'ordine in cui gli script girano dentro `update()` deve restare quello di oggi** (`mappa-sistemi.md`, punto 12).

**B8. Progressione e viaggio, sfide, doomsday.**

**B9. Dialoghi e cutscene.**
- Per ultimi: sono i più intrecciati coi singleton.
- La coda dei film oggi è un `delayedCall` che si richiama ogni 1,2 s. Nel passo strutturale resta così; la coda vera è un passo che cambia i tempi, quindi va col blocco B11.

**B10. Prestazioni, a struttura finita.**
- Le ottimizzazioni prese da `prestazioni.md` (dove si spende oggi), una alla volta.
- Ognuna deve dare tracce identiche al bit (più veloce, non diverso) e un numero migliore in `perf.mjs --vs base`.

**B11. I cambi d'ordine voluti, uno per volta, ognuno col mio ok e un riferimento nuovo** (metodo, punto 4):
1. eventi espliciti (spawn, danno, morte, dialogo, checkpoint);
2. RNG centralizzato. Due sequenze con seed: logica e cosmetico, così una particella in più non sposta più la trama. Si parte da `caso.md`, riempiendo la colonna "tipo";
3. il flag `simulates`. **Su main non c'è nessun `isHost`**: i 107 controlli stanno sul branch `multiplayer-p2p`, che non devi toccare. Qui `simulates` è solo il punto unico che i sistemi interrogano; in single vale sempre vero, quindi deve dare tracce identiche al bit;
4. i `catch {}` vuoti sostituiti da controlli espliciti, dove il comportamento normale resta uguale (al bit).

**B12. Chiusura.**
- Mutazioni rifatte sul codice nuovo (`mutations.mjs` aggiornato alle righe nuove), copertura, giro rapido ricalcolato, registro tutto "verificato".
- Resoconto finale e la lista dei bug annotati da decidere con me.

## Come mi tieni aggiornato

- Lavora in autonomia per lunghi tratti. Fermati e chiedimi solo per le decisioni che sono mie: prodotto, design, cosa considerare codice morto (c'è una lista in `bug-trovati.md` da farmi decidere), rigenerazione del riferimento.
- A ogni traguardo (ogni gruppo di sistemi estratti) scrivi un resoconto breve: cosa è fatto, cosa dice il confronto, cosa diverge e perché, bug annotati, numeri delle prestazioni.
- Tieni aggiornati `DEV_LOG_REFACTOR.md` (diario), `DEV_LOG.md` (nuovi ADR per le scelte architetturali, nello stesso stile), `PIANO_REFACTOR.md` (spunta le voci) e il registro.
