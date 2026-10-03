# Piano 6 — i comandi: azioni, preset, rimappatura, gamepad

> Prima leggi `plans/00-INDEX.md`. Il piano 5 (abilità) deve essere fatto: questo piano assegna i tasti alle abilità **come le ha rifatte il piano 5** (colpo risonante a livelli, scambio del riflesso, bottiglia di smela, rimando perfetto dello scudo).

## Il problema

I tasti sono sparsi su tutta la tastiera e scritti a mano in decine di posti:
- `src/entities/Player.ts` (costruttore): A/D, W/S, SPAZIO, J, SHIFT o K, Q (cura tenuta), F (risonante tenuto), G (riflesso), H (analisi), R (scudo), V (acqua), C (mangia). Più le frecce (`createCursorKeys`): **freccia su fa anche saltare** (oltre a mirare in alto), e clic sinistro attacca.
- `src/scenes/GameScene.ts`: E (interagisci), ESC (pausa). `src/ui/phone.ts`: TAB/P (telefono), ESC/Backspace (indietro). `src/ui/dialogue.ts`, `src/engine/FlashbackManager.ts`: E/SPAZIO/INVIO per avanzare.
- testi con i tasti scritti a mano: `src/ui/screens.ts` (`CONTROLS`, manca la V dell'acqua), `src/ui/hud.ts` (`ACTIVE_ORDER` con F/G/H/R/V), `ABILITY_CARDS` (`desc` e `key`), `LESSONS` (shift, G, V, H, R, W + attacco, GIÙ + attacco), `WAVESUNG.markolinoPogo` e `markolinoRisonante`, `'markolino-intro'` (A/D, SPAZIO, J, TAB, E), le chiamate di markolino in `phone.ts` ("carica F"), la card degli amuleti in `screens.ts` ("dal telefono (tab)"), il toast dello schianto, il toast dei nascondigli della tana (piano 4).
- niente gamepad, niente rimappatura.

## Obiettivo
1. un **livello di input** unico ad azioni: nessun file del gioco legge più tasti fisici, tutti chiedono "l'azione X è premuta?";
2. **due preset da tastiera** pensati per due mani, più il **gamepad**;
3. **rimappatura** nella schermata comandi, salvata nelle impostazioni;
4. **tutti i testi** mostrano i tasti veri del dispositivo in uso, con segnaposto;
5. le 5 wave attive in **uno schema leggibile**: un tasto "wave" con la direzione (come gli incantesimi di Hollow Knight), più due tasti dedicati.

---

## 1. Le azioni

```ts
export type Action =
    | 'left' | 'right' | 'up' | 'down'
    | 'jump' | 'attack' | 'dash'
    | 'wave'        // colpo risonante (tieni/rilascia); su + wave = analisi; giù + wave = bottiglia
    | 'scudo' | 'riflesso'
    | 'heal'        // tieni premuto
    | 'eat' | 'interact' | 'phone' | 'pause';
```

### Lo schema delle wave
| input | wave | note |
|---|---|---|
| `wave` (tieni e rilascia) | colpo risonante | eco / onda / onda piena secondo quanto tieni (piano 5) |
| `up` + `wave` | analisi 1 | `up` tenuto **al momento della pressione** |
| `down` + `wave` | bottiglia di smela | a terra lancia ad arco, in aria lascia cadere (piano 5) |
| `scudo` | tommasoscudo | tasto dedicato: è tempismo, non può aspettare una direzione |
| `riflesso` | riflesso distorto | seconda pressione = scambio |

Se la wave scelta non è ancora sbloccata non succede niente (`sfx.ui()`): niente ripieghi, così il giocatore impara lo schema. Mentre il colpo risonante è in carica, `up`/`down` non cambiano wave (si decide alla pressione).

### I preset
| azione | **classico** (WASD, default) | **frecce** | **gamepad** (mappatura standard) |
|---|---|---|---|
| left / right | A / D | ← / → | levetta sinistra, croce |
| up / down | W / S | ↑ / ↓ | levetta sinistra, croce |
| jump | SPAZIO | Z | A (0) |
| attack | J, clic sinistro | X | X (2) |
| dash | K, SHIFT | C | B (1) |
| wave | L | A | Y (3) |
| scudo | I, clic destro | S | RB (5) |
| riflesso | U | D | LB (4) |
| heal (tieni) | Q | Q | RT (7) |
| eat | C | F | LT (6) |
| interact | E | E | su (premuto da fermo, vicino a qualcosa, come in HK) |
| phone | TAB, P | TAB | View/Back (8) |
| pause | ESC | ESC | Start (9) |

Nel preset classico la mano destra sta su `U I` / `J K L`: attacco, scivolata e wave sulla riga di casa, scudo e riflesso sopra. **Freccia su non salta più** in nessun preset (oggi `Player` salta anche con `cursors.up`): su è mira e interazione.

---

## 2. Architettura

### 2.1 `src/engine/input/actions.ts` — tipi, preset, salvataggio
- `Action`, `ACTIONS` (array per iterare), `PRESETS: Record<'classico' | 'frecce', Record<Action, string[]>>` con i nomi dei tasti di Phaser (`'A'`, `'SPACE'`, `'SHIFT'`, `'LEFT'`, `'TAB'`, `'ESC'`...) più due pseudo-tasti per il mouse: `'MOUSE_LEFT'`, `'MOUSE_RIGHT'`.
- `GAMEPAD: Record<Action, number[] | 'stick-left' | 'stick-right' | 'stick-up' | 'stick-down'>` (indici dei pulsanti della mappatura standard W3C; levetta con zona morta 0.35, croce = pulsanti 12–15).
- `Settings` in `src/engine/state.ts` guadagna `controls: { preset: 'classico' | 'frecce'; custom: Partial<Record<Action, string[]>> }` (default `{ preset: 'classico', custom: {} }`). `bindingsFor(action)` = `custom[action] ?? PRESETS[preset][action]`. Il merge delle impostazioni salvate si fa già per spread in `GameState` (verifica che un salvataggio vecchio senza `controls` riceva il default).

### 2.2 `src/engine/input/Input.ts` — lo stato delle azioni per fotogramma
Una classe per scena, creata da `GameScene` e passata a `Player` (e a chi altro legge input in gioco):
```ts
export class Input {
    constructor(scene: Phaser.Scene);
    /** da chiamare una volta per fotogramma, prima di Player.update */
    update(): void;
    down(a: Action): boolean;      // tenuto adesso
    pressed(a: Action): boolean;   // appena premuto in questo fotogramma
    released(a: Action): boolean;  // appena rilasciato in questo fotogramma
    /** ultimo dispositivo usato: decide quali etichette mostrare nei testi */
    get device(): 'tastiera' | 'gamepad';
    rebuild(): void;               // dopo una rimappatura
    destroy(): void;
}
```
- Tastiera: crea un `Phaser.Input.Keyboard.Key` per ogni tasto legato (con `scene.input.keyboard.addKey(name, false)`: il secondo argomento `enableCapture=false` evita di rubare TAB e SPAZIO alla pagina quando non serve; verifica come si comporta oggi TAB col telefono prima di decidere).
- Mouse: `scene.input.activePointer.leftButtonDown()/rightButtonDown()`; disattiva il menu contestuale del canvas (`scene.input.mouse?.disableContextMenu()`), perché il clic destro è lo scudo.
- Gamepad: abilita il plugin in `src/main.ts` (`input: { gamepad: true }` nella config di `Phaser.Game`), leggi `scene.input.gamepad?.getPad(0)` (o il primo connesso). `down(a)` = un tasto legato premuto **oppure** un pulsante/asse del gamepad.
- Gli stati `pressed/released` si calcolano confrontando con il fotogramma prima (non usare `Phaser.Input.Keyboard.JustDown`, che consuma lo stato e si rompe con più lettori).
- `device` diventa `'gamepad'` alla prima pressione di un pulsante del pad e torna `'tastiera'` alla prima pressione di un tasto; emetti sul bus `input-device` quando cambia (aggiungi il tipo in `src/engine/events.ts`) così HUD e testi si aggiornano.

### 2.3 `Player` legge solo azioni
In `src/entities/Player.ts`:
- togli `keys` e `cursors`; il costruttore riceve `input: Input`;
- sostituisci ogni `this.keys.X.isDown` / `JustDown` con `input.down/pressed/released`;
- il salto variabile (`jumpCutFactor`) usa `!input.down('jump')`;
- l'attacco: `input.pressed('attack')` (il clic sinistro è già un tasto di `attack`: togli il listener `pointerdown` del costruttore);
- la wave: alla `pressed('wave')` decidi la wave con `down('up')` / `down('down')`; per il risonante la carica parte alla pressione e si spara al `released('wave')`;
- scudo e riflesso: `pressed('scudo')`, `pressed('riflesso')` (lo scambio alla seconda pressione è del piano 5);
- cura: `down('heal')`; mangia: `pressed('eat')`.
`Companion` non legge input: non toccarlo.

### 2.4 Il resto del gioco
- `GameScene`: crea `this.input2 = new Input(this)` (scegli un nome che non collida con `this.input` di Phaser, es. `this.controls`) in `create`, chiama `controls.update()` in `update()` **prima** di `player.update`, distruggilo allo SHUTDOWN. Sostituisci `keydown-E` e `keydown-ESC` con `controls.pressed('interact')` e `controls.pressed('pause')` nel loop. Per il gamepad, "su" da fermo vicino a un interagibile vale come `interact` (solo se `!down('wave')` e il geco è a terra e quasi fermo, per non rubare l'attacco in alto).
- Telefono (`src/ui/phone.ts`, `onKey`): oggi apre con `Tab`/`KeyP`. Deve leggere le stesse impostazioni: crea in `actions.ts` una funzione `matchesAction(e: KeyboardEvent, a: Action): boolean` che confronta `e.code` con i tasti legati (serve una tabella di conversione tra nomi di Phaser e `KeyboardEvent.code`: `'TAB' → 'Tab'`, `'P' → 'KeyP'`, `'SPACE' → 'Space'`, `'ESC' → 'Escape'`, lettere `'X' → 'KeyX'`, frecce `'LEFT' → 'ArrowLeft'`...). Usala nel telefono per `phone` e `pause`.
- Dialoghi (`src/ui/dialogue.ts`) e flashback (`FlashbackManager`): avanzano con E/SPAZIO/INVIO. Aggiungi anche `jump`, `attack` e `interact` del preset attivo (così chi gioca con le frecce avanza con Z o X), sempre via `matchesAction`.

### 2.5 Il gamepad nei menu (ponte)
Menu, pausa, morte, telefono, dialoghi e scelte sono DOM con ascoltatori `keydown` su `window` (frecce, Invio, Esc, Tab). Invece di riscriverli, crea `src/engine/input/padBridge.ts`: un piccolo ciclo (`requestAnimationFrame`) che legge `navigator.getGamepads()` e, **solo quando un'interfaccia DOM ha il controllo**, trasforma i pulsanti in eventi tastiera sintetici su `window`:
| pad | evento |
|---|---|
| croce / levetta (con ripetizione a 180 ms) | `ArrowUp/Down/Left/Right` |
| A | `Enter` |
| B | `Escape` |
| View/Back | `Tab` |
| Start | `Escape` |
```ts
window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', key: 'Enter', bubbles: true }));
```
"Un'interfaccia DOM ha il controllo" = c'è un overlay di `Screens` aperto, il telefono è aperto (`phone.isOpen`), o un dialogo è aperto (`dialogue.open`). Avvia il ponte in `src/main.ts`, dove queste tre istanze esistono già, passando una funzione `uiActive()`. In gioco il ponte non fa niente (il pad lo legge `Input`), così gli eventi sintetici non arrivano mai a Phaser durante l'azione.

---

## 3. I testi mostrano i tasti veri

### 3.1 Segnaposto
Nei testi si scrive `{k:azione}` (es. `{k:dash}`, `{k:wave}`) o una combinazione `{k:up}+{k:wave}`. Crea `src/engine/input/keyText.ts`:
```ts
/** l'etichetta del primo tasto legato all'azione, per il dispositivo in uso */
export function keyLabel(a: Action): string;
/** sostituisce {k:azione} con l'etichetta del tasto, in maiuscolo come le altre etichette */
export function formatKeys(text: string): string {
    return text.replace(/\{k:([a-z]+)\}/g, (_, a) => keyLabel(a as Action));
}
```
Etichette leggibili: `SPAZIO`, `SHIFT`, `TAB`, `ESC`, `↑ ↓ ← →`, `CLIC`, per il pad `A`, `B`, `X`, `Y`, `LB`, `RB`, `LT`, `RT`, `START`, `VIEW`. Il dispositivo viene da `Input.device` (tienilo anche in una variabile di modulo aggiornata dall'evento `input-device`, così i moduli DOM non dipendono dalla scena).

### 3.2 Dove si applica (centralmente, non riga per riga)
- `src/ui/dialogue.ts`: sul testo di ogni riga prima della macchina da scrivere.
- `src/ui/screens.ts`: `toast(text)`, `wavesung(sender, text)`, `abilityCard`, `charmCard`.
- `src/ui/phone.ts`: nella resa dei messaggi (lo storico in `save.messages` conserva il testo **con** i segnaposto, così una rimappatura aggiorna anche i messaggi vecchi), del diario/obiettivi e delle chiamate.
- `src/ui/subtitles.ts`: sui `bark`.
- `src/ui/hud.ts`: le chip delle wave mostrano `keyLabel`: risonante `{k:wave}`, analisi `{k:up}+{k:wave}`, bottiglia `{k:down}+{k:wave}`, scudo `{k:scudo}`, riflesso `{k:riflesso}`; si aggiornano su `input-device` e dopo una rimappatura.

### 3.3 I testi da convertire (cerca e sostituisci)
```bash
grep -rn "SHIFT\|SPAZIO\|TAB\|(G)\|(V)\|(H)\|(R)\|tieni premuto F\|carica F\|W + attacco\|GIÙ + attacco\|J o mouse\|A/D" src/content src/ui src/scenes
```
Esempi:
- `'markolino-intro'`: `'{k:left}/{k:right} per muoverti, {k:jump} per saltare, {k:attack} per menare. {k:phone} apre il telefono. i microfoni salvano con {k:interact}.'`
- `LESSONS.citelis.hint`: `'... SCIVOLA attraverso la carica ({k:dash}) ...'`; `pendolare`: `'... salta sopra e premi {k:down} + {k:attack} in aria: pogo ...'`; `specchietto`: `'... colpisci in alto ({k:up} + {k:attack}) ...'`; `ammiratore`: `'... evoca il riflesso ({k:riflesso}) ...'`; `bottiglia`: `'... lancia la bottiglia ({k:down}+{k:wave}) dove passano ...'`; `numero`: `'... analisi ({k:up}+{k:wave}) ...'`; `telecamera`: `'... tommasoscudo ({k:scudo}) appena prima del colpo ...'`.
- `WAVESUNG.markolinoPogo`, `markolinoRisonante`; `CONTACTS.markolino` (tecnokill, stabilimento); `OBJECTIVES` che nominano tasti.
- `ABILITY_CARDS`: il campo `key` diventa la stringa con segnaposto (`'{k:dash}'`, `'{k:jump} ×2'`, `'{k:jump} sul muro'`, `'{k:riflesso}'`, `'{k:wave} (tieni)'`, `'passiva'`, `'{k:up}+{k:wave}'`, `'{k:scudo}'`, `'{k:down}+{k:wave}'`) e `abilityCard` lo passa in `formatKeys`.
- il toast dello schianto in `GameScene` (`'schianto! attacca mentre cadi...'`): aggiungi `{k:attack}`.
- `charmCard`: `'si indossa dal telefono ({k:phone}), vicino a un microfono.'`.
- il toast dei nascondigli della tana (piano 4): `'un armadio. {k:interact} per nasconderti.'`.
- `src/ui/phone.ts`, sezione "comandi del telefono" nelle impostazioni: usa `keyLabel`.

---

## 4. La schermata comandi (rimappatura)

`src/ui/screens.ts`, `showControls` (oggi una griglia fissa da `CONTROLS`). Usa la skill `frontend-design` e lo stile esistente delle schermate (`sx-*`, `design_system.md`). Contenuto:
1. selettore del **preset** (classico / frecce) in alto; cambiarlo azzera le personalizzazioni dopo conferma;
2. una riga per azione, raggruppate: **movimento** (sinistra, destra, su, giù, salto, scivolata), **combattimento** (attacco, wave, scudo, riflesso, cura), **altro** (mangia, interagisci, telefono, pausa). Ogni riga: nome dell'azione in italiano minuscolo, tasti legati come `kbd`, e un pulsante "cambia";
3. "cambia" → la riga mostra `premi un tasto…`, il prossimo `keydown` (o clic del mouse sui pseudo-tasti) diventa il tasto dell'azione; ESC annulla. **Conflitti**: se il tasto era già di un'altra azione, i due si scambiano e la riga dell'altra lampeggia;
4. sotto, lo **schema delle wave** spiegato in una riga per wave (con `formatKeys`) e la tabella del **gamepad** in sola lettura;
5. "ripristina il preset".
Salva con `state.persistSettings()` (esiste già) e chiama `Input.rebuild()` sull'istanza viva (via bus: evento `controls-changed`).
Togli l'array `CONTROLS`: la schermata si costruisce da `ACTIONS` e dalle etichette.

La stessa schermata si apre dal menu principale e dalla pausa (oggi è così: `showControls(back, fromPause)`). La sezione "comandi del telefono" nelle impostazioni del telefono resta, ma con `keyLabel`.

---

## 5. Verifica
1. `npm run build` e `cd editor && npx tsc -b --noEmit`.
2. Nessuna lettura di tasti fisici fuori da `src/engine/input/`, dai dialoghi/flashback/telefono via `matchesAction`, e dal ponte:
   ```bash
   grep -rn "addKey\|createCursorKeys\|JustDown\|keydown-" src
   ```
   (deve trovare solo `src/engine/input/`).
3. Nessun tasto scritto a mano nei testi:
   ```bash
   grep -rn "SHIFT\|SPAZIO\|(G)\|(V)\|(H)\|(R)\|tieni premuto F" src/content src/ui
   ```
4. Ragiona su questi casi e scrivi nel resoconto come li hai coperti: TAB col telefono aperto e chiuso; ESC che chiude il telefono e non apre la pausa nello stesso fotogramma; clic destro sullo scudo senza menu contestuale; rimappare `jump` su un tasto già usato da `attack`; gamepad scollegato a metà partita; dialogo aperto mentre si tiene premuto `wave` (il risonante non deve partire al rilascio dentro il dialogo: la scena è in pausa durante i dialoghi, verifica).
5. Con il permesso dell'utente, prova in browser con tastiera e, se ce l'ha, con un pad. Senza permesso, dichiaralo.
6. `DEV_LOG.md`: ADR nuovo "i comandi sono azioni" (architettura, preset, ponte del pad, segnaposto).
7. Commit per fasi: `comandi ad azioni`, poi `si gioca anche col pad`, poi `comandi personalizzabili`.

## Cosa NON fare
- Non cambiare cosa fanno le abilità (piano 5) né aggiungerne.
- Non lasciare testi con tasti scritti a mano.
- Non far saltare la freccia su.
