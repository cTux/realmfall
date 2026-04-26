import { describe, expect, it, vi } from 'vitest';
import { attachPixiWorldTickerVisibilityPause } from './pixiWorldTickerVisibility';

function createVisibilityTarget(visibilityState: DocumentVisibilityState) {
  const target = new EventTarget() as EventTarget & {
    visibilityState: DocumentVisibilityState;
  };

  Object.defineProperty(target, 'visibilityState', {
    configurable: true,
    get: () => visibilityState,
  });

  return {
    dispatchVisibilityChange: (
      nextVisibilityState: DocumentVisibilityState,
    ) => {
      visibilityState = nextVisibilityState;
      target.dispatchEvent(new Event('visibilitychange'));
    },
    target,
  };
}

describe('pixiWorldTickerVisibility', () => {
  it('stops the Pixi ticker while the document is hidden', () => {
    const { dispatchVisibilityChange, target } =
      createVisibilityTarget('visible');
    const ticker = {
      start: vi.fn(),
      stop: vi.fn(),
    };

    const detach = attachPixiWorldTickerVisibilityPause({
      ticker,
      renderFrame: vi.fn(),
      renderInvalidationRef: { current: 0 },
      target,
    });

    dispatchVisibilityChange('hidden');

    expect(ticker.stop).toHaveBeenCalledTimes(1);
    expect(ticker.start).not.toHaveBeenCalled();

    detach();
  });

  it('invalidates and draws once when the document becomes visible again', () => {
    const { dispatchVisibilityChange, target } =
      createVisibilityTarget('hidden');
    const ticker = {
      start: vi.fn(),
      stop: vi.fn(),
    };
    const renderFrame = vi.fn();
    const renderInvalidationRef = { current: 2 };

    const detach = attachPixiWorldTickerVisibilityPause({
      ticker,
      renderFrame,
      renderInvalidationRef,
      target,
    });

    expect(ticker.stop).toHaveBeenCalledTimes(1);

    dispatchVisibilityChange('visible');

    expect(renderInvalidationRef.current).toBe(3);
    expect(ticker.start).toHaveBeenCalledTimes(1);
    expect(renderFrame).toHaveBeenCalledTimes(1);

    detach();
  });

  it('detaches the visibility listener on cleanup', () => {
    const { dispatchVisibilityChange, target } =
      createVisibilityTarget('visible');
    const ticker = {
      start: vi.fn(),
      stop: vi.fn(),
    };

    const detach = attachPixiWorldTickerVisibilityPause({
      ticker,
      renderFrame: vi.fn(),
      renderInvalidationRef: { current: 0 },
      target,
    });
    detach();

    dispatchVisibilityChange('hidden');

    expect(ticker.stop).not.toHaveBeenCalled();
  });
});
