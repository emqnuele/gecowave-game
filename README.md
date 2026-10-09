# GECOWAVE: The Flux of Coscience

Un action-platformer 2D in stile Hollow Knight, ambientato nel **GecoRealm**: la GecoWave è andata in frantumi e un geco deve attraversare 14 capitoli, pieni di personaggi assurdi, per raccogliere i frammenti. Sviluppato da [emqnuele](https://emanuelefaraci.com) per [gecowave](https://gecowave.top).

## Giocare

Gli eseguibili per Windows, macOS e Linux sono nelle [release](../../releases) di questa repo.

## Sviluppo

```bash
npm install
npm run dev      # sviluppo con vite
npm test         # test delle regole
npm run build    # typecheck e build di produzione
```

Il gioco è fatto con Phaser 3, TypeScript e Vite, impacchettato per desktop con Electron.

La guida al codice è in [`docs/sviluppo.md`](docs/sviluppo.md). Il design system dell'interfaccia è in [`docs/design-system.md`](docs/design-system.md). [`docs/design.md`](docs/design.md) racconta il gioco per intero, spoiler compresi.

## Licenza

Il codice è sotto licenza [MIT](LICENSE). Musica, grafica e testi sono di gecowave, tutti i diritti riservati: vedi [`ASSETS.md`](ASSETS.md).
