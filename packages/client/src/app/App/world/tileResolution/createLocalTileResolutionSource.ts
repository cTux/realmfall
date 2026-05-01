import { CancelablePromise } from 'easy-cancelable-promise';
import { resolveWorldTiles } from '../../../../game/worldTileResolutionPayloads';
import type { TileResolutionSource } from './TileResolutionSource';

export function createLocalTileResolutionSource(): TileResolutionSource {
  return {
    resolve(request) {
      return CancelablePromise.resolve(resolveWorldTiles(request));
    },
    async dispose() {},
  };
}
