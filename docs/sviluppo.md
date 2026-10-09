# sviluppo

guida tecnica al codice: come è fatto, come si verifica e come si aggiungono livelli, nemici e ricordi.

## avvio

```bash
npm install
npm run dev      # sviluppo su vite
npm run build    # typecheck + build di produzione
```

## Com'è fatto

- **Phaser 3 + TypeScript + Vite.** Canvas trasparente sopra uno sfondo DOM; la UI (menu, HUD, dialoghi, scelte, telefono) è interamente DOM in stile "Acid Glass" (`docs/design-system.md`).
- **Il mondo a regioni**: i capitoli in `src/content/levels/` sono la sorgente della trama; un generatore offline (`npm run regions`) li trasforma in regioni a stanze, verificate da un simulatore a fisica vera, in `public/regions/<id>.json`.
- **Il cast a inchiostro**: sfondi dipinti in `public/assets/`; nemici, boss, personaggi, passanti e oggetti sono disegnati dal codice (`src/art/`), animati, con normal map per le luci vere.
- **Atmosfera**: luci dinamiche Light2D, parallasse a strati con nebbia davanti al geco, terreno e arredo disegnati dalla griglia, acustica che prende la forma del posto, musica ovattata di notte.
- **Souls-like**: i microfoni sono i bonfire (premi E), alla morte lasci le barre a terra e torni a riprendertele, i boss chiudono la stanza.
- **Movimento HK**: coyote time, jump buffer, salto variabile, pogo (S+J in aria), scivolata con i-frames, combo a 3 colpi.
- **Uguale a ogni schermo**: la logica va a passi fissi da 1/60 di secondo, a 60, 120 o 144 Hz il gioco è lo stesso.

## Struttura

```
src/
  scenes/        le scene phaser: boot, menu, galleria, gioco. GameScene compone i sistemi e li chiama nell'ordine giusto
  game/          i sistemi della partita (nemici, combattimento, abilità, boss, arena, dialoghi, ricompense,
                 progressione, viaggio, guida, sfide, doomsday) e gli script dei capitoli (chapters/)
  entities/      geco, nemici, boss, nidi, compagno
  rules/         logica pura senza phaser, con i test accanto (npm test): danni, punteggi, salvataggio, caso, passo fisso
  core/          servizi usati da tutti: stato e salvataggio, eventi, caso a due sequenze (logica e grafica), trofei
  content/       i dati del gioco: capitoli, storia e dialoghi, nemici, boss, oggetti, flashback
  world/         la regione come dato: generatore, simulatore, griglia, navigazione (anche per editor e scripts/world)
  stage/         la regione in scena: terreno, acqua, luci, cielo, arredo, passanti, caricamento
  story/         chi porta la trama: i ricordi girati come film (film/), missioni, voce dei boss, ombra, pedro, nucleo
  mechanics/     le regole del posto: una meccanica per bioma, trappole, pericoli, sigilli, corse
  art/ audio/ input/ ui/ dev/    disegno, suono, comandi, interfaccia dom, strumenti di sviluppo
editor/          editor delle regioni (usa i tipi del gioco: va tenuto compilabile)
scripts/
  harness/       le prove: il gioco in chromium headless, ripetibile al fotogramma (vedi il suo README)
  world/         banco del generatore delle regioni
  assets/        icone e sprite
docs/            design system, coop, resoconti dell'harness (copertura, prestazioni, riferimenti)
```

## Verificare una modifica

`npm test` per le regole. Per il gioco intero c'è l'harness (`scripts/harness/README.md`): fa giocare 200 scenari (la campagna col bot, ogni capitolo, ogni finale, nastri di tasti, partite registrate) e dice se qualcosa è cambiato, al fotogramma. Una modifica che non deve cambiare il gioco deve dare tracce identiche al riferimento.

## Aggiungere un livello

1. Crea `src/content/levels/level08-nome.ts` esportando un `LevelDef`.
2. Disegna la griglia ascii (ogni carattere = 1 tile da 32px):
   - `#` terreno · `^` spine · `~` acqua · `P` spawn · `C` microfono · `X` uscita
   - qualsiasi altra lettera è un'entità definita nella mappa `entities` del livello: nemico, npc (id = dialogo), frammento, lore, barre, boss.
   - il player per muoversi, camminare ecc.. occupa 2 tile (2x2)
3. Registralo in `levels/index.ts` e collegalo con `next` dal livello precedente, poi rigenera le regioni (`npm run regions`, decine di minuti): il gioco carica la regione, non la griglia.
4. Regole di salto (per non creare passaggi impossibili): salto singolo ≈ 3 tile in alto / 5 in largo; col rimbalzo ≈ 5-6 in alto / 8 in largo; con la scivolata +4 in largo.

Lo stesso vale per la storia: i dialoghi vivono in `story.ts` (`DIALOGUES['mio-id']`) e un npc con `id: 'mio-id'` li recita da solo. La voce: minuscolo, demenziale; pedro glitcha, la riba sbaglia le doppie, piema è l'unico che scrive corretto.

## Aggiungere un nemico o un boss

- Nemico: un disegno in `src/art/creatures/`, un archetipo in `enemies.ts` (comportamenti pronti: `walker`, `flyer`, `hopper`, `turret`, `chaser`, `charger`, più `splitsInto` per quelli che si dividono), e una lettera nella legenda del livello.
- Boss: una entry in `bosses.ts` con gli attacchi per fase (`dive`, `charge`, `radial`, `rain`, `burst`, `teleport`, `lamette`, `summon`) e l'eventuale ricompensa nell'aggancio `bossDefeated` dello script del capitolo (`src/game/chapters/`).

## I ricordi (flashback)

I ricordi sono piccoli film girati dal motore: il gioco si ferma come sotto un dialogo e il film gira in una scena sua (`src/story/film/FilmScene.ts`), con le bande nere, la seppia d'epoca, la grana e le ombre degli attori proiettate sul muro. Niente didascalie: si sente solo quello che i personaggi si dicono. Si saltano con invio, salto, attacco o interagisci.

Un film è un copione in `src/content/films.ts`: il set (studio, bottega, atelier, deserto, piazza, sala monitor, cantina dei server, archivio, aula), l'ora (notte, mattina, pomeriggio, neon), il cast con le posizioni, gli oggetti di scena e le inquadrature. Ogni inquadratura ha una durata, dove guarda la macchina (centro e zoom, con un movimento facoltativo e lo sfondo fuori fuoco nei primi piani) e i gesti con il loro istante: camminare, girarsi, annuire, piegarsi, tremare, salire, passarsi un oggetto, dire una battuta, accendere uno schermo, abbassare una luce, far scendere la notte. Il ricordo prima di quale dialogo lo dice `src/content/flashbacks.ts`. I provini si fanno senza schermo con l'harness, catturando i fotogrammi.
