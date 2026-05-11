import { useEffect } from 'react';
import type { GameState } from '@realmfall/core/game/stateTypes';
import type { MutableRefObject } from 'react';
import {
  type WorldMovementController,
  type WorldMovementAutoOpenSuppressionState,
} from './pixiWorldLifecycleTypes';

interface UsePixiWorldQueuedTravelSuppressionArgs {
  combat: GameState['combat'];
  movementControllerRef: MutableRefObject<WorldMovementController | null>;
  queuedTravelAutoOpenSuppressionState: WorldMovementAutoOpenSuppressionState;
}

export function usePixiWorldQueuedTravelSuppression({
  combat,
  movementControllerRef,
  queuedTravelAutoOpenSuppressionState,
}: UsePixiWorldQueuedTravelSuppressionArgs): void {
  useEffect(() => {
    if (!combat) {
      if (queuedTravelAutoOpenSuppressionState === 'combat') {
        movementControllerRef.current?.releaseCombatAutoOpenSuppression();
      }
      return;
    }

    movementControllerRef.current?.clear();
  }, [combat, movementControllerRef, queuedTravelAutoOpenSuppressionState]);
}
