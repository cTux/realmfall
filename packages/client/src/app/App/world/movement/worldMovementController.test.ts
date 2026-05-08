import type { WorldMoveResponse } from '@realmfall/common';
import { describe, expect, it, vi } from 'vitest';
import type { HexCoord } from '../../../../game/hex';
import { createWorldMovementController } from './worldMovementControllerTestkit';
import type { WorldMoveSource } from './worldMoveSource';

const flushMicrotasks = () => Promise.resolve();

const createDeferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return {
    promise,
    reject,
    resolve,
  };
};

describe('createWorldMovementController', () => {
  it('retries a queued step after a cooldown denial', async () => {
    vi.useFakeTimers();
    const appliedSteps: HexCoord[] = [];
    const onCooldownChange = vi.fn();
    const requestMove = vi
      .fn<WorldMoveSource['requestMove']>()
      .mockResolvedValueOnce({
        ok: false,
        requestId: 'world-move-1',
        remainingCooldownMs: 500,
      })
      .mockResolvedValueOnce({
        ok: true,
        requestId: 'world-move-2',
        cooldownMs: 1_000,
      });

    const controller = createWorldMovementController({
      moveSource: { requestMove },
      now: () => 0,
      getCurrentCoord: () => ({ q: 0, r: 0 }),
      schedule: (callback, delayMs) => setTimeout(callback, delayMs),
      clearScheduled: (timerId) => clearTimeout(timerId),
      applyApprovedStep: (step) => {
        appliedSteps.push(step);
        return { combatStarted: false };
      },
      onCooldownChange,
    });

    controller.replaceQueuedPath([{ q: 1, r: 0 }]);
    await flushMicrotasks();

    expect(appliedSteps).toEqual([]);
    expect(onCooldownChange).toHaveBeenCalledWith(500);
    expect(requestMove).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(500);

    expect(appliedSteps).toEqual([{ q: 1, r: 0 }]);
    expect(requestMove).toHaveBeenCalledTimes(2);

    controller.dispose();
    vi.useRealTimers();
  });

  it('does not wedge when the move request rejects and a later replacement path proceeds', async () => {
    const appliedSteps: HexCoord[] = [];
    const requestMove = vi
      .fn<WorldMoveSource['requestMove']>()
      .mockRejectedValueOnce(new Error('temporary outage'))
      .mockResolvedValueOnce({
        ok: true,
        requestId: 'world-move-2',
        cooldownMs: 1_000,
      });

    const controller = createWorldMovementController({
      moveSource: { requestMove },
      now: () => 0,
      getCurrentCoord: () => ({ q: 0, r: 0 }),
      schedule: (callback, delayMs) => setTimeout(callback, delayMs),
      clearScheduled: (timerId) => clearTimeout(timerId),
      applyApprovedStep: (step) => {
        appliedSteps.push(step);
        return { combatStarted: false };
      },
      onCooldownChange: vi.fn(),
    });

    controller.replaceQueuedPath([{ q: 1, r: 0 }]);
    await flushMicrotasks();
    await flushMicrotasks();

    controller.replaceQueuedPath([{ q: 1, r: -1 }]);
    await flushMicrotasks();

    expect(requestMove).toHaveBeenCalledTimes(2);
    expect(appliedSteps).toEqual([{ q: 1, r: -1 }]);

    controller.dispose();
  });

  it('auto-continues one approved step per cooldown window', async () => {
    vi.useFakeTimers();
    let currentCoord: HexCoord = { q: 0, r: 0 };
    let now = 0;
    const appliedSteps: HexCoord[] = [];
    const requestMove = vi
      .fn<WorldMoveSource['requestMove']>()
      .mockImplementation(async (request) => ({
        ok: true,
        requestId: request.requestId,
        cooldownMs: 1_000,
      }));

    const controller = createWorldMovementController({
      moveSource: { requestMove },
      now: () => now,
      getCurrentCoord: () => currentCoord,
      schedule: (callback, delayMs) => setTimeout(callback, delayMs),
      clearScheduled: (timerId) => clearTimeout(timerId),
      applyApprovedStep: (step) => {
        appliedSteps.push(step);
        currentCoord = step;
        now += 1;
        return { combatStarted: false };
      },
      onCooldownChange: vi.fn(),
    });

    controller.replaceQueuedPath([
      { q: 1, r: 0 },
      { q: 2, r: 0 },
    ]);
    await flushMicrotasks();

    expect(appliedSteps).toEqual([{ q: 1, r: 0 }]);

    await vi.advanceTimersByTimeAsync(1_000);

    expect(appliedSteps).toEqual([
      { q: 1, r: 0 },
      { q: 2, r: 0 },
    ]);
    expect(requestMove).toHaveBeenCalledTimes(2);

    controller.dispose();
    vi.useRealTimers();
  });

  it('replaces queued continuation during cooldown without canceling the active cooldown', async () => {
    vi.useFakeTimers();
    let currentCoord: HexCoord = { q: 0, r: 0 };
    const requestedTargets: HexCoord[] = [];
    const requestMove = vi
      .fn<WorldMoveSource['requestMove']>()
      .mockImplementation(async (request) => {
        requestedTargets.push(request.target);
        return {
          ok: true,
          requestId: request.requestId,
          cooldownMs: 1_000,
        };
      });

    const controller = createWorldMovementController({
      moveSource: { requestMove },
      now: () => 0,
      getCurrentCoord: () => currentCoord,
      schedule: (callback, delayMs) => setTimeout(callback, delayMs),
      clearScheduled: (timerId) => clearTimeout(timerId),
      applyApprovedStep: (step) => {
        currentCoord = step;
        return { combatStarted: false };
      },
      onCooldownChange: vi.fn(),
    });

    controller.replaceQueuedPath([
      { q: 1, r: 0 },
      { q: 2, r: 0 },
    ]);
    await flushMicrotasks();

    controller.replaceQueuedPath([{ q: 1, r: -1 }]);
    await vi.advanceTimersByTimeAsync(1_000);

    expect(requestedTargets).toEqual([
      { q: 1, r: 0 },
      { q: 1, r: -1 },
    ]);

    controller.dispose();
    vi.useRealTimers();
  });

  it('keeps an in-flight approved step after clear() but drops queued continuation', async () => {
    vi.useFakeTimers();
    let currentCoord: HexCoord = { q: 0, r: 0 };
    const appliedSteps: HexCoord[] = [];
    const firstResponse = createDeferred<WorldMoveResponse>();
    const requestMove = vi
      .fn<WorldMoveSource['requestMove']>()
      .mockImplementationOnce(() => firstResponse.promise)
      .mockImplementation(async (request) => ({
        ok: true,
        requestId: request.requestId,
        cooldownMs: 1_000,
      }));

    const controller = createWorldMovementController({
      moveSource: { requestMove },
      now: () => 0,
      getCurrentCoord: () => currentCoord,
      schedule: (callback, delayMs) => setTimeout(callback, delayMs),
      clearScheduled: (timerId) => clearTimeout(timerId),
      applyApprovedStep: (step) => {
        appliedSteps.push(step);
        currentCoord = step;
        return { combatStarted: false };
      },
      onCooldownChange: vi.fn(),
    });

    controller.replaceQueuedPath([
      { q: 1, r: 0 },
      { q: 2, r: 0 },
    ]);
    await flushMicrotasks();

    controller.clear();
    firstResponse.resolve({
      ok: true,
      requestId: 'world-move-1',
      cooldownMs: 1_000,
    });
    await flushMicrotasks();

    expect(appliedSteps).toEqual([{ q: 1, r: 0 }]);

    await vi.advanceTimersByTimeAsync(1_000);

    expect(requestMove).toHaveBeenCalledTimes(1);

    controller.dispose();
    vi.useRealTimers();
  });

  it('stops queued travel after an external reposition makes the next step invalid', async () => {
    vi.useFakeTimers();
    let currentCoord: HexCoord = { q: 0, r: 0 };
    const requestMove = vi
      .fn<WorldMoveSource['requestMove']>()
      .mockImplementation(async (request) => ({
        ok: true,
        requestId: request.requestId,
        cooldownMs: 1_000,
      }));

    const controller = createWorldMovementController({
      moveSource: { requestMove },
      now: () => 0,
      getCurrentCoord: () => currentCoord,
      schedule: (callback, delayMs) => setTimeout(callback, delayMs),
      clearScheduled: (timerId) => clearTimeout(timerId),
      applyApprovedStep: () => {
        currentCoord = { q: 1, r: 0 };
        return { combatStarted: false };
      },
      onCooldownChange: vi.fn(),
    });

    controller.replaceQueuedPath([
      { q: 1, r: 0 },
      { q: 2, r: 0 },
    ]);
    await flushMicrotasks();

    currentCoord = { q: 5, r: 5 };
    await vi.advanceTimersByTimeAsync(1_000);

    expect(requestMove).toHaveBeenCalledTimes(1);

    controller.dispose();
    vi.useRealTimers();
  });

  it('uses request send time for cooldown deadlines and does not delay when that cooldown already expired', async () => {
    vi.useFakeTimers();
    let currentCoord: HexCoord = { q: 0, r: 0 };
    let now = 100;
    const firstResponse = createDeferred<WorldMoveResponse>();
    const requestedTargets: HexCoord[] = [];
    const onCooldownChange = vi.fn();
    const requestMove = vi
      .fn<WorldMoveSource['requestMove']>()
      .mockImplementationOnce(async (request) => {
        requestedTargets.push(request.target);
        return firstResponse.promise;
      })
      .mockImplementation(async (request) => {
        requestedTargets.push(request.target);
        return {
          ok: true,
          requestId: request.requestId,
          cooldownMs: 1_000,
        };
      });

    const controller = createWorldMovementController({
      moveSource: { requestMove },
      now: () => now,
      getCurrentCoord: () => currentCoord,
      schedule: (callback, delayMs) => setTimeout(callback, delayMs),
      clearScheduled: (timerId) => clearTimeout(timerId),
      applyApprovedStep: (step) => {
        currentCoord = step;
        return { combatStarted: false };
      },
      onCooldownChange,
    });

    controller.replaceQueuedPath([
      { q: 1, r: 0 },
      { q: 2, r: 0 },
    ]);
    await flushMicrotasks();

    now = 1_300;
    firstResponse.resolve({
      ok: true,
      requestId: 'world-move-1',
      cooldownMs: 1_000,
    });
    await flushMicrotasks();
    await flushMicrotasks();

    expect(requestedTargets).toEqual([
      { q: 1, r: 0 },
      { q: 2, r: 0 },
    ]);
    expect(onCooldownChange).not.toHaveBeenCalledWith(2_300);

    controller.dispose();
    vi.useRealTimers();
  });

  it('recovers after a response whose request id does not match the active request', async () => {
    const appliedSteps: HexCoord[] = [];
    const requestMove = vi
      .fn<WorldMoveSource['requestMove']>()
      .mockImplementationOnce(
        async (request): Promise<WorldMoveResponse> => ({
          ok: true,
          requestId: `${request.requestId}-stale`,
          cooldownMs: 1_000,
        }),
      )
      .mockImplementationOnce(
        async (request): Promise<WorldMoveResponse> => ({
          ok: true,
          requestId: request.requestId,
          cooldownMs: 1_000,
        }),
      );

    const controller = createWorldMovementController({
      moveSource: { requestMove },
      now: () => 0,
      getCurrentCoord: () => ({ q: 0, r: 0 }),
      schedule: (callback, delayMs) => setTimeout(callback, delayMs),
      clearScheduled: (timerId) => clearTimeout(timerId),
      applyApprovedStep: (step) => {
        appliedSteps.push(step);
        return { combatStarted: false };
      },
      onCooldownChange: vi.fn(),
    });

    controller.replaceQueuedPath([{ q: 1, r: 0 }]);
    await flushMicrotasks();
    controller.replaceQueuedPath([{ q: 1, r: -1 }]);
    await flushMicrotasks();

    expect(appliedSteps).toEqual([{ q: 1, r: -1 }]);
    expect(requestMove).toHaveBeenCalledTimes(2);

    controller.dispose();
  });

  it('keeps queued-travel suppression active until the final approved step', async () => {
    vi.useFakeTimers();
    let currentCoord: HexCoord = { q: 0, r: 0 };
    const autoOpenSuppressionStates: string[] = [];
    const requestMove = vi
      .fn<WorldMoveSource['requestMove']>()
      .mockImplementation(async (request) => ({
        ok: true,
        requestId: request.requestId,
        cooldownMs: 1_000,
      }));
    const controller = createWorldMovementController({
      moveSource: {
        requestMove,
      },
      now: () => 0,
      getCurrentCoord: () => currentCoord,
      schedule: (callback, delayMs) => setTimeout(callback, delayMs),
      clearScheduled: (timerId) => clearTimeout(timerId),
      applyApprovedStep: (step) => {
        currentCoord = step;
        return { combatStarted: false };
      },
      onCooldownChange: vi.fn(),
      onAutoOpenSuppressionStateChange: (state) => {
        autoOpenSuppressionStates.push(state);
      },
    });

    controller.replaceQueuedPath([
      { q: 1, r: 0 },
      { q: 2, r: 0 },
    ]);
    await flushMicrotasks();

    expect(autoOpenSuppressionStates).toEqual(['travel']);

    await vi.advanceTimersByTimeAsync(1_000);

    expect(autoOpenSuppressionStates).toEqual(['travel', 'idle']);

    controller.dispose();
    vi.useRealTimers();
  });

  it('clears queued travel and keeps auto-open suppression on combat from a queued step', async () => {
    vi.useFakeTimers();
    let currentCoord: HexCoord = { q: 0, r: 0 };
    const autoOpenSuppressionStates: string[] = [];
    const requestMove = vi
      .fn<WorldMoveSource['requestMove']>()
      .mockImplementation(async (request) => ({
        ok: true,
        requestId: request.requestId,
        cooldownMs: 1_000,
      }));

    const controller = createWorldMovementController({
      moveSource: { requestMove },
      now: () => 0,
      getCurrentCoord: () => currentCoord,
      schedule: (callback, delayMs) => setTimeout(callback, delayMs),
      clearScheduled: (timerId) => clearTimeout(timerId),
      applyApprovedStep: (step) => {
        currentCoord = step;
        return { combatStarted: true };
      },
      onCooldownChange: vi.fn(),
      onAutoOpenSuppressionStateChange: (state) => {
        autoOpenSuppressionStates.push(state);
      },
    });

    controller.replaceQueuedPath([
      { q: 1, r: 0 },
      { q: 2, r: 0 },
    ]);
    await flushMicrotasks();

    expect(currentCoord).toEqual({ q: 1, r: 0 });
    expect(requestMove).toHaveBeenCalledTimes(1);
    expect(autoOpenSuppressionStates).toEqual(['travel', 'combat']);

    await vi.advanceTimersByTimeAsync(1_000);

    expect(requestMove).toHaveBeenCalledTimes(1);
    expect(autoOpenSuppressionStates).toEqual(['travel', 'combat']);

    controller.releaseCombatAutoOpenSuppression();
    expect(autoOpenSuppressionStates).toEqual(['travel', 'combat', 'idle']);

    controller.dispose();
    vi.useRealTimers();
  });
});
