import { useEffect } from 'react';
import type { TooltipPosition } from '@realmfall/ui-react';
import type { MutableRefObject } from 'react';
import { type HexCoord, type GameState } from '../../../game/stateTypes';
import { createEmptyWorldHoverSnapshot } from './worldHoverSnapshot';
import type { TooltipState } from '../types';
import type { WorldHoverAnalysisController } from './pixiWorldHoverInteractions';
import type { WorldHoverSnapshot } from './worldHoverSnapshot';

interface UsePixiWorldHoverLifecycleArgs {
  interactionBlocked: boolean;
  playerCoord: HexCoord;
  game: Pick<
    GameState,
    | 'combat'
    | 'gameOver'
    | 'activeWorldId'
    | 'radius'
    | 'turn'
  >;
  hoverAnalysisCacheRef: MutableRefObject<Map<string, WorldHoverSnapshot>>;
  hoverAnalysisControllerRef: MutableRefObject<WorldHoverAnalysisController | null>;
  hoverAnalysisVersionRef: MutableRefObject<number>;
  hoverPointerRef: MutableRefObject<{
    clientX: number;
    clientY: number;
  } | null>;
  hoverSnapshotRef: MutableRefObject<WorldHoverSnapshot>;
  hoveredMoveRef: MutableRefObject<HexCoord | null>;
  hoveredSafePathRef: MutableRefObject<HexCoord[] | null>;
  selectedRef: MutableRefObject<HexCoord>;
  setTooltip: (nextTooltip: TooltipState | null) => void;
  tooltipPositionRef: MutableRefObject<TooltipPosition | null>;
  worldTooltipKeyRef: MutableRefObject<string | null>;
}

export function usePixiWorldHoverLifecycle({
  interactionBlocked,
  playerCoord,
  game,
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
}: UsePixiWorldHoverLifecycleArgs): void {
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
  }, [
    hoverAnalysisCacheRef,
    hoverAnalysisControllerRef,
    hoverAnalysisVersionRef,
    hoverPointerRef,
    hoverSnapshotRef,
    hoveredMoveRef,
    hoveredSafePathRef,
    playerCoord,
    selectedRef,
    setTooltip,
    tooltipPositionRef,
    worldTooltipKeyRef,
  ]);

  useEffect(() => {
    hoverAnalysisControllerRef.current?.refreshHoverAnalysis();
  }, [
    hoverAnalysisControllerRef,
    game.combat,
    game.gameOver,
    game.activeWorldId,
    game.radius,
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
  }, [
    interactionBlocked,
    hoverAnalysisControllerRef,
    setTooltip,
    tooltipPositionRef,
    worldTooltipKeyRef,
  ]);
}
