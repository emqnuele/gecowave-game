# DEV LOG — GECOWAVE remaster

Registro tecnico del remaster: architettura, decisioni, vincoli e stato. Si aggiorna a ogni blocco di lavoro. Per la visione di prodotto vedi `REMASTER.md`, per il passaggio di consegne tra sessioni `HANDOFF.md`.

Branch di lavoro: `remaster` (remote `origin/remaster`). Commit in stile convenzionale (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`), messaggi brevi in italiano.

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

### ADR-010 — lastre che crollano e allagamenti, additivi
**Decisione**: `HazardManager` mette ponti di lastre sopra i pozzi tra due pavimenti alla stessa quota (3–9 celle, mai su un buco verso la stanza di sotto) e allagamenti periodici nelle stanze basse o con la vasca, per bioma.
**Perché non toccano la verifica**: le lastre sono solide solo dall'alto (`checkCollision` solo `up` più un `processCallback` sui piedi): da sotto si passa, da sopra si cade come prima dopo il tremito. Quindi aggiungono strade e non ne tolgono. L'acqua non è solida: rallenta (corsa ×0.6, caduta ≤ 300) e dove è tossica toglie un cuore ogni 1.6 s con la testa sotto, ma si ritira sempre (ciclo 70–110 s, doppio col temporale) e non supera mai la soglia dei varchi laterali.
**Vincolo trovato**: `setMaxVelocityY` di arcade limita anche la salita: in acqua il salto spariva e le conche tossiche diventavano trappole mortali. La caduta si limita a mano, il salto resta pieno.

### ADR-011 — il simulatore sceglie il tentativo del generatore
**Decisione**: `build-regions` prova il tentativo successivo di `generateRegion` (fino a 6 volte) quando il simulatore boccia la regione. Le regioni che passano al tentativo 0 restano identiche, quindi non serve rigenerare tutto. Così si è sbloccata ricordi (tentativo 1: 45 stanze, 7347 posizioni, zero trappole).

### ADR-012 — corse contro il citelis misurate dal simulatore
**Contesto**: le sfide a tempo devono essere sempre fattibili, ma il `NavGraph` dei nemici (senza dash, doppio salto pieno né muri rompibili) non trova quasi nessuna strada tra le fermate.
**Decisione**: `simReach` ora registra per ogni arco i fotogrammi del macro più rapido (`frames`). `computeTrials` fa un Dijkstra tra microfoni consecutivi sul percorso e salva `layout.trials` (`from`, `to` come `cp-colonna-riga`, `frames`). A runtime `TimeTrial` sceglie la tratta più lunga tra 9 e 70 s e dà `1.35 × tempo simulato + 5 s`. Palo con l'orologio accanto alla fermata, luce gialla e scintille sulla fermata d'arrivo, timer nell'HUD. Prima vittoria: 150 barre e flag `corsa-vinta-<id>`; record in `SaveData.trials`; trofeo "più veloce del citelis" a cinque.
**Strumento**: `scripts/world/run.sh trials [id]` aggiunge le tratte ai JSON già generati senza rigenerarli; `build-regions` le calcola da sé.

### ADR-013 — la trama sotto la trama (fase 5)
**Contesto**: la storia principale c'era, ma mancavano archi dei personaggi, scelte a metà gioco con conseguenze e lore nelle stanze enormi.
**Decisione**: i testi stanno in `src/content/arcs.ts` (uniti a `DIALOGUES`), il piazzamento in `src/engine/StoryManager.ts`, solo su `layout.spots` delle stanze laterali, ordinate per avanzamento così le note si leggono in ordine.
- **note ambientali**: 4 per regione (80), ognuna una piccola storia (herbert del cratere, il pendolare delle 7:39, i post-it della mamma di notino, franceschini nel bagno infinito, l'ospite n.11...). A 40 lette: flag `storie-del-realm`.
- **il quaderno strappato di pedro** (mistero e colpo di scena): 5 pagine in bus, santuario, rio, ruhra, ricordi, nelle stanze segrete se ci sono. Rivelano che il custode l'ha scelto pedro. Ricomposte: amuleto `quaderno-pedro`, dialogo `pedro-quaderno` al nucleo, sconfitta e finali diversi.
- **il pensiero sepolto di piema** (scelta a metà gioco): in mente, cancellarlo (`pensiero-cancellato`, come fece piema) o portarlo fuori (`pensiero-portato`). Cambia il garante nel void e il processo: con il pensiero cancellato romero arresta solo lametta (`lametta-arrestato`).
- **notino** dopo la tecnokill: a casa (agguati più umani, lui e sua madre in piazza) o sparacchino sequestrato (amuleto, primo notino di ogni agguato élite).
- **lochef** dopo la tana: arrestato (taglia, romero ne parla nel caso) o libero (brodo tiepido, trattoria in piazza).
- **romero in piazza** dopo il caso: chi ha letto il suo biglietto può offrirgli il caffè.
- **finali estesi**: una riga per ognuna di queste conseguenze, più guastalla autista con tre corse vinte.

### ADR-014 — tratti dei nemici
**Decisione**: tre tratti ortogonali al comportamento (`EnemyTrait`), assegnati a runtime in modo deterministico per bioma e comportamento (`traitFor`), mai alle élite né nelle stanze di inizio e riposo:
- **scudo** (camminatori e carichi): para i colpi frontali e il colpo risonante; passano pogo, colpi dal basso e alle spalle. La parata fa rinculo e non dà flow.
- **soffitto** (camminatori, saltatori, inseguitori al chiuso): appeso a testa in giù sotto un soffitto alto almeno 5 righe, scuro e senza luce; cade quando passi sotto o quando lo colpisci.
- **kamikaze** (saltatori e volanti): luce rossa, a 80 px innesca la miccia (650 ms, lampeggia, ticchetta) e scoppia in un raggio di 96 px che ferisce anche gli altri nemici.
**Perché a runtime**: come le trappole, non toccano la griglia verificata.

### ADR-015 — il telefono è opaco
**Contesto**: l'utente trovava il telefono brutto e l'app trofei laggava; la modalità assistita era introvabile e il menu principale non aveva i trofei.
**Decisione**: dentro lo schermo niente `backdrop-filter` (decine di righe sfocate che scorrono erano la causa del lag): superfici piene, righe dritte. Il guscio è un telefono vero: isola, status bar con l'ora del realm (`realmClock`), la zona come operatore, il flow come batteria, il dipinto della zona come sfondo della home, widget dell'obiettivo, griglia a 4 colonne e dock, app che si aprono zoomando dall'icona toccata. La bacheca dei trofei è un modulo condiviso (`src/ui/trophies.ts`) usato dal telefono e dalla schermata **trofei** del menu principale: anello di progresso, filtro tutti/presi/mancanti, medaglie, scheda che sale dal basso, record per capitolo. La **freccia guida** si accende e spegne dalle impostazioni del menu, della pausa, del telefono e già nella creazione della partita, sempre con la spiegazione di cosa costa.
**Vincolo trovato**: la classe globale `.label` di `style.css` mette tutto in maiuscolo: nei componenti nuovi usare nomi di classe specifici.

### ADR-016 — punteggio di partita e assistita per sempre
**Decisione**: accendere la freccia guida durante una partita la rende assistita fino alla fine (`SaveData.assisted`): `achievementsBlocked()` guarda anche il salvataggio, quindi spegnerla non riaccende trofei e punteggio. L'interruttore (`src/ui/assist.ts`, unico per menu, pausa, telefono e nuova partita) chiede conferma la prima volta. Il **punteggio della partita** (`src/engine/score.ts`) somma i capitoli finiti (`SaveData.runScores`, il migliore per capitolo nella partita), la stima del capitolo in corso (stessa formula senza bonus del tempo), 250 per trofeo e il bonus del finale (`ENDING_BONUS`). Si vede alla morte e nei titoli di coda; a fine partita va nella **classifica locale** (`localStorage` `gecowave-classifica`, prime dieci, sopravvive alle partite nuove), mostrata nella bacheca. Nel ng+ il punteggio riparte da zero.

### ADR-017 — il cast vivo a inchiostro (fase 6)
**Contesto**: nemici e boss erano sagome quasi nere da 20–130 px disegnate con `Graphics`, i boss ingranditi 1.45–2.1× e quindi sfocati; sotto le luci 2d si vedevano solo gli occhi.
**Decisione**: `src/engine/art/creatureKit.ts` disegna ogni creatura su canvas come il geco dei dipinti: forme piene a colori sporchi, ombra sfumata e tratteggiata dal lato lontano dalla luce (luce dall'alto a sinistra), filo di luce sul bordo, **un unico contorno d'inchiostro** attorno alla sagoma (silhouette dilatata), occhi e luci su uno **strato emissivo** separato (`<key>~glow`, sommato in ADD, fuori dalla Light2D: il buio non li spegne). Ogni foglio ha **4 fotogrammi** (camminata, bob, ali, ruote, fumo) e una **normal map** ricavata dalla sagoma (cupola sfocata più i solchi dell'inchiostro) passata come `dataSource` della texture: la Light2D modella le creature in rilievo. I disegni stanno in `src/engine/art/creatures/` e guardano tutti a sinistra (il codice gira con flipX quando il bersaglio è a destra).
- **risoluzione**: fogli al doppio (`CREATURE_RES = 2`) con un margine di 5 px logici; `customData` della texture porta misura logica, fotogrammi e risoluzione. `Enemy` e `Boss` scalano di `1/res` e dimensionano il corpo fisico sulla misura logica (`creatureBody`), quindi collisioni e bilanciamento non cambiano.
- **flip e normal map**: la Light2D di phaser ignora il flip nelle normali; `normalFlip.ts` lo mette nella stessa matrice di rotazione che phaser manda allo shader.
- **luci**: la luce che segue nemici e boss sta sopra e un po' davanti alla testa (`lighting.follow` con offset, `lightBoss`), così le normal map li illuminano dall'alto come nei dipinti.
- **animazione**: `syncLook` gira dopo la fisica (`POST_UPDATE`): fotogramma in base alla velocità (chi dorme respira piano), strato emissivo allineato, occhi smorzati a chi dorme o sta appeso.
- **boss**: 30 fogli in `creatures/bosses.ts` (trama) e `creatures/bossesVoid.ts` (dei, void, autoscuole), pezzi comuni in `bossKit.ts` (testa da geco di fronte, gambe, braccia, scanline e sfaldamento dei ricordi, aure). Quelli di profilo (`faces`: guggu, riba, lochef, ticummi, furgone, formicona, 7:40) si girano verso il geco; gli altri sono frontali. Il ciclo accelera a ogni fase e lo strato emissivo pulsa con la rabbia.
- **costo**: i fogli si disegnano al primo uso (`ensureCreature` nei costruttori di `Enemy` e `Boss`); `prewarmCreatures` all'apertura del capitolo prepara la legenda e gli evocati dei boss. Le vecchie sagome `Graphics` di nemici e boss sono state tolte da `textures.ts`.
- **personaggi**: i 16 npc della trama (`creatures/npcs.ts`) sono frontali, respirano a fotogrammi e passano da `castSprite` in `GameScene` (`animateCreature`: scala logica, ciclo, strato emissivo). Le vecchie sagome `Graphics` degli npc sono state tolte.
- **passanti**: i 14 tipi di comparse (`art/folk.ts`) usano lo stesso kit, di profilo verso destra (il codice li gira), 4 fotogrammi di camminata (fermi sul primo, di corsa quando scappano), occhi del colore della regione sullo strato emissivo; `folkImage` mette i piedi sul pavimento al netto del margine (`FOLK_ORIGIN_Y`).
- **galleria**: `?gallery` (solo sviluppo, filtro con `?gallery=boss-`, `&cell=230`) mostra tutto il cast sotto una luce che segue il mouse.

### ADR-018 — il suono prende la forma del posto (fase 6)
**Contesto**: musica ed effetti suonavano uguali ovunque (solo un passa-basso di notte); l'utente voleva musica ovattata ed eco sottoterra ed effetti per ogni scenario e situazione.
**Decisione**: un solo `AudioContext` condiviso (`src/engine/audio/acoustics.ts`) con una catena per musica ed effetti: passa-basso, **riverbero a convoluzione** con risposte all'impulso sintetiche per tipo di spazio (`open`, `street`, `cave`, `cavern`, `sewer`, `metal`, `crystal`, `void`, `library`, `room`, `arena`, `water`: coda, smorzamento, riflessioni vicine), **eco** con feedback che perde gli alti a ogni giro, compressore finale. Due convolutori in dissolvenza: cambiare spazio non fa click. Tutto si muove con `setTargetAtTime`.
- **cosa decide lo spazio** (`Soundscape.ts`, ogni 220 ms): 16 raggi nella roccia dal geco (distanza media delle pareti = grandezza, quanti colpiscono = chiusura, soffitto sopra la testa), stanza di superficie o no, profondità sotto `horizonRow`, testa sott'acqua (piene e vasche fisse), boss in corso nell'arena. Ogni bioma ha la sua acustica sotterranea (grotta che diventa caverna se è grande, fogne a rio e nel deposito, metallo in fabbrica e nucleo, cristallo al santuario e nella mente, biblioteca nella ruhra, void enorme) e in superficie i biomi di città rimbalzano sui palazzi (`street`).
- **musica**: ovattata in proporzione a roccia sopra, profondità e chiusura (scala logaritmica 20 kHz → 650 Hz, tetto a 0.85; ×0.75 nei capitoli tutti sotterranei, dove l'ovattato è la normalità e deve restare godibile; meno nel void e nella mente, che sono sogni), con riverbero ed eco del posto; sott'acqua 420 Hz; in pausa e col telefono 800 Hz, come da un'altra stanza; nei dialoghi si abbassa; coi boss resta piena e quasi asciutta. Vince sempre il filtro più chiuso tra notte, roccia, acqua, pausa e pericolo.
- **ambiente**: letti continui sintetici per bioma (vento, respiro della roccia, ronzio di macchine, server, acqua, droni del void, cristalli, città, brace, pioggia sul tetto) mescolati tra superficie e sottosuolo; suoni sporadici pesati per bioma e per giorno/notte (gocce, pietruzze, clangori lontani, bip, grilli, uccelli, corvi, sussurri, bolle, cristalli, clacson, traffico, topi, scricchiolii, scariche, un respiro grosso sotto), con pan casuale: passano per riverbero ed eco, quindi in grotta le gocce ritornano.
- **passi e atterraggi** sul materiale del bioma (pietra, cemento, mattoni, metallo, cristallo, fango, radici, circuiti, void) o in acqua; tonfo proporzionale alla caduta.
- **situazioni**: ultimo cuore = battito e mondo che si stringe; cambio di fase del boss = ruggito, scossa e un respiro del riverbero (`acoustics.swell`); boss sconfitto = coda lunga; arena che si chiude = porta che sbatte; morte = la musica rallenta come un nastro (`music.tapeStop`) e torna normale alla ripartenza; ogni nemico muore col suo materiale (`sfx.death`: vetro, plastica, carta, ferro, lamiera, vernice, chitina, gesso, nastro, carne); ogni boss si annuncia con la sua voce prima di un attacco su due (`sfx.bossVoice`: clacson, glitch, risata di lochef, gesso, coro degli dei, chiavi di walter, timbro di anna...).
- **taratura**: misurata nel browser con `acoustics.meter()` (solo sviluppo): ogni letto a livello 1 sta attorno a 0.008 rms (`BED_TRIM`), sotto la pioggia (0.024) e vicino alla musica (0.003–0.008); i passi a metà di un salto.
**Vincoli**: se WebAudio manca, musica ed effetti suonano asciutti (nessun crash). Hook di sviluppo `__acoustics` e `__sfx`.
**Verifica**: giro di fumo su tutti i 21 capitoli (caricamento, 300 fotogrammi, nessun errore; fogli del capitolo in 40–165 ms con swiftshader). L'editor disegna i fogli a inchiostro per le anteprime (primo fotogramma).

### ADR-019 — il conto del capitolo è una notifica, non un cartellone
**Contesto**: a fine capitolo un riquadro in sovrimpressione al centro dello schermo con tutte le voci del punteggio; l'utente lo trovava invasivo e brutto.
**Decisione**: a schermo solo una **notifica del telefono** che entra da destra (`src/ui/banner.ts`, superfici piene come il telefono, si chiude da sola o al tocco, si impila). Anche i messaggi wavesung passano di lì, così non si sovrappongono. Il conto voce per voce dell'ultima uscita da ogni capitolo si salva in `SaveData.chapterLog` e si legge nella **bacheca** (telefono e menu): ogni capitolo è una riga che si apre; compaiono anche i capitoli chiusi in modalità assistita.

### ADR-020 — i boss parlano mentre si combatte
**Contesto**: i boss parlavano solo prima e dopo lo scontro, in dialoghi che fermano il gioco.
**Decisione**: sottotitoli non bloccanti (`src/ui/subtitles.ts`, evento `bark`), una riga alla volta sopra la barra del boss, coda corta, le urgenti scavalcano. Le battute stanno in `src/content/barks.ts` per momento (`engage`, `phase2`, `phase3`, `hit`, `heal`, `low`, `idle`) più momenti propri (`extra`); `BossVoice` decide quando parlare (pausa minima 3,2 s, borbottii ogni 11–17 s, colpi e cure con probabilità e attesa). `Boss` emette `boss-engaged`, `boss-phase`, `boss-dying`; `Player` emette `player-act` (attacco con direzione, scivolata, inizio e fine cura). Lametta parla a ogni goccia del santuario; pedro ha battute diverse se hai ricomposto il quaderno; il glitch del finale vero alterna l'ordine e pedro che lo buca.
**L'ombra impara davvero** (`OmbraBrain`): conta le mosse ripetute e para la direzione abusata (`Boss.guard`, 4,2 s con l'abbonamento, 2,6 s da beta), punisce la cura a vita bassa con un cecchino, ti ricompare addosso se scivoli troppo. Le telecamere della sorveglianza la nutrono (`state.run.ombraDati`: più vita, soglia più bassa).

### ADR-021 — trama: il volere del geco, pedro in scena, il 33
- **volere**: dal cratere il geco ha un cartellino "CUSTODE" a penna, "provvisorio" a matita, e vuole che la parola sparisca. Il rio la sbava, il quaderno ricomposto la cancella (profilo e codex cambiano), ogni finale dice cosa ne è stato.
- **pedro in scena** (`PedroApparition`, `content/pedro.ts`): dal bus al void, una volta per regione a metà percorso, due righe chiare in sottotitolo e si sfalda. Sostituisce gli echi per messaggio.
- **33**: sono le notti in cui pedro ha detto "ciao" al geco del muro (giorno 6 → giorno 38, la trentatreesima è la promessa "raddrizzami tu"). L'1% di pedro che non ha eseguito l'ordine dipinge 33 azzurri accanto ai muri finti e rompibili (`TrentatreMarks`, 60% dei grumi, deterministico): dove c'è un 33 dietro c'è qualcosa. Margherita resta solo nella lettera della 14 barrato.
- **la voce del geco**: il geco non pensa ad alta voce e parla solo due volte, al caso (`romero-verdetto`, «non è colpa di pedro.») e al nucleo (`pedro-giorno30`). per il resto fa versi (atto 1) e gesti: al rio il cartellino si sbava senza cancellarsi, il volere resta visibile senza essere spiegato.
- **meno spiegoni**: due flashback nuovi (`riscrive`: piema corregge la riga sette; `salva`: il giorno 30 e la cartella IMPORTANTE), romero e il void ridotti a una riga dopo ogni film.

### ADR-022 — una meccanica per bioma (`src/engine/mechanics/`)
Tutte additive come trappole e lastre: costano vita o tempo, mai una strada verificata.
- **bus**: porte del citelis sui varchi del percorso, a orario (aperte 3,4 s, avviso 0,9, chiuse 2,6) con tabellone dei secondi; non si chiudono mai addosso al geco.
- **rio / stabilimento**: torrenti e nastri sui pavimenti (`FloorFlow`) che spingono e invertono il verso con una pausa; nel rio trascinano anche le piene. `Player.drift` insegue la velocità del posto più quella dei comandi.
- **cantina / sorveglianza**: telecamere a cono dal soffitto; la scivolata non si vede. In cantina buio pesto e allarmi che chiamano gente; nella sorveglianza ogni ripresa nutre l'ombra.
- **tecnokill**: il cecchino di notino all'aperto (laser rosso che insegue, bianco, sparo) finché notino non perde.
- **mente**: tre porte del dubbio in più sui varchi; un mazzo di dodici domande che ruota; sbagliare costa due cuori e due pensieri che mordono, non la vita.
- Durante la corsa contro il citelis porte e correnti si fermano: i tempi sono misurati senza.

### ADR-023 — economia a due uscite
Le barre servono a curarti (crocchetta, panino; la ricarica della bottega) e a costruirti (amuleti, tacche, anche in bottega). Tolti energetico, caffè, santino e acqua del rubinetto: i salvataggi li ritrovano in barre (`LEGACY_ITEMS`), le regioni già generate li trasformano in sacchetti di barre. Missioni e rami pagano barre, amuleti o cure; il caffè a romero si offre dal bar.

### ADR-024 — nemici simbolo che insegnano (`src/content/lessons.ts`)
Ogni nemico simbolo ha una debolezza legata a una mossa e un consiglio di markolino alla prima vista (solo se hai già l'abilità): citelis e fiat tipo sbandano se ci scivoli attraverso mentre caricano (doppio danno), pendolari del bus e tossici del trenbolone tengono lo scudo (pogo), specchietti riflettono metà dei colpi di lato e prendono il doppio dal basso, tecnodroni blindati che si aprono per un attimo dopo aver sparato, numeri ×3 contro analisi, bottiglie sciolte dall'acqua tossica, telecamere spente dal rimando dello scudo. Scintille gialle sul punto debole, grigie e un clang sulla corazza.

### ADR-007 — contenuti procedurali su posizioni verificate
**Decisione**: missioni, oggetti da cercare e destinatari si piazzano solo su `layout.spots`. I passanti usano i segmenti del grafo ma restano nella loro stanza.

### ADR-025 — riepilogo animato di capitolo
**Contesto**: a fine capitolo il conto era solo una notifica del telefono (ADR-019): niente celebrazione, niente mappa, niente cuori e segreti in un colpo d'occhio.
**Decisione**: prima del fade verso la regione successiva lo schermo va a nero e parte una sequenza lenta (`src/ui/chapterSummary.ts`, evento `chapter-summary-show`): titolo che atterra, mappa esplorata, cuori uno a uno, cose trovate, score voce per voce col sistema esistente (`chapterParts`/`sumParts`/`runScore`) e score attuale della run. La scena si mette in pausa e la musica si abbassa (`music.setGraveDuck`, la stessa via dei dialoghi gravi) finché il giocatore continua: un tocco o invio salta alla fine, il successivo porta al livello dopo. Le categorie incomplete diventano rosse con il colpo della morte (`sfx.die`), schermo che trema e lampo rosso; quelle complete hanno fanfara e timbro.
**Fonte dei totali**: un catalogo centrale (`src/engine/ChapterCompletion.ts`) registra ogni voce con chiave persistente vera, capitolo proprietario e categoria `heart`/`thing`, prima di controllare se è già presa: il denominatore resta giusto anche sui salvataggi avanzati. Le registrazioni doppie con categoria o capitolo diversi avvisano in console invece di corrompere i conti in silenzio.
**Cosa conta**: lore e note di regione, pagine di pedro (attribuite alla loro regione), pensiero sepolto, maschere, tacche piazzate, amuleti dei boss, sparacchino, completamento delle quest (l'amuleto quando c'è, la missione altrimenti), vittoria dell'arena rossa. Frammenti e abilità, barre, drop, cure, flow, checkpoint, corse contro il citelis, acquisti in negozio, quaderno ricomposto e oggetti chiave da flag di storia restano fuori: il primo gruppo è progressione, il secondo è globale o non attribuibile con certezza.
**Conseguenze**: l'input `segreti` del punteggio ora viene dal catalogo invece che dalla regex su `collectedLore` (che contava anche i sacchetti di barre): i punteggi dei capitoli cambiano, in meglio. La mappa del telefono mostra gli stessi numeri dell'overlay, solo per i capitoli col catalogo sigillato e mai per quelli mai visitati. Senza ui pronta o in caso di errore la transizione prosegue normale: la campagna non si blocca mai. Nessun nuovo salvataggio, nessuna nuova valuta.

### ADR-026 — punteggi piccoli
**Contesto**: un capitolo valeva migliaia di punti (esplorazione e tempo fino a 3000, segreti 150 l'uno): 4k già a perduta, numeri senza peso.
**Decisione**: scala ridotta due volte, fino a un centinaio a capitolo: esplorazione fino a 100, segreti 5 l'uno, nemici 1 l'uno, boss intoccabile 20, tempo fino a 100, morti −10. Bonus finali 50–300, trofei 10 l'uno, classifica locale separata (`gecowave-classifica-v3`).
**Conseguenze**: i salvataggi con punteggi in vecchia scala azzerano score e conti (sopra 500 a capitolo è impossibile nella nuova) invece di mescolare le scale. I record restano comparabili solo dentro la stessa scala.

### ADR-027 — riepilogo di fine gioco
**Contesto**: il finale mostrava solo un badge col punteggio nei credits, mentre i dati per un vero riepilogo erano già tutti nel save.
**Decisione**: stesso palco del riepilogo di capitolo (motore condiviso `src/ui/cine.ts`, evento `final-summary-show`): titolo del finale, mondo esplorato, cuori e segreti aggregati di tutta la run, conto (capitoli, trofei, bonus) e numero finale con posizione in classifica. `endGame` aggrega solo record già salvati (`scores` con stanze, cuori e segreti scritti alla chiusura di ogni capitolo): niente ricalcoli, niente lag. I titoli di coda partono in `onContinue`.
**Conseguenze**: `ChapterScore` guadagna tre campi opzionali (stanze, cuori, segreti): i save vecchi senza di essi mostrano il finale in forma ridotta invece di numeri inventati.

### ADR-028 — canone della trama
**Contesto**: la trama aveva l'ossatura forte ma buchi di coerenza (romero che indaga "da quarant'anni" su un glitch di 42 giorni fa, due cause del glitch, 5 o 10 maschere, contatore wave fino a 9/8, finali sepolti sotto gli epiloghi). Il piano 1 chiedeva ADR-025, già assegnato: questa è ADR-028.
**Decisione**: canone definitivo. Linea del tempo: ~quarant'anni fa la notte del primo esame di analisi 1 (aula bruciata alle quattro, piema riscrive il verbale in blu dando la colpa al limite notevole: nasce il caso analisi 1); giorno 1 nasce pedro; giorno 6 prima notte di "ciao" al geco del muro (notte 1); giorno 12 ritratto dritto "venuto bene" (notte 7); giorno 24 pedro scrive nel codice della wave che se gli succede qualcosa la wave va a chi è sveglio su quel muro alle quattro (notte 19); giorno 30 "perché sei la cosa migliore che ho disegnato", salvata in IMPORTANTE; giorno 37 "ti raddrizzo io" col pennello in bocca; giorno 38 "se un giorno divento storto, raddrizzami tu" al geco (notte 33); giorno 41 ore 03:58 "è tutto storto. raddrizzalo tu", telecamera spenta ("non voglio vedere"), bozzetto storto ("venuto bene"), sera strappa le 5 pagine; giorno 42 "sistemare = togliere ciò che è storto", piema corregge la riga 7 in blu, la wave esplode e va al geco; giorno 43 il gioco; "stanotte" l'ordine è in esecuzione e piema non lo ferma. Colpe: lametta negligenza/dipendenza/vergogna senza piano; piema copre il socio sempre (quarant'anni fa, riga 7, stanotte); pedro obbediente, il suo 1% dipinge i 33 azzurri; il limite capro espiatorio che tende a infinito. Il glitch è una conclusione, non un guasto: il bozzetto non è magia, è come lametta vedeva tutto quella notte. La 14 barrato era di ivan, deposito di walter (manutenzione mai pagata, poi tutto intestato a guggu coi debiti); senza freni si pianta nelle dune, ivan sospeso per eccesso di taglio; guggu fa girare i citelis a cercarla e il giro diventa il loop eterno; walter usa il geco per riprendersi le autoscuole, sconfitto anna dà le chiavi del deposito (varco barrato con `boss-down-walter`). Maschere: 5 (a 3 beat e +1 forza, a 5 ritmo perfetto e varco verde in perduta). markolino non ha scelto il custode; l'ombra beta usa l'unica telecamera sul geco, regalata da pedro (scheda cliente n.3); il gioco comincia il giorno 43; romero non ha lo scontrino, solo l'ora 03:58. Frammenti: 9 (`ALL_ABILITIES` in `src/types.ts`, `TOTAL_FRAGMENTS` segue da lì), soglia di fine gioco a 7 perché l'acqua tossica è opzionale. Finali: nelle carte restano max 3 righe di trama (cartellino, pedro, processo), gli epiloghi vanno nei titoli di coda (`endingEpilogues`, sezione "cosa ne è stato", scorrimento allungato in proporzione).
**Conseguenze**: i piani 2–4 e 9 danno il canone per scontato; testi riscritti solo dove il canone lo chiede, id di dialoghi/flag/oggetti invariati, nessun meme tolto, regioni non rigenerate.

### ADR-029 — mostrare, non spiegare
**Contesto**: il geco commentava le proprie emozioni (`il geco (pensa)`), i personaggi ripetevano la stessa punchline e spiegavano i sistemi con numeri nelle battute, obiettivi e chiamate spoileravano il finale.
**Decisione**: regole della voce (anche nel commento in testa a `story.ts`): R1 il geco non pensa ad alta voce; R2 parla due volte sole, al caso e al nucleo, con `mood: 'grave'`; R3 le righe narrate descrivono solo gesti visibili; R4 le gag `*verso di geco che...*` restano se sono una battuta, altrimenti diventano gesto o spariscono; R5 niente numeri di sistema nelle battute di trama (stanno in `MECHANIC_HINTS`, `LESSONS`, card abilità e tutorial di markolino); R6 niente spoiler di scelte o finali in obiettivi, chiamate e messaggi. `stabilimento-pensiero` e il suo innesco in `GameScene` rimossi (lo stabilimento non ferma più l'uscita), `tone.ts` perde `GecoVoice`/`geco`, `mente-ordine` e `ticummi-pieta` dicono cose nuove invece di ripetere il nucleo.
**Conseguenze**: resta un solo `il geco (pensa)` nella tana (`lochef-sconfitto`), perimetro del piano 4; i meme (41.077 secondi, 0,09€, failrp, non convalidare) restano tutti.

### ADR-030 — il void parla di piema
**Contesto**: nel void i rimpianti 1–3 (delegato, notturno, modello) ripetevano i tre indizi del caso con gli stessi flashback (`fb-ordine`, `fb-notte`, `fb-ritratto`), e le due verità nuove su piema arrivavano in fondo.
**Decisione**: ordine nuovo `notturno, modello, revisore, delegato, garante` (2 di lametta + 3 di piema); ogni verità aggiunge un pezzo nuovo (mattina dopo, promessa del giorno 37, riga sette alle 04:20, aula di analisi 1 di quarant'anni fa, ultimo accesso di stanotte). Il `delegato` passa a piema (nome, `glowColor` 0x60a5fa, palette blu, hp 46 con cooldown più corti per la difficoltà crescente); i `BossKind` e i flag `boss-down-*` non cambiano. Tre flashback nuovi (`fb-mattina`, `fb-promessa`, `fb-verbale` con `limite: 'boss-limite'` nel cast e gesto nuovo `gira-foglio` clonato da `passa-carta`); `fb-riscrive` prima di `revisore-intro` si salta se già visto col pensiero sepolto (`FLASHBACK_ONCE`, chiave `fb-${id}` invariata). `setupVoid`/`onVeritaRivelata` usano il primo rimpianto non battuto (`nextRegret`) invece del conteggio, così i salvataggi a metà void non saltano rimpianti.
**Conseguenze**: `verita-1..5`, intro dei rimpianti, guide di romero 3–4, `lore-void-2/3` e battute riscritte; `fb-ordine/notte/ritratto` restano solo al caso e ai ricordi. `void-svolta` ("è in ESECUZIONE") ora segue la verità 5.

### ADR-031 — la tana è horror
**Contesto**: lochef85 era a metà tra horror e barzelletta (dodici statue con una tiepida, ma battute da macchietta) e il giocatore poteva lasciarlo andare, con trattoria in piazza e brodo curativo.
**Decisione**: la tana è un capitolo horror per sottrazione. Guardrail: niente contenuti sessuali, atti, corpi o allusioni (mai su minori); lochef si capisce solo da schemi di adescamento e assenze (regali ai bimbi, "è un segreto nostro", "non chiamare la mamma", scarpe piccole, bimbi che "non fanno più il login"); vittime con dignità, mai battute; niente passato tragico né riscatto. Testi riscritti con stessi id (`tana-risveglio`, `lochef-benvenuto/perso/ritorno/perso-2/intro/sconfitto`, lore di statue/poster/frigo/collezione/vavleeh, `notino-tana`, `lochef-cameo` + riga in coda a `bimbo-rp-2`); tolti `lochef-libero`, `lochef-trattoria`, `romero-lochef-libero`. Dopo il boss: niente scelta, sempre `lochef-arrestato` → `lochef-consegna` (+200 barre) e l'`ospite-12` spawnato su uno `spot` della stanza delle statue, che dopo il dialogo se ne va (`ospite-12-libero`, in piazza alla fontana). Meccanica `Tana` (additiva, registrata in `createMechanic`): buio `0x1b1523` con luce del geco a 300/1.25 (ripristino in `destroy()`); musica bassa per tutto il capitolo (`music.setLevelDuck`, ×0.55, si compone col grave) con sfx lontani sopra (`growlFar`/`creak`/`whisper` ogni 20–40 s, mai sopra un dialogo); sussurri `whisper` ogni 25–45 s fuori da caccia e dialoghi con `sfx.whisper` + `sfx.growlFar`; nascondigli (un armadio ogni 2–3 stanze nelle zone di caccia, su `nav.segments` lontano da `avoid`, `seeded`) con E per entrare/uscire e uscita sui tasti di movimento (`Player.hidden`: fermo, alpha 0.1, invulnerabile; `Player.movePressed`); da nascosto lochef punta l'ultimo punto visto e si allontana con `bark` urgenti (`updateChase` + `chaseLastSeen`); oltre 6 s "la casa ti sente" (1 danno, evento `tana-sniffed`, lochef a 200 px); armadio monouso per caccia; musica ovattata (`music.setGraveDuck`) + `sfx.heartbeat`; tutorial una volta sola (`spiegato-nascondiglio`). `MechanicCtx` guadagna `chaseRunning`, `chaseRanges` e `addInteractable`. Tono tana a `{ level: 70, act: 2, folk: 'quieto', deaths: 'serie' }` con `DEATH_TANA`. Oggetti: `brodo-lochef` in `LEGACY_ITEMS` (80), `pancia-lochef` → "la chiave della tana" 🗝️, `grembiule-cuoco` → "grembiule strappato", trofeo `chef-stellato` → "la porta da dentro" 🚪.
**Conseguenze**: i salvataggi con `lochef-libero` migrano ad `arrestato` (romero lo arresta comunque); `deathPunchline('tana')` pesca da `DEATH_TANA`; niente rigenerazione regioni. Non fatto: le 11 targhette del giardino (facoltative) e la prova in gioco (serve permesso browser).

### ADR-032 — preload del terreno più fondo
**Contesto**: piccolo calo di fps entrando in stanze nuove. Profilato headless con tempi CPU per sottosistema: i frame costosi ai cambi stanza sono quasi tutti `TerrainRenderer.ensure` (paint sincroni da 4–19 ms, 52 ms all'avvio di una caccia dopo un teletrasporto); il resto (`updateExplore`, persist, wake nemici) resta sotto 1 ms. I piani 1–4 non c'entrano: la meccanica tana costa 0.003 ms/frame e la freccia guida è intatta (sparisce in caccia by design).
**Decisione**: `AHEAD` 1→2, `PER_FRAME` 1→3 in `TerrainRenderer.ts`. Stessa grafica (stesso paint, stessa eviction `KEEP=3`, stessa memoria), solo più pezzi pronti prima dell'arrivo. Misurato con spazzata sintetica: i paint fuori vista assorbiti dal preload salgono (454→638), i paint visibili in camminata restano quasi zero.
**Conseguenze**: meno raffiche sincrone cadendo nei pozzi e ai respawn; il teletrasporto resta un burst una tantum coperto dal fade.

### ADR-033 — eco della tana e tick gravi udibili
**Contesto**: nella tana l'eco spariva nelle stanze piccole (mandate `echoWet`/`echoFb` quasi a zero dal fattore `size`) e i tick delle battute gravi restavano inudibili anche dopo averli alzati (sine puro a 150–200 Hz, perso sulle casse piccole).
**Decisione**: `BiomeSound.echo` (default 1) passato in `AcousticTarget.echoMul` e applicato alle tre mandate eco in `apply()`; `burrow: 1.7`. `graveTick` diventa colpo basso (sine 82→55 Hz, 0.12) più click (rumore a 1400 Hz, 0.06): il click passa su qualsiasi cassa, il colpo resta scuro.
**Conseguenze**: solo la tana rimbomba di più; resto del gioco invariato.

### ADR-034 — le abilità rifatte
**Contesto**: alcune wave erano inutili (l'acqua di smela: pozza ai piedi, lenta, debole) o frustranti (il risonante a vuoto se mollavi prima dei 650 ms), quasi tutte disegnate con cerchi di `Graphics` e particelle generiche, senza ricarica leggibile né suono proprio.
**Decisione**: ogni wave ha un ruolo in combattimento, un gancio nel mondo (evento di scena `wave-world` con area e livello, che il piano 7 userà per i sigilli), grafica a inchiostro (`src/engine/art/abilityFx.ts`, gemelle `~glow` in ADD) e suono sintetizzato suo. Stato vecchio → nuovo: scivolata uguale ma con sagome d'inchiostro e linee di velocità; rimbalzo con anello di pennello; aggrappo con graffi sul muro; riflesso 6→7 s con scambio di posto (seconda pressione, costo 10, 300 ms invulnerabile) e grafica da vetro rotto, fermo senza nemici vicini (700 px); risonante a tre colpi (eco 12 flow ×0.5, onda 30 ×1, piena 45 ×2 che spacca gli scudi e stordisce 400 ms, mai i boss); analisi in tre tempi (ipotesi con cerchio di gesso e marcatura, passaggi con sei glifi, q.e.d. da 3/4 danni); scudo 2,2→1,6 s con rimando perfetto nei primi 220 ms (60% e insegue il tiratore, 25% dopo); acqua rifatta come bottiglia (lancio ad arco a terra, caduta in aria, max 2 pozze da 5 s, colpo diretto = smela III 1,1 s) con avvelenamento (+30% da tutto, +15% sui boss, 4 s, via `dmgTo` su fendenti/proiettili/analisi/clone/schianto/acqua); rigenerazione visibile (goccia, cuore che pulsa, nota bassa); fendente a pennellata e frammento a cristallo. Ricariche nell'HUD (`Player.cooldowns`, bus `wave-cooldowns` a 10 Hz, velo `conic-gradient` con `--cd`, chip spenta senza flow). `player-act` con `{ act: 'wave', wave, level }` per il piano 8. Tasti e `AbilityId` invariati; `proj-risonante` e `glyph-0..2` rimossi da `textures.ts`. Deviazioni dal piano: l'anello del risonante è una texture sola che si stringe (non tre fotogrammi); lo `shooter` del rimando è il nemico più vicino al punto di sparo (gli emit `enemy-shoot` non portano il tiratore); la pozza spegne i getti di vapore (`TrapManager.suppress`) ma resta sopra il pavimento sotto lo scoppio.
**Conseguenze**: bilanciamento cambiato (vedi tabella nel resoconto); i salvataggi restano validi (stessi `AbilityId`, stessi costi base dove c'erano); niente rigenerazione regioni.

### ADR-035 — i comandi sono azioni
**Contesto**: i tasti erano sparsi e scritti a mano in decine di posti (`Player` con A/D/W/S/J/K/Q/F/G/H/R/V/C più frecce e clic, E/ESC in scena, TAB/P nel telefono, E/Spazio/Invio in dialoghi e flashback, testi con F/G/H/R/V e SHIFT/SPAZIO/TAB); niente gamepad né rimappatura; freccia su saltava.
**Decisione**: livello input unico (`src/engine/input/`): `actions.ts` con 16 azioni, due preset (classico WASD, frecce) e gamepad standard, `bindingsFor` (la rimappatura vince sul preset), `matchesAction` per telefono/dialoghi/flashback, etichette leggibili; `Input.ts` con stato per fotogramma (`down/pressed/released` da confronto, mai lettori una tantum), clic destro senza menu contestuale, levetta con zona morta 0.35, ultimo dispositivo usato su bus `input-device`; `keyText.ts` con segnaposto `{k:azione}` applicato in dialoghi, toast, wavesung, card, telefono (lo storico conserva i segnaposto), bark e chip hud; `padBridge.ts` che nei menu fa imitare la tastiera al pad. `Player` e scena leggono solo azioni; le 5 wave in uno schema solo (wave da sola = risonante in carica, su+wave = analisi, giù+wave = bottiglia, scudo e riflesso dedicati; senza wave sbloccata solo un blip). Schermata comandi con preset, rimappatura a scambio con conferma sullo scambio di preset e ripristino, schema wave e tabella pad in sola lettura; tutto in `settings.controls`, evento `controls-changed` per ricostruire. Freccia su non salta più; alla ripresa gli spigoli si azzerano e la carica si cancella; col pad si interagisce con su da fermo.
**Conseguenze**: i salvataggi vecchi senza `controls` prendono il classico; in pausa e nei dialoghi la scena è ferma quindi niente spigoli né colpi partiti al rilascio; il bot di gioco usa ancora i tasti vecchi delle wave e va aggiornato prima di rigiocarci la campagna.

### ADR-036 — si cura solo col cibo
**Contesto**: c'erano tre cure sovrapposte (Q che cambia flow in vita, la rigenerazione passiva del rio, il cibo) più lo scudo: troppe, e Q e regen rendevano il cibo inutile. Q chiedeva 33 flow da fermi e in lotta non partiva quasi mai, la regen curava da sola.
**Decisione**: via la cura con Q e via la rigenerazione (8 frammenti, non 9; i salvataggi la perdono in migrazione). Resta solo il cibo: crocchetta +1 (15 barre), panino +2 (era +3, 60 barre), prima il piccolo poi il grande, dai microfoni resta la cura piena. Il rio cura ancora i malus (trenbolone e smela) ma non dà più frammenti. Tre amuleti persi dalla cura tornano al cibo (`foodHeal`): rosario e grembiule danno +1 vita a pasto, il quaderno resta solo flow. Lo scudo resta: è parata, non cura.
**Conseguenze**: senza cibo addosso C dice solo che lo zaino è vuoto; i rami dell'ombra che punivano la cura non scattano più (il cibo non emette eventi).

### ADR-037 — flashback nel mondo
**Contesto**: i film disegnavano il palco con carta/legno/cielo finti sopra il livello: a ogni zoom uscivano buchi, la luna sembrava una torcia e i sottotitoli una pagina di video.
**Decisione**: il palco è il livello vero. La camera lascia il geco e inquadra un punto accanto a lui, il buio segue la vista ogni frame, le barre sono nel dom, gli attori recitano nel mondo con una luce calda vera, luna a alone e comparse che dissolvono. Le stanze finte (carta, legno, intonaco, notte) spariscono dal codice. Alla fine il geco torna esattamente dov'era e com'era (posizione, velocità, visibilità, stordimento azzerato, camera che lo segue): niente restart. Se un dialogo con film parte mentre un altro gira, aspetta il suo turno invece di aprirsi sopra.
**Conseguenze**: sottotitoli senza riquadro, niente più tasto E in sovrimpressione, i suoni partono sempre perché l'audio si sveglia all'inizio.

### ADR-038 — le abilità riaprono il realm
**Contesto**: i frammenti aggiungevano solo un'icona all'hud; niente diceva "ora posso tornare lì". Le fondamenta c'erano già: cancelli fisici verificati (`gates.ts`), stanze laterali con spot verificati, mappa che si rivela, evento `wave-world` del piano 5.
**Decisione**: sistema di sigilli, sempre opzionali e solo laterali. Metadata nei json (`layout.abilityGates` dai cancelli mensola/camino, `layout.seals` da `scripts/world/seals.ts`, deterministico via hash, senza rigenerare); un solo manager runtime (`src/engine/AbilitySeals.ts`) che ascolta `wave-world`, disegna barriera e 33 azzurro, apre con la sola soluzione primaria e consegna il premio una volta sola (flag `sigillo-<id>`, chiave `sigillo-premio-<id>`); storia, missioni cerca e microfono rosso evitano le stanze sigillate; la mappa mostra il 33 solo a stanza vista e 33 già visto, con riga `33 letti: aperti/visti`; una sola nota wavesung di markolino alla prima vista. Nessuna stanza disegnata a mano, nessuna coordinata pixel nel codice di scena.
**Deviazioni dal piano**: 8 abilità non 9 (la rigenerazione non esiste più: il miasma chiede l'acquatossica); risonante a livelli 0/1/2 quindi soglia `level >= 1` (l'eco non apre, onda e piena sì); premi di ripiego dove mancava un amuleto libero (specchio: 90 barre, resina: tacca); senza rigenerazione completa gli `abilityGates` mancano e i due sigilli fisici usano stanze normali con avviso (la rigenerazione da decine di minuti resta da approvare); il miasma rallenta solo col contraccolpo, senza toccare la velocità del controller.
**Conseguenze**: chi non torna vede comunque il finale; morire prima di raccogliere lascia premio e cancello aperto; salvataggi vecchi senza `seals` giocano come prima.

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
- Fase 6: nemici (19), boss (30), personaggi (16) e passanti (14 tipi) rifatti a inchiostro, animati, con normal map e occhi emissivi (ADR-017); acustica per spazio con musica ovattata ed eco sottoterra, ambienti per bioma, passi per materiale, morti e voci dei boss, effetti di situazione (ADR-018).
- Fase 1 (motore a inchiostro), Fase 2 (telefono, zaino, amuleti), Fase 4b (trofei, punteggi, modalità assistita).
- Fase 3: regioni a stanze 10× il gioco vecchio, verificate; mappa che si rivela; fermate del citelis e viaggio rapido; passanti; nemici con stati e inseguimento; meteo e giorno/notte; arene.
- Fase 4: aggrappo (wave nuova, dalla formicona), élite, missioni dei passanti con amuleti nuovi, cancelli d'abilità nei primi capitoli.
- Fase 5: finale vero "riscatto" (giorno 30, il glitch, romero arresta gli dei).
- Bot: campagna completa fino al finale e capitoli segreti.
- Trappole meccaniche per bioma (seghe, presse, vapore).
- Lastre che crollano sopra i pozzi e allagamenti periodici (tossici in rio, tecnokill, trenbolone, stabilimento), ADR-010.
- Punteggio di partita alla morte e nei titoli di coda, classifica locale, partita assistita per sempre (ADR-016). HUD: le wave non finiscono più sotto la chip del telefono.
- UI: telefono ridisegnato, bacheca trofei nel telefono e nel menu, freccia guida visibile ovunque (ADR-015).
- Nemici: tratti scudo, soffitto, kamikaze (ADR-014).
- Fase 5: note ambientali, quaderno di pedro, pensiero sepolto, scelte su notino e lochef, ospiti della piazza, finali estesi (ADR-013).
- Sfide a tempo: corsa contro il citelis in ogni regione (ADR-012).
- Ricordi rigenerata e verificata col simulatore corretto (ADR-011).
- Arene opzionali: un microfono rosso per regione in una stanza laterale larga (scelta deterministica dall'id), tre ondate con i nemici della regione (l'ultima con un'élite), stanza chiusa con le sbarre dei boss; vittoria = flag `arena-vinta-<id>`, 180 barre, trofeo "gladiatore" a cinque. Morire annulla la sfida.
- Musica per ora del giorno: passa-basso WebAudio condiviso (`music.setNight`), da 20 kHz a 1,6 kHz su scala logaritmica; spento durante i boss. Se WebAudio fallisce la musica suona senza filtro.
- Hub della piazza: bottega (ricarica, pacco a sorpresa), bacheca delle commissioni, oracolo delle mappe (percentuali di esplorazione), bar con voci calcolate su quello che manca, folla dedicata (18+ passanti), due lore sui tetti.

### In corso / aperto
- **bot sulla campagna intera** con le regioni rigenerate: non ancora rifatto. Le tappe nuove sono state generate in `/tmp/wp-1.json`, `/tmp/wp-2.json`, `/tmp/wp-3.json` (file temporanei, da rigenerare in una sessione nuova con `scripts/world/waypoints.ts`).
- **stabilimento full-optional**: ora i boss non bloccano l'uscita ma la catena resta rio->stabilimento->ruhra. La rimozione dal path principale richiede rigenerazione regioni + migrazione salvataggi: da confermare con l'utente.

### Da fare

---

## 5. Cronologia
- **le abilità riaprono il realm**: sigilli laterali per ogni wave, premi persistenti, mappa coi 33, nota di markolino (ADR-038).
- **flashback nel mondo**: niente più stanze finte, il livello fa da scena, ritorno esatto del geco (ADR-037).
- **si cura solo col cibo**: via Q e regen, 8 frammenti, panino +2, amuleti del cibo, il rio cura i malus senza frammenti (ADR-036).
- **i comandi sono azioni**: livello input unico, preset classico/frecce più gamepad, rimappatura a scambio, testi col tasto vero, schema wave su un tasto solo (ADR-035).
- **le abilità rifatte**: tre colpi risonanti, scambio del riflesso, analisi in tre tempi, rimando perfetto, bottiglia di smela, avvelenamento, grafica a inchiostro, ricariche nell'hud, evento `wave-world` (ADR-034).
- **eco e tick nella tana**: rimbombo del burrow e colpi gravi udibili (ADR-033).
- **terreno senza scatti**: preload più fondo contro i cali entrando nelle stanze (ADR-032).
- **la tana è horror**: capitolo horror per sottrazione, scelta tolta, nascondigli con buio e sussurri, ospite n.12, migrazione salvataggi (ADR-031).
- **il void parla di piema**: due rimpianti di lametta e tre di piema, verità nuove, flashback nuovi, delegato passato a piema (ADR-030).
- **mostrare, non spiegare**: il geco non pensa più ad alta voce e parla solo al caso e al nucleo, via spoiler e tutorial robotici (ADR-029).
- **canone della trama**: linea del tempo giorno 1-43, colpe, glitch come conclusione, 14 barrato, 5 maschere, 9 frammenti, epiloghi nei titoli di coda (ADR-028).
- **riepilogo di capitolo**: carta animata a fine livello con mappa, cuori, cose e score, catalogo centrale dei collezionabili (ADR-025).
- **punteggi piccoli**: la scala dei punti divisa per dieci, classifica separata (ADR-026).
- **riepilogo di fine gioco**: stesso palco del riepilogo di capitolo, un piano sopra (ADR-027).
- **boss fight che si chiude**: patto, giorno 30, morte ed endgame spengono barra, voce e battute.
- **menu mai nero**: fondale con default garantito, scena fresca e canvas sempre visibile.
- **gioco vero**: boss che parlano in battaglia e ombra che impara, volere del geco e pedro in scena, 33 con un significato, flashback al posto degli spiegoni, una meccanica per bioma, economia a due uscite, nemici simbolo che insegnano una mossa.
- **trama esponenziale**: pedro echi precoci, romero anticipato, scelte leggibili, codex nel telefono, stabilimento attraversabile, semi 33/Margherita/IMPORTANTE, teaser opzionali, economia ribilanciata.
- **fix totale**: simulatore, bot, ricompense, boss per stanza, arene, lochef, guide.
- **mondo vivo**: navigazione, nemici a stati, passanti, meteo, giorno/notte, élite.
- **orientamento**: mappa che si rivela, fermate e viaggio rapido, freccia assistita.
- **gameplay**: aggrappo, missioni, cancelli d'abilità, trofei e punteggi.
- **trama**: finale vero, coerenza di prezzi ed epiloghi.
- **hub**: la piazza col citelis, npc di servizio, folla.
- **trappole**: seghe, presse, vapore per bioma.
- **audio**: musica ovattata di notte.
- **arene opzionali**: il microfono rosso.
- **pericoli**: lastre che crollano, allagamenti; ricordi sbloccata; trappole e passanti sulla pipeline di luce.
- **sfide a tempo**: la corsa contro il citelis.
- **trama**: archi secondari, scelte a metà gioco, lore ambientale, finali estesi.
- **nemici**: scudati, appesi al soffitto, kamikaze.
- **fase 6**: nemici e boss a inchiostro animati con normal map; acustica dei posti, ambienti per bioma, passi, situazioni.
- **simulatore**: partenze multiple, salti senza presa, azzeramento del blocco del salto dal muro, controllo boss per stanza.

## curva meme->serio (fase 5)
- `src/content/tone.ts`: ogni capitolo ha atto 1-4 e livello 0-100; il geco fa versi e gesti e parla due volte sole, al caso e al nucleo.
- `DialogueLine.mood`: meme/crepa/grave/silenzio. grave = typewriter a 46ms con un colpo basso e rado, pannello nero (`dlg-grave`), musica al 30% (`music.setGraveDuck`, rispettato anche dai fade). Le battute dei boss in battaglia hanno un tocco solo all'apertura.
- contenuti: atto 1 invariato; atto 2 crepe (notino-sconfitto, lochef-sconfitto, rio-cura, smela-sconfitta); atto 3 sobrio (lametta in cantina riscritto senza battuta sulla sedia, ticummi, mente-ordine, caso, verdetto); atto 4 tutto grave (ricordi, guide di romero, giorno30, verità, glitch, redento, processo); riscatto con coda nuova.
- `deathPunchline(levelId)` e `FOLK_QUIET` (passanti zitti negli atti finali) via `toneFor`.
- build + editor typecheck ok.
