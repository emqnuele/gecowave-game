# HANDOFF — GECOWAVE remaster

Questo documento serve all'agente AI che continua il lavoro. Non sai nulla della conversazione precedente: qui c'è tutto. Leggi anche `REMASTER.md` (la roadmap, che l'utente ha arricchito di suo pugno) e `README.md` (com'è fatto il gioco originale).

- Repo: `/Users/ema/Projects/geco-game/gecowave-game-v2-fable`
- Branch di lavoro: **`remaster`**, locale. Si stacca da `main`, ha remote `origin` = `git@github.com:emqnuele/gecowave-game`. **Non fare push** se l'utente non lo chiede.
- Commit del remaster finora:
  - `fc58286` nuovo motore grafico a biomi (Fase 1)
  - `39835fa` smartphone zaino e amuleti (Fase 2)
  - `7e9a707` generatore di regioni enormi (Fase 3a, solo generatore: **non ancora collegato al gioco**)

---

## 1. Le istruzioni dell'utente (testuali o quasi)

### Prompt iniziale (verbatim)
> analizza questo gioco e aiutami a portare grossi aggiornamenti al gioco, drastici:
>
> custom artifacts, scenografia, background migliori, parallax, hollow knight levels graphics, better story, better gameplay, better game mecanichs. more stuff to do, inventory, items, a working smartphone like gta, and in general take this "idea" of a game and make it the next hollow knight. with a gta-like, souls like hollow knight game experience. expand heavily the game, etc... better maps (the current one sucks, sucks a LOT. they are so bad. so so so bad. and short, and "simple" with the same textures, blocks, and crops. i want everything custom eveyrthing)
>
> its a giant rebuild/remaster and you need to work on it.
>
> analyze the repo and start working on it on a separate branch

### Messaggi successivi
- «the graphics style: keep it. but implement on it.» → **lo stile a inchiostro/tratteggio dei dipinti resta**, ci si costruisce sopra.
- Scelta del mondo: **regioni interconnesse**. Ogni capitolo diventa una regione di stanze collegate, con un hub centrale e i bus come "stagways" tra regioni.
- Browser: «puoi usare il browser, ma poco! il browser consuma molti limiti e ti fa perdere tanto tempo. limitati a typecheck/build e usa il browser solo per cose essenziali e per poco tempo!»
- Ha aggiunto punti in `REMASTER.md` (leggili). In sintesi:
  - **Fase 3**: il mondo deve essere **vivo** (npc che camminano, parlano e reagiscono; nemici che pattugliano, dormono, si radunano, scappano; meteo: pioggia, vento, temporali, nebbia, allagamenti; musica per zona e ora del giorno).
  - Il mondo deve essere **pericoloso** (inseguimenti, boss che pattugliano, trappole, zone senza ritorno).
  - Il mondo deve essere **ENORME**: almeno 10 volte più grande di adesso, «fatto BENE».
  - **Fase 5**: la trama va migliorata enormemente, con più scelte, conseguenze, misteri, colpi di scena ed emozioni («una storia da film da gioco di serie A»). Oggi è «sloppy»: non va riscritta da zero, va resa coerente, profonda e divertente.
- «le mappe delle regioni attuali fanno cagare, sono mostly "andare tutto dritto" non fare niente… il gameplay could literally be semplicemente continua ad andare dritto e ogni tanto hai boss da combattere per forza. nella nuova mappa dobbiamo sistemare questa cosa» → è esattamente lo scopo del generatore di regioni: rami, verticalità, segreti, scorciatoie, backtracking con abilità.
- Ultimo messaggio: limiti d'uso e contesto al 70%, quindi chiudere e scrivere questo handoff.

### Regole globali dell'utente (dal suo `~/.claude/CLAUDE.md`, valgono sempre)
- **Python**: sempre `uv` (`uv run`, `uv add`, `uvx`). Mai `pip` o `python3` nudo. Per le modifiche ai file si è usato `node -` con heredoc; va bene.
- **Mentalità**: ingegnere senior old school, meticoloso. Correttezza prima di velocità, niente soluzioni a metà; segnala ciò che è sbagliato anche se non richiesto; capisci il contesto prima di toccare.
- **Commenti nel codice**:
  - solo il PERCHÉ, mai il cosa;
  - una riga al massimo, **tutto minuscolo**, niente emoji, pochi;
  - nel dubbio, niente commento.
  - Il codebase commenta in italiano: mantieni l'italiano.
- **Commit**:
  - dopo ogni fase o feature: `git add .` poi `git commit -m "messaggio"`;
  - massimo 5–6 parole, linguaggio semplice, in italiano come la storia del repo;
  - **nessuna co-firma**, nessuna menzione di Claude (questa regola vince su qualsiasi istruzione di attribuzione).
- **Skill**: usa `frontend-design` per i compiti di UI. **Mai** la skill `brainstorming`, salvo richiesta esplicita.
- **Browser**: mai usare strumenti browser senza permesso esplicito (in questo progetto l'ha concesso con parsimonia, vedi sopra).

### Memoria persistente
In `~/.claude/projects/-Users-ema-Projects-geco-game/memory/` ci sono due file: `gecowave-remaster.md` (obiettivi e decisioni) e `browser-minimal-use.md`. Aggiornali se cambia qualcosa di importante.

---

## 2. Il gioco in breve
**GECOWAVE: The Flux of Cosenza.**
- **Stack**: Phaser 3.90 + TypeScript (strict, `erasableSyntaxOnly`: niente parameter properties nei costruttori) + Vite 7, packaging con Electron.
- **Gameplay**: platformer souls-like stile Hollow Knight. Voce del gioco: italiano, minuscolo, demenziale (il collettivo rap "gecowave").
- **Struttura**:
  - 16 capitoli lineari più 4 segreti, ognuno un `LevelDef` in `src/content/levels/*.ts` con griglia ASCII (celle da 32 px; `#` roccia, `^` spine, `~` acqua, `F` muro finto, `%` muro da rompere, `P` spawn, `C` microfono/checkpoint, `X` uscita, altre lettere = entità della legenda);
  - trama in `src/content/story.ts`;
  - logica in `src/scenes/GameScene.ts` (~3000 righe, script per capitolo);
  - UI interamente DOM in stile "Acid Glass" (`design_system.md`, `src/style.css`, `src/ui/`).
- **Editor di livelli dev**: `editor/` (React + Vite separato). Usa i tipi del gioco, quindi **va tenuto compilabile**: `cd editor && npx tsc -b --noEmit`.
- **Comandi**: `npm run dev` (vite su :5173; spesso l'utente ha già un dev server aperto su 5173), `npm run build` (tsc + vite build). La verifica standard è **`npm run build`**.

### Trucchi di sviluppo aggiunti
- `http://localhost:5173/?level=<id>` salta menu e intro e parte dal capitolo (solo in dev). Implementato in `src/main.ts`.
- `window.__game` espone l'istanza Phaser (solo in dev).
- God mode: in console `toggleGecoMode('gecowave-flux-resonance-992173')`.
- Log in dev: `[terrain] <id>: Nms`.
- **Browser pane nascosto**: il canvas ha dimensione 0 (errore WebGL "Framebuffer incomplete") e rAF si ferma. Per uno screenshot:
  1. `resize_window` 1280×720;
  2. `navigate`;
  3. avanza il loop a mano con `javascript_tool`: `let t=performance.now(); for(i<60) { t+=16.6; __game.step(t,16.6) }`;
  4. fai lo screenshot;
  5. `resize_window preset desktop` a fine test.

  La config del preview sta in `/Users/ema/Projects/geco-game/.claude/launch.json` (nome "game"), ma se la porta 5173 è già occupata dal server dell'utente basta usare quello.

---

## 3. Lavoro fatto

### Fase 1 — motore visivo (committata, funzionante, verificata con screenshot)
Il tilemap resta **invisibile, solo per le collisioni**; tutta la grafica è nuova, procedurale, a inchiostro.

| file | cosa fa |
|---|---|
| `src/content/biomes.ts` | `BiomeDef` per capitolo (`LEVEL_BIOME`): materiale, palette (rock/deep/rim/ink/accent), vestizione superfici e soffitti, skyline, ambienza, props, spine, luce ambiente, raggi di luce, primo piano, `indoor`. `biomeFor(def)`; `LevelDef.biome?` può forzarlo |
| `src/engine/art/ink.ts` | toolkit: rng `mulberry32`, `hashString`, colori `hex/mix/shade`, `wobble`, `inkLine/inkShape`, `hatch/crossHatch`, `stipple`, `glowSpot`, `chaikinClosed`, rumore 1d/2d |
| `src/engine/art/materials.ts` | pattern tileabili 256×256 per materiale (stone, brick, roots, metal, crystal, circuit, mud, concrete, void) |
| `src/engine/TerrainRenderer.ts` | traccia i contorni dei solidi (bordi orientati, cornice di padding), li sporca con il rumore e li arrotonda con Chaikin; dipinge chunk 512 px: interno scuro, banda di materiale sul bordo, tratteggio, luce sul pavimento, inchiostro, vestizione. Chunk interni = rettangoli scuri, chunk vuoti saltati. Muri finti `F` come overlay a depth 5 che si dissolve entrando (`updateReveal`). Texture liberate allo SHUTDOWN. **Oggi dipinge tutti i chunk al build** (~150 ms per i livelli vecchi) |
| `src/engine/art/dressing.ts` | erba, muschio, cristalli, macerie, canne, libri, cenere, glitch, sabbia, bottiglie, cavi (catenarie), radici, stalattiti, catene, liane, gocce, ragnatele, muschio e liane sui muri |
| `src/engine/art/props.ts` | 29 props a inchiostro per bioma (lanterna, lapide, statua del geco, rack server, fermata del bus, tv…), alcuni con luce, i "backdrop" scuri dietro il terreno. `propArt(b, kind, variant)` con id stabile |
| `src/engine/DecorationManager.ts` | piazza i props sui pavimenti piatti, evitando le entità |
| `src/engine/art/silhouettes.ts` | 3 piani di skyline per motivo con prospettiva atmosferica, più strisce di primo piano sfocate (alto e basso) |
| `src/engine/ParallaxManager.ts` | cielo a gradiente, dipinto del capitolo (bg dell'utente, **tenuto**), velo di foschia, 3 piani, nebbia, primo piano. Ancoraggio verticale a "fondo livello" (da cambiare per le regioni, vedi §5) |
| `src/engine/AmbienceManager.ts` | particelle per bioma che seguono la camera ma vivono nel mondo; raggi di luce (shaft) |
| `src/engine/WaterRenderer.ts` | vasche d'acqua con corpo sfumato, superficie animata, luce |
| `src/engine/art/blocks.ts` | spine e muri rompibili per bioma |
| `src/engine/LightingManager.ts` | `enable(biome)`, `prop()` luci dei props |
| `src/scenes/BootScene.ts` | `props.png` e `ruins_columns.png` non vengono più caricati (gli asset restano su disco; `props.png` aveva rettangoli bianchi cotti dentro) |

### Fase 2 — smartphone, inventario, amuleti (committata, verificata con screenshot)
- `src/content/items.ts`:
  - `ITEMS`: consumabili, amuleti con `cost` in tacche, potenziamento `tacca`, oggetti chiave derivati dai flag;
  - `charmMods()`, `BOSS_CHARMS` (amuleto lasciato da ogni boss), `NOTCH_PRICES`, `STARTING_ITEMS`.
- `src/engine/state.ts`:
  - `SaveData` estesa: `inventory`, `charms`, `equipped`, `notches`, `messages`, `record` (morti, uccisioni, boss, tempo), `radio`. La migrazione dei vecchi salvataggi è fatta per spread;
  - `state.mods` in cache; `toggleCharm` funziona solo con `run.nearMic`;
  - `run.caffeMs`, `run.santino`.
- `src/engine/inventory.ts`: `useItem`, `quickHeal` (tasto **C**).
- `src/entities/Player.ts`: applica i modificatori (velocità, danno via `state.damageMult`, portata, cooldown, costo delle abilità, cura, flow, santino, danno subito, rigenerazione del flow).
- `GameScene`:
  - entità `{type:'item', item, amount?}` raccolta una volta sola (chiave in `collectedLore`);
  - drop degli amuleti dai boss; magnete delle barre; moltiplicatore delle barre;
  - record di partita; `nearMic` entro 110 px da un microfono.
- `src/ui/phone.ts` + `phone.css`: telefono "wavesung galaxy". **TAB/P** lo apre e mette in pausa, ESC/Backspace torna indietro. App:
  - messaggi: chat con storico delle wavesung + rubrica con **chiamate contestuali** (suggerimenti);
  - wavegram: feed sbloccato dai flag;
  - mappa: grafo dei capitoli;
  - zaino;
  - amuleti: tacche, indossabili solo al microfono;
  - wavezon: negozio;
  - diario: obiettivo del capitolo + quest secondarie;
  - radio: tutte le 22 tracce, `music.setRadio`;
  - profilo; impostazioni.
- Contenuti delle app in `src/content/phone.ts` (`OBJECTIVES`, `CONTACTS`, `POSTS`, `RADIO`).
- `src/ui/screens.ts`: card "amuleto trovato" su `charm-found`; comandi aggiornati.
- `editor/src/lib/catalog.ts` e `serialize.ts` supportano il tipo `item`.

### Fase 3a — generatore di regioni (committato, collegato al gioco in `da60103`)
Cartella `src/world/` (pura TS, niente Phaser: gira in Node):

| file | ruolo |
|---|---|
| `types.ts` | `Rect`, `Room` (slot sx/sy/sw/sh, rect in celle, kind, pathIndex, anchor, surface), `Door` (axis h/v, x, y, len, kind open/fake/breakable/drop), `RegionLayout`, `Moves` |
| `grid.ts` | `Grid`: `get/set/force/solid/open/empty/standable`, **blocchi** `lock/lockedAir/lockedSolid` (`set` rispetta i blocchi, `force` no), DSL `carve/carveBlob/platform/spikes`, `toStrings` |
| `moves.ts` | modello del geco: cella in piedi `(c,r)` con corpo r-1..r e piedi su r+1. `BASIC {rise:3,run:5}`, `DASH {3,7}`, `FULL {5,8}`. `neighbors` (salti/camminate con `arcClear`, apice = quota d'arrivo; cadute con deriva), `analyze` (BFS in avanti dallo spawn + all'indietro dall'uscita: `reached` e `finishes`), `nearestStand` |
| `layout.ts` | `buildMacro`: macro-griglia di slot; percorso critico che preme verso destra con salite e discese, arene (forme 2×1/3×1/2×2), stanze di riposo; **rami laterali** che finiscono in stanze `secret` (primo varco a volte `fake`/`breakable`); **scorciatoie** `breakable` tra stanze del percorso lontane ma confinanti; porte `drop` a senso unico (14% delle discese) |
| `rooms.ts` | `carveRoom` per tipo (hall/rest/start/exit con profilo a gradini e pozzi di spine, gauntlet, pool con acqua, shaft a sporgenze alternate, cave a blob più gallerie, arena, secret). `planDoor` e `applyDoors`: prima tutta l'aria, poi i pavimenti non in aria, poi i muri speciali, infine **blocca** le celle dei varchi |
| `beats.ts` | `extractBeats(def)`: dai vecchi livelli estrae le entità in ordine di x con ruolo (story, boss, arena, secret, loot, enemy, door, chase, companion) e il pool dei nemici |
| `region.ts` | orchestratore, vedi sotto |

**Pipeline** (`generateRegion(def, maxAttempts=40)` chiama `attemptRegion(def, attempt)` e tiene il migliore per punteggio):
1. Bioma, beat, mosse del percorso (`movesFor`: perduta BASIC, bus DASH, il resto FULL).
2. Dimensioni:
   - slot fissi **46×26 celle** (`SLOT_W/H`);
   - `macroH` 7 (8 se indoor);
   - `pathLength` = clamp(max(baseW·1.6, arene·3+10), 18, 34);
   - `macroW` = max(baseW, pathLength·0.62), allargato di 2 in 2 se il layout fallisce;
   - rami = metà del percorso.
3. Beat del percorso mappati sull'indice proporzionale alla vecchia x. Boss e arene vanno in stanze arena distinte, mai adiacenti; il resto della trama esce dalle arene. Stanze di riposo ogni 4 indici e prima di ogni arena.
4. Griglia tutta roccia, poi `applyDoors`.
5. **`buildSkeletons`**, la chiave della connettività. In ogni stanza:
   - un **tronco** a due corsie sfalsate di 5 celle, a passi pieni, dal fondo fino alla porta più alta. La colonna del tronco è scelta da `trunkOk` per non nascere sopra un buco né scontrarsi con i blocchi;
   - poi un **ramo** verso ogni porta, provando come base tutti i punti del tronco;
   - ogni ramo è un `dig(..., mustWork=true)` verificato con **`pessimisticReach`**, che conta solo le celle bloccate più il bordo della stanza, perché lo scavo successivo può togliere qualsiasi roccia libera;
   - tutto ciò che lo scheletro scava o posa viene **bloccato**;
   - le stanze laterali di perduta e bus sono a volte "gated" (gradini da 5, servono il doppio salto, quindi backtracking), ma solo se non ci si cade dentro.
6. `carveRoom` per ogni stanza (rispetta i blocchi: non rompe lo scheletro).
7. Obiettivi (pianerottoli dei varchi + centro di ogni stanza) e `repair`: giri di `analyze` più `dig` con `protect=reached`; poi riparazione dei vicoli ciechi (celle `reached && !finishes`), prima con le mosse del percorso, poi con FULL.
8. Piazzamenti **solo su celle raggiungibili**:
   - `P`, `X` (3 celle in colonna);
   - `C` nelle stanze di riposo;
   - beat del percorso distribuiti nella stanza; le porte della mente (`porta-teorema`) dentro un varco orizzontale del percorso;
   - segreti (cuori, maschere, portali, oggetti, boss opzionali) nei rami;
   - loot del vecchio livello e ricompense extra (`SIDE_REWARDS`; una `tacca` per regione in `NOTCH_REGIONS`);
   - nemici per stanza (densità per tipo, area, avanzamento; i volanti a mezz'aria; mai in start/rest/arena/exit).

   Le nuove lettere della legenda vengono da `LETTER_POOL`.
9. Report finale (`exitReached`, `lostBeats`, `stuck`, `stuckFull`), poi scrittura delle lettere con `force`. `layout` include `rooms`, `doors`, `pathLength`, `horizonRow` (pavimento medio in superficie) e `oldXToProgress` (interpolazione vecchia x → progresso sul percorso, per gli agguati).
10. `GEN_DEBUG`: `skipCarve`, `skipRepair`, `trace(g, room, label)`, `onSkeletonFail`.

**Stato attuale** (`scripts/world/run.sh report all 1`): tutte le 20 regioni escono pulite **al primo tentativo**: uscita raggiungibile, nessun beat perso, `stuck` e `stuckFull` a 0. Superficie camminabile (posizioni in piedi raggiungibili, `scripts/world/run.sh sizes`): **10.1× il gioco vecchio** in totale, da 5.7× (santuario) a 41× (barrato).

**Strumenti offline** (in `scripts/world/`, si lanciano con `scripts/world/run.sh <nome> [args]`, che usa esbuild + node; nessuna dipendenza nuova):
- `report [id|all] [tentativi]`: report per regione;
- `first-break <id>`: prima stanza del percorso non raggiunta e mappa ASCII attorno alla porta (`o` = raggiunto). Env `NOCARVE=1`, `NOREPAIR=1`;
- `rooms-reach <id> <i>`: celle raggiunte per stanza più stampa della stanza i del percorso;
- `zoom <id> x0 x1 y0 y1 [c r]`: zoom con coordinate (start = `P` se non dato);
- `trace <id> <roomId> x0 x1 y0 y1`: griglia della stanza dopo il tronco e dopo ogni ramo;
- `skeleton-check <id>`: verifica pessimistica dello scheletro; nella stampa `#` = roccia bloccata, `+` = roccia libera, `.` = aria bloccata, spazio = aria libera;
- `dig-test`: test unitario di `dig` in una stanza vuota.

### Lezioni imparate sul generatore (non ripetere gli errori)
- Le scale scavate dentro stanze già scavate si tappano a vicenda. Soluzione: **prima lo scheletro nella roccia piena, bloccato; poi lo stile della stanza**.
- Un pavimento non bloccato è roccia naturale che lo scavo dopo cancellerà: la verifica deve essere **pessimistica**.
- Gradini a 2 righe di distanza non lasciano spazio alla testa (il geco è alto quasi 2 celle). Usa corsie sfalsate di 5 colonne e passi pieni (3 righe); mai un passo corto che cambia corsia finendo sopra il gradino precedente.
- La mensola sotto un buco nel soffitto va a `by+2` con aria in `by..by+1` e ai lati in `by+2..by+4`: niente zone d'aria bloccata più grandi, o le scale non possono posarsi.
- I pozzi (shaft) con mensole a tutta larghezza distanti 3 righe sono invalicabili: servono sporgenze alternate da un lato solo (45% della larghezza).
- Il validatore dei salti: l'apice coincide con la quota d'arrivo (i valori di rise/run sono già prudenti rispetto alla fisica vera: salto 3.75 celle, doppio +2.8, dash ~4 celle).
- Il debug con il modello di mosse sbagliato inganna: perduta è BASIC, bus DASH, il resto FULL.
- Una stanza "chiusa dal doppio salto" costruita tutta con mosse FULL è una trappola appena ci si entra da un varco alto (ci cadi dentro e non risali). Lo scheletro di ogni stanza è sempre percorribile con le mosse del capitolo; il cancello FULL sta solo sul ramo verso la stanza laterale successiva.
- La verifica pessimistica vale solo **prima** dello scavo delle stanze. Le riparazioni dopo lo scavo verificano sulla griglia vera (`dig(..., { carved: true })`), altrimenti nessun piano "funziona" e si applica il ripiego alla cieca.
- Le sporgenze degli shaft hanno il varco tra i lati entro `run - 1` delle mosse del capitolo.

---

## 4. Punto in cui ero (prossimo passo immediato)
Le regioni girano nel gioco (verificato con screenshot in superficie e sottoterra su perduta). Prossimi passi, in ordine:
1. **Giocare davvero una regione** (con l'utente o a mano): controllare che trama, boss, agguati, inseguimenti della tana, arene del void e di walter scattino nel posto giusto. Tutta la logica posizionale ora passa da `progressAt`.
2. **Mappa che si rivela** (punto 8 sotto): in una regione da 60 stanze senza mappa ci si perde.
3. **Cancelli d'abilità veri**: oggi in perduta e bus quasi nessuna stanza laterale è chiusa dal doppio salto (1 su 27, `scripts/world/run.sh gates`), perché lo scavo aperto delle stanze aggira le scale FULL. Va progettato un cancello fisico (mensola alta, camino verticale) nel varco verso la stanza dopo, con verifica genera-e-testa (tolto se crea trappole). Da fare insieme alle nuove wave della Fase 4.
4. Poi la 3b (mondo vivo) e la 3c (hub e bus).

---

## 5. Piano per completare la Fase 3 (come intendevo farlo)

### 3a — integrazione delle regioni nel gioco
**Fatto (punti 1–7)**. Com'è stato fatto, dove diverge dal piano:
- i JSON stanno in `public/regions/<id>.json` (non in `src/content`): li carica il `BootScene` con `load.json`, così il bundle resta leggero. `npm run regions` li rigenera (deterministico, ~15 s) e fallisce se una regione non è valida. Formato in `src/world/codec.ts` (righe RLE come coppie `[carattere, n]`, perché le cifre sono lettere della legenda); il campo `source` è l'impronta del capitolo vecchio e in dev avvisa se la regione è da rigenerare;
- `src/world/registry.ts`: `loadRegion(scene, id)` unisce i metadati di `LEVELS` con griglia e legenda della regione; se il JSON manca si gioca il capitolo vecchio;
- `RegionLayout.progressPairs` + `oldXToProgress(layout, x)` in `types.ts`;
- `GameScene`: `layout`, `roomAt`, `progressAt` (le stanze laterali valgono il `pathIndex` dell'anchor), `progressOfOldX`, `openSpotNear` (comparse di notino, glitch e pedro del doomsday mai dentro la roccia). Le guide (romero, walter) nelle regioni fluttuano accanto al player dal lato dell'obiettivo; nei capitoli vecchi camminano come prima (`moveGuide`). Lo zoom era già 1.05 con livelli alti;
- `RoomBackdrops`: parete di fondo del materiale scurito dietro ogni stanza chiusa, Light2D (le stanze della riga più alta lasciano intravedere il dipinto, alpha 0.62);
- `TerrainRenderer`: chunk dipinti attorno alla camera (la vista subito, un pezzo di margine per frame, via oltre 3 pezzi). Ogni chunk ricava i contorni da una **finestra di celle** con 8 celle di margine: il contorno globale della roccia di una regione ha centinaia di migliaia di punti e usarlo come clip costava decine di ms a chunk. Il contorno globale serve solo alla vestizione, divisa per chunk. Build del terreno di perduta: 64 ms;
- nemici dormienti (`Enemy.setDormant`, sveglia entro 1500×1000 px, sonno oltre 1800×1250); i tetti delle comparse (lametta, patto) contano solo i nemici svegli (`awakeEnemies`); luci dei props fino a 260 (phaser rende solo le più vicine alla camera).

Piano originale, per riferimento:
1. **Generazione offline in JSON**:
   - script `scripts/world/build-regions.ts` (via `run.sh`) che chiama `generateRegion(def, 40)` per ogni capitolo e scrive `src/content/regions/<id>.json`;
   - contenuto: griglia in RLE per riga, `entities` (legenda estesa), layout serializzabile (`rooms`, `doors`, `pathLength`, `horizonRow`, `progressPairs` al posto della funzione `oldXToProgress`, `slotW/H`, `macroW/H`, `cols/rows`);
   - **fallisce se `exitReached` è falso, `lostBeats>0` o `stuck>0`**;
   - così il runtime non paga la generazione e il generatore resta fuori dal bundle.
2. `src/world/registry.ts`: `getRegion(id)` decodifica il JSON (es. `import.meta.glob('../content/regions/*.json', { eager: true })`) e ricostruisce `oldXToProgress`. Rimuovere il `getRegion` runtime da `region.ts` o lasciarlo solo per gli script.
3. `GameScene.init`: `this.def = region.def` e `this.layout = region.layout`, con fallback ai vecchi `LEVELS` se il JSON manca. `main.ts`, `screens.ts` e il telefono usano `LEVELS` solo per i metadati: ok.
4. Adattare gli script posizionali di `GameScene`:
   - `progressAt(x,y)` = `pathIndex` della stanza + frazione x; per le stanze laterali, `pathIndex` dell'anchor + 0.5;
   - **agguati** (`AMBUSHES`, x in vecchie celle·32): scatta quando `progressAt(player) ≥ oldXToProgress(a.x/32)`;
   - **inseguimenti** nella tana (`chaseStarts/Ends` da marker `caccia-*`): confronta per progresso, non per x;
   - `voidArenas` e `baruffoniArenas`: ordinare per progresso, non per x;
   - `updateBossTrigger`, `updateLamettaArena`, `updateSmelaArena`: aggiungere il controllo `|dy| < ~400`;
   - zoom camera: fisso 1.05 (oggi dipende dall'altezza del livello).
5. **Parallasse**: ancorare le strisce a `horizonRow*TILE` invece che al fondo livello (`ParallaxManager.build(..., levelHeight)` → `horizonY`). Sotto terra le strisce escono di scena; servono i **fondali delle stanze**: per le stanze non `surface`, una TileSprite del materiale scurito a depth −5 con Light2D, così le luci rivelano le pareti come in HK.
6. **TerrainRenderer in streaming**: le regioni hanno ~190k celle, troppe per dipingere tutto. Contorni e vestizione si calcolano al build (misurare i tempi). I chunk si dipingono in `update(camera)` entro vista + margine, massimo 1–2 per frame, ed escono (destroy + rimozione texture) oltre circa 2 schermi.
7. Prestazioni: nemici dormienti oltre ~1.5 schermi (niente update e body disabilitato); alzare il tetto di luci dei props (`LightingManager.prop`, oggi 40); verificare l'emitter `buildWater`.
8. **(da fare) Mappa che si rivela**: `SaveData.explored: Record<regionId, number[]>` (stanze visitate). L'app Mappa del telefono disegna le stanze del layout in scala (visitate piene, attuale evidenziata, icone di microfoni e boss), più la vista attuale dei capitoli. Opzionale, come Cornifer: mappa comprabile o trovabile per regione.
9. **(da fare)** Editor: oggi lavora sulle griglie vecchie (sorgente della trama). In futuro potrà aprire i JSON.

### 3b — mondo vivo e pericoloso
- `Wanderer`: npc ambientali che camminano, restano fermi, dicono battute a fumetto quando ti avvicini e scappano se combatti vicino.
- Stati dei nemici: dorme (zzz, si sveglia a distanza o rumore), pattuglia, allerta, insegue, fugge a vita bassa. "Cacciatori" élite che ti seguono tra le stanze; boss erranti come élite, non come classe `Boss` (`this.boss` è unico per scena: un solo boss di trama per capitolo).
- **Meteo**: pioggia, temporale con lampi e tuono, vento che piega il primo piano, banchi di nebbia, allagamenti periodici in alcune stanze.
- **Ciclo giorno/notte**: orologio di gioco che tinge l'ambiente e il velo; musica notturna dal pool del personaggio.
- **Trappole**: stalattiti che cadono, presse, piattaforme che crollano, seghe, getti di fiamma.
- Zone senza ritorno: già presenti (porte `drop`).

### 3c — hub e bus
- **Hub-città** stile GTA: piazza con npc, negozi fisici, quest, terminal dei bus.
- **Fermate del bus** in ogni regione: viaggio rapido tra le fermate visitate, anche dal telefono.

### Fasi 4–5
Vedi `REMASTER.md`. In particolare la trama va resa "da serie A": scelte, conseguenze, misteri, colpi di scena, senza riscrivere da zero.

---

## 6. Gotcha del codebase
- `GameScene.create` resetta a mano decine di campi di stato: se ne aggiungi, resettali lì.
- `LevelLoader` lancia un'eccezione se una lettera della griglia non è nella legenda.
- Il layer del tilemap è invisibile ma serve alle collisioni (tileset 160 px scalato 0.2, `tileBias` alto). Muri finti e rompibili sono sprite statici a parte.
- I `refreshBody()` dopo `setScale` sui corpi statici sono necessari (commento originale).
- La `TileSprite` ha una texture interna sua: la scala va calcolata sulla sorgente. Questo bug è già stato corretto in `ParallaxManager`.
- `state.godMode` sblocca tutte le abilità.
- Bus di eventi tipato: `src/engine/events.ts`. I nuovi eventi (`inventory-changed`, `messages-changed`, `charm-found`) vanno aggiunti lì.
- La musica è HTML5 Audio (`src/engine/music.ts`); la radio vince sulla musica del capitolo, non su quella dei boss.
- Font bundlati: Climate Crisis (titoli MAIUSCOLI), Permanent Marker (battute minuscole e storte), Martian Mono (corpo). Regole del design system in `design_system.md`: micro-rotazioni, sticker tratteggiati, ombre dure, un colore dominante per sezione.
- Il dev server dell'utente può essere già attivo su :5173: usalo, non avviarne un altro.

---

## 7. Sessione "fix totale" (dopo il feedback: «bellissimo ma ingiocabile»)

Feedback dell'utente: mappe irrisolvibili, boss/meccaniche/npc che non funzionano, mondo non vivo, notino che si incastra, lochef che non appare. Più: freccia guida **solo come modalità assistita** (spenta di default, blocca i trofei), niente testo accanto al geco, trofei e punteggi (ora in REMASTER.md, Fase 4b). Regole nuove: **committa e pusha continuamente** (branch `remaster-l6rk4r`) con commit convenzionali (`feat:`, `fix:`, `docs:`...), e aggiorna **`DEV_LOG.md`** (architettura, ADR, vincoli, stato) a ogni blocco di lavoro.

### Strumenti di verifica (la base di tutto)
- `src/world/sim.ts`: il geco simulato con la **fisica vera di arcade** (stessa integrazione, separazione dalle tile con facce/bias/ordine assi, stesso controllo di Player). Calibrato contro il gioco vero: salto 221 px / apice 114 px identici.
- `src/world/simreach.ts`: raggiungibilità a macro (camminate, cadute, ventaglio di salti, doppio salto, dash). `canFinish` per le trappole.
- `src/world/simfix.ts`: `simVerify` (uscita, trappole, entità a portata) e `simRepair` (scalinate prudenti o riempimento delle tasche piccole, bottini spostati a portata).
- `npm run regions` ora genera **e verifica col simulatore**, in parallelo (un processo per regione, ~3 min). Tutte e 20 passano: uscita raggiungibile, zero trappole, tutta la trama a portata.
- Script in `scripts/world/`: `simcheck <id|all> [old]`, `simzoom`, `simstuck <id>`, `simfix-test`, `waypoints`, `render <id> [scala] [x0 x1 y0 y1]` (png della regione), `abilities.ts` (abilità per capitolo).
- **Bot di playtest** (nello scratchpad della sessione, non nel repo): playwright + chromium headless, il loop di phaser fermato e avanzato a mano (`game.scene.update`), teletrasporto sulle tappe calcolate dal simulatore, dialoghi/scelte/card chiusi da solo, boss abbattuti. Ha completato **l'intera campagna fino al finale** e i capitoli segreti (galliate, marcetti, barrato, custode). Nota: i tween di phaser usano il tempo reale, quindi nel bot le scenette sono lente (non è un bug del gioco). In dev sono esposti `window.__game`, `__bus`, `__state`.

### Bug veri trovati e corretti
- Le ricompense dei boss (doppio salto di guggu, riflesso, ecc.) nascevano dove moriva il boss, spesso in aria o nella roccia → `rewardSpot` + `homeIn`: si posano su un pavimento e poi ti vengono incontro.
- Boss che non si ingaggiavano nelle regioni → si svegliano quando entri nella loro stanza (o li vedi da vicino).
- Arene: sbarre d'inchiostro sui varchi finché il boss è vivo (`lockArena`), anche durante le scenette.
- Boss minuscoli nelle arene enormi → `Boss.baseScale` (1.45–2.1×) e `makeBoss` li sospende sopra il pavimento.
- Lochef nella tana: appare a bordo schermo dal lato giusto, sempre visibile, velocità a elastico, molla dopo 50 s.
- Trappole fisiche in ricordi/mente/stabilimento riparate; bottini irraggiungibili in perduta spostati.
- Guide (romero, walter): ci si parla da vicino, si avvicinano quando ti fermi.
- Camera con margine sul fondo/cima della mappa (le arene stanno spesso sul fondo), roccia piena sotto la mappa.
- Sotterranei un po' meno neri (ambiente ×3.4, luce del player 400).

### Sistemi nuovi
- `src/engine/nav/NavGraph.ts`: segmenti di pavimento, cadute e salti balistici verificati, A* sui segmenti, `sight`/`sightWide`, `flyPath` (A* a blocchi 2×2 per chi vola).
- `src/entities/Enemy.ts` riscritto: stati dorme/pattuglia/allerta/insegue/torna/scappa, vista che non passa la roccia, si chiamano tra loro (`enemy-alert`), inseguimento lungo il grafo con salti, volanti che aggirano i muri. `RELENTLESS` (notino-mini, eco, tossico-trenbo) non mollano mai.
- `src/engine/RegionGuide.ts` + `regionView.ts`: strada tra le stanze; mappa del telefono che si rivela (`SaveData.explored`), ✶ obiettivo. Freccia guida = **modalità assistita** (`settings.guide`, spenta di default).
- `src/content/folk.ts`, `src/engine/art/folk.ts`, `src/engine/FolkManager.ts`: passanti per bioma (14 sagome), camminano/saltano sul grafo, chiacchierano tra loro, battute quando passi, E per parlare, scappano dal pericolo, notizie che cambiano coi flag, paura di pedro col doomsday.
- `src/engine/Atmosphere.ts`: ciclo giorno/notte (12 min), meteo per bioma (pioggia, temporale con lampi e tuono, nebbia, vento, cenere), solo all'aperto; pioggia sintetizzata in `sfx.setRain`.
- Trofei e punteggi: `src/content/achievements.ts` (36 trofei), `src/engine/achievements.ts`, punteggio a fine capitolo (`finishChapter`, record in `SaveData.scores`), app **trofei** nel telefono. Con la freccia accesa niente trofei e record segnati "assistito".

### Aggiunte successive
- **fermate del citelis**: palo accanto a ogni microfono, si scoprono passando (`SaveData.stops`), da lì il tabellone `travel-show` porta a qualsiasi fermata scoperta (`travelTo`).
- **missioni dei passanti**: `src/content/quests.ts` (16, una per capitolo), `src/engine/QuestManager.ts`. Tutto piazzato su `layout.spots`: posizioni verificate dal simulatore che `npm run regions` salva per stanza. Stato in `SaveData.quests`, nel diario del telefono.
- **aggrappo** (nuova wave, `PHYSICS.wall*`): presa e salto dai muri, replicata nel simulatore (traiettorie identiche al gioco vero), macro di arrampicata in `simreach`. La lascia la formicona. `TOTAL_FRAGMENTS` = 8.
- **élite**: `Enemy` con `elite` (scala 1.5, aura, vita ×3.5, bottino ×6), scelte da `isEliteSpot`.
- **finale vero** "riscatto": `giorno30`, boss `glitchpedro`, `sceltaFinale`, flag `pedro-redento` e `dei-arrestati`.

- **cancelli d'abilità** (`src/world/gates.ts`): mensola per il doppio salto e camino per aggrappo nei capitoli fino a rio, verificati due volte dal simulatore.
- **hub della piazza** (`level00-piazza.ts`, `LevelDef.hub`): fuori dalla pipeline (`REGION_IDS`), fermata `HUB_STOP` nel tabellone dopo guggu, bottega, bar delle voci, bacheca, oracolo delle mappe, folla. Verifica: `scripts/world/run.sh hubcheck piazza`.
- **trappole** (`src/engine/TrapManager.ts`): seghe, presse, vapore per bioma, a runtime, mai solide.
- **musica di notte**: passa-basso WebAudio (`music.setNight`).
- **arene opzionali**: microfono rosso per regione, tre ondate, `arena-vinta-<id>`, trofeo gladiatore.
- Il log tecnico dettagliato con le decisioni (ADR) è in `DEV_LOG.md`.

### Prossimi passi
0. Ricordi non passa la verifica col simulatore corretto (vedi `DEV_LOG.md`, sezione "In corso / aperto").
1. Bot sulla campagna intera con le regioni rigenerate (tappe: `scripts/world/waypoints.ts`).
2. Piattaforme che crollano, allagamenti, sfide a tempo.
3. Trame secondarie per personaggio, più scelte a metà gioco.
