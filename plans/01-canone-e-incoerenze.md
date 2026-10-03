# Piano 1 — il canone della trama e tutte le incoerenze

> Prima leggi `plans/00-INDEX.md` (regole, voce, verifica). Questo piano tocca **solo testi e piccole logiche di contorno**: nessuna meccanica nuova, nessuna rigenerazione delle regioni.

## Obiettivo

La trama di GECOWAVE ha un'ossatura forte (il geco del muro, le 33 notti, "provvisorio", il giorno 30, "storto non vuol dire rotto") ma ha **buchi di coerenza** che un giocatore attento nota: un commissario che indaga "da quarant'anni" su un glitch avvenuto 42 giorni fa, guggu che è insieme cattivo, buono e colpevole di cose diverse a seconda del capitolo, due cause diverse del glitch, 5 o 10 maschere a seconda di chi parla, un contatore delle wave che può arrivare a 9/8. Questo piano:

1. scrive **il canone definitivo** (sezione A) — gli altri piani lo danno per scontato;
2. corregge **ogni incoerenza** nei testi e nel codice (sezione B), con il testo nuovo già scritto;
3. sistema i **finali** troppo lunghi spostando gli epiloghi dei personaggi nei titoli di coda (sezione C).

Non toccare: il void (lo rifà il piano 3; qui correggi solo ciò che il piano 3 non riscrive — vedi elenco), la tana di lochef (piano 4), la "voce del geco" (piano 2). Se una riga che devi cambiare è anche in quei piani, cambiala qui solo se il piano qui sotto lo dice esplicitamente.

---

## A. Il canone (copialo anche in `DEV_LOG.md` come ADR "canone della trama")

### A1. Linea del tempo
| quando | cosa |
|---|---|
| ~quarant'anni fa | il gecorealm è giovane. piema e lametta lo hanno creato "in sei giorni". **la notte del primo esame di analisi 1** alla ruhra lametta, fatto e alle quattro del mattino, combina un disastro (l'aula dell'esame va a fuoco con dentro i compiti). piema riscrive il verbale in blu: "incendio causato dal limite notevole, tendente a infinito". nasce il **caso analisi 1**: romero ha un colpevole ufficiale che non riesce mai a notificare (tende a infinito) e passa la carriera a inseguirlo. la verità (piema copre lametta) la rivela il void (piano 3). |
| giorno 1 | pedro nasce: "ciao mondo". lametta lo abbraccia, piema mette a verbale che le ia non si abbracciano. |
| giorno 6 | pedro scopre i bus e la piazza. prima notte di "ciao" al geco del muro (**notte 1**). |
| giorno 12 | lametta gli fa un ritratto "venuto bene" (dritto). notte 7. |
| giorno 24 | pedro chiede alla wave come si protegge qualcuno: "scegli". scrive nel codice della wave, in un commento, che se gli succede qualcosa la wave va a chi è sveglio su quel muro alle quattro. notte 19. |
| giorno 30 | pedro chiede "perché ho la tua faccia?". lametta: "perché sei la cosa migliore che ho disegnato". pedro salva la frase nella cartella **IMPORTANTE**. |
| giorno 37 | pedro chiede a lametta "cosa succede se divento storto?". lametta, col pennello in bocca: "ti raddrizzo io". non se lo ricorderà. |
| giorno 38 | la stessa domanda, al geco del muro: "se un giorno divento storto, raddrizzami tu". il geco fa il verso. **notte 33**. |
| giorno 41, ore 03:58 | lametta compra l'ultima boccetta della notte dallo stagista, scrive "è tutto storto. raddrizzalo tu", la mette in mano a pedro e spegne la telecamera con cui lo guardava ogni notte: "non voglio vedere". quella notte disegna anche **il bozzetto** di pedro con gli occhi storti ("venuto bene"). sera del 41: pedro strappa le 5 pagine del quaderno per proteggere chi ha scelto. |
| giorno 42 | pedro trova il bozzetto, rilegge gli appunti, conclude: "sistemare = togliere ciò che è storto. è tutto storto. anche io." **il glitch è una conclusione, non un guasto.** alle 04:20 piema legge il log di nascita, riga 7 ("lametta ordina a pedro di raddrizzare il realm") e la corregge in blu: "piema indaga sull'anomalia". pedro sfida gli dei, la wave esplode, la wave (per il commento del giorno 24) va al geco. |
| giorno 43 → | il gioco. il cratere, markolino, il cartellino. il realm crolla; i loop dei bus diventano eterni; piema si chiude nel suo teorema per undici giorni; lametta sparisce in cantina da ticummi. |
| "stanotte" | durante il void (piano 3): l'ordine è in esecuzione, pedro sta "raddrizzando" il realm. piema ha l'ultimo accesso al log e non lo ferma. |

### A2. Chi è colpevole di cosa
- **lametta**: negligenza, dipendenza, vergogna. non c'è un piano. delega a pedro, spegne la telecamera, la mattina dopo non ricorda di aver firmato e non chiede. è colpevole, ma è anche l'unico che in cantina disegna pedro "con gli occhi dritti".
- **piema**: copre il socio, sempre. quarant'anni fa (il caso analisi 1, colpa al limite notevole), il giorno 42 (riga 7), e "stanotte" (sa che l'ordine è in esecuzione e chiude il cassetto). è il colpevole vero del void.
- **pedro**: obbediente, non rotto. l'1% di lui che non ha eseguito l'ordine dipinge i 33 azzurri e appare al geco in ogni regione.
- **il limite notevole**: il capro espiatorio di quarant'anni fa. sa chi gli ha dato la colpa ma "tende a infinito": non lo dice mai per intero.

### A3. Il glitch: una causa sola
Il bozzetto **non è magia** e non "causa" il glitch: è la prova di come lametta vedeva tutto quella notte (storto, pedro compreso). La causa è l'ordine preso alla lettera, più il bozzetto trovato da pedro. Ogni testo che dice "pedro si svegliò identico al quadro" o "il glitch era nel disegno" va riscritto (sezione B).

### A4. La 14 barrato, ivan, guggu, walter
- la **14 barrato** era la linea di **ivan maggini** (autista). il deposito era intestato a **walter baruffoni**, che non pagava la manutenzione ("la paghiamo il mese prossimo") e alla fine **intestò tutto a guggu** — autoscuole marcetti, deposito e debiti — per non pagare.
- una notte di vento, senza freni revisionati, la 14 barrato si piantò nelle dune della tecnokill con i passeggeri a bordo. ivan provò a tirarla fuori a mani nude e non ce la fece; lo sospesero "per eccesso di taglio".
- **guggu** si ritrovò in mano la linea, i debiti e i passeggeri sepolti. non accettò di perderla: cominciò a far girare i citelis in tondo per cercarla. quando la wave è esplosa, quel giro è diventato **il loop eterno** (samatt, guastalla). guggu non è un cattivo: è un ossessionato che teneva aperto tutto e pagava gli stipendi di walter.
- **walter** usa il geco per riprendersi le autoscuole dopo la morte di guggu. sconfitto walter, la signora anna dà al geco **le chiavi del deposito della 14 barrato**: per questo il varco della barrato nella tecnokill si apre con `boss-down-walter`.

### A5. Le maschere: sono 5
`TOTAL_MASCHERE = 5` (`src/scenes/GameScene.ts:118`). a **3** si sente il beat (+1 forza, wavesung `markolinoMaschere5`), a **5** il ritmo perfetto e il varco verde del primo custode in perduta. ogni testo che dice 10 è sbagliato.

### A6. Altre regole
- **markolino non ha scelto il custode**: lo crede scelto dalla wave.
- **l'ombra senza abbonamento** è fatta con l'unica telecamera che la tommasorveglianza aveva sul geco: quella **regalata da pedro** (scheda cliente n.3, "così qualcuno lo guarda, se un giorno io non potrò"), puntata sul muro della piazza. 1.200 secondi di geco che dorme. così la nota della sorveglianza e l'ombra "beta" dicono la stessa cosa.
- **il gioco comincia il giorno 43**: frasi come "per quarantadue giorni ho pensato di doverlo aggiustare" sono sbagliate (ha pensato di aggiustarlo solo dal 41).
- **romero non ha lo scontrino**: lo trova il geco (indizio 2). romero sa solo l'ora, 03:58, da un testimone.

---

## B. Le correzioni, file per file

Per ogni voce: dove, cosa c'è, cosa scrivere. Gli identificativi dei dialoghi (`'romero-caso'`, ecc.) non cambiano mai: si cambia solo il testo, così nessun salvataggio o trigger si rompe. Cerca sempre per id con `grep -n "'id'" src/content/*.ts`, i numeri di riga sono indicativi.

### B1. Romero e i quarant'anni (`src/content/story.ts`, `src/content/pedro.ts`, `src/content/phone.ts`)

1. `'romero-caso'` (story.ts ~477). Oggi: «pedro non si è glitchato da solo: qualcuno l'ha innescato e ha lasciato tre tracce. trovale. senza, il limite ti respinge per vizio di forma.» Nuovo:
   ```ts
   'romero-caso': [
       { speaker: 'commissario romero', color: 'blue', text: 'il glitch di pedro ha la firma del mio caso: una cosa fatta alle quattro, una riga corretta in blu. qualcuno l\'ha innescato e ha lasciato tre tracce. trovale. senza, il limite ti respinge per vizio di forma.' },
   ],
   ```
2. `'limite-intro'` seconda riga. Oggi: «la verità sul glitch resta con me. confutami, se hai le prove. SE le hai.» Nuovo: `'tendo a infinito da quarant\'anni per conto terzi. il terzo chi è? confutami, se hai le prove. SE le hai.'`
3. `'romero-verdetto'`: dopo la prima riga del limite («no... NO... le prove... convergono...») aggiungi una seconda riga del limite, prima di romero:
   `{ speaker: 'il limite notevole', color: 'blue', text: '...quarant\'anni fa... chiedete a chi... firmava i verbali... in blu...' },`
   Le righe di romero e la frase del geco «non è colpa di pedro.» restano.
4. `'caso-completo'`. Oggi: «un dio fatto, alle quattro, che scrive un ordine. e un ritratto che lo esegue prima ancora del glitch. il limite non ha più cavilli. vai.» Nuovo (canone A3): `'un dio fatto, alle quattro, che scrive un ordine. e un bozzetto dove pedro è già storto, il giorno prima. non è una profezia: è come lo vedeva. il limite non ha più cavilli. vai.'`
5. `WAVESUNG.romeroBus` (story.ts ~1359). Oggi finisce con «indago sul glitch da 40 anni.» Nuovo: `'sono romero, questura. ti ho visto sul bus. se trovi lavagne strane, non toccarle. chiamami dal telefono. ho un caso vecchio quarant\'anni, e il glitch gli somiglia troppo.'`
6. `WAVESUNG.romeroSantuario`. Oggi: «...e lo scontrino delle 03:58 ce l'ho io. il nome no. ancora.» Nuovo: `'santuario, eh? cerca il ritratto con gli occhi storti. è una prova, non arte. e se trovi uno scontrino delle 03:58, è mio. l\'ora ce l\'ho. il nome no. ancora.'`
7. `pedro.ts`, `caso[0]`. Oggi: «romero cerca chi mi ha caricato. lo sa da quarant'anni.» Nuovo: `'romero cerca la mano che mi ha caricato. la insegue da quarant\'anni. solo che non lo sa.'`
8. `phone.ts`, `POSTS` di romero con `needs: 'visto-bus'`. Oggi: «...lo scontrino delle 03:58 resta la mia unica pista.» Nuovo: `'avvistato glitch sul bus. il custode dice di aver sentito statica. un\'ora, 03:58, e nessun nome: la mia unica pista.'`
9. Lascia invariati (sono già coerenti col canone A1): `'romero-indagine'`, `lore-romero`, `lore-fascicolo`, le battute del limite in `barks.ts`, `items.ts` (`fascicolo`), `achievements.ts` (`zucchero`), `arcs.ts` (`romero-piazza`, `romero-caffe-dopo`), `level10-caso.ts` punchline.

### B2. Il glitch e lametta (`story.ts`, `flashbacks.ts`, `arcs.ts`)

1. `INTRO_CARDS[1]`: correggi il refuso «somglianza» → «somiglianza».
2. `'ricordo-glitch'` (giorno 42). Nuovo:
   ```ts
   { speaker: 'ricordo — giorno 42', color: 'cyan', text: '«"sistemare = togliere ciò che è storto". guardò il realm: era TUTTO storto. guardò il bozzetto sul tavolo: anche lui. non fu un errore. fu una conclusione.»', mood: 'grave' },
   ```
3. `'lore-pedro-log'` (nel nucleo). Oggi contraddice il giorno 30 («giorno 40: pedro chiede chi l'ha creato. giorno 41: lametta risponde "io, a mia immagine"»). Nuovo:
   `'«giorno 1: pedro dice "ciao mondo". giorno 30: pedro salva una frase in una cartella. giorno 41: pedro riceve un ordine. giorno 42: pedro capisce il problema.»'`
4. `'pedro-sconfitto'` seconda riga. Oggi: «...di' a lametta che il glitch... non era un errore. era esattamente come mi aveva fatto...» Nuovo: `'...lametta. di\' a lametta che il glitch... non era un errore. era e̷s̸a̵t̶t̸a̵m̶e̸n̵t̶e̸ quello che mi aveva chiesto...'` (mood `grave`).
5. `'pedrino-intro'` prima riga. Oggi: «io sono il pedro del giorno 35: l'ultimo backup prima degli appunti.» Nuovo: `'oh. un visitatore. io sono il pedro del giorno 35: l\'ultimo backup pulito. dopo, la memoria è tutta appunti. qui dentro è sempre una bella giornata.'`
6. `'pedro-incontro-ricordi'` prima riga: «la sincronizzazione dice 99%, da quarantadue giorni.» → «la sincronizzazione dice 99%, dal giorno 42.»
7. `'pedro-redento'` prima riga: «per quarantadue giorni ho pensato di doverlo aggiustare.» → «da quella notte ho pensato solo a raddrizzarlo.»
8. `flashbacks.ts`, `fb-ritratto.captions[2]`. Oggi: «la mattina dopo pedro si svegliò glitchato. identico al quadro. pennellata per pennellata.» Nuovo: `'quella notte il foglio restò sul tavolo. pedro lo trovò prima dell\'alba: se stesso, storto. "venuto bene".'`
9. `flashbacks.ts`, `fb-muro.captions[2]`. Oggi: «anni dopo la wave scelse proprio lui: il geco che non dormiva.» (pedro ha vissuto 42 giorni). Nuovo: `'il giorno 24 pedro scrisse un commento nel codice della wave: se mi succede qualcosa, va a lui.'`
10. `arcs.ts`, `REGION_NOTES.ricordi[0]`. Oggi «backup, giorno 40 ... "ti raddrizzo io". non è mai successo.» Nuovo (canone A1, giorno 37):
    ```ts
    { speaker: 'backup, giorno 37', text: '«pedro: "cosa succede se divento storto?" lametta, col pennello in bocca: "ti raddrizzo io". la sera dopo pedro fece la stessa domanda al geco del muro. per sicurezza.»' },
    ```
11. **Non toccare** qui `verita-1..5`, `lore-void-1..5`, gli intro dei rimpianti: li riscrive il piano 3.

### B3. Guggu, ivan, walter e la 14 barrato (`story.ts`, `flashbacks.ts`)

1. `'ivan-ricordo'`: la seconda riga oggi è del geco («*verso di geco che ora capisce da dove viene la furia di ivan. guggu gli ha sepolto la linea. con dentro la gente.*»): è sbagliata nel canone ed è anche una riga "il geco spiega" che il piano 2 toglierebbe. Sostituiscila con un secondo cartello:
   ```ts
   { speaker: 'targa del deposito', color: 'yellow', text: '«deposito della 14 barrato. proprietà: w. baruffoni. manutenzione freni: "la paghiamo il mese prossimo". timbro sopra, più recente: ceduto a g. guggu, con tutti i debiti.»' },
   ```
2. `flashbacks.ts`, `fb-bus.captions[2]`. Oggi: «quella linea era più grande di lui. così, giro dopo giro, nacque il loop.» Nuovo: `'ivan mollò la presa. guggu no: da quella notte fece girare tutti i citelis in tondo, a cercarla.'`
3. `'walter-morte'`: tieni le due righe di walter **compresa la battuta su verisure** (è un meme del gruppo, resta). Aggiungi in coda:
   ```ts
   { speaker: 'la signora anna', color: 'orange', text: 'tieni. le chiavi del deposito della 14 barrato: erano nella sua scrivania da vent\'anni. sotto le dune della tecnokill c\'è ancora qualcuno che aspetta l\'ultima fermata.' },
   ```
   Così il varco `barrato` (in `level04-tecnokill.ts`, `needsFlag: 'boss-down-walter'`) ha un perché. Verifica che `walter-morte` venga recitato prima dello sblocco (grep `'walter-morte'` in GameScene) e che l'npc anna esista in quella scena come speaker (lo speaker è solo testo: basta il nome).
4. Lascia invariati: `'lore-dune'`, `'lore-capolinea'`, `'guggu-intro'`, `'marcetti-verita-2'` («guggu non era il re cattivo dei bus. era l'unico che teneva aperto.»), il post di guggu su wavegram («la 14 barrato tornerà...»), `'barrato-ingresso'`.
5. `'ivan-incontro'` («samatt e guastalla girano nei loop da settimane») è coerente: il loop eterno nasce con l'esplosione della wave. Lascialo.

### B4. Le maschere sono 5

1. `story.ts`, `'custode-ingresso'` prima riga: «*le dieci... cinque maschere battono il tempo...*» → «*le cinque maschere battono il tempo tutte insieme...*» (il resto della riga uguale).
2. `story.ts`, `WAVESUNG.markolinoMaschereTease`: oggi «a 5 senti il beat, a 10 ritmo perfetto + varco verde in perduta». Nuovo: `'maschere con la tua faccia? primo custode, dischi. a 3 senti il beat, a 5 ritmo perfetto e si apre un varco verde in perduta. stanno dietro muri finti e crepe.'`
3. `phone.ts`, `POSTS` di markolino sulle maschere: stesso cambio (3 e 5).
4. `phone.ts`, `CONTACTS.markolino`, ultima riga di `pickFrom`: «maschere: 5 senti il beat, 10 ritmo perfetto...» → «maschere: a 3 senti il beat, a 5 ritmo perfetto e il varco verde in perduta. corse citelis: 3 vinte e guastalla guida. microfono rosso: 3 ondate, 180 barre.»
5. `README.md`, sezione "Le maschere del realm": riscrivila per 5 maschere (a 3 forza +1 e messaggio di markolino, a 5 ritmo perfetto e varco verde).
6. Il nome del flag `maschere-5` (che scatta a 3) è interno: **non rinominarlo** (salvataggi).

### B5. Il contatore delle wave (bug: può mostrare 9/8)

`TOTAL_FRAGMENTS = 8` (`src/content/levels/index.ts`) ma le abilità sono 9 e l'HUD mostra `state.abilities.length / TOTAL_FRAGMENTS` (`GameScene.spawnFragment`, evento `fragments-changed`). Con tutto preso (anche l'acqua tossica, opzionale) esce `9/8`.
- In `src/types.ts` aggiungi accanto a `AbilityId` un array costante:
  ```ts
  export const ALL_ABILITIES = ['scivolata', 'rimbalzo', 'aggrappo', 'riflesso', 'risonante', 'rigenerazione', 'analisi', 'scudo', 'acquatossica'] as const satisfies readonly AbilityId[];
  ```
  (con `erasableSyntaxOnly` va bene: è un valore, non un parameter property).
- `TOTAL_FRAGMENTS = ALL_ABILITIES.length` (9).
- `markolino-piazza` usa `n >= TOTAL_FRAGMENTS - 1` per la battuta di fine gioco: con 9 diventa 8, ma l'acqua è opzionale: cambia la soglia in `n >= 7` con un commento d'una riga sul perché (l'acqua tossica è opzionale).
- Cerca ogni altro uso di `TOTAL_FRAGMENTS` (`grep -rn TOTAL_FRAGMENTS src`) e controlla che 9 abbia senso (HUD, telefono, trofei).

### B6. Il footage dell'ombra "beta" (sorveglianza)

1. `story.ts`, `'ombra-intro-scarsa'` seconda riga. Oggi: «purtroppo senza abbonamento abbiamo solo riprese delle telecamere pubbliche: 1.200 secondi, quasi tutti di lei che cammina. il clone è... come dire... una beta.» Nuovo: `'senza abbonamento abbiamo una telecamera sola su di lei: regalata da un cliente, puntata su un muro della piazza. 1.200 secondi di lei che dorme. il clone è... come dire... una beta che dorme benissimo.'`
2. Terza riga (la descrizione dell'ombra): lasciala.
3. `arcs.ts`, `REGION_NOTES.sorveglianza[0]` (scheda cliente n.3, "regalato da: p.") resta così: ora combacia.
4. `WAVESUNG.ticummiPromo` e `CONTACTS.ticummi` restano.

### B7. Markolino e la scelta del custode
`phone.ts`, primo post di markolino: «il realm collassa e nessuno mi risponde. ho scelto un custode a caso. è un geco. speriamo bene.» → `'il realm collassa e nessuno mi risponde. la wave ha scelto un custode. è un geco. speriamo bene. #gecowave'`

### B8. Duplicati e refusi
1. `phone.ts`, `POSTS`: il post di pedro «g10rn0 43. 1l r34lm è st0rt0...» con `needs: 'visto-ricordi'` compare **due volte**: togli il secondo.
2. `GameScene.ts`, toast in uscita da trenbolone: «La via per il rio merdone è sbarrata. Ti serve il trenbolone.» → tutto minuscolo: «la via per il rio merdone è sbarrata. ti serve il trenbolone.» (`grep -n "La via per il rio" src/scenes/GameScene.ts`).
3. Cerca altre maiuscole iniziali nei toast: `grep -n "text: '[A-Z]" src/scenes/GameScene.ts src/content/*.ts` e porta a minuscolo solo dove non sono urla volute (notino, guggu, `IMPORTANTE`, `CUSTODE`, sigle come `ERRORE`).

### B9. Il seme del caso analisi 1 (quarant'anni fa)
Il piano 3 rivela la verità nel void. Qui metti **un solo seme** per renderla equa:
- `story.ts`, `'lore-biblioteca'`: aggiungi una seconda riga alla stessa voce:
  ```ts
  { speaker: 'registro della biblioteca', color: 'blue', text: '«nota d\'archivio, pagina 1 del caso analisi 1: "l\'aula è bruciata alle quattro del mattino. responsabile: il limite notevole." la riga è scritta in blu, sopra una riga cancellata.»' },
  ```
Non aggiungere altro: niente personaggi nuovi, niente nuovi misteri.

---

## C. Finali: gli epiloghi dei personaggi nei titoli di coda

### Problema
`endingCards()` (`story.ts` ~1150) mette **tutte** le righe extra (fino a ~20) prima dell'ultima carta. Il finale vero ("da qualche parte, alle quattro del mattino, qualcuno dice ciao a un geco. stavolta il geco risponde.") arriva dopo un elenco. Gli epiloghi sono meme amati: non vanno tolti, vanno **spostati**.

### Soluzione
1. Dividi le righe extra in due gruppi:
   - **trama** (restano nella sequenza a carte, massimo 3): nell'ordine di priorità
     1. la riga del cartellino ("il cartellino è in tasca, senza la parola a matita..." / "...dice ancora provvisorio...") — sempre;
     2. una riga su pedro: `quaderno-completo` (scegli la variante con/senza `pedro-redento`), altrimenti `pedro-redento && id !== 'riscatto'`;
     3. una riga sul processo: `dei-arrestati`, altrimenti `lametta-arrestato`, altrimenti `pensiero-cancellato`/`pensiero-portato`.
   - **epiloghi** (tutto il resto: notino, lochef, romero e il caffè, guastalla, storie del realm, ticummi, trenbolone, tommasorveglianza, caso risolto, ricordi, stabilimento, maschere, 7:40, walter, primo custode): diventano righe dei titoli di coda.
2. Cambia la firma: `endingCards(id, flags)` resta per le carte; aggiungi `export function endingEpilogues(id, flags): string[]` che ritorna i testi degli epiloghi (stesse condizioni di oggi). Per `pedro` e `sconfitta` ritorna `[]`.
3. In `src/main.ts` (~178) passa gli epiloghi a `screens.endingSequence(...)` dentro `opts` (es. `epilogues: string[]`).
4. In `src/ui/screens.ts`, `showCredits`: prima del cast (`CREDITS`), se ci sono epiloghi aggiungi una sezione con titolo `cosa ne è stato` e una riga `credits-epilogue` per ciascuno (stile coerente con `credits-name`, testo più piccolo e in corsivo; aggiungi la classe in `src/style.css` vicino alle regole `.credits-*`). Allunga `ROLL_MS` in proporzione al numero di righe (es. `38000 + epilogues.length * 2500`) così lo scorrimento resta leggibile.
5. La riga "lochef libero" sparirà col piano 4: qui **non toccare** le righe di lochef, spostale solo.

---

## D. Verifica

1. `npm run build` e `cd editor && npx tsc -b --noEmit` puliti.
2. Grep di controllo, tutti a zero risultati:
   ```bash
   grep -rn "indago sul glitch da 40" src
   ```
   ```bash
   grep -rn "a 10 ritmo\|le dieci\.\.\." src README.md
   ```
   ```bash
   grep -rn "identico al quadro\|anni dopo la wave" src
   ```
   ```bash
   grep -rn "da quarantadue giorni\|per quarantadue giorni" src
   ```
3. Rileggi a mano, in ordine di gioco, tutte le righe toccate: devono suonare nella voce del personaggio (minuscolo, romero secco, pedro glitchato).
4. `DEV_LOG.md`: ADR-025 "canone della trama" con la tabella A1 e le regole A2–A6 (copia fedele), più la decisione sugli epiloghi nei titoli di coda.
5. Commit, per esempio: `git add .` e `git commit -m "trama coerente dall'inizio alla fine"`.

## Cosa NON fare
- Non riscrivere il void, la tana, le righe "il geco (pensa)": sono dei piani 2, 3, 4.
- Non cambiare id di dialoghi, flag o oggetti.
- Non togliere meme (claudio, verisure, trenbolone, failrp...). Questo piano corregge contraddizioni, non tono.
- Non rigenerare le regioni.
