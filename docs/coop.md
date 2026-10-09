# coop

> roadmap: il multiplayer non è nel gioco attuale, solo nel branch `multiplayer-p2p`.

Il multiplayer vive sul branch `multiplayer-p2p` (src/net/: snapshot buffer, interpolazione, protocollo, test a due tab). Va riportato sopra la struttura nuova: l'host simula tutto (`GameContext.simulates`, ADR-052), il guest disegna e manda input.

## cosa manca
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
