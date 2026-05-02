import { hexDistance, type HexCoord } from '../../../../game/hex';
import type { WorldMoveSource } from './worldMoveSource';

type ScheduledRetryHandle = ReturnType<typeof setTimeout>;

interface ActiveMoveRequest {
  requestId: string;
  requestedAtMs: number;
  step: HexCoord;
}

export function createWorldMovementController({
  moveSource,
  now,
  getCurrentCoord,
  schedule,
  clearScheduled,
  applyApprovedStep,
  onCooldownChange,
}: {
  moveSource: WorldMoveSource;
  now: () => number;
  getCurrentCoord: () => HexCoord;
  schedule: (callback: () => void, delayMs: number) => ScheduledRetryHandle;
  clearScheduled: (timerId: ScheduledRetryHandle) => void;
  applyApprovedStep: (step: HexCoord) => void;
  onCooldownChange: (endAtMs: number | null) => void;
}) {
  let queuedSteps: HexCoord[] = [];
  let cooldownEndAtMs: number | null = null;
  let retryTimer: ScheduledRetryHandle | null = null;
  let requestSequence = 0;
  let activeRequest: ActiveMoveRequest | null = null;
  let disposed = false;

  const emitCooldownChange = (nextCooldownEndAtMs: number | null) => {
    if (cooldownEndAtMs === nextCooldownEndAtMs) {
      return;
    }

    cooldownEndAtMs = nextCooldownEndAtMs;
    onCooldownChange(nextCooldownEndAtMs);
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
    clearRetryTimer();
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

  const syncCooldown = (deadlineMs: number) => {
    if (deadlineMs <= now()) {
      emitCooldownChange(null);
      return 0;
    }

    emitCooldownChange(deadlineMs);
    return Math.max(0, deadlineMs - now());
  };

  const requestNextStep = async () => {
    if (disposed || activeRequest !== null) {
      return;
    }

    const nextStep = queuedSteps[0];
    if (!nextStep) {
      emitCooldownChange(null);
      return;
    }

    if (hexDistance(getCurrentCoord(), nextStep) !== 1) {
      clearQueuedPath();
      emitCooldownChange(null);
      return;
    }

    requestSequence += 1;
    const requestId = `world-move-${requestSequence}`;
    const request = {
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
      }
      applyApprovedStep(request.step);

      if (queuedSteps.length > 0) {
        if (retryDelayMs === 0) {
          void requestNextStep();
          return;
        }

        scheduleRetry(retryDelayMs);
      }
    } catch {
      if (disposed || activeRequest?.requestId !== requestId) {
        return;
      }

      activeRequest = null;
      clearCooldownIfExpired();
    }
  };

  return {
    replaceQueuedPath(nextSteps: HexCoord[]) {
      queuedSteps = [...nextSteps];
      if (queuedSteps.length === 0) {
        clearRetryTimer();
        clearCooldownIfExpired();
        return;
      }

      if (activeRequest !== null || retryTimer !== null) {
        return;
      }

      void requestNextStep();
    },

    clear() {
      clearQueuedPath();
      clearCooldownIfExpired();
    },

    dispose() {
      disposed = true;
      clearQueuedPath();
      activeRequest = null;
      emitCooldownChange(null);
    },
  };
}
