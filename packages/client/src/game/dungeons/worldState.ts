import { hexDistance, type HexCoord } from '../hex';
import type { GameState, Tile } from '../types';
import {
  SURFACE_WORLD_ID,
  type DungeonWorldState,
  type GameWorldState,
  type SurfaceWorldState,
} from './types';

export { SURFACE_WORLD_ID } from './types';

type WorldRegistryState = Partial<Pick<GameState, 'activeWorldId' | 'worlds'>>;
type ActiveWorldAliasState = Pick<
  GameState,
  'activeWorldId' | 'worlds' | 'tiles' | 'enemies'
>;

export function createSurfaceWorldState(): SurfaceWorldState {
  return {
    id: SURFACE_WORLD_ID,
    kind: 'surface',
    tiles: {},
    enemies: {},
  };
}

export function createDungeonWorldState(
  world: Omit<DungeonWorldState, 'kind'>,
): DungeonWorldState {
  return { ...world, kind: 'dungeon' };
}

export function getActiveWorld(
  state: Pick<GameState, 'activeWorldId' | 'worlds'>,
): GameWorldState;
export function getActiveWorld(
  state: WorldRegistryState,
): GameWorldState | null;
export function getActiveWorld(state: WorldRegistryState) {
  if (!state.worlds) {
    return null;
  }

  if (!state.activeWorldId) {
    return state.worlds[SURFACE_WORLD_ID] ?? null;
  }

  return (
    state.worlds[state.activeWorldId] ?? state.worlds[SURFACE_WORLD_ID] ?? null
  );
}

export function getSurfaceWorld(
  state: Pick<GameState, 'worlds'>,
): GameWorldState;
export function getSurfaceWorld(
  state: Partial<Pick<GameState, 'worlds'>>,
): GameWorldState | null;
export function getSurfaceWorld(state: Partial<Pick<GameState, 'worlds'>>) {
  return state.worlds?.[SURFACE_WORLD_ID] ?? null;
}

export function syncActiveWorldAliases<T extends ActiveWorldAliasState>(
  state: T,
): T {
  const activeWorld = getActiveWorld(state);
  if (!activeWorld) {
    return state;
  }

  state.tiles = activeWorld.tiles;
  state.enemies = activeWorld.enemies;
  return state;
}

export function setActiveWorld<T extends ActiveWorldAliasState>(
  state: T,
  worldId: string,
): T {
  state.activeWorldId = worldId;
  return syncActiveWorldAliases(state);
}

export function getEnemySpawnStructure(
  state: WorldRegistryState,
  tile: Pick<Tile, 'structure'>,
) {
  return getActiveWorld(state)?.kind === 'dungeon' ? 'dungeon' : tile.structure;
}

export function buildDungeonFallbackTile(
  world: DungeonWorldState,
  coord: HexCoord,
): Tile {
  const maxKnownDistance = Math.max(
    0,
    ...Object.values(world.tiles).map((tile) =>
      hexDistance(tile.coord, world.dungeon.entranceCoord),
    ),
  );
  const wallTerrain = {
    'brick-halls': 'dungeon-brick-wall',
    'mud-catacombs': 'dungeon-mud-wall',
    'obsidian-vault': 'dungeon-obsidian-wall',
  }[world.dungeon.themeId] as Tile['terrain'];

  if (
    hexDistance(coord, world.dungeon.entranceCoord) >
    maxKnownDistance + world.dungeon.paddingRadius
  ) {
    return {
      coord,
      terrain: wallTerrain,
      items: [],
      enemyIds: [],
    };
  }

  return {
    coord,
    terrain: wallTerrain,
    items: [],
    enemyIds: [],
  };
}
