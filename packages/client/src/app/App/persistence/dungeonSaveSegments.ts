import type { DungeonWorldState } from '@realmfall/core/game/dungeons/types';
import type { GameState } from '@realmfall/core/game/stateTypes';

export function buildPersistedDungeonWorlds(game: GameState) {
  return Object.fromEntries(
    Object.values(game.worlds)
      .filter((world): world is DungeonWorldState => world.kind === 'dungeon')
      .map((world) => [world.id, world]),
  );
}

export function serializePersistedDungeonWorlds(game: GameState) {
  return Object.fromEntries(
    Object.entries(buildPersistedDungeonWorlds(game)).map(
      ([dungeonId, world]) => [dungeonId, JSON.stringify(world)],
    ),
  );
}

export function serializePersistedDungeonWorldsForIds(
  game: GameState,
  dungeonIds: Iterable<string>,
) {
  const dungeonWorlds = buildPersistedDungeonWorlds(game);

  return Object.fromEntries(
    Array.from(dungeonIds).flatMap((dungeonId) => {
      const world = dungeonWorlds[dungeonId];
      return world === undefined ? [] : [[dungeonId, JSON.stringify(world)]];
    }),
  );
}

export function getDirtyPersistedDungeonIds(
  serializedDungeonWorlds: Record<string, string>,
  lastSavedDungeonSerialized: Record<string, string>,
) {
  return Object.entries(serializedDungeonWorlds)
    .filter(
      ([dungeonId, serializedWorld]) =>
        serializedWorld !== lastSavedDungeonSerialized[dungeonId],
    )
    .map(([dungeonId]) => dungeonId);
}
