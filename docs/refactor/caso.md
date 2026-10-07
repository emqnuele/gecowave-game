# il caso nel codice

Generato da `scripts/harness/caso.mjs` su `src/`: 204 estrazioni casuali (`Math.random` e gli helper di phaser che lo usano: `Between`, `FloatBetween`, `RND`, `Shuffle`, `GetRandom`...) in 21 file. Non conta il caso interno di phaser (particelle con valori `random`, `Phaser.Math.RND` dei sistemi): anche quello consuma `Math.random` e quindi sposta la sequenza.

Serve al passo "rng centralizzato" della parte B. Oggi tutto pesca dalla stessa sequenza globale: un'estrazione cosmetica in più (una particella, una scheggia) sposta tutte le estrazioni di logica che vengono dopo. La colonna **tipo** (logica: cambia cosa succede; cosmetico: cambia solo cosa si vede o si sente) va riempita leggendo il codice, prima di spostare qualsiasi chiamata.

| file | estrazioni |
|---|---|
| src/ui/endingFx.ts | 58 |
| src/engine/sfx.ts | 25 |
| src/scenes/GameScene.ts | 23 |
| src/entities/Boss.ts | 22 |
| src/engine/FolkManager.ts | 19 |
| src/engine/FlashbackManager.ts | 9 |
| src/engine/Atmosphere.ts | 8 |
| src/engine/PedroApparition.ts | 6 |
| src/entities/Enemy.ts | 6 |
| src/engine/BossVoice.ts | 5 |
| src/engine/LightingManager.ts | 4 |
| src/engine/audio/Soundscape.ts | 4 |
| src/ui/photos.ts | 4 |
| src/content/story.ts | 3 |
| src/engine/mechanics/Snipers.ts | 2 |
| src/content/phone.ts | 1 |
| src/engine/HazardManager.ts | 1 |
| src/engine/WaterRenderer.ts | 1 |
| src/engine/art/creatureKit.ts | 1 |
| src/entities/Companion.ts | 1 |
| src/entities/Spawner.ts | 1 |

## src/content/phone.ts

| riga | funzione | chiamata | testo | tipo |
|---|---|---|---|---|
| 47 | pickFrom | Math.random | `const pickFrom = (lines: string[]) => lines[Math.floor(Math.random() * lines.length)];` | |

## src/content/story.ts

| riga | funzione | chiamata | testo | tipo |
|---|---|---|---|---|
| 65 | deathPunchline | Math.random | `return DEATH_TANA[Math.floor(Math.random() * DEATH_TANA.length)];` | |
| 68 | deathPunchline | Math.random | `: toneFor(levelId).deaths === 'miste' && Math.random() < 0.5 ? DEATH_LATE : DEATH_EARLY;` | |
| 69 | deathPunchline | Math.random | `return pool[Math.floor(Math.random() * pool.length)];` | |

## src/engine/Atmosphere.ts

| riga | funzione | chiamata | testo | tipo |
|---|---|---|---|---|
| 102 | Atmosphere.build | Math.random | `this.changeAt = this.scene.time.now + 60000 + Math.random() * 60000;` | |
| 131 | Atmosphere.starTexture | Math.random | `const a = Math.random();` | |
| 135 | Atmosphere.starTexture | Math.random | `ctx.arc(Math.random() * 256, Math.random() * 256, r, 0, Math.PI * 2);` | |
| 135 | Atmosphere.starTexture | Math.random | `ctx.arc(Math.random() * 256, Math.random() * 256, r, 0, Math.PI * 2);` | |
| 157 | Atmosphere.update | Math.random | `this.changeAt = time + 70000 + Math.random() * 70000;` | |
| 158 | Atmosphere.update | Math.random | `this.next = this.pick(Math.random());` | |
| 188 | Atmosphere.update | Math.random | `this.nextBoltAt = time + 5000 + Math.random() * 9000;` | |
| 203 | Atmosphere.bolt | Math.random | `this.scene.time.delayedCall(300 + Math.random() * 900, () => sfx.thunder());` | |

## src/engine/BossVoice.ts

| riga | funzione | chiamata | testo | tipo |
|---|---|---|---|---|
| 34 | BossVoice.constructor | Math.random | `this.nextIdleAt = scene.time.now + 9000 + Math.random() * 5000;` | |
| 43 | BossVoice.constructor | Math.random | `if (now - this.hitAt < HIT_COOLDOWN_MS \|\| Math.random() > 0.45) return;` | |
| 50 | onAct | Math.random | `if (now - this.healAt < HEAL_COOLDOWN_MS \|\| Math.random() > 0.7) return;` | |
| 73 | BossVoice.update | Math.random | `this.nextIdleAt = now + 11000 + Math.random() * 6000;` | |
| 82 | BossVoice.speak | Math.random | `let i = Math.floor(Math.random() * pool.length);` | |

## src/engine/FlashbackManager.ts

| riga | funzione | chiamata | testo | tipo |
|---|---|---|---|---|
| 627 | FlashbackManager.warp | Math.random | `const a = (Math.PI * 2 * i) / 14 + Math.random() * 0.3;` | |
| 628 | FlashbackManager.warp | Math.random | `const len = 60 + Math.random() * 80;` | |
| 629 | FlashbackManager.warp | Math.random | `const r = scene.add.rectangle(0, 0, len, 2 + Math.random() * 2, i % 3 ? 0xffffff : tint, 0.55);` | |
| 663 | FlashbackManager.room | Math.random | `glowC.setAlpha(0.12 + Math.random() * 0.08);` | |
| 664 | FlashbackManager.room | Math.random | `bulb.setAlpha(0.75 + Math.random() * 0.25);` | |
| 1006 | (modulo) | Math.random | `try { lamp.setAlpha(0.4 + Math.random() * 0.4); } catch { /* test */ }` | |
| 1052 | (modulo) | Math.random | `try { win.setAlpha(0.6 + Math.random() * 0.35); } catch { /* test */ }` | |
| 1108 | (modulo) | Math.random | `cells.push({ r, seed: Math.random() * 900 });` | |
| 1112 | (modulo) | Math.random | `try { c.r.setAlpha(0.55 + Math.random() * 0.45); } catch { /* test */ }` | |

## src/engine/FolkManager.ts

| riga | funzione | chiamata | testo | tipo |
|---|---|---|---|---|
| 49 | (modulo) | Math.random | `phase = Math.random() * 1000;` | |
| 136 | FolkManager.spawn | Math.random | `w.facing = Math.random() < 0.5 ? -1 : 1;` | |
| 142 | pick | Math.random | `const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];` | |
| 145 | FolkManager.converse | Math.random | `if (news.length && Math.random() < 0.6) lines.push({ speaker: w.kind.name, color: w.kind.color, text: pick(new` | |
| 168 | FolkManager.say | Math.random | `w.bubble.text.setText(text).setVisible(true).setAlpha(1).setRotation((Math.random() - 0.5) * 0.06);` | |
| 226 | FolkManager.think | Math.random | `if (Math.random() < 0.7) this.say(w, FOLK_PANIC[Math.floor(Math.random() * FOLK_PANIC.length)], 1500);` | |
| 226 | FolkManager.think | Math.random | `if (Math.random() < 0.7) this.say(w, FOLK_PANIC[Math.floor(Math.random() * FOLK_PANIC.length)], 1500);` | |
| 236 | FolkManager.think | Math.random | `w.nextBarkAt = now + 9000 + Math.random() * 6000;` | |
| 240 | FolkManager.think | Math.random | `const pool = toneFor(state.save.levelId).folk === 'quieto' && Math.random() < 0.6 ? FOLK_QUIET` | |
| 241 | FolkManager.think | Math.random | `: state.save.doomsday > 0.45 && Math.random() < 0.4 ? FOLK_PEDRO : w.kind.barks;` | |
| 242 | FolkManager.think | Math.random | `this.say(w, pool[Math.floor(Math.random() * pool.length)]);` | |
| 247 | FolkManager.think | Math.random | `const roll = Math.random();` | |
| 256 | FolkManager.think | Math.random | `const chat = FOLK_CHAT[Math.floor(Math.random() * FOLK_CHAT.length)];` | |
| 270 | FolkManager.think | Math.random | `w.targetX = (seg.c0 + 0.5 + Math.random() * (seg.c1 - seg.c0)) * TILE;` | |
| 275 | FolkManager.think | Math.random | `const e = edges[Math.floor(Math.random() * edges.length)];` | |
| 284 | FolkManager.think | Math.random | `w.until = now + 1500 + Math.random() * 2500;` | |
| 287 | FolkManager.think | Math.random | `w.until = now + 1500 + Math.random() * 3500;` | |
| 288 | FolkManager.think | Math.random | `if (Math.random() < 0.4) w.facing = (-w.facing) as 1 \| -1;` | |
| 335 | FolkManager.move | Math.random | `w.until = now + 1200 + Math.random() * 2000;` | |

## src/engine/HazardManager.ts

| riga | funzione | chiamata | testo | tipo |
|---|---|---|---|---|
| 261 | HazardManager.update | Math.random | `this.scene.tweens.add({ targets: s.img, y: s.y + 90, alpha: 0, angle: (Math.random() - 0.5) * 40, duration: 42` | |

## src/engine/LightingManager.ts

| riga | funzione | chiamata | testo | tipo |
|---|---|---|---|---|
| 55 | LightingManager.follow | Math.random | `duration: 500 + Math.random() * 500,` | |
| 75 | LightingManager.torch | Math.random | `duration: 120 + Math.random() * 220,` | |
| 96 | LightingManager.prop | Math.random | `duration: flame ? 110 + Math.random() * 200 : 1400 + Math.random() * 900,` | |
| 96 | LightingManager.prop | Math.random | `duration: flame ? 110 + Math.random() * 200 : 1400 + Math.random() * 900,` | |

## src/engine/PedroApparition.ts

| riga | funzione | chiamata | testo | tipo |
|---|---|---|---|---|
| 84 | PedroApparition.update | Math.random | `sp.x = this.baseX + (Math.random() > 0.86 ? (Math.random() - 0.5) * 10 : 0);` | |
| 84 | PedroApparition.update | Math.random | `sp.x = this.baseX + (Math.random() > 0.86 ? (Math.random() - 0.5) * 10 : 0);` | |
| 85 | PedroApparition.update | Math.random | `sp.y = this.baseY + (Math.random() > 0.9 ? (Math.random() - 0.5) * 6 : 0);` | |
| 85 | PedroApparition.update | Math.random | `sp.y = this.baseY + (Math.random() > 0.9 ? (Math.random() - 0.5) * 6 : 0);` | |
| 86 | PedroApparition.update | Math.random | `if (Math.random() > 0.97) {` | |
| 87 | PedroApparition.update | Math.random | `sp.setTintFill(Math.random() > 0.5 ? 0x22d3ee : 0xf87171);` | |

## src/engine/WaterRenderer.ts

| riga | funzione | chiamata | testo | tipo |
|---|---|---|---|---|
| 35 | WaterRenderer.build | Math.random | `this.pools.push({ surface, speed: 0.02 + Math.random() * 0.015 });` | |

## src/engine/art/creatureKit.ts

| riga | funzione | chiamata | testo | tipo |
|---|---|---|---|---|
| 597 | animateCreature | Math.random | `let t = Math.random() * 1000;` | |

## src/engine/audio/Soundscape.ts

| riga | funzione | chiamata | testo | tipo |
|---|---|---|---|---|
| 107 | Soundscape.update | Math.random | `this.nextShotAt = time + 1800 + Math.random() * 4200;` | |
| 208 | Soundscape.oneShot | Math.random | `let x = Math.random() * total;` | |
| 212 | Soundscape.oneShot | Math.random | `const pan = (Math.random() * 2 - 1) * 0.85;` | |
| 213 | Soundscape.oneShot | Math.random | `const vol = 0.45 + Math.random() * 0.55;` | |

## src/engine/mechanics/Snipers.ts

| riga | funzione | chiamata | testo | tipo |
|---|---|---|---|---|
| 63 | Snipers.update | Math.random | `this.nextAt = time + 5200 + Math.random() * 2600;` | |
| 69 | Snipers.update | Math.random | `for (const side of Math.random() < 0.5 ? [1, -1] : [-1, 1]) {` | |

## src/engine/sfx.ts

| riga | funzione | chiamata | testo | tipo |
|---|---|---|---|---|
| 69 | Sfx.init | Math.random | `for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;` | |
| 75 | Sfx.init | Math.random | `last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;` | |
| 138 | Sfx.noise | Math.random | `const offset = Math.random() * 1.5;` | |
| 185 | Sfx.barra | Math.random | `barra(): void { this.tone(880 + Math.random() * 220, 70, { type: 'triangle', vol: 0.05 }); }` | |
| 221 | Sfx.mirrorBirth | Math.random | `const base = 1560 + Math.random() * 200;` | |
| 316 | Sfx.death | Math.random | `for (let k = 0; k < 6; k++) this.tone(2600 + Math.random() * 2400, 160 + k * 40, { type: 'sine', vol: 0.025, d` | |
| 342 | Sfx.death | Math.random | `for (let k = 0; k < 5; k++) this.tone(200 + Math.random() * 2000, 40, { type: 'square', vol: 0.035, delayMs: k` | |
| 371 | Sfx.death | Math.random | `this.tone(180 + Math.random() * 60, 260, { type: 'sawtooth', to: 90, vol: 0.05, attackMs: 15 });` | |
| 385 | Sfx.bossVoice | Math.random | `for (let i = 0; i < 6; i++) this.tone(120 + Math.random() * 1800, 45, { type: 'square', vol: 0.03, delayMs: i ` | |
| 426 | Sfx.bossVoice | Math.random | `for (let i = 0; i < 5; i++) this.tone(3000 + Math.random() * 2000, 90, { type: 'triangle', vol: 0.02, delayMs:` | |
| 445 | Sfx.step | Math.random | `const v = (0.8 + Math.random() * 0.4) * heavy * 0.55;` | |
| 446 | Sfx.step | Math.random | `const j = 0.9 + Math.random() * 0.2;` | |
| 504 | Sfx.drip | Math.random | `const f = 900 + Math.random() * 900;` | |
| 510 | Sfx.clankFar | Math.random | `const f = 300 + Math.random() * 500;` | |
| 517 | Sfx.beep | Math.random | `const f = [1320, 1760, 2093, 990][Math.floor(Math.random() * 4)];` | |
| 519 | Sfx.beep | Math.random | `if (Math.random() < 0.5) this.tone(f * 1.5, 70, { type: 'square', vol: 0.01 * vol, pan, delayMs: 110 });` | |
| 523 | Sfx.cricket | Math.random | `for (let k = 0; k < 3; k++) this.tone(4200 + Math.random() * 300, 35, { type: 'sine', vol: 0.012 * vol, pan, d` | |
| 527 | Sfx.bird | Math.random | `const f = 2400 + Math.random() * 1200;` | |
| 528 | Sfx.bird | Math.random | `const n = 2 + Math.floor(Math.random() * 3);` | |
| 540 | Sfx.whisper | Math.random | `const f = 1400 + Math.random() * 1600;` | |
| 546 | Sfx.bubble | Math.random | `const f = 300 + Math.random() * 300;` | |
| 551 | Sfx.chime | Math.random | `const base = [1568, 1760, 2093, 2349, 2637][Math.floor(Math.random() * 5)];` | |
| 562 | Sfx.squeak | Math.random | `this.tone(3200 + Math.random() * 800, 60, { type: 'sine', to: 4400, vol: 0.012 * vol, pan });` | |
| 572 | Sfx.creak | Math.random | `const f = 140 + Math.random() * 120;` | |
| 665 | loop | Math.random | `src.start(0, Math.random() * 1.5);` | |

## src/entities/Boss.ts

| riga | funzione | chiamata | testo | tipo |
|---|---|---|---|---|
| 202 | Boss.update | Math.random | `this.width / 2 + (Math.random() > 0.85 ? (Math.random() - 0.5) * 8 * this.res : 0),` | |
| 202 | Boss.update | Math.random | `this.width / 2 + (Math.random() > 0.85 ? (Math.random() - 0.5) * 8 * this.res : 0),` | |
| 203 | Boss.update | Math.random | `this.height / 2 + (Math.random() > 0.9 ? (Math.random() - 0.5) * 6 * this.res : 0)` | |
| 203 | Boss.update | Math.random | `this.height / 2 + (Math.random() > 0.9 ? (Math.random() - 0.5) * 6 * this.res : 0)` | |
| 205 | Boss.update | Math.random | `if (Math.random() > 0.985) {` | |
| 206 | Boss.update | Math.random | `this.setTintFill(Math.random() > 0.5 ? 0x22d3ee : 0xf87171);` | |
| 221 | Boss.update | Math.random | `if ((this.def.glitchy \|\| this.def.move === 'orbit') && Math.random() > 0.93) this.afterimage();` | |
| 258 | Boss.update | Math.random | `this.nextHopAt = now + 900 + Math.random() * 700;` | |
| 259 | Boss.update | Math.random | `this.hopX = this.anchorX + (Math.random() - 0.5) * 360;` | |
| 260 | Boss.update | Math.random | `this.hopY = this.anchorY + (Math.random() - 0.5) * 140;` | |
| 311 | Boss.update | Math.random | `this.execute(pool[Math.floor(Math.random() * pool.length)], player, this.frenzy ? 3 : phase);` | |
| 316 | Boss.execute | Math.random | `if (Math.random() < 0.55) sfx.bossVoice(this.def.texture);` | |
| 407 | Boss.radial | Math.random | `const angle = (Math.PI * 2 * i) / count + Math.random() * 0.2;` | |
| 417 | Boss.rain | Math.random | `const ox = (i - count / 2) * 70 + Math.random() * 40;` | |
| 429 | Boss.burst | Math.random | `this.shot(this.x, this.y, player.x + (Math.random() - 0.5) * 60, player.y + (Math.random() - 0.5) * 40, { spee` | |
| 429 | Boss.burst | Math.random | `this.shot(this.x, this.y, player.x + (Math.random() - 0.5) * 60, player.y + (Math.random() - 0.5) * 40, { spee` | |
| 446 | Boss.teleport | Math.random | `const side = Math.random() > 0.5 ? 1 : -1;` | |
| 468 | Boss.lamette | Math.random | `xs.push(player.x + (i - count / 2) * 64 + Math.random() * 24);` | |
| 477 | Boss.spiral | Math.random | `const base = Math.random() * Math.PI * 2;` | |
| 587 | Boss.mines | Math.random | `xs.push(player.x + lead + (i - (count - 1) / 2) * 72 + (Math.random() - 0.5) * 20);` | |
| 723 | Boss.die | Math.random | `scene.add.particles(x + (Math.random() - 0.5) * 140, y + (Math.random() - 0.5) * 140, 'p-spark', {` | |
| 723 | Boss.die | Math.random | `scene.add.particles(x + (Math.random() - 0.5) * 140, y + (Math.random() - 0.5) * 140, 'p-spark', {` | |

## src/entities/Companion.ts

| riga | funzione | chiamata | testo | tipo |
|---|---|---|---|---|
| 121 | Companion.update | Math.random | `this.strafeFlipAt = now + 180 + Math.random() * 160;` | |

## src/entities/Enemy.ts

| riga | funzione | chiamata | testo | tipo |
|---|---|---|---|---|
| 50 | (modulo) | Math.random | `private t = Math.random() * 1000;` | |
| 53 | (modulo) | Math.random | `private facingDir: 1 \| -1 = Math.random() < 0.5 ? -1 : 1;` | |
| 80 | (modulo) | Math.random | `private animT = Math.random() * 1000;` | |
| 368 | Enemy.patrol | Math.random | `this.nextActionAt = now + 1100 + Math.random() * 900;` | |
| 482 | Enemy.stepToward | Math.random | `this.nextActionAt = now + 420 + Math.random() * 300;` | |
| 605 | Enemy.die | Phaser.Math.Between | `const amount = Phaser.Math.Between(min, max);` | |

## src/entities/Spawner.ts

| riga | funzione | chiamata | testo | tipo |
|---|---|---|---|---|
| 57 | Spawner.constructor | Math.random | `this.nextAt = scene.time.now + 1200 + Math.random() * 1500;` | |

## src/scenes/GameScene.ts

| riga | funzione | chiamata | testo | tipo |
|---|---|---|---|---|
| 1098 | GameScene.updateSpawners | Math.random | `s.nextAt = time + s.intervalMs * (0.85 + Math.random() * 0.3);` | |
| 1624 | GameScene.barRumors | Phaser.Utils.Array.Shuffle | `const pick = Phaser.Utils.Array.Shuffle([...pool]).slice(0, 2);` | |
| 2909 | GameScene.update | Math.random | `if (state.run.trenbolone && Math.random() < 0.2) {` | |
| 2965 | GameScene.updateDoomsday | Phaser.Math.Between | `this.nextWildGlitchAt = time + Phaser.Math.Between(3500, 6500);` | |
| 2966 | GameScene.updateDoomsday | Math.random | `const side = Math.random() < 0.5 ? -1 : 1;` | |
| 4057 | GameScene.onRiflessoSwap | Math.random | `const a = Math.random() * Math.PI * 2;` | |
| 4129 | GameScene.updateClone | Math.random | `this.cloneJitterAt = time + 80 + Math.random() * 60;` | |
| 4130 | GameScene.updateClone | Math.random | `this.cloneTwin.x += Math.random() < 0.5 ? -2 : 2;` | |
| 4362 | GameScene.burstBottle | Math.random | `const a = Math.random() * Math.PI * 2;` | |
| 4365 | GameScene.burstBottle | Math.random | `x: x + Math.cos(a) * (30 + Math.random() * 50),` | |
| 4366 | GameScene.burstBottle | Math.random | `y: y + Math.sin(a) * (20 + Math.random() * 30),` | |
| 4422 | GameScene.updateAcquaTossica | Math.random | `if (tick && Math.random() < 0.6) sfx.bubble();` | |
| 4424 | GameScene.updateAcquaTossica | Math.random | `const bubble = this.add.particles(p.x + (Math.random() - 0.5) * 120, p.y, 'p-dot', {` | |
| 4784 | GameScene.updateLamettaArena | Math.random | `const xs = [this.player.x - 70 + Math.random() * 40, this.player.x + 40 + Math.random() * 40];` | |
| 4784 | GameScene.updateLamettaArena | Math.random | `const xs = [this.player.x - 70 + Math.random() * 40, this.player.x + 40 + Math.random() * 40];` | |
| 4789 | GameScene.updateLamettaArena | Math.random | `const at = this.openSpotNear(c.x + (Math.random() - 0.5) * 400, c.y - 60, 8);` | |
| 4814 | GameScene.spawnColorDrop | Math.random | `const x = c.x + (Math.random() - 0.5) * 620;` | |
| 4816 | GameScene.spawnColorDrop | Math.random | `const y = this.lamettaFloorY - 8 - Math.random() * 82;` | |
| 5052 | GameScene.updatePatto | Math.random | `const dir = Math.random() > 0.5 ? 1 : -1;` | |
| 5182 | GameScene.onEnemyDied | Math.random | `const line = NOTINO_FUGHE[Math.floor(Math.random() * NOTINO_FUGHE.length)];` | |
| 5199 | GameScene.onEnemyDied | Math.random | `note.setVelocity((Math.random() - 0.5) * 220, -150 - Math.random() * 130);` | |
| 5199 | GameScene.onEnemyDied | Math.random | `note.setVelocity((Math.random() - 0.5) * 220, -150 - Math.random() * 130);` | |
| 5297 | GameScene.onOmbraInsight | Math.random | `else if ((a === 'wave-riflesso' \|\| a === 'wave-acquatossica') && Math.random() < 0.3) bark = 'learn-shot';` | |

## src/ui/endingFx.ts

| riga | funzione | chiamata | testo | tipo |
|---|---|---|---|---|
| 143 | EndingFx.stepFireworks | Math.random | `this.nextLaunch = t * 1000 + 380 + Math.random() * 480;` | |
| 145 | EndingFx.stepFireworks | Math.random | `const kind = kinds[Math.floor(Math.random() * kinds.length)];` | |
| 146 | EndingFx.stepFireworks | Math.random | `const x = this.w * (0.12 + Math.random() * 0.76);` | |
| 149 | EndingFx.stepFireworks | Math.random | `vx: (Math.random() - 0.5) * 30,` | |
| 150 | EndingFx.stepFireworks | Math.random | `vy: -(this.h * (0.52 + Math.random() * 0.2)),` | |
| 151 | EndingFx.stepFireworks | Math.random | `fuse: 0.9 + Math.random() * 0.6,` | |
| 152 | EndingFx.stepFireworks | Math.random | `palette: PALETTES[Math.floor(Math.random() * PALETTES.length)],` | |
| 153 | EndingFx.stepFireworks | Math.random | `power: Math.min(this.w, this.h) * (0.16 + Math.random() * 0.1),` | |
| 169 | EndingFx.stepFireworks | Math.random | `x: r.x + (Math.random() - 0.5) * 3, y: r.y + Math.random() * 6,` | |
| 169 | EndingFx.stepFireworks | Math.random | `x: r.x + (Math.random() - 0.5) * 3, y: r.y + Math.random() * 6,` | |
| 171 | EndingFx.stepFireworks | Math.random | `vx: (Math.random() - 0.5) * 40, vy: 60 + Math.random() * 60,` | |
| 171 | EndingFx.stepFireworks | Math.random | `vx: (Math.random() - 0.5) * 40, vy: 60 + Math.random() * 60,` | |
| 172 | EndingFx.stepFireworks | Math.random | `life: 0.35, max: 0.35, size: 1.1, color: '#ffb347', seed: Math.random() * 10,` | |
| 206 | EndingFx.explode | Math.random | `const n = r.kind === 'willow' ? 55 : 90 + Math.floor(Math.random() * 50);` | |
| 209 | EndingFx.explode | Math.random | `? (Math.PI * 2 * i) / n + (Math.random() - 0.5) * 0.1` | |
| 210 | EndingFx.explode | Math.random | `: Math.random() * Math.PI * 2;` | |
| 212 | EndingFx.explode | Math.random | `? r.power * (0.95 + Math.random() * 0.1)` | |
| 213 | EndingFx.explode | Math.random | `: r.power * (0.35 + Math.pow(Math.random(), 0.6) * 0.75);` | |
| 214 | EndingFx.explode | Math.random | `const life = r.kind === 'willow' ? 2 + Math.random() * 0.9 : 1.1 + Math.random() * 0.9;` | |
| 214 | EndingFx.explode | Math.random | `const life = r.kind === 'willow' ? 2 + Math.random() * 0.9 : 1.1 + Math.random() * 0.9;` | |
| 219 | EndingFx.explode | Math.random | `size: 1 + Math.random() * 1.6,` | |
| 220 | EndingFx.explode | Math.random | `color: r.palette[Math.floor(Math.random() * r.palette.length)],` | |
| 221 | EndingFx.explode | Math.random | `seed: Math.random() * 10,` | |
| 256 | EndingFx.stepSparks | Math.random | `if (k < 0.4 && Math.random() < 0.1 && this.sparks.length < 800) {` | |
| 259 | EndingFx.stepSparks | Math.random | `vx: (Math.random() - 0.5) * 90, vy: (Math.random() - 0.5) * 90,` | |
| 259 | EndingFx.stepSparks | Math.random | `vx: (Math.random() - 0.5) * 90, vy: (Math.random() - 0.5) * 90,` | |
| 260 | EndingFx.stepSparks | Math.random | `life: 0.3, max: 0.3, size: 0.9, color: '#ffffff', seed: Math.random() * 10,` | |
| 280 | EndingFx.makeSplat | Math.random | `const spikes = 14 + Math.floor(Math.random() * 8);` | |
| 283 | EndingFx.makeSplat | Math.random | `const a = (Math.PI * 2 * i) / spikes + (Math.random() - 0.5) * 0.5;` | |
| 284 | EndingFx.makeSplat | Math.random | `const len = radius * (0.7 + Math.random() * 0.9);` | |
| 285 | EndingFx.makeSplat | Math.random | `const wdt = 1.5 + Math.random() * (radius * 0.09);` | |
| 296 | EndingFx.makeSplat | Math.random | `if (Math.random() < 0.5) {` | |
| 305 | EndingFx.makeSplat | Math.random | `const lobes = 9 + Math.floor(Math.random() * 5);` | |
| 310 | EndingFx.makeSplat | Math.random | `const rr = radius * (0.55 + Math.random() * 0.5);` | |
| 328 | EndingFx.makeSplat | Math.random | `const drips = 2 + Math.floor(Math.random() * 3);` | |
| 330 | EndingFx.makeSplat | Math.random | `const dx = cx + (Math.random() - 0.5) * radius;` | |
| 331 | EndingFx.makeSplat | Math.random | `const len = radius * (0.5 + Math.random() * 0.8);` | |
| 333 | EndingFx.makeSplat | Math.random | `g.lineWidth = 2 + Math.random() * 2;` | |
| 337 | EndingFx.makeSplat | Math.random | `g.lineTo(dx + (Math.random() - 0.5) * 8, cy + radius * 0.4 + len);` | |
| 341 | EndingFx.makeSplat | Math.random | `g.arc(dx, cy + radius * 0.4 + len, 2.5 + Math.random() * 2, 0, Math.PI * 2);` | |
| 346 | EndingFx.makeSplat | Math.random | `const a = Math.random() * Math.PI * 2;` | |
| 347 | EndingFx.makeSplat | Math.random | `const d = radius * (0.9 + Math.random() * 0.7);` | |
| 348 | EndingFx.makeSplat | Math.random | `g.fillStyle = Math.random() < 0.7 ? '#c1121f' : '#e5383b';` | |
| 350 | EndingFx.makeSplat | Math.random | `g.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 0.6 + Math.random() * 1.4, 0, Math.PI * 2);` | |
| 356 | EndingFx.makeSplat | Math.random | `const a = Math.PI * (0.9 + Math.random() * 0.5);` | |
| 357 | EndingFx.makeSplat | Math.random | `const d = radius * (0.2 + Math.random() * 0.35);` | |
| 359 | EndingFx.makeSplat | Math.random | `g.ellipse(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 3 + Math.random() * 4, 1.5 + Math.random() * 2, -0.5, 0,` | |
| 359 | EndingFx.makeSplat | Math.random | `g.ellipse(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 3 + Math.random() * 4, 1.5 + Math.random() * 2, -0.5, 0,` | |
| 389 | EndingFx.scheduleHits | Math.random | `const zones = [0.2, 0.5, 0.8].sort(() => Math.random() - 0.5);` | |
| 394 | EndingFx.scheduleHits | Math.random | `x: this.w * (zones[i] + (Math.random() - 0.5) * 0.12),` | |
| 395 | EndingFx.scheduleHits | Math.random | `y: this.h * (0.2 + Math.random() * 0.45),` | |
| 396 | EndingFx.scheduleHits | Math.random | `radius: Math.min(this.w, this.h) * (0.09 + Math.random() * 0.08),` | |
| 403 | EndingFx.strike | Math.random | `this.baked.push({ sprite, x: p.x, y: p.y, scale: 0.01, rot: Math.random() * Math.PI * 2, born: performance.now` | |
| 405 | EndingFx.strike | Math.random | `const a = Math.random() * Math.PI * 2;` | |
| 406 | EndingFx.strike | Math.random | `const sp = 200 + Math.random() * 320;` | |
| 410 | EndingFx.strike | Math.random | `life: 0.3 + Math.random() * 0.25,` | |
| 411 | EndingFx.strike | Math.random | `r: 1.5 + Math.random() * 2.5,` | |
| 459 | EndingFx.stepBlood | Math.random | `this.bakeDot(d.x, d.y, d.r, Math.random() < 0.4);` | |

## src/ui/photos.ts

| riga | funzione | chiamata | testo | tipo |
|---|---|---|---|---|
| 54 | processPhoto | Math.random | `ctx.fillStyle = 'rgba(255,255,255,${(Math.random() * 0.05).toFixed(3)})';` | |
| 55 | processPhoto | Math.random | `ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);` | |
| 55 | processPhoto | Math.random | `ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);` | |
| 88 | savePhoto | Math.random | `const photo: Photo = { ...p, id: '${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}', ` | |
