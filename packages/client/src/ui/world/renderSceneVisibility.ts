import { WORLD_REVEAL_RADIUS } from '../../app/constants';
import { hexDistance, hexKey, type HexCoord } from '../../game/hex';
import {
  isUnknownVisibleWorldTile,
  type VisibleWorldTile,
} from './visibleWorldTiles';

export interface MovementTransitionRevealState {
  fromCoord: HexCoord;
  outgoingTileKeys: Set<string>;
}

export function getMovementTransitionRevealState(
  movementTransition:
    | {
        fromCoord: HexCoord;
        outgoingTiles: VisibleWorldTile[];
      }
    | null
    | undefined,
) {
  if (!movementTransition) {
    return null;
  }

  return {
    fromCoord: movementTransition.fromCoord,
    outgoingTileKeys: new Set(
      movementTransition.outgoingTiles.map((tile) => hexKey(tile.coord)),
    ),
  } satisfies MovementTransitionRevealState;
}

export function getVisibleTileRevealState({
  movementTransitionState,
  playerCoord,
  tile,
}: {
  movementTransitionState: MovementTransitionRevealState | null;
  playerCoord: HexCoord;
  tile: VisibleWorldTile;
}) {
  const isOutgoing =
    movementTransitionState?.outgoingTileKeys.has(hexKey(tile.coord)) ?? false;
  const revealOrigin = isOutgoing
    ? (movementTransitionState?.fromCoord ?? playerCoord)
    : playerCoord;
  const distance = hexDistance(revealOrigin, tile.coord);

  return {
    distance,
    isOutgoing,
    resolved: !isUnknownVisibleWorldTile(tile),
    revealed: distance <= WORLD_REVEAL_RADIUS,
  };
}
