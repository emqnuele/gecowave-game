# Piano 4 — la tana di lochef85 diventa un capitolo horror

> Prima leggi `plans/00-INDEX.md`. Il piano 2 (voce del geco) deve essere fatto: qui il geco non pensa ad alta voce e non fa gag.

## Obiettivo e decisione dell'utente

Oggi lochef85 è un rapitore/stalker trattato **a metà tra horror e barzelletta**: rapisce il geco ("dorme. che carino. portatelo dentro" --> btw questo dialogo e come funziona mi piace molto, da tenere), ha dodici statue di ospiti "una ancora tiepida" e il cadavere di vavleeh in casa, ma parla da macchietta ("non era amore, era reato. me l'hanno già detto in tanti"), e il giocatore può **lasciarlo andare**: apre una trattoria in piazza dove "un ispettore non è più tornato a casa" e regala brodo curativo.

L'utente ha deciso: **la tana è al 100% un capitolo horror**, a temi profondi e dark. Lochef85 è un **rapitore e un predatore** (adescamento di bambini), **mai simpatico, mai riscattato, mai una battuta**. La possibilità di liberarlo **sparisce**: lochef finisce sempre arrestato da romero.

## Guardrail di scrittura (obbligatori)

Questo è un capitolo su un predatore. Si scrive come i buoni horror: **per sottrazione**.
- **Nessun contenuto sessuale**, nessun atto, nessuna descrizione del corpo di nessuno, nessuna allusione sessuale esplicita, **mai** riferita a minori. Niente "foto" di bambini, niente dettagli fisici.
- La natura di lochef si capisce **solo** da schemi riconoscibili di adescamento e dalle loro conseguenze: attenzioni non richieste, regali ai bambini, "è un segreto nostro", "non dirlo alla mamma", isolamento ("gli ospiti non escono"), il controllo travestito da affetto ("ti voglio bene io"), e dalle **assenze**: scarpe piccole, bimbi del server che "non fanno più il login", dodici statue, una vetrinetta di oggetti.
- Il punto di vista è quello delle vittime e dei sopravvissuti, non del carnefice. Le vittime hanno dignità; nessuna è una battuta.
- Lochef non ha una giustificazione né un passato tragico. Non si "capisce".
- Il resto del gioco resta com'è: è solo questo capitolo a cambiare registro. Le battute degli altri personaggi **su lochef** (fuori dalla tana) diventano serie anche loro.

---

## 1. Testi da riscrivere

Gli id non cambiano; cambia solo il testo (salvo dove scritto "togli"). Cerca per id: `grep -n "'lochef-\|'tana-\|'vavleeh\|'lore-statue\|'lore-poster\|'lore-frigo\|'lore-collezione\|'notino-tana" src/content/story.ts src/content/arcs.ts`.

### 1.1 Prima della tana (semi)

`'lochef-cameo'` (npc nella tecnokill, `level04-tecnokill.ts` lettera `L`): oggi «ciao bello... cioè, ciao custode. dicono che i frammenti ti rendano... divino...» + gag del geco. Nuovo:
```ts
'lochef-cameo': [
    { speaker: 'lochef85', color: 'red', text: 'ciao. tu sei il custode nuovo? sei più piccolo di come ti immaginavo.' },
    { speaker: 'lochef85', color: 'red', text: 'ai bimbi del server regalo sempre qualcosa. una skin, una caramella. poi vengono a trovarmi. da me c\'è posto. c\'è sempre posto.' },
    { speaker: 'il geco', color: 'green', text: '*il geco fa un passo indietro.*' },
],
```
`'bimbo-rp-2'` (bimbo del server, tecnokill): aggiungi in coda una riga:
```ts
{ speaker: 'bimbo del server', color: 'red', text: '...e se vedi uno col grembiule che regala le skin, non prenderle. il mio amico le ha prese. non fa più il login.', mood: 'crepa' },
```

### 1.2 Il risveglio e la caccia
```ts
'tana-risveglio': [
    { speaker: 'il geco', color: 'green', text: '*il trenbolone pesa sugli occhi. il geco li chiude un attimo. UN attimo.*' },
    { speaker: '???', color: 'red', text: '...dorme. bene. piano, non svegliatelo. mettetelo con gli altri.' },
    { speaker: 'il geco', color: 'green', text: '*un letto piccolo. una porta chiusa da fuori. sul muro, un poster con la sua faccia.*', mood: 'grave' },
],
'lochef-benvenuto': [
    { speaker: 'lochef85', color: 'red', text: 'ben svegliato, piccolo. non avere paura. qui nessuno ti fa del male. qui ti voglio bene io.', mood: 'grave' },
    { speaker: 'lochef85', color: 'red', text: 'lo spaccino del bancone porta sempre bene. due boccette e dormite come angeli. tutti quanti.', mood: 'grave' },
    { speaker: 'lochef85', color: 'red', text: 'adesso mangi, poi dormi, poi restiamo così. gli altri all\'inizio facevano come te. poi hanno imparato.', mood: 'grave' },
    { speaker: 'il geco', color: 'green', text: '*il geco cerca la porta.*' },
    { speaker: 'lochef85', color: 'red', text: 'scappi? la prima volta scappano tutti.', mood: 'grave' },
],
'lochef-perso': [
    { speaker: 'lochef85', color: 'red', text: 'dove sei? ...va bene. la porta di casa è una sola. ti aspetto lì. io aspetto sempre.', mood: 'grave' },
],
'lochef-ritorno': [
    { speaker: 'lochef85', color: 'red', text: 'ti ho lasciato andare in giardino apposta. volevo che vedessi gli altri. così capisci.', mood: 'grave' },
],
'lochef-perso-2': [
    { speaker: 'lochef85', color: 'red', text: 'di nuovo. non mi arrabbio. con voi non mi arrabbio mai. vi aspetto e basta.', mood: 'grave' },
],
```

### 1.3 La casa (lore ambientale già piazzata nella regione)
```ts
'lore-statue': [
    { speaker: 'statua nel giardino', color: 'red', text: '«galleria degli ospiti: dodici statue a grandezza naturale, tutte in pose di fuga. le più piccole hanno ancora le scarpe slacciate. la dodicesima è tiepida.»', mood: 'grave' },
],
'lore-poster': [
    { speaker: 'poster in A0', color: 'red', text: '«un poster del custode. di te. foto prese da lontano, di notte, mentre dormivi sul muro della piazza. la data di stampa è di mesi prima che qualcuno ti chiamasse custode.»', mood: 'grave' },
],
'lore-frigo': [
    { speaker: 'frigo della tana', color: 'red', text: '«regole della tana, con le lettere calamitate colorate: 1. gli ospiti non escono. 2. gli ospiti non chiamano la mamma. 3. è un segreto nostro. la regola 3 è scritta più grande.»', mood: 'grave' },
],
'lore-collezione': [
    { speaker: 'vetrinetta chiusa a chiave', color: 'red', text: '«dentro: un cappellino del server di notino, uno zaino con le spille, un biglietto del citelis mai convalidato, dodici paia di scarpe piccole in fila. uno spazio vuoto con un bigliettino: "riservato".»', mood: 'grave' },
],
'vavleeh-corpo': [
    { speaker: 'il geco', color: 'green', text: '*una stanza senza finestre. quello che resta di vavleeh.*', mood: 'grave' },
    { speaker: 'vavleeh (ciò che resta)', color: 'purple', text: '...lo specchio... diceva il vero... non mangiare... non dormire... non credergli quando dice che ti vuole bene...', mood: 'grave' },
    { speaker: 'il geco', color: 'green', text: '*il geco esce dalla stanza camminando all\'indietro.*' },
],
```
`arcs.ts`, `REGION_NOTES.tana[0]` («ospite n.11. sono uscito. ...non mangiare il dolce. CORRI.») è già perfetta: resta.

### 1.4 Notino davanti alla tana
```ts
'notino-tana': [
    { speaker: 'notino', color: 'red', text: 'TROVATO!! adesso ti... aspetta. questa è la tana di LOCHEF85.' },
    { speaker: 'notino', color: 'red', text: 'no. no no no. qui non entro. lui al server regalava le skin ai bimbi piccoli. poi i bimbi non facevano più il login. io qui NON ENTRO.', mood: 'crepa' },
    { speaker: 'il geco', color: 'green', text: '*notino scappa. la porta resta chiusa da fuori.*' },
],
```

### 1.5 Il boss e dopo
```ts
'lochef-intro': [
    { speaker: 'lochef85', color: 'red', text: 'eccoti. lo sapevo. nessuno esce dalla tana. è una regola che ho scritto io, sul frigo.', mood: 'grave' },
    { speaker: 'lochef85', color: 'red', text: 'non è colpa tua, piccolo. è che ti voglio bene. e chi vuole bene non lascia andare.', mood: 'grave' },
],
'lochef-sconfitto': [
    { speaker: 'lochef85', color: 'red', text: 'no... voi non capite... io vi volevo bene... a tutti e dodici...', mood: 'grave' },
],
```
In `arcs.ts`:
```ts
'lochef-consegna': [
    { speaker: 'il geco', color: 'green', text: '*il geco lega lochef85 al tavolo apparecchiato per due e chiama la questura dal telefono.*', mood: 'grave' },
    { speaker: 'commissario romero', color: 'blue', text: '(al telefono) lochef85. ricercato da troppo tempo. arrivo. non toccare niente, custode: in quella casa ogni cosa è una prova.', mood: 'grave' },
    { speaker: 'commissario romero', color: 'blue', text: 'e custode... la dodicesima statua. controllala. se è tiepida, non è una statua.', mood: 'grave' },
],
'ospite-12': [
    { speaker: 'ospite n.12', color: 'red', text: '...sei vero? non è un\'altra prova? lui faceva così. apriva la porta e poi la richiudeva.', mood: 'grave' },
    { speaker: 'ospite n.12', color: 'red', text: '...la mia mamma mi aspetta ancora? ...va bene. allora vado. piano. non correre mi diceva sempre lei.', mood: 'grave' },
],
'ospite-12-piazza': [
    { speaker: 'ospite n.12', color: 'red', text: 'ogni giovedì accendo le candele alla fontana. undici. una per ognuno. la dodicesima no: io sono qui.', mood: 'grave' },
],
'romero-lochef': [
    { speaker: 'commissario romero', color: 'blue', text: 'prima di tutto: lochef85 è in cella. la tana l\'abbiamo murata. dentro c\'erano undici nomi. li ho scritti tutti, a penna.', mood: 'grave' },
],
```
**Togli** da `arcs.ts`: `'lochef-libero'`, `'lochef-trattoria'`, `'romero-lochef-libero'`.

### 1.6 Battute in battaglia (`src/content/barks.ts`, voce `lochef`)
```ts
lochef: {
    by: 'lochef85', color: 'red',
    lines: {
        engage: ['finalmente soli, piccolo. non avere paura.'],
        phase2: ['non scappare. scappare fa arrabbiare la casa.'],
        phase3: ['dodici... tredici... tredici è un bel numero tondo.'],
        hit: ['non volevo. lo dico sempre. non volevo.'],
        heal: ['chi ti ha dato da mangiare? solo io ti do da mangiare.'],
        idle: ['ti ho preparato la camera. la serratura è fuori.'],
    },
    extra: {
        whisper: ['dove sei, piccolo?', 'la casa ti sente.', 'gli altri all\'inizio facevano così.', 'ho apparecchiato. vieni.', 'è un segreto nostro.', 'non chiamare la mamma. non serve.'],
    },
},
```
`BarkTrigger` è un tipo chiuso (`engage | phase2 | phase3 | hit | heal | low | idle`): i momenti propri di un boss stanno in `extra` (`BarkSet.extra?: Record<string, Bark[]>`), come fanno l'ombra e lametta. La meccanica (§3) legge `BOSS_BARKS.lochef?.extra?.whisper`.

### 1.7 Il resto del gioco che parla di lochef
- `src/content/pedro.ts`, `tana`: `['lochef apparecchia per due. tu non sederti. corri.', \`...perché ti sto aiutando? non lo so. il 99% di me dice di ${gl('smettere')}.\`]`
- `src/content/phone.ts`:
  - `OBJECTIVES.tana`: `'sei nella tana di lochef85. la porta è chiusa da fuori. trova un\'altra uscita. non mangiare niente.'`
  - `POSTS` lochef85: testo `'c\'è posto. c\'è sempre posto.'` (togli l'emoji 🍖).
  - aggiungi un post `{ author: 'romero', handle: '@det.romero', color: 'blue', likes: 0, text: 'tana di lochef85 murata. undici nomi a verbale. una persona tornata a casa. oggi non scrivo altro.', needs: 'boss-down-lochef' }`.
- `src/content/folk.ts`:
  - i passanti `burrow` (righe ~105–112: "aiuto-cuoco terrorizzato", "assaggiatore") diventano persone nascoste nella tana. Esempio (tieni la funzione `C(look, name, color, pace, barks, talks)` e gli stessi `look`):
    ```ts
    C('cuoco', 'ospite nascosto', 'red', 40, ['zitto. ascolta.', 'quando fischietta, nasconditi.', 'non mangiare il dolce.'], [
        ['sono qui da tre inverni.', 'ho smesso di contare quando lui ha smesso di chiamarmi per nome.'],
        ['dietro il frigo c\'è un passaggio.', 'l\'ospite numero undici l\'ha trovato. io non ho il coraggio.'],
    ]),
    C('vecchio', 'ospite che non dorme', 'red', 24, ['non dormire qui.', 'lui entra quando dormi.', 'conta le porte. sono sempre una in più.'], [
        ['ero venuto per un regalo.', 'tanti anni fa. il regalo l\'ho ancora in tasca. non l\'ho mai aperto.'],
    ]),
    ```
  - il "profugo della tana" in piazza (~riga 197): togli le battute che fanno ridere di lochef («paga in assaggi... anche il contratto», «niente pesto qui»). Nuove battute: `['non parlo della tana.', 'ho ancora le chiavi in tasca. non aprono niente.', 'la notte lascio la luce accesa.']`, talks: `[['sono uscito dal passaggio dietro il frigo.', 'ero l\'undicesimo. ho lasciato il biglietto per il dodicesimo. spero l\'abbia letto.']]`. Questa persona è l'ospite n.11: coerente con la nota della regione.
  - la notizia con `flag: 'boss-down-lochef'` (~riga 235): `'lochef è in cella. stanotte, nella tana, per la prima volta non fischietta nessuno.'`
- `src/content/quests.ts`, `q-tana-ricetta` (oggi: ricetta "senza ingredienti umani", tono comico). Riscrivila come **"la chiave della dispensa"**: stessa struttura (`kind: 'consegna'`, giver, thing, recipient, intro, waiting, done, reward). Il giver è un `ospite nascosto` che ha trovato la chiave della dispensa dove lochef tiene chiuso un altro ospite; il geco la porta al recipient (l'ospite chiuso, in un'altra stanza), che così può scappare. Testi brevi, gravi, senza battute. `reward` resta `{ item: 'grembiule-cuoco' }` (vedi 2.3). Non cambiare l'`id`.
- `src/content/lessons.ts`, `ammiratore.hint`: «gli ammiratori di lochef inseguono chiunque ti somigli...» → `'i fan di lochef inseguono chiunque ti somigli. evoca il riflesso: perdono la testa per lui e tu li colpisci alle spalle.'` (il tasto lo rimette il piano 6 con i segnaposto: qui togli solo la lettera "(G)").
- `src/content/bosses.ts`, `lochef.name`: `'lochef85'` (togli "il perverso": il gioco non commenta, mostra).
- `src/content/story.ts`, finali (`endingEpilogues` dal piano 1, o `endingCards` se il piano 1 non c'è): togli la riga `lochef-libero`; la riga `lochef-arrestato` diventa `'lochef85 sconta la pena in una cella senza cucina. la tana è murata. in piazza, il giovedì, l\'ospite n.12 accende undici candele alla fontana.'`
- Credits (`CREDITS` in `story.ts`): oggi `{ role: 'roleplay non richiesto', names: ['notino', 'lochef85'] }`. Separali: notino resta lì; lochef85 va in una riga a parte `{ role: 'nella tana', names: ['lochef85', 'gli undici ospiti', 'l\'ospite n.12'] }`.

---

## 2. Codice e dati

### 2.1 Niente più scelta (`src/scenes/GameScene.ts`, `onBossDefeated`, `case 'lochef'`, ~riga 4158)
Oggi: `lochef-sconfitto` → cuore → `choice-show` "chiama la questura / lascialo andare". Nuovo flusso, senza scelta:
1. `lochef-sconfitto`;
2. cuore (`spawnCuore(..., 'cuore-lochef', true)`, com'è);
3. `state.setFlag('lochef-arrestato')`, dialogo `lochef-consegna`, taglia +200 barre (codice di oggi del ramo "questura");
4. spawn dell'npc `ospite-12` vicino alla statua del giardino (vedi 2.4), che si parla con E e poi se ne va (fade e destroy dopo il dialogo, flag `ospite-12-libero`).
Togli il ramo `lochef-libero` e il `return` che salta la scelta se i flag esistono (sostituiscilo con: se `lochef-arrestato` c'è già, salta i passi 3–4).

### 2.2 Piazza e romero
- `spawnPiazzaGuests` (~riga 1143): togli la riga di `lochef-trattoria`; aggiungi `if (state.hasFlag('ospite-12-libero')) this.spawnNpc('ospite-12-piazza', 58 * TILE, feet);` (stessa x della vecchia trattoria).
- `case 'romero-caso'` (~riga 1086): `pre` diventa `state.hasFlag('lochef-arrestato') ? 'romero-lochef' : null`.
- `src/engine/npcTexture.ts`: aggiungi `if (id.startsWith('ospite-12')) return 'npc-studente';` (un ragazzo; se nei 16 npc di `src/engine/art/creatures/npcs.ts` c'è una sagoma più adatta e neutra, usala. **Non** usare la sagoma di lochef). L'editor importa questo file: tienilo compilabile.

### 2.3 Oggetti e trofei
- `src/content/items.ts`:
  - **togli** `'brodo-lochef'` da `ITEMS` e aggiungilo a `LEGACY_ITEMS` con valore `80` (chi lo aveva nello zaino ritrova barre: lo fa già il costruttore di `state.ts`);
  - `src/engine/inventory.ts`: togli `'brodo-lochef'` da `HEALS` e dall'ordine di `quickHeal`;
  - `'pancia-lochef'` (amuleto dal boss): **non cambiare l'id** (salvataggi). Cambia `name: 'la chiave della tana'`, `icon: '🗝️'`, `desc: '+2 vite massime. la porta si apriva solo da fuori. adesso no.'`;
  - `'grembiule-cuoco'` (ricompensa della missione): `name: 'grembiule strappato'`, `desc: '+1 vita massima e ti curi più in fretta. qualcuno l\'ha usato per legare una porta da dentro.'`.
- `src/content/achievements.ts`, `chef-stellato` (non cambiare l'id): `icon: '🚪'`, `name: 'la porta da dentro'`, `desc: 'esci dalla tana e consegna lochef85 alla questura.'`.

### 2.4 Salvataggi vecchi
In `src/engine/state.ts`, nel costruttore dopo il caricamento: se `flags` contiene `'lochef-libero'`, toglilo e aggiungi `'lochef-arrestato'` (romero lo arresta comunque: canone). Una riga di commento sul perché.

### 2.5 Tono (`src/content/tone.ts` e `story.ts`)
- `tana`: `{ level: 70, act: 2, folk: 'quieto', deaths: 'serie' }` (se il piano 2 ha tolto il campo `geco`, non rimetterlo).
- Frasi di morte dedicate: in `story.ts` aggiungi
  ```ts
  /* nella tana non si scherza nemmeno da morti */
  export const DEATH_TANA = [
      'la porta è chiusa da fuori. rialzati.',
      'lui aspetta che ti stanchi. non stancarti.',
      'gli altri si sono fermati. tu no.',
      'il passaggio dietro il frigo esiste. trovalo.',
  ];
  ```
  e in `deathPunchline(levelId)` restituisci da `DEATH_TANA` quando `levelId === 'tana'`.

---

## 3. Gameplay horror: la meccanica della tana

Le meccaniche per bioma stanno in `src/engine/mechanics/` (leggi `types.ts` e `Cameras.ts`, ADR-022 in `DEV_LOG.md`): sono **additive**, non toccano la griglia verificata, si creano in `createMechanic(ctx)` per id di regione. Crea `src/engine/mechanics/Tana.ts` e registralo: `case 'tana': return new Tana(ctx);`.

### 3.1 Buio
Come `Cameras.darken()` (copia l'approccio, non la classe): ambiente quasi nero (`0x07040a`), luce del geco ridotta (raggio 230, intensità 1.1), ripristino in `destroy()`. Il buio rende gli inseguimenti spaventosi; lochef resta sempre visibile (ha già la sua luce rossa, `GameScene.updateChase`).

### 3.2 La voce dalla casa (sussurri)
Fuori dagli inseguimenti, ogni 25–45 s (casuale, `seeded` da `types.ts`), se non c'è un dialogo aperto e non c'è un inseguimento in corso, emetti un sottotitolo:
```ts
bus.emit('bark', { speaker: 'lochef85', color: 'red', text: pick(whispers) });
```
con le righe `whisper` di `barks.ts` (§1.6). Accompagnalo con un suono basso e lontano: guarda `src/engine/sfx.ts` e `src/engine/audio/Soundscape.ts` per un suono "respiro grosso sotto" o simile già esistente; se non c'è niente di adatto, un fischiettio sintetico breve (due note) è sufficiente. Mai due sussurri di fila uguali. La meccanica deve sapere se c'è un inseguimento: aggiungi al `MechanicCtx` una funzione `chaseRunning: () => boolean` (come esiste `trialRunning`) e passala da `GameScene` (vero se `this.chaseSprite` esiste).

### 3.3 Nascondigli durante gli inseguimenti
È il cuore dell'horror: invece di correre e basta, il giocatore può **nascondersi**.
- **Dove**: 1 nascondiglio (armadio / dispensa) ogni 2–3 stanze del percorso **dentro le zone di caccia** (tra i marker `caccia-inizio` e `caccia-fine`, che `GameScene` conosce come `chaseStarts`/`chaseEnds` in termini di progresso). Piazzali sui segmenti del grafo di navigazione (`ctx.nav.segments`) come fanno le telecamere, lontano da microfoni, fermate e npc (`ctx.avoid`). Deterministici con `seeded('tana:nascondigli')`.
- **Aspetto**: un armadio a inchiostro disegnato su canvas (guarda `src/engine/art/props.ts` per lo stile: forme piene, contorno spesso, tratteggio). Ante socchiuse, un filo di luce dentro.
- **Come**: E vicino all'armadio (registra un `interactable` come fanno gli npc in `GameScene`: la meccanica può esporre i nascondigli alla scena tramite una funzione nel `MechanicCtx`, es. `addInteractable(x, y, range, onInteract)`). Da nascosto:
  - il geco non si vede (alpha 0.1), non si muove, è invulnerabile ai contatti; serve un'API nuova in `Player`: `hidden: boolean` letto in cima a `update()` (come `stunned`: niente input, velocità a zero) e in `invulnerable`;
  - si esce con E o con qualsiasi tasto di movimento;
  - **lochef perde la traccia**: in `updateChase`, se `player.hidden` lochef non va verso il geco ma verso l'ultimo punto visto e poi si allontana piano, sussurrando una riga `whisper` (bark urgente);
  - **massimo 6 secondi**: oltre, "la casa ti sente": il geco viene tirato fuori, 1 danno, e lochef ritorna in caccia da vicino (200 px). Un armadio usato una volta non si riusa nella stessa caccia (le ante restano aperte).
- **Feedback**: dentro l'armadio la musica si attutisce (usa il filtro già esistente: cerca in `src/engine/music.ts`/`acoustics.ts` come si ovatta la musica in pausa) e si sente il battito (`ultimo cuore = battito` è già un effetto di situazione, ADR-018: riusalo).
- Il primo inseguimento deve insegnare il nascondiglio: alla prima caccia, il primo armadio sul percorso brilla appena e compare il toast `'un armadio. E per nasconderti.'` (una volta sola, flag `spiegato-nascondiglio`).

### 3.4 Il giardino e l'ospite n.12
La lore `'lore-statue'` è un'entità della regione (cerca nella legenda di `public/regions/tana.json` la lettera con `{ type: 'lore', id: 'lore-statue' }` e trovala nella griglia per avere la stanza del giardino). Dopo l'arresto, l'npc `ospite-12` va spawnato su uno `spot` di quella stanza (`layout.spots` contiene `[colonna, riga, stanza]`): così è sempre raggiungibile.
Facoltativo, se il tempo lo permette: piazza nella stessa stanza 11 piccole targhette a inchiostro sui `spots` liberi, ognuna con un oggetto (non nomi, non età): "un cappellino del server", "uno zaino con le spille", "un biglietto mai convalidato"... interagibili con una riga ciascuna. Nessuna è una battuta.

---

## 4. Verifica
1. `npm run build` e `cd editor && npx tsc -b --noEmit`.
2. Zero risultati:
   ```bash
   grep -rn "lochef-libero\|lochef-trattoria\|brodo-lochef\|il perverso\|cucina vegano\|ingredienti umani" src
   ```
   (eccezione ammessa: `LEGACY_ITEMS` con `'brodo-lochef'` e la migrazione in `state.ts` con `'lochef-libero'`).
3. Rileggi tutte le righe della tana in fila: nessuna battuta comica, nessun contenuto sessuale, nessun dettaglio fisico su nessuno. Se una riga ti sembra al limite, toglila: **per sottrazione**.
4. Prova la logica senza browser leggendo il codice: `updateChase` con `player.hidden`, il timeout dei 6 s, la fine della caccia per progresso o per 50 s (che deve restare), il ripristino delle luci in `destroy()`.
5. Con il permesso dell'utente, prova `http://localhost:5173/?level=tana`. Senza permesso, dichiara nel resoconto che la prova in gioco manca.
6. `DEV_LOG.md`: ADR nuovo "la tana è horror" (decisione, guardrail di scrittura, meccanica: buio, sussurri, nascondigli, ospite n.12, migrazione dei salvataggi).
7. Commit: `git add .` poi `git commit -m "la tana fa paura davvero"`.

## Cosa NON fare
- Non scrivere nulla di sessuale o di esplicito, nemmeno "per far capire". La regola è assoluta.
- Non dare a lochef battute comiche, un passato tragico o un riscatto.
- Non rigenerare la regione della tana: tutto ciò che aggiungi è a runtime.
- Non cambiare id di oggetti, trofei, flag o dialoghi esistenti (salvo togliere quelli indicati).
