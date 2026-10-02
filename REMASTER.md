# GECOWAVE — REMASTER

Branch: `remaster`. Obiettivo: portare *The Flux of Cosenza* da action-platformer a corridoio a un metroidvania souls-like stile Hollow Knight, con un tocco GTA (lo smartphone, la città che vive, le cose da fare), **mantenendo lo stile grafico a inchiostro e tratteggio** e costruendoci sopra.

## Diagnosi del gioco attuale

| area | stato | problema |
|---|---|---|
| mappe | 20 griglie ascii 40×(450–800) | corridoi piatti alti uno schermo: il terreno vive nelle ultime 10 righe, il resto è cielo vuoto. Zero verticalità, zero interconnessione |
| terreno | un tileset 4×4 da 160px per tutto il gioco | ogni capitolo ha gli stessi mattoni, le stesse casse di legno, gli stessi blocchi quadrati |
| decorazioni | `props.png`, 22 sprite per tutti i biomi | ripetitive, e l'atlante ha rettangoli bianchi cotti dentro che si vedono in gioco |
| parallasse | 1 dipinto + colonne + nebbia | niente strati intermedi, niente primo piano scuro, le skyline procedurali esistono ma non sono usate |
| camera | zoom adattato all'altezza del livello | funziona solo perché i livelli sono strisce |
| sistemi | abilità, barre, cuori, maschere | niente inventario, oggetti, amuleti, negozi, quest secondarie, mappa |

Punti di forza da tenere: voce e trama (demenziale, coerente, piena di personaggi), boss con fasi, scelte che pesano (tommasorveglianza, patto con pedro), musica originale (22 tracce), gli sfondi dipinti, il movimento HK già buono (coyote, buffer, pogo, dash).

## Fasi

### Fase 1 — motore visivo (tocca tutto il gioco esistente) ✅
- **biomi**: ogni capitolo ha un bioma (palette, materiale del terreno, vestizione delle superfici, sagome del parallasse, particelle, spine)
- **terreno organico**: il tilemap resta solo per le collisioni; si disegna un contorno levigato e sporcato a mano, riempito col materiale del bioma, buio all'interno e leggibile sul bordo, con linea d'inchiostro, erba/muschio/cavi/cristalli sopra e radici/stalattiti/catene sotto
- **props a inchiostro** generati per bioma (niente più atlante condiviso)
- **parallasse a strati**: cielo, dipinto, 3 piani di sagome con prospettiva atmosferica, nebbia, **primo piano nero** davanti al giocatore
- **atmosfera**: particelle per bioma, raggi di luce, acqua animata

### Fase 2 — lo smartphone e l'inventario ✅
- telefono stile GTA (TAB): messaggi (le wavesung diventano chat vere con storico), mappa, zaino, amuleti, diario delle quest, radio con la colonna sonora, impostazioni
- inventario: consumabili, oggetti chiave, collezionabili
- **amuleti** con tacche (stile charm di HK), equipaggiabili solo ai microfoni
- negozi (barre come valuta)

### Fase 3 — regioni interconnesse
- formato livello a **stanze**: ogni capitolo è una regione di stanze collegate da porte sui bordi, con scorciatoie a senso unico, segreti, backtracking
- **room builder**: le stanze si scrivono con un piccolo dsl (scava, piattaforma, pozzo, arena) invece che a mano carattere per carattere
- **hub** centrale e **bus** come stagways tra regioni
- mappa che si rivela esplorando (si compra/si trova, come da cornifer)
- ricostruzione dei capitoli, a partire dal capitolo 1 come vetrina
- importante: il mondo deve essere **vivo**: npc che camminano, parlano, fanno cose, reagiscono a pedro e al giocatore; nemici che pattugliano, dormono, si radunano, scappano; eventi ambientali (pioggia, vento, temporali, nebbia, allagamenti); musica che cambia in base alla zona e all'ora del giorno.
- importante: il mondo deve essere **pericoloso**: nemici che ti inseguono, ti attaccano, ti uccidono; boss che pattugliano le regioni; trappole ambientali; zone in cui non puoi tornare indietro senza morire.
- IMPORTANTISSIMO: il mondo deve essere ENORME. almeno 10 volte piu grande di adesso. fatto BENE. 

**stato fase 3**: regioni a stanze ✅ (10× il gioco vecchio, ogni regione verificata col geco simulato a fisica vera, zero trappole); mappa che si rivela ✅; fermate del citelis con viaggio rapido ✅; passanti vivi per bioma ✅; nemici che dormono, pattugliano, si chiamano, inseguono e scappano ✅; meteo e giorno/notte ✅; arene che si chiudono durante i boss ✅; hub della piazza col citelis (bottega, bar delle voci, bacheca, oracolo delle mappe) ✅; trappole meccaniche (seghe, presse, getti di vapore, per bioma) ✅. musica per ora del giorno (di notte ovattata, i boss sempre pieni) ✅; arene opzionali a ondate (il microfono rosso, una per regione) ✅. da fare: allagamenti, piattaforme che crollano.

### Fase 4 — gameplay
- wall-jump/aggrappo (nuova wave), nuovi comportamenti nemici, nemici d'élite
- quest secondarie con npc ricorrenti, ricompense, scelte
- sfide opzionali (arene, prove a tempo)

**stato fase 4**: aggrappo (presa e salto dai muri, lo lascia la formicona) ✅; élite ✅; missioni dei passanti (cerca, caccia, consegna) con 7 amuleti nuovi ✅. da fare: cancelli d'abilità veri nel generatore (zone di regioni vecchie raggiungibili solo con aggrappo), sfide a tempo, arene opzionali.

### Fase 4b — trofei, punteggi e modalità assistita ✅
- **achievement** (trofei) per le imprese: boss senza danni, regioni esplorate al 100%, segreti, maschere, finali, sfide a tempo, scelte di trama
- **punteggio** per capitolo e totale: tempo, morti, uccisioni, esplorazione, segreti; classifica locale nel profilo del telefono
- **modalità assistita**: la freccia guida che indica il prossimo varco verso l'obiettivo è un'impostazione (spenta di default). chi la accende gioca in modalità facile e **non sblocca achievement** (la partita resta segnata come assistita)
- niente testi in sovrimpressione accanto al geco: la freccia parla da sola, il resto lo dice la mappa del telefono

### Fase 5 — trama
- trame secondarie per ogni personaggio, lore ambientale nelle stanze, finali estesi
- migliorare la trama del gioco enormemente, più scelte, più conseguenze, più misteri, più colpi di scena, più emozioni. in generale attualmente è molto sloppy e poco soddisfacente, non dobbiamo riscrivere tutto ma dobbiamo renderlo più coerente, più profondo, più interessante, più divertente, più emozionante. abbiamo bisogno di una storia da film da gioco di serie A.

**stato fase 5**: finale vero "riscatto" ✅: al nucleo, chi ha visto i ricordi di pedro può ricordargli il giorno 30; con le cinque verità del void pedro capisce di essere stato usato e si combatte il glitch (l'ordine di lametta) invece di lui; con il caso chiuso romero arresta gli dei; le wave si possono affidare a pedro redento. così caso, ricordi e void pagano davvero. da fare: trame secondarie per personaggio, più scelte con conseguenze a metà gioco.
