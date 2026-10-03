# Piano 9 — il nucleo che si raddrizza

> Prima leggi `plans/00-INDEX.md`. Questo è l'ultimo piano della sequenza: richiede il canone/void dei piani 1–3 e le abilità del piano 5. Non aggiunge una nuova scelta, un nuovo finale o un nuovo mistero. Fa sentire nel corpo del giocatore ciò che il void ha già stabilito: l'ordine di Lametta non sta “riparando” il realm, lo sta rendendo dritto, chiuso e morto.

## Obiettivo

Al nucleo il finale oggi è narrativamente solido: il geco ricorda a Pedro il giorno 30, affronta l'ordine incarnato in `glitchpedro`, poi sceglie a chi affidare le wave. Il livello però continua ad assomigliare al resto del platform: qualche `F`, qualche `%`, nemici e arena. La frase “il realm si sta raddrizzando” resta soprattutto testo.

Durante il combattimento col glitch, il nucleo deve cambiare in tre fasi visibili e giocabili:

1. le superfici irregolari vengono tirate in linee dure, i cavi si allineano e il suono perde aria;
2. i muri finti (`F`) smettono di lasciar intuire un dietro: diventano pareti dichiarate; i 33 azzurri si spengono;
3. non restano segreti né scorciatoie nel campo dell'ordine: l'arena è leggibile, severa e povera. Il giocatore deve battere l'ordine usando le wave, non cercando un buco nel muro.

Quando `glitchpedro` cade, la trasformazione si spezza in ordine inverso: torna la luce sporca, le linee ricominciano a tremare e un singolo 33 si riaccende vicino a Pedro. Non rendere il finale “pulito”: il riscatto vale perché lascia spazio allo storto.

## Vincoli di design e sicurezza

1. Trasformare l'arena non deve intrappolare il player, chiudere la porta d'ingresso, mettergli una collisione addosso o rendere impossibile schivare un attacco. È una meccanica finale, non una morte casuale.
2. Non modificare la griglia o i JSON a runtime. Il salvataggio resta compatibile e un reload del nucleo ricostruisce il suo stato dalla fase del boss, non da una mutazione permanente del file.
3. L'ordine può eliminare **segreti nell'arena del boss**, non pickup già raccolti, lore, maschere, quest o segreti di altre regioni. Non usare il sistema per togliere contenuti al giocatore.
4. Le tre fasi devono essere sincronizzate alla vita di `glitchpedro`, non a timer casuali. La UI/bark anticipa ogni cambio di 600 ms circa.
5. I tre finali/esiti esistenti e il requisito del `giorno30` restano invariati. Questo piano modifica staging, combattimento e copy, non le condizioni delle scelte.
6. Evitare i cerchi `Graphics` generici. Il nucleo usa inchiostro, cavi, CRT e glitch: il “dritto” deve sembrare un CAD freddo che invade un disegno a mano.

## Stato attuale da preservare

- `GameScene.giorno30()` spegne Pedro, conserva `pedroShell`, crea `glitchpedro`, poi `setupBossColliders()`.
- `Boss.phase` è già `1 | 2 | 3` secondo HP; `glitchpedro` ha 120 HP e pattern in `src/content/bosses.ts`.
- il `TerrainRenderer` disegna i muri finti da `F`; `LevelLoader` crea `level.fakeWalls` separatamente. `TrentatreMarks` mette i 33 su muri finti e rompibili.
- `GameScene` crea già `arenaBars` solo dentro una stanza arena e ripulisce gran parte dello stato nel reset manuale di `create`.
- `level14-nucleo.ts` usa il bioma `core` e non ha uscita di capitolo; non cambiare la topologia del finale per aggiungere una stanza fatta a mano.

## Architettura e file

| file | responsabilità |
|---|---|
| `src/engine/NucleusStraightening.ts` | macchina a stati della trasformazione, render, filtraggio sicuro delle pareti finte e cleanup |
| `src/engine/TerrainRenderer.ts` | API pubblica e stretta per rendere reali o liberare soltanto gruppi di muri finti selezionati |
| `src/engine/TrentatreMarks.ts` | API per spegnere/ripristinare i segni nella zona trasformata senza distruggere quelli di altri capitoli |
| `src/engine/music.ts` | lieve filtro/volume del nucleo per fase, senza rimpiazzare la traccia |
| `src/engine/sfx.ts` | due effetti brevi: allineamento e rottura dell'ordine |
| `src/scenes/GameScene.ts` | crea il manager soltanto nel nucleo, inoltra fase boss, blocca le attivazioni non sicure, pulisce allo shutdown |
| `src/content/barks.ts`, `src/content/story.ts` | tre segnali concisi dell'ordine e una riga dopo la rottura |
| `src/content/biomes.ts` (solo se necessario) | colori/tinte del core, non una seconda definizione di bioma |
| `DEV_LOG.md` | ADR e cronologia |

Non aggiungere un manager generico “world corruption” per una sola sequenza. Il nucleo è specifico; una classe precisa è più leggibile e non infetta i quindici capitoli precedenti.

## 1. La grammatica della trasformazione

### 1.1 Tre fasi

`NucleusStraightening` ha `phase: 0 | 1 | 2 | 3` e una soglia applicata una sola volta. La fase dipende da `glitchpedro.phase`, ma non fidarsi del nome della fase senza controllare che `boss.def.kind === 'glitchpedro'`.

| stato | soglia | cosa cambia | gameplay |
|---|---:|---|---|
| 0 — storto | prima che l'ordine si ingaggi | core normale: cavi obliqui, tratteggio, 33 normali | niente |
| 1 — allinea | HP <= 80 (inizio phase 2) | le superfici dell'arena ricevono una sovralinea bianco-ciano perfettamente orizzontale; cavi e particelle smettono di oscillare | telegraph di 650 ms, poi il boss ottiene il suo normale pattern phase 2; nessuna collisione nuova |
| 2 — chiude | HP <= 40 (inizio phase 3) | solo i muri `F` **dentro l'arena del boss** diventano visibili/opachi, quadrati e con bordo rosso; i 33 associati svaniscono | quelle false pareti acquistano collisione dopo un preavviso; il campo perde gli eventuali shortcut, ma mantiene sempre due corridoi di movimento |
| 3 — dritto | 0 < HP <= 18 | overlay di griglia sottile, colori quasi desaturati, nessun alone dei 33, musica filtrata | l'ordine fa una sola “riga” di proiettili all'attivazione, con tre aperture larghe; poi nessuna ulteriore geometria si muove |
| rotto | `glitchpedro` sconfitto | griglia si spezza, muri tornano falsi, cavi riprendono variazione, un 33 torna per un attimo | nessun danno e nessuna collisione che cambia sotto i piedi |

Le soglie sono basate sugli attuali 120 HP. Non scrivere `80`, `40`, `18` in più file: esporre al manager `transitionFor(hp, maxHp)` con rapporti `2/3`, `1/3`, `0.15`, così un riequilibrio del boss non spezza lo staging.

### 1.2 Il campo “dritto” non può softlockare

L'ordine non genera muri dal nulla. Si limita a tre cose sicure:

1. **Sovralinee decorative** sopra superfici già solide: nessun cambiamento nav/collisione;
2. **muri finti già esistenti** all'interno del rettangolo della boss arena: la loro collisione viene attivata soltanto se non sovrappongono player/boss e se non chiudono un varco dell'arena;
3. **riga di proiettili** una sola volta a phase 3: usa l'infrastruttura `enemy-shoot` esistente, con tre gap di almeno 96 px. È un attacco da schivare, non una parete.

Prima di rendere solido ciascun `F`, `NucleusStraightening` deve verificare tutti questi predicati:

```ts
const playerBox = player.getBounds();
const bossBox = boss.getBounds();
const wallBox = wall.getBounds();
const nearDoor = arenaDoorRects.some((door) => Phaser.Geom.Intersects.RectangleToRectangle(wallBox, door));
const overlapsActor = Phaser.Geom.Intersects.RectangleToRectangle(wallBox, playerBox)
    || Phaser.Geom.Intersects.RectangleToRectangle(wallBox, bossBox);
const inArena = Phaser.Geom.Intersects.RectangleToRectangle(wallBox, arenaBounds);
if (!inArena || nearDoor || overlapsActor) keepFake(wall);
```

`arenaDoorRects` deve riusare la logica di `GameScene.doorRects`, non calcolare “vicino alla porta” con coordinate ad hoc. Se non esiste `arenaRoom` perché il boss è in un capitolo lineare, non attivare mai la trasformazione: il piano vale soltanto nel nucleo con layout/arena validi. Se il nucleo corrente non contiene abbastanza `F` sicuri, la fase 2 resta visiva: **non aggiungere blocchi artificiali per compensare**.

## 2. `NucleusStraightening.ts`

### 2.1 Interfaccia

```ts
export interface NucleusStraighteningContext {
    scene: Phaser.Scene;
    player: Player;
    terrain: TerrainRenderer;
    marks: TrentatreMarks;
    fakeWalls: Phaser.Physics.Arcade.StaticGroup;
    arenaBounds: Phaser.Geom.Rectangle;
    arenaDoorRects: readonly Phaser.Geom.Rectangle[];
    music: typeof music;
    emitOrderShot: (x: number, y: number, tx: number, ty: number) => void;
}

export class NucleusStraightening {
    constructor(ctx: NucleusStraighteningContext);
    update(time: number, boss: Boss | null): void;
    shatter(): void;
    destroy(): void;
}
```

Il manager non crea/controlla il boss e non decide dialoghi/finali. Riceve un `Boss | null`, ignora tutto ciò che non è `glitchpedro` attivo/engaged e non usa `state.hasFlag` come stato della fase. In questo modo `giorno30()` può creare il manager subito dopo `setupBossColliders()` e una morte/restart non lascia flags irreversibili.

Campi necessari:

```ts
private phase: 0 | 1 | 2 | 3 = 0;
private pendingPhase: 1 | 2 | 3 | null = null;
private activateAt = 0;
private straightOverlay: Phaser.GameObjects.Graphics;
private gridOverlay: Phaser.GameObjects.Graphics;
private selectedWalls: Phaser.Physics.Arcade.Sprite[] = [];
private collider: Phaser.Physics.Arcade.Collider | null = null;
private phase3ShotDone = false;
private shattered = false;
```

Tutti i campi con timer o visual vanno azzerati/distrutti anche in `destroy`; `GameScene.create` deve rimettere `this.nucleusStraightening = null`, come impone il gotcha di `HANDOFF.md`.

### 2.2 Ritmo di una transizione

Quando la soglia sale, non cambiare il mondo nello stesso frame:

1. `queue(nextPhase, boss)` memorizza la fase e `activateAt = now + 650`; emette una sola `bark` dell'ordine e disegna la preview; 
2. per 650 ms, le linee dell'overlay convergono verso assi orizzontali/verticali; suona `sfx.straighten()` una volta, con un beep che scende di intonazione;
3. a `activateAt`, applica la fase e chiama `sfx.orderLock()`; camera shake massimo `0.004` per 130 ms, non più forte della lettura del combattimento;
4. non mettere il gioco in pausa e non stordire il player. Il telegraph deve essere giocabile.

Se il boss perde abbastanza HP da attraversare due soglie durante un hitstop, accodare prima phase 1, poi phase 2: non saltare direttamente alla parete solida senza anticipazione. Se il boss muore mentre una fase è in preview, annullare la preview e chiamare `shatter()`.

### 2.3 Rendering

`straightOverlay` si limita ad `arenaBounds` e ha profondità tra terreno e combattenti (circa `4.7`; confrontare le profondità reali prima di fissarla). Disegna:

- phase 1: segmenti di linea di 4 px, `0xa5f3fc`, alpha 0.35, per ogni bordo superiore di piattaforma già solida nel rettangolo; niente fill;
- phase 2: le stesse linee diventano bianche e perfettamente rettilinee, più tre cavi verticali senza oscillazione;
- phase 3: griglia 32 px `0xf8fafc` alpha 0.10 sopra la scena, bordi rossi `0xf87171` alpha 0.5 sulle pareti selezionate, e una vignetta quasi nera alpha massimo 0.12.

Per trovare i bordi di piattaforma, scansionare solo celle del `NavGraph`/griglia nell'`arenaBounds` che sono solide con aria sopra. Coalescere celle adiacenti in segmenti: non disegnare una linea separata per tile. Il manager deve ricevere una funzione `solid(c, r)` da `GameScene` o un `grid` readonly, non accedere a privati del nav tramite cast.

`TerrainRenderer` aggiunge due API con responsabilità stretta:

```ts
straightenFakeWalls(walls: readonly Phaser.Physics.Arcade.Sprite[]): void;
releaseStraightenedWalls(walls: readonly Phaser.Physics.Arcade.Sprite[]): void;
```

La prima rende opache le sole `fakeRegions` che condividono una cella con le sprite selezionate e le ridisegna col tratteggio regolare/colore del core; la seconda fa il tween inverso solo quando la sequenza si spezza. Non rendere globali tutti i `F` del nucleo e non cambiare `updateReveal` per gli altri capitoli.

`TrentatreMarks` aggiunge:

```ts
extinguishWalls(walls: readonly Phaser.Physics.Arcade.Sprite[]): void;
restoreExtinguished(): void;
```

La prima filtra i mark che condividono una delle wall sprite, salva l'alpha iniziale e fa un tween a zero; non mette `gone = true`, perché non sono stati rotti. La seconda li riaccende con alpha 0 → alpha iniziale e un unico piccolo glow. `destroy()` resta sicuro anche se una sprite è già stata distrutta.

### 2.4 Collisioni dei muri finti

Oggi `LevelLoader` costruisce il gruppo `fakeWalls`, ma il nucleo non deve assumere che esso abbia già il collider del player. Quando phase 2 passa i predicati, creare un unico collider:

```ts
this.collider = scene.physics.add.collider(player, selectedWallGroup);
```

Usare un gruppo statico privato `selectedWallGroup` e inserirvi solo le pareti approvate; non passare l'intero `level.fakeWalls`. Alla distruzione/rottura, `collider.destroy()` e `selectedWallGroup.clear(false, false)` devono lasciare intatte le sprite del livello. La loro fisica viene semplicemente disabilitata/ripristinata attraverso un piccolo adapter esplicito, mai `destroy()` su un muro necessario al reload.

Prima dell'attivazione le pareti selezionate restano non collidenti; phase 2 chiama `terrain.straightenFakeWalls`, accende i body e crea il collider. In `shatter`, il collider sparisce **prima** della transizione grafica inversa. Questo significa che la morte dell'ordine non può mai chiudere il geco in un rettangolo.

## 3. Collegamento a `GameScene` e al finale

### 3.1 Creazione e ciclo

1. Aggiungi `private nucleusStraightening: NucleusStraightening | null = null` insieme allo stato del finale.
2. In `create`, dopo gli altri reset del finale, assegnare `null`; nello SHUTDOWN chiamare `destroy()`.
3. In `giorno30()`, dopo `this.boss = this.makeBoss(..., 'glitchpedro')`, `lightBoss` e `setupBossColliders`, creare il manager soltanto se ci sono `layout`, `arenaRoom` e una `RoomKind === 'arena'` che contiene il boss. Se non ci sono, loggare un warning in development e continuare il combattimento invariato.
4. Nel `update`, subito dopo `this.boss?.update(...)`, chiamare `this.nucleusStraightening?.update(time, this.boss)`.
5. Nel ramo `case 'glitchpedro'` di `onBossDefeated`, chiamare `this.nucleusStraightening?.shatter()` **prima** di `state.setFlag('pedro-redento')` e prima del dialogo `pedro-redento`.

Il manager non va creato per `pedro`, `dei`, patto o doomsday: l'ordine è `glitchpedro`, non ogni nemico di fine gioco.

### 3.2 La riga dell'ordine

Alla prima attivazione di phase 3, `emitOrderShot` crea una singola salva orizzontale da uno dei lati dell'arena con tre corsie/gap. Riusa `GameScene.onEnemyShoot` o estrai un helper che produca la stessa `enemyProjectiles` collisione; non creare proiettili che bypassano lo scudo, i frame invulnerabili o il cleanup attuale.

Formula concreta: dividere il lato praticabile dell'arena in 7 colonne uguali, sparare 4 proiettili/linee nelle colonne 0, 1, 3 e 5, lasciando 2, 4 e 6 vuote; velocità 360 px/s, telegraph rosso 550 ms. Prima di scegliere il lato, usare quello opposto al player, così i colpi attraversano il campo invece di nascere sulla sua hitbox. Se il calcolo dell'arena non lascia almeno 7 colonne da 32 px, non fare la salva: una trasformazione visiva è meglio di una geometria sbagliata.

### 3.3 Testo e audio

In `barks.ts`, sotto `ordine`/`glitchpedro`, aggiungere una linea per soglia, non più:

```ts
'straight-1': ['linee irregolari rilevate. correzione.'],
'straight-2': ['muri finti rilevati. resi veri.'],
'straight-3': ['segreti rilevati. rimossi.'],
'straight-break': ['...errore. il realm non resta in riga.'],
```

Il commento umano non deve dire cosa il geco prova. In `story.ts`, `pedro-redento` può sostituire la riga del geco che pensa con silenzio/staging (il piano 2 già vieta spiegoni del geco): Pedro basta da solo. Non aggiungere un dialogo esplicativo per ogni fase.

In `music.ts` aggiungere `setOrder(amount: 0 | 1 | 2 | 3)`: applica un low-pass graduale (phase 1: 8 kHz, 2: 4.5 kHz, 3: 2.8 kHz) e una riduzione lieve della componente ambiente; `setOrder(0)` ripristina. Rispettare la radio e `setNight`: un solo grafo audio deve calcolare il filtro finale, non filtri che si sovrascrivono. Se WebAudio non è disponibile, il gioco continua senza filtro.

In `sfx.ts`, `straighten` è un tono rettangolare breve + click metallico; `orderLock` è un colpo grave digitale; `orderBreak` è lo stesso materiale riprodotto al contrario/spezzato. Nessun asset remoto e nessuna nuova dipendenza.

## 4. Sequenza di lavoro

### Fase A — API senza cambiare il finale

1. Leggi e mappa gli `F` reali nel JSON del nucleo, la stanza arena che contiene il boss, porte e corridoi. Scrivi nel resoconto quante pareti finte sono realmente candidate; non assumere che le lettere del file sorgente coincidano con la regione JSON.
2. Aggiungi API selettive a `TerrainRenderer` e `TrentatreMarks`, con cleanup e nessun effetto fuori dal nucleo.
3. Crea `NucleusStraightening` con solo phase 1 visuale e testalo attraverso un boss fittizio/valori soglia nel codice, senza toccare `sceltaFinale`.
4. Commit: `il nucleo inizia a raddrizzarsi`.

### Fase B — fasi sicure e rottura

1. Implementa selezione delle pareti finte con i predicati di sicurezza, collider privato e fase 2.
2. Implementa phase 3, salva a gap e `shatter` inverso.
3. Collega costruzione, update e sconfitta `glitchpedro` in `GameScene`; confermare che patto, Pedro normale e dei non costruiscano il manager.
4. Commit: `l'ordine chiude il nucleo`.

### Fase C — tono e bilanciamento

1. Aggiungi bark, audio e filtro musicale; verificare che il fallback senza WebAudio non generi eccezioni.
2. Rimuovi solo il pensiero esplicativo del geco se ancora presente nei dialoghi del riscatto; non riscrivere gli altri finali.
3. Controlla i tempi: il telegraph deve essere leggibile sopra hitstop/flash e la nuova salva non può sovrapporsi con un `boss.busy`/attacco già iniziato.
4. Commit: `il nucleo torna storto`.

## 5. Verifica obbligatoria

1. `npm run build` e `cd editor && npx tsc -b --noEmit`.
2. Ispezione dei dati: eseguire `scripts/world/run.sh simcheck nucleo`; l'uscita non esiste per design, quindi documentare l'esito del simulatore senza forzarlo a pretendere una `X`. Verificare esplicitamente che il JSON caricato contenga la stessa arena/F analizzati nella fase A.
3. Grep: `rg "straightenFakeWalls|extinguishWalls|NucleusStraightening" src` deve mostrare chiamate selettive, non un uso dell'intero `fakeWalls` senza filtro.
4. Casi da ragionare e riportare:
   - nuovo boss `glitchpedro`, tutte le tre soglie in ordine;
   - colpo che porta da >2/3 a <1/3 HP nello stesso frame: phase 1 e 2 mantengono entrambe il preavviso;
   - player o boss sovrapposto a un F candidato: quel muro non diventa solido;
   - F che tocca un varco arena: non diventa solido;
   - nessun F sicuro: fase 2 è visuale e il combattimento resta finibile;
   - morte/restart nel mezzo di phase 2: nuova scena senza collider fantasma, musica normale e 33 normali;
   - sconfitta glitchpedro durante un telegraph: `shatter` annulla preview/salva, rilassa collisioni e ripristina audio;
   - percorso patto e finale dei: nessuna trasformazione del nucleo;
   - scudo perfetto/abilità del piano 5 contro la riga di proiettili: comportamento identico a ogni altro `enemyProjectiles`.
5. Con consenso esplicito dell'utente, provare in browser il ramo giorno 30 fino a riscatto, una morte/reload dopo phase 2 e il ramo patto. Senza consenso non usare browser e dichiarare il limite.
6. `DEV_LOG.md`: ADR nuovo `l'ordine raddrizza il nucleo`. Registrare: tre soglie in rapporto HP, solo F sicuri dell'arena, niente JSON mutato, marker 33 spenti/ripristinati e condizioni anti-softlock. Aggiungere Cronologia.

## Cosa NON fare

- Non cambiare le condizioni del finale vero, la scelta delle wave o gli ending card oltre alla rimozione dello spiegone del geco già vietato.
- Non rendere reali tutti i muri finti del gioco o del nucleo senza filtro d'arena.
- Non far sparire per sempre un 33/pickup da un save perché Pedro ha iniziato la trasformazione.
- Non aggiungere una nuova boss arena, una nuova valuta, un minigioco o un secondo boss.
- Non usare una transizione soltanto cosmetica: la fase 2 deve chiudere solo i falsi passaggi sicuri e la fase 3 deve avere la riga schivabile; allo stesso tempo non sacrificare mai la finibilità del combattimento.
