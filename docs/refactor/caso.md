# il caso nel codice

Generato da `scripts/harness/caso.mjs` su `src/`: 204 estrazioni casuali in 30 file. 65 dalla sequenza della logica, 138 da quella cosmetica, 1 da `Math.random` (solo il seme).

Il gioco pesca da due sequenze con seme (`src/core/rng.ts`, ripartono a ogni livello da semi pescati dal caso del browser): **logica** decide cosa succede, **cosmetico** solo cosa si vede o si sente. Così una particella in più non sposta più la trama. Il caso interno di phaser (particelle con valori `random`) resta su `Math.random` e non tocca nessuna delle due.

La colonna **tipo** per la sequenza cosmetica è sempre **cosmetico**; per la logica può dire di più, scritto a mano e conservato per testo della riga: **logica (testo)** sceglie una battuta o un testo, non cambia lo stato ma cambia la trama letta; **logica (dato salvato)** finisce nel salvataggio. Una pescata nuova sceglie la sequenza leggendo cosa cambia.

| file | estrazioni |
|---|---|
| src/ui/endingFx.ts | 58 |
| src/audio/sfx.ts | 25 |
| src/entities/Boss.ts | 22 |
| src/stage/FolkManager.ts | 19 |
| src/story/FlashbackManager.ts | 9 |
| src/stage/Atmosphere.ts | 8 |
| src/entities/Enemy.ts | 6 |
| src/story/PedroApparition.ts | 6 |
| src/game/abilities/Bottiglia.ts | 5 |
| src/game/chapters/santuario.ts | 5 |
| src/story/BossVoice.ts | 5 |
| src/audio/Soundscape.ts | 4 |
| src/game/Enemies.ts | 4 |
| src/ui/photos.ts | 4 |
| src/content/story.ts | 3 |
| src/game/abilities/Riflesso.ts | 3 |
| src/stage/LightingManager.ts | 3 |
| src/game/Doomsday.ts | 2 |
| src/mechanics/Snipers.ts | 2 |
| src/art/creatureKit.ts | 1 |
| src/content/phone.ts | 1 |
| src/core/rng.ts | 1 |
| src/entities/Companion.ts | 1 |
| src/entities/Spawner.ts | 1 |
| src/game/Bosses.ts | 1 |
| src/game/chapters/nucleo.ts | 1 |
| src/game/chapters/piazza.ts | 1 |
| src/mechanics/HazardManager.ts | 1 |
| src/scenes/GameScene.ts | 1 |
| src/stage/WaterRenderer.ts | 1 |

## src/art/creatureKit.ts

| riga | funzione | chiamata | testo | tipo |
|---|---|---|---|---|
| 598 | animateCreature | rng.fx.next | `let t = rng.fx.next() * 1000;` | cosmetico |

## src/audio/Soundscape.ts

| riga | funzione | chiamata | testo | tipo |
|---|---|---|---|---|
| 108 | Soundscape.update | rng.fx.next | `this.nextShotAt = time + 1800 + rng.fx.next() * 4200;` | cosmetico |
| 209 | Soundscape.oneShot | rng.fx.next | `let x = rng.fx.next() * total;` | cosmetico |
| 213 | Soundscape.oneShot | rng.fx.next | `const pan = (rng.fx.next() * 2 - 1) * 0.85;` | cosmetico |
| 214 | Soundscape.oneShot | rng.fx.next | `const vol = 0.45 + rng.fx.next() * 0.55;` | cosmetico |

## src/audio/sfx.ts

| riga | funzione | chiamata | testo | tipo |
|---|---|---|---|---|
| 69 | Sfx.init | rng.fx.next | `for (let i = 0; i < len; i++) data[i] = rng.fx.next() * 2 - 1;` | cosmetico |
| 75 | Sfx.init | rng.fx.next | `last = (last + 0.02 * (rng.fx.next() * 2 - 1)) / 1.02;` | cosmetico |
| 138 | Sfx.noise | rng.fx.next | `const offset = rng.fx.next() * 1.5;` | cosmetico |
| 185 | Sfx.barra | rng.fx.next | `barra(): void { this.tone(880 + rng.fx.next() * 220, 70, { type: 'triangle', vol: 0.05 }); }` | cosmetico |
| 221 | Sfx.mirrorBirth | rng.fx.next | `const base = 1560 + rng.fx.next() * 200;` | cosmetico |
| 316 | Sfx.death | rng.fx.next | `for (let k = 0; k < 6; k++) this.tone(2600 + rng.fx.next() * 2400, 160 + k * 40, { type: 'sine', vol: 0.025, d` | cosmetico |
| 342 | Sfx.death | rng.fx.next | `for (let k = 0; k < 5; k++) this.tone(200 + rng.fx.next() * 2000, 40, { type: 'square', vol: 0.035, delayMs: k` | cosmetico |
| 371 | Sfx.death | rng.fx.next | `this.tone(180 + rng.fx.next() * 60, 260, { type: 'sawtooth', to: 90, vol: 0.05, attackMs: 15 });` | cosmetico |
| 385 | Sfx.bossVoice | rng.fx.next | `for (let i = 0; i < 6; i++) this.tone(120 + rng.fx.next() * 1800, 45, { type: 'square', vol: 0.03, delayMs: i ` | cosmetico |
| 426 | Sfx.bossVoice | rng.fx.next | `for (let i = 0; i < 5; i++) this.tone(3000 + rng.fx.next() * 2000, 90, { type: 'triangle', vol: 0.02, delayMs:` | cosmetico |
| 445 | Sfx.step | rng.fx.next | `const v = (0.8 + rng.fx.next() * 0.4) * heavy * 0.55;` | cosmetico |
| 446 | Sfx.step | rng.fx.next | `const j = 0.9 + rng.fx.next() * 0.2;` | cosmetico |
| 504 | Sfx.drip | rng.fx.next | `const f = 900 + rng.fx.next() * 900;` | cosmetico |
| 510 | Sfx.clankFar | rng.fx.next | `const f = 300 + rng.fx.next() * 500;` | cosmetico |
| 517 | Sfx.beep | rng.fx.next | `const f = [1320, 1760, 2093, 990][Math.floor(rng.fx.next() * 4)];` | cosmetico |
| 519 | Sfx.beep | rng.fx.next | `if (rng.fx.next() < 0.5) this.tone(f * 1.5, 70, { type: 'square', vol: 0.01 * vol, pan, delayMs: 110 });` | cosmetico |
| 523 | Sfx.cricket | rng.fx.next | `for (let k = 0; k < 3; k++) this.tone(4200 + rng.fx.next() * 300, 35, { type: 'sine', vol: 0.012 * vol, pan, d` | cosmetico |
| 527 | Sfx.bird | rng.fx.next | `const f = 2400 + rng.fx.next() * 1200;` | cosmetico |
| 528 | Sfx.bird | rng.fx.next | `const n = 2 + Math.floor(rng.fx.next() * 3);` | cosmetico |
| 540 | Sfx.whisper | rng.fx.next | `const f = 1400 + rng.fx.next() * 1600;` | cosmetico |
| 546 | Sfx.bubble | rng.fx.next | `const f = 300 + rng.fx.next() * 300;` | cosmetico |
| 551 | Sfx.chime | rng.fx.next | `const base = [1568, 1760, 2093, 2349, 2637][Math.floor(rng.fx.next() * 5)];` | cosmetico |
| 562 | Sfx.squeak | rng.fx.next | `this.tone(3200 + rng.fx.next() * 800, 60, { type: 'sine', to: 4400, vol: 0.012 * vol, pan });` | cosmetico |
| 572 | Sfx.creak | rng.fx.next | `const f = 140 + rng.fx.next() * 120;` | cosmetico |
| 665 | loop | rng.fx.next | `src.start(0, rng.fx.next() * 1.5);` | cosmetico |

## src/content/phone.ts

| riga | funzione | chiamata | testo | tipo |
|---|---|---|---|---|
| 48 | pickFrom | rng.logic.next | `const pickFrom = (lines: string[]) => lines[Math.floor(rng.logic.next() * lines.length)];` | logica (testo) |

## src/content/story.ts

| riga | funzione | chiamata | testo | tipo |
|---|---|---|---|---|
| 66 | deathPunchline | rng.logic.next | `return DEATH_TANA[Math.floor(rng.logic.next() * DEATH_TANA.length)];` | logica (testo) |
| 69 | deathPunchline | rng.logic.next | `: toneFor(levelId).deaths === 'miste' && rng.logic.next() < 0.5 ? DEATH_LATE : DEATH_EARLY;` | logica (testo) |
| 70 | deathPunchline | rng.logic.next | `return pool[Math.floor(rng.logic.next() * pool.length)];` | logica (testo) |

## src/core/rng.ts

| riga | funzione | chiamata | testo | tipo |
|---|---|---|---|---|
| 3 | draw | Math.random | `const draw = (): number => Math.floor(Math.random() * 4294967296) >>> 0;` | seme |

## src/entities/Boss.ts

| riga | funzione | chiamata | testo | tipo |
|---|---|---|---|---|
| 203 | Boss.update | rng.fx.next | `this.width / 2 + (rng.fx.next() > 0.85 ? (rng.fx.next() - 0.5) * 8 * this.res : 0),` | cosmetico |
| 203 | Boss.update | rng.fx.next | `this.width / 2 + (rng.fx.next() > 0.85 ? (rng.fx.next() - 0.5) * 8 * this.res : 0),` | cosmetico |
| 204 | Boss.update | rng.fx.next | `this.height / 2 + (rng.fx.next() > 0.9 ? (rng.fx.next() - 0.5) * 6 * this.res : 0)` | cosmetico |
| 204 | Boss.update | rng.fx.next | `this.height / 2 + (rng.fx.next() > 0.9 ? (rng.fx.next() - 0.5) * 6 * this.res : 0)` | cosmetico |
| 206 | Boss.update | rng.fx.next | `if (rng.fx.next() > 0.985) {` | cosmetico |
| 207 | Boss.update | rng.fx.next | `this.setTintFill(rng.fx.next() > 0.5 ? 0x22d3ee : 0xf87171);` | cosmetico |
| 222 | Boss.update | rng.fx.next | `if ((this.def.glitchy \|\| this.def.move === 'orbit') && rng.fx.next() > 0.93) this.afterimage();` | cosmetico |
| 259 | Boss.update | rng.logic.next | `this.nextHopAt = now + 900 + rng.logic.next() * 700;` | logica |
| 260 | Boss.update | rng.logic.next | `this.hopX = this.anchorX + (rng.logic.next() - 0.5) * 360;` | logica |
| 261 | Boss.update | rng.logic.next | `this.hopY = this.anchorY + (rng.logic.next() - 0.5) * 140;` | logica |
| 312 | Boss.update | rng.logic.next | `this.execute(pool[Math.floor(rng.logic.next() * pool.length)], player, this.frenzy ? 3 : phase);` | logica |
| 317 | Boss.execute | rng.fx.next | `if (rng.fx.next() < 0.55) sfx.bossVoice(this.def.texture);` | cosmetico |
| 408 | Boss.radial | rng.logic.next | `const angle = (Math.PI * 2 * i) / count + rng.logic.next() * 0.2;` | logica |
| 418 | Boss.rain | rng.logic.next | `const ox = (i - count / 2) * 70 + rng.logic.next() * 40;` | logica |
| 430 | Boss.burst | rng.logic.next | `this.shot(this.x, this.y, player.x + (rng.logic.next() - 0.5) * 60, player.y + (rng.logic.next() - 0.5) * 40, ` | logica |
| 430 | Boss.burst | rng.logic.next | `this.shot(this.x, this.y, player.x + (rng.logic.next() - 0.5) * 60, player.y + (rng.logic.next() - 0.5) * 40, ` | logica |
| 447 | Boss.teleport | rng.logic.next | `const side = rng.logic.next() > 0.5 ? 1 : -1;` | logica |
| 469 | Boss.lamette | rng.logic.next | `xs.push(player.x + (i - count / 2) * 64 + rng.logic.next() * 24);` | logica |
| 478 | Boss.spiral | rng.logic.next | `const base = rng.logic.next() * Math.PI * 2;` | logica |
| 588 | Boss.mines | rng.logic.next | `xs.push(player.x + lead + (i - (count - 1) / 2) * 72 + (rng.logic.next() - 0.5) * 20);` | logica |
| 718 | Boss.die | rng.fx.next | `scene.add.particles(x + (rng.fx.next() - 0.5) * 140, y + (rng.fx.next() - 0.5) * 140, 'p-spark', {` | cosmetico |
| 718 | Boss.die | rng.fx.next | `scene.add.particles(x + (rng.fx.next() - 0.5) * 140, y + (rng.fx.next() - 0.5) * 140, 'p-spark', {` | cosmetico |

## src/entities/Companion.ts

| riga | funzione | chiamata | testo | tipo |
|---|---|---|---|---|
| 122 | Companion.update | rng.logic.next | `this.strafeFlipAt = now + 180 + rng.logic.next() * 160;` | logica |

## src/entities/Enemy.ts

| riga | funzione | chiamata | testo | tipo |
|---|---|---|---|---|
| 52 | (modulo) | rng.logic.next | `private t = rng.logic.next() * 1000;` | logica |
| 55 | (modulo) | rng.logic.next | `private facingDir: 1 \| -1 = rng.logic.next() < 0.5 ? -1 : 1;` | logica |
| 82 | (modulo) | rng.fx.next | `private animT = rng.fx.next() * 1000;` | cosmetico |
| 370 | Enemy.patrol | rng.logic.next | `this.nextActionAt = now + 1100 + rng.logic.next() * 900;` | logica |
| 484 | Enemy.stepToward | rng.logic.next | `this.nextActionAt = now + 420 + rng.logic.next() * 300;` | logica |
| 607 | Enemy.die | rng.logic.between | `const amount = rng.logic.between(min, max);` | logica |

## src/entities/Spawner.ts

| riga | funzione | chiamata | testo | tipo |
|---|---|---|---|---|
| 58 | Spawner.constructor | rng.logic.next | `this.nextAt = scene.time.now + 1200 + rng.logic.next() * 1500;` | logica |

## src/game/Bosses.ts

| riga | funzione | chiamata | testo | tipo |
|---|---|---|---|---|
| 210 | Bosses.onOmbraInsight | rng.logic.next | `else if ((a === 'wave-riflesso' \|\| a === 'wave-acquatossica') && rng.logic.next() < 0.3) bark = 'learn-shot'` | logica (testo) |

## src/game/Doomsday.ts

| riga | funzione | chiamata | testo | tipo |
|---|---|---|---|---|
| 49 | Doomsday.update | rng.logic.between | `this.nextWildGlitchAt = time + rng.logic.between(3500, 6500);` | logica |
| 50 | Doomsday.update | rng.logic.next | `const side = rng.logic.next() < 0.5 ? -1 : 1;` | logica |

## src/game/Enemies.ts

| riga | funzione | chiamata | testo | tipo |
|---|---|---|---|---|
| 205 | Enemies.updateSpawners | rng.logic.next | `s.nextAt = time + s.intervalMs * (0.85 + rng.logic.next() * 0.3);` | logica |
| 316 | Enemies.onEnemyDied | rng.logic.next | `const line = NOTINO_FUGHE[Math.floor(rng.logic.next() * NOTINO_FUGHE.length)];` | logica (testo) |
| 333 | Enemies.onEnemyDied | rng.logic.next | `note.setVelocity((rng.logic.next() - 0.5) * 220, -150 - rng.logic.next() * 130);` | logica |
| 333 | Enemies.onEnemyDied | rng.logic.next | `note.setVelocity((rng.logic.next() - 0.5) * 220, -150 - rng.logic.next() * 130);` | logica |

## src/game/abilities/Bottiglia.ts

| riga | funzione | chiamata | testo | tipo |
|---|---|---|---|---|
| 35 | BottigliaFx.shards | rng.fx.next | `const a = rng.fx.next() * Math.PI * 2;` | cosmetico |
| 38 | BottigliaFx.shards | rng.fx.next | `x: x + Math.cos(a) * (30 + rng.fx.next() * 50),` | cosmetico |
| 39 | BottigliaFx.shards | rng.fx.next | `y: y + Math.sin(a) * (20 + rng.fx.next() * 30),` | cosmetico |
| 58 | BottigliaFx.bubbles | rng.fx.next | `if (rng.fx.next() < 0.6) sfx.bubble();` | cosmetico |
| 59 | BottigliaFx.bubbles | rng.fx.next | `const bubble = this.scene.add.particles(p.x + (rng.fx.next() - 0.5) * 120, p.y, 'p-dot', {` | cosmetico |

## src/game/abilities/Riflesso.ts

| riga | funzione | chiamata | testo | tipo |
|---|---|---|---|---|
| 51 | RiflessoFx.follow | rng.fx.next | `this.jitterAt = time + 80 + rng.fx.next() * 60;` | cosmetico |
| 52 | RiflessoFx.follow | rng.fx.next | `this.twin.x += rng.fx.next() < 0.5 ? -2 : 2;` | cosmetico |
| 60 | RiflessoFx.shards | rng.fx.next | `const a = rng.fx.next() * Math.PI * 2;` | cosmetico |

## src/game/chapters/nucleo.ts

| riga | funzione | chiamata | testo | tipo |
|---|---|---|---|---|
| 138 | NucleoChapter.updatePatto | rng.logic.next | `const dir = rng.logic.next() > 0.5 ? 1 : -1;` | logica |

## src/game/chapters/piazza.ts

| riga | funzione | chiamata | testo | tipo |
|---|---|---|---|---|
| 130 | PiazzaChapter.barRumors | rng.logic.shuffle | `const pick = rng.logic.shuffle([...pool]).slice(0, 2);` | logica (testo) |

## src/game/chapters/santuario.ts

| riga | funzione | chiamata | testo | tipo |
|---|---|---|---|---|
| 77 | SantuarioChapter.updateLamettaArena | rng.logic.next | `const xs = [this.ctx.player.x - 70 + rng.logic.next() * 40, this.ctx.player.x + 40 + rng.logic.next() * 40];` | logica |
| 77 | SantuarioChapter.updateLamettaArena | rng.logic.next | `const xs = [this.ctx.player.x - 70 + rng.logic.next() * 40, this.ctx.player.x + 40 + rng.logic.next() * 40];` | logica |
| 82 | SantuarioChapter.updateLamettaArena | rng.logic.next | `const at = this.ctx.world.openSpotNear(c.x + (rng.logic.next() - 0.5) * 400, c.y - 60, 8);` | logica |
| 92 | SantuarioChapter.spawnColorDrop | rng.logic.next | `const x = c.x + (rng.logic.next() - 0.5) * 620;` | logica |
| 94 | SantuarioChapter.spawnColorDrop | rng.logic.next | `const y = this.ctx.carry.lamettaFloorY - 8 - rng.logic.next() * 82;` | logica |

## src/mechanics/HazardManager.ts

| riga | funzione | chiamata | testo | tipo |
|---|---|---|---|---|
| 263 | HazardManager.update | rng.fx.next | `this.scene.tweens.add({ targets: s.img, y: s.y + 90, alpha: 0, angle: (rng.fx.next() - 0.5) * 40, duration: 42` | cosmetico |

## src/mechanics/Snipers.ts

| riga | funzione | chiamata | testo | tipo |
|---|---|---|---|---|
| 65 | Snipers.update | rng.logic.next | `this.nextAt = time + 5200 + rng.logic.next() * 2600;` | logica |
| 71 | Snipers.update | rng.logic.next | `for (const side of rng.logic.next() < 0.5 ? [1, -1] : [-1, 1]) {` | logica |

## src/scenes/GameScene.ts

| riga | funzione | chiamata | testo | tipo |
|---|---|---|---|---|
| 638 | GameScene.update | rng.fx.next | `if (state.run.trenbolone && rng.fx.next() < 0.2) {` | cosmetico |

## src/stage/Atmosphere.ts

| riga | funzione | chiamata | testo | tipo |
|---|---|---|---|---|
| 103 | Atmosphere.build | rng.logic.next | `this.changeAt = this.scene.time.now + 60000 + rng.logic.next() * 60000;` | logica |
| 132 | Atmosphere.starTexture | rng.fx.next | `const a = rng.fx.next();` | cosmetico |
| 136 | Atmosphere.starTexture | rng.fx.next | `ctx.arc(rng.fx.next() * 256, rng.fx.next() * 256, r, 0, Math.PI * 2);` | cosmetico |
| 136 | Atmosphere.starTexture | rng.fx.next | `ctx.arc(rng.fx.next() * 256, rng.fx.next() * 256, r, 0, Math.PI * 2);` | cosmetico |
| 158 | Atmosphere.update | rng.logic.next | `this.changeAt = time + 70000 + rng.logic.next() * 70000;` | logica |
| 159 | Atmosphere.update | rng.logic.next | `this.next = this.pick(rng.logic.next());` | logica |
| 189 | Atmosphere.update | rng.fx.next | `this.nextBoltAt = time + 5000 + rng.fx.next() * 9000;` | cosmetico |
| 204 | Atmosphere.bolt | rng.fx.next | `this.scene.time.delayedCall(300 + rng.fx.next() * 900, () => sfx.thunder());` | cosmetico |

## src/stage/FolkManager.ts

| riga | funzione | chiamata | testo | tipo |
|---|---|---|---|---|
| 50 | (modulo) | rng.fx.next | `phase = rng.fx.next() * 1000;` | cosmetico |
| 137 | FolkManager.spawn | rng.logic.next | `w.facing = rng.logic.next() < 0.5 ? -1 : 1;` | logica |
| 143 | pick | rng.logic.next | `const pick = <T,>(a: T[]) => a[Math.floor(rng.logic.next() * a.length)];` | logica (testo) |
| 146 | FolkManager.converse | rng.logic.next | `if (news.length && rng.logic.next() < 0.6) lines.push({ speaker: w.kind.name, color: w.kind.color, text: pick(` | logica (testo) |
| 169 | FolkManager.say | rng.fx.next | `w.bubble.text.setText(text).setVisible(true).setAlpha(1).setRotation((rng.fx.next() - 0.5) * 0.06);` | cosmetico |
| 227 | FolkManager.think | rng.logic.next | `if (rng.logic.next() < 0.7) this.say(w, FOLK_PANIC[Math.floor(rng.logic.next() * FOLK_PANIC.length)], 1500);` | logica (testo) |
| 227 | FolkManager.think | rng.logic.next | `if (rng.logic.next() < 0.7) this.say(w, FOLK_PANIC[Math.floor(rng.logic.next() * FOLK_PANIC.length)], 1500);` | logica (testo) |
| 237 | FolkManager.think | rng.logic.next | `w.nextBarkAt = now + 9000 + rng.logic.next() * 6000;` | logica (testo) |
| 241 | FolkManager.think | rng.logic.next | `const pool = toneFor(state.save.levelId).folk === 'quieto' && rng.logic.next() < 0.6 ? FOLK_QUIET` | logica (testo) |
| 242 | FolkManager.think | rng.logic.next | `: state.save.doomsday > 0.45 && rng.logic.next() < 0.4 ? FOLK_PEDRO : w.kind.barks;` | logica (testo) |
| 243 | FolkManager.think | rng.logic.next | `this.say(w, pool[Math.floor(rng.logic.next() * pool.length)]);` | logica (testo) |
| 248 | FolkManager.think | rng.logic.next | `const roll = rng.logic.next();` | logica |
| 257 | FolkManager.think | rng.logic.next | `const chat = FOLK_CHAT[Math.floor(rng.logic.next() * FOLK_CHAT.length)];` | logica (testo) |
| 271 | FolkManager.think | rng.logic.next | `w.targetX = (seg.c0 + 0.5 + rng.logic.next() * (seg.c1 - seg.c0)) * TILE;` | logica |
| 276 | FolkManager.think | rng.logic.next | `const e = edges[Math.floor(rng.logic.next() * edges.length)];` | logica |
| 285 | FolkManager.think | rng.logic.next | `w.until = now + 1500 + rng.logic.next() * 2500;` | logica |
| 288 | FolkManager.think | rng.logic.next | `w.until = now + 1500 + rng.logic.next() * 3500;` | logica |
| 289 | FolkManager.think | rng.logic.next | `if (rng.logic.next() < 0.4) w.facing = (-w.facing) as 1 \| -1;` | logica |
| 336 | FolkManager.move | rng.logic.next | `w.until = now + 1200 + rng.logic.next() * 2000;` | logica |

## src/stage/LightingManager.ts

| riga | funzione | chiamata | testo | tipo |
|---|---|---|---|---|
| 55 | LightingManager.follow | rng.fx.next | `duration: 500 + rng.fx.next() * 500,` | cosmetico |
| 76 | LightingManager.prop | rng.fx.next | `duration: flame ? 110 + rng.fx.next() * 200 : 1400 + rng.fx.next() * 900,` | cosmetico |
| 76 | LightingManager.prop | rng.fx.next | `duration: flame ? 110 + rng.fx.next() * 200 : 1400 + rng.fx.next() * 900,` | cosmetico |

## src/stage/WaterRenderer.ts

| riga | funzione | chiamata | testo | tipo |
|---|---|---|---|---|
| 37 | WaterRenderer.build | rng.fx.next | `this.pools.push({ surface, speed: 0.02 + rng.fx.next() * 0.015 });` | cosmetico |

## src/story/BossVoice.ts

| riga | funzione | chiamata | testo | tipo |
|---|---|---|---|---|
| 36 | BossVoice.constructor | rng.logic.next | `this.nextIdleAt = scene.time.now + 9000 + rng.logic.next() * 5000;` | logica (testo) |
| 45 | BossVoice.constructor | rng.logic.next | `if (now - this.hitAt < HIT_COOLDOWN_MS \|\| rng.logic.next() > 0.45) return;` | logica (testo) |
| 52 | onAct | rng.logic.next | `if (now - this.healAt < HEAL_COOLDOWN_MS \|\| rng.logic.next() > 0.7) return;` | logica (testo) |
| 75 | BossVoice.update | rng.logic.next | `this.nextIdleAt = now + 11000 + rng.logic.next() * 6000;` | logica (testo) |
| 84 | BossVoice.speak | rng.logic.next | `let i = Math.floor(rng.logic.next() * pool.length);` | logica (testo) |

## src/story/FlashbackManager.ts

| riga | funzione | chiamata | testo | tipo |
|---|---|---|---|---|
| 584 | FlashbackManager.warp | rng.fx.next | `const a = (Math.PI * 2 * i) / 14 + rng.fx.next() * 0.3;` | cosmetico |
| 585 | FlashbackManager.warp | rng.fx.next | `const len = 60 + rng.fx.next() * 80;` | cosmetico |
| 586 | FlashbackManager.warp | rng.fx.next | `const r = scene.add.rectangle(0, 0, len, 2 + rng.fx.next() * 2, i % 3 ? 0xffffff : tint, 0.55);` | cosmetico |
| 618 | FlashbackManager.room | rng.fx.next | `glowC.setAlpha(0.12 + rng.fx.next() * 0.08);` | cosmetico |
| 619 | FlashbackManager.room | rng.fx.next | `bulb.setAlpha(0.75 + rng.fx.next() * 0.25);` | cosmetico |
| 958 | (modulo) | rng.fx.next | `lamp.setAlpha(0.4 + rng.fx.next() * 0.4);` | cosmetico |
| 1004 | (modulo) | rng.fx.next | `win.setAlpha(0.6 + rng.fx.next() * 0.35);` | cosmetico |
| 1060 | (modulo) | rng.fx.next | `cells.push({ r, seed: rng.fx.next() * 900 });` | cosmetico |
| 1064 | (modulo) | rng.fx.next | `c.r.setAlpha(0.55 + rng.fx.next() * 0.45);` | cosmetico |

## src/story/PedroApparition.ts

| riga | funzione | chiamata | testo | tipo |
|---|---|---|---|---|
| 85 | PedroApparition.update | rng.fx.next | `sp.x = this.baseX + (rng.fx.next() > 0.86 ? (rng.fx.next() - 0.5) * 10 : 0);` | cosmetico |
| 85 | PedroApparition.update | rng.fx.next | `sp.x = this.baseX + (rng.fx.next() > 0.86 ? (rng.fx.next() - 0.5) * 10 : 0);` | cosmetico |
| 86 | PedroApparition.update | rng.fx.next | `sp.y = this.baseY + (rng.fx.next() > 0.9 ? (rng.fx.next() - 0.5) * 6 : 0);` | cosmetico |
| 86 | PedroApparition.update | rng.fx.next | `sp.y = this.baseY + (rng.fx.next() > 0.9 ? (rng.fx.next() - 0.5) * 6 : 0);` | cosmetico |
| 87 | PedroApparition.update | rng.fx.next | `if (rng.fx.next() > 0.97) {` | cosmetico |
| 88 | PedroApparition.update | rng.fx.next | `sp.setTintFill(rng.fx.next() > 0.5 ? 0x22d3ee : 0xf87171);` | cosmetico |

## src/ui/endingFx.ts

| riga | funzione | chiamata | testo | tipo |
|---|---|---|---|---|
| 144 | EndingFx.stepFireworks | rng.fx.next | `this.nextLaunch = t * 1000 + 380 + rng.fx.next() * 480;` | cosmetico |
| 146 | EndingFx.stepFireworks | rng.fx.next | `const kind = kinds[Math.floor(rng.fx.next() * kinds.length)];` | cosmetico |
| 147 | EndingFx.stepFireworks | rng.fx.next | `const x = this.w * (0.12 + rng.fx.next() * 0.76);` | cosmetico |
| 150 | EndingFx.stepFireworks | rng.fx.next | `vx: (rng.fx.next() - 0.5) * 30,` | cosmetico |
| 151 | EndingFx.stepFireworks | rng.fx.next | `vy: -(this.h * (0.52 + rng.fx.next() * 0.2)),` | cosmetico |
| 152 | EndingFx.stepFireworks | rng.fx.next | `fuse: 0.9 + rng.fx.next() * 0.6,` | cosmetico |
| 153 | EndingFx.stepFireworks | rng.fx.next | `palette: PALETTES[Math.floor(rng.fx.next() * PALETTES.length)],` | cosmetico |
| 154 | EndingFx.stepFireworks | rng.fx.next | `power: Math.min(this.w, this.h) * (0.16 + rng.fx.next() * 0.1),` | cosmetico |
| 170 | EndingFx.stepFireworks | rng.fx.next | `x: r.x + (rng.fx.next() - 0.5) * 3, y: r.y + rng.fx.next() * 6,` | cosmetico |
| 170 | EndingFx.stepFireworks | rng.fx.next | `x: r.x + (rng.fx.next() - 0.5) * 3, y: r.y + rng.fx.next() * 6,` | cosmetico |
| 172 | EndingFx.stepFireworks | rng.fx.next | `vx: (rng.fx.next() - 0.5) * 40, vy: 60 + rng.fx.next() * 60,` | cosmetico |
| 172 | EndingFx.stepFireworks | rng.fx.next | `vx: (rng.fx.next() - 0.5) * 40, vy: 60 + rng.fx.next() * 60,` | cosmetico |
| 173 | EndingFx.stepFireworks | rng.fx.next | `life: 0.35, max: 0.35, size: 1.1, color: '#ffb347', seed: rng.fx.next() * 10,` | cosmetico |
| 207 | EndingFx.explode | rng.fx.next | `const n = r.kind === 'willow' ? 55 : 90 + Math.floor(rng.fx.next() * 50);` | cosmetico |
| 210 | EndingFx.explode | rng.fx.next | `? (Math.PI * 2 * i) / n + (rng.fx.next() - 0.5) * 0.1` | cosmetico |
| 211 | EndingFx.explode | rng.fx.next | `: rng.fx.next() * Math.PI * 2;` | cosmetico |
| 213 | EndingFx.explode | rng.fx.next | `? r.power * (0.95 + rng.fx.next() * 0.1)` | cosmetico |
| 214 | EndingFx.explode | rng.fx.next | `: r.power * (0.35 + Math.pow(rng.fx.next(), 0.6) * 0.75);` | cosmetico |
| 215 | EndingFx.explode | rng.fx.next | `const life = r.kind === 'willow' ? 2 + rng.fx.next() * 0.9 : 1.1 + rng.fx.next() * 0.9;` | cosmetico |
| 215 | EndingFx.explode | rng.fx.next | `const life = r.kind === 'willow' ? 2 + rng.fx.next() * 0.9 : 1.1 + rng.fx.next() * 0.9;` | cosmetico |
| 220 | EndingFx.explode | rng.fx.next | `size: 1 + rng.fx.next() * 1.6,` | cosmetico |
| 221 | EndingFx.explode | rng.fx.next | `color: r.palette[Math.floor(rng.fx.next() * r.palette.length)],` | cosmetico |
| 222 | EndingFx.explode | rng.fx.next | `seed: rng.fx.next() * 10,` | cosmetico |
| 257 | EndingFx.stepSparks | rng.fx.next | `if (k < 0.4 && rng.fx.next() < 0.1 && this.sparks.length < 800) {` | cosmetico |
| 260 | EndingFx.stepSparks | rng.fx.next | `vx: (rng.fx.next() - 0.5) * 90, vy: (rng.fx.next() - 0.5) * 90,` | cosmetico |
| 260 | EndingFx.stepSparks | rng.fx.next | `vx: (rng.fx.next() - 0.5) * 90, vy: (rng.fx.next() - 0.5) * 90,` | cosmetico |
| 261 | EndingFx.stepSparks | rng.fx.next | `life: 0.3, max: 0.3, size: 0.9, color: '#ffffff', seed: rng.fx.next() * 10,` | cosmetico |
| 281 | EndingFx.makeSplat | rng.fx.next | `const spikes = 14 + Math.floor(rng.fx.next() * 8);` | cosmetico |
| 284 | EndingFx.makeSplat | rng.fx.next | `const a = (Math.PI * 2 * i) / spikes + (rng.fx.next() - 0.5) * 0.5;` | cosmetico |
| 285 | EndingFx.makeSplat | rng.fx.next | `const len = radius * (0.7 + rng.fx.next() * 0.9);` | cosmetico |
| 286 | EndingFx.makeSplat | rng.fx.next | `const wdt = 1.5 + rng.fx.next() * (radius * 0.09);` | cosmetico |
| 297 | EndingFx.makeSplat | rng.fx.next | `if (rng.fx.next() < 0.5) {` | cosmetico |
| 306 | EndingFx.makeSplat | rng.fx.next | `const lobes = 9 + Math.floor(rng.fx.next() * 5);` | cosmetico |
| 311 | EndingFx.makeSplat | rng.fx.next | `const rr = radius * (0.55 + rng.fx.next() * 0.5);` | cosmetico |
| 329 | EndingFx.makeSplat | rng.fx.next | `const drips = 2 + Math.floor(rng.fx.next() * 3);` | cosmetico |
| 331 | EndingFx.makeSplat | rng.fx.next | `const dx = cx + (rng.fx.next() - 0.5) * radius;` | cosmetico |
| 332 | EndingFx.makeSplat | rng.fx.next | `const len = radius * (0.5 + rng.fx.next() * 0.8);` | cosmetico |
| 334 | EndingFx.makeSplat | rng.fx.next | `g.lineWidth = 2 + rng.fx.next() * 2;` | cosmetico |
| 338 | EndingFx.makeSplat | rng.fx.next | `g.lineTo(dx + (rng.fx.next() - 0.5) * 8, cy + radius * 0.4 + len);` | cosmetico |
| 342 | EndingFx.makeSplat | rng.fx.next | `g.arc(dx, cy + radius * 0.4 + len, 2.5 + rng.fx.next() * 2, 0, Math.PI * 2);` | cosmetico |
| 347 | EndingFx.makeSplat | rng.fx.next | `const a = rng.fx.next() * Math.PI * 2;` | cosmetico |
| 348 | EndingFx.makeSplat | rng.fx.next | `const d = radius * (0.9 + rng.fx.next() * 0.7);` | cosmetico |
| 349 | EndingFx.makeSplat | rng.fx.next | `g.fillStyle = rng.fx.next() < 0.7 ? '#c1121f' : '#e5383b';` | cosmetico |
| 351 | EndingFx.makeSplat | rng.fx.next | `g.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 0.6 + rng.fx.next() * 1.4, 0, Math.PI * 2);` | cosmetico |
| 357 | EndingFx.makeSplat | rng.fx.next | `const a = Math.PI * (0.9 + rng.fx.next() * 0.5);` | cosmetico |
| 358 | EndingFx.makeSplat | rng.fx.next | `const d = radius * (0.2 + rng.fx.next() * 0.35);` | cosmetico |
| 360 | EndingFx.makeSplat | rng.fx.next | `g.ellipse(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 3 + rng.fx.next() * 4, 1.5 + rng.fx.next() * 2, -0.5, 0,` | cosmetico |
| 360 | EndingFx.makeSplat | rng.fx.next | `g.ellipse(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 3 + rng.fx.next() * 4, 1.5 + rng.fx.next() * 2, -0.5, 0,` | cosmetico |
| 390 | EndingFx.scheduleHits | rng.fx.next | `const zones = [0.2, 0.5, 0.8].sort(() => rng.fx.next() - 0.5);` | cosmetico |
| 395 | EndingFx.scheduleHits | rng.fx.next | `x: this.w * (zones[i] + (rng.fx.next() - 0.5) * 0.12),` | cosmetico |
| 396 | EndingFx.scheduleHits | rng.fx.next | `y: this.h * (0.2 + rng.fx.next() * 0.45),` | cosmetico |
| 397 | EndingFx.scheduleHits | rng.fx.next | `radius: Math.min(this.w, this.h) * (0.09 + rng.fx.next() * 0.08),` | cosmetico |
| 404 | EndingFx.strike | rng.fx.next | `this.baked.push({ sprite, x: p.x, y: p.y, scale: 0.01, rot: rng.fx.next() * Math.PI * 2, born: performance.now` | cosmetico |
| 406 | EndingFx.strike | rng.fx.next | `const a = rng.fx.next() * Math.PI * 2;` | cosmetico |
| 407 | EndingFx.strike | rng.fx.next | `const sp = 200 + rng.fx.next() * 320;` | cosmetico |
| 411 | EndingFx.strike | rng.fx.next | `life: 0.3 + rng.fx.next() * 0.25,` | cosmetico |
| 412 | EndingFx.strike | rng.fx.next | `r: 1.5 + rng.fx.next() * 2.5,` | cosmetico |
| 460 | EndingFx.stepBlood | rng.fx.next | `this.bakeDot(d.x, d.y, d.r, rng.fx.next() < 0.4);` | cosmetico |

## src/ui/photos.ts

| riga | funzione | chiamata | testo | tipo |
|---|---|---|---|---|
| 55 | processPhoto | rng.fx.next | `ctx.fillStyle = 'rgba(255,255,255,${(rng.fx.next() * 0.05).toFixed(3)})';` | cosmetico |
| 56 | processPhoto | rng.fx.next | `ctx.fillRect(rng.fx.next() * W, rng.fx.next() * H, 1, 1);` | cosmetico |
| 56 | processPhoto | rng.fx.next | `ctx.fillRect(rng.fx.next() * W, rng.fx.next() * H, 1, 1);` | cosmetico |
| 89 | savePhoto | rng.logic.next | `const photo: Photo = { ...p, id: '${Date.now().toString(36)}${Math.floor(rng.logic.next() * 1e4).toString(36)}` | logica (dato salvato) |
