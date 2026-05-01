import { createEasyWebWorker } from 'easy-web-worker';
import type {
  ResolveWorldTilesRequest,
  ResolveWorldTilesResponse,
} from '@realmfall/common';
import type { TileResolutionSource } from './TileResolutionSource';

export function createWorkerTileResolutionSource(): TileResolutionSource {
  const worker = createEasyWebWorker<
    ResolveWorldTilesRequest,
    ResolveWorldTilesResponse
  >(new URL('./worldTileResolution.worker.ts', import.meta.url), {
    keepAlive: true,
    name: 'world-tile-resolution',
    workerOptions: { type: 'module' },
  });

  return {
    resolve(request) {
      return worker.send(request);
    },
    async dispose() {
      await worker.dispose();
    },
  };
}
