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
