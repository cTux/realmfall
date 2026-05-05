import { hexKey, type HexCoord } from './hex';
import { enemyIndexFromId, makeEnemy } from './combat';
import { getEnemySpawnStructure } from './dungeons/worldState';
import { isFactionNpcEnemyId, isPlayerClaim } from './territories';
import { isWorldBossEnemyId } from './worldBoss';
import { buildTileForState } from './world';
import type { Enemy, GameState, Tile } from './types';

type WorldTileState = Pick<GameState, 'seed' | 'tiles'> &
  Partial<Pick<GameState, 'activeWorldId' | 'worlds'>>;
type ResolvedWorldTileState = Pick<GameState, 'tiles'>;
export type VisibleTilesState = WorldTileState &
  Pick<GameState, 'radius'> & {
    player: Pick<GameState['player'], 'coord'>;
  };
type EnemyLookupState = WorldTileState &
  Pick<GameState, 'bloodMoonActive' | 'enemies'>;
type CurrentTileState = WorldTileState & {
  player: Pick<GameState['player'], 'coord'>;
};
type ResolvedCurrentTileState = ResolvedWorldTileState & {
  player: Pick<GameState['player'], 'coord'>;
};
const playerClaimedTilesCache = new WeakMap<GameState['tiles'], Tile[]>();

export function getVisibleTiles(state: VisibleTilesState) {
  const tiles = [];
  const { q: pq, r: pr } = state.player.coord;

  for (let dq = -state.radius; dq <= state.radius; dq += 1) {
    for (let dr = -state.radius; dr <= state.radius; dr += 1) {
      if (Math.abs(dq + dr) > state.radius) continue;
      tiles.push(getTileAt(state, { q: pq + dq, r: pr + dr }));
    }
  }

  return tiles;
}

export function getResolvedTileAt(
  state: ResolvedWorldTileState,
  coord: HexCoord,
) {
  return state.tiles[hexKey(coord)] ?? null;
}

export function getTileAt(state: WorldTileState, coord: HexCoord) {
  return getResolvedTileAt(state, coord) ?? buildTileForState(state, coord);
}

export function getCurrentTile(state: CurrentTileState) {
  return getTileAt(state, state.player.coord);
}

export function getResolvedCurrentTile(state: ResolvedCurrentTileState) {
  return getResolvedTileAt(state, state.player.coord);
}

export function getPlayerClaimedTiles(state: Pick<GameState, 'tiles'>) {
  const cachedClaimedTiles = playerClaimedTilesCache.get(state.tiles);
  if (cachedClaimedTiles) {
    return cachedClaimedTiles;
  }

  const claimedTiles = Object.values(state.tiles).filter((tile) =>
    isPlayerClaim(tile.claim),
  );
  playerClaimedTilesCache.set(state.tiles, claimedTiles);
  return claimedTiles;
}

export function getEnemiesAt(state: EnemyLookupState, coord: HexCoord) {
  const resolvedTile = getResolvedTileAt(state, coord);
  const tile = resolvedTile ?? buildTileForState(state, coord);
  return tile.enemyIds.map((enemyId) => {
    const enemy = state.enemies[enemyId];
    if (enemy) return enemy;

    const hostile = isHostileTileEnemy(state, tile, enemyId);
    const enemyName =
      tile.claim?.npc?.enemyId === enemyId ? tile.claim.npc?.name : undefined;
    const worldBoss = isWorldBossEnemyId(enemyId);

    return makeEnemy(
      state.seed,
      coord,
      tile.terrain,
      enemyIndexFromId(enemyId),
      getEnemySpawnStructure(state, tile),
      state.bloodMoonActive,
      {
        enemyId,
        aggressive: hostile,
        allowTreasureGoblinOverride:
          resolvedTile === null &&
          hostile &&
          tile.structure === undefined &&
          tile.enemyIds.length === 1 &&
          tile.claim?.npc?.enemyId !== enemyId &&
          !worldBoss,
        name: enemyName,
        worldBoss,
      },
    );
  });
}

export function getEnemyAt(state: EnemyLookupState, coord: HexCoord) {
  return getEnemiesAt(state, coord)[0];
}

export function getHostileEnemyIds(state: EnemyLookupState, coord: HexCoord) {
  const tile = getTileAt(state, coord);
  return tile.enemyIds.filter((enemyId) =>
    isHostileTileEnemy(state, tile, enemyId),
  );
}

function isHostileTileEnemy(
  state: Pick<GameState, 'enemies'>,
  tile: Tile,
  enemyId: string,
) {
  if (tile.claim?.npc?.enemyId === enemyId) return false;
  if (isFactionNpcEnemyId(enemyId)) return false;
  const enemy: Enemy | undefined = state.enemies[enemyId];
  return enemy?.aggressive !== false;
}
