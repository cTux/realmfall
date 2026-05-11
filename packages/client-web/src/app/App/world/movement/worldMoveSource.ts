import type { WorldMoveRequest, WorldMoveResponse } from '@realmfall/common';

export interface WorldMoveSource {
  requestMove(request: WorldMoveRequest): Promise<WorldMoveResponse>;
}
