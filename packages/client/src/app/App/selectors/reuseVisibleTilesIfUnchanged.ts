import { hexKey } from '@realmfall/core/game/hex';
import type {
  UnknownVisibleWorldTile,
  VisibleWorldTile,
} from '../../../ui/world/visibleWorldTiles';

export function reuseVisibleTilesIfUnchanged(
  previousVisibleTiles: VisibleWorldTile[],
  nextVisibleTiles: VisibleWorldTile[],
) {
  return canReuseVisibleTiles(previousVisibleTiles, nextVisibleTiles)
    ? previousVisibleTiles
    : nextVisibleTiles;
}

function canReuseVisibleTiles(
  previousVisibleTiles: VisibleWorldTile[],
  nextVisibleTiles: VisibleWorldTile[],
) {
  return (
    previousVisibleTiles.length === nextVisibleTiles.length &&
    previousVisibleTiles.every(
      (tile, index) =>
        getVisibleWorldTileRenderKey(tile) ===
        getVisibleWorldTileRenderKey(nextVisibleTiles[index]!),
    )
  );
}

function getVisibleWorldTileRenderKey(tile: VisibleWorldTile) {
  if (isUnknownVisibleWorldTile(tile)) {
    return `${hexKey(tile.coord)}|unknown|${tile.requestedAt}`;
  }

  return [
    hexKey(tile.coord),
    tile.terrain,
    tile.structure ?? 'none',
    tile.items.length,
    tile.enemyIds.join(','),
    tile.claim
      ? `${tile.claim.ownerType}:${tile.claim.ownerId}:${tile.claim.npc?.enemyId ?? 'none'}`
      : 'claim:none',
    tile.requestedAt ?? 0,
    tile.resolvedAt ?? 0,
  ].join('|');
}

function isUnknownVisibleWorldTile(
  tile: VisibleWorldTile,
): tile is UnknownVisibleWorldTile {
  return tile.unknown === true;
}
