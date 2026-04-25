# Enemies And World Events

## Scope

This spec covers enemy generation plus the blood moon, harvest moon, and earthshake event loops.

## Current Behavior

- Enemy spawns are deterministic from world seed, terrain, coordinate, and structure context, and each spawned enemy carries a canonical enemy type id plus gameplay tags.
- When a tile spawns multiple hostile enemies, that pack uses one shared enemy type for the whole hex instead of mixing different hostile types together.
- Enemies roll a deterministic rarity from `Common`, `Uncommon`, `Rare`, `Epic`, and `Legendary` through the shared cascading rarity-event mechanism, with dungeon spawns floored above ordinary field threats and world bosses forced to `Legendary`.
- Rarer enemies scale their combat stats and XP upward beyond the terrain baseline instead of relying only on a binary elite flag.
- Enemy base stats scale from `150 / 50 / 35` at level `1` to `5000 / 1600 / 1100` at level `100`.
- Enemy levels can exceed `100`, and each level above `100` adds `10%` of the level-`100` base max HP, attack, and defense anchors.
- Faction NPCs use non-hostile territory-specific enemy identities so they can participate in the same world systems without behaving like ordinary hostiles.
- Enemy classification such as animal, elite, dungeon, and world-boss behavior resolves from canonical enemy ids and tags instead of display-name checks.
- Blood moon checks occur during the rise window at night.
- When active, nearby enemies spawn in clusters around the player except on blocked tiles.
- Blood moon scales enemy max HP, attack, and defense to 110% of their stored base values while preserving each enemy's current HP ratio through the transition.
- Blood moon increases combat danger and improves loot outcomes, while higher-rarity enemies also improve ordinary gold, consumable, and recipe drop quality.
- Harvest moon is an alternate night event.
- It spawns gathering structures around the player on eligible empty passable tiles.
- Harvest moon resource weighting favors herb patches, which appear three times as often as each individual tree or ore-node option in that event pool.
- Spawned resources remain part of the regular gathering loop after appearing.
- Earthshake is a day-cycle event that can open a nearby dungeon.
- Dungeon opening searches for a valid passable empty tile close to the player.
- Forced earthshake triggering is supported for admin-style or debug flows already wired in state logic.

## Main Implementation Areas

- `src/game/state.ts`
- `src/game/stateWorldEvents.ts`
- `src/game/stateRewards.ts`
- `src/game/combat.ts`
- `src/game/world.ts`
- `src/game/territories.ts`
