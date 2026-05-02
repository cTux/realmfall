import type {
  ResolveWorldTilesRequest,
  ResolveWorldTilesResponse,
} from '@realmfall/common';
import type { CancelablePromise } from 'easy-cancelable-promise';

export interface TileResolutionSource {
  resolve(
    request: ResolveWorldTilesRequest,
  ): CancelablePromise<ResolveWorldTilesResponse>;
  dispose(): Promise<void>;
}
