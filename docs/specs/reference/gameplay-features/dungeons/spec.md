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
- The dungeon entrance tile is safe, and dungeon enemies spawn only inside the dungeon world.
- Each dungeon contains a final elite enemy, plus one closed `dungeon-chest` placed at the far end of the layout.
- The final chest does nothing until the final elite is defeated.
- Opening the final chest grants one dungeon-scaled world-generated item, marks the dungeon cleared, removes every remaining dungeon enemy, and retires the chest tile.
- Cleared dungeons remain accessible and persistent. Re-entering a cleared entrance resumes the same retired empty dungeon instead of generating a new run.
- Inside the dungeon, the entrance tile is the only tile that exposes `Leave dungeon`.
- Leaving a dungeon returns the player to the same surface entrance coordinate that owns that dungeon instance.
- Home-scroll use and death recovery both exit the player back to the surface-world flow, clear the active dungeon run pointer, and preserve the dungeon world's progress for later re-entry.

## Main Implementation Areas

- `src/game/stateDungeonActions.ts`
- `src/game/stateDungeonChest.ts`
- `src/game/stateSurvival.ts`
- `src/game/dungeons/generation`
- `src/game/dungeons/worldState.ts`
- `src/app/App/hooks/useDungeonTransitionController.ts`
- `src/app/App/tests/App.dungeonFlow.test.tsx`
