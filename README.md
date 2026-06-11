# GECOWAVE: The Flux of Cosenza

Action-platformer 2D in stile Hollow Knight / souls-like ambientato nel **GecoRealm**. Pedro, l'IA glitchata creata da Lametta, si è scontrata con gli dei e ha frantumato la GecoWave: il geco — custode provvisorio scelto dalla wave stessa — attraversa 10 capitoli per raccogliere i frammenti, tra bus dimensionali, santuari di specchi, trenbolone, teoremi di Analisi 1, una tana da cui scappare e un centro dati che ti conosce meglio di te.

## Avvio

```bash
npm install
npm run dev      # sviluppo su vite
npm run build    # typecheck + build di produzione
```

## Com'è fatto

- **Phaser 3 + TypeScript + Vite.** Canvas trasparente sopra uno sfondo DOM; la UI (menu, HUD, dialoghi, scelte) è interamente DOM in stile "Acid Glass" (`design_system.md` del sito).
- **Asset dipinti** (in `public/assets/`): sprite sheet del protagonista, sfondi `background.png`/`background2.png`, colonne gotiche, atlante dei props, tileset in pietra a 160px scalato 0.2. Tutto il resto del cast (nemici, npc, boss, oggetti) è generato proceduralmente in `src/engine/textures.ts`.
- **Atmosfera**: luci dinamiche Light2D (ambiente quasi nero tinto di zona, soul-glow sul geco, lanterne tremolanti, glow sui nemici), parallax a 4-5 strati con **nebbia davanti al giocatore**, decorazioni procedurali piazzate leggendo la griglia del livello, vignette sulla camera.
- **Souls-like**: i microfoni sono i bonfire (premi E), alla morte lasci le barre a terra e torni a riprendertele, i boss bloccano l'uscita.
- **Movimento HK**: coyote time, jump buffer, salto variabile, pogo (S+J in aria), scivolata con i-frames, combo a 3 colpi.

## Struttura

```
src/
  config.ts                  costanti di fisica, combat, colori di zona
  types.ts                   tipi condivisi (LevelDef, EntitySpec, ...)
  content/
    levels/                  un file per capitolo + index.ts (registro)
    story.ts                 dialoghi, intro, finali, quiz, wavesung, card abilità
    enemies.ts               archetipi nemici (comportamento, hp, barre, glow)
    bosses.ts                definizioni boss (fasi, attacchi, cooldown)
  engine/
    LevelLoader.ts           griglia ascii -> tilemap, spine, acqua, entità
    LightingManager.ts       luci 2d (player, torce, nemici)
    ParallaxManager.ts       strati dipinti + skyline + nebbia frontale
    DecorationManager.ts     props procedurali dalle superfici della griglia
    textures.ts              cast procedurale + skyline + nebbia
    state.ts                 salvataggio (localStorage), run, flag di storia
    events.ts                bus tipato phaser <-> dom
    sfx.ts                   synth webaudio (zero file audio)
  entities/                  Player, Enemy, Boss
  scenes/                    BootScene (preload), GameScene (tutto il gioco)
  ui/                        hud, dialoghi, schermate dom
```

## Aggiungere un livello

1. Crea `src/content/levels/level08-nome.ts` esportando un `LevelDef`.
2. Disegna la griglia ascii (ogni carattere = 1 tile da 32px):
   - `#` terreno · `^` spine · `~` acqua · `P` spawn · `C` microfono · `X` uscita
   - qualsiasi altra lettera è un'entità definita nella mappa `entities` del livello: nemico, npc (id = dialogo), frammento, lore, barre, boss.
3. Registralo in `levels/index.ts` e collegalo con `next` dal livello precedente.
4. Regole di salto (per non creare passaggi impossibili): salto singolo ≈ 3 tile in alto / 5 in largo; col rimbalzo ≈ 5-6 in alto / 8 in largo; con la scivolata +4 in largo.

Lo stesso vale per la storia: i dialoghi vivono in `story.ts` (`DIALOGUES['mio-id']`) e un npc con `id: 'mio-id'` li recita da solo. La voce: minuscolo, demenziale; pedro glitcha, la riba sbaglia le doppie, piema è l'unico che scrive corretto.

## Aggiungere un nemico o un boss

- Nemico: una texture in `textures.ts`, un archetipo in `enemies.ts` (comportamenti pronti: `walker`, `flyer`, `hopper`, `turret`, `chaser`, `charger`, più `splitsInto` per quelli che si dividono), e una lettera nella legenda del livello.
- Boss: una entry in `bosses.ts` con gli attacchi per fase (`dive`, `charge`, `radial`, `rain`, `burst`, `teleport`, `lamette`, `summon`) e l'eventuale ricompensa in `GameScene.onBossDefeated`.

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

Sparsi per il realm (e in mano a chi non dovrebbe averli) ci sono **cuori** che aumentano la vita massima per sempre: uno murato nella grotta del capitolo 1, uno nella vecchia metro del capitolo 2, uno lo lascia cadere lochef85. Si trovano dietro muri rompibili (`%`, si spaccano a colpi) o finti (`F`, si attraversano).

## Note di design

- Capitoli: la wave perduta → l'invasione dei bus (Guggu è invulnerabile senza Ivan; samatt e guastalla aspettano nella metro) → il santuario polarizzante (Breccio, poi Lametta: si vince raccogliendo 5 gocce di colore e uscendo dallo specchio nero) → Notino e la tecnokill → il rio merdone (trenbolone, Ticummi/Tommasorveglianza, i **due** agguati di Notino, Smela) → la Ruhra (miniboss Riba, enigmi di Analisi 1, il commissario Romero) → la tana di lochef85 (ti rapisce nel sonno: fuga, inseguimento attraverso i muri, boss) → la tommasorveglianza (la tua ombra ha studiato ogni tua mossa; dentro di lei c'è il frammento dello scudo) → la cantina di Ticummi (Lametta è prigioniero; sconfitto Ticummi scegli se ridargli il trenbolone) → Pedro il traditore (seguirlo è un finale sbagliato; dopo averlo battuto si sceglie: consegnare le wave o sfidare gli dei).
- Script di capitolo (`LevelScript`): `bus`, `lametta`, `trenbolone`, `ruhra`, `tana` (inseguimento delimitato dai marker `caccia-inizio`/`caccia-fine`), `sorveglianza`, `cantina`, `pedro`.
- Dopo un finale buono il salvataggio riparte dal capitolo 1 con tutte le wave: NG+.
