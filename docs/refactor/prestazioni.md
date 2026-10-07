# prestazioni di partenza (main a16f39c)

Misurate con `scripts/harness/perf.mjs`, in tempo reale (niente orologio finto), sulla build di sviluppo, viewport 960×540, Apple M5, gpu vera. Mediana di 3 giri per scenario. I tempi sono per fotogramma: `update` è la logica di tutte le scene, `render` il disegno. Base salvata in `scripts/harness/perf-base.json` (cpu piena) e `perf-base-cpu4.json` (cpu rallentata 4 volte via cdp, più vicina a un portatile normale).

Per confrontare un passo del refactor:

```bash
node scripts/harness/perf.mjs --save cand --vs base --profile
node scripts/harness/perf.mjs --save cand-cpu4 --cpu 4 --vs base-cpu4
```

A macchina scarica: niente corpus o altri job in parallelo, o i numeri non valgono.

## cpu piena

| scenario | fotogrammi | update media | update p95 | update max | render media | oltre 16,7 ms | avvio |
|---|---|---|---|---|---|---|---|
| cap-bus | 5254 | 1,02 | 5,30 | 311 | 1,05 | 18 | 405 ms |
| esplora-perduta | 3423 | 2,08 | 10,00 | 44 | 0,56 | 64 | 1317 ms |
| livello-perduta | 462 | 0,35 | 0,50 | 6 | 0,55 | 0 | 969 ms |
| livello-bus | 466 | 0,45 | 0,70 | 8 | 0,64 | 0 | 450 ms |
| livello-tana | 717 | 0,35 | 0,50 | 17 | 0,68 | 1 | 959 ms |
| livello-void | 964 | 0,43 | 0,70 | 13 | 0,54 | 0 | 442 ms |
| wave-rio | 3065 | 0,40 | 0,50 | 18 | 0,56 | 1 | 517 ms |
| nastro-cantina | 3427 | 0,32 | 0,50 | 8 | 0,61 | 0 | 541 ms |
| nastro-perduta | 2579 | 0,44 | 0,50 | 14 | 0,51 | 0 | 999 ms |
| nastro-stabilimento | 3478 | 0,35 | 0,50 | 12 | 1,03 | 0 | 439 ms |

## cpu rallentata 4 volte

| scenario | update media | update p95 | update max | render media | render p95 | oltre 16,7 ms |
|---|---|---|---|---|---|---|
| cap-bus | 3,53 | 14,2 | 799 | 4,81 | 6,3 | 357 / 5253 |
| esplora-perduta | 4,89 | 20,8 | 116 | 2,69 | 3,4 | 501 / 3627 |
| livello-perduta | 1,54 | 4,1 | 12 | 2,68 | 7,0 | 0 / 461 |
| livello-bus | 1,74 | 2,6 | 14 | 2,88 | 3,7 | 0 / 466 |
| livello-tana | 1,34 | 2,8 | 61 | 3,23 | 5,7 | 7 / 718 |
| livello-void | 0,91 | 1,6 | 37 | 1,52 | 2,2 | 2 / 965 |
| wave-rio | 1,60 | 2,2 | 70 | 2,47 | 3,1 | 6 / 3065 |
| nastro-cantina | 0,84 | 1,3 | 26 | 2,13 | 2,7 | 1 / 3427 |
| nastro-perduta | 1,34 | 2,0 | 24 | 1,96 | 2,6 | 10 / 2582 |
| nastro-stabilimento | 0,92 | 1,4 | 23 | 3,93 | 4,6 | 14 / 3478 |

## cosa dicono

- **In media il gioco è leggero**: meno di mezzo millisecondo di logica e meno di uno di disegno a cpu piena. Col profilo, l'88% del tempo campionato la cpu è ferma. Il refactor non deve inseguire la media.
- **Il problema sono i picchi**, e stanno dove il gioco crea cose:
  - `esplora-perduta` salta di stanza in stanza: a ogni ingresso il terreno, le decorazioni e le normal map si disegnano a pezzi (ADR-032). È lo scenario con il p95 peggiore.
  - `cap-bus` ha un picco da 311 ms (799 a cpu rallentata) nei passaggi pesanti del capitolo: boss, film, riepilogo, cambio di livello.
- **`getImageData` pesa il 2% di tutto il tempo campionato**, più di tutto il codice del gioco messo insieme. Viene dalla cottura delle texture procedurali: `creatureKit.ts` (normal map di ogni fotogramma delle creature, riga 445, e il controllo del bagliore, riga 534), `materials.ts:385` e `playerSkin.ts:241,311`. Se una creatura si cuoce la prima volta che compare, la lettura dei pixel finisce dentro un fotogramma di gioco: è il primo sospettato dei picchi, da confermare col profilo.
- Il codice del gioco in sé (`GameScene`, entità, motore) è sotto lo 0,3% ciascuno; il resto è phaser (batch degli sprite, ordinamento per profondità, `Graphics`, collisioni).
- L'avvio di un livello va da 0,4 a 1,3 s. La perduta e la tana sono le più lente (circa 1 s): sono le regioni più grandi da costruire.

## dove guardare nella parte B (blocco B10)

1. Le letture di pixel (`getImageData`) nella cottura delle texture: capire quando avvengono (all'avvio del livello o alla prima comparsa), farle una volta sola e tenerle, o calcolarle senza rileggere il canvas. La cottura delle creature usa un suo generatore con seed sulla chiave (`mulberry32(hashString(spec.key))`, `creatureKit.ts:523`), quindi spostarla nel tempo non sposta la sequenza di `Math.random`; ma crea texture e i pixel non entrano nella traccia: le tracce restano il giudice per tutto il resto.
2. L'ingresso nelle stanze: spalmare la costruzione su più fotogrammi o prepararla prima che il geco arrivi.
3. I picchi dei passaggi di capitolo in `cap-bus`: profilarli uno per uno (`--only cap-bus --profile --runs 1`).
4. Gli `update()` per fotogramma che rifanno lavoro che non cambia (cache delle minacce, freccia guida, prompt): solo dove il profilo lo dice.

Ogni ottimizzazione deve dare tracce identiche al bit (`corpus.mjs check`): più veloce, non diversa. I numeri di base vanno ripresi sulla stessa macchina.

## i punti caldi (cpu piena, tempo proprio)

Dal profilo cpu dei 10 scenari, riportato ai file `.ts` con la sourcemap (`.harness/perf-hotspots.json`):

| % | dove |
|---|---|
| 88,0 | cpu ferma |
| 5,5 | phaser (batch degli sprite, flush, ordinamento per profondità, `Graphics`, collisioni) |
| 2,1 | (program) |
| 2,0 | `getImageData` |
| 0,3 | `bufferSubData` |
| 0,2 | `GameScene.ts` (`update` 2825) |
| 0,2 | garbage collector |
| 0,1 | `normalFlip.ts`, `TerrainRenderer.ts`, `dressing.ts`, `creatureKit.ts`, `ink.ts`, `Enemy.ts`, `padBridge.ts` |
