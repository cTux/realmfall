import type {
  ResolvedWorldTilePayload,
  ResolveWorldTilesRequest,
  ResolveWorldTilesResponse,
} from '@realmfall/common';
import { enemyIndexFromId, makeEnemy } from './combat';
import { isFactionNpcEnemyId } from './territories';
import { buildTile } from './world';
import { isWorldBossEnemyId } from './worldBoss';

export function resolveWorldTiles(
  request: ResolveWorldTilesRequest,
): ResolveWorldTilesResponse {
  return {
    requestId: request.requestId,
    tiles: request.coords.map((coord) =>
      buildResolvedWorldTilePayload(
        request.seed,
        coord,
        request.bloodMoonActive,
      ),
    ),
  };
}

function buildResolvedWorldTilePayload(
  seed: string,
  coord: ResolveWorldTilesRequest['coords'][number],
  bloodMoonActive: boolean,
): ResolvedWorldTilePayload {
  const tile = buildTile(seed, coord);
  const enemies = tile.enemyIds.map((enemyId) =>
    makeEnemy(
      seed,
      coord,
      tile.terrain,
      enemyIndexFromId(enemyId),
      tile.structure,
      bloodMoonActive,
      {
        enemyId,
        aggressive: !isFactionNpcEnemyId(enemyId),
        name:
          tile.claim?.npc?.enemyId === enemyId
            ? tile.claim.npc.name
            : undefined,
        worldBoss: isWorldBossEnemyId(enemyId),
      },
    ),
  );

  return {
    coord,
    tile,
    enemies,
  };
}
