# riferimenti

Ogni volta che il riferimento (`scripts/harness/reference.json` e le tracce di `main` in `.harness/traces/ref`) cambia, qui si scrive perché. Durante la parte A il riferimento si è rigenerato più volte perché cambiavano gli strumenti (la sonda, l'orologio, gli scenari), mai il gioco: il commit di `main` resta `a16f39c`.

Nella parte B il riferimento si rigenera **solo** con l'ok di Ema e solo per i passi che cambiano l'ordine di proposito (rng centralizzato, eventi espliciti, `simulates`) o per i bug sistemati in commit dichiarati. Prima si dimostra l'equivalenza sugli esiti (stessi flag, finali, dialoghi, morti, ricompense, statistiche di danno), poi si rigenera e si annota qui: cosa cambia, quali scenari, perché è voluto.

| data | commit del gioco | perché | scenari |
|---|---|---|---|
| 2026-10-07 | `a16f39c` (main) | riferimento iniziale della parte A, harness completo | tutti |
