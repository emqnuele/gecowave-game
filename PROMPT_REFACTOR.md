# Prompt per la sessione del refactor di GECOWAVE

Lavori su **GECOWAVE: The Flux of Cosenza**, un metroidvania souls-like in Phaser 3 + TypeScript + Vite. La repo è `/Users/ema/Projects/geco-game/gecowave-game` (remote `github.com/emqnuele/gecowave-game`). Io sono Ema, l'autore. Parlami in italiano.

## Il compito, in una frase

Rifattorizza il gioco, a partire dal god object `GameScene`, migliorando enormemente la qualità del codice e le prestazioni **senza cambiare nemmeno un comportamento**. Il giocatore non deve accorgersi di nulla, a parte il gioco più fluido. Per dimostrarlo, prima costruisci gli strumenti che confrontano empiricamente il gioco nuovo con `main` e ti dicono "qui hai dimenticato qualcosa", "qui è diverso". Poi rifattorizzi, un passo verificato alla volta.

È un lavoro difficile. Il gioco è lungo: 20 regioni, circa 30 boss, scelte di trama, finali, meccaniche per bioma. I comportamenti sono migliaia, sparsi in righe dimenticate dentro file da migliaia di righe. Non ti puoi fidare della memoria né della lettura: ti servono prove. La regola d'oro è **niente passo di refactor senza una prova che dice che è uguale a main**.

## Leggi prima di toccare qualsiasi cosa

Nell'ordine:
1. `gecowave-game/PIANO_REFACTOR.md`: il piano generale. Questa sessione copre la fase 2. Le fasi 0 e 1 sono fatte; la fase 3 (coop) **non è tua**.
2. `gecowave-game/ANALISI_REMASTER.md`: la revisione del codice fatta prima del merge. Contiene punti forti e deboli, i bug già sistemati, i problemi da annotare per il refactor e la proposta del bot.
3. `gecowave-game/scripts/harness/README.md`: il runner deterministico, già funzionante, e le trappole già incontrate. Leggilo tutto.
4. `gecowave-game/DEV_LOG.md`: architettura e 49 ADR. È la mappa dei comportamenti voluti. Ogni ADR descrive regole sottili (cosa congela cosa, chi emette quale evento, quali sistemi sono "additivi"...) che il refactor deve conservare.
5. `gecowave-game/REMASTER.md` e `README.md`, per la visione e la struttura.
6. Poi il codice: `src/scenes/GameScene.ts` (5.8k righe), `src/entities/*`, `src/engine/*`, `src/main.ts`, `src/ui/*`.

## Stato di partenza (7 ottobre 2026)

- `main` = `remaster` mergiato (PR #2), più l'harness committato sopra. Compila: `npm run build`.
- Il branch `multiplayer-p2p` esiste, è un tentativo di coop: **non toccarlo**. Ne riuseremo solo `src/net/` nella fase 3.
- Nella cartella ci sono due cose non tracciate: `.env` (segreti del coop, **mai committarlo**) e `tests/coop-2tab/out` (screenshot vecchi). Ignorale.
- Il piano prevede un tag `v2-pre-refactor` e la sostituzione dello sprite `public/assets/sprites/player_sheet.png`, che faccio io. Controlla con `git tag` se ci sono già. Se lo sprite cambia, cambiano solo i pixel: la base di confronto è sempre il commit di `main` da cui parti.
- Non c'è nessun test automatico, a parte i tre script dell'harness.

## Regole di lavoro (non negoziabili)

- **Branch**: crea `refactor` da `main` e lavora lì. Non committare su `main` e non pushare `main` senza chiedermelo. Pushare il branch `refactor` va bene.
- **Commit**: dopo ogni passo completato e verificato. Messaggio in italiano, minuscolo, al massimo 5-6 parole, linguaggio semplice (`git add .` e `git commit -m "..."`). **Mai co-autori, firme o menzioni di Claude.**
- **Commenti nel codice**: solo il PERCHÉ di una scelta, mai il cosa. Una riga sola, tutta minuscola, in italiano come il resto del codice. Pochi; nel dubbio, niente commento. Niente emoji.
- **Python**: solo con `uv` (`uv run`, `uvx`), mai `pip` o `python3` diretto.
- **Browser**: non usare mai il browser pane né un dev server per verificare. Usa l'harness headless. Per le verifiche di tipo, `npx tsc --noEmit` e `npm run build`. Anche l'editor deve compilare: `cd editor && npx tsc -b --noEmit`, poi `git checkout -- editor/*.tsbuildinfo`, perché sono tracciati e cambiano a ogni typecheck.
- **Non toccare**: lo stile grafico, i testi di trama (la voce è minuscola, demenziale, in italiano), i JSON in `public/regions/` (sono generati e verificati: **non rigenerarli**), il formato del salvataggio. I salvataggi di `main` devono caricarsi identici nel refactor.
- **Bug trovati per strada**: nei commit di refactor **non si sistemano**. Si annotano in `docs/refactor/bug-trovati.md` e si sistemano dopo, in commit separati e dichiarati, aggiornando le tracce di riferimento con una nota che spiega cosa cambia.
- Pensa da ingegnere senior: corretto prima che veloce, chiaro prima che furbo. Se una richiesta ti sembra sbagliata o c'è un rischio, dimmelo.

## Parte A: gli strumenti empirici (prima di qualsiasi refactor)

### A1. Il runner c'è già

`scripts/harness/game.mjs` apre il gioco con orologio finto, `Math.random` con seed, loop di Phaser fatto avanzare a mano e partenza a un frame fisso. È dimostrato deterministico, al bit e tra processi diversi, su perduta, bus, tecnokill, rio, tana e nucleo (`determinism.mjs`). Il README spiega ogni scelta. Se un giorno trovi una divergenza tra due esecuzioni della stessa build, è un buco dell'harness: trovalo e chiudilo prima di andare avanti. Un confronto con rumore non serve a niente.

Gli hook di sviluppo disponibili nella build `NODE_ENV=development` sono `window.__game`, `__bus`, `__state`, `__music`, `__acoustics`, `__sfx` e `__startLevel(levelId, checkpointId?)`.

### A2. Le tracce: cosa registrare

Scrivi `scripts/harness/trace.mjs`. A ogni frame (o ogni N frame, configurabile) deve registrare un'impronta dello stato **osservabile**, cioè indipendente da come è scritto il codice, così resta valida anche quando sposti la logica da GameScene a dei sistemi:
- **geco**: posizione, velocità, `facing`, stato (dash, attacco, stordito, morto, nascosto, mangia...), vita, flow, cooldown;
- **salvataggio e run**: `__state.save` serializzato per intero (flag, oggetti, barre, abilità, esplorazione, trofei, quest...) e `__state.run`;
- **mondo**: livello, stanza, boss (tipo, vita, fase, ingaggiato), nemici svegli (tipo, posizione, vita, modo), proiettili, trappole e pericoli attivi, passanti, meteo e ora del giorno;
- **eventi**: incapsula `__bus.emit` (e gli eventi della scena, `scene.events.emit`) per registrare ogni evento col suo payload ridotto a dati;
- **UI DOM**: testo del dialogo aperto, scelte, toast, banner, HUD, schermate aperte;
- **audio come comportamento**: incapsula `__sfx` (quale suono, quando) e `__music` (traccia, duck, filtri). Suonare la cosa giusta al momento giusto è un comportamento;
- **camera**: scroll, zoom, effetti (shake, fade, flash);
- **display list**: per ogni oggetto nelle scene attive, tipo, chiave della texture, frame, posizione arrotondata, profondità, alpha, visibile, tinta e blend. È ciò che scopre l'effetto grafico dimenticato. Confrontala come multiinsieme, e a parte l'ordine dentro la stessa profondità, perché cambiare l'ordine di creazione cambia cosa si disegna sopra a parità di profondità;
- **opzionale**: screenshot in punti chiave e confronto dei pixel. L'impronta della display list di solito basta ed è più robusta.

Scrivi anche il **diff delle tracce**: trova il primo frame in cui due tracce divergono, dice quale campo, mostra il prima e il dopo, e prova a ricondurlo al sistema responsabile.

### A3. Gli scenari: coprire tutto

Il corpus degli scenari è il cuore del lavoro. Devono esserci:
- **il bot della campagna**, riscritto sopra `game.mjs`: tutti i capitoli in ordine, i capitoli segreti (barrato, custode, galliate, marcetti) e tutti i finali (riscatto, consegna, dei, pedro, sconfitta...), con i rami delle scelte (tommasorveglianza, patto con pedro, pensiero sepolto, notino, acqua...). Il bot vecchio `scripts/playtest/bot.mjs` è un riferimento utile: teletrasporto tra tappe, chiusura di dialoghi e scelte, politica delle scelte per titolo. Ma è indietro sulla UI: riepilogo di capitolo, card dei frammenti, tabellone del citelis. Le tappe si generano con `scripts/world/run.sh waypoints all <out.json>` (circa 15 minuti, deterministico). Salva le tappe nella repo così non le ricalcoli;
- **scenari mirati**, ognuno piccolo e veloce: ogni boss con le sue fasi e battute, ogni flashback (il "salta" e la fine naturale), ogni abilità (scivolata, rimbalzo, aggrappo, riflesso con scambio, risonante a tre livelli, analisi, scudo con rimando perfetto, bottiglia), il cibo e il canale di 700 ms, la morte con le barre lasciate e recuperate, i checkpoint, i viaggi col citelis, il telefono e le sue app, la bottega, le missioni, le corse contro il citelis, le arene del microfono rosso, i sigilli, trappole e pericoli per bioma, le meccaniche di bioma (porte del bus, correnti, nastri, telecamere, cecchino, porte-quiz, la tana con nascondigli e inseguimento), il doomsday, l'ombra che impara, i tratti dei nemici (scudo, soffitto, kamikaze), le élite, il nucleo che si raddrizza, i riepiloghi di capitolo e di fine gioco, il salvataggio e il caricamento;
- **input veri, non solo teletrasporti**: il geco deve muoversi con i tasti, perché tutta la fisica del controllo è comportamento. `src/world/sim.ts` e `src/world/simreach.ts` replicano il controllo del geco e sanno quali "macro" (salti, scivolate, arrampicate) portano da un punto all'altro. Puoi usarli per generare nastri di tasti che attraversano davvero le stanze;
- **nastri registrati da me, più avanti**: un registratore solo in sviluppo che salva i tasti col numero del frame mentre gioco, da rigiocare nell'harness su entrambe le build. Non serve che la ripetizione coincida con la mia partita originale: serve che `main` e refactor diano la stessa cosa con lo stesso nastro.

Per partire a metà gioco senza rigiocare tutto, prepara il salvataggio (`__state.save`: abilità, flag, livello, checkpoint) prima di `__startLevel`. Usa solo campi del formato di salvataggio, che non deve cambiare: così la stessa preparazione vale su entrambi i branch.

### A4. La copertura: sapere cosa non hai controllato

Una traccia uguale non dimostra niente sul codice che nessuno scenario ha eseguito. Quindi:
- costruisci `main` con le sourcemap e fai girare il corpus con la copertura JS di Chromium (`page.coverage.startJSCoverage` in playwright-core). Rimappa sui file `.ts` e produci un report per file, funzione e ramo;
- obiettivo: **ogni ramo raggiungibile di `GameScene.ts`, `entities/` e `engine/` eseguito da almeno uno scenario.** Elenca i rami mai eseguiti e scrivi scenari finché quello che resta è codice davvero morto o irraggiungibile. Segnalami il codice morto, non toglierlo di tua iniziativa;
- tieni il report nella repo e aggiornalo: è la mappa dei punti ciechi.

### A5. Mettere alla prova gli strumenti

Prima di fidarti, dimostra che gli strumenti si accorgono delle regressioni. Su un branch di prova, togli una riga di comportamento a caso da `GameScene` (un `sfx`, un `setFlag`, un `bus.emit`, un tween, un confronto `<` che diventa `<=`) e verifica che almeno uno scenario fallisca indicando il punto giusto. Fallo una decina di volte, su file diversi. Se una mutazione passa inosservata, manca uno scenario o un campo nella traccia.

### A6. Prestazioni

Le prestazioni si misurano **a parte**, senza orologio finto: le misure di tempo sotto l'orologio finto non sono reali. Usa gli stessi scenari in tempo reale e prendi il tempo di script e di render per frame dalle metriche CDP (`Performance.getMetrics`, oppure il tracing di Chrome). Fai un riferimento su `main` e confrontaci ogni passo. Annota anche dove si spende oggi: il DEV_LOG (ADR-032) cita il terreno disegnato a pezzi entrando nelle stanze.

### A7. Il riferimento

Congela il riferimento: aggiungi un worktree di `main` al commit di partenza (`git worktree add ../gecowave-main <commit>`), costruisci lì `dist-dev`, genera le tracce di tutti gli scenari e salva gli hash nella repo, mentre le tracce complete vanno in una cartella ignorata da git. Ogni passo del refactor si confronta con questo riferimento.

**Criterio per finire la parte A**: il corpus copre quasi tutto il codice raggiungibile, tutte le mutazioni di prova vengono scoperte, e due esecuzioni della stessa build danno sempre tracce identiche. Fammi un resoconto e aspetta il mio ok prima della parte B.

## Parte B: il refactor

### Obiettivo architetturale (dal piano)

`GameScene` diventa solo un orchestratore. Ogni sistema ha la sua `update()`, lo stato separato dal rendering e il proprio `destroy()`. Una bozza di sistemi, da confermare dopo aver mappato il codice: abilità (clone, analisi, scudo, bottiglia, avvelenamento), nemici e nidi, boss (vita, voce, ombra, arene), trappole e pericoli (già fuori), passanti e npc, dialoghi con la loro coda, cutscene e flashback, script dei capitoli (lametta, smela, ivan, void, baruffoni, patto, tana, doomsday, nucleo: uno per capitolo invece dei 40 rami `def.id === '…'`), ricompense e pickup, progressione dei capitoli (uscite, riepiloghi, trofei, punteggio), atmosfera e audio, camera e mondo. La logica (cosa succede) va separata dalla presentazione (cosa si disegna e si suona). Le cose importanti diventano eventi espliciti: spawn, danno, morte, inizio e fine dialogo, checkpoint.

### Metodo

1. **Mappa prima, sposta dopo.** Crea `docs/refactor/ledger.md`: per ogni metodo e campo di `GameScene` su `main` (con le righe), indica dove finisce nel codice nuovo, quale scenario lo copre e lo stato (da fare, portato, verificato). Fai lo stesso per gli altri file che tocchi. Generalo all'inizio con uno script (l'AST di TypeScript basta) così non salti niente. È il tuo "confronta ogni riga con main": una riga senza destinazione e senza verifica non è portata.
2. **Un sistema per commit, gioco funzionante dopo ogni commit.** Dopo ogni passo: `tsc`, build, l'intero corpus confrontato col riferimento, e il ledger aggiornato.
3. **I passi strutturali devono dare tracce identiche al bit.** Spostare codice senza cambiare l'ordine delle chiamate (comprese le chiamate a `Math.random`, i `delayedCall` e la creazione degli oggetti) mantiene le tracce identiche. Se una traccia diverge, il passo non è finito: trova la causa. "È equivalente" non basta.
4. **I cambi che cambiano l'ordine di proposito vengono dopo, uno alla volta, con un riferimento nuovo dichiarato**: RNG centralizzato con seed al posto dei circa 200 `Math.random` (almeno quelli di logica), eventi espliciti dove cambiano l'ordine, e il flag unico `simulates` pensato per il coop. Per questi passi l'uguaglianza al bit non è possibile: prima dimostri l'equivalenza sugli esiti degli scenari (stessi flag, stessi finali, stessi dialoghi, stesse morti e ricompense, stesse statistiche di danno), poi rigeneri il riferimento con una nota in `docs/refactor/riferimenti.md`.
5. **Test di unità** (vitest, `npm i -D vitest`) sulla logica pura che estrai: danni, fasi dei boss, cervello dell'ombra, punteggi, migrazioni del salvataggio.
6. **Dopo ogni sistema estratto** rifai la prova delle mutazioni sul codice nuovo: la rete deve restare fitta.

### Trappole note del codice

- `GameScene.create()` azzera a mano circa 180 campi, perché Phaser **riusa la stessa istanza di scena** a ogni restart. Un sistema estratto deve nascere e morire con la scena: mai stato che sopravvive al restart per sbaglio.
- Ci sono singleton globali con stato mutabile: `state` (anche `godMode`), `flashback`, `music`, `acoustics`, `sfx`, `bus`. I bug trovati in revisione nascevano proprio da stato globale non ripristinato. I listener sul DOM e su `window` vanno sempre tolti.
- I flashback oggi non mettono in pausa la simulazione: congelano solo alcuni sistemi e rendono il geco invisibile e invincibile. Nel refactor diventano un sistema di cutscene vero, ma **identico nell'aspetto e nei tempi**. Il ridisegno è una decisione mia, per dopo.
- Ci sono 123 `catch {}` vuoti (90 nel `FlashbackManager`). Quando li sostituisci con controlli espliciti, il comportamento nei casi normali deve restare uguale. Le tracce te lo dicono.
- La logica gira a ogni frame di render (non c'è un limite agli fps), mentre la fisica arcade ha passo fisso a 60. Non cambiare questo rapporto nel refactor: annotalo come proposta.
- `setupBossColliders` accumula collider dei boss distrutti, e altre cose simili sono elencate in `ANALISI_REMASTER.md`. Sono bug da annotare, non da sistemare dentro un commit di refactor.

## Come mi tieni aggiornato

- Lavora in autonomia per lunghi tratti. Fermati e chiedimi solo per le decisioni che sono mie: prodotto, design, cosa considerare codice morto, rigenerazione del riferimento.
- A ogni traguardo (fine parte A, ogni gruppo di sistemi estratti) scrivi un resoconto breve: cosa è fatto, cosa dice la copertura, cosa diverge e perché, bug annotati, numeri delle prestazioni.
- Tieni aggiornati `DEV_LOG.md` (nuovi ADR per le scelte architetturali, nello stesso stile) e `PIANO_REFACTOR.md` (spunta le voci).
