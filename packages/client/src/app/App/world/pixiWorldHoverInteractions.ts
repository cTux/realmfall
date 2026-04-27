import type { MutableRefObject } from 'react';
import type { Application } from 'pixi.js';
import {
  syncFollowCursorTooltipPosition,
  type TooltipPosition,
} from '@realmfall/ui';
import { hexAtPoint, hexDistance, type HexCoord } from '../../../game/hex';
import { isPassable } from '../../../game/shared';
import { getSafePathToTile } from '../../../game/statePathfinding';
import { getEnemiesAt, getTileAt } from '../../../game/stateWorldQueries';
import type { GameState } from '../../../game/stateTypes';
import { getWorldHexSize } from '../../../ui/world/renderSceneMath';
import { WORLD_REVEAL_RADIUS } from '../../constants';
import type { TooltipState } from '../types';
import {
  applyHoverSnapshot,
  createEmptyWorldHoverSnapshot,
  getHoverAnalysisCacheKey,
  sameCoord,
  setCachedHoverSnapshot,
  type WorldHoverSnapshot,
} from '../usePixiWorldHover';
import type { WorldScenePointMapper } from './pixiWorldCamera';

type EnemyWorldTooltip =
  typeof import('../../../ui/world/worldTooltips').enemyWorldTooltip;
type StructureWorldTooltip =
  typeof import('../../../ui/world/worldTooltips').structureWorldTooltip;

export function createWorldHoverInteractions({
  app,
  canvas,
  enemyWorldTooltip,
  gameRef,
  getScenePoint,
  hoverAnalysisCacheRef,
  hoverFrameRef,
  hoverPointerRef,
  hoverSnapshotRef,
  hoveredMoveRef,
  hoveredSafePathRef,
  playerCoordRef,
  renderInvalidationRef,
  setTooltip,
  structureWorldTooltip,
  tooltipPositionRef,
  worldTooltipKeyRef,
}: {
  app: Application;
  canvas: HTMLCanvasElement;
  enemyWorldTooltip: EnemyWorldTooltip;
  gameRef: MutableRefObject<GameState>;
  getScenePoint: WorldScenePointMapper;
  hoverAnalysisCacheRef: MutableRefObject<Map<string, WorldHoverSnapshot>>;
  hoverFrameRef: MutableRefObject<number | null>;
  hoverPointerRef: MutableRefObject<{
    clientX: number;
    clientY: number;
  } | null>;
  hoverSnapshotRef: MutableRefObject<WorldHoverSnapshot>;
  hoveredMoveRef: MutableRefObject<HexCoord | null>;
  hoveredSafePathRef: MutableRefObject<HexCoord[] | null>;
  playerCoordRef: MutableRefObject<HexCoord>;
  renderInvalidationRef: MutableRefObject<number>;
  setTooltip: (nextTooltip: TooltipState | null) => void;
  structureWorldTooltip: StructureWorldTooltip;
  tooltipPositionRef: MutableRefObject<TooltipPosition | null>;
  worldTooltipKeyRef: MutableRefObject<string | null>;
}) {
  const commitHoverSnapshot = ({
    hoverCacheKey,
    nextHoverSnapshot,
    nextTooltipPosition,
  }: {
    hoverCacheKey: string;
    nextHoverSnapshot: WorldHoverSnapshot;
    nextTooltipPosition: TooltipPosition;
  }) => {
    canvas.style.cursor = nextHoverSnapshot.clickable ? 'pointer' : 'default';
    hoverSnapshotRef.current = nextHoverSnapshot;
    renderInvalidationRef.current += 1;
    setCachedHoverSnapshot(
      hoverAnalysisCacheRef.current,
      hoverCacheKey,
      nextHoverSnapshot,
    );
    applyHoverSnapshot({
      hoverSnapshot: nextHoverSnapshot,
      hoveredMoveRef,
      hoveredSafePathRef,
      nextTooltipPosition,
      setTooltip,
      tooltipPositionRef,
      worldTooltipKeyRef,
    });
  };

  const clearHoverState = () => {
    hoverPointerRef.current = null;
    if (hoverFrameRef.current !== null) {
      window.cancelAnimationFrame(hoverFrameRef.current);
      hoverFrameRef.current = null;
    }
    canvas.style.cursor = 'default';
    tooltipPositionRef.current = null;
    syncFollowCursorTooltipPosition(null);
    worldTooltipKeyRef.current = null;
    hoverSnapshotRef.current = createEmptyWorldHoverSnapshot();
    if (hoveredMoveRef.current) {
      hoveredMoveRef.current = null;
    }
    if (hoveredSafePathRef.current) {
      hoveredSafePathRef.current = null;
    }
    renderInvalidationRef.current += 1;
    setTooltip(null);
  };

  const processPointerMove = (clientX: number, clientY: number) => {
    const scenePoint = getScenePoint(clientX, clientY);
    const hexSize = getWorldHexSize(app.screen, gameRef.current.radius);
    const hoveredOffset = hexAtPoint(scenePoint.x, scenePoint.y, {
      centerX: app.screen.width / 2,
      centerY: app.screen.height / 2,
      size: hexSize,
    });
    const target = {
      q: playerCoordRef.current.q + hoveredOffset.q,
      r: playerCoordRef.current.r + hoveredOffset.r,
    };
    const nextTooltipPosition = {
      x: clientX + 16,
      y: clientY + 16,
    };
    const hoverSnapshot = hoverSnapshotRef.current;

    if (sameCoord(hoverSnapshot.target, target)) {
      canvas.style.cursor = hoverSnapshot.clickable ? 'pointer' : 'default';
      applyHoverSnapshot({
        hoverSnapshot,
        hoveredMoveRef,
        hoveredSafePathRef,
        nextTooltipPosition,
        setTooltip,
        tooltipPositionRef,
        worldTooltipKeyRef,
      });
      return;
    }

    const current = gameRef.current;
    const distance = hexDistance(playerCoordRef.current, target);
    const withinVisibleMap = distance <= WORLD_REVEAL_RADIUS;
    const hoverCacheKey = getHoverAnalysisCacheKey(current, target);
    const cachedHoverSnapshot =
      hoverAnalysisCacheRef.current.get(hoverCacheKey);
    if (cachedHoverSnapshot) {
      canvas.style.cursor = cachedHoverSnapshot.clickable
        ? 'pointer'
        : 'default';
      hoverSnapshotRef.current = cachedHoverSnapshot;
      applyHoverSnapshot({
        hoverSnapshot: cachedHoverSnapshot,
        hoveredMoveRef,
        hoveredSafePathRef,
        nextTooltipPosition,
        setTooltip,
        tooltipPositionRef,
        worldTooltipKeyRef,
      });
      return;
    }

    let tile: ReturnType<typeof getTileAt> | null = null;
    let safePath: HexCoord[] | null = null;
    let actionable = false;

    if (distance === 1) {
      tile = getTileAt(current, target);
      actionable = isPassable(tile.terrain);
    } else if (distance > 1 && withinVisibleMap) {
      safePath = getSafePathToTile(current, target);
      actionable = Boolean(safePath);
      if (actionable) {
        tile = getTileAt(current, target);
      }
    }

    let nextHoveredPath: HexCoord[] | null = null;
    let nextTooltip: TooltipState | null = null;
    let nextTooltipKey: string | null = null;

    if (actionable && tile) {
      nextHoveredPath = safePath && safePath.length > 1 ? safePath : null;

      const enemies = getEnemiesAt(current, target);
      const enemyInfo = enemyWorldTooltip(enemies, tile.structure);

      if (enemyInfo) {
        nextTooltipKey = `enemy:${target.q},${target.r}:${tile.structure ?? 'none'}`;
        nextTooltip = {
          title: enemyInfo.title,
          lines: enemyInfo.lines,
          contentKey: nextTooltipKey,
          x: nextTooltipPosition.x,
          y: nextTooltipPosition.y,
          borderColor: tile.structure === 'dungeon' ? '#a855f7' : '#ef4444',
          followCursor: true,
        };
      } else {
        const structureInfo = structureWorldTooltip(tile);
        if (!structureInfo) {
          const nextHoverSnapshot = {
            target,
            clickable: actionable,
            hoveredMove: actionable ? target : null,
            hoveredSafePath: nextHoveredPath,
            tooltip: null,
            tooltipKey: null,
          };
          commitHoverSnapshot({
            hoverCacheKey,
            nextHoverSnapshot,
            nextTooltipPosition,
          });
          return;
        }

        nextTooltipKey = `structure:${target.q},${target.r}:${tile.structure ?? 'none'}`;
        nextTooltip = {
          title: structureInfo.title,
          lines: structureInfo.lines,
          contentKey: nextTooltipKey,
          x: nextTooltipPosition.x,
          y: nextTooltipPosition.y,
          borderColor: '#38bdf8',
          followCursor: true,
        };
      }
    }

    const nextHoverSnapshot = {
      target,
      clickable: actionable,
      hoveredMove: actionable ? target : null,
      hoveredSafePath: nextHoveredPath,
      tooltip: nextTooltip,
      tooltipKey: nextTooltipKey,
    };
    commitHoverSnapshot({
      hoverCacheKey,
      nextHoverSnapshot,
      nextTooltipPosition,
    });
  };

  const queuePointerMove = (
    event: Pick<PointerEvent, 'clientX' | 'clientY'>,
  ) => {
    hoverPointerRef.current = {
      clientX: event.clientX,
      clientY: event.clientY,
    };
    if (hoverFrameRef.current !== null) {
      return;
    }

    hoverFrameRef.current = window.requestAnimationFrame(() => {
      hoverFrameRef.current = null;
      const hoverPointer = hoverPointerRef.current;
      if (!hoverPointer) {
        return;
      }

      processPointerMove(hoverPointer.clientX, hoverPointer.clientY);
    });
  };

  const dispose = () => {
    if (hoverFrameRef.current !== null) {
      window.cancelAnimationFrame(hoverFrameRef.current);
      hoverFrameRef.current = null;
    }
  };

  return {
    clearHoverState,
    dispose,
    queuePointerMove,
  };
}
