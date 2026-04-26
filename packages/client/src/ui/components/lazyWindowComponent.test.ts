import type { ComponentType } from 'react';
import { loadRetryingWindowModule } from './lazyWindowComponent';

describe('loadRetryingWindowModule', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps retrying until the window module loads', async () => {
    const module = {
      default: (() => null) as ComponentType,
    };
    const loader = vi
      .fn<() => Promise<typeof module>>()
      .mockRejectedValueOnce(new Error('chunk missing'))
      .mockRejectedValueOnce(new Error('still missing'))
      .mockResolvedValue(module);

    const promise = loadRetryingWindowModule(loader, 25);

    await Promise.resolve();
    expect(loader).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(25);
    expect(loader).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(25);
    await expect(promise).resolves.toBe(module);
    expect(loader).toHaveBeenCalledTimes(3);
  });
});
