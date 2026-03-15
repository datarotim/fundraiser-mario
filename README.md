# The Fundraiser — A Nonprofit Survival Platformer

A Mario-engine platformer reskinned as a fundraising game, built as a Dataro marketing demo. The core insight: **the Dataro power-up IS the Fire Flower.** Before Dataro you just jump around; after Dataro you can engage donors by throwing fundraising appeals (letters) at them.

Built on top of [Meth Meth Method's Super Mario JS engine](https://www.youtube.com/playlist?list=PLS8HfBXv9ZWWe8zXrViYbIM2Hhylx8DZx).

## Running

```
npm install
npm start
```
Open http://localhost:5000

## Controls

| Key | Action |
|-----|--------|
| Arrow Keys | Move |
| Space | Jump |
| Shift | Run |
| Z | Throw Letter (after collecting power-up) |

## Gameplay Flow

1. **Start** — Player has no throw ability. Z key does nothing.
2. **Hit a ? block** — A purple Dataro orb pops out and slides along the ground (like a mushroom).
3. **Touch the orb** — "DATARO AI ACTIVATED" flashes on screen. Letter throwing is now enabled.
4. **Press Z** — White envelope projectile flies in the direction the player is facing, with a slight arc.
5. **Letter hits a donor** — Donor dies, player earns coins + 200 score.
6. **Death** — Player loses a life, does death animation (flies up, falls through floor), respawns at checkpoint. Game over only when lives reach 0.

## The Marketing Moment

The game creates a clear before/after narrative:
- **Before Dataro:** You're just a fundraiser jumping around, dodging problems, with no way to reach donors
- **After Dataro:** You can actively engage donors with targeted appeals — and it works

This maps directly to Dataro's value prop: AI-powered donor engagement that turns guesswork into precision fundraising.

---

## Architecture

### Engine (inherited from Super Mario JS)

The engine uses a **trait-based entity system** with a canvas renderer:

- **Entities** have `pos`, `vel`, `size`, and a `Map` of traits
- **Traits** define behavior via `update()`, `collides()`, and `obstruct()` methods
- **Levels** are JSON files defining tile grids and entity spawn points
- **Compositor** draws layers in order: backgrounds → sprites → HUD
- **TileCollider** handles tile behaviors (`ground`, `brick`, `chance`, `coin`)
- Physics runs at 60fps via a fixed-step timer

### New Entities

| Entity | File | Description |
|--------|------|-------------|
| Letter | `public/js/entities/Letter.js` | Projectile — white envelope that kills enemies on contact, awards coins + score to owner. Uses Velocity + Gravity (delayed) + Killable. Skips collision with player (Stomper check). |
| DataroPowerup | `public/js/entities/DataroPowerup.js` | Collectible — purple orb with Physics + Solid + PendulumMove (slides right at speed 30). On collision with Thrower-enabled entity, enables throwing and triggers flash. |

### New Traits

| Trait | File | Description |
|-------|------|-------------|
| Thrower | `public/js/traits/Thrower.js` | Added to Mario. Manages `enabled` state (set by power-up collection) and `cooldown` (0.3s). Input sets a flag; `update()` spawns Letter entity using `gameContext.entityFactory`. |

### Modified Files

| File | Change |
|------|--------|
| `entities.js` | Registered `letter` and `dataro-powerup` factories |
| `entities/Mario.js` | Added Thrower trait |
| `input.js` | Z key binding calls `Thrower.throw()` |
| `tiles/chance.js` | First ? block hit spawns DataroPowerup instead of direct flash |
| `layers/dashboard.js` | Flash reads from DataroPowerup collect state; game over only at lives=0; click-to-retry |
| `layers/player-progress.js` | Between-level fundraiser facts |
| `loaders/level.js` | Sprite layer renders on top of all backgrounds (z-order fix) |
| `main.js` | Death/respawn system: lose life → death animation → restart level |

### Sprite Reskin (`reskin.py`)

Python PIL script that modifies the sprite sheets:
- **Goombas → Donors**: Replaced goomba frames (walk-1, walk-2, flat) with pixel-art person figures at the same sprite sheet coordinates
- **? blocks → Purple**: Recolored orange tones to Dataro purple (#6B3FA0)
- **"SUPER MARIO BROS." text**: Blanked out from tileset
- Backups saved as `.bak` files

---

## Original Design Goals

### Core Mechanic
The Dataro power-up IS the Fire Flower. It enables throwing letters (fundraising appeals) at donors (goombas-as-people). This creates the marketing moment: before Dataro you just jump around, after Dataro you can engage donors.

### What's Implemented
- [x] Thrower trait — power-up state + letter spawning
- [x] Letter entity — projectile that converts donors
- [x] DataroPowerup entity — collectible that pops from ? blocks
- [x] Entity registration in entities.js
- [x] Wired Thrower to Mario
- [x] Z key input binding
- [x] ? block spawns power-up (first hit only, coins after)
- [x] Goomba → person sprite reskin
- [x] ? block recolor to purple
- [x] "SUPER MARIO BROS." text removed
- [x] Between-level fundraiser facts
- [x] Start screen controls updated
- [x] Game-over click-to-retry
- [x] Sprite z-order fix (Mario renders in front of scenery)
- [x] Death/respawn with lives system

### What's NOT Being Done (by design)
- No engine/physics changes
- No new levels
- No audio changes (reusing existing coin/stomp sounds)
- No retention health bar
- No ask limit system
- No hidden donor mechanic
- No TypeScript

### Remaining Work
- [ ] Better donor sprites — current programmatic pixel art doesn't look human enough at 16x16. Need proper sprite sheet artwork (see OpenGameArt CC0 options).
- [ ] Death animation polish — Mario currently flies up but Physics still applies tile collisions during first frame before the patch kicks in
- [ ] Donor "converted" visual — could show a gift box or hearts instead of the flat/dead goomba frame
- [ ] Sound effect for letter throw (currently reuses stomp sound)
- [ ] Power-up spawn on every ? block vs just the first one (design decision)

---

## Lessons Learned

### Engine Architecture
- **Trait pattern is powerful but rigid**: Traits are stored in a `Map` keyed by constructor. You can't easily have two instances of the same trait, and removing/swapping traits at runtime requires patching methods.
- **Collision is bidirectional**: `EntityCollider.check(subject)` runs for every entity against every other entity. Both sides' traits fire. This means a new entity (like DataroPowerup) needs to carefully guard its `collides()` to avoid unintended kills.
- **Physics + Solid are tightly coupled**: Physics does position updates AND tile collision checks in a single `update()`. To make an entity "pass through" tiles (death animation), you have to monkey-patch Physics.update to skip tile checks.
- **Layer order matters**: The sprite layer was inserted via `splice(length-1, 0, ...)` which put sprites BEHIND the last background layer (scenery). Changing to `push()` fixed sprites rendering behind bushes.

### Collision Gotchas
- **Stomper trait is the "is player" check**: Enemies use `them.traits.has(Stomper)` to identify the player. New projectiles must explicitly skip Stomper entities or they'll try to kill Mario.
- **Killable.kill() is queued**: It calls `queue()` which defers until `finalize()`. The death doesn't take effect until the end of the update loop.
- **PendulumMove on power-ups**: Setting speed to positive (30) makes it slide right. The Solid trait makes it bounce off walls via `obstruct()`. This creates mushroom-like behavior for free.

### Death/Respawn
- Original engine had no respawn — death was permanent game over. Had to add death watching in `main.js` by patching Level.update.
- To make Mario fall through the floor on death: patch Physics.update to skip tile collision, set Solid.obstructs = false, then restore both on respawn.
- `setTimeout` for the death animation duration works but is fragile — a frame-counting approach in the update loop would be more robust.

### Sprite Reskin
- The sprite sheet uses fixed pixel coordinates referenced by JSON (e.g., goomba walk-1 at `[80, 0, 16, 16]`). Modifying sprites in-place at those exact coordinates is the only option — can't add new sheets without modifying the loader.
- PIL pixel-by-pixel drawing at 16x16 is tedious and produces mediocre results. Better to use actual pixel art tools or find CC0 sprite assets.
- The tileset has tile indices (e.g., chance blocks at indices 4,5,6 in row 0 = pixel positions 64,80,96). Recoloring requires understanding which pixels are the target color vs border/shadow.

---

## Credits

- Engine: [Meth Meth Method — Code Super Mario in JS](https://www.youtube.com/playlist?list=PLS8HfBXv9ZWWe8zXrViYbIM2Hhylx8DZx)
- Concept & gameplay design: Dataro
- Powered by Dataro AI — [dataro.com](https://dataro.com)
