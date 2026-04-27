import type { MutableRefObject } from 'react';
import {
  syncFollowCursorTooltipPosition,
  type TooltipPosition,
} from '@realmfall/ui';
import type { GameState, HexCoord } from '../../game/stateTypes';
import { getTooltipState } from './tooltipStore';
import type { TooltipState } from './types';

export const HOVER_ANALYSIS_CACHE_LIMIT = 24;

export interface WorldHoverSnapshot {
  target: HexCoord | null;
  clickable: boolean;
  hoveredMove: HexCoord | null;
  hoveredSafePath: HexCoord[] | null;
  tooltip: TooltipState | null;
  tooltipKey: string | null;
}

export function createEmptyWorldHoverSnapshot(): WorldHoverSnapshot {
  return {
    target: null,
    clickable: false,
    hoveredMove: null,
    hoveredSafePath: null,
    tooltip: null,
    tooltipKey: null,
  };
}

export function applyHoverSnapshot({
  hoverSnapshot,
  hoveredMoveRef,
  hoveredSafePathRef,
  nextTooltipPosition,
  setTooltip,
  tooltipPositionRef,
  worldTooltipKeyRef,
}: {
  hoverSnapshot: WorldHoverSnapshot;
  hoveredMoveRef: MutableRefObject<HexCoord | null>;
  hoveredSafePathRef: MutableRefObject<HexCoord[] | null>;
  nextTooltipPosition: { x: number; y: number };
  setTooltip: (nextTooltip: TooltipState | null) => void;
  tooltipPositionRef: MutableRefObject<TooltipPosition | null>;
  worldTooltipKeyRef: MutableRefObject<string | null>;
}) {
  if (!sameCoord(hoveredMoveRef.current, hoverSnapshot.hoveredMove)) {
    hoveredMoveRef.current = hoverSnapshot.hoveredMove;
  }

  if (!samePath(hoveredSafePathRef.current, hoverSnapshot.hoveredSafePath)) {
    hoveredSafePathRef.current = hoverSnapshot.hoveredSafePath;
  }

  if (hoverSnapshot.tooltip?.followCursor) {
    tooltipPositionRef.current = nextTooltipPosition;
    syncFollowCursorTooltipPosition(nextTooltipPosition);
    const currentTooltip = getTooltipState();

    if (
      worldTooltipKeyRef.current !== hoverSnapshot.tooltipKey ||
      !currentTooltip?.followCursor
    ) {
      worldTooltipKeyRef.current = hoverSnapshot.tooltipKey;
      setTooltip({
        ...hoverSnapshot.tooltip,
        x: nextTooltipPosition.x,
        y: nextTooltipPosition.y,
      });
    }
    return;
  }

  tooltipPositionRef.current = null;
  syncFollowCursorTooltipPosition(null);
  if (worldTooltipKeyRef.current || getTooltipState()?.followCursor) {
    worldTooltipKeyRef.current = null;
    setTooltip(null);
  }
}

export function getHoverAnalysisCacheKey(state: GameState, target: HexCoord) {
  const combatCoord = state.combat
    ? `${state.combat.coord.q},${state.combat.coord.r}`
    : 'none';

  return [
    `turn:${state.turn}`,
    `player:${state.player.coord.q},${state.player.coord.r}`,
    `target:${target.q},${target.r}`,
    `combat:${combatCoord}`,
  ].join('|');
}

export function setCachedHoverSnapshot(
  cache: Map<string, WorldHoverSnapshot>,
  key: string,
  snapshot: WorldHoverSnapshot,
) {
  cache.set(key, snapshot);
  if (cache.size <= HOVER_ANALYSIS_CACHE_LIMIT) {
    return;
  }

  const oldestKey = cache.keys().next().value;
  if (oldestKey) {
    cache.delete(oldestKey);
  }
}

export function sameCoord(left: HexCoord | null, right: HexCoord | null) {
  return left?.q === right?.q && left?.r === right?.r;
}

function samePath(left: HexCoord[] | null, right: HexCoord[] | null) {
  if (left == null || right == null) {
    return left === right;
  }

  if (left.length !== right.length) {
    return false;
  }

  return left.every(
    (coord, index) =>
      coord.q === right[index]?.q && coord.r === right[index]?.r,
  );
}
