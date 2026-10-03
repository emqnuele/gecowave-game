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

**stato fase 3**: regioni a stanze ✅ (10× il gioco vecchio, ogni regione verificata col geco simulato a fisica vera, zero trappole); mappa che si rivela ✅; fermate del citelis con viaggio rapido ✅; passanti vivi per bioma ✅; nemici che dormono, pattugliano, si chiamano, inseguono e scappano ✅; meteo e giorno/notte ✅; arene che si chiudono durante i boss ✅; hub della piazza col citelis (bottega, bar delle voci, bacheca, oracolo delle mappe) ✅; trappole meccaniche (seghe, presse, getti di vapore, per bioma) ✅. musica per ora del giorno (di notte ovattata, i boss sempre pieni) ✅; arene opzionali a ondate (il microfono rosso, una per regione) ✅; lastre che crollano sopra i pozzi e allagamenti periodici, tossici nei biomi velenosi ✅.

### Fase 4 — gameplay
- wall-jump/aggrappo (nuova wave), nuovi comportamenti nemici, nemici d'élite
- quest secondarie con npc ricorrenti, ricompense, scelte
- sfide opzionali (arene, prove a tempo)

**stato fase 4**: aggrappo (presa e salto dai muri, lo lascia la formicona) ✅; élite ✅; nuovi comportamenti nemici: scudati (si colpiscono alle spalle o col pogo), appesi al soffitto che ti piombano addosso, kamikaze che scoppiano ✅; missioni dei passanti (cerca, caccia, consegna) con 7 amuleti nuovi ✅; cancelli d'abilità (mensola per il doppio salto, camino per aggrappo) nei capitoli fino a rio ✅; arene opzionali del microfono rosso ✅; sfide a tempo: la corsa contro il citelis in ogni regione, tempi misurati dal geco simulato ✅.

### Fase 4b — trofei, punteggi e modalità assistita ✅
(bacheca dei trofei nel telefono e nel menu principale, record per capitolo, freccia guida nelle impostazioni di menu, pausa, telefono e nella creazione della partita; accesa una volta, la partita resta assistita fino alla fine. punteggio della partita mostrato alla morte e alla fine, con classifica locale delle partite)
- **achievement** (trofei) per le imprese: boss senza danni, regioni esplorate al 100%, segreti, maschere, finali, sfide a tempo, scelte di trama
- **punteggio** per capitolo e totale: tempo, morti, uccisioni, esplorazione, segreti; classifica locale nel profilo del telefono
- **modalità assistita**: la freccia guida che indica il prossimo varco verso l'obiettivo è un'impostazione (spenta di default). chi la accende gioca in modalità facile e **non sblocca achievement** (la partita resta segnata come assistita)
- niente testi in sovrimpressione accanto al geco: la freccia parla da sola, il resto lo dice la mappa del telefono

### Fase 5 — trama
- trame secondarie per ogni personaggio, lore ambientale nelle stanze, finali estesi
- migliorare la trama del gioco enormemente, più scelte, più conseguenze, più misteri, più colpi di scena, più emozioni. in generale attualmente è molto sloppy e poco soddisfacente, non dobbiamo riscrivere tutto ma dobbiamo renderlo più coerente, più profondo, più interessante, più divertente, più emozionante. abbiamo bisogno di una storia da film da gioco di serie A.

**stato fase 5**: finale vero "riscatto" ✅: al nucleo, chi ha visto i ricordi di pedro può ricordargli il giorno 30; con le cinque verità del void pedro capisce di essere stato usato e si combatte il glitch (l'ordine di lametta) invece di lui; con il caso chiuso romero arresta gli dei; le wave si possono affidare a pedro redento. così caso, ricordi e void pagano davvero. archi secondari ✅: il quaderno strappato di pedro (5 pagine, il custode l'ha scelto lui), il pensiero sepolto di piema (cancellarlo come fece lui o portarlo fuori come prova: cambia void e processo), notino a casa o disarmato, lochef arrestato o libero, romero e il caffè, gli ospiti della piazza che dipendono dalle scelte. lore ambientale ✅: 80 note, una piccola storia in 4 parti per regione. finali estesi ✅: una riga per ogni conseguenza. curva meme→serio ✅ (`content/tone.ts`: 4 atti, 0=meme puro a perduta a 100=serio puro al nucleo): atti 1 meme, atto 2 crepe (la battuta si interrompe, il geco inizia a pensare), atti 3-4 quasi solo verità; battute gravi con typewriter lento, pannello nero e musica abbassata (`DialogueLine.mood`, `music.setGraveDuck`); il geco parla una sola frase vera al giorno 30 e i finali/extra restano sobri; morti e passanti cambiano tono per capitolo (`deathPunchline`, `FOLK_QUIET`); riscatto con coda («stavolta il geco risponde»).


fase 6:


migliorare i boss e mostri. migliorare le loro texture e come sono fatti. sono molto minimali e bruttini attualmente. sempre in stile del gioco e con shader coerenti ecc..


musica ovattata + eco quando si è sottoterra.

+effetti particolari sfx per ogni scenario/livello e situazione che adattano musica e ogni cosa. tipo eco, ecc..

molto importante queste cose !!!

in generale migliore le texture dei nemici, boss ecc.. e gli sfx

**stato fase 6**: cast vivo rifatto ✅: 19 nemici e 30 boss disegnati a inchiostro come il geco (colori pieni, ombra tratteggiata, contorno spesso, occhi accesi che il buio non spegne), 4 fotogrammi ciascuno, normal map per le luci 2d, i boss di profilo si girano verso di te. suono dei posti ✅: musica ovattata ed eco sottoterra in proporzione a roccia e profondità, riverbero diverso per grotta, caverna, fogna, fabbrica, cristallo, biblioteca, void, sott'acqua; ambienti continui e suoni sporadici per ogni bioma, giorno e notte; passi sul materiale; situazioni (ultimo cuore, fasi del boss, arena, morte a nastro, pausa e telefono attutiti, dialoghi).

