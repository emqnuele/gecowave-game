# Piano 7 — sigilli delle abilità nel mondo, ritorno e mappa

> Prima leggi `plans/00-INDEX.md`. I piani 5 e 6 devono essere già completi: questo piano usa l'evento di scena `wave-world`, le nuove azioni di input e le wave rifatte. **Non disegnare stanze a mano e non sostituire il generatore.** Le regioni procedurali restano quelle che sono: i sigilli si agganciano a porte di stanze laterali e a `layout.spots`, cioè punti già verificati dal simulatore.

## Obiettivo

Un frammento non deve limitarsi ad aggiungere un'icona nell'HUD. Ogni abilità deve dare al giocatore una frase concreta: “ora posso tornare lì”. Il mondo già ha due buone fondamenta:

- `src/world/gates.ts` crea mensole per il rimbalzo e camini per l'aggrappo, verificati dal simulatore;
- `public/regions/*.json` contiene le stanze laterali, i varchi e `layout.spots`; la mappa del telefono sa già mostrare stanze visitate e porte;
- il piano 5 emette `wave-world` quando una wave tocca lo scenario.

Manca il livello che collega queste tre cose. Costruiscilo qui, senza rendere mai obbligatorio un ritorno per finire la storia e senza trasformare il gioco in una caccia a nove chiavi.

Il risultato è un sistema di **sigilli**: una porta verso una stanza laterale contiene una piccola situazione leggibile, marchiata da un `33` azzurro. Il giocatore vede la ricompensa, capisce quale capacità la risolve, torna quando la possiede e riceve un premio permanente o utile. I sigilli sono sempre opzionali; il percorso critico e le uscite restano attraversabili con le abilità previste dal capitolo.

## Contratto di design (non derogare)

1. Non esistono nuovi frammenti, valute, consumabili o `AbilityId`. I nove frammenti esistenti restano dove sono.
2. Un sigillo non blocca mai una porta con `pathIndex >= 0`, una boss arena, un microfono, un NPC di trama, un'uscita, una fermata o una quest. Chi non torna deve poter vedere il finale.
3. Ogni sigillo ha una sola soluzione primaria; non accettare “basta attaccare abbastanza”. Gli attacchi normali, il pogo e lo schianto non devono aprirlo per caso.
4. Il premio è visibile prima di aprire e viene consegnato una sola volta. Usare le chiavi persistenti esistenti (`collectedLore` e `flags`), non un secondo inventario.
5. Il `33` qui è un indizio lasciato dall'1% di Pedro: “dietro c'è qualcosa”. Non diventa una nuova valuta, una checklist narrativa o una spiegazione parlata.
6. Non rigenerare continuamente il mondo durante lo sviluppo. Si modifica il generatore, si genera **una volta** alla fine, poi si verifica il JSON prodotto. La rigenerazione completa è richiesta da questo piano perché la metadata dei cancelli fisici deve entrare nei JSON; avvisa l'utente prima di lanciare `npm run regions`, perché può durare decine di minuti.

## Esperienza del giocatore

| abilità | cosa vede nel mondo | azione che la apre | regione da rivisitare | premio |
|---|---|---|---|---|
| `scivolata` | cortina di glitch a righe, bassa | attraversarla in scivolata | perduta, appena preso il frammento | 60 barre |
| `rimbalzo` | mensola alta con un 33 e una tacca | doppio salto; usa il cancello fisico già verificato | perduta | tacca |
| `riflesso` | piastra gemella e porta a specchio | lasciare il clone sulla piastra per 650 ms | bus | amuleto `specchio` se esiste già, altrimenti 90 barre |
| `risonante` | parete che vibra e linee d'onda | onda di livello 2 o 3 | santuario | cuore |
| `rigenerazione` | corridoio di miasma verde, con cuore spento | restare vivo nella nube; la cura passiva lo purifica | trenbolone | 90 barre |
| `aggrappo` | camino con graffi e 33 in cima | arrampicata; usa il camino fisico già verificato | bus | cuore |
| `acquatossica` | crosta “PREMIUM” che cola | impatto della bottiglia / pozza | rio | amuleto già definito, altrimenti tacca |
| `analisi` | porta teorema con tre segni incompleti | `q.e.d.` dentro il cerchio | ruhra | cuore |
| `scudo` | lucchetto a fotocellula e raggio lento | rimando perfetto (livello 2) nel ricevitore | sorveglianza | 120 barre |

La riga “amuleto se esiste già” non autorizza a inventarne uno: l'esecutore deve leggere `src/content/items.ts`. Se non trova un amuleto narrativamente e meccanicamente coerente non già usato come premio unico, usi il premio alternativo indicato. Prima di scegliere deve cercare tutte le chiamate a `spawnItemPickup` e gli ID posseduti dai salvataggi, per non duplicare un amuleto di boss.

I nove luoghi sopra sono una distribuzione intenzionale: il primo insegna che le capacità possono aprire subito il mondo; il centro della campagna manda indietro verso bus/santuario; quelli successivi rendono le wave avanzate più che attacchi. `acquatossica` resta facoltativa come lo stabilimento: anche il suo sigillo è un extra, mai un blocco della ruhra.

## Architettura e file

| file | responsabilità |
|---|---|
| `src/world/types.ts` | tipi serializzabili dei sigilli e metadata dei cancelli fisici nel `RegionLayout` |
| `src/world/gates.ts` | restituisce le coordinate e l'abilità richiesta dai camini/mensole che già costruisce |
| `scripts/world/seals.ts` | arricchisce i JSON già generati scegliendo porte laterali e spot validi in modo deterministico |
| `scripts/world/build-regions.ts` | salva i `abilityGates` prodotti dal generatore; non decide gameplay dei sigilli dinamici |
| `src/engine/AbilitySeals.ts` | un solo manager runtime: rendering, collisioni, ascolto di `wave-world`, premi, pulizia |
| `src/scenes/GameScene.ts` | crea, aggiorna e distrugge il manager; gli passa i gruppi e le funzioni di premio già esistenti |
| `src/engine/regionView.ts` | espone i marker dei sigilli alla mappa, senza mutare il layout |
| `src/ui/phone.ts` e `src/ui/phone.css` | disegnano un piccolo 33/lucchetto nella stanza esplorata, spento quando il sigillo è risolto |
| `src/content/story.ts` | al massimo una nota Wavesung di Markolino la prima volta che si scopre un sigillo; nessun tutorial per ogni tipo |
| `DEV_LOG.md` | ADR e cronologia richiesti dall'indice |

Non mettere dati di sigillo nelle griglie di `src/content/levels/*.ts`: a runtime conta la legenda contenuta nel JSON. Non mettere coordinate pixel hardcoded in `GameScene`: cambiano ogni volta che il generatore sposta una stanza.

## 1. Dati serializzati e generazione

### 1.1 Tipi in `src/world/types.ts`

Aggiungi questi tipi vicino a `Room` e `RegionLayout`. Sono dati puri, quindi possono stare nel JSON senza importare Phaser.

```ts
import type { AbilityId } from '../types';

export type SealKind =
    | 'cortina' | 'rimbalzo' | 'specchio' | 'risonanza' | 'miasma'
    | 'camino' | 'resina' | 'teorema' | 'ricevitore';

export type SealReward =
    | { kind: 'barre'; amount: number }
    | { kind: 'cuore' }
    | { kind: 'tacca' }
    | { kind: 'item'; item: string };

export interface AbilitySeal {
    /** stabile tra rigenerazioni: `${regionId}-${kind}` */
    id: string;
    kind: SealKind;
    ability: AbilityId;
    /** stanza laterale premiata e porta che la collega alla strada principale */
    room: number;
    door: { a: number; b: number; axis: 'h' | 'v'; x: number; y: number; len: number };
    /** punto in piedi verificato per il premio, in celle */
    reward: { c: number; r: number };
    prize: SealReward;
    /** l'indizio è parte del sigillo, non un pickup */
    mark33: true;
}

export interface PhysicalAbilityGate {
    kind: 'camino' | 'mensola';
    ability: 'aggrappo' | 'rimbalzo';
    room: number;
    reward: { c: number; r: number };
}
```

`RegionLayout` guadagna due campi opzionali per compatibilità con salvataggi/JSON vecchi:

```ts
abilityGates?: PhysicalAbilityGate[];
seals?: AbilitySeal[];
```

Non rendere `seals` obbligatorio: se un vecchio JSON viene caricato, il gioco deve soltanto non mostrare i sigilli invece di rompersi. `loadRegion` deve continuare a caricare il file esistente; il manager userà `layout?.seals ?? []`.

### 1.2 Conservare i due cancelli fisici già esistenti

`addGates` conosce già se ha costruito `mensola` (doppio salto) o `camino` (aggrappo). Estendi `GateResult` per ritornare `physical: PhysicalAbilityGate[]`; quando aggiunge un cancello, aggiunga:

```ts
physical.push({
    kind,
    ability: kind === 'mensola' ? 'rimbalzo' : 'aggrappo',
    room: cand.room.id,
    reward: edit.reward,
});
```

In `build-regions.ts`, accumula l'array di tutti i passaggi `addGates` e assegna `region.layout.abilityGates = physical` prima di `encodeRegion`. Non convertire più le ricompense dei cancelli fisici in sigilli runtime: sono nicchie di geometria vera e il simulatore è l'autorità sulla loro raggiungibilità.

### 1.3 `scripts/world/seals.ts`: arricchimento deterministico, non un secondo generatore

Crea uno script eseguibile tramite `scripts/world/run.sh seals [id|all]`. Per ogni `public/regions/<id>.json`:

1. carica `RegionFile`, `decodeGrid(file)` e `layout`;
2. trova una stanza laterale (`pathIndex < 0`) non `arena`, non `rest`, non `secret`, con almeno uno `layout.spots` interno;
3. trova una porta non `drop` fra quella stanza e la sua `anchor`; non usare porte fra due stanze del percorso;
4. sceglie la stanza con hash deterministico `hashString('seal:'+id+':'+kind)` ordinando prima per distanza dal percorso, poi per id: lo stesso seed deve produrre lo stesso sigillo;
5. scrive `layout.seals` solo per le righe della tabella che appartengono a quella regione; conserva gli altri campi, `grid`, `entities`, `source`, `trials` e `abilityGates` invariati;
6. fallisce con un errore chiaro se una regione non ha una candidata valida. Non spostare una quest, un NPC o un premio per “farla stare”: correggere i criteri o rigenerare quella regione.

La configurazione vive all'inizio dello script, è completa e non è dispersa in `GameScene`:

```ts
const PLAN: readonly Omit<AbilitySeal, 'room' | 'door' | 'reward' | 'mark33'>[] = [
    { id: 'perduta-cortina', kind: 'cortina', ability: 'scivolata', prize: { kind: 'barre', amount: 60 } },
    { id: 'perduta-rimbalzo', kind: 'rimbalzo', ability: 'rimbalzo', prize: { kind: 'tacca' } },
    { id: 'bus-specchio', kind: 'specchio', ability: 'riflesso', prize: { kind: 'barre', amount: 90 } },
    { id: 'bus-camino', kind: 'camino', ability: 'aggrappo', prize: { kind: 'cuore' } },
    { id: 'santuario-risonanza', kind: 'risonanza', ability: 'risonante', prize: { kind: 'cuore' } },
    { id: 'trenbolone-miasma', kind: 'miasma', ability: 'rigenerazione', prize: { kind: 'barre', amount: 90 } },
    { id: 'rio-resina', kind: 'resina', ability: 'acquatossica', prize: { kind: 'tacca' } },
    { id: 'ruhra-teorema', kind: 'teorema', ability: 'analisi', prize: { kind: 'cuore' } },
    { id: 'sorveglianza-ricevitore', kind: 'ricevitore', ability: 'scudo', prize: { kind: 'barre', amount: 120 } },
] as const;
```

Per `rimbalzo` e `camino`, lo script deve prima preferire la stanza registrata in `abilityGates` con l'abilità corrispondente; se non esiste, deve fallire e riportare regione/abilità. Non fingere che una stanza raggiungibile a piedi sia un cancello di movimento.

Per gli altri sette tipi il premio deve essere nello spot con più distanza dalla porta, così la porta apre davvero una piccola stanza e non una ricompensa immediata. Calcolare la distanza Manhattan dal punto della porta; non selezionare spot entro 3 celle da checkpoint, uscita o posizione di una `EntitySpec` non nemica.

### 1.4 Validatore dei dati

Nello stesso script, oppure in `scripts/world/validate-seals.ts`, implementa `validateSeal(file, seal)` e chiamalo prima di scrivere. Deve controllare almeno:

```ts
assert(room.pathIndex < 0);
assert(room.id === seal.room);
assert(door.a === room.id || door.b === room.id);
assert(door.kind !== 'drop');
assert(file.layout.spots?.some(([c, r, roomId]) =>
    roomId === seal.room && c === seal.reward.c && r === seal.reward.r));
assert(!otherSealRewards.has(`${seal.reward.c},${seal.reward.r}`));
```

Eseguire inoltre `scripts/world/run.sh simcheck <id>` per ogni regione modificata dopo aver scritto il JSON. Il simulatore non sa aprire i sigilli runtime: è corretto, perché essi sono solo in stanze laterali; il controllo importante è che l'uscita e tutta la trama di base restino raggiungibili.

## 2. `AbilitySeals`: un runtime manager, non nove if in `GameScene`

### 2.1 Interfaccia

Crea `src/engine/AbilitySeals.ts`.

```ts
export interface AbilitySealsContext {
    scene: Phaser.Scene;
    regionId: string;
    layout: RegionLayout;
    player: Player;
    nav: NavGraph;
    lighting: LightingManager;
    fakeWalls: Phaser.Physics.Arcade.StaticGroup;
    breakableWalls: Phaser.Physics.Arcade.StaticGroup;
    giveHeart(x: number, y: number, key: string): void;
    giveItem(x: number, y: number, item: string, key: string): void;
    giveBarre(x: number, y: number, amount: number): void;
    giveNotch(amount: number, key: string): void;
}

export class AbilitySeals {
    constructor(ctx: AbilitySealsContext);
    update(time: number): void;
    markers(): RegionMarker[];
    destroy(): void;
}
```

Il manager si iscrive a `scene.events.on('wave-world', this.onWave)` nel costruttore e si disiscrive in `destroy`. Il tipo dell'evento deve essere lo stesso scritto nel piano 5; non usare il bus DOM per hitbox ad alta frequenza.

Ogni istanza runtime contiene `seal`, sprites/graphics, eventuale `Phaser.Physics.Arcade.StaticGroup` della barriera, timer e `opened`. La chiave persistente è `sigillo-<seal.id>`; una stanza già risolta non crea barriera, 33 né premio al caricamento.

Integra il manager in `GameScene` subito dopo `marks33.build`, quando `level`, `nav`, `lighting` e le funzioni pickup esistono. Aggiungi `private seals: AbilitySeals | null = null`, azzeralo in `create`, chiama `seals.update(time)` nel loop e `seals.destroy()` nello `SHUTDOWN`. Aggiungi `...this.seals.markers()` a `regionView.markers` in `buildGuide`; aggiornare i marker quando il sigillo si apre.

### 2.2 Geometria comune

Trasforma la porta serializzata in coordinate pixel, senza duplicare le formule a caso:

```ts
function doorRect(d: AbilitySeal['door']): Phaser.Geom.Rectangle {
    if (d.axis === 'h') return new Phaser.Geom.Rectangle(d.x * TILE - 8, (d.y - 3) * TILE, 16, Math.max(1, d.len + 3) * TILE);
    return new Phaser.Geom.Rectangle((d.x - 1) * TILE, d.y * TILE - 8, Math.max(1, d.len) * TILE, 16);
}
```

La barriera ha una hitbox statica soltanto per i tipi che devono fisicamente negare la porta (`cortina`, `specchio`, `risonanza`, `resina`, `teorema`, `ricevitore`). `miasma` è un volume dannoso ma percorribile; `rimbalzo` e `camino` non creano una parete aggiuntiva, perché la geometria generata è già il test dell'abilità. Non creare un collider che chiuda accidentalmente una porta verticale: la forma deve essere piatta nel verso della porta e deve lasciare il pavimento/soffitto corretti come fa `doorRects` di `GameScene`.

Il premio appare nel punto `reward` come `x = (c + 0.5) * TILE`, `y = r * TILE - 10`. Prima di mostrarlo, chiama il medesimo `rewardSpot` di `GameScene` se il metodo deve correggere la posizione, ma **mantienilo nella stessa stanza**: la correzione non può trasportarlo oltre la porta. Se la funzione attuale non può garantire la stanza, passa direttamente il punto verificato e nessuna gravità.

### 2.3 I nove comportamenti esatti

| tipo | visivo e suono | condizione di apertura | regole da rispettare |
|---|---|---|---|
| `cortina` | colonne di pixel ciano-viola, fruscio digitale; il 33 è sul bordo | `wave-world.wave === 'scivolata'` e l'area interseca la porta | si apre al primo passaggio in scivolata; camminare contro la cortina non fa danno né rumore continuo |
| `rimbalzo` | 33 sopra la nicchia, pennarello verde su un bordo alto | player entra nel cerchio premio con `state.hasAbility('rimbalzo')` | non si apre via evento: il doppio salto è la prova fisica; l'icona resta grigia se manca |
| `specchio` | due piastre con crepa, porta riflettente | `wave-world.wave === 'riflesso'` interseca la piastra interna per 650 ms consecutivi | il clone deve restare vivo; uscire dalla piastra azzera il timer; il giocatore non la attiva con il corpo |
| `risonanza` | blocco a tratteggio che vibra e una piccola onda disegnata | `wave-world.wave === 'risonante'` interseca la barriera con `level >= 2` | l'eco breve fa solo un suono ovattato; il livello 3 funziona; nessun fendente rompe la parete |
| `miasma` | nube verde smorta, cuore sotto vetro, respiro basso | il player rimane nella nube con `rigenerazione` e completa 6 s senza subire danno | senza abilità: rallenta e fa 1 danno ogni 1,2 s, ma non può uccidere sotto 1 HP; azzera il progresso quando esce o viene ferito; non mutare `state.run.smela` |
| `camino` | graffi verticali e 33 sul labbro superiore | player entra nel cerchio premio con `aggrappo` | l'abilità deve essere realmente necessaria secondo `abilityGates`; non disegnare una scala |
| `resina` | membrana PET lucida con “PREMIUM”, bolle | `wave-world.wave === 'acquatossica'` con area che interseca | basta un impatto o pozza; la pozza poi può restare, ma il sigillo apre una sola volta |
| `teorema` | tre segni di gesso incompleti, porta blu | `wave-world.wave === 'analisi'` interseca con l'evento della sola `q.e.d.` | i tick dell'analisi non aprono; deve essere il finale della dimostrazione del piano 5 |
| `ricevitore` | lente rossa, cavo verso il lucchetto, “REC” spento | `wave-world.wave === 'scudo'`, `level === 2`, area colpisce la lente | il rimando normale lampeggia rosso e non apre; il perfetto lo manda in overload, stordisce 0,8 s e apre |

L'intersezione è `Phaser.Geom.Intersects` tra l'area dell'evento e un rettangolo di attivazione più piccolo della barriera (non la room intera). Per cerchi usare `Phaser.Geom.Intersects.CircleToRectangle`; per rettangoli `RectangleToRectangle`. Centralizzare questa conversione in `intersectsArea`, non usare controlli `abs(x)` diversi per ogni sigillo.

### 2.4 Apertura, premio e salvataggio

`open(seal)` deve essere idempotente:

1. ritorna subito se `opened` o `state.hasFlag(key)`;
2. distrugge collider, luce e visual del sigillo con un tween di 250–450 ms; niente particelle generiche bianche, usare il colore del tipo;
3. chiama `state.setFlag(key)` prima di generare il premio;
4. genera il premio con chiave `sigillo-premio-<seal.id>` (`spawnCuore`, `spawnItemPickup`, barre o tacca); una tacca richiede un piccolo helper pubblico in `GameScene` che incrementi `save.notches`, emetta `inventory-changed` e persista come fa `state.addItem('tacca')`;
5. emette un toast breve, per esempio `il 33 aveva ragione. dietro c'era qualcosa.` soltanto la prima volta globale (`seme-sigilli-visto`), poi `sigillo aperto.`; non nominare tasti fisici;
6. invalida i marker di `regionView` e `state.persist()`.

Non fare spawn di una `EntitySpec` nuova né modificare il JSON a runtime. Il save è la sola verità su un sigillo risolto.

### 2.5 Mappa e orientamento

La mappa non deve rivelare un segreto dall'altra parte del realm. `markers()` restituisce un marker `kind: 'seal'`, con `label: '33'` quando:

- la stanza della porta o quella del premio è già esplorata;
- il sigillo è ancora chiuso;
- il giocatore ha visto il suo 33 (flag `visto-sigillo-<id>` impostato a distanza < 250 px).

Estendi il tipo `RegionMarker['kind']` con `'seal'`. In `renderRegionMap`, se la stanza corrispondente è esplorata, disegna un piccolo `33` azzurro barrato da una lineetta viola. Dopo l'apertura non disegnare nulla: la mappa deve premiare il ricordo, non sostituirlo con una checklist di spunte. Nel dettaglio della mappa aggiungi una sola riga aggregata: `33 letti: <aperti>/<visti>`, senza mostrare quante stanze segrete restano in regioni mai esplorate.

La freccia assistita non deve puntare ai sigilli: il suo contratto continua a indicare solo l'obiettivo critico. Le ricompense opzionali non devono costringere chi usa la guida a spegnerla.

## 3. Sequenza di lavoro

### Fase A — dati generati e verificabili

1. Aggiungi i tipi e il campo opzionale a `src/world/types.ts`.
2. Estendi `GateResult` e `build-regions.ts` per persistere solo metadata dei cancelli `mensola`/`camino`.
3. Implementa `scripts/world/seals.ts` e il validatore; prova prima su una copia o su `perduta`, poi su tutte le nove regioni della tabella.
4. Esegui `scripts/world/run.sh seals all` dopo la rigenerazione; stampa una riga per sigillo con id, stanza, porta, spot e premio. Una mancanza deve terminare non-zero.
5. Esegui `scripts/world/run.sh simcheck perduta`, `bus`, `santuario`, `trenbolone`, `rio`, `ruhra`, `sorveglianza` e controlla che `exit: true`, `stuck: 0`, `missing: 0` per il percorso base. Poi rigenera con `npm run regions` una sola volta e rilancia `seals all` perché la rigenerazione sovrascrive i JSON.
6. Commit: `cancelli salvati nelle regioni`.

### Fase B — manager e primi due sigilli

1. Implementa `AbilitySeals` con parsing, renderer comune, flag, premio e `destroy`; integralo senza creare ancora tutti i tipi.
2. Implementa `cortina` e `risonanza`: coprono sia l'evento rettangolare di scivolata sia quello a livelli del risonante, e dimostrano che `wave-world` è correttamente collegato al piano 5.
3. Verifica staticamente che senza `seals` il manager non faccia nulla, che un flag chiuso non generi due premi dopo un riavvio e che la collisione si distrugga davvero.
4. Commit: `le wave aprono i sigilli`.

### Fase C — restanti tipi, mappa e bilanciamento

1. Aggiungi specchio, miasma, resina, teorema e ricevitore con i timer/level esatti della tabella.
2. Registra rimbalzo e camino come traguardi dei cancelli fisici, senza aggiungere collisioni false.
3. Aggiungi marker, SVG e riga aggregata della mappa; il 33 compare solo dopo che si è visto nel mondo.
4. Aggiorna l'eventuale sola nota di Markolino in `WAVESUNG`; testo suggerito: `i 33 non indicano solo muri. indicano cose che pedro non voleva lasciarti perdere.`
5. Commit: `il mondo ricorda le abilità`.

## 4. Verifica obbligatoria

1. `npm run build` e `cd editor && npx tsc -b --noEmit`.
2. JSON: `rg '"seals"|"abilityGates"' public/regions/{perduta,bus,santuario,trenbolone,rio,ruhra,sorveglianza}.json` deve trovare i dati attesi. Apri con `node`/TypeScript lo script validatore, non modificare a mano i JSON per far sparire un errore.
3. Simulatore: tutti i `simcheck` elencati in fase A devono passare; aggiungere al resoconto la tabella regione → sigillo → stanza → premio.
4. Grep: `rg "wave-world" src` deve trovare emettitori del piano 5 e il solo ascoltatore centralizzato `AbilitySeals`, non nove callback in `GameScene`.
5. Casi da controllare nel codice e nel resoconto:
   - aprire un sigillo, morire prima di raccogliere il premio, rientrare: il premio resta, il cancello resta aperto;
   - aprire un sigillo, ricaricare la regione: niente secondo premio;
   - fare il rimando normale sul ricevitore: non apre; fare il perfetto: apre;
   - l'eco risonante non apre una parete; onda e onda piena sì;
   - il clone lascia la piastra: il timer torna a zero;
   - senza rigenerazione il miasma non può portare da 1 HP a morte;
   - una porta bloccata è laterale e l'uscita della regione resta raggiungibile;
   - la mappa non mostra un 33 in una stanza mai esplorata e non lo mostra dopo l'apertura.
6. Con permesso esplicito dell'utente, provare in browser almeno cortina, risonanza, specchio e ricevitore con il god mode. Senza permesso, non aprire browser e dichiarare il limite.
7. `DEV_LOG.md`: ADR dopo ADR-024, titolo `le abilità riaprono il realm`. Deve fissare: metadata nei JSON, sigilli solo laterali, `wave-world` come confine, premi persistenti e niente stanze a mano. Aggiungere una riga in Cronologia.

## Cosa NON fare

- Non rendere una quest, un boss, l'uscita o il finale dipendenti da un sigillo.
- Non rigenerare selettivamente una regione e poi dimenticare tutte le altre: metadata e codice devono restare coerenti.
- Non usare coordinate pixel hardcoded, un `setTimeout` per “indovinare” la wave o polling sul DOM.
- Non cambiare la meccanica/comando di un'abilità: appartengono ai piani 5 e 6.
- Non cambiare il significato dei 33, aggiungere “frammenti di 33” o una schermata collezione.
