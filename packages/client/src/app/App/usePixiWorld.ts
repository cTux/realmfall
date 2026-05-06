import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
import type { Application } from 'pixi.js';
import type { TooltipPosition } from '@realmfall/ui';
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
import {
  autoStartPendingCombat,
  getPendingCombatUpdatePlan,
  getPostCombatAutoStepTransition,
  stampPendingCombatIntro,
  type PendingVictoryTransitionOffset,
} from './world/pixiWorldPendingCombat';
import type { PixiWorldInitGraphicsSettings } from './world/pixiWorldBootstrap';
import {
  useWorldTileResolutionLifecycle,
  type VisibleTilesUpdate,
} from './world/tileResolution/useWorldTileResolutionLifecycle';
import {
  createInitialWorldRenderSnapshot,
  type WorldRenderSnapshot,
} from './world/worldRenderSnapshot';
import {
  createWorldMovementTransition,
  WORLD_MOVE_VISUAL_DURATION_MS,
  type WorldMovementTransition,
} from './world/movement/worldMovementTransition';
import type { WorldMovementAutoOpenSuppressionState } from './world/movement/worldMovementController';

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

interface WorldMovementController {
  clear(): void;
  dispose(): void;
  getQueuedPath(): HexCoord[] | null;
  queueHostileApproach(
    nextSteps: HexCoord[],
    engageTargetCoord: HexCoord,
  ): void;
  releaseCombatAutoOpenSuppression(): void;
  replaceQueuedPath(nextSteps: HexCoord[]): void;
  seedCooldownUntil(endAtMs: number): void;
  startHostileEngagement(targetCoord: HexCoord): void;
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

  useEffect(() => {
    const previousGame = previousGameRef.current;
    const postCombatAutoStepTransition = getPostCombatAutoStepTransition({
      app: appRef.current,
      game,
      nowMs: performance.now(),
      previousGame,
    });

    if (postCombatAutoStepTransition) {
      pendingVictoryTransitionOffsetRef.current =
        postCombatAutoStepTransition.pendingVictoryTransitionOffset;

      const movementController = movementControllerRef.current;
      if (movementController) {
        movementController.seedCooldownUntil(
          postCombatAutoStepTransition.cooldownEndAtMs,
        );
      } else {
        movementCooldownEndAtRef.current =
          postCombatAutoStepTransition.cooldownEndAtMs;
        renderInvalidationRef.current += 1;
      }
    }

    previousGameRef.current = game;
  }, [game]);

  useEffect(() => {
    pausedRef.current = paused;
    pausedAnimationMsRef.current = paused ? performance.now() : null;
    renderInvalidationRef.current += 1;
  }, [paused]);

  useEffect(() => {
    showCloudsRef.current = showClouds;
    renderInvalidationRef.current += 1;
  }, [showClouds]);

  useEffect(() => {
    cloudTransparencyRef.current =
      normalizeCloudTransparency(cloudTransparency);
    renderInvalidationRef.current += 1;
  }, [cloudTransparency]);

  useEffect(() => {
    showTerrainBackgroundsRef.current = showTerrainBackgrounds;
    renderInvalidationRef.current += 1;
  }, [showTerrainBackgrounds]);

  useEffect(() => {
    showTooltipTagsRef.current = showTooltipTags;
  }, [showTooltipTags]);

  useEffect(() => {
    const normalizedWorldRenderFps = normalizeWorldRenderFps(worldRenderFps);
    worldRenderFpsRef.current = normalizedWorldRenderFps;
    renderInvalidationRef.current += 1;

    const app = appRef.current;
    if (!app) {
      return;
    }

    app.ticker.maxFPS = normalizedWorldRenderFps;
  }, [worldRenderFps]);

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

  useEffect(() => {
    if (combatIntroTimerRef.current !== null) {
      window.clearTimeout(combatIntroTimerRef.current);
      combatIntroTimerRef.current = null;
    }

    if (paused || !game.combat || game.combat.started) {
      return;
    }

    const pendingCombatPlan = getPendingCombatUpdatePlan({
      combat: game.combat,
      movementNowMs: performance.now(),
      movementTransition: movementTransitionRef.current,
      playerCoord,
      worldTimeMs: worldTimeMsRef.current,
    });
    if (pendingCombatPlan.action === 'none') {
      return;
    }

    const runPendingCombatPlan = () =>
      setGame((current) =>
        pendingCombatPlan.action === 'stamp'
          ? stampPendingCombatIntro({
              current,
              gameRef,
              worldTimeMs: worldTimeMsRef.current,
            })
          : autoStartPendingCombat({
              current,
              gameRef,
              worldTimeMs: worldTimeMsRef.current,
            }),
      );

    if (pendingCombatPlan.delayMs === 0) {
      runPendingCombatPlan();
      return;
    }

    combatIntroTimerRef.current = window.setTimeout(
      runPendingCombatPlan,
      pendingCombatPlan.delayMs,
    );

    return () => {
      if (combatIntroTimerRef.current !== null) {
        window.clearTimeout(combatIntroTimerRef.current);
        combatIntroTimerRef.current = null;
      }
    };
  }, [game.combat, gameRef, paused, playerCoord, setGame, worldTimeMsRef]);

  useEffect(() => {
    selectedRef.current = playerCoord;
    const hoverAnalysisController = hoverAnalysisControllerRef.current;
    if (hoverAnalysisController) {
      hoverAnalysisController.resetHoverAnalysis();
      return;
    }

    hoverAnalysisVersionRef.current += 1;
    hoverAnalysisCacheRef.current.clear();
    hoverPointerRef.current = null;
    hoverSnapshotRef.current = createEmptyWorldHoverSnapshot(
      hoverAnalysisVersionRef.current,
    );
    hoveredMoveRef.current = null;
    hoveredSafePathRef.current = null;
    worldTooltipKeyRef.current = null;
    tooltipPositionRef.current = null;
    setTooltip(null);
  }, [playerCoord, setTooltip, tooltipPositionRef]);

  useEffect(() => {
    hoverAnalysisControllerRef.current?.refreshHoverAnalysis();
  }, [
    game.bloodMoonActive,
    game.combat,
    game.enemies,
    game.gameOver,
    game.radius,
    game.seed,
    game.tiles,
    game.turn,
  ]);

  useEffect(() => {
    if (!interactionBlocked) {
      return;
    }

    hoverAnalysisControllerRef.current?.resetHoverAnalysis();
    worldTooltipKeyRef.current = null;
    tooltipPositionRef.current = null;
    setTooltip(null);
  }, [interactionBlocked, setTooltip, tooltipPositionRef]);

  useEffect(() => {
    if (!game.combat) {
      if (queuedTravelAutoOpenSuppressionState === 'combat') {
        movementControllerRef.current?.releaseCombatAutoOpenSuppression();
      }
      return;
    }

    movementControllerRef.current?.clear();
  }, [game.combat, queuedTravelAutoOpenSuppressionState]);

  useEffect(
    () => () => {
      if (cameraSaveTimerRef.current !== null) {
        window.clearTimeout(cameraSaveTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (!enabled || !hostRef.current || appRef.current) return;

    let disposed = false;
    let cleanup: (() => void) | null = null;
    let movementController: WorldMovementController | null = null;
    const initGraphicsSettings = initGraphicsSettingsRef.current!;
    lastRenderSnapshotRef.current = createInitialWorldRenderSnapshot();
    movementCooldownEndAtRef.current = null;
    movementTransitionRef.current = null;
    setQueuedTravelAutoOpenSuppressionState('idle');
    setCanvasReady(false);
    setCanvasError(false);

    void Promise.all([
      import('./world/pixiWorldBootstrap'),
      import('./world/movement/createAppWorldMovementController'),
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
    gameRef,
    setGame,
    setTooltip,
    tooltipPositionRef,
    visibleTilesRef,
    worldTimeMsRef,
  ]);

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
