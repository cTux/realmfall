import { createEasyWebWorker } from 'easy-web-worker';
import type {
  ResolveWorldTilesRequest,
  ResolveWorldTilesResponse,
} from '@realmfall/common';
import { CancelablePromise } from 'easy-cancelable-promise';
import type { TileResolutionSource } from './TileResolutionSource';
import { createLocalTileResolutionSource } from './createLocalTileResolutionSource';

interface PendingWorkerResolution {
  fallback(reason: unknown): void;
}

export function createWorkerTileResolutionSource(): TileResolutionSource {
  const localSource = createLocalTileResolutionSource();
  const pendingResolutions = new Set<PendingWorkerResolution>();
  let workerDisposed = false;
  let worker: ReturnType<
    typeof createEasyWebWorker<
      ResolveWorldTilesRequest,
      ResolveWorldTilesResponse
    >
  > | null = null;

  const disposeWorker = async () => {
    if (workerDisposed || worker === null) {
      return;
    }

    workerDisposed = true;
    await worker.dispose();
  };

  const switchToLocalFallback = (reason: unknown) => {
    void disposeWorker().catch(() => undefined);

    if (pendingResolutions.size === 0) {
      return;
    }

    for (const pendingResolution of [...pendingResolutions]) {
      pendingResolution.fallback(reason);
    }
  };

  worker = createWrappedTileResolutionWorker((error) => {
    switchToLocalFallback(normalizeWorkerResolutionError(error));
  });

  if (worker === null) {
    return localSource;
  }

  return {
    resolve(request) {
      if (workerDisposed) {
        return localSource.resolve(request);
      }

      let workerPromise: ReturnType<typeof worker.send>;
      try {
        workerPromise = worker.send(request);
      } catch (error) {
        switchToLocalFallback(error);
        return localSource.resolve(request);
      }

      return new CancelablePromise((resolve, reject, { onCancel }) => {
        let settled = false;
        let activePromise:
          | CancelablePromise<ResolveWorldTilesResponse>
          | ReturnType<TileResolutionSource['resolve']> = workerPromise;

        const settle = (
          callback: (value: ResolveWorldTilesResponse) => void,
          value: ResolveWorldTilesResponse,
        ) => {
          if (settled) {
            return;
          }

          settled = true;
          pendingResolutions.delete(pendingResolution);
          callback(value);
        };
        const settleError = (reason: unknown) => {
          if (settled) {
            return;
          }

          settled = true;
          pendingResolutions.delete(pendingResolution);
          reject(reason);
        };
        const pendingResolution: PendingWorkerResolution = {
          fallback(reason) {
            if (settled) {
              return;
            }

            pendingResolutions.delete(this);
            activePromise.cancel(reason);
            activePromise = localSource.resolve(request);
            activePromise.then(
              (response) => settle(resolve, response),
              settleError,
            );
          },
        };

        pendingResolutions.add(pendingResolution);
        onCancel((reason) => {
          pendingResolutions.delete(pendingResolution);
          settled = true;
          activePromise.cancel(reason);
        });

        workerPromise.then(
          (response) => settle(resolve, response),
          (error) => {
            if (settled) {
              return;
            }

            if (workerPromise.status === 'canceled' && !workerDisposed) {
              settleError(error);
              return;
            }

            switchToLocalFallback(error);
          },
        );
      });
    },
    async dispose() {
      await Promise.all([localSource.dispose(), disposeWorker()]);
    },
  };
}

function normalizeWorkerResolutionError(error: ErrorEvent | unknown) {
  if (error instanceof Error) {
    return error;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return new Error(error.message);
  }

  return new Error('World tile resolution worker failed.');
}

function createWrappedTileResolutionWorker(
  onWorkerError: (error: ErrorEvent | unknown) => void,
) {
  if (typeof Worker !== 'function') {
    return null;
  }

  let workerInstance: Worker | null = null;
  try {
    workerInstance = new Worker(
      new URL('./worldTileResolution.worker.ts', import.meta.url),
      {
        name: 'world-tile-resolution',
        type: 'module',
      },
    );

    return createEasyWebWorker<
      ResolveWorldTilesRequest,
      ResolveWorldTilesResponse
    >(workerInstance, {
      keepAlive: true,
      name: 'world-tile-resolution',
      onWorkerError,
    });
  } catch {
    workerInstance?.terminate();
    return null;
  }
}
