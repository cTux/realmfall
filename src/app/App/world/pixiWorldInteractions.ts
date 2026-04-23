import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { Application, Container } from 'pixi.js';
import type { HexCoord } from '../../../game/hex';
import type { GameState } from '../../../game/stateTypes';
import type { TooltipPosition } from '../../../ui/components/GameTooltip';
import { type WorldMapCameraState } from '../../../ui/world/worldMapCamera';
import type { TooltipState } from '../types';
import { type WorldHoverSnapshot } from '../usePixiWorldHover';
import { createWorldClickHandler } from './pixiWorldClickNavigation';
import { createWorldHoverInteractions } from './pixiWorldHoverInteractions';
import { type WorldMapDragState } from './pixiWorldInteractionShared';
import {
  beginWorldMapDrag,
  cancelWorldMapDrag,
  finishWorldMapDrag,
  handleWorldMapDragMove,
} from './pixiWorldMapDrag';
import { createWorldMapWheelHandler } from './pixiWorldMapZoom';
import type { WorldScenePointMapper } from './pixiWorldCamera';

export type { WorldMapDragState } from './pixiWorldInteractionShared';

type EnemyWorldTooltip =
  typeof import('../../../ui/world/worldTooltips').enemyWorldTooltip;
type StructureWorldTooltip =
  typeof import('../../../ui/world/worldTooltips').structureWorldTooltip;
type PointerPosition = {
  clientX: number;
  clientY: number;
  sceneX: number;
  sceneY: number;
};

const toCanvasScenePosition = (event: {
  clientX: number;
  clientY: number;
  offsetX?: number;
  offsetY?: number;
}): PointerPosition => ({
  clientX: event.clientX,
  clientY: event.clientY,
  sceneX: typeof event.offsetX === 'number' ? event.offsetX : event.clientX,
  sceneY: typeof event.offsetY === 'number' ? event.offsetY : event.clientY,
});

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
    sceneX: number;
    sceneY: number;
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
  const handlePointerClick = createWorldClickHandler({
    app,
    gameRef,
    getScenePoint,
    pausedRef,
    playerCoordRef,
    renderInvalidationRef,
    selectedRef,
    setGame,
    worldTimeMsRef,
  });

  const hoverInteractions = createWorldHoverInteractions({
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
  });

  const onWheel = createWorldMapWheelHandler({
    app,
    getWorldMapContainer,
    scheduleCameraSave,
    worldMapCameraRef,
  });

  const onPointerDown = (event: PointerEvent) => {
    beginWorldMapDrag({
      canvas,
      dragStateRef,
      event,
      worldMapCameraRef,
    });
  };

  const onPointerUp = (event: PointerEvent) => {
    const pointerPosition = toCanvasScenePosition(event);
    const dragState = finishWorldMapDrag({
      canvas,
      dragStateRef,
      event,
    });
    if (!dragState) {
      return;
    }
    if (dragState.dragging) {
      canvas.style.cursor = 'grab';
      return;
    }

    handlePointerClick(pointerPosition.sceneX, pointerPosition.sceneY);
  };

  const onPointerCancel = (event: PointerEvent) => {
    cancelWorldMapDrag({
      canvas,
      dragStateRef,
      event,
    });
  };

  const onPointerMove = (event: PointerEvent) => {
    const pointerPosition = toCanvasScenePosition(event);
    if (
      handleWorldMapDragMove({
        app,
        canvas,
        clearHoverState: hoverInteractions.clearHoverState,
        dragStateRef,
        event,
        getWorldMapContainer,
        scheduleCameraSave,
        worldMapCameraRef,
      })
    ) {
      return;
    }

    hoverInteractions.queuePointerMove(pointerPosition);
  };

  const onPointerLeave = () => {
    dragStateRef.current = null;
    hoverInteractions.clearHoverState();
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
    hoverInteractions.dispose();
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
