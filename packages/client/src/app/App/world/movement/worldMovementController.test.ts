import type { WorldMoveResponse } from '@realmfall/common';
import { describe, expect, it, vi } from 'vitest';
import type { HexCoord } from '../../../../game/hex';
import { createWorldMovementController } from './worldMovementController';
import type { WorldMoveSource } from './worldMoveSource';

const flushMicrotasks = () => Promise.resolve();

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
      applyApprovedStep: (step) => appliedSteps.push(step),
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

  it('ignores a response whose request id does not match the active request', async () => {
    const appliedSteps: HexCoord[] = [];
    const requestMove = vi
      .fn<WorldMoveSource['requestMove']>()
      .mockImplementation(
        async (request): Promise<WorldMoveResponse> => ({
          ok: true,
          requestId: `${request.requestId}-stale`,
          cooldownMs: 1_000,
        }),
      );

    const controller = createWorldMovementController({
      moveSource: { requestMove },
      now: () => 0,
      getCurrentCoord: () => ({ q: 0, r: 0 }),
      schedule: (callback, delayMs) => setTimeout(callback, delayMs),
      clearScheduled: (timerId) => clearTimeout(timerId),
      applyApprovedStep: (step) => appliedSteps.push(step),
      onCooldownChange: vi.fn(),
    });

    controller.replaceQueuedPath([{ q: 1, r: 0 }]);
    await flushMicrotasks();

    expect(appliedSteps).toEqual([]);
    expect(requestMove).toHaveBeenCalledTimes(1);

    controller.dispose();
  });
});
