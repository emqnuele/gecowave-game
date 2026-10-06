# harness: il gioco vero, ripetibile al frame

Base del bot di test. Fa girare la build di sviluppo in chromium headless (`playwright-core`) e controlla tutto ciò che il gioco legge come "tempo" o "caso". Così lo stesso input produce sempre la stessa partita, al bit.

```bash
NODE_ENV=development npx vite build --outDir dist-dev --emptyOutDir   # servono gli hook window.__*
node scripts/harness/determinism.mjs tecnokill      # la stessa partita due volte: IDENTICHE
node scripts/harness/flashback-lifecycle.mjs        # regressione dei bug dei flashback
node scripts/harness/hitstop-pause.mjs              # regressione dell'hitstop in pausa
```

`DIST=altra-cartella` fa girare un'altra build: per confrontare `main` col refactor si costruisce `main` in un worktree e gli si passa la sua `dist-dev`.

## come funziona (`game.mjs`)

- **niente server**: `page.route` serve i file della build da disco su `http://gecowave.test`.
- **random**: `Math.random` sostituito prima del boot da mulberry32. `startLevel` rimette il seed all'avvio del livello.
- **orologio finto**: `page.clock.install` + `pauseAt`. `Date`, `performance.now`, `setTimeout` e i tween di Phaser (che leggono `Date.now`) avanzano solo quando lo dice il bot.
- **loop di phaser addormentato** (`game.loop.sleep()`), poi un passo alla volta con `game.loop.step(t)`, dove `t` dipende solo dal numero del frame (`loopTime`).
- **frame da 17/17/16 ms**: media di 60 hz esatti, con millisecondi interi.
- **partenza fissa**: si fa il boot fino al menu (il numero di frame varia col caricamento reale degli asset), si preme un tasto sullo splash come farebbe un giocatore, poi si avanza fino a `START_FRAME` e si chiama `window.__startLevel` (hook di sviluppo in `src/main.ts`).
- **salvataggio vuoto**: `localStorage` viene svuotato a ogni pagina.

## trappole già incontrate (non ricaderci)

- `page.clock.install` da solo lascia scorrere il tempo: serve `pauseAt`.
- Col `requestAnimationFrame` finto certi passi fanno scattare due frame e altri zero, a caso. Per questo il loop si addormenta e si fa avanzare a mano.
- Il `performance.now` finto si porta dietro una frazione dell'origine reale (±1 ms sul tempo assoluto). Per questo il tempo del loop lo decide il bot.
- `runFor` con millisecondi frazionari arrotonda: mai un `runFor` lungo al posto di tanti passi.
- Lo splash del menu ("premi un tasto") si mangia il primo tasto vero con `stopPropagation`.
- `page.evaluate(() => game.scene.pause(...))` restituisce lo SceneManager: serializzarlo fa crollare la pagina. Nelle evaluate le istruzioni vanno tra graffe.
- Il bot vecchio (`scripts/playtest/bot.mjs`) chiama `g.scene.update` a mano col tempo reale: tween e scenette restano indietro (il sacrificio di ivan non finisce mai). Va riscritto sopra `game.mjs`.
- Viewport fisso (960×540): lo zoom della camera dipende dall'altezza della finestra.
