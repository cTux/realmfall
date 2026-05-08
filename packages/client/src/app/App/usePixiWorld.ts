import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
import type { Application } from 'pixi.js';
import type { TooltipPosition } from '@realmfall/ui-react';
import { WORLD_MOVE_VISUAL_DURATION_MS } from '../../game/config';
import type { GameState, HexCoord } from '../../game/stateTypes';
import type { WorldMapCameraState } from '../../ui/world/worldMapCamera';
import {
  normalizeCloudTransparency,
  normalizeWorldRenderFps,
  type GraphicsSettings,
} from '../graphicsSettings';
import type { TooltipState } from './types';
import {
  createEmptyWorldHoverSnapshot,
  type WorldHoverSnapshot,
} from './world/worldHoverSnapshot';
import { sameCoord } from './usePixiWorldHover';
import type { WorldHoverAnalysisController } from './world/pixiWorldHoverInteractions';
import type { WorldMapDragState } from './world/pixiWorldInteractions';
import type { PixiWorldInitGraphicsSettings } from './world/pixiWorldBootstrap';
import { useWorldTileResolutionLifecycle } from './world/tileResolution/useWorldTileResolutionLifecycle';
import {
  createWorldMovementTransition,
  type WorldMovementTransition,
} from './world/movement/worldMovementTransition';
import type { WorldMovementController } from './world/pixiWorldLifecycleTypes';
import { usePixiWorldBootstrapLifecycle } from './world/usePixiWorldBootstrapLifecycle';
import {
  createInitialWorldRenderSnapshot,
  type WorldRenderSnapshot,
} from './world/worldRenderSnapshot';
import type { VisibleTilesUpdate } from './world/tileResolution/useWorldTileResolutionLifecycle';
import { usePixiWorldHoverLifecycle } from './world/usePixiWorldHoverLifecycle';
import {
  usePixiWorldPendingCombatIntroLifecycle,
  usePixiWorldPendingCombatSeedLifecycle,
} from './world/usePixiWorldPendingCombatLifecycle';
import { usePixiWorldQueuedTravelSuppression } from './world/usePixiWorldQueuedTravelSuppression';
import { usePixiWorldRenderSettingsSync } from './world/usePixiWorldRenderSettingsSync';
import type { PendingVictoryTransitionOffset } from './world/pixiWorldPendingCombat';

const DEFAULT_WORLD_MAP_CAMERA: WorldMapCameraState = {
  zoom: 1,
  panX: 0,
  panY: 0,
};

interface UsePixiWorldArgs {
  enabled: boolean;
  game: GameState;
  graphicsSettings: GraphicsSettings;
  interactionBlocked: boolean;
  paused: boolean;
  showTooltipTags: boolean;
  worldTimeMsRef: MutableRefObject<number>;
  gameRef: MutableRefObject<GameState>;
  tooltipPositionRef: MutableRefObject<TooltipPosition | null>;
  setGame: Dispatch<SetStateAction<GameState>>;
  setTooltip: (nextTooltip: TooltipState | null) => void;
}

export function usePixiWorld({
  enabled,
  game,
  graphicsSettings,
  interactionBlocked,
  paused,
  showTooltipTags,
  worldTimeMsRef,
  gameRef,
  tooltipPositionRef,
  setGame,
  setTooltip,
}: UsePixiWorldArgs) {
  const {
    cloudTransparency,
    showClouds,
    showTerrainBackgrounds,
    worldRenderFps,
  } = graphicsSettings;
  const playerCoordQ = game.player.coord.q;
  const playerCoordR = game.player.coord.r;
  const playerCoord = useMemo(
    () => ({ q: playerCoordQ, r: playerCoordR }),
    [playerCoordQ, playerCoordR],
  );
  const hostRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const initGraphicsSettingsRef = useRef<PixiWorldInitGraphicsSettings | null>(
    null,
  );
  const worldTooltipKeyRef = useRef<string | null>(null);
  const playerCoordRef = useRef(game.player.coord);
  const hoverPointerRef = useRef<{ clientX: number; clientY: number } | null>(
    null,
  );
  const dragStateRef = useRef<WorldMapDragState | null>(null);
  const worldMapCameraRef = useRef(DEFAULT_WORLD_MAP_CAMERA);
  const pausedRef = useRef(paused);
  const pausedAnimationMsRef = useRef<number | null>(null);
  const hoverFrameRef = useRef<number | null>(null);
  const cameraSaveTimerRef = useRef<number | null>(null);
  const selectedRef = useRef(game.player.coord);
  const hoveredMoveRef = useRef<HexCoord | null>(null);
  const hoveredSafePathRef = useRef<HexCoord[] | null>(null);
  const hoverAnalysisCacheRef = useRef<Map<string, WorldHoverSnapshot>>(
    undefined!,
  );
  const hoverAnalysisControllerRef =
    useRef<WorldHoverAnalysisController | null>(null);
  const hoverAnalysisVersionRef = useRef(0);
  const hoverSnapshotRef = useRef<WorldHoverSnapshot>(undefined!);
  const previousGameRef = useRef(game);
  const showCloudsRef = useRef(showClouds);
  const cloudTransparencyRef = useRef(
    normalizeCloudTransparency(cloudTransparency),
  );
  const showTerrainBackgroundsRef = useRef(showTerrainBackgrounds);
  const showTooltipTagsRef = useRef(showTooltipTags);
  const worldRenderFpsRef = useRef(normalizeWorldRenderFps(worldRenderFps));
  const lastRenderSnapshotRef = useRef<WorldRenderSnapshot>(undefined!);
  const renderInvalidationRef = useRef(0);
  const movementCooldownEndAtRef = useRef<number | null>(null);
  const movementTransitionRef = useRef<WorldMovementTransition | null>(null);
  const pendingVictoryTransitionOffsetRef =
    useRef<PendingVictoryTransitionOffset | null>(null);
  const movementControllerRef = useRef<WorldMovementController | null>(null);
  const combatIntroTimerRef = useRef<number | null>(null);

  if (hoverAnalysisCacheRef.current === undefined) {
    hoverAnalysisCacheRef.current = new Map<string, WorldHoverSnapshot>();
  }

  if (hoverSnapshotRef.current === undefined) {
    hoverSnapshotRef.current = createEmptyWorldHoverSnapshot(
      hoverAnalysisVersionRef.current,
    );
  }

  if (lastRenderSnapshotRef.current === undefined) {
    lastRenderSnapshotRef.current = createInitialWorldRenderSnapshot();
  }

  if (initGraphicsSettingsRef.current === null) {
    initGraphicsSettingsRef.current =
      getPixiInitGraphicsSettings(graphicsSettings);
  }

  const handleVisibleTilesUpdated = useCallback(
    ({
      nextVisibleTiles,
      playerCoord,
      previousPlayerCoord,
      previousVisibleTiles,
    }: VisibleTilesUpdate) => {
      if (sameCoord(previousPlayerCoord, playerCoord)) {
        return;
      }

      const pendingVictoryTransitionOffset =
        pendingVictoryTransitionOffsetRef.current;
      const playerOffsetAtStart =
        pendingVictoryTransitionOffset &&
        sameCoord(
          pendingVictoryTransitionOffset.fromCoord,
          previousPlayerCoord,
        ) &&
        sameCoord(pendingVictoryTransitionOffset.toCoord, playerCoord)
          ? pendingVictoryTransitionOffset.offset
          : undefined;
      pendingVictoryTransitionOffsetRef.current = null;

      const nextTransition = createWorldMovementTransition({
        durationMs: WORLD_MOVE_VISUAL_DURATION_MS,
        fromCoord: previousPlayerCoord,
        nextVisibleTiles,
        playerOffsetAtStart,
        previousVisibleTiles,
        startedAtMs: performance.now(),
        toCoord: playerCoord,
      });

      if (nextTransition) {
        movementTransitionRef.current = nextTransition;
        renderInvalidationRef.current += 1;
        return;
      }

      if (movementTransitionRef.current !== null) {
        movementTransitionRef.current = null;
        renderInvalidationRef.current += 1;
      }
    },
    [],
  );

  useEffect(() => {
    gameRef.current = game;
  }, [game, gameRef]);

  usePixiWorldPendingCombatSeedLifecycle({
    appRef,
    game,
    movementCooldownEndAtRef,
    movementControllerRef,
    pendingVictoryTransitionOffsetRef,
    previousGameRef,
    renderInvalidationRef,
  });

  const { visibleTilesRef } = useWorldTileResolutionLifecycle({
    enabled,
    game,
    gameRef,
    onVisibleTilesUpdated: handleVisibleTilesUpdated,
    playerCoord,
    playerCoordRef,
    renderInvalidationRef,
    setGame,
  });

  usePixiWorldPendingCombatIntroLifecycle({
    combat: game.combat,
    combatIntroTimerRef,
    gameRef,
    movementTransitionRef,
    paused,
    playerCoord,
    setGame,
    worldTimeMsRef,
  });

  usePixiWorldRenderSettingsSync({
    appRef,
    cloudTransparency,
    cloudTransparencyRef,
    paused,
    pausedAnimationMsRef,
    pausedRef,
    renderInvalidationRef,
    showClouds,
    showCloudsRef,
    showTerrainBackgrounds,
    showTerrainBackgroundsRef,
    showTooltipTags,
    showTooltipTagsRef,
    worldRenderFps,
    worldRenderFpsRef,
  });

  usePixiWorldHoverLifecycle({
    interactionBlocked,
    playerCoord,
    game: game,
    hoverAnalysisCacheRef,
    hoverAnalysisControllerRef,
    hoverAnalysisVersionRef,
    hoverPointerRef,
    hoverSnapshotRef,
    hoveredMoveRef,
    hoveredSafePathRef,
    selectedRef,
    setTooltip,
    tooltipPositionRef,
    worldTooltipKeyRef,
  });

  const initGraphicsSettings = initGraphicsSettingsRef.current!;

  const {
    canvasReady,
    canvasError,
    queuedTravelAutoOpenSuppressionState,
    retryCanvas,
  } = usePixiWorldBootstrapLifecycle({
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
  });

  usePixiWorldQueuedTravelSuppression({
    combat: game.combat,
    movementControllerRef,
    queuedTravelAutoOpenSuppressionState,
  });

  return {
    hostRef,
    canvasReady,
    canvasError,
    retryCanvas,
    queuedTravelAutoOpenSuppressed:
      queuedTravelAutoOpenSuppressionState !== 'idle',
  };
}

function getPixiInitGraphicsSettings(
  graphicsSettings: GraphicsSettings,
): PixiWorldInitGraphicsSettings {
  return {
    antialias: graphicsSettings.antialias,
    autoDensity: graphicsSettings.autoDensity,
    clearBeforeRender: graphicsSettings.clearBeforeRender,
    premultipliedAlpha: graphicsSettings.premultipliedAlpha,
    preserveDrawingBuffer: graphicsSettings.preserveDrawingBuffer,
    resolutionCap: graphicsSettings.resolutionCap,
    useContextAlpha: graphicsSettings.useContextAlpha,
  };
}
