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
- [ ] Tag di riferimento (es. `v2-pre-refactor`) per poter tornare indietro
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
