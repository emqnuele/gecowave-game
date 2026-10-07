# mutazioni di prova

Generato da `scripts/harness/mutate.mjs`. Ogni mutazione toglie o cambia una riga di comportamento; gli strumenti devono accorgersene e indicare il punto giusto.

| mutazione | tipo | riga | esito | dove |
|---|---|---|---|---|
| sfx-microfono | sfx tolto | src/scenes/GameScene.ts:5721 | scoperta | livello-tana, fotogramma 564, sezioni sfx |
| flag-dispositivo | setFlag tolto | src/scenes/GameScene.ts:5389 | scoperta | cap-ruhra, fotogramma 1654, sezioni save |
| toast-arena | bus.emit tolto | src/scenes/GameScene.ts:3685 | scoperta | guida-santuario, fotogramma 139, sezioni ui, ev |
| tween-cuore | tween tolto | src/scenes/GameScene.ts:1967 | scoperta | rio-cura, fotogramma 2, sezioni bod |
| gocce-lametta | confronto >= in > | src/scenes/GameScene.ts:4826 | scoperta | cap-santuario, fotogramma 3394, sezioni dl, dlo, bod, lit, ui, ev |
| ordine-crepa | ordine di creazione | src/scenes/GameScene.ts:3986 | SOPRAVVISSUTA | eseguita da 15 scenari, provati 6: nessuna differenza |
| persist-lore | persist tolto | src/scenes/GameScene.ts:1807 | scoperta | piazza, fotogramma 96, sezioni store |
| profondita-prompt | profondità | src/scenes/GameScene.ts:2448 | scoperta | riflesso-senza-flow, fotogramma 1, sezioni dl, dlo |
| salto-sfx | sfx tolto (entità) | src/entities/Player.ts:346 | scoperta | livello-perduta, fotogramma 71, sezioni sfx |
| rinculo-nemico | costante (entità) | src/entities/Enemy.ts:591 | scoperta | colpo-pausa, fotogramma 53, sezioni ent, bod |
| fase-boss | soglia (entità) | src/entities/Boss.ts:91 | scoperta | ridimensiona, fotogramma 86, sezioni dl, dlo, cam |
| lastre-suono | soglia (motore) | src/engine/HazardManager.ts:262 | SOPRAVVISSUTA | eseguita da 18 scenari, provati 6: nessuna differenza |
| hud-barre | testo ui | src/ui/hud.ts:109 | scoperta | riflesso-senza-flow, fotogramma 1, sezioni ui |
| film-buio | tween (film) | src/engine/FlashbackManager.ts:194 | scoperta | film-uscita, fotogramma 43, sezioni dl, dlo |

## sfx-microfono

```
PRIMA DIVERGENZA al fotogramma 564 (tempo di scena {"BootScene":119403.88,"GameScene":119403.88})
sezioni diverse: sfx

[sfx] effetti sonori
  .: [["checkpoint",[]]]  ->  null
  emessi nel riferimento da: src/scenes/GameScene.ts:5721 (activateCheckpoint)
```

## flag-dispositivo

```
PRIMA DIVERGENZA al fotogramma 1654 (tempo di scena {"BootScene":137574.18,"GameScene":137574.18})
sezioni diverse: save

[save] il salvataggio
  .flags[64]: dispositivo  ->  (assente)

ultimi eventi prima (riferimento):
  1631 GameScene:player-act
  1643 bark-clear {}
  1643 dialogue-start {"lines":[{"color":"orange","speaker":"la riba","text":"ok ok mi aredo!! tieni sto coso, il dispositivo per entrare nela testa di piema. me l'avevano dato per sorvegliarlo ma non so manco acenderlo."}],"onEnd":"ƒ"}
  1643 dialogue-end {}
  1643 GameScene:boss-defeated
  1644 GameScene:pause
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
  emessi nel riferimento da: src/ui/dialogue.ts:115 (close), src/entities/Boss.ts:128 (engage), src/engine/BossVoice.ts:91 (speak), src/entities/Player.ts:201 (emitVitals), src/entities/Player.ts:202 (emitVitals), src/scenes/GameScene.ts:3685 (lockArena), src/scenes/GameScene.ts:4494 (updateAbilityFx)
  emessi nella candidata da: ../gecowave-mut/src/ui/dialogue.ts:115 (close), ../gecowave-mut/src/entities/Boss.ts:128 (engage), ../gecowave-mut/src/engine/BossVoice.ts:91 (speak), ../gecowave-mut/src/entities/Player.ts:201 (emitVitals), ../gecowave-mut/src/entities/Player.ts:202 (emitVitals), ../gecowave-mut/src/scenes/GameScene.ts:4493 (updateAbilityFx)
```

## tween-cuore

```
PRIMA DIVERGENZA al fotogramma 2 (tempo di scena {"BootScene":110035.34,"GameScene":110035.34})
sezioni diverse: bod

[bod] i corpi fisici
  conteggi: {"dl":955,"ent":191,"bod":298,"lit":249} -> {"dl":955,"ent":191,"bod":298,"lit":249}
  (servono le impronte complete di questo fotogramma: rilancia con --full)

ultimi eventi prima (riferimento):
  1 hp-changed {"hp":50,"hurt":false,"maxHp":50}
  1 flow-changed {"flow":0,"maxFlow":99}
  1 zone-changed {"accentWord":"merdone","color":"orange","punchline":"il fiume sacro. sacro, non profumato.","showCard":false,"title":"IL RIO"}
  1 barre-changed {"barre":667,"gained":false}
  1 abilities-changed {"abilities":["scivolata","rimbalzo","riflesso"]}
  1 fragments-changed {"count":3,"total":8}
  1 MenuScene:shutdown
  1 GameScene:start
  1 GameScene:ready
  1 GameScene:create

la diagnostica divergeva già al fotogramma 1: [{"path":".tweens","a":271,"b":270}]
```

## gocce-lametta

```
PRIMA DIVERGENZA al fotogramma 3394 (tempo di scena {"BootScene":166579.98,"GameScene":166579.98})
sezioni diverse: dl, dlo, bod, lit, ui, ev

[dl] la display list come multiinsieme: un oggetto grafico in più, in meno o diverso
  conteggi: {"dl":983,"ent":149,"bod":370,"lit":250} -> {"dl":982,"ent":149,"bod":370,"lit":250}
  (servono le impronte complete di questo fotogramma: rilancia con --full)

[dlo] l'ordine di disegno a parità di profondità
  conteggi: {"dl":983,"ent":149,"bod":370,"lit":250} -> {"dl":982,"ent":149,"bod":370,"lit":250}
  (servono le impronte complete di questo fotogramma: rilancia con --full)

[bod] i corpi fisici
  conteggi: {"dl":983,"ent":149,"bod":370,"lit":250} -> {"dl":982,"ent":149,"bod":370,"lit":250}
  (servono le impronte complete di questo fotogramma: rilancia con --full)

[lit] le luci 2d
  conteggi: {"dl":983,"ent":149,"bod":370,"lit":250} -> {"dl":982,"ent":149,"bod":370,"lit":250}
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
  [0][1][0]: (assente)  ->  1
  [1][0]: setRain  ->  setBeds
  [1][1][0]: 1  ->  {"cave":0.332849199375,"rain-roof":0.48,"wind":0.16642247272265628}
  [2]: ["setBeds",[{"cave":0.332849199375,"rain-roof":0.48,"wind":0.16642247272265628}]]  ->  (assente)
  emessi nel riferimento da: src/entities/Player.ts:346 (update), src/engine/Atmosphere.ts:176 (update), src/engine/audio/Soundscape.ts:199 (probe)
  emessi nella candidata da: ../gecowave-mut/src/engine/Atmosphere.ts:176 (update), ../gecowave-mut/src/engine/audio/Soundscape.ts:199 (probe)
```

## rinculo-nemico

```
PRIMA DIVERGENZA al fotogramma 53 (tempo di scena {"BootScene":110885.51,"GameScene":110885.51})
sezioni diverse: ent, bod

[ent] le entità del gioco (classi: nemici, nidi, clone, compagni...)
  conteggi: {"dl":1089,"ent":223,"bod":426,"lit":293} -> {"dl":1089,"ent":223,"bod":426,"lit":293}
  (servono le impronte complete di questo fotogramma: rilancia con --full)

[bod] i corpi fisici
  conteggi: {"dl":1089,"ent":223,"bod":426,"lit":293} -> {"dl":1089,"ent":223,"bod":426,"lit":293}
  (servono le impronte complete di questo fotogramma: rilancia con --full)

ultimi eventi prima (riferimento):
  41 GameScene:enemy-alert
  52 GameScene:player-act
```

## fase-boss

```
PRIMA DIVERGENZA al fotogramma 86 (tempo di scena {"BootScene":111435.62,"GameScene":111435.62})
sezioni diverse: dl, dlo, cam

[dl] la display list come multiinsieme: un oggetto grafico in più, in meno o diverso
  conteggi: {"dl":565,"ent":97,"bod":178,"lit":116} -> {"dl":565,"ent":97,"bod":178,"lit":116}
  (servono le impronte complete di questo fotogramma: rilancia con --full)

[dlo] l'ordine di disegno a parità di profondità
  conteggi: {"dl":565,"ent":97,"bod":178,"lit":116} -> {"dl":565,"ent":97,"bod":178,"lit":116}
  (servono le impronte complete di questo fotogramma: rilancia con --full)

[cam] la camera e i suoi effetti
  .BootScene.w: 1280  ->  960
  .BootScene.h: 720  ->  540
  .BootScene.wv[2]: 1280  ->  960
  .BootScene.wv[3]: 720  ->  540
  .GameScene.sx: -30.47619047619048  ->  -22.85714285714289
```

## hud-barre

```
PRIMA DIVERGENZA al fotogramma 1 (tempo di scena {"BootScene":110018.67,"GameScene":110018.67})
sezioni diverse: ui

[ui] il dom della ui
  riferimento: </></><div class="hud-barre" style="color: rgb(248, 113, 113);">"♪ 846 barre"</><div class="hud-tommaso" style="display: none;">"🛡️ protetto da tommasorveglianza 👍"
  candidata:   </></><div class="hud-barre" style="color: rgb(248, 113, 113);">"♪ 846  barre"</><div class="hud-tommaso" style="display: none;">"🛡️ protetto da tommasorveglianza 👍"
```

## film-buio

```
PRIMA DIVERGENZA al fotogramma 43 (tempo di scena {"BootScene":110718.81,"GameScene":110718.81})
sezioni diverse: dl, dlo

[dl] la display list come multiinsieme: un oggetto grafico in più, in meno o diverso
  conteggi: {"dl":765,"ent":134,"bod":276,"lit":188} -> {"dl":765,"ent":134,"bod":276,"lit":188}
  (servono le impronte complete di questo fotogramma: rilancia con --full)

[dlo] l'ordine di disegno a parità di profondità
  conteggi: {"dl":765,"ent":134,"bod":276,"lit":188} -> {"dl":765,"ent":134,"bod":276,"lit":188}
  (servono le impronte complete di questo fotogramma: rilancia con --full)
```
