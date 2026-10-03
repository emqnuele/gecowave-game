# Piano 5 — le abilità: meccanica, grafica, suono

> Prima leggi `plans/00-INDEX.md`. Questo piano **non** cambia i tasti (lo fa il piano 6) e **non** mette niente nel mondo (lo fa il piano 7): prepara le abilità perché i due piani dopo possano usarle. Quando un'abilità "apre il mondo", qui si crea solo **il gancio** (un evento), non il sigillo.

## Obiettivo (parole dell'utente)
"rivedere / sistemare / migliorare le abilità: alcune sono inutili, come quella di smela. in generale texture e abilità sono banali, le possiamo migliorare anche solo di grafica."

Ogni abilità deve avere:
1. **un ruolo chiaro in combattimento** (quando la usi e perché, diverso dalle altre);
2. **un gancio nel mondo** (un evento che il piano 7 userà per aprire i sigilli);
3. **una grafica a inchiostro** coerente col resto del gioco (contorno spesso, tratteggio, strato emissivo per le luci) invece di cerchi di `Graphics` e particelle generiche;
4. **un suono suo**;
5. **un tempo di ricarica leggibile** nell'HUD.

## Stato di oggi (leggi il codice prima di toccarlo)

| abilità | dove vive | cosa fa oggi | problema |
|---|---|---|---|
| `scivolata` | `Player.startDash` | 170 ms a 800 px/s, invulnerabile, ricarica 450 ms. sbanda i citelis (`LESSONS`) | buona. grafica: copie del geco tinte di verde |
| `rimbalzo` | `Player.update` (salto in aria) | doppio salto | buona. grafica: 7 scintille |
| `aggrappo` | `Player.update` | presa e salto dai muri | buona. grafica: polvere |
| `riflesso` | `GameScene.onRiflesso` + `entities/Companion.ts` | clone per 6 s (costo 25 flow, ricarica 9 s) che insegue e colpisce piano; i nemici lo prendono di mira (`Enemy.update(target)`); assorbe i proiettili | utile ma passivo; grafica: il geco tinto di ciano |
| `risonante` | `Player.updateRisonante` + `GameScene.onRisonante` | tieni premuto 650 ms, rilasci: proiettile perforante (costo 30). **se rilasci prima non succede niente** (`sfx.ui`) | rilascio a vuoto frustrante, un solo livello; grafica: una sinusoide |
| `analisi` | `GameScene.onAnalisi/updateAnalisi` | 3 s, 3 glifi orbitano, 1 danno ogni 320 ms nel raggio 120 (costo 40, ricarica 8 s); ×3 sui `numero` | generica; i glifi sono 3 segni a linee (`glyph-0..2` in `textures.ts`) |
| `scudo` | `GameScene.onScudo/updateScudo/reflectProjectile` | 2,2 s di bolla che rimanda i proiettili al 40% (costo 20, ricarica 6,5 s) | nessuna abilità nel tempismo; grafica: un cerchio |
| `acquatossica` | `GameScene.onAcquaTossica/updateAcquaTossica` | pozza ai piedi 4,5 s, raggio 90, rallenta e fa 1 danno ogni 600 ms (costo 30, ricarica 7 s) | **inutile**: ai piedi, lenta, debole; grafica: un'ellisse |
| `rigenerazione` | `Player.updateMalusERigenerazione` | passiva: cura 1 ogni 6 s se non ti colpiscono da 5 s; immune ai malus (trenbolone, smela) | buona; invisibile |

Costanti in `src/config.ts` (`COMBAT`). Moltiplicatori degli amuleti in `src/content/items.ts` (`charmMods`: `abilityCost`, `risonante`, ecc.). Debolezze dei nemici in `src/content/lessons.ts` (`hitMult(kind, source)` con `source` in `'side' | 'up' | 'down' | 'shot' | 'reflect' | 'analisi' | 'acqua'`).

---

## 1. Infrastruttura comune (fallo per primo)

### 1.1 Grafica: `src/engine/art/abilityFx.ts`
Un modulo nuovo che disegna su canvas (come `src/engine/art/creatureKit.ts` e `TrentatreMarks.ensureTexture`) le texture delle abilità, una volta per scena, con lo stile del gioco:
- **contorno d'inchiostro** `#0b0c10` spesso 2–3 px attorno alle forme;
- riempimento a colori sporchi del colore della wave, **tratteggio** dal lato lontano dalla luce (luce dall'alto a sinistra), usa `hatch`/`crossHatch`/`wobble` di `src/engine/art/ink.ts`;
- dove serve luce, una texture gemella `<chiave>~glow` da sommare in `BlendModes.ADD` (come lo strato emissivo delle creature, ADR-017), così il buio non la spegne.

API suggerita:
```ts
export function ensureAbilityFx(scene: Phaser.Scene): void;     // crea tutte le texture se mancano
export const FX = {
    dashGhost: 'fx-dash-ghost',          // sagoma del geco in inchiostro, si colora a runtime
    ringJump: 'fx-ring-jump',            // anello a pennello, 3 fotogrammi
    wave1: 'fx-wave-1', wave2: 'fx-wave-2', waveTap: 'fx-wave-tap',
    chalkCircle: 'fx-chalk-circle', glyphs: ['fx-glyph-int', 'fx-glyph-sum', 'fx-glyph-del', 'fx-glyph-lim', 'fx-glyph-sqrt', 'fx-glyph-pi'],
    qed: 'fx-qed', chalkX: 'fx-chalk-x',
    shield: 'fx-shield-crt', rec: 'fx-rec',
    bottle: 'fx-bottle', shard: 'fx-shard', puddle: 'fx-puddle',
    mirrorCrack: 'fx-mirror-crack', mirrorShard: 'fx-mirror-shard',
    regenDrip: 'fx-regen-drip',
} as const;
```
Chiamala in `GameScene.create` accanto agli altri preparativi (cerca `ensurePickupTextures` o `prewarmCreatures`). Le texture vecchie (`proj-risonante`, `glyph-0..2` in `textures.ts`) si tolgono **dopo** aver migrato tutti gli usi (grep).

I glifi di analisi e le scritte ("q.e.d.", "REC") si disegnano con il font **Permanent Marker** su canvas, come fa `TrentatreMarks.ensureTexture` (font già caricato in `main.ts`): `ctx.font = '28px "Permanent Marker", cursive'`, contorno d'inchiostro con `strokeText` poi riempimento.

### 1.2 Il gancio nel mondo: evento `wave-world`
Ogni volta che un'abilità "tocca" il mondo, la scena emette un evento di scena (non il bus DOM):
```ts
// in GameScene, da tipizzare accanto agli altri eventi di scena
this.events.emit('wave-world', {
    wave: 'risonante' | 'analisi' | 'scudo' | 'acquatossica' | 'riflesso' | 'scivolata',
    x: number, y: number,
    /** zona toccata: cerchio (analisi, pozza) o rettangolo (proiettile, clone) */
    area: Phaser.Geom.Circle | Phaser.Geom.Rectangle,
    /** livello del colpo risonante (1 o 2), rimando perfetto dello scudo (2) */
    level?: number,
});
```
Chi lo emette (dettagli nelle sezioni sotto): il proiettile risonante a ogni fotogramma di volo (throttle: ogni 60 ms), la "q.e.d." di analisi, ogni proiettile rimandato dallo scudo a ogni fotogramma (throttle), l'impatto e la pozza dell'acqua (ogni 300 ms), il clone del riflesso (ogni 200 ms, area = il suo corpo). Il piano 7 si iscrive a questo evento. Nessuno lo ascolta ancora: va bene.

### 1.3 Ricariche leggibili nell'HUD
`src/ui/hud.ts` mostra le wave attive in `ACTIVE_ORDER` (chip con tasto e nome). Aggiungi la ricarica:
- `Player` espone un getter `cooldowns(): Partial<Record<AbilityId, number>>` con la frazione 0..1 di ricarica restante per `riflesso`, `risonante`, `analisi`, `scudo`, `acquatossica` (usa i campi `*ReadyAt` già presenti e la durata della ricarica di ognuno);
- `GameScene.update` emette sul bus `wave-cooldowns` al massimo **10 volte al secondo** (aggiungi il tipo in `src/engine/events.ts`);
- `hud.ts` imposta su ogni chip una variabile CSS `--cd` (0..1) e il CSS disegna un velo a spicchio (`conic-gradient`) sopra il chip, più il chip "spento" se il flow non basta per il costo. Mantieni lo stile delle chip esistenti (`.wave-chip` in `src/style.css` o nei css di `src/ui/`).

### 1.4 Il colpo "letto" dal resto del gioco
`Player` emette già `player-act` (`attack`, `dash`, `heal-start`, `heal`). Aggiungi `{ act: 'wave', wave: AbilityId, level?: number }` a ogni uso di un'abilità attiva: il piano 8 (l'ombra) ne ha bisogno.

---

## 2. Le abilità, una per una

Per ogni abilità: **meccanica**, **numeri** (in `COMBAT`, con nomi nuovi dove serve), **grafica**, **suono**, **gancio**. Mantieni i moltiplicatori degli amuleti (`state.mods.abilityCost`, `state.mods.risonante`, `state.damageMult`).

### 2.1 Scivolata — resta com'è, si vede meglio
- **Meccanica**: invariata.
- **Grafica**: al posto delle copie tinte, 4 sagome d'inchiostro (`FX.dashGhost`, la silhouette del fotogramma corrente riempita di nero con bordo verde `0x4ade80`) a 35 ms l'una, alpha 0.45 → 0, più 5–6 linee di velocità orizzontali sottili dietro il geco e uno sbuffo di polvere all'avvio se a terra.
- **Suono**: invariato (`sfx.dash`).
- **Gancio**: `wave-world` con `wave: 'scivolata'` e area = corpo del geco, **solo mentre `isDashing`** (il piano 7 lo usa per le cortine di glitch).

### 2.2 Rimbalzo — un anello di pennello
- **Grafica**: sotto i piedi, un anello d'inchiostro che si allarga e si apre (3 fotogrammi di `FX.ringJump`, 220 ms) più 6 goccioline verdi che cadono. Sostituisce `burst(0x4ade80, 7)` del doppio salto.

### 2.3 Aggrappo — graffi sul muro
- **Grafica**: mentre scivoli sul muro, ogni 90 ms lascia un graffio d'inchiostro corto sul bordo del muro (immagine piccola, svanisce in 1,2 s). Il salto dal muro: piccolo spruzzo d'inchiostro dal lato del muro.

### 2.4 Riflesso distorto — esca, e ritorno
- **Meccanica**:
  - prima pressione: come oggi, il clone compare dove sei (costo 25, durata **7 s**). I nemici già lo prendono di mira (`Enemy.update` riceve il riflesso come `target` se attivo: verificalo in `GameScene` dove si chiama `enemy.update`).
  - **seconda pressione mentre il clone è vivo** (costo 10, una volta sola per clone): **scambio**. Il geco e il clone si scambiano di posto all'istante; il geco ha 300 ms di invulnerabilità; il clone resta dov'eri tu per il tempo che gli resta. Uso: scappare da un accerchiamento, oppure lasciare il clone in alto, scendere a prendere qualcosa e **tornare su con lo scambio**.
  - senza nemici vicini il clone **resta fermo** dov'è nato (oggi rallenta e si ferma: confermalo in `Companion.update` con `target === null`). Serve al piano 7 (piastre a pressione).
  - danno del clone: invariato (`riflessoHitDamageBase/FlowMult`).
- **Implementazione dello scambio**: `Player` gestisce il tasto (oggi `riflessoReadyAt` blocca la seconda pressione durante la ricarica): se `scene.clone` è vivo e lo scambio non è usato, emetti `player-riflesso-swap` invece di spawnare. `GameScene.onRiflessoSwap()`: salva le due posizioni, scambia, azzera le velocità del geco, `player.grantInvuln(300)` (nuovo metodo pubblico che imposta `invulnUntil`), fx.
- **Grafica**: il clone non è più "il geco tinto". Al posto della tinta piena: alpha 0.75, tinta ciano chiara, e un secondo sprite gemello sopra con `BlendModes.ADD`, spostato di ±2 px in orizzontale a scatti ogni 80–140 ms (effetto vetro rotto / scanline). Alla nascita: `FX.mirrorCrack` (una stella di crepe d'inchiostro) che si apre e svanisce in 300 ms. Alla fine e allo scambio: 8 schegge `FX.mirrorShard` che volano via ruotando.
- **Suono**: nascita = vetro che vibra (sintetizza in `sfx.ts`, accanto agli altri: un tono acuto con vibrato breve); scambio = vetro che si rompe al contrario (rumore filtrato con inviluppo che cresce).
- **Gancio**: `wave-world` con `wave: 'riflesso'`, area = corpo del clone, ogni 200 ms finché vive.

### 2.5 Colpo risonante — tre colpi, nessun rilascio a vuoto
- **Meccanica** (tieni premuto, rilascia):
  | tenuto | colpo | costo | danno (× `risonanteDamage × damageMult`) | velocità | vita | extra |
  |---|---|---|---|---|---|---|
  | < 650 ms | **eco corta** | 12 | ×0.5 | 900 px/s | 380 ms (≈ 340 px) | non perfora |
  | ≥ 650 ms | **onda** (il colpo di oggi) | 30 | ×1 | 720 | 1600 ms | perfora |
  | ≥ 1400 ms e flow ≥ 45 | **onda piena** | 45 | ×2 | 640 | 1800 ms | perfora, hitbox alta 64 px, stordisce i nemici normali 400 ms (`enemy.stun(400)`, mai i boss) |
  Se il flow non basta per il livello raggiunto, scatta il livello più alto pagabile; se non basta neanche per l'eco, il toast di oggi (`noFlow`). Mai più il rilascio a vuoto silenzioso.
  Lo scudo dei nemici (`enemy.blocks(x, 'shot')`) para eco e onda, **non** l'onda piena.
- **Implementazione**: in `Player.updateRisonante` calcola il livello al rilascio e passalo nell'evento `player-risonante` (`{ x, y, dir, level }`). In `GameScene.onRisonante` scegli texture, velocità, vita, hitbox e `setData('level', level)` sul proiettile; in collisione con nemici usa il livello per danno e stordimento. `player-act` con `{ act: 'wave', wave: 'risonante', level }`.
- **Grafica**:
  - carica: un anello di cerchi concentrici d'inchiostro verde che si stringe sul geco; a 650 ms un primo lampo, a 1400 ms un secondo più forte e l'anello diventa doppio;
  - proiettili: `FX.waveTap` (un solo arco ")"), `FX.wave1` (tre archi annidati ")))"), `FX.wave2` (tre archi grandi con bordo spesso e alone). Ogni 40 ms il proiettile lascia una copia di sé che svanisce in 200 ms (scia di archi), al posto delle particelle `p-spark`.
- **Suono**: carica con tono che sale (due gradini, ai due livelli); sparo diverso per livello (eco = colpo secco, onda = quello di oggi `sfx.shoot`, onda piena = più grave con coda).
- **Gancio**: `wave-world` con `wave: 'risonante'`, `level`, area = rettangolo del proiettile, ogni 60 ms di volo.

### 2.6 Analisi 1 — una dimostrazione in tre tempi
- **Meccanica** (costo 40, ricarica 8 s, come oggi; durata totale 2,4 s):
  1. **ipotesi** (0–0,6 s): un cerchio di gesso si disegna attorno al geco (raggio 140). I nemici dentro vengono **marcati** (una "x" di gesso sopra la testa, `FX.chalkX`).
  2. **passaggi** (0,6–1,8 s): sei glifi (∫ ∑ ∂ lim √ π) orbitano attorno al geco; ogni 300 ms 1 danno a chi è nel raggio (com'è oggi, con `hitMult(kind, 'analisi')`).
  3. **q.e.d.** (1,8 s): i nemici **marcati e ancora nel raggio** prendono 3 danni (×`hitMult`) e un rinculo; il boss nel raggio prende 4. Compare la scritta "q.e.d." a gesso sopra il geco.
  Il geco resta libero di muoversi: il cerchio lo segue.
- **Implementazione**: riscrivi `onAnalisi/updateAnalisi` con una piccola macchina a stati (`analisiPhase`, `analisiMarked: Set<Enemy>`). Resetta tutto in `GameScene.create` (vedi `HANDOFF.md` §6: ogni campo nuovo va azzerato lì).
- **Grafica**: gesso bianco-azzurro (`0xdbeafe` con bordo `0x60a5fa`), tratti irregolari (`wobble`), un filo di polvere di gesso che cade dai glifi. Il cerchio si disegna progressivamente (arco da 0 a 2π in 0,6 s) con una `Graphics` sopra una texture di gesso, oppure 12 segmenti che compaiono in ordine.
- **Suono**: gesso sulla lavagna all'ipotesi (rumore filtrato breve), tic leggeri ai passaggi, un accordo pieno alla q.e.d.
- **Gancio**: `wave-world` con `wave: 'analisi'`, area = cerchio di raggio 140, **solo al momento della q.e.d.**

### 2.7 Tommasoscudo — il rimando perfetto
- **Meccanica** (costo 20, ricarica 6,5 s):
  - durata **1,6 s** (oggi 2,2);
  - i primi **220 ms** sono il **rimando perfetto**: un proiettile rimandato in quella finestra fa il **150%** del danno nemico (oggi 40%), **insegue** chi l'ha sparato (se il tiratore è ancora vivo, correggi la velocità verso di lui ogni fotogramma con sterzata limitata) e lo stordisce 600 ms; anche un nemico che ti tocca in quella finestra viene respinto senza farti danno;
  - dopo i 220 ms, il rimando normale di oggi (40%).
  - per sapere chi ha sparato: in `GameScene.onEnemyShoot` (evento `enemy-shoot`) salva sul proiettile `setData('shooter', enemy)`; per i boss, i proiettili dei boss passano da un'altra strada (cerca come `Boss` crea i proiettili): se non c'è un tiratore, il proiettile perfetto vola dritto.
- **Grafica**: una bolla "monitor CRT": cerchio d'inchiostro ciano con righe di scansione orizzontali dentro (texture `FX.shield`), un pallino rosso **"● REC"** in alto a destra (`FX.rec`). Nei 220 ms perfetti il bordo è bianco e spesso. A ogni rimando perfetto spunta per 600 ms una scritta piccola a pennarello **"rimborsato 👍"** sopra il geco (è la voce della tommasorveglianza: meme voluto).
- **Suono**: accensione = ronzio CRT; rimando normale = `sfx.slash` com'è; rimando perfetto = "ding" da notifica.
- **Gancio**: `wave-world` con `wave: 'scudo'`, `level: 2` se perfetto altrimenti `1`, area = rettangolo del proiettile rimandato, ogni 60 ms di volo.
- **Lezione**: `LESSONS.telecamera.hint` va aggiornata: "al momento giusto" ora vuol dire "appena prima del colpo".

### 2.8 Acqua tossica → **la bottiglia di smela** (rifatta da zero)
È l'abilità che l'utente chiama inutile. Diventa un'arma a distanza con controllo della folla, e il suo meme si chiude: smela voleva fermarti con l'"effetto smela III"; adesso sei tu a darlo ai nemici.
- **Meccanica** (costo 30, ricarica **6 s**):
  - **a terra lanci** una bottiglia di plastica ad arco nella direzione in cui guardi (velocità 520 px/s, angolo 35° verso l'alto); **in aria la lasci cadere** dritta sotto di te (velocità iniziale verso il basso 200 px/s): una bomba. Niente mira con su/giù: nel piano 6 le direzioni servono a scegliere la wave (su + wave = analisi, giù + wave = bottiglia).
  - all'impatto (roccia, nemico o boss) la bottiglia scoppia: **pozza** larga 200 × 70 (ellisse, raggio 100), dura **5 s**. Massimo **2 pozze** vive: la terza cancella la più vecchia.
  - **colpo diretto** su un nemico: **effetto smela III** = stordito 1,1 s (`enemy.stun(1100)`) e avvelenato. Su un boss: niente stordimento.
  - **nella pozza**: i nemici rallentano (×0,45, com'è oggi) e sono **avvelenati**: 1 danno ogni 600 ms (×`hitMult(kind, 'acqua')`, le bottiglie di smela restano `×99`).
  - **avvelenato** (nuovo stato): per 4 s dopo l'ultima esposizione il nemico prende **+30% da tutto**, tinto di verde-ciano. Un boss avvelenato prende +15%.
  - il geco è immune (com'è oggi).
- **Implementazione**:
  - `Player`: al tasto lancia `player-acqua` con `{ x, y, facing, aim: 'lob' | 'drop' }` (`drop` se in aria).
  - `GameScene.onAcquaTossica`: crea uno sprite fisico `FX.bottle` con gravità e rotazione, collider con il layer, con `breakableWalls`, overlap con nemici e boss; all'impatto `burstBottle(x, y, hit?)` crea la pozza (riusa e sistema `acquaPuddles`).
  - avvelenamento: una `Map<Enemy | Boss, number>` (scadenza) in `GameScene`, azzerata in `create`; il moltiplicatore si applica nei punti dove si chiama `takeDamage` del geco (fendenti, proiettili, analisi, clone). Per non spargere il calcolo, crea un helper `private dmgTo(target, amount): number` che applica avvelenamento e usalo ovunque.
- **Grafica**: bottiglia PET a inchiostro con etichetta minuscola "PREMIUM" e tappo ciano (`FX.bottle`), ruota in volo; all'impatto 6–8 schegge di plastica (`FX.shard`) e uno spruzzo; la pozza (`FX.puddle`) è una macchia piatta con bordo iridescente (gradiente ciano→viola→verde sul contorno) e bolle che salgono e scoppiano. I nemici avvelenati: tinta `0x67e8a0` che pulsa.
- **Suono**: lancio = fruscio di plastica; impatto = "crack" di plastica più splash; bolle sommesse finché la pozza vive.
- **Gancio**: `wave-world` con `wave: 'acquatossica'`: all'impatto (area = cerchio 100) e ogni 300 ms finché la pozza vive.
- **Testi**: `ABILITY_CARDS.acquatossica` (vedi §3), `LESSONS.bottiglia.hint` ("lancia la bottiglia dove passano: si sciolgono"), `OBJECTIVES.stabilimento` e la chiamata di markolino nello stabilimento (oggi dicono "acqua tossica (V)": lascia il nome, togli la lettera; il piano 6 rimette i tasti).
- **Opzionale** (solo se `TrapManager` lo permette senza toccare la griglia): una pozza sopra un getto di vapore lo spegne per 6 s. Leggi `src/engine/TrapManager.ts`: se i getti sono oggetti con un ciclo, aggiungi un metodo `suppress(x, y, r, ms)`.

### 2.9 Rigenerazione — si vede
- **Meccanica**: invariata (il piano 7 le dà un uso nel mondo: i miasmi).
- **Grafica**: a ogni cura passiva, una goccia verde (`FX.regenDrip`) scende sul geco e il cuore nuovo nell'HUD pulsa (evento `hp-changed` con un flag `regen: true`, gestito in `hud.ts` con una classe CSS breve).
- **Suono**: una nota bassa e morbida.

### 2.10 Il fendente e il frammento (bonus grafico)
- Il fendente (`Player.slashVisual`) oggi è un arco bianco con un arco colorato. Rendilo una **pennellata**: arco a spessore variabile (spesso al centro, sottile alle punte) disegnato come forma piena nera con bordo bianco, il terzo colpo con una coda di gocce d'inchiostro. Stessi tempi.
- Il frammento della wave (`textures.ts`, `'fragment'`): oggi un pentagono a linee. Disegnalo in `abilityFx.ts` come cristallo a inchiostro con tratteggio e strato emissivo. Facoltativo: un'icona della wave dentro, se sai già quale abilità contiene (`spawnFragment` riceve `ability`).

---

## 3. Testi delle card delle abilità

`src/content/story.ts`, `ABILITY_CARDS`: riscrivi le `desc` **senza nominare tasti** (li rimette il piano 6 con i segnaposto) e con la meccanica nuova, nella voce del gioco. Esempi:
- `risonante`: `'tieni premuto e rilascia. poco = un\'eco corta. di più = un\'onda che perfora. tanto, se hai flow = l\'onda piena, che spacca anche gli scudi. la tecnokill di notino, ma con giudizio.'`
- `riflesso`: `'evochi un clone che attira i nemici e incassa al posto tuo. usalo di nuovo mentre c\'è: vi scambiate di posto. rubato agli specchi di lametta, non dirglielo.'`
- `analisi`: `'una dimostrazione in tre tempi: ipotesi (chi è nel cerchio viene segnato), passaggi (i teoremi girano), q.e.d. (chi è ancora segnato paga). piema sarebbe fiero. o spaventato.'`
- `scudo`: `'una bolla che rimanda i proiettili. appena accesa, il rimando è perfetto: torna al mittente e lo stordisce. assolutamente sicuro. 👍'`
- `acquatossica`: nome `'la bottiglia di smela'`, desc `'lanci la sua acqua premium: chi la prende in pieno si blocca (effetto smela III), chi ci cammina si avvelena e prende più danni. la sua arma, rivolta contro tutti.'`
Il campo `key` resta com'è: lo sistema il piano 6.

---

## 4. Verifica
1. `npm run build` e `cd editor && npx tsc -b --noEmit`.
2. Ogni campo nuovo di `GameScene` è azzerato in `create` (cerca il blocco di reset all'inizio di `create`).
3. Grep: nessun uso residuo di `'proj-risonante'`, `'glyph-0'`, `'glyph-1'`, `'glyph-2'` se li hai sostituiti; `wave-world` emesso da risonante, analisi, scudo, acqua, riflesso, scivolata.
4. Prova di bilanciamento sulla carta: scrivi nel resoconto una tabella costo/ricarica/danno vecchio e nuovo per ogni abilità.
5. Con il permesso dell'utente, prova le abilità in `?level=sorveglianza` con il god mode (`toggleGecoMode('gecowave-flux-resonance-992173')` in console sblocca tutte le abilità, vedi `HANDOFF.md`). Senza permesso, dichiaralo.
6. `DEV_LOG.md`: ADR nuovo "le abilità rifatte" (tabella di stato vecchio → nuovo, evento `wave-world`, ricariche nell'HUD, avvelenamento).
7. Commit per fasi: infrastruttura (`le abilità hanno una grafica`), poi abilità (`abilità più utili e leggibili`).

## Cosa NON fare
- Non cambiare i tasti (piano 6) e non aggiungere oggetti nel mondo (piano 7).
- Non aggiungere abilità nuove, né valute o consumabili.
- Non cambiare gli `AbilityId` (salvataggi).
