# Piano 2 — togliere lo slop e far smettere il geco di spiegarsi

> Prima leggi `plans/00-INDEX.md`. Il piano 1 (canone) deve essere già fatto: alcune righe qui citate le ha già cambiate (`ivan-ricordo`, `custode-ingresso`), non rifarle.

## Obiettivo

L'utente vuole togliere lo "slop": le righe che **spiegano** invece di mostrare. Le due fonti principali:

1. **il geco che dice cosa prova** (`speaker: 'il geco (pensa)'`, e righe narrate tipo "*non sa perché. lo sa benissimo.*");
2. **ripetizioni, spoiler e tutorial robotici** messi in bocca ai personaggi.

**I meme restano tutti.** Le gag "*verso di geco che...*" dell'atto 1 sono meme del gruppo: restano. Si tolgono solo quelle che interpretano emozioni o spiegano la trama.

## Le regole nuove della voce del geco (scrivile anche nel commento in testa a `src/content/story.ts`)

- **R1** — il geco **non pensa ad alta voce**. Nessuna riga con speaker `il geco (pensa)` in tutto il gioco.
- **R2** — il geco parla **due volte** in tutto il gioco, ad alta voce, con `mood: 'grave'`: al caso («non è colpa di pedro.», `'romero-verdetto'`) e al nucleo («mi avevi chiesto di raddrizzarti, se fossi diventato storto. sono venuto.», `'pedro-giorno30'`). Non aggiungerne altre.
- **R3** — le righe narrate col geco (`speaker: 'il geco'`, testo tra asterischi) descrivono **solo gesti e cose che si vedono**. Vietati: "capisce", "sa", "non sa perché", "per una volta", "come tutti", "e lo sa", qualunque emozione nominata.
- **R4** — le gag `*verso di geco che...*` restano dove sono **una battuta** (atto 1 e momenti comici). Se la gag spiega la trama o un sentimento, va riscritta come gesto (R3) o tolta.
- **R5** — nessun personaggio spiega una meccanica con numeri e sigle in una battuta di trama (le spiegazioni stanno in `MECHANIC_HINTS`, `LESSONS`, nelle card delle abilità e nei tutorial di markolino al primo incontro, una volta sola).
- **R6** — niente spoiler di scelte o finali in obiettivi, chiamate e messaggi.

## A. Tabella completa delle righe del geco

Trovale con:
```bash
grep -rn "il geco (pensa)\|verso di geco\|speaker: 'il geco'" src/content
```
I numeri di riga sono indicativi (il piano 1 li avrà spostati): cerca per id del dialogo.

| dove (id) | riga di oggi (inizio) | decisione | testo nuovo |
|---|---|---|---|
| `markolino-intro` | «*provvisorio. a matita, che si cancella. non voglio solo menare...*» (pensa) | **riscrivi** come gesto: è il volere del geco, va mostrato | `{ speaker: 'il geco', color: 'green', text: '*il geco passa il pollice sulla parola a matita. non viene via.*' }` |
| `geco-anziano` | «*verso di geco che prende appunti*» | tieni | — |
| `filippus-dodo` | «*...giura di allenare le gambe*» | tieni | — |
| `guggu-intro` | «*...ha convalidato, giuro*» | tieni | — |
| `notino-intro` | «*...avrebbe preferito il dialogo*» | tieni | — |
| `notino-sconfitto` | «*è un bambino. con uno sparacchino più grosso di lui...*» (pensa) | **togli** la riga: la riga di notino prima basta | — |
| `flauto-intro` | «*...odore di luppolo scaduto*» | tieni | — |
| `rio-cura` | due righe (pensa): «*fa schifo. ed è la prima cosa che mi cura...*» e «*il cartellino si è bagnato...*» | **sostituisci le due righe con una** (gesto, il cartellino è il volere: va visto) | `{ speaker: 'il cartellino', color: 'green', text: '*l\'acqua del fiume passa sul cartellino. "provvisorio" si sbava. non si cancella.*', mood: 'grave' }` — la prima e l'ultima riga del fiume restano |
| `smela-tour` | «*...annusa la bottiglia e fa un passo indietro*» | tieni | — |
| `stabilimento-pensiero` | due righe (pensa) «*smela vende acqua...*», «*...per chi lavoro, io?*» | **togli tutto il dialogo e il suo innesco** (vedi B1) | — |
| `danjilo-intro` | «*...non berrà un bel niente*» | tieni | — |
| `smela-sconfitta` | «*verso di geco che per la prima volta accetta un bicchiere da smela. e lo versa a terra, piano.*» | **riscrivi** (togli "per la prima volta") | `'*il geco prende il bicchiere da smela. lo versa a terra, piano.*'` (mood `crepa` resta) |
| `furgone-sconfitto` | «*...archivia la pratica*» | tieni | — |
| `notino-tana` | «*...per una volta è d'accordo con notino*» | **non toccare**: lo riscrive il piano 4 | — |
| `romero-verdetto` | «non è colpa di pedro.» | tieni (R2) | — |
| `pedrino-fine` | «*ha paura di essere sovrascritto. come un file...*» (pensa) | **togli** | — |
| `lochef-cameo`, `tana-risveglio`, `lochef-benvenuto`, `lochef-ritorno`, `lochef-intro`, `lochef-sconfitto`, `vavleeh-corpo` | varie | **non toccare**: piano 4 | — |
| `tommaso-benvenuto-estraneo` | «*...osservato da molti più di 9 occhi*» | tieni | — |
| `ombra-intro` | «*verso di geco che capisce di aver finanziato il proprio nemico*» | **riscrivi** (spiega) | `'*il geco guarda il proiettore. il proiettore guarda il geco. con la sua faccia.*'` |
| `ombra-intro-scarsa` | «*...quasi offeso dalla qualità*» | tieni | — |
| `ticummi-caduto` | «*dalla tasca di ticummi rotola una boccetta... lui guarda te che la guardi.*» | tieni (è messa in scena) | — |
| `pedro-patto` | «*...potentissimo e con un pessimo presentimento*» | tieni (meme del finale cattivo) | — |
| `pedro-giorno30` | «mi avevi chiesto di raddrizzarti...» | tieni (R2) | — |
| `pedro-redento` | «*non dice niente. per una volta, non serve dire niente.*» (pensa) | **togli** | — |
| `barrato-ingresso` | «*il varco si chiude alle spalle. sotto le dune...*» | tieni (descrive il posto) | — |
| `settequaranta-intro` | «*...non aveva convalidato nemmeno stavolta*» | tieni | — |
| `settequaranta-morte` | «*dal relitto rotola un cuore...*» | tieni | — |
| `custode-intro`, `custode-morte` | «*...batte il piede a 120 bpm*», «*dal mixer si alza un cuore...*» | tieni | — |
| `doomsday-respinto` | «*verso di geco che ha guadagnato tempo, non pace. il doomsday rallenta ma non si ferma.*» | **riscrivi** (spiega una meccanica) | `'*il glitch si ritira. il cielo resta incrinato.*'` |
| `walter-bus-dopo`, `walter-rivelazione` | gesti | tieni | — |
| `seme-importante` | «*IMPORTANTE. la parola torna ovunque... qualcuno vuole che tu la ricordi.*» (pensa) | **riscrivi** come appunto neutro (serve al codex) | `{ speaker: 'taccuino del custode', color: 'green', text: '«IMPORTANTE. la cartella di pedro. l\'appunto nel cratere. il log del nucleo. stessa parola, tre posti.»' }` |
| `arcs.ts` pagine del quaderno (coda delle pagine 1–4) | «*verso di geco che piega la pagina e se la mette sul cuore. non sa perché. lo sa benissimo.*» | **riscrivi** | `'*il geco piega la pagina in quattro e la tiene.*'` |
| `quaderno-completo` riga 2 | «*...trentatré notti di "ciao". eri tu. sei sempre stato tu. e i 33 sui muri hanno la stessa grafia.*» | **riscrivi** (togli "eri tu, sei sempre stato tu": il giocatore ci arriva da solo) | `'*il muro della piazza. le quattro del mattino. trentatré "ciao". la grafia delle pagine è la stessa dei 33 sui muri.*'` (mood `grave`) |
| `quaderno-completo` righe 1 e 3 | nastro adesivo; il pollice cancella "provvisorio" | tieni | — |
| `pedro-quaderno` riga 1 | gesto | tieni | — |
| `pensiero-cancellato` | riga 1 gesto; riga 3 «*verso di geco che ha appena fatto esattamente quello che fece piema. e lo sa.*» | tieni la 1, **togli la 3** | — |
| `pensiero-portato` riga 1 | «*lo prendi. pesa più di un frammento. fuori dalla testa di piema diventerà carta, inchiostro, una riga sola: quella vera.*» | **accorcia** | `'*lo prendi. pesa più di un frammento.*'` |
| `notino-casa`, `notino-disarmato`, `romero-caffe` | gesti | tieni | — |
| `lochef-consegna`, `lochef-libero`, `lochef-trattoria` | | **non toccare**: piano 4 | — |
| `barks.ts` ombra phase3 | «*fa il tuo verso di geco. identico. solo più triste.*» | tieni (è l'ombra, non il geco) | — |

Dopo le modifiche:
```bash
grep -rn "il geco (pensa)" src
```
deve dare **zero** risultati.

## B. Codice da toccare

### B1. Lo stabilimento non ferma più l'uscita
In `src/scenes/GameScene.ts` (cerca `'stabilimento-pensiero'`, ~riga 2695) c'è un blocco che intercetta l'uscita dello stabilimento la prima volta per recitare il pensiero:
```ts
// il secondo pensiero vero del geco: lo stabilimento si può saltare, l'uscita no
if (this.def.id === 'stabilimento' && !state.hasFlag('pensiero-stabilimento')) {
    ...
}
```
Togli il blocco intero e il dialogo `'stabilimento-pensiero'` da `story.ts`. Il flag `pensiero-stabilimento` nei vecchi salvataggi resta innocuo.

### B2. `tone.ts`
`ToneDef.geco` (`GecoVoice = 'versi' | 'pensa' | 'parla'`) non è usato a runtime (verifica: `grep -rn "\.geco\b" src` deve trovare solo le definizioni). Toglilo dal tipo, dalla tabella `TONE` e dal fallback di `toneFor`, e aggiorna il commento in testa al file: le righe "il geco: versi fino alla tana, un pensiero vero al rio e allo stabilimento, la prima frase ad alta voce al caso" diventano una sola riga in minuscolo che dice la regola nuova (il geco parla solo al caso e al nucleo).

### B3. Commento in testa a `story.ts`
Il blocco di commento delle righe 5–11 descrive il geco che "pensa due cose vere". Riscrivilo (stesse righe al massimo, minuscolo, solo il perché): la voce del realm (minuscolo, demenziale, pedro glitcha, riba coi refusi, piema corretto), la curva meme→serio di `tone.ts`, e che il geco non commenta: fa versi e gesti e parla due volte.

## C. Spoiler, ripetizioni, tutorial robotici

### C1. Spoiler (R6)
- `src/content/phone.ts`, `OBJECTIVES.nucleo`: oggi finisce con «se hai giorno 30 + 5 verità, puoi salvarlo invece di ucciderlo.» Nuovo: `'pedro ti aspetta al nucleo. qualsiasi cosa ti offra, è glitchata.'`
- `phone.ts`, `CONTACTS.markolino.call`, voce `nucleo`: togli «a meno che tu abbia giorno 30 + 5 verità: allora puoi strappargli l'ordine di dosso.» Resta: `'qualsiasi cosa ti offra pedro: è glitchata. io te l\'ho detto. resta scritto.'`
- Cerca altri spoiler: `grep -rn "5 verità\|cinque verità\|giorno 30 +" src/content` e correggili allo stesso modo.

### C2. "occhio a pedro: ha dei piani" detto tre volte
La frase è la punchline del nucleo (`level14-nucleo.ts`: «non è più solo glitch. ha dei piani.») e la ripetono `'mente-ordine'` (terza riga, piema) e `'ticummi-pieta'` (seconda riga). Tieni la punchline, riscrivi le altre due **in modo che dicano qualcosa di nuovo**:
- `'mente-ordine'` terza riga (piema), diventa un seme della copertura (canone: piema copre sempre): `'ti apro l\'uscita. io vado a cercare lametta. e se vedi pedro... no. niente. vai.'` (mood `grave`)
- `'ticummi-pieta'` seconda riga (ticummi), diventa un seme dei 33: `'vattene prima che mi commuova. e un\'ultima cosa gratis: dai monitor ho visto pedro dipingere numeri sui muri, di notte. azzurri. sempre lo stesso.'` (mood `grave`)

### C3. Tutorial robotici nelle battute (R5)
Le stesse informazioni di sistema (arena, corse, maschere) oggi stanno **tre volte**: messaggio wavesung di markolino (giusto, resta), post su wavegram, chiamata a markolino. Nei post e nelle chiamate diventano voce di personaggio, senza numeri:
- `phone.ts`, post di samatt sull'arena («microfono rosso = arena: 3 ondate, 180 barre. a 5 sei gladiatore. parola di ex pendolare.») → `'il microfono rosso: ci sono salito una volta. sono sceso dopo un secondo. parola di ex pendolare.'`
- `phone.ts`, post di markolino sulle maschere (il piano 1 lo ha portato a 3/5) → `'maschere con la faccia del custode in giro per il realm. cercate dietro i muri finti. non chiedetemi di chi è la faccia.'`
- `phone.ts`, `CONTACTS.markolino`, l'ultima battuta del `pickFrom` (lista di sistemi) → `'segreti? le maschere con la tua faccia, le corse contro il citelis, il microfono rosso. io non ti ho detto niente. cioè sì.'`
- Il post di guastalla sulle corse resta (è il personaggio che parla di sé).

### C4. Controllo finale delle ripetizioni
Fai un giro di lettura su `story.ts` e `arcs.ts` cercando frasi quasi identiche dette da personaggi diversi (es. «il fiume non giudica» due volte nella stessa scena va bene; la stessa spiegazione in due capitoli no). Se ne trovi altre, **segnalale** nel resoconto con proposta di testo invece di cambiarle a sorpresa: i meme ricorrenti (41.077 secondi, 0,09€, "non convalidare", "failrp") sono voluti e restano.

## D. Documentazione
- `DEV_LOG.md`: aggiorna ADR-021 (la parte "la voce del geco": ora il geco parla solo due volte e non pensa ad alta voce) e la sezione finale "curva meme->serio" (togli "il geco fa versi, poi pensa (da rio)"). Aggiungi un ADR nuovo "mostrare, non spiegare" con le regole R1–R6.
- `REMASTER.md` fase 5: dove dice "il geco parla una sola frase vera al giorno 30" aggiungi che ora parla al caso e al nucleo e non pensa ad alta voce.

## E. Verifica
1. `npm run build` e `cd editor && npx tsc -b --noEmit`.
2. Zero risultati:
   ```bash
   grep -rn "il geco (pensa)\|stabilimento-pensiero\|GecoVoice" src
   ```
   ```bash
   grep -rn "lo sa benissimo\|e lo sa\.\|per una volta, non serve" src/content
   ```
3. Il dialogo `'rio-cura'` deve avere 3 righe (fiume, cartellino, fiume) e conservare `mood` dove c'era.
4. Commit: `git add .` poi `git commit -m "il geco smette di spiegarsi"`.

## Cosa NON fare
- Non toccare la tana (piano 4) né il void (piano 3).
- Non togliere gag dell'atto 1, il log di claudio, verisure, il trenbolone, i 41.077 secondi.
- Non aggiungere battute nuove al geco.
