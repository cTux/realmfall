import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { Application, Container } from 'pixi.js';
import { hexAtPoint, hexDistance, type HexCoord } from '../../../game/hex';
import { isPassable } from '../../../game/shared';
import { moveAlongSafePath, moveToTile } from '../../../game/stateMovement';
import { getSafePathToTile } from '../../../game/statePathfinding';
import { getEnemiesAt, getTileAt } from '../../../game/stateWorldQueries';
import type { GameState } from '../../../game/stateTypes';
import type { TooltipPosition } from '../../../ui/components/GameTooltip';
import { syncFollowCursorTooltipPosition } from '../../../ui/components/GameTooltip/followCursorSync';
import { getWorldHexSize } from '../../../ui/world/renderSceneMath';
import {
  applyWorldMapCameraToContainer,
  zoomWorldMapCameraAtPoint,
  type WorldMapCameraState,
} from '../../../ui/world/worldMapCamera';
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

export interface WorldMapDragState {
  pointerId: number | null;
  startClientX: number;
  startClientY: number;
  startPanX: number;
  startPanY: number;
  dragging: boolean;
}

export function attachPixiWorldInteractions({
  app,
  canvas,
  enemyWorldTooltip,
  structureWorldTooltip,
  gameRef,
  getScenePoint,
  getWorldMapContainer,
  hoverAnalysisCacheRef,
  hoverFrameRef,
  hoverPointerRef,
  hoverSnapshotRef,
  hoveredMoveRef,
  hoveredSafePathRef,
  pausedRef,
  playerCoordRef,
  selectedRef,
  renderInvalidationRef,
  scheduleCameraSave,
  setGame,
  setTooltip,
  tooltipPositionRef,
  worldMapCameraRef,
  worldTimeMsRef,
  worldTooltipKeyRef,
  dragStateRef,
}: {
  app: Application;
  canvas: HTMLCanvasElement;
  enemyWorldTooltip: EnemyWorldTooltip;
  structureWorldTooltip: StructureWorldTooltip;
  gameRef: MutableRefObject<GameState>;
  getScenePoint: WorldScenePointMapper;
  getWorldMapContainer: () => Container;
  hoverAnalysisCacheRef: MutableRefObject<Map<string, WorldHoverSnapshot>>;
  hoverFrameRef: MutableRefObject<number | null>;
  hoverPointerRef: MutableRefObject<{
    clientX: number;
    clientY: number;
  } | null>;
  hoverSnapshotRef: MutableRefObject<WorldHoverSnapshot>;
  hoveredMoveRef: MutableRefObject<HexCoord | null>;
  hoveredSafePathRef: MutableRefObject<HexCoord[] | null>;
  pausedRef: MutableRefObject<boolean>;
  playerCoordRef: MutableRefObject<HexCoord>;
  selectedRef: MutableRefObject<HexCoord>;
  renderInvalidationRef: MutableRefObject<number>;
  scheduleCameraSave: () => void;
  setGame: Dispatch<SetStateAction<GameState>>;
  setTooltip: (nextTooltip: TooltipState | null) => void;
  tooltipPositionRef: MutableRefObject<TooltipPosition | null>;
  worldMapCameraRef: MutableRefObject<WorldMapCameraState>;
  worldTimeMsRef: MutableRefObject<number>;
  worldTooltipKeyRef: MutableRefObject<string | null>;
  dragStateRef: MutableRefObject<WorldMapDragState | null>;
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

  const handlePointerClick = (clientX: number, clientY: number) => {
    if (pausedRef.current) {
      return;
    }

    const scenePoint = getScenePoint(clientX, clientY);
    const hexSize = getWorldHexSize(app.screen, gameRef.current.radius);
    const clickedOffset = hexAtPoint(scenePoint.x, scenePoint.y, {
      centerX: app.screen.width / 2,
      centerY: app.screen.height / 2,
      size: hexSize,
    });
    const target = {
      q: playerCoordRef.current.q + clickedOffset.q,
      r: playerCoordRef.current.r + clickedOffset.r,
    };
    const current = gameRef.current;
    const distance = hexDistance(playerCoordRef.current, target);
    if (distance === 1) {
      const tile = getTileAt(current, target);
      if (!isPassable(tile.terrain)) {
        return;
      }

      selectedRef.current = target;
      renderInvalidationRef.current += 1;
      setGame((currentState) =>
        moveToTile(
          { ...currentState, worldTimeMs: worldTimeMsRef.current },
          target,
        ),
      );
      return;
    }

    if (distance === 0 || distance > WORLD_REVEAL_RADIUS) {
      return;
    }

    const safePath = getSafePathToTile(current, target);
    if (!safePath) {
      return;
    }

    selectedRef.current = target;
    renderInvalidationRef.current += 1;
    setGame((currentState) =>
      moveAlongSafePath(
        { ...currentState, worldTimeMs: worldTimeMsRef.current },
        target,
      ),
    );
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

  const onPointerDown = (event: PointerEvent) => {
    const pointerId =
      typeof event.pointerId === 'number' ? event.pointerId : null;

    dragStateRef.current = {
      pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startPanX: worldMapCameraRef.current.panX,
      startPanY: worldMapCameraRef.current.panY,
      dragging: false,
    };
    if (pointerId !== null) {
      canvas.setPointerCapture?.(pointerId);
    }
  };

  const onWheel = (event: WheelEvent) => {
    const absoluteDeltaX = Math.abs(event.deltaX);
    const absoluteDeltaY = Math.abs(event.deltaY);
    if (absoluteDeltaY === 0 || absoluteDeltaX > absoluteDeltaY) {
      return;
    }

    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const nextCamera = zoomWorldMapCameraAtPoint(
      worldMapCameraRef.current,
      worldMapCameraRef.current.zoom * (event.deltaY < 0 ? 1.1 : 1 / 1.1),
      {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      },
      app.screen,
    );
    if (nextCamera === worldMapCameraRef.current) {
      return;
    }

    worldMapCameraRef.current = nextCamera;
    applyWorldMapCameraToContainer(
      getWorldMapContainer(),
      app.screen,
      nextCamera,
    );
    scheduleCameraSave();
  };

  const onPointerUp = (event: PointerEvent) => {
    const dragState = dragStateRef.current;
    if (!dragState || !matchesActivePointer(dragState.pointerId, event)) {
      return;
    }

    if (dragState.pointerId !== null) {
      canvas.releasePointerCapture?.(dragState.pointerId);
    }
    dragStateRef.current = null;
    if (dragState.dragging) {
      canvas.style.cursor = 'grab';
      return;
    }

    handlePointerClick(event.clientX, event.clientY);
  };

  const onPointerCancel = (event: PointerEvent) => {
    if (
      !dragStateRef.current ||
      !matchesActivePointer(dragStateRef.current.pointerId, event)
    ) {
      return;
    }
    if (dragStateRef.current.pointerId !== null) {
      canvas.releasePointerCapture?.(dragStateRef.current.pointerId);
    }
    dragStateRef.current = null;
    canvas.style.cursor = 'default';
  };

  const onPointerMove = (event: PointerEvent) => {
    const dragState = dragStateRef.current;
    if (dragState && matchesActivePointer(dragState.pointerId, event)) {
      const deltaX = event.clientX - dragState.startClientX;
      const deltaY = event.clientY - dragState.startClientY;
      if (dragState.dragging || Math.hypot(deltaX, deltaY) >= 4) {
        if (!dragState.dragging) {
          dragState.dragging = true;
          clearHoverState();
        }
        const nextCamera = {
          ...worldMapCameraRef.current,
          panX: dragState.startPanX + deltaX,
          panY: dragState.startPanY + deltaY,
        };
        worldMapCameraRef.current = nextCamera;
        applyWorldMapCameraToContainer(
          getWorldMapContainer(),
          app.screen,
          nextCamera,
        );
        canvas.style.cursor = 'grabbing';
        scheduleCameraSave();
      }
      return;
    }

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

  const onPointerLeave = () => {
    dragStateRef.current = null;
    clearHoverState();
  };

  canvas.addEventListener('pointerdown', onPointerDown as EventListener);
  canvas.addEventListener('pointerup', onPointerUp as EventListener);
  canvas.addEventListener('pointercancel', onPointerCancel as EventListener);
  canvas.addEventListener('pointermove', onPointerMove as EventListener);
  canvas.addEventListener('pointerleave', onPointerLeave);
  canvas.addEventListener('wheel', onWheel as EventListener, {
    passive: false,
  });

  return () => {
    if (hoverFrameRef.current !== null) {
      window.cancelAnimationFrame(hoverFrameRef.current);
      hoverFrameRef.current = null;
    }
    canvas.removeEventListener('pointerdown', onPointerDown as EventListener);
    canvas.removeEventListener('pointerup', onPointerUp as EventListener);
    canvas.removeEventListener(
      'pointercancel',
      onPointerCancel as EventListener,
    );
    canvas.removeEventListener('pointermove', onPointerMove as EventListener);
    canvas.removeEventListener('pointerleave', onPointerLeave);
    canvas.removeEventListener('wheel', onWheel as EventListener);
  };
}

function matchesActivePointer(
  activePointerId: number | null,
  event: Pick<PointerEvent, 'pointerId'>,
) {
  return (
    activePointerId === null ||
    typeof event.pointerId !== 'number' ||
    activePointerId === event.pointerId
  );
}
