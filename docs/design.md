# design del gioco

> **spoiler**: questo documento racconta frammenti, scelte e finali del gioco. se vuoi giocare senza sapere niente, non leggerlo.

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
