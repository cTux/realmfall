import { hexKey, hexesInRange, type HexCoord } from '../../../game/hex';
import type { GameState } from '../../../game/stateTypes';
import {
  createUnknownVisibleWorldTile,
  type VisibleWorldTile,
} from '../../../ui/world/visibleWorldTiles';
import type { WorldTileResolutionOverlayEntry } from './tileResolution/worldTileResolutionCoordinator';

interface BuildVisibleWorldTilesArgs {
  overlay: ReadonlyMap<string, WorldTileResolutionOverlayEntry>;
  playerCoord: HexCoord;
  radius: GameState['radius'];
  resolvedTiles: GameState['tiles'];
}

export function buildVisibleWorldTiles({
  overlay,
  playerCoord,
  radius,
  resolvedTiles,
}: BuildVisibleWorldTilesArgs): VisibleWorldTile[] {
  return hexesInRange(playerCoord, radius).map((coord) => {
    const key = hexKey(coord);
    const resolvedTile = resolvedTiles[key];
    const overlayEntry = overlay.get(key);

    if (resolvedTile) {
      return overlayEntry?.status === 'revealed'
        ? {
            ...resolvedTile,
            requestedAt: overlayEntry.requestedAt,
            resolvedAt: overlayEntry.resolvedAt,
          }
        : resolvedTile;
    }

    return createUnknownVisibleWorldTile(
      coord,
      overlayEntry?.status === 'pending' ? overlayEntry.requestedAt : 0,
    );
  });
}
