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
import { WORLD_MOVE_HEX_COOLDOWN_MS } from '../../game/config';
import { hexKey, hexesInRange } from '../../game/hex';
import { startCombat } from '../../game/stateCombat';
import type { GameState, HexCoord } from '../../game/stateTypes';
import { WORLD_COMBAT_LUNGE_DURATION_MS } from '../../game/worldCombatPresentation';
import { getWorldHexSize } from '../../ui/world/renderSceneMath';
import { type VisibleWorldTile } from '../../ui/world/visibleWorldTiles';
import type { WorldMapCameraState } from '../../ui/world/worldMapCamera';
import { getWorldCombatLungeOffset } from '../../ui/world/worldCombatLunge';
import {
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
import type { WorldTileResolutionOverlayEntry } from './world/tileResolution/worldTileResolutionCoordinator';
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

type VisibleWorldResolutionState = Pick<
  GameState,
  'bloodMoonActive' | 'radius' | 'seed'
> & {
  playerCoord: HexCoord;
  resolvedTiles: GameState['tiles'];
};

interface TileResolutionCoordinator {
  dispose(): Promise<void>;
  syncVisibleCoords(state: VisibleWorldResolutionState): Promise<void>;
}

interface VisibleWorldTileBuildArgs {
  overlay: ReadonlyMap<string, WorldTileResolutionOverlayEntry>;
  playerCoord: HexCoord;
  radius: GameState['radius'];
  resolvedTiles: GameState['tiles'];
}

type BuildVisibleWorldTiles = (
  args: VisibleWorldTileBuildArgs,
) => VisibleWorldTile[];

type ReuseVisibleTiles = (
  previousVisibleTiles: VisibleWorldTile[],
  nextVisibleTiles: VisibleWorldTile[],
) => VisibleWorldTile[];

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
  const { showTerrainBackgrounds, worldRenderFps } = graphicsSettings;
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
  const resolutionCoordinatorRef = useRef<TileResolutionCoordinator | null>(
    null,
  );
  const resolutionOverlayRef = useRef<
    ReadonlyMap<string, WorldTileResolutionOverlayEntry>
  >(new Map());
  const buildVisibleTilesRef = useRef<BuildVisibleWorldTiles>(
    buildResolvedVisibleWorldTiles,
  );
  const reuseVisibleTilesRef = useRef<ReuseVisibleTiles>((_, next) => next);
  const visibleTilesRef = useRef<VisibleWorldTile[]>(undefined!);
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
  const showTerrainBackgroundsRef = useRef(showTerrainBackgrounds);
  const showTooltipTagsRef = useRef(showTooltipTags);
  const worldRenderFpsRef = useRef(normalizeWorldRenderFps(worldRenderFps));
  const lastRenderSnapshotRef = useRef<WorldRenderSnapshot>(undefined!);
  const renderInvalidationRef = useRef(0);
  const movementCooldownEndAtRef = useRef<number | null>(null);
  const movementTransitionRef = useRef<WorldMovementTransition | null>(null);
  const pendingVictoryTransitionOffsetRef = useRef<{
    fromCoord: HexCoord;
    offset: { x: number; y: number };
    toCoord: HexCoord;
  } | null>(null);
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

  if (visibleTilesRef.current === undefined) {
    visibleTilesRef.current = buildVisibleTilesRef.current({
      overlay: resolutionOverlayRef.current,
      playerCoord: game.player.coord,
      radius: game.radius,
      resolvedTiles: game.tiles,
    });
  }

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

  useEffect(() => {
    gameRef.current = game;
  }, [game, gameRef]);

  useEffect(() => {
    const previousGame = previousGameRef.current;
    const previousEngagement = previousGame.combat?.engagement;
    if (
      previousGame !== game &&
      previousEngagement?.autoStepOnVictory &&
      previousEngagement.targetCoord !== null &&
      game.combat === null &&
      sameCoord(game.player.coord, previousEngagement.targetCoord) &&
      !sameCoord(previousGame.player.coord, previousEngagement.targetCoord)
    ) {
      const carriedOffset = getPostCombatTransitionOffset({
        app: appRef.current,
        previousGame,
      });
      pendingVictoryTransitionOffsetRef.current = carriedOffset
        ? {
            fromCoord: previousGame.player.coord,
            offset: carriedOffset,
            toCoord: previousEngagement.targetCoord,
          }
        : null;

      const cooldownEndAtMs = performance.now() + WORLD_MOVE_HEX_COOLDOWN_MS;
      const movementController = movementControllerRef.current;
      if (movementController) {
        movementController.seedCooldownUntil(cooldownEndAtMs);
      } else {
        movementCooldownEndAtRef.current = cooldownEndAtMs;
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

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (resolutionCoordinatorRef.current !== null) {
      return;
    }

    let disposed = false;
    let coordinator: TileResolutionCoordinator | null = null;

    const initializeCoordinator = async () => {
      const [
        { buildVisibleWorldTiles },
        { reuseVisibleTilesIfUnchanged },
        { hydrateResolvedWorldTilePayload },
        { createLocalTileResolutionSource },
        { createWorkerTileResolutionSource },
        { createWorldTileResolutionCoordinator },
      ] = await Promise.all([
        import('./world/buildVisibleWorldTiles'),
        import('./selectors/reuseVisibleTilesIfUnchanged'),
        import('../../game/worldTileResolutionRuntime'),
        import('./world/tileResolution/createLocalTileResolutionSource'),
        import('./world/tileResolution/createWorkerTileResolutionSource'),
        import('./world/tileResolution/worldTileResolutionCoordinator'),
      ]);

      if (disposed || resolutionCoordinatorRef.current !== null) {
        return;
      }

      buildVisibleTilesRef.current = buildVisibleWorldTiles;
      reuseVisibleTilesRef.current = reuseVisibleTilesIfUnchanged;
      visibleTilesRef.current = reuseVisibleTilesRef.current(
        visibleTilesRef.current,
        buildVisibleTilesRef.current({
          overlay: resolutionOverlayRef.current,
          playerCoord: playerCoordRef.current,
          radius: gameRef.current.radius,
          resolvedTiles: gameRef.current.tiles,
        }),
      );
      renderInvalidationRef.current += 1;

      let source;
      try {
        source = createWorkerTileResolutionSource();
      } catch {
        source = createLocalTileResolutionSource();
      }

      coordinator = createWorldTileResolutionCoordinator({
        now: () => performance.now(),
        onMergeResolvedTiles: (payloads) => {
          if (payloads.length === 0) {
            return;
          }

          setGame((current) => {
            const nextTiles = { ...current.tiles };
            const nextEnemies = { ...current.enemies };
            const activeWorldId =
              current.worlds[current.activeWorldId] !== undefined
                ? current.activeWorldId
                : current.surfaceWorldId;
            const activeWorld = current.worlds[activeWorldId];

            for (const resolvedPayload of payloads.map(
              hydrateResolvedWorldTilePayload,
            )) {
              nextTiles[hexKey(resolvedPayload.coord)] = resolvedPayload.tile;
              for (const enemy of resolvedPayload.enemies) {
                nextEnemies[enemy.id] ??= enemy;
              }
            }

            const nextGame = {
              ...current,
              worlds:
                activeWorld === undefined
                  ? current.worlds
                  : {
                      ...current.worlds,
                      [activeWorldId]: {
                        ...activeWorld,
                        tiles: nextTiles,
                        enemies: nextEnemies,
                      },
                    },
              tiles: nextTiles,
              enemies: nextEnemies,
            };
            gameRef.current = nextGame;
            return nextGame;
          });
        },
        onOverlayChange: (overlay) => {
          resolutionOverlayRef.current = overlay;
          visibleTilesRef.current = reuseVisibleTilesRef.current(
            visibleTilesRef.current,
            buildVisibleTilesRef.current({
              overlay,
              playerCoord: playerCoordRef.current,
              radius: gameRef.current.radius,
              resolvedTiles: gameRef.current.tiles,
            }),
          );
          renderInvalidationRef.current += 1;
        },
        source,
      });

      if (disposed) {
        void coordinator.dispose();
        coordinator = null;
        return;
      }

      resolutionCoordinatorRef.current = coordinator;
      try {
        await syncTileResolutionCoordinator(coordinator, gameRef.current);
      } catch (error) {
        if (!disposed) {
          console.error(error);
        }
      }
    };

    void initializeCoordinator().catch((error: unknown) => {
      if (!disposed) {
        console.error(error);
      }
    });

    return () => {
      disposed = true;
      if (resolutionCoordinatorRef.current === coordinator && coordinator) {
        resolutionCoordinatorRef.current = null;
      }
      if (coordinator !== null) {
        void coordinator.dispose();
      }
    };
  }, [enabled, gameRef, setGame]);

  useEffect(() => {
    const previousPlayerCoord = playerCoordRef.current;
    const previousVisibleTiles = visibleTilesRef.current;
    const nextVisibleTiles = reuseVisibleTilesRef.current(
      visibleTilesRef.current,
      buildVisibleTilesRef.current({
        overlay: resolutionOverlayRef.current,
        playerCoord,
        radius: game.radius,
        resolvedTiles: game.tiles,
      }),
    );

    playerCoordRef.current = playerCoord;
    visibleTilesRef.current = nextVisibleTiles;

    if (sameCoord(previousPlayerCoord, playerCoord)) {
      return;
    }

    const pendingVictoryTransitionOffset =
      pendingVictoryTransitionOffsetRef.current;
    const playerOffsetAtStart =
      pendingVictoryTransitionOffset &&
      sameCoord(pendingVictoryTransitionOffset.fromCoord, previousPlayerCoord) &&
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
  }, [game.radius, game.tiles, playerCoord]);

  useEffect(() => {
    if (combatIntroTimerRef.current !== null) {
      window.clearTimeout(combatIntroTimerRef.current);
      combatIntroTimerRef.current = null;
    }

    if (paused || !game.combat || game.combat.started) {
      return;
    }

    const pendingCombat = game.combat;
    if (pendingCombat.startedAtMs == null) {
      const remainingApproachMs = getPendingCombatApproachDelayMs({
        combat: pendingCombat,
        movementTransition: movementTransitionRef.current,
        nowMs: performance.now(),
        playerCoord,
      });
      if (remainingApproachMs > 0) {
        combatIntroTimerRef.current = window.setTimeout(() => {
          setGame((current) =>
            stampPendingCombatIntro({
              current,
              gameRef,
              worldTimeMs: worldTimeMsRef.current,
            }),
          );
        }, remainingApproachMs);
        return;
      }

      if (hasPendingCombatLunge(pendingCombat)) {
        setGame((current) =>
          stampPendingCombatIntro({
            current,
            gameRef,
            worldTimeMs: worldTimeMsRef.current,
          }),
        );
        return;
      }

      setGame((current) =>
        autoStartPendingCombat({
          current,
          gameRef,
          worldTimeMs: worldTimeMsRef.current,
        }),
      );
      return;
    }

    const remainingIntroMs = hasPendingCombatLunge(pendingCombat)
      ? Math.max(
          0,
          WORLD_COMBAT_LUNGE_DURATION_MS -
            Math.max(0, worldTimeMsRef.current - pendingCombat.startedAtMs),
        )
      : 0;
    if (remainingIntroMs === 0) {
      setGame((current) =>
        autoStartPendingCombat({
          current,
          gameRef,
          worldTimeMs: worldTimeMsRef.current,
        }),
      );
      return;
    }

    combatIntroTimerRef.current = window.setTimeout(() => {
      setGame((current) =>
        autoStartPendingCombat({
          current,
          gameRef,
          worldTimeMs: worldTimeMsRef.current,
        }),
      );
    }, remainingIntroMs);

    return () => {
      if (combatIntroTimerRef.current !== null) {
        window.clearTimeout(combatIntroTimerRef.current);
        combatIntroTimerRef.current = null;
      }
    };
  }, [game.combat, gameRef, paused, playerCoord, setGame, worldTimeMsRef]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const coordinator = resolutionCoordinatorRef.current;
    if (!coordinator) {
      return;
    }

    void coordinator
      .syncVisibleCoords({
        bloodMoonActive: game.bloodMoonActive,
        playerCoord,
        radius: game.radius,
        resolvedTiles: game.tiles,
        seed: game.seed,
      })
      .catch((error: unknown) => {
        console.error(error);
      });
  }, [
    enabled,
    game.bloodMoonActive,
    playerCoord,
    game.radius,
    game.seed,
    game.tiles,
  ]);

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

function buildResolvedVisibleWorldTiles({
  playerCoord,
  radius,
  resolvedTiles,
}: VisibleWorldTileBuildArgs): VisibleWorldTile[] {
  return hexesInRange(playerCoord, radius).map((coord) => {
    const tile = resolvedTiles[hexKey(coord)];
    return (
      tile ?? {
        coord,
        requestedAt: 0,
        unknown: true,
        terrain: 'mountain',
        items: [],
        enemyIds: [],
      }
    );
  });
}

function syncTileResolutionCoordinator(
  coordinator: TileResolutionCoordinator,
  game: Pick<
    GameState,
    'bloodMoonActive' | 'player' | 'radius' | 'seed' | 'tiles'
  >,
) {
  return coordinator.syncVisibleCoords({
    bloodMoonActive: game.bloodMoonActive,
    playerCoord: game.player.coord,
    radius: game.radius,
    resolvedTiles: game.tiles,
    seed: game.seed,
  });
}

function getPendingCombatApproachDelayMs({
  combat,
  movementTransition,
  nowMs,
  playerCoord,
}: {
  combat: NonNullable<GameState['combat']>;
  movementTransition: WorldMovementTransition | null;
  nowMs: number;
  playerCoord: HexCoord;
}) {
  if (!hasPendingCombatLunge(combat)) {
    return 0;
  }

  if (
    !movementTransition ||
    !sameCoord(movementTransition.toCoord, playerCoord)
  ) {
    return 0;
  }

  return Math.max(
    0,
    movementTransition.startedAtMs + movementTransition.durationMs - nowMs,
  );
}

function hasPendingCombatLunge(combat: NonNullable<GameState['combat']>) {
  const targetCoord = combat.engagement?.targetCoord;
  const stagingCoord = combat.engagement?.stagingCoord;
  return Boolean(
    targetCoord && stagingCoord && !sameCoord(targetCoord, stagingCoord),
  );
}

function stampPendingCombatIntro({
  current,
  gameRef,
  worldTimeMs,
}: {
  current: GameState;
  gameRef: MutableRefObject<GameState>;
  worldTimeMs: number;
}) {
  if (
    !current.combat ||
    current.combat.started ||
    current.combat.startedAtMs != null
  ) {
    return current;
  }

  const next = {
    ...current,
    combat: {
      ...current.combat,
      startedAtMs: worldTimeMs,
    },
  };
  gameRef.current = next;
  return next;
}

function autoStartPendingCombat({
  current,
  gameRef,
  worldTimeMs,
}: {
  current: GameState;
  gameRef: MutableRefObject<GameState>;
  worldTimeMs: number;
}) {
  if (!current.combat || current.combat.started) {
    return current;
  }

  const next = startCombat({
    ...current,
    worldTimeMs,
  });
  gameRef.current = next;
  return next;
}

function getPostCombatTransitionOffset({
  app,
  previousGame,
}: {
  app: Application | null;
  previousGame: GameState;
}) {
  const combat = previousGame.combat;
  const engagement = combat?.engagement;
  if (
    !app ||
    combat === null ||
    combat.startedAtMs == null ||
    !engagement?.stagingCoord ||
    !engagement.targetCoord
  ) {
    return null;
  }

  const hexSize = getWorldHexSize(app.screen, previousGame.radius);
  const offset = getWorldCombatLungeOffset({
    hexSize,
    phase: combat.started ? 'held' : 'animating',
    stagingCoord: engagement.stagingCoord,
    startedAtMs: combat.startedAtMs,
    targetCoord: engagement.targetCoord,
    worldTimeMs: previousGame.worldTimeMs,
  });

  return Math.hypot(offset.x, offset.y) > 0 ? offset : null;
}
