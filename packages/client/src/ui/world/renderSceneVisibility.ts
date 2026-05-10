import { hexDistance, hexKey, type HexCoord } from '@realmfall/core/game/hex';
import {
  isUnknownVisibleWorldTile,
  type VisibleWorldTile,
} from './visibleWorldTiles';

export interface MovementTransitionRevealState {
  fromCoord: HexCoord;
  outgoingTileKeys: Set<string>;
  progress: number;
}

export function getMovementTransitionRevealState(
  movementTransition:
    | {
        durationMs: number;
        fromCoord: HexCoord;
        nowMs: number;
        outgoingTiles: VisibleWorldTile[];
        startedAtMs: number;
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
    progress: getMovementTransitionRevealProgress(movementTransition),
  } satisfies MovementTransitionRevealState;
}

export function getVisibleTileRevealState({
  movementTransitionState,
  playerCoord,
  revealRadius,
  tile,
}: {
  movementTransitionState: MovementTransitionRevealState | null;
  playerCoord: HexCoord;
  revealRadius: number;
  tile: VisibleWorldTile;
}) {
  const isOutgoing =
    movementTransitionState?.outgoingTileKeys.has(hexKey(tile.coord)) ?? false;
  const previousDistance = hexDistance(
    movementTransitionState?.fromCoord ?? playerCoord,
    tile.coord,
  );
  const distance = hexDistance(playerCoord, tile.coord);
  const wasRevealed = previousDistance <= revealRadius;
  const revealed = distance <= revealRadius;

  return {
    distance,
    isOutgoing,
    resolved: !isUnknownVisibleWorldTile(tile),
    revealed,
    visualRevealAlpha: getVisualRevealAlpha(
      movementTransitionState,
      wasRevealed,
      revealed,
    ),
  };
}

function getMovementTransitionRevealProgress(movementTransition: {
  durationMs: number;
  nowMs: number;
  startedAtMs: number;
}) {
  if (movementTransition.durationMs <= 0) {
    return 1;
  }

  return Math.max(
    0,
    Math.min(
      1,
      (movementTransition.nowMs - movementTransition.startedAtMs) /
        movementTransition.durationMs,
    ),
  );
}

function getVisualRevealAlpha(
  movementTransitionState: MovementTransitionRevealState | null,
  wasRevealed: boolean,
  revealed: boolean,
) {
  if (!movementTransitionState || wasRevealed === revealed) {
    return revealed ? 1 : 0;
  }

  return wasRevealed
    ? 1 - movementTransitionState.progress
    : movementTransitionState.progress;
}
