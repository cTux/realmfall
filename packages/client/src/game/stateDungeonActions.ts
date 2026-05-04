import { clearConsumableCooldownIfOutOfCombat } from './combatActivity';
import { getActiveWorld, setActiveWorld } from './dungeons/worldState';
import { generateDungeonWorld } from './dungeons/generation/generateDungeonWorld';
import { hexKey, type HexCoord } from './hex';
import { cloneForWorldMutation } from './stateMutationHelpers';
import { buildSurfaceTile } from './world';
import type { GameState } from './types';

export function registerDungeonEntrance(
  state: GameState,
  surfaceCoord: HexCoord,
) {
  const key = hexKey(surfaceCoord);
  const existing = state.dungeonEntrances[key];
  const dungeonId = existing?.dungeonId ?? `dungeon:${state.seed}:${key}`;
  const surfaceWorld = state.worlds[state.surfaceWorldId];
  const surfaceTile =
    surfaceWorld.tiles[key] ?? buildSurfaceTile(state.seed, surfaceCoord);

  state.dungeonEntrances[key] = {
    dungeonId,
    surfaceCoord: { ...surfaceCoord },
  };
  surfaceWorld.tiles[key] = {
    ...surfaceTile,
    coord: { ...surfaceCoord },
    structure: 'dungeon',
    structureHp: undefined,
    structureMaxHp: undefined,
    enemyIds: [],
  };

  return state.dungeonEntrances[key]!;
}

export function activateDungeonWorld(state: GameState): GameState {
  const next = cloneForWorldMutation(state);
  const activeWorld = getActiveWorld(next);
  if (activeWorld?.kind === 'dungeon') {
    return next;
  }

  const surfaceCoord = { ...next.player.coord };
  const currentTile =
    next.tiles[hexKey(surfaceCoord)] ??
    buildSurfaceTile(next.seed, surfaceCoord);
  if (currentTile.structure !== 'dungeon') {
    return next;
  }

  const entrance = registerDungeonEntrance(next, surfaceCoord);
  const existingWorld = next.worlds[entrance.dungeonId];
  const dungeonWorld =
    existingWorld?.kind === 'dungeon'
      ? existingWorld
      : generateDungeonWorld({
          dungeonId: entrance.dungeonId,
          gameRadius: next.radius,
          seed: next.seed,
          surfaceCoord,
        });

  next.worlds[entrance.dungeonId] = dungeonWorld;
  next.activeDungeon = {
    dungeonId: entrance.dungeonId,
    returnCoord: { ...surfaceCoord },
    surfaceCoord: { ...surfaceCoord },
  };
  setActiveWorld(next, entrance.dungeonId);
  next.player.coord = { ...dungeonWorld.dungeon.entranceCoord };
  next.combat = null;
  clearConsumableCooldownIfOutOfCombat(next);
  return next;
}

export function leaveDungeonWorld(state: GameState): GameState {
  const next = cloneForWorldMutation(state);
  const activeWorld = getActiveWorld(next);
  if (!activeWorld || activeWorld.kind !== 'dungeon') {
    return next;
  }

  registerDungeonEntrance(next, activeWorld.dungeon.surfaceEntranceCoord);
  const returnCoord =
    next.activeDungeon?.returnCoord ?? activeWorld.dungeon.surfaceEntranceCoord;

  setActiveWorld(next, next.surfaceWorldId);
  next.activeDungeon = null;
  next.player.coord = { ...returnCoord };
  next.combat = null;
  clearConsumableCooldownIfOutOfCombat(next);
  return next;
}

export function markDungeonEliteDefeated(state: GameState, dungeonId: string) {
  const world = state.worlds[dungeonId];
  if (!world || world.kind !== 'dungeon') {
    return false;
  }

  return !world.enemies[world.dungeon.finalEliteEnemyId];
}

export function markDungeonCleared(state: GameState, dungeonId: string) {
  const world = state.worlds[dungeonId];
  if (!world || world.kind !== 'dungeon') {
    return false;
  }

  world.dungeon.cleared = true;
  Object.keys(world.enemies).forEach((enemyId) => {
    delete world.enemies[enemyId];
  });
  Object.values(world.tiles).forEach((tile) => {
    tile.enemyIds = [];
  });

  const chestKey = hexKey(world.dungeon.finalChestCoord);
  const chestTile = world.tiles[chestKey];
  if (chestTile) {
    chestTile.structure = undefined;
    chestTile.structureHp = undefined;
    chestTile.structureMaxHp = undefined;
    chestTile.items = [];
  }

  const entranceKey = hexKey(world.dungeon.entranceCoord);
  const entranceTile = world.tiles[entranceKey];
  if (entranceTile) {
    entranceTile.structure = 'dungeon';
  }

  registerDungeonEntrance(state, world.dungeon.surfaceEntranceCoord);
  return true;
}
