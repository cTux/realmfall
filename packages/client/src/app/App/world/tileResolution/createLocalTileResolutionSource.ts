import { CancelablePromise } from 'easy-cancelable-promise';
import { resolveWorldTiles } from '@realmfall/core/game/worldTileResolutionPayloads';
import type { TileResolutionSource } from './TileResolutionSource';

export function createLocalTileResolutionSource(): TileResolutionSource {
  return {
    resolve(request) {
      return new CancelablePromise((resolve, reject, { onCancel }) => {
        const timerId = setTimeout(() => {
          try {
            resolve(resolveWorldTiles(request));
          } catch (error) {
            reject(error);
          }
        }, 0);

        onCancel(() => {
          clearTimeout(timerId);
        });
      });
    },
    async dispose() {},
  };
}
