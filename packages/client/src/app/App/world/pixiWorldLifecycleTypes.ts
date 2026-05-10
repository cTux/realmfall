import type { HexCoord } from '@realmfall/core/game/stateTypes';
import type { WorldMovementAutoOpenSuppressionState } from './movement/worldMovementController';

export interface WorldMovementController {
  clear(): void;
  dispose(): void;
  getQueuedPath(): HexCoord[] | null;
  queueHostileApproach(
    nextSteps: HexCoord[],
    engageTargetCoord: HexCoord,
  ): void;
  releaseCombatAutoOpenSuppression(): void;
  replaceQueuedPath(nextSteps: HexCoord[]): void;
  seedCooldownUntil(endAtMs: number): void;
  startHostileEngagement(targetCoord: HexCoord): void;
}

export { WorldMovementAutoOpenSuppressionState };
