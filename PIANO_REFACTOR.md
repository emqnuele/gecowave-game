# Piano: merge remaster, refactor GameScene, coop

## Fase 0: messa in sicurezza
- [x] Sul branch `multiplayer-p2p`: modifiche aperte committate
- [x] Pushare `multiplayer-p2p` su origin
- [x] Su `remaster`: pushare gli 8 commit locali

## Fase 1: chiudere remaster
- [x] Revisione del lavoro su `remaster` (vedi ANALISI_REMASTER.md) (232 commit): confrontare con REMASTER.md e DEV_LOG.md cosa era previsto e cosa è stato fatto davvero. e ogni modifica aggiuntiva apportata. decidere se è tutto ok o se è worth it sistemare qualcosa o annotare qualce cosa o rifare qualcosa meglio per migliorare il gioco
- [ ] Playtest completo del single dall'inizio alla fine, segnando bug e cose che non convincono in una lista
- [x] Sistemare i bug bloccanti prima del merge (il resto può andare nel refactor)
- [x] Merge di `remaster` in `main` (PR #2) (fast-forward pulito, 232 commit, nessun conflitto)
- [x] Tag di riferimento `v2-pre-refactor` su `a16f39c` (pushato)
- [x] Sostituire `public/assets/sprites/player_sheet.png` con lo sprite nuovo (stessa risoluzione e layout, niente modifiche al codice). Lo faccio io (Ema) + committarlo. (fare questo prima del tag)

## Fase 2: refactor di GameScene (nuovo branch da main)
Obiettivo: GameScene (7.7k righe) fa solo da orchestratore. Ogni sistema ha la sua `update()` e lo stato separato dal rendering.

### Parte A: gli strumenti empirici (fatta, vedi `docs/refactor/parte-a.md` e `DEV_LOG_REFACTOR.md`)
- [x] Branch `refactor` da `main` a16f39c, worktree di riferimento `../gecowave-main`
- [x] Tracce dello stato osservabile a ogni fotogramma e diff col primo fotogramma diverso (`scripts/harness/`)
- [x] Corpus di scenari: campagna col bot, capitoli e varianti, finali, esplorazione, npc, combattimento, sistemi, salvataggi, nastri di tasti, partite registrate
- [x] Copertura del corpus con i rami enumerati dal sorgente (`docs/refactor/copertura.md`)
- [x] Mutazioni di prova (`docs/refactor/mutazioni.md`)
- [x] Prestazioni in tempo reale di partenza (`docs/refactor/prestazioni.md`)
- [x] Riferimento congelato (`scripts/harness/reference.json`) e determinismo dimostrato su tutto il corpus
- [x] Registro membro per membro di GameScene con le destinazioni proposte (`docs/refactor/ledger.md`)

### Parte B: il refactor (prompt in `PROMPT_REFACTOR_B.md`)
- [~] Mappare i blocchi di GameScene e decidere i sistemi: bozza in `docs/refactor/mappa-sistemi.md`, da confermare spostando codice (bozza originale: Enemy, Boss, Trap/Hazard, Folk/NPC, Dialogue, Flashback, Doomsday, Atmosphere/Audio, Camera/World)
- [ ] Estrarli uno alla volta, un commit per sistema, gioco giocabile dopo ogni commit
- [ ] Logica (decide cosa succede) separata dalla presentazione (disegna e suona)
- [ ] Eventi espliciti per le cose importanti: spawn, danno, morte, inizio/fine dialogo, checkpoint
- [ ] RNG centralizzato e con seed al posto dei ~184 `Math.random` sparsi (almeno quelli di logica; il cosmetico può restare)
- [ ] Un solo flag `simulates` (true in single e sull'host, false sul guest) al posto dei 101 controlli `coop.isHost` sparsi
- [ ] Test vitest sui sistemi estratti
- [ ] Il single deve comportarsi identico a prima

### Decisioni prese da Ema (8 ottobre 2026)
**Autonomia**: struttura del codice, organizzazione della repo, test e prestazioni li decide Claude, senza chiedere, purché tutto sia verificato con gli strumenti della parte A. Si chiede solo quando cambia la storia o come funziona il gioco.
**Consegna**: una sola PR del branch `refactor` verso `main`, con commit ben definiti (uno per passo).
**Codice morto, da togliere** (commit dichiarati, non dentro un commit di refactor):
- il ramo dei nidi scritti a mano nel JSON (`case 'spawner'` in `spawnEntities`); i nidi delle caverne messi dall'algoritmo restano;
- i consumabili vecchi (`LEGACY_ITEMS`);
- il boss `furgone`;
- i resti mai usati (`LightingManager.torch`, `Boss.delayAttack`, `music.setVolume`, `sfx.startPad`, `StoryManager.destroy`).

**Strumenti di sviluppo**: tenere quelli utili (es. `acoustics.meter`), organizzati meglio.
**Da sistemare** (dopo i passi strutturali, in commit dichiarati con riferimento nuovo):
- la fase 2 del nucleo che si raddrizza (oggi non trova muri finti nell'arena);
- gli shader dei flashback mai registrati (anche se i flashback andranno rifatti da capo, più avanti);
- i collider dei boss che si accumulano;
- l'avviso "Cannot pause";
- `MenuScene.t` e i campi che sopravvivono al restart;
- la coda dei film vera al posto del `delayedCall`.

**Il gioco deve andare bene a qualsiasi frequenza** (60, 120, 144 Hz): logica indipendente dagli fps, deterministica, ottime prestazioni. L'harness lo prova con `HZ=120`. Oggi a 120 Hz `livello-perduta` cambia esito: è il dato di partenza.
**Riorganizzazione della repo**: codice pulito, facile da estendere e da mantenere, con test di unità; niente più file sparsi in cartelle a caso.
**Prestazioni**: giudicate a cpu rallentata 4 volte; obiettivo quasi zero fotogrammi oltre i 16,7 ms in `esplora-perduta` e `cap-bus`; spostare lavoro nel caricamento va bene, fino a +300 ms all'avvio del livello.
**Cambi d'ordine voluti** (eventi espliciti, rng con due sequenze logica/cosmetico con seed interno, `simulates`, `catch {}` vuoti): approvati. Nei 27 scenari sensibili al caso la trama può cambiare, purché ogni differenza sia spiegata.
**Punti scoperti** (trofeo intoccabile, ospite 12, lucchetto di galliate...): accettati; chi tocca quel codice scrive prima lo scenario.
**Partita registrata**: Ema registra una breve sessione con `record.mjs` prima del blocco B4.

## Fase 3: riattaccare il coop
- [ ] Ripartire dal refactor e riportare `src/net/` dal branch `multiplayer-p2p` (snapshot buffer, interpolazione, protocollo, test 2 tab sono già buoni)
- [ ] Il guest renderizza e manda input, l'host simula tutto
- [ ] Implementare le regole di design qui sotto
- [ ] Rifare i test e2e a due tab

## Regole di design coop (decise)
**Dialoghi automatici** (boss, trama, flashback)
- Li vedono entrambi, il gioco va in pausa per tutti e due
- Solo l'host manda avanti il testo

**Dialoghi manuali** (parlare con NPC)
- Li vede solo chi li apre, il mondo continua per l'altro
- Chi è in dialogo è invulnerabile e non bersagliabile: i nemici puntano l'altro
- Si può parlare sempre, nessun blocco vicino ai nemici

**Morte**
- Chi muore diventa spettatore e rientra al prossimo checkpoint
- Se muoiono entrambi si riparte insieme dall'ultimo checkpoint

**Single player**: nessun cambio di comportamento, i dialoghi bloccano il gioco come ora.

## Da decidere più avanti
- Cosa succede a un dialogo manuale aperto quando parte un dialogo automatico
- Cosa vede lo spettatore (camera sull'altro? può muoversi?)
- Cosa si condivide tra i due: drop, cure, progressi e salvataggio del guest
- Il guest può attivare i trigger di trama o solo l'host?
