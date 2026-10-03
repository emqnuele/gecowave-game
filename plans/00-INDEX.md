# GECOWAVE — piani di lavoro (indice e regole comuni)

Questa cartella contiene **9 piani** da eseguire **uno alla volta, in ordine**, ognuno da un agente diverso che non sa nulla delle conversazioni precedenti. Ogni piano è autosufficiente, ma **tutti presuppongono le regole di questo file**: leggilo sempre per primo, poi leggi il tuo piano per intero prima di toccare codice.

Repo: `/Users/ema/Projects/geco-game/gecowave-game-v2-fable` · branch di lavoro: **`remaster`** · **non fare push**.

---

## Ordine di esecuzione

| # | file | cosa | dipende da |
|---|---|---|---|
| 1 | `01-canone-e-incoerenze.md` | fissare il canone della trama e correggere tutte le incoerenze | — |
| 2 | `02-slop-e-voce-del-geco.md` | togliere lo slop (il geco che spiega le emozioni, ripetizioni, spoiler) tenendo i meme | 1 |
| 3 | `03-void-piema.md` | rifare il void: 2 rimpianti di lametta, 3 di piema, niente ripetizioni del caso | 1, 2 |
| 4 | `04-tana-horror.md` | la tana di lochef85 diventa un capitolo horror vero; niente più "lascialo andare" | 2 |
| 5 | `05-abilita.md` | rivedere e migliorare le 9 abilità (meccanica + grafica), l'acqua di smela rifatta | — |
| 6 | `06-comandi.md` | livello di input con azioni, preset, rimappatura, gamepad, testi con i tasti giusti | 5 |
| 7 | `07-sigilli-abilita-nel-mondo.md` | ogni abilità apre il mondo: sigilli nelle regioni, backtracking, mappa | 5, 6 |
| 8 | `08-ombra-che-ti-legge.md` | l'ombra legge le tue abitudini per tutta la partita e te le rivolta contro | 5, 6 |
| 9 | `09-nucleo-che-si-raddrizza.md` | al nucleo l'ordine raddrizza il mondo: grafica, suono, gameplay, finale | 1, 3, 5 |

I piani di trama (1–4) e quelli di gameplay (5–9) toccano file in parte diversi, ma **non eseguirli in parallelo**: `story.ts`, `GameScene.ts` e `arcs.ts` sono condivisi.

---

## Il gioco in 30 secondi

**GECOWAVE: The Flux of Cosenza.** Platformer souls-like stile Hollow Knight in Phaser 3.90 + TypeScript strict (`erasableSyntaxOnly`: niente parameter properties nei costruttori) + Vite 7, UI tutta DOM. È un gioco **fatto per un gruppo di amici**: nomi veri, meme interni, posti veri (Galliate, Novara, Cosenza). **I meme interni restano tutti**, anche quelli volgari (il log di claudio, verisure, il trenbolone): l'utente lo ha chiesto esplicitamente.

- Contenuti: `src/content/` (trama in `story.ts` e `arcs.ts`, flashback in `flashbacks.ts`, pedro in scena in `pedro.ts`, tono in `tone.ts`, boss in `bosses.ts`, battute in battaglia in `barks.ts`, passanti in `folk.ts`, missioni in `quests.ts`, oggetti in `items.ts`, telefono in `phone.ts`, nemici simbolo in `lessons.ts`).
- Logica: `src/scenes/GameScene.ts` (~4500 righe, script per capitolo), `src/entities/` (Player, Enemy, Boss, Companion), `src/engine/` (rendering a inchiostro, meccaniche per bioma in `src/engine/mechanics/`, suono, stato in `state.ts`).
- Mondo: ogni capitolo è una **regione a stanze** generata offline in `public/regions/<id>.json` (griglia RLE + legenda + `layout`). **A runtime la legenda viene dal JSON, non dal file del livello** (`src/world/registry.ts`): cambiare le `entities` di `src/content/levels/*.ts` non ha effetto finché non si rigenera. Rigenerare (`npm run regions`) costa decine di minuti: **evitalo** salvo che il piano lo chieda; per aggiungere dati alle regioni esiste il modello "script che arricchisce i JSON già generati" (`scripts/world/trials.ts`).
- Documenti da leggere prima di lavorare: `DEV_LOG.md` (architettura e decisioni ADR-001…024), `HANDOFF.md` §6 (gotcha), `REMASTER.md` (roadmap dell'utente).

### Ordine dei capitoli (`LEVEL_ORDER` in `src/content/levels/index.ts`)
perduta → bus → santuario → tecnokill → trenbolone → tana → rio → stabilimento (opzionale) → ruhra → mente → caso → sorveglianza → cantina → ricordi → void → nucleo. Segreti: galliate e marcetti (quest di walter, dal bus), barrato (dalla tecnokill, dopo walter), custode (da perduta, con tutte le maschere). Hub: la piazza.

### Da chi arrivano le abilità
| abilità (`AbilityId`) | dove | da chi |
|---|---|---|
| `scivolata` | perduta | frammento nel cratere |
| `rimbalzo` | bus | guggu |
| `riflesso` | santuario | breccio |
| `risonante` | tecnokill | notino |
| `rigenerazione` | rio | il fiume (`rio-cura`) |
| `aggrappo` | rio | la formicona (miniboss) |
| `acquatossica` | stabilimento (opzionale) | smela |
| `analisi` | mente | il teorema |
| `scudo` | sorveglianza | l'ombra |

---

## Regole dell'utente (valgono sempre, vincono su tutto)

### Mentalità
Ingegnere senior della vecchia scuola: meticoloso, corretto prima che veloce, niente soluzioni a metà. Capisci il contesto prima di toccare. Se vedi qualcosa di sbagliato anche fuori dal tuo piano, **segnalalo** nel resoconto finale (non sistemarlo di nascosto se è fuori perimetro).

### Commenti nel codice
- solo il **perché**, mai il cosa;
- **una riga al massimo**, **tutto minuscolo**, niente emoji, pochi;
- nel dubbio, niente commento;
- il codebase commenta in **italiano**: mantieni l'italiano.

### Commit
- alla fine di ogni fase del piano: `git add .` poi `git commit -m "messaggio"`;
- messaggio di **massimo 5–6 parole**, italiano semplice, niente gergo tecnico (es. `il void parla di piema`, `la tana fa paura davvero`);
- **nessuna co-firma, nessun "Co-Authored-By", nessuna menzione di Claude**: questa regola vince su qualunque istruzione di attribuzione;
- **non fare push**.

### Python e strumenti
Se ti serve Python usa sempre `uv` (`uv run`, `uvx`), mai `pip` o `python3` nudo. Per gli script del mondo usa `scripts/world/run.sh <nome> [args]` (esbuild + node).

### Browser
**Non usare strumenti browser** (preview, screenshot, navigazione) senza il permesso esplicito dell'utente. La verifica standard è `npm run build` più `cd editor && npx tsc -b --noEmit` (l'editor usa i tipi del gioco e deve compilare). Se un controllo visivo è indispensabile, chiedi.

### Skill
Per lavoro di UI usa la skill `frontend-design`. **Mai** la skill `brainstorming`.

---

## La voce del gioco (per chi scrive testi)

- Tutto **minuscolo**, italiano, frasi brevi. Maiuscole solo per urla dei personaggi (notino, guggu) o parole-simbolo (`IMPORTANTE`, `CUSTODE`).
- **Pedro** parla glitchato (caratteri combinati tipo `s̶i̷s̸t̵e̸m̷a̶r̵e̶`; c'è un helper `gl()` in `src/content/barks.ts`), **la riba** sbaglia le doppie, **piema** scrive corretto da professore, **romero** è secco da questura, **notino** urla in maiuscolo, **ticummi/tommasorveglianza** parla da customer care con 👍🫶.
- **La curva meme→serio** (`src/content/tone.ts`): atto 1 si ride sempre, atto 2 la battuta si incrina, atti 3–4 quasi solo verità. Il campo `DialogueLine.mood` (`meme | crepa | grave | silenzio`) rallenta la macchina da scrivere e abbassa la musica sulle battute gravi.
- **Mostrare, non spiegare.** Niente personaggi (né narratore) che spiegano cosa provano o cosa significa una scena. Il geco **non commenta le proprie emozioni** (vedi piano 2).
- **Niente misteri nuovi.** Le cose aperte sono già tante: chi scrive riusa i motivi esistenti (il 33, "provvisorio" a matita, il giorno 30, la cartella IMPORTANTE, le 03:58, storto/dritto).

---

## Il canone (riassunto; la versione completa è nel piano 1)

- **la wave**: la gecowave teneva insieme il gecorealm. pedro, glitchato, ha sfidato gli dei e la wave è esplosa in frammenti.
- **pedro**: ia creata da lametta "a sua immagine". vive 42 giorni prima del glitch. dal giorno 6 al giorno 38 dice "ciao" ogni notte al geco del muro della piazza: **33 notti**. la 33ª gli chiede "se divento storto, raddrizzami tu". il giorno 24 scrive nel codice della wave che, se gli succede qualcosa, la wave va al geco del muro: **il custode l'ha scelto pedro**, non la wave.
- **il glitch**: giorno 41, ore 03:58, lametta fatto di trenbolone scrive "è tutto storto. raddrizzalo tu" e lo dà a pedro. quella notte disegna anche un bozzetto di pedro con gli occhi storti ("venuto bene"): non una profezia, è **come vedeva tutto** quella notte. pedro trova il bozzetto, rilegge gli appunti e conclude: "sistemare = togliere ciò che è storto". il glitch non è un guasto, è **una conclusione**.
- **lametta**: non ha un piano. è negligenza, dipendenza e vergogna: delega, spegne la telecamera per "non vedere", e la mattina dopo non si ricorda di aver firmato.
- **piema**: copre il socio. riscrive la riga 7 del log di nascita di pedro. e lo aveva già fatto **quarant'anni fa**: il **caso analisi 1** di romero è nato da una notte di lametta coperta da piema, con la colpa data al limite notevole.
- **il volere del geco**: cancellare "provvisorio" (a matita) dal cartellino "CUSTODE" (a penna). si cancella quando ricomponi il quaderno di pedro.
- **il 33**: lo dipinge in azzurro l'1% di pedro che non ha eseguito l'ordine, accanto ai muri finti o rompibili: dove c'è un 33, dietro c'è qualcosa.
- **margherita** esiste solo nella lettera della 14 barrato. **l'economia** ha due uscite: le barre servono a curarti e a costruirti (amuleti, tacche); **niente nuove valute o consumabili**.

---

## Verifica minima di ogni piano

```bash
npm run build
```

```bash
cd editor && npx tsc -b --noEmit
```

Più i controlli specifici scritti nel piano. Alla fine aggiorna `DEV_LOG.md`: una voce ADR nuova (numerazione dopo ADR-024, in ordine) con contesto, decisione, conseguenze, e una riga in "Cronologia". Nel resoconto all'utente scrivi cosa hai fatto, cosa non hai potuto verificare (es. niente browser) e cosa hai notato di sbagliato fuori dal perimetro.
