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
- **la voce del geco**: niente più muto fino al nucleo. tre momenti veri, tutti su passaggi obbligati: al rio (`rio-cura`) il volere diventa suo, "li raccolgo per sapere chi l'ha scritto"; all'uscita dello stabilimento (`stabilimento-pensiero`, anche per chi salta smela) si chiede per chi lavora; al caso (`romero-verdetto`) dice la prima frase ad alta voce, «non è colpa di pedro». al nucleo resta la frase che conta.
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
- `src/content/tone.ts`: ogni capitolo ha atto 1-4 e livello 0-100; il geco fa versi, poi pensa (da rio), poi dice una frase vera sola (giorno 30).
- `DialogueLine.mood`: meme/crepa/grave/silenzio. grave = typewriter a 46ms, niente blip, pannello nero (`dlg-grave`), musica al 30% (`music.setGraveDuck`, rispettato anche dai fade).
- contenuti: atto 1 invariato; atto 2 crepe (notino-sconfitto, lochef-sconfitto, rio-cura, smela-sconfitta); atto 3 sobrio (lametta in cantina riscritto senza battuta sulla sedia, ticummi, mente-ordine, caso, verdetto); atto 4 tutto grave (ricordi, guide di romero, giorno30, verità, glitch, redento, processo); riscatto con coda nuova.
- `deathPunchline(levelId)` e `FOLK_QUIET` (passanti zitti negli atti finali) via `toneFor`.
- build + editor typecheck ok.
