import {
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
import type { Application } from 'pixi.js';
import type { HexCoord, GameState } from '@realmfall/core/game/stateTypes';
import type { TooltipPosition } from '@realmfall/ui-react';
import { type PixiWorldInitGraphicsSettings } from './pixiWorldBootstrap';
import type { VisibleWorldTile } from '../../../ui/world/visibleWorldTiles';
import type { WorldMapCameraState } from '../../../ui/world/worldMapCamera';
import type { WorldMovementTransition } from './movement/worldMovementTransition';
import type { TooltipState } from '../types';
import { createInitialWorldRenderSnapshot } from './worldRenderSnapshot';
import type { WorldRenderSnapshot } from './worldRenderSnapshot';
import type { WorldMapDragState } from './pixiWorldInteractions';
import type { WorldHoverSnapshot } from './worldHoverSnapshot';
import type { WorldHoverAnalysisController } from './pixiWorldHoverInteractions';
import type {
  WorldMovementAutoOpenSuppressionState,
  WorldMovementController,
} from './pixiWorldLifecycleTypes';

interface UsePixiWorldBootstrapLifecycleArgs {
  enabled: boolean;
  appRef: MutableRefObject<Application | null>;
  cameraSaveTimerRef: MutableRefObject<number | null>;
  dragStateRef: MutableRefObject<WorldMapDragState | null>;
  gameRef: MutableRefObject<GameState>;
  hostRef: MutableRefObject<HTMLDivElement | null>;
  hoverAnalysisCacheRef: MutableRefObject<Map<string, WorldHoverSnapshot>>;
  hoverAnalysisControllerRef: MutableRefObject<WorldHoverAnalysisController | null>;
  hoverAnalysisVersionRef: MutableRefObject<number>;
  hoverFrameRef: MutableRefObject<number | null>;
  hoverPointerRef: MutableRefObject<{
    clientX: number;
    clientY: number;
  } | null>;
  hoverSnapshotRef: MutableRefObject<WorldHoverSnapshot>;
  hoveredMoveRef: MutableRefObject<HexCoord | null>;
  hoveredSafePathRef: MutableRefObject<HexCoord[] | null>;
  initGraphicsSettings: PixiWorldInitGraphicsSettings;
  lastRenderSnapshotRef: MutableRefObject<WorldRenderSnapshot>;
  movementCooldownEndAtRef: MutableRefObject<number | null>;
  movementTransitionRef: MutableRefObject<WorldMovementTransition | null>;
  movementControllerRef: MutableRefObject<WorldMovementController | null>;
  pausedAnimationMsRef: MutableRefObject<number | null>;
  pausedRef: MutableRefObject<boolean>;
  playerCoordRef: MutableRefObject<HexCoord>;
  renderInvalidationRef: MutableRefObject<number>;
  selectedRef: MutableRefObject<HexCoord>;
  setGame: Dispatch<SetStateAction<GameState>>;
  setTooltip: (nextTooltip: TooltipState | null) => void;
  showCloudsRef: MutableRefObject<boolean>;
  cloudTransparencyRef: MutableRefObject<number>;
  showTooltipTagsRef: MutableRefObject<boolean>;
  showTerrainBackgroundsRef: MutableRefObject<boolean>;
  worldRenderFpsRef: MutableRefObject<number>;
  tooltipPositionRef: MutableRefObject<TooltipPosition | null>;
  visibleTilesRef: MutableRefObject<VisibleWorldTile[]>;
  worldMapCameraRef: MutableRefObject<WorldMapCameraState>;
  worldTimeMsRef: MutableRefObject<number>;
  worldTooltipKeyRef: MutableRefObject<string | null>;
}

interface UsePixiWorldBootstrapLifecycleResult {
  canvasReady: boolean;
  canvasError: boolean;
  queuedTravelAutoOpenSuppressionState: WorldMovementAutoOpenSuppressionState;
  retryCanvas: () => void;
}

export function usePixiWorldBootstrapLifecycle({
  enabled,
  appRef,
  cameraSaveTimerRef,
  dragStateRef,
  gameRef,
  hostRef,
  hoverAnalysisCacheRef,
  hoverAnalysisControllerRef,
  hoverAnalysisVersionRef,
  hoverFrameRef,
  hoverPointerRef,
  hoverSnapshotRef,
  hoveredMoveRef,
  hoveredSafePathRef,
  initGraphicsSettings,
  lastRenderSnapshotRef,
  movementCooldownEndAtRef,
  movementTransitionRef,
  movementControllerRef,
  pausedAnimationMsRef,
  pausedRef,
  playerCoordRef,
  renderInvalidationRef,
  selectedRef,
  setGame,
  setTooltip,
  showCloudsRef,
  cloudTransparencyRef,
  showTooltipTagsRef,
  showTerrainBackgroundsRef,
  worldRenderFpsRef,
  tooltipPositionRef,
  visibleTilesRef,
  worldMapCameraRef,
  worldTimeMsRef,
  worldTooltipKeyRef,
}: UsePixiWorldBootstrapLifecycleArgs): UsePixiWorldBootstrapLifecycleResult {
  const [canvasReady, setCanvasReady] = useState(false);
  const [canvasError, setCanvasError] = useState(false);
  const [
    queuedTravelAutoOpenSuppressionState,
    setQueuedTravelAutoOpenSuppressionState,
  ] = useState<WorldMovementAutoOpenSuppressionState>('idle');
  const [bootstrapAttempt, setBootstrapAttempt] = useState(0);

  const retryCanvas = useCallback(() => {
    setCanvasReady(false);
    setCanvasError(false);
    setBootstrapAttempt((current) => current + 1);
  }, []);

  useEffect(() => {
    const cameraSaveTimerRefValue = cameraSaveTimerRef;
    return () => {
      const timeoutId = cameraSaveTimerRefValue.current;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [cameraSaveTimerRef]);

  useEffect(() => {
    if (!enabled || !hostRef.current || appRef.current) return;

    let disposed = false;
    let cleanup: (() => void) | null = null;
    let movementController: WorldMovementController | null = null;

    lastRenderSnapshotRef.current = createInitialWorldRenderSnapshot();
    movementCooldownEndAtRef.current = null;
    movementTransitionRef.current = null;
    setQueuedTravelAutoOpenSuppressionState('idle');
    setCanvasReady(false);
    setCanvasError(false);

    void Promise.all([
      import('./pixiWorldBootstrap'),
      import('./movement/createAppWorldMovementController'),
    ])
      .then(
        ([
          { bootstrapPixiWorldCanvas },
          { createAppWorldMovementController },
        ]) => {
          movementController = createAppWorldMovementController({
            gameRef,
            movementCooldownEndAtRef,
            onAutoOpenSuppressionStateChange:
              setQueuedTravelAutoOpenSuppressionState,
            renderInvalidationRef,
            setGame,
            worldTimeMsRef,
          });
          movementControllerRef.current = movementController;

          return bootstrapPixiWorldCanvas({
            appRef,
            cameraSaveTimerRef,
            dragStateRef,
            gameRef,
            hostRef,
            hoverAnalysisCacheRef,
            hoverAnalysisControllerRef,
            hoverAnalysisVersionRef,
            hoverFrameRef,
            hoverPointerRef,
            hoverSnapshotRef,
            hoveredMoveRef,
            hoveredSafePathRef,
            initGraphicsSettings,
            isDisposed: () => disposed,
            lastRenderSnapshotRef,
            onReady: (nextCleanup) => {
              cleanup = () => {
                nextCleanup();
                setCanvasReady(false);
              };
              setCanvasReady(true);
            },
            pausedAnimationMsRef,
            pausedRef,
            playerCoordRef,
            movementCooldownEndAtRef,
            movementTransitionRef,
            renderInvalidationRef,
            selectedRef,
            movementController,
            setTooltip,
            showCloudsRef,
            cloudTransparencyRef,
            showTooltipTagsRef,
            showTerrainBackgroundsRef,
            worldRenderFpsRef,
            tooltipPositionRef,
            visibleTilesRef,
            worldMapCameraRef,
            worldTimeMsRef,
            worldTooltipKeyRef,
          });
        },
      )
      .catch((error: unknown) => {
        if (disposed) return;
        console.error(error);
        cleanup?.();
        movementController?.dispose();
        if (movementControllerRef.current === movementController) {
          movementControllerRef.current = null;
        }
        appRef.current = null;
        setCanvasReady(false);
        setCanvasError(true);
      });

    return () => {
      disposed = true;
      cleanup?.();
      movementController?.dispose();
      if (movementControllerRef.current === movementController) {
        movementControllerRef.current = null;
      }
      movementCooldownEndAtRef.current = null;
      movementTransitionRef.current = null;
      setQueuedTravelAutoOpenSuppressionState('idle');
    };
  }, [
    bootstrapAttempt,
    enabled,
    appRef,
    cameraSaveTimerRef,
    dragStateRef,
    gameRef,
    hostRef,
    hoverAnalysisCacheRef,
    hoverAnalysisControllerRef,
    hoverAnalysisVersionRef,
    hoverFrameRef,
    hoverPointerRef,
    hoverSnapshotRef,
    hoveredMoveRef,
    hoveredSafePathRef,
    initGraphicsSettings,
    lastRenderSnapshotRef,
    movementCooldownEndAtRef,
    movementTransitionRef,
    movementControllerRef,
    pausedAnimationMsRef,
    pausedRef,
    playerCoordRef,
    renderInvalidationRef,
    selectedRef,
    setGame,
    setTooltip,
    showCloudsRef,
    cloudTransparencyRef,
    showTooltipTagsRef,
    showTerrainBackgroundsRef,
    worldRenderFpsRef,
    tooltipPositionRef,
    visibleTilesRef,
    worldMapCameraRef,
    worldTimeMsRef,
    worldTooltipKeyRef,
  ]);

  return {
    canvasReady,
    canvasError,
    queuedTravelAutoOpenSuppressionState,
    retryCanvas,
  };
}
