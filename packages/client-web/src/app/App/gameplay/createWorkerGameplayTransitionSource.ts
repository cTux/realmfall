import { wrap } from 'comlink';
import { createLocalGameplayTransitionSource } from './createLocalGameplayTransitionSource';
import type { GameplayTransitionSource } from './gameplayTransitionSourceTypes';
import type { GameplayTransitionWorker } from './gameplayTransitionSourceTypes';

export function createWorkerGameplayTransitionSource(): GameplayTransitionSource {
  const localSource = createLocalGameplayTransitionSource();
  let disposed = false;
  let usingLocalFallback = typeof Worker !== 'function';
  let worker: Worker | null = null;
  let workerApi: GameplayTransitionWorker | null = null;

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
        new URL('./gameplayTransition.worker.ts', import.meta.url),
        {
          name: 'gameplay-transition',
          type: 'module',
        },
      );
      worker.addEventListener('error', handleWorkerError);
      workerApi = wrap<GameplayTransitionWorker>(worker);
    } catch {
      switchToLocalFallback();
    }
  }

  return {
    async dispose() {
      if (disposed) {
        return;
      }

      disposed = true;
      disposeWorker();
      await localSource.dispose();
    },
    async moveToTile(state, target, options) {
      if (usingLocalFallback || workerApi === null) {
        return localSource.moveToTile(state, target, options);
      }

      try {
        return await workerApi.moveToTile(state, target, options);
      } catch {
        switchToLocalFallback();
        return localSource.moveToTile(state, target, options);
      }
    },
    async progressCombat(state, worldTimeMs) {
      if (usingLocalFallback || workerApi === null) {
        return localSource.progressCombat(state, worldTimeMs);
      }

      try {
        return await workerApi.progressCombat(state, worldTimeMs);
      } catch {
        switchToLocalFallback();
        return localSource.progressCombat(state, worldTimeMs);
      }
    },
    async startCombat(state, worldTimeMs) {
      if (usingLocalFallback || workerApi === null) {
        return localSource.startCombat(state, worldTimeMs);
      }

      try {
        return await workerApi.startCombat(state, worldTimeMs);
      } catch {
        switchToLocalFallback();
        return localSource.startCombat(state, worldTimeMs);
      }
    },
  };
}
