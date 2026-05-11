import type { MutableRefObject } from 'react';
import type { Application } from 'pixi.js';
import { syncFollowCursorTooltipPosition } from '@realmfall/ui-react/tooltip';
import type { TooltipPosition } from '@realmfall/ui-react/tooltip';
import {
  hexAtPoint,
  hexDistance,
  type HexCoord,
} from '@realmfall/core/game/hex';
import { isPassable } from '@realmfall/core/game/shared';
import {
  getEnemiesAt,
  getResolvedTileAt,
} from '@realmfall/core/game/stateWorldQueries';
import { getCurrentWorldRevealRadius } from '@realmfall/core/game/stateOutposts';
import type { GameState } from '@realmfall/core/game/stateTypes';
import { TOOLTIP_BORDER_COLORS } from '../../../theme.config';
import { getWorldHexSize } from '../../../ui/world/renderSceneMath';
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
import {
  getWorldMovementTransitionSceneCenter,
  type WorldMovementTransition,
} from './movement/worldMovementTransition';
import { createWorkerWorldHoverAnalysisSource } from './hoverAnalysis/createWorkerWorldHoverAnalysisSource';
import {
  buildWorldHoverAnalysisState,
  getWorldHoverAnalysisStateInputs,
  isSameWorldHoverAnalysisStateInputs,
  type WorldHoverAnalysisState,
  type WorldHoverAnalysisStateInputs,
} from './hoverAnalysis/worldHoverAnalysisTypes';

type EnemyWorldTooltip =
  typeof import('../../../ui/world/worldTooltips').enemyWorldTooltip;
type StructureWorldTooltip =
  typeof import('../../../ui/world/worldTooltips').structureWorldTooltip;

export interface WorldHoverAnalysisController {
  clearHoverState(): void;
  dispose(): void;
  queuePointerMove(event: Pick<PointerEvent, 'clientX' | 'clientY'>): void;
  refreshHoverAnalysis(): void;
  resetHoverAnalysis(): void;
}

export function createWorldHoverInteractions({
  app,
  canvas,
  enemyWorldTooltip,
  gameRef,
  getScenePoint,
  hoverAnalysisCacheRef,
  hoverAnalysisVersionRef,
  hoverFrameRef,
  hoverPointerRef,
  hoverSnapshotRef,
  hoveredMoveRef,
  hoveredSafePathRef,
  playerCoordRef,
  movementTransitionRef,
  renderInvalidationRef,
  setTooltip,
  showTooltipTagsRef,
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
  hoverAnalysisVersionRef: MutableRefObject<number>;
  hoverFrameRef: MutableRefObject<number | null>;
  hoverPointerRef: MutableRefObject<{
    clientX: number;
    clientY: number;
  } | null>;
  hoverSnapshotRef: MutableRefObject<WorldHoverSnapshot>;
  hoveredMoveRef: MutableRefObject<HexCoord | null>;
  hoveredSafePathRef: MutableRefObject<HexCoord[] | null>;
  playerCoordRef: MutableRefObject<HexCoord>;
  movementTransitionRef?: MutableRefObject<WorldMovementTransition | null>;
  renderInvalidationRef: MutableRefObject<number>;
  setTooltip: (nextTooltip: TooltipState | null) => void;
  showTooltipTagsRef: MutableRefObject<boolean>;
  structureWorldTooltip: StructureWorldTooltip;
  tooltipPositionRef: MutableRefObject<TooltipPosition | null>;
  worldTooltipKeyRef: MutableRefObject<string | null>;
}): WorldHoverAnalysisController {
  const hoverAnalysisSource = createWorkerWorldHoverAnalysisSource();
  let disposed = false;
  let hoverAnalysisRequestToken = 0;
  let pendingHoverAnalysis: {
    analysisVersion: number;
    cacheKey: string;
    token: number;
  } | null = null;
  let builtWorldHoverAnalysisState: WorldHoverAnalysisState | null = null;
  let builtWorldHoverAnalysisStateInputs: WorldHoverAnalysisStateInputs | null =
    null;

  const syncHoverAnalysisState = () => {
    const game = gameRef.current;
    const nextInputs = getWorldHoverAnalysisStateInputs(game);

    if (
      builtWorldHoverAnalysisState === null ||
      builtWorldHoverAnalysisStateInputs === null ||
      !isSameWorldHoverAnalysisStateInputs(
        builtWorldHoverAnalysisStateInputs,
        nextInputs,
      )
    ) {
      builtWorldHoverAnalysisState = buildWorldHoverAnalysisState(game);
      builtWorldHoverAnalysisStateInputs = nextInputs;
    } else {
      return false;
    }

    void hoverAnalysisSource
      .syncState(builtWorldHoverAnalysisState)
      .catch((error: unknown) => {
        console.error(error);
      });

    return true;
  };

  const invalidatePendingHoverAnalysis = () => {
    hoverAnalysisRequestToken += 1;
    pendingHoverAnalysis = null;
  };

  const getCurrentTooltipPosition = () => {
    const hoverPointer = hoverPointerRef.current;
    if (!hoverPointer) {
      return null;
    }

    return {
      x: hoverPointer.clientX + 16,
      y: hoverPointer.clientY + 16,
    };
  };

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

  const commitAnalyzedHoverTarget = ({
    actionable,
    hoverCacheKey,
    nextTooltipPosition,
    safePath,
    target,
  }: {
    actionable: boolean;
    hoverCacheKey: string;
    nextTooltipPosition: TooltipPosition;
    safePath: HexCoord[] | null;
    target: HexCoord;
  }) => {
    const current = gameRef.current;
    const tile = actionable ? getResolvedTileAt(current, target) : null;
    const actionableTarget = actionable && tile !== null;
    let nextHoveredPath: HexCoord[] | null = null;
    let nextTooltip: TooltipState | null = null;
    let nextTooltipKey: string | null = null;

    if (actionableTarget && tile) {
      nextHoveredPath = safePath && safePath.length > 1 ? safePath : null;

      const enemies = getEnemiesAt(current, target);
      const enemyInfo = enemyWorldTooltip(
        enemies,
        tile.structure,
        showTooltipTagsRef.current,
      );

      if (enemyInfo) {
        nextTooltipKey = `enemy:${target.q},${target.r}:${tile.structure ?? 'none'}`;
        nextTooltip = {
          title: enemyInfo.title,
          lines: enemyInfo.lines,
          contentKey: nextTooltipKey,
          x: nextTooltipPosition.x,
          y: nextTooltipPosition.y,
          borderColor:
            tile.structure === 'dungeon'
              ? TOOLTIP_BORDER_COLORS.dungeonEnemy
              : TOOLTIP_BORDER_COLORS.danger,
          followCursor: true,
        };
      } else {
        const structureInfo = structureWorldTooltip(
          tile,
          showTooltipTagsRef.current,
        );
        if (structureInfo) {
          nextTooltipKey = `structure:${target.q},${target.r}:${tile.structure ?? 'none'}`;
          nextTooltip = {
            title: structureInfo.title,
            lines: structureInfo.lines,
            contentKey: nextTooltipKey,
            x: nextTooltipPosition.x,
            y: nextTooltipPosition.y,
            borderColor: TOOLTIP_BORDER_COLORS.structure,
            followCursor: true,
          };
        }
      }
    }

    commitHoverSnapshot({
      hoverCacheKey,
      nextHoverSnapshot: {
        analysisVersion: hoverAnalysisVersionRef.current,
        target,
        clickable: actionableTarget,
        hoveredMove: actionableTarget ? target : null,
        hoveredSafePath: nextHoveredPath,
        tooltip: nextTooltip,
        tooltipKey: nextTooltipKey,
      },
      nextTooltipPosition,
    });
  };

  syncHoverAnalysisState();

  const clearHoverState = () => {
    invalidatePendingHoverAnalysis();
    hoverPointerRef.current = null;
    if (hoverFrameRef.current !== null) {
      window.cancelAnimationFrame(hoverFrameRef.current);
      hoverFrameRef.current = null;
    }
    canvas.style.cursor = 'default';
    tooltipPositionRef.current = null;
    syncFollowCursorTooltipPosition(null);
    worldTooltipKeyRef.current = null;
    hoverSnapshotRef.current = createEmptyWorldHoverSnapshot(
      hoverAnalysisVersionRef.current,
    );
    if (hoveredMoveRef.current) {
      hoveredMoveRef.current = null;
    }
    if (hoveredSafePathRef.current) {
      hoveredSafePathRef.current = null;
    }
    renderInvalidationRef.current += 1;
    setTooltip(null);
  };

  const resetHoverAnalysis = () => {
    builtWorldHoverAnalysisState = null;
    builtWorldHoverAnalysisStateInputs = null;
    syncHoverAnalysisState();
    invalidatePendingHoverAnalysis();
    hoverAnalysisVersionRef.current += 1;
    hoverAnalysisCacheRef.current.clear();
    clearHoverState();
  };

  const shouldSyncHoverAnalysisState = () =>
    hoverPointerRef.current !== null ||
    hoverSnapshotRef.current.target !== null ||
    hoverAnalysisCacheRef.current.size > 0 ||
    pendingHoverAnalysis !== null;

  const processPointerMove = (clientX: number, clientY: number) => {
    const scenePoint = getScenePoint(clientX, clientY);
    const hexSize = getWorldHexSize(app.screen, gameRef.current.radius);
    const worldCenter = getWorldMovementTransitionSceneCenter({
      hexSize,
      nowMs: performance.now(),
      screen: app.screen,
      transition: movementTransitionRef?.current ?? null,
    });
    const hoveredOffset = hexAtPoint(scenePoint.x, scenePoint.y, {
      centerX: worldCenter.x,
      centerY: worldCenter.y,
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

    if (
      sameCoord(hoverSnapshot.target, target) &&
      hoverSnapshot.analysisVersion === hoverAnalysisVersionRef.current
    ) {
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
    const withinVisibleMap = distance <= getCurrentWorldRevealRadius(current);
    const hoverCacheKey = getHoverAnalysisCacheKey(current, target);
    const cachedHoverSnapshot =
      hoverAnalysisCacheRef.current.get(hoverCacheKey);
    if (
      cachedHoverSnapshot &&
      cachedHoverSnapshot.analysisVersion === hoverAnalysisVersionRef.current
    ) {
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

    if (distance === 0 || !withinVisibleMap) {
      invalidatePendingHoverAnalysis();
      commitAnalyzedHoverTarget({
        actionable: false,
        hoverCacheKey,
        nextTooltipPosition,
        safePath: null,
        target,
      });
      return;
    }

    const tile = getResolvedTileAt(current, target);
    if (!tile) {
      invalidatePendingHoverAnalysis();
      commitAnalyzedHoverTarget({
        actionable: false,
        hoverCacheKey,
        nextTooltipPosition,
        safePath: null,
        target,
      });
      return;
    }

    if (distance === 1) {
      invalidatePendingHoverAnalysis();
      commitAnalyzedHoverTarget({
        actionable: isPassable(tile.terrain),
        hoverCacheKey,
        nextTooltipPosition,
        safePath: null,
        target,
      });
      return;
    }

    const analysisVersion = hoverAnalysisVersionRef.current;
    if (
      pendingHoverAnalysis?.cacheKey === hoverCacheKey &&
      pendingHoverAnalysis.analysisVersion === analysisVersion
    ) {
      return;
    }

    hoverAnalysisRequestToken += 1;
    const analysisToken = hoverAnalysisRequestToken;
    pendingHoverAnalysis = {
      analysisVersion,
      cacheKey: hoverCacheKey,
      token: analysisToken,
    };

    void hoverAnalysisSource
      .analyze(target)
      .then((analysis) => {
        if (
          disposed ||
          hoverAnalysisVersionRef.current !== analysisVersion ||
          pendingHoverAnalysis?.token !== analysisToken
        ) {
          return;
        }

        pendingHoverAnalysis = null;
        const currentTooltipPosition = getCurrentTooltipPosition();
        if (currentTooltipPosition === null) {
          return;
        }

        commitAnalyzedHoverTarget({
          actionable: analysis.actionable,
          hoverCacheKey,
          nextTooltipPosition: currentTooltipPosition,
          safePath: analysis.safePath,
          target,
        });
      })
      .catch((error: unknown) => {
        if (disposed || pendingHoverAnalysis?.token !== analysisToken) {
          return;
        }

        pendingHoverAnalysis = null;
        console.error(error);
      });
  };

  const reprocessCurrentHoverPointer = () => {
    const hoverPointer = hoverPointerRef.current;
    if (!hoverPointer) {
      return;
    }

    processPointerMove(hoverPointer.clientX, hoverPointer.clientY);
  };

  const refreshHoverAnalysis = () => {
    if (!shouldSyncHoverAnalysisState()) {
      return;
    }

    if (!syncHoverAnalysisState()) {
      return;
    }

    invalidatePendingHoverAnalysis();
    hoverAnalysisVersionRef.current += 1;
    hoverAnalysisCacheRef.current.clear();

    if (hoverPointerRef.current == null || hoverFrameRef.current !== null) {
      return;
    }

    reprocessCurrentHoverPointer();
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
      reprocessCurrentHoverPointer();
    });
  };

  const dispose = () => {
    disposed = true;
    invalidatePendingHoverAnalysis();
    if (hoverFrameRef.current !== null) {
      window.cancelAnimationFrame(hoverFrameRef.current);
      hoverFrameRef.current = null;
    }
    void hoverAnalysisSource.dispose().catch((error: unknown) => {
      console.error(error);
    });
  };

  return {
    clearHoverState,
    dispose,
    queuePointerMove,
    refreshHoverAnalysis,
    resetHoverAnalysis,
  };
}
