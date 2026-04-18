import {
  getVisibleTiles,
  type Tile,
  type VisibleTilesState,
} from '../../../game/state';
import { hexKey } from '../../../game/hex';

type VisibleTiles = ReturnType<typeof getVisibleTiles>;
type VisibleTilesMetadata = {
  playerCoordKey: string;
  radius: number;
  seed: string;
};

const visibleTilesMetadata = new WeakMap<VisibleTiles, VisibleTilesMetadata>();

export function reuseVisibleTilesIfUnchanged(
  previousVisibleTiles: VisibleTiles,
  visibleTilesState: VisibleTilesState,
) {
  if (
    canReuseVisibleTilesWithoutRecomputing(
      previousVisibleTiles,
      visibleTilesState,
    )
  ) {
    return previousVisibleTiles;
  }

  const nextVisibleTiles = getVisibleTiles(visibleTilesState);
  visibleTilesMetadata.set(nextVisibleTiles, {
    playerCoordKey: hexKey(visibleTilesState.player.coord),
    radius: visibleTilesState.radius,
    seed: visibleTilesState.seed,
  });

  return canReuseVisibleTiles(previousVisibleTiles, nextVisibleTiles)
    ? previousVisibleTiles
    : nextVisibleTiles;
}

function canReuseVisibleTilesWithoutRecomputing(
  previousVisibleTiles: VisibleTiles,
  visibleTilesState: VisibleTilesState,
) {
  if (previousVisibleTiles.length === 0) {
    return false;
  }

  const previousMetadata = visibleTilesMetadata.get(previousVisibleTiles);
  if (
    !previousMetadata ||
    previousMetadata.playerCoordKey !== hexKey(visibleTilesState.player.coord) ||
    previousMetadata.radius !== visibleTilesState.radius ||
    previousMetadata.seed !== visibleTilesState.seed
  ) {
    return false;
  }

  return previousVisibleTiles.every(
    (tile) =>
      getVisibleTileRenderKey(tile) ===
      getVisibleTileRenderKey(
        visibleTilesState.tiles[hexKey(tile.coord)] ?? tile,
      ),
  );
}

function canReuseVisibleTiles(
  previousVisibleTiles: VisibleTiles,
  nextVisibleTiles: VisibleTiles,
) {
  return (
    previousVisibleTiles.length === nextVisibleTiles.length &&
    previousVisibleTiles.every(
      (tile, index) =>
        getVisibleTileRenderKey(tile) ===
        getVisibleTileRenderKey(nextVisibleTiles[index]),
    )
  );
}

function getVisibleTileRenderKey(tile: Tile | undefined) {
  return (
    tile &&
    [
      `${tile.coord.q},${tile.coord.r}`,
      tile.terrain,
      tile.structure ?? 'none',
      tile.items.length,
      tile.enemyIds.join(','),
      tile.claim
        ? `${tile.claim.ownerType}:${tile.claim.ownerId}:${tile.claim.npc?.enemyId ?? 'none'}`
        : 'claim:none',
    ].join('|')
  );
}
