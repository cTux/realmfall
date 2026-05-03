import { wrap } from 'comlink';
import type { HexCoord } from '../../../../game/stateTypes';
import { createLocalWorldHoverAnalysisSource } from './createLocalWorldHoverAnalysisSource';
import type {
  WorldHoverAnalysisSource,
  WorldHoverAnalysisState,
  WorldHoverAnalysisWorker,
} from './worldHoverAnalysisTypes';

export function createWorkerWorldHoverAnalysisSource(): WorldHoverAnalysisSource {
  const localSource = createLocalWorldHoverAnalysisSource();
  let disposed = false;
  let usingLocalFallback = typeof Worker !== 'function';
  let worker: Worker | null = null;
  let workerApi: WorldHoverAnalysisWorker | null = null;

  const disposeWorker = () => {
    if (worker === null) {
      return;
    }

    worker.removeEventListener('error', handleWorkerError);
    worker.terminate();
    worker = null;
    workerApi = null;
  };

  const switchToLocalFallback = () => {
    if (usingLocalFallback) {
      return;
    }

    usingLocalFallback = true;
    disposeWorker();
  };

  const handleWorkerError = () => {
    switchToLocalFallback();
  };

  if (!usingLocalFallback) {
    try {
      worker = new Worker(
        new URL('./worldHoverAnalysis.worker.ts', import.meta.url),
        {
          name: 'world-hover-analysis',
          type: 'module',
        },
      );
      worker.addEventListener('error', handleWorkerError);
      workerApi = wrap<WorldHoverAnalysisWorker>(worker);
    } catch {
      switchToLocalFallback();
    }
  }

  return {
    async analyze(target: HexCoord) {
      if (usingLocalFallback || workerApi === null) {
        return localSource.analyze(target);
      }

      try {
        return await workerApi.analyze(target);
      } catch {
        switchToLocalFallback();
        return localSource.analyze(target);
      }
    },
    async dispose() {
      if (disposed) {
        return;
      }

      disposed = true;
      disposeWorker();
      await localSource.dispose();
    },
    async syncState(state: WorldHoverAnalysisState) {
      await localSource.syncState(state);
      if (usingLocalFallback || workerApi === null) {
        return;
      }

      try {
        await workerApi.syncState(state);
      } catch {
        switchToLocalFallback();
      }
    },
  };
}
