# DEV LOG — refactor di GameScene

Diario tecnico del refactor (fase 2 di `PIANO_REFACTOR.md`). Serve a chi riprende il lavoro in una sessione nuova: cosa è fatto, come, perché, cosa resta. Il prompt originale è `PROMPT_REFACTOR.md`; le decisioni di architettura vanno anche nel `DEV_LOG.md` come ADR (ADR-050 per l'harness).

Branch: `refactor`, tagliato da `main` al commit `a16f39c` (remaster mergiato + harness + sprite nuovo del geco). Riferimento: worktree `../gecowave-main` allo stesso commit.

---

## dove trovare le cose

| cosa | dove |
|---|---|
| runner, sonda, corpus, diff, copertura, mutazioni, prestazioni | `scripts/harness/` (README con comandi e trappole) |
| scenari | `scripts/harness/scenarios/*.mjs` |
| dati degli scenari | `scripts/harness/data/` (tappe, nastri, salvataggi d'ingresso dei capitoli, partite registrate) |
| hash del riferimento di main | `scripts/harness/reference.json` |
| tracce complete, copertura grezza, report | `.harness/` (ignorata da git, si rigenera) |
| copertura (punti ciechi) | `docs/refactor/copertura.md` |
| mutazioni di prova | `docs/refactor/mutazioni.md` |
| prestazioni | `docs/refactor/prestazioni.md`, `scripts/harness/perf-base.json` |
| registro membro per membro | `docs/refactor/ledger.md` |
| bug trovati per strada (da non sistemare nei commit di refactor) | `docs/refactor/bug-trovati.md` |
| riferimenti rigenerati e perché | `docs/refactor/riferimenti.md` |

## preparare la macchina (sessione nuova)

```bash
cd gecowave-game
git worktree list                          # deve esserci ../gecowave-main su a16f39c
# se manca:
git worktree add ../gecowave-main a16f39c && ln -s ../gecowave-game/node_modules ../gecowave-main/node_modules
scripts/harness/build.sh ../gecowave-main  # build di riferimento
scripts/harness/build.sh                   # build corrente
node scripts/harness/corpus.mjs ref        # solo se .harness/traces/ref manca: rigenera le tracce di main (gli hash devono tornare uguali a reference.json)
```

---

## diario

### 2026-10-07 — parte A: gli strumenti

**Branch e riferimento.** `refactor` da `main` a16f39c. Il tag `v2-pre-refactor` del piano non esiste ancora (è di Ema). Worktree di main in `../gecowave-main`.

**Sonda e tracce** (`probe.js`, `runner.mjs`). La sonda si inietta prima del gioco e trova le cose per forma (il geco è l'oggetto con `attackHitbox` e `cooldowns()`, le entità sono gli oggetti di classi es6), mai per campo privato della scena: così resta valida quando la logica esce da `GameScene`. Sezioni strette (devono coincidere al bit): meta, geco, boss, entità, display list come multiinsieme, ordine di disegno a parità di profondità, corpi, luci, camera, stato di run, salvataggio, dom della ui, musica e acustica, eventi del bus e di scena, suoni, localStorage, console. Diagnostica a parte: tween, timer, collider, ascoltatori di bus, scena e scale (avvisa prima, non è comportamento). Ogni evento e suono porta la riga del bundle che l'ha emesso: il diff la riporta al `.ts` con la sourcemap.

**Build per l'harness** (`build.sh`): `NODE_ENV=development`, `--sourcemap`, `--minify false`. Niente minify per avere nomi delle classi e stack leggibili; il codice del gioco non dipende dai nomi (verificato con grep).

**Diff** (`tracediff.mjs`): primo fotogramma diverso, sezioni, campo per campo prima/dopo, righe `.ts` di chi ha emesso cosa, eventi poco prima. Per display list, entità, corpi e luci la traccia tiene solo l'hash: `corpus.mjs check` rilancia da solo le due build con le impronte complete attorno alla divergenza. Provato con una luce cambiata a mano: trovata al fotogramma 1 con le 8 luci diverse.

**Bot e scenari.** Il bot (`bot.mjs`) segue le tappe del geco simulato (`data/waypoints.json`, generato in 4 minuti), si teletrasporta tra le tappe ma parla, raccoglie e combatte coi tasti veri, legge la ui (dialoghi, scelte per titolo, carte, riepiloghi, film). La campagna intera arriva al finale "consegna" in circa 96 mila fotogrammi. Al passaggio scrive il salvataggio d'ingresso di ogni capitolo (`SAVE_CHAPTERS=1`), che gli altri scenari usano per partire a metà gioco con un salvataggio vero (solo campi del formato di salvataggio). I nastri (`scripts/world/tapes.ts`) sono sequenze di tasti trovate dal geco simulato dallo spawn alla stanza più avanti nel percorso: il geco vero li segue per centinaia di fotogrammi, poi si stacca quando lo colpisce un nemico che il simulato non conosce (va bene: conta che si muova coi tasti).

**Non determinismi trovati e chiusi** (tutti dell'harness, nessuno del gioco):
- il ritmo 17/17/16 ms passato al loop faceva oscillare la media mobile del delta di phaser: la fisica arcade saltava un passo ogni tre fotogrammi e ne faceva due dopo. Ora il loop riceve 16,67 ms costanti (un passo doppio ogni ~80 s, come un monitor vero), l'orologio dei timer resta a millisecondi interi;
- `clock.install` + `pauseAt` sotto carico falliva ("fast-forward to the past"); ora l'install è 5 s prima e dopo il caricamento tick e data si fissano a valori esatti, perché il `requestAnimationFrame` finto cade a `16 - tick % 16` (la musica che rallenta alla morte usa rAF e differiva di un fotogramma tra due giri);
- animazioni e transizioni css vanno in tempo reale: il telefono calcola l'origine dell'app dall'icona a metà animazione. Nell'harness arrivano subito alla fine (le animazioni web via `animate()` invece le guida l'orologio finto: servono ai riepiloghi);
- le immagini `data:` nella ui sono foto del canvas (pixel della gpu): si confronta che ci siano, non il contenuto.

**Velocità.** Da ~200 ms a ~8 ms per fotogramma: in pagina un solo viaggio cdp per centinaia di fotogrammi; la sonda non serializza mai grafi interi (un payload con una scena pesava 250 MB); l'orologio di playwright cedeva con un `setTimeout(0)` vero da 4 ms dopo ogni timer (sostituito da un `MessageChannel`); il disegno webgl si fa un fotogramma su quattro (il processo gpu di chromium era il collo di bottiglia, e il disegno non entra mai nella logica: `camera.preRender` resta a ogni fotogramma, e gli hash sono rimasti identici togliendolo); impronte numeriche dei campi invece di hash carattere per carattere. In parallelo conviene stare a 3-4 job: oltre si finisce sui core di efficienza.

**Bug annotati** in `docs/refactor/bug-trovati.md`.

### 2026-10-07 (pomeriggio) — copertura e scenari per i punti ciechi

**Prima raccolta completa** (130 scenari, 75 minuti a 4 job): righe di `src/` 94%, funzioni 93,7%; dai rami enumerati con l'ast, `GameScene.ts` 1270/1618 bracci e 510/559 funzioni, `entities/` e `engine/` quasi tutti sopra il 90%. Il report è `docs/refactor/copertura.md`.

**Problemi del bot visti nella raccolta e sistemati:**
- nel caso il bot entrava nell'arena del limite con due indizi su tre: boss invulnerabile, arena chiusa, morte, e mai più ritorno all'indizio mancante (70 mila fotogrammi). Ora, se un boss resta invulnerabile, il bot ripassa da tutte le tappe di trama prima di riprovarlo, come farebbe un giocatore;
- nei capitoli segreti e contro gli dei il bot moriva all'infinito (fino a 268 mila fotogrammi). Ora dopo due morti contro lo stesso boss si arrende (e dopo due rese non combatte più in quel capitolo), e gli scenari che devono vincere (`finale-dei`, `cap-walter`, `cap-custode`, `cap-barrato`) partono con forza e cuori alti: sono campi del salvataggio.

**Scenari nuovi** per i rami mancanti: `npc.mjs` (ogni npc negli stati che la campagna non incontra: spaccino a dose presa o dopo il flauto, acqua bevuta due volte, walter prima e dopo, piema senza dispositivo, la piazza in tre momenti...), `combat.mjs` (rimando perfetto e normale contro i tiratori, schianto dall'alto, tutte le wave addosso ai boss, l'ombra che legge ogni abitudine in premium e beta, uscite chiuse dalla trama, boss senza farsi toccare, doomsday senza boss e col sollievo, agguato col geco che ha preso lo sparacchino), `saves.mjs` (salvataggio vecchio in localStorage prima del boot con ogni migrazione di `state.ts`, salvataggio con microfono acceso e comandi rimappati, salvataggio corrotto, finestra ridimensionata), `extra.mjs` (sigilli delle wave, nidi, armadi della tana, freccia guida, gamepad finto). Il runner ora accetta `storage` (localStorage prima del boot) e `viewport` per scenario.

**Giro rapido** (`tiers.mjs`): dalla copertura per scenario, una copertura di insiemi greedy sceglie il sottoinsieme che esegue il 97% dei punti (rami e funzioni) col minor numero di fotogrammi. `corpus.mjs check --tier rapido` lo fa girare: è il controllo da fare a ogni micro-passo della parte B; il corpus intero prima di ogni commit.

**Contratto implicito della scena** trovato leggendo: `FlashbackManager` usa per duck typing `vignette`, `setPropsVisible` e `findFlatStage`; `Player` usa `cloneAlive`. Annotato in `docs/refactor/mappa-sistemi.md`, insieme all'ordine di `update()` e alla bozza dei 12 sistemi.

### 2026-10-07 (sera) — riferimento, controllo incrociato, ultime fonti di rumore

**Il controllo incrociato** (`ref` su main e `check` sul branch, stesso codice, processi diversi) è la prova di determinismo su tutto il corpus. I primi giri hanno trovato tre fonti di rumore, tutte dell'harness:
- la `MenuScene` del fondale gira già durante il boot, che durava un numero variabile di fotogrammi, e il suo campo `t` sopravvive al riavvio della scena (piccolo bug del gioco, annotato): il menu dopo i titoli di coda partiva da un tempo diverso. Ora durante il caricamento il gioco non avanza (si spinge a mano il loader) e il boot dura sempre un fotogramma;
- il resize della finestra arriva in tempo reale: lo scenario aspetta che la misura sia cambiata prima di avanzare;
- `audio.paused` lo decide la pipeline multimediale: tolto dalla traccia.

**Mutazioni** (prima versione, prima dei fix sopra): 12/14 scoperte. Le due sopravvissute erano istruttive: lo scambio di creazione tra crepa e bagliore del riflesso è **equivalente** (profondità diverse, l'ordine di disegno lo decide la profondità), sostituito da uno scambio vero a parità di profondità (pali delle fermate e nidi); la soglia del suono delle lastre (700 → 500 px) non la vedeva nessuno scenario, perché nessuno faceva crollare una lastra col geco a quella distanza: aggiunto `lastre-*`. Alcune "scoperte" erano dovute al rumore del resize: le mutazioni vanno rifatte dopo che il corpus è pulito.

**Bug nuovi**: i shader dei flashback (`VortexPipeline`, `MemoryPipeline`) non partono mai perché le classi non sono registrate nel `PipelineManager` di Phaser (i film usano sempre le scie di ripiego); `MenuScene.t` che sopravvive al restart. In `bug-trovati.md`, con l'elenco del codice che i dati di oggi non raggiungono (da far decidere a Ema).

**Registro**: `docs/refactor/ledger.md` generato, 184/186 metodi di `GameScene` eseguiti da almeno uno scenario (i due mancanti, `arrivoDei` e `onTanaSniffed`, ora sono coperti da `finale-patto` e `tana-armadio` corretti); ogni membro ha una destinazione proposta presa da `mappa-sistemi.md`.

### 2026-10-07 (notte): chiusura della parte A

**Determinismo dimostrato su tutto il corpus.** Dopo aver tolto `audio.paused` dalla sonda, il giro `ref` sul worktree di main e il `check` sul branch (stesso codice, processi diversi, 198 scenari, circa 45 minuti ciascuno a 4 job) hanno dato **tutti uguali a main**. Commit `ffd04c5`.

**Confronto sugli esiti** (`esiti.mjs`). La parte B ha passi che non possono dare tracce identiche al bit (rng centralizzato, eventi riordinati). Per quelli serve un confronto a livello di trama: livelli, dialoghi, scelte, boss, abilità, trofei, capitoli, flag e oggetti del salvataggio finale, errori in console devono coincidere; i numeri del combattimento (morti, nemici, punteggi, tempi, abitudini lette dall'ombra, inventario) si riportano a parte. Provato su `cap-bus`, `cap-rio` e `wave-rio` rifatti con un altro seed: stessa trama, numeri diversi (punteggio del bus 218 contro 217, nemici del rio 11 contro 16), come deve essere. `corpus.mjs run --seed N` fa girare il corpus con un altro seed per misurare quanto si muovono i numeri per il solo caso.

**Censimento del caso** (`caso.mjs` -> `docs/refactor/caso.md`): 204 estrazioni casuali in 21 file (58 negli effetti dei finali, 25 in `sfx`, 23 in `GameScene`, 22 in `Boss`), con riga e funzione. La colonna logica/cosmetico va riempita leggendo, prima del passo rng della parte B.

**Numeri del prompt verificati sul sorgente**: 109 `catch {}` vuoti (87 nel `FlashbackManager`), nessun `isHost` su main (i 107 sono su `multiplayer-p2p`), 80 rami su `def.id`/`case` in `GameScene`.

**`perf.mjs --vs base`**: confronta direttamente con `perf-base.json`.

**Sonda e bot per forma**: verificato che nessuno scenario legge campi privati della scena. Unica eccezione `waitPlayer` (`game.mjs:165`, `GameScene.player`), segnalata nel prompt B.

**Mutazioni**: 14/14 scoperte. La soglia di fase dei boss passava inosservata perché `mutate.mjs` provava solo i 6 scenari più corti che eseguono la riga (un getter chiamato ovunque gira anche dove non conta); `cap-bus` la vede al fotogramma 3020. Ora i candidati sono metà i più corti e metà quelli che eseguono la riga più volte (`countAt` in `branches.mjs`).

**Prestazioni** (`prestazioni.md`, `perf-base.json`, `perf-base-cpu4.json` con `--cpu 4`): in media leggerissimo, i problemi sono i picchi (ingressi nelle stanze, passaggi di capitolo) e `getImageData` nella cottura delle texture.

**Corpus con un altro seed** (`run --seed 777`, 44 minuti): su 198 scenari, 103 danno esiti identici, 68 la stessa trama con numeri diversi, 27 una trama diversa. Le 27 non sono rumore dello strumento: battute dei passanti estratte a caso, voci del bar della piazza (`Shuffle`), agguati di notino che dipendono da dove si trova il geco, nastri di tasti che prendono un colpo diverso e cambiano strada, e la campagna che a metà affronta riba invece di smela. Quindi per il passo rng: `esiti.mjs .harness/traces/ref .harness/traces/cur --rumore .harness/traces/seed-777`. I 103 scenari stabili al caso devono dare esattamente gli stessi esiti; per gli altri le differenze si giudicano, e vanno spiegate una per una nel resoconto. Il report di partenza è `.harness/report-esiti.txt` (si rigenera).

**Registro**: `ledger.mjs` perdeva le destinazioni scritte a mano rigenerandolo (indici delle celle spostati di uno: la riga comincia con `|`). Sistemato: le 338 destinazioni si conservano.

**Giro rapido**: 80 scenari, 97% dei punti, 19% dei fotogrammi.

### 2026-10-08: decisioni di Ema, pronti per la parte B

Ema ha deciso tutto quello che era aperto (elenco completo in `PIANO_REFACTOR.md`, "Decisioni prese", e in fondo a `PROMPT_REFACTOR_B.md`):
- **autonomia** piena su struttura, organizzazione, test e prestazioni; **una sola PR**;
- **codice morto**: via i nidi scritti a mano nel JSON (quelli delle caverne, messi dall'algoritmo, restano: `bug-trovati.md` era scritto male e l'ho corretto), `LEGACY_ITEMS`, `furgone`, i resti mai usati;
- **bug da sistemare**: collider, "Cannot pause", campi che sopravvivono al restart, coda dei film, shader dei flashback, fase 2 del nucleo;
- **repo da riorganizzare** con test di unità;
- **il gioco uguale a qualsiasi frequenza**.

Tag `v2-pre-refactor` messo su `a16f39c` e pushato. Nel prompt B i blocchi nuovi: B12 (codice morto e repo), B13 (bug), B14 (frequenza), B15 (chiusura).

**`HZ=120`** nell'harness: il fotogramma degli scenari resta 1/60 di secondo e il loop fa più passi corti. A 60 Hz il codice non cambia (controllato: `cap-bus`, `livello-perduta`, `wave-rio` uguali a main). Prova di fumo: a 120 Hz `livello-perduta` cambia esito (un checkpoint che non scatta), che è proprio il problema del blocco B14. Non ho misurato il corpus intero a 120 Hz: è il primo passo di B14.

### 2026-10-08: parte B, B0 (preparazione)

**Macchina controllata.** `corpus.mjs ref --only cap-bus,campagna` sul worktree di main ridà gli hash di `reference.json` (`a9f0d56e…`, `f3ae3d26…`): la macchina e l'harness sono quelli della parte A. Le partite registrate da Ema (`ema-bus`, `ema-rio`) ci sono già.

**Test di unità.** vitest 4.1.11 (la linea stabile: la 5 è uscita da un mese), `npm test`, `vitest.config.ts` a parte così la build di vite non dipende da vitest. Solo logica pura in node, senza phaser né dom: il resto lo prova l'harness. Primo file: `src/engine/OmbraProfile.test.ts` (profilo e lettura dell'ombra, i numeri dell'ADR-039).

**ADR-051** nel `DEV_LOG.md`: forma di un sistema, contesto con `Pick`, scena come regista, facciata tipata, campi che sopravvivono al restart in un posto solo.

**Lettura completa di `GameScene`** prima di toccarla. Cose nuove rispetto alla mappa:
- la facciata del film usa anche `folk` ed `enemies` della scena (non solo `vignette`, `setPropsVisible`, `findFlatStage`): sei membri in tutto con `cloneAlive` del geco;
- 14 campi non si azzerano in `create()` e passano al restart: `spawnerToastShown` (il toast del primo nido esce una volta per sessione), `safeTimer`, `exitLockToastAt`, `parryUntil`, `nextLessonCheck`, `cloneUntil`, `lamettaFloorY`, `nextLametteAt`, `nextPitturaAt`, `pattoDeiAt`, `pattoNextSpawnAt`, `chaseLastSeen`, `chaseStartedAt`, `nextIvanStrikeAt`. Alcuni si riscrivono sempre prima di essere letti, altri no (le lamette del santuario possono partire durante il film d'ingresso con l'orario della vita precedente). Vanno in `RestartCarry` fino al blocco B13;
- `time.now` di phaser è il tempo del loop di gioco, non riparte al restart: un orario rimasto da prima vale ancora per qualche secondo.

### 2026-10-08: parte B, B1-B9 (i sistemi)

**Due buchi dell'harness trovati prima di toccare il gioco**, chiusi in un commit di soli strumenti col riferimento di main rigenerato (`riferimenti.md`):
- phaser passa la scena all'evento `create`, e la sonda ne scriveva nella traccia i campi privati: qualsiasi campo tolto da `GameScene` cambiava la traccia senza cambiare il gioco. Ora una scena negli eventi diventa `{ scene: <chiave> }`;
- le partite registrate da Ema (le uniche col mouse vero, aggiunte alla fine della parte A e mai provate con `self`) non erano deterministiche: quando il menu di pausa compare sotto il cursore fermo, chromium manda un `mouseover` sintetico con un suo timer in tempo reale, e il menu suona `menuMove` a un fotogramma che dipende dal carico. Ora la sonda lascia passare gli eventi di passaggio del mouse solo mentre lo scenario rigioca un movimento del nastro;
- in più `names.mjs`: la sonda scrive i nomi dei costruttori (`Rectangle2`, `Systems2`) e il bundle non minificato rinomina i nomi in conflitto. Un modulo nuovo con un nome già usato cambierebbe le tracce. Ha trovato un errore vero: `piazza.ts` usava `Phaser.Utils` senza importare Phaser (typescript lo accetta per il namespace globale dei tipi, a runtime c'è `window.Phaser`), e il bundler rinominava l'import in `Phaser$1`.

**I sistemi** (tabella in `mappa-sistemi.md`, decisioni nell'ADR-051): mondo, gruppi fisici, peso dei colpi, interattivi, dialoghi, ricompense, nemici, combattimento, abilità, posizione sicura, boss, arena, npc, script dei capitoli, progressione, viaggio, guida, sfide, doomsday. `GameScene` da 5804 a 673 righe: compone, chiama nell'ordine di prima, collega gli eventi, fa da facciata.

**Metodo usato per spostare il codice senza errori di copiatura.** Gli spostamenti sono meccanici e controllati: uno script prende un metodo intero dalla scena, riscrive i riferimenti (`this.world` → `this.ctx.world`...) con una mappa esplicita e si ferma su ogni riferimento che non sa risolvere (anche `this` passato come argomento: la scena data a `new Enemy(this, ...)` diventa `this.scene`). Le sostituzioni nella scena vanno per testo esatto e falliscono se il testo non compare il numero di volte atteso. Due errori miei trovati così, prima di qualsiasi prova: tre ascoltatori di eventi col proprietario sbagliato (il gruppo invece del sistema: avrebbe compilato e rotto il gioco), e quattro commenti jsdoc su più righe rimasti orfani nella scena.

**Ordine di lavoro diverso dal prompt, deciso per le dipendenze**: nemici, combattimento e abilità insieme (le abilità chiamano il combattimento e viceversa: separarli avrebbe chiesto adattatori provvisori), poi boss e arena, poi gli script dei capitoli (prima della progressione, così la progressione nasce già chiamando gli agganci dei capitoli; nel mezzo un adattatore `Flow` sulla scena, sostituito in B8 dalla progressione vera).

**Scelte con un perché:**
- `RestartCarry`: i 14 campi che `create()` non azzerava, spostati tutti insieme e non nei sistemi (che nascono nuovi a ogni restart): la correzione è B13 e diventa una riga;
- il registro degli interattivi tiene gli oggetti dei manager, non copie: i passanti si muovono e l'interattivo li segue;
- gli script dei capitoli si registrano per id: i dati dicono che ogni npc speciale, ogni marker e ogni boss stanno in un solo capitolo (controllato sui json delle regioni), quindi smistare per capitolo è equivalente ai rami di prima. Le guardie su `def.script` dentro gli script ora ridondanti sono sparite (`updateIvan` non controlla più `script === 'bus'`: vive solo nel bus);
- l'obiettivo di un capitolo distingue `null` (nessun obiettivo: la freccia tace) da `undefined` (non è affar mio): prima `return npc('piema-mente')` poteva restituire `null` e fermare la ricerca;
- la facciata del film usa sei membri della scena, non quattro: anche `folk` ed `enemies` (`enemyGroup`). Ora è l'interfaccia `FilmHost`, passata esplicitamente a `flashback.play`.

**Errore di metodo, recuperato.** Ho congelato le build di ogni passo ma non i sorgenti, e l'albero di lavoro conteneva B1-B9 insieme. Le build di sviluppo però hanno la sourcemap col testo dei sorgenti: ricostruiti i sorgenti di ogni passo e verificati al byte (B1 identico al salvataggio fatto a mano). Da qui in avanti ogni passo salva anche i sorgenti.

**Test di unità e strato delle regole** (`src/rules/`, senza phaser): combattimento (gradini del risonante, veleno, fasi dei boss), punteggi (capitolo, partita, classifica), salvataggio (tutte le migrazioni di `state.ts`, compresa quella che lancia a metà e lascia fatte le precedenti), profilo dell'ombra. 30 test. Le migrazioni vivevano nel costruttore di `GameState` mescolate a `localStorage`: ora sono `loadedSave` + `migrateSave` (sul posto, perché un salvataggio corrotto che fa lanciare una migrazione deve restare migrato a metà come prima). Le pelli del geco (dati) escono da `playerSkin.ts`, che importa phaser.

**Il caso** (`caso.md`): colonna tipo riempita leggendo il codice. 139 cosmetiche, 43 di logica, 21 di testo (battute scelte a caso: non cambiano lo stato ma la trama letta, quindi vanno nella sequenza stabile, altrimenti una particella in più cambierebbe una battuta), 1 dato salvato (l'id delle foto). `caso.mjs` ora conserva il tipo per testo della riga, che sopravvive agli spostamenti.

**Le abilità divise per abilità** (`src/game/abilities/`, passo a parte dopo B9). Un modulo per abilità con la logica nella classe principale e la grafica (immagini, particelle, suoni, lampi) in una classe `...Fx` dello stesso file; la facciata `Abilities` in `index.ts` tiene la stessa interfaccia di prima, quindi scena e combattimento non sono cambiati. Regola seguita: ogni chiamata osservabile (oggetto creato, `Math.random`, suono, tween) resta nello stesso punto della sequenza; dove la logica e la grafica erano intrecciate (le bolle delle pozze pescano `Math.random` nel ciclo delle pozze, prima dei danni) la chiamata alla grafica sta esattamente dove stava il codice. Tolti due campi morti: `scudoGfx` (sempre `null`, solo distrutto) e `acquaBottles` (scritto e mai letto). Tre regole pure nuove in `src/rules/abilities.ts` con i test: livello dell'onda, sterzata del rimando perfetto, pozza che cade sul pavimento. 37 test. **Un errore mio, trovato dal corpus**: `RiflessoFx` riceveva le luci nel costruttore, ma le abilità nascono prima delle luci, quindi ogni riflesso lanciato mandava in errore il gioco (`riflesso-senza-flow` fallito nel controllo). Era proprio la regola dell'ADR-051 (i riferimenti del contesto si leggono quando servono) che lo split aveva violato. Corretto nello snapshot del passo e in quelli dopo, build ricostruite, gli scenari delle abilità uguali a main.

### 2026-10-08: parte B, B11 (i cambi d'ordine approvati)

Fatti in quest'ordine: prima i due che devono dare tracce identiche al bit (`catch {}`, `simulates`), poi i due che cambiano le tracce per scelta (eventi, caso), così ognuno dei due ultimi ha un riferimento nuovo suo e la differenza si legge da sola.

**I `catch {}` vuoti** (112 nel codice). Prima di toccarli ho contato quanti scattano davvero: la copertura grezza del corpus su main dice, catch per catch, quante volte gira il blocco. Ne scatta uno solo, il salvataggio corrotto (`carica-corrotto`), cioè quello fatto apposta. Poi ho letto phaser 3.90 per ogni tipo di chiamata protetta: `postFX` esiste anche in canvas e lì le pipeline diventano no-op, camera e luci non lanciano, i suoni si proteggono da soli quando manca l'audio, il finto geco della galleria è uno sprite fisico vero. Quindi:
- 102 protezioni ridondanti tolte (84 in `FlashbackManager`, dove il commento diceva `test` per scene finte che non esistono più), con uno script che toglie il `try` e si ferma se una dichiarazione uscendo dal blocco va in conflitto con un nome vicino (nessun conflitto);
- 4 confini su codice arbitrario (i tre timer dei film, il predicato del riepilogo) restano ma non tacciono più: `softFail` scrive l'errore in console;
- `addKey` con un nome sconosciuto non lanciava affatto: creava un tasto senza codice. Ora un controllo esplicito sul nome; per i nomi veri non cambia niente;
- restano 5 catch su errori che vengono da fuori e non si possono controllare prima: storage (salvataggio, classifica, foto), `getGamepads` (lancia se la pagina non ha il permesso), `createMediaElementSource` (lancia se l'elemento è già collegato). E le promesse di `play()` che il browser rifiuta senza un gesto dell'utente.

**`simulates`**: un campo del contesto, sempre vero in single, interrogato in 13 punti dove si decide lo stato del mondo (ia dei nemici, nidi, danni, spari, avvio e `update` dei boss, doomsday, arena, sfide). I punti vengono dal branch `multiplayer-p2p` (solo letto): sono quelli dove l'ospite in coop si ferma. Progressione e viaggio no: come si muovono due giocatori tra i livelli è una scelta della fase 3.

**Eventi espliciti**: `src/engine/worldEvents.ts`, la mappa tipata degli eventi del mondo sulla scena (`emitWorld`, `onWorld`, `offWorld`). Ha un tipo ognuno dei 23 eventi che già esistevano come stringhe, e chi ascolta è controllato dal compilatore (spariti i cast `as never`). Nuovi: `enemy-spawned`, `nest-spawned`, `boss-spawned`, `damage`, `checkpoint`; inizio e fine dialogo erano già sul bus. Un evento senza dato non passa argomenti, così chi ascolta riceve esattamente quello che riceveva prima. Sta in `engine/` e non in `game/` perché lo emettono anche entità e motore.

**Il caso su due sequenze**: `src/rules/rng.ts` (mulberry32 con le formule di phaser per `between` e `shuffle`, con i test) e `src/engine/rng.ts` con `rng.logic` e `rng.fx`. Le 204 estrazioni censite sono passate alla sequenza del loro tipo con uno script che legge `caso.md` e si ferma su ogni chiamata non censita. Le sequenze ripartono a ogni livello (`GameScene.init`) da semi pescati da `Math.random`: nell'harness il seme dello scenario le determina ancora (anche `seed-777` resta diverso), nel gioco vero non sono mai uguali tra due partite. Morire e riprovare dà sequenze nuove, come prima. `caso.mjs` ora censisce le due sequenze e esce con errore se qualcuno pesca da `Math.random` fuori dal seme; il tipo cosmetico si legge dal codice, i sottotipi della logica (testo, dato salvato) si conservano per testo della riga.

### 2026-10-08: parte B, B12 (codice morto)

- **Nidi scritti a mano**: tolto il tipo `spawner` da `EntitySpec`; il compilatore ha indicato ogni punto (scena, nidi delle caverne, battute delle regioni, generatore, catalogo dell'editor). Nessuna regione ne aveva. I nidi delle caverne restano.
- **Boss furgone**: tolto da `BossKind`, definizione, battute, dialoghi di intro e sconfitta, caso del capitolo, disegno, musica e voce. Nessuna regione lo conteneva. `WAVESUNG.smelaRecensione` resta: lo usa anche la sconfitta di smela.
- **Vecchi consumabili**: il ramo di `spawnItemPickup` era morto (nessuna regione e nessun sigillo li regala), ma la tabella serve ancora alla migrazione dei salvataggi vecchi. È diventata una costante privata di `rules/save.ts`: il formato non cambia e un salvataggio vecchio si converte come prima.
- **Resti**: tolti `LightingManager.torch` (e il suo contatore), `sfx.startPad` con `stopPad` e `padNodes`, `StoryManager.destroy`. **Non tolti** `music.setVolume` e `Boss.delayAttack`: la lista della parte A li dava per mai usati perché il corpus non li esegue, ma il primo lo chiama il cursore del volume e il secondo l'ombra quando alzi lo scudo. Toglierli avrebbe rotto il volume della musica e cambiato l'ombra. Annotato in `bug-trovati.md`.
- **Strumenti di sviluppo**: in `src/dev/hooks.ts` le maniglie `window.__*`, il gancio `__startLevel` del bot e il misuratore audio (prima `acoustics.meter`, nel codice di produzione; ora `__meter`, e non accende mai l'audio da solo). Il build di produzione non contiene più nessuno di questi.

### 2026-10-08: parte B, B12 (riordino della repo)

`src/engine` non c'è più (ADR-053): `core`, `audio`, `input`, `art`, `stage`, `story`, `mechanics`, e `NavGraph` in `world`. 72 file spostati con uno script che riscrive ogni import (relativi e alias `@game` dell'editor) e si ferma su ogni import che non sa risolvere; i nomi rinominati dal bundler restano gli stessi. Corretti tre legami sbagliati che il riordino ha messo in vista: `hashString` e `mulberry32` stavano nel kit dell'inchiostro e trascinavano l'arte dentro il generatore del mondo (ora `rules/hash`; `Rng` usa lo stesso `mulberry32`, provato uguale al bit su 2005 semi), `TOTAL_MASCHERE` il telefono lo prendeva da un sistema di gioco (ora accanto a `TOTAL_FRAGMENTS`), `MindDoors` viveva dentro l'indice delle meccaniche. `scripts/assets/` per icone e sprite (`gen-icons` calcola la radice dal suo percorso: corretto e provato).
