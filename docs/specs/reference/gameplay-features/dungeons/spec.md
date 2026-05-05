# Dungeons

## Scope

This spec covers surface dungeon entrances, dungeon-world generation, dungeon enter or leave flow, and dungeon clear or revisit behavior.

## Current Behavior

- Surface dungeon hexes are permanent `dungeon` structure landmarks.
- Surface dungeon entrance tiles never contain enemies, and earthshake openings also clear any enemy occupancy from the new entrance tile.
- Each surface entrance owns one stable dungeon instance id in the form `dungeon:<seed>:<surface-q>,<surface-r>`.
- Entering an entrance loads that entrance's dedicated dungeon world from memory or its dedicated persisted payload, or generates a fresh dungeon when no world exists yet.
- When no persisted or in-memory dungeon world exists for that entrance, generation starts immediately during the enter transition before the world switch completes.
- Each entrance generates or resumes its own dungeon world, and revisiting the same entrance resumes the same dungeon progress until the dungeon is cleared.
- Entering a dungeon raises the app's fullscreen loading overlay immediately after the player triggers `Enter dungeon`.
- Dungeon generation is deterministic from the game seed plus dungeon id.
- Each dungeon world uses its own tile and enemy registry, with the player placed on the dungeon entrance tile at `(0, 0)` when the world activates.
- Dungeon worlds roll one weighted layout family from `rooms-and-corridors`, `branching-spine`, and `dense-maze`.
- Dungeon worlds roll one terrain theme package from `brick-halls`, `mud-catacombs`, and `obsidian-vault`.
- Each theme provides three passable floor variants and one impassable wall terrain, and each generated dungeon guarantees at least `200` passable hexes.
- Dungeon terrain artwork is generated from the same painted hex-terrain source family as the surface world, and the source PNGs keep the same transparent hex footprint as other atlas inputs.
- Dungeon floor and wall hexes use dedicated theme-aware underlay colors so impassable wall tiles read darker and more blocked than passable dungeon floors during play.
- The dungeon entrance tile is safe, and dungeon enemies spawn only inside the dungeon world.
- Each dungeon contains one legendary final guard, plus one closed `dungeon-chest` placed at the far end of the layout.
- Non-guard dungeon enemies patrol around their initial spawn hex on the shared world-movement cadence, show the same outer yellow movement-cooldown arc just outside their MP ring on revealed dungeon tiles, and chase the player when they come within `2` hexes.
- Dungeon enemy chase movement follows the shortest passable path toward the player instead of relying on greedy straight-line stepping, while patrol movement remains spawn-leashed.
- When a roaming dungeon enemy's chase path reaches the player, the enemy starts combat immediately through the same engagement model used by hostile world clicks instead of waiting for a separate start action.
- Dungeon enemy patrol movement is leashed to the spawn area, while the final guard remains stationary.
- The final chest does nothing until the final elite is defeated.
- Opening the final chest grants one dungeon-scaled world-generated item, marks the dungeon cleared, removes every remaining dungeon enemy, and retires the chest tile.
- Cleared dungeons remain accessible and persistent. Re-entering a cleared entrance resumes the same retired empty dungeon instead of generating a new run.
- Inside the dungeon, the entrance tile is the only tile that exposes `Leave dungeon`.
- While the player is inside a dungeon, the offscreen landmark pointer replaces `Home` with `Exit dungeon` and targets the dungeon entrance tile.
- Dungeon atmosphere swaps overworld weather clouds for drifting bats and omits the sun and moon layers.
- Leaving a dungeon returns the player to the same surface entrance coordinate that owns that dungeon instance.
- Home-scroll use and death recovery both exit the player back to the surface-world flow, clear the active dungeon run pointer, and preserve the dungeon world's progress for later re-entry.

## Main Implementation Areas

- `src/game/stateDungeonActions.ts`
- `src/game/stateDungeonChest.ts`
- `src/game/stateDungeonWorldClock.ts`
- `src/game/stateSurvival.ts`
- `src/game/dungeons/generation`
- `src/game/dungeons/worldState.ts`
- `src/app/App/hooks/useDungeonTransitionController.ts`
- `src/app/App/tests/App.dungeonFlow.test.tsx`
- `src/ui/world/renderScenePlayerBars.ts`
