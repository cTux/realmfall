import { describe, expect, it } from 'vitest';
import { createLocalWorldMoveSource } from './createLocalWorldMoveSource';

describe('createLocalWorldMoveSource', () => {
  it('approves an immediate move request and echoes the request id', async () => {
    const source = createLocalWorldMoveSource({
      cooldownMs: 1_000,
      now: () => 1_000,
    });

    await expect(
      source.requestMove({
        requestId: 'move-1',
        target: { q: 1, r: 0 },
      }),
    ).resolves.toEqual({
      ok: true,
      requestId: 'move-1',
      cooldownMs: 1_000,
    });
  });

  it('returns the remaining cooldown and echoes the request id when requested too early', async () => {
    let now = 1_000;
    const source = createLocalWorldMoveSource({
      cooldownMs: 1_000,
      now: () => now,
    });

    await source.requestMove({
      requestId: 'move-1',
      target: { q: 1, r: 0 },
    });

    now = 1_250;

    await expect(
      source.requestMove({
        requestId: 'move-2',
        target: { q: 2, r: 0 },
      }),
    ).resolves.toEqual({
      ok: false,
      requestId: 'move-2',
      remainingCooldownMs: 750,
    });
  });
});
