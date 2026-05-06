import { hexDistance, type HexCoord } from '../../../../game/hex';
import type { WorldMoveSource } from './worldMoveSource';

type ScheduledRetryHandle = ReturnType<typeof setTimeout>;

export type WorldMovementAutoOpenSuppressionState =
  | 'idle'
  | 'travel'
  | 'combat';

interface ActiveMoveRequest {
  applyOptions?: ApplyApprovedStepOptions;
  requestId: string;
  requestedAtMs: number;
  step: HexCoord;
}

interface ApplyApprovedStepOptions {
  engageMode?: 'adjacent-click' | 'staged-click';
  engageTargetCoord?: HexCoord;
}

interface ApplyApprovedStepResult {
  combatStarted: boolean;
}

interface PendingHostileApproach {
  engageTargetCoord: HexCoord;
}

export function createWorldMovementController({
  moveSource,
  now,
  getCurrentCoord,
  schedule,
  clearScheduled,
  applyApprovedStep,
  onCooldownChange,
  onAutoOpenSuppressionStateChange = () => undefined,
}: {
  moveSource: WorldMoveSource;
  now: () => number;
  getCurrentCoord: () => HexCoord;
  schedule: (callback: () => void, delayMs: number) => ScheduledRetryHandle;
  clearScheduled: (timerId: ScheduledRetryHandle) => void;
  applyApprovedStep: (
    step: HexCoord,
    options?: ApplyApprovedStepOptions,
  ) => ApplyApprovedStepResult;
  onCooldownChange: (endAtMs: number | null) => void;
  onAutoOpenSuppressionStateChange?: (
    state: WorldMovementAutoOpenSuppressionState,
  ) => void;
}) {
  let queuedSteps: HexCoord[] = [];
  let pendingHostileApproach: PendingHostileApproach | null = null;
  let cooldownEndAtMs: number | null = null;
  let enforcedCooldownEndAtMs: number | null = null;
  let retryTimer: ScheduledRetryHandle | null = null;
  let requestSequence = 0;
  let activeRequest: ActiveMoveRequest | null = null;
  let autoOpenSuppressionState: WorldMovementAutoOpenSuppressionState = 'idle';
  let disposed = false;

  const emitCooldownChange = (nextCooldownEndAtMs: number | null) => {
    if (cooldownEndAtMs === nextCooldownEndAtMs) {
      return;
    }

    cooldownEndAtMs = nextCooldownEndAtMs;
    onCooldownChange(nextCooldownEndAtMs);
  };

  const emitAutoOpenSuppressionStateChange = (
    nextState: WorldMovementAutoOpenSuppressionState,
  ) => {
    if (autoOpenSuppressionState === nextState) {
      return;
    }

    autoOpenSuppressionState = nextState;
    onAutoOpenSuppressionStateChange(nextState);
  };

  const clearRetryTimer = () => {
    if (retryTimer === null) {
      return;
    }

    clearScheduled(retryTimer);
    retryTimer = null;
  };

  const clearQueuedPath = () => {
    queuedSteps = [];
    pendingHostileApproach = null;
    clearRetryTimer();
  };

  const clearQueuedTravel = ({
    nextAutoOpenSuppressionState = 'idle',
  }: {
    nextAutoOpenSuppressionState?: WorldMovementAutoOpenSuppressionState;
  } = {}) => {
    clearQueuedPath();
    emitAutoOpenSuppressionStateChange(nextAutoOpenSuppressionState);
  };

  const scheduleRetry = (delayMs: number) => {
    clearRetryTimer();
    retryTimer = schedule(() => {
      retryTimer = null;
      void requestNextStep();
    }, delayMs);
  };

  const clearCooldownIfExpired = () => {
    if (cooldownEndAtMs !== null && cooldownEndAtMs > now()) {
      return;
    }

    emitCooldownChange(null);
  };

  const getRemainingEnforcedCooldownMs = () => {
    if (enforcedCooldownEndAtMs === null) {
      return 0;
    }

    const remainingCooldownMs = enforcedCooldownEndAtMs - now();
    if (remainingCooldownMs > 0) {
      return remainingCooldownMs;
    }

    enforcedCooldownEndAtMs = null;
    clearCooldownIfExpired();
    return 0;
  };

  const syncCooldown = (deadlineMs: number) => {
    if (deadlineMs <= now()) {
      emitCooldownChange(null);
      return 0;
    }

    emitCooldownChange(deadlineMs);
    return Math.max(0, deadlineMs - now());
  };

  const queuePath = ({
    nextPendingHostileApproach = null,
    nextSteps,
  }: {
    nextPendingHostileApproach?: PendingHostileApproach | null;
    nextSteps: HexCoord[];
  }) => {
    pendingHostileApproach = nextPendingHostileApproach;
    queuedSteps = [...nextSteps];
    if (queuedSteps.length === 0) {
      clearRetryTimer();
      emitAutoOpenSuppressionStateChange('idle');
      clearCooldownIfExpired();
      return;
    }

    if (nextSteps.length > 1) {
      emitAutoOpenSuppressionStateChange('travel');
    } else if (autoOpenSuppressionState === 'travel') {
      emitAutoOpenSuppressionStateChange('idle');
    }

    if (activeRequest !== null || retryTimer !== null) {
      return;
    }

    void requestNextStep();
  };

  const requestNextStep = async () => {
    if (disposed || activeRequest !== null) {
      return;
    }

    const nextStep = queuedSteps[0];
    if (!nextStep) {
      emitAutoOpenSuppressionStateChange('idle');
      emitCooldownChange(null);
      return;
    }

    if (hexDistance(getCurrentCoord(), nextStep) !== 1) {
      clearQueuedTravel();
      emitCooldownChange(null);
      return;
    }

    const remainingCooldownMs = getRemainingEnforcedCooldownMs();
    if (remainingCooldownMs > 0) {
      scheduleRetry(remainingCooldownMs);
      return;
    }

    requestSequence += 1;
    const requestId = `world-move-${requestSequence}`;
    const applyOptions =
      pendingHostileApproach !== null && queuedSteps.length === 1
        ? {
            engageMode: 'staged-click' as const,
            engageTargetCoord: pendingHostileApproach.engageTargetCoord,
          }
        : undefined;
    const request = {
      applyOptions,
      requestId,
      requestedAtMs: now(),
      step: nextStep,
    } satisfies ActiveMoveRequest;
    activeRequest = request;

    try {
      const response = await moveSource.requestMove({
        requestId,
        target: nextStep,
      });

      if (disposed || activeRequest?.requestId !== requestId) {
        return;
      }

      activeRequest = null;
      if (response.requestId !== requestId) {
        return;
      }

      const cooldownDeadlineMs =
        request.requestedAtMs +
        (response.ok ? response.cooldownMs : response.remainingCooldownMs);
      const retryDelayMs = syncCooldown(cooldownDeadlineMs);

      if (!response.ok) {
        if (queuedSteps.length > 0) {
          if (retryDelayMs === 0) {
            void requestNextStep();
            return;
          }

          scheduleRetry(retryDelayMs);
        }
        return;
      }

      if (
        queuedSteps[0]?.q === request.step.q &&
        queuedSteps[0]?.r === request.step.r
      ) {
        queuedSteps = queuedSteps.slice(1);
        if (queuedSteps.length === 0) {
          pendingHostileApproach = null;
        }
      }

      const appliedStep = applyApprovedStep(request.step, request.applyOptions);

      if (appliedStep.combatStarted) {
        clearQueuedTravel({ nextAutoOpenSuppressionState: 'combat' });
        return;
      }

      if (queuedSteps.length === 0) {
        emitAutoOpenSuppressionStateChange('idle');
        return;
      }

      if (retryDelayMs === 0) {
        void requestNextStep();
        return;
      }

      scheduleRetry(retryDelayMs);
    } catch {
      if (disposed || activeRequest?.requestId !== requestId) {
        return;
      }

      activeRequest = null;
      clearCooldownIfExpired();
    }
  };

  return {
    getQueuedPath() {
      return queuedSteps.length > 0 ? queuedSteps : null;
    },

    replaceQueuedPath(nextSteps: HexCoord[]) {
      queuePath({ nextSteps });
    },

    queueHostileApproach(nextSteps: HexCoord[], engageTargetCoord: HexCoord) {
      queuePath({
        nextPendingHostileApproach:
          nextSteps.length === 0
            ? null
            : {
                engageTargetCoord: { ...engageTargetCoord },
              },
        nextSteps,
      });
    },

    startHostileEngagement(targetCoord: HexCoord) {
      clearQueuedTravel();
      const appliedStep = applyApprovedStep(targetCoord, {
        engageMode: 'adjacent-click',
        engageTargetCoord: targetCoord,
      });
      if (appliedStep.combatStarted) {
        emitAutoOpenSuppressionStateChange('combat');
        return;
      }

      clearCooldownIfExpired();
    },

    clear() {
      clearQueuedTravel({
        nextAutoOpenSuppressionState:
          autoOpenSuppressionState === 'combat' ? 'combat' : 'idle',
      });
      clearCooldownIfExpired();
    },

    releaseCombatAutoOpenSuppression() {
      if (autoOpenSuppressionState !== 'combat') {
        return;
      }

      emitAutoOpenSuppressionStateChange('idle');
    },

    seedCooldownUntil(endAtMs: number) {
      enforcedCooldownEndAtMs =
        enforcedCooldownEndAtMs === null
          ? endAtMs
          : Math.max(enforcedCooldownEndAtMs, endAtMs);
      const nextCooldownEndAtMs =
        cooldownEndAtMs === null
          ? enforcedCooldownEndAtMs
          : Math.max(cooldownEndAtMs, enforcedCooldownEndAtMs);
      const remainingCooldownMs = syncCooldown(nextCooldownEndAtMs);
      if (remainingCooldownMs === 0 || queuedSteps.length === 0) {
        return;
      }

      if (activeRequest === null) {
        scheduleRetry(remainingCooldownMs);
      }
    },

    dispose() {
      disposed = true;
      clearQueuedTravel();
      activeRequest = null;
      enforcedCooldownEndAtMs = null;
      emitCooldownChange(null);
    },
  };
}
