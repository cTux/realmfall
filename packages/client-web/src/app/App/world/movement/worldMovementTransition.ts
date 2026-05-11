import { WORLD_MOVE_VISUAL_DURATION_MS } from '@realmfall/core/game/config';
import { hexDistance, hexKey, type HexCoord } from '@realmfall/core/game/hex';
import { tileToPoint } from '../../../../ui/world/renderSceneMath';
import type { VisibleWorldTile } from '../../../../ui/world/visibleWorldTiles';

export interface WorldMovementTransition {
  displayTiles: VisibleWorldTile[];
  durationMs: number;
  fromCoord: HexCoord;
  incomingTiles: VisibleWorldTile[];
  outgoingTiles: VisibleWorldTile[];
  playerOffsetAtStart?: {
    x: number;
    y: number;
  };
  startedAtMs: number;
  toCoord: HexCoord;
}

export interface WorldMovementTransitionRenderState extends WorldMovementTransition {
  nowMs: number;
}

export function createWorldMovementTransition({
  durationMs = WORLD_MOVE_VISUAL_DURATION_MS,
  fromCoord,
  nextVisibleTiles,
  previousVisibleTiles,
  playerOffsetAtStart,
  startedAtMs,
  toCoord,
}: {
  durationMs?: number;
  fromCoord: HexCoord;
  nextVisibleTiles: VisibleWorldTile[];
  previousVisibleTiles: VisibleWorldTile[];
  playerOffsetAtStart?: {
    x: number;
    y: number;
  };
  startedAtMs: number;
  toCoord: HexCoord;
}) {
  if (hexDistance(fromCoord, toCoord) !== 1) {
    return null;
  }

  const nextVisibleTileKeys = new Set(
    nextVisibleTiles.map((tile) => hexKey(tile.coord)),
  );
  const nextVisibleTilesByKey = new Map(
    nextVisibleTiles.map((tile) => [hexKey(tile.coord), tile] as const),
  );
  const previousVisibleTileKeys = new Set(
    previousVisibleTiles.map((tile) => hexKey(tile.coord)),
  );
  const incomingTiles = nextVisibleTiles.filter(
    (tile) => !previousVisibleTileKeys.has(hexKey(tile.coord)),
  );
  const outgoingTiles = previousVisibleTiles.filter(
    (tile) => !nextVisibleTileKeys.has(hexKey(tile.coord)),
  );

  return {
    displayTiles: [
      ...previousVisibleTiles.map(
        (tile) => nextVisibleTilesByKey.get(hexKey(tile.coord)) ?? tile,
      ),
      ...incomingTiles,
    ],
    durationMs,
    fromCoord,
    incomingTiles,
    outgoingTiles,
    playerOffsetAtStart,
    startedAtMs,
    toCoord,
  } satisfies WorldMovementTransition;
}

export function getWorldMovementTransitionRenderState(
  transition: WorldMovementTransition | null,
  nowMs: number,
): WorldMovementTransitionRenderState | null {
  if (!transition || nowMs >= getWorldMovementTransitionEndAtMs(transition)) {
    return null;
  }

  return {
    ...transition,
    nowMs,
  };
}

export function getWorldMovementTransitionRenderToken({
  transition,
  nowMs,
  worldRenderFrameMs,
}: {
  transition: WorldMovementTransition | null;
  nowMs: number;
  worldRenderFrameMs: number;
}) {
  if (!transition) {
    return -1;
  }

  return Math.max(
    -1,
    Math.ceil(
      (getWorldMovementTransitionEndAtMs(transition) - nowMs) /
        worldRenderFrameMs,
    ),
  );
}

export function getWorldMovementTransitionSceneCenter({
  hexSize,
  nowMs,
  screen,
  transition,
}: {
  hexSize: number;
  nowMs: number;
  screen: { width: number; height: number };
  transition: WorldMovementTransition | null;
}) {
  const center = {
    x: screen.width / 2,
    y: screen.height / 2,
  };
  const offset = getWorldMovementTransitionOffsetPoint({
    hexSize,
    nowMs,
    transition,
  });

  return {
    x: center.x + offset.x,
    y: center.y + offset.y,
  };
}

function getWorldMovementTransitionEndAtMs(
  transition: WorldMovementTransition,
) {
  return transition.startedAtMs + transition.durationMs;
}

function getWorldMovementTransitionOffsetPoint({
  hexSize,
  nowMs,
  transition,
}: {
  hexSize: number;
  nowMs: number;
  transition: WorldMovementTransition | null;
}) {
  const progress = getWorldMovementTransitionProgress(transition, nowMs);
  if (progress === null) {
    return { x: 0, y: 0 };
  }

  if (!transition) {
    return { x: 0, y: 0 };
  }

  const activeTransition = transition;
  const remainingProgress = 1 - progress;

  return tileToPoint(
    {
      q:
        (activeTransition.toCoord.q - activeTransition.fromCoord.q) *
        remainingProgress,
      r:
        (activeTransition.toCoord.r - activeTransition.fromCoord.r) *
        remainingProgress,
    },
    0,
    0,
    hexSize,
  );
}

function getWorldMovementTransitionProgress(
  transition: WorldMovementTransition | null,
  nowMs: number,
) {
  if (!transition) {
    return null;
  }

  if (nowMs >= getWorldMovementTransitionEndAtMs(transition)) {
    return null;
  }

  return Math.max(
    0,
    Math.min(1, (nowMs - transition.startedAtMs) / transition.durationMs),
  );
}
