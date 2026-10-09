# prestazioni

Misurate con `scripts/harness/perf.mjs` in tempo reale (niente orologio finto), sulla build di sviluppo, viewport 960×540, MacBook Air M5, gpu vera, macchina ferma e attaccata alla corrente. Mediana di 3 giri per scenario. `update` è la logica di tutte le scene per fotogramma, `render` il disegno, "lenti" i fotogrammi oltre 16,7 ms (sotto i 60 fps). Si giudica a cpu rallentata 4 volte (cdp): è più vicina a un portatile normale.

Misure salvate: `perf-main.json` e `perf-main-cpu4.json` (main `a16f39c`), `perf-finale.json` e `perf-finale-cpu4.json` (il codice di oggi). A cpu4 main e finale sono stati misurati uno dopo l'altro nella stessa notte, così il calore della macchina pesa uguale.

```bash
node scripts/harness/perf.mjs --save prova --vs finale                   # cpu piena
node scripts/harness/perf.mjs --save prova-cpu4 --cpu 4 --vs finale-cpu4  # cpu rallentata 4 volte
node scripts/harness/perf.mjs --only esplora-perduta --runs 1 --cpu 4 --profile   # dove va il tempo, riportato ai .ts
```

## cpu rallentata 4 volte (9 ottobre 2026)

| scenario | update media (main) | update p95 (main) | lenti (main) | avvio (main) |
|---|---|---|---|---|
| cap-bus | 2,35 (2,93) | 5,5 (12,6) | **13** (242) su 5000 | 467 ms (455) |
| esplora-perduta | 2,63 (4,32) | 9,1 (19,0) | **43** (407) su 3400 | 1079 ms (1105) |
| livello-perduta | 1,02 (1,06) | 1,8 (1,9) | 0 (0) | 1033 ms (1051) |
| livello-bus | 1,62 (1,46) | 2,5 (2,3) | 0 (0) | 483 ms (463) |
| livello-tana | 1,29 (1,06) | 2,4 (2,0) | 1 (2) | 1099 ms (1096) |
| livello-void | 0,67 (0,78) | 1,4 (1,4) | 2 (2) | 438 ms (449) |
| wave-rio | 1,51 (1,33) | 2,4 (2,0) | 2 (6) | 517 ms (546) |
| nastro-cantina | 0,93 (0,72) | 1,5 (1,3) | 1 (1) | 619 ms (539) |
| nastro-perduta | 1,21 (1,33) | 1,8 (1,9) | 0 (7) | 1231 ms (1035) |
| nastro-stabilimento | 0,78 (0,96) | 1,3 (1,5) | 0 (10) | 413 ms (458) |

A cpu piena i lenti scendono da 27 a 1 in `cap-bus` e da 83 a 1 in `esplora-perduta`; negli altri scenari restano 0-2 come su main.

## cosa è cambiato

- **Il terreno non rilegge più i suoi pixel.** `TerrainRenderer` registrava ogni pezzo di terreno con `textures.addCanvas`, che crea un `CanvasTexture`: il costruttore di phaser chiama `getImageData` su tutto il canvas, una lettura sincrona dalla gpu. Il terreno quei pixel non li legge mai. Era l'8,7% di tutto il tempo campionato in `esplora-perduta` (quasi un quinto del tempo in cui la cpu lavorava) e la causa dei fotogrammi lenti quando si scopre un pezzo di mondo. Ora è `textures.addImage` con il canvas come sorgente: stessa texture, caricata sulla gpu senza leggerla. Tracce identiche al bit.
- **Il refactor da solo**: negli scenari leggeri la logica costa a volte 0,1-0,2 ms in più per fotogramma, a volte meno (sotto l'1% del tempo di un fotogramma, nessun fotogramma lento in più). Negli scenari pesanti il passo fisso e i sistemi non pesano.

## cosa resta

I fotogrammi lenti rimasti in `esplora-perduta` a cpu4 cadono quando si scopre un pezzo di terreno nuovo: l'erba e l'arredo si disegnano in quel momento (`art/dressing.ts`, circa 1,4% del tempo). Prepararli prima cambierebbe quando compaiono gli oggetti nella display list, quindi le tracce non sarebbero più identiche: è un lavoro a sé, da provare sugli esiti.
