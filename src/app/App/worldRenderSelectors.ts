import { getVisibleTiles, type GameState, type Tile } from '../../game/state';

type VisibleTiles = ReturnType<typeof getVisibleTiles>;

export function getReusableVisibleTiles(
  previousVisibleTiles: VisibleTiles,
  game: GameState,
) {
  const nextVisibleTiles = getVisibleTiles(game);

  return canReuseVisibleTiles(previousVisibleTiles, nextVisibleTiles)
    ? previousVisibleTiles
    : nextVisibleTiles;
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
