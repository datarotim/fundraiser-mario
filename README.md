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
| Arrow Keys | Move |
| Space | Jump |
| Shift | Run |
| Z | Throw Letter (after collecting power-up) |

---

## The Vision

### The Core Insight

**The Dataro power-up IS the Fire Flower.** Before Dataro you just jump around, dodging problems, with no way to reach donors. After Dataro you can actively engage donors with targeted appeals — and it works.

This maps directly to Dataro's value prop: AI-powered donor engagement that turns guesswork into precision fundraising.

### The Constraint System (Full Vision)

The game should FEEL like fundraising — time-poor with limited opportunities. Then Dataro power-ups remove the constraint.

| Constraint | Without Dataro | With Dataro Power-up |
|-----------|---------------|---------------------|
| **Visibility** | ~30% of donors visible. Rest hidden/greyed | All donors revealed. High-value glow. |
| **Ask limit** | 3 asks per section. Miss = gone forever | Doubled to 6, auto-targets highest-value |
| **Time** | Countdown timer. Can't reach everything | Timer slowed + path to best donors highlighted |
| **Donor value** | All donations look identical | Propensity scores shown — you see who's worth pursuing |

### Target Audience

Nonprofit fundraisers at $10M+ orgs. Tone: gallows humor — the dark comedy of a profession where success is rewarded with higher targets.

---

## Narrative Content

### Opening Text (3 versions, randomly selected)

**Version A — "The Memo"**
> Your nonprofit just posted its worst retention rate in a decade. The board wants a "strategic pivot." Your major gift officer left for a hospital foundation. She took the donor relationships with her. You are armed with three ask types, a CRM last updated during the Obama administration, and a vague sense that someone out there owes you a bequest.

**Version B — "The All-Staff"**
> MEMO: RE: RE: RE: FW: Urgent — Annual Fund Update. Retention is down. Acquisition costs are up. The board chair just forwarded you an article about crypto donations. Your database has 47,000 records and 12,000 duplicates. The intern deleted a segment last Thursday. Nobody's sure which one.

**Version C — "The Exit Interview"**
> "We need to double revenue. Also, we cut your budget." "Also, the gala is in six weeks and nobody booked a venue." "Also, retention. Fix retention." Your donor file is a graveyard of lapsed $25 givers and three major donors who only respond to the former ED.

### Between-Level Cards (pool of 10)

- "The board just formed a subcommittee to discuss forming a committee."
- "86% of first-time donors never give again." You're not bad at this. The math is just brutal.
- "Your CRM has 4 records for Margaret Thompson." One is deceased. Two are the same person. The fourth is a cat.
- "Attribution is a lie we all agree to tell."
- "Your email open rate is 14%." Your board thinks it should be 80% "like when they send emails."
- "Do more with less." — Every nonprofit board since 1973.
- "The gala netted $12,000 after expenses." That's $47 per hour of staff time invested.
- "Your file has hidden major donors." Dataro's AI finds them 10x faster than manual prospect research.
- "You meant to send that thank-you letter six weeks ago." The donor has already been resolited twice since then.
- "The board hired a fundraising consultant." After three months and $45,000, their recommendation is: "Have you considered improving donor retention?"

### Game Over Messages (pool of 12)

1. Your board called an emergency meeting. They hired a consultant. The consultant recommended sending more emails.
2. The CEO asked if you've "tried LinkedIn." You have. It did not help.
3. Your CRM crashed. Nobody noticed for three weeks.
4. The board voted to "pivot to corporate partnerships." Nobody on the board has corporate contacts.
5. Your entire donor file just received the same mail merge. It started with "Dear [FIRST_NAME]."
6. The VP of Development position has been posted. It's your job. They listed it at $15k less than you make.
7. A major donor called to complain. Your database said his name was "Test Record."
8. The board suggested a "fun run" to close the $2M gap. Registration fee: $25.
9. You've been asked to present the "donor retention strategy" at the next board meeting. You have 48 hours and no strategy.
10. The new ED wants to "reimagine philanthropy." Step one: cancel the direct mail program that raises 60% of annual revenue.
11. Someone CC'd the entire donor list on a solicitation email. The reply-all chain lasted four days.
12. Your monthly sustainer file just churned 40% overnight. The payment processor updated and nobody told you.

### Victory Messages (pool of 6)

1. The board said "good job" and immediately asked about next year. Your target went up 15%.
2. You survived another fiscal year. The reward for meeting goal is a higher goal. See you in January.
3. Retention is up. Revenue is up. The board credits the new logo and "that LinkedIn thing." You smile and nod.
4. You did it. The CFO is "cautiously optimistic," which is the nonprofit equivalent of a standing ovation.
5. EOY is over. You check your email. 347 unread. The top one is from the board chair: "Quick question about Q1 targets..."
6. Against all odds, you raised more than last year. The development committee wants to discuss "what went right" so they can take credit in the annual report.

---

## Full Game Design (Target State)

### Level Design (2-Level Demo)

**Level 1: Q1 — Fresh Start.** Spring, optimism, clean palette. Easy. Tutorial section → "you have 3 asks" scarcity → first enemies → Dataro power-up moment → boss.

**Level 2: Q4 — EOY Crunch.** Winter, chaos, screen gets busier and faster. Hard. All enemy types active, speed increased, Dataro power-ups critical — without them, nearly impossible. December countdown, everything speeds up.

### Collectibles

| Item | Visual | Points | Rarity |
|------|--------|--------|--------|
| Small donation | Bronze coin ($25) | 25 | Common |
| Medium donation | Silver coin ($100) | 100 | Uncommon |
| Large donation | Gold coin ($1,000) | 1,000 | Rare |
| Second Gift | Glowing duplicate coin | 2x multiplier | Rare |
| Monthly Sustainer | Spinning recurring symbol | +5/sec ongoing | Very Rare |
| Bequest Disclosure | Floating will/scroll | 10,000 | Ultra-rare |
| DAF Gift | Hidden behind wall | 5,000 | Hidden |

### Power-ups

| Power-up | Effect | Dataro? |
|----------|--------|---------|
| **Dataro AI Predictions** | Reveals ALL hidden donors + value scores | YES — core |
| **Dataro Rescue Sequence** | Auto-saves next 3 sustainers from churn | YES |
| **Dataro Ask Optimizer** | Next 3 asks auto-calibrate to donor capacity | YES |
| **Stewardship Touch** | Restores 10% retention | No |
| **CRM Upgrade** | Slows data corruption enemies | No |
| **"Seamless Integration"** | Does absolutely nothing. Flashes "SYNCING..." then disappears | No — joke |

### Enemies

| Enemy | Behavior | Damage |
|-------|----------|--------|
| Passive Churn Gremlin | Follows sustainers, converts to ghosts | -5% retention |
| Email Fatigue Wraith | Multiplies when over-collected | -3% retention |
| CRM Corruption Blob | Duplicates coins into worthless copies | Wastes asks |
| Board Pressure Golem | Large, slow, blocks path | -10% if unanswered |
| Competitor Org Thief | Fast, steals unattended high-value donors | Permanent donor loss |
| The Spreadsheet | Projectile thrown by Board Golem | -2% retention |

### Bosses

**Boss 1: The Planning Meeting That Never Ends** — A sentient conference table. Dodge agenda items. Survive scope creep. Find the one actual action item to escape. "The meeting was supposed to end at 3:00. It is now 4:47."

**Boss 2: The EOY Crunch Monster** — A monstrous wall calendar for December with torn pages forming teeth. Phase 1: Giving Tuesday wave. Phase 2: December email avalanche. Phase 3: Midnight countdown — 30 seconds, everything speeds up.

### Donor Types

| Type | Ask Match | Clothing | Color |
|------|-----------|----------|-------|
| Small | Letter (✉) | Casual — jeans, t-shirt | Teal (#2A9D8F) |
| Mid | Phone (📞) | Business casual — chinos, collared shirt | Gold (#E9C46A) |
| Major | Red Carpet (🎪) | Formal — dark suit, pocket square | Crimson (#C1272D) |

### Donor Failure Reactions

| Mismatch | Reaction |
|----------|----------|
| Major + Letter | 🙄 "A form letter? Really?" / "I gave $50,000 last year." |
| Small + Red Carpet | 😅 "This feels like a lot..." / "I only gave $25..." |
| Mid + Letter | 📫 "Straight to recycling." / "I get six of these a week." |
| Small + Phone | 😶 "...who is this?" / "Please don't call again." |
| Major + Phone | ⌚ "Talk to my assistant." / "I'm on the back nine." |
| Mid + Red Carpet | 👋 "This is... a lot." / "Can I just mail a check?" |

### Health: Donor Retention Rate

Start at 100%. Every hit reduces it. Game over at <45%. Never fully recovers — retention always trends down. You're managing decline. (Poignant.)

---

## Visual Design Direction

### Master Palette (32 Colors)

- **Dataro Brand:** Purple #6B3FA0, Violet #9B6FD0, Deep #3D1F6D, White-Violet #D4C4F0
- **Donors:** Teal #2A9D8F (small), Gold #E9C46A (mid), Crimson #C1272D (major)
- **Enemies:** Gremlin Green #4E6E2F, Wraith Cyan #7EC8E3, Corruption Purple #6A0DAD, Golem Charcoal #2F2F2F
- **Environment:** Office Green #4A7C59, Sky Blue #87CEEB, Winter Blue #2C3E6B, Calendar Cream #FFF3CD

### Player Character — "The Fundraiser"

**Level 1:** Junior Annual Fund Coordinator. Slight, uncertain. Khakis, button-down (untucked), lanyard with name badge. Carries a small stack of papers.

**Level 2:** Development Manager. Confident posture. Blazer over button-down (now tucked in). Carries a tablet instead of loose papers.

### Style Decisions (Locked)

- **Character style:** Chibi/cute (oversized head). The contrast between cute character and harsh fundraising reality IS the joke.
- **Enemy tone:** Funny/cute-scary. Fundraisers laugh because they RECOGNIZE these things.
- **Palette:** Warm office tones for backgrounds, high-contrast arcade for sprites. Dataro purple becomes the most vibrant thing on screen.
- **Backgrounds:** Rich environmental storytelling with selective dynamic elements. Background jokes are marketing gold.

### The Dataro Reveal Effect (Marquee Moment)

1. **The Pulse (0.3s):** Purple light ring expands from player. Brief freeze frame.
2. **The Scan (0.7s):** Purple scan lines sweep left-to-right. Hidden donors flash white.
3. **The Reveal (0.7s):** All donors transition from grey silhouette to full color. Camera shake.
4. **The Data Layer (0.7s):** Type indicators + propensity scores pop in above each donor.
5. **The Settle (0.3s):** "POWERED BY DATARO AI" fades in. Purple vignette persists.

First activation: full 2.5s effect. Subsequent: abbreviated 1s version.

---

## Current Implementation Status

### What's Working

- [x] Thrower trait — power-up state + letter spawning
- [x] Letter entity — white envelope projectile that kills enemies
- [x] DataroPowerup entity — purple orb pops from ? blocks, slides like mushroom
- [x] Z key input binding
- [x] ? block spawns power-up (first hit), coins after
- [x] "DATARO AI ACTIVATED" flash on power-up collect
- [x] Goomba → person sprite reskin (programmatic pixel art)
- [x] ? blocks recolored to Dataro purple
- [x] "SUPER MARIO BROS." text removed from tileset
- [x] Between-level fundraiser facts
- [x] Start screen controls updated
- [x] Game-over click-to-retry
- [x] Sprite z-order fix (Mario renders in front of scenery)
- [x] Death/respawn with lives system (lose life → death animation → restart)

### What's NOT Being Done in This Version

- No engine/physics changes
- No new levels (using existing Mario levels)
- No audio changes (reusing existing coin/stomp sounds)
- No retention health bar
- No ask limit system
- No hidden donor mechanic
- No TypeScript

### Remaining Work

- [ ] Better donor sprites — current programmatic pixel art doesn't look human enough at 16x16. Need proper sprite sheet artwork.
- [ ] Death animation polish — Physics patch timing on first frame
- [ ] Full narrative text integration (opening crawl, between-level cards from pool, game over messages from pool)
- [ ] Multiple ask types (currently only Letter; Phone and Red Carpet planned)
- [ ] Donor type differentiation (small/mid/major with correct ask matching)
- [ ] Dataro reveal effect (the full scan/reveal sequence)
- [ ] Sound effect for letter throw
- [ ] Victory screen with stats + Dataro CTA
- [ ] Custom player sprite (the fundraiser character)

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

### Sprite Reskin
- Sprite sheet uses fixed pixel coordinates from JSON. Must modify in-place at exact coordinates.
- PIL pixel-by-pixel drawing at 16x16 produces mediocre results. Need actual pixel art tools or CC0 assets.

### Approach Evolution
- Started with a Phaser 3 build (`fundraiser_video_game/`), then pivoted to reskinning the vanilla JS Mario engine. The Mario engine's simplicity made it faster to get gameplay working, but the trait system is less flexible than Phaser's component model.
- The KAPLAY framework was also evaluated (`fundraiser-kaplay/`). The Mario fork won for speed of iteration.

---

## Credits

- Engine: [Meth Meth Method — Code Super Mario in JS](https://www.youtube.com/playlist?list=PLS8HfBXv9ZWWe8zXrViYbIM2Hhylx8DZx)
- Concept & gameplay design: Dataro
- Powered by Dataro AI — [dataro.com](https://dataro.com)
