import { hexKey, type HexCoord } from './hex';
import { enemyIndexFromId, makeEnemy } from './combat';
import { buildTile } from './world';
import { isFactionNpcEnemyId, isPlayerClaim } from './territories';
import { isWorldBossEnemyId } from './worldBoss';
import type { Enemy, GameState, Tile } from './types';

type WorldTileState = Pick<GameState, 'seed' | 'tiles'>;
type EnemyLookupState = WorldTileState &
  Pick<GameState, 'bloodMoonActive' | 'enemies'>;
type CurrentTileState = WorldTileState & {
  player: Pick<GameState['player'], 'coord'>;
};

export function getVisibleTiles(state: GameState) {
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

export function getTileAt(state: WorldTileState, coord: HexCoord) {
  return state.tiles[hexKey(coord)] ?? buildTile(state.seed, coord);
}

export function getCurrentTile(state: CurrentTileState) {
  return getTileAt(state, state.player.coord);
}

export function getPlayerClaimedTiles(state: Pick<GameState, 'tiles'>) {
  return Object.values(state.tiles).filter((tile) => isPlayerClaim(tile.claim));
}

export function getEnemiesAt(state: EnemyLookupState, coord: HexCoord) {
  const tile = getTileAt(state, coord);
  return tile.enemyIds.map((enemyId) => {
    const enemy = state.enemies[enemyId];
    if (enemy) return enemy;

    const hostile = isHostileTileEnemy(state, tile, enemyId);
    const enemyName =
      tile.claim?.npc?.enemyId === enemyId ? tile.claim.npc?.name : undefined;

    return makeEnemy(
      state.seed,
      coord,
      tile.terrain,
      enemyIndexFromId(enemyId),
      tile.structure,
      state.bloodMoonActive,
      {
        enemyId,
        aggressive: hostile,
        name: enemyName,
        worldBoss: isWorldBossEnemyId(enemyId),
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
