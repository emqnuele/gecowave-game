# GECOWAVE: The Flux of Cosenza

GECOWAVE: The Flux of Cosenza is a pre-alpha 2D action-platformer built with Phaser 3. It focuses on tight platforming, melee combat, and "wave" abilities that consume mana and have cooldowns. Levels are authored as Tiled JSON maps and rendered with parallax layers, dynamic lighting, and particle effects.

## Tech Stack

- **TypeScript** for gameplay code and systems
- **Phaser 3** for rendering, input, physics, and scene management
- **Vite** for the development server and production builds
- **HTML/CSS** for bootstrapping and global styles
- **Tiled** (JSON) maps for level layout

## Getting Started

> Requires Node.js 18+ (Vite 7).

```bash
npm install
npm run dev
```

Build and preview:

```bash
npm run build
npm run preview
```

## How the Game Works

### Scene Flow

1. **Preloader** loads textures, tilemaps, spritesheets, and generated textures.
2. **MainMenuScene** shows the animated menu with start/load/settings options.
3. **GameScene** builds the playable level: tilemap collision, player/enemy spawns, lighting, particles, parallax, and camera follow.
4. **UIScene** is launched on top of the game, tracking health/mana, wave loadout, inventory, and progression.
5. **PauseScene / GameOverScene / SettingsScene** handle overlays and configuration screens.

### Core Gameplay Systems

- **Player entity** handles movement, jumping, melee attacks, and animations.
- **PlayerStats** tracks HP, mana, and progression; UIScene listens for stat events.
- **Wave system** lets the player equip up to 3 waves (abilities) and cast them with mana costs and cooldowns.
  - **Analysis Wave** fires a projectile.
  - **Double Jump** toggles a passive double-jump.
- **Map system** loads `public/assets/level2.json`, scales it to the 0.2 world size, and spawns torches/props based on the `Objects` layer.
- **Visual systems** add parallax backgrounds, dynamic lights, and decorative props.

### Controls

- **A / D** — Move left/right
- **Space** — Jump (double jump if enabled)
- **Left Mouse Button** — Melee attack
- **1 / 2 / 3** — Select wave slot
- **R** — Cast selected wave
- **Tab** — Toggle inventory/character panel
- **Esc** — Pause menu
- **F1** — Toggle physics debug (when enabled in config)

## Project Structure

```
public/
  assets/               # Tilemaps, sprites, backgrounds, UI icons
    sprites/            # Player spritesheets
scripts/
  generate-level.js     # Procedural level generator (outputs JSON)
  generate-level_2.js
src/
  components/           # Data containers like PlayerStats
  entities/             # Player, enemies, projectiles, base entity
  scenes/               # Phaser scenes (menu, game, UI, pause, etc.)
  systems/              # Map, graphics, and wave ability systems
  shaders/              # Shader-related assets (if used)
  utils/                # Shared constants and helpers
  main.ts               # Phaser game bootstrap and scene setup
  style.css             # Global styles
```

## Current State

The project is in **pre-alpha**. Core gameplay, movement, combat, and wave abilities are implemented, along with UI, lighting, and map systems. Content, balance, and additional levels are still under active development.
