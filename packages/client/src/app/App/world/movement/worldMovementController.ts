import { hexDistance, type HexCoord } from '../../../../game/hex';
import type { WorldMoveSource } from './worldMoveSource';

type ScheduledRetryHandle = ReturnType<typeof setTimeout>;

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
  let activeRequestId: string | null = null;
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

  const requestNextStep = async () => {
    if (disposed || activeRequestId !== null) {
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
    activeRequestId = requestId;

    const response = await moveSource.requestMove({
      requestId,
      target: nextStep,
    });

    if (disposed || activeRequestId !== requestId) {
      return;
    }

    activeRequestId = null;
    if (response.requestId !== requestId) {
      return;
    }

    if (!response.ok) {
      emitCooldownChange(now() + response.remainingCooldownMs);
      scheduleRetry(response.remainingCooldownMs);
      return;
    }

    if (queuedSteps[0]?.q === nextStep.q && queuedSteps[0]?.r === nextStep.r) {
      queuedSteps = queuedSteps.slice(1);
    }
    applyApprovedStep(nextStep);
    emitCooldownChange(now() + response.cooldownMs);

    if (queuedSteps.length > 0) {
      scheduleRetry(response.cooldownMs);
    }
  };

  return {
    replaceQueuedPath(nextSteps: HexCoord[]) {
      queuedSteps = [...nextSteps];
      if (queuedSteps.length === 0) {
        clearRetryTimer();
        activeRequestId = null;
        clearCooldownIfExpired();
        return;
      }

      if (activeRequestId !== null || retryTimer !== null) {
        return;
      }

      void requestNextStep();
    },

    clear() {
      clearQueuedPath();
      activeRequestId = null;
      clearCooldownIfExpired();
    },

    dispose() {
      disposed = true;
      clearQueuedPath();
      activeRequestId = null;
      emitCooldownChange(null);
    },
  };
}
