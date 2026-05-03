import type { HexCoord } from '../../../../game/stateTypes';
import {
  analyzeWorldHoverTarget,
  EMPTY_WORLD_HOVER_ANALYSIS_RESULT,
} from './worldHoverAnalysisRuntime';
import type {
  WorldHoverAnalysisSource,
  WorldHoverAnalysisState,
} from './worldHoverAnalysisTypes';

export function createLocalWorldHoverAnalysisSource(): WorldHoverAnalysisSource {
  let currentState: WorldHoverAnalysisState | null = null;

  return {
    async analyze(target: HexCoord) {
      if (currentState === null) {
        return EMPTY_WORLD_HOVER_ANALYSIS_RESULT;
      }

      return analyzeWorldHoverTarget(currentState, target);
    },
    async dispose() {},
    async syncState(state: WorldHoverAnalysisState) {
      currentState = state;
    },
  };
}
