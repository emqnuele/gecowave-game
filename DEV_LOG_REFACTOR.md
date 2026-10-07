# DEV LOG — refactor di GameScene

Diario tecnico del refactor (fase 2 di `PIANO_REFACTOR.md`). Serve a chi riprende il lavoro in una sessione nuova: cosa è fatto, come, perché, cosa resta. Il prompt originale è `PROMPT_REFACTOR.md`; le decisioni di architettura vanno anche nel `DEV_LOG.md` come ADR (ADR-050 per l'harness).

Branch: `refactor`, tagliato da `main` al commit `a16f39c` (remaster mergiato + harness + sprite nuovo del geco). Riferimento: worktree `../gecowave-main` allo stesso commit.

---

## dove trovare le cose

| cosa | dove |
|---|---|
| runner, sonda, corpus, diff, copertura, mutazioni, prestazioni | `scripts/harness/` (README con comandi e trappole) |
| scenari | `scripts/harness/scenarios/*.mjs` |
| dati degli scenari | `scripts/harness/data/` (tappe, nastri, salvataggi d'ingresso dei capitoli, partite registrate) |
| hash del riferimento di main | `scripts/harness/reference.json` |
| tracce complete, copertura grezza, report | `.harness/` (ignorata da git, si rigenera) |
| copertura (punti ciechi) | `docs/refactor/copertura.md` |
| mutazioni di prova | `docs/refactor/mutazioni.md` |
| prestazioni | `docs/refactor/prestazioni.md`, `scripts/harness/perf-base.json` |
| registro membro per membro | `docs/refactor/ledger.md` |
| bug trovati per strada (da non sistemare nei commit di refactor) | `docs/refactor/bug-trovati.md` |
| riferimenti rigenerati e perché | `docs/refactor/riferimenti.md` |

## preparare la macchina (sessione nuova)

```bash
cd gecowave-game
git worktree list                          # deve esserci ../gecowave-main su a16f39c
# se manca:
git worktree add ../gecowave-main a16f39c && ln -s ../gecowave-game/node_modules ../gecowave-main/node_modules
scripts/harness/build.sh ../gecowave-main  # build di riferimento
scripts/harness/build.sh                   # build corrente
node scripts/harness/corpus.mjs ref        # solo se .harness/traces/ref manca: rigenera le tracce di main (gli hash devono tornare uguali a reference.json)
```

---

## diario

### 2026-10-07 — parte A: gli strumenti

**Branch e riferimento.** `refactor` da `main` a16f39c. Il tag `v2-pre-refactor` del piano non esiste ancora (è di Ema). Worktree di main in `../gecowave-main`.

**Sonda e tracce** (`probe.js`, `runner.mjs`). La sonda si inietta prima del gioco e trova le cose per forma (il geco è l'oggetto con `attackHitbox` e `cooldowns()`, le entità sono gli oggetti di classi es6), mai per campo privato della scena: così resta valida quando la logica esce da `GameScene`. Sezioni strette (devono coincidere al bit): meta, geco, boss, entità, display list come multiinsieme, ordine di disegno a parità di profondità, corpi, luci, camera, stato di run, salvataggio, dom della ui, musica e acustica, eventi del bus e di scena, suoni, localStorage, console. Diagnostica a parte: tween, timer, collider, ascoltatori di bus, scena e scale (avvisa prima, non è comportamento). Ogni evento e suono porta la riga del bundle che l'ha emesso: il diff la riporta al `.ts` con la sourcemap.

**Build per l'harness** (`build.sh`): `NODE_ENV=development`, `--sourcemap`, `--minify false`. Niente minify per avere nomi delle classi e stack leggibili; il codice del gioco non dipende dai nomi (verificato con grep).

**Diff** (`tracediff.mjs`): primo fotogramma diverso, sezioni, campo per campo prima/dopo, righe `.ts` di chi ha emesso cosa, eventi poco prima. Per display list, entità, corpi e luci la traccia tiene solo l'hash: `corpus.mjs check` rilancia da solo le due build con le impronte complete attorno alla divergenza. Provato con una luce cambiata a mano: trovata al fotogramma 1 con le 8 luci diverse.

**Bot e scenari.** Il bot (`bot.mjs`) segue le tappe del geco simulato (`data/waypoints.json`, generato in 4 minuti), si teletrasporta tra le tappe ma parla, raccoglie e combatte coi tasti veri, legge la ui (dialoghi, scelte per titolo, carte, riepiloghi, film). La campagna intera arriva al finale "consegna" in circa 96 mila fotogrammi. Al passaggio scrive il salvataggio d'ingresso di ogni capitolo (`SAVE_CHAPTERS=1`), che gli altri scenari usano per partire a metà gioco con un salvataggio vero (solo campi del formato di salvataggio). I nastri (`scripts/world/tapes.ts`) sono sequenze di tasti trovate dal geco simulato dallo spawn alla stanza più avanti nel percorso: il geco vero li segue per centinaia di fotogrammi, poi si stacca quando lo colpisce un nemico che il simulato non conosce (va bene: conta che si muova coi tasti).

**Non determinismi trovati e chiusi** (tutti dell'harness, nessuno del gioco):
- il ritmo 17/17/16 ms passato al loop faceva oscillare la media mobile del delta di phaser: la fisica arcade saltava un passo ogni tre fotogrammi e ne faceva due dopo. Ora il loop riceve 16,67 ms costanti (un passo doppio ogni ~80 s, come un monitor vero), l'orologio dei timer resta a millisecondi interi;
- `clock.install` + `pauseAt` sotto carico falliva ("fast-forward to the past"); ora l'install è 5 s prima e dopo il caricamento tick e data si fissano a valori esatti, perché il `requestAnimationFrame` finto cade a `16 - tick % 16` (la musica che rallenta alla morte usa rAF e differiva di un fotogramma tra due giri);
- animazioni e transizioni css vanno in tempo reale: il telefono calcola l'origine dell'app dall'icona a metà animazione. Nell'harness arrivano subito alla fine (le animazioni web via `animate()` invece le guida l'orologio finto: servono ai riepiloghi);
- le immagini `data:` nella ui sono foto del canvas (pixel della gpu): si confronta che ci siano, non il contenuto.

**Velocità.** Da ~200 ms a ~8 ms per fotogramma: in pagina un solo viaggio cdp per centinaia di fotogrammi; la sonda non serializza mai grafi interi (un payload con una scena pesava 250 MB); l'orologio di playwright cedeva con un `setTimeout(0)` vero da 4 ms dopo ogni timer (sostituito da un `MessageChannel`); il disegno webgl si fa un fotogramma su quattro (il processo gpu di chromium era il collo di bottiglia, e il disegno non entra mai nella logica: `camera.preRender` resta a ogni fotogramma, e gli hash sono rimasti identici togliendolo); impronte numeriche dei campi invece di hash carattere per carattere. In parallelo conviene stare a 3-4 job: oltre si finisce sui core di efficienza.

**Bug annotati** in `docs/refactor/bug-trovati.md`.

### 2026-10-07 (pomeriggio) — copertura e scenari per i punti ciechi

**Prima raccolta completa** (130 scenari, 75 minuti a 4 job): righe di `src/` 94%, funzioni 93,7%; dai rami enumerati con l'ast, `GameScene.ts` 1270/1618 bracci e 510/559 funzioni, `entities/` e `engine/` quasi tutti sopra il 90%. Il report è `docs/refactor/copertura.md`.

**Problemi del bot visti nella raccolta e sistemati:**
- nel caso il bot entrava nell'arena del limite con due indizi su tre: boss invulnerabile, arena chiusa, morte, e mai più ritorno all'indizio mancante (70 mila fotogrammi). Ora, se un boss resta invulnerabile, il bot ripassa da tutte le tappe di trama prima di riprovarlo, come farebbe un giocatore;
- nei capitoli segreti e contro gli dei il bot moriva all'infinito (fino a 268 mila fotogrammi). Ora dopo due morti contro lo stesso boss si arrende (e dopo due rese non combatte più in quel capitolo), e gli scenari che devono vincere (`finale-dei`, `cap-walter`, `cap-custode`, `cap-barrato`) partono con forza e cuori alti: sono campi del salvataggio.

**Scenari nuovi** per i rami mancanti: `npc.mjs` (ogni npc negli stati che la campagna non incontra: spaccino a dose presa o dopo il flauto, acqua bevuta due volte, walter prima e dopo, piema senza dispositivo, la piazza in tre momenti...), `combat.mjs` (rimando perfetto e normale contro i tiratori, schianto dall'alto, tutte le wave addosso ai boss, l'ombra che legge ogni abitudine in premium e beta, uscite chiuse dalla trama, boss senza farsi toccare, doomsday senza boss e col sollievo, agguato col geco che ha preso lo sparacchino), `saves.mjs` (salvataggio vecchio in localStorage prima del boot con ogni migrazione di `state.ts`, salvataggio con microfono acceso e comandi rimappati, salvataggio corrotto, finestra ridimensionata), `extra.mjs` (sigilli delle wave, nidi, armadi della tana, freccia guida, gamepad finto). Il runner ora accetta `storage` (localStorage prima del boot) e `viewport` per scenario.

**Giro rapido** (`tiers.mjs`): dalla copertura per scenario, una copertura di insiemi greedy sceglie il sottoinsieme che esegue il 97% dei punti (rami e funzioni) col minor numero di fotogrammi. `corpus.mjs check --tier rapido` lo fa girare: è il controllo da fare a ogni micro-passo della parte B; il corpus intero prima di ogni commit.

**Contratto implicito della scena** trovato leggendo: `FlashbackManager` usa per duck typing `vignette`, `setPropsVisible` e `findFlatStage`; `Player` usa `cloneAlive`. Annotato in `docs/refactor/mappa-sistemi.md`, insieme all'ordine di `update()` e alla bozza dei 12 sistemi.
