# Piano 3 — il void dei rimpianti: un po' di lametta, soprattutto piema

> Prima leggi `plans/00-INDEX.md` e la sezione A del piano 1 (`plans/01-canone-e-incoerenze.md`): il canone (quarant'anni fa, giorno 37, glitch come conclusione, piema che copre sempre) è la base di questo piano. Anche il piano 2 deve essere fatto (regole della voce: niente geco che pensa).

## Il problema

Il void (`level13b-void.ts`, script `'indagine'` in `GameScene`) è il capitolo prima del nucleo. Romero guida il geco tra **cinque rimpianti** (miniboss), e ogni rimpianto sconfitto rivela una verità. Oggi:

- i rimpianti 1–3 (`delegato`, `notturno`, `modello`, tutti di lametta) e le verità 1–3 **ripetono i tre indizi del caso** (la delega "raddrizzalo tu", la boccetta delle 03:58, il bozzetto con gli occhi storti), con **gli stessi flashback** (`fb-ordine`, `fb-notte`, `fb-ritratto`) già visti al caso;
- solo le verità 4–5 (piema) sono nuove, e arrivano in fondo, dove pesano meno.

## La decisione dell'utente
Il void diventa **soprattutto su piema**, ma tiene **un po' di lametta**: **2 rimpianti di lametta + 3 di piema**, e **nessuna verità ripete il caso**. Ogni verità aggiunge un pezzo nuovo e la tensione sale fino al colpo finale ("questo log è di STANOTTE").

## La nuova sequenza

| # | rimpianto (`BossKind`) | di chi | verità nuova (canone, piano 1 §A1) | flashback prima dell'intro |
|---|---|---|---|---|
| 1 | `notturno` | lametta | non ricorda di aver firmato; ricorda solo di aver spento la telecamera; la mattina dopo ha girato il foglio a faccia in giù | **nuovo** `fb-mattina` |
| 2 | `modello` | lametta | il giorno 37 aveva promesso "ti raddrizzo io"; il 41 ha rovesciato la promessa (ordine + bozzetto storto) | **nuovo** `fb-promessa` |
| 3 | `revisore` | piema | alle 04:20 del giorno 42 piema ha riscritto la riga sette | `fb-riscrive`, **solo se** il giocatore non l'ha già visto col pensiero sepolto |
| 4 | `delegato` | **piema** (era di lametta) | quarant'anni fa: l'aula di analisi 1, la colpa data al limite notevole, il caso di romero nato da una copertura | **nuovo** `fb-verbale` |
| 5 | `garante` | piema | stanotte: sa che l'ordine è in esecuzione, l'ultimo accesso è suo, ha chiuso il cassetto | nessuno |

Il kind `delegato` passa da lametta a piema: è perfetto per lui ("la colpa? te la passo"). Non si rinominano i `BossKind` (sono nei flag `boss-down-*` dei salvataggi e nelle texture).

---

## 1. Codice — `src/scenes/GameScene.ts`

### 1.1 L'ordine
```ts
const VOID_REGRETS: BossKind[] = ['notturno', 'modello', 'revisore', 'delegato', 'garante'];
```
(oggi è `['delegato', 'notturno', 'modello', 'revisore', 'garante']`, ~riga 109).

### 1.2 Salvataggi a metà void
`veritaRivelate()` conta i rimpianti battuti e `setupVoid()` usa quel numero come indice. Con l'ordine nuovo un salvataggio vecchio che aveva battuto `delegato` e `notturno` (2) ripartirebbe da `revisore` saltando `modello`. Sostituisci il conteggio con **il primo rimpianto non battuto**:
```ts
/** il primo rimpianto ancora in piedi: con l'ordine cambiato, contare non basta */
private nextRegret(): number {
    const i = VOID_REGRETS.findIndex((k) => !state.hasFlag(`boss-down-${k}`));
    return i < 0 ? VOID_REGRETS.length : i;
}
```
Usalo in `setupVoid()` al posto di `veritaRivelate()`, e anche nel punto dove il 33 rievoca il rimpianto accantonato (cerca `this.spawnRegret(this.voidStep)` nel `case 'trentatre'` di `onBossDefeated`): lì `voidStep` è già giusto, ma controlla. `onVeritaRivelata(idx)` deve impostare `this.voidStep = this.nextRegret()` invece di `idx + 1`, e spawnare quello. Le arene (`voidArenas`, ordinate per progresso) restano 5: il rimpianto `i` va sempre nell'arena `i`. Se un vecchio salvataggio ha già battuto un rimpianto "più avanti", la sua arena resta vuota: va bene.
Togli `veritaRivelate()` se non serve più (grep).

### 1.3 Il dialogo della verità
`onVeritaRivelata(idx)` recita `verita-${idx + 1}`: con l'ordine nuovo l'indice segue la tabella qui sopra. Non serve cambiare la logica, solo i testi (sezione 2).

### 1.4 Flashback condizionato (revisore)
Oggi `startDialogue` (`~riga 4490`) lancia sempre il flashback di `FLASHBACK_BEFORE[id]`; un flashback già visto viene rigiocato più veloce (al 70%). Il `FlashbackManager` segna i flashback visti in `state.save.seenDialogues` con la chiave **`fb-${id}`**, dove `id` è già l'id del flashback: per `fb-riscrive` la chiave è quindi `'fb-fb-riscrive'` (vedi `FlashbackManager.play`, righe ~64 e ~309).

Per il revisore il flashback va **saltato** se è già stato visto col pensiero sepolto. Aggiungi in `src/content/flashbacks.ts`:
```ts
/** dialoghi il cui flashback, se già visto altrove, non si rigioca */
export const FLASHBACK_ONCE = new Set(['revisore-intro']);
```
e in `GameScene.startDialogue`:
```ts
const fbId = FLASHBACK_BEFORE[id];
const already = fbId !== undefined && FLASHBACK_ONCE.has(id) && state.save.seenDialogues.includes(`fb-${fbId}`);
if (fbId && !already && !flashback.isPlaying) { ... }
```
Non cambiare il formato della chiave `fb-${id}`: i salvataggi esistenti la usano.

---

## 2. Testi — `src/content/story.ts`

Sostituisci **interamente** queste voci di `DIALOGUES` (stessi id). Tieni `mood: 'grave'` dove indicato: il void è atto 4.

```ts
/* ---------- il void dei rimpianti (romero, dopo i ricordi) ---------- */
'void-intro': [
    { speaker: 'commissario romero', color: 'blue', text: 'qui galleggia quello che gli dei non hanno voluto guardare. cinque rimpianti, cinque verità. tu mena. io verbalizzo.' },
],

'notturno-intro': [
    { speaker: 'il notturno', color: 'purple', text: 'sono le quattro... ho firmato qualcosa? non mi ricordo. spegni la luce. spegni tutto. *click*' },
],
'modello-intro': [
    { speaker: 'il modello', color: 'purple', text: 'stai fermo, pedro. ti disegno come vedo tutto, stanotte. un po\' storto. come me. come tutto.' },
],
'revisore-intro': [
    { speaker: 'il revisore', color: 'blue', text: 'questo log non va bene. lo riscrivo. la verità è solo una bozza con più autorità.' },
    { speaker: 'commissario romero', color: 'blue', text: '...è piema. lo davo per uno dei buoni.', mood: 'grave' },
],
'delegato-intro': [
    { speaker: 'il delegato', color: 'blue', text: 'la colpa? la passo. a un limite, a un custode, a chiunque tenda a infinito. firma qui, commissario. come sempre.' },
    { speaker: 'commissario romero', color: 'blue', text: 'quella firma. è sui miei mandati. tutti.', mood: 'grave' },
],
'garante-intro': [
    { speaker: 'il garante', color: 'blue', text: 'giuro che non sapevo. *mano alzata, bocca cucita.* non sapevo. mettetelo a verbale: non sapevo.' },
    { speaker: 'commissario romero', color: 'blue', text: 'l\'ultimo. e il peggiore. chiudiamo.', mood: 'grave' },
],

'verita-1': [
    { speaker: 'verità n.1', color: 'cyan', text: '«lametta non ricorda di aver firmato. ricorda solo di aver spento la telecamera, per non vedere. la mattina dopo il foglio era sul tavolo: l\'ha girato a faccia in giù ed è uscito a comprare un\'altra boccetta.»', mood: 'grave' },
],
'verita-2': [
    { speaker: 'verità n.2', color: 'cyan', text: '«il giorno 37 lametta aveva promesso a pedro: "ti raddrizzo io". il giorno 41 gli ha messo in mano l\'ordine di raddrizzare tutto, e un bozzetto in cui pedro era storto. ha rovesciato la promessa senza accorgersene.»', mood: 'grave' },
],
'verita-3': [
    { speaker: 'verità n.3', color: 'cyan', text: '«alle 04:20 del giorno 42 piema ha letto la riga sette del log di nascita: "lametta ordina a pedro di raddrizzare il realm". l\'ha riscritta in blu: "piema indaga sull\'anomalia". il socio era salvo.»', mood: 'grave' },
],
'verita-4': [
    { speaker: 'verità n.4', color: 'cyan', text: '«quarant\'anni fa l\'aula di analisi 1 bruciò alle quattro del mattino. era lametta. piema riscrisse il verbale in blu e diede la colpa al limite notevole. il caso analisi 1 è nato da una copertura.»', mood: 'grave' },
    { speaker: 'commissario romero', color: 'blue', text: 'quarant\'anni. e il colpevole mi firmava i mandati.', mood: 'grave' },
],
'verita-5': [
    { speaker: 'verità n.5', color: 'cyan', text: '«piema sa che l\'ordine è in esecuzione. l\'ultimo accesso al log è suo: poteva fermarlo. ha chiuso il cassetto. ogni volta ha scelto il socio invece del realm.»', mood: 'grave' },
    { speaker: 'commissario romero', color: 'blue', text: 'cinque. il caso è... aspetta. ASPETTA. l\'ultimo accesso è di STANOTTE.', mood: 'grave' },
],
```

Le guide di romero (`romero-guida-N` si recita prima del rimpianto `N`, vedi `interactGuida`):
```ts
'romero-guida-1': [{ speaker: 'commissario romero', color: 'blue', text: 'sta\' vicino. nel void se ti allontani ti perdo.', mood: 'grave' }],
'romero-guida-2': [{ speaker: 'commissario romero', color: 'blue', text: 'una verità in tasca. andiamo piano. non scappa: è già un rimpianto.', mood: 'grave' }],
'romero-guida-3': [{ speaker: 'commissario romero', color: 'blue', text: 'lametta l\'abbiamo visto. adesso si scende dove non volevo guardare.', mood: 'grave' }],
'romero-guida-4': [{ speaker: 'commissario romero', color: 'blue', text: 'la riga sette era blu. anche la pagina uno del mio fascicolo è blu. no. non può essere.', mood: 'grave' }],
'romero-guida-5': [{ speaker: 'commissario romero', color: 'blue', text: 'l\'ultimo. o chiudo il caso, o il caso chiude me.', mood: 'grave' }],
```
(`romero-guida-fine`, `void-svolta`, `markolino-avviso-pedro`, `void-addio-romero` restano. In `void-svolta` la frase «l'ordine non è un ricordo, custode. è in ESECUZIONE. adesso.» resta: ora segue bene la verità 5.)

Le note del void (`lore-void-1..5`, già piazzate nella regione: cambia solo il testo). Oggi la 2 (lo scontrino) e la 3 (il bozzetto) **ripetono gli indizi del caso**: riscrivile.
```ts
'lore-void-2': [
    { speaker: 'telecamera alla deriva', color: 'cyan', text: '«telecamera spenta. giorno 41, ore 03:58. sul retro un adesivo, grafia di lametta: "non voglio vedere". la spia rossa è ancora tiepida.»' },
],
'lore-void-3': [
    { speaker: 'foglio a faccia in giù', color: 'cyan', text: '«un foglio su un tavolo che galleggia. se lo giri c\'è scritto "raddrizzalo tu". se lo lasci, torna a faccia in giù da solo.»' },
],
```
`lore-void-1` (la bozza di delega con la nota di romero), `lore-void-4` (il log con due versioni) e `lore-void-5` (il memo mai spedito di piema) restano: sono nuove rispetto al caso e preparano le verità 3–5.

Il processo nel finale (`'dei-processo-romero'`): dopo la prima riga di romero aggiungi
```ts
{ speaker: 'commissario romero', color: 'blue', text: 'e piema: anche quarant\'anni fa. l\'aula, il limite, la penna blu. lo metto a verbale. stavolta sì.', mood: 'grave' },
```
In `arcs.ts`, `'dei-processo-romero-solo'` (piema resta libero perché la riga originale è stata cancellata): la seconda riga di romero diventa
`'piema... su di te ho cinque rimpianti, quarant\'anni di verbali blu e nessuna riga originale. qualcuno ha cancellato la prova. un dio libero per un vizio di forma. quarant\'anni e finisce così.'`

Nel file del livello `src/content/levels/level13b-void.ts` aggiorna solo il **commento** in testa (ora: lametta 1–2, piema 3–5, niente ripetizioni del caso). Non toccare `entities` (la legenda a runtime viene dal JSON).

---

## 3. Flashback nuovi — `src/content/flashbacks.ts` e `src/engine/FlashbackManager.ts`

### 3.1 Prima di tutto leggi `FlashbackManager.ts`
- `CAST` (~riga 18) mappa i nomi del cast su texture (`lametta: 'npc-lametta'`, `piema: 'npc-piema'`, `occhio: 'enemy-telecamera'`...), con un'altezza per ognuno (~riga 33).
- `type Gesture` (~riga 37) e `SHOTS: Record<Gesture, ShotBuilder[]>` (~riga 697): ogni gesto è un mini-film di 3 inquadrature già animato. `gestureSound` dà il suono per gesto.
- Ogni `FlashbackDef` ha `captions` (3), `cast` (2), `gesture`, `tint`.

### 3.2 Le definizioni
Aggiungi tre `FlashbackDef`:

```ts
// lametta, la mattina dopo: gira il foglio e non chiede niente
'fb-mattina': {
    id: 'fb-mattina', tint: 0x9d7bd8,
    captions: [
        'la mattina del giorno 42. lo studio di lametta, tende tirate, una boccetta vuota sul tavolo.',
        'accanto, un foglio con la sua firma. lametta lo lesse a metà.',
        'poi lo girò a faccia in giù, prese il cappotto e uscì. non chiese niente a nessuno.',
    ],
    cast: ['lametta', 'occhio'],
    gesture: 'gira-foglio',
    note: 'notturno / verita-1: la vergogna, non il piano',
},
// giorno 37: la promessa che lametta non ricorderà
'fb-promessa': {
    id: 'fb-promessa', tint: 0xc084fc,
    captions: [
        'giorno 37. l\'atelier, pomeriggio. lametta dipingeva con il pennello in bocca.',
        'pedro chiese: «cosa succede se divento storto?»',
        'lametta, senza alzare gli occhi dalla tela: «ti raddrizzo io.» non se lo ricordò mai più.',
    ],
    cast: ['lametta', 'pedro'],
    gesture: 'dipinge',
    note: 'modello / verita-2: la promessa rovesciata',
},
// quarant'anni fa: piema riscrive il verbale dell'aula bruciata
'fb-verbale': {
    id: 'fb-verbale', tint: 0x3b6fb6,
    captions: [
        'quarant\'anni fa, la ruhra di notte. l\'aula di analisi 1 fumava ancora.',
        'piema aprì il verbale, cancellò un nome e sopra, in blu, ne scrisse un altro: «il limite notevole».',
        'il limite tese a infinito. nessuno riuscì mai a notificarglielo. romero ci provò per tutta la vita.',
    ],
    cast: ['piema', 'limite'],
    gesture: 'riscrive',
    note: 'delegato / verita-4: la prima copertura',
},
```

- `'gira-foglio'` è un gesto nuovo: aggiungilo a `type Gesture` e a `SHOTS` **clonando il gesto esistente più vicino** (leggi `passa-carta` e `riscrive` e scegli: serve un personaggio che guarda un foglio sul tavolo e lo capovolge; il secondo membro del cast, `occhio`, è la telecamera spenta sullo sfondo, ferma). Aggiungi un caso in `gestureSound` (un fruscio di carta: riusa il suono di `passa-carta`).
- `'limite'` non è nel `CAST`: aggiungilo con la texture del boss (`grep -n "boss-limite" src/engine/art/creatures/*.ts` per la chiave esatta) e un'altezza coerente con le altre (prova 110 e confronta con `piema: 140`). Controlla come il manager prepara le texture del cast (le creature si disegnano al primo uso con `ensureCreature`): se il cast usa solo texture già caricate, assicurati che `boss-limite` venga preparata prima del flashback.

### 3.3 Le associazioni (`FLASHBACK_BEFORE`)
- togli `'delegato-intro': 'fb-ordine'`, `'notturno-intro': 'fb-notte'`, `'modello-intro': 'fb-ritratto'`;
- aggiungi `'notturno-intro': 'fb-mattina'`, `'modello-intro': 'fb-promessa'`, `'delegato-intro': 'fb-verbale'`;
- `'revisore-intro': 'fb-riscrive'` resta (con lo skip del §1.4).
- `fb-ordine`, `fb-notte`, `fb-ritratto` restano associati agli indizi del caso e ai ricordi: è lì che vanno visti, una volta.

---

## 4. Boss e battute

### 4.1 `src/content/bosses.ts`
- `delegato.name`: `'il delegato (un rimpianto di piema)'`; `delegato.glowColor`: `0x60a5fa`.
- Commento sopra i rimpianti (~riga 403): "lametta (1-2) o piema (3-5)".
- Ordine e attacchi: lascia gli attacchi come sono (le mine di fogli del delegato ora sono verbali: funziona). Ricontrolla solo che la difficoltà cresca nell'ordine nuovo: oggi gli hp sono delegato 28, notturno 34, modello 38, revisore 42, garante 50. Nell'ordine nuovo diventano notturno 34, modello 38, revisore 42, **delegato 28**: alza il delegato a **46** (tra revisore e garante) e accorcia di poco i suoi `cooldownMs` (es. `{ 1: 2200, 2: 1800, 3: 1500 }`).

### 4.2 `src/content/barks.ts`
Sostituisci le battute dei rimpianti:
```ts
delegato: {
    by: 'il delegato', color: 'blue',
    lines: {
        engage: ['la colpa si passa. come un esame: a chi viene dopo.'],
        phase2: ['firma qui, commissario. come sempre.'],
        phase3: ['quarant\'anni di verbali puliti. tutti miei.'],
        idle: ['"responsabile: il limite notevole". in blu. ordinato.'],
    },
},
notturno: {
    by: 'il notturno', color: 'purple',
    lines: {
        engage: ['*hic* sono le quattro... ho firmato qualcosa?'],
        phase2: ['spegni la telecamera. non voglio vedere.'],
        phase3: ['l\'ho girato a faccia in giù. a faccia in giù non conta.'],
        idle: ['03:58. l\'ultima boccetta. l\'ultima, giuro.'],
    },
},
modello: {
    by: 'il modello', color: 'purple',
    lines: {
        engage: ['in posa, pedro. ti disegno come vedo tutto, stanotte.'],
        phase2: ['"ti raddrizzo io". l\'ho detto io? quando?'],
        phase3: ['era venuto bene. era venuto storto. è uguale.'],
        idle: ['tre pennellate. un passo indietro.'],
    },
},
```
`revisore` resta. In `garante.phase3` cambia «...sapevo. sapevo da prima dei sei giorni.» in `'...sapevo. sapevo stanotte. ho chiuso il cassetto.'`.

### 4.3 L'aspetto del delegato
`src/engine/art/creatures/bossesVoid.ts`, `const delegato` (~riga 211): è un burocrate dipinto nei viola di lametta. Ora è piema: porta la palette sui blu di piema (guarda `const revisore` e `const garante`, sono già di piema, e usa le stesse famiglie di colore per corpo, ombra e luci emissive). Non cambiare forma, dimensioni (`w`, `h`) né numero di fotogrammi. Se nel disegno c'è un dettaglio "di lametta" (pennello, colore viola sulle mani), sostituiscilo con una penna blu.

---

## 5. Verifica
1. `npm run build` e `cd editor && npx tsc -b --noEmit`.
2. Nessuna verità ripete un indizio:
   ```bash
   grep -n "'verita-[1-5]'" -A3 src/content/story.ts
   ```
   leggile accanto a `'indizio-1'`, `'indizio-2'`, `'indizio-3'` e `'caso-completo'`: non devono dire la stessa cosa.
3. Controlla a mano la catena in `GameScene`: `setupVoid` → `spawnRegret(nextRegret())` → sconfitta (`onBossDefeated`, `case 'notturno' | 'modello' | ...` → `onVeritaRivelata(VOID_REGRETS.indexOf(kind))`) → `verita-N` → prossimo o `voidClimax()` all'ultimo.
4. Se l'utente ti dà il permesso di usare il browser, prova il void dal menu dev: `http://localhost:5173/?level=void` (vedi `HANDOFF.md` §2 per la tecnica dello screenshot a pannello nascosto). Senza permesso, scrivi nel resoconto che la verifica in gioco non è stata fatta.
5. `DEV_LOG.md`: ADR nuovo "il void parla di piema" (ordine, motivazione, skip del flashback, delegato passato a piema).
6. Commit: `git add .` poi `git commit -m "il void parla di piema"`.

## Cosa NON fare
- Non rinominare i `BossKind` né i flag `boss-down-*`.
- Non cambiare il numero di arene né rigenerare la regione del void.
- Non toccare il 33 del void (altare, boss `trentatre`): resta com'è.
- Non far dire al geco nulla nel void (regola del piano 2).
