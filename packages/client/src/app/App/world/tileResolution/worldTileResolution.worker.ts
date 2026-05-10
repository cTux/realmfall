import { createStaticEasyWebWorker } from 'easy-web-worker';
import type {
  ResolveWorldTilesRequest,
  ResolveWorldTilesResponse,
} from '@realmfall/common';
import { resolveWorldTiles } from '@realmfall/core/game/worldTileResolutionPayloads';

createStaticEasyWebWorker<ResolveWorldTilesRequest, ResolveWorldTilesResponse>(
  (message) => {
    message.resolve(resolveWorldTiles(message.payload));
  },
);
