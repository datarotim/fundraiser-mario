# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

A retro 2D platformer ("The Fundraiser") built as a Dataro marketing asset for nonprofit fundraisers. It's a reskin of the [Meth Meth Method Super Mario JS engine](https://www.youtube.com/playlist?list=PLS8HfBXv9ZWWe8zXrViYbIM2Hhylx8DZx) with custom entities, narrative content, and Dataro branding. The game runs entirely in the browser with no build step — vanilla JS ES modules served as static files.

## Commands

- **Install:** `npm install`
- **Run locally:** `npm start` → opens at http://localhost:5000
- **Reskin sprites/tiles:** `python3 reskin.py` (requires PIL/Pillow — recolors ? blocks to purple, replaces goomba sprites)
- **No test suite, no linter, no TypeScript, no bundler.** Changes take effect on browser refresh.

## Deployment

- **Vercel:** Primary deployment. `vercel.json` rewrites all routes to `public/`. The `api/scores.js` serverless function handles leaderboard persistence via `@vercel/blob`.
- **GCS:** `.github/workflows/gcs-deploy.yml` deploys the `public/` folder to GCS on push to `master`. This is static-only (no API).

## Architecture

### Entity-Trait System (engine core)

The engine uses an **Entity + Trait** composition pattern, not class inheritance:

- **Entity** (`public/js/Entity.js`): Has `pos`, `vel`, `size`, `bounds`, and a `traits` Map keyed by **trait constructor** (e.g., `entity.traits.get(Physics)`). Each frame calls `update()` → `collides()` → `finalize()` on all traits.
- **Trait** (`public/js/Trait.js`): Base class with `update()`, `collides()`, `obstruct()`. Has a `queue()` mechanism — queued tasks execute during `finalize()`, not immediately. This is important: `Killable.kill()` defers death until `finalize()`.
- **Constraint:** You cannot have two instances of the same trait class on one entity. Traits are stored by constructor reference.
- **Player identification:** Other entities check `them.traits.has(Stomper)` to detect the player. Projectiles (Letter, Fireball) must skip entities with Stomper to avoid friendly fire.

### Key Traits

Located in `public/js/traits/`:

- `Physics` — position updates + tile collision in one `update()`. To make an entity pass through tiles (e.g., death animation), you must patch `Physics.update` to skip tile checks.
- `Solid` — tile obstruction. Set `obstructs = false` to let an entity fall through platforms.
- `PendulumMove` — back-and-forth movement (used by enemies, donors, power-ups). Set `speed` to control direction/velocity.
- `Killable` — death state. `kill()` is queued, not instant. `removeAfter` controls entity cleanup delay.
- `Thrower` — letter-throwing ability (Z key). 0.3s cooldown. Creates Letter entities.
- `Player` — tracks score, coins, lives, lettersSent, world name.
- `Stomper` — stomp detection on jump (player-only).

### Scene System

- **Scene** (`public/js/Scene.js`): Base class with `Compositor`, `EventEmitter`, `draw()`, `update()`. Emits `EVENT_COMPLETE` when done.
- **SceneRunner** (`public/js/SceneRunner.js`): Manages a scene stack. `addScene()` auto-advances on completion; `addSceneManual()` requires manual `EVENT_COMPLETE` handling.
- **Level** extends Scene: Adds entities, camera, tile collision, music, gravity. The game loop is: update all entities → run entity collisions → finalize → focus camera.
- **NarrativeScene**: Star Wars-style scrolling text. Used for opening narratives and between-level cards.
- **VictoryScene**: Stats display between levels. Auto-advances after 12s or on keypress.
- **TimedScene**: Countdown screen (used for the pre-level "loading" screen).

### Rendering (Compositor + Layers)

The `Compositor` holds an ordered array of layer functions `(context, camera) => void`. Layers are pushed in order during level setup in `main.js`:

1. Background layers (tile grids)
2. Sprite layer (all entities)
3. Dashboard HUD layer
4. Enemy label layer
5. Dataro reveal effect layer

Layer order matters — sprites were previously hidden behind backgrounds due to incorrect insertion order.

### Level Loading

Levels are JSON files in `public/levels/`. The loader (`public/js/loaders/level.js`):
1. Loads the JSON spec
2. Loads sprite sheet, music sheet, and pattern sheet in parallel
3. Creates tile grids from layer data (with pattern expansion)
4. Spawns entities using the entity factory (camera-proximity spawning via `Spawner` trait)
5. Sets up triggers (level transitions, final level flag)

Entity names in level JSON must match keys registered in `public/js/entities.js` (e.g., `"donor-business"`, `"spreadzy"`, `"dataro-powerup"`).

### Custom Fundraiser Entities

All in `public/js/entities/`:

- **Donor** (`Donor.js`): 4-state NPC: walking → responding → fleeing → disgruntled. Uses a custom `Behavior` trait with `handleLetterHit()` protocol. Three visual styles (business/casual/formal) with programmatic pixel-art `draw()` functions. Disgruntled donors grow 2x, chase the player, and fire aimed fireballs.
- **GeneralEnemy** (`GeneralEnemy.js`): Four themed enemies (Spreadzy, Bouncer, Duper, Snippy) using pixel-art arrays with palette-indexed rendering (`drawPixels()`). Created via `createEnemyFactory()` with different speeds.
- **Letter** (`Letter.js`): Projectile entity. Uses duck-typing — checks `them.handleLetterHit` to distinguish donors from killable enemies. Has gravity arc after 0.1s delay.
- **DataroPowerup** (`DataroPowerup.js`): Purple "d" logo. Slides via `PendulumMove`. On collection: powers up Mario, triggers reveal effect, sets shared `dataroActive` flag that enables ask-limit indicators on donors.

### Screen Flow (main.js)

`main.js` manages both DOM overlays and canvas scenes:

1. **Splash screen** (DOM) → "PLAY NOW" button
2. **Signup screen** (DOM) → email capture form, validates, stores in `playerData` and `localStorage`
3. **Tutorial screen** (DOM) → "LET'S GO" button
4. **Opening narrative** (canvas NarrativeScene) → randomly selected from 4 scenarios
5. **Gameplay loop** (canvas Level scenes) → with between-level cards and victory scenes
6. **Game over** (DOM) → stats, leaderboard, Dataro CTA

Death/respawn is handled by monkey-patching `level.update` in `watchForDeath()` — this is a workaround since the original engine had no respawn system. The power-up (big/small) system patches `Physics.update` and `Solid.obstructs` during death animation.

### Leaderboard API

`api/scores.js` is a Vercel serverless function:
- `GET /api/scores` — returns today's scores
- `POST /api/scores` — adds a score entry
- Storage: `@vercel/blob` with a single `leaderboard.json` blob
- Client falls back to `localStorage` if the API is unavailable

### Narrative Content

All text content is in `public/js/narrative.js`. The bitmap font only supports: `SPACE 0-9 A-Z ! - . ×` — all narrative text must be uppercase and avoid unsupported characters (use `!` for `%`, `-` for dashes).

### Sprite Assets

- `public/img/sprites.png`, `tiles.png`, `font.png`, `points.png` — shared sprite sheets
- `public/sprites/*.json` — sprite definitions referencing positions in the sprite sheets
- Custom entities (Donor, GeneralEnemy, Letter, DataroPowerup) use **programmatic drawing** (canvas API), not sprite sheets
- `reskin.py` modifies the legacy sprite/tile PNGs (run once, results are committed)

## Important Engine Gotchas

- **Collision is bidirectional:** `EntityCollider` runs for every entity pair. Both sides' traits fire `collides()`. Guard against double-processing.
- **`kill()` is deferred:** Always goes through `queue()` → `finalize()`. Don't expect immediate death after calling `kill()`.
- **Physics + Solid coupling:** You cannot make an entity ignore tiles without patching `Physics.update` or disabling `Solid.obstructs`.
- **PendulumMove speed sign:** Negative = move left, positive = move right. Speed is preserved across wall bounces.
- **No hot reload:** The game uses ES module `import` statements. Any change requires a full browser refresh.
