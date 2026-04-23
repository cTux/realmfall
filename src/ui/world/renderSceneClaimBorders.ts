import type { GameState, HexCoord, Tile } from '../../game/stateTypes';
import { hexKey } from '../../game/hex';
import { buildTile } from '../../game/world';
import type { SceneCache } from './renderSceneCache';
import { takeGraphics } from './renderScenePools';

const HEX_SIDE_VERTEX_INDICES = [
  [0, 1],
  [5, 0],
  [4, 5],
  [3, 4],
  [2, 3],
  [1, 2],
] as const;

export function renderClaimBorder(
  graphicsPool: SceneCache['worldBorderGraphics'],
  state: GameState,
  tile: Tile,
  poly: number[],
  visibleTileMap: Map<string, Tile>,
) {
  const claim = tile.claim;
  if (!claim) return;

  const neighbors = [
    { q: tile.coord.q + 1, r: tile.coord.r },
    { q: tile.coord.q + 1, r: tile.coord.r - 1 },
    { q: tile.coord.q, r: tile.coord.r - 1 },
    { q: tile.coord.q - 1, r: tile.coord.r },
    { q: tile.coord.q - 1, r: tile.coord.r + 1 },
    { q: tile.coord.q, r: tile.coord.r + 1 },
  ];

  neighbors.forEach((neighbor, sideIndex) => {
    const neighborClaim = resolveNeighborClaim(state, visibleTileMap, neighbor);
    if (
      neighborClaim?.ownerId === claim.ownerId &&
      neighborClaim?.ownerType === claim.ownerType
    ) {
      return;
    }

    const [startVertexIndex, endVertexIndex] =
      HEX_SIDE_VERTEX_INDICES[sideIndex];
    const border = takeGraphics(graphicsPool);
    border
      .moveTo(poly[startVertexIndex * 2], poly[startVertexIndex * 2 + 1])
      .lineTo(poly[endVertexIndex * 2], poly[endVertexIndex * 2 + 1])
      .stroke({
        width: claim.ownerType === 'player' ? 4 : 3,
        color: 0xffffff,
        alpha: 0.92,
      });
  });
}

function resolveNeighborClaim(
  state: GameState,
  visibleTileMap: Map<string, Tile>,
  coord: HexCoord,
) {
  const key = hexKey(coord);
  return (
    visibleTileMap.get(key)?.claim ??
    state.tiles[key]?.claim ??
    buildTile(state.seed, coord).claim
  );
}
