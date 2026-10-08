# GECOWAVE: The Flux of Cosenza

Action-platformer 2D in stile Hollow Knight / souls-like ambientato nel **GecoRealm**. Pedro, l'IA glitchata creata da Lametta, si è scontrata con gli dei e ha frantumato la GecoWave: il geco — custode provvisorio scelto dalla wave stessa — attraversa **14 capitoli** per raccogliere i frammenti, tra bus dimensionali, santuari di specchi, trenbolone, uno stabilimento di acqua "premium", teoremi di Analisi 1, un caso poliziesco vecchio quarant'anni, una tana da cui scappare due volte, un centro dati che ti conosce meglio di te e la memoria di chi ha rotto tutto.

## Avvio

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
  story/         chi porta la trama: film dei ricordi, missioni, voce dei boss, ombra, pedro, nucleo
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

## I frammenti della GecoWave

| frammento | da chi | effetto |
|---|---|---|
| scivolata | markolino | dash con i-frames (SHIFT/K) |
| rimbalzo | ivan maggini | doppio salto (SPAZIO ×2) |
| riflesso distorto | breccio / il santuario | clone esca che attira i nemici (G) |
| colpo risonante | notino | proiettile caricato perforante (F tieni premuto) |
| rio merdone | il fiume | rigenerazione passiva, immunità ai malus |
| analisi 1 | piema | tempesta di teoremi attorno a te (H) |
| tommasoscudo | l'ombra / la tommasorveglianza | bolla che riflette i proiettili (R) |

## I cuori del realm

Sparsi per il realm (e in mano a chi non dovrebbe averli) ci sono **6 cuori** che aumentano la vita massima per sempre: nella grotta del capitolo 1, nella vecchia metro, nel magazzino dello stabilimento, e in mano a lochef85, alla formicona e al limite notevole. Si trovano dietro muri rompibili (`%`, si spaccano a colpi) o finti (`F`, si attraversano).

## La tommasorveglianza è una scelta che pesa

Comprarla (133 barre, da ticummi nel rio) cambia il gioco:

- **con l'abbonamento**: notino viene respinto a ogni agguato, ma la tommasorveglianza ti **guarda** — l'ombra del capitolo 8 è addestrata su 41.077 secondi di te (boss potenziato), e in cantina ticummi attiva la *clausola 12*: i tuoi dati diventano armi (evoca echi di te in battaglia).
- **senza**: notino ti tende agguati veri in rio (×2), ruhra (×2) e cantina (×1, in coppia) — spawna, saltella, spara e "si ritira strategicamente" lasciando barre. In compenso l'ombra è un clone sottoaddestrato su footage pubblico (boss indebolito) e ticummi non sa niente di te.

## Il patto con pedro

Sceglierlo nel finale non è più solo testo: le stats **raddoppiano davvero** (vita, flow, danni), hai ~20 secondi di onnipotenza con ondate di glitch su cui sfogarti e avvisaglie crescenti, poi piema e lametta arrivano **insieme**, immortali e in frenzy. Non si vince. Era il punto.

## Miniboss opzionali

La **formicona, sindaco di formica (FR)** — la formica che morse un dio — riceve sottoterra, a ovest del villaggio, dietro un tappo rompibile (`%`). Non blocca l'uscita del livello (`guardsExit: false`): si può ignorare, ma il cuore lo tiene lei.

## Le maschere del realm

5 **maschere della tua stessa faccia** (le maschere del primo custode, quello che faceva i dischi) sono nascoste nei capitoli — quasi sempre dietro illusioni, in cima a scalate opzionali o in casseforti altrui. Ognuna vale 25 barre; a 3 senti il beat (markolino si fa vivo e la forza sale di 1); con tutte e cinque arriva **il ritmo perfetto**: attacchi più veloci, per sempre, e un varco verde in perduta.

## Note di design

- Capitoli (14): la wave perduta → l'invasione dei bus (Guggu, ivan, la metro e il capolinea fantasma) → il santuario polarizzante (Breccio, il labirinto, la galleria dei futuri, poi Lametta: 5 gocce di colore e lo specchio nero) → Notino e la tecnokill (campo failrp, torre radio, dune) → il rio merdone (trenbolone, agguati, il villaggio di formica col sindaco sottoterra, la gola) → **lo stabilimento di Smela** (la catena dell'acqua "premium") → la Ruhra (Riba, biblioteca, torre di analisi, mensa, archivi) → **il caso analisi 1** (Romero: 3 indizi in 3 scene del crimine, poi l'arresto del limite notevole — invulnerabile senza il fascicolo completo) → la tana di lochef85 (**due** inseguimenti e il giardino delle statue) → la tommasorveglianza (archivio clienti, la sala dove l'ombra si è allenata, il condotto dati, il clone) → la cantina di Ticummi (laboratorio del trenbolone, il caveau degli 0,09, la scelta) → **i ricordi di Pedro** (il backup dei giorni 1-42; boss: l'ultimo pedro pulito, che cambia il dialogo del finale) → **il void dei rimpianti** (Romero ti guida tra 5 persone-ricordo del passato; ogni rimpianto sconfitto rivela una verità su lametta e piema, poi markolino irrompe: pedro sta eseguendo l'ordine) → Pedro il traditore (il patto o lo scontro; poi gli dei).
- Script di capitolo (`LevelScript`): `bus`, `lametta`, `trenbolone`, `caso` (indizi → sblocco del boss), `ruhra`, `tana` (inseguimenti delimitati da coppie di marker `caccia-inizio`/`caccia-fine`), `sorveglianza`, `cantina`, `ricordi`, `indagine` (il void: romero guida + 5 miniboss-rimpianto in sequenza, ognuno sblocca una verità), `pedro`.
- Dal menu, **capitoli** permette di tornare in qualsiasi zona già visitata: serve per recuperare maschere, cuori e miniboss opzionali persi per strada.
- Dopo un finale buono il salvataggio riparte dal capitolo 1 con tutte le wave: NG+ (boss e agguati tornano).
