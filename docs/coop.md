# coop

> implementato sul branch `coop`: rete nuova (non il vecchio `multiplayer-p2p`), ognuno simula il suo geco, l'host simula il mondo.

## come funziona

* **rete** (`src/net/`): sessione sopra trasporto astratto (PeerJS online, BroadcastChannel locale per due schede). Handshake con versione build, reliable JSON chunked, fast binario a 30Hz (geco) e 20Hz (mondo), ping/RTT/offset, link buono/instabile/perso.
* **autorità**: ogni client decide il suo geco (movimento, danni ricevuti). L'host decide nemici, boss, nidi, proiettili, drop, trama, salvataggio. I colpi del guest arrivano come richieste (`hit/take/break/interact`).
* **salvataggio**: slot `coop` sull'host, copia `ospite` sul guest. L'host invia i campi condivisi, il guest rimanda solo scoperte (flag, fermate, stanze, dialoghi letti). Statistiche e abilità: ognuno tiene le sue; i premi corazza/forza dell'host passano anche al guest.
* **difficoltà in due** (`src/game/coop/scaling.ts`): hp nemici e boss ×1,7, élite ×1,8, nidi +1 vivo e ×0,72 intervallo. I danni restano a cuori interi.
* **join a partita iniziata**: chi entra appare accanto all'host col mondo intero; uscire e rientrare col codice riusa il geco ricordato.
* **trappole in fase**: l'host simula anche vicino al compagno e manda la fase; l'ospite rifà le posizioni ma i danni sono i suoi.
* **npc di trama**: nati mid-capitolo arrivano all'ospite (spawn e sparizione).
* **citelis, scelte, quiz, trial**: il tabellone e le scelte aprono a chi ha bussato; la corsa la giudica chi corre; la porta morde chi sbaglia.
* **dispensa comune**: shop ed eat dell'ospite passano dall'host (soldi e zaino condivisi, cura a chi mangia).
* **doppio KO e finale**: SEI MORTO su entrambi, titoli su entrambi: l'host chiude la stanza a fine titoli, l'ospite finisce i suoi senza essere interrotto.

## regole decise e implementate

* **dialoghi trama**: entrambi li vedono, mondo fermo per entrambi, solo l'host manda avanti.
* **dialoghi manuali**: solo chi li apre, mondo continua, chi parla è fermo/invulnerabile/non bersagliabile.
* **scelte trama**: le fa l'host, l'ospite vede un toast. Scelte da dialogo manuale: le fa chi parla, via host.
* **film/ricordi**: l'ospite segue quello dell'host.
* **morte**: chi cade fa spettatore (camera sull'altro), si rialza al microfono acceso dall'altro. Doppio KO = ripartenza insieme.
* **telefono/pausa**: in due non fermano il mondo, congelano solo il proprio geco. Voce "raggiungi il compagno" se ci si perde.
* **cambio capitolo/uscite/bus/varchi/checkpoint**: li decide l'host, il guest segue. Il guest non viaggia da solo.
* **doomsday/freccia assistita**: li sceglie l'host in forgia, valgono per entrambi, il guest li vede in lobby.

## prove

```bash
scripts/harness/build.sh
node scripts/coop/duo.mjs lobby|start|mondo|dialogo|morte|dentro
```

Tutti verdi in locale (due schede, senza rete). `dentro` copre join a partita iniziata, mondo intero, uscita guest e rientro col geco ricordato. Single invariato per costruzione (tutto il coop è dietro `coop.together/ctx.simulates`); unit `npm test` verdi.

## limiti noti

* l'inseguitore della tana (lochef) esiste solo sull'host: il guest non lo vede. I messaggi `actor/actor-gone` sono riservati ma non usati.
* l'online vero (PeerJS + TURN) è implementato ma provato solo in locale: prima di pubblicare servono prove su due reti diverse, credenziali TURN a tempo da endpoint proprio (`VITE_TURN_ENDPOINT`), mai statiche nella build pubblica (`.env` è gitignored, ma le `VITE_*` finiscono nel bundle).
* la stanza tiene un guest alla volta; il secondo riceve "partita piena".
