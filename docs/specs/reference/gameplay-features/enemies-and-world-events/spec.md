# Enemies And World Events

## Scope

This spec covers enemy generation plus the blood moon, harvest moon, and earthshake event loops.

## Current Behavior

- Enemy spawns are deterministic from world seed, terrain, coordinate, and structure context, and each spawned enemy carries a canonical enemy type id plus gameplay tags.
- Surface dungeon entrance tiles are excluded from ordinary enemy occupancy and remain enemy-free landmarks even after earthshake opens them.
- When a tile spawns multiple hostile enemies, that pack uses one shared enemy type for the whole hex instead of mixing different hostile types together.
- Enemies roll a deterministic rarity from `Common`, `Uncommon`, `Rare`, `Epic`, and `Legendary` through the shared cascading rarity-event mechanism, with dungeon spawns floored above ordinary field threats and world bosses forced to `Legendary`.
- Rarer enemies scale their combat stats and XP upward beyond the terrain baseline instead of relying only on a binary elite flag.
- Treasure goblin is a canonical legendary enemy type that can replace only the explicit unresolved ordinary single-enemy hostile overworld spawn path at a deterministic `0.5%` chance.
- Treasure goblins use ordinary legendary attack and defense scaling, but their max HP is multiplied by `20`.
- Locked chests deterministically conceal a mimic on a `10%` per-chest replacement roll derived from world seed and hex coordinate.
- Mimics present as ordinary locked chests until revealed, always resolve as legendary enemies, double the ordinary attack baseline for their tier, and reuse treasure-goblin item-drop multipliers through legacy-safe loot taxonomy helpers without the treasure-goblin gold multiplier.
- Enemy base stats scale from `150 / 50 / 35` at level `1` to `5000 / 1600 / 1100` at level `100`.
- Enemy levels can exceed `100`, and each level above `100` adds `10%` of the level-`100` base max HP, attack, and defense anchors.
- Faction NPCs use non-hostile territory-specific enemy identities so they can participate in the same world systems without behaving like ordinary hostiles.
- Enemy classification such as animal, elite, dungeon, and world-boss behavior resolves from canonical enemy ids and tags instead of display-name checks.
- Blood moon checks occur during the rise window at night.
- Blood moon, harvest moon, and earthshake mutate only the surface world. When the player is inside a dungeon, those systems resolve their center from the active run's stored surface entrance context instead of spawning inside the dungeon world.
- Surface-only world events resolve their tile and enemy writes through the shared surface-world alias helper instead of rebuilding ad hoc root-state shims in each event flow.
- When active, blood moon enemies spawn in clusters around the current surface event center except on blocked tiles.
- Blood moon scales enemy max HP, attack, and defense to 110% of their stored base values while preserving each enemy's current HP ratio through the transition.
- Blood moon increases combat danger and improves loot outcomes, while higher-rarity enemies also improve ordinary gold, consumable, and recipe drop quality.
- Harvest moon is an alternate night event.
- It spawns gathering structures around the current surface event center on eligible empty passable tiles.
- Harvest moon resource weighting favors herb patches, which appear three times as often as each individual tree or ore-node option in that event pool.
- Spawned resources remain part of the regular gathering loop after appearing.
- Earthshake is a day-cycle event that can open a nearby permanent dungeon entrance.
- Dungeon opening searches for a valid passable empty surface tile close to the current surface event center.
- Forced earthshake triggering is supported for admin-style or debug flows already wired in state logic.

## Main Implementation Areas

- `src/game/state.ts`
- `src/game/stateWorldEvents.ts`
- `src/game/stateRewards.ts`
- `src/game/stateRewards/enemyLoot.ts`
- `src/game/combat.ts`
- `src/game/world.ts`
- `src/game/territories.ts`
