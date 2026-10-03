# Piano 8 — l'ombra che ti legge

> Prima leggi `plans/00-INDEX.md`. I piani 5 e 6 devono essere già completi. Il piano 5 amplia `player-act` con `{ act: 'wave', wave, level? }`; il piano 6 rende l'input indipendente dai tasti. Questo piano osserva **azioni di gioco**, mai tasti fisici, mouse, testo, nome del giocatore o dati fuori dal save locale.

## Obiettivo

L'ombra è già una buona idea, ma oggi è quasi tutta concentrata nello scontro finale: `OmbraBrain` conta i fendenti uguali, quattro scivolate e una cura a vita bassa; le telecamere aumentano `state.run.ombraDati`. Il giocatore sente un paio di battute, non la sensazione inquietante che l'ombra lo abbia guardato per tutta la partita.

Questa fase trasforma l'idea in un sistema leggibile e leale:

- dall'inizio della partita il realm registra una **sagoma anonima delle abitudini del geco**;
- la tommasorveglianza decide quanta precisione ottiene il modello, non se il gioco raccoglie dati reali: sono solo azioni fittizie nel salvataggio locale;
- all'ombra arriva un profilo storico all'inizio dello scontro, poi una finestra breve delle mosse appena fatte;
- l'ombra contrasta una sola abitudine per volta, con un segnale chiaro e una finestra per cambiare ritmo;
- le abilità restano valide. Il sistema punisce la ripetizione, non il fatto di usare una wave “sbagliata”.

La battuta `l'ombra è te, comprato per 0,09€` resta. La versione senza acquisto resta una beta più debole, ma non una lotteria casuale: osserva poche categorie e reagisce più lentamente.

## Regole di correttezza

1. Il profilo è locale, serializzato nel save del gioco e senza rete. Non aggiungere analytics, fetch, SDK, cookie o storage ulteriore.
2. Non registrare codici dei tasti, coordinate continue, nomi, messaggi o tempi assoluti. Registrare soltanto categorie normalizzate e conteggi.
3. Mai impedire un'abilità, togliere flow, cancellare un input o rendere immune il boss a una wave. L'ombra può rispondere a una mossa prevedibile, non vietarla.
4. Una risposta ha sempre: preavviso visivo/sonoro, una finestra di reazione ragionevole e un cooldown. Nessun attacco punitivo nei primi 1.5 s di un dialogo chiuso, durante invulnerabilità da danno o mentre il boss è `busy`.
5. La difficoltà nasce dall'osservazione, non da HP gonfiati. Il bonus HP della telecamera esistente va ridotto e reso secondario; non sommare profilo + telecamere + HP in un boss-spugna.
6. Il profilo si azzera con “nuova partita” (`state.reset()`), non quando si muore o si cambia regione. Deve seguire **questa** campagna, incluse le visite alle regioni vecchie.

## Architettura e file

| file | responsabilità |
|---|---|
| `src/types.ts` | tipo serializzabile `OmbraProfile` dentro `SaveData` |
| `src/engine/state.ts` | default, migrazione dei salvataggi vecchi, API piccola per osservare un'azione e per il livello del contratto |
| `src/engine/OmbraProfile.ts` | logica pura: normalizzazione, punteggi, snapshot e diagnosi delle abitudini |
| `src/engine/OmbraBrain.ts` | consuma il profilo e le azioni live, sceglie contro-mosse con cooldown e segnali |
| `src/entities/Boss.ts` | API minimale per un contrattacco controllato; non spargere accessi ai campi privati del boss |
| `src/scenes/GameScene.ts` | inoltra `player-act` al profilo in ogni regione, passa snapshot/contratto al cervello dell'ombra, disegna segnali di apprendimento |
| `src/engine/mechanics/Cameras.ts` | registra avvistamenti come qualità del footage, non solo come contatore volatile |
| `src/content/barks.ts`, `src/content/story.ts` | poche battute contestuali, senza spiegoni né tasti scritti |
| `src/ui/hud.ts`, `src/style.css` | solo una micro-indicazione quando l'ombra ha appena letto una mossa; non una dashboard di telemetria |
| `DEV_LOG.md` | ADR e cronologia |

## 1. Un profilo locale, piccolo e migrabile

### 1.1 Tipi

In `src/types.ts`, prima di `SaveData`, aggiungi tipi espliciti. Non usare `Record<string, number>` senza un vocabolario: un typo in una mossa deve essere un errore TypeScript.

```ts
export type OmbraAction =
    | 'attack-side' | 'attack-up' | 'attack-down'
    | 'dash' | 'jump' | 'heal-start' | 'heal-done'
    | 'wave-risonante' | 'wave-riflesso' | 'wave-analisi'
    | 'wave-scudo' | 'wave-acquatossica';

export interface OmbraProfile {
    version: 1;
    /** quante azioni normalizzate ha visto il modello in questa partita */
    total: number;
    counts: Record<OmbraAction, number>;
    /** riprese riuscite nel centro sorveglianza; massimo 8 */
    sightings: number;
    /** contratto acquistato: sblocca la precisione alta, mai dati extra reali */
    premium: boolean;
}
```

`SaveData` guadagna `ombra: OmbraProfile`. `defaultSave()` deve inizializzarlo con tutti gli zero tramite una funzione `defaultOmbraProfile()`, non con un oggetto condiviso. Nel merge dei salvataggi esistenti usare:

```ts
ombra: {
    ...defaultOmbraProfile(),
    ...(parsed.ombra ?? {}),
    counts: { ...defaultOmbraProfile().counts, ...(parsed.ombra?.counts ?? {}) },
},
```

Convertire `parsed.ombra.version` non valido al default. Clampa `sightings` a `0..8` e ogni conteggio a intero finito `>= 0`, così un localStorage corrotto non rende il boss ingestibile. `state.reset()` torna al default senza lasciare il profilo vecchio in memoria.

### 1.2 Un modulo puro: `src/engine/OmbraProfile.ts`

Questo modulo non importa Phaser, `GameState`, DOM o `Boss`. Deve essere testabile mentalmente e riusabile dal cervello.

```ts
export interface PlayerAct {
    act: 'attack' | 'dash' | 'jump' | 'heal-start' | 'heal' | 'wave';
    dir?: 'side' | 'up' | 'down' | 'shot';
    wave?: AbilityId;
    level?: number;
}

export interface OmbraInsight {
    action: OmbraAction;
    confidence: number; // 0..1
    label: 'fendente' | 'scivolata' | 'cura' | 'wave';
}

export function normalizeOmbraAct(act: PlayerAct): OmbraAction | null;
export function observe(profile: OmbraProfile, act: PlayerAct): boolean;
export function strongestHabit(profile: OmbraProfile, recent: readonly OmbraAction[], premium: boolean): OmbraInsight | null;
```

`normalizeOmbraAct` deve rifiutare gli eventi che non significano una decisione (`heal` viene mappato a `heal-done`, il tick di rigenerazione non viene registrato). Il vecchio risonante emetteva `attack/shot`; dopo piano 5 deve emettere solo `wave-risonante`, quindi non contarlo sia come fendente sia come wave.

La diagnosi non deve premiare un conteggio assoluto: chi ha usato molto il gioco non è automaticamente prevedibile. Calcola per ogni candidato un punteggio composto:

```ts
const globalShare = profile.counts[action] / Math.max(1, profile.total);
const recentShare = recent.filter((a) => a === action).length / Math.max(1, recent.length);
const footage = premium ? 1 : 0.55 + Math.min(profile.sightings, 4) * 0.08;
const confidence = Math.min(1, (globalShare * 0.35 + recentShare * 0.65) * footage);
```

Restituisci `null` se ci sono meno di 12 azioni osservate, se il candidato ha `confidence < 0.32`, o se due candidati differiscono meno di `0.06`: in quel caso il giocatore è già variabile e va lasciato in pace. La beta usa una finestra recente di 10 azioni e un cooldown più lungo; premium 18 azioni e migliore `footage`. Non scegliere `jump` come contrattacco: è solo contesto, non una mossa da punire.

### 1.3 API in `state.ts`

Aggiungi due metodi pubblici, piccoli e unici punti di mutazione:

```ts
observeOmbra(act: PlayerAct): void {
    if (observe(this.save.ombra, act)) this.persist();
}

recordOmbraSighting(): void {
    this.save.ombra.sightings = Math.min(8, this.save.ombra.sightings + 1);
    this.persist();
}
```

Quando la scelta di `tommasorveglianza` viene fatta, oltre al flag esistente impostare `state.save.ombra.premium = true` e persistere. Non dedurre il contratto da un flag ogni frame. Se un vecchio salvataggio ha già `tommasorveglianza`, nella migrazione o al boot ricostruire `premium = true` una volta.

`state.run.ombraDati` può restare un contatore **temporaneo** per toast e difficoltà della scena, ma non è più la fonte della storia. `Cameras.alarm` deve chiamare `state.recordOmbraSighting()` quando `mode.kind === 'sorveglianza'`; il toast può mostrare `state.save.ombra.sightings/8`. Non incrementare entrambe le fonti per il medesimo calcolo del boss.

## 2. Osservare tutta la campagna senza attaccarsi ai tasti

### 2.1 Emissioni complete da `Player`

Dopo il piano 5/6 `Player` deve emettere queste azioni una sola volta per decisione:

| momento | evento `player-act` |
|---|---|
| fendente, pogo e colpo alto | `{ act: 'attack', dir: 'side' | 'down' | 'up' }` |
| scivolata avviata | `{ act: 'dash' }` |
| salto da terra, muro o doppio salto | `{ act: 'jump' }` |
| inizio cura | `{ act: 'heal-start' }` |
| cura che consegna un cuore | `{ act: 'heal' }` |
| wave attiva | `{ act: 'wave', wave: AbilityId, level?: 1 | 2 | 3 }` |

Non emettere `jump` dal buffer prima che il salto riesca, né una wave se il flow non basta. Questo evita di addestrare l'ombra su tentativi che il giocatore non ha compiuto. Aggiorna il tipo locale nel piano 5 se necessario: un solo tipo `PlayerAct` deve essere importato sia da `Player` sia da `OmbraBrain`, non tre interfacce simili.

### 2.2 Un forwarder per scena

In `GameScene.setupEvents` aggiungi un listener normale, con cleanup nella stessa helper `on(...)` già usata per gli altri eventi:

```ts
on('player-act', (act: PlayerAct) => {
    state.observeOmbra(act);
    this.ombraBrain?.observeLive(act);
});
```

Deve essere installato in **tutte** le regioni, anche prima della sorveglianza. È corretto: nel mondo di gioco il geco lascia una traccia; non è una raccolta dati dell'applicazione. L'ombra non riceve ancora una reazione finché non esiste, ma al combattimento può leggere lo storico.

Non ascoltare `Input`, `KeyboardEvent`, mouse o `pointerdown` qui. Con gamepad/rimappatura la stessa azione deve produrre lo stesso profilo.

## 3. Un combattimento adattivo ma leggibile

### 3.1 Costruzione dell'ombra

Sostituisci il costruttore attuale con un contesto esplicito:

```ts
export interface OmbraContext {
    scene: Phaser.Scene;
    boss: Boss;
    voice: BossVoice;
    player: Player;
    profile: OmbraProfile;
    onInsight: (insight: OmbraInsight) => void;
}

export class OmbraBrain {
    constructor(ctx: OmbraContext);
    observeLive(act: PlayerAct): void;
    update(time: number): void;
    stop(): void;
}
```

In `GameScene.onBossEngaged`, quando `kind === 'ombra'`, creare il cervello con `profile: state.save.ombra`. Conservare `boss.empower` solo come ritocco lieve: `1 + Math.min(0.12, sightings * 0.015)` per premium e massimo `1.03` per beta. Il valore attuale `1 + ombraDati * 0.07` può arrivare a +56% HP ed è il tipo di difficoltà che il sistema non deve usare.

Chiamare `ombraBrain.update(time)` nel loop dopo `boss.update`, e `stop()` su sconfitta e SHUTDOWN. `stop()` deve disiscriversi da qualunque listener; non lasciare un brain vecchio che ascolta una scena riavviata.

### 3.2 Finestra, preavviso e contro-mosse

Il cervello conserva massimo 18 azioni recenti, non timestamp completi. Ogni 1.4 s quando il boss è attivo, non `busy`, il giocatore non è morto e `now >= nextAdaptAt`, chiama `strongestHabit` con lo storico + finestra live. Se torna un insight, avvia **una** contromossa e imposta:

- premium: `nextAdaptAt = now + 6500`;
- beta: `nextAdaptAt = now + 9500`;
- se lo stesso insight è stato appena scelto: +2500 ms; l'ombra non deve ripetere la medesima gag.

| abitudine letta | segnale (500–700 ms prima) | risposta | come il giocatore la batte |
|---|---|---|---|
| `attack-side`, `attack-up`, `attack-down` | bordo ciano nella direzione, bark `spam-*` | `boss.guard(dir, premium ? 3200 : 1900)` | cambia direzione, usa una wave o aspetta la guardia |
| `dash` | afterimage dell'ombra nella direzione del geco, beep ascendente | dopo 550 ms `boss.strike('teleport', player)` | fermarsi, invertire direzione o saltare; cooldown lungo |
| `heal-start` | mirino rosso sottile sopra il geco, 650 ms | se la cura è ancora in corso `boss.strike('snipe', player)` | interrompere la cura e muoversi; mai se HP > 2 |
| `wave-risonante` | l'ombra si allinea lateralmente, rumore CRT | `boss.guard('shot', 2200)` | caricare e non sparare sempre dallo stesso lato, usare l'onda piena dopo la guardia |
| `wave-analisi` | tre glifi ciano si allontanano, 450 ms | `boss.strike('teleport', player)` | lanciare analisi quando è già vicina o tenerla per dopo il teletrasporto |
| `wave-scudo` | la lente `REC` si spegne, 350 ms | ritarda il prossimo attacco del boss di 500 ms invece di sparare dentro il perfetto | il giocatore ha comunque speso lo scudo per difendersi; non annullarlo |
| `wave-riflesso` o `wave-acquatossica` | nessuna punizione diretta | bark raro di osservazione, nessuna meccanica | il clone e il controllo area non hanno pattern coercitivo affidabile |

Per evitare che `strike` fallisca senza segnale, aggiungi in `Boss` una API `canStrike(): boolean` che verifica `active && engaged && !busy`, oppure fai restituire `false` in modo verificabile e non impostare cooldown/insight se non parte. Non chiamare il metodo privato `execute` dall'esterno.

`onInsight` in `GameScene` deve: mostrare per 1.2 s una piccola etichetta vicino all'ombra (`ha letto: scivolata`, `ha letto: fendente`, `ha letto: cura`, `ha letto: wave`), emettere una sola riga `bark` e far lampeggiare una micro-chip HUD. Non mostrare percentuali, contatori dei tasti o “AI confidence”: sarebbe slop tecnico e spezzerebbe il tono.

### 3.3 Contenuto e tono

In `src/content/barks.ts`, estendi soltanto le linee evento dell'ombra. Testi ammessi, tutti corti:

```ts
'learn-dash': ['hai fatto quella scivolata 28 volte. adesso la faccio io.'],
'learn-heal': ['un cuore. sempre quando pensi di aver tempo.'],
'learn-shot': ['onda in arrivo. archiviata.'],
'learn-varied': ['...questa non era nel modello.'],
```

Il numero 28 è scenico, non il conteggio reale: non interpolare dati del profilo nelle battute. Quando `strongestHabit` torna `null` per varietà, `OmbraBrain` può dire `learn-varied` una sola volta: la ricompensa emotiva della meccanica è che il modello ammette di non capirti.

Aggiorna `ombra-intro` e `ombra-intro-scarsa` in `story.ts` senza spiegare l'algoritmo. Premium: “ha guardato tutto quello che ripeti”. Beta: “ha pochi fotogrammi, ma guarda lo stesso.” Non riscrivere i meme di Ticummi e non aggiungere una morale sulla privacy.

## 4. Sequenza di lavoro

### Fase A — profilo e migrazione

1. Aggiungi tipi, default e merge dei save vecchi.
2. Crea `OmbraProfile.ts` con funzioni pure e casi espliciti per ogni `PlayerAct`.
3. Inserisci il forwarder `GameScene` e l'aggiornamento delle telecamere; registra premium al momento della scelta.
4. Verifica che una nuova partita abbia tutti i valori zero, un vecchio save senza `ombra` carichi, e `state.reset()` azzeri tutto.
5. Commit: `l'ombra conserva le abitudini`.

### Fase B — cervello e segnali

1. Rifattorizza `OmbraBrain` sul nuovo contesto e conserva il comportamento base di guardia/dash/cura come fallback beta.
2. Aggiungi finestra recente, selezione deterministica, cooldown e API pubblica minima di `Boss`.
3. Aggiungi gli indicatori in scena/HUD e le battute brevi; non aggiungere una nuova schermata.
4. Riduci l'empower HP ai limiti indicati.
5. Commit: `l'ombra punisce le abitudini`.

### Fase C — verifica e calibrazione

1. Leggi `COMBAT`, HP dell'ombra in `bosses.ts` e cooldown di `Boss` prima di cambiare numeri. Non cambiare tutti e tre nello stesso verso.
2. Simula sul codice almeno tre profili: ripetitivo (70% fendente laterale), misto (nessuna categoria > 25%), wave-heavy (risonante 40%). Scrivere nel resoconto insight previsto, contromossa e cooldown di ciascuno.
3. Se l'ombra premium riesce a concatenare due punizioni in meno di 6.5 s, è un bug; se beta con meno di 12 azioni punisce, è un bug.
4. Commit: `l'ombra legge senza barare`.

## 5. Verifica obbligatoria

1. `npm run build` e `cd editor && npx tsc -b --noEmit`.
2. Grep di sicurezza: `rg "KeyboardEvent|event\.code|navigator\.getGamepads|localStorage" src/engine/Ombra* src/scenes/GameScene.ts` non deve introdurre input fisico o storage diretto fuori da `state.ts`.
3. Grep degli eventi: `rg "player-act" src` deve mostrare emissioni una-volta e un solo forwarder verso `state.observeOmbra`; non devono esistere listener duplicati per riavvio scena.
4. Controllare i casi seguenti e documentare l'esito:
   - save preesistente senza `ombra`;
   - reset partita dopo un profilo pieno;
   - profilo con numeri negativi, `NaN` o sightings > 8 nel localStorage;
   - morte e restart: il profilo sopravvive, la finestra live dell'ombra no;
   - evitare le telecamere: premium resta premium ma con meno precisione/HP;
   - nessuna telecamera e nessun contratto: beta non punisce prima di 12 azioni;
   - usare lo scudo perfetto: l'ombra non spara dentro i suoi 220 ms solo per “vincere”;
   - cambiare ritmo dopo una guardia: il prossimo fendente da direzione diversa passa;
   - onda piena durante guardia `shot`: la guardia segue le regole di combattimento già previste nel piano 5, non un invincibile nuovo.
5. Con consenso esplicito dell'utente, provare lo scontro ombra sia premium sia beta con god mode. Senza consenso non usare browser e dichiarare che la calibrazione è statica.
6. `DEV_LOG.md`: ADR nuovo `l'ombra impara localmente`. Includere categorie raccolte, assenza di rete/dati fisici, differenza premium/beta, cooldown e la scelta di non gonfiare HP. Aggiungere Cronologia.

## Cosa NON fare

- Non trasformare il boss in un imitator che copia il player frame per frame.
- Non usare una rete neurale, random seed opaco o una probabilità che il giocatore non possa leggere.
- Non registrare input fisico o qualunque dato esterno alla finzione del gioco.
- Non cambiare i tasti, il kit delle abilità, le telecamere della cantina o la trama del void.
- Non lasciare `state.run.ombraDati` come seconda fonte di verità del profilo.
