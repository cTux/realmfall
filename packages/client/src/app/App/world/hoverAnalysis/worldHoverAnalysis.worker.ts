import { expose } from 'comlink';
import type { HexCoord } from '../../../../game/stateTypes';
import {
  analyzeWorldHoverTarget,
  EMPTY_WORLD_HOVER_ANALYSIS_RESULT,
} from './worldHoverAnalysisRuntime';
import type {
  WorldHoverAnalysisState,
  WorldHoverAnalysisWorker,
} from './worldHoverAnalysisTypes';

let currentState: WorldHoverAnalysisState | null = null;

const workerApi: WorldHoverAnalysisWorker = {
  async analyze(target: HexCoord) {
    if (currentState === null) {
      return EMPTY_WORLD_HOVER_ANALYSIS_RESULT;
    }

    return analyzeWorldHoverTarget(currentState, target);
  },
  async syncState(state: WorldHoverAnalysisState) {
    currentState = state;
  },
};

expose(workerApi);
