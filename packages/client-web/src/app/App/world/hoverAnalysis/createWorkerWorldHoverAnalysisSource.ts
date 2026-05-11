import { wrap } from 'comlink';
import type { HexCoord } from '@realmfall/core/game/stateTypes';
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
  let latestState: WorldHoverAnalysisState | null = null;

  const disposeWorker = () => {
    if (worker === null) {
      return;
    }

    worker.removeEventListener('error', handleWorkerError);
    worker.terminate();
    worker = null;
    workerApi = null;
  };

  const replayLatestStateInLocalSource = async () => {
    if (latestState === null) {
      return;
    }

    await localSource.syncState(latestState);
  };

  const switchToLocalFallback = async () => {
    if (usingLocalFallback) {
      return;
    }

    usingLocalFallback = true;
    disposeWorker();
    await replayLatestStateInLocalSource();
  };

  const handleWorkerError = () => {
    void switchToLocalFallback().catch((error: unknown) => {
      console.error(error);
    });
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
      void switchToLocalFallback().catch((error: unknown) => {
        console.error(error);
      });
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
        await switchToLocalFallback();
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
      latestState = state;
      if (usingLocalFallback || workerApi === null) {
        await localSource.syncState(state);
        return;
      }

      try {
        await workerApi.syncState(state);
      } catch {
        await switchToLocalFallback();
      }
    },
  };
}
