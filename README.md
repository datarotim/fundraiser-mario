# The Fundraiser — A Nonprofit Survival Platformer

A retro 2D platformer for nonprofit fundraisers, built as a Dataro marketing asset. Browser-native, shareable, designed to make fundraisers laugh because they recognize their pain — then show them what Dataro does.

Built on [Meth Meth Method's Super Mario JS engine](https://www.youtube.com/playlist?list=PLS8HfBXv9ZWWe8zXrViYbIM2Hhylx8DZx).

## Running

```
npm install
npm start
```
Open http://localhost:5000

## Controls

| Key | Action |
|-----|--------|
| Arrow Keys | Move left/right |
| Space | Jump |
| Shift | Run faster |
| Z | Throw appeal letter |

Touch controls are also available on mobile devices.

---

## The Vision

### The Core Insight

**The Dataro power-up IS the Fire Flower.** Before Dataro you just jump around, dodging problems, with no way to reach donors. After Dataro you can actively engage donors with targeted appeals — and it works. The tagline says it all: "You can now make the right number of asks."

This maps directly to Dataro's value prop: AI-powered donor engagement that turns guesswork into precision fundraising.

### Target Audience

Nonprofit fundraisers at $10M+ orgs. Tone: gallows humor — the dark comedy of a profession where success is rewarded with higher targets.

---

## Current Gameplay

### Flow

1. **Splash Screen** — Dataro-branded attract screen with rotating taglines and "PLAY NOW" CTA
2. **Email Capture** — Quick signup form (name, email, org) with skip option for conference play
3. **Tutorial** — Simple 3-control overview (arrows, space, Z) plus mission goals
4. **Opening Narrative** — Star Wars-style scrolling text (randomly selected from 4 scenarios)
5. **Gameplay** — Platformer levels with donors, enemies, and Dataro power-ups
6. **Between-Level Cards** — Random fundraiser in-jokes between levels
7. **Victory Screen** — Per-level stats (score, donors, letters sent, response rate)
8. **Game Over** — Final stats, leaderboard, Dataro CTA, and play-again option

### Player Mechanics

- **Letter Throwing (Z key)**: Throw appeal letters at donors and enemies from the start. 0.3s cooldown between throws. Letters arc with gravity after 0.1s delay.
- **Big/Small Mario**: Collecting a Dataro power-up makes Mario grow big. Taking damage shrinks Mario back to small (with invincibility frames). Taking damage while small = death.
- **Lives System**: Start with 3 lives. Earn extra lives every 100 coins. Death triggers classic Mario bounce animation (or fall-through for pit deaths).

### Donors

Donors are the core interactive NPCs. Three visual styles (Business suit, Casual, Formal/tuxedo) walk back and forth in levels.

| State | Trigger | Behavior |
|-------|---------|----------|
| **Walking** | Default | Moves back and forth on platforms |
| **Responding** | Hit by letter | Pauses, shows donation speech bubble ($25! / $50! / $100! / Sure! / OK!). Awards 2 coins + 500 points |
| **Fleeing** | Hit 5 times | Says "No more!" and runs away at high speed |
| **Disgruntled** | Hit 5 more times while fleeing | Grows to 2x size, turns angry red, chases player and fires bursts of 3 fireballs |

After collecting a Dataro power-up, donors display an ask-limit indicator (envelope icon with remaining-ask counter) above their heads — so you can see exactly how many asks you have left before they flee.

### Enemies (General Challenges)

Four enemy types represent daily fundraiser obstacles. Each shows a label on first appearance that fades after 2 seconds.

| Enemy | Visual | Speed |
|-------|--------|-------|
| **The Spreadsheet** (Spreadzy) | Green Excel grid character | Slow |
| **The Bounced Email** (Bouncer) | White envelope with red "!" | Fast |
| **The Duplicate Record** (Duper) | Overlapping file cards | Medium |
| **The Budget Cut** (Snippy) | Scissors with angry eyes | Fast |

All enemies can be defeated by stomping (jump on them) or hitting with a letter. Stomping awards 100 points; letter kills award 200 points + 1 coin.

### The Dataro Power-up

A purple pixel-art "d" logo that pops from ? blocks and slides across platforms like a mushroom.

**On collection:**
- Mario grows big (can take an extra hit)
- Triggers an epic multi-phase reveal effect:
  - **First time (2.5s)**: Purple pulse ring → scan line sweep → camera shake → "DATARO AI ACTIVATED" → "YOU CAN NOW MAKE THE RIGHT NUMBER OF ASKS"
  - **Subsequent (1.0s)**: Abbreviated pulse + quick text flash
- Reveals ask-limit indicators above all donors
- "DATARO AI ACTIVATED" flashes on the dashboard for 3 seconds

### Dashboard (HUD)

Displayed during gameplay:
- Player name
- Score (zero-padded 6-digit)
- Letters SENT counter
- QUARTER (world/level number)
- TIME (elapsed seconds)

### Victory & Game Over Screens

**Victory Screen** (between levels): Shows score, donors saved, letters sent, response rate, lives remaining. Random victory message from narrative pool. "POWERED BY DATARO AI" branding. Auto-advances after 12 seconds or on keypress.

**Game Over Screen**: Animated score counter, stats (donors saved, letters sent, response rate, level reached), random Dataro CTA message, daily leaderboard (localStorage), player rank, and "DISCOVER DATARO AI" link.

---

## Narrative Content

### Opening Narratives (4 versions, randomly selected)

**Version A — "The Memo"**
> Your nonprofit just posted its worst retention rate in a decade. The board wants a "strategic pivot." Your major gift officer left for a hospital foundation. She took the donor relationships with her. You are armed with three ask types, a CRM last updated during the Obama administration, and a vague sense that someone out there owes you a bequest.

**Version B — "The All-Staff"**
> MEMO: Urgent — Annual Fund Update. Retention is down. Acquisition costs are up. The board chair just forwarded you an article about crypto donations. Your database has 47,000 records and 12,000 duplicates. The intern deleted a segment last Thursday. Nobody's sure which one.

**Version C — "The Exit Interview"**
> "We need to double revenue. Also, we cut your budget." "Also, the gala is in six weeks and nobody booked a venue." "Also, retention. Fix retention." Your donor file is a graveyard of lapsed $25 givers and three major donors who only respond to the former ED.

**Version D — "EOY Panic"**
> It is December 28th. You have raised 61% of your annual goal. Your director says "we just need a strong finish." You have three days and one mail drop left. Raiser's Edge timed out during your export. Again. The spinning wheel stares back.

### Between-Level Cards (pool of 16)

Randomly selected nonprofit in-jokes shown between levels. Highlights include:
- "The board just formed a subcommittee to discuss forming a committee."
- "Your CRM has 4 records for Margaret Thompson. One is deceased. Two are the same person. The fourth is a cat."
- "Do more with less." — Every nonprofit board since 1973.
- "Your VLOOKUP broke. 4,000 rows now say N/A. The appeal drops tomorrow."
- "The board chair asked why you can't just use Facebook to find donors. You smiled. You died a little."
- Plus 11 more in the pool.

### Game Over Messages (pool of 18)

Randomly shown on game over. Examples:
- Your board called an emergency meeting. They hired a consultant. The consultant recommended sending more emails.
- Your entire donor file just received the same mail merge. It started with "Dear [FIRST_NAME]."
- Someone on the board saw a TikTok about planned giving and now wants a viral bequest campaign.
- Plus 15 more.

### Victory Messages (pool of 8)

- The board said "good job" and immediately asked about next year. Your target went up 15%.
- You did it. The CFO is "cautiously optimistic" — the nonprofit equivalent of a standing ovation.
- A donor called to say your letter moved her to tears. You didn't write it. The intern did. You take the win.
- Plus 5 more.

---

## Full Game Design (Target State)

### Remaining Design Goals

These features represent the full vision but are not yet implemented:

| Feature | Status |
|---------|--------|
| Donor visibility constraint (hidden donors revealed by Dataro) | Not implemented |
| Time constraint (countdown timer, Dataro slows it) | Not implemented |
| Donor value/propensity scores | Not implemented |
| Multiple ask types (Phone, Red Carpet in addition to Letter) | Not implemented |
| Donor type matching (right ask for right donor) | Not implemented |
| Boss encounters | Not implemented |
| Custom player sprite ("The Fundraiser" character) | Not implemented |
| Custom sound effects | Not implemented |
| Differentiated collectibles (bronze/silver/gold coins) | Not implemented |

### Level Design (2-Level Demo)

**Level 1: Q1 — Fresh Start.** Spring, optimism, clean palette. Easy. Tutorial section → first enemies → Dataro power-up moment.

**Level 2: Q4 — EOY Crunch.** Winter, chaos, screen gets busier and faster. Hard. All enemy types active, speed increased, Dataro power-ups critical.

---

## Visual Design Direction

### Master Palette

- **Dataro Brand:** Purple #6B3FA0, Violet #9B6FD0, Deep #3D1F6D, White-Violet #D4C4F0
- **Donors:** Teal #2A9D8F (small), Gold #E9C46A (mid), Crimson #C1272D (major)
- **Enemies:** Gremlin Green #4E6E2F, Wraith Cyan #7EC8E3, Corruption Purple #6A0DAD, Charcoal #2F2F2F
- **Environment:** Office Green #4A7C59, Sky Blue #87CEEB, Winter Blue #2C3E6B, Calendar Cream #FFF3CD

### Style Decisions (Locked)

- **Character style:** Chibi/cute (oversized head). The contrast between cute character and harsh fundraising reality IS the joke.
- **Enemy tone:** Funny/cute-scary. Fundraisers laugh because they RECOGNIZE these things.
- **Palette:** Warm office tones for backgrounds, high-contrast arcade for sprites. Dataro purple becomes the most vibrant thing on screen.

### The Dataro Reveal Effect

Implemented as a multi-phase visual sequence:
1. **The Pulse (0.3s):** Purple light ring expands from center with fade
2. **The Scan (0.7s):** Purple scan line sweeps left-to-right with trailing glow
3. **The Reveal (0.7s):** Camera shake + "DATARO AI ACTIVATED" text fades in
4. **The Data Layer (0.7s):** "YOU CAN NOW MAKE THE RIGHT NUMBER OF ASKS" pulses in/out

First activation: full 2.5s effect. Subsequent: abbreviated 1s version.

---

## Current Implementation Status

### What's Working

- [x] Full splash/signup/tutorial/game-over screen flow with Dataro branding
- [x] Email capture with lead persistence (localStorage)
- [x] Daily leaderboard system
- [x] Touch controls for mobile
- [x] Opening narrative crawl (4 randomly selected scenarios)
- [x] Between-level fundraiser fact cards (pool of 16)
- [x] Victory screen with stats (score, donors, letters sent, response rate)
- [x] Game over screen with stats, leaderboard, and Dataro CTA
- [x] Thrower trait — letter throwing from the start (Z key, 0.3s cooldown)
- [x] Letter entity — white envelope projectile with gravity arc
- [x] Letters sent tracking and response rate calculation
- [x] Donor NPCs with 4-state behavior (walking, responding, fleeing, disgruntled)
- [x] Disgruntled donors grow large, chase player, throw fireballs
- [x] Ask-limit indicator above donors (shown after Dataro power-up)
- [x] 3 donor visual styles (business, casual, formal)
- [x] 4 general enemy types (Spreadsheet, Bounced Email, Duplicate Record, Budget Cut)
- [x] Enemy type labels on first appearance with fade-out animation
- [x] DataroPowerup entity — purple "d" logo, slides like mushroom
- [x] Dataro reveal effect (multi-phase purple pulse/scan/shake/text sequence)
- [x] Big/small Mario power-up system (grow on collect, shrink on damage)
- [x] Invincibility frames after taking damage
- [x] ? block spawns power-up (first hit), coins after
- [x] "DATARO AI ACTIVATED" flash on power-up collect
- [x] Programmatic pixel art sprites for donors, enemies, and power-up
- [x] ? blocks recolored to Dataro purple
- [x] "SUPER MARIO BROS." text removed from tileset
- [x] Death/respawn with lives system and classic death animation
- [x] Pit detection (falling off-screen triggers death)
- [x] Dashboard HUD (name, score, letters sent, quarter, time)
- [x] Developer shortcut to skip signup (JUMP TO GAME button)

### What's NOT Being Done in This Version

- No engine/physics changes beyond what's needed
- No new level geometry (using existing Mario levels)
- No audio changes (reusing existing coin/stomp sounds)
- No retention health bar system
- No hidden donor mechanic
- No TypeScript

### Remaining Work

- [ ] Better donor/enemy sprites — current programmatic pixel art is functional but could benefit from proper sprite sheet artwork
- [ ] Multiple ask types (currently only Letter; Phone and Red Carpet planned)
- [ ] Donor type differentiation (small/mid/major with correct ask matching)
- [ ] Custom sound effect for letter throw (currently reuses stomp sound)
- [ ] Custom player sprite (the fundraiser character)
- [ ] Donor visibility constraint (hidden donors, Dataro reveals them)
- [ ] Time pressure mechanics (countdown timer)

---

## Lessons Learned

### Engine Architecture
- **Trait pattern is powerful but rigid**: Traits stored in a Map keyed by constructor. Can't have two instances of the same trait, and removing/swapping at runtime requires monkey-patching.
- **Collision is bidirectional**: EntityCollider runs for every entity against every other. Both sides' traits fire. New entities need careful collision guards.
- **Physics + Solid are tightly coupled**: Physics does position updates AND tile collision in one `update()`. Making an entity pass through tiles (death animation) requires patching Physics.update to skip tile checks.
- **Layer order matters**: Sprite layer was inserted via `splice(length-1, 0, ...)` which put sprites behind the last background. Changed to `push()` to fix.

### Collision Gotchas
- **Stomper = "is player" check**: Enemies use `them.traits.has(Stomper)` to identify the player. New projectiles must skip Stomper entities.
- **Killable.kill() is queued**: Defers via `queue()` until `finalize()`. Death doesn't take effect until end of update loop.
- **PendulumMove on power-ups**: Speed = 30 + Solid trait = mushroom-like sliding behavior for free.

### Death/Respawn
- Original engine had no respawn — death was permanent game over. Added death watching by patching Level.update in main.js.
- Death animation: patch Physics.update to skip tile collision + set Solid.obstructs = false. Restore both on respawn.
- Pit death detection: check if Mario falls below camera view, then trigger kill immediately.

### Donor Behavior System
- Donors use a state machine (walking → responding → fleeing → disgruntled) driven by letter hit counts.
- The disgruntled state transforms a friendly NPC into a hostile enemy — a gameplay consequence for over-solicitation that mirrors real fundraising dynamics.
- Ask-limit indicators only appear after collecting Dataro power-up, reinforcing the product's value proposition.

### Approach Evolution
- Started with a Phaser 3 build, then pivoted to reskinning the vanilla JS Mario engine. The Mario engine's simplicity made it faster to get gameplay working, but the trait system is less flexible than Phaser's component model.
- The KAPLAY framework was also evaluated. The Mario fork won for speed of iteration.

---

## Credits

- Engine: [Meth Meth Method — Code Super Mario in JS](https://www.youtube.com/playlist?list=PLS8HfBXv9ZWWe8zXrViYbIM2Hhylx8DZx)
- Concept & gameplay design: Dataro
- Powered by Dataro AI — [dataro.io](https://dataro.io)
