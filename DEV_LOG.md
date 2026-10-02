# DEV LOG — GECOWAVE remaster

Registro tecnico del remaster: architettura, decisioni, vincoli e stato. Si aggiorna a ogni blocco di lavoro. Per la visione di prodotto vedi `REMASTER.md`, per il passaggio di consegne tra sessioni `HANDOFF.md`.

Branch di lavoro: `remaster-l6rk4r`. Commit in stile convenzionale (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`), messaggi brevi in italiano.

---

## 1. Architettura in breve

| strato | dove | ruolo |
|---|---|---|
| contenuti | `src/content/` | capitoli vecchi (sorgente della trama), storia, biomi, oggetti, missioni, passanti, trofei |
| generazione offline | `src/world/` + `scripts/world/` | dai capitoli lineari alle regioni a stanze, verifica e riparazione col simulatore, cancelli d'abilità. Non entra nel bundle |
| dati generati | `public/regions/<id>.json` | griglia RLE, legenda, layout (stanze, varchi, `spots` verificati) |
| motore | `src/engine/` | rendering a inchiostro, luci, navigazione, passanti, atmosfera, missioni, guida, stato |
| entità | `src/entities/` | Player, Enemy (stati + navigazione), Boss, Companion |
| scena | `src/scenes/GameScene.ts` | orchestrazione: spawn, script dei capitoli, arene, trofei, viaggio |
| UI | `src/ui/` | DOM: HUD, dialoghi, schermate, telefono |
| test | `scripts/playtest/bot.mjs` | bot headless che gioca la campagna nel gioco vero |

### Pipeline delle regioni (`npm run regions`)
1. `generateRegion` (modello di salti astratto) costruisce stanze, varchi, scheletro percorribile, trama.
2. `simRepair` con le abilità del capitolo: il geco simulato a fisica vera trova trappole e le ripara (scalinate o riempimento), sposta i bottini irraggiungibili.
3. Capitoli fino a rio: riparazione anche per i set d'abilità futuri (doppio salto, aggrappo), poi di nuovo il set del capitolo.
4. `addGates`: cancelli d'abilità (mensola per il doppio salto, camino per aggrappo) verificati due volte.
5. `layout.spots`: fino a 4 posizioni verificate per stanza, usate da missioni e oggetti.
6. Fallisce se: uscita irraggiungibile, trappole, trama/boss non raggiungibili nella loro stanza.

---

## 2. Decisioni (ADR)

### ADR-001 — simulatore fisico al posto del modello astratto come giudice finale
**Contesto**: le regioni passavano il modello di salti del generatore ma il gioco vero aveva punti irraggiungibili e trappole.
**Decisione**: `src/world/sim.ts` replica arcade di Phaser (integrazione, `SeparateTile` con facce e `tileBias` 48, ordine degli assi) e il controllo di `Player`. Calibrato nel gioco vero: salto 221 px / apice 114 px, arrampicata con aggrappo identica al pixel.
**Conseguenze**: verifica affidabile ma costosa (15–90 s a regione). Il generatore astratto resta per costruire, il simulatore giudica e ripara.

### ADR-002 — raggiungibilità a macro con partenze multiple
**Decisione**: stati = (colonna del centro, riga del pavimento); da ogni stato si provano camminate, cadute, un ventaglio di salti (rincorsa 0/5/10, tenuta, sterzate), doppio salto, scivolata, arrampicate. Ogni cella riparte dal punto d'atterraggio e dal centro.
**Trade-off**: un solo punto di partenza perdeva strade reali per pochi pixel; più partenze costano tempo. Centro + atterraggio è il compromesso.
**Nota**: i salti normali si simulano senza aggrapparsi (il giocatore che vuole il doppio salto vicino a un muro molla la direzione); solo i macro d'arrampicata usano la presa.

### ADR-003 — navigazione a segmenti con archi balistici
**Decisione**: `NavGraph` costruisce segmenti di pavimento e archi (caduta, salto) verificati contro la roccia; gli agenti decollano con la velocità calcolata invece di "premere tasti". A* sui segmenti; per i volanti A* su blocchi 2×2.
**Perché**: semplice, economico a runtime, robusto per corpi diversi. Gli archi si calcolano pigramente per segmento.

### ADR-004 — boss attivati per stanza, arene chiuse
**Decisione**: nelle regioni un boss si sveglia quando entri nella sua stanza; durante lo scontro i varchi della stanza diventano sbarre statiche (`lockArena`). Il controllo offline considera un boss raggiungibile solo se si raggiunge la sua stanza.

### ADR-005 — ricompense che non si perdono
**Decisione**: frammenti, cuori e amuleti lasciati dai boss si posano su un pavimento vicino (`rewardSpot`) e poi volano verso il giocatore (`homeIn`).

### ADR-006 — modalità assistita
**Decisione**: la freccia guida è spenta di default; accesa blocca i trofei e segna i record come assistiti (`SaveData.assisted`). Niente testi in sovrimpressione accanto al geco.

### ADR-008 — hub costruito a mano, fuori dalla pipeline delle regioni
**Contesto**: serviva un posto sicuro e vivo dove tornare (negozio, voci, riepiloghi), raggiungibile da tutto il mondo.
**Decisione**: `LevelDef.hub` marca un livello disegnato da codice (`level00-piazza.ts`), senza regione generata. `REGION_IDS` esclude gli hub da `npm run regions`, dal BootScene e dagli script del mondo. La fermata `HUB_STOP` entra nel tabellone del citelis dopo guggu. La raggiungibilità si verifica con `scripts/world/run.sh hubcheck piazza` (stampa le celle raggiunte dal geco simulato).
**Vincolo trovato**: una mensola a una riga dal marciapiede è un muro (il corpo è alto 55 px, serve una luce di almeno 2 righe sotto): i primi gradini vanno pieni fino a terra.

### ADR-009 — trappole a runtime, mai solide
**Decisione**: `TrapManager` piazza seghe (corrono sul pavimento), presse (cadono dal soffitto) e getti di vapore sui segmenti del grafo di navigazione, in modo deterministico per regione e con densità per bioma. Niente nelle stanze tranquille (inizio, riposo, arena, uscita, segrete) né vicino a varchi, microfoni, fermate e npc.
**Perché a runtime**: non toccano la griglia, quindi la verifica del simulatore resta valida e non serve rigenerare. Non essendo solide non possono chiudere una strada: costano vita, non bloccano. Ogni trappola ha sempre una finestra (sega saltabile con 3 righe d'aria sopra, pressa con ciclo e tremito d'avviso, vapore con sbuffi d'avviso).
**Vincolo**: si attivano per distanza dal geco, non per inquadratura (nel bot il `worldView` della camera non si aggiorna senza render).

### ADR-007 — contenuti procedurali su posizioni verificate
**Decisione**: missioni, oggetti da cercare e destinatari si piazzano solo su `layout.spots`. I passanti usano i segmenti del grafo ma restano nella loro stanza.

---

## 3. Vincoli e note tecniche
- **Tween di Phaser in tempo reale**: nel bot (loop avanzato a mano) scenette e tween sono più lenti dei fotogrammi simulati. Non è un bug del gioco.
- **`pkill -f` nei comandi**: il pattern può colpire la shell stessa; usare `pgrep` e poi `kill` col pid.
- **Server per il bot**: usare una copia del progetto (porta 5174, niente HMR) o il bot si ricarica a ogni modifica.
- **`GameScene.create` resetta a mano i campi**: ogni campo nuovo va azzerato lì.
- **Rigenerazione regioni**: deterministica; dopo modifiche a generatore o simulatore rigenerare tutto e rifare le tappe del bot (`scripts/world/waypoints.ts`).
- **Tempi**: `npm run regions` con cancelli e verifiche multiple richiede decine di minuti (parallelo su tutti i core).
- **Dev hooks**: `window.__game`, `__bus`, `__state`, `__music` solo in sviluppo. Importare un modulo da `page.evaluate` crea un'istanza diversa: usare gli hook.
- **Editor** (`editor/`): usa i tipi del gioco, va tenuto compilabile (`cd editor && npx tsc -b --noEmit`).

---

## 4. Stato

### Completato
- Fase 1 (motore a inchiostro), Fase 2 (telefono, zaino, amuleti), Fase 4b (trofei, punteggi, modalità assistita).
- Fase 3: regioni a stanze 10× il gioco vecchio, verificate; mappa che si rivela; fermate del citelis e viaggio rapido; passanti; nemici con stati e inseguimento; meteo e giorno/notte; arene.
- Fase 4: aggrappo (wave nuova, dalla formicona), élite, missioni dei passanti con amuleti nuovi, cancelli d'abilità nei primi capitoli.
- Fase 5: finale vero "riscatto" (giorno 30, il glitch, romero arresta gli dei).
- Bot: campagna completa fino al finale e capitoli segreti.
- Trappole meccaniche per bioma (seghe, presse, vapore).
- Musica per ora del giorno: passa-basso WebAudio condiviso (`music.setNight`), da 20 kHz a 1,6 kHz su scala logaritmica; spento durante i boss. Se WebAudio fallisce la musica suona senza filtro.
- Hub della piazza: bottega (ricarica, pacco a sorpresa), bacheca delle commissioni, oracolo delle mappe (percentuali di esplorazione), bar con voci calcolate su quello che manca, folla dedicata (18+ passanti), due lore sui tetti.

### In corso
- Rigenerazione completa delle regioni con simulatore corretto (bug del blocco del salto dal muro non azzerato) e controllo dei boss per stanza.

### Da fare
- Piattaforme che crollano, allagamenti.
- Sfide a tempo e arene opzionali.
- Trame secondarie per personaggio, più scelte a metà gioco.

---

## 5. Cronologia
- **fix totale**: simulatore, bot, ricompense, boss per stanza, arene, lochef, guide.
- **mondo vivo**: navigazione, nemici a stati, passanti, meteo, giorno/notte, élite.
- **orientamento**: mappa che si rivela, fermate e viaggio rapido, freccia assistita.
- **gameplay**: aggrappo, missioni, cancelli d'abilità, trofei e punteggi.
- **trama**: finale vero, coerenza di prezzi ed epiloghi.
- **hub**: la piazza col citelis, npc di servizio, folla.
- **trappole**: seghe, presse, vapore per bioma.
- **audio**: musica ovattata di notte.
- **simulatore**: partenze multiple, salti senza presa, azzeramento del blocco del salto dal muro, controllo boss per stanza.
