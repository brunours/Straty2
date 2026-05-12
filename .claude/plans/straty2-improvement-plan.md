# Straty2 — Improvement Plan

**Drafted:** 2026-05-12
**Baseline:** v0.3.0 (phases 0–2 complete)
**Target:** v1.0.0 — beautiful, multi-player, Supabase-backed Bronze Age 4X

---

## Vision (locked-in decisions)

| Topic | Decision |
|---|---|
| Visual track | **Parallel with gameplay** — each phase ships gameplay + an art slice |
| Art direction | **Stylized low-poly / flat illustration** (Polytopia / Civ Rev vibe) |
| Asset sourcing | AI-generated heroes + Kenney.nl tiles + procedural shapes (see Asset Strategy) |
| Unit roster | **17 total** — 7 designed + 10 new (Slinger, Swordsman, Horseman, War Elephant, Catapult, Battering Ram, Priest, Merchant, Fisherman, Galley) |
| Player count | **3–8 players** (hot-seat + AI mix; no online sync) |
| Map scale | Practical play capped at **Medium/Large**; Huge stays as stretch |
| Supabase scope | **Full**: Auth + saves + profile + match history + leaderboard + achievements |
| Auth | **Supabase Auth** — email/password + Google OAuth |
| Audio | **Out of scope for v1.0** — scaffold only |

---

## Asset Strategy

Stylized flat-illustration requires consistent visual language across ~100 sprites/icons. Plan:

1. **Terrain tiles** — start with **Kenney's "Hexagon Pack"** (CC0 low-poly hex tiles + decorations) as a base. Wash with a unified color grade in Phaser via tint/shader.
2. **Unit sprites** — generate via **AI (Midjourney / SDXL)** with a locked prompt template (`"flat illustration, low-poly, isometric, Bronze Age <unit>, soft palette, transparent background"`) for visual consistency. Post-process to remove backgrounds with `remove.bg` API or local rembg.
3. **City buildings** — same AI pipeline, one prompt template per evolution level.
4. **UI** — Kenney's UI Pack + custom CSS-styled Phaser DOM elements for menus.
5. **Icons (tech, resources, achievements)** — Game-icons.net (CC-BY 3.0) recolored to palette.
6. **Particle FX** — procedural in Phaser (no assets needed).
7. **Fonts** — Google Fonts: **Cinzel** (display) + **Inter** (UI body).

A `docs/art-pipeline.md` will pin exact prompts, palette hex codes, and rules.

---

## Expanded Unit Roster (17 total)

Existing 7 are unchanged. New 10 below — costs/stats are starting points, balance pass in Phase 11.

| # | Unit | Role | HP | ATK | DEF | Rng | Mv | Cost | Tech |
|--:|---|---|--:|--:|--:|--:|--:|---|---|
| 8 | Slinger | Cheap ranged | 6 | 5 | 2 | 2 | 2 | 15F | — |
| 9 | Swordsman | Heavy melee | 18 | 9 | 6 | 1 | 2 | 35F, 20M | Metalcasting |
| 10 | Horseman | Fast melee, flanker | 14 | 8 | 4 | 1 | 5 | 35F, 10M | Animal Husbandry |
| 11 | War Elephant | Shock tank | 25 | 12 | 8 | 1 | 3 | 60F, 30M | (new) Domestication |
| 12 | Catapult | Siege ranged, anti-city | 8 | 14 | 2 | 3 | 1 | 30W, 20M | (new) Engineering |
| 13 | Battering Ram | Siege melee, +200% vs cities | 20 | 10 | 4 | 1 | 2 | 40W, 10M | Masonry |
| 14 | Priest | Heals adjacent allies +3/turn | 6 | 0 | 2 | 0 | 2 | 25F | (new) Mysticism |
| 15 | Merchant | Trade route → gold income | 5 | 0 | 1 | 0 | 3 | 30F | Pottery |
| 16 | Fisherman | Coastal worker, harvests sea food | 5 | 0 | 1 | 0 | 2 | 15F | — |
| 17 | Galley | Warship, can attack other boats | 18 | 7 | 5 | 1 | 4 | 60W | Shipbuilding |

**Tech tree gains 3 new nodes**: Domestication (after Animal Husbandry), Engineering (after Masonry), Mysticism (after Pottery). Tech tree grows from 14 → 17.

---

## Phase Plan

Versioning: PATCH for in-phase fixes, MINOR for each phase ship. Phases 3–11 → v1.0.0.

### Phase 3 — Cities, Resources & Visual Foundations (v0.4.0)
**Gameplay**
- `entities/City.js`, `entities/ResourceNode.js`, `entities/Player.js`
- `systems/CityGrowth.js` — population threshold logic
- `systems/Resource.js` — passive city income + worker gathering
- City founding via Settler (placeholder unit), city level upgrades

**Visuals**
- Replace flat `Phaser.Graphics` hexes with **textured tile sprites** (Kenney Hexagon Pack, tinted to palette)
- Hex decorations: trees (forest), peaks (mountain), dunes (desert), cattails (swamp)
- City building sprites — 4 levels (Camp → City), AI-generated
- **Main menu redesign**: parallax Bronze Age background, custom-font title, animated button hover
- **HUD redesign**: glassmorphic panels, resource icons, animated counters
- Locked color palette (`docs/palette.md`)

**Done when:** Found a city, watch it grow over 10 turns, see a beautifully styled map.

---

### Phase 4 — Units, Pathfinding & Unit Visuals (v0.5.0)
**Gameplay**
- `entities/Unit.js` + 7 original units
- `systems/Movement.js` with A* on hex grid (uses existing PriorityQueue)
- Movement points, terrain cost, movement range highlight
- `systems/FogOfWar.js` (all 3 modes)

**Visuals**
- 7 unit sprites (AI-generated, transparent PNG)
- Selection ring under unit, HP bar overlay
- Movement range overlay (translucent hex tint)
- Animated path preview (marching ant dotted line)
- Unit movement tween (slide + idle bob)
- Fog overlay shader (smooth gradient at vision edge)
- Player color tint on unit sprite (handles up to 8 colors)

**Done when:** Select a unit, see movement range, click to walk it along an animated path through fog.

---

### Phase 5 — Tech Tree (v0.6.0)
**Gameplay**
- `systems/Tech.js`, `config/techTree.js` (17 nodes incl. 3 new)
- Research points = sum of city populations (per design doc)
- Tech-gated unit/building unlocks

**Visuals**
- Full-screen tech tree overlay with custom layout (branches drawn as Bézier connections)
- Tech icons (game-icons.net, recolored)
- Researched / unlocked / locked visual states
- "Now researching" progress bar in HUD
- Tech-unlocked toast animation

**Done when:** Research Bronze Working over 4 turns, see Spearman appear in city build queue.

---

### Phase 6 — Combat, Expanded Roster & FX (v0.7.0)
**Gameplay**
- `systems/Combat.js` — combined system per design (terrain + flanking + tech mods + counter-damage)
- Add **10 new units** (Slinger, Swordsman, Horseman, War Elephant, Catapult, Battering Ram, Priest, Merchant, Fisherman, Galley)
- City capture / assault logic
- `systems/Victory.js` — conquest check

**Visuals**
- 10 new unit sprites (same AI pipeline as Phase 4)
- Attack animations per unit class: melee lunge, projectile arc, sling stone, catapult boulder, ram charge
- Hit FX: particle burst (sparks for swords, dust for blunt), screen flash on crit
- Floating damage numbers (Phaser tween fade-up)
- Death animation: sprite tint red → fade alpha → smoke puff
- Combat preview popup: side-by-side unit cards with predicted damage range
- Camera shake on melee, zoom-in on city assault

**Done when:** Full skirmish — recruit 4 unit types, fight, capture an enemy city, see victory screen.

---

### Phase 7 — AI & Multi-Player Expansion (v0.8.0)
**Gameplay**
- `ai/AIController.js`, `ai/UtilityScorer.js`, `ai/AIActions.js`, `ai/AIPersonality.js`
- 3 difficulty levels with documented utility-weight presets
- **Expand to 3–8 players**: GameSetupScene grows to a slot list (player 3..8 each: human/AI, name, color)
- Per-player turn order, AI sequential turns with throttled animation
- Hot-seat handoff: "Pass to Player X" curtain screen

**Visuals**
- Setup screen: 8 player slot rows with color pickers (8-color palette pre-defined)
- AI "thinking..." indicator (animated dots over AI player's banner)
- Minimap colored by player territory
- Turn handoff curtain: full-screen banner with player name + color + map seed
- Per-player banner in HUD (showing whose turn it is, plus next-up queue)

**Done when:** 4-player FFA: 1 human + 3 AI, hot-seat-able mid-game, AI plays competently on Medium.

---

### Phase 8 — Supabase Auth & Save/Load (v0.9.0)
**Auth**
- `persistence/SupabaseClient.js` (wraps `@supabase/supabase-js`)
- `persistence/AuthManager.js` — sign-up, sign-in, sign-out, session restore
- Sign-in screen before MainMenu (optional "Continue as Guest" with anonymous UUID)
- Email/password + Google OAuth providers

**Saves**
- `persistence/SaveManager.js` — serialize `GameState.toJSON()` to Supabase
- 10 named save slots per user
- Auto-save at start of each human turn (only most recent kept per match)
- `game_saves` table (already exists, schema may need migration for new fields)

**Schema additions** (migrations via Supabase MCP):
```sql
profiles (id uuid PK, username text unique, avatar_url text, created_at, updated_at)
-- game_saves: add columns user_id (uuid), match_id (uuid), name (text), updated_at
```
Row-level security: users read/write only their own.

**Visuals**
- Sign-in / sign-up screen (split-pane illustration left, form right)
- Avatar in HUD top-right
- Save/load modal with slot cards (thumbnail = minimap snapshot, turn #, last played)

**Done when:** Sign in → start game → close browser → return → resume save.

---

### Phase 9 — Player Profile, Stats & Match History (v0.10.0)
**Gameplay / Backend**
- On match end → write `match_history` + `match_participants` rows
- Trigger or edge-function maintains `player_stats` aggregates
- Per-game replay seed (regenerate map from saved seed)

**Schema additions**:
```sql
match_history (id uuid PK, started_at, finished_at, winner_user_id, duration_turns,
               map_seed bigint, map_size, settings jsonb)
match_participants (match_id FK, user_id FK nullable, player_index, color, was_ai,
                    ai_difficulty, final_score, eliminated_turn, units_killed,
                    units_lost, cities_founded, cities_captured)
player_stats (user_id PK, games_played, games_won, games_lost,
              total_units_killed, total_units_lost, total_cities_founded,
              total_cities_captured, total_turns_played,
              fastest_victory_turns, longest_game_turns, updated_at)
```

**Visuals**
- **Profile dashboard** screen reachable from MainMenu
  - Avatar, username, lifetime stat cards (W/L %, units killed, etc.)
  - Stats over time chart (Chart.js or Phaser-drawn)
- **Match history** list — clickable rows → match detail panel with per-player breakdown
- Post-game victory screen → "Recap" panel with all stats

**Done when:** Finish a game → see it in history → see lifetime stats update.

---

### Phase 10 — Leaderboards & Achievements (v0.11.0)
**Backend**
- `leaderboard` view: rating column (Elo-style or simple W/L-weighted score)
- 40–60 achievements in `achievements` table (seeded)
- `user_achievements` table; client-side trigger after relevant events posts unlock
- Edge function for server-validated achievements (anti-cheat for leaderboard)

**Achievement examples** (final list in `docs/achievements.md`):
- First Blood — win your first game
- Bronze Conqueror — win 10 games
- Speed Run — win in < 30 turns
- Pacifist — win without killing a single unit (sub-objective requires non-conquest victory if we add it; flagged)
- Tech Lord — research every tech in one game
- Genocide — kill 100 units lifetime
- Founding Father — found 50 cities lifetime
- Untouchable — win without losing a city
- Tycoon — accumulate 500 food in a single match
- (and 30–50 more)

**Visuals**
- Leaderboard screen — global top 100, your rank highlighted, filter by season
- Achievement gallery — 4-column grid, locked = silhouette + lock icon
- Unlock toast: slide-in from top with icon + title + sparkle particles
- Profile badge row shows rare unlocks

**Done when:** Win a game → unlock 2 achievements with toast → see new rank on leaderboard.

---

### Phase 11 — Polish, Performance, Audio Stub & 1.0.0 (v1.0.0)
**Polish**
- Balance pass on units, costs, tech costs (playtest sessions)
- Camera-zoom hex LOD: skip decoration sprites at far zoom
- Sprite atlasing → single texture page per category (perf for Medium/Large maps)
- Tween-batch unit animations
- Edge cases: 8-player game on Large map (60 fps target on a mid-laptop)
- Tutorial / first-launch onboarding overlay

**Audio scaffolding**
- `systems/AudioManager.js` — load + play stubs with empty `.ogg` placeholders
- Hook events (unit move, attack, city found, turn end, victory) → audio events (silent for now)
- No actual audio assets in v1.0 — gates future audio drop-in

**Visual final pass**
- Day/night subtle global tint on map
- Idle camera drift in main menu (parallax)
- Loading screen with rotating tip text

**Done when:** Tagged 1.0.0, README updated with full feature list and screenshots.

---

## Timeline & Estimates

Rough effort, assuming solo dev with Claude-Code assistance:

| Phase | Code effort | Art effort | Total weeks |
|--|--|--|--|
| 3 — Cities + visual foundation | M | L | 2 |
| 4 — Units + sprites | M | L | 2 |
| 5 — Tech tree | S | M | 1 |
| 6 — Combat + 10 units + FX | L | L | 3 |
| 7 — AI + 3–8 players | L | M | 2 |
| 8 — Supabase auth + saves | M | S | 1.5 |
| 9 — Stats + history | M | M | 1.5 |
| 10 — Leaderboards + achievements | M | M | 1.5 |
| 11 — Polish + audio stub + 1.0 | M | M | 2 |
| **Total** | | | **~16 weeks** |

---

## Cross-cutting concerns

**Testing**
- Manual playtest at end of each phase (documented in `releaseNotes.md`)
- Console assertions remain in hex math + A*
- Save/load round-trip test fixture from Phase 8 onward
- 2-AI bot-vs-bot regression run at end of phases 7+

**Performance budget**
- 60 fps on Medium (750 hexes, 4 players, 40 units total) on integrated GPU laptop
- 30 fps on Large (2,000 hexes, 8 players, 100 units) as floor
- Huge (8,000 hexes) → "best effort", warn user in setup

**Risks / open items**
- AI-generated sprite consistency — may require multiple iterations + a style guide commit
- 3-8 player turn pacing — hot-seat with 8 humans is tedious; consider "simultaneous resolve" mode later (out of scope for 1.0)
- Supabase free-tier limits — should be fine; monitor `match_history` row count
- Online multiplayer — explicitly deferred; schema should not preclude it (use UUIDs everywhere)

---

## Immediate next step
After plan approval: kick off **Phase 3 (v0.4.0)** — City entity, Resource system, palette lock, Kenney tile import. Should be ~2 weeks.
