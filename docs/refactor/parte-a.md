# parte A: resoconto

Branch `refactor`, riferimento `main` a16f39c. Nessuna riga del gioco è cambiata (`git diff a16f39c -- src` è vuoto): la parte A ha costruito solo strumenti, scenari e documenti. Il diario dettagliato è `DEV_LOG_REFACTOR.md`; i comandi e le trappole sono in `scripts/harness/README.md`.

## in breve

| | |
|---|---|
| scenari | __SCENARI__ (__FRAMES__ fotogrammi, circa __MIN__ minuti a 4 job) |
| giro rapido | __RAPIDO_N__ scenari, __RAPIDO_PCT__ dei punti coperti, circa __RAPIDO_MIN__ minuti |
| copertura `GameScene`/`entities`/`engine` | __RAMI__ dei bracci di ramo, __FUNZ__ delle funzioni (enumerati dall'ast) |
| copertura di `GameScene` | __GS_RAMI__ bracci, __GS_FUNZ__ funzioni |
| copertura di tutto `src` (righe) | __RIGHE__ |
| mutazioni di prova | __MUT__ scoperte, col punto giusto |
| determinismo | __DET__ |

## cosa c'è

**Runner deterministico** (`game.mjs`). Chromium headless, build servita da disco, orologio finto, caso con seed, loop di Phaser fatto avanzare a mano dentro la pagina. Rispetto alla versione di partenza ho chiuso sette fonti di rumore, tutte dell'harness e nessuna del gioco:
- la media mobile del delta faceva saltare un passo di fisica ogni tre fotogrammi: ora il loop riceve 16,67 ms costanti;
- l'installazione dell'orologio poteva fallire sotto carico;
- la fase del `requestAnimationFrame` finto dipendeva da frazioni di millisecondo reali;
- animazioni e transizioni css in tempo reale lette dal layout;
- foto del canvas (pixel della gpu) nella ui;
- il boot di lunghezza variabile, che il menu del fondale si porta dietro;
- il resize della finestra.

È anche 25 volte più veloce: da ~200 a ~8 ms per fotogramma.

**Sonda e tracce** (`probe.js`, `runner.mjs`). A ogni fotogramma un'impronta di tutto lo stato osservabile, trovato per forma (mai per campo privato della scena), con la riga `.ts` di ogni evento e suono.

**Diff** (`tracediff.mjs`). Primo fotogramma diverso, sezione, campo, prima e dopo, chi l'ha emesso; per la grafica rilancia da solo le due build con le impronte complete.

**Corpus** (`scenarios/`):
- campagna intera col bot fino al finale;
- ogni capitolo dal salvataggio con cui la campagna ci entra, con le varianti delle scelte e i capitoli segreti;
- tutti i finali (consegna, dei, sconfitta, pedro, riscatto e varianti);
- l'esplorazione di ogni punto verificato di ogni regione;
- gli npc in ogni stato della trama;
- il combattimento nei dettagli (rimando perfetto, schianto, wave sui boss, l'ombra che legge, uscite chiuse dalla trama);
- i sistemi (morte e barre, cibo, telefono, pausa, menu, piazza, arene, corse, doomsday, film, sigilli, nidi, armadi, lastre, freccia guida, gamepad);
- i salvataggi caricati da disco con tutte le migrazioni;
- i nastri di tasti generati dal geco simulato;
- le partite registrate da Ema (`record.mjs`).

**Copertura** (`coverage.mjs`, `branches.mjs`). V8 mappata sui `.ts` con la sourcemap. I rami e le funzioni si enumerano dall'ast di typescript, così il denominatore non dipende da cosa v8 ha visto.

**Mutazioni** (`mutate.mjs`). Ogni mutazione si applica in un worktree a parte (`../gecowave-mut`) e si fanno girare solo gli scenari che eseguono quella riga.

**Prestazioni** (`perf.mjs`). Gli stessi scenari in tempo reale, con i tempi di update e render per fotogramma, le metriche cdp e un profilo cpu riportato ai file `.ts`.

**Registro** (`ledger.mjs`). Ogni membro di `GameScene` con righe, scenari che lo eseguono e destinazione proposta (`docs/refactor/ledger.md`).

## cosa dice la copertura

`docs/refactor/copertura.md` ha l'elenco completo. I rami rimasti scoperti in `GameScene` sono di quattro tipi:
1. **difensivi**: `?? valore` di ripiego, `|| 1` contro la divisione per zero, `catch` attorno ai riepiloghi, `if (!lines)` in `startLines`, avvisi solo in sviluppo. Non si raggiungono senza rompere il gioco: è giusto che restino scoperti.
2. **codice che i dati di oggi non raggiungono**: nidi messi a mano (`case 'spawner'`), consumabili vecchi (`LEGACY_ITEMS`), il boss `furgone`, la fase 2 del nucleo senza muri `F` nell'arena. Elenco in `bug-trovati.md`: **la decisione se toglierli è di Ema**.
3. **l'altro lato di una scelta** che la campagna prende sempre allo stesso modo (per esempio romero quando lochef *non* è stato arrestato: dopo la tana lo è sempre). Per lo più sono innocui, ma vanno guardati quando si sposta quel codice.
4. **raggiungibili ma scoperti**, da coprire se il refactor tocca quel punto:
   - il trofeo "intoccabile" (serve battere un boss senza farsi toccare: il bot combatte da vicino);
   - l'interazione col su del gamepad da fermo;
   - l'ospite n.12 in tana (dopo lochef il bot non lo trova);
   - il lucchetto dell'uscita di galliate (si vede solo nei 900 ms tra due boss);
   - gli insight dell'ombra sul riflesso e sulla bottiglia (con il 30% di caso).

## cosa dicono le mutazioni

__MUTAZIONI__

## limiti della rete (da sapere prima di fidarsi)

- **Pixel**: il disegno webgl non si confronta (si disegna un fotogramma su quattro, i pixel non entrano nella traccia). Si confronta la display list, che cattura posizione, profondità, alpha, tinta, frame, testo, comandi delle `Graphics` e particelle vive. Codice che gira solo al disegno (`normalFlip`, pipeline) è coperto solo se lancia errori o cambia stato.
- **Audio**: si confrontano le chiamate (quale suono, quando, con che parametri) e lo stato della musica, non il segnale.
- **Fotogrammi non campionati**: la traccia campiona ogni fotogramma, ma display list, entità, corpi e luci sono solo hash; i dettagli arrivano rilanciando.
- **Tempo reale**: l'harness usa un monitor perfetto a 60 Hz. Comportamenti che dipendono da fps diversi (la logica gira a ogni frame di render) non si vedono: il refactor non deve cambiare quel rapporto.
- **Macchina**: il riferimento va rigenerato sulla stessa macchina del confronto (il sample rate dell'audio cambia la sequenza del caso).
- **Bot**: il bot si teletrasporta tra le tappe; la fisica del controllo la coprono i nastri e gli scenari a tasti. Il bot non è un giocatore umano: le partite registrate da Ema (`record.mjs`) sono il complemento.

## prestazioni di partenza

__PERF__

## bug trovati

In `docs/refactor/bug-trovati.md`. Riassunto:
- i shader dei flashback (vortice e ricordo) non partono mai: le classi non sono registrate in Phaser;
- l'avviso "Cannot pause non-running Scene" a ogni scelta che segue un dialogo;
- `MenuScene.t` sopravvive al riavvio della scena;
- i collider dei boss che si accumulano, la coda dei film fatta di `delayedCall`, la logica legata agli fps (già noti dalla revisione);
- l'elenco del codice che i dati non raggiungono.

## cosa resta per la parte B

Il prompt per la prossima sessione è `PROMPT_REFACTOR_B.md`. La mappa dei sistemi (`mappa-sistemi.md`) e il registro con le destinazioni proposte (`ledger.md`) sono il punto di partenza.
