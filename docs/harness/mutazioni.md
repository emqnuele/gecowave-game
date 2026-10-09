# mutazioni di prova

Generato da `scripts/harness/mutate.mjs`. Ogni mutazione toglie o cambia una riga di comportamento; gli strumenti devono accorgersene e indicare il punto giusto.

| mutazione | tipo | riga | esito | dove |
|---|---|---|---|---|
| sfx-microfono | sfx tolto | src/game/Travel.ts:191 | scoperta | livello-tana, fotogramma 564, sezioni sfx |
| flag-dispositivo | setFlag tolto | src/game/chapters/ruhra.ts:50 | scoperta | cap-ruhra, fotogramma 1701, sezioni save |
| toast-arena | bus.emit tolto | src/game/Arena.ts:56 | scoperta | guida-santuario, fotogramma 139, sezioni ui, ev |
| tween-cuore | tween tolto | src/game/Rewards.ts:188 | scoperta | rio-cura, fotogramma 2, sezioni bod |
| gocce-lametta | confronto >= in > | src/game/chapters/santuario.ts:107 | scoperta | cap-santuario, fotogramma 3416, sezioni dl, dlo, bod, lit, ui, ev |
| ordine-pali-nidi | ordine di creazione | src/scenes/GameScene.ts:223 | scoperta | riflesso-senza-flow, fotogramma 1, sezioni dlo |
| persist-lore | persist tolto | src/game/Rewards.ts:134 | scoperta | piazza, fotogramma 96, sezioni store |
| profondita-prompt | profondità | src/game/Interactions.ts:70 | scoperta | riflesso-senza-flow, fotogramma 1, sezioni dl, dlo |
| salto-sfx | sfx tolto (entità) | src/entities/Player.ts:356 | scoperta | livello-perduta, fotogramma 71, sezioni sfx |
| rinculo-nemico | costante (entità) | src/entities/Enemy.ts:593 | scoperta | campagna, fotogramma 1812, sezioni ent, bod |
| fase-boss | soglia (regola) | src/rules/combat.ts:15 | scoperta | campagna, fotogramma 6291, sezioni boss, ent, dl, dlo, cam, ui, ev, sev, sfx, mus |
| lastre-suono | soglia (motore) | src/mechanics/HazardManager.ts:264 | scoperta | lastre-ricordi, fotogramma 176, sezioni sfx |
| hud-barre | testo ui | src/ui/hud.ts:109 | scoperta | riflesso-senza-flow, fotogramma 1, sezioni ui |
| film-ombra | alfa (film) | src/story/film/FilmScene.ts:94 | scoperta | film-uscita, fotogramma 108, sezioni dl, dlo (a/b sulla build del branch: i film non hanno ancora un giro di copertura) |

## sfx-microfono

```
PRIMA DIVERGENZA al fotogramma 564 (tempo di scena {"BootScene":119403.88,"GameScene":119403.88})
sezioni diverse: sfx

[sfx] effetti sonori
  .: [["checkpoint",[]]]  ->  null
  emessi nel riferimento da: .harness/src/game/Travel.ts:191
```

## flag-dispositivo

```
PRIMA DIVERGENZA al fotogramma 1701 (tempo di scena {"BootScene":138357.67,"GameScene":138357.67})
sezioni diverse: save

[save] il salvataggio
  .flags[64]: dispositivo  ->  (assente)

ultimi eventi prima (riferimento):
  1678 GameScene:player-act
  1690 bark-clear {}
  1690 dialogue-start {"lines":[{"color":"orange","speaker":"la riba","text":"ok ok mi aredo!! tieni sto coso, il dispositivo per entrare nela testa di piema. me l'avevano dato per sorvegliarlo ma non so manco acenderlo."}],"onEnd":"ƒ"}
  1690 dialogue-end {}
  1690 GameScene:boss-defeated
  1691 GameScene:pause
```

## toast-arena

```
PRIMA DIVERGENZA al fotogramma 139 (tempo di scena {"BootScene":112319.13,"GameScene":112319.13})
sezioni diverse: ui, ev

[ui] il dom della ui
  riferimento: </></><div class="sticker glass-chip" id="toast">"le uscite si chiudono. o lui o te."</></>
  candidata:   </></></><svg width="0" height="0" style="position: absolute;"><filter id="sx-ink" x="-5%" y="-20%" width="110%" height="140%">

[ev] eventi del bus
  [5][0]: toast  ->  wave-cooldowns
  [5][1].text: le uscite si chiudono. o lui o te.  ->  (assente)
  [5][1].cds: (assente)  ->  {"acquatossica":0,"analisi":0,"riflesso":0,"risonante":0,"scudo":0}
  [5][1].flow: (assente)  ->  0
  [6]: ["wave-cooldowns",{"cds":{"acquatossica":0,"analisi":0,"riflesso":0,"risonante":0,"scudo":0},"flow":0}]  ->  (assente)
  emessi nel riferimento da: .harness/src/ui/dialogue.ts:115, .harness/src/entities/Boss.ts:129, .harness/src/story/BossVoice.ts:93, .harness/src/entities/Player.ts:211, .harness/src/entities/Player.ts:212, .harness/src/game/Arena.ts:56, .harness/src/game/abilities/index.ts:118
  emessi nella candidata da: ../gecowave-mut/src/ui/dialogue.ts:115 (close), ../gecowave-mut/src/entities/Boss.ts:129 (engage), ../gecowave-mut/src/story/BossVoice.ts:93 (speak), ../gecowave-mut/src/entities/Player.ts:211 (emitVitals), ../gecowave-mut/src/entities/Player.ts:212 (emitVitals), ../gecowave-mut/src/game/abilities/index.ts:118 (updateAbilityFx)
```

## tween-cuore

```
PRIMA DIVERGENZA al fotogramma 2 (tempo di scena {"BootScene":110035.34,"GameScene":110035.34})
sezioni diverse: bod

[bod] i corpi fisici
  conteggi: {"dl":955,"ent":191,"bod":298,"lit":249} -> {"dl":955,"ent":191,"bod":298,"lit":249}
  (servono le impronte complete di questo fotogramma: rilancia con --full)

ultimi eventi prima (riferimento):
  1 GameScene:nest-spawned
  1 GameScene:nest-spawned
  1 GameScene:nest-spawned
  1 GameScene:nest-spawned
  1 GameScene:nest-spawned
  1 GameScene:nest-spawned
  1 GameScene:nest-spawned
  1 GameScene:nest-spawned
  1 GameScene:nest-spawned
  1 GameScene:create

la diagnostica divergeva già al fotogramma 1: [{"path":".tweens","a":271,"b":270}]
```

## gocce-lametta

```
PRIMA DIVERGENZA al fotogramma 3416 (tempo di scena {"BootScene":166946.72,"GameScene":166946.72})
sezioni diverse: dl, dlo, bod, lit, ui, ev

[dl] la display list come multiinsieme: un oggetto grafico in più, in meno o diverso
  conteggi: {"dl":981,"ent":149,"bod":370,"lit":250} -> {"dl":982,"ent":149,"bod":370,"lit":250}
  (servono le impronte complete di questo fotogramma: rilancia con --full)

[dlo] l'ordine di disegno a parità di profondità
  conteggi: {"dl":981,"ent":149,"bod":370,"lit":250} -> {"dl":982,"ent":149,"bod":370,"lit":250}
  (servono le impronte complete di questo fotogramma: rilancia con --full)

[bod] i corpi fisici
  conteggi: {"dl":981,"ent":149,"bod":370,"lit":250} -> {"dl":982,"ent":149,"bod":370,"lit":250}
  (servono le impronte complete di questo fotogramma: rilancia con --full)

[lit] le luci 2d
  conteggi: {"dl":981,"ent":149,"bod":370,"lit":250} -> {"dl":982,"ent":149,"bod":370,"lit":250}
  (servono le impronte complete di questo fotogramma: rilancia con --full)
```

## ordine-pali-nidi

```
PRIMA DIVERGENZA al fotogramma 1 (tempo di scena {"BootScene":110018.67,"GameScene":110018.67})
sezioni diverse: dlo

[dlo] l'ordine di disegno a parità di profondità
  conteggi: {"dl":1060,"ent":223,"bod":426,"lit":293} -> {"dl":1060,"ent":223,"bod":426,"lit":293}
  (servono le impronte complete di questo fotogramma: rilancia con --full)
```

## persist-lore

```
PRIMA DIVERGENZA al fotogramma 96 (tempo di scena {"BootScene":111602.32,"GameScene":111602.32})
sezioni diverse: store

[store] scritture su localStorage
  .: [["set","gecowave-save-v2",1171,"229hymiu83p"]]  ->  null

ultimi eventi prima (riferimento):
  82 dialogue-end {}
  82 GameScene:resume
```

## profondita-prompt

```
PRIMA DIVERGENZA al fotogramma 1 (tempo di scena {"BootScene":110018.67,"GameScene":110018.67})
sezioni diverse: dl, dlo

[dl] la display list come multiinsieme: un oggetto grafico in più, in meno o diverso
  conteggi: {"dl":1060,"ent":223,"bod":426,"lit":293} -> {"dl":1060,"ent":223,"bod":426,"lit":293}
  (servono le impronte complete di questo fotogramma: rilancia con --full)

[dlo] l'ordine di disegno a parità di profondità
  conteggi: {"dl":1060,"ent":223,"bod":426,"lit":293} -> {"dl":1060,"ent":223,"bod":426,"lit":293}
  (servono le impronte complete di questo fotogramma: rilancia con --full)
```

## salto-sfx

```
PRIMA DIVERGENZA al fotogramma 71 (tempo di scena {"BootScene":111185.57,"GameScene":111185.57})
sezioni diverse: sfx

[sfx] effetti sonori
  [0][0]: jump  ->  setRain
  [0][1][0]: (assente)  ->  0.7041075000000019
  [1][0]: setRain  ->  setBeds
  [1][1][0]: 0.7041075000000019  ->  {"cave":0.332849199375,"rain-roof":0.3379716000000009,"wind":0.16642247272265628}
  [2]: ["setBeds",[{"cave":0.332849199375,"rain-roof":0.3379716000000009,"wind":0.16642247272265628}]]  ->  (assente)
  emessi nel riferimento da: .harness/src/entities/Player.ts:356, .harness/src/stage/Atmosphere.ts:177, .harness/src/audio/Soundscape.ts:200
  emessi nella candidata da: ../gecowave-mut/src/stage/Atmosphere.ts:177 (update), ../gecowave-mut/src/audio/Soundscape.ts:200 (probe)
```

## rinculo-nemico

```
PRIMA DIVERGENZA al fotogramma 1812 (tempo di scena {"BootScene":140208.04,"GameScene":140208.04})
sezioni diverse: ent, bod

[ent] le entità del gioco (classi: nemici, nidi, clone, compagni...)
  conteggi: {"dl":1048,"ent":190,"bod":390,"lit":247} -> {"dl":1048,"ent":190,"bod":390,"lit":247}
  (servono le impronte complete di questo fotogramma: rilancia con --full)

[bod] i corpi fisici
  conteggi: {"dl":1048,"ent":190,"bod":390,"lit":247} -> {"dl":1048,"ent":190,"bod":390,"lit":247}
  (servono le impronte complete di questo fotogramma: rilancia con --full)

ultimi eventi prima (riferimento):
  1786 GameScene:enemy-alert
  1803 hp-changed {"hp":51,"hurt":false,"maxHp":51}
  1803 toast {"text":"un cuore del realm. la vita massima aumenta per sempre."}
  1803 GameScene:enemy-spawned
  1804 hp-changed {"hp":50,"hurt":true,"maxHp":51}
  1804 flow-changed {"flow":16,"maxFlow":99}
  1811 GameScene:player-act
```

## fase-boss

```
PRIMA DIVERGENZA al fotogramma 6291 (tempo di scena {"BootScene":214872.97000000003,"GameScene":214872.97000000003})
sezioni diverse: boss, ent, dl, dlo, cam, ui, ev, sev, sfx, mus

[boss] il boss (tutti i suoi campi)
  .animT: 33690.06999999952  ->  33684.235499999515
  .heardPhase: 2  ->  1

[ent] le entità del gioco (classi: nemici, nidi, clone, compagni...)
  conteggi: {"dl":1154,"ent":213,"bod":315,"lit":250} -> {"dl":1152,"ent":213,"bod":315,"lit":250}
  (servono le impronte complete di questo fotogramma: rilancia con --full)

[dl] la display list come multiinsieme: un oggetto grafico in più, in meno o diverso
  conteggi: {"dl":1154,"ent":213,"bod":315,"lit":250} -> {"dl":1152,"ent":213,"bod":315,"lit":250}
  (servono le impronte complete di questo fotogramma: rilancia con --full)

[dlo] l'ordine di disegno a parità di profondità
  conteggi: {"dl":1154,"ent":213,"bod":315,"lit":250} -> {"dl":1152,"ent":213,"bod":315,"lit":250}
  (servono le impronte complete di questo fotogramma: rilancia con --full)
```

## lastre-suono

```
PRIMA DIVERGENZA al fotogramma 176 (tempo di scena {"BootScene":112935.92,"GameScene":112935.92})
sezioni diverse: sfx

[sfx] effetti sonori
  [0][0]: crumble  ->  land
  [0][1][0]: (assente)  ->  stone
  [0][1][1]: (assente)  ->  0.9333333333333333
  [1]: ["land",["stone",0.9333333333333333]]  ->  (assente)
  emessi nel riferimento da: .harness/src/mechanics/HazardManager.ts:264, .harness/src/audio/Soundscape.ts:238
  emessi nella candidata da: ../gecowave-mut/src/audio/Soundscape.ts:238 (footsteps)

ultimi eventi prima (riferimento):
  147 GameScene:enemy-alert
```

## hud-barre

```
PRIMA DIVERGENZA al fotogramma 1 (tempo di scena {"BootScene":110018.67,"GameScene":110018.67})
sezioni diverse: ui

[ui] il dom della ui
  riferimento: </></><div class="hud-barre" style="color: rgb(248, 113, 113);">"♪ 846 barre"</><div class="hud-tommaso" style="display: none;">"🛡️ protetto da tommasorveglianza 👍"
  candidata:   </></><div class="hud-barre" style="color: rgb(248, 113, 113);">"♪ 846  barre"</><div class="hud-tommaso" style="display: none;">"🛡️ protetto da tommasorveglianza 👍"
```

## film-ombra

```
PRIMA DIVERGENZA al fotogramma 108 (il primo del film)
sezioni diverse: dl, dlo

[dl] la display list come multiinsieme: un oggetto grafico in più, in meno o diverso
  conteggi: {"dl":776,"ent":134,"bod":276,"lit":190} -> {"dl":776,"ent":134,"bod":276,"lit":190}
```
